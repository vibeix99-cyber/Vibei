// Name plates, HP bars, status pips, party dots, field banner, floating numbers.
//
// The plate is the player's whole read on the fight: who is out, how hurt they
// are, what is wrong with them, what they are holding, and how much of the team
// is left. Everything here is driven from src/ui/theme.css tokens.
//
// Placement contract (see theme.css): the foe plate lives top-left, the player
// plate sits directly above the bottom dock on the right, so neither can ever
// collide with the text box or the command cluster at any viewport size.

import { TYPE_COLOR, TYPE_ICON } from '../core/types.js';
import { STATUSES, VOLATILES } from '../core/status.js';
import { STAT_SHORT } from '../core/stats.js';
import { getItem } from '../data/items.js';
import { Spring } from '../render/feel.js';

const HUD_CSS = `
/* ---------------- name plate ---------------- */
.nameplate{
  position:absolute; width:var(--plate-w); padding:7px 10px 8px;
  z-index:var(--z-plate);
  background:linear-gradient(180deg,#f8f5ea 0%,#ddd6c0 100%);
  border:var(--bd) solid var(--edge-ink); border-radius:13px;
  box-shadow:var(--lip), 0 10px 26px rgba(0,0,0,.45), inset 0 0 0 2px rgba(255,255,255,.5);
  color:var(--text); font-family:var(--font-ui);
  display:flex; flex-direction:column; gap:3px;
  transition:opacity .22s var(--ease-out), transform .42s var(--ease-back);
  will-change:transform,opacity;
}
.nameplate.p1{ left:var(--edge); top:var(--edge-t); }
.nameplate.p0{ right:var(--edge); bottom:calc(var(--dock-top) + var(--gap)); }
.nameplate.hidden{ opacity:0; pointer-events:none; }
.nameplate.p1.hidden{ transform:translateX(calc(-1 * var(--plate-shift))) scale(.96); }
.nameplate.p0.hidden{ transform:translateX(var(--plate-shift)) scale(.96); }

/* identity row — name can shrink and ellipsis, the level block never wraps */
.np-id{ display:flex; align-items:baseline; gap:8px; min-width:0; }
.np-name{
  font-weight:800; font-size:clamp(14px,1.35vw,19px); letter-spacing:.01em; line-height:1.12;
  overflow:hidden; text-overflow:ellipsis; white-space:nowrap; min-width:0; flex:1;
}
.np-meta{
  margin-left:auto; display:flex; align-items:baseline; gap:4px; flex:0 0 auto;
  white-space:nowrap; font-weight:800; font-size:12px; color:#6a6248;
}
.np-sex{ font-size:13px; line-height:1; }
.np-sex.m{ color:#3a7ad0; } .np-sex.f{ color:#d0417a; }
.np-lv{ letter-spacing:.02em; }

/* tags row: types, held item, status */
.np-tags{ display:flex; align-items:center; gap:4px; flex-wrap:nowrap; overflow:hidden; min-height:17px; }
.np-item{
  display:inline-flex; align-items:center; gap:3px; flex:0 0 auto;
  font-size:10px; font-weight:800; letter-spacing:.04em; text-transform:uppercase;
  padding:1px 6px 1px 4px; border-radius:99px;
  background:#3a3320; color:#ffe9a3; border:1.5px solid rgba(0,0,0,.6);
  max-width:44%; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;
}
.np-status{
  flex:0 0 auto; margin-left:auto;
  font-size:10px; font-weight:900; letter-spacing:.1em; padding:2px 7px; border-radius:5px;
  color:#0b0d14; border:2px solid rgba(0,0,0,.55); text-shadow:0 1px 0 rgba(255,255,255,.3);
}
.np-status.pulse{ animation:lowHpBlink 1.1s infinite; }

/* ---- hp ---- */
.np-hp{ display:flex; align-items:center; gap:6px; }
.np-hplabel{ font-weight:900; font-size:10px; letter-spacing:.16em; color:#8a7f5f; }
.np-bar{
  position:relative; flex:1; height:12px; border-radius:99px;
  background:#31364a; border:2px solid var(--edge-ink); overflow:hidden;
  box-shadow:inset 0 2px 3px rgba(0,0,0,.55);
}
/* danger zone shading — the last 20% of the track reads as "red water" */
.np-bar::after{
  content:''; position:absolute; left:0; top:0; bottom:0; width:20%;
  background:repeating-linear-gradient(135deg, rgba(239,71,71,.42) 0 4px, rgba(239,71,71,.16) 4px 8px);
  pointer-events:none;
}
.np-ghost{ position:absolute; inset:0; width:100%; transform-origin:left center;
  background:rgba(255,92,92,.7); border-radius:99px; }
.np-fill{ position:absolute; inset:0; width:100%; transform-origin:left center;
  background:linear-gradient(180deg,#7cf0a8,#2fae5f); border-radius:99px; }
/* quarter ticks so a bar-only foe read is still precise */
.np-ticks{
  position:absolute; inset:0; pointer-events:none;
  background:
    linear-gradient(90deg, transparent calc(25% - 1px), rgba(0,0,0,.55) calc(25% - 1px), rgba(0,0,0,.55) 25%, transparent 25%),
    linear-gradient(90deg, transparent calc(50% - 1px), rgba(0,0,0,.75) calc(50% - 1px), rgba(0,0,0,.75) calc(50% + 1px), transparent calc(50% + 1px)),
    linear-gradient(90deg, transparent calc(75% - 1px), rgba(0,0,0,.55) calc(75% - 1px), rgba(0,0,0,.55) 75%, transparent 75%);
}
/* the danger threshold marker at 20% */
.np-thresh{ position:absolute; left:20%; top:-2px; bottom:-2px; width:2px; background:#ff3b3b; box-shadow:0 0 4px rgba(255,0,0,.8); }
.np-num{ font-variant-numeric:tabular-nums; font-weight:800; font-size:12px; min-width:58px; text-align:right; letter-spacing:-.01em; }
.nameplate.nonum .np-num{ display:none; }

/* low-HP alarm: the whole plate takes on the state, not just the number */
.nameplate.alarm{ animation:alarmEdge .78s infinite; background:linear-gradient(180deg,#fdeaea 0%,#e6cdc6 100%); }
.nameplate.alarm .np-num{ color:#b31c1c; animation:lowHpBlink .78s infinite; }
.nameplate.alarm .np-hplabel{ color:#b31c1c; }
.nameplate.fainted{ filter:grayscale(.85) brightness(.85); }

/* ---- foot row: boosts + party ---- */
.np-foot{ display:flex; align-items:center; gap:6px; min-height:15px; }
.np-boosts{ display:flex; gap:3px; flex-wrap:nowrap; overflow:hidden; }
.np-pip{
  font-size:10px; font-weight:900; letter-spacing:.03em; padding:1px 5px; border-radius:4px;
  background:#2a3149; color:#dfe6ff; border:1.5px solid rgba(0,0,0,.45); white-space:nowrap;
}
.np-pip.up{ background:#1f6b3c; color:#a6ffcb; }
.np-pip.down{ background:#6b2222; color:#ffb8b8; }
.np-pip.vol{ background:#3a2f5b; color:#d8ccff; }

.np-party{ display:flex; gap:4px; margin-left:auto; }
.pdot{
  position:relative; width:12px; height:12px; border-radius:50%;
  background:#20242f; border:2px solid var(--edge-ink); overflow:hidden;
  box-shadow:0 1px 0 rgba(255,255,255,.25) inset;
}
.pdot i{ position:absolute; left:0; right:0; bottom:0; display:block; background:var(--ok); }
.pdot.hurt i{ background:var(--warn); } .pdot.crit i{ background:var(--danger); }
.pdot.out{ background:#3c4052; }
.pdot.out::after{
  content:''; position:absolute; inset:1px;
  background:linear-gradient(45deg,transparent 42%,#9aa3bd 42% 58%,transparent 58%),
             linear-gradient(-45deg,transparent 42%,#9aa3bd 42% 58%,transparent 58%);
}
.pdot.active{ box-shadow:0 0 0 2px var(--focus), 0 1px 0 rgba(255,255,255,.25) inset; transform:translateY(-1px); }

/* ---------------- field banner ---------------- */
.fieldbanner{
  position:absolute; left:50%; transform:translateX(-50%);
  top:calc(var(--edge-t) + 6px);
  display:flex; gap:5px; flex-wrap:wrap; justify-content:center;
  max-width:min(58vw, 640px); z-index:var(--z-plate);
}
.fieldchip{
  font-size:10px; font-weight:900; letter-spacing:.09em; text-transform:uppercase;
  padding:3px 9px; border-radius:99px; border:2px solid rgba(0,0,0,.65);
  background:var(--ink-3); color:#fff; box-shadow:0 3px 10px rgba(0,0,0,.4);
  animation:popIn .3s var(--ease-back) both; white-space:nowrap;
}
@media (orientation:portrait) and (max-width:820px){
  .fieldbanner{ top:calc(var(--edge-t) + 92px); max-width:calc(100% - 2 * var(--edge)); }
}
@media (max-height:520px){
  .fieldbanner{ max-width:min(40vw,420px); }
  .fieldchip{ font-size:9px; padding:2px 7px; }
}

/* ---------------- floating numbers ---------------- */
.dmgnum{
  position:absolute; font-family:var(--font-display); font-weight:900;
  font-size:clamp(24px,3vw,34px); color:#fff; text-shadow:0 3px 0 #000, 0 0 18px rgba(0,0,0,.8);
  pointer-events:none; will-change:transform,opacity; z-index:var(--z-plate);
}
.dmgnum.crit{ font-size:clamp(32px,4vw,48px); color:#ffe36b; }
.dmgnum.heal{ color:#8cffb8; }
.dmgnum.super{ color:#ff9c5b; }
`;

export function injectHudCss() {
  if (document.getElementById('hud-css')) return;
  const s = document.createElement('style');
  s.id = 'hud-css'; s.textContent = HUD_CSS;
  document.head.appendChild(s);
}

function typeBadge(t, cls = 'xs') {
  const el = document.createElement('span');
  el.className = `type-badge ${cls}`;
  el.style.background = TYPE_COLOR[t] || '#999';
  el.textContent = `${TYPE_ICON[t] || ''} ${t}`;
  return el;
}

/** Boost stages the plate is willing to surface, in a stable reading order. */
const BOOST_ORDER = ['atk', 'def', 'spa', 'spd', 'spe', 'acc', 'eva'];
/** Volatiles worth a pip. Housekeeping ones stay hidden. */
const VOL_SHOWN = new Set([
  'confusion', 'taunt', 'encore', 'leechseed', 'substitute', 'protect', 'disable',
  'perish', 'yawn', 'torment', 'focusenergy', 'aqua_ring', 'magnetrise', 'rooted', 'imprison'
]);

export class NamePlate {
  constructor(side) {
    injectHudCss();
    this.side = side;
    this.el = document.createElement('div');
    this.el.className = `nameplate p${side} hidden`;
    this.el.innerHTML = `
      <div class="np-id">
        <span class="np-name"></span>
        <span class="np-meta"><span class="np-sex"></span><span class="np-lv"></span></span>
      </div>
      <div class="np-tags"><span class="np-types" style="display:flex;gap:4px;min-width:0"></span></div>
      <div class="np-hp">
        <span class="np-hplabel">HP</span>
        <div class="np-bar">
          <div class="np-ghost"></div>
          <div class="np-fill"></div>
          <div class="np-ticks"></div>
          <div class="np-thresh"></div>
        </div>
        <span class="np-num mono"></span>
      </div>
      <div class="np-foot"><span class="np-boosts"></span><span class="np-party"></span></div>`;
    this.$name = this.el.querySelector('.np-name');
    this.$sex = this.el.querySelector('.np-sex');
    this.$lv = this.el.querySelector('.np-lv');
    this.$tags = this.el.querySelector('.np-tags');
    this.$types = this.el.querySelector('.np-types');
    this.$fill = this.el.querySelector('.np-fill');
    this.$ghost = this.el.querySelector('.np-ghost');
    this.$num = this.el.querySelector('.np-num');
    this.$boosts = this.el.querySelector('.np-boosts');
    this.$party = this.el.querySelector('.np-party');

    this.hpSpring = new Spring(1, 90, 16);
    this.ghost = 1;
    this.hp = 1; this.maxHp = 1;
    this.uid = null;
    this.item = null;
    this.showNumbers = side === 0;
    this._alarmOn = false;
    this._lastRendered = -1;
    this.render(1);
  }

  mount(parent) { parent.appendChild(this.el); }

  /** Slide in with the fighter. Called by battleView on switchIn. */
  show() {
    // force a reflow so the transform transition always plays, even when the
    // plate is re-shown in the same frame it was hidden.
    void this.el.offsetWidth;
    this.el.classList.remove('hidden');
  }
  hide() { this.el.classList.add('hidden'); }

  /**
   * @param {{nickname,level,types,hp,maxHp,status,boosts,uid,item?,gender?}} mon
   * @param {Array=} party  full public party for this side (also carries item/volatiles)
   */
  setMon(mon, party) {
    this.uid = mon.uid ?? null;
    this.$name.textContent = mon.nickname ?? '—';
    this.$name.title = mon.nickname ?? '';
    this.$lv.textContent = `Lv${mon.level ?? 50}`;
    this.setGender(mon.gender ?? null);
    this.$types.innerHTML = '';
    (mon.types || []).forEach((t) => this.$types.appendChild(typeBadge(t)));
    this.maxHp = mon.maxHp || 1; this.hp = mon.hp ?? this.maxHp;
    this.hpSpring.snap(Math.max(0, this.hp) / this.maxHp);
    this.ghost = Math.max(0, this.hp) / this.maxHp;
    this.el.classList.remove('fainted');
    this.setItem(mon.item ?? null);
    this.setStatus(mon.status, mon.boosts, mon.volatiles);
    if (party) this.setParty(party, this.uid);
    this.render();
  }

  /** ♂ / ♀ / — . Data-driven: rendered only when the roster supplies one. */
  setGender(g) {
    const k = g === 'm' || g === 'male' ? 'm' : g === 'f' || g === 'female' ? 'f' : null;
    this.$sex.className = `np-sex ${k || ''}`;
    this.$sex.textContent = k === 'm' ? '♂' : k === 'f' ? '♀' : '';
  }

  setItem(id) {
    if (this.item === id) return;
    this.item = id;
    const old = this.$tags.querySelector('.np-item');
    if (old) old.remove();
    if (!id) return;
    const def = getItem(id);
    const el = document.createElement('span');
    el.className = 'np-item';
    el.textContent = `◆ ${def?.name || id}`;
    if (def?.color) el.style.color = def.color;
    el.title = def?.desc || '';
    // held item sits right after the types, before the status flag
    this.$tags.insertBefore(el, this.$tags.querySelector('.np-status'));
  }

  setHp(hp, maxHp) {
    this.hp = hp; if (maxHp) this.maxHp = maxHp;
    this.hpSpring.set(Math.max(0, hp) / this.maxHp);
  }

  /** @param {string|null} status @param {object=} boosts @param {string[]=} volatiles */
  setStatus(status, boosts, volatiles) {
    let flag = this.$tags.querySelector('.np-status');
    if (status && STATUSES[status]) {
      if (!flag) { flag = document.createElement('span'); flag.className = 'np-status'; this.$tags.appendChild(flag); }
      flag.style.background = STATUSES[status].color;
      flag.textContent = STATUSES[status].short;
      flag.title = STATUSES[status].name;
      flag.classList.toggle('pulse', status === 'tox' || status === 'frz');
    } else if (flag) flag.remove();

    this.$boosts.innerHTML = '';
    if (boosts) {
      for (const k of BOOST_ORDER) {
        const v = boosts[k];
        if (!v) continue;
        const p = document.createElement('span');
        p.className = `np-pip ${v > 0 ? 'up' : 'down'}`;
        const arrows = (v > 0 ? '▲' : '▼').repeat(Math.min(3, Math.abs(v)));
        p.textContent = `${STAT_SHORT[k] || k.toUpperCase()}${arrows}${Math.abs(v) > 3 ? Math.abs(v) : ''}`;
        p.title = `${STAT_SHORT[k]} ${v > 0 ? '+' : ''}${v}`;
        this.$boosts.appendChild(p);
      }
    }
    for (const v of volatiles || []) {
      if (!VOL_SHOWN.has(v)) continue;
      const p = document.createElement('span');
      p.className = 'np-pip vol';
      p.textContent = (VOLATILES[v]?.name || v).slice(0, 9).toUpperCase();
      p.title = VOLATILES[v]?.name || v;
      this.$boosts.appendChild(p);
    }
  }

  /**
   * Party dots. Each dot is a small tank: fill height = HP fraction, colour =
   * band, X = fainted, gold ring = the one that's out. Reads at a glance and
   * still tells you *how* hurt the bench is.
   */
  setParty(party, activeUid) {
    if (!party) return;
    const active = party.find((p) => p.uid === activeUid);
    if (active) {
      // switchIn events don't carry item/volatiles — pick them up from state.
      this.setItem(active.item ?? null);
      if (active.gender != null) this.setGender(active.gender);
    }
    const need = party.length;
    while (this.$party.children.length > need) this.$party.lastChild.remove();
    while (this.$party.children.length < need) {
      const d = document.createElement('span');
      d.className = 'pdot'; d.innerHTML = '<i></i>';
      this.$party.appendChild(d);
    }
    party.forEach((p, i) => {
      const d = this.$party.children[i];
      const frac = Math.max(0, Math.min(1, p.hp / Math.max(1, p.maxHp)));
      d.className = 'pdot' + (p.fainted ? ' out' : frac < 0.25 ? ' crit' : frac < 0.55 ? ' hurt' : '')
        + (p.uid === activeUid ? ' active' : '');
      d.firstChild.style.height = `${p.fainted ? 0 : Math.max(12, frac * 100)}%`;
      d.title = `${p.nickname} · ${p.fainted ? 'fainted' : `${p.hp}/${p.maxHp}`}`;
    });
  }

  update(dt) { this.render(this.hpSpring.update(dt)); }

  render(v) {
    const frac = v ?? this.hpSpring.value;
    const f = Math.max(0, Math.min(1, frac));
    this.$fill.style.transform = `scaleX(${f})`;
    this.ghost += (f - this.ghost) * 0.035;
    if (this.ghost < f) this.ghost = f;
    this.$ghost.style.transform = `scaleX(${Math.max(f, this.ghost)})`;

    const color = f > 0.5 ? 'linear-gradient(180deg,#7cf0a8,#2fae5f)'
      : f > 0.2 ? 'linear-gradient(180deg,#ffe37c,#e0a516)'
        : 'linear-gradient(180deg,#ff8a8a,#d02f2f)';
    this.$fill.style.background = color;

    const alarm = f <= 0.2 && f > 0;
    if (alarm !== this._alarmOn) { this._alarmOn = alarm; this.el.classList.toggle('alarm', alarm); }
    this.el.classList.toggle('fainted', f <= 0);
    this.el.classList.toggle('nonum', !this.showNumbers);
    if (this.showNumbers) {
      const shown = Math.max(0, Math.round(f * this.maxHp));
      if (shown !== this._lastRendered) {
        this._lastRendered = shown;
        this.$num.textContent = `${shown}/${this.maxHp}`;
      }
    }
  }
}

export class FieldBanner {
  constructor() {
    injectHudCss();
    this.el = document.createElement('div');
    this.el.className = 'fieldbanner';
    this._sig = '';
  }
  mount(p) { p.appendChild(this.el); }
  set(chips) {
    const sig = chips.map((c) => c.label).join('|');
    if (sig === this._sig) return;          // don't restart the pop-in every tick
    this._sig = sig;
    this.el.innerHTML = '';
    for (const c of chips) {
      const d = document.createElement('span');
      d.className = 'fieldchip';
      d.textContent = c.label;
      d.style.background = c.color || 'var(--ink-3)';
      d.style.color = c.text || '#fff';
      this.el.appendChild(d);
    }
  }
}

/** Floating damage/heal number anchored to a screen point. */
export function floatNumber(parent, x, y, text, kind = '') {
  injectHudCss();
  const el = document.createElement('div');
  el.className = `dmgnum ${kind}`;
  el.textContent = text;
  el.style.left = `${x}px`;
  el.style.top = `${y}px`;
  parent.appendChild(el);
  const dx = (Math.random() - 0.5) * 40;
  const start = performance.now();
  const dur = kind === 'crit' ? 1100 : 900;
  function step(now) {
    const p = Math.min(1, (now - start) / dur);
    const rise = -70 * (1 - Math.pow(1 - p, 3));
    const scale = p < 0.16 ? 0.5 + (p / 0.16) * 0.75 : 1.25 - (p - 0.16) * 0.28;
    el.style.transform = `translate(${dx * p}px, ${rise}px) scale(${scale})`;
    el.style.opacity = p < 0.7 ? 1 : 1 - (p - 0.7) / 0.3;
    if (p < 1) requestAnimationFrame(step); else el.remove();
  }
  requestAnimationFrame(step);
  return el;
}
