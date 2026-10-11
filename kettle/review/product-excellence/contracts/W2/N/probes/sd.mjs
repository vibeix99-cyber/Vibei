// Colour spread of the top fifth of each screenshot (a plain sky gradient < 6; the room 20–40). node sd.mjs <png>...
import { chromium } from 'playwright';
import { readFileSync } from 'node:fs';
const b = await chromium.launch();
const p = await b.newPage();
for (const f of process.argv.slice(2)) {
  const r = await p.evaluate(async (b64) => {
    const bmp = await createImageBitmap(await (await fetch(`data:image/png;base64,${b64}`)).blob());
    const c = new OffscreenCanvas(bmp.width, bmp.height); const x = c.getContext('2d'); x.drawImage(bmp, 0, 0);
    const d = x.getImageData(0, 0, bmp.width, Math.round(bmp.height * 0.2)).data;
    let n = 0; const s = [0, 0, 0], s2 = [0, 0, 0];
    for (let i = 0; i < d.length; i += 16) { for (let k = 0; k < 3; k++) { s[k] += d[i + k]; s2[k] += d[i + k] ** 2; } n++; }
    return +Math.max(...s.map((v, k) => Math.sqrt(s2[k] / n - (v / n) ** 2))).toFixed(1);
  }, readFileSync(f).toString('base64'));
  console.log(`sd ${r} ${r < 6 ? 'BLANK' : 'room'} ${f}`);
}
await b.close();
