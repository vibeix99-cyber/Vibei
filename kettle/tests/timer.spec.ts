/**
 * Timer reliability e2e (timer area). Runs twice: against the isolated engine
 * harness (`timer-harness`) and inside the real app (`timer-app`).
 * Real time, short phases (a few seconds) — no fast-forward tricks, except
 * where we plant a session that "ended 3 hours ago" in storage.
 */
import { test as base, expect, type Page } from '@playwright/test';

const test = base.extend<{ kettlePage: string }>({
  kettlePage: ['/tests/harness/timer.html', { option: true }],
});

type Rec = { id: string; completed: boolean; endedAt: number; startedAt: number; focusedMs: number; phase: string };
type TState = {
  status: string;
  phase: string;
  sessionId: string | null;
  endsAt: number | null;
  remainingMs: number;
  plannedMs: number;
  lastEnded: { sessionId: string; reason: string; at: number; whileAway: boolean } | null;
};
type Info = { leader: boolean; leaderMode: string; leaderForMs: number; scheduler: string; settling: boolean };

/* eslint-disable @typescript-eslint/no-explicit-any */

async function open(page: Page, url: string) {
  await page.goto(url);
  await page.waitForFunction(() => !!(window as any).__kettle?.timerInfo, null, { timeout: 20_000 });
  // The app may auto-start the next phase after a completion; tests look at one phase at a time.
  // The 3D nook runs on software GL here and starves the CPU; the timer is what's under test.
  await page.evaluate(() =>
    (window as any).__kettle.settings.getState().set({ autoStartBreaks: false, autoStartFocus: false, scene: 'off', motion: 'reduce' }),
  );
}
/** Phase length in minutes: the full app is much heavier than the harness, so give it more room. */
const secs = (kettlePage: string, n: number) => (kettlePage.includes('harness') ? n : n * 2) / 60;
/** How late a completion may land after its real end on this page. */
const lateBudget = (kettlePage: string) => (kettlePage.includes('harness') ? 400 : 1500);
const info = (page: Page): Promise<Info> => page.evaluate(() => (window as any).__kettle.timerInfo());
async function settledLeader(page: Page) {
  await page.waitForFunction(() => {
    const i = (window as any).__kettle.timerInfo();
    return i.leader && i.leaderForMs > 400 && !i.settling;
  }, null, { timeout: 10_000 });
}
const state = (page: Page): Promise<TState> =>
  page.evaluate(() => {
    const s = (window as any).__kettle.timer.getState();
    return { status: s.status, phase: s.phase, sessionId: s.sessionId, endsAt: s.endsAt, remainingMs: s.remainingMs, plannedMs: s.plannedMs, lastEnded: s.lastEnded };
  });
const start = (page: Page, minutes: number, intention = '') =>
  page.evaluate(([m, i]) => (window as any).__kettle.timer.getState().startFocus({ minutes: m, intention: i }), [minutes, intention] as const);
const storedSessions = (page: Page): Promise<Rec[]> =>
  page.evaluate(() => {
    try {
      return JSON.parse(localStorage.getItem('kettle:progress') ?? 'null')?.state?.sessions ?? [];
    } catch {
      return [];
    }
  });
const waitIdle = (page: Page, timeout = 12_000) =>
  expect.poll(async () => (await state(page)).status, { timeout, intervals: [100] }).toBe('idle');

/** Pretend the tab went to the background (the app only sees visibilityState). */
const setHidden = (page: Page, hidden: boolean) =>
  page.evaluate((h) => {
    Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => (h ? 'hidden' : 'visible') });
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => h });
    document.dispatchEvent(new Event('visibilitychange'));
  }, hidden);

test.describe('timer reliability', () => {
  test('start → reload mid-session → same session, same end, correct remaining; paused survives reload', async ({ page, kettlePage }) => {
    await open(page, kettlePage);
    await start(page, 1, 'Reload test');
    await page.waitForTimeout(1500);
    const before = await state(page);
    expect(before.status).toBe('running');

    await page.reload();
    await open(page, page.url());
    const after = await state(page);
    expect(after.status).toBe('running');
    expect(after.sessionId).toBe(before.sessionId);
    expect(after.endsAt).toBe(before.endsAt);
    // What's displayed agrees with the original end time (reload can take a while in a busy browser).
    const { rem, shown } = await page.evaluate(() => {
      const k = (window as any).__kettle;
      return { rem: k.timer.getState().endsAt - Date.now(), shown: k.timerView().seconds };
    });
    expect(rem).toBeGreaterThan(30_000);
    expect(rem).toBeLessThan(58_600);
    expect(Math.abs(shown * 1000 - rem)).toBeLessThan(1600);
    await expect(page).toHaveTitle(/^0:[0-5]\d · Focusing — Kettle$/);

    await page.evaluate(() => (window as any).__kettle.timer.getState().pause());
    const paused = await state(page);
    await page.waitForTimeout(1200);
    await page.reload();
    await open(page, page.url());
    const p2 = await state(page);
    expect(p2.status).toBe('paused');
    expect(p2.remainingMs).toBe(paused.remainingMs);
    await expect(page).toHaveTitle(/ · Paused — Kettle$/);

    await page.evaluate(() => (window as any).__kettle.timer.getState().end('user'));
    await expect(page).not.toHaveTitle(/ · /); // idle → the page's own title again
  });

  test('a phase that ended while the app was closed (3 h ago) completes once, at its real end, whileAway', async ({ page, kettlePage }) => {
    await open(page, kettlePage);
    const endsAt = await page.evaluate(() => {
      const planned = 25 * 60_000;
      const endsAt = Date.now() - 3 * 3600_000;
      const state = {
        status: 'running', phase: 'focus', plannedMs: planned, startedAt: endsAt - planned, endsAt, remainingMs: planned,
        pausedAt: null, pausedTotalMs: 0, completedInCycle: 0, intention: 'While away', tag: null, sessionId: 's_away_e2e', lastEnded: null,
      };
      localStorage.setItem('kettle:timer', JSON.stringify({ state, version: 1 }));
      return endsAt;
    });
    await page.reload();
    await open(page, page.url());
    await waitIdle(page);
    const s = await state(page);
    expect(s.lastEnded).toMatchObject({ sessionId: 's_away_e2e', reason: 'complete', at: endsAt, whileAway: true });
    await expect.poll(async () => (await storedSessions(page)).filter((r) => r.id === 's_away_e2e').length).toBe(1);
    const rec = (await storedSessions(page)).find((r) => r.id === 's_away_e2e')!;
    expect(rec).toMatchObject({ completed: true, endedAt: endsAt, focusedMs: 25 * 60_000 });
    if (kettlePage.includes('#/')) await expect.poll(() => page.evaluate(() => location.hash)).toBe('#/done');

    // Reloading again never completes it twice.
    await page.reload();
    await open(page, page.url());
    await page.waitForTimeout(800);
    expect((await storedSessions(page)).filter((r) => r.id === 's_away_e2e')).toHaveLength(1);
  });

  test('reload exactly at 0:00 records the session once', async ({ page, kettlePage }) => {
    await open(page, kettlePage);
    await settledLeader(page);
    await start(page, secs(kettlePage, 2.2));
    const { sessionId, endsAt } = await state(page);
    await page.waitForFunction((e) => Date.now() >= (e as number) - 60, endsAt, { polling: 10, timeout: 5000 });
    await page.reload();
    await open(page, page.url());
    await waitIdle(page);
    await page.waitForTimeout(600);
    expect((await storedSessions(page)).filter((r) => r.id === sessionId)).toHaveLength(1);
  });

  test('background: the worker completes on time even with main-thread timers frozen', async ({ page, kettlePage }) => {
    await open(page, kettlePage);
    await settledLeader(page);
    expect((await info(page)).scheduler).toBe('worker');
    await start(page, secs(kettlePage, 3));
    const { endsAt, sessionId } = await state(page);
    await page.evaluate(() => {
      const w = window as any;
      w.__kettle.timer.subscribe((s: any, p: any) => {
        if (p.status === 'running' && s.status === 'idle') w.__doneAt = Date.now();
      });
      // What an aggressively throttled background tab looks like: main-thread timers never fire.
      w.setTimeout = () => 0;
      w.setInterval = () => 0;
      w.requestAnimationFrame = () => 0;
      Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'hidden' });
      Object.defineProperty(document, 'hidden', { configurable: true, get: () => true });
      document.dispatchEvent(new Event('visibilitychange'));
    });
    await expect.poll(() => page.evaluate(() => (window as any).__doneAt ?? null), { timeout: 10_000, intervals: [200] }).not.toBeNull();
    const doneAt = await page.evaluate(() => (window as any).__doneAt as number);
    expect(doneAt - (endsAt as number)).toBeGreaterThanOrEqual(0);
    expect(doneAt - (endsAt as number)).toBeLessThan(lateBudget(kettlePage));
    expect((await storedSessions(page)).filter((r) => r.id === sessionId)).toHaveLength(1);
    await expect(page).toHaveTitle('Tea’s ready — Kettle');
  });

  test('hidden page: completion shows a warm notification; coming back restores the title', async ({ page, context, kettlePage }) => {
    await context.addInitScript(() => {
      const notes: { title: string; body?: string; tag?: string }[] = [];
      (window as any).__notes = notes;
      class FakeNotification {
        static permission = 'granted';
        static requestPermission = async () => 'granted';
        onclick: null | (() => void) = null;
        constructor(title: string, opts?: { body?: string; tag?: string }) {
          notes.push({ title, body: opts?.body, tag: opts?.tag });
        }
        close() {}
      }
      (window as any).Notification = FakeNotification;
    });
    await open(page, kettlePage);
    await settledLeader(page);
    const baseTitle = await page.title();
    await page.evaluate(() => (window as any).__kettle.settings.getState().set({ notifications: true }));
    await start(page, secs(kettlePage, 2), 'Essay');
    await setHidden(page, true);
    await expect.poll(() => page.evaluate(() => (window as any).__notes.length), { timeout: 10_000 }).toBe(1);
    const note = await page.evaluate(() => (window as any).__notes[0]);
    expect(note.title).toBe('The kettle’s whistling! Time for tea.');
    expect(note.body).toContain('Essay');
    expect(note.tag).toBe('kettle-timer');
    await expect(page).toHaveTitle('Tea’s ready — Kettle');
    await setHidden(page, false);
    await expect(page).toHaveTitle(baseTitle);
  });

  test('frozen tab (OS suspended it) across the end completes once on resume, at the real end', async ({ page, context, kettlePage }) => {
    await open(page, kettlePage);
    await settledLeader(page);
    await start(page, secs(kettlePage, 2));
    const { endsAt, sessionId } = await state(page);
    const cdp = await context.newCDPSession(page);
    await cdp.send('Page.setWebLifecycleState', { state: 'frozen' });
    await new Promise((r) => setTimeout(r, secs(kettlePage, 2) * 60_000 + 1500));
    await cdp.send('Page.setWebLifecycleState', { state: 'active' });
    await waitIdle(page);
    const s = await state(page);
    expect(s.lastEnded).toMatchObject({ sessionId, reason: 'complete', at: endsAt });
    await page.waitForTimeout(500);
    expect((await storedSessions(page)).filter((r) => r.id === sessionId)).toHaveLength(1);
  });
});

test.describe('multiple tabs', () => {
  test('two tabs show the same session live and exactly one records it', async ({ context, kettlePage }) => {
    const a = await context.newPage();
    await open(a, kettlePage);
    const b = await context.newPage();
    await open(b, kettlePage);
    await a.waitForTimeout(700);
    expect([await info(a), await info(b)].filter((i) => i.leader)).toHaveLength(1);

    await start(a, secs(kettlePage, 5), 'Two tabs');
    const { sessionId } = await state(a);
    await expect.poll(async () => (await state(b)).sessionId).toBe(sessionId);
    await expect(b).toHaveTitle(/^\d+:\d\d · Focusing — Kettle$/);

    await b.evaluate(() => (window as any).__kettle.timer.getState().pause());
    await expect.poll(async () => (await state(a)).status).toBe('paused');
    await a.evaluate(() => (window as any).__kettle.timer.getState().resume());
    await expect.poll(async () => (await state(b)).status).toBe('running');
    expect((await state(a)).endsAt).toBe((await state(b)).endsAt);

    await waitIdle(a);
    await waitIdle(b);
    await a.waitForTimeout(800);
    const sessions = (await storedSessions(a)).filter((r) => r.id === sessionId);
    expect(sessions).toHaveLength(1);
    expect(sessions[0].completed).toBe(true);
    // Each tab's in-memory progress agrees with storage.
    for (const p of [a, b]) {
      const n = await p.evaluate((sid) => (window as any).__kettle.progress.getState().sessions.filter((r: Rec) => r.id === sid).length, sessionId);
      expect(n).toBe(1);
    }
    if (kettlePage.includes('harness')) {
      const completes = async (p: Page) => p.evaluate(() => (window as any).__kettle.events.filter((e: any) => e.type === 'timer:complete').length);
      expect((await completes(a)) + (await completes(b))).toBe(1);
      const syncs = async (p: Page) => p.evaluate(() => (window as any).__kettle.events.filter((e: any) => e.type === 'timer:sync' && e.payload.kind === 'complete').length);
      expect((await syncs(a)) + (await syncs(b))).toBe(1);
    }
  });

  test('two tabs pressing start at the same moment converge on one session', async ({ context, kettlePage }) => {
    const a = await context.newPage();
    await open(a, kettlePage);
    const b = await context.newPage();
    await open(b, kettlePage);
    await a.waitForTimeout(700);
    await Promise.all([start(a, secs(kettlePage, 5), 'A'), start(b, secs(kettlePage, 5), 'B')]);
    await expect
      .poll(async () => {
        const [sa, sb] = [await state(a), await state(b)];
        return sa.status === 'running' && sa.sessionId === sb.sessionId;
      }, { timeout: 4000, intervals: [50] })
      .toBe(true);
    const { sessionId } = await state(a);
    await waitIdle(a);
    await waitIdle(b);
    await a.waitForTimeout(800);
    const all = await storedSessions(a);
    expect(all.filter((r) => r.completed)).toHaveLength(1);
    expect(all[0].id).toBe(sessionId);
  });

  test('closing the leader tab mid-session hands over; the other tab completes it once', async ({ context, kettlePage }) => {
    const a = await context.newPage();
    await open(a, kettlePage);
    const b = await context.newPage();
    await open(b, kettlePage);
    await a.waitForTimeout(700);
    const [leader, follower] = (await info(a)).leader ? [a, b] : [b, a];
    await start(follower, secs(kettlePage, 3));
    const { sessionId } = await state(follower);
    await expect.poll(async () => (await state(leader)).sessionId).toBe(sessionId);
    await leader.close();
    await expect.poll(async () => (await info(follower)).leader, { timeout: 5000 }).toBe(true);
    await waitIdle(follower);
    await follower.waitForTimeout(600);
    expect((await storedSessions(follower)).filter((r) => r.id === sessionId)).toHaveLength(1);
  });

  test('frozen leader: the other tab takes over at the end; the leader waking up later does not double-count', async ({ context, kettlePage }) => {
    const a = await context.newPage();
    await open(a, kettlePage);
    const b = await context.newPage();
    await open(b, kettlePage);
    await a.waitForTimeout(700);
    const [leader, follower] = (await info(a)).leader ? [a, b] : [b, a];
    await start(follower, secs(kettlePage, 2));
    const { sessionId } = await state(follower);
    await expect.poll(async () => (await state(leader)).sessionId).toBe(sessionId);
    const cdp = await context.newCDPSession(leader);
    await cdp.send('Page.setWebLifecycleState', { state: 'frozen' });
    await waitIdle(follower, 20_000);
    await cdp.send('Page.setWebLifecycleState', { state: 'active' });
    await waitIdle(leader);
    await leader.waitForTimeout(1200);
    expect((await storedSessions(follower)).filter((r) => r.id === sessionId)).toHaveLength(1);
    expect((await storedSessions(leader)).filter((r) => r.id === sessionId)).toHaveLength(1);
  });
});

test.describe('rendering budget', () => {
  test('useRemaining re-renders about once per displayed second', async ({ page, kettlePage }) => {
    test.skip(!kettlePage.includes('harness'), 'render counter lives in the harness');
    await open(page, kettlePage);
    await start(page, 1);
    await page.waitForTimeout(300);
    const r0 = await page.evaluate(() => (window as any).__kettle.renders());
    await page.waitForTimeout(3000);
    const r1 = await page.evaluate(() => (window as any).__kettle.renders());
    // ≈3 displayed seconds → ≈3 renders (×2 under StrictMode in dev). Never 5×/s.
    expect(r1 - r0).toBeGreaterThanOrEqual(2);
    expect(r1 - r0).toBeLessThanOrEqual(8);
  });
});

