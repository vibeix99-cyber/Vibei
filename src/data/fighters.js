// FighterDef registry. Shape documented in docs/ARCHITECTURE.md §2.3.
// Owned by the roster agent. Fan-made tribute roster — all art is generated
// procedurally from the `model` block; no source artwork is used.

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
    { lv: 34, move: 'iron_wall' }
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

/* ------------------------------------------------------------------ */

export const FIGHTERS = F;
export const FIGHTER_BY_ID = Object.fromEntries(F.map((f) => [f.id, f]));
export function getFighter(id) { return FIGHTER_BY_ID[id]; }
export function allFighters() { return F; }

/** Level-appropriate default moveset (last 4 learned). */
export function defaultMoves(id, level = 50) {
  const f = getFighter(id);
  if (!f) return [];
  const learned = f.learnset.filter((l) => l.lv <= level).map((l) => l.move);
  const uniq = [...new Set(learned)];
  return uniq.slice(-4);
}

export function makeDefaultMember(id, level = 50) {
  const f = getFighter(id);
  return {
    speciesId: id, nickname: f.name, level,
    nature: 'hardy', ability: f.abilities[0], item: null,
    moves: defaultMoves(id, level)
  };
}
