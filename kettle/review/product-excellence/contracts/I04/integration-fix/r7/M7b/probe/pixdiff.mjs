// Pixel diff of BEFORE/AFTER capture pairs (decoded in a headless page's canvas): differing pixels (any channel > 2)
// and their bounding box, in device pixels. With DIFFDIR set, writes <DIFFDIR>/<name> showing the AFTER image dimmed
// with differing pixels in magenta.   node pixdiff.mjs <beforeDir> <afterDir> <glob-substring> [more ...]
import { chromium } from '/home/user/Vibei/kettle/node_modules/playwright/index.mjs';
import { readdirSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
const DIFFDIR = process.env.DIFFDIR;
if (DIFFDIR) mkdirSync(DIFFDIR, { recursive: true });
const [bd, ad, ...subs] = process.argv.slice(2);
const files = readdirSync(bd).filter((f) => f.endsWith('.png') && subs.some((s) => f.includes(s))).sort();
const browser = await chromium.launch();
const page = await browser.newPage();
for (const f of files) {
  const a = 'data:image/png;base64,' + readFileSync(`${bd}/${f}`).toString('base64');
  let b;
  try { b = 'data:image/png;base64,' + readFileSync(`${ad}/${f}`).toString('base64'); } catch { console.log(`${f}: no AFTER`); continue; }
  const r = await page.evaluate(async ([a, b, want]) => {
    const load = (src) => new Promise((ok) => { const i = new Image(); i.onload = () => ok(i); i.src = src; });
    const [ia, ib] = await Promise.all([load(a), load(b)]);
    if (ia.width !== ib.width || ia.height !== ib.height) return { size: `${ia.width}x${ia.height} vs ${ib.width}x${ib.height}` };
    const px = (img) => { const c = new OffscreenCanvas(img.width, img.height); const x = c.getContext('2d'); x.drawImage(img, 0, 0); return x.getImageData(0, 0, img.width, img.height).data; };
    const da = px(ia), db = px(ib);
    let n = 0, x0 = 1e9, y0 = 1e9, x1 = -1, y1 = -1;
    for (let i = 0; i < da.length; i += 4) {
      if (Math.abs(da[i] - db[i]) > 2 || Math.abs(da[i + 1] - db[i + 1]) > 2 || Math.abs(da[i + 2] - db[i + 2]) > 2) {
        n++; const p = i / 4, x = p % ia.width, y = (p / ia.width) | 0;
        if (x < x0) x0 = x; if (y < y0) y0 = y; if (x > x1) x1 = x; if (y > y1) y1 = y;
      }
    }
    let png = null;
    if (want && n) {
      const c = new OffscreenCanvas(ia.width, ia.height); const x = c.getContext('2d');
      const out = x.createImageData(ia.width, ia.height);
      for (let i = 0; i < da.length; i += 4) {
        const d = Math.abs(da[i] - db[i]) > 2 || Math.abs(da[i + 1] - db[i + 1]) > 2 || Math.abs(da[i + 2] - db[i + 2]) > 2;
        out.data[i] = d ? 255 : db[i] * 0.35 + 160; out.data[i + 1] = d ? 0 : db[i + 1] * 0.35 + 160; out.data[i + 2] = d ? 255 : db[i + 2] * 0.35 + 160; out.data[i + 3] = 255;
      }
      x.putImageData(out, 0, 0);
      const blob = await c.convertToBlob({ type: 'image/png' });
      const u = new Uint8Array(await blob.arrayBuffer()); let str = '';
      for (let i = 0; i < u.length; i += 0x8000) str += String.fromCharCode.apply(null, u.subarray(i, i + 0x8000));
      png = btoa(str);
    }
    return { w: ia.width, h: ia.height, n, box: n ? [x0, y0, x1, y1] : null, png };
  }, [a, b, !!DIFFDIR]);
  if (r.png) writeFileSync(`${DIFFDIR}/${f}`, Buffer.from(r.png, 'base64'));
  console.log(`${f}: ${r.size ?? `${r.w}x${r.h} differing pixels ${r.n}${r.box ? ` in box x${r.box[0]}-${r.box[2]} y${r.box[1]}-${r.box[3]}` : ''}`}`);
}
await browser.close();
