import { chromium } from 'playwright';
import { writeFileSync, mkdirSync } from 'node:fs';
const OUT = '.tmp/verify/raw'; mkdirSync(OUT, { recursive: true });
const BUILDS = { before: 'http://localhost:5201', after: 'http://localhost:5202' };
const ONLY_TX = process.argv[2] === 'tx';
const SHOTS = ONLY_TX ? [] : [
  { id: 'today-768', w: 768, h: 1024, route: '/' },
  { id: 'stats-768', w: 768, h: 1024, route: '/stats' },
  { id: 'settings-land', w: 844, h: 390, route: '/settings', mobile: true },
  { id: 'today-607', w: 607, h: 900, route: '/' },
  { id: 'stats-607', w: 607, h: 900, route: '/stats' },
];
const b = await chromium.launch({ args: ONLY_TX ? ['--disable-3d-apis'] : ['--enable-unsafe-swiftshader', '--use-angle=swiftshader', '--ignore-gpu-blocklist'] });
const meta = ONLY_TX ? JSON.parse((await import('node:fs')).readFileSync(`${OUT}/meta.json`,'utf8')) : {};
for (const [name, base] of Object.entries(BUILDS)) {
  for (const s of SHOTS) {
    const ctx = await b.newContext({ viewport: { width: s.w, height: s.h }, deviceScaleFactor: 1, isMobile: !!s.mobile, hasTouch: !!s.mobile, serviceWorkers: 'block' });
    const p = await ctx.newPage();
    await p.goto(`${base}/?debug&seed=veteran&theme=light#${s.route}`, { waitUntil: 'networkidle' });
    await p.waitForFunction(() => '__kettle' in window);
    await p.waitForTimeout(2500);
    const iw = await p.evaluate(() => `${innerWidth}×${innerHeight}`);
    meta[`${name}-${s.id}`] = iw;
    await p.screenshot({ path: `${OUT}/${name}-${s.id}.png` });
    await ctx.close();
  }
  // Home → Focus transition at phone size, screencast frames timed from the click
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, serviceWorkers: 'block' });
  const p = await ctx.newPage();
  await p.goto(`${base}/?debug&seed=veteran&theme=light#/`, { waitUntil: 'networkidle' });
  await p.waitForFunction(() => '__kettle' in window);
  await p.getByRole('textbox', { name: /what are you brewing/i }).fill('Chapter 3 notes');
  await p.waitForTimeout(1500);
  meta[`${name}-transition`] = await p.evaluate(() => `${innerWidth}×${innerHeight}`);
  const cdp = await ctx.newCDPSession(p);
  const frames = [];
  cdp.on('Page.screencastFrame', async (f) => { frames.push({ t: f.metadata.timestamp * 1000, data: f.data }); await cdp.send('Page.screencastFrameAck', { sessionId: f.sessionId }).catch(() => {}); });
  await cdp.send('Page.startScreencast', { format: 'png', everyNthFrame: 1 });
  await p.waitForTimeout(300);
  const t0 = await p.evaluate(() => new Promise((r) => { const btn = [...document.querySelectorAll('button')].find((x) => /put the kettle on/i.test(x.textContent || x.getAttribute('aria-label') || '')); r(Date.now()); btn.click(); }));
  await p.waitForTimeout(1500);
  await cdp.send('Page.stopScreencast');
  const tl = [];
  for (const f of frames) { const dt = Math.round(f.t - t0); if (dt < -40 || dt > 1200) continue; writeFileSync(`${OUT}/${name}-tx-${dt}.png`, Buffer.from(f.data, 'base64')); tl.push(dt); }
  meta[`${name}-tx-frames`] = tl.join(',');
  meta[`${name}-webgl`] = await p.evaluate(() => !!document.createElement('canvas').getContext('webgl2'));
  await ctx.close();
}
writeFileSync(`${OUT}/meta.json`, JSON.stringify(meta, null, 1));
console.log(JSON.stringify(meta, null, 1));
await b.close();
