// Compositor frames (CDP screencast) through the summary -> break and focus -> whistle pose changes.
import { chromium, OUT, boot } from './common.mjs';
import fs from 'node:fs';
const [base, theme] = process.argv.slice(2);
const dir = `${OUT}/screencast-${theme}`; fs.mkdirSync(dir, { recursive: true });
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
const page = await ctx.newPage();
await boot(page, base, `&theme=${theme}`);
await page.getByRole('button', { name: /put the kettle on/i }).first().click();
await page.waitForFunction(() => location.hash === '#/focus'); await page.waitForTimeout(2500);
const cdp = await ctx.newCDPSession(page);
const frames = []; let rec = null;
cdp.on('Page.screencastFrame', async (f) => { if (rec) frames.push({ tag: rec, ts: f.metadata.timestamp, data: f.data }); await cdp.send('Page.screencastFrameAck', { sessionId: f.sessionId }).catch(() => {}); });
await cdp.send('Page.startScreencast', { format: 'png', everyNthFrame: 1 });
rec = 'whistle'; await page.evaluate(() => window.__kettle.finish()); await page.waitForTimeout(1200); rec = null;
await page.waitForFunction(() => location.hash.includes('done'), null, { timeout: 30000 }); await page.waitForTimeout(3000);
rec = 'break'; await page.getByRole('button', { name: /Tea time|Long tea break/ }).first().click(); await page.waitForTimeout(1200); rec = null;
await cdp.send('Page.stopScreencast');
// analyse each frame in the browser: count Chai-brown pixels in the Chai region
const an = await ctx.newPage();
const res = [];
for (const [i, f] of frames.entries()) {
  const name = `${f.tag}-${String(i).padStart(3, '0')}.png`; fs.writeFileSync(`${dir}/${name}`, Buffer.from(f.data, 'base64'));
  const n = await an.evaluate(async (u) => { const im = new Image(); im.src = u; await im.decode(); const c = document.createElement('canvas'); c.width = im.width; c.height = im.height; const g = c.getContext('2d'); g.drawImage(im, 0, 0); const sx = im.width / 390; const d = g.getImageData(Math.round(230 * sx), Math.round(230 * sx), Math.round(120 * sx), Math.round(120 * sx)).data; let k = 0; for (let j = 0; j < d.length; j += 4) { const [r, gg, bb] = [d[j], d[j + 1], d[j + 2]]; if (r > 150 && r < 225 && gg > 95 && gg < 160 && bb > 55 && bb < 120 && r - bb > 70) k++; } return k; }, 'data:image/png;base64,' + f.data);
  res.push([f.tag, i, +(f.ts).toFixed(3), n, name]);
}
console.log(res.map((r) => r.join(' ')).join('\n'));
fs.writeFileSync(`${dir}/analysis.json`, JSON.stringify(res));
await b.close();
