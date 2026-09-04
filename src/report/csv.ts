import type { Census } from "./model.ts";
import { redactDeep } from "./redact.ts";

/** One row per verdict. For a census of dozens of servers this is the format
 *  a reader can actually sort, filter and cite from. */
export function renderCsv(input: Census): string {
  const c = redactDeep(input);
  const rows: string[][] = [
    ["server", "source", "monthlyInstalls", "tool", "probe", "status", "code", "claim", "trace"],
  ];
  for (const t of c.targets) {
    for (const v of t.verdicts) {
      rows.push([t.label, t.source, String(t.monthlyDownloads ?? ""), v.tool, v.probe, v.status, v.code ?? "", v.claim, t.tracePath]);
    }
  }
  return rows.map((r) => r.map(cell).join(",")).join("\n");
}

function cell(s: string): string {
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}
