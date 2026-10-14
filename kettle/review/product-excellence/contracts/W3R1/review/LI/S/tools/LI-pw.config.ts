// Lane I: runs the Lane I specs in this folder against already-running servers (no webServer).
import { defineConfig, devices } from '@playwright/test';
export default defineConfig({
  testDir: '.',
  testMatch: /LI-.*\.spec\.ts/,
  timeout: 120_000,
  expect: { timeout: 10_000 },
  workers: 1,
  reporter: [['list']],
  use: { ...devices['Desktop Chrome'], launchOptions: { args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader', '--ignore-gpu-blocklist'] } },
});
