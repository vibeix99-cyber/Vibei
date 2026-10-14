// Maker S (W3R1): F-T2-4 probe. Opens "Delete this brew?" (Stats › History › a brew › Delete this brew) and reports,
// for each configuration, whether Delete and Keep it are on screen, on top at their centre, reachable by Tab, and
// whether a real tap on Delete deletes the brew. One browser per invocation (run under the slot gate).
//   node dlgprobe.mjs --base http://127.0.0.1:5478 --out <dir> --cfgs 375x667:light:200,390x844:dark:100 [--tag before]
import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';

const args = Object.fromEntries(process.argv.slice(2).reduce((a, x, i, all) => (x.startsWith('--') && a.push([x.slice(2), all[i + 1]]), a), []));
const FIXED = Date.parse(args.at ?? '2026-10-12T07:40:00.000Z');
const tag = args.tag ?? 'probe';
mkdirSync(args.out, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const b = await chromium.launch({ args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader', '--ignore-gpu-blocklist'] });
const results = [];

const facts = (p) => p.evaluate(() => {
  const rect = (e) => { const r = e.getBoundingClientRect(); return [Math.round(r.left), Math.round(r.top), Math.round(r.width), Math.round(r.height)]; };
  const dlg = [...document.querySelectorAll('[role=dialog]')].pop();
  if (!dlg) return { dialog: null };
  const out = { dialog: dlg.getAttribute('aria-labelledby') && document.getElementById(dlg.getAttribute('aria-labelledby'))?.textContent, panel: rect(dlg), vh: innerHeight, vw: innerWidth, buttons: {} };
  for (const btn of dlg.querySelectorAll('button')) {
    const name = (btn.getAttribute('aria-label') || btn.innerText).trim();
    const r = btn.getBoundingClientRect();
    const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    const inView = r.top >= 0 && r.bottom <= innerHeight && r.left >= 0 && r.right <= innerWidth;
    const hit = cx >= 0 && cy >= 0 && cx < innerWidth && cy < innerHeight ? document.elementFromPoint(cx, cy) : null;
    // Visible inside every clipping ancestor (the panel hides overflow).
    let clipped = false;
    for (let a = btn.parentElement; a && a !== document.body; a = a.parentElement) {
      const cs = getComputedStyle(a);
      if (cs.overflow !== 'visible' || cs.overflowY !== 'visible') {
        const ar = a.getBoundingClientRect();
        if (cy < ar.top || cy > ar.bottom) clipped = true;
      }
    }
    out.buttons[name] = { box: rect(btn), inView, onTop: !!hit && (hit === btn || btn.contains(hit)), clipped };
  }
  return out;
});

for (const cfg of args.cfgs.split(',')) {
  const m = cfg.match(/^(\d+)x(\d+):(light|dark):(\d+)$/);
  const [W, H, theme, text] = [+m[1], +m[2], m[3], +m[4]];
  const mobile = W < 900;
  const ctx = await b.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 2, isMobile: mobile && W < H, hasTouch: mobile, colorScheme: theme, timezoneId: 'UTC', locale: 'en-GB', serviceWorkers: 'block' });
  if (text !== 100) await ctx.addInitScript((pct) => addEventListener('DOMContentLoaded', () => { const s = document.createElement('style'); s.textContent = `html{font-size:${pct}%!important}`; document.head.appendChild(s); }), text);
  const p = await ctx.newPage();
  await p.clock.install({ time: FIXED });
  await p.clock.resume();
  const r = { cfg, base: args.base };
  try {
    await p.goto(`${args.base}/?debug&seed=veteran&theme=${theme}#/stats`);
    await p.waitForFunction(() => !!window.__kettle, null, { timeout: 30_000 });
    await p.evaluate(() => window.__kettle.settings.getState().set({ muted: true }));
    await p.evaluate(() => document.fonts.ready);
    const n0 = await p.evaluate(() => window.__kettle.progress.getState().sessions.length);
    const row = p.locator('[data-session-row] button').first();
    await row.scrollIntoViewIfNeeded();
    await sleep(400);
    if (mobile) await row.tap(); else await row.click();
    await p.getByRole('dialog', { name: 'Edit brew' }).waitFor();
    await sleep(700);
    const del = p.getByRole('button', { name: 'Delete this brew' });
    await del.scrollIntoViewIfNeeded();
    if (mobile) await del.tap(); else await del.click();
    await p.getByRole('dialog', { name: 'Delete this brew?' }).waitFor();
    await sleep(900);
    r.facts = await facts(p);
    await p.screenshot({ path: `${args.out}/${tag}-${W}x${H}-${theme}-t${text}-dialog.png`, animations: 'disabled' });
    // Keyboard: Tab / Shift+Tab from the initial focus; record each focused control and whether it is on screen.
    const where = () => p.evaluate(() => { const a = document.activeElement; const r = a.getBoundingClientRect(); const hit = document.elementFromPoint(r.left + r.width / 2, Math.min(innerHeight - 1, Math.max(0, r.top + r.height / 2))); return `${(a.getAttribute('aria-label') || a.innerText || a.tagName).trim().slice(0, 30)}${r.bottom > innerHeight || r.top < 0 || !(hit && (hit === a || a.contains(hit))) ? ' [not visible]' : ''}`; });
    const seen = [await where()];
    for (let i = 0; i < 4; i++) { await p.keyboard.press('Tab'); seen.push(await where()); }
    await p.keyboard.press('Shift+Tab'); seen.push('⇧' + (await where()));
    r.tab = seen;
    // Reach Delete by Tab alone, press Enter: does the brew go?
    let reached = false;
    for (let i = 0; i < 6 && !reached; i++) { if ((await where()) === 'Delete') reached = true; else await p.keyboard.press('Tab'); }
    await p.screenshot({ path: `${args.out}/${tag}-${W}x${H}-${theme}-t${text}-dialog-tab.png`, animations: 'disabled' });
    if (reached) {
      await p.keyboard.press('Enter'); await sleep(900);
      r.keyDelete = (await p.evaluate(() => window.__kettle.progress.getState().sessions.length)) === n0 - 1 ? 'deleted by Tab + Enter' : 'Enter did not delete';
    } else r.keyDelete = 'Delete never received focus by Tab';
    // Fresh dialog for the touch/mouse test.
    const n1 = await p.evaluate(() => window.__kettle.progress.getState().sessions.length);
    if (await p.getByRole('dialog', { name: 'Delete this brew?' }).count()) { await p.keyboard.press('Escape'); await sleep(500); await p.keyboard.press('Escape'); await sleep(700); }
    const row2 = p.locator('[data-session-row] button').first();
    await row2.scrollIntoViewIfNeeded(); await sleep(300);
    if (mobile) await row2.tap(); else await row2.click();
    await p.getByRole('dialog', { name: 'Edit brew' }).waitFor(); await sleep(700);
    const del2 = p.getByRole('button', { name: 'Delete this brew' });
    await del2.scrollIntoViewIfNeeded();
    if (mobile) await del2.tap(); else await del2.click();
    await p.getByRole('dialog', { name: 'Delete this brew?' }).waitFor(); await sleep(900);
    // A person taps what they see: at the button's centre if it is on screen and not clipped; no programmatic scroll.
    for (const name of ['Keep it', 'Delete']) {
      const f = (await facts(p)).buttons[name];
      if (!f || !f.inView || f.clipped || !f.onTop) { r[`tap ${name}`] = `not reachable (box ${JSON.stringify(f?.box)}, inView ${f?.inView}, clipped ${f?.clipped})`; continue; }
      if (name === 'Keep it') { r['tap Keep it'] = 'reachable (on screen, on top)'; continue; }
      const [x, y, w, h] = f.box;
      if (mobile) await p.touchscreen.tap(x + w / 2, y + h / 2); else await p.mouse.click(x + w / 2, y + h / 2);
      await sleep(900);
      r['tap Delete'] = (await p.evaluate(() => window.__kettle.progress.getState().sessions.length)) === n1 - 1 ? 'deleted by a tap' : 'tap did not delete';
    }
  } catch (e) { r.error = e.message.slice(0, 300); }
  results.push(r);
  console.log(JSON.stringify(r));
  await ctx.close();
}
writeFileSync(`${args.out}/${tag}-dlgprobe.json`, JSON.stringify(results, null, 1));
await b.close();
