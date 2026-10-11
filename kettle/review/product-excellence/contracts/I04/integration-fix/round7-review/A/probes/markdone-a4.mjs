// LANE A r7 (relaunch) markdone-a4: "the banner after Mark done at 200 % text" — two setups, same recorder.
//   SETUP=a (default): the case-1 setup of markdone-a2/a3 — storage is filled right before the tap, so the Mark done save is the FIRST
//                      to fail: the warning (banner on R7, toast on INT/e866118) first appears at the tap.
//   SETUP=b          : storage is filled BEFORE the brew ends (debug `timer.end('user')`, setup), so the End's own save fails and the
//                      banner is ALREADY on Today (with the carried intention, "Mark done") before the person does anything. The recorder
//                      runs from before End. Then, from the top of Today, REAL touch drags (phones) / wheel scroll until Mark done is
//                      reachable, then a REAL tap. Records whether the tap or anything after it changes scrollTop.
// Per frame (requestAnimationFrame): document.scrollingElement.scrollTop, the banner's rect (and the warning toast's rect on toast
// designs), Mark done's rect, scrollTop of every scrollable ancestor of Mark done, toast count. Events: banner/toast add/remove, pointerdown
// / click / every scroll event with scrollTop, EVERY addition to any live region ([aria-live] not off, role=status/alert) with its EXACT full
// text. Real input only (CDP touch drag / mouse wheel / touchscreen.tap / mouse.click); debug API = setup only (startFocus, ff, end).
//   node markdone-a4.mjs <base> <rev> <out> "375x667@200:light,..." [video=0|1] [seconds=6]      env: SETUP=a|b
import { chromium } from 'playwright';
import { mkdirSync, appendFileSync, renameSync, rmSync, readFileSync } from 'node:fs';
const load = () => readFileSync('/proc/loadavg', 'utf8').split(' ').slice(0, 3).join(' ');
const [,, base, rev, out, cfgArg, videoArg = '0', secArg = '6'] = process.argv;
const SETUP = process.env.SETUP === 'b' ? 'b' : 'a';
mkdirSync(out, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const WARN = 'toast-kettle:save-failed';
const cfgs = cfgArg.split(',').map((c) => { const m = c.match(/^(\d+)x(\d+)@(\d+):(light|dark)$/); return { W: +m[1], H: +m[2], text: +m[3], theme: m[4] }; });
const b = await chromium.launch({ args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader', '--ignore-gpu-blocklist'] });
const FILL = () => { let c = 'x'.repeat(1 << 20), k = 0; while (c.length >= 1) { try { localStorage.setItem(`filler${k++}`, c); } catch { c = c.slice(0, c.length / 2); } } try { localStorage.setItem('probe', 'x'.repeat(64)); return 'no error'; } catch (e) { return e.name; } };
for (const { W, H, text, theme } of cfgs) {
  const phone = W < 900;
  const tag = `${rev}-${W}x${H}-t${text}-${theme}-setup${SETUP}`;
  const video = videoArg === '1';
  const ctx = await b.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: phone ? 2 : 1, isMobile: phone, hasTouch: phone, colorScheme: theme, ...(video ? { recordVideo: { dir: `${out}/video-tmp`, size: { width: W, height: H } } } : {}) });
  if (text !== 100) await ctx.addInitScript((pct) => addEventListener('DOMContentLoaded', () => { const s = document.createElement('style'); s.textContent = `html{font-size:${pct}%!important}`; document.head.appendChild(s); }), text);
  await ctx.addInitScript(() => { try { if (!localStorage.getItem('kettle:settings')) localStorage.setItem('kettle:settings', JSON.stringify({ state: { onboarded: true, scene: 'off', autoStartBreaks: false, autoStartFocus: false, muted: true }, version: 1 })); } catch {} });
  const p = await ctx.newPage();
  const cdp = phone ? await ctx.newCDPSession(p) : null;
  const errors = []; p.on('pageerror', (e) => errors.push(e.message));
  let res = { tag, setup: SETUP, rev, base, W, H, text, theme, utcStart: new Date().toISOString(), loadStart: load(), input: phone ? 'CDP touch drag + touchscreen.tap' : 'mouse.wheel + mouse.click' };
  try {
    const ready = () => p.waitForFunction(() => { const t = window.__kettle?.timerInfo?.(); return !!(t && t.leader && t.leaderForMs > 400 && !t.settling); }, null, { timeout: 60_000 });
    await p.goto(`${base}/?debug&theme=${theme}${theme === 'light' ? '&nooktime=day' : ''}#/`); await ready();
    await p.evaluate(() => document.fonts.ready);
    await p.evaluate(() => window.__kettle.timer.getState().startFocus({ intention: 'Chapter 3 notes', tag: 'study' }));
    await p.waitForFunction(() => location.hash === '#/focus'); await sleep(1500);
    await p.evaluate(() => window.__kettle.ff(3 * 60_000)); await sleep(400);

    // ---- the recorder (installed before End in setup b, right before the tap in setup a) -----------------------------------------
    const installRec = () => p.evaluate((WARN) => {
      const R = (window.__rec = { frames: [], ev: [], live: [], t0: performance.now(), stop: false, armed: false });
      const t = () => Math.round(performance.now() - R.t0);
      const st = () => +(document.scrollingElement.scrollTop).toFixed(1);
      const isW = (x) => x.nodeType === 1 && (x.id === WARN || x.matches?.('[data-save-warning]') || x.querySelector?.('[data-save-warning]'));
      const liveOf = (n) => { const e = n.nodeType === 1 ? n : n.parentElement; return e?.closest?.('[aria-live]:not([aria-live="off"]), [role="status"], [role="alert"]') ?? null; };
      new MutationObserver((ms) => {
        for (const m of ms) {
          for (const x of m.addedNodes) {
            if (x.tagName === 'LI') R.ev.push([t(), '+li', x.id || 'li', x.textContent.slice(0, 60), st()]);
            if (isW(x)) R.ev.push([t(), '+W', x.id || x.tagName, (x.textContent || '').slice(0, 40), st()]);
            const lv = liveOf(x) ?? (x.nodeType === 1 && x.matches?.('[aria-live]:not([aria-live="off"]), [role="status"], [role="alert"]') ? x : null);
            if (lv && (x.textContent || '').trim()) R.live.push([t(), lv.id || lv.getAttribute('aria-label') || lv.className || lv.tagName, x.textContent, st()]);
          }
          for (const x of m.removedNodes) {
            if (x.tagName === 'LI') R.ev.push([t(), '-li', x.id || 'li', x.textContent.slice(0, 60), st()]);
            if (isW(x)) R.ev.push([t(), '-W', x.id || x.tagName, (x.textContent || '').slice(0, 40), st()]);
          }
          if (m.type === 'characterData') { const lv = liveOf(m.target); if (lv && (m.target.textContent || '').trim()) R.live.push([t(), lv.id || lv.getAttribute('aria-label') || lv.className || lv.tagName, m.target.textContent, st()]); }
        }
      }).observe(document.body, { childList: true, subtree: true, characterData: true });
      for (const type of ['pointerdown', 'pointerup', 'click', 'keydown']) addEventListener(type, (e) => { const tg = e.target?.closest?.('button,a,[role=button]'); R.ev.push([t(), type, (tg?.getAttribute('aria-label') || tg?.textContent || e.target?.tagName || '').slice(0, 40), R.armed ? 'ARMED' : '', st()]); }, { capture: true, passive: true });
      document.addEventListener('scroll', (e) => { const tg = e.target === document ? 'document' : (e.target.tagName + (e.target.id ? '#' + e.target.id : '')); R.ev.push([t(), 'scroll', tg, R.armed ? 'ARMED' : '', st(), e.target === document ? st() : e.target.scrollTop]); }, { capture: true, passive: true });
      const inter = (a, c) => a.right > c.left + 0.5 && a.left < c.right - 0.5 && a.bottom > c.top + 0.5 && a.top < c.bottom - 0.5;
      const opOf = (el) => { let o = 1; for (let e = el; e && e !== document.documentElement; e = e.parentElement) o *= +getComputedStyle(e).opacity; return +o.toFixed(3); };
      const f = () => {
        if (R.stop) return;
        const list = document.querySelector('[aria-label="Notifications"] ol');
        const lis = list ? [...list.querySelectorAll(':scope > li')] : [];
        const tw = document.getElementById(WARN); const twr = tw?.getBoundingClientRect();
        const ban = document.querySelector('section[data-save-warning]'); const br = ban?.getBoundingClientRect();
        const sb = ban ? [...ban.querySelectorAll('button')].find((x) => /Save backup/.test(x.textContent)) : null; const sbr = sb?.getBoundingClientRect();
        let sbHit = null; if (sbr) { const cx = sbr.left + sbr.width / 2, cy = sbr.top + sbr.height / 2; sbHit = cy >= 0 && cy < innerHeight ? (sb.contains(document.elementFromPoint(cx, cy)) ? 1 : 0) : -1; }
        const md = document.querySelector('button[aria-label^="Mark “"]'); const mr = md?.getBoundingClientRect();
        const anc = []; if (md) for (let e = md.parentElement; e && e !== document.body && e !== document.documentElement; e = e.parentElement) { const oy = getComputedStyle(e).overflowY; if ((oy === 'auto' || oy === 'scroll' || oy === 'overlay') && e.scrollHeight > e.clientHeight) anc.push(+e.scrollTop.toFixed(1)); }
        const toastOverBanner = br ? (lis.some((li) => inter(li.getBoundingClientRect(), br)) ? 1 : 0) : null;
        const field = document.querySelector('main input'); const fr = field?.getBoundingClientRect();
        R.frames.push({ t: t(), st: st(), sh: document.scrollingElement.scrollHeight, ch: document.scrollingElement.clientHeight, n: lis.length,
          tw: tw ? { o: opOf(tw), t: Math.round(twr.top), b: Math.round(twr.bottom), l: Math.round(twr.left), r: Math.round(twr.right) } : null,
          ban: ban ? { o: opOf(ban), t: +br.top.toFixed(1), b: +br.bottom.toFixed(1), l: +br.left.toFixed(1), r: +br.right.toFixed(1), h: +br.height.toFixed(1), pos: getComputedStyle(ban).position } : null,
          sbHit, tob: toastOverBanner, md: mr ? [+mr.top.toFixed(1), +mr.bottom.toFixed(1)] : null, anc, ft: fr ? Math.round(fr.top) : null, vv: +(visualViewport?.scale ?? 1).toFixed(3) });
        requestAnimationFrame(f);
      };
      requestAnimationFrame(f);
    }, WARN);
    const snap = () => p.evaluate(() => { const ban = document.querySelector('section[data-save-warning]'); const br = ban?.getBoundingClientRect(); const md = document.querySelector('button[aria-label^="Mark “"]'); const mr = md?.getBoundingClientRect(); return { st: +document.scrollingElement.scrollTop.toFixed(1), banT: br ? +br.top.toFixed(1) : null, banB: br ? +br.bottom.toFixed(1) : null, banInView: br ? br.bottom > 0 && br.top < innerHeight : null, banWhole: br ? br.top >= 0 && br.bottom <= innerHeight : null, mdT: mr ? +mr.top.toFixed(1) : null, mdB: mr ? +mr.bottom.toFixed(1) : null }; });

    if (SETUP === 'b') {
      res.quota = await p.evaluate(FILL);        // SETUP (labelled): storage really full BEFORE the brew ends, so End's own save is the one that fails first
      await installRec();
      res.utcRecStart = new Date().toISOString();
      await p.evaluate(() => window.__kettle.timer.getState().end('user'));
    } else {
      await p.evaluate(() => window.__kettle.timer.getState().end('user'));
    }
    await p.waitForFunction(() => location.hash === '#/' || location.hash === '');
    await p.waitForFunction(() => document.querySelectorAll('[aria-label="Notifications"] li').length === 0, null, { timeout: 15_000 });
    await sleep(900);
    const md = p.locator('button[aria-label^="Mark “"]');
    res.markDone = await md.count();
    if (!res.markDone) throw new Error('no "Mark done" on Today');
    if (SETUP === 'b') {
      const s0 = await snap(); res.atTop = s0;
      if (!s0.banT && s0.banT !== 0) throw new Error('setup b: the banner is not on Today after End (storage full before End)');
      await p.screenshot({ path: `${out}/${tag}-0top.png` });
      res.bannerAlreadyBeforeAnyInput = true;
    }
    // ---- bring Mark done into view by REAL input (CDP touch drag on phones / wheel on desktop); log each step ---------------------
    const view = () => p.evaluate(() => { const el = document.querySelector('button[aria-label^="Mark “"]'); const r = el.getBoundingClientRect(); const dock = [...document.querySelectorAll('[data-toast-above]')].map((d) => d.getBoundingClientRect().top).filter((t) => t > 0 && t < innerHeight); const lim = Math.min(innerHeight, ...dock); const cx = r.left + r.width / 2, cy = r.top + r.height / 2; const h = cy > 0 && cy < innerHeight ? document.elementFromPoint(cx, cy) : null; return { cy, lim, cov: !!h && !el.contains(h) && !!h.closest('[aria-label="Notifications"]'), ok: !!h && el.contains(h) && r.top >= 0 && r.bottom <= lim - 4 }; });
    res.steps = [];
    for (let i = 0; i < 24; i++) {
      const v = await view(); if (v.ok) break;
      const dir = v.cov ? 1 : v.cy > v.lim / 2 ? 1 : -1;
      if (cdp) { const x = Math.round(W / 2), y0 = dir > 0 ? Math.round(v.lim * 0.7) : Math.round(v.lim * 0.3), span = 90 * dir, n = 12; await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y: y0 }] }); for (let k = 1; k <= n; k++) { await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x, y: Math.round(y0 - (span * k) / n) }] }); await sleep(16); } await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); await sleep(500); }
      else { await p.mouse.move(Math.round(W / 2), Math.round(H / 2)); await p.mouse.wheel(0, 80 * dir); await sleep(300); }
      res.steps.push({ i, dir, ...(await snap()) });
    }
    res.markDoneInView = (await view()).ok;
    res.beforeTap = await snap();
    if (SETUP === 'a') {
      res.quota = await p.evaluate(FILL);       // SETUP (labelled): storage really full just before the tap, so the Mark done save is the first to fail
      await installRec();
      res.utcRecStart = new Date().toISOString();
    } else {
      await p.screenshot({ path: `${out}/${tag}-1beforetap.png` });
    }
    const bb = await md.boundingBox(); res.tapAt = [Math.round(bb.x + bb.width / 2), Math.round(bb.y + bb.height / 2)];
    res.hitBeforeTap = await p.evaluate(([x, y]) => { const h = document.elementFromPoint(x, y); return !!h && !!h.closest('button[aria-label^="Mark “"]'); }, res.tapAt);
    await sleep(250);                              // a few quiet frames before the tap
    res.scrollTopImmediatelyBeforeTap = await p.evaluate(() => { window.__rec.armed = true; window.__rec.tapT = Math.round(performance.now() - window.__rec.t0); return +document.scrollingElement.scrollTop.toFixed(1); });
    if (phone) await p.touchscreen.tap(res.tapAt[0], res.tapAt[1]); else await p.mouse.click(res.tapAt[0], res.tapAt[1]);
    await sleep(1300); await p.screenshot({ path: `${out}/${tag}-t1.3.png` });
    await sleep(Number(secArg) * 1000 - 1300);
    await p.screenshot({ path: `${out}/${tag}-end.png` });
    const R = await p.evaluate(() => { window.__rec.stop = true; return { frames: window.__rec.frames, ev: window.__rec.ev, live: window.__rec.live, tapT: window.__rec.tapT }; });
    // ---- analysis ------------------------------------------------------------------------------------------------------------------
    const fr = R.frames, ev = R.ev;
    const tapEv = ev.find((e) => e[1] === 'pointerdown' && e[3] === 'ARMED');
    const tapT = tapEv ? tapEv[0] : R.tapT;
    const before = fr.filter((f) => f.t < tapT), after = fr.filter((f) => f.t >= tapT);
    const stAtTap = tapEv ? tapEv[4] : null;
    const bannerEv = ev.filter((e) => e[1] === '+W' || e[1] === '-W');
    const twEv = ev.filter((e) => e[2] === WARN);
    const inV = (f) => f.ban && f.ban.b > 0 && f.ban.t < H;
    const wholeV = (f) => f.ban && f.ban.t >= 0 && f.ban.b <= H;
    const firstBan = fr.find((f) => f.ban), lastBan = [...fr].reverse().find((f) => f.ban);
    const atTapFrame = [...before].reverse().find((f) => true);
    const jumps = []; { let prev = null; for (const f of fr) { if (prev && Math.abs(f.st - prev.st) > 0.5) jumps.push({ t: f.t, from: prev.st, to: f.st, d: +(f.st - prev.st).toFixed(1), afterTap: f.t >= tapT, bannerPresent: !!f.ban, docH: [prev.sh, f.sh], maxScroll: [prev.sh - prev.ch, f.sh - f.ch], mdPresent: [!!prev.md, !!f.md] }); prev = f; } }
    const afterJumps = jumps.filter((j) => j.afterTap);
    const liveAll = R.live.map((l) => ({ t: l[0], region: l[1], text: l[2], st: l[3], afterTap: l[0] >= tapT }));
    const liveWarn = liveAll.filter((l) => /storage is full|couldn’t save your latest|can’t save in this browser/.test(l.text));
    res = { ...res, errors: errors.length, errorMsgs: errors.slice(0, 3), frames: fr.length, tapT,
      crossedAt: ev.filter((e) => e[1] === '+li' && /Crossed/.test(e[3])).map((e) => e[0]),
      scrollTopAtTapEvent: stAtTap,
      scrollTopFramesBeforeTap: before.slice(-3).map((f) => f.st), scrollTopRangeAfterTap: after.length ? [Math.min(...after.map((f) => f.st)), Math.max(...after.map((f) => f.st))] : null,
      scrollTopFirstAfterTap: after[0]?.st ?? null, scrollTopLast: fr[fr.length - 1]?.st ?? null,
      jumpsAfterTap: afterJumps, jumpsBeforeTapCount: jumps.length - afterJumps.length,
      ancScrollAfterTap: [...new Set(after.map((f) => JSON.stringify(f.anc)))].slice(0, 5),
      bannerAdds: bannerEv.filter((e) => e[1] === '+W').length, bannerRemovals: bannerEv.filter((e) => e[1] === '-W').length, bannerEvents: bannerEv.map((e) => [e[0], e[1], e[4]]),
      bannerFirstAtMs: bannerEv.find((e) => e[1] === '+W')?.[0] ?? null, bannerFirstRelTapMs: bannerEv.find((e) => e[1] === '+W') ? bannerEv.find((e) => e[1] === '+W')[0] - tapT : null,
      toastWarnAdds: twEv.filter((e) => e[1] === '+li').length, toastWarnRemovals: twEv.filter((e) => e[1] === '-li').length,
      bannerFramesTotal: fr.filter((f) => f.ban).length, bannerFramesBeforeTap: before.filter((f) => f.ban).length, bannerFramesAfterTap: after.filter((f) => f.ban).length,
      bannerInViewFramesBeforeTap: before.filter(inV).length, bannerWholeInViewFramesBeforeTap: before.filter(wholeV).length,
      bannerInViewFramesAfterTap: after.filter(inV).length, bannerWholeInViewFramesAfterTap: after.filter(wholeV).length,
      bannerMinOpacity: (() => { const o = fr.filter((f) => f.ban).map((f) => f.ban.o); return o.length ? Math.min(...o) : null; })(),
      bannerRectFirst: firstBan?.ban ?? null, bannerRectAtTap: [...before].reverse().find((f) => f.ban)?.ban ?? null, bannerRectLast: lastBan?.ban ?? null,
      bannerRectAt3sAfterTap: (after.find((f) => f.t >= tapT + 3000 && f.ban) ?? lastBan)?.ban ?? null,
      bannerWhereLast: (() => { const l = lastBan?.ban; if (!l) return null; return l.b <= 0 ? `above the view by ${-l.b} px (top ${l.t})` : l.t >= H ? `below the view by ${(l.t - H).toFixed(1)} px` : l.t >= 0 && l.b <= H ? 'whole in view' : `partly in view (top ${l.t}, bottom ${l.b})`; })(),
      toastWarnRectLast: [...fr].reverse().find((f) => f.tw)?.tw ?? null, toastWarnFramesInView: fr.filter((f) => f.tw && f.tw.b > 0 && f.tw.t < H).length,
      saveBackupCutOrMissFrames: fr.filter((f) => f.ban && f.sbHit === 0).length, toastOverBannerFrames: fr.filter((f) => f.tob === 1).length,
      mdRectAtTap: [...before].reverse().find((f) => f.md)?.md ?? null, docHeightAtTap: [...before].reverse()[0]?.sh ?? null, maxScrollAtTap: (() => { const f = [...before].reverse()[0]; return f ? f.sh - f.ch : null; })(), docHeightLast: fr[fr.length - 1]?.sh ?? null, maxScrollLast: (() => { const f = fr[fr.length - 1]; return f ? f.sh - f.ch : null; })(), markDoneGoneAfterTapMs: (after.find((f) => !f.md)?.t ?? null), vvRange: [Math.min(...fr.map((f) => f.vv)), Math.max(...fr.map((f) => f.vv))],
      liveAdditionsAll: liveAll, liveAdditionsWarn: liveWarn.length, liveAdditionsWarnAfterTap: liveWarn.filter((l) => l.afterTap).length, liveAdditionsAfterTapAll: liveAll.filter((l) => l.afterTap).length,
      utcEnd: new Date().toISOString(), loadEnd: load() };
    appendFileSync(`${out}/markdone-${rev}-setup${SETUP}.jsonl`, JSON.stringify({ ...res, ev, framesRaw: fr, jumpsAll: jumps }) + '\n');
  } catch (e) { res.error = String(e.message).split('\n')[0]; }
  console.log(JSON.stringify(res));
  const vid = video ? p.video() : null;
  await ctx.close();
  if (vid) { const src = await vid.path(); renameSync(src, `${out}/clip-${tag}.webm`); rmSync(`${out}/video-tmp`, { recursive: true, force: true }); }
}
await b.close();
