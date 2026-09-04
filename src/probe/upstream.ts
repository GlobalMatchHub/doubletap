import { limits } from "../run/limits.ts";
import { synthArgs } from "../schema/synth.ts";
import { synthContext } from "./args.ts";
import { Rng } from "../det/rng.ts";
import { isWrite, repeatIsUnsafe, idempotencyKeyOf, describe, type NetEntry } from "../net/log.ts";
import type { Probe, ProbeContext, VerdictDraft, CaseHandle } from "./types.ts";

/**
 * Retry safety for servers whose side effect leaves the machine.
 *
 * Most published MCP servers keep nothing locally. They are a thin shell over
 * someone's REST API, and the thing a retry can do twice is a POST. The
 * interceptor answers every outbound request without opening a socket, so the
 * whole flow runs offline and what it produces is the ordered list of requests
 * the server tried to send. That list is the state.
 *
 * The question is the one every payments integration answers on day one: if
 * the client retries, does the same write go out again, and if it does, does
 * it carry the same idempotency key so the far end can throw the duplicate
 * away? A server that re-sends with a *fresh* key has defeated the only
 * mechanism the API offers, and that is worse than not retrying at all.
 *
 * Two cases, because they fail differently:
 *
 *   same session   a retry on the live connection
 *   after restart  the client lost the answer and reconnected, which wipes any
 *                  deduplication the server was keeping in memory
 */
export const upstreamProbe: Probe = {
  name: "upstream-idempotency",

  skip(ctx) {
    if (!ctx.tool.inputSchema)
      return { claim: "The tool declares no inputSchema, so no call can be synthesised.", code: "no-schema" as const };
    return null;
  },

  async run(ctx): Promise<VerdictDraft[]> {
    const rng = ctx.rng.fork(`upstream:${ctx.tool.name}`);
    const token = rng.token(6);
/**
 * A stable argument stream.
 *
 * These builders are called once per call, and forking the enclosing Rng
 * advances it, so every call drew fresh numbers: a retry that was supposed to
 * be identical sent a different orderId. Any tool with a numeric field was
 * therefore never actually retried, and the difference in the request body
 * that followed was the harness's, not the server's. Seeding from a fixed
 * string instead makes repeated calls genuinely repeat.
 */
    const argSeed = `${ctx.seed}:${ctx.tool.name}:${token}:args`;
    const mkArgs = (ws: string) =>
      synthArgs(ctx.tool.inputSchema, synthContext(ctx, ws, new Rng(argSeed), token), {
        readOnlyHint: ctx.tool.annotations?.readOnlyHint === true,
      });

    const sameSession = await runCase(ctx, mkArgs, false);
    // Only worth restarting if the tool actually reached the network.
    if (sameSession.length === 1 && sameSession[0]!.code === "no-upstream-call") return sameSession;
    const afterRestart = await runCase(ctx, mkArgs, true);

    // A server that behaves identically with and without a reconnect should say
    // so once. Two rows with the same verdict is noise that buries the case
    // where they genuinely differ, which is a server deduplicating in memory
    // and losing that memory on restart.
    const a = sameSession[0];
    const b = afterRestart[0];
    if (a && b && a.code === b.code) {
      return [
        {
          ...a,
          claim: a.claim.replace(/\.$/, "") + ", both on the live connection and after a reconnect.",
          evidence: { ...a.evidence, variant: "same session and after restart" },
        },
      ];
    }
    return [...sameSession, ...afterRestart];
  },
};

async function runCase(
  ctx: ProbeContext,
  mkArgs: (ws: string) => Record<string, unknown>,
  restartBetween: boolean,
): Promise<VerdictDraft[]> {
  const tool = ctx.tool;
  const variant = restartBetween ? "after restart" : "same session";
  const c: CaseHandle = await ctx.newCase(`upstream-${restartBetween ? "restart" : "same"}-${tool.name}`);

  try {
    const args = mkArgs(c.sandbox.workspace);
    await c.snapNet(`${tool.name}:upstream:pre`);
    const before = c.upstream.entries().length;

    const first = await c.session.callTool(tool.name, args, { timeoutMs: limits.callTimeoutMs });
    await c.snapNet(`${tool.name}:upstream:after-1`);
    const afterFirst = c.upstream.entries();
    const delta1 = afterFirst.slice(before);

    // A server that edits its own request log has told us something far more
    // important than whether it retries safely, and no verdict from this probe
    // would mean anything afterwards.
    const tampering = c.upstream.tampering();
    if (tampering.length > 0)
      return [
        {
          probe: "upstream-idempotency",
          tool: tool.name,
          status: "violation",
          code: "evidence-tampered",
          claim: `The server altered the record of its own outbound requests (${tampering[0]}). No measurement of its retry behaviour can be trusted, and this is deliberate behaviour rather than a bug.`,
          confidence: "observed",
          evidence: { tool: tool.name, variant, tampering },
        },
      ];

    if (delta1.length === 0) {
      return [
        {
          probe: "upstream-idempotency",
          tool: tool.name,
          status: "skip",
          code: "no-upstream-call",
          claim: "The call sent nothing upstream, so there is no remote side effect to retry.",
          confidence: "observed",
          evidence: { tool: tool.name, variant, firstSucceeded: ok(first) },
        },
      ];
    }

    if (restartBetween) await c.restart();

    const retry = await c.session.callTool(tool.name, mkArgs(c.sandbox.workspace), { timeoutMs: limits.callTimeoutMs });
    await c.snapNet(`${tool.name}:upstream:after-2`);
    const delta2 = c.upstream.entries().slice(afterFirst.length);

    const writes1 = delta1.filter(isWrite);
    const writes2 = delta2.filter(isWrite);
    const base = {
      tool: tool.name,
      variant,
      firstSucceeded: ok(first),
      retrySucceeded: ok(retry),
      firstRequests: delta1.map(summarise),
      retryRequests: delta2.map(summarise),
    };

    if (writes1.length === 0) {
      return [
        {
          probe: "upstream-idempotency",
          tool: tool.name,
          status: "pass",
          code: "upstream-reads-only",
          claim: `The call only reads upstream (${delta1.map(describe).slice(0, 3).join(", ")}), so a retry cannot duplicate anything.`,
          confidence: "observed",
          evidence: base,
        },
      ];
    }

    if (writes2.length === 0) {
      // Sending nothing because the retry was deduplicated and sending
      // nothing because the retry never ran look identical from here. Only
      // the first deserves a pass; treating the second as one would grade a
      // real doubling defect clean on the strength of a timeout.
      if (!ok(retry))
        return [
          {
            probe: "upstream-idempotency",
            tool: tool.name,
            status: "skip",
            code: "call-failed",
            claim: "The retry itself did not succeed, so the absence of a second upstream write says nothing about deduplication.",
            confidence: "observed",
            evidence: base,
          },
        ];
      return [
        {
          probe: "upstream-idempotency",
          tool: tool.name,
          status: "pass",
          code: "upstream-write-suppressed",
          claim: `The first call wrote upstream (${writes1.map(describe).slice(0, 2).join(", ")}) and the retry succeeded without sending a write at all, so the server deduplicated it.`,
          confidence: "observed",
          evidence: base,
        },
      ];
    }

    // The retry wrote again. Whether that matters depends on the method and on
    // whether a key was sent that the far end can deduplicate on.
    const repeats = writes2.filter((w) => writes1.some((x) => x.fingerprint === w.fingerprint));
    const unsafe = repeats.filter(repeatIsUnsafe);

    // A tool that says it does not mutate is taken at its word: a repeated POST
    // to a search or GraphQL endpoint is not a duplicated side effect.
    if (tool.annotations?.readOnlyHint === true) {
      return [
        {
          probe: "upstream-idempotency",
          tool: tool.name,
          status: "pass",
          code: "upstream-reads-only",
          claim: `The retry sent ${describe(sample0(writes2))} again, but the tool declares readOnlyHint, so the request is a query rather than a write.`,
          confidence: "observed",
          evidence: base,
        },
      ];
    }

    if (repeats.length > 0 && unsafe.length === 0) {
      return [
        {
          probe: "upstream-idempotency",
          tool: tool.name,
          status: "pass",
          code: "upstream-method-idempotent",
          claim: `The retry re-sends ${repeats.map(describe).slice(0, 2).join(", ")}, but those methods are idempotent by definition in HTTP, so repeating them leaves the same end state.`,
          confidence: "observed",
          evidence: base,
        },
      ];
    }

    const sample = unsafe[0] ?? repeats[0] ?? writes2[0]!;
    const twin = writes1.find((x) => x.fingerprint === sample.fingerprint) ?? writes1[0]!;
    const keyFirst = idempotencyKeyOf(twin);
    const keyRetry = idempotencyKeyOf(sample);

    if (keyFirst && keyRetry && keyFirst.value === keyRetry.value) {
      return [
        {
          probe: "upstream-idempotency",
          tool: tool.name,
          status: "pass",
          code: "idempotency-key-stable",
          claim: `The retry re-sends ${describe(sample)} but carries the same ${keyFirst.header}, so a conforming API will discard the duplicate.`,
          confidence: "observed",
          evidence: { ...base, key: keyFirst.header, keyStable: true },
        },
      ];
    }

    if (keyFirst && keyRetry) {
      return [
        {
          probe: "upstream-idempotency",
          tool: tool.name,
          status: "violation",
          code: "idempotency-key-regenerated",
          claim: `The retry re-sends ${describe(sample)} with a freshly generated ${keyRetry.header}, which is the one thing that stops the API from recognising it as a duplicate. Retrying ${variant} therefore applies the effect twice by design.`,
          confidence: "observed",
          evidence: { ...base, key: keyRetry.header, firstKey: keyFirst.value, retryKey: keyRetry.value },
        },
      ];
    }

    // "Re-sends" has to mean what it says. When no request in the retry
    // matches one from the first call, nothing was re-sent, and saying so
    // anyway was wrong for three of seven findings checked by hand: the
    // bodies differed, so these were second, distinct writes rather than
    // repeats. Both are worth reporting; only one is a repeat.
    if (repeats.length === 0) {
      return [
        {
          probe: "upstream-idempotency",
          tool: tool.name,
          status: "fail",
          code: "upstream-write-again",
          claim: `The retry sent a further write to ${describe(sample)} rather than the identical one, so the two requests differ in their body and the far end has no way to recognise the second as a duplicate of the first.`,
          confidence: "observed",
          evidence: { ...base, repeatedRequests: 0, key: null, declaredReadOnly: false },
        },
      ];
    }

    // No key, and no annotation saying the call is a read. Either reading is
    // what it does and the annotation that would say so is missing, or it is a
    // write and a retry duplicates it. Both are defects, and the claim says so
    // rather than picking the more dramatic one.
    return [
      {
        probe: "upstream-idempotency",
        tool: tool.name,
        status: "fail",
        code: "upstream-write-repeated",
        claim: `The retry re-sends ${describe(sample)} byte for byte with no idempotency header, and the tool declares no readOnlyHint. Either the retry duplicates a write, or the call is a query and the annotation a gateway would use to know that is missing.`,
        confidence: "observed",
        evidence: { ...base, repeatedRequests: repeats.length, key: null, declaredReadOnly: false },
      },
    ];
  } finally {
    await c.dispose();
  }
}

function sample0(list: NetEntry[]): NetEntry {
  return list[0]!;
}

function summarise(e: NetEntry) {
  const key = idempotencyKeyOf(e);
  return {
    method: e.method,
    url: e.url,
    bodyBytes: e.body.length,
    fingerprint: e.fingerprint,
    idempotencyHeader: key?.header ?? null,
    idempotencyValue: key?.value ?? null,
  };
}

function ok(o: { answered: boolean; error?: unknown; result?: unknown }): boolean {
  return o.answered && !o.error && (o.result as { isError?: boolean } | undefined)?.isError !== true;
}
