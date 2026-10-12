// Pre-render the earned-item layers of the Focus backdrop (engine `window` mode), for the 3D-off / loading still.
//
// What it makes: for every time of day × weather (the same 12 lighting states as the base stills,
// render-window-stills.mjs), the engine renders the base room and then the backdrop's items added one at a time
// in unlock order. Each item's layer is the difference between consecutive renders: the pixels that item changes
// (the item itself, plus the shadows, light wash and occlusion it adds), cut out with a soft alpha and cropped to
// the item's box (one box per item across all lighting states). Painted in unlock order over the base still,
// the layers rebuild the live 3D render of that item set exactly where it is in the live window view (same
// engine, same camera, same 1250 × 1000 frame and cover-fit). No new artwork: every pixel comes from the existing
// 3D items. Because the layers are cumulative they are exact for the sets the app shows: the backdrop's items are
// always the unlock-order prefix for the user's level (progress itemsUnlockedAt) minus teaSet.
//
// Variants: all 12 lighting states are rendered, then states whose layer is the same within TOL share one file.
// Weather changes item lighting only through the window light (rain × 0.65, Engine.ts pushMood) and the glass
// behind an item's edges, so snow and clear usually merge, and rain merges wherever the window light barely
// reaches the item; time of day (hemisphere, window and lamp light, emissive fairy lights) always differs. The
// variant count therefore follows the measured lighting: at the time of writing 8 items, 40 files (4–8 per item),
// 391,542 bytes in all (budget 400 KB). Stored at 0.75 × the frame resolution, WebP colour quality 0.45 and alpha
// in steps of 43: the backdrop is blurred (Stage.module.css .window) and quieted, which hides all three.
//
// Regenerate (from kettle/), whenever the room, an item, the window camera (Engine.ts WINDOW_CAM) or the lighting
// (palette.ts MOODS, Engine.ts pushMood) changes, together with the base stills so the two stay pixel-matched:
//   1. npx vite --port 5213 --strictPort            (any dev server; pass its port below)
//   2. node scripts/stills/render-window-stills.mjs && python3 scripts/stills/encode.py   (base stills, if needed)
//   3. node scripts/stills/render-item-layers.mjs --port 5213 [--work .tmp/stills/items]
//      → src/scene/stills/items/<id>-<variant>.webp + src/scene/stills/items.json (frame, order, per item: its box
//        on the 1250 × 1000 frame and the file for each `${time}-${weather}`), plus the raw renders and match.json
//        (still + layers vs the live render, per lighting state) under --work.
//   4. Check the total stays within the budget, then run tests/w2-room.spec.ts.
//   --reuse 1 re-cuts the layers from the renders already in --work (to tune --q / --scale / --aq / --tol / --lo /
//   --hi without rendering again). --items overrides the list below if an item enters or leaves the window frame
//   (an item with no changed pixels is reported as "no pixels" and gets no layer).
// Browser: one Chromium (SwiftShader, like the base stills); about 4 minutes on a loaded 4-core machine.
import { chromium } from 'playwright';
import { mkdirSync, writeFileSync, readFileSync, readdirSync, rmSync } from 'node:fs';

const args = Object.fromEntries(process.argv.slice(2).reduce((a, x, i, all) => (x.startsWith('--') && a.push([x.slice(2), all[i + 1]]), a), []));
const PORT = args.port || '5213';
const WORK = args.work || '.tmp/stills/items';
const Q = +(args.q || 0.45); // WebP quality (colour)
const HARNESS = args.harness || '/scripts/stills/window.html';
const OUT = args.outdir || 'src/scene/stills/items';
const MANIFEST = args.manifest || 'src/scene/stills/items.json';
const W = 1250, H = 1000; // WINDOW_CAM.aspect = 1.25, as the base stills
const TIMES = (args.times || 'morning,day,dusk,night').split(',');
const WEATHERS = (args.weathers || 'clear,rain,snow').split(',');
/** The Focus backdrop's items in unlock order (progress/items.ts), minus the ones out of the window frame
 *  (cushion, blanket, painting, lantern, catBed: no pixel changes) and teaSet (kept out of the backdrop,
 *  Stage.tsx NOT_IN_BACKDROP).
 *  To re-check the list, run with --items set to all 14 ids: items with no changed pixels are reported. */
const ORDER = (args.items || 'pothos,books,fairyLights,shelf,recordPlayer,monstera,telescope,kotatsu').split(',');
/** Soft cut-out: per-pixel change below LO is the room (alpha 0), above HI fully the layer (alpha 1). */
const LO = +(args.lo || 6), HI = +(args.hi || 18);
/** Two lighting states share a layer file when their layers differ by at most TOL (mean, 0–255) inside it. */
const TOL = +(args.tol || 4);
/** Layer files are stored at S × the frame resolution (the backdrop is blurred and quieted; see the header). */
const S = +(args.scale || 0.75);
/** Alpha step (0–255) of the stored layers. */
const AQ = +(args.aq || 43);

/** Drop the sRGB ICC profile the canvas encoder adds (≈ 0.5 KB a file; WebP without one is sRGB already). */
function stripIcc(buf) {
  if (buf.toString('latin1', 12, 16) !== 'VP8X') return buf;
  const parts = [buf.subarray(0, 12)];
  for (let i = 12; i < buf.length; ) {
    const id = buf.toString('latin1', i, i + 4), size = buf.readUInt32LE(i + 4), end = i + 8 + size + (size & 1);
    if (id !== 'ICCP') parts.push(Buffer.from(buf.subarray(i, end)));
    i = end;
  }
  const out = Buffer.concat(parts);
  out[20] &= ~0x20; // VP8X flags: no ICC profile
  out.writeUInt32LE(out.length - 8, 4);
  return out;
}

mkdirSync(WORK, { recursive: true });
mkdirSync(OUT, { recursive: true });
const b = await chromium.launch({ args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader', '--ignore-gpu-blocklist'] });
const p = await b.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
if (!args.reuse) {
  await p.goto(`http://127.0.0.1:${PORT}${HARNESS}?w=${W}&h=${H}&time=${TIMES[0]}&weather=${WEATHERS[0]}&run=0`, { waitUntil: 'networkidle' });
  await p.waitForFunction(() => window.__ready, null, { timeout: 60000 });
  await p.waitForTimeout(3000);
}
const frame = () => p.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(r, 50)))));
const render = async (state) => {
  await p.evaluate((s) => window.__engine.setState(s), state);
  await frame();
  await frame();
  return (await p.screenshot({ timeout: 180000, omitBackground: true })).toString('base64');
};

// ---- 1. renders (or --reuse: the renders already in --work)
const shots = {}; // variant → [base, +item1, +item1+item2, …] (base64 PNG)
const t0 = Date.now();
for (const time of TIMES) {
  for (const weather of WEATHERS) {
    const v = `${time}-${weather}`;
    if (args.reuse) {
      shots[v] = Array.from({ length: ORDER.length + 1 }, (_, k) => readFileSync(`${WORK}/${v}-${k}.png`).toString('base64'));
      continue;
    }
    await p.evaluate((s) => window.__engine.setState(s), { time, weather, items: [] });
    const list = [await render({ items: [] })];
    for (let k = 1; k <= ORDER.length; k++) list.push(await render({ items: ORDER.slice(0, k) }));
    shots[v] = list;
    list.forEach((s, k) => writeFileSync(`${WORK}/${v}-${k}.png`, Buffer.from(s, 'base64')));
    console.log('rendered', v, `${((Date.now() - t0) / 1000).toFixed(0)} s`);
  }
}
await p.close();

// ---- 2. layers (in a blank page: decode, diff, cut out, crop, encode)
const a = await b.newPage();
await a.evaluate(() => {
  window.__img = async (b64, type = 'image/png') => {
    const bmp = await createImageBitmap(await (await fetch(`data:${type};base64,${b64}`)).blob());
    const c = new OffscreenCanvas(bmp.width, bmp.height);
    const x = c.getContext('2d');
    x.drawImage(bmp, 0, 0);
    return x.getImageData(0, 0, bmp.width, bmp.height);
  };
});
// 2a. per lighting state: decode each render once; each item's soft mask = its change over the previous render.
// Kept per (state, item): the mask and colours inside that state's own box only.
const boxes = {};
const vbox = {}; // id → union [x0, y0, x1, y1]
for (const v of Object.keys(shots)) {
  const r = await a.evaluate(async ({ list, v, ids, LO, HI }) => {
    const out = {};
    let P = await window.__img(list[0]);
    const w = P.width, h = P.height;
    for (let k = 0; k < ids.length; k++) {
      const C = await window.__img(list[k + 1]);
      const n = w * h, m = new Uint8ClampedArray(n);
      let x0 = 1e9, y0 = 1e9, x1 = -1, y1 = -1;
      for (let i = 0; i < n; i++) {
        const j = i * 4;
        const d = Math.max(Math.abs(P.data[j] - C.data[j]), Math.abs(P.data[j + 1] - C.data[j + 1]), Math.abs(P.data[j + 2] - C.data[j + 2]), Math.abs(P.data[j + 3] - C.data[j + 3]));
        const al = Math.min(1, Math.max(0, (d - LO) / (HI - LO)));
        if (!al) continue;
        m[i] = Math.round(al * 255);
        const x = i % w, y = (i / w) | 0;
        if (x < x0) x0 = x; if (y < y0) y0 = y; if (x > x1) x1 = x; if (y > y1) y1 = y;
      }
      if (x1 >= 0) {
        const bw = x1 - x0 + 1, bh = y1 - y0 + 1, mc = new Uint8ClampedArray(bw * bh), cc = new Uint8ClampedArray(bw * bh * 4);
        for (let y = 0; y < bh; y++) {
          const row = (y0 + y) * w + x0;
          mc.set(m.subarray(row, row + bw), y * bw);
          cc.set(C.data.subarray(row * 4, (row + bw) * 4), y * bw * 4);
        }
        (window.__m ||= {})[`${v}|${ids[k]}`] = { box: [x0, y0, bw, bh], m: mc, c: cc };
        out[ids[k]] = [x0, y0, x1, y1];
      }
      P = C;
    }
    return out;
  }, { list: shots[v], v, ids: ORDER, LO, HI });
  for (const [id, bb] of Object.entries(r)) vbox[id] = vbox[id] ? [Math.min(vbox[id][0], bb[0]), Math.min(vbox[id][1], bb[1]), Math.max(vbox[id][2], bb[2]), Math.max(vbox[id][3], bb[3])] : bb;
}
for (const id of ORDER) {
  const box = vbox[id];
  if (!box) { console.log('no pixels for', id); continue; }
  // pad by 1 px for the soft edge, keep inside the frame
  const x0 = Math.max(0, box[0] - 1), y0 = Math.max(0, box[1] - 1), x1 = Math.min(W - 1, box[2] + 1), y1 = Math.min(H - 1, box[3] + 1);
  boxes[id] = [x0, y0, x1 - x0 + 1, y1 - y0 + 1];
}
// A layer's pixel (premultiplied RGB + alpha) at frame position (x, y), from its own box (0 outside it).
await a.evaluate(() => {
  window.__px = (L, x, y) => {
    if (!L) return null;
    const [bx, by, bw, bh] = L.box;
    if (x < bx || y < by || x >= bx + bw || y >= by + bh) return null;
    return (y - by) * bw + (x - bx);
  };
});

// 2b. dedupe lighting states per item (exact-ish layer equality), encode one WebP per distinct layer
for (const f of readdirSync(OUT)) if (f.endsWith('.webp')) rmSync(`${OUT}/${f}`);
const manifest = { frame: [W, H], scale: S, order: ORDER.filter((id) => boxes[id]), items: {} };
let total = 0;
for (const id of manifest.order) {
  const box = boxes[id];
  const groups = []; // [{ rep: v, members: [v…] }]
  for (const v of Object.keys(shots)) {
    let hit = null;
    for (const g of groups) {
      const diff = await a.evaluate(({ ka, kb, box }) => {
        const A = window.__m[ka], B = window.__m[kb];
        const [bx, by, bw, bh] = box;
        let s = 0, n = 0;
        for (let y = by; y < by + bh; y++) for (let x = bx; x < bx + bw; x++) {
          const ia = window.__px(A, x, y), ib = window.__px(B, x, y);
          const ma = ia === null ? 0 : A.m[ia], mb = ib === null ? 0 : B.m[ib];
          if (!ma && !mb) continue;
          // premultiplied difference, so a pixel present in one layer only counts fully
          for (let c = 0; c < 3; c++) s += Math.abs(((ma ? A.c[ia * 4 + c] : 0) * ma) / 255 - ((mb ? B.c[ib * 4 + c] : 0) * mb) / 255) / 3;
          n++;
        }
        return n ? s / n : 0;
      }, { ka: `${g.rep}|${id}`, kb: `${v}|${id}`, box });
      if (diff <= TOL) { hit = g; break; }
    }
    if (hit) hit.members.push(v);
    else groups.push({ rep: v, members: [v] });
  }
  const variants = {};
  for (const g of groups) {
    const stem = `${id}-${g.members.length === Object.keys(shots).length ? 'all' : g.rep}`;
    const b64 = await a.evaluate(async ({ key, box, Q, S, AQ }) => {
      const L = window.__m[key];
      const [bx, by, bw, bh] = box;
      const out = new ImageData(bw, bh);
      for (let y = 0; y < bh; y++) for (let x = 0; x < bw; x++) {
        const i = window.__px(L, bx + x, by + y), o = (y * bw + x) * 4;
        if (i === null || !L.m[i]) continue;
        out.data[o] = L.c[i * 4];
        out.data[o + 1] = L.c[i * 4 + 1];
        out.data[o + 2] = L.c[i * 4 + 2];
        out.data[o + 3] = Math.round((L.m[i] * L.c[i * 4 + 3]) / 255);
      }
      const full = new OffscreenCanvas(bw, bh);
      full.getContext('2d').putImageData(out, 0, 0);
      // Stored at S × the frame's resolution (the app scales it back into its box; the backdrop is blurred anyway).
      const c = new OffscreenCanvas(Math.max(1, Math.round(bw * S)), Math.max(1, Math.round(bh * S)));
      const cx = c.getContext('2d');
      cx.imageSmoothingQuality = 'high';
      cx.drawImage(full, 0, 0, c.width, c.height);
      // Alpha in AQ steps: WebP stores alpha losslessly, and a smooth ramp costs more than the colour itself;
      // under the backdrop's blur the steps don't show.
      const id = cx.getImageData(0, 0, c.width, c.height);
      for (let i = 3; i < id.data.length; i += 4) {
        const al = Math.round(id.data[i] / AQ) * AQ;
        id.data[i] = Math.min(255, al);
        if (!al) id.data[i - 1] = id.data[i - 2] = id.data[i - 3] = 0;
      }
      cx.putImageData(id, 0, 0);
      const blob = await c.convertToBlob({ type: 'image/webp', quality: Q });
      const buf = new Uint8Array(await blob.arrayBuffer());
      let s = '';
      for (let i = 0; i < buf.length; i += 0x8000) s += String.fromCharCode(...buf.subarray(i, i + 0x8000));
      return btoa(s);
    }, { key: `${g.rep}|${id}`, box, Q, S, AQ });
    const buf = stripIcc(Buffer.from(b64, 'base64'));
    writeFileSync(`${OUT}/${stem}.webp`, buf);
    total += buf.length;
    for (const v of g.members) variants[v] = stem;
  }
  manifest.items[id] = { box, variants };
  console.log(id, 'box', box.join(','), 'files', groups.length, groups.map((g) => g.members.join('+')).join(' | '));
}
writeFileSync(MANIFEST, JSON.stringify(manifest, null, 1) + '\n');
console.log('layers total', (total / 1024).toFixed(1), 'KB');

// ---- 3. match report: committed still + layers (as the app paints them) vs the live render of the full set
const report = {};
for (const v of Object.keys(shots)) {
  const [time, weather] = v.split('-');
  const still = readFileSync(`src/scene/stills/window-${time}-${weather}.webp`).toString('base64');
  const layers = manifest.order.map((id) => ({ box: manifest.items[id].box, b64: readFileSync(`${OUT}/${manifest.items[id].variants[v]}.webp`).toString('base64') }));
  report[v] = await a.evaluate(async ({ still, layers, live, W, H }) => {
    const c = new OffscreenCanvas(W, H), x = c.getContext('2d');
    const draw = async (b64, type) => x.drawImage(await createImageBitmap(await (await fetch(`data:${type};base64,${b64}`)).blob()), 0, 0);
    await draw(still, 'image/webp');
    const base = x.getImageData(0, 0, W, H);
    for (const l of layers) x.drawImage(await createImageBitmap(await (await fetch(`data:image/webp;base64,${l.b64}`)).blob()), l.box[0], l.box[1], l.box[2], l.box[3]);
    const comp = x.getImageData(0, 0, W, H);
    const L = await window.__img(live);
    const stat = (A) => {
      let s = 0, big = 0;
      for (let i = 0; i < A.data.length; i += 4) {
        if (L.data[i + 3] < 8 && A.data[i + 3] < 8) continue;
        const d = Math.max(Math.abs(A.data[i] - L.data[i]), Math.abs(A.data[i + 1] - L.data[i + 1]), Math.abs(A.data[i + 2] - L.data[i + 2]));
        s += d;
        if (d > 32) big++;
      }
      return { mean: +(s / (W * H)).toFixed(2), over32: +((100 * big) / (W * H)).toFixed(2) };
    };
    return { stillOnly: stat(base), stillPlusLayers: stat(comp) };
  }, { still, layers, live: shots[v][ORDER.length], W, H });
  console.log('match', v, JSON.stringify(report[v]));
}
writeFileSync(`${WORK}/match.json`, JSON.stringify({ tol: TOL, lo: LO, hi: HI, q: Q, scale: S, aq: AQ, totalKB: +(total / 1024).toFixed(1), boxes, report }, null, 1));
await b.close();
