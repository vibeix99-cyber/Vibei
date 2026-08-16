// CRITIC HARNESS (3rd pass) — verify the measurement itself, then measure the
// keys the game ACTUALLY fires in play (stage1 measured a different set).
//   V1  does sfx opts.delay work? (both earlier harnesses assume it does)
//   V2  is there a master limiter? does the sum clip?
//   V3  every registry key: peak/rms, sorted — and the live-used subset vs bed
//   V4  a REAL turn re-timed properly (scheduled by delay if supported, else
//       by staggered offline renders summed in JS at the right sample offsets)
// node tests/critic/audio-verify.mjs --port 8813
import { chromium } from 'playwright';
import { mkdir, writeFile, readFile } from 'node:fs/promises';

const args = Object.fromEntries(process.argv.slice(2).reduce((a, x, i, arr) => {
  if (x.startsWith('--')) a.push([x.slice(2), arr[i + 1] && !arr[i + 1].startsWith('--') ? arr[i + 1] : true]);
  return a;
}, []));
const PORT = Number(args.port || 8813);
const OUT = 'tests/shots/audio';
await mkdir(OUT, { recursive: true });

const live = JSON.parse(await readFile(`${OUT}/live-battle.json`, 'utf8'));
const liveLog = live.log.filter((l) => l.m === 'sfx').map((l) => ({ gt: l.gt, a: l.a }));
const liveKeys = [...new Set(liveLog.map((l) => l.a))];
// busiest 3 s window, sfx only
let best = { n: 0, i: 0 };
for (let i = 0; i < liveLog.length; i++) {
  let n = 0; for (let j = i; j < liveLog.length && liveLog[j].gt - liveLog[i].gt < 3.0; j++) n++;
  if (n > best.n) best = { n, i };
}
const t0 = liveLog[best.i].gt;
const turn = liveLog.filter((l) => l.gt >= t0 && l.gt - t0 < 3.0).map((l) => ({ d: +(l.gt - t0).toFixed(3), a: l.a }));

const browser = await chromium.launch({ args: ['--no-sandbox', '--disable-dev-shm-usage', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width: 900, height: 600 } });
const errs = []; page.on('pageerror', (e) => errs.push(String(e.message)));
await page.goto(`http://127.0.0.1:${PORT}/index.html`, { waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => window.__ARENA && window.__ARENA.ready, null, { timeout: 60000 });
await page.evaluate(() => window.__ARENA.ready);

const R = await page.evaluate(async ({ turn, liveKeys }) => {
  const lab = await import('/tests/critic/audiolab.js');
  const SR = lab.SR, out = {};

  /* V1 — is opts.delay honoured? */
  const d0 = lab.measure(await lab.render((A) => A.sfx('crit'), 3, { seed: 1 }));
  const d1 = lab.measure(await lab.render((A) => A.sfx('crit', { delay: 1.0 }), 3, { seed: 1 }));
  const d2 = lab.measure(await lab.render((A) => A.sfx('crit', { at: 1.0 }), 3, { seed: 1 }));
  const d3 = lab.measure(await lab.render((A, oc) => A.sfx('crit', { when: oc.currentTime + 1.0 }), 3, { seed: 1 }));
  out.delayProbe = { none: d0.tStart, delay1: d1.tStart, at1: d2.tStart, when1: d3.tStart };
  out.delayWorks = Math.abs((d1.tStart ?? 0) - (d0.tStart ?? 0) - 1.0) < 0.05;

  /* V2 — limiter probe: fire N copies of the same loud cue at once */
  out.limiter = {};
  for (const n of [1, 2, 4, 8, 16, 32]) {
    const b = await lab.render((A) => { for (let i = 0; i < n; i++) A.sfx('impact_world'); }, 3, { seed: 1 });
    const m = lab.measure(b);
    out.limiter['x' + n] = { peak: m.peak, peakDb: m.peakDb, clipped: m.clipped };
  }

  /* V3 — every registry key */
  const keys = Object.keys(lab.SFX);
  const all = {};
  for (const k of keys) {
    try { const m = lab.measure(await lab.render((A) => A.sfx(k), 2.5, { seed: 77 })); all[k] = { peak: m.peak, peakDb: m.peakDb, rmsSpanDb: m.rmsSpanDb, dur: m.dur, cen: m.centroid }; }
    catch (e) { all[k] = { err: String(e).slice(0, 60) }; }
  }
  out.allSfx = all;
  out.aliases = lab.SFX_ALIAS;

  /* bed reference at the intensity live play sits at most (0.6) and its peak */
  const bed = await lab.render((A) => A.scheduleMusicOffline('battle', 8, 0.6), 8.2, { seed: 11 });
  const bL = bed.getChannelData(0), bR = bed.getChannelData(1);
  let bedPk = 0, s = 0;
  for (let i = 0; i < bL.length; i++) { const m = (bL[i] + bR[i]) / 2; bedPk = Math.max(bedPk, Math.abs(m)); s += m * m; }
  const bedRms = Math.sqrt(s / bL.length);
  // median 250ms-window peak of the bed = "what the music is doing at a typical moment"
  const w = Math.floor(0.25 * SR), pk = [];
  for (let i = 0; i + w < bL.length; i += w) { let p = 0; for (let k = 0; k < w; k++) p = Math.max(p, Math.abs((bL[i + k] + bR[i + k]) / 2)); pk.push(p); }
  pk.sort((a, b) => a - b);
  out.bed = { peak: +bedPk.toFixed(4), peakDb: +(20 * Math.log10(bedPk)).toFixed(2), rmsDb: +(20 * Math.log10(bedRms)).toFixed(2), medWinPeakDb: +(20 * Math.log10(pk[Math.floor(pk.length / 2)])).toFixed(2) };

  /* V4 — the real turn, sample-accurately summed at the logged offsets */
  const dur = 6.0;
  const mixL = new Float32Array(Math.ceil(dur * SR)), mixR = new Float32Array(Math.ceil(dur * SR));
  const bedFull = await lab.render((A) => A.scheduleMusicOffline('battle', dur, 0.6), dur, { seed: 11 });
  mixL.set(bedFull.getChannelData(0).slice(0, mixL.length));
  mixR.set(bedFull.getChannelData(1).slice(0, mixR.length));
  const cache = {};
  for (const e of turn) {
    if (!cache[e.a]) {
      const c = await lab.render((A) => A.sfx(e.a, { side: 1 }), 2.0, { seed: 77 });
      cache[e.a] = [c.getChannelData(0), c.getChannelData(1)];
    }
    const [cl, cr] = cache[e.a];
    const off = Math.floor(e.d * SR);
    for (let i = 0; i < cl.length && off + i < mixL.length; i++) { mixL[off + i] += cl[i]; mixR[off + i] += cr[i]; }
  }
  const fake = { sampleRate: SR, numberOfChannels: 2, length: mixL.length, getChannelData: (c) => (c ? mixR : mixL) };
  out.turnAccurate = lab.measure(fake);
  // per-40ms: mix vs bed
  const hop = Math.round(SR * 0.04), tb = [], tm = [];
  const bl = bedFull.getChannelData(0), br = bedFull.getChannelData(1);
  for (let i = 0; i + hop <= mixL.length; i += hop) {
    let pb = 0, pm = 0;
    for (let k = 0; k < hop; k++) { pb = Math.max(pb, Math.abs((bl[i + k] + br[i + k]) / 2)); pm = Math.max(pm, Math.abs((mixL[i + k] + mixR[i + k]) / 2)); }
    tb.push(+(20 * Math.log10(pb + 1e-12)).toFixed(1)); tm.push(+(20 * Math.log10(pm + 1e-12)).toFixed(1));
  }
  out.turnFrames = { bed: tb, mix: tm };
  out.turnCalls = turn.length;
  return out;
}, { turn, liveKeys });

await writeFile(`${OUT}/verify3.json`, JSON.stringify(R, null, 1));

console.log('=== V1  does opts.delay work? ===');
console.log(' ', JSON.stringify(R.delayProbe), ' -> delay honoured:', R.delayWorks);
console.log('\n=== V2  limiter / headroom (N x impact_world simultaneously) ===');
for (const [k, v] of Object.entries(R.limiter)) console.log(`  ${k.padEnd(5)} peak ${String(v.peak).padEnd(8)} ${String(v.peakDb).padEnd(7)}dBFS clippedSamples ${v.clipped}`);

console.log('\n=== BED REFERENCE (battle @ I=0.6, ship volumes) ===');
console.log(' ', JSON.stringify(R.bed));

const bedMed = R.bed.medWinPeakDb;
console.log('\n=== V3  KEYS THE LIVE BATTLE ACTUALLY FIRED, peak vs bed median-window peak ===');
const liveCounts = {};
for (const l of liveLog) liveCounts[l.a] = (liveCounts[l.a] || 0) + 1;
const rows = Object.entries(liveCounts).sort((a, b) => b[1] - a[1]).map(([k, n]) => {
  const m = R.allSfx[k] || R.allSfx[R.aliases[k]] || {};
  return { k, n, ...m, over: m.peakDb != null ? +(m.peakDb - bedMed).toFixed(2) : null };
});
console.log('  key           fired  peak     peakDb   overBedPk  spanRms  dur     cen');
for (const r of rows) console.log(`  ${r.k.padEnd(13)} ${String(r.n).padEnd(6)} ${String(r.peak).padEnd(8)} ${String(r.peakDb).padEnd(8)} ${String(r.over).padStart(8)}   ${String(r.rmsSpanDb).padEnd(8)} ${String(r.dur).padEnd(7)} ${r.cen}`);

const all = Object.entries(R.allSfx).filter(([, v]) => v.peakDb != null).sort((a, b) => a[1].peakDb - b[1].peakDb);
console.log(`\n=== V3b  all ${all.length} registry keys, quietest 18 ===`);
for (const [k, v] of all.slice(0, 18)) console.log(`  ${k.padEnd(16)} peak ${String(v.peak).padEnd(8)} ${String(v.peakDb).padEnd(8)}dBFS  overBedPk ${String(+(v.peakDb - bedMed).toFixed(1)).padStart(6)}  dur ${v.dur}`);
console.log('  loudest 8:');
for (const [k, v] of all.slice(-8)) console.log(`  ${k.padEnd(16)} peak ${String(v.peak).padEnd(8)} ${String(v.peakDb).padEnd(8)}dBFS  overBedPk ${String(+(v.peakDb - bedMed).toFixed(1)).padStart(6)}  dur ${v.dur}`);
const pks = all.map(([, v]) => v.peakDb);
console.log(`  peak spread across registry: ${pks[0]} .. ${pks[pks.length - 1]} dBFS (${(pks[pks.length - 1] - pks[0]).toFixed(1)} dB)`);

console.log('\n=== V4  REAL TURN, sample-accurate at the logged offsets ===');
console.log(`  ${R.turnCalls} sfx in 3 s over the bed -> ${JSON.stringify({ peak: R.turnAccurate.peak, peakDb: R.turnAccurate.peakDb, rmsDb: R.turnAccurate.rmsDb, clipped: R.turnAccurate.clipped })}`);
{
  const b = R.turnFrames.bed, m = R.turnFrames.mix;
  let poke3 = 0, poke6 = 0;
  for (let i = 0; i < b.length; i++) { const d = m[i] - b[i]; if (d > 3) poke3++; if (d > 6) poke6++; }
  console.log(`  40ms frames >3 dB above bed: ${poke3}/${b.length};  >6 dB: ${poke6}/${b.length}`);
  console.log('  first 60 frames (bed -> mix, delta):');
  console.log(b.slice(0, 60).map((x, i) => `${(i * 0.04).toFixed(2)}s ${x}->${m[i]} (${(m[i] - x >= 0 ? '+' : '') + (m[i] - x).toFixed(1)})`).join('  '));
}
if (errs.length) console.log('\nPAGE ERRORS\n' + errs.slice(0, 6).join('\n'));
await browser.close();
