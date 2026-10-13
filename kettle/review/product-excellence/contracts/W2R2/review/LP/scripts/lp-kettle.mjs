// Lane P: kettle anatomy on the summary (routine day): every painted element of the stage kettle <svg> with its bottom, opacity and fill,
// vs the sheet's top edge. Helps read "kettle ink clear" (a faint glow ellipse extends below the drawn kettle).
//   node lp-kettle.mjs --out <dir> --cfgs 375x667@2:light:100,390x844@2:light:100
import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';
const args = Object.fromEntries(process.argv.slice(2).reduce((a, x, i, all) => (x.startsWith('--') && a.push([x.slice(2), all[i + 1]]), a), []));
const FIXED = Date.parse('2026-10-11T07:40:00.000Z');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
mkdirSync(args.out, { recursive: true });
const b = await chromium.launch({ args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader', '--ignore-gpu-blocklist'] });
const builds = [['C', 'http://127.0.0.1:5430'], ['P', 'http://127.0.0.1:5452']];
const out = [];
try {
  for (const cfg of args.cfgs.split(',')) {
    const m = cfg.match(/^(\d+)x(\d+)@(\d+):(light|dark):(\d+)$/); const [W, H, DPR, theme, text] = [+m[1], +m[2], +m[3], m[4], +m[5]];
    await Promise.all(builds.map(async ([side, base]) => {
      const ctx = await b.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: DPR, isMobile: true, hasTouch: true, colorScheme: theme, timezoneId: 'UTC', locale: 'en-GB', serviceWorkers: 'block' });
      if (text !== 100) await ctx.addInitScript((pct) => addEventListener('DOMContentLoaded', () => { const s = document.createElement('style'); s.textContent = `html{font-size:${pct}%!important}`; document.head.appendChild(s); }), text);
      const p = await ctx.newPage();
      await p.clock.install({ time: FIXED }); await p.clock.resume();
      await p.goto(`${base}/?debug&seed=veteran&theme=${theme}#/`);
      await p.waitForFunction(() => { const t = window.__kettle?.timerInfo?.(); return !!(t && t.leader && t.leaderForMs > 400 && !t.settling); }, null, { timeout: 60_000 }).catch(() => {});
      await p.evaluate(() => document.fonts.ready);
      await p.evaluate(() => window.__kettle.settings.getState().set({ muted: true, autoStartBreaks: false, autoStartFocus: false }));
      await sleep(1200);
      const st = p.getByRole('button', { name: /^Put the kettle on/i }).first(); await st.scrollIntoViewIfNeeded(); await st.click();
      await p.waitForFunction(() => location.hash === '#/focus', null, { timeout: 15_000 }); await sleep(2500);
      await p.evaluate(() => window.__kettle.finish());
      await p.waitForFunction(() => location.hash.includes('done'), null, { timeout: 30_000 });
      await sleep(4500);
      const r = await p.evaluate(() => {
        const region = document.querySelector('h1[tabindex="-1"]').closest('[role=region]');
        const sheet = region.firstElementChild.firstElementChild;
        const sheetTop = sheet.getBoundingClientRect().top - 2;
        const svg = [...document.querySelectorAll('svg[role=img][data-state]')].find((s) => !region.contains(s));
        const sb = svg.getBoundingClientRect();
        const els = [];
        for (const e of svg.querySelectorAll('path,ellipse,circle,rect,polygon,polyline,line,use,image')) {
          if (e.closest('defs,clipPath,mask,pattern,linearGradient,radialGradient,filter,symbol')) continue;
          const q = e.getBoundingClientRect(); if (q.width < 0.5 && q.height < 0.5) continue;
          let eff = 1; for (let a = e; a && a !== svg.parentElement; a = a.parentElement) eff *= +getComputedStyle(a).opacity;
          const cs = getComputedStyle(e);
          els.push({ tag: e.tagName.toLowerCase(), cls: String(e.getAttribute('class') ?? '').slice(0, 30), bottom: +q.bottom.toFixed(1), top: +q.top.toFixed(1), w: +q.width.toFixed(1), effOpacity: +eff.toFixed(3), fill: cs.fill.slice(0, 40), fillOpacity: cs.fillOpacity, display: cs.display, visibility: cs.visibility });
        }
        els.sort((a, b2) => b2.bottom - a.bottom);
        const visible = els.filter((e) => e.display !== 'none' && e.visibility !== 'hidden' && e.effOpacity > 0.3);
        return { sheetTopEdge: +sheetTop.toFixed(1), svgBox: { t: +sb.top.toFixed(1), b: +sb.bottom.toFixed(1), l: +sb.left.toFixed(1), r: +sb.right.toFixed(1) }, svgClear: +(sheetTop - sb.bottom).toFixed(1), lowestAll: els.slice(0, 6), lowestOpaque: visible.slice(0, 6), opaqueBottom: visible[0]?.bottom ?? null, opaqueClear: visible[0] ? +(sheetTop - visible[0].bottom).toFixed(1) : null, nEls: els.length, state: svg.getAttribute('data-state'), overflow: getComputedStyle(svg).overflow };
      });
      await p.screenshot({ path: `${args.out}/${cfg.replace(/[@:]/g, '_')}-${side}-kettle.png`, animations: 'disabled' });
      out.push({ cfg, side, ...r });
      console.log(cfg, side, `svgClear ${r.svgClear} opaqueClear ${r.opaqueClear} lowestAll[0] ${JSON.stringify(r.lowestAll[0])}`);
      await ctx.close();
    }));
  }
} finally { writeFileSync(`${args.out}/kettle-anatomy.json`, JSON.stringify(out, null, 1)); await b.close(); }
