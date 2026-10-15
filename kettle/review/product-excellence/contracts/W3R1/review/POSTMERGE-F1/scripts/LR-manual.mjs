// LR-manual.mjs <label> <baseURL> <iterations> <phase quiet|loaded> <outdir> <scenario LEN|S1|S2|S0>
// env TYPE_TIMEOUT_MS (default 1500): how long a typing call may wait for the composer before it gives up (raised for the loaded re-run).
// Two tabs of ONE browser context (= one profile, shared localStorage); real mouse and keyboard input (Playwright's
// locator.click / pressSequentially / keyboard.press); the debug API is used only to read state and to fast-forward.
//   LEN (a): tab A on Today, idle. Tab B clicks a Brew length radio on Today, then clicks "Put the kettle on".
//            iterations 1-3: B clicks Start 150 ms after the length click ("quick"); 4-6: B waits until A's Start button
//            shows the new length ("settled"), then clicks Start. Lengths per iteration: 15, 50, 50, 15, 15, 50 min.
//   S1 (b):  both tabs on Today. A types a task and presses Enter (brew). B is brought to the front at once and a task is typed.
//   S2 (b):  both tabs on Today. B is typed "Reply" first (its sync pending); A is brought to the front and presses Enter;
//            B is brought to the front again and the rest is typed.
//   S0 (b, literal): A starts a brew first; THEN a new tab B opens Today (it is sent to the focus screen); a task is typed
//            wherever a composer exists, in each tab.
// After each, three rounds of switching tabs and typing where a composer exists; then the brew is fast-forwarded past
// its end (debug API), both tabs get up to 20 s to reach #/done, and the records for the session are counted in
// kettle:progress and in each tab's memory.
// Typed words contain no space, '+', '=' or 'm' (on the focus screen Space pauses, +/= add five minutes, m mutes).
// 'loaded' = CPU throttling x6 (CDP Emulation.setCPUThrottlingRate) on the pages open at that time.
import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';
import { execSync } from 'node:child_process';
const [label, base, nStr, phase, out, scenario = 'S1'] = process.argv.slice(2);
const N = +nStr; mkdirSync(out, { recursive: true });
const PRIME = `(() => { try { if (localStorage.getItem('kettle:settings')) return; const state = { onboarded: true, scene: 'off', motion: 'reduce', autoStartBreaks: false, autoStartFocus: false, muted: true }; localStorage.setItem('kettle:settings', JSON.stringify({ state, version: 1 })); } catch {} })();`;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const load = () => execSync('cut -d" " -f1-3 /proc/loadavg').toString().trim();
const COMPOSER = { name: /What are you brewing/ };
const LENS = [15, 50, 50, 15, 15, 50];
const b = await chromium.launch({ args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader', '--ignore-gpu-blocklist'] });
async function dump(p, sid) {
  return p.evaluate((id) => {
    const k = window.__kettle; const s = k.timer.getState();
    const pick = (o) => o && { status: o.status, phase: o.phase, sessionId: o.sessionId, startedAt: o.startedAt, endsAt: o.endsAt, plannedMs: o.plannedMs, remainingMs: o.remainingMs, intention: o.intention, tag: o.tag, lastEnded: o.lastEnded ? { sessionId: o.lastEnded.sessionId, reason: o.lastEnded.reason } : null };
    let st = null; try { st = JSON.parse(localStorage.getItem('kettle:timer') ?? 'null'); } catch {}
    let pr = null; try { pr = JSON.parse(localStorage.getItem('kettle:progress') ?? 'null'); } catch {}
    let se = null; try { se = JSON.parse(localStorage.getItem('kettle:settings') ?? 'null'); } catch {}
    const sidN = id ?? s.sessionId;
    const startBtn = [...document.querySelectorAll('button')].find((e) => /put the kettle on/i.test(e.textContent || ''));
    const checked = document.querySelector('[role=radiogroup][aria-label="Brew length"] [role=radio][aria-checked=true]');
    return {
      hash: location.hash, memory: pick(s), stored: st && { version: st.version, ...pick(st.state) },
      settingsFocusMin: { memory: k.settings.getState().focusMin, stored: se?.state?.focusMin ?? null },
      startButton: startBtn ? startBtn.textContent.replace(/\s+/g, ' ').trim() : null,
      checkedLength: checked ? checked.textContent.replace(/\s+/g, ' ').trim() : null,
      clockText: (document.body.innerText.match(/\b\d{1,2}:\d{2}\b/) ?? [null])[0],
      composerPresent: !!document.querySelector('input[placeholder], input[aria-label*="brewing" i]'),
      records: sidN ? { stored: (pr?.state?.sessions ?? []).filter((r) => r.id === sidN).length, memory: k.progress.getState().sessions.filter((r) => r.id === sidN).length } : null,
      sessionsInStorage: (pr?.state?.sessions ?? []).length,
    };
  }, sid);
}
const results = [];
for (let it = 1; it <= N; it++) {
  const ctx = await b.newContext({ viewport: { width: 1200, height: 800 }, colorScheme: 'light' });
  await ctx.addInitScript(PRIME);
  const p1 = await ctx.newPage(); // tab A
  let p2 = scenario === 'S0' ? null : await ctx.newPage(); // tab B
  const errs = []; const watch = (n, p) => p.on('pageerror', (e) => errs.push(`${n}: ${e.message}`));
  watch('A', p1); if (p2) watch('B', p2);
  const open = async (p) => { await p.goto(`${base}/?debug#/`); await p.waitForFunction(() => !!window.__kettle?.timerInfo); };
  await open(p1); await p1.getByRole('textbox', COMPOSER).waitFor({ state: 'visible' });
  if (p2) { await open(p2); await p2.getByRole('textbox', COMPOSER).waitFor({ state: 'visible' }); }
  await sleep(700);
  const shot = it === 1;
  const R = { label, base, phase, scenario, iteration: it, loadAtStart: load(), steps: {} };
  const snap = async (name, sid) => {
    R.steps[name] = { A: await dump(p1, sid), ...(p2 ? { B: await dump(p2, sid) } : {}) };
    if (shot) for (const [n, p] of [['A', p1], ['B', p2]]) if (p) await p.screenshot({ path: `${out}/${label}-${scenario}-${phase}-${n}-${name}.png` });
  };
  const throttle = async (p) => { const c = await ctx.newCDPSession(p); await c.send('Emulation.setCPUThrottlingRate', { rate: 6 }); };
  await snap('01-both-on-today');
  if (phase === 'loaded') { await throttle(p1); if (p2) await throttle(p2); }
  let sid;

  if (scenario === 'LEN') {
    const want = LENS[(it - 1) % LENS.length];
    const quick = it <= 3;
    R.wantMin = want; R.gap = quick ? 'quick(150ms)' : 'settled(A shows it)';
    await p2.bringToFront();
    const group = p2.getByRole('radiogroup', { name: 'Brew length' });
    await group.getByRole('radio', { name: new RegExp(`^${want} min`) }).click();
    R.lengthClickAt = Date.now();
    if (quick) await sleep(150);
    else {
      const t0 = Date.now();
      R.aShowedLengthAfterMs = await p1.waitForFunction((m) => [...document.querySelectorAll('button')].some((e) => new RegExp(`put the kettle on · ${m} min`, 'i').test((e.textContent || '').replace(/\s+/g, ' '))), want, { timeout: 5000 }).then(() => Date.now() - t0, () => null);
      R.aIdleWhenShowing = await dump(p1);
      R.bIdleWhenShowing = await dump(p2);
    }
    await p2.getByRole('button', { name: /put the kettle on/i }).click();
    R.startClickAt = Date.now();
    await p2.waitForFunction(() => window.__kettle.timer.getState().status !== 'idle', null, { timeout: 8000 }).catch(() => {});
    sid = await p2.evaluate(() => window.__kettle.timer.getState().sessionId);
    R.sessionIdFromB = sid;
    await sleep(1200);
    await snap('02-after-start', sid);
    await sleep(2500);
    await snap('03-settled-3.7s-later', sid);
    const a = R.steps['03-settled-3.7s-later'].A, bb = R.steps['03-settled-3.7s-later'].B, want_ms = want * 60_000;
    R.check = {
      b_running: bb.memory.status === 'running',
      a_running: a.memory.status === 'running',
      same_sessionId_both_and_storage: !!sid && a.memory.sessionId === sid && bb.memory.sessionId === sid && a.stored?.sessionId === sid,
      stored_running: a.stored?.status === 'running',
      same_endsAt_both_and_storage: a.memory.endsAt != null && a.memory.endsAt === bb.memory.endsAt && a.stored?.endsAt === a.memory.endsAt,
      plannedMs_is_B_length_in_A_B_storage: a.memory.plannedMs === want_ms && bb.memory.plannedMs === want_ms && a.stored?.plannedMs === want_ms,
      settings_focusMin_is_B_length_in_A: a.settingsFocusMin.memory === want && a.settingsFocusMin.stored === want,
      a_on_focus_screen: a.hash === '#/focus',
    };
    // extra: let it end
    await p2.bringToFront();
    await p2.evaluate((ms) => window.__kettle.ff(ms), want_ms + 60_000);
  } else {
    // ---- (b)
    R.t2Typing = {};
    const typeIn = (p, text) => p.getByRole('textbox', COMPOSER).pressSequentially(text, { delay: 20, timeout: +(process.env.TYPE_TIMEOUT_MS ?? 1500) }).then(() => null, (e) => String(e.message).split('\n')[0]);
    await p1.bringToFront();
    await p1.getByRole('textbox', COMPOSER).click();
    await p1.getByRole('textbox', COMPOSER).pressSequentially('Write the report', { delay: 25 });
    await sleep(350);
    if (scenario === 'S1') {
      await p1.keyboard.press('Enter');
      R.enterAt = Date.now();
      await p2.bringToFront();
      R.t2Typing.composerPresentOnArrival = (await dump(p2)).composerPresent;
      R.t2Typing.error = await typeIn(p2, 'ReplyToBob');
    } else if (scenario === 'S2') {
      await p2.bringToFront();
      await p2.getByRole('textbox', COMPOSER).click();
      await p2.getByRole('textbox', COMPOSER).pressSequentially('Reply', { delay: 30 });
      R.t2Typing.valueBefore = await p2.getByRole('textbox', COMPOSER).inputValue();
      await p1.bringToFront();
      await p1.keyboard.press('Enter');
      R.enterAt = Date.now();
      await p2.bringToFront();
      R.t2Typing.composerPresentAfterSwitch = (await dump(p2)).composerPresent;
      R.t2Typing.error = await typeIn(p2, 'ToBob');
    } else { // S0: the brew first, then B opens Today
      await p1.keyboard.press('Enter');
      R.enterAt = Date.now();
      await p1.waitForFunction(() => window.__kettle.timer.getState().status !== 'idle', null, { timeout: 8000 }).catch(() => {});
      await sleep(500);
      p2 = await ctx.newPage(); watch('B', p2);
      if (phase === 'loaded') await throttle(p2);
      await p2.bringToFront();
      await p2.goto(`${base}/?debug#/`); await p2.waitForFunction(() => !!window.__kettle?.timerInfo);
      await sleep(900);
      R.t2Typing.hashAfterOpeningToday = await p2.evaluate(() => location.hash);
      R.t2Typing.composerPresent = (await dump(p2)).composerPresent;
      R.t2Typing.error = await typeIn(p2, 'ReplyToBob');
      R.t2Typing.errorA = await typeIn(p1, 'NotesA');
    }
    await p1.waitForFunction(() => window.__kettle.timer.getState().status !== 'idle', null, { timeout: 8000 }).catch(() => {});
    sid = await p1.evaluate(() => window.__kettle.timer.getState().sessionId);
    R.sessionIdFromA = sid;
    await sleep(500);
    await snap('02-brew-started-and-B-typed', sid);
    R.backAndForth = [];
    for (let i = 1; i <= 3; i++) {
      const row = { i };
      await p1.bringToFront(); row.AComposerPresent = (await dump(p1, sid)).composerPresent;
      if (row.AComposerPresent) await typeIn(p1, '-' + i);
      await sleep(300);
      await p2.bringToFront(); row.BComposerPresent = (await dump(p2, sid)).composerPresent;
      if (row.BComposerPresent) await typeIn(p2, '-' + i);
      await sleep(500);
      R.backAndForth.push(row);
    }
    await sleep(900);
    await snap('03-after-back-and-forth', sid);
    const a = R.steps['03-after-back-and-forth'].A, bb = R.steps['03-after-back-and-forth'].B;
    R.check = {
      a_running: a.memory.status === 'running',
      b_running: bb.memory.status === 'running',
      same_sessionId_both_and_storage: !!sid && a.memory.sessionId === sid && bb.memory.sessionId === sid && a.stored?.sessionId === sid,
      stored_running: a.stored?.status === 'running',
      same_endsAt_both_and_storage: a.memory.endsAt != null && a.memory.endsAt === bb.memory.endsAt && a.stored?.endsAt === a.memory.endsAt,
      never_idle_anywhere: ![a.memory.status, bb.memory.status, a.stored?.status, bb.stored?.status].includes('idle'),
    };
    await p1.bringToFront();
    await p1.evaluate(() => window.__kettle.ff(27 * 60_000));
  }
  // ---- let it end: both tabs to #/done, count records
  await p1.waitForFunction(() => location.hash === '#/done', null, { timeout: 20000 }).catch(() => {});
  await p2.waitForFunction(() => location.hash === '#/done', null, { timeout: 20000 }).catch(() => {});
  await sleep(1500);
  await snap('04-after-end', sid);
  const e1 = R.steps['04-after-end'].A, e2 = R.steps['04-after-end'].B;
  R.records = { stored: e1.records?.stored, A_memory: e1.records?.memory, B_memory: e2.records?.memory, sessionsInStorage: e1.sessionsInStorage };
  R.bothOnDone = e1.hash === '#/done' && e2.hash === '#/done';
  R.exactlyOneRecord = e1.records?.stored === 1 && e1.records?.memory === 1 && e2.records?.memory === 1;
  R.pageErrors = errs;
  R.loadAtEnd = load();
  results.push(R);
  console.log(`${label} ${scenario} ${phase} #${it} [${R.wantMin ?? ''}${R.wantMin ? ' ' + R.gap : ''}] check=${JSON.stringify(R.check)} bothOnDone=${R.bothOnDone} oneRecord=${R.exactlyOneRecord} t2=${JSON.stringify(R.t2Typing)} errs=${errs.length} load=${R.loadAtStart}->${R.loadAtEnd}`);
  await ctx.close();
}
await b.close();
writeFileSync(`${out}/${label}-${scenario}-${phase}.json`, JSON.stringify(results, null, 1));
