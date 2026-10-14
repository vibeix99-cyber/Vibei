// sumsep.mjs <sepDir> <rawDir> : markdown tables from lr.mjs output (BASE vs TRIAL) and the day raw-buffer diff
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
const [dir, raw] = process.argv.slice(2);
const load = (side) => {
  const runs = {};
  for (const f of existsSync(`${dir}/${side}`) ? readdirSync(`${dir}/${side}`).filter((f) => /^lr-.*\.json$/.test(f)) : []) {
    const j = JSON.parse(readFileSync(`${dir}/${side}/${f}`, 'utf8'));
    for (const r of j.runs) { const prev = runs[r.name]; runs[r.name] = { ...r, file: f, frames: { ...(prev?.frames ?? {}), ...r.frames }, errors: [...(prev?.errors ?? []), ...r.errors] }; }
  }
  return runs;
};
const B = load('BASE'), T = load('TRIAL');
const realErr = (e) => !/GPU stall due to ReadPixels/.test(e) && !/closed/.test(e); // my own readPixels performance warnings, and the job I killed
const f2 = (v, d = 2) => (v == null ? '–' : (+v).toFixed(d));
const names = [...new Set([...Object.keys(B), ...Object.keys(T)])].sort();
const TIMES = ['day', 'dusk', 'night'];
const cell = (m, k, ring = 'ringHalf') => (m ? `${f2(m[k][ring].CR)} / ${f2(m[k][ring].dL, 1)}` : '–');
console.log('Contrast ratio (WCAG, median Y of the fur ring + .05) / (median Y of the feature + .05)  /  ΔL* (median L* ring − feature). Ring = fur within ½ feature diameter (1 px gap); "full" ring = 1 diameter.\n');
console.log('| config | view | hour | eyes BASE | eyes TRIAL | nose BASE | nose TRIAL | eyes full-ring BASE → TRIAL | nose full-ring BASE → TRIAL | fur ring L* (eyes) BASE → TRIAL | fur ring mean colour BASE → TRIAL | fill BASE → TRIAL | eye px / nose px (BASE, TRIAL) | components eyes/nose (B, T) | page errors / console errors B/T (excl. the Chrome GPU-stall-on-ReadPixels perf warnings caused by my readPixels) |');
console.log('|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|');
for (const n of names) for (const view of ['close', 'nook']) for (const t of TIMES) {
  const b = B[n]?.frames?.[`${view}-${t}`], tr = T[n]?.frames?.[`${view}-${t}`];
  if (!b && !tr) continue;
  const comp = (m) => (m ? `${m.eyes.components.length}/${m.nose.components.length}` : '–');
  console.log(`| ${n} | ${view} | ${t} | ${cell(b, 'eyes')} | ${cell(tr, 'eyes')} | ${cell(b, 'nose')} | ${cell(tr, 'nose')} | ${cell(b, 'eyes', 'ringFull')} → ${cell(tr, 'eyes', 'ringFull')} | ${cell(b, 'nose', 'ringFull')} → ${cell(tr, 'nose', 'ringFull')} | ${b ? f2(b.eyes.ringHalf.Lmed, 1) : '–'} → ${tr ? f2(tr.eyes.ringHalf.Lmed, 1) : '–'} | ${b?.eyes.ringHalf.meanHex ?? '–'} → ${tr?.eyes.ringHalf.meanHex ?? '–'} | ${b?.fillNow ?? '–'} → ${tr?.fillNow ?? '–'} | ${b ? b.eyes.feature.n + '/' + b.nose.feature.n : '–'}, ${tr ? tr.eyes.feature.n + '/' + tr.nose.feature.n : '–'} | ${comp(b)}, ${comp(tr)} | ${(B[n] ? B[n].errors.filter(realErr).length : '–')}/${(T[n] ? T[n].errors.filter(realErr).length : '–')} |`);
}
console.log('\nSeparation as a share of the same build\'s DAY value (close view, half ring; eyes CR / nose CR):\n');
console.log('| config | hour | BASE eyes % of day | TRIAL eyes % of day | BASE nose % of day | TRIAL nose % of day |');
console.log('|---|---|---|---|---|---|');
for (const n of names) for (const view of ['close']) for (const t of ['dusk', 'night']) {
  const g = (R, k, time) => R[n]?.frames?.[`${view}-${time}`]?.[k].ringHalf.CR;
  const pc = (R, k) => (g(R, k, t) && g(R, k, 'day') ? (100 * g(R, k, t) / g(R, k, 'day')).toFixed(0) + '%' : '–');
  console.log(`| ${n} | ${t} | ${pc(B, 'eyes')} | ${pc(T, 'eyes')} | ${pc(B, 'nose')} | ${pc(T, 'nose')} |`);
}
console.log('\nDay pixel diff, BASE vs TRIAL, drawing buffer (gl.readPixels, RGBA, every pixel and channel), loop stopped, reducedMotion still frame:\n');
console.log('| config | view | buffer | differing pixels | max channel diff | diff bbox (x0,y0,x1,y1) | inside Chai silhouette box | Chai box (BASE) | FNV BASE | FNV TRIAL |');
console.log('|---|---|---|---|---|---|---|---|---|---|');
for (const n of names) for (const view of ['close', 'nook']) {
  const pb = `${raw}/BASE/${n}-${view}-day.rgba.gz`, pt = `${raw}/TRIAL/${n}-${view}-day.rgba.gz`;
  const fb = B[n]?.frames?.[`${view}-day`], ft = T[n]?.frames?.[`${view}-day`];
  if (!existsSync(pb) || !existsSync(pt) || !fb) continue;
  const [W, H] = fb.buffer;
  const r = JSON.parse(execFileSync('node', [new URL('./cmpraw.mjs', import.meta.url).pathname, pb, pt, W, H, JSON.stringify(fb.chaiBox)], { maxBuffer: 1 << 26 }).toString());
  console.log(`| ${n} | ${view} | ${W}×${H} | ${r.differing ?? 'size differs'} | ${r.maxChannel ?? '–'} | ${r.bbox ? r.bbox.join(',') : '–'} | ${r.insideChaiBox ?? '–'} | ${fb.chaiBox ? [fb.chaiBox.x0, fb.chaiBox.y0, fb.chaiBox.x1, fb.chaiBox.y1].join(',') : '–'} | ${fb.fnv} | ${ft?.fnv} |`);
  if (r.differing) console.log(`|  | clusters | | ${JSON.stringify(r.clusters).slice(0, 400)} | | | | | | |`);
}
