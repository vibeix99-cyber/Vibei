// Footprint + baseline of Chai (reading, sipping, cheering) per place, on a dev server. Usage:
//   node measure-footprint.mjs <baseURL> <out.json>
// Run once on the BEFORE server and once on the AFTER server; compare with compare-footprint.mjs.
// The ink box is the alpha > 8 box of the decoded image, mapped into CSS px through the image's own rect.
import { createRequire } from 'node:module';
import fs from 'node:fs';
const require = createRequire('/home/user/wt/w9c/kettle/package.json');
const { chromium } = require('@playwright/test');
const [base, out] = process.argv.slice(2);

const inkOf = async (page, sel) =>
  page.evaluate(async (sel) => {
    const img = document.querySelector(sel);
    if (!img) return null;
    if (!img.complete) await img.decode().catch(() => {});
    const r = img.getBoundingClientRect();
    const c = document.createElement('canvas');
    c.width = img.naturalWidth; c.height = img.naturalHeight;
    const g = c.getContext('2d'); g.drawImage(img, 0, 0);
    const d = g.getImageData(0, 0, c.width, c.height).data;
    let x0 = 1e9, y0 = 1e9, x1 = -1, y1 = -1;
    for (let y = 0; y < c.height; y++) for (let x = 0; x < c.width; x++) if (d[(y * c.width + x) * 4 + 3] > 8) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
    const sx = r.width / c.width, sy = r.height / c.height;
    const box = img.closest('[data-pose]');
    const wrap = img.parentElement.getBoundingClientRect();
    return {
      src: img.currentSrc.split('/').pop().split('?')[0], natural: [c.width, c.height],
      img: [r.left, r.top, r.right, r.bottom].map((v) => +v.toFixed(2)),
      wrapper: [wrap.left, wrap.top, wrap.right, wrap.bottom].map((v) => +v.toFixed(2)),
      ink: [r.left + x0 * sx, r.top + y0 * sy, r.left + (x1 + 1) * sx, r.top + (y1 + 1) * sy].map((v) => +v.toFixed(2)),
      pose: box?.dataset.pose,
    };
  }, sel);

const res = {};
const browser = await chromium.launch({ args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader', '--ignore-gpu-blocklist'] });
for (const [vw, vh] of [[390, 844], [1440, 900]]) {
  const ctx = await browser.newContext({ viewport: { width: vw, height: vh }, reducedMotion: 'reduce', deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  const key = `${vw}x${vh}`;
  res[key] = {};
  // 1. Kit gallery: every Mascot size used by a screen, for the three poses.
  const sizes = [72, 76, 84, 88, 108, 112, 120, 148, 152, 168, 200, 186];
  for (const pose of ['focus', 'sip', 'cheer']) {
    for (const size of sizes) {
      await page.goto(`${base}/?debug&theme=dark&motion=reduce#/kit?part=art&view=pose&pose=${pose}&size=${size}`);
      await page.waitForSelector('img[draggable="false"]');
      await page.waitForTimeout(250);
      res[key][`kit ${pose} @${size}`] = await inkOf(page, '[data-pose] img');
    }
  }
  // 2. Settings > About (Mascot sip 72).
  await page.goto(`${base}/?debug&seed=veteran&theme=dark&motion=reduce#/settings`);
  await page.waitForTimeout(1200);
  res[key]['settings about sip @72'] = await inkOf(page, 'img[src*="chai-sipping"]');
  // 3. Focus stage: running (reading), whistle + summary (cheering), break (sipping); Home hero while live.
  await page.goto(`${base}/?debug&seed=veteran&theme=dark&motion=reduce#/`);
  await page.waitForFunction(() => window.__kettle?.timerInfo?.().leader, null, { timeout: 60000 }).catch(() => {});
  await page.evaluate(() => window.__kettle.settings.getState().set({ muted: true, autoStartBreaks: false, autoStartFocus: false }));
  await page.waitForTimeout(1000);
  await page.getByRole('button', { name: /put the kettle on/i }).first().click();
  await page.waitForFunction(() => location.hash === '#/focus');
  await page.waitForTimeout(1500);
  res[key]['focus stage reading (running)'] = await inkOf(page, '[data-stage-figure="chai"] img');
  await page.evaluate(() => window.__kettle.navigate('/'));
  await page.waitForTimeout(1800);
  res[key]['home hero (brew live)'] = await inkOf(page, '[data-part] [data-pose] img');
  await page.evaluate(() => window.__kettle.navigate('/focus'));
  await page.waitForTimeout(800);
  await page.evaluate(() => window.__kettle.finish());
  await page.waitForTimeout(600);
  res[key]['focus stage whistle'] = await inkOf(page, '[data-stage-figure="chai"] img');
  await page.waitForFunction(() => location.hash.includes('done'), null, { timeout: 30000 }).catch(() => {});
  await page.waitForTimeout(2800);
  res[key]['focus stage summary (cheering)'] = await inkOf(page, '[data-stage-figure="chai"] img');
  // break: the summary's Tea time button
  const tea = page.getByRole('button', { name: /tea time/i }).first();
  if (await tea.count()) { await tea.click().catch(() => {}); await page.waitForTimeout(2500); }
  res[key]['focus stage break (sipping)'] = await inkOf(page, '[data-stage-figure="chai"] img');
  await page.evaluate(() => window.__kettle.navigate('/'));
  await page.waitForTimeout(1800);
  res[key]['home hero (break live)'] = await inkOf(page, '[data-part] [data-pose] img');
  await ctx.close();
}
await browser.close();
fs.writeFileSync(out, JSON.stringify(res, null, 1));
console.log('wrote', out, Object.values(res).reduce((n, o) => n + Object.keys(o).length, 0), 'places');
