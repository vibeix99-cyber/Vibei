// Lane K shared helpers (W3R3 Chai 2D capture). Playwright comes from the trial worktree (no repo dependency change).
import { createRequire } from 'node:module';
import fs from 'node:fs';
const require = createRequire('/home/user/wt/w9tr/kettle/package.json');
export const { chromium } = require('@playwright/test');
// Frozen date: Monday 2026-10-12, the W3R1/W3R2 date; seeds pin the time of day on top of it. timezone UTC.
export const FIXED = Date.parse('2026-10-12T07:40:00.000Z');
export const CONFIGS = { '390x844': [390, 844], '375x667': [375, 667], '1440x900': [1440, 900] };
export const TEXT200 = `addEventListener('DOMContentLoaded', () => { const s = document.createElement('style'); s.textContent = 'html{font-size:200%!important}'; document.head.appendChild(s); });`;
export async function launch() {
  return chromium.launch({ args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader', '--ignore-gpu-blocklist'] });
}
export async function newCtx(browser, { vw, vh, dpr = 1, reduced = false, text200 = false, frozen = true }) {
  const ctx = await browser.newContext({
    viewport: { width: vw, height: vh }, deviceScaleFactor: dpr, timezoneId: 'UTC', locale: 'en-US',
    reducedMotion: reduced ? 'reduce' : 'no-preference',
  });
  if (frozen) { await ctx.clock.install({ time: FIXED }); await ctx.clock.resume(); if (process.env.K_FIXED_NOW !== '0') await ctx.clock.setFixedTime(FIXED); } // fixed Date.now: the countdown digits do not tick between BEFORE and AFTER; timers still run
  if (text200) await ctx.addInitScript(TEXT200);
  return ctx;
}
// Full-page screenshot with animations disabled, after the fonts are ready and no screen is leaving.
export async function shot(page, path, o = {}) {
  await page.waitForFunction(() => !document.querySelector('[data-route-leaving]'), null, { timeout: 20000 }).catch(() => {});
  await page.evaluate(() => document.fonts.ready).catch(() => {});
  await page.evaluate(async () => { for (const i of document.images) if (!i.complete) await i.decode().catch(() => {}); }).catch(() => {});
  return page.screenshot({ path, animations: 'disabled', fullPage: true, ...o });
}
export function facts(page) {
  return page.evaluate(() => {
    const out = [];
    for (const img of document.images) {
      if (!/chai-(reading|sipping|cheering)/.test(img.currentSrc || img.src)) continue;
      const r = img.getBoundingClientRect();
      out.push({ file: (img.currentSrc || img.src).split('/').pop().split('?')[0], box: [r.left, r.top, r.width, r.height].map((v) => +v.toFixed(2)), pose: img.closest('[data-pose]')?.dataset.pose ?? null });
    }
    return { hash: location.hash, chai: out };
  });
}

// Notification.permission reads 'denied' in headless Chromium; the Welcome notify step shows Chai cheering only when granted.
export const NOTIF_GRANTED = `Object.defineProperty(Notification, 'permission', { get: () => 'granted', configurable: true });`;
