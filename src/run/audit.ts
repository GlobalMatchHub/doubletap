import { readFileSync } from "node:fs";
import { probePackage, toTargetConfig, DEFAULT_SERVERS_DIR } from "../target/autoconfig.ts";
import { openCase } from "./harness.ts";
import { TraceWriter } from "../trace/writer.ts";
import { VirtualClock } from "../det/clock.ts";
import { Rng } from "../det/rng.ts";
import { synthArgs } from "../schema/synth.ts";
import { isWrite, idempotencyKeyOf } from "../net/log.ts";
import { limits } from "./limits.ts";
import { join } from "node:path";
import { tmpdir } from "node:os";
import type { Census } from "../report/model.ts";

/**
 * Re-derives a sample of published findings without using the probe that
 * produced them.
 *
 * Every false finding this harness has published was caught by a person
 * looking at output, which is not a method. Sampling by hand once found that
 * two in five upstream findings were wrong, so it is worth doing every time,
 * which means it has to be a command rather than a script somebody remembers
 * to write.
 *
 * The check is deliberately independent: it drives the server directly,
 * counts the requests itself, and compares its own conclusion against the
 * verdict on file. Agreement is weak evidence, because both sides share the
 * interceptor and the argument generator. Disagreement is strong evidence,
 * and that is what this is for.
 */

export interface AuditRow {
  server: string;
  tool: string;
  published: string;
  observed: string;
  agrees: boolean;
  detail: string;
}

const AUDITABLE = ["upstream-write-repeated", "upstream-write-again"];

export async function auditCensus(censusPath: string, sampleSize: number): Promise<AuditRow[]> {
  const census = JSON.parse(readFileSync(censusPath, "utf8")) as Census;

  // One finding per server, so a single chatty server cannot fill the sample.
  const bySever = new Map<string, { server: string; tool: string; code: string }>();
  for (const t of census.targets)
    for (const v of t.verdicts)
      if (v.code && AUDITABLE.includes(v.code) && !bySever.has(t.label))
        bySever.set(t.label, { server: t.label, tool: v.tool, code: v.code });

  const sample = [...bySever.values()].slice(0, sampleSize);
  const rows: AuditRow[] = [];

  for (const s of sample) {
    const row = await auditOne(s.server, s.tool, s.code);
    rows.push(row);
    console.log(
      `${row.agrees ? "agrees  " : "DISAGREES"}  ${row.server} :: ${row.tool}\n           published ${row.published} / observed ${row.observed}  ${row.detail}`,
    );
  }
  return rows;
}

async function auditOne(server: string, tool: string, published: string): Promise<AuditRow> {
  const base = { server, tool, published };
  const p = await probePackage(DEFAULT_SERVERS_DIR, server);
  if (!p.ok) return { ...base, observed: "would not start", agrees: false, detail: p.reason ?? "" };

  const trace = new TraceWriter(join(tmpdir(), "doubletap-audit", `${Date.now()}.jsonl`), new VirtualClock());
  const c = await openCase(toTargetConfig(p, DEFAULT_SERVERS_DIR), `audit-${server}`, trace, new VirtualClock());
  try {
    const def = (await c.session.listTools(10_000)).find((t) => t.name === tool);
    if (!def) return { ...base, observed: "tool gone", agrees: false, detail: "not in tools/list any more" };

    const rng = new Rng(`audit:${server}:${tool}`);
    const args = () =>
      synthArgs(def.inputSchema, {
        rng: rng.fork("a"),
        workspace: c.sandbox.workspace,
        toolName: tool,
        existingFiles: ["note.txt"],
        existingDirs: [],
        fixtureContents: {},
        token: "audit1",
      });

    const before = c.upstream.entries().length;
    await c.session.callTool(tool, args(), { timeoutMs: limits.callTimeoutMs });
    const first = c.upstream.entries().slice(before);
    const mark = c.upstream.entries().length;
    await c.session.callTool(tool, args(), { timeoutMs: limits.callTimeoutMs });
    const second = c.upstream.entries().slice(mark);

    const w1 = first.filter(isWrite);
    const w2 = second.filter(isWrite);
    const identical = w2.filter((b) => w1.some((a) => a.fingerprint === b.fingerprint));
    const keyed = [...w1, ...w2].some((e) => idempotencyKeyOf(e) !== null);

    const observed =
      w2.length === 0
        ? "upstream-write-suppressed"
        : keyed
          ? "idempotency-key-present"
          : identical.length > 0
            ? "upstream-write-repeated"
            : "upstream-write-again";

    return {
      ...base,
      observed,
      agrees: observed === published,
      detail: `writes ${w1.length}/${w2.length}, identical ${identical.length}, key ${keyed ? "yes" : "no"}`,
    };
  } catch (e) {
    return { ...base, observed: "error", agrees: false, detail: String(e).slice(0, 90) };
  } finally {
    await c.dispose().catch(() => {});
    await trace.close().catch(() => {});
  }
}
