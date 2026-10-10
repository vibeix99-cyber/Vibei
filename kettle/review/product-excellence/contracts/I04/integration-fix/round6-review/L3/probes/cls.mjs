// L3 3f: cold-load CLS on Today at 200% text on the production previews. Chrome-counted (no recent input) and all entries.
// node cls.mjs --rev=R6|INT --runs=3 [--text=200,100]
import { REV, launch, args, logger, OUT, stamp } from './lib.mjs';
import { mkdirSync, writeFileSync } from 'node:fs';
const a = args();
const rev = REV[a.rev ?? 'R6'];
const runs = +(a.runs ?? 3);
const texts = (a.text ?? '200,100').split(',').map(Number);
const dir = `${OUT}/3f`; mkdirSync(dir, { recursive: true });
const tag = rev.name;
const log = logger(`${dir}/cls-${tag}.log`);
log(`RUN 3f ${tag} url=${rev.prod} (production preview) rev=${rev.name}@${rev.commit} runs=${runs} texts=${texts} start=${stamp()}`);
const b = await launch();
const out = [];
for (const text of texts) for (const [w, h] of [[390, 844], [375, 667]]) for (const fonts of ['normal', 'delayed2.5s']) {
  const vals = [];
  for (let i = 0; i < runs; i++) {
    const ctx = await b.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, serviceWorkers: 'block' });
    if (text !== 100) await ctx.addInitScript((pct) => addEventListener('DOMContentLoaded', () => { const s = document.createElement('style'); s.textContent = `html{font-size:${pct}%!important}`; document.head.appendChild(s); }), text);
    await ctx.addInitScript(() => { window.__ls = []; new PerformanceObserver((l) => { for (const e of l.getEntries()) window.__ls.push({ ri: e.hadRecentInput, v: e.value, t: Math.round(e.startTime), src: (e.sources || []).map((s) => (s.node && s.node.nodeType === 1 ? (s.node.className.toString().slice(0, 30) || s.node.tagName) : '?')).join('|') }); }).observe({ type: 'layout-shift', buffered: true }); });
    const p = await ctx.newPage();
    if (fonts !== 'normal') await p.route('**/*.woff2', async (r) => { await new Promise((ok) => setTimeout(ok, 2500)); await r.continue(); });
    await p.goto(`${rev.prod}/?debug&seed=veteran&theme=light&nooktime=day#/`, { waitUntil: 'load' });
    await p.waitForTimeout(fonts === 'normal' ? 6000 : 8500);
    const r = await p.evaluate(() => ({ chrome: window.__ls.filter((x) => !x.ri).reduce((s, x) => s + x.v, 0), all: window.__ls.reduce((s, x) => s + x.v, 0), list: window.__ls, mode: (() => { const el = document.querySelector('nav[aria-label="Your progress"]'); return el ? (el.hasAttribute('data-wrap') ? 'wrap' : el.hasAttribute('data-tight') ? 'tight' : 'normal') : 'n/a'; })(), fontsLoaded: [...document.fonts].filter((f) => f.status === 'loaded').length, hash: location.hash }));
    vals.push({ chrome: +r.chrome.toFixed(4), all: +r.all.toFixed(4), n: r.list.length, mode: r.mode, list: r.list, fontsLoaded: r.fontsLoaded });
    await ctx.close();
  }
  const cfg = { rev: rev.name, url: rev.prod, text, viewport: `${w}x${h}`, fonts, runs: vals };
  out.push(cfg);
  log(`${rev.name} @${text}% ${w}x${h} fonts=${fonts}: Chrome-counted ${JSON.stringify(vals.map((v) => v.chrome))} all-entries ${JSON.stringify(vals.map((v) => v.all))} entries ${JSON.stringify(vals.map((v) => v.n))} status-bar mode ${JSON.stringify(vals.map((v) => v.mode))} | entries run1 ${JSON.stringify(vals[0].list)}`);
}
writeFileSync(`${dir}/cls-${tag}.json`, JSON.stringify(out, null, 1));
await b.close();
log(`END ${stamp()}`);
