// Lane T copy of LEAD-2's t-lead.mjs (sha256 99f2991e…, /home/user/wt/w3-base/kettle/.tmp/LEAD2/t-lead.mjs).
// Sampler, protected set, 9-point test, wheelInto, End flow and end-scrolled steps are the lead's, unchanged.
// Lane T changes:
//  1. end-scrolled: after Mark done, Undo is polled (<= 4 s) and tapped ~0.4 s after it is found (the lead's
//     version tapped after 8 s, past the notice's 5 s Undo); sampling then continues 6 s.
//  2. flow "today" --pos 0|end --when up|gone: Mark done tapped at scroll 0 or after a real wheel to the page end,
//     with End's notices up (tap 0.6 s after Today arrives) or after all notices have gone. Not tapped if Mark done
//     is not wholly on top at tap time (recorded as N/A).
//  3. history --pos last|mid: Undo polled and tapped promptly; Edit row re-tapped up to 3x if the sheet does not open.
//  4. flow "import": Settings > Your data > Import a backup (real tap, file chooser) of an exported backup with 3 brews
//     removed beforehand (debug API setup); confirm by real tap; Undo tapped promptly.
//  5. summary: two notices raised at the finish; frames at 300/800/1500/2500/4000 ms of the arrival.
//  6. --inset t,r,b,l: CDP Emulation.setSafeAreaInsetsOverride; summary prints min notice top / outside-viewport count.
// LEAD-2 probe for Maker T (W2R2): the decisive checks B, E2 and invariant 1, control vs fix, real input.
//   node t-lead.mjs --base http://127.0.0.1:5444 --side fix --cfg 390x844@2:light:200 --flow end-scrolled --out f.json
// flows: end-scrolled (End -> Today, wheel Mark done into view, sample; then tap Mark done, sample, tap Undo),
//        history (Stats scrolled to a brew -> Edit -> Delete -> confirm; sample; tap Undo),
//        summary (finish a brew -> summary; raise two notices; sample; list zones)
import { chromium } from 'playwright';
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

const args = Object.fromEntries(process.argv.slice(2).reduce((a, x, i, all) => (x.startsWith('--') && a.push([x.slice(2), all[i + 1]]), a), []));
const m = args.cfg.match(/^(\d+)x(\d+)@(\d+):(light|dark):(\d+)$/);
const [W, H, DPR, theme, text] = [+m[1], +m[2], +m[3], m[4], +m[5]];
const FIXED = Date.parse('2026-10-11T07:40:00.000Z');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const b = await chromium.launch({ args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader', '--ignore-gpu-blocklist'] });
const mobile = W < 900;
const ctx = await b.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: DPR, isMobile: mobile && W < H, hasTouch: mobile, colorScheme: theme, timezoneId: 'UTC', locale: 'en-GB', serviceWorkers: 'block' });
if (text !== 100) await ctx.addInitScript((pct) => addEventListener('DOMContentLoaded', () => { const s = document.createElement('style'); s.textContent = `html{font-size:${pct}%!important}`; document.head.appendChild(s); }), text);
await ctx.addInitScript(() => {
  // The brief's protected set: anything tapped or typed into, plus marked live text and the storage banner.
  const PROT = 'button, a[href], input, select, textarea, summary, [role="button"], [role="link"], [role="radio"], [role="checkbox"], [role="switch"], [role="tab"], [role="slider"], [role="option"], [role="menuitem"], [tabindex]:not([tabindex="-1"]), [data-notice-avoid], [data-save-warning]';
  const w = window;
  w.__L = { rows: [], on: false };
  const label = (e) => (e.getAttribute('aria-label') || e.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 40);
  const notices = () => {
    // Both builds: the notices are the <li>s of the region labelled "Notifications" (base: a live <ol>; fix: a group).
    const reg = document.querySelector('[aria-label="Notifications"]');
    return { reg, lis: [...(reg?.querySelectorAll('li') ?? [])].filter((li) => { const r = li.getBoundingClientRect(); return r.width > 0 && r.height > 0 && +getComputedStyle(li).opacity > 0.05 && !li.closest('[aria-hidden="true"]'); }) };
  };
  const visibleBox = (el) => {
    const q = el.getBoundingClientRect();
    const r = { l: q.left, t: q.top, r: q.right, b: q.bottom };
    if (getComputedStyle(el).position !== 'fixed')
      for (let e = el.parentElement; e && e !== document.body && e !== document.documentElement; e = e.parentElement) {
        const cs = getComputedStyle(e);
        if (cs.overflowX === 'visible' && cs.overflowY === 'visible') continue;
        const c = e.getBoundingClientRect();
        r.t = Math.max(r.t, c.top); r.b = Math.min(r.b, c.bottom); r.l = Math.max(r.l, c.left); r.r = Math.min(r.r, c.right);
      }
    return r;
  };
  w.__Lsample = (tag) => {
    const { reg, lis } = notices();
    const hits = [];
    for (const li of lis) {
      const t = li.getBoundingClientRect();
      for (const el of document.querySelectorAll(PROT)) {
        if (reg.contains(el) || el.closest('[inert]') || el.closest('[aria-hidden="true"]')) continue;
        const r = visibleBox(el);
        if (r.r - r.l <= 0 || r.b - r.t <= 0 || r.b <= 0 || r.t >= innerHeight) continue;
        if (r.r > t.left && r.l < t.right && r.b > t.top && r.t < t.bottom) hits.push({ n: li.textContent.slice(0, 24), el: label(el) || el.tagName, box: [r.l, r.t, r.r - r.l, r.b - r.t].map(Math.round) });
      }
    }
    // Every action of every drawn notice: size and 9-point hit test.
    const actions = lis.flatMap((li) => [...li.querySelectorAll('button')].map((a) => {
      const r = a.getBoundingClientRect();
      const pts = [[.5, .5], [.15, .2], [.85, .2], [.15, .8], [.85, .8], [.5, .2], [.5, .8], [.15, .5], [.85, .5]];
      const on = pts.filter(([x, y]) => { const h = document.elementFromPoint(r.left + r.width * x, r.top + r.height * y); return h && (h === a || a.contains(h)); }).length;
      return { label: a.textContent.trim(), w: Math.round(r.width), h: Math.round(r.height), on };
    }));
    const zones = [...document.querySelectorAll('[data-notice-zone]')].map((z) => { const r = z.getBoundingClientRect(); return { rank: z.dataset.noticeZone, align: z.dataset.noticeAlign ?? null, leaving: !!z.closest('[data-route-leaving]'), box: [r.left, r.top, r.width, r.height].map(Math.round) }; });
    const row = { tag, t: Math.round(performance.now()), hash: location.hash, scroll: Math.round(document.scrollingElement.scrollTop), dialog: !!document.querySelector('[role="dialog"]'), inert: !!document.getElementById('root')?.hasAttribute('inert'), notices: lis.map((li) => { const r = li.getBoundingClientRect(); return { text: li.textContent.replace(/\s+/g, ' ').trim().slice(0, 60), box: [r.left, r.top, r.width, r.height].map(Math.round), whole: li.scrollHeight <= li.clientHeight + 1 }; }), waitingInDom: document.querySelectorAll('[aria-hidden="true"] li[data-id]').length, hits, actions, zones, region: reg ? [...Object.values(reg.getBoundingClientRect().toJSON())].slice(0, 4).map(Math.round) : null };
    w.__L.rows.push(row);
    return row;
  };
  w.__Lstart = (tag) => { w.__L.on = true; let last = 0; const loop = (ts) => { if (!w.__L.on) return; if (ts - last >= 100) { last = ts; w.__Lsample(tag()); } requestAnimationFrame(loop); }; requestAnimationFrame(loop); };
  w.__Lstop = () => { w.__L.on = false; };
});
const p = await ctx.newPage();
await p.clock.install({ time: FIXED });
await p.clock.resume();
const errors = [];
p.on('pageerror', (e) => errors.push(e.message.slice(0, 200)));
const out = { side: args.side, base: args.base, cfg: args.cfg, flow: args.flow, steps: [] };
const step = (s) => { out.steps.push({ t: Date.now(), ...s }); };
const ready = () => p.waitForFunction(() => { const t = window.__kettle?.timerInfo?.(); return !!(t && t.leader && t.leaderForMs > 400 && !t.settling); }, null, { timeout: 60_000 }).catch(() => {});
const settings = (s) => p.evaluate((x) => window.__kettle.settings.getState().set(x), s);
const tapAt = async (bx) => { const [x, y] = [bx.x + bx.width / 2, bx.y + bx.height / 2]; if (mobile) await p.touchscreen.tap(x, y); else await p.mouse.click(x, y); };
let phase = 'start';
const setPhase = async (ph) => { phase = ph; await p.evaluate((x) => { window.__Lphase = x; }, ph); };
// Wheel the page (or the element under the pointer) until the locator's box is wholly in the viewport.
async function wheelInto(loc) {
  await p.mouse.move(W / 2, H / 2);
  for (let i = 0; i < 60; i++) {
    const bx = await loc.boundingBox().catch(() => null);
    if (bx && bx.y >= 0 && bx.y + bx.height <= H - 4) {
      const onTop = await loc.evaluate((el) => { const r = el.getBoundingClientRect(); const h = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2); return !!h && (h === el || el.contains(h)); }).catch(() => false);
      if (onTop) return bx;
    }
    await p.mouse.wheel(0, bx && bx.y < 0 ? -80 : 80);
    await sleep(120);
  }
  return loc.boundingBox();
}
const startRec = () => p.evaluate(() => window.__Lstart(() => window.__Lphase ?? ''));
const stopRec = () => p.evaluate(() => window.__Lstop());
const raise = (msgs) => p.evaluate(async (ms) => { const toast = window.__kettle.toast ?? (await import('/src/ui/Toast.tsx')).toast; for (const x of ms) toast(x, { tone: 'success', duration: 8000 }); }, msgs);

// ---- Lane T additions (see header of lt.mjs) ----
const H_ = H, W_ = W;
let insetInfo = null;
if (args.inset) {
  const [t, r, bo, l] = args.inset.split(',').map(Number);
  try {
    const cdp = await ctx.newCDPSession(p);
    await cdp.send('Emulation.setSafeAreaInsetsOverride', { insets: { top: t, right: r, bottom: bo, left: l } });
    insetInfo = { requested: { t, r, bo, l }, cdp: 'ok' };
  } catch (e) { insetInfo = { requested: args.inset, cdp: 'error: ' + e.message.slice(0, 200) }; }
}
// Box of the named action button inside a DRAWN notice whose text matches re (drawn = same filter as the sampler).
const findAction = (reSrc, label) => p.evaluate(([rs, lb]) => {
  const reg = document.querySelector('[aria-label="Notifications"]');
  const re = new RegExp(rs);
  for (const li of reg?.querySelectorAll('li') ?? []) {
    const r = li.getBoundingClientRect();
    if (!(r.width > 0 && r.height > 0 && +getComputedStyle(li).opacity > 0.05 && !li.closest('[aria-hidden="true"]'))) continue;
    if (!re.test(li.textContent)) continue;
    const b = [...li.querySelectorAll('button')].find((x) => x.textContent.trim() === lb);
    if (!b) continue;
    const q = b.getBoundingClientRect();
    return { x: q.left, y: q.top, width: q.width, height: q.height, t: performance.now() };
  }
  return null;
}, [reSrc, label]);
const pollAction = async (reSrc, label, ms) => { const t0 = Date.now(); while (Date.now() - t0 < ms) { const b = await findAction(reSrc, label); if (b) return b; await sleep(40); } return null; };
const drawnCount = () => p.evaluate(() => window.__Lsample('probe-check').notices.length);
const navInfo = () => p.evaluate(() => { const n = document.querySelector('nav[aria-label="Main"]')?.getBoundingClientRect(); return n ? { top: Math.round(n.top), h: Math.round(n.height) } : null; });
const zoneCount = () => p.evaluate(() => document.querySelectorAll('[data-notice-zone]').length);
const firstWith = (rows, tag, re) => rows.find((r) => r.tag === tag && r.notices.some((n) => re.test(n.text)) && r.actions.some((a) => a.label === 'Undo'));

try {
  const seed = ['history', 'summary', 'import'].includes(args.flow) ? 'veteran' : 'newbie';
  await p.goto(`${args.base}/?debug&seed=${seed}&theme=${theme}#/`);
  await ready();
  await settings({ muted: true, autoStartBreaks: false, autoStartFocus: false });
  await p.evaluate(() => document.fonts.ready);
  await sleep(600);
  out.inset = insetInfo;
  out.safeProbe = await p.evaluate(() => { const d = document.createElement('div'); d.style.cssText = 'position:fixed;top:env(safe-area-inset-top);left:env(safe-area-inset-left);right:env(safe-area-inset-right);bottom:env(safe-area-inset-bottom);visibility:hidden;pointer-events:none'; document.body.appendChild(d); const r = d.getBoundingClientRect(); d.remove(); return { top: r.top, left: r.left, right: innerWidth - r.right, bottom: innerHeight - r.bottom }; });
  if (args.flow === 'end-scrolled' || args.flow === 'today') {
    const field = p.getByRole('textbox', { name: /What are you brewing/ });
    // Setup: typing the task (LT: if the real click on the field cannot land in 5 s, focus it and type; recorded).
    await field.click({ timeout: 5000 }).catch(async (e) => { out.fieldClickFallback = e.message.split('\n').slice(0, 6).join(' | ').slice(0, 600); await field.scrollIntoViewIfNeeded().catch(() => {}); await field.focus(); });
    await p.keyboard.type('Chapter 3 notes'); await p.keyboard.press('Escape').catch(() => {});
    const start = p.getByRole('button', { name: /^Put the kettle on/ }).first();
    await start.scrollIntoViewIfNeeded(); await tapAt(await start.boundingBox());
    await p.waitForFunction(() => location.hash === '#/focus', null, { timeout: 15_000 }); await sleep(1500);
    await p.evaluate(() => window.__kettle.ff(3 * 60_000)); await sleep(600);
    const endBtn = p.getByRole('button', { name: 'End session' }).first();
    await tapAt(await endBtn.boundingBox());
    const dlg = p.getByRole('dialog', { name: /Leave the kettle early/ });
    await dlg.waitFor(); await sleep(900);
    await setPhase('after-End');
    await startRec();
    const endIn = dlg.getByRole('button', { name: 'End session' });
    await endIn.scrollIntoViewIfNeeded();
    let eb = null;
    for (let i = 0; i < 40; i++) { const b1 = await endIn.boundingBox(); await sleep(150); const b2 = await endIn.boundingBox(); if (b1 && b2 && Math.abs(b1.y - b2.y) < 0.5) { eb = b2; break; } }
    await tapAt(eb);
    step({ e: 'End session tapped', box: eb });
    await p.waitForFunction(() => location.hash === '#/', null, { timeout: 15_000 });
    const tArrive = Date.now();
    const md = p.getByRole('button', { name: /^Mark “Chapter 3 notes” done/ });
    const mdOnTop = () => md.evaluate((el) => { const r = el.getBoundingClientRect(); const pts = [[.5, .5], [.2, .5], [.8, .5]]; return { box: [r.left, r.top, r.width, r.height].map(Math.round), onTop: pts.every(([x, y]) => { const h = document.elementFromPoint(r.left + r.width * x, r.top + r.height * y); return !!h && (h === el || el.contains(h)); }), inView: r.top >= 0 && r.bottom <= innerHeight, scroll: Math.round(document.scrollingElement.scrollTop), maxScroll: document.scrollingElement.scrollHeight - innerHeight }; }).catch((e) => ({ err: e.message.slice(0, 80) }));
    if (args.flow === 'end-scrolled') {
      await sleep(300);
      await setPhase('scrolling');
      const mdBox = await wheelInto(md);
      step({ e: 'Mark done in view', box: mdBox });
      await setPhase('scrolled');
      await sleep(Number(args.hold ?? 6000));
    } else {
      // --when gone: End's notices are drawn (at scroll 0) and run out BEFORE the person scrolls to the position.
      if (args.when !== 'up') { const t1 = Date.now(); while (Date.now() - t1 < 5000 && !(await drawnCount())) await sleep(100); const t0 = Date.now(); while (Date.now() - t0 < 30_000) { const n = await drawnCount(); const waiting = await p.evaluate(() => document.querySelectorAll('[aria-hidden="true"] li[data-id]').length); if (!n && !waiting) break; await sleep(200); } await sleep(500); }
      await setPhase('to-position');
      if (args.pos === 'end') {
        // Real wheel to the page's end (large steps so End's notices are still up for --when up).
        await p.mouse.move(W / 2, H / 2);
        // Wheel to the end; repeat until the page has scrolled and its scroll position held still (a wheel sent while
        // Today is still entering can land late, under the next tap).
        for (let i = 0; i < 8; i++) { await p.mouse.wheel(0, 4000); let a = -1, b2 = -2; for (let k = 0; k < 10 && a !== b2; k++) { a = await p.evaluate(() => document.scrollingElement.scrollTop); await sleep(120); b2 = await p.evaluate(() => document.scrollingElement.scrollTop); } if (b2 > 0) break; await sleep(150); }
        out.maxScrollReached = await p.evaluate(() => Math.round(document.scrollingElement.scrollTop));
        let st = await mdOnTop();
        // Mark done not on top at the very end (scrolled above the viewport, or under the dock): one real wheel back
        // so its top sits ~70 px from the viewport top, then the lead's wheelInto if still needed.
        if (!st.onTop && st.box) { await p.mouse.wheel(0, st.box[1] - 70); let a = -1, b2 = -2; for (let k = 0; k < 10 && a !== b2; k++) { a = await p.evaluate(() => document.scrollingElement.scrollTop); await sleep(120); b2 = await p.evaluate(() => document.scrollingElement.scrollTop); } st = await mdOnTop(); out.endWheelBack = 'one step'; }
        if (!st.onTop) { await wheelInto(md); st = await mdOnTop(); out.endWheelBack = 'wheelInto'; }
      }
      if (args.when === 'up') { const wait = 600 - (Date.now() - tArrive); if (wait > 0) await sleep(wait); }

    }
    const atTap = await mdOnTop();
    atTap.noticesDrawn = await p.evaluate(() => window.__Lsample('at-tap').notices.map((n) => n.text.slice(0, 40)));
    atTap.msSinceArrive = Date.now() - tArrive;
    atTap.waiting = await p.evaluate(() => document.querySelectorAll('[aria-hidden="true"] li[data-id]').length);
    atTap.coveredBy = await md.evaluate((el) => { const r = el.getBoundingClientRect(); const h = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2); return h && !(h === el || el.contains(h)) ? ((h.closest('button,a,[role]')?.getAttribute('aria-label') || h.closest('button,a')?.textContent || h.className || h.tagName) + '').slice(0, 50) : null; }).catch(() => null);
    out.atTap = atTap;
    if (!atTap.onTop) {
      out.na = 'Mark done not wholly on top at tap time (not tapped): ' + JSON.stringify(atTap.box);
    } else {
      const bx = await md.boundingBox();
      await setPhase('after-MarkDone');
      const tTap = await p.evaluate(() => performance.now());
      await tapAt(bx);
      step({ e: 'Mark done tapped' });
      const ub = await pollAction('Crossed off', 'Undo', 4000);
      if (ub) {
        out.crossedPolledMs = Math.round(ub.t - tTap);
        await sleep(400);
        const ub2 = (await findAction('Crossed off', 'Undo')) ?? ub;
        await setPhase('after-Undo');
        await tapAt(ub2); await sleep(700);
        out.undo = { tapped: true, box: [ub2.x, ub2.y, ub2.width, ub2.height].map(Math.round), fieldValue: await field.inputValue().catch(() => null) };
      } else out.undo = { tapped: false, reason: 'no Undo drawn within 4 s of the tap' };
      await sleep(args.flow === 'end-scrolled' ? 6000 : 1500);
      const rows = await p.evaluate(() => window.__L.rows);
      const first = firstWith(rows, 'after-MarkDone', /Crossed off/);
      out.crossedFirstDrawnMs = first ? Math.round(first.t - tTap) : null;
      out.crossedFirst = first ? { box: first.notices.find((n) => /Crossed off/.test(n.text))?.box, undo: first.actions.find((a) => a.label === 'Undo'), scroll: first.scroll } : null;
    }
    await stopRec();
  } else if (args.flow === 'history') {
    await p.getByRole('link', { name: /^Stats/ }).first().click();
    await p.waitForFunction(() => location.hash === '#/stats');
    await sleep(1500);
    const rowsL = p.getByRole('button', { name: /leaves\. Edit$/ });
    const n = await rowsL.count();
    const idx = args.pos === 'mid' ? Math.floor(n / 2) : Math.max(0, n - 1);
    const target = rowsL.nth(idx);
    const name = await target.getAttribute('aria-label');
    await wheelInto(target);
    out.scrolledTo = await p.evaluate(() => Math.round(document.scrollingElement.scrollTop));
    out.rowsBefore = n; out.rowIndex = idx;
    const sheet = p.getByRole('dialog', { name: /Edit brew/ });
    for (let k = 0; k < 3; k++) { await tapAt(await target.boundingBox()); const ok = await sheet.waitFor({ timeout: 3000 }).then(() => true).catch(() => false); out.editTaps = k + 1; if (ok) break; await wheelInto(target); }
    await sleep(900);
    const del = sheet.getByRole('button', { name: /Delete this brew/ });
    await del.scrollIntoViewIfNeeded(); await tapAt(await del.boundingBox());
    const conf = p.getByRole('dialog', { name: /Delete this brew\?/ });
    await conf.waitFor(); await sleep(700);
    await setPhase('after-Delete');
    await startRec();
    const tTap = await p.evaluate(() => performance.now());
    await tapAt(await conf.getByRole('button', { name: /^Delete$/ }).boundingBox());
    step({ e: 'Delete confirmed', row: name });
    const ub = await pollAction('Brew deleted', 'Undo', 6000);
    out.rowsAfterDelete = await rowsL.count();
    out.nav = await navInfo(); out.zones = await zoneCount();
    if (ub) {
      out.deletedPolledMs = Math.round(ub.t - tTap);
      await sleep(400);
      const ub2 = (await findAction('Brew deleted', 'Undo')) ?? ub;
      await setPhase('after-Undo');
      await tapAt(ub2); await sleep(900);
      out.undo = { tapped: true, box: [ub2.x, ub2.y, ub2.width, ub2.height].map(Math.round), rowsAfter: await rowsL.count() };
    } else out.undo = { tapped: false, reason: 'no Undo drawn within 6 s', rowsAfter: await rowsL.count() };
    await sleep(1000);
    await stopRec();
    const rows = await p.evaluate(() => window.__L.rows);
    const dialogGone = rows.find((r) => r.tag === 'after-Delete' && !r.dialog && !r.inert);
    const first = firstWith(rows, 'after-Delete', /Brew deleted/);
    out.dialogGoneMs = dialogGone ? Math.round(dialogGone.t - tTap) : null;
    out.deletedFirstDrawnMs = first ? Math.round(first.t - tTap) : null;
    out.deletedFirst = first ? { box: first.notices.find((x) => /Brew deleted/.test(x.text))?.box, undo: first.actions.find((a) => a.label === 'Undo'), region: first.region, scroll: first.scroll } : null;
  } else if (args.flow === 'import') {
    // Setup (debug API only): a backup of this profile, then 3 brews removed, so "Add" brings 3 back.
    const backup = await p.evaluate(async () => (await import('/src/progress/index.ts')).exportData());
    const fpath = `/tmp/claude-0/lt-scratch/backup-${process.pid}.json`;
    // 3 brews given new ids in the file, so "Add" (merge) adds exactly 3 and Undo must take them away again.
    const doc = JSON.parse(backup);
    out.sessionsInBackup = doc.progress?.sessions?.length ?? null;
    doc.progress.sessions.slice(0, 3).forEach((x, i) => { x.id = `lt-import-${i}-${x.id}`; });
    writeFileSync(fpath, JSON.stringify(doc));
    out.sessionsBefore = await p.evaluate(() => window.__kettle.progress.getState().sessions.length);
    await p.getByRole('link', { name: /^Settings/ }).first().click();
    await p.waitForFunction(() => location.hash.includes('settings'));
    await sleep(1200);
    const imp = p.getByRole('button', { name: /Import a backup/ });
    await wheelInto(imp);
    out.scrolledTo = await p.evaluate(() => Math.round(document.scrollingElement.scrollTop));
    out.yourDataInView = await p.evaluate(() => { const h = [...document.querySelectorAll('h2,h3,p,div')].find((e) => e.textContent.trim() === 'Your data'); if (!h) return null; const r = h.getBoundingClientRect(); return { top: Math.round(r.top), inView: r.top >= 0 && r.bottom <= innerHeight }; });
    const [chooser] = await Promise.all([p.waitForEvent('filechooser', { timeout: 8000 }), tapAt(await imp.boundingBox())]);
    await chooser.setFiles(fpath);
    const sh = p.getByRole('dialog').first();
    await sh.waitFor(); await sleep(900);
    out.sheetTitle = await sh.getAttribute('aria-label').catch(() => null) ?? (await sh.locator('h2').first().textContent().catch(() => null));
    // Choose merge ("Add") if a mode switch exists; tap the confirm button.
    const addBtn = sh.getByRole('button', { name: /^(Add|Restore|Replace)$/ });
    const modeAdd = sh.getByRole('radio', { name: /Add|Merge/i });
    if (await modeAdd.count()) { await tapAt(await modeAdd.first().boundingBox()); await sleep(400); }
    let cb = addBtn.first();
    // LT: at 200 % the sheet re-renders/animates; retry, and fall back to the page-wide button of that name.
    for (let k = 0; k < 4; k++) { try { await sleep(400); if (!(await cb.count())) cb = p.getByRole('button', { name: /^(Add|Restore|Replace)$/ }).last(); await cb.scrollIntoViewIfNeeded({ timeout: 4000 }); break; } catch (e) { out.confirmRetry = (out.confirmRetry ?? 0) + 1; out.confirmErr = e.message.slice(0, 200); } }
    out.sheetButtons = await p.evaluate(() => [...document.querySelectorAll('[role="dialog"] button')].map((b) => b.textContent.trim().slice(0, 30)));
    out.confirmLabel = (await cb.textContent()).trim();
    await setPhase('after-Import');
    await startRec();
    const tTap = await p.evaluate(() => performance.now());
    await tapAt(await cb.boundingBox());
    const ub = await pollAction('Backup restored|Added|added', 'Undo', 6000);
    out.sessionsAfterImport = await p.evaluate(() => window.__kettle.progress.getState().sessions.length);
    out.nav = await navInfo(); out.zones = await zoneCount();
    if (ub) {
      out.importPolledMs = Math.round(ub.t - tTap);
      await sleep(400);
      const ub2 = (await findAction('Backup restored|Added|added', 'Undo')) ?? ub;
      await setPhase('after-Undo');
      await tapAt(ub2); await sleep(1200);
      out.undo = { tapped: true, box: [ub2.x, ub2.y, ub2.width, ub2.height].map(Math.round), sessionsAfter: await p.evaluate(() => window.__kettle.progress.getState().sessions.length), said: await p.evaluate(() => (window.__kettle.noticesSaid?.() ?? []).slice(-3)).catch(() => null) };
    } else out.undo = { tapped: false, reason: 'no Undo drawn within 6 s' };
    await sleep(800);
    await stopRec();
    const rows = await p.evaluate(() => window.__L.rows);
    const dialogGone = rows.find((r) => r.tag === 'after-Import' && !r.dialog && !r.inert);
    const first = firstWith(rows, 'after-Import', /Backup restored|Added|added/);
    out.dialogGoneMs = dialogGone ? Math.round(dialogGone.t - tTap) : null;
    out.importFirstDrawnMs = first ? Math.round(first.t - tTap) : null;
    out.importFirst = first ? { box: first.notices[0]?.box, undo: first.actions.find((a) => a.label === 'Undo'), region: first.region, scroll: first.scroll, text: first.notices.map((x) => x.text) } : null;
  } else if (args.flow === 'summary') {
    await p.evaluate((task) => window.__kettle.timer.getState().startFocus({ intention: task, tag: task ? 'study' : null }), (args.task ?? '').replace(/_/g, ' '));
    await p.waitForFunction(() => location.hash === '#/focus', null, { timeout: 15_000 }); await sleep(2000);
    const dir = args.out.replace(/\.json$/, '');
    mkdirSync(dir, { recursive: true });
    await setPhase('arrival');
    await startRec();
    // Whistle -> summary arrival with two notices raised at the finish (frames along the arrival).
    await p.evaluate(() => window.__kettle.finish());
    await raise(['Recipe done: Take a full tea break · +15 leaves', 'New badge: Steady Sipper']);
    const t0 = Date.now();
    for (const ms of [300, 800, 1500, 2500, 4000]) { const w = ms - (Date.now() - t0); if (w > 0) await sleep(w); await p.screenshot({ path: `${dir}/arrival-${ms}ms.png` }); }
    await sleep(500);
    await stopRec();
    out.hash = await p.evaluate(() => location.hash);
    // Chai's face and the kettle gauge: boxes of the stage art's named parts if the DOM names them.
    out.art = await p.evaluate(() => [...document.querySelectorAll('[data-part],[class*="gauge" i],[class*="chai" i],[class*="face" i],[class*="kettle" i] svg, svg [id*="gauge" i], svg [id*="face" i]')].slice(0, 30).map((e) => { const r = e.getBoundingClientRect(); return { sel: (e.getAttribute('data-part') || e.id || (typeof e.className === 'string' ? e.className : e.className?.baseVal) || e.tagName).toString().slice(0, 40), box: [r.left, r.top, r.width, r.height].map(Math.round) }; }).filter((x) => x.box[2] > 0));
    out.focusDom = await p.evaluate(() => { const v = document.querySelector('[data-focus-view]'); const sb = v?.querySelector('[data-notice-zone]'); return { view: v?.getAttribute('data-focus-view'), stageZoneInFocus: !!sb, stageZoneBox: sb ? Object.values(sb.getBoundingClientRect().toJSON()).slice(0, 4).map(Math.round) : null }; });
  }
  out.rows = await p.evaluate(() => window.__L.rows);
} catch (e) {
  out.error = e.message.slice(0, 400);
  try { out.rows = await p.evaluate(() => window.__L.rows); } catch {}
}
out.errors = errors;
mkdirSync(dirname(args.out), { recursive: true });
writeFileSync(args.out, JSON.stringify(out));
const rows = (out.rows ?? []).filter((r) => r.tag !== 'probe-check' && r.tag !== 'at-tap');
const byTag = {};
let minTop = null, outside = 0, hitRowsAll = 0, notWholeAll = 0, modalAll = 0;
for (const r of rows) {
  const k = r.tag; byTag[k] ??= { n: 0, withNotice: 0, hitRows: 0, notWhole: 0, modalDrawn: 0, hitEls: new Set(), texts: new Set() }; const s = byTag[k]; s.n++;
  if (r.notices.length) s.withNotice++; if (r.hits.length) { s.hitRows++; hitRowsAll++; r.hits.forEach((h) => s.hitEls.add(h.el)); }
  if (r.notices.some((x) => !x.whole)) { s.notWhole++; notWholeAll++; } if ((r.dialog || r.inert) && r.notices.length) { s.modalDrawn++; modalAll++; }
  r.notices.forEach((x) => { s.texts.add(x.text.slice(0, 30)); const [l, t, w, h] = x.box; if (minTop == null || t < minTop) minTop = t; if (t < 0 || l < 0 || l + w > W_ || t + h > H_) outside++; });
  if (r.notices.length && r.region) { const [x, y, w, h] = r.region; if (y < 0 || x < 0 || x + w > W_ || y + h > H_) s.regionOutside = (s.regionOutside ?? 0) + 1; }
}
for (const s of Object.values(byTag)) { s.hitEls = [...s.hitEls].slice(0, 8); s.texts = [...s.texts].slice(0, 5); }
console.log(JSON.stringify({ confirmRetry: out.confirmRetry, confirmErr: out.confirmErr, sheetButtons: out.sheetButtons, fieldClickFallback: out.fieldClickFallback, maxScrollReached: out.maxScrollReached, endWheelBack: out.endWheelBack, side: args.side, cfg: args.cfg, flow: args.flow, pos: args.pos, when: args.when, inset: out.inset, safeProbe: out.safeProbe, samples: rows.length, hitRowsAll, notWholeAll, modalAll, minNoticeTop: minTop, noticeOutsideViewport: outside, byTag, atTap: out.atTap, na: out.na, crossedFirstDrawnMs: out.crossedFirstDrawnMs, crossedPolledMs: out.crossedPolledMs, crossedFirst: out.crossedFirst, deletedFirstDrawnMs: out.deletedFirstDrawnMs, deletedFirst: out.deletedFirst, importFirstDrawnMs: out.importFirstDrawnMs, importFirst: out.importFirst, dialogGoneMs: out.dialogGoneMs, scrolledTo: out.scrolledTo, rowsBefore: out.rowsBefore, rowsAfterDelete: out.rowsAfterDelete, sessionsInBackup: out.sessionsInBackup, sessionsBefore: out.sessionsBefore, confirmLabel: out.confirmLabel, sessionsAfterImport: out.sessionsAfterImport, nav: out.nav, zones: out.zones, editTaps: out.editTaps, undo: out.undo, focusDom: out.focusDom, art: out.art?.slice(0, 12), error: out.error, errors: errors.slice(0, 2) }));
await b.close();
