/**
 * WebAudio instrument building blocks. Everything takes a `BaseAudioContext`
 * and a destination node so it renders identically in a live AudioContext and
 * in an OfflineAudioContext (see offline.ts / scripts/audio-check.mjs).
 *
 * Timbre vocabulary: modal synthesis (a few inharmonic sine partials, each
 * with its own exponential decay) for kalimba / marimba / soft bells, additive
 * felt-piano plucks, and filtered-noise breaths. Attacks are never instant
 * (≥1 ms ramps) and every envelope ends on an explicit ramp to 0 → no clicks.
 * OWNER: audio area.
 */
import { brownNoise, makeLoopable, pinkNoise, whiteNoise, mulberry32, type Rng } from './dsp';

export interface Out {
  ctx: BaseAudioContext;
  /** Dry destination. */
  out: AudioNode;
  /** Optional reverb send destination. */
  wet?: AudioNode | null;
  rng: Rng;
  /** When present, every gesture records its end time here (voice bookkeeping). */
  track?: { end: number };
}

/** Record a gesture's end time on the voice tracker; returns it. */
export function mark(o: Out, end: number): number {
  if (o.track && end > o.track.end) o.track.end = end;
  return end;
}

const SILENCE = 0.0001; // −80 dB: exponential ramps can't reach 0
const MAX_PARTIAL_HZ = 9000;

// ---------------------------------------------------------------------------
// Shared buffers (cached per context)
// ---------------------------------------------------------------------------

type BufferKind = 'white' | 'pink' | 'brown' | 'whiteShort';
const bufferCache = new WeakMap<BaseAudioContext, Map<string, AudioBuffer>>();

/** Long, seamlessly-looping stereo noise buffers (channels decorrelated). */
export function noiseBuffer(ctx: BaseAudioContext, kind: BufferKind, seconds = 8.3, seed = 7): AudioBuffer {
  let m = bufferCache.get(ctx);
  if (!m) bufferCache.set(ctx, (m = new Map()));
  const key = `${kind}:${seconds}:${seed}`;
  const hit = m.get(key);
  if (hit) return hit;
  const sr = ctx.sampleRate;
  const fade = Math.floor(sr * 0.25);
  const len = Math.floor(sr * seconds) + fade;
  const buf = ctx.createBuffer(2, len - fade, sr);
  for (let ch = 0; ch < 2; ch++) {
    const rng = mulberry32(seed * 31 + ch * 977 + kind.length * 13);
    const gen = kind === 'pink' ? pinkNoise : kind === 'brown' ? brownNoise : whiteNoise;
    const raw = gen(len, rng);
    buf.copyToChannel(makeLoopable(raw, fade) as Float32Array<ArrayBuffer>, ch);
  }
  m.set(key, buf);
  return buf;
}

/** Cache arbitrary generated mono grains per context. */
export function cachedBuffer(ctx: BaseAudioContext, key: string, make: (sr: number) => Float32Array[]): AudioBuffer[] {
  let m = bufferCache.get(ctx);
  if (!m) bufferCache.set(ctx, (m = new Map()));
  const out: AudioBuffer[] = [];
  const first = m.get(`${key}#0`);
  if (first) {
    for (let i = 0; ; i++) {
      const b = m.get(`${key}#${i}`);
      if (!b) break;
      out.push(b);
    }
    return out;
  }
  const datas = make(ctx.sampleRate);
  datas.forEach((d, i) => {
    const b = ctx.createBuffer(1, d.length, ctx.sampleRate);
    b.copyToChannel(d as Float32Array<ArrayBuffer>, 0);
    m!.set(`${key}#${i}`, b);
    out.push(b);
  });
  return out;
}

/** Looping noise source starting at a random offset (so layers never align). */
export function loopNoise(o: Out, kind: BufferKind, opts: { rate?: number; seconds?: number; seed?: number } = {}): AudioBufferSourceNode {
  const src = o.ctx.createBufferSource();
  src.buffer = noiseBuffer(o.ctx, kind, opts.seconds ?? 8.3, opts.seed ?? 7);
  src.loop = true;
  src.playbackRate.value = opts.rate ?? 1;
  return src;
}

export function startLoop(src: AudioBufferSourceNode, at: number, rng: Rng): void {
  const dur = src.buffer?.duration ?? 1;
  src.start(at, rng() * dur);
}

// ---------------------------------------------------------------------------
// Envelopes
// ---------------------------------------------------------------------------

/**
 * Percussive envelope on `param`: soft linear attack → exponential decay to
 * −60 dB at `t60` → linear to exact zero. Returns the end time.
 */
export function percEnv(param: AudioParam, t: number, peak: number, attack: number, t60: number): number {
  param.value = 0; // intrinsic 0: no full-gain sample before the first event
  const a = Math.max(0.001, attack);
  param.setValueAtTime(0, t);
  param.linearRampToValueAtTime(peak, t + a);
  param.exponentialRampToValueAtTime(Math.max(SILENCE, peak * 0.001), t + a + t60);
  param.linearRampToValueAtTime(0, t + a + t60 + 0.015);
  return t + a + t60 + 0.02;
}

/** Attack / hold / release envelope with linear segments. Returns end time. */
export function arEnv(param: AudioParam, t: number, peak: number, attack: number, hold: number, release: number): number {
  param.value = 0; // intrinsic 0: no full-gain sample before the first event
  param.setValueAtTime(0, t);
  param.linearRampToValueAtTime(peak, t + Math.max(0.001, attack));
  param.setValueAtTime(peak, t + attack + hold);
  param.linearRampToValueAtTime(0, t + attack + hold + Math.max(0.005, release));
  return t + attack + hold + release + 0.01;
}

/** Swell envelope: smooth (quarter-sine-ish via exp ramps) attack then long release. */
export function swellEnv(param: AudioParam, t: number, peak: number, attack: number, release: number): number {
  param.value = 0; // intrinsic 0: no full-gain sample before the first event
  param.setValueAtTime(0, t);
  param.linearRampToValueAtTime(peak * 0.15, t + attack * 0.35);
  param.linearRampToValueAtTime(peak, t + attack);
  param.exponentialRampToValueAtTime(Math.max(SILENCE, peak * 0.001), t + attack + release);
  param.linearRampToValueAtTime(0, t + attack + release + 0.02);
  return t + attack + release + 0.03;
}

// ---------------------------------------------------------------------------
// Routing helpers
// ---------------------------------------------------------------------------

/** A gain → (optional pan) chain feeding `o.out` and optionally the reverb send. */
export function voiceOut(o: Out, opts: { gain?: number; pan?: number; wet?: number } = {}): GainNode {
  const g = o.ctx.createGain();
  g.gain.value = opts.gain ?? 1;
  let tail: AudioNode = g;
  if (opts.pan) {
    const p = o.ctx.createStereoPanner();
    p.pan.value = Math.max(-1, Math.min(1, opts.pan));
    g.connect(p);
    tail = p;
  }
  tail.connect(o.out);
  if (opts.wet && o.wet) {
    const s = o.ctx.createGain();
    s.gain.value = opts.wet;
    tail.connect(s);
    s.connect(o.wet);
  }
  return g;
}

function stopAt(node: AudioScheduledSourceNode, t: number): void {
  node.stop(t);
}

// ---------------------------------------------------------------------------
// Modal (struck bar / tine) voices
// ---------------------------------------------------------------------------

export interface ModalPartial {
  /** Frequency ratio to the fundamental. */
  r: number;
  /** Relative amplitude. */
  g: number;
  /** Seconds to decay 60 dB (at the reference pitch; shortened for high notes). */
  t60: number;
  /** Detune in cents (for gentle beating). */
  c?: number;
}

/** Kalimba: clamped-free tine (1 : 6.27 : 17.55) + a touch of octave body. */
export const KALIMBA: ModalPartial[] = [
  { r: 1, g: 1, t60: 1.5 },
  { r: 2.0, g: 0.06, t60: 0.5 },
  { r: 6.27, g: 0.13, t60: 0.22 },
  { r: 17.55, g: 0.025, t60: 0.05 },
];

/** Marimba: tuned free bar (1 : 3.99 : 9.9) — woody, short upper modes. */
export const MARIMBA: ModalPartial[] = [
  { r: 1, g: 1, t60: 0.9 },
  { r: 3.99, g: 0.22, t60: 0.22 },
  { r: 9.9, g: 0.05, t60: 0.06 },
];

/** Soft bell (vibraphone-ish): mostly fundamental with a slow beating twin. */
export const SOFT_BELL: ModalPartial[] = [
  { r: 1, g: 1, t60: 2.6 },
  { r: 1, g: 0.35, t60: 2.2, c: 3.5 },
  { r: 3.98, g: 0.09, t60: 0.7 },
  { r: 9.8, g: 0.018, t60: 0.18 },
];

/** Small tin lid ring (inharmonic plate modes) — short and quiet. */
export const TIN: ModalPartial[] = [
  { r: 1, g: 1, t60: 0.2 },
  { r: 1.52, g: 0.6, t60: 0.16 },
  { r: 2.21, g: 0.35, t60: 0.1 },
  { r: 2.83, g: 0.2, t60: 0.07 },
];

export interface StrikeOpts {
  gain?: number;
  attack?: number;
  pan?: number;
  wet?: number;
  /** Scales every partial's decay (e.g. 0.3 for a muted, damped hit). */
  decay?: number;
  /** 0..1 — scales upper-partial amplitudes (mallet hardness). */
  bright?: number;
  /** Pitch glide: ratio applied to all partials over `glideTime`. */
  glide?: number;
  glideTime?: number;
  /** Detune (cents) — humanization. */
  cents?: number;
}

/** Strike a modal instrument at `freq`. Returns the end time. */
export function strike(o: Out, t: number, freq: number, partials: ModalPartial[], opts: StrikeOpts = {}): number {
  const { ctx } = o;
  const gain = opts.gain ?? 1;
  const attack = opts.attack ?? 0.004;
  const bright = opts.bright ?? 1;
  const decay = opts.decay ?? 1;
  // Higher notes ring shorter (like real bars); normalized at ~F4.
  const pitchDecay = Math.min(1.4, Math.max(0.35, (349 / freq) ** 0.45));
  const out = voiceOut(o, { pan: opts.pan, wet: opts.wet });
  let end = t;
  partials.forEach((p, i) => {
    const f = freq * p.r;
    if (f > MAX_PARTIAL_HZ) return;
    // Taper energy that approaches the top of the band — keeps things warm.
    const hfTaper = f > 4000 ? Math.max(0, 1 - (f - 4000) / 5000) : 1;
    const amp = gain * p.g * (i === 0 ? 1 : bright) * hfTaper;
    if (amp < 1e-4) return;
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = f;
    osc.detune.value = (p.c ?? 0) + (opts.cents ?? 0);
    if (opts.glide && opts.glide !== 1) {
      osc.frequency.setValueAtTime(f, t);
      osc.frequency.exponentialRampToValueAtTime(f * opts.glide, t + (opts.glideTime ?? 0.05));
    }
    const g = ctx.createGain();
    const e = percEnv(g.gain, t, amp, attack * (i === 0 ? 1 : 0.7), p.t60 * decay * pitchDecay);
    osc.connect(g).connect(out);
    osc.start(t);
    stopAt(osc, e);
    end = Math.max(end, e);
  });
  return mark(o, end);
}

// ---------------------------------------------------------------------------
// Felt piano (additive, soft hammer)
// ---------------------------------------------------------------------------

export function feltPiano(o: Out, t: number, freq: number, opts: StrikeOpts & { partials?: number } = {}): number {
  const { ctx } = o;
  const n = opts.partials ?? 7;
  const gain = opts.gain ?? 1;
  const bright = opts.bright ?? 0.7;
  const decay = opts.decay ?? 1;
  const baseT60 = Math.min(3.2, Math.max(0.8, 2.4 * (262 / freq) ** 0.5)) * decay;
  const out = voiceOut(o, { pan: opts.pan, wet: opts.wet });
  const B = 0.00035; // slight string inharmonicity
  let end = t;
  for (let k = 1; k <= n; k++) {
    const f = freq * k * Math.sqrt(1 + B * k * k);
    if (f > 7000) break;
    const amp = (gain * (k === 1 ? 1 : bright * 0.55)) / k ** 1.5;
    const osc = ctx.createOscillator();
    osc.frequency.value = f;
    osc.detune.value = opts.cents ?? 0;
    const g = ctx.createGain();
    const e = percEnv(g.gain, t, amp, (opts.attack ?? 0.007) * (k === 1 ? 1.2 : 1), baseT60 / k ** 0.75);
    osc.connect(g).connect(out);
    osc.start(t);
    stopAt(osc, e);
    end = Math.max(end, e);
  }
  // Felt thump: a whisper of low noise at the hammer strike.
  noiseBurst(o, t, { type: 'lowpass', freq: Math.min(900, freq * 1.5), q: 0.7, gain: gain * 0.05, attack: 0.002, t60: 0.05 }, out);
  return mark(o, end);
}

// ---------------------------------------------------------------------------
// Filtered noise gestures
// ---------------------------------------------------------------------------

export interface NoiseOpts {
  type?: BiquadFilterType;
  freq: number;
  q?: number;
  gain: number;
  attack: number;
  t60: number;
  pan?: number;
  /** End frequency for a filter sweep over the envelope. */
  toFreq?: number;
}

/** A short burst of filtered noise (mallet thump, click body, rustle). */
export function noiseBurst(o: Out, t: number, n: NoiseOpts, dest?: AudioNode): number {
  const { ctx } = o;
  const src = ctx.createBufferSource();
  src.buffer = noiseBuffer(ctx, 'white', 1.3, 3);
  const f = ctx.createBiquadFilter();
  f.type = n.type ?? 'bandpass';
  f.frequency.value = n.freq;
  f.Q.value = n.q ?? 1;
  if (n.toFreq) {
    f.frequency.setValueAtTime(n.freq, t);
    f.frequency.exponentialRampToValueAtTime(n.toFreq, t + n.attack + n.t60);
  }
  const g = ctx.createGain();
  const end = percEnv(g.gain, t, n.gain, n.attack, n.t60);
  const target = dest ?? voiceOut(o, { pan: n.pan });
  src.connect(f).connect(g).connect(target);
  src.start(t, o.rng() * 1.0);
  src.stop(end);
  return mark(o, end);
}

export interface BreathOpts {
  /** Filter frequency keyframes [time offset s, Hz]. */
  sweep: [number, number][];
  q?: number;
  gain: number;
  attack: number;
  hold?: number;
  release: number;
  panFrom?: number;
  panTo?: number;
  lowpass?: number;
  wet?: number;
}

/** Breathy filtered-noise swell (whooshes, steam, gas "fwoomp"). */
export function breath(o: Out, t: number, b: BreathOpts): number {
  const { ctx } = o;
  const src = ctx.createBufferSource();
  src.buffer = noiseBuffer(ctx, 'pink', 2.1, 5);
  const bp = ctx.createBiquadFilter();
  bp.type = 'bandpass';
  bp.Q.value = b.q ?? 0.8;
  b.sweep.forEach(([dt, hz], i) => {
    if (i === 0) bp.frequency.setValueAtTime(hz, t + dt);
    else bp.frequency.exponentialRampToValueAtTime(hz, t + dt);
  });
  const lp = ctx.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.value = b.lowpass ?? 3500;
  lp.Q.value = 0.5;
  const g = ctx.createGain();
  const end = arEnvSmooth(g.gain, t, b.gain, b.attack, b.hold ?? 0, b.release);
  const pan = ctx.createStereoPanner();
  pan.pan.setValueAtTime(b.panFrom ?? 0, t);
  pan.pan.linearRampToValueAtTime(b.panTo ?? b.panFrom ?? 0, end);
  src.connect(bp).connect(lp).connect(g).connect(pan).connect(o.out);
  if (b.wet && o.wet) {
    const s = ctx.createGain();
    s.gain.value = b.wet;
    pan.connect(s).connect(o.wet);
  }
  src.start(t, o.rng() * 1.5);
  src.stop(end + 0.01);
  return mark(o, end);
}

/** Attack → hold → exponential-ish release, all click-free. */
export function arEnvSmooth(param: AudioParam, t: number, peak: number, attack: number, hold: number, release: number): number {
  param.value = 0; // intrinsic 0: no full-gain sample before the first event
  param.setValueAtTime(0, t);
  param.linearRampToValueAtTime(peak * 0.2, t + attack * 0.4);
  param.linearRampToValueAtTime(peak, t + attack);
  if (hold > 0) param.setValueAtTime(peak, t + attack + hold);
  param.exponentialRampToValueAtTime(Math.max(SILENCE, peak * 0.003), t + attack + hold + release);
  param.linearRampToValueAtTime(0, t + attack + hold + release + 0.02);
  return t + attack + hold + release + 0.03;
}

// ---------------------------------------------------------------------------
// Tonal gestures
// ---------------------------------------------------------------------------

export interface ToneOpts {
  type?: OscillatorType;
  gain: number;
  attack: number;
  t60: number;
  pan?: number;
  wet?: number;
  /** Frequency glide target (ratio) and duration. */
  glide?: number;
  glideTime?: number;
  cents?: number;
}

/** A single enveloped oscillator (bubbles, pops, thumps). */
export function tone(o: Out, t: number, freq: number, opts: ToneOpts, dest?: AudioNode): number {
  const { ctx } = o;
  const osc = ctx.createOscillator();
  osc.type = opts.type ?? 'sine';
  osc.frequency.setValueAtTime(freq, t);
  if (opts.glide) osc.frequency.exponentialRampToValueAtTime(freq * opts.glide, t + (opts.glideTime ?? 0.05));
  osc.detune.value = opts.cents ?? 0;
  const g = ctx.createGain();
  const end = percEnv(g.gain, t, opts.gain, opts.attack, opts.t60);
  osc.connect(g).connect(dest ?? voiceOut(o, { pan: opts.pan, wet: opts.wet }));
  osc.start(t);
  osc.stop(end);
  return mark(o, end);
}

/**
 * Warm pad: detuned triangles through a lowpass that can open over time.
 * Used under celebrations for a cozy "glow".
 */
export function pad(
  o: Out,
  t: number,
  freqs: number[],
  opts: { gain: number; attack: number; release: number; cutoff?: number; cutoffTo?: number; glideFrom?: number; wet?: number; hold?: number },
): number {
  const { ctx } = o;
  const lp = ctx.createBiquadFilter();
  lp.type = 'lowpass';
  lp.Q.value = 0.4;
  const c0 = opts.cutoff ?? 900;
  lp.frequency.setValueAtTime(c0, t);
  if (opts.cutoffTo) lp.frequency.exponentialRampToValueAtTime(opts.cutoffTo, t + opts.attack + (opts.hold ?? 0));
  const g = ctx.createGain();
  const end = arEnvSmooth(g.gain, t, opts.gain / Math.sqrt(freqs.length), opts.attack, opts.hold ?? 0, opts.release);
  const out = voiceOut(o, { wet: opts.wet });
  lp.connect(g).connect(out);
  freqs.forEach((f, i) => {
    for (const det of [-6, 6]) {
      const osc = ctx.createOscillator();
      osc.type = 'triangle';
      if (opts.glideFrom) {
        osc.frequency.setValueAtTime(f * opts.glideFrom, t);
        osc.frequency.exponentialRampToValueAtTime(f, t + opts.attack * 0.9);
      } else osc.frequency.value = f;
      osc.detune.value = det + i * 1.3;
      const pg = ctx.createGain();
      pg.gain.value = 0.5;
      osc.connect(pg).connect(lp);
      osc.start(t);
      osc.stop(end);
    }
  });
  return mark(o, end);
}

// ---------------------------------------------------------------------------
// FM electric piano (Rhodes-ish) — used by the lo-fi ambience
// ---------------------------------------------------------------------------

export interface EpOpts {
  gain: number;
  dur: number;
  pan?: number;
  /** 0..1 velocity → brightness. */
  vel?: number;
  /** Shared pitch-wobble signal (cents) to connect into detune. */
  wow?: AudioNode | null;
  wet?: number;
}

export function ePiano(o: Out, t: number, freq: number, opts: EpOpts): number {
  const { ctx } = o;
  const vel = opts.vel ?? 0.6;
  const out = voiceOut(o, { pan: opts.pan, wet: opts.wet });
  const t60 = Math.min(4.5, Math.max(1.4, 3.2 * (262 / freq) ** 0.6));
  const relAt = t + Math.min(opts.dur, t60);
  const release = 0.35;
  const end = relAt + release + 0.05;

  // Body: carrier 1:1 modulator, index decays from bright to mellow.
  const car = ctx.createOscillator();
  car.frequency.value = freq;
  const mod = ctx.createOscillator();
  mod.frequency.value = freq;
  const idx = ctx.createGain();
  const i0 = freq * (1.1 + vel * 1.3);
  idx.gain.setValueAtTime(i0, t);
  idx.gain.exponentialRampToValueAtTime(i0 * 0.3, t + 0.6);
  idx.gain.exponentialRampToValueAtTime(i0 * 0.12, relAt + release);
  mod.connect(idx).connect(car.frequency);

  // Tine "bark": high-ratio modulator, very fast decay, quiet.
  const car2 = ctx.createOscillator();
  car2.frequency.value = freq;
  const mod2 = ctx.createOscillator();
  mod2.frequency.value = freq * 7;
  const idx2 = ctx.createGain();
  const j0 = freq * 0.35 * vel;
  idx2.gain.setValueAtTime(j0, t);
  idx2.gain.exponentialRampToValueAtTime(Math.max(0.01, j0 * 0.02), t + 0.08);
  mod2.connect(idx2).connect(car2.frequency);

  const amp = ctx.createGain();
  amp.gain.value = 0;
  const peak = opts.gain * (0.55 + vel * 0.45);
  // Exponential decay (−60 dB over t60) up to the note-off, then a short release.
  // Ramping to the value the decay would have at note-off keeps the same curve.
  const decayed = peak * 0.001 ** Math.max(0, (relAt - t - 0.004) / t60);
  amp.gain.setValueAtTime(0, t);
  amp.gain.linearRampToValueAtTime(peak, t + 0.004);
  amp.gain.exponentialRampToValueAtTime(Math.max(SILENCE, decayed), relAt);
  amp.gain.exponentialRampToValueAtTime(SILENCE, relAt + release);
  amp.gain.linearRampToValueAtTime(0, relAt + release + 0.02);
  const amp2 = ctx.createGain();
  percEnv(amp2.gain, t, peak * 0.22 * vel, 0.002, 0.18);

  car.connect(amp).connect(out);
  car2.connect(amp2).connect(out);
  if (opts.wow) {
    opts.wow.connect(car.detune);
    opts.wow.connect(car2.detune);
    opts.wow.connect(mod.detune);
  }
  for (const n of [car, mod, car2, mod2]) {
    n.start(t);
    n.stop(end);
  }
  return mark(o, end);
}

// ---------------------------------------------------------------------------
// Reverb: a small warm wooden room, synthesized impulse response.
// ---------------------------------------------------------------------------

export function roomImpulse(ctx: BaseAudioContext, seconds = 1.6, seed = 11): AudioBuffer {
  const sr = ctx.sampleRate;
  const len = Math.floor(sr * seconds);
  const buf = ctx.createBuffer(2, len, sr);
  for (let ch = 0; ch < 2; ch++) {
    const rng = mulberry32(seed + ch * 101);
    const d = new Float32Array(len);
    const pre = Math.floor(sr * 0.012);
    let lp = 0;
    for (let i = pre; i < len; i++) {
      const x = (i - pre) / sr;
      // Damping increases over time: later reflections get darker.
      const coeff = Math.min(0.92, 0.35 + x * 0.9);
      lp = lp * coeff + (rng() * 2 - 1) * (1 - coeff);
      const env = Math.exp((-6.9 * x) / (seconds * 0.85));
      d[i] = lp * env;
    }
    // Early reflections (wood panels, close walls).
    const taps = [0.017, 0.023, 0.031, 0.043, 0.057];
    taps.forEach((tt, k) => {
      const idx = Math.floor(sr * (tt + ch * 0.0017));
      if (idx < len) d[idx]! += (0.35 / (k + 1)) * (rng() > 0.5 ? 1 : -1);
    });
    // Fade the last 50 ms to exactly zero.
    const fl = Math.floor(sr * 0.05);
    for (let i = 0; i < fl; i++) d[len - 1 - i]! *= i / fl;
    buf.copyToChannel(d, ch);
  }
  return buf;
}
