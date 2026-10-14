// LR-x7.mjs <outdir> : Settings at 390x844@2, base preview :5488 vs merged-tree preview :5550, light and dark.
// Measures the top (document y, css px) of every block in the Settings screen, plus the shell around it, to find where a shift starts.
import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';
const out = process.argv[2]; mkdirSync(out, { recursive: true });
const FIXED = Date.parse('2026-10-12T07:40:00.000Z');
const SIDES = [['base', 'http://127.0.0.1:5488'], ['final', 'http://127.0.0.1:5550']];
const b = await chromium.launch({ args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader', '--ignore-gpu-blocklist'] });
const res = {};
for (const theme of ['dark', 'light']) for (const [side, base] of SIDES) for (const how of ['direct', 'viaHome']) for (let rep = 0; rep < 2; rep++) {
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, colorScheme: theme, reducedMotion: 'no-preference' });
  await ctx.clock.install({ time: FIXED }); await ctx.clock.resume();
  const p = await ctx.newPage();
  const nt = theme === 'light' ? '&nooktime=day' : '';
  await p.goto(`${base}/?debug&seed=veteran&theme=${theme}${nt}#${how === 'direct' ? '/settings' : '/'}`, { waitUntil: 'networkidle' });
  await p.evaluate(() => document.fonts.ready);
  await p.evaluate(() => window.__kettle.settings.getState().set({ autoStartBreaks: false, muted: true }));
  await p.waitForTimeout(1200);
  if (how === 'viaHome') { await p.evaluate(() => window.__kettle.navigate('/settings')); await p.waitForTimeout(1800); }
  await p.waitForFunction(() => !document.querySelector('[data-route-leaving]'), null, { timeout: 15000 }).catch(() => {});
  await p.waitForTimeout(600);
  const dump = await p.evaluate(() => {
    const y = (e) => Math.round((e.getBoundingClientRect().top + scrollY) * 100) / 100;
    const cs = (e) => { const c = getComputedStyle(e); return { pt: c.paddingTop, mt: c.marginTop, bt: c.borderTopWidth, fs: c.fontSize, lh: c.lineHeight, disp: c.display, pos: c.position }; };
    const rows = [];
    const root = document.querySelector('main') ?? document.body;
    const walk = (e, d) => {
      if (d > 7) return;
      const r = e.getBoundingClientRect();
      if (r.width === 0 && r.height === 0) return;
      const own = [...e.childNodes].filter((n) => n.nodeType === 3).map((n) => n.textContent.trim()).join(' ').slice(0, 28);
      rows.push({ d, tag: e.tagName.toLowerCase(), cls: String(e.className?.baseVal ?? e.className).split(' ').map((x) => x.replace(/_[A-Za-z0-9]{5,}$/, '')).filter(Boolean).slice(0, 2).join('.'), txt: own, top: y(e), h: Math.round(r.height * 100) / 100, ...cs(e) });
      for (const c of e.children) walk(c, d + 1);
    };
    walk(root, 0);
    const shell = [...document.querySelectorAll('body *')].filter((e) => !root.contains(e) && e.getBoundingClientRect().height > 0 && e.getBoundingClientRect().top < 140).slice(0, 25).map((e) => ({ tag: e.tagName.toLowerCase(), cls: String(e.className?.baseVal ?? e.className).split(' ').map((x) => x.replace(/_[A-Za-z0-9]{5,}$/, '')).filter(Boolean).slice(0, 2).join('.'), attrs: [...e.attributes].map((a) => a.name).filter((n) => n.startsWith('data-')).join(','), top: y(e), h: Math.round(e.getBoundingClientRect().height * 100) / 100, pos: getComputedStyle(e).position }));
    const h1 = document.querySelector('h1');
    const labels = [...document.querySelectorAll('main h2, main h3, main [class*="label"], main [class*="sectionLabel"], main [class*="eyebrow"]')].map((e) => ({ txt: e.textContent.trim().slice(0, 30), top: y(e) }));
    return { h1: h1 ? { txt: h1.textContent, top: y(h1), h: h1.getBoundingClientRect().height } : null, docH: document.documentElement.scrollHeight, rows, shell, labels, hash: location.hash, scrollY, noticeStrip: [...document.querySelectorAll('[data-notice-strip]')].map((e) => ({ top: y(e), h: e.getBoundingClientRect().height, room: e.hasAttribute('data-room') })) };
  });
  res[`${side}|${theme}|${how}|${rep}`] = dump;
  await ctx.close();
  console.log(side, theme, how, rep, 'h1', dump.h1?.top, 'docH', dump.docH, 'rows', dump.rows.length);
}
await b.close();
writeFileSync(`${out}/x7-dump.json`, JSON.stringify(res));
