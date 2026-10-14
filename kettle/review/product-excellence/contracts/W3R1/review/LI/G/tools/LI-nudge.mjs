// Lane I: the Notifications & device group with notification permission GRANTED (on and off), base vs trial.
//   node LI-nudge.mjs <outDir>
import { chromium } from 'playwright';
import fs from 'node:fs';
const [out] = process.argv.slice(2);
fs.mkdirSync(out, { recursive: true });
const FIXED = Date.parse('2026-10-12T07:40:00.000Z');
const browser = await chromium.launch({ args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader', '--ignore-gpu-blocklist'] });
for (const [label, url] of [['base', 'http://127.0.0.1:5488'], ['trial', 'http://127.0.0.1:5533']])
  for (const [w, h, theme, pct] of [[375, 667, 'dark', 200], [390, 844, 'light', 100], [1440, 900, 'light', 100]])
    for (const on of [true, false]) {
      const tag = `${label}-${w}x${h}-${theme}-${pct}-notif${on ? 'On' : 'Off'}`;
      const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1, colorScheme: theme, timezoneId: 'UTC', locale: 'en-GB', reducedMotion: 'reduce' });
      await ctx.grantPermissions(['notifications'], { origin: url });
      if (pct !== 100) await ctx.addInitScript((p) => addEventListener('DOMContentLoaded', () => { const s = document.createElement('style'); s.textContent = `html{font-size:${p}%!important}`; document.head.appendChild(s); }), pct);
      const page = await ctx.newPage();
      await page.clock.install({ time: FIXED });
      await page.clock.resume();
      await page.goto(`${url}/?debug&seed=veteran&theme=${theme}#/settings`);
      await page.waitForFunction(() => !!window.__kettle, null, { timeout: 60000 });
      await page.evaluate((v) => window.__kettle.settings.getState().set({ notifications: v, muted: false }), on);
      await page.evaluate(() => document.fonts.ready);
      await page.waitForTimeout(1000);
      const perm = await page.evaluate(() => Notification.permission);
      const grp = page.locator('section, div').filter({ has: page.getByText('Notifications & device', { exact: true }) }).last();
      const sw = page.getByRole('switch', { name: /Nudges/ }).first();
      await sw.scrollIntoViewIfNeeded();
      const card = sw.locator('xpath=ancestor::*[contains(@class,"card")][1]');
      const box = await card.boundingBox();
      await page.evaluate((y) => scrollBy(0, y), box.y - 60);
      await page.waitForTimeout(300);
      const b = await card.boundingBox();
      await page.screenshot({ path: `${out}/${tag}.png`, clip: { x: Math.max(0, b.x - 8), y: Math.max(0, b.y - 40), width: Math.min(w, b.width + 16), height: Math.min(h - Math.max(0, b.y - 40), b.height + 48) } });
      const text = (await card.innerText()).replace(/\s+/g, ' ');
      console.log(tag, 'perm', perm, '|', text.slice(0, 420));
      await ctx.close();
    }
await browser.close();
