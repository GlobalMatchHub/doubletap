import { existsSync, readFileSync } from "node:fs";

/** One outbound request the server attempted, as the interceptor saw it. */
export interface NetEntry {
  seq: number;
  via: "fetch" | "http";
  method: string;
  url: string;
  headers: Record<string, string>;
  body: string;
  fingerprint: string;
  answered: "cassette" | "synth";
  status: number;
}

export function readNetLog(path: string): NetEntry[] {
  if (!existsSync(path)) return [];
  const out: NetEntry[] = [];
  for (const line of readFileSync(path, "utf8").split("\n")) {
    if (!line.trim()) continue;
    try {
      out.push(JSON.parse(line) as NetEntry);
    } catch {
      // A half-written last line is normal while the server is still running.
    }
  }
  return out;
}

const WRITE_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

/** Requests that change something on the other end. */
export function isWrite(e: NetEntry): boolean {
  return WRITE_METHODS.has(e.method.toUpperCase());
}

/**
 * PUT and DELETE are idempotent by definition in HTTP, so repeating one leaves
 * the same end state whether it arrives once or five times. POST and PATCH
 * carry no such promise, and those are the ones a retry can double.
 *
 * Flagging a repeated DELETE would bury the real findings under a pile of
 * correct behaviour.
 */
export function repeatIsUnsafe(e: NetEntry): boolean {
  const m = e.method.toUpperCase();
  return m === "POST" || m === "PATCH";
}

/**
 * Header names the industry uses to make a retried write safe.
 *
 * Stripe settled on Idempotency-Key, AWS on client tokens, everyone else picked
 * a spelling. A server that sends any of them, with the same value on both
 * attempts, has done the thing that makes a duplicate harmless.
 */
const IDEMPOTENCY_HEADERS = [
  "idempotency-key",
  "x-idempotency-key",
  "idempotency_key",
  "x-client-token",
  "client-token",
];

/**
 * Headers that identify a request without deduplicating it.
 *
 * These used to be counted as idempotency keys, which meant a server that
 * re-sent a charge with a stable x-request-id was passed as safe. No API
 * deduplicates on a tracing header. Crediting one is worse than finding
 * nothing, because it grades a genuine double-charge clean.
 */
const TRACING_HEADERS = ["x-request-id", "x-correlation-id", "x-transaction-id", "traceparent"];

export function tracingHeaderOf(e: NetEntry): { header: string; value: string } | null {
  for (const h of TRACING_HEADERS) {
    const v = e.headers[h];
    if (typeof v === "string" && v.length > 0) return { header: h, value: v };
  }
  return null;
}

export function idempotencyKeyOf(e: NetEntry): { header: string; value: string } | null {
  for (const h of IDEMPOTENCY_HEADERS) {
    const v = e.headers[h];
    if (typeof v === "string" && v.length > 0) return { header: h, value: v };
  }
  return null;
}

/** A short, readable description of one request, for a claim. */
export function describe(e: NetEntry): string {
  try {
    const u = new URL(e.url);
    return `${e.method} ${u.host}${u.pathname}`;
  } catch {
    return `${e.method} ${e.url}`;
  }
}
