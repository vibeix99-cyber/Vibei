// R2-2tab.mjs <label> <baseURL> <iterations> <outdir> [cases=a,b,c,d,e]
// W3R2 item 1 (the stale-tab guard): Vibei's words, "pause, add 5 and end in the lagging tab while the other runs a brew".
// Two pages (= two tabs) of ONE browser context (one profile, shared localStorage). Every action by the person is a real
// mouse or keyboard event (Playwright locator.click / pressSequentially): start (type + click "Put the kettle on"), Pause,
// "Add 5 minutes", "End session" (and the sheet's "End session"). The debug API (window.__kettle) is used only to READ
// state, and to move the clock by the same amount in both tabs (so a brew has >= 1 minute of focus and gets a record).
// "Lagging" = the tab's `storage` events for kettle:timer are held (the init script of tests/w3r2-stale-tab.spec.ts) and
// released later in order.
//   (a) pause : A starts. B shows it. B held. A clicks "Add 5 minutes". B clicks Pause. Release.
//   (b) add 5 : A starts. B shows it. B held. A clicks Pause. B clicks "Add 5 minutes". Release.
//   (c) end   : A starts. B shows it. Both clocks +90 s. B held. A ends it (sheet) and starts a new brew. B clicks End
//               (sheet) on its stale view. Release.
//   (d) no hold: A starts. B shows it. Both clocks +90 s. B clicks Pause, "Add 5 minutes", End (sheet), with A watching.
//               Then A starts a 2nd brew, both clocks +90 s, B clicks End. One record per ended brew.
//   (e) optional: as (c), but B clicks "Add 5 minutes" instead of End; records the Focus "+5 min" note.
// Output: <outdir>/<label>-<case>-<it>.json per iteration, <outdir>/<label>-summary.json, lines on stdout.
import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';
import { execSync } from 'node:child_process';

const [label, base, nStr, out, casesCsv = 'a,b,c,d,e'] = process.argv.slice(2);
const N = +nStr;
const CASES = casesCsv.split(',');
mkdirSync(out, { recursive: true });
const MIN = 60_000;

const PRIME = `(() => { try { if (localStorage.getItem('kettle:settings')) return; const state = { onboarded: true, scene: 'off', motion: 'reduce', autoStartBreaks: false, autoStartFocus: false, muted: true }; localStorage.setItem('kettle:settings', JSON.stringify({ state, version: 1 })); } catch {} })();`;
// as in tests/w3r2-stale-tab.spec.ts: holds this tab's storage events for kettle:timer while __w3r2.hold is on
const HOLD = `(() => {
  const held = [];
  const h = { hold: false, held: () => held.length, release() {
    h.hold = false;
    const out = held.splice(0);
    for (const e of out) dispatchEvent(new StorageEvent('storage', { ...e, storageArea: localStorage }));
  } };
  window.__w3r2 = h;
  addEventListener('storage', (e) => {
    if (!(h.hold && e.key === 'kettle:timer')) return;
    e.stopImmediatePropagation();
    held.push({ key: e.key, oldValue: e.oldValue, newValue: e.newValue, url: e.url });
  }, { capture: true });
})();`;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const load = () => execSync('cut -d" " -f1-3 /proc/loadavg').toString().trim();
const now = () => new Date().toISOString().slice(11, 19);
const COMPOSER = { name: /What are you brewing/ };

async function dump(p) {
  return p.evaluate(() => {
    const k = window.__kettle; const s = k.timer.getState();
    const pick = (o) => o && { status: o.status, phase: o.phase, sessionId: o.sessionId, startedAt: o.startedAt, endsAt: o.endsAt, plannedMs: o.plannedMs, remainingMs: o.remainingMs, intention: o.intention, lastEnded: o.lastEnded ? { sessionId: o.lastEnded.sessionId, reason: o.lastEnded.reason } : null };
    let st = null; try { st = JSON.parse(localStorage.getItem('kettle:timer') ?? 'null'); } catch {}
    let pr = null; try { pr = JSON.parse(localStorage.getItem('kettle:progress') ?? 'null'); } catch {}
    const ids = (arr) => (arr ?? []).map((r) => r.id);
    return {
      hash: location.hash,
      memory: pick(s),
      stored: st && pick(st.state),
      recordsStored: ids(pr?.state?.sessions),
      recordsMemory: ids(k.progress.getState().sessions),
      held: window.__w3r2 ? window.__w3r2.held() : null,
      holding: window.__w3r2 ? window.__w3r2.hold : null,
      clockOffset: k.clock.offset,
    };
  });
}
const rawStored = (p) => p.evaluate(() => localStorage.getItem('kettle:timer'));
async function poll(fn, ms = 8000, step = 100) {
  const t0 = Date.now();
  for (;;) {
    let v; try { v = await fn(); } catch (e) { v = false; }
    if (v) return v;
    if (Date.now() - t0 > ms) return false;
    await sleep(step);
  }
}
const cnt = (arr, id) => arr.filter((x) => x === id).length;
const short = (s) => (s ? String(s).slice(0, 8) : s);

async function openToday(p, url) {
  await p.goto(url);
  await p.waitForFunction(() => !!window.__kettle?.timerInfo);
  await p.getByRole('textbox', COMPOSER).waitFor({ state: 'visible' });
}
// a real start: type the words in Today's composer, click "Put the kettle on"
async function startReal(p, words) {
  await p.bringToFront();
  const box = p.getByRole('textbox', COMPOSER);
  await box.click();
  await box.fill('');
  await box.pressSequentially(words, { delay: 15 });
  await sleep(400); // the composer's own 150 ms sync has run
  await p.getByRole('button', { name: /put the kettle on/i }).click();
}
const status = (p) => p.evaluate(() => window.__kettle.timer.getState().status);
const sid = (p) => p.evaluate(() => window.__kettle.timer.getState().sessionId);
const planned = (p) => p.evaluate(() => window.__kettle.timer.getState().plannedMs);
const storedState = (p) => p.evaluate(() => { try { return JSON.parse(localStorage.getItem('kettle:timer') ?? 'null')?.state ?? null; } catch { return null; } });
const heldCount = (p) => p.evaluate(() => window.__w3r2.held());
const holdOn = (p) => p.evaluate(() => { window.__w3r2.hold = true; });
const release = (p) => p.evaluate(() => window.__w3r2.release());
const ffBoth = async (A, B, ms) => { await A.evaluate((m) => window.__kettle.ff(m), ms); await B.evaluate((m) => window.__kettle.ff(m), ms); };
const click = async (p, name, ms = 8000) => { await p.bringToFront(); await p.getByRole('button', { name, exact: true }).click({ timeout: ms }); };
// End session: the Focus button, then the sheet's button. Returns what happened.
async function endReal(p) {
  const r = { sheet: null, confirm: null };
  try { await click(p, 'End session', 5000); } catch (e) { r.firstClick = String(e.message).split('\n')[0]; }
  const dlg = p.getByRole('dialog');
  r.sheet = await dlg.waitFor({ state: 'visible', timeout: 4000 }).then(() => true, () => false);
  if (r.sheet) {
    try { await dlg.getByRole('button', { name: 'End session', exact: true }).click({ timeout: 5000 }); r.confirm = true; } catch (e) { r.confirm = String(e.message).split('\n')[0]; }
  }
  return r;
}
// both tabs on Focus with the same running brew
async function bothShow(A, B) {
  const id = await poll(async () => { const x = await sid(A); return x && (await sid(B)) === x && (await status(A)) === 'running' && (await status(B)) === 'running' ? x : false; }, 10000);
  await poll(async () => (await A.evaluate(() => location.hash)) === '#/focus' && (await B.evaluate(() => location.hash)) === '#/focus', 5000);
  return id;
}
const agree = (x, y) => !!x && !!y && ['status', 'sessionId', 'endsAt', 'plannedMs'].every((k) => x[k] === y[k]) && (x.status !== 'paused' || x.remainingMs === y.remainingMs);

async function runIteration(browser, c, it) {
  const ctx = await browser.newContext({ viewport: { width: 1200, height: 800 }, colorScheme: 'light' });
  await ctx.addInitScript(PRIME);
  await ctx.addInitScript(HOLD);
  const A = await ctx.newPage(); const B = await ctx.newPage();
  const errs = [];
  A.on('pageerror', (e) => errs.push('A: ' + e.message)); B.on('pageerror', (e) => errs.push('B: ' + e.message));
  const R = { label, base, case: c, iteration: it, loadAtStart: load(), t0: now(), steps: {}, checks: {}, errors: errs };
  const snap = async (name, extra) => { R.steps[name] = { A: await dump(A), B: await dump(B), ...(extra ?? {}) }; return R.steps[name]; };
  try {
    await openToday(A, `${base}/?debug#/`); await openToday(B, `${base}/?debug#/`);
    await sleep(700);
    await startReal(A, 'Chapter 3 notes');
    const id = await bothShow(A, B);
    R.firstSessionId = id;
    await snap('01-started');
    if (!id) throw new Error('brew not shown in both tabs');
    const P0 = (await storedState(A)).plannedMs; R.plannedAtStart = P0;

    if (c === 'a') {
      await holdOn(B);
      await A.bringToFront(); await click(A, 'Add 5 minutes');
      R.preOk = await poll(async () => (await storedState(B))?.plannedMs === P0 + 5 * MIN && (await heldCount(B)) > 0 && (await planned(B)) === P0, 6000);
      await snap('02-pre-action (A +5 done, B behind)');
      await click(B, 'Pause');
      await sleep(600);
      const sB = await snap('03-after-B-pause-before-release');
      await release(B);
      await poll(async () => { const a = await dump(A), b = await dump(B); return agree(a.memory, b.memory) && agree(a.memory, a.stored); }, 6000);
      await sleep(1200);
      const f = await snap('04-final');
      const A_ = f.A.memory, B_ = f.B.memory, S = f.A.stored, S2 = f.B.stored;
      R.checks = {
        precondition_B_behind: !!R.preOk,
        paused_in_A: A_?.status === 'paused', paused_in_B: B_?.status === 'paused', paused_in_storage: S?.status === 'paused',
        same_session_A_B_storage: [A_, B_, S].every((x) => x?.sessionId === id),
        kept_plus5_A_B_storage: [A_, B_, S].every((x) => x?.plannedMs === P0 + 5 * MIN),
        A_B_storage_agree: agree(A_, B_) && agree(A_, S) && agree(S, S2),
        remaining_gt_planned_minus_2min: S?.remainingMs > S?.plannedMs - 2 * MIN,
      };
    } else if (c === 'b') {
      await holdOn(B);
      await click(A, 'Pause');
      R.preOk = await poll(async () => (await storedState(B))?.status === 'paused' && (await heldCount(B)) > 0 && (await status(B)) === 'running', 6000);
      await snap('02-pre-action (A paused, B behind, still shows running)');
      await click(B, 'Add 5 minutes');
      await sleep(600);
      await snap('03-after-B-add5-before-release');
      await release(B);
      await poll(async () => { const a = await dump(A), b = await dump(B); return agree(a.memory, b.memory) && agree(a.memory, a.stored); }, 6000);
      await sleep(1200);
      const f = await snap('04-final');
      const A_ = f.A.memory, B_ = f.B.memory, S = f.A.stored, S2 = f.B.stored;
      R.checks = {
        precondition_B_behind: !!R.preOk,
        same_session_A_B_storage: [A_, B_, S].every((x) => x?.sessionId === id),
        A_B_storage_agree: agree(A_, B_) && agree(A_, S) && agree(S, S2),
        still_paused_A_B_storage: [A_, B_, S].every((x) => x?.status === 'paused'),
        plus5_applied_A_B_storage: [A_, B_, S].every((x) => x?.plannedMs === P0 + 5 * MIN),
      };
    } else if (c === 'c' || c === 'e') {
      await ffBoth(A, B, 90_000);
      await sleep(500);
      await holdOn(B);
      await A.bringToFront();
      R.aEnd = await endReal(A);
      await poll(async () => (await status(A)) === 'idle' && (await A.evaluate(() => location.hash)) === '#/', 8000);
      await sleep(400);
      await startReal(A, 'Second brew');
      const id2 = await poll(async () => { const x = await sid(A); return x && x !== id && (await status(A)) === 'running' ? x : false; }, 8000);
      R.secondSessionId = id2;
      R.preOk = await poll(async () => (await storedState(B))?.sessionId === id2 && (await heldCount(B)) > 0 && (await sid(B)) === id && (await status(B)) === 'running', 6000);
      const pre = await snap('02-pre-action (A ended brew 1, runs brew 2; B behind, shows brew 1)');
      const rawBefore = await rawStored(A);
      await B.bringToFront();
      if (c === 'c') {
        R.bEnd = await endReal(B);
      } else {
        await click(B, 'Add 5 minutes');
        // the Focus note after +5 (the maker's open item): whatever "+5 min" text the page shows in the next 1.5 s
        const notes = [];
        for (let i = 0; i < 6; i++) { notes.push(await B.evaluate(() => (document.body.innerText.match(/5 min\s+·\s+whistles at[^\n]*/g) ?? []).join(' | '))); await sleep(250); }
        R.plus5Note = [...new Set(notes)];
      }
      await sleep(600);
      const rawMid = await rawStored(A);
      R.storageUnchangedByBAction = rawBefore === rawMid;
      await snap('03-after-B-action-before-release');
      await release(B);
      await poll(async () => { const a = await dump(A), b = await dump(B); return agree(a.memory, b.memory) && agree(a.memory, a.stored) && b.memory?.sessionId === id2; }, 6000);
      await sleep(1200);
      const f = await snap('04-final');
      const A_ = f.A.memory, B_ = f.B.memory, S = f.A.stored, S2 = f.B.stored;
      R.checks = {
        precondition_B_behind: !!R.preOk && !!id2,
        brew2_running_A_B_storage: [A_, B_, S].every((x) => x?.status === 'running' && x?.sessionId === id2),
        A_B_storage_agree: agree(A_, B_) && agree(A_, S) && agree(S, S2),
        brew2_not_extended_or_ended: [A_, B_, S].every((x) => x?.plannedMs === P0),
        B_shows_focus: f.B.hash === '#/focus',
        records_brew1_exactly_one_stored: cnt(f.A.recordsStored, id) === 1,
        records_brew1_exactly_one_A_memory: cnt(f.A.recordsMemory, id) === 1,
        records_brew1_exactly_one_B_memory: cnt(f.B.recordsMemory, id) === 1,
        no_record_for_brew2: cnt(f.A.recordsStored, id2) === 0 && cnt(f.A.recordsMemory, id2) === 0 && cnt(f.B.recordsMemory, id2) === 0,
      };
      if (c === 'e') {
        delete R.checks.records_brew1_exactly_one_stored; delete R.checks.records_brew1_exactly_one_A_memory; delete R.checks.records_brew1_exactly_one_B_memory; delete R.checks.no_record_for_brew2;
        R.checks.storage_byte_identical_after_B_click = !!R.storageUnchangedByBAction;
      }
    } else if (c === 'd') {
      await ffBoth(A, B, 90_000);
      await sleep(500);
      await click(B, 'Pause');
      await poll(async () => (await status(A)) === 'paused' && (await status(B)) === 'paused', 6000);
      await sleep(500);
      const s1 = await snap('02-B-paused');
      await click(B, 'Add 5 minutes');
      await poll(async () => (await planned(A)) === P0 + 5 * MIN && (await planned(B)) === P0 + 5 * MIN, 6000);
      await sleep(500);
      const s2 = await snap('03-B-added-5');
      R.bEnd1 = await endReal(B);
      await poll(async () => (await status(A)) === 'idle' && (await status(B)) === 'idle', 8000);
      await sleep(800);
      const s3 = await snap('04-B-ended-brew-1');
      // second brew: A starts, B ends it (plain, no pause)
      await poll(async () => (await A.evaluate(() => location.hash)) === '#/', 5000);
      await startReal(A, 'Second brew');
      const id2 = await bothShow(A, B);
      R.secondSessionId = id2;
      await snap('05-brew-2-started');
      await ffBoth(A, B, 90_000);
      await sleep(500);
      R.bEnd2 = await endReal(B);
      await poll(async () => (await status(A)) === 'idle' && (await status(B)) === 'idle', 8000);
      await sleep(1200);
      const f = await snap('06-final');
      const mem = (s) => s.A.memory, memB = (s) => s.B.memory;
      R.checks = {
        paused_in_A_and_B_after_B_pause: s1.A.memory?.status === 'paused' && s1.B.memory?.status === 'paused' && s1.A.stored?.status === 'paused' && agree(s1.A.memory, s1.B.memory) && agree(s1.A.memory, s1.A.stored),
        plus5_in_A_B_storage: [s2.A.memory, s2.B.memory, s2.A.stored].every((x) => x?.plannedMs === P0 + 5 * MIN) && agree(s2.A.memory, s2.B.memory),
        still_paused_after_plus5: s2.A.memory?.status === 'paused' && s2.B.memory?.status === 'paused',
        brew1_ended_idle_in_A_B_storage: [s3.A.memory, s3.B.memory, s3.A.stored].every((x) => x?.status === 'idle'),
        brew1_one_record_everywhere: cnt(s3.A.recordsStored, id) === 1 && cnt(s3.A.recordsMemory, id) === 1 && cnt(s3.B.recordsMemory, id) === 1,
        brew2_one_record_everywhere: !!id2 && cnt(f.A.recordsStored, id2) === 1 && cnt(f.A.recordsMemory, id2) === 1 && cnt(f.B.recordsMemory, id2) === 1,
        final_idle_A_B_storage_agree: [f.A.memory, f.B.memory, f.A.stored].every((x) => x?.status === 'idle') && f.A.memory?.lastEnded?.sessionId === f.B.memory?.lastEnded?.sessionId,
        exactly_two_records_total: f.A.recordsStored.length === 2 && f.A.recordsMemory.length === 2 && f.B.recordsMemory.length === 2,
      };
    }
  } catch (e) {
    R.exception = String(e.stack ?? e).split('\n').slice(0, 4).join(' / ');
    try { R.steps['99-after-exception'] = { A: await dump(A), B: await dump(B) }; } catch {}
  }
  if (it === 1) for (const [n, p] of [['A', A], ['B', B]]) { try { await p.screenshot({ path: `${out}/${label}-${c}-${n}-final.png` }); } catch {} }
  R.pageErrors = errs.length;
  R.pass = !R.exception && Object.keys(R.checks).length > 0 && Object.values(R.checks).every(Boolean);
  R.loadAtEnd = load(); R.t1 = now();
  writeFileSync(`${out}/${label}-${c}-${String(it).padStart(2, '0')}.json`, JSON.stringify(R, null, 1));
  await ctx.close();
  return R;
}

const browser = await chromium.launch({ args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader', '--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required'] });
const summary = { label, base, N, cases: {}, startedAt: now(), loadAtStart: load() };
console.log(`### ${label} ${base} N=${N} cases=${casesCsv} start ${now()} load ${load()}`);
for (const c of CASES) {
  const rows = [];
  for (let it = 1; it <= N; it++) {
    const R = await runIteration(browser, c, it);
    rows.push(R);
    const fin = Object.values(R.steps).at(-1);
    const cell = (x) => (x ? `${x.status}/${short(x.sessionId)}/${x.plannedMs / MIN}m/ends=${x.endsAt}` : 'null');
    const fails = Object.entries(R.checks).filter(([, v]) => !v).map(([k]) => k);
    console.log(`[${now()}] ${label} (${c}) it${it} ${R.pass ? 'PASS' : 'FAIL'} load ${R.loadAtStart}->${R.loadAtEnd}${R.exception ? ' EXC ' + R.exception : ''}${fails.length ? ' failed: ' + fails.join(',') : ''}\n    A=${cell(fin?.A.memory)}\n    B=${cell(fin?.B.memory)}\n    S=${cell(fin?.A.stored)}  S(read in B)=${cell(fin?.B.stored)}  pageErrors=${R.pageErrors}${R.plus5Note ? '\n    plus5Note=' + JSON.stringify(R.plus5Note) : ''}`);
  }
  const keys = [...new Set(rows.flatMap((r) => Object.keys(r.checks)))];
  summary.cases[c] = { iterations: rows.length, pass: rows.filter((r) => r.pass).length, fail: rows.filter((r) => !r.pass).length, perCheck: Object.fromEntries(keys.map((k) => [k, rows.filter((r) => r.checks[k]).length])), exceptions: rows.filter((r) => r.exception).length, pageErrors: rows.reduce((n, r) => n + r.pageErrors, 0), plus5Notes: rows.map((r) => r.plus5Note).filter(Boolean) };
  console.log(`### case (${c}) ${label}: pass ${summary.cases[c].pass}/${rows.length}`, JSON.stringify(summary.cases[c].perCheck));
}
summary.endedAt = now(); summary.loadAtEnd = load();
writeFileSync(`${out}/${label}-summary.json`, JSON.stringify(summary, null, 1));
console.log(`### done ${label} ${now()} load ${load()}`);
await browser.close();
