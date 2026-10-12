// I06 perf + memory: procedural vs model Chai, same machine, same browser session, alternating runs.
// Frame time = engine.frame() + a 1-pixel readPixels (forces the CPU rasterizer to finish the frame), 60 frames after
// 10 warm-up frames, loop stopped (no rAF pacing). Memory = JS heap after gc(), renderer.info (geometries, textures,
// programs) and the last frame's draw calls / triangles. Long tasks from navigation until the Chai is final.
// node perf.mjs --runs "5430:procedural:high,5433:procedural:high,5433:model:high,..." --vp 390x844@3 --reps 2 --out perf.json
import { chromium } from 'playwright';
import { writeFileSync } from 'node:fs';
const args = Object.fromEntries(process.argv.slice(2).reduce((a, x, i, all) => (x.startsWith('--') && a.push([x.slice(2), all[i + 1]]), a), []));
const [W, H, DPR] = args.vp.match(/(\d+)x(\d+)@(\d+)/).slice(1).map(Number);
const b = await chromium.launch({ args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader', '--ignore-gpu-blocklist', '--enable-precise-memory-info', '--js-flags=--expose-gc'] });
const results = [];
const runs = args.runs.split(',');
const reps = +(args.reps ?? 2);
const order = [];
for (let r = 0; r < reps; r++) for (const x of runs) order.push(x);
for (const run of order) {
  const [port, chai, q] = run.split(':');
  const ctx = await b.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: DPR, colorScheme: 'light', timezoneId: 'UTC', serviceWorkers: 'block', isMobile: W < 900, hasTouch: W < 900 });
  await ctx.addInitScript(() => {
    window.__lt = [];
    new PerformanceObserver((l) => l.getEntries().forEach((e) => window.__lt.push([Math.round(e.startTime), Math.round(e.duration)]))).observe({ type: 'longtask', buffered: true });
  });
  const p = await ctx.newPage();
  await p.clock.install({ time: Date.parse('2026-10-11T07:40:00Z') }); await p.clock.resume();
  const t0 = Date.now();
  await p.goto(`http://127.0.0.1:${port}/?debug&seed=veteran&theme=light&nookq=${q}&chai3d=${chai}#/nook`);
  await p.waitForSelector('[data-scene-ready="true"]', { timeout: 120000 });
  const readyMs = Date.now() - t0;
  if (chai === 'model' && port !== '5430') await p.waitForFunction(() => window.__nook?.chaiKind === 'model', null, { timeout: 30000 }).catch(() => {});
  const finalMs = Date.now() - t0;
  await p.waitForTimeout(2500);
  const lt = await p.evaluate(() => window.__lt.slice());
  const cdp = await ctx.newCDPSession(p);
  const r = await p.evaluate(async () => {
    const e = window.__nook;
    e.setRunning(false);
    await new Promise((res) => setTimeout(res, 300));
    const gl = e.renderer.getContext();
    const px = new Uint8Array(4);
    const one = () => { const a = performance.now(); e.frame(1 / 30); gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px); return performance.now() - a; };
    for (let i = 0; i < 10; i++) one();
    const ms = [];
    for (let i = 0; i < 60; i++) ms.push(one());
    ms.sort((x, y) => x - y);
    const info = e.renderer.info;
    return {
      chaiKind: e.chaiKind ?? 'procedural (control: no field)', quality: e.quality, canvas: [e.renderer.domElement.width, e.renderer.domElement.height],
      frame: { median: +ms[30].toFixed(2), mean: +(ms.reduce((s, x) => s + x, 0) / ms.length).toFixed(2), p90: +ms[54].toFixed(2), min: +ms[0].toFixed(2), max: +ms[59].toFixed(2) },
      render: { calls: info.render.calls, triangles: info.render.triangles }, memory: { geometries: info.memory.geometries, textures: info.memory.textures, programs: info.programs?.length },
      status: window.__chai3d?.status?.() ?? null,
    };
  });
  await cdp.send('HeapProfiler.collectGarbage'); await cdp.send('HeapProfiler.collectGarbage');
  const heap = await cdp.send('Runtime.getHeapUsage');
  r.heapMB = +(heap.usedSize / 1048576).toFixed(2);
  r.longTasks = { count: lt.length, maxMs: Math.max(0, ...lt.map((x) => x[1])), totalOver50: lt.reduce((s, x) => s + Math.max(0, x[1] - 50), 0), list: lt };
  results.push({ run, readyMs, finalMs, ...r });
  console.log(run, JSON.stringify({ readyMs, finalMs, ...r }));
  await ctx.close();
}
writeFileSync(args.out, JSON.stringify({ vp: args.vp, at: new Date().toISOString(), renderer: 'SwiftShader (CPU)', results }, null, 1));
await b.close();
