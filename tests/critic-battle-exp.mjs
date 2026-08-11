// Critic harness: THE BATTLE, AS EXPERIENCED (independent run).
// Server must already be running on 8811.
//   node tests/critic-battle-exp.mjs <seed> <turns>
import { chromium } from 'playwright';
import { setTimeout as sleep } from 'node:timers/promises';
import { mkdir, writeFile } from 'node:fs/promises';

const PORT = 8811;
const SEED = process.argv[2] || 'EXP-1';
const TURNS = Number(process.argv[3] || 4);
const OUT = 'tests/shots/exp';
await mkdir(OUT, { recursive: true });

const browser = await chromium.launch({
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--disable-dev-shm-usage', '--no-sandbox']
});
const page = await browser.newPage({ viewport: { width: 1000, height: 640 }, deviceScaleFactor: 1 });
const errors = [];
page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
await page.goto(`http://127.0.0.1:${PORT}/?quality=low`, { waitUntil: 'networkidle' });
await page.waitForFunction(() => window.__ARENA?.version, null, { timeout: 30000 });
await page.evaluate(() => window.__ARENA.ready);
await page.evaluate(() => window.__ARENA.audio.setMuted(true));

const INSTALL = () => {
  const A = window.__ARENA;
  const S = []; window.__REC = S; window.__RECON = true; window.__MARKS = [];
  const tick = () => {
    if (window.__RECON) requestAnimationFrame(tick);
    try {
      const V = A.app.view, D = A.app.dir, T = A.app.textbox, F = A.stage.feel;
      S.push({
        gt: +A.stage.time.toFixed(4), w: +performance.now().toFixed(1), fps: A.perf.fps,
        shot: D.shot?.id ?? null, subj: D.shot?.subject ?? null, blend: +(D.blend ?? 1).toFixed(3),
        cam: [+A.stage.camera.position.x.toFixed(2), +A.stage.camera.position.y.toFixed(2), +A.stage.camera.position.z.toFixed(2)],
        fov: +A.stage.camera.fov.toFixed(2),
        txt: T.$txt ? T.$txt.textContent : '', cur: T.current ? (T.current.text || '') : '',
        tq: T.queue.length, wfi: !!T.waitingForInput,
        hp: A.app.plates.map((p) => [p.hp, p.maxHp, +p.hpSpring.value.toFixed(4), +p.hpSpring.target.toFixed(4), +p.ghost.toFixed(4)]),
        shake: +F.shake.amp.toFixed(4), flash: +F.flash.a.toFixed(4), hits: F.hitstopMs,
        zoom: +F.zoomPunch.toFixed(4), chroma: +F.chroma.toFixed(4), ts: +(F.timeScale ?? 1).toFixed(3),
        vfx: V.vfx.active.length, gate: +V.gate.toFixed(3), q: V.queue.length, turn: V.state?.turn ?? -1,
        act: V.actors.map((a) => (a ? [+a.root.position.x.toFixed(2), +a.root.position.y.toFixed(2), +a.root.position.z.toFixed(2), +a.root.scale.y.toFixed(3)] : null)),
        wait: A.battle.waitingFor?.() ?? null, rid: A.router.currentId
      });
    } catch (e) { S.push({ err: String(e.message) }); }
  };
  requestAnimationFrame(tick);
};
const mark = (m) => page.evaluate((mm) => window.__MARKS.push({ ...mm, gt: +window.__ARENA.stage.time.toFixed(3), w: +performance.now().toFixed(1) }), m);
const st = () => page.evaluate(() => {
  const A = window.__ARENA, T = A.app.textbox;
  return { gt: +A.stage.time.toFixed(2), rid: A.router.currentId, wait: A.battle.waitingFor?.() ?? null,
    wfi: !!T.waitingForInput, txt: T.$txt?.textContent || '', menu: !!document.querySelector('.cmdbtn.fight'),
    fps: A.perf.fps, q: A.app.view.queue.length };
});

const waitPrompt = async (max = 500) => {
  for (let i = 0; i < max; i++) {
    const s = await st();
    if (s.rid !== 'battle') return 'over';
    if (s.wait === 0 && s.menu) return 'prompt';
    if (s.wfi) await page.keyboard.press('Space');
    await sleep(150);
  }
  return 'stall';
};
async function commitMove(idx = 2) {
  if (!(await page.evaluate(() => !!document.querySelector('.cmdbtn.fight')))) return 'no-menu';
  await page.click('.cmdbtn.fight');
  await sleep(500);
  const cards = await page.$$('.movegrid .movecard');
  if (!cards.length) return 'no-moves';
  await cards[Math.min(idx, cards.length - 1)].click();
  return 'ok';
}
async function forcedSwitch() {
  return page.evaluate(() => {
    const cards = [...document.querySelectorAll('.partygrid .partycard, .partycard, .switchcard')];
    const pick = cards.find((c) => !c.classList.contains('fainted') && !c.disabled);
    if (pick) { pick.click(); return 'clicked'; }
    const A = window.__ARENA, s = A.battle.screen?.(), side = s?.battle?.sides?.[0];
    if (!side) return 'none';
    const i = side.party.findIndex((p, j) => !p.fainted && j !== side.activeIndex);
    A.battle.choose(0, { kind: 'switch', toSlot: i < 0 ? 0 : i });
    return 'api';
  });
}

// -------------------------------------------------------------------------
await page.evaluate(INSTALL);
await page.evaluate((s) => window.__ARENA.battle.quick(s), SEED);
await mark({ ev: 'start' });
console.log('cfg:', JSON.stringify(await page.evaluate(() => {
  const T = window.__ARENA.app.textbox, s = window.__ARENA.app.settings;
  return { cps: T.cps, autoAdvanceMs: T.autoAdvanceMs, readMsPerChar: T.readMsPerChar, minHoldMs: T.minHoldMs, speed: T.speed, battleSpeed: s.battleSpeed, reducedMotion: s.reducedMotion, foeHpNumbers: s.foeHpNumbers };
})));

let shots = 0;
const snap = async (tag) => { await page.screenshot({ path: `${OUT}/${tag}.png` }); shots++; };

for (let t = 0; t < TURNS; t++) {
  const r = await waitPrompt();
  console.log(`turn ${t}: waitPrompt=${r} ${JSON.stringify(await st())}`);
  if (r !== 'prompt') break;
  if (await page.evaluate(() => !!window.__ARENA.battle.screen?.()?.forcedSwitch)) {
    await mark({ ev: 'forced', t }); console.log('  forced switch ->', await forcedSwitch());
    await sleep(400); continue;
  }
  await sleep(500);
  if (t === 0) await snap('a-prompt');
  await mark({ ev: 'prompt', t });
  const c = await commitMove(2);
  if (c !== 'ok') { console.log('  commit:', c); break; }
  await mark({ ev: 'commit', t });
  // burst of screenshots for the first two turns
  const burst = t < 2 ? 16 : 0;
  const PLAYER_ADVANCES = t !== 1;    // turn 1: touch nothing, see if it self-advances
  for (let i = 0; i < 420; i++) {
    if (i < burst) await snap(`t${t}-${String(i).padStart(2, '0')}`);
    const s = await st();
    if (s.rid !== 'battle') { await mark({ ev: 'left-battle' }); break; }
    if (s.wait === 0 && s.menu) break;
    if (s.wfi && PLAYER_ADVANCES) { await mark({ ev: 'advance', txt: s.txt.slice(0, 46) }); await page.keyboard.press('Space'); }
    await sleep(i < burst ? 60 : 120);
  }
  await mark({ ev: 'resolved', t });
}

// ---- faint film: rig the foe low, then hit it -----------------------------
const rig = await page.evaluate(() => {
  const A = window.__ARENA;
  const raw = A.battle.raw ? A.battle.raw() : (A.battle.screen?.()?.battle ?? null);
  if (!raw) return 'no-raw';
  const s = raw.sides[1], m = s.party[s.activeIndex];
  m.hp = Math.max(1, Math.round(m.maxHp * 0.04));
  return `foe hp -> ${m.hp}/${m.maxHp}`;
});
console.log('rig:', rig);
if ((await waitPrompt()) === 'prompt') {
  await mark({ ev: 'faint-turn' });
  await commitMove(2);
  for (let i = 0; i < 60; i++) {
    if (i < 22) await snap(`f-${String(i).padStart(2, '0')}`);
    const s = await st();
    if (s.rid !== 'battle') break;
    if (s.wfi) { await mark({ ev: 'advance', txt: s.txt.slice(0, 46) }); await page.keyboard.press('Space'); }
    if (s.wait === 0 && s.menu && i > 24) break;
    await sleep(i < 22 ? 70 : 130);
  }
  await mark({ ev: 'faint-done' });
}

await page.evaluate(() => { window.__RECON = false; });
const out = await page.evaluate(() => ({ rec: window.__REC, marks: window.__MARKS, log: window.__ARENA.battle.log(), fps: window.__ARENA.perf.fps, rid: window.__ARENA.router.currentId }));
await writeFile(`${OUT}/rec-${SEED}.json`, JSON.stringify(out));
console.log(`samples=${out.rec.length} fps=${out.fps} rid=${out.rid} shots=${shots}`);
console.log('log:', JSON.stringify(out.log));
console.log('errors:', errors.length ? errors.slice(0, 4) : 'none');
await browser.close();
