import type { Rng } from "../det/rng.ts";
import type { VirtualClock } from "../det/clock.ts";
import type { TraceWriter } from "../trace/writer.ts";
import type { McpSession, ToolDef } from "../session/client.ts";
import type { Oracle, Snapshot } from "../oracle/types.ts";
import type { Sandbox } from "../target/sandbox.ts";
import type { UpstreamOracle } from "../oracle/upstream.ts";
import type { VerdictStatus, VerdictCode } from "../trace/types.ts";

/** One isolated attempt: a fresh sandbox and a freshly started server. */
export interface CaseHandle {
  /** Replaced by restart(); read it fresh after every restart. */
  session: McpSession;
  oracle: Oracle;
  sandbox: Sandbox;
  /** Snapshots and records in one step. */
  snap(label: string): Promise<Snapshot>;
  /** The outbound request log, for servers whose side effect is an HTTP call. */
  upstream: UpstreamOracle;
  /** Snapshots the outbound request log and records it. */
  snapNet(label: string): Promise<Snapshot>;
  /**
   * Kills the server and starts a fresh one on the same sandbox, the way a
   * client reconnects after a dropped connection. State on disk survives.
   */
  restart(): Promise<void>;
  /** Waits for the server process to exit, up to a bound. */
  awaitExit(ms?: number): Promise<boolean>;
  dispose(): Promise<void>;
}

export interface ProbeContext {
  targetId: string;
  tool: ToolDef;
  tools: ToolDef[];
  seed: string;
  rng: Rng;
  trace: TraceWriter;
  clock: VirtualClock;
  tracePath: string;
  /** The fixture that every fresh sandbox starts from. */
  fixture: Record<string, string>;
  /** Starts a new isolated case. The caller must dispose it. */
  newCase(label: string): Promise<CaseHandle>;
}

export interface VerdictDraft {
  probe: string;
  tool: string;
  status: VerdictStatus;
  code?: VerdictCode;
  claim: string;
  confidence: "observed" | "derived";
  evidence: Record<string, unknown>;
}

export interface Probe {
  readonly name: string;
  /**
   * True when the probe searches over real time and so cannot be re-derived
   * byte for byte on a second run. Its findings are still recorded and
   * replayable from the trace, but `doubletap verify` leaves it out of the
   * determinism check rather than pretending the check passed.
   */
  readonly timingSearch?: boolean;
  /** Tools this probe declines to run against, with a reason and a code. */
  skip?(ctx: ProbeContext): { claim: string; code: VerdictCode } | null;
  run(ctx: ProbeContext): Promise<VerdictDraft[]>;
}
