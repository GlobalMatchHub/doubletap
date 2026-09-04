// Installs candidate servers with scripts disabled. Batched, and a batch that
// fails is retried one package at a time so a single bad dependency tree does
// not take out nineteen good ones.
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { execFileSync } from "node:child_process";

const list = JSON.parse(readFileSync("scripts/candidates.servers.json", "utf8"));
const limit = Number(process.argv[2] ?? list.length);
const names = list.slice(0, limit).map((p) => p.name);

const installed = [];
const failed = [];

function npmInstall(pkgs) {
  execFileSync(
    "npm",
    ["install", "--prefix", "servers", "--ignore-scripts", "--no-audit", "--no-fund", "--legacy-peer-deps", "--silent", ...pkgs],
    { stdio: ["ignore", "ignore", "pipe"], timeout: 600_000 },
  );
}

const BATCH = 10;
for (let i = 0; i < names.length; i += BATCH) {
  const batch = names.slice(i, i + BATCH).filter((n) => !existsSync(`servers/node_modules/${n}/package.json`));
  if (batch.length === 0) continue;
  try {
    npmInstall(batch);
    installed.push(...batch);
  } catch {
    for (const one of batch) {
      try {
        npmInstall([one]);
        installed.push(one);
      } catch (e) {
        failed.push({ name: one, error: String(e.stderr ?? e).slice(0, 200) });
      }
    }
  }
  console.error(`  ${Math.min(i + BATCH, names.length)}/${names.length}  ok ${installed.length}  failed ${failed.length}`);
}

writeFileSync("scripts/install.result.json", JSON.stringify({ installed, failed }, null, 2));
console.error(`installed ${installed.length}, failed ${failed.length}`);
