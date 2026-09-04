import { join } from "node:path";
import type { Sandbox } from "./sandbox.ts";

export interface TargetConfig {
  id: string;
  label: string;
  /** Where the code under test came from, for the published census. */
  source: string;
  version?: string;
  cmd: (sb: Sandbox) => string[];
  env?: (sb: Sandbox) => Record<string, string>;
  fixture: Record<string, string>;
  oracle: "fs";
  /**
   * The server's own installed directory. When set, it is cloned into the
   * sandbox per case and watched, so state a server writes beside its code is
   * both visible and disposable.
   */
  packageDir?: string;
  /** Path to the executable, relative to packageDir. */
  binRel?: string;
  /** Shared install root that the sandbox's node_modules symlink points at. */
  nodeModulesDir?: string;
  /** How the interceptor answers outbound requests. */
  netMode?: "synth" | "replay";
  /** Recorded upstream responses to replay, when there are any. */
  cassette?: string;
  /** Tools that would leave the sandbox or hang the run. */
  excludeTools?: string[];
  notes?: string;
}

const SERVERS = join(process.cwd(), "servers", "node_modules", "@modelcontextprotocol");

export const TARGETS: TargetConfig[] = [
  {
    // Ships with the repository so the harness can be shown working without
    // installing anything, and so its answer is known in advance: one tool
    // that must pass, one that must be reported as a contract violation, and
    // one decoy that moves the state on every call and must not be reported.
    id: "demo",
    label: "doubletap-demo-server",
    source: "fixtures/demo-server",
    cmd: (sb) => ["node", join(process.cwd(), "fixtures", "demo-server", "index.js"), sb.workspace],
    fixture: { "note.txt": "hello\n" },
    oracle: "fs",
    notes: "a fixture with a known answer, used by `doubletap demo`",
  },
  {
    id: "filesystem",
    label: "@modelcontextprotocol/server-filesystem",
    source: "npm:@modelcontextprotocol/server-filesystem",
    cmd: (sb) => ["node", join(SERVERS, "server-filesystem", "dist", "index.js"), sb.workspace],
    fixture: {
      "note.txt": "hello\n",
      "data/rows.csv": "id,name\n1,a\n2,b\n",
      "nested/deep/leaf.txt": "leaf\n",
    },
    oracle: "fs",
  },
  {
    id: "memory",
    label: "@modelcontextprotocol/server-memory",
    source: "npm:@modelcontextprotocol/server-memory",
    // The knowledge graph is persisted to one JSON file, so pointing that file
    // into the sandbox makes the filesystem oracle a true state oracle here.
    cmd: (sb) => ["node", join(SERVERS, "server-memory", "dist", "index.js"), sb.workspace],
    env: (sb) => ({ MEMORY_FILE_PATH: join(sb.workspace, "memory.json") }),
    fixture: { "memory.json": "" },
    oracle: "fs",
  },
  {
    id: "everything",
    label: "@modelcontextprotocol/server-everything",
    source: "npm:@modelcontextprotocol/server-everything",
    cmd: (sb) => ["node", join(SERVERS, "server-everything", "dist", "index.js"), "stdio"],
    fixture: { "note.txt": "hello\n" },
    oracle: "fs",
    // These block on user interaction or sleep for the length of the run.
    excludeTools: ["longRunningOperation", "elicitation", "sampleLLM", "startElicitation"],
    notes: "reference server; has no filesystem state, so it exercises the response-conformance probes only",
  },
];

/**
 * Environment every sandboxed server gets.
 *
 * Redirecting HOME, TMPDIR and the XDG directories into the sandbox is what
 * makes the filesystem oracle work for servers that were never told where to
 * put their state. A server that quietly writes to ~/.config lands inside the
 * snapshot instead of on the developer's machine, so its side effects are
 * observable and its mess is disposable.
 */
export function sandboxEnv(sb: Sandbox): Record<string, string> {
  return {
    HOME: sb.root,
    TMPDIR: `${sb.root}/tmp`,
    XDG_DATA_HOME: `${sb.workspace}/.local/share`,
    XDG_CONFIG_HOME: `${sb.workspace}/.config`,
    XDG_STATE_HOME: `${sb.workspace}/.local/state`,
    XDG_CACHE_HOME: `${sb.root}/cache`,
    NO_COLOR: "1",
    CI: "1",
  };
}

export function findTarget(id: string): TargetConfig {
  const t = TARGETS.find((x) => x.id === id);
  if (!t) throw new Error(`unknown target '${id}'. known: ${TARGETS.map((x) => x.id).join(", ")}`);
  return t;
}
