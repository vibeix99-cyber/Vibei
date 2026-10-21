// Does a resize during a pose change paint an empty canvas? A later ResizeObserver sees the canvas as it will be painted.
import { chromium, OUT, boot } from './common.mjs';
import fs from 'node:fs';
const [base, theme] = process.argv.slice(2);
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
const page = await ctx.newPage();
await boot(page, base, `&theme=${theme}`);
await page.evaluate(() => {
  window.__ro = []; const seen = new WeakSet();
  const inkOf = (c) => { const t = document.createElement('canvas'); t.width = 40; t.height = 48; const g = t.getContext('2d'); g.drawImage(c, 0, 0, 40, 48); const d = g.getImageData(0, 0, 40, 48).data; let n = 0; for (let i = 3; i < d.length; i += 4) if (d[i] > 16) n++; return n; };
  const attach = () => document.querySelectorAll('canvas[data-rive-chai]').forEach((c) => {
    if (seen.has(c)) return; seen.add(c);
    // registered after LiveChai's observer -> its callback runs after LiveChai's resize, right before paint
    new ResizeObserver(() => { const img = c.parentElement.querySelector('img'); window.__ro.push([Math.round(performance.now()), c.dataset.riveChai, c.width + 'x' + c.height, inkOf(c), getComputedStyle(img).visibility]); }).observe(c);
  });
  new MutationObserver(attach).observe(document.body, { childList: true, subtree: true }); attach();
});
await page.getByRole('button', { name: /put the kettle on/i }).first().click();
await page.waitForFunction(() => location.hash === '#/focus'); await page.waitForTimeout(2500);
const mark = async (k) => page.evaluate((k) => window.__ro.push([Math.round(performance.now()), 'MARK ' + k]), k);
await mark('finish'); await page.evaluate(() => window.__kettle.finish());
await page.waitForFunction(() => location.hash.includes('done'), null, { timeout: 30000 }); await page.waitForTimeout(3000);
await mark('break'); await page.getByRole('button', { name: /Tea time|Long tea break/ }).first().click(); await page.waitForTimeout(3000);
const ro = await page.evaluate(() => window.__ro);
const painted = ro.filter((r) => r.length > 2);
const blank = painted.filter((r) => r[3] === 0 && r[4] === 'hidden');
console.log(ro.map((r) => r.join(' ')).join('\n'));
console.log(`RO frames ${painted.length}; painted EMPTY while image hidden: ${blank.length}`);
fs.writeFileSync(`${OUT}/p3-resize-blank-${theme}.json`, JSON.stringify({ ro, blankPaintedFrames: blank.length }, null, 0));
await b.close();
