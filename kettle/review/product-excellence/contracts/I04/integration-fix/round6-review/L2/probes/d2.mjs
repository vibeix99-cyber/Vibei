// L2 check 5 (D2): "Level NN" and the whole status bar at large text and big totals: nothing past the screen edge, no label
// spilling out of its pill, no sideways scroll, tab bar on screen and its labels whole.
//   node d2.mjs <base> <rev> <outdir> <themes=light,dark>
import { mkdirSync, appendFileSync } from 'node:fs';
import { launch, sleep } from './lib.mjs';
const [base, rev, out, themeArg = 'light,dark'] = process.argv.slice(2);
mkdirSync(out, { recursive: true });
const b = await launch();
const TOTALS = [null, 2296, 9999, 10000, 12345, 45678, 99999, 123456, 470000];
const measure = (p) => p.evaluate(() => {
  const el = document.querySelector('nav[aria-label="Your progress"]'); const d = document.documentElement;
  const iw = innerWidth;
  const kids = [...el.children];
  const edge = []; // a pill's box, or any text in the bar, past the screen edge (decorative sheen/shimmer layers have no text and are clipped)
  for (const k of [el, ...kids]) { const r = k.getBoundingClientRect(); if (r.width && (r.right > iw + 0.5 || r.left < -0.5)) edge.push(`box ${k.tagName}.${String(k.className).split(' ')[0]}:${Math.round(r.left)}-${Math.round(r.right)}`); }
  const tw = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  const hiddenUp = (e) => { for (; e && e !== el.parentElement; e = e.parentElement) { if (e.clientWidth <= 1 || e.clientHeight <= 1) return true; } return false; };
  for (let n = tw.nextNode(); n; n = tw.nextNode()) { if (!n.textContent.trim() || hiddenUp(n.parentElement)) continue; const rg = document.createRange(); rg.selectNodeContents(n); const q = rg.getBoundingClientRect(); if (q.width && (q.right > iw + 0.5 || q.left < -0.5)) edge.push(`text "${n.textContent.trim().slice(0, 14)}":${Math.round(q.left)}-${Math.round(q.right)}`); }
  const spill = kids.filter((k) => k.scrollWidth > k.clientWidth + 1).map((k) => `${String(k.className).split(' ')[0]}:${k.scrollWidth}>${k.clientWidth}`);
  const tabs = document.querySelector('nav[aria-label="Main"]'); const tr = tabs.getBoundingClientRect();
  const tabLabels = [...tabs.querySelectorAll('a, button')].map((a) => { const r = a.getBoundingClientRect(); const rg = document.createRange(); rg.selectNodeContents(a); const q = rg.getBoundingClientRect(); return { l: Math.round(q.left), r: Math.round(q.right), clip: q.right > iw + 0.5 || q.left < -0.5 || r.right > iw + 0.5 }; });
  return { mode: el.hasAttribute('data-wrap') ? 'wrap' : el.hasAttribute('data-tight') ? 'tight' : 'normal', iw, ih: innerHeight, sw: d.scrollWidth, cw: d.clientWidth, vvs: +visualViewport.scale.toFixed(3), edge, spill, tabBottom: Math.round(tr.bottom), tabClip: tabLabels.some((t) => t.clip), level: kids.at(-1)?.textContent?.trim() };
});
let fails = 0, n = 0;
for (const theme of themeArg.split(',')) for (const [W, H] of [[360, 740], [375, 667], [390, 844]]) for (const pct of [100, 150, 175, 200]) {
  const ctx = await b.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, colorScheme: theme });
  if (pct !== 100) await ctx.addInitScript((pct) => addEventListener('DOMContentLoaded', () => { const s = document.createElement('style'); s.textContent = `html{font-size:${pct}%!important}`; document.head.appendChild(s); }), pct);
  const p = await ctx.newPage();
  await p.goto(`${base}/?debug&seed=veteran&theme=${theme}${theme === 'light' ? '&nooktime=day' : ''}#/`, { waitUntil: 'load' });
  await p.evaluate(() => document.fonts.ready); await sleep(1500);
  for (const leaves of TOTALS) {
    if (leaves != null) { await p.evaluate((l) => window.__kettle.progress.setState({ leaves: l }), leaves); await sleep(900); }
    const m = await measure(p);
    // 360 wide wraps at 470,000 on the baseline too; a wrapped bar is fine as long as nothing leaves the screen
    const ok = !m.edge.length && !m.spill.length && m.sw <= m.cw && m.iw === W && m.vvs === 1 && m.tabBottom <= H && !m.tabClip;
    n++; if (!ok) { fails++; await p.screenshot({ path: `${out}/d2-${rev}-${W}x${H}-t${pct}-${theme}-${leaves ?? 'seed'}.png`, scale: 'css' }).catch(() => {}); }
    appendFileSync(`${out}/${rev}-d2.jsonl`, JSON.stringify({ rev, base, W, H, pct, theme, leaves, ok, m }) + '\n');
    if (!ok) console.log(`${rev} ${theme} ${W}x${H} t${pct} leaves ${leaves ?? 'seed'}: FAIL ${JSON.stringify(m)}`);
  }
  // two fresh loads (persisted total is the seed's)
  for (let k = 0; k < 2; k++) { await p.reload(); await p.evaluate(() => document.fonts.ready); await sleep(1200); const m = await measure(p); const ok = !m.edge.length && !m.spill.length && m.sw <= m.cw && m.iw === W && m.vvs === 1 && m.tabBottom <= H && !m.tabClip; n++; if (!ok) { fails++; console.log(`${rev} ${theme} ${W}x${H} t${pct} reload: FAIL ${JSON.stringify(m)}`); } appendFileSync(`${out}/${rev}-d2.jsonl`, JSON.stringify({ rev, base, W, H, pct, theme, leaves: 'reload', ok, m }) + '\n'); }
  console.log(`${rev} ${theme} ${W}x${H} t${pct}: done (${fails} failures so far of ${n})`);
  await ctx.close();
}
console.log(`${rev} d2: ${fails} failures of ${n}`);
await b.close();
