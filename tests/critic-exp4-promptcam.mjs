// Critic run 2: separates "at the prompt" from "camera settled", on the game clock.
// Also measures move-click -> turn-start latency, and whether the move detail card
// leaks into the action.  node tests/critic-exp4-promptcam.mjs <seed> <turns>
import { chromium } from 'playwright';
import { setTimeout as sleep } from 'node:timers/promises';
import { mkdir, writeFile } from 'node:fs/promises';

const PORT = 8811, SEED = process.argv[2] || 'EXP-1', TURNS = Number(process.argv[3] || 6);
const OUT = 'tests/shots/exp4';
await mkdir(OUT, { recursive: true });

const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--disable-dev-shm-usage', '--no-sandbox'] });
const page = await browser.newPage({ viewport: { width: 1000, height: 640 } });
const errors = [];
page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
await page.goto(`http://127.0.0.1:${PORT}/?quality=low`, { waitUntil: 'networkidle' });
await page.waitForFunction(() => window.__ARENA?.version, null, { timeout: 30000 });
await page.evaluate(() => window.__ARENA.ready);
await page.evaluate(() => window.__ARENA.audio.setMuted(true));

// ---- in-page per-frame recorder ------------------------------------------
await page.evaluate(() => {
  const A = window.__ARENA, THREE = A.debug.THREE;
  window.__F = []; window.__ON = true; window.__M = [];
  const framing = () => {
    const cam = A.stage.camera; cam.updateMatrixWorld(true);
    return A.app.view.actors.map((a) => {
      if (!a) return null;
      const box = new THREE.Box3().setFromObject(a.root);
      let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
      for (let i = 0; i < 8; i++) {
        const v = new THREE.Vector3(i & 1 ? box.max.x : box.min.x, i & 2 ? box.max.y : box.min.y, i & 4 ? box.max.z : box.min.z).project(cam);
        x0 = Math.min(x0, v.x); x1 = Math.max(x1, v.x); y0 = Math.min(y0, v.y); y1 = Math.max(y1, v.y);
      }
      // pixel-space box in a 1000x640 viewport
      const px0 = (x0 * 0.5 + 0.5) * 1000, px1 = (x1 * 0.5 + 0.5) * 1000;
      const py0 = (0.5 - y1 * 0.5) * 640, py1 = (0.5 - y0 * 0.5) * 640;
      const vis = Math.max(0, Math.min(px1, 1000) - Math.max(px0, 0)) * Math.max(0, Math.min(py1, 640) - Math.max(py0, 0));
      const full = Math.max(1, (px1 - px0) * (py1 - py0));
      // UI chrome: message box + command menu occupy the bottom 130px
      const underUI = py1 > 512 ? Math.max(0, Math.min(px1, 1000) - Math.max(px0, 0)) * (Math.min(py1, 640) - 512) : 0;
      return { x: +((px0 + px1) / 2).toFixed(0), y: +((py0 + py1) / 2).toFixed(0),
        h: +(py1 - py0).toFixed(0), w: +(px1 - px0).toFixed(0),
        onFrac: +(vis / full).toFixed(3), uiFrac: +(underUI / full).toFixed(3) };
    });
  };
  const tick = () => {
    if (window.__ON) requestAnimationFrame(tick);
    const T = A.app.textbox, D = A.app.dir, cam = A.stage.camera;
    const btn = document.querySelector('.cmdbtn.fight');
    const detail = document.querySelector('.movedetail, .movecard-detail, .moveinfo, .cardinfo');
    window.__F.push({
      gt: +A.stage.time.toFixed(3),
      menu: !!btn && btn.offsetParent !== null,
      grid: !!document.querySelector('.movegrid .movecard'),
      det: detail ? (detail.offsetParent !== null) : null,
      wait: A.battle.waitingFor?.() ?? null,
      q: A.app.view.queue.length, vfx: A.app.view.vfx.active.length,
      cur: T.current ? (T.current.text || '') : '', wfi: !!T.waitingForInput,
      shot: D.shot?.id ?? null, blend: +(D.blend ?? 1).toFixed(3),
      cam: [+cam.position.x.toFixed(3), +cam.position.y.toFixed(3), +cam.position.z.toFixed(3)], fov: +cam.fov.toFixed(2),
      fr: framing()
    });
  };
  requestAnimationFrame(tick);
  window.__mark = (ev, extra) => window.__F.push({ mark: ev, gt: +A.stage.time.toFixed(3), ...(extra || {}) });
});

const st = () => page.evaluate(() => {
  const A = window.__ARENA, T = A.app.textbox, b = document.querySelector('.cmdbtn.fight');
  return { gt: +A.stage.time.toFixed(2), rid: A.router.currentId, wait: A.battle.waitingFor?.() ?? null,
    wfi: !!T.waitingForInput, menu: !!b, fs: !!A.battle.screen?.()?.forcedSwitch, q: A.app.view.queue.length,
    blend: +(A.app.dir.blend ?? 1).toFixed(2), txt: T.$txt?.textContent || '' };
});

await page.evaluate((s) => window.__ARENA.battle.quick(s), SEED);
let turn = 0, shots = 0;
const snap = async (t) => { await page.screenshot({ path: `${OUT}/${t}.png` }); shots++; };

for (let t = 0; t < TURNS; t++) {
  // reach a command prompt like a player would
  let ok = false, s = null;
  for (let i = 0; i < 400; i++) {
    s = await st();
    if (s.rid !== 'battle') break;
    if (s.fs) {
      await page.evaluate(() => {
        const c = [...document.querySelectorAll('.partygrid .partycard, .partycard, .switchcard')].find((x) => !x.classList.contains('fainted') && !x.disabled);
        if (c) c.click();
        else { const A = window.__ARENA, side = A.battle.screen().battle.sides[0]; const j = side.party.findIndex((p, k) => !p.fainted && k !== side.activeIndex); A.battle.choose(0, { kind: 'switch', toSlot: j < 0 ? 0 : j }); }
      });
      await sleep(400); continue;
    }
    if (s.wait === 0 && s.menu) { ok = true; break; }
    if (s.wfi) await page.keyboard.press('Space');   // player taps through
    await sleep(90);
  }
  if (!ok) { console.log(`turn ${t}: no prompt (${JSON.stringify(s)})`); break; }
  await page.evaluate((tt) => window.__mark('prompt', { t: tt }), t);
  await snap(`t${t}-a-atprompt`);                     // as soon as we noticed
  // let the camera settle fully, then shoot again
  for (let i = 0; i < 40; i++) { const q = await st(); if (q.blend >= 1 && q.q === 0) break; await sleep(150); }
  await sleep(1200);
  await page.evaluate((tt) => window.__mark('settled', { t: tt }), t);
  await snap(`t${t}-b-settled`);

  // choose a move; keep the mouse parked (turns 0,1) or move it away (turn >=2)
  await page.click('.cmdbtn.fight');
  await sleep(400);
  const cards = await page.$$('.movegrid .movecard');
  if (!cards.length) { console.log('no move cards'); break; }
  await page.evaluate((tt) => window.__mark('movegrid', { t: tt }), t);
  await cards[Math.min(1, cards.length - 1)].click();
  await page.evaluate((tt) => window.__mark('click', { t: tt }), t);
  if (t >= 2) await page.mouse.move(500, 300);
  await snap(`t${t}-c-justafter`);
  turn++;
  // play the turn out, tapping like a player
  for (let i = 0; i < 400; i++) {
    const q = await st();
    if (q.rid !== 'battle') break;
    if (q.wait === 0 && q.menu) break;
    if (q.fs) break;
    if (q.wfi) await page.keyboard.press('Space');
    await sleep(90);
  }
  await page.evaluate((tt) => window.__mark('resolved', { t: tt }), t);
}

await page.evaluate(() => { window.__ON = false; });
const dump = await page.evaluate(() => ({ f: window.__F, log: window.__ARENA.battle.log(), fps: window.__ARENA.perf.fps }));
await writeFile(`${OUT}/frames-${SEED}.json`, JSON.stringify(dump));
console.log(`turns=${turn} frames=${dump.f.length} shots=${shots} fps=${dump.fps}`);
console.log('errors:', errors.length ? errors.slice(0, 4) : 'none');
await browser.close();
