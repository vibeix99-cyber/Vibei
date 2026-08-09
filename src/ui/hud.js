// Name plates, HP bars, status pips, party dots, field banner.

import { TYPE_COLOR, TYPE_ICON } from '../core/types.js';
import { STATUSES } from '../core/status.js';
import { Spring } from '../render/feel.js';

const HUD_CSS = `
.nameplate{
  position:absolute; width:min(340px, 42vw); padding:9px 12px 11px;
  background:linear-gradient(180deg,#f6f3e8 0%,#ded7c2 100%);
  border:3px solid #12141f; border-radius:14px;
  box-shadow:0 6px 0 rgba(0,0,0,.35), 0 10px 26px rgba(0,0,0,.45), inset 0 0 0 2px rgba(255,255,255,.55);
  color:#16192a; font-family:var(--font-ui);
  transition:opacity .25s var(--ease-out), transform .35s var(--ease-out);
}
.nameplate.p0{ left:3.2vw; bottom:min(220px, 30vh); }
.nameplate.p1{ right:3.2vw; top:3.2vh; }
.nameplate.hidden{ opacity:0; transform:translateY(-14px) scale(.94); pointer-events:none; }
.nameplate .row1{ display:flex; align-items:baseline; gap:8px; }
.nameplate .nm{ font-weight:800; font-size:19px; letter-spacing:.01em; line-height:1.1; }
.nameplate .lv{ font-weight:800; font-size:14px; opacity:.75; margin-left:auto; }
.nameplate .types{ display:flex; gap:4px; margin:5px 0 6px; }
.hpwrap{ display:flex; align-items:center; gap:7px; }
.hplabel{ font-weight:900; font-size:11px; letter-spacing:.16em; color:#8a7f5f; }
.hpbar{
  position:relative; flex:1; height:11px; border-radius:99px;
  background:#3a3f52; border:2px solid #12141f; overflow:hidden;
  box-shadow:inset 0 2px 3px rgba(0,0,0,.5);
}
.hpfill{ position:absolute; inset:0; width:100%; transform-origin:left center;
  background:linear-gradient(180deg,#7cf0a8,#2fae5f); border-radius:99px;
  transition:background .3s linear; }
.hpghost{ position:absolute; inset:0; width:100%; transform-origin:left center;
  background:rgba(255,80,80,.55); border-radius:99px; }
.hpnum{ font-variant-numeric:tabular-nums; font-weight:800; font-size:13px; min-width:64px; text-align:right; }
.nameplate.low .hpnum{ animation:lowHpBlink .8s infinite; }
.pips{ display:flex; gap:4px; margin-top:6px; align-items:center; min-height:16px; }
.status-pip{
  font-size:10px; font-weight:900; letter-spacing:.08em; padding:1px 6px; border-radius:4px;
  color:#0b0d14; border:2px solid rgba(0,0,0,.5);
}
.boost-pip{ font-size:10px; font-weight:800; padding:1px 5px; border-radius:4px; background:#2a3149; color:#dfe6ff; }
.boost-pip.up{ background:#245c3a; color:#9cffc4; }
.boost-pip.down{ background:#5c2424; color:#ffb0b0; }
.partydots{ display:flex; gap:5px; margin-top:7px; }
.pdot{ width:11px; height:11px; border-radius:50%; background:#4ad07a; border:2px solid #12141f; box-shadow:0 1px 0 rgba(255,255,255,.4) inset; }
.pdot.hurt{ background:#f2c94c; } .pdot.crit{ background:#ef4747; } .pdot.out{ background:#5a5f72; }
.pdot.active{ box-shadow:0 0 0 3px rgba(242,201,76,.85); }

.fieldbanner{
  position:absolute; left:50%; top:1.4vh; transform:translateX(-50%);
  display:flex; gap:6px; flex-wrap:wrap; justify-content:center; max-width:70vw;
}
.fieldchip{
  font-size:11px; font-weight:900; letter-spacing:.1em; text-transform:uppercase;
  padding:4px 10px; border-radius:99px; border:2px solid rgba(0,0,0,.6);
  background:#1b2033; color:#fff; box-shadow:0 3px 10px rgba(0,0,0,.4);
  animation:popIn .3s var(--ease-back) both;
}
.dmgnum{
  position:absolute; font-family:var(--font-display); font-weight:900;
  font-size:34px; color:#fff; text-shadow:0 3px 0 #000, 0 0 18px rgba(0,0,0,.8);
  pointer-events:none; will-change:transform,opacity;
}
.dmgnum.crit{ font-size:48px; color:#ffe36b; }
.dmgnum.heal{ color:#8cffb8; }
.dmgnum.super{ color:#ff9c5b; }
`;

export function injectHudCss() {
  if (document.getElementById('hud-css')) return;
  const s = document.createElement('style');
  s.id = 'hud-css'; s.textContent = HUD_CSS;
  document.head.appendChild(s);
}

function typeBadge(t) {
  const el = document.createElement('span');
  el.className = 'type-badge';
  el.style.background = TYPE_COLOR[t] || '#999';
  el.textContent = `${TYPE_ICON[t] || ''} ${t}`;
  return el;
}

export class NamePlate {
  constructor(side) {
    injectHudCss();
    this.side = side;
    this.el = document.createElement('div');
    this.el.className = `nameplate p${side} hidden`;
    this.el.innerHTML = `
      <div class="row1"><span class="nm"></span><span class="lv"></span></div>
      <div class="types"></div>
      <div class="hpwrap">
        <span class="hplabel">HP</span>
        <div class="hpbar"><div class="hpghost"></div><div class="hpfill"></div></div>
        <span class="hpnum mono"></span>
      </div>
      <div class="pips"></div>
      <div class="partydots"></div>`;
    this.$nm = this.el.querySelector('.nm');
    this.$lv = this.el.querySelector('.lv');
    this.$types = this.el.querySelector('.types');
    this.$fill = this.el.querySelector('.hpfill');
    this.$ghost = this.el.querySelector('.hpghost');
    this.$num = this.el.querySelector('.hpnum');
    this.$pips = this.el.querySelector('.pips');
    this.$dots = this.el.querySelector('.partydots');
    this.hpSpring = new Spring(1, 90, 16);
    this.ghost = 1;
    this.hp = 1; this.maxHp = 1;
    this.showNumbers = side === 0;
  }

  mount(parent) { parent.appendChild(this.el); }
  show() { this.el.classList.remove('hidden'); }
  hide() { this.el.classList.add('hidden'); }

  setMon(mon, party) {
    this.$nm.textContent = mon.nickname;
    this.$lv.textContent = `Lv${mon.level}`;
    this.$types.innerHTML = '';
    (mon.types || []).forEach((t) => this.$types.appendChild(typeBadge(t)));
    this.maxHp = mon.maxHp; this.hp = mon.hp;
    this.hpSpring.snap(mon.hp / mon.maxHp);
    this.ghost = mon.hp / mon.maxHp;
    this.setStatus(mon.status, mon.boosts);
    if (party) this.setParty(party, mon.uid);
    this.render();
  }

  setHp(hp, maxHp) {
    this.hp = hp; if (maxHp) this.maxHp = maxHp;
    this.hpSpring.set(Math.max(0, hp) / this.maxHp);
  }

  setStatus(status, boosts) {
    this.$pips.innerHTML = '';
    if (status && STATUSES[status]) {
      const p = document.createElement('span');
      p.className = 'status-pip';
      p.style.background = STATUSES[status].color;
      p.textContent = STATUSES[status].short;
      this.$pips.appendChild(p);
    }
    if (boosts) {
      for (const [k, v] of Object.entries(boosts)) {
        if (!v) continue;
        const p = document.createElement('span');
        p.className = `boost-pip ${v > 0 ? 'up' : 'down'}`;
        p.textContent = `${k.toUpperCase()} ${v > 0 ? '+' : ''}${v}`;
        this.$pips.appendChild(p);
      }
    }
  }

  setParty(party, activeUid) {
    this.$dots.innerHTML = '';
    for (const p of party) {
      const d = document.createElement('span');
      const frac = p.hp / p.maxHp;
      d.className = 'pdot' + (p.fainted ? ' out' : frac < 0.25 ? ' crit' : frac < 0.55 ? ' hurt' : '')
        + (p.uid === activeUid ? ' active' : '');
      d.title = p.nickname;
      this.$dots.appendChild(d);
    }
  }

  update(dt) {
    const v = this.hpSpring.update(dt);
    this.render(v);
  }

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
    this.el.classList.toggle('low', f <= 0.2 && f > 0);
    this.$num.textContent = this.showNumbers
      ? `${Math.max(0, Math.round(f * this.maxHp))}/${this.maxHp}`
      : `${Math.round(f * 100)}%`;
  }
}

export class FieldBanner {
  constructor() {
    injectHudCss();
    this.el = document.createElement('div');
    this.el.className = 'fieldbanner';
  }
  mount(p) { p.appendChild(this.el); }
  set(chips) {
    this.el.innerHTML = '';
    for (const c of chips) {
      const d = document.createElement('span');
      d.className = 'fieldchip';
      d.textContent = c.label;
      d.style.background = c.color || '#1b2033';
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
