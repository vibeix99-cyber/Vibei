/**
 * Kettle: the critic's functional test plan (Playwright). See review/README.md.
 *
 *   npx playwright test -c review/playwright.config.ts
 *
 * Drives the real UI by role and accessible name where the brief fixes the wording
 * ("Put the kettle on", "Pause", "Resume", "+5", "End"), and uses `window.__kettle`
 * (src/app/debug.ts) only for time travel (ff/finish), seeding, and reading state.
 * Every test also fails on any console error or uncaught page error (auto fixture).
 */
import { test as base, expect, type Locator, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const OUT = fileURLToPath(new URL('./test-results/functional/', import.meta.url));
mkdirSync(OUT, { recursive: true });
const MIN = 60_000;

// ---------------------------------------------------------------- fixtures

const test = base.extend<{ consoleErrors: string[] }>({
  consoleErrors: [
    async ({ page }, use, testInfo) => {
      const errors: string[] = [];
      const hmr: string[] = [];
      page.on('console', (m) => {
        if (m.type() === 'error') errors.push(`console.error: ${m.text()}`);
        // Dev-server churn from builders editing src/ — flag it so failures can be triaged as infra.
        else if (/\[vite\] (hot updated|page reload|server connection lost)/.test(m.text())) hmr.push(m.text());
      });
      page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
      await use(errors);
      if (hmr.length) testInfo.annotations.push({ type: 'hmr-during-test', description: hmr.slice(0, 5).join('\n') });
      if (errors.length) {
        await testInfo.attach('console-errors.txt', { body: errors.join('\n'), contentType: 'text/plain' });
        // Throw (not expect.soft) — soft expects in fixture teardown confuse the step tracker.
        throw new Error(`console errors / uncaught page errors (${errors.length}):\n${errors.slice(0, 8).map((e) => e.slice(0, 300)).join('\n')}`);
      }
    },
    { auto: true },
  ],
});

// ---------------------------------------------------------------- helpers

type Boot = { seed?: string; theme?: 'light' | 'dark'; onboarded?: '0' | '1'; motion?: 'reduce' | 'full'; route?: string };

async function waitKettle(page: Page) {
  await page.waitForFunction(() => '__kettle' in window, null, { timeout: 15_000 });
  await page.waitForTimeout(400);
}

async function boot(page: Page, o: Boot = {}) {
  const qs = ['debug'];
  for (const k of ['seed', 'theme', 'onboarded', 'motion'] as const) if (o[k]) qs.push(`${k}=${o[k]}`);
  await page.goto(`/?${qs.join('&')}#${o.route ?? '/'}`, { waitUntil: 'networkidle' });
  await waitKettle(page);
}

/** Reload without re-applying ?seed (which would reseed and move the debug clock). */
async function reopen(page: Page, route: string) {
  await page.goto(`/?debug#${route}`, { waitUntil: 'networkidle' });
  await waitKettle(page);
}

const K = <T>(page: Page, fn: string) => page.evaluate(fn) as Promise<T>;

type TimerView = { status: string; phase: string; plannedMs: number; remainingMs: number };
const timer = (page: Page) =>
  K<TimerView>(
    page,
    `(() => { const t = __kettle.timer.getState(); const now = __kettle.clock.now();
      return { status: t.status, phase: t.phase, plannedMs: t.plannedMs,
               remainingMs: t.status === 'running' && t.endsAt ? t.endsAt - now : t.remainingMs }; })()`,
  );
const route = (page: Page) => K<string>(page, `location.hash.replace(/^#/, '') || '/'`);
const settingsOf = (page: Page) => K<Record<string, unknown>>(page, `JSON.parse(JSON.stringify(__kettle.settings.getState()))`);
type Rec = { id: string; phase: string; completed: boolean; focusedMs: number; intention: string };
const focusSessions = (page: Page) =>
  K<Rec[]>(page, `__kettle.progress.getState().sessions.filter(s => s.phase === 'focus').map(({id, phase, completed, focusedMs, intention}) => ({id, phase, completed, focusedMs, intention}))`);

/**
 * First visible + enabled control whose accessible name matches. `names` are tried in
 * order of preference (most specific first), then roles in order.
 */
async function findControl(page: Page | Locator, names: RegExp | RegExp[], roles = ['button', 'radio', 'tab', 'option', 'switch', 'checkbox', 'menuitemradio', 'link'] as const) {
  for (const name of Array.isArray(names) ? names : [names]) {
    for (const role of roles) {
      const loc = page.getByRole(role, { name });
      const n = await loc.count();
      for (let i = 0; i < n; i++) {
        const el = loc.nth(i);
        if ((await el.isVisible().catch(() => false)) && (await el.isEnabled().catch(() => false))) return el;
      }
    }
  }
  return null;
}

async function mustControl(page: Page | Locator, names: RegExp | RegExp[], what: string, roles?: Parameters<typeof findControl>[2]) {
  const deadline = Date.now() + 6000;
  while (Date.now() < deadline) {
    const c = await findControl(page, names, roles);
    if (c) return c;
    await new Promise((r) => setTimeout(r, 200));
  }
  throw new Error(`No visible, enabled control for "${what}" (accessible name ${String(names)})`);
}

/** Click like a user: wake any idle/zen chrome first; if a radio/checkbox input is covered by its card, check it. */
async function press(el: Locator) {
  await el.page().mouse.move(3, 3);
  await el.page().mouse.move(6, 6);
  try {
    // Generous timeout: a click can be slow while the main thread is busy (e.g. 3D init) — never double-click.
    await el.click({ timeout: 10_000, trial: false });
  } catch (e) {
    const msg = String((e as Error).message);
    if (!/intercepts pointer events|not visible|outside of the viewport/.test(msg)) throw e;
    const role = await el.getAttribute('role').catch(() => null);
    const type = await el.getAttribute('type').catch(() => null);
    if (role === 'radio' || role === 'checkbox' || type === 'radio' || type === 'checkbox')
      await el.check({ force: true, timeout: 5000 }).catch(() => el.click({ force: true, timeout: 5000 }));
    else await el.click({ force: true, timeout: 5000 });
  }
}

const PRIMARY_START = /put the kettle on/i;

async function startFromHome(page: Page) {
  await press(await mustControl(page, PRIMARY_START, 'primary start CTA on Home', ['button', 'link']));
  await expect.poll(() => route(page), { message: 'start navigates to focus' }).toBe('/focus');
  await expect.poll(async () => (await timer(page)).status).toBe('running');
}

function parseClock(s: string): number | null {
  const m = s.match(/(\d{1,2}):(\d{2})(?::(\d{2}))?/);
  if (!m) return null;
  return m[3] ? (+m[1] * 3600 + +m[2] * 60 + +m[3]) * 1000 : (+m[1] * 60 + +m[2]) * 1000;
}

async function bodyLuminance(page: Page) {
  return K<number>(
    page,
    `(() => { const c = getComputedStyle(document.body).backgroundColor.match(/[\\d.]+/g).map(Number);
      const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
      return 0.2126 * f(c[0]) + 0.7152 * f(c[1]) + 0.0722 * f(c[2]); })()`,
  );
}

async function shot(page: Page, name: string, fullPage = false) {
  await page.screenshot({ path: `${OUT}${name}.png`, fullPage });
}

// ---------------------------------------------------------------- 1. onboarding

test('onboarding: welcome → name → goal → rhythm → (ambience) → notifications → put the kettle on', async ({ page }) => {
  test.setTimeout(240_000);
  await boot(page, { seed: 'fresh', onboarded: '0', route: '/welcome' });
  expect(await route(page)).toBe('/welcome');
  await shot(page, 'onboarding-0');
  await press(await mustControl(page, [/^get started/i, /^let'?s (go|begin)/i, /^(start|begin|continue|next)\b/i], 'welcome start', ['button']));

  const picked = { goal: false, rhythm: false, ambience: false, name: false };
  const trail: string[] = [];
  test.info().annotations.push({ type: 'onboarding-trail', description: '' });
  const note = (m: string) => {
    trail.push(m);
    test.info().annotations[test.info().annotations.length - 1].description = trail.join(' → ');
  };
  let finished = false;
  for (let step = 1; step < 12 && !finished; step++) {
    // Poll until this step offers something to do (screens animate in/out between steps).
    let acted = false;
    const deadline = Date.now() + 8000;
    while (!acted && Date.now() < deadline) {
      const final = await findControl(page, PRIMARY_START, ['button']);
      if (final) {
        note('final');
        await shot(page, `onboarding-${step}-final`);
        await press(final);
        finished = acted = true;
        break;
      }
      const nameBox = page.getByRole('textbox').first();
      if (!picked.name && (await nameBox.isVisible().catch(() => false))) {
        await nameBox.fill('Robin');
        picked.name = true;
      }
      for (const [key, re] of [
        ['goal', /a cup/i],
        ['rhythm', /classic/i],
        ['ambience', /rain/i],
      ] as const) {
        if (picked[key]) continue;
        const opt = await findControl(page, re, ['radio', 'option', 'button', 'checkbox', 'tab']);
        if (opt) {
          note(`pick ${key}`);
          await press(opt);
          picked[key] = true;
        }
      }
      const next = await findControl(page, [/^(continue|next)\b/i, /^(not now|maybe later|skip|no thanks)/i], ['button']);
      if (next) {
        note(`next@${step}:${(await next.innerText().catch(() => '?')).trim()}`);
        await shot(page, `onboarding-${step}`);
        await press(next);
        acted = true;
      } else await page.waitForTimeout(250);
    }
    expect(acted, `a way forward on onboarding step ${step}`).toBe(true);
    await page.waitForTimeout(350);
  }
  expect(finished, 'reached the final "Put the kettle on"').toBe(true);
  expect(picked.goal && picked.rhythm, 'goal + rhythm questions were asked').toBe(true);

  await expect.poll(async () => (await settingsOf(page)).onboarded).toBe(true);
  const s = await settingsOf(page);
  expect(s.dailyGoalMin).toBe(30);
  expect(s.focusMin).toBe(25);
  expect(s.name).toBe('Robin');
  expect(['/', '/focus']).toContain(await route(page));
  await shot(page, 'onboarding-end');
});

// ---------------------------------------------------------------- 2. focus controls

test('focus: start → pause → resume → +5 → end early (saved, ≥1 min)', async ({ page }) => {
  await boot(page, { seed: 'newbie' });
  const before = await focusSessions(page);
  await startFromHome(page);
  const t0 = await timer(page);
  expect(t0.phase).toBe('focus');
  await shot(page, 'focus-running');

  await press(await mustControl(page, /^pause/i, 'Pause', ['button']));
  await expect.poll(async () => (await timer(page)).status).toBe('paused');
  const r1 = (await timer(page)).remainingMs;
  await page.waitForTimeout(1500);
  expect(Math.abs((await timer(page)).remainingMs - r1), 'paused time does not move').toBeLessThan(50);
  await expect(page.getByText(/paused/i).first(), 'paused state is visibly labelled').toBeVisible();
  await shot(page, 'focus-paused');

  await press(await mustControl(page, /^(resume|keep going|continue)/i, 'Resume', ['button']));
  await expect.poll(async () => (await timer(page)).status).toBe('running');

  await press(await mustControl(page, /\+\s*5|add 5|5 more/i, '+5 min', ['button']));
  await expect.poll(async () => (await timer(page)).plannedMs).toBe(t0.plannedMs + 5 * MIN);

  await page.evaluate(`__kettle.ff(${3 * MIN})`);
  await press(await mustControl(page, /^(end|leave|stop|finish early)/i, 'End early', ['button']));
  const dialog = page.getByRole('dialog');
  await expect(dialog, 'end-early opens a confirm sheet').toBeVisible();
  await expect(dialog).toContainText(/still count|early/i);
  await shot(page, 'focus-end-sheet');
  await press(await mustControl(dialog, /leave|end|stop/i, 'confirm leave', ['button']));

  await expect.poll(async () => (await timer(page)).status).toBe('idle');
  const after = await focusSessions(page);
  const added = after.filter((s) => !before.some((b) => b.id === s.id));
  expect(added, 'ended-early brew is recorded').toHaveLength(1);
  expect(added[0].completed).toBe(false);
  expect(added[0].focusedMs).toBeGreaterThanOrEqual(MIN);
  await expect.poll(() => route(page)).not.toBe('/focus');
});

// ---------------------------------------------------------------- 3. full loop

test('finish → celebration cards → tea break → break end', async ({ page }) => {
  test.setTimeout(240_000);
  await boot(page, { seed: 'celebrate' });
  await startFromHome(page);
  await page.evaluate('__kettle.finish()');
  await expect.poll(() => route(page), { message: 'finishing a brew opens the celebration' }).toBe('/done');
  await expect(page.getByText(/whistling/i).first()).toBeVisible();

  const texts: string[] = [];
  for (let i = 0; i < 10; i++) {
    await page.waitForTimeout(2000);
    await shot(page, `done-card-${i}`);
    texts.push(await page.locator('body').innerText());
    if ((await route(page)) !== '/done') break;
    const next = await findControl(page, [/^(continue|next)\b/i, /^(nice|yay|claim|open)/i, /^(start (my |a |the )?(tea )?break|tea time|take a break)/i], ['button']);
    if (!next) break;
    await next.click();
  }
  const all = texts.join('\n');
  expect(all, 'card: stats').toMatch(/leaves?/i);
  expect(all, 'card: warm streak extended (celebrate seed → 7 days)').toMatch(/7\s+days?/i);
  expect(all, 'card: recipes').toMatch(/recipe/i);
  expect(all, 'card: level-up').toMatch(/level/i);

  await expect.poll(async () => (await timer(page)).phase, { message: 'celebration hands over to a tea break', timeout: 15_000 }).toMatch(/Break$/);
  await expect.poll(async () => (await timer(page)).status).toBe('running');
  expect(await route(page)).not.toBe('/done');
  await expect(page.getByText(/tea/i).first()).toBeVisible();
  await shot(page, 'break-running');

  await page.evaluate('__kettle.finish()');
  await expect.poll(async () => (await timer(page)).status, { message: 'break ends (autoStartFocus off)' }).toBe('idle');
  await page.waitForTimeout(1200);
  await shot(page, 'break-over');
  const nextBrew = await mustControl(page, [/put the kettle on/i, /start next brew|next brew/i], 'break-over: start next brew', ['button']);
  await expect(nextBrew, 'break over offers the next brew as the clear next step').toBeVisible();
  const home = await findControl(page, [/^done for now/i, /^(back home|home|not now|later|done)/i, /^close$/i], ['button', 'link']);
  expect(home, 'break over offers a way home').not.toBeNull();
  await press(home!);
  await expect.poll(() => route(page)).toBe('/');
  await shot(page, 'after-break');
});

// ---------------------------------------------------------------- 4. reload

test('reload mid-session keeps time (running and paused)', async ({ page }) => {
  await boot(page, { onboarded: '1' }); // no seed → no debug-clock offset, so wall time is real across reloads
  await page.evaluate('__kettle.timer.getState().startFocus()');
  await expect.poll(() => route(page)).toBe('/focus');
  await page.waitForTimeout(3000);
  const before = await timer(page);
  const t0 = Date.now();
  await page.reload({ waitUntil: 'networkidle' });
  await waitKettle(page);
  expect(await route(page)).toBe('/focus');
  const after = await timer(page);
  const elapsed = Date.now() - t0;
  expect(after.status).toBe('running');
  // Wall-clock anchored: remaining must drop by exactly the real time the reload took (±1.5 s).
  expect(Math.abs(before.remainingMs - elapsed - after.remainingMs), `drift across reload (reload took ${elapsed} ms)`).toBeLessThan(1500);
  const title = await page.title();
  const shownTitle = parseClock(title);
  expect(shownTitle, `tab title shows remaining time (got "${title}")`).not.toBeNull();
  expect(Math.abs(shownTitle! - after.remainingMs), 'tab title matches engine').toBeLessThan(2500);
  const view = await K<Record<string, unknown>>(page, `JSON.parse(JSON.stringify(__kettle.timerView()))`);
  const secs = Number(view.remainingSec ?? view.seconds ?? view.remaining ?? NaN);
  if (Number.isFinite(secs)) expect(Math.abs(secs * 1000 - after.remainingMs), 'displayed view matches engine').toBeLessThan(2500);

  await page.evaluate('__kettle.timer.getState().pause()');
  const paused = await timer(page);
  await page.waitForTimeout(1500);
  await page.reload({ waitUntil: 'networkidle' });
  await waitKettle(page);
  const again = await timer(page);
  expect(again.status).toBe('paused');
  expect(Math.abs(again.remainingMs - paused.remainingMs)).toBeLessThan(1000);
});

// ---------------------------------------------------------------- 5. settings

test('settings: changes apply instantly and persist across reload', async ({ page }) => {
  await boot(page, { seed: 'newbie', route: '/settings' });
  const s0 = await settingsOf(page);
  await shot(page, 'settings-before', true);

  await press(await mustControl(page, /^(dark|night)/i, 'theme: dark'));
  await expect.poll(() => bodyLuminance(page), { message: 'dark theme applies instantly' }).toBeLessThan(0.2);

  await press(await mustControl(page, /deep/i, 'rhythm: Deep 50/10'));
  await expect.poll(async () => (await settingsOf(page)).focusMin).toBe(50);

  await press(await mustControl(page, /a pot|60 ?min/i, 'daily goal: A pot'));
  await expect.poll(async () => (await settingsOf(page)).dailyGoalMin).toBe(60);

  const sound = await mustControl(page, /^(sound|sounds|mute|sound effects)/i, 'sound on/off', ['switch', 'checkbox', 'button']);
  await sound.click();
  await expect.poll(async () => (await settingsOf(page)).muted).toBe(!s0.muted);
  await shot(page, 'settings-after', true);

  await reopen(page, '/settings');
  const s1 = await settingsOf(page);
  expect(s1.theme).toBe('dark');
  expect(s1.focusMin).toBe(50);
  expect(s1.dailyGoalMin).toBe(60);
  expect(s1.muted).toBe(!s0.muted);
  expect(await bodyLuminance(page), 'dark theme survives reload').toBeLessThan(0.2);

  await page.evaluate(`__kettle.navigate('/')`);
  await startFromHome(page);
  expect((await timer(page)).plannedMs, 'new rhythm applies to the next brew').toBe(50 * MIN);
});

// ---------------------------------------------------------------- 6. stats

test('stats reflect a newly finished brew', async ({ page }) => {
  await boot(page, { seed: 'blank', route: '/stats' });
  await expect(page.getByText(/nothing brewed yet/i).first(), 'warm empty state').toBeVisible();
  await shot(page, 'stats-empty', true);

  await page.evaluate(`__kettle.timer.getState().startFocus({ intention: 'Stats probe', tag: 'read' })`);
  await page.waitForTimeout(400);
  await page.evaluate('__kettle.finish()');
  await expect.poll(async () => (await focusSessions(page)).filter((s) => s.completed).length).toBe(1);
  await page.evaluate(`(() => { const t = __kettle.timer.getState(); if (t.status !== 'idle') t.end('skip'); })()`);
  await page.waitForTimeout(300);
  await page.evaluate(`__kettle.navigate('/stats')`);
  await expect.poll(() => route(page)).toBe('/stats');
  await page.waitForTimeout(800);
  await expect(page.getByText(/nothing brewed yet/i), 'empty state gone').toHaveCount(0);
  const body = page.locator('body');
  await expect(body).toContainText(/\b25\s*(min|m)\b|0:25|25:00/i);
  await expect(body, 'session history lists the new brew').toContainText('Stats probe');
  await shot(page, 'stats-after', true);
});

// ---------------------------------------------------------------- 7. nook

test('nook shows unlocked items and locked requirements; item story on tap', async ({ page }) => {
  await boot(page, { seed: 'veteran', route: '/nook' });
  type Item = { id: string; name: string; story: string; unlockLevel: number };
  const src = readFileSync(fileURLToPath(new URL('../src/progress/items.ts', import.meta.url)), 'utf8');
  const all: Item[] = [...src.matchAll(/\{\s*id:\s*'([^']+)',\s*name:\s*'([^']+)',\s*story:\s*'((?:[^'\\]|\\.)*)',\s*unlockLevel:\s*(\d+)\s*\}/g)].map((m) => ({
    id: m[1],
    name: m[2],
    story: m[3].replace(/\\'/g, "'"),
    unlockLevel: Number(m[4]),
  }));
  expect(all.length, 'parsed the ITEMS catalog').toBeGreaterThan(5);
  const level = await K<number | null>(
    page,
    `(() => { const el = document.querySelector('[aria-label^="Cozy level"]');
      const m = el && el.getAttribute('aria-label').match(/(\\d+)/); return m ? Number(m[1]) : null; })()`,
  );
  const lv =
    level ??
    (await K<number | null>(page, `import('/src/progress/index.ts').then(m => m.levelFromLeaves(__kettle.progress.getState().leaves).level).catch(() => null)`));
  const cat = lv == null ? null : { level: lv, unlocked: all.filter((i) => i.unlockLevel <= lv), locked: all.filter((i) => i.unlockLevel > lv) };
  expect(cat, 'nook (or shell) exposes the Cozy level (aria-label "Cozy level N")').not.toBeNull();
  expect(cat!.unlocked.length, 'veteran has unlocked items').toBeGreaterThan(0);
  await page.waitForTimeout(1500);
  await shot(page, 'nook', true);
  for (const item of cat!.unlocked) await expect(page.getByText(item.name).first(), `unlocked item listed: ${item.name}`).toBeAttached();
  if (cat!.locked.length) await expect(page.getByText(/level\s*\d+/i).first(), 'locked items show a level requirement').toBeAttached();

  for (const item of cat!.unlocked) await expect(page.getByRole('button', { name: item.name }).first(), `unlocked item is a tappable button: ${item.name}`).toBeAttached();
  const first = cat!.unlocked[0];
  const el = page.getByRole('button', { name: first.name }).first();
  await el.scrollIntoViewIfNeeded();
  await press(el);
  await expect(page.getByText(first.story).first(), 'tapping an item shows its story').toBeVisible();
  await shot(page, 'nook-item');
});

// ---------------------------------------------------------------- 8. keyboard-only

test('keyboard-only core loop (Tab/Enter/Space/Esc) with visible focus and a trapped dialog', async ({ page }) => {
  await boot(page, { seed: 'newbie' });
  let found = false;
  for (let i = 0; i < 60 && !found; i++) {
    await page.keyboard.press('Tab');
    found = await page.evaluate(() => {
      const el = document.activeElement as HTMLElement | null;
      return /put the kettle on/i.test(`${el?.innerText ?? ''} ${el?.getAttribute('aria-label') ?? ''}`);
    });
  }
  expect(found, 'primary CTA reachable with Tab').toBe(true);
  const ring = await page.evaluate(() => {
    const cs = getComputedStyle(document.activeElement as Element);
    return (cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) >= 2) || (cs.boxShadow !== 'none' && cs.boxShadow !== '');
  });
  expect(ring, 'focused CTA shows a visible focus indicator (≥2px outline or ring)').toBe(true);
  await shot(page, 'kbd-focus-cta');

  await page.keyboard.press('Enter');
  await expect.poll(() => route(page)).toBe('/focus');
  await page.waitForTimeout(600);
  await page.keyboard.press('Space');
  await expect.poll(async () => (await timer(page)).status, { message: 'Space pauses' }).toBe('paused');
  await page.keyboard.press('Space');
  await expect.poll(async () => (await timer(page)).status, { message: 'Space resumes' }).toBe('running');

  await page.keyboard.press('Escape');
  const dialog = page.getByRole('dialog');
  await expect(dialog, 'Esc opens the end-early sheet').toBeVisible();
  for (let i = 0; i < 12; i++) {
    await page.keyboard.press('Tab');
    const inside = await page.evaluate(() => !!document.activeElement?.closest('[role="dialog"]'));
    expect(inside, `focus trapped in dialog (tab ${i + 1})`).toBe(true);
  }
  await page.keyboard.press('Escape');
  await expect(dialog, 'Esc closes the sheet (keep brewing)').toBeHidden();
  expect((await timer(page)).status).toBe('running');
  expect(await page.evaluate(() => document.activeElement !== document.body), 'focus restored, not dropped to <body>').toBe(true);

  await page.evaluate(`__kettle.ff(${2 * MIN})`);
  await page.keyboard.press('Escape');
  await expect(dialog).toBeVisible();
  let onLeave = false;
  for (let i = 0; i < 8 && !onLeave; i++) {
    onLeave = await page.evaluate(() => /leave|end|stop/i.test((document.activeElement as HTMLElement | null)?.innerText ?? ''));
    if (!onLeave) await page.keyboard.press('Tab');
  }
  expect(onLeave, 'confirm-leave button reachable by Tab').toBe(true);
  await page.keyboard.press('Enter');
  await expect.poll(async () => (await timer(page)).status).toBe('idle');
});

// ---------------------------------------------------------------- 8b. round-1 additions

test('reload mid-celebration resumes the same card', async ({ page }) => {
  test.setTimeout(240_000);
  await boot(page, { seed: 'celebrate' });
  await startFromHome(page);
  await page.evaluate('__kettle.finish()');
  await expect.poll(() => route(page)).toBe('/done');
  await page.waitForTimeout(2500);
  await press(await mustControl(page, /^continue\b/i, 'Continue on card 1', ['button']));
  await page.waitForTimeout(1800);
  const cardLabel = async () => (await page.locator('[aria-label^="Card "]').first().getAttribute('aria-label')) ?? '';
  const before = await cardLabel();
  expect(before, 'card counter present').toMatch(/Card 2 of \d+/);
  const sessionsBefore = (await focusSessions(page)).length;
  await reopen(page, '/done');
  await page.waitForTimeout(1500);
  expect(await route(page), 'still celebrating after reload').toBe('/done');
  expect(await cardLabel(), 'same card after reload').toBe(before);
  expect((await focusSessions(page)).length, 'reload does not re-record the brew').toBe(sessionsBefore);
  await shot(page, 'reload-mid-celebration');
});

test('two tabs: one timer, shared state, no double counting', async ({ page, context }) => {
  test.setTimeout(240_000);
  await boot(page, { seed: 'newbie' });
  const b = await context.newPage();
  const bErrors: string[] = [];
  b.on('pageerror', (e) => bErrors.push(e.message));
  await b.goto('/?debug#/', { waitUntil: 'networkidle' });
  await waitKettle(b);
  const before = (await focusSessions(page)).length;

  await startFromHome(page);
  await expect.poll(async () => (await timer(b)).status, { message: 'tab B sees the brew started in tab A' }).toBe('running');
  await expect.poll(() => route(b), { message: 'tab B follows to focus' }).toBe('/focus');
  const ra = (await timer(page)).remainingMs;
  const rb = (await timer(b)).remainingMs;
  expect(Math.abs(ra - rb), 'both tabs show the same remaining time').toBeLessThan(1500);

  await b.bringToFront();
  await b.evaluate('__kettle.timer.getState().pause()');
  await expect.poll(async () => (await timer(page)).status, { message: 'pause in B reflects in A' }).toBe('paused');
  await page.bringToFront();
  await page.evaluate('__kettle.timer.getState().resume()');
  await expect.poll(async () => (await timer(b)).status).toBe('running');

  // Both tabs share one real clock; finish via A and let both tick.
  const endsIn = await K<number>(page, `__kettle.timer.getState().endsAt - Date.now()`);
  await page.evaluate(`__kettle.ff(${endsIn} + 50)`);
  await b.evaluate(`__kettle.ff(${endsIn} + 50)`);
  await page.evaluate('__kettle.timer.getState().tick()');
  await b.evaluate('__kettle.timer.getState().tick()');
  await expect.poll(async () => (await focusSessions(page)).length - before, { timeout: 20_000, message: 'brew recorded (tab A view)' }).toBeGreaterThan(0);
  await expect.poll(async () => (await focusSessions(b)).length - before, { timeout: 20_000, message: 'brew recorded (tab B view)' }).toBeGreaterThan(0);
  await page.waitForTimeout(2000);
  const recA = (await focusSessions(page)).length - before;
  const recB = (await focusSessions(b)).length - before;
  expect(recA, 'exactly one brew recorded (tab A view)').toBe(1);
  expect(recB, 'exactly one brew recorded (tab B view)').toBe(1);
  expect(bErrors, 'no page errors in tab B').toEqual([]);
  await shot(page, 'two-tabs-a');
  await b.screenshot({ path: `${OUT}two-tabs-b.png` });
});

test('offline after first load (installed service worker)', async ({ page, context }) => {
  await boot(page, { seed: 'newbie' });
  const hasSW = await K<boolean>(page, `'serviceWorker' in navigator && !!navigator.serviceWorker.controller || false`);
  const ready = await K<boolean>(
    page,
    `(async () => { if (!('serviceWorker' in navigator)) return false;
       const reg = await Promise.race([navigator.serviceWorker.ready, new Promise(r => setTimeout(() => r(null), 8000))]);
       return !!reg; })()`,
  );
  test.skip(!ready, 'no service worker (dev server) — run with the built preview (KETTLE_SNAPSHOT=1)');
  if (!hasSW) {
    await page.reload({ waitUntil: 'networkidle' }); // first load installs; second is controlled
    await waitKettle(page);
  }
  await context.setOffline(true);
  await page.reload({ waitUntil: 'load' });
  await waitKettle(page);
  await expect(page.locator('main, [role="main"]').first(), 'app shell renders offline').toBeVisible();
  for (const r of ['/stats', '/settings', '/nook']) {
    await page.evaluate(`__kettle.navigate('${r}')`);
    await page.waitForTimeout(1200);
    await expect(page.locator('main, [role="main"]').first(), `${r} renders offline (lazy chunk precached)`).toBeVisible();
  }
  await page.evaluate(`__kettle.navigate('/')`);
  await startFromHome(page);
  await shot(page, 'offline-focus');
  await context.setOffline(false);
});

test.describe('reduced motion', () => {
  test.beforeEach(async ({ page }) => page.emulateMedia({ reducedMotion: 'reduce' }));
  test('core loop under prefers-reduced-motion: start → finish → cards → break', async ({ page }) => {
  test.setTimeout(240_000);
    await boot(page, { seed: 'celebrate' });
    expect(await K<boolean>(page, `matchMedia('(prefers-reduced-motion: reduce)').matches`), 'reduced-motion emulation is active').toBe(true);
    await shot(page, 'rm-home');
    await startFromHome(page);
    await page.waitForTimeout(800);
    await shot(page, 'rm-focus');
    await page.evaluate('__kettle.finish()');
    await expect.poll(() => route(page)).toBe('/done');
    for (let i = 0; i < 8; i++) {
      await page.waitForTimeout(1200);
      await shot(page, `rm-done-${i}`);
      if ((await route(page)) !== '/done') break;
      const next = await findControl(page, [/^(continue|next)\b/i, /^(start (my |a |the )?(tea )?break|tea time|take a break)/i], ['button']);
      if (!next) break;
      await next.click();
    }
    await expect.poll(async () => (await timer(page)).phase, { timeout: 15_000 }).toMatch(/Break$/);
    await shot(page, 'rm-break');
    // With reduced motion nothing should be mid-transform after settling.
    const moving = await K<string[]>(
      page,
      `[...document.querySelectorAll('*')].filter(el => el.getAnimations && el.getAnimations().some(a => a.playState === 'running' &&
         (a.effect?.getKeyframes?.() ?? []).some(k => k.transform && k.transform !== 'none'))).slice(0, 8).map(el => el.tagName.toLowerCase() + ' in ' + ((el.closest('[data-art]') && el.closest('[data-art]').getAttribute('data-art')) || (el.closest('svg') && (el.closest('svg').getAttribute('aria-label') || el.closest('svg').getAttribute('class'))) || '?') + ' [' + el.getAnimations().map(a => (a.animationName || a.constructor.name) + ':' + JSON.stringify((a.effect.getKeyframes()[0] || {}).transform || '')).join(',') + ']')`,
    );
    const diag = await K<string>(page, `JSON.stringify({ motion: __kettle.settings.getState().motion, mq: matchMedia('(prefers-reduced-motion: reduce)').matches, poses: [...document.querySelectorAll('[data-pose]')].map(x => x.getAttribute('data-pose') + ':' + String(x.getAttribute('class')).includes('live')), liveArt: [...document.querySelectorAll('[data-art]')].filter(x => String(x.getAttribute('class')).includes('live')).map(x => x.getAttribute('data-art')) })`);
    test.info().annotations.push({ type: 'rm-diag', description: diag });
    expect(moving, 'no running transform animations under reduced motion (fades only)').toEqual([]);
  });
});

// ---------------------------------------------------------------- 9. axe on every route, light + dark

type Scene = { name: string; boot: Boot; setup?: (page: Page) => Promise<void> };
const SCENES: Scene[] = [
  { name: 'welcome', boot: { seed: 'fresh', onboarded: '0', route: '/welcome' } },
  { name: 'home', boot: { seed: 'veteran', route: '/' } },
  { name: 'home-empty', boot: { seed: 'blank', route: '/' } },
  { name: 'stats', boot: { seed: 'veteran', route: '/stats' } },
  { name: 'stats-empty', boot: { seed: 'blank', route: '/stats' } },
  { name: 'nook', boot: { seed: 'veteran', route: '/nook' } },
  { name: 'settings', boot: { seed: 'veteran', route: '/settings' } },
  {
    name: 'focus',
    boot: { seed: 'newbie' },
    setup: async (p) => {
      await p.evaluate(`__kettle.timer.getState().startFocus({ intention: 'Thesis chapter 3', tag: 'study' })`);
      await p.evaluate(`__kettle.ff(${8 * MIN})`);
    },
  },
  {
    name: 'focus-paused',
    boot: { seed: 'newbie' },
    setup: async (p) => {
      await p.evaluate(`__kettle.timer.getState().startFocus()`);
      await p.waitForTimeout(300);
      await p.evaluate(`__kettle.timer.getState().pause()`);
    },
  },
  {
    name: 'end-sheet',
    boot: { seed: 'newbie' },
    setup: async (p) => {
      await p.evaluate(`__kettle.timer.getState().startFocus()`);
      await p.waitForTimeout(600);
      const end = await findControl(p, /^(end|leave|stop)/i, ['button']);
      if (end) await press(end);
      else await p.keyboard.press('Escape');
    },
  },
  { name: 'break', boot: { seed: 'newbie' }, setup: async (p) => p.evaluate(`__kettle.timer.getState().startBreak('shortBreak')`) },
  {
    name: 'done',
    boot: { seed: 'celebrate' },
    setup: async (p) => {
      await p.evaluate(`__kettle.timer.getState().startFocus()`);
      await p.waitForTimeout(300);
      await p.evaluate('__kettle.finish()');
    },
  },
];

test.describe('axe-core (WCAG 2.2 AA)', () => {
  // Settle end states (avoids mid-fade contrast false positives). NB: test.use({ reducedMotion }) did not
  // take effect in this setup (matchMedia stayed false), so emulate on the page in each test.
  test.beforeEach(async ({ page }) => page.emulateMedia({ reducedMotion: 'reduce' }));
  for (const theme of ['light', 'dark'] as const) {
    for (const sc of SCENES) {
      test(`axe: ${sc.name} · ${theme}`, async ({ page }, info) => {
        await boot(page, { ...sc.boot, theme });
        if (sc.setup) await sc.setup(page);
        await page.waitForTimeout(1200);
        const res = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze();
        writeFileSync(`${OUT}axe-${sc.name}-${theme}.json`, JSON.stringify(res.violations, null, 2));
        const fmt = (v: (typeof res.violations)[number]) =>
          `${v.impact} ${v.id}: ${v.help} (${v.nodes.length}×) → ${v.nodes
            .slice(0, 3)
            .map((n) => n.target.join(' '))
            .join(' | ')}`;
        const blocking = res.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical').map(fmt);
        const minor = res.violations.filter((v) => v.impact !== 'serious' && v.impact !== 'critical').map(fmt);
        if (minor.length) info.annotations.push({ type: 'axe-minor', description: minor.join('\n') });
        expect(blocking, `serious/critical axe violations on ${sc.name} (${theme})`).toEqual([]);
      });
    }
  }
});

// ---------------------------------------------------------------- 10. console-clean route walk

test('route walk: every route renders with no console errors', async ({ page }) => {
  await boot(page, { seed: 'veteran' });
  for (const r of ['/', '/stats', '/nook', '/settings']) {
    await page.evaluate(`__kettle.navigate('${r}')`);
    await page.waitForTimeout(1200);
    await expect(page.locator('main, [role="main"]').first(), `${r} renders a main landmark`).toBeVisible();
  }
  await page.evaluate(`__kettle.timer.getState().startFocus()`);
  await page.waitForTimeout(1500);
  await page.evaluate('__kettle.finish()');
  await page.waitForTimeout(2000);
});

// ---------------------------------------------------------------- 11. responsive

const VIEWPORTS = {
  '320': { viewport: { width: 320, height: 640 }, isMobile: true, hasTouch: true, touch: true },
  '390': { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, touch: true },
  landscape: { viewport: { width: 844, height: 390 }, isMobile: true, hasTouch: true, touch: true },
  tablet: { viewport: { width: 820, height: 1180 }, isMobile: true, hasTouch: true, touch: true },
  '1440': { viewport: { width: 1440, height: 900 }, isMobile: false, hasTouch: false, touch: false },
  '1920': { viewport: { width: 1920, height: 1080 }, isMobile: false, hasTouch: false, touch: false },
} as const;

const LAYOUT_SCENES = SCENES.filter((s) => ['welcome', 'home', 'stats', 'nook', 'settings', 'focus', 'end-sheet', 'break', 'done'].includes(s.name));

type LayoutReport = { scrollW: number; innerW: number; overflow: string[]; overlaps: string[]; small: string[] };

async function layoutAudit(page: Page): Promise<LayoutReport> {
  return page.evaluate(() => {
    const innerW = window.innerWidth;
    const label = (el: Element) => {
      const h = el as HTMLElement;
      const name = (h.getAttribute('aria-label') || h.innerText || h.getAttribute('title') || '').trim().replace(/\s+/g, ' ').slice(0, 40);
      return `${el.tagName.toLowerCase()}${h.id ? '#' + h.id : ''}${name ? ` "${name}"` : ''}`;
    };
    const visible = (el: Element) => {
      const r = el.getBoundingClientRect();
      const cs = getComputedStyle(el);
      return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none' && Number(cs.opacity) > 0.05;
    };
    const clippedX = (el: Element) => {
      for (let p = el.parentElement; p && p !== document.body; p = p.parentElement) {
        const ox = getComputedStyle(p).overflowX;
        if (ox === 'hidden' || ox === 'auto' || ox === 'scroll' || ox === 'clip') return true;
      }
      return false;
    };
    const fixedCtx = (el: Element) => {
      for (let p: Element | null = el; p; p = p.parentElement) {
        const pos = getComputedStyle(p).position;
        if (pos === 'fixed' || pos === 'sticky') return p;
      }
      return null;
    };
    const overflow: string[] = [];
    for (const el of Array.from(document.body.querySelectorAll('*'))) {
      if (!visible(el) || el.closest('[aria-hidden="true"]') || el.tagName === 'CANVAS') continue;
      const r = el.getBoundingClientRect();
      if ((r.right > innerW + 1 || r.left < -1) && !clippedX(el)) overflow.push(`${label(el)} x=${Math.round(r.left)}..${Math.round(r.right)}`);
    }
    const sel = 'button, a[href], input, select, textarea, [role="button"], [role="tab"], [role="switch"], [role="slider"], [role="radio"], [role="checkbox"], [role="link"]';
    const ctrls = Array.from(document.querySelectorAll(sel)).filter((el) => visible(el) && !el.closest('[aria-hidden="true"], [inert]'));
    const overlaps: string[] = [];
    for (let i = 0; i < ctrls.length; i++)
      for (let j = i + 1; j < ctrls.length; j++) {
        const a = ctrls[i];
        const b = ctrls[j];
        if (a.contains(b) || b.contains(a) || fixedCtx(a) !== fixedCtx(b)) continue;
        const ra = a.getBoundingClientRect();
        const rb = b.getBoundingClientRect();
        const w = Math.min(ra.right, rb.right) - Math.max(ra.left, rb.left);
        const h = Math.min(ra.bottom, rb.bottom) - Math.max(ra.top, rb.top);
        if (w > 4 && h > 4) overlaps.push(`${label(a)} ⟂ ${label(b)} (${Math.round(w)}×${Math.round(h)})`);
      }
    const small = ctrls
      .filter((el) => !(el.tagName === 'A' && getComputedStyle(el).display === 'inline'))
      .map((el) => [el, el.getBoundingClientRect()] as const)
      .filter(([, r]) => r.width < 44 || r.height < 44)
      .map(([el, r]) => `${label(el)} ${Math.round(r.width)}×${Math.round(r.height)}`);
    return { scrollW: document.documentElement.scrollWidth, innerW, overflow: overflow.slice(0, 20), overlaps: overlaps.slice(0, 20), small: small.slice(0, 30) };
  });
}

for (const [vpName, vp] of Object.entries(VIEWPORTS)) {
  test.describe(`responsive ${vpName}`, () => {
    test.use({ viewport: vp.viewport, isMobile: vp.isMobile, hasTouch: vp.hasTouch });
    for (const sc of LAYOUT_SCENES) {
      test(`layout: ${sc.name} @ ${vpName}`, async ({ page }, info) => {
        await boot(page, { ...sc.boot, theme: 'light' });
        if (sc.setup) await sc.setup(page);
        await page.waitForTimeout(1500);
        await shot(page, `resp-${vpName}-${sc.name}`, true);
        const rep = await layoutAudit(page);
        writeFileSync(`${OUT}layout-${vpName}-${sc.name}.json`, JSON.stringify(rep, null, 2));
        expect(rep.scrollW, `no horizontal page scroll (${rep.scrollW} > ${rep.innerW})`).toBeLessThanOrEqual(rep.innerW + 1);
        expect(rep.overflow, 'no element sticks out of the viewport horizontally').toEqual([]);
        expect(rep.overlaps, 'no overlapping interactive controls').toEqual([]);
        if (vp.touch) {
          if (rep.small.length) info.annotations.push({ type: 'tap-targets<44', description: rep.small.join('\n') });
          expect.soft(rep.small, 'touch targets ≥ 44×44').toEqual([]);
        }
      });
    }
  });
}
