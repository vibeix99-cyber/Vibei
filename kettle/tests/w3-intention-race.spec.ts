/**
 * F1 (`integrity:309`), deterministic: a tab that has not yet taken in another tab's new brew saves its intention.
 *
 *   KETTLE_PORT=5561 npx playwright test --project=chromium tests/w3-intention-race.spec.ts
 *
 * Two tabs of one profile, both on Today. Tab A's `storage` events for `kettle:timer` are held back (an init script,
 * registered before the app's own listener) and delivered on release, so "A has not yet taken in B's write" is exact,
 * with no load and no timing luck. Under load the same lag is 0.3–0.6 s (review/F1-ROOT-CAUSE.md).
 * Fails on base (`4d36939`, `f2298d3`): A's composer saves its whole idle timer over B's brew; it is undone in both
 * tabs and nothing is recorded.
 */
import { test, expect, type Page } from '@playwright/test';

/* eslint-disable @typescript-eslint/no-explicit-any */

/** Quiet, fast defaults written before the app boots (only on a fresh profile): no 3D scene, no auto-start. */
const PRIME = `(() => {
  try {
    if (localStorage.getItem('kettle:settings')) return;
    const state = { onboarded: true, scene: 'off', motion: 'reduce', autoStartBreaks: false, autoStartFocus: false, muted: true };
    localStorage.setItem('kettle:settings', JSON.stringify({ state, version: 1 }));
  } catch {
    /* storage blocked: the test will say so */
  }
})();`;

/**
 * Holds this tab's `storage` events for the timer key while `__f1.hold` is on (and for `kettle:settings` while
 * `__f1.holdSettings` is on); `__f1.release(key?)` delivers the held events (of that key) in order.
 */
const HOLD = `(() => {
  const held = [];
  const f1 = { hold: false, holdSettings: false, held: (key) => held.filter((h) => !key || h.key === key).length, release(key) {
    if (!key || key === 'kettle:timer') f1.hold = false;
    if (!key || key === 'kettle:settings') f1.holdSettings = false;
    const out = held.filter((h) => !key || h.key === key);
    for (const h of out) held.splice(held.indexOf(h), 1);
    for (const h of out) dispatchEvent(new StorageEvent('storage', { ...h, storageArea: localStorage }));
  } };
  window.__f1 = f1;
  addEventListener('storage', (e) => {
    if (!((f1.hold && e.key === 'kettle:timer') || (f1.holdSettings && e.key === 'kettle:settings'))) return;
    e.stopImmediatePropagation();
    held.push({ key: e.key, oldValue: e.oldValue, newValue: e.newValue, url: e.url });
  }, { capture: true });
})();`;

type T = { status: string; sessionId: string | null; startedAt: number | null; endsAt: number | null; intention: string };
const memory = (p: Page) => p.evaluate(() => { const s = (window as any).__kettle.timer.getState(); return { status: s.status, sessionId: s.sessionId, startedAt: s.startedAt, endsAt: s.endsAt, intention: s.intention }; }) as Promise<T>;
const stored = (p: Page) => p.evaluate(() => JSON.parse(localStorage.getItem('kettle:timer') ?? 'null')) as Promise<{ state: T; version: number } | null>;
const hash = (p: Page) => p.evaluate(() => location.hash);
const records = (p: Page, sid: string) =>
  p.evaluate((id) => ({
    stored: (JSON.parse(localStorage.getItem('kettle:progress') ?? 'null')?.state?.sessions ?? []).filter((r: any) => r.id === id).length,
    memory: (window as any).__kettle.progress.getState().sessions.filter((r: any) => r.id === id).length,
  }), sid);

async function openToday(p: Page) {
  await p.goto('/?debug#/');
  await p.waitForFunction(() => !!(window as any).__kettle?.timerInfo);
  await expect(p.getByRole('textbox', { name: /What are you brewing/ })).toBeVisible();
}

test('a tab that has not yet taken in another tab’s new brew saves its intention: the brew survives in both tabs, one record', async ({ context }) => {
  test.setTimeout(60_000);
  await context.addInitScript(PRIME);
  await context.addInitScript(HOLD);
  const a = await context.newPage();
  await openToday(a);
  const b = await context.newPage();
  await openToday(b);
  // Both Todays have mounted and made their composer's first intention save (150 ms after mount).
  await a.waitForTimeout(600);
  expect((await memory(a)).status).toBe('idle');
  expect((await memory(b)).status).toBe('idle');

  // From here on, A does not take in other tabs' timer writes until released.
  await a.evaluate(() => ((window as any).__f1.hold = true));

  // Tab B starts a brew (a real 6-second one: both tabs keep real time). Storage holds it, running.
  await b.evaluate(() => (window as any).__kettle.timer.getState().startFocus({ minutes: 0.1, intention: 'Chapter 3 notes' }));
  const brew = await memory(b);
  expect(brew.status).toBe('running');
  await expect.poll(async () => (await stored(a))?.state.sessionId).toBe(brew.sessionId);
  await expect.poll(() => a.evaluate(() => (window as any).__f1.held())).toBeGreaterThan(0);
  expect(await memory(a), 'precondition: A has not taken in B’s brew').toMatchObject({ status: 'idle', sessionId: null });

  // A saves its intention: a real keystroke in its Today composer (the composer's 150 ms sync to the timer).
  await a.bringToFront();
  await a.getByRole('textbox', { name: /What are you brewing/ }).pressSequentially('Reply to Sam');
  await expect.poll(async () => (await memory(a)).intention, { message: 'A’s composer has saved its intention' }).toBe('Reply to Sam');
  expect(await memory(a), 'A is still behind (its storage events are held)').toMatchObject({ status: 'idle', sessionId: null });

  // Storage still holds B's brew, as B wrote it.
  const after = await stored(a);
  expect(after?.version).toBe(1);
  expect(after?.state, 'storage still holds B’s running brew').toMatchObject({
    status: 'running',
    sessionId: brew.sessionId,
    endsAt: brew.endsAt,
    startedAt: brew.startedAt,
    intention: 'Chapter 3 notes',
  });

  // A's held events arrive. Both tabs end with the brew.
  await a.evaluate(() => (window as any).__f1.release());
  for (const p of [a, b]) {
    await expect.poll(() => hash(p)).toBe('#/focus');
    await expect.poll(async () => (await memory(p)).sessionId).toBe(brew.sessionId);
    expect((await memory(p)).status).toBe('running');
  }

  // It completes, once: both tabs on the summary, one record in storage and in each tab.
  for (const p of [a, b]) await expect.poll(() => hash(p), { timeout: 20_000 }).toBe('#/done');
  await a.waitForTimeout(1000);
  for (const p of [a, b]) expect(await records(p, brew.sessionId!)).toEqual({ stored: 1, memory: 1 });
});

test('F1X-D1: B picks another brew length and starts; A (idle, its timer events held) takes in the length change first: the brew survives, one record', async ({ context }) => {
  test.setTimeout(60_000);
  await context.addInitScript(PRIME);
  await context.addInitScript(HOLD);
  const a = await context.newPage();
  await openToday(a);
  const b = await context.newPage();
  await openToday(b);
  await a.waitForTimeout(600);
  expect((await memory(a)).status).toBe('idle');

  // A's timer and settings events are held.
  await a.evaluate(() => {
    const f1 = (window as any).__f1;
    f1.hold = true;
    f1.holdSettings = true;
  });
  // B: the person picks another brew length (kettle:settings; B's own idle length follows), then starts a 6-second brew.
  await b.evaluate(() => {
    const k = (window as any).__kettle;
    k.settings.getState().set({ focusMin: 50 });
    k.timer.getState().startFocus({ minutes: 0.1, intention: 'Chapter 3 notes' });
  });
  const brew = await memory(b);
  expect(brew.status).toBe('running');
  await expect.poll(async () => (await stored(a))?.state.sessionId).toBe(brew.sessionId);
  await expect.poll(() => a.evaluate(() => (window as any).__f1.held('kettle:settings'))).toBeGreaterThan(0);
  await expect.poll(() => a.evaluate(() => (window as any).__f1.held('kettle:timer'))).toBeGreaterThan(0);
  // Now A takes in the length change, B's brew already in storage but not yet taken in by A (the event order of a tab
  // that is a moment behind). Its idle timer follows the new length.
  await a.evaluate(() => (window as any).__f1.release('kettle:settings'));
  await expect.poll(() => a.evaluate(() => (window as any).__kettle.timer.getState().plannedMs), { message: 'A’s idle length followed the settings change' }).toBe(50 * 60_000);
  expect(await memory(a), 'precondition: A has not taken in B’s brew').toMatchObject({ status: 'idle', sessionId: null });
  await a.waitForTimeout(300); // B would mirror any write A made
  expect((await memory(b)).status, 'B’s brew is still running in B (not undone by A’s length sync)').toBe('running');

  const after = await stored(a);
  expect(after?.state, 'storage still holds B’s running brew').toMatchObject({ status: 'running', sessionId: brew.sessionId, endsAt: brew.endsAt, startedAt: brew.startedAt, intention: 'Chapter 3 notes' });

  await a.evaluate(() => (window as any).__f1.release());
  for (const p of [a, b]) {
    await expect.poll(() => hash(p)).toBe('#/focus');
    await expect.poll(async () => (await memory(p)).sessionId).toBe(brew.sessionId);
  }
  for (const p of [a, b]) await expect.poll(() => hash(p), { timeout: 20_000 }).toBe('#/done');
  await a.waitForTimeout(1000);
  for (const p of [a, b]) expect(await records(p, brew.sessionId!)).toEqual({ stored: 1, memory: 1 });
});
