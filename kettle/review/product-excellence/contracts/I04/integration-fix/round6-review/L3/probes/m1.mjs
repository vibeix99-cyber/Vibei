// L3 check 1: M1 behaviour (storage-full warning, completion persistence, End sheet, restore truthfulness).
// node m1.mjs --rev=R6|INT --vp=phone|desktop [--only=name,name]
import { REV, launch, newCtx, openNewbie, fillStorage, unfillStorage, hash, toasts, warningUp, sleep, args, logger, OUT, recInstall, recStart, recStop, recSummary, startBtn, stamp, ready, ffBy, toEndMinus } from './lib.mjs';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
const a = args();
const rev = REV[a.rev ?? 'R6'];
const VP = { phone: [375, 667], desktop: [1440, 900] }[a.vp ?? 'phone'];
const [w, h] = VP;
const only = a.only ? a.only.split(',') : null;
const dir = `${OUT}/1`; mkdirSync(dir, { recursive: true });
const tag = `${rev.name}-${a.vp ?? 'phone'}` + (only ? '-only-' + only.join('_') : '');
const log = logger(`${dir}/m1-${tag}.log`);
const results = {};
log(`RUN m1 ${tag} url=${rev.dev} rev=${rev.name}@${rev.commit} viewport=${w}x${h} start=${stamp()}`);
const b = await launch();

async function fresh(name, opts = {}) {
  const ctx = await newCtx(b, { w, h, ...opts });
  await ctx.addInitScript(() => {
    window.__hc = []; window.__sum = [];
    addEventListener('hashchange', () => window.__hc.push([Math.round(performance.now()), location.hash]));
    const note = (n) => { if (n.nodeType !== 1) return; const hs = n.matches?.('h1') ? [n] : [...(n.querySelectorAll?.('h1') ?? [])]; for (const h of hs) if (/minutes? brewed/.test(h.textContent)) window.__sum.push([Math.round(performance.now()), h.textContent]); };
    new MutationObserver((ms) => ms.forEach((m) => m.addedNodes.forEach(note))).observe(document, { childList: true, subtree: true });
  });
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', (e) => errs.push(e.message));
  await openNewbie(page, rev.dev, {});
  return { ctx, page, errs };
}
const shot = (page, n) => page.screenshot({ path: `${dir}/${tag}-${n}.png` });
const mem = (page) => page.evaluate(() => { const p = window.__kettle.progress.getState(); return { n: p.sessions.length, ids: p.sessions.map((s) => s.id), sessions: p.sessions }; });
const raw = (page) => page.evaluate(() => localStorage.getItem('kettle:progress'));
const tstate = (page) => page.evaluate(() => { const s = window.__kettle.timer.getState(); return { status: s.status, phase: s.phase, id: s.sessionId, endsAt: s.endsAt }; });
const downloadBackup = async (page, click) => { const [d] = await Promise.all([page.waitForEvent('download', { timeout: 8000 }), click()]); return JSON.parse(readFileSync(await d.path(), 'utf8')); };
const alertText = (page) => page.evaluate(() => document.querySelector('[role="alert"]')?.textContent ?? null);
const waitWarning = (page, ms = 10000) => page.waitForSelector('[id="toast-kettle:save-failed"]', { timeout: ms }).then(() => true).catch(() => false);
const warnInfo = (page) => page.evaluate(() => { const e = document.getElementById('toast-kettle:save-failed'); if (!e) return null; const r = e.getBoundingClientRect(); return { text: e.textContent, rect: [Math.round(r.left), Math.round(r.top), Math.round(r.right), Math.round(r.bottom)] }; });

const S = {};

// 1. warning appears: storage full, brew started by a real tap
S.warnOnBrew = async () => {
  const { ctx, page, errs } = await fresh('warnOnBrew');
  const n0 = (await mem(page)).n;
  log('fill', await fillStorage(page));
  await recInstall(page); await recStart(page);
  await startBtn(page).click();
  const seen = []; const t0 = Date.now();
  for (let i = 0; i < 16; i++) { await sleep(500); seen.push([Date.now() - t0, await warningUp(page)]); }
  const frames = await recStop(page); const sum = recSummary(frames);
  const first = seen.find((x) => x[1]);
  await shot(page, 'warnOnBrew-8s');
  const r = { hash: await hash(page), warningEverSeen: !!first, firstSeenMs: first?.[0] ?? null, sampledUp: seen.filter((x) => x[1]).length + '/' + seen.length, toasts: await toasts(page), recVisibleMs: sum.visibleMs, recHitMs: sum.hitMs, hitSegments: sum.segments, errs, n0 };
  await ctx.close(); return r;
};

// 2. End within the first minute (storage full) -> Today, warning there; Save backup
S.endFirstMinute = async () => {
  const { ctx, page, errs } = await fresh('endFirstMinute');
  const n0 = (await mem(page)).n; await fillStorage(page); const raw0 = await raw(page);
  await recInstall(page); await recStart(page);
  await startBtn(page).click();
  await page.waitForFunction(() => location.hash === '#/focus'); await sleep(2500);
  await page.getByRole('button', { name: 'End session' }).click();
  const dlg = page.getByRole('dialog', { name: 'Leave the kettle early?' });
  await dlg.waitFor();
  const sheetText = (await dlg.innerText()).replace(/\n+/g, ' | ');
  await sleep(600); await shot(page, 'endFirstMinute-sheet');
  await dlg.getByRole('button', { name: 'End session' }).click();
  await page.waitForFunction(() => location.hash === '#/' || location.hash === '', null, { timeout: 8000 });
  const sawToday = await waitWarning(page, 10000);
  await sleep(800);
  const info = await warnInfo(page); await shot(page, 'endFirstMinute-today');
  const m = await mem(page);
  const bk = sawToday ? await downloadBackup(page, () => page.getByRole('button', { name: 'Save backup' }).click()) : null;
  await sleep(1200);
  const frames = await recStop(page); const sum = recSummary(frames);
  const r = { sheetText, warningOnToday: sawToday, warning: info, toastsAfterEnd: null, sessionsBefore: n0, sessionsAfter: m.n, rawUnchanged: (await raw(page)) === raw0, backupSessions: bk?.progress?.sessions?.length ?? null, recHitMs: sum.hitMs, hitSegments: sum.segments, errs };
  await ctx.close(); return r;
};

// 3. End later (storage full): 12 active minutes, End -> saved as an unfinished brew (in this tab only)
S.endLater = async () => {
  const { ctx, page, errs } = await fresh('endLater');
  const n0 = (await mem(page)).n; await fillStorage(page); const raw0 = await raw(page);
  await startBtn(page).click();
  await page.waitForFunction(() => location.hash === '#/focus'); await sleep(1500);
  const id = (await tstate(page)).id;
  await ffBy(page, 12 * 60_000); await sleep(800);
  await page.getByRole('button', { name: 'End session' }).click();
  const dlg = page.getByRole('dialog', { name: 'Leave the kettle early?' });
  await dlg.waitFor(); await sleep(600);
  const sheetText = (await dlg.innerText()).replace(/\n+/g, ' | ');
  await shot(page, 'endLater-sheet');
  await dlg.getByRole('button', { name: 'End session' }).click();
  await page.waitForFunction(() => location.hash === '#/' || location.hash === '', null, { timeout: 8000 });
  await sleep(1500);
  const tl = await toasts(page); await shot(page, 'endLater-today');
  const m = await mem(page);
  const recs = m.sessions.filter((s) => s.id === id);
  const r = { sheetText, toastsOnToday: tl, sessionsBefore: n0, sessionsAfter: m.n, recordsForThisBrew: recs.length, record: recs[0] ? { completed: recs[0].completed, focusedMs: recs[0].focusedMs } : null, rawUnchanged: (await raw(page)) === raw0, errs };
  await ctx.close(); return r;
};

// 4. dismissing the End sheet (Esc, backdrop, Keep brewing) never stops the brew (storage full)
S.dismissSheet = async () => {
  const { ctx, page, errs } = await fresh('dismissSheet');
  await fillStorage(page);
  await recInstall(page); await recStart(page);
  await startBtn(page).click();
  await page.waitForFunction(() => location.hash === '#/focus'); await sleep(1200);
  const s0 = await tstate(page);
  const same = async () => { const s = await tstate(page); return s.status === 'running' && s.id === s0.id && s.endsAt === s0.endsAt; };
  const out = {};
  const dlg = page.getByRole('dialog', { name: 'Leave the kettle early?' });
  await page.getByRole('button', { name: 'End session' }).click(); await dlg.waitFor(); await sleep(400);
  await page.keyboard.press('Escape'); await dlg.waitFor({ state: 'hidden' }); out.esc = await same();
  await page.getByRole('button', { name: 'End session' }).click(); await dlg.waitFor(); await sleep(400);
  await page.mouse.click(4, 4); await dlg.waitFor({ state: 'hidden' }); out.backdrop = await same();
  await page.getByRole('button', { name: 'End session' }).click(); await dlg.waitFor(); await sleep(400);
  await dlg.getByRole('button', { name: 'Keep brewing' }).click(); await dlg.waitFor({ state: 'hidden' }); out.keepBrewing = await same();
  await sleep(1500);
  const frames = await recStop(page); const sum = recSummary(frames);
  out.hash = await hash(page); out.warningUp = await warningUp(page); out.recHitMs = sum.hitMs; out.hitSegments = sum.segments; out.errs = errs;
  await ctx.close(); return out;
};

// 5. completion with storage full: whistle -> summary (once) -> Tea time -> break -> Skip break -> Today; record kept; backup; making room persists it
async function completion(full) {
  const { ctx, page, errs } = await fresh('completion');
  const n0 = (await mem(page)).n;
  if (full) await fillStorage(page);
  const raw0 = await raw(page);
  await recInstall(page); await recStart(page);
  await startBtn(page).click();
  await page.waitForFunction(() => location.hash === '#/focus'); await sleep(1500);
  const id = (await tstate(page)).id;
  await ffBy(page, 70_000);
  await page.evaluate(() => { const t = window.__kettle.timer.getState(); t.pause(); t.resume(); }); // a second save (also fails when full), 4 s before the end
  await toEndMinus(page, 4000);
  await sleep(1200);
  const up4 = await warningUp(page);
  await page.waitForFunction(() => location.hash === '#/done', null, { timeout: 25_000 });
  await sleep(2500);
  await shot(page, `completion-${full ? 'full' : 'ok'}-summary`);
  const m = await mem(page);
  const out = { full, hashChanges: await page.evaluate(() => window.__hc), summaryHeadingMounts: await page.evaluate(() => window.__sum), timer: await tstate(page), memRecordsForBrew: m.sessions.filter((s) => s.id === id).length, memSessionsBefore: n0, memSessionsAfter: m.n, warningUpBeforeEnd: up4, warningOnSummary: await warningUp(page) };
  out.rawUnchangedAtSummary = (await raw(page)) === raw0;
  out.storedIdsAtSummary = (await page.evaluate(() => { try { return JSON.parse(localStorage.getItem('kettle:progress')).state.sessions.map((s) => s.id); } catch { return null; } }));
  // Tea time (real tap) -> break
  const tea = page.getByRole('button', { name: /Tea time/ });
  await tea.click(); await sleep(1500);
  out.afterTea = { hash: await hash(page), phase: (await tstate(page)).phase, warning: await warningUp(page) };
  await shot(page, `completion-${full ? 'full' : 'ok'}-break`);
  const skip = page.getByRole('button', { name: 'Skip break' });
  if (await skip.isVisible().catch(() => false)) await skip.click();
  await page.waitForFunction(() => location.hash === '#/' || location.hash === '', null, { timeout: 8000 }).catch(() => {});
  if (full) await waitWarning(page, 6000);
  await sleep(900);
  out.today = { hash: await hash(page), warning: await warnInfo(page) }; await shot(page, `completion-${full ? 'full' : 'ok'}-today`);
  const frames = await recStop(page); const sum = recSummary(frames);
  out.recHitMs = sum.hitMs; out.hitSegments = sum.segments; out.recVisibleMs = sum.visibleMs;
  if (full) {
    // Save backup carries the brew once
    if (out.today.warning) { const bk = await downloadBackup(page, () => page.getByRole('button', { name: 'Save backup' }).click()); out.backupHasBrew = bk.progress.sessions.filter((s) => s.id === id).length; }
    else { await page.evaluate(() => window.__kettle.navigate('/settings')); const bk = await downloadBackup(page, () => page.getByRole('button', { name: /Export a backup/ }).click()); out.backupHasBrew = bk.progress.sessions.filter((s) => s.id === id).length; out.backupViaSettings = true; }
    // make room, then a save: reload and check it persisted
    await unfillStorage(page);
    await page.evaluate(() => window.__kettle.navigate('/settings')); await sleep(500);
    await page.getByRole('button', { name: /Export a backup/ }).click().catch(() => {}); await sleep(900);
  }
  await page.reload(); await ready(page); await sleep(800);
  const st = await page.evaluate((id) => { try { const s = JSON.parse(localStorage.getItem('kettle:progress')).state; return { n: s.sessions.length, ofBrew: s.sessions.filter((x) => x.id === id).length, ledgerOfBrew: s.ledger.filter((e) => e.id.endsWith(id)).map((e) => e.id) }; } catch { return null; } }, id);
  out.afterReloadStored = st;
  out.afterReloadMemory = (await mem(page)).sessions.filter((s) => s.id === id).length;
  out.afterReloadHash = await hash(page);
  out.errs = errs;
  await ctx.close(); return out;
}
S.completeFull = () => completion(true);
S.completeOk = () => completion(false);

// 6. import (restore): storage full refused truthfully; storage ok added truthfully
async function importCase(full, mode) {
  const { ctx, page, errs } = await fresh('import');
  const n0 = (await mem(page)).n;
  const backup = await page.evaluate(() => {
    const progress = JSON.parse(localStorage.getItem('kettle:progress')).state;
    const settings = JSON.parse(localStorage.getItem('kettle:settings')).state;
    progress.sessions.push({ ...progress.sessions[0], id: 's_from_backup' });
    return JSON.stringify({ app: 'kettle', kind: 'backup', schema: 2, exportedAt: new Date().toISOString(), progress, settings });
  });
  await page.evaluate(() => window.__kettle.navigate('/settings'));
  await page.getByRole('button', { name: /Import a backup/ }).waitFor();
  if (full) await fillStorage(page);
  const raw0 = await raw(page);
  const [chooser] = await Promise.all([page.waitForEvent('filechooser'), page.getByRole('button', { name: /Import a backup/ }).click()]);
  await chooser.setFiles({ name: 'kettle-backup.json', mimeType: 'application/json', buffer: Buffer.from(backup) });
  const dlg = page.getByRole('dialog', { name: /backup\?$/ });
  await dlg.waitFor();
  const dlgTitle = await dlg.getAttribute('aria-label').catch(() => null);
  if (mode === 'replace') await dlg.getByRole('radio', { name: /Replace/ }).click().catch(async () => dlg.getByText('Replace', { exact: false }).first().click());
  await sleep(400);
  const buttons = await dlg.getByRole('button').allInnerTexts();
  await shot(page, `import-${full ? 'full' : 'ok'}-${mode}-sheet`);
  await dlg.getByRole('button', { name: mode === 'replace' ? 'Replace' : 'Add' }).click();
  await sleep(1500);
  const m = await mem(page);
  const out = { full, mode, sheetButtons: buttons, alert: await alertText(page), toasts: await toasts(page), memSessionsBefore: n0, memSessionsAfter: m.n, imported: m.ids.includes('s_from_backup'), rawUnchanged: (await raw(page)) === raw0, saveWarningToast: await warningUp(page) };
  await page.evaluate(() => (document.querySelector('[role="alert"]') ?? [...document.querySelectorAll('button')].find((b) => b.textContent?.includes('Reset everything')))?.scrollIntoView({ block: 'center' }));
  await sleep(500); await shot(page, `import-${full ? 'full' : 'ok'}-${mode}-after`);
  await page.reload(); await ready(page); await sleep(600);
  out.afterReloadImported = (await mem(page)).ids.includes('s_from_backup');
  out.errs = errs;
  await ctx.close(); return out;
}
S.importFullAdd = () => importCase(true, 'merge');
S.importFullReplace = () => importCase(true, 'replace');
S.importOkAdd = () => importCase(false, 'merge');

for (const [name, fn] of Object.entries(S)) {
  if (only && !only.includes(name)) continue;
  const t = Date.now();
  try { results[name] = await fn(); } catch (e) { results[name] = { error: String(e).slice(0, 400) }; }
  log(`SCENARIO ${name} (${((Date.now() - t) / 1000).toFixed(1)}s): ${JSON.stringify(results[name])}`);
}
writeFileSync(`${dir}/m1-${tag}.json`, JSON.stringify({ tag, url: rev.dev, rev: rev.name, commit: rev.commit, viewport: [w, h], results }, null, 1));
log(`END ${stamp()}`);
await b.close();
