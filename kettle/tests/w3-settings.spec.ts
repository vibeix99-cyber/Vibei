/**
 * Wave 3 · Settings and shared controls (I11). Real taps, clicks and keys; the debug API only sets up state.
 *
 *   KETTLE_PORT=5503 npx playwright test tests/w3-settings.spec.ts --project=chromium
 *
 * - Theme, rhythm, motion, sound, ambience, daily goal and 3D nook keep their choice across a reload, and "Reset
 *   everything" (in a fresh, disposable browser profile) returns each to its default.
 * - Keyboard focus: every Tab stop on Settings shows the shared ring (≥ 2 px, ≥ 3:1 against what is behind it, not
 *   clipped), light and dark, phone and desktop; inert controls are not Tab stops.
 * - Inert, pressed and selected states: a row whose switch can't change does not react to hover or press; a pressed
 *   segment differs from a hovered one and from the selected one; the field and the selected segment keep a visible
 *   indicator in forced colours.
 * - Words: no "streak" anywhere on Settings (text, labels, titles); sound and nudges say what they can't do.
 */
import { test, expect, type Browser, type Page } from '@playwright/test';

/* eslint-disable @typescript-eslint/no-explicit-any */
const base = (u: string | undefined) => (u ?? 'http://127.0.0.1:5183').replace(/\/$/, '');
const FIXED = Date.parse('2026-10-12T07:40:00.000Z');

async function device(browser: Browser, w: number, h: number, theme: 'light' | 'dark' = 'light') {
  const touch = w < h;
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, isMobile: touch, hasTouch: touch, colorScheme: theme, timezoneId: 'UTC', locale: 'en-GB', reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  await page.clock.install({ time: FIXED });
  await page.clock.resume();
  return { ctx, page };
}

async function ready(page: Page) {
  await page.waitForFunction(() => !!(window as any).__kettle, null, { timeout: 60_000 });
  await page.evaluate(() => document.fonts.ready);
  await page.getByRole('heading', { name: 'Settings', level: 1 }).waitFor();
  await page.waitForTimeout(600);
}

const stored = (page: Page) => page.evaluate(() => JSON.parse(localStorage.getItem('kettle:settings') || '{}').state ?? {});

test('preferences persist across a reload; Reset everything returns each to its default', async ({ browser, baseURL }) => {
  const { ctx, page } = await device(browser, 390, 844);
  // A fresh profile (this context), past the welcome. No seed and no theme param: nothing re-applied on reload.
  await page.goto(`${base(baseURL)}/?debug&onboarded=1#/settings`);
  await ready(page);
  const radio = (group: string, name: string) => page.getByRole('radiogroup', { name: group }).getByRole('radio', { name, exact: true });

  await radio('Theme', 'Night').click();
  await radio('Rhythm preset', 'Deep').click();
  await radio('Motion', 'Reduced').click();
  await radio('3D nook quality', 'Low').click();
  await page.getByRole('switch', { name: 'Sounds' }).click();
  await page.getByRole('radiogroup', { name: 'Brewing ambience' }).getByRole('radio', { name: /Fireside/ }).click();
  await page.getByRole('radiogroup', { name: 'Daily goal' }).getByRole('radio', { name: /A pot/ }).click();
  const tea = page.getByRole('spinbutton', { name: 'Tea break length' });
  await tea.focus();
  await page.keyboard.press('ArrowUp'); // Deep's 10 → 11: the preset becomes Custom

  const check = async () => {
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await expect(page.locator('html')).toHaveAttribute('data-motion', 'reduce');
    await expect(radio('Theme', 'Night')).toBeChecked();
    await expect(radio('Rhythm preset', 'Custom')).toBeChecked();
    await expect(page.getByRole('spinbutton', { name: 'Brew length' })).toHaveAttribute('aria-valuenow', '50');
    await expect(tea).toHaveAttribute('aria-valuenow', '11');
    await expect(radio('Motion', 'Reduced')).toBeChecked();
    await expect(radio('3D nook quality', 'Low')).toBeChecked();
    await expect(page.getByRole('switch', { name: 'Sounds' })).not.toBeChecked();
    await expect(page.getByRole('radiogroup', { name: 'Brewing ambience' }).getByRole('radio', { name: /Fireside/ })).toBeChecked();
    await expect(page.getByRole('radiogroup', { name: 'Daily goal' }).getByRole('radio', { name: /A pot/ })).toBeChecked();
  };
  await check();
  await page.reload();
  await ready(page);
  await check();
  expect(await stored(page)).toMatchObject({ theme: 'dark', rhythm: 'custom', focusMin: 50, shortBreakMin: 11, motion: 'reduce', scene: 'low', muted: true, ambient: 'fire', dailyGoalMin: 60 });

  // Reset everything, with real clicks: the row, then the sheet's destructive button.
  await page.getByRole('button', { name: /Reset everything/ }).click();
  const sheet = page.getByRole('dialog', { name: 'Start fresh?' });
  await expect(sheet).toBeVisible();
  await expect(sheet).toContainText('This clears your brews, warm days, leaves, recipes and settings on this device.');
  await sheet.getByRole('button', { name: 'Reset everything' }).click();
  await expect(sheet).toBeHidden();
  expect(await stored(page)).toMatchObject({ onboarded: false, theme: 'auto', rhythm: 'classic', focusMin: 25, shortBreakMin: 5, longBreakMin: 15, longBreakEvery: 4, motion: 'system', scene: 'auto', muted: false, ambient: 'rain', dailyGoalMin: 30 });

  // The defaults hold after a reload too, and Settings shows them (onboarded=1 only skips the welcome again).
  await page.goto(`${base(baseURL)}/?debug&onboarded=1#/settings`);
  await page.reload();
  await ready(page);
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light'); // auto, device is light
  await expect(page.locator('html')).not.toHaveAttribute('data-motion', 'reduce');
  await expect(radio('Theme', 'Auto')).toBeChecked();
  await expect(radio('Rhythm preset', 'Classic')).toBeChecked();
  await expect(radio('Motion', 'System')).toBeChecked();
  await expect(radio('3D nook quality', 'Auto')).toBeChecked();
  await expect(page.getByRole('switch', { name: 'Sounds' })).toBeChecked();
  await expect(page.getByRole('radiogroup', { name: 'Brewing ambience' }).getByRole('radio', { name: /Rain/ })).toBeChecked();
  await expect(page.getByRole('radiogroup', { name: 'Daily goal' }).getByRole('radio', { name: /A cup/ })).toBeChecked();
  await ctx.close();
});

/** The focused element's ring: where it is drawn, its width, contrast against what's behind it, and clipping. */
const ringNow = (page: Page) =>
  page.evaluate(() => {
    const el = document.activeElement as HTMLElement | null;
    if (!el || el === document.body) return null;
    const lum = (c: string) => {
      const m = c.match(/[\d.]+/g)!.map(Number);
      const f = (v: number) => ((v /= 255) <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
      return { L: 0.2126 * f(m[0]) + 0.7152 * f(m[1]) + 0.0722 * f(m[2]), a: m[3] ?? 1 };
    };
    const name = `${el.tagName.toLowerCase()}[${el.getAttribute('role') ?? ''}] ${(el.getAttribute('aria-label') || el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 40)}`;
    const ring = [el, ...el.querySelectorAll<HTMLElement>('*'), el.parentElement, el.parentElement?.parentElement].find((e) => {
      if (!e) return false;
      const cs = getComputedStyle(e);
      return cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) >= 2;
    }) as HTMLElement | undefined;
    if (!ring) return { name, ring: false, visible: el.matches(':focus-visible') };
    const cs = getComputedStyle(ring);
    const w = parseFloat(cs.outlineWidth);
    const off = parseFloat(cs.outlineOffset);
    let bgEl: HTMLElement | null = off >= 0 ? ring.parentElement : ring;
    let bg = getComputedStyle(document.body).backgroundColor;
    for (; bgEl; bgEl = bgEl.parentElement) {
      const b = getComputedStyle(bgEl).backgroundColor;
      if (lum(b).a > 0.5) {
        bg = b;
        break;
      }
    }
    const a = lum(cs.outlineColor).L;
    const b = lum(bg).L;
    const contrast = (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
    const r = ring.getBoundingClientRect();
    const g = off + w;
    const box = { l: r.left - g, t: r.top - g, r: r.right + g, b: r.bottom + g };
    let clipped = 0;
    for (let p = ring.parentElement; p && p !== document.documentElement; p = p.parentElement) {
      const pcs = getComputedStyle(p);
      if (!/(hidden|auto|scroll|clip)/.test(pcs.overflowX + pcs.overflowY)) continue;
      const pr = p.getBoundingClientRect();
      clipped = Math.max(clipped, pr.left + p.clientLeft - box.l, pr.top + p.clientTop - box.t, box.r - (pr.left + p.clientLeft + p.clientWidth), box.b - (pr.top + p.clientTop + p.clientHeight));
    }
    return { name, ring: true, width: w, contrast: +contrast.toFixed(2), clipped: +clipped.toFixed(1) };
  });

for (const [w, h] of [
  [390, 844],
  [1440, 900],
] as const)
  for (const theme of ['light', 'dark'] as const)
    test(`keyboard focus is always visible on Settings (${w}×${h}, ${theme}); inert controls are not Tab stops`, async ({ browser, baseURL }) => {
      const { ctx, page } = await device(browser, w, h, theme);
      // Sounds off: the three volume sliders are inert. Nudges are blocked in this browser profile (headless default),
      // or forced so below: the switch is inert.
      await ctx.addInitScript(() => {
        try {
          Object.defineProperty(Notification, 'permission', { get: () => 'denied' });
        } catch {
          /* ignore */
        }
      });
      await page.goto(`${base(baseURL)}/?debug&seed=veteran&theme=${theme}#/settings`);
      await ready(page);
      await page.evaluate(() => (window as any).__kettle.settings.getState().set({ muted: true }));
      await page.waitForTimeout(300);
      await page.mouse.click(2, 2);
      const seen: string[] = [];
      const bad: unknown[] = [];
      for (let i = 0; i < 60; i++) {
        await page.keyboard.press('Tab');
        const r = await ringNow(page);
        if (!r) continue;
        if (seen.includes(r.name)) break;
        seen.push(r.name);
        if (!r.ring || (r.width ?? 0) < 2 || (r.contrast ?? 0) < 3 || (r.clipped ?? 0) > 1) bad.push(r);
      }
      expect(seen.length, seen.join('\n')).toBeGreaterThan(15);
      expect(bad, JSON.stringify(bad, null, 1)).toEqual([]);
      // Inert controls are not Tab stops.
      expect(seen.some((n) => n.startsWith('div[slider]'))).toBe(false);
      expect(seen.some((n) => n.startsWith('button[switch]') && /Nudges/.test(n))).toBe(false);
      await expect(page.getByRole('switch', { name: 'Nudges' })).toBeDisabled();
      for (const v of ['Master volume', 'Effects', 'Ambience']) await expect(page.getByRole('slider', { name: v })).toHaveAttribute('tabindex', '-1');
      await ctx.close();
    });

test('a row whose switch cannot change does not react to hover or press; a live row does', async ({ browser, baseURL }) => {
  const { ctx, page } = await device(browser, 1440, 900);
  await ctx.addInitScript(() => {
    try {
      Object.defineProperty(Notification, 'permission', { get: () => 'denied' });
    } catch {
      /* ignore */
    }
  });
  await page.goto(`${base(baseURL)}/?debug&seed=veteran&theme=light#/settings`);
  await ready(page);
  const rowOf = (sw: string) => page.locator('[class*="_row_"]', { has: page.getByRole('switch', { name: sw }) }).last();
  const look = async (sw: string) => {
    const row = rowOf(sw);
    const label = row.getByText(sw, { exact: true });
    await page.mouse.move(2, 890);
    await page.waitForTimeout(250);
    const rest = await row.evaluate((e) => getComputedStyle(e).backgroundColor);
    await label.hover();
    await page.waitForTimeout(250);
    const hover = await row.evaluate((e) => [getComputedStyle(e).backgroundColor, getComputedStyle(e).cursor]);
    await page.mouse.down();
    await page.waitForTimeout(120);
    const pressed = await row.evaluate((e) => getComputedStyle(e).backgroundColor);
    await page.mouse.move(2, 890);
    await page.mouse.up();
    return { rest, hover: hover[0], cursor: hover[1], pressed };
  };
  const inert = await look('Nudges');
  expect(inert.hover).toBe(inert.rest);
  expect(inert.pressed).toBe(inert.rest);
  expect(inert.cursor).not.toBe('pointer');
  const live = await look('Tea breaks');
  expect(live.hover).not.toBe(live.rest);
  expect(live.pressed).not.toBe(live.hover);
  expect(live.cursor).toBe('pointer');
  await ctx.close();
});

test('a pressed segment reads as pressed: unlike hover and unlike the selected one', async ({ browser, baseURL }) => {
  const { ctx, page } = await device(browser, 1440, 900);
  await page.goto(`${base(baseURL)}/?debug&seed=veteran&theme=light#/settings`);
  await ready(page);
  const group = page.getByRole('radiogroup', { name: 'Motion' });
  const opt = group.getByRole('radio', { name: 'Full', exact: true });
  const inner = (l: typeof opt) => l.evaluate((e) => getComputedStyle(e.querySelector('[class*="inner"]')!).backgroundColor);
  const selectedThumb = await group.getByRole('radio', { checked: true }).evaluate((e) => getComputedStyle(e.querySelector('[class*="thumb"]')!).backgroundColor);
  await opt.hover();
  await page.waitForTimeout(250);
  const hover = await inner(opt);
  await page.mouse.down();
  await page.waitForTimeout(120);
  const pressed = await inner(opt);
  await page.mouse.move(2, 890);
  await page.mouse.up();
  expect(pressed).not.toBe(hover);
  expect(pressed).not.toBe(selectedThumb);
  await expect(group.getByRole('radio', { name: 'System', exact: true })).toBeChecked(); // released away: no change
  await ctx.close();
});

test('forced colours: the focused field keeps its ring and the selected segment stays visible', async ({ browser, baseURL }) => {
  const { ctx, page } = await device(browser, 1440, 900);
  await page.emulateMedia({ forcedColors: 'active' });
  await page.goto(`${base(baseURL)}/?debug&seed=veteran&theme=light#/settings`);
  await ready(page);
  await page.mouse.click(2, 2);
  await page.keyboard.press('Tab');
  for (let i = 0; i < 10 && !(await page.evaluate(() => document.activeElement?.tagName === 'INPUT')); i++) await page.keyboard.press('Tab');
  const field = await page.evaluate(() => {
    const box = document.activeElement!.parentElement!;
    const cs = getComputedStyle(box);
    return { style: cs.outlineStyle, width: parseFloat(cs.outlineWidth) };
  });
  expect(field.style).toBe('solid');
  expect(field.width).toBeGreaterThanOrEqual(2);
  const thumb = await page
    .getByRole('radiogroup', { name: 'Theme' })
    .getByRole('radio', { checked: true })
    .evaluate((e) => {
      const cs = getComputedStyle(e.querySelector('[class*="thumb"]')!);
      return { style: cs.borderTopStyle, width: parseFloat(cs.borderTopWidth) };
    });
  expect(thumb.style).toBe('solid');
  expect(thumb.width).toBeGreaterThanOrEqual(2);
  await ctx.close();
});

test('Settings never says "streak", and sound and nudges say what they cannot do', async ({ browser, baseURL }) => {
  const { ctx, page } = await device(browser, 390, 844);
  await ctx.addInitScript(() => {
    (window as any).__perm = 'granted';
    try {
      Object.defineProperty(Notification, 'permission', { get: () => (window as any).__perm });
    } catch {
      /* ignore */
    }
  });
  await page.goto(`${base(baseURL)}/?debug&seed=veteran&theme=light#/settings`);
  await ready(page);
  await page.evaluate(() => (window as any).__kettle.settings.getState().set({ muted: false, notifications: true }));
  await page.waitForTimeout(300);
  const words = await page.evaluate(() => {
    const main = document.body;
    const attrs = [...main.querySelectorAll('[aria-label],[title],[aria-description],[alt]')].map((e) => ['aria-label', 'title', 'aria-description', 'alt'].map((a) => e.getAttribute(a) ?? '').join(' '));
    return `${main.innerText}\n${attrs.join('\n')}`;
  });
  expect(words).not.toMatch(/streak/i);
  await expect(page.getByText('One finished brew makes a warm day. The goal is just for you.')).toBeVisible();
  await expect(page.getByText(/play while Kettle is open, in a tab or as the app, once you’ve tapped anything in it\. Closed, Kettle can’t make a sound/)).toBeVisible();
  await expect(page.getByText(/while Kettle is open but out of sight, I’ll nudge you\. With Kettle closed, no nudge can come\./)).toBeVisible();
  // Muted: the quiet line.
  await page.getByRole('switch', { name: 'Sounds' }).click();
  await expect(page.getByText('Everything’s quiet. The kettle still shows when it whistles.')).toBeVisible();
  // The reset sheet uses the same words.
  await page.getByRole('button', { name: /Reset everything/ }).click();
  await expect(page.getByRole('dialog', { name: 'Start fresh?' })).not.toContainText(/streak/i);
  await ctx.close();
});
