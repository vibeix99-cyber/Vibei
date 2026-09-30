// Build review boards at realistic viewing sizes. usage: node board.mjs <specs.json> [name-filter]  (a spec or an array of specs)
// spec: { out, title, note?, colW, cols, dpr?, cells: [{ file, label, kind?: 'current'|'proposed' } | { head }] }  (files relative to ..)
// Phone frames are placed at 390 CSS px (dpr 2 = what a phone shows); desktop frames at 1440 CSS px (dpr 1).
import { chromium } from 'playwright';
import { readFileSync } from 'node:fs';
const SPECS = [JSON.parse(readFileSync(process.argv[2], 'utf8'))].flat().filter((x) => x.out.includes(process.argv[3] ?? ''));
const root = new URL('../', import.meta.url).pathname;
const b = await chromium.launch();
for (const S of SPECS) {
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
const cells = S.cells
  .map((c) =>
    c.head
      ? `<div style="grid-column:1/-1;font:800 18px system-ui;color:#3b2a20;padding:14px 0 0">${esc(c.head)}</div>`
      : `<figure style="margin:0"><figcaption style="font:700 14px system-ui;color:#3b2a20;padding:0 0 6px;display:flex;gap:8px;align-items:center">${c.kind ? `<span style="font:800 11px system-ui;letter-spacing:.06em;padding:3px 8px;border-radius:99px;color:#fff;background:${c.kind === 'current' ? '#6b5a4c' : '#d9582b'}">${c.kind === 'current' ? 'CURRENT APP' : 'PROPOSED MOCKUP'}</span>` : ''}${esc(c.label ?? '')}</figcaption><img style="width:${S.colW}px;display:block;border-radius:${S.colW < 600 ? 22 : 10}px;box-shadow:0 0 0 1px rgba(0,0,0,.18)" src="data:image/png;base64,${readFileSync(root + c.file).toString('base64')}"></figure>`,
  )
  .join('');
const width = S.cols * S.colW + (S.cols - 1) * 24 + 64;
const p = await b.newPage({ viewport: { width, height: 400 }, deviceScaleFactor: S.dpr ?? 2 });
await p.setContent(`<body style="margin:0;background:#efe6da"><div style="padding:24px 32px 32px"><div style="font:800 24px system-ui;color:#2a1d16">${esc(S.title)}</div>${S.note ? `<div style="font:500 15px system-ui;color:#5a4636;margin-top:6px;max-width:${width - 64}px;line-height:1.45">${esc(S.note)}</div>` : ''}<div style="display:grid;grid-template-columns:repeat(${S.cols},${S.colW}px);gap:18px 24px;margin-top:18px;align-items:start">${cells}</div></div></body>`);
await p.waitForTimeout(300);
await p.screenshot({ path: root + S.out, fullPage: true });
await p.close();
console.log('wrote', S.out);
}
await b.close();
