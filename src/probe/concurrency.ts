import { limits } from "../run/limits.ts";
import { synthArgs } from "../schema/synth.ts";
import { synthContext } from "./args.ts";
import { canonical } from "../trace/writer.ts";
import { diffSnapshots, isEmptyDiff, summariseDiff, type StateDiff } from "../oracle/types.ts";
import { isWrite } from "../net/log.ts";
import type { Probe, ProbeContext, VerdictDraft, CaseHandle } from "./types.ts";

/**
 * What happens when the same tool is called several times at once.
 *
 * An agent runtime is not a queue. Nothing in the protocol stops a client from
 * having four tool calls in flight on one connection, and plenty of them do:
 * a plan fans out, a retry overlaps the call it is retrying, two agents share
 * a server. A tool that is correct one call at a time can still lose writes
 * when two of them land together, and that failure is invisible to every
 * probe that only ever issues one request.
 *
 * The oracle is a comparison, not a guess. The same N calls are run twice:
 * once strictly sequentially, once all at once. Sequential is the definition
 * of correct here, because it is what the tool's author certainly tested. If
 * the concurrent run lands somewhere else -- fewer files, a shorter log, a
 * corrupted document, a dead server -- the difference is the race.
 *
 * This is a timing search and is marked as one. A race that does not reproduce
 * on a quiet machine is still a race, but it cannot be re-derived from a seed,
 * so it stays out of the determinism check rather than weakening it.
 */

const FANOUT = 4;

export const concurrencyProbe: Probe = {
  name: "concurrency",
  timingSearch: true,

  skip(ctx) {
    if (!ctx.tool.inputSchema)
      return { claim: "The tool declares no inputSchema, so no call can be synthesised.", code: "no-schema" as const };
    if (ctx.tool.annotations?.readOnlyHint === true)
      return { claim: "The tool declares readOnlyHint, so overlapping calls have nothing to corrupt.", code: "read-only-untested" as const };
    return null;
  },

  async run(ctx): Promise<VerdictDraft[]> {
    const tool = ctx.tool;
    const rng = ctx.rng.fork(`concurrency:${tool.name}`);

    // Distinct arguments per call. Identical ones would be indistinguishable
    // from the retry the idempotency probe already covers; distinct ones ask
    // the sharper question, which is whether four separate pieces of work all
    // survive being done at the same time.
    const tokens = Array.from({ length: FANOUT }, (_, i) => rng.fork(`call${i}`).token(6));
    const argsFor = (ws: string, i: number) =>
      synthArgs(tool.inputSchema, synthContext(ctx, ws, rng.fork(`args${i}`), tokens[i]!), {
        readOnlyHint: false,
      });

    const sequential = await runSequential(ctx, argsFor);
    if (sequential.skip) return [sequential.skip];

    const concurrent = await runConcurrent(ctx, argsFor, sequential.elapsedMs);

    const base = {
      tool: tool.name,
      fanout: FANOUT,
      sequentialDiff: sequential.diff,
      concurrentDiff: concurrent.diff,
      sequentialSucceeded: sequential.succeeded,
      concurrentSucceeded: concurrent.succeeded,
      sequentialUpstreamWrites: sequential.upstreamWrites,
      concurrentUpstreamWrites: concurrent.upstreamWrites,
      sequentialMs: sequential.elapsedMs,
      concurrentMs: concurrent.elapsedMs,
      serverSurvived: concurrent.serverAlive,
    };

    if (!concurrent.serverAlive)
      return [
        {
          probe: "concurrency",
          tool: tool.name,
          status: "violation",
          code: "concurrent-crash",
          claim: `${FANOUT} calls in flight at once killed the server, which ${FANOUT} of the same calls one after another did not.`,
          confidence: "observed",
          evidence: base,
        },
      ];

    // Fewer successful answers under load is its own failure, separate from
    // whatever the state ended up looking like.
    if (concurrent.succeeded < sequential.succeeded)
      return [
        {
          probe: "concurrency",
          tool: tool.name,
          status: "fail",
          code: "concurrent-calls-dropped",
          claim: `${sequential.succeeded} of ${FANOUT} calls succeeded one at a time, but only ${concurrent.succeeded} did when they overlapped, even given ${Math.round(Math.max(limits.callTimeoutMs, sequential.elapsedMs * 2, 20_000) / 1000)}s to answer.`,
          confidence: "observed",
          evidence: base,
        },
      ];

    const seqShape = shapeOf(sequential.diff);
    const conShape = shapeOf(concurrent.diff);
    if (canonical(seqShape) === canonical(conShape))
      return [
        {
          probe: "concurrency",
          tool: tool.name,
          status: "pass",
          code: "concurrent-matches-sequential",
          claim: `${FANOUT} overlapping calls left the same shape of state as the same ${FANOUT} calls run one at a time.`,
          confidence: "observed",
          evidence: base,
        },
      ];

    // A smaller result under concurrency is the classic lost update: two calls
    // read the same state, and the second one's write erases the first's.
    const lost = seqShape.added + seqShape.changed - (conShape.added + conShape.changed);
    if (lost > 0)
      return [
        {
          probe: "concurrency",
          tool: tool.name,
          status: "violation",
          code: "concurrent-lost-update",
          claim: `Run one at a time, ${FANOUT} calls left ${seqShape.added + seqShape.changed} entries behind; run at once they left ${conShape.added + conShape.changed}, so ${lost} of them were overwritten by a call that had already read the state.`,
          confidence: "observed",
          evidence: base,
        },
      ];

    return [
      {
        probe: "concurrency",
        tool: tool.name,
        status: "fail",
        code: "concurrent-state-differs",
        claim: `Overlapping calls left different state from the same calls run one at a time (sequential ${summariseDiff(sequential.diff)}; concurrent ${summariseDiff(concurrent.diff)}).`,
        confidence: "observed",
        evidence: base,
      },
    ];
  },
};

interface Run {
  diff: StateDiff;
  succeeded: number;
  upstreamWrites: number;
  serverAlive: boolean;
  elapsedMs: number;
  skip?: VerdictDraft;
}

/** The reference: the same work, done politely, one call at a time. */
async function runSequential(
  ctx: ProbeContext,
  argsFor: (ws: string, i: number) => Record<string, unknown>,
): Promise<Run> {
  const c: CaseHandle = await ctx.newCase(`concurrency-seq-${ctx.tool.name}`);
  const started = Date.now();
  try {
    const before = await c.snap(`${ctx.tool.name}:seq:pre`);
    let succeeded = 0;
    for (let i = 0; i < FANOUT; i++) {
      const r = await c.session.callTool(ctx.tool.name, argsFor(c.sandbox.workspace, i), {
        timeoutMs: limits.callTimeoutMs,
      });
      if (ok(r)) succeeded++;
    }
    const after = await c.snap(`${ctx.tool.name}:seq:post`);
    const diff = diffSnapshots(before, after);
    const upstreamWrites = c.upstream.entries().filter(isWrite).length;

    if (succeeded === 0)
      return {
        diff,
        succeeded,
        upstreamWrites,
        elapsedMs: Date.now() - started,
        serverAlive: c.session.alive,
        skip: {
          probe: "concurrency",
          tool: ctx.tool.name,
          status: "skip",
          code: "call-failed",
          claim: "No call succeeded even one at a time, so there is no correct behaviour to compare against.",
          confidence: "observed",
          evidence: { tool: ctx.tool.name },
        },
      };

    if (isEmptyDiff(diff) && upstreamWrites === 0)
      return {
        diff,
        succeeded,
        upstreamWrites,
        elapsedMs: Date.now() - started,
        serverAlive: c.session.alive,
        skip: {
          probe: "concurrency",
          tool: ctx.tool.name,
          status: "skip",
          code: "no-observable-effect",
          claim: "Calls succeed but leave nothing this oracle can see, so overlapping them cannot be judged.",
          confidence: "observed",
          evidence: { tool: ctx.tool.name },
        },
      };

    return { diff, succeeded, upstreamWrites, elapsedMs: Date.now() - started, serverAlive: c.session.alive };
  } finally {
    await c.dispose();
  }
}

/** The test: the same work, all of it in flight at once. */
async function runConcurrent(
  ctx: ProbeContext,
  argsFor: (ws: string, i: number) => Record<string, unknown>,
  sequentialMs: number,
): Promise<Run> {
  const c: CaseHandle = await ctx.newCase(`concurrency-par-${ctx.tool.name}`);
  const started = Date.now();

  // A server that queues overlapping calls rather than running them in
  // parallel is not doing anything wrong, it is applying backpressure, and the
  // last call in the queue legitimately waits for all the others. Holding the
  // concurrent run to the same per-call timeout as the sequential one declares
  // that correct behaviour a failure: an earlier version of this probe did
  // exactly that and reported its only finding against a server that answered
  // every call in ten seconds when given a fair budget.
  const budget = Math.max(limits.callTimeoutMs, sequentialMs * 2, 20_000);

  try {
    const before = await c.snap(`${ctx.tool.name}:par:pre`);

    // Dispatched without awaiting, so all of them are outstanding on the one
    // connection at the same time. This is what the protocol permits and what
    // a fanned-out plan actually does.
    const inflight = Array.from({ length: FANOUT }, (_, i) =>
      c.session
        .callTool(ctx.tool.name, argsFor(c.sandbox.workspace, i), { timeoutMs: budget })
        .catch(() => ({ answered: false })),
    );
    const results = await Promise.all(inflight);

    const after = await c.snap(`${ctx.tool.name}:par:post`);
    return {
      diff: diffSnapshots(before, after),
      succeeded: results.filter(ok).length,
      upstreamWrites: c.upstream.entries().filter(isWrite).length,
      elapsedMs: Date.now() - started,
      serverAlive: c.session.alive,
    };
  } finally {
    await c.dispose();
  }
}

/**
 * Counts rather than paths, because the paths legitimately differ: every call
 * gets its own token, so file names never line up between two runs. What has
 * to line up is how much work survived.
 */
function shapeOf(d: StateDiff): { added: number; removed: number; changed: number } {
  return { added: d.added.length, removed: d.removed.length, changed: d.changed.length };
}

function ok(o: { answered: boolean; error?: unknown; result?: unknown }): boolean {
  return o.answered && !o.error && (o.result as { isError?: boolean } | undefined)?.isError !== true;
}
