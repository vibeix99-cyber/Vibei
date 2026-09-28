/**
 * Playwright config (created by the timer area; other areas: add projects/specs freely).
 *
 *   npx playwright test                          # everything
 *   npx playwright test --project=timer-harness  # timer engine only (isolated page)
 *   npx playwright test --project=timer-app      # timer inside the real app
 *
 * Starts an HMR-free dev server (tests/e2e.vite.config.ts) on KETTLE_PORT
 * (default 5183, the timer area's port), or reuses one already running there.
 */
import { defineConfig, devices } from '@playwright/test';

const port = Number(process.env.KETTLE_PORT ?? 5183);
const launchOptions = {
  args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader', '--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required'],
};

export default defineConfig({
  testDir: 'tests',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: 1,
  reporter: [['list']],
  use: {
    baseURL: `http://127.0.0.1:${port}`,
    launchOptions,
    trace: 'retain-on-failure',
  },
  webServer: {
    // HMR + file watching off: other edits in the tree must not reload pages mid-test.
    command: `npx vite --config tests/e2e.vite.config.ts --port ${port} --strictPort`,
    url: `http://127.0.0.1:${port}/`,
    reuseExistingServer: true,
    timeout: 60_000,
  },
  projects: [
    {
      name: 'timer-harness',
      testMatch: /timer\.spec\.ts/,
      use: { ...devices['Desktop Chrome'], launchOptions, kettlePage: '/tests/harness/timer.html' } as never,
    },
    {
      name: 'timer-app',
      testMatch: /timer\.spec\.ts/,
      use: { ...devices['Desktop Chrome'], launchOptions, kettlePage: '/?debug&onboarded=1#/' } as never,
    },
    {
      name: 'chromium',
      testIgnore: /timer\.spec\.ts/,
      use: { ...devices['Desktop Chrome'], launchOptions },
    },
  ],
});
