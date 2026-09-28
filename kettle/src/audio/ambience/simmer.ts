/**
 * Kettle simmer — the kettle heating up over the last ~40 s of a focus
 * session: a low rumble, small bubbles that get busier, and a faint hiss of
 * steam. Driven by a 0..1 `heat` value (ramped in audio time).
 * OWNER: audio area.
 */
import { logRange, pick, rrange } from '../dsp';
import { loopNoise, startLoop } from '../instruments';
import { BaseAmbient, EventClock, bubbleGrains, type AmbientDest } from './common';

export class Simmer extends BaseAmbient {
  readonly kind = 'simmer';
  private heat!: ConstantSourceNode;
  private bubbleClock!: EventClock;
  private lanes_: GainNode[] = [];
  /** JS mirror of the heat automation for event density: linear h0@t0 → h1@t1. */
  private h = { h0: 0, t0: 0, h1: 0, t1: 0 };

  constructor(d: AmbientDest) {
    super(d);
  }

  heatAt(t: number): number {
    const { h0, t0, h1, t1 } = this.h;
    if (t <= t0) return h0;
    if (t >= t1) return h1;
    return h0 + ((h1 - h0) * (t - t0)) / (t1 - t0);
  }

  /** Ramp heat linearly from its current value to `target`, arriving at `at + dur`. */
  setHeat(target: number, at: number, dur: number): void {
    const cur = this.heatAt(at);
    const p = this.heat.offset;
    p.cancelScheduledValues(at);
    p.setValueAtTime(cur, at);
    p.linearRampToValueAtTime(target, at + Math.max(0.05, dur));
    this.h = { h0: cur, t0: at, h1: target, t1: at + Math.max(0.05, dur) };
  }

  start(at: number): void {
    const { ctx, rng } = this;
    this.heat = this.own(ctx.createConstantSource());
    this.heat.offset.value = 0;
    // heat² via a waveshaper so hiss/bubbles bloom late, not linearly.
    const sq = ctx.createWaveShaper();
    const curve = new Float32Array(257);
    for (let i = 0; i < curve.length; i++) {
      const x = (i / (curve.length - 1)) * 2 - 1;
      curve[i] = x > 0 ? x * x : 0;
    }
    sq.curve = curve;
    this.heat.connect(sq);

    const rumble = this.own(loopNoise(this.o, 'brown', { seconds: 8.9, seed: 71, rate: 1.05 }));
    const rG = this.gain(0);
    this.chain(rumble, this.filter('lowpass', 170, 0.6), this.filter('highpass', 40, 0.6), rG, this.output);
    this.heat.connect(this.gain(0.18, rG.gain));

    const hiss = this.own(loopNoise(this.o, 'pink', { seconds: 9.7, seed: 72, rate: 0.95 }));
    const hG = this.gain(0);
    this.chain(hiss, this.filter('bandpass', 1900, 0.8), this.filter('lowpass', 3200, 0.5), hG, this.output);
    sq.connect(this.gain(0.07, hG.gain));

    startLoop(rumble, at, rng);
    startLoop(hiss, at, rng);
    this.heat.start(at);

    this.lanes_ = this.lanes(this.output, [-0.25, -0.1, 0.05, 0.2]);
    this.bubbleClock = new EventClock(rng, (t) => 0.5 + 12 * this.heatAt(t) ** 1.5, at);
  }

  schedule(from: number, to: number): void {
    const { rng } = this;
    const grains = bubbleGrains(this.ctx);
    this.bubbleClock.run(from, to, (t) => {
      const h = this.heatAt(t);
      if (h < 0.02) return;
      this.grain(pick(rng, grains), t, logRange(rng, 0.06, 0.18) * Math.min(1, h * 1.5), pick(rng, this.lanes_), rrange(rng, 0.85, 1.25));
    });
  }
}
