// UGC pack: encode the recorded core loop (record-core-loop.mjs) into one MP4 with the time jump disclosed:
// a full-screen card between Focus and the whistle, plus a small "time skipped" tag over the first 2 s after it.
// usage (from kettle/): node marketing/ugc-pack/build/encode-core-loop.mjs <rec-dir> <out.mp4>
import { chromium } from 'playwright';
import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync } from 'node:fs';

const [rec = '.tmp/ugc-rec', out = 'marketing/ugc-pack/recording/kettle-core-loop-real-TIME-SKIPPED.mp4'] = process.argv.slice(2);
const FF = '.tmp/bin/ffmpeg';
mkdirSync(out.replace(/[^/]+$/, ''), { recursive: true });
const font = `@import url('data:text/css,'); body{margin:0;font-family:'Nunito',system-ui,sans-serif}`;
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
await p.goto('http://localhost:5191/marketing/ugc-pack/build/logo.html'); // loads the app fonts (Fredoka, Nunito)
await p.evaluate((css) => {
  document.body.innerHTML = `<style>${css}</style><div id="card" style="position:fixed;inset:0;background:#3b2a20;color:#fff9f0;display:grid;place-content:center;text-align:center;padding:0 34px;gap:14px">
    <div style="font:600 44px var(--font-display)">⏩ Time skipped</div>
    <div style="font:700 19px var(--font-body);line-height:1.45">The app's clock was jumped about 25 minutes,<br>to 3 seconds before the whistle.</div>
    <div style="font:600 16px var(--font-body);opacity:.8;line-height:1.45">Everything else is a real, unedited recording<br>of Kettle 0.1.0, played at real speed.</div></div>`;
}, font);
await p.waitForTimeout(400);
await p.screenshot({ path: `${rec}/card.png` });
await p.evaluate(() => {
  document.body.innerHTML = `<div style="position:fixed;left:0;top:0;width:390px;height:844px;background:transparent"><span style="position:absolute;left:12px;top:64px;padding:6px 12px;border-radius:99px;background:rgba(59,42,32,.88);color:#fff9f0;font:800 13px var(--font-body)">⏩ 25 min skipped</span></div>`;
  document.documentElement.style.background = 'transparent';
  document.body.style.background = 'transparent';
});
await p.screenshot({ path: `${rec}/tag.png`, omitBackground: true });
await b.close();

const ev = JSON.parse(readFileSync(`${rec}/events.json`, 'utf8'));
const fps = ev.fps;
const a = ev.segments['a-home-focus'].frames / fps;
const card = 1.8;
const tagFrom = a + card;
// concat: A frames, the card (held), B frames, C frames
execFileSync(FF, [
  '-y', '-loglevel', 'error',
  '-framerate', String(fps), '-i', `${rec}/a-home-focus/f%04d.jpg`,
  '-loop', '1', '-t', String(card), '-framerate', String(fps), '-i', `${rec}/card.png`,
  '-framerate', String(fps), '-i', `${rec}/b-whistle/f%04d.jpg`,
  '-framerate', String(fps), '-i', `${rec}/c-cards-break/f%04d.jpg`,
  '-i', `${rec}/tag.png`,
  '-filter_complex',
  `[0:v]scale=780:1688,setsar=1,format=yuv420p[a];[1:v]scale=780:1688,setsar=1,format=yuv420p[c];[2:v]scale=780:1688,setsar=1,format=yuv420p[b];[3:v]scale=780:1688,setsar=1,format=yuv420p[d];` +
    `[a][c][b][d]concat=n=4:v=1:a=0[v];[4:v]scale=780:1688[t];[v][t]overlay=0:0:enable='between(t,${tagFrom.toFixed(3)},${(tagFrom + 2.2).toFixed(3)})'[o]`,
  '-map', '[o]', '-r', String(fps), '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '18', '-preset', 'slow', '-movflags', '+faststart', '-an',
  out,
]);
console.log('wrote', out);
