// LEAD r7 probe: the session top bar (Close / Ambience / Mute) and the panel controls under a toast stack, with the
// panel at its top and scrolled to its end by a REAL wheel (or CDP touch drag on phones). Toasts are the app's own
// toast() (dynamic import of the served /src/ui/Toast.tsx = the app's module instance), real timers, duration 8 s.
// Every animation frame for 2.4 s after raising is recorded: each toast's box clipped by the list's scrollport, each
// control's box; a frame counts as COVERED when a painted toast box overlaps a control box by > 1 px, or the control's
// centre does not hit-test to it. Also records whether the toasts are readable (visible height of each toast).
// No scrollIntoView / scrollTo / scrollBy / scrollTop writes. Setup by the debug API; Tea time by a real tap.
//   node closecheck.mjs <base> <rev> <out> "375x667@200:light,844x390@200:dark" [states=over-carried,paused] [how=wheel|touch]
import { chromium } from 'playwright';
import { mkdirSync, appendFileSync } from 'node:fs';
const [,, base, rev, out, cfgArg, stateArg = 'over-carried,paused', howArg = 'wheel'] = process.argv;
mkdirSync(out, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const cfgs = cfgArg.split(',').map((c) => { const m = c.match(/^(\d+)x(\d+)@(\d+):(light|dark)$/); return { W: +m[1], H: +m[2], text: +m[3], theme: m[4] }; });
const browser = await chromium.launch({ args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader', '--ignore-gpu-blocklist'] });
const NAMES = {
  paused: ['^Skip break$', '^Resume break$', '^Start next brew$', '^Ambience:', '^(Mute sounds|Turn sound on)$'],
  'over-carried': ['^Mark it done', '^Put the kettle on', "^That's all for now$", '^Close$'],
  break: ['^Skip break$', '^Pause break$', '^Start next brew$', '^Ambience:', '^(Mute sounds|Turn sound on)$'],
};
const REC = (names) => {
  const R = (window.__cc = { frames: [], stop: false, t0: performance.now() });
  const norm = (s) => s.replace(/[’‘]/g, "'").replace(/\s+/g, ' ').trim();
  const f = () => {
    if (R.stop) return;
    const ol = document.querySelector('[aria-label="Notifications"] ol');
    let clip = null;
    if (ol && getComputedStyle(ol).overflowY !== 'visible') { const q = ol.getBoundingClientRect(); clip = { l: q.left, t: q.top, r: q.right, b: q.bottom }; }
    const toasts = [...document.querySelectorAll('[aria-label="Notifications"] li')].map((li) => {
      let op = 1; for (let e = li; e && e !== document.documentElement; e = e.parentElement) op *= +getComputedStyle(e).opacity;
      const q = li.getBoundingClientRect();
      let r = { l: q.left, t: q.top, r: q.right, b: q.bottom };
      if (clip) r = { l: Math.max(r.l, clip.l), t: Math.max(r.t, clip.t), r: Math.min(r.r, clip.r), b: Math.min(r.b, clip.b) };
      r = { l: Math.max(r.l, 0), t: Math.max(r.t, 0), r: Math.min(r.r, innerWidth), b: Math.min(r.b, innerHeight) };
      return { txt: li.textContent.slice(0, 14), op: +op.toFixed(2), vis: r.r > r.l && r.b > r.t ? Math.round(r.b - r.t) : 0, full: Math.round(q.height), r };
    });
    const panel = document.querySelector('[data-focus-view] main')?.getBoundingClientRect();
    const rows = names.map((n) => {
      const el = [...document.querySelectorAll('[data-focus-view] button')].find((b) => !b.closest('[aria-hidden="true"],[inert]') && new RegExp(n).test(norm(b.getAttribute('aria-label') || b.textContent || '')));
      if (!el) return [n, 'missing'];
      const q = el.getBoundingClientRect();
      const inPanel = !!el.closest('[data-focus-view] main');
      const top = inPanel && panel ? Math.max(q.top, panel.top, 0) : Math.max(q.top, 0), bottom = inPanel && panel ? Math.min(q.bottom, panel.bottom, innerHeight) : Math.min(q.bottom, innerHeight);
      if (bottom - top < 8) return [n, 'off'];
      const cy = (top + bottom) / 2, cx = q.left + q.width / 2;
      const hit = document.elementFromPoint(cx, cy);
      const under = toasts.filter((t) => t.op > 0.05 && t.vis > 0 && t.r.b > top + 1 && t.r.t < bottom - 1 && t.r.r > q.left + 1 && t.r.l < q.right - 1).length;
      return [n, hit && el.contains(hit) && !under ? 'clear' : `COVERED(${under}${hit && el.contains(hit) ? '' : ',hit'})`, Math.round(top), Math.round(bottom)];
    });
    R.frames.push({ t: Math.round(performance.now() - R.t0), toasts: toasts.map(({ txt, op, vis, full, r }) => [txt, op, vis, full, Math.round(r.t), Math.round(r.b)]), rows, clip: clip ? [Math.round(clip.t), Math.round(clip.b)] : null });
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
for (const { W, H, text, theme } of cfgs) {
  const phone = W < 900;
  for (const state of stateArg.split(',')) {
    const tag = `${rev}-${W}x${H}-t${text}-${theme}-${state}`;
    const ctx = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: phone ? 2 : 1, isMobile: phone, hasTouch: phone, colorScheme: theme });
    await ctx.addInitScript((pct) => {
      try { if (!localStorage.getItem('kettle:settings')) localStorage.setItem('kettle:settings', JSON.stringify({ state: { onboarded: true, scene: 'off', autoStartBreaks: false, autoStartFocus: false, muted: true }, version: 1 })); } catch {}
      if (pct !== 100) addEventListener('DOMContentLoaded', () => { const s = document.createElement('style'); s.textContent = `html{font-size:${pct}%!important}`; document.head.appendChild(s); });
    }, text);
    const page = await ctx.newPage();
    const errors = []; page.on('pageerror', (e) => errors.push(e.message));
    const cdp = phone ? await ctx.newCDPSession(page) : null;
    try {
      await page.goto(`${base}/?debug&seed=newbie&theme=${theme}${theme === 'light' ? '&nooktime=day' : ''}#/`);
      await page.waitForFunction(() => !!window.__kettle, null, { timeout: 60_000 });
      await page.evaluate(() => document.fonts.ready); await sleep(1000);
      await page.evaluate(() => window.__kettle.timer.getState().startFocus({ intention: 'Chapter 3 notes', tag: 'study' }));
      await sleep(1800);
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
      await page.evaluate(DISMISS); await sleep(700);
      for (const where of ['top', 'end']) {
        if (where === 'end') {
          for (let i = 0; i < 12; i++) {
            const aim = await page.evaluate(() => { const r = document.querySelector('[data-focus-view] main').getBoundingClientRect(); return { x: Math.round((r.left + r.right) / 2), t: Math.max(0, r.top), b: Math.min(innerHeight, r.bottom) }; });
            const before = await page.evaluate(() => document.querySelector('[data-focus-view] main').scrollTop);
            if (howArg === 'touch' && cdp) {
              const y0 = Math.round(aim.b - 14), span = Math.max(40, Math.min(160, aim.b - aim.t - 28)), n = Math.round(span / 8);
              await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: aim.x, y: y0 }] });
              for (let k = 1; k <= n; k++) { await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: aim.x, y: Math.round(y0 - (span * k) / n) }] }); await sleep(16); }
              await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); await sleep(450);
            } else { await page.mouse.move(aim.x, Math.round((aim.t + aim.b) / 2)); await page.mouse.wheel(0, 100); await sleep(260); }
            const after = await page.evaluate(() => document.querySelector('[data-focus-view] main').scrollTop);
            if (Math.abs(after - before) < 1) break;
          }
        }
        const scroll = await page.evaluate(() => { const m = document.querySelector('[data-focus-view] main'); const d = document.scrollingElement; return `panel ${Math.round(m.scrollTop)}/${m.scrollHeight - m.clientHeight} doc ${Math.round(d.scrollTop)}/${d.scrollHeight - d.clientHeight}`; });
        for (const n of [1, 3]) {
          await page.evaluate(REC, NAMES[state]);
          await page.evaluate(RAISE, n);
          await sleep(1100);
          await page.screenshot({ path: `${out}/${tag}-${where}-n${n}.png` });
          await sleep(1300);
          const fr = await page.evaluate(() => { window.__cc.stop = true; return window.__cc.frames; });
          const covered = {};
          for (const f of fr) for (const r of f.rows) if (/COVERED/.test(r[1])) covered[r[0]] = (covered[r[0]] ?? 0) + 1;
          const settled = fr.filter((f) => f.t > 900);
          const last = fr[fr.length - 1];
          const toastsSettled = last ? last.toasts : [];
          const row = { rev, base, W, H, text, theme, state, where, n, how: howArg, scroll, frames: fr.length, coveredFrames: covered, coveredSettled: Object.fromEntries(Object.keys(covered).map((k) => [k, settled.filter((f) => f.rows.some((r) => r[0] === k && /COVERED/.test(r[1]))).length])), lastRows: last?.rows, toastsLast: toastsSettled, minVisibleToast: toastsSettled.length ? Math.min(...toastsSettled.map((t) => t[2])) : null, clip: last?.clip, errors: errors.length };
          appendFileSync(`${out}/closecheck-${rev}.jsonl`, JSON.stringify({ ...row, fr }) + '\n');
          console.log(JSON.stringify(row));
          await page.evaluate(DISMISS); await sleep(800);
        }
      }
    } catch (e) { console.log(JSON.stringify({ rev, W, H, text, theme, state, error: String(e.message).split('\n')[0] })); }
    await ctx.close();
  }
}
await browser.close();
