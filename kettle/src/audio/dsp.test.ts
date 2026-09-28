import { describe, expect, it } from 'vitest';
import {
  PENTATONIC,
  VoicePool,
  brownNoise,
  dbToGain,
  densityGain,
  fadeCurve,
  gainToDb,
  makeLoopable,
  midiToFreq,
  mulberry32,
  pentaFreq,
  pentaMidi,
  pinkNoise,
  poissonGap,
  sampleCurve,
  snapToPentatonic,
  volumeToGain,
  whiteNoise,
} from './dsp';

describe('tonal palette', () => {
  it('maps MIDI to Hz', () => {
    expect(midiToFreq(69)).toBeCloseTo(440, 6);
    expect(midiToFreq(65)).toBeCloseTo(349.228, 2); // F4
  });

  it('walks the F major pentatonic', () => {
    expect([0, 1, 2, 3, 4, 5].map((s) => pentaMidi(s))).toEqual([65, 67, 69, 72, 74, 77]);
    expect(pentaMidi(-1)).toBe(62); // D4
    expect(pentaMidi(-5)).toBe(53); // F3
    expect(pentaFreq(5) / pentaFreq(0)).toBeCloseTo(2, 6);
  });

  it('snaps semitone offsets up into the scale', () => {
    for (let s = -24; s <= 24; s++) {
      const snapped = snapToPentatonic(s);
      expect(snapped).toBeGreaterThanOrEqual(s);
      expect(snapped - s).toBeLessThanOrEqual(2);
      expect(PENTATONIC).toContain(((snapped % 12) + 12) % 12);
    }
    expect(snapToPentatonic(1)).toBe(2);
    expect(snapToPentatonic(10)).toBe(12);
  });
});

describe('gain', () => {
  it('volume curve is silent at 0, unity at 1 and monotonic', () => {
    expect(volumeToGain(0)).toBe(0);
    expect(volumeToGain(-1)).toBe(0);
    expect(volumeToGain(Number.NaN)).toBe(0);
    expect(volumeToGain(1)).toBe(1);
    expect(volumeToGain(2)).toBe(1);
    expect(gainToDb(volumeToGain(0.5))).toBeCloseTo(-12.04, 1);
    let prev = -1;
    for (let v = 0; v <= 1; v += 0.05) {
      const g = volumeToGain(v);
      expect(g).toBeGreaterThanOrEqual(prev);
      prev = g;
    }
  });

  it('dB helpers round-trip', () => {
    expect(gainToDb(dbToGain(-6))).toBeCloseTo(-6, 9);
    expect(gainToDb(0)).toBe(-Infinity);
  });

  it('fade curves hit their endpoints and are monotonic', () => {
    for (const shape of ['linear', 'equalPower', 'easeOut'] as const) {
      const up = fadeCurve(0, 1, 33, shape);
      const down = fadeCurve(0.8, 0.1, 33, shape);
      expect(up[0]).toBe(0);
      expect(up[32]).toBe(1);
      expect(down[0]).toBeCloseTo(0.8, 6);
      expect(down[32]).toBeCloseTo(0.1, 6);
      for (let i = 1; i < 33; i++) {
        expect(up[i]!).toBeGreaterThanOrEqual(up[i - 1]!);
        expect(down[i]!).toBeLessThanOrEqual(down[i - 1]!);
      }
    }
    // Equal-power crossfade keeps summed power ≈ constant.
    const a = fadeCurve(0, 1, 65, 'equalPower');
    const b = fadeCurve(1, 0, 65, 'equalPower');
    for (let i = 0; i < 65; i++) expect(a[i]! ** 2 + b[i]! ** 2).toBeCloseTo(1, 5);
    expect(sampleCurve(a, 0.5)).toBeCloseTo(Math.SQRT1_2, 2);
  });

  it('ease-out fades land softly on silence', () => {
    const c = fadeCurve(1, 0, 101, 'easeOut');
    const cos = fadeCurve(1, 0, 101, 'equalPower');
    // Last 10% of the fade: the ease-out is already quiet and barely moving.
    expect(c[90]!).toBeLessThan(0.02);
    expect(Math.abs(c[100]! - c[99]!)).toBeLessThan(Math.abs(cos[100]! - cos[99]!) / 10);
  });
});

describe('randomness', () => {
  it('mulberry32 is deterministic and uniform-ish', () => {
    const a = mulberry32(42);
    const b = mulberry32(42);
    const xs = Array.from({ length: 5000 }, () => a());
    expect(xs.slice(0, 5)).toEqual(Array.from({ length: 5 }, () => b()));
    const mean = xs.reduce((s, x) => s + x, 0) / xs.length;
    expect(mean).toBeGreaterThan(0.47);
    expect(mean).toBeLessThan(0.53);
    expect(Math.min(...xs)).toBeGreaterThanOrEqual(0);
    expect(Math.max(...xs)).toBeLessThan(1);
  });

  it('poisson gaps average 1/rate', () => {
    const rng = mulberry32(1);
    let sum = 0;
    for (let i = 0; i < 20000; i++) sum += poissonGap(rng, 8);
    expect(sum / 20000).toBeCloseTo(1 / 8, 2);
  });
});

describe('noise', () => {
  const rms = (d: Float32Array) => Math.sqrt(d.reduce((s, x) => s + x * x, 0) / d.length);
  const mean = (d: Float32Array) => d.reduce((s, x) => s + x, 0) / d.length;

  it('generators are DC-free and bounded', () => {
    for (const gen of [whiteNoise, pinkNoise, brownNoise]) {
      const d = gen(48000 * 2, mulberry32(3));
      expect(Math.abs(mean(d))).toBeLessThan(0.01);
      expect(rms(d)).toBeGreaterThan(0.02);
      expect(Math.max(...d.map(Math.abs))).toBeLessThan(2);
    }
  });

  it('loopable buffers have no seam discontinuity', () => {
    for (const gen of [whiteNoise, pinkNoise, brownNoise]) {
      const src = gen(48000, mulberry32(9));
      const fade = 4800;
      const loop = makeLoopable(src, fade);
      expect(loop.length).toBe(src.length - fade);
      // Wrap-around step (last → first) is no bigger than a typical in-buffer step.
      const steps: number[] = [];
      for (let i = 1; i < loop.length; i++) steps.push(Math.abs(loop[i]! - loop[i - 1]!));
      steps.sort((x, y) => x - y);
      const p99 = steps[Math.floor(steps.length * 0.99)]!;
      const seam = Math.abs(loop[0]! - loop[loop.length - 1]!);
      expect(seam).toBeLessThanOrEqual(p99);
    }
  });
});

describe('voice pool', () => {
  const rule = { max: 3, minGapMs: 30 };

  it('drops retriggers inside the min gap', () => {
    const p = new VoicePool();
    expect(p.request('tap', 0, 100, rule).accept).toBe(true);
    expect(p.request('tap', 10, 100, rule).accept).toBe(false);
    expect(p.request('tap', 40, 100, rule).accept).toBe(true);
  });

  it('steals the oldest beyond max voices', () => {
    const p = new VoicePool();
    const ids = [0, 40, 80].map((t) => p.request('tick', t, 1000, rule).id);
    const d = p.request('tick', 120, 1000, rule);
    expect(d.accept).toBe(true);
    expect(d.steal).toEqual([ids[0]]);
  });

  it('enforces a global voice cap', () => {
    const p = new VoicePool(4);
    for (let i = 0; i < 4; i++) p.request(`s${i}`, i, 5000, rule);
    const d = p.request('s9', 10, 5000, rule);
    expect(d.steal.length).toBe(1);
    expect(p.active.length).toBe(4);
  });

  it('a meaningful sound replaces a just-played tap; taps yield to others', () => {
    const p = new VoicePool();
    const tap = p.request('tap', 0, 100, { max: 3, minGapMs: 30, yieldMs: 60 });
    const start = p.request('start', 10, 1000, { max: 1, minGapMs: 400 });
    expect(start.steal).toContain(tap.id);
    expect(p.request('tap', 30, 100, { max: 3, minGapMs: 30, yieldMs: 60 }).accept).toBe(false);
  });

  it('rapid repeats get gently quieter (density ducking)', () => {
    const p = new VoicePool();
    const gains: number[] = [];
    for (let i = 0; i < 20; i++) {
      const d = p.request('tap', i * 50, 90, rule);
      if (d.accept) gains.push(d.gain);
    }
    expect(gains[0]).toBe(1);
    expect(gains[gains.length - 1]).toBeLessThan(0.5);
    expect(Math.min(...gains)).toBeGreaterThanOrEqual(0.45);
    // …and recovers after a pause.
    expect(p.request('tap', 5000, 90, rule).gain).toBe(1);
    expect(densityGain(0)).toBe(1);
  });
});
