// strip.mjs <out.png> <from> <to> <everyMs> <n> [waitBefore]
import { chromium } from '/home/user/wt/w11/kettle/node_modules/playwright/index.mjs';
import fs from 'node:fs';
const [out, from, to, every, n, wait = '4000'] = process.argv.slice(2);
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1400, height: 1600 } });
await p.goto('http://127.0.0.1:5651/.tmp/rv-harness/measure.html'); await p.waitForFunction(() => window.loaded);
await p.evaluate((x) => window.setPose(+x), from); await p.waitForTimeout(+wait);
await p.evaluate(() => { window.__frames = []; });
const t0 = Date.now();
await p.evaluate((x) => window.setPose(+x), to);
const res = await p.evaluate(async ([every, n]) => {
  const cv = document.getElementById('c'); const fw = 164, fh = 198; const cols = Math.min(n, 10), rows = Math.ceil(n / cols);
  const big = document.createElement('canvas'); big.width = cols * fw; big.height = rows * (fh + 16); const g = big.getContext('2d');
  g.fillStyle = '#f6efe4'; g.fillRect(0, 0, big.width, big.height); g.font = '12px sans-serif'; g.fillStyle = '#333';
  const t0 = performance.now(); const times = [];
  for (let i = 0; i < n; i++) {
    const target = t0 + i * every; while (performance.now() < target) await new Promise((r) => requestAnimationFrame(r));
    const x = (i % cols) * fw, y = Math.floor(i / cols) * (fh + 16);
    g.drawImage(cv, x, y, fw, fh); g.fillText(`${((performance.now() - t0) / 1000).toFixed(2)} s`, x + 4, y + fh + 12); times.push(performance.now() - t0);
  }
  return big.toDataURL('image/png');
}, [+every, +n]);
fs.writeFileSync(out, Buffer.from(res.split(',')[1], 'base64'));
await b.close();
