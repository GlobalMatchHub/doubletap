// Pulls MCP server candidates from the public npm registry. No key, no cost.
import { writeFileSync } from "node:fs";

const QUERIES = [
  "keywords:mcp",
  "keywords:mcp-server",
  "keywords:modelcontextprotocol",
  "mcp server",
  "model context protocol server",
  "@modelcontextprotocol/server",
];

const seen = new Map();

for (const q of QUERIES) {
  for (let from = 0; from < 500; from += 250) {
    const url = `https://registry.npmjs.org/-/v1/search?text=${encodeURIComponent(q)}&size=250&from=${from}`;
    let json;
    try {
      const res = await fetch(url);
      if (!res.ok) break;
      json = await res.json();
    } catch (e) {
      console.error("query failed", q, String(e));
      break;
    }
    const objs = json.objects ?? [];
    for (const o of objs) {
      const p = o.package;
      if (!seen.has(p.name)) {
        seen.set(p.name, {
          name: p.name,
          version: p.version,
          description: p.description ?? "",
          date: p.date,
          keywords: p.keywords ?? [],
          score: o.score?.final ?? 0,
          npmDownloads: o.downloads?.monthly ?? null,
        });
      }
    }
    if (objs.length < 250) break;
  }
  console.error(`${q}: cumulative ${seen.size}`);
}

const all = [...seen.values()];
writeFileSync("scripts/candidates.raw.json", JSON.stringify(all, null, 2));
console.error(`total ${all.length} packages`);
