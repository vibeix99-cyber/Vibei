/**
 * The mixing graph, shared by the live engine and offline renders so what we
 * measure is what users hear:
 *
 *   sfx ──────────────┐
 *   sfxWet ─┐         │
 *   ambWet ─┴→ room ──┼→ master → DC guard → gentle compressor → trim → soft clip → out
 *   amb ──────────────┘
 *
 * OWNER: audio area.
 */
import { dbToGain, fadeCurve, sampleCurve, type FadeShape, type Rng } from './dsp';
import { roomImpulse } from './instruments';
import { SFX, pitchRatio, type PlayOptions, type SfxName } from './sfx';

/**
 * Compensates the DynamicsCompressor's automatic makeup gain so the chain is
 * ~unity below threshold (measured by scripts/audio-check.mjs → "chain gain").
 */
export const COMP_MAKEUP_TRIM_DB = -2.88;

export interface Graph {
  ctx: BaseAudioContext;
  sfx: GainNode;
  sfxWet: GainNode;
  amb: GainNode;
  ambWet: GainNode;
  master: GainNode;
  comp: DynamicsCompressorNode;
}

/** Soft-knee clipper curve: linear to ±0.8, then smoothly saturates toward ±1. */
export function softClipCurve(n = 2049, knee = 0.8): Float32Array<ArrayBuffer> {
  const c = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const x = (i / (n - 1)) * 2 - 1;
    const a = Math.abs(x);
    const y = a <= knee ? a : knee + (1 - knee) * Math.tanh((a - knee) / (1 - knee));
    c[i] = Math.sign(x) * y;
  }
  return c;
}

export function buildGraph(ctx: BaseAudioContext, dest: AudioNode = ctx.destination): Graph {
  const g = (v: number) => {
    const n = ctx.createGain();
    n.gain.value = v;
    return n;
  };
  const master = g(1);
  const dc = ctx.createBiquadFilter();
  dc.type = 'highpass';
  dc.frequency.value = 22;
  dc.Q.value = 0.6;
  const comp = ctx.createDynamicsCompressor();
  comp.threshold.value = -12;
  comp.knee.value = 10;
  comp.ratio.value = 3;
  comp.attack.value = 0.006;
  comp.release.value = 0.3;
  const trim = g(dbToGain(COMP_MAKEUP_TRIM_DB));
  const clip = ctx.createWaveShaper();
  clip.curve = softClipCurve();
  master.connect(dc).connect(comp).connect(trim).connect(clip).connect(dest);

  const room = ctx.createConvolver();
  room.buffer = roomImpulse(ctx);
  const roomReturn = g(0.55);
  room.connect(roomReturn).connect(master);

  const sfx = g(1);
  const sfxWet = g(1);
  const amb = g(1);
  const ambWet = g(1);
  sfx.connect(master);
  amb.connect(master);
  sfxWet.connect(room);
  ambWet.connect(room);
  return { ctx, sfx, sfxWet, amb, ambWet, master, comp };
}

export interface BuiltVoice {
  dry: GainNode;
  wet: GainNode;
  /** Context time the sound has fully ended (before reverb tail). */
  end: number;
}

/** Build one SFX voice into the graph at time `t`. */
export function buildSfx(graph: Graph, name: SfxName, t: number, opts: PlayOptions, rng: Rng, extraGain = 1): BuiltVoice {
  const { ctx } = graph;
  const def = SFX[name];
  const gain = dbToGain(def.level) * Math.max(0, Math.min(1, opts.volume ?? 1)) * extraGain;
  const dry = ctx.createGain();
  dry.gain.value = gain;
  const wet = ctx.createGain();
  wet.gain.value = gain;
  dry.connect(graph.sfx);
  wet.connect(graph.sfxWet);
  const ratio = def.tonal ? pitchRatio(opts) : 1;
  const track = { end: t };
  const built = def.build({ ctx, out: dry, wet, rng, t, ratio, track });
  const end = Math.max(track.end, built);
  return { dry, wet, end };
}

/**
 * Click-free, interruptible fades on one or more params (e.g. an ambience's
 * dry + wet gains). Keeps its own model of the automation so a new fade can
 * start exactly from the current value in every browser (no cancelAndHold).
 */
export class Fader {
  private points: { t0: number; dur: number; curve: Float32Array } | null = null;
  private value: number;
  constructor(
    private readonly ctx: BaseAudioContext,
    private readonly params: AudioParam[],
    initial = 0,
  ) {
    this.value = initial;
    for (const p of params) p.setValueAtTime(initial, ctx.currentTime);
  }

  valueAt(t: number): number {
    const p = this.points;
    if (!p) return this.value;
    if (t >= p.t0 + p.dur) return p.curve[p.curve.length - 1]!;
    if (t <= p.t0) return p.curve[0]!;
    return sampleCurve(p.curve, (t - p.t0) / p.dur);
  }

  get target(): number {
    return this.points ? this.points.curve[this.points.curve.length - 1]! : this.value;
  }

  fade(to: number, seconds: number, shape: FadeShape = 'equalPower', at = this.ctx.currentTime): void {
    const from = this.valueAt(at);
    // Fading to silence: land softly (see fadeCurve).
    if (to === 0 && shape === 'equalPower') shape = 'easeOut';
    const dur = Math.max(0.02, seconds);
    const segs = 24;
    const curve = fadeCurve(from, to, segs + 1, shape);
    for (const p of this.params) {
      p.cancelScheduledValues(at);
      p.setValueAtTime(from, at);
      for (let i = 1; i <= segs; i++) p.linearRampToValueAtTime(curve[i]!, at + (dur * i) / segs);
    }
    this.points = { t0: at, dur, curve };
    this.value = to;
  }
}
