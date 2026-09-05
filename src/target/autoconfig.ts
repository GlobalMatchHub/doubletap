import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { StdioTransport } from "../transport/stdio.ts";
import { McpSession } from "../session/client.ts";
import { Sandbox } from "./sandbox.ts";
import { sandboxEnv, type TargetConfig } from "./registry.ts";
import { confine } from "./confine.ts";
import { credentialEnv } from "./credentials.ts";
import { TraceWriter } from "../trace/writer.ts";
import { VirtualClock } from "../det/clock.ts";
import { tmpdir } from "node:os";

/**
 * Works out how to start an arbitrary published MCP server, by trying.
 *
 * There is no manifest that says "this server takes a directory argument" or
 * "this one wants the word stdio". Rather than hand-configure dozens of
 * packages and quietly bias the census toward the ones that were easy, the
 * harness walks a short ladder of invocations and keeps the first that
 * completes initialize and lists at least one tool.
 */

/** The sandbox workspace is a placeholder here so the winning invocation can
 *  be stored and replayed against a different sandbox later. */
export const WORKSPACE = "{{workspace}}";

const ARGV_LADDER: string[][] = [
  // The workspace argument goes first: a server that needs a directory cannot
  // start without one, and a server that does not need one almost always
  // ignores the extra argument rather than refusing to start.
  [WORKSPACE],
  [],
  ["stdio"],
  ["--stdio"],
  ["--transport", "stdio"],
  ["serve"],
  ["--directory", WORKSPACE],
  ["--root", WORKSPACE],
];

export function expandArgv(argv: string[], workspace: string): string[] {
  return argv.map((a) => (a === WORKSPACE ? workspace : a));
}

export const GENERIC_FIXTURE: Record<string, string> = {
  "note.txt": "hello\n",
  "data/rows.csv": "id,name\n1,a\n2,b\n",
  "nested/deep/leaf.txt": "leaf\n",
};

export interface AutoProbeResult {
  name: string;
  version: string;
  binName: string;
  binPath: string;
  /** Executable path relative to the package directory. */
  binRel: string;
  packageDir: string;
  ok: boolean;
  argv: string[];
  toolCount: number;
  toolNames: string[];
  serverName: string;
  serverVersion: string;
  /** Why it was rejected, when it was. */
  reason?: string;
  stderr?: string;
}

interface PkgBin {
  binName: string;
  binPath: string;
  binRel: string;
  packageDir: string;
  version: string;
}

/** Reads the installed package's own manifest for its executable. */
export function resolveBin(serversDir: string, name: string): PkgBin | null {
  const pkgPath = join(serversDir, "node_modules", name, "package.json");
  if (!existsSync(pkgPath)) return null;
  let pkg: { version?: string; bin?: string | Record<string, string> };
  try {
    pkg = JSON.parse(readFileSync(pkgPath, "utf8"));
  } catch {
    return null;
  }
  if (!pkg.bin) return null;
  const map = typeof pkg.bin === "string" ? { [name]: pkg.bin } : pkg.bin;
  // Prefer a bin whose name looks like the server itself over a helper CLI.
  const keys = Object.keys(map).sort((a, b) => scoreBin(b, name) - scoreBin(a, name));
  const key = keys[0];
  if (!key) return null;
  const rel = map[key]!;
  const packageDir = resolve(serversDir, "node_modules", name);
  const abs = resolve(packageDir, rel);
  if (!existsSync(abs)) return null;
  return { binName: key, binPath: abs, binRel: rel.replace(/^\.\//, ""), packageDir, version: pkg.version ?? "" };
}

function scoreBin(binName: string, pkgName: string): number {
  const short = pkgName.split("/").pop() ?? pkgName;
  let s = 0;
  if (binName === short || binName === pkgName) s += 3;
  if (/mcp|server/i.test(binName)) s += 2;
  if (/^(dev|build|test|lint|codegen)$/i.test(binName)) s -= 5;
  return s;
}

/**
 * Tries the ladder. Every rung gets a fresh sandbox and a fresh process; a
 * server that half-started and wrote something is not allowed to influence
 * the next attempt.
 */
export async function probePackage(
  serversDir: string,
  name: string,
  opts: { initTimeoutMs?: number } = {},
): Promise<AutoProbeResult> {
  const bin = resolveBin(serversDir, name);
  const base: AutoProbeResult = {
    name,
    version: bin?.version ?? "",
    binName: bin?.binName ?? "",
    binPath: bin?.binPath ?? "",
    binRel: bin?.binRel ?? "",
    packageDir: bin?.packageDir ?? "",
    ok: false,
    argv: [],
    toolCount: 0,
    toolNames: [],
    serverName: "",
    serverVersion: "",
  };
  if (!bin) return { ...base, reason: "not installed, or no executable in the package" };

  let lastStderr = "";
  // A process that stays up but never answers is not a stdio server at all,
  // usually an HTTP one. Two of those and the ladder is abandoned, because
  // walking the remaining rungs costs the full timeout every time and turns a
  // census into an overnight job.
  let silentButAlive = 0;

  for (const argvTemplate of ARGV_LADDER) {
    if (silentButAlive >= 2) {
      return { ...base, reason: "process stays up but never answers initialize; not a stdio server", stderr: lastStderr.slice(-400) };
    }
    const sandbox = new Sandbox(`probe-${name.replace(/[^a-z0-9]+/gi, "-")}`);
    sandbox.seedFixture(GENERIC_FIXTURE);
    // A throwaway trace: this stage is discovery, not evidence.
    const trace = TraceWriter.discarding(new VirtualClock());
    const argv = argvTemplate;
    // The package is cloned in even during discovery, so a server is judged
    // under exactly the conditions the census will run it in.
    const pkgCopy = sandbox.preparePackage(bin.packageDir, join(serversDir, "node_modules"));
    const c = confine(["node", join(pkgCopy, bin.binRel), ...expandArgv(argv, sandbox.workspace)], sandbox);
    const creds = credentialEnv(bin.packageDir);
    const transport = new StdioTransport({
      cmd: c.cmd,
      cwd: sandbox.workspace,
      env: { ...sandboxEnv(sandbox), ...c.env, ...creds },
    });
    const session = new McpSession(transport, trace, new VirtualClock());
    try {
      await session.start();
      const init = await session.initialize(opts.initTimeoutMs ?? 5_000);
      if (!init.answered || init.error) {
        if (init.timedOut && session.alive) silentButAlive++;
        lastStderr = session.stderr.slice(-600);
        continue;
      }
      const tools = await session.listTools(8_000);
      if (tools.length === 0) {
        lastStderr = session.stderr.slice(-600);
        continue;
      }
      const info = (session.serverInfo ?? {}) as { name?: string; version?: string };
      return {
        ...base,
        ok: true,
        argv,
        toolCount: tools.length,
        toolNames: tools.map((t) => t.name),
        serverName: info.name ?? "",
        serverVersion: info.version ?? "",
      };
    } catch (e) {
      lastStderr = `${String(e instanceof Error ? e.message : e)} ${session.stderr.slice(-400)}`;
    } finally {
      await session.close().catch(() => {});
      await trace.close().catch(() => {});
      sandbox.dispose();
    }
  }

  return {
    ...base,
    reason: "no invocation completed initialize and listed a tool",
    stderr: lastStderr.trim().slice(-600),
  };
}

/** Turns a successful probe into a target the runner can drive. */
export function toTargetConfig(p: AutoProbeResult, serversDir: string): TargetConfig {
  const argvTemplate = p.argv;
  return {
    id: p.name.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, ""),
    label: p.name,
    source: `npm:${p.name}${p.version ? `@${p.version}` : ""}`,
    version: p.version,
    cmd: (sb) => ["node", join(sb.root, "pkg", p.binRel), ...expandArgv(argvTemplate, sb.workspace)],
    fixture: GENERIC_FIXTURE,
    oracle: "fs",
    packageDir: p.packageDir,
    binRel: p.binRel,
    nodeModulesDir: join(serversDir, "node_modules"),
    // Read out of the package's own source, so a server that guards on an API
    // key gets past the guard and reaches the code that issues the request.
    env: () => credentialEnv(p.packageDir),
    notes: `auto-configured; ${p.serverName || "unnamed server"} ${p.serverVersion}`.trim(),
  };
}

/**
 * Servers deliberately left out of the census, with the reason.
 *
 * Two kinds. Some drive something outside the sandbox -- a real browser, an
 * SSH session, the developer's simulator, a wallet -- where an interrupted
 * call has consequences this harness has no business causing and no oracle
 * that can see them. Others would make real network requests on every probe,
 * which breaks the rule that a census costs nothing to run.
 *
 * The list is explicit rather than a name pattern so a reader can argue with
 * each entry.
 */
export const EXCLUDED: Record<string, string> = {
  "ssh-mcp": "opens outbound SSH sessions",
  "playwright-mcp": "drives a real browser and browses the live web",
  "@browsermcp/mcp": "drives the developer's own browser",
  "@agentdeskai/browser-tools-mcp": "drives the developer's own browser",
  "figma-console-mcp": "drives a real browser against figma.com",
  "ios-simulator-mcp": "drives the developer's iOS simulator",
  "@metamask/device-mcp": "talks to a wallet",
  "@wonderwhy-er/desktop-commander": "executes shell commands outside the sandbox",
  "opencode-mcp": "runs a coding agent with its own tool access",
  "@tokenizin/mcp-npx-fetch": "fetches arbitrary live URLs on every call",
  "mcp-searxng": "queries a live search engine on every call",
  "@ericthered926/duckduckgo-mcp-server": "queries a live search engine on every call",
  "exa-mcp-server": "queries a live search API on every call",
  "tavily-mcp": "queries a live search API on every call",
  "dataforseo-mcp-server": "queries a live API on every call",
  "browser-devtools-mcp": "requires a real Chrome/Playwright binary, not a credential",
  "@hisma/server-puppeteer": "requires a real Chrome binary, not a credential",
  "apple-mail-mcp": "drives the real macOS Mail.app against real mailbox data",
};

export const DEFAULT_SERVERS_DIR = resolve("servers");
