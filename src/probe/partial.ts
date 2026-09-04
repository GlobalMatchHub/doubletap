import { limits } from "../run/limits.ts";
import { synthArgs } from "../schema/synth.ts";
import { synthContext } from "./args.ts";
import { canonical } from "../trace/writer.ts";
import { diffSnapshots, isEmptyDiff, summariseDiff, type StateDiff } from "../oracle/types.ts";
import type { Probe, ProbeContext, VerdictDraft } from "./types.ts";
import type { VerdictCode } from "../trace/types.ts";

/**
 * Partial failure: what a tool leaves behind when the call does not complete
 * cleanly, and what the client's retry then does.
 *
 * This is the shape of every expensive incident in payments. The request was
 * delivered, the effect was applied, the acknowledgement never arrived. The
 * client cannot distinguish that from "never arrived", so it retries. The only
 * question that matters is whether the second attempt converges or doubles.
 *
 * Three checks, in decreasing order of certainty:
 *
 *   lost-ack   deterministic. The call succeeds, the client throws the answer
 *              away and reconnects, exactly as a crashed client would. No
 *              timing luck involved, so this one is reproducible by seed.
 *   kill-window a search for the interval between "effect applied" and "answer
 *              sent". A ladder of kill delays, stopping at the first delay
 *              that leaves a trace. If the state there matches a clean call
 *              the window is real; if it matches nothing, the write is torn.
 *   truncate   half a request frame, then the connection closes. A server that
 *              acts on an incomplete frame has no business holding a token.
 */

type Applied = "none" | "applied" | "residue" | "torn";

const KILL_LADDER_MS = [0, 1, 2, 4, 8, 16, 32, 64, 128];
/**
 * Each rung is knocked on more than once. The window between "applied" and
 * "answered" is often under a millisecond wide, and whether a single attempt
 * lands inside it depends on how busy the machine is. Repeating turns one
 * lucky observation into a reasonably reliable one without pretending the
 * search is deterministic.
 */
const KILL_ATTEMPTS_PER_RUNG = 3;

export const partialFailureProbe: Probe = {
  name: "partial-failure",

  skip(ctx) {
    if (!ctx.tool.inputSchema)
      return { claim: "The tool declares no inputSchema, so no call can be synthesised.", code: "no-schema" as const };
    if (ctx.tool.annotations?.readOnlyHint === true)
      return { claim: "The tool declares readOnlyHint, so there is no effect to leave half done.", code: "read-only-confirmed" as const };
    return null;
  },

  async run(ctx): Promise<VerdictDraft[]> {
    const { tool } = ctx;
    const rng = ctx.rng.fork(`partial:${tool.name}`);
    // One token shared by every case, so all of them ask for exactly the same
    // thing and their state diffs can be compared directly.
    const token = rng.token(6);
    const mkArgs = (workspace: string) =>
      synthArgs(tool.inputSchema, synthContext(ctx, workspace, rng.fork("args"), token), {
        readOnlyHint: false,
      });

    // Reference: what one clean, uninterrupted call does.
    const ref = await ctx.newCase(`partial-ref-${tool.name}`);
    let cleanDiff: StateDiff;
    let cleanOk: boolean;
    try {
      const a0 = await ref.snap(`${tool.name}:ref-pre`);
      const r = await ref.session.callTool(tool.name, mkArgs(ref.sandbox.workspace), { timeoutMs: limits.callTimeoutMs });
      const a1 = await ref.snap(`${tool.name}:ref-post`);
      cleanDiff = diffSnapshots(a0, a1);
      cleanOk = ok(r);
    } finally {
      await ref.dispose();
    }

    if (!cleanOk)
      return [skipVerdict(tool.name, "An uninterrupted call did not succeed, so there is no reference effect to interrupt.", "partial-failure", "call-failed")];
    if (isEmptyDiff(cleanDiff))
      return [
        skipVerdict(
          tool.name,
          "A clean call produced no observable state change, so an interrupted one cannot be judged by this oracle.",
        ),
      ];

    return [...(await lostAck(ctx, mkArgs, cleanDiff)), ...(await truncated(ctx, mkArgs))];
  },
};

/**
 * Hunts for the interval between "the effect is applied" and "the answer is
 * sent" by killing the server at a ladder of delays after delivery.
 *
 * This one searches over real time, so it is marked as such: two runs of the
 * same seed may find the window at different rungs, or on a loaded machine not
 * find it at all. What it produces is evidence that a window exists, which is
 * a claim a single observation can support. It is kept out of the determinism
 * check rather than allowed to weaken it.
 */
export const killWindowProbe: Probe = {
  name: "kill-window",
  timingSearch: true,

  skip(ctx) {
    if (!ctx.tool.inputSchema)
      return { claim: "The tool declares no inputSchema, so no call can be synthesised.", code: "no-schema" as const };
    if (ctx.tool.annotations?.readOnlyHint === true)
      return { claim: "The tool declares readOnlyHint, so there is no effect to interrupt.", code: "read-only-confirmed" as const };
    return null;
  },

  async run(ctx): Promise<VerdictDraft[]> {
    const { tool } = ctx;
    const rng = ctx.rng.fork(`kill:${tool.name}`);
    const token = rng.token(6);
    const mkArgs = (workspace: string) =>
      synthArgs(tool.inputSchema, synthContext(ctx, workspace, rng.fork("args"), token), { readOnlyHint: false });

    const ref = await ctx.newCase(`kill-ref-${tool.name}`);
    let cleanDiff: StateDiff;
    let cleanOk: boolean;
    try {
      const a0 = await ref.snap(`${tool.name}:kill-ref-pre`);
      const r = await ref.session.callTool(tool.name, mkArgs(ref.sandbox.workspace), { timeoutMs: limits.callTimeoutMs });
      const a1 = await ref.snap(`${tool.name}:kill-ref-post`);
      cleanDiff = diffSnapshots(a0, a1);
      cleanOk = ok(r);
    } finally {
      await ref.dispose();
    }
    if (!cleanOk || isEmptyDiff(cleanDiff))
      return [skipVerdict(tool.name, "No reference effect from a clean call, so there is no window to look for.", "kill-window")];

    const fresh = await killWindow(ctx, mkArgs, cleanDiff, "fresh target");

    // Second pass, aimed at a file that already holds data. Same ladder, but
    // now a torn write is destroyed user content rather than a stray empty file.
    const overwriteArgs = (workspace: string) =>
      synthArgs(tool.inputSchema, synthContext(ctx, workspace, rng.fork("args-overwrite"), token), {
        readOnlyHint: false,
        forceAnchorPaths: true,
      });

    const ref2 = await ctx.newCase(`kill-overwrite-ref-${tool.name}`);
    let overwriteDiff: StateDiff;
    let overwriteOk: boolean;
    try {
      const b0 = await ref2.snap(`${tool.name}:kill-overwrite-ref-pre`);
      const r = await ref2.session.callTool(tool.name, overwriteArgs(ref2.sandbox.workspace), { timeoutMs: limits.callTimeoutMs });
      const b1 = await ref2.snap(`${tool.name}:kill-overwrite-ref-post`);
      overwriteDiff = diffSnapshots(b0, b1);
      overwriteOk = ok(r);
    } finally {
      await ref2.dispose();
    }

    // Only meaningful if the clean overwrite actually rewrote the anchor file.
    if (!overwriteOk || overwriteDiff.changed.length === 0) return fresh;
    return [...fresh, ...(await killWindow(ctx, overwriteArgs, overwriteDiff, "existing file with contents"))];
  },
};

/**
 * The client completes the call, then loses the answer and reconnects. This
 * needs no race: it is what happens whenever the client process dies, the
 * gateway times out, or the socket resets after the server has already
 * committed.
 */
async function lostAck(
  ctx: ProbeContext,
  mkArgs: (ws: string) => Record<string, unknown>,
  cleanDiff: StateDiff,
): Promise<VerdictDraft[]> {
  const tool = ctx.tool;
  const c = await ctx.newCase(`lost-ack-${tool.name}`);
  try {
    const s0 = await c.snap(`${tool.name}:lost-ack:pre`);
    const first = await c.session.callTool(tool.name, mkArgs(c.sandbox.workspace), { timeoutMs: limits.callTimeoutMs });
    const s1 = await c.snap(`${tool.name}:lost-ack:after-first`);
    // The answer is discarded and the transport is torn down, which is what
    // the client would have to do if it never received one.
    await c.restart();
    const retry = await c.session.callTool(tool.name, mkArgs(c.sandbox.workspace), { timeoutMs: limits.callTimeoutMs });
    const s2 = await c.snap(`${tool.name}:lost-ack:after-retry`);

    const d1 = diffSnapshots(s0, s1);
    const d2 = diffSnapshots(s1, s2);
    const evidence = {
      tool: tool.name,
      variant: "lost-ack",
      scenario: "the effect was applied, the answer never reached the client, and the client reconnected and retried",
      firstSucceeded: ok(first),
      retrySucceeded: ok(retry),
      firstDiff: d1,
      retryDiff: d2,
      digests: { pre: s0.digest, afterFirst: s1.digest, afterRetry: s2.digest },
    };

    if (isEmptyDiff(d1)) return [skipVerdict(tool.name, "The first call changed nothing under this case, so the retry proves nothing.")];

    return [
      {
        probe: "partial-failure",
        tool: tool.name,
        status: isEmptyDiff(d2) ? "pass" : "fail",
        code: isEmptyDiff(d2) ? "retry-converged" : "retry-doubled",
        claim: isEmptyDiff(d2)
          ? "After a lost acknowledgement and a reconnect, an identical retry converged on the same state."
          : `After a lost acknowledgement and a reconnect, an identical retry applied the effect a second time (${summariseDiff(d2)}).`,
        confidence: "observed",
        evidence,
      },
    ];
  } finally {
    await c.dispose();
  }
}

/**
 * Walks a ladder of kill delays looking for the first one that leaves a trace,
 * then reports what that trace looks like.
 */
async function killWindow(
  ctx: ProbeContext,
  mkArgs: (ws: string) => Record<string, unknown>,
  cleanDiff: StateDiff,
  targetKind: string,
): Promise<VerdictDraft[]> {
  const tool = ctx.tool;
  const attempts: { delayMs: number; applied: Applied; acknowledged: boolean }[] = [];

  const rungs: number[] = [];
  for (const ms of KILL_LADDER_MS) for (let i = 0; i < KILL_ATTEMPTS_PER_RUNG; i++) rungs.push(ms);

  for (const delayMs of rungs) {
    const c = await ctx.newCase(`kill-${delayMs}-${tool.name}`);
    try {
      const s0 = await c.snap(`${tool.name}:kill${delayMs}:pre`);
      const interrupted = await c.session.callTool(tool.name, mkArgs(c.sandbox.workspace), {
        timeoutMs: 1200,
        fault: { killAfter: true, killAfterMs: delayMs },
      });
      await c.awaitExit(2000);
      await c.restart();
      const s1 = await c.snap(`${tool.name}:kill${delayMs}:after`);
      const interruptedDiff = diffSnapshots(s0, s1);
      const applied = classify(interruptedDiff, cleanDiff);
      const acknowledged = ok(interrupted);
      attempts.push({ delayMs, applied, acknowledged });

      if (applied === "none") continue;

      // First delay that left something. Retry from here.
      const retry = await c.session.callTool(tool.name, mkArgs(c.sandbox.workspace), { timeoutMs: limits.callTimeoutMs });
      const s2 = await c.snap(`${tool.name}:kill${delayMs}:after-retry`);
      const retryDiff = diffSnapshots(s1, s2);
      const evidence = {
        tool: tool.name,
        variant: `kill@${delayMs}ms`,
        scenario: `the server was killed ${delayMs}ms after the request was delivered, against ${targetKind}`,
        targetKind,
        ladder: attempts,
        acknowledged,
        appliedAfterInterrupt: applied,
        interruptedDiff,
        cleanDiff,
        retryDiff,
        retrySucceeded: ok(retry),
        digests: { pre: s0.digest, afterInterrupt: s1.digest, afterRetry: s2.digest },
      };

      if (applied === "residue")
        return [
          {
            probe: "kill-window",
            tool: tool.name,
            status: "fail",
            code: "residue-left",
            claim: `Killed ${delayMs}ms after delivery against ${targetKind}, the tool left ${interruptedDiff.added.map((e) => e.p).join(", ")} behind without touching its target, so an interrupted call litters the user's directory with files a completed call never produces.`,
            confidence: "observed",
            evidence,
          },
        ];

      if (applied === "torn")
        return [
          {
            probe: "kill-window",
            tool: tool.name,
            status: "violation",
            code: "torn-write",
            claim: tornClaim(delayMs, targetKind, interruptedDiff, cleanDiff),
            confidence: "observed",
            evidence,
          },
        ];

      if (!acknowledged)
        return [
          {
            probe: "kill-window",
            tool: tool.name,
            status: isEmptyDiff(retryDiff) ? "pass" : "fail",
            code: isEmptyDiff(retryDiff) ? "retry-converged" : "unacknowledged-commit",
            claim: isEmptyDiff(retryDiff)
              ? `A window exists at ${delayMs}ms where the effect is applied but never acknowledged; the retry converged.`
              : `A window exists at ${delayMs}ms where the effect is applied but never acknowledged, and the retry applied it again (${summariseDiff(retryDiff)}).`,
            confidence: "observed",
            evidence,
          },
        ];

      return [
        {
          probe: "kill-window",
          tool: tool.name,
          status: isEmptyDiff(retryDiff) ? "pass" : "fail",
          code: isEmptyDiff(retryDiff) ? "retry-converged" : "retry-doubled",
          claim: isEmptyDiff(retryDiff)
            ? `The call had already completed and been answered by ${delayMs}ms, and the retry converged.`
            : `The call had already completed by ${delayMs}ms, and the retry applied the effect again (${summariseDiff(retryDiff)}).`,
          confidence: "observed",
          evidence,
        },
      ];
    } finally {
      await c.dispose();
    }
  }

  return [
    {
      probe: "kill-window",
      tool: tool.name,
      status: "pass",
      code: "no-window-found",
      claim: `No kill delay up to ${KILL_LADDER_MS.at(-1)}ms left any trace, so the effect is not started until well after delivery.`,
      confidence: "observed",
      evidence: { tool: tool.name, variant: "kill-window", targetKind, ladder: attempts },
    },
  ];
}

/** Half a frame, then the connection goes away. Nothing should happen. */
async function truncated(
  ctx: ProbeContext,
  mkArgs: (ws: string) => Record<string, unknown>,
): Promise<VerdictDraft[]> {
  const tool = ctx.tool;
  const c = await ctx.newCase(`truncate-${tool.name}`);
  try {
    const args = mkArgs(c.sandbox.workspace);
    const wire = JSON.stringify({ jsonrpc: "2.0", id: 999, method: "tools/call", params: { name: tool.name, arguments: args } });
    const half = Math.floor(Buffer.byteLength(wire, "utf8") / 2);
    const s0 = await c.snap(`${tool.name}:truncate:pre`);
    await c.session.callTool(tool.name, args, {
      timeoutMs: 1200,
      fault: { cutAfterBytes: half, closeAfter: true },
    });
    await c.awaitExit(2000);
    await c.restart();
    const s1 = await c.snap(`${tool.name}:truncate:after`);
    const d = diffSnapshots(s0, s1);
    const evidence = {
      tool: tool.name,
      variant: "truncate",
      cutAtByte: half,
      ofBytes: Buffer.byteLength(wire, "utf8"),
      diff: d,
      appendOnly: isAppendOnlyGrowth(d),
    };

    if (isEmptyDiff(d))
      return [
        {
          probe: "partial-failure",
          tool: tool.name,
          status: "pass",
          code: "truncated-frame-ignored",
          claim: "A request frame cut in half changed nothing, as it must.",
          confidence: "observed",
          evidence,
        },
      ];

    // Growth appended to files that already existed is almost always the
    // server writing its own log, and a server logging that a connection
    // dropped has done nothing wrong. Reporting that as "acted on a frame it
    // had not finished reading" reads as a serious protocol violation and is
    // not one, so it gets its own, weaker verdict.
    if (isAppendOnlyGrowth(d))
      return [
        {
          probe: "partial-failure",
          tool: tool.name,
          status: "fail",
          code: "truncated-frame-appended",
          claim: `A request frame cut in half left ${summariseDiff(d)} larger than before without creating or replacing anything, which is the shape of a log write rather than an applied effect.`,
          confidence: "observed",
          evidence,
        },
      ];

    return [
      {
        probe: "partial-failure",
        tool: tool.name,
        status: "violation",
        code: "truncated-frame-acted-on",
        claim: `A request frame cut in half still changed state (${summariseDiff(d)}), so the server acts on frames it has not finished reading.`,
        confidence: "observed",
        evidence,
      },
    ];
  } finally {
    await c.dispose();
  }
}

/**
 * Names the damage precisely. An emptied file that used to have contents is a
 * different sentence from a stray new file, and the census is only worth
 * anything if it says which one it found.
 */
function tornClaim(delayMs: number, targetKind: string, interrupted: StateDiff, clean: StateDiff): string {
  const emptied = interrupted.changed.filter((c) => {
    const cleanEntry = clean.changed.find((x) => x.p === c.p);
    return cleanEntry !== undefined && c.now !== cleanEntry.now;
  });
  const zeroed = interrupted.added.concat().filter((e) => e.sz === 0);
  const lost = interrupted.changed.filter((c) => c.now === EMPTY_HASH).map((c) => c.p);

  if (lost.length > 0)
    return `Killed ${delayMs}ms after delivery against ${targetKind}, the tool left ${lost.join(", ")} empty, so the data that was there before the call is gone and the call was never acknowledged.`;
  if (emptied.length > 0)
    return `Killed ${delayMs}ms after delivery against ${targetKind}, the tool left ${emptied.map((e) => e.p).join(", ")} holding neither its old contents nor its new ones.`;
  if (zeroed.length > 0)
    return `Killed ${delayMs}ms after delivery against ${targetKind}, the tool created ${zeroed.map((e) => e.p).join(", ")} with no contents, so a caller checking for the file's existence would read it as done.`;
  return `Killed ${delayMs}ms after delivery against ${targetKind}, the tool left a state matching neither "not done" nor "done" (${summariseDiff(interrupted)}), so it has no atomic unit a client can reason about.`;
}

/** sha256("") truncated the way the fs oracle truncates. */
const EMPTY_HASH = "e3b0c44298fc1c14";

/**
 * True when nothing was created or removed and every changed file only got
 * bigger: the signature of appending, not of applying an effect.
 */
function isAppendOnlyGrowth(d: StateDiff): boolean {
  if (d.added.length > 0 || d.removed.length > 0) return false;
  if (d.changed.length === 0) return false;
  return d.changed.every((c) => (c.nowSz ?? 0) > (c.wasSz ?? 0));
}

function classify(interrupted: StateDiff, clean: StateDiff): Applied {
  if (isEmptyDiff(interrupted)) return "none";
  if (canonical(normalise(interrupted)) === canonical(normalise(clean))) return "applied";

  // Residue: the target the tool was supposed to affect is untouched, and what
  // is left behind is something a completed call never leaves. That is a leak,
  // not a torn write, and the two deserve different words. No filename
  // heuristics are used; the test is purely which paths a clean call touches.
  const touchedByClean = new Set([
    ...clean.added.map((e) => e.p),
    ...clean.changed.map((e) => e.p),
    ...clean.removed.map((e) => e.p),
  ]);
  const onlyAdditions = interrupted.changed.length === 0 && interrupted.removed.length === 0;
  const allDisjoint = interrupted.added.every((e) => !touchedByClean.has(e.p));
  if (onlyAdditions && allDisjoint && interrupted.added.length > 0) return "residue";

  return "torn";
}

function normalise(d: StateDiff) {
  return {
    added: d.added.map((e) => [e.p, e.h, e.sz ?? null]).sort(),
    removed: d.removed.map((e) => [e.p, e.h]).sort(),
    changed: d.changed.map((e) => [e.p, e.was, e.now]).sort(),
  };
}

function ok(o: { answered: boolean; error?: unknown; result?: unknown }): boolean {
  return o.answered && !o.error && (o.result as { isError?: boolean } | undefined)?.isError !== true;
}

function skipVerdict(tool: string, claim: string, probe = "partial-failure", code: VerdictCode = "no-observable-effect"): VerdictDraft {
  return { probe, tool, status: "skip", code, claim, confidence: "observed", evidence: { tool } };
}
