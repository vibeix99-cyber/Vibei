// FEEL critic — capture the faint beat in pixels.
// Rigs the foe's active fighter to low HP (test-side state poke only), attacks,
// and screenshots the finisher / ko / entrance sequence.
import { chromium } from 'playwright';
import { setTimeout as sleep } from 'node:timers/promises';
import { mkdir, writeFile } from 'node:fs/promises';

const PORT = Number(process.env.PORT || 8875);
const OUT = process.env.OUT || 'tests/shots/critic-feelz-ko';
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
await page.evaluate(() => {
  const A = window.__ARENA; window.__SFX = [];
  for (const k of ['sfx', 'cry', 'music', 'stinger']) {
    if (typeof A.audio[k] !== 'function') continue;
    const orig = A.audio[k].bind(A.audio);
    A.audio[k] = (...a) => { try { window.__SFX.push({ k, n: typeof a[0] === 'string' ? a[0] : (a[0]?.id || '?'), gt: +A.stage.time.toFixed(3) }); } catch {} return orig(...a); };
  }
});

const probe = () => page.evaluate(() => {
  const A = window.__ARENA, F = A.stage.feel, D = A.app.dir, T = A.app.textbox, V = A.app.view;
  return { gt: +A.stage.time.toFixed(3), shot: D.shot?.id ?? null, hs: +F.hitstopMs.toFixed(0),
    sh: +F.shake.amp.toFixed(3), fl: +F.flash.a.toFixed(3), ts: +F.timeScale.toFixed(2), ch: +F.chroma.toFixed(2),
    txt: T.$txt?.textContent || '', hp: A.app.plates.map((p) => p.hp), vfx: V.vfx?.active?.length ?? -1,
    w: A.battle.waitingFor(), dock: !!document.querySelector('.cmdbtn'), r: A.router.currentId };
});
const waitPrompt = async (maxMs = 420000) => {
  const t0 = Date.now();
  for (;;) {
    if (Date.now() - t0 > maxMs) return { st: 'stall' };
    const s = await page.evaluate(() => ({ w: window.__ARENA.battle.waitingFor(), r: window.__ARENA.router.currentId,
      f: window.__ARENA.battle.screen?.()?.forcedSwitch ?? null, gt: +window.__ARENA.stage.time.toFixed(3) }));
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

await page.evaluate((s) => window.__ARENA.battle.quick(s), SEED);
await waitPrompt();

// diagnostic: what actually sits between the camera and each fighter's chest?
console.log('occl-diag', JSON.stringify(await page.evaluate(async () => {
  const A = window.__ARENA; const THREE = await import('three');
  const V = A.app.view, cam = A.stage.camera, sc = A.stage.scene;
  cam.updateMatrixWorld(true);
  const out = [];
  for (let s = 0; s < 2; s++) {
    const act = V.actors[s]; if (!act) { out.push(null); continue; }
    const p = new THREE.Vector3().setFromMatrixPosition(act.root.matrixWorld); p.y += 1.0;
    const c = cam.position.clone(); const d = p.clone().sub(c); const dist = d.length(); d.normalize();
    const rc = new THREE.Raycaster(c, d, 0.02, dist - 0.4); rc.camera = cam;
    const hits = rc.intersectObject(sc, true).filter((h) => {
      let o = h.object; while (o) { if (o === V.actors[0]?.root || o === V.actors[1]?.root) return false; o = o.parent; }
      return h.object.visible;
    });
    out.push({ s, dist: +dist.toFixed(2), n: hits.length, first: hits.slice(0, 3).map((h) => ({
      name: h.object.name || h.object.type, d: +h.distance.toFixed(2),
      tr: !!h.object.material?.transparent, op: h.object.material?.opacity ?? 1,
      parent: h.object.parent?.name || h.object.parent?.type })) });
  }
  return out;
})));

// rig the foe to 1 HP
const rig = await page.evaluate(() => {
  const b = window.__ARENA.battle.raw?.();
  if (!b) return 'no raw()';
  const side = b.sides[1]; const m = side.party[side.activeIndex];
  m.hp = 1;
  return { name: m.nickname, hp: m.hp, max: m.maxHp };
});
console.log('rigged', JSON.stringify(rig));
console.log('chose', JSON.stringify(await pickMove()));

const a = (await probe()).gt;
const rows = [];
for (let i = 0; i < 42; i++) {
  await page.screenshot({ path: `${OUT}/ko-${String(i).padStart(2, '0')}.png` });
  const s = await probe();
  rows.push({ i, dgt: +(s.gt - a).toFixed(3), ...s });
  console.log(JSON.stringify(rows.at(-1)));
  if (s.r !== 'battle') break;
  if (s.w !== null && i > 10) break;
}
await writeFile(`${OUT}/frames.json`, JSON.stringify(rows, null, 1));
console.log('SFX', JSON.stringify(await page.evaluate(() => window.__SFX.slice())));
console.log('ERRORS', JSON.stringify([...new Set(errors)].slice(0, 6)));
await browser.close();
