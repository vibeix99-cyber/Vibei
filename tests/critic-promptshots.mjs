// At every command prompt of a whole battle, wait for the camera to settle, then
// screenshot and test whether the two fighters are actually visible (raycast occlusion).
//   node tests/critic-promptshots.mjs <seed>
import { chromium } from 'playwright';
import { setTimeout as sleep } from 'node:timers/promises';
import { mkdir } from 'node:fs/promises';

const PORT = 8811, SEED = process.argv[2] || 'EXP-1', OUT = 'tests/shots/prompts';
await mkdir(OUT, { recursive: true });
const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--disable-dev-shm-usage', '--no-sandbox'] });
const page = await browser.newPage({ viewport: { width: 1000, height: 640 } });
const errors = [];
page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
await page.goto(`http://127.0.0.1:${PORT}/?quality=low`, { waitUntil: 'networkidle' });
await page.waitForFunction(() => window.__ARENA?.version, null, { timeout: 30000 });
await page.evaluate(() => window.__ARENA.ready);
await page.evaluate(() => window.__ARENA.audio.setMuted(true));

const st = () => page.evaluate(() => {
  const A = window.__ARENA, T = A.app.textbox;
  return { gt: +A.stage.time.toFixed(2), wait: A.battle.waitingFor?.() ?? null, wfi: !!T.waitingForInput,
    txt: T.$txt?.textContent || '', menu: !!document.querySelector('.cmdbtn.fight'), rid: A.router.currentId,
    fs: !!window.__ARENA.battle.screen?.()?.forcedSwitch, q: A.app.view.queue.length, blend: +(A.app.dir.blend ?? 1).toFixed(2) };
});
const look = () => page.evaluate(() => {
  const A = window.__ARENA, THREE = A.debug.THREE, cam = A.stage.camera;
  cam.updateMatrixWorld(true);
  const rc = new THREE.Raycaster();
  const out = [];
  for (const a of A.app.view.actors) {
    if (!a) { out.push(null); continue; }
    const box = new THREE.Box3().setFromObject(a.root);
    const c = box.getCenter(new THREE.Vector3());
    let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
    for (let i = 0; i < 8; i++) {
      const v = new THREE.Vector3(i & 1 ? box.max.x : box.min.x, i & 2 ? box.max.y : box.min.y, i & 4 ? box.max.z : box.min.z).project(cam);
      x0 = Math.min(x0, v.x); x1 = Math.max(x1, v.x); y0 = Math.min(y0, v.y); y1 = Math.max(y1, v.y);
    }
    const dir = c.clone().sub(cam.position); const dist = dir.length(); dir.normalize();
    rc.set(cam.position, dir); rc.far = dist - 0.05;
    const hits = rc.intersectObject(A.stage.scene, true).filter((h) => {
      let o = h.object, own = false;
      while (o) { if (o === a.root) own = true; o = o.parent; }
      return !own && h.object.visible && h.object.material && h.object.material.opacity !== 0;
    });
    out.push({ w: +((x1 - x0) * 50).toFixed(1), h: +((y1 - y0) * 50).toFixed(1),
      cx: +(((x0 + x1) / 2) * 50 + 50).toFixed(0), cy: +((1 - (y0 + y1) / 2) * 50).toFixed(0),
      on: x1 > -1 && x0 < 1 && y1 > -1 && y0 < 1,
      blocked: hits.length ? `${hits[0].object.name || hits[0].object.type}@${hits[0].distance.toFixed(1)}/${dist.toFixed(1)}` : null });
  }
  return { actors: out, shot: A.app.dir.shot?.id, blend: +(A.app.dir.blend ?? 1).toFixed(2), turn: A.app.view.state?.turn };
});

await page.evaluate((s) => window.__ARENA.battle.quick(s), SEED);
let n = 0, occluded = 0;
for (let t = 0; t < 40 && n < 12; t++) {
  // get to a command prompt, clearing text like a player
  let s = null, ok = false;
  for (let i = 0; i < 500; i++) {
    s = await st();
    if (s.rid !== 'battle') break;
    if (s.wait === 0 && s.menu && !s.fs) { ok = true; break; }
    if (s.fs) {
      await page.evaluate(() => {
        const c = [...document.querySelectorAll('.partygrid .partycard, .partycard, .switchcard')].find((x) => !x.classList.contains('fainted') && !x.disabled);
        if (c) c.click();
        else { const A = window.__ARENA, side = A.battle.screen().battle.sides[0]; const i = side.party.findIndex((p, j) => !p.fainted && j !== side.activeIndex); A.battle.choose(0, { kind: 'switch', toSlot: i < 0 ? 0 : i }); }
      });
      await sleep(400);
    }
    if (s.wfi) await page.keyboard.press('Space');
    await sleep(130);
  }
  if (!ok) { console.log('end at', JSON.stringify(s)); break; }
  // camera settle
  for (let i = 0; i < 60; i++) { const q = await st(); if (q.blend >= 1 && q.q === 0) break; await sleep(200); }
  await sleep(900);
  const m = await look();
  const bad = m.actors.filter((a) => a && (!a.on || a.blocked)).length;
  if (bad) occluded++;
  await page.screenshot({ path: `${OUT}/p${String(n).padStart(2, '0')}.png` });
  console.log(`p${String(n).padStart(2, '0')} turn=${m.turn} shot=${m.shot} blend=${m.blend} ` +
    m.actors.map((a, i) => (a ? `p${i} ${a.w}x${a.h}%@(${a.cx},${a.cy})${a.on ? '' : ' OFFSCREEN'}${a.blocked ? ' BLOCKED:' + a.blocked : ''}` : `p${i} —`)).join('  '));
  n++;
  // play the turn
  await page.click('.cmdbtn.fight').catch(() => {});
  await sleep(450);
  const cards = await page.$$('.movegrid .movecard');
  if (!cards.length) { console.log('no move cards'); break; }
  await cards[Math.min(1, cards.length - 1)].click();
  await sleep(300);
  await page.keyboard.press('Space');
}
console.log(`prompts=${n} withHiddenFighter=${occluded}`);
console.log('errors:', errors.length ? errors.slice(0, 3) : 'none');
await browser.close();
