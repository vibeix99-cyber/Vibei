// Lane I (W3R1, maker S): full-page Stats, empty (fresh) and populated (veteran), at 16 configurations.
//   node LI-cap.mjs <url> <label> <outDir>
// Frozen 2026-10-12T07:40Z then resume(); en-GB, UTC; DPR 1; not isMobile (no full-page stitching artefacts).
import { chromium } from 'playwright';
import fs from 'node:fs';

const [url, label, outRoot] = process.argv.slice(2);
const out = `${outRoot}/${label}`;
fs.mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader', '--ignore-gpu-blocklist'] });
const meta = [];
for (const [w, h] of [[390, 844], [375, 667], [844, 390], [1440, 900]]) for (const theme of ['light', 'dark']) for (const pct of [100, 200]) for (const [state, seed] of [['empty', 'fresh'], ['veteran', 'veteran']]) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1, colorScheme: theme, timezoneId: 'UTC', locale: 'en-GB', reducedMotion: 'reduce', serviceWorkers: 'block' });
  if (pct !== 100) await ctx.addInitScript((p) => addEventListener('DOMContentLoaded', () => { const s = document.createElement('style'); s.textContent = `html{font-size:${p}%!important}`; document.head.appendChild(s); }), pct);
  await ctx.addInitScript(() => { try { if (!localStorage.getItem('kettle:settings')) localStorage.setItem('kettle:settings', JSON.stringify({ state: { onboarded: true, scene: 'off', autoStartBreaks: false, autoStartFocus: false, muted: true }, version: 1 })); } catch {} });
  const page = await ctx.newPage();
  await page.clock.install({ time: Date.parse('2026-10-12T07:40:00Z') });
  await page.clock.resume();
  await page.goto(`${url}/?debug&seed=${seed}&onboarded=1&theme=${theme}#/stats`);
  await page.waitForFunction(() => !!window.__kettle?.timerInfo, null, { timeout: 60000 });
  await page.getByRole('heading', { name: 'Stats', level: 1 }).waitFor();
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(1500);
  const name = `${w}x${h}-${theme}-${pct}-${state}`;
  const m = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, iw: innerWidth, sh: document.documentElement.scrollHeight, over: [...document.querySelectorAll('main *')].filter((e) => { const r = e.getBoundingClientRect(); return r.width > 0 && r.right > innerWidth + 1; }).slice(0, 4).map((e) => `${e.tagName}.${String(e.className).replace(/_[a-z0-9]{5}_\d+/g, '').slice(0, 30)} r=${Math.round(e.getBoundingClientRect().right)}`) }));
  await page.screenshot({ path: `${out}/${name}.png`, fullPage: true });
  meta.push({ name, ...m });
  console.log(JSON.stringify({ name, ...m }));
  await ctx.close();
}
fs.writeFileSync(`${out}/meta.json`, JSON.stringify(meta, null, 1));
await browser.close();
