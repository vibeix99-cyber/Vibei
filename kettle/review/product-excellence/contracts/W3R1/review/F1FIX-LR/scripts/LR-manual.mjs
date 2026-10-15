// LR-manual.mjs <label> <baseURL> <iterations> <phase quiet|loaded> <outdir> <scenario S1|S2>
// S1: tab 1 types a task and presses Enter; tab 2 is brought to the front at once and typed into.
// S2: tab 2 is typed into first (its composer sync pending), tab 1 is brought to the front and presses Enter, then tab 2 again.
// (A first version typed into tab 2 without bringing it to the front; those keystrokes reached tab 1's composer: attempt1-discarded.)
// Two tabs of ONE browser context, real keyboard input in both: tab 2's composer is being typed in while tab 1 presses Enter to start a brew.
// 'loaded' = CPU throttling x6 (CDP Emulation.setCPUThrottlingRate) on both pages, so storage events are handled late.
import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';
const [label, base, nStr, phase, out, scenario = 'S1'] = process.argv.slice(2);
const N = +nStr; mkdirSync(out, { recursive: true });
const PRIME = `(() => { try { if (localStorage.getItem('kettle:settings')) return; const state = { onboarded: true, scene: 'off', motion: 'reduce', autoStartBreaks: false, autoStartFocus: false, muted: true }; localStorage.setItem('kettle:settings', JSON.stringify({ state, version: 1 })); } catch {} })();`;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const COMPOSER = { name: /What are you brewing/ };
const b = await chromium.launch({ args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader', '--ignore-gpu-blocklist'] });
async function dump(p, sid) {
  return p.evaluate((id) => {
    const k = window.__kettle; const s = k.timer.getState();
    const pick = (o) => o && { status: o.status, sessionId: o.sessionId, startedAt: o.startedAt, endsAt: o.endsAt, intention: o.intention, tag: o.tag, lastEnded: o.lastEnded ? { sessionId: o.lastEnded.sessionId, reason: o.lastEnded.reason } : null };
    let st = null; try { st = JSON.parse(localStorage.getItem('kettle:timer') ?? 'null'); } catch {}
    let pr = null; try { pr = JSON.parse(localStorage.getItem('kettle:progress') ?? 'null'); } catch {}
    const sidN = id ?? s.sessionId;
    return {
      hash: location.hash, memory: pick(s), stored: st && { version: st.version, ...pick(st.state) },
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
  const p1 = await ctx.newPage(); const p2 = await ctx.newPage();
  const errs = []; for (const [n, p] of [['t1', p1], ['t2', p2]]) { p.on('pageerror', (e) => errs.push(`${n}: ${e.message}`)); }
  for (const p of [p1, p2]) { await p.goto(`${base}/?debug#/`); await p.waitForFunction(() => !!window.__kettle?.timerInfo); await p.getByRole('textbox', COMPOSER).waitFor({ state: 'visible' }); }
  await sleep(700);
  const shot = it === 1;
  const R = { label, base, phase, scenario, iteration: it, steps: {} };
  const snap = async (name, sid) => {
    R.steps[name] = { t1: await dump(p1, sid), t2: await dump(p2, sid) };
    if (shot) for (const [n, p] of [['t1', p1], ['t2', p2]]) await p.screenshot({ path: `${out}/${label}-${scenario}-${phase}-${n}-${name}.png` });
  };
  await snap('01-both-on-today');
  if (phase === 'loaded') for (const p of [p1, p2]) { const c = await ctx.newCDPSession(p); await c.send('Emulation.setCPUThrottlingRate', { rate: 6 }); }
  R.scenario = scenario;
  await p1.bringToFront();
  await p1.getByRole('textbox', COMPOSER).click();
  await p1.getByRole('textbox', COMPOSER).pressSequentially('Write the report', { delay: 25 });
  await sleep(350);
  R.t2Typing = {};
  if (scenario === 'S1') {
    await p1.keyboard.press('Enter');
    R.enterAt = Date.now();
    await p2.bringToFront();
    R.t2Typing.composerPresentOnArrival = (await dump(p2)).composerPresent;
    R.t2Typing.error = await p2.getByRole('textbox', COMPOSER).pressSequentially('Reply to Sam', { delay: 20, timeout: 1500 }).then(() => null, (e) => String(e.message).split('\n')[0]);
  } else {
    await p2.bringToFront();
    await p2.getByRole('textbox', COMPOSER).click();
    await p2.getByRole('textbox', COMPOSER).pressSequentially('Reply', { delay: 30 });
    R.t2Typing.valueBefore = await p2.getByRole('textbox', COMPOSER).inputValue();
    await p1.bringToFront();
    await p1.keyboard.press('Enter');
    R.enterAt = Date.now();
    await p2.bringToFront();
    R.t2Typing.composerPresentAfterSwitch = (await dump(p2)).composerPresent;
    R.t2Typing.error = await p2.getByRole('textbox', COMPOSER).pressSequentially(' to Sam', { delay: 20, timeout: 1500 }).then(() => null, (e) => String(e.message).split('\n')[0]);
  }
  R.typing2Error = R.t2Typing.error;
  await p1.waitForFunction(() => window.__kettle.timer.getState().status !== 'idle', null, { timeout: 8000 }).catch(() => {});
  const sid1 = await p1.evaluate(() => window.__kettle.timer.getState().sessionId);
  R.sessionIdFromTab1 = sid1;
  await sleep(500);
  await snap('02-brew-started-and-tab2-typed', sid1);
  // back and forth a few times, typing where a composer exists
  R.backAndForth = [];
  for (let i = 1; i <= 3; i++) {
    const row = { i };
    await p1.bringToFront(); row.t1ComposerPresent = (await dump(p1, sid1)).composerPresent;
    if (row.t1ComposerPresent) await p1.getByRole('textbox', COMPOSER).pressSequentially(' ' + i, { delay: 30, timeout: 2000 }).catch(() => {});
    await sleep(300);
    await p2.bringToFront(); row.t2ComposerPresent = (await dump(p2, sid1)).composerPresent;
    if (row.t2ComposerPresent) await p2.getByRole('textbox', COMPOSER).pressSequentially(' ' + i, { delay: 30, timeout: 2000 }).catch(() => {});
    await sleep(500);
    R.backAndForth.push(row);
  }
  await sleep(900);
  await snap('03-after-back-and-forth', sid1);
  const d1 = R.steps['03-after-back-and-forth'].t1, d2 = R.steps['03-after-back-and-forth'].t2;
  R.survives = {
    both_running: d1.memory.status === 'running' && d2.memory.status === 'running',
    same_sessionId: d1.memory.sessionId === sid1 && d2.memory.sessionId === sid1,
    same_endsAt: d1.memory.endsAt === d2.memory.endsAt && d1.memory.endsAt != null && d1.stored?.endsAt === d1.memory.endsAt,
    stored_running_same_session: d1.stored?.status === 'running' && d1.stored?.sessionId === sid1,
  };
  // fast-forward past the end in tab 1 (debug API), then let tab 2 take it in
  await p1.bringToFront();
  await p1.evaluate(() => window.__kettle.ff(27 * 60_000));
  await p1.waitForFunction(() => location.hash === '#/done', null, { timeout: 20000 }).catch(() => {});
  await p2.waitForFunction(() => location.hash === '#/done', null, { timeout: 20000 }).catch(() => {});
  await sleep(1500);
  await snap('04-after-fast-forward', sid1);
  const e1 = R.steps['04-after-fast-forward'].t1, e2 = R.steps['04-after-fast-forward'].t2;
  R.records = { stored: e1.records?.stored, t1_memory: e1.records?.memory, t2_memory: e2.records?.memory, sessionsInStorage: e1.sessionsInStorage };
  R.exactlyOneRecord = e1.records?.stored === 1 && e1.records?.memory === 1 && e2.records?.memory === 1;
  R.pageErrors = errs;
  results.push(R);
  console.log(`${label} ${scenario} ${phase} #${it}: survives=${JSON.stringify(R.survives)} oneRecord=${R.exactlyOneRecord} typing2Error=${R.typing2Error ?? '-'} t2ComposerAtBackForth=${R.backAndForth.map((r) => r.t2ComposerPresent ? 'Y' : 'n').join('')}`);
  await ctx.close();
}
await b.close();
writeFileSync(`${out}/${label}-${scenario}-${phase}.json`, JSON.stringify(results, null, 1));
