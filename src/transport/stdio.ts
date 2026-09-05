import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process";
import type { SendFault, Transport } from "./types.ts";
import { trackKiller } from "../run/lifecycle.ts";

/** One JSON-RPC frame should never approach this. Beyond it, the sender is
 *  not framing at all and the bytes are dropped rather than accumulated. */
const MAX_LINE_BYTES = 16 * 1024 * 1024;

export interface StdioOptions {
  cmd: string[];
  cwd?: string;
  env?: Record<string, string>;
  /** Bytes of stderr to retain. Servers that crash say why here. */
  stderrLimit?: number;
}

/**
 * MCP stdio transport, written from scratch rather than taken from the SDK.
 *
 * Doubletap has to put frames on the wire that no conforming client would
 * send -- half a frame, a frame with a wrong type where the schema demands a
 * string, two frames with the same id -- and any correct SDK refuses to do
 * that. Owning the framing is the whole point.
 */
export class StdioTransport implements Transport {
  readonly kind = "stdio" as const;
  #proc: ChildProcessWithoutNullStreams | null = null;
  #buf = "";
  #stderr = "";
  #onMsg: ((msg: unknown, raw: string) => void) | null = null;
  #onClose: ((i: { code: number | null; signal: string | null }) => void) | null = null;
  #alive = false;
  #untrack: (() => void) | null = null;
  #opts: StdioOptions;

  constructor(opts: StdioOptions) {
    this.#opts = opts;
  }

  get alive(): boolean {
    return this.#alive;
  }

  async start(): Promise<void> {
    const [bin, ...args] = this.#opts.cmd;
    if (!bin) throw new Error("stdio target has an empty command");
    const proc = spawn(bin, args, {
      cwd: this.#opts.cwd,
      // A minimal environment keeps the target from reading the developer's
      // shell state, which would make runs differ between machines.
      env: {
        PATH: process.env.PATH ?? "",
        HOME: this.#opts.cwd ?? process.env.HOME ?? "",
        NODE_ENV: "production",
        ...this.#opts.env,
      },
      stdio: ["pipe", "pipe", "pipe"],
      // Its own process group, so anything it spawns can be killed with it.
      // The confinement profile permits fork and permits executing node, so a
      // server can leave children behind, and signalling one pid left them
      // reparented to init for the rest of the run.
      detached: true,
    }) as ChildProcessWithoutNullStreams;
    this.#proc = proc;
    this.#alive = true;

    proc.stdout.setEncoding("utf8");
    proc.stdout.on("data", (chunk: string) => this.#ingest(chunk));
    proc.stderr.setEncoding("utf8");
    proc.stderr.on("data", (chunk: string) => {
      this.#stderr = (this.#stderr + chunk).slice(-(this.#opts.stderrLimit ?? 16384));
    });
    // A dead stdin after a cut makes writes throw EPIPE; that is expected.
    proc.stdin.on("error", () => {});
    proc.on("exit", (code, signal) => {
      this.#alive = false;
      this.#untrack?.();
      this.#onClose?.({ code, signal });
    });

    // So a signal or a crash on the way out takes the server with it.
    this.#untrack = trackKiller(() => killGroup(proc.pid));

    await new Promise<void>((resolve, reject) => {
      const ok = () => {
        proc.off("error", fail);
        resolve();
      };
      const fail = (e: Error) => {
        this.#alive = false;
        reject(e);
      };
      proc.once("spawn", ok);
      proc.once("error", fail);
    });
  }

  /** Newline-delimited JSON, per the MCP stdio transport. */
  #ingest(chunk: string): void {
    this.#buf += chunk;
    // stderr has always been capped; stdout was not. A server that writes
    // hundreds of megabytes with no newline, deliberately or by dumping a
    // binary, grew this string until the harness died rather than the server.
    if (this.#buf.length > MAX_LINE_BYTES) {
      this.#onMsg?.({ __overlong: true, bytes: this.#buf.length }, `<${this.#buf.length} bytes with no newline, discarded>`);
      this.#buf = "";
      return;
    }
    let nl: number;
    while ((nl = this.#buf.indexOf("\n")) !== -1) {
      const line = this.#buf.slice(0, nl);
      this.#buf = this.#buf.slice(nl + 1);
      const trimmed = line.trim();
      if (!trimmed) continue;
      let parsed: unknown;
      try {
        parsed = JSON.parse(trimmed);
      } catch {
        // Non-JSON on stdout is itself a protocol violation; hand it up raw.
        parsed = { __unparseable: true, raw: trimmed };
      }
      this.#onMsg?.(parsed, trimmed);
    }
  }

  async sendRaw(msg: unknown, fault?: SendFault): Promise<{ wrote: number; of: number; wire: string }> {
    const proc = this.#proc;
    if (!proc) throw new Error("transport not started");
    const wire = JSON.stringify(msg) + "\n";
    const full = Buffer.from(wire, "utf8");
    const of = full.byteLength;

    if (fault?.delayMs) await new Promise((r) => setTimeout(r, fault.delayMs));

    const cut = fault?.cutAfterBytes;
    const slice = cut === undefined ? full : full.subarray(0, Math.max(0, Math.min(cut, of)));

    await new Promise<void>((resolve) => {
      if (!proc.stdin.writable) return resolve();
      proc.stdin.write(slice, () => resolve());
    });

    if (fault?.closeAfter) proc.stdin.end();
    if (fault?.killAfter) {
      const after = fault.killAfterMs ?? 0;
      if (after > 0) await new Promise((r) => setTimeout(r, after));
      killGroup(proc.pid);
    }

    return { wrote: slice.byteLength, of, wire };
  }

  onMessage(handler: (msg: unknown, raw: string) => void): void {
    this.#onMsg = handler;
  }
  onClose(handler: (i: { code: number | null; signal: string | null }) => void): void {
    this.#onClose = handler;
  }
  stderr(): string {
    return this.#stderr;
  }

  async close(): Promise<void> {
    const proc = this.#proc;
    if (!proc || !this.#alive) return;
    this.#untrack?.();
    proc.stdin.end();

    const exited = new Promise<void>((r) => proc.once("exit", () => r()));
    const timer = setTimeout(() => killGroup(proc.pid), 1500);
    // Bounded. Awaiting the exit alone could never settle for a child stuck in
    // uninterruptible I/O, and an await that cannot settle takes the whole run
    // with it.
    await Promise.race([exited, new Promise<void>((r) => setTimeout(r, 5000))]);
    clearTimeout(timer);
    killGroup(proc.pid);
    this.#alive = false;
  }
}

/**
 * Kills a server and everything it started.
 *
 * A negative pid signals the whole process group, which is why the child is
 * spawned detached. Failures are ignored on purpose: by the time this runs the
 * group is usually already gone, and that is the outcome it wanted.
 */
function killGroup(pid: number | undefined): void {
  if (pid === undefined) return;
  try {
    process.kill(-pid, "SIGKILL");
  } catch {
    try {
      process.kill(pid, "SIGKILL");
    } catch {}
  }
}
