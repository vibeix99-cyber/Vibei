// break -> over (stretch, painted) -> next focus (reading): compositor frames; is Chai ever missing?
import { chromium, OUT, boot } from './common.mjs';
import fs from 'node:fs';
const [base, theme] = process.argv.slice(2);
const dir = `${OUT}/screencast-over-${theme}`; fs.mkdirSync(dir, { recursive: true });
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
const page = await ctx.newPage();
await boot(page, base, `&theme=${theme}`);
await page.getByRole('button', { name: /put the kettle on/i }).first().click();
await page.waitForFunction(() => location.hash === '#/focus'); await page.waitForTimeout(1500);
await page.evaluate(() => window.__kettle.finish());
await page.waitForFunction(() => location.hash.includes('done'), null, { timeout: 30000 }); await page.waitForTimeout(2000);
await page.getByRole('button', { name: /Tea time|Long tea break/ }).first().click(); await page.waitForTimeout(3000);
await page.evaluate(() => window.__kettle.finish()); await page.waitForTimeout(2500);
console.log('pose now', await page.evaluate(() => document.querySelector('[data-stage-figure=chai] [data-pose]')?.dataset.pose));
const cdp = await ctx.newCDPSession(page);
const frames = []; let rec = false;
cdp.on('Page.screencastFrame', async (f) => { if (rec) frames.push({ ts: f.metadata.timestamp, data: f.data }); await cdp.send('Page.screencastFrameAck', { sessionId: f.sessionId }).catch(() => {}); });
await cdp.send('Page.startScreencast', { format: 'png', everyNthFrame: 1 });
await page.waitForTimeout(300); rec = true;
await page.getByRole('button', { name: /put the kettle on/i }).first().click(); await page.waitForTimeout(1000); rec = false;
await cdp.send('Page.stopScreencast');
console.log('pose after', await page.evaluate(() => { const sp = document.querySelector('[data-stage-figure=chai] [data-pose]'); return sp?.dataset.pose + '/' + sp?.dataset.chaiRender; }));
const an = await ctx.newPage(); const res = [];
for (const [i, f] of frames.entries()) {
  const name = `f-${String(i).padStart(3, '0')}.png`; fs.writeFileSync(`${dir}/${name}`, Buffer.from(f.data, 'base64'));
  const n = await an.evaluate(async (u) => { const im = new Image(); im.src = u; await im.decode(); const c = document.createElement('canvas'); c.width = im.width; c.height = im.height; const g = c.getContext('2d'); g.drawImage(im, 0, 0); const d = g.getImageData(230, 230, 120, 120).data; let k = 0; for (let j = 0; j < d.length; j += 4) { const [r, gg, bb] = [d[j], d[j + 1], d[j + 2]]; if (r > 150 && r < 225 && gg > 95 && gg < 160 && bb > 55 && bb < 120 && r - bb > 70) k++; } return k; }, 'data:image/png;base64,' + f.data);
  res.push([i, n, name]);
}
console.log(res.map((r) => r.join(' ')).join('\n'));
fs.writeFileSync(`${dir}/analysis.json`, JSON.stringify(res));
await b.close();
