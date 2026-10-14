// Fix round G-D1..G-D4: line counts (height ÷ computed line-height) of the Sounds description and the Nudges On line
// at the 16 configs, with full-size frames of both rows; plus an iPhone-like Safari tab frame (no Notification, no
// navigator.vibrate). Permission is faked 'granted' (as whistle.spec.ts's fakePermission does) with notifications on.
//   node fix-measure.mjs <baseUrl> <outDir> <label> [filter]
import { chromium } from 'playwright';
import fs from 'node:fs';
const [url, out, label, filter = ''] = process.argv.slice(2);
fs.mkdirSync(out, { recursive: true });
const FIXED = Date.parse('2026-10-12T07:40:00.000Z');
const browser = await chromium.launch({ args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader', '--ignore-gpu-blocklist'] });
const results = [];
async function open(w, h, theme, pct, init) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1, isMobile: w < h, hasTouch: w < h, colorScheme: theme, timezoneId: 'UTC', locale: 'en-GB', reducedMotion: 'reduce' });
  if (pct !== 100) await ctx.addInitScript((p) => addEventListener('DOMContentLoaded', () => { const s = document.createElement('style'); s.textContent = `html{font-size:${p}%!important}`; document.head.appendChild(s); }), pct);
  await ctx.addInitScript(init);
  const page = await ctx.newPage();
  await page.clock.install({ time: FIXED });
  await page.clock.resume();
  await page.goto(`${url}/?debug&seed=veteran&theme=${theme}#/settings`);
  await page.waitForFunction(() => !!window.__kettle, null, { timeout: 60000 });
  await page.evaluate(() => window.__kettle.settings.getState().set({ muted: false, notifications: true, name: 'Robin' }));
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(1200);
  return { ctx, page };
}
const granted = () => { try { Object.defineProperty(Notification, 'permission', { get: () => 'granted' }); } catch {} };
const measure = (page, rowLabel) => page.evaluate((rowLabel) => {
  const lab = [...document.querySelectorAll('[class*="_label_"]')].find((e) => e.textContent.trim() === rowLabel);
  const desc = lab?.parentElement?.querySelector('[class*="_desc_"]');
  if (!desc) return null;
  const cs = getComputedStyle(desc);
  const h = desc.getBoundingClientRect().height;
  return { text: desc.textContent, chars: [...desc.textContent].length, height: +h.toFixed(1), lineHeight: parseFloat(cs.lineHeight), lines: Math.round(h / parseFloat(cs.lineHeight)), width: Math.round(desc.getBoundingClientRect().width) };
}, rowLabel);
async function shotRow(page, rowLabel, path) {
  const row = page.locator('[class*="_row_"]', { has: page.getByText(rowLabel, { exact: true }) }).last();
  await row.scrollIntoViewIfNeeded();
  await page.waitForTimeout(200);
  await row.screenshot({ path });
}
for (const [w, h] of [[390, 844], [375, 667], [844, 390], [1440, 900]]) for (const theme of ['light', 'dark']) for (const pct of [100, 200]) {
  const cfg = `${w}x${h}-${theme}-${pct}`;
  if (filter && !cfg.includes(filter)) continue;
  const { ctx, page } = await open(w, h, theme, pct, granted);
  const sounds = await measure(page, 'Sounds');
  const nudges = await measure(page, 'Nudges');
  await shotRow(page, 'Sounds', `${out}/${label}-${cfg}-sounds.png`);
  await shotRow(page, 'Nudges', `${out}/${label}-${cfg}-nudges-on.png`);
  results.push({ cfg, sounds, nudges });
  console.log(cfg, 'sounds', sounds?.lines, 'nudges', nudges?.lines);
  await ctx.close();
}
// iPhone-like Safari tab: no Notification API, no navigator.vibrate. Sound and Notifications groups at 390×844 light @100.
if (!filter) {
  const { ctx, page } = await open(390, 844, 'light', 100, () => { delete window.Notification; delete Navigator.prototype.vibrate; });
  for (const [g, f] of [['Sound', 'safari-sound-group'], ['Notifications & device', 'safari-notifications-group']]) {
    const sec = page.locator('section', { has: page.getByRole('heading', { name: g, exact: true }) }).first();
    await sec.scrollIntoViewIfNeeded();
    await page.waitForTimeout(200);
    await sec.screenshot({ path: `${out}/${label}-390x844-light-100-${f}.png` });
  }
  results.push({ cfg: 'safari-390x844-light-100', sounds: await measure(page, 'Sounds'), nudges: await measure(page, 'Nudges'), haptics: await measure(page, 'Haptics'), hapticsDisabled: await page.getByRole('switch', { name: 'Haptics' }).isDisabled() });
  await ctx.close();
}
fs.writeFileSync(`${out}/${label}-measure.json`, JSON.stringify(results, null, 1));
await browser.close();
