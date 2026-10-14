// Maker S (W3R1): every Sheet/Dialog use, base vs candidate. For each sheet: are its buttons on screen, on top at their
// centre and not clipped by the panel, and where does Tab go (6 presses from the initial focus). One browser per run.
//   node sheetprobe.mjs --base http://127.0.0.1:5478 --out <dir> --cfgs 375x667:light:200,... --tag base
import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';

const args = Object.fromEntries(process.argv.slice(2).reduce((a, x, i, all) => (x.startsWith('--') && a.push([x.slice(2), all[i + 1]]), a), []));
const FIXED = Date.parse(args.at ?? '2026-10-12T07:40:00.000Z');
const tag = args.tag ?? 'probe';
mkdirSync(args.out, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const b = await chromium.launch({ args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader', '--ignore-gpu-blocklist'] });
const all = [];

const facts = (p) => p.evaluate(() => {
  const dlg = [...document.querySelectorAll('[role=dialog]')].pop();
  if (!dlg) return null;
  const title = document.getElementById(dlg.getAttribute('aria-labelledby'))?.textContent;
  const buttons = [];
  for (const btn of dlg.querySelectorAll('button')) {
    const r = btn.getBoundingClientRect();
    if (r.width < 1) continue;
    const name = (btn.getAttribute('aria-label') || btn.innerText).replace(/\s+/g, ' ').trim().slice(0, 28);
    const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    const inView = r.top >= 0 && r.bottom <= innerHeight + 0.5;
    const hit = cx >= 0 && cy >= 0 && cx < innerWidth && cy < innerHeight ? document.elementFromPoint(cx, cy) : null;
    let clipped = false;
    for (let a = btn.parentElement; a && a !== document.body; a = a.parentElement) {
      const cs = getComputedStyle(a);
      if (cs.overflowY !== 'visible') { const ar = a.getBoundingClientRect(); if (cy < ar.top || cy > ar.bottom) clipped = true; }
    }
    // A button inside a scrolling area (the body) is reachable by scrolling; one in the footer must be on screen.
    const inScroller = !!btn.closest('[class*="body"]') || (!!btn.closest('[data-tight]') && !btn.closest('[class*="footer"]'));
    buttons.push({ name, ok: inScroller || (inView && !!hit && (hit === btn || btn.contains(hit)) && !clipped), inScroller, top: Math.round(r.top), bottom: Math.round(r.bottom) });
  }
  const pr = dlg.getBoundingClientRect();
  return { title, panel: [Math.round(pr.top), Math.round(pr.bottom)], vh: innerHeight, buttons };
});
const where = (p) => p.evaluate(() => { const a = document.activeElement; const r = a.getBoundingClientRect(); return `${(a.getAttribute('aria-label') || a.innerText || a.tagName).replace(/\s+/g, ' ').trim().slice(0, 22)}${r.bottom > innerHeight + 1 || r.top < -1 ? ' [off]' : ''}`; });

const SHEETS = [
  { id: 'today-streak', route: '#/', open: (p) => p.locator('nav[aria-label="Your progress"] button[data-kind=streak]').click() },
  { id: 'today-leaves', route: '#/', open: (p) => p.locator('nav[aria-label="Your progress"] button[data-kind=leaves]').click() },
  { id: 'today-level', route: '#/', open: (p) => p.locator('nav[aria-label="Your progress"] button[data-kind=level]').click() },
  { id: 'settings-reset', route: '#/settings', open: async (p) => { const r = p.getByRole('button', { name: /^Reset everything/ }); await r.scrollIntoViewIfNeeded(); await r.click(); } },
  { id: 'stats-badge', route: '#/stats', open: async (p) => { const r = p.locator('button[aria-label*="tier"], button[aria-label*="earned"]').first(); await r.scrollIntoViewIfNeeded(); await r.click(); } },
  { id: 'stats-edit', route: '#/stats', open: async (p) => { const r = p.locator('[data-session-row] button').first(); await r.scrollIntoViewIfNeeded(); await r.click(); } },
  { id: 'stats-delete', route: '#/stats', nested: true, open: async (p) => { const r = p.locator('[data-session-row] button').first(); await r.scrollIntoViewIfNeeded(); await r.click(); await p.getByRole('dialog', { name: 'Edit brew' }).waitFor(); await sleep(600); const d = p.getByRole('button', { name: 'Delete this brew' }); await d.scrollIntoViewIfNeeded(); await d.click(); } },
  { id: 'focus-ambience', route: 'focus', open: async (p) => { const r = p.getByRole('button', { name: /^Ambience:/ }).first(); await r.scrollIntoViewIfNeeded(); await r.click(); } },
  { id: 'focus-end-early', route: 'focus', open: async (p) => { const r = p.getByRole('button', { name: 'End session' }).first(); await r.scrollIntoViewIfNeeded(); await r.click(); } },
  { id: 'focus-end-3min', route: 'focus', open: async (p) => { await p.evaluate(() => window.__kettle.ff(3 * 60_000)); await sleep(400); const r = p.getByRole('button', { name: 'End session' }).first(); await r.scrollIntoViewIfNeeded(); await r.click(); } },
];

for (const cfg of args.cfgs.split(',')) {
  const m = cfg.match(/^(\d+)x(\d+):(light|dark):(\d+)$/);
  const [W, H, theme, text] = [+m[1], +m[2], m[3], +m[4]];
  const mobile = W < 900;
  const ctx = await b.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 1, isMobile: mobile && W < H, hasTouch: mobile, colorScheme: theme, timezoneId: 'UTC', locale: 'en-GB', serviceWorkers: 'block' });
  if (text !== 100) await ctx.addInitScript((pct) => addEventListener('DOMContentLoaded', () => { const s = document.createElement('style'); s.textContent = `html{font-size:${pct}%!important}`; document.head.appendChild(s); }), text);
  const p = await ctx.newPage();
  await p.clock.install({ time: FIXED });
  await p.clock.resume();
  await p.goto(`${args.base}/?debug&seed=veteran&theme=${theme}#/`);
  await p.waitForFunction(() => !!window.__kettle, null, { timeout: 30_000 });
  await p.evaluate(() => window.__kettle.settings.getState().set({ muted: true, autoStartBreaks: false, autoStartFocus: false, scene: 'off' }));
  await p.evaluate(() => document.fonts.ready);
  let inFocus = false;
  for (const sh of SHEETS) {
    const r = { cfg, id: sh.id };
    try {
      if (sh.route === 'focus') {
        if (!inFocus) {
          await p.evaluate(() => window.__kettle.navigate('/')); await sleep(800);
          const st = p.getByRole('button', { name: /^Put the kettle on/ }).first(); await st.scrollIntoViewIfNeeded(); await st.click();
          await p.waitForFunction(() => location.hash === '#/focus', null, { timeout: 15_000 }); await sleep(1500); inFocus = true;
        }
      } else { await p.evaluate((h) => window.__kettle.navigate(h.slice(1)), sh.route); await sleep(900); }
      await sh.open(p);
      await p.waitForFunction(() => document.querySelectorAll('[role=dialog]').length > 0, null, { timeout: 8000 });
      await sleep(900);
      r.facts = await facts(p);
      await p.screenshot({ path: `${args.out}/${tag}-${W}x${H}-${theme}-t${text}-${sh.id}.png`, animations: 'disabled' });
      const tab = [await where(p)];
      for (let i = 0; i < 6; i++) { await p.keyboard.press('Tab'); tab.push(await where(p)); }
      r.tab = tab;
      r.allOk = r.facts.buttons.every((x) => x.ok);
      r.tabMoves = new Set(tab).size > 1;
    } catch (e) { r.error = e.message.split('\n')[0].slice(0, 160); }
    for (let i = 0; i < 3 && (await p.locator('[role=dialog]').count()); i++) { await p.keyboard.press('Escape'); await sleep(500); }
    all.push(r);
    console.log(JSON.stringify({ cfg, id: sh.id, allOk: r.allOk, tabMoves: r.tabMoves, bad: r.facts?.buttons.filter((x) => !x.ok).map((x) => `${x.name} ${x.top}-${x.bottom}`), panel: r.facts?.panel, error: r.error }));
  }
  await ctx.close();
}
writeFileSync(`${args.out}/${tag}-sheetprobe.json`, JSON.stringify(all, null, 1));
await b.close();
