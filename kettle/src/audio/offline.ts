/**
 * Offline rendering + audit — loaded by scripts/audio-check.mjs inside a real
 * browser (Vite dev server) via dynamic import. Not part of the app bundle.
 * Renders every SFX / ambience through the *same* graph the live engine uses.
 * OWNER: audio area.
 */
import type { AmbientKind } from '@/state/settings';
import { VoicePool, dbToGain, mulberry32 } from './dsp';
import { Fader, buildGraph, buildSfx } from './graph';
import { SFX, SFX_NAMES, type PlayOptions, type SfxName } from './sfx';
import { AMBIENT_LEVELS, SIMMER_LEVEL, Simmer, ambientTrim, createAmbient } from './ambience';
import { encodeWav, measure, mono, rmsEnvelope, stft, type Metrics } from './analysis';

const SR = 48000;
type Kind = Exclude<AmbientKind, 'none'>;

function channels(b: AudioBuffer): Float32Array[] {
  const out: Float32Array[] = [];
  for (let c = 0; c < b.numberOfChannels; c++) out.push(b.getChannelData(c));
  return out;
}

export async function renderSfx(name: SfxName, opts: PlayOptions = {}, seed = 1, dryOnly = false): Promise<{ data: Float32Array[]; declaredEnd: number }> {
  const len = SR * 5;
  const ctx = new OfflineAudioContext(2, len, SR);
  const graph = buildGraph(ctx);
  if (dryOnly) graph.sfxWet.gain.value = 0;
  const v = buildSfx(graph, name, 0.02, opts, mulberry32(seed));
  const buf = await ctx.startRendering();
  const data = channels(buf);
  // Trim trailing silence (keep 50 ms after the last sample above −90 dBFS).
  const thr = 10 ** (-90 / 20);
  let last = 0;
  for (const c of data) for (let i = c.length - 1; i > last; i--) if (Math.abs(c[i]!) > thr) { last = i; break; }
  const end = Math.min(len, last + Math.round(SR * 0.05));
  return { data: data.map((c) => c.slice(0, end)), declaredEnd: v.end };
}

export async function renderAmbient(kind: Kind | 'simmer', seconds = 12, seed = 3): Promise<Float32Array[]> {
  const ctx = new OfflineAudioContext(2, Math.round(SR * seconds), SR);
  const graph = buildGraph(ctx);
  const rng = mulberry32(seed);
  if (kind === 'simmer') {
    const v = new Simmer({ ctx, dry: graph.sfx, wet: null, rng });
    v.start(0);
    const f = new Fader(ctx, [v.output.gain, v.wetOutput.gain], 0);
    f.fade(dbToGain(SIMMER_LEVEL.level), 0.6, 'equalPower', 0);
    v.setHeatPath(0, [{ t: seconds, v: 1 }]);
    // Re-plan mid-way like the engine does after a clock jump / resume: must stay step-free.
    v.setHeatPath(seconds / 2, [
      { t: seconds / 2 + 0.3, v: (seconds / 2 + 0.3) / seconds },
      { t: seconds, v: 1 },
    ]);
    v.schedule(0, seconds);
  } else {
    const v = createAmbient(kind, { ctx, dry: graph.amb, wet: graph.ambWet, rng });
    v.start(0);
    const f = new Fader(ctx, [v.output.gain, v.wetOutput.gain], 0);
    f.fade(ambientTrim(kind), 1, 'equalPower', 0);
    v.schedule(0, seconds);
  }
  return channels(await ctx.startRendering());
}

/** Gain of the master chain for a −20 dBFS 1 kHz sine (should be ~0 dB). */
export async function chainGain(levelDb = -20): Promise<number> {
  const ctx = new OfflineAudioContext(2, SR, SR);
  const graph = buildGraph(ctx);
  const o = ctx.createOscillator();
  o.frequency.value = 1000;
  const g = ctx.createGain();
  g.gain.value = dbToGain(levelDb);
  o.connect(g).connect(graph.sfx);
  o.start(0);
  const b = await ctx.startRendering();
  const d = b.getChannelData(0).slice(SR / 2);
  let s = 0;
  for (const v of d) s += v * v;
  const rms = Math.sqrt(s / d.length);
  return 20 * Math.log10(rms / (dbToGain(levelDb) / Math.SQRT2));
}

/** Worst-case stacks through the voice pool + limiter. */
export async function renderScenario(name: 'tapStorm' | 'celebration' | 'countUp' | 'ambientPlusComplete' | 'rapidSwitch'): Promise<Float32Array[]> {
  const seconds = name === 'ambientPlusComplete' ? 8 : 5;
  const ctx = new OfflineAudioContext(2, SR * seconds, SR);
  const graph = buildGraph(ctx);
  const rng = mulberry32(9);
  const pool = new VoicePool(14);
  const fire = (n: SfxName, t: number, opts: PlayOptions = {}) => {
    const d = pool.request(n, t * 1000, 1500, SFX[n].rule);
    if (!d.accept) return;
    buildSfx(graph, n, t, opts, rng, d.gain);
  };
  if (name === 'tapStorm') for (let i = 0; i < 40; i++) fire('tap', 0.05 + i * 0.025);
  if (name === 'countUp') for (let i = 0; i < 24; i++) fire(i % 2 ? 'leaf' : 'streakTick', 0.05 + i * 0.06, { step: i % 12 });
  if (name === 'celebration') {
    fire('complete', 0.05);
    fire('streak', 0.6);
    fire('quest', 1.1);
    fire('badge', 1.5);
    fire('levelUp', 1.9);
  }
  if (name === 'rapidSwitch') {
    // Picker mashing: crossfades interrupted mid-way must stay click-free.
    const mk = (k: Kind) => {
      const v = createAmbient(k, { ctx, dry: graph.amb, wet: graph.ambWet, rng });
      v.start(0);
      v.schedule(0, seconds);
      return { v, f: new Fader(ctx, [v.output.gain, v.wetOutput.gain], 0), k };
    };
    const a = mk('brown');
    const b = mk('forest');
    a.f.fade(ambientTrim('brown'), 0.8, 'equalPower', 0);
    const plan: [number, typeof a, typeof a][] = [
      [1.5, a, b],
      [2.1, b, a],
      [2.5, a, b],
      [2.8, b, a],
      [3.6, a, b],
    ];
    for (const [t, from, to] of plan) {
      from.f.fade(0, 1.5, 'equalPower', t);
      to.f.fade(ambientTrim(to.k), 1.5, 'equalPower', t);
    }
  }
  if (name === 'ambientPlusComplete') {
    const v = createAmbient('rain', { ctx, dry: graph.amb, wet: graph.ambWet, rng });
    v.start(0);
    const f = new Fader(ctx, [v.output.gain, v.wetOutput.gain], 0);
    f.fade(ambientTrim('rain'), 1, 'equalPower', 0);
    v.schedule(0, seconds);
    // Ambience at default settings ratio vs sfx (0.5² vs 0.7²).
    graph.amb.gain.value = 0.25 / 0.49;
    fire('complete', 3);
    f.fade(0, 2.4, 'equalPower', 3);
  }
  return channels(await ctx.startRendering());
}

// ---------------------------------------------------------------------------
// Spectrogram (log-frequency, drawn to a canvas → PNG data URL)
// ---------------------------------------------------------------------------

const STOPS: [number, number, number][] = [
  [8, 6, 22],
  [60, 15, 110],
  [170, 45, 110],
  [245, 120, 60],
  [252, 230, 150],
];

function color(x: number): [number, number, number] {
  const t = Math.max(0, Math.min(1, x)) * (STOPS.length - 1);
  const i = Math.min(STOPS.length - 2, Math.floor(t));
  const f = t - i;
  const a = STOPS[i]!, b = STOPS[i + 1]!;
  return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f];
}

export function spectrogramPng(data: Float32Array[], title: string, subtitle = ''): string {
  const m = mono(data);
  const size = 2048;
  const seconds = m.length / SR;
  const hop = Math.max(64, Math.round((m.length - size) / 900));
  const frames = stft(m, size, hop);
  const W = 960, H = 320, top = 44, left = 48;
  const cv = document.createElement('canvas');
  cv.width = W;
  cv.height = H + top + 22;
  const g = cv.getContext('2d')!;
  g.fillStyle = '#120e1a';
  g.fillRect(0, 0, cv.width, cv.height);
  const img = g.createImageData(W - left, H);
  const fMin = 40, fMax = 20000;
  const norm = (size / 4) ** 2; // Hann coherent gain² × (N/2)²
  for (let x = 0; x < W - left; x++) {
    const fr = frames[Math.min(frames.length - 1, Math.floor((x / (W - left)) * frames.length))]!;
    for (let y = 0; y < H; y++) {
      const hz = fMin * (fMax / fMin) ** (1 - y / (H - 1));
      const bin = Math.min(fr.length - 1, Math.max(1, Math.round((hz * size) / SR)));
      const dbv = 10 * Math.log10(fr[bin]! / norm + 1e-14);
      const [r, gg, b] = color((dbv + 110) / 90);
      const o = (y * (W - left) + x) * 4;
      img.data[o] = r;
      img.data[o + 1] = gg;
      img.data[o + 2] = b;
      img.data[o + 3] = 255;
    }
  }
  g.putImageData(img, left, top);
  g.font = '12px sans-serif';
  g.fillStyle = '#fff';
  g.fillText(title, 8, 16);
  g.fillStyle = '#bbb';
  g.fillText(subtitle, 8, 34);
  for (const hz of [100, 250, 500, 1000, 2000, 4000, 8000, 16000]) {
    const y = top + (1 - Math.log(hz / fMin) / Math.log(fMax / fMin)) * (H - 1);
    g.strokeStyle = hz === 4000 || hz === 8000 ? 'rgba(255,120,120,0.45)' : 'rgba(255,255,255,0.18)';
    g.beginPath();
    g.moveTo(left, y);
    g.lineTo(W, y);
    g.stroke();
    g.fillStyle = '#ccc';
    g.fillText(hz >= 1000 ? `${hz / 1000}k` : `${hz}`, 6, y + 4);
  }
  for (let s = 0; s <= seconds; s += seconds > 4 ? 1 : 0.25) {
    const x = left + (s / seconds) * (W - left);
    g.fillStyle = '#ccc';
    g.fillText(`${s.toFixed(s % 1 ? 2 : 0)}s`, x - 8, top + H + 16);
  }
  return cv.toDataURL('image/png');
}

function b64(bytes: Uint8Array): string {
  let s = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) s += String.fromCharCode(...bytes.subarray(i, i + chunk));
  return btoa(s);
}

export interface AuditItem {
  id: string;
  kind: 'sfx' | 'ambient' | 'scenario';
  target: number | null;
  level: number | null;
  declaredEnd?: number;
  /** Audible end of the dry signal (no reverb). */
  dryEnd?: number;
  /** RMS dBFS per 100 ms. */
  envelope?: number[];
  metrics: Metrics;
  wav?: string;
  png?: string;
}

export async function audit(opts: { sfx?: string[]; ambient?: string[]; scenarios?: string[]; seconds?: number; files?: boolean } = {}): Promise<{ chainGainDb: number; items: AuditItem[] }> {
  const items: AuditItem[] = [];
  const files = opts.files ?? true;
  const sub = (m: Metrics) =>
    `peak ${m.peakDb.toFixed(1)} dBFS · M ${m.lufsM.toFixed(1)} · S ${m.lufsS.toFixed(1)} · I ${m.lufsI.toFixed(1)} LUFS · centroid ${Math.round(m.centroid)} Hz · >4k ${(m.hf4k * 100).toFixed(1)}% · >8k ${(m.hf8k * 100).toFixed(2)}%`;
  for (const name of (opts.sfx ?? SFX_NAMES) as SfxName[]) {
    const r = await renderSfx(name);
    const metrics = measure(r.data, SR);
    const dry = await renderSfx(name, {}, 1, true);
    items.push({
      id: name,
      kind: 'sfx',
      target: SFX[name].target,
      level: SFX[name].level,
      declaredEnd: r.declaredEnd,
      dryEnd: measure(dry.data, SR).audibleEnd + 0.02,
      envelope: rmsEnvelope(r.data, SR, 0.1),
      metrics,
      wav: files ? b64(encodeWav(r.data, SR)) : undefined,
      png: files ? spectrogramPng(r.data, `sfx: ${name}`, sub(metrics)) : undefined,
    });
  }
  // Rising count-up check: step 0..10 should stay in key and even in level.
  for (const step of [0, 5, 10]) {
    const r = await renderSfx('streakTick', { step });
    items.push({ id: `streakTick@${step}`, kind: 'sfx', target: SFX.streakTick.target, level: SFX.streakTick.level, metrics: measure(r.data, SR) });
  }
  const kinds = (opts.ambient ?? [...Object.keys(AMBIENT_LEVELS), 'simmer']) as (Kind | 'simmer')[];
  for (const kind of kinds) {
    const data = await renderAmbient(kind, opts.seconds ?? 12);
    // Skip the 1 s fade-in for loudness/spectrum; keep the whole thing for clicks.
    const skip = Math.round(SR * 2);
    const steady = data.map((c) => c.slice(skip));
    const metrics = measure(steady, SR, { edges: false });
    const whole = measure(data, SR, { edges: false });
    metrics.clickScore = whole.clickScore;
    metrics.clickAt = whole.clickAt;
    metrics.startAbs = whole.startAbs;
    const target = kind === 'simmer' ? SIMMER_LEVEL.target : AMBIENT_LEVELS[kind].target;
    const level = kind === 'simmer' ? SIMMER_LEVEL.level : AMBIENT_LEVELS[kind].level;
    items.push({
      id: kind,
      kind: 'ambient',
      target,
      level,
      metrics,
      wav: files ? b64(encodeWav(data, SR)) : undefined,
      png: files ? spectrogramPng(data, `ambient: ${kind}`, sub(metrics)) : undefined,
    });
  }
  for (const sc of (opts.scenarios ?? ['tapStorm', 'countUp', 'celebration', 'ambientPlusComplete', 'rapidSwitch']) as Parameters<typeof renderScenario>[0][]) {
    const data = await renderScenario(sc);
    const metrics = measure(data, SR, { edges: false });
    items.push({
      id: sc,
      kind: 'scenario',
      target: null,
      level: null,
      metrics,
      wav: files ? b64(encodeWav(data, SR)) : undefined,
      png: files ? spectrogramPng(data, `scenario: ${sc}`, sub(metrics)) : undefined,
    });
  }
  return { chainGainDb: await chainGain(), items };
}
