// perf.mjs <base> <out.json>
import { chromium } from '/home/user/wt/w11/kettle/node_modules/playwright/index.mjs';
import fs from 'node:fs';
const [base, out] = process.argv.slice(2);
const b = await chromium.launch({ args: process.env.PERF_ARGS ? process.env.PERF_ARGS.split(' ') : [] });
const result = {};
async function stage(rive, dpr, throttle) {
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: dpr });
  const page = await ctx.newPage();
  const cdp = await ctx.newCDPSession(page);
  await page.goto(`${base}/?debug&seed=veteran&theme=light${rive ? '' : '&rive=0'}#/`);
  await page.waitForFunction(() => { const t = window.__kettle?.timerInfo?.(); return !!(t && t.leader && t.leaderForMs > 400 && !t.settling); }, null, { timeout: 60000 });
  await page.evaluate(() => window.__kettle.settings.getState().set({ muted: true, autoStartBreaks: false, autoStartFocus: false }));
  await page.waitForTimeout(900);
  await page.getByRole('button', { name: /put the kettle on/i }).first().click();
  await page.waitForFunction(() => location.hash === '#/focus'); await page.waitForTimeout(4000);
  await cdp.send('Performance.enable');
  if (throttle) await cdp.send('Emulation.setCPUThrottlingRate', { rate: throttle });
  const m = async () => Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.map((x) => [x.name, x.value]));
  const rc = () => page.evaluate(() => (window.__riveChai ?? []).map((r) => r.frameCount));
  const raf = () => page.evaluate(() => new Promise((res) => { let n = 0; const t0 = performance.now(); const f = () => { n++; if (performance.now() - t0 < 5000) requestAnimationFrame(f); else res(n / ((performance.now() - t0) / 1000)); }; requestAnimationFrame(f); }));
  const a = await m(); const f0 = await rc(); const w0 = Date.now();
  const pageFps = await raf();
  await page.waitForTimeout(5000);
  const f1 = await rc(); const w1 = Date.now(); const z = await m();
  const canvas = await page.evaluate(() => { const c = document.querySelector('[data-stage-figure=chai] canvas'); return c && { cssW: c.offsetWidth, cssH: c.offsetHeight, pxW: c.width, pxH: c.height, dpr: devicePixelRatio, running: c.hasAttribute('data-running') }; });
  const render = await page.evaluate(() => document.querySelector('[data-stage-figure=chai] [data-pose]')?.dataset.chaiRender);
  const secs = (w1 - w0) / 1000;
  const r = { rive, dpr, throttle, render, canvas, windowS: +(z.Timestamp - a.Timestamp).toFixed(2),
    taskMsPerS: +(1000 * (z.TaskDuration - a.TaskDuration) / (z.Timestamp - a.Timestamp)).toFixed(1),
    scriptMsPerS: +(1000 * (z.ScriptDuration - a.ScriptDuration) / (z.Timestamp - a.Timestamp)).toFixed(1),
    layoutMsPerS: +(1000 * (z.LayoutDuration - a.LayoutDuration) / (z.Timestamp - a.Timestamp)).toFixed(1),
    pageRafFps: +pageFps.toFixed(1), riveFps: f0.length ? +((f1[0] - f0[0]) / secs).toFixed(1) : null };
  if (throttle) await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 });
  // pause checks (only with rive)
  if (rive && !throttle && dpr === 2) {
    const g0 = (await rc())[0]; await page.evaluate(() => { Object.defineProperty(document, 'visibilityState', { value: 'hidden', configurable: true }); document.dispatchEvent(new Event('visibilitychange')); });
    await page.waitForTimeout(400); const h0 = (await rc())[0]; await page.waitForTimeout(2000); const h1 = (await rc())[0];
    const runningHidden = await page.evaluate(() => document.querySelector('[data-stage-figure=chai] canvas').hasAttribute('data-running'));
    await page.evaluate(() => { Object.defineProperty(document, 'visibilityState', { value: 'visible', configurable: true }); document.dispatchEvent(new Event('visibilitychange')); });
    await page.waitForTimeout(1000); const v1 = (await rc())[0];
    r.hidden = { framesWhileHidden2s: h1 - h0, runningAttr: runningHidden, resumedFrames1s: v1 - h1 };
    await page.evaluate(() => { document.querySelector('[data-stage-figure=chai]').style.transform = 'translateY(4000px)'; });
    await page.waitForTimeout(500); const o0 = (await rc())[0]; await page.waitForTimeout(2000); const o1 = (await rc())[0];
    const runningOff = await page.evaluate(() => document.querySelector('[data-stage-figure=chai] canvas').hasAttribute('data-running'));
    await page.evaluate(() => { document.querySelector('[data-stage-figure=chai]').style.transform = ''; });
    await page.waitForTimeout(1000); const o2 = (await rc())[0];
    r.offscreen = { framesWhileOff2s: o1 - o0, runningAttr: runningOff, resumedFrames1s: o2 - o1 };
  }
  console.log(JSON.stringify(r));
  await ctx.close();
  return r;
}
const runs = [];
for (const rive of [true, false]) runs.push(await stage(rive, 2, 0));
for (const rive of [true, false]) runs.push(await stage(rive, 2, 4));
runs.push(await stage(true, 3, 0));
fs.writeFileSync(out, JSON.stringify(runs, null, 1));
await b.close();
