// R2-D1 retest: resizes that do not change the status bar's own box (fixed 2,296 leaves: the seed's total follows the date). node .tmp/w1fix/d1race.mjs <base> [reps]
import { chromium } from '/home/user/Vibei/kettle/node_modules/playwright/index.mjs';
const [,, base, reps = '3'] = process.argv;
const b = await chromium.launch({ args: ['--enable-unsafe-swiftshader','--use-angle=swiftshader','--ignore-gpu-blocklist'] });
const measure = (p) => p.evaluate(() => { const el = document.querySelector('nav[aria-label="Your progress"]'); const kids = [...el.children]; const tabs = document.querySelector('nav[aria-label="Main"]'); return { mode: el.hasAttribute('data-wrap') ? 'wrap' : el.hasAttribute('data-tight') ? 'tight' : 'normal', rows: new Set(kids.map((k) => Math.round(k.getBoundingClientRect().top))).size, right: Math.round(Math.max(...kids.map((k) => k.getBoundingClientRect().right))), sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth, iw: innerWidth, ih: innerHeight, tab: Math.round(tabs.getBoundingClientRect().bottom) }; });
const seqs = [
  ['step 384x854 -> 375x667', [[384, 854]], [[375, 667]], 0],
  ['step 380x800 -> 375x667', [[380, 800]], [[375, 667]], 0],
  ['step 384x854 -> 360x740', [[384, 854]], [[360, 740]], 0],
  ['gradual 414 -> 375, 2 px / 16 ms', [[414, 896]], Array.from({ length: 20 }, (_, i) => [412 - 2 * i, 667]).filter(([w]) => w >= 375).concat([[375, 667]]), 16],
  ['gradual 414 -> 375, 1 px / 20 ms', [[414, 896]], Array.from({ length: 39 }, (_, i) => [413 - i, 667]), 20],
  ['bounce 414/375/390/375/400/375/384/375 zero wait', [[414, 896]], [[375, 667], [390, 844], [375, 667], [400, 800], [375, 667], [384, 854], [375, 667], [414, 896], [375, 667]], 0],
];
let fails = 0;
for (const theme of ['light', 'dark']) for (const [name, start, steps, wait] of seqs) for (let i = 0; i < +reps; i++) {
  const ctx = await b.newContext({ viewport: { width: start[0][0], height: start[0][1] }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, colorScheme: theme });
  const p = await ctx.newPage();
  await p.goto(`${base}/?debug&seed=veteran&theme=${theme}#/`, { waitUntil: 'load' }); await p.evaluate(() => document.fonts.ready); await p.evaluate(() => window.__kettle.progress.setState({ leaves: 2296 })); await p.waitForTimeout(1500);
  for (const [w, h] of steps) { await p.setViewportSize({ width: w, height: h }); if (wait) await p.waitForTimeout(wait); }
  await p.waitForTimeout(1500);
  const [W, H] = steps.at(-1);
  const r = await measure(p);
  const ok = r.mode === 'tight' && r.rows === 1 && r.sw === W && r.cw === W && r.iw === W && r.tab === H;
  if (!ok) fails++;
  console.log(`${theme} ${name} #${i + 1}: ${ok ? 'OK' : 'FAIL'} ${JSON.stringify(r)}`);
  await ctx.close();
}
// Desktop windows narrowed in steps (no mobile viewport): no horizontal scrollbar.
for (const theme of ['light', 'dark']) for (const [from, step] of [[420, 1], [500, 5]]) for (let i = 0; i < +reps; i++) {
  const ctx = await b.newContext({ viewport: { width: from, height: 800 }, colorScheme: theme });
  const p = await ctx.newPage();
  await p.goto(`${base}/?debug&seed=veteran&theme=${theme}#/`, { waitUntil: 'load' }); await p.evaluate(() => document.fonts.ready); await p.evaluate(() => window.__kettle.progress.setState({ leaves: 2296 })); await p.waitForTimeout(1500);
  for (let w = from - step; w >= 375; w -= step) { await p.setViewportSize({ width: w, height: 800 }); await p.waitForTimeout(16); }
  await p.setViewportSize({ width: 375, height: 800 }); await p.waitForTimeout(1500);
  const r = await measure(p);
  const ok = r.rows === 1 && r.sw <= r.cw && r.right <= r.cw;
  if (!ok) fails++;
  console.log(`${theme} desktop window ${from} -> 375 in ${step} px steps #${i + 1}: ${ok ? 'OK' : 'FAIL'} ${JSON.stringify(r)}`);
  await ctx.close();
}
// Back to 414: normal; 200 % text still wraps after a step from 384.
for (const theme of ['light', 'dark']) {
  const ctx = await b.newContext({ viewport: { width: 384, height: 854 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, colorScheme: theme });
  const p = await ctx.newPage();
  await p.goto(`${base}/?debug&seed=veteran&theme=${theme}#/`, { waitUntil: 'load' }); await p.evaluate(() => document.fonts.ready); await p.evaluate(() => window.__kettle.progress.setState({ leaves: 2296 })); await p.waitForTimeout(1500);
  await p.setViewportSize({ width: 375, height: 667 }); await p.waitForTimeout(1200);
  await p.setViewportSize({ width: 414, height: 896 }); await p.waitForTimeout(1500);
  const back = await measure(p); const ok1 = back.mode === 'normal' && back.rows === 1; if (!ok1) fails++;
  console.log(`${theme} 384 -> 375 -> 414: ${ok1 ? 'OK' : 'FAIL'} ${JSON.stringify(back)}`);
  await ctx.close();
  const ctx2 = await b.newContext({ viewport: { width: 384, height: 854 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, colorScheme: theme });
  await ctx2.addInitScript(() => addEventListener('DOMContentLoaded', () => { const s = document.createElement('style'); s.textContent = 'html{font-size:200%!important}'; document.head.appendChild(s); }));
  const p2 = await ctx2.newPage();
  await p2.goto(`${base}/?debug&seed=veteran&theme=${theme}#/`, { waitUntil: 'load' }); await p2.evaluate(() => document.fonts.ready); await p2.evaluate(() => window.__kettle.progress.setState({ leaves: 2296 })); await p2.waitForTimeout(1500);
  await p2.setViewportSize({ width: 375, height: 667 }); await p2.waitForTimeout(1500);
  const big = await measure(p2); const ok2 = big.mode === 'wrap' && big.sw === 375 && big.iw === 375; if (!ok2) fails++;
  console.log(`${theme} 200% 384 -> 375: ${ok2 ? 'OK' : 'FAIL'} ${JSON.stringify(big)}`);
  await ctx2.close();
}
console.log(`failures: ${fails}`);
await b.close();
