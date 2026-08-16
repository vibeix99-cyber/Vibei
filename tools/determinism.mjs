// Same seed + same choices must produce a byte-identical event stream,
// regardless of what the process did beforehand. This is the property that
// makes replays, link battles and AI lookahead possible.
import { createBattle, submitChoices } from '../src/core/engine.js';
import { makeDefaultMember } from '../src/data/fighters.js';
import { chooseAction } from '../src/core/ai.js';

const team = (ids) => ids.map((id) => {
  const m = makeDefaultMember(id, 50);
  m.item = 'sea_stone_band';
  return m;
});

function run(seed) {
  const b = createBattle({
    seed, arena: 'colosseum',
    sides: [{ name: 'A', team: team(['zoro', 'luffy']) }, { name: 'B', team: team(['nami', 'ace']) }]
  });
  let g = 0;
  while (!b.ended && g++ < 200) submitChoices(b, [0, 1].map((s) => (b.request[s] ? chooseAction(b, s, 'ace') : null)));
  return JSON.stringify(b.events);
}

// Cold reading of the target battle.
const cold = run(4242);

// Warm the process with unrelated battles — status lands, items fire, hooks run.
for (let i = 0; i < 25; i++) run(i + 1);

const warm = run(4242);

if (cold === warm) {
  console.log(`✅ identical across process state (${cold.length} bytes, 25 intervening battles)`);
} else {
  let i = 0; while (i < cold.length && cold[i] === warm[i]) i++;
  console.log('❌ DIVERGED at byte', i);
  console.log('  cold:', cold.slice(Math.max(0, i - 90), i + 130));
  console.log('  warm:', warm.slice(Math.max(0, i - 90), i + 130));
  process.exit(1);
}

// And repeated runs in one process must also agree.
const a = run(777), b2 = run(777), c = run(777);
if (a === b2 && b2 === c) console.log('✅ repeatable within a process');
else { console.log('❌ not repeatable within a process'); process.exit(1); }
