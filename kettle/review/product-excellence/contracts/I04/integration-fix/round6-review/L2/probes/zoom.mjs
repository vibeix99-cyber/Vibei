// L2 check 5 (R4-D2): after rapid LIVE mobile viewport changes at 150 % / 200 % text the page must not be left zoomed in.
// Final visualViewport.scale must be 1 (and vv width == innerWidth, no sideways scroll, bar inside the screen).
//   node zoom.mjs <base> <rev> <outdir> <reps=3> <texts=200,150> <themes=light,dark>
import { mkdirSync, appendFileSync } from 'node:fs';
import { launch, sleep } from './lib.mjs';
const [base, rev, out, repsArg = '3', textArg = '200,150', themeArg = 'light,dark'] = process.argv.slice(2);
mkdirSync(out, { recursive: true });
const SEQ = {
  bounce: { start: [414, 667], run: async (p) => { for (const w of [414, 375, 390, 375, 400, 375, 384, 375, 414, 375]) await p.setViewportSize({ width: w, height: 667 }); } },
  wiggle: { start: [414, 667], run: async (p) => { for (let k = 0; k < 3; k++) { for (let w = 412; w >= 376; w -= 2) { await p.setViewportSize({ width: w, height: 667 }); await sleep(16); } for (let w = 376; w <= 412; w += 2) { await p.setViewportSize({ width: w, height: 667 }); await sleep(16); } } await p.setViewportSize({ width: 375, height: 667 }); } },
  drag2: { start: [414, 667], run: async (p) => { for (let w = 412; w >= 376; w -= 2) { await p.setViewportSize({ width: w, height: 667 }); await sleep(16); } await p.setViewportSize({ width: 375, height: 667 }); } },
  drag1: { start: [414, 667], run: async (p) => { for (let w = 413; w >= 375; w--) await p.setViewportSize({ width: w, height: 667 }); } },
  rotate4: { start: [375, 667], run: async (p) => { for (const [w, h] of [[667, 375], [375, 667], [667, 375], [375, 667]]) await p.setViewportSize({ width: w, height: h }); } },
  rotateSlow: { start: [375, 667], run: async (p) => { for (const [w, h] of [[667, 375], [375, 667], [667, 375], [375, 667]]) { await p.setViewportSize({ width: w, height: h }); await sleep(120); } } },
  // 390x844 phone: browser-controls height changes + a width drag
  narrow390: { start: [390, 844], run: async (p) => { for (let w = 388; w >= 360; w -= 2) { await p.setViewportSize({ width: w, height: 844 - (w % 3) * 20 }); await sleep(16); } await p.setViewportSize({ width: 360, height: 740 }); } },
};
const b = await launch();
let fails = 0, n = 0;
for (const pct of textArg.split(',').map(Number)) for (const theme of themeArg.split(',')) for (const [name, seq] of Object.entries(SEQ)) for (let r = 1; r <= +repsArg; r++) {
  const ctx = await b.newContext({ viewport: { width: seq.start[0], height: seq.start[1] }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, colorScheme: theme });
  await ctx.addInitScript((pct) => addEventListener('DOMContentLoaded', () => { const s = document.createElement('style'); s.textContent = `html{font-size:${pct}%!important}`; document.head.appendChild(s); }), pct);
  const p = await ctx.newPage();
  await p.goto(`${base}/?debug&seed=veteran&theme=${theme}${theme === 'light' ? '&nooktime=day' : ''}#/`, { waitUntil: 'load' });
  await p.waitForFunction(() => !!window.__kettle); await p.evaluate(() => document.fonts.ready); await sleep(1200);
  await seq.run(p);
  await sleep(2000);
  const res = await p.evaluate(() => { const el = document.querySelector('nav[aria-label="Your progress"]'); const d = document.documentElement; return { scale: +visualViewport.scale.toFixed(3), vvw: Math.round(visualViewport.width), iw: innerWidth, ih: innerHeight, sw: d.scrollWidth, cw: d.clientWidth, mode: el.hasAttribute('data-wrap') ? 'wrap' : el.hasAttribute('data-tight') ? 'tight' : 'normal', barRight: Math.round(Math.max(el.getBoundingClientRect().right, ...[...el.children].map((c) => c.getBoundingClientRect().right))), tabBottom: Math.round(document.querySelector('nav[aria-label="Main"]').getBoundingClientRect().bottom) }; });
  n++;
  const ok = res.scale === 1 && res.vvw === res.iw && res.sw <= res.cw && res.barRight <= res.iw;
  if (!ok) { fails++; await p.screenshot({ path: `${out}/zoom-${rev}-${name}-t${pct}-${theme}-r${r}.png`, scale: 'css' }).catch(() => {}); }
  appendFileSync(`${out}/${rev}-zoom.jsonl`, JSON.stringify({ rev, base, name, pct, theme, rep: r, ok, ...res }) + '\n');
  console.log(`${rev} ${name} t${pct} ${theme} #${r}: ${ok ? 'OK' : 'FAIL'} ${JSON.stringify(res)}`);
  await ctx.close();
}
console.log(`${rev} zoom: ${fails} failures of ${n}`);
await b.close();
