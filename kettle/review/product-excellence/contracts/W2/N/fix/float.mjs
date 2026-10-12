// Fix round (Maker N): do item layers ever paint without the base room still behind them at brew start?
// Cold cache (fresh context + CDP cache disabled), CPU throttled via CDP, 5 brew starts at 390×844 + 1 at 1440×900.
// Every animation frame for 4 s after the tap, in the page: layers in the backdrop vs the still's load state.
// node float.mjs --base http://127.0.0.1:5233 --label old --out <dir> [--cpu 6] [--n 5]
import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';

const args = Object.fromEntries(process.argv.slice(2).reduce((a, x, i, all) => (x.startsWith('--') && a.push([x.slice(2), all[i + 1]]), a), []));
const CPU = +(args.cpu || 6), N = +(args.n || 5);
const dir = `${args.out}/${args.label}`;
mkdirSync(dir, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const b = await chromium.launch({ args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader', '--ignore-gpu-blocklist'] });
const runs = [];
const cfgs = [...Array.from({ length: N }, () => [390, 844, 3]), [1440, 900, 2]];
for (const [i, [W, H, DPR]] of cfgs.entries()) {
  const mobile = W < 900;
  const ctx = await b.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: DPR, isMobile: mobile, hasTouch: mobile, colorScheme: 'light', timezoneId: 'UTC', locale: 'en-GB', serviceWorkers: 'block' });
  const p = await ctx.newPage();
  const cdp = await ctx.newCDPSession(p);
  await cdp.send('Network.enable');
  await cdp.send('Network.setCacheDisabled', { cacheDisabled: true });
  const shots = i === 0;
  let frames = [], wall = 0;
  if (shots) {
    cdp.on('Page.screencastFrame', (f) => {
      cdp.send('Page.screencastFrameAck', { sessionId: f.sessionId }).catch(() => {});
      const dt = Math.round((f.metadata.timestamp - wall) * 1000);
      if (dt > 4000) return;
      const name = `${W}x${H}-${String(frames.length).padStart(3, '0')}-${dt}ms.jpg`;
      frames.push({ name, dt });
      writeFileSync(`${dir}/${name}`, Buffer.from(f.data, 'base64'));
    });
  }
  const r = { i, cfg: `${W}x${H}@${DPR}`, cpu: CPU };
  try {
    await p.goto(`${args.base}/?debug&seed=veteran&theme=light#/`);
    await p.waitForFunction(() => { const t = window.__kettle?.timerInfo?.(); return !!(t && t.leader && t.leaderForMs > 400 && !t.settling); }, null, { timeout: 90_000 });
    await p.evaluate(() => window.__kettle.settings.getState().set({ muted: true, autoStartBreaks: false, autoStartFocus: false }));
    await sleep(1200);
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: CPU });
    await p.evaluate(() => {
      window.__f = [];
      const t0 = performance.now();
      const tick = () => {
        const host = document.querySelector('[data-scene-mode="window"]');
        const img = host?.querySelector('img');
        const layers = host ? host.querySelectorAll('svg[data-window-items] image').length : 0;
        window.__f.push({ t: Math.round(performance.now() - t0), layers, img: !!img, loaded: !!(img && img.complete && img.naturalWidth > 0), ready: host?.getAttribute('data-scene-ready') ?? host?.getAttribute('data-scene-static') ?? null });
        if (performance.now() - t0 < 4000) requestAnimationFrame(tick);
      };
      window.__startMon = () => requestAnimationFrame(tick);
    });
    if (shots) await cdp.send('Page.startScreencast', { format: 'jpeg', quality: 50, maxWidth: W, maxHeight: H, everyNthFrame: 1 });
    const start = p.getByRole('button', { name: /put the kettle on/i }).first();
    const bb = await start.boundingBox();
    await p.evaluate(() => window.__startMon());
    wall = Date.now() / 1000;
    if (mobile) await p.touchscreen.tap(bb.x + bb.width / 2, bb.y + bb.height / 2); else await p.mouse.click(bb.x + bb.width / 2, bb.y + bb.height / 2);
    await sleep(6000);
    if (shots) await cdp.send('Page.stopScreencast').catch(() => {});
    const f = await p.evaluate(() => window.__f);
    const withStill = f.filter((x) => x.img);
    const float = f.filter((x) => x.layers > 0 && !x.loaded);
    const firstLayer = f.find((x) => x.layers > 0);
    const firstLoaded = f.find((x) => x.loaded);
    Object.assign(r, {
      frames: f.length,
      stillFrames: withStill.length,
      floatFrames: float.length,
      floatMs: float.length ? float[float.length - 1].t - float[0].t : 0,
      firstLayerMs: firstLayer?.t ?? null,
      stillLoadedMs: firstLoaded?.t ?? null,
      screencast: frames.map((x) => x.name),
    });
  } catch (e) { r.error = e.message.slice(0, 200); }
  runs.push(r);
  console.log(args.label, JSON.stringify({ ...r, screencast: r.screencast?.length }));
  await ctx.close();
}
writeFileSync(`${dir}/float.json`, JSON.stringify({ base: args.base, label: args.label, cpu: CPU, runs }, null, 1));
await b.close();
