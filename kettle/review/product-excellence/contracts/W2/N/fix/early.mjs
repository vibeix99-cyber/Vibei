// Fix round (Maker N): early Focus-backdrop frames after the brew tap, 390×844@3 light, cold cache, CPU 4×.
// (a) natural: screenshots as fast as the page allows for 3 s; (b) base still held back 2.5 s (slow file), then released.
// node early.mjs --base http://127.0.0.1:5233 --label old --out <dir>
import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';

const args = Object.fromEntries(process.argv.slice(2).reduce((a, x, i, all) => (x.startsWith('--') && a.push([x.slice(2), all[i + 1]]), a), []));
const dir = `${args.out}/${args.label}`;
mkdirSync(dir, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const b = await chromium.launch({ args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader', '--ignore-gpu-blocklist'] });
const log = [];
for (const mode of ['natural', 'held']) {
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true, colorScheme: 'light', timezoneId: 'UTC', locale: 'en-GB', serviceWorkers: 'block' });
  const p = await ctx.newPage();
  const cdp = await ctx.newCDPSession(p);
  await cdp.send('Network.enable');
  await cdp.send('Network.setCacheDisabled', { cacheDisabled: true });
  let release = () => {};
  if (mode === 'held') {
    const held = new Promise((r) => (release = r));
    await p.route(/window-[a-z]+-[a-z]+-[\w-]+\.webp/, async (route) => { await held; await route.continue().catch(() => {}); });
  }
  await p.goto(`${args.base}/?debug&seed=veteran&theme=light#/`);
  await p.waitForFunction(() => { const t = window.__kettle?.timerInfo?.(); return !!(t && t.leader && t.leaderForMs > 400 && !t.settling); }, null, { timeout: 90_000 });
  await p.evaluate(() => window.__kettle.settings.getState().set({ muted: true, autoStartBreaks: false, autoStartFocus: false }));
  await sleep(1200);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
  const bb = await p.getByRole('button', { name: /put the kettle on/i }).first().boundingBox();
  const t0 = Date.now();
  await p.touchscreen.tap(bb.x + bb.width / 2, bb.y + bb.height / 2);
  const state = () => p.evaluate(() => { const h = document.querySelector('[data-scene-mode="window"]'); const i = h?.querySelector('img'); return { layers: h ? h.querySelectorAll('svg[data-window-items] image').length : 0, stillLoaded: !!(i && i.complete && i.naturalWidth > 0), still: !!i }; }).catch(() => null);
  if (mode === 'natural') {
    for (let k = 0; k < 8 && Date.now() - t0 < 3500; k++) {
      const s = await state();
      const ms = Date.now() - t0;
      await p.screenshot({ path: `${dir}/natural-${String(k).padStart(2, '0')}-${ms}ms.png`, clip: { x: 0, y: 0, width: 390, height: 420 } });
      log.push({ mode, k, ms, ...s });
    }
  } else {
    await sleep(1200);
    const s1 = await state();
    await p.screenshot({ path: `${dir}/held-still-pending.png`, clip: { x: 0, y: 0, width: 390, height: 420 } });
    log.push({ mode, shot: 'still pending', ms: Date.now() - t0, ...s1 });
    release();
    await sleep(2500);
    const s2 = await state();
    await p.screenshot({ path: `${dir}/held-released.png`, clip: { x: 0, y: 0, width: 390, height: 420 } });
    log.push({ mode, shot: 'released', ms: Date.now() - t0, ...s2 });
  }
  await ctx.close();
}
writeFileSync(`${dir}/early.json`, JSON.stringify(log, null, 1));
console.log(args.label, JSON.stringify(log));
await b.close();
