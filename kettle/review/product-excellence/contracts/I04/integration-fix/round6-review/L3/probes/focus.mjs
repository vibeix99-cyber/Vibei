// L3 check 2: focus survives toasts expiring; live-region announcements.
// node focus.mjs --rev=R6|INT [--only=C1,C2,...]
import { REV, launch, newCtx, openNewbie, fillStorage, hash, toasts, warningUp, sleep, args, logger, OUT, startBtn, stamp, ready } from './lib.mjs';
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';
const a = args();
const rev = REV[a.rev ?? 'R6'];
const only = a.only ? a.only.split(',') : null;
const dir = `${OUT}/2`; mkdirSync(dir, { recursive: true });
const tag = rev.name + (only ? '-only-' + only.join('_') : '');
const log = logger(`${dir}/focus-${tag}.log`);
const results = {};
log(`RUN focus ${tag} url=${rev.dev} rev=${rev.name}@${rev.commit} start=${stamp()}`);
const b = await launch();
const WARN = 'toast-kettle:save-failed';

const FOCUS_SRC = `(() => {
  const R = (window.__fl = { ev: [], t0: performance.now(), ser: [], last: '' });
  const T = () => Math.round(performance.now() - R.t0);
  const d = (el) => !el || el === document.body ? 'body' : el.tagName.toLowerCase() + (el.id ? '#' + el.id : '') + ' "' + (el.getAttribute('aria-label') || el.textContent || el.value || '').trim().replace(/\\s+/g, ' ').slice(0, 28) + '"';
  document.addEventListener('focusin', (e) => R.ev.push([T(), 'focusin', d(e.target)]), true);
  document.addEventListener('focusout', (e) => R.ev.push([T(), 'focusout', d(e.target), 'to ' + d(e.relatedTarget)]), true);
  new MutationObserver((ms) => { for (const m of ms) { for (const x of m.addedNodes) if (x.tagName === 'LI') R.ev.push([T(), 'toast+', x.textContent.slice(0, 40)]); for (const x of m.removedNodes) if (x.tagName === 'LI') R.ev.push([T(), 'toast-', x.textContent.slice(0, 40)]); } }).observe(document.body, { childList: true, subtree: true });
  setInterval(() => { const s = d(document.activeElement) + '|' + [...document.querySelectorAll('[aria-label="Notifications"] li')].length; if (s !== R.last) { R.last = s; R.ser.push([T(), d(document.activeElement), document.querySelectorAll('[aria-label="Notifications"] li').length, !!document.getElementById('${WARN}')]); } }, 50);
  window.__fd = d;
})()`;

async function fresh(opts) {
  const ctx = await newCtx(b, opts);
  const page = await ctx.newPage();
  const errs = []; page.on('pageerror', (e) => errs.push(e.message));
  await openNewbie(page, rev.dev, {});
  return { ctx, page, errs };
}
const active = (page) => page.evaluate(() => window.__fd(document.activeElement));
const shot = (page, n) => page.screenshot({ path: `${dir}/${tag}-${n}.png` });
const waitWarning = (page, ms = 10000) => page.waitForSelector(`[id="${WARN}"]`, { timeout: ms }).then(() => true).catch(() => false);

// Put Today with "Kettle's off" (+ the warning when full) up, via a real brew start and a real End within the first minute.
async function todayAfterEnd(page, full) {
  await startBtn(page).click();
  await page.waitForFunction(() => location.hash === '#/focus'); await sleep(2200);
  await page.getByRole('button', { name: 'End session' }).click();
  const dlg = page.getByRole('dialog', { name: 'Leave the kettle early?' });
  await dlg.waitFor(); await sleep(400);
  await dlg.getByRole('button', { name: 'End session' }).click();
  await page.waitForFunction(() => location.hash === '#/' || location.hash === '', null, { timeout: 8000 });
  if (full) await waitWarning(page, 10000);
}

const S = {};
// C1: Settings, ordinary toast ("Saved ...") expiring while focus rests on the next control
S.C1_settings_ordinary = async () => {
  const { ctx, page } = await fresh({ w: 375, h: 667 });
  await page.evaluate(() => window.__kettle.navigate('/settings')); await sleep(800);
  await page.evaluate(FOCUS_SRC);
  const exp = page.getByRole('button', { name: /Export a backup/ });
  const [d] = await Promise.all([page.waitForEvent('download', { timeout: 8000 }).catch(() => null), exp.click()]);
  await page.waitForSelector('[aria-label="Notifications"] li', { timeout: 4000 });
  await page.keyboard.press('Tab'); // real key: focus moves to the next control
  const f0 = await active(page);
  const t0 = Date.now();
  await page.waitForFunction(() => document.querySelectorAll('[aria-label="Notifications"] li').length === 0, null, { timeout: 8000 });
  const expiredAfterMs = Date.now() - t0;
  await sleep(600);
  const f1 = await active(page);
  const ev = await page.evaluate(() => window.__fl.ev);
  await ctx.close(); return { focusBefore: f0, focusAfterExpiry: f1, unchanged: f0 === f1, toastExpiredMsAfterFocus: expiredAfterMs, events: ev };
};
// C2/C3: Today, typing in the text box while "Kettle's off" (and, when full, the 12 s warning) expire
async function todayType(full, text) {
  const { ctx, page } = await fresh({ w: 375, h: 667, text });
  if (full) await fillStorage(page);
  await page.evaluate(FOCUS_SRC);
  await todayAfterEnd(page, full);
  const box = page.getByRole('textbox', { name: /What are you brewing/ });
  await box.click(); await page.keyboard.type('abc', { delay: 60 });
  const f0 = await active(page);
  const t0 = Date.now();
  // wait for every toast to expire on its own timers (3.2 s, 12 s)
  await page.waitForFunction(() => document.querySelectorAll('[aria-label="Notifications"] li').length === 0, null, { timeout: 30_000 }).catch(() => {});
  const goneMs = Date.now() - t0;
  await page.keyboard.type('def', { delay: 60 });
  const f1 = await active(page);
  const val = await box.inputValue();
  const ev = await page.evaluate(() => window.__fl.ev);
  const ser = await page.evaluate(() => window.__fl.ser);
  await shot(page, `todayType-${full ? 'full' : 'ok'}-${text}`);
  await ctx.close(); return { full, text, focusBefore: f0, focusAfterAllToastsGone: f1, unchanged: f0 === f1, typedValue: val, toastsGoneMsAfterTyping: goneMs, focusLossEvents: ev.filter((e) => e[1] === 'focusout' && e[3] === 'to body'), events: ev, series: ser };
}
S.C2_today_ordinary = () => todayType(false, 100);
S.C3_today_warning_expires = () => todayType(true, 100);
S.C3b_today_warning_expires_200 = () => todayType(true, 200);

// C4: focus INSIDE the warning ("Save backup"), 375x667. 100% via Shift+Tab, 200% via Tab.
async function inToast(text, key) {
  const { ctx, page } = await fresh({ w: 375, h: 667, text });
  await fillStorage(page);
  await page.evaluate(FOCUS_SRC);
  await todayAfterEnd(page, true); await sleep(600);
  let reached = null;
  for (let i = 1; i <= 40; i++) {
    await page.keyboard.press(key); await sleep(450);
    const f = await active(page);
    if (/Save backup/.test(f)) { reached = i; break; }
  }
  const out = { text, key, reached };
  if (!reached) { out.note = 'not reached in 40 presses'; await shot(page, `inToast-${text}-${key.replace('+', '')}-notreached`); out.events = await page.evaluate(() => window.__fl.ev); await ctx.close(); return out; }
  await shot(page, `inToast-${text}-${key.replace('+', '')}-focused`);
  // while focus is inside, the toast's own timer is paused: sample 16 s
  const t0 = Date.now(); const ser1 = [];
  while (Date.now() - t0 < 16_000) { ser1.push([Date.now() - t0, await warningUp(page), await active(page)]); await sleep(400); }
  out.whileFocusedWarningUpSamples = ser1.filter((x) => x[1]).length + '/' + ser1.length;
  out.focusDuring = [...new Set(ser1.map((x) => x[2]))];
  // leave the toast with a real Tab (timer resumes) and watch it expire on its own
  await page.keyboard.press(key === 'Tab' ? 'Tab' : 'Shift+Tab');
  const f1 = await active(page); out.focusAfterLeaving = f1;
  const t1 = Date.now(); const ser2 = [];
  while (Date.now() - t1 < 15_000) { ser2.push([Date.now() - t1, await warningUp(page), await active(page)]); await sleep(400); if (!ser2.at(-1)[1] && ser2.length > 3) break; }
  out.warningGoneAfterLeavingMs = ser2.find((x) => !x[1])?.[0] ?? null;
  out.focusAfterExpiry = await active(page);
  out.focusUnchangedAcrossExpiry = out.focusAfterExpiry === f1;
  out.events = await page.evaluate(() => window.__fl.ev);
  await ctx.close(); return out;
}
S.C4_in_toast_200_tab = () => inToast(200, 'Tab');
S.C4_in_toast_100_shifttab = () => inToast(100, 'Shift+Tab');
// C5: Enter on "Save backup": where does focus go?
async function enterSave(text, key) {
  const { ctx, page } = await fresh({ w: 375, h: 667, text });
  await fillStorage(page);
  await page.evaluate(FOCUS_SRC);
  await todayAfterEnd(page, true); await sleep(600);
  let reached = null;
  for (let i = 1; i <= 40; i++) { await page.keyboard.press(key); await sleep(450); if (/Save backup/.test(await active(page))) { reached = i; break; } }
  const out = { text, key, reached };
  if (reached) {
    const dl = page.waitForEvent('download', { timeout: 8000 }).catch(() => null);
    await page.keyboard.press('Enter');
    const d = await dl; out.download = d ? d.suggestedFilename() : null;
    await sleep(1500);
    out.focusAfterEnter = await active(page);
    out.toastsAfter = await toasts(page);
    await page.keyboard.press('Tab'); await sleep(300);
    out.focusAfterNextTab = await active(page);
  }
  out.events = await page.evaluate(() => window.__fl.ev);
  await ctx.close(); return out;
}
S.C5_enter_200 = () => enterSave(200, 'Tab');

// C6: focus INSIDE the warning when M1's rule takes it away (a real wheel scroll of the page moves the docked start): where does focus go?
S.C6_withdrawn_with_focus_inside = async () => {
  const { ctx, page } = await fresh({ w: 375, h: 667, text: 100 });
  await fillStorage(page);
  await page.evaluate(FOCUS_SRC);
  await todayAfterEnd(page, true); await sleep(600);
  let reached = null;
  for (let i = 1; i <= 20; i++) { await page.keyboard.press('Shift+Tab'); await sleep(450); if (/Save backup/.test(await active(page))) { reached = i; break; } }
  const out = { reached };
  if (!reached) { await ctx.close(); return out; }
  const t0 = await page.evaluate(() => window.__fl.ev.length);
  await page.mouse.move(187, 200);
  const rows = [];
  for (let i = 0; i < 8; i++) {
    await page.mouse.wheel(0, 100); await sleep(400);
    rows.push({ scrollY: await page.evaluate(() => Math.round(scrollY)), warn: await warningUp(page), focus: await active(page) });
  }
  out.rows = rows;
  out.eventsAfterFocus = (await page.evaluate(() => window.__fl.ev)).slice(t0);
  await shot(page, 'C6-after-wheel');
  await ctx.close(); return out;
};

// F3: live-region announcements while the warning is up and the app re-renders
const LIVE_SRC = `(() => {
  const R = (window.__lv = { ev: [], t0: performance.now(), regions: new Map() });
  const T = () => Math.round(performance.now() - R.t0);
  const liveOf = (n) => { for (let e = n.nodeType === 1 ? n : n.parentElement; e; e = e.parentElement) { if (e.matches && e.matches('[aria-live]:not([aria-live="off"]), [role="status"], [role="alert"], [role="log"]')) return e; } return null; };
  const key = (e) => (e.getAttribute('aria-label') || e.getAttribute('role') || 'live') + '[' + (e.getAttribute('aria-live') || e.getAttribute('role')) + ']';
  new MutationObserver((ms) => { for (const m of ms) {
    const rg = liveOf(m.target); if (!rg) continue;
    if (m.type === 'childList') { for (const x of m.addedNodes) { const tx = (x.textContent || '').trim(); if (tx) R.ev.push([T(), key(rg), 'added', tx.slice(0, 50)]); } for (const x of m.removedNodes) { const tx = (x.textContent || '').trim(); if (tx) R.ev.push([T(), key(rg), 'removed', tx.slice(0, 50)]); } }
    else if (m.type === 'characterData') R.ev.push([T(), key(rg), 'text', (m.target.textContent || '').slice(0, 50)]);
  } }).observe(document, { childList: true, subtree: true, characterData: true });
  // the timer region's own re-renders (for context): count text changes of any role=timer
  R.tick = 0; new MutationObserver((ms) => { R.tick += ms.length; }).observe(document, { subtree: true, characterData: true, childList: true });
})()`;
async function liveRun(label, w, h, text, scenario) {
  const { ctx, page } = await fresh({ w, h, text });
  await fillStorage(page);
  await page.evaluate(LIVE_SRC);
  const info = {};
  await scenario(page, info);
  const total = await page.evaluate(() => ({ ev: window.__lv.ev, tick: window.__lv.tick }));
  const notif = total.ev.filter((e) => /Notifications/.test(e[1]));
  info.label = label;
  info.notificationsAdded = notif.filter((e) => e[2] === 'added').length;
  info.notificationsAddedWarning = notif.filter((e) => e[2] === 'added' && /storage is full|couldn.t save/i.test(e[3])).length;
  info.notificationsText = notif.filter((e) => e[2] === 'text').length;
  info.otherLiveEvents = total.ev.filter((e) => !/Notifications/.test(e[1])).length;
  info.allDomMutationsDuringRun = total.tick;
  info.liveEvents = total.ev;
  await ctx.close(); return info;
}
// desktop: a brew running (countdown re-rendering every second) with the warning up beside the panel; 15 s from first sight
S.F3a_desktop_brew = () => liveRun('desktop 1440x900 brew running, warning up', 1440, 900, 100, async (page, info) => {
  await startBtn(page).click();
  const seen = await waitWarning(page, 8000); info.warningSeen = seen;
  const t0 = Date.now();
  await page.evaluate(() => { window.__lv.mark = performance.now() - window.__lv.t0; });
  await sleep(15_000);
  info.windowMs = Date.now() - t0;
  info.warningUpAt15s = await warningUp(page);
  info.countdownTexts = await page.evaluate(() => [...document.querySelectorAll('main [role="timer"]')].map((t) => t.textContent.trim().replace(/\s+/g, ' ').slice(0, 40)));
  await shot(page, 'F3a-desktop');
});
// desktop 200% text: same
S.F3a2_desktop_brew_200 = () => liveRun('desktop 1440x900 @200% brew running, warning up', 1440, 900, 200, async (page, info) => {
  await startBtn(page).click();
  info.warningSeen = await waitWarning(page, 8000);
  const t0 = Date.now(); await sleep(15_000); info.windowMs = Date.now() - t0; info.warningUpAt15s = await warningUp(page);
  await shot(page, 'F3a2-desktop-200');
});
// phone Today with the warning (idle re-renders), 15 s from first sight
S.F3b_phone_today = () => liveRun('phone 375x667 Today with warning', 375, 667, 100, async (page, info) => {
  await todayAfterEnd(page, true);
  info.warningSeen = await warningUp(page);
  const t0 = Date.now(); await sleep(15_000); info.windowMs = Date.now() - t0; info.warningUpAt15s = await warningUp(page);
});
// phone: a brew running with the warning HELD (re-render each second) and then released at the summary; 15 s
S.F3c_phone_brew = () => liveRun('phone 375x667 brew running, warning held', 375, 667, 100, async (page, info) => {
  await startBtn(page).click();
  await sleep(1500);
  const t0 = Date.now(); await sleep(15_000); info.windowMs = Date.now() - t0; info.warningUpAt15s = await warningUp(page);
});
// phone 100%: Tab cycle across the warning (hold / re-show) for 15 s
S.F3d_phone_tab_cycle = () => liveRun('phone 375x667 Today, Tab cycle (warning withdrawn + re-shown)', 375, 667, 100, async (page, info) => {
  await todayAfterEnd(page, true); await sleep(600);
  const t0 = Date.now();
  for (let i = 0; i < 30 && Date.now() - t0 < 15_000; i++) { await page.keyboard.press('Tab'); await sleep(500); }
  info.windowMs = Date.now() - t0; info.warningUpAt15s = await warningUp(page);
});

for (const [name, fn] of Object.entries(S)) {
  if (only && !only.some((o) => name.startsWith(o))) continue;
  const t = Date.now();
  try { results[name] = await fn(); } catch (e) { results[name] = { error: String(e).slice(0, 400) }; }
  log(`SCENARIO ${name} (${((Date.now() - t) / 1000).toFixed(1)}s): ${JSON.stringify(results[name]).slice(0, 6000)}`);
}
writeFileSync(`${dir}/focus-${tag}.json`, JSON.stringify({ tag, url: rev.dev, rev: rev.name, commit: rev.commit, results }, null, 1));
log(`END ${stamp()}`);
await b.close();
