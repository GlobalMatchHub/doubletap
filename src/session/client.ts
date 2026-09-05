import type { Transport, SendFault } from "../transport/types.ts";
import type { TraceWriter } from "../trace/writer.ts";
import type { VirtualClock } from "../det/clock.ts";

export interface ToolDef {
  name: string;
  title?: string;
  description?: string;
  inputSchema?: Record<string, unknown>;
  outputSchema?: Record<string, unknown>;
  annotations?: {
    title?: string;
    readOnlyHint?: boolean;
    destructiveHint?: boolean;
    idempotentHint?: boolean;
    openWorldHint?: boolean;
  };
}

export interface CallOutcome {
  /** Whether a response frame came back at all. */
  answered: boolean;
  result?: unknown;
  error?: { code: number; message: string; data?: unknown };
  /** True when the request frame did not cross the wire whole. */
  cut?: { wrote: number; of: number };
  /** True when the server died before answering. */
  serverDied?: boolean;
  timedOut?: boolean;
  requestId: number;
}

export const PROTOCOL_VERSION = "2025-06-18";

/**
 * A deliberately thin MCP client. It speaks just enough of the protocol to
 * drive tools, and it never repairs or hides a malformed response, because
 * malformed responses are findings.
 */
export class McpSession {
  #transport: Transport;
  #trace: TraceWriter;
  #clock: VirtualClock;
  #nextId = 1;
  #pending = new Map<number | string, (msg: JsonRpcIn) => void>();
  #closed = false;
  #closeInfo: { code: number | null; signal: string | null } | null = null;
  /** Beyond this, a chatty server is dropping its oldest held frames. */
  static readonly MAX_HELD = 2000;

  /** Frames that arrived with no matching pending request. */
  readonly unsolicited: unknown[] = [];
  #quarantine: { msg: unknown; raw: string }[] = [];
  #timers = new Map<number | string, ReturnType<typeof setTimeout>>();
  serverInfo: unknown = null;
  capabilities: Record<string, unknown> = {};

  constructor(transport: Transport, trace: TraceWriter, clock: VirtualClock) {
    this.#transport = transport;
    this.#trace = trace;
    this.#clock = clock;
  }

  get alive(): boolean {
    return this.#transport.alive && !this.#closed;
  }
  get closeInfo() {
    return this.#closeInfo;
  }
  get stderr(): string {
    return this.#transport.stderr();
  }

  async start(): Promise<void> {
    this.#transport.onMessage((msg, raw) => {
      const id = (msg as { id?: number | string }).id;
      const method = (msg as { method?: string }).method;
      const isAnswer = id !== undefined && method === undefined && this.#pending.has(id);

      if (isAnswer) {
        // An answer we are awaiting arrives at a point we control, so it is
        // recorded where it lands.
        this.#recordIn(msg, raw);
        const resolve = this.#pending.get(id)!;
        this.#pending.delete(id);
        const timer = this.#timers.get(id);
        if (timer !== undefined) {
          clearTimeout(timer);
          this.#timers.delete(id);
        }
        resolve(msg as JsonRpcIn);
        return;
      }

      // Anything else -- a server-initiated request, a notification, a late
      // duplicate -- arrives whenever the OS felt like scheduling it. Writing
      // it straight through would put it at a different line on every run, so
      // it is held and flushed at the next point we act. The frame is not
      // lost, only attributed to a deterministic position.
      this.#quarantine.push({ msg, raw });
      // Bounded. A server emitting progress notifications in a loop grew both
      // of these for the lifetime of the case, and every held frame is also
      // written to the trace when it drains.
      if (this.#quarantine.length > McpSession.MAX_HELD) this.#quarantine.shift();
      this.unsolicited.push(msg);
      if (this.unsolicited.length > McpSession.MAX_HELD) this.unsolicited.shift();
    });
    this.#transport.onClose((info) => {
      this.#closed = true;
      this.#closeInfo = info;
      // Anything still waiting will never be answered.
      for (const [id, resolve] of this.#pending) {
        this.#pending.delete(id);
        const t = this.#timers.get(id);
        if (t !== undefined) {
          clearTimeout(t);
          this.#timers.delete(id);
        }
        resolve({ __serverDied: true, id } as unknown as JsonRpcIn);
      }
    });
    await this.#transport.start();
  }

  #recordIn(msg: unknown, raw: string): void {
    this.#trace.write({
      k: "f",
      dir: "in",
      bytes: Buffer.byteLength(raw, "utf8"),
      sha: "",
      wire: raw,
      msg,
    });
  }

  /**
   * Writes held inbound frames and answers any server-initiated requests among
   * them, in arrival order, at a point this client chooses rather than at
   * whatever moment the OS scheduled the read.
   */
  async #drain(): Promise<void> {
    const held = this.#quarantine;
    if (held.length === 0) return;
    this.#quarantine = [];
    for (const q of held) {
      this.#recordIn(q.msg, q.raw);
      await this.#answerServerRequest(q.msg);
    }
  }

  /**
   * Waits a bounded stretch of real time for the server to finish whatever it
   * initiates on its own, then drains.
   *
   * This is the one place Doubletap depends on wall time, and it is deliberate.
   * Servers send roots/list the instant they are initialised; without a barrier
   * that frame lands on a different trace line every run. The barrier is the
   * honest fix, and `doubletap verify` is what proves it holds.
   */
  async quiesce(ms = 150): Promise<void> {
    await new Promise((r) => setTimeout(r, ms));
    await this.#drain();
  }

  async #answerServerRequest(msg: unknown): Promise<void> {
    const m = msg as { id?: number | string; method?: string };
    if (m.id === undefined || m.method === undefined) return;
    const reply = m.method === "roots/list" ? { roots: [] } : m.method === "ping" ? {} : null;
    const body =
      reply === null
        ? { jsonrpc: "2.0", id: m.id, error: { code: -32601, message: `doubletap does not implement ${m.method}` } }
        : { jsonrpc: "2.0", id: m.id, result: reply };
    try {
      const sent = await this.#transport.sendRaw(body);
      this.#trace.write({ k: "f", dir: "out", bytes: sent.of, sha: "", wire: sent.wire, msg: body });
    } catch {
      // The server is gone; nothing to answer.
    }
  }

  async notify(method: string, params?: unknown): Promise<void> {
    await this.#drain();
    const msg = { jsonrpc: "2.0", method, ...(params === undefined ? {} : { params }) };
    const { wrote, of, wire } = await this.#transport.sendRaw(msg);
    this.#trace.write({
      k: "f",
      dir: "out",
      bytes: of,
      sha: "",
      wire,
      msg,
      ...(wrote < of ? { partial: { wrote, of } } : {}),
    });
  }

  /**
   * Sends a request and waits. `fault` lets the caller damage the frame on the
   * way out; when the frame is cut the response will normally never arrive,
   * and that is the point.
   */
  async request(
    method: string,
    params: unknown,
    opts: { timeoutMs?: number; fault?: SendFault; rawOverride?: unknown } = {},
  ): Promise<CallOutcome> {
    await this.#drain();
    const id = this.#nextId++;
    const msg = opts.rawOverride ?? { jsonrpc: "2.0", id, method, params };
    const waiter = new Promise<JsonRpcIn | null>((resolve) => {
      this.#pending.set(id, resolve);
      const ms = opts.timeoutMs ?? 10_000;
      // Deliberately not unref'd. If the server goes quiet and nothing else is
      // pending, an unref'd timer lets the event loop drain and the await never
      // settles, which takes the whole run down with exit code 13.
      setTimeout(() => {
        if (this.#pending.has(id)) {
          this.#pending.delete(id);
          resolve(null);
        }
      }, ms);
    });

    let wrote = 0;
    let of = 0;
    try {
      const sent = await this.#transport.sendRaw(msg, opts.fault);
      wrote = sent.wrote;
      of = sent.of;
      this.#trace.write({
        k: "f",
        dir: "out",
        bytes: of,
        sha: "",
        wire: sent.wire,
        msg,
        ...(wrote < of ? { partial: { wrote, of } } : {}),
      });
      if (opts.fault) {
        const target = (params as { name?: string } | undefined)?.name;
        this.#trace.write({
          k: "fault",
          ...(method === "tools/call" && target ? { tool: target } : {}),
          kind: opts.fault.killAfter ? "kill" : wrote < of ? "cut" : "delay",
          ofSeq: this.#trace.nextSeq() - 1,
          at: { dir: "out", byteOffset: wrote },
          note: describeFault(opts.fault, wrote, of),
        });
      }
    } catch (e) {
      this.#pending.delete(id);
      return { answered: false, requestId: id, serverDied: true, error: { code: -1, message: String(e) } };
    }

    const reply = await waiter;
    const cut = wrote < of ? { wrote, of } : undefined;
    if (reply === null) return { answered: false, timedOut: true, requestId: id, ...(cut ? { cut } : {}) };
    if ((reply as { __serverDied?: boolean }).__serverDied)
      return { answered: false, serverDied: true, requestId: id, ...(cut ? { cut } : {}) };
    const r = reply as { result?: unknown; error?: { code: number; message: string; data?: unknown } };
    return {
      answered: true,
      requestId: id,
      ...(r.error ? { error: r.error } : {}),
      ...(r.result !== undefined ? { result: r.result } : {}),
      ...(cut ? { cut } : {}),
    };
  }

  async initialize(timeoutMs = 15_000): Promise<CallOutcome> {
    const out = await this.request(
      "initialize",
      {
        protocolVersion: PROTOCOL_VERSION,
        capabilities: { roots: { listChanged: false } },
        clientInfo: { name: "doubletap", version: "0.1.0" },
      },
      { timeoutMs },
    );
    if (out.answered && out.result && typeof out.result === "object") {
      const r = out.result as Record<string, unknown>;
      this.serverInfo = r.serverInfo ?? null;
      this.capabilities = (r.capabilities as Record<string, unknown>) ?? {};
      await this.notify("notifications/initialized");
      await this.quiesce();
    }
    return out;
  }

  async listTools(timeoutMs = 15_000): Promise<ToolDef[]> {
    const tools: ToolDef[] = [];
    let cursor: string | undefined;
    for (let page = 0; page < 20; page++) {
      const out = await this.request("tools/list", cursor ? { cursor } : {}, { timeoutMs });
      if (!out.answered || !out.result) break;
      const r = out.result as { tools?: ToolDef[]; nextCursor?: string };
      if (Array.isArray(r.tools)) tools.push(...r.tools);
      if (!r.nextCursor) break;
      cursor = r.nextCursor;
    }
    return tools;
  }

  async callTool(
    name: string,
    args: unknown,
    opts: { timeoutMs?: number; fault?: SendFault } = {},
  ): Promise<CallOutcome> {
    return this.request("tools/call", { name, arguments: args }, opts);
  }

  async close(): Promise<void> {
    await this.#transport.close();
  }
}

type JsonRpcIn = { id?: number | string; result?: unknown; error?: unknown };

function describeFault(f: SendFault, wrote: number, of: number): string {
  const parts: string[] = [];
  if (wrote < of) parts.push(`request frame cut after ${wrote} of ${of} bytes`);
  if (f.closeAfter) parts.push("stdin closed");
  if (f.killAfter) parts.push(`server SIGKILLed ${f.killAfterMs ?? 0}ms after delivery`);
  if (f.delayMs) parts.push(`delayed ${f.delayMs}ms`);
  return parts.join("; ") || "no-op fault";
}
