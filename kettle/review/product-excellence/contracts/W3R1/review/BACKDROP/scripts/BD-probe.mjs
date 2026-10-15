// BD-probe.mjs: the capture.mjs flow for state 13 (first visit, 390x844@2 dark: welcome, Start a 15-min brew, wait 3 s, screenshot),
// repeated --n times (one fresh browser each), with in-page timestamps: when the scene became ready after the click.
// usage: LANE_D_FIXED_ISO=... node --import BD-freeze.mjs BD-probe.mjs --base URL --out DIR --n 8 [--w 390 --h 844 --dpr 2 --theme dark] [--pre12] [--wait 3000]
import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';
const args = Object.fromEntries(process.argv.slice(2).reduce((acc, a, i, all) => { if (a.startsWith('--')) acc.push([a.slice(2), all[i + 1] && !all[i + 1].startsWith('--') ? all[i + 1] : '1']); return acc; }, []));
const base = args.base, out = args.out, N = +(args.n ?? 5), W = +(args.w ?? 390), H = +(args.h ?? 844), DPR = +(args.dpr ?? 2), theme = args.theme ?? 'dark';
const WAIT = +(args.wait ?? 3000), PRE12 = args.pre12 === '1', TAG = args.tag ?? 'p';
mkdirSync(out, { recursive: true });
const phone = W < 900 && W < H;
const rows = [];
for (let i = 1; i <= N; i++) {
  const b = await chromium.launch({ args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader', '--ignore-gpu-blocklist'] });
  const mk = () => b.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: DPR, isMobile: phone, hasTouch: W < 900, colorScheme: theme, reducedMotion: 'no-preference' });
  let ctx = await mk(); ctx = await mk();
  const p = await ctx.newPage();
  await p.addInitScript(() => {
    const bd = (window.__bd = { t0: null, ready: null, nook: null, coverGone: null, loadAt: performance.now() });
    document.addEventListener('click', () => { if (bd.t0 == null) bd.t0 = performance.now(); }, true);
    const tick = () => {
      const now = performance.now();
      const host = document.querySelector('[data-scene-ready]');
      if (host && host.getAttribute('data-scene-ready') === 'true' && bd.ready == null) bd.ready = now;
      if (window.__nook && bd.nook == null) bd.nook = now;
      if (host && bd.ready != null && bd.coverGone == null && host.querySelectorAll(':scope > div[aria-hidden]').length === 1) bd.coverGone = now;
    };
    setInterval(tick, 15);
  });
  const t00 = Date.now();
  await p.goto(`${base}/?debug&seed=fresh&theme=${theme}#/welcome`, { waitUntil: 'networkidle' });
  await p.evaluate(() => document.fonts.ready);
  await p.evaluate(() => window.__kettle.settings.getState().set({ autoStartBreaks: false, muted: true }));
  await p.waitForTimeout(1200);
  if (PRE12) await p.screenshot({ path: `${out}/${TAG}${i}-12.png`, timeout: 240000 });
  await p.getByRole('button', { name: /Start a 15-min brew/ }).click();
  const rc0 = Date.now();
  let readyReal = null;
  for (let t = 0; t < WAIT; t += 100) {
    await p.waitForTimeout(100);
    if (readyReal == null && (await p.evaluate(() => window.__bd.ready != null))) readyReal = Date.now() - rc0;
  }
  const shotReal = Date.now() - rc0;
  const at = await p.evaluate(() => {
    const bd = window.__bd, now = performance.now();
    const timer = [...document.querySelectorAll('*')].find((e) => /^\d\d:\d\d$/.test(e.textContent?.trim() ?? '') && e.children.length === 0)?.textContent;
    const host = document.querySelector('[data-scene-ready]');
    const cv = host?.querySelector('canvas');
    const op = cv?.parentElement ? getComputedStyle(cv.parentElement).opacity : null;
    return { sinceClick: Math.round(now - bd.t0), ready: bd.ready == null ? null : Math.round(bd.ready - bd.t0), nook: bd.nook == null ? null : Math.round(bd.nook - bd.t0), coverGone: bd.coverGone == null ? null : Math.round(bd.coverGone - bd.t0), timer, canvasOpacity: op, readyAttr: host?.getAttribute('data-scene-ready') };
  });
  await p.screenshot({ path: `${out}/${TAG}${i}-13.png`, timeout: 240000 });
  const shotDone = Date.now() - rc0;
  for (let t = 0; readyReal == null && t < 20000; t += 100) {
    await p.waitForTimeout(100);
    if (await p.evaluate(() => window.__bd.ready != null)) readyReal = Date.now() - rc0;
  }
  const after = await p.evaluate(() => { const bd = window.__bd; return { ready: bd.ready == null ? null : Math.round(bd.ready - bd.t0), nook: bd.nook == null ? null : Math.round(bd.nook - bd.t0), coverGone: bd.coverGone == null ? null : Math.round(bd.coverGone - bd.t0), sinceClick: Math.round(performance.now() - bd.t0) }; });
  const row = { i, load: (await import('node:fs')).readFileSync('/proc/loadavg', 'utf8').split(' ')[0], readyReal, shotReal, shotDone, at3s: at, afterShot: after, wallS: Math.round((Date.now() - t00) / 100) / 10 };
  rows.push(row);
  console.log(JSON.stringify(row));
  await b.close();
}
writeFileSync(`${out}/${TAG}-probe.json`, JSON.stringify(rows, null, 1));
