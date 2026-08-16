// Help overlay. Reachable from every screen with H or ?, and from the button in
// the corner of the title screen. Three tabs: controls, how a battle works, and
// the full 18×18 type chart, because that is the thing people actually look up.

import { audio } from '../../audio/audio.js';
import { TYPES, TYPE_COLOR, TYPE_ICON, typeEff1 } from '../../core/types.js';
import { STATUSES } from '../../core/status.js';
import { injectScreenCss, el, esc } from './common.js';
import * as Save from '../../meta/save.js';

const CSS = `
.hlp-wrap{ position:fixed; inset:0; z-index:80; display:flex; align-items:center; justify-content:center;
  background:rgba(3,5,10,.82); backdrop-filter:blur(4px); animation:fadeIn .16s ease both; padding:14px; }
.hlp{ width:min(880px,98vw); max-height:92vh; display:flex; flex-direction:column;
  background:linear-gradient(180deg,#1b2236,#101526); border:3px solid #000; border-radius:18px;
  box-shadow:0 14px 0 rgba(0,0,0,.45), 0 30px 70px rgba(0,0,0,.6); animation:popIn .24s var(--ease-back) both;
  overflow:hidden; }
.hlp-head{ display:flex; align-items:center; gap:12px; padding:13px 16px; border-bottom:2px solid #000;
  background:linear-gradient(180deg,#252e4a,#1a2035); }
.hlp-head .t{ font-family:var(--font-display); font-size:20px; color:var(--gold); text-shadow:0 2px 0 #000; flex:1; }
.hlp-tabs{ display:flex; gap:5px; padding:10px 14px 0; flex-wrap:wrap; }
.hlp-body{ padding:14px 16px 20px; overflow:auto; flex:1; }
.hlp h4{ margin:16px 0 7px; font-size:12px; letter-spacing:.14em; text-transform:uppercase; color:var(--gold); }
.hlp h4:first-child{ margin-top:0; }
.hlp p{ margin:0 0 9px; font-size:14px; line-height:1.55; color:#c9d3e8; max-width:74ch; }
.keys{ display:grid; grid-template-columns:repeat(auto-fill,minmax(230px,1fr)); gap:7px; }
.keyrow{ display:flex; align-items:center; gap:9px; font-size:13.5px; color:#cfd8ea; }
.k{ display:inline-block; min-width:24px; text-align:center; padding:3px 7px; border-radius:6px;
  background:#0e1220; border:2px solid #000; border-bottom-width:3px; font-weight:900; font-size:12px; color:#fff; }
.chart{ overflow:auto; border:2px solid #000; border-radius:10px; background:#0c101c; }
.chart table{ border-collapse:collapse; font-size:9.5px; }
.chart th, .chart td{ width:22px; height:20px; text-align:center; padding:0; border:1px solid rgba(255,255,255,.05); }
.chart th.rowh{ width:64px; text-align:right; padding-right:5px; font-size:9px; letter-spacing:.04em;
  position:sticky; left:0; background:#0c101c; z-index:2; }
.chart th.colh{ height:58px; }
.chart th.colh span{ display:block; writing-mode:vertical-rl; transform:rotate(180deg); font-size:9px; letter-spacing:.04em;
  margin:0 auto; }
.chart td.x2{ background:#2f7a52; color:#d6ffe8; font-weight:900; }
.chart td.x05{ background:#7a3030; color:#ffd6d6; }
.chart td.x0{ background:#111; color:#8d94a8; font-weight:900; }
.chart td.x1{ color:#3c4560; }
.stt{ display:grid; grid-template-columns:repeat(auto-fill,minmax(210px,1fr)); gap:8px; }
.stt .s{ display:flex; gap:9px; align-items:flex-start; font-size:13px; padding:8px 10px; border-radius:9px;
  background:rgba(255,255,255,.04); border-left:4px solid; }
.stt .s b{ display:block; font-size:13.5px; }
.stt .s span{ color:#9fabc6; font-size:12px; }
@media (max-width:700px){
  .hlp{ width:100%; max-height:100%; height:100%; border-radius:0; border-width:0; }
  .chart th.rowh{ width:52px; }
}
`;

let openEl = null;

export function isHelpOpen() { return !!openEl; }

export function closeHelp() {
  if (!openEl) return;
  openEl.remove();
  openEl = null;
  document.removeEventListener('keydown', onKey, true);
}

function onKey(e) {
  if (e.key === 'Escape' || e.key === 'h' || e.key === 'H' || e.key === '?') {
    e.stopPropagation(); e.preventDefault();
    closeHelp();
  }
}

export function openHelp(app, tab = 'controls') {
  if (openEl) { closeHelp(); return; }
  injectScreenCss();
  if (!document.getElementById('help-css')) {
    const s = document.createElement('style'); s.id = 'help-css'; s.textContent = CSS;
    document.head.appendChild(s);
  }

  const wrap = el('div', 'hlp-wrap');
  const box = el('div', 'hlp');
  const head = el('div', 'hlp-head');
  head.appendChild(el('div', 't', 'How to play'));
  const x = el('button', 'btn sm ghost', '✕');
  x.onclick = () => { audio.sfx('ui_back'); closeHelp(); };
  head.appendChild(x);

  const tabs = el('div', 'hlp-tabs');
  const body = el('div', 'hlp-body');
  box.append(head, tabs, body);
  wrap.appendChild(box);
  wrap.onclick = (e) => { if (e.target === wrap) closeHelp(); };

  const PAGES = {
    controls: ['Controls', renderControls],
    battle: ['Battle rules', renderBattle],
    chart: ['Type chart', renderChart],
    building: ['Team building', renderBuilding]
  };

  let cur = tab;
  const draw = () => {
    tabs.innerHTML = '';
    for (const [id, [label]] of Object.entries(PAGES)) {
      const t = el('button', `tab ${id === cur ? 'on' : ''}`, label);
      t.onclick = () => { audio.sfx('ui_move'); cur = id; draw(); };
      tabs.appendChild(t);
    }
    body.innerHTML = '';
    body.appendChild(PAGES[cur][1](app));
    body.scrollTop = 0;
  };
  draw();

  document.body.appendChild(wrap);
  document.addEventListener('keydown', onKey, true);
  openEl = wrap;
  Save.patch((s) => { s.tutorial.seenHelp = true; });
  return wrap;
}

/* ------------------------------------------------------------------ */

function renderControls() {
  const d = el('div');
  d.innerHTML = `
    <h4>Anywhere</h4>
    <div class="keys">
      <div class="keyrow"><span class="k">H</span> Open or close this help</div>
      <div class="keyrow"><span class="k">Esc</span> Back one screen</div>
      <div class="keyrow"><span class="k">M</span> Mute / unmute</div>
      <div class="keyrow"><span class="k">Tab</span> Move focus · <span class="k">Enter</span> Activate</div>
    </div>
    <h4>In battle</h4>
    <div class="keys">
      <div class="keyrow"><span class="k">↑↓←→</span> Move the cursor</div>
      <div class="keyrow"><span class="k">Enter</span> Confirm · <span class="k">Esc</span> Cancel</div>
      <div class="keyrow"><span class="k">Space</span> Skip the text crawl</div>
      <div class="keyrow"><span class="k">1</span>–<span class="k">4</span> Pick that move directly</div>
    </div>
    <h4>On the title screen</h4>
    <div class="keys">
      <div class="keyrow"><span class="k">Enter</span> Jump straight into a Quick Battle</div>
    </div>
    <h4>Touch</h4>
    <p>Everything is tappable. Battle speed lives in the top-right of the battle screen — 4× makes a
    long fight go quickly without skipping the animation you actually want to see.</p>`;
  return d;
}

function renderBattle() {
  const d = el('div');
  d.innerHTML = `
    <h4>The turn</h4>
    <p>Both sides choose at the same time, then the engine resolves. Priority wins first; after that,
    Speed decides. A switch always happens before any attack, which is what makes switching a real
    decision rather than a free escape.</p>
    <h4>Damage</h4>
    <p>Damage scales with the attacker's Attack (physical) or Sp. Atk (special) against the matching
    defence, the move's power, a same-type bonus of 1.5×, and the type chart. Critical hits ignore the
    defender's positive stat boosts and multiply by 1.5.</p>
    <h4>Switching</h4>
    <p>Switching costs your whole turn, so you eat one hit. You do it anyway when the fighter coming in
    resists what the opponent is holding — that is the core loop of the whole genre.</p>
    <h4>Status</h4>
    <div class="stt">${Object.entries(STATUSES).map(([id, s]) => `
      <div class="s" style="border-color:${s.color}">
        <div><b style="color:${s.color}">${s.short} — ${s.name}</b>
        <span>${statusBlurb(id)}</span></div>
      </div>`).join('')}</div>
    <h4>The field</h4>
    <p>Weather, terrain, screens and hazards persist for several turns and affect both sides. Hazards
    hurt whatever switches in — which is why a hazard on the enemy side punishes them for playing
    the switching game correctly.</p>`;
  return d;
}

function statusBlurb(id) {
  return {
    brn: 'Chips 1/16 max HP each turn. FLAME types cannot be burned.',
    psn: 'Chips 1/8 max HP each turn. TOXIN types are immune.',
    tox: 'Escalates: 1/16, then 2/16, then 3/16… it snowballs.',
    par: 'A quarter of your turns are lost outright. STORM types are immune.',
    slp: 'No actions for 1–3 turns. The single most swingy status.',
    frz: 'Frozen solid with a 20% thaw chance each turn. FROST types are immune.'
  }[id] || '';
}

function renderChart() {
  const d = el('div');
  d.appendChild(el('p', null,
    'Rows attack, columns defend. Green is 2×, red is ½×, black is immune. Dual types multiply, so 4× and ¼× both exist.'));
  const box = el('div', 'chart');
  const table = el('table');
  const head = el('tr');
  head.appendChild(el('th', 'rowh', ''));
  for (const t of TYPES) {
    const th = el('th', 'colh');
    th.innerHTML = `<span style="color:${TYPE_COLOR[t]}">${t}</span>`;
    head.appendChild(th);
  }
  table.appendChild(head);
  for (const a of TYPES) {
    const tr = el('tr');
    const th = el('th', 'rowh');
    th.innerHTML = `<span style="color:${TYPE_COLOR[a]}">${TYPE_ICON[a]} ${a}</span>`;
    tr.appendChild(th);
    for (const b of TYPES) {
      const v = typeEff1(a, b);
      const cls = v === 0 ? 'x0' : v > 1 ? 'x2' : v < 1 ? 'x05' : 'x1';
      tr.appendChild(el('td', cls, v === 1 ? '·' : v === 0 ? '0' : v === 2 ? '2' : '½'));
    }
    table.appendChild(tr);
  }
  box.appendChild(table);
  d.appendChild(box);
  return d;
}

function renderBuilding() {
  const d = el('div');
  d.innerHTML = `
    <h4>Four moves, and that is the whole puzzle</h4>
    <p>Every fighter carries exactly four moves from its learnset. Three attacks and one utility move is
    the usual shape: you want coverage against what resists your main attack, and a way to change the
    board when the matchup is bad.</p>
    <h4>Training points (EVs)</h4>
    <p>508 points to spend, 252 maximum in one stat, and every 4 points is worth 1 point of that stat at
    level 50. Two stats at 252 and the rest spare is the standard spread. The builder shows the stat
    move as you spend, so you can find the exact point where a slider stops buying anything.</p>
    <h4>Nature</h4>
    <p>A nature raises one stat 10% and lowers another 10%. Dumping the stat you never use — Attack on a
    special attacker — is free value.</p>
    <h4>Potential (IVs)</h4>
    <p>0–31 per stat, 31 by default. Lowering Speed on purpose is a real tactic when you want to move
    last; everything else you leave alone.</p>
    <h4>Trading teams</h4>
    <p>Every saved crew can be exported as a short code. Send it to a friend, they paste it into the
    builder, and they have your exact team — moves, spreads, items and all.</p>`;
  return d;
}
