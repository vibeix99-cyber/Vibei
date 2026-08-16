// AI round-robin. Runs headless *inside the page* against window.__ARENA.sim,
// so it exercises exactly the code the game ships.
//
//   node tools/aiarena.mjs                          # full matrix, 200 games/pair
//   node tools/aiarena.mjs --games 400              # more samples
//   node tools/aiarena.mjs --tiers ace,warlord,yonko
//   node tools/aiarena.mjs --size 3 --port 8321
//   node tools/aiarena.mjs --personalities          # personality cross-table too
//   node tools/aiarena.mjs --json tests/ai-matrix.json
//
// Acceptance: the matrix must be monotonic — every tier beats every tier below
// it, and each adjacent step by >= 60%.

import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { writeFile, mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';

const args = Object.fromEntries(
  process.argv.slice(2).reduce((acc, a, i, arr) => {
    if (a.startsWith('--')) acc.push([a.slice(2), arr[i + 1] && !arr[i + 1].startsWith('--') ? arr[i + 1] : true]);
    return acc;
  }, [])
);

const PORT = Number(args.port || 8321);
const GAMES = Number(args.games || 200);
const SIZE = Number(args.size || 3);
const TIERS = String(args.tiers || 'rookie,pirate,ace,warlord,yonko').split(',');
const MAXTURNS = Number(args.maxturns || 220);
const BASE = `http://127.0.0.1:${PORT}`;

async function startServer() {
  const p = spawn(process.execPath, ['tools/serve.mjs', String(PORT)], { stdio: ['ignore', 'pipe', 'pipe'] });
  await new Promise((res, rej) => {
    const t = setTimeout(() => rej(new Error('server start timeout')), 10000);
    p.stdout.on('data', (d) => { if (String(d).includes('serving')) { clearTimeout(t); res(); } });
    p.stderr.on('data', (d) => process.stderr.write(d));
  });
  return p;
}

/* ---------------------------------------------------------------- */
/* everything below the fence runs in the page                       */
/* ---------------------------------------------------------------- */

async function inPage({ tiers, games, size, maxTurns, personalities }) {
  const A = window.__ARENA;
  const { createBattle, submitChoices, makeDefaultMember, defaultBag, RNG } = A.sim;
  // `chooseActionDetailed` also reports node counts and per-decision time. It is
  // not on `__ARENA.sim` yet (see docs/HANDOFF.md); the dynamic import resolves
  // to the very same module instance main.js already loaded.
  const chooseActionDetailed = A.sim.chooseActionDetailed
    || (await import('/src/core/ai.js')).chooseActionDetailed;
  const ids = A.data.fighters.map((f) => f.id);

  const timings = {};   // key -> {n, sum, samples[]}
  function note(key, ms) {
    let t = timings[key];
    if (!t) t = timings[key] = { n: 0, sum: 0, max: 0, samples: [] };
    t.n++; t.sum += ms; if (ms > t.max) t.max = ms;
    if (t.samples.length < 60000) t.samples.push(ms);
  }

  function team(rng) {
    const pool = ids.slice();
    const out = [];
    for (let i = 0; i < size && pool.length; i++) {
      const k = rng.int(pool.length);
      out.push(makeDefaultMember(pool[k], 50));
      pool.splice(k, 1);
    }
    return out;
  }

  /** One game. `cfgs[0]` sits on side 0, `cfgs[1]` on side 1. */
  function play(seed, cfgs, keys) {
    const rng = new RNG(seed);
    const t0 = team(rng), t1 = team(rng);
    const b = createBattle({
      seed, arena: 'colosseum',
      format: { level: 50, teamSize: size, bring: size },
      sides: [
        { name: 'A', team: t0, isAI: true, items: defaultBag() },
        { name: 'B', team: t1, isAI: true, items: defaultBag() }
      ]
    });
    let guard = 0;
    while (!b.ended && guard++ < maxTurns) {
      const ch = [null, null];
      for (let s = 0; s < 2; s++) {
        if (!b.request[s]) continue;
        const r = chooseActionDetailed(b, s, cfgs[s]);
        note(keys[s], r.ms);
        ch[s] = r.choice;
      }
      submitChoices(b, ch);
    }
    if (!b.ended) return 'timeout';
    return b.winner === 0 ? 'A' : b.winner === 1 ? 'B' : 'draw';
  }

  function duel(cfgA, cfgB, keyA, keyB, n, seedBase) {
    let a = 0, bw = 0, d = 0, to = 0, turns = 0;
    for (let g = 0; g < n; g++) {
      // Alternate seats so lead-order asymmetry cancels out.
      const flip = g % 2 === 1;
      const cfgs = flip ? [cfgB, cfgA] : [cfgA, cfgB];
      const keys = flip ? [keyB, keyA] : [keyA, keyB];
      const r = play(seedBase + g * 7919, cfgs, keys);
      if (r === 'timeout') { to++; continue; }
      if (r === 'draw') { d++; continue; }
      const winnerIsA = (r === 'A') !== flip;
      if (winnerIsA) a++; else bw++;
    }
    return { a, b: bw, draws: d, timeouts: to, turns };
  }

  const out = { matrix: {}, timings: {}, personality: null };

  for (let i = 0; i < tiers.length; i++) {
    for (let j = i + 1; j < tiers.length; j++) {
      const A1 = tiers[i], B1 = tiers[j];
      const r = duel(A1, B1, A1, B1, games, 1000 + i * 1000003 + j * 7717);
      out.matrix[`${A1}|${B1}`] = r;
    }
  }

  if (personalities) {
    const ps = ['balanced', 'aggressive', 'defensive', 'gimmicky'];
    const pm = {};
    for (let i = 0; i < ps.length; i++) {
      for (let j = i + 1; j < ps.length; j++) {
        const ca = { level: 'ace', personality: ps[i] };
        const cb = { level: 'ace', personality: ps[j] };
        const r = duel(ca, cb, 'p:' + ps[i], 'p:' + ps[j], Math.max(60, games >> 1), 500000 + i * 977 + j * 31);
        pm[`${ps[i]}|${ps[j]}`] = r;
      }
    }
    out.personality = pm;
  }

  for (const [k, t] of Object.entries(timings)) {
    const s = t.samples.slice().sort((x, y) => x - y);
    const q = (p) => s.length ? s[Math.min(s.length - 1, Math.floor(p * s.length))] : 0;
    out.timings[k] = {
      decisions: t.n, mean: t.sum / t.n, p50: q(0.5), p90: q(0.9), p99: q(0.99), max: t.max
    };
  }
  return out;
}

/* ---------------------------------------------------------------- */

function bar(p) {
  const n = Math.round(p * 20);
  return '█'.repeat(n) + '·'.repeat(20 - n);
}

async function main() {
  const server = await startServer();
  const browser = await chromium.launch({
    executablePath: process.env.PW_CHROMIUM || undefined,
    args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--disable-dev-shm-usage', '--no-sandbox']
  });
  const page = await browser.newPage({ viewport: { width: 800, height: 600 } });
  const pageErrors = [];
  page.on('pageerror', (e) => pageErrors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error') pageErrors.push(m.text()); });

  await page.goto(BASE, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.__ARENA?.sim?.chooseActionDetailed, null, { timeout: 30000 });
  await page.evaluate(() => window.__ARENA.audio.setMuted(true));

  console.log(`\nGRAND LINE ARENA — AI round robin`);
  console.log(`  ${GAMES} games per pairing · ${SIZE}v${SIZE} · random teams from the full roster\n`);

  const t0 = Date.now();
  const res = await page.evaluate(inPage, {
    tiers: TIERS, games: GAMES, size: SIZE, maxTurns: MAXTURNS, personalities: !!args.personalities
  });
  const elapsed = (Date.now() - t0) / 1000;

  /* ---- win-rate matrix ---- */
  const rate = {};
  for (const [k, r] of Object.entries(res.matrix)) {
    const [a, b] = k.split('|');
    const decided = r.a + r.b;
    const p = decided ? r.a / decided : 0.5;
    (rate[a] ||= {})[b] = p;
    (rate[b] ||= {})[a] = 1 - p;
  }

  const w = Math.max(8, ...TIERS.map((t) => t.length + 1));
  const pad = (s, n = w) => String(s).padEnd(n);
  console.log('WIN-RATE MATRIX  (row beats column, %)');
  console.log('  ' + pad('') + TIERS.map((t) => pad(t, 9)).join(''));
  for (const r of TIERS) {
    let line = '  ' + pad(r);
    for (const c of TIERS) {
      line += pad(r === c ? '—' : (rate[r]?.[c] * 100).toFixed(1), 9);
    }
    console.log(line);
  }

  console.log('\nADJACENT STEPS  (must be >= 60%)');
  let ok = true;
  for (let i = TIERS.length - 1; i > 0; i--) {
    const hi = TIERS[i], lo = TIERS[i - 1];
    const p = rate[hi]?.[lo] ?? 0;
    const pass = p >= 0.60;
    if (!pass) ok = false;
    console.log(`  ${pad(hi, 9)} > ${pad(lo, 9)} ${bar(p)} ${(p * 100).toFixed(1)}%  ${pass ? '✅' : '❌'}`);
  }

  console.log('\nMONOTONICITY  (every tier beats every tier below it)');
  for (let i = 0; i < TIERS.length; i++) {
    for (let j = 0; j < i; j++) {
      const p = rate[TIERS[i]]?.[TIERS[j]] ?? 0;
      if (p < 0.5) { ok = false; console.log(`  ❌ ${TIERS[i]} only ${(p * 100).toFixed(1)}% vs ${TIERS[j]}`); }
    }
  }
  if (ok) console.log('  ✅ strictly monotonic');

  /* ---- draws / timeouts ---- */
  let to = 0, dr = 0, tot = 0;
  for (const r of Object.values(res.matrix)) { to += r.timeouts; dr += r.draws; tot += r.a + r.b + r.draws + r.timeouts; }
  console.log(`\n  ${tot} games · ${dr} draws · ${to} non-terminating · ${elapsed.toFixed(1)}s wall`);

  /* ---- decision time ---- */
  console.log('\nDECISION TIME (ms)');
  console.log('  ' + pad('tier', 10) + pad('decisions', 12) + pad('mean', 9) + pad('p50', 9) + pad('p90', 9) + pad('p99', 9) + pad('max', 9));
  for (const t of TIERS) {
    const s = res.timings[t];
    if (!s) continue;
    console.log('  ' + pad(t, 10) + pad(s.decisions, 12)
      + pad(s.mean.toFixed(3), 9) + pad(s.p50.toFixed(3), 9)
      + pad(s.p90.toFixed(3), 9) + pad(s.p99.toFixed(3), 9) + pad(s.max.toFixed(1), 9));
  }
  const slow = TIERS.filter((t) => res.timings[t] && res.timings[t].p99 > 200);
  if (slow.length) { ok = false; console.log(`  ❌ over the 200ms budget at p99: ${slow.join(', ')}`); }
  else console.log('  ✅ all tiers under the 200ms budget at p99');

  if (res.personality) {
    console.log('\nPERSONALITY CROSS-TABLE (ace tier, row beats column %)');
    const ps = ['balanced', 'aggressive', 'defensive', 'gimmicky'];
    const pr = {};
    for (const [k, r] of Object.entries(res.personality)) {
      const [a, b] = k.split('|');
      const d = r.a + r.b; const p = d ? r.a / d : 0.5;
      (pr[a] ||= {})[b] = p; (pr[b] ||= {})[a] = 1 - p;
    }
    console.log('  ' + pad('', 12) + ps.map((t) => pad(t, 12)).join(''));
    for (const r of ps) {
      let line = '  ' + pad(r, 12);
      for (const c of ps) line += pad(r === c ? '—' : (pr[r]?.[c] * 100).toFixed(1), 12);
      console.log(line);
    }
  }

  if (pageErrors.length) {
    console.log('\n⚠ page errors:');
    [...new Set(pageErrors)].slice(0, 10).forEach((e) => console.log('  - ' + e));
  }

  if (args.json) {
    const p = String(args.json);
    await mkdir(dirname(p), { recursive: true });
    await writeFile(p, JSON.stringify({ tiers: TIERS, games: GAMES, size: SIZE, rate, raw: res }, null, 2));
    console.log(`\n  wrote ${p}`);
  }

  await browser.close();
  server.kill();
  console.log(ok ? '\n✅ arena clean\n' : '\n❌ arena failed acceptance\n');
  process.exit(ok ? 0 : 1);
}

main().catch((e) => { console.error(e); process.exit(1); });
