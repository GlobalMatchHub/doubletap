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
  /**
   * Harness-owned files the target must never be able to write.
   *
   * The confinement profile, the interceptor and the PATH shims all live
   * here. They used to sit directly in root alongside the workspace, which
   * the profile grants the target write access to, so the target could
   * overwrite the very profile that confines it and the very code that
   * watches it. The next restart would then read the target's version.
   */
  readonly control: string;

  constructor(label: string) {
    // The label reaches a path, and callers pass things like scoped package
    // names, so anything that is not path-safe is flattened here rather than
    // at each call site. A slash in a label used to throw ENOENT from
    // mkdtemp, which reads as the sandbox being unavailable.
    const safe = label.replace(/[^A-Za-z0-9._-]+/g, "-").slice(0, 60);
    const raw = mkdtempSync(join(tmpdir(), `doubletap-${safe}-`));
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
    this.control = join(this.root, "control");
    mkdirSync(this.control, { recursive: true });
    // A cache and a temp directory outside the workspace: state a server puts
    // there is genuinely throwaway and should not read as a side effect.
    mkdirSync(join(this.root, "tmp"), { recursive: true });
    mkdirSync(join(this.root, "cache"), { recursive: true });
  }

  /**
   * The only paths the target is allowed to write.
   *
   * Deliberately not the whole root: control/ holds the profile and the
   * interceptor, and granting write to root handed the target the ability to
   * disable both.
   */
  writablePaths(): string[] {
    return [this.workspace, join(this.root, "pkg"), join(this.root, "tmp"), join(this.root, "cache")];
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
