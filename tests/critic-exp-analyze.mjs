// Offline analysis of the recorder dump from critic-battle-exp.mjs.
//   node tests/critic-exp-analyze.mjs tests/shots/exp/rec-EXP-1.json
import { readFile } from 'node:fs/promises';
const f = process.argv[2] || 'tests/shots/exp/rec-EXP-1.json';
const { rec, marks, log } = JSON.parse(await readFile(f, 'utf8'));
const R = rec.filter((r) => !r.err);
const g0 = R[0].gt, w0 = R[0].w;
const G = (r) => +(r.gt - g0).toFixed(2);
const W = (r) => +((r.w - w0) / 1000).toFixed(2);

console.log(`samples=${R.length} gameclock=${G(R[R.length - 1])}s wall=${W(R[R.length - 1])}s`);
const fps = R.map((r) => r.fps).filter((x) => x > 0);
fps.sort((a, b) => a - b);
console.log(`fps median=${fps[fps.length >> 1]} min=${fps[0]} max=${fps[fps.length - 1]}`);
const dts = []; for (let i = 1; i < R.length; i++) dts.push(R[i].gt - R[i - 1].gt);
dts.sort((a, b) => a - b);
console.log(`game dt median=${(dts[dts.length >> 1] * 1000).toFixed(0)}ms max=${(dts[dts.length - 1] * 1000).toFixed(0)}ms  (clamped)`);

// ---- marks ---------------------------------------------------------------
console.log('\n--- marks (game seconds from first sample) ---');
let prev = null;
for (const m of marks) {
  const gt = +(m.gt - g0).toFixed(2);
  console.log(`  ${String(gt).padStart(7)}s  ${prev === null ? '     ' : ('+' + (gt - prev).toFixed(2)).padStart(7)}  ${m.ev}${m.t !== undefined ? ' t' + m.t : ''}${m.txt ? '  ' + JSON.stringify(m.txt) : ''}`);
  prev = gt;
}

// ---- camera shots --------------------------------------------------------
console.log('\n--- camera shot timeline (id/subject : game-seconds held) ---');
let s0 = R[0], key = (r) => `${r.shot}/${r.subj}`;
for (let i = 1; i <= R.length; i++) {
  if (i === R.length || key(R[i]) !== key(s0)) {
    const end = R[Math.min(i, R.length - 1)];
    const dur = +(end.gt - s0.gt).toFixed(2);
    const camMove = Math.hypot(end.cam[0] - s0.cam[0], end.cam[1] - s0.cam[1], end.cam[2] - s0.cam[2]).toFixed(2);
    if (dur > 0.01) console.log(`  ${String(G(s0)).padStart(7)}s  ${String(dur).padStart(6)}s  ${key(s0).padEnd(26)} camΔ=${camMove} fov=${s0.fov}->${end.fov}`);
    if (i < R.length) s0 = R[i];
  }
}

// ---- text ----------------------------------------------------------------
console.log('\n--- message timeline (typewriter / hold, game seconds) ---');
let c0 = null, tStart = 0, doneAt = null;
const rows = [];
for (let i = 0; i < R.length; i++) {
  const r = R[i];
  if (r.cur !== c0) {
    if (c0) rows.push({ txt: c0, start: tStart, type: doneAt === null ? null : +(doneAt - tStart).toFixed(2), hold: doneAt === null ? null : +(r.gt - doneAt).toFixed(2), total: +(r.gt - tStart).toFixed(2) });
    c0 = r.cur; tStart = r.gt; doneAt = null;
  }
  if (c0 && doneAt === null && r.txt.length >= c0.length && c0.length > 0) doneAt = r.gt;
}
if (c0) rows.push({ txt: c0, start: tStart, type: doneAt === null ? null : +(doneAt - tStart).toFixed(2), hold: doneAt === null ? null : +(R[R.length - 1].gt - doneAt).toFixed(2), total: +(R[R.length - 1].gt - tStart).toFixed(2) });
for (const r of rows) {
  if (!r.txt) continue;
  const cps = r.type > 0 ? (r.txt.length / r.type).toFixed(0) : '-';
  console.log(`  ${String(+(r.start - g0).toFixed(2)).padStart(7)}s type=${String(r.type).padStart(5)}s (${String(cps).padStart(3)} c/s) hold=${String(r.hold).padStart(5)}s total=${String(r.total).padStart(5)}s  ${JSON.stringify(r.txt).slice(0, 66)}`);
}
const holds = rows.filter((r) => r.txt && r.hold != null).map((r) => r.hold).sort((a, b) => a - b);
if (holds.length) console.log(`  holds: n=${holds.length} min=${holds[0]} median=${holds[holds.length >> 1]} max=${holds[holds.length - 1]}`);

// ---- HP bars -------------------------------------------------------------
console.log('\n--- HP bar drains (per plate) ---');
for (let p = 0; p < 2; p++) {
  let tgt = R[0].hp[p]?.[3];
  for (let i = 1; i < R.length; i++) {
    const a = R[i - 1].hp[p], b = R[i].hp[p];
    if (!a || !b) continue;
    if (Math.abs(b[3] - tgt) > 0.0005) {
      const from = a[2], to = b[3];
      // find settle
      let j = i, ghostSettle = null;
      for (; j < R.length; j++) { const c = R[j].hp[p]; if (!c || Math.abs(c[2] - c[3]) < 0.002) break; }
      for (let k = i; k < R.length; k++) { const c = R[k].hp[p]; if (!c) continue; if (Math.abs(c[4] - c[3]) < 0.004) { ghostSettle = R[k].gt; break; } }
      const settleGt = R[Math.min(j, R.length - 1)].gt;
      console.log(`  plate${p} ${String(G(R[i])).padStart(7)}s  ${(from * 100).toFixed(1)}% -> ${(to * 100).toFixed(1)}%  bar ${(settleGt - R[i].gt).toFixed(2)}s  ghost ${(ghostSettle != null ? (ghostSettle - R[i].gt).toFixed(2) : '—')}s  hp=${b[0]}/${b[1]}`);
      tgt = b[3];
      i = Math.max(i, j - 1);
    }
  }
}

// ---- hit feedback --------------------------------------------------------
console.log('\n--- hit feedback envelopes (shake/flash/zoom/hitstop) ---');
const hot = (r) => r.shake > 0.005 || r.flash > 0.02 || r.zoom > 0.005 || r.hits > 0 || r.chroma > 0.01;
let h0 = null, peak = null;
for (let i = 0; i < R.length; i++) {
  const r = R[i];
  if (hot(r) && !h0) { h0 = r; peak = { shake: 0, flash: 0, zoom: 0, hits: 0, chroma: 0, ts: 1 }; }
  if (h0) {
    peak.shake = Math.max(peak.shake, r.shake); peak.flash = Math.max(peak.flash, r.flash);
    peak.zoom = Math.max(peak.zoom, r.zoom); peak.hits = Math.max(peak.hits, r.hits);
    peak.chroma = Math.max(peak.chroma, r.chroma); peak.ts = Math.min(peak.ts, r.ts ?? 1);
    if (!hot(r)) {
      console.log(`  ${String(G(h0)).padStart(7)}s dur=${(r.gt - h0.gt).toFixed(2)}s  shake=${peak.shake.toFixed(3)} flash=${peak.flash.toFixed(3)} zoom=${peak.zoom.toFixed(3)} chroma=${peak.chroma.toFixed(3)} hitstop=${peak.hits}ms minTimeScale=${peak.ts}`);
      h0 = null;
    }
  }
}

// ---- vfx / actor motion --------------------------------------------------
console.log('\n--- vfx active windows ---');
let v0 = null, vmax = 0;
for (let i = 0; i < R.length; i++) {
  const r = R[i];
  if (r.vfx > 0 && !v0) { v0 = r; vmax = 0; }
  if (v0) { vmax = Math.max(vmax, r.vfx); if (r.vfx === 0) { console.log(`  ${String(G(v0)).padStart(7)}s dur=${(r.gt - v0.gt).toFixed(2)}s peakActive=${vmax}`); v0 = null; } }
}
console.log('\nlog:', JSON.stringify(log));
