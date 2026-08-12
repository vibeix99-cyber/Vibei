// Do the picture and the words describe the same moment?
//
//   node tools/feelcheck.mjs [--port 8886] [--turns 8] [--seed FEELZ-3]
//
// A blind critic scored feel 6/10 with one gap: the visual beat and the text
// beat run on separate clocks. Flash, shake, particles and the HP drain all
// finish inside half a second; the line explaining the hit lands up to 2.3s
// later onto a frame where nothing at all is moving. It measured 18% of battle
// time as completely static and found four of seven hits announced *after* they
// had already landed. This turns both of those into numbers you can re-run.
//
// Sampling is per animation frame from inside the page, and every timestamp is
// the game clock (`stage.time`). Headless software-renders at 1-4fps, so wall
// clock says nothing about intended duration.
//
//   dead      fraction of battle time with no shake, no flash, no VFX, no HP
//             movement and no text movement — nothing on screen changing
//   lag       game-seconds between an impact flash and the completion of the
//             line that explains it
//   backlog   how deep the unread text queue gets

import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { setTimeout as sleep } from 'node:timers/promises';

const arg = (k, d) => { const i = process.argv.indexOf(`--${k}`); return i >= 0 ? process.argv[i + 1] : d; };
const PORT = Number(arg('port', 8886));
const TURNS = Number(arg('turns', 8));
const SEED = arg('seed', 'FEELZ-3');

const server = spawn(process.execPath, ['tools/serve.mjs', String(PORT)], { stdio: ['ignore', 'pipe', 'pipe'] });
await new Promise((r) => server.stdout.on('data', (d) => String(d).includes('serving') && r()));
const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const page = await browser.newPage({ viewport: { width: 960, height: 600 } });
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
await page.goto(`http://127.0.0.1:${PORT}/?quality=low`, { waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => window.__ARENA?.version, null, { timeout: 60000 });
await page.evaluate(() => window.__ARENA.ready);
await page.evaluate(() => window.__ARENA.audio.setMuted(true));

// Per-frame recorder, installed once and left running.
await page.evaluate(() => {
  const A = window.__ARENA;
  window.__S = [];
  const tick = () => {
    requestAnimationFrame(tick);
    try {
      const F = A.stage.feel, T = A.app.textbox, V = A.app.view;
      window.__S.push({
        gt: +A.stage.time.toFixed(3),
        sh: F.shake.amp, fl: F.flash.a, ch: F.chroma, z: F.zoomPunch, hs: F.hitstopMs,
        vfx: V.vfx?.active?.length ?? 0,
        hp: A.app.plates.map((p) => +(p.hpSpring?.value ?? p.hp ?? 0).toFixed(5)),
        chars: T.charIdx, full: T.current ? (T.current.text || '').length : 0,
        tq: T.queue.length, txt: T.current?.text || '',
        shot: A.app.dir?.shot?.id ?? null,
        wait: A.battle.waitingFor?.() ?? null,
        // Actor and camera motion, so "nothing is moving" can be checked
        // against the whole frame rather than against the effects layer only.
        act: (V.actors || []).map((a) => (a?.root ? [+a.root.position.x.toFixed(4), +a.root.position.y.toFixed(4)] : null)),
        cam: [+A.stage.camera.position.x.toFixed(4), +A.stage.camera.position.y.toFixed(4), +A.stage.camera.position.z.toFixed(4)]
      });
    } catch { /* between screens */ }
  };
  requestAnimationFrame(tick);
});

await page.evaluate((s) => window.__ARENA.battle.quick(s), SEED);
// Drive turns, answering as the AI would.
for (let i = 0; i < 400; i++) {
  const st = await page.evaluate(() => {
    const w = window.__ARENA.battle.waitingFor();
    if (w === 0) {
      const s = window.__ARENA.battle.screen();
      if (s) window.__ARENA.battle.choose(0, window.__ARENA.sim.chooseAction(s.battle, 0, 'ace'));
    }
    const b = window.__ARENA.battle.screen()?.battle;
    return { ended: !!b?.ended, turn: b?.turn ?? 0 };
  });
  if (st.ended || st.turn > TURNS) break;
  await sleep(250);
}

const S = await page.evaluate(() => window.__S);
await browser.close();
server.kill();

/* ------------------------------------------------------- analysis */
const samples = S.filter((s) => s && Number.isFinite(s.gt));
if (samples.length < 30) {
  console.log(`\n❌ only ${samples.length} samples — the recorder never got going`);
  process.exit(1);
}
const t0 = samples[0].gt, t1 = samples[samples.length - 1].gt;
const span = t1 - t0;

let dead = 0, deadRuns = [], run = 0, maxQ = 0, deadFx = 0;
const flashes = [], lineDone = [];
for (let i = 1; i < samples.length; i++) {
  const a = samples[i - 1], b = samples[i];
  const dt = b.gt - a.gt;
  if (!(dt > 0) || dt > 1) continue;                     // skip stalls between screens
  maxQ = Math.max(maxQ, b.tq);
  const moving =
    b.sh > 1e-3 || b.fl > 1e-3 || b.ch > 1e-3 || b.z > 1e-3 || b.hs > 0 ||
    b.vfx > 0 ||
    b.hp.some((v, k) => Math.abs(v - (a.hp[k] ?? v)) > 1e-5) ||
    b.chars !== a.chars;
  // Two readings. `deadFx` is the effects-layer test the critic used. `dead`
  // additionally asks whether the fighters or the camera moved at all — a
  // breathing idle and a drifting camera mean the frame is not actually frozen,
  // and a metric that cannot see them will report a living scene as dead.
  const actMoved = b.act.some((v, k) => {
    const w = a.act?.[k];
    return v && w && (Math.abs(v[0] - w[0]) > 2e-4 || Math.abs(v[1] - w[1]) > 2e-4);
  });
  const camMoved = a.cam && b.cam.some((v, k) => Math.abs(v - a.cam[k]) > 2e-4);
  if (!moving) deadFx += dt;
  if (moving || actMoved || camMoved) { if (run > 0) deadRuns.push(run); run = 0; }
  else { dead += dt; run += dt; }
  // impact = flash rising through a real threshold
  if (a.fl <= 0.05 && b.fl > 0.05) flashes.push(b.gt);
  // a line finishing its typewriter
  if (a.chars < a.full && b.chars >= b.full && b.full > 0) lineDone.push({ t: b.gt, text: b.txt });
}
if (run > 0) deadRuns.push(run);
deadRuns.sort((x, y) => y - x);

// For each impact, was the box showing the line that explains it?
//
// Third rule, because the first two measured the wrong thing and said so
// confidently. "First line completing after the flash" pairs an impact with an
// unrelated later line as soon as the text runs slightly ahead. "Nearest line
// in either direction" only asks whether *some* line landed near the hit, which
// a busy turn satisfies by accident. What the critic actually photographed was
// a -28 crit exploding while the box read "Tanjiro recovered health!" with two
// lines still stacked behind it — a STALE box at the moment of impact.
//
// So: at each flash, how many lines is the box behind, and how long does a line
// take from being spoken to being fully readable?
const staleAt = [];
for (const f of flashes) {
  const s0 = samples.find((x) => x.gt >= f);
  if (s0) staleAt.push({ q: s0.tq, typing: s0.chars < s0.full });
}
const stale = staleAt.filter((x) => x.q > 0).length;
const midType = staleAt.filter((x) => x.typing).length;

// The quantity that actually matters, and the one the critic named: how long
// after an impact does the line EXPLAINING that impact become readable?
//
// Identify it as the line whose first appearance is closest to the flash — the
// reaction line is said on the same frame the damage event dispatches. Counting
// "any line near the flash" or "the next line to finish" both answer a
// different question and both looked convincing while doing it.
const explain = [];
{
  const firstSeen = new Map();
  for (const x of samples) if (x.txt && !firstSeen.has(x.txt)) firstSeen.set(x.txt, x.gt);
  for (const f of flashes) {
    let pick = null, best = 1e9;
    for (const [txt, t0s] of firstSeen) {
      const d = Math.abs(t0s - f);
      if (d < best && d <= 0.6) { best = d; pick = txt; }
    }
    if (!pick) continue;
    const done = samples.find((x) => x.gt >= f - 0.3 && x.txt === pick && x.full > 0 && x.chars >= x.full);
    if (done) explain.push(+(done.gt - f).toFixed(2));
  }
}
explain.sort((a, b) => a - b);
const exMed = explain.length ? explain[Math.floor(explain.length / 2)] : 0;
const exWorst = explain.length ? explain[explain.length - 1] : 0;

// say -> fully typed, per line, from the recorder's own transitions.
const lat = [];
{
  let started = null, seen = '';
  for (const x of samples) {
    if (x.txt && x.txt !== seen) { seen = x.txt; started = x.gt; }
    if (started !== null && x.full > 0 && x.chars >= x.full && x.txt === seen) {
      lat.push(+(x.gt - started).toFixed(2)); started = null;
    }
  }
}
lat.sort((a, b) => a - b);
const latMed = lat.length ? lat[Math.floor(lat.length / 2)] : 0;
const latWorst = lat.length ? lat[lat.length - 1] : 0;

const pct = (v) => `${(v * 100).toFixed(1)}%`;
console.log(`\n════ FEEL — picture against words ════\n`);
console.log(`  battle sampled            ${span.toFixed(1)} game-seconds, ${samples.length} frames`);
console.log(`  frozen frames             ${dead.toFixed(2)}s (${pct(dead / span)})   nothing at all moving`);
console.log(`  static effects layer      ${deadFx.toFixed(2)}s (${pct(deadFx / span)})   no fx/hp/text, actors may breathe`);
console.log(`  longest dead stretches    ${deadRuns.slice(0, 4).map((r) => r.toFixed(2) + 's').join(', ') || 'none'}`);
console.log(`  impacts                   ${flashes.length}`);
console.log(`  box stale at impact       ${stale}/${flashes.length} (lines still queued behind it)`);
console.log(`  box mid-type at impact    ${midType}/${flashes.length}`);
console.log(`  explaining line readable  median ${exMed.toFixed(2)}s, worst ${exWorst.toFixed(2)}s after the impact (${explain.length})`);
console.log(`  line say -> readable      median ${latMed.toFixed(2)}s, worst ${latWorst.toFixed(2)}s (${lat.length} lines)`);
console.log(`  deepest text backlog      ${maxQ} lines`);

const bad = [];
if (dead / span > 0.08) bad.push(`${pct(dead / span)} of battle time is a frame with nothing moving (target <=8%)`);
if (stale > flashes.length * 0.34) bad.push(`the box is stale at ${stale}/${flashes.length} impacts (target <=1/3)`);
if (latWorst > 1.6) bad.push(`a line takes ${latWorst.toFixed(2)}s to become readable (target <=1.6s)`);
if (exMed > 0.55) bad.push(`the line explaining an impact lands ${exMed.toFixed(2)}s after it (target <=0.55s)`);
if (errors.length) bad.push(`page error: ${errors[0]}`);

console.log('');
if (bad.length) { for (const b of bad) console.log(`  \u2717 ${b}`); console.log(`\n\u274c ${bad.length} problem(s)`); }
else console.log(`\u2705 the box keeps up with the action`);
process.exit(bad.length ? 1 : 0);
