// CRITIC HARNESS (2nd pass) — AUDIO. Things the first pass did not do:
//  A  intensity sweep at the values live play ACTUALLY uses (0.4..0.9)
//  B  replay a real turn's audio calls (from live-battle.json) over the bed,
//     and measure per-cue peak/SNR in situ, plus clipping of the sum
//  C  short-cue check: PEAK over bed, not just windowed RMS lift
//  D  fatigue: repeated-cue stacking (text_blip x3 at one instant, ui_move rate)
//  E  stereo: does side:0 / side:1 actually pan?
// node tests/critic/audio-turn.mjs --port 8813
import { chromium } from 'playwright';
import { mkdir, writeFile, readFile } from 'node:fs/promises';

const args = Object.fromEntries(process.argv.slice(2).reduce((a, x, i, arr) => {
  if (x.startsWith('--')) a.push([x.slice(2), arr[i + 1] && !arr[i + 1].startsWith('--') ? arr[i + 1] : true]);
  return a;
}, []));
const PORT = Number(args.port || 8813);
const OUT = 'tests/shots/audio';
await mkdir(OUT, { recursive: true });

// pull the real turn out of the live log
let realTurn = [];
try {
  const live = JSON.parse(await readFile(`${OUT}/live-battle.json`, 'utf8'));
  const log = live.log.filter((l) => l.m === 'sfx' || l.m === 'cry');
  // busiest 3-second window
  let best = { n: 0, i: 0 };
  for (let i = 0; i < log.length; i++) {
    let n = 0;
    for (let j = i; j < log.length && log[j].gt - log[i].gt < 3.0; j++) n++;
    if (n > best.n) best = { n, i };
  }
  const t0 = log[best.i].gt;
  realTurn = log.filter((l) => l.gt >= t0 && l.gt - t0 < 3.0).map((l) => ({ d: +(l.gt - t0).toFixed(3), m: l.m, a: l.a }));
} catch (e) { console.log('no live-battle.json:', e.message); }
console.log(`busiest 3s of the real battle: ${realTurn.length} audio calls`);
console.log(realTurn.map((r) => `  +${String(r.d).padEnd(6)} ${r.m}(${r.a})`).join('\n'));

const browser = await chromium.launch({ args: ['--no-sandbox', '--disable-dev-shm-usage', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width: 900, height: 600 } });
const errs = [];
page.on('pageerror', (e) => errs.push(String(e.message)));
await page.goto(`http://127.0.0.1:${PORT}/index.html`, { waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => window.__ARENA && window.__ARENA.ready, null, { timeout: 60000 });
await page.evaluate(() => window.__ARENA.ready);

const R = await page.evaluate(async (realTurn) => {
  const lab = await import('/tests/critic/audiolab.js');
  const SR = lab.SR;
  const out = {};

  /* ---- A: intensity at the values live play uses ---- */
  const LV = [0.4, 0.5, 0.6, 0.7, 0.8, 0.9];
  const fps = {}, mA = {};
  for (const I of LV) {
    const b = await lab.render((A) => A.scheduleMusicOffline('battle', 12, I), 12.2, { seed: 3 });
    mA['I=' + I] = lab.measure(b); fps['I=' + I] = lab.fingerprint(b);
  }
  out.intensityLive = mA;
  out.intensityLiveDist = {};
  for (let i = 0; i < LV.length - 1; i++) out.intensityLiveDist[`${LV[i]}->${LV[i + 1]}`] = +lab.cosDist(fps['I=' + LV[i]], fps['I=' + LV[i + 1]]).toFixed(4);
  out.intensityLiveDist['0.4->0.9'] = +lab.cosDist(fps['I=0.4'], fps['I=0.9']).toFixed(4);

  /* ---- B: replay a real turn over the bed ---- */
  const FL = window.__ARENA.data.fighters;
  const FLIST = Array.isArray(FL) ? FL : Object.values(FL);
  const play = (A, list, side0) => {
    for (const e of list) {
      if (e.m === 'cry') {
        const parts = String(e.a).split(':');       // cry:shape:root
        const f = FLIST.find((x) => x.cry && x.cry.shape === parts[1] && String(x.cry.root) === parts[2]) || FLIST[0];
        A.cry(f, { delay: e.d });
      } else A.sfx(e.a, { delay: e.d, side: side0 ? 0 : 1 });
    }
  };
  const turnDur = Math.max(4, (realTurn.at(-1)?.d ?? 3) + 2.5);
  const turnBed = await lab.render((A) => { A.scheduleMusicOffline('battle', turnDur, 0.6); }, turnDur, { seed: 3 });
  const turnMix = await lab.render((A) => { A.scheduleMusicOffline('battle', turnDur, 0.6); play(A, realTurn, false); }, turnDur, { seed: 3 });
  const turnSfx = await lab.render((A) => { play(A, realTurn, false); }, turnDur, { seed: 3 });
  out.turn = { bed: lab.measure(turnBed), sfx: lab.measure(turnSfx), mix: lab.measure(turnMix), nCalls: realTurn.length, dur: turnDur };

  // per-40ms peak track of mix vs bed, to see whether each event pokes through
  const trk = (buf) => {
    const L = buf.getChannelData(0), Rr = buf.getChannelData(1);
    const hop = Math.round(SR * 0.04), o = [];
    for (let i = 0; i + hop <= L.length; i += hop) {
      let p = 0, s = 0;
      for (let k = 0; k < hop; k++) { const m = (L[i + k] + Rr[i + k]) / 2; p = Math.max(p, Math.abs(m)); s += m * m; }
      o.push([+p.toFixed(4), +(20 * Math.log10(Math.sqrt(s / hop) + 1e-12)).toFixed(1)]);
    }
    return o;
  };
  out.turnTrack = { bed: trk(turnBed), mix: trk(turnMix) };

  /* ---- C: short-cue PEAK over bed (the liftDb caveat) ---- */
  const bedM = lab.measure(await lab.render((A) => A.scheduleMusicOffline('battle', 8, 0.8), 8.2, { seed: 11 }));
  const bedLoud = await lab.render((A) => A.scheduleMusicOffline('battle', 8, 0.8), 8.2, { seed: 11 });
  // bed local peak in a 60ms window at t=4s (where stage6 places cues)
  const bl = bedLoud.getChannelData(0), br = bedLoud.getChannelData(1);
  const localPeak = (ms) => { let p = 0; const i0 = Math.floor(4 * SR), i1 = i0 + Math.floor(ms / 1000 * SR); for (let i = i0; i < i1; i++) p = Math.max(p, Math.abs((bl[i] + br[i]) / 2)); return p; };
  // worst case: the loudest 60ms the bed ever reaches
  const bedWorst = (ms) => { const w = Math.floor(ms / 1000 * SR); let best = 0; for (let i = 0; i + w < bl.length; i += Math.floor(w / 2)) { let p = 0; for (let k = 0; k < w; k++) p = Math.max(p, Math.abs((bl[i + k] + br[i + k]) / 2)); best = Math.max(best, p); } return best; };
  const shorts = {};
  for (const k of ['text_blip', 'ui_move', 'ui_select', 'ui_back', 'ui_error', 'lowhp', 'crit', 'impact_med', 'impact_light', 'hit_slash', 'scatter', 'sludge', 'weak', 'super']) {
    const c = await lab.render((A) => A.sfx(k), 2.0, { seed: 11 });
    const m = lab.measure(c);
    const w = Math.max(50, m.dur * 1000);
    shorts[k] = {
      cuePeakDb: m.peakDb, dur: m.dur,
      bedLocalPeakDb: +(20 * Math.log10(localPeak(w) + 1e-12)).toFixed(2),
      bedWorstPeakDb: +(20 * Math.log10(bedWorst(w) + 1e-12)).toFixed(2),
      peakOverLocalDb: +(m.peakDb - 20 * Math.log10(localPeak(w) + 1e-12)).toFixed(2),
      peakOverWorstDb: +(m.peakDb - 20 * Math.log10(bedWorst(w) + 1e-12)).toFixed(2)
    };
  }
  out.shortCues = shorts; out.bedM = bedM;

  /* ---- D: fatigue / stacking ---- */
  const one = await lab.render((A) => A.sfx('text_blip'), 1.0, { seed: 2 });
  const three = await lab.render((A) => { A.sfx('text_blip'); A.sfx('text_blip'); A.sfx('text_blip'); }, 1.0, { seed: 2 });
  const blipRun = await lab.render((A) => { for (let i = 0; i < 40; i++) A.sfx('text_blip', { delay: i * 0.045 }); }, 2.5, { seed: 2 });
  const uiRun = await lab.render((A) => { for (let i = 0; i < 12; i++) A.sfx('ui_move', { delay: i * 0.13 }); }, 2.2, { seed: 2 });
  const critRun = await lab.render((A) => { for (let i = 0; i < 4; i++) { A.sfx('impact_med', { delay: i * 0.55 }); A.sfx('crit', { delay: i * 0.55 }); } }, 3.5, { seed: 2 });
  out.stack = { blip1: lab.measure(one), blip3: lab.measure(three), blipRun40: lab.measure(blipRun), uiRun12: lab.measure(uiRun), critRun4: lab.measure(critRun) };
  // are 3 stacked blips deterministic-identical (comb/phasey) or varied?
  out.blipIdentical = +lab.cosDist(lab.fingerprint(one), lab.fingerprint(three)).toFixed(4);

  /* ---- E: stereo panning ---- */
  const pan = {};
  for (const k of ['impact_med', 'crit', 'hit_flame', 'faint']) {
    for (const s of [0, 1]) {
      const b = await lab.render((A) => A.sfx(k, { side: s }), 2.0, { seed: 8 });
      const m = lab.measure(b);
      pan[`${k}/side${s}`] = { peakL: m.peakL, peakR: m.peakR, lrDb: +(20 * Math.log10((m.peakL + 1e-9) / (m.peakR + 1e-9))).toFixed(2), width: m.width };
    }
  }
  out.pan = pan;

  /* ---- F: crit vs normal in the SAME element, with bed ---- */
  const ctx = {};
  for (const [n, f] of Object.entries({
    normal: (A) => { A.sfx('slash_heavy', { side: 1 }); },
    crit: (A) => { A.sfx('slash_heavy', { side: 1 }); A.sfx('crit', { side: 1 }); },
    superEff: (A) => { A.sfx('slash_heavy', { side: 1 }); A.sfx('super', { side: 1 }); },
    weakEff: (A) => { A.sfx('slash_heavy', { side: 1 }); A.sfx('weak', { side: 1 }); },
    miss: (A) => { A.sfx('miss', { side: 1 }); },
    immune: (A) => { A.sfx('immune', { side: 1 }); }
  })) {
    const dry = await lab.render(f, 3.0, { seed: 6 });
    const wet = await lab.render((A) => { A.scheduleMusicOffline('battle', 3, 0.6); f(A); }, 3.2, { seed: 6 });
    ctx[n] = { dry: lab.measure(dry), wetPeak: lab.measure(wet).peak, fp: lab.fingerprint(dry) };
  }
  out.ctxDist = {};
  const CK = Object.keys(ctx);
  for (let i = 0; i < CK.length; i++) for (let j = i + 1; j < CK.length; j++) out.ctxDist[`${CK[i]} vs ${CK[j]}`] = +lab.cosDist(ctx[CK[i]].fp, ctx[CK[j]].fp).toFixed(4);
  for (const k of CK) delete ctx[k].fp;
  out.ctx = ctx;

  return out;
}, realTurn);

await writeFile(`${OUT}/turn2.json`, JSON.stringify({ realTurn, ...R }, null, 1));

const P = (o) => `peak ${String(o.peak).padEnd(8)} peakDb ${String(o.peakDb).padEnd(7)} rmsDb ${String(o.rmsDb).padEnd(7)} crest ${String(o.crest).padEnd(6)} clip ${o.clipped}`;

console.log('\n=== A. INTENSITY AT LIVE-USED VALUES (battle track) ===');
for (const [k, v] of Object.entries(R.intensityLive)) console.log(`  ${k.padEnd(8)} rmsDb ${String(v.rmsDb).padEnd(7)} peak ${String(v.peak).padEnd(8)} cen ${String(v.centroid).padEnd(5)} onsets ${String(v.onsets).padEnd(4)} bands ${v.bands.slice(0, 8).join(',')}`);
console.log('  step fingerprint distance:'); for (const [k, v] of Object.entries(R.intensityLiveDist)) console.log(`    ${k.padEnd(12)} ${v}`);

console.log('\n=== B. A REAL TURN (busiest 3 s of the live battle) OVER THE BED ===');
console.log(`  calls ${R.turn.nCalls}   window ${R.turn.dur}s`);
console.log('  bed  ' + P(R.turn.bed));
console.log('  sfx  ' + P(R.turn.sfx));
console.log('  mix  ' + P(R.turn.mix));
{
  const b = R.turnTrack.bed, m = R.turnTrack.mix;
  let poke = 0, tot = 0, maxd = 0;
  const rows = [];
  for (let i = 0; i < Math.min(b.length, m.length); i++) {
    const d = m[i][1] - b[i][1]; tot++; if (d > 3) poke++; maxd = Math.max(maxd, d);
    if (i < 90) rows.push(`${(i * 0.04).toFixed(2)}s bed ${b[i][1]} mix ${m[i][1]} d${d > 0 ? '+' : ''}${d.toFixed(1)}`);
  }
  console.log(`  40ms frames where the mix is >3 dB above the bed: ${poke}/${tot}  (max +${maxd.toFixed(1)} dB)`);
}

console.log('\n=== C. SHORT CUES: PEAK vs BED PEAK (not RMS lift) ===');
console.log('  cue          dur     cuePeakDb  bedLocalPk  bedWorstPk   overLocal  overWorst');
for (const [k, v] of Object.entries(R.shortCues))
  console.log(`  ${k.padEnd(12)} ${String(v.dur).padEnd(7)} ${String(v.cuePeakDb).padEnd(10)} ${String(v.bedLocalPeakDb).padEnd(11)} ${String(v.bedWorstPeakDb).padEnd(12)} ${String(v.peakOverLocalDb).padStart(8)}  ${String(v.peakOverWorstDb).padStart(8)}`);

console.log('\n=== D. STACKING / FATIGUE ===');
for (const [k, v] of Object.entries(R.stack)) console.log(`  ${k.padEnd(12)} ${P(v)} dur ${v.dur} onsets ${v.onsets} cen ${v.centroid}`);
console.log(`  fingerprint(1 blip) vs fingerprint(3 simultaneous blips) = ${R.blipIdentical}`);

console.log('\n=== E. STEREO PAN ===');
for (const [k, v] of Object.entries(R.pan)) console.log(`  ${k.padEnd(20)} L ${String(v.peakL).padEnd(8)} R ${String(v.peakR).padEnd(8)} L-R ${String(v.lrDb).padStart(7)} dB  width ${v.width}`);

console.log('\n=== F. OUTCOME CUES IN CONTEXT (slash_heavy base) ===');
for (const [k, v] of Object.entries(R.ctx)) console.log(`  ${k.padEnd(10)} dryPeak ${String(v.dry.peak).padEnd(8)} dryRms ${String(v.dry.rmsDb).padEnd(7)} cen ${String(v.dry.centroid).padEnd(6)} dur ${String(v.dry.dur).padEnd(7)} withBedPeak ${v.wetPeak}`);
console.log('  pairwise timbre distance:'); for (const [k, v] of Object.entries(R.ctxDist)) console.log(`    ${k.padEnd(24)} ${v}`);

if (errs.length) console.log('\nPAGE ERRORS\n' + errs.slice(0, 6).join('\n'));
await browser.close();
