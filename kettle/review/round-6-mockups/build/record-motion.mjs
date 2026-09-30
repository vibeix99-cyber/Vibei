// Record the whistle → summary motion prototype (normal | reduced motion side by side) to ../motion/.
// usage: node record-motion.mjs [light|dark]   (dev server on 5191; ffmpeg at kettle/.tmp/bin/ffmpeg)
// The page is a pure function of t, so frames are stepped deterministically at 30 fps, then muxed with the
// app's own whistle sound at the whistle moment.
import { chromium } from 'playwright';
import { mkdirSync, rmSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

const theme = process.argv[2] ?? 'dark';
const FPS = 30;
const END = 8.6;
const WHISTLE_AT = 3;
const OUT = new URL('../motion/', import.meta.url).pathname;
const TMP = `${OUT}.frames-${theme}/`;
const FFMPEG = new URL('../../../.tmp/bin/ffmpeg', import.meta.url).pathname;
const SFX = new URL('../../../marketing/ad-02-chais-deal/sources/audio/sfx-complete.flac', import.meta.url).pathname;
rmSync(TMP, { recursive: true, force: true });
mkdirSync(TMP, { recursive: true });

const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 880, height: 980 }, deviceScaleFactor: 2 });
p.on('pageerror', (e) => console.log('pageerror', e.message));
await p.goto(`http://localhost:5191/review/round-6-mockups/build/mock.html?screen=motion&theme=${theme}&t=0`, { waitUntil: 'networkidle' });
await p.waitForFunction(() => window.__ready === true);
await p.evaluate(() => document.fonts.ready);
const n = Math.round(END * FPS);
for (let i = 0; i <= n; i++) {
  await p.evaluate((t) => window.__setT(t), i / FPS);
  await p.screenshot({ path: `${TMP}${String(i).padStart(4, '0')}.png` });
}
await b.close();

const out = `${OUT}whistle-to-summary-${theme}.mp4`;
execFileSync(FFMPEG, [
  '-y', '-loglevel', 'error',
  '-framerate', String(FPS), '-i', `${TMP}%04d.png`,
  '-i', SFX,
  '-filter_complex', `[1:a]adelay=${WHISTLE_AT * 1000}|${WHISTLE_AT * 1000},apad[a]`,
  '-map', '0:v', '-map', '[a]', '-t', ((n + 1) / FPS).toFixed(3),
  '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '18', '-preset', 'slow',
  '-c:a', 'aac', '-b:a', '160k', '-movflags', '+faststart',
  out,
]);
rmSync(TMP, { recursive: true, force: true });
console.log('wrote', out, `(${n + 1} frames)`);
