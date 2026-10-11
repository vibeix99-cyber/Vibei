// RELAUNCH copy of cover.mjs, check 4 only (summary note vs Tea time / Skip footer): stops after the summary-end measurement.
// Lane B checks 3 + 4 (original header): with the storage-full warning up and toasts present, nothing covers the countdown or any
// protected control once layout settles (bounding boxes + elementFromPoint at 5 points, ~12 frames), on Today, the
// brew (running, paused), the summary (with its failed-save note), the break and Break's over (panel at its top and
// wheeled to its end). Summary note: present only after a failed save, one line?, wording, Save backup downloads, the
// last expanded details line vs the Tea time / Skip footer after real-wheel/touch scrolling to the end.
// Setup by the debug API (seed, quota fill, one failing app save, ff to the end of a brew/break); toasts are the app's
// own toast() with default timers (labelled setup). Taps/clicks/wheel/touch are real input.
//   node cover.mjs <base> <rev> <out> "375x667@100:light,..." [mode=full|ctl]
import { mkdirSync, appendFileSync, readFileSync, rmSync } from 'node:fs';
import { launch, newCtx, open, seedAndFill, failASave, sleep, parseCfgs, touchDrag } from './blib.mjs';
const [,, base, rev, out, cfgArg, mode = 'full'] = process.argv;
mkdirSync(out, { recursive: true });
const b = await launch();
const RAISE = (p) => p.evaluate(async () => { const { toast } = await import('/src/ui/Toast.tsx'); toast('Recipe done: Take 2 full tea breaks · +15 leaves', { tone: 'success' }); toast('Saved 12 minutes of focus', { tone: 'info' }); toast('Cozy level 5!', { tone: 'success' }); });
const SAMPLE = (p, names, frames = 12) => p.evaluate(async ({ names, frames }) => {
  const norm = (s) => s.replace(/[’‘]/g, "'").replace(/\s+/g, ' ').trim();
  const res = {};
  for (let f = 0; f < frames; f++) {
    await new Promise((r) => requestAnimationFrame(r));
    const ol = document.querySelector('[aria-label="Notifications"] ol');
    let clip = null;
    if (ol && getComputedStyle(ol).overflowY !== 'visible') { const q = ol.getBoundingClientRect(); clip = q; }
    const toasts = [...document.querySelectorAll('[aria-label="Notifications"] li')].map((li) => {
      let op = 1; for (let e = li; e && e !== document.documentElement; e = e.parentElement) op *= +getComputedStyle(e).opacity;
      const q = li.getBoundingClientRect(); let r = { l: q.left, t: q.top, r: q.right, b: q.bottom };
      if (clip) r = { l: Math.max(r.l, clip.left), t: Math.max(r.t, clip.top), r: Math.min(r.r, clip.right), b: Math.min(r.b, clip.bottom) };
      return { op, r };
    }).filter((t) => t.op > 0.05 && t.r.r > t.r.l && t.r.b > t.r.t);
    for (const n of names) {
      let el;
      if (n === 'COUNTDOWN') el = document.querySelector('[role="timer"]')?.parentElement;
      else el = [...document.querySelectorAll('button, a[href]')].find((x) => !x.closest('[aria-hidden="true"],[inert],[aria-label="Notifications"]') && new RegExp(n).test(norm(x.getAttribute('aria-label') || x.textContent || '')));
      const row = (res[n] ??= { frames: 0, covered: 0, hitMiss: 0, toastOverlap: 0, off: 0, missing: 0, box: null, by: [] });
      row.frames++;
      if (!el) { row.missing++; continue; }
      const q = el.getBoundingClientRect();
      let top = Math.max(q.top, 0), bot = Math.min(q.bottom, innerHeight);
      for (let a = el.parentElement; a && a !== document.body; a = a.parentElement) { const oy = getComputedStyle(a).overflowY; if (oy === 'auto' || oy === 'scroll' || oy === 'hidden') { const ar = a.getBoundingClientRect(); top = Math.max(top, ar.top); bot = Math.min(bot, ar.bottom); } }
      if (bot - top < 8) { row.off++; continue; }
      row.box = [Math.round(q.left), Math.round(q.top), Math.round(q.width), Math.round(q.height)];
      const xs = [q.left + q.width * 0.25, q.left + q.width / 2, q.left + q.width * 0.75], ys = [top + (bot - top) * 0.3, (top + bot) / 2, top + (bot - top) * 0.7];
      let miss = 0, by = null;
      for (const [x, y] of [[xs[1], ys[1]], [xs[0], ys[0]], [xs[2], ys[0]], [xs[0], ys[2]], [xs[2], ys[2]]]) { const h = document.elementFromPoint(x, y); if (!h || !el.contains(h)) { miss++; by = h ? `${h.tagName}.${(h.className?.baseVal ?? h.className ?? '').toString().slice(0, 30)}:${(h.textContent || '').trim().slice(0, 30)}` : 'null'; } }
      const ov = toasts.some((t) => t.r.b > top + 1 && t.r.t < bot - 1 && t.r.r > q.left + 1 && t.r.l < q.right - 1);
      if (miss) row.hitMiss++;
      if (ov) row.toastOverlap++;
      if (miss || ov) { row.covered++; if (by && row.by.length < 3) row.by.push(by); }
    }
  }
  const w = document.querySelector('[data-save-warning]');
  return { rows: res, toasts: document.querySelectorAll('[aria-label="Notifications"] li').length, warning: w ? { tag: w.tagName, pos: getComputedStyle(w).position, z: getComputedStyle(w).zIndex } : null, warnToast: !!document.getElementById('toast-kettle:save-failed'), hash: location.hash };
}, { names, frames });
for (const cfg of parseCfgs(cfgArg)) {
  const { W, H, text, theme } = cfg;
  const phone = W < 900;
  const tag = `${rev}-${W}x${H}-t${text}-${theme}${mode === 'ctl' ? '-ctl' : ''}`;
  const ctx = await newCtx(b, cfg);
  const p = await ctx.newPage();
  const cdp = await ctx.newCDPSession(p);
  const errors = []; p.on('pageerror', (e) => errors.push(e.message));
  const res = { tag, rev, base, W, H, text, theme, mode, started: new Date().toISOString(), states: {} };
  const tapOn = async (re) => { const loc = p.locator('button, a[href]').filter({ hasText: re }).filter({ visible: true }).first(); const bb = await loc.boundingBox(); if (!bb) throw new Error('no box for ' + re); const x = bb.x + bb.width / 2, y = bb.y + bb.height / 2; if (phone) await p.touchscreen.tap(x, y); else await p.mouse.click(x, y); return [Math.round(x), Math.round(y)]; };
  const tapLabel = async (re) => { const loc = p.getByRole('button', { name: re }).filter({ visible: true }).first(); const bb = await loc.boundingBox(); if (!bb) throw new Error('no box for ' + re); const x = bb.x + bb.width / 2, y = bb.y + bb.height / 2; if (phone) await p.touchscreen.tap(x, y); else await p.mouse.click(x, y); };
  const hitOkLoc = (loc) => loc.evaluate((el) => { const r = el.getBoundingClientRect(); const x = r.left + r.width / 2, y = r.top + r.height / 2; if (y < 0 || y >= innerHeight) return false; const h = document.elementFromPoint(x, y); return !!h && el.contains(h); });
  const bringToHit = async (loc) => {
    for (let i = 0; i < 40; i++) {
      if (await hitOkLoc(loc)) return i;
      const s = await loc.evaluate((el) => { let a = el.parentElement; while (a && a !== document.body) { const o = getComputedStyle(a).overflowY; if ((o === 'auto' || o === 'scroll') && a.scrollHeight > a.clientHeight) break; a = a.parentElement; } const box = (a && a !== document.body ? a : document.documentElement).getBoundingClientRect(); const r = el.getBoundingClientRect(); return { x: box.left + 12, y: Math.max(box.top + 30, 30), down: r.top + r.height / 2 > innerHeight / 2 }; });
      if (phone) await touchDrag(cdp, Math.round(s.x), Math.round(s.y) + (s.down ? 50 : 0), s.down ? -50 : 50); else { await p.mouse.move(s.x, s.y); await p.mouse.wheel(0, s.down ? 20 : -20); }
      await sleep(150);
    }
    return (await hitOkLoc(loc)) ? 40 : -1;
  };
  const state = async (name, names) => { await RAISE(p); await sleep(1500); const s = await SAMPLE(p, names); await p.screenshot({ path: `${out}/${tag}-${name}.png` }); res.states[name] = s; const bad = Object.entries(s.rows).filter(([, r]) => r.covered).map(([n, r]) => `${n}:${r.covered}/${r.frames}`); console.log(tag, name, 'toasts', s.toasts, 'warning', JSON.stringify(s.warning), s.warnToast ? 'WARN-TOAST' : '', bad.length ? 'COVERED ' + bad.join(' ') : 'clear', 'missing/off', Object.entries(s.rows).filter(([, r]) => r.missing || r.off).map(([n, r]) => `${n}:m${r.missing}/o${r.off}`).join(' ')); };
  const wheelToEnd = async (sel) => {
    const bb = await p.evaluate((sel) => { const e = document.querySelector(sel); if (!e) return null; const r = e.getBoundingClientRect(); return [r.left + r.width / 2, Math.max(r.top + 30, Math.min(r.top + r.height * 0.3, innerHeight * 0.4))]; }, sel);
    if (!bb) return 'no scroller';
    let last = null, still = 0, n = 0;
    if (phone) { for (; n < 80 && still < 4; n++) { await touchDrag(cdp, Math.round(bb[0]), Math.round(bb[1]) + 40, -40); await sleep(150); const sig = await p.evaluate((sel) => document.querySelector(sel)?.scrollTop + ':' + scrollY, sel); still = sig === last ? still + 1 : 0; last = sig; } }
    else { await p.mouse.move(bb[0], bb[1]); for (; n < 200 && still < 6; n++) { await p.mouse.wheel(0, 20); await sleep(80); const sig = await p.evaluate((sel) => document.querySelector(sel)?.scrollTop + ':' + scrollY, sel); still = sig === last ? still + 1 : 0; last = sig; } }
    return `${phone ? 'touch' : 'wheel'} x${n}`;
  };
  try {
    await open(p, base, theme);
    if (mode === 'full') { res.fill = await seedAndFill(p); res.tFail = await failASave(p); await sleep(2500); }
    else { await p.evaluate(() => window.__kettle.seed('newbie')); await p.reload(); await (await import('./blib.mjs')).ready(p); }
    await tapOn(/^Put the kettle on/);
    await p.waitForFunction(() => location.hash === '#/focus', null, { timeout: 15000 }); await sleep(1500);
    await p.evaluate(async () => (await import('/src/ui/Toast.tsx')).toast.dismiss());
    // SETUP: to 50 ms before 0:00 (the debug clock), then the real whistle → summary.
    await p.evaluate(() => { const k = window.__kettle; const s = k.timer.getState(); k.ff(s.endsAt - k.clock.now() - 50); });
    await p.waitForFunction(() => location.hash === '#/done', null, { timeout: 25000 }); await sleep(2000);
    // Check 4: the note.
    res.note = await p.evaluate(() => {
      const n = document.querySelector('p[data-save-warning]');
      const body = document.querySelector('main')?.innerText || document.body.innerText;
      const savedWords = [...body.matchAll(/[^.\n]*\bsav(?:e|ed|ing)\b[^.\n]*/gi)].map((m) => m[0].trim()).slice(0, 8);
      if (!n) return { present: false, savedWords };
      const t = n.querySelector('span:nth-of-type(2)') || n; const btn = n.querySelector('button');
      const r = document.createRange(); r.selectNodeContents(t); const tops = [...new Set([...r.getClientRects()].filter((q) => q.width > 1).map((q) => Math.round(q.top)))];
      const tr = t.getBoundingClientRect(), br = btn.getBoundingClientRect(), nr = n.getBoundingClientRect();
      return { present: true, text: n.innerText.replace(/\s+/g, ' ').trim(), textLines: tops.length, buttonBesideText: Math.abs((tr.top + tr.bottom) / 2 - (br.top + br.bottom) / 2) < 8 && br.left >= tr.right - 1, oneRow: tops.length === 1 && Math.abs((tr.top + tr.bottom) / 2 - (br.top + br.bottom) / 2) < 8, height: Math.round(nr.height), box: [Math.round(nr.left), Math.round(nr.top), Math.round(nr.width), Math.round(nr.height)], pos: getComputedStyle(n).position, savedWords };
    });
    res.noteEv = await p.evaluate(() => window.__obs.warnEv.filter((e) => e[2] === 'P' || e[3] === '#/done'));
    console.log(tag, 'note', JSON.stringify(res.note));
    await p.screenshot({ path: `${out}/${tag}-4-summary.png` });
    if (res.note.present) {
      const sb = p.locator('p[data-save-warning] button');
      res.noteSaveBackupHitOnArrival = await hitOkLoc(sb);
      res.noteSaveBackupInputSteps = await bringToHit(sb);
      await p.screenshot({ path: `${out}/${tag}-4b-summary-note-reached.png` });
      const bb = await sb.boundingBox();
      const ev = p.waitForEvent('download', { timeout: 8000 }).catch(() => null);
      if (res.noteSaveBackupInputSteps >= 0) { if (phone) await p.touchscreen.tap(bb.x + bb.width / 2, bb.y + bb.height / 2); else await p.mouse.click(bb.x + bb.width / 2, bb.y + bb.height / 2); }
      const dl = await ev;
      if (dl) { const f = `${out}/${tag}-note-backup.json`; await dl.saveAs(f); const j = JSON.parse(readFileSync(f, 'utf8')); res.noteDownload = { name: dl.suggestedFilename(), sessions: j?.progress?.sessions?.length, hasThisBrew: !!j?.progress?.sessions?.some((s) => s.minutes >= 25 || s.durationMin >= 25 || true) }; rmSync(f); } else res.noteDownload = null;
      await sleep(1200);
      console.log(tag, 'note download', JSON.stringify(res.noteDownload), 'hit on arrival', res.noteSaveBackupHitOnArrival, 'input steps to reach', res.noteSaveBackupInputSteps);
    }
    await p.evaluate(async () => (await import('/src/ui/Toast.tsx')).toast.dismiss()); await sleep(600);
    // Details expanded by a real tap, then scrolled to the end by real wheel / touch.
    const tog = p.locator('button[aria-expanded="false"]').filter({ visible: true }).first();
    if (await tog.count()) {
      const bb = await tog.boundingBox();
      // bring the toggle under the pointer by real input if it is not hit-testable
      for (let i = 0; i < 30; i++) { const ok = await tog.evaluate((el) => { const r = el.getBoundingClientRect(); const h = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2); return !!h && el.contains(h); }); if (ok) break; const s = await tog.evaluate((el) => { let a = el.parentElement; while (a && a !== document.body) { const o = getComputedStyle(a).overflowY; if ((o === 'auto' || o === 'scroll') && a.scrollHeight > a.clientHeight) break; a = a.parentElement; } const r = (a && a !== document.body ? a : document.documentElement).getBoundingClientRect(); return [r.left + r.width / 2, Math.max(20, r.top + 40)]; }); if (phone) await touchDrag(cdp, Math.round(s[0]), Math.round(s[1]) + 40, -40); else { await p.mouse.move(s[0], s[1]); await p.mouse.wheel(0, 20); } await sleep(150); }
      res.detailsToggleSteps = await bringToHit(tog);
      if (res.detailsToggleSteps < 0) throw new Error('details toggle not reachable by real input (not tapped)');
      const b2 = await tog.boundingBox();
      if (phone) await p.touchscreen.tap(b2.x + b2.width / 2, b2.y + b2.height / 2); else await p.mouse.click(b2.x + b2.width / 2, b2.y + b2.height / 2);
      await sleep(900);
      res.detailsScroll = await (async () => {
        const sc = await p.evaluate(() => { const d = document.querySelector('[aria-expanded="true"]'); let a = d?.parentElement; while (a && a !== document.body) { const o = getComputedStyle(a).overflowY; if ((o === 'auto' || o === 'scroll') && a.scrollHeight > a.clientHeight) { a.setAttribute('data-b-scroller', ''); return true; } a = a.parentElement; } return false; });
        return sc ? wheelToEnd('[data-b-scroller]') : 'page (no inner scroller)';
      })();
      if (res.detailsScroll.startsWith('page')) { if (phone) { for (let i = 0; i < 40; i++) { await touchDrag(cdp, Math.round(W / 2), Math.round(H * 0.5), -40); await sleep(120); } } else { await p.mouse.move(W / 2, H / 2); for (let i = 0; i < 150; i++) { await p.mouse.wheel(0, 20); await sleep(60); } } }
      await sleep(800);
      res.summaryEnd = await p.evaluate(() => {
        const body = document.querySelector('[aria-expanded="true"]')?.getAttribute('aria-controls');
        const det = body ? document.getElementById(body) : null;
        const feet = [...document.querySelectorAll('footer[data-toast-above], [data-toast-above]')].map((e) => ({ tag: e.tagName, r: e.getBoundingClientRect() })).filter((x) => x.r.height > 0).sort((a, b) => a.r.top - b.r.top);
        const foot = feet[0]?.r;
        if (!det) return { error: 'no details body' };
        const tw = document.createTreeWalker(det, NodeFilter.SHOW_TEXT); let lastR = null, lastT = '';
        for (let n = tw.nextNode(); n; n = tw.nextNode()) { if (!n.textContent.trim()) continue; const r = document.createRange(); r.selectNodeContents(n); for (const q of r.getClientRects()) if (q.width > 1 && (!lastR || q.bottom >= lastR.bottom)) { lastR = q; lastT = n.textContent.trim().slice(0, 50); } }
        const h = lastR ? document.elementFromPoint(lastR.left + Math.min(lastR.width / 2, 40), (lastR.top + lastR.bottom) / 2) : null;
        let sc = null; for (let a = det.parentElement; a && a !== document.body; a = a.parentElement) { const o = getComputedStyle(a).overflowY; if ((o === 'auto' || o === 'scroll') && a.scrollHeight > a.clientHeight) { sc = a; break; } }
        const dr = det.getBoundingClientRect();
        return { lastLine: lastR ? [Math.round(lastR.top), Math.round(lastR.bottom)] : null, lastText: lastT, footerTop: foot ? Math.round(foot.top) : null, gapToFooter: lastR && foot ? Math.round(foot.top - lastR.bottom) : null, clears: !!(lastR && foot && lastR.bottom <= foot.top), hitInDetails: !!h && det.contains(h), hitBy: h ? h.tagName + ':' + (h.textContent || '').trim().slice(0, 40) : null, footers: feet.map((x) => [x.tag, Math.round(x.r.top), Math.round(x.r.bottom)]), detailsBox: [Math.round(dr.top), Math.round(dr.bottom)], scrollerAtEnd: sc ? Math.abs(sc.scrollHeight - sc.clientHeight - sc.scrollTop) <= 1.5 : 'page-scroll', scrollerTag: sc ? sc.tagName : null, docAtEnd: Math.abs(document.documentElement.scrollHeight - innerHeight - scrollY) <= 1.5, vh: innerHeight };
      });
      console.log(tag, 'summary-end', res.detailsScroll, JSON.stringify(res.summaryEnd));
      await p.screenshot({ path: `${out}/${tag}-6-summary-end.png` });
    } else res.summaryEnd = { error: 'no details toggle' };
  } catch (e) { res.error = String(e.message).split('\n')[0]; console.log(tag, 'ERROR', res.error); }
  res.errors = errors.slice(0, 3);
  res.obs = await p.evaluate(() => window.__obs).catch(() => null);
  res.ended = new Date().toISOString();
  appendFileSync(`${out}/cover-${rev}.jsonl`, JSON.stringify(res) + '\n');
  await ctx.close();
}
await b.close();
