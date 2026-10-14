// Lane I: compare base vs trial outputs of LI-audit.mjs.
//   node LI-compare.mjs <outRoot> <baseLabel> <trialLabel> <evDir>
import fs from 'node:fs';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { PNG } = require('playwright-core/lib/utilsBundle');
const [root, B, T, ev] = process.argv.slice(2);
fs.mkdirSync(ev, { recursive: true });
const lines = [];
const say = (s) => { lines.push(s); console.log(s); };

// ---- focus audits ----
const fj = fs.readdirSync(`${root}/${T}`).filter((f) => /^focus-.*\.json$/.test(f)).sort();
say('# Focus audit, base vs trial (stops, flagged, min ring contrast vs outside, min ring-pixel match)');
for (const f of fj) {
  const t = JSON.parse(fs.readFileSync(`${root}/${T}/${f}`));
  const b = fs.existsSync(`${root}/${B}/${f}`) ? JSON.parse(fs.readFileSync(`${root}/${B}/${f}`)) : null;
  const sum = (x) => {
    if (!x) return 'n/a';
    const r = x.rows;
    const flag = r.filter((q) => q.ringOn === 'NONE' || q.dis || (q.minMatch != null && q.minMatch < 0.5) || (q.minCrOut != null && q.minCrOut < 3) || q.clipBy);
    const crs = r.map((q) => q.minCrOut).filter((v) => v != null);
    return `${r.length} stops, ${flag.length} flagged, crOut min ${crs.length ? Math.min(...crs) : '-'} / median ${crs.length ? crs.sort((a, c) => a - c)[crs.length >> 1] : '-'}`;
  };
  say(`- ${f.replace(/\.json$/, '')}: BASE ${sum(b)} | TRIAL ${sum(t)}`);
  // per-control differences (by id, first occurrence)
  if (b) {
    const bm = new Map(); for (const q of b.rows) if (!bm.has(q.id)) bm.set(q.id, q);
    for (const q of t.rows) {
      const p = bm.get(q.id);
      const flagged = (z) => z && (z.ringOn === 'NONE' || z.dis || (z.minMatch != null && z.minMatch < 0.5) || (z.minCrOut != null && z.minCrOut < 3) || z.clipBy);
      const changed = p && (p.ringOn !== q.ringOn || p.oo !== q.oo || p.ow !== q.ow);
      if (flagged(q) || flagged(p) || changed) say(`    · ${q.id.slice(0, 60)} | base: ${p ? `${p.ringOn} w${p.ow} o${p.oo} match ${p.minMatch} crOut ${p.minCrOut} crIn ${p.minCrIn}${p.clipBy ? ' clip ' + p.clipBy : ''}${p.dis ? ' DIS' : ''}` : 'not a stop'} | trial: ${q.ringOn} w${q.ow} o${q.oo} match ${q.minMatch} crOut ${q.minCrOut} crIn ${q.minCrIn}${q.clipBy ? ' clip ' + q.clipBy : ''}${q.dis ? ' DIS' : ''}`);
    }
    // sizes at rest
    const bs = new Map(b.rects.map((r) => [r.key, r]));
    const diffs = t.rects.filter((r) => bs.has(r.key) && (Math.abs(bs.get(r.key).w - r.w) > 0.5 || Math.abs(bs.get(r.key).h - r.h) > 0.5));
    const only = t.rects.filter((r) => !bs.has(r.key)).length, gone = b.rects.filter((r) => !t.rects.some((x) => x.key === r.key)).length;
    say(`    sizes at rest: ${t.rects.length} controls, ${diffs.length} changed size${diffs.length ? ': ' + diffs.slice(0, 8).map((d) => `${d.key.slice(0, 40)} ${bs.get(d.key).w}×${bs.get(d.key).h}→${d.w}×${d.h}`).join('; ') : ''}; only-trial ${only}, only-base ${gone}`);
  }
}

// ---- states ----
say('\n# States (computed, trial vs base)');
for (const f of fs.readdirSync(`${root}/${T}`).filter((x) => /^states-.*\.json$/.test(x)).sort()) {
  const t = JSON.parse(fs.readFileSync(`${root}/${T}/${f}`));
  const b = fs.existsSync(`${root}/${B}/${f}`) ? JSON.parse(fs.readFileSync(`${root}/${B}/${f}`)) : [];
  say(`## ${f}`);
  for (const q of t) {
    const p = b.find((x) => x.what === q.what && x.state === q.state);
    say(`  ${q.what} ${q.state}: trial bg ${q.bg} op ${q.opacity} cur ${q.cursor} ${q.w.toFixed(1)}×${q.h.toFixed(1)} | base ${p ? `bg ${p.bg} op ${p.opacity} cur ${p.cursor} ${p.w.toFixed(1)}×${p.h.toFixed(1)}` : 'n/a'}`);
  }
}

// ---- Settings full pages: BEFORE | AFTER side by side, sliced at full size ----
say('\n# Settings top to bottom (full page), BEFORE | AFTER');
const sdir = `${root}/${T}/settings`;
if (fs.existsSync(sdir)) {
  fs.mkdirSync(`${ev}/before-after`, { recursive: true });
  for (const f of fs.readdirSync(sdir).filter((x) => x.endsWith('.png')).sort()) {
    const a = PNG.sync.read(fs.readFileSync(`${root}/${B}/settings/${f}`));
    const t = PNG.sync.read(fs.readFileSync(`${sdir}/${f}`));
    const W = a.width + t.width + 12, H = Math.max(a.height, t.height);
    const d = new PNG({ width: W, height: H }); d.data.fill(255);
    for (let i = 0; i < d.data.length; i += 4) { d.data[i] = 255; d.data[i + 1] = 0; d.data[i + 2] = 255; }
    PNG.bitblt(a, d, 0, 0, a.width, a.height, 0, 0);
    PNG.bitblt(t, d, 0, 0, t.width, t.height, a.width + 12, 0);
    // first differing row (same width only)
    let first = -1;
    if (a.width === t.width) for (let y = 0; y < Math.min(a.height, t.height) && first < 0; y++) { const o = y * a.width * 4; if (Buffer.compare(a.data.subarray(o, o + a.width * 4), t.data.subarray(o, o + a.width * 4)) !== 0) first = y; }
    const sliceH = f.includes('1440') ? 900 : f.includes('844x390') ? 780 : 1100;
    const name = f.replace('.png', '');
    let n = 0;
    for (let y = 0; y < H; y += sliceH) {
      const h = Math.min(sliceH, H - y);
      const s = new PNG({ width: W, height: h });
      PNG.bitblt(d, s, 0, y, W, h, 0, 0);
      fs.writeFileSync(`${ev}/before-after/${name}-part${String(n).padStart(2, '0')}.png`, PNG.sync.write(s));
      n++;
    }
    say(`- ${name}: BEFORE ${a.width}×${a.height} → AFTER ${t.width}×${t.height} (Δh ${t.height - a.height}); first differing row ${first}; ${n} slices of ${sliceH}px in before-after/`);
  }
}
fs.writeFileSync(`${ev}/LI-compare.txt`, lines.join('\n') + '\n');
