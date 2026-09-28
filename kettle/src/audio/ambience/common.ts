/**
 * Shared ambience machinery: the voice interface, random-walk modulators,
 * Poisson event clocks, and JS-synthesized grain banks (droplets, crackles,
 * bubbles). Grains are generated once per context from seeded noise — no
 * sample files — and replayed with random rate / gain / pan so nothing loops.
 * OWNER: audio area.
 */
import { logRange, mulberry32, poissonGap, rrange, type Rng } from '../dsp';
import { cachedBuffer, type Out } from '../instruments';

export interface AmbientDest {
  ctx: BaseAudioContext;
  dry: AudioNode;
  wet: AudioNode | null;
  rng: Rng;
}

export interface AmbientVoice {
  readonly kind: string;
  /** Crossfade gain → dry bus (engine-controlled; starts at 0). */
  readonly output: GainNode;
  /** Crossfade gain → reverb bus (follows `output`). */
  readonly wetOutput: GainNode;
  /** How far ahead events have been scheduled (ctx time). */
  scheduledTo: number;
  start(at: number): void;
  /** Schedule discrete events for [from, to). Called with contiguous windows. */
  schedule(from: number, to: number): void;
  stop(at: number): void;
}

/** Base class: owns output gains, remembers sources so stop() can end them. */
export abstract class BaseAmbient implements AmbientVoice {
  abstract readonly kind: string;
  readonly output: GainNode;
  readonly wetOutput: GainNode;
  scheduledTo = 0;
  protected readonly ctx: BaseAudioContext;
  protected readonly rng: Rng;
  /** Instrument-style output for layers (dry → output, wet → wetOutput). */
  protected readonly o: Out;
  private sources: AudioScheduledSourceNode[] = [];
  private stopped = false;

  constructor(d: AmbientDest) {
    this.ctx = d.ctx;
    this.rng = d.rng;
    this.output = d.ctx.createGain();
    this.output.gain.value = 0;
    this.output.connect(d.dry);
    this.wetOutput = d.ctx.createGain();
    this.wetOutput.gain.value = 0;
    if (d.wet) this.wetOutput.connect(d.wet);
    this.o = { ctx: d.ctx, out: this.output, wet: d.wet ? this.wetOutput : null, rng: d.rng };
  }

  protected own<T extends AudioScheduledSourceNode>(src: T): T {
    this.sources.push(src);
    return src;
  }

  abstract start(at: number): void;
  abstract schedule(from: number, to: number): void;

  stop(at: number): void {
    if (this.stopped) return;
    this.stopped = true;
    for (const s of this.sources) {
      try {
        s.stop(at);
      } catch {
        /* already stopped */
      }
    }
    this.sources = [];
  }

  // -- helpers ---------------------------------------------------------------
  protected gain(value: number, dest?: AudioNode | AudioParam): GainNode {
    const g = this.ctx.createGain();
    g.gain.value = value;
    if (dest && 'connect' in dest) g.connect(dest);
    else if (dest) g.connect(dest);
    return g;
  }

  protected filter(type: BiquadFilterType, freq: number, q = 0.7): BiquadFilterNode {
    const f = this.ctx.createBiquadFilter();
    f.type = type;
    f.frequency.value = freq;
    f.Q.value = q;
    return f;
  }

  /** Chain nodes left → right; returns the last. */
  protected chain(...nodes: AudioNode[]): AudioNode {
    for (let i = 0; i < nodes.length - 1; i++) nodes[i]!.connect(nodes[i + 1]!);
    return nodes[nodes.length - 1]!;
  }

  /** Play a grain buffer once. */
  protected grain(buf: AudioBuffer, t: number, gain: number, dest: AudioNode, rate = 1): void {
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    src.playbackRate.value = rate;
    const g = this.ctx.createGain();
    g.gain.value = gain;
    src.connect(g).connect(dest);
    src.start(t);
  }

  /** A fixed set of stereo "lanes" (pre-panned gains) so events need fewer nodes. */
  protected lanes(dest: AudioNode, pans: number[]): GainNode[] {
    return pans.map((p) => {
      const g = this.ctx.createGain();
      const pan = this.ctx.createStereoPanner();
      pan.pan.value = p;
      g.connect(pan).connect(dest);
      return g;
    });
  }
}

// ---------------------------------------------------------------------------
// Modulators and clocks
// ---------------------------------------------------------------------------

export interface DriftOpts {
  min: number;
  max: number;
  minDur: number;
  maxDur: number;
  /** Bias toward the low end (1 = uniform, 2 = mostly low with occasional peaks). */
  skew?: number;
}

/** Random-walk automation: chains linear ramps to random targets. */
export class Drift {
  private t: number;
  constructor(
    private readonly param: AudioParam,
    private readonly rng: Rng,
    private readonly o: DriftOpts,
    t0: number,
    initial?: number,
  ) {
    this.t = t0;
    param.setValueAtTime(initial ?? this.pickValue(), t0);
  }
  private pickValue(): number {
    const u = this.rng() ** (this.o.skew ?? 1);
    return this.o.min + (this.o.max - this.o.min) * u;
  }
  schedule(to: number): void {
    while (this.t < to) {
      this.t += rrange(this.rng, this.o.minDur, this.o.maxDur);
      this.param.linearRampToValueAtTime(this.pickValue(), this.t);
    }
  }
}

/** Poisson event clock with a (possibly time-varying) rate. */
export class EventClock {
  next: number;
  constructor(
    private readonly rng: Rng,
    private readonly rate: (t: number) => number,
    t0: number,
  ) {
    this.next = t0 + poissonGap(rng, rate(t0));
  }
  run(from: number, to: number, fire: (t: number) => void): void {
    while (this.next < to) {
      if (this.next >= from) fire(this.next);
      this.next += poissonGap(this.rng, this.rate(this.next));
    }
  }
}

// ---------------------------------------------------------------------------
// Grain banks (plain JS synthesis, cached per context)
// ---------------------------------------------------------------------------

function onePoleLp(d: Float32Array, cutoff: number, sr: number): void {
  const a = Math.exp((-2 * Math.PI * cutoff) / sr);
  let y = 0;
  for (let i = 0; i < d.length; i++) {
    y = (1 - a) * d[i]! + a * y;
    d[i] = y;
  }
}

function onePoleHp(d: Float32Array, cutoff: number, sr: number): void {
  const a = Math.exp((-2 * Math.PI * cutoff) / sr);
  let x1 = 0, y = 0;
  for (let i = 0; i < d.length; i++) {
    const x = d[i]!;
    y = a * (y + x - x1);
    x1 = x;
    d[i] = y;
  }
}

/** Fade in over `inMs` and out over the last `outMs` so grains never click. */
function edges(d: Float32Array, sr: number, inMs: number, outMs: number): void {
  const fi = Math.max(1, Math.floor((sr * inMs) / 1000));
  const fo = Math.max(1, Math.floor((sr * outMs) / 1000));
  for (let i = 0; i < fi && i < d.length; i++) d[i]! *= i / fi;
  for (let i = 0; i < fo && i < d.length; i++) d[d.length - 1 - i]! *= i / fo;
}

function peakNorm(d: Float32Array): Float32Array {
  let m = 0;
  for (let i = 0; i < d.length; i++) m = Math.max(m, Math.abs(d[i]!));
  if (m > 0) for (let i = 0; i < d.length; i++) d[i]! /= m;
  return d;
}

/** Rain ticks on glass: short damped resonances + a tiny noise click. */
export function dropletGrains(ctx: BaseAudioContext): AudioBuffer[] {
  return cachedBuffer(ctx, 'droplets', (sr) => {
    const rng = mulberry32(2024);
    const out: Float32Array[] = [];
    for (let k = 0; k < 16; k++) {
      const len = Math.floor(sr * 0.045);
      const d = new Float32Array(len);
      const f = logRange(rng, 1400, 3400);
      const tau = rrange(rng, 0.003, 0.009);
      const nt = rrange(rng, 0.0006, 0.0015);
      const ph = rng() * Math.PI * 2;
      for (let i = 0; i < len; i++) {
        const t = i / sr;
        d[i] = Math.exp(-t / tau) * Math.sin(2 * Math.PI * f * t + ph) * 0.7 + Math.exp(-t / nt) * (rng() * 2 - 1) * 0.5;
      }
      onePoleLp(d, 4200, sr);
      onePoleHp(d, 300, sr);
      edges(d, sr, 0.15, 6);
      out.push(peakNorm(d));
    }
    return out;
  });
}

/** Heavier drips (from the gutter onto the sill): the rising "plip" of a bubble. */
export function dripGrains(ctx: BaseAudioContext): AudioBuffer[] {
  return cachedBuffer(ctx, 'drips', (sr) => {
    const rng = mulberry32(77);
    const out: Float32Array[] = [];
    for (let k = 0; k < 8; k++) {
      const len = Math.floor(sr * 0.14);
      const d = new Float32Array(len);
      const f0 = logRange(rng, 700, 1300);
      const rise = rrange(rng, 0.5, 1.1);
      const tau = rrange(rng, 0.018, 0.032);
      let ph = 0;
      for (let i = 0; i < len; i++) {
        const t = i / sr;
        const f = f0 * (1 + rise * (1 - Math.exp(-t / 0.02)));
        ph += (2 * Math.PI * f) / sr;
        const env = (1 - Math.exp(-t / 0.0015)) * Math.exp(-t / tau);
        d[i] = env * Math.sin(ph) + Math.exp(-t / 0.0008) * (rng() * 2 - 1) * 0.25;
      }
      onePoleLp(d, 5000, sr);
      edges(d, sr, 0.3, 10);
      out.push(peakNorm(d));
    }
    return out;
  });
}

/** Wood-fire crackles: tiny impulses with a short resonant ring. */
export function crackleGrains(ctx: BaseAudioContext): AudioBuffer[] {
  return cachedBuffer(ctx, 'crackles', (sr) => {
    const rng = mulberry32(99);
    const out: Float32Array[] = [];
    for (let k = 0; k < 24; k++) {
      const len = Math.floor(sr * 0.03);
      const d = new Float32Array(len);
      const f = logRange(rng, 1100, 3600);
      const tauN = rrange(rng, 0.0003, 0.0018);
      const tauR = rrange(rng, 0.002, 0.007);
      const ph = rng() * Math.PI * 2;
      for (let i = 0; i < len; i++) {
        const t = i / sr;
        d[i] = Math.exp(-t / tauN) * (rng() * 2 - 1) + Math.exp(-t / tauR) * Math.sin(2 * Math.PI * f * t + ph) * 0.35;
      }
      onePoleHp(d, 500, sr);
      onePoleLp(d, 5200, sr);
      edges(d, sr, 0.08, 4);
      out.push(peakNorm(d));
    }
    return out;
  });
}

/** Bigger pops: a crack with a low woody body. */
export function popGrains(ctx: BaseAudioContext): AudioBuffer[] {
  return cachedBuffer(ctx, 'pops', (sr) => {
    const rng = mulberry32(5150);
    const out: Float32Array[] = [];
    for (let k = 0; k < 8; k++) {
      const len = Math.floor(sr * 0.16);
      const d = new Float32Array(len);
      const fb = logRange(rng, 170, 420);
      const tauB = rrange(rng, 0.02, 0.045);
      const second = rrange(rng, 0.008, 0.03);
      for (let i = 0; i < len; i++) {
        const t = i / sr;
        const crack = Math.exp(-t / 0.0012) * (rng() * 2 - 1);
        const crack2 = t > second ? Math.exp(-(t - second) / 0.0008) * (rng() * 2 - 1) * 0.5 : 0;
        const body = (1 - Math.exp(-t / 0.001)) * Math.exp(-t / tauB) * Math.sin(2 * Math.PI * fb * t) * 0.8;
        d[i] = crack + crack2 + body;
      }
      onePoleLp(d, 4500, sr);
      edges(d, sr, 0.1, 10);
      out.push(peakNorm(d));
    }
    return out;
  });
}

/** Vinyl surface clicks: very short, band-limited. */
export function vinylGrains(ctx: BaseAudioContext): AudioBuffer[] {
  return cachedBuffer(ctx, 'vinyl', (sr) => {
    const rng = mulberry32(33);
    const out: Float32Array[] = [];
    for (let k = 0; k < 12; k++) {
      const len = Math.floor(sr * 0.008);
      const d = new Float32Array(len);
      const tau = rrange(rng, 0.00015, 0.0006);
      for (let i = 0; i < len; i++) d[i] = Math.exp(-i / sr / tau) * (rng() * 2 - 1);
      onePoleHp(d, 900, sr);
      onePoleLp(d, 3800, sr);
      edges(d, sr, 0.05, 2);
      out.push(peakNorm(d));
    }
    return out;
  });
}

/** Simmer bubbles: small rising "bloops". */
export function bubbleGrains(ctx: BaseAudioContext): AudioBuffer[] {
  return cachedBuffer(ctx, 'bubbles', (sr) => {
    const rng = mulberry32(4242);
    const out: Float32Array[] = [];
    for (let k = 0; k < 12; k++) {
      const len = Math.floor(sr * 0.07);
      const d = new Float32Array(len);
      const f0 = logRange(rng, 260, 620);
      const rise = rrange(rng, 0.3, 0.8);
      const tau = rrange(rng, 0.01, 0.022);
      let ph = 0;
      for (let i = 0; i < len; i++) {
        const t = i / sr;
        const f = f0 * (1 + rise * (t / 0.07));
        ph += (2 * Math.PI * f) / sr;
        d[i] = (1 - Math.exp(-t / 0.002)) * Math.exp(-t / tau) * Math.sin(ph);
      }
      edges(d, sr, 0.3, 8);
      out.push(peakNorm(d));
    }
    return out;
  });
}

export { logRange, rrange };
