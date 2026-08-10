// CAMERA harness — measures what the critic measured, on demand.
// Not part of the build. Writes only under tests/.
//
//   node tests/cam-check.mjs --port 8741 --scenario rest --out tests/shots/cam3
//
// Scenarios:
//   rest     command-prompt framing, 1.6 game-seconds after the prompt opens,
//            across the height extremes and every arena
//   sweep    a whole battle sampled densely: is anyone ever fully off-screen?
//   switch   switch-outs and switch-ins: does the arriving fighter get shown?
//
// Everything is reported as a projected screen bounding box, exactly the way
// tests/critic-feel.mjs does it, so the numbers are comparable to the critique.

import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';

const args = Object.fromEntries(
  process.argv.slice(2).reduce((acc, a, i, arr) => {
    if (a.startsWith('--')) acc.push([a.slice(2), arr[i + 1]?.startsWith('--') === false ? arr[i + 1] : true]);
    return acc;
  }, [])
);

const PORT = Number(args.port || 8741);
const QUALITY = args.quality || 'high';
const VW = Number(args.vw || 1440);
const VH = Number(args.vh || 900);
const OUT = args.out || 'tests/shots/cam3';
const SCEN = args.scenario || 'rest';
const SHOTS = args.shots !== 'off';
const BASE = `http://127.0.0.1:${PORT}`;

const errors = [];
const rows = [];

async function boot(browser) {
  const page = await browser.newPage({ viewport: { width: VW, height: VH }, deviceScaleFactor: 1 });
  page.on('console', (m) => { if (m.type() === 'error') errors.push(`console: ${m.text()}`); });
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
  await page.goto(`${BASE}/?quality=${QUALITY}`, { waitUntil: 'networkidle' });
  await page.waitForFunction(() => window.__ARENA?.version, null, { timeout: 30000 });
  await page.evaluate(() => window.__ARENA.ready);
  await page.evaluate(() => window.__ARENA.audio.setMuted(true));
  await page.evaluate(() => {
    window.__CF = { frames: 0, game: 0, last: performance.now() };
    const loop = (t) => {
      const raw = Math.min(0.05, (t - window.__CF.last) / 1000);
      window.__CF.last = t; window.__CF.game += raw; window.__CF.frames++;
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  });
  return page;
}

const waitGame = (page, sec) => page.evaluate(async (s) => {
  const target = window.__CF.game + s;
  const hardStop = Date.now() + 180000;
  while (window.__CF.game < target && Date.now() < hardStop) await new Promise((r) => setTimeout(r, 25));
  return +window.__CF.game.toFixed(2);
}, sec);

const waitIdle = (page) => page.evaluate(async () => {
  const A = window.__ARENA;
  const hardStop = Date.now() + 180000;
  while (Date.now() < hardStop) {
    const s = A.battle.screen();
    if (!s) break;
    if (!A.battle.isAnimating() && s.waitingChoice !== null) break;
    if (A.textbox?.busy) A.battle.advanceText();
    await new Promise((r) => setTimeout(r, 25));
  }
  return true;
});

/* The critic's measurement, verbatim in spirit: project the actor's world AABB. */
const MEASURE = () => {
  const A = window.__ARENA;
  const THREE = A.debug.THREE;
  const cam = A.stage.camera;
  const W = innerWidth, H = innerHeight;
  const project = (obj) => {
    if (!obj) return null;
    const box = new THREE.Box3().setFromObject(obj);
    if (!isFinite(box.min.x) || box.isEmpty()) return null;
    let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9, anyFront = false;
    for (let i = 0; i < 8; i++) {
      const v = new THREE.Vector3(
        i & 1 ? box.max.x : box.min.x,
        i & 2 ? box.max.y : box.min.y,
        i & 4 ? box.max.z : box.min.z
      ).project(cam);
      if (v.z < 1) anyFront = true;
      const sx = (v.x * 0.5 + 0.5) * W, sy = (-v.y * 0.5 + 0.5) * H;
      x0 = Math.min(x0, sx); x1 = Math.max(x1, sx); y0 = Math.min(y0, sy); y1 = Math.max(y1, sy);
    }
    const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
    return {
      x0: Math.round(x0), y0: Math.round(y0), x1: Math.round(x1), y1: Math.round(y1),
      wPct: +(((x1 - x0) / W) * 100).toFixed(1), hPct: +(((y1 - y0) / H) * 100).toFixed(1),
      inView: anyFront && x1 > 0 && x0 < W && y1 > 0 && y0 < H,
      centreIn: cx > 0 && cx < W && cy > 0 && cy < H,
      // how much of the box is actually on the glass
      onScreen: +(Math.max(0, Math.min(x1, W) - Math.max(x0, 0)) * Math.max(0, Math.min(y1, H) - Math.max(y0, 0))
        / Math.max(1, (x1 - x0) * (y1 - y0))).toFixed(2)
    };
  };
  const view = A.app.view;
  const dir = view?.dir;
  const near = (i) => {
    const r = view?.actors?.[i]?.root;
    if (!r) return null;
    return +cam.position.distanceTo(r.position).toFixed(2);
  };
  const st = A.battle.state();
  const who = (i) => { const sd = st?.sides?.[i]; const p = sd?.party?.[sd.activeIndex]; return p ? p.speciesId : null; };
  const tb = document.querySelector('.textbox .txt');
  return {
    p0: project(view.actors[0]?.root), p1: project(view.actors[1]?.root),
    d0: near(0), d1: near(1),
    sp0: who(0), sp1: who(1),
    cam: [+cam.position.x.toFixed(2), +cam.position.y.toFixed(2), +cam.position.z.toFixed(2)],
    fov: +cam.fov.toFixed(1),
    diag: dir?.diag ? dir.diag() : null,
    waiting: A.battle.screen()?.waitingChoice ?? null,
    busy: A.battle.isAnimating(),
    text: tb ? tb.textContent.trim() : ''
  };
};

async function sample(page, name, tag) {
  const m = await page.evaluate(MEASURE);
  if (SHOTS) await page.screenshot({ path: `${OUT}/${name}.png` });
  const bad = [];
  if (!m.p0?.inView) bad.push('P0 OFF-SCREEN');
  if (!m.p1?.inView) bad.push('P1 OFF-SCREEN');
  if ((m.p0?.hPct || 0) > 62) bad.push(`P0 ${m.p0?.hPct}% tall`);
  if ((m.p1?.hPct || 0) > 62) bad.push(`P1 ${m.p1?.hPct}% tall`);
  if ((m.p0?.hPct || 0) < 10) bad.push(`P0 tiny ${m.p0?.hPct}%`);
  if ((m.p1?.hPct || 0) < 10) bad.push(`P1 tiny ${m.p1?.hPct}%`);
  if ((m.p0?.onScreen ?? 1) < 0.55) bad.push(`P0 half out (${m.p0?.onScreen})`);
  if ((m.p1?.onScreen ?? 1) < 0.55) bad.push(`P1 half out (${m.p1?.onScreen})`);
  rows.push({ name, tag, bad, ...m });
  const f = (p) => p ? `${String(p.wPct).padStart(5)}x${String(p.hPct).padStart(5)}%${p.inView ? '' : ' OFF'}` : '  --- ';
  console.log(`  ${name.padEnd(26)} ${String(m.diag?.shot).padEnd(9)} ${m.sp0}:${f(m.p0)} d=${m.d0}  ${m.sp1}:${f(m.p1)} d=${m.d1}  fov=${m.fov}` + (bad.length ? `   <<< ${bad.join(', ')}` : ''));
  return m;
}

const team = (ids) => ids;

async function startBattle(page, { p0, p1, arena, seed }) {
  await page.evaluate(({ p0, p1, arena, seed }) => {
    const A = window.__ARENA;
    const build = (ids) => ids.map((id) => A.sim.makeDefaultMember(id, 50));
    A.battle.start({ seed, arena, mode: 'ai', aiLevel: 'ace', p0Team: build(p0), p1Team: build(p1) });
  }, { p0, p1, arena, seed });
}

async function playerAct(page, kind) {
  return page.evaluate(async (kind) => {
    const A = window.__ARENA;
    const deadline = Date.now() + 90000;
    while (Date.now() < deadline) {
      if (A.router.currentId !== 'battle') return 'ended';
      const s = A.battle.screen();
      if (!s) return 'ended';
      if (s.waitingChoice === 0) {
        const st = A.battle.state();
        const side = st.sides[0];
        if (s.forcedSwitch || kind === 'switch') {
          const i = side.party.findIndex((p, i2) => !p.fainted && i2 !== side.activeIndex);
          if (i >= 0) { A.battle.choose(0, { kind: 'switch', toSlot: i }); return 'switched'; }
        }
        A.battle.choose(0, A.sim.chooseAction(A.battle.raw(), 0, 'ace'));
        return 'moved';
      }
      if (A.textbox?.busy) A.battle.advanceText();
      await new Promise((r) => setTimeout(r, 60));
    }
    return 'timeout';
  }, kind || null);
}

/* ------------------------------------------------------------------ */

const PAIRS = [
  ['colosseum', ['luffy', 'nami', 'zoro'], ['ace', 'usopp', 'law']],          // the critic's own
  ['marineford', ['luffy', 'nami', 'zoro'], ['ace', 'usopp', 'law']],
  ['marineford', ['chopper', 'nami'], ['bigmom', 'usopp']],                   // 0.9 vs 8.8
  ['onigashima', ['levi', 'nami'], ['kaido', 'usopp']],                       // 1.6 vs 7.1
  ['skypiea', ['kaido', 'nami'], ['levi', 'usopp']],                          // giant is the PLAYER
  ['baratie', ['bigmom', 'nami'], ['katakuri', 'usopp']],                     // two giants
  ['sunny_deck', ['chopper', 'nami'], ['killua', 'usopp']]                    // two small fighters
];

async function scenRest(page) {
  for (const [arena, p0, p1] of PAIRS) {
    const tagBase = `${p0[0]}-vs-${p1[0]}-${arena}`;
    console.log(`\n▶ ${tagBase}`);
    await startBattle(page, { seed: 'CAM-REST-' + tagBase, arena, p0, p1 });
    for (let t = 0; t < 4; t++) {
      await waitIdle(page);
      await waitGame(page, 1.6);
      await sample(page, `rest-${tagBase}-t${t}`, `command prompt, turn ${t}`);
      const r = await playerAct(page);
      if (r === 'ended' || r === 'timeout') break;
    }
  }
}

async function scenArenaRest(page) {
  for (const arena of ['colosseum', 'marineford', 'sunny_deck', 'onigashima', 'skypiea', 'baratie']) {
    console.log(`\n▶ ${arena}`);
    await startBattle(page, { seed: 'CAM-AR-' + arena, arena, p0: ['luffy', 'nami', 'zoro'], p1: ['ace', 'usopp', 'law'] });
    for (let t = 0; t < 3; t++) {
      await waitIdle(page);
      await waitGame(page, 1.6);
      await sample(page, `ar-${arena}-t${t}`, `${arena} command prompt, turn ${t}`);
      const r = await playerAct(page);
      if (r === 'ended' || r === 'timeout') break;
    }
  }
}

async function scenSweep(page) {
  const [arena, p0, p1] = ['colosseum', ['luffy', 'nami', 'zoro'], ['ace', 'usopp', 'law']];
  await startBattle(page, { seed: 'CAM-SWEEP', arena, p0, p1 });
  await page.evaluate(() => window.__ARENA.battle.setSpeed(0.5));
  let n = 0;
  for (let t = 0; t < 12 && n < 70; t++) {
    const r = await playerAct(page);
    if (r === 'ended' || r === 'timeout') break;
    for (let k = 0; k < 8 && n < 70; k++) {
      const s = await sample(page, `sw-t${String(t).padStart(2, '0')}-${k}`, `turn ${t} beat ${k}`);
      n++;
      if (s.waiting === 0 && !s.busy) break;
    }
  }
}

async function scenSwitch(page) {
  await startBattle(page, { seed: 'CAM-SWITCH', arena: 'marineford', p0: ['luffy', 'nami', 'chopper'], p1: ['usopp', 'brook', 'franky'] });
  await page.evaluate(() => window.__ARENA.battle.setSpeed(0.4));
  await waitIdle(page); await waitGame(page, 1.2);
  await sample(page, 'sx-00-rest', 'resting before the switch');
  await page.evaluate(() => window.__ARENA.battle.choose(0, { kind: 'switch', toSlot: 1 }));
  for (let k = 0; k < 9; k++) {
    const s = await sample(page, `sx-01-switch-${k}`, 'switch out / in');
    if (s.waiting !== null && !s.busy && k > 4) break;
  }
  await waitIdle(page); await waitGame(page, 1.6);
  await sample(page, 'sx-02-after', 'resting after the switch');
  // and a giant arriving
  await startBattle(page, { seed: 'CAM-SWITCH2', arena: 'onigashima', p0: ['levi', 'kaido', 'chopper'], p1: ['usopp', 'brook'] });
  await page.evaluate(() => window.__ARENA.battle.setSpeed(0.4));
  await waitIdle(page); await waitGame(page, 1.2);
  await sample(page, 'sx-10-rest', 'resting before the giant arrives');
  await page.evaluate(() => window.__ARENA.battle.choose(0, { kind: 'switch', toSlot: 1 }));
  for (let k = 0; k < 9; k++) {
    const s = await sample(page, `sx-11-switch-${k}`, 'kaido switching in');
    if (s.waiting !== null && !s.busy && k > 4) break;
  }
  await waitIdle(page); await waitGame(page, 1.6);
  await sample(page, 'sx-12-after', 'resting with kaido out');
}

async function scenOpening(page) {
  for (const arena of ['colosseum', 'onigashima']) {
    await startBattle(page, { seed: 'CAM-OPEN-' + arena, arena, p0: ['luffy', 'nami'], p1: ['kaido', 'usopp'] });
    let last = 0;
    for (const at of [0.4, 1.2, 2.2, 3.4, 5.0]) {
      await waitGame(page, at - last); last = at;
      await sample(page, `op-${arena}-${String(at).replace('.', '_')}s`, `${arena} @${at}s`);
    }
  }
}

const SCENARIOS = { rest: scenRest, arenas: scenArenaRest, sweep: scenSweep, switch: scenSwitch, opening: scenOpening };

async function main() {
  await mkdir(OUT, { recursive: true });
  const browser = await chromium.launch({
    executablePath: process.env.PW_CHROMIUM || undefined,
    args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--disable-dev-shm-usage', '--no-sandbox']
  });
  const page = await boot(browser);
  const list = SCEN === 'all' ? Object.keys(SCENARIOS) : SCEN.split(',');
  for (const s of list) {
    const fn = SCENARIOS[s];
    if (!fn) throw new Error('unknown scenario ' + s);
    console.log(`\n════ scenario ${s} @ ${VW}x${VH} quality=${QUALITY}`);
    await fn(page);
  }
  await writeFile(`${OUT}/cam-${list.join('-')}.json`, JSON.stringify({ rows, errors }, null, 2));
  const bad = rows.filter((r) => r.bad.length);
  console.log(`\n──── ${bad.length}/${rows.length} sampled frames have a framing problem`);
  bad.forEach((r) => console.log(`   ${r.name}: ${r.bad.join(', ')}`));
  console.log(`${errors.length} console/page errors`);
  [...new Set(errors)].slice(0, 10).forEach((e) => console.log('  - ' + e));
  await browser.close();
}

main().catch((e) => { console.error(e); process.exit(1); });
