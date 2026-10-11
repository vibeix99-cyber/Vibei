/**
 * Wave 2 · I09 (Maker N): the Focus backdrop shows the user's earned items when the 3D room is off or still loading,
 * and the Nook's hint tells the truth about the static drawing.
 *
 *  - 3D off, and 3D still loading: the window still carries pre-rendered layers of the earned window-visible items
 *    (src/scene/stills/items, scripts/stills/render-item-layers.mjs), painted where the live 3D view has them.
 *  - Static Nook (3D off, or no WebGL): the hint no longer says "Drag to look around · tap things" over a drawing that
 *    can't be dragged or tapped. With 3D on, the hint is unchanged.
 *
 * Real input (clicks) for every user step; the debug API only seeds a profile and sets the 3D preference.
 *
 *   KETTLE_PORT=5213 npx playwright test tests/w2-room.spec.ts --project=chromium
 */
import { test, expect, type Page } from '@playwright/test';

/* eslint-disable @typescript-eslint/no-explicit-any */
/** Window-visible backdrop items, unlock order (src/scene/stills/items.json `order`). */
const WINDOW_ITEMS = ['pothos', 'books', 'fairyLights', 'shelf', 'recordPlayer', 'monstera', 'telescope', 'kotatsu'];
const LIVE_HINT = 'Drag to look around · tap things';

const ready = (page: Page) =>
  page.waitForFunction(() => {
    const i = (window as any).__kettle?.timerInfo?.();
    return !!(i && i.leader && i.leaderForMs > 400 && !i.settling);
  }, null, { timeout: 60_000 });

/** A veteran profile (level 12), muted, no auto-start; 3D preference as given (after a reload, as a user would). */
async function boot(page: Page, scene: 'auto' | 'off', hash = '#/') {
  await page.goto(`/?debug&seed=veteran&theme=light&nooktime=day&nookweather=clear${hash}`);
  await ready(page);
  await page.evaluate((scene) => (window as any).__kettle.settings.getState().set({ scene, muted: true, autoStartBreaks: false, autoStartFocus: false }), scene);
  await page.reload();
  await ready(page);
}

/** The earned items the backdrop should show, from the app's own progression. */
async function expectedItems(page: Page): Promise<string[]> {
  const unlocked: string[] = await page.evaluate(async () => {
    const { itemsUnlockedAt } = await import('/src/progress/items.ts' as string);
    const { levelFromLeaves } = await import('/src/progress/levels.ts' as string);
    return itemsUnlockedAt(levelFromLeaves((window as any).__kettle.progress.getState().leaves).level);
  });
  return WINDOW_ITEMS.filter((id) => unlocked.includes(id));
}

/** Start a brew with a real click and return the Focus backdrop's static host. */
async function startBrew(page: Page) {
  await page.getByRole('button', { name: /put the kettle on/i }).first().click();
  await page.waitForFunction(() => location.hash === '#/focus');
  return page.locator('[data-scene-mode="window"]').first();
}

/** Every layer is drawn: its file decodes, and hiding the layers visibly changes the backdrop inside each layer's box. */
async function assertLayersDrawn(page: Page, want: string[]) {
  const host = page.locator('[data-scene-mode="window"]').first();
  const layers = host.locator('svg[data-window-items] image[data-item]');
  await expect.poll(async () => layers.evaluateAll((els) => els.map((e) => e.getAttribute('data-item'))), { timeout: 15_000 }).toEqual(want);
  const decoded = await layers.evaluateAll((els) =>
    Promise.all(els.map(async (e) => {
      const img = new Image();
      img.src = (e as SVGImageElement).href.baseVal;
      try {
        await img.decode();
        return img.naturalWidth > 0;
      } catch {
        return false;
      }
    })),
  );
  expect(decoded.every(Boolean)).toBe(true);
  await page.waitForTimeout(300);
  for (const id of want) {
    const box = await host.locator(`image[data-item="${id}"]`).boundingBox();
    const view = page.viewportSize()!;
    // the part of the layer that is on screen (the backdrop is cover-cropped and sits under the counter)
    const clip = box && { x: Math.max(0, box.x), y: Math.max(0, box.y), width: Math.min(view.width, box.x + box.width) - Math.max(0, box.x), height: Math.min(view.height, box.y + box.height) - Math.max(0, box.y) };
    if (!clip || clip.width < 4 || clip.height < 4) continue; // cropped out at this aspect
    const on = await page.screenshot({ clip, animations: 'disabled' });
    await host.locator('svg[data-window-items]').evaluate((s) => ((s as SVGElement).style.visibility = 'hidden'));
    const off = await page.screenshot({ clip, animations: 'disabled' });
    await host.locator('svg[data-window-items]').evaluate((s) => ((s as SVGElement).style.visibility = ''));
    expect(on.equals(off), `layer ${id} changes the backdrop`).toBe(false);
  }
}

test.describe('Focus backdrop: earned items without the live 3D room', () => {
  test('3D off: the window still shows every earned window-visible item', async ({ page }) => {
    await boot(page, 'off');
    const want = await expectedItems(page);
    expect(want.length).toBeGreaterThan(0);
    const host = await startBrew(page);
    await expect(host).toHaveAttribute('data-scene-static', 'true');
    await assertLayersDrawn(page, want);
  });

  test('3D loading: the still shown before the engine is ready carries the same items', async ({ page }) => {
    // Hold the 3D scene module back so the backdrop stays in its loading state (the engine can't start).
    await page.route(/\/src\/scene\/NookScene\.tsx/, async (route) => {
      await new Promise((r) => setTimeout(r, 30_000));
      await route.continue().catch(() => {});
    });
    await boot(page, 'auto');
    const want = await expectedItems(page);
    await startBrew(page);
    const host = page.locator('[data-scene-mode="window"]').first();
    await expect(host).toHaveAttribute('data-scene-static', 'true');
    await assertLayersDrawn(page, want);
    await page.unrouteAll({ behavior: 'ignoreErrors' });
  });
});

test.describe('Nook hint tells the truth', () => {
  const hint = (page: Page) => page.locator('section[aria-label="The room"] p').filter({ hasText: /·/ }).first();

  test('3D off: no drag-and-tap promise over the drawing', async ({ page }) => {
    await boot(page, 'off');
    await page.getByRole('link', { name: /nook/i }).first().click();
    await page.waitForFunction(() => location.hash === '#/nook');
    await expect(page.locator('[data-scene-static="true"]').first()).toBeVisible();
    await expect(hint(page)).toBeVisible();
    await expect(hint(page)).not.toContainText(/drag|look around|tap things/i);
    await expect(hint(page)).toContainText('A drawing of your room');
  });

  test('no WebGL: the same truthful hint', async ({ page }) => {
    await page.addInitScript(() => {
      const orig = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, type: string, ...rest: unknown[]) {
        if (/webgl/i.test(type)) return null;
        return (orig as any).call(this, type, ...rest);
      } as any;
    });
    await boot(page, 'auto');
    await page.getByRole('link', { name: /nook/i }).first().click();
    await page.waitForFunction(() => location.hash === '#/nook');
    await expect(page.locator('[data-scene-static="true"]').first()).toBeVisible();
    await expect(hint(page)).toBeVisible();
    await expect(hint(page)).not.toContainText(/drag|look around|tap things/i);
  });

  test('3D on: the hint is unchanged', async ({ page }) => {
    await boot(page, 'auto');
    await page.getByRole('link', { name: /nook/i }).first().click();
    await page.waitForFunction(() => location.hash === '#/nook');
    await expect(hint(page)).toHaveText(LIVE_HINT);
  });
});
