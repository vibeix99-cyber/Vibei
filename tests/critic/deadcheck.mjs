// CRITIC — hand-built situations for the abilities/items the differential probe
// never saw fire, plus a corrected bag-item run.

import { createBattle, submitChoices } from '../../src/core/engine.js';
import { MOVES, getMove } from '../../src/data/moves.js';
import { ABILITIES } from '../../src/core/abilities.js';
import { bagItems, defaultBag, ITEMS } from '../../src/data/items.js';
import { arena, turn, mv, pick, has, texts, RiggedRNG } from './lib.mjs';

const out = [];
const T = (n, f) => { try { const r = f(); out.push({ n, ...r }); } catch (e) { out.push({ n, ok: false, note: `threw ${e.message}` }); } };

const norm = (m, f = 1) => { m.maxHp = 500; m.hp = Math.floor(500 * f); };

/* operating_room — "MIND moves ignore the target's Def/SpD boosts" */
T('operating_room ignores the target\'s defensive boosts', () => {
  const mind = MOVES.find((m) => m.type === 'MIND' && m.category === 'special' && m.power >= 60);
  const run = (abil) => {
    const a = arena({ userSpecies: 'law', targetSpecies: 'zoro', userMoves: [mind.id], targetMoves: ['draw_cut'], userAbility: abil, rig: 0.99 });
    norm(a.user); norm(a.target); a.target.boosts.spd = 4;
    return pick(turn(a.state, mv(mind.id), mv('draw_cut')), 'damage', (x) => x.uid === a.target.uid && x.source === 'move')[0]?.amount ?? 0;
  };
  const off = run('__none'), on = run('operating_room');
  return { ok: on > off, note: `${mind.id} vs +4 SpD — without ${off}, with ${on}` };
});

/* mimicry — copies the foe's ability on entry */
T('mimicry copies the foe ability on entry', () => {
  const a = arena({ userSpecies: 'law', targetSpecies: 'zoro', userMoves: ['draw_cut'], targetMoves: ['draw_cut'], userAbility: '__none', targetAbility: 'iron_fist' });
  // put the mimicry holder on the bench and switch it in
  a.state.sides[0].party[1].ability = 'mimicry';
  norm(a.user); norm(a.target);
  const e = turn(a.state, { kind: 'switch', toSlot: 1 }, mv('draw_cut'));
  const now = a.state.sides[0].party[1].ability;
  return { ok: now === 'iron_fist', note: `after entry its ability is "${now}" (foe has iron_fist); events: ${e.filter((x) => x.t === 'ability').map((x) => x.abilityId).join(',') || 'none'}` };
});

/* clean_sweep — clears hazards on its own side as it enters */
T('clean_sweep clears its own side\'s hazards on entry', () => {
  const hz = MOVES.find((m) => m.effects?.some((e) => e.kind === 'hazard'));
  const a = arena({ userSpecies: 'law', targetSpecies: 'zoro', userMoves: ['draw_cut'], targetMoves: [hz.id, 'draw_cut'] });
  a.state.sides[0].party[1].ability = 'clean_sweep';
  norm(a.user); norm(a.target);
  turn(a.state, mv('draw_cut'), mv(hz.id));
  const before = JSON.stringify(a.state.sides[0].hazards);
  const e = turn(a.state, { kind: 'switch', toSlot: 1 }, mv('draw_cut'));
  const after = JSON.stringify(a.state.sides[0].hazards);
  return { ok: before !== '{}' && after === '{}', note: `hazards before entry ${before} → after ${after}` };
});

/* harvest_luck — 50%/turn to bring back a consumed held item */
T('harvest_luck restores a consumed held item', () => {
  const berry = ITEMS.find((i) => i.kind === 'held' && /restore|heal|berry|eats/i.test(i.desc || ''));
  const a = arena({ userSpecies: 'law', targetSpecies: 'zoro', userMoves: ['draw_cut'], targetMoves: ['draw_cut'], userAbility: 'harvest_luck', userItem: berry?.id ?? null, rig: 0.0001 });
  norm(a.user, 0.2); norm(a.target);
  a.user.itemUsed = true; a.user.item = null; a.user.usedItemId = berry?.id;
  const e = turn(a.state, mv('draw_cut'), mv('draw_cut'));
  return { ok: a.user.item === (berry?.id ?? null) && !!berry, note: `item after a turn with harvest_luck: ${a.user.item} (was consumed ${berry?.id}); itemUse events: ${e.filter((x) => x.t === 'itemUse').length}` };
});

/* mint_leaf — clears confusion at end of turn */
T('mint_leaf clears confusion', () => {
  const a = arena({ userSpecies: 'law', targetSpecies: 'zoro', userMoves: ['draw_cut'], targetMoves: ['draw_cut'], userItem: 'mint_leaf' });
  norm(a.user); norm(a.target);
  a.user.volatiles.confusion = { turns: 5, data: {} };
  const e = turn(a.state, mv('draw_cut'), mv('draw_cut'));
  return { ok: !a.user.volatiles.confusion, note: `confusion still present=${!!a.user.volatiles.confusion}; itemUse=${has(e, 'itemUse')}` };
});

/* prism_boots — undoes hazard damage on entry */
T('prism_boots negates entry hazards', () => {
  const hz = MOVES.find((m) => m.effects?.some((e) => e.kind === 'hazard'));
  const run = (item) => {
    const a = arena({ userSpecies: 'law', targetSpecies: 'zoro', userMoves: ['draw_cut'], targetMoves: [hz.id, 'draw_cut'] });
    a.state.sides[0].party[1].item = item;
    norm(a.user); norm(a.target);
    turn(a.state, mv('draw_cut'), mv(hz.id));
    const e = turn(a.state, { kind: 'switch', toSlot: 1 }, mv('draw_cut'));
    return pick(e, 'damage', (x) => x.uid === a.state.sides[0].party[1].uid && x.source !== 'move')
      .reduce((s, x) => s + x.amount, 0);
  };
  const bare = run(null), booted = run('prism_boots');
  return { ok: bare > 0 && booted === 0, note: `entry damage bare ${bare} → with prism_boots ${booted}` };
});

/* ---- bag items, with the bag in the right place (side.items) ---- */
console.log('\n── bag items (side.items stocked) ──');
const bagRows = [];
for (const it of bagItems()) {
  const stock = {}; for (const b of bagItems()) stock[b.id] = 5;
  const state = createBattle({
    seed: 555, format: { level: 50, teamSize: 2, bring: 2 },
    sides: [
      { name: 'A', items: stock, team: [
        { speciesId: 'zoro', level: 50, ability: '__none', item: null, moves: ['draw_cut'] },
        { speciesId: 'nami', level: 50, ability: '__none', item: null, moves: ['draw_cut'] }] },
      { name: 'B', team: [
        { speciesId: 'nami', level: 50, ability: '__none', item: null, moves: ['draw_cut'] },
        { speciesId: 'zoro', level: 50, ability: '__none', item: null, moves: ['draw_cut'] }] }
    ], arena: 'marineford'
  });
  const u = state.sides[0].party[0];
  u.maxHp = 500; u.hp = 100; u.status = 'psn'; u.volatiles.confusion = { turns: 4, data: {} };
  if (it.id === 'awakening') u.status = 'slp';
  if (it.id === 'revive') { state.sides[0].party[1].fainted = true; state.sides[0].party[1].hp = 0; }
  const target = it.id === 'revive' ? 1 : 0;
  const evs = submitChoices(state, [{ kind: 'item', itemId: it.id, targetSlot: target }, { kind: 'move', moveId: 'draw_cut', target: 'foe' }]);
  const used = evs.some((e) => e.t === 'itemUse' && e.itemId === it.id);
  const effect = evs.some((e) => ['heal', 'statusCure', 'boost', 'volatileEnd'].includes(e.t));
  const line = evs.filter((e) => e.t === 'message').map((e) => e.text).slice(0, 2).join(' | ');
  bagRows.push({ id: it.id, used, effect, line });
}
for (const r of bagRows) console.log(`   ${r.used && r.effect ? 'PASS' : 'FAIL'}  ${r.id.padEnd(16)} itemUse=${r.used} effect=${r.effect}  "${r.line}"`);

console.log('\n── hand-built probes ──');
for (const r of out) { console.log(`   ${r.ok ? 'PASS' : 'FAIL'}  ${r.n}`); if (r.note) console.log(`          ${r.note}`); }
