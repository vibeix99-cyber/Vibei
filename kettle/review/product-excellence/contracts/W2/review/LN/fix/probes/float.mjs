// Lane N · fix re-check: do item layers paint before the base window still has painted at brew start?
// node float.mjs --base URL --label NAME --cfg 390x844@3 --starts 5 --cpus 4,4,6,6,6 --mode auto|off --out DIR
// Fresh context per start (cold HTTP cache) + CDP Network.setCacheDisabled + CDP CPU throttle from before navigation. No Playwright clock (real epoch times, aligned with screencast timestamps).
import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';
const A = Object.fromEntries(process.argv.slice(2).reduce((a, x, i, all) => (x.startsWith('--') && a.push([x.slice(2), all[i + 1]]), a), []));
const m = A.cfg.match(/^(\d+)x(\d+)@(\d+)$/); const [W, H, DPR] = [+m[1], +m[2], +m[3]];
const starts = +(A.starts || 5); const cpus = (A.cpus || '6').split(',').map(Number); const mode = A.mode || 'auto';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
mkdirSync(A.out, { recursive: true });
const INIT = () => {
  const rec = (window.__fl = { tap: null, ev: [], floatFrames: 0, floatFirst: null, floatLast: null, framesAfterHost: 0, layerFramesTotal: 0 });
  addEventListener('click', () => { if (rec.tap === null) rec.tap = Date.now(); }, true);
  let last = '';
  const loop = () => {
    const h = document.querySelector('[data-scene-mode="window"]');
    let key = 'nohost', l = 0, ok = null, present = false;
    if (h) {
      l = h.querySelectorAll('image[data-item]').length; const i = h.querySelector('img'); present = !!i; ok = i ? i.complete && i.naturalWidth > 0 : null;
      key = `${l}|${present}|${ok}|${h.getAttribute('data-scene-ready')}`;
      rec.framesAfterHost++;
      if (l > 0) { rec.layerFramesTotal++; if (!ok) { rec.floatFrames++; const t = Date.now(); if (rec.floatFirst === null) rec.floatFirst = t; rec.floatLast = t; } }
    }
    if (key !== last) { const r = h ? h.getBoundingClientRect() : null; rec.ev.push([Date.now(), h ? 1 : 0, l, present, ok, h ? h.getAttribute('data-scene-ready') : null, r ? [Math.round(r.x), Math.round(r.y), Math.round(r.width), Math.round(r.height)] : null]); last = key; }
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
};
const b = await chromium.launch({ args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader', '--ignore-gpu-blocklist'] });
const out = { base: A.base, label: A.label, cfg: A.cfg, mode, starts: [] };
for (let i = 0; i < starts; i++) {
  const cpu = cpus[i % cpus.length]; const s = { i: i + 1, cpu, mode, t0: new Date().toISOString() };
  const ctx = await b.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: DPR, isMobile: W < 900, hasTouch: W < 900, colorScheme: 'light', timezoneId: 'UTC', locale: 'en-GB', serviceWorkers: 'block' });
  await ctx.addInitScript(INIT);
  const p = await ctx.newPage(); const cdp = await ctx.newCDPSession(p);
  const frames = [];
  cdp.on('Page.screencastFrame', (f) => { frames.push({ ts: f.metadata.timestamp * 1000, data: f.data }); cdp.send('Page.screencastFrameAck', { sessionId: f.sessionId }).catch(() => {}); });
  try {
    await cdp.send('Network.enable'); await cdp.send('Network.setCacheDisabled', { cacheDisabled: true });
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: cpu });
    const url = `${A.base}/?debug&seed=veteran&theme=light#/`;
    await p.goto(url, { waitUntil: 'commit' });
    await p.waitForFunction(() => !!window.__kettle, null, { timeout: 120_000, polling: 100 });
    await p.evaluate(() => window.__kettle.settings.getState().set({ muted: true, autoStartBreaks: false, autoStartFocus: false }));
    if (mode === 'off') {
      await p.evaluate(() => window.__kettle.settings.getState().set({ scene: 'off' }));
      await p.reload({ waitUntil: 'commit' });
      await p.waitForFunction(() => !!window.__kettle, null, { timeout: 120_000, polling: 100 });
    }
    const btn = p.getByRole('button', { name: /put the kettle on/i }).first(); await btn.waitFor({ timeout: 120_000 });
    await cdp.send('Page.startScreencast', { format: 'jpeg', quality: 70, maxWidth: Math.min(W * DPR, 700), maxHeight: Math.min(H * DPR, 900), everyNthFrame: 1 });
    s.tapReal = Date.now();
    if (W < 900) await btn.tap({ timeout: 60_000 }); else await btn.click({ timeout: 60_000 });
    await sleep(Number(A.hold || 9000));
    await cdp.send('Page.stopScreencast');
    s.fl = await p.evaluate(() => window.__fl);
    s.hash = await p.evaluate(() => location.hash);
  } catch (e) { s.err = e.message.slice(0, 200); }
  s.frameCount = frames.length;
  writeFileSync(`${A.out}/${A.label}-${A.cfg}-${mode}-s${i + 1}.frames.json`, JSON.stringify(frames));
  out.starts.push(s);
  await ctx.close();
  console.log(A.label, A.cfg, mode, 'start', i + 1, 'cpu', cpu, 'float frames', s.fl?.floatFrames, 'layer frames', s.fl?.layerFramesTotal, 'frames', frames.length, s.err || '');
}
writeFileSync(`${A.out}/${A.label}-${A.cfg}-${mode}.json`, JSON.stringify(out, null, 1));
await b.close();
