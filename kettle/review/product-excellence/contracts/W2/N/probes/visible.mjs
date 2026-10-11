// Probe: which items show in the engine's `window` view, and does a fresh base render match the committed still?
// node .tmp/n/visible.mjs <port> <time> <weather> <outdir>
import { chromium } from 'playwright';
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';

const [port = '5213', time = 'night', weather = 'clear', out = '.tmp/n/vis'] = process.argv.slice(2);
mkdirSync(out, { recursive: true });
const W = 1250, H = 1000;
const ITEMS = ['pothos', 'books', 'cushion', 'fairyLights', 'shelf', 'teaSet', 'recordPlayer', 'blanket', 'painting', 'lantern', 'monstera', 'catBed', 'telescope', 'kotatsu'];
const b = await chromium.launch({ args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader', '--ignore-gpu-blocklist'] });
const p = await b.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
await p.goto(`http://127.0.0.1:${port}/.tmp/n/items.html?w=${W}&h=${H}&time=${time}&weather=${weather}`, { waitUntil: 'networkidle' });
await p.waitForFunction(() => window.__ready, null, { timeout: 60000 });
await p.waitForTimeout(6000);
const shot = async () => (await p.screenshot({ timeout: 180000, omitBackground: true })).toString('base64');
const settle = async () => {
  await p.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(() => r()))));
  await p.waitForTimeout(1200);
};
const base = await shot();
writeFileSync(`${out}/base-${time}-${weather}.png`, Buffer.from(base, 'base64'));
const shots = {};
for (const id of ITEMS) {
  await p.evaluate((items) => window.__engine.setState({ items }), [id]);
  await settle();
  shots[id] = await shot();
}
await p.evaluate(() => window.__engine.setState({ items: [] }));
await settle();
const base2 = await shot();
// analyse in a blank page
const a = await b.newPage();
const still = readFileSync(`src/scene/stills/window-${time}-${weather}.webp`).toString('base64');
const res = await a.evaluate(async ({ base, base2, shots, still }) => {
  const load = async (b64, type = 'image/png') => {
    const bmp = await createImageBitmap(await (await fetch(`data:${type};base64,${b64}`)).blob());
    const c = new OffscreenCanvas(bmp.width, bmp.height);
    const x = c.getContext('2d');
    x.drawImage(bmp, 0, 0);
    return x.getImageData(0, 0, bmp.width, bmp.height);
  };
  const B = await load(base);
  const cmp = (A, Bd, thr = 3) => {
    let n = 0, x0 = 1e9, y0 = 1e9, x1 = -1, y1 = -1, max = 0, sum = 0;
    const w = A.width;
    for (let i = 0; i < A.data.length; i += 4) {
      const d = Math.max(Math.abs(A.data[i] - Bd.data[i]), Math.abs(A.data[i + 1] - Bd.data[i + 1]), Math.abs(A.data[i + 2] - Bd.data[i + 2]), Math.abs(A.data[i + 3] - Bd.data[i + 3]));
      sum += d;
      if (d > max) max = d;
      if (d > thr) {
        n++;
        const px = (i / 4) % w, py = Math.floor(i / 4 / w);
        if (px < x0) x0 = px; if (py < y0) y0 = py; if (px > x1) x1 = px; if (py > y1) y1 = py;
      }
    }
    return { n, bbox: n ? [x0, y0, x1 - x0 + 1, y1 - y0 + 1] : null, max, mean: +(sum / (A.data.length / 4)).toFixed(3) };
  };
  const out = { baseRepeat: cmp(await load(base2), B, 0), baseVsStill: cmp(await load(still, 'image/webp'), B, 12), items: {} };
  for (const [id, s] of Object.entries(shots)) out.items[id] = cmp(await load(s), B, 3);
  return out;
}, { base, base2, shots, still });
writeFileSync(`${out}/visible-${time}-${weather}.json`, JSON.stringify(res, null, 1));
console.log(JSON.stringify(res, null, 1));
await b.close();
