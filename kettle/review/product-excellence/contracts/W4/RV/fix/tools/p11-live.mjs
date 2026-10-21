// Before the reveal: is the canvas visible over the painted image? Kit cheer/sip @168, frames from mount.
import { chromium, OUT } from './common.mjs';
import fs from 'node:fs';
const base = process.argv[2];
const b = await chromium.launch();
for (const pose of ['focus', 'cheer']) {
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  const cdp = await ctx.newCDPSession(page); const frames = []; let t0 = null;
  cdp.on('Page.screencastFrame', async (f) => { frames.push({ ts: f.metadata.timestamp, data: f.data }); await cdp.send('Page.screencastFrameAck', { sessionId: f.sessionId }).catch(() => {}); });
  const sel = `[data-chai-render][data-pose=${pose === 'focus' ? 'reading' : 'cheering'}]`;
  // warm the runtime first so load time is not in the way, then mount a fresh one at the top of the page
  await page.goto(`${base}/?debug#/kit?view=pose&pose=${pose}&size=168`);
  await page.waitForSelector(sel); await page.evaluate((sel) => document.querySelector(sel).scrollIntoView({ block: 'center' }), sel);
  await page.waitForSelector(sel + '[data-chai-render=rive]', { timeout: 20000 }); await page.waitForTimeout(500);
  await cdp.send('Page.startScreencast', { format: 'png', everyNthFrame: 1 });
  const states = [];
  for (let i = 0; i < 12; i++) { states.push(await page.evaluate((sel) => { const e = document.querySelector(sel); const c = e.querySelector('canvas'); const img = e.querySelector('img'); return [Math.round(performance.now()), e.dataset.chaiRender, img && getComputedStyle(img).visibility, c ? getComputedStyle(c).visibility + '/' + getComputedStyle(c).opacity + '/' + c.width : 'nocanvas']; }, sel)); await page.waitForTimeout(200); }
  await cdp.send('Page.stopScreencast');
  const rect = await page.evaluate((sel) => { const r = document.querySelector(sel).getBoundingClientRect(); return { x: Math.round(r.x - 40), y: Math.round(r.y - 30), w: Math.round(r.width + 80), h: Math.round(r.height + 40) }; }, sel);
  const pick = frames.slice(10, 38); // consecutive compositor frames (30 fps Rive: a new pose every ~2 frames at 60 Hz)
  const an = await ctx.newPage();
  const sheet = await an.evaluate(async ({ urls, rect, ts }) => { const ims = await Promise.all(urls.map(async (u) => { const im = new Image(); im.src = u; await im.decode(); return im; })); const c = document.createElement('canvas'); const cols = 7; c.width = rect.w * cols; c.height = rect.h * Math.ceil(ims.length / cols); const g = c.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height); ims.forEach((im, i) => { g.drawImage(im, rect.x, rect.y, rect.w, rect.h, (i % cols) * rect.w, Math.floor(i / cols) * rect.h, rect.w, rect.h); g.fillStyle = '#c00'; g.font = '12px sans-serif'; g.fillText(String(i) + ' ' + ((ts[i] - ts[0]) * 1000).toFixed(0) + 'ms', (i % cols) * rect.w + 4, Math.floor(i / cols) * rect.h + 14); }); return c.toDataURL(); }, { urls: pick.map((f) => 'data:image/png;base64,' + f.data), rect, ts: pick.map((f) => f.ts) });
  fs.writeFileSync(`${OUT}/live30fps-${pose}-consecutive-frames.png`, Buffer.from(sheet.split(',')[1], 'base64'));
  console.log(pose, frames.length, JSON.stringify(states));
  await ctx.close();
}
await b.close();
