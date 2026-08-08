/* ==========================================================================
 * GRAND LINE CLASH
 * A local 2-player, turn-based One Piece battler with Pokemon-style mechanics.
 * Vanilla JS — no build step, no dependencies.
 * ========================================================================== */

'use strict';

/* ==========================================================================
 * 1. TYPES & EFFECTIVENESS
 * ========================================================================== */

const TYPES = ['Haki', 'Logia', 'Paramecia', 'Zoan', 'Swordsman', 'Normal'];

/* attacker type -> the single type it hits for 2.0x. Everything else is 1.0x. */
const SUPER_EFFECTIVE_AGAINST = {
  Haki:      'Logia',
  Logia:     'Swordsman',
  Swordsman: 'Paramecia',
  Paramecia: 'Zoan',
  Zoan:      'Haki',
  Normal:    null
};

function typeMultiplier(moveType, defenderType) {
  return SUPER_EFFECTIVE_AGAINST[moveType] === defenderType ? 2.0 : 1.0;
}

function typeClass(type) {
  return 't-' + type.toLowerCase();
}

/* ==========================================================================
 * 2. ROSTER
 * ========================================================================== */

const ROSTER = [
  {
    id: 'luffy',
    name: 'Luffy',
    type: 'Paramecia',
    epithet: 'Straw Hat',
    maxHp: 120, atk: 85, def: 60, spd: 95,
    moves: [
      { name: 'Gum-Gum Pistol',   type: 'Normal',    power: 40, category: 'physical' },
      { name: 'Red Hawk',         type: 'Paramecia', power: 80, category: 'physical' },
      { name: "Conqueror's Haki", type: 'Haki',      power: 60, category: 'physical' },
      { name: 'Gear 2',           type: 'Paramecia', power: 0,  category: 'status', stat: 'spd' }
    ]
  },
  {
    id: 'zoro',
    name: 'Zoro',
    type: 'Swordsman',
    epithet: 'Pirate Hunter',
    maxHp: 110, atk: 100, def: 75, spd: 80,
    moves: [
      { name: 'Oni Giri',           type: 'Swordsman', power: 60, category: 'physical' },
      { name: 'Purgatory Onigiri',  type: 'Swordsman', power: 90, category: 'physical' },
      { name: 'Haki Slash',         type: 'Haki',      power: 50, category: 'physical' },
      { name: 'Asura',              type: 'Swordsman', power: 0,  category: 'status', stat: 'atk' }
    ]
  },
  {
    id: 'kaido',
    name: 'Kaido',
    type: 'Zoan',
    epithet: 'King of the Beasts',
    maxHp: 160, atk: 110, def: 90, spd: 65,
    moves: [
      { name: 'Thunder Bagua', type: 'Haki',   power: 100, category: 'physical' },
      { name: 'Boro Breath',   type: 'Zoan',   power: 90,  category: 'physical' },
      { name: 'Club Smash',    type: 'Normal', power: 50,  category: 'physical' },
      { name: 'Dragon Scales', type: 'Zoan',   power: 0,   category: 'status', stat: 'def' }
    ]
  },
  {
    id: 'akainu',
    name: 'Akainu',
    type: 'Logia',
    epithet: 'Fleet Admiral',
    maxHp: 130, atk: 115, def: 80, spd: 70,
    moves: [
      { name: 'Magma Hound',      type: 'Logia', power: 70,  category: 'physical' },
      { name: 'Meteor Volcano',   type: 'Logia', power: 110, category: 'physical' },
      { name: 'Haki Punch',       type: 'Haki',  power: 60,  category: 'physical' },
      { name: 'Absolute Justice', type: 'Haki',  power: 0,   category: 'status', stat: 'atk' }
    ]
  }
];

const STAT_LABEL = { atk: 'Attack', def: 'Defense', spd: 'Speed' };
const BOOST_STEP = 1.5;   // each status use multiplies the stat by 1.5x
const MAX_BOOSTS = 4;     // stacking cap, so a stat-boost war cannot stall forever

/* ==========================================================================
 * 3. SPRITES (inline SVG, drawn facing right)
 * ========================================================================== */

function svg(inner) {
  return `<svg viewBox="0 0 120 140" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <ellipse cx="60" cy="132" rx="34" ry="6" fill="rgba(0,0,0,.28)"/>
    ${inner}
  </svg>`;
}

const SPRITES = {

  luffy: () => svg(`
    <!-- legs -->
    <rect x="47" y="98" width="12" height="26" rx="3" fill="#2f4f9e"/>
    <rect x="62" y="98" width="12" height="26" rx="3" fill="#2f4f9e"/>
    <rect x="43" y="121" width="18" height="7" rx="3" fill="#6b4a2a"/>
    <rect x="60" y="121" width="18" height="7" rx="3" fill="#6b4a2a"/>
    <!-- arms: stroked so the fists always stay attached -->
    <path d="M46 70 L29 96" stroke="#f2c49b" stroke-width="12" stroke-linecap="round" fill="none"/>
    <circle cx="29" cy="96" r="7.5" fill="#f2c49b"/>
    <path d="M74 70 L96 46" stroke="#f2c49b" stroke-width="12" stroke-linecap="round" fill="none"/>
    <circle cx="97" cy="45" r="8.5" fill="#f2c49b"/>
    <!-- torso + red vest -->
    <path d="M42 64 h36 v40 h-36 z" fill="#f2c49b"/>
    <path d="M42 64 h13 l5 14 l5 -14 h13 v40 h-36 z" fill="#d0342c"/>
    <path d="M40 96 h40 v6 h-40 z" fill="#f1d14e"/>
    <path d="M40 101 h40 v7 h-40 z" fill="#2f4f9e"/>
    <!-- head -->
    <circle cx="60" cy="42" r="20" fill="#f6cda4"/>
    <path d="M40 40 q4 -20 20 -20 q16 0 20 20 q-8 -10 -20 -10 q-12 0 -20 10z" fill="#141414"/>
    <!-- face -->
    <circle cx="52" cy="43" r="3.4" fill="#1a1a1a"/>
    <circle cx="68" cy="43" r="3.4" fill="#1a1a1a"/>
    <circle cx="53.2" cy="41.8" r="1.1" fill="#fff"/>
    <circle cx="69.2" cy="41.8" r="1.1" fill="#fff"/>
    <path d="M50 51 q10 10 20 0" stroke="#9a3a2e" stroke-width="2.6" fill="none" stroke-linecap="round"/>
    <!-- trademark scar under the eye -->
    <path d="M66 49 l5 4" stroke="#b04a3a" stroke-width="2.2" stroke-linecap="round"/>
    <!-- straw hat -->
    <ellipse cx="60" cy="26" rx="34" ry="9" fill="#e0b954"/>
    <ellipse cx="60" cy="24.5" rx="33" ry="8" fill="#f0d484"/>
    <path d="M45 25 q15 -17 30 0 z" fill="#e9c76c"/>
    <path d="M45 23 h30 v4.5 h-30 z" fill="#c0392b"/>
  `),

  zoro: () => svg(`
    <!-- two sheathed katana at the hip -->
    <path d="M20 108 L64 74" stroke="#1b1b22" stroke-width="5" stroke-linecap="round"/>
    <path d="M18 100 L62 66" stroke="#39394a" stroke-width="5" stroke-linecap="round"/>
    <path d="M20 108 l-6 5" stroke="#f2c14e" stroke-width="3" stroke-linecap="round"/>
    <!-- legs -->
    <rect x="46" y="100" width="13" height="26" rx="3" fill="#22262f"/>
    <rect x="62" y="100" width="13" height="26" rx="3" fill="#22262f"/>
    <rect x="43" y="123" width="18" height="6" rx="3" fill="#4a3b26"/>
    <rect x="61" y="123" width="18" height="6" rx="3" fill="#4a3b26"/>
    <!-- arms -->
    <path d="M46 68 L30 94" stroke="#e0b48a" stroke-width="12" stroke-linecap="round" fill="none"/>
    <circle cx="30" cy="94" r="7.5" fill="#e0b48a"/>
    <path d="M74 68 L93 52" stroke="#e0b48a" stroke-width="12" stroke-linecap="round" fill="none"/>
    <path d="M38 79 L34 86" stroke="#1f6b41" stroke-width="13" stroke-linecap="butt"/>
    <!-- torso: dark coat open over bare chest -->
    <path d="M42 62 h36 v42 h-36 z" fill="#e0b48a"/>
    <path d="M42 62 h12 v42 h-12 z" fill="#1f242e"/>
    <path d="M66 62 h12 v42 h-12 z" fill="#1f242e"/>
    <path d="M54 62 h12 l-6 10 z" fill="#1f242e"/>
    <!-- haramaki -->
    <rect x="40" y="89" width="40" height="15" rx="3" fill="#2e7d4f"/>
    <rect x="40" y="94" width="40" height="3" fill="#25623f"/>
    <!-- drawn katana in the raised hand -->
    <path d="M97 47 L116 12" stroke="#8a93a6" stroke-width="6" stroke-linecap="round"/>
    <path d="M97 47 L116 12" stroke="#e8eef7" stroke-width="3" stroke-linecap="round"/>
    <path d="M88 58 L100 42" stroke="#2b2b33" stroke-width="7" stroke-linecap="round"/>
    <circle cx="95" cy="50" r="4.5" fill="#f2c14e"/>
    <circle cx="93" cy="53" r="7.5" fill="#e0b48a"/>
    <!-- head -->
    <circle cx="60" cy="42" r="19" fill="#eec49a"/>
    <path d="M41 38 q4 -20 19 -20 q15 0 19 20 q-6 -11 -19 -11 q-13 0 -19 11z" fill="#3f9e5f"/>
    <path d="M41 31 q19 -13 38 0 l0 5 q-19 -12 -38 0z" fill="#2f7d49"/>
    <!-- one open eye, one scarred shut -->
    <circle cx="52" cy="44" r="3.2" fill="#1a1a1a"/>
    <circle cx="53" cy="42.9" r="1" fill="#fff"/>
    <path d="M63 44 h10" stroke="#1a1a1a" stroke-width="2.4" stroke-linecap="round"/>
    <path d="M68 36 l-2 15" stroke="#b07a5c" stroke-width="2.2" stroke-linecap="round"/>
    <path d="M53 55 h14" stroke="#8c5a3c" stroke-width="2.4" stroke-linecap="round"/>
    <!-- earrings -->
    <circle cx="43" cy="50" r="1.8" fill="#f2c14e"/>
    <circle cx="43" cy="55" r="1.8" fill="#f2c14e"/>
    <circle cx="43" cy="60" r="1.8" fill="#f2c14e"/>
  `),

  kaido: () => svg(`
    <!-- legs -->
    <rect x="42" y="102" width="16" height="24" rx="4" fill="#2b3550"/>
    <rect x="63" y="102" width="16" height="24" rx="4" fill="#2b3550"/>
    <rect x="38" y="122" width="22" height="7" rx="3" fill="#3b2b1c"/>
    <rect x="61" y="122" width="22" height="7" rx="3" fill="#3b2b1c"/>
    <!-- arms -->
    <path d="M42 66 L26 96" stroke="#c98d63" stroke-width="15" stroke-linecap="round" fill="none"/>
    <circle cx="26" cy="96" r="9" fill="#c98d63"/>
    <path d="M78 66 L94 82" stroke="#c98d63" stroke-width="15" stroke-linecap="round" fill="none"/>
    <!-- kanabo club, gripped by the right hand -->
    <path d="M88 92 L106 20" stroke="#6a4b2c" stroke-width="14" stroke-linecap="round"/>
    <circle cx="103" cy="32" r="3" fill="#3f2c18"/>
    <circle cx="99" cy="48" r="3" fill="#3f2c18"/>
    <circle cx="96" cy="63" r="3" fill="#3f2c18"/>
    <circle cx="93" cy="80" r="9.5" fill="#c98d63"/>
    <!-- torso -->
    <path d="M36 58 h48 v50 h-48 z" fill="#c98d63"/>
    <path d="M36 58 h48 v13 q-24 11 -48 0 z" fill="#2e5e7d"/>
    <rect x="34" y="97" width="52" height="13" rx="3" fill="#7c2f3a"/>
    <path d="M32 60 q10 -12 22 -4 l-4 12 z" fill="#3d7fa1"/>
    <path d="M88 60 q-10 -12 -22 -4 l4 12 z" fill="#3d7fa1"/>
    <!-- head -->
    <circle cx="60" cy="40" r="20" fill="#d19669"/>
    <!-- horns -->
    <path d="M45 23 q-11 -11 -6 -21 q9 6 13 17z" fill="#b04a3a"/>
    <path d="M75 23 q11 -11 6 -21 q-9 6 -13 17z" fill="#b04a3a"/>
    <!-- long black hair, behind the face -->
    <path d="M40 36 q4 -22 20 -22 q16 0 20 22 q-6 -11 -20 -11 q-14 0 -20 11z" fill="#1b1b22"/>
    <path d="M41 32 q-7 34 1 54 q7 -24 5 -48z" fill="#1b1b22"/>
    <path d="M79 32 q7 34 -1 54 q-7 -24 -5 -48z" fill="#1b1b22"/>
    <!-- face -->
    <path d="M46 34 l11 4" stroke="#1b1b22" stroke-width="2.6" stroke-linecap="round"/>
    <path d="M74 34 l-11 4" stroke="#1b1b22" stroke-width="2.6" stroke-linecap="round"/>
    <circle cx="53" cy="43" r="3" fill="#c02020"/>
    <circle cx="67" cy="43" r="3" fill="#c02020"/>
    <path d="M54 54 h12" stroke="#8c4a34" stroke-width="2.6" stroke-linecap="round"/>
    <!-- drooping mustache, in front of everything -->
    <path d="M56 51 q-12 3 -17 17 q13 -7 18 -13z" fill="#1b1b22"/>
    <path d="M64 51 q12 3 17 17 q-13 -7 -18 -13z" fill="#1b1b22"/>
  `),

  akainu: () => svg(`
    <!-- legs -->
    <rect x="45" y="100" width="14" height="26" rx="3" fill="#23262e"/>
    <rect x="62" y="100" width="14" height="26" rx="3" fill="#23262e"/>
    <rect x="41" y="122" width="20" height="7" rx="3" fill="#15171c"/>
    <rect x="61" y="122" width="20" height="7" rx="3" fill="#15171c"/>
    <!-- arms in the marine coat, ending in magma fists -->
    <path d="M44 66 L28 92" stroke="#f2f0ea" stroke-width="13" stroke-linecap="round" fill="none"/>
    <path d="M76 66 L95 50" stroke="#f2f0ea" stroke-width="13" stroke-linecap="round" fill="none"/>
    <circle cx="27" cy="95" r="10" fill="#e4622c"/>
    <circle cx="27" cy="95" r="6" fill="#f7b23b"/>
    <circle cx="27" cy="95" r="2.5" fill="#fff0c2"/>
    <circle cx="99" cy="47" r="12" fill="#e4622c"/>
    <circle cx="99" cy="47" r="7.5" fill="#f7b23b"/>
    <circle cx="99" cy="47" r="3" fill="#fff0c2"/>
    <path d="M106 35 q5 -9 2 -16 q-3 9 -7 11z" fill="#e4622c"/>
    <path d="M20 84 q-6 -8 -4 -15 q4 8 8 10z" fill="#e4622c"/>
    <!-- marine coat -->
    <path d="M38 60 h44 v50 h-44 z" fill="#f2f0ea"/>
    <path d="M53 60 h14 v50 h-14 z" fill="#b4302a"/>
    <path d="M38 60 h14 l8 13 l8 -13 h14 l-9 15 h-26 z" fill="#e6e2d8"/>
    <path d="M38 60 v50 h5 v-50z" fill="#d8d4c8"/>
    <path d="M77 60 v50 h5 v-50z" fill="#d8d4c8"/>
    <circle cx="60" cy="90" r="7" fill="#e4622c" opacity=".6"/>
    <!-- head -->
    <circle cx="60" cy="42" r="19" fill="#d8a479"/>
    <path d="M41 40 q3 -22 19 -22 q16 0 19 22 q-7 -13 -19 -13 q-12 0 -19 13z" fill="#191919"/>
    <path d="M41 40 v15 l5 -4 v-11z" fill="#191919"/>
    <path d="M79 40 v15 l-5 -4 v-11z" fill="#191919"/>
    <!-- permanently furious face -->
    <path d="M46 37 l11 5" stroke="#191919" stroke-width="2.8" stroke-linecap="round"/>
    <path d="M74 37 l-11 5" stroke="#191919" stroke-width="2.8" stroke-linecap="round"/>
    <circle cx="53" cy="46" r="3" fill="#1a1a1a"/>
    <circle cx="67" cy="46" r="3" fill="#1a1a1a"/>
    <path d="M53 56 q7 -5 14 0" stroke="#7c4a30" stroke-width="2.6" fill="none" stroke-linecap="round"/>
    <path d="M55 59 h10 l-5 9z" fill="#191919"/>
  `)
};

/* ==========================================================================
 * 4. GAME STATE
 * ========================================================================== */

const state = {
  screen: 'select',      // 'select' | 'battle'
  picks: { 1: null, 2: null },
  activePicker: 1,
  fighters: { 1: null, 2: null },
  choices: { 1: null, 2: null },   // pending move indices for this turn
  activeChooser: 1,
  phase: 'idle',         // 'choosing' | 'resolving' | 'over'
  turn: 1,
  busy: false
};

/* Build a fresh battle-ready instance from a roster entry. */
function makeFighter(def, playerNo) {
  return {
    ...def,
    player: playerNo,
    hp: def.maxHp,
    boosts: { atk: 0, def: 0, spd: 0 },
    fainted: false
  };
}

/* Effective stat after boost stacks: base * 1.5^stacks */
function stat(fighter, key) {
  return fighter[key] * Math.pow(BOOST_STEP, fighter.boosts[key]);
}

/* In a mirror match "Zoro used ..." is ambiguous, so prefix the player there. */
function label(fighter) {
  const a = state.fighters[1], b = state.fighters[2];
  const mirror = a && b && a.id === b.id;
  return mirror ? `P${fighter.player} ${fighter.name}` : fighter.name;
}

/* ==========================================================================
 * 5. DOM HANDLES
 * ========================================================================== */

const $  = (sel) => document.querySelector(sel);
const $$ = (sel) => Array.from(document.querySelectorAll(sel));

const el = {
  screenSelect: $('#screen-select'),
  screenBattle: $('#screen-battle'),
  roster:       $('#roster'),
  promptBar:    $('#select-prompt'),
  promptText:   $('#select-prompt-text'),
  pickBody:     { 1: $('#pick-body-1'), 2: $('#pick-body-2') },
  btnUndo:      $('#btn-undo'),
  btnStart:     $('#btn-start'),
  btnTypes:     $('#btn-types'),
  info:         { 1: $('#info-1'), 2: $('#info-2') },
  sprite:       { 1: $('#sprite-1'), 2: $('#sprite-2') },
  slot:         { 1: $('.slot-sprite-ally'), 2: $('.slot-sprite-enemy') },
  log:          $('#log'),
  moves:        $('#moves'),
  moveBtns:     $$('.move-btn'),
  menuHead:     $('#menu-head'),
  menuWho:      $('#menu-who'),
  menuMsg:      $('#menu-msg'),
  lock:         { 1: $('#lock-1'), 2: $('#lock-2') },
  turnBadge:    $('#turn-badge'),
  victory:      $('#victory'),
  victoryText:  $('#victory-text'),
  victorySub:   $('#victory-sub'),
  btnRematch:   $('#btn-rematch'),
  btnPlayAgain: $('#btn-playagain'),
  modalTypes:   $('#modal-types'),
  chartList:    $('#chart-list'),
  btnCloseTypes:$('#btn-close-types')
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/* ==========================================================================
 * 6. CHARACTER SELECT
 * ========================================================================== */

function buildRoster() {
  el.roster.innerHTML = '';
  ROSTER.forEach((c, i) => {
    const card = document.createElement('button');
    card.className = 'char-card';
    card.type = 'button';
    card.dataset.index = String(i);
    card.innerHTML = `
      <div class="card-art">${SPRITES[c.id]()}</div>
      <div class="card-name">${c.name}</div>
      <div><span class="type-badge ${typeClass(c.type)}">${c.type}</span></div>
      <div class="card-hp">
        <span>HP ${c.maxHp}</span><span>ATK ${c.atk}</span>
        <span>DEF ${c.def}</span><span>SPD ${c.spd}</span>
      </div>
    `;
    card.addEventListener('click', () => pickCharacter(i));
    el.roster.appendChild(card);
  });
}

function pickCharacter(index) {
  const player = state.activePicker;
  if (player > 2) return;
  state.picks[player] = ROSTER[index];
  state.activePicker = player === 1 ? 2 : 3;   // 3 == both chosen
  renderSelect();
}

function undoPick() {
  const last = state.activePicker === 3 ? 2 : state.activePicker - 1;
  if (last < 1) return;
  state.picks[last] = null;
  state.activePicker = last;
  renderSelect();
}

function renderSelect() {
  // Panels
  [1, 2].forEach((p) => {
    const c = state.picks[p];
    if (!c) {
      el.pickBody[p].innerHTML = `<div class="pick-empty">— NO FIGHTER —</div>`;
      return;
    }
    el.pickBody[p].innerHTML = `
      <div class="pick-art">${SPRITES[c.id]()}</div>
      <div class="pick-name">${c.name}</div>
      <span class="type-badge ${typeClass(c.type)}">${c.type}</span>
      <div class="pick-stats">
        <div><span>HP</span><span>${c.maxHp}</span></div>
        <div><span>ATTACK</span><span>${c.atk}</span></div>
        <div><span>DEFENSE</span><span>${c.def}</span></div>
        <div><span>SPEED</span><span>${c.spd}</span></div>
      </div>
    `;
  });

  // Ownership flags on the cards
  $$('.char-card').forEach((card) => {
    const c = ROSTER[Number(card.dataset.index)];
    const owners = [1, 2].filter((p) => state.picks[p] && state.picks[p].id === c.id);
    const old = card.querySelector('.taken-flag');
    if (old) old.remove();
    if (owners.length) {
      const flag = document.createElement('div');
      flag.className = 'taken-flag by-' + owners[0];
      flag.textContent = owners.map((o) => 'P' + o).join('+');
      card.appendChild(flag);
    }
  });

  // Prompt + footer buttons
  const done = state.activePicker === 3;
  el.promptBar.classList.toggle('is-p2', state.activePicker === 2);
  el.promptText.textContent = done
    ? 'BOTH FIGHTERS READY — START THE BATTLE!'
    : `PLAYER ${state.activePicker} — CHOOSE YOUR FIGHTER`;
  el.btnUndo.disabled  = state.activePicker === 1;
  el.btnStart.disabled = !done;
  $$('.char-card').forEach((card) => { card.disabled = done; });
}

function buildTypeChart() {
  el.chartList.innerHTML = '';
  Object.entries(SUPER_EFFECTIVE_AGAINST).forEach(([atkType, defType]) => {
    const li = document.createElement('li');
    li.innerHTML = defType
      ? `<span class="type-badge ${typeClass(atkType)}">${atkType}</span>
         <span class="chart-arrow">2.0× →</span>
         <span class="type-badge ${typeClass(defType)}">${defType}</span>`
      : `<span class="type-badge ${typeClass(atkType)}">${atkType}</span>
         <span class="chart-arrow">1.0× →</span>
         <span style="color:#9aa7bf">everything</span>`;
    el.chartList.appendChild(li);
  });
}

/* ==========================================================================
 * 7. BATTLE SETUP
 * ========================================================================== */

function startBattle() {
  state.fighters[1] = makeFighter(state.picks[1], 1);
  state.fighters[2] = makeFighter(state.picks[2], 2);
  state.turn = 1;
  state.choices = { 1: null, 2: null };
  state.activeChooser = 1;
  state.phase = 'choosing';
  state.screen = 'battle';

  el.screenSelect.classList.remove('is-active');
  el.screenBattle.classList.add('is-active');
  el.victory.hidden = true;
  el.log.innerHTML = '';

  [1, 2].forEach((p) => {
    el.sprite[p].innerHTML = SPRITES[state.fighters[p].id]();
    el.sprite[p].classList.remove('fainted');
    renderInfo(p);
  });

  logLine(`Player 1 sent out <b>${state.fighters[1].name}</b>!`, 'l-p1');
  logLine(`Player 2 sent out <b>${state.fighters[2].name}</b>!`, 'l-p2');
  logLine('Both captains pick a move, then the faster fighter strikes first.', 'l-sys');

  updateTurnBadge();
  beginChoosePhase();
}

function renderInfo(p) {
  const f = state.fighters[p];
  const pct = Math.max(0, (f.hp / f.maxHp) * 100);
  const tone = pct <= 20 ? 'low' : pct <= 50 ? 'mid' : '';

  const boostChips = Object.entries(f.boosts)
    .filter(([, n]) => n > 0)
    .map(([k, n]) => `<span class="boost-chip" title="${STAT_LABEL[k]} ×${Math.pow(BOOST_STEP, n).toFixed(2)}">${k.toUpperCase()} +${n}</span>`)
    .join('');

  el.info[p].className = 'infobox is-p' + p;
  el.info[p].innerHTML = `
    <div class="player-chip">P${p}</div>
    <div class="info-row-1">
      <span class="info-name">${f.name}</span>
      <span class="type-badge ${typeClass(f.type)}">${f.type}</span>
    </div>
    <div class="hp-row">
      <span class="hp-label">HP</span>
      <div class="hpbar"><div class="hpfill ${tone}" style="width:${pct}%"></div></div>
    </div>
    <div class="info-row-3">
      <span class="hp-text">${Math.max(0, Math.round(f.hp))} / ${f.maxHp}</span>
      <span class="boosts">${boostChips}</span>
    </div>
  `;
}

/* Animate the HP bar to its current value without rebuilding the whole box. */
function updateHpBar(p) {
  const f = state.fighters[p];
  const fill = el.info[p].querySelector('.hpfill');
  const text = el.info[p].querySelector('.hp-text');
  const pct = Math.max(0, (f.hp / f.maxHp) * 100);
  fill.style.width = pct + '%';
  fill.classList.toggle('mid', pct <= 50 && pct > 20);
  fill.classList.toggle('low', pct <= 20);
  text.textContent = `${Math.max(0, Math.round(f.hp))} / ${f.maxHp}`;
}

function updateTurnBadge() {
  el.turnBadge.textContent = 'TURN ' + state.turn;
}

/* ==========================================================================
 * 8. LOG
 * ========================================================================== */

function logLine(html, cls = '') {
  const p = document.createElement('p');
  p.className = cls;
  p.innerHTML = html;
  el.log.appendChild(p);
  el.log.scrollTop = el.log.scrollHeight;
}

/* ==========================================================================
 * 9. MOVE SELECTION PHASE
 *    Both players lock a move before anything resolves. Player 1's pick stays
 *    hidden while Player 2 chooses, so hot-seat play is fair.
 * ========================================================================== */

function beginChoosePhase() {
  state.phase = 'choosing';
  state.activeChooser = 1;
  state.choices = { 1: null, 2: null };
  updateLockDisplay();
  renderMoveMenu();
}

function renderMoveMenu() {
  const p = state.activeChooser;
  const f = state.fighters[p];

  el.menuHead.classList.toggle('is-p2', p === 2);
  el.menuHead.classList.remove('is-idle');
  el.menuWho.textContent = 'PLAYER ' + p;
  el.menuMsg.textContent = `${f.name} — choose a move`;

  el.moveBtns.forEach((btn, i) => {
    const m = f.moves[i];
    const isStatus = m.category === 'status';
    btn.disabled = false;
    btn.innerHTML = `
      <span class="move-key">${i + 1}</span>
      <span class="move-name">${m.name}</span>
      <span class="move-meta">
        <span class="type-badge ${typeClass(m.type)}">${m.type}</span>
        <span class="move-pow">${isStatus ? '▲ ' + STAT_LABEL[m.stat] : 'PWR ' + m.power}</span>
      </span>
    `;
  });
}

function setMenuIdle(msg) {
  el.menuHead.classList.add('is-idle');
  el.menuWho.textContent = 'BATTLE';
  el.menuMsg.textContent = msg;
  el.moveBtns.forEach((btn) => { btn.disabled = true; });
}

function updateLockDisplay() {
  [1, 2].forEach((p) => {
    const locked = state.choices[p] !== null;
    el.lock[p].classList.toggle('locked', locked);
    el.lock[p].innerHTML = `P${p} <b>${locked ? 'LOCKED IN' : '—'}</b>`;
  });
}

function chooseMove(index) {
  if (state.phase !== 'choosing' || state.busy) return;
  const p = state.activeChooser;
  state.choices[p] = index;
  updateLockDisplay();

  if (p === 1) {
    state.activeChooser = 2;
    renderMoveMenu();
  } else {
    resolveTurn();
  }
}

/* ==========================================================================
 * 10. TURN RESOLUTION
 * ========================================================================== */

function damageOf(attacker, defender, move) {
  const multiplier = typeMultiplier(move.type, defender.type);
  const raw = Math.floor(
    (((stat(attacker, 'atk') / stat(defender, 'def')) * move.power) / 2) * multiplier
  );
  // A boost war can drive the formula to 0; keep chip damage so battles end.
  return { damage: Math.max(1, raw), multiplier };
}

function turnOrder() {
  const s1 = stat(state.fighters[1], 'spd');
  const s2 = stat(state.fighters[2], 'spd');
  if (s1 > s2) return [1, 2];
  if (s2 > s1) return [2, 1];
  return Math.random() < 0.5 ? [1, 2] : [2, 1];   // speed tie -> coin flip
}

async function resolveTurn() {
  state.phase = 'resolving';
  state.busy = true;
  setMenuIdle('resolving turn…');

  const order = turnOrder();
  const s1 = stat(state.fighters[1], 'spd');
  const s2 = stat(state.fighters[2], 'spd');

  logLine(`— Turn ${state.turn} —`, 'l-turn');
  if (s1 === s2) {
    logLine(`Speeds are dead even — Player ${order[0]} wins the coin flip!`, 'l-sys');
  }
  await sleep(500);

  for (const p of order) {
    const attacker = state.fighters[p];
    const other = p === 1 ? 2 : 1;
    const defender = state.fighters[other];

    if (attacker.fainted) continue;      // slower fighter was knocked out first

    await executeMove(attacker, defender, attacker.moves[state.choices[p]]);

    if (defender.fainted) {
      await endBattle(attacker, defender);
      return;
    }
    await sleep(420);
  }

  state.turn++;
  updateTurnBadge();
  state.busy = false;
  beginChoosePhase();
}

async function executeMove(attacker, defender, move) {
  const ap = attacker.player;
  const dp = defender.player;
  const cls = ap === 1 ? 'l-p1' : 'l-p2';

  logLine(`<b>${label(attacker)}</b> used <b>${move.name}</b>!`, cls);

  // --- Status move ------------------------------------------------------
  if (move.category === 'status') {
    await sleep(240);
    if (attacker.boosts[move.stat] >= MAX_BOOSTS) {
      logLine(`${label(attacker)}'s ${STAT_LABEL[move.stat]} won't go any higher!`, 'l-sys');
      await sleep(700);
      return;
    }
    attacker.boosts[move.stat]++;
    el.sprite[ap].classList.add('buffed');
    popup(ap, `${STAT_LABEL[move.stat].toUpperCase()} ▲`, 'buff');
    await sleep(820);
    el.sprite[ap].classList.remove('buffed');
    renderInfo(ap);
    logLine(`${label(attacker)}'s <b>${STAT_LABEL[move.stat]}</b> rose to ${BOOST_STEP}× (×${attacker.boosts[move.stat]})!`, 'l-buff');
    await sleep(520);
    return;
  }

  // --- Damaging move ----------------------------------------------------
  const { damage, multiplier } = damageOf(attacker, defender, move);

  el.sprite[ap].classList.add(ap === 1 ? 'attack-right' : 'attack-left');
  await sleep(280);

  defender.hp = Math.max(0, defender.hp - damage);
  el.sprite[dp].classList.add('hurt');
  popup(dp, '-' + damage, multiplier > 1 ? 'crit-type' : '');
  updateHpBar(dp);

  await sleep(480);
  el.sprite[ap].classList.remove('attack-right', 'attack-left');
  el.sprite[dp].classList.remove('hurt');

  logLine(`It dealt <b>${damage}</b> damage.`, 'l-sys');
  if (multiplier > 1) {
    logLine(`It's super effective! (${multiplier.toFixed(1)}×)`, 'l-eff');
    await sleep(420);
  }

  if (defender.hp <= 0) {
    defender.fainted = true;
    await sleep(300);
    el.sprite[dp].classList.add('fainted');
    logLine(`<b>${label(defender)}</b> fainted!`, 'l-faint');
    await sleep(760);
  }
  renderInfo(dp);
}

/* Floating damage / buff number over a fighter. */
function popup(player, text, extra = '') {
  const node = document.createElement('div');
  node.className = 'dmg-pop ' + extra;
  node.textContent = text;
  node.style.left = '50%';
  node.style.top = '28%';
  node.style.transform = 'translateX(-50%)';
  el.slot[player].appendChild(node);
  setTimeout(() => node.remove(), 1000);
}

/* ==========================================================================
 * 11. WIN CONDITION
 * ========================================================================== */

async function endBattle(winner, loser) {
  state.phase = 'over';
  state.busy = true;
  setMenuIdle('battle over');
  updateLockDisplay();

  logLine(`<b>${label(winner)}</b> wins the clash! (Player ${winner.player})`, 'l-eff');

  await sleep(500);
  el.victoryText.textContent = `${winner.name} wins!`;
  el.victorySub.textContent =
    `Player ${winner.player} takes the victory — ${winner.name} finished with ` +
    `${Math.round(winner.hp)}/${winner.maxHp} HP after ${state.turn} turn${state.turn === 1 ? '' : 's'}. ` +
    `${loser.name} is down.`;
  el.victory.hidden = false;
}

function rematch() {
  startBattle();
}

function backToSelect() {
  state.screen = 'select';
  state.phase = 'idle';
  state.busy = false;
  state.picks = { 1: null, 2: null };
  state.activePicker = 1;
  el.victory.hidden = true;
  el.screenBattle.classList.remove('is-active');
  el.screenSelect.classList.add('is-active');
  renderSelect();
}

/* ==========================================================================
 * 12. WIRING
 * ========================================================================== */

el.moveBtns.forEach((btn) => {
  btn.addEventListener('click', () => chooseMove(Number(btn.dataset.move)));
});

el.btnStart.addEventListener('click', startBattle);
el.btnUndo.addEventListener('click', undoPick);
el.btnRematch.addEventListener('click', rematch);
el.btnPlayAgain.addEventListener('click', backToSelect);

el.btnTypes.addEventListener('click', () => { el.modalTypes.hidden = false; });
el.btnCloseTypes.addEventListener('click', () => { el.modalTypes.hidden = true; });
el.modalTypes.addEventListener('click', (e) => {
  if (e.target === el.modalTypes) el.modalTypes.hidden = true;
});

document.addEventListener('keydown', (e) => {
  if (!el.modalTypes.hidden && e.key === 'Escape') { el.modalTypes.hidden = true; return; }
  if (state.screen !== 'battle' || state.phase !== 'choosing' || state.busy) return;
  const n = Number(e.key);
  if (n >= 1 && n <= 4) {
    e.preventDefault();
    chooseMove(n - 1);
  }
});

/* Boot */
buildRoster();
buildTypeChart();
renderSelect();
