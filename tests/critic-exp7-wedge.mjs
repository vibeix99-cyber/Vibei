// Critic run 5: once the resting shot wedges behind arena geometry, does the
// ACTION still read, or is the whole turn played behind a wall?
//   node tests/critic-exp7-wedge.mjs <seed>
import { chromium } from 'playwright';
import { setTimeout as sleep } from 'node:timers/promises';
import { mkdir } from 'node:fs/promises';

const PORT = 8811, SEED = process.argv[2] || 'EXP-1', OUT = 'tests/shots/exp7';
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
    q: A.app.view.queue.length, blend: +(A.app.dir.blend ?? 1).toFixed(2), shot: A.app.dir.shot?.id,
    txt: T.$txt?.textContent || '', cam: A.stage.camera.position.length().toFixed(1) };
});
const clear = () => page.evaluate(() => {                       // fraction of rays reaching each fighter
  const A = window.__ARENA, THREE = A.debug.THREE, cam = A.stage.camera;
  cam.updateMatrixWorld(true);
  const rc = new THREE.Raycaster();
  return A.app.view.actors.map((a) => {
    if (!a) return null;
    const box = new THREE.Box3().setFromObject(a.root);
    let ok = 0, n = 0;
    for (let ix = 0; ix < 3; ix++) for (let iy = 0; iy < 3; iy++) {
      const p = new THREE.Vector3(box.min.x + (box.max.x - box.min.x) * (ix + 0.5) / 3, box.min.y + (box.max.y - box.min.y) * (iy + 0.5) / 3, (box.min.z + box.max.z) / 2);
      const dir = p.clone().sub(cam.position); const dist = dir.length(); dir.normalize();
      rc.set(cam.position, dir); rc.far = dist - 0.15;
      const hit = rc.intersectObject(A.stage.scene, true).find((h) => {
        if (h.object.type !== 'Mesh') return false;
        let o = h.object; while (o) { if (o === a.root) return false; o = o.parent; }
        return h.object.visible && h.object.material && h.object.material.opacity !== 0;
      });
      n++; if (!hit) ok++;
    }
    return `${ok}/${n}`;
  });
});

await page.evaluate((s) => window.__ARENA.battle.quick(s), SEED);
let wedged = false;
for (let t = 0; t < 9 && !wedged; t++) {
  for (let i = 0; i < 300; i++) {
    const s = await st();
    if (s.rid !== 'battle') { console.log('battle over'); t = 99; break; }
    if (s.fs) { await page.evaluate(() => { const A = window.__ARENA, side = A.battle.screen().battle.sides[0]; const j = side.party.findIndex((p, k) => !p.fainted && k !== side.activeIndex); A.battle.choose(0, { kind: 'switch', toSlot: j < 0 ? 0 : j }); }); await sleep(300); continue; }
    if (s.wait === 0 && s.menu) break;
    if (s.wfi) await page.keyboard.press('Space');
    await sleep(80);
  }
  if (t === 99) break;
  for (let i = 0; i < 30; i++) { const q = await st(); if (q.blend >= 1 && q.q === 0) break; await sleep(150); }
  await sleep(500);
  const c = await clear();
  console.log(`t${t} prompt clear=${JSON.stringify(c)} ${JSON.stringify(await st())}`);
  wedged = c.every((x) => x === '0/9');
  if (!wedged) {
    await page.evaluate(() => { const A = window.__ARENA, side = A.battle.screen().battle.sides[0], m = side.party[side.activeIndex]; const i = (m.moves || []).findIndex((x) => (x.pp ?? 1) > 0); A.battle.choose(0, { kind: 'move', slot: i < 0 ? 0 : i }); });
    await sleep(300);
  }
}
if (!wedged) { console.log('never wedged'); await browser.close(); process.exit(0); }
await page.screenshot({ path: `${OUT}/w-prompt.png` });
// play one turn from the wedged prompt, sampling the action
await page.evaluate(() => { const A = window.__ARENA, side = A.battle.screen().battle.sides[0], m = side.party[side.activeIndex]; const i = (m.moves || []).findIndex((x) => (x.pp ?? 1) > 0); A.battle.choose(0, { kind: 'move', slot: i < 0 ? 0 : i }); });
for (let i = 0; i < 12; i++) {
  const s = await st();
  const c = await clear();
  await page.screenshot({ path: `${OUT}/w-act${String(i).padStart(2, '0')}.png` });
  console.log(`  act${i} shot=${s.shot} blend=${s.blend} clear=${JSON.stringify(c)} txt=${JSON.stringify(s.txt.slice(0, 40))}`);
  if (s.wfi) await page.keyboard.press('Space');
  if (s.rid !== 'battle') break;
  await sleep(60);
}
await browser.close();
