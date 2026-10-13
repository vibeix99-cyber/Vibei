// W2H-D1 / (b) probe (Maker T2, W2R3). One browser per invocation (run under the slot gate). Real input only after setup.
//   node endtap.mjs --base http://127.0.0.1:5471 --cfg 390x844@2:light:200 [--tapAt 600] [--out file.json]
// Per configuration:
//  1. Today at rest (veteran): every Brew length option wholly in the initial view, >= 24x24, 9/9 points on top.
//  2. A brew with a task, ended early by real taps (End -> End session) -> Today. From the End tap, every animation frame
//     for 6 s: what is on top at Mark done's centre (itself, a notice, a dialog, other), any dialog / #root[inert],
//     every notice box (old floating toasts or the new strip) and whether it intersects Mark done, the field, the clear
//     button, a Brew length option or the docked start. At +tapAt ms a real tap at Mark done's centre (if it is in view
//     and on top; otherwise "not on top" is recorded and nothing is tapped), then: was the task crossed off?
import { chromium } from 'playwright';
import { writeFileSync } from 'node:fs';

const args = Object.fromEntries(process.argv.slice(2).reduce((a, x, i, all) => (x.startsWith('--') && a.push([x.slice(2), all[i + 1]]), a), []));
const m = args.cfg.match(/^(\d+)x(\d+)@(\d+):(light|dark):(\d+)$/);
const [W, H, DPR, theme, text] = [+m[1], +m[2], +m[3], m[4], +m[5]];
const TAP = +(args.tapAt ?? 600);
const FIXED = Date.parse(args.at ?? '2026-10-12T07:40:00.000Z');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const out = { base: args.base, cfg: args.cfg, tapAt: TAP, fixed: new Date(FIXED).toISOString() };
const b = await chromium.launch({ args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader', '--ignore-gpu-blocklist'] });
async function ctxPage() {
  const ctx = await b.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: DPR, isMobile: W < 900 && W < H, hasTouch: W < 900, colorScheme: theme, serviceWorkers: 'block' });
  await ctx.addInitScript((pct) => {
    try {
      localStorage.setItem('kettle:settings', JSON.stringify({ state: { onboarded: true, scene: 'off', autoStartBreaks: false, autoStartFocus: false, muted: true }, version: 1 }));
    } catch {}
    if (pct !== 100) addEventListener('DOMContentLoaded', () => { const s = document.createElement('style'); s.textContent = `html{font-size:${pct}%!important}`; document.head.appendChild(s); });
  }, text);
  const p = await ctx.newPage();
  await p.clock.install({ time: FIXED });
  await p.clock.resume();
  return { ctx, p };
}
const ready = (p) => p.waitForFunction(() => { const t = window.__kettle?.timerInfo?.(); return !!(t && t.leader && t.leaderForMs > 400 && !t.settling); }, null, { timeout: 60_000 });
const tapAt = async (p, x, y) => (W < 900 ? p.touchscreen.tap(x, y) : p.mouse.click(x, y));
async function tapEl(p, loc) {
  await loc.scrollIntoViewIfNeeded();
  const r = await loc.boundingBox();
  await tapAt(p, r.x + r.width / 2, r.y + r.height / 2);
}
try {
  // 1. Brew length at rest.
  {
    const { ctx, p } = await ctxPage();
    await p.goto(`${args.base}/?debug&seed=veteran&theme=${theme}#/`);
    await ready(p);
    await p.evaluate(() => document.fonts.ready);
    await sleep(1500);
    out.brewLength = await p.evaluate(() =>
      [...document.querySelectorAll('#home-brew-length [role=radio]')].map((e) => {
        const r = e.getBoundingClientRect();
        let n = 0;
        for (const fx of [0.15, 0.5, 0.85]) for (const fy of [0.15, 0.5, 0.85]) {
          const x = r.left + r.width * fx, y = r.top + r.height * fy;
          const h = x >= 0 && y >= 0 && x < innerWidth && y < innerHeight ? document.elementFromPoint(x, y) : null;
          if (h && e.contains(h)) n++;
        }
        return { name: (e.textContent || '').trim(), box: [r.left, r.top, r.width, r.height].map(Math.round), inView: r.top >= 0 && r.bottom <= innerHeight && r.left >= 0 && r.right <= innerWidth, big: r.width >= 24 && r.height >= 24, points: n };
      }),
    );
    out.brewLengthOk = out.brewLength.length > 0 && out.brewLength.every((o) => o.inView && o.big && o.points === 9);
    await ctx.close();
  }
  // 2. End -> Today, Mark done at +tapAt.
  const { ctx, p } = await ctxPage();
  await p.goto(`${args.base}/?debug&seed=newbie&theme=${theme}#/`);
  await ready(p);
  await p.evaluate(() => document.fonts.ready);
  await sleep(800);
  const field = p.getByRole('textbox', { name: /What are you brewing/ });
  await tapEl(p, field);
  await p.keyboard.type('Chapter 3 notes');
  await p.keyboard.press('Escape').catch(() => {});
  await tapEl(p, p.getByRole('button', { name: /^Put the kettle on · / }));
  await p.waitForFunction(() => location.hash === '#/focus', null, { timeout: 15_000 });
  await sleep(1500);
  await p.evaluate(() => window.__kettle.ff(3 * 60_000));
  await sleep(500);
  await tapEl(p, p.getByRole('button', { name: 'End session' }).first());
  const sheet = p.getByRole('dialog', { name: 'Leave the kettle early?' });
  await sheet.waitFor({ timeout: 10_000 });
  await sleep(600);
  // The recorder starts at the End session tap.
  await p.evaluate(() => {
    const R = (window.__rec = { t0: performance.now(), frames: [], stop: false });
    const notices = () => [...document.querySelectorAll('[aria-label="Notifications"] li, [data-notice-strip] li')].filter((li) => +getComputedStyle(li).opacity > 0.02 && li.getBoundingClientRect().height > 0);
    const f = () => {
      if (R.stop) return;
      const t = Math.round(performance.now() - R.t0);
      const mark = [...document.querySelectorAll('button')].find((b) => /^Mark “Chapter 3 notes” done/.test(b.getAttribute('aria-label') || '') && !b.closest('[data-route-leaving]'));
      let at = 'absent';
      let mbox = null;
      if (mark) {
        const r = mark.getBoundingClientRect();
        mbox = r;
        const x = r.left + r.width / 2, y = r.top + r.height / 2;
        if (y < 0 || y >= innerHeight) at = 'off screen';
        else {
          const h = document.elementFromPoint(x, y);
          at = !h ? 'nothing' : mark.contains(h) ? 'itself' : h.closest('[aria-label="Notifications"] li, [data-notice-strip] li') ? 'notice' : h.closest('[role=dialog]') ? 'dialog' : `${h.tagName.toLowerCase()}.${String(h.className?.baseVal ?? h.className ?? '').split(' ')[0].slice(0, 28)}`;
        }
      }
      const prot = [mark, document.querySelector('main input'), ...document.querySelectorAll('main input ~ button, #home-brew-length [role=radio], [data-length] > button, main [class*="ctaDock"] > button')].filter((e) => e && !e.closest('[data-route-leaving]'));
      const ns = notices().map((n) => n.getBoundingClientRect());
      const over = [];
      for (const e of prot) {
        const q = e.getBoundingClientRect();
        if (ns.some((r) => q.right > r.left + 0.5 && q.left < r.right - 0.5 && q.bottom > r.top + 0.5 && q.top < r.bottom - 0.5)) over.push((e.getAttribute('aria-label') || e.textContent || e.tagName).trim().slice(0, 24));
      }
      R.frames.push({ t, at, dialog: !!document.querySelector('[role=dialog]'), inert: !!document.getElementById('root')?.hasAttribute('inert'), notices: ns.length, over, hash: location.hash });
      requestAnimationFrame(f);
    };
    requestAnimationFrame(f);
  });
  const endBtn = sheet.getByRole('button', { name: 'End session' });
  const eb = await endBtn.boundingBox();
  const t0 = Date.now();
  await tapAt(p, eb.x + eb.width / 2, eb.y + eb.height / 2);
  await sleep(Math.max(0, TAP - (Date.now() - t0)));
  const spot = await p.evaluate(() => {
    const mark = [...document.querySelectorAll('button')].find((b) => /^Mark “Chapter 3 notes” done/.test(b.getAttribute('aria-label') || '') && !b.closest('[data-route-leaving]'));
    if (!mark) return { on: false, why: 'absent' };
    const r = mark.getBoundingClientRect();
    const x = r.left + r.width / 2, y = r.top + r.height / 2;
    if (y < 0 || y >= innerHeight) return { on: false, why: 'off screen', y };
    const h = document.elementFromPoint(x, y);
    return { on: !!h && mark.contains(h), why: h ? `${h.tagName}.${String(h.className?.baseVal ?? h.className ?? '').slice(0, 30)}` : 'nothing', x, y };
  });
  out.tapAtMs = Date.now() - t0;
  out.markDoneAtTap = spot;
  if (spot.x != null) await tapAt(p, spot.x, spot.y); // tapped where Mark done is drawn, whatever is on top there
  await sleep(1200);
  out.crossedOff = await p.evaluate(() => {
    const s = window.__kettle.progress.getState().sessions;
    const r = [...s].reverse().find((x) => x.intention === 'Chapter 3 notes');
    return r ? r.outcome ?? null : 'no record';
  });
  await sleep(Math.max(0, 6000 - (Date.now() - t0)));
  const R = await p.evaluate(() => { window.__rec.stop = true; return window.__rec.frames; });
  const count = (fn) => R.filter(fn).length;
  out.frames = R.length;
  out.markCovered = count((f) => f.at !== 'itself' && f.at !== 'absent' && f.at !== 'off screen' && f.hash === '#/');
  out.markCoveredBy = [...new Set(R.filter((f) => f.at !== 'itself' && f.at !== 'absent' && f.at !== 'off screen' && f.hash === '#/').map((f) => f.at))];
  out.dialogFramesOnToday = count((f) => f.hash === '#/' && (f.dialog || f.inert));
  out.lastDialogMs = Math.max(-1, ...R.filter((f) => f.dialog || f.inert).map((f) => f.t));
  out.noticeOverProtected = count((f) => f.over.length > 0);
  out.overWhat = [...new Set(R.flatMap((f) => f.over))];
  out.noticeFrames = count((f) => f.notices > 0);
  await ctx.close();
} catch (e) {
  out.error = String(e.message).slice(0, 300);
} finally {
  await b.close();
  if (args.out) writeFileSync(args.out, JSON.stringify(out, null, 1));
  const s = { ...out };
  delete s.brewLength;
  console.log(JSON.stringify(s));
}
