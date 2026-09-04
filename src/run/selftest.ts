import { findTarget } from "../target/registry.ts";
import { openCase } from "./harness.ts";
import { TraceWriter } from "../trace/writer.ts";
import { VirtualClock } from "../det/clock.ts";
import { selfTest as confinementSelfTest, writeSelfTestProfile, available } from "../target/confine.ts";
import { join } from "node:path";
import { tmpdir } from "node:os";

/**
 * Checks the harness's own assumptions before it is used to judge anyone else.
 *
 * Two of them are load-bearing and both fail silently. If confinement is not
 * actually denying network and exec, a census is running untrusted packages
 * unsupervised while reporting that it is not. If concurrent calls are not
 * actually overlapping at the server, the concurrency probe reports a clean
 * pass for every tool it touches and has proven nothing at all.
 *
 * A harness that cannot demonstrate its own preconditions has no business
 * reporting other people's defects.
 */

export interface SelfTestResult {
  name: string;
  ok: boolean;
  detail: string;
}

export async function runSelfTest(): Promise<SelfTestResult[]> {
  const out: SelfTestResult[] = [];

  writeSelfTestProfile();
  if (!available) {
    out.push({
      name: "confinement",
      ok: false,
      detail: `sandbox-exec is unavailable on ${process.platform}; targets would run unconfined`,
    });
  } else {
    const c = confinementSelfTest();
    const all = c.network && c.write && c.exec;
    out.push({
      name: "confinement",
      ok: all,
      detail: all
        ? "network, out-of-sandbox writes and non-node exec are all denied"
        : `denials incomplete: network=${c.network} write=${c.write} exec=${c.exec}`,
    });
  }

  out.push(await concurrencyOverlaps());
  return out;
}

/**
 * Times two deliberately slow calls, sequentially and then together.
 *
 * If dispatching without awaiting genuinely puts both in flight, the pair
 * finishes in about the time of one. If the transport or the server
 * serialises them, it takes twice as long and the concurrency probe is
 * measuring nothing.
 */
async function concurrencyOverlaps(): Promise<SelfTestResult> {
  const trace = new TraceWriter(join(tmpdir(), "doubletap-selftest", `${Date.now()}.jsonl`), new VirtualClock());
  let c;
  try {
    c = await openCase(findTarget("everything"), "selftest", trace, new VirtualClock());
  } catch (e) {
    await trace.close().catch(() => {});
    return { name: "concurrency-overlap", ok: false, detail: `reference server would not start: ${String(e).slice(0, 120)}` };
  }

  try {
    const tools = await c.session.listTools(10_000);
    const slow = tools.find((t) => t.name === "trigger-long-running-operation");
    if (!slow)
      return { name: "concurrency-overlap", ok: false, detail: "reference server no longer exposes a long-running tool" };

    const args = { duration: 2, steps: 2 };
    const call = () => c.session.callTool(slow.name, args, { timeoutMs: 30_000 });

    let t0 = Date.now();
    await call();
    await call();
    const sequentialMs = Date.now() - t0;

    t0 = Date.now();
    await Promise.all([call(), call()]);
    const concurrentMs = Date.now() - t0;

    const overlapped = concurrentMs < sequentialMs * 0.7;
    return {
      name: "concurrency-overlap",
      ok: overlapped,
      detail: overlapped
        ? `two 2s calls took ${sequentialMs}ms one at a time and ${concurrentMs}ms together, so they really do overlap`
        : `two 2s calls took ${sequentialMs}ms one at a time and ${concurrentMs}ms together, so they are being serialised and the concurrency probe proves nothing`,
    };
  } finally {
    await c.dispose().catch(() => {});
    await trace.close().catch(() => {});
  }
}
