// BEFORE / AFTER captures of the Stats screen with History scrolled. node captures.mjs <base> <outdir>
import { chromium } from '@playwright/test';
import fs from 'node:fs';
const [base, DIR] = process.argv.slice(2);
fs.mkdirSync(DIR, { recursive: true });
const MONDAY = Date.parse('2026-10-12T07:40:00.000Z');
const browser = await chromium.launch({ args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader', '--ignore-gpu-blocklist'] });
for (const c of [{ id: '390-light', w: 390, h: 844, theme: 'light', touch: true }, { id: '390-dark', w: 390, h: 844, theme: 'dark', touch: true }, { id: '1440-light', w: 1440, h: 900, theme: 'light', touch: false }]) {
  const ctx = await browser.newContext({ viewport: { width: c.w, height: c.h }, deviceScaleFactor: c.touch ? 2 : 1, isMobile: c.touch, hasTouch: c.touch, colorScheme: c.theme, reducedMotion: 'reduce' });
  await ctx.addInitScript(() => { try { localStorage.setItem('kettle:settings', JSON.stringify({ state: { onboarded: true, scene: 'off', autoStartBreaks: false, autoStartFocus: false, muted: true }, version: 1 })); } catch {} });
  const page = await ctx.newPage();
  await page.clock.install({ time: MONDAY }); await page.clock.resume();
  await page.goto(`${base}/?debug&seed=veteran&theme=${c.theme}&nooktime=day#/stats`);
  await page.waitForFunction(() => !!window.__kettle?.timerInfo, null, { timeout: 30000 });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(1500);
  await page.evaluate(() => { const h = [...document.querySelectorAll('h2')].find((e) => e.textContent.trim() === 'History'); const r = h.getBoundingClientRect(); scrollTo({ top: scrollY + r.top - 90, behavior: 'instant' }); });
  await page.waitForTimeout(900);
  await page.screenshot({ path: `${DIR}/stats-history-${c.id}.png` });
  await ctx.close();
}
await browser.close();
