// Status conditions, volatiles, weather, terrain, hazards, screens.
//
// Everything here is *declarative data + text*. `engine.js` is what honours it.
// Text helpers take an already-decorated combatant label ("Foe Kaido") so the
// engine never has to know how a line is phrased.

/* ------------------------------------------------------------------ */
/* major status                                                        */
/* ------------------------------------------------------------------ */

export const STATUSES = {
  brn: {
    name: 'Burn', short: 'BRN', color: '#ff6a3d',
    msg: 'was burned!', cure: 'burn healed.', already: 'burned',
    residual: 1 / 16, residualMsg: (n) => `${n} is hurt by its burn!`,
    ownType: 'FLAME'
  },
  psn: {
    name: 'Poison', short: 'PSN', color: '#a24fd0',
    msg: 'was poisoned!', cure: 'poison faded.', already: 'poisoned',
    residual: 1 / 8, residualMsg: (n) => `${n} is hurt by poison!`,
    ownType: 'TOXIN'
  },
  tox: {
    name: 'Bad Poison', short: 'TOX', color: '#7b2fa8',
    msg: 'was badly poisoned!', cure: 'poison faded.', already: 'badly poisoned',
    residual: 1 / 16, residualMsg: (n) => `${n} is racked by poison!`,
    ownType: 'TOXIN'
  },
  par: {
    name: 'Paralysis', short: 'PAR', color: '#f2c744',
    msg: 'is paralyzed!', cure: 'is no longer paralyzed.', already: 'paralyzed',
    residual: 0, ownType: 'STORM'
  },
  slp: {
    name: 'Sleep', short: 'SLP', color: '#8fa3c9',
    msg: 'fell asleep!', cure: 'woke up!', already: 'asleep',
    residual: 0, ownType: null
  },
  frz: {
    name: 'Frozen', short: 'FRZ', color: '#7fd8ff',
    msg: 'was frozen solid!', cure: 'thawed out!', already: 'frozen solid',
    residual: 0, ownType: 'FROST'
  }
};

/** Chance per turn that a frozen fighter thaws out. */
export const THAW_CHANCE = 20;
/** Chance a paralysed fighter is fully paralysed. */
export const PARALYSIS_CHANCE = 25;
/** Chance a confused fighter hits itself. */
export const CONFUSION_CHANCE = 33;
/** Base power of the typeless hit a confused fighter lands on itself. */
export const CONFUSION_POWER = 40;

/* ------------------------------------------------------------------ */
/* volatiles — per-switch-in temporary states                          */
/* ------------------------------------------------------------------ */
//   turns: [lo, hi] rolled on application. [0,0] means "no natural timer".
//   silent: the engine does not announce start/end by itself.
//   start/end: message builders, given the fighter's label.

export const VOLATILES = {
  confusion:   { name: 'Confusion',    turns: [2, 5],
    start: (n) => `${n} became confused!`, end: (n) => `${n} snapped out of its confusion!` },
  flinch:      { name: 'Flinch',       turns: [1, 1], silent: true },
  protect:     { name: 'Protect',      turns: [1, 1], silent: true },
  substitute:  { name: 'Substitute',   turns: [0, 0], silent: true },
  leechseed:   { name: 'Leech Seed',   turns: [0, 0],
    start: (n) => `${n} was seeded!`, end: (n) => `${n} shook off the seed!` },
  taunt:       { name: 'Taunt',        turns: [3, 3],
    start: (n) => `${n} fell for the taunt!`, end: (n) => `${n} shook off the taunt.` },
  encore:      { name: 'Encore',       turns: [3, 3],
    start: (n) => `${n} got an encore!`, end: (n) => `${n}'s encore ended.` },
  charging:    { name: 'Charging',     turns: [1, 1], silent: true },
  recharge:    { name: 'Recharging',   turns: [1, 1], silent: true },
  focusenergy: { name: 'Focused',      turns: [0, 0],
    start: (n) => `${n} is getting pumped!`, end: (n) => `${n} let its focus slip.` },
  endure:      { name: 'Enduring',     turns: [1, 1], silent: true },
  destinybond: { name: 'Destiny Bond', turns: [1, 1],
    start: (n) => `${n} is trying to take its foe down with it!`, silentEnd: true },
  rooted:      { name: 'Rooted',       turns: [0, 0],
    start: (n) => `${n} planted its roots!`, end: (n) => `${n} tore its roots free.` },
  torment:     { name: 'Torment',      turns: [0, 0],
    start: (n) => `${n} was subjected to torment!`, end: (n) => `${n}'s torment lifted.` },
  disable:     { name: 'Disabled',     turns: [4, 4],
    start: (n) => `${n} was disabled!`, end: (n) => `${n} is no longer disabled.` },
  perish:      { name: 'Perish Song',  turns: [4, 4], silent: true },
  imprison:    { name: 'Imprison',     turns: [0, 0],
    start: (n) => `${n} sealed the foe's moves!`, end: (n) => `${n}'s seal broke.` },
  minimized:   { name: 'Minimized',    turns: [0, 0], silent: true },
  aqua_ring:   { name: 'Sea Veil',     turns: [0, 0],
    start: (n) => `${n} wrapped itself in a veil of water!`, end: (n) => `${n}'s veil of water broke.` },
  magnetrise:  { name: 'Air Borne',    turns: [5, 5],
    start: (n) => `${n} floated up on an unseen current!`, end: (n) => `${n} touched down.` },
  yawn:        { name: 'Drowsy',       turns: [2, 2],
    start: (n) => `${n} grew drowsy!`, silentEnd: true },
  locked_on:   { name: 'Locked On',    turns: [2, 2],
    start: (n) => `${n} took aim!`, silentEnd: true },
  future_dodge:{ name: 'Foresight',    turns: [0, 0], silent: true }
};

/** Volatiles that keep a fighter airborne (immune to ground hazards & EARTH). */
export const AIRBORNE_VOLATILES = ['magnetrise'];
/** Volatiles that force a fighter to stay grounded even if it is a WIND type. */
export const GROUNDING_VOLATILES = ['rooted'];
/** Volatiles that block a fighter from switching out voluntarily. */
export const TRAPPING_VOLATILES = ['rooted'];
/** Volatiles cleared when the holder leaves the field (i.e. all of them). */
export function volatileName(id) { return VOLATILES[id]?.name ?? id; }

/* ------------------------------------------------------------------ */
/* weather                                                             */
/* ------------------------------------------------------------------ */
//   boosts     : damage multiplier per attacking type
//   chipFrac   : residual damage as a fraction of max HP
//   chipImmune : types that ignore the chip
//   accMod     : global accuracy multiplier
//   healMod    : multiplier on HP-restoring moves

export const WEATHERS = {
  none: { name: 'Clear', short: '', color: '#ffffff' },
  rain: {
    name: 'Squall', short: 'RAIN', color: '#4a9fe0',
    boosts: { SEA: 1.5, FLAME: 0.5 }, healMod: 1.25,
    start: 'A driving squall sweeps the arena!',
    upkeep: 'The squall keeps hammering down.',
    end: 'The squall let up.'
  },
  sun: {
    name: 'Blazing Sun', short: 'SUN', color: '#ffb03a',
    boosts: { FLAME: 1.5, SEA: 0.5 }, healMod: 1.25, thawing: true,
    start: 'The sun blazes down!',
    upkeep: 'The sun is punishing.',
    end: 'The sunlight faded.'
  },
  sandstorm: {
    name: 'Sandstorm', short: 'SAND', color: '#c8a165',
    chipFrac: 1 / 16, chipImmune: ['EARTH', 'MECHA', 'BEAST'],
    chipMsg: (n) => `${n} is flayed by the sandstorm!`,
    start: 'A sandstorm kicks up!',
    upkeep: 'The sandstorm rages.',
    end: 'The sandstorm subsided.'
  },
  hail: {
    name: 'Blizzard', short: 'HAIL', color: '#bfe8ff',
    chipFrac: 1 / 16, chipImmune: ['FROST'],
    chipMsg: (n) => `${n} is pelted by the blizzard!`,
    start: 'A blizzard rolls in!',
    upkeep: 'The blizzard howls.',
    end: 'The blizzard died down.'
  },
  fog: {
    name: 'Sea Fog', short: 'FOG', color: '#9fb3c8',
    accMod: 0.85,
    start: 'Sea fog blankets the field…',
    upkeep: 'The fog is thick enough to lean on.',
    end: 'The fog lifted.'
  }
};

/* ------------------------------------------------------------------ */
/* terrain                                                             */
/* ------------------------------------------------------------------ */
//   boost         : attacking type amplified (grounded users only)
//   mul           : that amplification
//   blocksPriority: increased-priority moves fail against grounded targets
//   statusGuard   : grounded fighters cannot be given a major status
//   heal          : fraction of max HP restored to grounded fighters each turn

export const TERRAINS = {
  none:    { name: 'None', color: '#ffffff' },
  blade:   { name: 'Blade Field', short: 'BLADE', color: '#c9d4e0', boost: 'SLASH', mul: 1.3,
             start: 'Steel splinters carpet the ground!', end: 'The blade field settled.' },
  ember:   { name: 'Ember Field', short: 'EMBER', color: '#ff7a4a', boost: 'FLAME', mul: 1.3, heal: 1 / 16,
             start: 'Embers crawl across the ground!', end: 'The embers burned out.' },
  psychic: { name: 'Mind Field',  short: 'MIND',  color: '#e05c9e', boost: 'MIND', mul: 1.3, blocksPriority: true,
             start: 'The ground hums with thought!', end: 'The humming stopped.' },
  haki:    { name: 'Haki Field',  short: 'HAKI',  color: '#5a5fd0', boost: 'HAKI', mul: 1.3, statusGuard: true,
             start: 'A pressure settles over the field!', end: 'The pressure lifted.' }
};

/* ------------------------------------------------------------------ */
/* entry hazards                                                       */
/* ------------------------------------------------------------------ */
//   grounded   : only bites fighters that are on the floor
//   layerFrac  : damage per layer, index 0 unused
//   typedBy    : effectiveness of this attacking type scales the damage
//   absorbedBy : a grounded fighter of this type sweeps the hazard away

export const HAZARDS = {
  caltrops: {
    name: 'Caltrops', maxLayers: 3, color: '#b0b8c4', grounded: true,
    layerFrac: [0, 1 / 8, 1 / 6, 1 / 4],
    setMsg: (s) => `Caltrops scatter across ${s}'s side!`,
    hitMsg: (n) => `${n} is cut up by the caltrops!`
  },
  shards: {
    name: 'Ice Shards', maxLayers: 1, color: '#7fd8ff', typedBy: 'FROST',
    baseFrac: 1 / 8,
    setMsg: (s) => `Jagged ice hangs over ${s}'s side!`,
    hitMsg: (n) => `Ice shards tear into ${n}!`
  },
  barbs: {
    name: 'Toxic Barbs', maxLayers: 2, color: '#8bc34a', grounded: true,
    absorbedBy: 'TOXIN',
    setMsg: (s) => `Toxic barbs litter ${s}'s side!`,
    absorbMsg: (n) => `${n} scooped up the toxic barbs!`
  },
  oilslick: {
    name: 'Oil Slick', maxLayers: 1, color: '#3a3a4a', grounded: true,
    setMsg: (s) => `An oil slick spreads over ${s}'s side!`,
    hitMsg: (n) => `${n} skids on the oil slick!`
  }
};

/* ------------------------------------------------------------------ */
/* side screens                                                        */
/* ------------------------------------------------------------------ */

export const SCREENS = {
  reflect:   { name: 'Iron Wall',   turns: 5, mul: 0.5, category: 'physical',
               start: (s) => `An iron wall rises on ${s}'s side!`, end: (s) => `The iron wall on ${s}'s side crumbled.` },
  lightwall: { name: 'Light Wall',  turns: 5, mul: 0.5, category: 'special',
               start: (s) => `A wall of light rises on ${s}'s side!`, end: (s) => `The wall of light on ${s}'s side faded.` },
  veil:      { name: 'Aurora Veil', turns: 5, mul: 0.5, category: 'both',
               start: (s) => `An aurora veil settles over ${s}'s side!`, end: (s) => `The aurora veil over ${s}'s side faded.` },
  mist:      { name: 'Mist',        turns: 5,
               start: (s) => `Mist shrouds ${s}'s side!`, end: (s) => `The mist on ${s}'s side cleared.` },
  tailwind:  { name: 'Tailwind',    turns: 4,
               start: (s) => `A tailwind picks up behind ${s}!`, end: (s) => `${s}'s tailwind died down.` },
  safeguard: { name: 'Safeguard',   turns: 5,
               start: (s) => `${s}'s side is cloaked in a safeguard!`, end: (s) => `${s}'s safeguard wore off.` }
};

export function statusName(id) { return STATUSES[id]?.name ?? ''; }
export function statusShort(id) { return STATUSES[id]?.short ?? ''; }
export function statusColor(id) { return STATUSES[id]?.color ?? '#888'; }
