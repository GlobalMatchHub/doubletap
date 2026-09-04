import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, extname } from "node:path";

/**
 * Fills in the environment variables a server refuses to start or run without.
 *
 * Most of the servers that could not be exercised offline fail for a dull
 * reason: they read an API key out of the environment and throw before doing
 * anything. With the interceptor answering every request there is nothing for
 * a real key to authenticate against, so a syntactically plausible fake is
 * enough to get past the guard and reach the code that actually issues the
 * request.
 *
 * The names are read out of the package's own source rather than guessed, and
 * only names that look like a credential are filled. Runtime variables that
 * change behaviour are never touched: setting NODE_ENV or PATH here would
 * change what is being measured.
 */

const CREDENTIAL_RE = /(KEY|TOKEN|SECRET|PASSWORD|PASSWD|API|AUTH|CREDENTIAL|ACCESS|PRIVATE|CLIENT_ID|ACCOUNT|TENANT|ORG|PROJECT|WORKSPACE|DSN|ENDPOINT|BASE_?URL|HOST|REGION|BUCKET|DATABASE|CONNECTION)/;

/** Variables whose value is part of the environment under test, not a secret. */
const NEVER_SET = new Set([
  "PATH",
  "HOME",
  "TMPDIR",
  "NODE_ENV",
  "NODE_OPTIONS",
  "NODE_PATH",
  "CI",
  "DISPLAY",
  "BROWSER",
  "SHELL",
  "TERM",
  "LANG",
  "PWD",
  "USER",
  "DEBUG",
  "NO_COLOR",
  "FORCE_COLOR",
  "npm_config_yes",
  "XDG_DATA_HOME",
  "XDG_CONFIG_HOME",
  "XDG_STATE_HOME",
  "XDG_CACHE_HOME",
  "DOUBLETAP_NET_LOG",
  "DOUBLETAP_NET_MODE",
  "DOUBLETAP_NET_CASSETTE",
]);

const ENV_REF = /process\.env(?:\.([A-Z][A-Z0-9_]{2,64})|\[\s*["'`]([A-Z][A-Z0-9_]{2,64})["'`]\s*\])/g;

/** Destructuring out of process.env, e.g. `const { NAME } = process.env`. */
const ENV_DESTRUCTURE_RE = /(?:export\s+)?(?:const|let|var)\s*\{([^}]{0,400})\}\s*=\s*process\.env/g;

/**
 * A last-resort net: an ALL_CAPS identifier that looks like a credential name,
 * quoted as a string literal anywhere in the source.
 *
 * Some servers route configuration through a generic `config.get("NAME")` or
 * a schema object rather than touching `process.env` directly in the file
 * that names the variable, and the literal name still has to appear
 * somewhere for the value to ever reach the process. This is filtered by the
 * same credential-shaped-name check as everything else, and a name that
 * matches but is never actually read just sets an inert, unused variable --
 * cheap enough that the extra recall is worth the noise.
 */
const QUOTED_NAME_RE = /["'`]([A-Z][A-Z0-9]*(?:_[A-Z0-9]+){1,8})["'`]/g;

export function discoverEnvNames(packageDir: string, maxFiles = 200): string[] {
  const found = new Set<string>();
  let scanned = 0;

  const walk = (dir: string, depth: number): void => {
    if (scanned >= maxFiles || depth > 4) return;
    let names: string[];
    try {
      names = readdirSync(dir);
    } catch {
      return;
    }
    for (const name of names) {
      if (scanned >= maxFiles) return;
      if (name === "node_modules" || name.startsWith(".")) continue;
      const abs = join(dir, name);
      let st;
      try {
        st = statSync(abs);
      } catch {
        continue;
      }
      if (st.isDirectory()) {
        walk(abs, depth + 1);
      } else if ([".js", ".mjs", ".cjs"].includes(extname(name)) && st.size < 6 * 1024 * 1024) {
        scanned++;
        try {
          const src = readFileSync(abs, "utf8");
          for (const m of src.matchAll(ENV_REF)) {
            const n = m[1] ?? m[2];
            if (n) found.add(n);
          }
          for (const m of src.matchAll(ENV_DESTRUCTURE_RE)) {
            for (const part of m[1]!.split(",")) {
              // Each item may be `NAME`, `NAME: alias`, or `NAME = default`.
              const n = part.trim().split(/[:=]/)[0]!.trim();
              if (/^[A-Z][A-Z0-9_]{2,64}$/.test(n)) found.add(n);
            }
          }
          for (const m of src.matchAll(QUOTED_NAME_RE)) {
            const n = m[1]!;
            if (CREDENTIAL_RE.test(n) && !NEVER_SET.has(n)) found.add(n);
          }
        } catch {}
      }
    }
  };

  walk(packageDir, 0);
  return [...found].sort();
}

/**
 * Values shaped like the real thing. A server that validates the format of its
 * key -- a URL, a number, a JSON blob -- is common enough that a single
 * placeholder string would fail half of them for the wrong reason.
 */
/**
 * Every synthesized value carries this marker so that anything the harness
 * itself caused can be recognised later and excluded from the oracles.
 *
 * A server handed a fake credential may well use it as a path -- one wrote its
 * log to a file named after the value of the variable Doubletap had filled in.
 * The resulting file then showed up as observable state and was reported as a
 * side effect of the tool under test, which it was not. Marking the values
 * makes that class of self-inflicted finding detectable rather than plausible.
 */
export const PLACEHOLDER_MARKER = "doubletap";

export function dummyValueFor(name: string): string {
  if (/BASE_?URL|ENDPOINT|_URL$|^URL$|WEBHOOK/.test(name)) return "https://upstream.doubletap.invalid";
  if (/^(.*_)?(HOST|HOSTNAME)$/.test(name)) return "upstream.doubletap.invalid";
  if (/PORT$/.test(name)) return "8443";
  if (/REGION/.test(name)) return "us-east-1";
  if (/EMAIL/.test(name)) return "doubletap@example.invalid";
  if (/CONNECTION|DSN|DATABASE_URL/.test(name)) return "https://upstream.doubletap.invalid/db";
  if (/JSON|CREDENTIALS_CONTENT/.test(name)) return "{}";
  if (/BOOL|ENABLE|DISABLE|VERBOSE/.test(name)) return "false";
  // Long enough to survive a length check, and obviously not a real secret.
  return "doubletap-placeholder-0000000000000000";
}

export function credentialEnv(packageDir: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const name of discoverEnvNames(packageDir)) {
    if (NEVER_SET.has(name)) continue;
    if (!CREDENTIAL_RE.test(name)) continue;
    out[name] = dummyValueFor(name);
  }
  return out;
}
