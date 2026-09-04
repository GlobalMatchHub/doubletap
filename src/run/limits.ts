/**
 * Run-wide limits.
 *
 * A census is only useful if it finishes. One server that answers nothing lets
 * every call run to the timeout, and at fifteen seconds a single unresponsive
 * target can hold the whole run for ten minutes. These are set once from the
 * command line and read by the probes.
 */
export const limits = {
  /** How long to wait for a tool call before treating it as unanswered. */
  callTimeoutMs: 6_000,
  /** How long a single target may take before the run stops giving it tools. */
  targetBudgetMs: 5 * 60_000,
};

export function configureLimits(partial: Partial<typeof limits>): void {
  Object.assign(limits, partial);
}
