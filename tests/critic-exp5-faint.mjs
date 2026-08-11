// Critic run 3: the KO. Rig the foe to 1 HP, hit it, and film the faint densely,
// with per-frame in-page telemetry so the burst can be placed on the game clock.
//   node tests/critic-exp5-faint.mjs <seed>
import { chromium } from 'playwright';
import { setTimeout as sleep } from 'node:timers/promises';
import { mkdir, writeFile } from 'node:fs/promises';

const PORT = 8811, SEED = process.argv[2] || 'EXP-1', OUT = 'tests/shots/exp5';
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
      hp: A.app.plates.map((p) => [+p.hpSpring.value.toFixed(3), +p.hpSpring.target.toFixed(3), +p.ghost.toFixed(3)]),
      act: V.actors.map((a) => (a ? [+a.root.position.y.toFixed(2), +a.root.scale.y.toFixed(3), +(a.root.rotation.z ?? 0).toFixed(2), a.root.visible] : null)) });
  };
  requestAnimationFrame(tick);
  window.__mark = (ev) => window.__F.push({ mark: ev, gt: +window.__ARENA.stage.time.toFixed(3) });
});

const st = () => page.evaluate(() => {
  const A = window.__ARENA, T = A.app.textbox;
  return { gt: +A.stage.time.toFixed(2), rid: A.router.currentId, wait: A.battle.waitingFor?.() ?? null,
    wfi: !!T.waitingForInput, menu: !!document.querySelector('.cmdbtn.fight'), fs: !!A.battle.screen?.()?.forcedSwitch,
    q: A.app.view.queue.length, txt: T.$txt?.textContent || '' };
});
const toPrompt = async () => {
  for (let i = 0; i < 400; i++) {
    const s = await st();
    if (s.rid !== 'battle') return 'over';
    if (s.fs) { await page.evaluate(() => { const c = [...document.querySelectorAll('.partycard, .listrow')].find((x) => !x.disabled && !x.classList.contains('fainted')); if (c) c.click(); }); await sleep(400); continue; }
    if (s.wait === 0 && s.menu) return 'prompt';
    if (s.wfi) await page.keyboard.press('Space');
    await sleep(90);
  }
  return 'stall';
};

await page.evaluate((s) => window.__ARENA.battle.quick(s), SEED);
await toPrompt();
// rig the foe to 1 HP so the very next hit is a KO
console.log('rig:', await page.evaluate(() => {
  const A = window.__ARENA, raw = A.battle.raw ? A.battle.raw() : A.battle.screen()?.battle;
  const s = raw.sides[1], m = s.party[s.activeIndex];
  for (const p of s.party) if (p !== m) p.fainted = true, p.hp = 0;   // no follow-up switch-in
  m.hp = 1;
  return `${m.name || 'foe'} -> 1/${m.maxHp}`;
}));
await page.evaluate(() => window.__mark('rigged'));
// pick the strongest-looking damaging move
await page.click('.cmdbtn.fight');
await sleep(500);
const cards = await page.$$('.movegrid .movecard');
await cards[0].click();
await page.mouse.move(500, 200);
await page.evaluate(() => window.__mark('click'));

let n = 0;
for (let i = 0; i < 70; i++) {
  await page.screenshot({ path: `${OUT}/k${String(n).padStart(2, '0')}.png` }); n++;
  await page.evaluate((k) => window.__mark('shot' + k), n - 1);
  const s = await st();
  if (s.rid !== 'battle') break;
  if (s.wfi) await page.keyboard.press('Space');
  if (n > 34) break;
  await sleep(40);
}
await page.evaluate(() => { window.__ON = false; });
const dump = await page.evaluate(() => ({ f: window.__F, log: window.__ARENA.battle.log(), rid: window.__ARENA.router.currentId }));
await writeFile(`${OUT}/frames-${SEED}.json`, JSON.stringify(dump));
console.log(`shots=${n} frames=${dump.f.length} rid=${dump.rid}`);
console.log('log tail:', JSON.stringify(dump.log.slice(-8)));
console.log('errors:', errors.length ? errors.slice(0, 3) : 'none');
await browser.close();
