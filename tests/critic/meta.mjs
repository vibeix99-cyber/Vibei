// CRITIC — is the tactical layer load-bearing, or is "click the biggest move" enough?
//
//   node tests/critic/meta.mjs greedy   --games 300
//   node tests/critic/meta.mjs ladder   --games 200
//   node tests/critic/meta.mjs roster   --games 3000
//   node tests/critic/meta.mjs types
//   node tests/critic/meta.mjs ablate   --games 300

import { createBattle, submitChoices, legalMoves, legalSwitches, active } from '../../src/core/engine.js';
import { chooseAction, AI_LEVELS } from '../../src/core/ai.js';
import { damageRange } from '../../src/core/damage.js';
import { RNG } from '../../src/core/rng.js';
import { MOVES, getMove } from '../../src/data/moves.js';
import { allFighters, makeDefaultMember } from '../../src/data/fighters.js';
import { defaultBag } from '../../src/data/items.js';
import { TYPES, CHART, typeEff } from '../../src/core/types.js';

const MODE = process.argv[2] || 'greedy';
const arg = (k, d) => { const i = process.argv.indexOf(`--${k}`); return i >= 0 ? process.argv[i + 1] : d; };
const GAMES = Number(arg('games', 200));
const SIZE = Number(arg('size', 3));
const MAXT = 300;

const IDS = allFighters().map((f) => f.id);
const BY = Object.fromEntries(allFighters().map((f) => [f.id, f]));

/* --------------------------------------------------------------- policies */

/** "Click the strongest move." No switching, no status, no items. */
function greedy(state, side) {
  const me = active(state, side), foe = active(state, 1 - side);
  const legal = legalMoves(state, side);
  if (!legal.length) return { kind: 'move', moveId: 'struggle' };
  let best = null, bestScore = -1;
  for (const id of legal) {
    const move = getMove(id);
    if (!move) continue;
    let score = 0;
    if (move.power > 0 && move.category !== 'status') {
      const r = damageRange({
        move, user: me, target: foe, field: state.field,
        foeSide: state.sides[1 - side], crit: false
      });
      score = (r.avg / Math.max(1, foe.hp)) * (move.accuracy === null ? 1 : move.accuracy / 100);
    }
    if (score > bestScore) { bestScore = score; best = id; }
  }
  return { kind: 'move', moveId: best ?? legal[0] };
}

/** Attacks only, but through the real AI brain (isolates "status+switching"). */
function makeAttackOnly(level) {
  return (state, side) => {
    const c = chooseAction(state, side, level);
    if (c.kind !== 'move') {
      // force it to attack instead of switching / bagging
      return greedy(state, side);
    }
    const m = getMove(c.moveId);
    if (m && m.category === 'status') return greedy(state, side);
    return c;
  };
}

const POLICY = (spec) => {
  if (spec === 'greedy') return greedy;
  if (spec.startsWith('atk:')) return makeAttackOnly(spec.slice(4));
  return (state, side) => chooseAction(state, side, spec);
};

/* ----------------------------------------------------------------- runner */

function team(rng) {
  const pool = IDS.slice(); const out = [];
  for (let i = 0; i < SIZE && pool.length; i++) {
    const k = rng.int(pool.length);
    out.push(makeDefaultMember(pool[k], 50)); pool.splice(k, 1);
  }
  return out;
}

function play(seed, pA, pB, t0, t1) {
  const b = createBattle({
    seed, arena: 'colosseum', format: { level: 50, teamSize: SIZE, bring: SIZE },
    sides: [{ name: 'A', team: t0, items: defaultBag() }, { name: 'B', team: t1, items: defaultBag() }]
  });
  let g = 0;
  while (!b.ended && g++ < MAXT) {
    const c = [null, null];
    for (const s of [0, 1]) if (b.request[s]) c[s] = (s === 0 ? pA : pB)(b, s);
    submitChoices(b, c);
  }
  return { winner: b.winner, turns: b.turn };
}

/** Mirror-matched series: every team pair is played twice with sides swapped. */
function series(specA, specB, games, seed0 = 1234) {
  const pA = POLICY(specA), pB = POLICY(specB);
  let winA = 0, winB = 0, draw = 0, turns = 0;
  const t0 = Date.now();
  for (let i = 0; i < games; i++) {
    const rng = new RNG(seed0 + i * 6367);
    const ta = team(rng), tb = team(rng);
    const r1 = play(seed0 + i * 977, pA, pB, ta, tb);
    if (r1.winner === 0) winA++; else if (r1.winner === 1) winB++; else draw++;
    turns += r1.turns;
    const r2 = play(seed0 + i * 977, pB, pA, ta, tb);   // sides swapped, same teams+seed
    if (r2.winner === 1) winA++; else if (r2.winner === 0) winB++; else draw++;
    turns += r2.turns;
  }
  const n = games * 2;
  return { specA, specB, winA, winB, draw, n, wrA: winA / n, turns: turns / n, ms: Date.now() - t0 };
}

const pctf = (x) => `${(x * 100).toFixed(1)}%`;

/* ------------------------------------------------------------------ modes */

if (MODE === 'greedy') {
  console.log(`\n════ "CLICK THE STRONGEST MOVE" vs. THE AI LADDER ════`);
  console.log(`${GAMES * 2} mirror-matched games per pairing, ${SIZE}v${SIZE}, level 50, default sets\n`);
  console.log('opponent   greedy win%   avg turns   games   wall');
  for (const tier of Object.keys(AI_LEVELS)) {
    const r = series('greedy', tier, GAMES, 50505);
    console.log(`${tier.padEnd(10)} ${pctf(r.wrA).padStart(10)}   ${r.turns.toFixed(1).padStart(9)}   ${String(r.n).padStart(5)}   ${(r.ms / 1000).toFixed(1)}s`);
  }
}

if (MODE === 'ablate') {
  console.log(`\n════ ABLATION — how much do status moves + switching earn? ════\n`);
  for (const tier of ['pirate', 'ace', 'warlord']) {
    const r = series(`atk:${tier}`, tier, GAMES, 7171);
    console.log(`${tier}: attacks-only version wins ${pctf(r.wrA)} of ${r.n} games vs the full brain (50% = the tactical layer is worth nothing)`);
  }
  const g = series('greedy', 'atk:ace', GAMES, 33);
  console.log(`greedy vs attack-only-ace: ${pctf(g.wrA)} — isolates move *selection* quality alone`);
}

if (MODE === 'ladder') {
  const tiers = Object.keys(AI_LEVELS);
  console.log(`\n════ AI LADDER — round robin, ${GAMES * 2} mirror-matched games per cell ════\n`);
  const grid = {};
  for (let i = 0; i < tiers.length; i++) {
    for (let j = i + 1; j < tiers.length; j++) {
      const r = series(tiers[i], tiers[j], GAMES, 606060);
      grid[`${tiers[i]}|${tiers[j]}`] = r;
      console.log(`  ${tiers[i].padEnd(8)} vs ${tiers[j].padEnd(8)} ${pctf(r.wrA).padStart(7)}  (${r.winA}-${r.winB}-${r.draw}, ${(r.ms / 1000).toFixed(0)}s, ${r.turns.toFixed(1)} turns)`);
    }
  }
  console.log('\nrow beats column:');
  process.stdout.write('          ' + tiers.map((t) => t.slice(0, 7).padStart(8)).join('') + '\n');
  for (const a of tiers) {
    let line = a.padEnd(10);
    for (const b of tiers) {
      if (a === b) { line += '       —'; continue; }
      const f = grid[`${a}|${b}`], g = grid[`${b}|${a}`];
      const wr = f ? f.wrA : (g ? 1 - g.wrA : null);
      line += (wr === null ? '      ?' : pctf(wr)).padStart(8);
    }
    console.log(line);
  }
  // monotonicity
  let bad = 0;
  for (let i = 0; i < tiers.length; i++) for (let j = i + 1; j < tiers.length; j++) {
    const r = grid[`${tiers[i]}|${tiers[j]}`];
    if (r.wrA >= 0.5) { console.log(`  ✗ NON-MONOTONIC: ${tiers[i]} (lower tier) scores ${pctf(r.wrA)} on ${tiers[j]}`); bad++; }
    else if (r.wrA > 0.4) { console.log(`  ~ thin margin: ${tiers[j]} only ${pctf(1 - r.wrA)} over ${tiers[i]}`); }
  }
  console.log(bad ? `\n${bad} inversion(s) in the ladder.` : '\nladder is monotonic.');
}

if (MODE === 'roster') {
  const wins = {}, games = {};
  IDS.forEach((i) => { wins[i] = 0; games[i] = 0; });
  const rng = new RNG(20260809);
  const t0 = Date.now();
  for (let n = 0; n < GAMES; n++) {
    const t0ids = [0, 0, 0].map(() => IDS[rng.int(IDS.length)]);
    const t1ids = [0, 0, 0].map(() => IDS[rng.int(IDS.length)]);
    const mk = (t) => t.map((id) => makeDefaultMember(id, 50));
    const r = play(n + 7, POLICY('ace'), POLICY('ace'), mk(t0ids), mk(t1ids));
    t0ids.forEach((id) => games[id]++); t1ids.forEach((id) => games[id]++);
    if (r.winner === 0) t0ids.forEach((id) => wins[id]++);
    else if (r.winner === 1) t1ids.forEach((id) => wins[id]++);
  }
  const rows = IDS.map((id) => ({
    id, tier: BY[id].tier, types: BY[id].types.join('/'),
    bst: Object.values(BY[id].base).reduce((a, c) => a + c, 0),
    n: games[id], wr: games[id] ? wins[id] / games[id] : 0
  })).sort((a, b) => b.wr - a.wr);
  console.log(`\n════ ROSTER — ${GAMES} games (${(Date.now() - t0) / 1000 | 0}s), ace vs ace, default sets ════\n`);
  console.log('id                 tier types              bst    n    win%');
  for (const r of rows) console.log(`${r.id.padEnd(18)} ${r.tier.padEnd(4)} ${r.types.padEnd(18)} ${String(r.bst).padStart(3)} ${String(r.n).padStart(4)}  ${(r.wr * 100).toFixed(1)}`);
  const w = rows.map((r) => r.wr);
  const mean = w.reduce((a, c) => a + c, 0) / w.length;
  const sd = Math.sqrt(w.reduce((a, c) => a + (c - mean) ** 2, 0) / w.length);
  // correlation of BST with win rate
  const xs = rows.map((r) => r.bst), ys = w;
  const mx = xs.reduce((a, c) => a + c, 0) / xs.length;
  const cov = xs.reduce((a, c, i) => a + (c - mx) * (ys[i] - mean), 0);
  const sx = Math.sqrt(xs.reduce((a, c) => a + (c - mx) ** 2, 0));
  const sy = Math.sqrt(ys.reduce((a, c) => a + (c - mean) ** 2, 0));
  console.log(`\nspread ${(Math.min(...w) * 100).toFixed(1)}% – ${(Math.max(...w) * 100).toFixed(1)}%   sd ${(sd * 100).toFixed(1)}pp   BST↔win r = ${(cov / (sx * sy)).toFixed(2)}`);
  // per-tier
  for (const t of ['S', 'A', 'B', 'C']) {
    const g = rows.filter((r) => r.tier === t);
    if (!g.length) continue;
    console.log(`  tier ${t}: n=${g.length}  mean win% ${(g.reduce((a, c) => a + c.wr, 0) / g.length * 100).toFixed(1)}`);
  }
}

if (MODE === 'types') {
  console.log('\n════ TYPE CHART ════\n');
  const rows = TYPES.map((t) => {
    let se = 0, res = 0, imm = 0, wse = 0, wres = 0, wimm = 0;
    for (const d of TYPES) {
      const o = CHART[t]?.[d] ?? 1;
      if (o > 1) se++; else if (o === 0) imm++; else if (o < 1) res++;
      const i = CHART[d]?.[t] ?? 1;
      if (i > 1) wse++; else if (i === 0) wimm++; else if (i < 1) wres++;
    }
    return { t, se, res, imm, wse, wres, wimm, off: se - res - imm * 2, def: wres + wimm * 2 - wse };
  });
  console.log('type     hits2x  resisted  immune | weakTo  resists  immuneTo |  offScore defScore');
  for (const r of rows.sort((a, b) => b.off - a.off)) {
    console.log(`${r.t.padEnd(8)} ${String(r.se).padStart(5)} ${String(r.res).padStart(9)} ${String(r.imm).padStart(7)} | ${String(r.wse).padStart(6)} ${String(r.wres).padStart(8)} ${String(r.wimm).padStart(9)} | ${String(r.off).padStart(9)} ${String(r.def).padStart(8)}`);
  }
  // dual-typing sweep: how good is each defensive pairing?
  const combos = [];
  for (let i = 0; i < TYPES.length; i++) {
    for (let j = i; j < TYPES.length; j++) {
      const d = i === j ? [TYPES[i]] : [TYPES[i], TYPES[j]];
      let weak = 0, resist = 0, immune = 0;
      for (const a of TYPES) {
        const e = typeEff(a, d);
        if (e === 0) immune++; else if (e > 1) weak += e >= 4 ? 2 : 1; else if (e < 1) resist += e <= 0.25 ? 2 : 1;
      }
      combos.push({ d: d.join('/'), weak, resist, immune, score: resist + immune * 2 - weak });
    }
  }
  combos.sort((a, b) => b.score - a.score);
  console.log('\nbest 8 defensive typings:');
  for (const c of combos.slice(0, 8)) console.log(`  ${c.d.padEnd(16)} score ${String(c.score).padStart(3)}  (weak ${c.weak}, resist ${c.resist}, immune ${c.immune})`);
  console.log('worst 8 defensive typings:');
  for (const c of combos.slice(-8)) console.log(`  ${c.d.padEnd(16)} score ${String(c.score).padStart(3)}  (weak ${c.weak}, resist ${c.resist}, immune ${c.immune})`);
  // which roster typings exist
  const used = new Set(allFighters().map((f) => f.types.slice().sort().join('/')));
  console.log(`\nroster uses ${used.size} distinct typings of ${combos.length} possible`);
}
