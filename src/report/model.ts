import type { VerdictRecord, VerdictStatus, VerdictCode } from "../trace/types.ts";
import type { ToolDef } from "../session/client.ts";
import type { DeterminismCheck } from "../run/determinism.ts";

export interface TargetReport {
  id: string;
  label: string;
  source: string;
  serverName: string;
  serverVersion: string;
  toolCount: number;
  testedCount: number;
  /** Tools where at least one call actually ran. */
  exercisedCount: number;
  durationMs: number;
  tracePath: string;
  counts: Record<VerdictStatus, number>;
  verdicts: VerdictRecord[];
  tools: ToolDef[];
  monthlyDownloads?: number | null;
  /** Counts keyed by verdict code, so the report never groups unlike findings. */
  byCode: Record<string, number>;
}

/** Findings where a side effect actually happened more than once. */
export const DOUBLING_CODES = ["retry-doubled", "unacknowledged-commit", "declared-idempotent-but-not"];
/** Findings where only the answer moved. Real, but a different sentence. */
export const ANSWER_CODES = ["retry-answer-differs", "answer-not-reproducible"];
/** Findings where a retry pushed the same write out to someone else's API. */
export const UPSTREAM_CODES = ["upstream-write-repeated", "idempotency-key-regenerated"];

export function countCodes(t: TargetReport, codes: string[]): number {
  return codes.reduce((n, c) => n + (t.byCode[c] ?? 0), 0);
}

/**
 * Distinct tools with a finding in one of these categories.
 *
 * Counting verdict records instead inflated the headline: three probes report
 * a doubled effect independently, so a single non-idempotent tool contributed
 * three to a total that was then printed next to a count of tools. A reader
 * could not reconcile the two numbers, and the larger one was not a count of
 * anything real.
 */
export function toolsWithCodes(t: TargetReport, codes: string[]): number {
  const tools = new Set<string>();
  for (const v of t.verdicts) if (v.code && codes.includes(v.code)) tools.add(v.tool);
  return tools.size;
}

export interface Census {
  generatedAt: string;
  seed: string;
  node: string;
  platform: string;
  determinism: DeterminismCheck | null;
  targets: TargetReport[];
}

export const STATUSES: VerdictStatus[] = ["violation", "fail", "pass", "skip", "error"];

export function emptyCounts(): Record<VerdictStatus, number> {
  return { violation: 0, fail: 0, pass: 0, skip: 0, error: 0 };
}

/**
 * Codes that mean nothing was ever executed against the tool.
 *
 * A server whose every tool lands here needs credentials or an external
 * service and was never really put under test. Counting it as "clean" would
 * be the single easiest way to make this census worthless, so it is counted
 * separately and excluded from the headline denominator.
 */
const NOT_EXERCISED: VerdictCode[] = [
  "call-failed",
  "no-schema",
  // Declined before any call was made. Distinct from read-only-confirmed,
  // which is emitted only after a call ran and left the state alone: the two
  // shared a code, so a server whose every tool was declined without being
  // called still entered the headline denominator as tested.
  "read-only-untested",
];

export function toolsExercised(verdicts: VerdictRecord[]): Set<string> {
  const byTool = new Map<string, VerdictRecord[]>();
  for (const v of verdicts) {
    const list = byTool.get(v.tool) ?? [];
    list.push(v);
    byTool.set(v.tool, list);
  }
  const out = new Set<string>();
  for (const [tool, vs] of byTool) {
    // A verdict with no code at all is an internal error, not evidence that
    // anything ran, so it cannot count as exercised either.
    if (vs.some((v) => v.code && !NOT_EXERCISED.includes(v.code))) out.add(tool);
  }
  return out;
}

/** A server nothing could be run against at all. */
export function isExercisable(t: TargetReport): boolean {
  return t.exercisedCount > 0;
}

/** Findings worth a reader's attention, most serious first. */
export function findings(t: TargetReport): VerdictRecord[] {
  const rank: Record<string, number> = { violation: 0, fail: 1 };
  return t.verdicts
    .filter((v) => v.status === "violation" || v.status === "fail")
    .sort((a, b) => (rank[a.status]! - rank[b.status]!) || a.tool.localeCompare(b.tool));
}

export interface CensusTotals {
  servers: number;
  exercisable: number;
  notExercisable: number;
  tools: number;
  toolsExercised: number;
  toolsWithFindings: number;
  serversWithFindings: number;
  violations: number;
  fails: number;
  doubling: number;
  answerDrift: number;
  upstreamRepeats: number;
  serversDoubling: number;
  serversUpstream: number;
}

export function totals(c: Census): CensusTotals {
  let tools = 0;
  let exercised = 0;
  let toolsWithFindings = 0;
  let serversWithFindings = 0;
  let violations = 0;
  let fails = 0;
  let exercisable = 0;
  let doubling = 0;
  let answerDrift = 0;
  let upstreamRepeats = 0;
  let serversDoubling = 0;
  let serversUpstream = 0;

  for (const t of c.targets) {
    tools += t.toolCount;
    exercised += t.exercisedCount;
    if (isExercisable(t)) exercisable++;
    const bad = new Set(findings(t).map((v) => v.tool));
    toolsWithFindings += bad.size;
    if (bad.size > 0) serversWithFindings++;
    violations += t.counts.violation;
    fails += t.counts.fail;
    const d = toolsWithCodes(t, DOUBLING_CODES);
    doubling += d;
    if (d > 0) serversDoubling++;
    answerDrift += toolsWithCodes(t, ANSWER_CODES);
    const u = toolsWithCodes(t, UPSTREAM_CODES);
    upstreamRepeats += u;
    if (u > 0) serversUpstream++;
  }

  return {
    servers: c.targets.length,
    exercisable,
    notExercisable: c.targets.length - exercisable,
    tools,
    toolsExercised: exercised,
    toolsWithFindings,
    serversWithFindings,
    violations,
    fails,
    doubling,
    answerDrift,
    upstreamRepeats,
    serversDoubling,
    serversUpstream,
  };
}
