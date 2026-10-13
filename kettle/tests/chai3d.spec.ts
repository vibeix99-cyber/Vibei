/**
 * Wave 2 round 2 · I06 (Maker C): the Blender Chai in the 3D room, with the procedural Chai as the first frame and
 * the fallback (CHAI-3D-SPEC §6.2).
 *
 *  - loads, validates and replaces the procedural Chai in place on the Nook, with REPORT.md's pose mapping;
 *  - 404, a slow network (8 s timeout) and an invalid file keep the procedural Chai; the room never waits for it;
 *  - 3D off never requests the model; the low tier (this machine's default: SwiftShader) shows it, liteified;
 *  - a WebGL context loss and restore rebuild the engine with the model from memory (no second request).
 *
 * The 3D preference is set as a user would (Settings → reload); `window.__nook` (debug) is read, never driven, except
 * to simulate the GPU dropping the context.
 *
 *   KETTLE_PORT=5423 npx playwright test tests/chai3d.spec.ts --project=chromium
 */
import { test, expect, type Page, type Request } from '@playwright/test';

/* eslint-disable @typescript-eslint/no-explicit-any */
const GLB = /\/chai(-[\w-]+)?\.glb$/;
/** The model's data request only: in dev, Vite also serves `chai.glb?url` as the JS module that exports the URL. */
const isModelFetch = (u: URL) => GLB.test(u.pathname) && !u.search;

const ready = (page: Page) =>
  page.waitForFunction(() => {
    const i = (window as any).__kettle?.timerInfo?.();
    return !!(i && i.leader && i.leaderForMs > 400 && !i.settling);
  }, null, { timeout: 60_000 });

/** A veteran profile (the cushion is earned), 3D preference as given, then a reload, then the Nook. */
async function nook(page: Page, scene: 'high' | 'low' | 'off' | 'auto') {
  await page.goto('/?debug&seed=veteran&theme=light&nooktime=day&nookweather=clear#/');
  await ready(page);
  await page.evaluate((scene) => (window as any).__kettle.settings.getState().set({ scene, muted: true, autoStartBreaks: false, autoStartFocus: false }), scene);
  await page.reload();
  await ready(page);
  await page.getByRole('link', { name: /nook/i }).first().click();
  await page.waitForFunction(() => location.hash === '#/nook');
}

const host = (page: Page) => page.locator('section[aria-label="The room"] [data-scene-mode="showcase"]').first();
const chaiKind = (page: Page) => page.evaluate(() => (window as any).__nook?.chaiKind ?? null);
const status = (page: Page) => page.evaluate(() => (window as any).__chai3d?.status?.() ?? null);

/** The visible Chai parts and the `nap` key, read from the engine's scene. */
const chaiFacts = (page: Page) =>
  page.evaluate(() => {
    const e = (window as any).__nook;
    const root = e.chai.root;
    const shown = (o: any) => {
      for (let p = o; p; p = p.parent) if (!p.visible) return false;
      return true;
    };
    const parts: string[] = [];
    root.traverse((o: any) => {
      if (/^(eyes_|paws_mug$)/.test(o.name) && shown(o)) parts.push(o.name);
    });
    const nap: number[] = [];
    root.getObjectByName('body')?.traverse((o: any) => o.isMesh && nap.push(o.morphTargetInfluences[o.morphTargetDictionary.nap]));
    let inScene = false;
    e.scene.traverse((o: any) => (inScene ||= o === root));
    return { model: !!root.userData.model, parts: parts.sort(), nap, inScene, proxyOnChai: e.chaiProxy.parent === root, baseY: root.userData.baseY, y: root.position.y, scale: root.scale.x };
  });

/** The model's data requests since the page last loaded (the module cache lives per page load). */
function countGlb(page: Page) {
  const seen: string[] = [];
  page.on('load', () => (seen.length = 0));
  page.on('request', (r: Request) => isModelFetch(new URL(r.url())) && seen.push(r.url()));
  return seen;
}

test.describe('3D Chai: the model replaces the procedural Chai', () => {
  test('high tier: loads, validates and swaps in place, awake = eyes_open, on the cushion', async ({ page }) => {
    const reqs = countGlb(page);
    await nook(page, 'high');
    await expect(host(page)).toHaveAttribute('data-scene-ready', 'true', { timeout: 60_000 });
    await expect.poll(() => chaiKind(page), { timeout: 30_000 }).toBe('model');
    expect(await status(page)).toMatchObject({ state: 'ready', bytes: 45572 });
    const f = await chaiFacts(page);
    expect(f).toMatchObject({ model: true, parts: ['eyes_open'], nap: [0, 0], inScene: true, proxyOnChai: true, baseY: 0.255, scale: 1.12 });
    expect(reqs.length).toBe(1);
  });
});

test.describe('3D Chai: fallbacks keep the procedural Chai', () => {
  test('404: procedural Chai, no error, the room is live', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.route(isModelFetch, (r) => r.fulfill({ status: 404, body: 'nope' }));
    await nook(page, 'high');
    await expect(host(page)).toHaveAttribute('data-scene-ready', 'true', { timeout: 60_000 });
    await expect.poll(() => status(page).then((s) => s?.state), { timeout: 20_000 }).toBe('failed');
    expect((await status(page)).reason).toMatch(/404/);
    expect(await chaiKind(page)).toBe('procedural');
    expect((await chaiFacts(page)).model).toBe(false);
    expect(errors).toEqual([]);
  });

  test('slow network: the first frame is the procedural Chai; after 8 s the load gives up and it stays', async ({ page }) => {
    test.setTimeout(120_000);
    await page.route(isModelFetch, async (r) => {
      await new Promise((res) => setTimeout(res, 15_000));
      await r.continue().catch(() => {});
    });
    await nook(page, 'high');
    await expect(host(page)).toHaveAttribute('data-scene-ready', 'true', { timeout: 60_000 });
    // The room did not wait for the model.
    expect(await chaiKind(page)).toBe('procedural');
    expect((await status(page)).state).toBe('loading');
    await expect.poll(() => status(page).then((s) => s?.state), { timeout: 20_000 }).toBe('failed');
    expect((await status(page)).reason).toBe('timeout (8000 ms)');
    expect(await chaiKind(page)).toBe('procedural');
  });

  test('a file that fails validation (the r0 model: no eyes_sip) keeps the procedural Chai', async ({ page }) => {
    await page.route(isModelFetch, async (r) => {
      const res = await page.request.get('/art-src/chai/chai_r0.glb').catch(() => null);
      if (res?.ok()) await r.fulfill({ status: 200, contentType: 'model/gltf-binary', body: await res.body() });
      else await r.fulfill({ status: 200, contentType: 'model/gltf-binary', body: Buffer.from('glTF-not-really') });
    });
    await nook(page, 'high');
    await expect(host(page)).toHaveAttribute('data-scene-ready', 'true', { timeout: 60_000 });
    await expect.poll(() => status(page).then((s) => s?.state), { timeout: 20_000 }).toBe('failed');
    expect((await status(page)).reason).toMatch(/invalid: missing node "eyes_sip"|SyntaxError|Unexpected|glTF|magic/i);
    expect(await chaiKind(page)).toBe('procedural');
  });

  test('the loader chunk itself fails to load: procedural Chai, no error', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    const reqs = countGlb(page);
    await page.route((u) => /\/scene\/engine\/chaiLoad\.ts$|\/assets\/chaiLoad-[\w-]+\.js$/.test(u.pathname), (r) => r.fulfill({ status: 404, body: '' }));
    await nook(page, 'high');
    await expect(host(page)).toHaveAttribute('data-scene-ready', 'true', { timeout: 60_000 });
    await page.waitForTimeout(3000);
    expect(await chaiKind(page)).toBe('procedural');
    expect(reqs).toEqual([]);
    expect(errors).toEqual([]);
  });

  test('3D off: the static drawing, no engine, no model request', async ({ page }) => {
    const reqs = countGlb(page);
    await nook(page, 'off');
    await expect(page.locator('section[aria-label="The room"] [data-scene-static="true"]').first()).toBeVisible();
    await page.waitForTimeout(2000);
    expect(await page.locator('section[aria-label="The room"] canvas').count()).toBe(0);
    expect(reqs).toEqual([]);
  });

  test('low tier: the model too (liteified), one request; the room is live first', async ({ page }) => {
    const reqs = countGlb(page);
    await nook(page, 'low');
    await expect(host(page)).toHaveAttribute('data-scene-ready', 'true', { timeout: 60_000 });
    expect(await page.evaluate(() => (window as any).__nook.quality)).toBe('low');
    await expect.poll(() => chaiKind(page), { timeout: 30_000 }).toBe('model');
    const f = await chaiFacts(page);
    expect(f).toMatchObject({ model: true, parts: ['eyes_open'], nap: [0, 0], inScene: true, proxyOnChai: true, baseY: 0.255, scale: 1.12 });
    // Low-tier materials: the fur stays PBR (unique, like the procedural fur); gloss, mug and yuzu become Lambert.
    const mats = await page.evaluate(() => {
      const out: Record<string, string> = {};
      (window as any).__nook.chai.root.traverse((o: any) => {
        if (o.isMesh && o.geometry.getAttribute('color')) out[o.material.name || o.material.type] = o.material.type;
      });
      return out;
    });
    expect(mats.chai_fur).toBe('MeshStandardMaterial');
    expect(Object.entries(mats).filter(([k]) => k !== 'chai_fur').every(([, t]) => t === 'MeshLambertMaterial')).toBe(true);
    expect(reqs.length).toBe(1);
  });

  test('default tier on this machine (auto → low on SwiftShader): the model, with no frame without Chai', async ({ page }) => {
    // Hold the model back so the first frames are certainly the procedural Chai, then release it.
    let release!: () => void;
    const held = new Promise<void>((r) => (release = r));
    await page.route(isModelFetch, async (r) => {
      await held;
      await r.continue().catch(() => {});
    });
    await nook(page, 'auto');
    await expect(host(page)).toHaveAttribute('data-scene-ready', 'true', { timeout: 60_000 });
    expect(await page.evaluate(() => (window as any).__nook.quality)).toBe('low');
    // Every frame from now until the swap: a Chai is in the scene (procedural, then the model).
    await page.evaluate(() => {
      const e = (window as any).__nook;
      (window as any).__noChai = 0;
      const tick = () => {
        let has = false;
        e.scene.traverse((o: any) => (has ||= o.name === 'chai' && o.visible));
        if (!has) (window as any).__noChai++;
        if (e.chaiKind !== 'model' || ((window as any).__after = ((window as any).__after ?? 0) + 1) < 30) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
    expect(await chaiKind(page)).toBe('procedural');
    release();
    await expect.poll(() => chaiKind(page), { timeout: 30_000 }).toBe('model');
    await page.waitForTimeout(1500);
    expect(await page.evaluate(() => (window as any).__noChai)).toBe(0);
  });

  test('WebGL context lost and restored: the engine is rebuilt with the model from memory, no second request', async ({ page }) => {
    test.setTimeout(150_000);
    const reqs = countGlb(page);
    await nook(page, 'high');
    await expect(host(page)).toHaveAttribute('data-scene-ready', 'true', { timeout: 60_000 });
    await expect.poll(() => chaiKind(page), { timeout: 30_000 }).toBe('model');
    // Simulate the GPU dropping the context (setup through the debug handle; the app reacts as to a real loss).
    await page.evaluate(() => {
      const ext = (window as any).__nook.renderer.getContext().getExtension('WEBGL_lose_context');
      (window as any).__lose = ext;
      ext.loseContext();
    });
    await expect(host(page)).toHaveAttribute('data-scene-ready', 'false');
    await page.evaluate(() => (window as any).__lose.restoreContext());
    await expect(host(page)).toHaveAttribute('data-scene-ready', 'true', { timeout: 90_000 });
    expect(await chaiKind(page)).toBe('model');
    expect((await chaiFacts(page)).parts).toEqual(['eyes_open']);
    expect(reqs.length).toBe(1);
  });
});
