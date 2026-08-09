// MoveDef registry. Shape documented in docs/ARCHITECTURE.md §2.2.
// Owned by the move-design agent. Add moves; never renumber or rename ids.

const M = [];
const def = (o) => {
  M.push({
    power: 0, accuracy: 100, priority: 0, target: 'foe', critStage: 0,
    contact: false, flags: [], hits: null, drain: 0, recoil: 0, effects: null,
    ...o
  });
};

/* ---------------- SLASH ---------------- */
def({ id: 'one_sword_slash', name: 'Single Blade', type: 'SLASH', category: 'physical', power: 60, accuracy: 100, pp: 30, contact: true, critStage: 1, flags: ['slice', 'protect'],
  desc: 'High critical-hit ratio.', flavor: 'One clean line through the air.',
  fx: { key: 'slash_single', color: '#c9d4e0', shape: 'arc', hitstop: 70, shake: 0.4, sfx: 'slash_light' } });
def({ id: 'three_sword_style', name: 'Oni Giri', type: 'SLASH', category: 'physical', power: 95, accuracy: 95, pp: 10, contact: true, critStage: 1, flags: ['slice', 'protect'],
  desc: 'Three blades cross at once. High crit ratio.', flavor: 'Demon slash. Nothing survives the crossing.',
  fx: { key: 'slash_triple', color: '#e8f0ff', shape: 'arc', scale: 1.4, hitstop: 130, shake: 0.9, sfx: 'slash_heavy' } });
def({ id: 'flying_slash', name: 'Flying Edge', type: 'SLASH', category: 'special', power: 70, accuracy: 100, pp: 15, flags: ['slice', 'protect'],
  desc: 'A compressed air blade launched at range.', flavor: 'The cut arrives before the swordsman.',
  fx: { key: 'slash_projectile', color: '#a8d8ff', shape: 'beam', hitstop: 60, shake: 0.4, sfx: 'slash_air' } });
def({ id: 'black_blade', name: 'Black Blade', type: 'SLASH', category: 'physical', power: 120, accuracy: 90, pp: 5, contact: true, critStage: 1, flags: ['slice', 'protect'],
  desc: 'A world-splitting downward stroke.', flavor: 'Nothing in the world is unable to be cut.',
  fx: { key: 'slash_worldsplit', color: '#1a1a22', shape: 'arc', scale: 2.2, hitstop: 220, shake: 1.6, sfx: 'slash_world' } });

/* ---------------- FIST ---------------- */
def({ id: 'gum_gum_pistol', name: 'Gum-Gum Pistol', type: 'FIST', category: 'physical', power: 55, accuracy: 100, pp: 30, contact: true, flags: ['punch', 'protect'],
  desc: 'A stretched fist snaps out from range.', flavor: 'It goes further than it has any right to.',
  fx: { key: 'stretch_punch', color: '#e8743b', shape: 'beam', hitstop: 80, shake: 0.5, sfx: 'impact_light' } });
def({ id: 'gum_gum_gatling', name: 'Gum-Gum Gatling', type: 'FIST', category: 'physical', power: 25, accuracy: 90, pp: 15, contact: true, hits: [3, 5], flags: ['punch', 'protect'],
  desc: 'Hits 3–5 times in one turn.', flavor: 'A wall of fists. Blocking one accomplishes nothing.',
  fx: { key: 'flurry_punch', color: '#ff8a4c', shape: 'melee', hitstop: 45, shake: 0.35, sfx: 'impact_light' } });
def({ id: 'red_hawk', name: 'Red Hawk', type: 'FLAME', category: 'physical', power: 100, accuracy: 95, pp: 10, contact: true, flags: ['punch', 'protect'],
  effects: [{ kind: 'status', value: 'brn', chance: 20, target: 'foe' }],
  desc: 'A burning haymaker. 20% burn.', flavor: 'Friction, will, and a promise, in that order.',
  fx: { key: 'flame_punch', color: '#ff4a1c', shape: 'melee', scale: 1.5, hitstop: 160, shake: 1.1, sfx: 'impact_fire' } });
def({ id: 'iron_body', name: 'Iron Body', type: 'MECHA', category: 'status', power: 0, accuracy: null, pp: 20, target: 'self',
  effects: [{ kind: 'boost', stats: { def: 2 }, target: 'self' }],
  desc: 'Sharply raises Defense.', flavor: 'Tense every fibre until steel is the softer option.',
  fx: { key: 'buff_harden', color: '#9aa7b5', shape: 'aura', sfx: 'buff' } });
def({ id: 'sky_walk', name: 'Sky Walk', type: 'WIND', category: 'status', power: 0, accuracy: null, pp: 15, target: 'self',
  effects: [{ kind: 'boost', stats: { spe: 2 }, target: 'self' }],
  desc: 'Sharply raises Speed.', flavor: 'Kick the air hard enough and it holds.',
  fx: { key: 'buff_speed', color: '#a7e8c0', shape: 'aura', sfx: 'buff' } });
def({ id: 'diable_jambe', name: 'Diable Jambe', type: 'FLAME', category: 'physical', power: 90, accuracy: 100, pp: 10, contact: true, flags: ['protect'],
  effects: [{ kind: 'status', value: 'brn', chance: 30, target: 'foe' }],
  desc: 'A red-hot spinning kick. 30% burn.', flavor: 'Spin fast enough and the leg forgets it is meat.',
  fx: { key: 'flame_kick', color: '#ff5a1c', shape: 'melee', scale: 1.3, hitstop: 140, shake: 0.9, sfx: 'impact_fire' } });

/* ---------------- HAKI ---------------- */
def({ id: 'armament', name: 'Armament', type: 'HAKI', category: 'status', power: 0, accuracy: null, pp: 15, target: 'self',
  effects: [{ kind: 'boost', stats: { atk: 1, def: 1 }, target: 'self' }],
  desc: 'Raises Attack and Defense.', flavor: 'Black plates the skin. The intangible becomes hittable.',
  fx: { key: 'haki_coat', color: '#2b2d42', shape: 'aura', sfx: 'haki' } });
def({ id: 'conquerors_haki', name: "Conqueror's Haki", type: 'HAKI', category: 'status', power: 0, accuracy: 100, pp: 5, target: 'foe',
  effects: [{ kind: 'boost', stats: { atk: -1, spa: -1 }, target: 'foe' }, { kind: 'volatile', value: 'flinch', chance: 30, target: 'foe' }],
  desc: 'Lowers the foe\'s Attack and Sp. Atk. May cause flinching.', flavor: 'A room full of people falls down. You did not move.',
  fx: { key: 'conqueror', color: '#7a4fd0', shape: 'burst', scale: 2, hitstop: 200, shake: 1.4, sfx: 'conqueror' } });
def({ id: 'divine_departure', name: 'Divine Departure', type: 'HAKI', category: 'physical', power: 130, accuracy: 90, pp: 5, contact: true, flags: ['punch', 'protect'], recoil: 0.25,
  desc: 'A colossal haki-clad blow. User takes 25% recoil.', flavor: 'The horizon relocates.',
  fx: { key: 'haki_smash', color: '#4a3fd0', shape: 'melee', scale: 2, hitstop: 240, shake: 1.8, sfx: 'impact_world' } });

/* ---------------- FLAME ---------------- */
def({ id: 'fire_fist', name: 'Fire Fist', type: 'FLAME', category: 'special', power: 95, accuracy: 100, pp: 10,
  effects: [{ kind: 'status', value: 'brn', chance: 20, target: 'foe' }],
  desc: 'A column of flame in the shape of a punch. 20% burn.', flavor: 'Hiken.',
  fx: { key: 'fire_column', color: '#ff5a36', shape: 'beam', scale: 1.6, hitstop: 120, shake: 1, sfx: 'fire_big' } });
def({ id: 'flame_commandment', name: 'Flame Commandment', type: 'FLAME', category: 'special', power: 0, accuracy: null, pp: 5, target: 'field',
  effects: [{ kind: 'weather', value: 'sun' }],
  desc: 'Sets Blazing Sun for 5 turns.', flavor: 'The sky agrees with you now.',
  fx: { key: 'weather_sun', color: '#ffb03a', shape: 'aura', sfx: 'weather' } });

/* ---------------- FROST ---------------- */
def({ id: 'ice_age', name: 'Ice Age', type: 'FROST', category: 'special', power: 90, accuracy: 90, pp: 10,
  effects: [{ kind: 'status', value: 'frz', chance: 15, target: 'foe' }],
  desc: 'Freezes the sea itself. 15% freeze.', flavor: 'The ocean stops mid-wave and stays that way.',
  fx: { key: 'ice_spread', color: '#7fd8ff', shape: 'burst', scale: 1.7, hitstop: 130, shake: 0.9, sfx: 'ice' } });
def({ id: 'frost_veil', name: 'Frost Veil', type: 'FROST', category: 'status', power: 0, accuracy: null, pp: 10, target: 'field',
  effects: [{ kind: 'weather', value: 'hail' }],
  desc: 'Summons a blizzard for 5 turns.', flavor: '',
  fx: { key: 'weather_hail', color: '#bfe8ff', shape: 'aura', sfx: 'weather' } });

/* ---------------- SEA ---------------- */
def({ id: 'fishman_karate', name: 'Fish-Man Karate', type: 'SEA', category: 'physical', power: 85, accuracy: 100, pp: 15, contact: true, flags: ['punch', 'protect'],
  desc: 'Strikes the water inside the target.', flavor: 'You are mostly water. That is the whole technique.',
  fx: { key: 'water_shock', color: '#2a7fd4', shape: 'melee', scale: 1.3, hitstop: 120, shake: 0.8, sfx: 'water_hit' } });
def({ id: 'tidal_call', name: 'Tidal Call', type: 'SEA', category: 'status', power: 0, accuracy: null, pp: 5, target: 'field',
  effects: [{ kind: 'weather', value: 'rain' }],
  desc: 'Sets a Squall for 5 turns.', flavor: '',
  fx: { key: 'weather_rain', color: '#4a9fe0', shape: 'aura', sfx: 'weather' } });

/* ---------------- STORM ---------------- */
def({ id: 'thunderbolt_tempo', name: 'Thunderbolt Tempo', type: 'STORM', category: 'special', power: 90, accuracy: 100, pp: 10,
  effects: [{ kind: 'status', value: 'par', chance: 20, target: 'foe' }],
  desc: 'Calls lightning down. 20% paralysis.', flavor: 'The weather is a weapon if you read the manual.',
  fx: { key: 'lightning', color: '#f5c542', shape: 'beam', scale: 1.5, hitstop: 110, shake: 1, sfx: 'thunder' } });
def({ id: 'el_thor', name: 'El Thor', type: 'STORM', category: 'special', power: 120, accuracy: 85, pp: 5,
  effects: [{ kind: 'status', value: 'par', chance: 30, target: 'foe' }],
  desc: 'A pillar of judgement. 30% paralysis.', flavor: 'Two hundred million volts of theology.',
  fx: { key: 'lightning_pillar', color: '#fff3a0', shape: 'beam', scale: 2.2, hitstop: 200, shake: 1.6, sfx: 'thunder_big' } });

/* ---------------- EARTH / MECHA / others ---------------- */
def({ id: 'sables', name: 'Sables', type: 'EARTH', category: 'special', power: 80, accuracy: 100, pp: 10,
  effects: [{ kind: 'weather', value: 'sandstorm', chance: 100 }],
  desc: 'A sand cyclone. Also whips up a sandstorm.', flavor: '',
  fx: { key: 'sand_cyclone', color: '#c8a165', shape: 'burst', scale: 1.6, hitstop: 100, shake: 0.9, sfx: 'sand' } });
def({ id: 'coup_de_vent', name: 'Coup de Vent', type: 'MECHA', category: 'special', power: 110, accuracy: 90, pp: 5, flags: ['recharge'],
  desc: 'A compressed-air cannon. User must recharge.', flavor: 'SUPER.',
  fx: { key: 'air_cannon', color: '#9aa7b5', shape: 'beam', scale: 1.8, hitstop: 170, shake: 1.3, sfx: 'cannon' } });
def({ id: 'clutch', name: 'Clutch', type: 'FIST', category: 'physical', power: 75, accuracy: 100, pp: 15, contact: true, flags: ['protect'],
  effects: [{ kind: 'boost', stats: { def: -1 }, chance: 50, target: 'foe' }],
  desc: 'A joint lock. 50% chance to lower Defense.', flavor: 'Seis Fleur.',
  fx: { key: 'grapple', color: '#e05c9e', shape: 'melee', hitstop: 110, shake: 0.7, sfx: 'impact_med' } });
def({ id: 'soul_solid', name: 'Soul Solid', type: 'SPIRIT', category: 'special', power: 85, accuracy: 100, pp: 10, flags: ['slice', 'sound'],
  effects: [{ kind: 'boost', stats: { spd: -1 }, chance: 30, target: 'foe' }],
  desc: 'A chilling note that cuts the soul. May lower Sp. Def.', flavor: 'Yohohoho.',
  fx: { key: 'soul_slash', color: '#6fe3d0', shape: 'arc', hitstop: 100, shake: 0.6, sfx: 'soul' } });
def({ id: 'shambles', name: 'Shambles', type: 'MIND', category: 'status', power: 0, accuracy: null, pp: 10, target: 'self', priority: 0,
  effects: [{ kind: 'boost', stats: { spe: 1, eva: 1 }, target: 'self' }],
  desc: 'Raises Speed and Evasion.', flavor: 'Room. Everything inside it is a suggestion.',
  fx: { key: 'room_swap', color: '#7fd8ff', shape: 'aura', sfx: 'warp' } });
def({ id: 'gamma_knife', name: 'Gamma Knife', type: 'MIND', category: 'special', power: 105, accuracy: 90, pp: 5, critStage: 1,
  desc: 'An internal cut that ignores armour. High crit ratio.', flavor: 'No blood. That is the frightening part.',
  fx: { key: 'internal_cut', color: '#ff5c8a', shape: 'melee', scale: 1.4, hitstop: 180, shake: 1.1, sfx: 'slash_soft' } });
def({ id: 'venom_road', name: 'Venom Road', type: 'TOXIN', category: 'special', power: 80, accuracy: 100, pp: 10,
  effects: [{ kind: 'status', value: 'psn', chance: 40, target: 'foe' }],
  desc: 'A flood of poison. 40% poison.', flavor: '',
  fx: { key: 'poison_flood', color: '#8bc34a', shape: 'burst', scale: 1.4, hitstop: 90, shake: 0.7, sfx: 'sludge' } });
def({ id: 'shadow_steal', name: 'Shadow Steal', type: 'SHADOW', category: 'special', power: 75, accuracy: 100, pp: 10, drain: 0.5,
  desc: 'Drains half the damage dealt.', flavor: 'Your shadow is on the wrong wall now.',
  fx: { key: 'shadow_drain', color: '#5a3d7a', shape: 'beam', hitstop: 100, shake: 0.6, sfx: 'shadow' } });
def({ id: 'yasakani', name: 'Yasakani Sacred Jewel', type: 'LIGHT', category: 'special', power: 100, accuracy: 100, pp: 5,
  desc: 'A barrage of light at lightspeed.', flavor: 'It has already hit you. Twice.',
  fx: { key: 'light_barrage', color: '#ffe9a3', shape: 'beam', scale: 1.7, hitstop: 140, shake: 1, sfx: 'light' } });
def({ id: 'bolo_breath', name: 'Bolo Breath', type: 'BEAST', category: 'special', power: 110, accuracy: 90, pp: 5,
  effects: [{ kind: 'status', value: 'brn', chance: 20, target: 'foe' }],
  desc: 'A dragon\'s heat ray. 20% burn.', flavor: '',
  fx: { key: 'dragon_breath', color: '#8a6b3d', shape: 'beam', scale: 1.9, hitstop: 180, shake: 1.3, sfx: 'dragon' } });
def({ id: 'sonic_wail', name: 'Sonic Wail', type: 'SOUND', category: 'special', power: 70, accuracy: 100, pp: 15, flags: ['sound'],
  effects: [{ kind: 'boost', stats: { spa: -1 }, chance: 30, target: 'foe' }],
  desc: 'May lower the foe\'s Sp. Atk.', flavor: '',
  fx: { key: 'sound_wave', color: '#c084fc', shape: 'beam', hitstop: 80, shake: 0.5, sfx: 'sonic' } });
def({ id: 'void_step', name: 'Void Step', type: 'VOID', category: 'status', power: 0, accuracy: null, pp: 10, target: 'self', priority: 4,
  effects: [{ kind: 'volatile', value: 'protect', target: 'self' }],
  desc: 'Protects the user from all moves this turn.', flavor: '',
  fx: { key: 'protect', color: '#3a2f5b', shape: 'aura', sfx: 'shield' } });

/* ---------------- universal utility ---------------- */
def({ id: 'quick_strike', name: 'Quick Strike', type: 'FIST', category: 'physical', power: 40, accuracy: 100, pp: 30, priority: 1, contact: true, flags: ['protect'],
  desc: 'Always goes first.', flavor: '', fx: { key: 'quick', color: '#ffffff', shape: 'melee', hitstop: 60, shake: 0.3, sfx: 'impact_light' } });
def({ id: 'brace', name: 'Brace', type: 'MECHA', category: 'status', power: 0, accuracy: null, pp: 10, target: 'self', priority: 4,
  effects: [{ kind: 'volatile', value: 'protect', target: 'self' }],
  desc: 'Protects the user this turn.', flavor: '', fx: { key: 'protect', color: '#9aa7b5', shape: 'aura', sfx: 'shield' } });
def({ id: 'second_wind', name: 'Second Wind', type: 'SPIRIT', category: 'status', power: 0, accuracy: null, pp: 10, target: 'self',
  effects: [{ kind: 'heal', frac: 0.5, target: 'self' }],
  desc: 'Restores half of max HP.', flavor: '', fx: { key: 'heal', color: '#7fffc4', shape: 'aura', sfx: 'heal' } });
def({ id: 'caltrop_scatter', name: 'Caltrop Scatter', type: 'MECHA', category: 'status', power: 0, accuracy: null, pp: 20, target: 'foeSide',
  effects: [{ kind: 'hazard', value: 'caltrops', target: 'foeSide' }],
  desc: 'Scatters caltrops. Hurts foes as they switch in.', flavor: '', fx: { key: 'hazard', color: '#b0b8c4', shape: 'burst', sfx: 'scatter' } });
def({ id: 'iron_wall', name: 'Iron Wall', type: 'MECHA', category: 'status', power: 0, accuracy: null, pp: 10, target: 'allySide',
  effects: [{ kind: 'screen', value: 'reflect', target: 'allySide' }],
  desc: 'Halves physical damage for 5 turns.', flavor: '', fx: { key: 'screen', color: '#9aa7b5', shape: 'aura', sfx: 'shield' } });
def({ id: 'light_wall', name: 'Light Wall', type: 'LIGHT', category: 'status', power: 0, accuracy: null, pp: 10, target: 'allySide',
  effects: [{ kind: 'screen', value: 'lightwall', target: 'allySide' }],
  desc: 'Halves special damage for 5 turns.', flavor: '', fx: { key: 'screen', color: '#ffe9a3', shape: 'aura', sfx: 'shield' } });
def({ id: 'mind_haze', name: 'Mind Haze', type: 'MIND', category: 'status', power: 0, accuracy: 100, pp: 15, target: 'foe',
  effects: [{ kind: 'volatile', value: 'confusion', target: 'foe' }],
  desc: 'Confuses the target.', flavor: '', fx: { key: 'confuse', color: '#e05c9e', shape: 'aura', sfx: 'confuse' } });
def({ id: 'toxic_brand', name: 'Toxic Brand', type: 'TOXIN', category: 'status', power: 0, accuracy: 90, pp: 10, target: 'foe',
  effects: [{ kind: 'status', value: 'tox', target: 'foe' }],
  desc: 'Badly poisons the target.', flavor: '', fx: { key: 'toxic', color: '#7b2fa8', shape: 'aura', sfx: 'sludge' } });
def({ id: 'sleep_mist', name: 'Sleep Mist', type: 'SPIRIT', category: 'status', power: 0, accuracy: 75, pp: 10, target: 'foe',
  effects: [{ kind: 'status', value: 'slp', target: 'foe' }],
  desc: 'Puts the target to sleep.', flavor: '', fx: { key: 'sleep', color: '#8fa3c9', shape: 'aura', sfx: 'sleep' } });

/* ---------------- last resort ---------------- */
def({ id: 'struggle', name: 'Struggle', type: '???', category: 'physical', power: 50, accuracy: null, pp: 1,
  contact: true, recoil: 0.25, flags: [],
  desc: 'Used when no other move can be. The user is hurt too.',
  flavor: 'Out of options, out of breath, still swinging.',
  fx: { key: 'struggle', color: '#cfd6e8', shape: 'melee', scale: 0.9, hitstop: 90, shake: 0.5, sfx: 'impact_med' } });

/* ------------------------------------------------------------------ */

export const MOVES = M;
export const MOVE_BY_ID = Object.fromEntries(M.map((m) => [m.id, m]));
export function getMove(id) { return MOVE_BY_ID[id]; }
export function allMoves() { return M; }
export function movesOfType(t) { return M.filter((m) => m.type === t); }
