import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { TARGETS, findTarget, type TargetConfig } from "./target/registry.ts";
import { runTarget } from "./run/runner.ts";
import { checkDeterminism } from "./run/determinism.ts";
import { configureLimits } from "./run/limits.ts";
import { runSelfTest } from "./run/selftest.ts";
import { runDemo } from "./run/demo.ts";
import { probePackage, toTargetConfig, EXCLUDED, DEFAULT_SERVERS_DIR, type AutoProbeResult } from "./target/autoconfig.ts";
import { screenTarget, type ScreenResult } from "./target/screen.ts";
import { maskLine, readVolatile, learnVolatile } from "./trace/mask.ts";
import { replay } from "./replay/replay.ts";
import { renderHtml } from "./report/html.ts";
import { renderMarkdown } from "./report/markdown.ts";
import { totals, type Census, type TargetReport } from "./report/model.ts";
import { buildTargetReport } from "./report/build.ts";
import { renderCsv } from "./report/csv.ts";
import { idempotencyProbe } from "./probe/idempotency.ts";
import { partialFailureProbe, killWindowProbe } from "./probe/partial.ts";
import { upstreamProbe } from "./probe/upstream.ts";
import { concurrencyProbe } from "./probe/concurrency.ts";
import type { Probe } from "./probe/types.ts";

const ALL_PROBES: Probe[] = [idempotencyProbe, partialFailureProbe, upstreamProbe, concurrencyProbe, killWindowProbe];

function arg(name: string, fallback?: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i === -1 ? fallback : process.argv[i + 1];
}

const cmd = process.argv[2];

if (cmd === "run") {
  const targetId = arg("target") ?? "filesystem";
  const seed = arg("seed") ?? "dt-0001";
  const outDir = arg("out") ?? "runs";
  const only = arg("tool");
  const probeName = arg("probe");
  mkdirSync(outDir, { recursive: true });
  const probes = probeName ? ALL_PROBES.filter((p) => p.name === probeName) : ALL_PROBES;
  if (probes.length === 0) throw new Error("unknown probe: " + probeName);

  const res = await runTarget({
    target: findTarget(targetId),
    probes,
    seed,
    outDir,
    toolFilter: only ? (t) => t.name === only : undefined,
    onProgress: (l) => console.log(l),
  });

  const by = (s: string) => res.verdicts.filter((v) => v.status === s).length;
  console.log(
    `\n${res.targetLabel}\n  violations ${by("violation")}  fails ${by("fail")}  passes ${by("pass")}  skips ${by("skip")}  errors ${by("error")}`,
  );
  console.log(`  trace ${res.tracePath}  (${res.durationMs} ms)`);
} else if (cmd === "render") {
  // Rebuilds the human-facing reports from a census that has already run.
  // Presentation fixes should never require re-running a census: the findings
  // are in the JSON, and re-measuring to change a label would risk changing
  // the result along with it.
  const dir = process.argv[3];
  if (!dir) throw new Error("usage: doubletap render <run directory>");
  const census = JSON.parse(readFileSync(`${dir}/census.json`, "utf8")) as Census;
  writeFileSync(`${dir}/census.html`, renderHtml(census));
  writeFileSync(`${dir}/census.md`, renderMarkdown(census));
  writeFileSync(`${dir}/census.csv`, renderCsv(census));
  console.log(`rewrote ${dir}/census.{html,md,csv} from census.json`);
} else if (cmd === "demo") {
  process.exitCode = (await runDemo({ skipSelfTest: arg("fast") !== undefined })) === 0 ? 0 : 1;
} else if (cmd === "selftest") {
  // The harness checking itself before it reports on anybody else.
  const results = await runSelfTest();
  for (const r of results) console.log(`${r.ok ? "ok  " : "FAIL"}  ${r.name.padEnd(20)} ${r.detail}`);
  if (results.some((r) => !r.ok)) process.exitCode = 1;
} else if (cmd === "discover") {
  // Walks every installed candidate, works out how to start it, and keeps the
  // ones that answer initialize and list a tool without any credentials.
  const serversDir = arg("servers") ?? DEFAULT_SERVERS_DIR;
  const listPath = arg("list") ?? "scripts/candidates.servers.json";
  const outPath = arg("out") ?? "scripts/targets.auto.json";
  const limit = Number(arg("limit") ?? "1000");
  const names: string[] = (JSON.parse(readFileSync(listPath, "utf8")) as { name: string }[])
    .map((p) => p.name)
    .slice(0, limit);

  // Resume: a package already probed successfully is not probed again, and one
  // that was simply not installed yet is retried. Installing 284 packages and
  // probing them are both slow, and they should not have to be serialised.
  const prior = new Map<string, AutoProbeResult>();
  if (existsSync(outPath)) {
    for (const r of JSON.parse(readFileSync(outPath, "utf8")) as AutoProbeResult[]) {
      if (r.ok || !/not installed/.test(r.reason ?? "")) prior.set(r.name, r);
    }
  }

  // Probes are independent processes in independent sandboxes, so they run in
  // parallel. Serially this is a four hour job for a few hundred packages,
  // almost all of it spent waiting out the timeout on things that are not
  // stdio servers at all.
  const concurrency = Number(arg("concurrency") ?? "6");
  const results: AutoProbeResult[] = new Array(names.length);
  let cursor = 0;
  let done = 0;

  const worker = async () => {
    while (cursor < names.length) {
      const idx = cursor++;
      const name = names[idx]!;
      const cached = prior.get(name);
      const r = cached ?? (await probePackage(serversDir, name));
      results[idx] = r;
      done++;
      const tag = r.ok
        ? `ok  ${String(r.toolCount).padStart(3)} tools  argv[${r.argv.join(" ") || "none"}]`
        : `--  ${r.reason}`;
      console.log(`${String(done).padStart(4)}/${names.length}  ${name.padEnd(42)} ${tag}${cached ? "  (cached)" : ""}`);
      if (done % 10 === 0) writeFileSync(outPath, JSON.stringify(results.filter(Boolean), null, 2));
    }
  };
  await Promise.all(Array.from({ length: concurrency }, worker));
  writeFileSync(outPath, JSON.stringify(results.filter(Boolean), null, 2));

  const ok = results.filter((r) => r.ok);
  console.log(`\n${ok.length} of ${results.length} start with no credentials, ${ok.reduce((n, r) => n + r.toolCount, 0)} tools total`);
} else if (cmd === "screen") {
  // Decides which discovered servers are worth a census slot.
  const autoPath = arg("auto") ?? "scripts/targets.auto.json";
  const outPath = arg("out") ?? "scripts/screen.json";
  const concurrency = Number(arg("concurrency") ?? "4");
  const probed = (JSON.parse(readFileSync(autoPath, "utf8")) as AutoProbeResult[]).filter((p) => p.ok && !EXCLUDED[p.name]);
  const targets = probed.map((p) => toTargetConfig(p, DEFAULT_SERVERS_DIR));
  console.log(`screening ${targets.length} servers (${probed.length + Object.keys(EXCLUDED).length - probed.length} excluded by policy)\n`);

  const results: ScreenResult[] = new Array(targets.length);
  let cursor = 0;
  let done = 0;
  await Promise.all(
    Array.from({ length: concurrency }, async () => {
      while (cursor < targets.length) {
        const i = cursor++;
        const r = await screenTarget(targets[i]!);
        results[i] = r;
        done++;
        console.log(
          `${String(done).padStart(3)}/${targets.length}  ${r.label.padEnd(38)} ${r.tier.padEnd(12)} ${r.callsSucceeded}/${r.toolsTried} calls  ${r.reason}`,
        );
        writeFileSync(outPath, JSON.stringify(results.filter(Boolean), null, 2));
      }
    }),
  );
  writeFileSync(outPath, JSON.stringify(results.filter(Boolean), null, 2));
  const tier = (t: string) => results.filter((r) => r?.tier === t).length;
  console.log(
    `\n${tier("state")} with observable local state, ${tier("upstream")} judged on their outbound requests, ${tier("answers-only")} on answer reproducibility only, ${tier("none")} could not be exercised at all`,
  );
} else if (cmd === "census") {
  // Curated targets, discovered targets, or both. Everything a reader sees is
  // produced here; nothing is edited by hand afterwards.
  const seed = arg("seed") ?? "dt-census-1";
  const outDir = arg("out") ?? "runs/census";
  const autoPath = arg("auto");
  const maxTools = Number(arg("max-tools") ?? "20");
  const only = arg("only");
  configureLimits({
    callTimeoutMs: Number(arg("call-timeout") ?? "6000"),
    targetBudgetMs: Number(arg("target-budget") ?? "300000"),
  });
  mkdirSync(outDir, { recursive: true });

  // Fixtures are excluded: their defects were planted here, and counting them
  // would be this repository grading its own homework.
  const curated = (arg("no-curated") === undefined ? TARGETS : []).filter((t) => !t.fixture_only);
  const screenPath = arg("screened");
  const keepIds = screenPath
    ? new Set((JSON.parse(readFileSync(screenPath, "utf8")) as ScreenResult[]).filter((r) => r.keep).map((r) => r.id))
    : null;
  const autoAll = autoPath ? (JSON.parse(readFileSync(autoPath, "utf8")) as AutoProbeResult[]).filter((p) => p.ok) : [];
  const excluded = autoAll.filter((p) => EXCLUDED[p.name]);
  const discovered: TargetConfig[] = autoAll
    .filter((p) => !EXCLUDED[p.name])
    .map((p) => toTargetConfig(p, DEFAULT_SERVERS_DIR))
    .filter((t) => !keepIds || keepIds.has(t.id));
  if (excluded.length > 0) {
    console.log(`excluded by policy (${excluded.length}):`);
    for (const p of excluded) console.log(`  ${p.name.padEnd(38)} ${EXCLUDED[p.name]}`);
    console.log("");
  }

  // A curated target wins over a discovered one for the same package: it has a
  // real fixture and a storage path pointed at the sandbox.
  const curatedLabels = new Set(curated.map((t) => t.label));
  const all = [...curated, ...discovered.filter((t) => !curatedLabels.has(t.label))].filter(
    (t) => !only || t.id === only,
  );

  // Monthly download counts come from the same npm metadata the candidates
  // were drawn from. They are reported, not used to weight anything: a widely
  // installed server with a finding is simply a more interesting sentence.
  const downloads = new Map<string, number>();
  const metaPath = arg("meta") ?? "scripts/candidates.servers.json";
  if (existsSync(metaPath)) {
    for (const p of JSON.parse(readFileSync(metaPath, "utf8")) as { name: string; npmDownloads: number }[])
      downloads.set(p.name, p.npmDownloads);
  }

  const probeNames = arg("probes");
  const probes = probeNames ? ALL_PROBES.filter((p) => probeNames.split(",").includes(p.name)) : ALL_PROBES;
  if (probes.length === 0) throw new Error("no probes selected");

  console.log(`${all.length} targets, probes: ${probes.map((p) => p.name).join(", ")}, at most ${maxTools} tools each\n`);

  const targets: TargetReport[] = [];
  let n = 0;
  for (const target of all) {
    n++;
    const started = Date.now();
    process.stdout.write(`[${n}/${all.length}] ${target.label}\n`);
    try {
      // Tool order is alphabetical, not discovery order, so a cap takes the
      // same slice of a server's surface on every run.
      let kept = 0;
      const r = await runTarget({
        target,
        probes,
        seed,
        outDir,
        toolFilter: () => kept++ < maxTools,
        onProgress: (l) => console.log(l),
      });
      targets.push(buildTargetReport(r, { monthlyDownloads: downloads.get(target.label) ?? null }));
    } catch (e) {
      console.log(`  target failed to run: ${String(e instanceof Error ? e.message : e)} (${Date.now() - started}ms)`);
    }
  }

  const verifyId = arg("verify");
  const determinism = verifyId
    ? await checkDeterminism(findTarget(verifyId), ALL_PROBES, `${seed}-verify`, `${outDir}/determinism`)
    : null;
  if (determinism)
    console.log(
      `\ndeterminism on ${verifyId}: ${determinism.records - determinism.unexplainedDrift}/${determinism.records} records identical, verdicts equal ${determinism.verdictsEqual}`,
    );

  const census: Census = {
    generatedAt: new Date().toISOString(),
    seed,
    node: process.version,
    platform: `${process.platform}-${process.arch}`,
    determinism,
    targets,
  };
  writeFileSync(`${outDir}/census.json`, JSON.stringify(census, null, 2));
  writeFileSync(`${outDir}/census.html`, renderHtml(census));
  writeFileSync(`${outDir}/census.md`, renderMarkdown(census));
  writeFileSync(`${outDir}/census.csv`, renderCsv(census));

  const tot = totals(census);
  console.log(
    `\n${tot.serversWithFindings} of ${tot.exercisable} exercisable servers have findings; ` +
      `${tot.toolsWithFindings} of ${tot.toolsExercised} exercised tools; ` +
      `${tot.violations} contract violations, ${tot.fails} retry failures; ` +
      `${tot.notExercisable} servers started but could not be exercised.`,
  );
  console.log(`wrote ${outDir}/census.{json,html,md,csv}`);
} else if (cmd === "verify") {
  // Determinism check: the same seed twice, then a line-by-line comparison of
  // the two traces. Anything that differs is a source of nondeterminism that
  // has not been sealed off yet, and it is listed rather than hidden.
  const targetId = arg("target") ?? "filesystem";
  const seed = arg("seed") ?? "dt-verify";
  const probeName = arg("probe");
  // Timing searches are excluded by default: they are honest about not being
  // reproducible, and folding them in would report drift that is by design.
  const probes = (probeName ? ALL_PROBES.filter((p) => p.name === probeName) : ALL_PROBES).filter(
    (p) => !p.timingSearch,
  );
  if (probes.length === 0) throw new Error("no deterministic probe selected");
  const dirs = ["runs/verify-a", "runs/verify-b"];
  for (const d of dirs) mkdirSync(d, { recursive: true });
  const res: Awaited<ReturnType<typeof runTarget>>[] = [];
  for (const d of dirs) {
    res.push(await runTarget({ target: findTarget(targetId), probes, seed, outDir: d }));
  }
  const raw = res.map((r) => readFileSync(r.tracePath, "utf8").trim().split("\n"));
  const a = raw[0] ?? [];
  const b = raw[1] ?? [];
  const volatile = readVolatile(a[0] ?? "");
  const ma = a.map((l) => maskLine(l, volatile));
  const mb = b.map((l) => maskLine(l, volatile));
  const drift: { line: number; a: string; b: string }[] = [];
  for (let i = 0; i < Math.max(ma.length, mb.length); i++) {
    if (ma[i] !== mb[i]) drift.push({ line: i + 1, a: ma[i] ?? "<missing>", b: mb[i] ?? "<missing>" });
  }
  const sig = (r: (typeof res)[number]) =>
    JSON.stringify(r.verdicts.map((v) => [v.probe, v.tool, v.status, v.claim]));
  console.log(`records          ${ma.length} vs ${mb.length}`);
  console.log(`verdicts equal   ${sig(res[0]!) === sig(res[1]!)}`);
  console.log(`masked fields    ${volatile.join(", ")}`);
  console.log(`unexplained drift ${drift.length} of ${ma.length} records`);
  if (drift.length > 0) {
    const learned = learnVolatile(ma, mb);
    console.log(`learned volatile paths (${learned.length}):`);
    for (const p of learned) console.log(`  ${p}`);
    writeFileSync(`runs/${targetId}.volatile.json`, JSON.stringify(learned, null, 2));
    console.log(`written to runs/${targetId}.volatile.json`);
  }
  for (const d of drift.slice(0, 6)) {
    let k = 0;
    while (d.a[k] === d.b[k]) k++;
    console.log(`  L${d.line} diverges at char ${k}`);
    console.log(`    a ...${d.a.slice(Math.max(0, k - 50), k + 60)}`);
    console.log(`    b ...${d.b.slice(Math.max(0, k - 50), k + 60)}`);
  }
} else if (cmd === "replay") {
  const path = process.argv[3];
  if (!path) throw new Error("usage: doubletap replay <trace.dt.jsonl> [--probe p] [--tool t]");
  const r = replay(path, { probe: arg("probe"), tool: arg("tool") });
  for (const l of r.lines) console.log(l);
  console.log(
    `\n${r.records} records, ${r.integrity.frames} frames, ${r.integrity.recomputedOk}/${r.integrity.snapshots} snapshot digests recomputed and matched`,
  );
} else if (cmd === "targets") {
  for (const t of TARGETS) console.log(`${t.id.padEnd(12)} ${t.label}`);
} else {
  console.log(`doubletap <command>

  replay  <trace> [--probe p] [--tool t]  read a trace back and check it
  run     --target <id> [--seed s] [--tool name] [--probe name] [--out dir]
  census  [--auto targets.auto.json] [--probes a,b] [--max-tools n] [--verify t]
  verify  --target <id> [--probe name]  same seed twice, compared line by line
  demo     [--fast]                      run the fixture with a known answer and check it\n  render   <run dir>                    rebuild reports from an existing census.json\n  selftest                              check the harness\u0027s own preconditions\n  discover [--limit n] [--out file]     find which installed servers start unaided
  screen   [--auto file] [--out file]    keep only servers with observable state
  targets
`);
}
