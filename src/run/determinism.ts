import { mkdirSync, readFileSync } from "node:fs";
import { runTarget } from "./runner.ts";
import { maskLine, readVolatile, learnVolatile } from "../trace/mask.ts";
import type { TargetConfig } from "../target/registry.ts";
import type { Probe } from "../probe/types.ts";

export interface DeterminismCheck {
  checked: boolean;
  records: number;
  unexplainedDrift: number;
  volatile: string[];
  verdictsEqual: boolean;
  samples: { line: number; a: string; b: string }[];
}

/**
 * Runs the same seed twice and compares the two traces line by line.
 *
 * Probes that search over real time are excluded by the caller. Nothing is
 * masked beyond what the trace itself declares volatile, and whatever still
 * differs is learned and reported rather than quietly widened away.
 */
export async function checkDeterminism(
  target: TargetConfig,
  probes: Probe[],
  seed: string,
  baseDir: string,
): Promise<DeterminismCheck> {
  const deterministic = probes.filter((p) => !p.timingSearch);
  const dirs = [`${baseDir}/a`, `${baseDir}/b`];
  const runs: Awaited<ReturnType<typeof runTarget>>[] = [];
  for (const dir of dirs) {
    mkdirSync(dir, { recursive: true });
    runs.push(await runTarget({ target, probes: deterministic, seed, outDir: dir }));
  }

  const lines = runs.map((r) => readFileSync(r.tracePath, "utf8").trim().split("\n"));
  const a = lines[0] ?? [];
  const b = lines[1] ?? [];
  const volatileDeclared = readVolatile(a[0] ?? "");
  const ma = a.map((l) => maskLine(l, volatileDeclared));
  const mb = b.map((l) => maskLine(l, volatileDeclared));

  const samples: DeterminismCheck["samples"] = [];
  let drift = 0;
  for (let i = 0; i < Math.max(ma.length, mb.length); i++) {
    if (ma[i] === mb[i]) continue;
    drift++;
    if (samples.length < 5) samples.push({ line: i + 1, a: (ma[i] ?? "").slice(0, 300), b: (mb[i] ?? "").slice(0, 300) });
  }

  const sig = (r: (typeof runs)[number]) => JSON.stringify(r.verdicts.map((v) => [v.probe, v.tool, v.status, v.claim]));

  return {
    checked: true,
    records: Math.max(ma.length, mb.length),
    unexplainedDrift: drift,
    volatile: drift > 0 ? learnVolatile(ma, mb) : [],
    verdictsEqual: sig(runs[0]!) === sig(runs[1]!),
    samples,
  };
}
