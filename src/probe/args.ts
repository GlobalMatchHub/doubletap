import type { Rng } from "../det/rng.ts";
import type { SynthContext } from "../schema/synth.ts";
import type { ProbeContext } from "./types.ts";

/**
 * Builds the synthesis context for one case.
 *
 * The token is passed in rather than drawn here so that two cases running in
 * two different sandboxes produce the *same* arguments. Comparing what a
 * clean call did against what an interrupted call did only works if both
 * calls asked for the same thing.
 */
export function synthContext(
  ctx: ProbeContext,
  workspace: string,
  rng: Rng,
  token: string,
): SynthContext {
  const files = Object.keys(ctx.fixture).filter((p) => !p.endsWith("/"));
  const dirs = [...new Set(files.map((p) => p.split("/").slice(0, -1).join("/")).filter(Boolean))];
  return {
    rng,
    workspace,
    toolName: ctx.tool.name,
    existingFiles: files,
    existingDirs: dirs,
    fixtureContents: ctx.fixture,
    token,
  };
}
