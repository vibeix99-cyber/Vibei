// Does every fighter sound like itself?
//
//   node tools/crycheck.mjs [--port 8814] [--list] [--pairs 12]
//
// 32 fighters share one synthesiser, so the failure mode is not a bad cry, it
// is 32 slight variations on one grunt. This renders every cry offline and
// measures how far each one sits from its nearest neighbour, using the same
// fingerprint the audio critic uses: 6 time slices x 14 log bands, z-normalised
// so it compares shape rather than loudness, and cosine distance between those.
//
// The thresholds are not arbitrary. 0.03 is roughly the distance between a
// normal hit and a critical hit of the same move — two sounds a player hears as
// the same event. A pair closer than that is a collision. 0.05 is the working
// target: far enough apart to read as two different characters.
//
// This measurement was ad-hoc for three passes and had to be rebuilt from
// scratch to check the fourth, so it lives here now.

import { chromium } from 'playwright';
import { spawn } from 'node:child_process';

const arg = (k, d) => { const i = process.argv.indexOf(`--${k}`); return i >= 0 ? process.argv[i + 1] : d; };
const PORT = Number(arg('port', 8814));
const SHOW_PAIRS = Number(arg('pairs', 10));
const LIST = process.argv.includes('--list');

const server = spawn(process.execPath, ['tools/serve.mjs', String(PORT)], { stdio: ['ignore', 'pipe', 'pipe'] });
await new Promise((r) => server.stdout.on('data', (d) => String(d).includes('serving') && r()));
const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const page = await browser.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
await page.goto(`http://127.0.0.1:${PORT}/index.html`, { waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => window.__ARENA?.version, null, { timeout: 30000 });
await page.evaluate(() => window.__ARENA.ready);

const data = await page.evaluate(async () => {
  const lab = await import('/tests/critic/audiolab.js');
  // `data.fighters` is an array, so Object.keys gives indices, not ids.
  const F = window.__ARENA.data.fighters;
  const defs = (Array.isArray(F) ? F : Object.values(F)).filter((f) => f?.cry);
  const ids = defs.map((f) => f.id);

  const prints = [], meta = [];
  for (const id of ids) {
    const buf = await lab.AudioClass.renderOffline({ kind: 'cry', fighterId: id, seconds: 2.6, sampleRate: 48000 });
    prints.push(lab.fingerprint(buf));
    const f = defs[ids.indexOf(id)];
    meta.push({
      id, name: f.name || id,
      shape: f.cry.shape ?? 'roar', root: f.cry.root ?? 220,
      len: f.cry.len ?? 0.5, artic: f.cry.artic ?? null
    });
  }

  const n = ids.length;
  const pairs = [];
  const nearest = ids.map(() => ({ d: Infinity, j: -1 }));
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const d = lab.cosDist(prints[i], prints[j]);
      pairs.push({ i, j, d });
      if (d < nearest[i].d) nearest[i] = { d, j };
      if (d < nearest[j].d) nearest[j] = { d, j: i };
    }
  }
  return { meta, pairs, nearest };
});

await browser.close();
server.kill();

const { meta, pairs, nearest } = data;
const n = meta.length;
const ds = pairs.map((p) => p.d).sort((a, b) => a - b);
const median = ds[Math.floor(ds.length / 2)];
pairs.sort((a, b) => a.d - b.d);

// A fighter is a near-twin if *its own nearest neighbour* is inside the
// threshold — the honest per-character question ("does this one sound like
// somebody else?"), not a count of pairs, which double-counts a bad cluster.
const twins03 = nearest.filter((x) => x.d < 0.03).length;
const twins05 = nearest.filter((x) => x.d < 0.05).length;
const nm = (i) => meta[i].name;
const tag = (i) => `${meta[i].shape}${meta[i].artic ? '/' + meta[i].artic : ''}@${Math.round(meta[i].root)}`;

console.log(`\n════ CRIES — ${n} fighters, ${pairs.length} pairs ════\n`);
console.log(`  median pairwise distance   ${median.toFixed(4)}`);
console.log(`  closest pair               ${pairs[0].d.toFixed(4)}  ${nm(pairs[0].i)} / ${nm(pairs[0].j)}`);
console.log(`  near-twins under 0.03      ${twins03}/${n}`);
console.log(`  near-twins under 0.05      ${twins05}/${n}`);

console.log(`\n  closest ${SHOW_PAIRS} pairs:`);
for (const p of pairs.slice(0, SHOW_PAIRS)) {
  console.log(`    ${p.d.toFixed(4)}  ${nm(p.i).padEnd(14)} ${tag(p.i).padEnd(20)} / ${nm(p.j).padEnd(14)} ${tag(p.j)}`);
}

if (LIST) {
  console.log(`\n  every fighter, by distance to its nearest neighbour:`);
  const order = meta.map((m, i) => i).sort((a, b) => nearest[a].d - nearest[b].d);
  for (const i of order) {
    console.log(`    ${nearest[i].d.toFixed(4)}  ${nm(i).padEnd(14)} ${tag(i).padEnd(22)} nearest: ${nm(nearest[i].j)}`);
  }
}

const bad = [];
if (twins03 > 0) bad.push(`${twins03} fighter(s) inside 0.03 of another — that is a collision, not a resemblance`);
if (twins05 > 0) bad.push(`${twins05} fighter(s) inside 0.05 of another`);
if (errors.length) bad.push(`page errors: ${errors[0]}`);

console.log('');
if (bad.length) { for (const b of bad) console.log(`  ✗ ${b}`); console.log(`\n❌ ${bad.length} problem(s)`); }
else console.log(`✅ every cry is at least 0.05 from every other`);
process.exit(bad.length ? 1 : 0);
