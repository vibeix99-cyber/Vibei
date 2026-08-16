// Is the battle audible, and is the mix balanced? A gate, not an exploration.
//
//   node tools/audiocheck.mjs [--port 8813]
//
// Exists because the first attempt at the mix was calibrated against stage 1 of
// the critic harness, which renders 41 of the registry's 103 keys and none of
// the ones a live battle actually fires. The lift went onto the stinger layer,
// the impact layer was left buried, and a stat buff ended up louder than a
// punch. This drives a real battle, records which keys the game *actually*
// played, and judges only those — so the sample can never drift from the game
// again.
//
// Four checks:
//   1. every live-fired key against the music bed's typical instant
//   2. the impact ladder still has a ladder in it (tap != world-ender)
//   3. a busy real turn does not clip
//   4. the music actually ducks when a stinger lands

import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { setTimeout as sleep } from 'node:timers/promises';

const arg = (k, d) => { const i = process.argv.indexOf(`--${k}`); return i >= 0 ? process.argv[i + 1] : d; };
const PORT = Number(arg('port', 8813));

const server = spawn(process.execPath, ['tools/serve.mjs', String(PORT)], { stdio: ['ignore', 'pipe', 'pipe'] });
await new Promise((r) => server.stdout.on('data', (d) => String(d).includes('serving') && r()));
const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const page = await browser.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
await page.goto(`http://127.0.0.1:${PORT}/index.html`, { waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => window.__ARENA?.version, null, { timeout: 30000 });
await page.evaluate(() => window.__ARENA.ready);

/* ---- 1. which keys does a real battle actually fire? ---- */
const fired = await page.evaluate(async () => {
  const A = window.__ARENA.audio;
  const seen = new Map();
  const realSfx = A.sfx.bind(A);
  A.sfx = (k, o) => { seen.set(k, (seen.get(k) || 0) + 1); return realSfx(k, o); };
  A.setMuted(true);
  window.__ARENA.battle.quick('AUDIT-1');
  const t0 = Date.now();
  while (Date.now() - t0 < 40000) {
    const w = window.__ARENA.battle.waitingFor();
    if (w === 0) {
      const s = window.__ARENA.battle.screen();
      if (s) window.__ARENA.battle.choose(0, window.__ARENA.sim.chooseAction(s.battle, 0, 'ace'));
    }
    if (window.__ARENA.battle.screen()?.battle?.ended) break;
    await new Promise((r) => setTimeout(r, 120));
  }
  A.sfx = realSfx;
  return [...seen.entries()].sort((a, b) => b[1] - a[1]);
});

/* ---- 2-4. measure those keys offline against the bed ---- */
const r = await page.evaluate(async (firedKeys) => {
  const lab = await import('/tests/critic/audiolab.js');
  const bed = await lab.render((A) => A.scheduleMusicOffline('battle', 6, 0.6), 6.2, { seed: 11 });
  const bL = bed.getChannelData(0), bR = bed.getChannelData(1);
  const win = Math.floor(0.25 * lab.SR), pk = [];
  for (let i = 0; i + win < bL.length; i += win) {
    let p = 0; for (let j = i; j < i + win; j++) { const m = Math.abs((bL[j] + bR[j]) / 2); if (m > p) p = m; }
    pk.push(p);
  }
  pk.sort((a, b) => a - b);
  const bedPeak = pk[pk.length >> 1];
  const db = (x) => +(20 * Math.log10(x + 1e-12)).toFixed(2);

  const cues = {};
  for (const [k] of firedKeys) {
    const c = await lab.render((A) => A.sfx(k), 2.2, { seed: 11 });
    const cL = c.getChannelData(0), cR = c.getChannelData(1);
    let p = 0; for (let i = 0; i < cL.length; i++) { const m = Math.abs((cL[i] + cR[i]) / 2); if (m > p) p = m; }
    cues[k] = +(db(p) - db(bedPeak)).toFixed(2);
  }

  // busy turn: eight cues spread across 1.2s over the bed, using real delays
  const busy = await lab.render((A) => {
    A.scheduleMusicOffline('battle', 3, 0.7);
    const ks = ['slash_heavy', 'impact_med', 'crit', 'super', 'clang', 'hit_flame', 'faint', 'heal'];
    ks.forEach((k, i) => A.sfx(k, { delay: i * 0.15 }));
  }, 3.2, { seed: 5 });
  const uL = busy.getChannelData(0), uR = busy.getChannelData(1);
  let bp = 0, clipped = 0;
  for (let i = 0; i < uL.length; i++) {
    const m = (uL[i] + uR[i]) / 2;
    if (Math.abs(m) > bp) bp = Math.abs(m);
    if (Math.abs(uL[i]) >= 1 || Math.abs(uR[i]) >= 1) clipped++;
  }

  // does a delay actually schedule? first sample above the noise floor
  const onsetOf = async (delay) => {
    const c = await lab.render((A) => A.sfx('crit', { delay }), 2.5, { seed: 3 });
    const d = c.getChannelData(0);
    let peak = 0; for (let i = 0; i < d.length; i++) peak = Math.max(peak, Math.abs(d[i]));
    for (let i = 0; i < d.length; i++) if (Math.abs(d[i]) > peak * 0.05) return +(i / lab.SR).toFixed(3);
    return -1;
  };
  const onsets = { at0: await onsetOf(0), at05: await onsetOf(0.5), at10: await onsetOf(1.0) };

  // does the music duck? render bed alone vs bed + a ducking stinger, and
  // compare the bed's own low band (which the cue barely occupies) after it.
  const lowRms = (buf, t0, t1) => {
    const a = buf.getChannelData(0), b = buf.getChannelData(1);
    const i0 = Math.floor(t0 * lab.SR), i1 = Math.floor(t1 * lab.SR);
    let acc = 0, prev = 0, n = 0;
    for (let i = i0; i < i1 && i < a.length; i++) {
      const x = (a[i] + b[i]) / 2;
      prev = prev + 0.02 * (x - prev);          // ~150Hz one-pole, the band the bed owns
      acc += prev * prev; n++;
    }
    return Math.sqrt(acc / Math.max(1, n));
  };
  // Probe with `super`, not `crit`: a crit now carries a deliberate low-frequency
  // body, so it fills the very band this test reads and the bed appears to get
  // *louder*. `super` is a pair of high square pings with nothing under 900 Hz.
  const bedOnly = await lab.render((A) => A.scheduleMusicOffline('battle', 4, 0.6), 4.2, { seed: 11 });
  const bedDuck = await lab.render((A) => { A.scheduleMusicOffline('battle', 4, 0.6); A.sfx('super', { delay: 1.5 }); }, 4.2, { seed: 11 });
  const duckDb = +(db(lowRms(bedDuck, 1.55, 1.85)) - db(lowRms(bedOnly, 1.55, 1.85))).toFixed(2);

  return { bedPeakDb: db(bedPeak), cues, busyPeakDb: db(bp), clipped, onsets, duckDb };
}, fired);

await browser.close();
server.kill();

const S = (k) => (r.cues[k] ?? 0);
const combat = Object.keys(r.cues).filter((k) => !/^(crit|super|weak|immune|miss|lowhp|heal|buff|debuff|item|shield|faint|poison|paralyze|freeze|sleep|confuse|text_blip|ui_|victory|defeat|levelup)/.test(k));
const stingers = Object.keys(r.cues).filter((k) => /^(crit|super|weak|immune|lowhp|heal|buff|debuff|item|faint)$/.test(k));

console.log(`\n════ AUDIO MIX — judged on the ${fired.length} keys a real battle actually fired ════`);
console.log(`bed median 250ms-window peak ${r.bedPeakDb} dBFS\n`);
console.log('  key                fired   vs bed');
for (const [k, n] of fired) console.log(`  ${k.padEnd(18)} ${String(n).padStart(5)}   ${String(S(k)).padStart(7)} dB`);

const quietestCombat = combat.length ? Math.min(...combat.map(S)) : 0;
const loudestCombat = combat.length ? Math.max(...combat.map(S)) : 0;
const medStinger = stingers.length ? stingers.map(S).sort((a, b) => a - b)[stingers.length >> 1] : 0;

console.log(`\n  combat layer     ${quietestCombat.toFixed(1)} … ${loudestCombat.toFixed(1)} dB vs bed   (ladder ${(loudestCombat - quietestCombat).toFixed(1)} dB wide)`);
console.log(`  stinger layer    median ${medStinger.toFixed(1)} dB vs bed`);
console.log(`  busy turn        peak ${r.busyPeakDb} dBFS, ${r.clipped} clipped samples`);
console.log(`  delay honoured   onset at delay 0 / 0.5 / 1.0 = ${r.onsets.at0} / ${r.onsets.at05} / ${r.onsets.at10} s`);
console.log(`  music ducks      ${r.duckDb} dB in the bed's own low band while a stinger lands`);

let bad = 0;
if (quietestCombat < -12) { console.log(`\n✗ the quietest live-fired combat sound is ${quietestCombat.toFixed(1)} dB under the bed — you cannot hear the hit`); bad++; }
if (medStinger - loudestCombat > 9) { console.log(`\n✗ stingers sit ${(medStinger - loudestCombat).toFixed(1)} dB over the loudest hit — the mix is inverted`); bad++; }
if (loudestCombat - quietestCombat < 3) { console.log(`\n✗ the combat ladder is only ${(loudestCombat - quietestCombat).toFixed(1)} dB wide — a tap and a world-ender land the same`); bad++; }
// Zero clipped samples is the criterion, not the peak level. There is a
// brickwall limiter on the master at -1.6 dB / 20:1, so any loud passage lands
// just above that threshold by design — a busy turn reading -0.17 dBFS is the
// limiter working, not headroom running out. I asserted on the peak first and
// it failed the build for doing its job.
if (r.clipped > 0) { console.log(`\n✗ ${r.clipped} clipped samples in a busy turn`); bad++; }
if (Math.abs(r.onsets.at05 - 0.5) > 0.05 || Math.abs(r.onsets.at10 - 1.0) > 0.05) { console.log(`\n✗ sfx delay is not honoured — cues fire at t=0 regardless`); bad++; }
if (r.duckDb > -0.5) { console.log(`\n✗ the music does not duck (${r.duckDb} dB) — every cue fights the bed at full level`); bad++; }
if (errors.length) { console.log(`\n✗ page errors: ${errors.join(' | ')}`); bad++; }
console.log(bad ? `\n❌ ${bad} problem(s)` : `\n✅ mix balanced, ladder intact, delay honoured, music ducks, no clipping`);
process.exit(bad ? 1 : 0);
