import { chromium } from 'playwright';
const b = await chromium.launch({ args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader', '--ignore-gpu-blocklist'] });
for (const [w, h] of [[1024, 768], [1280, 800], [1920, 1080]]) {
  const ctx = await b.newContext({ viewport: { width: w, height: h }, serviceWorkers: 'block', colorScheme: 'light' });
  const p = await ctx.newPage();
  await p.goto(`http://localhost:4173/?debug&seed=veteran&theme=light#/nook`, { waitUntil: 'networkidle' });
  await p.evaluate(() => window.__kettle.settings.getState().set({ scene: 'off' }));
  await p.waitForTimeout(1200);
  const cw = await p.evaluate(() => { const r = document.querySelector('[aria-label="The room"]')?.parentElement; return r ? Math.round(r.getBoundingClientRect().width) : -1; });
  console.log(w, 'root width', cw);
  await p.screenshot({ path: `review/round-6-audit/shots/nook-${w}-light-top.png` });
  await p.mouse.wheel(0, 700); await p.waitForTimeout(700);
  await p.screenshot({ path: `review/round-6-audit/shots/nook-${w}-light-scrolled.png` });
  await ctx.close();
}
await b.close();
