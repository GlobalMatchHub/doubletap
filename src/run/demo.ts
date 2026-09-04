import { findTarget } from "../target/registry.ts";
import { runTarget } from "./runner.ts";
import { idempotencyProbe } from "../probe/idempotency.ts";
import { replay } from "../replay/replay.ts";
import { runSelfTest } from "./selftest.ts";

/**
 * A demonstration that checks its own answer.
 *
 * Showing a tool print findings proves nothing: an audience cannot tell a real
 * finding from a plausible one, and neither can a screenshot. So the fixture
 * has a known answer, the answer is stated before the run rather than after,
 * and the run is compared against it. If any of it stops being true this
 * fails loudly, which also makes it the regression test for the probes it
 * exercises.
 */

interface Expectation {
  tool: string;
  status: string;
  code: string;
  why: string;
}

const EXPECTED: Expectation[] = [
  {
    tool: "create_ticket",
    status: "violation",
    code: "declared-idempotent-but-not",
    why: "declares idempotentHint: true and files a second ticket on retry",
  },
  {
    tool: "save_note",
    status: "pass",
    code: "retry-converged",
    why: "genuinely idempotent: same argument, same bytes",
  },
  {
    tool: "append_audit",
    status: "pass",
    code: "retry-appended-log",
    why: "state moves on every call, but only because it is a log. The decoy",
  },
];

export async function runDemo(opts: { skipSelfTest?: boolean } = {}): Promise<number> {
  let failures = 0;

  console.log("\n1. The harness checks its own preconditions before judging anyone else.");
  console.log("   Both of these fail silently, so neither is assumed.\n");
  if (opts.skipSelfTest) {
    console.log("   (skipped)");
  } else {
    for (const r of await runSelfTest()) {
      console.log(`   ${r.ok ? "ok  " : "FAIL"} ${r.name.padEnd(20)} ${r.detail}`);
      if (!r.ok) failures++;
    }
  }

  console.log("\n2. The fixture has three tools and a known answer, stated before the run:\n");
  for (const e of EXPECTED) console.log(`   ${e.tool.padEnd(15)} -> ${e.status.padEnd(9)}  ${e.why}`);
  console.log("\n   The third one matters most. A server that writes an audit line per call");
  console.log("   moves its state on every retry without applying anything twice, and an");
  console.log("   earlier version of this harness reported it as a duplicated effect.\n");

  // Streamed rather than buffered: half a minute of a still terminal reads as
  // a hang to anyone watching over a video call.
  const result = await runTarget({
    target: findTarget("demo"),
    probes: [idempotencyProbe],
    seed: "demo",
    outDir: "runs/demo",
    onProgress: (line) => console.log(`   ${line.trim()}`),
  });

  console.log("3. What actually happened:\n");
  for (const e of EXPECTED) {
    const got = result.verdicts.find((v) => v.tool === e.tool && v.probe === "idempotency");
    const ok = got?.status === e.status && got?.code === e.code;
    if (!ok) failures++;
    console.log(`   ${ok ? "as predicted" : "MISMATCH   "}  ${e.tool.padEnd(15)} ${got?.status ?? "missing"} / ${got?.code ?? "-"}`);
    if (got && got.status !== "pass") console.log(`                  ${got.claim}`);
  }

  console.log("\n4. Every verdict carries the command that reproduces it, and a replay");
  console.log("   recomputes each snapshot's fingerprint from what was recorded rather");
  console.log("   than trusting the stored value:\n");
  const r = replay(result.tracePath, { tool: "create_ticket" });
  console.log(`   ${r.integrity.recomputedOk}/${r.integrity.snapshots} snapshot digests recomputed and matched, ${r.integrity.frames} frames`);

  console.log(
    failures === 0
      ? "\nEverything matched what was predicted.\n"
      : `\n${failures} thing(s) did not match. That is the demo failing, and it is supposed to.\n`,
  );
  return failures;
}
