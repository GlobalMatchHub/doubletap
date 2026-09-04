/**
 * Deterministic PRNG. Every random choice Doubletap makes -- argument values,
 * cut offsets, interleavings, probe order -- is derived from one seed string so
 * that a run can be replayed exactly.
 *
 * splitmix64 for seeding, xoshiro256** for the stream. Both are exact on
 * BigInt, so results do not vary with the host's floating point behaviour.
 */

const M64 = (1n << 64n) - 1n;

function splitmix64(state: bigint): [bigint, bigint] {
  let z = (state + 0x9e3779b97f4a7c15n) & M64;
  let r = z;
  r = ((r ^ (r >> 30n)) * 0xbf58476d1ce4e5b9n) & M64;
  r = ((r ^ (r >> 27n)) * 0x94d049bb133111ebn) & M64;
  r = r ^ (r >> 31n);
  return [z, r];
}

function rotl(x: bigint, k: bigint): bigint {
  return ((x << k) | (x >> (64n - k))) & M64;
}

/** FNV-1a over the seed string, so any human-typed seed is usable. */
function hashSeed(seed: string): bigint {
  let h = 0xcbf29ce484222325n;
  const bytes = new TextEncoder().encode(seed);
  for (const b of bytes) {
    h = (h ^ BigInt(b)) & M64;
    h = (h * 0x100000001b3n) & M64;
  }
  return h;
}

export class Rng {
  #s: [bigint, bigint, bigint, bigint];

  constructor(seed: string) {
    let state = hashSeed(seed);
    const out: bigint[] = [];
    for (let i = 0; i < 4; i++) {
      const [next, value] = splitmix64(state);
      state = next;
      out.push(value);
    }
    this.#s = [out[0]!, out[1]!, out[2]!, out[3]!];
  }

  /** Next raw 64 bits. */
  next(): bigint {
    const [s0, s1, s2, s3] = this.#s;
    const result = (rotl((s1 * 5n) & M64, 7n) * 9n) & M64;
    const t = (s1 << 17n) & M64;
    let n2 = s2 ^ s0;
    let n3 = s3 ^ s1;
    const n1 = s1 ^ n2;
    const n0 = s0 ^ n3;
    n2 = n2 ^ t;
    n3 = rotl(n3, 45n);
    this.#s = [n0, n1, n2, n3];
    return result;
  }

  /** Uniform integer in [0, n). Rejection sampled, so no modulo bias. */
  int(n: number): number {
    if (n <= 0) throw new RangeError(`int(${n})`);
    const bound = BigInt(n);
    const limit = M64 - (M64 % bound);
    let v = this.next();
    while (v >= limit) v = this.next();
    return Number(v % bound);
  }

  /** Uniform float in [0, 1). 53 significant bits, matching Math.random. */
  float(): number {
    return Number(this.next() >> 11n) / 2 ** 53;
  }

  pick<T>(items: readonly T[]): T {
    if (items.length === 0) throw new RangeError("pick([])");
    return items[this.int(items.length)]!;
  }

  bool(pTrue = 0.5): boolean {
    return this.float() < pTrue;
  }

  /** Fisher-Yates on a copy. */
  shuffle<T>(items: readonly T[]): T[] {
    const a = items.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = this.int(i + 1);
      const tmp = a[i]!;
      a[i] = a[j]!;
      a[j] = tmp;
    }
    return a;
  }

  /** A fresh independent stream, named. Lets one probe's draws not shift another's. */
  fork(label: string): Rng {
    return new Rng(`${this.next().toString(16)}:${label}`);
  }

  /** Lowercase hex token of `len` chars. Used for file names and idempotency keys. */
  token(len = 8): string {
    let out = "";
    while (out.length < len) out += this.next().toString(16).padStart(16, "0");
    return out.slice(0, len);
  }
}
