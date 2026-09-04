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

export class TraceWriter {
  #stream: WriteStream;
  #seq = 0;
  readonly path: string;
  readonly records: TraceRecord[] = [];
  #clock: VirtualClock;
  #redactions: [string, string][] = [];

  constructor(path: string, clock: VirtualClock) {
    this.path = path;
    this.#clock = clock;
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
  redact(from: string, to: string): void {
    if (!from) return;
    this.#redactions.push([from, to]);
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
    this.records.push(hdr);
    this.#stream.write(this.#apply(canonical(hdr)) + "\n");
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
    this.records.push(full);
    this.#stream.write(this.#apply(canonical(full)) + "\n");
    return full;
  }

  async close(): Promise<void> {
    await new Promise<void>((resolve) => this.#stream.end(resolve));
  }
}
