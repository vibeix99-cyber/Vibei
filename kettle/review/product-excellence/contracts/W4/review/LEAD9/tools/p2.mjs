// summary -> break dense sampling (blank Chai?) args: base theme
import { chromium, OUT, boot, state } from './common.mjs';
import fs from 'node:fs';
const [base, theme, tag = ''] = process.argv.slice(2);
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
const page = await ctx.newPage();
await boot(page, base, `&theme=${theme}`);
await page.getByRole('button', { name: /put the kettle on/i }).first().click();
await page.waitForFunction(() => location.hash === '#/focus'); await page.waitForTimeout(2500);
await page.evaluate(() => window.__kettle.finish());
await page.waitForFunction(() => location.hash.includes('done'), null, { timeout: 30000 }); await page.waitForTimeout(3000);
// install rAF sampler in page
await page.evaluate(() => {
  window.__samp = []; const t0 = performance.now();
  const tick = () => {
    const sp = document.querySelector('[data-stage-figure=chai] [data-pose]'); const c = sp?.querySelector('canvas'); const img = sp?.querySelector('img');
    let ink = -1; if (c && c.width > 1) { const t = document.createElement('canvas'); t.width = 40; t.height = 48; const g = t.getContext('2d'); g.drawImage(c, 0, 0, 40, 48); const d = g.getImageData(0, 0, 40, 48).data; ink = 0; for (let i = 3; i < d.length; i += 4) if (d[i] > 16) ink++; }
    window.__samp.push([Math.round(performance.now() - t0), sp?.dataset.pose, sp?.dataset.chaiRender, img && getComputedStyle(img).visibility, c ? c.width + 'x' + c.height : '-', ink, c?.dataset.running !== undefined, c ? sp.contains(c) : null]);
    if (performance.now() - t0 < 4000) requestAnimationFrame(tick);
  }; requestAnimationFrame(tick);
});
await page.getByRole('button', { name: /Tea time|Long tea break/ }).first().click();
await page.waitForTimeout(4300);
const s = await page.evaluate(() => window.__samp);
// compress: print changes only
let prev = ''; const out = [];
for (const r of s) { const k = JSON.stringify(r.slice(1)); if (k !== prev) { out.push(r); prev = k; } }
console.log(out.map((r) => r.join(' ')).join('\n'));
const blank = s.filter((r) => (r[3] === 'hidden') && (r[5] === 0 || r[5] === -1));
console.log('blank frames (img hidden & canvas empty):', blank.length, blank.length ? `${blank[0][0]}..${blank.at(-1)[0]} ms` : '');
fs.writeFileSync(`${OUT}/p2-summary-to-break-${theme}${tag}.json`, JSON.stringify({ changes: out, blankFrames: blank.length, blank }, null, 0));
await b.close();
