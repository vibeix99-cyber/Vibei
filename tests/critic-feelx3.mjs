// FEEL critic harness #3 — framing/occlusion audit + KO capture.
//   node tests/critic-feelx3.mjs frame   # per-frame on-screen framing over a battle (no shots)
//   node tests/critic-feelx3.mjs ko      # bullet-time capture of a devastating hit + faint
import { chromium } from 'playwright';
import { setTimeout as sleep } from 'node:timers/promises';
import { mkdir, writeFile } from 'node:fs/promises';

const PORT = Number(process.env.PORT || 8872);
const MODE = process.argv[2] || 'frame';
const OUT = 'tests/shots/critic-feel-x';
const VW = Number(process.env.VW || 960), VH = Number(process.env.VH || 600);
const SEED = process.env.SEED || 'FEELX-7';
await mkdir(OUT, { recursive: true });

const browser = await chromium.launch({
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--disable-dev-shm-usage', '--no-sandbox']
});
const page = await browser.newPage({ viewport: { width: VW, height: VH }, deviceScaleFactor: 1 });
const errors = [];
page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
await page.goto(`http://127.0.0.1:${PORT}/?quality=${process.env.Q || 'low'}`, { waitUntil: 'networkidle' });
await page.waitForFunction(() => window.__ARENA?.version, null, { timeout: 40000 });
await page.evaluate(() => window.__ARENA.ready);
await page.evaluate(() => window.__ARENA.audio.setMuted(true));

const gt = () => page.evaluate(() => +window.__ARENA.stage.time.toFixed(3));
const shot = async (n) => { const t = await gt(); await page.screenshot({ path: `${OUT}/${n}.png` }); return t; };
const waitPrompt = async (maxMs = 400000) => {
  const t0 = Date.now();
  for (;;) {
    if (Date.now() - t0 > maxMs) return { st: 'stall' };
    const s = await page.evaluate(() => ({ w: window.__ARENA.battle.waitingFor(), r: window.__ARENA.router.currentId,
      f: window.__ARENA.battle.screen?.()?.forcedSwitch ?? null, gt: +window.__ARENA.stage.time.toFixed(3) }));
    if (s.r !== 'battle') return { st: 'over', ...s };
    if (s.w === 0) return { st: 'prompt', ...s };
    await sleep(100);
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

if (MODE === 'frame' || MODE === 'frame2') {
  const INCLUDE_ACTORS = MODE === 'frame2';
  // Sample five points up each fighter every render frame: is it in frame, and
  // is the line from the camera blocked by arena geometry?
  await page.evaluate(async (INCLUDE_ACTORS) => {
    const A = window.__ARENA;
    const THREE = await import('three');
    window.__THREE = THREE;
    const F = []; window.__FRAME = F; window.__ON = true;
    const rc = new THREE.Raycaster();
    const P = new THREE.Vector3(), C = new THREE.Vector3(), D = new THREE.Vector3();
    const tick = () => {
      if (window.__ON) requestAnimationFrame(tick);
      try {
        const V = A.app.view, cam = A.stage.camera, sc = A.stage.scene, dir = A.app.dir;
        cam.updateMatrixWorld(true);
        const row = { gt: +A.stage.time.toFixed(3), shot: dir.shot?.id ?? null, s: [],
          shake: +A.stage.feel.shake.amp.toFixed(4), hp: A.app.plates.map((p) => p.hp) };
        for (let s = 0; s < 2; s++) {
          const act = V.actors[s];
          if (!act) { row.s.push(null); continue; }
          const a = dir.act[s];
          const h = a?.fullH || 1.9, hw = a?.halfW || 0.45;
          const base = new THREE.Vector3().setFromMatrixPosition(act.root.matrixWorld);
          let inFrame = 0, clear = 0, n = 0, headOut = 0; let minx = 9, maxx = -9, miny = 9, maxy = -9;
          for (const [fy, fx] of [[0.15, 0], [0.55, 0], [0.92, 0], [0.55, -0.9], [0.55, 0.9]]) {
            n++;
            P.copy(base); P.y += h * fy; P.x += hw * fx;
            const ndc = P.clone().project(cam);
            const on = Math.abs(ndc.x) <= 1 && ndc.y >= -1 && ndc.y <= 1 && ndc.z < 1;
            if (on) inFrame++;
            if (fy === 0.92 && ndc.y > 1 && ndc.z < 1) headOut = 1;
            minx = Math.min(minx, ndc.x); maxx = Math.max(maxx, ndc.x);
            miny = Math.min(miny, ndc.y); maxy = Math.max(maxy, ndc.y);
            C.copy(cam.position); D.copy(P).sub(C);
            const dist = D.length(); D.normalize();
            rc.set(C, D); rc.near = 0.05; rc.far = dist - 0.4;
            const hits = rc.intersectObject(sc, true).filter((hh) => {
              let o = hh.object;
              while (o) {
                if (o === A.stage.fxGroup) return false;
                if (o === V.actors[s]?.root) return false;
                if (!INCLUDE_ACTORS && (o === V.actors[0]?.root || o === V.actors[1]?.root)) return false;
                o = o.parent;
              }
              const m = hh.object.material;
              return hh.object.visible && m && !(m.transparent && (m.opacity ?? 1) < 0.55);
            });
            if (!hits.length) clear++;
          }
          // screen-space height as a fraction of viewport
          row.s.push({ inFrame, clear, n, headOut,
            cx: +((minx + maxx) / 4 + 0.5).toFixed(3), cy: +(0.5 - (miny + maxy) / 4).toFixed(3),
            hFrac: +((maxy - miny) / 2).toFixed(3) });
        }
        F.push(row);
      } catch (e) { F.push({ err: String(e.message) }); }
    };
    requestAnimationFrame(tick);
  }, INCLUDE_ACTORS);
  let n = 0;
  for (; n < 16; n++) {
    await pickMove();
    const r = await waitPrompt();
    if (r.st !== 'prompt') break;
  }
  const F = await page.evaluate(() => window.__FRAME.slice());
  await writeFile(`${OUT}/framing.json`, JSON.stringify(F));
  const ok = F.filter((f) => !f.err && f.s[0] && f.s[1]);
  console.log('frames', F.length, 'errs', F.filter((f) => f.err).length, F.find((f) => f.err)?.err || '');
  const stat = (i) => {
    const a = ok.map((f) => f.s[i]);
    const fully = a.filter((x) => x.inFrame === 5).length;
    const none = a.filter((x) => x.inFrame === 0).length;
    const blocked = a.filter((x) => x.clear === 0).length;
    const partBlocked = a.filter((x) => x.clear < x.n).length;
    const hs = a.map((x) => x.hFrac).sort((p, q) => p - q);
    const headOut = a.filter((x) => x.headOut).length;
    return { fullyInFrame: (100 * fully / a.length).toFixed(0) + '%', offScreen: (100 * none / a.length).toFixed(0) + '%',
      fullyBlocked: (100 * blocked / a.length).toFixed(0) + '%', anyBlocked: (100 * partBlocked / a.length).toFixed(0) + '%',
      headAboveFrame: (100 * headOut / a.length).toFixed(0) + '%',
      medHeightFracOfScreen: hs[Math.floor(hs.length / 2)] };
  };
  console.log('side0 (player):', JSON.stringify(stat(0)));
  console.log('side1 (foe)   :', JSON.stringify(stat(1)));
  const both = ok.filter((f) => f.s[0].inFrame === 5 && f.s[1].inFrame === 5).length;
  console.log('both fighters fully in frame:', (100 * both / ok.length).toFixed(0) + '%');
  // per-shot breakdown
  const byShot = {};
  for (const f of ok) {
    const k = f.shot || '?'; (byShot[k] = byShot[k] || []).push(f);
  }
  for (const k of Object.keys(byShot)) {
    const a = byShot[k];
    const b0 = a.filter((f) => f.s[0].clear === 0).length, b1 = a.filter((f) => f.s[1].clear === 0).length;
    const o0 = a.filter((f) => f.s[0].inFrame === 0).length, o1 = a.filter((f) => f.s[1].inFrame === 0).length;
    console.log(`  ${k.padEnd(10)} n=${String(a.length).padStart(4)}  offscreen p0=${(100 * o0 / a.length).toFixed(0)}% p1=${(100 * o1 / a.length).toFixed(0)}%  fullyBlocked p0=${(100 * b0 / a.length).toFixed(0)}% p1=${(100 * b1 / a.length).toFixed(0)}%`);
  }
}

if (MODE === 'ko') {
  // Play at normal speed until the foe is nearly dead, then slow down and shoot.
  for (let n = 0; n < 20; n++) {
    const st = await page.evaluate(() => {
      const s = window.__ARENA.battle.screen(); if (!s) return null;
      const foe = s.battle.sides[1]; const m = foe.party[foe.activeIndex];
      return { hp: m.hp, max: m.maxHp, frac: m.hp / m.maxHp, forced: s.forcedSwitch };
    });
    if (st && st.frac < 0.42 && !st.forced) break;
    await pickMove();
    const r = await waitPrompt();
    if (r.st !== 'prompt') break;
  }
  console.log('pre-KO state', JSON.stringify(await page.evaluate(() => {
    const s = window.__ARENA.battle.screen(); const f = s.battle.sides[1].party[s.battle.sides[1].activeIndex];
    return { name: f.nickname, hp: f.hp, max: f.maxHp };
  })));
  await page.evaluate(() => { const F = window.__ARENA.stage.feel; const o = F.update.bind(F); F.update = (r) => o(r * 0.1); });
  const a = await gt();
  console.log('move', JSON.stringify(await pickMove()));
  for (let i = 0; i < 40; i++) {
    const t = await shot(`ko-${String(i).padStart(2, '0')}`);
    const s = await page.evaluate(() => {
      const A = window.__ARENA, F = A.stage.feel;
      return { shot: A.app.dir.shot?.id, hs: +F.hitstopMs.toFixed(0), sh: +F.shake.amp.toFixed(3), fl: +F.flash.a.toFixed(3),
        ts: +F.timeScale.toFixed(2), ch: +F.chroma.toFixed(2), txt: A.app.textbox.$txt?.textContent,
        hp: A.app.plates.map((p) => p.hp), w: A.battle.waitingFor(), r: A.router.currentId };
    });
    console.log(JSON.stringify({ i, dgt: +(t - a).toFixed(3), ...s }));
    if (s.r !== 'battle') break;
    if (s.w === 0 && i > 8) break;
  }
}

console.log('ERRORS', JSON.stringify([...new Set(errors)].slice(0, 8)));
await browser.close();
