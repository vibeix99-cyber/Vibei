// FEEL critic pass 3 — full battle: turn cadence, KO / switch-in beats, camera
// framing over many turns. Screenshots burst on faint and on lost-defender frames.
import { chromium } from 'playwright';
import { setTimeout as sleep } from 'node:timers/promises';
import { mkdir, writeFile } from 'node:fs/promises';

const PORT = Number(process.env.PORT || 8901);
const OUT = process.env.OUT || 'tests/shots/critic-feelq3';
const SEED = process.env.SEED || 'FQ-9';
const ARENA = process.env.ARENA || '';
const MAXT = Number(process.env.MAXT || 14);
const MAXSHOTS = Number(process.env.MAXSHOTS || 18);
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
  const T = { frames: [], hits: [], marks: [], text: [] };
  window.__T = T; window.__HITSEQ = 0; window.__FAINT = 0; window.__CUE = 0;
  const gt = () => +A.stage.time.toFixed(3);
  const n = (v) => (typeof v === 'number' ? +v.toFixed(3) : v);
  const feel = A.stage.feel, raw = feel.impact.bind(feel);
  feel.impact = (sev, o) => {
    const p = raw(sev, o);
    T.hits.push({ gt: gt(), sev: n(sev), tier: p.tier, crit: !!o.crit, eff: o.eff });
    window.__HITSEQ++; return p;
  };
  const P = new THREE.Vector3();
  const proj = (act, cam, h) => {
    if (!act) return null;
    const b = new THREE.Vector3().setFromMatrixPosition(act.root.matrixWorld);
    const pts = [0.05, 0.5, 0.95].map((fy) => { P.copy(b); P.y += h * fy; const v = P.clone().project(cam); return [v.x, v.y]; });
    return { inF: pts.filter(([x, y]) => Math.abs(x) <= 1 && Math.abs(y) <= 1).length,
      cx: n(pts[1][0]), cy: n(pts[1][1]), hFrac: n((pts[2][1] - pts[0][1]) / 2) };
  };
  let lastTxt = null, faints = 0;
  const tick = () => {
    if (window.__ON) requestAnimationFrame(tick);
    if (!window.__REC) return;
    try {
      const st = A.stage, f = st.feel, cam = st.camera, V = A.app.view, dir = A.app.dir;
      cam.updateMatrixWorld(true);
      const nf = document.querySelectorAll('.nameplate.fainted').length;
      if (nf > faints) { faints = nf; window.__FAINT = gt(); window.__CUE++; }
      if (nf < faints) faints = nf;
      const sx = (s) => { const el = document.querySelector(s); const m = el && /scaleX\(([\d.]+)\)/.exec(el.style.transform || ''); return m ? +(+m[1]).toFixed(3) : null; };
      const txt = document.querySelector('.textbox .txt')?.textContent || '';
      if (txt !== lastTxt) { T.text.push({ gt: gt(), txt }); lastTxt = txt; }
      T.frames.push({ gt: gt(), shot: dir?.shot?.id ?? null, fov: n(cam.fov),
        shake: n(f.shake.amp), flash: n(f.flash.a), ts: n(f.timeScale),
        p0: proj(V.actors?.[0], cam, dir?.act?.[0]?.fullH || 1.9),
        p1: proj(V.actors?.[1], cam, dir?.act?.[1]?.fullH || 1.9),
        hp0: sx('.nameplate.p0 .np-fill'), hp1: sx('.nameplate.p1 .np-fill'),
        dmg: document.querySelectorAll('.dmgnum').length, txt: txt.slice(0, 34) });
    } catch (e) { T.frames.push({ gt: gt(), err: String(e.message) }); }
  };
  window.__ON = true; window.__REC = true;
  requestAnimationFrame(tick);
});

const st = () => page.evaluate(() => ({ w: window.__ARENA.battle.waitingFor(), r: window.__ARENA.router.currentId,
  gt: +window.__ARENA.stage.time.toFixed(3), cue: window.__CUE }));

await page.evaluate(([s, a]) => window.__ARENA.battle.quick(a ? { seed: s, arena: a, mode: 'ai', aiLevel: 'ace', teamSize: 3 } : s), [SEED, ARENA]);
// measure the intro too
const t0Wall = Date.now();
for (;;) { const s = await st(); if (s.w === 0 || s.r !== 'battle') { console.log('intro done gt', s.gt); break; } if (Date.now() - t0Wall > 400000) { console.log('intro STALL'); break; } await sleep(90); }

let shotN = 0, lastCue = 0;
for (let turn = 0; turn < MAXT; turn++) {
  const pick = await page.evaluate(() => {
    const A = window.__ARENA, s = A.battle.screen();
    if (!s) return null;
    const side = s.battle.sides[0];
    if (s.forcedSwitch) {
      const i = side.party.findIndex((p, j) => !p.fainted && j !== side.activeIndex);
      A.battle.choose(0, { kind: 'switch', toSlot: i < 0 ? 0 : i });
      window.__T.marks.push({ gt: +A.stage.time.toFixed(3), m: 'submit:FORCED-SWITCH' });
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
    window.__T.marks.push({ gt: +A.stage.time.toFixed(3), m: 'submit:' + best.d.name });
    return { kind: 'move', name: best.d.name };
  });
  if (!pick) break;
  const tw = Date.now();
  let burst = 0;
  for (;;) {
    const s = await st();
    if (s.cue > lastCue) { lastCue = s.cue; burst = 4; }
    if (burst > 0 && shotN < MAXSHOTS) { burst--; shotN++; await page.screenshot({ path: `${OUT}/ko${lastCue}-${String(shotN).padStart(3, '0')}-gt${s.gt}.png` }); }
    if (s.r !== 'battle') { console.log('battle over gt', s.gt); turn = MAXT; break; }
    if (s.w === 0) break;
    if (Date.now() - tw > 400000) { console.log('STALL'); break; }
  }
  if (turn >= MAXT) break;
  await page.evaluate(() => window.__T.marks.push({ gt: +window.__ARENA.stage.time.toFixed(3), m: 'control-back' }));
}

const T = await page.evaluate(() => window.__T);
await writeFile(`${OUT}/telemetry.json`, JSON.stringify(T));
console.log('frames', T.frames.length, 'hits', T.hits.length);
console.log('MARKS', JSON.stringify(T.marks));
console.log('ERRORS', JSON.stringify([...new Set(errors)].slice(0, 8)));
await browser.close();
