/**
 * Captures genuine screenshots + Chai SVGs from a locally-served build of Kettle.
 *
 * Kettle's source is not in this repo (it ships as a built, private artifact). To re-run:
 *   1. download the built files into a folder and serve it:  python3 -m http.server 5051
 *   2. KETTLE_URL=http://localhost:5051/index.html OUT=./raw node tools/capture-kettle.mjs
 *
 * Nothing here edits Kettle. "History" screens are produced by Kettle itself: the script sets the
 * page clock to earlier dates and lets the app complete real sessions, so streaks, stats, leaves and
 * badges are the app's own calculations over SAMPLE data (not anyone's real usage).
 */
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const URL0 = process.env.KETTLE_URL ?? 'http://localhost:5051/index.html';
const OUT = path.resolve(process.env.OUT ?? './raw');
const CHROME = process.env.CHROME ?? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
fs.mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({
  executablePath: fs.existsSync(CHROME) ? CHROME : undefined,
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
});
const M = { width: 390, height: 844 };
const D = { width: 1280, height: 800 };
const STEPS = new Set((process.env.STEPS ?? 'first,history,light,done,dark,desktop,chai').split(','));
const mk = (viewport, storageState, dpr = 2, colorScheme = 'light') =>
  browser.newContext({ viewport, deviceScaleFactor: dpr, serviceWorkers: 'block', storageState, reducedMotion: 'no-preference', colorScheme });
const log = (...a) => console.log(...a);
const shot = async (p, name, opts = {}) => {
  await p.waitForTimeout(opts.wait ?? 1200);
  await p.screenshot({ path: path.join(OUT, name + '.png'), ...opts.shot });
  log('shot', name);
};
const at = (h) => `${URL0}${h}`;

/* ---------- A. first-run flow (fresh storage) ---------- */
if (STEPS.has('first')) {
  const ctx = await mk(M); ctx.setDefaultTimeout(4000);
  const p = await ctx.newPage();
  await p.goto(at('#/welcome')); await shot(p, 'm-welcome', { wait: 1800 });
  await p.getByRole('button', { name: 'Get started' }).click();
  await p.getByPlaceholder(/name/i).fill('Sam'); await shot(p, 'm-ob-name');
  const C = () => p.getByRole('button', { name: 'Continue' }).click();
  await C(); await p.getByText('A cup').first().click(); await shot(p, 'm-ob-goal');
  await C(); await p.getByText('Classic').first().click(); await shot(p, 'm-ob-rhythm');
  await C(); await p.getByText('Rain').first().click(); await shot(p, 'm-ob-sound');
  await C(); await shot(p, 'm-ob-nudge');
  await p.getByRole('button', { name: 'Not now' }).click(); await shot(p, 'm-ob-ready');
  await p.getByRole('button', { name: 'Maybe later' }).click(); await p.waitForTimeout(1500);
  await ctx.storageState({ path: path.join(OUT, 'onboarded.json') });
  await ctx.close();
}

/* ---------- B. sample history, computed by the app ---------- */
const plan = [
  ['2026-09-24','09:30','work','Draft the launch email'],['2026-09-24','10:10','work','Inbox to zero'],
  ['2026-09-25','08:40','study','Chapter 2 flashcards'],['2026-09-25','09:20','study','Chapter 2 flashcards'],['2026-09-25','14:00','read','Read for the book club'],
  ['2026-09-26','10:00','create','Sketch the logo'],['2026-09-26','10:40','create','Sketch the logo'],['2026-09-26','11:20','work','Invoices'],
  ['2026-09-27','16:00','read','Essay: The Overstory'],['2026-09-27','16:40','read','Essay: The Overstory'],
  ['2026-09-28','09:00','work','Quarterly plan'],['2026-09-28','09:40','work','Quarterly plan'],['2026-09-28','10:20','study','Spanish verbs'],['2026-09-28','11:00','study','Spanish verbs'],
  ['2026-09-29','08:30','create','Sketch the logo'],['2026-09-29','09:10','create','Sketch the logo'],['2026-09-29','15:00','work','Inbox to zero'],
  ['2026-09-30','09:00','study','Chapter 3 notes'],['2026-09-30','09:40','study','Chapter 3 notes'],
];
if (STEPS.has('history')) {
  const ctx = await mk({ width: 390, height: 700 }, path.join(OUT, 'onboarded.json'), 1); ctx.setDefaultTimeout(3000);
  const p = await ctx.newPage(); let n = 0;
  for (const [d, t, tag, intent] of plan) {
    const now = new Date(`${d}T${t}:00`);
    await p.clock.setFixedTime(now);
    await p.goto(at('#/')); await p.waitForTimeout(600);
    await p.evaluate(([ms, tag, intent, n]) => {
      const s = JSON.parse(localStorage.getItem('kettle:timer'));
      Object.assign(s.state, { status: 'running', phase: 'focus', plannedMs: 1500000, startedAt: ms - 1502000, endsAt: ms - 2000, remainingMs: 0, pausedAt: null, pausedTotalMs: 0, intention: intent, tag, sessionId: 's_h' + n });
      localStorage.setItem('kettle:timer', JSON.stringify(s));
    }, [now.getTime(), tag, intent, n++]);
    await p.goto(at('#/focus')); await p.reload(); await p.waitForTimeout(1500);
  }
  await ctx.storageState({ path: path.join(OUT, 'history.json') });
  await ctx.close();
}

/* helpers for history-based shots */
const withHistory = async (viewport, fn, { theme, dpr = 2, fixed = '2026-09-30T15:20:00' } = {}) => {
  const ctx = await mk(viewport, path.join(OUT, 'history.json'), dpr, theme === 'dark' ? 'dark' : 'light'); ctx.setDefaultTimeout(4000);
  const p = await ctx.newPage();
  if (fixed) await p.clock.setFixedTime(new Date(fixed));
  const base = URL0;
  await fn(p, (h) => `${base}${h}`);
  await ctx.close();
};
const setTimer = (p, patch) => p.evaluate((patch) => {
  const s = JSON.parse(localStorage.getItem('kettle:timer')); const now = Date.now();
  const el = patch.elapsed; delete patch.elapsed;
  Object.assign(s.state, { status: 'running', pausedAt: null, pausedTotalMs: 0, startedAt: now - el, endsAt: now - el + patch.plannedMs, intention: 'Chapter 3 notes', tag: 'study', sessionId: 's_live' }, patch);
  localStorage.setItem('kettle:timer', JSON.stringify(s));
}, patch);

/* ---------- C. light mobile ---------- */
if (STEPS.has('light')) await withHistory(M, async (p, u) => {
  await p.goto(u('#/')); await shot(p, 'm-home', { wait: 2500 });
  await p.goto(u('#/')); await setTimer(p, { phase: 'focus', plannedMs: 1500000, elapsed: 11 * 60000 });
  await p.goto(u('#/focus')); await p.reload(); await shot(p, 'm-focus', { wait: 3500 });
  await setTimer(p, { phase: 'focus', plannedMs: 1500000, elapsed: 24 * 60000 + 20000 });
  await p.reload(); await shot(p, 'm-focus-late', { wait: 3000 });
  await setTimer(p, { phase: 'break', plannedMs: 300000, elapsed: 90000, intention: '', tag: null });
  await p.reload(); await shot(p, 'm-break', { wait: 3500 });
  await p.evaluate(() => { const s = JSON.parse(localStorage.getItem('kettle:timer')); s.state.status = 'idle'; s.state.phase = 'focus'; localStorage.setItem('kettle:timer', JSON.stringify(s)); });
  await p.goto(u('#/settings')); await shot(p, 'm-settings', { wait: 1500 });
});
if (STEPS.has('light')) await withHistory({ width: 390, height: 1750 }, async (p, u) => {
  await p.goto(u('#/stats')); await shot(p, 'm-stats-tall', { wait: 3000 });
});
if (STEPS.has('light')) await withHistory(M, async (p, u) => {
  await p.goto(u('#/nook')); await p.waitForTimeout(3500);
  await shot(p, 'm-nook', { wait: 500 });
  const tod = p.getByRole('button', { name: /Time of day/ });
  for (let i = 1; i <= 4; i++) { await tod.click().catch(() => {}); await shot(p, `m-nook-t${i}`, { wait: 1500 }); }
  const win = p.getByRole('button', { name: /Window:/ });
  for (let i = 1; i <= 3; i++) { await win.click().catch(() => {}); await shot(p, `m-nook-w${i}`, { wait: 1500 }); }
});

/* ---------- D. real completion at real time (done flow) ---------- */
if (STEPS.has('done')) {
  const ctx = await mk(M, path.join(OUT, 'history.json')); ctx.setDefaultTimeout(4000);
  const p = await ctx.newPage();
  await p.goto(at('#/')); await p.waitForTimeout(800);
  await setTimer(p, { phase: 'focus', plannedMs: 1500000, elapsed: 1500000 + 3000 });
  await p.goto(at('#/focus')); await p.reload(); await p.waitForTimeout(3500);
  for (let i = 1; i <= 6 && p.url().includes('/done'); i++) {
    await shot(p, `m-done-${i}`, { wait: 1800 });
    await p.getByRole('button', { name: /continue|done|back|home/i }).first().click().catch(() => {});
  }
  await ctx.close();
}

/* ---------- E. dark ("plum") mobile ---------- */
if (STEPS.has('dark')) await withHistory(M, async (p, u) => {
  await p.goto(u('#/')); await shot(p, 'd-home', { wait: 2500 });
  await setTimer(p, { phase: 'focus', plannedMs: 1500000, elapsed: 11 * 60000 });
  await p.goto(u('#/focus')); await p.reload(); await shot(p, 'd-focus', { wait: 3500 });
  await p.evaluate(() => { const s = JSON.parse(localStorage.getItem('kettle:timer')); s.state.status = 'idle'; localStorage.setItem('kettle:timer', JSON.stringify(s)); });
  await p.goto(u('#/nook')); await shot(p, 'd-nook', { wait: 3500 });
  await p.goto(u('#/stats')); await shot(p, 'd-stats', { wait: 2500 });
}, { theme: 'dark' });

/* ---------- F. desktop ---------- */
if (STEPS.has('desktop')) await withHistory(D, async (p, u) => {
  await p.goto(u('#/')); await shot(p, 'x-home', { wait: 2500 });
  await p.goto(u('#/nook')); await shot(p, 'x-nook', { wait: 4000 });
  await p.goto(u('#/stats')); await shot(p, 'x-stats', { wait: 3000 });
  await setTimer(p, { phase: 'focus', plannedMs: 1500000, elapsed: 11 * 60000 });
  await p.goto(u('#/focus')); await p.reload(); await shot(p, 'x-focus', { wait: 3500 });
});

/* ---------- G. Chai poses + design-system kit ---------- */
if (STEPS.has('chai')) await withHistory({ width: 1280, height: 900 }, async (p, u) => {
  await p.goto(u('#/kit?part=art&view=chai')); await p.waitForTimeout(2500);
  const svgs = await p.evaluate(() => [...document.querySelectorAll('[data-shot="chai"] svg[role="img"], [data-shot="chai"] svg')]
    .map((s) => ({ label: s.closest('div')?.parentElement?.innerText?.trim().split('\n').pop() ?? '', svg: s.outerHTML })));
  fs.writeFileSync(path.join(OUT, 'chai-svgs.json'), JSON.stringify(svgs));
  log('chai svgs', svgs.length);
  const el = p.locator('[data-shot="chai"]'); if (await el.count()) await el.screenshot({ path: path.join(OUT, 'x-chai-sheet.png') });
  await p.goto(u('#/kit?part=ui')); await shot(p, 'x-kit', { wait: 2500 });
}, { fixed: null });

await browser.close();
log('done');
