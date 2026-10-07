/**
 * Accessibility regression gate (I04). Phone viewport (390×844, touch), real app, debug seeds.
 *
 *   KETTLE_PORT=5222 npx playwright test tests/a11y.spec.ts --project=chromium
 *
 * - axe-core (WCAG 2.0–2.2 A/AA): no serious or critical violation in any journey state or destination, both themes
 * - pointer targets: every operable target is ≥ 24×24 CSS px (hit area as the browser resolves it) or meets the
 *   WCAG 2.5.8 spacing/inline exception
 * - keyboard: the critical journey works with keys only, every focused control shows a focus indicator and is not
 *   hidden behind sticky chrome, sheets keep focus inside, close on Esc and give focus back to their opener
 * - short screens: every control can be scrolled clear of the docked start / summary footer / tab bar at 375×667
 *
 * The full measured audit (contrast from pixels, 200 % text, keyboard-open, reduced motion, tables) is
 * review/product-excellence/tools/a11y-audit.mjs.
 */
import { test, expect, type Page } from '@playwright/test';
import { AxeBuilder } from '@axe-core/playwright';
import { INTERACTIVE, PAGES, open, walkJourney, probeTargets, probeFocus, probeReach } from './a11y-probes.mjs';

/* eslint-disable @typescript-eslint/no-explicit-any */
type Focus = { name: string; tag: string; role: string; focusVisible: boolean; indicator: string; obscured: boolean; route: string };

const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];
const phone = { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true };
test.use(phone);
test.describe.configure({ mode: 'serial' });

const base = (u: string | undefined) => u ?? 'http://127.0.0.1:5183';

async function serious(page: Page, where: string, out: string[]) {
  const r = await new AxeBuilder({ page }).withTags(TAGS).analyze();
  for (const v of r.violations) {
    if (v.impact === 'serious' || v.impact === 'critical') out.push(`${where}: ${v.id} (${v.impact}) ${v.nodes.map((n) => n.target.join(' ')).slice(0, 3).join(', ')}`);
  }
}

for (const theme of ['light', 'dark'] as const) {
  test(`axe: no serious/critical violations in any state (${theme})`, async ({ page, baseURL }) => {
    test.setTimeout(300_000);
    const out: string[] = [];
    await walkJourney(page, base(baseURL), (id: string, p: Page) => serious(p, id, out), { theme });
    for (const pg of PAGES) {
      await open(page, base(baseURL), { seed: pg.seed, route: pg.route, theme, settle: pg.settle ?? 1500 });
      await serious(page, pg.id, out);
    }
    expect(out).toEqual([]);
  });
}

test('pointer targets are at least 24×24 px or meet a WCAG 2.5.8 exception', async ({ page, baseURL }) => {
  test.setTimeout(300_000);
  const out: string[] = [];
  const check = async (id: string, p: Page) => {
    const t = (await p.evaluate(probeTargets, INTERACTIVE)) as { name: string; box: number[]; result: string }[];
    for (const x of t) if (x.result === 'fail') out.push(`${id}: "${x.name}" ${x.box.join('×')}`);
  };
  await walkJourney(page, base(baseURL), check);
  for (const pg of PAGES) {
    await open(page, base(baseURL), { seed: pg.seed, route: pg.route, settle: pg.settle ?? 1500 });
    await check(pg.id, page);
  }
  expect(out).toEqual([]);
});

test('short screen (375×667): every control can be scrolled clear of sticky chrome, no sideways scroll', async ({ page, baseURL }) => {
  test.setTimeout(300_000);
  await page.setViewportSize({ width: 375, height: 667 });
  const out: string[] = [];
  const check = async (id: string, p: Page) => {
    const r = (await p.evaluate(probeReach, INTERACTIVE)) as { covered: { name: string; by: string }[]; hScroll: number };
    for (const c of r.covered) out.push(`${id}: "${c.name}" stays under ${c.by}`);
    if (r.hScroll > 0) out.push(`${id}: horizontal scroll ${r.hScroll}px`);
  };
  await walkJourney(page, base(baseURL), check, { only: ['home', 'focus', 'paused', 'summary', 'summary-details', 'break', 'break-over'] });
  for (const pg of PAGES) {
    await open(page, base(baseURL), { seed: pg.seed, route: pg.route, settle: pg.settle ?? 1500 });
    await check(pg.id, page);
  }
  expect(out).toEqual([]);
});

// ---------------------------------------------------------------- keyboard journey
type Stop = Focus & { box: { x: number; y: number; width: number; height: number }; ring: boolean };
const focus = (page: Page) => page.evaluate(probeFocus) as Promise<Stop>;
/** Does focusing the element visibly change its pixels? (focused shot vs blurred shot, then focus goes back) */
async function ringVisible(page: Page, box: Stop['box']) {
  if (box.width < 2 || box.height < 2) return false;
  const shot = () => page.screenshot({ clip: box, animations: 'disabled', caret: 'hide' });
  const on = await shot();
  await page.evaluate(() => {
    const w = window as any;
    w.__refocus = document.activeElement;
    w.__refocus?.blur();
  });
  const off = await shot();
  await page.evaluate(() => (window as any).__refocus?.focus({ preventScroll: true }));
  return !on.equals(off);
}
/** Tab (or Shift+Tab) until the focused control's name matches; every stop must show its focus and not be hidden. */
async function tabTo(page: Page, name: RegExp, log: Stop[], { back = false, max = 60 } = {}) {
  for (let i = 0; i < max; i++) {
    await page.keyboard.press(back ? 'Shift+Tab' : 'Tab');
    const f = await focus(page);
    f.ring = f.tag !== 'body' && (await ringVisible(page, f.box));
    log.push(f);
    if (name.test(f.name)) return f;
  }
  throw new Error(`never reached ${name} by keyboard; last: ${log.slice(-8).map((f) => f.name).join(' → ')}`);
}
const timer = (page: Page) => page.evaluate(() => (window as any).__kettle.timer.getState().status as string);

test('keyboard-only critical journey with focus restoration', async ({ page, baseURL }) => {
  test.setTimeout(300_000);
  const log: Stop[] = [];
  await open(page, base(baseURL), { seed: 'veteran' });

  // Home: task → tag → brew length → start
  await tabTo(page, /What are you brewing/, log);
  await page.keyboard.type('Thesis chapter 3');
  await tabTo(page, /^Work|^Study|^Read|^Create|^Life/, log);
  await page.keyboard.press('ArrowRight');
  await tabTo(page, /^\d+ min|Custom/, log);
  await page.keyboard.press('ArrowRight');
  await expect(page.getByRole('button', { name: /Put the kettle on · 50 min/ })).toBeVisible();
  await page.keyboard.press('ArrowLeft');
  await expect(page.getByRole('button', { name: /Put the kettle on · 25 min/ })).toBeVisible();

  // Custom rhythm sheet (choosing "Custom" with the arrows opens it): focus moves in, stays in, Esc closes it and
  // focus returns to the Custom option.
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('ArrowRight');
  const sheet = page.getByRole('dialog', { name: 'Your own rhythm' });
  await expect(sheet).toBeVisible();
  for (let i = 0; i < 8; i++) {
    await page.keyboard.press('Tab');
    expect(await page.evaluate(() => !!document.activeElement?.closest('[role=dialog]'))).toBe(true);
  }
  await page.keyboard.press('Escape');
  await expect(sheet).toBeHidden();
  expect((await focus(page)).name).toMatch(/Custom/);

  await tabTo(page, /Put the kettle on/, log);
  await page.keyboard.press('Enter');
  await page.waitForFunction(() => location.hash === '#/focus');
  expect(await timer(page)).toBe('running');

  // Focus: pause / resume / +5 by Tab + Enter
  await tabTo(page, /^Pause$/, log);
  await page.keyboard.press('Enter');
  await expect.poll(() => timer(page)).toBe('paused');
  expect((await focus(page)).name).toMatch(/^Resume$/);
  await page.keyboard.press('Enter');
  await expect.poll(() => timer(page)).toBe('running');
  await tabTo(page, /^Add 5 minutes$/, log, { back: true });
  const before = await page.evaluate(() => (window as any).__kettle.timer.getState().plannedMs as number);
  await page.keyboard.press('Enter');
  await expect.poll(() => page.evaluate(() => (window as any).__kettle.timer.getState().plannedMs as number)).toBe(before + 5 * 60_000);

  // End sheet: focus inside, trapped, Esc closes, focus back on End session
  await tabTo(page, /^End session$/, log);
  await page.keyboard.press('Enter');
  const end = page.getByRole('dialog');
  await expect(end).toBeVisible();
  expect(await page.evaluate(() => !!document.activeElement?.closest('[role=dialog]'))).toBe(true);
  for (let i = 0; i < 6; i++) {
    await page.keyboard.press('Tab');
    expect(await page.evaluate(() => !!document.activeElement?.closest('[role=dialog]'))).toBe(true);
  }
  await page.keyboard.press('Escape');
  await expect(end).toBeHidden();
  expect((await focus(page)).name).toBe('End session');
  expect(await timer(page)).toBe('running');

  // Ambience sheet from its chip: Esc returns focus to the chip
  await tabTo(page, /^Ambience:/, log, { back: true });
  await page.keyboard.press('Enter');
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toBeHidden();
  expect((await focus(page)).name).toMatch(/^Ambience:/);

  // Whistle → summary: task Done, details, Tea time
  await page.evaluate(() => (window as any).__kettle.finish());
  const tea = page.getByRole('button', { name: /Tea time|Long tea break/ });
  await tea.waitFor({ state: 'visible', timeout: 60_000 });
  await page.waitForTimeout(2500);
  await tabTo(page, /^Done$/, log);
  await page.keyboard.press('Enter');
  await expect(page.getByRole('button', { name: 'Done' })).toHaveAttribute('aria-pressed', 'true');
  await tabTo(page, /How your leaves added up/, log);
  await page.keyboard.press('Enter');
  await expect(page.locator('[aria-expanded="true"]').first()).toBeVisible();
  await tabTo(page, /Tea time|Long tea break/, log);
  await page.keyboard.press('Enter');
  await expect.poll(() => page.evaluate(() => (window as any).__kettle.timer.getState().phase as string)).toMatch(/Break/);

  // Break: skip it from the keyboard → Today
  await tabTo(page, /^Skip break$/, log);
  await page.keyboard.press('Enter');
  await page.waitForFunction(() => location.hash === '#/' || location.hash === '');

  // Destinations from the tab bar
  for (const [name, hash] of [
    [/^Stats$/, '#/stats'],
    [/^Nook$/, '#/nook'],
    [/^Settings$/, '#/settings'],
  ] as const) {
    await tabTo(page, name, log, { max: 120 });
    await page.keyboard.press('Enter');
    await page.waitForFunction((h) => location.hash === h, hash);
  }

  const bad = log.filter((f) => !f.ring || f.obscured || f.tag === 'body');
  expect(bad.map((f) => `${f.route} "${f.name}" ${f.ring ? '' : 'no visible focus change'}${f.obscured ? ' hidden behind sticky chrome' : ''}`)).toEqual([]);
});

test('welcome: first brew from the keyboard alone', async ({ page, baseURL }) => {
  const log: Stop[] = [];
  await open(page, base(baseURL), { seed: 'fresh', route: '/welcome' });
  await tabTo(page, /first thing|What/, log);
  await page.keyboard.type('Inbox zero');
  await page.keyboard.press('Enter');
  await page.waitForFunction(() => location.hash === '#/focus');
  expect(await timer(page)).toBe('running');
  expect(log.filter((f) => !f.ring || f.obscured).map((f) => f.name)).toEqual([]);
});
