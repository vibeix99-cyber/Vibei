// Spot captures + PWA check on the vite preview of the C2 build. Usage: node capture-checks.mjs <previewURL> <outDir>
import { createRequire } from 'node:module';
import fs from 'node:fs';
const require = createRequire('/home/user/wt/w9c/kettle/package.json');
const { chromium } = require('@playwright/test');
const [base, out] = process.argv.slice(2);
fs.mkdirSync(out, { recursive: true });
const log = [];
const browser = await chromium.launch({ args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader', '--ignore-gpu-blocklist'] });
for (const [vw, vh] of [[390, 844], [1440, 900]]) {
  const ctx = await browser.newContext({ viewport: { width: vw, height: vh }, reducedMotion: 'reduce', deviceScaleFactor: 2 });
  let page = await ctx.newPage();
  await page.goto(`${base}/?debug&seed=veteran&theme=dark&motion=reduce#/`);
  await page.waitForFunction(() => window.__kettle, null, { timeout: 90000 });
  await page.waitForFunction(() => window.__kettle?.timerInfo?.().leader, null, { timeout: 60000 }).catch(() => {});
  await page.evaluate(() => window.__kettle.settings.getState().set({ muted: true, autoStartBreaks: false, autoStartFocus: false }));
  await page.waitForTimeout(1000);
  // PWA: service worker ready, the three poses precached
  const pwa = await page.evaluate(async () => {
    const reg = await Promise.race([navigator.serviceWorker.ready, new Promise((r) => setTimeout(() => r(null), 20000))]);
    const names = await caches.keys();
    const urls = [];
    for (const n of names) for (const r of await (await caches.open(n)).keys()) if (/chai-(reading|sipping|cheering)-/.test(r.url)) urls.push(r.url.split('/').pop());
    return { sw: !!reg, caches: names, chai: urls };
  });
  log.push({ vw, pwa });
  await page.getByRole('button', { name: /put the kettle on/i }).first().click();
  await page.waitForFunction(() => location.hash === '#/focus');
  await page.waitForTimeout(1800);
  await page.screenshot({ path: `${out}/focus-reading-${vw}-dark.png` });
  await page.evaluate(() => window.__kettle.finish());
  await page.waitForTimeout(900);
  await page.screenshot({ path: `${out}/focus-whistle-cheering-${vw}-dark.png` });
  await page.waitForFunction(() => location.hash.includes('done'), null, { timeout: 30000 }).catch(() => {});
  await page.waitForTimeout(2800);
  const tea = page.getByRole('button', { name: /tea time/i }).first();
  if (await tea.count()) { await tea.click().catch(() => {}); await page.waitForTimeout(2500); }
  await page.screenshot({ path: `${out}/focus-break-sipping-${vw}-dark.png` });
  if (vw === 1440) {
    // offline: the precache must serve the poses
    await ctx.setOffline(true);
    const p2 = await ctx.newPage();
    await p2.goto(`${base}/?debug&theme=dark&motion=reduce#/kit?part=art&view=chai&size=300`).catch((e) => log.push({ offlineGoto: String(e).slice(0, 120) }));
    await p2.waitForSelector('span[data-pose="focus"] img', { timeout: 30000 }).catch(() => {});
    const off = await p2.evaluate(() => ['focus', 'sip', 'cheer'].map((p) => { const i = document.querySelector(`span[data-pose="${p}"] img`); return i ? [p, i.complete, i.naturalWidth, i.naturalHeight] : [p, null]; }));
    log.push({ offline: off });
    await ctx.setOffline(false);
    await p2.close();
  }
  // edge close-up: 3 poses big, dark theme, DPR 3
  await ctx.close();
}
{
  const ctx = await browser.newContext({ viewport: { width: 1100, height: 760 }, reducedMotion: 'reduce', deviceScaleFactor: 3 });
  const page = await ctx.newPage();
  await page.goto(`${base}/?debug&theme=dark&motion=reduce#/kit?part=art&view=chai&size=560`);
  await page.waitForSelector('span[data-pose="focus"] img');
  await page.waitForTimeout(800);
  for (const [pose, name] of [['focus', 'reading'], ['sip', 'sipping'], ['cheer', 'cheering']]) {
    const el = page.locator(`span[data-pose="${pose}"] img`);
    await el.scrollIntoViewIfNeeded();
    await el.screenshot({ path: `${out}/pose-${name}-dark-560-dpr3.png` });
    const b = await el.boundingBox();
    await page.screenshot({ path: `${out}/edge-${name}-feet-dark.png`, clip: { x: b.x, y: b.y + b.height - 90, width: Math.min(b.width, 340), height: 90 } });
    await page.screenshot({ path: `${out}/edge-${name}-top-dark.png`, clip: { x: b.x + b.width * 0.25, y: b.y, width: Math.min(b.width * 0.6, 300), height: 120 } });
  }
  await ctx.close();
}
await browser.close();
fs.writeFileSync(`${out}/pwa-check.json`, JSON.stringify(log, null, 1));
console.log(JSON.stringify(log));
