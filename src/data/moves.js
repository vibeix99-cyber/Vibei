// MoveDef registry. Shape documented in docs/ARCHITECTURE.md §2.2.
// Owned by the move-design agent. Add moves; never renumber or rename ids.

/* ====================================================================
   POWER BUDGET — the contract every attacking move in this file obeys.
   Verified by `tools/movebudget.mjs`; run it after every edit.

   effective power score (EPS)
       BP × avgHits × acc/100                  (acc null counts as 100)
     + 25 × Σ(secondary status chance)
     + 18 × Σ(flinch / confusion chance)
     + 12 × Σ(stat stages moved in the user's favour × chance)
     + 30 × drain fraction
     +  8 × critStage
     + 15 × priority                           (positive priority only)
     + 10   if the move also sets weather / terrain / a hazard / a screen
     − 45 × recoil fraction
     − 22   if it forces a recharge turn
     − 22   if it needs a charge turn
     − 20   if priority ≤ −3
     − 14 × Σ(stat stages the user loses)

   caps, by PP — power is bought with move economy
       PP ≥ 30  → EPS ≤  70
       PP 20–25 → EPS ≤  85
       PP 15    → EPS ≤  95
       PP 10    → EPS ≤ 108
       PP ≤ 5   → EPS ≤ 125

   hard rules
     1. EPS > 95 must carry at least one real drawback: accuracy ≤ 90,
        recoil, recharge, a charge turn, a self stat drop, or PP ≤ 5.
     2. Nothing over 100 BP is both 100% accurate and drawback-free.
     3. Multi-hit BP is scored at the engine's real average
        (2.65 for [2,3], 3.10 for [2,5], 3.45 for [3,5]).
     4. Status moves: no free two-stage boost above 20 PP; every
        foe-targeting status move can miss and is blocked by Protect.
     5. Every type carries a ~60–75 BP reliable option, a ≥90 BP option
        with a real cost, at least one status move, and at least one
        tech move — and at least one move in each of the three categories.

   ROLE LEGEND used in the section headers below
       [low]  cheap / priority   [rel] reliable 60–75   [big] 90+ with a cost
       [st]   status             [tec] tech / archetype
   ==================================================================== */

const M = [];
const def = (o) => {
  M.push({
    power: 0, accuracy: 100, priority: 0, target: 'foe', critStage: 0,
    contact: false, flags: [], hits: null, drain: 0, recoil: 0, effects: null,
    ...o
  });
};

/* ================================================================== */
/* SLASH — reach, crit ratio, and the honest big swing                 */
/* ================================================================== */

def({ id: 'draw_cut', name: 'Draw Cut', type: 'SLASH', category: 'physical', power: 40, accuracy: 100, pp: 30, priority: 1, contact: true, flags: ['slice', 'protect'],
  desc: 'Always goes first.', flavor: 'The blade is back in the scabbard before the sound arrives.',
  fx: { key: 'slash_quick', color: '#dbe4ef', shape: 'arc', scale: 0.85, hitstop: 55, shake: 0.3, sfx: 'slash_light' } });
def({ id: 'one_sword_slash', name: 'Single Blade', type: 'SLASH', category: 'physical', power: 60, accuracy: 100, pp: 30, contact: true, critStage: 1, flags: ['slice', 'protect'],
  desc: 'High critical-hit ratio.', flavor: 'One clean line through the air.',
  fx: { key: 'slash_single', color: '#c9d4e0', shape: 'arc', hitstop: 70, shake: 0.4, sfx: 'slash_light' } });
def({ id: 'sever_tendon', name: 'Tendon Sever', type: 'SLASH', category: 'physical', power: 65, accuracy: 100, pp: 20, contact: true, flags: ['slice', 'protect'],
  effects: [{ kind: 'boost', stats: { spe: -1 }, chance: 30, target: 'foe' }],
  desc: '30% chance to lower the target\'s Speed.', flavor: 'Aimed low, where standing up is decided.',
  fx: { key: 'slash_low', color: '#b8c6d6', shape: 'arc', scale: 1.05, hitstop: 90, shake: 0.5, sfx: 'slash_light' } });
def({ id: 'flying_slash', name: 'Flying Edge', type: 'SLASH', category: 'special', power: 70, accuracy: 100, pp: 15, flags: ['slice', 'protect'],
  desc: 'A compressed air blade launched at range.', flavor: 'The cut arrives before the swordsman.',
  fx: { key: 'slash_projectile', color: '#a8d8ff', shape: 'beam', hitstop: 60, shake: 0.4, sfx: 'slash_air' } });
def({ id: 'thousand_cuts', name: 'Thousand Cuts', type: 'SLASH', category: 'physical', power: 20, accuracy: 95, pp: 20, contact: true, hits: [3, 5], flags: ['slice', 'protect'],
  desc: 'Hits 3–5 times in one turn.', flavor: 'No single wound is worth mentioning. Together they are fatal.',
  fx: { key: 'slash_flurry', color: '#e0e8f2', shape: 'melee', scale: 1.1, hitstop: 45, shake: 0.35, sfx: 'slash_multi' } });
def({ id: 'three_sword_style', name: 'Oni Giri', type: 'SLASH', category: 'physical', power: 95, accuracy: 90, pp: 10, contact: true, critStage: 1, flags: ['slice', 'protect'],
  desc: 'Three blades cross at once. High crit ratio.', flavor: 'Demon slash. Nothing survives the crossing.',
  fx: { key: 'slash_triple', color: '#e8f0ff', shape: 'arc', scale: 1.4, hitstop: 130, shake: 0.9, sfx: 'slash_heavy' } });
def({ id: 'moonlit_reap', name: 'Moonlit Reap', type: 'SLASH', category: 'special', power: 95, accuracy: 90, pp: 10, flags: ['slice', 'protect'],
  effects: [{ kind: 'volatile', value: 'flinch', chance: 20, target: 'foe' }],
  desc: '20% chance to make the target flinch.', flavor: 'A crescent leaves the blade and keeps going.',
  fx: { key: 'slash_moon', color: '#d8e4f2', shape: 'arc', scale: 1.6, hitstop: 145, shake: 1, sfx: 'slash_heavy' } });
def({ id: 'black_blade', name: 'Black Blade', type: 'SLASH', category: 'physical', power: 120, accuracy: 90, pp: 5, contact: true, critStage: 1, flags: ['slice', 'protect'],
  desc: 'A world-splitting downward stroke.', flavor: 'Nothing in the world is unable to be cut.',
  fx: { key: 'slash_worldsplit', color: '#1a1a22', shape: 'arc', scale: 2.2, hitstop: 220, shake: 1.6, sfx: 'slash_world' } });
def({ id: 'executioners_line', name: "Executioner's Line", type: 'SLASH', category: 'physical', power: 0, accuracy: 30, pp: 5, contact: true, flags: ['slice', 'protect'],
  effects: [{ kind: 'custom', value: 'ohko' }],
  desc: 'One-hit KO if it lands. Rarely lands.', flavor: 'Drawn once a year, for one specific neck.',
  fx: { key: 'slash_execute', color: '#8f99a8', shape: 'arc', scale: 1.9, hitstop: 200, shake: 1.4, sfx: 'slash_world' } });
def({ id: 'blade_dance', name: 'Blade Dance', type: 'SLASH', category: 'status', power: 0, accuracy: null, pp: 20, target: 'self', flags: ['dance', 'snatch'],
  effects: [{ kind: 'boost', stats: { atk: 2 }, target: 'self' }],
  desc: 'Sharply raises Attack.', flavor: 'Footwork first. The killing is a detail after that.',
  fx: { key: 'buff_blade', color: '#c9d4e0', shape: 'aura', scale: 1.2, sfx: 'buff' } });
def({ id: 'whetstone_rite', name: 'Whetstone Rite', type: 'SLASH', category: 'status', power: 0, accuracy: null, pp: 20, target: 'self', flags: ['snatch'],
  effects: [{ kind: 'volatile', value: 'focusenergy', target: 'self' }],
  desc: 'Raises the user\'s critical-hit ratio for the battle.', flavor: 'Twelve passes on the stone. Then he stops breathing so hard.',
  fx: { key: 'buff_focus', color: '#eef3f8', shape: 'aura', scale: 1.1, sfx: 'buff' } });
def({ id: 'steel_garden', name: 'Steel Garden', type: 'SLASH', category: 'status', power: 0, accuracy: null, pp: 10, target: 'field',
  effects: [{ kind: 'terrain', value: 'blade' }],
  desc: 'Blade Field for 5 turns. Boosts SLASH moves.', flavor: 'He plants the spares point-down. The ground bristles.',
  fx: { key: 'terrain_blade', color: '#c9d4e0', shape: 'aura', scale: 1.6, sfx: 'weather' } });

/* ================================================================== */
/* FIST — close range, priority, and the cost of swinging that hard    */
/* ================================================================== */

def({ id: 'quick_strike', name: 'Quick Strike', type: 'FIST', category: 'physical', power: 40, accuracy: 100, pp: 30, priority: 1, contact: true, flags: ['protect'],
  desc: 'Always goes first.', flavor: 'Not the best punch he has. The fastest one, though.',
  fx: { key: 'quick', color: '#ffffff', shape: 'melee', hitstop: 60, shake: 0.3, sfx: 'impact_light' } });
def({ id: 'gum_gum_pistol', name: 'Gum-Gum Pistol', type: 'FIST', category: 'physical', power: 55, accuracy: 100, pp: 30, contact: true, flags: ['punch', 'protect'],
  desc: 'A stretched fist snaps out from range.', flavor: 'It goes further than it has any right to.',
  fx: { key: 'stretch_punch', color: '#e8743b', shape: 'beam', hitstop: 80, shake: 0.5, sfx: 'impact_light' } });
def({ id: 'shockwave_palm', name: 'Shockwave Palm', type: 'FIST', category: 'special', power: 70, accuracy: 100, pp: 15, flags: ['protect'],
  effects: [{ kind: 'boost', stats: { def: -1 }, chance: 20, target: 'foe' }],
  desc: '20% chance to lower the target\'s Defense.', flavor: 'The palm stops an inch out. The ribs do not know that.',
  fx: { key: 'palm_wave', color: '#f0925c', shape: 'beam', scale: 1.1, hitstop: 95, shake: 0.6, sfx: 'hit_fist' } });
def({ id: 'clutch', name: 'Clutch', type: 'FIST', category: 'physical', power: 75, accuracy: 100, pp: 15, contact: true, flags: ['protect'],
  effects: [{ kind: 'boost', stats: { def: -1 }, chance: 50, target: 'foe' }],
  desc: 'A joint lock. 50% chance to lower Defense.', flavor: 'Seis Fleur.',
  fx: { key: 'grapple', color: '#e05c9e', shape: 'melee', hitstop: 110, shake: 0.7, sfx: 'impact_med' } });
def({ id: 'gum_gum_gatling', name: 'Gum-Gum Gatling', type: 'FIST', category: 'physical', power: 25, accuracy: 90, pp: 15, contact: true, hits: [3, 5], flags: ['punch', 'protect'],
  desc: 'Hits 3–5 times in one turn.', flavor: 'A wall of fists. Blocking one accomplishes nothing.',
  fx: { key: 'flurry_punch', color: '#ff8a4c', shape: 'melee', hitstop: 45, shake: 0.35, sfx: 'impact_tap' } });
def({ id: 'seismic_throw', name: 'Seismic Throw', type: 'FIST', category: 'physical', power: 0, accuracy: 100, pp: 20, contact: true, flags: ['protect'],
  effects: [{ kind: 'custom', value: 'seismic' }],
  desc: 'Deals damage equal to the user\'s level.', flavor: 'One rotation, one horizon, one landing. Physics does the rest.',
  fx: { key: 'throw_spin', color: '#e8743b', shape: 'melee', scale: 1.3, hitstop: 120, shake: 0.9, sfx: 'impact_med' } });
def({ id: 'meteor_knuckle', name: 'Meteor Knuckle', type: 'FIST', category: 'physical', power: 120, accuracy: 85, pp: 5, contact: true, recoil: 0.33, flags: ['punch', 'protect'],
  desc: 'User takes 33% recoil.', flavor: 'He does not plan to use that arm again this week.',
  fx: { key: 'meteor_punch', color: '#ff7a3c', shape: 'melee', scale: 1.9, hitstop: 200, shake: 1.5, sfx: 'impact_heavy' } });
def({ id: 'falling_star_fist', name: 'Falling Star Fist', type: 'FIST', category: 'physical', power: 140, accuracy: 90, pp: 5, contact: true, flags: ['punch', 'charge', 'protect'],
  chargeText: 'A shadow falls across the arena…',
  desc: 'Charges one turn, strikes the next.', flavor: 'He goes up. Nothing about that is reassuring.',
  fx: { key: 'star_drop', color: '#ffb56b', shape: 'melee', scale: 2.2, hitstop: 240, shake: 1.8, sfx: 'impact_world' } });
def({ id: 'open_stance', name: 'Open Stance', type: 'FIST', category: 'status', power: 0, accuracy: null, pp: 15, target: 'self', flags: ['snatch'],
  effects: [{ kind: 'boost', stats: { atk: 2, def: -1 }, target: 'self' }],
  desc: 'Sharply raises Attack, lowers Defense.', flavor: 'Guard down, weight forward. An argument, not a defence.',
  fx: { key: 'buff_stance', color: '#e8743b', shape: 'aura', scale: 1.2, sfx: 'buff' } });
def({ id: 'grit', name: 'Grit', type: 'FIST', category: 'status', power: 0, accuracy: null, pp: 10, target: 'self', priority: 4,
  effects: [{ kind: 'volatile', value: 'endure', target: 'self' }],
  desc: 'Survives any hit this turn with 1 HP.', flavor: 'He decides he is not finished. The body files an objection.',
  fx: { key: 'endure', color: '#d0704a', shape: 'aura', scale: 1.1, sfx: 'shield' } });

/* ================================================================== */
/* HAKI — the answer to intangibles; costly, deliberate, heavy         */
/* ================================================================== */

def({ id: 'imbued_strike', name: 'Imbued Strike', type: 'HAKI', category: 'physical', power: 70, accuracy: 100, pp: 20, contact: true, flags: ['protect'],
  desc: 'A hardened blow that lands on anything.', flavor: 'Black to the wrist. Ghosts are just people who forgot to bleed.',
  fx: { key: 'haki_strike', color: '#2b2d42', shape: 'melee', scale: 1.1, hitstop: 95, shake: 0.6, sfx: 'hit_haki' } });
def({ id: 'sovereign_flash', name: 'Sovereign Flash', type: 'HAKI', category: 'special', power: 95, accuracy: 95, pp: 10, flags: ['protect'],
  effects: [{ kind: 'volatile', value: 'flinch', chance: 20, target: 'foe' }],
  desc: '20% chance to make the target flinch.', flavor: 'Eye contact, briefly, at range. Enough.',
  fx: { key: 'haki_flash', color: '#4a3fd0', shape: 'burst', scale: 1.5, hitstop: 140, shake: 1, sfx: 'conqueror' } });
def({ id: 'black_gauntlet', name: 'Black Gauntlet', type: 'HAKI', category: 'physical', power: 100, accuracy: 95, pp: 10, contact: true, flags: ['punch', 'protect'],
  effects: [{ kind: 'boost', stats: { def: -1 }, target: 'self' }],
  desc: 'Lowers the user\'s Defense after use.', flavor: 'Everything he has goes forward. Nothing is left facing back.',
  fx: { key: 'haki_gauntlet', color: '#1d1f30', shape: 'melee', scale: 1.6, hitstop: 165, shake: 1.2, sfx: 'haki' } });
def({ id: 'divine_departure', name: 'Divine Departure', type: 'HAKI', category: 'physical', power: 130, accuracy: 90, pp: 5, contact: true, flags: ['punch', 'protect'], recoil: 0.25,
  desc: 'A colossal haki-clad blow. User takes 25% recoil.', flavor: 'The horizon relocates.',
  fx: { key: 'haki_smash', color: '#4a3fd0', shape: 'melee', scale: 2, hitstop: 240, shake: 1.8, sfx: 'impact_world' } });
def({ id: 'armament', name: 'Armament', type: 'HAKI', category: 'status', power: 0, accuracy: null, pp: 15, target: 'self', flags: ['snatch'],
  effects: [{ kind: 'boost', stats: { atk: 1, def: 1 }, target: 'self' }],
  desc: 'Raises Attack and Defense.', flavor: 'Black plates the skin. The intangible becomes hittable.',
  fx: { key: 'haki_coat', color: '#2b2d42', shape: 'aura', sfx: 'haki' } });
def({ id: 'conquerors_haki', name: "Conqueror's Haki", type: 'HAKI', category: 'status', power: 0, accuracy: 100, pp: 5, target: 'foe', flags: ['protect'],
  effects: [{ kind: 'boost', stats: { atk: -1, spa: -1 }, target: 'foe' }, { kind: 'volatile', value: 'flinch', chance: 30, target: 'foe' }],
  desc: 'Lowers the foe\'s Attack and Sp. Atk. May cause flinching.', flavor: 'A room full of people falls down. You did not move.',
  fx: { key: 'conqueror', color: '#7a4fd0', shape: 'burst', scale: 2, hitstop: 200, shake: 1.4, sfx: 'conqueror' } });
def({ id: 'willbreaker', name: 'Willbreaker', type: 'HAKI', category: 'status', power: 0, accuracy: 100, pp: 20, target: 'foe', flags: ['protect', 'reflectable'],
  effects: [{ kind: 'boost', stats: { spa: -2 }, target: 'foe' }],
  desc: 'Sharply lowers the target\'s Sp. Atk.', flavor: 'The technique was never the problem. The conviction was.',
  fx: { key: 'debuff_will', color: '#3b3d5c', shape: 'aura', scale: 1.3, sfx: 'debuff' } });
def({ id: 'will_of_iron', name: 'Will of Iron', type: 'HAKI', category: 'status', power: 0, accuracy: null, pp: 10, target: 'field',
  effects: [{ kind: 'terrain', value: 'haki' }],
  desc: 'Haki Field for 5 turns. Boosts HAKI moves.', flavor: 'The air goes heavy and stays that way.',
  fx: { key: 'terrain_haki', color: '#5a5fd0', shape: 'aura', scale: 1.6, sfx: 'weather' } });
def({ id: 'last_will', name: 'Last Will', type: 'HAKI', category: 'status', power: 0, accuracy: null, pp: 5, target: 'self', priority: 3,
  effects: [{ kind: 'volatile', value: 'destinybond', target: 'self' }],
  desc: 'If the user faints this turn, the attacker faints too.', flavor: 'A grip that outlasts the hand.',
  fx: { key: 'destiny_bond', color: '#2b2d42', shape: 'aura', scale: 1.4, sfx: 'haki' } });

/* ================================================================== */
/* FLAME — burn pressure, recoil, and one enormous liability           */
/* ================================================================== */

def({ id: 'flame_lash', name: 'Flame Lash', type: 'FLAME', category: 'special', power: 65, accuracy: 100, pp: 20, flags: ['protect'],
  effects: [{ kind: 'status', value: 'brn', chance: 20, target: 'foe' }],
  desc: '20% chance to burn.', flavor: 'A whip of fire, kept short so it stays honest.',
  fx: { key: 'flame_whip', color: '#ff7a3c', shape: 'arc', scale: 1.1, hitstop: 85, shake: 0.5, sfx: 'fire_small' } });
def({ id: 'searing_kick', name: 'Searing Kick', type: 'FLAME', category: 'physical', power: 70, accuracy: 100, pp: 20, contact: true, flags: ['protect'],
  effects: [{ kind: 'status', value: 'brn', chance: 10, target: 'foe' }],
  desc: '10% chance to burn.', flavor: 'The sole leaves a print you can read for a week.',
  fx: { key: 'flame_kick_low', color: '#ff6a2c', shape: 'melee', scale: 1.1, hitstop: 95, shake: 0.6, sfx: 'hit_flame' } });
def({ id: 'diable_jambe', name: 'Diable Jambe', type: 'FLAME', category: 'physical', power: 90, accuracy: 100, pp: 10, contact: true, flags: ['protect'],
  effects: [{ kind: 'status', value: 'brn', chance: 20, target: 'foe' }],
  desc: 'A red-hot spinning kick. 20% burn.', flavor: 'Spin fast enough and the leg forgets it is meat.',
  fx: { key: 'flame_kick', color: '#ff5a1c', shape: 'melee', scale: 1.3, hitstop: 140, shake: 0.9, sfx: 'impact_fire' } });
def({ id: 'fire_fist', name: 'Fire Fist', type: 'FLAME', category: 'special', power: 90, accuracy: 100, pp: 10, flags: ['protect'],
  effects: [{ kind: 'status', value: 'brn', chance: 20, target: 'foe' }],
  desc: 'A column of flame in the shape of a punch. 20% burn.', flavor: 'Hiken.',
  fx: { key: 'fire_column', color: '#ff5a36', shape: 'beam', scale: 1.6, hitstop: 120, shake: 1, sfx: 'fire_big' } });
def({ id: 'red_hawk', name: 'Red Hawk', type: 'FLAME', category: 'physical', power: 100, accuracy: 90, pp: 10, contact: true, flags: ['punch', 'protect'],
  effects: [{ kind: 'status', value: 'brn', chance: 20, target: 'foe' }],
  desc: 'A burning haymaker. 20% burn.', flavor: 'Friction, will, and a promise, in that order.',
  fx: { key: 'flame_punch', color: '#ff4a1c', shape: 'melee', scale: 1.5, hitstop: 160, shake: 1.1, sfx: 'impact_fire' } });
def({ id: 'blaze_rush', name: 'Blaze Rush', type: 'FLAME', category: 'physical', power: 110, accuracy: 100, pp: 10, contact: true, recoil: 0.33, flags: ['protect'],
  effects: [{ kind: 'status', value: 'brn', chance: 10, target: 'foe' }],
  desc: 'User takes 33% recoil. 10% burn.', flavor: 'He crosses the gap as a lit fuse and arrives as the charge.',
  fx: { key: 'flame_charge', color: '#ff5a1c', shape: 'melee', scale: 1.8, hitstop: 185, shake: 1.4, sfx: 'flame_burst' } });
def({ id: 'flare_nova', name: 'Flare Nova', type: 'FLAME', category: 'special', power: 130, accuracy: 90, pp: 5, flags: ['protect'],
  effects: [{ kind: 'boost', stats: { spa: -2 }, target: 'self' }],
  desc: 'Sharply lowers the user\'s Sp. Atk afterwards.', flavor: 'Everything at once. There is no version of this he can repeat.',
  fx: { key: 'fire_nova', color: '#ffb03a', shape: 'burst', scale: 2.1, hitstop: 210, shake: 1.6, sfx: 'fire_big' } });
def({ id: 'phoenix_dive', name: 'Phoenix Dive', type: 'FLAME', category: 'physical', power: 140, accuracy: 90, pp: 5, contact: true, flags: ['charge', 'protect'],
  chargeText: 'Wings of fire open overhead…',
  desc: 'Charges one turn, strikes the next.', flavor: 'It circles once. Then the sky is briefly the wrong colour.',
  fx: { key: 'phoenix', color: '#ff8a2c', shape: 'melee', scale: 2.3, hitstop: 240, shake: 1.8, sfx: 'impact_fire' } });
def({ id: 'flame_commandment', name: 'Flame Commandment', type: 'FLAME', category: 'status', power: 0, accuracy: null, pp: 5, target: 'field',
  effects: [{ kind: 'weather', value: 'sun' }],
  desc: 'Sets Blazing Sun for 5 turns.', flavor: 'The sky agrees with you now.',
  fx: { key: 'weather_sun', color: '#ffb03a', shape: 'aura', sfx: 'weather' } });
// The library had a status move for every major condition except a burn — the
// one thing that answers a physical attacker — so chip never had an on-ramp.
def({ id: 'ashen_brand', name: 'Ashen Brand', type: 'FLAME', category: 'status', power: 0, accuracy: 85, pp: 15, target: 'foe', flags: ['protect', 'reflectable'],
  effects: [{ kind: 'status', value: 'brn', target: 'foe' }],
  desc: 'Burns the target.', flavor: 'A blue light that settles on the shoulder and stays there.',
  fx: { key: 'flame_whip', color: '#ff8a4a', shape: 'aura', scale: 1.2, sfx: 'fire_small' } });
def({ id: 'ember_field', name: 'Ember Field', type: 'FLAME', category: 'status', power: 0, accuracy: null, pp: 10, target: 'field',
  effects: [{ kind: 'terrain', value: 'ember' }],
  desc: 'Ember Field for 5 turns. Boosts FLAME moves.', flavor: 'The floor keeps a memory of the last fight fought on it.',
  fx: { key: 'terrain_ember', color: '#ff7a4a', shape: 'aura', scale: 1.6, sfx: 'weather' } });

/* ================================================================== */
/* FROST — speed control, freeze lottery, chip hazard                  */
/* ================================================================== */

def({ id: 'frost_step', name: 'Frost Step', type: 'FROST', category: 'special', power: 40, accuracy: 100, pp: 25, priority: 1, flags: ['protect'],
  desc: 'Always goes first.', flavor: 'A splinter thrown flat across the ice.',
  fx: { key: 'ice_shard', color: '#bfe8ff', shape: 'beam', scale: 0.9, hitstop: 55, shake: 0.3, sfx: 'ice' } });
def({ id: 'frostbite', name: 'Frostbite', type: 'FROST', category: 'special', power: 65, accuracy: 100, pp: 20, flags: ['protect'],
  effects: [{ kind: 'status', value: 'frz', chance: 10, target: 'foe' }],
  desc: '10% chance to freeze.', flavor: 'It is not the cold. It is how quietly the cold works.',
  fx: { key: 'ice_bite', color: '#9fe0ff', shape: 'beam', scale: 1.05, hitstop: 85, shake: 0.5, sfx: 'hit_frost' } });
def({ id: 'rime_fist', name: 'Rime Fist', type: 'FROST', category: 'physical', power: 70, accuracy: 100, pp: 20, contact: true, flags: ['punch', 'protect'],
  effects: [{ kind: 'boost', stats: { spe: -1 }, chance: 20, target: 'foe' }],
  desc: '20% chance to lower the target\'s Speed.', flavor: 'The knuckles come away white and stay that way.',
  fx: { key: 'ice_punch', color: '#8fd8ff', shape: 'melee', scale: 1.1, hitstop: 100, shake: 0.6, sfx: 'hit_frost' } });
def({ id: 'glacier_beam', name: 'Glacier Beam', type: 'FROST', category: 'special', power: 90, accuracy: 100, pp: 10, flags: ['protect'],
  effects: [{ kind: 'status', value: 'frz', chance: 10, target: 'foe' }],
  desc: '10% chance to freeze.', flavor: 'A straight line drawn in a temperature.',
  fx: { key: 'ice_beam', color: '#7fd8ff', shape: 'beam', scale: 1.5, hitstop: 125, shake: 0.9, sfx: 'ice' } });
def({ id: 'ice_age', name: 'Ice Age', type: 'FROST', category: 'special', power: 90, accuracy: 90, pp: 10, flags: ['protect'],
  effects: [{ kind: 'status', value: 'frz', chance: 15, target: 'foe' }],
  desc: 'Freezes the sea itself. 15% freeze.', flavor: 'The ocean stops mid-wave and stays that way.',
  fx: { key: 'ice_spread', color: '#7fd8ff', shape: 'burst', scale: 1.7, hitstop: 130, shake: 0.9, sfx: 'ice_shatter' } });
def({ id: 'avalanche_drop', name: 'Avalanche', type: 'FROST', category: 'physical', power: 100, accuracy: 90, pp: 10, contact: true, flags: ['protect'],
  effects: [{ kind: 'volatile', value: 'flinch', chance: 10, target: 'foe' }],
  desc: '10% chance to make the target flinch.', flavor: 'A mountain deciding, all at once, to be somewhere lower.',
  fx: { key: 'ice_fall', color: '#cfeeff', shape: 'burst', scale: 1.8, hitstop: 165, shake: 1.3, sfx: 'ice_shatter' } });
def({ id: 'absolute_zero', name: 'Absolute Zero', type: 'FROST', category: 'special', power: 130, accuracy: 85, pp: 5, flags: ['protect'],
  effects: [{ kind: 'status', value: 'frz', chance: 20, target: 'foe' }],
  desc: '20% chance to freeze. Unreliable accuracy.', flavor: 'Nothing moves here, including the argument.',
  fx: { key: 'ice_zero', color: '#e6f7ff', shape: 'burst', scale: 2.2, hitstop: 215, shake: 1.6, sfx: 'freeze' } });
def({ id: 'frost_veil', name: 'Frost Veil', type: 'FROST', category: 'status', power: 0, accuracy: null, pp: 10, target: 'field',
  effects: [{ kind: 'weather', value: 'hail' }],
  desc: 'Summons a blizzard for 5 turns.', flavor: 'She stops apologising for the weather about halfway through.',
  fx: { key: 'weather_hail', color: '#bfe8ff', shape: 'aura', sfx: 'weather' } });
def({ id: 'shard_field', name: 'Shard Field', type: 'FROST', category: 'status', power: 0, accuracy: null, pp: 20, target: 'foeSide',
  effects: [{ kind: 'hazard', value: 'shards', target: 'foeSide' }],
  desc: 'Ice shards hurt foes as they switch in.', flavor: 'Swept into a corner, where feet go.',
  fx: { key: 'hazard_ice', color: '#7fd8ff', shape: 'burst', scale: 1.2, sfx: 'scatter' } });
def({ id: 'numbing_mist', name: 'Numbing Mist', type: 'FROST', category: 'status', power: 0, accuracy: 100, pp: 20, target: 'foe', flags: ['protect', 'reflectable'],
  effects: [{ kind: 'boost', stats: { spe: -2 }, target: 'foe' }],
  desc: 'Sharply lowers the target\'s Speed.', flavor: 'Fingers first, then decisions.',
  fx: { key: 'debuff_cold', color: '#a8e4ff', shape: 'aura', scale: 1.3, sfx: 'debuff' } });

/* ================================================================== */
/* SEA — pressure, regen, and the fog nobody else brings               */
/* ================================================================== */

def({ id: 'aqua_step', name: 'Aqua Step', type: 'SEA', category: 'physical', power: 40, accuracy: 100, pp: 30, priority: 1, contact: true, flags: ['protect'],
  desc: 'Always goes first.', flavor: 'Three strides across water that was not there before.',
  fx: { key: 'water_dash', color: '#4a9fe0', shape: 'melee', scale: 0.9, hitstop: 55, shake: 0.3, sfx: 'hit_sea' } });
def({ id: 'siphon_wave', name: 'Siphon Wave', type: 'SEA', category: 'special', power: 65, accuracy: 100, pp: 15, drain: 0.5, flags: ['pulse', 'protect'],
  desc: 'Drains half the damage dealt.', flavor: 'The tide takes something back on the way out.',
  fx: { key: 'water_drain', color: '#3a8fd8', shape: 'beam', scale: 1.1, hitstop: 90, shake: 0.5, sfx: 'drain' } });
def({ id: 'shark_bite', name: 'Shark Bite', type: 'SEA', category: 'physical', power: 70, accuracy: 100, pp: 20, contact: true, flags: ['bite', 'protect'],
  effects: [{ kind: 'boost', stats: { def: -1 }, chance: 20, target: 'foe' }],
  desc: '20% chance to lower the target\'s Defense.', flavor: 'Teeth arranged for exactly this, and nothing else.',
  fx: { key: 'water_bite', color: '#2a7fd4', shape: 'melee', scale: 1.15, hitstop: 100, shake: 0.6, sfx: 'water_hit' } });
def({ id: 'fishman_karate', name: 'Fish-Man Karate', type: 'SEA', category: 'physical', power: 85, accuracy: 100, pp: 15, contact: true, flags: ['punch', 'protect'],
  desc: 'Strikes the water inside the target.', flavor: 'You are mostly water. That is the whole technique.',
  fx: { key: 'water_shock', color: '#2a7fd4', shape: 'melee', scale: 1.3, hitstop: 120, shake: 0.8, sfx: 'hit_sea' } });
def({ id: 'abyss_pressure', name: 'Abyss Pressure', type: 'SEA', category: 'special', power: 95, accuracy: 90, pp: 10, flags: ['protect'],
  effects: [{ kind: 'boost', stats: { spd: -1 }, chance: 30, target: 'foe' }],
  desc: '30% chance to lower the target\'s Sp. Def.', flavor: 'Eleven kilometres of water, delivered locally.',
  fx: { key: 'water_crush', color: '#1c5fa8', shape: 'burst', scale: 1.6, hitstop: 150, shake: 1.1, sfx: 'whirlpool' } });
def({ id: 'tenfold_tsunami', name: 'Tenfold Tsunami', type: 'SEA', category: 'special', power: 110, accuracy: 85, pp: 5, flags: ['protect'],
  desc: 'Enormous, and hard to aim.', flavor: 'Ten waves stacked into one, which is not how waves work.',
  fx: { key: 'water_wall', color: '#2a7fd4', shape: 'burst', scale: 2.1, hitstop: 190, shake: 1.5, sfx: 'wave' } });
def({ id: 'tidal_call', name: 'Tidal Call', type: 'SEA', category: 'status', power: 0, accuracy: null, pp: 5, target: 'field',
  effects: [{ kind: 'weather', value: 'rain' }],
  desc: 'Sets a Squall for 5 turns.', flavor: 'Asked politely, once. The sea is not known for saying no.',
  fx: { key: 'weather_rain', color: '#4a9fe0', shape: 'aura', sfx: 'weather' } });
def({ id: 'sea_fog', name: 'Sea Fog', type: 'SEA', category: 'status', power: 0, accuracy: null, pp: 10, target: 'field',
  effects: [{ kind: 'weather', value: 'fog' }],
  desc: 'Sea fog lowers every move\'s accuracy for 5 turns.', flavor: 'Both crews start shouting position. Neither believes the other.',
  fx: { key: 'weather_fog', color: '#9fb3c8', shape: 'aura', scale: 1.5, sfx: 'weather' } });
def({ id: 'sea_veil', name: 'Sea Veil', type: 'SEA', category: 'status', power: 0, accuracy: null, pp: 20, target: 'self', flags: ['snatch'],
  effects: [{ kind: 'volatile', value: 'aqua_ring', target: 'self' }],
  desc: 'Restores a little HP every turn.', flavor: 'A skin of seawater that keeps closing over the cuts.',
  fx: { key: 'aqua_ring', color: '#6fc0f0', shape: 'aura', scale: 1.2, sfx: 'heal' } });
def({ id: 'bubble_ward', name: 'Bubble Ward', type: 'SEA', category: 'status', power: 0, accuracy: null, pp: 20, target: 'allySide',
  effects: [{ kind: 'screen', value: 'mist', target: 'allySide' }],
  desc: 'Blocks stat drops on your side for 5 turns.', flavor: 'Coated in resin bubble. Insults slide off it too.',
  fx: { key: 'screen_mist', color: '#a8dcf5', shape: 'aura', scale: 1.4, sfx: 'bubble' } });

/* ================================================================== */
/* STORM — paralysis pressure, multi-hit, and a 70% accuracy monster   */
/* ================================================================== */

def({ id: 'spark_jab', name: 'Spark Jab', type: 'STORM', category: 'physical', power: 40, accuracy: 100, pp: 30, priority: 1, contact: true, flags: ['punch', 'protect'],
  desc: 'Always goes first.', flavor: 'Static hops the gap before the fist does.',
  fx: { key: 'spark', color: '#ffe58a', shape: 'melee', scale: 0.9, hitstop: 55, shake: 0.3, sfx: 'zap' } });
def({ id: 'arc_bolt', name: 'Arc Bolt', type: 'STORM', category: 'special', power: 65, accuracy: 100, pp: 20, flags: ['protect'],
  effects: [{ kind: 'status', value: 'par', chance: 20, target: 'foe' }],
  desc: '20% chance to paralyze.', flavor: 'It picks the shortest route, which is rarely the polite one.',
  fx: { key: 'arc', color: '#f5c542', shape: 'beam', scale: 1.05, hitstop: 85, shake: 0.5, sfx: 'zap' } });
def({ id: 'thunder_kick', name: 'Thunder Kick', type: 'STORM', category: 'physical', power: 70, accuracy: 100, pp: 20, contact: true, flags: ['protect'],
  effects: [{ kind: 'status', value: 'par', chance: 20, target: 'foe' }],
  desc: '20% chance to paralyze.', flavor: 'The heel lands and the arm on the far side goes numb.',
  fx: { key: 'volt_kick', color: '#ffd84a', shape: 'melee', scale: 1.1, hitstop: 100, shake: 0.6, sfx: 'hit_storm' } });
def({ id: 'chain_lightning', name: 'Chain Lightning', type: 'STORM', category: 'special', power: 25, accuracy: 95, pp: 15, hits: [2, 5], flags: ['protect'],
  desc: 'Hits 2–5 times in one turn.', flavor: 'It keeps finding a next-shortest route.',
  fx: { key: 'chain_volt', color: '#fff3a0', shape: 'beam', scale: 1.05, hitstop: 45, shake: 0.35, sfx: 'zap' } });
def({ id: 'thunderbolt_tempo', name: 'Thunderbolt Tempo', type: 'STORM', category: 'special', power: 90, accuracy: 100, pp: 10, flags: ['protect'],
  effects: [{ kind: 'status', value: 'par', chance: 20, target: 'foe' }],
  desc: 'Calls lightning down. 20% paralysis.', flavor: 'The weather is a weapon if you read the manual.',
  fx: { key: 'lightning', color: '#f5c542', shape: 'beam', scale: 1.5, hitstop: 110, shake: 1, sfx: 'thunder' } });
def({ id: 'overcharge', name: 'Overcharge', type: 'STORM', category: 'physical', power: 110, accuracy: 100, pp: 10, contact: true, recoil: 0.33, flags: ['protect'],
  desc: 'User takes 33% recoil.', flavor: 'Grounding was the part he skipped.',
  fx: { key: 'volt_rush', color: '#ffe066', shape: 'melee', scale: 1.8, hitstop: 180, shake: 1.4, sfx: 'thunder_big' } });
def({ id: 'heavens_judgement', name: "Heaven's Judgement", type: 'STORM', category: 'special', power: 110, accuracy: 70, pp: 10, flags: ['protect'],
  effects: [{ kind: 'status', value: 'par', chance: 30, target: 'foe' }],
  desc: 'Very inaccurate. 30% paralysis.', flavor: 'Aimed at a person. Delivered to a postcode.',
  fx: { key: 'sky_bolt', color: '#fff3a0', shape: 'beam', scale: 1.9, hitstop: 175, shake: 1.4, sfx: 'thunder_big' } });
def({ id: 'el_thor', name: 'El Thor', type: 'STORM', category: 'special', power: 120, accuracy: 85, pp: 5, flags: ['protect'],
  effects: [{ kind: 'status', value: 'par', chance: 30, target: 'foe' }],
  desc: 'A pillar of judgement. 30% paralysis.', flavor: 'Two hundred million volts of theology.',
  fx: { key: 'lightning_pillar', color: '#fff3a0', shape: 'beam', scale: 2.2, hitstop: 200, shake: 1.6, sfx: 'thunder_big' } });
def({ id: 'static_snare', name: 'Static Snare', type: 'STORM', category: 'status', power: 0, accuracy: 90, pp: 20, target: 'foe', flags: ['protect', 'reflectable'],
  effects: [{ kind: 'status', value: 'par', target: 'foe' }],
  desc: 'Paralyzes the target.', flavor: 'A wire laid across the floor, charged and forgotten.',
  fx: { key: 'para', color: '#f2c744', shape: 'aura', scale: 1.2, sfx: 'paralyze' } });
def({ id: 'voltage_surge', name: 'Voltage Surge', type: 'STORM', category: 'status', power: 0, accuracy: null, pp: 20, target: 'self', flags: ['snatch'],
  effects: [{ kind: 'boost', stats: { spa: 1, spe: 1 }, target: 'self' }],
  desc: 'Raises Sp. Atk and Speed.', flavor: 'The hair goes first. Everything else follows.',
  fx: { key: 'buff_volt', color: '#ffe066', shape: 'aura', scale: 1.2, sfx: 'buff' } });

/* ================================================================== */
/* EARTH — grounded control, sand, and a charge move with real reach   */
/* ================================================================== */

def({ id: 'mud_shot', name: 'Mud Shot', type: 'EARTH', category: 'special', power: 55, accuracy: 95, pp: 20, flags: ['protect'],
  effects: [{ kind: 'boost', stats: { spe: -1 }, target: 'foe' }],
  desc: 'Always lowers the target\'s Speed.', flavor: 'Cheap, rude, and extremely effective on a runner.',
  fx: { key: 'mud', color: '#a07a4a', shape: 'beam', scale: 1, hitstop: 75, shake: 0.4, sfx: 'sand' } });
def({ id: 'boulder_toss', name: 'Boulder Toss', type: 'EARTH', category: 'physical', power: 65, accuracy: 95, pp: 20, flags: ['protect'],
  desc: 'Throws a rock the size of an argument.', flavor: 'Picked up without checking whether it could be.',
  fx: { key: 'rock_throw', color: '#b98b5a', shape: 'arc', scale: 1.1, hitstop: 95, shake: 0.6, sfx: 'rockfall' } });
def({ id: 'sand_lance', name: 'Sand Lance', type: 'EARTH', category: 'special', power: 70, accuracy: 100, pp: 15, flags: ['protect'],
  desc: 'A drilling spear of compacted sand.', flavor: 'Sand, given one instruction and no discretion.',
  fx: { key: 'sand_spear', color: '#c8a165', shape: 'beam', scale: 1.2, hitstop: 95, shake: 0.6, sfx: 'sand' } });
def({ id: 'sables', name: 'Sables', type: 'EARTH', category: 'special', power: 80, accuracy: 100, pp: 10, flags: ['protect'],
  effects: [{ kind: 'weather', value: 'sandstorm', chance: 100 }],
  desc: 'A sand cyclone. Also whips up a sandstorm.', flavor: 'The desert arrives as a guest and stays as a tenant.',
  fx: { key: 'sand_cyclone', color: '#c8a165', shape: 'burst', scale: 1.6, hitstop: 100, shake: 0.9, sfx: 'sand' } });
def({ id: 'grand_quake', name: 'Grand Quake', type: 'EARTH', category: 'physical', power: 95, accuracy: 100, pp: 10, flags: ['protect'],
  desc: 'Shakes the whole arena. WIND types float clear.', flavor: 'One stamp. The floor stops being a floor for a moment.',
  fx: { key: 'quake', color: '#a8804a', shape: 'burst', scale: 1.8, hitstop: 150, shake: 1.5, sfx: 'quake' } });
def({ id: 'continental_press', name: 'Continental Press', type: 'EARTH', category: 'physical', power: 130, accuracy: 85, pp: 5, contact: true, flags: ['crush', 'protect'],
  desc: 'Colossal, hard to place, and doubled on a small target.', flavor: 'Geology, brought forward on the schedule.',
  fx: { key: 'plate_slam', color: '#8f6a3d', shape: 'burst', scale: 2.2, hitstop: 220, shake: 1.8, sfx: 'quake' } });
def({ id: 'strata_spear', name: 'Strata Spear', type: 'EARTH', category: 'special', power: 130, accuracy: 95, pp: 5, flags: ['charge', 'protect'],
  chargeText: 'The ground begins to split and stack…',
  desc: 'Charges one turn, strikes the next.', flavor: 'Every layer under the arena, stood upright in order.',
  fx: { key: 'stone_spire', color: '#b98b5a', shape: 'burst', scale: 2.2, hitstop: 225, shake: 1.7, sfx: 'rockfall' } });
def({ id: 'stone_skin', name: 'Stone Skin', type: 'EARTH', category: 'status', power: 0, accuracy: null, pp: 20, target: 'self', flags: ['snatch'],
  effects: [{ kind: 'boost', stats: { def: 1, spd: 1 }, target: 'self' }],
  desc: 'Raises Defense and Sp. Def.', flavor: 'Dust settles on him as though he had always been there.',
  fx: { key: 'buff_stone', color: '#b98b5a', shape: 'aura', scale: 1.2, sfx: 'buff' } });
def({ id: 'oil_slick_toss', name: 'Oil Slick', type: 'EARTH', category: 'status', power: 0, accuracy: null, pp: 20, target: 'foeSide',
  effects: [{ kind: 'hazard', value: 'oilslick', target: 'foeSide' }],
  desc: 'Foes lose Speed as they switch in.', flavor: 'Poured with the lid held back, so it spreads properly.',
  fx: { key: 'hazard_oil', color: '#3a3a4a', shape: 'burst', scale: 1.3, sfx: 'scatter' } });
def({ id: 'desert_rise', name: 'Desert Rise', type: 'EARTH', category: 'status', power: 0, accuracy: null, pp: 10, target: 'field',
  effects: [{ kind: 'weather', value: 'sandstorm' }],
  desc: 'Sets a sandstorm for 5 turns.', flavor: 'He opens one hand and a province of it comes.',
  fx: { key: 'weather_sand', color: '#c8a165', shape: 'aura', scale: 1.6, sfx: 'weather' } });

/* ================================================================== */
/* WIND — ungrounded, fast, and the type that cleans up hazards        */
/* ================================================================== */

def({ id: 'feather_step', name: 'Feather Step', type: 'WIND', category: 'physical', power: 40, accuracy: 100, pp: 25, priority: 1, contact: true, flags: ['wind', 'protect'],
  desc: 'Always goes first.', flavor: 'Touches down twice on the way over. Neither counts.',
  fx: { key: 'wind_dash', color: '#c7f0d8', shape: 'melee', scale: 0.9, hitstop: 55, shake: 0.3, sfx: 'whoosh' } });
def({ id: 'slicing_gale', name: 'Slicing Gale', type: 'WIND', category: 'special', power: 65, accuracy: 100, pp: 20, critStage: 1, flags: ['wind', 'slice', 'protect'],
  desc: 'High critical-hit ratio.', flavor: 'Wind sharpened by being made to fit through something.',
  fx: { key: 'wind_blade', color: '#a7e8c0', shape: 'arc', scale: 1.1, hitstop: 85, shake: 0.5, sfx: 'slash_air' } });
def({ id: 'tempest_kick', name: 'Tempest Kick', type: 'WIND', category: 'physical', power: 70, accuracy: 100, pp: 20, contact: true, flags: ['wind', 'protect'],
  desc: 'A compressed-air kick that carries.', flavor: 'Rankyaku. Air, cut and then thrown.',
  fx: { key: 'wind_kick', color: '#9fe0bc', shape: 'arc', scale: 1.15, hitstop: 100, shake: 0.6, sfx: 'hit_wind' } });
def({ id: 'cyclone_press', name: 'Cyclone Press', type: 'WIND', category: 'special', power: 100, accuracy: 85, pp: 10, flags: ['wind', 'protect'],
  desc: 'Strong, and it wanders.', flavor: 'A column of moving air with an opinion about your footing.',
  fx: { key: 'cyclone', color: '#8fd8b4', shape: 'burst', scale: 1.8, hitstop: 155, shake: 1.2, sfx: 'tornado' } });
def({ id: 'heavens_gust', name: "Heaven's Gust", type: 'WIND', category: 'special', power: 110, accuracy: 80, pp: 5, flags: ['wind', 'protect'],
  effects: [{ kind: 'volatile', value: 'flinch', chance: 30, target: 'foe' }],
  desc: 'Inaccurate. 30% chance to make the target flinch.', flavor: 'One beat of something much larger than the arena.',
  fx: { key: 'gust_big', color: '#bff0d8', shape: 'burst', scale: 2, hitstop: 180, shake: 1.4, sfx: 'tornado' } });
def({ id: 'sky_walk', name: 'Sky Walk', type: 'WIND', category: 'status', power: 0, accuracy: null, pp: 15, target: 'self', flags: ['snatch'],
  effects: [{ kind: 'boost', stats: { spe: 2 }, target: 'self' }],
  desc: 'Sharply raises Speed.', flavor: 'Kick the air hard enough and it holds.',
  fx: { key: 'buff_speed', color: '#a7e8c0', shape: 'aura', sfx: 'buff' } });
def({ id: 'tailwind_call', name: 'Tailwind', type: 'WIND', category: 'status', power: 0, accuracy: null, pp: 15, target: 'allySide', flags: ['wind'],
  effects: [{ kind: 'screen', value: 'tailwind', target: 'allySide' }],
  desc: 'Doubles your side\'s Speed for 4 turns.', flavor: 'She turns the sail without asking whose fight it is.',
  fx: { key: 'tailwind', color: '#a7e8c0', shape: 'aura', scale: 1.5, sfx: 'gale' } });
def({ id: 'updraft', name: 'Updraft', type: 'WIND', category: 'status', power: 0, accuracy: null, pp: 10, target: 'self', flags: ['snatch'],
  effects: [{ kind: 'volatile', value: 'magnetrise', target: 'self' }],
  desc: 'Floats for 5 turns. Ignores ground hazards.', flavor: 'Feet off the floor, and the floor\'s problems with them.',
  fx: { key: 'levitate', color: '#c7f0d8', shape: 'aura', scale: 1.2, sfx: 'warp' } });
def({ id: 'clearing_gust', name: 'Clearing Gust', type: 'WIND', category: 'status', power: 0, accuracy: null, pp: 15, target: 'self', flags: ['wind'],
  effects: [{ kind: 'clearHazards' }],
  desc: 'Blows away every hazard on your side.', flavor: 'Housekeeping, done at four hundred kilometres an hour.',
  fx: { key: 'defog', color: '#d8f5e6', shape: 'aura', scale: 1.5, sfx: 'gale' } });

/* ================================================================== */
/* SHADOW — drain, sleep setup, and shared misery                      */
/* ================================================================== */

def({ id: 'shadow_clutch', name: 'Shadow Clutch', type: 'SHADOW', category: 'physical', power: 40, accuracy: 100, pp: 25, priority: 1, contact: true, flags: ['protect'],
  desc: 'Always goes first.', flavor: 'It reaches up from underneath, which is not where hands live.',
  fx: { key: 'shade_grab', color: '#5a3d7a', shape: 'melee', scale: 0.9, hitstop: 55, shake: 0.3, sfx: 'hit_shadow' } });
def({ id: 'nightfall_bolt', name: 'Nightfall Bolt', type: 'SHADOW', category: 'special', power: 65, accuracy: 100, pp: 20, flags: ['protect'],
  effects: [{ kind: 'boost', stats: { spd: -1 }, chance: 20, target: 'foe' }],
  desc: '20% chance to lower the target\'s Sp. Def.', flavor: 'A held-back piece of the evening, thrown.',
  fx: { key: 'shade_bolt', color: '#6b4a8f', shape: 'beam', scale: 1.05, hitstop: 85, shake: 0.5, sfx: 'shadow' } });
def({ id: 'umbral_claw', name: 'Umbral Claw', type: 'SHADOW', category: 'physical', power: 70, accuracy: 100, pp: 20, contact: true, flags: ['protect'],
  effects: [{ kind: 'volatile', value: 'flinch', chance: 20, target: 'foe' }],
  desc: '20% chance to make the target flinch.', flavor: 'Four lines that were not on you a second ago.',
  fx: { key: 'shade_claw', color: '#5a3d7a', shape: 'arc', scale: 1.15, hitstop: 100, shake: 0.6, sfx: 'hit_shadow' } });
def({ id: 'shadow_steal', name: 'Shadow Steal', type: 'SHADOW', category: 'special', power: 75, accuracy: 100, pp: 10, drain: 0.5, flags: ['protect'],
  desc: 'Drains half the damage dealt.', flavor: 'Your shadow is on the wrong wall now.',
  fx: { key: 'shadow_drain', color: '#5a3d7a', shape: 'beam', hitstop: 100, shake: 0.6, sfx: 'drain' } });
def({ id: 'abyssal_maw', name: 'Abyssal Maw', type: 'SHADOW', category: 'special', power: 95, accuracy: 90, pp: 10, flags: ['protect'],
  effects: [{ kind: 'volatile', value: 'flinch', chance: 20, target: 'foe' }],
  desc: '20% chance to make the target flinch.', flavor: 'It opens where the floor was and closes politely after.',
  fx: { key: 'shade_maw', color: '#3a2550', shape: 'burst', scale: 1.6, hitstop: 150, shake: 1.1, sfx: 'shadow' } });
def({ id: 'oblivion_rend', name: 'Oblivion Rend', type: 'SHADOW', category: 'physical', power: 120, accuracy: 85, pp: 5, contact: true, recoil: 0.25, flags: ['protect'],
  desc: 'User takes 25% recoil.', flavor: 'He puts his own shadow into it and gets less of it back.',
  fx: { key: 'shade_rend', color: '#4a3060', shape: 'arc', scale: 2, hitstop: 200, shake: 1.5, sfx: 'shadow' } });
def({ id: 'nightmare_grip', name: 'Nightmare Grip', type: 'SHADOW', category: 'status', power: 0, accuracy: 100, pp: 10, target: 'foe', flags: ['protect', 'reflectable'],
  effects: [{ kind: 'volatile', value: 'yawn', target: 'foe' }],
  desc: 'Target falls asleep at the end of next turn.', flavor: 'Nothing happens. That is the first symptom.',
  fx: { key: 'drowse', color: '#6b4a8f', shape: 'aura', scale: 1.2, sfx: 'sleep' } });
def({ id: 'shadow_stitch', name: 'Shadow Stitch', type: 'SHADOW', category: 'status', power: 0, accuracy: 100, pp: 15, target: 'foe', flags: ['protect', 'reflectable'],
  effects: [{ kind: 'volatile', value: 'disable', target: 'foe' }],
  desc: 'Disables the target\'s last used move.', flavor: 'He pins the shadow of a hand and the hand stops arguing.',
  fx: { key: 'disable', color: '#4a3060', shape: 'aura', scale: 1.2, sfx: 'debuff' } });
def({ id: 'shared_agony', name: 'Shared Agony', type: 'SHADOW', category: 'status', power: 0, accuracy: 100, pp: 10, target: 'foe', flags: ['protect'],
  effects: [{ kind: 'custom', value: 'painsplit' }],
  desc: 'Averages the HP of both fighters.', flavor: 'A fair split, which is the cruellest offer he makes all day.',
  fx: { key: 'pain_split', color: '#7a4fa0', shape: 'beam', scale: 1.4, hitstop: 80, shake: 0.5, sfx: 'soul' } });

/* ================================================================== */
/* LIGHT — speed, screens, and one enormous charged lance              */
/* ================================================================== */

def({ id: 'photon_dart', name: 'Photon Dart', type: 'LIGHT', category: 'special', power: 40, accuracy: 100, pp: 30, priority: 1, flags: ['protect'],
  desc: 'Always goes first.', flavor: 'The smallest amount of light that still counts as a decision.',
  fx: { key: 'photon', color: '#fff4c8', shape: 'beam', scale: 0.9, hitstop: 55, shake: 0.3, sfx: 'light' } });
def({ id: 'flash_step', name: 'Flash Step', type: 'LIGHT', category: 'physical', power: 60, accuracy: 100, pp: 5, priority: 2, contact: true, flags: ['protect'],
  desc: 'Strikes before almost anything else.', flavor: 'He is not fast. He simply declines to be in between.',
  fx: { key: 'flash_dash', color: '#ffe9a3', shape: 'melee', scale: 1.2, hitstop: 90, shake: 0.6, sfx: 'hit_light' } });
def({ id: 'radiant_palm', name: 'Radiant Palm', type: 'LIGHT', category: 'physical', power: 70, accuracy: 100, pp: 20, contact: true, flags: ['protect'],
  effects: [{ kind: 'volatile', value: 'flinch', chance: 20, target: 'foe' }],
  desc: '20% chance to make the target flinch.', flavor: 'The hand is bright enough that the block goes to the wrong place.',
  fx: { key: 'light_palm', color: '#ffe9a3', shape: 'melee', scale: 1.15, hitstop: 100, shake: 0.6, sfx: 'hit_light' } });
def({ id: 'yasakani', name: 'Yasakani Sacred Jewel', type: 'LIGHT', category: 'special', power: 100, accuracy: 100, pp: 5, flags: ['protect'],
  desc: 'A barrage of light at lightspeed.', flavor: 'It has already hit you. Twice.',
  fx: { key: 'light_barrage', color: '#ffe9a3', shape: 'beam', scale: 1.7, hitstop: 140, shake: 1, sfx: 'light_beam' } });
def({ id: 'heavens_ray', name: "Heaven's Ray", type: 'LIGHT', category: 'special', power: 110, accuracy: 85, pp: 5, flags: ['protect'],
  effects: [{ kind: 'status', value: 'brn', chance: 10, target: 'foe' }],
  desc: 'Inaccurate. 10% chance to burn.', flavor: 'A hole in the cloud, exactly one person wide.',
  fx: { key: 'light_ray', color: '#fff8dc', shape: 'beam', scale: 2, hitstop: 180, shake: 1.4, sfx: 'light_beam' } });
def({ id: 'sunburst_lance', name: 'Sunburst Lance', type: 'LIGHT', category: 'special', power: 130, accuracy: 100, pp: 5, flags: ['charge', 'protect'],
  chargeText: 'Light gathers into a single point…',
  desc: 'Charges one turn, strikes the next.', flavor: 'A morning\'s worth of sun, spent in one second.',
  fx: { key: 'solar_lance', color: '#fff0b0', shape: 'beam', scale: 2.3, hitstop: 230, shake: 1.7, sfx: 'light_beam' } });
def({ id: 'light_wall', name: 'Light Wall', type: 'LIGHT', category: 'status', power: 0, accuracy: null, pp: 10, target: 'allySide',
  effects: [{ kind: 'screen', value: 'lightwall', target: 'allySide' }],
  desc: 'Halves special damage for 5 turns.', flavor: 'Refraction, held in place by someone with very steady hands.',
  fx: { key: 'screen', color: '#ffe9a3', shape: 'aura', sfx: 'shield' } });
def({ id: 'aurora_veil', name: 'Aurora Veil', type: 'LIGHT', category: 'status', power: 0, accuracy: null, pp: 5, target: 'allySide',
  effects: [{ kind: 'screen', value: 'veil', target: 'allySide' }],
  desc: 'Halves all damage for 5 turns.', flavor: 'Very pretty. Also load-bearing.',
  fx: { key: 'screen_veil', color: '#e0ffd8', shape: 'aura', scale: 1.5, sfx: 'shield' } });
def({ id: 'blinding_flash', name: 'Blinding Flash', type: 'LIGHT', category: 'status', power: 0, accuracy: 100, pp: 20, target: 'foe', flags: ['protect', 'reflectable'],
  effects: [{ kind: 'boost', stats: { acc: -2 }, target: 'foe' }],
  desc: 'Sharply lowers the target\'s accuracy.', flavor: 'Afterimages of the arena, in the wrong order.',
  fx: { key: 'flash', color: '#ffffff', shape: 'burst', scale: 1.4, sfx: 'light' } });
def({ id: 'daybreak', name: 'Daybreak', type: 'LIGHT', category: 'status', power: 0, accuracy: null, pp: 5, target: 'self',
  effects: [{ kind: 'cure', target: 'self' }, { kind: 'heal', frac: 0.5, target: 'self' }],
  desc: 'Cures status and restores half of max HP.', flavor: 'It gets light. Most things are survivable after that.',
  fx: { key: 'dawn', color: '#ffeec0', shape: 'aura', scale: 1.5, sfx: 'heal' } });

/* ================================================================== */
/* BEAST — bite, drain, and a recoil finisher                          */
/* ================================================================== */

def({ id: 'savage_bite', name: 'Savage Bite', type: 'BEAST', category: 'physical', power: 65, accuracy: 100, pp: 20, contact: true, flags: ['bite', 'protect'],
  effects: [{ kind: 'volatile', value: 'flinch', chance: 20, target: 'foe' }],
  desc: '20% chance to make the target flinch.', flavor: 'It does not let go so much as reconsider.',
  fx: { key: 'bite', color: '#8a6b3d', shape: 'melee', scale: 1.1, hitstop: 90, shake: 0.55, sfx: 'hit_beast' } });
def({ id: 'wild_pulse', name: 'Wild Pulse', type: 'BEAST', category: 'special', power: 70, accuracy: 100, pp: 15, flags: ['pulse', 'protect'],
  desc: 'A wave of raw animal presence.', flavor: 'Every hair on the arena floor stands up at once.',
  fx: { key: 'beast_pulse', color: '#a3814c', shape: 'beam', scale: 1.2, hitstop: 95, shake: 0.6, sfx: 'beast_roar' } });
def({ id: 'pack_hunt', name: 'Pack Hunt', type: 'BEAST', category: 'physical', power: 25, accuracy: 95, pp: 20, contact: true, hits: [2, 5], flags: ['protect'],
  desc: 'Hits 2–5 times in one turn.', flavor: 'One of them is a distraction. You will not learn which.',
  fx: { key: 'pack', color: '#8a6b3d', shape: 'melee', scale: 1, hitstop: 45, shake: 0.35, sfx: 'hit_beast' } });
def({ id: 'bloodlust', name: 'Bloodlust', type: 'BEAST', category: 'physical', power: 75, accuracy: 100, pp: 15, contact: true, drain: 0.5, flags: ['bite', 'protect'],
  desc: 'Drains half the damage dealt.', flavor: 'It eats during the fight. That is the disturbing part.',
  fx: { key: 'drain_bite', color: '#a33a3a', shape: 'melee', scale: 1.25, hitstop: 110, shake: 0.7, sfx: 'drain' } });
def({ id: 'beast_kings_roar', name: "Beast King's Roar", type: 'BEAST', category: 'special', power: 100, accuracy: 90, pp: 10, flags: ['sound', 'protect'],
  effects: [{ kind: 'volatile', value: 'flinch', chance: 20, target: 'foe' }],
  desc: '20% chance to make the target flinch.', flavor: 'Somewhere off the island, birds leave.',
  fx: { key: 'roar', color: '#8a6b3d', shape: 'burst', scale: 1.8, hitstop: 160, shake: 1.3, sfx: 'beast_roar' } });
def({ id: 'bolo_breath', name: 'Bolo Breath', type: 'BEAST', category: 'special', power: 110, accuracy: 90, pp: 5, flags: ['protect'],
  effects: [{ kind: 'status', value: 'brn', chance: 20, target: 'foe' }],
  desc: 'A dragon\'s heat ray. 20% burn.', flavor: 'Breath, in the sense that a furnace also breathes.',
  fx: { key: 'dragon_breath', color: '#8a6b3d', shape: 'beam', scale: 1.9, hitstop: 180, shake: 1.3, sfx: 'dragon' } });
def({ id: 'rampage', name: 'Rampage', type: 'BEAST', category: 'physical', power: 120, accuracy: 100, pp: 5, contact: true, recoil: 0.33, flags: ['protect'],
  desc: 'User takes 33% recoil.', flavor: 'It stops when it reaches a wall, and then not immediately.',
  fx: { key: 'charge_slam', color: '#7a5a30', shape: 'melee', scale: 2, hitstop: 205, shake: 1.6, sfx: 'impact_heavy' } });
def({ id: 'blood_frenzy', name: 'Blood Frenzy', type: 'BEAST', category: 'status', power: 0, accuracy: null, pp: 20, target: 'self', flags: ['snatch'],
  effects: [{ kind: 'boost', stats: { atk: 1, spe: 1 }, target: 'self' }],
  desc: 'Raises Attack and Speed.', flavor: 'The pupils go round. Negotiation window closed.',
  fx: { key: 'buff_feral', color: '#a33a3a', shape: 'aura', scale: 1.2, sfx: 'buff' } });
def({ id: 'territorial_growl', name: 'Territorial Growl', type: 'BEAST', category: 'status', power: 0, accuracy: 100, pp: 20, target: 'foe', flags: ['sound', 'protect', 'reflectable'],
  effects: [{ kind: 'boost', stats: { atk: -2 }, target: 'foe' }],
  desc: 'Sharply lowers the target\'s Attack.', flavor: 'A line drawn in a register below hearing.',
  fx: { key: 'growl', color: '#8a6b3d', shape: 'aura', scale: 1.3, sfx: 'beast_roar' } });

/* ================================================================== */
/* MECHA — screens, hazards, the +3 jab, and a cannon that costs a turn */
/* ================================================================== */

def({ id: 'hair_trigger', name: 'Hair Trigger', type: 'MECHA', category: 'physical', power: 45, accuracy: 100, pp: 10, priority: 3, flags: ['bullet', 'protect'],
  desc: 'Almost always strikes first.', flavor: 'The safety was removed some time ago and never discussed.',
  fx: { key: 'quick_shot', color: '#c8d2dc', shape: 'beam', scale: 0.9, hitstop: 60, shake: 0.35, sfx: 'gunshot' } });
def({ id: 'scrap_sweep', name: 'Scrap Sweep', type: 'MECHA', category: 'physical', power: 50, accuracy: 100, pp: 20, contact: true, flags: ['protect'],
  effects: [{ kind: 'clearHazards' }],
  desc: 'Also clears every hazard on your side.', flavor: 'A spin with a bin attached. Deeply unglamorous, always needed.',
  fx: { key: 'spin_sweep', color: '#9aa7b5', shape: 'melee', scale: 1, hitstop: 75, shake: 0.45, sfx: 'mecha_whirr' } });
def({ id: 'rivet_cannon', name: 'Rivet Cannon', type: 'MECHA', category: 'special', power: 65, accuracy: 100, pp: 20, flags: ['bullet', 'protect'],
  effects: [{ kind: 'volatile', value: 'flinch', chance: 20, target: 'foe' }],
  desc: '20% chance to make the target flinch.', flavor: 'Fired at a person, which the manual is clear about.',
  fx: { key: 'rivet', color: '#b0b8c4', shape: 'beam', scale: 1.05, hitstop: 85, shake: 0.5, sfx: 'gunshot' } });
def({ id: 'gear_strike', name: 'Gear Strike', type: 'MECHA', category: 'physical', power: 70, accuracy: 100, pp: 20, contact: true, flags: ['protect'],
  desc: 'A piston-driven straight.', flavor: 'Torque with a fist welded to the end of it.',
  fx: { key: 'piston', color: '#9aa7b5', shape: 'melee', scale: 1.15, hitstop: 100, shake: 0.6, sfx: 'hit_mecha' } });
def({ id: 'steel_meteor', name: 'Steel Meteor', type: 'MECHA', category: 'physical', power: 100, accuracy: 85, pp: 10, contact: true, flags: ['protect'],
  desc: 'Heavy, and awkward to aim.', flavor: 'Half a ton, briefly airborne, entirely committed.',
  fx: { key: 'steel_slam', color: '#8f99a8', shape: 'melee', scale: 1.8, hitstop: 175, shake: 1.4, sfx: 'clang' } });
def({ id: 'coup_de_vent', name: 'Coup de Vent', type: 'MECHA', category: 'special', power: 110, accuracy: 90, pp: 5, flags: ['recharge', 'protect'],
  desc: 'A compressed-air cannon. User must recharge.', flavor: 'SUPER.',
  fx: { key: 'air_cannon', color: '#9aa7b5', shape: 'beam', scale: 1.8, hitstop: 170, shake: 1.3, sfx: 'cannon' } });
def({ id: 'overdrive_cannon', name: 'Overdrive Cannon', type: 'MECHA', category: 'special', power: 130, accuracy: 90, pp: 5, flags: ['bullet', 'protect'],
  effects: [{ kind: 'boost', stats: { spa: -2 }, target: 'self' }],
  desc: 'Sharply lowers the user\'s Sp. Atk afterwards.', flavor: 'The barrel is a consumable. So, arguably, is the gunner.',
  fx: { key: 'overdrive', color: '#c0cad6', shape: 'beam', scale: 2.1, hitstop: 210, shake: 1.6, sfx: 'cannon' } });
def({ id: 'iron_body', name: 'Iron Body', type: 'MECHA', category: 'status', power: 0, accuracy: null, pp: 20, target: 'self', flags: ['snatch'],
  effects: [{ kind: 'boost', stats: { def: 2 }, target: 'self' }],
  desc: 'Sharply raises Defense.', flavor: 'Tense every fibre until steel is the softer option.',
  fx: { key: 'buff_harden', color: '#9aa7b5', shape: 'aura', sfx: 'buff' } });
def({ id: 'iron_wall', name: 'Iron Wall', type: 'MECHA', category: 'status', power: 0, accuracy: null, pp: 10, target: 'allySide',
  effects: [{ kind: 'screen', value: 'reflect', target: 'allySide' }],
  desc: 'Halves physical damage for 5 turns.', flavor: 'Bolted down before the bell, as though he knew.',
  fx: { key: 'screen', color: '#9aa7b5', shape: 'aura', sfx: 'shield' } });
def({ id: 'brace', name: 'Brace', type: 'MECHA', category: 'status', power: 0, accuracy: null, pp: 10, target: 'self', priority: 4,
  effects: [{ kind: 'volatile', value: 'protect', target: 'self' }],
  desc: 'Protects the user this turn.', flavor: 'Plates overlap. Nothing gets a seam to work with.',
  fx: { key: 'protect', color: '#9aa7b5', shape: 'aura', sfx: 'shield' } });
def({ id: 'caltrop_scatter', name: 'Caltrop Scatter', type: 'MECHA', category: 'status', power: 0, accuracy: null, pp: 20, target: 'foeSide',
  effects: [{ kind: 'hazard', value: 'caltrops', target: 'foeSide' }],
  desc: 'Hurts foes as they switch in. Stacks 3 times.', flavor: 'Whichever way they land, a point is up.',
  fx: { key: 'hazard', color: '#b0b8c4', shape: 'burst', sfx: 'scatter' } });

/* ================================================================== */
/* MIND — the control type: Trick Room, boost theft, Encore            */
/* ================================================================== */

def({ id: 'mind_spike', name: 'Mind Spike', type: 'MIND', category: 'special', power: 65, accuracy: 100, pp: 20, flags: ['protect'],
  effects: [{ kind: 'boost', stats: { spd: -1 }, chance: 20, target: 'foe' }],
  desc: '20% chance to lower the target\'s Sp. Def.', flavor: 'A thought with a point filed onto it.',
  fx: { key: 'psi_spike', color: '#e05c9e', shape: 'beam', scale: 1.05, hitstop: 85, shake: 0.5, sfx: 'psychic' } });
def({ id: 'pressure_point', name: 'Pressure Point', type: 'MIND', category: 'physical', power: 70, accuracy: 100, pp: 20, contact: true, flags: ['protect'],
  effects: [{ kind: 'boost', stats: { def: -1 }, chance: 20, target: 'foe' }],
  desc: '20% chance to lower the target\'s Defense.', flavor: 'Two fingers, placed where the diagram says.',
  fx: { key: 'point_strike', color: '#f07ab0', shape: 'melee', scale: 1.1, hitstop: 100, shake: 0.6, sfx: 'hit_mind' } });
def({ id: 'gamma_knife', name: 'Gamma Knife', type: 'MIND', category: 'special', power: 105, accuracy: 90, pp: 5, critStage: 1, flags: ['protect'],
  desc: 'An internal cut that ignores armour. High crit ratio.', flavor: 'No blood. That is the frightening part.',
  fx: { key: 'internal_cut', color: '#ff5c8a', shape: 'melee', scale: 1.4, hitstop: 180, shake: 1.1, sfx: 'slash_soft' } });
def({ id: 'mind_break', name: 'Mind Break', type: 'MIND', category: 'special', power: 120, accuracy: 85, pp: 5, flags: ['protect'],
  effects: [{ kind: 'boost', stats: { spa: -1 }, target: 'self' }],
  desc: 'Lowers the user\'s Sp. Atk afterwards.', flavor: 'Something goes across in both directions. Only one side planned for it.',
  fx: { key: 'psi_break', color: '#ff4a8a', shape: 'burst', scale: 2, hitstop: 195, shake: 1.5, sfx: 'psychic' } });
def({ id: 'shambles', name: 'Shambles', type: 'MIND', category: 'status', power: 0, accuracy: null, pp: 10, target: 'self', flags: ['snatch'],
  effects: [{ kind: 'boost', stats: { spe: 1, eva: 1 }, target: 'self' }],
  desc: 'Raises Speed and Evasion.', flavor: 'Room. Everything inside it is a suggestion.',
  fx: { key: 'room_swap', color: '#7fd8ff', shape: 'aura', sfx: 'warp' } });
def({ id: 'deep_focus', name: 'Deep Focus', type: 'MIND', category: 'status', power: 0, accuracy: null, pp: 20, target: 'self', flags: ['snatch'],
  effects: [{ kind: 'boost', stats: { spa: 2 }, target: 'self' }],
  desc: 'Sharply raises Sp. Atk.', flavor: 'The crowd is still there. He has simply filed it elsewhere.',
  fx: { key: 'buff_mind', color: '#e05c9e', shape: 'aura', scale: 1.2, sfx: 'buff' } });
def({ id: 'mind_haze', name: 'Mind Haze', type: 'MIND', category: 'status', power: 0, accuracy: 100, pp: 15, target: 'foe', flags: ['protect', 'reflectable'],
  effects: [{ kind: 'volatile', value: 'confusion', target: 'foe' }],
  desc: 'Confuses the target.', flavor: 'The floor is where it was. His confidence in that is gone.',
  fx: { key: 'confuse', color: '#e05c9e', shape: 'aura', sfx: 'confuse' } });
def({ id: 'encore_command', name: 'Encore', type: 'MIND', category: 'status', power: 0, accuracy: 100, pp: 5, target: 'foe', flags: ['protect', 'reflectable'],
  effects: [{ kind: 'volatile', value: 'encore', target: 'foe' }],
  desc: 'Locks the target into its last move for 3 turns.', flavor: 'It was a good move. He would love to see it again. And again.',
  fx: { key: 'encore', color: '#f07ab0', shape: 'aura', scale: 1.3, sfx: 'confuse' } });
def({ id: 'mirror_room', name: 'Mirror Room', type: 'MIND', category: 'status', power: 0, accuracy: 100, pp: 10, target: 'foe', flags: ['protect'],
  effects: [{ kind: 'custom', value: 'swapboosts' }],
  desc: 'Swaps all stat changes with the target.', flavor: 'He offers a trade nobody in the building wanted.',
  fx: { key: 'swap', color: '#7fd8ff', shape: 'aura', scale: 1.4, sfx: 'warp' } });
def({ id: 'warped_room', name: 'Warped Room', type: 'MIND', category: 'status', power: 0, accuracy: null, pp: 5, priority: -7, target: 'field',
  effects: [{ kind: 'trickRoom' }],
  desc: 'For 5 turns, slower fighters move first.', flavor: 'The clock on the wall keeps time. Nothing else agrees to.',
  fx: { key: 'trick_room', color: '#c084fc', shape: 'aura', scale: 1.8, sfx: 'warp' } });
def({ id: 'mind_field', name: 'Cerebral Field', type: 'MIND', category: 'status', power: 0, accuracy: null, pp: 10, target: 'field',
  effects: [{ kind: 'terrain', value: 'psychic' }],
  desc: 'Mind Field for 5 turns. Boosts MIND moves.', flavor: 'The arena starts agreeing with whoever is thinking loudest.',
  fx: { key: 'terrain_mind', color: '#e05c9e', shape: 'aura', scale: 1.6, sfx: 'weather' } });

/* ================================================================== */
/* TOXIN — the long game: barbs, seed, and stacking poison             */
/* ================================================================== */

def({ id: 'venom_fang', name: 'Venom Fang', type: 'TOXIN', category: 'physical', power: 65, accuracy: 100, pp: 20, contact: true, flags: ['bite', 'protect'],
  effects: [{ kind: 'status', value: 'psn', chance: 30, target: 'foe' }],
  desc: '30% chance to poison.', flavor: 'The bite is the delivery note, not the parcel.',
  fx: { key: 'venom_bite', color: '#8bc34a', shape: 'melee', scale: 1.1, hitstop: 90, shake: 0.55, sfx: 'hit_toxin' } });
def({ id: 'corrosive_wave', name: 'Corrosive Wave', type: 'TOXIN', category: 'special', power: 70, accuracy: 100, pp: 20, flags: ['protect'],
  effects: [{ kind: 'boost', stats: { def: -1 }, chance: 20, target: 'foe' }],
  desc: '20% chance to lower the target\'s Defense.', flavor: 'It eats the armour first, on principle.',
  fx: { key: 'acid_wave', color: '#9fd45a', shape: 'burst', scale: 1.15, hitstop: 90, shake: 0.55, sfx: 'sludge' } });
def({ id: 'venom_drain', name: 'Venom Drain', type: 'TOXIN', category: 'special', power: 75, accuracy: 100, pp: 10, drain: 0.5, flags: ['protect'],
  desc: 'Drains half the damage dealt.', flavor: 'What comes back is not clean, but it counts.',
  fx: { key: 'toxin_drain', color: '#7bb03a', shape: 'beam', scale: 1.2, hitstop: 100, shake: 0.6, sfx: 'drain' } });
def({ id: 'venom_road', name: 'Venom Road', type: 'TOXIN', category: 'special', power: 80, accuracy: 100, pp: 10, flags: ['protect'],
  effects: [{ kind: 'status', value: 'psn', chance: 40, target: 'foe' }],
  desc: 'A flood of poison. 40% poison.', flavor: 'It takes the low ground, then all of it.',
  fx: { key: 'poison_flood', color: '#8bc34a', shape: 'burst', scale: 1.4, hitstop: 90, shake: 0.7, sfx: 'sludge' } });
def({ id: 'plague_cloud', name: 'Plague Cloud', type: 'TOXIN', category: 'special', power: 100, accuracy: 85, pp: 10, flags: ['protect'],
  effects: [{ kind: 'status', value: 'psn', chance: 30, target: 'foe' }],
  desc: 'Inaccurate. 30% chance to poison.', flavor: 'It drifts. Aiming is a courtesy it does not extend.',
  fx: { key: 'plague', color: '#7b9c3a', shape: 'burst', scale: 1.8, hitstop: 150, shake: 1.1, sfx: 'poison' } });
def({ id: 'venom_crash', name: 'Venom Crash', type: 'TOXIN', category: 'physical', power: 110, accuracy: 95, pp: 5, contact: true, recoil: 0.25, flags: ['protect'],
  effects: [{ kind: 'status', value: 'psn', chance: 20, target: 'foe' }],
  desc: 'User takes 25% recoil. 20% chance to poison.', flavor: 'He lands in his own puddle and does not seem to mind.',
  fx: { key: 'venom_slam', color: '#6fa02c', shape: 'melee', scale: 1.9, hitstop: 195, shake: 1.5, sfx: 'hit_toxin' } });
def({ id: 'toxic_brand', name: 'Toxic Brand', type: 'TOXIN', category: 'status', power: 0, accuracy: 90, pp: 10, target: 'foe', flags: ['protect', 'reflectable'],
  effects: [{ kind: 'status', value: 'tox', target: 'foe' }],
  desc: 'Badly poisons the target. Damage grows each turn.', flavor: 'A small mark that keeps its own accounts.',
  fx: { key: 'toxic', color: '#7b2fa8', shape: 'aura', sfx: 'sludge' } });
def({ id: 'toxic_barbs', name: 'Toxic Barbs', type: 'TOXIN', category: 'status', power: 0, accuracy: null, pp: 20, target: 'foeSide',
  effects: [{ kind: 'hazard', value: 'barbs', target: 'foeSide' }],
  desc: 'Poisons foes as they switch in. Stacks twice.', flavor: 'Scattered where someone will land in a hurry.',
  fx: { key: 'hazard_toxin', color: '#8bc34a', shape: 'burst', scale: 1.2, sfx: 'scatter' } });
def({ id: 'leech_thorns', name: 'Leech Thorns', type: 'TOXIN', category: 'status', power: 0, accuracy: 90, pp: 10, target: 'foe', flags: ['protect', 'reflectable'],
  effects: [{ kind: 'volatile', value: 'leechseed', target: 'foe' }],
  desc: 'Saps the target\'s HP each turn and heals the user.', flavor: 'It roots in something that is not soil and does not care.',
  fx: { key: 'seed', color: '#6fa02c', shape: 'aura', scale: 1.2, sfx: 'drain' } });

/* ================================================================== */
/* SOUND — never-miss chip, sleep, Taunt, and a screaming recharge nuke */
/* ================================================================== */

def({ id: 'resonance_lance', name: 'Resonance Lance', type: 'SOUND', category: 'special', power: 60, accuracy: null, pp: 20, flags: ['sound', 'protect'],
  desc: 'Never misses.', flavor: 'It does not travel to you. It arrives at the same time as itself.',
  fx: { key: 'resonate', color: '#c084fc', shape: 'beam', scale: 1.05, hitstop: 80, shake: 0.45, sfx: 'sonic' } });
def({ id: 'sonic_wail', name: 'Sonic Wail', type: 'SOUND', category: 'special', power: 70, accuracy: 100, pp: 15, flags: ['sound', 'protect'],
  effects: [{ kind: 'boost', stats: { spa: -1 }, chance: 30, target: 'foe' }],
  desc: '30% chance to lower the target\'s Sp. Atk.', flavor: 'A note nobody in the crowd will admit to hearing.',
  fx: { key: 'sound_wave', color: '#c084fc', shape: 'beam', hitstop: 80, shake: 0.5, sfx: 'sonic' } });
def({ id: 'taiko_strike', name: 'Taiko Strike', type: 'SOUND', category: 'physical', power: 70, accuracy: 100, pp: 20, contact: true, flags: ['sound', 'protect'],
  effects: [{ kind: 'volatile', value: 'flinch', chance: 20, target: 'foe' }],
  desc: '20% chance to make the target flinch.', flavor: 'The beat lands in the chest first and the fist second.',
  fx: { key: 'drum', color: '#b072e8', shape: 'melee', scale: 1.15, hitstop: 100, shake: 0.7, sfx: 'hit_sound' } });
def({ id: 'echo_volley', name: 'Echo Volley', type: 'SOUND', category: 'special', power: 25, accuracy: 100, pp: 15, hits: [2, 5], flags: ['sound', 'protect'],
  desc: 'Hits 2–5 times in one turn.', flavor: 'The first one is the only one she made.',
  fx: { key: 'echo', color: '#c9a0ff', shape: 'beam', scale: 1, hitstop: 45, shake: 0.35, sfx: 'sonic' } });
def({ id: 'screech_bomb', name: 'Screech Bomb', type: 'SOUND', category: 'special', power: 95, accuracy: 90, pp: 10, flags: ['sound', 'bullet', 'protect'],
  effects: [{ kind: 'boost', stats: { spd: -1 }, chance: 30, target: 'foe' }],
  desc: '30% chance to lower the target\'s Sp. Def.', flavor: 'It is thrown, it lands, and then it is very loud.',
  fx: { key: 'screech', color: '#d0a0ff', shape: 'burst', scale: 1.6, hitstop: 145, shake: 1.1, sfx: 'screech' } });
def({ id: 'final_requiem', name: 'Final Requiem', type: 'SOUND', category: 'special', power: 140, accuracy: 90, pp: 5, flags: ['sound', 'recharge', 'protect'],
  desc: 'Enormous. User must recharge next turn.', flavor: 'Written for one performance and no encore.',
  fx: { key: 'requiem', color: '#a06ce0', shape: 'burst', scale: 2.3, hitstop: 235, shake: 1.8, sfx: 'screech' } });
def({ id: 'lullaby', name: 'Lullaby', type: 'SOUND', category: 'status', power: 0, accuracy: 55, pp: 15, target: 'foe', flags: ['sound', 'protect', 'reflectable'],
  effects: [{ kind: 'status', value: 'slp', target: 'foe' }],
  desc: 'Puts the target to sleep. Often misses.', flavor: 'Four bars, badly sung, ruthlessly effective.',
  fx: { key: 'lullaby', color: '#b092e0', shape: 'aura', scale: 1.3, sfx: 'sleep' } });
def({ id: 'jeer', name: 'Jeer', type: 'SOUND', category: 'status', power: 0, accuracy: 100, pp: 20, target: 'foe', flags: ['sound', 'protect', 'reflectable'],
  effects: [{ kind: 'volatile', value: 'taunt', target: 'foe' }],
  desc: 'Target can only use damaging moves for 3 turns.', flavor: 'One sentence, chosen for the specific person.',
  fx: { key: 'taunt', color: '#c084fc', shape: 'aura', scale: 1.2, sfx: 'sonic' } });
def({ id: 'battle_hymn', name: 'Battle Hymn', type: 'SOUND', category: 'status', power: 0, accuracy: null, pp: 15, target: 'self', flags: ['sound', 'snatch'],
  effects: [{ kind: 'boost', stats: { atk: 1, spa: 1 }, target: 'self' }],
  desc: 'Raises Attack and Sp. Atk.', flavor: 'He sings badly and it works anyway, which is the annoying part.',
  fx: { key: 'hymn', color: '#c084fc', shape: 'aura', scale: 1.3, sfx: 'buff' } });

/* ================================================================== */
/* SPIRIT — sustain, Substitute, Safeguard, and a suicidal finisher    */
/* ================================================================== */

def({ id: 'soul_leech', name: 'Soul Leech', type: 'SPIRIT', category: 'special', power: 70, accuracy: 100, pp: 15, drain: 0.5, flags: ['protect'],
  desc: 'Drains half the damage dealt.', flavor: 'A polite withdrawal from an account that was not offered.',
  fx: { key: 'soul_drain', color: '#6fe3d0', shape: 'beam', scale: 1.1, hitstop: 95, shake: 0.55, sfx: 'drain' } });
def({ id: 'wandering_palm', name: 'Wandering Palm', type: 'SPIRIT', category: 'physical', power: 70, accuracy: 100, pp: 20, contact: true, flags: ['protect'],
  effects: [{ kind: 'volatile', value: 'flinch', chance: 20, target: 'foe' }],
  desc: '20% chance to make the target flinch.', flavor: 'The hand passes through the guard and stops inside.',
  fx: { key: 'spirit_palm', color: '#8ff0e0', shape: 'melee', scale: 1.15, hitstop: 100, shake: 0.6, sfx: 'hit_spirit' } });
def({ id: 'soul_solid', name: 'Soul Solid', type: 'SPIRIT', category: 'special', power: 85, accuracy: 100, pp: 10, flags: ['slice', 'sound', 'protect'],
  effects: [{ kind: 'boost', stats: { spd: -1 }, chance: 30, target: 'foe' }],
  desc: 'A chilling note that cuts the soul. May lower Sp. Def.', flavor: 'Yohohoho.',
  fx: { key: 'soul_slash', color: '#6fe3d0', shape: 'arc', hitstop: 100, shake: 0.6, sfx: 'soul' } });
// NOTE: this used to be called `spirit_gun`, which collided with Yusuke's
// signature of the same id in signatureMoves.js — 264 entries, 263 ids. The
// generic version keeps its numbers under a name nobody else has claimed.
def({ id: 'spirit_bolt', name: 'Spirit Bolt', type: 'SPIRIT', category: 'special', power: 110, accuracy: 90, pp: 10, flags: ['bullet', 'protect'],
  desc: 'Powerful, and slightly unreliable.', flavor: 'One finger, pointed. The rest is willpower and regret.',
  fx: { key: 'spirit_shot', color: '#7fe0ff', shape: 'beam', scale: 1.9, hitstop: 175, shake: 1.3, sfx: 'spirit' } });
def({ id: 'soul_offering', name: 'Soul Offering', type: 'SPIRIT', category: 'special', power: 140, accuracy: 90, pp: 5, recoil: 0.5, flags: ['protect'],
  desc: 'User takes 50% recoil.', flavor: 'He spends the part of himself he was saving for later.',
  fx: { key: 'offering', color: '#a0fff0', shape: 'burst', scale: 2.3, hitstop: 235, shake: 1.8, sfx: 'soul' } });
def({ id: 'second_wind', name: 'Second Wind', type: 'SPIRIT', category: 'status', power: 0, accuracy: null, pp: 10, target: 'self',
  effects: [{ kind: 'heal', frac: 0.5, target: 'self' }],
  desc: 'Restores half of max HP.', flavor: 'He gets up in the way that ends most fights before they resume.',
  fx: { key: 'heal', color: '#7fffc4', shape: 'aura', sfx: 'heal' } });
def({ id: 'spirit_double', name: 'Spirit Double', type: 'SPIRIT', category: 'status', power: 0, accuracy: null, pp: 10, target: 'self', flags: ['snatch'],
  effects: [{ kind: 'volatile', value: 'substitute', target: 'self' }],
  desc: 'Spends 25% HP to make a decoy that absorbs hits.', flavor: 'It has his face and none of his opinions.',
  fx: { key: 'substitute', color: '#6fe3d0', shape: 'aura', scale: 1.3, sfx: 'transform' } });
def({ id: 'ward_of_departed', name: 'Ward of the Departed', type: 'SPIRIT', category: 'status', power: 0, accuracy: null, pp: 20, target: 'allySide',
  effects: [{ kind: 'screen', value: 'safeguard', target: 'allySide' }],
  desc: 'Blocks status conditions on your side for 5 turns.', flavor: 'Names of people who lost the same way, said once each.',
  fx: { key: 'safeguard', color: '#8ff0e0', shape: 'aura', scale: 1.4, sfx: 'shield' } });
def({ id: 'sleep_mist', name: 'Sleep Mist', type: 'SPIRIT', category: 'status', power: 0, accuracy: 75, pp: 10, target: 'foe', flags: ['protect', 'reflectable'],
  effects: [{ kind: 'status', value: 'slp', target: 'foe' }],
  desc: 'Puts the target to sleep.', flavor: 'Grey, low to the ground, and patient about it.',
  fx: { key: 'sleep', color: '#8fa3c9', shape: 'aura', sfx: 'sleep' } });

/* ================================================================== */
/* VOID — the glass-cannon type: erasure, halving, and hard costs      */
/* ================================================================== */

def({ id: 'void_lance', name: 'Void Lance', type: 'VOID', category: 'special', power: 65, accuracy: 100, pp: 20, flags: ['protect'],
  desc: 'A thrown absence.', flavor: 'A line of nothing, aimed the way a thing would be.',
  fx: { key: 'void_bolt', color: '#5a4a8a', shape: 'beam', scale: 1.05, hitstop: 85, shake: 0.5, sfx: 'voidfx' } });
def({ id: 'erasure_fist', name: 'Erasure Fist', type: 'VOID', category: 'physical', power: 70, accuracy: 100, pp: 20, contact: true, flags: ['punch', 'protect'],
  effects: [{ kind: 'volatile', value: 'flinch', chance: 20, target: 'foe' }],
  desc: '20% chance to make the target flinch.', flavor: 'The knuckle arrives. A small amount of the world does not.',
  fx: { key: 'void_punch', color: '#3a2f5b', shape: 'melee', scale: 1.15, hitstop: 105, shake: 0.65, sfx: 'hit_void' } });
def({ id: 'entropy_pulse', name: 'Entropy Pulse', type: 'VOID', category: 'special', power: 95, accuracy: 95, pp: 10, flags: ['pulse', 'protect'],
  effects: [{ kind: 'boost', stats: { spd: -1 }, chance: 20, target: 'foe' }],
  desc: '20% chance to lower the target\'s Sp. Def.', flavor: 'Everything it touches ages by an unhelpful amount.',
  fx: { key: 'entropy', color: '#4a3f70', shape: 'burst', scale: 1.6, hitstop: 145, shake: 1.1, sfx: 'voidfx' } });
def({ id: 'event_horizon', name: 'Event Horizon', type: 'VOID', category: 'special', power: 0, accuracy: 90, pp: 10, flags: ['protect'],
  effects: [{ kind: 'custom', value: 'halfhp' }],
  desc: 'Halves the target\'s current HP.', flavor: 'Half of everything, forever, and never quite all of it.',
  fx: { key: 'horizon', color: '#241d3a', shape: 'burst', scale: 1.7, hitstop: 150, shake: 1.1, sfx: 'voidfx' } });
def({ id: 'finality', name: 'Finality', type: 'VOID', category: 'special', power: 130, accuracy: 100, pp: 5, priority: -4, flags: ['protect'],
  desc: 'Enormous, but always moves last.', flavor: 'It waits until everyone has finished speaking.',
  fx: { key: 'finality', color: '#2a2145', shape: 'burst', scale: 2.2, hitstop: 220, shake: 1.7, sfx: 'impact_world' } });
def({ id: 'annihilation_ray', name: 'Annihilation Ray', type: 'VOID', category: 'special', power: 140, accuracy: 90, pp: 5, flags: ['recharge', 'protect'],
  desc: 'Enormous. User must recharge next turn.', flavor: 'A cone of the world being asked to stop.',
  fx: { key: 'annihilate', color: '#3a2f5b', shape: 'beam', scale: 2.3, hitstop: 235, shake: 1.8, sfx: 'voidfx' } });
def({ id: 'singularity', name: 'Singularity', type: 'VOID', category: 'special', power: 150, accuracy: 85, pp: 5, flags: ['charge', 'protect'],
  chargeText: 'A point of absolute dark opens…',
  desc: 'Charges one turn, strikes the next.', flavor: 'It is very small. That is the whole problem with it.',
  fx: { key: 'singularity', color: '#150f28', shape: 'burst', scale: 2.4, hitstop: 250, shake: 1.9, sfx: 'voidfx' } });
def({ id: 'void_step', name: 'Void Step', type: 'VOID', category: 'status', power: 0, accuracy: null, pp: 10, target: 'self', priority: 4,
  effects: [{ kind: 'volatile', value: 'protect', target: 'self' }],
  desc: 'Protects the user from all moves this turn.', flavor: 'He steps sideways into the gap between two seconds.',
  fx: { key: 'protect', color: '#3a2f5b', shape: 'aura', sfx: 'shield' } });
def({ id: 'nullify', name: 'Nullify', type: 'VOID', category: 'status', power: 0, accuracy: 100, pp: 15, target: 'foe', flags: ['protect'],
  effects: [{ kind: 'custom', value: 'clearboosts' }],
  desc: 'Removes all of the target\'s stat changes.', flavor: 'Everything you built in the last four turns, unbuilt.',
  fx: { key: 'nullify', color: '#3a2f5b', shape: 'aura', scale: 1.4, sfx: 'warp' } });

/* ================================================================== */
/* THE TACTICAL LAYER                                                  */
/*                                                                     */
/* Everything below exists because the engine already implements it    */
/* and nothing in the library reached for it. See docs/ARCHITECTURE.md */
/* §2.2 for the flag contract and §4 for the events each one emits.    */
/*                                                                     */
/*   pivot     strike, then leave — the move that makes a bench matter */
/*   pursuit   punishes the answer to a pivot, at double power         */
/*   crush     doubles against a `minimized` target                    */
/*   bypassSub goes through a decoy                                    */
/*   perish / torment / imprison / rooted / minimized — volatiles the  */
/*             engine ticks every turn that nothing ever applied       */
/*                                                                     */
/* Budget note: a pivot is priced as a plain 70 BP / 20 PP attack. The */
/* EPS formula does not score the free switch, and it should not — the */
/* switch costs the user its position on the field, which is a real    */
/* price the formula has no column for.                                */
/* ================================================================== */

/* ---- pivot: twelve ways to hit something and not be there ---------- */

def({ id: 'cut_and_run', name: 'Cut and Run', type: 'SLASH', category: 'physical', power: 85, accuracy: 100, pp: 20, contact: true, flags: ['slice', 'protect', 'pivot'],
  desc: 'The user switches out after it lands.', flavor: 'The cut is the goodbye. He is over the rail before the blood.',
  fx: { key: 'spin_slash', color: '#c9d4e0', shape: 'arc', scale: 1.1, hitstop: 80, shake: 0.5, sfx: 'slash_light' } });
def({ id: 'hit_and_fade', name: 'Hit and Fade', type: 'FIST', category: 'physical', power: 85, accuracy: 100, pp: 20, contact: true, flags: ['punch', 'protect', 'pivot'],
  desc: 'The user switches out after it lands.', flavor: 'One in the ribs on the way past. He never stopped walking.',
  fx: { key: 'piston_punch', color: '#e8743b', shape: 'melee', scale: 1.05, hitstop: 85, shake: 0.5, sfx: 'hit_fist' } });
def({ id: 'undertow', name: 'Undertow', type: 'SEA', category: 'special', power: 85, accuracy: 100, pp: 20, flags: ['protect', 'pivot'],
  desc: 'The user switches out after it lands.', flavor: 'The water takes him back out with it, which was the plan.',
  fx: { key: 'water_spiral', color: '#2a7fd4', shape: 'burst', scale: 1.2, hitstop: 85, shake: 0.5, sfx: 'wave' } });
def({ id: 'volt_relay', name: 'Volt Relay', type: 'STORM', category: 'special', power: 85, accuracy: 100, pp: 20, flags: ['protect', 'pivot'],
  desc: 'The user switches out after it lands.', flavor: 'He rides his own bolt back down the line to the bench.',
  fx: { key: 'volt_rush', color: '#f5c542', shape: 'beam', scale: 1.15, hitstop: 80, shake: 0.5, sfx: 'zap' } });
def({ id: 'gale_exit', name: 'Gale Exit', type: 'WIND', category: 'physical', power: 85, accuracy: 100, pp: 20, contact: true, flags: ['wind', 'protect', 'pivot'],
  desc: 'The user switches out after it lands.', flavor: 'A boot to the chest, and the wind that took it away.',
  fx: { key: 'wind_dash', color: '#a7e8c0', shape: 'melee', scale: 1.1, hitstop: 80, shake: 0.5, sfx: 'gale' } });
def({ id: 'ember_break', name: 'Ember Break', type: 'FLAME', category: 'special', power: 85, accuracy: 100, pp: 20, flags: ['protect', 'pivot'],
  desc: 'The user switches out after it lands.', flavor: 'He leaves as smoke, which is both a tactic and a habit.',
  fx: { key: 'flame_charge', color: '#ff5a36', shape: 'burst', scale: 1.15, hitstop: 85, shake: 0.5, sfx: 'fire_small' } });
def({ id: 'shade_slip', name: 'Shade Slip', type: 'SHADOW', category: 'physical', power: 85, accuracy: 100, pp: 20, contact: true, flags: ['protect', 'pivot'],
  desc: 'The user switches out after it lands.', flavor: 'Into one shadow, out of a different one, some distance away.',
  fx: { key: 'shade_claw', color: '#5a3d7a', shape: 'melee', scale: 1.1, hitstop: 85, shake: 0.5, sfx: 'hit_shadow' } });
def({ id: 'scrap_launch', name: 'Scrap Launch', type: 'MECHA', category: 'special', power: 85, accuracy: 100, pp: 20, flags: ['bullet', 'protect', 'pivot'],
  desc: 'The user switches out after it lands.', flavor: 'Fires the whole forearm, then walks off to fetch a spare.',
  fx: { key: 'rivet', color: '#9aa7b5', shape: 'beam', scale: 1.15, hitstop: 85, shake: 0.5, sfx: 'cannon' } });
def({ id: 'mind_relay', name: 'Mind Relay', type: 'MIND', category: 'special', power: 85, accuracy: 100, pp: 20, flags: ['protect', 'pivot'],
  desc: 'The user switches out after it lands.', flavor: 'It puts the thought in, and the thinker somewhere else.',
  fx: { key: 'psi_spike', color: '#e05c9e', shape: 'burst', scale: 1.15, hitstop: 85, shake: 0.5, sfx: 'psychic' } });
def({ id: 'flash_relay', name: 'Flash Relay', type: 'LIGHT', category: 'special', power: 85, accuracy: 100, pp: 20, flags: ['protect', 'pivot'],
  desc: 'The user switches out after it lands.', flavor: 'The light gets there. He is already back where he started.',
  fx: { key: 'flash_dash', color: '#ffe9a3', shape: 'beam', scale: 1.15, hitstop: 80, shake: 0.5, sfx: 'light' } });
def({ id: 'soul_relay', name: 'Soul Relay', type: 'SPIRIT', category: 'special', power: 85, accuracy: 100, pp: 20, flags: ['protect', 'pivot'],
  desc: 'The user switches out after it lands.', flavor: 'He hands the fight over the way you hand over a coat.',
  fx: { key: 'soul_drain', color: '#6fe3d0', shape: 'beam', scale: 1.15, hitstop: 85, shake: 0.5, sfx: 'soul' } });
// The `pivot` flag only fires off landed damage, so the switch here rides the
// engine's `custom: 'pivot'` handler; the flag is kept so the card reads true.
def({ id: 'parting_note', name: 'Parting Note', type: 'SOUND', category: 'status', power: 0, accuracy: 100, pp: 10, target: 'foe', flags: ['sound', 'protect', 'reflectable', 'pivot'],
  effects: [{ kind: 'boost', stats: { atk: -1, spa: -1 }, target: 'foe' }, { kind: 'custom', value: 'pivot' }],
  desc: 'Lowers Attack and Sp. Atk, then the user switches out.', flavor: 'One flat chord, held slightly too long, and the door.',
  fx: { key: 'sound_wave', color: '#c084fc', shape: 'burst', scale: 1.3, hitstop: 60, shake: 0.4, sfx: 'sonic' } });

/* ---- pursuit: the tax on running away ------------------------------ */

def({ id: 'run_down', name: 'Run Down', type: 'SHADOW', category: 'physical', power: 45, accuracy: 100, pp: 20, contact: true, flags: ['pursuit', 'protect'],
  desc: 'Double power on a target that is switching out.', flavor: 'The shadow does not need to be faster. It needs to be attached.',
  fx: { key: 'shade_grab', color: '#5a3d7a', shape: 'melee', scale: 1, hitstop: 70, shake: 0.4, sfx: 'hit_shadow' } });
def({ id: 'hunters_mark', name: "Hunter's Mark", type: 'BEAST', category: 'physical', power: 45, accuracy: 100, pp: 20, contact: true, flags: ['bite', 'pursuit', 'protect'],
  desc: 'Double power on a target that is switching out.', flavor: 'Backs are what it was built for. Faces are a compromise.',
  fx: { key: 'drain_bite', color: '#8a6b3d', shape: 'melee', scale: 1, hitstop: 70, shake: 0.4, sfx: 'hit_beast' } });
def({ id: 'tracking_round', name: 'Tracking Round', type: 'MECHA', category: 'special', power: 45, accuracy: 100, pp: 20, flags: ['bullet', 'pursuit', 'protect'],
  desc: 'Double power on a target that is switching out.', flavor: 'Fired at where you are going, not at where you are.',
  fx: { key: 'sniper_shot', color: '#9aa7b5', shape: 'beam', scale: 1, hitstop: 70, shake: 0.4, sfx: 'gunshot' } });
def({ id: 'chasing_edge', name: 'Chasing Edge', type: 'SLASH', category: 'physical', power: 45, accuracy: 100, pp: 20, contact: true, flags: ['slice', 'pursuit', 'protect'],
  desc: 'Double power on a target that is switching out.', flavor: 'A step is a long time to a man with a drawn sword.',
  fx: { key: 'draw_blade', color: '#c9d4e0', shape: 'arc', scale: 1, hitstop: 70, shake: 0.4, sfx: 'slash_light' } });
def({ id: 'pinning_will', name: 'Pinning Will', type: 'HAKI', category: 'physical', power: 45, accuracy: 100, pp: 20, contact: true, flags: ['pursuit', 'protect'],
  desc: 'Double power on a target that is switching out.', flavor: 'He simply decides you are still standing there.',
  fx: { key: 'haki_strike', color: '#2b2d42', shape: 'melee', scale: 1, hitstop: 70, shake: 0.4, sfx: 'hit_haki' } });

/* ---- crush, and the small targets it answers ----------------------- */

def({ id: 'heel_drop', name: 'Heel Drop', type: 'FIST', category: 'physical', power: 80, accuracy: 100, pp: 15, contact: true, flags: ['crush', 'protect'],
  desc: 'Double damage on a target that made itself small.', flavor: 'Straight down, with the whole body behind the ankle.',
  fx: { key: 'heel_drop', color: '#e8743b', shape: 'melee', scale: 1.3, hitstop: 110, shake: 0.8, sfx: 'impact_med' } });
def({ id: 'pile_driver', name: 'Pile Driver', type: 'MECHA', category: 'physical', power: 85, accuracy: 95, pp: 15, contact: true, flags: ['crush', 'protect'],
  desc: 'Double damage on a target that made itself small.', flavor: 'Hydraulics, a countdown, and no reverse gear on the ram.',
  fx: { key: 'plate_slam', color: '#9aa7b5', shape: 'melee', scale: 1.35, hitstop: 125, shake: 0.9, sfx: 'impact_heavy' } });
def({ id: 'full_weight', name: 'Full Weight', type: 'BEAST', category: 'physical', power: 80, accuracy: 100, pp: 15, contact: true, flags: ['crush', 'protect'],
  desc: 'Double damage on a target that made itself small.', flavor: 'No technique in it at all. There is a great deal of animal.',
  fx: { key: 'big_slam', color: '#8a6b3d', shape: 'melee', scale: 1.4, hitstop: 120, shake: 0.9, sfx: 'impact_heavy' } });
def({ id: 'vanishing_act', name: 'Vanishing Act', type: 'SHADOW', category: 'status', power: 0, accuracy: null, pp: 15, target: 'self', flags: ['snatch'],
  effects: [{ kind: 'boost', stats: { eva: 2 }, target: 'self' }, { kind: 'volatile', value: 'minimized', target: 'self' }],
  desc: 'Sharply raises evasion. Crushing blows then hit double.', flavor: 'He folds himself down to the size of a rumour.',
  fx: { key: 'blink', color: '#5a3d7a', shape: 'aura', scale: 0.8, sfx: 'shadow' } });
def({ id: 'small_target', name: 'Small Target', type: 'MIND', category: 'status', power: 0, accuracy: null, pp: 15, target: 'self', flags: ['snatch'],
  effects: [{ kind: 'boost', stats: { eva: 1, spe: 1 }, target: 'self' }, { kind: 'volatile', value: 'minimized', target: 'self' }],
  desc: 'Raises evasion and Speed. Crushing blows then hit double.', flavor: 'Reads the swing, and is briefly not worth swinging at.',
  fx: { key: 'buff_mind', color: '#e05c9e', shape: 'aura', scale: 0.85, sfx: 'buff' } });

/* ---- bypassSub: hitting the person, not the decoy ------------------ */

def({ id: 'haki_pierce', name: 'Haki Pierce', type: 'HAKI', category: 'physical', power: 75, accuracy: 100, pp: 15, contact: true, flags: ['bypassSub', 'protect'],
  desc: 'Reaches the target through anything standing in for it.', flavor: 'Will, sharpened to a point, aimed at the real one.',
  fx: { key: 'haki_flash', color: '#2b2d42', shape: 'melee', scale: 1.2, hitstop: 100, shake: 0.6, sfx: 'haki' } });
def({ id: 'phase_lance', name: 'Phase Lance', type: 'VOID', category: 'special', power: 75, accuracy: 100, pp: 15, flags: ['bypassSub', 'protect'],
  desc: 'Reaches the target through anything standing in for it.', flavor: 'It is not going around the obstacle. It is not going near it.',
  fx: { key: 'void_bolt', color: '#3a2f5b', shape: 'beam', scale: 1.2, hitstop: 100, shake: 0.6, sfx: 'voidfx' } });
def({ id: 'soul_reach', name: 'Soul Reach', type: 'SPIRIT', category: 'special', power: 70, accuracy: 100, pp: 20, flags: ['bypassSub', 'protect'],
  desc: 'Reaches the target through anything standing in for it.', flavor: 'A hand closes on something that was never in the room.',
  fx: { key: 'soul_link', color: '#6fe3d0', shape: 'beam', scale: 1.15, hitstop: 95, shake: 0.55, sfx: 'spirit' } });

/* ---- the volatiles nobody was applying ----------------------------- */

def({ id: 'dirge', name: 'Dirge', type: 'SOUND', category: 'status', power: 0, accuracy: 100, pp: 5, target: 'foe', flags: ['sound', 'protect'],
  effects: [{ kind: 'volatile', value: 'perish', turns: 4 }],
  desc: 'Everyone who hears it faints in three turns.', flavor: 'He has been saving it. Nobody in earshot gets a vote.',
  fx: { key: 'requiem', color: '#c084fc', shape: 'aura', scale: 1.8, sfx: 'soul' } });
def({ id: 'bitter_refrain', name: 'Bitter Refrain', type: 'SOUND', category: 'status', power: 0, accuracy: 100, pp: 15, target: 'foe', flags: ['sound', 'protect', 'reflectable'],
  effects: [{ kind: 'volatile', value: 'torment' }],
  desc: 'The target cannot use the same move twice running.', flavor: 'The same eight bars, until repeating yourself is unbearable.',
  fx: { key: 'echo', color: '#c084fc', shape: 'burst', scale: 1.3, sfx: 'screech' } });
def({ id: 'second_guess', name: 'Second Guess', type: 'MIND', category: 'status', power: 0, accuracy: 100, pp: 15, target: 'foe', flags: ['protect', 'reflectable'],
  effects: [{ kind: 'volatile', value: 'torment' }],
  desc: 'The target cannot use the same move twice running.', flavor: 'It worked last turn. That is now the reason not to.',
  fx: { key: 'psi_break', color: '#e05c9e', shape: 'aura', scale: 1.2, sfx: 'psychic' } });
def({ id: 'mirror_seal', name: 'Mirror Seal', type: 'MIND', category: 'status', power: 0, accuracy: null, pp: 10, target: 'self',
  effects: [{ kind: 'volatile', value: 'imprison', target: 'self' }],
  desc: 'Seals every move the user itself knows.', flavor: 'She names them out loud. After that nobody may use them.',
  fx: { key: 'room_swap', color: '#e05c9e', shape: 'aura', scale: 1.5, sfx: 'psychic' } });
def({ id: 'deep_root', name: 'Deep Root', type: 'EARTH', category: 'status', power: 0, accuracy: null, pp: 15, target: 'self',
  effects: [{ kind: 'volatile', value: 'rooted', target: 'self' }],
  desc: 'Restores HP each turn, but the user cannot flee.', flavor: 'He puts a foot through the flagstones and stops arguing.',
  fx: { key: 'stone_spike', color: '#b98b5a', shape: 'aura', scale: 1.3, sfx: 'quake' } });
def({ id: 'anchor_stance', name: 'Anchor Stance', type: 'SEA', category: 'status', power: 0, accuracy: null, pp: 15, target: 'self',
  effects: [{ kind: 'volatile', value: 'rooted', target: 'self' }],
  desc: 'Restores HP each turn, but the user cannot flee.', flavor: 'Both heels in the deck. The sea can come to him.',
  fx: { key: 'water_wall', color: '#2a7fd4', shape: 'aura', scale: 1.3, sfx: 'wave' } });

/* ---- hazards worth stacking ---------------------------------------- */

def({ id: 'shrapnel_burst', name: 'Shrapnel Burst', type: 'MECHA', category: 'special', power: 75, accuracy: 100, pp: 15, flags: ['bullet', 'protect'],
  effects: [{ kind: 'hazard', value: 'caltrops', target: 'foeSide' }],
  desc: 'Hits, and scatters caltrops behind the target.', flavor: 'Most of the charge goes past. That part is deliberate.',
  fx: { key: 'hazard', color: '#9aa7b5', shape: 'burst', scale: 1.3, hitstop: 75, shake: 0.5, sfx: 'scatter' } });
def({ id: 'barb_spray', name: 'Barb Spray', type: 'TOXIN', category: 'special', power: 75, accuracy: 100, pp: 15, flags: ['protect'],
  effects: [{ kind: 'hazard', value: 'barbs', target: 'foeSide' }],
  desc: 'Hits, and lays toxic barbs behind the target.', flavor: 'Half of it lands. The other half waits for the next one.',
  fx: { key: 'hazard_toxin', color: '#8bc34a', shape: 'burst', scale: 1.3, hitstop: 75, shake: 0.5, sfx: 'sludge' } });
def({ id: 'shatter_volley', name: 'Shatter Volley', type: 'FROST', category: 'special', power: 75, accuracy: 100, pp: 15, flags: ['protect'],
  effects: [{ kind: 'hazard', value: 'shards', target: 'foeSide' }],
  desc: 'Hits, and hangs jagged ice over the target\'s side.', flavor: 'What misses does not melt. It waits at head height.',
  fx: { key: 'hazard_ice', color: '#7fd8ff', shape: 'burst', scale: 1.3, hitstop: 75, shake: 0.5, sfx: 'ice_shatter' } });
def({ id: 'slick_tide', name: 'Slick Tide', type: 'SEA', category: 'special', power: 75, accuracy: 100, pp: 15, flags: ['protect'],
  effects: [{ kind: 'hazard', value: 'oilslick', target: 'foeSide' }],
  desc: 'Hits, and spreads an oil slick behind the target.', flavor: 'Bilge water, and everything the bilge had been keeping.',
  fx: { key: 'hazard_oil', color: '#2a7fd4', shape: 'burst', scale: 1.3, hitstop: 75, shake: 0.5, sfx: 'water_hit' } });
def({ id: 'blade_scatter', name: 'Blade Scatter', type: 'SLASH', category: 'status', power: 0, accuracy: null, pp: 20, target: 'foeSide',
  effects: [{ kind: 'hazard', value: 'caltrops', target: 'foeSide' }],
  desc: 'Scatters caltrops. Stacks up to three layers.', flavor: 'Every broken blade he has ever owned, thrown point-first.',
  fx: { key: 'hazard', color: '#c9d4e0', shape: 'burst', scale: 1.4, sfx: 'scatter' } });
def({ id: 'bone_shards', name: 'Bone Shards', type: 'SPIRIT', category: 'status', power: 0, accuracy: null, pp: 20, target: 'foeSide',
  effects: [{ kind: 'hazard', value: 'shards', target: 'foeSide' }],
  desc: 'Hangs cutting shards over the foe\'s side of the field.', flavor: 'He can spare them. He is, after all, mostly spare.',
  fx: { key: 'hazard_ice', color: '#6fe3d0', shape: 'burst', scale: 1.4, sfx: 'ice_shatter' } });

/* ================================================================== */
/* staying alive                                                       */
/* ================================================================== */
// A critic put the tactical layer at 5/10 against Black 2 and named one cause:
// nothing here survives long enough for position to matter. A fighter lived 2.26
// turns and 38.7% of KOs landed on the first damaging hit, so switching, hazards,
// poison clocks and PP were all investments with no time to pay back — banning
// switching outright from a strong AI cost it 1.0 percentage point.
//
// The library had three reliable heals for thirty-two fighters, and the bulky
// half of the roster could not learn any of them. These are the missing half of
// the game. They are deliberately typed for the bulky fighters and nobody else:
// in the source material reliable recovery is a privilege of bulk, and handing
// it to a sweeper does not lengthen a fight, it just makes the race unloseable
// for whoever was winning it.

def({ id: 'tidal_mend', name: 'Tidal Mend', type: 'SEA', category: 'status', power: 0, accuracy: null, pp: 10, target: 'self', flags: ['snatch'],
  effects: [{ kind: 'heal', frac: 0.5, target: 'self' }],
  desc: 'Restores half of max HP.', flavor: 'The sea closes over the wound and hands him back whole.',
  fx: { key: 'heal', color: '#4fc3f7', shape: 'aura', sfx: 'heal' } });
def({ id: 'beast_regrowth', name: 'Beast Regrowth', type: 'BEAST', category: 'status', power: 0, accuracy: null, pp: 10, target: 'self', flags: ['snatch'],
  effects: [{ kind: 'heal', frac: 0.5, target: 'self' }],
  desc: 'Restores half of max HP.', flavor: 'Something under the hide decides the damage was optional.',
  fx: { key: 'heal', color: '#9ede6a', shape: 'aura', sfx: 'heal' } });
def({ id: 'field_repair', name: 'Field Repair', type: 'MECHA', category: 'status', power: 0, accuracy: null, pp: 10, target: 'self', flags: ['snatch'],
  effects: [{ kind: 'heal', frac: 0.5, target: 'self' }],
  desc: 'Restores half of max HP.', flavor: 'Cola, solder, and a confidence the schematics do not support.',
  fx: { key: 'heal', color: '#8fd0ff', shape: 'aura', sfx: 'heal' } });
def({ id: 'strata_rest', name: 'Strata Rest', type: 'EARTH', category: 'status', power: 0, accuracy: null, pp: 10, target: 'self', flags: ['snatch'],
  effects: [{ kind: 'heal', frac: 0.5, target: 'self' }],
  desc: 'Restores half of max HP.', flavor: 'He sinks to the knee and the ground gives some of it back.',
  fx: { key: 'heal', color: '#d2b48c', shape: 'aura', sfx: 'heal' } });
def({ id: 'clear_the_head', name: 'Clear the Head', type: 'MIND', category: 'status', power: 0, accuracy: null, pp: 10, target: 'self', flags: ['snatch'],
  effects: [{ kind: 'heal', frac: 0.5, target: 'self' }],
  desc: 'Restores half of max HP.', flavor: 'Two seconds of nothing at all, which is the hardest thing he does.',
  fx: { key: 'heal', color: '#c9a7ff', shape: 'aura', sfx: 'heal' } });

// Protect existed on exactly one default set. In the source material every
// fighter can decline a turn; Haki is literally seeing the hit before it lands.
def({ id: 'read_the_hit', name: 'Read the Hit', type: 'HAKI', category: 'status', power: 0, accuracy: null, pp: 10, target: 'self', priority: 4,
  effects: [{ kind: 'volatile', value: 'protect', target: 'self' }],
  desc: 'Protects the user this turn.', flavor: 'He watched it arrive a half-second ago and stepped out of it then.',
  fx: { key: 'protect', color: '#b9a2ff', shape: 'aura', sfx: 'shield' } });
def({ id: 'set_the_feet', name: 'Set the Feet', type: 'FIST', category: 'status', power: 0, accuracy: null, pp: 10, target: 'self', priority: 4,
  effects: [{ kind: 'volatile', value: 'protect', target: 'self' }],
  desc: 'Protects the user this turn.', flavor: 'Weight back, guard up, and an invitation to try it anyway.',
  fx: { key: 'protect', color: '#ffcf7a', shape: 'aura', sfx: 'shield' } });

/* ================================================================== */
/* last resort                                                         */
/* ================================================================== */

def({ id: 'struggle', name: 'Struggle', type: '???', category: 'physical', power: 50, accuracy: null, pp: 1,
  contact: true, recoil: 0.25, flags: [],
  desc: 'Used when no other move can be. The user is hurt too.',
  flavor: 'Out of options, out of breath, still swinging.',
  fx: { key: 'struggle', color: '#cfd6e8', shape: 'melee', scale: 0.9, hitstop: 90, shake: 0.5, sfx: 'impact_med' } });

/* ------------------------------------------------------------------ */

import { SIGNATURE_MOVES } from './signatureMoves.js';

const DEFAULTS = {
  power: 0, accuracy: 100, priority: 0, target: 'foe', critStage: 0,
  contact: false, flags: [], hits: null, drain: 0, recoil: 0, effects: null, pp: 10
};
for (const sig of SIGNATURE_MOVES) M.push({ ...DEFAULTS, ...sig });

export const MOVES = M;
export const MOVE_BY_ID = Object.fromEntries(M.map((m) => [m.id, m]));
export function getMove(id) { return MOVE_BY_ID[id]; }
export function allMoves() { return M; }
export function movesOfType(t) { return M.filter((m) => m.type === t); }
