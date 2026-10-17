/**
 * W3R2 (stale-tab guard), deterministic, in a real browser: a person acts in a tab that has not yet taken in the other
 * tab's newer brew. The action applies to the current brew, or the tab refreshes first; the other tab's brew is never
 * discarded.
 *
 *   KETTLE_PORT=5581 npx playwright test --project=chromium tests/w3r2-stale-tab.spec.ts
 *
 * Two tabs of one profile. Tab Z's `storage` events for `kettle:timer` are held (an init script registered before the
 * app's own listener, as in w3-intention-race.spec.ts) and delivered on release, so "Z is behind" is exact. Tab A acts
 * through the debug API; the person in Z uses Focus's real buttons (and Today's composer, Enter).
 * Fails on `494748b` (:5560): Z saves its old copy of the timer whole over A's brew.
 */
import { test, expect, type Page, type BrowserContext } from '@playwright/test';

/* eslint-disable @typescript-eslint/no-explicit-any */

const MIN = 60_000;

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

/** Holds this tab's `storage` events for the timer key while `__w3r2.hold` is on; `release()` delivers them in order. */
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

type T = { status: string; sessionId: string | null; startedAt: number | null; endsAt: number | null; plannedMs: number; remainingMs: number; intention: string };
const memory = (p: Page) =>
  p.evaluate(() => {
    const s = (window as any).__kettle.timer.getState();
    return { status: s.status, sessionId: s.sessionId, startedAt: s.startedAt, endsAt: s.endsAt, plannedMs: s.plannedMs, remainingMs: s.remainingMs, intention: s.intention };
  }) as Promise<T>;
const storedRaw = (p: Page) => p.evaluate(() => localStorage.getItem('kettle:timer'));
const stored = async (p: Page) => JSON.parse((await storedRaw(p)) ?? 'null') as { state: T; version: number } | null;
const hash = (p: Page) => p.evaluate(() => location.hash);
const act = (p: Page, fn: string) => p.evaluate((src) => new Function('k', src)((window as any).__kettle), fn);

async function openToday(p: Page) {
  await p.goto('/?debug#/');
  await p.waitForFunction(() => !!(window as any).__kettle?.timerInfo);
  await expect(p.getByRole('textbox', { name: /What are you brewing/ })).toBeVisible();
}

/** Two tabs on Today, idle and in step; Z's timer events can then be held. */
async function twoTabs(context: BrowserContext) {
  await context.addInitScript(PRIME);
  await context.addInitScript(HOLD);
  const a = await context.newPage();
  await openToday(a);
  const z = await context.newPage();
  await openToday(z);
  await a.waitForTimeout(600); // both composers have made their mount-time sync
  return { a, z };
}

/** A starts a 10-minute brew; both tabs show it on Focus. */
async function brewInBoth(a: Page, z: Page, intention: string) {
  await act(a, `k.timer.getState().startFocus({ minutes: 10, intention: ${JSON.stringify(intention)} })`);
  const brew = await memory(a);
  for (const p of [a, z]) {
    await expect.poll(() => hash(p)).toBe('#/focus');
    await expect.poll(async () => (await memory(p)).sessionId).toBe(brew.sessionId);
  }
  return brew;
}

/** From here Z does not take in A's timer writes until released. */
const holdZ = (z: Page) => z.evaluate(() => ((window as any).__w3r2.hold = true));
const releaseZ = (z: Page) => z.evaluate(() => (window as any).__w3r2.release());
/** A's write has reached storage and Z's event for it is held. */
async function zBehind(z: Page, check: (s: T) => boolean) {
  await expect.poll(async () => { const s = await stored(z); return !!s && check(s.state); }).toBe(true);
  await expect.poll(() => z.evaluate(() => (window as any).__w3r2.held())).toBeGreaterThan(0);
}

/** A ends its brew and starts another (Start over a running brew ends it first). Z, held, still shows the first. */
async function aReplacesBrew(a: Page, z: Page, first: T) {
  await holdZ(z);
  await act(a, `k.timer.getState().startFocus({ minutes: 10, intention: 'Inbox' })`);
  const second = await memory(a);
  expect(second.sessionId).not.toBe(first.sessionId);
  await zBehind(z, (s) => s.sessionId === second.sessionId);
  expect(await memory(z), 'precondition: Z still shows the first brew').toMatchObject({ status: 'running', sessionId: first.sessionId });
  return { second, raw: await storedRaw(z) };
}

/** After Z's action: A's newer brew is still running in A and in storage (any write by Z would have reached A). */
async function newerBrewSurvives(a: Page, z: Page, brew: T, raw: string | null) {
  await a.waitForTimeout(400);
  expect(await storedRaw(a), 'storage still holds A’s brew, as A wrote it').toBe(raw);
  expect(await memory(a), 'A’s brew is still running in A').toMatchObject({ status: 'running', sessionId: brew.sessionId, endsAt: brew.endsAt });
  expect(await hash(a)).toBe('#/focus');
  await releaseZ(z);
  for (const p of [a, z]) {
    await expect.poll(async () => (await memory(p)).sessionId).toBe(brew.sessionId);
    expect(await memory(p)).toMatchObject({ status: 'running', endsAt: brew.endsAt, intention: brew.intention });
    expect(await hash(p)).toBe('#/focus');
  }
  await expect(z.getByText(brew.intention, { exact: true }).first()).toBeVisible();
}

test('pause in the lagging tab: the brew current in storage pauses, with its real remaining time (the other tab’s +5 kept)', async ({ context }) => {
  test.setTimeout(60_000);
  const { a, z } = await twoTabs(context);
  const brew = await brewInBoth(a, z, 'Chapter 3 notes');
  await holdZ(z);
  await act(a, `k.timer.getState().addTime(5 * 60000)`);
  await zBehind(z, (s) => s.plannedMs === 15 * MIN);
  expect((await memory(z)).plannedMs, 'precondition: Z has not taken in A’s +5').toBe(10 * MIN);

  await z.bringToFront();
  await z.getByRole('button', { name: 'Pause', exact: true }).click();
  await expect.poll(async () => (await stored(z))?.state.status).toBe('paused');
  const s = (await stored(z))!.state;
  expect(s, 'paused: the same brew, with A’s +5').toMatchObject({ status: 'paused', sessionId: brew.sessionId, plannedMs: 15 * MIN });
  expect(s.remainingMs, 'its real remaining time (over 10 minutes: the +5 is in it)').toBeGreaterThan(13 * MIN);

  await releaseZ(z);
  for (const p of [a, z]) {
    await expect.poll(async () => (await memory(p)).status).toBe('paused');
    expect(await memory(p)).toMatchObject({ sessionId: brew.sessionId, plannedMs: 15 * MIN, remainingMs: s.remainingMs });
  }
  await expect(a.getByRole('button', { name: 'Resume', exact: true })).toBeVisible();
});

test('add 5 in the lagging tab after the other tab ended its brew and started another: nothing added, the newer brew untouched, the lagging tab shows it', async ({ context }) => {
  test.setTimeout(60_000);
  const { a, z } = await twoTabs(context);
  const first = await brewInBoth(a, z, 'Essay');
  const { second, raw } = await aReplacesBrew(a, z, first);

  await z.bringToFront();
  // SG-D3: Z must not say a +5 was added ("+5 min · whistles at …"), however briefly.
  await z.evaluate(() => {
    const w = window as any;
    w.__sawFive = /whistles at/.test(document.body.textContent ?? '');
    new MutationObserver(() => {
      if (/whistles at/.test(document.body.textContent ?? '')) w.__sawFive = true;
    }).observe(document.body, { subtree: true, childList: true, characterData: true });
  });
  expect(await z.evaluate(() => (window as any).__sawFive), 'precondition: no +5 note shown').toBe(false);
  await z.getByRole('button', { name: 'Add 5 minutes', exact: true }).click();
  await expect.poll(async () => (await memory(z)).sessionId, { message: 'Z now shows the current brew' }).toBe(second.sessionId);
  expect((await memory(z)).plannedMs, 'nothing was added to it').toBe(10 * MIN);
  await newerBrewSurvives(a, z, second, raw);
  expect(await z.evaluate(() => (window as any).__sawFive), 'no “+5 min · whistles at …” note in Z (nothing was added)').toBe(false);
});

test('Next brew in the lagging tab after the other tab already did: it joins that brew; ending it there later still says so and goes home', async ({ context }) => {
  test.setTimeout(60_000);
  const { a, z } = await twoTabs(context);
  await act(a, `k.timer.getState().startBreak()`);
  const brk = await memory(a);
  for (const p of [a, z]) {
    await expect.poll(() => hash(p)).toBe('#/focus');
    await expect.poll(async () => (await memory(p)).sessionId).toBe(brk.sessionId);
  }
  await holdZ(z);
  // A: Next brew (as flow.startNextBrew does: end the break, then start).
  await act(a, `k.timer.getState().end('skip'); k.timer.getState().startFocus({ minutes: 10, intention: 'Inbox' })`);
  const next = await memory(a);
  await zBehind(z, (s) => s.sessionId === next.sessionId);
  expect(await memory(z), 'precondition: Z still shows the break').toMatchObject({ status: 'running', sessionId: brk.sessionId });
  const raw = await storedRaw(z);

  await z.bringToFront();
  await z.getByRole('button', { name: 'Start next brew', exact: true }).click();
  await expect.poll(async () => (await memory(z)).sessionId, { message: 'Z joined A’s brew' }).toBe(next.sessionId);
  await newerBrewSurvives(a, z, next, raw);

  // SG-D2: the person ends the joined brew in Z. Its stop is not swallowed: the usual toast, and home.
  await z.getByRole('button', { name: 'End session', exact: true }).click();
  const sheet = z.getByRole('dialog');
  await expect(sheet).toBeVisible();
  await sheet.getByRole('button', { name: 'End session', exact: true }).click();
  await expect(z.getByText('Kettle’s off. See you soon.').first(), 'the stop’s toast in Z').toBeVisible();
  await expect.poll(() => hash(z), { message: 'Z went home' }).toBe('#/');
});

test('end in the lagging tab after the other tab ended its brew and started another: the newer brew is not ended, the lagging tab shows it', async ({ context }) => {
  test.setTimeout(60_000);
  const { a, z } = await twoTabs(context);
  const first = await brewInBoth(a, z, 'Essay');
  const { second, raw } = await aReplacesBrew(a, z, first);

  await z.bringToFront();
  await z.getByRole('button', { name: 'End session', exact: true }).click();
  const sheet = z.getByRole('dialog');
  await expect(sheet).toBeVisible();
  await sheet.getByRole('button', { name: 'End session', exact: true }).click();
  await expect.poll(async () => (await memory(z)).sessionId, { message: 'Z now shows the current brew' }).toBe(second.sessionId);
  expect((await memory(z)).status).toBe('running');
  await newerBrewSurvives(a, z, second, raw);
});

test('start in the lagging tab (Today, Enter) while the other tab’s brew runs: it does not replace that brew; it joins and shows it', async ({ context }) => {
  test.setTimeout(60_000);
  const { a, z } = await twoTabs(context);
  await holdZ(z);
  await act(a, `k.timer.getState().startFocus({ minutes: 10, intention: 'Chapter 3 notes' })`);
  const brew = await memory(a);
  await zBehind(z, (s) => s.sessionId === brew.sessionId);
  expect(await memory(z), 'precondition: Z is idle on Today').toMatchObject({ status: 'idle', sessionId: null });
  const raw = await storedRaw(z);

  await z.bringToFront();
  const field = z.getByRole('textbox', { name: /What are you brewing/ });
  await field.pressSequentially('Reply to Sam');
  await z.waitForTimeout(400); // the composer's 150 ms sync has run (it writes nothing over another brew, F1)
  expect(await storedRaw(z), 'Z’s typing did not touch A’s brew').toBe(raw);
  await field.press('Enter');
  await expect.poll(() => hash(z), { message: 'Z joined the brew (Focus)' }).toBe('#/focus');
  expect(await memory(z)).toMatchObject({ status: 'running', sessionId: brew.sessionId, intention: 'Chapter 3 notes' });
  await newerBrewSurvives(a, z, brew, raw);
});
