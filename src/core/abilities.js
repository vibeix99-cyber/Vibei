// Passive abilities. Owned by the abilities & items agent.
//
// ── The hook contract ────────────────────────────────────────────────────────
// These are the ONLY hooks the engine calls, with exactly these ctx shapes.
// An ability that declares anything else is dead weight; an ability whose `desc`
// promises more than its hooks deliver is a lie to the player. Both are checked
// by tools/abilitytest.mjs.
//
//   onSwitchIn        {state, mon, emit, msg}                       -> void
//                     fires in doSwitchIn(), AFTER entry hazards resolve.
//   onStatusImmune    {state, mon, status}                          -> true blocks
//   modifySpeed       {state, mon, value}                           -> number
//   modifyPriority    {state, mon, move, value}                     -> number
//   modifyDamage      {state, mon:<attacker>, target, move, value}   -> number  (per hit)
//   modifyDamageTaken {state, mon:<defender>, attacker, move, value} -> number  (per hit)
//   onContact         {state, mon:<defender>, attacker, move, emit, msg} -> void
//   onResidual        {state, mon, healMon, dealDirect, msg, emit}  -> void
//
// The engine's ctx is deliberately thin (no applyStatus, no changeBoost outside
// its own primitives), so hooks use the mirrored primitives exported by
// data/items.js — they mutate and emit exactly like the engine's own.
//
// Purity: no Math.random, no Date, no DOM. Every roll goes through state.rng.

import {
  pushEvent, say, label, foeOf,
  hurt, restore, boostStat, giveStatus, cureAll, addVol, removeVol,
  setWeatherNow, setTerrainNow, addHazard, clearHazards,
  abilityFlash, ignoreDefBoosts,
  registerAbilityStatusGuard, dispatchItemHook, itemHookIsEngineDriven
} from '../data/items.js';

/* An ability may block a status inflicted by another ability/item. */
registerAbilityStatusGuard((state, mon, status) => runAbility('onStatusImmune', { state, mon, status }) === true);

const pct = (v, m) => Math.max(1, Math.floor(v * m));
const frac = (mon, d) => Math.max(1, Math.floor(mon.maxHp / d));
/** True at most once per turn for a given marker. */
const oncePerTurn = (mon, key, turn) => {
  if (mon[key] === turn) return false;
  mon[key] = turn;
  return true;
};

export const ABILITIES = {

  /* ───────────────────────── conditional damage ───────────────────────── */

  three_blades: {
    name: 'Three Blades', desc: 'Slicing moves deal 30% more damage.',
    modifyDamage: ({ move, value }) => (move.flags?.includes('slice') ? pct(value, 1.3) : value)
  },
  iron_fist: {
    name: 'Iron Fist', desc: 'Punching moves deal 30% more damage.',
    modifyDamage: ({ move, value }) => (move.flags?.includes('punch') ? pct(value, 1.3) : value)
  },
  amplifier: {
    name: 'Amplifier', desc: 'Sound-based moves deal 40% more damage.',
    modifyDamage: ({ move, value }) => (move.flags?.includes('sound') ? pct(value, 1.4) : value)
  },
  technician: {
    name: 'Technician', desc: 'Moves of 60 power or less deal 50% more damage.',
    modifyDamage: ({ move, value }) => (move.power > 0 && move.power <= 60 ? pct(value, 1.5) : value)
  },
  overwhelm: {
    name: 'Overwhelm', desc: 'Moves of 100 power or more deal 20% more damage.',
    modifyDamage: ({ move, value }) => (move.power >= 100 ? pct(value, 1.2) : value)
  },
  opportunist: {
    name: 'Opportunist', desc: 'Deals 30% more damage to targets with a status condition.',
    modifyDamage: ({ target, value }) => (target?.status ? pct(value, 1.3) : value)
  },
  finisher: {
    name: 'Finisher', desc: 'Deals 30% more damage to targets below half HP.',
    modifyDamage: ({ target, value }) => (target && target.hp * 2 <= target.maxHp ? pct(value, 1.3) : value)
  },
  berserker: {
    name: 'Berserker', desc: 'While below a third of its own HP, its moves deal 50% more damage.',
    modifyDamage: ({ mon, value }) => (mon.hp * 3 <= mon.maxHp ? pct(value, 1.5) : value)
  },
  guts_haki: {
    name: 'Guts', desc: 'While suffering any status condition, its moves deal 50% more damage.',
    modifyDamage: ({ mon, value }) => (mon.status ? pct(value, 1.5) : value)
  },
  late_bloomer: {
    name: 'Late Bloomer', desc: 'Its moves gain 10% damage for every turn it has stayed in, up to +50%.',
    modifyDamage: ({ mon, value }) => pct(value, 1 + 0.1 * Math.min(5, mon.turnsActive || 0))
  },
  blue_flame: {
    name: 'Blue Flame', desc: 'FLAME moves deal 20% more damage. Cannot be burned.',
    modifyDamage: ({ move, value }) => (move.type === 'FLAME' ? pct(value, 1.2) : value),
    onStatusImmune: ({ status }) => status === 'brn'
  },
  weather_read: {
    name: 'Weather Read', desc: 'While any weather rages, its moves deal 30% more damage and its Speed is 30% higher.',
    modifyDamage: ({ state, value }) => (state.field.weather.id !== 'none' ? pct(value, 1.3) : value),
    modifySpeed: ({ state, value }) => (state.field.weather.id !== 'none' ? Math.max(1, Math.floor(value * 1.3)) : value)
  },
  chivalry: {
    name: 'Chivalry', desc: 'Speed rises on entry, but it will not finish a beaten foe: 40% less damage to targets below a third of their HP.',
    onSwitchIn: ({ state, mon }) => { abilityFlash(state, mon); boostStat(state, mon, 'spe', 1, 'ability'); },
    modifyDamage: ({ target, value }) => (target && target.hp * 3 <= target.maxHp ? pct(value, 0.6) : value)
  },
  slow_haki: {
    name: 'Slow Haki', desc: 'Always acts in the very last priority bracket, but every move deals 30% more damage.',
    modifyPriority: () => -7,
    modifyDamage: ({ value }) => pct(value, 1.3)
  },
  adaptability: {
    name: 'Adaptability', desc: 'Same-type moves are boosted 2× instead of 1.5×.',
    // Wired into the STAB term of core/damage.js (`user.ability === 'adaptability'`),
    // which the engine calls for every hit. Verified by tools/abilitytest.mjs.
    wiredVia: 'core/damage.js:STAB'
  },
  operating_room: {
    name: 'Operating Room', desc: 'MIND moves ignore the target\'s Defense and Sp. Def boosts.',
    modifyDamage: (ctx) => (ctx.move.type === 'MIND' ? ignoreDefBoosts(ctx) : ctx.value)
  },
  perfect_edge: {
    name: 'Perfect Edge', desc: 'Its attacks never miss, whatever the odds.',
    onSwitchIn: ({ state, mon }) => { if (addVol(state, mon, 'locked_on', 0)) abilityFlash(state, mon, `${label(mon)} takes aim — nothing will miss.`); }
  },

  /* ───────────────────────── damage taken / immunities ────────────────── */

  gum_body: {
    name: 'Rubber Body', desc: 'Cannot be paralyzed. Takes half damage from STORM moves.',
    onStatusImmune: ({ status }) => status === 'par',
    modifyDamageTaken: ({ move, value }) => (move.type === 'STORM' ? pct(value, 0.5) : value)
  },
  mochi_body: {
    name: 'Mochi Body', desc: 'Takes half damage from FIST moves.',
    modifyDamageTaken: ({ move, value }) => (move.type === 'FIST' ? pct(value, 0.5) : value)
  },
  logia_flame: {
    name: 'Flame Logia', desc: 'Takes half damage from any move that makes contact.',
    modifyDamageTaken: ({ move, value }) => (move.contact ? pct(value, 0.5) : value)
  },
  windborne: {
    name: 'Windborne', desc: 'Never touches the ground: EARTH moves can only ever deal 1 damage to it.',
    modifyDamageTaken: ({ move, value }) => (move.type === 'EARTH' ? 1 : value)
  },
  flash_absorb: {
    name: 'Flash Absorb', desc: 'STORM moves can only deal 1 damage to it, and the first one each turn heals it for 1/4 of its max HP.',
    modifyDamageTaken: ({ state, mon, move }) => {
      if (move.type !== 'STORM') return undefined;
      if (oncePerTurn(mon, '_absorbTurn', state.turn)) {
        abilityFlash(state, mon, `${label(mon)} drinks in the charge!`);
        restore(state, mon, frac(mon, 4), 'ability');
      }
      return 1;
    }
  },
  sea_legs: {
    name: 'Sea Legs', desc: 'SEA moves can only deal 1 damage to it, and the first one each turn heals it for 1/4 of its max HP.',
    modifyDamageTaken: ({ state, mon, move }) => {
      if (move.type !== 'SEA') return undefined;
      if (oncePerTurn(mon, '_absorbTurn', state.turn)) {
        abilityFlash(state, mon, `${label(mon)} rides the water!`);
        restore(state, mon, frac(mon, 4), 'ability');
      }
      return 1;
    }
  },
  flame_drinker: {
    name: 'Flame Drinker', desc: 'FLAME moves can only deal 1 damage to it, and the first one each turn raises its Sp. Atk.',
    modifyDamageTaken: ({ state, mon, move }) => {
      if (move.type !== 'FLAME') return undefined;
      if (oncePerTurn(mon, '_absorbTurn', state.turn)) {
        abilityFlash(state, mon, `${label(mon)} feeds on the flame!`);
        boostStat(state, mon, 'spa', 1, 'ability');
      }
      return 1;
    },
    onStatusImmune: ({ status }) => status === 'brn'
  },
  future_sight: {
    name: 'Future Sight', desc: 'Sees the blow coming — the first hit it takes after entering deals only a quarter of its damage.',
    onSwitchIn: ({ state, mon }) => { addVol(state, mon, 'future_dodge', 0); },
    modifyDamageTaken: ({ state, mon, value }) => {
      if (!mon.volatiles.future_dodge) return value;
      removeVol(state, mon, 'future_dodge');
      abilityFlash(state, mon, `${label(mon)} saw it coming and slipped the blow!`);
      return pct(value, 0.25);
    }
  },
  unbreakable: {
    name: 'Unbreakable', desc: 'If it is at full HP, it survives any KO blow with 1 HP.',
    modifyDamageTaken: ({ state, mon, value }) => {
      if (mon.hp < mon.maxHp || value < mon.hp) return value;
      abilityFlash(state, mon, `${label(mon)} refuses to fall!`);
      return mon.hp - 1;
    }
  },
  last_stand: {
    name: 'Last Stand', desc: 'A one-in-four chance to survive any KO blow with 1 HP.',
    modifyDamageTaken: ({ state, mon, value }) => {
      if (value < mon.hp || mon.hp <= 1) return value;
      if (!state.rng.chance(25)) return value;
      abilityFlash(state, mon, `${label(mon)} dug in and held on!`);
      return mon.hp - 1;
    }
  },
  revenant: {
    name: 'Revenant', desc: 'Once per battle it survives a lethal blow with 1 HP, then claws back a quarter of its max HP at the end of the turn.',
    modifyDamageTaken: ({ state, mon, value }) => {
      if (mon._revUsed || value < mon.hp || mon.hp <= 1) return value;
      mon._revUsed = true;
      mon._revTurn = state.turn;
      abilityFlash(state, mon, `${label(mon)} will not stay down!`);
      return mon.hp - 1;
    },
    onResidual: ({ state, mon }) => {
      if (mon._revTurn !== state.turn) return;
      mon._revTurn = -1;
      restore(state, mon, frac(mon, 4), 'ability');
      say(state, `${label(mon)} drags itself back up.`);
    }
  },
  stamina_wall: {
    name: 'Stamina', desc: 'Its Defense rises one stage every time it is struck by an attack.',
    modifyDamageTaken: ({ state, mon, value }) => { boostStat(state, mon, 'def', 1, 'ability'); return value; }
  },
  justified: {
    name: 'Justified', desc: 'Being struck by a SHADOW or VOID move raises its Attack one stage.',
    modifyDamageTaken: ({ state, mon, move, value }) => {
      if ((move.type === 'SHADOW' || move.type === 'VOID') && oncePerTurn(mon, '_justTurn', state.turn)) {
        abilityFlash(state, mon);
        boostStat(state, mon, 'atk', 1, 'ability');
      }
      return value;
    }
  },
  pressure_haki: {
    name: 'Pressure', desc: 'Every attack aimed at it costs the attacker one extra PP.',
    modifyDamageTaken: ({ state, mon, attacker, move, value }) => {
      if (!attacker || !oncePerTurn(mon, '_pressTurn', state.turn)) return value;
      const slot = attacker.moves.find((m) => m.id === move.id);
      if (slot && slot.pp > 0) { slot.pp--; say(state, `${label(attacker)} is worn down by the pressure!`); }
      return value;
    }
  },
  solar_skin: {
    name: 'Solar Skin', desc: 'In Blazing Sun it heals 1/8 of its max HP each turn and takes 20% less special damage.',
    modifyDamageTaken: ({ state, move, value }) => (state.field.weather.id === 'sun' && move.category === 'special' ? pct(value, 0.8) : value),
    onResidual: ({ state, mon }) => {
      if (state.field.weather.id !== 'sun' || mon.hp >= mon.maxHp) return;
      restore(state, mon, frac(mon, 8), 'ability');
      say(state, `${label(mon)} basks in the sun.`);
    }
  },
  blizzard_veil: {
    name: 'Blizzard Veil', desc: 'In a Blizzard it takes 30% less damage from physical moves.',
    modifyDamageTaken: ({ state, move, value }) => (state.field.weather.id === 'hail' && move.category === 'physical' ? pct(value, 0.7) : value)
  },
  sand_body: {
    name: 'Sand Body', desc: 'In a Sandstorm it takes half damage from contact moves and recovers 1/16 of its max HP each turn.',
    modifyDamageTaken: ({ state, move, value }) => (state.field.weather.id === 'sandstorm' && move.contact ? pct(value, 0.5) : value),
    onResidual: ({ state, mon }) => {
      if (state.field.weather.id !== 'sandstorm' || mon.hp >= mon.maxHp) return;
      restore(state, mon, frac(mon, 16), 'ability');
      say(state, `The sand knits ${label(mon)} back together.`);
    }
  },

  /* ───────────────────────── contact punishers ────────────────────────── */

  thousand_arms: {
    name: 'Thousand Arms', desc: 'Contact moves used against it lower the attacker\'s Defense one stage.',
    onContact: ({ state, mon, attacker }) => {
      if (!attacker || attacker.fainted) return;
      abilityFlash(state, mon, `Hands sprout and pin ${label(attacker)}!`);
      boostStat(state, attacker, 'def', -1, 'ability');
    }
  },
  mirror_scale: {
    name: 'Mirror Scale', desc: 'Contact moves used against it lower the attacker\'s Speed one stage.',
    onContact: ({ state, mon, attacker }) => {
      if (!attacker || attacker.fainted) return;
      abilityFlash(state, mon, `${label(attacker)} is dragged down by the scales!`);
      boostStat(state, attacker, 'spe', -1, 'ability');
    }
  },
  iron_hide: {
    name: 'Iron Hide', desc: 'Attackers that make contact lose 1/8 of their max HP.',
    onContact: ({ state, mon, attacker }) => {
      if (!attacker || attacker.fainted) return;
      abilityFlash(state, mon, `${label(attacker)} is cut on ${label(mon)}'s hide!`);
      hurt(state, attacker, frac(attacker, 8), 'ability');
    }
  },
  static_field: {
    name: 'Static Field', desc: 'Contact moves used against it have a 30% chance to paralyze the attacker.',
    onContact: ({ state, mon, attacker }) => {
      if (!attacker || attacker.fainted || attacker.status) return;
      if (!state.rng.chance(30)) return;
      abilityFlash(state, mon);
      giveStatus(state, attacker, 'par', 'ability');
    }
  },
  venom_spines: {
    name: 'Venom Spines', desc: 'Contact moves used against it have a 25% chance to badly poison the attacker.',
    onContact: ({ state, mon, attacker }) => {
      if (!attacker || attacker.fainted || attacker.status) return;
      if (!state.rng.chance(25)) return;
      abilityFlash(state, mon);
      giveStatus(state, attacker, 'tox', 'ability');
    }
  },
  cursed_grip: {
    name: 'Cursed Grip', desc: 'Contact moves used against it cost the attacker 2 extra PP.',
    onContact: ({ state, mon, attacker, move }) => {
      if (!attacker || attacker.fainted) return;
      const slot = attacker.moves.find((m) => m.id === move.id);
      if (!slot || slot.pp <= 0) return;
      slot.pp = Math.max(0, slot.pp - 2);
      abilityFlash(state, mon, `${label(attacker)}'s ${move.name} is drained by the grip!`);
    }
  },
  mirage_step: {
    name: 'Mirage Step', desc: 'Its evasion rises on entry, and contact moves lower the attacker\'s accuracy one stage.',
    onSwitchIn: ({ state, mon }) => { abilityFlash(state, mon); boostStat(state, mon, 'eva', 1, 'ability'); },
    onContact: ({ state, mon, attacker }) => {
      if (!attacker || attacker.fainted) return;
      boostStat(state, attacker, 'acc', -1, 'ability');
    }
  },

  /* ───────────────────────── entry effects ────────────────────────────── */

  conquerors_will: {
    name: "Conqueror's Will", desc: 'On entry, lowers the foe\'s Attack one stage.',
    onSwitchIn: ({ state, mon }) => {
      const foe = foeOf(state, mon);
      if (!foe || foe.fainted) return;
      abilityFlash(state, mon, `${label(mon)}'s presence cows ${label(foe)}!`);
      boostStat(state, foe, 'atk', -1, 'ability');
    }
  },
  cold_read: {
    name: 'Cold Read', desc: 'Reads the fight: its critical-hit rate is raised one stage the whole time it is out.',
    onSwitchIn: ({ state, mon }) => { mon.critStageBonus = Math.max(mon.critStageBonus || 0, 1); abilityFlash(state, mon); }
  },
  regenerator: {
    name: 'Regenerator', desc: 'Recovers a third of its max HP the moment it enters the fight.',
    onSwitchIn: ({ state, mon }) => {
      if (mon.hp >= mon.maxHp) return;
      abilityFlash(state, mon, `${label(mon)} shakes off its wounds.`);
      restore(state, mon, frac(mon, 3), 'ability');
    }
  },
  pure_heart: {
    name: 'Pure Heart', desc: 'Shrugs off any status condition the moment it enters the fight.',
    onSwitchIn: ({ state, mon }) => { if (mon.status) { abilityFlash(state, mon); cureAll(state, mon); } }
  },
  download_read: {
    name: 'Download', desc: 'On entry, raises Attack or Sp. Atk — whichever the foe defends worse against.',
    onSwitchIn: ({ state, mon }) => {
      const foe = foeOf(state, mon);
      if (!foe || foe.fainted) return;
      abilityFlash(state, mon, `${label(mon)} sizes ${label(foe)} up.`);
      boostStat(state, mon, foe.stats.def <= foe.stats.spd ? 'atk' : 'spa', 1, 'ability');
    }
  },
  trade_places: {
    name: 'Trade Places', desc: 'On entry, swaps every stat change with the foe — theirs become yours and yours theirs.',
    onSwitchIn: ({ state, mon }) => {
      const foe = foeOf(state, mon);
      if (!foe || foe.fainted) return;
      const t = mon.boosts; mon.boosts = foe.boosts; foe.boosts = t;
      abilityFlash(state, mon, 'The advantage changed hands!');
    }
  },
  mimicry: {
    name: 'Mimicry', desc: 'On entry, copies the foe\'s ability and keeps it until it switches out.',
    onSwitchIn: ({ state, mon }) => {
      const foe = foeOf(state, mon);
      if (!foe || foe.fainted || !foe.ability || foe.ability === 'mimicry' || !ABILITIES[foe.ability]) return;
      mon.ability = foe.ability;
      abilityFlash(state, mon, `${label(mon)} copied ${ABILITIES[foe.ability].name}!`);
    }
  },
  clean_sweep: {
    name: 'Clean Sweep', desc: 'Sweeps every entry hazard off its own side as it enters.',
    onSwitchIn: ({ state, mon }) => { if (clearHazards(state, mon.side)) abilityFlash(state, mon); }
  },
  caltrop_trail: {
    name: 'Caltrop Trail', desc: 'Scatters a layer of Caltrops on the foe\'s side when it enters.',
    onSwitchIn: ({ state, mon }) => { if (addHazard(state, 1 - mon.side, 'caltrops')) abilityFlash(state, mon); }
  },
  sunburst: {
    name: 'Sunburst', desc: 'Calls up Blazing Sun when it enters.',
    onSwitchIn: ({ state, mon }) => { if (setWeatherNow(state, 'sun', 5, mon.uid)) abilityFlash(state, mon); }
  },
  squall_caller: {
    name: 'Squall Caller', desc: 'Calls up a Squall when it enters.',
    onSwitchIn: ({ state, mon }) => { if (setWeatherNow(state, 'rain', 5, mon.uid)) abilityFlash(state, mon); }
  },
  dust_devil: {
    name: 'Dust Devil', desc: 'Kicks up a Sandstorm when it enters.',
    onSwitchIn: ({ state, mon }) => { if (setWeatherNow(state, 'sandstorm', 5, mon.uid)) abilityFlash(state, mon); }
  },
  frozen_wake: {
    name: 'Frozen Wake', desc: 'Rolls in a Blizzard when it enters.',
    onSwitchIn: ({ state, mon }) => { if (setWeatherNow(state, 'hail', 5, mon.uid)) abilityFlash(state, mon); }
  },
  blade_ground: {
    name: 'Blade Ground', desc: 'Turns the arena into a Blade Field when it enters, boosting SLASH moves for both sides.',
    onSwitchIn: ({ state, mon }) => { if (setTerrainNow(state, 'blade', 5)) abilityFlash(state, mon); }
  },

  /* ───────────────────────── speed & priority ─────────────────────────── */

  swift_swim: {
    name: 'Swift Swim', desc: 'Doubles its Speed while a Squall is falling.',
    modifySpeed: ({ state, value }) => (state.field.weather.id === 'rain' ? value * 2 : value)
  },
  heat_haze: {
    name: 'Heat Haze', desc: 'Doubles its Speed while the sun blazes.',
    modifySpeed: ({ state, value }) => (state.field.weather.id === 'sun' ? value * 2 : value)
  },
  unburden_ki: {
    name: 'Unburden', desc: 'Doubles its Speed once its HP falls to half or less.',
    modifySpeed: ({ mon, value }) => (mon.hp * 2 <= mon.maxHp ? value * 2 : value)
  },
  momentum: {
    name: 'Momentum', desc: 'Its Speed rises one stage at the end of every turn.',
    onResidual: ({ state, mon }) => { if ((mon.boosts.spe || 0) < 6) { abilityFlash(state, mon); boostStat(state, mon, 'spe', 1, 'ability'); } }
  },
  quick_draw: {
    name: 'Quick Draw', desc: 'Its attacks of 60 power or less strike with +1 priority.',
    modifyPriority: ({ move, value }) => (move && move.category !== 'status' && move.power > 0 && move.power <= 60 ? value + 1 : value)
  },
  prankster_wit: {
    name: 'Prankster', desc: 'Its status moves strike with +1 priority.',
    modifyPriority: ({ move, value }) => (move?.category === 'status' ? value + 1 : value)
  },

  /* ───────────────────────── status ───────────────────────────────────── */

  immunity_gut: {
    name: 'Immunity', desc: 'Cannot be poisoned.',
    onStatusImmune: ({ status }) => status === 'psn' || status === 'tox'
  },
  insomnia_watch: {
    name: 'Insomnia', desc: 'Cannot fall asleep.',
    onStatusImmune: ({ status }) => status === 'slp'
  },
  thick_hide: {
    name: 'Thick Hide', desc: 'Cannot be burned or frozen.',
    onStatusImmune: ({ status }) => status === 'brn' || status === 'frz'
  },
  bad_dreams: {
    name: 'Bad Dreams', desc: 'A sleeping foe loses 1/8 of its max HP at the end of every turn.',
    onResidual: ({ state, mon }) => {
      const foe = foeOf(state, mon);
      if (!foe || foe.fainted || foe.status !== 'slp') return;
      abilityFlash(state, mon, `${label(foe)} is tormented in its sleep!`);
      hurt(state, foe, frac(foe, 8), 'ability');
    }
  },

  /* ───────────────────────── end of turn ──────────────────────────────── */

  ocean_heart: {
    name: 'Ocean Heart', desc: 'Restores 1/16 of its max HP each turn while a Squall is falling.',
    onResidual: ({ state, mon }) => {
      if (state.field.weather.id !== 'rain' || mon.hp >= mon.maxHp) return;
      restore(state, mon, frac(mon, 16), 'ability');
      say(state, `${label(mon)} draws strength from the rain.`);
    }
  },
  desiccate: {
    name: 'Desiccate', desc: 'Drains 1/16 of the foe\'s max HP each turn during a Sandstorm and heals for it.',
    onResidual: ({ state, mon }) => {
      if (state.field.weather.id !== 'sandstorm') return;
      const foe = foeOf(state, mon);
      if (!foe || foe.fainted) return;
      abilityFlash(state, mon, `${label(mon)} drains the moisture from ${label(foe)}!`);
      const d = hurt(state, foe, frac(foe, 16), 'ability');
      if (d > 0) restore(state, mon, d, 'ability');
    }
  },
  undying: {
    name: 'Undying', desc: 'Once per battle, the first time it ends a turn below half HP it recovers 1/8 of its max HP.',
    onResidual: ({ state, mon }) => {
      if (mon._undyingUsed || mon.hp <= 0 || mon.hp * 2 > mon.maxHp) return;
      mon._undyingUsed = true;
      abilityFlash(state, mon, `${label(mon)} refuses to go down!`);
      restore(state, mon, frac(mon, 8), 'ability');
    }
  },
  rage_scale: {
    name: 'Rage Scale', desc: 'Once per battle, the first time it ends a turn below half HP its Sp. Atk rises two stages.',
    onResidual: ({ state, mon }) => {
      if (mon._rageUsed || mon.hp <= 0 || mon.hp * 2 > mon.maxHp) return;
      mon._rageUsed = true;
      abilityFlash(state, mon, `${label(mon)} is past caring!`);
      boostStat(state, mon, 'spa', 2, 'ability');
    }
  },
  bloodlust: {
    name: 'Bloodlust', desc: 'Its Attack rises one stage at the end of any turn in which the foe was knocked out.',
    onResidual: ({ state, mon }) => {
      const foe = foeOf(state, mon);
      if (!foe || !foe.fainted || mon._koSeen === foe.uid) return;
      mon._koSeen = foe.uid;
      abilityFlash(state, mon, `${label(mon)} is hungry for more!`);
      boostStat(state, mon, 'atk', 1, 'ability');
    }
  },
  harvest_luck: {
    name: 'Harvest', desc: 'At the end of every turn, a 50% chance to bring back the held item it has already used.',
    onResidual: ({ state, mon }) => {
      if (!mon.item || !mon.itemUsed) return;
      if (!state.rng.chance(50)) return;
      mon.itemUsed = false;
      abilityFlash(state, mon);
      pushEvent(state, { t: 'itemUse', side: mon.side, uid: mon.uid, itemId: mon.item, consumed: false });
      say(state, `${label(mon)} found its item again!`);
    }
  }
};

/* ── ability metadata ─────────────────────────────────────────────────── */

/** Hook names the engine actually invokes. Anything else is dead weight. */
export const ENGINE_ABILITY_HOOKS = [
  'onSwitchIn', 'onStatusImmune', 'modifySpeed', 'modifyPriority',
  'modifyDamage', 'modifyDamageTaken', 'onContact', 'onResidual'
];

export function getAbility(id) { return ABILITIES[id]; }
export function abilityOf(mon) { return ABILITIES[mon.ability]; }
export function abilityIds() { return Object.keys(ABILITIES); }

/** All abilities, for the dex. */
export function abilityList() {
  return Object.entries(ABILITIES).map(([id, a]) => ({ id, ...a }));
}

/** The hooks an ability declares that the engine will actually call. */
export function hooksOf(id) {
  const a = ABILITIES[id];
  if (!a) return [];
  return ENGINE_ABILITY_HOOKS.filter((h) => typeof a[h] === 'function');
}

/**
 * Engine entry point.
 *
 * Runs the ability hook, then pipes the same ctx through the holder's item for
 * every hook the engine does NOT dispatch to items itself — that's how held
 * items get onSwitchIn / onStatusImmune / modifySpeed / modifyPriority /
 * modifyDamageTaken / onContact without an engine change. `itemHookIsEngineDriven`
 * keeps the two paths disjoint so nothing ever fires twice.
 */
export function runAbility(hookName, ctx) {
  const mon = ctx.mon;
  if (!mon) return ctx.value;
  let value = ctx.value;

  const fn = ABILITIES[mon.ability]?.[hookName];
  if (typeof fn === 'function') {
    const r = fn(ctx);
    if (r !== undefined) value = r;
  }

  if (!itemHookIsEngineDriven(hookName)) {
    const r2 = dispatchItemHook(hookName, value === ctx.value ? ctx : { ...ctx, value });
    if (r2 !== undefined) value = r2;
  }
  return value;
}
