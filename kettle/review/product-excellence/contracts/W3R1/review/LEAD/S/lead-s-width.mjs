// LEAD-5 · W3R1 S: (1) does Stats widen past the screen while the web fonts are not there yet (a cold load)?
// (2) is any Overview tile's text cut? Base vs S trial, same frozen date, seed veteran, real page load.
//   node lead-s-width.mjs --base http://127.0.0.1:5522 --label TRIAL --out <dir>
// cfg: <w>x<h>:<100|200>:<mobile|desk>:<fonts|nofonts>
import { chromium } from '/home/user/wt/w5tr-s/kettle/node_modules/playwright/index.mjs';
import { mkdirSync, writeFileSync } from 'node:fs';
const args = Object.fromEntries(process.argv.slice(2).reduce((a, x, i, all) => (x.startsWith('--') && a.push([x.slice(2), all[i + 1]]), a), []));
const AT = Date.parse('2026-10-12T07:40:00.000Z');
mkdirSync(args.out, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const CFGS = (args.cfgs ?? '390x844:200:mobile:nofonts,390x844:200:mobile:fonts,844x390:200:desk:fonts,844x390:200:mobile:fonts,844x390:200:desk:nofonts,375x667:200:mobile:nofonts').split(',');
const b = await chromium.launch();
const out = { label: args.label, base: args.base, runs: [] };
for (const cfg of CFGS) {
  const [wh, text, kind, fonts] = cfg.split(':');
  const [w, h] = wh.split('x').map(Number);
  const mobile = kind === 'mobile';
  const ctx = await b.newContext({ viewport: { width: w, height: h }, isMobile: mobile, hasTouch: mobile, colorScheme: 'light', timezoneId: 'UTC', locale: 'en-GB', reducedMotion: 'reduce' });
  if (fonts === 'nofonts') await ctx.route(/\.(woff2?|ttf|otf)(\?.*)?$/, (r) => r.abort());
  if (text === '200') await ctx.addInitScript(() => document.addEventListener('DOMContentLoaded', () => { const s = document.createElement('style'); s.textContent = 'html{font-size:200%!important}'; document.head.appendChild(s); }));
  // Sample the layout width from the first frames on.
  await ctx.addInitScript(() => {
    window.__w = [];
    const t0 = performance.now();
    const off = () => {
      const iw = window.innerWidth;
      const hits = [];
      for (const e of document.querySelectorAll('body *')) {
        const r = e.getBoundingClientRect();
        if (r.width === 0 || r.height === 0 || r.right <= iw + 0.5) continue;
        const cs = getComputedStyle(e);
        if (cs.position === 'absolute' && cs.clip !== 'auto') continue;
        if (e.closest('.sr-only')) continue;
        hits.push(`${e.tagName}.${(e.className && e.className.baseVal === undefined ? e.className : '').toString().split(' ')[0]}:${Math.round(r.right)}:${(e.textContent || '').trim().slice(0, 24)}`);
      }
      return hits.slice(-6);
    };
    const tick = () => {
      const d = document.documentElement;
      if (d) {
        const sw = d.scrollWidth, iw = window.innerWidth;
        const rec = { t: Math.round(performance.now() - t0), sw, iw, vv: window.visualViewport ? Math.round(window.visualViewport.width) : null };
        if (sw > iw + 0.5 && !window.__wOff) window.__wOff = off();
        window.__w.push(rec);
      }
      if (performance.now() - t0 < 6000) setTimeout(tick, 50);
    };
    tick();
  });
  const page = await ctx.newPage();
  await page.clock.install({ time: AT });
  await page.clock.resume();
  const run = { cfg };
  try {
    await page.goto(`${args.base}/?debug&seed=veteran&theme=light#/stats`);
    await page.waitForFunction(() => !!window.__kettle, null, { timeout: 60_000 });
    await sleep(6200);
    run.samples = await page.evaluate(() => window.__w);
    run.maxSw = Math.max(...run.samples.map((s) => s.sw));
    run.iw = run.samples.at(-1)?.iw;
    run.wideSamples = run.samples.filter((s) => s.sw > s.iw + 0.5).length;
    run.wideAt = await page.evaluate(() => window.__wOff ?? null);
    run.cols = await page.evaluate(() => window.__cols ?? null);
    run.fontsLoaded = await page.evaluate(() => [...document.fonts].filter((f) => f.status === 'loaded').map((f) => f.family).join(','));
    // Overview tiles: any text cut (ellipsis or overflow) in a tile?
    run.tiles = await page.evaluate(() => {
      const ov = document.querySelector('[aria-label="Overview"]');
      if (!ov) return null;
      // A tile = a direct child of the tiles grid. Cut = scrollWidth > clientWidth with overflow not visible;
      // past = the text's own line boxes (a Range) end beyond the tile's right edge (a nowrap value overflowing visibly).
      const grid = ov.querySelector('[class*="tiles"]');
      const tiles = grid ? [...grid.children] : [];
      window.__cols = grid ? getComputedStyle(grid).gridTemplateColumns.split(' ').length : null;
      window.__ovH = Math.round(ov.getBoundingClientRect().height);
      const out = [];
      for (const t of tiles) {
        const tr = t.getBoundingClientRect();
        for (const e of t.querySelectorAll('*')) {
          if (!(e.children.length === 0 && (e.textContent || '').trim())) continue;
          const cs = getComputedStyle(e);
          const cut = e.scrollWidth > e.clientWidth + 0.5 && cs.overflow !== 'visible';
          const rg = document.createRange(); rg.selectNodeContents(e);
          const right = Math.max(...[...rg.getClientRects()].map((q) => q.right));
          const past = right > tr.right + 0.5;
          if (cut || past) out.push({ text: e.textContent.trim(), cut, past, sw: e.scrollWidth, cw: e.clientWidth, right: Math.round(right), tileRight: Math.round(tr.right) });
        }
      }
      return out;
    });
    run.ovH = await page.evaluate(() => window.__ovH ?? null);
    await page.locator('[aria-label="Overview"]').first().screenshot({ path: `${args.out}/${args.label}-${cfg.replaceAll(':', '-')}-overview.png` }).catch(() => {});
  } catch (e) {
    run.error = String(e).slice(0, 300);
  }
  out.runs.push(run);
  console.log(cfg, `maxSw ${run.maxSw}/${run.iw} wideSamples ${run.wideSamples}/${run.samples?.length}`, 'wideAt', JSON.stringify(run.wideAt), 'cutTiles', JSON.stringify(run.tiles?.map((t) => `${t.text}:${t.cut ? 'cut' : ''}${t.past ? 'past' : ''}`)), 'cols', run.cols, 'ovH', run.ovH, 'fonts', run.fontsLoaded || '-', run.error ?? '');
  await ctx.close();
}
await b.close();
writeFileSync(`${args.out}/lead-s-width-${args.label}.json`, JSON.stringify(out, null, 1));
