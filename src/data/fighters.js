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
    { lv: 1, move: 'quick_strike' }, { lv: 1, move: 'gum_gum_pistol' }, { lv: 4, move: 'pack_hunt' },
    { lv: 7, move: 'grit' }, { lv: 10, move: 'gum_gum_gatling' }, { lv: 13, move: 'savage_bite' },
    { lv: 16, move: 'armament' }, { lv: 19, move: 'seismic_throw' }, { lv: 22, move: 'imbued_strike' },
    { lv: 25, move: 'open_stance' }, { lv: 28, move: 'meteor_combination' }, { lv: 31, move: 'heel_drop' },
    { lv: 34, move: 'red_hawk' }, { lv: 37, move: 'bloodlust' }, { lv: 40, move: 'kong_gun' },
    { lv: 43, move: 'blood_frenzy' }, { lv: 45, move: 'rampage' }, { lv: 47, move: 'conquerors_haki' },
    { lv: 48, move: 'divine_departure' }, { lv: 50, move: 'bajrang_gun' }
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
    { lv: 1, move: 'quick_strike' }, { lv: 1, move: 'one_sword_slash' }, { lv: 4, move: 'draw_cut' },
    { lv: 7, move: 'sever_tendon' }, { lv: 10, move: 'flying_slash' }, { lv: 14, move: 'chasing_edge' },
    { lv: 17, move: 'whetstone_rite' }, { lv: 19, move: 'armament' }, { lv: 21, move: 'grit' },
    { lv: 24, move: 'thousand_cuts' }, { lv: 27, move: 'blade_dance' }, { lv: 30, move: 'three_sword_style' },
    { lv: 33, move: 'imbued_strike' }, { lv: 35, move: 'pinning_will' }, { lv: 38, move: 'conquerors_haki' },
    { lv: 41, move: 'haki_pierce' }, { lv: 44, move: 'enma_draw' }, { lv: 46, move: 'steel_garden' },
    { lv: 49, move: 'asura_bakkei' }
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
    { lv: 1, move: 'quick_strike' }, { lv: 1, move: 'searing_kick' }, { lv: 4, move: 'feather_step' },
    { lv: 7, move: 'sky_walk' }, { lv: 10, move: 'flame_lash' }, { lv: 13, move: 'slicing_gale' },
    { lv: 16, move: 'tempest_kick' }, { lv: 19, move: 'hit_and_fade' }, { lv: 22, move: 'armament' },
    { lv: 25, move: 'diable_jambe' }, { lv: 26, move: 'ashen_brand' }, { lv: 28, move: 'heel_drop' },
    { lv: 31, move: 'ember_field' }, { lv: 34, move: 'concasse' }, { lv: 37, move: 'fire_fist' },
    { lv: 40, move: 'blaze_rush' }, { lv: 43, move: 'ember_break' }, { lv: 45, move: 'open_stance' },
    { lv: 47, move: 'ifrit_jambe' }, { lv: 49, move: 'flare_nova' }, { lv: 50, move: 'phoenix_dive' }
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
    { lv: 1, move: 'spark_jab' }, { lv: 1, move: 'sonic_wail' }, { lv: 4, move: 'arc_bolt' },
    { lv: 6, move: 'frost_step' }, { lv: 7, move: 'mind_haze' }, { lv: 10, move: 'chain_lightning' },
    { lv: 13, move: 'tidal_call' }, { lv: 16, move: 'numbing_mist' }, { lv: 19, move: 'mind_spike' },
    { lv: 20, move: 'shatter_volley' }, { lv: 22, move: 'static_snare' }, { lv: 25, move: 'thunder_lance_tempo' },
    { lv: 28, move: 'volt_relay' }, { lv: 31, move: 'thunderbolt_tempo' }, { lv: 34, move: 'light_wall' },
    { lv: 37, move: 'sea_fog' }, { lv: 40, move: 'frost_veil' }, { lv: 42, move: 'ice_age' },
    { lv: 43, move: 'voltage_surge' }, { lv: 45, move: 'mirror_room' }, { lv: 47, move: 'heavens_judgement' },
    { lv: 50, move: 'el_thor' }
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
    { lv: 1, move: 'pressure_point' }, { lv: 1, move: 'clutch' }, { lv: 4, move: 'mind_spike' },
    { lv: 6, move: 'small_target' }, { lv: 9, move: 'shadow_clutch' }, { lv: 12, move: 'mind_haze' },
    { lv: 15, move: 'second_guess' }, { lv: 18, move: 'mind_relay' }, { lv: 20, move: 'toxic_brand' },
    { lv: 21, move: 'shadow_steal' }, { lv: 24, move: 'nightfall_bolt' }, { lv: 27, move: 'iron_wall' },
    { lv: 30, move: 'mirror_seal' }, { lv: 33, move: 'umbral_claw' }, { lv: 36, move: 'vanishing_act' },
    { lv: 39, move: 'encore_command' }, { lv: 42, move: 'mil_fleur_gigantesco' }, { lv: 44, move: 'abyssal_maw' },
    { lv: 46, move: 'mind_break' }, { lv: 48, move: 'shared_agony' }, { lv: 50, move: 'oblivion_rend' }
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
    { lv: 1, move: 'flame_lash' }, { lv: 1, move: 'quick_strike' }, { lv: 4, move: 'searing_kick' },
    { lv: 6, move: 'grit' }, { lv: 9, move: 'flame_commandment' }, { lv: 12, move: 'fire_fist' },
    { lv: 15, move: 'ember_break' }, { lv: 18, move: 'ember_field' }, { lv: 20, move: 'last_will' },
    { lv: 22, move: 'armament' }, { lv: 25, move: 'blaze_rush' }, { lv: 26, move: 'ashen_brand' },
    { lv: 28, move: 'imbued_strike' }, { lv: 30, move: 'will_of_iron' }, { lv: 33, move: 'sovereign_flash' },
    { lv: 36, move: 'red_hawk' }, { lv: 39, move: 'conquerors_haki' }, { lv: 42, move: 'flare_nova' },
    { lv: 45, move: 'haki_pierce' }, { lv: 47, move: 'phoenix_dive' }, { lv: 50, move: 'entei' }
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
    { lv: 1, move: 'one_sword_slash' }, { lv: 1, move: 'mind_spike' }, { lv: 4, move: 'draw_cut' },
    { lv: 7, move: 'sever_tendon' }, { lv: 10, move: 'shambles' }, { lv: 13, move: 'mind_haze' },
    { lv: 16, move: 'pressure_point' }, { lv: 19, move: 'mind_relay' }, { lv: 20, move: 'nullify' },
    { lv: 22, move: 'flying_slash' }, { lv: 24, move: 'mind_field' }, { lv: 25, move: 'counter_shock' },
    { lv: 28, move: 'mirror_room' }, { lv: 31, move: 'second_guess' }, { lv: 34, move: 'gamma_knife' },
    { lv: 37, move: 'takt' }, { lv: 40, move: 'mirror_seal' }, { lv: 43, move: 'warped_room' },
    { lv: 46, move: 'mind_break' }, { lv: 49, move: 'dismantle' }, { lv: 50, move: 'event_horizon' }
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
    { lv: 1, move: 'quick_strike' }, { lv: 1, move: 'aqua_step' }, { lv: 4, move: 'shark_bite' },
    { lv: 7, move: 'siphon_wave' }, { lv: 10, move: 'tidal_call' }, { lv: 13, move: 'fishman_karate' },
    { lv: 16, move: 'iron_body' }, { lv: 19, move: 'anchor_stance' }, { lv: 20, move: 'slick_tide' },
    { lv: 22, move: 'armament' }, { lv: 25, move: 'sea_veil' }, { lv: 28, move: 'abyss_pressure' },
    { lv: 31, move: 'imbued_strike' }, { lv: 34, move: 'bubble_ward' }, { lv: 37, move: 'iron_wall' },
    { lv: 40, move: 'shima_yurashi' }, { lv: 43, move: 'grand_quake' }, { lv: 45, move: 'tenfold_tsunami' },
    { lv: 47, move: 'haki_pierce' }, { lv: 49, move: 'karakusagawara_seiken' }
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
    { lv: 1, move: 'one_sword_slash' }, { lv: 1, move: 'draw_cut' }, { lv: 4, move: 'flying_slash' },
    { lv: 7, move: 'sever_tendon' }, { lv: 10, move: 'chasing_edge' }, { lv: 13, move: 'whetstone_rite' },
    { lv: 19, move: 'armament' }, { lv: 21, move: 'pinning_will' }, { lv: 22, move: 'unsheathe' },
    { lv: 25, move: 'void_lance' }, { lv: 27, move: 'void_step' }, { lv: 30, move: 'phase_lance' },
    { lv: 33, move: 'moonlit_reap' }, { lv: 36, move: 'steel_garden' }, { lv: 39, move: 'executioners_line' },
    { lv: 42, move: 'entropy_pulse' }, { lv: 45, move: 'black_blade' }, { lv: 48, move: 'world_slash' },
    { lv: 50, move: 'finality' }
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
    { lv: 1, move: 'mud_shot' }, { lv: 1, move: 'sand_lance' }, { lv: 4, move: 'boulder_toss' },
    { lv: 7, move: 'desert_rise' }, { lv: 10, move: 'toxic_brand' }, { lv: 12, move: 'deep_root' },
    { lv: 14, move: 'barb_spray' }, { lv: 17, move: 'oil_slick_toss' }, { lv: 20, move: 'venom_road' },
    { lv: 23, move: 'sables' }, { lv: 25, move: 'venom_drain' }, { lv: 26, move: 'armament' },
    { lv: 27, move: 'ashen_brand' }, { lv: 29, move: 'leech_thorns' }, { lv: 32, move: 'corrosive_wave' },
    { lv: 35, move: 'stone_skin' }, { lv: 38, move: 'plague_cloud' }, { lv: 41, move: 'ground_death' },
    { lv: 44, move: 'caltrop_scatter' }, { lv: 46, move: 'continental_press' }, { lv: 48, move: 'venom_crash' },
    { lv: 50, move: 'grand_quake' }
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
    { lv: 1, move: 'quick_strike' }, { lv: 1, move: 'pressure_point' }, { lv: 4, move: 'clutch' },
    { lv: 6, move: 'will_of_iron' }, { lv: 7, move: 'mind_spike' }, { lv: 10, move: 'shambles' },
    { lv: 13, move: 'imbued_strike' }, { lv: 16, move: 'armament' }, { lv: 19, move: 'small_target' },
    { lv: 22, move: 'mind_haze' }, { lv: 25, move: 'heel_drop' }, { lv: 28, move: 'pinning_will' },
    { lv: 31, move: 'zangiri_mochi' }, { lv: 34, move: 'mind_relay' }, { lv: 37, move: 'conquerors_haki' },
    { lv: 40, move: 'haki_pierce' }, { lv: 43, move: 'mind_break' }, { lv: 45, move: 'black_gauntlet' },
    { lv: 47, move: 'sovereign_flash' }, { lv: 50, move: 'divine_departure' }
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
    { lv: 1, move: 'imbued_strike' }, { lv: 1, move: 'savage_bite' }, { lv: 4, move: 'iron_body' },
    { lv: 6, move: 'grit' }, { lv: 9, move: 'pack_hunt' }, { lv: 12, move: 'territorial_growl' },
    { lv: 15, move: 'wild_pulse' }, { lv: 18, move: 'armament' }, { lv: 21, move: 'hunters_mark' },
    { lv: 24, move: 'full_weight' }, { lv: 26, move: 'ashen_brand' }, { lv: 27, move: 'crushing_stomp' },
    { lv: 30, move: 'conquerors_haki' }, { lv: 33, move: 'beast_kings_roar' }, { lv: 36, move: 'will_of_iron' },
    { lv: 39, move: 'bolo_breath' }, { lv: 42, move: 'black_gauntlet' }, { lv: 45, move: 'raimei_hakke' },
    { lv: 47, move: 'rampage' }, { lv: 49, move: 'divine_departure' }, { lv: 50, move: 'haki_pierce' }
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
    { lv: 1, move: 'quick_strike' }, { lv: 1, move: 'hair_trigger' }, { lv: 4, move: 'sogeking_shot' },
    { lv: 7, move: 'oil_slick_toss' }, { lv: 10, move: 'caltrop_scatter' }, { lv: 13, move: 'toxic_barbs' },
    { lv: 16, move: 'mud_shot' }, { lv: 19, move: 'rivet_cannon' }, { lv: 22, move: 'shrapnel_burst' },
    { lv: 24, move: 'toxic_brand' }, { lv: 25, move: 'barb_spray' }, { lv: 28, move: 'tracking_round' },
    { lv: 31, move: 'scrap_launch' }, { lv: 34, move: 'venom_road' }, { lv: 37, move: 'pop_green_barbs' },
    { lv: 40, move: 'leech_thorns' }, { lv: 43, move: 'screech_bomb' }, { lv: 45, move: 'overdrive_cannon' },
    { lv: 46, move: 'brace' }, { lv: 48, move: 'plague_cloud' }, { lv: 49, move: 'venom_crash' },
    { lv: 50, move: 'toxic_barbs' }
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
    { lv: 1, move: 'shockwave_palm' }, { lv: 1, move: 'gear_strike' }, { lv: 4, move: 'hair_trigger' },
    { lv: 6, move: 'seismic_throw' }, { lv: 7, move: 'iron_body' }, { lv: 10, move: 'rivet_cannon' },
    { lv: 13, move: 'scrap_sweep' }, { lv: 16, move: 'caltrop_scatter' }, { lv: 19, move: 'iron_wall' },
    { lv: 20, move: 'oil_slick_toss' }, { lv: 22, move: 'pile_driver' }, { lv: 24, move: 'toxic_brand' },
    { lv: 25, move: 'steel_meteor' }, { lv: 28, move: 'shrapnel_burst' }, { lv: 31, move: 'strong_hammer' },
    { lv: 34, move: 'tracking_round' }, { lv: 37, move: 'brace' }, { lv: 40, move: 'radical_beam' },
    { lv: 43, move: 'general_franky_shield' }, { lv: 46, move: 'coup_de_vent' }, { lv: 47, move: 'heel_drop' },
    { lv: 49, move: 'overdrive_cannon' }
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
    { lv: 1, move: 'resonance_lance' }, { lv: 1, move: 'draw_cut' }, { lv: 4, move: 'echo_volley' },
    { lv: 6, move: 'jeer' }, { lv: 7, move: 'lullaby' }, { lv: 10, move: 'soul_leech' },
    { lv: 13, move: 'sonic_wail' }, { lv: 16, move: 'battle_hymn' }, { lv: 19, move: 'soul_relay' },
    { lv: 22, move: 'flying_slash' }, { lv: 24, move: 'toxic_brand' }, { lv: 25, move: 'bone_shards' },
    { lv: 28, move: 'taiko_strike' }, { lv: 31, move: 'nemuriuta_flanc' }, { lv: 34, move: 'soul_solid' },
    { lv: 37, move: 'parting_note' }, { lv: 40, move: 'bitter_refrain' }, { lv: 42, move: 'spirit_double' },
    { lv: 43, move: 'soul_parade' }, { lv: 45, move: 'screech_bomb' }, { lv: 47, move: 'dirge' },
    { lv: 49, move: 'final_requiem' }, { lv: 50, move: 'soul_offering' }
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
    { lv: 1, move: 'savage_bite' }, { lv: 1, move: 'pack_hunt' }, { lv: 4, move: 'second_wind' },
    { lv: 6, move: 'small_target' }, { lv: 7, move: 'frost_step' }, { lv: 9, move: 'numbing_mist' },
    { lv: 12, move: 'frostbite' }, { lv: 15, move: 'stone_skin' }, { lv: 18, move: 'rime_fist' },
    { lv: 21, move: 'wild_pulse' }, { lv: 23, move: 'toxic_brand' }, { lv: 24, move: 'hardening_strike' },
    { lv: 26, move: 'glacier_beam' }, { lv: 27, move: 'shatter_volley' }, { lv: 30, move: 'venom_fang' },
    { lv: 31, move: 'shard_field' }, { lv: 33, move: 'frost_veil' }, { lv: 36, move: 'rumble_ball' },
    { lv: 38, move: 'ice_age' }, { lv: 39, move: 'kokutei_cross' }, { lv: 41, move: 'leech_thorns' },
    { lv: 42, move: 'avalanche_drop' }, { lv: 44, move: 'absolute_zero' }, { lv: 45, move: 'monster_slam' },
    { lv: 47, move: 'full_weight' }, { lv: 49, move: 'rampage' }, { lv: 50, move: 'monster_point' }
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
    { lv: 1, move: 'shadow_clutch' }, { lv: 1, move: 'mind_spike' }, { lv: 4, move: 'void_lance' },
    { lv: 7, move: 'mind_haze' }, { lv: 10, move: 'nightmare_grip' }, { lv: 13, move: 'shadow_stitch' },
    { lv: 16, move: 'pressure_point' }, { lv: 19, move: 'second_guess' }, { lv: 22, move: 'mind_relay' },
    { lv: 24, move: 'toxic_brand' }, { lv: 25, move: 'encore_command' }, { lv: 28, move: 'small_target' },
    { lv: 31, move: 'entropy_pulse' }, { lv: 34, move: 'umbral_claw' }, { lv: 37, move: 'phase_lance' },
    { lv: 40, move: 'nullify' }, { lv: 43, move: 'mind_break' }, { lv: 45, move: 'oblivion_rend' },
    { lv: 47, move: 'event_horizon' }, { lv: 49, move: 'finality' }, { lv: 50, move: 'mirror_seal' }
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
    { lv: 1, move: 'radiant_palm' }, { lv: 1, move: 'photon_dart' }, { lv: 4, move: 'blinding_flash' },
    { lv: 7, move: 'mind_haze' }, { lv: 10, move: 'flash_relay' }, { lv: 13, move: 'mind_spike' },
    { lv: 16, move: 'light_wall' }, { lv: 19, move: 'tempest_kick' }, { lv: 22, move: 'small_target' },
    { lv: 24, move: 'nightmare_grip' }, { lv: 25, move: 'yasakani' }, { lv: 26, move: 'ashen_brand' },
    { lv: 28, move: 'heavens_ray' }, { lv: 31, move: 'second_guess' }, { lv: 34, move: 'aurora_veil' },
    { lv: 37, move: 'pressure_point' }, { lv: 40, move: 'daybreak' }, { lv: 42, move: 'sleep_mist' },
    { lv: 43, move: 'mind_break' }, { lv: 45, move: 'sunburst_lance' }, { lv: 47, move: 'mind_relay' },
    { lv: 50, move: 'entropy_pulse' }
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
    { lv: 1, move: 'feather_step' }, { lv: 1, move: 'quick_strike' }, { lv: 4, move: 'clearing_gust' },
    { lv: 7, move: 'tempest_kick' }, { lv: 10, move: 'slicing_gale' }, { lv: 13, move: 'gear_strike' },
    { lv: 16, move: 'iron_body' }, { lv: 19, move: 'gale_exit' }, { lv: 22, move: 'tracking_round' },
    { lv: 24, move: 'toxic_brand' }, { lv: 25, move: 'armament' }, { lv: 28, move: 'updraft' },
    { lv: 31, move: 'sea_fog' }, { lv: 34, move: 'cyclone_press' }, { lv: 37, move: 'tailwind_call' },
    { lv: 40, move: 'steel_meteor' }, { lv: 43, move: 'heavens_gust' }, { lv: 45, move: 'pile_driver' },
    { lv: 47, move: 'haki_pierce' }, { lv: 49, move: 'coup_de_vent' }, { lv: 50, move: 'brace' }
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
    { lv: 1, move: 'arc_bolt' }, { lv: 1, move: 'spark_jab' }, { lv: 4, move: 'chain_lightning' },
    { lv: 6, move: 'second_wind' }, { lv: 7, move: 'static_snare' }, { lv: 10, move: 'thunder_kick' },
    { lv: 13, move: 'voltage_surge' }, { lv: 16, move: 'volt_relay' }, { lv: 19, move: 'soul_leech' },
    { lv: 22, move: 'resonance_lance' }, { lv: 25, move: 'thunderbolt_tempo' }, { lv: 28, move: 'spirit_bolt' },
    { lv: 31, move: 'chidori' }, { lv: 34, move: 'overcharge' }, { lv: 37, move: 'soul_reach' },
    { lv: 40, move: 'deep_focus' }, { lv: 43, move: 'heavens_judgement' }, { lv: 45, move: 'ward_of_departed' },
    { lv: 47, move: 'soul_offering' }, { lv: 50, move: 'el_thor' }
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
    { lv: 1, move: 'soul_leech' }, { lv: 1, move: 'savage_bite' }, { lv: 4, move: 'wandering_palm' },
    { lv: 7, move: 'iron_body' }, { lv: 10, move: 'soul_reach' }, { lv: 13, move: 'territorial_growl' },
    { lv: 16, move: 'pack_hunt' }, { lv: 19, move: 'sleep_mist' }, { lv: 22, move: 'armament' },
    { lv: 25, move: 'conquerors_haki' }, { lv: 26, move: 'ashen_brand' }, { lv: 28, move: 'full_weight' },
    { lv: 31, move: 'bone_shards' }, { lv: 34, move: 'abyssal_maw' }, { lv: 37, move: 'spirit_bolt' },
    { lv: 40, move: 'bolo_breath' }, { lv: 43, move: 'ward_of_departed' }, { lv: 45, move: 'rampage' },
    { lv: 47, move: 'dirge' }, { lv: 49, move: 'final_requiem' }, { lv: 50, move: 'soul_offering' }
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
    { lv: 1, move: 'draw_cut' }, { lv: 1, move: 'imbued_strike' }, { lv: 4, move: 'one_sword_slash' },
    { lv: 6, move: 'grit' }, { lv: 9, move: 'sever_tendon' }, { lv: 12, move: 'armament' },
    { lv: 15, move: 'chasing_edge' }, { lv: 18, move: 'flying_slash' }, { lv: 20, move: 'willbreaker' },
    { lv: 21, move: 'pinning_will' }, { lv: 24, move: 'whetstone_rite' }, { lv: 27, move: 'conquerors_haki' },
    { lv: 30, move: 'sovereign_flash' }, { lv: 33, move: 'haki_pierce' }, { lv: 36, move: 'blade_dance' },
    { lv: 39, move: 'will_of_iron' }, { lv: 42, move: 'black_gauntlet' }, { lv: 45, move: 'kamusari' },
    { lv: 47, move: 'last_will' }, { lv: 49, move: 'divine_departure' }, { lv: 50, move: 'moonlit_reap' }
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
    { lv: 1, move: 'quick_strike' }, { lv: 1, move: 'photon_dart' }, { lv: 4, move: 'radiant_palm' },
    { lv: 6, move: 'seismic_throw' }, { lv: 7, move: 'open_stance' }, { lv: 10, move: 'flash_step' },
    { lv: 13, move: 'hit_and_fade' }, { lv: 16, move: 'grit' }, { lv: 19, move: 'kaioken' },
    { lv: 22, move: 'heel_drop' }, { lv: 25, move: 'instant_transmission' }, { lv: 28, move: 'kamehameha' },
    { lv: 31, move: 'meteor_knuckle' }, { lv: 34, move: 'flash_relay' }, { lv: 37, move: 'yasakani' },
    { lv: 40, move: 'dragon_fist' }, { lv: 43, move: 'super_kamehameha' }, { lv: 45, move: 'heavens_ray' },
    { lv: 47, move: 'sunburst_lance' }, { lv: 50, move: 'annihilation_ray' }
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
    { lv: 1, move: 'draw_cut' }, { lv: 1, move: 'one_sword_slash' }, { lv: 4, move: 'soul_leech' },
    { lv: 6, move: 'chasing_edge' }, { lv: 7, move: 'flying_slash' }, { lv: 10, move: 'grit' },
    { lv: 13, move: 'sever_tendon' }, { lv: 16, move: 'zangetsu_arc' }, { lv: 19, move: 'cut_and_run' },
    { lv: 22, move: 'soul_relay' }, { lv: 25, move: 'whetstone_rite' }, { lv: 28, move: 'soul_reach' },
    { lv: 31, move: 'getsuga_tensho' }, { lv: 34, move: 'moonlit_reap' }, { lv: 37, move: 'spirit_bolt' },
    { lv: 40, move: 'blade_dance' }, { lv: 43, move: 'oblivion_rend' }, { lv: 45, move: 'bone_shards' },
    { lv: 47, move: 'soul_offering' }, { lv: 50, move: 'final_getsuga' }
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
    { lv: 1, move: 'draw_cut' }, { lv: 1, move: 'flash_step' }, { lv: 4, move: 'cut_and_run' },
    { lv: 6, move: 'flying_slash' }, { lv: 7, move: 'chasing_edge' }, { lv: 10, move: 'sever_tendon' },
    { lv: 13, move: 'zangetsu_arc' }, { lv: 16, move: 'void_lance' }, { lv: 19, move: 'getsuga_tensho' },
    { lv: 22, move: 'whetstone_rite' }, { lv: 25, move: 'phase_lance' }, { lv: 28, move: 'blade_dance' },
    { lv: 31, move: 'moonlit_reap' }, { lv: 34, move: 'erasure_fist' }, { lv: 37, move: 'entropy_pulse' },
    { lv: 40, move: 'gran_rey_cero' }, { lv: 43, move: 'oblivion_rend' }, { lv: 45, move: 'event_horizon' },
    { lv: 47, move: 'finality' }, { lv: 49, move: 'final_getsuga' }
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
    { lv: 1, move: 'void_lance' }, { lv: 1, move: 'flash_step' }, { lv: 4, move: 'mind_spike' },
    { lv: 6, move: 'deep_focus' }, { lv: 7, move: 'photon_dart' }, { lv: 10, move: 'nullify' },
    { lv: 13, move: 'mind_relay' }, { lv: 16, move: 'phase_lance' }, { lv: 19, move: 'limitless_blue' },
    { lv: 22, move: 'shambles' }, { lv: 25, move: 'warped_room' }, { lv: 28, move: 'erasure_fist' },
    { lv: 31, move: 'mirror_seal' }, { lv: 34, move: 'cursed_technique_red' }, { lv: 37, move: 'entropy_pulse' },
    { lv: 40, move: 'event_horizon' }, { lv: 43, move: 'mind_break' }, { lv: 45, move: 'hollow_purple' },
    { lv: 47, move: 'finality' }, { lv: 50, move: 'singularity' }
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
    { lv: 1, move: 'draw_cut' }, { lv: 1, move: 'aqua_step' }, { lv: 4, move: 'one_sword_slash' },
    { lv: 6, move: 'slicing_gale' }, { lv: 7, move: 'siphon_wave' }, { lv: 10, move: 'water_wheel' },
    { lv: 13, move: 'cut_and_run' }, { lv: 16, move: 'whetstone_rite' }, { lv: 19, move: 'shark_bite' },
    { lv: 22, move: 'sever_tendon' }, { lv: 25, move: 'flying_slash' }, { lv: 28, move: 'blade_dance' },
    { lv: 31, move: 'abyss_pressure' }, { lv: 34, move: 'thousand_cuts' }, { lv: 37, move: 'undertow' },
    { lv: 40, move: 'anchor_stance' }, { lv: 43, move: 'constant_flux' }, { lv: 45, move: 'tenfold_tsunami' },
    { lv: 47, move: 'searing_kick' }, { lv: 49, move: 'hinokami_kagura' }
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
    { lv: 1, move: 'feather_step' }, { lv: 1, move: 'quick_strike' }, { lv: 4, move: 'draw_cut' },
    { lv: 6, move: 'updraft' }, { lv: 7, move: 'sever_tendon' }, { lv: 10, move: 'blade_spiral' },
    { lv: 12, move: 'blade_scatter' }, { lv: 13, move: 'tempest_kick' }, { lv: 16, move: 'chasing_edge' },
    { lv: 19, move: 'gale_exit' }, { lv: 22, move: 'vertical_dive' }, { lv: 25, move: 'thousand_cuts' },
    { lv: 28, move: 'odm_burst' }, { lv: 31, move: 'cut_and_run' }, { lv: 34, move: 'slicing_gale' },
    { lv: 37, move: 'thunder_spear' }, { lv: 40, move: 'whetstone_rite' }, { lv: 43, move: 'sky_walk' },
    { lv: 45, move: 'heavens_gust' }, { lv: 47, move: 'blade_dance' }, { lv: 50, move: 'oblivion_rend' }
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
    { lv: 1, move: 'normal_punch' }, { lv: 1, move: 'quick_strike' }, { lv: 4, move: 'consecutive_normal_punches' },
    { lv: 7, move: 'shockwave_palm' }, { lv: 8, move: 'iron_body' }, { lv: 10, move: 'seismic_throw' },
    { lv: 13, move: 'open_stance' }, { lv: 16, move: 'heel_drop' }, { lv: 19, move: 'grit' },
    { lv: 22, move: 'hit_and_fade' }, { lv: 25, move: 'clutch' }, { lv: 28, move: 'grand_quake' },
    { lv: 31, move: 'steel_meteor' }, { lv: 34, move: 'meteor_knuckle' }, { lv: 37, move: 'brace' },
    { lv: 40, move: 'full_weight' }, { lv: 43, move: 'falling_star_fist' }, { lv: 45, move: 'continental_press' },
    { lv: 47, move: 'boulder_toss' }, { lv: 50, move: 'serious_punch' }
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
    { lv: 1, move: 'spark_jab' }, { lv: 1, move: 'quick_strike' }, { lv: 4, move: 'shadow_clutch' },
    { lv: 6, move: 'nightfall_bolt' }, { lv: 7, move: 'thunder_kick' }, { lv: 10, move: 'flash_step' },
    { lv: 13, move: 'chain_lightning' }, { lv: 16, move: 'umbral_claw' }, { lv: 19, move: 'volt_relay' },
    { lv: 22, move: 'shade_slip' }, { lv: 25, move: 'run_down' }, { lv: 28, move: 'shadow_stitch' },
    { lv: 31, move: 'lightning_palm' }, { lv: 34, move: 'yo_yo_crush' }, { lv: 37, move: 'vanishing_act' },
    { lv: 40, move: 'overcharge' }, { lv: 43, move: 'oblivion_rend' }, { lv: 45, move: 'heavens_judgement' },
    { lv: 47, move: 'el_thor' }, { lv: 50, move: 'godspeed' }
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
    { lv: 1, move: 'shockwave_palm' }, { lv: 1, move: 'boulder_toss' }, { lv: 4, move: 'mud_shot' },
    { lv: 6, move: 'scrap_sweep' }, { lv: 9, move: 'stone_skin' }, { lv: 12, move: 'gear_strike' },
    { lv: 15, move: 'automail_hook' }, { lv: 18, move: 'iron_body' }, { lv: 21, move: 'deep_root' },
    { lv: 23, move: 'toxic_brand' }, { lv: 24, move: 'sand_lance' }, { lv: 27, move: 'alchemic_spear' },
    { lv: 30, move: 'iron_wall' }, { lv: 33, move: 'strata_spear' }, { lv: 36, move: 'pile_driver' },
    { lv: 39, move: 'steel_meteor' }, { lv: 42, move: 'grand_quake' }, { lv: 44, move: 'caltrop_scatter' },
    { lv: 46, move: 'shrapnel_burst' }, { lv: 48, move: 'continental_press' }, { lv: 50, move: 'sables' }
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
    { lv: 1, move: 'quick_strike' }, { lv: 1, move: 'gum_gum_pistol' }, { lv: 4, move: 'hit_and_fade' },
    { lv: 6, move: 'grit' }, { lv: 8, move: 'imbued_strike' }, { lv: 12, move: 'heel_drop' },
    { lv: 16, move: 'armament' }, { lv: 20, move: 'open_stance' }, { lv: 24, move: 'seismic_throw' },
    { lv: 26, move: 'ashen_brand' }, { lv: 28, move: 'conquerors_haki' }, { lv: 32, move: 'kong_gun' },
    { lv: 36, move: 'meteor_knuckle' }, { lv: 38, move: 'plus_ultra' }, { lv: 40, move: 'black_gauntlet' },
    { lv: 42, move: 'red_hawk' }, { lv: 44, move: 'haki_pierce' }, { lv: 46, move: 'liberation_bell' },
    { lv: 48, move: 'drums_of_liberation' }, { lv: 49, move: 'divine_departure' }, { lv: 50, move: 'bajrang_gun' }
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

/* ------------------------------------------------------------------ */
/* the default set                                                     */
/* ------------------------------------------------------------------ */
//
// With 20–25 moves in a pool, "the last four it learned" stopped being a
// defensible answer, and "the four with the biggest BP number" was never one:
// it cannot see accuracy, multi-hit, STAB, whether the fighter has the attack
// stat to swing the move, or that a 70 BP pivot buys a free switch. So the
// picker scores moves the way a player would and then builds a set out of the
// scores. It stays pure and deterministic — same fighter, same level, same
// four ids, forever.

/** Engine's real average hit count for a `hits` range (see engine.js). */
function avgHits(h) {
  if (!h) return 1;
  const [lo, hi] = h;
  if (lo === hi) return lo;
  if (lo === 3 && hi === 5) return 3.45;
  if (lo === 2 && hi === 5) return 3.10;
  return 2.65;
}

/** How much of this fighter's offence actually gets behind the move. */
function statFit(f, m) {
  const mine = m.category === 'physical' ? f.base.atk : f.base.spa;
  const mid = (f.base.atk + f.base.spa) / 2;
  return Math.max(0.5, Math.min(1.5, mine / Math.max(1, mid)));
}

/** Expected value of an attacking move for this fighter, in BP-ish units. */
function attackScore(f, m) {
  const acc = m.accuracy == null ? 1 : m.accuracy / 100;
  let v = (m.power || 0) * avgHits(m.hits) * acc;
  if (v === 0) v = 55;                                   // fixed damage / OHKO
  if (f.types.includes(m.type)) v *= 1.3;                // STAB
  v *= statFit(f, m);

  for (const e of m.effects || []) {
    const c = (e.chance ?? 100) / 100;
    if (e.kind === 'status') v += 26 * c;
    else if (e.kind === 'volatile' && (e.value === 'flinch' || e.value === 'confusion')) v += 15 * c;
    else if (e.kind === 'boost') {
      const sum = Object.values(e.stats).reduce((a, b) => a + b, 0);
      const own = e.target === 'self';
      // A one-shot finisher that wrecks the user is still a finisher: cap what
      // the drawback can subtract, or nothing with self-drops is ever chosen.
      v += Math.max(-40, (own ? 11 : 9) * (own ? sum : -sum) * c);
    } else if (['hazard', 'screen', 'weather', 'terrain'].includes(e.kind)) v += 16;
  }
  v += 34 * (m.drain || 0);
  v += 7 * (m.critStage || 0);
  if ((m.priority || 0) > 0) v += 9 * m.priority;
  if ((m.priority || 0) < 0) v += 12 * m.priority;       // moving last is a real cost
  v -= 35 * (m.recoil || 0);
  if (m.flags?.includes('charge')) v -= 20;
  if (m.flags?.includes('recharge')) v -= 20;
  // Five PP is three swings in a long game; the library's biggest numbers all
  // sit there, and taking them every time is how a battler ends in nine turns.
  if (m.pp <= 5) v -= 26; else if (m.pp <= 10) v -= 7;
  if (m.flags?.includes('pursuit')) v += 10;
  if (m.flags?.includes('bypassSub')) v += 6;
  return v;
}

/** Value of a status move to *this* fighter, on the same rough scale/2. */
function utilityScore(f, m) {
  const acc = m.accuracy == null ? 1 : m.accuracy / 100;
  const fast = f.base.spe >= 95;
  let v = 0;
  for (const e of m.effects || []) {
    switch (e.kind) {
      case 'status':                                     // the slow win is a win
        v += ({ tox: 50, slp: 50, par: 46, frz: 44, brn: 46, psn: 34 }[e.value] ?? 40) * acc;
        break;
      case 'hazard': v += 44; break;
      case 'screen': v += 24; break;
      case 'heal': v += 28; break;
      case 'cure': v += 8; break;
      case 'clearHazards': v += 10; break;
      case 'weather': case 'terrain': v += 12; break;
      case 'trickRoom': v += f.base.spe <= 70 ? 18 : -25; break;
      case 'boost': {
        const own = e.target === 'self';
        // Evasion and accuracy stages are worth about half an offensive stage.
        const sum = Object.entries(e.stats)
          .reduce((a, [k, n]) => a + n * (k === 'eva' || k === 'acc' ? 0.5 : 1), 0);
        let b = (own ? 15 : 13) * (own ? sum : -sum) * acc;
        // A boost is only worth it on the stat this fighter actually swings.
        if (own) {
          const key = f.base.atk >= f.base.spa ? 'atk' : 'spa';
          if ((e.stats[key] || 0) > 0 || (e.stats.spe || 0) > 0) b *= 1.25;
          else b *= 0.7;                              // the wrong stat, or only bulk
        }
        v += b;
        break;
      }
      case 'volatile':
        if (e.value === 'protect' || e.value === 'endure') v += 22;
        else if (e.value === 'substitute') v += 20;
        else if (e.value === 'perish') v += 24;
        else if (e.value === 'focusenergy') v += 16;
        else if (e.value === 'leechseed') v += 40 * acc;
        else if (e.value === 'rooted') v -= 40;         // never a default: it traps you
        else if (e.value === 'minimized') v -= 8;        // it doubles every crushing move
        else if (e.value === 'aqua_ring' || e.value === 'magnetrise') v += 12;
        else if (e.value === 'destinybond') v += 10;
        else v += 18 * acc;                              // taunt / disable / encore / torment / yawn
        break;
      case 'custom': v += 14; break;
      default: break;
    }
  }
  if (m.flags?.includes('pivot')) v += 34;
  if (fast && (m.priority || 0) > 0) v += 4;
  return v;
}

/**
 * The level-appropriate default set — what most players will actually battle
 * with, so it has to be the fighter's honest best expression rather than the
 * last four things it learned. Guaranteed at least two ways to deal damage,
 * never more than two status moves, and biased toward covering different types.
 */
export function defaultMoves(id, level = 50) {
  const f = getFighter(id);
  if (!f) return [];
  const learned = [...new Set(f.learnset.filter((l) => l.lv <= level).map((l) => l.move))];
  if (learned.length <= 4) return learned;

  const atk = [], util = [];
  for (const mid of learned) {
    const m = getMove(mid);
    if (!m) continue;
    if (m.category === 'status') util.push({ id: mid, m, s: utilityScore(f, m) });
    else atk.push({ id: mid, m, s: attackScore(f, m) });
  }
  atk.sort((a, b) => b.s - a.s || (a.id < b.id ? -1 : 1));
  util.sort((a, b) => b.s - a.s || (a.id < b.id ? -1 : 1));

  // How many of the four slots are not attacks? One if the fighter owns
  // anything worth a turn; two only for a fighter with a real attrition plan —
  // two ways to bleed you (a status condition, a hazard, a seed) is an
  // archetype, whereas two setup moves is a fighter with no gameplan.
  const bleeds = (o) => (o.m.effects || []).some((e) => e.kind === 'status' || e.kind === 'hazard' ||
    (e.kind === 'volatile' && e.value === 'leechseed'));
  const isPivot = (m) => !!m.flags?.includes('pivot');
  let utilSlots = 0;
  if (util.length && util[0].s >= 24) utilSlots = 1;
  if (utilSlots === 1 && atk.length >= 3) {
    const bleeders = util.filter((u) => bleeds(u) && u.s >= 42);
    // …and only when the third attack it would displace was never the point.
    if (bleeders.length >= 2 && util[1] && util[1].s >= 42 && atk[2].s < 120) utilSlots = 2;
  }
  const wantAtk = Math.min(4 - utilSlots, atk.length);
  utilSlots = Math.min(utilSlots, 4 - Math.max(2, Math.min(2, atk.length)));
  utilSlots = Math.max(0, Math.min(2, 4 - wantAtk));

  const picked = [];
  const seenType = new Set();
  let pivots = 0;                                        // one is momentum, two is indecision
  // First the best thing it has; after that a new attacking type is worth
  // roughly 30 BP of raw power, which is what coverage is actually worth.
  while (picked.length < wantAtk) {
    let best = null, bestV = -Infinity;
    for (const o of atk) {
      if (picked.includes(o.id)) continue;
      if (pivots && isPivot(o.m)) continue;
      // Momentum is worth more than the BP column can express — but the first
      // slot belongs to the fighter's best move, not to its escape hatch.
      const momentum = picked.length && isPivot(o.m) ? 45 : 0;
      const v = o.s + momentum + (picked.length && !seenType.has(o.m.type) ? 30 : 0);
      if (v > bestV) { bestV = v; best = o; }
    }
    if (!best) break;
    seenType.add(best.m.type);
    if (isPivot(best.m)) pivots++;
    picked.push(best.id);
  }

  let statusTaken = 0;
  for (const u of util) {
    if (picked.length >= 4 || statusTaken >= utilSlots) break;
    if (pivots && isPivot(u.m)) continue;
    if (statusTaken === 1 && !bleeds(u)) continue;
    if (isPivot(u.m)) pivots++;
    picked.push(u.id); statusTaken++;
  }
  while (picked.length < 4) {
    const next = atk.find((o) => !picked.includes(o.id)) || util.find((o) => !picked.includes(o.id));
    if (!next) break;
    picked.push(next.id);
  }

  // Restore learn order so the set reads like a progression.
  const order = learned;
  return picked.sort((a, b) => order.indexOf(a) - order.indexOf(b));
}

/**
 * Held items a fighter would actually pick up. Quick battles used to hand out
 * `item: null` and `abilities[0]`, which hid 38 held items and every rare
 * ability behind the team builder. This picks deterministically from the
 * fighter's own id so the same fighter always shows up the same way.
 */
// Roughly a third of the roster carries a locking item, which is about where
// competitive Pokémon sits — and a locked fighter that meets the wrong wall is
// the single most common honest reason to switch. The rest split between
// staying power and damage.
const ITEM_BY_ROLE = {
  physical: ['choice_edge', 'power_band', 'expert_belt', 'leftovers', 'choice_edge', 'war_drum', 'straw_charm', 'log_pose_scarf'],
  special: ['choice_lens', 'focus_lens', 'expert_belt', 'leftovers', 'choice_lens', 'war_drum', 'sitrus_fruit', 'log_pose_scarf'],
  wall: ['leftovers', 'iron_gi', 'sitrus_fruit', 'spiked_guard', 'leftovers', 'straw_charm', 'shell_bell', 'cursed_cutlass'],
  fast: ['log_pose_scarf', 'expert_belt', 'quick_charm', 'choice_edge', 'log_pose_scarf', 'leftovers', 'choice_lens', 'focus_lens']
};

/** Small stable hash so the choice is a property of the fighter, not of a seed. */
function idHash(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

export function defaultItem(id) {
  const f = getFighter(id);
  if (!f) return null;
  const b = f.base;
  const bulk = b.hp + b.def + b.spd;
  const role = bulk >= 320 && b.spe < 90 ? 'wall'
    : b.spe >= 115 ? 'fast'
      : b.atk >= b.spa ? 'physical' : 'special';
  // A Log Pose Scarf on the fastest fighter in the game buys nothing and costs
  // it the lock, so it only goes to something a speed tier short of the top.
  const pool = ITEM_BY_ROLE[role].map((it) =>
    (it === 'log_pose_scarf' && (b.spe > 130 || b.spe < 90)) ? 'expert_belt' : it);
  return pool[idHash(id) % pool.length];
}

/** Every fifth fighter, by a stable hash, shows off its rare ability. */
export function defaultAbility(id) {
  const f = getFighter(id);
  if (!f) return null;
  if (f.abilities.length < 2) return f.abilities[0];
  return (idHash(id + '#ability') % 5 === 0) ? f.abilities[1] : f.abilities[0];
}

export function makeDefaultMember(id, level = 50) {
  const f = getFighter(id);
  return {
    speciesId: id, nickname: f.name, level,
    nature: 'hardy', ability: defaultAbility(id), item: defaultItem(id),
    moves: defaultMoves(id, level)
  };
}
