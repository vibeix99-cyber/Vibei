// CRITIC HARNESS — signal measurement for the AUDIO piece.
// Loaded into the running page. Renders the game's own synthesis through an
// OfflineAudioContext and measures the resulting Float32Array. Nothing here
// touches src/ — it only imports and drives it.

import { Audio as AudioClass, TRACKS, SFX, SFX_ALIAS } from '/src/audio/audio.js';

export const SR = 48000;

/* ---------------- FFT (radix-2, iterative) ---------------- */
function fft(re, im) {
  const n = re.length;
  for (let i = 1, j = 0; i < n; i++) {
    let bit = n >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) { [re[i], re[j]] = [re[j], re[i]]; [im[i], im[j]] = [im[j], im[i]]; }
  }
  for (let len = 2; len <= n; len <<= 1) {
    const ang = -2 * Math.PI / len;
    const wr = Math.cos(ang), wi = Math.sin(ang);
    for (let i = 0; i < n; i += len) {
      let cr = 1, ci = 0;
      for (let k = 0; k < len / 2; k++) {
        const ur = re[i + k], ui = im[i + k];
        const vr = re[i + k + len / 2] * cr - im[i + k + len / 2] * ci;
        const vi = re[i + k + len / 2] * ci + im[i + k + len / 2] * cr;
        re[i + k] = ur + vr; im[i + k] = ui + vi;
        re[i + k + len / 2] = ur - vr; im[i + k + len / 2] = ui - vi;
        const ncr = cr * wr - ci * wi; ci = cr * wi + ci * wr; cr = ncr;
      }
    }
  }
}

function spectrum(x, off, N) {
  const re = new Float64Array(N), im = new Float64Array(N);
  for (let i = 0; i < N; i++) {
    const s = off + i < x.length ? x[off + i] : 0;
    re[i] = s * (0.5 - 0.5 * Math.cos(2 * Math.PI * i / (N - 1)));   // hann
  }
  fft(re, im);
  const half = N >> 1;
  const mag = new Float64Array(half);
  for (let i = 0; i < half; i++) mag[i] = Math.hypot(re[i], im[i]);
  return mag;
}

/* ---------------- log band fingerprint ---------------- */
const NBANDS = 14;
const F_LO = 45, F_HI = 16000;
function bandEdges() {
  const e = [];
  for (let i = 0; i <= NBANDS; i++) e.push(F_LO * Math.pow(F_HI / F_LO, i / NBANDS));
  return e;
}
const EDGES = bandEdges();

function bandsOf(mag, sr, N) {
  const out = new Float64Array(NBANDS);
  const binHz = sr / N;
  for (let b = 0; b < NBANDS; b++) {
    const lo = Math.max(1, Math.floor(EDGES[b] / binHz));
    const hi = Math.min(mag.length - 1, Math.ceil(EDGES[b + 1] / binHz));
    let s = 0, n = 0;
    for (let i = lo; i <= hi; i++) { s += mag[i] * mag[i]; n++; }
    out[b] = n ? Math.sqrt(s / n) : 0;
  }
  return out;
}

/* ---------------- top-level measurement ---------------- */
export function measure(buf, opts = {}) {
  const L = buf.getChannelData(0);
  const R = buf.numberOfChannels > 1 ? buf.getChannelData(1) : L;
  const n = L.length, sr = buf.sampleRate;
  const mono = new Float32Array(n);
  let peakL = 0, peakR = 0, sum = 0;
  for (let i = 0; i < n; i++) {
    const l = L[i], r = R[i];
    const a = Math.abs(l), b = Math.abs(r);
    if (a > peakL) peakL = a;
    if (b > peakR) peakR = b;
    const m = (l + r) * 0.5;
    mono[i] = m; sum += m * m;
  }
  const peak = Math.max(peakL, peakR);
  const rms = Math.sqrt(sum / n);

  // clipped sample count at the destination
  let clipped = 0;
  for (let i = 0; i < n; i++) { if (Math.abs(L[i]) >= 0.999 || Math.abs(R[i]) >= 0.999) clipped++; }

  // audible span: -50 dB below peak
  const thr = peak * 0.00316;
  let first = -1, last = -1;
  for (let i = 0; i < n; i++) if (Math.abs(mono[i]) > thr) { first = i; break; }
  for (let i = n - 1; i >= 0; i--) if (Math.abs(mono[i]) > thr) { last = i; break; }

  // RMS over the audible span only, so a 20 ms blip is not diluted by a 4 s window
  let spanSum = 0, spanN = 0;
  if (first >= 0) { for (let i = first; i <= last; i++) { spanSum += mono[i] * mono[i]; spanN++; } }
  const rmsSpan = spanN ? Math.sqrt(spanSum / spanN) : 0;

  // envelope in 2 ms hops
  const hop = Math.round(sr * 0.002);
  const env = [];
  for (let i = 0; i + hop <= n; i += hop) {
    let s = 0;
    for (let k = 0; k < hop; k++) s += mono[i + k] * mono[i + k];
    env.push(Math.sqrt(s / hop));
  }
  const envPeak = Math.max(...env, 1e-12);
  let attackHops = 0;
  for (let i = 0; i < env.length; i++) { if (env[i] >= envPeak * 0.9) { attackHops = i; break; } }
  const peakHop = env.indexOf(envPeak);
  let decayHops = env.length - peakHop;
  for (let i = peakHop; i < env.length; i++) { if (env[i] <= envPeak * 0.1) { decayHops = i - peakHop; break; } }

  // spectral: average bands over the audible span, plus centroid
  const N = 4096;
  const startS = first < 0 ? 0 : first;
  const endS = last < 0 ? n : last;
  const acc = new Float64Array(NBANDS);
  let frames = 0, cenNum = 0, cenDen = 0, flatN = 0, flatLog = 0, flatLin = 0;
  for (let off = startS; off + N <= Math.max(endS, startS + N); off += Math.round(N / 2)) {
    if (off + N > n) break;
    const mag = spectrum(mono, off, N);
    const bands = bandsOf(mag, sr, N);
    for (let b = 0; b < NBANDS; b++) acc[b] += bands[b];
    frames++;
    const binHz = sr / N;
    for (let i = 1; i < mag.length; i++) {
      const p = mag[i] * mag[i];
      cenNum += p * i * binHz; cenDen += p;
      if (i * binHz > 40 && i * binHz < 16000) { flatLog += Math.log(p + 1e-20); flatLin += p; flatN++; }
    }
  }
  if (!frames) {
    const mag = spectrum(mono, 0, Math.min(N, 1 << Math.floor(Math.log2(n))));
    const bands = bandsOf(mag, sr, mag.length * 2);
    for (let b = 0; b < NBANDS; b++) acc[b] = bands[b];
    frames = 1;
    const binHz = sr / (mag.length * 2);
    for (let i = 1; i < mag.length; i++) { const p = mag[i] * mag[i]; cenNum += p * i * binHz; cenDen += p; }
  }
  const bands = Array.from(acc, (v) => v / frames);
  const centroid = cenDen > 0 ? cenNum / cenDen : 0;
  const flatness = flatN ? Math.exp(flatLog / flatN) / (flatLin / flatN + 1e-20) : 0;

  // onsets: envelope rises > 6 dB over 20 ms
  let onsets = 0;
  const look = Math.max(1, Math.round(0.02 / 0.002));
  for (let i = look; i < env.length; i++) {
    if (env[i] > envPeak * 0.06 && env[i] > env[i - look] * 2.0 &&
        (i < look * 2 || env[i] > env[i - look * 2] * 1.6)) { onsets++; i += look; }
  }

  // stereo width
  let sMid = 0, sSide = 0;
  for (let i = 0; i < n; i++) { const m = (L[i] + R[i]) / 2, s = (L[i] - R[i]) / 2; sMid += m * m; sSide += s * s; }
  const width = sMid > 0 ? Math.sqrt(sSide / sMid) : 0;

  return {
    peak: +peak.toFixed(5), peakL: +peakL.toFixed(5), peakR: +peakR.toFixed(5),
    rms: +rms.toFixed(6), rmsDb: +(20 * Math.log10(rms + 1e-12)).toFixed(2),
    rmsSpanDb: +(20 * Math.log10(rmsSpan + 1e-12)).toFixed(2),
    peakDb: +(20 * Math.log10(peak + 1e-12)).toFixed(2),
    crest: +(20 * Math.log10((peak + 1e-12) / (rms + 1e-12))).toFixed(2),
    clipped,
    tStart: first < 0 ? null : +(first / sr).toFixed(4),
    dur: first < 0 ? 0 : +((last - first) / sr).toFixed(4),
    attackMs: +(attackHops * 2).toFixed(1),
    decayMs: +(decayHops * 2).toFixed(1),
    centroid: Math.round(centroid),
    flatness: +flatness.toFixed(4),
    onsets,
    width: +width.toFixed(3),
    bands: bands.map((v) => +(20 * Math.log10(v + 1e-12)).toFixed(1)),
    ...(opts.keepEnv ? { env: env.map((v) => +v.toFixed(5)) } : {})
  };
}

/* ---------------- offline render driver ---------------- */
export async function render(setup, seconds, o = {}) {
  const oc = new OfflineAudioContext(2, Math.ceil(seconds * SR), SR);
  const A = new AudioClass();
  A.setSeed(o.seed ?? 1337);
  A.masterVol = o.master ?? 0.7;
  A.musicVol = o.musicVol ?? 0.35;
  A.sfxVol = o.sfxVol ?? 0.8;
  A.init(oc);
  A.muted = false;
  await setup(A, oc);
  const buf = await oc.startRendering();
  return buf;
}

export async function renderSfx(key, seconds = 3.0, opts = {}, ro = {}) {
  return render((A) => { A.sfx(key, opts); }, seconds, ro);
}

/* time-domain fingerprint: 6 time slices x 14 bands, normalised.
   Two sounds that differ only in level get the same fingerprint; two that
   differ in timbre or shape do not. */
export function fingerprint(buf) {
  const L = buf.getChannelData(0), R = buf.numberOfChannels > 1 ? buf.getChannelData(1) : L;
  const n = L.length;
  const mono = new Float32Array(n);
  for (let i = 0; i < n; i++) mono[i] = (L[i] + R[i]) * 0.5;
  // trim to audible span
  let peak = 0; for (let i = 0; i < n; i++) peak = Math.max(peak, Math.abs(mono[i]));
  const thr = peak * 0.0032;
  let a = 0, b = n - 1;
  while (a < n && Math.abs(mono[a]) <= thr) a++;
  while (b > a && Math.abs(mono[b]) <= thr) b--;
  const len = Math.max(4096, b - a);
  const SLICES = 6, N = 2048;
  const v = [];
  for (let s = 0; s < SLICES; s++) {
    const off = a + Math.floor(len * s / SLICES);
    const mag = spectrum(mono, Math.min(off, n - N - 1 > 0 ? n - N - 1 : 0), N);
    const bands = bandsOf(mag, SR, N);
    for (let k = 0; k < NBANDS; k++) v.push(Math.log10(bands[k] + 1e-9));
  }
  // z-normalise so it is a shape, not a level
  const mean = v.reduce((s, x) => s + x, 0) / v.length;
  const sd = Math.sqrt(v.reduce((s, x) => s + (x - mean) ** 2, 0) / v.length) || 1;
  return v.map((x) => (x - mean) / sd);
}

export function cosDist(a, b) {
  let d = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) { d += a[i] * b[i]; na += a[i] * a[i]; nb += b[i] * b[i]; }
  return 1 - d / (Math.sqrt(na * nb) + 1e-12);
}

export function euclid(a, b) {
  let s = 0; for (let i = 0; i < a.length; i++) s += (a[i] - b[i]) ** 2;
  return Math.sqrt(s / a.length);
}

export { TRACKS, SFX, SFX_ALIAS, AudioClass };
