// pngout.mjs <a.png> <b.png> x0 y0 x1 y1 : differing pixels outside a box (screenshot px), by max-channel diff histogram
import { readFileSync } from 'node:fs';
const { PNG } = (await import('playwright-core/lib/utilsBundle')).default ?? (await import('playwright-core/lib/utilsBundle'));
const [fa, fb, x0, y0, x1, y1] = process.argv.slice(2); const A = PNG.sync.read(readFileSync(fa)), B = PNG.sync.read(readFileSync(fb));
const W = A.width, H = A.height; const hist = { in: {}, out: {} }; let outsideGt1 = 0, maxOut = 0, insideN = 0;
for (let i = 0; i < W * H; i++) { const o = i * 4; let d = 0; for (let c = 0; c < 4; c++) d = Math.max(d, Math.abs(A.data[o + c] - B.data[o + c])); if (!d) continue; const x = i % W, y = (i - x) / W; const inside = x >= +x0 && x <= +x1 && y >= +y0 && y <= +y1; const h = inside ? hist.in : hist.out; const k = d > 8 ? '>8' : String(d); h[k] = (h[k] ?? 0) + 1; if (inside) insideN++; else { if (d > 1) outsideGt1++; if (d > maxOut) maxOut = d; } }
console.log(JSON.stringify({ size: [W, H], insideBoxDiffering: insideN, outsideBox: { maxChannel: maxOut, pixelsAbove1: outsideGt1, hist: hist.out }, insideHist: hist.in }));
