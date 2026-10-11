// LANE A r7 markdone-a3 = markdone-a2 + env KEY=1: "Mark done" is reached with real Tab presses (page.keyboard; the browser's own focus scrolling, no probe scrolling) and activated with a real Enter, instead of the view loop + tap. For 844x390 @200 % case 2, where the endless update toast covers the whole strip above the docked start so Mark done can never be tapped clear of it. KEY unset = markdone-a2 exactly.
// LANE A r7 copy of the LEAD's markdone.mjs (markdone-a2: + per frame, Save backup inside the banner's box and not clipped by an overflow ancestor, M7a natural-b's rule => saveBackupCutFrames). Changes: (1) counts EVERY addition of the warning's text to any live region ([aria-live] not off, role=status/alert; text nodes and characterData included) as `live` (M7a natural-b's rule), alongside the LEAD's `said` (the banner's own announcer only); (2) per run: UTC start/end and /proc/loadavg in the jsonl; (3) where the banner is relative to the view after the tap (above/below/in view, px). Setup, input and the rest of the judgement unchanged.
// LEAD r7 probe (from round-6 actionpair.mjs / pwapair.mjs): storage really full, a REAL tap on Today's "Mark done"
// ("Crossed off. Nice work. · Undo"), optionally with an older endless action toast (PwaUpdatePrompt's shape, labelled
// synthetic setup) already up. Works on both designs:
//   - toast design (e866118, INT, R5): counts adds/removals of li#toast-kettle:save-failed (LEAD-D1 = a loop);
//   - banner design (R7): section[data-save-warning] adds/removals, where it is (viewport and page position), its
//     opacity, Save backup's box + hit test, toasts drawn over the banner, the composer field moving, the polite
//     announcer's utterances, and scrollY.
// Setup: an onboarded EMPTY profile (no seed: the newbie seed pins 15:30 via the in-memory debug clock, which a reload
// drops, so before 15:30 the seeded brews sort after the new one and Today offers no "Mark done"). Brew "Chapter 3
// notes" 3 min (debug ff), end('user'), End toasts time out. "Mark done" is brought into view by REAL input only
// (CDP touch drag / mouse wheel) — no scrollIntoView. localStorage filled to QuotaExceededError (setup). Real timers.
//   node markdone.mjs <base> <rev> <out> "375x667@200:light,..." [pwa=0|1] [video=0|1] [seconds=7]
import { chromium } from 'playwright';
import { mkdirSync, appendFileSync, renameSync, rmSync, readFileSync } from 'node:fs';
const load = () => readFileSync('/proc/loadavg', 'utf8').split(' ').slice(0, 3).join(' ');
const [,, base, rev, out, cfgArg, pwaArg = '0', videoArg = '0', secArg = '7'] = process.argv;
mkdirSync(out, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const WARN = 'toast-kettle:save-failed';
const cfgs = cfgArg.split(',').map((c) => { const m = c.match(/^(\d+)x(\d+)@(\d+):(light|dark)$/); return { W: +m[1], H: +m[2], text: +m[3], theme: m[4] }; });
const b = await chromium.launch({ args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader', '--ignore-gpu-blocklist'] });
for (const { W, H, text, theme } of cfgs) {
  const phone = W < 900;
  const tag = `${rev}-${W}x${H}-t${text}-${theme}${pwaArg === '1' ? '-pwa' : ''}`;
  const video = videoArg === '1';
  const ctx = await b.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: phone ? 2 : 1, isMobile: phone, hasTouch: phone, colorScheme: theme, ...(video ? { recordVideo: { dir: `${out}/video-tmp`, size: { width: W, height: H } } } : {}) });
  if (text !== 100) await ctx.addInitScript((pct) => addEventListener('DOMContentLoaded', () => { const s = document.createElement('style'); s.textContent = `html{font-size:${pct}%!important}`; document.head.appendChild(s); }), text);
  await ctx.addInitScript(() => { try { if (!localStorage.getItem('kettle:settings')) localStorage.setItem('kettle:settings', JSON.stringify({ state: { onboarded: true, scene: 'off', autoStartBreaks: false, autoStartFocus: false, muted: true }, version: 1 })); } catch {} });
  const p = await ctx.newPage();
  const cdp = phone ? await ctx.newCDPSession(p) : null;
  const errors = []; p.on('pageerror', (e) => errors.push(e.message));
  let res = { tag, rev, base, W, H, text, theme, pwa: pwaArg === '1', utcStart: new Date().toISOString(), loadStart: load() };
  try {
    const ready = () => p.waitForFunction(() => { const t = window.__kettle?.timerInfo?.(); return !!(t && t.leader && t.leaderForMs > 400 && !t.settling); }, null, { timeout: 60_000 });
    await p.goto(`${base}/?debug&theme=${theme}${theme === 'light' ? '&nooktime=day' : ''}#/`); await ready();
    await p.evaluate(() => document.fonts.ready);
    await p.evaluate(() => window.__kettle.timer.getState().startFocus({ intention: 'Chapter 3 notes', tag: 'study' }));
    await p.waitForFunction(() => location.hash === '#/focus'); await sleep(1500);
    await p.evaluate(() => window.__kettle.ff(3 * 60_000)); await sleep(400);
    await p.evaluate(() => window.__kettle.timer.getState().end('user'));
    await p.waitForFunction(() => location.hash === '#/' || location.hash === '');
    await p.waitForFunction(() => document.querySelectorAll('[aria-label="Notifications"] li').length === 0, null, { timeout: 15_000 });
    await sleep(600);
    const md = p.locator('button[aria-label^="Mark “"]');
    res.markDone = await md.count();
    if (!res.markDone) throw new Error('no "Mark done" on Today');
    // SYNTHETIC SETUP (labelled): PwaUpdatePrompt's toast (src/app/ShellOverlays.tsx options) through the app's own
    // toast(); a service-worker update cannot be produced on the dev server. Raised before Mark done is brought into
    // view, so the view loop below places Mark done where the toast does not cover it.
    if (pwaArg === '1') {
      await p.evaluate(async () => { const { toast } = await import('/src/ui/Toast.tsx'); toast('A fresh brew of Kettle is ready.', { id: 'pwa-update', icon: 'sparkle', duration: Infinity, action: { label: 'Update', onClick: () => {} } }); });
      await sleep(900);
    }
    // bring it into view by real input (touch drag on phones, wheel on desktop) until its centre hit-tests to it
    const view = () => p.evaluate(() => { const el = document.querySelector('button[aria-label^="Mark “"]'); const r = el.getBoundingClientRect(); const dock = [...document.querySelectorAll('[data-toast-above]')].map((d) => d.getBoundingClientRect().top).filter((t) => t > 0 && t < innerHeight); const lim = Math.min(innerHeight, ...dock); const cx = r.left + r.width / 2, cy = r.top + r.height / 2; const h = cy > 0 && cy < innerHeight ? document.elementFromPoint(cx, cy) : null; return { cy, lim, cov: !!h && !el.contains(h) && !!h.closest('[aria-label="Notifications"]'), ok: !!h && el.contains(h) && r.top >= 0 && r.bottom <= lim - 4 }; });
    const KEY = process.env.KEY === '1'; res.input = KEY ? 'keyboard (Tab… Enter)' : (phone ? 'touch tap' : 'click');
    for (let i = 0; i < (KEY ? 0 : 20); i++) {
      const v = await view(); if (v.ok) break;
      const dir = v.cov ? 1 : v.cy > v.lim / 2 ? 1 : -1; // covered by a toast (bottom of the room): move it up
      if (cdp) { const x = Math.round(W / 2), y0 = dir > 0 ? Math.round(v.lim * 0.7) : Math.round(v.lim * 0.3), span = 90 * dir, n = 12; await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y: y0 }] }); for (let k = 1; k <= n; k++) { await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x, y: Math.round(y0 - (span * k) / n) }] }); await sleep(16); } await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); await sleep(500); }
      else { await p.mouse.move(Math.round(W / 2), Math.round(H / 2)); await p.mouse.wheel(0, 80 * dir); await sleep(300); }
    }
    if (KEY) { for (let i = 0; i < 60; i++) { await p.keyboard.press('Tab'); await sleep(40); if (await p.evaluate(() => !!document.activeElement?.matches?.('button[aria-label^="Mark “"]'))) { res.tabs = i + 1; break; } } if (!res.tabs) throw new Error('Tab never reached Mark done'); await sleep(400); }
    res.markDoneInView = (await view()).ok;
    res.scrollYBeforeTap = await p.evaluate(() => Math.round(scrollY));
    res.quota = await p.evaluate(() => { let c = 'x'.repeat(1 << 20), k = 0; while (c.length >= 1) { try { localStorage.setItem(`filler${k++}`, c); } catch { c = c.slice(0, c.length / 2); } } try { localStorage.setItem('probe', 'x'.repeat(64)); return 'no error'; } catch (e) { return e.name; } });
    await p.evaluate((WARN) => {
      const R = (window.__rec = { frames: [], ev: [], said: [], live: [], t0: performance.now(), stop: false });
      const t = () => Math.round(performance.now() - R.t0);
      const isW = (x) => x.nodeType === 1 && (x.id === WARN || x.matches?.('[data-save-warning]') || x.querySelector?.('[data-save-warning]'));
      new MutationObserver((ms) => { for (const m of ms) { for (const x of m.addedNodes) { if (x.tagName === 'LI') R.ev.push([t(), '+', x.id || 'li', x.textContent.slice(0, 24)]); if (isW(x)) R.ev.push([t(), '+W', x.id || x.tagName, (x.textContent || '').slice(0, 30)]); } for (const x of m.removedNodes) { if (x.tagName === 'LI') R.ev.push([t(), '-', x.id || 'li', x.textContent.slice(0, 24)]); if (isW(x)) R.ev.push([t(), '-W', x.id || x.tagName, (x.textContent || '').slice(0, 30)]); } if (m.type === 'characterData' || m.type === 'childList') { const nodes = m.type === 'characterData' ? [m.target] : [...m.addedNodes]; for (const n of nodes) { const live = (n.nodeType === 1 ? n : n.parentElement)?.closest?.('[aria-live]:not([aria-live="off"]), [role="status"], [role="alert"]'); if (live && /storage is full|couldn’t save your latest/.test(n.textContent ?? '')) R.live.push([t(), live.id || live.getAttribute('aria-label') || live.className, (n.textContent || '').slice(0, 40)]); } } } }).observe(document.body, { childList: true, subtree: true, characterData: true });
      const said = document.getElementById('kettle-save-warning-said');
      if (said) new MutationObserver(() => said.textContent && R.said.push([t(), said.textContent.slice(0, 60)])).observe(said, { childList: true, characterData: true, subtree: true });
      const inter = (a, c) => a.right > c.left + 0.5 && a.left < c.right - 0.5 && a.bottom > c.top + 0.5 && a.top < c.bottom - 0.5;
      const opOf = (el) => { let o = 1; for (let e = el; e && e !== document.documentElement; e = e.parentElement) o *= +getComputedStyle(e).opacity; return +o.toFixed(3); };
      const f = () => {
        if (R.stop) return;
        const list = document.querySelector('[aria-label="Notifications"] ol');
        const lis = list ? [...list.querySelectorAll(':scope > li')] : [];
        const tw = document.getElementById(WARN);
        const twr = tw?.getBoundingClientRect();
        const region = list?.parentElement?.parentElement?.getBoundingClientRect();
        const ctrls = [...document.querySelectorAll('[data-toast-above] :is(button, a[href], [role="button"], input, textarea, select)')].filter((c) => !list?.contains(c)).map((c) => c.getBoundingClientRect()).filter((r) => r.width > 0 && r.height > 0 && r.bottom > 0 && r.top < innerHeight);
        const ban = document.querySelector('section[data-save-warning]');
        const br = ban?.getBoundingClientRect();
        const sb = ban ? [...ban.querySelectorAll('button')].find((x) => /Save backup/.test(x.textContent)) : null;
        const sbr = sb?.getBoundingClientRect();
        let sbHit = null;
        if (sbr) { const cx = sbr.left + sbr.width / 2, cy = sbr.top + sbr.height / 2; sbHit = cy >= 0 && cy < innerHeight ? (sb.contains(document.elementFromPoint(cx, cy)) ? 1 : 0) : -1; }
        const toastRects = lis.map((li) => li.getBoundingClientRect());
        const toastOverBanner = br ? toastRects.some((r) => inter(r, br)) ? 1 : 0 : null;
        const field = document.querySelector('main input');
        const fr = field?.getBoundingClientRect();
        R.frames.push([t(), Math.round(scrollY), lis.length,
          tw ? opOf(tw) : 0, twr ? Math.round(twr.top) : null, twr ? Math.round(twr.bottom) : null, region ? Math.round(region.bottom) : null, twr && ctrls.some((r) => inter(twr, r)) ? 1 : 0,
          ban ? opOf(ban) : 0, br ? Math.round(br.top) : null, br ? Math.round(br.bottom) : null, br ? Math.round(br.top + scrollY) : null, sbr ? Math.round(sbr.top) : null, sbHit, toastOverBanner, fr ? Math.round(fr.top) : null,
          ban ? getComputedStyle(ban).position : null,
          sbr && br ? (sbr.top >= br.top - 0.5 && sbr.bottom <= br.bottom + 0.5 && sbr.left >= br.left - 0.5 && sbr.right <= br.right + 0.5 ? 1 : 0) : null,
          sbr ? (() => { for (let e = ban.parentElement; e && e !== document.body; e = e.parentElement) { const cs = getComputedStyle(e); if (cs.overflowX !== 'visible' || cs.overflowY !== 'visible') { const q = e.getBoundingClientRect(); if ((sbr.top < q.top - 0.5 || sbr.bottom > q.bottom + 0.5) && e.scrollHeight <= e.clientHeight) return 1; } } return 0; })() : null]);
        requestAnimationFrame(f);
      };
      requestAnimationFrame(f);
    }, WARN);
    const bb = await md.boundingBox(); res.tapAt = [Math.round(bb.x + bb.width / 2), Math.round(bb.y + bb.height / 2)];
    res.hitBeforeTap = await p.evaluate(([x, y]) => { const h = document.elementFromPoint(x, y); return !!h && !!h.closest('button[aria-label^="Mark “"]'); }, res.tapAt);
    if (KEY) { res.focusedBeforeEnter = await p.evaluate(() => !!document.activeElement?.matches?.('button[aria-label^="Mark “"]')); await p.keyboard.press('Enter'); } else if (phone) await p.touchscreen.tap(res.tapAt[0], res.tapAt[1]); else await p.mouse.click(res.tapAt[0], res.tapAt[1]);
    await sleep(1300); await p.screenshot({ path: `${out}/${tag}-t1.3.png` });
    await sleep(Number(secArg) * 1000 - 1300);
    await p.screenshot({ path: `${out}/${tag}-end.png` });
    const R = await p.evaluate(() => { window.__rec.stop = true; return { frames: window.__rec.frames, ev: window.__rec.ev, said: window.__rec.said, live: window.__rec.live }; });
    const fr = R.frames;
    const twev = R.ev.filter((e) => e[2] === WARN);
    const bev = R.ev.filter((e) => e[1] === '+W' || e[1] === '-W').filter((e) => e[2] !== WARN);
    const bFr = fr.filter((f) => f[9] != null);
    const pageTops = [...new Set(bFr.map((f) => f[11]))];
    const inView = bFr.filter((f) => f[10] > 0 && f[9] < H);
    const wholeInView = bFr.filter((f) => f[9] >= 0 && f[10] <= H);
    const fieldTops = fr.map((f) => f[15]).filter((x) => x != null);
    res = { ...res, errors: errors.length, errorMsgs: errors.slice(0, 3), frames: fr.length,
      crossed: R.ev.filter((e) => e[1] === '+' && /Crossed/.test(e[3])).map((e) => e[0]),
      toastWarnAdds: twev.filter((e) => e[1] === '+').length, toastWarnRemovals: twev.filter((e) => e[1] === '-').length, toastWarnBoxOverDockFrames: fr.filter((f) => f[7]).length,
      bannerAdds: bev.filter((e) => e[1] === '+W').length, bannerRemovals: bev.filter((e) => e[1] === '-W').length, bannerFirstAt: bev[0]?.[0] ?? null,
      bannerFrames: bFr.length, bannerMinOpacity: bFr.length ? Math.min(...bFr.map((f) => f[8])) : null, bannerPageTops: pageTops.slice(0, 6), bannerPositions: [...new Set(bFr.map((f) => f[16]))],
      bannerInViewFrames: inView.length, bannerWholeInViewFrames: wholeInView.length, bannerViewportTopFirst: bFr[0]?.[9] ?? null, bannerViewportTopLast: bFr[bFr.length - 1]?.[9] ?? null, bannerViewportBottomLast: bFr[bFr.length - 1]?.[10] ?? null,
      saveBackupHitLast: bFr[bFr.length - 1]?.[13] ?? null, saveBackupCutFrames: bFr.filter((f) => f[17] === 0 || f[18] === 1).length, toastOverBannerFrames: bFr.filter((f) => f[14] === 1).length,
      scrollYFirst: fr[0]?.[1], scrollYLast: fr[fr.length - 1]?.[1], fieldTopRange: fieldTops.length ? [Math.min(...fieldTops), Math.max(...fieldTops)] : null,
      said: R.said, live: R.live, liveAdds: R.live.length, bannerWhereLast: (() => { const l = bFr[bFr.length - 1]; if (!l) return null; return l[10] <= 0 ? `above the view by ${-l[10]} px (top ${l[9]})` : l[9] >= H ? `below the view by ${l[9] - H} px` : l[9] >= 0 && l[10] <= H ? 'whole in view' : `partly in view (top ${l[9]}, bottom ${l[10]})`; })(), utcEnd: new Date().toISOString(), loadEnd: load(), notificationsAdds: R.ev.filter((e) => e[1] === '+').map((e) => [e[0], e[3]]) };
    appendFileSync(`${out}/markdone-${rev}.jsonl`, JSON.stringify({ ...res, ev: R.ev, framesRaw: fr }) + '\n');
  } catch (e) { res.error = String(e.message).split('\n')[0]; }
  console.log(JSON.stringify(res));
  const vid = video ? p.video() : null;
  await ctx.close();
  if (vid) { const src = await vid.path(); renameSync(src, `${out}/clip-${tag}.webm`); rmSync(`${out}/video-tmp`, { recursive: true, force: true }); }
}
await b.close();
