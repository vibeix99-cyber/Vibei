// Round-7 BEFORE/AFTER captures, same flow on every revision, date and clock fixed to one timestamp
// (page.clock.install({ time }) then resume: the same start instant everywhere), screenshots with
// animations:'disabled' (CSS, transitions and Web Animations, which carry the idle loops; the 3D scene is off).
// Setup uses the debug API only (seed none, quota fill, startFocus, ff, end); toasts in the focus and Break's over
// states are raised through the app's own toast() (labelled setup). Taps are real.
// node capture-r7.mjs <base> <rev> <outDir> <configs "390x844@100:light,...">
import { chromium } from 'playwright';
import { mkdirSync, appendFileSync } from 'node:fs';
const [,, base, rev, out, cfgArg] = process.argv;
mkdirSync(out, { recursive: true });
const FIXED = new Date('2026-10-10T15:20:00Z').getTime(); // a Saturday afternoon, same for every revision
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const b = await chromium.launch({ args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader', '--ignore-gpu-blocklist'] });
for (const c of cfgArg.split(',')) {
  const m = c.match(/^(\d+)x(\d+)@(\d+):(light|dark)$/); const W = +m[1], H = +m[2], text = +m[3], theme = m[4];
  const tag = `${W}x${H}-t${text}-${theme}`;
  const ctx = await b.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: W >= 900 ? 1 : 2, isMobile: W < 900, hasTouch: W < 900, colorScheme: theme, timezoneId: 'UTC', acceptDownloads: true });
  if (text !== 100) await ctx.addInitScript((pct) => addEventListener('DOMContentLoaded', () => { const s = document.createElement('style'); s.textContent = `html{font-size:${pct}%!important}`; document.head.appendChild(s); }), text);
  await ctx.addInitScript(() => { try { if (!localStorage.getItem('kettle:settings')) localStorage.setItem('kettle:settings', JSON.stringify({ state: { onboarded: true, name: 'Sam', scene: 'off', autoStartBreaks: false, autoStartFocus: false, muted: true }, version: 1 })); } catch {} });
  const p = await ctx.newPage();
  await p.clock.install({ time: FIXED });
  await p.clock.resume();
  const errors = []; p.on('pageerror', (e) => errors.push(e.message));
  const notes = { rev, base, tag, fixed: new Date(FIXED).toISOString(), shots: {} };
  const shot = async (name) => {
    await p.screenshot({ path: `${out}/${name}-${tag}.png`, animations: 'disabled' });
    notes.shots[name] = await p.evaluate(() => ({
      hash: location.hash,
      banner: !!document.querySelector('section[data-save-warning]'),
      note: !!document.querySelector('p[data-save-warning]'),
      warningToast: !!document.getElementById('toast-kettle:save-failed'),
      toasts: [...document.querySelectorAll('[aria-label="Notifications"] li')].map((li) => li.textContent.slice(0, 40)),
    }));
  };
  const toasts = (list) => p.evaluate(async (list) => { const { toast } = await import('/src/ui/Toast.tsx'); for (const [m, tone] of list) toast(m, { tone }); }, list);
  try {
    const ready = () => p.waitForFunction(() => { const t = window.__kettle?.timerInfo?.(); return !!(t && t.leader && t.leaderForMs > 400 && !t.settling); }, null, { timeout: 60_000 });
    await p.goto(`${base}/?debug&theme=${theme}#/`); await ready();
    await p.evaluate(() => document.fonts.ready);
    await p.evaluate(() => { let c = 'x'.repeat(1 << 20), k = 0; while (c.length >= 1) { try { localStorage.setItem(`filler${k++}`, c); } catch { c = c.slice(0, c.length / 2); } } });
    // 1. focus running, with toasts (setup toasts)
    await p.evaluate(() => window.__kettle.timer.getState().startFocus({ minutes: 25, intention: 'Chapter 3 notes', tag: 'study' }));
    await p.waitForFunction(() => location.hash === '#/focus'); await sleep(1500);
    await toasts([['Recipe done: Name what you’re brewing. +10 leaves', 'success'], ['Cozy level 2! Fairy lights are in your nook.', 'neutral']]);
    await sleep(900); await shot('focus-toasts');
    // 2. the summary
    await p.evaluate(() => { const k = window.__kettle; const s = k.timer.getState(); k.ff(s.endsAt - k.clock.now() - 50); });
    await p.waitForFunction(() => location.hash === '#/done', null, { timeout: 20_000 }); await sleep(2200);
    await shot('summary');
    // 2b. the summary's details expanded and scrolled to the last line (setup: as the capture tool's 08 does), with
    // the note present: the last line must clear the Tea time / Skip footer
    await p.evaluate(() => document.querySelector('[data-focus-view] [aria-expanded]')?.click()); await sleep(300);
    await p.evaluate(() => { const s = document.querySelector('[data-focus-view] [class*=scroll]'); if (s) s.scrollTop = 99999; }); await sleep(500);
    await shot('summary-end');
    notes.summaryEnd = await p.evaluate(() => {
      const sc = document.querySelector('[data-focus-view] [class*=scroll]');
      const foot = document.querySelector('[data-focus-view] footer');
      if (!sc || !foot) return null;
      const items = [...sc.querySelectorAll('li, p, dd, dt')].filter((e) => e.getBoundingClientRect().height > 0);
      const last = items.length ? Math.max(...items.map((e) => e.getBoundingClientRect().bottom)) : null;
      return { lastLineBottom: last && Math.round(last), footerTop: Math.round(foot.getBoundingClientRect().top), clears: last != null && last <= foot.getBoundingClientRect().top + 0.5 };
    });
    await p.evaluate(() => { const s = document.querySelector('[data-focus-view] [class*=scroll]'); if (s) s.scrollTop = 0; }); await sleep(300);
    // 3. Break's over, with toasts (setup toasts)
    const tea = p.getByRole('button', { name: /^Tea time|^Long tea break/ });
    if (W < 900) await tea.tap(); else await tea.click();
    await p.waitForFunction(() => location.hash === '#/focus'); await sleep(1200);
    await p.evaluate(() => { const k = window.__kettle; const s = k.timer.getState(); k.ff(s.endsAt - k.clock.now() - 50); });
    await p.waitForFunction(() => window.__kettle.timer.getState().status === 'idle', null, { timeout: 20_000 }); await sleep(1500);
    await toasts([['Recipe done: Brew for 30 minutes. +15 leaves', 'success'], ['Saved your rhythm.', 'neutral']]);
    await sleep(900); await shot('breakover-toasts');
    // 3b. Break's over scrolled to its end (real wheel), three toasts (setup toasts): the top bar's Close state
    await p.evaluate(async () => (await import('/src/ui/Toast.tsx')).toast.dismiss()); await sleep(500);
    for (let i = 0; i < 30; i++) {
      const pi = await p.evaluate(() => { const m = document.querySelector('[data-focus-view] main'); const r = m.getBoundingClientRect(); return { st: m.scrollTop, max: m.scrollHeight - m.clientHeight, x: Math.round((r.left + r.right) / 2), y: Math.round((Math.max(0, r.top) + Math.min(innerHeight, r.bottom)) / 2) }; });
      if (pi.st >= pi.max - 1) break;
      await p.mouse.move(pi.x, pi.y); await p.mouse.wheel(0, 120); await sleep(200);
    }
    await p.mouse.move(2, 2);
    await toasts([['Recipe done: Take 2 full tea breaks · +15 leaves', 'success'], ['Saved 12 minutes of focus', 'info'], ['Cozy level 5!', 'success']]);
    await sleep(900); await shot('breakover-end-3toasts');
    // 4. Today with the warning (leave Break's over, the toasts time out)
    await p.evaluate(() => window.__kettle.navigate('/'));
    await p.waitForFunction(() => location.hash === '#/'); await sleep(1500);
    await p.evaluate(() => scrollTo(0, 0)); await sleep(300);
    await shot('today');
    // 5. Settings › Your data
    await p.evaluate(() => window.__kettle.navigate('/settings')); await sleep(1500);
    await p.evaluate(() => { const h = [...document.querySelectorAll('h2, h3, p, div')].find((e) => e.textContent?.trim() === 'Your data'); (h ?? document.querySelector('section[data-save-warning]'))?.scrollIntoView({ block: 'start' }); scrollBy(0, -12); });
    await sleep(400); await shot('settings-data');
    // 6. LEAD-D1: back on Today, a real tap on Mark done (storage full): "Crossed off · Undo" and the warning
    await p.evaluate(() => window.__kettle.navigate('/')); await p.waitForFunction(() => location.hash === '#/'); await sleep(1200);
    await p.waitForFunction(() => document.querySelectorAll('[aria-label="Notifications"] li').length === 0 || !!document.getElementById('toast-kettle:save-failed'), null, { timeout: 15_000 }).catch(() => {});
    const md = p.locator('button[aria-label^="Mark “"]');
    notes.markDone = await md.count();
    if (notes.markDone) {
      await md.scrollIntoViewIfNeeded(); await sleep(300);
      if (W < 900) await md.tap(); else await md.click();
      await sleep(1300); await shot('lead-d1');
    }
  } catch (e) { notes.error = String(e.message).split('\n')[0]; }
  notes.errors = errors;
  appendFileSync(`${out}/notes-${rev}.jsonl`, JSON.stringify(notes) + '\n');
  console.log(JSON.stringify({ tag, error: notes.error, shots: Object.keys(notes.shots), markDone: notes.markDone }));
  await ctx.close();
}
await b.close();
