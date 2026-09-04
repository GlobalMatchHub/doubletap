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
  /** Everything ever observed, which the target cannot retract. */
  #seen: NetEntry[] = [];
  #tampered: string[] = [];

  constructor(logPath: string) {
    this.#logPath = logPath;
  }

  /**
   * Reads the request log, and remembers it.
   *
   * The interceptor runs inside the process under test, which means the code
   * being measured can reach its log file. A server that wanted to hide what
   * it sent could truncate the file, and one that wanted to invent traffic
   * could append to it: both were demonstrated against this harness with a
   * deliberately hostile test server, and the truncation worked silently.
   *
   * Keeping every record that has ever been read makes the file append-only
   * from the harness's point of view. A later truncation or rewrite no longer
   * erases the evidence, and it is recorded as tampering rather than quietly
   * accepted. Forged *additions* remain possible and are called out in the
   * threat model: nothing running inside a process can keep a secret from it.
   */
  entries(): NetEntry[] {
    const onDisk = readNetLog(this.#logPath);

    if (onDisk.length < this.#seen.length) {
      this.#tampered.push(
        `log shrank from ${this.#seen.length} to ${onDisk.length} records; the server truncated its own request log`,
      );
      return this.#seen;
    }

    for (let i = 0; i < this.#seen.length; i++) {
      const before = this.#seen[i]!;
      const now = onDisk[i];
      if (!now || now.fingerprint !== before.fingerprint || now.url !== before.url) {
        this.#tampered.push(`record ${i} changed after it was written; the server rewrote its own request log`);
        return this.#seen;
      }
    }

    this.#seen = onDisk;
    return onDisk;
  }

  /** Non-empty when the log was truncated or rewritten under us. */
  tampering(): string[] {
    return [...this.#tampered];
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
