/**
 * Lane I (W3R1, maker S), Vibei's decision 2: "Last 7 days" is rolling, while warm days, Tea Cozy and badges keep
 * their calendar logic. One history, recorded through the real engine (`__kettle.progress.recordSession`), is loaded
 * on BASE (:5478) and TRIAL (:5522) under three clocks that straddle a calendar-week change:
 *   A. Monday 2026-10-12 12:00 UTC, en-GB (weeks start Monday): brews on Sun 11 and Mon 12, plus one that starts
 *      Sun 23:50 and ends Mon 00:15.
 *   B. Sunday 2026-10-11 20:00 UTC, en-US (weeks start Sunday): brews on Sat 10 and Sun 11.
 *   C. Sunday 2026-10-11 20:00 UTC, en-GB (the rolling window equals the calendar week: a control).
 * History: warm Mon 28 Sep – Sun 4 Oct (7 days: a Tea Cozy), Mon 5 Oct missed (the Cozy is used), warm Tue 6 –
 * Sun 11 (and Mon 12 in A). Each day's minutes differ, so a calendar-week sum and a rolling sum cannot agree by chance.
 *
 *   LI_BASE=http://127.0.0.1:5478 LI_TRIAL=http://127.0.0.1:5522 npx playwright test -c .tmp/LI/LI-pw.config.ts
 */
import { test, expect, type Browser } from '@playwright/test';
import fs from 'node:fs';

/* eslint-disable @typescript-eslint/no-explicit-any */
const BASE = process.env.LI_BASE ?? 'http://127.0.0.1:5478';
const TRIAL = process.env.LI_TRIAL ?? 'http://127.0.0.1:5522';
const OUT = process.env.LI_OUT ?? '.tmp/LI/out/weekboundary';
const MIN = 60_000;

type Rec = { id: string; phase: 'focus'; startedAt: number; endedAt: number; plannedMs: number; focusedMs: number; completed: boolean; intention: string; tag: null; day: string };
function history(until: string): Rec[] {
  const out: Rec[] = [];
  const days: string[] = [];
  for (let t = Date.parse('2026-09-28T00:00:00Z'); ; t += 86_400_000) {
    const d = new Date(t).toISOString().slice(0, 10);
    if (d > until) break;
    if (d !== '2026-10-05') days.push(d);
  }
  days.forEach((d, i) => {
    if (d === '2026-10-12') return; // Monday's brews are below
    const m = 20 + i; // 20, 21, 22… minutes: every day differs
    const start = Date.parse(`${d}T09:00:00Z`);
    out.push({ id: `li-${d}`, phase: 'focus', startedAt: start, endedAt: start + m * MIN, plannedMs: m * MIN, focusedMs: m * MIN, completed: true, intention: '', tag: null, day: d });
  });
  if (until >= '2026-10-12') {
    const s1 = Date.parse('2026-10-11T23:50:00Z');
    out.push({ id: 'li-midnight', phase: 'focus', startedAt: s1, endedAt: s1 + 25 * MIN, plannedMs: 25 * MIN, focusedMs: 25 * MIN, completed: true, intention: '', tag: null, day: '2026-10-12' });
    const s2 = Date.parse('2026-10-12T06:30:00Z');
    out.push({ id: 'li-mon', phase: 'focus', startedAt: s2, endedAt: s2 + 17 * MIN, plannedMs: 17 * MIN, focusedMs: 17 * MIN, completed: true, intention: '', tag: null, day: '2026-10-12' });
  }
  return out.sort((a, b) => a.endedAt - b.endedAt);
}

const CASES = [
  { id: 'A-mon-enGB', at: '2026-10-12T12:00:00Z', today: '2026-10-12', locale: 'en-GB', weekStart: '2026-10-12' },
  { id: 'B-sun-enUS', at: '2026-10-11T20:00:00Z', today: '2026-10-11', locale: 'en-US', weekStart: '2026-10-11' },
  { id: 'C-sun-enGB', at: '2026-10-11T20:00:00Z', today: '2026-10-11', locale: 'en-GB', weekStart: '2026-10-05' },
];

async function read(browser: Browser, url: string, c: (typeof CASES)[number], recs: Rec[], shot: string) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, locale: c.locale, timezoneId: 'UTC', deviceScaleFactor: 1 });
  await ctx.addInitScript(() => localStorage.setItem('kettle:settings', JSON.stringify({ state: { onboarded: true, scene: 'off', autoStartBreaks: false, autoStartFocus: false, muted: true, dailyGoalMin: 30 }, version: 1 })));
  const page = await ctx.newPage();
  await page.clock.install({ time: Date.parse(c.at) });
  await page.clock.resume();
  await page.goto(`${url}/?debug&seed=blank#/`);
  await page.waitForFunction(() => !!(window as any).__kettle?.timerInfo, null, { timeout: 30_000 });
  await page.evaluate((rs) => { for (const r of rs) (window as any).__kettle.progress.getState().recordSession(r); }, recs);
  await page.evaluate(() => (window as any).__kettle.navigate('/stats'));
  await expect(page.getByRole('heading', { name: 'Stats', level: 1 })).toBeVisible();
  await expect(page.locator('[data-route-leaving]')).toHaveCount(0);
  await page.waitForTimeout(800);
  const data = await page.evaluate(async (today) => {
    const K = (window as any).__kettle;
    const st = K.progress.getState();
    // The engine's own pure functions, from the build's own source (Vite dev server).
    const streak = await import(/* @vite-ignore */ '/src/progress/streak.ts');
    const be = await import(/* @vite-ignore */ '/src/progress/badgeEngine.ts');
    const t = streak.streakTimeline(streak.warmDays(st.sessions), today);
    const metrics = be.badgeMetrics({ sessions: st.sessions, ledger: st.ledger, leaves: st.leaves, bestStreak: t.best });
    const main = document.querySelector('main')!;
    const sections = [...main.querySelectorAll('section')].map((s) => {
      const lab = s.getAttribute('aria-label') || document.getElementById(s.getAttribute('aria-labelledby') || '')?.textContent || '';
      return { label: lab.trim(), text: (s as HTMLElement).innerText.replace(/\s+/g, ' ').trim() };
    });
    const calendar = [...main.querySelectorAll('[aria-label]')].map((e) => e.getAttribute('aria-label')!).filter((l) => /Oct|Sep/.test(l) && !/brew,/.test(l));
    const badges = [...main.querySelectorAll('button[aria-label]')].map((e) => e.getAttribute('aria-label')!).filter((l) => /tier|earned|locked/.test(l));
    return {
      engine: { current: t.current, best: t.best, cozies: t.cozies, cozyDays: t.cozyDays, cozyEarnedOn: t.cozyEarnedOn, todayDone: t.todayDone, days: t.days, weekendWarmth: metrics['weekend-warmth'], warmStreakMetric: metrics['warm-streak'] },
      storedBadges: st.badges,
      sessions: st.sessions.map((s: any) => ({ id: s.id, day: s.day, min: Math.floor(s.focusedMs / 60000) })),
      overview: sections.find((s) => s.label === 'Overview')?.text,
      warmCard: sections.find((s) => /warm|streak/i.test(s.label) && s.label !== 'Overview')?.text,
      weekCard: sections.find((s) => /Last 7 days|This week|week/i.test(s.label) && !/Today and/.test(s.label))?.text,
      glance: sections.find((s) => /Today and the last 7 days/.test(s.label))?.text ?? null,
      sectionLabels: sections.map((s) => s.label),
      calendar,
      badges,
    };
  }, c.today);
  await page.screenshot({ path: shot, fullPage: true });
  await ctx.close();
  return data;
}

for (const c of CASES) {
  test(`week boundary ${c.id}: warm days, Tea Cozy and badges match base; "Last 7 days" is rolling`, async ({ browser }) => {
    test.setTimeout(120_000);
    fs.mkdirSync(OUT, { recursive: true });
    const recs = history(c.today);
    const base = await read(browser, BASE, c, recs, `${OUT}/${c.id}-base.png`);
    const trial = await read(browser, TRIAL, c, recs, `${OUT}/${c.id}-trial.png`);
    fs.writeFileSync(`${OUT}/${c.id}.json`, JSON.stringify({ case: c, base, trial }, null, 1));

    // Same history, same attribution on both builds.
    expect(trial.sessions).toEqual(base.sessions);
    // Warm days, Tea Cozy and badges: identical engine values and identical stored badge tiers.
    expect(trial.engine).toEqual(base.engine);
    // (Stored badges carry the wall-clock time each tier was unlocked, which differs by milliseconds between the two
    // runs; the tiers are what the calendar logic decides.)
    const tiers = (b: any) => Object.fromEntries(Object.entries(b).map(([k, v]: [string, any]) => [k, v.tier]));
    expect(tiers(trial.storedBadges)).toEqual(tiers(base.storedBadges));
    expect(trial.badges).toEqual(base.badges);
    // The warm-days calendar cells say the same thing on both builds (labels only; the wording outside them changed).
    expect(trial.calendar).toEqual(base.calendar);
    // The history really straddles the week change, and the Cozy really was used on Mon 5 Oct.
    expect(base.engine.cozyDays).toEqual(['2026-10-05']);
    expect(base.engine.days['2026-10-05']).toBe('cozy');

    // "Last 7 days": rolling, today at the right edge.
    const day = (d: string, n: number) => new Date(Date.parse(`${d}T00:00:00Z`) + n * 86_400_000).toISOString().slice(0, 10);
    const rolling = recs.filter((r) => r.day >= day(c.today, -6) && r.day <= c.today).reduce((a, r) => a + Math.floor(r.focusedMs / MIN), 0);
    const calendar = recs.filter((r) => r.day >= c.weekStart && r.day <= c.today).reduce((a, r) => a + Math.floor(r.focusedMs / MIN), 0);
    const hm = (m: number) => (m >= 60 ? `${Math.floor(m / 60)}h${m % 60 ? ` ${m % 60}m` : ''}` : `${m} min`);
    expect(trial.glance, 'the trial has the summary').toBeTruthy();
    // The label reads exactly "Last 7 days".
    expect(trial.glance!).toMatch(/(^|\s)Last 7 days\s/);
    expect(trial.glance!).not.toMatch(/This week/);
    expect(trial.glance!).toContain(`${hm(rolling)} focused`);
    if (c.weekStart !== day(c.today, -6)) expect(rolling).not.toBe(calendar);
    // The chart below is the same rolling series on both builds.
    expect(trial.weekCard).toContain(hm(rolling));
    expect(base.weekCard).toContain(hm(rolling));
    console.log(JSON.stringify({ case: c.id, rolling: hm(rolling), calendarWeek: hm(calendar), glance: trial.glance, baseWeek: base.weekCard?.slice(0, 120), trialWeek: trial.weekCard?.slice(0, 120), engine: { current: base.engine.current, best: base.engine.best, cozies: base.engine.cozies, cozyDays: base.engine.cozyDays, weekend: base.engine.weekendWarmth }, overviewBase: base.overview, overviewTrial: trial.overview }));
  });
}
