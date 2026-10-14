// pngtool.mjs diff <a.png> <b.png> [heat.png]   -> JSON {size, differing, pct, max, bbox, clusters}
// pngtool.mjs montage <out.png> <gap> <a.png> <b.png> ...   -> horizontal montage (images top-aligned, black gap)
import { readFileSync, writeFileSync } from 'node:fs';
const { PNG } = (await import('playwright-core/lib/utilsBundle')).default ?? (await import('playwright-core/lib/utilsBundle'));
const [cmd, ...r] = process.argv.slice(2);
const rd = (f) => PNG.sync.read(readFileSync(f));
if (cmd === 'diff') {
  const [fa, fb, heat] = r; const A = rd(fa), B = rd(fb);
  if (A.width !== B.width || A.height !== B.height) { console.log(JSON.stringify({ sizeDiffers: [[A.width, A.height], [B.width, B.height]] })); process.exit(0); }
  const { width: W, height: H } = A; let n = 0, max = 0, x0 = 1e9, x1 = -1, y0 = 1e9, y1 = -1; const pts = [];
  const out = heat ? new PNG({ width: W, height: H }) : null;
  for (let i = 0; i < W * H; i++) { const o = i * 4; let d = 0; for (let c = 0; c < 4; c++) d = Math.max(d, Math.abs(A.data[o + c] - B.data[o + c]));
    if (d) { n++; if (d > max) max = d; const x = i % W, y = (i - x) / W; if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; pts.push([x, y, d]); }
    if (out) { const g = Math.round(A.data[o] * 0.3 + A.data[o + 1] * 0.59 + A.data[o + 2] * 0.11) >> 1; out.data[o] = d ? 255 : g; out.data[o + 1] = d ? 0 : g; out.data[o + 2] = d ? 0 : g; out.data[o + 3] = 255; } }
  const cl = []; for (const [x, y, d] of pts) { let c = cl.find((c) => Math.abs(c.cx - x) < 60 && Math.abs(c.cy - y) < 60); if (!c) cl.push(c = { cx: x, cy: y, n: 0, x0: 1e9, x1: 0, y0: 1e9, y1: 0, max: 0 }); c.n++; c.x0 = Math.min(c.x0, x); c.x1 = Math.max(c.x1, x); c.y0 = Math.min(c.y0, y); c.y1 = Math.max(c.y1, y); c.max = Math.max(c.max, d); }
  if (out && n) writeFileSync(heat, PNG.sync.write(out));
  console.log(JSON.stringify({ size: [W, H], differing: n, pct: +(100 * n / (W * H)).toFixed(4), maxChannel: max, bbox: n ? [x0, y0, x1, y1] : null, clusters: cl.sort((p, q) => q.n - p.n).slice(0, 8).map(({ cx, cy, ...c }) => c) }));
} else if (cmd === 'montage') {
  const [outf, gapS, ...fs] = r; const gap = +gapS; const imgs = fs.map(rd);
  const H = Math.max(...imgs.map((i) => i.height)); const W = imgs.reduce((s, i) => s + i.width, 0) + gap * (imgs.length - 1);
  const O = new PNG({ width: W, height: H }); O.data.fill(0); for (let i = 3; i < O.data.length; i += 4) O.data[i] = 255;
  let ox = 0; for (const im of imgs) { PNG.bitblt(im, O, 0, 0, im.width, im.height, ox, 0); ox += im.width + gap; }
  writeFileSync(outf, PNG.sync.write(O)); console.log('wrote', outf, W, H);
}
if (cmd === 'up') { // pngtool.mjs up <in.png> <out.png> <k>: nearest-neighbour k× enlargement (for the small Nook-view crops)
  const [fi, fo, kS] = r; const k = +kS; const A = rd(fi); const O = new PNG({ width: A.width * k, height: A.height * k });
  for (let y = 0; y < O.height; y++) for (let x = 0; x < O.width; x++) { const s = ((Math.floor(y / k)) * A.width + Math.floor(x / k)) * 4, d = (y * O.width + x) * 4; O.data[d] = A.data[s]; O.data[d + 1] = A.data[s + 1]; O.data[d + 2] = A.data[s + 2]; O.data[d + 3] = 255; }
  writeFileSync(fo, PNG.sync.write(O)); console.log('wrote', fo, O.width, O.height);
}
