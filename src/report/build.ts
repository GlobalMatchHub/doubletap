import { toolsExercised, emptyCounts, type TargetReport } from "./model.ts";
import type { runTarget } from "../run/runner.ts";

export function buildTargetReport(
  r: Awaited<ReturnType<typeof runTarget>>,
  extra: { monthlyDownloads?: number | null } = {},
): TargetReport {
  const counts = emptyCounts();
  const byCode: Record<string, number> = {};
  for (const v of r.verdicts) {
    counts[v.status]++;
    if (v.code) byCode[v.code] = (byCode[v.code] ?? 0) + 1;
  }
  const info = (r.serverInfo ?? {}) as { name?: string; version?: string };
  return {
    id: r.targetId,
    label: r.targetLabel,
    source: r.source,
    serverName: info.name ?? "unknown",
    serverVersion: info.version ?? "",
    toolCount: r.tools.length,
    testedCount: new Set(r.verdicts.map((v) => v.tool)).size,
    exercisedCount: toolsExercised(r.verdicts).size,
    durationMs: r.durationMs,
    tracePath: r.tracePath,
    counts,
    verdicts: r.verdicts,
    tools: r.tools,
    monthlyDownloads: extra.monthlyDownloads ?? null,
    byCode,
  };
}
