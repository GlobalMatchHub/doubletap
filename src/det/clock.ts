/**
 * Virtual clock. Trace timestamps must not carry wall time or two runs of the
 * same seed would never compare equal. The clock advances by explicit ticks at
 * every recorded event, plus by a bounded, quantised reading of real elapsed
 * time when we genuinely need to observe duration (a server hang, say).
 */
export class VirtualClock {
  #t = 0;
  #realStart = process.hrtime.bigint();

  /** Current virtual time, microseconds since start. */
  now(): number {
    return this.#t;
  }

  /** Advance by a fixed amount and return the new time. */
  tick(us = 1): number {
    this.#t += us;
    return this.#t;
  }

  /**
   * Real elapsed microseconds, quantised to 10ms buckets. Used only where a
   * duration is itself the finding (timeouts). Quantising keeps runs of the
   * same seed comparable as long as the server behaves within the same bucket.
   */
  realElapsedQuantised(): number {
    const us = Number((process.hrtime.bigint() - this.#realStart) / 1000n);
    return Math.round(us / 10_000) * 10_000;
  }
}
