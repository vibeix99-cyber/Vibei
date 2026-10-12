// CRITIC — does the "pure, deterministic given (seed, choices)" promise hold
// ACROSS PROCESSES?  data/items.js keeps a module-level mutable Set
// (ENGINE_ITEM_HOOKS) that runItemHook() grows at runtime; runAbility() consults
// it to decide whether to pipe the held item. So the same hook can fire a
// different number of times depending on what the process did earlier.

import { createBattle, submitChoices } from '../../src/core/engine.js';

const ORDER = process.argv[2] || 'cold';   // cold = target battle first

function statusBattle(seed = 4242) {
  const st = createBattle({
    seed, format: { level: 50, teamSize: 1, bring: 1 },
    sides: [
      { name: 'A', team: [{ speciesId: 'zoro', level: 50, ability: '__none', item: null, moves: ['toxic_brand', 'draw_cut'] }] },
      { name: 'B', team: [{ speciesId: 'nami', level: 50, ability: '__none', item: 'sea_stone_band', moves: ['draw_cut'] }] }
    ], arena: 'marineford'
  });
  const evs = [];
  // find a status move zoro can actually use
  const statusMoveId = st.sides[0].party[0].moves.find((m) => m.id !== 'draw_cut')?.id ?? 'draw_cut';
  for (let i = 0; i < 3 && !st.ended; i++) {
    evs.push(...submitChoices(st, [
      { kind: 'move', moveId: statusMoveId, target: 'foe' },
      { kind: 'move', moveId: 'draw_cut', target: 'foe' }
    ]));
  }
  return evs;
}

function warmup() {
  // any battle at all: the first applyStatus in the process mutates the Set
  const st = createBattle({
    seed: 1, format: { level: 50, teamSize: 1, bring: 1 },
    sides: [
      { name: 'A', team: [{ speciesId: 'zoro', level: 50, ability: '__none', item: null, moves: ['toxic_brand'] }] },
      { name: 'B', team: [{ speciesId: 'nami', level: 50, ability: '__none', item: 'sea_stone_band', moves: ['draw_cut'] }] }
    ], arena: 'marineford'
  });
  for (let i = 0; i < 3 && !st.ended; i++) {
    submitChoices(st, [{ kind: 'move', moveId: 'toxic_brand', target: 'foe' }, { kind: 'move', moveId: 'draw_cut', target: 'foe' }]);
  }
}

if (ORDER === 'warm') warmup();
const evs = statusBattle();
console.log(JSON.stringify(evs));
