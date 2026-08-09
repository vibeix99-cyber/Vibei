// FighterDef registry. Shape documented in docs/ARCHITECTURE.md §2.3.
// Owned by the roster agent. Fan-made tribute roster — all art is generated
// procedurally from the `model` block; no source artwork is used.

import { getMove } from './moves.js';

const F = [];
const def = (o) => { F.push({ tier: 'B', awaken: null, ...o }); };

def({
  id: 'luffy', name: 'Luffy', epithet: 'Straw Hat', origin: 'One Piece',
  types: ['FIST', 'BEAST'],
  base: { hp: 95, atk: 125, def: 80, spa: 60, spd: 80, spe: 110 },
  abilities: ['gum_body', 'conquerors_will'],
  learnset: [
    { lv: 1, move: 'gum_gum_pistol' }, { lv: 1, move: 'quick_strike' },
    { lv: 8, move: 'gum_gum_gatling' }, { lv: 16, move: 'armament' },
    { lv: 24, move: 'conquerors_haki' }, { lv: 32, move: 'red_hawk' },
    { lv: 40, move: 'divine_departure' }
  ],
  signature: 'red_hawk',
  awaken: { into: 'luffy_g4', at: 38 },
  model: { build: 'athletic', height: 1.74, palette: { skin: '#f0c092', hair: '#161616', primary: '#d63b2f', secondary: '#2e6fd0', accent: '#f2d24b' }, silhouette: ['strawhat', 'scar_chest', 'open_vest', 'sandals'], aura: '#ff3b2f' },
  dex: 'Rubber from heel to hairline; punches arrive from impossible distances. Loses to nothing except a locked pantry.',
  tier: 'S', cry: { root: 240, shape: 'roar', len: 0.5 }
});

def({
  id: 'zoro', name: 'Zoro', epithet: 'Pirate Hunter', origin: 'One Piece',
  types: ['SLASH', 'HAKI'],
  base: { hp: 90, atk: 135, def: 95, spa: 50, spd: 85, spe: 95 },
  abilities: ['three_blades', 'unbreakable'],
  learnset: [
    { lv: 1, move: 'one_sword_slash' }, { lv: 1, move: 'quick_strike' },
    { lv: 10, move: 'flying_slash' }, { lv: 18, move: 'armament' },
    { lv: 26, move: 'three_sword_style' }, { lv: 36, move: 'conquerors_haki' }
  ],
  signature: 'three_sword_style',
  model: { build: 'bulk', height: 1.81, palette: { skin: '#e8b98a', hair: '#5aa84f', primary: '#1b1b22', secondary: '#2a7f4f', accent: '#c8a24b' }, silhouette: ['haramaki', 'three_swords', 'eye_scar', 'bandana'], aura: '#3ad07a' },
  dex: 'Carries three swords and one impossible promise. Directions are the only opponent he has never beaten.',
  tier: 'S', cry: { root: 180, shape: 'clang', len: 0.45 }
});

def({
  id: 'sanji', name: 'Sanji', epithet: 'Black Leg', origin: 'One Piece',
  types: ['FLAME', 'FIST'],
  base: { hp: 85, atk: 115, def: 75, spa: 85, spd: 80, spe: 120 },
  abilities: ['blue_flame', 'chivalry'],
  learnset: [
    { lv: 1, move: 'quick_strike' }, { lv: 6, move: 'sky_walk' },
    { lv: 14, move: 'gum_gum_gatling' }, { lv: 22, move: 'armament' },
    { lv: 30, move: 'diable_jambe' }, { lv: 38, move: 'fire_fist' }
  ],
  signature: 'diable_jambe',
  model: { build: 'lean', height: 1.80, palette: { skin: '#f2caa0', hair: '#e8c352', primary: '#1a1a1a', secondary: '#2b2b38', accent: '#f2f2f2' }, silhouette: ['suit', 'curl_brow', 'cigarette'], aura: '#3a6cff' },
  dex: 'Never uses his hands in a fight — they belong to the kitchen. The legs are a separate, less reasonable animal.',
  tier: 'A', cry: { root: 300, shape: 'chime', len: 0.4 }
});

def({
  id: 'nami', name: 'Nami', epithet: 'Cat Burglar', origin: 'One Piece',
  types: ['STORM', 'MIND'],
  base: { hp: 75, atk: 55, def: 65, spa: 120, spd: 85, spe: 105 },
  abilities: ['weather_read', 'opportunist'],
  learnset: [
    { lv: 1, move: 'sonic_wail' }, { lv: 8, move: 'mind_haze' },
    { lv: 14, move: 'tidal_call' }, { lv: 22, move: 'thunderbolt_tempo' },
    { lv: 30, move: 'light_wall' }, { lv: 38, move: 'el_thor' }
  ],
  signature: 'thunderbolt_tempo',
  model: { build: 'lithe', height: 1.70, palette: { skin: '#f5cfa8', hair: '#f0913a', primary: '#f0913a', secondary: '#2e8fd0', accent: '#ffffff' }, silhouette: ['climatact', 'ponytail', 'shoulder_tattoo'], aura: '#f5c542' },
  dex: 'Reads a sky like a ledger and charges interest either way. The staff is only the delivery mechanism.',
  tier: 'A', cry: { root: 420, shape: 'chime', len: 0.35 }
});

def({
  id: 'robin', name: 'Robin', epithet: 'Devil Child', origin: 'One Piece',
  types: ['MIND', 'SHADOW'],
  base: { hp: 85, atk: 95, def: 80, spa: 100, spd: 95, spe: 85 },
  abilities: ['thousand_arms', 'cold_read'],
  learnset: [
    { lv: 1, move: 'clutch' }, { lv: 10, move: 'mind_haze' },
    { lv: 18, move: 'shadow_steal' }, { lv: 26, move: 'iron_wall' },
    { lv: 34, move: 'gamma_knife' }
  ],
  signature: 'clutch',
  model: { build: 'lithe', height: 1.88, palette: { skin: '#e5b98f', hair: '#1c1c22', primary: '#5b2a86', secondary: '#2a2a33', accent: '#c8a2d8' }, silhouette: ['long_coat', 'crossed_arms'], aura: '#a24fd0' },
  dex: 'Grows limbs wherever she pleases. The spine she reaches for is rarely the one you were guarding.',
  tier: 'A', cry: { root: 260, shape: 'chime', len: 0.45 }
});

def({
  id: 'ace', name: 'Ace', epithet: 'Fire Fist', origin: 'One Piece',
  types: ['FLAME', 'HAKI'],
  base: { hp: 90, atk: 100, def: 75, spa: 130, spd: 80, spe: 100 },
  abilities: ['logia_flame', 'sunburst'],
  learnset: [
    { lv: 1, move: 'quick_strike' }, { lv: 10, move: 'flame_commandment' },
    { lv: 18, move: 'fire_fist' }, { lv: 26, move: 'armament' },
    { lv: 34, move: 'red_hawk' }
  ],
  signature: 'fire_fist',
  model: { build: 'athletic', height: 1.85, palette: { skin: '#e8ba8c', hair: '#1a1a1a', primary: '#ff5a1c', secondary: '#f2a03a', accent: '#ffdca8' }, silhouette: ['open_shirtless', 'cowboy_hat', 'back_tattoo'], aura: '#ff6a1c' },
  dex: 'Elemental to the bone — fists pass through him and come out warm. Falls asleep mid-sentence, mid-meal, mid-fight.',
  tier: 'S', cry: { root: 200, shape: 'roar', len: 0.5 }
});

def({
  id: 'law', name: 'Law', epithet: 'Surgeon of Death', origin: 'One Piece',
  types: ['MIND', 'SLASH'],
  base: { hp: 80, atk: 90, def: 75, spa: 125, spd: 85, spe: 105 },
  abilities: ['operating_room', 'cold_read'],
  learnset: [
    { lv: 1, move: 'one_sword_slash' }, { lv: 10, move: 'shambles' },
    { lv: 18, move: 'mind_haze' }, { lv: 26, move: 'gamma_knife' },
    { lv: 34, move: 'flying_slash' }
  ],
  signature: 'gamma_knife',
  model: { build: 'lean', height: 1.91, palette: { skin: '#dfb489', hair: '#1a1a22', primary: '#f5d547', secondary: '#2a2a38', accent: '#e0e0e8' }, silhouette: ['long_coat', 'spotted_hat', 'nodachi', 'tattoo_hands'], aura: '#7fd8ff' },
  dex: 'Inside the Room the rules are his. Rearranges organs the way other people rearrange furniture.',
  tier: 'S', cry: { root: 170, shape: 'chime', len: 0.5 }
});

def({
  id: 'jinbe', name: 'Jinbe', epithet: 'Knight of the Sea', origin: 'One Piece',
  types: ['SEA', 'FIST'],
  base: { hp: 120, atk: 120, def: 110, spa: 80, spd: 100, spe: 60 },
  abilities: ['ocean_heart', 'unbreakable'],
  learnset: [
    { lv: 1, move: 'fishman_karate' }, { lv: 10, move: 'tidal_call' },
    { lv: 18, move: 'iron_body' }, { lv: 26, move: 'armament' },
    { lv: 32, move: 'shark_bite' }, { lv: 38, move: 'abyss_pressure' },
    { lv: 44, move: 'iron_wall' }
  ],
  signature: 'fishman_karate',
  model: { build: 'giant', height: 3.01, palette: { skin: '#4a9fd4', hair: '#1a1a22', primary: '#2a5f8f', secondary: '#f2e2c8', accent: '#f0913a' }, silhouette: ['kimono', 'tusks', 'topknot'], aura: '#2a7fd4' },
  dex: 'Strikes the water inside you and lets physics finish the sentence. Will not move when he has decided not to.',
  tier: 'A', cry: { root: 120, shape: 'growl', len: 0.6 }
});

def({
  id: 'mihawk', name: 'Mihawk', epithet: "World's Strongest Swordsman", origin: 'One Piece',
  types: ['SLASH', 'VOID'],
  base: { hp: 90, atk: 145, def: 90, spa: 90, spd: 95, spe: 100 },
  abilities: ['perfect_edge', 'unbreakable'],
  learnset: [
    { lv: 1, move: 'one_sword_slash' }, { lv: 12, move: 'flying_slash' },
    { lv: 20, move: 'armament' }, { lv: 28, move: 'void_step' },
    { lv: 40, move: 'black_blade' }
  ],
  signature: 'black_blade',
  model: { build: 'lean', height: 1.98, palette: { skin: '#e0b48c', hair: '#1a1a1a', primary: '#1a1a22', secondary: '#5b2a2a', accent: '#c8a24b' }, silhouette: ['long_coat', 'wide_hat', 'greatsword', 'cross_pendant'], aura: '#1a1a22' },
  dex: 'Cuts what he decides to cut, at whatever distance he decides. Sits very still until the moment that ends.',
  tier: 'S', cry: { root: 140, shape: 'clang', len: 0.55 }
});

def({
  id: 'crocodile', name: 'Crocodile', epithet: 'Desert King', origin: 'One Piece',
  types: ['EARTH', 'TOXIN'],
  base: { hp: 95, atk: 105, def: 90, spa: 110, spd: 85, spe: 85 },
  abilities: ['sand_body', 'desiccate'],
  learnset: [
    { lv: 1, move: 'sables' }, { lv: 12, move: 'toxic_brand' },
    { lv: 20, move: 'venom_road' }, { lv: 28, move: 'armament' },
    { lv: 36, move: 'caltrop_scatter' }
  ],
  signature: 'sables',
  model: { build: 'bulk', height: 2.53, palette: { skin: '#d4a878', hair: '#1a1a1a', primary: '#3a2a2a', secondary: '#8a5a3a', accent: '#c8b088' }, silhouette: ['long_coat', 'hook_hand', 'cigar', 'face_scar'], aura: '#c8a165' },
  dex: 'Turns to sand when struck and to a desert when annoyed. Drinks the water out of everything he touches.',
  tier: 'A', cry: { root: 150, shape: 'growl', len: 0.5 }
});

def({
  id: 'katakuri', name: 'Katakuri', epithet: 'Sweet Commander', origin: 'One Piece',
  types: ['MIND', 'HAKI'],
  base: { hp: 110, atk: 130, def: 100, spa: 95, spd: 100, spe: 90 },
  abilities: ['future_sight', 'mochi_body'],
  learnset: [
    { lv: 1, move: 'quick_strike' }, { lv: 12, move: 'clutch' },
    { lv: 20, move: 'armament' }, { lv: 28, move: 'shambles' },
    { lv: 36, move: 'divine_departure' }
  ],
  signature: 'divine_departure',
  model: { build: 'giant', height: 5.09, palette: { skin: '#e8c4a0', hair: '#8a2a3a', primary: '#5a1a2a', secondary: '#2a2a33', accent: '#f0d8c0' }, silhouette: ['scarf', 'tall_coat', 'trident'], aura: '#c04a6a' },
  dex: 'Sees a few seconds ahead and steps out of the way before you have thought of the punch. Has never been knocked down.',
  tier: 'S', cry: { root: 130, shape: 'growl', len: 0.55 }
});

def({
  id: 'kaido', name: 'Kaido', epithet: 'Strongest Creature', origin: 'One Piece',
  types: ['BEAST', 'HAKI'],
  base: { hp: 140, atk: 145, def: 125, spa: 110, spd: 110, spe: 70 },
  abilities: ['undying', 'conquerors_will'],
  learnset: [
    { lv: 1, move: 'iron_body' }, { lv: 14, move: 'bolo_breath' },
    { lv: 22, move: 'conquerors_haki' }, { lv: 30, move: 'armament' },
    { lv: 40, move: 'divine_departure' }
  ],
  signature: 'bolo_breath',
  model: { build: 'giant', height: 7.10, palette: { skin: '#d8a878', hair: '#3a5a8a', primary: '#8a2a2a', secondary: '#2a3a5a', accent: '#c8a24b' }, silhouette: ['horns', 'dragon_mane', 'kanabo', 'shirtless'], aura: '#5a7fd0' },
  dex: 'Has tried to die a great many times and been refused every time. Fights hungover, which is his handicap system.',
  tier: 'S', cry: { root: 90, shape: 'roar', len: 0.75 }
});


/* ══════════════════════════════════════════════════════════════════════
   Wave 1 roster expansion. Every fighter below has a role you can name in
   one phrase, a stat spread that pays for its strengths, and a level-50
   default set (last four moves learned) that is its honest best expression.
   ══════════════════════════════════════════════════════════════════════ */

def({
  id: 'usopp', name: 'Usopp', epithet: 'God of the Sniper Island', origin: 'One Piece',
  types: ['MECHA', 'TOXIN'],
  base: { hp: 70, atk: 60, def: 65, spa: 115, spd: 70, spe: 100 },
  abilities: ['technician', 'quick_draw'],
  learnset: [
    { lv: 1, move: 'quick_strike' }, { lv: 4, move: 'oil_slick_toss' },
    { lv: 10, move: 'caltrop_scatter' }, { lv: 16, move: 'toxic_barbs' },
    { lv: 22, move: 'mud_shot' }, { lv: 28, move: 'rivet_cannon' },
    { lv: 34, move: 'venom_road' }, { lv: 40, move: 'overdrive_cannon' }
  ],
  signature: 'rivet_cannon',
  model: { build: 'lean', height: 1.76, palette: { skin: '#b57a4a', hair: '#1c1c22', primary: '#d8b84a', secondary: '#4a7f3a', accent: '#f2f2e8' }, silhouette: ['goggles', 'scarf', 'gauntlets'], aura: '#d8b84a' },
  dex: 'Wins fights from four hundred metres away and then invents a better version of what happened. The lies are load-bearing.',
  tier: 'B', cry: { root: 380, shape: 'chime', len: 0.4 }
});

def({
  id: 'franky', name: 'Franky', epithet: 'Cyborg', origin: 'One Piece',
  types: ['MECHA', 'FIST'],
  base: { hp: 110, atk: 115, def: 125, spa: 95, spd: 80, spe: 55 },
  abilities: ['iron_hide', 'thick_hide'],
  learnset: [
    { lv: 1, move: 'shockwave_palm' }, { lv: 8, move: 'iron_body' },
    { lv: 15, move: 'gear_strike' }, { lv: 22, move: 'iron_wall' },
    { lv: 29, move: 'steel_meteor' }, { lv: 36, move: 'coup_de_vent' }
  ],
  signature: 'coup_de_vent',
  model: { build: 'bulk', height: 2.40, palette: { skin: '#e3b98c', hair: '#5fc8e8', primary: '#3a86c8', secondary: '#2a2a33', accent: '#f2f2f2' }, silhouette: ['open_vest', 'gauntlets', 'shoulder_tattoo'], aura: '#5fc8e8' },
  dex: 'Rebuilt himself out of the wreck that nearly killed him, and improved the specification while he was in there. Runs on cola.',
  tier: 'A', cry: { root: 130, shape: 'clang', len: 0.55 }
});

def({
  id: 'brook', name: 'Brook', epithet: 'Soul King', origin: 'One Piece',
  types: ['SPIRIT', 'SLASH'],
  base: { hp: 75, atk: 95, def: 60, spa: 120, spd: 90, spe: 125 },
  abilities: ['revenant', 'amplifier'],
  learnset: [
    { lv: 1, move: 'draw_cut' }, { lv: 9, move: 'lullaby' },
    { lv: 16, move: 'soul_leech' }, { lv: 23, move: 'battle_hymn' },
    { lv: 30, move: 'flying_slash' }, { lv: 37, move: 'soul_solid' }
  ],
  signature: 'soul_solid',
  model: { build: 'lithe', height: 2.66, palette: { skin: '#f0ece0', hair: '#1c1c22', primary: '#2a2a44', secondary: '#5b2a86', accent: '#f2c94c' }, silhouette: ['suit', 'cape', 'three_swords'], aura: '#6fe3d0' },
  dex: 'Came back from the dead with his sense of humour intact and very little else. The blade is cold before it reaches you.',
  tier: 'A', cry: { root: 520, shape: 'chime', len: 0.55 }
});

def({
  id: 'chopper', name: 'Chopper', epithet: 'Cotton Candy Lover', origin: 'One Piece',
  types: ['BEAST', 'MIND'],
  base: { hp: 100, atk: 85, def: 105, spa: 90, spd: 110, spe: 65 },
  abilities: ['regenerator', 'pure_heart'],
  learnset: [
    { lv: 1, move: 'savage_bite' }, { lv: 8, move: 'second_wind' },
    { lv: 14, move: 'numbing_mist' }, { lv: 21, move: 'stone_skin' },
    { lv: 28, move: 'wild_pulse' }, { lv: 35, move: 'rampage' },
    { lv: 41, move: 'venom_fang' }
  ],
  signature: 'rampage',
  model: { build: 'lithe', height: 0.90, palette: { skin: '#c8875a', hair: '#8a4a2a', primary: '#d8456a', secondary: '#f2e2c8', accent: '#f2c94c' }, silhouette: ['horns', 'cape'], aura: '#f2a0b8' },
  dex: 'A doctor first and a monster second, and only ever in that order. Being called cute makes him furious and visibly delighted.',
  tier: 'B', cry: { root: 460, shape: 'growl', len: 0.4 }
});

def({
  id: 'doflamingo', name: 'Doflamingo', epithet: 'Heavenly Demon', origin: 'One Piece',
  types: ['MIND', 'VOID'],
  base: { hp: 95, atk: 105, def: 90, spa: 130, spd: 95, spe: 110 },
  abilities: ['cursed_grip', 'pressure_haki'],
  learnset: [
    { lv: 1, move: 'shadow_clutch' }, { lv: 10, move: 'mind_haze' },
    { lv: 18, move: 'nightmare_grip' }, { lv: 26, move: 'shadow_stitch' },
    { lv: 33, move: 'mind_break' }, { lv: 41, move: 'void_lance' }
  ],
  signature: 'shadow_stitch',
  model: { build: 'lean', height: 3.05, palette: { skin: '#e8c49a', hair: '#f2e2a8', primary: '#e8567a', secondary: '#2a2a33', accent: '#f2c94c' }, silhouette: ['cape', 'goggles', 'open_vest' ], aura: '#e8567a' },
  dex: 'Everyone in the room is already holding a string and has not noticed. He finds the moment they notice extremely funny.',
  tier: 'S', cry: { root: 210, shape: 'growl', len: 0.6 }
});

def({
  id: 'hancock', name: 'Hancock', epithet: 'Pirate Empress', origin: 'One Piece',
  types: ['LIGHT', 'MIND'],
  base: { hp: 85, atk: 100, def: 80, spa: 125, spd: 100, spe: 115 },
  abilities: ['mirage_step', 'opportunist'],
  learnset: [
    { lv: 1, move: 'photon_dart' }, { lv: 9, move: 'blinding_flash' },
    { lv: 17, move: 'radiant_palm' }, { lv: 25, move: 'tempest_kick' },
    { lv: 33, move: 'heavens_ray' }, { lv: 40, move: 'daybreak' }
  ],
  signature: 'heavens_ray',
  model: { build: 'lithe', height: 1.91, palette: { skin: '#f2d0b0', hair: '#1c1c28', primary: '#e04a7a', secondary: '#f2e2e8', accent: '#f2c94c' }, silhouette: ['cape', 'crossed_arms', 'cross_pendant'], aura: '#ff9ec4' },
  dex: 'Beauty as a weapon, deployed with total sincerity and no mercy whatsoever. Turning to stone is the polite outcome.',
  tier: 'A', cry: { root: 440, shape: 'chime', len: 0.5 }
});

def({
  id: 'smoker', name: 'Smoker', epithet: 'White Hunter', origin: 'One Piece',
  types: ['WIND', 'MECHA'],
  base: { hp: 100, atk: 110, def: 100, spa: 80, spd: 95, spe: 85 },
  abilities: ['windborne', 'justified'],
  learnset: [
    { lv: 1, move: 'quick_strike' }, { lv: 8, move: 'clearing_gust' },
    { lv: 16, move: 'slicing_gale' }, { lv: 24, move: 'iron_body' },
    { lv: 31, move: 'cyclone_press' }, { lv: 38, move: 'armament' },
    { lv: 44, move: 'gear_strike' }
  ],
  signature: 'cyclone_press',
  model: { build: 'bulk', height: 2.09, palette: { skin: '#d8a878', hair: '#e8e8f0', primary: '#3a4a5a', secondary: '#2a2a33', accent: '#c8c8d0' }, silhouette: ['open_vest', 'cigar', 'gauntlets'], aura: '#c8ccd8' },
  dex: 'Smoke does not stop for a fist and does not stop for an order either. Two cigars, permanently, because one is not enough.',
  tier: 'B', cry: { root: 170, shape: 'growl', len: 0.5 }
});

def({
  id: 'enel', name: 'Enel', epithet: 'God of Skypiea', origin: 'One Piece',
  types: ['STORM', 'SPIRIT'],
  base: { hp: 80, atk: 85, def: 65, spa: 145, spd: 85, spe: 120 },
  abilities: ['static_field', 'amplifier'],
  learnset: [
    { lv: 1, move: 'spark_jab' }, { lv: 10, move: 'arc_bolt' },
    { lv: 18, move: 'static_snare' }, { lv: 26, move: 'chain_lightning' },
    { lv: 34, move: 'thunderbolt_tempo' }, { lv: 42, move: 'el_thor' }
  ],
  signature: 'el_thor',
  model: { build: 'lean', height: 2.66, palette: { skin: '#e0b878', hair: '#f2e8d0', primary: '#f2c94c', secondary: '#2a2a33', accent: '#ffffff' }, silhouette: ['halo', 'cape', 'topknot'], aura: '#fff3a0' },
  dex: 'Hears every heartbeat on the island and mistakes that for omniscience. Two hundred million volts of very sincere theology.',
  tier: 'A', cry: { root: 300, shape: 'clang', len: 0.5 }
});

def({
  id: 'bigmom', name: 'Big Mom', epithet: 'Emperor of the Sea', origin: 'One Piece',
  types: ['SPIRIT', 'BEAST'],
  base: { hp: 145, atk: 135, def: 130, spa: 115, spd: 105, spe: 60 },
  abilities: ['stamina_wall', 'conquerors_will'],
  learnset: [
    { lv: 1, move: 'soul_offering' }, { lv: 12, move: 'soul_leech' },
    { lv: 20, move: 'iron_body' }, { lv: 28, move: 'conquerors_haki' },
    { lv: 36, move: 'abyssal_maw' }, { lv: 44, move: 'final_requiem' }
  ],
  signature: 'final_requiem',
  model: { build: 'giant', height: 8.80, palette: { skin: '#f0c0a0', hair: '#e8508a', primary: '#e0407a', secondary: '#f2d24b', accent: '#ffffff' }, silhouette: ['cape', 'crossed_arms', 'cross_pendant'], aura: '#ff5fa0' },
  dex: 'Takes years off your life as a snack and asks for seconds. The homies sing while she does it.',
  tier: 'S', cry: { root: 95, shape: 'roar', len: 0.8 }
});

def({
  id: 'shanks', name: 'Shanks', epithet: 'Red-Haired', origin: 'One Piece',
  types: ['HAKI', 'SLASH'],
  base: { hp: 100, atk: 130, def: 100, spa: 100, spd: 110, spe: 115 },
  abilities: ['conquerors_will', 'perfect_edge'],
  learnset: [
    { lv: 1, move: 'draw_cut' }, { lv: 10, move: 'armament' },
    { lv: 19, move: 'imbued_strike' }, { lv: 27, move: 'sovereign_flash' },
    { lv: 35, move: 'conquerors_haki' }, { lv: 44, move: 'divine_departure' }
  ],
  signature: 'sovereign_flash',
  model: { build: 'athletic', height: 1.99, palette: { skin: '#e8bc90', hair: '#c8402a', primary: '#1c1c28', secondary: '#3a3a48', accent: '#f2e2c8' }, silhouette: ['cape', 'face_scar', 'three_swords'], aura: '#e8503a' },
  dex: 'Arrived, and the war stopped. Gave away an arm for a child and has never once mentioned it since.',
  tier: 'S', cry: { root: 165, shape: 'clang', len: 0.6 }
});

def({
  id: 'goku', name: 'Goku', epithet: 'Son of Saiyans', origin: 'Dragon Ball',
  types: ['FIST', 'LIGHT'],
  base: { hp: 105, atk: 130, def: 95, spa: 125, spd: 95, spe: 115 },
  abilities: ['late_bloomer', 'guts_haki'],
  learnset: [
    { lv: 1, move: 'quick_strike' }, { lv: 9, move: 'open_stance' },
    { lv: 17, move: 'meteor_knuckle' }, { lv: 25, move: 'grit' },
    { lv: 33, move: 'photon_dart' }, { lv: 42, move: 'annihilation_ray' }
  ],
  signature: 'annihilation_ray',
  model: { build: 'athletic', height: 1.75, palette: { skin: '#f0c090', hair: '#1c1c22', primary: '#e87a2a', secondary: '#2a5fb0', accent: '#f2e2c8' }, silhouette: ['open_vest', 'gauntlets', 'scar_chest'], aura: '#ffe36b' },
  dex: 'Gets stronger every time something nearly kills him, which he treats as a training plan. Would rather you fought him at your best.',
  tier: 'S', cry: { root: 250, shape: 'roar', len: 0.65 }
});

def({
  id: 'ichigo', name: 'Ichigo', epithet: 'Substitute Reaper', origin: 'Bleach',
  types: ['SLASH', 'SPIRIT'],
  base: { hp: 95, atk: 130, def: 85, spa: 105, spd: 80, spe: 105 },
  abilities: ['berserker', 'last_stand'],
  learnset: [
    { lv: 1, move: 'draw_cut' }, { lv: 9, move: 'flying_slash' },
    { lv: 17, move: 'soul_leech' }, { lv: 25, move: 'grit' },
    { lv: 33, move: 'moonlit_reap' }, { lv: 40, move: 'oblivion_rend' }
  ],
  signature: 'moonlit_reap',
  awaken: { into: 'ichigo_bankai', at: 40 },
  model: { build: 'lean', height: 1.81, palette: { skin: '#eec49a', hair: '#e8873a', primary: '#1c1c28', secondary: '#2a2a38', accent: '#e8e8f0' }, silhouette: ['kimono', 'greatsword', 'scarf'], aura: '#3a6cff' },
  dex: 'Borrowed a job that was never his and refused to give it back. Swings a sword the size of a door as if it weighed nothing.',
  tier: 'A', cry: { root: 200, shape: 'clang', len: 0.55 }
});

def({
  id: 'ichigo_bankai', name: 'Ichigo', epithet: 'Bankai', origin: 'Bleach',
  types: ['SLASH', 'VOID'],
  base: { hp: 95, atk: 140, def: 90, spa: 110, spd: 85, spe: 140 },
  abilities: ['berserker', 'unburden_ki'],
  learnset: [
    { lv: 1, move: 'draw_cut' }, { lv: 1, move: 'flash_step' },
    { lv: 40, move: 'moonlit_reap' }, { lv: 42, move: 'oblivion_rend' },
    { lv: 46, move: 'erasure_fist' }, { lv: 50, move: 'event_horizon' }
  ],
  signature: 'event_horizon',
  model: { build: 'lean', height: 1.81, palette: { skin: '#eec49a', hair: '#e8873a', primary: '#0f0f16', secondary: '#1c1c28', accent: '#e04a4a' }, silhouette: ['kimono', 'greatsword', 'scarf', 'eye_scar'], aura: '#1a1a2a' },
  dex: 'Traded every ounce of bulk for speed and did not think about it for long. The compressed form is the point.',
  tier: 'S', cry: { root: 150, shape: 'clang', len: 0.6 }
});

def({
  id: 'gojo', name: 'Gojo', epithet: 'The Honoured One', origin: 'Jujutsu Kaisen',
  types: ['VOID', 'MIND'],
  base: { hp: 90, atk: 90, def: 95, spa: 150, spd: 110, spe: 125 },
  abilities: ['mirror_scale', 'pressure_haki'],
  learnset: [
    { lv: 1, move: 'flash_step' }, { lv: 11, move: 'nullify' },
    { lv: 20, move: 'void_lance' }, { lv: 28, move: 'warped_room' },
    { lv: 36, move: 'erasure_fist' }, { lv: 45, move: 'singularity' }
  ],
  signature: 'singularity',
  model: { build: 'lean', height: 1.90, palette: { skin: '#f2dcc8', hair: '#f2f2f8', primary: '#12121a', secondary: '#2a2a38', accent: '#7fd8ff' }, silhouette: ['goggles', 'cape', 'suit'], aura: '#7fd8ff' },
  dex: 'Nothing reaches him and he knows it, which is most of the problem. Blindfolded because seeing everything is exhausting.',
  tier: 'S', cry: { root: 330, shape: 'chime', len: 0.55 }
});

def({
  id: 'tanjiro', name: 'Tanjiro', epithet: 'Water Breathing', origin: 'Demon Slayer',
  types: ['SEA', 'SLASH'],
  base: { hp: 90, atk: 115, def: 85, spa: 95, spd: 90, spe: 105 },
  abilities: ['technician', 'pure_heart'],
  learnset: [
    { lv: 1, move: 'draw_cut' }, { lv: 8, move: 'aqua_step' },
    { lv: 16, move: 'siphon_wave' }, { lv: 24, move: 'blade_dance' },
    { lv: 32, move: 'tenfold_tsunami' }, { lv: 40, move: 'thousand_cuts' }
  ],
  signature: 'tenfold_tsunami',
  model: { build: 'lean', height: 1.65, palette: { skin: '#e8b890', hair: '#7a2a1a', primary: '#1c3a28', secondary: '#2a2a33', accent: '#3a8ad0' }, silhouette: ['kimono', 'three_swords', 'face_scar'], aura: '#3a9fd8' },
  dex: 'Fights like water finding a crack, which is patient and completely relentless. Apologises to almost everyone he defeats.',
  tier: 'A', cry: { root: 280, shape: 'chime', len: 0.45 }
});

def({
  id: 'levi', name: 'Levi', epithet: 'Humanity\'s Strongest', origin: 'Attack on Titan',
  types: ['SLASH', 'WIND'],
  base: { hp: 80, atk: 135, def: 80, spa: 60, spd: 95, spe: 145 },
  abilities: ['quick_draw', 'clean_sweep'],
  learnset: [
    { lv: 1, move: 'quick_strike' }, { lv: 8, move: 'feather_step' },
    { lv: 15, move: 'draw_cut' }, { lv: 23, move: 'sever_tendon' },
    { lv: 31, move: 'tempest_kick' }, { lv: 39, move: 'thousand_cuts' }
  ],
  signature: 'thousand_cuts',
  model: { build: 'lean', height: 1.60, palette: { skin: '#e8c8a8', hair: '#1c1c22', primary: '#3a3a48', secondary: '#5a4a3a', accent: '#c8c8d0' }, silhouette: ['cape', 'three_swords', 'gauntlets'], aura: '#a8b8c8' },
  dex: 'Spins through the air on steel cable and lands without a hair out of place. Would like everyone to clean up after themselves.',
  tier: 'A', cry: { root: 220, shape: 'clang', len: 0.4 }
});

def({
  id: 'saitama', name: 'Saitama', epithet: 'Caped Baldy', origin: 'One Punch Man',
  types: ['FIST'],
  base: { hp: 100, atk: 165, def: 100, spa: 40, spd: 90, spe: 105 },
  abilities: ['overwhelm', 'finisher'],
  learnset: [
    { lv: 1, move: 'quick_strike' }, { lv: 10, move: 'shockwave_palm' },
    { lv: 20, move: 'open_stance' }, { lv: 26, move: 'grand_quake' },
    { lv: 30, move: 'meteor_knuckle' }, { lv: 40, move: 'falling_star_fist' }
  ],
  signature: 'falling_star_fist',
  model: { build: 'athletic', height: 1.75, palette: { skin: '#f2d0a8', hair: '#f2d0a8', primary: '#e8c93a', secondary: '#e04a4a', accent: '#f2f2f2' }, silhouette: ['cape', 'gauntlets'], aura: '#f2f2f2' },
  dex: 'Three years of push-ups and no air conditioning, and now nothing is a fight. Would genuinely like to lose one.',
  tier: 'S', cry: { root: 190, shape: 'roar', len: 0.35 }
});

def({
  id: 'killua', name: 'Killua', epithet: 'Lightning Palm', origin: 'Hunter x Hunter',
  types: ['STORM', 'SHADOW'],
  base: { hp: 80, atk: 120, def: 75, spa: 105, spd: 80, spe: 150 },
  abilities: ['unburden_ki', 'momentum'],
  learnset: [
    { lv: 1, move: 'quick_strike' }, { lv: 8, move: 'spark_jab' },
    { lv: 16, move: 'flash_step' }, { lv: 24, move: 'thunder_kick' },
    { lv: 32, move: 'umbral_claw' }, { lv: 40, move: 'overcharge' }
  ],
  signature: 'overcharge',
  model: { build: 'lithe', height: 1.58, palette: { skin: '#f2dcc0', hair: '#e8e8f0', primary: '#3a4a6a', secondary: '#2a2a38', accent: '#7fd8ff' }, silhouette: ['gauntlets', 'scarf'], aura: '#8fe8ff' },
  dex: 'Raised as a weapon and spending every day since deciding not to be one. Moves faster than the decision to move.',
  tier: 'A', cry: { root: 400, shape: 'clang', len: 0.35 }
});

def({
  id: 'edward', name: 'Edward', epithet: 'Fullmetal Alchemist', origin: 'Fullmetal Alchemist',
  types: ['EARTH', 'MECHA'],
  base: { hp: 95, atk: 120, def: 115, spa: 100, spd: 90, spe: 85 },
  abilities: ['iron_hide', 'technician'],
  learnset: [
    { lv: 1, move: 'shockwave_palm' }, { lv: 9, move: 'stone_skin' },
    { lv: 17, move: 'strata_spear' }, { lv: 25, move: 'boulder_toss' },
    { lv: 33, move: 'gear_strike' }, { lv: 41, move: 'grand_quake' }
  ],
  signature: 'strata_spear',
  model: { build: 'lean', height: 1.65, palette: { skin: '#f0cba0', hair: '#e8c04a', primary: '#c02a2a', secondary: '#1c1c28', accent: '#c8ccd8' }, silhouette: ['cape', 'gauntlets', 'tattoo_hands'], aura: '#8fd8ff' },
  dex: 'Claps once and the ground becomes a weapon. Do not comment on the height; the automail arm is not the sensitive subject.',
  tier: 'A', cry: { root: 260, shape: 'clang', len: 0.45 }
});


def({
  id: 'luffy_g4', name: 'Luffy', epithet: 'Fourth Gear', origin: 'One Piece',
  types: ['FIST', 'HAKI'],
  base: { hp: 95, atk: 138, def: 92, spa: 60, spd: 85, spe: 122 },
  abilities: ['gum_body', 'momentum'],
  learnset: [
    { lv: 1, move: 'gum_gum_pistol' }, { lv: 1, move: 'quick_strike' },
    { lv: 38, move: 'armament' }, { lv: 40, move: 'meteor_knuckle' },
    { lv: 44, move: 'red_hawk' }, { lv: 48, move: 'divine_departure' }
  ],
  signature: 'divine_departure',
  model: { build: 'bulk', height: 2.20, palette: { skin: '#e8807a', hair: '#161616', primary: '#c02a24', secondary: '#2e6fd0', accent: '#f2d24b' }, silhouette: ['scar_chest', 'open_vest', 'sandals', 'gauntlets'], aura: '#ff3b2f' },
  dex: 'Bounces off the air itself, then off you, and the recoil is the attack. Runs out in ten minutes and cannot move for the next ten.',
  tier: 'S', cry: { root: 210, shape: 'roar', len: 0.6 }
});

/* ------------------------------------------------------------------ */

export const FIGHTERS = F;
export const FIGHTER_BY_ID = Object.fromEntries(F.map((f) => [f.id, f]));
export function getFighter(id) { return FIGHTER_BY_ID[id]; }
export function allFighters() { return F; }

/**
 * The level-appropriate default set — what most players will actually battle
 * with, so it has to be the fighter's honest best expression rather than
 * simply the last four things it learned. Newest first, but guaranteed at
 * least two ways to deal damage and never more than two status moves, and
 * biased toward covering different types.
 */
export function defaultMoves(id, level = 50) {
  const f = getFighter(id);
  if (!f) return [];
  const learned = [...new Set(f.learnset.filter((l) => l.lv <= level).map((l) => l.move))].reverse();
  if (learned.length <= 4) return learned.slice().reverse();

  const dmg = [], status = [];
  for (const mid of learned) {
    const m = getMove(mid);
    if (m && m.category !== 'status' && m.power > 0) dmg.push(m); else status.push(mid);
  }

  const picked = [];
  const seenType = new Set();
  // Strongest first, but take a new type over a marginally stronger repeat.
  for (const m of dmg.slice().sort((a, b) => (b.power || 0) - (a.power || 0))) {
    if (picked.length >= 3) break;
    if (seenType.has(m.type) && picked.length >= 2) continue;
    seenType.add(m.type);
    picked.push(m.id);
  }
  for (const sid of status) { if (picked.length >= 4) break; picked.push(sid); }
  for (const m of dmg) { if (picked.length >= 4) break; if (!picked.includes(m.id)) picked.push(m.id); }

  // Restore learn order so the set reads like a progression.
  const order = learned.slice().reverse();
  return picked.sort((a, b) => order.indexOf(a) - order.indexOf(b));
}

export function makeDefaultMember(id, level = 50) {
  const f = getFighter(id);
  return {
    speciesId: id, nickname: f.name, level,
    nature: 'hardy', ability: f.abilities[0], item: null,
    moves: defaultMoves(id, level)
  };
}
