// Fetches registry metadata for the top candidates and keeps the ones that
// actually look like a runnable server: a bin, and a dependency on the MCP SDK.
import { readFileSync, writeFileSync } from "node:fs";

const TOP = Number(process.argv[2] ?? 500);
const all = JSON.parse(readFileSync("scripts/candidates.raw.json", "utf8"));
const ranked = all.sort((a, b) => b.npmDownloads - a.npmDownloads).slice(0, TOP);

const out = [];
let done = 0;

async function fetchOne(c) {
  try {
    const res = await fetch(`https://registry.npmjs.org/${encodeURIComponent(c.name).replace("%40", "@")}/latest`);
    if (!res.ok) return null;
    const j = await res.json();
    const bin = j.bin ? (typeof j.bin === "string" ? { [j.name]: j.bin } : j.bin) : null;
    const deps = { ...(j.dependencies ?? {}), ...(j.peerDependencies ?? {}) };
    return {
      ...c,
      latest: j.version,
      bin: bin ? Object.keys(bin) : [],
      binMap: bin ?? {},
      usesSdk: Object.keys(deps).some((d) => d.startsWith("@modelcontextprotocol/")),
      hasInstallScript: Boolean(j.scripts?.postinstall || j.scripts?.install || j.scripts?.preinstall),
      deps: Object.keys(deps).slice(0, 40),
    };
  } catch {
    return null;
  }
}

const queue = ranked.slice();
const workers = Array.from({ length: 12 }, async () => {
  while (queue.length) {
    const c = queue.shift();
    const r = await fetchOne(c);
    done++;
    if (done % 100 === 0) console.error(`  ${done}/${ranked.length}`);
    if (r) out.push(r);
  }
});
await Promise.all(workers);

const servers = out.filter((p) => p.bin.length > 0 && p.usesSdk);
servers.sort((a, b) => b.npmDownloads - a.npmDownloads);
writeFileSync("scripts/candidates.servers.json", JSON.stringify(servers, null, 2));
console.error(`fetched ${out.length}, runnable MCP servers ${servers.length}`);
for (const s of servers.slice(0, 40)) console.error(`  ${String(s.npmDownloads).padStart(9)} ${s.name}`);
