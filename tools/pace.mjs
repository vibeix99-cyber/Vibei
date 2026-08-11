// How long does a fighter live? The single number that decides whether there is
// a tactical game at all.
//
//   node tools/pace.mjs                     # the shipping roster
//   node tools/pace.mjs --evs               # ...and again with a role-based EV spread
//   node tools/pace.mjs --games 60 --tier warlord
//
// Two measurements, one from the data and one from real battles:
//
//   1. MATRIX — for every ordered pair of default sets, the damage the attacker's
//      best move does as a share of the target's max HP. This is the ceiling on
//      how long anything survives.
//   2. PLAY   — self-play at a given tier: turns per KO, and how much of the turn
//      budget is spent on something other than swinging.
//
// Why it matters: switching, status, hazards, screens, items and PP are all
// investments that only pay back over turns. At 1.5 hits to a KO none of them
// can pay back, and "click the biggest number" is not a heuristic, it is the
// correct play. Pokémon's tactical layer rests on a fighter surviving 2–3 hits
// from a good matchup and 4+ from a bad one; that is the band to land in.
//
// The gap is not the damage formula — that is a faithful port, see damage.js.
// It is the roster: measure the base spreads and 21 of 32 fighters are fast
// glass cannons. There is nothing on the team that can take a hit, so there is
// nothing to switch *to*, so the turn a switch costs never comes back.
// `--evs` shows that EV investment does not rescue it — you cannot invest your
// way to a wall out of a stat line that has no bulk in it.

import { createBattle, submitChoices, legalSwitches } from '../src/core/engine.js';
import { damageRange } from '../src/core/damage.js';
import { chooseAction } from '../src/core/ai.js';
import { RNG } from '../src/core/rng.js';
import { getMove } from '../src/data/moves.js';
import { allFighters, makeDefaultMember } from '../src/data/fighters.js';
import { defaultBag } from '../src/data/items.js';

const arg = (k, d) => { const i = process.argv.indexOf(`--${k}`); return i >= 0 ? process.argv[i + 1] : d; };
const has = (k) => process.argv.includes(`--${k}`);
const GAMES = Number(arg('games', 60));
const TIER = arg('tier', 'warlord');
const SIZE = Number(arg('size', 3));
const LEVEL = Number(arg('level', 50));

const F = allFighters();
const q = (a, p) => a.slice().sort((x, y) => x - y)[Math.floor(p * (a.length - 1))];

/**
 * A competitive EV spread, chosen by what the fighter's base stats say it is.
 * The point is not the exact numbers — it is that a roster of 32 identical
 * all-in-on-offense shapes has no walls, and a metagame without walls has
 * nothing to switch into.
 */
function roleSpread(base) {
  const off = Math.max(base.atk, base.spa);
  const offKey = base.atk >= base.spa ? 'atk' : 'spa';
  const bulk = base.hp + base.def + base.spd;
  const defKey = base.def >= base.spd ? 'def' : 'spd';
  if (base.spe >= 100 && off >= 105) return { [offKey]: 252, spe: 252, hp: 4 };   // sweeper: frail on purpose
  if (bulk >= 270 && off < 110) return { hp: 252, [defKey]: 252, [offKey]: 4 };   // wall
  return { hp: 252, [offKey]: 252, [defKey]: 4 };                                 // bulky attacker
}

const member = (id, evs) => {
  const m = makeDefaultMember(id, LEVEL);
  if (evs) m.evs = roleSpread(F.find((f) => f.id === id).base);
  return m;
};

/* ------------------------------------------------------- 1. the matrix */

function matrix(evs) {
  const team = () => F.map((f) => member(f.id, evs));
  const b = createBattle({
    seed: 1, arena: 'colosseum', format: { level: LEVEL, teamSize: F.length, bring: F.length },
    sides: [{ name: 'A', team: team() }, { name: 'B', team: team() }]
  });
  const [A, B] = [b.sides[0].party, b.sides[1].party];
  const best = [];
  for (const a of A) for (const d of B) {
    if (a.speciesId === d.speciesId) continue;
    let top = 0;
    for (const slot of a.moves) {
      const mv = getMove(slot.id);
      if (!mv || mv.category === 'status') continue;
      const r = damageRange({
        move: mv, user: a, target: d, field: b.field,
        side: b.sides[0], foeSide: b.sides[1], crit: false, rng: null
      });
      if (r.immune) continue;
      top = Math.max(top, ((r.min + r.max) / 2) / d.maxHp * 100);
    }
    if (top > 0) best.push(top);
  }
  return {
    n: best.length,
    hp: q(A.map((m) => m.maxHp), 0.5),
    p25: q(best, 0.25), med: q(best, 0.5), p75: q(best, 0.75), p90: q(best, 0.9),
    ohko: best.filter((x) => x >= 100).length / best.length,
    twoHit: best.filter((x) => x >= 50).length / best.length
  };
}

/* --------------------------------------------------------- 2. real play */

function play(evs) {
  let turns = 0, kos = 0, games = 0, switches = 0, decisions = 0, status = 0, items = 0;
  for (let g = 0; g < GAMES; g++) {
    const rng = new RNG(31337 + g * 6367);
    const pick = () => {
      const pool = F.map((f) => f.id); const out = [];
      for (let i = 0; i < SIZE; i++) { const k = rng.int(pool.length); out.push(member(pool[k], evs)); pool.splice(k, 1); }
      return out;
    };
    const b = createBattle({
      seed: 777 + g * 977, arena: 'colosseum', format: { level: LEVEL, teamSize: SIZE, bring: SIZE },
      sides: [{ name: 'A', team: pick(), items: defaultBag() }, { name: 'B', team: pick(), items: defaultBag() }]
    });
    let guard = 0;
    while (!b.ended && guard++ < 400) {
      const ch = [null, null];
      for (const s of [0, 1]) {
        if (!b.request[s]) continue;
        const forced = b.request[s] === 'switch';
        const c = chooseAction(b, s, TIER);
        ch[s] = c;
        if (forced) continue;
        decisions++;
        if (c.kind === 'switch') { if (legalSwitches(b, s).length) switches++; }
        else if (c.kind === 'item') items++;
        else if (getMove(c.moveId)?.category === 'status') status++;
      }
      submitChoices(b, ch);
    }
    turns += b.turn;
    kos += [0, 1].reduce((n, s) => n + b.sides[s].party.filter((p) => p.fainted).length, 0);
    games++;
  }
  return {
    turns: turns / games, kos: kos / games, perKO: turns / Math.max(1, kos),
    swPct: switches / decisions, stPct: status / decisions, itPct: items / decisions
  };
}

/* ------------------------------------------------- 3. the roster's shape */

/**
 * Bulk-to-offense ratio, the axis a metagame is built on. Pokémon OU runs from
 * Deoxys-Attack at 0.31 to Blissey at 1.90 — a six-fold spread, and the whole
 * tactical game lives in the gap between the ends. A roster clustered at one
 * end has archetypes in its flavour text and one archetype in its maths.
 */
const PKMN_REFERENCE = [
  ['Blissey', 1.90], ['Toxapex', 1.86], ['Skarmory', 1.55], ['Ferrothorn', 1.42],
  ['Corviknight', 1.34], ['Landorus-T', 0.98], ['Garchomp', 0.86],
  ['Dragapult', 0.62], ['Deoxys-A', 0.31]
];

function shape() {
  const rows = F.map((f) => {
    const b = f.base;
    const bulk = b.hp + b.def + b.spd, off = b.atk + b.spa + b.spe;
    return { id: f.id, ratio: bulk / off, bst: bulk + off, spe: b.spe };
  }).sort((a, b) => a.ratio - b.ratio);
  const r = rows.map((x) => x.ratio);
  const spread = r[r.length - 1] / r[0];
  console.log(`\n──── ROSTER SHAPE ────`);
  console.log(`  bulk / offense    ${r[0].toFixed(2)} … ${r[r.length - 1].toFixed(2)}   (a ${spread.toFixed(1)}× spread; Pokémon OU is 6.1×)`);
  console.log(`     most offensive  ${rows.slice(0, 3).map((x) => `${x.id} ${x.ratio.toFixed(2)}`).join('   ')}`);
  console.log(`     most defensive  ${rows.slice(-3).map((x) => `${x.id} ${x.ratio.toFixed(2)}`).join('   ')}`);
  console.log(`  genuine walls (>= 1.40)      ${rows.filter((x) => x.ratio >= 1.40).length} of ${rows.length}`);
  console.log(`  glass cannons (<= 0.85)      ${rows.filter((x) => x.ratio <= 0.85).length} of ${rows.length}`);
  console.log(`  base speed >= 100            ${rows.filter((x) => x.spe >= 100).length} of ${rows.length}   (median ${q(rows.map((x) => x.spe), 0.5)}; Pokémon OU median is ~85)`);
  console.log(`  for scale: ${PKMN_REFERENCE.map(([n, v]) => `${n} ${v}`).join(', ')}`);
  return { spread, walls: rows.filter((x) => x.ratio >= 1.40).length };
}

/* ------------------------------------------------------------- report */

const pct = (x) => `${(x * 100).toFixed(1)}%`;
function report(label, evs) {
  const m = matrix(evs);
  const p = play(evs);
  console.log(`\n──── ${label} ────`);
  console.log(`  median max HP                 ${m.hp}`);
  console.log(`  best move vs a random target  p25 ${m.p25.toFixed(0)}%   median ${m.med.toFixed(0)}%   p75 ${m.p75.toFixed(0)}%   p90 ${m.p90.toFixed(0)}%   (${m.n} pairs)`);
  console.log(`  hits to KO at the median      ${(100 / m.med).toFixed(2)}`);
  console.log(`  matchups that one-shot        ${pct(m.ohko)}          that two-shot   ${pct(m.twoHit)}`);
  console.log(`  ${TIER} self-play             ${p.turns.toFixed(1)} turns, ${p.kos.toFixed(1)} KOs  →  ${p.perKO.toFixed(2)} turns per KO`);
  console.log(`  turns spent not attacking     ${pct(p.swPct)} switching   ${pct(p.stPct)} status   ${pct(p.itPct)} items`);
  return { m, p };
}

console.log(`\n════ PACE — does anything live long enough to play around? ════`);
console.log(`${SIZE}v${SIZE}, level ${LEVEL}, ${GAMES} ${TIER} self-play games, default sets`);
console.log(`\nTarget band (Pokémon singles): 2.0–3.0 hits to KO at the median, under 10% of`);
console.log(`matchups one-shotting, and a clear majority of turns still spent attacking.`);

const now = report('AS SHIPPED (zero EVs on every set)', false);
if (has('evs')) {
  const then = report('WITH A ROLE-BASED EV SPREAD (252/252/4 by archetype)', true);
  console.log(`\n  EVs move it from ${(100 / now.m.med).toFixed(2)} to ${(100 / then.m.med).toFixed(2)} hits — the wrong way. The spread rule`);
  console.log(`  classifies 21 of 32 fighters as sweepers because that is what their base`);
  console.log(`  stats are, so the investment goes into offense and the game gets faster.`);
}
const sh = shape();

// Spread, not level. The depth critic's round-4 correction, and it is the whole
// point: a roster where everything dies in 2-3 hits has hit this tool's old
// median target and still has no wall and no glass cannon. Pokémon's depth lives
// in the distance between a Blissey that eats ten neutral hits and a Deoxys-A
// that dies to one, so that distance is what has to be measured.
const spread = (() => {
  const rows = F.map((f) => ({ id: f.id, r: (f.base.hp + f.base.def + f.base.spd) / (f.base.atk + f.base.spa + f.base.spe) }))
    .sort((a, b) => b.r - a.r);
  const bulkiest = rows.slice(0, 4).map((x) => x.id);
  const frailest = rows.slice(-4).map((x) => x.id);
  return { bulkiest, frailest };
})();

function hitsFor(ids, evs) {
  const team = () => F.map((f) => member(f.id, evs));
  const b = createBattle({
    seed: 7, arena: 'colosseum', format: { level: LEVEL, teamSize: F.length, bring: F.length },
    sides: [{ name: 'A', team: team() }, { name: 'B', team: team() }]
  });
  const [A, B] = [b.sides[0].party, b.sides[1].party];
  // Per defender: how many hits it survives from an *average* attacker playing
  // its own best move. Averaging over attackers, not taking the hardest hitter
  // in the game — that would say every fighter dies in under one hit, which is
  // true and useless.
  const out = [];
  for (const d of B) {
    if (!ids.includes(d.speciesId)) continue;
    const perAttacker = [];
    for (const a of A) {
      if (a.speciesId === d.speciesId) continue;
      let top = 0;
      for (const slot of a.moves) {
        const mv = getMove(slot.id);
        if (!mv || mv.category === 'status') continue;
        const r = damageRange({ move: mv, user: a, target: d, field: b.field, side: b.sides[0], foeSide: b.sides[1], crit: false, rng: null });
        if (r.immune) continue;
        top = Math.max(top, ((r.min + r.max) / 2) / d.maxHp * 100);
      }
      if (top > 0) perAttacker.push(top);
    }
    if (perAttacker.length) {
      const mean = perAttacker.reduce((x, y) => x + y, 0) / perAttacker.length;
      out.push(100 / mean);
    }
  }
  return out.reduce((a, x) => a + x, 0) / Math.max(1, out.length);
}

const wallHits = hitsFor(spread.bulkiest, false);
const frailHits = hitsFor(spread.frailest, false);
console.log(`\n──── THE SPREAD ────`);
console.log(`  the four bulkiest survive   ${wallHits.toFixed(2)} hits from an average attacker's best  (Pokémon walls: 6+)`);
console.log(`  the four frailest survive   ${frailHits.toFixed(2)} hits                                  (Pokémon sweepers: 1–2)`);
console.log(`  ratio between the ends      ${(wallHits / Math.max(0.01, frailHits)).toFixed(2)}×                                 (Pokémon: 4×+)`);

const hits = 100 / now.m.med;
let bad = 0;
if (wallHits / Math.max(0.01, frailHits) < 2.2) {
  console.log(`\n✗ The ends are ${(wallHits / Math.max(0.01, frailHits)).toFixed(2)}× apart. Everything dies at about the same rate, so there is`);
  console.log(`  nothing to switch *to* — a bench answer only exists when some body takes`);
  console.log(`  meaningfully less than the one already out.`);
  bad++;
}
if (hits < 2.0) {
  console.log(`\n✗ ${hits.toFixed(2)} hits to a KO. Everything that costs a turn — switching, status,`);
  console.log(`  hazards, screens, items, PP — is priced out. The AI is not being greedy;`);
  console.log(`  greedy is correct at this pace.`);
  bad++;
}
if (sh.walls === 0) {
  console.log(`\n✗ No fighter on the roster is a wall. Switching is an investment that only`);
  console.log(`  pays when there is something worth switching *to*; with nothing that can`);
  console.log(`  absorb a hit, every tactical system downstream is decorative.`);
  bad++;
}
if (!bad) console.log(`\n✅ ${hits.toFixed(2)} hits median, ends ${(wallHits / Math.max(0.01, frailHits)).toFixed(2)}× apart, ${sh.walls} walls — inside the band`);
process.exit(bad ? 1 : 0);
