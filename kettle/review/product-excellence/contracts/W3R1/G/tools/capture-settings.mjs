// Settings top to bottom (full page) at 390×844, 375×667, 844×390, 1440×900 · light/dark · 100/200 % text.
// Frozen clock 2026-10-12T07:40Z (Monday), then resume(). Seed veteran, sounds on.
//   node capture-settings.mjs <baseUrl> <outDir> [filter]
import { chromium } from 'playwright';
import fs from 'node:fs';
const [url, out, filter = ''] = process.argv.slice(2);
fs.mkdirSync(out, { recursive: true });
const FIXED = Date.parse('2026-10-12T07:40:00.000Z');
const browser = await chromium.launch({ args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader', '--ignore-gpu-blocklist'] });
const SIZES = [[390, 844], [375, 667], [844, 390], [1440, 900]];
for (const [w, h] of SIZES) for (const theme of ['light', 'dark']) for (const pct of [100, 200]) {
  const name = `settings-${w}x${h}-${theme}-${pct}`;
  if (filter && !name.includes(filter)) continue;
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1, isMobile: w < h, hasTouch: w < h, colorScheme: theme, timezoneId: 'UTC', locale: 'en-GB', reducedMotion: 'reduce' });
  if (pct !== 100) await ctx.addInitScript((p) => addEventListener('DOMContentLoaded', () => { const s = document.createElement('style'); s.textContent = `html{font-size:${p}%!important}`; document.head.appendChild(s); }), pct);
  const page = await ctx.newPage();
  await page.clock.install({ time: FIXED });
  await page.clock.resume();
  await page.goto(`${url}/?debug&seed=veteran&theme=${theme}#/settings`);
  await page.waitForFunction(() => !!window.__kettle, null, { timeout: 60000 });
  await page.evaluate(() => window.__kettle.settings.getState().set({ muted: false, name: 'Robin' }));
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(1500);
  await page.screenshot({ path: `${out}/${name}.png`, fullPage: true });
  await ctx.close();
  console.log(name);
}
await browser.close();
