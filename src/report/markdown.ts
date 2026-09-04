import type { Census } from "./model.ts";
import { findings, isExercisable, totals, countCodes, DOUBLING_CODES, ANSWER_CODES, UPSTREAM_CODES } from "./model.ts";
import { redactDeep } from "./redact.ts";

/** The table that goes in the README and on a slide. */
export function renderMarkdown(input: Census): string {
  // Redact once, at the boundary, so no individual call site can forget.
  const c = redactDeep(input);
  const tot = totals(c);
  const exercisable = c.targets.filter(isExercisable);
  const inert = c.targets.filter((t) => !isExercisable(t));
  const rank = (t: (typeof c.targets)[number]) => -(t.counts.violation * 10 + t.counts.fail);
  const rows = exercisable
    .slice()
    .sort((a, b) => rank(a) - rank(b) || a.label.localeCompare(b.label))
    .map(
      (t) =>
        `| ${t.label} | ${t.monthlyDownloads == null ? "" : t.monthlyDownloads.toLocaleString("en-US")} | ${t.toolCount} | ${t.exercisedCount} | ${t.counts.violation} | ${countCodes(t, UPSTREAM_CODES)} | ${countCodes(t, DOUBLING_CODES)} | ${countCodes(t, ANSWER_CODES)} | ${t.counts.pass} |`,
    );

  const out: string[] = [
    "# Doubletap conformance census",
    "",
    `Generated ${c.generatedAt} with seed \`${c.seed}\` on ${c.node} / ${c.platform}.`,
    "",
    `**${tot.serversWithFindings} of ${tot.exercisable} servers that could actually be exercised have at least one tool that misbehaves under retry or interruption**, covering ${tot.toolsWithFindings} of ${tot.toolsExercised} exercised tools. Of those findings, ${tot.upstreamRepeats} are a retry pushing the same write back out to somebody's API, ${tot.doubling} are a local side effect happening more than once, and ${tot.answerDrift} are an answer a retrying client cannot match to its first attempt. A further ${tot.notExercisable} servers started and listed tools but every call failed, almost always for want of credentials or a live external service; they are listed separately and excluded from these totals rather than counted as clean.`,
    "",
    "| Server | Monthly installs | Tools | Exercised | Contract violations | Upstream write repeated | Local effect twice | Answer not reproducible | Clean |",
    "| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |",
    ...rows,
    "",
  ];

  if (inert.length > 0) {
    out.push(
      "## Started but not exercisable",
      "",
      "These servers speak the protocol and list tools, but no call succeeded, so nothing about their retry behaviour is known.",
      "",
      inert.map((t) => `\`${t.label}\` (${t.toolCount})`).join(", "),
      "",
    );
  }

  if (c.determinism) {
    const d = c.determinism;
    out.push(
      `Determinism: ${d.records - d.unexplainedDrift} of ${d.records} trace records were identical across two runs of the same seed.` +
        (d.volatile.length ? ` ${d.volatile.length} volatile paths were learned rather than assumed: ${d.volatile.map((p) => "`" + p + "`").join(", ")}.` : ""),
      "",
    );
  }

  for (const t of exercisable) {
    const f = findings(t);
    out.push(`## ${t.label}`, "", `\`${t.source}\` &middot; ${t.serverName} ${t.serverVersion}`, "");
    if (f.length === 0) {
      out.push("No retry failures or contract violations among the tools this oracle could decide.", "");
      continue;
    }
    for (const v of f) {
      const ev = v.evidence as Record<string, unknown>;
      const tags = [v.probe, typeof ev.variant === "string" ? ev.variant : null, ev.declaredIdempotent === true ? "declares idempotentHint" : null]
        .filter(Boolean)
        .join(", ");
      out.push(`- **${v.tool}** (${tags}) ${v.claim}`, `  - reproduce: \`${v.repro}\``);
    }
    out.push("");
  }
  return out.join("\n");
}
