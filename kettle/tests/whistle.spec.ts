/**
 * Whistle, mute and notification behaviour that Chromium can prove (I05). Real app, debug seeds.
 *
 *   KETTLE_PORT=5222 npx playwright test tests/whistle.spec.ts --project=chromium
 *
 * Sound is counted at the audio engine (`window.__kettleAudio.engine`, exposed with ?debug): `play` requests and the
 * voices actually scheduled into the WebAudio graph. Nobody listens here: what a phone speaker does (silent switch,
 * lock screen, Bluetooth) is on docs/REAL_DEVICE_CHECKLIST.md.
 */
import { test, expect, type Page } from '@playwright/test';
import { open } from './a11y-probes.mjs';

/* eslint-disable @typescript-eslint/no-explicit-any */
const base = (u: string | undefined) => u ?? 'http://127.0.0.1:5183';

/** Count sound requests and scheduled voices by name from now on. */
async function spy(page: Page) {
  await page.evaluate(() => {
    const w = window as any;
    const e = w.__kettleAudio.engine;
    w.__sounds = { requested: [] as string[], scheduled: [] as string[] };
    const play = e.play.bind(e);
    e.play = (n: string, o: unknown) => {
      w.__sounds.requested.push(n);
      return play(n, o);
    };
    const schedule = e.schedule.bind(e);
    e.schedule = (n: string, o: unknown) => {
      w.__sounds.scheduled.push(n);
      return schedule(n, o);
    };
  });
}
const sounds = (page: Page) => page.evaluate(() => (window as any).__sounds as { requested: string[]; scheduled: string[] });
const count = (list: string[], name: string) => list.filter((n) => n === name).length;
const audioState = (page: Page) => page.evaluate(() => (window as any).__kettleAudio.engine.debugState() as { state: string; unlocked: boolean });
const settings = (page: Page, patch: Record<string, unknown>) => page.evaluate((p) => (window as any).__kettle.settings.getState().set(p), patch);

async function openWithSound(page: Page, baseURL: string | undefined, seed = 'veteran') {
  await open(page, base(baseURL), { seed, scene: 'off' });
  await settings(page, { muted: false, masterVolume: 0.8, sfxVolume: 0.7 });
  await spy(page);
}

test('no audio context before the first gesture; the first tap unlocks it', async ({ page, baseURL }) => {
  await openWithSound(page, baseURL);
  expect((await audioState(page)).state).toBe('none');
  await page.getByRole('button', { name: /^Study/ }).click();
  await expect.poll(async () => (await audioState(page)).unlocked).toBe(true);
  await expect.poll(async () => (await audioState(page)).state).toBe('running');
});

test('the whistle sounds once at completion, and not again after a reload of the summary', async ({ page, baseURL }) => {
  await openWithSound(page, baseURL);
  await page.getByRole('button', { name: /Put the kettle on/ }).click();
  await page.waitForFunction(() => location.hash === '#/focus');
  await page.evaluate(() => (window as any).__kettle.finish());
  await expect(page.getByText('Tea’s ready!')).toBeVisible();
  await page.getByRole('button', { name: /Tea time|Long tea break/ }).waitFor({ timeout: 30_000 });
  await page.waitForTimeout(1500);
  const s = await sounds(page);
  expect(count(s.requested, 'complete')).toBe(1);
  expect(count(s.scheduled, 'complete')).toBe(1);

  // Reload without the seed parameter (a seed would reset the profile): the stored summary comes back.
  await page.goto(`${base(baseURL)}/?debug#/done`);
  await page.waitForFunction(() => !!(window as any).__kettleAudio);
  await expect(page.getByRole('heading', { name: /minutes brewed/ })).toBeVisible();
  await spy(page);
  await page.mouse.click(5, 5); // a gesture after the reload: the context could play if anything asked it to
  await page.waitForTimeout(2500);
  expect(page.url()).toContain('#/done');
  expect(count((await sounds(page)).requested, 'complete')).toBe(0);
});

test('late return: one whistle, the while-away summary, nothing more on later visibility changes', async ({ page, baseURL }) => {
  await openWithSound(page, baseURL);
  await page.getByRole('button', { name: /Put the kettle on/ }).click();
  await page.waitForFunction(() => location.hash === '#/focus');
  // The page slept through the end (phone locked, tab frozen): the clock jumps 20 min past it, then a tick lands.
  await page.evaluate(() => {
    const k = (window as any).__kettle;
    const t = k.timer.getState();
    k.clock.advance(t.endsAt - k.clock.now() + 20 * 60_000);
    k.timer.getState().tick();
  });
  await page.waitForFunction(() => location.hash === '#/done');
  await expect(page.getByText(/whistled while you were away/)).toBeVisible();
  for (const v of ['hidden', 'visible', 'hidden', 'visible']) {
    await page.evaluate((state) => {
      Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => state });
      document.dispatchEvent(new Event('visibilitychange'));
    }, v);
    await page.waitForTimeout(300);
  }
  await page.waitForTimeout(1500);
  expect(count((await sounds(page)).requested, 'complete')).toBe(1);
});

test('another tab in front (page hidden): the whistle is still scheduled once', async ({ page, baseURL }) => {
  await openWithSound(page, baseURL);
  await page.getByRole('button', { name: /Put the kettle on/ }).click();
  await page.waitForFunction(() => location.hash === '#/focus');
  await page.waitForTimeout(1000);
  // What the engine sees when the user switches tabs on a computer (a locked phone freezes the page instead: that
  // case is the late return above, and real phones are on docs/REAL_DEVICE_CHECKLIST.md).
  await page.evaluate(() => {
    Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'hidden' });
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => true });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await page.waitForTimeout(500);
  await page.evaluate(() => (window as any).__kettle.finish());
  await page.waitForTimeout(3000);
  const s = await sounds(page);
  expect(count(s.requested, 'complete')).toBe(1);
  expect(count(s.scheduled, 'complete')).toBe(1);
});

test('muted: no sound at all, the visual whistle and summary remain', async ({ page, baseURL }) => {
  await openWithSound(page, baseURL);
  await settings(page, { muted: true });
  await page.getByRole('button', { name: /Put the kettle on/ }).click();
  await page.waitForFunction(() => location.hash === '#/focus');
  await page.evaluate(() => (window as any).__kettle.finish());
  await expect(page.getByText('Tea’s ready!')).toBeVisible();
  await expect(page.locator('[data-state="whistle"]').first()).toBeAttached();
  await page.getByRole('button', { name: /Tea time|Long tea break/ }).waitFor({ timeout: 30_000 });
  await expect(page.getByRole('heading', { name: /minutes brewed/ })).toBeVisible();
  await page.waitForTimeout(1500);
  expect((await sounds(page)).scheduled).toEqual([]);
  // The Sounds row says so where the switch is.
  await page.evaluate(() => (window as any).__kettle.navigate('/settings'));
  await expect(page.getByText('Everything’s quiet. The kettle still shows when it whistles.')).toBeVisible();
});

/** A controllable Notification permission (Chromium's real prompt can't be answered in a test). */
async function fakePermission(page: Page, initial: 'default' | 'granted' | 'denied' | 'unsupported') {
  await page.addInitScript((initial) => {
    const w = window as any;
    if (initial === 'unsupported') {
      delete w.Notification;
      return;
    }
    w.__perm = { state: initial, answer: 'granted', asked: 0 };
    class FakeNotification {
      static get permission() {
        return w.__perm.state;
      }
      static async requestPermission() {
        w.__perm.asked++;
        w.__perm.state = w.__perm.answer;
        return w.__perm.state;
      }
      onclick: unknown = null;
      constructor(public title: string) {
        w.__perm.shown = (w.__perm.shown ?? 0) + 1;
      }
      close() {}
    }
    w.Notification = FakeNotification;
  }, initial);
}

test('notification permission is asked only from the Nudges switch: not on load, not before or after the first brew', async ({ page, baseURL }) => {
  await fakePermission(page, 'default');
  await open(page, base(baseURL), { seed: 'fresh', route: '/welcome' });
  await page.getByRole('button', { name: /Start a 15-min brew/ }).click();
  await page.waitForFunction(() => location.hash === '#/focus');
  await page.evaluate(() => (window as any).__kettle.finish());
  await page.getByRole('button', { name: /Tea time|Long tea break/ }).waitFor({ timeout: 30_000 });
  expect(await page.evaluate(() => (window as any).__perm.asked)).toBe(0);

  await page.evaluate(() => (window as any).__kettle.navigate('/settings'));
  const nudges = page.getByRole('switch', { name: 'Nudges' });
  await expect(nudges).toBeEnabled();
  await nudges.click();
  await expect(nudges).toBeChecked();
  expect(await page.evaluate(() => (window as any).__perm.asked)).toBe(1);
  await expect(page.getByRole('button', { name: 'Send a test nudge' })).toBeVisible();
});

test('denied: Settings says so, shows the browser path, and turning it on later works', async ({ page, baseURL }) => {
  await fakePermission(page, 'denied');
  await open(page, base(baseURL), { seed: 'veteran', route: '/settings' });
  const nudges = page.getByRole('switch', { name: 'Nudges' });
  await expect(nudges).toBeDisabled();
  await expect(nudges).not.toBeChecked();
  await expect(page.getByText('Blocked in your browser settings.')).toBeVisible();
  await expect(page.getByText(/To turn nudges on:/)).toBeVisible();
  await expect(page.getByText(/Site settings/)).toBeVisible();

  // The user allows it in the browser, comes back to the tab.
  await page.evaluate(() => {
    (window as any).__perm.state = 'granted';
    window.dispatchEvent(new Event('focus'));
  });
  await expect(nudges).toBeEnabled();
  await expect(page.getByText(/To turn nudges on:/)).toBeHidden();
  await nudges.click();
  await expect(nudges).toBeChecked();
  // The one platform limit, stated once at the switch: no promise of lock-screen delivery.
  await expect(page.getByText(/A locked phone may hold the nudge until you’re back/)).toBeVisible();
  await page.getByRole('button', { name: 'Send a test nudge' }).click();
  await expect(page.getByRole('button', { name: /Sent/ })).toBeVisible();
});

test('unsupported: the switch is off and disabled, and says what happens instead', async ({ page, baseURL }) => {
  await fakePermission(page, 'unsupported');
  await open(page, base(baseURL), { seed: 'veteran', route: '/settings' });
  const nudges = page.getByRole('switch', { name: 'Nudges' });
  await expect(nudges).toBeDisabled();
  await expect(page.getByText('This browser can’t show notifications. With sound on, Kettle chimes while it’s on screen.')).toBeVisible();
});
