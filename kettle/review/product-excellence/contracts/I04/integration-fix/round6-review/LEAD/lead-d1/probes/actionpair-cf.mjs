// LEAD (round-6 review) probe: the storage-full warning raised while ANOTHER toast with an action is already up.
//   node .tmp/LEAD/actionpair.mjs <base> <rev> <outDir> <configs: "375x667@200:light,844x390@200:light,..."> [video=0]
// Path (real product code, real timers): Today with a carried intention ("Carried from your last brew · Mark done");
// localStorage then filled to quota (setup); a REAL tap (CDP touch) on "Mark done" → Composer raises
// "Crossed off. Nice work." (Undo action, 5 s) and the failing save raises the warning 250 ms later (M1's SETTLE_MS).
// No synthetic pointer events, no held timers, no programmatic list scrolling. Every animation frame is recorded for 7 s.
import { chromium } from 'playwright';
import { mkdirSync, writeFileSync, appendFileSync, renameSync, rmSync } from 'node:fs';
const [,, base, rev, out, cfgArg, videoArg = '0'] = process.argv;
mkdirSync(out, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const WARN = 'toast-kettle:save-failed';
const cfgs = cfgArg.split(',').map((c) => { const m = c.match(/^(\d+)x(\d+)@(\d+):(light|dark)$/); return { W: +m[1], H: +m[2], text: +m[3], theme: m[4] }; });
const b = await chromium.launch({ args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader', '--ignore-gpu-blocklist'] });
let vidDone = videoArg !== '1';
for (const { W, H, text, theme } of cfgs) {
  const label = `${rev} ${W}x${H}@${text} ${theme}`;
  const video = !vidDone; vidDone = true;
  const ctx = await b.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, colorScheme: theme, ...(video ? { recordVideo: { dir: `${out}/video-tmp`, size: { width: W, height: H } } } : {}) });
  if (text !== 100) await ctx.addInitScript((pct) => addEventListener('DOMContentLoaded', () => { const s = document.createElement('style'); s.textContent = `html{font-size:${pct}%!important}`; document.head.appendChild(s); }), text);
  await ctx.addInitScript(() => { try { if (!localStorage.getItem('kettle:settings')) localStorage.setItem('kettle:settings', JSON.stringify({ state: { onboarded: true, scene: 'off', autoStartBreaks: false, autoStartFocus: false, muted: true }, version: 1 })); } catch {} });
  const p = await ctx.newPage();
  const errors = []; p.on('pageerror', (e) => errors.push(e.message));
  let res = { label, base };
  try {
    const ready = () => p.waitForFunction(() => { const t = window.__kettle?.timerInfo?.(); return !!(t && t.leader && t.leaderForMs > 400 && !t.settling); }, null, { timeout: 60_000 });
    await p.goto(`${base}/?debug&theme=${theme}${theme === 'light' ? '&nooktime=day' : ''}#/`); await ready();
    await p.evaluate(() => window.__kettle.seed('newbie')); await p.reload(); await ready();
    await p.evaluate(() => document.fonts.ready);
    await p.evaluate(() => window.__kettle.timer.getState().startFocus({ intention: 'Chapter 3 notes', tag: 'study' }));
    await p.waitForFunction(() => location.hash === '#/focus'); await sleep(1500);
    await p.evaluate(() => window.__kettle.ff(3 * 60_000)); await sleep(400);
    await p.evaluate(() => window.__kettle.timer.getState().end('user'));
    await p.waitForFunction(() => location.hash === '#/' || location.hash === '');
    // let the End toasts time out (3.2 s) before the test
    await p.waitForFunction(() => document.querySelectorAll('[aria-label="Notifications"] li').length === 0, null, { timeout: 15_000 });
    await sleep(600);
    const md = p.locator('button[aria-label^="Mark “"]');
    res.markDone = await md.count();
    if (!res.markDone) throw new Error('no "Mark done" link on Today');
    // setup: Playwright brings the link into view (page scroll only) and checks it receives the tap; trial run first
    await md.scrollIntoViewIfNeeded();
    await md.tap({ trial: true, timeout: 10_000 });
    const quota = await p.evaluate(() => { let c = 'x'.repeat(1 << 20), k = 0; while (c.length >= 1) { try { localStorage.setItem(`filler${k++}`, c); } catch { c = c.slice(0, c.length / 2); } } try { localStorage.setItem('probe', 'x'.repeat(64)); return 'no error'; } catch (e) { return e.name; } });
    res.quota = quota;
    // COUNTERFACTUAL (scratch, in-page only; no app code changed): INJECT=lead makes ONLY the warning lead the stack.
    if (process.env.INJECT === 'lead') { await p.addStyleTag({ content: '[aria-label="Notifications"] ol > li[id="toast-kettle:save-failed"] { order: -2 !important; }' }); res.injected = 'warning order:-2'; }
    await p.evaluate((WARN) => {
      const R = (window.__rec = { frames: [], ev: [], t0: performance.now(), stop: false });
      const t = () => Math.round(performance.now() - R.t0);
      new MutationObserver((ms) => { for (const m of ms) { for (const x of m.addedNodes) if (x.tagName === 'LI') R.ev.push([t(), '+', x.id, x.textContent.slice(0, 24)]); for (const x of m.removedNodes) if (x.tagName === 'LI') R.ev.push([t(), '-', x.id, x.textContent.slice(0, 24)]); } }).observe(document.body, { childList: true, subtree: true });
      const inter = (a, c) => a.right > c.left + 0.5 && a.left < c.right - 0.5 && a.bottom > c.top + 0.5 && a.top < c.bottom - 0.5;
      const f = () => {
        if (R.stop) return;
        const list = document.querySelector('[aria-label="Notifications"] ol');
        const region = list?.parentElement?.parentElement?.getBoundingClientRect();
        const lis = list ? [...list.querySelectorAll(':scope > li')] : [];
        const w = document.getElementById(WARN);
        let op = 0; for (let e = w, o = 1; e && e !== document.documentElement; e = e.parentElement) op = o *= +getComputedStyle(e).opacity;
        const wr = w?.getBoundingClientRect();
        const ctrls = [...document.querySelectorAll('[data-toast-above] :is(button, a[href], [role="button"], input, textarea, select)')].filter((c) => !list?.contains(c)).map((c) => c.getBoundingClientRect()).filter((r) => r.width > 0 && r.height > 0 && r.bottom > 0 && r.top < innerHeight);
        const boxOver = wr && ctrls.some((r) => inter(wr, r)) ? 1 : 0;
        // visual order: toasts sorted by their drawn top
        const order = lis.map((li) => [li.id === WARN ? 'W' : (li.querySelector('button') ? 'A' : 'o'), Math.round(li.getBoundingClientRect().top)]).sort((a, c) => a[1] - c[1]).map((x) => x[0]).join('');
        R.frames.push([t(), lis.length, w ? +op.toFixed(3) : 0, wr ? Math.round(wr.top) : null, wr ? Math.round(wr.bottom) : null, region ? Math.round(region.top) : null, region ? Math.round(region.bottom) : null, list ? Math.round(list.scrollTop) : null, boxOver, ctrls.length ? Math.round(Math.min(...ctrls.map((r) => r.top))) : null, order, list ? getComputedStyle(list).flexDirection : null]);
        requestAnimationFrame(f);
      };
      requestAnimationFrame(f);
    }, WARN);
    res.tTap = await p.evaluate(() => Math.round(performance.now() - window.__rec.t0));
    const bb = await md.boundingBox(); res.tapAt = [Math.round(bb.x + bb.width / 2), Math.round(bb.y + bb.height / 2)];
    await md.tap({ timeout: 5000 }); // a real CDP touch at the link's centre, after Playwright's hit-target check
    res.routeAfterTap = await p.evaluate(() => location.hash);
    // screenshots: shortly after the warning is first added, and at +1.2 s
    const tag = `${rev}-${W}x${H}-t${text}-${theme}`;
    try { await p.waitForSelector(`[id="${WARN}"]`, { timeout: 4000 }); await sleep(120); await p.screenshot({ path: `${out}/cf-${process.env.INJECT || 'none'}-${tag}-first.png` }); } catch { res.noWarning = true; }
    await sleep(1100); await p.screenshot({ path: `${out}/cf-${process.env.INJECT || 'none'}-${tag}-t1.png` });
    await sleep(5800);
    const R = await p.evaluate(() => { window.__rec.stop = true; return { frames: window.__rec.frames, ev: window.__rec.ev }; });
    const wev = R.ev.filter((e) => e[2] === WARN);
    const adds = wev.filter((e) => e[1] === '+').length, rems = wev.filter((e) => e[1] === '-').length;
    const firstAdd = wev.find((e) => e[1] === '+')?.[0];
    const fr = firstAdd != null ? R.frames.filter((f) => f[0] >= firstAdd) : [];
    const below = fr.filter((f) => f[4] != null && f[6] != null && f[4] > f[6] + 0.5);
    const over = fr.filter((f) => f[8]);
    const shown = fr.filter((f) => f[2] >= 0.98).length;
    const orders = [...new Set(fr.map((f) => f[10]))];
    res = { ...res, errors: errors.length, crossed: R.ev.filter((e) => e[1] === '+' && /Crossed/.test(e[3])).map((e) => e[0]), warnAdds: adds, warnRemovals: rems, warnEvents: wev.map((e) => [e[0], e[1]]), judgedFrames: fr.length, framesFullOpacity: shown, framesBoxBelowRoom: below.length, maxBelowPx: below.length ? Math.max(...below.map((f) => f[4] - f[6])) : 0, framesBoxOverDock: over.length, removalPreceded: wev.filter((e) => e[1] === '-').map((e) => { const pf = R.frames.filter((f) => f[0] < e[0] && f[1] > 0 && f[3] != null).slice(-1)[0]; return pf ? { t: e[0], boxBottom: pf[4], dockTop: pf[9], over: pf[8], order: pf[10] } : { t: e[0] }; }), visualOrders: orders, listDirections: [...new Set(fr.map((f) => f[11]))] };
    appendFileSync(`${out}/actionpair-cf-${rev}-${process.env.INJECT || 'none'}.jsonl`, JSON.stringify({ ...res, ev: R.ev, frames: R.frames }) + '\n');
  } catch (e) { res.error = String(e.message).split('\n')[0]; }
  console.log(JSON.stringify(res));
  const vid = video ? p.video() : null;
  await ctx.close();
  if (vid) { const src = await vid.path(); renameSync(src, `${out}/clip-actionpair-${rev}-${W}x${H}-t${text}-${theme}.webm`); rmSync(`${out}/video-tmp`, { recursive: true, force: true }); }
}
await b.close();
