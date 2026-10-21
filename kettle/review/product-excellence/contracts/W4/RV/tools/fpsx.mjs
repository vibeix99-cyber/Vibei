import { chromium } from '/home/user/wt/w11/kettle/node_modules/playwright/index.mjs';
const sets = { swiftshader: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader', '--ignore-gpu-blocklist'], default: [], disableGpu: ['--disable-gpu'] };
for (const [k, args] of Object.entries(sets)) {
  const b = await chromium.launch({ args });
  const p = await b.newPage({ viewport: { width: 400, height: 500 }, deviceScaleFactor: 2 });
  await p.goto('http://127.0.0.1:5651/.tmp/rive-harness-small.html'); await p.waitForFunction(() => window.loaded);
  await p.waitForTimeout(1500);
  const r = await p.evaluate(() => new Promise((res) => { const f0 = window.r.frameCount; let n = 0; const t0 = performance.now(); const f = () => { n++; if (performance.now() - t0 < 4000) requestAnimationFrame(f); else res({ raf: n / 4, rive: (window.r.frameCount - f0) / ((performance.now() - t0) / 1000), avgDraw: window.r.durations ? (window.r.durations.reduce((a, b) => a + b, 0) / window.r.durations.length) : null }); }; requestAnimationFrame(f); }));
  const gpu = await (async () => { const q = await b.newPage(); await q.goto('chrome://gpu').catch(() => {}); const t = await q.evaluate(() => document.body.innerText.match(/Canvas:\s*([^\n]+)/)?.[1]).catch(() => null); await q.close(); return t; })();
  console.log(k, JSON.stringify(r), 'canvas:', gpu);
  await b.close();
}
