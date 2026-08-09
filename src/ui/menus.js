// Battle command menus: root FIGHT/BAG/PARTY/RUN, move grid, party list, bag.

import { TYPE_COLOR, TYPE_ICON, typeEff, effLabel } from '../core/types.js';
import { getMove } from '../data/moves.js';
import { getItem } from '../data/items.js';
import { audio } from '../audio/audio.js';

const CSS = `
.cmdroot{
  position:absolute; right:2.4vw; bottom:2.2vh; width:min(430px,46vw);
  display:grid; grid-template-columns:1fr 1fr; gap:10px;
  animation:slideUp .22s var(--ease-out) both;
}
.cmdbtn{
  font-family:var(--font-ui); font-weight:800; font-size:clamp(16px,2vw,22px);
  letter-spacing:.06em; text-transform:uppercase;
  padding:16px 10px; border-radius:14px; border:3px solid #000;
  background:linear-gradient(180deg,#fdfbf3,#ded7c2); color:#16192a;
  box-shadow:0 5px 0 #000, 0 8px 20px rgba(0,0,0,.4); cursor:pointer;
  display:flex; align-items:center; justify-content:center; gap:8px;
  transition:transform .1s var(--ease-out), filter .1s;
}
.cmdbtn:hover,.cmdbtn.sel{ transform:translateY(-3px); filter:brightness(1.06); }
.cmdbtn:active{ transform:translateY(2px); box-shadow:0 2px 0 #000; }
.cmdbtn.fight{ background:linear-gradient(180deg,#ff9d6b,#e0522b); color:#fff; text-shadow:0 2px 0 rgba(0,0,0,.4); }
.cmdbtn.run{ background:linear-gradient(180deg,#c9d0e0,#98a2ba); }

.movegrid{
  position:absolute; left:2.4vw; right:2.4vw; bottom:2.2vh;
  display:grid; grid-template-columns:1fr 1fr; gap:10px;
  animation:slideUp .22s var(--ease-out) both;
}
.movecard{
  position:relative; text-align:left; padding:11px 14px 12px;
  border-radius:14px; border:3px solid #000; cursor:pointer;
  background:linear-gradient(180deg,#fdfbf3,#e6e0cd); color:#16192a;
  box-shadow:0 5px 0 #000, 0 8px 18px rgba(0,0,0,.35);
  display:flex; flex-direction:column; gap:5px; min-height:84px;
  transition:transform .1s var(--ease-out), filter .1s;
  overflow:hidden;
}
.movecard::before{
  content:''; position:absolute; left:0; top:0; bottom:0; width:7px; background:var(--tc,#999);
}
.movecard:hover,.movecard.sel{ transform:translateY(-3px); filter:brightness(1.05); }
.movecard:active{ transform:translateY(2px); box-shadow:0 2px 0 #000; }
.movecard:disabled{ opacity:.4; cursor:not-allowed; filter:grayscale(.7); }
.movecard .mrow{ display:flex; align-items:center; gap:8px; }
.movecard .mname{ font-weight:800; font-size:clamp(15px,1.9vw,20px); letter-spacing:.01em; }
.movecard .mpp{ margin-left:auto; font-variant-numeric:tabular-nums; font-weight:800; font-size:13px; color:#5c6178; }
.movecard .mpp.low{ color:#d64545; }
.movecard .mmeta{ display:flex; align-items:center; gap:6px; font-size:12px; font-weight:700; color:#5c6178; }
.movecard .eff{ margin-left:auto; font-weight:900; font-size:11px; letter-spacing:.08em; padding:1px 7px; border-radius:99px; }
.eff.super{ background:#2b7a45; color:#c8ffdc; } .eff.quad{ background:#1f6b38; color:#e0ffe8; }
.eff.weak{ background:#7a4a2b; color:#ffd9b8; } .eff.quarter{ background:#6b3a1f; color:#ffe0c8; }
.eff.immune{ background:#4a4a58; color:#d8d8e0; }
.movecard .mdesc{ font-size:12px; color:#4a4f66; line-height:1.25; }

.backbtn{
  position:absolute; left:2.4vw; top:2.2vh; padding:8px 16px; border-radius:10px;
  border:3px solid #000; background:#1b2033; color:#fff; font-weight:800; cursor:pointer;
  box-shadow:0 4px 0 #000;
}
.listpanel{
  position:absolute; left:50%; top:50%; transform:translate(-50%,-50%);
  width:min(700px,92vw); max-height:82vh; overflow:auto; padding:18px;
  background:linear-gradient(180deg,#1b2033,#0f1322); border:3px solid #000; border-radius:18px;
  box-shadow:0 20px 60px rgba(0,0,0,.7); animation:popIn .22s var(--ease-back) both;
}
.listpanel h3{ margin:0 0 12px; font-family:var(--font-display); font-size:22px; letter-spacing:.04em; }
.partyrow{
  display:flex; align-items:center; gap:12px; padding:10px 12px; margin-bottom:8px;
  border-radius:12px; border:2px solid #000; background:#252c45; cursor:pointer;
  transition:transform .1s var(--ease-out), background .1s;
}
.partyrow:hover:not(.dis){ transform:translateX(4px); background:#2f3757; }
.partyrow.dis{ opacity:.42; cursor:not-allowed; }
.partyrow .pnm{ font-weight:800; font-size:17px; min-width:130px; }
.partyrow .ptypes{ display:flex; gap:4px; }
.partyrow .phpbar{ flex:1; height:9px; border-radius:99px; background:#12141f; overflow:hidden; border:2px solid #000; }
.partyrow .phpfill{ height:100%; background:#4ad07a; }
.partyrow .phptxt{ font-variant-numeric:tabular-nums; font-weight:800; font-size:13px; min-width:70px; text-align:right; }
.bagrow{ display:flex; align-items:center; gap:10px; padding:10px 12px; margin-bottom:8px; border-radius:12px;
  border:2px solid #000; background:#252c45; cursor:pointer; }
.bagrow:hover{ background:#2f3757; }
.bagrow .bnm{ font-weight:800; } .bagrow .bqty{ margin-left:auto; font-weight:800; }
.bagrow .bdesc{ font-size:12px; color:#9aa3bd; }
`;

function ensureCss() {
  if (document.getElementById('menus-css')) return;
  const s = document.createElement('style'); s.id = 'menus-css'; s.textContent = CSS;
  document.head.appendChild(s);
}

function badge(t) {
  const el = document.createElement('span');
  el.className = 'type-badge';
  el.style.background = TYPE_COLOR[t] || '#999';
  el.textContent = `${TYPE_ICON[t] || ''} ${t}`;
  return el;
}

export class CommandMenu {
  constructor(root) {
    ensureCss();
    this.root = root;
    this.el = null;
    this.onChoice = null;
    this.mode = null;
    this.sel = 0;
  }

  clear() { if (this.el) { this.el.remove(); this.el = null; } this.mode = null; }

  /** Root FIGHT / BAG / PARTY / RUN */
  showRoot(ctx) {
    this.clear();
    this.mode = 'root';
    const d = document.createElement('div');
    d.className = 'cmdroot';
    const mk = (cls, label, fn, dis) => {
      const b = document.createElement('button');
      b.className = `cmdbtn ${cls}`; b.textContent = label; b.disabled = !!dis;
      b.onclick = () => { audio.sfx('ui_select'); fn(); };
      b.onmouseenter = () => audio.sfx('ui_move');
      d.appendChild(b); return b;
    };
    mk('fight', '⚔ Fight', () => this.showMoves(ctx));
    mk('bag', '🎒 Bag', () => this.showBag(ctx));
    mk('party', '🔄 Switch', () => this.showParty(ctx));
    mk('run', '🏳 Forfeit', () => this.onChoice?.({ kind: 'run' }), ctx.noRun);
    this.root.appendChild(d);
    this.el = d;
    this.buttons = [...d.querySelectorAll('.cmdbtn')];
    this._focus(0);
  }

  showMoves(ctx) {
    this.clear();
    this.mode = 'moves';
    const d = document.createElement('div');
    d.className = 'movegrid';
    const mon = ctx.active;
    const foe = ctx.foe;
    for (const slot of mon.moves) {
      const mv = getMove(slot.id);
      const b = document.createElement('button');
      b.className = 'movecard';
      b.disabled = slot.pp <= 0 || slot.disabled;
      b.style.setProperty('--tc', TYPE_COLOR[mv.type] || '#999');
      const eff = mv.category === 'status' ? null : typeEff(mv.type, foe.types);
      const effCls = eff === null ? '' : effLabel(eff);
      const effTxt = { super: '2×', quad: '4×', weak: '½×', quarter: '¼×', immune: '0×' }[effCls] || '';
      b.innerHTML = `
        <div class="mrow">
          <span class="mname">${mv.name}</span>
          <span class="mpp ${slot.pp <= slot.maxPp * 0.25 ? 'low' : ''}">${slot.pp}/${slot.maxPp}</span>
        </div>
        <div class="mmeta">
          <span class="type-badge" style="background:${TYPE_COLOR[mv.type]}">${TYPE_ICON[mv.type] || ''} ${mv.type}</span>
          <span>${mv.category === 'status' ? 'STATUS' : `${mv.power} PWR`}</span>
          <span>${mv.accuracy === null ? '—' : mv.accuracy + '%'}</span>
          ${effTxt ? `<span class="eff ${effCls}">${effTxt}</span>` : ''}
        </div>
        <div class="mdesc">${mv.desc || ''}</div>`;
      b.onclick = () => { if (b.disabled) { audio.sfx('ui_error'); return; } audio.sfx('ui_select'); this.onChoice?.({ kind: 'move', moveId: slot.id }); };
      b.onmouseenter = () => audio.sfx('ui_move');
      d.appendChild(b);
    }
    const back = document.createElement('button');
    back.className = 'backbtn'; back.textContent = '← Back';
    back.onclick = () => { audio.sfx('ui_back'); this.showRoot(ctx); };
    this.root.appendChild(d); this.root.appendChild(back);
    this.el = d; this._extra = back;
    this.buttons = [...d.querySelectorAll('.movecard')];
    this._focus(0);
  }

  showParty(ctx, forced = false) {
    this.clear();
    this.mode = 'party';
    const d = document.createElement('div');
    d.className = 'listpanel';
    d.innerHTML = `<h3>${forced ? 'Choose your next fighter' : 'Switch fighter'}</h3>`;
    ctx.party.forEach((p, i) => {
      const dis = p.fainted || i === ctx.activeIndex;
      const row = document.createElement('div');
      row.className = 'partyrow' + (dis ? ' dis' : '');
      const frac = Math.max(0, p.hp / p.maxHp);
      row.innerHTML = `
        <span class="pnm">${p.nickname}<br><span style="font-size:11px;opacity:.6">Lv${p.level}</span></span>
        <span class="ptypes"></span>
        <span class="phpbar"><span class="phpfill" style="width:${frac * 100}%;background:${frac > 0.5 ? '#4ad07a' : frac > 0.2 ? '#f2c94c' : '#ef4747'}"></span></span>
        <span class="phptxt">${p.hp}/${p.maxHp}</span>`;
      const tw = row.querySelector('.ptypes');
      p.types.forEach((t) => tw.appendChild(badge(t)));
      if (!dis) {
        row.onclick = () => { audio.sfx('ui_select'); this.onChoice?.({ kind: 'switch', toSlot: i }); };
        row.onmouseenter = () => audio.sfx('ui_move');
      }
      d.appendChild(row);
    });
    if (!forced) {
      const back = document.createElement('button');
      back.className = 'btn'; back.textContent = '← Back'; back.style.marginTop = '8px';
      back.onclick = () => { audio.sfx('ui_back'); this.showRoot(ctx); };
      d.appendChild(back);
    }
    this.root.appendChild(d);
    this.el = d;
  }

  showBag(ctx) {
    this.clear();
    this.mode = 'bag';
    const d = document.createElement('div');
    d.className = 'listpanel';
    d.innerHTML = `<h3>Bag</h3>`;
    const entries = Object.entries(ctx.items || {}).filter(([, n]) => n > 0);
    if (!entries.length) d.innerHTML += `<div class="dim" style="padding:10px">Your bag is empty.</div>`;
    for (const [id, qty] of entries) {
      const item = getItem(id);
      if (!item) continue;
      const row = document.createElement('div');
      row.className = 'bagrow';
      row.innerHTML = `<span><span class="bnm" style="color:${item.color}">${item.name}</span><br><span class="bdesc">${item.desc}</span></span><span class="bqty">×${qty}</span>`;
      row.onclick = () => { audio.sfx('ui_select'); this.onChoice?.({ kind: 'item', itemId: id, targetSlot: ctx.activeIndex }); };
      row.onmouseenter = () => audio.sfx('ui_move');
      d.appendChild(row);
    }
    const back = document.createElement('button');
    back.className = 'btn'; back.textContent = '← Back'; back.style.marginTop = '8px';
    back.onclick = () => { audio.sfx('ui_back'); this.showRoot(ctx); };
    d.appendChild(back);
    this.root.appendChild(d);
    this.el = d;
  }

  clear() {
    if (this.el) { this.el.remove(); this.el = null; }
    if (this._extra) { this._extra.remove(); this._extra = null; }
    this.buttons = null;
    this.mode = null;
  }

  _focus(i) {
    if (!this.buttons?.length) return;
    this.sel = Math.max(0, Math.min(this.buttons.length - 1, i));
    this.buttons.forEach((b, n) => b.classList.toggle('sel', n === this.sel));
  }

  /** Keyboard: returns true if the key was consumed. */
  key(e) {
    if (!this.buttons?.length) return false;
    const cols = 2;
    let i = this.sel;
    if (e.key === 'ArrowRight') i++;
    else if (e.key === 'ArrowLeft') i--;
    else if (e.key === 'ArrowDown') i += cols;
    else if (e.key === 'ArrowUp') i -= cols;
    else if (e.key === 'Enter' || e.key === ' ') { this.buttons[this.sel]?.click(); return true; }
    else return false;
    audio.sfx('ui_move');
    this._focus(i);
    return true;
  }
}
