// Minimal reproducer (scratch, not part of tests/): starting a brew and ending it swaps the whole route layer (Today with
// its shell > the session > Today), so the leaving layer's NoticeStrip renders with Leaving = true. On base that skips
// useIsPresent() and React logs the hook-order error; on the fix it must not.
import { test, expect } from '@playwright/test';
for (let run = 1; run <= 3; run++)
  test(`start a brew, end it, back on Today (run ${run})`, async ({ page }) => {
    await page.goto('/?debug&seed=newbie&onboarded=1#/');
    // liveness control: the console hook must see this one error on every run, on base and on the fix
    await page.evaluate(() => console.error('TH-LIVENESS control line'));
    await page.waitForFunction(() => !!(window as any).__kettle?.timerInfo?.()?.leader, null, { timeout: 30_000 });
    await page.waitForTimeout(800);
    await page.getByRole('button', { name: /^Put the kettle on · / }).click();
    await page.waitForFunction(() => location.hash === '#/focus');
    await page.waitForTimeout(1500);
    await page.evaluate(() => (window as any).__kettle.ff(3 * 60_000));
    await page.waitForTimeout(500);
    await page.evaluate(() => (window as any).__kettle.timer.getState().end('user'));
    await page.waitForFunction(() => location.hash === '#/', null, { timeout: 15_000 });
    await page.waitForTimeout(1500);
    expect(await page.evaluate(() => document.querySelectorAll('[data-notice-strip]').length)).toBeGreaterThan(0);
  });
