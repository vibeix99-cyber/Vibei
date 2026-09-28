/**
 * Pure signal measurement for the audio check (scripts/audio-check.mjs) and
 * unit tests: peak / RMS / LUFS-ish loudness (BS.1770 K-weighting + gating),
 * DC, click detection, audible duration, spectral balance, STFT and WAV.
 * OWNER: audio area.
 */

export interface Metrics {
  seconds: number;
  peakDb: number;
  rmsDb: number;
  /** Integrated loudness (gated), LUFS-ish. */
  lufsI: number;
  /** Max momentary (400 ms) loudness — what we normalize SFX on. */
  lufsM: number;
  /** Max short-term (3 s) loudness. */
  lufsS: number;
  /** Integrated loudness through a 250 Hz high-pass (phone-speaker proxy). */
  lufsPhone: number;
  /** Loudness range (LU): spread of 3 s short-term loudness, 10th→95th percentile (EBU-style gating). */
  lra: number;
  dc: number;
  /** |first sample| and |last sample|. */
  startAbs: number;
  endAbs: number;
  /** Audible end: last time the signal exceeds −60 dBFS. */
  audibleEnd: number;
  /** Worst discontinuity score (2nd-difference spike vs local level). */
  clickScore: number;
  clickAt: number;
  /** Spectral centroid (Hz) and energy share above 4 / 8 kHz. */
  centroid: number;
  hf4k: number;
  hf8k: number;
  /** Samples at/over ±1. */
  clipped: number;
  /** L/R correlation (1 = mono). */
  stereoCorr: number;
}

const db = (x: number) => (x <= 0 ? -Infinity : 20 * Math.log10(x));

// ---------------------------------------------------------------------------
// K-weighting (pyloudnorm-style biquads, valid at any sample rate)
// ---------------------------------------------------------------------------

type Biquad = { b0: number; b1: number; b2: number; a1: number; a2: number };

function highShelf(sr: number, fc = 1681.974450955533, gainDb = 3.999843853973347, q = 0.7071752369554196): Biquad {
  const A = 10 ** (gainDb / 40);
  const w0 = (2 * Math.PI * fc) / sr;
  const alpha = Math.sin(w0) / (2 * q);
  const cw = Math.cos(w0);
  const sA = Math.sqrt(A);
  const a0 = A + 1 - (A - 1) * cw + 2 * sA * alpha;
  return {
    b0: (A * (A + 1 + (A - 1) * cw + 2 * sA * alpha)) / a0,
    b1: (-2 * A * (A - 1 + (A + 1) * cw)) / a0,
    b2: (A * (A + 1 + (A - 1) * cw - 2 * sA * alpha)) / a0,
    a1: (2 * (A - 1 - (A + 1) * cw)) / a0,
    a2: (A + 1 - (A - 1) * cw - 2 * sA * alpha) / a0,
  };
}

function highPass(sr: number, fc = 38.13547087602444, q = 0.5003270373238773): Biquad {
  const w0 = (2 * Math.PI * fc) / sr;
  const alpha = Math.sin(w0) / (2 * q);
  const cw = Math.cos(w0);
  const a0 = 1 + alpha;
  return {
    b0: (1 + cw) / 2 / a0,
    b1: -(1 + cw) / a0,
    b2: (1 + cw) / 2 / a0,
    a1: (-2 * cw) / a0,
    a2: (1 - alpha) / a0,
  };
}

function biquad(x: Float32Array, c: Biquad): Float32Array {
  const y = new Float32Array(x.length);
  let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
  for (let i = 0; i < x.length; i++) {
    const xi = x[i]!;
    const yi = c.b0 * xi + c.b1 * x1 + c.b2 * x2 - c.a1 * y1 - c.a2 * y2;
    x2 = x1;
    x1 = xi;
    y2 = y1;
    y1 = yi;
    y[i] = yi;
  }
  return y;
}

/** 2nd-order high-pass (RBJ) — used for the small-speaker loudness proxy. */
export function highPassFilter(x: Float32Array, sr: number, fc: number, q = 0.7071): Float32Array {
  return biquad(x, highPass(sr, fc, q));
}

/** Loudness as heard on a phone speaker (≈ nothing below ~250 Hz): LUFS-I after a 250 Hz high-pass. */
export function phoneLoudness(channels: Float32Array[], sr: number): number {
  return integratedLoudness(
    channels.map((c) => highPassFilter(highPassFilter(c, sr, 250), sr, 250)),
    sr,
  );
}

export function kWeight(x: Float32Array, sr: number): Float32Array {
  return biquad(biquad(x, highShelf(sr)), highPass(sr));
}

/** Block loudness series (LUFS) for window `winS`, hop `hopS`. Signals shorter than a window are zero-padded. */
export function blockLoudness(channels: Float32Array[], sr: number, winS = 0.4, hopS = 0.1): number[] {
  const kw = channels.map((c) => kWeight(c, sr));
  const win = Math.round(winS * sr);
  const hop = Math.round(hopS * sr);
  const n = Math.max(win, kw[0]!.length);
  const out: number[] = [];
  // Prefix sums of squares per channel for O(1) windows.
  const pref = kw.map((c) => {
    const p = new Float64Array(n + 1);
    for (let i = 0; i < n; i++) p[i + 1] = p[i]! + (i < c.length ? c[i]! * c[i]! : 0);
    return p;
  });
  for (let s = 0; s + win <= n; s += hop) {
    let sum = 0;
    for (const p of pref) sum += (p[s + win]! - p[s]!) / win;
    out.push(sum > 0 ? -0.691 + 10 * Math.log10(sum) : -Infinity);
  }
  return out;
}

/** EBU R128-style loudness range from short-term (3 s) block loudness values. */
export function loudnessRange(shortTerm: number[]): number {
  const abs = shortTerm.filter((l) => l > -70);
  if (abs.length < 2) return 0;
  const mean = 10 * Math.log10(abs.reduce((acc, l) => acc + 10 ** (l / 10), 0) / abs.length);
  const g = abs.filter((l) => l > mean - 20).sort((a, b) => a - b);
  const q = (p: number) => g[Math.min(g.length - 1, Math.max(0, Math.round(p * (g.length - 1))))]!;
  return q(0.95) - q(0.1);
}

export function integratedLoudness(channels: Float32Array[], sr: number): number {
  const blocks = blockLoudness(channels, sr, 0.4, 0.1);
  const abs = blocks.filter((l) => l > -70);
  if (abs.length === 0) return -Infinity;
  const mean = (ls: number[]) => 10 * Math.log10(ls.reduce((s, l) => s + 10 ** (l / 10), 0) / ls.length);
  const rel = mean(abs) - 10;
  const gated = abs.filter((l) => l > rel);
  return gated.length ? mean(gated) : -Infinity;
}

// ---------------------------------------------------------------------------
// Click detection
// ---------------------------------------------------------------------------

/**
 * Discontinuity score: max over time of |2nd difference| relative to the
 * local RMS of the 2nd difference (±10 ms, excluding the point's ±2 samples).
 * Smooth audio scores < ~10; a hard step / cut scores in the hundreds.
 */
export function clickScore(x: Float32Array, sr: number, edges = true): { score: number; at: number } {
  const n = x.length;
  if (n < 3) return { score: 0, at: 0 };
  const d2 = new Float32Array(n);
  for (let i = 2; i < n; i++) d2[i] = x[i]! - 2 * x[i - 1]! + x[i - 2]!;
  // Include the implicit edges: silence before the start and after the end.
  const pre = Math.abs(x[0]!);
  const post = Math.abs(x[n - 1]!);
  const w = Math.max(8, Math.round(sr * 0.01));
  const pref = new Float64Array(n + 1);
  for (let i = 0; i < n; i++) pref[i + 1] = pref[i]! + d2[i]! * d2[i]!;
  let best = 0;
  let at = 0;
  let peak = 0;
  for (let i = 0; i < n; i++) peak = Math.max(peak, Math.abs(x[i]!));
  const floor = Math.max(1e-6, peak * 2e-4);
  for (let i = 2; i < n; i++) {
    const a = Math.abs(d2[i]!);
    if (a < 1e-3) continue;
    const lo = Math.max(0, i - w);
    const hi = Math.min(n, i + w + 1);
    // Exclude the point and its immediate neighbours (a step shows up as a ± pair).
    const ex0 = Math.max(lo, i - 2);
    const ex1 = Math.min(hi, i + 3);
    const e = pref[hi]! - pref[lo]! - (pref[ex1]! - pref[ex0]!);
    const rms = Math.sqrt(Math.max(0, e) / Math.max(1, hi - lo - (ex1 - ex0)));
    const s = a / (rms + floor);
    if (s > best) {
      best = s;
      at = i / sr;
    }
  }
  // Edge steps (sound starting/ending on a non-zero sample).
  const edge = Math.max(pre, post) / floor;
  if (edges && Math.max(pre, post) > 1e-3 && edge > best) {
    best = edge;
    at = pre >= post ? 0 : (n - 1) / sr;
  }
  return { score: best, at };
}

// ---------------------------------------------------------------------------
// Spectrum
// ---------------------------------------------------------------------------

/** In-place iterative radix-2 FFT. */
export function fft(re: Float64Array, im: Float64Array): void {
  const n = re.length;
  for (let i = 1, j = 0; i < n; i++) {
    let bit = n >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) {
      [re[i], re[j]] = [re[j]!, re[i]!];
      [im[i], im[j]] = [im[j]!, im[i]!];
    }
  }
  for (let len = 2; len <= n; len <<= 1) {
    const ang = (-2 * Math.PI) / len;
    const wr = Math.cos(ang);
    const wi = Math.sin(ang);
    for (let i = 0; i < n; i += len) {
      let cr = 1, ci = 0;
      for (let k = 0; k < len / 2; k++) {
        const ar = re[i + k]!, ai = im[i + k]!;
        const br = re[i + k + len / 2]! * cr - im[i + k + len / 2]! * ci;
        const bi = re[i + k + len / 2]! * ci + im[i + k + len / 2]! * cr;
        re[i + k] = ar + br;
        im[i + k] = ai + bi;
        re[i + k + len / 2] = ar - br;
        im[i + k + len / 2] = ai - bi;
        const t = cr * wr - ci * wi;
        ci = cr * wi + ci * wr;
        cr = t;
      }
    }
  }
}

/** STFT power frames (Hann window). Returns frames[t][bin] of power. */
export function stft(x: Float32Array, size = 2048, hop = 512): Float64Array[] {
  const win = new Float64Array(size);
  for (let i = 0; i < size; i++) win[i] = 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / (size - 1));
  const frames: Float64Array[] = [];
  for (let s = 0; s + size <= Math.max(size, x.length); s += hop) {
    const re = new Float64Array(size);
    const im = new Float64Array(size);
    for (let i = 0; i < size; i++) re[i] = (x[s + i] ?? 0) * win[i]!;
    fft(re, im);
    const p = new Float64Array(size / 2);
    for (let k = 0; k < size / 2; k++) p[k] = re[k]! * re[k]! + im[k]! * im[k]!;
    frames.push(p);
  }
  return frames;
}

export function spectralBalance(x: Float32Array, sr: number): { centroid: number; hf4k: number; hf8k: number } {
  const size = 2048;
  const frames = stft(x, size, 1024);
  const acc = new Float64Array(size / 2);
  for (const f of frames) for (let k = 0; k < f.length; k++) acc[k]! += f[k]!;
  let total = 0, w = 0, e4 = 0, e8 = 0;
  for (let k = 1; k < acc.length; k++) {
    const hz = (k * sr) / size;
    total += acc[k]!;
    w += acc[k]! * hz;
    if (hz >= 4000) e4 += acc[k]!;
    if (hz >= 8000) e8 += acc[k]!;
  }
  return total > 0 ? { centroid: w / total, hf4k: e4 / total, hf8k: e8 / total } : { centroid: 0, hf4k: 0, hf8k: 0 };
}

// ---------------------------------------------------------------------------
// All metrics
// ---------------------------------------------------------------------------

export function mono(channels: Float32Array[]): Float32Array {
  const n = channels[0]!.length;
  const m = new Float32Array(n);
  for (const c of channels) for (let i = 0; i < n; i++) m[i]! += c[i]! / channels.length;
  return m;
}

export function measure(channels: Float32Array[], sr: number, opts: { edges?: boolean } = {}): Metrics {
  const n = channels[0]!.length;
  let peak = 0, sq = 0, sum = 0, clipped = 0;
  let lr = 0, ll = 0, rr = 0;
  let lastLoud = 0;
  const thr = 10 ** (-60 / 20);
  for (let i = 0; i < n; i++) {
    let loud = false;
    for (const c of channels) {
      const v = c[i]!;
      const a = Math.abs(v);
      if (a > peak) peak = a;
      if (a >= 0.9999) clipped++;
      if (a > thr) loud = true;
      sq += v * v;
      sum += v;
    }
    if (loud) lastLoud = i;
    if (channels.length >= 2) {
      const l = channels[0]![i]!, r = channels[1]![i]!;
      lr += l * r;
      ll += l * l;
      rr += r * r;
    }
  }
  const count = n * channels.length;
  const m = mono(channels);
  let worst = { score: 0, at: 0 };
  for (const c of channels) {
    const cs = clickScore(c, sr, opts.edges ?? true);
    if (cs.score > worst.score) worst = cs;
  }
  const bal = spectralBalance(m, sr);
  const mom = blockLoudness(channels, sr, 0.4, 0.1);
  const st = blockLoudness(channels, sr, 3, 0.5);
  return {
    seconds: n / sr,
    peakDb: db(peak),
    rmsDb: db(Math.sqrt(sq / count)),
    lufsI: integratedLoudness(channels, sr),
    lufsM: Math.max(...mom),
    lufsS: Math.max(...st),
    lufsPhone: phoneLoudness(channels, sr),
    lra: loudnessRange(st),
    dc: sum / count,
    startAbs: Math.max(...channels.map((c) => Math.abs(c[0]!))),
    endAbs: Math.max(...channels.map((c) => Math.abs(c[n - 1]!))),
    audibleEnd: lastLoud / sr,
    clickScore: worst.score,
    clickAt: worst.at,
    centroid: bal.centroid,
    hf4k: bal.hf4k,
    hf8k: bal.hf8k,
    clipped,
    stereoCorr: ll > 0 && rr > 0 ? lr / Math.sqrt(ll * rr) : 1,
  };
}

// ---------------------------------------------------------------------------
// WAV
// ---------------------------------------------------------------------------

/** 16-bit PCM WAV. */
export function encodeWav(channels: Float32Array[], sr: number): Uint8Array {
  const nCh = channels.length;
  const n = channels[0]!.length;
  const bytes = 44 + n * nCh * 2;
  const buf = new ArrayBuffer(bytes);
  const v = new DataView(buf);
  const str = (o: number, s: string) => {
    for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i));
  };
  str(0, 'RIFF');
  v.setUint32(4, bytes - 8, true);
  str(8, 'WAVE');
  str(12, 'fmt ');
  v.setUint32(16, 16, true);
  v.setUint16(20, 1, true);
  v.setUint16(22, nCh, true);
  v.setUint32(24, sr, true);
  v.setUint32(28, sr * nCh * 2, true);
  v.setUint16(32, nCh * 2, true);
  v.setUint16(34, 16, true);
  str(36, 'data');
  v.setUint32(40, n * nCh * 2, true);
  let o = 44;
  for (let i = 0; i < n; i++) {
    for (let c = 0; c < nCh; c++) {
      const s = Math.max(-1, Math.min(1, channels[c]![i]!));
      v.setInt16(o, Math.round(s < 0 ? s * 0x8000 : s * 0x7fff), true);
      o += 2;
    }
  }
  return new Uint8Array(buf);
}

/** RMS envelope (dBFS) in fixed steps — for checking a sound's shape (e.g. whistle vs chime balance). */
export function rmsEnvelope(channels: Float32Array[], sr: number, stepS = 0.1): number[] {
  const step = Math.max(1, Math.round(stepS * sr));
  const n = channels[0]!.length;
  const out: number[] = [];
  for (let s = 0; s < n; s += step) {
    let acc = 0;
    let cnt = 0;
    for (const c of channels) {
      for (let i = s; i < Math.min(n, s + step); i++) acc += c[i]! * c[i]!;
      cnt += Math.min(n, s + step) - s;
    }
    out.push(Math.round(10 * db(Math.sqrt(acc / Math.max(1, cnt)))) / 10);
  }
  return out;
}
