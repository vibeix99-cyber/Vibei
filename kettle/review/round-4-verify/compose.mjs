import { chromium } from 'playwright';
import { readFileSync, readdirSync } from 'node:fs';
const RAW = '.tmp/verify/raw', OUT = 'review/round-4-verify';
const meta = JSON.parse(readFileSync(`${RAW}/meta.json`, 'utf8'));
const img = (f) => `data:image/png;base64,${readFileSync(`${RAW}/${f}`).toString('base64')}`;
const PAIRS = [
  ['today-768', 'Today · tablet 768 px · light'],
  ['stats-768', 'Stats · tablet 768 px · light'],
  ['settings-land', 'Settings · phone landscape 844×390 · light'],
  ['today-607', 'Today · 607 px (about the width of the artifact viewer) · light'],
  ['stats-607', 'Stats · 607 px (about the width of the artifact viewer) · light'],
];
const page = (title, cols) => `<!doctype html><html><body style="margin:0;background:#e9e6df;font:15px system-ui,sans-serif;color:#222">
<div style="padding:14px 18px 4px;font-weight:700;font-size:18px">${title}</div>
<div style="display:flex;gap:18px;padding:10px 18px 18px;align-items:flex-start">${cols.map((c) => `<figure style="margin:0"><figcaption style="padding:0 0 8px;font-weight:600">${c.label}</figcaption><img src="${c.src}" style="display:block;border:1px solid #999;${c.w ? `width:${c.w}px` : ''}"></figure>`).join('')}</div></body></html>`;
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 400, height: 300 } });
async function shoot(html, file) { await p.setContent(html); await p.waitForTimeout(100); await p.screenshot({ path: `${OUT}/${file}`, fullPage: true }); }
for (const [id, t] of PAIRS) {
  await shoot(page(t, [
    { label: `BEFORE · 9f566d7 · app innerWidth ${meta[`before-${id}`]}`, src: img(`before-${id}.png`) },
    { label: `AFTER · a6f75c0 · app innerWidth ${meta[`after-${id}`]}`, src: img(`after-${id}.png`) },
  ]), `${id}.png`);
}
// transition: nearest frame to each target time after the tap
const files = readdirSync(RAW);
const near = (who, t) => files.filter((f) => f.startsWith(`${who}-tx-`)).map((f) => ({ f, d: Number(f.slice(`${who}-tx-`.length, -4)) })).sort((a, b) => Math.abs(a.d - t) - Math.abs(b.d - t))[0];
for (const who of ['before', 'after']) {
  const cols = [0, 120, 170, 210, 250, 290, 350, 500].map((t) => { const n = near(who, t); return { label: `+${n.d} ms`, src: img(n.f), w: 190 }; });
  await shoot(page(`Today → Focus after tapping "Put the kettle on" · ${who === 'before' ? 'BEFORE · 9f566d7' : 'AFTER · a6f75c0'} · innerWidth ${meta[`${who}-transition`]} · light · WebGL off in both (static room image)`, cols), `transition-${who}.png`);
}
await b.close();
console.log('ok');
{
  const b2 = await chromium.launch(); const p2 = await b2.newPage({ viewport: { width: 400, height: 300 } });
  const nb = near('before', 180), na = near('after', 180);
  await p2.setContent(page(`Today → Focus, the same moment full size (390×844, light, WebGL off in both)`, [
    { label: `BEFORE · 9f566d7 · +${nb.d} ms after tap`, src: img(nb.f) },
    { label: `AFTER · a6f75c0 · +${na.d} ms after tap`, src: img(na.f) },
  ]));
  await p2.waitForTimeout(100); await p2.screenshot({ path: `${OUT}/transition-same-moment.png`, fullPage: true }); await b2.close();
}
