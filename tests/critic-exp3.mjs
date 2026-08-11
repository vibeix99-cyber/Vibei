// Can a mouse-only player advance the blocking prompt? Try: arena click, message-box
// click, the ▼ advance affordance, then Space.
import { chromium } from 'playwright';
import { setTimeout as sleep } from 'node:timers/promises';
const PORT = 8811, SEED = process.argv[2] || 'EXP-1';
const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--disable-dev-shm-usage', '--no-sandbox'] });
const page = await browser.newPage({ viewport: { width: 1000, height: 640 } });
await page.goto(`http://127.0.0.1:${PORT}/?quality=low`, { waitUntil: 'networkidle' });
await page.waitForFunction(() => window.__ARENA?.version, null, { timeout: 30000 });
await page.evaluate(() => window.__ARENA.ready);
await page.evaluate(() => window.__ARENA.audio.setMuted(true));
const st = () => page.evaluate(() => {
  const A = window.__ARENA, T = A.app.textbox;
  return { gt: +A.stage.time.toFixed(2), txt: T.$txt?.textContent || '', wfi: !!T.waitingForInput, tq: T.queue.length,
    q: A.app.view.queue.length, menu: !!document.querySelector('.cmdbtn.fight'), wait: A.battle.waitingFor?.() ?? null };
});
await page.evaluate((s) => window.__ARENA.battle.quick(s), SEED);
for (let i = 0; i < 300; i++) { const s = await st(); if (s.wait === 0 && s.menu && s.wfi) break; if (s.wfi) await page.keyboard.press('Space'); await sleep(150); }
console.log('at prompt:', JSON.stringify(await st()));
console.log('textbox rect:', JSON.stringify(await page.evaluate(() => { const r = window.__ARENA.app.textbox.el.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height }; })));
console.log('adv el:', await page.evaluate(() => { const a = window.__ARENA.app.textbox.$adv; return a ? (a.tagName + '.' + a.className + ' ' + JSON.stringify(a.getBoundingClientRect())) : 'none'; }));
await page.click('.cmdbtn.fight'); await sleep(500);
const cards = await page.$$('.movegrid .movecard'); await cards[0].click();
await sleep(2500);
console.log('after commit:', JSON.stringify(await st()));
const tries = [
  ['click arena centre', async () => page.mouse.click(500, 250)],
  ['click message box', async () => { const r = await page.evaluate(() => { const b = window.__ARENA.app.textbox.el.getBoundingClientRect(); return { x: b.x + b.width / 2, y: b.y + b.height / 2 }; }); await page.mouse.click(r.x, r.y); }],
  ['click ▼ advance', async () => { const ok = await page.evaluate(() => { const a = window.__ARENA.app.textbox.$adv; if (!a) return false; const r = a.getBoundingClientRect(); window.__ADV = [r.x + r.width / 2, r.y + r.height / 2]; return true; }); if (!ok) return; const [x, y] = await page.evaluate(() => window.__ADV); await page.mouse.click(x, y); }],
  ['press Space', async () => page.keyboard.press('Space')]
];
for (const [name, fn] of tries) {
  const before = await st();
  await fn(); await sleep(1200);
  const after = await st();
  console.log(`${name.padEnd(20)} txt:${JSON.stringify(before.txt).slice(0, 26)} -> ${JSON.stringify(after.txt).slice(0, 26)}  q ${before.q}->${after.q}  ADVANCED=${before.txt !== after.txt || before.q !== after.q}`);
  if (before.txt !== after.txt) break;
}
await browser.close();
