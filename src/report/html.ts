import type { Census, TargetReport } from "./model.ts";
import { findings, isExercisable, totals, countCodes, DOUBLING_CODES, ANSWER_CODES, UPSTREAM_CODES } from "./model.ts";
import type { VerdictRecord } from "../trace/types.ts";
import { redactDeep } from "./redact.ts";

/**
 * Static, dependency-free report. No emoji: status is carried by inline SVG.
 *
 * Built for a census of dozens of servers rather than three. The page opens as
 * one summary table; per-server detail lives inside collapsed <details>, and
 * nothing large -- no state diffs, no frame dumps, no evidence blobs -- is
 * inlined at all. Those live in census.json and the traces, which is where a
 * reader who wants them can grep. A page that a browser cannot open is not a
 * report.
 */
export function renderHtml(input: Census): string {
  const c = redactDeep(input);
  const tot = totals(c);
  const exercisable = c.targets.filter(isExercisable).sort(byFindings);
  const inert = c.targets.filter((t) => !isExercisable(t)).sort((a, b) => a.label.localeCompare(b.label));

  return `<!doctype html>
<html lang="en"><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Doubletap conformance census</title>
<style>${CSS}</style>
</head><body>
<header class="hd"><div class="wrap">
  <h1>Doubletap</h1>
  <p class="sub">A conformance census of public MCP servers: when a tool call is retried, does the side effect happen once, twice, or half?</p>
  <p class="lede"><strong>${tot.serversWithFindings} of ${tot.exercisable}</strong> servers that could actually be exercised have at least one tool that misbehaves under retry or interruption. ${tot.upstreamRepeats} are a retry pushing the same write back out to somebody's API; ${tot.doubling} are a local side effect happening more than once; ${tot.answerDrift} are an answer a retrying client cannot match to its first attempt.</p>
  <dl class="meta">
    <div><dt>Generated</dt><dd>${esc(c.generatedAt)}</dd></div>
    <div><dt>Seed</dt><dd><code>${esc(c.seed)}</code></dd></div>
    <div><dt>Runtime</dt><dd>${esc(c.node)} on ${esc(c.platform)}</dd></div>
    <div><dt>Servers started</dt><dd>${tot.servers}, of which ${tot.exercisable} exercisable</dd></div>
    <div><dt>Determinism</dt><dd>${determinismLine(c)}</dd></div>
  </dl>
</div></header>

<main class="wrap">
  <section>
    <h2>Servers under test</h2>
    <table class="grid">
      <thead><tr>
        <th>Server</th><th class="n">Monthly installs</th><th class="n">Tools</th><th class="n">Exercised</th>
        <th class="n">Contract violations</th><th class="n">Upstream write repeated</th><th class="n">Local effect twice</th><th class="n">Answer not reproducible</th><th class="n">Clean</th>
      </tr></thead>
      <tbody>
      ${exercisable.map(summaryRow).join("\n")}
      </tbody>
    </table>
    <p class="note">Exercised counts the tools where a call actually ran. A tool whose every call errored is not evidence of good behaviour and is not counted as clean.</p>
  </section>

  <section>
    <h2>Findings</h2>
    ${exercisable.filter((t) => findings(t).length > 0).map(renderTarget).join("\n") || `<p class="clean">${ICON.ok} Nothing found.</p>`}
  </section>

  ${
    inert.length === 0
      ? ""
      : `<section>
    <h2>Started but not exercisable</h2>
    <p class="note">These ${inert.length} servers speak the protocol and list tools, but no call succeeded, almost always for want of credentials or a live external service. Nothing about their retry behaviour is known, so they are excluded from the totals rather than counted as clean.</p>
    <p class="inert">${inert.map((t) => `<code>${esc(t.label)}</code> <span class="dim">${t.toolCount}</span>`).join(" ")}</p>
  </section>`
  }

  <section>
    <h2>Method</h2>
    <p>Each case runs a freshly spawned server in a disposable sandbox seeded to a fixed fixture, with <code>HOME</code>, <code>TMPDIR</code> and the XDG directories redirected inside it, so a server that quietly writes to its config directory is still observable. State is a content-addressed merkle snapshot taken before and after every call; content is hashed rather than mtime, so rewriting identical bytes does not register as a side effect.</p>
    <p>Arguments are synthesised from each tool's declared <code>inputSchema</code>, with the tool's name read for intent so a read tool is handed a path that exists and a create tool one that does not. Every draw comes from the run seed. Servers are started by trying a short ladder of invocations and keeping the first that completes initialize and lists a tool, so no server is included because it happened to be easy to configure by hand.</p>
    <p>The determinism claim is checked rather than asserted: the same seed is run twice and the traces compared line by line. Fields that still differ are learned and listed, not masked in advance. Probes that search over real time are excluded from that check and marked as timing searches, because a race cannot be re-derived on demand.</p>
    <p class="note">Per-finding evidence, state diffs and full frame logs are in <code>census.json</code> and the <code>.dt.jsonl</code> traces. They are deliberately not inlined here.</p>
  </section>
</main>
</body></html>`;
}

function byFindings(a: TargetReport, b: TargetReport): number {
  const rank = (t: TargetReport) => -(t.counts.violation * 10 + t.counts.fail);
  return rank(a) - rank(b) || a.label.localeCompare(b.label);
}

function summaryRow(t: TargetReport): string {
  const bad = t.counts.violation + t.counts.fail > 0;
  return `<tr>
    <td>${bad ? `<a href="#${esc(t.id)}">${esc(t.label)}</a>` : esc(t.label)}<div class="dim">${esc(t.serverName)} ${esc(t.serverVersion)}</div></td>
    <td class="n dim">${t.monthlyDownloads == null ? "" : t.monthlyDownloads.toLocaleString("en-US")}</td>
    <td class="n">${t.toolCount}</td>
    <td class="n">${t.exercisedCount}</td>
    <td class="n ${t.counts.violation ? "bad" : "dim"}">${t.counts.violation}</td>
    <td class="n ${countCodes(t, UPSTREAM_CODES) ? "warn" : "dim"}">${countCodes(t, UPSTREAM_CODES)}</td>
    <td class="n ${countCodes(t, DOUBLING_CODES) ? "warn" : "dim"}">${countCodes(t, DOUBLING_CODES)}</td>
    <td class="n ${countCodes(t, ANSWER_CODES) ? "warn" : "dim"}">${countCodes(t, ANSWER_CODES)}</td>
    <td class="n ok">${t.counts.pass}</td>
  </tr>`;
}

function renderTarget(t: TargetReport): string {
  const f = findings(t);
  return `<details id="${esc(t.id)}" class="tgt"${f.some((v) => v.status === "violation") ? " open" : ""}>
  <summary><span class="tname">${esc(t.label)}</span> <span class="dim">${f.length} ${f.length === 1 ? "finding" : "findings"}</span></summary>
  <ul class="findings">${f.map(renderFinding).join("\n")}</ul>
</details>`;
}

function renderFinding(v: VerdictRecord): string {
  return `<li class="finding ${v.status}">
    <div class="fh">${v.status === "violation" ? ICON.bad : ICON.warn}
      <code class="tool">${esc(v.tool)}</code>
      <span class="tag">${esc(v.probe)}</span>${v.code ? `<span class="tag">${esc(v.code)}</span>` : ""}
    </div>
    <p class="claim">${esc(v.claim)}</p>
  </li>`;
}

function determinismLine(c: Census): string {
  if (!c.determinism) return `<span class="dim">not checked in this run</span>`;
  const d = c.determinism;
  return `${d.unexplainedDrift === 0 ? ICON.ok : ICON.warn} ${d.records - d.unexplainedDrift} of ${d.records} records identical across two runs of the same seed${
    d.volatile.length ? `, ${d.volatile.length} learned volatile ${d.volatile.length === 1 ? "path" : "paths"}` : ""
  }`;
}

const ICON = {
  ok: `<svg class="ic ok" viewBox="0 0 16 16" width="14" height="14" aria-hidden="true"><path d="M2 8.5l4 4L14 4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  warn: `<svg class="ic warn" viewBox="0 0 16 16" width="14" height="14" aria-hidden="true"><path d="M8 1.5l6.5 12h-13z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><path d="M8 6v3.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/><circle cx="8" cy="11.6" r=".9" fill="currentColor"/></svg>`,
  bad: `<svg class="ic bad" viewBox="0 0 16 16" width="14" height="14" aria-hidden="true"><circle cx="8" cy="8" r="6.5" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M5.5 5.5l5 5M10.5 5.5l-5 5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>`,
};

const CSS = `
:root{--bg:#fbfbfa;--fg:#1b1b19;--dim:#6b6b66;--line:#e3e2de;--card:#fff;--ok:#1f7a45;--warn:#9a6400;--bad:#a32020}
@media (prefers-color-scheme:dark){:root{--bg:#131313;--fg:#eceae5;--dim:#9a9891;--line:#2b2b29;--card:#1a1a19;--ok:#5fbb85;--warn:#d6a441;--bad:#e07a7a}}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--fg);font:15px/1.6 ui-sans-serif,-apple-system,"Segoe UI",Roboto,Helvetica,Arial,sans-serif}
.wrap{max-width:62rem;margin:0 auto;padding:0 1.5rem}
.hd{border-bottom:1px solid var(--line);padding:3rem 0 2rem;background:var(--card)}
h1{margin:0;font-size:1.9rem;letter-spacing:-.02em}
.sub{margin:.4rem 0 1rem;color:var(--dim);max-width:46rem}
.lede{margin:0 0 1.6rem;max-width:46rem;font-size:1.02rem}
.meta{display:grid;grid-template-columns:repeat(auto-fit,minmax(13rem,1fr));gap:.9rem;margin:0}
.meta div{margin:0}
.meta dt{font-size:.72rem;text-transform:uppercase;letter-spacing:.06em;color:var(--dim)}
.meta dd{margin:.15rem 0 0;font-size:.9rem}
main section{padding:2.4rem 0;border-bottom:1px solid var(--line)}
h2{font-size:1.15rem;margin:0 0 1rem;letter-spacing:-.01em}
table.grid{width:100%;border-collapse:collapse;font-size:.88rem}
table.grid th,table.grid td{text-align:left;padding:.5rem .7rem;border-bottom:1px solid var(--line);vertical-align:top}
table.grid th{font-size:.7rem;text-transform:uppercase;letter-spacing:.06em;color:var(--dim);font-weight:600}
td.n,th.n{text-align:right;font-variant-numeric:tabular-nums}
a{color:inherit}
code{font:.85em ui-monospace,SFMono-Regular,Menlo,monospace;background:var(--card);border:1px solid var(--line);border-radius:3px;padding:.05em .35em}
.dim{color:var(--dim);font-size:.85em}
.ok{color:var(--ok)}.warn{color:var(--warn)}.bad{color:var(--bad)}
.note{color:var(--dim);font-size:.85rem;max-width:46rem}
.clean{display:flex;gap:.5rem;align-items:center;color:var(--dim)}
.inert{line-height:2.1}
details.tgt{border:1px solid var(--line);border-radius:5px;background:var(--card);margin:0 0 .6rem;padding:.2rem .9rem}
details.tgt summary{cursor:pointer;padding:.55rem 0;font-size:.92rem}
.tname{font-weight:600}
ul.findings{list-style:none;margin:0 0 .8rem;padding:0;display:grid;gap:.6rem}
li.finding{border-left:3px solid var(--warn);padding:.15rem 0 .15rem .8rem}
li.finding.violation{border-left-color:var(--bad)}
.fh{display:flex;align-items:center;gap:.45rem;flex-wrap:wrap}
.tool{font-weight:600;background:transparent;border:0;padding:0}
.tag{font-size:.66rem;text-transform:uppercase;letter-spacing:.05em;color:var(--dim);border:1px solid var(--line);border-radius:99px;padding:.08rem .45rem}
.claim{margin:.35rem 0 0;font-size:.92rem}
.ic{vertical-align:-2px;flex:none}
`;

function esc(s: unknown): string {
  return String(s).replace(/[&<>"]/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[ch]!);
}
