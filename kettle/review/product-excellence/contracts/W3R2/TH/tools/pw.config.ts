// Scratch config: the repo's own config, pointed at a scratch testDir and at an already-running server.
import base from '../../playwright.config';
import { defineConfig } from '@playwright/test';
export default defineConfig({ ...base, testDir: process.env.TH_TESTDIR ?? '/home/user/wt/w8t/kettle/tests', webServer: undefined, outputDir: process.env.TH_OUT ?? '/tmp/th-pw-out' });
