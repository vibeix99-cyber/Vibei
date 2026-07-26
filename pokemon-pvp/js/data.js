/* ==========================================================================
   data.js — Types, type chart, move pool and species roster.
   Everything here is static data; no dependencies.
   ========================================================================== */

const TYPES = [
  'normal', 'fire', 'water', 'electric', 'grass', 'ice', 'fighting', 'poison',
  'ground', 'flying', 'psychic', 'bug', 'rock', 'ghost', 'dragon', 'dark',
  'steel', 'fairy'
];

const TYPE_COLORS = {
  normal: '#9fa19f', fire: '#ff7a2f', water: '#3d94ff', electric: '#ffcc22',
  grass: '#57c257', ice: '#5fd4d4', fighting: '#d1462f', poison: '#a850a8',
  ground: '#d1a02f', flying: '#8fa5f0', psychic: '#f6538f', bug: '#9fc72f',
  rock: '#b0a05f', ghost: '#7057a8', dragon: '#6a4df0', dark: '#6b5a4f',
  steel: '#9fa5c2', fairy: '#f08fd4'
};

/* Attacking type -> defending type -> multiplier. Missing entries are 1x. */
const TYPE_CHART = {
  normal:   { rock: 0.5, ghost: 0, steel: 0.5 },
  fire:     { fire: 0.5, water: 0.5, grass: 2, ice: 2, bug: 2, rock: 0.5, dragon: 0.5, steel: 2 },
  water:    { fire: 2, water: 0.5, grass: 0.5, ground: 2, rock: 2, dragon: 0.5 },
  electric: { water: 2, electric: 0.5, grass: 0.5, ground: 0, flying: 2, dragon: 0.5 },
  grass:    { fire: 0.5, water: 2, grass: 0.5, poison: 0.5, ground: 2, flying: 0.5, bug: 0.5, rock: 2, dragon: 0.5, steel: 0.5 },
  ice:      { fire: 0.5, water: 0.5, grass: 2, ice: 0.5, ground: 2, flying: 2, dragon: 2, steel: 0.5 },
  fighting: { normal: 2, ice: 2, poison: 0.5, flying: 0.5, psychic: 0.5, bug: 0.5, rock: 2, ghost: 0, dark: 2, steel: 2, fairy: 0.5 },
  poison:   { grass: 2, poison: 0.5, ground: 0.5, rock: 0.5, ghost: 0.5, steel: 0, fairy: 2 },
  ground:   { fire: 2, electric: 2, grass: 0.5, poison: 2, flying: 0, bug: 0.5, rock: 2, steel: 2 },
  flying:   { electric: 0.5, grass: 2, fighting: 2, bug: 2, rock: 0.5, steel: 0.5 },
  psychic:  { fighting: 2, poison: 2, psychic: 0.5, dark: 0, steel: 0.5 },
  bug:      { fire: 0.5, grass: 2, fighting: 0.5, poison: 0.5, flying: 0.5, psychic: 2, ghost: 0.5, dark: 2, steel: 0.5, fairy: 0.5 },
  rock:     { fire: 2, ice: 2, fighting: 0.5, ground: 0.5, flying: 2, bug: 2, steel: 0.5 },
  ghost:    { normal: 0, psychic: 2, ghost: 2, dark: 0.5 },
  dragon:   { dragon: 2, steel: 0.5, fairy: 0 },
  dark:     { fighting: 0.5, psychic: 2, ghost: 2, dark: 0.5, fairy: 0.5 },
  steel:    { fire: 0.5, water: 0.5, electric: 0.5, ice: 2, rock: 2, steel: 0.5, fairy: 2 },
  fairy:    { fire: 0.5, fighting: 2, poison: 0.5, dragon: 2, dark: 2, steel: 0.5 }
};

/* --------------------------------------------------------------------------
   MOVES
   cat: 'phys' | 'spec' | 'status'
   acc: 0 means the move cannot miss
   pri: move priority bracket (default 0)
   fx : optional effects bag
        status  {kind, chance}      brn/par/psn/tox/slp/frz
        stat    {who, mods, chance} who: 'self' | 'foe'
        flinch  chance 0..1
        drain   fraction of damage dealt restored
        recoil  fraction of damage dealt taken
        heal    fraction of max HP restored
        confuse chance 0..1
        critUp  extra crit stage
        protect / leechSeed / suckerPunch flags
   -------------------------------------------------------------------------- */
const MOVES = {
  /* --- fire --- */
  'flamethrower':  { name: 'Flamethrower',  type: 'fire',     cat: 'spec',   pw: 90,  acc: 100, pp: 15, fx: { status: { kind: 'brn', chance: 0.10 } } },
  'flare-blitz':   { name: 'Flare Blitz',   type: 'fire',     cat: 'phys',   pw: 120, acc: 100, pp: 15, fx: { recoil: 1 / 3, status: { kind: 'brn', chance: 0.10 } } },
  'fire-punch':    { name: 'Fire Punch',    type: 'fire',     cat: 'phys',   pw: 75,  acc: 100, pp: 15, fx: { status: { kind: 'brn', chance: 0.10 } } },
  'will-o-wisp':   { name: 'Will-O-Wisp',   type: 'fire',     cat: 'status', pw: 0,   acc: 85,  pp: 15, fx: { status: { kind: 'brn', chance: 1 } } },

  /* --- water --- */
  'surf':          { name: 'Surf',          type: 'water',    cat: 'spec',   pw: 90,  acc: 100, pp: 15 },
  'hydro-pump':    { name: 'Hydro Pump',    type: 'water',    cat: 'spec',   pw: 110, acc: 80,  pp: 5 },
  'waterfall':     { name: 'Waterfall',     type: 'water',    cat: 'phys',   pw: 80,  acc: 100, pp: 15, fx: { flinch: 0.20 } },
  'aqua-jet':      { name: 'Aqua Jet',      type: 'water',    cat: 'phys',   pw: 40,  acc: 100, pp: 20, pri: 1 },

  /* --- ice --- */
  'ice-beam':      { name: 'Ice Beam',      type: 'ice',      cat: 'spec',   pw: 90,  acc: 100, pp: 10, fx: { status: { kind: 'frz', chance: 0.10 } } },
  'icicle-crash':  { name: 'Icicle Crash',  type: 'ice',      cat: 'phys',   pw: 85,  acc: 90,  pp: 10, fx: { flinch: 0.30 } },

  /* --- electric --- */
  'thunderbolt':   { name: 'Thunderbolt',   type: 'electric', cat: 'spec',   pw: 90,  acc: 100, pp: 15, fx: { status: { kind: 'par', chance: 0.10 } } },
  'thunder':       { name: 'Thunder',       type: 'electric', cat: 'spec',   pw: 110, acc: 70,  pp: 10, fx: { status: { kind: 'par', chance: 0.30 } } },
  'volt-tackle':   { name: 'Volt Tackle',   type: 'electric', cat: 'phys',   pw: 120, acc: 100, pp: 15, fx: { recoil: 1 / 3, status: { kind: 'par', chance: 0.10 } } },
  'thunder-punch': { name: 'Thunder Punch', type: 'electric', cat: 'phys',   pw: 75,  acc: 100, pp: 15, fx: { status: { kind: 'par', chance: 0.10 } } },
  'thunder-wave':  { name: 'Thunder Wave',  type: 'electric', cat: 'status', pw: 0,   acc: 90,  pp: 20, fx: { status: { kind: 'par', chance: 1 } } },

  /* --- grass --- */
  'giga-drain':    { name: 'Giga Drain',    type: 'grass',    cat: 'spec',   pw: 75,  acc: 100, pp: 10, fx: { drain: 0.5 } },
  'power-whip':    { name: 'Power Whip',    type: 'grass',    cat: 'phys',   pw: 120, acc: 85,  pp: 10 },
  'energy-ball':   { name: 'Energy Ball',   type: 'grass',    cat: 'spec',   pw: 90,  acc: 100, pp: 10, fx: { stat: { who: 'foe', mods: { spd: -1 }, chance: 0.10 } } },
  'leech-seed':    { name: 'Leech Seed',    type: 'grass',    cat: 'status', pw: 0,   acc: 90,  pp: 10, fx: { leechSeed: true } },

  /* --- poison --- */
  'sludge-bomb':   { name: 'Sludge Bomb',   type: 'poison',   cat: 'spec',   pw: 90,  acc: 100, pp: 10, fx: { status: { kind: 'psn', chance: 0.30 } } },
  'toxic':         { name: 'Toxic',         type: 'poison',   cat: 'status', pw: 0,   acc: 90,  pp: 10, fx: { status: { kind: 'tox', chance: 1 } } },

  /* --- ground --- */
  'earthquake':    { name: 'Earthquake',    type: 'ground',   cat: 'phys',   pw: 100, acc: 100, pp: 10 },
  'earth-power':   { name: 'Earth Power',   type: 'ground',   cat: 'spec',   pw: 90,  acc: 100, pp: 10, fx: { stat: { who: 'foe', mods: { spd: -1 }, chance: 0.10 } } },

  /* --- rock --- */
  'rock-slide':    { name: 'Rock Slide',    type: 'rock',     cat: 'phys',   pw: 75,  acc: 90,  pp: 10, fx: { flinch: 0.30 } },
  'stone-edge':    { name: 'Stone Edge',    type: 'rock',     cat: 'phys',   pw: 100, acc: 80,  pp: 5,  fx: { critUp: 1 } },

  /* --- fighting --- */
  'close-combat':  { name: 'Close Combat',  type: 'fighting', cat: 'phys',   pw: 120, acc: 100, pp: 5,  fx: { stat: { who: 'self', mods: { def: -1, spd: -1 }, chance: 1 } } },
  'mach-punch':    { name: 'Mach Punch',    type: 'fighting', cat: 'phys',   pw: 40,  acc: 100, pp: 30, pri: 1 },
  'bulk-up':       { name: 'Bulk Up',       type: 'fighting', cat: 'status', pw: 0,   acc: 0,   pp: 20, fx: { stat: { who: 'self', mods: { atk: 1, def: 1 }, chance: 1 } } },

  /* --- psychic --- */
  'psychic':       { name: 'Psychic',       type: 'psychic',  cat: 'spec',   pw: 90,  acc: 100, pp: 10, fx: { stat: { who: 'foe', mods: { spd: -1 }, chance: 0.10 } } },
  'zen-headbutt':  { name: 'Zen Headbutt',  type: 'psychic',  cat: 'phys',   pw: 80,  acc: 90,  pp: 15, fx: { flinch: 0.20 } },
  'calm-mind':     { name: 'Calm Mind',     type: 'psychic',  cat: 'status', pw: 0,   acc: 0,   pp: 20, fx: { stat: { who: 'self', mods: { spa: 1, spd: 1 }, chance: 1 } } },
  'agility':       { name: 'Agility',       type: 'psychic',  cat: 'status', pw: 0,   acc: 0,   pp: 30, fx: { stat: { who: 'self', mods: { spe: 2 }, chance: 1 } } },

  /* --- ghost --- */
  'shadow-ball':   { name: 'Shadow Ball',   type: 'ghost',    cat: 'spec',   pw: 80,  acc: 100, pp: 15, fx: { stat: { who: 'foe', mods: { spd: -1 }, chance: 0.20 } } },
  'shadow-claw':   { name: 'Shadow Claw',   type: 'ghost',    cat: 'phys',   pw: 70,  acc: 100, pp: 15, fx: { critUp: 1 } },

  /* --- bug --- */
  'x-scissor':     { name: 'X-Scissor',     type: 'bug',      cat: 'phys',   pw: 80,  acc: 100, pp: 15 },

  /* --- flying --- */
  'air-slash':     { name: 'Air Slash',     type: 'flying',   cat: 'spec',   pw: 75,  acc: 95,  pp: 15, fx: { flinch: 0.30 } },
  'brave-bird':    { name: 'Brave Bird',    type: 'flying',   cat: 'phys',   pw: 120, acc: 100, pp: 15, fx: { recoil: 1 / 3 } },
  'aerial-ace':    { name: 'Aerial Ace',    type: 'flying',   cat: 'phys',   pw: 60,  acc: 0,   pp: 20 },
  'roost':         { name: 'Roost',         type: 'flying',   cat: 'status', pw: 0,   acc: 0,   pp: 10, fx: { heal: 0.5 } },

  /* --- dragon --- */
  'dragon-claw':   { name: 'Dragon Claw',   type: 'dragon',   cat: 'phys',   pw: 80,  acc: 100, pp: 15 },
  'dragon-pulse':  { name: 'Dragon Pulse',  type: 'dragon',   cat: 'spec',   pw: 85,  acc: 100, pp: 10 },
  'dragon-dance':  { name: 'Dragon Dance',  type: 'dragon',   cat: 'status', pw: 0,   acc: 0,   pp: 20, fx: { stat: { who: 'self', mods: { atk: 1, spe: 1 }, chance: 1 } } },

  /* --- dark --- */
  'crunch':        { name: 'Crunch',        type: 'dark',     cat: 'phys',   pw: 80,  acc: 100, pp: 15, fx: { stat: { who: 'foe', mods: { def: -1 }, chance: 0.20 } } },
  'dark-pulse':    { name: 'Dark Pulse',    type: 'dark',     cat: 'spec',   pw: 80,  acc: 100, pp: 15, fx: { flinch: 0.20 } },
  'sucker-punch':  { name: 'Sucker Punch',  type: 'dark',     cat: 'phys',   pw: 70,  acc: 100, pp: 5,  pri: 1, fx: { suckerPunch: true } },
  'nasty-plot':    { name: 'Nasty Plot',    type: 'dark',     cat: 'status', pw: 0,   acc: 0,   pp: 20, fx: { stat: { who: 'self', mods: { spa: 2 }, chance: 1 } } },

  /* --- steel --- */
  'iron-head':     { name: 'Iron Head',     type: 'steel',    cat: 'phys',   pw: 80,  acc: 100, pp: 15, fx: { flinch: 0.30 } },
  'flash-cannon':  { name: 'Flash Cannon',  type: 'steel',    cat: 'spec',   pw: 80,  acc: 100, pp: 10, fx: { stat: { who: 'foe', mods: { spd: -1 }, chance: 0.10 } } },
  'iron-defense':  { name: 'Iron Defense',  type: 'steel',    cat: 'status', pw: 0,   acc: 0,   pp: 15, fx: { stat: { who: 'self', mods: { def: 2 }, chance: 1 } } },

  /* --- fairy --- */
  'moonblast':     { name: 'Moonblast',     type: 'fairy',    cat: 'spec',   pw: 95,  acc: 100, pp: 15, fx: { stat: { who: 'foe', mods: { spa: -1 }, chance: 0.30 } } },

  /* --- normal --- */
  'body-slam':     { name: 'Body Slam',     type: 'normal',   cat: 'phys',   pw: 85,  acc: 100, pp: 15, fx: { status: { kind: 'par', chance: 0.30 } } },
  'double-edge':   { name: 'Double-Edge',   type: 'normal',   cat: 'phys',   pw: 120, acc: 100, pp: 15, fx: { recoil: 1 / 3 } },
  'extreme-speed': { name: 'Extreme Speed', type: 'normal',   cat: 'phys',   pw: 80,  acc: 100, pp: 5,  pri: 2 },
  'quick-attack':  { name: 'Quick Attack',  type: 'normal',   cat: 'phys',   pw: 40,  acc: 100, pp: 30, pri: 1 },
  'swords-dance':  { name: 'Swords Dance',  type: 'normal',   cat: 'status', pw: 0,   acc: 0,   pp: 20, fx: { stat: { who: 'self', mods: { atk: 2 }, chance: 1 } } },
  'recover':       { name: 'Recover',       type: 'normal',   cat: 'status', pw: 0,   acc: 0,   pp: 10, fx: { heal: 0.5 } },
  'protect':       { name: 'Protect',       type: 'normal',   cat: 'status', pw: 0,   acc: 0,   pp: 10, pri: 4, fx: { protect: true } },

  /* Used only when every move has run out of PP. */
  'struggle':      { name: 'Struggle',      type: '???',      cat: 'phys',   pw: 50,  acc: 0,   pp: 1,  fx: { recoil: 0.25 } }
};

/* --------------------------------------------------------------------------
   SPECIES
   base : [hp, atk, def, spa, spd, spe]
   sprite: parameters consumed by sprites.js
   -------------------------------------------------------------------------- */
const SPECIES = {
  pikachu: {
    name: 'Pikachu', types: ['electric'], base: [35, 55, 40, 50, 50, 90],
    moves: ['thunderbolt', 'volt-tackle', 'quick-attack', 'thunder-wave'],
    dex: 'Static-charged cheeks crackle when it is agitated.',
    sprite: { arch: 'biped', c1: '#f7d247', c2: '#3a2d15', c3: '#ffe9a0', scale: 0.72,
      ears: 'pointy', earTip: '#2a2318', tail: 'zigzag', cheeks: '#ef4a4a', eyes: 'cute' }
  },
  charizard: {
    name: 'Charizard', types: ['fire', 'flying'], base: [78, 84, 78, 109, 85, 100],
    moves: ['flamethrower', 'air-slash', 'dragon-pulse', 'roost'],
    dex: 'Its wing-driven flame can melt boulders.',
    sprite: { arch: 'biped', c1: '#f08a3c', c2: '#c25a1e', c3: '#f5e0a8', scale: 1.05,
      wings: 'bat', wingC: '#3f7fb8', tail: 'flame', horn: 'pair', eyes: 'sharp', muzzle: true }
  },
  blastoise: {
    name: 'Blastoise', types: ['water'], base: [79, 83, 100, 85, 105, 78],
    moves: ['surf', 'ice-beam', 'flash-cannon', 'iron-defense'],
    dex: 'Hydro cannons on its shell punch through steel plate.',
    sprite: { arch: 'biped', c1: '#63a8e8', c2: '#3a6da8', c3: '#f0d9a8', scale: 1.0,
      shell: '#9b6b3c', extras: ['cannons'], eyes: 'sharp', muzzle: true }
  },
  venusaur: {
    name: 'Venusaur', types: ['grass', 'poison'], base: [80, 82, 83, 100, 100, 80],
    moves: ['power-whip', 'sludge-bomb', 'giga-drain', 'leech-seed'],
    dex: 'The bloom on its back drinks sunlight all day.',
    sprite: { arch: 'quad', c1: '#5fc0a8', c2: '#3d8f7d', c3: '#bfe6d8', scale: 1.05,
      extras: ['flower'], marks: 'spots', eyes: 'sharp' }
  },
  gengar: {
    name: 'Gengar', types: ['ghost', 'poison'], base: [60, 65, 60, 130, 75, 110],
    moves: ['shadow-ball', 'sludge-bomb', 'nasty-plot', 'will-o-wisp'],
    dex: 'It hides in shadows and steals the warmth around it.',
    sprite: { arch: 'blob', c1: '#7a5aa8', c2: '#4c3670', c3: '#ffffff', scale: 0.92,
      spikes: true, eyes: 'grin', ears: 'pointy', float: true }
  },
  machamp: {
    name: 'Machamp', types: ['fighting'], base: [90, 130, 80, 65, 85, 55],
    moves: ['close-combat', 'stone-edge', 'mach-punch', 'bulk-up'],
    dex: 'Four arms deliver five hundred punches a second.',
    sprite: { arch: 'biped', c1: '#7fb8c9', c2: '#4d8496', c3: '#e8d9a8', scale: 1.1,
      extras: ['fourarms'], eyes: 'sharp', crest: '#3b3b4a' }
  },
  alakazam: {
    name: 'Alakazam', types: ['psychic'], base: [55, 50, 45, 135, 95, 120],
    moves: ['psychic', 'shadow-ball', 'energy-ball', 'calm-mind'],
    dex: 'Its brain never stops growing; spoons bend nearby.',
    sprite: { arch: 'biped', c1: '#d8a24a', c2: '#8a6a2a', c3: '#8f6f3f', scale: 0.95,
      extras: ['spoons', 'mustache'], horn: 'pair', eyes: 'glow' }
  },
  snorlax: {
    name: 'Snorlax', types: ['normal'], base: [160, 110, 65, 65, 110, 30],
    moves: ['body-slam', 'earthquake', 'crunch', 'recover'],
    dex: 'It eats, it sleeps, and it does not move for anyone.',
    sprite: { arch: 'blob', c1: '#3f6b7a', c2: '#2c4b58', c3: '#f0dfae', scale: 1.2,
      eyes: 'closed', ears: 'round' }
  },
  gyarados: {
    name: 'Gyarados', types: ['water', 'flying'], base: [95, 125, 79, 60, 100, 81],
    moves: ['waterfall', 'crunch', 'earthquake', 'dragon-dance'],
    dex: 'Once it rampages, nothing calms it until it is spent.',
    sprite: { arch: 'serpent', c1: '#4a8fd8', c2: '#2e6099', c3: '#e8c86a', scale: 1.15,
      crest: '#d8d8e8', fins: '#e05a5a', eyes: 'furious' }
  },
  dragonite: {
    name: 'Dragonite', types: ['dragon', 'flying'], base: [91, 134, 95, 100, 100, 80],
    moves: ['dragon-claw', 'extreme-speed', 'brave-bird', 'roost'],
    dex: 'A kindly giant said to guide lost sailors home.',
    sprite: { arch: 'biped', c1: '#e8b44a', c2: '#c08f2a', c3: '#f5e6bb', scale: 1.1,
      wings: 'small', wingC: '#7fbfd8', horn: 'pair', ears: 'round', eyes: 'cute', muzzle: true }
  },
  lapras: {
    name: 'Lapras', types: ['water', 'ice'], base: [130, 85, 80, 85, 95, 60],
    moves: ['surf', 'ice-beam', 'thunder', 'dragon-pulse'],
    dex: 'It ferries travellers across freezing water, singing.',
    sprite: { arch: 'neck', c1: '#6fb2d8', c2: '#4a86ad', c3: '#efe6d0', scale: 1.15,
      shell: '#8fa5b8', ears: 'round', eyes: 'cute' }
  },
  arcanine: {
    name: 'Arcanine', types: ['fire'], base: [90, 110, 80, 100, 80, 95],
    moves: ['flare-blitz', 'close-combat', 'extreme-speed', 'will-o-wisp'],
    dex: 'Legend says it can run six thousand miles in a day.',
    sprite: { arch: 'quad', c1: '#f0a13c', c2: '#2f2f38', c3: '#f5ead0', scale: 1.05,
      marks: 'stripes', mane: '#f5ead0', tail: 'fluffy', eyes: 'sharp' }
  },
  golem: {
    name: 'Golem', types: ['rock', 'ground'], base: [80, 120, 130, 55, 65, 45],
    moves: ['earthquake', 'stone-edge', 'thunder-punch', 'double-edge'],
    dex: 'It sheds its stone hide once a year and eats it.',
    sprite: { arch: 'blob', c1: '#9c7a52', c2: '#6d5238', c3: '#c9b08a', scale: 1.05,
      marks: 'plates', eyes: 'sharp', stubby: true }
  },
  scyther: {
    name: 'Scyther', types: ['bug', 'flying'], base: [70, 110, 80, 55, 80, 105],
    moves: ['x-scissor', 'aerial-ace', 'quick-attack', 'swords-dance'],
    dex: 'It moves so fast that only the slashes are visible.',
    sprite: { arch: 'insect', c1: '#7fc44a', c2: '#4d8a2a', c3: '#e8f0c0', scale: 1.0,
      wings: 'insect', extras: ['scythes'], eyes: 'furious' }
  },
  nidoking: {
    name: 'Nidoking', types: ['poison', 'ground'], base: [81, 102, 77, 85, 75, 85],
    moves: ['earth-power', 'sludge-bomb', 'ice-beam', 'thunderbolt'],
    dex: 'One swing of its tail snaps a transmission tower.',
    sprite: { arch: 'biped', c1: '#9a6fc4', c2: '#6b4a8f', c3: '#d8c4ea', scale: 1.05,
      horn: 'single', spikes: true, tail: 'spike', eyes: 'furious', muzzle: true }
  },
  jolteon: {
    name: 'Jolteon', types: ['electric'], base: [65, 65, 60, 110, 95, 130],
    moves: ['thunderbolt', 'shadow-ball', 'thunder-wave', 'quick-attack'],
    dex: 'Its fur stands on end and fires ten-thousand-volt darts.',
    sprite: { arch: 'quad', c1: '#f5e05a', c2: '#d8b83a', c3: '#fdf3c0', scale: 0.9,
      spikyFur: true, ears: 'pointy', tail: 'spike', eyes: 'sharp' }
  },
  umbreon: {
    name: 'Umbreon', types: ['dark'], base: [95, 65, 110, 60, 130, 65],
    moves: ['dark-pulse', 'toxic', 'recover', 'protect'],
    dex: 'Its rings glow when moonlight touches them.',
    sprite: { arch: 'quad', c1: '#3a3a4e', c2: '#26263a', c3: '#f5d24a', scale: 0.92,
      marks: 'rings', ears: 'long', tail: 'long', eyes: 'glow', eyeC: '#f04a6a' }
  },
  steelix: {
    name: 'Steelix', types: ['steel', 'ground'], base: [75, 85, 200, 55, 65, 30],
    moves: ['earthquake', 'iron-head', 'stone-edge', 'fire-punch'],
    dex: 'It burrows so deep that it reaches the mantle.',
    sprite: { arch: 'serpent', c1: '#9aa2b8', c2: '#6b7288', c3: '#c8cede', scale: 1.2,
      marks: 'plates', crest: '#c8cede', eyes: 'furious', jaw: true }
  },
  tyranitar: {
    name: 'Tyranitar', types: ['rock', 'dark'], base: [100, 134, 110, 95, 100, 61],
    moves: ['stone-edge', 'crunch', 'earthquake', 'sucker-punch'],
    dex: 'Mountains change shape after one of its tantrums.',
    sprite: { arch: 'biped', c1: '#7fb05a', c2: '#4d7a34', c3: '#c8d8a0', scale: 1.15,
      marks: 'plates', horn: 'single', spikes: true, tail: 'spike', eyes: 'furious', muzzle: true }
  },
  lucario: {
    name: 'Lucario', types: ['fighting', 'steel'], base: [70, 110, 70, 115, 70, 90],
    moves: ['close-combat', 'iron-head', 'extreme-speed', 'swords-dance'],
    dex: 'It reads the aura of everything within half a mile.',
    sprite: { arch: 'biped', c1: '#4a7fc4', c2: '#2f3a52', c3: '#e8c86a', scale: 0.98,
      ears: 'pointy', mask: true, extras: ['aura'], eyes: 'sharp', muzzle: true }
  },
  garchomp: {
    name: 'Garchomp', types: ['dragon', 'ground'], base: [108, 130, 95, 80, 85, 102],
    moves: ['earthquake', 'dragon-claw', 'stone-edge', 'swords-dance'],
    dex: 'Folded wings let it fly at the speed of sound.',
    sprite: { arch: 'biped', c1: '#3f5f8f', c2: '#2a3f61', c3: '#d84a4a', scale: 1.1,
      wings: 'blade', wingC: '#3f5f8f', horn: 'fin', tail: 'fin', eyes: 'furious', muzzle: true }
  },
  gardevoir: {
    name: 'Gardevoir', types: ['psychic', 'fairy'], base: [68, 65, 65, 125, 115, 80],
    moves: ['psychic', 'moonblast', 'shadow-ball', 'calm-mind'],
    dex: 'It will fold space itself to protect its trainer.',
    sprite: { arch: 'float', c1: '#f0f2f8', c2: '#5fc4a8', c3: '#e05a7a', scale: 1.0,
      extras: ['gown'], eyes: 'calm' }
  },
  greninja: {
    name: 'Greninja', types: ['water', 'dark'], base: [72, 95, 67, 103, 71, 122],
    moves: ['hydro-pump', 'dark-pulse', 'ice-beam', 'aqua-jet'],
    dex: 'It vanishes mid-leap and strikes from the blind side.',
    sprite: { arch: 'biped', c1: '#4a7fa8', c2: '#2f5170', c3: '#e8eff5', scale: 0.98,
      extras: ['scarf'], scarfC: '#e05a7a', crest: '#2f5170', eyes: 'sharp' }
  },
  sylveon: {
    name: 'Sylveon', types: ['fairy'], base: [95, 65, 65, 110, 130, 60],
    moves: ['moonblast', 'psychic', 'calm-mind', 'recover'],
    dex: 'Its ribbons soothe hostility on contact.',
    sprite: { arch: 'quad', c1: '#f4d9e4', c2: '#e090b0', c3: '#f8f0e8', scale: 0.92,
      extras: ['ribbons'], ears: 'long', tail: 'fluffy', eyes: 'cute' }
  },
  blaziken: {
    name: 'Blaziken', types: ['fire', 'fighting'], base: [80, 120, 70, 110, 70, 80],
    moves: ['flare-blitz', 'close-combat', 'thunder-punch', 'swords-dance'],
    dex: 'Flames jet from its wrists when it is ready to fight.',
    sprite: { arch: 'biped', c1: '#e8613c', c2: '#c0442a', c3: '#f0e0b0', scale: 1.05,
      crest: '#f0d060', extras: ['wristfire'], eyes: 'sharp', beak: true }
  },
  metagross: {
    name: 'Metagross', types: ['steel', 'psychic'], base: [80, 135, 130, 95, 90, 70],
    moves: ['iron-head', 'zen-headbutt', 'earthquake', 'agility'],
    dex: 'Four brains linked together out-calculate a supercomputer.',
    sprite: { arch: 'mech', c1: '#8f9bb8', c2: '#5f6b88', c3: '#e8c86a', scale: 1.15,
      eyes: 'glow', eyeC: '#e05a5a' }
  },
  weavile: {
    name: 'Weavile', types: ['dark', 'ice'], base: [70, 120, 65, 45, 85, 125],
    moves: ['icicle-crash', 'crunch', 'shadow-claw', 'swords-dance'],
    dex: 'Packs of them carve signals into tree bark before a hunt.',
    sprite: { arch: 'biped', c1: '#3f4e64', c2: '#26303f', c3: '#e8eff5', scale: 0.92,
      ears: 'pointy', crest: '#e05a7a', tail: 'long', extras: ['claws'], eyes: 'sharp' }
  },
  heracross: {
    name: 'Heracross', types: ['bug', 'fighting'], base: [80, 125, 75, 40, 95, 85],
    moves: ['x-scissor', 'close-combat', 'rock-slide', 'bulk-up'],
    dex: 'Its horn can hurl an opponent clear over the treeline.',
    sprite: { arch: 'insect', c1: '#4a5fc4', c2: '#2f3d88', c3: '#d8b04a', scale: 1.0,
      horn: 'single', wings: 'insect', eyes: 'furious' }
  },
  mamoswine: {
    name: 'Mamoswine', types: ['ice', 'ground'], base: [110, 130, 80, 70, 60, 80],
    moves: ['earthquake', 'icicle-crash', 'stone-edge', 'double-edge'],
    dex: 'Ice-age tusks; the colder it gets, the bolder it charges.',
    sprite: { arch: 'quad', c1: '#8a6f5e', c2: '#5e4a3c', c3: '#c9b08a', scale: 1.15,
      mane: '#c9b08a', horn: 'tusks', ears: 'round', eyes: 'sharp' }
  }
};

const SPECIES_IDS = Object.keys(SPECIES);
