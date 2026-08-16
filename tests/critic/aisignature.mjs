// CRITIC — are the five AI tiers different brains, or one brain with more noise?
// Puts every tier on the SAME positions and records (a) what kind of action it
// picks and (b) how often two tiers pick the identical action.

import { createBattle, submitChoices, legalMoves, active } from '../../src/core/engine.js';
import { chooseAction, AI_LEVELS } from '../../src/core/ai.js';
import { RNG } from '../../src/core/rng.js';
import { getMove } from '../../src/data/moves.js';
import { allFighters, makeDefaultMember } from '../../src/data/fighters.js';
import { defaultBag } from '../../src/data/items.js';

const arg = (k, d) => { const i = process.argv.indexOf(`--${k}`); return i >= 0 ? Number(process.argv[i + 1]) : d; };
const POSITIONS = arg('positions', 600);
const TIERS = Object.keys(AI_LEVELS);
const IDS = allFighters().map((f) => f.id);

/* Collect a library of real mid-battle positions by letting `ace` play. */
const positions = [];
{
  const rng = new RNG(777);
  let seed = 0;
  while (positions.length < POSITIONS) {
    const team = () => [0, 0, 0].map(() => makeDefaultMember(IDS[rng.int(IDS.length)], 50));
    const b = createBattle({
      seed: 1000 + seed++, arena: 'colosseum', format: { level: 50, teamSize: 3, bring: 3 },
      sides: [{ name: 'A', team: team(), items: defaultBag() }, { name: 'B', team: team(), items: defaultBag() }]
    });
    let g = 0;
    while (!b.ended && g++ < 60 && positions.length < POSITIONS) {
      if (b.request[0] === 'move' && rng.next() < 0.5) positions.push(JSON.parse(JSON.stringify(cloneable(b))));
      submitChoices(b, [0, 1].map((i) => (b.request[i] ? chooseAction(b, i, 'ace') : null)));
    }
  }
}
function cloneable(b) {
  const { rng, ...rest } = b;
  return { ...rest, __seed: b.rng.save() };
}
function rehydrate(p) {
  const s = JSON.parse(JSON.stringify(p));
  s.rng = new RNG(1).load(p.__seed);
  return s;
}

const stats = {};
const picks = {};
for (const t of TIERS) { stats[t] = { move: 0, switch: 0, item: 0, status: 0, setup: 0, protect: 0, priority: 0, n: 0 }; picks[t] = []; }

for (const p of positions) {
  for (const t of TIERS) {
    const st = rehydrate(p);
    let c;
    try { c = chooseAction(st, 0, t); } catch (e) { c = { kind: 'error' }; }
    picks[t].push(JSON.stringify(c));
    const s = stats[t]; s.n++;
    if (c.kind === 'switch') s.switch++;
    else if (c.kind === 'item') s.item++;
    else if (c.kind === 'move') {
      s.move++;
      const m = getMove(c.moveId);
      if (m?.category === 'status') s.status++;
      if (m?.effects?.some((e) => e.kind === 'boost' && e.target === 'self' && Object.values(e.stats || {}).some((v) => v > 0))) s.setup++;
      if (m?.effects?.some((e) => e.kind === 'volatile' && (e.value === 'protect' || e.value === 'endure'))) s.protect++;
      if ((m?.priority ?? 0) > 0) s.priority++;
    }
  }
}

console.log(`\n════ AI SIGNATURES — same ${positions.length} positions, five brains ════\n`);
console.log('tier      attack%  switch%  bag%  status%  setup%  protect%  priority%');
for (const t of TIERS) {
  const s = stats[t]; const f = (v) => ((v / s.n) * 100).toFixed(1).padStart(6);
  console.log(`${t.padEnd(9)} ${f(s.move)}  ${f(s.switch)} ${f(s.item)} ${f(s.status)} ${f(s.setup)}  ${f(s.protect)}   ${f(s.priority)}`);
}

console.log('\nagreement between tiers (identical Choice on the same board):');
process.stdout.write('          ' + TIERS.map((t) => t.slice(0, 7).padStart(8)).join('') + '\n');
for (const a of TIERS) {
  let line = a.padEnd(10);
  for (const b of TIERS) {
    if (a === b) { line += '       —'; continue; }
    let same = 0;
    for (let i = 0; i < picks[a].length; i++) if (picks[a][i] === picks[b][i]) same++;
    line += `${((same / picks[a].length) * 100).toFixed(0)}%`.padStart(8);
  }
  console.log(line);
}
