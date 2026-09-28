#!/usr/bin/env node
/**
 * Screenshot harness shared by every area + the critic.
 *
 *   node scripts/shoot.mjs [--base http://127.0.0.1:5173] [--out .shots/x]
 *     [--routes /,/stats] [--seed veteran] [--themes light,dark]
 *     [--sizes mobile,desktop,tablet,small,landscape] [--motion reduce]
 *     [--eval "js to run in page before shot"] [--wait 800] [--full]
 *     [--name prefix]
 *
 * Every shot loads `${base}/?debug&seed=..&theme=..#<route>` (see src/app/debug.ts),
 * so `window.__kettle` is available to --eval (e.g. "__kettle.timer.getState().startFocus()").
 * Prints the written file paths. Console errors are printed as `[console.error] ...`.
 */
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';

const args = Object.fromEntries(
  process.argv.slice(2).reduce((acc, cur, i, arr) => {
    if (cur.startsWith('--')) acc.push([cur.slice(2), arr[i + 1] && !arr[i + 1].startsWith('--') ? arr[i + 1] : 'true']);
    return acc;
  }, []),
);

const SIZES = {
  small: { width: 320, height: 640, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
  mobile: { width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
  landscape: { width: 844, height: 390, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
  tablet: { width: 820, height: 1180, deviceScaleFactor: 1, isMobile: true, hasTouch: true },
  desktop: { width: 1440, height: 900, deviceScaleFactor: 1 },
};

const base = args.base ?? 'http://127.0.0.1:5173';
const out = args.out ?? '.shots/latest';
const routes = (args.routes ?? '/').split(',');
const themes = (args.themes ?? 'light').split(',');
const sizes = (args.sizes ?? 'mobile').split(',');
const seed = args.seed ?? 'veteran';
const wait = Number(args.wait ?? 900);
const prefix = args.name ? `${args.name}-` : '';
mkdirSync(out, { recursive: true });

const browser = await chromium.launch({
  args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader', '--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required'],
});
for (const size of sizes) {
  for (const theme of themes) {
    const ctx = await browser.newContext({
      viewport: { width: SIZES[size].width, height: SIZES[size].height },
      deviceScaleFactor: SIZES[size].deviceScaleFactor,
      isMobile: SIZES[size].isMobile ?? false,
      hasTouch: SIZES[size].hasTouch ?? false,
      colorScheme: theme === 'dark' ? 'dark' : 'light',
      reducedMotion: args.motion === 'reduce' ? 'reduce' : 'no-preference',
    });
    for (const route of routes) {
      const page = await ctx.newPage();
      page.on('console', (m) => {
        if (m.type() === 'error') console.log(`[console.error] ${m.text()}`);
      });
      page.on('pageerror', (e) => console.log(`[pageerror] ${e.message}`));
      const qs = new URLSearchParams({ debug: '', seed, theme });
      if (args.motion) qs.set('motion', args.motion);
      await page.goto(`${base}/?${qs.toString().replace('debug=', 'debug')}#${route}`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(wait);
      if (args.eval) {
        await page.evaluate(args.eval);
        await page.waitForTimeout(wait);
      }
      const slug = route === '/' ? 'home' : route.replace(/\//g, '');
      const file = join(out, `${prefix}${slug}-${size}-${theme}.png`);
      await page.screenshot({ path: file, fullPage: args.full === 'true' });
      console.log(file);
      await page.close();
    }
    await ctx.close();
  }
}
await browser.close();
