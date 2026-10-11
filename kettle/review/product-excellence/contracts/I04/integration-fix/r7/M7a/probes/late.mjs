// A banner that appears while Today is open (a real tap on "Mark done" with storage full): do the controls round the
// finger move on screen? Per frame: the task field, the docked start, and the element at the tap point; plus
// layout-shift entries. CF=1 (counterfactual): scrollBy/scrollTo made no-ops in the page, so the app cannot keep the
// finger's surroundings in place (no app code changed).
// node late.mjs <base> <label> <out.jsonl> <configs "375x667@100:light,...">
import { chromium } from 'playwright';
import { appendFileSync } from 'node:fs';
const [,, base, label, out, cfgArg] = process.argv;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const b = await chromium.launch({ args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader', '--ignore-gpu-blocklist'] });
for (const c of cfgArg.split(',')) {
  const m = c.match(/^(\d+)x(\d+)@(\d+):(light|dark)$/); const W = +m[1], H = +m[2], text = +m[3], theme = m[4];
  const ctx = await b.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: W >= 900 ? 1 : 2, isMobile: W < 900, hasTouch: W < 900, colorScheme: theme });
  if (text !== 100) await ctx.addInitScript((pct) => addEventListener('DOMContentLoaded', () => { const s = document.createElement('style'); s.textContent = `html{font-size:${pct}%!important}`; document.head.appendChild(s); }), text);
  await ctx.addInitScript(() => { try { if (!localStorage.getItem('kettle:settings')) localStorage.setItem('kettle:settings', JSON.stringify({ state: { onboarded: true, scene: 'off', autoStartBreaks: false, autoStartFocus: false, muted: true }, version: 1 })); } catch {} });
  const p = await ctx.newPage();
  const res = { label, cf: !!process.env.CF, W, H, text, theme };
  try {
    const ready = () => p.waitForFunction(() => { const t = window.__kettle?.timerInfo?.(); return !!(t && t.leader && t.leaderForMs > 400 && !t.settling); }, null, { timeout: 60_000 });
    await p.goto(`${base}/?debug&theme=${theme}#/`); await ready();
    await p.evaluate(() => document.fonts.ready);
    await p.evaluate(() => window.__kettle.timer.getState().startFocus({ intention: 'Chapter 3 notes', tag: 'study' }));
    await p.waitForFunction(() => location.hash === '#/focus'); await sleep(1500);
    await p.evaluate(() => window.__kettle.ff(3 * 60_000)); await sleep(400);
    await p.evaluate(() => window.__kettle.timer.getState().end('user'));
    await p.waitForFunction(() => location.hash === '#/' || location.hash === '');
    await p.waitForFunction(() => document.querySelectorAll('[aria-label="Notifications"] li').length === 0, null, { timeout: 15_000 });
    await sleep(600);
    const md = p.locator('button[aria-label^="Mark “"]');
    await md.scrollIntoViewIfNeeded();
    await p.evaluate(() => { let c = 'x'.repeat(1 << 20), k = 0; while (c.length >= 1) { try { localStorage.setItem(`filler${k++}`, c); } catch { c = c.slice(0, c.length / 2); } } });
    if (process.env.CF) await p.evaluate(() => { Element.prototype.scrollBy = function () {}; window.scrollBy = function () {}; });
    const bb = await md.boundingBox(); const tap = [bb.x + bb.width / 2, bb.y + bb.height / 2];
    await p.evaluate(([x, y]) => {
      const R = (window.__late = { frames: [], ls: [], t0: performance.now() });
      new PerformanceObserver((l) => { for (const e of l.getEntries()) R.ls.push([Math.round(e.startTime - R.t0), +e.value.toFixed(4), e.hadRecentInput]); }).observe({ type: 'layout-shift' });
      const field = document.querySelector('main input');
      const dock = document.querySelector('[data-toast-above] button');
      const f = () => {
        if (R.stop) return;
        const at = document.elementFromPoint(x, y);
        const b = document.querySelector('section[data-save-warning]');
        R.frames.push([Math.round(performance.now() - R.t0), +field.getBoundingClientRect().top.toFixed(1), +dock.getBoundingClientRect().top.toFixed(1), at ? (at.closest('button, input, [role="radio"]')?.textContent?.trim().slice(0, 18) || at.tagName) : null, b ? +b.getBoundingClientRect().top.toFixed(1) : null, Math.round(scrollY)]);
        requestAnimationFrame(f);
      };
      requestAnimationFrame(f);
    }, tap);
    if (W < 900) await p.touchscreen.tap(tap[0], tap[1]); else await p.mouse.click(tap[0], tap[1]);
    await sleep(1500);
    const R = await p.evaluate(() => { window.__late.stop = true; return window.__late; });
    const fr = R.frames;
    const bannerFrame = fr.findIndex((f) => f[4] != null);
    const before = fr[Math.max(0, bannerFrame - 1)], after = fr[fr.length - 1];
    res.bannerAppearedMs = bannerFrame >= 0 ? fr[bannerFrame][0] : null;
    res.fieldMovedPx = +(Math.max(...fr.map((f) => f[1])) - Math.min(...fr.map((f) => f[1]))).toFixed(1);
    res.dockMovedPx = +(Math.max(...fr.map((f) => f[2])) - Math.min(...fr.map((f) => f[2]))).toFixed(1);
    res.underFingerBefore = before?.[3]; res.underFingerAfter = after?.[3];
    res.bannerTop = after?.[4]; res.scrollY = [fr[0]?.[5], after?.[5]];
    res.layoutShifts = R.ls; res.cls = +R.ls.reduce((s, e) => s + e[1], 0).toFixed(4); res.clsNoRecentInput = +R.ls.filter((e) => !e[2]).reduce((s, e) => s + e[1], 0).toFixed(4);
    appendFileSync(out, JSON.stringify({ ...res, frames: fr }) + '\n');
  } catch (e) { res.error = String(e.message).split('\n')[0]; }
  console.log(JSON.stringify({ ...res, layoutShifts: undefined }));
  await ctx.close();
}
await b.close();
