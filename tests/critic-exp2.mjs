// Focused probe: what happens between "I picked a move" and "the turn plays".
// Does the already-answered command prompt block the turn? Does a mouse click clear it?
// What is the default (no-input) message pacing, in game seconds?
//   node tests/critic-exp2.mjs <seed>
import { chromium } from 'playwright';
import { setTimeout as sleep } from 'node:timers/promises';
import { mkdir } from 'node:fs/promises';

const PORT = 8811, SEED = process.argv[2] || 'EXP-2', OUT = 'tests/shots/exp2';
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
  const A = window.__ARENA, T = A.app.textbox, V = A.app.view;
  return { gt: +A.stage.time.toFixed(2), txt: T.$txt?.textContent || '', wfi: !!T.waitingForInput, tq: T.queue.length,
    wait: A.battle.waitingFor?.() ?? null, q: V.queue.length, vfx: V.vfx.active.length, gate: +V.gate.toFixed(2),
    menu: !!document.querySelector('.cmdbtn.fight'), tip: !!document.querySelector('.movetip, .moveinfo, .tipcard, .movecard-tip'),
    shot: A.app.dir.shot?.id ?? null, rid: A.router.currentId };
});
const waitPrompt = async () => { for (let i = 0; i < 400; i++) { const s = await st(); if (s.rid !== 'battle') return 'over'; if (s.wait === 0 && s.menu) return 'prompt'; if (s.wfi) await page.keyboard.press('Space'); await sleep(150); } return 'stall'; };

await page.evaluate((s) => window.__ARENA.battle.quick(s), SEED);
console.log('prompt:', await waitPrompt());
// let the prompt line finish typing and settle into waiting-for-input
for (let i = 0; i < 40; i++) { const s = await st(); if (s.wfi) break; await sleep(200); }
console.log('at prompt:', JSON.stringify(await st()));

await page.click('.cmdbtn.fight'); await sleep(500);
const cards = await page.$$('.movegrid .movecard');
console.log('move cards:', cards.length);
await cards[0].click();
const t0 = (await st()).gt;
console.log(`\n--- after committing a move, NO further input (game seconds since commit) ---`);
for (let i = 0; i < 24; i++) {
  const s = await st();
  console.log(`  +${(s.gt - t0).toFixed(2)}s wfi=${s.wfi} tq=${s.tq} q=${s.q} vfx=${s.vfx} shot=${s.shot} wait=${s.wait} tip=${s.tip} ${JSON.stringify(s.txt).slice(0, 50)}`);
  await sleep(500);
}
await page.screenshot({ path: `${OUT}/stalled.png` });

console.log('\n--- now a MOUSE CLICK on the arena (no keyboard) ---');
await page.mouse.click(500, 260);
for (let i = 0; i < 6; i++) { const s = await st(); console.log(`  +${(s.gt - t0).toFixed(2)}s wfi=${s.wfi} tq=${s.tq} q=${s.q} ${JSON.stringify(s.txt).slice(0, 50)}`); await sleep(400); }

console.log('\n--- one Space, then hands off: default message pacing ---');
await page.keyboard.press('Space');
let last = null, lastGt = null;
for (let i = 0; i < 260; i++) {
  const s = await st();
  if (s.rid !== 'battle') break;
  if (s.txt !== last) {
    if (last !== null) console.log(`  held ${String((s.gt - lastGt).toFixed(2)).padStart(6)}s  ${JSON.stringify(last).slice(0, 62)}`);
    last = s.txt; lastGt = s.gt;
  }
  if (s.wait === 0 && s.menu && s.wfi) { console.log(`  held ${(s.gt - lastGt).toFixed(2)}s  ${JSON.stringify(last).slice(0, 62)}  <- back at command prompt`); break; }
  await sleep(120);
}
await page.screenshot({ path: `${OUT}/after.png` });
console.log('errors:', errors.length ? errors : 'none');
await browser.close();
