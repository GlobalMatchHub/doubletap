import { createHash } from "node:crypto";
import { readNetLog, type NetEntry } from "../net/log.ts";
import type { Oracle, Snapshot } from "./types.ts";
import type { SnapshotEntry } from "../trace/types.ts";

/**
 * The outbound request log as observable state.
 *
 * For a server that fronts a remote API the side effect is not a file, it is
 * the request. Treating the ordered log of attempted requests as the state
 * makes the same before-and-after comparison work: two identical tool calls
 * that each produce a POST have applied the effect twice, whatever the server
 * says in its answer.
 *
 * Requests are keyed by ordinal rather than by content, so a second identical
 * POST shows up as an addition instead of vanishing into a set.
 */
export class UpstreamOracle implements Oracle {
  readonly name = "upstream";
  readonly confidence = "observed" as const;
  #logPath: string;

  constructor(logPath: string) {
    this.#logPath = logPath;
  }

  entries(): NetEntry[] {
    return readNetLog(this.#logPath);
  }

  async snapshot(): Promise<Snapshot> {
    const reqs = this.entries();
    const entries: SnapshotEntry[] = reqs.map((e) => ({
      p: String(e.seq).padStart(6, "0"),
      kind: "value",
      h: e.fingerprint,
    }));
    const h = createHash("sha256");
    for (const e of entries) h.update(`${e.p}\0${e.h}\n`);
    return {
      oracle: this.name,
      confidence: this.confidence,
      digest: "sha256:" + h.digest("hex").slice(0, 32),
      entries,
    };
  }
}
