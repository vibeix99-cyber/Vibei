// Core loop walk: Home → start → Focus → pause/resume → end-early dialog → completion → celebration steps → tea break.
// usage: node loop.mjs <seed> <theme> <w> <h> <prefix> [reduce]
import { chromium } from 'playwright';
const [seed = 'celebrate', theme = 'dark', w = 390, h = 844, prefix = 'phone', motion] = process.argv.slice(2);
const OUT = 'review/round-6-audit/shots';
const tag = `${prefix}-${theme}-${seed}${motion ? '-rm' : ''}`;
const b = await chromium.launch({ args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader', '--ignore-gpu-blocklist'] });
const ctx = await b.newContext({ viewport: { width: +w, height: +h }, deviceScaleFactor: 2, serviceWorkers: 'block', colorScheme: theme, reducedMotion: motion ? 'reduce' : 'no-preference', hasTouch: +w < 900, isMobile: +w < 900 });
const p = await ctx.newPage();
const t0 = Date.now();
p.on('pageerror', (e) => console.log('pageerror', e.message));
p.on('console', (m) => m.type() === 'error' && console.log('console.error', m.text().slice(0, 160)));
await p.goto(`http://localhost:4173/?debug&seed=${seed}&theme=${theme}#/`, { waitUntil: 'networkidle' });
await p.waitForTimeout(2500);
const shot = async (n, full = false) => { await p.screenshot({ path: `${OUT}/${tag}-${n}.png`, fullPage: full }); };
const names = async () => (await p.evaluate(() => [...document.querySelectorAll('button,[role=button],a')].filter((e) => e.getClientRects().length).map((e) => (e.getAttribute('aria-label') || e.innerText || '').replace(/\s+/g, ' ').trim()).filter(Boolean))).join(' / ');
const heads = async () => p.evaluate(() => [...document.querySelectorAll('h1,h2,[role=dialog] h2,[role=alertdialog] h2')].filter((e) => e.getClientRects().length).map((e) => e.innerText.replace(/\s+/g, ' ')).join(' | '));
await shot('01-home'); await shot('01-home-full', true);
console.log('HOME', await heads());
const inp = p.getByRole('textbox').first();
await inp.fill('Chapter 3 notes'); await p.getByRole('button', { name: 'Study', exact: true }).click(); await p.waitForTimeout(500);
await shot('02-composer');
const start = p.getByRole('button', { name: /put the kettle on/i }).first();
await start.click();
for (const ms of [120, 260, 450]) { await p.waitForTimeout(ms === 120 ? 120 : ms - 120); await shot(`03-start-${ms}ms`); }
await p.waitForTimeout(6000); await shot('04-focus');
console.log('FOCUS', await heads(), '::', await names());
await p.getByRole('button', { name: /^pause/i }).first().click(); await p.waitForTimeout(900); await shot('05-paused');
console.log('PAUSED ::', await names());
await p.getByRole('button', { name: /^resume|^keep|^continue/i }).first().click().catch(() => console.log('no resume btn')); await p.waitForTimeout(900);
await p.getByRole('button', { name: /^end/i }).first().click(); await p.waitForTimeout(900); await shot('06-end-dialog');
console.log('END DIALOG', await heads(), '::', await names());
await p.keyboard.press('Escape'); await p.waitForTimeout(700); await shot('06b-after-escape');
// completion
await p.evaluate(() => window.__kettle.finish());
for (const ms of [300, 1500, 3500]) { await p.waitForTimeout(ms === 300 ? 300 : ms === 1500 ? 1200 : 2000); await shot(`07-whistle-${ms}ms`); }
console.log('AFTER FINISH', await p.evaluate(() => location.hash), await heads(), '::', await names());
for (let i = 0; i < 8; i++) {
  await p.waitForTimeout(2500); await shot(`08-done-${i}`);
  const hd = await heads(); const nm = await names();
  console.log(`DONE ${i}`, await p.evaluate(() => location.hash), hd, '::', nm);
  let btn = p.getByRole('button', { name: /^continue$/i }).first(); if (!(await btn.count())) btn = p.getByRole('button', { name: /^(next|nice|lovely|collect|open|tea time|start|take|back to|go)/i }).first();
  if (!(await btn.count())) break;
  await btn.click().catch(() => {});
  if (!(await p.evaluate(() => location.hash)).includes('done')) { await p.waitForTimeout(3000); await shot(`09-after-done`); console.log('LEFT DONE →', await p.evaluate(() => location.hash), await heads(), '::', await names()); break; }
}
console.log('elapsed', Math.round((Date.now() - t0) / 1000), 's');
await b.close();
