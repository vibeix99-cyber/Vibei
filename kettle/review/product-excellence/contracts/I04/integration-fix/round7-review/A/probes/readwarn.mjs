// LANE A r7 probe (new; setup copied from M7a's natural-b.mjs): can every line of the storage-full warning be read, and
// "Save backup" reached and used, by REAL input at large text — whichever element presents the warning (the toast
// li#toast-kettle:save-failed on INT, or the in-page banner section[data-save-warning] on R7). Discriminates the old
// D3 / R2-D3 / R4-D1 symptoms (warning rising past the screen, squeezed in a stack, opening unreadable by scrolling).
// Setup (debug API, labelled): newbie seed, leaves one short of a level-up, localStorage filled to QuotaExceededError,
// brew 12 min (ff), end('user') => End after a level-up: the stack of toasts + the warning. Real timers, nothing held.
// Input (real): GESTURE=wheel (page.mouse.wheel 40 px notches, pointer on the warning's visible part, else mid-screen)
// or GESTURE=touch (CDP Input.dispatchTouchEvent 60 px drags at the same point). Sequence: 8 strokes up, 24 down, 24 up.
// Per frame: every text line box of the warning (Range.getClientRects), "wholly seen" when inside the viewport, every
// clipping ancestor, above the docked start's top, and elementFromPoint at its left/centre/right hits the warning.
// Also: toast squeeze (li content taller than its box while the list is not scrollable), warning adds/removals.
// End: strokes toward "Save backup" until its centre hit-tests to it (max 20), then a real tap/click => download?
//   node readwarn.mjs <base> <rev> <out> <WxH> <theme> <text>
import { mkdirSync, appendFileSync, readFileSync, renameSync, rmSync } from 'node:fs';
import { launch, context, sleep } from './lib.mjs';
const [base, rev, out, cfg, theme, textArg] = process.argv.slice(2);
const GESTURE = process.env.GESTURE ?? 'wheel', VIDEO = process.env.VIDEO === '1';
mkdirSync(out, { recursive: true });
const [W, H] = cfg.split('x').map(Number); const text = +textArg;
const load = () => readFileSync('/proc/loadavg', 'utf8').split(' ').slice(0, 3).join(' ');
const WARN = 'toast-kettle:save-failed';
const WSEL = `[id="${WARN}"], section[data-save-warning]`;
const tag = `${rev}-${W}x${H}-t${text}-${theme}-${GESTURE}`;
const meta = { tag, rev, base, W, H, text, theme, gesture: GESTURE, utcStart: new Date().toISOString(), loadStart: load() };
const browser = await launch();
const ctx = VIDEO ? await (async () => { const c = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: W >= 900 ? 1 : 2, isMobile: W < 900, hasTouch: W < 900, colorScheme: theme, acceptDownloads: true, recordVideo: { dir: `${out}/video-tmp`, size: { width: W, height: H } } }); if (text !== 100) await c.addInitScript((pct) => { addEventListener('DOMContentLoaded', () => { const s = document.createElement('style'); s.textContent = `html{font-size:${pct}%!important}`; document.head.appendChild(s); }); }, text); return c; })() : await context(browser, { w: W, h: H, theme, text });
await ctx.addInitScript(() => { try { if (!localStorage.getItem('kettle:settings')) localStorage.setItem('kettle:settings', JSON.stringify({ state: { onboarded: true, scene: 'off', autoStartBreaks: false, autoStartFocus: false, muted: true }, version: 1 })); } catch {} });
const page = await ctx.newPage();
const errors = []; page.on('pageerror', (e) => errors.push(e.message));
let res = { ...meta };
try {
  const ready = () => page.waitForFunction(() => { const i = window.__kettle?.timerInfo?.(); return !!(i && i.leader && i.leaderForMs > 400 && !i.settling); }, null, { timeout: 60_000 });
  await page.goto(`${base}/?debug&theme=${theme}${theme === 'light' ? '&nooktime=day' : ''}#/`); await ready();
  await page.evaluate(() => window.__kettle.seed('newbie')); await page.reload(); await ready();
  await page.evaluate(() => document.fonts.ready);
  await page.evaluate(async () => { const { leavesForLevel, levelFromLeaves } = await import('/src/progress/levels.ts'); const L = levelFromLeaves(window.__kettle.progress.getState().leaves).level; window.__kettle.progress.setState({ leaves: leavesForLevel(L + 1) - 1 }); });
  res.quota = await page.evaluate(() => { let c = 'x'.repeat(1 << 20), i = 0; while (c.length >= 1) { try { localStorage.setItem(`filler${i++}`, c); } catch { c = c.slice(0, c.length / 2); } } try { localStorage.setItem('probe', 'x'.repeat(64)); return 'no error'; } catch (e) { return e.name; } });
  await page.evaluate(() => window.__kettle.timer.getState().startFocus({ intention: 'Chapter 3 notes', tag: 'study' }));
  await page.waitForFunction(() => location.hash === '#/focus'); await sleep(2500);
  await page.evaluate(() => window.__kettle.ff(12 * 60_000 + 5_000)); await sleep(500);
  await page.evaluate((WARN) => {
    const R = (window.__rec = { frames: [], ev: [], seen: {}, nLines: 0, squeeze: 0, t0: performance.now(), stop: false });
    const t = () => Math.round(performance.now() - R.t0);
    const isW = (n) => n.nodeType === 1 && (n.id === WARN || n.matches?.('section[data-save-warning]') || !!n.querySelector?.('section[data-save-warning]'));
    new MutationObserver((ms) => { for (const m of ms) { for (const n of m.addedNodes) { if (n.tagName === 'LI') R.ev.push([t(), '+', n.id]); else if (isW(n)) R.ev.push([t(), '+', 'banner']); } for (const n of m.removedNodes) { if (n.tagName === 'LI') R.ev.push([t(), '-', n.id]); else if (isW(n)) R.ev.push([t(), '-', 'banner']); } } }).observe(document.body, { childList: true, subtree: true });
    const f = () => {
      if (R.stop) return;
      const w = document.getElementById(WARN) ?? document.querySelector('section[data-save-warning]');
      const dock = [...document.querySelectorAll('[data-toast-above]')].map((d) => d.getBoundingClientRect().top).filter((x) => x > 0 && x < innerHeight);
      const lim = Math.min(innerHeight, ...dock);
      let nSeen = 0, n = 0, op = 1;
      if (w) {
        for (let e = w; e && e !== document.documentElement; e = e.parentElement) op *= +getComputedStyle(e).opacity;
        const clips = []; for (let e = w; e && e !== document.body; e = e.parentElement) { const cs = getComputedStyle(e); if (cs.overflowX !== 'visible' || cs.overflowY !== 'visible') clips.push(e.getBoundingClientRect()); }
        const tw = document.createTreeWalker(w, NodeFilter.SHOW_TEXT); let node, k = 0;
        while ((node = tw.nextNode())) { if (!node.textContent.trim()) continue; const rg = document.createRange(); rg.selectNodeContents(node);
          for (const r of rg.getClientRects()) { if (r.width < 2) continue; const key = `${k++}`; n++;
            const inV = r.top >= -0.5 && r.bottom <= lim + 0.5 && r.left >= -0.5 && r.right <= innerWidth + 0.5 && clips.every((c) => r.top >= c.top - 0.5 && r.bottom <= c.bottom + 0.5 && r.left >= c.left - 0.5 && r.right <= c.right + 0.5);
            let hit = false; if (inV) { const y = (r.top + r.bottom) / 2; hit = [r.left + 2, (r.left + r.right) / 2, r.right - 2].every((x) => { const h = document.elementFromPoint(x, y); return !!h && w.contains(h); }); }
            if (inV && hit && op >= 0.98) { R.seen[key] = (R.seen[key] ?? 0) + 1; nSeen++; } } }
        R.nLines = Math.max(R.nLines, n);
      }
      const list = document.querySelector('[aria-label="Notifications"] ol');
      const sq = list ? [...list.children].filter((li) => li.scrollHeight > li.clientHeight + 1 && getComputedStyle(li).overflowY === 'visible').length : 0;
      if (sq) R.squeeze++;
      const sb = w ? [...w.querySelectorAll('button')].find((x) => /Save backup/.test(x.textContent)) : null; const sbr = sb?.getBoundingClientRect();
      R.frames.push([t(), w ? (w.tagName === 'SECTION' ? 'B' : 'T') : '-', +op.toFixed(2), n, nSeen, Math.round(scrollY), list ? list.children.length : 0, list ? +list.scrollTop.toFixed(1) : null, w ? Math.round(w.getBoundingClientRect().top) : null, w ? Math.round(w.getBoundingClientRect().bottom) : null, sbr ? Math.round(sbr.top) : null, Math.round(lim), sq]);
      requestAnimationFrame(f);
    };
    requestAnimationFrame(f);
  }, WARN);
  await page.evaluate(() => window.__kettle.timer.getState().end('user'));
  await page.waitForFunction(() => location.hash === '#/' || location.hash === '');
  await page.waitForSelector(WSEL, { state: 'attached', timeout: 8000 }); await sleep(600);
  const cdp = GESTURE === 'touch' ? await ctx.newCDPSession(page) : null;
  const pt = () => page.evaluate((WARN) => { const w = document.getElementById(WARN) ?? document.querySelector('section[data-save-warning]'); const r = w?.getBoundingClientRect(); if (r) { const t = Math.max(r.top, 30), b = Math.min(r.bottom, innerHeight - 30); if (b - t > 10) return { x: (r.left + r.right) / 2, y: (t + b) / 2 }; } return { x: innerWidth / 2, y: innerHeight * 0.4 }; }, WARN);
  const stroke = async (dy) => { const { x, y } = await pt(); if (GESTURE === 'wheel') { await page.mouse.move(Math.round(x), Math.round(y)); await page.mouse.wheel(0, dy); await sleep(140); } else { const n = 6, yy = Math.round(Math.min(Math.max(y, 40), H - 40)), d = dy * 1.5; await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: Math.round(x), y: yy }] }); for (let k = 1; k <= n; k++) { await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: Math.round(x), y: Math.round(Math.min(Math.max(yy - (d * k) / n, 2), H - 2)) }] }); await sleep(16); } await sleep(60); await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); await sleep(120); } };
  for (let i = 0; i < 8; i++) await stroke(-40);
  for (let i = 0; i < 24; i++) await stroke(40);
  for (let i = 0; i < 24; i++) await stroke(-40);
  const R = await page.evaluate(() => { window.__rec.stop = true; return { frames: window.__rec.frames, ev: window.__rec.ev, seen: window.__rec.seen, nLines: window.__rec.nLines, squeeze: window.__rec.squeeze }; });
  // Save backup: strokes toward it until its centre hit-tests (real input), then a real tap / click
  const sbs = () => page.evaluate((WARN) => { const w = document.getElementById(WARN) ?? document.querySelector('section[data-save-warning]'); const sb = w ? [...w.querySelectorAll('button')].find((x) => /Save backup/.test(x.textContent)) : null; if (!sb) return null; const r = sb.getBoundingClientRect(); const cx = r.left + r.width / 2, cy = r.top + r.height / 2; const dock = [...document.querySelectorAll('[data-toast-above]')].map((d) => d.getBoundingClientRect().top).filter((x) => x > 0 && x < innerHeight); const lim = Math.min(innerHeight, ...dock); const h = cy >= 0 && cy < innerHeight ? document.elementFromPoint(cx, cy) : null; return { cx, cy, lim, ok: !!h && sb.contains(h) }; }, WARN);
  let s = await sbs(), k = 0;
  for (; s && !s.ok && k < 20; k++) { await stroke(s.cy > s.lim / 2 ? 40 : -40); s = await sbs(); }
  res.saveBackupStrokes = k; res.saveBackupHit = !!s?.ok;
  if (s?.ok) { const dl = page.waitForEvent('download', { timeout: 4000 }).then((d) => d.suggestedFilename()).catch(() => null); if (W < 900) await page.touchscreen.tap(Math.round(s.cx), Math.round(s.cy)); else await page.mouse.click(Math.round(s.cx), Math.round(s.cy)); res.download = await dl; }
  const fr = R.frames; const firstW = fr.findIndex((f) => f[1] !== '-');
  const wev = R.ev.filter((e) => e[2] === WARN || e[2] === 'banner');
  res = { ...res, errors: errors.length, frames: fr.length, presenter: [...new Set(fr.map((f) => f[1]))].join(''), warnAdds: wev.filter((e) => e[1] === '+').length, warnRemovals: wev.filter((e) => e[1] === '-').length,
    nLines: R.nLines, linesSeen: Object.keys(R.seen).length, linesNeverSeen: R.nLines - Object.keys(R.seen).length, squeezeFrames: R.squeeze,
    warnTopRange: (() => { const v = fr.map((f) => f[8]).filter((x) => x != null); return v.length ? [Math.min(...v), Math.max(...v)] : null; })(),
    fadedOrGoneAfterFirst: firstW < 0 ? null : fr.slice(firstW).filter((f) => f[1] === '-' || f[2] < 0.98).length, utcEnd: new Date().toISOString(), loadEnd: load() };
  res.fail = [res.linesNeverSeen > 0 && `E: ${res.linesNeverSeen}/${res.nLines} warning lines never wholly seen`, !res.saveBackupHit && 'F: Save backup never hit-tested', res.saveBackupHit && !res.download && 'F: no download from a real tap', res.squeezeFrames > 0 && `H: toast squeezed in ${res.squeezeFrames} frames`].filter(Boolean);
  appendFileSync(`${out}/readwarn.jsonl`, JSON.stringify({ ...res, ev: R.ev, seen: R.seen, framesRaw: fr }) + '\n');
  await page.screenshot({ path: `${out}/${tag}-end.png` });
} catch (e) { res.error = String(e.message).split('\n')[0]; appendFileSync(`${out}/readwarn.jsonl`, JSON.stringify(res) + '\n'); }
console.log(JSON.stringify({ ...res }));
const vid = VIDEO ? page.video() : null;
await ctx.close();
if (vid) { const src = await vid.path(); renameSync(src, `${out}/clip-${tag}.webm`); rmSync(`${out}/video-tmp`, { recursive: true, force: true }); }
await browser.close();
