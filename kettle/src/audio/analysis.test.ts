import { describe, expect, it } from 'vitest';
import { clickScore, encodeWav, fft, integratedLoudness, measure, spectralBalance } from './analysis';

const SR = 48000;
function sine(freq: number, amp: number, seconds: number, sr = SR): Float32Array {
  const n = Math.round(seconds * sr);
  const d = new Float32Array(n);
  for (let i = 0; i < n; i++) d[i] = amp * Math.sin((2 * Math.PI * freq * i) / sr);
  return d;
}
function fadeEdges(d: Float32Array, ms = 10): Float32Array {
  const f = Math.round((SR * ms) / 1000);
  for (let i = 0; i < f; i++) {
    d[i]! *= i / f;
    d[d.length - 1 - i]! *= i / f;
  }
  return d;
}

describe('loudness (BS.1770-style)', () => {
  it('a −20 dBFS 997 Hz stereo sine reads ≈ −20 LUFS', () => {
    const s = sine(997, 0.1, 3);
    expect(integratedLoudness([s, s], SR)).toBeCloseTo(-20, 0);
  });

  it('mono in one channel reads 3 dB lower than both', () => {
    const s = sine(997, 0.1, 3);
    const z = new Float32Array(s.length);
    expect(integratedLoudness([s, z], SR)).toBeCloseTo(-23, 0);
  });

  it('K-weighting de-emphasizes lows', () => {
    const lo = sine(40, 0.1, 3);
    const mid = sine(1000, 0.1, 3);
    expect(integratedLoudness([lo, lo], SR)).toBeLessThan(integratedLoudness([mid, mid], SR) - 3);
  });

  it('silence is −Infinity', () => {
    const z = new Float32Array(SR);
    expect(integratedLoudness([z, z], SR)).toBe(-Infinity);
  });
});

describe('measure', () => {
  it('peak, rms, dc and duration', () => {
    const s = fadeEdges(sine(440, 0.5, 1));
    const pad = new Float32Array(SR);
    pad.set(s, 0);
    const m = measure([pad, pad], SR);
    expect(m.peakDb).toBeCloseTo(-6.02, 1);
    expect(Math.abs(m.dc)).toBeLessThan(1e-4);
    expect(m.audibleEnd).toBeGreaterThan(0.95);
    expect(m.audibleEnd).toBeLessThan(1.01);
    expect(m.clipped).toBe(0);
    expect(m.stereoCorr).toBeCloseTo(1, 5);
  });

  it('counts clipped samples', () => {
    const s = sine(100, 1.5, 0.1);
    expect(measure([s], SR).clipped).toBeGreaterThan(0);
  });
});

describe('click detection', () => {
  it('smooth enveloped tones score low', () => {
    const s = fadeEdges(sine(700, 0.5, 0.5), 5);
    expect(clickScore(s, SR).score).toBeLessThan(15);
  });

  it('a hard cut mid-signal scores high and is located', () => {
    const s = fadeEdges(sine(700, 0.5, 0.5), 5);
    const cut = new Float32Array(s.length);
    cut.set(s.subarray(0, 12017), 0); // abrupt stop near a peak at ~0.25 s
    const r = clickScore(cut, SR);
    expect(r.score).toBeGreaterThan(40);
    expect(r.at).toBeCloseTo(0.25, 2);
  });

  it('a sound that starts on a non-zero sample is flagged via edges', () => {
    const s = sine(700, 0.5, 0.2);
    for (let i = 0; i < s.length; i++) s[i] = 0.5 * Math.cos((2 * Math.PI * 700 * i) / SR) * Math.exp(-i / 2000);
    expect(clickScore(s, SR).score).toBeGreaterThan(40);
    expect(clickScore(s, SR, false).score).toBeLessThan(40);
  });
});

describe('spectrum', () => {
  it('fft finds a bin-centred tone', () => {
    const n = 1024;
    const re = new Float64Array(n);
    const im = new Float64Array(n);
    for (let i = 0; i < n; i++) re[i] = Math.sin((2 * Math.PI * 32 * i) / n);
    fft(re, im);
    let best = 0;
    for (let k = 1; k < n / 2; k++) if (Math.hypot(re[k]!, im[k]!) > Math.hypot(re[best]!, im[best]!)) best = k;
    expect(best).toBe(32);
  });

  it('spectral balance reflects where the energy is', () => {
    const lo = spectralBalance(sine(300, 0.5, 1), SR);
    const hi = spectralBalance(sine(9000, 0.5, 1), SR);
    expect(lo.centroid).toBeGreaterThan(250);
    expect(lo.centroid).toBeLessThan(400);
    expect(lo.hf4k).toBeLessThan(0.01);
    expect(hi.hf8k).toBeGreaterThan(0.95);
  });
});

describe('wav', () => {
  it('writes a valid 16-bit stereo header', () => {
    const d = sine(440, 0.5, 0.01);
    const bytes = encodeWav([d, d], SR);
    const v = new DataView(bytes.buffer);
    const str = (o: number) => String.fromCharCode(...bytes.subarray(o, o + 4));
    expect(str(0)).toBe('RIFF');
    expect(str(8)).toBe('WAVE');
    expect(v.getUint16(22, true)).toBe(2);
    expect(v.getUint32(24, true)).toBe(SR);
    expect(v.getUint32(40, true)).toBe(d.length * 4);
    expect(bytes.length).toBe(44 + d.length * 4);
  });
});
