// W3R1 · N: tables from sep.mjs output (BEFORE vs AFTER) + the day pixel-compare of the raw drawing buffers.
//   node sum.mjs <measureDir> <rawDir> > summary.md
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
const [dir, raw] = process.argv.slice(2);
const load = (side) => {
  const runs = {};
  if (!existsSync(`${dir}/${side}`)) return runs;
  for (const f of readdirSync(`${dir}/${side}`).filter((f) => /^sep-.*\.json$/.test(f))) {
    const j = JSON.parse(readFileSync(`${dir}/${side}/${f}`, 'utf8'));
    for (const r of j.runs) runs[r.name] = r;
  }
  return runs;
};
const B = load('BEFORE'), A = load('AFTER');
const names = [...new Set([...Object.keys(B), ...Object.keys(A)])].sort((x, y) => {
  const o = (n) => ['day', 'dusk', 'night'].findIndex((t) => n.endsWith('-' + t));
  return x.replace(/-(day|dusk|night)$/, '').localeCompare(y.replace(/-(day|dusk|night)$/, '')) || o(x) - o(y);
});
const f = (v, d = 2) => (v == null ? '–' : (+v).toFixed(d));
const row = (n, view) => {
  const b = B[n]?.[view], a = A[n]?.[view];
  if (!b && !a) return null;
  const cell = (m, k) => (m ? `${f(m[k].contrast)} / ${f(m[k].dL, 1)}` : '–');
  const ring = (m) => (m ? `${f(m.eyes.ring.L, 1)} (${m.eyes.ring.meanHex})` : '–');
  const ok = (m) => (m ? `${m.quality} ${m.chaiKind}` : '–');
  const err = [...(B[n]?.errors ?? []), ...(A[n]?.errors ?? [])].length;
  return `| ${n} | ${view} | ${cell(b, 'eyes')} | ${cell(a, 'eyes')} | ${cell(b, 'nose')} | ${cell(a, 'nose')} | ${ring(b)} → ${ring(a)} | ${ok(b)} / ${ok(a)} | ${err} |`;
};
console.log('Separation = WCAG contrast ratio (Y_fur_ring + 0.05) / (Y_feature + 0.05) / ΔL* (CIE L*, fur ring − feature), medians over the region. Eyes = `eyes_open`, nose = the body\'s `chai_gloss` primitive, ring = face fur within ½ a feature diameter (1 px gap), all eroded 1 px. Measured from the engine\'s drawing buffer (gl.readPixels) with an id frame for the masks.\n');
console.log('| config | view | eyes BEFORE (CR / ΔL*) | eyes AFTER | nose BEFORE | nose AFTER | fur ring L* (mean colour) BEFORE → AFTER | tier / Chai (B / A) | errors |');
console.log('|---|---|---|---|---|---|---|---|---|');
for (const n of names) for (const v of ['close', 'nook']) { const r = row(n, v); if (r) console.log(r); }

// day pixel-compare: the normal frame's raw RGBA, BEFORE vs AFTER, per config and view
console.log('\nDay pixel-compare (drawing buffer, full frame, BEFORE `4d36939` :5478 vs AFTER :5504):\n');
console.log('| config | view | size | FNV BEFORE | FNV AFTER | differing pixels | max channel diff |');
console.log('|---|---|---|---|---|---|---|');
const dayNames = [...new Set([...names, ...(existsSync(`${raw}/AFTER`) ? readdirSync(`${raw}/AFTER`).map((f) => f.replace(/-(close|nook)\.rgba\.gz$/, '')) : [])])].filter((n) => n.endsWith('-day')).sort();
for (const n of dayNames) for (const v of ['close', 'nook']) {
  const pb = `${raw}/BEFORE/${n}-${v}.rgba.gz`, pa = `${raw}/AFTER/${n}-${v}.rgba.gz`;
  if (!existsSync(pb) || !existsSync(pa)) continue;
  const b = gunzipSync(readFileSync(pb)), a = gunzipSync(readFileSync(pa));
  let diff = 0, max = 0;
  if (b.length === a.length) for (let i = 0; i < b.length; i += 4) {
    let d = 0;
    for (let c = 0; c < 4; c++) d = Math.max(d, Math.abs(b[i + c] - a[i + c]));
    if (d) diff++;
    max = Math.max(max, d);
  }
  const size = B[n]?.[v]?.buffer.join('×') ?? '?';
  console.log(`| ${n} | ${v} | ${size} | ${B[n]?.[v]?.fnv ?? '–'} | ${A[n]?.[v]?.fnv ?? '(raw only)'} | ${b.length === a.length ? diff : 'size differs'} | ${max} |`);
}
