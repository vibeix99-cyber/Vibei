// T2-D1 proof (W2R3 fix round): a notice and P's summary. One browser per invocation (slot gate).
//   node summary.mjs --base URL --out <dir> --cfg 375x667@2:light:100 [--fix 1]
// For a task day (newbie + task) and a big day (celebrate + task), four cases each:
//   none   no notice;
//   first  the update prompt raised in the same task as the brew's finish (it arrives with the summary's first frame);
//   after  the update prompt raised 2.6 s after arrival;
//   timed  a timed warning raised 2.6 s after arrival.
// Measured on the summary (lead's fold measure): the sheet's top, the footer's top, every row cut by the footer, the
// notice's box (if drawn), the stage art boxes (img/canvas); a full-size screenshot. With --fix: then Tea time by a real
// tap, and on the tea break: is the notice drawn, whole, its action on top (and Update reached by a real tap)?
import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';

const args = Object.fromEntries(process.argv.slice(2).reduce((a, x, i, all) => (x.startsWith('--') && a.push([x.slice(2), all[i + 1]]), a), []));
const m = args.cfg.match(/^(\d+)x(\d+)@(\d+):(light|dark):(\d+)$/);
const [W, H, DPR, theme, text] = [+m[1], +m[2], +m[3], m[4], +m[5]];
const dir = `${args.out}/${W}x${H}-${theme}-t${text}`;
mkdirSync(dir, { recursive: true });
const FIXED = Date.parse('2026-10-12T07:40:00.000Z');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const out = { base: args.base, cfg: args.cfg, runs: {}, errors: [] };
const b = await chromium.launch({ args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader', '--ignore-gpu-blocklist'] });
const toastFn = `(window.__kettle.toast ? Promise.resolve(window.__kettle.toast) : import('/src/ui/Toast.tsx').then((m) => m.toast))`;
async function day(seed, kinds) {
  const ctx = await b.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: DPR, isMobile: W < H && W < 900, hasTouch: W < 900, colorScheme: theme, serviceWorkers: 'block' });
  await ctx.addInitScript((pct) => {
    try { localStorage.setItem('kettle:settings', JSON.stringify({ state: { onboarded: true, scene: 'off', autoStartBreaks: false, autoStartFocus: false, muted: true }, version: 1 })); } catch {}
    if (pct !== 100) addEventListener('DOMContentLoaded', () => { const s = document.createElement('style'); s.textContent = `html{font-size:${pct}%!important}`; document.head.appendChild(s); });
  }, text);
  const p = await ctx.newPage();
  await p.clock.install({ time: FIXED });
  await p.clock.resume();
  await p.goto(`${args.base}/?debug&seed=${seed}&theme=${theme}#/`);
  await p.waitForFunction(() => { const t = window.__kettle?.timerInfo?.(); return !!(t && t.leader && t.leaderForMs > 400 && !t.settling); }, null, { timeout: 60_000 });
  await p.evaluate(() => document.fonts.ready);
  await sleep(800);
  for (const kind of kinds) {
    const key = `${seed}-${kind}`;
    try {
      await p.evaluate(`${toastFn}.then((t) => t.dismiss())`);
      await p.evaluate(() => window.__kettle.navigate('/'));
      await sleep(600);
      await p.evaluate(() => window.__kettle.timer.getState().startFocus({ intention: 'Chapter 3 notes', tag: 'study' }));
      await p.waitForFunction(() => location.hash === '#/focus');
      await sleep(1500);
      const upd = `t('A fresh brew of Kettle is ready.', { id: 'queued-update', icon: 'sparkle', duration: Infinity, action: { label: 'Update', onClick: () => (window.__upd = (window.__upd || 0) + 1) } })`;
      if (kind === 'first') await p.evaluate(`${toastFn}.then((t) => { ${upd}; window.__kettle.finish(); })`);
      else await p.evaluate(() => window.__kettle.finish());
      await p.waitForFunction(() => location.hash.includes('done'), null, { timeout: 30_000 });
      await sleep(2600);
      if (kind === 'after') await p.evaluate(`${toastFn}.then((t) => ${upd})`);
      if (kind === 'timed') await p.evaluate(`${toastFn}.then((t) => t('Couldn’t save just now. Your summary is still here.', { tone: 'warning' }))`);
      if (kind === 'after' || kind === 'timed') await sleep(1600);
      else await sleep(200);
      const geom = await p.evaluate(() => {
        const region = document.querySelector('[data-focus-view] [role=region]');
        const footer = region?.querySelector('footer');
        const F = footer ? footer.getBoundingClientRect().top : innerHeight;
        const rows = [...(region?.querySelectorAll('h1, h2, p, li, button, [role=button]') ?? [])].filter((e) => !e.closest('footer') && e.getBoundingClientRect().height > 0).map((e) => { const r = e.getBoundingClientRect(); return { t: (e.innerText || '').replace(/\s+/g, ' ').slice(0, 30), top: Math.round(r.top), bottom: Math.round(r.bottom), cut: r.top < F - 2 && r.bottom > F + 2 }; });
        const sheet = region?.firstElementChild?.firstElementChild?.getBoundingClientRect();
        const lis = [...document.querySelectorAll('[aria-label="Notifications"] li, [data-notice-strip] li')].map((li) => { const r = li.getBoundingClientRect(); return { text: li.textContent.trim().slice(0, 40), box: [r.left, r.top, r.width, r.height].map(Math.round), op: +getComputedStyle(li).opacity }; }).filter((n) => n.box[3] > 0 && n.op > 0.05);
        const hl = region?.querySelector('[data-highlight], [class*="unlock"]');
        const hr = hl?.getBoundingClientRect();
        const art = [...document.querySelectorAll('[data-focus-view] img, [data-focus-view] canvas')].map((e) => { const r = e.getBoundingClientRect(); return { el: e.tagName.toLowerCase(), box: [r.left, r.top, r.width, r.height].map(Math.round) }; }).filter((a) => a.box[2] > 0);
        return { F: Math.round(F), sheetTop: sheet ? Math.round(sheet.top) : null, cutRows: rows.filter((r) => r.cut), highlight: hr ? { top: Math.round(hr.top), bottom: Math.round(hr.bottom), whole: hr.bottom <= F + 1 && hr.top >= 0 } : null, notices: lis, art, said: document.querySelector('[data-notices-said]')?.lastElementChild?.textContent ?? null, queue: window.__kettle.notices?.()?.queue?.map((q) => q.message.slice(0, 30)) ?? null };
      });
      await p.screenshot({ path: `${dir}/${key}.png`, animations: 'disabled' });
      const run = { ...geom };
      if (args.fix && kind !== 'none') {
        // The person goes on: Tea time, a real tap. The notice is drawn in the tea break's first frames, whole.
        const tea = p.getByRole('button', { name: /^(Tea time|Long tea break)/ });
        const tb = await tea.boundingBox();
        if (W < 900) await p.touchscreen.tap(tb.x + tb.width / 2, tb.y + tb.height / 2); else await p.mouse.click(tb.x + tb.width / 2, tb.y + tb.height / 2);
        await p.getByRole('button', { name: /Pause break/ }).waitFor({ state: 'attached', timeout: 20_000 });
        await sleep(900);
        run.onBreak = await p.evaluate(() => {
          const li = document.querySelector('[data-notice-strip] li');
          if (!li) return { drawn: false };
          const r = li.getBoundingClientRect();
          const a = li.querySelector('button');
          let actionOnTop = null;
          if (a) { const q = a.getBoundingClientRect(); const h = document.elementFromPoint(q.left + q.width / 2, q.top + q.height / 2); actionOnTop = !!h && a.contains(h) && q.width >= 24 && q.height >= 24; }
          return { drawn: true, text: li.textContent.trim().slice(0, 40), box: [r.left, r.top, r.width, r.height].map(Math.round), inView: r.top >= 0 && r.bottom <= innerHeight, whole: li.scrollHeight <= li.clientHeight + 1, actionOnTop };
        });
        await p.screenshot({ path: `${dir}/${key}-break.png`, animations: 'disabled' });
        if (run.onBreak.actionOnTop) {
          const ab = await p.locator('[data-notice-strip] li button').boundingBox();
          if (W < 900) await p.touchscreen.tap(ab.x + ab.width / 2, ab.y + ab.height / 2); else await p.mouse.click(ab.x + ab.width / 2, ab.y + ab.height / 2);
          await sleep(300);
          run.updateReached = await p.evaluate(() => window.__upd ?? 0);
        }
        await p.evaluate(() => window.__kettle.timer.getState().reset?.() ?? window.__kettle.timer.getState().end?.('user'));
      } else {
        await p.evaluate(() => window.__kettle.navigate('/'));
      }
      await sleep(800);
      out.runs[key] = run;
    } catch (e) {
      out.errors.push(`${key}: ${e.message.slice(0, 200)}`);
    }
  }
  await ctx.close();
}
try {
  // A fresh profile for every case: the summary's content (and so P's fold) is the same in each, run to run.
  for (const seed of ['newbie', 'celebrate']) for (const kind of ['none', 'first', 'after', 'timed']) await day(seed, [kind]);
} finally {
  writeFileSync(`${dir}/summary.json`, JSON.stringify(out, null, 1));
  await b.close();
  const brief = Object.fromEntries(Object.entries(out.runs).map(([k, r]) => [k, `top ${r.sheetTop} F ${r.F} cut ${r.cutRows?.length} hl ${r.highlight ? r.highlight.whole : '-'} notices ${r.notices?.length}${r.onBreak ? ` break:${r.onBreak.drawn ? (r.onBreak.whole && r.onBreak.inView ? 'whole' : 'NOT whole') : 'none'}${r.onBreak.actionOnTop != null ? ` act:${r.onBreak.actionOnTop}/${r.updateReached}` : ''}` : ''}`]));
  console.log(args.cfg, JSON.stringify(brief), out.errors.join(' | ').slice(0, 300));
}
