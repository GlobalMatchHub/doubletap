import { limits } from "../run/limits.ts";
import { synthArgs } from "../schema/synth.ts";
import { synthContext } from "./args.ts";
import { canonical } from "../trace/writer.ts";
import { leafDiffPaths } from "../trace/mask.ts";
import { diffSnapshots, isEmptyDiff, summariseDiff, isAppendOnlyGrowth } from "../oracle/types.ts";
import type { Probe, ProbeContext, VerdictDraft } from "./types.ts";
import type { CallOutcome } from "../session/client.ts";

/**
 * Idempotency under retry.
 *
 * The question a payment engineer asks first: if the client never saw the
 * response and sends the identical request again, does the effect happen
 * twice? Two axes are measured, because they fail independently.
 *
 *   state  -- is the observable state after call two the same as after call one
 *   result -- does the server answer the second call the way it answered the first
 *
 * A tool can be state-stable and still be dangerous: a move that succeeds then
 * reports "source not found" on retry tells a retrying client the operation
 * failed when it in fact succeeded, and clients compensate on that signal.
 */
export const idempotencyProbe: Probe = {
  name: "idempotency",

  skip(ctx) {
    if (!ctx.tool.inputSchema) return { claim: "The tool declares no inputSchema, so no call can be synthesised.", code: "no-schema" as const };
    return null;
  },

  async run(ctx): Promise<VerdictDraft[]> {
    const { tool } = ctx;
    const declared = tool.annotations?.idempotentHint === true;
    const readOnly = tool.annotations?.readOnlyHint === true;
    const c = await ctx.newCase(`idem-${tool.name}`);
    const out: VerdictDraft[] = [];

    try {
      const rng = ctx.rng.fork(`idem:${tool.name}`);
      const args = synthArgs(
        tool.inputSchema,
        synthContext(ctx, c.sandbox.workspace, rng, rng.token(6)),
        { readOnlyHint: readOnly },
      );

      const s0 = await c.snap(`${tool.name}:pre`);
      const r1 = await c.session.callTool(tool.name, args, { timeoutMs: limits.callTimeoutMs });
      const s1 = await c.snap(`${tool.name}:after-1`);
      const r2 = await c.session.callTool(tool.name, args, { timeoutMs: limits.callTimeoutMs });
      const s2 = await c.snap(`${tool.name}:after-2`);

      const base = { tool: tool.name, args, declaredIdempotent: declared, declaredReadOnly: readOnly };

      if (!succeeded(r1)) {
        return [
          {
            probe: this.name,
            tool: tool.name,
            status: "skip",
            code: "call-failed",
            claim: "The first call did not succeed, so no retry behaviour could be observed.",
            confidence: "observed",
            evidence: { ...base, firstCall: describe(r1) },
          },
        ];
      }

      const d1 = diffSnapshots(s0, s1);
      const d2 = diffSnapshots(s1, s2);
      const stateStable = isEmptyDiff(d2);
      const hadEffect = !isEmptyDiff(d1);
      const resultStable = canonical(r1.result ?? null) === canonical(r2.result ?? null);
      const bothSucceeded = succeeded(r2);

      // A tool that claims read-only but moved the state is lying about the
      // thing gateways use to decide what needs approval.
      if (readOnly && hadEffect) {
        out.push({
          probe: this.name,
          tool: tool.name,
          status: "violation",
          code: "declared-readonly-but-writes",
          claim: `Declares readOnlyHint: true but a single call changed observable state (${summariseDiff(d1)}).`,
          confidence: "observed",
          evidence: { ...base, firstCallDiff: d1 },
        });
      }

      if (!hadEffect && bothSucceeded) {
        // No state to compare, but there is still a question worth asking: does
        // the same call answer the same way twice? A tool whose answer drifts
        // cannot be cached, replayed, or retried without the caller noticing a
        // difference it has no way to interpret. This is the only axis
        // available for the many servers that front a remote service and keep
        // nothing locally.
        // Naming the fields that moved is the difference between a finding and
        // an accusation. A tool that mints a fresh conversation id every call is
        // doing its job; a tool whose returned balance drifts is not, and only
        // the paths tell them apart.
        const drifted = resultStable ? [] : leafDiffPaths(r1.result ?? null, r2.result ?? null);
        out.push({
          probe: "answer-stability",
          tool: tool.name,
          status: resultStable ? "pass" : "fail",
          code: resultStable ? "answer-reproducible" : "answer-not-reproducible",
          claim: resultStable
            ? "Two identical calls returned identical answers."
            : `Two identical calls returned different answers at ${describePaths(drifted)}, so a retrying client cannot match the second answer to the first.`,
          confidence: "observed",
          evidence: { ...base, driftedPaths: drifted, firstResult: preview(r1), retryResult: preview(r2) },
        });
      }

      if (!hadEffect) {
        // No effect and a read-only claim is a confirmed claim, not an
        // undecidable one. Distinguishing the two keeps the census honest.
        out.push({
          probe: this.name,
          tool: tool.name,
          status: readOnly ? "pass" : "skip",
          code: readOnly ? "read-only-confirmed" : "no-observable-effect",
          claim: readOnly
            ? "Declares readOnlyHint: true and a successful call left the observable state unchanged."
            : "A successful call produced no observable state change, so retry safety cannot be decided by this oracle.",
          confidence: "observed",
          evidence: { ...base, firstCall: describe(r1) },
        });
      } else if (!stateStable && isAppendOnlyGrowth(d2)) {
        // Files that only grew, with nothing created or replaced, is the shape
        // of a per-call audit log rather than the effect landing twice. A
        // server that records what it was asked to do has not done it twice.
        out.push({
          probe: this.name,
          tool: tool.name,
          status: "pass",
          code: "retry-appended-log",
          claim: `An identical retry left the state otherwise unchanged and only appended to ${summariseDiff(d2)}, which is the shape of a log rather than a repeated effect.`,
          confidence: "observed",
          evidence: { ...base, retryDiff: d2 },
        });
      } else if (!stateStable) {
        out.push({
          probe: this.name,
          tool: tool.name,
          status: declared ? "violation" : "fail",
          code: declared ? "declared-idempotent-but-not" : "retry-doubled",
          claim: declared
            ? `Declares idempotentHint: true, but an identical retry changed the state again (${summariseDiff(d2)}).`
            : `An identical retry applied the effect a second time (${summariseDiff(d2)}).`,
          confidence: "observed",
          evidence: {
            ...base,
            firstCallDiff: d1,
            retryDiff: d2,
            digests: { pre: s0.digest, afterFirst: s1.digest, afterRetry: s2.digest },
          },
        });
      } else {
        out.push({
          probe: this.name,
          tool: tool.name,
          status: "pass",
          code: "retry-converged",
          claim: "An identical retry left the observable state unchanged.",
          confidence: "observed",
          evidence: { ...base, firstCallDiff: d1, digests: { afterFirst: s1.digest, afterRetry: s2.digest } },
        });
      }

      // Second axis. Only interesting when the state did settle: a differing
      // answer on a stable state is exactly the lost-response trap.
      if (hadEffect && stateStable && !resultStable) {
        out.push({
          probe: "retry-signal",
          tool: tool.name,
          status: "fail",
          code: "retry-answer-differs",
          claim: bothSucceeded
            ? "A retry left the state unchanged but returned a different answer, so a client cannot tell a duplicate from a fresh success."
            : "The effect was applied once, but the retry reported failure, which tells a retrying client the operation did not happen.",
          confidence: "observed",
          evidence: {
            ...base,
            firstResult: preview(r1),
            retryResult: preview(r2),
            retrySucceeded: bothSucceeded,
          },
        });
      }

      return out;
    } finally {
      await c.dispose();
    }
  },
};

function succeeded(o: CallOutcome): boolean {
  if (!o.answered || o.error) return false;
  const r = o.result as { isError?: boolean } | undefined;
  return r?.isError !== true;
}

function describe(o: CallOutcome): unknown {
  return { answered: o.answered, error: o.error, isError: (o.result as { isError?: boolean })?.isError, preview: preview(o) };
}

function preview(o: CallOutcome): string {
  const s = canonical(o.result ?? o.error ?? null);
  return s.length > 400 ? s.slice(0, 400) + "..." : s;
}


/** Renders the differing paths compactly, without dumping the whole response. */
function describePaths(paths: string[]): string {
  const unique = [...new Set(paths)];
  if (unique.length === 0) return "an unidentified position";
  const shown = unique.slice(0, 3).map((p) => p.replace(/^\$\.?/, "") || "the whole result");
  return shown.join(", ") + (unique.length > shown.length ? `, and ${unique.length - shown.length} more` : "");
}
