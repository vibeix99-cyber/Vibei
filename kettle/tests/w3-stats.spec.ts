/**
 * Wave 3 round 1, Maker S: Stats and History (I12), "Delete this brew?" (F-T2-4), warm-days wording.
 *
 *   KETTLE_PORT=5502 npx playwright test --project=chromium tests/w3-stats.spec.ts
 *
 * Every test runs in a fresh browser context (a disposable profile) with a frozen start date, then real time.
 * The day policy checked here is Kettle's own (src/progress/types.ts › SessionRecord.day, docs/areas/timer.md):
 * a brew belongs to the local day it ended on. Minutes are whole focused minutes, rounded down, as the engine
 * counts them for leaves and the daily goal (src/progress/engine.ts).
 */
import { test, expect, type Page } from '@playwright/test';

/* eslint-disable @typescript-eslint/no-explicit-any */

const MIN = 60_000;
const MONDAY = Date.parse('2026-10-12T07:40:00Z');

/** Quiet defaults before boot (fresh profiles only): no 3D scene, no auto-start, muted. */
const PRIME = `(() => {
  try {
    if (localStorage.getItem('kettle:settings')) return;
    const state = { onboarded: true, scene: 'off', autoStartBreaks: false, autoStartFocus: false, muted: true };
    localStorage.setItem('kettle:settings', JSON.stringify({ state, version: 1 }));
  } catch {}
})();`;
const BIG_TEXT = `addEventListener('DOMContentLoaded', () => { const s = document.createElement('style'); s.textContent = 'html{font-size:200%!important}'; document.head.appendChild(s); });`;

async function boot(page: Page, { at = MONDAY, seed, route = '/stats', big = false }: { at?: number; seed?: string; route?: string; big?: boolean } = {}) {
  await page.addInitScript(PRIME);
  if (big) await page.addInitScript(BIG_TEXT);
  await page.clock.install({ time: at });
  await page.clock.resume();
  await page.goto(`/?debug${seed ? `&seed=${seed}` : ''}#${route}`);
  await page.waitForFunction(() => !!(window as any).__kettle?.timerInfo, null, { timeout: 30_000 });
  await page.evaluate(() => document.fonts.ready);
}
async function toStats(page: Page) {
  await page.evaluate(() => (window as any).__kettle.navigate('/stats'));
  await expect(page.getByRole('heading', { name: 'Stats', level: 1 })).toBeVisible();
  await expect(page.locator('[data-route-leaving]')).toHaveCount(0);
}
const sessionsCount = (page: Page) => page.evaluate(() => (window as any).__kettle.progress.getState().sessions.length as number);

/** On screen, on top at its centre, and not clipped by any scrolling/clipping ancestor: what a finger can hit. */
const tappable = (page: Page, name: string) =>
  page.evaluate((n) => {
    const dlg = [...document.querySelectorAll('[role=dialog]')].pop()!;
    const btn = [...dlg.querySelectorAll('button')].find((b) => (b.getAttribute('aria-label') || b.innerText).trim() === n);
    if (!btn) return `no button ${n}`;
    const r = btn.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    if (r.top < 0 || r.bottom > innerHeight || r.left < 0 || r.right > innerWidth) return `off screen ${Math.round(r.top)}–${Math.round(r.bottom)} of ${innerHeight}`;
    for (let a = btn.parentElement; a && a !== document.body; a = a.parentElement) {
      const cs = getComputedStyle(a);
      if (cs.overflowY !== 'visible') {
        const ar = a.getBoundingClientRect();
        if (cy < ar.top || cy > ar.bottom) return 'clipped by the panel';
      }
    }
    const hit = document.elementFromPoint(cx, cy);
    return hit && (hit === btn || btn.contains(hit)) ? 'ok' : `covered by ${hit?.tagName}`;
  }, name);
const focused = (page: Page) => page.evaluate(() => (document.activeElement?.getAttribute('aria-label') || (document.activeElement as HTMLElement)?.innerText || '').trim());

async function openDelete(page: Page, touch: boolean) {
  const row = page.locator('[data-session-row] button').first();
  await row.scrollIntoViewIfNeeded();
  if (touch) await row.tap();
  else await row.click();
  await expect(page.getByRole('dialog', { name: 'Edit brew' })).toBeVisible();
  const del = page.getByRole('button', { name: 'Delete this brew' });
  await del.scrollIntoViewIfNeeded();
  if (touch) await del.tap();
  else await del.click();
  const dialog = page.getByRole('dialog', { name: 'Delete this brew?' });
  await expect(dialog).toBeVisible();
  await page.waitForTimeout(700); // the dialog's spring settles
  return dialog;
}

// ---------------------------------------------------------------------------------------------------------------
// F-T2-4: "Delete this brew?" is reachable by tap and by Tab, at every size and text size
// ---------------------------------------------------------------------------------------------------------------

const SIZES = [
  { w: 375, h: 667, big: true },
  { w: 390, h: 844, big: true },
  { w: 844, h: 390, big: true },
  { w: 1440, h: 900, big: true },
  { w: 375, h: 667, big: false },
  // A cold load: the web fonts not there (yet). The fallback face is wider (S-D1: it once widened the page to 408px).
  { w: 390, h: 844, big: true, nofonts: true },
  { w: 375, h: 667, big: true, nofonts: true },
] as { w: number; h: number; big: boolean; nofonts?: boolean }[];
const blockFonts = (page: Page) => page.route(/\.(woff2?|ttf|otf)(\?.*)?$/, (r) => r.abort());
for (const sz of SIZES) {
  const touch = sz.w < 900;
  test.describe(`Delete this brew? at ${sz.w}×${sz.h}${sz.big ? ' with 200 % text' : ''}${sz.nofonts ? ', fonts blocked' : ''}`, () => {
    test.use({ viewport: { width: sz.w, height: sz.h }, hasTouch: touch, isMobile: touch && sz.w < sz.h });

    test('both choices can be tapped, and Tab reaches them in a loop', async ({ page }) => {
      if (sz.nofonts) await blockFonts(page);
      await boot(page, { seed: 'veteran', big: sz.big });
      const n0 = await sessionsCount(page);
      const dialog = await openDelete(page, touch);
      expect(await tappable(page, 'Keep it')).toBe('ok');
      expect(await tappable(page, 'Delete')).toBe('ok');

      // Keyboard: focus starts on the safe choice, Tab moves through every control and comes back round.
      expect(await focused(page)).toBe('Keep it');
      const seen: { name: string; inDialog: boolean; scroller: boolean }[] = [];
      for (let i = 0; i < 4; i++) {
        await page.keyboard.press('Tab');
        seen.push(
          await page.evaluate(() => {
            const a = document.activeElement as HTMLElement;
            const dlg = [...document.querySelectorAll('[role=dialog]')].pop()!;
            return { name: (a.getAttribute('aria-label') || a.innerText || '').trim(), inDialog: dlg.contains(a), scroller: a.scrollHeight > a.clientHeight && getComputedStyle(a).overflowY !== 'visible' };
          }),
        );
      }
      expect(seen[0].name).toBe('Delete');
      expect(seen[1].name).toBe('Close');
      // …and round to Keep it again; on a compact landscape screen the scrolling text may be a stop on the way.
      const back = seen.findIndex((x, i) => i > 1 && x.name === 'Keep it');
      expect(back, JSON.stringify(seen)).toBeGreaterThan(1);
      for (const x of seen.slice(2, back)) expect(x.inDialog && x.scroller, JSON.stringify(x)).toBe(true);
      expect(seen.every((x) => x.inDialog)).toBe(true);

      // Keep it keeps the brew (and only this dialog closes).
      await (touch ? dialog.getByRole('button', { name: 'Keep it' }).tap() : dialog.getByRole('button', { name: 'Keep it' }).click());
      await expect(dialog).toBeHidden();
      await expect(page.getByRole('dialog', { name: 'Edit brew' })).toBeVisible();
      expect(await sessionsCount(page)).toBe(n0);

      // Reopen; Tab to Delete, Enter: the brew goes, and its row offers Undo.
      const del = page.getByRole('button', { name: 'Delete this brew' });
      await del.scrollIntoViewIfNeeded();
      await (touch ? del.tap() : del.click());
      await expect(dialog).toBeVisible();
      await page.waitForTimeout(700);
      await page.keyboard.press('Tab');
      expect(await focused(page)).toBe('Delete');
      await page.keyboard.press('Enter');
      await expect(page.getByRole('dialog')).toHaveCount(0);
      expect(await sessionsCount(page)).toBe(n0 - 1);
      await expect(page.locator('[data-undo-for="history-delete"]')).toBeVisible();
    });

    test('a tap on Delete deletes', async ({ page }) => {
      if (sz.nofonts) await blockFonts(page);
      await boot(page, { seed: 'veteran', big: sz.big });
      const n0 = await sessionsCount(page);
      await openDelete(page, touch);
      expect(await tappable(page, 'Delete')).toBe('ok');
      const box = (await page.getByRole('dialog', { name: 'Delete this brew?' }).getByRole('button', { name: 'Delete', exact: true }).boundingBox())!;
      // At the button's own place on screen: no scrolling first, as a finger would.
      if (touch) await page.touchscreen.tap(box.x + box.width / 2, box.y + box.height / 2);
      else await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
      await expect(page.getByRole('dialog')).toHaveCount(0);
      expect(await sessionsCount(page)).toBe(n0 - 1);
    });
  });
}

// ---------------------------------------------------------------------------------------------------------------
// I12: the numbers Stats shows are the history's own (recomputed here independently)
// ---------------------------------------------------------------------------------------------------------------

/** Recompute from the raw records: local day of each brew's end, whole minutes rounded down. */
const recompute = (page: Page) =>
  page.evaluate(() => {
    const k = (window as any).__kettle;
    const p = k.progress.getState();
    const pad = (n: number) => String(n).padStart(2, '0');
    const localDay = (ts: number) => {
      const d = new Date(ts);
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    };
    const today = localDay(k.clock.now());
    const back = (n: number) => {
      const d = new Date(k.clock.now());
      d.setDate(d.getDate() - n);
      return localDay(d.getTime());
    };
    const focus = (p.sessions as any[]).filter((s) => s.phase === 'focus');
    const misattributed = focus.filter((s) => s.day !== localDay(s.endedAt)).map((s) => s.id);
    const dayMs = new Map<string, number>();
    for (const s of focus) dayMs.set(localDay(s.endedAt), (dayMs.get(localDay(s.endedAt)) ?? 0) + s.focusedMs);
    const last7 = Array.from({ length: 7 }, (_, i) => back(6 - i));
    const goals = new Set((p.ledger as any[]).filter((e) => e.kind === 'goal').map((e) => e.day));
    return {
      misattributed,
      totalMin: Math.floor(focus.reduce((a, s) => a + s.focusedMs, 0) / 60_000),
      fullBrews: focus.filter((s) => s.completed).length,
      todayMin: Math.floor((dayMs.get(today) ?? 0) / 60_000),
      todayFull: focus.filter((s) => s.completed && localDay(s.endedAt) === today).length,
      weekMin: last7.reduce((a, d) => a + Math.floor((dayMs.get(d) ?? 0) / 60_000), 0),
      weekDays: last7.filter((d) => dayMs.has(d)).length,
      weekGoal: last7.filter((d) => goals.has(d)).length,
    };
  });
const minLabel = (min: number) => (min < 60 ? `${min} min` : min % 60 ? `${Math.floor(min / 60)}h ${min % 60}m` : `${Math.floor(min / 60)}h`);

for (const seed of ['veteran', 'celebrate', 'newbie']) {
  test(`Stats (${seed}): the summary and tiles match the history recomputed from its records`, async ({ page }) => {
    await boot(page, { seed });
    await toStats(page);
    const r = await recompute(page);
    expect(r.misattributed, 'every brew belongs to the local day it ended on').toEqual([]);
    const glance = page.locator('[data-area="summary"]');
    await expect(glance).toBeVisible();
    const text = (await glance.innerText()).replace(/\s+/g, ' ');
    expect(text).toContain(`${minLabel(r.todayMin)} focused`);
    expect(text).toContain(`${r.todayFull} full brew`);
    expect(text).toContain(`Last 7 days`);
    expect(text).toContain(`${minLabel(r.weekMin)} focused`);
    expect(text).toContain(`Brewed on ${r.weekDays} of 7 days`);
    expect(text).toContain(`${r.weekGoal} ${r.weekGoal === 1 ? 'day' : 'days'} at goal`);
    const tiles = (await page.getByRole('region', { name: 'Overview' }).innerText()).replace(/\s+/g, ' ');
    expect(tiles).toContain(`${minLabel(r.totalMin)} Total focus`);
    expect(tiles).toContain(`${r.fullBrews} Full brews`);
    // The "Last 7 days" card below shows the same week total.
    await expect(page.locator('section').filter({ has: page.getByRole('heading', { name: 'Last 7 days', exact: true, level: 2 }) })).toContainText(minLabel(r.weekMin));
  });
}

test('a brew that ends after midnight belongs to the day it ended on, everywhere on Stats', async ({ page }) => {
  // Sunday 23:50 (UTC profile clock): start a brew, let it finish after midnight.
  await boot(page, { at: Date.parse('2026-10-11T23:50:00Z'), route: '/' });
  await page.getByRole('button', { name: /^Put the kettle on · / }).click();
  await expect.poll(() => page.evaluate(() => location.hash)).toBe('#/focus');
  await page.evaluate(() => {
    const k = (window as any).__kettle;
    k.ff(k.timer.getState().endsAt - k.clock.now() - 50);
  });
  await expect.poll(() => page.evaluate(() => location.hash), { timeout: 15_000 }).toBe('#/done');
  const rec = await page.evaluate(() => (window as any).__kettle.progress.getState().sessions.find((s: any) => s.phase === 'focus'));
  expect(new Date(rec.startedAt).getUTCDate()).toBe(11);
  expect(rec.day).toBe('2026-10-12');
  const min = Math.floor(rec.focusedMs / MIN);
  await toStats(page);
  const glance = (await page.locator('[data-area="summary"]').innerText()).replace(/\s+/g, ' ');
  expect(glance).toMatch(new RegExp(`Today \\w+, \\w+ \\w+ ${min} min focused`)); // "Today Mon, Oct 12 25 min focused" (locale order aside)
  const history = page.locator('section').filter({ has: page.getByRole('heading', { name: 'History', level: 2 }) });
  await expect(history.getByRole('heading', { level: 3 })).toHaveText(['Today']);
  await expect(history.getByRole('region', { name: new RegExp(`^Today, ${min} minutes focused$`) })).toBeVisible();
  // The chart's table (its screen-reader twin) puts the minutes on Monday 12 October, none on Sunday.
  const table = page.getByRole('table').filter({ hasText: 'Focused minutes per day' });
  await expect(table.getByRole('row', { name: /Monday/ }).getByRole('cell').first()).toHaveText(String(min));
  await expect(table.getByRole('row', { name: /Sunday/ }).getByRole('cell').first()).toHaveText('0');
});

test('a brew ended early at 12:40 counts 12 minutes in History, as in its leaves and the End sheet', async ({ page }) => {
  await boot(page, { route: '/' });
  await page.getByRole('button', { name: /^Put the kettle on · / }).click();
  await expect.poll(() => page.evaluate(() => location.hash)).toBe('#/focus');
  await page.evaluate(() => (window as any).__kettle.ff(12 * 60_000 + 40_000));
  await page.getByRole('button', { name: 'End session' }).first().click();
  const end = page.getByRole('dialog', { name: 'Leave the kettle early?' });
  await expect(end).toContainText('12 minutes of focus will be saved');
  await end.getByRole('button', { name: 'End session' }).click();
  await expect.poll(() => page.evaluate(() => location.hash)).toBe('#/');
  const rec = await page.evaluate(() => (window as any).__kettle.progress.getState().sessions.find((s: any) => s.phase === 'focus'));
  expect(Math.floor(rec.focusedMs / 60_000)).toBe(12);
  expect(rec.focusedMs % 60_000).toBeGreaterThanOrEqual(30_000); // nearest-minute rounding would say 13
  await toStats(page);
  const history = page.locator('section').filter({ has: page.getByRole('heading', { name: 'History', level: 2 }) });
  await expect(history.getByRole('region', { name: 'Today, 12 minutes focused' })).toBeVisible();
  await expect(history.locator('[data-session-row] button').first()).toHaveAccessibleName(/, 12 minutes, Ended early/);
  await expect(page.locator('[data-area="summary"]')).toContainText('12 min focused');
});

// ---------------------------------------------------------------------------------------------------------------
// Warm-days glossary: no "streak" in visible text, screen-reader text, titles or aria labels on Stats
// ---------------------------------------------------------------------------------------------------------------

const streakWords = (page: Page) =>
  page.evaluate(() => {
    const main = document.querySelector('main')!;
    const out: string[] = [];
    // textContent includes sr-only text; attributes cover aria-label / title / aria-description.
    if (/streak/i.test(main.textContent ?? '')) out.push(...(main.textContent!.match(/[^.]{0,40}streak[^.]{0,20}/gi) ?? []));
    for (const el of main.querySelectorAll('*'))
      for (const a of ['aria-label', 'title', 'aria-description', 'alt', 'aria-valuetext'])
        if (/streak/i.test(el.getAttribute(a) ?? '')) out.push(`${a}: ${el.getAttribute(a)}`);
    for (const el of main.querySelectorAll('svg title, svg desc')) if (/streak/i.test(el.textContent ?? '')) out.push(`svg: ${el.textContent}`);
    return out;
  });

for (const [seed, at] of [
  ['empty', MONDAY], // an onboarded profile with nothing brewed (the `fresh` seed is a first visit: Welcome)
  ['newbie', MONDAY],
  ['veteran', MONDAY],
  ['celebrate', MONDAY],
  ['atRisk', Date.parse('2026-10-12T19:10:00Z')],
] as const) {
  test(`Stats (${seed}) never says "streak"`, async ({ page }) => {
    await boot(page, { seed: seed === 'empty' ? undefined : seed, at });
    await toStats(page);
    await page.waitForTimeout(500);
    expect(await streakWords(page)).toEqual([]);
  });
}

test('the History delete dialog speaks of warm days, and the at-risk card invites without a countdown', async ({ page }) => {
  await boot(page, { seed: 'atRisk', at: Date.parse('2026-10-12T19:10:00Z') });
  await toStats(page);
  const card = page.locator('section').filter({ has: page.getByRole('heading', { name: /days? warm$/, level: 2 }) });
  await expect(card).toContainText(/One brew today makes it \d+ warm days in a row\./);
  await expect(card).not.toContainText(/midnight|lose|break|don.t miss/i);
  const dialog = await openDelete(page, false);
  await expect(dialog).toContainText('It leaves your history, stats and warm days. The leaves you earned stay yours.');
});

// ---------------------------------------------------------------------------------------------------------------
// S-D1: the Overview tiles fit at 200 % text, with the web fonts and before them
// ---------------------------------------------------------------------------------------------------------------

/** Every text in the Overview tiles: not clipped, and its glyphs inside its tile. */
const tileOverflow = (page: Page) =>
  page.evaluate(() => {
    const grid = document.querySelector('section[aria-label="Overview"] > div')!;
    const bad: string[] = [];
    for (const tile of grid.children) {
      const tr = tile.getBoundingClientRect();
      for (const e of tile.querySelectorAll('div, span')) {
        if (!(e.textContent ?? '').trim()) continue;
        const range = document.createRange();
        range.selectNodeContents(e);
        const right = range.getBoundingClientRect().right;
        if (e.scrollWidth > e.clientWidth + 0.5 && e.clientWidth > 0) bad.push(`${e.textContent!.trim()}: ${e.scrollWidth} > ${e.clientWidth}`);
        else if (right > tr.right - 1) bad.push(`${e.textContent!.trim()}: ends at ${Math.round(right)}, tile at ${Math.round(tr.right)}`);
      }
    }
    return bad;
  });

for (const sz of [
  { w: 390, h: 844 },
  { w: 375, h: 667 },
  { w: 844, h: 390 },
]) {
  test.describe(`Overview tiles at ${sz.w}×${sz.h} with 200 % text`, () => {
    test.use({ viewport: { width: sz.w, height: sz.h }, isMobile: sz.w < sz.h, hasTouch: true });

    test('every tile text fits once the fonts are in', async ({ page }) => {
      await boot(page, { seed: 'veteran', big: true });
      await toStats(page);
      await page.evaluate(() => document.fonts.ready);
      await expect(page.getByRole('region', { name: 'Overview' })).toContainText(/Warmest run/);
      expect(await tileOverflow(page)).toEqual([]);
    });
  });
}

for (const sz of [
  { w: 390, h: 844 },
  { w: 375, h: 667 },
]) {
  test.describe(`Stats before the web fonts arrive, ${sz.w}×${sz.h}, 200 % text`, () => {
    test.use({ viewport: { width: sz.w, height: sz.h }, isMobile: true, hasTouch: true });

    test('the page stays the width of the screen and the tiles fit (fonts blocked)', async ({ page }) => {
      await blockFonts(page);
      await boot(page, { seed: 'veteran', big: true });
      await toStats(page);
      await expect(page.getByRole('region', { name: 'Overview' })).toContainText(/Warmest run/);
      const widths: { sw: number; iw: number }[] = [];
      for (let i = 0; i < 20; i++) {
        widths.push(await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, iw: innerWidth })));
        await page.waitForTimeout(100);
      }
      expect(await page.evaluate(() => [...document.fonts].filter((f) => f.status === 'loaded').length)).toBe(0);
      for (const x of widths) {
        expect(x.iw).toBe(sz.w);
        expect(x.sw).toBeLessThanOrEqual(x.iw);
      }
      expect(await tileOverflow(page)).toEqual([]);
    });
  });
}
