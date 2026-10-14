// where.mjs <before.gz> <after.gz> <W> <H>: bounding boxes of differing pixels (GL rows are bottom-up; y reported top-down)
import { readFileSync } from 'node:fs'; import { gunzipSync } from 'node:zlib';
const [pb, pa, W, H] = process.argv.slice(2); const b = gunzipSync(readFileSync(pb)), a = gunzipSync(readFileSync(pa));
const pts = [];
for (let i = 0; i < b.length; i += 4) { let d = 0; for (let c = 0; c < 4; c++) d = Math.max(d, Math.abs(b[i + c] - a[i + c])); if (d) { const p = i / 4; pts.push([p % W, H - 1 - Math.floor(p / W), d, [b[i],b[i+1],b[i+2]], [a[i],a[i+1],a[i+2]]]); } }
const cl = []; for (const p of pts) { let c = cl.find((c) => Math.abs(c.x - p[0]) < 40 && Math.abs(c.y - p[1]) < 40); if (!c) cl.push(c = { x: p[0], y: p[1], n: 0, x0: 1e9, x1: 0, y0: 1e9, y1: 0, max: 0, ex: p }); c.n++; c.x0 = Math.min(c.x0, p[0]); c.x1 = Math.max(c.x1, p[0]); c.y0 = Math.min(c.y0, p[1]); c.y1 = Math.max(c.y1, p[1]); c.max = Math.max(c.max, p[2]); }
console.log(JSON.stringify(cl.map(({ ex, ...c }) => ({ ...c, before: ex[3], after: ex[4] }))));
