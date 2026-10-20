// LEAD-7: Focus stage reading -> cheering (whistle, summary) -> sipping (break); 390x844 and 1440x900, DPR 2 and 3.
import { createRequire } from 'node:module';
import fs from 'node:fs';
const require = createRequire('/home/user/wt/w9tr/kettle/package.json');
const { chromium } = require('@playwright/test');
const [base, tag, outdir, theme] = process.argv.slice(2);
const meas = (page) => page.evaluate(async () => {
  const fig = document.querySelector('[data-stage-figure="chai"]'); const img = fig?.querySelector('img');
  if (!img) return null; if (!img.complete) await img.decode().catch(() => {});
  const r = img.getBoundingClientRect(); const c = document.createElement('canvas'); c.width = img.naturalWidth; c.height = img.naturalHeight;
  const g = c.getContext('2d'); g.drawImage(img, 0, 0); const d = g.getImageData(0, 0, c.width, c.height).data;
  let x0 = 1e9, y0 = 1e9, x1 = -1, y1 = -1;
  for (let y = 0; y < c.height; y++) for (let x = 0; x < c.width; x++) if (d[(y * c.width + x) * 4 + 3] > 8) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
  const sx = r.width / c.width, sy = r.height / c.height; const sh = document.querySelector('[class*="cShadow"]')?.getBoundingClientRect();
  const f = (v) => +v.toFixed(2);
  return { pose: fig.querySelector('[data-pose]')?.dataset.pose ?? fig.dataset.pose, src: img.currentSrc.split('/').pop(), natural: [c.width, c.height],
    box: [r.left, r.top, r.width, r.height].map(f), ink: { left: f(r.left + x0 * sx), top: f(r.top + y0 * sy), right: f(r.left + (x1 + 1) * sx), bottom: f(r.top + (y1 + 1) * sy), w: f((x1 + 1 - x0) * sx), h: f((y1 + 1 - y0) * sy), cx: f(r.left + (x0 + x1 + 1) / 2 * sx) },
    devPxPerFilePx: f(sy * devicePixelRatio), shadowY: sh ? f(sh.top) : null, shadowCx: sh ? f(sh.left + sh.width / 2) : null };
});
const res = {};
const browser = await chromium.launch({ args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader', '--ignore-gpu-blocklist'] });
for (const [vw, vh, dpr] of [[390, 844, 2], [390, 844, 3], [1440, 900, 2]]) {
  const key = `${vw}x${vh}@${dpr}`; res[key] = {};
  const ctx = await browser.newContext({ viewport: { width: vw, height: vh }, reducedMotion: 'reduce', deviceScaleFactor: dpr });
  const page = await ctx.newPage();
  await page.goto(`${base}/?debug&seed=veteran&theme=${theme}&motion=reduce#/`);
  await page.waitForFunction(() => window.__kettle, null, { timeout: 90000 });
  await page.evaluate(() => window.__kettle.settings.getState().set({ muted: true, autoStartBreaks: false, autoStartFocus: false }));
  await page.waitForTimeout(800);
  await page.getByRole('button', { name: /put the kettle on/i }).first().click();
  await page.waitForFunction(() => location.hash === '#/focus'); await page.waitForTimeout(1500);
  const shot = async (name) => { const m = await meas(page); res[key][name] = m;
    if (m && dpr !== 3) { const x = Math.max(0, m.box[0] - 60), y = Math.max(0, m.box[1] - 40); await page.screenshot({ path: `${outdir}/${tag}-${theme}-${vw}-${name}.png`, clip: { x, y, width: Math.min(m.box[2] + 120, vw - x), height: m.box[3] + 80 } }); } };
  await shot('1-reading');
  await page.evaluate(() => window.__kettle.finish()); await page.waitForTimeout(700);
  await shot('2-whistle-cheering');
  await page.waitForFunction(() => location.hash.includes('done'), null, { timeout: 30000 }).catch(() => {}); await page.waitForTimeout(2800);
  await shot('3-summary-cheering');
  const tea = page.getByRole('button', { name: /tea time/i }).first();
  if (await tea.count()) { await tea.click().catch(() => {}); await page.waitForTimeout(2500); }
  await shot('4-break-sipping');
  await ctx.close();
}
await browser.close();
fs.writeFileSync(`${outdir}/fp-${tag}-${theme}.json`, JSON.stringify(res, null, 1)); console.log('ok', tag, theme);
