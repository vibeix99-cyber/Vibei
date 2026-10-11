// node composite.mjs <variant e.g. day-clear> <out.png>  — the committed still + every layer, as the app paints them
import { chromium } from 'playwright';
import { readFileSync, writeFileSync } from 'node:fs';

const [v, out] = process.argv.slice(2);
const man = JSON.parse(readFileSync('src/scene/stills/items.json', 'utf8'));
const still = readFileSync(`src/scene/stills/window-${v}.webp`).toString('base64');
const layers = man.order.map((id) => ({ box: man.items[id].box, b64: readFileSync(`src/scene/stills/items/${man.items[id].variants[v]}.webp`).toString('base64') }));
const b = await chromium.launch();
const p = await b.newPage();
const b64 = await p.evaluate(async ({ still, layers, W, H }) => {
  const c = new OffscreenCanvas(W, H), x = c.getContext('2d');
  const bm = async (s) => createImageBitmap(await (await fetch(`data:image/webp;base64,${s}`)).blob());
  x.drawImage(await bm(still), 0, 0);
  for (const l of layers) x.drawImage(await bm(l.b64), l.box[0], l.box[1], l.box[2], l.box[3]);
  const blob = await c.convertToBlob({ type: 'image/png' });
  const buf = new Uint8Array(await blob.arrayBuffer());
  let s = '';
  for (let i = 0; i < buf.length; i += 0x8000) s += String.fromCharCode(...buf.subarray(i, i + 0x8000));
  return btoa(s);
}, { still, layers, W: man.frame[0], H: man.frame[1] });
writeFileSync(out, Buffer.from(b64, 'base64'));
await b.close();
console.log('wrote', out);
