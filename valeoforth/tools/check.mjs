// Static checks on dist/: links, anchors, images, headings, privacy rules, and colour contrast of the design tokens.
import fs from 'node:fs'; import path from 'node:path';
const DIST = path.resolve('dist'); let fail = 0;
const bad = (m) => { fail++; console.error('✗', m); }; const ok = (m) => console.log('✓', m);
const pages = []; (function walk(d) { for (const f of fs.readdirSync(d)) { const p = path.join(d, f); fs.statSync(p).isDirectory() ? walk(p) : p.endsWith('.html') && pages.push(p); } })(DIST);
const idsOf = (html) => new Set([...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]));
let links = 0;
for (const file of pages) {
  const html = fs.readFileSync(file, 'utf8'); const rel = path.relative(DIST, file);
  if (!/<html lang="en">/.test(html)) bad(`${rel}: missing lang`);
  if (!/<title>[^<]{3,}<\/title>/.test(html)) bad(`${rel}: missing title`);
  if (!/<meta name="description"/.test(html)) bad(`${rel}: missing description`);
  if ((html.match(/<h1[\s>]/g) || []).length !== 1) bad(`${rel}: expected exactly one h1`);
  if (!/<main id="main"/.test(html)) bad(`${rel}: missing main landmark`);
  for (const m of html.matchAll(/<img\b[^>]*>/g)) {
    if (!/\balt="/.test(m[0])) bad(`${rel}: img without alt: ${m[0].slice(0, 80)}`);
    if (!/\bwidth="\d+"/.test(m[0]) || !/\bheight="\d+"/.test(m[0])) bad(`${rel}: img without dimensions: ${m[0].slice(0, 80)}`);
  }
  if (/claude\.ai|artifact/i.test(html.replace(/<script[\s\S]*?<\/script>/g, ''))) bad(`${rel}: mentions claude.ai/artifact (private link must not be published)`);
  for (const m of html.matchAll(/\b(?:href|src|srcset)="([^"]+)"/g)) {
    for (const raw of m[0].startsWith('srcset') ? m[1].split(',').map((s) => s.trim().split(/\s+/)[0]) : [m[1]]) {
      if (/^(mailto:|tel:|data:)/.test(raw)) continue;
      if (/^https?:\/\//.test(raw)) { bad(`${rel}: external URL ${raw}`); continue; }
      links++;
      const [u, hash] = raw.split('#'); const clean = u.split('?')[0];
      let target = clean === '' ? file : path.resolve(path.dirname(file), clean);
      if (clean !== '' && (clean.endsWith('/') || !path.extname(clean))) target = path.join(target, 'index.html');
      if (!fs.existsSync(target)) { bad(`${rel}: broken link ${raw}`); continue; }
      if (hash && target.endsWith('.html') && !idsOf(fs.readFileSync(target, 'utf8')).has(hash)) bad(`${rel}: missing anchor #${hash} in ${path.relative(DIST, target)}`);
    }
  }
}
ok(`${pages.length} pages, ${links} internal references resolved`);

// contrast
const lum = (h) => { const c = [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4)); return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]; };
const cr = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
const pairs = [
  ['hall text', '#f6ecdc', '#14111c', 4.5], ['hall text-2', '#cfc4b5', '#14111c', 4.5], ['hall text-3', '#a79cab', '#14111c', 4.5], ['hall accent', '#ffd9a0', '#14111c', 4.5],
  ['hall button', '#1c1206', '#ffb45c', 4.5], ['plate text', '#2a1a08', '#c9995a', 4.5],
  ['room text', '#2a1d14', '#fbf3e6', 4.5], ['room text-2', '#55402f', '#fbf3e6', 4.5], ['room text-3', '#75604d', '#fbf3e6', 4.5], ['room accent', '#b23a12', '#fbf3e6', 4.5],
  ['room text on tint', '#55402f', '#f5e8d2', 4.5], ['room text-3 on tint', '#75604d', '#f5e8d2', 4.5], ['room accent on tint', '#b23a12', '#f5e8d2', 4.5],
  ['room button', '#ffffff', '#b23a12', 4.5], ['night text', '#f7ecdc', '#241a2d', 4.5], ['night text-2', '#d6c9bb', '#241a2d', 4.5], ['night text-3', '#b4a6b3', '#241a2d', 4.5], ['night accent', '#ffcf8a', '#241a2d', 4.5],
  ['chip active (night)', '#1c1206', '#ffd9a0', 4.5], ['tab active', '#fbf3e6', '#2a1d14', 4.5],
];
for (const [n, f, b, min] of pairs) { const r = cr(f, b); (r >= min ? ok : bad)(`contrast ${n}: ${r.toFixed(2)}:1 (need ${min})`); }
if (fail) { console.error(`\n${fail} problem(s)`); process.exit(1); } else console.log('\nall checks passed');
