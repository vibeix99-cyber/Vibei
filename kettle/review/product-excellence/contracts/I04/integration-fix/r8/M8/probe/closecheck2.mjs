// Lane C (round-7 relaunch): extension of LEAD's closecheck.mjs (sha256 c17efde4…, unedited copy: closecheck-lead.mjs).
// Measures the session top bar's Close (Break's over), Ambience and Mute — plus the panel controls — at every scroll
// position, with 1 and 3 toasts, with REAL input only:
//   * states   focus (running) | paused (paused break) | over-carried (Break's over with a carried task)
//   * where    top | end  (end = REAL mouse wheel until the panel stops moving)
//   * per frame (rAF, 2.4 s after raising the toasts): each control's rect, whether elementFromPoint at its centre hits
//     it, whether a painted toast box overlaps it by > 1 px (clipped by the list's scrollport), what is hit instead
//   * TAP phase (Ambience, Mute): n=3 toasts raised again (the app's own toast(), real timers, duration 8 s), settled
//     1.3 s, then a REAL tap (CDP touch via page.touchscreen.tap on phones, mouse click at 1440) at the control's
//     visible centre; activation checked by its effect (Mute: label/aria-pressed flips; Ambience: the dialog opens,
//     then Escape closes it); Mute is tapped back to restore.
//   * CLOSETAP mode (own fresh context per tap): Break's over, panel top or end, n toasts, REAL tap on Close; activation =
//     #/focus -> #/ and Close gone.
// Zen: while a brew runs unpaused the top bar fades and ignores pointers after 7 s idle (by design); the focus state is
// kept awake with a real pointer move before each measurement and `zen` is recorded per row.
// No scrollIntoView / scrollTo / scrollBy / scrollTop writes (reads only). Debug API for setup only.
//   node closecheck2.mjs <base> <rev> <out> "375x667@200:light,..." [states] [modes=measure,tap,closetap]
import { chromium } from 'playwright';
import { mkdirSync, appendFileSync } from 'node:fs';
const [,, base, rev, out, cfgArg, stateArg = 'focus,paused,over-carried', modeArg = 'measure,tap,closetap'] = process.argv;
mkdirSync(out, { recursive: true });
const modes = new Set(modeArg.split(','));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const cfgs = cfgArg.split(',').map((c) => { const m = c.match(/^(\d+)x(\d+)@(\d+):(light|dark)$/); return { W: +m[1], H: +m[2], text: +m[3], theme: m[4] }; });
const browser = await chromium.launch({ args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader', '--ignore-gpu-blocklist'] });
const AMB = '^Ambience:', MUTE = '^(Mute sounds|Turn sound on)$', CLOSE = '^Close$';
const NAMES = {
  focus: [AMB, MUTE, '^Add 5 minutes', '^(Pause|Resume)$', '^End session'],
  paused: ['^Skip break$', '^Resume break$', '^Start next brew$', AMB, MUTE],
  'over-carried': ['^Mark it done', '^Put the kettle on', "^That's all for now$", CLOSE],
};
const out_ = (f) => `${out}/${f}`;

// page-side helpers (setup/instrumentation only; installed once per page)
const INSTALL = () => {
  const norm = (s) => s.replace(/[’‘]/g, "'").replace(/\s+/g, ' ').trim();
  const desc = (e) => {
    if (!e) return 'none';
    const b = e.closest('button,a,[role="button"]');
    const lab = norm((b || e).getAttribute?.('aria-label') || (b || e).textContent || '').slice(0, 24);
    const toast = e.closest('[aria-label="Notifications"]') ? ' [TOAST]' : '';
    return `${(b || e).tagName.toLowerCase()}:${lab}${toast}`;
  };
  // visible centre of a control: clipped by the viewport and, for panel controls, by the panel
  const loc = (n) => {
    const el = [...document.querySelectorAll('[data-focus-view] button')].find((b) => !b.closest('[aria-hidden="true"],[inert]') && new RegExp(n).test(norm(b.getAttribute('aria-label') || b.textContent || '')));
    if (!el) return { n, st: 'missing' };
    const q = el.getBoundingClientRect();
    const panel = document.querySelector('[data-focus-view] main')?.getBoundingClientRect();
    const inPanel = !!el.closest('[data-focus-view] main');
    const top = inPanel && panel ? Math.max(q.top, panel.top, 0) : Math.max(q.top, 0);
    const bottom = inPanel && panel ? Math.min(q.bottom, panel.bottom, innerHeight) : Math.min(q.bottom, innerHeight);
    const left = Math.max(q.left, 0), right = Math.min(q.right, innerWidth);
    const rect = [Math.round(q.left), Math.round(q.top), Math.round(q.right), Math.round(q.bottom)];
    if (bottom - top < 8 || right - left < 8) return { n, st: 'off', rect, el };
    const cx = (left + right) / 2, cy = (top + bottom) / 2;
    const hit = document.elementFromPoint(cx, cy);
    return { n, st: 'seen', rect, cx, cy, hitSelf: !!(hit && el.contains(hit)), hit: desc(hit), top, bottom, left, right, el, q };
  };
  window.__loc = loc;
  window.__desc = desc;
  window.__toasts = () => {
    const ol = document.querySelector('[aria-label="Notifications"] ol');
    let clip = null;
    if (ol && getComputedStyle(ol).overflowY !== 'visible') { const q = ol.getBoundingClientRect(); clip = { l: q.left, t: q.top, r: q.right, b: q.bottom }; }
    const items = [...document.querySelectorAll('[aria-label="Notifications"] li')].map((li) => {
      let op = 1; for (let e = li; e && e !== document.documentElement; e = e.parentElement) op *= +getComputedStyle(e).opacity;
      const q = li.getBoundingClientRect();
      let r = { l: q.left, t: q.top, r: q.right, b: q.bottom };
      if (clip) r = { l: Math.max(r.l, clip.l), t: Math.max(r.t, clip.t), r: Math.min(r.r, clip.r), b: Math.min(r.b, clip.b) };
      r = { l: Math.max(r.l, 0), t: Math.max(r.t, 0), r: Math.min(r.r, innerWidth), b: Math.min(r.b, innerHeight) };
      return { txt: li.textContent.slice(0, 14), op: +op.toFixed(2), vis: r.r > r.l && r.b > r.t ? Math.round(r.b - r.t) : 0, full: Math.round(q.height), r };
    });
    return { items, clip };
  };
};

const REC = (names) => {
  const R = (window.__cc = { frames: [], stop: false, t0: performance.now() });
  const f = () => {
    if (R.stop) return;
    const { items: toasts, clip } = window.__toasts();
    const rows = names.map((n) => {
      const L = window.__loc(n);
      if (L.st !== 'seen') return [n, L.st, L.rect ?? null];
      const under = toasts.filter((t) => t.op > 0.05 && t.vis > 0 && t.r.b > L.top + 1 && t.r.t < L.bottom - 1 && t.r.r > L.q.left + 1 && t.r.l < L.q.right - 1).length;
      return [n, L.hitSelf && !under ? 'clear' : `COVERED(${under}${L.hitSelf ? '' : ',hit'})`, L.rect, L.hitSelf ? 1 : 0, under, L.hitSelf ? '' : L.hit];
    });
    R.frames.push({ t: Math.round(performance.now() - R.t0), zen: !!document.querySelector('[data-zen]'), toasts: toasts.map(({ txt, op, vis, full, r }) => [txt, op, vis, full, Math.round(r.t), Math.round(r.b)]), rows, clip: clip ? [Math.round(clip.t), Math.round(clip.b)] : null });
    requestAnimationFrame(f);
  };
  requestAnimationFrame(f);
};
const RAISE = async (n) => {
  const { toast } = await import('/src/ui/Toast.tsx');
  const items = [['Recipe done: Take 2 full tea breaks · +15 leaves', 'success'], ['Saved 12 minutes of focus', 'info'], ['Cozy level 5!', 'success']].slice(-n);
  for (const [m, tone] of items) toast(m, { tone, duration: 8000 });
};
const DISMISS = async () => (await import('/src/ui/Toast.tsx')).toast.dismiss();

async function setup(cfg, state) {
  const { W, H, text, theme } = cfg;
  const phone = W < 900;
  const ctx = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: phone ? 2 : 1, isMobile: phone, hasTouch: phone, colorScheme: theme });
  await ctx.addInitScript((pct) => {
    try { if (!localStorage.getItem('kettle:settings')) localStorage.setItem('kettle:settings', JSON.stringify({ state: { onboarded: true, scene: 'off', autoStartBreaks: false, autoStartFocus: false, muted: true }, version: 1 })); } catch {}
    if (pct !== 100) addEventListener('DOMContentLoaded', () => { const s = document.createElement('style'); s.textContent = `html{font-size:${pct}%!important}`; document.head.appendChild(s); });
  }, text);
  const page = await ctx.newPage();
  const errors = []; page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(`${base}/?debug&seed=newbie&theme=${theme}${theme === 'light' ? '&nooktime=day' : ''}#/`);
  await page.waitForFunction(() => !!window.__kettle, null, { timeout: 60_000 });
  await page.evaluate(() => document.fonts.ready); await sleep(1000);
  await page.evaluate(INSTALL);
  await page.evaluate(() => window.__kettle.timer.getState().startFocus({ intention: 'Chapter 3 notes', tag: 'study' }));
  await sleep(1800);
  if (state !== 'focus') {
    await page.evaluate(() => window.__kettle.nearEnd()); await sleep(400); await page.evaluate(() => window.__kettle.finish());
    const tea = page.getByRole('button', { name: /Tea time|Long tea break/ });
    await tea.waitFor({ state: 'visible', timeout: 60_000 }); await sleep(2400);
    const b = await tea.boundingBox();
    if (phone) await page.touchscreen.tap(b.x + b.width / 2, b.y + b.height / 2); else await page.mouse.click(b.x + b.width / 2, b.y + b.height / 2);
    await page.getByRole('button', { name: 'Pause break' }).waitFor({ state: 'attached', timeout: 20_000 });
    await sleep(1500);
    if (state === 'paused') await page.evaluate(() => window.__kettle.timer.getState().pause());
    else if (state === 'over-carried') { await page.evaluate(() => window.__kettle.finish()); await page.getByRole('button', { name: /Put the kettle on/ }).waitFor({ state: 'attached' }); }
    await sleep(4000);
  }
  await page.evaluate(DISMISS); await sleep(700);
  return { ctx, page, errors, phone };
}
let wakeFlip = 0;
const wake = async (page) => { wakeFlip ^= 1; await page.mouse.move(3 + wakeFlip * 2, 3 + wakeFlip * 2); await sleep(60); };
async function toEnd(page) {
  for (let i = 0; i < 14; i++) {
    const aim = await page.evaluate(() => { const r = document.querySelector('[data-focus-view] main').getBoundingClientRect(); return { x: Math.round((r.left + r.right) / 2), t: Math.max(0, r.top), b: Math.min(innerHeight, r.bottom) }; });
    const before = await page.evaluate(() => document.querySelector('[data-focus-view] main').scrollTop);
    await page.mouse.move(aim.x, Math.round((aim.t + aim.b) / 2)); await page.mouse.wheel(0, 100); await sleep(260);
    const after = await page.evaluate(() => document.querySelector('[data-focus-view] main').scrollTop);
    if (Math.abs(after - before) < 1) break;
  }
}
const scrollStr = (page) => page.evaluate(() => { const m = document.querySelector('[data-focus-view] main'); const d = document.scrollingElement; return `panel ${Math.round(m.scrollTop)}/${m.scrollHeight - m.clientHeight} doc ${Math.round(d.scrollTop)}/${d.scrollHeight - d.clientHeight}`; });

// a REAL tap (phone: CDP touch via Playwright's touchscreen; 1440: mouse click) at the control's visible centre
async function realTap(page, phone, pattern) {
  const L = await page.evaluate((n) => { const l = window.__loc(n); const t = window.__toasts(); return { st: l.st, rect: l.rect, cx: l.cx, cy: l.cy, hitSelf: l.hitSelf, hit: l.hit, nToasts: t.items.length, toastVis: t.items.map((x) => x.vis), zen: !!document.querySelector('[data-zen]') }; }, pattern);
  if (L.st !== 'seen') return { ...L, tapped: false };
  await page.evaluate(() => { window.__clicks = []; if (!window.__clk) { window.__clk = true; addEventListener('click', (e) => window.__clicks.push(window.__desc(e.target)), { capture: true }); } });
  if (phone) await page.touchscreen.tap(L.cx, L.cy); else await page.mouse.click(L.cx, L.cy);
  return { ...L, tapped: true, device: phone ? 'touch tap' : 'mouse click' };
}

for (const cfg of cfgs) {
  const { W, H, text, theme } = cfg;
  const phone = W < 900;
  for (const state of stateArg.split(',')) {
    const tag = `${rev}-${W}x${H}-t${text}-${theme}-${state}`;
    const base_ = { rev, base, W, H, text, theme, state };
    if (modes.has('measure') || (modes.has('tap') && state !== 'over-carried')) {
      let S;
      try {
        S = await setup(cfg, state);
        const { page, errors } = S;
        for (const where of ['top', 'end']) {
          if (where === 'end') await toEnd(page);
          const scroll = await scrollStr(page);
          for (const n of [1, 3]) {
            if (modes.has('measure')) {
              if (state === 'focus') await wake(page);
              await page.evaluate(REC, NAMES[state]);
              await page.evaluate(RAISE, n);
              await sleep(1100);
              await page.screenshot({ path: out_(`${tag}-${where}-n${n}.jpg`), type: 'jpeg', quality: 82 });
              await sleep(1300);
              const fr = await page.evaluate(() => { window.__cc.stop = true; return window.__cc.frames; });
              const per = {};
              for (const f of fr) for (const r of f.rows) {
                const o = (per[r[0]] ??= { frames: 0, clear: 0, hitSelf: 0, overlap: 0, covered: 0, off: 0, missing: 0, hitOther: {}, rect: null, rectSet: new Set() });
                o.frames++;
                if (r[1] === 'missing') o.missing++;
                else if (r[1] === 'off') o.off++;
                else {
                  if (r[1] === 'clear') o.clear++;
                  if (/COVERED/.test(r[1])) o.covered++;
                  if (r[3]) o.hitSelf++;
                  if (r[4]) o.overlap++;
                  if (r[5]) o.hitOther[r[5]] = (o.hitOther[r[5]] ?? 0) + 1;
                }
                if (r[2]) { o.rect = r[2]; o.rectSet.add(r[2].join(',')); }
              }
              for (const o of Object.values(per)) { o.rects = o.rectSet.size; delete o.rectSet; }
              const last = fr[fr.length - 1];
              const settled = fr.filter((f) => f.t > 900);
              const covSettled = Object.fromEntries(Object.keys(per).map((k) => [k, settled.filter((f) => f.rows.some((r) => r[0] === k && /COVERED/.test(r[1]))).length]));
              const toastsLast = last ? last.toasts : [];
              const row = { ...base_, kind: 'frames', where, n, scroll, frames: fr.length, zenFrames: fr.filter((f) => f.zen).length, per, coveredSettled: covSettled, settledFrames: settled.length, toastsLast, minVisibleToast: toastsLast.length ? Math.min(...toastsLast.map((t) => t[2])) : null, clip: last?.clip, errors: errors.length };
              appendFileSync(out_(`closecheck2-${rev}.jsonl`), JSON.stringify({ ...row, fr }) + '\n');
              console.log(JSON.stringify({ ...row, per: Object.fromEntries(Object.entries(per).map(([k, o]) => [k, `${o.frames}f clear${o.clear} hit${o.hitSelf} ovl${o.overlap} cov${o.covered} off${o.off} miss${o.missing} rect${JSON.stringify(o.rect)}`])) }));
              await page.evaluate(DISMISS); await sleep(800);
            }
            // tap phase: Ambience and Mute, n = 3 toasts only (worst case), both scroll positions
            if (modes.has('tap') && n === 3 && state !== 'over-carried') {
              if (state === 'focus') await wake(page);
              await page.evaluate(RAISE, 3);
              await sleep(1300);
              // Mute
              {
                const before = await page.evaluate(() => { const b = [...document.querySelectorAll('[data-focus-view] button')].find((x) => /^(Mute sounds|Turn sound on)$/.test(x.getAttribute('aria-label') ?? '')); return b ? [b.getAttribute('aria-label'), b.getAttribute('aria-pressed')] : null; });
                const t = await realTap(page, phone, MUTE);
                await sleep(500);
                const after = await page.evaluate(() => { const b = [...document.querySelectorAll('[data-focus-view] button')].find((x) => /^(Mute sounds|Turn sound on)$/.test(x.getAttribute('aria-label') ?? '')); return b ? [b.getAttribute('aria-label'), b.getAttribute('aria-pressed')] : null; });
                const clicks = await page.evaluate(() => window.__clicks ?? []);
                const row = { ...base_, kind: 'tap', control: 'Mute', where, n: 3, scroll, ...t, before, after, activated: !!(before && after && (before[0] !== after[0] || before[1] !== after[1])), clicks };
                // tap back (restore) while the toasts are still up
                const t2 = await realTap(page, phone, MUTE); await sleep(400);
                const back = await page.evaluate(() => { const b = [...document.querySelectorAll('[data-focus-view] button')].find((x) => /^(Mute sounds|Turn sound on)$/.test(x.getAttribute('aria-label') ?? '')); return b ? [b.getAttribute('aria-label'), b.getAttribute('aria-pressed')] : null; });
                row.restored = !!(back && before && back[0] === before[0]); row.restoreHitSelf = t2.hitSelf;
                appendFileSync(out_(`closecheck2-${rev}.jsonl`), JSON.stringify(row) + '\n'); console.log(JSON.stringify(row));
              }
              // Ambience (opens a dialog sheet; closed by a real Escape key)
              {
                await page.evaluate(RAISE, 3); await sleep(600);
                const t = await realTap(page, phone, AMB);
                await sleep(900);
                const dlg = await page.evaluate(() => { const d = document.querySelector('[role="dialog"]'); return d ? { open: true, text: d.textContent.slice(0, 30) } : { open: false }; });
                const clicks = await page.evaluate(() => window.__clicks ?? []);
                await page.keyboard.press('Escape'); await sleep(700);
                let closed = await page.evaluate(() => !document.querySelector('[role="dialog"]'));
                let closedBy = 'Escape';
                if (!closed) { // fall back: tap the sheet's Done button
                  const d = await realTap(page, phone, '^Done$'); closedBy = d.tapped ? 'Done tap' : 'none'; await sleep(700);
                  closed = await page.evaluate(() => !document.querySelector('[role="dialog"]'));
                }
                const row = { ...base_, kind: 'tap', control: 'Ambience', where, n: 3, scroll, ...t, dialog: dlg, activated: dlg.open, closed, closedBy, clicks };
                appendFileSync(out_(`closecheck2-${rev}.jsonl`), JSON.stringify(row) + '\n'); console.log(JSON.stringify(row));
              }
              await page.evaluate(DISMISS); await sleep(800);
            }
          }
        }
      } catch (e) { console.log(JSON.stringify({ ...base_, error: String(e.message).split('\n')[0] })); appendFileSync(out_(`closecheck2-${rev}.jsonl`), JSON.stringify({ ...base_, kind: 'error', error: String(e.message).split('\n')[0] }) + '\n'); }
      if (S) await S.ctx.close();
    }
    // Close: a fresh context per tap (the tap leaves Break's over)
    if (modes.has('closetap') && state === 'over-carried') {
      for (const [where, n] of (process.env.CLOSETAPS ?? 'top3,end3').split(',').map((v) => [v.slice(0, -1), +v.slice(-1)])) {
        let S;
        try {
          S = await setup(cfg, 'over-carried');
          const { page } = S;
          if (where === 'end') await toEnd(page);
          const scroll = await scrollStr(page);
          await page.mouse.move(2, 2);
          await page.evaluate(RAISE, n);
          await sleep(1300);
          const hashBefore = await page.evaluate(() => location.hash);
          const shot = out_(`${tag}-closetap-${where}-n${n}.jpg`);
          await page.screenshot({ path: shot, type: 'jpeg', quality: 82 });
          const t = await realTap(page, phone, CLOSE);
          await sleep(1200);
          const after = await page.evaluate(() => ({ hash: location.hash, closeGone: !window.__loc('^Close$').rect, breakOverGone: ![...document.querySelectorAll('[data-focus-view] button')].some((b) => /Put the kettle on/.test(b.textContent ?? '')) }));
          const clicks = await page.evaluate(() => window.__clicks ?? []);
          const row = { ...base_, kind: 'tap', control: 'Close', where, n, scroll, ...t, hashBefore, after, clicks, activated: after.hash !== hashBefore && after.hash.replace(/^#/, '') === '/' };
          appendFileSync(out_(`closecheck2-${rev}.jsonl`), JSON.stringify(row) + '\n'); console.log(JSON.stringify(row));
        } catch (e) { console.log(JSON.stringify({ ...base_, kind: 'error', control: 'Close', where, n, error: String(e.message).split('\n')[0] })); appendFileSync(out_(`closecheck2-${rev}.jsonl`), JSON.stringify({ ...base_, kind: 'error', control: 'Close', where, n, error: String(e.message).split('\n')[0] }) + '\n'); }
        if (S) await S.ctx.close();
      }
    }
  }
}
await browser.close();
