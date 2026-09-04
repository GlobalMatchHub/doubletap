/**
 * Strips the harness's own footprint out of anything a reader will see.
 *
 * Verdicts are built from live evidence, not from the trace file, so the
 * redaction the trace writer applies never reaches the report. Left alone, a
 * published census carries the absolute path of every sandbox it created,
 * including the machine-specific identifier macOS puts in its temp directory,
 * and the placeholder credential strings that were handed to servers.
 *
 * Neither is a secret in the dramatic sense. Both identify the machine the
 * census ran on, and both make a report look like it was never read by anyone
 * before it was published.
 */

const PATTERNS: [RegExp, string][] = [
  // A sandbox root: /private/var/folders/xx/<machine id>/T/doubletap-<label>-<rand>
  [/(?:\/private)?\/var\/folders\/[^/\s"]+\/[^/\s"]+\/T\/doubletap-[A-Za-z0-9._@-]+/g, "<sandbox>"],
  // The same on Linux and anywhere else tmpdir lands.
  [/\/tmp\/doubletap-[A-Za-z0-9._@-]+/g, "<sandbox>"],
  [/doubletap-placeholder-0+/g, "<placeholder>"],
  [/upstream\.doubletap\.invalid/g, "<upstream>"],
];

export function redactText(s: string): string {
  let out = s;
  for (const [re, to] of PATTERNS) out = out.replace(re, to);
  return out;
}

/** Walks any structure and redacts every string in it. */
export function redactDeep<T>(value: T): T {
  if (typeof value === "string") return redactText(value) as unknown as T;
  if (Array.isArray(value)) return value.map(redactDeep) as unknown as T;
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) out[k] = redactDeep(v);
    return out as unknown as T;
  }
  return value;
}
