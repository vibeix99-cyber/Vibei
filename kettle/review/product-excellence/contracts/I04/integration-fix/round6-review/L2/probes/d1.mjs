// L2 check 5 (D1): after a resize / rotation to 375x667 at 100 % text the status bar must be `tight`, one row, no sideways
// scroll, tab bar at the bottom; back to 414 -> `normal`; 200 % -> `wrap` without overflow. Fixed 2,296 leaves.
//   node d1.mjs <base> <rev> <outdir> <reps=3>
import { mkdirSync, appendFileSync } from 'node:fs';
import { launch, sleep } from './lib.mjs';
const [base, rev, out, repsArg = '3'] = process.argv.slice(2);
mkdirSync(out, { recursive: true });
const b = await launch();
const measure = (p) => p.evaluate(() => { const el = document.querySelector('nav[aria-label="Your progress"]'); const kids = [...el.children]; const tabs = document.querySelector('nav[aria-label="Main"]'); const d = document.documentElement; return { mode: el.hasAttribute('data-wrap') ? 'wrap' : el.hasAttribute('data-tight') ? 'tight' : 'normal', rows: new Set(kids.map((k) => Math.round(k.getBoundingClientRect().top))).size, right: Math.round(Math.max(...kids.map((k) => k.getBoundingClientRect().right))), sw: d.scrollWidth, cw: d.clientWidth, iw: innerWidth, ih: innerHeight, vvs: +visualViewport.scale.toFixed(3), vvw: Math.round(visualViewport.width), tab: Math.round(tabs.getBoundingClientRect().bottom), greet: Math.round(document.querySelector('main h1, main h2')?.getBoundingClientRect().top ?? -1) }; });
const FROM = [['414x896', 414, 896, true], ['667x375', 667, 375, true], ['844x390', 844, 390, true], ['390x844', 390, 844, true], ['1440x900 desktop', 1440, 900, false], ['800x900 desktop', 800, 900, false]];
let fails = 0, n = 0;
for (const theme of ['light', 'dark']) for (const [name, w0, h0, mobile] of FROM) for (let r = 1; r <= +repsArg; r++) {
  const ctx = await b.newContext({ viewport: { width: w0, height: h0 }, deviceScaleFactor: mobile ? 2 : 1, isMobile: mobile, hasTouch: mobile, colorScheme: theme });
  const p = await ctx.newPage();
  await p.goto(`${base}/?debug&seed=veteran&theme=${theme}${theme === 'light' ? '&nooktime=day' : ''}#/`, { waitUntil: 'load' });
  await p.evaluate(() => document.fonts.ready); await p.evaluate(() => window.__kettle.progress.setState({ leaves: 2296 })); await sleep(1500);
  await p.setViewportSize({ width: 375, height: 667 }); await sleep(1800);
  const m = await measure(p);
  const sbw = mobile ? 0 : 15;
  const ok = m.mode === 'tight' && m.rows === 1 && m.sw <= m.cw && m.iw === 375 && (mobile ? m.cw === 375 && m.vvs === 1 && m.tab === 667 : true);
  await p.setViewportSize({ width: 414, height: 896 }); await sleep(1500);
  const back = await measure(p); const okb = back.mode === 'normal' && back.rows === 1 && back.sw <= back.cw;
  n++; if (!ok || !okb) { fails++; await p.screenshot({ path: `${out}/d1-${rev}-${name.replace(/\W+/g, '_')}-${theme}-r${r}.png`, scale: 'css' }).catch(() => {}); }
  appendFileSync(`${out}/${rev}-d1.jsonl`, JSON.stringify({ rev, base, name, theme, rep: r, ok, okb, m, back }) + '\n');
  console.log(`${rev} ${theme} ${name} -> 375x667 #${r}: ${ok ? 'OK' : 'FAIL'} ${JSON.stringify(m)} | back 414: ${okb ? 'OK' : 'FAIL'} ${back.mode}/${back.rows}/${back.sw}-${back.cw}`);
  await ctx.close();
}
// 200 % text must still wrap (no overflow) after the same kind of resize
for (const theme of ['light', 'dark']) for (const [name, w0, h0] of [['414x896', 414, 896], ['844x390', 844, 390]]) {
  const ctx = await b.newContext({ viewport: { width: w0, height: h0 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, colorScheme: theme });
  await ctx.addInitScript(() => addEventListener('DOMContentLoaded', () => { const s = document.createElement('style'); s.textContent = 'html{font-size:200%!important}'; document.head.appendChild(s); }));
  const p = await ctx.newPage();
  await p.goto(`${base}/?debug&seed=veteran&theme=${theme}${theme === 'light' ? '&nooktime=day' : ''}#/`, { waitUntil: 'load' });
  await p.evaluate(() => document.fonts.ready); await p.evaluate(() => window.__kettle.progress.setState({ leaves: 2296 })); await sleep(1500);
  await p.setViewportSize({ width: 375, height: 667 }); await sleep(1800);
  const m = await measure(p); const ok = m.mode === 'wrap' && m.sw <= m.cw && m.iw === 375 && m.vvs === 1 && m.tab === 667;
  n++; if (!ok) fails++;
  appendFileSync(`${out}/${rev}-d1.jsonl`, JSON.stringify({ rev, base, name: name + ' t200', theme, ok, m }) + '\n');
  console.log(`${rev} ${theme} 200% ${name} -> 375x667: ${ok ? 'OK' : 'FAIL'} ${JSON.stringify(m)}`);
  await ctx.close();
}
console.log(`${rev} d1: ${fails} failures of ${n}`);
await b.close();
