// FEEL critic pass 2 — per-frame NDC framing of both fighters, HP-bar drain,
// impact profile logging, and screenshots triggered on the impact frame.
import { chromium } from 'playwright';
import { setTimeout as sleep } from 'node:timers/promises';
import { mkdir, writeFile } from 'node:fs/promises';

const PORT = Number(process.env.PORT || 8901);
const OUT = process.env.OUT || 'tests/shots/critic-feelq2';
const SEED = process.env.SEED || 'FQ-1';
const TURNS = Number(process.env.TURNS || 4);
const ARENA = process.env.ARENA || '';
const MAXSHOTS = Number(process.env.MAXSHOTS || 26);
await mkdir(OUT, { recursive: true });

const browser = await chromium.launch({
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--disable-dev-shm-usage', '--no-sandbox']
});
const page = await browser.newPage({ viewport: { width: 900, height: 560 }, deviceScaleFactor: 1 });
const errors = [];
page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()); });

await page.goto(`http://127.0.0.1:${PORT}/?quality=low`, { waitUntil: 'networkidle' });
await page.waitForFunction(() => window.__ARENA?.version, null, { timeout: 90000 });
await page.evaluate(() => window.__ARENA.ready);
await page.evaluate(() => window.__ARENA.audio.setMuted(true));

await page.evaluate(async () => {
  const A = window.__ARENA;
  const THREE = await import('three');
  const T = { frames: [], hits: [], marks: [] };
  window.__T = T; window.__HITSEQ = 0;
  const gt = () => +A.stage.time.toFixed(4);
  const n = (v) => (typeof v === 'number' ? +v.toFixed(4) : v);

  // log every impact profile
  const feel = A.stage.feel;
  const raw = feel.impact.bind(feel);
  feel.impact = (sev, o) => {
    const p = raw(sev, o);
    T.hits.push({ gt: gt(), sev: n(sev), tier: p.tier, crit: !!o.crit, eff: o.eff,
      hitstop: n(feel.hitstopMs), shake: n(feel.shake.amp0), flash: n(feel.flash.a0),
      slowmo: n(feel.timeScale), kb: n(p.kb) });
    window.__HITSEQ++;
    return p;
  };

  const P = new THREE.Vector3();
  const proj = (act, cam, h) => {
    if (!act) return null;
    const base = new THREE.Vector3().setFromMatrixPosition(act.root.matrixWorld);
    const pts = [0.05, 0.5, 0.95].map((fy) => {
      P.copy(base); P.y += h * fy;
      const v = P.clone().project(cam);
      return [n(v.x), n(v.y)];
    });
    const inF = pts.filter(([x, y]) => Math.abs(x) <= 1 && Math.abs(y) <= 1).length;
    const hFrac = n((pts[2][1] - pts[0][1]) / 2);
    return { inF, cx: n(pts[1][0]), cy: n(pts[1][1]), hFrac };
  };

  const tick = () => {
    if (window.__ON) requestAnimationFrame(tick);
    if (!window.__REC) return;
    try {
      const st = A.stage, f = st.feel, cam = st.camera, V = A.app.view, dir = A.app.dir;
      cam.updateMatrixWorld(true);
      const sx = (sel) => {
        const el = document.querySelector(sel);
        if (!el) return null;
        const m = /scaleX\(([\d.]+)\)/.exec(el.style.transform || '');
        return m ? +(+m[1]).toFixed(4) : null;
      };
      T.frames.push({
        gt: gt(), fps: n(A.perf.fps), hitseq: window.__HITSEQ,
        shot: dir?.shot?.id ?? null, fov: n(cam.fov),
        hitstop: n(f.hitstopMs), shake: n(f.shake.amp), flash: n(f.flash.a), ts: n(f.timeScale),
        p0: proj(V.actors?.[0], cam, dir?.act?.[0]?.fullH || 1.9),
        p1: proj(V.actors?.[1], cam, dir?.act?.[1]?.fullH || 1.9),
        hp0: sx('.nameplate.p0 .np-fill'), hp1: sx('.nameplate.p1 .np-fill'),
        gh0: sx('.nameplate.p0 .np-ghost'), gh1: sx('.nameplate.p1 .np-ghost'),
        dmg: document.querySelectorAll('.dmgnum').length,
        txt: (document.querySelector('.textbox .txt')?.textContent || '').slice(0, 40),
        stack: document.querySelectorAll('.textbox .backlog *').length
      });
    } catch (e) { T.frames.push({ gt: gt(), err: String(e.message) }); }
  };
  window.__ON = true; window.__REC = false;
  requestAnimationFrame(tick);
});

const waitPrompt = async (maxMs = 600000) => {
  const t0 = Date.now();
  for (;;) {
    if (Date.now() - t0 > maxMs) return 'stall';
    const s = await page.evaluate(() => ({ w: window.__ARENA.battle.waitingFor(), r: window.__ARENA.router.currentId }));
    if (s.r !== 'battle') return 'over';
    if (s.w === 0) return 'prompt';
    await sleep(90);
  }
};

await page.evaluate(([s, a]) => window.__ARENA.battle.quick(a ? { seed: s, arena: a, mode: 'ai', aiLevel: 'ace', teamSize: 3 } : s), [SEED, ARENA]);
console.log('intro ->', await waitPrompt());
console.log('speed', await page.evaluate(() => ({ view: window.__ARENA.app.view.speed, set: window.__ARENA.app.settings.battleSpeed, cps: window.__ARENA.textbox.cps })));

let shotN = 0;
for (let turn = 0; turn < TURNS; turn++) {
  await page.evaluate(() => { window.__REC = true; window.__T.marks.push({ gt: +window.__ARENA.stage.time.toFixed(4), m: 'prompt' }); });
  const pick = await page.evaluate(() => {
    const A = window.__ARENA, s = A.battle.screen();
    const side = s.battle.sides[0];
    if (s.forcedSwitch) {
      const i = side.party.findIndex((p, j) => !p.fainted && j !== side.activeIndex);
      A.battle.choose(0, { kind: 'switch', toSlot: i < 0 ? 0 : i });
      window.__T.marks.push({ gt: +A.stage.time.toFixed(4), m: 'submit:switch' });
      return { kind: 'switch' };
    }
    const mon = side.party[side.activeIndex];
    let best = null;
    for (const m of mon.moves) {
      const d = A.data.moves.find((x) => x.id === m.id);
      if (!d || m.pp <= 0 || d.category === 'status') continue;
      if (!best || (d.power || 0) > (best.d.power || 0)) best = { m, d };
    }
    if (!best) { const m = mon.moves.find((x) => x.pp > 0) || mon.moves[0]; best = { m, d: A.data.moves.find((x) => x.id === m.id) }; }
    A.battle.choose(0, { kind: 'move', moveId: best.m.id, target: 'foe' });
    window.__T.marks.push({ gt: +A.stage.time.toFixed(4), m: 'submit:' + best.d.name });
    return { kind: 'move', name: best.d.name, power: best.d.power };
  });
  const t0 = Date.now();
  let lastHit = 0, burst = 0;
  for (;;) {
    const s = await page.evaluate(() => ({ w: window.__ARENA.battle.waitingFor(), r: window.__ARENA.router.currentId,
      gt: +window.__ARENA.stage.time.toFixed(3), hs: window.__HITSEQ }));
    // shoot a short burst whenever a new impact has just fired
    if (s.hs > lastHit) { lastHit = s.hs; burst = 3; }
    if (burst > 0 && shotN < MAXSHOTS) {
      burst--; shotN++;
      await page.screenshot({ path: `${OUT}/t${turn + 1}-h${s.hs}-${String(shotN).padStart(3, '0')}-gt${s.gt}.png` });
    }
    if (s.r !== 'battle') { turn = TURNS; break; }
    if (s.w === 0) break;
    if (Date.now() - t0 > 400000) { console.log('STALL'); break; }
  }
  const gtEnd = await page.evaluate(() => +window.__ARENA.stage.time.toFixed(4));
  await page.evaluate(() => window.__T.marks.push({ gt: +window.__ARENA.stage.time.toFixed(4), m: 'control-back' }));
  console.log(`turn ${turn + 1}`, JSON.stringify(pick), 'end gt', gtEnd);
}

const T = await page.evaluate(() => window.__T);
await writeFile(`${OUT}/telemetry.json`, JSON.stringify(T));
console.log('frames', T.frames.length);
console.log('MARKS', JSON.stringify(T.marks));
console.log('HITS', JSON.stringify(T.hits));
console.log('ERRORS', JSON.stringify([...new Set(errors)].slice(0, 8)));
await browser.close();
