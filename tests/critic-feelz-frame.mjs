// FEEL critic — framing / occlusion audit.
// Per render frame: for 5 sample points up each fighter, is the point inside the
// viewport, and is the camera→point ray blocked by non-actor arena geometry?
// Also screenshots the worst offenders so the numbers can be checked against pixels.
import { chromium } from 'playwright';
import { setTimeout as sleep } from 'node:timers/promises';
import { mkdir, writeFile } from 'node:fs/promises';

const PORT = Number(process.env.PORT || 8875);
const OUT = process.env.OUT || 'tests/shots/critic-feelz-frame';
const ARENA = process.env.ARENA || '';
const TURNS = Number(process.env.TURNS || 6);
const SEED = process.env.SEED || 'FEELZ-3';
await mkdir(OUT, { recursive: true });

const browser = await chromium.launch({
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--disable-dev-shm-usage', '--no-sandbox']
});
const page = await browser.newPage({ viewport: { width: 960, height: 600 }, deviceScaleFactor: 1 });
const errors = [];
page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
await page.goto(`http://127.0.0.1:${PORT}/?quality=low`, { waitUntil: 'networkidle' });
await page.waitForFunction(() => window.__ARENA?.version, null, { timeout: 60000 });
await page.evaluate(() => window.__ARENA.ready);
await page.evaluate(() => window.__ARENA.audio.setMuted(true));

const waitPrompt = async (maxMs = 420000) => {
  const t0 = Date.now();
  for (;;) {
    if (Date.now() - t0 > maxMs) return { st: 'stall' };
    const s = await page.evaluate(() => ({ w: window.__ARENA.battle.waitingFor(), r: window.__ARENA.router.currentId,
      gt: +window.__ARENA.stage.time.toFixed(3) }));
    if (s.r !== 'battle') return { st: 'over', ...s };
    if (s.w === 0) return { st: 'prompt', ...s };
    await sleep(120);
  }
};
const pickMove = () => page.evaluate(() => {
  const A = window.__ARENA, s = A.battle.screen();
  if (s.forcedSwitch) {
    const side = s.battle.sides[0];
    const i = side.party.findIndex((p, j) => !p.fainted && j !== side.activeIndex);
    A.battle.choose(0, { kind: 'switch', toSlot: i < 0 ? 0 : i }); return { kind: 'switch' };
  }
  const side = s.battle.sides[0], mon = side.party[side.activeIndex];
  let best = null;
  for (const m of mon.moves) {
    const d = A.data.moves.find((x) => x.id === m.id);
    if (!d || m.pp <= 0 || d.category === 'status') continue;
    if (!best || (d.power || 0) > (best.d.power || 0)) best = { m, d };
  }
  if (!best) { const m = mon.moves.find((x) => x.pp > 0) || mon.moves[0]; best = { m, d: A.data.moves.find((x) => x.id === m.id) }; }
  A.battle.choose(0, { kind: 'move', moveId: best.m.id, target: 'foe' });
  return { kind: 'move', name: best.d.name };
});

await page.evaluate(([s, a]) => window.__ARENA.battle.quick(a ? { seed: s, arena: a } : s), [SEED, ARENA]);
await waitPrompt();
console.log('arena', await page.evaluate(() => window.__ARENA.scene?.arenaId ?? window.__ARENA.stage?.arenaId ?? '?'));

await page.evaluate(async () => {
  const A = window.__ARENA;
  const THREE = await import('three');
  const F = []; window.__FRAME = F; window.__ON = true;
  const rc = new THREE.Raycaster();
  const P = new THREE.Vector3(), C = new THREE.Vector3(), D = new THREE.Vector3();
  const tick = () => {
    if (window.__ON) requestAnimationFrame(tick);
    try {
      const V = A.app.view, cam = A.stage.camera, sc = A.stage.scene, dir = A.app.dir;
      cam.updateMatrixWorld(true);
      const row = { gt: +A.stage.time.toFixed(3), shot: dir.shot?.id ?? null, s: [] };
      for (let s = 0; s < 2; s++) {
        const act = V.actors[s];
        if (!act) { row.s.push(null); continue; }
        const a = dir.act?.[s];
        const h = a?.fullH || 1.9, hw = a?.halfW || 0.45;
        const base = new THREE.Vector3().setFromMatrixPosition(act.root.matrixWorld);
        let inFrame = 0, clear = 0, headOut = 0, botOut = 0;
        let minx = 9, maxx = -9, miny = 9, maxy = -9;
        for (const [fy, fx] of [[0.05, 0], [0.5, 0], [0.95, 0], [0.5, -0.9], [0.5, 0.9]]) {
          P.copy(base); P.y += h * fy; P.x += hw * fx;
          const ndc = P.clone().project(cam);
          const on = Math.abs(ndc.x) <= 1 && ndc.y >= -1 && ndc.y <= 1 && ndc.z < 1;
          if (on) inFrame++;
          if (fy === 0.95 && ndc.y > 1 && ndc.z < 1) headOut = 1;
          if (fy === 0.05 && ndc.y < -1 && ndc.z < 1) botOut = 1;
          minx = Math.min(minx, ndc.x); maxx = Math.max(maxx, ndc.x);
          miny = Math.min(miny, ndc.y); maxy = Math.max(maxy, ndc.y);
          C.copy(cam.position); D.copy(P).sub(C);
          const dist = D.length(); D.normalize();
          rc.set(C, D); rc.camera = cam; rc.near = 0.05; rc.far = Math.max(0.1, dist - 0.4);
          const hits = rc.intersectObject(sc, true).filter((hh) => {
            let o = hh.object;
            while (o) {
              if (o === A.stage.fxGroup) return false;
              if (o === V.actors[0]?.root || o === V.actors[1]?.root) return false;
              o = o.parent;
            }
            const m = hh.object.material;
            return hh.object.visible && m && !(m.transparent && (m.opacity ?? 1) < 0.55);
          });
          if (!hits.length) clear++;
        }
        // fraction of the fighter hidden behind the bottom textbox strip (y_ndc < -0.6)
        row.s.push({ inFrame, clear, headOut, botOut,
          cx: +((minx + maxx) / 4 + 0.5).toFixed(3), cy: +(0.5 - (miny + maxy) / 4).toFixed(3),
          hFrac: +((maxy - miny) / 2).toFixed(3) });
      }
      F.push(row);
    } catch (e) { F.push({ err: String(e.message) }); }
  };
  requestAnimationFrame(tick);
});

let bad = 0;
for (let n = 0; n < TURNS; n++) {
  await pickMove();
  const r = await waitPrompt();
  if (r.st !== 'prompt') break;
  // grab a shot whenever the last frame had a fully-blocked or off-screen fighter
  const last = await page.evaluate(() => {
    const F = window.__FRAME; const w = F.slice(-40).filter((f) => !f.err && f.s[0] && f.s[1]);
    const hit = w.find((f) => f.s.some((x) => x.inFrame === 0 || x.clear === 0));
    return hit || null;
  });
  if (last && bad < 4) { bad++; await page.screenshot({ path: `${OUT}/bad-${bad}.png` }); console.log('bad sample', JSON.stringify(last)); }
}

const F = await page.evaluate(() => window.__FRAME.slice());
await writeFile(`${OUT}/framing.json`, JSON.stringify(F));
const ok = F.filter((f) => !f.err && f.s[0] && f.s[1]);
console.log('frames', F.length, 'errs', F.filter((f) => f.err).length, F.find((f) => f.err)?.err || '');
const pc = (a, b) => (100 * a / b).toFixed(0) + '%';
const stat = (i) => {
  const a = ok.map((f) => f.s[i]);
  const hs = a.map((x) => x.hFrac).sort((p, q) => p - q);
  return { fullyInFrame: pc(a.filter((x) => x.inFrame === 5).length, a.length),
    partlyOffFrame: pc(a.filter((x) => x.inFrame > 0 && x.inFrame < 5).length, a.length),
    offScreen: pc(a.filter((x) => x.inFrame === 0).length, a.length),
    headAboveFrame: pc(a.filter((x) => x.headOut).length, a.length),
    fullyBlocked: pc(a.filter((x) => x.clear === 0).length, a.length),
    anyBlocked: pc(a.filter((x) => x.clear < 5).length, a.length),
    medHeightFracOfScreen: hs[Math.floor(hs.length / 2)] };
};
console.log('side0 player:', JSON.stringify(stat(0)));
console.log('side1 foe   :', JSON.stringify(stat(1)));
console.log('both fully visible & unblocked:',
  pc(ok.filter((f) => f.s.every((x) => x.inFrame === 5 && x.clear === 5)).length, ok.length));
const byShot = {};
for (const f of ok) (byShot[f.shot || '?'] = byShot[f.shot || '?'] || []).push(f);
for (const k of Object.keys(byShot)) {
  const a = byShot[k];
  const f = (i, p) => pc(a.filter(p(i)).length, a.length);
  console.log(`  ${k.padEnd(10)} n=${String(a.length).padStart(4)}` +
    `  offscreen p0=${f(0, (i) => (x) => x.s[i].inFrame === 0)} p1=${f(1, (i) => (x) => x.s[i].inFrame === 0)}` +
    `  partOff p0=${f(0, (i) => (x) => x.s[i].inFrame > 0 && x.s[i].inFrame < 5)} p1=${f(1, (i) => (x) => x.s[i].inFrame > 0 && x.s[i].inFrame < 5)}` +
    `  fullyBlocked p0=${f(0, (i) => (x) => x.s[i].clear === 0)} p1=${f(1, (i) => (x) => x.s[i].clear === 0)}` +
    `  anyBlocked p0=${f(0, (i) => (x) => x.s[i].clear < 5)} p1=${f(1, (i) => (x) => x.s[i].clear < 5)}`);
}
console.log('ERRORS', JSON.stringify([...new Set(errors)].slice(0, 6)));
await browser.close();
