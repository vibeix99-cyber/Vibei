// CRITIC — are the 71 abilities and 51 items actually wired to anything?
//
// Method: differential testing. For each ability/item, run a battery of randomised
// but *identical-seed* battles twice — once with the ability/item equipped, once
// with an inert one — and diff the event streams. If no scenario in the battery
// ever diverges, the thing is decorative.
//
//   node tests/critic/abilitycheck.mjs [--n 120]

import { createBattle, submitChoices } from '../../src/core/engine.js';
import { RNG } from '../../src/core/rng.js';
import { MOVES } from '../../src/data/moves.js';
import { allFighters } from '../../src/data/fighters.js';
import { ABILITIES, hooksOf } from '../../src/core/abilities.js';
import { ITEMS, heldItems, bagItems, defaultBag } from '../../src/data/items.js';

const N = Number((() => { const i = process.argv.indexOf('--n'); return i >= 0 ? process.argv[i + 1] : 140; })());
const FIGHTERS = allFighters();
const ATTACKS = MOVES.filter((m) => m.power > 0);
const STATUSMOVES = MOVES.filter((m) => m.category === 'status');
const WEATHERS = [null, 'sun', 'rain', 'sand', 'hail', 'fog'];
const TERRAINS = [null, 'blade', 'steel', 'ember', 'mind'];
const STATUS = [null, 'brn', 'psn', 'par', 'slp', 'tox', 'frz'];

function member(sp, moves, ability, item) {
  return { speciesId: sp, level: 50, nature: 'hardy', ability, item, moves };
}

/** One randomised scenario, played twice with different (ability|item) loadouts. */
function play(scn, whoGetsIt, what, kind) {
  const abilA = kind === 'ability' && whoGetsIt === 0 ? what : '__none';
  const abilB = kind === 'ability' && whoGetsIt === 1 ? what : '__none';
  const itemA = kind === 'item' && whoGetsIt === 0 ? what : null;
  const itemB = kind === 'item' && whoGetsIt === 1 ? what : null;

  const state = createBattle({
    seed: scn.seed,
    format: { level: 50, teamSize: 2, bring: 2 },
    sides: [
      { name: 'A', team: [member(scn.sp0, scn.mv0, abilA, itemA), member(scn.sp0b, [scn.mv0[0]], '__none', null)] },
      { name: 'B', team: [member(scn.sp1, scn.mv1, abilB, itemB), member(scn.sp1b, [scn.mv1[0]], '__none', null)] }
    ],
    arena: 'marineford'
  });
  const u = state.sides[0].party[0], t = state.sides[1].party[0];
  u.hp = Math.max(1, Math.floor(u.maxHp * scn.hp0));
  t.hp = Math.max(1, Math.floor(t.maxHp * scn.hp1));
  if (scn.st0) u.status = scn.st0;
  if (scn.st1) t.status = scn.st1;
  if (scn.weather) state.field.weather = { id: scn.weather, turns: 8, source: null };
  if (scn.terrain) state.field.terrain = { id: scn.terrain, turns: 8 };
  u.boosts.atk = scn.b0; t.boosts.def = scn.b1;

  const evs = [];
  for (let i = 0; i < scn.turns && !state.ended; i++) {
    const c0 = scn.switch0 === i ? { kind: 'switch', toSlot: 1 } : { kind: 'move', moveId: scn.mv0[i % scn.mv0.length], target: 'foe' };
    const c1 = scn.switch1 === i ? { kind: 'switch', toSlot: 1 } : { kind: 'move', moveId: scn.mv1[i % scn.mv1.length], target: 'foe' };
    try { evs.push(...submitChoices(state, [c0, c1])); } catch (e) { return `THREW:${e.message}`; }
    let guard = 0;
    while (!state.ended && (state.request[0] === 'switch' || state.request[1] === 'switch') && guard++ < 4) {
      const rc = [null, null];
      for (const s of [0, 1]) if (state.request[s] === 'switch') {
        const side = state.sides[s];
        const idx = side.party.findIndex((m, j) => j !== side.activeIndex && !m.fainted);
        rc[s] = { kind: 'switch', toSlot: idx < 0 ? side.activeIndex : idx };
      }
      try { evs.push(...submitChoices(state, rc)); } catch (e) { return `THREW:${e.message}`; }
    }
  }
  return JSON.stringify(evs);
}

function scenarios(seedBase) {
  const rng = new RNG(seedBase);
  const list = [];
  for (let i = 0; i < N; i++) {
    const pickM = () => (rng.next() < 0.75 ? rng.pick(ATTACKS) : rng.pick(STATUSMOVES)).id;
    list.push({
      seed: 900000 + i * 7919,
      sp0: rng.pick(FIGHTERS).id, sp1: rng.pick(FIGHTERS).id,
      sp0b: rng.pick(FIGHTERS).id, sp1b: rng.pick(FIGHTERS).id,
      mv0: [pickM(), pickM()], mv1: [pickM(), pickM()],
      hp0: rng.next() < 0.3 ? 0.2 : 1, hp1: rng.next() < 0.3 ? 0.25 : 1,
      st0: rng.next() < 0.3 ? rng.pick(STATUS) : null,
      st1: rng.next() < 0.3 ? rng.pick(STATUS) : null,
      weather: rng.next() < 0.4 ? rng.pick(WEATHERS) : null,
      terrain: rng.next() < 0.3 ? rng.pick(TERRAINS) : null,
      b0: rng.next() < 0.2 ? 2 : 0, b1: rng.next() < 0.2 ? 2 : 0,
      turns: 3,
      switch0: rng.next() < 0.15 ? 1 : -1,
      switch1: rng.next() < 0.15 ? 1 : -1
    });
  }
  return list;
}

const SCN = scenarios(4242);

function probe(what, kind) {
  let live = 0; let threw = null;
  for (const scn of SCN) {
    for (const who of [0, 1]) {
      const base = play(scn, who, kind === 'ability' ? '__none' : null, kind);
      const with_ = play(scn, who, what, kind);
      if (String(with_).startsWith('THREW') || String(base).startsWith('THREW')) { threw = with_; continue; }
      if (base !== with_) { live++; break; }
    }
    if (live >= 3) break;   // enough evidence
  }
  return { live, threw };
}

console.log(`\n════ ABILITY / ITEM WIRING — ${N} randomised scenarios each ════\n`);

const deadAb = []; const okAb = [];
for (const [id, a] of Object.entries(ABILITIES)) {
  const r = probe(id, 'ability');
  (r.live > 0 ? okAb : deadAb).push({ id, name: a.name, desc: a.desc, hooks: hooksOf(id), live: r.live, threw: r.threw });
}
console.log(`abilities: ${okAb.length}/${Object.keys(ABILITIES).length} demonstrably change the battle`);
if (deadAb.length) {
  console.log('\n  NEVER FIRED in any scenario:');
  for (const d of deadAb) console.log(`    ${d.id.padEnd(20)} hooks=[${d.hooks.join(',')}]  "${d.desc}"`);
}

const held = heldItems();
const deadIt = []; const okIt = [];
for (const it of held) {
  const r = probe(it.id, 'item');
  (r.live > 0 ? okIt : deadIt).push({ id: it.id, name: it.name, desc: it.desc, live: r.live });
}
console.log(`\nheld items: ${okIt.length}/${held.length} demonstrably change the battle`);
if (deadIt.length) {
  console.log('\n  NEVER FIRED in any scenario:');
  for (const d of deadIt) console.log(`    ${d.id.padEnd(20)} "${d.desc}"`);
}

/* ---- bag items: use them through a real Choice ---- */
console.log('\n── bag items (used via {kind:"item"}) ──');
for (const it of bagItems()) {
  const state = createBattle({
    seed: 555, format: { level: 50, teamSize: 2, bring: 2 },
    sides: [
      { name: 'A', team: [member('zoro', ['draw_cut'], '__none', null), member('nami', ['draw_cut'], '__none', null)], bag: defaultBag() },
      { name: 'B', team: [member('nami', ['draw_cut'], '__none', null), member('zoro', ['draw_cut'], '__none', null)] }
    ], arena: 'marineford'
  });
  const u = state.sides[0].party[0];
  u.hp = Math.max(1, Math.floor(u.maxHp * 0.3));
  u.status = 'psn';
  u.boosts.atk = -2;
  let evs = [];
  try {
    evs = submitChoices(state, [{ kind: 'item', itemId: it.id, targetSlot: 0 }, { kind: 'move', moveId: 'draw_cut', target: 'foe' }]);
  } catch (e) { console.log(`    ${it.id.padEnd(20)} THREW ${e.message}`); continue; }
  const used = evs.some((e) => e.t === 'itemUse' && e.itemId === it.id);
  const effect = evs.some((e) => ['heal', 'statusCure', 'boost', 'volatileEnd'].includes(e.t));
  console.log(`    ${used && effect ? 'PASS' : 'FAIL'}  ${it.id.padEnd(20)} itemUse=${used} visibleEffect=${effect}  "${it.desc ?? ''}"`);
}
