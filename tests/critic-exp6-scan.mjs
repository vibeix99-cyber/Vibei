// Critic run 4: how general is a blocked resting shot? Several seeds, several
// prompts each, camera settled, counting only solid Mesh occluders (Points and
// LineSegments are weather particles and do not hide anything).
//   node tests/critic-exp6-scan.mjs SEED1 SEED2 ...
import { chromium } from 'playwright';
import { setTimeout as sleep } from 'node:timers/promises';
import { mkdir } from 'node:fs/promises';

const PORT = 8811, OUT = 'tests/shots/exp6';
const SEEDS = process.argv.slice(2).length ? process.argv.slice(2) : ['EXP-1', 'EXP-2', 'EXP-3', 'EXP-4'];
await mkdir(OUT, { recursive: true });
const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--disable-dev-shm-usage', '--no-sandbox'] });
const page = await browser.newPage({ viewport: { width: 1000, height: 640 } });
await page.goto(`http://127.0.0.1:${PORT}/?quality=low`, { waitUntil: 'networkidle' });
await page.waitForFunction(() => window.__ARENA?.version, null, { timeout: 30000 });
await page.evaluate(() => window.__ARENA.ready);
await page.evaluate(() => window.__ARENA.audio.setMuted(true));

const st = () => page.evaluate(() => {
  const A = window.__ARENA, T = A.app.textbox;
  return { rid: A.router.currentId, wait: A.battle.waitingFor?.() ?? null, wfi: !!T.waitingForInput,
    menu: !!document.querySelector('.cmdbtn.fight'), fs: !!A.battle.screen?.()?.forcedSwitch,
    q: A.app.view.queue.length, blend: +(A.app.dir.blend ?? 1).toFixed(2), gt: +A.stage.time.toFixed(2) };
});
const look = () => page.evaluate(() => {
  const A = window.__ARENA, THREE = A.debug.THREE, cam = A.stage.camera;
  cam.updateMatrixWorld(true);
  const rc = new THREE.Raycaster();
  const out = A.app.view.actors.map((a) => {
    if (!a) return null;
    const box = new THREE.Box3().setFromObject(a.root);
    const c = box.getCenter(new THREE.Vector3());
    let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
    for (let i = 0; i < 8; i++) {
      const v = new THREE.Vector3(i & 1 ? box.max.x : box.min.x, i & 2 ? box.max.y : box.min.y, i & 4 ? box.max.z : box.min.z).project(cam);
      x0 = Math.min(x0, v.x); x1 = Math.max(x1, v.x); y0 = Math.min(y0, v.y); y1 = Math.max(y1, v.y);
    }
    // sample a 3x3 grid of rays over the actor box, count how many reach it
    let clear = 0, tot = 0, first = null;
    for (let ix = 0; ix < 3; ix++) for (let iy = 0; iy < 3; iy++) {
      const p = new THREE.Vector3(box.min.x + (box.max.x - box.min.x) * (ix + 0.5) / 3,
        box.min.y + (box.max.y - box.min.y) * (iy + 0.5) / 3,
        (box.min.z + box.max.z) / 2);
      const dir = p.clone().sub(cam.position); const dist = dir.length(); dir.normalize();
      rc.set(cam.position, dir); rc.far = dist - 0.15;
      const hit = rc.intersectObject(A.stage.scene, true).find((h) => {
        if (h.object.type !== 'Mesh') return false;           // ignore Points/LineSegments (weather)
        let o = h.object; while (o) { if (o === a.root) return false; o = o.parent; }
        return h.object.visible && h.object.material && h.object.material.opacity !== 0;
      });
      tot++; if (!hit) clear++; else if (!first) first = `${hit.object.name || 'Mesh'}@${hit.distance.toFixed(1)}/${dist.toFixed(1)}`;
    }
    return { h: +((y1 - y0) * 50).toFixed(1), cx: +(((x0 + x1) / 2) * 50 + 50).toFixed(0), cy: +((1 - (y0 + y1) / 2) * 50).toFixed(0),
      on: x1 > -1 && x0 < 1 && y1 > -1 && y0 < 1, clear: `${clear}/${tot}`, blocked: clear === 0, first };
  });
  return { actors: out, shot: A.app.dir.shot?.id, blend: +(A.app.dir.blend ?? 1).toFixed(2),
    cam: [+cam.position.x.toFixed(1), +cam.position.y.toFixed(1), +cam.position.z.toFixed(1)],
    arena: A.app.view.arenaId ?? A.stage.arenaId ?? A.app.view.state?.arena ?? '?' };
});

for (const seed of SEEDS) {
  await page.evaluate((s) => window.__ARENA.battle.quick(s), seed);
  await sleep(800);
  let shotSaved = false;
  for (let t = 0; t < 7; t++) {
    let ok = false;
    for (let i = 0; i < 300; i++) {
      const s = await st();
      if (s.rid !== 'battle') break;
      if (s.fs) { await page.evaluate(() => { const A = window.__ARENA, side = A.battle.screen().battle.sides[0]; const j = side.party.findIndex((p, k) => !p.fainted && k !== side.activeIndex); A.battle.choose(0, { kind: 'switch', toSlot: j < 0 ? 0 : j }); }); await sleep(300); continue; }
      if (s.wait === 0 && s.menu) { ok = true; break; }
      if (s.wfi) await page.keyboard.press('Space');
      await sleep(80);
    }
    if (!ok) { console.log(`${seed} t${t}: battle over/stalled`); break; }
    for (let i = 0; i < 50; i++) { const q = await st(); if (q.blend >= 1 && q.q === 0) break; await sleep(150); }
    await sleep(600);
    const m = await look();
    const bad = m.actors.filter((a) => a && (!a.on || a.blocked)).length;
    console.log(`${seed} t${t} shot=${m.shot} blend=${m.blend} cam=[${m.cam}] ` +
      m.actors.map((a, i) => (a ? `p${i} h=${a.h}%@(${a.cx},${a.cy}) clear=${a.clear}${a.on ? '' : ' OFF'}${a.first ? ' by ' + a.first : ''}` : `p${i} —`)).join('  ') + (bad ? '   <<< HIDDEN' : ''));
    if (bad && !shotSaved) { await page.screenshot({ path: `${OUT}/${seed}-t${t}-hidden.png` }); shotSaved = true; }
    if (t === 0) await page.screenshot({ path: `${OUT}/${seed}-t0.png` });
    // play the turn through the API so this stays cheap
    await page.evaluate(() => {
      const A = window.__ARENA, side = A.battle.screen().battle.sides[0];
      const m = side.party[side.activeIndex];
      const i = (m.moves || []).findIndex((x) => (x.pp ?? 1) > 0);
      A.battle.choose(0, { kind: 'move', slot: i < 0 ? 0 : i });
    });
    await sleep(300);
  }
}
await browser.close();
