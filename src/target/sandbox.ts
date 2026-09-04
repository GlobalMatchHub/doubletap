import { mkdtempSync, mkdirSync, rmSync, writeFileSync, symlinkSync, existsSync, realpathSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";

/**
 * A disposable directory the target server is pointed at and confined to.
 *
 * Without this the filesystem oracle would hash the developer's home
 * directory, and every unrelated write on the machine would read as a side
 * effect of the tool under test.
 */
export class Sandbox {
  readonly root: string;
  readonly workspace: string;

  constructor(label: string) {
    const raw = mkdtempSync(join(tmpdir(), `doubletap-${label}-`));
    // macOS's tmpdir() is a symlink (/var -> /private/var). A tool that
    // canonicalises its own allowed root with realpath and then compares an
    // unresolved incoming path against it rejects every path this harness
    // hands it, reading as "outside the sandbox" when it is the same
    // directory under a different spelling. Resolving once, here, means every
    // path built from `root` or `workspace` afterwards -- argv, fixtures,
    // credential files, the oracle's own walk -- already matches whatever a
    // realpath-based check computes, and no caller has to think about it.
    this.root = realpathSync(raw);
    this.workspace = join(this.root, "workspace");
    mkdirSync(this.workspace, { recursive: true });
    // A cache and a temp directory outside the workspace: state a server puts
    // there is genuinely throwaway and should not read as a side effect.
    mkdirSync(join(this.root, "tmp"), { recursive: true });
    mkdirSync(join(this.root, "cache"), { recursive: true });
  }

  /** Deterministic starting content, so every run begins from the same state. */
  seedFixture(files: Record<string, string>): void {
    for (const [rel, content] of Object.entries(files)) {
      const abs = join(this.workspace, rel);
      mkdirSync(dirname(abs), { recursive: true });
      writeFileSync(abs, content);
    }
  }

  /**
   * Copies a package into the sandbox and points module resolution back at the
   * shared install.
   *
   * Plenty of servers persist their state next to their own code rather than
   * anywhere configurable. Left alone, those writes land in node_modules:
   * outside the snapshot, so invisible, and shared between cases, so not
   * isolated. Under confinement they fail outright, which reads as "this
   * server needs credentials" when it needs nothing of the kind.
   *
   * On APFS this is a clone rather than a copy, so it costs almost nothing per
   * case. The node_modules symlink is read-only in practice because the
   * confinement profile only grants writes inside the sandbox.
   */
  preparePackage(packageDir: string, nodeModulesDir: string): string {
    const dest = join(this.root, "pkg");
    try {
      execFileSync("cp", ["-Rc", packageDir, dest], { stdio: "ignore" });
    } catch {
      execFileSync("cp", ["-R", packageDir, dest], { stdio: "ignore" });
    }
    const link = join(this.root, "node_modules");
    if (!existsSync(link)) symlinkSync(nodeModulesDir, link, "dir");
    return dest;
  }

  dispose(): void {
    try {
      rmSync(this.root, { recursive: true, force: true });
    } catch {}
  }
}
