#!/usr/bin/env node
/**
 * Audio check — renders every SFX, ~12 s of every ambience and a few
 * worst-case stacks with OfflineAudioContext in a real browser (through the
 * same mixing graph the app uses), then reports loudness (LUFS-ish), peak,
 * clipping, DC, start/end discontinuities, click score, duration and spectral
 * balance. Writes WAVs + spectrogram PNGs + report.json to .shots/audio/.
 *
 *   node scripts/audio-check.mjs [--base http://127.0.0.1:5184] [--out .shots/audio]
 *     [--sfx tap,complete] [--ambient rain,lofi] [--seconds 12] [--no-files] [--env]
 *   node scripts/audio-check.mjs --live      drive the real app: session soundscape assertions
 *     (fade-in, pause dip, crossfade, navigation, simmer, mute, two tabs, preview)
 *
 * Without --base it starts its own Vite dev server on port 5184 (audio's port),
 * or reuses one already listening there. Exit code 1 if any hard check fails.
 */
import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const argv = process.argv.slice(2);
const arg = (k, d) => {
  const i = argv.indexOf(`--${k}`);
  if (i < 0) return d;
  const v = argv[i + 1];
  return v && !v.startsWith('--') ? v : true;
};
const out = join(root, arg('out', '.shots/audio'));
const files = !argv.includes('--no-files');
const list = (k) => (typeof arg(k) === 'string' ? arg(k).split(',') : undefined);

let base = arg('base');
let server = null;
if (!base) {
  base = 'http://127.0.0.1:5184';
  const up = await fetch(base).then((r) => r.ok).catch(() => false);
  if (!up) {
    const { createServer } = await import('vite');
    server = await createServer({ root, logLevel: 'silent', server: { port: 5184, strictPort: true, host: '127.0.0.1' } });
    await server.listen();
  }
}

mkdirSync(out, { recursive: true });

// ---------------------------------------------------------------------------
// --live: drive the real app and assert the session soundscape behaviour.
// ---------------------------------------------------------------------------
if (argv.includes('--live')) {
  const ok = await liveCheck(base);
  if (server) await server.close();
  process.exit(ok ? 0 : 1);
}

async function liveCheck(base) {
  const browser = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] });
  const ctx = await browser.newContext();
  const errors = [];
  const results = [];
  const expect = (label, cond, detail) => {
    results.push(`${cond ? 'ok  ' : 'FAIL'} ${label}${detail ? ` — ${detail}` : ''}`);
    return cond;
  };
  const open = async (name) => {
    const page = await ctx.newPage();
    page.on('console', (m) => m.type() === 'error' && errors.push(`[${name}] ${m.text()}`));
    page.on('pageerror', (e) => errors.push(`[${name}] ${e.message}`));
    await page.goto(`${base}/?debug&seed=veteran&onboarded=1#/`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(600);
    await page.mouse.click(5, 5); // user gesture → unlock
    await page.waitForTimeout(200);
    await state(page); // attach the meter early so it has signal to read
    return page;
  };
  const state = async (page) => {
    for (let i = 0; i < 3; i++) {
      try {
        return await page.evaluate(() => {
          const e = window.__kettleAudio.engine;
          if (!window.__meter && e.ctx) {
            const an = e.ctx.createAnalyser();
            an.fftSize = 4096;
            e.graph.master.connect(an);
            window.__meter = an;
          }
          let rms = -Infinity;
          if (window.__meter) {
            const d = new Float32Array(4096);
            window.__meter.getFloatTimeDomainData(d);
            rms = 20 * Math.log10(Math.sqrt(d.reduce((s, x) => s + x * x, 0) / d.length) + 1e-12);
          }
          return { ...e.debugState(), rms, route: location.hash };
        });
      } catch {
        await page.waitForTimeout(1500); // HMR reload from another area's edit — retry
      }
    }
    throw new Error('page kept reloading');
  };
  const run = (page, fn) => page.evaluate(fn);
  const a = await open('A');
  await run(a, () => window.__kettle.settings.getState().set({ ambient: 'rain', muted: false }));
  await run(a, () => window.__kettle.timer.getState().startFocus());
  await a.waitForTimeout(3500);
  let s = await state(a);
  expect('focus start → ambience fades in', s.current === 'rain' && s.rms > -55, `cur=${s.current} rms=${s.rms.toFixed(1)}dB`);
  const full = s.rms;
  await run(a, () => window.__kettle.timer.getState().pause());
  await a.waitForTimeout(1500);
  s = await state(a);
  expect('pause → ambience dips (not stops)', s.level < 0.5 && s.current === 'rain' && s.rms < full - 5 && s.rms > full - 16, `level=${s.level} Δ=${(s.rms - full).toFixed(1)}dB`);
  await run(a, () => window.__kettle.timer.getState().resume());
  await a.waitForTimeout(1800);
  s = await state(a);
  expect('resume → back to full', s.level === 1 && Math.abs(s.rms - full) < 4, `Δ=${(s.rms - full).toFixed(1)}dB`);
  await run(a, () => window.__kettle.settings.getState().set({ ambient: 'lofi' }));
  await a.waitForTimeout(300);
  const mid = await state(a);
  await a.waitForTimeout(1800);
  s = await state(a);
  expect('picker change → crossfade', mid.outgoing.includes('rain') && s.current === 'lofi' && s.outgoing.length === 0, `mid out=[${mid.outgoing}] cur=${s.current}`);
  await run(a, () => window.__kettle.navigate('/stats'));
  await a.waitForTimeout(1500);
  s = await state(a);
  expect('navigating away mid-session keeps ambience', s.current === 'lofi' && s.route === '#/stats', `cur=${s.current}`);
  await run(a, () => {
    const t = window.__kettle.timer.getState();
    window.__kettle.ff(t.endsAt - window.__kettle.clock.now() - 30_000);
  });
  await a.waitForTimeout(1500);
  s = await state(a);
  expect('last 40 s → kettle simmer rises', s.simmer === 'on', `simmer=${s.simmer}`);
  await run(a, () => window.__kettle.settings.getState().set({ muted: true }));
  await a.waitForTimeout(1500);
  s = await state(a);
  expect('mute → silence', s.current === null && s.rms < -100, `rms=${s.rms.toFixed(1)}`);
  await run(a, () => window.__kettle.settings.getState().set({ muted: false }));
  await a.waitForTimeout(1500);
  s = await state(a);
  expect('unmute → ambience back', s.current === 'lofi' && s.rms > -60, `rms=${s.rms.toFixed(1)}`);
  const b = await open('B');
  await b.waitForTimeout(2500);
  const [sa, sb] = [await state(a), await state(b)];
  expect('two tabs → only one plays', (sa.current === null) !== (sb.current === null), `A=${sa.current} B=${sb.current}`);
  await b.close();
  await a.bringToFront();
  await run(a, () => document.dispatchEvent(new Event('visibilitychange')));
  await a.waitForTimeout(2500);
  await run(a, () => window.__kettle.timer.getState().end('user'));
  await a.waitForTimeout(3200);
  s = await state(a);
  expect('session ends → ambience + simmer fade out', s.current === null && s.simmer === 'off' && s.outgoing.length === 0, `cur=${s.current} simmer=${s.simmer}`);
  await run(a, () => window.__kettleAudio.audio.preview('fire', { ms: 1500 }));
  await a.waitForTimeout(800);
  const p1 = await state(a);
  await a.waitForTimeout(2800);
  const p2 = await state(a);
  expect('settings preview plays then stops', p1.current === 'fire' && p2.current === null, `during=${p1.current} after=${p2.current}`);
  expect('no console errors', errors.length === 0, errors.slice(0, 3).join(' | '));
  await browser.close();
  console.log(results.join('\n'));
  const failed = results.filter((r) => r.startsWith('FAIL')).length;
  console.log(failed ? `\n${failed} live check(s) failed.` : '\nAll live checks passed.');
  return failed === 0;
}

const browser = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] });
const page = await browser.newPage();
page.on('pageerror', (e) => console.log(`[pageerror] ${e.message}`));
page.on('console', (m) => m.type() === 'error' && console.log(`[console.error] ${m.text()}`));
// Load a bare module URL (not the app) so other areas' in-progress edits / HMR
// reloads can't interfere; the audio modules have no runtime app imports.
await page.goto(`${base}/src/audio/dsp.ts`, { waitUntil: 'load' });

const t0 = Date.now();
const result = await page.evaluate(
  async (opts) => {
    const m = await import('/src/audio/offline.ts');
    return m.audit(opts);
  },
  { sfx: list('sfx'), ambient: list('ambient'), scenarios: list('scenarios'), seconds: Number(arg('seconds', 12)), files },
);
await browser.close();
if (server) await server.close();

// ---------------------------------------------------------------------------
// Report
// ---------------------------------------------------------------------------
const f1 = (x) => (Number.isFinite(x) ? x.toFixed(1) : '-inf');
const pad = (s, n) => String(s).padEnd(n);
const lpad = (s, n) => String(s).padStart(n);
const fails = [];
const warns = [];
const rows = [];
for (const it of result.items) {
  const m = it.metrics;
  const flags = [];
  const isSfx = it.kind === 'sfx';
  const isAmb = it.kind === 'ambient';
  const loud = isSfx ? m.lufsM : m.lufsI;
  const delta = it.target != null ? it.target - loud : null;
  if (m.clipped > 0) flags.push(`CLIP×${m.clipped}`);
  if (m.peakDb > -1) flags.push('PEAK>-1');
  else if (m.peakDb > -3 && isSfx) flags.push('peak>-3');
  if (Math.abs(m.dc) > 1e-3) flags.push(`DC ${m.dc.toExponential(1)}`);
  if (isSfx && m.startAbs > 1e-3) flags.push('START-STEP');
  if (isSfx && m.endAbs > 1e-4) flags.push('END-STEP');
  if (isSfx && m.clickScore > 40) flags.push(`click ${m.clickScore.toFixed(0)}@${m.clickAt.toFixed(3)}s`);
  if (isAmb && m.clickScore > 400 && !['fire', 'rain', 'lofi'].includes(it.id)) flags.push(`click ${m.clickScore.toFixed(0)}@${m.clickAt.toFixed(2)}s`);
  if (m.hf8k > 0.02) flags.push(`HF>8k ${(m.hf8k * 100).toFixed(1)}%`);
  if (delta != null && Math.abs(delta) > 1.0 && !it.id.includes('@')) flags.push(`LEVEL ${delta > 0 ? '+' : ''}${delta.toFixed(1)}dB`);
  if (isSfx && it.declaredEnd != null && it.dryEnd != null && it.dryEnd > it.declaredEnd + 0.05) flags.push(`dry tail ${it.dryEnd.toFixed(2)}s > declared ${it.declaredEnd.toFixed(2)}s`);
  const hard = flags.filter((f) => /CLIP|PEAK>-1|START-STEP|END-STEP|DC|click/.test(f));
  if (hard.length) fails.push(`${it.id}: ${hard.join(', ')}`);
  const soft = flags.filter((f) => !hard.includes(f));
  if (soft.length) warns.push(`${it.id}: ${soft.join(', ')}`);
  rows.push(
    [
      pad(it.kind, 8),
      pad(it.id, 20),
      lpad(it.target ?? '', 5),
      lpad(f1(loud), 7),
      lpad(f1(m.lufsS), 7),
      lpad(f1(m.lufsPhone), 7),
      lpad(f1(m.peakDb), 7),
      lpad(f1(m.rmsDb), 7),
      lpad(m.audibleEnd.toFixed(2), 6),
      lpad(Math.round(m.centroid), 6),
      lpad((m.hf4k * 100).toFixed(1), 5),
      lpad((m.hf8k * 100).toFixed(2), 5),
      lpad(m.clickScore.toFixed(0), 5),
      lpad(m.stereoCorr.toFixed(2), 5),
      lpad(it.kind === 'sfx' ? '' : m.lra.toFixed(1), 5),
      flags.join(' '),
    ].join(' '),
  );
  if (files && it.wav) writeFileSync(join(out, `${it.kind}-${it.id}.wav`), Buffer.from(it.wav, 'base64'));
  if (files && it.png) writeFileSync(join(out, `${it.kind}-${it.id}.png`), Buffer.from(it.png.split(',')[1], 'base64'));
  delete it.wav;
  delete it.png;
}
writeFileSync(join(out, 'report.json'), JSON.stringify(result, null, 2));

console.log(`chain gain (−20 dBFS 1 kHz through master): ${result.chainGainDb.toFixed(2)} dB`);
console.log(
  [pad('kind', 8), pad('id', 20), lpad('tgt', 5), lpad('loud', 7), lpad('S-max', 7), lpad('phone', 7), lpad('peak', 7), lpad('rms', 7), lpad('end', 6), lpad('cent', 6), lpad('>4k%', 5), lpad('>8k%', 5), lpad('click', 5), lpad('corr', 5), lpad('LRA', 5), 'flags'].join(' '),
);
console.log('  (loud = max momentary LUFS for sfx, integrated LUFS for ambience/scenarios; phone = LUFS-I above 250 Hz)');
for (const r of rows) console.log(r);
console.log(`\n${result.items.length} renders in ${((Date.now() - t0) / 1000).toFixed(1)}s → ${files ? out : '(no files)'}`);
if (argv.includes('--env')) {
  console.log('\nRMS envelopes (dBFS per 100 ms):');
  for (const it of result.items) if (it.envelope) console.log(`  ${pad(it.id, 12)} ${it.envelope.map((v) => (Number.isFinite(v) ? Math.round(v) : '·')).join(' ')}`);
}
if (warns.length) console.log(`\nWarnings:\n  ${warns.join('\n  ')}`);
if (fails.length) {
  console.log(`\nFAIL:\n  ${fails.join('\n  ')}`);
  process.exit(1);
}
console.log('\nAll hard checks passed.');
