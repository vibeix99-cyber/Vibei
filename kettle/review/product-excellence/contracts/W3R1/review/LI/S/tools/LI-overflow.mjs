// Lane I: horizontal overflow on Stats at 390×844 @200 (isMobile + hasTouch, as w3-stats.spec.ts:98), sampled every
// 100 ms for 4 s after boot, then after scrolling the first History row into view. Widest elements past the edge.
//   node LI-overflow.mjs <url> <label> <outDir>
import { chromium } from 'playwright';
import fs from 'node:fs';
const [url, label, outRoot] = process.argv.slice(2);
fs.mkdirSync(outRoot, { recursive: true });
const browser = await chromium.launch({ args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader', '--ignore-gpu-blocklist'] });
const res = [];
for (const theme of ['light']) for (const run of [1, 2, 3]) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, colorScheme: theme, locale: 'en-US' });
  await ctx.addInitScript(() => { try { if (!localStorage.getItem('kettle:settings')) localStorage.setItem('kettle:settings', JSON.stringify({ state: { onboarded: true, scene: 'off', autoStartBreaks: false, autoStartFocus: false, muted: true }, version: 1 })); } catch {} });
  await ctx.addInitScript(() => addEventListener('DOMContentLoaded', () => { const s = document.createElement('style'); s.textContent = 'html{font-size:200%!important}'; document.head.appendChild(s); }));
  const page = await ctx.newPage();
  await page.clock.install({ time: Date.parse('2026-10-12T07:40:00Z') });
  await page.clock.resume();
  await page.goto(`${url}/?debug&seed=veteran#/stats`);
  await page.waitForFunction(() => !!window.__kettle?.timerInfo, null, { timeout: 60000 });
  await page.evaluate(() => document.fonts.ready);
  const samples = [];
  for (let i = 0; i < 40; i++) { samples.push(await page.evaluate(() => [document.documentElement.scrollWidth, innerWidth, Math.round(visualViewport.width), +visualViewport.scale.toFixed(3)].join('/'))); await page.waitForTimeout(100); }
  const wide = await page.evaluate(() => [...document.querySelectorAll('body *')].filter((e) => { const r = e.getBoundingClientRect(); return r.width > 0 && r.right > 390.5; }).map((e) => `${e.tagName}.${String(e.className).replace(/_[a-z0-9]{5}_\d+/g, '').slice(0, 28)} "${(e.innerText || '').replace(/\s+/g, ' ').slice(0, 20)}" r=${Math.round(e.getBoundingClientRect().right)}`).slice(0, 12));
  await page.screenshot({ path: `${outRoot}/${label}-run${run}.png` });
  res.push({ run, samples: [...new Set(samples)], wide });
  console.log(JSON.stringify({ label, run, distinct: [...new Set(samples)], wide }));
  await ctx.close();
}
fs.writeFileSync(`${outRoot}/${label}-overflow.json`, JSON.stringify(res, null, 1));
await browser.close();
