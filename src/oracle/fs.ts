import { createHash } from "node:crypto";
import { readdir, readFile, lstat, readlink } from "node:fs/promises";
import { join, relative, sep } from "node:path";
import type { Oracle, Snapshot } from "./types.ts";
import type { SnapshotEntry } from "../trace/types.ts";

export interface OracleRoot {
  /** Prefix used in entry paths, so two roots never collide. */
  label: string;
  path: string;
  maxEntries?: number;
}

export interface FsOracleOptions {
  root: string;
  /** Extra trees to watch, such as a server's own package directory. */
  extraRoots?: OracleRoot[];
  /** Directory names never descended into. */
  ignoreDirs?: string[];
  maxFileBytes?: number;
  maxEntries?: number;
}

const DEFAULT_IGNORE = ["node_modules", ".git", ".DS_Store"];

/**
 * Paths the harness caused itself, which must never count as state.
 *
 * Synthesized credentials carry a marker (see credentials.ts), and a server
 * that uses one of those values as a filename produces a file that exists only
 * because Doubletap put a fake value in its environment. Counting it as a side
 * effect of the tool under test turned a log write into a reported contract
 * violation, eight times over, in one census.
 */
const SELF_INFLICTED = /doubletap-placeholder|doubletap\.invalid|doubletap@example/;

/**
 * Filesystem oracle.
 *
 * Hashes the sandbox tree so that "did this call change anything?" is one
 * string comparison. Content is hashed, not mtime: a server that rewrites the
 * same bytes has not changed the state a user cares about, and counting that
 * as a side effect would fill the census with false positives. mtime is
 * recorded separately as a weak signal, never as part of the digest.
 */
export class FsOracle implements Oracle {
  readonly name = "fs";
  readonly confidence = "observed" as const;
  #opts: Required<FsOracleOptions>;

  constructor(opts: FsOracleOptions) {
    this.#opts = {
      ignoreDirs: DEFAULT_IGNORE,
      maxFileBytes: 4 * 1024 * 1024,
      maxEntries: 20_000,
      extraRoots: [],
      ...opts,
    };
  }

  async snapshot(): Promise<Snapshot> {
    const entries: SnapshotEntry[] = [];
    await this.#walk(this.#opts.root, this.#opts.root, "", entries, this.#opts.maxEntries);
    for (const extra of this.#opts.extraRoots ?? []) {
      await this.#walk(extra.path, extra.path, `${extra.label}:`, entries, extra.maxEntries ?? 4000);
    }
    // Sort by path so the merkle root does not depend on readdir order,
    // which differs between filesystems.
    entries.sort((a, b) => a.p.localeCompare(b.p));
    const h = createHash("sha256");
    for (const e of entries) h.update(`${e.kind}\0${e.p}\0${e.h}\0${e.sz ?? ""}\n`);
    return {
      oracle: this.name,
      confidence: this.confidence,
      digest: "sha256:" + h.digest("hex").slice(0, 32),
      entries,
    };
  }

  async #walk(dir: string, root: string, prefix: string, out: SnapshotEntry[], cap: number): Promise<void> {
    if (out.length >= cap) return;
    let names: string[];
    try {
      names = await readdir(dir);
    } catch {
      // A directory that cannot be listed is not an empty directory. Recording
      // it keeps a permission error from reading as "the tool changed
      // nothing", which is a false pass rather than a lost log line.
      out.push({ p: prefix + relative(root, dir).split(sep).join("/") + "/", kind: "dir", h: "unreadable" });
      return;
    }
    for (const name of names.sort()) {
      if (this.#opts.ignoreDirs.includes(name)) continue;
      if (SELF_INFLICTED.test(name)) continue;
      const abs = join(dir, name);
      const rel = prefix + relative(root, abs).split(sep).join("/");
      let st;
      try {
        st = await lstat(abs);
      } catch {
        out.push({ p: rel, kind: "file", h: "unreadable" });
        continue;
      }
      if (st.isSymbolicLink()) {
        // A symlink's target is state. Servers that "write" by relinking would
        // otherwise look inert.
        let target = "";
        try {
          target = await readlink(abs);
        } catch {}
        out.push({ p: rel, kind: "symlink", h: hashString(`->${target}`) });
      } else if (st.isDirectory()) {
        // Directories are recorded so that an empty mkdir still registers.
        out.push({ p: rel + "/", kind: "dir", h: hashString("dir") });
        await this.#walk(abs, root, prefix, out, cap);
      } else if (st.isFile()) {
        out.push({
          p: rel,
          kind: "file",
          sz: st.size,
          h:
            st.size > this.#opts.maxFileBytes
              ? hashString(`oversize:${st.size}`)
              : await hashFileOrMark(abs),
        });
      }
    }
  }
}

/** An unreadable file is recorded as unreadable rather than skipped, so it
 *  cannot silently look like no change. */
async function hashFileOrMark(abs: string): Promise<string> {
  try {
    return hashBuffer(await readFile(abs));
  } catch {
    return "unreadable";
  }
}

function hashString(s: string): string {
  return createHash("sha256").update(s).digest("hex").slice(0, 16);
}
function hashBuffer(b: Buffer): string {
  return createHash("sha256").update(b).digest("hex").slice(0, 16);
}
