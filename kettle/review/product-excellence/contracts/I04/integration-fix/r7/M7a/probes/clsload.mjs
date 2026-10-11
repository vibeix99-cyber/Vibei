// Today load CLS at 100 % text, repeated: N reloads of a seeded profile, layout shifts over 4 s after each load.
// node clsload.mjs <base> <label> <out.jsonl> <configs "390x844:light,..."> <reps>
import { chromium } from 'playwright';
import { appendFileSync } from 'node:fs';
const [,, base, label, out, cfgArg, repArg = '5'] = process.argv;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const b = await chromium.launch({ args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader', '--ignore-gpu-blocklist'] });
for (const c of cfgArg.split(',')) {
  const [dim, theme] = c.split(':'); const [W, H] = dim.split('x').map(Number);
  const ctx = await b.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: W >= 900 ? 1 : 2, isMobile: W < 900, hasTouch: W < 900, colorScheme: theme });
  await ctx.addInitScript(() => { try { if (!localStorage.getItem('kettle:settings')) localStorage.setItem('kettle:settings', JSON.stringify({ state: { onboarded: true, scene: 'off', autoStartBreaks: false, autoStartFocus: false, muted: true }, version: 1 })); } catch {} });
  await ctx.addInitScript(() => { window.__ls = []; new PerformanceObserver((l) => { for (const e of l.getEntries()) window.__ls.push([Math.round(e.startTime), +e.value.toFixed(4), e.hadRecentInput]); }).observe({ type: 'layout-shift', buffered: true }); });
  const p = await ctx.newPage();
  await p.goto(`${base}/?debug&theme=${theme}${theme === 'light' ? '&nooktime=day' : ''}#/`);
  await p.waitForFunction(() => !!window.__kettle, null, { timeout: 60_000 });
  await p.evaluate(() => window.__kettle.seed('newbie'));
  const vals = [];
  for (let i = 0; i < +repArg; i++) {
    await p.reload(); await p.waitForFunction(() => !!window.__kettle, null, { timeout: 60_000 }); await sleep(4000);
    const ls = await p.evaluate(() => window.__ls);
    vals.push(+ls.reduce((s, e) => s + e[1], 0).toFixed(4));
    appendFileSync(out, JSON.stringify({ label, W, H, theme, rep: i, cls: vals[i], entries: ls }) + '\n');
  }
  console.log(JSON.stringify({ label, W, H, theme, cls: vals }));
  await ctx.close();
}
await b.close();
