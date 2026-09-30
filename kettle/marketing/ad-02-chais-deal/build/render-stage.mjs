#!/usr/bin/env node
/**
 * Renders stage.html states to PNG (deterministic: every frame is a pure function of its query string).
 *
 *   node render-stage.mjs <base-url> <out-dir> refs       → the two reference frames for the generated opening
 *   node render-stage.mjs <base-url> <out-dir> all        → refs + opening rise/settle sequences + captions + end card
 *   node render-stage.mjs <base-url> <out-dir> one <name> <query>   → a single frame (for checks)
 */
import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';

const [base = 'http://localhost:5191', out = '.tmp/ad2/ov', what = 'all', ...rest] = process.argv.slice(2);
const url = `${base}/marketing/ad-02-chais-deal/build/stage.html`;
mkdirSync(out, { recursive: true });

export const CAPTIONS = {
  c1: 'Stuck on the *first line*?',
  c2: 'Chai has a *deal*.',
  c4: 'Chai *naps*.|You start.',
  c5: 'One *little* step.',
  c6: ['25 minutes|later…', 'align=right&size=66'],
  c7: 'You *began*.|That counts.',
};
const FPS = 30;
const RISE = 9; // 0.3 s: Chai rises over the list (drawn), then the generated clip takes over from the peek frame
const SETTLE = 14; // the list settles into one task card
const END = 60; // end card animation frames (then held)

const b = await chromium.launch();
const p = await (await b.newContext({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 })).newPage();
let loaded = false;
async function shot(query, path, transparent = false) {
  // Same document, new query: a full navigation keeps every frame independent.
  await p.goto(`${url}?${query}`, { waitUntil: loaded ? 'load' : 'networkidle' });
  loaded = true;
  await p.waitForFunction(() => window.__ready === true);
  await p.evaluate(() => document.fonts.ready);
  await p.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
  await p.screenshot({ path, omitBackground: transparent });
}
const pad = (n) => String(n).padStart(4, '0');

if (what === 'one') {
  await shot(rest[1], `${out}/${rest[0]}.png`);
} else {
  mkdirSync(`${out}/refs`, { recursive: true });
  await shot('mode=opening&rise=1&kettle=0', `${out}/refs/opening-first.png`);
  await shot('mode=opening&rise=1&kettle=1', `${out}/refs/opening-last.png`);
  if (what === 'all') {
    mkdirSync(`${out}/rise`, { recursive: true });
    mkdirSync(`${out}/settle`, { recursive: true });
    mkdirSync(`${out}/end`, { recursive: true });
    for (let i = 0; i < RISE; i++) await shot(`mode=opening&rise=${(i / (RISE - 1)).toFixed(4)}&kettle=0`, `${out}/rise/f${pad(i)}.png`);
    for (let i = 0; i < SETTLE; i++) await shot(`mode=opening&rise=1&kettle=1&collapse=${(i / (SETTLE - 1)).toFixed(4)}`, `${out}/settle/f${pad(i)}.png`);
    for (const [k, v] of Object.entries(CAPTIONS)) {
      const [text, extra] = Array.isArray(v) ? v : [v, ''];
      await shot(`mode=caption&text=${encodeURIComponent(text)}${extra ? '&' + extra : ''}`, `${out}/${k}.png`, true);
    }
    for (let i = 0; i < END; i++) await shot(`mode=end&t=${(i / FPS).toFixed(4)}`, `${out}/end/f${pad(i)}.png`);
    writeFileSync(`${out}/captions.json`, JSON.stringify(CAPTIONS, null, 1));
  }
}
await b.close();
console.log('rendered', what, '→', out);
