#!/usr/bin/env node
/**
 * Renders the edit layer for ad 01 through overlay.html (app styles, fonts and art components):
 * caption PNGs (transparent), the time card, and the end card as a deterministic 30 fps sequence.
 * usage: node render-overlays.mjs <base-url> <out-dir>
 */
import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';

const [base = 'http://localhost:5191', out = 'overlays'] = process.argv.slice(2);
const page_ = `${base}/marketing/ad-01-kettle-on/build/overlay.html`;
mkdirSync(`${out}/end`, { recursive: true });

export const CAPTIONS = {
  c1: "Can't start *studying*?",
  c2: 'Put the *kettle* on.',
  c3: 'Chai *naps*.|You focus.',
  c5: 'It *whistles*.|Tea time.',
  c6: 'Tea break|with *Chai*.',
};

const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
const p = await ctx.newPage();
const open = async (qs) => {
  await p.goto(`${page_}?${qs}`, { waitUntil: 'networkidle' });
  await p.waitForFunction(() => window.__ready === true);
  await p.evaluate(() => document.fonts.ready);
  await p.waitForTimeout(300);
};
for (const [k, text] of Object.entries(CAPTIONS)) {
  await open(`mode=caption&text=${encodeURIComponent(text)}`);
  await p.screenshot({ path: `${out}/${k}.png`, omitBackground: true });
}
await open('mode=scrim');
await p.screenshot({ path: `${out}/scrim.png`, omitBackground: true });
await open('mode=time');
await p.screenshot({ path: `${out}/time.png` });
writeFileSync(`${out}/captions.json`, JSON.stringify(CAPTIONS, null, 1));

// End card: deterministic 30 fps (fake clock + CSS animations stepped to virtual time).
await p.clock.install({ time: new Date('2026-10-12T21:40:00') });
await p.clock.pauseAt(new Date('2026-10-12T21:40:01'));
await p.goto(`${page_}?mode=end`, { waitUntil: 'load' });
await p.evaluate(() => document.fonts.ready);
await p.evaluate(() => {
  window.__syncAnims = () => {
    const vt = performance.now();
    for (const a of document.getAnimations()) {
      if (a.__v === undefined) { a.__v = vt - Math.max(0, a.currentTime ?? 0); a.pause(); }
      const t = vt - a.__v;
      const end = a.effect?.getComputedTiming().endTime;
      if (typeof end === 'number' && Number.isFinite(end) && t >= end) a.finish();
      else a.currentTime = Math.max(0, t);
    }
  };
});
for (let i = 0; i < 90; i++) {
  await p.clock.runFor(1000 / 30);
  await p.evaluate(() => window.__syncAnims());
  await p.screenshot({ path: `${out}/end/f${String(i).padStart(4, '0')}.png` });
}
await b.close();
console.log('overlays done');
