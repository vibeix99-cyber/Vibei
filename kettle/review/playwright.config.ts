/**
 * Critic's functional test plan config.
 *
 *   npx playwright test -c review/playwright.config.ts                 # dev server on :5190 (reused if running)
 *   KETTLE_SNAPSHOT=1 npx playwright test -c review/playwright.config.ts   # stable snapshot: build → preview on :5190
 *   npx playwright test -c review/playwright.config.ts -g "axe"       # subset
 *
 * Output (all under review/test-results/: gitignored, and in Vite's default watch-ignore list, so
 * writing reports never triggers a page reload on anyone's dev server):
 *   functional/ (screenshots, axe + layout JSON) · report/ (HTML) · results.json · artifacts/ (traces)
 */
import { defineConfig } from '@playwright/test';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const PORT = 5190;
const snapshot = !!process.env.KETTLE_SNAPSHOT;

export default defineConfig({
  testDir: '.',
  testMatch: /functional\.spec\.ts$/,
  outputDir: './test-results/artifacts',
  timeout: 90_000,
  expect: { timeout: 8_000 },
  fullyParallel: true,
  workers: process.env.WORKERS ? Number(process.env.WORKERS) : 3,
  retries: 0,
  reporter: [
    ['list'],
    ['html', { outputFolder: './test-results/report', open: 'never' }],
    ['json', { outputFile: './test-results/results.json' }],
  ],
  use: {
    baseURL: `http://127.0.0.1:${PORT}`,
    browserName: 'chromium',
    launchOptions: {
      args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader', '--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required'],
    },
    viewport: { width: 390, height: 844 },
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  webServer: {
    command: snapshot
      ? `npx vite build --outDir review/test-results/dist --emptyOutDir && npx vite preview --outDir review/test-results/dist --port ${PORT} --strictPort --host 127.0.0.1`
      : `npx vite --port ${PORT} --strictPort`,
    cwd: root,
    url: `http://127.0.0.1:${PORT}/`,
    reuseExistingServer: true,
    timeout: 240_000,
  },
});
