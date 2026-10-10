// Checker r5 (copied from r4) shared probe helpers (scratch, outside the repo). Playwright imported by absolute path.
import { chromium } from '/home/user/Vibei/kettle/node_modules/playwright/index.mjs';

export const SW = ['--enable-unsafe-swiftshader', '--use-angle=swiftshader', '--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required'];
export const launch = () => chromium.launch({ args: SW });

/** A context like a phone (w < 900: mobile + touch) or a desktop window, with optional enlarged root text. */
export async function context(browser, { w, h, dpr, theme = 'light', text = 100, mobile, touch, reduced, storageState } = {}) {
  const phone = mobile ?? (w < 900);
  const ctx = await browser.newContext({
    viewport: { width: w, height: h },
    deviceScaleFactor: dpr ?? (w >= 900 ? 1 : 2),
    isMobile: phone,
    hasTouch: touch ?? w < 900,
    colorScheme: theme,
    reducedMotion: reduced ? 'reduce' : 'no-preference',
    acceptDownloads: true,
    ...(storageState ? { storageState } : {}),
  });
  if (text !== 100) {
    await ctx.addInitScript((pct) => {
      addEventListener('DOMContentLoaded', () => {
        const s = document.createElement('style');
        s.textContent = `html{font-size:${pct}%!important}`;
        document.head.appendChild(s);
      });
    }, text);
  }
  return ctx;
}

export function url(base, { seed = 'veteran', theme = 'light', route = '/' } = {}) {
  return `${base.replace(/\/$/, '')}/?debug&seed=${seed}&theme=${theme}${theme === 'light' ? '&nooktime=day' : ''}#${route}`;
}

export async function open(page, base, opts = {}) {
  await page.goto(url(base, opts), { waitUntil: 'load' });
  await page.waitForFunction(() => !!window.__kettle, null, { timeout: 60_000 });
  await page.evaluate(() => document.fonts.ready);
  await page.evaluate(() => window.__kettle.settings.getState().set({ autoStartBreaks: false, autoStartFocus: false, muted: true }));
  await page.waitForTimeout(opts.settle ?? 1200);
}

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
