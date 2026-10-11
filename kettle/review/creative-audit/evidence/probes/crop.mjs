// crop.mjs out.png scale  in1.png:x,y,w,h[:label] [in2.png:x,y,w,h[:label] ...] — crops (image px) side by side, scaled, labelled
import { chromium } from 'playwright';
import { readFileSync } from 'node:fs';
const [out, scale, ...specs] = process.argv.slice(2);
const parts = specs.map((sp) => { const [f, r, label = '', ps = scale] = sp.split(':'); const [x, y, w, h] = r.split(',').map(Number); return { f, x, y, w, h, label, s: +ps, data: 'data:image/png;base64,' + readFileSync(f).toString('base64') }; });
const H = Math.max(...parts.map((p) => p.h * p.s)) + 28, W = parts.reduce((a, p) => a + p.w * p.s + 12, 12);
const html = `<body style="margin:0;background:#2a2a2a;font:14px sans-serif;color:#fff">${parts.map((p, i) => `<div style="position:absolute;left:${12 + parts.slice(0, i).reduce((a, q) => a + q.w * q.s + 12, 0)}px;top:0;width:${p.w * p.s}px;height:${H}px"><div style="height:24px;line-height:24px">${p.label}</div><div style="position:relative;overflow:hidden;width:${p.w * p.s}px;height:${p.h * p.s}px"><img src="${p.data}" style="position:absolute;left:${-p.x * p.s}px;top:${-p.y * p.s}px;transform-origin:0 0;transform:scale(${p.s});image-rendering:pixelated"></div></div>`).join('')}</body>`;
const b = await chromium.launch();
const pg = await b.newPage({ viewport: { width: Math.ceil(W), height: Math.ceil(H) } });
await pg.setContent(html); await pg.waitForTimeout(300);
await pg.screenshot({ path: out }); await b.close(); console.log(out, W, H);
