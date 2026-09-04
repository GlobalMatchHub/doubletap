import type { Rng } from "../det/rng.ts";

export interface SynthContext {
  rng: Rng;
  /** Absolute path the target server is allowed to touch. */
  workspace: string;
  toolName: string;
  /** Fixture paths, relative to the workspace, that exist in every case. */
  existingFiles: string[];
  existingDirs: string[];
  /** Fixture contents, so an edit can be given text that is actually present. */
  fixtureContents: Record<string, string>;
  /** Stable per-case token, so both calls of a retry pair agree on values. */
  token: string;
}

type Schema = Record<string, unknown>;

/**
 * Builds a plausible, valid argument object from a tool's inputSchema.
 *
 * Satisfying the schema is not enough. A path field filled with the string
 * "string" is rejected by every filesystem server, and a tool that only ever
 * errors proves nothing about idempotency. So the tool's name is read for
 * intent, the property name for role, and the schema is used to constrain the
 * result. Every draw comes from the seeded Rng.
 */

/** Whether the tool is expected to consume existing state or create new state. */
export type Intent = "read" | "mutate" | "create";

const CREATE_RE = /(create|write|new|add|make|mkdir|put|upload|insert|store|save|post|open)/i;
const MUTATE_RE = /(edit|append|patch|update|modify|move|rename|copy|delete|remove|unlink|truncate|set|replace)/i;
const READ_RE = /(read|get|list|stat|info|tree|search|find|describe|fetch|show|head|cat|query|view|resolve)/i;

export function intentOf(toolName: string, readOnlyHint?: boolean): Intent {
  if (readOnlyHint) return "read";
  // Order matters: "create_directory" is a create even though "directory"
  // reads like a lookup, and "write_file" must not be seen as a read.
  if (CREATE_RE.test(toolName)) return "create";
  if (MUTATE_RE.test(toolName)) return "mutate";
  if (READ_RE.test(toolName)) return "read";
  return "create";
}

/**
 * Names that look like a path but are not one.
 *
 * A field called sourceBucket or destinationProject normalises to something
 * beginning with "source" or "destination", which is exactly what the path
 * heuristic keys on, so it was handed a filesystem path and the resulting
 * request read as nonsense: a bucket name several directories deep. The
 * finding underneath was still real, but a maintainer reading a URL like that
 * concludes the tool is confused rather than that their server is.
 */
const IDENTIFIER_RE = /(bucket|project|org|organisation|organization|workspace|account|tenant|repo|repository|database|dataset|table|collection|index|channel|team|board|queue|topic|namespace)/i;

const PATH_RE = /(^|_)(paths?|files?|filepaths?|filenames?|dirs?|directory|directories|folders?|source|destination|src|dest|target)($|_)/i;
const DIR_RE = /(dir|directory|folder)/i;
const FRESH_RE = /(destination|dest|new_?path|new_?name|to|output|out_?path)/i;
const SOURCE_RE = /(source|src|from|input|old_?path)/i;
const CONTENT_RE = /(content|body|text|data|payload|value|message)/i;
const OLD_TEXT_RE = /^old_?(text|string|str|content|value)$/i;
const NEW_TEXT_RE = /^new_?(text|string|str|content|value)$/i;
const NAME_RE = /(^|_)(name|title|label|key|entity|node|topic|entity_?name)($|_)/i;
const IDEMPOTENCY_RE = /(idempotenc|request_?id|dedupe|dedup_?key|client_?token|transaction_?id)/i;
const QUERY_RE = /(query|search|pattern|q|term|keyword|substring)/i;
const URL_RE = /(url|uri|endpoint|href|link)/i;

interface Resolved {
  /** The fixture file this case operates on, relative to the workspace. */
  anchorFile: string;
  anchorDir: string;
  intent: Intent;
  forceAnchor?: boolean;
}

function resolve(ctx: SynthContext, readOnlyHint?: boolean): Resolved {
  return {
    anchorFile: ctx.existingFiles[0] ?? "note.txt",
    anchorDir: ctx.existingDirs[0] ?? "",
    intent: intentOf(ctx.toolName, readOnlyHint),
  };
}

export interface SynthOptions {
  includeOptional?: boolean;
  readOnlyHint?: boolean;
  /**
   * Points every path field at a file that already has contents.
   *
   * "Interrupting a create leaves an empty new file" is a bug. "Interrupting
   * an overwrite leaves an empty file where the user's data was" is the same
   * bug with a bill attached, and only this flag reaches it.
   */
  forceAnchorPaths?: boolean;
}

export function synthArgs(
  schema: Schema | undefined,
  ctx: SynthContext,
  opts: SynthOptions = {},
): Record<string, unknown> {
  if (!schema || typeof schema !== "object") return {};
  const props = (schema.properties ?? {}) as Record<string, Schema>;
  const required = new Set((schema.required as string[] | undefined) ?? []);
  const r = resolve(ctx, opts.readOnlyHint);
  r.forceAnchor = opts.forceAnchorPaths === true;
  const out: Record<string, unknown> = {};
  for (const key of Object.keys(props).sort()) {
    // Optional fields are omitted by default: fewer moving parts, and a tool
    // that needs one will say so in its error.
    if (!opts.includeOptional && !required.has(key)) continue;
    out[key] = synthValue(key, props[key]!, ctx, r, 0);
  }
  return out;
}

function pathFor(key: string, ctx: SynthContext, r: Resolved, desc = ""): string {
  const ws = ctx.workspace;
  if (r.forceAnchor) return `${ws}/${r.anchorFile}`;
  // The description is often the only place that says a path must be a
  // directory, as with a search tool whose parameter is just called 'path'.
  const wantsDir = DIR_RE.test(key) || DIR_RE.test(ctx.toolName) || /tree|search/i.test(ctx.toolName) || DIR_RE.test(desc);
  const wantsFresh = FRESH_RE.test(key) || (r.intent === "create" && !SOURCE_RE.test(key));

  if (wantsFresh) {
    return wantsDir ? `${ws}/dt-${ctx.token}-dir` : `${ws}/dt-${ctx.token}.txt`;
  }
  if (wantsDir) {
    // The workspace root always exists and always has contents, which keeps
    // listing tools from erroring out and skipping the whole case.
    return r.anchorDir ? `${ws}/${r.anchorDir}` : ws;
  }
  return `${ws}/${r.anchorFile}`;
}

/**
 * Normalises a property name to snake_case before it is tested against the
 * intent regexes below.
 *
 * Every regex in this file assumes an underscore or a string boundary marks
 * where a word starts and ends -- `(^|_)(path|file|...)($|_)` matches
 * "file_path" but not "filePath", because there is no underscore before
 * "Path". Plenty of real schemas use camelCase (`filePath`, `slideIndex`),
 * and without this normalisation every one of those fields falls through to
 * the generic default, which is usually wrong. This bug does not announce
 * itself: the call still "succeeds" against the schema's types, it just
 * produces nonsense values, so it was found only by tracing one server's
 * validation error back to the field name that caused it.
 */
function normaliseKey(key: string): string {
  return key.replace(/([a-z0-9])([A-Z])/g, "$1_$2").toLowerCase();
}

function synthValue(rawKey: string, s: Schema, ctx: SynthContext, r: Resolved, depth: number): unknown {
  if (depth > 4) return null;
  const { rng, token } = ctx;
  const key = normaliseKey(rawKey);

  // anyOf / oneOf: take the first branch, deterministically, so a schema
  // change does not silently reshuffle every case.
  const union = (s.anyOf ?? s.oneOf) as Schema[] | undefined;
  if (Array.isArray(union) && union[0]) return synthValue(key, union[0], ctx, r, depth + 1);

  if (Array.isArray(s.enum) && s.enum.length > 0) return s.enum[0];
  if (s.const !== undefined) return s.const;
  if (s.default !== undefined && !PATH_RE.test(key)) return s.default;

  const type = Array.isArray(s.type) ? s.type[0] : s.type;
  const desc = typeof s.description === "string" ? s.description : "";

  switch (type) {
    case "string": {
      if (IDEMPOTENCY_RE.test(key)) return `dt-${token}`;
      if (OLD_TEXT_RE.test(key)) {
        // Give an edit something that is genuinely in the file, otherwise the
        // first call fails and the retry tells us nothing.
        const body = ctx.fixtureContents[r.anchorFile] ?? "";
        return body.split("\n")[0] ?? "";
      }
      if (NEW_TEXT_RE.test(key)) return `doubletap ${token}`;
      // An identifier that merely starts with "source" or "destination" is a
      // name, not a location.
      if (IDENTIFIER_RE.test(key)) return `dt-${token}`;
      if (PATH_RE.test(key) || /\bpath\b/i.test(desc)) return pathFor(key, ctx, r, desc);
      if (URL_RE.test(key)) return "https://example.invalid/doubletap";
      if (CONTENT_RE.test(key)) return `doubletap ${token}\n`;
      if (QUERY_RE.test(key)) return "doubletap";
      if (NAME_RE.test(key)) return `dt-${token}`;
      if (s.format === "date-time") return "2020-01-01T00:00:00.000Z";
      if (s.format === "email") return "doubletap@example.invalid";
      if (s.format === "uri") return "https://example.invalid/doubletap";
      const min = Number(s.minLength ?? 0);
      let v = `dt-${token}`;
      while (v.length < min) v += "x";
      const max = Number(s.maxLength ?? Infinity);
      return v.length > max ? v.slice(0, max) : v;
    }
    case "integer":
    case "number": {
      const min =
        typeof s.minimum === "number"
          ? s.minimum
          : typeof s.exclusiveMinimum === "number"
            ? s.exclusiveMinimum + 1
            : 1;
      const max = typeof s.maximum === "number" ? s.maximum : min + 9;
      const span = Math.max(1, Math.floor(max - min) + 1);
      const v = min + rng.int(Math.min(span, 10));
      return type === "integer" ? Math.round(v) : v;
    }
    case "boolean":
      // false is the conservative default; true usually means "recursive" or
      // "force", which would change what the tool does between cases.
      return false;
    case "array": {
      const item = (s.items ?? { type: "string" }) as Schema;
      const n = Math.max(Number(s.minItems ?? 1), 1);
      // Array-valued path fields keep the key's meaning for their items.
      return Array.from({ length: Math.min(n, 2) }, () => synthValue(key, item, ctx, r, depth + 1));
    }
    case "object": {
      const props = (s.properties ?? {}) as Record<string, Schema>;
      const req = new Set((s.required as string[] | undefined) ?? Object.keys(props));
      const o: Record<string, unknown> = {};
      for (const k of Object.keys(props).sort()) if (req.has(k)) o[k] = synthValue(k, props[k]!, ctx, r, depth + 1);
      return o;
    }
    case "null":
      return null;
    default: {
      // No declared type. Fall back to the name; an untyped property is worth
      // noting but not worth failing the case over.
      if (IDENTIFIER_RE.test(key)) return `dt-${token}`;
      if (PATH_RE.test(key)) return pathFor(key, ctx, r);
      if (CONTENT_RE.test(key)) return `doubletap ${token}\n`;
      return `dt-${token}`;
    }
  }
}
