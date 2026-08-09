// Bag items (consumed from the side's inventory) and held items.
// Owned by the items agent.

const I = [];
const def = (o) => { I.push({ kind: 'bag', ...o }); };

/* ---- bag items ---- */
def({
  id: 'potion', name: 'Potion', kind: 'bag', pocket: 'heal', color: '#7fffc4',
  desc: 'Restores 40 HP.',
  use: ({ state, target, healMon, msg }) => { healMon(state, target, 40, 'item'); msg(`${target.nickname} recovered health!`); }
});
def({
  id: 'hyper_potion', name: 'Hyper Potion', kind: 'bag', pocket: 'heal', color: '#7fffc4',
  desc: 'Restores 120 HP.',
  use: ({ state, target, healMon, msg }) => { healMon(state, target, 120, 'item'); msg(`${target.nickname} recovered health!`); }
});
def({
  id: 'full_heal', name: 'Full Heal', kind: 'bag', pocket: 'status', color: '#ffd47f',
  desc: 'Cures any status condition.',
  use: ({ state, target, cureStatus, msg }) => { if (target.status) cureStatus(state, target); else msg('But it had no effect!'); }
});
def({
  id: 'x_attack', name: 'X Attack', kind: 'bag', pocket: 'battle', color: '#ff8a5c',
  desc: 'Sharply raises Attack for the battle.',
  use: ({ state, target, changeBoost }) => { changeBoost(state, target, 'atk', 2, 'item'); }
});
def({
  id: 'x_speed', name: 'X Speed', kind: 'bag', pocket: 'battle', color: '#a7e8c0',
  desc: 'Sharply raises Speed for the battle.',
  use: ({ state, target, changeBoost }) => { changeBoost(state, target, 'spe', 2, 'item'); }
});
def({
  id: 'revive', name: 'Revive', kind: 'bag', pocket: 'heal', color: '#ffe9a3',
  desc: 'Revives a fainted ally to half HP.',
  use: ({ state, target, healMon, msg }) => {
    if (!target.fainted) { msg('But it had no effect!'); return; }
    target.fainted = false; target.hp = 0;
    healMon(state, target, Math.floor(target.maxHp / 2), 'item');
    msg(`${target.nickname} was revived!`);
  }
});

/* ---- held items ---- */
const hold = (o) => { I.push({ kind: 'held', ...o }); };

hold({ id: 'power_band', name: 'Power Band', pocket: 'held', color: '#ff8a5c', desc: 'Boosts physical move damage by 20%.',
  hooks: { modifyDamage: ({ move, value }) => (move.category === 'physical' ? Math.floor(value * 1.2) : value) } });
hold({ id: 'focus_lens', name: 'Focus Lens', pocket: 'held', color: '#7fd8ff', desc: 'Boosts special move damage by 20%.',
  hooks: { modifyDamage: ({ move, value }) => (move.category === 'special' ? Math.floor(value * 1.2) : value) } });
hold({ id: 'leftovers', name: 'Ship Rations', pocket: 'held', color: '#c8a24b', desc: 'Restores 1/16 max HP each turn.',
  hooks: { onResidual: ({ state, mon, healMon, msg }) => { if (mon.hp < mon.maxHp) { healMon(state, mon, Math.floor(mon.maxHp / 16), 'item'); msg(`${mon.nickname} nibbles its rations.`); } } } });
hold({ id: 'weighted_bands', name: 'Weighted Bands', pocket: 'held', color: '#9aa7b5', desc: 'Halves Speed but boosts damage by 50%.',
  hooks: { modifyDamage: ({ value }) => Math.floor(value * 1.5) } });
hold({ id: 'sea_stone_band', name: 'Sea-Stone Band', pocket: 'held', color: '#2a7fd4', desc: 'Prevents status conditions.',
  hooks: {} });

export const ITEMS = I;
export const ITEM_BY_ID = Object.fromEntries(I.map((x) => [x.id, x]));
export function getItem(id) { return ITEM_BY_ID[id]; }
export function bagItems() { return I.filter((x) => x.kind === 'bag'); }
export function heldItems() { return I.filter((x) => x.kind === 'held'); }

export function defaultBag() {
  return { potion: 4, hyper_potion: 2, full_heal: 2, x_attack: 1, x_speed: 1, revive: 1 };
}

/** Called by the engine for held-item hooks. */
export function runItemHook(hookName, ctx) {
  const mon = ctx.mon;
  if (!mon || !mon.item) return ctx.value;
  const item = getItem(mon.item);
  const fn = item?.hooks?.[hookName];
  if (!fn) return ctx.value;
  const r = fn(ctx);
  return r === undefined ? ctx.value : r;
}
