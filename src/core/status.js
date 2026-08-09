// Status conditions, volatiles, weather, terrain, hazards, screens.

export const STATUSES = {
  brn: { name: 'Burn',      short: 'BRN', color: '#ff6a3d', msg: 'was burned!',        cure: 'burn healed.' },
  psn: { name: 'Poison',    short: 'PSN', color: '#a24fd0', msg: 'was poisoned!',      cure: 'poison faded.' },
  tox: { name: 'Bad Poison',short: 'TOX', color: '#7b2fa8', msg: 'was badly poisoned!',cure: 'poison faded.' },
  par: { name: 'Paralysis', short: 'PAR', color: '#f2c744', msg: 'is paralyzed!',      cure: 'is no longer paralyzed.' },
  slp: { name: 'Sleep',     short: 'SLP', color: '#8fa3c9', msg: 'fell asleep!',       cure: 'woke up!' },
  frz: { name: 'Frozen',    short: 'FRZ', color: '#7fd8ff', msg: 'was frozen solid!',  cure: 'thawed out!' }
};

// Volatiles: per-switch-in temporary states.
export const VOLATILES = {
  confusion:   { name: 'Confusion',   turns: [2, 5] },
  flinch:      { name: 'Flinch',      turns: [1, 1] },
  protect:     { name: 'Protect',     turns: [1, 1] },
  substitute:  { name: 'Substitute',  turns: [0, 0] },
  leechseed:   { name: 'Leech Seed',  turns: [0, 0] },
  taunt:       { name: 'Taunt',       turns: [3, 3] },
  encore:      { name: 'Encore',      turns: [3, 3] },
  charging:    { name: 'Charging',    turns: [1, 1] },
  recharge:    { name: 'Recharging',  turns: [1, 1] },
  focusenergy: { name: 'Focused',     turns: [0, 0] },
  endure:      { name: 'Enduring',    turns: [1, 1] },
  destinybond: { name: 'Destiny Bond',turns: [1, 1] },
  rooted:      { name: 'Rooted',      turns: [0, 0] },
  torment:     { name: 'Torment',     turns: [0, 0] },
  disable:     { name: 'Disabled',    turns: [4, 4] },
  perish:      { name: 'Perish Song', turns: [3, 3] },
  imprison:    { name: 'Imprison',    turns: [0, 0] },
  minimized:   { name: 'Minimized',   turns: [0, 0] },
  aqua_ring:   { name: 'Sea Veil',    turns: [0, 0] },
  magnetrise:  { name: 'Air Borne',   turns: [5, 5] },
  yawn:        { name: 'Drowsy',      turns: [2, 2] }
};

export const WEATHERS = {
  none:      { name: 'Clear',        short: '', color: '#ffffff' },
  rain:      { name: 'Squall',       short: 'RAIN',  color: '#4a9fe0', boosts: { SEA: 1.5, FLAME: 0.5 } },
  sun:       { name: 'Blazing Sun',  short: 'SUN',   color: '#ffb03a', boosts: { FLAME: 1.5, SEA: 0.5 } },
  sandstorm: { name: 'Sandstorm',    short: 'SAND',  color: '#c8a165', chip: ['EARTH', 'MECHA', 'BEAST'] },
  hail:      { name: 'Blizzard',     short: 'HAIL',  color: '#bfe8ff', chip: ['FROST'] },
  fog:       { name: 'Sea Fog',      short: 'FOG',   color: '#9fb3c8', accMod: 0.85 }
};

export const TERRAINS = {
  none:   { name: 'None',        color: '#ffffff' },
  blade:  { name: 'Blade Field', short: 'BLADE', color: '#c9d4e0', boost: 'SLASH' },
  ember:  { name: 'Ember Field', short: 'EMBER', color: '#ff7a4a', boost: 'FLAME' },
  psychic:{ name: 'Mind Field',  short: 'MIND',  color: '#e05c9e', boost: 'MIND' },
  haki:   { name: 'Haki Field',  short: 'HAKI',  color: '#5a5fd0', boost: 'HAKI' }
};

export const HAZARDS = {
  caltrops:  { name: 'Caltrops',   maxLayers: 3, color: '#b0b8c4' },
  oilslick:  { name: 'Oil Slick',  maxLayers: 1, color: '#3a3a4a' },
  barbs:     { name: 'Toxic Barbs',maxLayers: 2, color: '#8bc34a' },
  shards:    { name: 'Ice Shards', maxLayers: 1, color: '#7fd8ff' }
};

export const SCREENS = {
  reflect:   { name: 'Iron Wall',   turns: 5, mul: 0.5, category: 'physical' },
  lightwall: { name: 'Light Wall',  turns: 5, mul: 0.5, category: 'special' },
  veil:      { name: 'Aurora Veil', turns: 5, mul: 0.5, category: 'both' },
  mist:      { name: 'Mist',        turns: 5 },
  tailwind:  { name: 'Tailwind',    turns: 4 },
  safeguard: { name: 'Safeguard',   turns: 5 }
};

export function statusName(id) { return STATUSES[id]?.name ?? ''; }
export function statusShort(id) { return STATUSES[id]?.short ?? ''; }
export function statusColor(id) { return STATUSES[id]?.color ?? '#888'; }
