import { createWriteStream, mkdirSync, type WriteStream } from "node:fs";
import { dirname } from "node:path";
import { createHash } from "node:crypto";
import type { HeaderRecord, TraceRecord } from "./types.ts";

/** A record as handed to the writer: seq and t are filled in for you. */
type Draft<T> = T extends HeaderRecord ? never : Omit<T, "seq" | "t"> & { seq?: number; t?: number };
export type TraceDraft = Draft<TraceRecord>;
import type { VirtualClock } from "../det/clock.ts";

export function sha256(data: string | Uint8Array): string {
  return "sha256:" + createHash("sha256").update(data).digest("hex").slice(0, 32);
}

/** Stable JSON: object keys sorted, so digests do not depend on insertion order. */
export function canonical(value: unknown): string {
  return JSON.stringify(sortKeys(value));
}

function sortKeys(v: unknown): unknown {
  if (Array.isArray(v)) return v.map(sortKeys);
  if (v && typeof v === "object") {
    const src = v as Record<string, unknown>;
    const out: Record<string, unknown> = {};
    for (const key of Object.keys(src).sort()) out[key] = sortKeys(src[key]);
    return out;
  }
  return v;
}

/** Enough that any sandbox still capable of appearing in a record is covered,
 *  small enough that scanning every line against all of them stays cheap. */
const MAX_REDACTIONS = 64;

export class TraceWriter {
  #stream: WriteStream | null;
  #seq = 0;
  readonly path: string;
  #clock: VirtualClock;
  #redactions: [string, string][] = [];

  /**
   * A writer that keeps nothing.
   *
   * Discovery, screening, the self test and the audit all need a writer
   * because openCase takes one, and none of them ever read the result. Written
   * to disk under fixed names they accumulated one file per invocation
   * forever: a census left 40MB under doubletap-probe and 29MB under
   * doubletap-screen, none of it ever opened again.
   */
  static discarding(clock: VirtualClock): TraceWriter {
    return new TraceWriter(null, clock);
  }

  constructor(path: string | null, clock: VirtualClock) {
    this.path = path ?? "<discarded>";
    this.#clock = clock;
    if (path === null) {
      this.#stream = null;
      return;
    }
    mkdirSync(dirname(path), { recursive: true });
    this.#stream = createWriteStream(path, { flags: "w" });
  }

  /**
   * Registers a literal string to be rewritten on the way into the trace.
   *
   * Sandbox roots are freshly named per case, so leaving them in would make
   * two runs of the same seed differ everywhere and would leak the developer's
   * temp directory into a published trace.
   */
  /**
   * Registers a literal string to be rewritten on the way into the trace.
   *
   * Every case registers its own sandbox path, one writer serves a whole
   * target, and a target runs on the order of a thousand cases. Left to
   * accumulate, each written line was scanned once per case that had ever
   * existed, and snapshot records are routinely over 100KB, so the last tools
   * of a target cost far more wall clock than the first.
   *
   * Dropping a case's entry when its sandbox is disposed seemed obvious and
   * was wrong: a probe disposes its cases in a finally, and the verdict it
   * returns is written by the runner afterwards, so the evidence went into the
   * trace with the sandbox path unmasked. That is a leak of the developer's
   * paths and it broke the determinism check, since those paths differ per
   * run.
   *
   * So entries stay, and the list is bounded instead. The most recent few are
   * the only ones that can still appear, because a disposed sandbox is gone.
   */
  redact(from: string, to: string): void {
    if (!from) return;
    this.#redactions.push([from, to]);
    if (this.#redactions.length > MAX_REDACTIONS) this.#redactions.splice(0, this.#redactions.length - MAX_REDACTIONS);
    // Longest first, so a root is replaced before any path built on top of it.
    this.#redactions.sort((a, b) => b[0].length - a[0].length);
  }

  #apply(line: string): string {
    let out = line;
    for (const [from, to] of this.#redactions) out = out.split(from).join(to);
    return out;
  }

  nextSeq(): number {
    return this.#seq++;
  }

  writeHeader(hdr: HeaderRecord): void {
    this.#stream?.write(this.#apply(canonical(hdr)) + "\n");
  }

  /** Writes a record, filling in seq and virtual time when absent. */
  write(rec: TraceDraft): TraceRecord {
    const full = {
      ...rec,
      seq: rec.seq ?? this.nextSeq(),
      t: rec.t ?? this.#clock.tick(),
    } as TraceRecord;
    // A frame's hash has to be taken over the redacted form. Hashing the raw
    // wire would fold the sandbox's random directory name into every digest
    // and no two runs of the same seed would ever compare equal.
    if (full.k === "f") {
      const wire = (full as unknown as { wire?: string }).wire;
      if (wire !== undefined) {
        (full as { sha: string }).sha = sha256(this.#apply(wire));
        delete (full as unknown as { wire?: string }).wire;
      }
    }
    this.#stream?.write(this.#apply(canonical(full)) + "\n");
    return full;
  }

  async close(): Promise<void> {
    const stream = this.#stream;
    if (!stream) return;
    await new Promise<void>((resolve) => stream.end(resolve));
  }
}
