/**
 * W4 · the animated Rive Chai (reading, sipping, cheering). Real app, debug seed; the debug API only sets up state.
 *
 *   KETTLE_PORT=5651 npx playwright test tests/w4-rive-chai.spec.ts --project=chromium
 *
 * - Pose mapping per screen: Focus stage running = reading, whistle + summary = cheering, tea break = sipping (one
 *   live instance across them), Home hero during a brew = reading, Settings About = sipping. Each is drawn by Rive.
 * - The swap from the painted image to Rive: the canvas already holds Chai (no blank frame), the pose box does not
 *   move (no layout shift), the canvas never takes taps, and its feet sit on the painted image's baseline (<= 1 CSS px).
 * - Composited cleanly: the artboard background is clear (canvas corners transparent) and the file's own cream ground
 *   shadow is gone (nothing below the feet); no request to unpkg, jsdelivr or rive.app.
 * - Fallback: the wasm or chai.riv fails -> the painted image stays (visible, no canvas).
 * - Reduced motion -> the painted image, and no runtime, wasm or .riv request at all.
 * Offline (precached riv + wasm) is in pwa.spec.ts.
 */
import { test, expect, type Browser, type Page } from '@playwright/test';

/* eslint-disable @typescript-eslint/no-explicit-any */
const base = (u: string | undefined) => (u ?? 'http://127.0.0.1:5183').replace(/\/$/, '');
const RIVE_REQ = /riveChai|@rive-app|rive[^/]*\.wasm|\.riv(\?|$)/;
const CDN = /unpkg\.com|jsdelivr\.net|rive\.app/;

async function open(browser: Browser, url: string, opts: { reduced?: boolean } = {}) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, reducedMotion: opts.reduced ? 'reduce' : 'no-preference' });
  const page = await ctx.newPage();
  const requests: string[] = [];
  page.on('request', (r) => requests.push(r.url()));
  // Watch every swap: when a pose box flips to Rive, record whether the canvas already holds ink and whether the box moved.
  await page.addInitScript(() => {
    const w = window as any;
    w.__swaps = [];
    // Layout box (offset metrics: not moved by transforms or entrance animations) of each pose box while it shows the image.
    const box = (e: HTMLElement) => [e.offsetLeft, e.offsetTop, e.offsetWidth, e.offsetHeight];
    const rects = new WeakMap<Element, number[]>();
    const seen = () =>
      document.querySelectorAll<HTMLElement>('[data-chai-render="image"]').forEach((e) => rects.set(e, box(e)));
    new MutationObserver((ms) => {
      for (const m of ms) {
        const el = m.target as HTMLElement;
        if (m.attributeName !== 'data-chai-render' || el.dataset.chaiRender !== 'rive') continue;
        const cv = el.querySelector('canvas')!;
        const d = cv.getContext('2d')!.getImageData(0, 0, cv.width, cv.height).data;
        let ink = 0;
        for (let i = 3; i < d.length; i += 4) if (d[i] > 8) ink++;
        const before = rects.get(el);
        const now = box(el);
        w.__swaps.push({ pose: el.dataset.pose, ink, moved: before ? Math.max(...now.map((v, i) => Math.abs(v - before[i]))) : null });
      }
      seen();
    }).observe(document, { subtree: true, attributes: true, attributeFilter: ['data-chai-render', 'style', 'class'], childList: true });
    addEventListener('DOMContentLoaded', seen);
  });
  await page.goto(`${url}/?debug&seed=veteran&theme=light#/`);
  await page.waitForFunction(() => { const t = (window as any).__kettle?.timerInfo?.(); return !!(t && t.leader && t.leaderForMs > 400 && !t.settling); }, null, { timeout: 60_000 });
  await page.evaluate(() => (window as any).__kettle.settings.getState().set({ muted: true, autoStartBreaks: false, autoStartFocus: false }));
  await page.waitForTimeout(600);
  return { ctx, page, requests };
}

const stageChai = '[data-stage-figure="chai"] [data-pose]';

async function riveIn(page: Page, sel: string, pose: string) {
  await expect(page.locator(sel).first()).toHaveAttribute('data-pose', pose);
  await expect(page.locator(sel).first()).toHaveAttribute('data-chai-render', 'rive', { timeout: 15_000 });
}

/** Canvas checks in one box: corners clear, nothing below the feet, feet on the painted baseline, no taps. */
function canvasFacts(page: Page, sel: string) {
  return page.locator(sel).first().evaluate(async (span) => {
    const cv = span.querySelector('canvas')!;
    const W = cv.width, H = cv.height;
    const d = cv.getContext('2d')!.getImageData(0, 0, W, H).data;
    const a = (x: number, y: number) => d[(y * W + x) * 4 + 3];
    let feet = -1;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (a(x, y) > 8) feet = y;
    const r = cv.getBoundingClientRect();
    const im = span.querySelector('img')!;
    const i2 = new Image();
    i2.src = im.currentSrc || im.src;
    await i2.decode();
    const c = document.createElement('canvas');
    c.width = i2.naturalWidth;
    c.height = i2.naturalHeight;
    const g = c.getContext('2d')!;
    g.drawImage(i2, 0, 0);
    const e = g.getImageData(0, 0, c.width, c.height).data;
    let iFeet = -1;
    for (let y = 0; y < c.height; y++) for (let x = 0; x < c.width; x++) if (e[(y * c.width + x) * 4 + 3] > 8) iFeet = y;
    const ir = im.getBoundingClientRect();
    return {
      corners: [a(0, 0), a(W - 1, 0), a(0, H - 1), a(W - 1, H - 1)],
      // the file's ground shadow reached ~24 artboard px below the feet: any ink in that band would be it
      belowFeet: H - 1 - feet,
      baselineDelta: r.top + ((feet + 1) * r.height) / H - (ir.top + ((iFeet + 1) * ir.height) / c.height),
      pointerEvents: getComputedStyle(cv).pointerEvents,
      imgHidden: getComputedStyle(im).visibility === 'hidden',
    };
  });
}

test('pose per screen: stage reading -> cheering -> sipping on one instance, home hero, settings; clean swap', async ({ browser, baseURL }) => {
  test.setTimeout(120_000);
  const { ctx, page, requests } = await open(browser, base(baseURL));
  await page.getByRole('button', { name: /put the kettle on/i }).first().click();
  await page.waitForFunction(() => location.hash === '#/focus');
  await riveIn(page, stageChai, 'reading');
  const f = await canvasFacts(page, stageChai);
  expect(f.corners, 'artboard background cleared').toEqual([0, 0, 0, 0]);
  expect(f.belowFeet, 'no file ground shadow under the feet').toBeGreaterThan(10);
  expect(Math.abs(f.baselineDelta), 'feet on the painted baseline').toBeLessThanOrEqual(1);
  expect(f.pointerEvents).toBe('none');
  expect(f.imgHidden).toBe(true);

  // Home hero while the brew runs: reading.
  await page.evaluate(() => (location.hash = '#/'));
  await riveIn(page, '[data-pose="focus"] [data-pose]', 'reading');
  await page.evaluate(() => (location.hash = '#/focus'));
  await riveIn(page, stageChai, 'reading');
  await page.evaluate((sel) => ((window as any).__stageCanvas = document.querySelector(`${sel} canvas`)), stageChai);

  await page.evaluate(() => (window as any).__kettle.finish());
  await expect(page.locator(stageChai).first()).toHaveAttribute('data-pose', 'cheering');
  await page.waitForFunction(() => location.hash.includes('done'), null, { timeout: 30_000 });
  await riveIn(page, stageChai, 'cheering');
  await page.getByRole('button', { name: /Tea time|Long tea break/ }).first().click();
  await riveIn(page, stageChai, 'sipping');
  // Pose changes went to the same live instance (no remount on the stage).
  expect(await page.evaluate((sel) => document.querySelector(`${sel} canvas`) === (window as any).__stageCanvas, stageChai)).toBe(true);
  await page.waitForTimeout(2500); // the cheering -> sipping blend has settled
  const g = await canvasFacts(page, stageChai);
  expect(Math.abs(g.baselineDelta)).toBeLessThanOrEqual(1);

  // Settings, About: sipping.
  await page.evaluate(() => (location.hash = '#/settings'));
  const about = page.locator('[data-pose="sip"] [data-pose]');
  await about.scrollIntoViewIfNeeded();
  await riveIn(page, '[data-pose="sip"] [data-pose]', 'sipping');

  const swaps = await page.evaluate(() => (window as any).__swaps);
  expect(swaps.length).toBeGreaterThan(0);
  for (const s of swaps) {
    expect(s.ink, `canvas held Chai at the swap (${s.pose})`).toBeGreaterThan(500);
    if (s.moved !== null) expect(s.moved, `box did not move at the swap (${s.pose})`).toBeLessThanOrEqual(0.01);
  }
  expect(requests.filter((u) => CDN.test(u))).toEqual([]);
  expect(requests.some((u) => /rive[^/]*\.wasm/.test(u))).toBe(true);
  await ctx.close();
});

for (const what of ['wasm', 'riv'] as const)
  test(`fallback: ${what} fails -> the painted image stays`, async ({ browser, baseURL }) => {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
    await ctx.route(what === 'wasm' ? /rive[^/]*\.wasm/ : /chai[^/]*\.riv(\?|$)/, (r) => r.abort());
    const page = await ctx.newPage();
    await page.goto(`${base(baseURL)}/?debug&onboarded=1&f=${what}#/kit?part=art&view=pose&pose=cheer&size=200`);
    const span = page.locator('[data-pose="cheer"] [data-pose]');
    await expect(span).toHaveAttribute('data-pose', 'cheering');
    // The runtime was asked for, failed, and the canvas went away; the image is shown.
    await expect.poll(() => span.locator('canvas').count(), { timeout: 15_000 }).toBe(0);
    await page.waitForTimeout(3500); // past the cheering settle time
    await expect(span).toHaveAttribute('data-chai-render', 'image');
    expect(await span.locator('img').evaluate((im: HTMLImageElement) => getComputedStyle(im).visibility === 'visible' && im.complete && im.naturalWidth > 0)).toBe(true);
    await ctx.close();
  });

test('reduced motion: the painted image, and no runtime, wasm or .riv request', async ({ browser, baseURL }) => {
  test.setTimeout(90_000);
  const { ctx, page, requests } = await open(browser, base(baseURL), { reduced: true });
  await page.getByRole('button', { name: /put the kettle on/i }).first().click();
  await page.waitForFunction(() => location.hash === '#/focus');
  await page.waitForTimeout(2500);
  const span = page.locator(stageChai).first();
  await expect(span).toHaveAttribute('data-pose', 'reading');
  await expect(span).toHaveAttribute('data-chai-render', 'image');
  expect(await span.locator('canvas').count()).toBe(0);
  await page.evaluate(() => (window as any).__kettle.finish());
  await page.waitForFunction(() => location.hash.includes('done'), null, { timeout: 30_000 });
  await page.waitForTimeout(1500);
  await expect(page.locator(stageChai).first()).toHaveAttribute('data-chai-render', 'image');
  expect(requests.filter((u) => RIVE_REQ.test(u))).toEqual([]);
  await ctx.close();
});

/**
 * Fix round (LEAD-9 B1/B2/B4). A rAF sampler records, for every Chai box on every frame: render mode, the image's
 * and the canvas's computed visibility, and the canvas ink (downsampled). A ResizeObserver registered after
 * LiveChai's sees each resized canvas as it is about to be painted.
 */
async function sampler(page: Page) {
  await page.addInitScript(() => {
    const w = window as any;
    w.__frames = [];
    w.__ro = [];
    const inkOf = (c: HTMLCanvasElement) => {
      if (c.width < 2) return 0;
      const t = document.createElement('canvas');
      t.width = 40;
      t.height = 48;
      const g = t.getContext('2d')!;
      g.drawImage(c, 0, 0, 40, 48);
      const d = g.getImageData(0, 0, 40, 48).data;
      let n = 0;
      for (let i = 3; i < d.length; i += 4) if (d[i] > 16) n++;
      return n;
    };
    const seen = new WeakSet<Element>();
    const f = () => {
      document.querySelectorAll<HTMLElement>('[data-chai-render]').forEach((sp) => {
        const img = sp.querySelector('img');
        const c = sp.querySelector<HTMLCanvasElement>('canvas[data-rive-chai]');
        if (c && !seen.has(c)) {
          seen.add(c);
          new ResizeObserver(() => w.__ro.push({ pose: sp.dataset.pose, ink: inkOf(c), img: img && getComputedStyle(img).visibility, cv: getComputedStyle(c).visibility })).observe(c);
        }
        w.__frames.push({ t: Math.round(performance.now()), pose: sp.dataset.pose, render: sp.dataset.chaiRender, img: img && getComputedStyle(img).visibility, cv: c ? getComputedStyle(c).visibility : null, ink: c ? inkOf(c) : null });
      });
      requestAnimationFrame(f);
    };
    requestAnimationFrame(f);
  });
}

type Frame = { t: number; pose: string; render: string; img: string; cv: string | null; ink: number | null };
const neverBlank = (fr: Frame[]) => fr.filter((x) => x.img === 'hidden' && (x.cv !== 'visible' || !x.ink));
const neverBoth = (fr: Frame[]) => fr.filter((x) => x.img === 'visible' && x.cv === 'visible');

for (const pose of ['sip', 'cheer'] as const)
  test(`fix round: a ${pose} Chai never shows the canvas before its reveal, then swaps in one frame`, async ({ browser, baseURL }) => {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
    const page = await ctx.newPage();
    await sampler(page);
    await page.goto(`${base(baseURL)}/?debug&onboarded=1&s=${pose}#/kit?part=art&view=pose&pose=${pose}&size=168`);
    const span = page.locator(`[data-pose="${pose}"] [data-pose]`);
    await expect(span).toHaveAttribute('data-chai-render', 'rive', { timeout: 20_000 });
    await page.waitForTimeout(500);
    const fr: Frame[] = await page.evaluate(() => (window as any).__frames);
    const pre = fr.filter((x) => x.render === 'image');
    const post = fr.filter((x) => x.render === 'rive');
    expect(pre.length, 'frames sampled during the hold').toBeGreaterThan(30);
    expect(pre.filter((x) => x.cv !== null && x.cv !== 'hidden'), 'canvas visible before the reveal').toEqual([]);
    expect(pre.filter((x) => x.img !== 'visible'), 'image hidden before the reveal').toEqual([]);
    expect(post.length).toBeGreaterThan(10);
    expect(post.filter((x) => x.img !== 'hidden' || x.cv !== 'visible' || !x.ink), 'after the swap: image hidden, canvas shown with Chai').toEqual([]);
    expect(neverBoth(fr)).toEqual([]);
    expect(neverBlank(fr)).toEqual([]);
    await ctx.close();
  });

test('fix round: Stage pose changes (focus -> whistle -> summary -> break -> over -> focus) never paint a blank Chai', async ({ browser, baseURL }) => {
  test.setTimeout(120_000);
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  await sampler(page);
  await page.goto(`${base(baseURL)}/?debug&seed=veteran&theme=light#/`);
  await page.waitForFunction(() => { const t = (window as any).__kettle?.timerInfo?.(); return !!(t && t.leader && t.leaderForMs > 400 && !t.settling); }, null, { timeout: 60_000 });
  await page.evaluate(() => (window as any).__kettle.settings.getState().set({ muted: true, autoStartBreaks: false, autoStartFocus: false }));
  await page.waitForTimeout(600);
  await page.getByRole('button', { name: /put the kettle on/i }).first().click();
  await page.waitForFunction(() => location.hash === '#/focus');
  await riveIn(page, stageChai, 'reading');
  await page.evaluate(() => (window as any).__kettle.finish());
  await page.waitForFunction(() => location.hash.includes('done'), null, { timeout: 30_000 });
  await page.waitForTimeout(2500);
  await page.getByRole('button', { name: /Tea time|Long tea break/ }).first().click();
  await page.waitForTimeout(2500);
  await page.evaluate(() => (window as any).__kettle.finish()); // break over: stretch (painted)
  await page.waitForTimeout(2500);
  await expect(page.locator(stageChai).first()).toHaveAttribute('data-pose', 'stretch');
  await page.getByRole('button', { name: /put the kettle on/i }).first().click();
  await riveIn(page, stageChai, 'reading');
  await page.waitForTimeout(800);
  const fr: Frame[] = (await page.evaluate(() => (window as any).__frames)).filter((x: Frame) => x.pose !== undefined);
  const ro = await page.evaluate(() => (window as any).__ro);
  expect(fr.length).toBeGreaterThan(200);
  expect(neverBlank(fr), 'a frame with the image hidden and no Chai on the canvas').toEqual([]);
  expect(neverBoth(fr), 'a frame with both the image and the canvas shown').toEqual([]);
  expect(ro.length, 'the canvas was resized on the pose changes').toBeGreaterThan(1);
  expect(ro.filter((x: any) => x.img === 'hidden' && !x.ink), 'resized canvas painted empty').toEqual([]);
  // the stretch -> reading remount started hidden behind the image (B4)
  const back = fr.filter((x) => x.t > 0 && x.pose === 'reading');
  expect(back.length).toBeGreaterThan(0);
  await ctx.close();
});
