import type { TraceRecord } from "./types.ts";
import { canonical } from "./writer.ts";

/**
 * Blanks the fields a trace declares volatile before two traces are compared.
 *
 * Only top-level pointers are supported, and deliberately so: a mask deep
 * enough to hide a real behavioural difference would make the determinism
 * claim meaningless. Anything still differing after this is nondeterminism
 * Doubletap has not sealed off, and it gets reported as such.
 */
export function maskLine(line: string, volatile: string[]): string {
  let obj: Record<string, unknown>;
  try {
    obj = JSON.parse(line) as Record<string, unknown>;
  } catch {
    return line;
  }
  for (const ptr of volatile) {
    const key = ptr.startsWith("$.") ? ptr.slice(2) : ptr;
    if (key.includes(".")) continue;
    if (key in obj) obj[key] = "<volatile>";
  }
  return canonical(obj);
}

export function readVolatile(headerLine: string): string[] {
  try {
    const h = JSON.parse(headerLine) as TraceRecord;
    return h.k === "hdr" ? h.volatile : [];
  } catch {
    return [];
  }
}

/**
 * Walks two records of the same position and reports the leaf paths whose
 * values differ.
 *
 * This is how the volatility mask is learned rather than guessed: run the same
 * seed twice, and whatever still differs is, by definition, something the
 * server generates from outside the seed -- a timestamp, a uuid, a port. The
 * learned paths go in the trace header so a later comparison knows which
 * differences are expected and which are findings.
 */
export function leafDiffPaths(a: unknown, b: unknown, path = "$", out: string[] = []): string[] {
  if (a === b) return out;
  const bothObjects = a && b && typeof a === "object" && typeof b === "object";
  if (!bothObjects) {
    out.push(path);
    return out;
  }
  if (Array.isArray(a) !== Array.isArray(b)) {
    out.push(path);
    return out;
  }
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) {
      out.push(`${path}[]`);
      return out;
    }
    // Index is dropped from the reported path: a volatile field is volatile in
    // every element, and per-index paths would make the mask unusable.
    for (let i = 0; i < a.length; i++) leafDiffPaths(a[i], b[i], `${path}[*]`, out);
    return out;
  }
  const ao = a as Record<string, unknown>;
  const bo = b as Record<string, unknown>;
  for (const k of new Set([...Object.keys(ao), ...Object.keys(bo)])) {
    leafDiffPaths(ao[k], bo[k], `${path}.${k}`, out);
  }
  return out;
}

export function learnVolatile(linesA: string[], linesB: string[]): string[] {
  const found = new Set<string>();
  for (let i = 0; i < Math.min(linesA.length, linesB.length); i++) {
    if (linesA[i] === linesB[i]) continue;
    try {
      found_add(found, leafDiffPaths(JSON.parse(linesA[i]!), JSON.parse(linesB[i]!)));
    } catch {
      found.add("$<unparseable>");
    }
  }
  return [...found].sort();
}

function found_add(set: Set<string>, paths: string[]): void {
  for (const p of paths) set.add(p);
}
