// Placeholder screens that other agents will replace with real implementations:
// versus setup, single-player, team builder, dex, options.

import { audio } from '../../audio/audio.js';
import { allFighters } from '../../data/fighters.js';
import { AI_LEVELS } from '../../core/ai.js';
import { ARENAS } from '../../data/arenas.js';
import { TYPE_COLOR, TYPE_ICON } from '../../core/types.js';

const CSS = `
.sheet{ position:absolute; inset:0; overflow:auto; padding:4vh 4vw 12vh;
  background:linear-gradient(180deg, rgba(4,6,12,.7), rgba(4,6,12,.94)); }
.sheet h2{ font-family:var(--font-display); font-size:clamp(24px,4vw,44px); margin:0 0 4px; color:#f6f4ea; text-shadow:0 4px 0 #000; }
.sheet .lede{ color:#aab3c9; margin-bottom:22px; }
.grid{ display:grid; grid-template-columns:repeat(auto-fill,minmax(230px,1fr)); gap:12px; }
.card{ padding:14px; border-radius:14px; border:3px solid #000; background:linear-gradient(180deg,#1b2033,#0f1322);
  box-shadow:0 6px 0 rgba(0,0,0,.5); cursor:pointer; transition:transform .12s var(--ease-out); }
.card:hover{ transform:translateY(-4px); }
.card h4{ margin:0 0 2px; font-size:19px; }
.card .ep{ font-size:12px; color:#f2c94c; letter-spacing:.06em; text-transform:uppercase; margin-bottom:6px; }
.card .tt{ display:flex; gap:4px; margin-bottom:8px; }
.card .stats{ display:grid; grid-template-columns:auto 1fr auto; gap:3px 8px; font-size:11px; align-items:center; }
.card .bar{ height:6px; background:#2a3149; border-radius:99px; overflow:hidden; }
.card .bar i{ display:block; height:100%; background:linear-gradient(90deg,#4aa8ff,#8cffb8); }
.card .dex{ font-size:12px; color:#9aa3bd; margin-top:8px; line-height:1.35; }
.backrow{ position:fixed; left:2.4vw; bottom:2.4vh; z-index:5; }
.optrow{ display:flex; align-items:center; gap:14px; margin-bottom:14px; }
.optrow label{ min-width:170px; font-weight:700; }
input[type=range]{ width:min(320px,50vw); }
`;

function ensure() {
  if (document.getElementById('simple-css')) return;
  const s = document.createElement('style'); s.id = 'simple-css'; s.textContent = CSS;
  document.head.appendChild(s);
}

function backButton(app, root, to = 'title') {
  const d = document.createElement('div');
  d.className = 'backrow';
  const b = document.createElement('button');
  b.className = 'btn'; b.textContent = '← Back';
  b.onclick = () => { audio.sfx('ui_back'); app.router.go(to); };
  d.appendChild(b); root.appendChild(d);
}

export class VersusScreen {
  constructor(app) { this.app = app; }
  mount(root) {
    ensure(); this.root = root;
    root.innerHTML = `<div class="sheet">
      <h2>Versus a Friend</h2>
      <div class="lede">Hot-seat: take turns on one device. Each player's choices are hidden behind a hand-off screen.</div>
      <div class="grid" id="g"></div></div>`;
    const g = root.querySelector('#g');
    const mk = (title, sub, fn) => {
      const c = document.createElement('div'); c.className = 'card';
      c.innerHTML = `<h4>${title}</h4><div class="dex">${sub}</div>`;
      c.onclick = () => { audio.sfx('ui_select'); fn(); };
      g.appendChild(c);
    };
    mk('3v3 Random', 'Both players get a random team of three. Fast and fair.',
      () => this.app.router.go('battle', { mode: 'hotseat', teamSize: 3 }));
    mk('1v1 Duel', 'One fighter each. Pure matchup.',
      () => this.app.router.go('battle', { mode: 'hotseat', teamSize: 1 }));
    mk('6v6 Full Crew', 'The long game — switching, hazards, momentum.',
      () => this.app.router.go('battle', { mode: 'hotseat', teamSize: 6 }));
    backButton(this.app, root);
  }
  unmount() { this.root.innerHTML = ''; }
  update() {}
}

export class SingleScreen {
  constructor(app) { this.app = app; }
  mount(root) {
    ensure(); this.root = root;
    root.innerHTML = `<div class="sheet">
      <h2>Single Player</h2>
      <div class="lede">Pick your opposition.</div>
      <div class="grid" id="g"></div></div>`;
    const g = root.querySelector('#g');
    for (const [id, lv] of Object.entries(AI_LEVELS)) {
      const c = document.createElement('div'); c.className = 'card';
      c.innerHTML = `<h4>${lv.name}</h4><div class="ep">AI tier</div><div class="dex">${lv.desc}</div>`;
      c.onclick = () => { audio.sfx('ui_select'); this.app.router.go('battle', { mode: 'ai', aiLevel: id, teamSize: 3 }); };
      g.appendChild(c);
    }
    backButton(this.app, root);
  }
  unmount() { this.root.innerHTML = ''; }
  update() {}
}

export class DexScreen {
  constructor(app) { this.app = app; }
  mount(root) {
    ensure(); this.root = root;
    root.innerHTML = `<div class="sheet"><h2>Fighter Dex</h2>
      <div class="lede">${allFighters().length} fighters. Base stats out of 150.</div>
      <div class="grid" id="g"></div></div>`;
    const g = root.querySelector('#g');
    for (const f of allFighters()) {
      const c = document.createElement('div'); c.className = 'card';
      const tt = f.types.map((t) => `<span class="type-badge" style="background:${TYPE_COLOR[t]}">${TYPE_ICON[t]} ${t}</span>`).join('');
      const stats = Object.entries(f.base).map(([k, v]) =>
        `<span>${k.toUpperCase()}</span><span class="bar"><i style="width:${Math.min(100, v / 150 * 100)}%"></i></span><span>${v}</span>`).join('');
      c.innerHTML = `<h4>${f.name}</h4><div class="ep">${f.epithet}</div>
        <div class="tt">${tt}</div><div class="stats">${stats}</div><div class="dex">${f.dex}</div>`;
      g.appendChild(c);
    }
    backButton(this.app, root);
  }
  unmount() { this.root.innerHTML = ''; }
  update() {}
}

export class TeamBuilderScreen {
  constructor(app) { this.app = app; }
  mount(root) {
    ensure(); this.root = root;
    root.innerHTML = `<div class="sheet"><h2>Team Builder</h2>
      <div class="lede">Pick up to 3 fighters, then battle with them.</div>
      <div class="grid" id="g"></div></div>`;
    const g = root.querySelector('#g');
    this.picked = [];
    for (const f of allFighters()) {
      const c = document.createElement('div'); c.className = 'card';
      const tt = f.types.map((t) => `<span class="type-badge" style="background:${TYPE_COLOR[t]}">${TYPE_ICON[t]} ${t}</span>`).join('');
      c.innerHTML = `<h4>${f.name}</h4><div class="ep">${f.epithet}</div><div class="tt">${tt}</div><div class="dex">${f.dex}</div>`;
      c.onclick = () => {
        const i = this.picked.indexOf(f.id);
        if (i >= 0) { this.picked.splice(i, 1); c.style.outline = ''; audio.sfx('ui_back'); }
        else if (this.picked.length < 3) { this.picked.push(f.id); c.style.outline = '3px solid #f2c94c'; audio.sfx('ui_select'); }
        else audio.sfx('ui_error');
        this.$go.disabled = this.picked.length === 0;
        this.$go.textContent = `Battle with ${this.picked.length}/3`;
      };
      g.appendChild(c);
    }
    const d = document.createElement('div'); d.className = 'backrow';
    d.style.display = 'flex'; d.style.gap = '10px';
    const back = document.createElement('button'); back.className = 'btn'; back.textContent = '← Back';
    back.onclick = () => { audio.sfx('ui_back'); this.app.router.go('title'); };
    const go = document.createElement('button'); go.className = 'btn primary'; go.textContent = 'Battle with 0/3'; go.disabled = true;
    go.onclick = () => {
      audio.sfx('ui_select');
      import('../../data/fighters.js').then(({ makeDefaultMember }) => {
        this.app.router.go('battle', {
          mode: 'ai', aiLevel: 'ace',
          p0Team: this.picked.map((id) => makeDefaultMember(id, 50)),
          teamSize: this.picked.length
        });
      });
    };
    this.$go = go;
    d.appendChild(back); d.appendChild(go);
    root.appendChild(d);
  }
  unmount() { this.root.innerHTML = ''; }
  update() {}
}

export class OptionsScreen {
  constructor(app) { this.app = app; }
  mount(root) {
    ensure(); this.root = root;
    const s = this.app.settings;
    root.innerHTML = `<div class="sheet"><h2>Options</h2><div class="lede">Saved to this browser.</div>
      <div class="optrow"><label>Master volume</label><input type="range" id="vol" min="0" max="1" step="0.05" value="${s.masterVol}"></div>
      <div class="optrow"><label>Music</label><input type="range" id="mus" min="0" max="1" step="0.05" value="${s.musicVol}"></div>
      <div class="optrow"><label>SFX</label><input type="range" id="sfx" min="0" max="1" step="0.05" value="${s.sfxVol}"></div>
      <div class="optrow"><label>Battle speed</label><input type="range" id="spd" min="1" max="4" step="1" value="${s.battleSpeed}"><span id="spdv">${s.battleSpeed}×</span></div>
      <div class="optrow"><label>Reduced motion</label><input type="checkbox" id="rm" ${s.reducedMotion ? 'checked' : ''}></div>
      <div class="optrow"><label>Show HP numbers for foe</label><input type="checkbox" id="foehp" ${s.foeHpNumbers ? 'checked' : ''}></div>
    </div>`;
    const bind = (id, fn) => { const el = root.querySelector('#' + id); el.oninput = () => fn(el); };
    bind('vol', (el) => { s.masterVol = +el.value; this.app.audio.setMaster(s.masterVol); this.app.saveSettings(); });
    bind('mus', (el) => { s.musicVol = +el.value; this.app.audio.setMusicVol(s.musicVol); this.app.saveSettings(); });
    bind('sfx', (el) => { s.sfxVol = +el.value; this.app.audio.setSfxVol(s.sfxVol); this.app.saveSettings(); });
    bind('spd', (el) => { s.battleSpeed = +el.value; root.querySelector('#spdv').textContent = s.battleSpeed + '×'; this.app.saveSettings(); });
    bind('rm', (el) => { s.reducedMotion = el.checked; this.app.stage.feel.reduced = el.checked; this.app.saveSettings(); });
    bind('foehp', (el) => { s.foeHpNumbers = el.checked; this.app.plates[1].showNumbers = el.checked; this.app.saveSettings(); });
    backButton(this.app, root);
  }
  unmount() { this.root.innerHTML = ''; }
  update() {}
}
