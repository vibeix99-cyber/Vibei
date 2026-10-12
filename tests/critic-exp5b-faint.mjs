// Critic run 3b: film a real KO. Play turns until the foe is low, verify the rig
// actually took on the live state, then burst-shoot the faint.
//   node tests/critic-exp5b-faint.mjs <seed>
import { chromium } from 'playwright';
import { setTimeout as sleep } from 'node:timers/promises';
import { mkdir, writeFile } from 'node:fs/promises';

const PORT = 8811, SEED = process.argv[2] || 'EXP-7', OUT = 'tests/shots/exp5';
await mkdir(OUT, { recursive: true });
const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--disable-dev-shm-usage', '--no-sandbox'] });
const page = await browser.newPage({ viewport: { width: 1000, height: 640 } });
const errors = [];
page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
await page.goto(`http://127.0.0.1:${PORT}/?quality=low`, { waitUntil: 'networkidle' });
await page.waitForFunction(() => window.__ARENA?.version, null, { timeout: 30000 });
await page.evaluate(() => window.__ARENA.ready);
await page.evaluate(() => window.__ARENA.audio.setMuted(true));

await page.evaluate(() => {
  const A = window.__ARENA;
  window.__F = []; window.__ON = true;
  const tick = () => {
    if (window.__ON) requestAnimationFrame(tick);
    const T = A.app.textbox, F = A.stage.feel, V = A.app.view;
    window.__F.push({ gt: +A.stage.time.toFixed(3), cur: T.current?.text || '', wfi: !!T.waitingForInput,
      shot: A.app.dir.shot?.id ?? null, blend: +(A.app.dir.blend ?? 1).toFixed(2),
      shake: +F.shake.amp.toFixed(3), flash: +F.flash.a.toFixed(3), hits: F.hitstopMs, ts: +(F.timeScale ?? 1).toFixed(2),
      chroma: +F.chroma.toFixed(3), vfx: V.vfx.active.length, q: V.queue.length,
      hp: A.app.plates.map((p) => [+p.hpSpring.value.toFixed(3), +p.ghost.toFixed(3)]),
      act: V.actors.map((a) => (a ? [+a.root.position.y.toFixed(2), +a.root.scale.y.toFixed(3), +a.root.rotation.x.toFixed(2), +a.root.rotation.z.toFixed(2), a.root.visible] : null)) });
  };
  requestAnimationFrame(tick);
  window.__mark = (ev) => window.__F.push({ mark: ev, gt: +window.__ARENA.stage.time.toFixed(3) });
});

const st = () => page.evaluate(() => {
  const A = window.__ARENA, T = A.app.textbox;
  return { gt: +A.stage.time.toFixed(2), rid: A.router.currentId, wait: A.battle.waitingFor?.() ?? null,
    wfi: !!T.waitingForInput, menu: !!document.querySelector('.cmdbtn.fight'), fs: !!A.battle.screen?.()?.forcedSwitch,
    q: A.app.view.queue.length, txt: T.$txt?.textContent || '', foe: +(A.app.plates[0]?.hp / A.app.plates[0]?.maxHp).toFixed(3) };
});
const toPrompt = async () => {
  for (let i = 0; i < 400; i++) {
    const s = await st();
    if (s.rid !== 'battle') return 'over';
    if (s.fs) { await page.evaluate(() => { const A = window.__ARENA, side = A.battle.screen().battle.sides[0]; const j = side.party.findIndex((p, k) => !p.fainted && k !== side.activeIndex); A.battle.choose(0, { kind: 'switch', toSlot: j < 0 ? 0 : j }); }); await sleep(350); continue; }
    if (s.wait === 0 && s.menu) return 'prompt';
    if (s.wfi) await page.keyboard.press('Space');
    await sleep(80);
  }
  return 'stall';
};

await page.evaluate((s) => window.__ARENA.battle.quick(s), SEED);
await toPrompt();
const rig = await page.evaluate(() => {
  const A = window.__ARENA;
  const raw = A.battle.raw ? A.battle.raw() : null;
  if (!raw) return { err: 'no raw()' };
  const s = raw.sides[1], m = s.party[s.activeIndex];
  const before = m.hp;
  m.hp = 1;
  const plate = A.app.plates[0];
  return { has_raw: true, name: m.name || m.species || '?', before, after: m.hp, max: m.maxHp,
    plateHp: plate.hp, plateMax: plate.maxHp, readback: A.battle.state?.().sides?.[1]?.active?.hp ?? null };
});
console.log('rig:', JSON.stringify(rig));
await page.evaluate(() => window.__mark('rigged'));

// pick the first damaging move
const pick = await page.evaluate(() => {
  const A = window.__ARENA, side = A.battle.screen().battle.sides[0], m = side.party[side.activeIndex];
  const idx = (m.moves || []).findIndex((x) => (x.pp ?? 1) > 0 && (A.data.moves[x.id]?.power || 0) > 0);
  return { idx, name: m.moves?.[idx]?.id };
});
console.log('move:', JSON.stringify(pick));
await page.click('.cmdbtn.fight');
await sleep(450);
const cards = await page.$$('.movegrid .movecard');
await cards[Math.max(0, pick.idx)].click();
await page.mouse.move(500, 180);
await page.evaluate(() => window.__mark('click'));

let n = 0, sawFaint = false;
for (let i = 0; i < 60; i++) {
  await page.screenshot({ path: `${OUT}/b${String(n).padStart(2, '0')}.png` });
  await page.evaluate((k) => window.__mark('shot' + k), n); n++;
  const s = await st();
  if (/fainted/.test(s.txt)) sawFaint = true;
  if (s.rid !== 'battle') break;
  if (sawFaint && n > 26) break;
  if (n > 40) break;
  if (s.wfi) await page.keyboard.press('Space');
  await sleep(30);
}
await page.evaluate(() => { window.__ON = false; });
const dump = await page.evaluate(() => ({ f: window.__F, log: window.__ARENA.battle.log() }));
await writeFile(`${OUT}/bframes-${SEED}.json`, JSON.stringify(dump));
console.log(`shots=${n} sawFaint=${sawFaint} frames=${dump.f.length}`);
console.log('log tail:', JSON.stringify(dump.log.slice(-10)));
console.log('errors:', errors.length ? errors.slice(0, 3) : 'none');
await browser.close();
