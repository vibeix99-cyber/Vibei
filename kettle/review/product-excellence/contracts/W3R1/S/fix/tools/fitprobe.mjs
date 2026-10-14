// Maker S fix round (S-D1): does every Overview tile's text fit? And does the page stay at the screen's width while
// the web fonts are blocked? Same frozen date as the lead's probe (2026-10-12 07:40 UTC), real page load.
//   node fitprobe.mjs --base http://127.0.0.1:5502 --label FIX --out <dir> --mode fit|nofonts
// fit: 16 configs (390x844, 375x667, 844x390, 1440x900 × light/dark × 100/200) × seeds veteran, blank(empty).
// nofonts: *.woff2 aborted, isMobile, 390x844 and 375x667 @200, width sampled every 50 ms for 6 s.
import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';
const args = Object.fromEntries(process.argv.slice(2).reduce((a, x, i, all) => (x.startsWith('--') && a.push([x.slice(2), all[i + 1]]), a), []));
const AT = Date.parse('2026-10-12T07:40:00.000Z');
mkdirSync(args.out, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const b = await chromium.launch({ args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader'] });
const res = { label: args.label, base: args.base, mode: args.mode, runs: [] };
const SIZES = (args.sizes ?? '390x844,375x667,844x390,1440x900').split(',');
const big = (p) => p.addInitScript(() => document.addEventListener('DOMContentLoaded', () => { const s = document.createElement('style'); s.textContent = 'html{font-size:200%!important}'; document.head.appendChild(s); }));
const tileFacts = (p) => p.evaluate(() => {
  const ov = document.querySelector('section[aria-label="Overview"]');
  if (!ov) return { error: 'no Overview' };
  const tiles = [...ov.querySelector('div').children];
  const out = { height: Math.round(ov.getBoundingClientRect().height), cols: getComputedStyle(ov.querySelector('div')).gridTemplateColumns.split(' ').length, bad: [], texts: [] };
  for (const t of tiles) {
    const tr = t.getBoundingClientRect();
    for (const e of t.querySelectorAll('*')) {
      if (!(e.textContent || '').trim() || e.closest('svg')) continue;
      const r = e.getBoundingClientRect();
      const cs = getComputedStyle(e);
      if (e.children.length === 0 || [...e.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())) out.texts.push(e.textContent.trim());
      const cut = e.scrollWidth > e.clientWidth + 0.5 && e.clientWidth > 0;
      const past = r.right > tr.right + 0.5;
      // A Range over the text: the glyphs themselves past the tile's edge?
      const range = document.createRange(); range.selectNodeContents(e); const rr = range.getBoundingClientRect();
      const glyphsPast = rr.right > tr.right - 1;
      if (cut || past || glyphsPast || cs.textOverflow === 'ellipsis' && e.scrollWidth > e.clientWidth) out.bad.push({ text: e.textContent.trim().slice(0, 24), sw: e.scrollWidth, cw: e.clientWidth, right: Math.round(r.right), glyphRight: Math.round(rr.right), tileRight: Math.round(tr.right) });
    }
  }
  out.pageW = document.documentElement.scrollWidth; out.iw = innerWidth;
  return out;
});
if (args.mode === 'fit') {
  for (const wh of SIZES) for (const theme of ['light', 'dark']) for (const text of [100, 200]) for (const seed of ['veteran', 'blank']) {
    const [w, h] = wh.split('x').map(Number);
    const mobile = w < 900;
    const ctx = await b.newContext({ viewport: { width: w, height: h }, isMobile: mobile && w < h, hasTouch: mobile, colorScheme: theme, timezoneId: 'UTC', locale: 'en-GB', reducedMotion: 'reduce', serviceWorkers: 'block' });
    if (text === 200) await big(ctx);
    const p = await ctx.newPage();
    await p.clock.install({ time: AT }); await p.clock.resume();
    const run = { cfg: `${wh}-${theme}-${text}`, seed };
    try {
      await p.goto(`${args.base}/?debug&seed=${seed}&theme=${theme}#/stats`);
      await p.getByRole('heading', { name: 'Stats', level: 1 }).waitFor({ timeout: 30_000 });
      await p.evaluate(() => document.fonts.ready);
      await sleep(1200);
      run.fonts = await p.evaluate(() => [...document.fonts].filter((f) => f.status === 'loaded').length);
      Object.assign(run, await tileFacts(p));
      if (seed === 'veteran' && text === 200 && (wh === '390x844' || wh === '844x390')) await p.locator('section[aria-label="Overview"]').screenshot({ path: `${args.out}/${args.label}-${run.cfg}-overview.png` });
    } catch (e) { run.error = String(e).slice(0, 200); }
    res.runs.push(run);
    console.log(run.cfg, seed, `cols ${run.cols} h ${run.height} page ${run.pageW}/${run.iw} bad ${JSON.stringify(run.bad)}`, run.error ?? '');
    await ctx.close();
  }
} else {
  for (const wh of SIZES) {
    const [w, h] = wh.split('x').map(Number);
    const ctx = await b.newContext({ viewport: { width: w, height: h }, isMobile: true, hasTouch: true, colorScheme: 'light', timezoneId: 'UTC', locale: 'en-GB', reducedMotion: 'reduce', serviceWorkers: 'block' });
    await ctx.route(/\.(woff2?|ttf|otf)(\?.*)?$/, (r) => r.abort());
    await big(ctx);
    await ctx.addInitScript(() => { window.__w = []; const t0 = performance.now(); const tick = () => { const d = document.documentElement; if (d) window.__w.push({ t: Math.round(performance.now() - t0), sw: d.scrollWidth, iw: innerWidth }); if (performance.now() - t0 < 6000) setTimeout(tick, 50); }; tick(); });
    const p = await ctx.newPage();
    await p.clock.install({ time: AT }); await p.clock.resume();
    const run = { cfg: `${wh}-200-mobile-nofonts` };
    try {
      await p.goto(`${args.base}/?debug&seed=veteran&theme=light#/stats`);
      await p.waitForFunction(() => !!window.__kettle, null, { timeout: 60_000 });
      await sleep(6200);
      const s = await p.evaluate(() => window.__w);
      run.samples = s.length; run.maxSw = Math.max(...s.map((x) => x.sw)); run.iw = s.at(-1).iw; run.wide = s.filter((x) => x.sw > x.iw + 0.5).length;
      run.fontsLoaded = await p.evaluate(() => [...document.fonts].filter((f) => f.status === 'loaded').length);
      Object.assign(run, { tiles: await tileFacts(p) });
      await p.screenshot({ path: `${args.out}/${args.label}-${run.cfg}-viewport.png` });
      await p.locator('section[aria-label="Overview"]').screenshot({ path: `${args.out}/${args.label}-${run.cfg}-overview.png` }).catch(() => {});
    } catch (e) { run.error = String(e).slice(0, 200); }
    res.runs.push(run);
    console.log(run.cfg, `maxSw ${run.maxSw}/${run.iw} wideSamples ${run.wide}/${run.samples} fontsLoaded ${run.fontsLoaded} bad ${JSON.stringify(run.tiles?.bad)}`, run.error ?? '');
    await ctx.close();
  }
}
writeFileSync(`${args.out}/${args.label}-${args.mode}.json`, JSON.stringify(res, null, 1));
await b.close();
