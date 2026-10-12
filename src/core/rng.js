// Deterministic RNG. Same seed + same call order => same battle, everywhere.
// sfc32: fast, tiny, good distribution, trivially serializable.

export class RNG {
  constructor(seed = 1) {
    this.seed = seed >>> 0;
    this.calls = 0;
    this._reseed(this.seed);
  }

  _reseed(seed) {
    // splitmix32 to expand one 32-bit seed into four state words
    let s = seed >>> 0;
    const next = () => {
      s = (s + 0x9e3779b9) >>> 0;
      let z = s;
      z = Math.imul(z ^ (z >>> 16), 0x21f0aaad) >>> 0;
      z = Math.imul(z ^ (z >>> 15), 0x735a2d97) >>> 0;
      return (z ^ (z >>> 15)) >>> 0;
    };
    this.a = next(); this.b = next(); this.c = next(); this.d = next();
  }

  /** float in [0,1) */
  next() {
    this.calls++;
    this.a >>>= 0; this.b >>>= 0; this.c >>>= 0; this.d >>>= 0;
    let t = (this.a + this.b) >>> 0;
    this.a = this.b ^ (this.b >>> 9);
    this.b = (this.c + (this.c << 3)) >>> 0;
    this.c = (this.c << 21) | (this.c >>> 11);
    this.d = (this.d + 1) >>> 0;
    t = (t + this.d) >>> 0;
    this.c = (this.c + t) >>> 0;
    return (t >>> 0) / 4294967296;
  }

  /** integer in [0, n) */
  int(n) { return Math.floor(this.next() * n); }

  /** integer in [lo, hi] inclusive */
  range(lo, hi) { return lo + this.int(hi - lo + 1); }

  /** true with probability pct/100 */
  chance(pct) {
    if (pct >= 100) return true;
    if (pct <= 0) return false;
    return this.next() * 100 < pct;
  }

  pick(arr) { return arr[this.int(arr.length)]; }

  shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = this.int(i + 1);
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  save() { return { a: this.a, b: this.b, c: this.c, d: this.d, calls: this.calls, seed: this.seed }; }
  load(s) { this.a = s.a; this.b = s.b; this.c = s.c; this.d = s.d; this.calls = s.calls; this.seed = s.seed; return this; }
  clone() { return new RNG(1).load(this.save()); }
}

/** A pleasant human-typable seed, e.g. "SUNNY-4821" */
export function seedFromString(str) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h >>> 0;
}

const SEED_WORDS = [
  'SUNNY', 'MERRY', 'GRAND', 'LOGIA', 'HAKI', 'DAWN', 'STORM', 'REVERIE',
  'BAROQUE', 'SKYPIEA', 'ENIES', 'WANO', 'DRESSA', 'RAFTEL', 'POSEIDON', 'PLUTON'
];

export function randomSeedString() {
  const w = SEED_WORDS[Math.floor(Math.random() * SEED_WORDS.length)];
  const n = 1000 + Math.floor(Math.random() * 9000);
  return `${w}-${n}`;
}
