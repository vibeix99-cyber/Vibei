/**
 * Pure audio helpers (no WebAudio objects) — tonal palette, gain curves,
 * seeded randomness, noise generation and voice limiting. Unit-tested.
 * OWNER: audio area.
 */

// ---------------------------------------------------------------------------
// Tonal palette: everything in F major pentatonic (F G A C D), rooted on F4.
// ---------------------------------------------------------------------------

/** MIDI note of the tonal root (F4 ≈ 349.23 Hz). */
export const ROOT_MIDI = 65;
/** F major pentatonic, semitones above F. */
export const PENTATONIC = [0, 2, 4, 7, 9] as const;
/** F major (diatonic) for chord voicings. */
export const MAJOR = [0, 2, 4, 5, 7, 9, 11] as const;

export function midiToFreq(midi: number): number {
  return 440 * 2 ** ((midi - 69) / 12);
}

/** MIDI note of pentatonic scale step `step` (0 = root, 5 = root + octave, -1 = D below). */
export function pentaMidi(step: number, root = ROOT_MIDI): number {
  const s = Math.round(step);
  const oct = Math.floor(s / 5);
  const idx = ((s % 5) + 5) % 5;
  return root + 12 * oct + PENTATONIC[idx]!;
}

/** Frequency of pentatonic step `step` above `root`. */
export function pentaFreq(step: number, root = ROOT_MIDI): number {
  return midiToFreq(pentaMidi(step, root));
}

/**
 * Snap a semitone offset (relative to the key root) up to the nearest
 * pentatonic degree so rising count-ups always stay in key.
 */
export function snapToPentatonic(semis: number): number {
  const s = Math.round(semis);
  const oct = Math.floor(s / 12);
  const pc = s - oct * 12;
  for (const d of PENTATONIC) if (d >= pc) return oct * 12 + d;
  return (oct + 1) * 12;
}

/** Semitone offset → frequency ratio. */
export function semitoneRatio(semis: number): number {
  return 2 ** (semis / 12);
}

// ---------------------------------------------------------------------------
// Gain
// ---------------------------------------------------------------------------

/** Perceptual slider (0..1) → linear gain. Square law: 0.5 ≈ −12 dB, 0 = silent. */
export function volumeToGain(v: number): number {
  if (!Number.isFinite(v) || v <= 0) return 0;
  const c = Math.min(1, v);
  return c * c;
}

export function dbToGain(db: number): number {
  return 10 ** (db / 20);
}

export function gainToDb(g: number): number {
  return g <= 0 ? -Infinity : 20 * Math.log10(g);
}

export type FadeShape = 'linear' | 'equalPower';

/**
 * Sampled fade curve from `from` to `to` (for `setValueCurveAtTime`).
 * `equalPower` uses a quarter-sine so uncorrelated crossfades keep constant power.
 */
export function fadeCurve(from: number, to: number, n = 64, shape: FadeShape = 'equalPower'): Float32Array {
  const out = new Float32Array(Math.max(2, n));
  const last = out.length - 1;
  for (let i = 0; i <= last; i++) {
    const x = i / last;
    let w: number;
    if (shape === 'linear') w = x;
    else w = to > from ? Math.sin((x * Math.PI) / 2) : 1 - Math.cos((x * Math.PI) / 2);
    out[i] = from + (to - from) * w;
  }
  out[0] = from;
  out[last] = to;
  return out;
}

/** Evaluate a curve (as passed to setValueCurveAtTime) at normalized position 0..1. */
export function sampleCurve(curve: ArrayLike<number>, x: number): number {
  if (curve.length === 0) return 0;
  if (x <= 0) return curve[0]!;
  if (x >= 1) return curve[curve.length - 1]!;
  const p = x * (curve.length - 1);
  const i = Math.floor(p);
  const f = p - i;
  return curve[i]! + (curve[i + 1]! - curve[i]!) * f;
}

// ---------------------------------------------------------------------------
// Randomness (seeded so offline renders are reproducible)
// ---------------------------------------------------------------------------

export type Rng = () => number;

/** Small fast seeded PRNG (mulberry32). Returns floats in [0, 1). */
export function mulberry32(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const rrange = (rng: Rng, a: number, b: number): number => a + (b - a) * rng();
export const rint = (rng: Rng, a: number, b: number): number => Math.floor(rrange(rng, a, b + 1));
export const chance = (rng: Rng, p: number): boolean => rng() < p;
export function pick<T>(rng: Rng, arr: readonly T[]): T {
  return arr[Math.min(arr.length - 1, Math.floor(rng() * arr.length))]!;
}
/** Exponential inter-arrival time for a Poisson process with `rate` events/s. */
export function poissonGap(rng: Rng, rate: number): number {
  return -Math.log(1 - rng() * 0.999999) / Math.max(1e-6, rate);
}
/** Log-uniform random value — natural for loudness/frequency variation. */
export function logRange(rng: Rng, a: number, b: number): number {
  return a * (b / a) ** rng();
}
/** Weighted pick. */
export function weighted<T>(rng: Rng, items: readonly (readonly [T, number])[]): T {
  const total = items.reduce((s, [, w]) => s + w, 0);
  let r = rng() * total;
  for (const [v, w] of items) {
    r -= w;
    if (r <= 0) return v;
  }
  return items[items.length - 1]![0];
}

// ---------------------------------------------------------------------------
// Noise (filled into plain Float32Arrays; wrapped into AudioBuffers elsewhere)
// ---------------------------------------------------------------------------

export function whiteNoise(len: number, rng: Rng): Float32Array {
  const out = new Float32Array(len);
  for (let i = 0; i < len; i++) out[i] = rng() * 2 - 1;
  return out;
}

/** Pink noise (Paul Kellet's refined filter), ~unit RMS-ish scaled to ±1 peak-ish. */
export function pinkNoise(len: number, rng: Rng): Float32Array {
  const out = new Float32Array(len);
  let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
  for (let i = 0; i < len; i++) {
    const w = rng() * 2 - 1;
    b0 = 0.99886 * b0 + w * 0.0555179;
    b1 = 0.99332 * b1 + w * 0.0750759;
    b2 = 0.969 * b2 + w * 0.153852;
    b3 = 0.8665 * b3 + w * 0.3104856;
    b4 = 0.55 * b4 + w * 0.5329522;
    b5 = -0.7616 * b5 - w * 0.016898;
    out[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362) * 0.11;
    b6 = w * 0.115926;
  }
  return removeDc(out);
}

/** Brown(ian) noise: leaky-integrated white noise, DC-free. */
export function brownNoise(len: number, rng: Rng): Float32Array {
  const out = new Float32Array(len);
  let last = 0;
  for (let i = 0; i < len; i++) {
    const w = rng() * 2 - 1;
    last = (last + 0.02 * w) / 1.02;
    out[i] = last * 3.5;
  }
  return removeDc(out);
}

/** Subtract the mean and gently high-pass (≈ 8 Hz @ 48 kHz) to kill DC drift. */
export function removeDc(data: Float32Array, coeff = 0.999): Float32Array {
  let mean = 0;
  for (let i = 0; i < data.length; i++) mean += data[i]!;
  mean /= data.length || 1;
  let x1 = 0, y1 = 0;
  for (let i = 0; i < data.length; i++) {
    const x = data[i]! - mean;
    const y = x - x1 + coeff * y1;
    x1 = x;
    y1 = y;
    data[i] = y;
  }
  return data;
}

/**
 * Make `src` loop seamlessly: returns a buffer of length `src.length - fade`
 * whose head is an equal-power crossfade of the original tail, so the
 * wrap-around point is continuous (no click, no audible seam).
 */
export function makeLoopable(src: Float32Array, fade: number): Float32Array {
  const f = Math.max(1, Math.min(fade, Math.floor(src.length / 3)));
  const len = src.length - f;
  const out = src.slice(0, len);
  for (let i = 0; i < f; i++) {
    const x = i / f;
    const gIn = Math.sin((x * Math.PI) / 2);
    const gOut = Math.cos((x * Math.PI) / 2);
    out[i] = src[i]! * gIn + src[len + i]! * gOut;
  }
  return out;
}

export function normalizePeak(data: Float32Array, peak = 0.9): Float32Array {
  let m = 0;
  for (let i = 0; i < data.length; i++) m = Math.max(m, Math.abs(data[i]!));
  if (m > 0) {
    const k = peak / m;
    for (let i = 0; i < data.length; i++) data[i]! *= k;
  }
  return data;
}

export function normalizeRms(data: Float32Array, rms = 0.2): Float32Array {
  let s = 0;
  for (let i = 0; i < data.length; i++) s += data[i]! * data[i]!;
  const cur = Math.sqrt(s / (data.length || 1));
  if (cur > 0) {
    const k = rms / cur;
    for (let i = 0; i < data.length; i++) data[i]! *= k;
  }
  return data;
}

// ---------------------------------------------------------------------------
// Voice limiting (pure bookkeeping; the engine applies the decisions)
// ---------------------------------------------------------------------------

export interface VoiceRule {
  /** Max simultaneous voices of this sound. Oldest is stolen beyond this. */
  max: number;
  /** Retriggers closer than this (ms) are dropped. */
  minGapMs: number;
  /** Tiny sounds yield: dropped if any other sound started within this many ms. */
  yieldMs?: number;
}

export interface VoiceEntry {
  id: number;
  name: string;
  start: number; // ms
  end: number; // ms
}

export interface VoiceDecision {
  accept: boolean;
  /** Ids of voices to fade out quickly. */
  steal: number[];
  /** Gain multiplier (rapid repeats get gently quieter to avoid fatigue). */
  gain: number;
  id: number;
}

export class VoicePool {
  private voices: VoiceEntry[] = [];
  /** Recent start times per sound (kept after voices end) for density ducking. */
  private starts = new Map<string, number[]>();
  private nextId = 1;
  constructor(private readonly globalMax = 14) {}

  get active(): readonly VoiceEntry[] {
    return this.voices;
  }

  prune(now: number): void {
    this.voices = this.voices.filter((v) => v.end > now);
  }

  request(name: string, now: number, durMs: number, rule: VoiceRule): VoiceDecision {
    this.prune(now);
    const same = this.voices.filter((v) => v.name === name);
    const last = same.reduce<VoiceEntry | null>((a, v) => (!a || v.start > a.start ? v : a), null);
    if (last && now - last.start < rule.minGapMs) return { accept: false, steal: [], gain: 0, id: 0 };
    if (rule.yieldMs && this.voices.some((v) => v.name !== name && now - v.start < rule.yieldMs!)) {
      return { accept: false, steal: [], gain: 0, id: 0 };
    }
    const steal: number[] = [];
    const sorted = same.slice().sort((a, b) => a.start - b.start);
    while (sorted.length >= rule.max) steal.push(sorted.shift()!.id);
    let remaining = this.voices.filter((v) => !steal.includes(v.id));
    // A meaningful sound replaces a tap that was *just* triggered by the same gesture.
    for (const v of remaining) {
      if (v.name === 'tap' && name !== 'tap' && now - v.start < 80) steal.push(v.id);
    }
    remaining = this.voices.filter((v) => !steal.includes(v.id));
    const byAge = remaining.slice().sort((a, b) => a.start - b.start);
    while (byAge.length >= this.globalMax) steal.push(byAge.shift()!.id);
    this.voices = this.voices.filter((v) => !steal.includes(v.id));
    const hist = (this.starts.get(name) ?? []).filter((t) => now - t < DENSITY_WINDOW_MS);
    const gain = densityGain(hist.length);
    hist.push(now);
    this.starts.set(name, hist);
    const id = this.nextId++;
    this.voices.push({ id, name, start: now, end: now + durMs });
    return { accept: true, steal, gain, id };
  }

  release(id: number): void {
    this.voices = this.voices.filter((v) => v.id !== id);
  }

  clear(): void {
    this.voices = [];
    this.starts.clear();
  }
}

/** Rapid repeats of one sound within this window get progressively softer. */
export const DENSITY_WINDOW_MS = 400;

/** Gain for a sound given how many of the same started in the last window (≈ −1.4 dB each, floor −7 dB). */
export function densityGain(recent: number): number {
  return Math.max(0.45, 0.85 ** recent);
}
