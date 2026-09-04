import { StdioTransport } from "../transport/stdio.ts";
import { McpSession } from "../session/client.ts";
import { FsOracle } from "../oracle/fs.ts";
import { Sandbox } from "../target/sandbox.ts";
import { copyFileSync, writeFileSync } from "node:fs";
import { UpstreamOracle } from "../oracle/upstream.ts";
import { join } from "node:path";
import { sandboxEnv, type TargetConfig } from "../target/registry.ts";
import { confine } from "../target/confine.ts";
import type { TraceWriter } from "../trace/writer.ts";
import type { VirtualClock } from "../det/clock.ts";
import type { CaseHandle } from "../probe/types.ts";

/**
 * Starts one isolated case: a fresh sandbox seeded to the fixture, a freshly
 * spawned server, and an initialised session.
 *
 * A case is never reused across probes. Servers keep in-memory state, and a
 * probe inheriting another probe's leftovers would attribute the wrong side
 * effect to the wrong tool.
 */
export async function openCase(
  target: TargetConfig,
  label: string,
  trace: TraceWriter,
  clock: VirtualClock,
): Promise<CaseHandle> {
  const sandbox = new Sandbox(`${target.id}-${label}`);
  sandbox.seedFixture(target.fixture);
  // Sandbox.root is already a realpath (see sandbox.ts), so this is the only
  // spelling of the path that can appear anywhere -- in argv, in a server's
  // own error messages, or in the frames it sends back.
  const placeholder = `<sandbox:${label}>`;
  trace.redact(sandbox.root, placeholder);
  // Clone the server's own package in, so state it writes beside its code is
  // observable and thrown away with the sandbox.
  if (target.packageDir && target.nodeModulesDir) {
    sandbox.preparePackage(target.packageDir, target.nodeModulesDir);
  }
  installInterceptor(sandbox);
  initNetLog(sandbox);
  const upstream = new UpstreamOracle(netLogPath(sandbox));

  const oracle = new FsOracle({
    root: sandbox.workspace,
    extraRoots: target.packageDir ? [{ label: "pkg", path: join(sandbox.root, "pkg") }] : [],
  });

  let session = await connect(target, sandbox, trace, clock);

  const handle: CaseHandle = {
    get session() {
      return session;
    },
    oracle,
    sandbox,
    async snap(snapLabel: string) {
      const s = await settledSnapshot(oracle);
      trace.write({
        k: "snap",
        label: snapLabel,
        oracle: s.snapshot.oracle,
        digest: s.snapshot.digest,
        confidence: s.snapshot.confidence,
        entries: s.snapshot.entries,
        settleMs: s.settleMs,
      });
      return s.snapshot;
    },
    upstream,
    async snapNet(snapLabel: string) {
      const s = await upstream.snapshot();
      trace.write({
        k: "snap",
        label: snapLabel,
        oracle: s.oracle,
        digest: s.digest,
        confidence: s.confidence,
        entries: s.entries,
      });
      return s;
    },
    async awaitExit(ms = 1500) {
      const deadline = Date.now() + ms;
      while (Date.now() < deadline) {
        if (!session.alive) return true;
        await sleep(25);
      }
      return !session.alive;
    },
    async restart() {
      await session.close();
      trace.write({ k: "note", level: "info", tool: label, msg: "server restarted on the same sandbox" });
      session = await connect(target, sandbox, trace, clock);
    },
    async dispose() {
      await session.close();
      sandbox.dispose();
    },
  } as CaseHandle;

  return handle;
}

async function connect(
  target: TargetConfig,
  sandbox: Sandbox,
  trace: TraceWriter,
  clock: VirtualClock,
): Promise<McpSession> {
  // Restored before every spawn, not only the first. Cheap, and it means a
  // missing or damaged interceptor cannot silently produce a case with no
  // request log at all.
  installInterceptor(sandbox);
  // Every target runs confined: no network, no writes outside the sandbox, no
  // executing anything but node.
  const c = confine(target.cmd(sandbox), sandbox);
  const transport = new StdioTransport({
    cmd: c.cmd,
    cwd: sandbox.workspace,
    env: {
      ...sandboxEnv(sandbox),
      ...c.env,
      ...interceptorEnv(sandbox, target),
      ...target.env?.(sandbox),
    },
  });
  const session = new McpSession(transport, trace, clock);
  await session.start();
  const init = await session.initialize();
  if (!init.answered) {
    await session.close();
    throw new Error(`target '${target.id}' did not complete initialize: ${JSON.stringify(init)}`);
  }
  return session;
}

/**
 * Takes a snapshot only once the tree has stopped moving.
 *
 * A tool call returning is not the same as a tool call finishing. Servers
 * answer and then flush: one writes its run directory hundreds of
 * milliseconds after replying, so snapshotting the instant the call resolved
 * saw one directory where four had been created. That asymmetry is worse than
 * it sounds, because a sequential run gets the gaps between calls for free
 * while a concurrent run does not, which manufactures a lost update out of
 * nothing but impatience. It produced exactly that false finding once.
 *
 * Waiting a fixed amount would be a guess. Instead the tree is sampled until
 * two consecutive reads agree, which costs a fast server almost nothing and
 * gives a slow one the time it actually needs. How long it took is recorded
 * on the snapshot, so a server that never settles is visible rather than
 * silently truncated.
 */
async function settledSnapshot(oracle: FsOracle, quietMs = 120, maxMs = 3000) {
  const started = Date.now();
  let previous = await oracle.snapshot();
  while (Date.now() - started < maxMs) {
    await sleep(quietMs);
    const next = await oracle.snapshot();
    if (next.digest === previous.digest) return { snapshot: next, settleMs: Date.now() - started };
    previous = next;
  }
  return { snapshot: previous, settleMs: Date.now() - started };
}

/** Where the outbound request log lives: outside the workspace, so writing to
 *  it is never mistaken for a side effect of the tool under test. */
export function netLogPath(sandbox: Sandbox): string {
  return join(sandbox.root, "net.jsonl");
}

/**
 * Copies the interceptor into the sandbox rather than referencing it in place,
 * so the repository's path never reaches the target's environment or a trace.
 */
/**
 * Restores the interceptor. Runs before every spawn, so it must not touch the
 * request log.
 *
 * These two used to be one function, and moving it to run on every restart
 * therefore truncated the log every time a case reconnected. The effect was
 * silent and expensive: the harness saw the log shrink, its own tamper
 * detector fired, the cached records were returned instead, and the retry
 * looked like it had sent nothing at all. 119 servers were reported as
 * deduplicating a write they had simply not been observed making.
 */
function installInterceptor(sandbox: Sandbox): string {
  // control/, not root: the target must not be able to rewrite the code that
  // watches it. NODE_OPTIONS re-reads this file on every restart, so a single
  // overwrite during the first case would have been enough.
  const dest = join(sandbox.control, "interceptor.mjs");
  copyFileSync(new URL("../net/interceptor.mjs", import.meta.url), dest);
  return dest;
}

/** Starts the request log empty. Once per case, never on a reconnect. */
function initNetLog(sandbox: Sandbox): void {
  writeFileSync(netLogPath(sandbox), "");
}

function interceptorEnv(sandbox: Sandbox, target: TargetConfig): Record<string, string> {
  return {
    // Loaded before the server's own code, so no request escapes unseen.
    NODE_OPTIONS: `--import ${join(sandbox.control, "interceptor.mjs")}`,
    DOUBLETAP_NET_LOG: netLogPath(sandbox),
    DOUBLETAP_NET_MODE: target.netMode ?? "synth",
    ...(target.cassette ? { DOUBLETAP_NET_CASSETTE: target.cassette } : {}),
  };
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}
