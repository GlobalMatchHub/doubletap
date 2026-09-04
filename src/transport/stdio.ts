import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process";
import type { SendFault, Transport } from "./types.ts";

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
      this.#onClose?.({ code, signal });
    });

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
      proc.kill("SIGKILL");
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
    proc.stdin.end();
    const exited = new Promise<void>((r) => proc.once("exit", () => r()));
    const timer = setTimeout(() => proc.kill("SIGKILL"), 1500);
    await exited;
    clearTimeout(timer);
    this.#alive = false;
  }
}
