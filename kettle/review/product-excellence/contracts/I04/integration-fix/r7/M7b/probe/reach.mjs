// M7b reach probe (round 7, I04 follow-up 12): at 200 % text, can every control of the tea break (running, paused) and
// of Break's over (with and without a carried task) be reached by a REAL wheel, a REAL touch drag (CDP
// Input.dispatchTouchEvent) and the keyboard (Tab / Shift+Tab, the focused control brought into view by the browser)?
//
// Real input only for reaching: page.mouse.wheel, CDP touch drags, page.keyboard. The probe never calls scrollIntoView,
// scrollTo, scrollBy or sets scrollTop. The debug API (window.__kettle) is used for SETUP only: seed a profile, start a
// brew, fast-forward/finish the clock, pause the break. "Tea time" is pressed by a real tap/click.
// Every state runs in its own fresh browser context (a new disposable in-memory profile).
//
// A control counts as REACHED by a method when, after that method's input, its whole box lies inside the visible part
// of the screen (the viewport intersected with every clipping ancestor) AND elementFromPoint at its centre hits it.
//
//   node reach.mjs <base> <rev> <outdir> <WxH> <themes> [text=200] [states=break,paused,over-carried,over-plain,tap]
import { chromium } from '/home/user/Vibei/kettle/node_modules/playwright/index.mjs';
import { mkdirSync, appendFileSync } from 'node:fs';

const [base, rev, out, cfg, themeArg, textArg = '200', stateArg = 'break,paused,over-carried,over-plain,tap'] = process.argv.slice(2);
mkdirSync(out, { recursive: true });
const [W, H] = cfg.split('x').map(Number);
const text = Number(textArg);
const phone = W < 900;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const browser = await chromium.launch({ args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader', '--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required'] });

// Controls per state, by accessible name (aria-label or text). `panel: false` = the top bar (always on screen).
const C = {
  amb: { n: 'Ambience', re: '^Ambience:', panel: false },
  mute: { n: 'Mute', re: '^(Mute sounds|Turn sound on)$', panel: false },
  close: { n: 'Close', re: '^Close$', panel: false },
  skip: { n: 'Skip break', re: '^Skip break$' },
  pause: { n: 'Pause break', re: '^Pause break$' },
  resume: { n: 'Resume break', re: '^Resume break$' },
  next: { n: 'Start next brew', re: '^Start next brew$' },
  mark: { n: 'Mark it done', re: '^Mark it done' },
  put: { n: 'Put the kettle on', re: '^Put the kettle on' },
  leave: { n: "That's all for now", re: "^That's all for now$" },
};
const STATES = {
  break: [C.amb, C.mute, C.skip, C.pause, C.next],
  paused: [C.amb, C.mute, C.skip, C.resume, C.next],
  'over-carried': [C.close, C.mark, C.put, C.leave],
  'over-plain': [C.close, C.put, C.leave],
  tap: [C.pause],
};

// ---- in-page measurement (read-only) ----
const MEASURE = (sp) => {
  const norm = (s) => s.replace(/[’‘]/g, "'").replace(/\s+/g, ' ').trim();
  const rx = new RegExp(sp.re);
  const el = [...document.querySelectorAll('[data-focus-view] button')].find((b) => {
    if (b.closest('[aria-hidden="true"], [inert]')) return false;
    const r = b.getBoundingClientRect();
    return r.width > 0 && r.height > 0 && rx.test(norm(b.getAttribute('aria-label') || b.textContent || ''));
  });
  if (!el) return null;
  const r = el.getBoundingClientRect();
  // the visible part of the screen for this element: viewport ∩ every clipping ancestor's padding box
  let vis = { l: 0, t: 0, r: innerWidth, b: innerHeight };
  const scrollers = [];
  for (let e = el.parentElement; e && e !== document.documentElement; e = e.parentElement) {
    const cs = getComputedStyle(e);
    if (cs.overflowX !== 'visible' || cs.overflowY !== 'visible') {
      const q = e.getBoundingClientRect();
      vis = { l: Math.max(vis.l, q.left + e.clientLeft), t: Math.max(vis.t, q.top + e.clientTop), r: Math.min(vis.r, q.left + e.clientLeft + e.clientWidth), b: Math.min(vis.b, q.top + e.clientTop + e.clientHeight) };
      if (/(auto|scroll)/.test(cs.overflowY) && e.scrollHeight > e.clientHeight + 1) scrollers.push(`${e.tagName.toLowerCase()}.${String(e.className).split(' ')[0].slice(0, 22)} ${Math.round(e.scrollTop)}/${e.scrollHeight - e.clientHeight}`);
    }
  }
  const d = document.scrollingElement;
  scrollers.push(`doc ${Math.round(d.scrollTop)}/${d.scrollHeight - d.clientHeight}`);
  const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
  const full = r.top >= vis.t - 1 && r.bottom <= vis.b + 1 && r.left >= vis.l - 1 && r.right <= vis.r + 1;
  const inV = cx >= vis.l && cx < vis.r && cy >= vis.t && cy < vis.b;
  const hitEl = inV ? document.elementFromPoint(cx, cy) : null;
  const hit = !!hitEl && el.contains(hitEl);
  // where to aim wheel / touch: the visible part of the panel (the element's own scroll ancestor, else the session panel)
  const panel = document.querySelector('[data-focus-view] main');
  const pq = panel.getBoundingClientRect();
  const aim = { x: Math.round((Math.max(0, pq.left) + Math.min(innerWidth, pq.right)) / 2), top: Math.max(0, pq.top), bottom: Math.min(innerHeight, pq.bottom) };
  return { top: Math.round(r.top), bottom: Math.round(r.bottom), cy: Math.round(cy), vis: [Math.round(vis.t), Math.round(vis.b)], full, hit, ok: full && hit, scrollers, aim, focused: document.activeElement === el, fv: el.matches(':focus-visible') };
};

const results = [];
for (const theme of themeArg.split(','))
  for (const state of stateArg.split(',')) {
    const tag = `${rev}-${W}x${H}-${theme}-t${text}-${state}`;
    const row = { rev, size: cfg, theme, text, state, tag, controls: {}, errors: [] };
    const ctx = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: phone ? 2 : 1, isMobile: phone, hasTouch: phone, colorScheme: theme, reducedMotion: 'no-preference' });
    await ctx.addInitScript((pct) => {
      try {
        if (!localStorage.getItem('kettle:settings'))
          localStorage.setItem('kettle:settings', JSON.stringify({ state: { onboarded: true, scene: 'off', autoStartBreaks: false, autoStartFocus: false, muted: true }, version: 1 }));
      } catch {}
      if (pct !== 100)
        addEventListener('DOMContentLoaded', () => {
          const s = document.createElement('style');
          s.textContent = `html{font-size:${pct}%!important}`;
          document.head.appendChild(s);
        });
    }, text);
    const page = await ctx.newPage();
    page.on('pageerror', (e) => row.errors.push(e.message));
    const cdp = await ctx.newCDPSession(page);
    try {
      // ---- setup (debug API + one real tap on Tea time) ----
      await page.goto(`${base}/?debug&seed=newbie&theme=${theme}${theme === 'light' ? '&nooktime=day' : ''}#/`);
      await page.waitForFunction(() => !!window.__kettle, null, { timeout: 60_000 });
      await page.evaluate(() => document.fonts.ready);
      await page.evaluate(() => window.__kettle.settings.getState().set({ autoStartBreaks: false, autoStartFocus: false, muted: true }));
      await sleep(1200);
      const carried = state !== 'over-plain';
      await page.evaluate((carried) => window.__kettle.timer.getState().startFocus(carried ? { intention: 'Chapter 3 notes', tag: 'study' } : {}), carried);
      await sleep(2500);
      await page.evaluate(() => window.__kettle.nearEnd());
      await sleep(400);
      await page.evaluate(() => window.__kettle.finish());
      const tea = page.getByRole('button', { name: /Tea time|Long tea break/ });
      await tea.waitFor({ state: 'visible', timeout: 60_000 });
      await sleep(2600);
      const tb = await tea.boundingBox();
      if (phone) await page.touchscreen.tap(tb.x + tb.width / 2, tb.y + tb.height / 2);
      else await page.mouse.click(tb.x + tb.width / 2, tb.y + tb.height / 2);
      await page.getByRole('button', { name: 'Pause break' }).waitFor({ state: 'attached', timeout: 20_000 });
      await sleep(2000);
      if (state === 'paused') {
        await page.evaluate(() => window.__kettle.timer.getState().pause());
        await page.getByRole('button', { name: 'Resume break' }).waitFor({ state: 'attached', timeout: 10_000 });
        await sleep(1500);
      }
      if (state.startsWith('over')) {
        await page.evaluate(() => window.__kettle.finish());
        await page.getByRole('button', { name: /Put the kettle on/ }).waitFor({ state: 'attached', timeout: 20_000 });
        await sleep(2600);
      }
      // a moment for any toast raised by the state change to settle (they float above the controls)
      await sleep(600);
      const specs = STATES[state];
      const m = (sp) => page.evaluate(MEASURE, sp);
      const at0 = {};
      for (const sp of specs) at0[sp.n] = await m(sp);
      row.initial = Object.fromEntries(Object.entries(at0).map(([k, v]) => [k, v ? { cy: v.cy, ok: v.ok } : null]));
      row.scrollersAtStart = at0[specs[specs.length - 1].n]?.scrollers;
      await page.screenshot({ path: `${out}/${tag}-0-start.png` });

      // ---- wheel and touch: for each control in order, then in reverse, move toward it until reached ----
      const wheel = async (aim, dy) => {
        const y = Math.round((aim.top + aim.bottom) / 2);
        await page.mouse.move(aim.x, y);
        await page.mouse.wheel(0, dy);
        await sleep(260);
      };
      const drag = async (aim, dy) => {
        // dy > 0: content scrolls down (finger moves up). The whole drag stays inside the panel's visible part.
        const span = Math.max(40, Math.min(160, aim.bottom - aim.top - 24));
        const y0 = dy > 0 ? Math.round(aim.bottom - 12) : Math.round(aim.top + 12);
        const y1 = dy > 0 ? y0 - span : y0 + span;
        const n = Math.max(4, Math.round(span / 8));
        await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: aim.x, y: y0 }] });
        for (let i = 1; i <= n; i++) {
          await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: aim.x, y: Math.round(y0 + ((y1 - y0) * i) / n) }] });
          await sleep(16);
        }
        await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
        await sleep(450);
      };
      const reach = async (sp, how) => {
        let v = await m(sp);
        let still = 0, steps = 0;
        while (v && !v.ok && steps < 30 && still < 3) {
          const want = (v.top + v.bottom) / 2 - (v.vis[0] + v.vis[1]) / 2; // > 0: the control is below the middle
          const dir = want > 0 ? 1 : -1;
          if (how === 'wheel') await wheel(v.aim, dir * 100);
          else await drag(v.aim, dir);
          steps++;
          const v2 = await m(sp);
          if (v2 && Math.abs(v2.top - v.top) < 1) still++;
          else still = 0;
          v = v2;
        }
        return { reached: !!v?.ok, steps, cy: v?.cy, vis: v?.vis, scrollers: v?.ok ? undefined : v?.scrollers };
      };
      // Order: wheel, then touch, then the keyboard. (On INT, focusing a control below the edge scrolls the
      // overflow:hidden session screen programmatically, which no wheel or drag can undo: keyboard last keeps the
      // pointer methods' start state that of a person who has only just arrived.)
      const methods = state === 'tap' ? [] : phone ? ['wheel', 'touch'] : ['wheel'];
      for (const how of methods) {
        const down = {}, up = {};
        for (const sp of specs) down[sp.n] = await reach(sp, how);
        for (const sp of [...specs].reverse()) up[sp.n] = await reach(sp, how);
        for (const sp of specs) (row.controls[sp.n] ??= {})[how] = { reached: down[sp.n].reached && up[sp.n].reached, down: down[sp.n], up: up[sp.n] };
        // a picture with the lowest control brought into view by this method
        await reach(specs[specs.length - 1], how);
        await page.screenshot({ path: `${out}/${tag}-${how}-bottom.png` });
      }
      // ---- keyboard: Tab forward through the screen, then Shift+Tab back ----
      if (state !== 'tap') {
      const kb = {};
      const order = [];
      const seenAt = async (sp) => {
        const v = await m(sp);
        return v && v.focused ? v : null;
      };
      for (let i = 0; i < 24 && Object.keys(kb).length < specs.length; i++) {
        await page.keyboard.press('Tab');
        await sleep(220);
        const name = await page.evaluate(() => { const a = document.activeElement; return a ? (a.getAttribute('aria-label') || a.textContent || a.tagName).replace(/\s+/g, ' ').trim().slice(0, 28) : null; });
        order.push(name);
        for (const sp of specs) {
          if (kb[sp.n]) continue;
          const v = await seenAt(sp);
          if (v) kb[sp.n] = { fwd: v.ok, fv: v.fv, cy: v.cy, vis: v.vis };
        }
      }
      // back: Shift+Tab until the first control of the list has been focused again
      const back = {};
      for (let i = 0; i < 24 && Object.keys(back).length < specs.length; i++) {
        await page.keyboard.press('Shift+Tab');
        await sleep(220);
        for (const sp of specs) {
          if (back[sp.n]) continue;
          const v = await seenAt(sp);
          if (v) back[sp.n] = { ok: v.ok, cy: v.cy };
        }
      }
      for (const sp of specs) {
        const f = kb[sp.n], b = back[sp.n];
        row.controls[sp.n] ??= {};
        row.controls[sp.n].key = { reached: !!(f?.fwd && b?.ok), fwd: f ? f.fwd : 'never focused', back: b ? b.ok : 'never focused', focusVisible: f?.fv ?? null, cyFwd: f?.cy, cyBack: b?.cy };
      }
      row.tabOrder = order;
      await page.keyboard.press('Escape').catch(() => {});
      await page.evaluate(() => document.activeElement?.blur());
      }

      // ---- tap: from the break as it opens, tap Pause break (real tap) and check Resume break is hit-testable at its
      // centre ("in view": a second tap can take it); tap it and check Pause break the same way ----
      if (state === 'tap') {
        const t1 = await m(C.pause);
        if (t1?.hit) {
          const b = t1;
          const x = await page.evaluate(() => { const r = [...document.querySelectorAll('[data-focus-view] button')].find((e) => e.getAttribute('aria-label') === 'Pause break').getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; });
          if (phone) await page.touchscreen.tap(x.x, x.y); else await page.mouse.click(x.x, x.y);
          await sleep(1200);
          const r1 = await m(C.resume);
          row.tapPause = { pauseCy: b.cy, resumeCy: r1?.cy, resumeInView: !!r1?.hit, resumeWhole: !!r1?.ok };
          if (r1?.hit) {
            const y = await page.evaluate(() => { const r = [...document.querySelectorAll('[data-focus-view] button')].find((e) => e.getAttribute('aria-label') === 'Resume break').getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; });
            if (phone) await page.touchscreen.tap(y.x, y.y); else await page.mouse.click(y.x, y.y);
            await sleep(1200);
            const p2 = await m(C.pause);
            row.tapPause.pauseAgainCy = p2?.cy;
            row.tapPause.pauseAgainInView = !!p2?.hit;
            row.tapPause.pauseAgainWhole = !!p2?.ok;
          }
          await page.screenshot({ path: `${out}/${tag}-tap-pause-resume.png` });
        } else row.tapPause = { skipped: 'Pause break not hit-testable as the break opens', at: t1 };
      }
    } catch (e) {
      row.errors.push('PROBE ' + String(e.message).split('\n')[0]);
    }
    await ctx.close();
    // ---- verdict for this configuration ----
    const fails = [];
    for (const [n, c] of Object.entries(row.controls)) for (const how of ['key', 'wheel', 'touch']) if (c[how] && !c[how].reached) fails.push(`${n}/${how}`);
    row.fails = fails;
    if (state === 'tap') {
      if (!row.tapPause?.resumeInView) fails.push('Resume break in view after tapping Pause break');
      if (!row.tapPause?.pauseAgainInView) fails.push('Pause break in view after tapping Resume break');
    }
    row.pass = !row.errors.some((e) => e.startsWith('PROBE')) && (state === 'tap' || Object.keys(row.controls).length === STATES[state].length) && fails.length === 0;
    appendFileSync(`${out}/${rev}-reach.jsonl`, JSON.stringify(row) + '\n');
    const init = Object.entries(row.initial ?? {}).map(([k, v]) => `${k}@${v?.cy ?? '-'}${v?.ok ? '' : '(off)'}`).join(' ');
    console.log(`${tag}: ${row.pass ? 'PASS' : 'FAIL'} fails[${fails.length}] ${fails.join(', ')} | start ${init} | scrollers ${JSON.stringify(row.scrollersAtStart)}${row.tapPause ? ' | tapPause ' + JSON.stringify(row.tapPause) : ''}${row.errors.length ? ' | errors ' + JSON.stringify(row.errors) : ''}`);
    results.push(row);
  }
await browser.close();
const nf = results.filter((r) => !r.pass).length;
console.log(`${rev} ${cfg} ${themeArg} t${text}: configurations ${results.length}, failing ${nf}, control×method failures ${results.reduce((a, r) => a + r.fails.length, 0)}`);
