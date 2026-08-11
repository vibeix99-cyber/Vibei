// Battle command menus: root FIGHT/BAG/SWITCH/RUN, move grid, party list, bag.
//
// Layout contract (theme.css): everything lives in the bottom dock. On wide
// screens the dock is [wide pane | command cluster]; on phone portrait it
// stacks [pane above | command grid below]. `body[data-cmd]` tells the rest of
// the UI which mode the dock is in so the text box and name plates can move out
// of the way. Nothing here is ever allowed to sit on top of the text box.
//
// Input: every control is a real <button>, reachable by pointer, touch and
// keyboard. Arrow keys wrap, Enter/Space selects, Escape/Backspace goes back,
// 1-4 jump straight to a slot, and holding a move card (or hovering it) opens
// the full move detail without leaving the menu.

import { TYPE_COLOR, TYPE_ICON, typeEff, effLabel } from '../core/types.js';
import { getMove } from '../data/moves.js';
import { getItem } from '../data/items.js';
import { STATUSES } from '../core/status.js';
import { damageRange } from '../core/damage.js';
import { audio } from '../audio/audio.js';

const CSS = `
/* ================= shared dock slots ================= */
.cmdroot, .movegrid, .mvinfo{ position:absolute; z-index:var(--z-menu); }

/* ---------------- root command cluster ---------------- */
.cmdroot{
  right:var(--edge); bottom:var(--edge-b); width:var(--cmd-w); height:var(--cmd-h);
  display:grid; grid-template-columns:1fr 1fr; grid-template-rows:1fr 1fr; gap:var(--gap);
  animation:slideUp .2s var(--ease-out) both;
}
.cmdbtn{
  font-family:var(--font-ui); font-weight:800; font-size:clamp(13px,1.5vw,20px);
  letter-spacing:.05em; text-transform:uppercase;
  min-height:var(--tap); padding:6px 8px; border-radius:13px; border:var(--bd) solid var(--edge-ink);
  background:linear-gradient(180deg,#fdfbf3,#ded7c2); color:var(--text);
  box-shadow:var(--lip), 0 8px 20px rgba(0,0,0,.4); cursor:pointer;
  display:flex; align-items:center; justify-content:center; gap:7px;
  transition:transform .1s var(--ease-out), filter .1s, box-shadow .1s;
  overflow:hidden; white-space:nowrap;
}
.cmdbtn .ico{ font-size:1.15em; line-height:1; }
.cmdbtn:hover:not(:disabled){ transform:translateY(-2px); filter:brightness(1.06); }
.cmdbtn.sel{ transform:translateY(-2px); filter:brightness(1.08); }
.cmdbtn:active:not(:disabled){ transform:translateY(2px); box-shadow:var(--lip-sm); }
.cmdbtn:disabled{ opacity:.45; cursor:not-allowed; filter:grayscale(.6); }
.cmdbtn.fight{ background:linear-gradient(180deg,#ff9d6b,#e0522b); color:#fff; text-shadow:0 2px 0 rgba(0,0,0,.35); }
.cmdbtn.party{ background:linear-gradient(180deg,#9fd8ff,#4a9fe0); }
.cmdbtn.bag{ background:linear-gradient(180deg,#ffe8a8,#e0b23a); }
.cmdbtn.run{ background:linear-gradient(180deg,#c9d0e0,#98a2ba); }

/* ---------------- move grid ---------------- */
.movegrid{
  left:var(--edge); right:var(--dock-r); bottom:var(--edge-b); height:var(--pane-h);
  display:grid; grid-template-columns:1fr 1fr; grid-template-rows:1fr 1fr; gap:var(--gap);
  animation:slideUp .2s var(--ease-out) both;
}
.movecard{
  position:relative; text-align:left; padding:5px 9px 5px 13px; min-width:0; min-height:var(--tap);
  border-radius:12px; border:var(--bd) solid var(--edge-ink); cursor:pointer;
  background:linear-gradient(180deg,#fdfbf3,#e6e0cd); color:var(--text);
  box-shadow:var(--lip), 0 8px 18px rgba(0,0,0,.35);
  display:flex; flex-direction:column; justify-content:center; gap:2px;
  transition:transform .1s var(--ease-out), filter .1s, box-shadow .1s;
  overflow:hidden; font-family:var(--font-ui);
}
.movecard::before{ content:''; position:absolute; left:0; top:0; bottom:0; width:6px; background:var(--tc,#999); }
.movecard:hover:not(:disabled){ transform:translateY(-2px); filter:brightness(1.05); }
.movecard.sel{ transform:translateY(-2px); filter:brightness(1.06); }
.movecard:active:not(:disabled){ transform:translateY(2px); box-shadow:var(--lip-sm); }
.movecard:disabled,.movecard.unusable{ opacity:.5; cursor:not-allowed; filter:grayscale(.75); }
.movecard.unusable::after{
  content:'NO PP'; position:absolute; right:8px; top:50%; transform:translateY(-50%) rotate(-8deg);
  font-size:13px; font-weight:900; letter-spacing:.1em; color:rgba(160,20,20,.55);
  border:2px solid rgba(160,20,20,.45); border-radius:5px; padding:1px 6px; pointer-events:none;
}
.movecard.empty{ background:repeating-linear-gradient(135deg,#dcd7c6 0 8px,#d3cdba 8px 16px); box-shadow:var(--lip-sm); cursor:default; }

.mv-top{ display:flex; align-items:baseline; gap:6px; min-width:0; }
.mv-name{
  font-weight:800; font-size:clamp(12.5px,1.35vw,18px); line-height:1.08; letter-spacing:0;
  overflow:hidden; text-overflow:ellipsis; white-space:nowrap; min-width:0; flex:1 1 auto;
}
.mv-pp{
  margin-left:auto; flex:0 0 auto; font-variant-numeric:tabular-nums; font-weight:800;
  font-size:11px; color:#5c6178; white-space:nowrap;
}
.mv-pp b{ font-size:12.5px; }
.mv-pp.low{ color:#c2601b; } .mv-pp.crit{ color:var(--blood); }
.mv-pp.crit b{ animation:lowHpBlink 1s infinite; }

.mv-stats{ display:flex; align-items:center; gap:5px; min-width:0; overflow:hidden; }
.mv-cat{
  font-size:9px; font-weight:900; letter-spacing:.06em; padding:1px 4px; border-radius:3px;
  border:1.5px solid rgba(0,0,0,.5); color:#0b0d14; flex:0 0 auto;
}
.mv-cat.physical{ background:#e8a04c; } .mv-cat.special{ background:#8fb8f0; } .mv-cat.status{ background:#cfc9b8; }
.mv-fig{ font-size:10.5px; font-weight:800; color:#5c6178; white-space:nowrap; font-variant-numeric:tabular-nums; }
.mv-fig b{ font-size:12px; color:#333a52; }

/* effectiveness read as information, not a badge */
.mv-eff{ display:flex; align-items:center; gap:6px; min-width:0; }
.mv-effx{
  font-weight:900; font-size:11px; letter-spacing:.04em; padding:0 5px; border-radius:4px;
  color:#0b0d14; background:#cfd3dd; flex:0 0 auto; white-space:nowrap;
}
.movecard[data-eff="quad"]    .mv-effx{ background:var(--eff-quad); color:#04240f; }
.movecard[data-eff="super"]   .mv-effx{ background:var(--eff-super); color:#04240f; }
.movecard[data-eff="weak"]    .mv-effx{ background:var(--eff-weak); color:#2a1403; }
.movecard[data-eff="quarter"] .mv-effx{ background:var(--eff-quarter); color:#fff2e6; }
.movecard[data-eff="immune"]  .mv-effx{ background:var(--eff-immune); color:#fff; }
.movecard[data-eff="quad"], .movecard[data-eff="super"]{ background:linear-gradient(180deg,#f4fff7,#dceedf); }
.movecard[data-eff="immune"]{ background:linear-gradient(180deg,#eeeef2,#d8d8de); }

/* damage forecast: the track is the foe's *remaining* HP, the bar is this move */
.mv-cast{
  position:relative; flex:1 1 auto; height:7px; min-width:34px; border-radius:99px;
  background:#c3bda9; border:1.5px solid rgba(0,0,0,.45); overflow:hidden;
}
.mv-cast i{ position:absolute; left:0; top:0; bottom:0; background:linear-gradient(180deg,#ff8a5c,#d6431f); }
.mv-cast u{ position:absolute; top:0; bottom:0; background:repeating-linear-gradient(135deg,rgba(255,255,255,.65) 0 3px,transparent 3px 6px); }
.mv-cast.ko i{ background:linear-gradient(180deg,#ff5f5f,#a80f0f); }
.mv-castnum{ flex:0 0 auto; font-size:10px; font-weight:900; color:#4a4f66; white-space:nowrap; font-variant-numeric:tabular-nums; }
.mv-castnum.ko{ color:#b31c1c; }
.mv-desc{
  display:none; font-size:11.5px; color:#4a4f66; line-height:1.2;
  overflow:hidden; text-overflow:ellipsis; white-space:nowrap;
}
@media (min-height:700px){ .mv-desc{ display:block; } }

/* ---------------- move info panel (lives where the command cluster was) ---------------- */
.mvinfo{
  right:var(--edge); bottom:var(--edge-b); width:var(--cmd-w); height:var(--cmd-h);
  display:flex; flex-direction:column; gap:4px; padding:8px 10px;
  background:linear-gradient(180deg,var(--panel-dark) 0%,#0f1322 100%);
  border:var(--bd) solid var(--edge-ink); border-radius:13px; color:var(--text-inv);
  box-shadow:var(--lip), 0 10px 26px rgba(0,0,0,.5), inset 0 0 0 1px rgba(255,255,255,.07);
  animation:slideUp .2s var(--ease-out) both; overflow:hidden;
}
.mvi-head{ display:flex; align-items:center; gap:6px; min-width:0; }
.mvi-name{ font-weight:800; font-size:14px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.mvi-row{ display:flex; gap:6px; flex-wrap:wrap; font-size:10.5px; font-weight:800; color:var(--text-dim-inv); }
.mvi-row span b{ color:#fff; font-size:11.5px; }
.mvi-desc{
  font-size:11.5px; line-height:1.25; color:#dfe4f2; flex:1 1 auto; min-height:0; overflow:hidden;
  display:-webkit-box; -webkit-box-orient:vertical; -webkit-line-clamp:3;
}
.mvi-hint{ font-size:10px; color:#7b839c; letter-spacing:.04em; }
.backbtn{
  flex:0 0 auto; min-height:var(--tap); padding:6px 14px; border-radius:10px;
  border:var(--bd) solid var(--edge-ink); background:linear-gradient(180deg,#c9d0e0,#98a2ba);
  color:var(--text); font-family:var(--font-ui); font-weight:800; font-size:14px; letter-spacing:.04em;
  cursor:pointer; box-shadow:var(--lip-sm); white-space:nowrap;
}
.backbtn:hover{ filter:brightness(1.07); }
.backbtn.sel{ filter:brightness(1.1); }
.backbtn:active{ transform:translateY(2px); box-shadow:none; }

/* ---------------- full move detail sheet (hover dwell / long press) ---------------- */
.mvsheet{
  position:absolute; z-index:var(--z-sheet);
  left:50%; transform:translateX(-50%);
  bottom:calc(var(--dock-top) + var(--gap) + 4px);
  width:min(560px, calc(100% - 2 * var(--edge)));
  max-height:calc(100vh - var(--dock-top) - var(--edge-t) - 20px);
  padding:10px 14px 12px; border-radius:14px; border:var(--bd) solid var(--edge-ink);
  background:linear-gradient(180deg,#20263c 0%,#0d1120 100%); color:var(--text-inv);
  box-shadow:var(--lip), var(--shadow-3), inset 0 0 0 1px rgba(255,255,255,.08);
  animation:popIn .16s var(--ease-back) both; overflow:hidden;
  display:flex; flex-direction:column; gap:5px;
}
.mvsheet h4{ margin:0; font-size:16px; font-weight:800; display:flex; align-items:center; gap:7px; flex-wrap:wrap; }
.mvsheet .sh-row{ display:flex; gap:8px; flex-wrap:wrap; font-size:11px; font-weight:800; color:var(--text-dim-inv); }
.mvsheet .sh-row b{ color:#fff; }
.mvsheet .sh-desc{ font-size:12.5px; line-height:1.3; color:#e6eaf6; }
.mvsheet .sh-fx{ display:flex; gap:5px; flex-wrap:wrap; }
.mvsheet .sh-tag{ font-size:10px; font-weight:800; letter-spacing:.04em; padding:2px 7px; border-radius:99px; background:#2f3757; color:#cfd8f5; border:1px solid rgba(255,255,255,.12); }
.mvsheet .sh-flav{ font-size:11.5px; font-style:italic; color:#9aa3bd; line-height:1.25;
  display:-webkit-box; -webkit-box-orient:vertical; -webkit-line-clamp:2; overflow:hidden; }
.mvsheet .sh-close{ position:absolute; right:8px; top:6px; font-size:10px; color:#7b839c; letter-spacing:.08em; }
@media (max-height:520px){
  .mvsheet{ padding:7px 11px 8px; gap:3px; }
  .mvsheet h4{ font-size:14px; }
  .mvsheet .sh-desc{ font-size:11.5px; }
  .mvsheet .sh-flav{ -webkit-line-clamp:1; }
}

/* ---------------- list panels (party / bag) ---------------- */
.listpanel{
  position:absolute; z-index:var(--z-modal);
  left:50%; top:50%; transform:translate(-50%,-50%);
  width:min(660px, calc(100% - 2 * var(--edge)));
  max-height:calc(100% - var(--edge-t) - var(--edge-b));
  overflow:auto; padding:12px 14px 14px;
  background:linear-gradient(180deg,var(--panel-dark),#0f1322);
  border:var(--bd) solid var(--edge-ink); border-radius:16px;
  box-shadow:0 20px 60px rgba(0,0,0,.7); animation:popIn .18s var(--ease-back) both;
  display:flex; flex-direction:column; gap:6px;
}
.listpanel h3{
  margin:0 0 2px; font-family:var(--font-display); font-size:clamp(15px,2.2vw,21px);
  letter-spacing:.04em; color:var(--gold); display:flex; align-items:center; gap:8px;
}
.listpanel h3 .sub{ font-family:var(--font-ui); font-size:11px; letter-spacing:.06em; color:var(--text-dim-inv); font-weight:700; }
.listrow{
  display:flex; align-items:center; gap:10px; min-height:var(--tap);
  padding:6px 10px; border-radius:11px; border:2px solid var(--edge-ink);
  background:var(--panel-dark2); color:var(--text-inv); cursor:pointer; width:100%;
  font-family:var(--font-ui); text-align:left;
  transition:transform .1s var(--ease-out), background .1s;
}
.listrow:hover:not(:disabled){ background:#2f3757; transform:translateX(3px); }
.listrow.sel{ background:#38416a; }
.listrow:disabled{ opacity:.42; cursor:not-allowed; }
.listrow .pnm{ font-weight:800; font-size:clamp(13px,1.5vw,16px); min-width:88px; max-width:34%; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.listrow .plv{ font-size:10.5px; opacity:.65; font-weight:700; }
.listrow .ptypes{ display:flex; gap:3px; flex:0 0 auto; }
.listrow .phpbar{ position:relative; flex:1 1 60px; min-width:44px; height:9px; border-radius:99px; background:#12141f; overflow:hidden; border:2px solid var(--edge-ink); }
.listrow .phpbar i{ position:absolute; inset:0 auto 0 0; }
.listrow .phptxt{ font-variant-numeric:tabular-nums; font-weight:800; font-size:11.5px; min-width:62px; text-align:right; flex:0 0 auto; }
.listrow .pflag{ font-size:9px; font-weight:900; padding:1px 5px; border-radius:4px; color:#0b0d14; flex:0 0 auto; }
.listrow .bnm{ font-weight:800; font-size:14px; }
.listrow .bdesc{ font-size:11px; color:var(--text-dim-inv); overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.listrow .bqty{ margin-left:auto; font-weight:900; font-size:14px; flex:0 0 auto; }
.listrow .bcol{ display:flex; flex-direction:column; gap:1px; min-width:0; flex:1 1 auto; }
.listempty{ padding:14px 8px; color:var(--text-dim-inv); font-size:14px; }
.listfoot{ display:flex; gap:8px; margin-top:2px; }
.listfoot .backbtn{ flex:1 1 auto; }
@media (max-height:520px){
  .listpanel{ padding:8px 10px 10px; gap:4px; }
  .listrow{ min-height:var(--tap); padding:3px 8px; gap:7px; }
  .listrow .phptxt{ min-width:56px; font-size:11px; }
}

/* ---------------- phone portrait: the dock stacks ---------------- */
@media (orientation:portrait) and (max-width:820px){
  .cmdroot{ left:var(--edge); right:var(--edge); width:auto; height:var(--cmd-h); }
  /* the move grid takes the tall slot, its info strip sits above it */
  .movegrid{ left:var(--edge); right:var(--edge); bottom:var(--edge-b); height:var(--cmd-h); }
  .mvinfo{
    left:var(--edge); right:var(--edge); width:auto; height:var(--pane-h);
    bottom:calc(var(--edge-b) + var(--cmd-h) + var(--gap));
    flex-direction:row; align-items:center; gap:8px; padding:5px 8px;
  }
  .mvinfo .mvi-body{ flex:1 1 auto; min-width:0; display:flex; flex-direction:column; gap:1px; }
  .mvi-desc{ -webkit-line-clamp:2; font-size:11px; }
  .mvinfo .backbtn{ align-self:stretch; padding:6px 12px; }
  .mvsheet{ bottom:calc(var(--dock-top) + var(--gap) + 4px); }
}
`;

function ensureCss() {
  if (document.getElementById('menus-css')) return;
  const s = document.createElement('style'); s.id = 'menus-css'; s.textContent = CSS;
  document.head.appendChild(s);
}

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => (
  { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function badgeHtml(t, cls = 'xs') {
  return `<span class="type-badge ${cls}" style="background:${TYPE_COLOR[t] || '#999'}">${TYPE_ICON[t] || ''} ${esc(t)}</span>`;
}

const EFF_X = { quad: '×4', super: '×2', neutral: '×1', weak: '×½', quarter: '×¼', immune: '×0' };
const EFF_WORD = {
  quad: 'DEVASTATING', super: 'SUPER EFFECTIVE', neutral: 'NEUTRAL',
  weak: 'RESISTED', quarter: 'BARELY SCRATCHES', immune: 'NO EFFECT'
};
const TARGET_WORD = {
  foe: 'The foe', self: 'Itself', field: 'The field',
  foeSide: "Foe's side", allySide: 'Your side', all: 'Everyone'
};

/** Damage forecast for a move against the current foe, as a % of its live HP. */
function forecast(mv, ctx) {
  if (!mv || mv.category === 'status' || !mv.power) return null;
  const user = ctx.active, target = ctx.foe;
  if (!user || !target || !ctx.field) return null;
  try {
    const r = damageRange({
      move: mv, user, target, field: ctx.field,
      side: ctx.sideState, foeSide: ctx.foeSideState, crit: false, rng: null
    });
    if (r.immune) return { immune: true };
    const hp = Math.max(1, target.hp);
    const hits = Array.isArray(mv.hits) ? mv.hits : null;
    const lo = r.min * (hits ? hits[0] : 1);
    const hi = r.max * (hits ? hits[1] : 1);
    return {
      lo, hi,
      loPct: Math.min(1, lo / hp), hiPct: Math.min(1, hi / hp),
      ko: lo >= hp, mayKo: hi >= hp
    };
  } catch { return null; }
}

export class CommandMenu {
  constructor(root) {
    ensureCss();
    this.root = root;
    this.el = null;
    this.extras = [];
    this._dwells = new Set();     // armed hover-dwell timers, see _wireDetail
    this.onChoice = null;
    this.mode = null;
    this.sel = 0;
    this.cols = 1;
    this.items = [];
    this.ctx = null;
    this.sheet = null;
    this._pressTimer = null;
    this._suppressClick = false;
    this._setDockMode('none');
  }

  /* ---------------- plumbing ---------------- */

  _setDockMode(m) { document.body.dataset.cmd = m; }

  clear() {
    this._closeSheet();
    this._cancelDwells();
    clearTimeout(this._pressTimer);
    if (this.el) { this.el.remove(); this.el = null; }
    for (const e of this.extras) e.remove();
    this.extras = [];
    this.items = [];
    this.mode = null;
    this.forced = false;
    this.$info = null;
    this._setDockMode('none');
  }

  /** Register an activatable control. */
  _add(el, activate, { disabled = false, onFocus = null } = {}) {
    const item = { el, activate, disabled, onFocus };
    const idx = this.items.length;
    this.items.push(item);
    el.addEventListener('pointerenter', (e) => {
      if (e.pointerType === 'touch') return;
      this._keyboard = false;
      if (this.sel !== idx) this._focus(idx, true);
    });
    el.addEventListener('click', () => {
      if (this._suppressClick) { this._suppressClick = false; return; }
      this._keyboard = false;
      this._focus(idx, false);
      this._activate(idx);
    });
    return item;
  }

  _activate(i) {
    const it = this.items[i];
    if (!it) return;
    if (it.disabled) { audio.sfx('ui_error'); this._shake(it.el); return; }
    audio.sfx('ui_select');
    it.activate();
  }

  _shake(el) {
    el.style.animation = 'none';
    void el.offsetWidth;
    el.style.animation = 'shakeX .3s ease';
    setTimeout(() => { el.style.animation = ''; }, 320);
  }

  _focus(i, sound) {
    if (!this.items.length) return;
    const n = this.items.length;
    const next = ((i % n) + n) % n;
    if (next === this.sel && this.items[next]?.el.classList.contains('sel')) return;
    this.sel = next;
    this.items.forEach((it, k) => {
      it.el.classList.toggle('sel', k === next);
      it.el.classList.toggle('ring-sel', k === next && this._keyboard);
    });
    const el = this.items[next].el;
    try { el.focus({ preventScroll: true }); } catch { /* older engines */ }
    this.items[next].onFocus?.();
    if (sound) audio.sfx('ui_move');
  }

  /* ---------------- root ---------------- */

  showRoot(ctx) {
    this.clear();
    this.ctx = ctx;
    this.mode = 'root';
    this._setDockMode('root');
    const d = document.createElement('div');
    d.className = 'cmdroot';
    const mk = (cls, ico, label, fn, dis) => {
      const b = document.createElement('button');
      b.className = `cmdbtn ${cls}`;
      b.type = 'button';
      b.disabled = !!dis;
      b.innerHTML = `<span class="ico">${ico}</span><span>${label}</span>`;
      b.setAttribute('aria-label', label);
      d.appendChild(b);
      this._add(b, fn, { disabled: !!dis });
      return b;
    };
    mk('fight', '⚔', 'Fight', () => this.showMoves(ctx));
    mk('bag', '🎒', 'Bag', () => this.showBag(ctx));
    mk('party', '🔄', 'Switch', () => this.showParty(ctx));
    mk('run', '🏳', ctx.noRun ? 'No Run' : 'Forfeit', () => this.onChoice?.({ kind: 'run' }), ctx.noRun);
    this.root.appendChild(d);
    this.el = d;
    this.cols = 2;
    this._focus(0, false);
  }

  /* ---------------- moves ---------------- */

  showMoves(ctx) {
    this.clear();
    this.ctx = ctx;
    this.mode = 'moves';
    this._setDockMode('moves');
    const mon = ctx.active;
    const grid = document.createElement('div');
    grid.className = 'movegrid';

    const info = document.createElement('div');
    info.className = 'mvinfo';
    info.innerHTML = `
      <div class="mvi-body">
        <div class="mvi-head"><span class="mvi-name">—</span></div>
        <div class="mvi-row"></div>
        <div class="mvi-desc"></div>
      </div>
      <button class="backbtn" type="button">← Back</button>`;
    this.$info = info;

    const slots = (mon.moves || []).slice(0, 4);
    slots.forEach((slot, i) => {
      const mv = getMove(slot.id);
      const card = document.createElement('button');
      card.type = 'button';
      card.className = 'movecard';
      if (!mv) {
        card.classList.add('empty');
        card.disabled = true;
        grid.appendChild(card);
        return;
      }
      const noPp = slot.pp <= 0;
      const disabled = noPp || slot.disabled;
      // Unusable moves stay focusable (like the source material) but refuse and
      // buzz when picked, instead of silently vanishing from the grid.
      if (disabled) card.classList.add('unusable');
      card.style.setProperty('--tc', TYPE_COLOR[mv.type] || '#999');
      const eff = mv.category === 'status' ? null : typeEff(mv.type, ctx.foe?.types || []);
      const lbl = eff === null ? null : effLabel(eff);
      if (lbl) card.dataset.eff = lbl;
      const ppRatio = slot.pp / Math.max(1, slot.maxPp);
      const ppCls = slot.pp === 0 ? 'crit' : ppRatio <= 0.25 ? 'low' : '';
      const fc = forecast(mv, ctx);

      let castHtml = '';
      if (mv.category === 'status') {
        castHtml = `<span class="mv-castnum">STATUS</span>`;
      } else if (fc && fc.immune) {
        castHtml = `<span class="mv-castnum">no damage</span>`;
      } else if (fc) {
        const lo = Math.round(fc.loPct * 100), hi = Math.round(fc.hiPct * 100);
        castHtml =
          `<span class="mv-cast ${fc.ko ? 'ko' : ''}"><i style="width:${lo}%"></i>` +
          `<u style="left:${lo}%;width:${Math.max(0, hi - lo)}%"></u></span>` +
          `<span class="mv-castnum ${fc.ko ? 'ko' : ''}">${fc.ko ? 'KO' : fc.mayKo ? `${lo}–${hi}% ⚠` : `${lo}–${hi}%`}</span>`;
      }

      card.innerHTML = `
        <span class="mv-top">
          <span class="mv-name">${esc(mv.name)}</span>
          <span class="mv-pp ${ppCls}"><b>${slot.pp}</b>/${slot.maxPp}</span>
        </span>
        <span class="mv-stats">
          ${badgeHtml(mv.type)}
          <span class="mv-cat ${mv.category}">${mv.category.slice(0, 3).toUpperCase()}</span>
          <span class="mv-fig"><b>${mv.power || '—'}</b> pwr</span>
          <span class="mv-fig"><b>${mv.accuracy === null ? '∞' : mv.accuracy}</b> acc</span>
        </span>
        <span class="mv-eff">
          <span class="mv-effx">${EFF_X[lbl] || '×1'}</span>
          ${castHtml}
        </span>
        <span class="mv-desc">${esc(mv.desc || mv.flavor || '')}</span>`;
      card.setAttribute('aria-label',
        `${mv.name}, ${mv.type}, ${mv.category}, power ${mv.power || 0}, accuracy ${mv.accuracy ?? 'never misses'}, ${slot.pp} of ${slot.maxPp} PP${lbl && lbl !== 'neutral' ? ', ' + EFF_WORD[lbl] : ''}`);

      grid.appendChild(card);
      this._add(card, () => {
        if (disabled) { audio.sfx('ui_error'); this._shake(card); return; }
        this.onChoice?.({ kind: 'move', moveId: slot.id });
      }, { disabled, onFocus: () => this._describe(mv, slot, lbl, fc) });
      this._wireDetail(card, mv, slot, lbl, fc);
    });

    // pad the grid so the 2×2 shape holds even with 1–3 moves
    for (let i = slots.length; i < 4; i++) {
      const pad = document.createElement('div');
      pad.className = 'movecard empty';
      grid.appendChild(pad);
    }

    const back = info.querySelector('.backbtn');
    this._add(back, () => this.showRoot(ctx));

    this.root.appendChild(grid);
    this.root.appendChild(info);
    this.el = grid;
    this.extras.push(info);
    this.cols = 2;
    this._focus(0, false);
  }

  _describe(mv, slot, lbl, fc) {
    if (!this.$info) return;
    const $n = this.$info.querySelector('.mvi-name');
    const $head = this.$info.querySelector('.mvi-head');
    const $row = this.$info.querySelector('.mvi-row');
    const $d = this.$info.querySelector('.mvi-desc');
    if (!mv) {
      $n.textContent = '—'; $row.innerHTML = ''; $d.textContent = 'Empty slot.';
      return;
    }
    $n.textContent = mv.name;
    $head.querySelector('.type-badge')?.remove();
    $head.insertAdjacentHTML('beforeend', badgeHtml(mv.type));
    const bits = [
      `<span>PP <b>${slot.pp}/${slot.maxPp}</b></span>`,
      `<span>PWR <b>${mv.power || '—'}</b></span>`,
      `<span>ACC <b>${mv.accuracy === null ? '∞' : mv.accuracy}</b></span>`,
      mv.priority ? `<span>PRI <b>${mv.priority > 0 ? '+' : ''}${mv.priority}</b></span>` : '',
      lbl && lbl !== 'neutral' ? `<span style="color:var(--eff-${lbl})"><b>${EFF_WORD[lbl]}</b></span>` : '',
      fc && fc.ko ? `<span style="color:var(--danger)"><b>GUARANTEED KO</b></span>`
        : fc && fc.mayKo ? `<span style="color:var(--warn)"><b>MAY KO</b></span>` : ''
    ].filter(Boolean);
    $row.innerHTML = bits.join('');
    $d.textContent = mv.desc || mv.flavor || '';
  }

  /* ---- hover-dwell / long-press detail sheet ---- */

  _wireDetail(card, mv, slot, lbl, fc) {
    let dwell = null;
    const open = () => this._openSheet(mv, slot, lbl, fc);
    // The dwell timer used to live only in this closure, cleared on
    // `pointerleave`. Click a card inside the 420ms and the menu is torn down
    // with the timer still armed: it fired about 0.4s into the action and threw
    // the full detail sheet over the arena — clipped off the right edge, on top
    // of the player's own HP plate — where it sat until the next prompt, over
    // the knockout and all. Reproduced in 3 of 3 mouse runs. The card is gone
    // by then, so nothing it owns can cancel it; the menu has to.
    const arm = () => {
      clearTimeout(dwell);
      dwell = setTimeout(open, 420);
      this._dwells.add(dwell);
    };
    const disarm = () => { clearTimeout(dwell); this._dwells.delete(dwell); dwell = null; };
    card.addEventListener('pointerenter', (e) => { if (e.pointerType !== 'touch') arm(); });
    card.addEventListener('pointerleave', () => { disarm(); this._closeSheet(); });
    // Committing this card is also a reason to forget it.
    card.addEventListener('pointerdown', disarm);
    card.addEventListener('pointerdown', (e) => {
      if (e.pointerType !== 'touch') return;
      clearTimeout(this._pressTimer);
      this._pressTimer = setTimeout(() => { this._suppressClick = true; open(); }, 420);
    });
    const cancel = () => clearTimeout(this._pressTimer);
    card.addEventListener('pointerup', cancel);
    card.addEventListener('pointercancel', cancel);
    card.addEventListener('pointermove', (e) => { if (e.pointerType === 'touch') cancel(); });
    card.addEventListener('contextmenu', (e) => e.preventDefault());
    card._openDetail = open;
  }

  _openSheet(mv, slot, lbl, fc) {
    this._closeSheet();
    if (!mv) return;
    const el = document.createElement('div');
    el.className = 'mvsheet';
    const flags = (mv.flags || []).filter((f) => f !== 'protect');
    const tags = [];
    if (mv.contact) tags.push('contact');
    if (mv.hits) tags.push(`${mv.hits[0]}–${mv.hits[1]} hits`);
    if (mv.drain) tags.push(`drains ${Math.round(mv.drain * 100)}%`);
    if (mv.recoil) tags.push(`${Math.round(mv.recoil * 100)}% recoil`);
    if (mv.critStage) tags.push(`crit +${mv.critStage}`);
    for (const f of flags) tags.push(f);
    for (const e of mv.effects || []) {
      if (e.kind === 'status') tags.push(`${e.chance ?? 100}% ${e.value.toUpperCase()}`);
      else if (e.kind === 'boost') tags.push(`${Object.entries(e.stats || {}).map(([k, v]) => `${k.toUpperCase()} ${v > 0 ? '+' : ''}${v}`).join(' ')} (${e.target})`);
      else if (e.kind === 'volatile') tags.push(`${e.chance ?? 100}% ${e.value}`);
      else if (e.kind === 'heal') tags.push(`heals ${Math.round((e.frac || 0) * 100)}%`);
      else if (e.kind) tags.push(`${e.kind}: ${e.value ?? ''}`);
    }
    el.innerHTML = `
      <span class="sh-close">HOLD / HOVER · ESC</span>
      <h4>${esc(mv.name)} ${badgeHtml(mv.type, '')}
        <span class="mv-cat ${mv.category}">${mv.category.toUpperCase()}</span></h4>
      <div class="sh-row">
        <span>PWR <b>${mv.power || '—'}</b></span>
        <span>ACC <b>${mv.accuracy === null ? 'never misses' : mv.accuracy + '%'}</b></span>
        <span>PP <b>${slot ? `${slot.pp}/${slot.maxPp}` : mv.pp}</b></span>
        <span>PRIORITY <b>${mv.priority > 0 ? '+' : ''}${mv.priority || 0}</b></span>
        <span>TARGET <b>${TARGET_WORD[mv.target] || mv.target}</b></span>
        ${lbl && lbl !== 'neutral' ? `<span style="color:var(--eff-${lbl})"><b>${EFF_WORD[lbl]} ${EFF_X[lbl]}</b></span>` : ''}
        ${fc && !fc.immune ? `<span>FORECAST <b${fc.ko ? ' style="color:var(--danger)"' : ''}>${fc.ko ? 'guaranteed KO' : `${Math.round(fc.loPct * 100)}–${Math.round(fc.hiPct * 100)}% of foe HP`}</b></span>` : ''}
      </div>
      <div class="sh-desc">${esc(mv.desc || '')}</div>
      ${tags.length ? `<div class="sh-fx">${tags.map((t) => `<span class="sh-tag">${esc(t)}</span>`).join('')}</div>` : ''}
      ${mv.flavor ? `<div class="sh-flav">“${esc(mv.flavor)}”</div>` : ''}`;
    this.root.appendChild(el);
    this.sheet = el;
    document.body.dataset.sheet = '1';
  }

  _closeSheet() {
    if (this.sheet) { this.sheet.remove(); this.sheet = null; }
    delete document.body.dataset.sheet;
  }

  /** Forget every armed hover-dwell timer. See the note in `_wireDetail`. */
  _cancelDwells() {
    for (const t of this._dwells) clearTimeout(t);
    this._dwells.clear();
  }

  /** Toggle the detail sheet for the focused card (keyboard route). */
  toggleDetail() {
    if (this.sheet) { this._closeSheet(); audio.sfx('ui_back'); return true; }
    const el = this.items[this.sel]?.el;
    if (el?._openDetail) { el._openDetail(); audio.sfx('ui_move'); return true; }
    return false;
  }

  /* ---------------- party ---------------- */

  showParty(ctx, forced = false) {
    this.clear();
    this.ctx = ctx;
    this.mode = 'party';
    this.forced = forced;
    this._setDockMode('party');
    const d = document.createElement('div');
    d.className = 'listpanel';
    const alive = ctx.party.filter((p) => !p.fainted).length;
    d.innerHTML = `<h3>${forced ? 'Send out who?' : 'Switch fighter'}<span class="sub">${alive} STANDING</span></h3>`;

    ctx.party.forEach((p, i) => {
      const isActive = i === ctx.activeIndex;
      const dis = p.fainted || isActive;
      const row = document.createElement('button');
      row.type = 'button';
      row.className = 'listrow';
      row.disabled = dis;
      const frac = Math.max(0, p.hp / Math.max(1, p.maxHp));
      const col = frac > 0.5 ? 'var(--hp-green)' : frac > 0.2 ? 'var(--hp-amber)' : 'var(--hp-red)';
      const flag = p.fainted
        ? `<span class="pflag" style="background:#6b6f85;color:#fff">FAINTED</span>`
        : isActive ? `<span class="pflag" style="background:var(--gold)">OUT</span>` : '';
      const st = p.status ? `<span class="pflag" style="background:${statusColorOf(p.status)}">${p.status.toUpperCase()}</span>` : '';
      row.innerHTML = `
        <span class="pnm">${esc(p.nickname)}<br><span class="plv">Lv${p.level}</span></span>
        <span class="ptypes">${(p.types || []).map((t) => badgeHtml(t)).join('')}</span>
        ${st}${flag}
        <span class="phpbar"><i style="width:${frac * 100}%;background:${col}"></i></span>
        <span class="phptxt">${Math.max(0, p.hp)}/${p.maxHp}</span>`;
      d.appendChild(row);
      this._add(row, () => this.onChoice?.({ kind: 'switch', toSlot: i }), { disabled: dis });
    });

    if (!forced) {
      const foot = document.createElement('div');
      foot.className = 'listfoot';
      const back = document.createElement('button');
      back.type = 'button'; back.className = 'backbtn'; back.textContent = '← Back';
      foot.appendChild(back);
      d.appendChild(foot);
      this._add(back, () => this.showRoot(ctx));
    }
    this.root.appendChild(d);
    this.el = d;
    this.cols = 1;
    this._focus(this.items.findIndex((it) => !it.disabled) >= 0
      ? this.items.findIndex((it) => !it.disabled) : 0, false);
  }

  /* ---------------- bag ---------------- */

  showBag(ctx) {
    this.clear();
    this.ctx = ctx;
    this.mode = 'bag';
    this._setDockMode('bag');
    const d = document.createElement('div');
    d.className = 'listpanel';
    const entries = Object.entries(ctx.items || {}).filter(([, n]) => n > 0);
    d.innerHTML = `<h3>Bag<span class="sub">${entries.reduce((a, [, n]) => a + n, 0)} ITEMS</span></h3>`;
    if (!entries.length) d.insertAdjacentHTML('beforeend', `<div class="listempty">Your bag is empty.</div>`);
    for (const [id, qty] of entries) {
      const item = getItem(id);
      if (!item) continue;
      const row = document.createElement('button');
      row.type = 'button';
      row.className = 'listrow';
      row.innerHTML = `
        <span class="bcol">
          <span class="bnm" style="color:${item.color || '#fff'}">${esc(item.name)}</span>
          <span class="bdesc">${esc(item.desc || '')}</span>
        </span>
        <span class="bqty">×${qty}</span>`;
      d.appendChild(row);
      this._add(row, () => this.onChoice?.({ kind: 'item', itemId: id, targetSlot: ctx.activeIndex }));
    }
    const foot = document.createElement('div');
    foot.className = 'listfoot';
    const back = document.createElement('button');
    back.type = 'button'; back.className = 'backbtn'; back.textContent = '← Back';
    foot.appendChild(back);
    d.appendChild(foot);
    this._add(back, () => this.showRoot(ctx));
    this.root.appendChild(d);
    this.el = d;
    this.cols = 1;
    this._focus(0, false);
  }

  /* ---------------- back ---------------- */

  /** Escape / Backspace / B. Returns true if the menu handled it. */
  back() {
    if (this.sheet) { this._closeSheet(); audio.sfx('ui_back'); return true; }
    if (this.mode === 'moves' || this.mode === 'bag' || (this.mode === 'party' && !this.forced)) {
      audio.sfx('ui_back');
      this.showRoot(this.ctx);
      return true;
    }
    if (this.mode === 'party' && this.forced) { audio.sfx('ui_error'); return true; }
    return false;
  }

  /* ---------------- keyboard ---------------- */

  /**
   * Console-style grid navigation: wraps on every edge, moves by row on
   * up/down, jumps by number, and never silently swallows a key it did not use.
   * @returns {boolean} true if the key was consumed
   */
  key(e) {
    if (!this.items.length) return false;
    const k = e.key;

    if (k === 'Escape' || k === 'Backspace' || k === 'b' || k === 'B') return this.back();
    if (k === 'i' || k === 'I' || k === '?') return this.toggleDetail();

    if (k === 'Enter' || k === ' ' || k === 'Spacebar') {
      this._keyboard = true;
      this._activate(this.sel);
      return true;
    }

    if (/^[1-9]$/.test(k)) {
      const i = Number(k) - 1;
      if (i < this.items.length) { this._keyboard = true; this._focus(i, true); return true; }
      audio.sfx('ui_error');
      return true;
    }

    const n = this.items.length;
    const cols = Math.max(1, Math.min(this.cols, n));
    const rows = Math.ceil(n / cols);
    let i = this.sel;
    const row = Math.floor(i / cols), col = i % cols;

    if (k === 'ArrowRight' || k === 'd') {
      if (cols === 1) i = (i + 1) % n;                             // list: next entry
      else { const c = (col + 1) % cols; i = row * cols + c; if (i >= n) i = row * cols; }
    } else if (k === 'ArrowLeft' || k === 'a') {
      if (cols === 1) i = (i - 1 + n) % n;
      else {
        let c = (col - 1 + cols) % cols; let t = row * cols + c;
        if (t >= n) { c = (n - 1) % cols; t = row * cols + c; }
        i = t;
      }
    } else if (k === 'ArrowDown' || k === 's') {
      if (cols === 1) i = (i + 1) % n;
      else { const r = (row + 1) % rows; i = r * cols + col; if (i >= n) i = (0 * cols) + col; }
    } else if (k === 'ArrowUp' || k === 'w') {
      if (cols === 1) i = (i - 1 + n) % n;
      else {
        let r = (row - 1 + rows) % rows; let t = r * cols + col;
        if (t >= n) { r = (r - 1 + rows) % rows; t = r * cols + col; }
        i = Math.min(t, n - 1);
      }
    } else if (k === 'Home') i = 0;
    else if (k === 'End') i = n - 1;
    else if (k === 'Tab') { i = e.shiftKey ? i - 1 : i + 1; i = ((i % n) + n) % n; }
    else return false;

    this._keyboard = true;
    this._focus(i, true);
    return true;
  }
}

function statusColorOf(id) { return STATUSES[id]?.color || '#888'; }
