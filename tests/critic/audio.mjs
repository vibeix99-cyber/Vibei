// CRITIC HARNESS — AUDIO piece.  node tests/critic/audio.mjs --stage N --port 8813
// Stages:
//   1  offline signal measurement of the core battle sfx set
//   2  all 32 fighter cries: render, fingerprint, pairwise distance matrix
//   3  music: per-track and per-intensity arrangement measurement
//   4  live battle: log every audio call the game actually makes + event coverage
//   5  mix: full battle bed + sfx, clipping / masking headroom
import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';

const args = Object.fromEntries(process.argv.slice(2).reduce((a, x, i, arr) => {
  if (x.startsWith('--')) a.push([x.slice(2), arr[i + 1] && !arr[i + 1].startsWith('--') ? arr[i + 1] : true]);
  return a;
}, []));
const PORT = Number(args.port || 8813);
const BASE = `http://127.0.0.1:${PORT}`;
const STAGE = String(args.stage || '1');
const OUT = 'tests/shots/audio';

const errors = [];

async function boot() {
  const browser = await chromium.launch({
    args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--disable-dev-shm-usage', '--no-sandbox',
           '--autoplay-policy=no-user-gesture-required']
  });
  const page = await browser.newPage({ viewport: { width: 1000, height: 640 } });
  page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
  await page.goto(BASE + '/index.html', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.__ARENA && window.__ARENA.ready, null, { timeout: 60000 });
  await page.evaluate(() => window.__ARENA.ready);
  return { browser, page };
}

const save = async (name, obj) => {
  await mkdir(OUT, { recursive: true });
  await writeFile(`${OUT}/${name}.json`, JSON.stringify(obj, null, 1));
  console.log(`  -> ${OUT}/${name}.json`);
};

/* ==================================================================== */
async function stage1(page) {
  const r = await page.evaluate(async () => {
    const lab = await import('/tests/critic/audiolab.js');
    const keys = [
      // what battleView actually fires
      'impact_light', 'impact_med', 'impact_heavy', 'impact_world',
      'hit_flame', 'hit_frost', 'hit_sea', 'hit_storm', 'hit_earth', 'hit_slash', 'hit_fist',
      'hit_shadow', 'hit_light', 'hit_void', 'hit_haki', 'hit_mind', 'hit_toxin',
      'crit', 'super', 'weak', 'immune', 'miss', 'faint', 'lowhp',
      'heal', 'buff', 'debuff', 'shield', 'sleep', 'thunder', 'sludge',
      'weather', 'scatter', 'item',
      'ui_move', 'ui_select', 'ui_back', 'ui_error', 'text_blip',
      'victory', 'defeat'
    ];
    const out = {};
    for (const k of keys) {
      try {
        const buf = await lab.render((A) => A.sfx(k), 4.0, { seed: 4242 });
        out[k] = lab.measure(buf);
      } catch (e) { out[k] = { error: String(e) }; }
    }
    // composites: what a hit ACTUALLY sounds like in play (battleView fires
    // the element impact and then crit/super/weak on top)
    const comp = {};
    const combos = {
      'normal_hit':  (A) => { A.sfx('impact_med'); },
      'crit_hit':    (A) => { A.sfx('impact_med'); A.sfx('crit'); },
      'super_hit':   (A) => { A.sfx('impact_med'); A.sfx('super'); },
      'weak_hit':    (A) => { A.sfx('impact_med'); A.sfx('weak'); },
      'crit_flame':  (A) => { A.sfx('hit_flame'); A.sfx('crit'); },
      'normal_flame':(A) => { A.sfx('hit_flame'); }
    };
    for (const [n, f] of Object.entries(combos)) {
      const buf = await lab.render(f, 4.0, { seed: 4242 });
      comp[n] = { ...lab.measure(buf), fp: lab.fingerprint(buf) };
    }
    const pairs = {};
    const P = (a, b) => { pairs[`${a}|${b}`] = +lab.cosDist(comp[a].fp, comp[b].fp).toFixed(4); };
    P('normal_hit', 'crit_hit'); P('normal_hit', 'super_hit'); P('normal_hit', 'weak_hit');
    P('crit_hit', 'super_hit'); P('normal_flame', 'crit_flame');
    for (const k of Object.keys(comp)) delete comp[k].fp;
    // is any sfx key unreachable / silent?
    const silent = [];
    const allKeys = lab.SFX ? Object.keys(lab.SFX) : [];
    return { sfx: out, comp, pairs, silent, nSfxKeys: allKeys.length, nAlias: Object.keys(lab.SFX_ALIAS).length };
  });
  await save('stage1-sfx', r);
  const rows = Object.entries(r.sfx).map(([k, v]) => v.error ? `${k} ERR ${v.error}` :
    `${k.padEnd(14)} peak ${String(v.peak).padEnd(8)} rms ${String(v.rmsDb).padEnd(7)}dB dur ${String(v.dur).padEnd(7)}s atk ${String(v.attackMs).padEnd(6)}ms cen ${String(v.centroid).padEnd(6)}Hz clip ${v.clipped}`);
  console.log(rows.join('\n'));
  console.log('\nCOMPOSITES');
  for (const [k, v] of Object.entries(r.comp)) console.log(`  ${k.padEnd(13)} peak ${v.peak} rmsDb ${v.rmsDb} dur ${v.dur} cen ${v.centroid} onsets ${v.onsets}`);
  console.log('\nPAIR DISTANCES (cosine, 0=identical)');
  for (const [k, v] of Object.entries(r.pairs)) console.log(`  ${k.padEnd(28)} ${v}`);
  console.log(`\nregistry: ${r.nSfxKeys} sfx keys, ${r.nAlias} aliases`);
}

/* ==================================================================== */
async function stage2(page) {
  const r = await page.evaluate(async () => {
    const lab = await import('/tests/critic/audiolab.js');
    const F = window.__ARENA.data.fighters;
    const list = Array.isArray(F) ? F : Object.values(F);
    const uniq = [];
    const seen = new Set();
    for (const f of list) { if (f && f.id && !seen.has(f.id)) { seen.add(f.id); uniq.push(f); } }
    const res = [];
    for (const f of uniq) {
      const buf = await lab.render((A) => A.cry(f.cry ? f : f), 3.0, { seed: 999 });
      const m = lab.measure(buf);
      res.push({ id: f.id, name: f.name, types: f.types, cry: f.cry, m, fp: lab.fingerprint(buf) });
    }
    // pairwise distances
    const n = res.length;
    const D = [];
    let min = { d: 9, a: '', b: '' }, sum = 0, cnt = 0;
    const nearest = {};
    for (let i = 0; i < n; i++) {
      const row = [];
      let best = { d: 9, id: '' };
      for (let j = 0; j < n; j++) {
        if (i === j) { row.push(0); continue; }
        const d = lab.cosDist(res[i].fp, res[j].fp);
        row.push(+d.toFixed(4));
        if (d < best.d) best = { d: +d.toFixed(4), id: res[j].id };
        if (i < j) { sum += d; cnt++; if (d < min.d) min = { d: +d.toFixed(4), a: res[i].id, b: res[j].id }; }
      }
      D.push(row);
      nearest[res[i].id] = best;
    }
    // Also: how much do the raw parameters differ? (root/shape/len spread)
    const roots = res.map((x) => x.cry?.root).filter((x) => x != null);
    const shapes = {};
    for (const x of res) shapes[x.cry?.shape ?? '?'] = (shapes[x.cry?.shape ?? '?'] || 0) + 1;
    const feat = res.map((x) => ({ id: x.id, dur: x.m.dur, peak: x.m.peak, rmsDb: x.m.rmsDb, cen: x.m.centroid, atk: x.m.attackMs, flat: x.m.flatness, onsets: x.m.onsets }));
    for (const x of res) delete x.fp;
    return {
      count: n, meanDist: +(sum / cnt).toFixed(4), minDist: min, nearest,
      rootRange: [Math.min(...roots), Math.max(...roots)], shapes,
      feat, D, res: res.map((x) => ({ id: x.id, name: x.name, cry: x.cry, m: x.m }))
    };
  });
  await save('stage2-cries', r);
  console.log(`cries: ${r.count}   mean pairwise cos-dist ${r.meanDist}   closest pair ${r.minDist.a}/${r.minDist.b} = ${r.minDist.d}`);
  console.log(`cry.root range ${r.rootRange[0]}..${r.rootRange[1]} Hz   shapes ${JSON.stringify(r.shapes)}`);
  console.log('\nid              dur     peak    rmsDb   centroid  atkMs  onsets  nearest-neighbour');
  for (const f of r.feat) {
    const nn = r.nearest[f.id];
    console.log(`${f.id.padEnd(15)} ${String(f.dur).padEnd(7)} ${String(f.peak).padEnd(7)} ${String(f.rmsDb).padEnd(7)} ${String(f.cen).padEnd(9)} ${String(f.atk).padEnd(6)} ${String(f.onsets).padEnd(7)} ${nn.id} @ ${nn.d}`);
  }
  const ds = [];
  for (let i = 0; i < r.D.length; i++) for (let j = i + 1; j < r.D.length; j++) ds.push(r.D[i][j]);
  ds.sort((a, b) => a - b);
  console.log(`\ndistance distribution: min ${ds[0]} p10 ${ds[Math.floor(ds.length * 0.1)]} med ${ds[Math.floor(ds.length / 2)]} p90 ${ds[Math.floor(ds.length * 0.9)]} max ${ds[ds.length - 1]}`);
}

/* ==================================================================== */
async function stage3(page) {
  const r = await page.evaluate(async () => {
    const lab = await import('/tests/critic/audiolab.js');
    const names = Object.keys(lab.TRACKS);
    const out = { tracks: {}, intensity: {}, defs: {} };
    for (const n of names) out.defs[n] = { bpm: lab.TRACKS[n].bpm, swing: lab.TRACKS[n].swing, gain: lab.TRACKS[n].gain, keys: Object.keys(lab.TRACKS[n]) };
    for (const n of names) {
      const buf = await lab.render((A) => A.scheduleMusicOffline(n, 16, 0.5), 16.5, { seed: 7 });
      out.tracks[n] = { ...lab.measure(buf), fp: lab.fingerprint(buf) };
    }
    // intensity sweep on the battle track
    const levels = [0.0, 0.25, 0.5, 0.75, 1.0];
    const fps = {};
    for (const I of levels) {
      const buf = await lab.render((A) => A.scheduleMusicOffline('battle', 16, I), 16.5, { seed: 7 });
      out.intensity['battle@' + I] = lab.measure(buf);
      fps['battle@' + I] = lab.fingerprint(buf);
    }
    for (const I of [0.5, 1.0]) {
      const buf = await lab.render((A) => A.scheduleMusicOffline('laststand', 16, I), 16.5, { seed: 7 });
      out.intensity['laststand@' + I] = lab.measure(buf);
      fps['laststand@' + I] = lab.fingerprint(buf);
    }
    out.intensityDist = {};
    const L = Object.keys(fps);
    for (let i = 0; i < L.length; i++) for (let j = i + 1; j < L.length; j++) {
      out.intensityDist[`${L[i]} vs ${L[j]}`] = +lab.cosDist(fps[L[i]], fps[L[j]]).toFixed(4);
    }
    out.trackDist = {};
    for (let i = 0; i < names.length; i++) for (let j = i + 1; j < names.length; j++) {
      out.trackDist[`${names[i]} vs ${names[j]}`] = +lab.cosDist(out.tracks[names[i]].fp, out.tracks[names[j]].fp).toFixed(4);
    }
    for (const n of names) delete out.tracks[n].fp;
    // long render — does the loop repeat literally? compare bar 1..4 vs 9..12
    const long = await lab.render((A) => A.scheduleMusicOffline('battle', 60, 0.6), 61, { seed: 7 });
    const secPerBar = 4 * 60 / lab.TRACKS.battle.bpm;
    const slice = (b0, b1) => {
      const oc = { sampleRate: lab.SR, numberOfChannels: 2,
        getChannelData: (c) => long.getChannelData(c).slice(Math.floor(b0 * secPerBar * lab.SR), Math.floor(b1 * secPerBar * lab.SR)),
        length: Math.floor((b1 - b0) * secPerBar * lab.SR) };
      return oc;
    };
    out.secPerBar = +secPerBar.toFixed(3);
    out.loopCmp = {};
    const segs = {};
    for (const [nm, a, b] of [['bars0-4', 0, 4], ['bars4-8', 4, 8], ['bars8-12', 8, 12], ['bars12-16', 12, 16]]) {
      const s = slice(a, b);
      segs[nm] = lab.fingerprint(s);
      out.loopCmp[nm] = lab.measure(s);
    }
    out.segDist = {};
    const S = Object.keys(segs);
    for (let i = 0; i < S.length; i++) for (let j = i + 1; j < S.length; j++) out.segDist[`${S[i]} vs ${S[j]}`] = +lab.cosDist(segs[S[i]], segs[S[j]]).toFixed(4);
    return out;
  });
  await save('stage3-music', r);
  console.log('TRACK DEFS'); for (const [k, v] of Object.entries(r.defs)) console.log(`  ${k.padEnd(11)} bpm ${v.bpm} swing ${v.swing} gain ${v.gain}`);
  console.log('\nTRACKS (16s render @ I=0.5)');
  for (const [k, v] of Object.entries(r.tracks)) console.log(`  ${k.padEnd(11)} peak ${String(v.peak).padEnd(7)} rmsDb ${String(v.rmsDb).padEnd(7)} cen ${String(v.centroid).padEnd(6)} onsets ${String(v.onsets).padEnd(4)} width ${v.width} clip ${v.clipped}`);
  console.log('\nINTENSITY');
  for (const [k, v] of Object.entries(r.intensity)) console.log(`  ${k.padEnd(15)} rmsDb ${String(v.rmsDb).padEnd(7)} peak ${String(v.peak).padEnd(7)} cen ${String(v.centroid).padEnd(6)} onsets ${String(v.onsets).padEnd(4)} bands ${v.bands.slice(0, 7).join(',')}`);
  console.log('\nINTENSITY FINGERPRINT DISTANCE'); for (const [k, v] of Object.entries(r.intensityDist)) console.log(`  ${k.padEnd(34)} ${v}`);
  console.log('\nTRACK-TO-TRACK DISTANCE'); for (const [k, v] of Object.entries(r.trackDist)) console.log(`  ${k.padEnd(28)} ${v}`);
  console.log(`\nsecPerBar ${r.secPerBar}\nLOOP SEGMENTS`); for (const [k, v] of Object.entries(r.loopCmp)) console.log(`  ${k.padEnd(11)} rmsDb ${v.rmsDb} onsets ${v.onsets} cen ${v.centroid}`);
  console.log('SEGMENT DISTANCE'); for (const [k, v] of Object.entries(r.segDist)) console.log(`  ${k.padEnd(26)} ${v}`);
}

/* ==================================================================== */
async function stage4(page) {
  // instrument the live audio surface, then drive a real battle to the end
  await page.evaluate(() => {
    const A = window.__ARENA.audio;
    window.__LOG = [];
    const t0 = performance.now();
    for (const m of ['sfx', 'cry', 'startMusic', 'stopMusic', 'setIntensity', 'tone', 'noise']) {
      const orig = A[m].bind(A);
      A[m] = (...a) => {
        let arg0 = a[0];
        if (m === 'cry') arg0 = (arg0 && (arg0.id || arg0.shape)) || 'cry?';
        window.__LOG.push({ t: +(performance.now() - t0).toFixed(1), m, a: arg0, o: m === 'sfx' ? (a[1] || null) : null });
        return orig(...a);
      };
    }
    window.__ARENA.audio.setMuted(true); // keep it silent; we only count calls
  });

  const res = await page.evaluate(async () => {
    const A = window.__ARENA;
    A.battle.quick(20260811);
    await new Promise((r) => setTimeout(r, 1500));
    const seen = new Set();
    let turns = 0;
    const deadline = Date.now() + 90000;
    while (Date.now() < deadline) {
      const side = A.battle.waitingFor();
      if (side != null) {
        const st = A.battle.state();
        if (!st) break;
        // pick a damaging move when we can
        const me = st.sides[side];
        const act = me?.active?.[0];
        const moves = act?.moves || [];
        let idx = 0;
        for (let i = 0; i < moves.length; i++) if ((moves[i].pp ?? 1) > 0) { idx = i; break; }
        A.battle.choose(side, { type: 'move', move: idx, target: 0 });
        turns++;
      }
      if (A.router.currentId !== 'battle') break;
      await new Promise((r) => setTimeout(r, 120));
    }
    // collect events for coverage comparison
    const evs = A.battle.events() || (A.battle.last()?.events) || [];
    const types = {};
    for (const e of evs) types[e.type] = (types[e.type] || 0) + 1;
    return { turns, screen: A.router.currentId, evTypes: types, nEvents: evs.length, log: window.__LOG };
  });

  const counts = {};
  for (const l of res.log) {
    const k = `${l.m}:${l.a}`;
    counts[k] = (counts[k] || 0) + 1;
  }
  await save('stage4-live', { ...res, counts });
  console.log(`turns driven ${res.turns}  ending screen "${res.screen}"  events ${res.nEvents}  audio calls ${res.log.length}`);
  console.log('\nEVENT TYPES EMITTED');
  console.log(Object.entries(res.evTypes).sort((a, b) => b[1] - a[1]).map(([k, v]) => `  ${k.padEnd(18)} ${v}`).join('\n'));
  console.log('\nAUDIO CALLS MADE (count)');
  console.log(Object.entries(counts).sort((a, b) => b[1] - a[1]).map(([k, v]) => `  ${k.padEnd(28)} ${v}`).join('\n'));
  console.log('\nFIRST 60 CALLS IN ORDER');
  console.log(res.log.slice(0, 60).map((l) => `  ${String(l.t).padStart(8)}ms  ${l.m}(${l.a})`).join('\n'));
  const distinctSfx = new Set(res.log.filter((l) => l.m === 'sfx').map((l) => l.a));
  console.log(`\ndistinct sfx keys used in one full battle: ${distinctSfx.size} -> ${[...distinctSfx].join(', ')}`);
  const cries = res.log.filter((l) => l.m === 'cry');
  console.log(`cry calls: ${cries.length}`);
}

/* ==================================================================== */
async function stage5(page) {
  const r = await page.evaluate(async () => {
    const lab = await import('/tests/critic/audiolab.js');
    // Full-mix: battle bed + a realistic turn of sfx on top, at ship defaults.
    const turn = (A, t) => {
      // battleView order for one damaging crit hit + lowhp
      A.sfx('hit_flame', { side: 1 });
      A.sfx('crit', { side: 1 });
      A.sfx('lowhp');
    };
    const mixed = await lab.render(async (A) => {
      A.scheduleMusicOffline('battle', 12, 0.85);
      A.sfx('hit_flame', { side: 1 });
      A.sfx('crit', { side: 1 });
    }, 12.5, { seed: 5 });
    const bedOnly = await lab.render((A) => A.scheduleMusicOffline('battle', 12, 0.85), 12.5, { seed: 5 });
    const sfxOnly = await lab.render((A) => { A.sfx('hit_flame', { side: 1 }); A.sfx('crit', { side: 1 }); }, 4, { seed: 5 });

    // masking: compare each cue's rms in its own window vs the bed's rms
    const bed = lab.measure(bedOnly);
    const cues = {};
    for (const k of ['lowhp', 'crit', 'super', 'weak', 'text_blip', 'ui_move', 'buff', 'debuff', 'heal', 'miss', 'faint', 'immune', 'item', 'shield']) {
      const b = await lab.render((A) => A.sfx(k), 3.0, { seed: 5 });
      const m = lab.measure(b);
      cues[k] = { rmsDb: m.rmsDb, peakDb: m.peakDb, dur: m.dur, overBedDb: +(m.rmsDb - bed.rmsDb).toFixed(2), cen: m.centroid };
    }
    // a loud, worst-case simultaneous burst
    const burst = await lab.render((A) => {
      A.scheduleMusicOffline('laststand', 6, 1.0);
      for (let i = 0; i < 8; i++) A.sfx(['impact_world', 'thunder_big', 'quake', 'conqueror', 'hit_haki', 'cannon', 'slash_world', 'dragon'][i], { delay: i * 0.02, side: i % 2 });
    }, 7, { seed: 5 });
    return {
      bed, mixed: lab.measure(mixed), sfxOnly: lab.measure(sfxOnly), burst: lab.measure(burst), cues,
      vols: { master: 0.7, music: 0.35, sfx: 0.8 }
    };
  });
  await save('stage5-mix', r);
  const p = (n, v) => console.log(`  ${n.padEnd(10)} peak ${String(v.peak).padEnd(7)} peakDb ${String(v.peakDb).padEnd(7)} rmsDb ${String(v.rmsDb).padEnd(7)} crest ${String(v.crest).padEnd(6)} clippedSamples ${v.clipped}`);
  console.log('MIX'); p('bed', r.bed); p('sfxOnly', r.sfxOnly); p('mixed', r.mixed); p('burst8', r.burst);
  console.log('\nCUE LEVEL vs MUSIC BED (positive = cue louder than the bed)');
  for (const [k, v] of Object.entries(r.cues)) console.log(`  ${k.padEnd(11)} rms ${String(v.rmsDb).padEnd(7)}dB  overBed ${String(v.overBedDb).padStart(7)}dB  dur ${String(v.dur).padEnd(6)}s cen ${v.cen}`);
}


/* ==================================================================== */
// Masking: does adding the cue on top of the music bed change the signal in
// the cue's own window, and by how much? Renders separately and sums the
// Float32Arrays (the master limiter is not engaging at these levels).
async function stage6(page) {
  const r = await page.evaluate(async () => {
    const lab = await import('/tests/critic/audiolab.js');
    const SR = lab.SR;
    const bed = await lab.render((A) => A.scheduleMusicOffline('battle', 10, 0.8), 10.2, { seed: 11 });
    const bedLast = await lab.render((A) => A.scheduleMusicOffline('laststand', 10, 0.95), 10.2, { seed: 11 });
    const bedL = bed.getChannelData(0), bedR = bed.getChannelData(1);
    const bedLL = bedLast.getChannelData(0), bedLR = bedLast.getChannelData(1);

    const rmsOf = (a, b, i0, i1) => { let s = 0, n = 0; for (let i = i0; i < i1; i++) { const m = (a[i] + b[i]) / 2; s += m * m; n++; } return Math.sqrt(s / n); };
    const bandRms = (a, b, i0, i1, f0, f1) => {
      // crude one-pole bandpass by FFT of the window
      const N = 8192; const off = i0;
      const x = new Float32Array(N);
      for (let i = 0; i < N && off + i < a.length; i++) x[i] = (a[off + i] + b[off + i]) / 2;
      // simple Goertzel-ish band energy via DFT bins
      let s = 0;
      const step = Math.max(1, Math.floor((f1 - f0) / 60));
      for (let f = f0; f <= f1; f += step) {
        let re = 0, im = 0;
        for (let i = 0; i < N; i++) { const w = 2 * Math.PI * f * i / SR; re += x[i] * Math.cos(w); im -= x[i] * Math.sin(w); }
        s += (re * re + im * im);
      }
      return Math.sqrt(s) / N;
    };

    const cues = ['crit', 'super', 'weak', 'lowhp', 'text_blip', 'ui_move', 'ui_select', 'miss', 'heal', 'buff',
                  'debuff', 'faint', 'immune', 'item', 'shield', 'impact_med', 'hit_flame', 'thunder', 'sleep', 'sludge'];
    const out = {};
    const T0 = Math.floor(4.0 * SR);
    for (const k of cues) {
      const c = await lab.render((A) => A.sfx(k), 3.0, { seed: 11 });
      const cL = c.getChannelData(0), cR = c.getChannelData(1);
      let cp = 0, ci = 0;
      for (let i = 0; i < cL.length; i++) { const m = Math.abs((cL[i] + cR[i]) / 2); if (m > cp) { cp = m; } }
      // audible length of the cue
      let last = 0; for (let i = cL.length - 1; i >= 0; i--) { if (Math.abs((cL[i] + cR[i]) / 2) > cp * 0.0032) { last = i; break; } }
      const len = Math.max(Math.floor(0.05 * SR), last);
      // sum
      const mixL = new Float32Array(bedL.length), mixR = new Float32Array(bedR.length);
      mixL.set(bedL); mixR.set(bedR);
      for (let i = 0; i < len && T0 + i < mixL.length; i++) { mixL[T0 + i] += cL[i]; mixR[T0 + i] += cR[i]; }
      const before = rmsOf(bedL, bedR, T0, T0 + len);
      const after = rmsOf(mixL, mixR, T0, T0 + len);
      const cueAlone = rmsOf(cL, cR, 0, len);
      out[k] = {
        cueRmsDb: +(20 * Math.log10(cueAlone + 1e-12)).toFixed(2),
        bedRmsDb: +(20 * Math.log10(before + 1e-12)).toFixed(2),
        snrDb: +(20 * Math.log10((cueAlone + 1e-12) / (before + 1e-12))).toFixed(2),
        liftDb: +(20 * Math.log10((after + 1e-12) / (before + 1e-12))).toFixed(2),
        cuePeak: +cp.toFixed(5), lenMs: +(len / SR * 1000).toFixed(0)
      };
    }
    // same against the loud last-stand bed
    const outLast = {};
    for (const k of ['crit', 'faint', 'lowhp', 'text_blip', 'heal']) {
      const c = await lab.render((A) => A.sfx(k), 3.0, { seed: 11 });
      const cL = c.getChannelData(0), cR = c.getChannelData(1);
      let cp = 0; for (let i = 0; i < cL.length; i++) cp = Math.max(cp, Math.abs((cL[i] + cR[i]) / 2));
      let last = 0; for (let i = cL.length - 1; i >= 0; i--) { if (Math.abs((cL[i] + cR[i]) / 2) > cp * 0.0032) { last = i; break; } }
      const len = Math.max(Math.floor(0.05 * SR), last);
      const mixL = new Float32Array(bedLL.length), mixR = new Float32Array(bedLR.length);
      mixL.set(bedLL); mixR.set(bedLR);
      for (let i = 0; i < len && T0 + i < mixL.length; i++) { mixL[T0 + i] += cL[i]; mixR[T0 + i] += cR[i]; }
      const before = rmsOf(bedLL, bedLR, T0, T0 + len);
      const after = rmsOf(mixL, mixR, T0, T0 + len);
      const cueAlone = rmsOf(cL, cR, 0, len);
      outLast[k] = { snrDb: +(20 * Math.log10((cueAlone + 1e-12) / (before + 1e-12))).toFixed(2), liftDb: +(20 * Math.log10((after + 1e-12) / (before + 1e-12))).toFixed(2) };
    }
    return { battleBed: out, lastStandBed: outLast };
  });
  await save('stage6-masking', r);
  console.log('CUE vs BATTLE BED (I=0.8).  snrDb = cue RMS - bed RMS in the same window.');
  console.log('liftDb = how much the summed signal actually rises when the cue plays.\n');
  console.log('cue           cueRms   bedRms   SNR      LIFT    peak     len');
  for (const [k, v] of Object.entries(r.battleBed))
    console.log(`  ${k.padEnd(12)} ${String(v.cueRmsDb).padEnd(8)} ${String(v.bedRmsDb).padEnd(8)} ${String(v.snrDb).padEnd(8)} ${String(v.liftDb).padEnd(7)} ${String(v.cuePeak).padEnd(8)} ${v.lenMs}ms`);
  console.log('\nvs LAST-STAND BED (I=0.95)');
  for (const [k, v] of Object.entries(r.lastStandBed)) console.log(`  ${k.padEnd(12)} SNR ${String(v.snrDb).padEnd(8)} LIFT ${v.liftDb}`);
}

/* ==================================================================== */
const STAGES = { 1: stage1, 2: stage2, 3: stage3, 4: stage4, 5: stage5, 6: stage6 };
const { browser, page } = await boot();
try {
  for (const s of String(STAGE).split(',')) {
    console.log(`\n===== STAGE ${s} =====`);
    await STAGES[s.trim()](page);
  }
} finally {
  if (errors.length) console.log('\nPAGE ERRORS:\n' + errors.slice(0, 12).join('\n'));
  await browser.close();
}
