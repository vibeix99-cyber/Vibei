// Mapping spot-checks: Home hero, Settings, Welcome walk; swap-moment frames on the Kit (sip, cheer @168).
import { chromium, OUT, CDN, boot } from './common.mjs';
import fs from 'node:fs';
const base = process.argv[2];
const b = await chromium.launch();
const all = (page) => page.evaluate(() => [...document.querySelectorAll('[data-chai-render]')].map((e) => { const r = e.getBoundingClientRect(); return `${e.dataset.pose}/${e.dataset.chaiRender}@${Math.round(r.width)}x${Math.round(r.height)}`; }));
const res = {};
{ // Home + Settings
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  const page = await ctx.newPage(); const reqs = []; page.on('request', (r) => reqs.push(r.url()));
  await boot(page, base); await page.waitForTimeout(3500);
  res.home = await all(page); await page.screenshot({ path: `${OUT}/map-home.png` });
  await page.evaluate(() => (location.hash = '#/settings')); await page.waitForTimeout(800);
  await page.evaluate(() => document.querySelector('[data-chai-render]')?.scrollIntoView({ block: 'center' })); await page.waitForTimeout(3500);
  res.settings = await all(page); await page.screenshot({ path: `${OUT}/map-settings.png` });
  res.cdnHome = reqs.filter((u) => CDN.test(u));
  await ctx.close();
}
{ // Welcome walk (fresh profile, notifications granted -> notify step cheers)
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  await ctx.grantPermissions(['notifications'], { origin: base });
  const page = await ctx.newPage();
  await page.goto(`${base}/?debug#/welcome`); await page.waitForTimeout(2500);
  await page.getByRole('button', { name: /set things up first/i }).click(); await page.waitForTimeout(500);
  res.welcome = [];
  for (let i = 0; i < 9; i++) {
    await page.waitForTimeout(3300);
    const step = await page.evaluate(() => document.querySelector('[data-step]')?.dataset.step);
    res.welcome.push({ step, chai: await all(page) }); await page.screenshot({ path: `${OUT}/map-welcome-${i}-${step}.png` });
    if (step === 'ready') break;
    const tb = page.getByRole('textbox').first(); if (step === 'name' && await tb.count()) await tb.fill('Sam');
    if (['goal', 'rhythm', 'ambience'].includes(step)) { const opt = page.locator('[role=radio], [role=option], [aria-pressed], [aria-checked]').first(); if (await opt.count()) await opt.click().catch(() => {}); }
    const btn = page.getByRole('button', { name: /^continue$/i }).last();
    if (await btn.count() && await btn.isEnabled()) await btn.click().catch(() => {}); else { console.log('stuck at', step, await page.evaluate(() => [...document.querySelectorAll('button,[role=radio]')].map((b) => b.getAttribute('role') + ':' + b.textContent.trim().slice(0, 30)).join(' | '))); break; }
  }
  console.log('welcome', JSON.stringify(res.welcome));
  await ctx.close();
}
{ // swap moment on the kit: does the image -> Rive switch jump?
  for (const pose of ['sip', 'cheer']) {
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
    const page = await ctx.newPage();
    const cdp = await ctx.newCDPSession(page); const frames = [];
    cdp.on('Page.screencastFrame', async (f) => { frames.push({ ts: f.metadata.timestamp, data: f.data, render: null }); await cdp.send('Page.screencastFrameAck', { sessionId: f.sessionId }).catch(() => {}); });
    await page.goto(`${base}/?debug#/kit?view=pose&pose=${pose}&size=168`);
    const sel = `[data-chai-render][data-pose=${pose === 'sip' ? 'sipping' : 'cheering'}]`;
    await page.waitForSelector(sel); await page.evaluate((sel) => document.querySelector(sel).scrollIntoView({ block: 'center' }), sel);
    await page.evaluate(() => { window.__swapAt = null; const t0 = performance.now(); const mo = new MutationObserver(() => { const e = document.querySelector('[data-chai-render][data-pose=sipping],[data-chai-render][data-pose=cheering]'); if (e?.dataset.chaiRender === 'rive' && window.__swapAt == null) window.__swapAt = performance.now() - t0; }); mo.observe(document.body, { attributes: true, subtree: true }); });
    await cdp.send('Page.startScreencast', { format: 'png', everyNthFrame: 1 });
    await page.waitForFunction((sel) => document.querySelector(sel)?.dataset.chaiRender === 'rive', sel, { timeout: 15000 });
    const sw = Date.now(); await page.waitForTimeout(400); await cdp.send('Page.stopScreencast');
    const rect = await page.evaluate((sel) => { const r = document.querySelector(sel).getBoundingClientRect(); return { x: Math.round(r.x - 40), y: Math.round(r.y - 30), w: Math.round(r.width + 80), h: Math.round(r.height + 40) }; }, sel);
    // keep the last 8 frames before the swap and 6 after: crop in browser
    const an = await ctx.newPage(); const keep = frames.slice(-28);
    const dir = `${OUT}/swap-${pose}`; fs.mkdirSync(dir, { recursive: true });
    for (const [i, f] of keep.entries()) fs.writeFileSync(`${dir}/f${String(i).padStart(2, '0')}.png`, Buffer.from(f.data, 'base64'));
    // sheet of all kept frames, cropped
    const sheet = await an.evaluate(async ({ urls, rect }) => { const ims = await Promise.all(urls.map(async (u) => { const im = new Image(); im.src = u; await im.decode(); return im; })); const c = document.createElement('canvas'); const cols = 7; c.width = rect.w * cols; c.height = rect.h * Math.ceil(ims.length / cols); const g = c.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height); ims.forEach((im, i) => { g.drawImage(im, rect.x, rect.y, rect.w, rect.h, (i % cols) * rect.w, Math.floor(i / cols) * rect.h, rect.w, rect.h); g.fillStyle = '#c00'; g.font = '12px sans-serif'; g.fillText(String(i), (i % cols) * rect.w + 4, Math.floor(i / cols) * rect.h + 14); }); return c.toDataURL(); }, { urls: keep.map((f) => 'data:image/png;base64,' + f.data), rect });
    fs.writeFileSync(`${OUT}/swap-${pose}-sheet.png`, Buffer.from(sheet.split(',')[1], 'base64'));
    res[`swap-${pose}`] = { swapAtMs: await page.evaluate(() => window.__swapAt), frames: frames.length };
    console.log(pose, JSON.stringify(res[`swap-${pose}`]));
    await ctx.close();
  }
}
console.log(JSON.stringify({ home: res.home, settings: res.settings, cdn: res.cdnHome }));
fs.writeFileSync(`${OUT}/p8-mapping.json`, JSON.stringify(res, null, 1));
await b.close();
