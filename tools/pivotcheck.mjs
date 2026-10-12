// Is there a switching metagame, or does everyone just stand there and swing?
//
//   node tools/pivotcheck.mjs                       # every tier, 120 games each
//   node tools/pivotcheck.mjs --tiers ace,warlord --games 300
//   node tools/pivotcheck.mjs --size 4 --moves      # per-move pick rates too
//
// Measures the *decisions*, not the outcomes: how often a tier chooses to
// leave the field, how often it takes a pivot when one is on the card, and
// whether pursuit moves are ever pointed at something that is actually
// running. Offered/used is the honest denominator — a move nobody carries
// cannot be under-picked.
//
// Reference points from competitive Pokémon singles: roughly a fifth to a
// quarter of all turns are switches, and U-turn/Volt Switch are among the
// most-used moves in the game. A tier that switches on 2% of turns has a
// bench for decoration.

import { createBattle, submitChoices, legalMoves, legalSwitches } from '../src/core/engine.js';
import { chooseAction, AI_LEVELS } from '../src/core/ai.js';
import { RNG } from '../src/core/rng.js';
import { getMove } from '../src/data/moves.js';
import { allFighters, makeDefaultMember } from '../src/data/fighters.js';
import { defaultBag } from '../src/data/items.js';

const arg = (k, d) => { const i = process.argv.indexOf(`--${k}`); return i >= 0 ? process.argv[i + 1] : d; };
const has = (k) => process.argv.includes(`--${k}`);
const GAMES = Number(arg('games', 120));
const SIZE = Number(arg('size', 3));
const MAXT = 300;
const TIERS = String(arg('tiers', Object.keys(AI_LEVELS).join(','))).split(',');

const IDS = allFighters().map((f) => f.id);
const isPivot = (m) => !!m && (
  (m.category !== 'status' && m.flags?.includes('pivot'))
  || !!m.effects?.some((e) => e.kind === 'custom' && e.value === 'pivot'));
const isPursuit = (m) => !!m?.flags?.includes('pursuit');

function team(rng) {
  const pool = IDS.slice(); const out = [];
  for (let i = 0; i < SIZE && pool.length; i++) {
    const k = rng.int(pool.length);
    out.push(makeDefaultMember(pool[k], 50)); pool.splice(k, 1);
  }
  return out;
}

/** One tier against itself, counting every voluntary decision on both sides. */
function run(tier, games) {
  const st = {
    decisions: 0, switches: 0, moves: 0, items: 0,
    withBench: 0,                       // decisions where leaving was even legal
    pivotOffered: 0, pivotUsed: 0,      // decisions where a pivot was on the card
    pursuitOffered: 0, pursuitUsed: 0,
    pivotFired: 0, pursuitFired: 0,     // events the engine actually emitted
    forced: 0, turns: 0, battles: 0
  };
  const byMove = new Map();
  const bump = (id, k) => {
    let r = byMove.get(id); if (!r) byMove.set(id, r = { offered: 0, used: 0 });
    r[k]++;
  };

  const t0 = Date.now();
  for (let g = 0; g < games; g++) {
    const rng = new RNG(90210 + g * 6367);
    const b = createBattle({
      seed: 4242 + g * 977, arena: 'colosseum',
      format: { level: 50, teamSize: SIZE, bring: SIZE },
      sides: [
        { name: 'A', team: team(rng), items: defaultBag() },
        { name: 'B', team: team(rng), items: defaultBag() }
      ]
    });
    let seen = 0, guard = 0;
    while (!b.ended && guard++ < MAXT) {
      const choices = [null, null];
      for (const s of [0, 1]) {
        if (!b.request[s]) continue;
        const forced = b.request[s] === 'switch';
        const legal = forced ? [] : legalMoves(b, s);
        const pivots = legal.filter((id) => isPivot(getMove(id)));
        const chases = legal.filter((id) => isPursuit(getMove(id)));
        const ch = chooseAction(b, s, tier);
        choices[s] = ch;

        if (forced) { st.forced++; continue; }
        st.decisions++;
        if (legalSwitches(b, s).length) st.withBench++;
        if (ch.kind === 'switch') st.switches++;
        else if (ch.kind === 'item') st.items++;
        else st.moves++;
        if (pivots.length) {
          st.pivotOffered++;
          if (ch.kind === 'move' && isPivot(getMove(ch.moveId))) st.pivotUsed++;
        }
        if (chases.length) {
          st.pursuitOffered++;
          if (ch.kind === 'move' && isPursuit(getMove(ch.moveId))) st.pursuitUsed++;
        }
        for (const id of legal) {
          const m = getMove(id);
          if (!isPivot(m) && !isPursuit(m)) continue;
          bump(id, 'offered');
          if (ch.kind === 'move' && ch.moveId === id) bump(id, 'used');
        }
      }
      submitChoices(b, choices);
      for (; seen < b.events.length; seen++) {
        const e = b.events[seen];
        if (e.t === 'pivot') st.pivotFired++;
        if (e.t === 'msg' && /caught on the way out/.test(e.text || '')) st.pursuitFired++;
      }
    }
    st.turns += b.turn;
    st.battles++;
  }
  st.ms = Date.now() - t0;
  st.byMove = byMove;
  return st;
}

const pct = (n, d) => (d ? `${((n / d) * 100).toFixed(1)}%` : '   — ');

console.log(`\n════ SWITCHING METAGAME — ${GAMES} self-play games per tier, ${SIZE}v${SIZE} ════\n`);
console.log('tier       turns/g   switch%  (of turns with a bench)   pivot taken   pursuit taken   pivots fired/g');
const all = new Map();
for (const tier of TIERS) {
  const r = run(tier, GAMES);
  all.set(tier, r);
  console.log(
    `${tier.padEnd(10)} ${(r.turns / r.battles).toFixed(1).padStart(7)}   `
    + `${pct(r.switches, r.decisions).padStart(6)}   ${pct(r.switches, r.withBench).padStart(21)}   `
    + `${`${pct(r.pivotUsed, r.pivotOffered)} of ${r.pivotOffered}`.padStart(11)}   `
    + `${`${pct(r.pursuitUsed, r.pursuitOffered)} of ${r.pursuitOffered}`.padStart(13)}   `
    + `${(r.pivotFired / r.battles).toFixed(2).padStart(14)}`
  );
}
console.log(`\n(switch% counts voluntary switches only; forced replacements after a faint are excluded)`);

if (has('moves')) {
  console.log(`\n════ PER-MOVE PICK RATE (all tiers pooled) ════\n`);
  const pool = new Map();
  for (const r of all.values()) {
    for (const [id, v] of r.byMove) {
      const cur = pool.get(id) || { offered: 0, used: 0 };
      pool.set(id, { offered: cur.offered + v.offered, used: cur.used + v.used });
    }
  }
  const rows = [...pool.entries()].sort((a, b) => (b[1].used / (b[1].offered || 1)) - (a[1].used / (a[1].offered || 1)));
  for (const [id, v] of rows) {
    const m = getMove(id);
    console.log(`  ${(m?.name || id).padEnd(18)} ${isPivot(m) ? 'pivot  ' : 'pursuit'}  ${String(v.offered).padStart(6)} offered  ${String(v.used).padStart(5)} used  ${pct(v.used, v.offered).padStart(6)}`);
  }
}

// A pivot the AI never takes is a dead card; one it takes every time it sees is
// a bug in the other direction. Both are worth failing on.
let bad = 0;
for (const [tier, r] of all) {
  const cfg = AI_LEVELS[tier];
  if (!cfg.switchIQ) continue;
  const taken = r.pivotOffered ? r.pivotUsed / r.pivotOffered : 0;
  if (r.pivotOffered > 200 && taken < 0.04) { console.log(`\n✗ ${tier}: pivots offered ${r.pivotOffered}× and taken ${pct(r.pivotUsed, r.pivotOffered)} — the card is dead`); bad++; }
  if (taken > 0.75) { console.log(`\n✗ ${tier}: takes the pivot ${pct(r.pivotUsed, r.pivotOffered)} of the time it is offered — it is spamming, not pivoting`); bad++; }
}
if (!bad) console.log('\n✅ every switching tier both uses pivots and declines them');
process.exit(bad ? 1 : 0);
