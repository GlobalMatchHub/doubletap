/**
 * Loaded into the target server with --import, before any of its own code runs.
 *
 * The 43 servers that could not be exercised offline are not stateless: their
 * side effect is the outbound request. A tool that charges a card, files a
 * ticket or writes a row does it over HTTP, and whether a retry does it twice
 * is visible right here, at the socket the server never gets to open.
 *
 * Nothing leaves the machine. Every request is answered from a cassette when
 * one matches and from a canned response otherwise, so a server can be driven
 * through its whole flow with no credentials and no live service. What the
 * harness reads back is the ordered log of what the server tried to send.
 *
 * Plain JavaScript on purpose: this file is injected into someone else's
 * process and must not depend on a loader, a transpiler or anything on their
 * side of the fence.
 */
import { appendFileSync, readFileSync, existsSync } from "node:fs";
import { Readable, Writable } from "node:stream";
import http from "node:http";
import https from "node:https";
import { createHash } from "node:crypto";

const LOG = process.env.DOUBLETAP_NET_LOG;
const MODE = process.env.DOUBLETAP_NET_MODE || "synth";
const CASSETTE = process.env.DOUBLETAP_NET_CASSETTE;

if (LOG) {
  const cassette = loadCassette();
  // The log survives a restart, and so must the numbering: the harness kills
  // and reconnects servers on purpose, and two requests sharing an ordinal
  // would make the second one invisible to the diff.
  let seq = countExistingLines(LOG);

  const record = (entry) => {
    seq++;
    const line = { seq, ...entry };
    try {
      appendFileSync(LOG, JSON.stringify(line) + "\n");
    } catch {
      // A logging failure must never change what the server under test does.
    }
    return line;
  };

  /** What makes two outbound requests "the same" for cassette lookup. */
  const fingerprint = (method, url, body) => {
    const u = safeUrl(url);
    const canonical = `${method.toUpperCase()} ${u.origin}${u.pathname} ${sortQuery(u)} ${hash(body ?? "")}`;
    return hash(canonical);
  };

  const answer = (fp) => {
    const hit = cassette.get(fp);
    if (hit) return { status: hit.status, headers: hit.headers ?? {}, body: hit.body ?? "", from: "cassette" };
    // A synthetic answer that most clients accept: a 200 with an empty JSON
    // object. Servers that demand a specific shape will fail, and that failure
    // is reported rather than papered over.
    return { status: 200, headers: { "content-type": "application/json" }, body: "{}", from: "synth" };
  };

  // ---- fetch ------------------------------------------------------------
  const realFetch = globalThis.fetch;
  globalThis.fetch = async function doubletapFetch(input, init = {}) {
    const url = typeof input === "string" ? input : input?.url ?? String(input);
    const method = (init.method ?? (typeof input === "object" ? input?.method : null) ?? "GET").toUpperCase();
    let body = "";
    try {
      body = typeof init.body === "string" ? init.body : init.body ? String(init.body) : "";
    } catch {}
    const headers = headerObject(init.headers ?? (typeof input === "object" ? input?.headers : null));
    const fp = fingerprint(method, url, body);
    const res = answer(fp);
    record({ via: "fetch", method, url, headers, body: clip(body), fingerprint: fp, answered: res.from, status: res.status });
    return new Response(res.body, { status: res.status, headers: res.headers });
  };
  // Deliberately not stashing the original fetch on globalThis. Handing the
  // code under test a documented way to undo the interception buys nothing and
  // removes a step from anyone trying to.
  void realFetch;

  // ---- http.request / https.request -------------------------------------
  for (const mod of [http, https]) {
    const scheme = mod === https ? "https:" : "http:";
    const realRequest = mod.request.bind(mod);
    mod.request = function doubletapRequest(...args) {
      const { options, callback } = normalise(args, scheme);
      return fakeRequest(options, callback, record, fingerprint, answer);
    };
    mod.get = function doubletapGet(...args) {
      const req = mod.request(...args);
      req.end();
      return req;
    };
    // Same reasoning as above: no handle back to the real implementation.
    void realRequest;
  }
}

function fakeRequest(options, callback, record, fingerprint, answer) {
  const chunks = [];
  const req = new Writable({
    write(chunk, _enc, cb) {
      chunks.push(Buffer.from(chunk));
      cb();
    },
  });

  req.setHeader = function (k, v) {
    options.headers[String(k).toLowerCase()] = v;
    return req;
  };
  req.getHeader = (k) => options.headers[String(k).toLowerCase()];
  req.removeHeader = (k) => {
    delete options.headers[String(k).toLowerCase()];
  };
  req.setTimeout = () => req;
  req.abort = () => {};
  req.destroy = () => {};
  req.flushHeaders = () => {};

  if (callback) req.once("response", callback);

  req.on("finish", () => {
    const body = Buffer.concat(chunks).toString("utf8");
    const url = `${options.protocol}//${options.host}${options.path}`;
    const fp = fingerprint(options.method, url, body);
    const res = answer(fp);
    record({
      via: "http",
      method: options.method,
      url,
      headers: options.headers,
      body: clip(body),
      fingerprint: fp,
      answered: res.from,
      status: res.status,
    });

    const incoming = Readable.from([Buffer.from(res.body)]);
    incoming.statusCode = res.status;
    incoming.statusMessage = "OK";
    incoming.headers = res.headers;
    incoming.rawHeaders = Object.entries(res.headers).flat();
    incoming.complete = true;
    incoming.setEncoding = function (enc) {
      Readable.prototype.setEncoding.call(this, enc);
      return this;
    };
    // Deferred so a caller that attaches listeners after request() still sees it.
    setImmediate(() => req.emit("response", incoming));
  });

  return req;
}

function normalise(args, scheme) {
  let options = {};
  let callback;
  for (const a of args) {
    if (typeof a === "function") callback = a;
    else if (typeof a === "string" || a instanceof URL) {
      const u = safeUrl(String(a));
      options = { ...options, protocol: u.protocol, host: u.host, path: u.pathname + u.search };
    } else if (a && typeof a === "object") {
      options = { ...options, ...a };
    }
  }
  options.protocol = options.protocol ?? scheme;
  options.host = options.host ?? options.hostname ?? "localhost";
  options.path = options.path ?? "/";
  options.method = (options.method ?? "GET").toUpperCase();
  options.headers = lowerKeys(options.headers ?? {});
  return { options, callback };
}

function countExistingLines(path) {
  try {
    if (!existsSync(path)) return 0;
    return readFileSync(path, "utf8").split("\n").filter((l) => l.trim()).length;
  } catch {
    return 0;
  }
}

function loadCassette() {
  const map = new Map();
  if (!CASSETTE || !existsSync(CASSETTE)) return map;
  try {
    for (const line of readFileSync(CASSETTE, "utf8").split("\n")) {
      if (!line.trim()) continue;
      const e = JSON.parse(line);
      if (e.fingerprint) map.set(e.fingerprint, e);
    }
  } catch {}
  return map;
}

function headerObject(h) {
  if (!h) return {};
  if (typeof h.entries === "function") return lowerKeys(Object.fromEntries(h.entries()));
  if (Array.isArray(h)) return lowerKeys(Object.fromEntries(h));
  return lowerKeys(h);
}

function lowerKeys(o) {
  const out = {};
  for (const [k, v] of Object.entries(o ?? {})) out[String(k).toLowerCase()] = v;
  return out;
}

function safeUrl(u) {
  try {
    return new URL(String(u));
  } catch {
    return new URL("http://invalid.doubletap" + String(u));
  }
}

function sortQuery(u) {
  const p = [...u.searchParams.entries()].sort(([a], [b]) => a.localeCompare(b));
  return p.map(([k, v]) => `${k}=${v}`).join("&");
}

function hash(s) {
  return createHash("sha256").update(String(s)).digest("hex").slice(0, 16);
}

function clip(s) {
  return typeof s === "string" && s.length > 4000 ? s.slice(0, 4000) + "...[clipped]" : s;
}

export const MODE_IN_USE = MODE;
