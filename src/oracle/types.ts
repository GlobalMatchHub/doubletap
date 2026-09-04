import type { SnapshotEntry } from "../trace/types.ts";

export interface Snapshot {
  oracle: string;
  /** Merkle root over all entries. Two snapshots are equal iff this matches. */
  digest: string;
  confidence: "observed" | "derived";
  entries: SnapshotEntry[];
}

export interface StateDiff {
  added: SnapshotEntry[];
  removed: SnapshotEntry[];
  changed: { p: string; was: string; now: string; wasSz?: number; nowSz?: number }[];
}

export interface Oracle {
  readonly name: string;
  readonly confidence: "observed" | "derived";
  snapshot(): Promise<Snapshot>;
}

export function diffSnapshots(a: Snapshot, b: Snapshot): StateDiff {
  const A = new Map(a.entries.map((e) => [e.p, e]));
  const B = new Map(b.entries.map((e) => [e.p, e]));
  const diff: StateDiff = { added: [], removed: [], changed: [] };
  for (const [p, eb] of B) {
    const ea = A.get(p);
    if (!ea) diff.added.push(eb);
    else if (ea.h !== eb.h)
      diff.changed.push({ p, was: ea.h, now: eb.h, wasSz: ea.sz, nowSz: eb.sz });
  }
  for (const [p, ea] of A) if (!B.has(p)) diff.removed.push(ea);
  diff.added.sort((x, y) => x.p.localeCompare(y.p));
  diff.removed.sort((x, y) => x.p.localeCompare(y.p));
  diff.changed.sort((x, y) => x.p.localeCompare(y.p));
  return diff;
}

export function isEmptyDiff(d: StateDiff): boolean {
  return d.added.length === 0 && d.removed.length === 0 && d.changed.length === 0;
}

export function summariseDiff(d: StateDiff, limit = 6): string {
  const bits: string[] = [];
  for (const e of d.added.slice(0, limit)) bits.push(`+${e.p}`);
  for (const e of d.removed.slice(0, limit)) bits.push(`-${e.p}`);
  for (const e of d.changed.slice(0, limit)) bits.push(`~${e.p}`);
  const total = d.added.length + d.removed.length + d.changed.length;
  if (total > bits.length) bits.push(`and ${total - bits.length} more`);
  return bits.join(", ") || "no change";
}
