// Side-by-side evidence sheets: node sheet.mjs <spec.json>
// spec: [{ out, title, panels: [{ path, label, crop?: [x, y, w, h] (fractions 0–1) }], height? }]
import { chromium } from 'playwright';
import { readFileSync, writeFileSync } from 'node:fs';

const specs = JSON.parse(readFileSync(process.argv[2], 'utf8'));
const b = await chromium.launch();
const p = await b.newPage();
for (const sp of specs) {
  const panels = sp.panels.map((x) => ({ ...x, b64: readFileSync(x.path).toString('base64'), type: x.path.endsWith('.webp') ? 'image/webp' : 'image/png' }));
  const b64 = await p.evaluate(async ({ panels, title, height, jpg }) => {
    const bmps = await Promise.all(panels.map(async (x) => createImageBitmap(await (await fetch(`data:${x.type};base64,${x.b64}`)).blob())));
    const H = height || 900, pad = 16, head = 44, lab = 34;
    const dims = bmps.map((bm, i) => {
      const c = panels[i].crop || [0, 0, 1, 1];
      const sw = bm.width * c[2], sh = bm.height * c[3];
      return { sx: bm.width * c[0], sy: bm.height * c[1], sw, sh, w: Math.round((sw * H) / sh) };
    });
    const W = dims.reduce((a, d) => a + d.w + pad, pad);
    const cv = new OffscreenCanvas(W, H + head + lab + pad);
    const x = cv.getContext('2d');
    x.fillStyle = '#1e1b24'; x.fillRect(0, 0, cv.width, cv.height);
    x.fillStyle = '#fff'; x.font = '600 22px sans-serif'; x.fillText(title, pad, 30);
    let cx = pad;
    bmps.forEach((bm, i) => {
      const d = dims[i];
      x.drawImage(bm, d.sx, d.sy, d.sw, d.sh, cx, head, d.w, H);
      x.fillStyle = '#ffd98a'; x.font = '600 18px sans-serif'; x.fillText(panels[i].label, cx, head + H + 25);
      cx += d.w + pad;
    });
    const blob = await cv.convertToBlob(jpg ? { type: 'image/jpeg', quality: 0.86 } : { type: 'image/png' });
    const buf = new Uint8Array(await blob.arrayBuffer());
    let s = '';
    for (let i = 0; i < buf.length; i += 0x8000) s += String.fromCharCode(...buf.subarray(i, i + 0x8000));
    return btoa(s);
  }, { panels, title: sp.title, height: sp.height, jpg: sp.out.endsWith('.jpg') });
  writeFileSync(sp.out, Buffer.from(b64, 'base64'));
  console.log('wrote', sp.out);
}
await b.close();
