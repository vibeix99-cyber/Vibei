// Control-first probes for the toast follow-ups (Maker T2, W2R3), on the base (floating toasts) or on the fix (strip).
//   node follow.mjs --base URL --case ambience|fold|nextbrew --cfg 844x390@2:light:200 [--out f.json]
//  ambience: 3 notices on a running brew, the Ambience sheet opened by a real tap; every frame for 2 s: is a notice drawn
//            over the sheet (on top at its own middle while the dialog is up), and are the sheet's Close and options on top?
//  fold:     3 notices on a running brew (as at a break's end): each drawn notice whole? (icon, its full message laid out
//            with no clipping: scrollHeight <= clientHeight, no ellipsis / folded marker, the reward amount readable)
//  nextbrew: Settings › Next brew on, a recipe at the break's end (Monday): the next brew starts by itself; every frame for
//            4 s: does a notice intersect the running readout (status line, countdown, meta) or a control?
import { chromium } from 'playwright';
import { writeFileSync } from 'node:fs';

const args = Object.fromEntries(process.argv.slice(2).reduce((a, x, i, all) => (x.startsWith('--') && a.push([x.slice(2), all[i + 1]]), a), []));
const m = args.cfg.match(/^(\d+)x(\d+)@(\d+):(light|dark):(\d+)$/);
const [W, H, DPR, theme, text] = [+m[1], +m[2], +m[3], m[4], +m[5]];
const FIXED = Date.parse(args.at ?? '2026-10-12T07:40:00.000Z');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const out = { base: args.base, case: args.case, cfg: args.cfg, fixed: new Date(FIXED).toISOString() };
const NOTICE = '[aria-label="Notifications"] li, [data-notice-strip] li';
const b = await chromium.launch({ args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader', '--ignore-gpu-blocklist'] });
try {
  const ctx = await b.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: DPR, isMobile: W < H, hasTouch: true, colorScheme: theme, serviceWorkers: 'block' });
  await ctx.addInitScript(([pct, next]) => {
    try {
      localStorage.setItem('kettle:settings', JSON.stringify({ state: { onboarded: true, scene: 'off', autoStartBreaks: next, autoStartFocus: next, muted: true }, version: 1 }));
    } catch {}
    if (pct !== 100) addEventListener('DOMContentLoaded', () => { const s = document.createElement('style'); s.textContent = `html{font-size:${pct}%!important}`; document.head.appendChild(s); });
  }, [text, args.case === 'nextbrew']);
  const p = await ctx.newPage();
  await p.clock.install({ time: FIXED });
  await p.clock.resume();
  await p.goto(`${args.base}/?debug&seed=newbie&theme=${theme}#/`);
  await p.waitForFunction(() => { const t = window.__kettle?.timerInfo?.(); return !!(t && t.leader && t.leaderForMs > 400 && !t.settling); }, null, { timeout: 60_000 });
  await p.evaluate(() => document.fonts.ready);
  await sleep(800);
  const raise3 = () =>
    p.evaluate(async (n) => {
      const { toast } = await import('/src/ui/Toast.tsx');
      const all = [['Recipe done: Take 2 full tea breaks · +15 leaves', 'success'], ['New badge: Tea Time', 'success'], ['Cozy level 5!', 'success'], ['Recipe done: Brew 3 times today · +20 leaves', 'success']];
      for (const [m, tone] of all.slice(0, n)) toast(m, { tone, duration: 30_000 });
    }, +(args.n ?? 3));
  const rec = (fn, arg) => p.evaluate(fn, arg);
  if (args.case === 'ambience' || args.case === 'fold' || args.case === 'foldover') {
    await p.evaluate(() => window.__kettle.timer.getState().startFocus({ intention: 'Chapter 3 notes', tag: 'study' }));
    await p.waitForFunction(() => location.hash === '#/focus');
    await sleep(2000);
    if (args.case === 'foldover') {
      // Break's over (with a carried task), its panel scrolled to the end by real wheel: the base's docked stack.
      await p.evaluate(() => window.__kettle.finish());
      const tea = p.getByRole('button', { name: /Tea time|Long tea break/ });
      await tea.waitFor({ timeout: 60_000 });
      await sleep(1500);
      const tb = await tea.boundingBox();
      await p.touchscreen.tap(tb.x + tb.width / 2, tb.y + tb.height / 2);
      await p.getByRole('button', { name: 'Pause break' }).waitFor({ state: 'attached', timeout: 20_000 });
      await sleep(800);
      await p.evaluate(() => window.__kettle.finish());
      await p.getByRole('button', { name: /^Put the kettle on/ }).waitFor({ state: 'attached', timeout: 20_000 });
      await sleep(5000);
      for (let i = 0; i < 20; i++) {
        const s = await p.evaluate(() => { const m = document.querySelector('[data-focus-view] main'); const r = m.getBoundingClientRect(); return { st: m.scrollTop, max: m.scrollHeight - m.clientHeight, x: Math.round(r.right - 20), y: Math.round(Math.min(innerHeight, r.bottom) - 30) }; });
        if (s.st >= s.max - 1) break;
        await p.mouse.move(s.x, s.y);
        await p.mouse.wheel(0, 120);
        await sleep(150);
      }
      await p.mouse.move(1, H - 1);
    }
    await raise3();
    await sleep(1500);
    if (args.case === 'fold' || args.case === 'foldover') {
      // Every notice that is drawn, now and as each one in turn is shown (the strip shows one at a time).
      out.drawn = [];
      for (let i = 0; i < +(args.n ?? 3); i++) {
        out.drawn.push(...(await rec((sel) => [...document.querySelectorAll(sel)].map((li) => {
          const msg = li.querySelector('[class*="message"]') ?? li;
          const cs = getComputedStyle(msg);
          const r = li.getBoundingClientRect();
          return { text: li.textContent.trim(), icon: !!li.querySelector('svg'), folded: li.hasAttribute('data-folded'), clipped: msg.scrollHeight > msg.clientHeight + 1 || msg.scrollWidth > msg.clientWidth + 1 || cs.textOverflow === 'ellipsis' || cs.webkitLineClamp !== 'none', inView: r.top >= 0 && r.bottom <= innerHeight, box: [r.left, r.top, r.width, r.height].map(Math.round) };
        }), NOTICE)));
        // next: away with the shown one (the strip), or nothing changes (the base draws all three at once)
        await p.evaluate(async () => { const { toast } = await import('/src/ui/Toast.tsx'); const st = toast.state?.(); if (st?.shown) toast.dismiss(st.shown); });
        await sleep(1700);
      }
      const seen = new Map(out.drawn.map((d) => [d.text, d]));
      out.unique = [...seen.values()];
      out.whole = out.unique.filter((d) => d.icon && !d.folded && !d.clipped && d.inView).length;
      out.allWhole = out.unique.length >= +(args.n ?? 3) && out.whole === out.unique.length && out.unique.some((d) => /\+15 leaves/.test(d.text));
    } else {
      const amb = p.getByRole('button', { name: /^Ambience/ }).first();
      const r = await amb.boundingBox();
      await p.touchscreen.tap(r.x + r.width / 2, r.y + r.height / 2);
      await p.getByRole('dialog').waitFor();
      await sleep(400);
      await rec((sel) => {
        const R = (window.__amb = { frames: 0, noticesDrawn: 0, noticeOverSheet: 0, controlsCovered: {}, stop: false });
        const f = () => {
          if (R.stop) return;
          R.frames++;
          const d = document.querySelector('[role=dialog]');
          if (d) {
            for (const li of document.querySelectorAll(sel)) {
              const q = li.getBoundingClientRect();
              if (q.height <= 0 || +getComputedStyle(li).opacity < 0.05) continue;
              R.noticesDrawn++;
              const h = document.elementFromPoint(q.left + q.width / 2, Math.max(1, Math.min(innerHeight - 1, q.top + q.height / 2)));
              if (h && li.contains(h)) R.noticeOverSheet++;
            }
            for (const c of d.querySelectorAll('button, [role=radio]')) {
              const q = c.getBoundingClientRect();
              // Only what the sheet shows (inside its scrolling body's view and the viewport)
              let top = Math.max(0, q.top), bot = Math.min(innerHeight, q.bottom);
              for (let e = c.parentElement; e && e !== d.parentElement; e = e.parentElement) { const cs = getComputedStyle(e); if (cs.overflowY !== 'visible') { const r = e.getBoundingClientRect(); top = Math.max(top, r.top); bot = Math.min(bot, r.bottom); } }
              if (bot - top < 8) continue;
              const h = document.elementFromPoint(q.left + q.width / 2, (top + bot) / 2);
              if (!(h && (c.contains(h) || h.contains(c)))) { const k = (c.getAttribute('aria-label') || c.textContent || '').trim().slice(0, 20); R.controlsCovered[k] = (R.controlsCovered[k] || 0) + 1; }
            }
          }
          requestAnimationFrame(f);
        };
        requestAnimationFrame(f);
      }, NOTICE);
      await sleep(2000);
      Object.assign(out, await rec(() => { window.__amb.stop = true; const { frames, noticesDrawn, noticeOverSheet, controlsCovered } = window.__amb; return { frames, noticesDrawn, noticeOverSheet, controlsCovered }; }));
      // A real tap on the sheet's close (or first option) reaches it.
      const close = p.getByRole('dialog').getByRole('button').first();
      const cb = await close.boundingBox();
      const hit = await p.evaluate(([x, y]) => document.elementFromPoint(x, y)?.closest('[role=dialog]') != null, [cb.x + cb.width / 2, cb.y + cb.height / 2]);
      out.firstSheetButtonOnTop = hit;
    }
  } else if (args.case === 'nextbrew') {
    await p.evaluate(() => window.__kettle.timer.getState().startFocus({ intention: 'Chapter 3 notes', tag: 'study' }));
    await p.waitForFunction(() => location.hash === '#/focus');
    await sleep(1500);
    await p.evaluate(() => window.__kettle.finish());
    await p.waitForFunction(() => window.__kettle.timer.getState().phase !== 'focus' && window.__kettle.timer.getState().status === 'running', null, { timeout: 30_000 });
    await sleep(1500);
    await rec((sel) => {
      const R = (window.__nb = { t0: performance.now(), frames: 0, noticeFrames: 0, overReadout: 0, overControls: 0, firstNotice: null, what: {}, stop: false });
      const f = () => {
        if (R.stop) return;
        R.frames++;
        const ns = [...document.querySelectorAll(sel)].map((li) => li.getBoundingClientRect()).filter((q) => q.height > 0);
        if (ns.length) {
          R.noticeFrames++;
          if (R.firstNotice == null) R.firstNotice = Math.round(performance.now() - R.t0);
          const prot = [...document.querySelectorAll('[data-focus-view] [class*="readout"] *, [data-focus-view] [class*="status"], [data-focus-view] main button')];
          for (const e of prot) {
            const q = e.getBoundingClientRect();
            if (q.width <= 1 || q.height <= 1) continue;
            if (ns.some((r) => q.right > r.left + 0.5 && q.left < r.right - 0.5 && q.bottom > r.top + 0.5 && q.top < r.bottom - 0.5)) {
              const k = (e.getAttribute('aria-label') || e.textContent || e.className).toString().trim().slice(0, 24);
              R.what[k] = (R.what[k] || 0) + 1;
              if (e.matches('button')) R.overControls++;
              else R.overReadout++;
            }
          }
        }
        requestAnimationFrame(f);
      };
      requestAnimationFrame(f);
    }, NOTICE);
    await p.evaluate(() => window.__kettle.finish());
    await p.waitForFunction(() => window.__kettle.timer.getState().phase === 'focus' && window.__kettle.timer.getState().status === 'running', null, { timeout: 30_000 });
    await sleep(4500);
    Object.assign(out, await rec(() => { window.__nb.stop = true; const { frames, noticeFrames, overReadout, overControls, firstNotice, what } = window.__nb; return { frames, noticeFrames, overReadout, overControls, firstNotice, what }; }));
    out.said = await p.evaluate(() => (document.querySelector('[data-notices-said]') ?? document.querySelector('[aria-label="Notifications"]'))?.textContent?.slice(0, 200));
  }
  await ctx.close();
} catch (e) {
  out.error = String(e.message).slice(0, 300);
} finally {
  await b.close();
  if (args.out) writeFileSync(args.out, JSON.stringify(out, null, 1));
  console.log(JSON.stringify(out).slice(0, 900));
}
