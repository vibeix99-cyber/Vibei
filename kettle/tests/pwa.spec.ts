/**
 * PWA e2e (timer/PWA area): production build + `vite preview`, then
 * install → precache → offline → update prompt. Run with:
 *   npx playwright test --project=pwa
 * Builds into test-results/pwa-dist and previews on KETTLE_PWA_PORT (default 5193).
 */
import { test, expect, type Page } from '@playwright/test';
import { spawn, execFileSync, type ChildProcess } from 'node:child_process';
import { appendFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const PORT = Number(process.env.KETTLE_PWA_PORT ?? 5193);
const BASE = `http://127.0.0.1:${PORT}`;
const OUT = join(process.cwd(), 'test-results', 'pwa-dist');
let server: ChildProcess | null = null;

/* eslint-disable @typescript-eslint/no-explicit-any */
test.describe.configure({ mode: 'serial' });

test.beforeAll(async () => {
  test.setTimeout(360_000);
  mkdirSync(OUT, { recursive: true });
  execFileSync('npx', ['vite', 'build', '--outDir', OUT, '--emptyOutDir', '--logLevel', 'error'], { stdio: 'pipe', timeout: 300_000 });
  server = spawn('npx', ['vite', 'preview', '--outDir', OUT, '--port', String(PORT), '--strictPort'], { stdio: 'ignore' });
  for (let i = 0; i < 120; i++) {
    try {
      if ((await fetch(`${BASE}/`)).ok) return;
    } catch {
      /* not up yet */
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error('preview server did not start');
});

test.afterAll(() => {
  server?.kill();
});

async function installed(page: Page) {
  await page.goto(`${BASE}/?debug#/`);
  await page.evaluate(() => navigator.serviceWorker.ready);
  // Return visit: now controlled by the service worker from the first byte.
  await page.reload();
  await page.waitForFunction(() => !!(window as any).__kettle?.pwa && !!navigator.serviceWorker.controller, null, { timeout: 20_000 });
}

test('manifest is installable: name, colors, standalone, icons that exist', async ({ request }) => {
  const res = await request.get(`${BASE}/manifest.webmanifest`);
  expect(res.ok()).toBe(true);
  const m = await res.json();
  expect(m).toMatchObject({ name: 'Kettle — cozy focus timer', short_name: 'Kettle', display: 'standalone', theme_color: '#fff9f0', background_color: '#fff9f0' });
  const sizes = m.icons.map((i: { sizes: string }) => i.sizes);
  expect(sizes).toEqual(expect.arrayContaining(['192x192', '512x512']));
  expect(m.icons.some((i: { purpose?: string }) => i.purpose === 'maskable')).toBe(true);
  for (const icon of m.icons) expect((await request.get(`${BASE}/${icon.src}`)).ok(), icon.src).toBe(true);
});

test('precaches the shell, fonts, 3D chunk and tick worker; boots and times a brew offline', async ({ page, context }) => {
  await installed(page);
  const cached = await page.evaluate(async () => {
    const urls: string[] = [];
    for (const k of await caches.keys()) for (const r of await (await caches.open(k)).keys()) urls.push(new URL(r.url).pathname);
    return urls;
  });
  expect(cached.some((u) => u.endsWith('/index.html'))).toBe(true);
  expect(cached.some((u) => /\/assets\/three-.*\.js$/.test(u))).toBe(true);
  expect(cached.some((u) => /\/assets\/tick\.worker-.*\.js$/.test(u))).toBe(true);
  expect(cached.filter((u) => u.endsWith('.woff2')).length, cached.join('\n')).toBeGreaterThan(0);

  await context.setOffline(true);
  await page.reload();
  await page.waitForFunction(() => !!(window as any).__kettle?.timerInfo, null, { timeout: 20_000 });
  // The lazily-loaded screen renders from the cache too.
  await expect.poll(async () => (await page.evaluate(() => document.body.innerText)).trim().length, { timeout: 15_000 }).toBeGreaterThan(0);
  expect(await page.evaluate(() => (window as any).__kettle.timerInfo().scheduler)).toBe('worker');
  await page.evaluate(() => (window as any).__kettle.settings.getState().set({ autoStartBreaks: false, scene: 'off' }));
  await page.evaluate(() => (window as any).__kettle.timer.getState().startFocus({ minutes: 3 / 60 }));
  const sid = await page.evaluate(() => (window as any).__kettle.timer.getState().sessionId);
  await expect.poll(() => page.evaluate(() => (window as any).__kettle.timer.getState().status), { timeout: 15_000 }).toBe('idle');
  await expect.poll(() => page.evaluate((id) => (window as any).__kettle.progress.getState().sessions.filter((s: any) => s.id === id).length, sid)).toBe(1);
  await context.setOffline(false);
});

test('update: new version waits for the user (no reload mid-brew), then applies and the brew carries on', async ({ page }) => {
  await installed(page);
  await page.evaluate(() => (window as any).__kettle.timer.getState().startFocus({ minutes: 10 }));
  const sid = await page.evaluate(() => (window as any).__kettle.timer.getState().sessionId);
  appendFileSync(join(OUT, 'sw.js'), `\n// update ${Date.now()}\n`); // "deploy" a new version
  await page.evaluate(async () => (await navigator.serviceWorker.getRegistration())!.update());
  await page.waitForFunction(() => (window as any).__kettle.pwa.state().needRefresh, null, { timeout: 20_000 });
  expect(await page.evaluate(async () => !!(await navigator.serviceWorker.getRegistration())!.waiting)).toBe(true);
  expect(await page.evaluate(() => (window as any).__kettle.timer.getState().status)).toBe('running');

  const nav = page.waitForNavigation({ timeout: 20_000 });
  await page.evaluate(() => (window as any).__kettle.pwa.update());
  await nav;
  await page.waitForFunction(() => !!(window as any).__kettle?.timerInfo, null, { timeout: 20_000 });
  expect(await page.evaluate(async () => !!(await navigator.serviceWorker.getRegistration())!.waiting)).toBe(false);
  expect(await page.evaluate(() => (window as any).__kettle.timer.getState())).toMatchObject({ status: 'running', sessionId: sid });
});
