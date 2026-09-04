import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import type { TraceRecord, SnapshotRecord, FrameRecord, VerdictRecord } from "../trace/types.ts";

export interface ReplayFilter {
  probe?: string;
  tool?: string;
}

export interface ReplayResult {
  records: number;
  integrity: { snapshots: number; recomputedOk: number; frames: number };
  lines: string[];
}

/**
 * Pure replay: reads a trace back and re-derives everything derivable from it.
 *
 * Snapshot digests are recomputed from the recorded entries rather than
 * trusted, so a trace that has been edited, truncated, or hand-written shows
 * up here instead of being believed. A finding nobody can check is not
 * evidence, and this is the check.
 */
export function replay(path: string, filter: ReplayFilter = {}): ReplayResult {
  const records = readFileSync(path, "utf8")
    .trim()
    .split("\n")
    .map((l) => JSON.parse(l) as TraceRecord);

  let snapshots = 0;
  let recomputedOk = 0;
  let frames = 0;
  const lines: string[] = [];
  const wanted = (label: string) => !filter.tool || label.startsWith(`${filter.tool}:`);

  for (const r of records) {
    switch (r.k) {
      case "hdr":
        lines.push(`trace v${r.v}  seed ${r.seed}  ${r.startedAt}`);
        lines.push(`volatile: ${r.volatile.join(", ") || "none declared"}`);
        break;
      case "f": {
        frames++;
        const f = r as FrameRecord;
        const m = f.msg as { method?: string; id?: number; params?: { name?: string } };
        const name = m.params?.name;
        if (filter.tool && name && name !== filter.tool) break;
        if (filter.tool && !name) break;
        const partial = f.partial ? `  CUT ${f.partial.wrote}/${f.partial.of}` : "";
        lines.push(
          `  ${String(f.t).padStart(5)}  ${f.dir === "out" ? "->" : "<-"} ${m.method ?? `id ${m.id}`}${name ? ` ${name}` : ""}${partial}`,
        );
        break;
      }
      case "fault":
        if (filter.tool && r.tool !== filter.tool) break;
        lines.push(`  ${String(r.t).padStart(5)}  !! ${r.kind}: ${r.note}`);
        break;
      case "snap": {
        const s = r as SnapshotRecord;
        snapshots++;
        const ok = recomputeDigest(s) === s.digest;
        if (ok) recomputedOk++;
        if (!wanted(s.label)) break;
        lines.push(
          `  ${String(s.t).padStart(5)}  == ${s.label}  ${s.digest}  ${ok ? "verified" : "DIGEST MISMATCH"}`,
        );
        break;
      }
      case "verdict": {
        const v = r as VerdictRecord;
        if (filter.probe && v.probe !== filter.probe) break;
        if (filter.tool && v.tool !== filter.tool) break;
        lines.push("", `  ${v.status.toUpperCase()}  ${v.tool}  [${v.probe}]`, `  ${v.claim}`, "");
        break;
      }
      case "note":
        // Case labels embed the tool name, which is how a note is attributed.
        if (filter.tool && !(r.tool ?? "").includes(filter.tool)) break;
        lines.push(`  ${String(r.t).padStart(5)}  -- ${r.msg}`);
        break;
    }
  }

  return { records: records.length, integrity: { snapshots, recomputedOk, frames }, lines };
}

/** The same merkle construction the oracle uses, applied to recorded entries. */
function recomputeDigest(s: SnapshotRecord): string {
  const h = createHash("sha256");
  for (const e of s.entries) h.update(`${e.kind}\0${e.p}\0${e.h}\0${e.sz ?? ""}\n`);
  return "sha256:" + h.digest("hex").slice(0, 32);
}
