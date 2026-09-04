/** The .dt.jsonl trace format. One record per line, append-only. */

export const TRACE_VERSION = 1;

export type TargetSpec =
  | { kind: "stdio"; cmd: string[]; env?: Record<string, string>; cwd?: string }
  | { kind: "http"; url: string; headers?: Record<string, string> };

export interface HeaderRecord {
  k: "hdr";
  v: number;
  runId: string;
  seed: string;
  startedAt: string;
  target: TargetSpec;
  env: { node: string; platform: string; arch: string };
  /** JSON pointers whose values are known to vary between identical runs. */
  volatile: string[];
}

/** A JSON-RPC frame as it crossed the wire. */
export interface FrameRecord {
  k: "f";
  seq: number;
  /** Virtual clock, microseconds since run start. Not wall time. */
  t: number;
  dir: "out" | "in";
  bytes: number;
  sha: string;
  /** The wire form, consumed by the writer to compute `sha` after redaction. */
  wire?: string;
  msg: unknown;
  /** Set when the frame did not cross whole. */
  partial?: { wrote: number; of: number };
}

export interface FaultRecord {
  k: "fault";
  seq: number;
  t: number;
  /** The tool the damaged frame was addressed to, so a replay can be filtered. */
  tool?: string;
  kind: "cut" | "delay" | "truncate" | "kill" | "reorder";
  ofSeq?: number;
  at?: { dir: "out" | "in"; byteOffset: number };
  note: string;
}

export interface SnapshotRecord {
  k: "snap";
  seq: number;
  t: number;
  label: string;
  oracle: string;
  /** Merkle root over the observed state. */
  digest: string;
  confidence: "observed" | "derived";
  /** How long the tree took to stop changing before this was taken. */
  settleMs?: number;
  entries: SnapshotEntry[];
}

export interface SnapshotEntry {
  /** Path within the observed state (a file path, a table/row key). */
  p: string;
  /** Size in bytes where meaningful. */
  sz?: number;
  /** Content hash. */
  h: string;
  kind: "file" | "dir" | "symlink" | "row" | "value";
}

export type VerdictStatus = "pass" | "fail" | "violation" | "skip" | "error";

export type VerdictCode =
  | "no-schema"
  | "call-failed"
  | "no-observable-effect"
  | "read-only-confirmed"
  | "retry-converged"
  | "retry-doubled"
  | "retry-answer-differs"
  | "declared-idempotent-but-not"
  | "declared-readonly-but-writes"
  | "torn-write"
  | "residue-left"
  | "unacknowledged-commit"
  | "truncated-frame-ignored"
  | "truncated-frame-acted-on"
  | "truncated-frame-appended"
  | "no-window-found"
  | "answer-reproducible"
  | "answer-not-reproducible"
  | "no-upstream-call"
  | "upstream-reads-only"
  | "upstream-write-suppressed"
  | "upstream-write-repeated"
  | "idempotency-key-stable"
  | "idempotency-key-regenerated"
  | "upstream-method-idempotent"
  | "concurrent-matches-sequential"
  | "concurrent-state-differs"
  | "concurrent-lost-update"
  | "concurrent-calls-dropped"
  | "concurrent-crash"
  | "evidence-tampered"
  | "retry-appended-log"
  | "read-only-untested";

export interface VerdictRecord {
  k: "verdict";
  seq: number;
  t: number;
  probe: string;
  tool: string;
  status: VerdictStatus;
  /** Machine-readable reason, so reports never have to match on prose. */
  code?: VerdictCode;
  /** One sentence, present tense, stating what was proven. */
  claim: string;
  confidence: "observed" | "derived";
  evidence: Record<string, unknown>;
  repro: string;
}

export interface NoteRecord {
  k: "note";
  seq: number;
  t: number;
  tool?: string;
  level: "info" | "warn" | "error";
  msg: string;
  data?: unknown;
}

export type TraceRecord =
  | HeaderRecord
  | FrameRecord
  | FaultRecord
  | SnapshotRecord
  | VerdictRecord
  | NoteRecord;
