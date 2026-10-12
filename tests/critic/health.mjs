// CRITIC — shape of the average game. Length, stalls, accuracy spirals, what kills.

import { createBattle, submitChoices } from '../../src/core/engine.js';
import { chooseAction } from '../../src/core/ai.js';
import { RNG } from '../../src/core/rng.js';
import { allFighters, makeDefaultMember } from '../../src/data/fighters.js';
import { defaultBag } from '../../src/data/items.js';
import { getMove } from '../../src/data/moves.js';

const arg = (k, d) => { const i = process.argv.indexOf(`--${k}`); return i >= 0 ? Number(process.argv[i + 1]) : d; };
const N = arg('games', 2000);
const LEVEL = process.argv.includes('--tier') ? process.argv[process.argv.indexOf('--tier') + 1] : 'ace';
const IDS = allFighters().map((f) => f.id);

const lens = [];
let draws = 0, timeouts = 0;
const faintBy = {};
let moves = 0, misses = 0, crits = 0, hits = 0;
let accSpiral = 0, evaSpiral = 0, boostWars = 0;
let dupMsg = 0; const dupExamples = new Set();
let longGames = 0;
const rng = new RNG(31415);

for (let n = 0; n < N; n++) {
  const team = () => [0, 0, 0].map(() => makeDefaultMember(IDS[rng.int(IDS.length)], 50));
  const b = createBattle({
    seed: 90000 + n, arena: 'colosseum', format: { level: 50, teamSize: 3, bring: 3 },
    sides: [{ name: 'A', team: team(), items: defaultBag() }, { name: 'B', team: team(), items: defaultBag() }]
  });
  let g = 0;
  let sawAcc = false, sawEva = false, setupTurns = 0;
  while (!b.ended && g++ < 400) {
    submitChoices(b, [0, 1].map((i) => (b.request[i] ? chooseAction(b, i, LEVEL) : null)));
    for (const s of [0, 1]) for (const p of b.sides[s].party) {
      if ((p.boosts.acc || 0) <= -4) sawAcc = true;
      if ((p.boosts.eva || 0) >= 3) sawEva = true;
    }
  }
  lens.push(b.turn);
  if (b.turn >= 60) longGames++;
  if (b.winner === 'draw') draws++;
  if (b.endReason === 'timeout') timeouts++;
  if (sawAcc) accSpiral++;
  if (sawEva) evaSpiral++;

  let prev = null;
  for (const e of b.events) {
    if (e.t === 'moveUsed') moves++;
    if (e.t === 'miss' && e.reason === 'accuracy') misses++;
    if (e.t === 'damage' && e.source === 'move') { hits++; if (e.crit) crits++; }
    if (e.t === 'faint') {
      const who = [0, 1].flatMap((s) => b.sides[s].party).find((p) => p.uid === e.uid);
      const cause = who?.faintCause || 'unknown';
      faintBy[cause] = (faintBy[cause] || 0) + 1;
    }
    if (e.t === 'message') {
      if (prev === e.text) { dupMsg++; if (dupExamples.size < 8) dupExamples.add(e.text); }
      prev = e.text;
    }
  }
}

lens.sort((a, b) => a - b);
const q = (p) => lens[Math.min(lens.length - 1, Math.floor(lens.length * p))];
console.log(`\n════ GAME SHAPE — ${N} ${LEVEL}-vs-${LEVEL} games, 3v3, level 50 ════\n`);
console.log(`turns:  min ${lens[0]}  p25 ${q(0.25)}  median ${q(0.5)}  p75 ${q(0.75)}  p95 ${q(0.95)}  max ${lens[lens.length - 1]}`);
console.log(`games over 60 turns: ${longGames} (${(longGames / N * 100).toFixed(1)}%)   draws ${draws}   timeouts ${timeouts}`);
console.log(`accuracy dropped to −4 or worse in ${(accSpiral / N * 100).toFixed(1)}% of games; evasion +3 or better in ${(evaSpiral / N * 100).toFixed(1)}%`);
console.log(`\nmoves used ${moves}, landed ${hits}, missed ${misses} (${(misses / moves * 100).toFixed(1)}%), crits ${crits} (${(crits / hits * 100).toFixed(1)}% of hits)`);
console.log(`\nwhat actually kills:`);
const total = Object.values(faintBy).reduce((a, c) => a + c, 0);
for (const [k, v] of Object.entries(faintBy).sort((a, b) => b[1] - a[1])) console.log(`   ${k.padEnd(12)} ${String(v).padStart(6)}  ${(v / total * 100).toFixed(1)}%`);
console.log(`\nduplicate consecutive log lines: ${dupMsg}`);
for (const d of dupExamples) console.log(`   "${d}"`);
