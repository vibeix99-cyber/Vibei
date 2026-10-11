// Exploration only: layout dump of break / break's over at a size and text scale.
//   node explore.mjs <base> <WxH> <theme> <text> <outdir>
import { chromium } from '/home/user/Vibei/kettle/node_modules/playwright/index.mjs';
import { mkdirSync } from 'node:fs';
const [base, cfg, theme, text, out] = process.argv.slice(2);
mkdirSync(out, { recursive: true });
const [W, H] = cfg.split('x').map(Number);
const phone = W < 900;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const browser = await chromium.launch({ args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader', '--ignore-gpu-blocklist'] });
const ctx = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: phone ? 2 : 1, isMobile: phone, hasTouch: phone, colorScheme: theme });
await ctx.addInitScript((pct) => {
  try { if (!localStorage.getItem('kettle:settings')) localStorage.setItem('kettle:settings', JSON.stringify({ state: { onboarded: true, scene: 'off', autoStartBreaks: false, autoStartFocus: false, muted: true }, version: 1 })); } catch {}
  if (pct !== 100) addEventListener('DOMContentLoaded', () => { const s = document.createElement('style'); s.textContent = `html{font-size:${pct}%!important}`; document.head.appendChild(s); });
}, +text);
const page = await ctx.newPage();
await page.goto(`${base}/?debug&seed=newbie&theme=${theme}#/`);
await page.waitForFunction(() => !!window.__kettle);
await sleep(1500);
const dump = (label) => page.evaluate((label) => {
  const q = (sel) => [...document.querySelectorAll(sel)];
  const out = { label, doc: `${document.scrollingElement.scrollTop}/${document.scrollingElement.scrollHeight - document.scrollingElement.clientHeight}` };
  const scr = document.querySelector('[data-focus-view]');
  const r = (el) => { const b = el.getBoundingClientRect(); return `${Math.round(b.top)}-${Math.round(b.bottom)} h${Math.round(b.height)}`; };
  out.screen = scr && r(scr);
  for (const c of ['stageBox', 'panel', 'timer', 'over', 'controls', 'readout', 'overDock', 'top']) {
    const el = document.querySelector(`[class*="_${c}_"]`); if (el) out[c] = r(el) + ` sh${el.scrollHeight} ch${el.clientHeight} ov${getComputedStyle(el).overflowY}`;
  }
  out.buttons = q('[data-focus-view] button').filter((b) => b.getBoundingClientRect().width > 0).map((b) => `${(b.getAttribute('aria-label') || b.textContent).trim().slice(0, 22)}@${Math.round(b.getBoundingClientRect().top + b.getBoundingClientRect().height / 2)}`);
  return out;
}, label);
await page.evaluate(() => window.__kettle.timer.getState().startFocus({ intention: 'Chapter 3 notes', tag: 'study' }));
await sleep(2500);
await page.evaluate(() => window.__kettle.nearEnd()); await sleep(400); await page.evaluate(() => window.__kettle.finish());
await page.getByRole('button', { name: /Tea time|Long tea break/ }).waitFor({ state: 'visible', timeout: 60_000 });
await sleep(2600);
console.log(JSON.stringify(await dump('summary')));
await page.getByRole('button', { name: /Tea time|Long tea break/ }).click();
await sleep(2600);
console.log(JSON.stringify(await dump('break')));
await page.screenshot({ path: `${out}/break.png` });
await page.evaluate(() => window.__kettle.timer.getState().pause());
await sleep(1500);
console.log(JSON.stringify(await dump('break-paused')));
await page.screenshot({ path: `${out}/break-paused.png` });
await page.evaluate(() => window.__kettle.finish());
await sleep(2600);
console.log(JSON.stringify(await dump('over-carried')));
await page.screenshot({ path: `${out}/over-carried.png` });
await browser.close();
