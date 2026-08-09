// Signature moves — owned by the ROSTER agent, merged into the move registry.
// Kept in its own file so roster work and general move design never collide.
// Same MoveDef shape as data/moves.js (docs/ARCHITECTURE.md 2.2).
//
// House rules for this file:
//  * Every move here is learned by exactly one fighter (or one awakening line).
//  * A signature earns its slot with a MECHANIC, not a bigger number: a stat
//    trade, a field interaction, an unusual priority, a guaranteed rider.
//  * Engine note — a damaging move WITHOUT the 'protect' flag is not blocked by
//    Protect. Three moves in here deliberately omit it. That is the whole point
//    of those three.

export const SIGNATURE_MOVES = [

  /* ================= ONE PIECE ================= */

  { id: 'kong_gun', name: 'Gum-Gum Kong Gun', type: 'FIST', category: 'physical',
    power: 120, accuracy: 100, pp: 5, contact: true, flags: ['punch', 'protect'],
    effects: [{ kind: 'boost', stats: { spe: -1 }, target: 'self' }],
    desc: 'A compressed Gear Third haymaker. Lowers the user\'s Speed.',
    flavor: 'He inflates the bone, then apologises to it later.',
    fx: { key: 'giant_fist', color: '#e8743b', shape: 'melee', scale: 2.0, hitstop: 200, shake: 1.5, sfx: 'impact_world' } },

  { id: 'bajrang_gun', name: 'Bajrang Gun', type: 'FIST', category: 'physical',
    power: 150, accuracy: 90, pp: 5, contact: true, recoil: 0.33, flags: ['punch'],
    desc: 'An island-sized fist. Cannot be blocked. 33% recoil.',
    flavor: 'The punchline of a joke the world has been telling for eight hundred years.',
    fx: { key: 'sun_fist', color: '#fff0c0', shape: 'melee', scale: 2.6, hitstop: 280, shake: 2.0, sfx: 'impact_world' } },

  { id: 'liberation_bell', name: 'Liberation Bell', type: 'SOUND', category: 'physical',
    power: 95, accuracy: 100, pp: 10, contact: true, flags: ['sound', 'protect'],
    effects: [{ kind: 'volatile', value: 'flinch', chance: 30, target: 'foe' }],
    desc: 'A struck note that lands like a bell. 30% flinch.',
    flavor: 'The drums start. Nobody agreed to this rhythm and everybody is in it.',
    fx: { key: 'bell_ring', color: '#ffe9a3', shape: 'burst', scale: 1.4, hitstop: 120, shake: 0.9, sfx: 'sonic' } },

  { id: 'drums_of_liberation', name: 'Drums of Liberation', type: 'SOUND', category: 'status',
    power: 0, accuracy: null, pp: 5, target: 'self', flags: ['sound', 'dance'],
    effects: [{ kind: 'cure', target: 'self' }, { kind: 'boost', stats: { atk: 1, spe: 1 }, target: 'self' }],
    desc: 'Cures the user\'s status and raises Attack and Speed.',
    flavor: 'Warrior of liberation. The floor takes the beat first.',
    fx: { key: 'drum_aura', color: '#f7f2e8', shape: 'aura', scale: 1.6, sfx: 'buff' } },

  { id: 'enma_draw', name: 'Enma Draw', type: 'SLASH', category: 'physical',
    power: 115, accuracy: 100, pp: 5, contact: true, critStage: 1, flags: ['slice', 'protect'],
    effects: [{ kind: 'boost', stats: { atk: 1, def: -1 }, target: 'self' }],
    desc: 'Enma pulls more haki than intended. Raises Attack, lowers Defense.',
    flavor: 'The blade decides how much of you it wants. You find out afterwards.',
    fx: { key: 'enma_cut', color: '#1b1b22', shape: 'arc', scale: 1.6, hitstop: 170, shake: 1.2, sfx: 'slash_heavy' } },

  { id: 'asura_bakkei', name: 'Asura: Bakkei', type: 'SLASH', category: 'physical',
    power: 45, accuracy: 100, pp: 5, contact: true, critStage: 1, hits: [3, 3], flags: ['slice', 'protect'],
    desc: 'Nine blades in three passes. Always hits three times. High crit ratio.',
    flavor: 'Something with too many arms borrowed his body for four seconds.',
    fx: { key: 'asura_slash', color: '#8a5ad0', shape: 'arc', scale: 1.8, hitstop: 90, shake: 1.0, sfx: 'slash_heavy' } },

  { id: 'ifrit_jambe', name: 'Ifrit Jambe', type: 'FLAME', category: 'physical',
    power: 120, accuracy: 95, pp: 5, contact: true, recoil: 0.25, flags: ['protect'],
    effects: [{ kind: 'status', value: 'brn', chance: 30, target: 'foe' }],
    desc: 'A blue-white kick that cooks the user too. 25% recoil, 30% burn.',
    flavor: 'The leg is past red now. He is not going to talk about it.',
    fx: { key: 'blue_kick', color: '#3a6cff', shape: 'melee', scale: 1.8, hitstop: 190, shake: 1.3, sfx: 'impact_fire' } },

  { id: 'concasse', name: 'Concassé', type: 'FIST', category: 'physical',
    power: 100, accuracy: 95, pp: 10, contact: true, flags: ['protect'],
    effects: [{ kind: 'volatile', value: 'flinch', chance: 20, target: 'foe' }],
    desc: 'A vertical heel dropped from altitude. 20% flinch.',
    flavor: 'He goes up. That is generally the last good news of the exchange.',
    fx: { key: 'heel_drop', color: '#f2f2f2', shape: 'melee', scale: 1.5, hitstop: 160, shake: 1.1, sfx: 'impact_heavy' } },

  { id: 'monster_slam', name: 'Monster Slam', type: 'FIST', category: 'physical',
    power: 110, accuracy: 90, pp: 10, contact: true, flags: ['punch', 'protect'],
    effects: [{ kind: 'volatile', value: 'flinch', chance: 30, target: 'foe' }],
    desc: 'A two-armed downward blow from something enormous. 30% flinch.',
    flavor: 'No technique whatsoever. Four hundred kilos of very sincere reindeer.',
    fx: { key: 'big_slam', color: '#6b4a2f', shape: 'melee', scale: 2.1, hitstop: 210, shake: 1.6, sfx: 'impact_world' } },

  { id: 'zangetsu_arc', name: 'Zangetsu Arc', type: 'SLASH', category: 'physical',
    power: 95, accuracy: 100, pp: 15, contact: true, critStage: 1, flags: ['slice', 'protect'],
    desc: 'A door-sized cleaver swung by someone with no formal training. High crit ratio.',
    flavor: 'It has no guard, no edge on one side and no business working.',
    fx: { key: 'cleaver', color: '#3a3a5a', shape: 'arc', scale: 1.7, hitstop: 150, shake: 1.1, sfx: 'slash_heavy' } },

  { id: 'meteor_combination', name: 'Meteor Combination', type: 'FIST', category: 'physical',
    power: 25, accuracy: 95, pp: 15, contact: true, hits: [2, 5], flags: ['punch', 'protect'],
    desc: 'A rush of 2–5 strikes that ends somewhere above the arena.',
    flavor: 'He is enjoying this more than the situation warrants.',
    fx: { key: 'rush_combo', color: '#f07820', shape: 'melee', scale: 1.1, hitstop: 45, shake: 0.35, sfx: 'impact_light' } },

  { id: 'constant_flux', name: 'Constant Flux', type: 'SEA', category: 'physical',
    power: 100, accuracy: 100, pp: 10, contact: true, critStage: 1, flags: ['slice', 'protect'],
    desc: 'Tenth Form. The longer the turn continues the harder it cuts. High crit ratio.',
    flavor: 'Water does not stop to argue about which shape it should be.',
    fx: { key: 'water_spiral', color: '#2a7fd4', shape: 'arc', scale: 1.7, hitstop: 150, shake: 1.0, sfx: 'water_hit' } },

  { id: 'thunder_lance_tempo', name: 'Thunder Lance Tempo', type: 'STORM', category: 'special',
    power: 75, accuracy: 100, pp: 10,
    effects: [{ kind: 'boost', stats: { spa: 1 }, chance: 70, target: 'self' }],
    desc: 'A drawn spear of charge. 70% chance to raise the user\'s Sp. Atk.',
    flavor: 'Each one teaches her where the next one should go.',
    fx: { key: 'lightning_lance', color: '#f5c542', shape: 'beam', scale: 1.2, hitstop: 100, shake: 0.7, sfx: 'thunder' } },

  { id: 'sogeking_shot', name: 'Sogeking Shot', type: 'WIND', category: 'special',
    power: 60, accuracy: null, pp: 15, critStage: 2, flags: ['bullet'],
    desc: 'Never misses. Very high critical-hit ratio.',
    flavor: 'Fired from a kingdom that does not appear on any chart.',
    fx: { key: 'sniper_shot', color: '#d8e8a0', shape: 'beam', scale: 0.8, hitstop: 90, shake: 0.4, sfx: 'cannon' } },

  { id: 'pop_green_barbs', name: 'Pop Green: Devil Barbs', type: 'TOXIN', category: 'status',
    power: 0, accuracy: null, pp: 20, target: 'foeSide',
    effects: [{ kind: 'hazard', value: 'barbs', target: 'foeSide' }],
    desc: 'Seeds toxic barbs across the foe\'s side.',
    flavor: 'They grow while you are busy. That is the entire design brief.',
    fx: { key: 'seed_scatter', color: '#8bc34a', shape: 'burst', scale: 1.1, sfx: 'scatter' } },

  { id: 'rumble_ball', name: 'Rumble Ball', type: 'BEAST', category: 'status',
    power: 0, accuracy: null, pp: 5, target: 'self',
    effects: [{ kind: 'boost', stats: { atk: 1, spa: 1, spe: 2, def: -1, spd: -1 }, target: 'self' }],
    desc: 'Raises Attack, Sp. Atk and Speed sharply; lowers both defenses.',
    flavor: 'Three minutes of being seven animals. Dosage is a strong word for it.',
    fx: { key: 'transform_pulse', color: '#e08aa0', shape: 'aura', scale: 1.4, sfx: 'buff' } },

  { id: 'monster_point', name: 'Monster Point', type: 'BEAST', category: 'status',
    power: 0, accuracy: null, pp: 5, target: 'self',
    effects: [{ kind: 'boost', stats: { atk: 2, def: 1, spe: -1 }, target: 'self' }],
    desc: 'Sharply raises Attack and raises Defense, at the cost of Speed.',
    flavor: 'The doctor leaves the building. Something much larger signs for the delivery.',
    fx: { key: 'monster_grow', color: '#6b4a2f', shape: 'aura', scale: 2.2, sfx: 'roar' } },

  { id: 'kokutei_cross', name: 'Kokutei Cross', type: 'BEAST', category: 'physical',
    power: 100, accuracy: 95, pp: 10, contact: true, flags: ['protect'],
    effects: [{ kind: 'volatile', value: 'flinch', chance: 20, target: 'foe' }],
    desc: 'A crossing double-hoof strike. 20% flinch.',
    flavor: 'Two hooves, one X, and a very apologetic look afterwards.',
    fx: { key: 'hoof_cross', color: '#c85a5a', shape: 'arc', scale: 1.5, hitstop: 150, shake: 1.0, sfx: 'impact_heavy' } },

  { id: 'mil_fleur_gigantesco', name: 'Mil Fleur: Gigantesco Mano', type: 'MIND', category: 'physical',
    power: 110, accuracy: 90, pp: 5, contact: true, flags: ['protect'],
    effects: [{ kind: 'boost', stats: { def: -1, spd: -1 }, chance: 100, target: 'foe' }],
    desc: 'A giant clasped fist. Always lowers the target\'s Defense and Sp. Def.',
    flavor: 'A thousand hands agree on one shape and use it once.',
    fx: { key: 'giant_hands', color: '#a24fd0', shape: 'melee', scale: 2.2, hitstop: 200, shake: 1.5, sfx: 'impact_world' } },

  { id: 'radical_beam', name: 'Radical Beam', type: 'MECHA', category: 'special',
    power: 115, accuracy: 90, pp: 5, flags: ['pulse'],
    effects: [{ kind: 'boost', stats: { spa: -2 }, target: 'self' }],
    desc: 'Fires the reserve tank. Harshly lowers the user\'s Sp. Atk.',
    flavor: 'That was the cola for the whole week.',
    fx: { key: 'chest_beam', color: '#2ad0e0', shape: 'beam', scale: 2.0, hitstop: 170, shake: 1.3, sfx: 'cannon' } },

  { id: 'strong_hammer', name: 'Strong Hammer', type: 'MECHA', category: 'physical',
    power: 95, accuracy: 100, pp: 15, contact: true, flags: ['punch', 'protect'],
    effects: [{ kind: 'boost', stats: { def: -1 }, chance: 30, target: 'foe' }],
    desc: 'A piston-driven right hand. 30% chance to lower Defense.',
    flavor: 'The arm is not the one he was born with, and it hits harder for it.',
    fx: { key: 'piston_punch', color: '#9aa7b5', shape: 'melee', scale: 1.4, hitstop: 150, shake: 1.0, sfx: 'impact_heavy' } },

  { id: 'general_franky_shield', name: 'General Shield', type: 'MECHA', category: 'status',
    power: 0, accuracy: null, pp: 5, target: 'allySide',
    effects: [{ kind: 'screen', value: 'veil', target: 'allySide' }],
    desc: 'Raises an Aurora Veil: halves physical and special damage for 5 turns.',
    flavor: 'Two hundred tonnes of hand-built nonsense, standing between you and it.',
    fx: { key: 'mecha_screen', color: '#7fd8ff', shape: 'aura', scale: 1.8, sfx: 'shield' } },

  { id: 'nemuriuta_flanc', name: 'Nemuriuta: Flanc', type: 'SOUND', category: 'status',
    power: 0, accuracy: 90, pp: 10, target: 'foe', flags: ['sound', 'protect'],
    effects: [{ kind: 'status', value: 'slp', target: 'foe' }],
    desc: 'A lullaby with unusually good accuracy. Puts the target to sleep.',
    flavor: 'He has no lungs, which turns out not to matter.',
    fx: { key: 'lullaby', color: '#8fa3c9', shape: 'aura', scale: 1.5, sfx: 'sleep' } },

  { id: 'soul_parade', name: 'Soul Parade', type: 'SPIRIT', category: 'status',
    power: 0, accuracy: 100, pp: 10, target: 'foe',
    effects: [{ kind: 'custom', value: 'painsplit' }],
    desc: 'Averages the HP of user and target.',
    flavor: 'He shares. It is very rude of him.',
    fx: { key: 'soul_link', color: '#6fe3d0', shape: 'beam', scale: 1.2, sfx: 'soul' } },

  { id: 'karakusagawara_seiken', name: 'Karakusagawara Seiken', type: 'SEA', category: 'physical',
    power: 140, accuracy: null, pp: 5, priority: -3, contact: true, flags: ['punch', 'protect'],
    desc: 'Never misses, but always strikes last.',
    flavor: 'He lets you finish. Then he hits the water inside you.',
    fx: { key: 'water_shock_big', color: '#2a5f8f', shape: 'melee', scale: 2.0, hitstop: 220, shake: 1.6, sfx: 'water_hit' } },

  { id: 'entei', name: 'Entei', type: 'FLAME', category: 'special',
    power: 130, accuracy: 90, pp: 5,
    effects: [{ kind: 'status', value: 'brn', chance: 30, target: 'foe' }, { kind: 'clearHazards' }],
    desc: 'A rolling wall of flame. 30% burn, and it burns away hazards on the user\'s side.',
    flavor: 'Everything between here and there stops being a problem, including the floor.',
    fx: { key: 'flame_wall', color: '#ff5a1c', shape: 'burst', scale: 2.2, hitstop: 190, shake: 1.5, sfx: 'fire_big' } },

  { id: 'counter_shock', name: 'Counter Shock', type: 'MIND', category: 'special',
    power: 95, accuracy: 100, pp: 10,
    effects: [{ kind: 'status', value: 'par', chance: 100, target: 'foe' }],
    desc: 'Always paralyses the target.',
    flavor: 'Clear. Two hundred joules through a heart he does not own.',
    fx: { key: 'defib', color: '#ff5c8a', shape: 'burst', scale: 1.3, hitstop: 140, shake: 1.0, sfx: 'thunder' } },

  { id: 'takt', name: 'Takt', type: 'MIND', category: 'status',
    power: 0, accuracy: null, pp: 5, target: 'field',
    effects: [{ kind: 'trickRoom' }],
    desc: 'Twists the Room for 5 turns: slower fighters move first.',
    flavor: 'Up, down and next are all just coordinates to him.',
    fx: { key: 'room_twist', color: '#7fd8ff', shape: 'aura', scale: 2.4, sfx: 'warp' } },

  { id: 'world_slash', name: 'Yoru: World Divider', type: 'SLASH', category: 'physical',
    power: 145, accuracy: 90, pp: 5, contact: true, critStage: 1, flags: ['slice', 'protect'],
    desc: 'A single stroke across the horizon. High critical-hit ratio.',
    flavor: 'He does not aim at you. He aims past you, and you are in the way.',
    fx: { key: 'world_cut', color: '#1a1a22', shape: 'arc', scale: 2.6, hitstop: 240, shake: 1.9, sfx: 'slash_world' } },

  { id: 'unsheathe', name: 'Unsheathe', type: 'SLASH', category: 'status',
    power: 0, accuracy: null, pp: 10, target: 'self',
    effects: [{ kind: 'volatile', value: 'focusenergy', target: 'self' }, { kind: 'boost', stats: { atk: 1 }, target: 'self' }],
    desc: 'Raises Attack and makes critical hits far more likely.',
    flavor: 'The cross comes off the back. There is no third step.',
    fx: { key: 'draw_blade', color: '#c8a24b', shape: 'aura', scale: 1.3, sfx: 'clang' } },

  { id: 'ground_death', name: 'Ground Death', type: 'EARTH', category: 'special',
    power: 100, accuracy: 90, pp: 10, drain: 0.5,
    desc: 'Pulls the water out of the target. Heals the user for half the damage dealt.',
    flavor: 'A handshake, and then a very dry afternoon.',
    fx: { key: 'desiccate', color: '#c8a165', shape: 'beam', scale: 1.5, hitstop: 150, shake: 0.9, sfx: 'sand' } },

  { id: 'zangiri_mochi', name: 'Zangiri Mochi', type: 'MIND', category: 'physical',
    power: 100, accuracy: 100, pp: 10, priority: 1, contact: true, flags: ['protect'],
    desc: 'Always goes first. He saw it coming.',
    flavor: 'He answered the punch four seconds ago and has been waiting politely since.',
    fx: { key: 'mochi_spike', color: '#c04a6a', shape: 'melee', scale: 1.5, hitstop: 130, shake: 0.9, sfx: 'impact_med' } },

  { id: 'raimei_hakke', name: 'Raimei Hakke', type: 'BEAST', category: 'physical',
    power: 120, accuracy: 100, pp: 5, contact: true, flags: ['protect'],
    effects: [{ kind: 'custom', value: 'clearboosts' }],
    desc: 'A thunder-clad club blow that knocks every stat change off the target.',
    flavor: 'Eight trigrams, one kanabo, and no interest in whatever you had set up.',
    fx: { key: 'club_thunder', color: '#5a7fd0', shape: 'melee', scale: 2.3, hitstop: 230, shake: 1.8, sfx: 'impact_world' } },

  { id: 'kamusari', name: 'Kamusari', type: 'HAKI', category: 'physical',
    power: 125, accuracy: 100, pp: 5, contact: true, critStage: 1, flags: ['slice', 'protect'],
    effects: [{ kind: 'boost', stats: { atk: -1 }, chance: 100, target: 'foe' }],
    desc: 'A god-severing cut. Always lowers the target\'s Attack.',
    flavor: 'One arm, one sword, and an argument that finished before it started.',
    fx: { key: 'black_lightning', color: '#7a4fd0', shape: 'arc', scale: 2.0, hitstop: 210, shake: 1.6, sfx: 'conqueror' } },

  { id: 'quake_bubble', name: 'Gura Gura: Quake Bubble', type: 'EARTH', category: 'physical',
    power: 130, accuracy: 90, pp: 5, flags: [],
    desc: 'Cracks the air itself. Cannot be blocked.',
    flavor: 'He punches nothing in particular and the seafloor files a complaint.',
    fx: { key: 'air_crack', color: '#8fd0e0', shape: 'burst', scale: 2.8, hitstop: 250, shake: 2.0, sfx: 'impact_world' } },

  { id: 'shima_yurashi', name: 'Shima Yurashi', type: 'EARTH', category: 'status',
    power: 0, accuracy: 90, pp: 5, target: 'foe',
    effects: [{ kind: 'custom', value: 'halfhp' }],
    desc: 'Tilts the island. Halves the target\'s current HP.',
    flavor: 'He takes hold of the ground under the fight and turns it over.',
    fx: { key: 'island_tilt', color: '#b98b5a', shape: 'burst', scale: 2.4, hitstop: 200, shake: 1.9, sfx: 'sand' } },

  { id: 'ice_time', name: 'Ice Time', type: 'FROST', category: 'special',
    power: 95, accuracy: 90, pp: 10,
    effects: [{ kind: 'status', value: 'frz', chance: 25, target: 'foe' }, { kind: 'weather', value: 'hail' }],
    desc: 'Freezes on contact and drops the temperature of the whole arena. 25% freeze.',
    flavor: 'He is not in a hurry. The weather is doing most of it.',
    fx: { key: 'ice_pillar', color: '#8fd8f0', shape: 'burst', scale: 1.9, hitstop: 160, shake: 1.1, sfx: 'ice' } },

  /* ================= NARUTO ================= */

  { id: 'rasenshuriken', name: 'Rasenshuriken', type: 'WIND', category: 'special',
    power: 130, accuracy: 90, pp: 5, recoil: 0.25, flags: ['wind'],
    desc: 'A thousand microscopic blades. 25% recoil.',
    flavor: 'It cuts the target at cellular scale and charges him the same fee.',
    fx: { key: 'wind_shuriken', color: '#a7e8c0', shape: 'beam', scale: 2.1, hitstop: 200, shake: 1.5, sfx: 'slash_air' } },

  { id: 'rasengan', name: 'Rasengan', type: 'SPIRIT', category: 'physical',
    power: 95, accuracy: 100, pp: 10, contact: true, flags: ['protect'],
    effects: [{ kind: 'boost', stats: { def: -1 }, chance: 30, target: 'foe' }],
    desc: 'A grinding sphere held in one palm. 30% chance to lower Defense.',
    flavor: 'Shape, rotation, power. He got the third one first and worked backwards.',
    fx: { key: 'spiral_sphere', color: '#6fb8ff', shape: 'melee', scale: 1.5, hitstop: 160, shake: 1.1, sfx: 'impact_heavy' } },

  { id: 'shadow_clone', name: 'Shadow Clone', type: 'SPIRIT', category: 'status',
    power: 0, accuracy: null, pp: 10, target: 'self',
    effects: [{ kind: 'volatile', value: 'substitute', target: 'self' }],
    desc: 'Spends a quarter of max HP to put a clone in the way.',
    flavor: 'There is no correct number of him. There is only the current number.',
    fx: { key: 'clone_poof', color: '#f2f2f2', shape: 'aura', scale: 1.5, sfx: 'warp' } },

  { id: 'tailed_beast_bomb', name: 'Tailed Beast Bomb', type: 'BEAST', category: 'special',
    power: 140, accuracy: 90, pp: 5, flags: ['pulse'],
    effects: [{ kind: 'boost', stats: { spa: -1 }, target: 'self' }],
    desc: 'A compressed sphere of chakra. Lowers the user\'s Sp. Atk.',
    flavor: 'Positive and negative, packed until the ratio stops being funny.',
    fx: { key: 'bijuu_bomb', color: '#2a2a38', shape: 'beam', scale: 2.6, hitstop: 250, shake: 2.0, sfx: 'dragon' } },

  { id: 'kurama_cloak', name: 'Kurama Cloak', type: 'SPIRIT', category: 'status',
    power: 0, accuracy: null, pp: 5, target: 'self',
    effects: [{ kind: 'cure', target: 'self' }, { kind: 'boost', stats: { spe: 2 }, target: 'self' }],
    desc: 'Burns off status and sharply raises Speed.',
    flavor: 'Two tempers, one coat, finally pointed the same direction.',
    fx: { key: 'chakra_flare', color: '#f5b942', shape: 'aura', scale: 2.0, sfx: 'roar' } },

  { id: 'amaterasu', name: 'Amaterasu', type: 'SHADOW', category: 'special',
    power: 100, accuracy: 100, pp: 5,
    effects: [{ kind: 'status', value: 'brn', chance: 100, target: 'foe' }],
    desc: 'Black flame that does not go out. Always burns.',
    flavor: 'It burns for seven days, or until he can be bothered to stop it.',
    fx: { key: 'black_flame', color: '#2a1030', shape: 'burst', scale: 1.7, hitstop: 170, shake: 1.1, sfx: 'fire_big' } },

  { id: 'chidori', name: 'Chidori', type: 'STORM', category: 'physical',
    power: 90, accuracy: 100, pp: 10, contact: true, critStage: 2, flags: ['punch', 'protect'],
    desc: 'A thousand birds in one hand. Very high critical-hit ratio.',
    flavor: 'You hear it long before it reaches you, which does not help.',
    fx: { key: 'chidori_bolt', color: '#9fd8ff', shape: 'melee', scale: 1.5, hitstop: 150, shake: 1.1, sfx: 'thunder' } },

  /* ================= BLEACH ================= */

  { id: 'getsuga_tensho', name: 'Getsuga Tenshō', type: 'SLASH', category: 'special',
    power: 100, accuracy: 100, pp: 10, flags: ['slice'],
    desc: 'A crescent of released pressure. Cannot be blocked.',
    flavor: 'The moon-fang goes where the sword pointed, whether or not he meant it.',
    fx: { key: 'moon_fang', color: '#3a3a5a', shape: 'arc', scale: 2.0, hitstop: 170, shake: 1.2, sfx: 'slash_heavy' } },

  { id: 'final_getsuga', name: 'Final Getsuga Tenshō', type: 'SLASH', category: 'physical',
    power: 150, accuracy: 100, pp: 5, contact: true, flags: ['slice', 'protect'],
    effects: [{ kind: 'boost', stats: { atk: -2, spa: -2, spe: -2 }, target: 'self' }],
    desc: 'Becomes the attack itself. Harshly lowers the user\'s Attack, Sp. Atk and Speed.',
    flavor: 'He trades everything he has for one swing, and the swing is worth it exactly once.',
    fx: { key: 'final_cut', color: '#0e0e14', shape: 'arc', scale: 2.8, hitstop: 280, shake: 2.0, sfx: 'slash_world' } },

  { id: 'gran_rey_cero', name: 'Gran Rey Cero', type: 'SHADOW', category: 'special',
    power: 120, accuracy: 90, pp: 5, flags: ['pulse'],
    desc: 'A cero soured with the user\'s own blood.',
    flavor: 'The mask fires it. He is only holding the arm.',
    fx: { key: 'cero', color: '#c02a4a', shape: 'beam', scale: 2.2, hitstop: 200, shake: 1.5, sfx: 'light' } },

  /* ================= DRAGON BALL ================= */

  { id: 'kamehameha', name: 'Kamehameha', type: 'SPIRIT', category: 'special',
    power: 110, accuracy: 100, pp: 10, flags: ['pulse'],
    desc: 'The turtle-school beam. Reliable, enormous, always the same six syllables.',
    flavor: 'Fifty years of other people copying it and it still lands.',
    fx: { key: 'blue_beam', color: '#6fd8ff', shape: 'beam', scale: 2.2, hitstop: 180, shake: 1.4, sfx: 'light' } },

  { id: 'kaioken', name: 'Kaiō-ken', type: 'FIST', category: 'status',
    power: 0, accuracy: null, pp: 10, target: 'self',
    effects: [{ kind: 'boost', stats: { atk: 1, spe: 1, def: -1, spd: -1 }, target: 'self' }],
    desc: 'Multiplies output past the safe limit. Raises Attack and Speed, lowers both defenses.',
    flavor: 'A technique whose main instruction is "do not".',
    fx: { key: 'red_aura', color: '#ff3b2f', shape: 'aura', scale: 1.8, sfx: 'buff' } },

  { id: 'dragon_fist', name: 'Dragon Fist', type: 'FIST', category: 'physical',
    power: 140, accuracy: 90, pp: 5, contact: true, flags: ['punch', 'protect'],
    effects: [{ kind: 'volatile', value: 'flinch', chance: 20, target: 'foe' }],
    desc: 'Goes in as a fist and comes out the other side as a dragon. 20% flinch.',
    flavor: 'Nobody has ever asked him where the dragon comes from.',
    fx: { key: 'gold_dragon', color: '#ffd84a', shape: 'beam', scale: 2.5, hitstop: 240, shake: 1.8, sfx: 'dragon' } },

  { id: 'super_kamehameha', name: 'Super Kamehameha', type: 'LIGHT', category: 'special',
    power: 115, accuracy: 100, pp: 5, flags: ['pulse'],
    desc: 'The same beam with the safety removed.',
    flavor: 'Same six syllables. Considerably more of them.',
    fx: { key: 'gold_beam', color: '#fff0a0', shape: 'beam', scale: 2.4, hitstop: 200, shake: 1.5, sfx: 'light' } },

  { id: 'instant_transmission', name: 'Instant Transmission', type: 'LIGHT', category: 'status',
    power: 0, accuracy: null, pp: 10, target: 'self',
    effects: [{ kind: 'boost', stats: { spe: 1 }, target: 'self' }, { kind: 'volatile', value: 'locked_on', target: 'self' }],
    desc: 'Raises Speed, and the user\'s attacks no longer miss.',
    flavor: 'He finds your ki, and then he is simply standing in it.',
    fx: { key: 'blink', color: '#ffffff', shape: 'aura', scale: 1.2, sfx: 'warp' } },

  /* ================= DEMON SLAYER ================= */

  { id: 'water_wheel', name: 'Water Wheel', type: 'SEA', category: 'physical',
    power: 80, accuracy: 100, pp: 10, priority: 1, contact: true, flags: ['slice', 'protect'],
    desc: 'A forward somersaulting cut. Always goes first.',
    flavor: 'Second form. He is airborne before the decision finishes.',
    fx: { key: 'water_wheel', color: '#2a7fd4', shape: 'arc', scale: 1.4, hitstop: 110, shake: 0.7, sfx: 'water_hit' } },

  { id: 'hinokami_kagura', name: 'Hinokami Kagura', type: 'FLAME', category: 'physical',
    power: 110, accuracy: 100, pp: 5, contact: true, flags: ['slice', 'protect', 'dance'],
    effects: [{ kind: 'weather', value: 'sun' }],
    desc: 'A dance older than the technique it replaced. Brings out Blazing Sun.',
    flavor: 'His father did this all night in the snow and called it keeping warm.',
    fx: { key: 'sun_dance', color: '#ff7a2a', shape: 'arc', scale: 2.0, hitstop: 180, shake: 1.3, sfx: 'impact_fire' } },

  /* ================= JUJUTSU KAISEN ================= */

  { id: 'hollow_purple', name: 'Hollow Technique: Purple', type: 'VOID', category: 'special',
    power: 130, accuracy: 95, pp: 5, flags: ['pulse'],
    effects: [{ kind: 'boost', stats: { spa: -1 }, target: 'self' }],
    desc: 'Attraction and repulsion collided. Lowers the user\'s Sp. Atk.',
    flavor: 'Two impossible things multiplied. Whatever was in the corridor is not.',
    fx: { key: 'purple_orb', color: '#7a3fd0', shape: 'beam', scale: 2.6, hitstop: 250, shake: 1.9, sfx: 'impact_world' } },

  { id: 'cursed_technique_red', name: 'Reversal: Red', type: 'LIGHT', category: 'special',
    power: 100, accuracy: 100, pp: 10, flags: ['pulse'],
    desc: 'Inverted cursed energy, thrown outward.',
    flavor: 'He explains the theory while it is travelling. It does not slow down.',
    fx: { key: 'red_orb', color: '#ff3a5a', shape: 'beam', scale: 1.7, hitstop: 160, shake: 1.1, sfx: 'light' } },

  { id: 'limitless_blue', name: 'Limitless: Blue', type: 'VOID', category: 'special',
    power: 85, accuracy: 100, pp: 10, flags: ['pulse'],
    effects: [{ kind: 'boost', stats: { spe: -1 }, chance: 100, target: 'foe' }],
    desc: 'Collapses the space around the target. Always lowers Speed.',
    flavor: 'The distance between you and him becomes a number he chooses.',
    fx: { key: 'blue_orb', color: '#3a6cff', shape: 'burst', scale: 1.6, hitstop: 130, shake: 0.9, sfx: 'warp' } },

  { id: 'malevolent_shrine', name: 'Malevolent Shrine', type: 'SHADOW', category: 'special',
    power: 115, accuracy: null, pp: 5,
    desc: 'A domain with no barrier. Never misses.',
    flavor: 'Everything inside the shrine has already been cut. It just has not fallen yet.',
    fx: { key: 'shrine', color: '#5a1a2a', shape: 'burst', scale: 2.6, hitstop: 240, shake: 1.9, sfx: 'slash_world' } },

  { id: 'dismantle', name: 'Dismantle', type: 'SHADOW', category: 'physical',
    power: 90, accuracy: 100, pp: 10, contact: true, critStage: 2, flags: ['slice', 'protect'],
    desc: 'A lattice of cuts at whatever depth he chose. Very high crit ratio.',
    flavor: 'He adjusts the spacing for the material. You are a material.',
    fx: { key: 'cross_cut', color: '#8a2a3a', shape: 'arc', scale: 1.6, hitstop: 150, shake: 1.0, sfx: 'slash_heavy' } },

  { id: 'flame_arrow', name: 'Flame Arrow', type: 'FLAME', category: 'special',
    power: 100, accuracy: 95, pp: 10,
    effects: [{ kind: 'status', value: 'brn', chance: 30, target: 'foe' }],
    desc: 'An open furnace pointed one way. 30% burn.',
    flavor: 'The oldest technique he still bothers with.',
    fx: { key: 'fire_arrow', color: '#ff7a2a', shape: 'beam', scale: 1.8, hitstop: 150, shake: 1.1, sfx: 'fire_big' } },

  /* ================= ATTACK ON TITAN ================= */

  { id: 'thunder_spear', name: 'Thunder Spear', type: 'MECHA', category: 'physical',
    power: 100, accuracy: 90, pp: 10, flags: ['bullet', 'protect'],
    effects: [{ kind: 'boost', stats: { def: -1 }, chance: 50, target: 'foe' }],
    desc: 'A lance that detonates once it is inside. 50% chance to lower Defense.',
    flavor: 'Fired from a wire, at speed, by someone who cannot afford a second one.',
    fx: { key: 'spear_blast', color: '#b8b0a0', shape: 'beam', scale: 1.6, hitstop: 170, shake: 1.3, sfx: 'cannon' } },

  { id: 'vertical_dive', name: 'Vertical Dive', type: 'SLASH', category: 'physical',
    power: 85, accuracy: 100, pp: 15, contact: true, critStage: 1, flags: ['slice', 'protect'],
    desc: 'A gravity-assisted pass at the nape. High critical-hit ratio.',
    flavor: 'Gas, wire, and roughly nine metres of unearned confidence.',
    fx: { key: 'dive_slash', color: '#4a6b3a', shape: 'arc', scale: 1.3, hitstop: 120, shake: 0.8, sfx: 'slash_light' } },

  { id: 'hardening_strike', name: 'Hardening Strike', type: 'BEAST', category: 'physical',
    power: 105, accuracy: 100, pp: 10, contact: true, flags: ['punch', 'protect'],
    effects: [{ kind: 'boost', stats: { def: 1 }, chance: 100, target: 'self' }],
    desc: 'Crystallises the fist mid-swing. Always raises the user\'s Defense.',
    flavor: 'The same reflex that makes the arm a weapon makes it a wall.',
    fx: { key: 'crystal_fist', color: '#8a4a3a', shape: 'melee', scale: 1.8, hitstop: 180, shake: 1.3, sfx: 'impact_heavy' } },

  { id: 'crushing_stomp', name: 'Crushing Stomp', type: 'EARTH', category: 'physical',
    power: 100, accuracy: 95, pp: 10, contact: true, flags: ['protect'],
    effects: [{ kind: 'volatile', value: 'flinch', chance: 20, target: 'foe' }],
    desc: 'Fifteen metres of downward opinion. 20% flinch.',
    flavor: 'The street was there a second ago.',
    fx: { key: 'stomp', color: '#7a5a3a', shape: 'burst', scale: 2.0, hitstop: 200, shake: 1.6, sfx: 'impact_world' } },

  { id: 'blade_spiral', name: 'Blade Spiral', type: 'SLASH', category: 'physical',
    power: 70, accuracy: 100, pp: 10, priority: 2, contact: true, flags: ['slice', 'protect'],
    desc: 'Arrives two beats early, every time.',
    flavor: 'He is already behind you. He was behind you when you read this.',
    fx: { key: 'spin_slash', color: '#e8f0ff', shape: 'arc', scale: 1.5, hitstop: 100, shake: 0.7, sfx: 'slash_light' } },

  { id: 'odm_burst', name: 'ODM Burst', type: 'WIND', category: 'physical',
    power: 85, accuracy: 100, pp: 15, contact: true, flags: ['wind', 'protect'],
    effects: [{ kind: 'boost', stats: { spe: 1 }, chance: 30, target: 'self' }],
    desc: 'A full gas burn into the pass. 30% chance to raise the user\'s Speed.',
    flavor: 'He budgets the tank to the litre and spends it all anyway.',
    fx: { key: 'gas_burst', color: '#cfd6e8', shape: 'melee', scale: 1.3, hitstop: 100, shake: 0.7, sfx: 'slash_air' } },

  /* ================= MY HERO ACADEMIA ================= */

  { id: 'detroit_smash', name: 'Detroit Smash', type: 'FIST', category: 'physical',
    power: 110, accuracy: 100, pp: 10, contact: true, recoil: 0.33, flags: ['punch', 'protect'],
    effects: [{ kind: 'boost', stats: { spe: 1 }, chance: 100, target: 'self' }],
    desc: 'Costs him an arm and buys him a gear. 33% recoil, always raises Speed.',
    flavor: 'He has not yet found the percentage that does not break something.',
    fx: { key: 'green_smash', color: '#3aa06a', shape: 'melee', scale: 1.9, hitstop: 190, shake: 1.4, sfx: 'impact_heavy' } },

  { id: 'air_force_smash', name: 'Air Force Smash', type: 'WIND', category: 'special',
    power: 90, accuracy: 100, pp: 10, flags: ['wind', 'bullet'],
    desc: 'A flicked finger and the air does the rest.',
    flavor: 'Range, at last, from someone who spent a year learning it the hard way.',
    fx: { key: 'air_bullet', color: '#a7e8c0', shape: 'beam', scale: 1.2, hitstop: 110, shake: 0.7, sfx: 'slash_air' } },

  { id: 'united_states_of_smash', name: 'United States of Smash', type: 'FIST', category: 'physical',
    power: 160, accuracy: 90, pp: 5, contact: true, recoil: 0.33, flags: ['punch'],
    desc: 'The last of it, all at once. Cannot be blocked. 33% recoil.',
    flavor: 'He has about four seconds left and intends to spend all of them here.',
    fx: { key: 'symbol_smash', color: '#f2d24b', shape: 'melee', scale: 2.8, hitstop: 300, shake: 2.0, sfx: 'impact_world' } },

  { id: 'plus_ultra', name: 'Plus Ultra', type: 'HAKI', category: 'status',
    power: 0, accuracy: null, pp: 5, target: 'self',
    effects: [{ kind: 'boost', stats: { atk: 2, def: -1, spd: -1 }, target: 'self' }],
    desc: 'Sharply raises Attack at the cost of both defenses.',
    flavor: 'Two words and a grin that is doing a lot of structural work.',
    fx: { key: 'hero_flare', color: '#1a3fa0', shape: 'aura', scale: 1.9, sfx: 'buff' } },

  /* ================= ONE PUNCH MAN ================= */

  { id: 'normal_punch', name: 'Normal Punch', type: 'FIST', category: 'physical',
    power: 80, accuracy: 100, pp: 25, contact: true, flags: ['punch', 'protect'],
    desc: 'An ordinary punch, thrown ordinarily.',
    flavor: 'He is not trying. This is the problem with the whole sport.',
    fx: { key: 'plain_punch', color: '#f5d020', shape: 'melee', scale: 1.1, hitstop: 100, shake: 0.6, sfx: 'impact_med' } },

  { id: 'consecutive_normal_punches', name: 'Consecutive Normal Punches', type: 'FIST', category: 'physical',
    power: 25, accuracy: 100, pp: 15, contact: true, hits: [3, 5], flags: ['punch', 'protect'],
    desc: 'Hits 3–5 times. Each one is normal.',
    flavor: 'The technique name is the technique description. He named it himself.',
    fx: { key: 'punch_rain', color: '#f5d020', shape: 'melee', scale: 1.0, hitstop: 40, shake: 0.3, sfx: 'impact_light' } },

  { id: 'serious_punch', name: 'Serious Series: Serious Punch', type: 'FIST', category: 'physical',
    power: 150, accuracy: 100, pp: 5, contact: true, flags: ['punch'],
    effects: [{ kind: 'custom', value: 'clearboosts' }],
    desc: 'Cannot be blocked, and removes every stat change on the target.',
    flavor: 'Whatever you spent three turns building, he was not told about it.',
    fx: { key: 'serious', color: '#ffffff', shape: 'melee', scale: 3.0, hitstop: 320, shake: 2.0, sfx: 'impact_world' } },

  /* ================= HUNTER X HUNTER ================= */

  { id: 'jajanken_rock', name: 'Jajanken: Rock', type: 'EARTH', category: 'physical',
    power: 150, accuracy: 85, pp: 5, contact: true, flags: ['punch', 'protect', 'recharge'],
    desc: 'Everything he has, announced in advance. User must recharge.',
    flavor: 'He says the word first. It has never once helped the other person.',
    fx: { key: 'rock_fist', color: '#2f9e5a', shape: 'melee', scale: 2.4, hitstop: 260, shake: 1.9, sfx: 'impact_world' } },

  { id: 'jajanken_scissors', name: 'Jajanken: Scissors', type: 'SLASH', category: 'physical',
    power: 90, accuracy: 100, pp: 10, contact: true, critStage: 1, flags: ['slice', 'protect'],
    desc: 'Aura drawn out into a blade. High critical-hit ratio.',
    flavor: 'Two fingers and an entirely unreasonable amount of intent.',
    fx: { key: 'aura_blade', color: '#2f9e5a', shape: 'arc', scale: 1.4, hitstop: 130, shake: 0.9, sfx: 'slash_light' } },

  { id: 'jajanken_paper', name: 'Jajanken: Paper', type: 'LIGHT', category: 'special',
    power: 90, accuracy: 100, pp: 10, flags: ['pulse'],
    desc: 'The same aura, thrown instead of held.',
    flavor: 'The one he is worst at, which still goes through a wall.',
    fx: { key: 'aura_blast', color: '#a0f0c0', shape: 'beam', scale: 1.5, hitstop: 130, shake: 0.9, sfx: 'light' } },

  { id: 'godspeed', name: 'Godspeed', type: 'STORM', category: 'status',
    power: 0, accuracy: null, pp: 5, target: 'self',
    effects: [{ kind: 'cure', target: 'self' }, { kind: 'boost', stats: { spe: 2, atk: 1 }, target: 'self' }],
    desc: 'Cures status, sharply raises Speed and raises Attack.',
    flavor: 'The nervous system stops asking permission and starts issuing orders.',
    fx: { key: 'lightning_skin', color: '#eef2f5', shape: 'aura', scale: 1.7, sfx: 'thunder' } },

  { id: 'lightning_palm', name: 'Lightning Palm', type: 'STORM', category: 'physical',
    power: 90, accuracy: 100, pp: 10, contact: true, flags: ['punch', 'protect'],
    effects: [{ kind: 'status', value: 'par', chance: 30, target: 'foe' }],
    desc: 'An open hand carrying far too much current. 30% paralysis.',
    flavor: 'A childhood of electrocution, finally itemised.',
    fx: { key: 'palm_shock', color: '#a0e8ff', shape: 'melee', scale: 1.3, hitstop: 130, shake: 0.9, sfx: 'thunder' } },

  { id: 'yo_yo_crush', name: 'Yo-Yo Crush', type: 'SLASH', category: 'physical',
    power: 95, accuracy: 100, pp: 10, contact: true, critStage: 1, flags: ['protect'],
    desc: 'Fifty kilos on a string. High critical-hit ratio.',
    flavor: 'A children\'s toy, weighted like an anchor, swung like an argument.',
    fx: { key: 'yoyo', color: '#5a5fd0', shape: 'arc', scale: 1.4, hitstop: 140, shake: 1.0, sfx: 'impact_heavy' } },

  /* ================= FULLMETAL ALCHEMIST ================= */

  { id: 'alchemic_spear', name: 'Alchemic Spear', type: 'EARTH', category: 'physical',
    power: 95, accuracy: 100, pp: 10, contact: true, flags: ['protect'],
    effects: [{ kind: 'hazard', value: 'caltrops', target: 'foeSide' }],
    desc: 'Rips a spike out of the ground — and leaves the broken ground behind as hazards.',
    flavor: 'A clap, a hand on the floor, and the floor takes it personally.',
    fx: { key: 'stone_spike', color: '#b02a2a', shape: 'melee', scale: 1.6, hitstop: 160, shake: 1.2, sfx: 'sand' } },

  { id: 'automail_hook', name: 'Automail Hook', type: 'MECHA', category: 'physical',
    power: 85, accuracy: 100, pp: 15, contact: true, critStage: 1, flags: ['punch', 'protect'],
    desc: 'A steel arm that does not flinch. High critical-hit ratio.',
    flavor: 'It costs him a mechanic every time. She charges in apple pie.',
    fx: { key: 'steel_hook', color: '#c0c8d0', shape: 'melee', scale: 1.2, hitstop: 130, shake: 0.9, sfx: 'clang' } },

  /* ================= SAILOR MOON ================= */

  { id: 'moon_tiara_action', name: 'Moon Tiara Action', type: 'LIGHT', category: 'special',
    power: 90, accuracy: 100, pp: 10, critStage: 1, flags: ['bullet'],
    effects: [{ kind: 'boost', stats: { spd: -1 }, chance: 30, target: 'foe' }],
    desc: 'A thrown disc of moonlight that comes back on its own. High crit ratio.',
    flavor: 'She has never once had to go and fetch it.',
    fx: { key: 'tiara_disc', color: '#ffe9a3', shape: 'arc', scale: 1.4, hitstop: 120, shake: 0.7, sfx: 'chime' } },

  { id: 'moon_healing_escalation', name: 'Moon Healing Escalation', type: 'LIGHT', category: 'status',
    power: 0, accuracy: null, pp: 5, target: 'self',
    effects: [{ kind: 'cure', target: 'self' }, { kind: 'heal', frac: 0.5, target: 'self' }],
    desc: 'Restores half of max HP and clears any status condition.',
    flavor: 'Refunds the fight to before it went wrong, emotionally and medically.',
    fx: { key: 'moon_glow', color: '#ffd8ec', shape: 'aura', scale: 1.8, sfx: 'heal' } },

  { id: 'moon_princess_halation', name: 'Moon Princess Halation', type: 'MIND', category: 'special',
    power: 95, accuracy: 100, pp: 10,
    effects: [{ kind: 'boost', stats: { spa: -1 }, chance: 30, target: 'foe' }],
    desc: 'A ring of silver light. 30% chance to lower Sp. Atk.',
    flavor: 'The crystal is doing most of it. She is doing the crying.',
    fx: { key: 'halation', color: '#e8d8ff', shape: 'burst', scale: 1.7, hitstop: 140, shake: 0.9, sfx: 'chime' } },

  /* ================= YU YU HAKUSHO ================= */

  { id: 'spirit_gun', name: 'Spirit Gun', type: 'SPIRIT', category: 'special',
    power: 110, accuracy: 100, pp: 5, flags: ['bullet'],
    desc: 'One finger, one shot, and it does not care what you are hiding behind.',
    flavor: 'He points. That is the whole windup.',
    fx: { key: 'finger_shot', color: '#4ad0ff', shape: 'beam', scale: 1.9, hitstop: 180, shake: 1.3, sfx: 'light' } },

  { id: 'spirit_shotgun', name: 'Spirit Shotgun', type: 'SPIRIT', category: 'special',
    power: 25, accuracy: 90, pp: 10, hits: [2, 5], flags: ['bullet'],
    desc: 'Scatters the same energy across 2–5 hits.',
    flavor: 'Less elegant. Considerably harder to stand behind something for.',
    fx: { key: 'scatter_shot', color: '#6fe3d0', shape: 'beam', scale: 1.0, hitstop: 50, shake: 0.4, sfx: 'light' } },

  { id: 'demon_surge', name: 'Demon Surge', type: 'SHADOW', category: 'status',
    power: 0, accuracy: null, pp: 5, target: 'self',
    effects: [{ kind: 'boost', stats: { spa: 2, spd: -1 }, target: 'self' }],
    desc: 'Lets the ancestor answer. Sharply raises Sp. Atk, lowers Sp. Def.',
    flavor: 'The markings arrive first and the manners leave immediately after.',
    fx: { key: 'demon_mark', color: '#1f7a4a', shape: 'aura', scale: 1.7, sfx: 'roar' } }

];
