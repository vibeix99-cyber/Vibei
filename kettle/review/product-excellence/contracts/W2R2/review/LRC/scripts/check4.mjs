// Lane R (C) check 4: low-tier frame time + memory, model (default) vs procedural (the .glb data request aborted), one
// browser session, alternating rounds, same tier (default = low on SwiftShader), 390x844, Nook on the preview.
// node check4.mjs --base http://127.0.0.1:5461 --rounds 3 --frames 60 --dpr 3 --out <file.json>
// Frame time = engine.frame(1/30) followed by a 1-pixel gl.readPixels (forces the CPU rasterizer to finish), loop stopped
// with setRunning(false) after the room is final. renderer.info is read from window.__nook.renderer (private in TS,
// present at run time; debug builds expose __nook).
import { chromium } from 'playwright';
import { writeFileSync } from 'node:fs';
const args = Object.fromEntries(process.argv.slice(2).reduce((a, x, i, all) => (x.startsWith('--') && a.push([x.slice(2), all[i + 1]]), a), []));
const ROUNDS = +(args.rounds ?? 3), FRAMES = +(args.frames ?? 60), WARM = 10, DPR = +(args.dpr ?? 3);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const b = await chromium.launch({ args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader', '--ignore-gpu-blocklist', '--enable-precise-memory-info', '--js-flags=--expose-gc'] });
const results = [];
const order = [];
const FIRST = args.first ?? 'model', SECOND = FIRST === 'model' ? 'procedural' : 'model';
for (let r = 1; r <= ROUNDS; r++) { order.push([r, FIRST]); order.push([r, SECOND]); }
for (const [round, variant] of order) {
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: DPR, isMobile: true, hasTouch: true, colorScheme: 'light', timezoneId: 'UTC', locale: 'en-GB', serviceWorkers: 'block' });
  await ctx.addInitScript(() => {
    window.__lt = [];
    new PerformanceObserver((l) => l.getEntries().forEach((e) => window.__lt.push([Math.round(e.startTime), Math.round(e.duration)]))).observe({ type: 'longtask', buffered: true });
  });
  const p = await ctx.newPage();
  await p.clock.install({ time: Date.parse('2026-10-11T07:40:00Z') });
  await p.clock.resume();
  const rec = { round, variant, glbRequests: [], aborted: 0, errors: [] };
  p.on('pageerror', (e) => rec.errors.push(e.message.slice(0, 200)));
  p.on('request', (r) => { const u = new URL(r.url()); if (/\.glb$/i.test(u.pathname)) rec.glbRequests.push(u.pathname + u.search); });
  if (variant === 'procedural') await p.route((u) => /\.glb$/i.test(u.pathname) && !u.search, (r) => { rec.aborted++; return r.abort('failed'); });
  const t0 = Date.now();
  try {
    await p.goto(`${args.base}/?debug&seed=veteran&theme=light#/nook`);
    await p.waitForSelector('section[aria-label="The room"] [data-scene-ready="true"]', { timeout: 120_000 });
    rec.readyMs = Date.now() - t0;
    if (variant === 'model') await p.waitForFunction(() => window.__nook?.chaiKind === 'model', null, { timeout: 30_000 }).catch(() => rec.errors.push('model never swapped in'));
    else await p.waitForFunction(() => window.__chai3d?.status?.().state === 'failed', null, { timeout: 30_000 }).catch(() => rec.errors.push('procedural: status never failed'));
    rec.finalMs = Date.now() - t0;
    await sleep(2500);
    rec.longTasks = await p.evaluate(() => { const lt = window.__lt.slice(); return { count: lt.length, maxMs: Math.max(0, ...lt.map((x) => x[1])), list: lt }; });
    const cdp = await ctx.newCDPSession(p);
    const r = await p.evaluate(async ({ FRAMES, WARM }) => {
      const e = window.__nook;
      e.setRunning(false);
      await new Promise((res) => setTimeout(res, 300));
      const gl = e.renderer.getContext();
      const px = new Uint8Array(4);
      const one = () => { const a = performance.now(); e.frame(1 / 30); gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px); return performance.now() - a; };
      for (let i = 0; i < WARM; i++) one();
      const ms = [];
      for (let i = 0; i < FRAMES; i++) ms.push(one());
      const raw = ms.slice();
      ms.sort((x, y) => x - y);
      const q = (f) => ms[Math.min(ms.length - 1, Math.floor(f * ms.length))];
      const info = e.renderer.info;
      let chaiObj = null; e.scene.traverse((o) => { if (o.name === 'chai') chaiObj = o; });
      return {
        chaiKind: e.chaiKind, rootUserDataModel: e.chai?.root?.userData?.model === true, quality: e.quality, canvas: [e.renderer.domElement.width, e.renderer.domElement.height],
        frame: { median: +q(0.5).toFixed(2), mean: +(ms.reduce((s, x) => s + x, 0) / ms.length).toFixed(2), p90: +q(0.9).toFixed(2), min: +ms[0].toFixed(2), max: +ms[ms.length - 1].toFixed(2), n: ms.length },
        rawMs: raw.map((x) => +x.toFixed(1)),
        render: { calls: info.render.calls, triangles: info.render.triangles, lines: info.render.lines, points: info.render.points },
        memory: { geometries: info.memory.geometries, textures: info.memory.textures, programs: info.programs?.length ?? null },
        status: window.__chai3d?.status?.() ?? null,
      };
    }, { FRAMES, WARM });
    await cdp.send('HeapProfiler.collectGarbage'); await cdp.send('HeapProfiler.collectGarbage');
    r.heapMB = +((await cdp.send('Runtime.getHeapUsage')).usedSize / 1048576).toFixed(2);
    Object.assign(rec, r);
  } catch (e) { rec.errors.push('SCRIPT: ' + e.message.slice(0, 300)); }
  rec.load1m = require_loadavg();
  results.push(rec);
  console.log(new Date().toISOString(), `r${round} ${variant}`, JSON.stringify({ kind: rec.chaiKind, median: rec.frame?.median, calls: rec.render?.calls, tris: rec.render?.triangles, geo: rec.memory?.geometries, tex: rec.memory?.textures, prog: rec.memory?.programs, heapMB: rec.heapMB, glb: rec.glbRequests.length, aborted: rec.aborted, errors: rec.errors.length, load: rec.load1m }));
  await ctx.close();
}
function require_loadavg() { try { return readFileSync('/proc/loadavg', 'utf8').split(' ').slice(0, 3).join(' '); } catch { return null; } }
writeFileSync(args.out, JSON.stringify({ base: args.base, vp: `390x844@${DPR}`, at: new Date().toISOString(), rounds: ROUNDS, frames: FRAMES, warm: WARM, results }, null, 1));
await b.close();
import { readFileSync } from 'node:fs';
