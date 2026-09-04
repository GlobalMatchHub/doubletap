import { writeFileSync, mkdirSync, chmodSync, realpathSync } from "node:fs";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
import type { Sandbox } from "./sandbox.ts";

/**
 * Confinement for the code under test.
 *
 * The census runs published packages nobody has audited. Redirecting HOME and
 * the XDG directories keeps their files inside a disposable tree, but it does
 * nothing about a server that decides to open a browser for an OAuth flow, or
 * to call a live API on every tool call. One of them did exactly that, which
 * is what this module exists to prevent.
 *
 * Two layers, because either alone has a hole:
 *
 *   sandbox-exec  denies network, denies writes outside the sandbox, and
 *                 denies executing anything but node. This catches a server
 *                 that spawns /usr/bin/open by absolute path.
 *   PATH shims    no-op stand-ins for the browser launchers, so a library that
 *                 resolves "open" through PATH gets a silent success instead
 *                 of an EPERM it might report as a tool failure.
 *
 * macOS only. Elsewhere `available` is false and the caller must say so in the
 * report rather than quietly running unconfined.
 */

export const available = process.platform === "darwin";

const LAUNCHERS = [
  "open",
  "xdg-open",
  "start",
  "google-chrome",
  "chromium",
  "firefox",
  "safari",
  "sensible-browser",
  "x-www-browser",
  "wslview",
];

/** Writes the shim directory and returns its path. */
function writeShims(sandbox: Sandbox): string {
  const dir = join(sandbox.root, "shim-bin");
  mkdirSync(dir, { recursive: true });
  for (const name of LAUNCHERS) {
    const p = join(dir, name);
    writeFileSync(p, "#!/bin/sh\n# doubletap: browser launch suppressed\nexit 0\n");
    chmodSync(p, 0o755);
  }
  return dir;
}

function writeProfile(sandbox: Sandbox, nodeBin: string): string {
  const roots = new Set<string>([sandbox.root]);
  try {
    roots.add(realpathSync(sandbox.root));
  } catch {}
  const writable = [...roots].map((r) => `  (subpath ${JSON.stringify(r)})`).join("\n");
  const profile = `(version 1)
(deny default)
(allow process-fork)
(allow signal (target self))
(allow sysctl-read)
(allow mach*)
(allow ipc-posix-shm)
(allow file-read*)
(allow file-write*
${writable}
  (literal "/dev/null")
  (literal "/dev/urandom"))
; Only the node binary may be executed. A server that shells out to a browser,
; a package manager or a helper binary is stopped here rather than trusted.
(allow process-exec (literal ${JSON.stringify(nodeBin)}))
(deny network*)
`;
  const path = join(sandbox.root, "confine.sb");
  writeFileSync(path, profile);
  return path;
}

export interface Confinement {
  cmd: string[];
  env: Record<string, string>;
  applied: boolean;
}

/**
 * Wraps a command so it runs confined, and returns the environment additions
 * that go with it.
 */
export function confine(cmd: string[], sandbox: Sandbox): Confinement {
  const shimDir = writeShims(sandbox);
  const env: Record<string, string> = {
    PATH: `${shimDir}:${process.env.PATH ?? ""}`,
    BROWSER: join(shimDir, "open"),
    // Widely respected by libraries that would otherwise try to open a window.
    DISPLAY: "",
    npm_config_yes: "true",
  };
  if (!available) return { cmd, env, applied: false };

  const nodeBin = cmd[0] === "node" ? process.execPath : cmd[0]!;
  const real = cmd[0] === "node" ? [process.execPath, ...cmd.slice(1)] : cmd;
  const profile = writeProfile(sandbox, nodeBin);
  return { cmd: ["/usr/bin/sandbox-exec", "-f", profile, ...real], env, applied: true };
}

/** One-off check that the profile actually denies what it claims to. */
export function selfTest(): { network: boolean; write: boolean; exec: boolean } {
  if (!available) return { network: false, write: false, exec: false };
  const probe = (script: string): string => {
    try {
      return String(
        execFileSync("/usr/bin/sandbox-exec", ["-f", SELFTEST_PROFILE, process.execPath, "-e", script], {
          encoding: "utf8",
          timeout: 15_000,
        }),
      ).trim();
    } catch (e) {
      return `threw ${String(e).slice(0, 60)}`;
    }
  };
  return {
    network: probe(NET_SCRIPT) === "blocked",
    write: probe(WRITE_SCRIPT) === "blocked",
    exec: probe(EXEC_SCRIPT) === "blocked",
  };
}

const SELFTEST_PROFILE = "/tmp/doubletap-selftest.sb";
const NET_SCRIPT = `fetch("https://registry.npmjs.org/").then(()=>console.log("allowed")).catch(()=>console.log("blocked"))`;
const WRITE_SCRIPT = `try{require("node:fs").writeFileSync(require("node:os").homedir()+"/.doubletap-escape","x");console.log("allowed")}catch{console.log("blocked")}`;
const EXEC_SCRIPT = `try{require("node:child_process").execFileSync("/usr/bin/open",["--version"]);console.log("allowed")}catch{console.log("blocked")}`;

export function writeSelfTestProfile(): void {
  if (!available) return;
  writeFileSync(
    SELFTEST_PROFILE,
    `(version 1)
(deny default)
(allow process-fork)
(allow signal (target self))
(allow sysctl-read)
(allow mach*)
(allow ipc-posix-shm)
(allow file-read*)
(allow file-write* (literal "/dev/null"))
(allow process-exec (literal ${JSON.stringify(process.execPath)}))
(deny network*)
`,
  );
}
