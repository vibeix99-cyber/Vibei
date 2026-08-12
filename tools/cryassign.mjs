// Which articulation should each fighter get?
//
//   node tools/cryassign.mjs [--port 8823] [--restarts 40] [--apply]
//
// There are 11 articulations and 32 fighters, and the thing being optimised —
// the *minimum* distance between any fighter and its nearest neighbour — is not
// something you can reason your way to one fighter at a time. Hand-assigning
// them by family and by ear-plausible character fit got the worst pair from
// 0.0141 to 0.0173 and then started going backwards: fixing Katakuri/Smoker
// pushed Ichigo/Edward closer, because every change moves one point against all
// 31 others at once.
//
// So: render all 32 x 11 combinations, fingerprint every one, and hill-climb
// the assignment against the real measured distances. `--apply` writes the
// result straight into src/data/fighters.js.
//
// This is an offline optimiser, not a gate. `tools/crycheck.mjs` is the gate.

import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';

const arg = (k, d) => { const i = process.argv.indexOf(`--${k}`); return i >= 0 ? process.argv[i + 1] : d; };
const PORT = Number(arg('port', 8823));
const RESTARTS = Number(arg('restarts', 40));
const APPLY = process.argv.includes('--apply');

const server = spawn(process.execPath, ['tools/serve.mjs', String(PORT)], { stdio: ['ignore', 'pipe', 'pipe'] });
await new Promise((r) => server.stdout.on('data', (d) => String(d).includes('serving') && r()));
const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const page = await browser.newPage();
page.on('pageerror', (e) => { console.error('PAGE ERROR', e.message); });
await page.goto(`http://127.0.0.1:${PORT}/index.html`, { waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => window.__ARENA?.version, null, { timeout: 30000 });
await page.evaluate(() => window.__ARENA.ready);

console.log('rendering every fighter under every articulation…');
const { meta, artics, fps } = await page.evaluate(async () => {
  const lab = await import('/tests/critic/audiolab.js');
  const A = await import('/src/audio/audio.js');
  const artics = Object.keys(A.ARTICULATIONS);
  const F = window.__ARENA.data.fighters;
  const defs = (Array.isArray(F) ? F : Object.values(F)).filter((f) => f?.cry);

  const meta = [], fps = [];
  for (const f of defs) {
    meta.push({ id: f.id, name: f.name || f.id, shape: f.cry.shape ?? 'roar', root: f.cry.root ?? 220, len: f.cry.len ?? 0.5 });
    const row = [];
    for (const a of artics) {
      // Through the full `cry()` path, identical to what tools/crycheck.mjs
      // gates on. Scoring the bare buffer instead is not close enough: it skips
      // the reverb send, and an assignment that measured 0.0595 on the raw
      // buffer came back at 0.0346 through the real path, with six fighters
      // inside the threshold the optimiser thought it had cleared.
      const buf = await lab.AudioClass.renderOffline({
        kind: 'cry', fighterId: f.id, artic: a, seconds: 2.6, sampleRate: 48000
      });
      row.push(lab.fingerprint(buf));
    }
    fps.push(row);
  }
  return { meta, artics, fps };
});

// distance between fighter i under articulation a and fighter j under b
const cos = (x, y) => {
  let d = 0, na = 0, nb = 0;
  for (let i = 0; i < x.length; i++) { d += x[i] * y[i]; na += x[i] * x[i]; nb += y[i] * y[i]; }
  return 1 - d / (Math.sqrt(na * nb) + 1e-12);
};
const N = meta.length, M = artics.length;
console.log(`  ${N} fighters x ${M} articulations, precomputing ${(N * (N - 1) / 2) * M * M} distances…`);
// D[i][j][a][b]
const D = Array.from({ length: N }, () => Array.from({ length: N }, () => null));
for (let i = 0; i < N; i++) {
  for (let j = i + 1; j < N; j++) {
    const m = Array.from({ length: M }, () => new Float64Array(M));
    for (let a = 0; a < M; a++) for (let b = 0; b < M; b++) m[a][b] = cos(fps[i][a], fps[j][b]);
    D[i][j] = m; D[j][i] = m;                 // note: D[j][i] is indexed [a of j][b of i]
  }
}
const dist = (i, j, ai, aj) => (i < j ? D[i][j][ai][aj] : D[j][i][aj][ai]);

/** Worst nearest-neighbour distance, and the sum of the 6 worst — the tiebreak. */
function score(asg) {
  const near = new Float64Array(N).fill(Infinity);
  for (let i = 0; i < N; i++) {
    for (let j = i + 1; j < N; j++) {
      const d = dist(i, j, asg[i], asg[j]);
      if (d < near[i]) near[i] = d;
      if (d < near[j]) near[j] = d;
    }
  }
  const sorted = [...near].sort((a, b) => a - b);
  return { min: sorted[0], tail: sorted.slice(0, 6).reduce((s, x) => s + x, 0), near };
}

/**
 * Articulations chosen for the character rather than for the metric, which the
 * optimiser is not allowed to move. Left free, it produced a roster that scored
 * beautifully and had thrown away every joke in it — Zoro on `double` when he
 * fights with three swords, Big Mom on `stutter` when the whole point of her is
 * that she shouts "MA-MA". There was 0.1159 of headroom against a 0.05 target,
 * which is plenty to spend some of on the characters actually sounding like
 * themselves.
 */
const PINS = {
  zoro: 'triplet',              // three-sword style
  bigmom: 'two-syllable',       // MA-MA
  brook: 'three-syllable',      // yo-ho-ho
  franky: 'stutter',            // cyborg, re-attacks
  saitama: 'gap',               // one punch, then nothing
  ace: 'swell',                 // fire builds before it lands
  ichigo_bankai: 'swell',       // bankai winds up
  doflamingo: 'two-syllable',   // the laugh
  kaido: 'late-gap'             // the deepest thing in the game
};
const pinned = new Int8Array(N).fill(-1);
for (let i = 0; i < N; i++) {
  const p = PINS[meta[i].id];
  if (p === undefined) continue;
  const a = artics.indexOf(p);
  if (a < 0) { console.error(`unknown articulation pinned for ${meta[i].id}: ${p}`); process.exit(1); }
  pinned[i] = a;
}
console.log(`  ${[...pinned].filter((x) => x >= 0).length} pinned for character, ${[...pinned].filter((x) => x < 0).length} free\n`);

let best = null;
let rng = 20260812;
const rand = () => ((rng = (rng * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);
for (let r = 0; r < RESTARTS; r++) {
  const asg = Array.from({ length: N }, (_, i) => (pinned[i] >= 0 ? pinned[i] : Math.floor(rand() * M)));
  let cur = score(asg);
  for (let pass = 0; pass < 400; pass++) {
    // move the worst-off fighter that is free to move
    let worst = -1;
    for (let i = 0; i < N; i++) {
      if (pinned[i] >= 0) continue;
      if (worst < 0 || cur.near[i] < cur.near[worst]) worst = i;
    }
    if (worst < 0) break;
    let bestA = asg[worst], bestS = cur;
    for (let a = 0; a < M; a++) {
      if (a === asg[worst]) continue;
      const old = asg[worst]; asg[worst] = a;
      const s = score(asg);
      asg[worst] = old;
      if (s.min > bestS.min + 1e-12 || (Math.abs(s.min - bestS.min) < 1e-12 && s.tail > bestS.tail + 1e-12)) { bestA = a; bestS = s; }
    }
    if (bestA === asg[worst]) break;                 // local optimum
    asg[worst] = bestA; cur = bestS;
  }
  if (!best || cur.min > best.s.min || (cur.min === best.s.min && cur.tail > best.s.tail)) {
    best = { asg: [...asg], s: cur };
    console.log(`  restart ${String(r).padStart(3)}  min ${cur.min.toFixed(4)}  tail6 ${cur.tail.toFixed(4)}`);
  }
}

await browser.close();
server.kill();

const { asg, s } = best;
console.log(`\n════ BEST ASSIGNMENT ════\n`);
console.log(`  worst nearest-neighbour distance  ${s.min.toFixed(4)}`);
console.log(`  fighters inside 0.05              ${[...s.near].filter((x) => x < 0.05).length}/${N}`);
console.log(`  fighters inside 0.03              ${[...s.near].filter((x) => x < 0.03).length}/${N}\n`);
const order = meta.map((m, i) => i).sort((a, b) => s.near[a] - s.near[b]);
for (const i of order) {
  console.log(`  ${s.near[i].toFixed(4)}  ${meta[i].name.padEnd(12)} ${meta[i].shape}@${String(meta[i].root).padEnd(4)} -> ${artics[asg[i]]}`);
}

// emit the table, grouped the way fighters.js is keyed
const byShape = {};
for (let i = 0; i < N; i++) (byShape[meta[i].shape] ||= {})[meta[i].root] = artics[asg[i]];
console.log(`\nconst A = ${JSON.stringify(byShape, null, 2)};`);

if (APPLY) {
  const P = 'src/data/fighters.js';
  let src = readFileSync(P, 'utf8');
  let n = 0;
  src = src.replace(/cry: \{ root: (\d+), shape: '(\w+)', len: ([\d.]+)(?:, artic: '[\w-]+')? \}/g, (m, root, shape, len) => {
    const a = byShape[shape]?.[root];
    if (!a) { console.error('NO MAPPING', shape, root); process.exit(1); }
    n++;
    return a === 'plain'
      ? `cry: { root: ${root}, shape: '${shape}', len: ${len} }`
      : `cry: { root: ${root}, shape: '${shape}', len: ${len}, artic: '${a}' }`;
  });
  writeFileSync(P, src);
  console.log(`\napplied to ${P} (${n} cry blocks)`);
}
