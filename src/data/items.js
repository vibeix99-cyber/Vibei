// Bag items (consumed from the side's inventory) and held items.
// Owned by the abilities & items agent.
//
// ── How item behaviour reaches the engine ────────────────────────────────────
// The engine calls exactly two item entry points itself:
//     runItemHook('modifyDamage', {state, mon:<attacker>, target, move, value})
//     runItemHook('onResidual',   {state, mon, healMon, dealDirect, msg, emit})
// Every other held-item hook is dispatched from `runAbility()` in core/abilities.js,
// which pipes the ability first and then the holder's item through the *same* ctx.
// The split is bookkept by ENGINE_ITEM_HOOKS below so nothing ever fires twice —
// see the comment on `runItemHook`.
//
// Hooks a held item may declare (ctx shapes are the engine's, verbatim):
//   onSwitchIn        {state, mon, emit, msg}                     -> void
//   onStatusImmune    {state, mon, status}                        -> true blocks
//   modifySpeed       {state, mon, value}                         -> number
//   modifyPriority    {state, mon, move, value}                   -> number
//   modifyDamage      {state, mon, target, move, value}           -> number   (engine)
//   modifyDamageTaken {state, mon, attacker, move, value}         -> number
//   onContact         {state, mon, attacker, move, emit, msg}     -> void
//   onResidual        {state, mon, healMon, dealDirect, msg, emit}-> void     (engine)
//
// Purity: no Math.random, no Date, no DOM. All chance rolls go through state.rng.

import { typeEff } from '../core/types.js';
import { STATUSES, HAZARDS, TERRAINS } from '../core/status.js';
import { STAT_NAME, boostText } from '../core/stats.js';
import { computeDamage } from '../core/damage.js';
import { getMove } from './moves.js';

/* ══════════════════════════════════════════════════════════════════════════ */
/* 1. Shared sim helpers                                                      */
/*                                                                            */
/* Ability and item hooks receive a trimmed ctx — `healMon`/`dealDirect` are   */
/* only handed to onResidual, and nothing gets `applyStatus`/`changeBoost`.    */
/* These mirror the engine primitives exactly (same mutations, same events)    */
/* so a hook can act from any hook point without importing engine.js (which    */
/* would be a cycle: engine -> items -> engine).                              */
/* ══════════════════════════════════════════════════════════════════════════ */

export function pushEvent(state, ev) {
  state.events.push(ev);
  if (state.turnEvents) state.turnEvents.push(ev);
  if (ev.t === 'message' && state.log) state.log.push(ev.text);
  return ev;
}

export function say(state, text, style) {
  if (text) pushEvent(state, { t: 'message', text, style });
}

export function label(mon) { return `${mon.side === 0 ? '' : 'Foe '}${mon.nickname}`; }

export function foeOf(state, mon) {
  const s = state.sides[1 - mon.side];
  return s.party[s.activeIndex];
}

/** Mirror of engine.checkFaint (minus Destiny Bond, which only the engine owns). */
export function faintNow(state, mon) {
  if (!mon || mon.fainted || mon.hp > 0) return false;
  mon.hp = 0;
  mon.fainted = true;
  state.sides[mon.side].faints++;
  pushEvent(state, { t: 'faint', side: mon.side, uid: mon.uid });
  say(state, `${label(mon)} fainted!`);
  return true;
}

/** Mirror of engine.dealDirect + checkFaint. */
export function hurt(state, mon, amount, source = 'effect') {
  if (!mon || mon.fainted) return 0;
  const dealt = Math.min(mon.hp, Math.max(0, Math.floor(amount)));
  if (dealt <= 0) return 0;
  mon.hp -= dealt;
  mon.damageTakenThisTurn += dealt;
  mon.timesHit++;
  pushEvent(state, {
    t: 'damage', side: mon.side, uid: mon.uid, amount: dealt,
    hpAfter: mon.hp, maxHp: mon.maxHp, source, eff: 1, crit: false, hits: 1
  });
  faintNow(state, mon);
  return dealt;
}

/** Mirror of engine.healMon. */
export function restore(state, mon, amount, source = 'effect') {
  if (!mon || mon.fainted) return 0;
  const healed = Math.min(mon.maxHp - mon.hp, Math.max(0, Math.floor(amount)));
  if (healed <= 0) return 0;
  mon.hp += healed;
  pushEvent(state, { t: 'heal', side: mon.side, uid: mon.uid, amount: healed, hpAfter: mon.hp, maxHp: mon.maxHp, source });
  return healed;
}

/** Mirror of engine.changeBoost (respects Mist, clamps, emits, narrates). */
export function boostStat(state, mon, stat, delta, source = 'ability') {
  if (!mon || mon.fainted || !delta) return false;
  if (delta < 0 && state.sides[mon.side].screens.mist?.turns) {
    say(state, `${label(mon)} is protected by the mist!`);
    return false;
  }
  const cur = mon.boosts[stat] || 0;
  const next = Math.max(-6, Math.min(6, cur + delta));
  if (next === cur) {
    pushEvent(state, { t: 'boost', side: mon.side, uid: mon.uid, stat, delta: 0, stage: cur, failed: true });
    say(state, `${label(mon)}'s ${STAT_NAME[stat]} won't go ${delta > 0 ? 'higher' : 'lower'}!`);
    return false;
  }
  mon.boosts[stat] = next;
  pushEvent(state, { t: 'boost', side: mon.side, uid: mon.uid, stat, delta: next - cur, stage: next, failed: false, source });
  say(state, `${label(mon)}'s ${boostText(stat, next - cur)}`);
  return true;
}

/* An ability may block a status (onStatusImmune). data/ cannot import core/abilities.js
   without a cycle, so abilities.js registers its probe at module load. */
let abilityStatusGuard = null;
export function registerAbilityStatusGuard(fn) { abilityStatusGuard = fn; }

const STATUS_TYPE_IMMUNE = { brn: ['FLAME'], frz: ['FROST'], par: ['STORM'], psn: ['TOXIN'], tox: ['TOXIN'] };

/** Mirror of engine.applyStatus, including type immunity, Safeguard and ability guards. */
export function giveStatus(state, mon, status, source = 'ability') {
  if (!mon || mon.fainted || mon.status) return false;
  if (state.sides[mon.side].screens.safeguard?.turns && source !== 'self') return false;
  if (STATUS_TYPE_IMMUNE[status]?.some((t) => mon.types.includes(t))) return false;
  if (abilityStatusGuard && abilityStatusGuard(state, mon, status) === true) return false;
  mon.status = status;
  mon.statusTurns = status === 'slp' ? state.rng.range(1, 3) : 0;
  if (status === 'tox') mon.toxicCounter = 1;
  pushEvent(state, { t: 'statusApply', side: mon.side, uid: mon.uid, status });
  say(state, `${label(mon)} ${STATUSES[status].msg}`);
  return true;
}

/** Mirror of engine.cureStatus. */
export function cureAll(state, mon) {
  if (!mon || !mon.status) return false;
  const old = mon.status;
  mon.status = null; mon.statusTurns = 0; mon.toxicCounter = 0;
  pushEvent(state, { t: 'statusCure', side: mon.side, uid: mon.uid, status: old });
  say(state, `${label(mon)} ${STATUSES[old].cure}`);
  return true;
}

export function addVol(state, mon, id, turns = 0) {
  if (!mon || mon.fainted || mon.volatiles[id]) return false;
  mon.volatiles[id] = { turns, data: {} };
  pushEvent(state, { t: 'volatileStart', side: mon.side, uid: mon.uid, id });
  return true;
}

export function removeVol(state, mon, id) {
  if (!mon?.volatiles[id]) return false;
  delete mon.volatiles[id];
  pushEvent(state, { t: 'volatileEnd', side: mon.side, uid: mon.uid, id });
  return true;
}

const WEATHER_TEXT = {
  rain: 'A driving squall sweeps the arena!',
  sun: 'The sun blazes down!',
  sandstorm: 'A sandstorm kicks up!',
  hail: 'A blizzard rolls in!',
  fog: 'Sea fog blankets the field…'
};

/** Mirror of engine.setWeather. Returns false if that weather is already up. */
export function setWeatherNow(state, id, turns = 5, sourceUid = null) {
  if (state.field.weather.id === id) return false;
  state.field.weather = { id, turns, source: sourceUid };
  pushEvent(state, { t: 'weather', id, phase: 'start' });
  say(state, WEATHER_TEXT[id] || '');
  return true;
}

/** Mirror of engine.setTerrain. */
export function setTerrainNow(state, id, turns = 5) {
  if (state.field.terrain.id === id) return false;
  state.field.terrain = { id, turns };
  pushEvent(state, { t: 'terrain', id, phase: 'start' });
  say(state, `The battlefield becomes a ${TERRAINS[id]?.name ?? id}!`);
  return true;
}

export function addHazard(state, sideIndex, id) {
  const s = state.sides[sideIndex];
  const max = HAZARDS[id]?.maxLayers ?? 1;
  const before = s.hazards[id] || 0;
  if (before >= max) return false;
  s.hazards[id] = before + 1;
  pushEvent(state, { t: 'hazard', side: sideIndex, id, layers: s.hazards[id] });
  say(state, `${HAZARDS[id]?.name ?? id} scattered around ${s.name}'s side!`);
  return true;
}

export function clearHazards(state, sideIndex) {
  const s = state.sides[sideIndex];
  const ids = Object.keys(s.hazards).filter((k) => s.hazards[k]);
  if (!ids.length) return false;
  s.hazards = {};
  for (const id of ids) pushEvent(state, { t: 'hazard', side: sideIndex, id, layers: 0 });
  say(state, `The hazards around ${s.name}'s side were swept away!`);
  return true;
}

/** Announce an ability firing (renderer listens for this). */
export function abilityFlash(state, mon, text) {
  pushEvent(state, { t: 'ability', side: mon.side, uid: mon.uid, abilityId: mon.ability });
  if (text) say(state, text);
}

/** Announce a held item firing. `consumed` marks it spent for the rest of the battle. */
export function itemFlash(state, mon, consumed, text) {
  pushEvent(state, { t: 'itemUse', side: mon.side, uid: mon.uid, itemId: mon.item, consumed: !!consumed });
  if (consumed) mon.itemUsed = true;
  if (text) say(state, text);
}

/**
 * Damage scaled as if the target had no positive Def/Sp.Def stages.
 * Exact: re-runs the formula twice with a fixed roll and applies the ratio, so it
 * never touches the battle RNG.
 */
export function ignoreDefBoosts(ctx) {
  const { state, mon, target, move, value } = ctx;
  if (!move || move.category === 'status') return value;
  const key = move.category === 'physical' ? 'def' : 'spd';
  const stage = target?.boosts?.[key] || 0;
  if (stage <= 0) return value;
  const base = {
    rng: null, move, user: mon, target, field: state.field,
    side: state.sides[mon.side], foeSide: state.sides[target.side], crit: false, fixedRoll: 1
  };
  const withBoost = computeDamage(base).damage;
  const flat = computeDamage({ ...base, target: { ...target, boosts: { ...target.boosts, [key]: 0 } } }).damage;
  if (withBoost <= 0) return value;
  return Math.max(1, Math.floor(value * (flat / withBoost)));
}

/** Effectiveness of the incoming move against this holder. */
export function effAgainst(move, mon) { return move ? typeEff(move.type, mon.types) : 1; }

const pct = (v, m) => Math.max(1, Math.floor(v * m));
const frac = (mon, d) => Math.max(1, Math.floor(mon.maxHp / d));

/* ══════════════════════════════════════════════════════════════════════════ */
/* 2. Bag items                                                               */
/*                                                                            */
/* The bag is capped: BAG_USES_PER_BATTLE items per side, per battle. When the */
/* last use is spent the side's remaining stock is zeroed, so the Bag menu     */
/* empties itself and the AI stops reaching for potions. Every bag desc says   */
/* so in UI copy.                                                             */
/* ══════════════════════════════════════════════════════════════════════════ */

export const BAG_USES_PER_BATTLE = 3;

const BAG_TAG = ` (Bag: ${BAG_USES_PER_BATTLE} uses per battle.)`;

/** Called by every bag item's `use`. Spends one of the side's uses. */
function spendBagUse(state, side) {
  const s = state.sides[side];
  s.bagUses = (s.bagUses || 0) + 1;
  if (s.bagUses >= BAG_USES_PER_BATTLE) {
    for (const k of Object.keys(s.items || {})) s.items[k] = 0;
    say(state, `${s.name} is out of supplies — the bag is empty!`);
  }
}

export function bagUsesLeft(state, side) {
  return Math.max(0, BAG_USES_PER_BATTLE - (state.sides[side].bagUses || 0));
}

const I = [];

const bag = (o) => {
  const raw = o.use;
  I.push({
    kind: 'bag', pocket: 'heal', color: '#9ad0ff', ...o,
    desc: o.desc + BAG_TAG,
    use: (ctx) => { spendBagUse(ctx.state, ctx.side); raw(ctx); }
  });
};

bag({
  id: 'potion', name: 'Potion', pocket: 'heal', color: '#7fffc4',
  desc: 'Restores 40 HP to one fighter.',
  use: ({ state, target }) => {
    if (target.fainted) { say(state, 'But it had no effect!'); return; }
    if (restore(state, target, 40, 'item')) say(state, `${target.nickname} recovered health!`);
    else say(state, `${target.nickname} is already at full health!`);
  }
});
bag({
  id: 'super_potion', name: 'Super Potion', pocket: 'heal', color: '#7fffc4',
  desc: 'Restores 70 HP to one fighter.',
  use: ({ state, target }) => {
    if (target.fainted) { say(state, 'But it had no effect!'); return; }
    if (restore(state, target, 70, 'item')) say(state, `${target.nickname} recovered health!`);
    else say(state, `${target.nickname} is already at full health!`);
  }
});
bag({
  id: 'hyper_potion', name: 'Hyper Potion', pocket: 'heal', color: '#7fffc4',
  desc: 'Restores 120 HP to one fighter.',
  use: ({ state, target }) => {
    if (target.fainted) { say(state, 'But it had no effect!'); return; }
    if (restore(state, target, 120, 'item')) say(state, `${target.nickname} recovered health!`);
    else say(state, `${target.nickname} is already at full health!`);
  }
});
bag({
  id: 'full_restore', name: 'Full Restore', pocket: 'heal', color: '#c8ffe0',
  desc: 'Fully restores HP and cures any status.',
  use: ({ state, target }) => {
    if (target.fainted) { say(state, 'But it had no effect!'); return; }
    restore(state, target, target.maxHp, 'item');
    cureAll(state, target);
    say(state, `${target.nickname} is back on its feet!`);
  }
});
bag({
  id: 'full_heal', name: 'Full Heal', pocket: 'status', color: '#ffd47f',
  desc: 'Cures any status condition and confusion.',
  use: ({ state, target }) => {
    const had = !!target.status || !!target.volatiles.confusion;
    cureAll(state, target);
    if (target.volatiles.confusion) { removeVol(state, target, 'confusion'); say(state, `${target.nickname} snapped out of confusion!`); }
    if (!had) say(state, 'But it had no effect!');
  }
});
bag({
  id: 'antidote', name: 'Antidote', pocket: 'status', color: '#8bc34a',
  desc: 'Cures poison only — cheap, and always in stock.',
  use: ({ state, target }) => {
    if (target.status === 'psn' || target.status === 'tox') cureAll(state, target);
    else say(state, 'But it had no effect!');
  }
});
bag({
  id: 'awakening', name: 'Awakening', pocket: 'status', color: '#8fa3c9',
  desc: 'Wakes a sleeping fighter.',
  use: ({ state, target }) => {
    if (target.status === 'slp') cureAll(state, target);
    else say(state, 'But it had no effect!');
  }
});
bag({
  id: 'revive', name: 'Revive', pocket: 'heal', color: '#ffe9a3',
  desc: 'Revives a fainted fighter to half HP.',
  use: ({ state, target }) => {
    if (!target.fainted) { say(state, 'But it had no effect!'); return; }
    target.fainted = false; target.hp = 0;
    state.sides[target.side].faints = Math.max(0, state.sides[target.side].faints - 1);
    restore(state, target, Math.floor(target.maxHp / 2), 'item');
    say(state, `${target.nickname} was revived!`);
  }
});
bag({
  id: 'x_attack', name: 'X Attack', pocket: 'battle', color: '#ff8a5c',
  desc: 'Sharply raises the active fighter\'s Attack.',
  use: ({ state, target }) => boostStat(state, target, 'atk', 2, 'item')
});
bag({
  id: 'x_defense', name: 'X Defense', pocket: 'battle', color: '#9aa7b5',
  desc: 'Sharply raises the active fighter\'s Defense.',
  use: ({ state, target }) => boostStat(state, target, 'def', 2, 'item')
});
bag({
  id: 'x_special', name: 'X Special', pocket: 'battle', color: '#7fd8ff',
  desc: 'Sharply raises the active fighter\'s Sp. Atk.',
  use: ({ state, target }) => boostStat(state, target, 'spa', 2, 'item')
});
bag({
  id: 'x_speed', name: 'X Speed', pocket: 'battle', color: '#a7e8c0',
  desc: 'Sharply raises the active fighter\'s Speed.',
  use: ({ state, target }) => boostStat(state, target, 'spe', 2, 'item')
});
bag({
  id: 'dire_hit', name: 'Dire Hit', pocket: 'battle', color: '#ff5a5a',
  desc: 'Raises the active fighter\'s critical-hit rate by two stages.',
  use: ({ state, target }) => {
    target.critStageBonus = Math.min(4, (target.critStageBonus || 0) + 2);
    say(state, `${target.nickname} is fired up! Critical hits will come easily!`);
  }
});

/* ══════════════════════════════════════════════════════════════════════════ */
/* 3. Held items                                                              */
/* Every one is a trade: a real gain paid for with a real cost or a           */
/* single-use consumption.                                                    */
/* ══════════════════════════════════════════════════════════════════════════ */

const hold = (o) => { I.push({ kind: 'held', pocket: 'held', color: '#c8a24b', ...o }); };

/* ---- flat offensive bands (cheap, unconditional, small) ---- */

hold({
  id: 'power_band', name: 'Power Band', color: '#ff8a5c',
  desc: 'Physical moves deal 20% more damage.',
  hooks: { modifyDamage: ({ move, value }) => (move.category === 'physical' ? pct(value, 1.2) : value) }
});
hold({
  id: 'focus_lens', name: 'Focus Lens', color: '#7fd8ff',
  desc: 'Special moves deal 20% more damage.',
  hooks: { modifyDamage: ({ move, value }) => (move.category === 'special' ? pct(value, 1.2) : value) }
});
hold({
  id: 'expert_belt', name: 'Expert Belt', color: '#d4a24b',
  desc: 'Super-effective moves deal 25% more damage.',
  hooks: { modifyDamage: (ctx) => (typeEff(ctx.move.type, ctx.target.types) > 1 ? pct(ctx.value, 1.25) : ctx.value) }
});

/* ---- type charms: +30% to one type, useless to everyone else ---- */

const TYPE_CHARMS = [
  ['flame_charm', 'Ember Charm', 'FLAME', '#ff5a36'],
  ['tide_charm', 'Tide Charm', 'SEA', '#2a7fd4'],
  ['storm_coil', 'Storm Coil', 'STORM', '#f5c542'],
  ['blade_oil', 'Blade Oil', 'SLASH', '#c9d4e0'],
  ['haki_stone', 'Haki Stone', 'HAKI', '#2b2d42'],
  ['knuckle_wrap', 'Knuckle Wrap', 'FIST', '#e8743b'],
  ['frost_prism', 'Frost Prism', 'FROST', '#7fd8ff'],
  ['void_shard', 'Void Shard', 'VOID', '#3a2f5b']
];
for (const [id, name, type, color] of TYPE_CHARMS) {
  hold({
    id, name, color, boostType: type,
    desc: `${type} moves deal 30% more damage. Nothing else does.`,
    hooks: { modifyDamage: ({ move, value }) => (move.type === type ? pct(value, 1.3) : value) }
  });
}

/* ---- choice items: big number, one move ---- */

function choiceUnlock(state, mon) {
  let any = false;
  for (const slot of mon.moves) if (slot.disabled) { slot.disabled = false; any = true; }
  return any;
}
function choiceLock(state, mon) {
  if (!mon.movedThisTurn || !mon.lastMoveId) return;
  if (!mon.moves.some((m) => m.id === mon.lastMoveId)) return;   // Struggle etc.
  let locked = false;
  for (const slot of mon.moves) {
    if (slot.id === mon.lastMoveId || slot.disabled) continue;
    slot.disabled = true; locked = true;
  }
  if (locked) {
    itemFlash(state, mon, false);
    say(state, `${label(mon)} is locked into ${getMove(mon.lastMoveId)?.name || mon.lastMoveId}!`);
  }
}
const CHOICE_HOOKS = { onSwitchIn: ({ state, mon }) => { choiceUnlock(state, mon); }, onResidual: ({ state, mon }) => choiceLock(state, mon) };

hold({
  id: 'choice_edge', name: 'Choice Edge', color: '#e05c3c',
  desc: 'Physical moves deal 50% more damage, but its holder is locked into the first move it picks until it switches out.',
  hooks: { ...CHOICE_HOOKS, modifyDamage: ({ move, value }) => (move.category === 'physical' ? pct(value, 1.5) : value) }
});
hold({
  id: 'choice_lens', name: 'Choice Lens', color: '#5c8ce0',
  desc: 'Special moves deal 50% more damage, but its holder is locked into the first move it picks until it switches out.',
  hooks: { ...CHOICE_HOOKS, modifyDamage: ({ move, value }) => (move.category === 'special' ? pct(value, 1.5) : value) }
});
hold({
  id: 'log_pose_scarf', name: 'Log Pose Scarf', color: '#f2c94c',
  desc: 'Speed is raised 50%, but its holder is locked into the first move it picks until it switches out.',
  hooks: { ...CHOICE_HOOKS, modifySpeed: ({ value }) => Math.max(1, Math.floor(value * 1.5)) }
});

/* ---- the power-for-pain trade ---- */

hold({
  id: 'weighted_bands', name: 'Weighted Bands', color: '#9aa7b5',
  desc: 'All moves deal 50% more damage, but Speed is halved.',
  hooks: { modifyDamage: ({ value }) => pct(value, 1.5) }   // the Speed halving is applied by engine.speedOf
});
hold({
  id: 'cursed_cutlass', name: 'Cursed Cutlass', color: '#8a2a4a',
  desc: 'All moves deal 30% more damage; its holder loses 1/10 of its max HP at the end of any turn it attacked.',
  hooks: {
    modifyDamage: ({ state, mon, value }) => { mon._orbTurn = state.turn; return pct(value, 1.3); },
    onResidual: ({ state, mon }) => {
      if (mon._orbTurn !== state.turn) return;
      itemFlash(state, mon, false);
      say(state, `The Cursed Cutlass drinks from ${label(mon)}!`);
      hurt(state, mon, frac(mon, 10), 'item');
    }
  }
});
hold({
  id: 'war_drum', name: 'War Drum', color: '#b5652a',
  desc: 'Repeating the same move builds momentum: +20% damage per consecutive turn, up to +100%.',
  hooks: {
    onSwitchIn: ({ mon }) => { mon._drumMove = null; mon._drumCount = 0; mon._drumTurn = -1; },
    modifyDamage: ({ state, mon, move, value }) => {
      if (mon._drumMove !== move.id) { mon._drumMove = move.id; mon._drumCount = 0; }
      else if (mon._drumTurn !== state.turn) mon._drumCount = Math.min(5, (mon._drumCount || 0) + 1);
      mon._drumTurn = state.turn;
      return pct(value, 1 + 0.2 * (mon._drumCount || 0));
    }
  }
});
hold({
  id: 'iron_gi', name: 'Iron Gi', color: '#6b7280',
  desc: 'Takes 25% less damage from everything, but its holder\'s own moves deal 20% less.',
  hooks: {
    modifyDamage: ({ value }) => pct(value, 0.8),
    modifyDamageTaken: ({ value }) => pct(value, 0.75)
  }
});
hold({
  id: 'marine_vest', name: 'Marine Vest', color: '#2a4f8f',
  desc: 'Takes 35% less special damage, but its holder cannot use status moves at all.',
  hooks: {
    onSwitchIn: ({ state, mon }) => {
      let any = false;
      for (const slot of mon.moves) {
        const mv = getMove(slot.id);
        if (mv?.category === 'status' && !slot.disabled) { slot.disabled = true; any = true; }
      }
      if (any) { itemFlash(state, mon, false); say(state, `${label(mon)}'s vest is too heavy for finesse.`); }
    },
    modifyDamageTaken: ({ move, value }) => (move.category === 'special' ? pct(value, 0.65) : value)
  }
});

/* ---- sustain ---- */

hold({
  id: 'leftovers', name: 'Ship Rations', color: '#c8a24b',
  desc: 'Restores 1/16 of max HP at the end of every turn.',
  hooks: {
    onResidual: ({ state, mon }) => {
      if (mon.hp >= mon.maxHp) return;
      restore(state, mon, frac(mon, 16), 'item');
      say(state, `${label(mon)} nibbles its rations.`);
    }
  }
});
hold({
  id: 'sea_stone_band', name: 'Sea-Stone Band', color: '#2a7fd4',
  desc: 'Its holder cannot be given a status condition. (No offensive bonus at all.)',
  hooks: { onStatusImmune: () => true }
});

/* ---- survival ---- */

hold({
  id: 'straw_charm', name: 'Straw Charm', color: '#f5d547',
  desc: 'If its holder is at full HP, it survives any one KO blow with 1 HP. Single use.',
  hooks: {
    modifyDamageTaken: ({ state, mon, value }) => {
      if (mon.hp < mon.maxHp || value < mon.hp) return value;
      itemFlash(state, mon, true, `${label(mon)} hung on with the Straw Charm!`);
      return mon.hp - 1;
    }
  }
});

/* ---- berries ---- */

hold({
  id: 'sitrus_fruit', name: 'Sitrus Fruit', color: '#b8e05c',
  desc: 'At the end of a turn spent below half HP, restores 1/4 of max HP. Single use.',
  hooks: {
    onResidual: ({ state, mon }) => {
      if (mon.hp <= 0 || mon.hp * 2 > mon.maxHp) return;
      itemFlash(state, mon, true, `${label(mon)} ate its Sitrus Fruit!`);
      restore(state, mon, frac(mon, 4), 'item');
    }
  }
});
hold({
  id: 'pinch_pepper', name: 'Pinch Pepper', color: '#e04a3c',
  desc: 'At the end of a turn spent below 1/4 HP, restores 1/3 of max HP and raises Attack. Single use.',
  hooks: {
    onResidual: ({ state, mon }) => {
      if (mon.hp <= 0 || mon.hp * 4 > mon.maxHp) return;
      itemFlash(state, mon, true, `${label(mon)} bit into the Pinch Pepper!`);
      restore(state, mon, frac(mon, 3), 'item');
      boostStat(state, mon, 'atk', 1, 'item');
    }
  }
});
hold({
  id: 'cure_plum', name: 'Cure Plum', color: '#d06ad0',
  desc: 'Cures any status condition at the end of the turn. Single use.',
  hooks: {
    onResidual: ({ state, mon }) => {
      if (!mon.status) return;
      itemFlash(state, mon, true, `${label(mon)} ate its Cure Plum!`);
      cureAll(state, mon);
    }
  }
});
hold({
  id: 'mint_leaf', name: 'Mint Leaf', color: '#6fe3b0',
  desc: 'Clears confusion at the end of the turn. Single use.',
  hooks: {
    onResidual: ({ state, mon }) => {
      if (!mon.volatiles.confusion) return;
      itemFlash(state, mon, true, `${label(mon)} chewed a Mint Leaf and cleared its head!`);
      removeVol(state, mon, 'confusion');
    }
  }
});

/* ---- resist berries: eaten by one super-effective hit ---- */

const WARD_BERRIES = [
  ['char_plum', 'Char Plum', 'FLAME', '#ff7a4a', 0.5],
  ['brine_plum', 'Brine Plum', 'SEA', '#4a9fe0', 0.5],
  ['grave_plum', 'Grave Plum', 'HAKI', '#4a4f8f', 0.5]
];
for (const [id, name, type, color, mul] of WARD_BERRIES) {
  hold({
    id, name, color, wardType: type,
    desc: `Halves the damage of one super-effective ${type} hit, then is used up.`,
    hooks: {
      modifyDamageTaken: ({ state, mon, move, value }) => {
        if (move.type !== type || typeEff(move.type, mon.types) <= 1) return value;
        itemFlash(state, mon, true, `${label(mon)} ate its ${name} and weathered the blow!`);
        return pct(value, mul);
      }
    }
  });
}
hold({
  id: 'ward_plum', name: 'Ward Plum', color: '#c8d06a',
  desc: 'Cuts the damage of one super-effective hit of any type by a third, then is used up.',
  hooks: {
    modifyDamageTaken: ({ state, mon, move, value }) => {
      if (typeEff(move.type, mon.types) <= 1) return value;
      itemFlash(state, mon, true, `${label(mon)} ate its Ward Plum!`);
      return pct(value, 0.667);
    }
  }
});

/* ---- field-setting stones (single use, on entry) ---- */

const WEATHER_STONES = [
  ['sun_stone', 'Sun Stone', 'sun', '#ffb03a', 'Blazing Sun'],
  ['squall_stone', 'Squall Stone', 'rain', '#4a9fe0', 'a Squall'],
  ['sand_stone', 'Sand Stone', 'sandstorm', '#c8a165', 'a Sandstorm'],
  ['frost_stone', 'Frost Stone', 'hail', '#bfe8ff', 'a Blizzard']
];
for (const [id, name, weather, color, human] of WEATHER_STONES) {
  hold({
    id, name, color, weather,
    desc: `On entry, calls up ${human} for 8 turns — twice as long as a move would. Single use.`,
    hooks: {
      onSwitchIn: ({ state, mon }) => {
        if (state.field.weather.id === weather) return;
        itemFlash(state, mon, true, `${label(mon)}'s ${name} cracks open!`);
        setWeatherNow(state, weather, 8, mon.uid);
      }
    }
  });
}

/* ---- utility ---- */

hold({
  id: 'prism_boots', name: 'Prism Boots', color: '#8fd0c0',
  desc: 'Entry hazards are shaken off the instant its holder lands — their damage and effects are undone.',
  hooks: {
    onSwitchIn: ({ state, mon }) => {
      // Walk back to this mon's switchIn event; everything after it came from hazards.
      const ev = state.events;
      let start = -1;
      for (let i = ev.length - 1; i >= 0; i--) {
        if (ev[i].t === 'switchIn' && ev[i].uid === mon.uid) { start = i; break; }
      }
      if (start < 0) return;
      let healed = 0; let undone = false;
      for (let i = start + 1; i < ev.length; i++) {
        const e = ev[i];
        if (e.uid !== mon.uid) continue;
        if (e.t === 'damage' && e.source === 'hazard') { healed += e.amount; undone = true; }
        else if (e.t === 'boost' && !e.failed && e.source === 'hazard') {
          mon.boosts[e.stat] = Math.max(-6, Math.min(6, (mon.boosts[e.stat] || 0) - e.delta));
          undone = true;
        }
      }
      const hadStatus = mon.status && start >= 0 && ev.slice(start + 1).some((e) => e.t === 'statusApply' && e.uid === mon.uid);
      if (!undone && !hadStatus) return;
      itemFlash(state, mon, false, `${label(mon)}'s Prism Boots shrug off the hazards!`);
      if (healed > 0) restore(state, mon, healed, 'item');
      if (hadStatus) cureAll(state, mon);
    }
  }
});
hold({
  id: 'quick_charm', name: 'Quick Charm', color: '#e0e05c',
  desc: 'Its holder has a 20% chance each turn to move first in its priority bracket.',
  hooks: {
    modifyPriority: ({ state, mon, value }) => {
      if (mon._qcTurn !== state.turn) { mon._qcTurn = state.turn; mon._qcRoll = state.rng.chance(20); }
      return mon._qcRoll ? value + 1 : value;
    }
  }
});
hold({
  id: 'spiked_guard', name: 'Spiked Guard', color: '#8a8a9a',
  desc: 'Attackers that make contact lose 1/6 of their max HP. No offensive bonus.',
  hooks: {
    onContact: ({ state, mon, attacker }) => {
      if (!attacker || attacker.fainted) return;
      itemFlash(state, mon, false);
      say(state, `${label(attacker)} is torn on ${label(mon)}'s Spiked Guard!`);
      hurt(state, attacker, frac(attacker, 6), 'item');
    }
  }
});
hold({
  id: 'shell_bell', name: 'Shell Bell', color: '#f0d8a0',
  desc: 'Heals 1/12 of max HP at the end of any turn its holder landed an attack.',
  hooks: {
    modifyDamage: ({ state, mon, value }) => { mon._bellTurn = state.turn; return value; },
    onResidual: ({ state, mon }) => {
      if (mon._bellTurn !== state.turn || mon.hp >= mon.maxHp) return;
      restore(state, mon, frac(mon, 12), 'item');
      say(state, `${label(mon)}'s Shell Bell chimes.`);
    }
  }
});

/* ══════════════════════════════════════════════════════════════════════════ */
/* 4. Registry + engine-facing dispatch                                       */
/* ══════════════════════════════════════════════════════════════════════════ */

export const ITEMS = I;
export const ITEM_BY_ID = Object.fromEntries(I.map((x) => [x.id, x]));
export function getItem(id) { return ITEM_BY_ID[id]; }
export function bagItems() { return I.filter((x) => x.kind === 'bag'); }
export function heldItems() { return I.filter((x) => x.kind === 'held'); }
export function itemList() { return I; }

export function defaultBag() {
  // Deliberately more stock than the 3-use cap so the *choice* matters, not the count.
  return { potion: 2, super_potion: 2, hyper_potion: 1, full_heal: 2, revive: 1, x_attack: 1, x_speed: 1 };
}

/** The live held item of a combatant, or null if it has none / already spent it. */
export function heldItemOf(mon) {
  if (!mon || !mon.item || mon.itemUsed) return null;
  const it = ITEM_BY_ID[mon.item];
  return it && it.kind === 'held' ? it : null;
}

/**
 * Hook names the ENGINE dispatches to items itself. `runAbility` must not also
 * fire the item for these or every effect would apply twice.
 *
 * This list is FROZEN and must be edited by hand to match engine.js's actual
 * `runItemHook(...)` call sites. It used to grow itself at runtime, which made
 * the simulation depend on what the process had already done: the engine calls
 * `runItemHook('onStatusImmune')`, so the first status attempt in a process
 * silently added that name and changed every later battle. The same seed and
 * the same choices then produced two different event streams — "Foe Nami
 * shrugs it off!" in a cold process, "Foe Nami's Sea-Stone Band shields it!"
 * afterwards. That breaks replays, netplay and AI search, which are the whole
 * reason src/core is pure. Keep it static; `assertEngineHooks` below is the
 * guard that stops it drifting out of sync.
 */
const ENGINE_ITEM_HOOKS = Object.freeze(['onStatusImmune', 'modifyDamage', 'onResidual']);
export function itemHookIsEngineDriven(name) { return ENGINE_ITEM_HOOKS.includes(name); }
export function engineItemHooks() { return ENGINE_ITEM_HOOKS.slice(); }

export function dispatchItemHook(hookName, ctx) {
  const item = heldItemOf(ctx.mon);
  const fn = item?.hooks?.[hookName];
  if (!fn) return ctx.value;
  const r = fn(ctx);
  return r === undefined ? ctx.value : r;
}

/**
 * Engine entry point for held-item hooks. Deliberately stateless: if you add a
 * `runItemHook` call in engine.js for a hook not in ENGINE_ITEM_HOOKS, add the
 * name to that list too, or the item will fire twice (once here, once through
 * runAbility). `tools/hookaudit.mjs` checks the two agree.
 */
export function runItemHook(hookName, ctx) {
  return dispatchItemHook(hookName, ctx);
}

/** Every hook name any held item declares — used by the coverage test. */
export function itemHookNames() {
  const s = new Set();
  for (const it of I) for (const k of Object.keys(it.hooks || {})) s.add(k);
  return [...s];
}
