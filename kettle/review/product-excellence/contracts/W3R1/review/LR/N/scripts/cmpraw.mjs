// cmpraw.mjs <a.rgba.gz> <b.rgba.gz> <W> <H> [chaiBoxJson]: pixel diff of two raw RGBA drawing buffers (GL rows bottom-up; boxes reported top-down).
// prints {size, differing, maxChannel, bbox, clusters[], insideChaiBox} as JSON
import { readFileSync } from 'node:fs'; import { gunzipSync } from 'node:zlib';
const [pa, pb, Ws, Hs, chai] = process.argv.slice(2); const W = +Ws, H = +Hs;
const a = gunzipSync(readFileSync(pa)), b = gunzipSync(readFileSync(pb));
if (a.length !== b.length) { console.log(JSON.stringify({ sizeDiffers: [a.length, b.length] })); process.exit(0); }
const cb = chai ? JSON.parse(chai) : null;
let n = 0, max = 0, inside = 0, x0 = 1e9, x1 = -1, y0 = 1e9, y1 = -1; const pts = [];
for (let i = 0; i < a.length; i += 4) {
  let d = 0; for (let c = 0; c < 4; c++) d = Math.max(d, Math.abs(a[i + c] - b[i + c]));
  if (d) { n++; if (d > max) max = d; const p = i / 4, x = p % W, y = H - 1 - Math.floor(p / W); if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; pts.push([x, y, d]); if (cb && x >= cb.x0 && x <= cb.x1 && y >= cb.y0 && y <= cb.y1) inside++; }
}
const cl = [];
for (const [x, y, d] of pts) { let c = cl.find((c) => Math.abs(c.cx - x) < 40 && Math.abs(c.cy - y) < 40); if (!c) cl.push(c = { cx: x, cy: y, n: 0, x0: 1e9, x1: 0, y0: 1e9, y1: 0, max: 0 }); c.n++; c.x0 = Math.min(c.x0, x); c.x1 = Math.max(c.x1, x); c.y0 = Math.min(c.y0, y); c.y1 = Math.max(c.y1, y); c.max = Math.max(c.max, d); }
console.log(JSON.stringify({ size: [W, H], pixels: W * H, differing: n, maxChannel: max, bbox: n ? [x0, y0, x1, y1] : null, clusters: cl.map(({ cx, cy, ...c }) => c), insideChaiBox: cb ? inside : null }));
