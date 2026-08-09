// Passive abilities. Owned by the abilities agent.
// Hooks: onSwitchIn, onContact, onResidual, modifySpeed, modifyPriority,
//        modifyDamageTaken, onStatusImmune

import { getFighter } from '../data/fighters.js';

export const ABILITIES = {
  gum_body: {
    name: 'Rubber Body', desc: 'Immune to paralysis; takes half damage from STORM moves.',
    onStatusImmune: ({ status }) => status === 'par',
    modifyDamageTaken: ({ move, value }) => (move?.type === 'STORM' ? Math.floor(value * 0.5) : value)
  },
  conquerors_will: {
    name: "Conqueror's Will", desc: 'On entry, lowers the foe\'s Attack by one stage.',
    onSwitchIn: ({ state, mon, msg }) => {
      const foe = state.sides[1 - mon.side].party[state.sides[1 - mon.side].activeIndex];
      if (!foe || foe.fainted) return;
      foe.boosts.atk = Math.max(-6, foe.boosts.atk - 1);
      msg(`${mon.nickname}'s presence cows ${foe.nickname}!`);
    }
  },
  three_blades: {
    name: 'Three Blades', desc: 'Slicing moves deal 30% more damage.',
    modifyDamage: ({ move, value }) => (move?.flags?.includes('slice') ? Math.floor(value * 1.3) : value)
  },
  unbreakable: {
    name: 'Unbreakable', desc: 'Survives a KO from full HP with 1 HP.',
    modifyDamageTaken: ({ mon, value }) => (mon.hp === mon.maxHp && value >= mon.hp ? mon.hp - 1 : value)
  },
  blue_flame: {
    name: 'Blue Flame', desc: 'FLAME moves are 20% stronger; immune to burn.',
    onStatusImmune: ({ status }) => status === 'brn'
  },
  chivalry: { name: 'Chivalry', desc: 'Cannot lower the foe\'s stats, but Speed is raised on entry.',
    onSwitchIn: ({ state, mon, msg }) => { mon.boosts.spe = Math.min(6, mon.boosts.spe + 1); msg(`${mon.nickname} steps up a gear!`); } },
  weather_read: {
    name: 'Weather Read', desc: 'Accuracy is never lowered; sees through fog.',
    onSwitchIn: () => {}
  },
  opportunist: { name: 'Opportunist', desc: 'Deals 30% more damage to statused targets.',
    modifyDamage: ({ target, value }) => (target?.status ? Math.floor(value * 1.3) : value) },
  thousand_arms: { name: 'Thousand Arms', desc: 'Contact moves used against this fighter lower the attacker\'s Defense.',
    onContact: ({ state, attacker, msg }) => {
      if (!attacker || attacker.fainted) return;
      attacker.boosts.def = Math.max(-6, attacker.boosts.def - 1);
      msg(`Hands sprout and pin ${attacker.nickname}!`);
    } },
  cold_read: { name: 'Cold Read', desc: 'Critical hits land more often.',
    onSwitchIn: ({ mon }) => { mon.critStageBonus = 1; } },
  logia_flame: { name: 'Flame Logia', desc: 'Halves damage from physical moves that make contact.',
    modifyDamageTaken: ({ move, value }) => (move?.contact ? Math.floor(value * 0.5) : value) },
  sunburst: { name: 'Sunburst', desc: 'Sets Blazing Sun on entry.',
    onSwitchIn: ({ state, mon, msg }) => { if (state.field.weather.id !== 'sun') { state.field.weather = { id: 'sun', turns: 5 }; msg('The sun flares as ' + mon.nickname + ' arrives!'); } } },
  operating_room: { name: 'Operating Room', desc: 'MIND moves ignore the target\'s Defense boosts.' },
  ocean_heart: { name: 'Ocean Heart', desc: 'Restores 1/16 HP each turn in a Squall.',
    onResidual: ({ state, mon, healMon }) => { if (state.field.weather.id === 'rain') healMon(state, mon, Math.floor(mon.maxHp / 16), 'ability'); } },
  perfect_edge: { name: 'Perfect Edge', desc: 'Slicing moves never miss.' },
  sand_body: { name: 'Sand Body', desc: 'Immune to sandstorm chip; halves contact damage in a sandstorm.',
    modifyDamageTaken: ({ state, move, value }) => (state.field.weather.id === 'sandstorm' && move?.contact ? Math.floor(value * 0.5) : value) },
  desiccate: { name: 'Desiccate', desc: 'Drains 1/16 of the foe\'s HP each turn in a sandstorm.',
    onResidual: ({ state, mon, dealDirect, healMon, msg }) => {
      if (state.field.weather.id !== 'sandstorm') return;
      const foe = state.sides[1 - mon.side].party[state.sides[1 - mon.side].activeIndex];
      if (!foe || foe.fainted) return;
      const d = dealDirect(state, foe, Math.max(1, Math.floor(foe.maxHp / 16)), 'ability');
      healMon(state, mon, d, 'ability');
      msg(`${mon.nickname} drains the moisture from ${foe.nickname}!`);
    } },
  future_sight: { name: 'Future Sight', desc: 'The first attack each battle against this fighter misses.',
    onSwitchIn: ({ mon }) => { mon.volatiles.future_dodge = { turns: 0, data: {} }; } },
  mochi_body: { name: 'Mochi Body', desc: 'Halves damage from FIST moves.',
    modifyDamageTaken: ({ move, value }) => (move?.type === 'FIST' ? Math.floor(value * 0.5) : value) },
  undying: { name: 'Undying', desc: 'Recovers 1/8 max HP when it falls below half for the first time.',
    onResidual: ({ state, mon, healMon, msg }) => {
      if (mon._undyingUsed) return;
      if (mon.hp > 0 && mon.hp < mon.maxHp / 2) {
        mon._undyingUsed = true;
        healMon(state, mon, Math.floor(mon.maxHp / 8), 'ability');
        msg(`${mon.nickname} refuses to go down!`);
      }
    } }
};

export function getAbility(id) { return ABILITIES[id]; }

export function abilityOf(mon) { return ABILITIES[mon.ability]; }

/** Engine entry point. Returns the hook's return value (or ctx.value if none). */
export function runAbility(hookName, ctx) {
  const mon = ctx.mon;
  if (!mon) return ctx.value;
  const ab = ABILITIES[mon.ability];
  const fn = ab?.[hookName];
  if (!fn) return ctx.value;
  const r = fn(ctx);
  return r === undefined ? ctx.value : r;
}

/** All abilities used by the roster, for the dex. */
export function abilityList() {
  return Object.entries(ABILITIES).map(([id, a]) => ({ id, ...a }));
}
