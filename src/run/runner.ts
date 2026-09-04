import { randomUUID } from "node:crypto";
import { join } from "node:path";
import { Rng } from "../det/rng.ts";
import { VirtualClock } from "../det/clock.ts";
import { TraceWriter } from "../trace/writer.ts";
import { openCase } from "./harness.ts";
import { limits } from "./limits.ts";
import { TRACE_VERSION, type HeaderRecord, type VerdictRecord } from "../trace/types.ts";
import type { TargetConfig } from "../target/registry.ts";
import type { Probe, ProbeContext, VerdictDraft } from "../probe/types.ts";
import type { ToolDef } from "../session/client.ts";

export interface RunOptions {
  target: TargetConfig;
  probes: Probe[];
  seed: string;
  outDir: string;
  toolFilter?: (t: ToolDef) => boolean;
  onProgress?: (line: string) => void;
}

export interface RunResult {
  runId: string;
  seed: string;
  targetId: string;
  targetLabel: string;
  source: string;
  serverInfo: unknown;
  tracePath: string;
  tools: ToolDef[];
  verdicts: VerdictRecord[];
  abandonedTools: number;
  startedAt: string;
  durationMs: number;
}

export async function runTarget(opts: RunOptions): Promise<RunResult> {
  const started = Date.now();
  const runId = randomUUID();
  const clock = new VirtualClock();
  const tracePath = join(opts.outDir, `${opts.target.id}-${opts.seed}.dt.jsonl`);
  const trace = new TraceWriter(tracePath, clock);
  const startedAt = new Date().toISOString();

  const header: HeaderRecord = {
    k: "hdr",
    v: TRACE_VERSION,
    runId,
    seed: opts.seed,
    startedAt,
    // Recorded with placeholder paths: the real ones are per case and would
    // make two runs of the same seed differ in the very first line.
    target: {
      kind: "stdio",
      cmd: ["<node>", ...opts.target.cmd({ root: "<sandbox>", workspace: "<sandbox>/workspace" } as never).slice(1)],
    },
    env: { node: process.version, platform: process.platform, arch: process.arch },
    // Declared up front rather than discovered: these are ours, not the
    // server's, and hiding them would flatter the determinism claim.
    volatile: ["$.runId", "$.startedAt", "$.repro"],
  };
  trace.writeHeader(header);

  // One throwaway case just to enumerate the surface.
  const intro = await openCase(opts.target, "discover", trace, clock);
  const allTools = await intro.session.listTools();
  const serverInfo = intro.session.serverInfo;
  await intro.dispose();

  const excluded = new Set(opts.target.excludeTools ?? []);
  // Sorted before any cap is applied, so limiting a server to N tools takes
  // the same N on every run rather than whatever order discovery returned.
  const tools = allTools
    .filter((t) => !excluded.has(t.name))
    .sort((a, b) => a.name.localeCompare(b.name))
    .filter((t) => opts.toolFilter?.(t) ?? true);
  opts.onProgress?.(`${opts.target.id}: ${allTools.length} tools, ${tools.length} under test`);

  const verdicts: VerdictRecord[] = [];


  const deadline = Date.now() + limits.targetBudgetMs;
  let abandoned = 0;

  for (const tool of tools) {
    // Stop handing out new tools once the budget is spent. Abandoning mid-tool
    // would leave a server process behind; stopping between them is clean, and
    // the report says how many tools were left untested rather than implying
    // they passed.
    if (Date.now() > deadline) {
      abandoned++;
      continue;
    }
    for (const probe of opts.probes) {
      const ctx: ProbeContext = {
        targetId: opts.target.id,
        tool,
        tools: allTools,
        seed: opts.seed,
        rng: new Rng(`${opts.seed}:${opts.target.id}:${tool.name}`),
        trace,
        clock,
        tracePath,
        fixture: opts.target.fixture,
        newCase: (label) => openCase(opts.target, label, trace, clock),
      };
      const reason = probe.skip?.(ctx) ?? null;
      const drafts: VerdictDraft[] = reason
        ? [{ probe: probe.name, tool: tool.name, status: "skip", code: reason.code, claim: reason.claim, confidence: "observed", evidence: {} }]
        : await probe.run(ctx).catch((e: unknown) => [
            {
              probe: probe.name,
              tool: tool.name,
              status: "error" as const,
              claim: `The probe itself failed: ${String(e instanceof Error ? e.message : e)}`,
              confidence: "observed" as const,
              evidence: {},
            },
          ]);
      for (const d of drafts) {
        const rec = trace.write({
          k: "verdict",
          ...d,
          repro: `doubletap replay ${tracePath} --probe ${d.probe} --tool ${d.tool}`,
        }) as VerdictRecord;
        verdicts.push(rec);
        if (d.status === "fail" || d.status === "violation")
          opts.onProgress?.(`  ${d.status.toUpperCase()} ${d.tool} [${d.probe}] ${d.claim}`);
      }
    }
  }

  if (abandoned > 0) {
    trace.write({
      k: "note",
      level: "warn",
      msg: `target budget of ${Math.round(limits.targetBudgetMs / 1000)}s spent; ${abandoned} tools left untested`,
    });
    opts.onProgress?.(`  budget spent, ${abandoned} tools left untested`);
  }

  await trace.close();
  return {
    runId,
    seed: opts.seed,
    targetId: opts.target.id,
    targetLabel: opts.target.label,
    source: opts.target.source,
    serverInfo,
    tracePath,
    tools: allTools,
    verdicts,
    abandonedTools: abandoned,
    startedAt,
    durationMs: Date.now() - started,
  };
}
