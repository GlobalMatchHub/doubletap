import type { Sandbox } from "../target/sandbox.ts";

/**
 * A registry of sandboxes and child processes that are currently alive.
 *
 * A census creates thousands of sandboxes and spawns a server in each. Any
 * throw between creating one and disposing of it used to strand the directory,
 * and a failed initialize is the normal case for a large fraction of
 * unaudited packages, so the leak was routine rather than exceptional: a run
 * left 22 directories and 375MB behind, one of them 181MB.
 *
 * Ctrl-C was worse. It removed nothing at all, because nothing was listening.
 */

const liveSandboxes = new Set<Sandbox>();
const liveKillers = new Set<() => void>();
let installed = false;

export function trackSandbox(sandbox: Sandbox): void {
  liveSandboxes.add(sandbox);
  install();
}

export function untrackSandbox(sandbox: Sandbox): void {
  liveSandboxes.delete(sandbox);
}

/** Registers something that kills a running child, for use on the way out. */
export function trackKiller(kill: () => void): () => void {
  liveKillers.add(kill);
  install();
  return () => liveKillers.delete(kill);
}

/**
 * Best effort, synchronous, and deliberately quiet.
 *
 * This runs from signal handlers and from process exit, where an async
 * cleanup would simply not happen and a throw would replace the real reason
 * for exiting with a confusing one.
 */
export function cleanUpEverything(): void {
  for (const kill of liveKillers) {
    try {
      kill();
    } catch {}
  }
  liveKillers.clear();
  for (const sandbox of liveSandboxes) {
    try {
      sandbox.dispose();
    } catch {}
  }
  liveSandboxes.clear();
}

function install(): void {
  if (installed) return;
  installed = true;

  process.on("exit", cleanUpEverything);

  for (const signal of ["SIGINT", "SIGTERM", "SIGHUP"] as const) {
    process.on(signal, () => {
      cleanUpEverything();
      // Re-raise with the default handler so the exit status is the one the
      // shell expects rather than a plain zero.
      process.exit(signal === "SIGINT" ? 130 : 143);
    });
  }

  // A multi-hour run must not be lost to one stray rejection from a server's
  // own code. It is reported and the run continues; a genuinely fatal error
  // still surfaces through the normal path.
  process.on("unhandledRejection", (reason) => {
    console.error(`unhandled rejection (continuing): ${String(reason).slice(0, 300)}`);
  });
}
