import { join } from "node:path";
import { tmpdir } from "node:os";
import { openCase } from "../run/harness.ts";
import { TraceWriter } from "../trace/writer.ts";
import { VirtualClock } from "../det/clock.ts";
import { Rng } from "../det/rng.ts";
import { synthArgs } from "../schema/synth.ts";
import { diffSnapshots, isEmptyDiff, summariseDiff } from "../oracle/types.ts";
import type { TargetConfig } from "./registry.ts";
import { GENERIC_FIXTURE } from "./autoconfig.ts";
import { isWrite } from "../net/log.ts";

/**
 * A single cheap pass to decide whether a server is worth a full census slot.
 *
 * Calls a handful of its tools once each and looks at whether anything
 * succeeded and whether the sandbox moved. A server whose every call errors
 * needs credentials or a live service, and a server that succeeds without ever
 * changing observable state has nothing this oracle can judge. Both are
 * recorded and excluded, because a census padded with rows that could never
 * have produced a finding is a census that says nothing.
 */
export interface ScreenResult {
  id: string;
  label: string;
  toolsTotal: number;
  toolsTried: number;
  callsSucceeded: number;
  stateChanged: boolean;
  changedSummary: string;
  error?: string;
  keep: boolean;
  /** What this server can be judged on. */
  tier: "state" | "upstream" | "answers-only" | "none";
  reason: string;
  upstreamRequests: number;
  upstreamWrites: number;
  /** True when every tool declares readOnlyHint, so only read calls were tried. */
  readOnlyOnly: boolean;
}

export async function screenTarget(target: TargetConfig, maxTools = 8): Promise<ScreenResult> {
  const base: ScreenResult = {
    id: target.id,
    label: target.label,
    toolsTotal: 0,
    toolsTried: 0,
    callsSucceeded: 0,
    stateChanged: false,
    changedSummary: "",
    keep: false,
    tier: "none",
    reason: "",
    upstreamRequests: 0,
    upstreamWrites: 0,
    readOnlyOnly: false,
  };
  const trace = TraceWriter.discarding(new VirtualClock());
  let c;
  try {
    c = await openCase(target, `screen-${target.id}`, trace, new VirtualClock());
  } catch (e) {
    await trace.close().catch(() => {});
    return { ...base, error: String(e instanceof Error ? e.message : e).slice(0, 200), reason: "did not start" };
  }

  try {
    const tools = (await c.session.listTools(10_000)).sort((a, b) => a.name.localeCompare(b.name));
    base.toolsTotal = tools.length;
    const writable = tools.filter((t) => t.annotations?.readOnlyHint !== true);
    // A server whose entire surface declares readOnlyHint has nothing to try
    // for the write probes, but it is not untestable: answer-stability still
    // applies. Without this fallback, "every tool is read-only" and "every
    // tool needs a credential" produced the identical reason string, and a
    // server that worked perfectly was reported as unreachable.
    const readOnlyOnly = writable.length === 0;
    const picked = (readOnlyOnly ? tools : writable).slice(0, maxTools);
    const before = await c.oracle.snapshot();
    const rng = new Rng(`screen:${target.id}`);
    const files = Object.keys(target.fixture ?? GENERIC_FIXTURE).filter((p) => !p.endsWith("/"));

    for (const tool of picked) {
      base.toolsTried++;
      const args = synthArgs(tool.inputSchema, {
        rng: rng.fork(tool.name),
        workspace: c.sandbox.workspace,
        toolName: tool.name,
        existingFiles: files,
        existingDirs: [...new Set(files.map((p) => p.split("/").slice(0, -1).join("/")).filter(Boolean))],
        fixtureContents: target.fixture ?? GENERIC_FIXTURE,
        token: rng.token(6),
      });
      const r = await c.session.callTool(tool.name, args, { timeoutMs: 8_000 });
      if (r.answered && !r.error && (r.result as { isError?: boolean })?.isError !== true) base.callsSucceeded++;
      if (!c.session.alive) break;
    }

    const net = c.upstream.entries();
    base.upstreamRequests = net.length;
    base.upstreamWrites = net.filter(isWrite).length;

    const after = await c.oracle.snapshot();
    const d = diffSnapshots(before, after);
    base.stateChanged = !isEmptyDiff(d);
    base.changedSummary = summariseDiff(d);
    base.readOnlyOnly = readOnlyOnly;
  } catch (e) {
    base.error = String(e instanceof Error ? e.message : e).slice(0, 200);
  } finally {
    await c.dispose().catch(() => {});
    await trace.close().catch(() => {});
  }

  if (base.upstreamWrites > 0)
    return {
      ...base,
      keep: true,
      tier: "upstream",
      reason: `issues ${base.upstreamWrites} upstream write${base.upstreamWrites === 1 ? "" : "s"}; judged on whether a retry re-sends them`,
    };
  if (base.callsSucceeded === 0 && base.upstreamRequests === 0)
    return {
      ...base,
      keep: false,
      tier: "none",
      reason: base.readOnlyOnly
        ? "every tool declares readOnlyHint, and even a read call did not succeed"
        : "no call succeeded and nothing was sent upstream",
    };
  if (base.callsSucceeded === 0)
    return {
      ...base,
      keep: true,
      tier: "upstream",
      reason: `no call reported success but ${base.upstreamRequests} request${base.upstreamRequests === 1 ? " was" : "s were"} sent upstream`,
    };
  if (!base.stateChanged)
    return {
      ...base,
      keep: true,
      tier: "answers-only",
      reason: base.readOnlyOnly
        ? "every tool declares readOnlyHint; judged on answer reproducibility only"
        : "calls succeed but change nothing this oracle can see; judged on answer reproducibility only",
    };
  return { ...base, keep: true, tier: "state", reason: `observable state change (${base.changedSummary})` };
}
