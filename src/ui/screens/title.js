// Title screen. The first thing anyone sees, so the stage is live: real
// fighters idling on a real arena with the camera drifting around them, and
// the shortest possible path from cold start to a punch.

import { audio } from '../../audio/audio.js';
import * as Save from '../../meta/save.js';
import { rankFor, activeTeam, unlockedArenas, isUnlocked } from '../../meta/progression.js';
import { loadRun, roundName, getCup, gauntletLive } from '../../meta/runs.js';
import { allFighters } from '../../data/fighters.js';
import { injectScreenCss, StageCast, orbitCamera, el, esc, toast, portrait } from './common.js';
import { openHelp } from './help.js';

const CSS = `
.tt-wrap{ position:absolute; inset:0; display:grid; align-items:center;
  grid-template-columns:minmax(320px, 40%) 1fr;
  background:linear-gradient(100deg, rgba(4,6,12,.94) 0%, rgba(4,6,12,.78) 34%, rgba(4,6,12,.10) 62%, rgba(4,6,12,.42) 100%); }
.tt-left{ padding:0 clamp(18px,3.4vw,54px); max-height:100%; overflow:auto; }
.tt-logo{ animation:slideUp .55s var(--ease-out) both; margin-bottom:20px; }
.tt-logo .a{ font-family:var(--font-display); font-size:clamp(34px,5.6vw,72px); line-height:.88;
  color:#f6f4ea; text-shadow:0 5px 0 #000, 0 0 44px rgba(242,201,76,.42), 0 16px 44px rgba(0,0,0,.85); }
.tt-logo .b{ font-family:var(--font-display); font-size:clamp(17px,2.5vw,33px); color:var(--gold);
  text-shadow:0 3px 0 #000; letter-spacing:.34em; margin-top:3px; }
.tt-logo .c{ margin-top:9px; font-weight:700; font-size:clamp(11px,1.15vw,13px); color:#9fabc6;
  letter-spacing:.2em; text-transform:uppercase; }

.tt-menu{ display:flex; flex-direction:column; gap:8px; width:min(430px,100%);
  animation:slideUp .5s .1s var(--ease-out) both; }
.tt-item{ display:flex; align-items:center; gap:13px; text-align:left; width:100%;
  padding:11px 15px; border-radius:13px; border:3px solid #000; cursor:pointer; font-family:inherit;
  background:linear-gradient(180deg,#222a44,#141a2c); color:#eef2fb;
  box-shadow:0 5px 0 rgba(0,0,0,.55); transition:transform .11s var(--ease-out), box-shadow .11s, filter .11s; }
.tt-item:hover{ transform:translateX(4px) translateY(-2px); box-shadow:0 7px 0 rgba(0,0,0,.55); filter:brightness(1.1); }
.tt-item:active{ transform:translateY(2px); box-shadow:0 2px 0 rgba(0,0,0,.55); }
.tt-item:focus-visible{ outline:3px solid var(--gold); outline-offset:3px; }
.tt-item .ic{ font-size:22px; width:30px; text-align:center; flex:0 0 auto; filter:drop-shadow(0 2px 0 rgba(0,0,0,.6)); }
.tt-item .tx{ flex:1 1 auto; min-width:0; }
.tt-item .l{ font-weight:900; font-size:16.5px; letter-spacing:.02em; }
.tt-item .d{ font-size:11.5px; color:#93a0bd; margin-top:1px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.tt-item .kbd{ font-size:10px; color:#6f7a95; border:1.5px solid #3a4560; padding:1px 5px; border-radius:5px; }
.tt-item.hero{ background:linear-gradient(180deg,var(--gold),var(--gold-deep)); color:#1a1405; border-color:#000;
  animation:pulseGold 2.8s infinite; }
.tt-item.hero .d{ color:#4a3a0a; }
.tt-item.hero .l{ font-size:19px; }
.tt-item.run{ background:linear-gradient(180deg,#3b2a5e,#22183a); }
.tt-item.run .d{ color:#c9b6e8; }
.tt-item.lock{ opacity:.5; cursor:not-allowed; }

.tt-strip{ display:flex; align-items:center; gap:12px; margin-top:18px; flex-wrap:wrap;
  animation:fadeIn .6s .3s both; }
.tt-rank{ display:flex; align-items:center; gap:10px; padding:7px 13px 7px 8px; border-radius:999px;
  border:3px solid #000; background:linear-gradient(180deg,#1c2338,#11162a); box-shadow:0 4px 0 rgba(0,0,0,.5); }
.tt-rank .rk{ font-weight:900; font-size:13.5px; }
.tt-rank .bt{ font-size:10.5px; color:var(--gold); letter-spacing:.08em; font-variant-numeric:tabular-nums; }
.tt-xp{ width:88px; height:6px; border-radius:99px; background:#0d111c; border:1px solid #000; overflow:hidden; }
.tt-xp i{ display:block; height:100%; background:linear-gradient(90deg,#4aa8ff,#8cffb8); }
.tt-rec{ font-size:12px; color:#8e9ab8; font-weight:700; letter-spacing:.06em; }

.tt-crew{ display:flex; gap:6px; align-items:center; }
.tt-corner{ position:absolute; right:clamp(12px,2.2vw,26px); top:clamp(12px,2.2vh,22px); display:flex; gap:8px; z-index:4; }
.tt-legal{ position:absolute; left:0; right:0; bottom:8px; text-align:center; font-size:10.5px; color:#5f6884; }

@media (max-width: 900px){
  .tt-wrap{ grid-template-columns:1fr;
    background:linear-gradient(180deg, rgba(4,6,12,.55) 0%, rgba(4,6,12,.30) 30%, rgba(4,6,12,.93) 62%, rgba(4,6,12,.98) 100%);
    align-items:end; }
  .tt-left{ padding:0 16px 34px; }
  .tt-logo{ margin-bottom:14px; text-align:center; }
  .tt-menu{ width:100%; }
  .tt-item .d{ display:none; }
  .tt-strip{ justify-content:center; }
}
`;

export class TitleScreen {
  constructor(app) { this.app = app; }

  mount(root) {
    injectScreenCss();
    if (!document.getElementById('title-css')) {
      const s = document.createElement('style'); s.id = 'title-css'; s.textContent = CSS;
      document.head.appendChild(s);
    }
    this.root = root;
    this.t = 0;

    const save = Save.data();
    const rank = rankFor(save.xp);
    const rec = save.record;

    const wrap = el('div', 'tt-wrap');
    const left = el('div', 'tt-left');
    left.innerHTML = `
      <div class="tt-logo">
        <div class="a">GRAND LINE</div>
        <div class="b">ARENA</div>
        <div class="c">Tactical fighter battles</div>
      </div>`;
    const menu = el('div', 'tt-menu');
    left.appendChild(menu);
    wrap.appendChild(left);
    root.appendChild(wrap);

    const corner = el('div', 'tt-corner');
    const helpBtn = el('button', 'btn sm ghost', '?');
    helpBtn.title = 'Help & controls (H)';
    helpBtn.onclick = () => { audio.sfx('ui_select'); openHelp(this.app); };
    corner.appendChild(helpBtn);
    root.appendChild(corner);

    root.appendChild(el('div', 'tt-legal',
      'A non-commercial fan tribute. All characters belong to their respective creators.'));

    /* ---------------- menu ---------------- */
    const item = (icon, label, desc, fn, cls = '') => {
      const b = el('button', `tt-item ${cls}`);
      b.type = 'button';
      b.innerHTML = `<span class="ic">${icon}</span><span class="tx"><span class="l">${esc(label)}</span><span class="d">${esc(desc)}</span></span>`;
      b.onclick = () => { audio.resume(); audio.sfx('ui_select'); fn(); };
      b.onmouseenter = () => audio.sfx('ui_move');
      menu.appendChild(b);
      return b;
    };

    const firstRun = !save.tutorial.done && !save.tutorial.skipped && rec.played === 0;

    if (firstRun) {
      item('🎓', 'Start Here', 'Learn type matchups, switching and status in one fight.',
        () => this.app.router.go('tutorial'), 'hero');
      item('⚔', 'Quick Battle', 'Skip the lesson. Random 3v3 against the Ace AI.',
        () => this.quick());
    } else {
      item('⚔', 'Quick Battle', this.quickDesc(save), () => this.quick(), 'hero');
    }

    // Resume anything the player left half-finished.
    const trn = loadRun('tournament');
    if (trn && trn.status === 'active') {
      item('🏆', `Continue — ${getCup(trn.cupId).name}`, `${roundName(trn)} · ${trn.history.filter((h) => h.win).length} won`,
        () => this.app.router.go('tournament'), 'run');
    }
    const gnt = loadRun('gauntlet');
    if (gnt && gnt.status === 'active') {
      item('💀', 'Continue — Gauntlet', `Stage ${gnt.stage + 1} · ${gauntletLive(gnt).length} still standing`,
        () => this.app.router.go('gauntlet'), 'run');
    }

    item('🛠', 'Team Builder', save.teams.length
      ? `${save.teams.length} saved crew${save.teams.length === 1 ? '' : 's'} · trade codes with friends`
      : 'Build a crew, tune it, share it as a code.',
      () => this.app.router.go('teambuilder'));
    item('🧭', 'Modes', 'Tournament, gauntlet, daily challenge, hot-seat versus.',
      () => this.app.router.go('mode'));
    item('📖', 'Fighter Dex', `${allFighters().length} fighters, every learnset and matchup.`,
      () => this.app.router.go('dex'));
    item('⚙', 'Options', 'Sound, speed, accessibility, save data.',
      () => this.app.router.go('options'));

    if (!firstRun && !save.tutorial.done) {
      item('🎓', 'Tutorial', 'The five-minute version of how this game works.',
        () => this.app.router.go('tutorial'));
    }

    /* ---------------- status strip ---------------- */
    const strip = el('div', 'tt-strip');
    const rk = el('div', 'tt-rank');
    rk.innerHTML = `<div><div class="rk">${esc(rank.name)}</div><div class="bt">฿ ${rank.bounty}</div></div>`;
    const xp = el('div', 'tt-xp');
    xp.appendChild(Object.assign(el('i'), { style: `width:${Math.round(rank.progress * 100)}%` }));
    rk.appendChild(xp);
    strip.appendChild(rk);

    strip.appendChild(el('div', 'tt-rec',
      rec.played ? `${rec.won}W · ${rec.lost}L${rec.streak > 1 ? ` · ${rec.streak} streak` : ''}` : 'No battles yet'));

    const team = activeTeam(save);
    if (team?.members?.length) {
      const crew = el('div', 'tt-crew');
      for (const m of team.members.slice(0, 4)) crew.appendChild(portrait(m.speciesId, 'rd'));
      strip.appendChild(crew);
    }
    left.appendChild(strip);

    /* ---------------- the living stage ---------------- */
    const arenas = unlockedArenas(save);
    const arenaId = (arenas[new Date().getDate() % arenas.length] || arenas[0]).id;
    this.app.stage.buildArena(arenaId);
    this.app.view?.reset?.();
    this.app.plates?.forEach?.((p) => p.hide());
    this.app.textbox?.hide?.();

    this.cast = new StageCast(this.app);
    this.cast.set(this.castList(save));

    audio.startMusic('title');
    audio.setIntensity(0.32);

    const health = Save.status();
    if (health.corrupt && !this._warned) {
      this._warned = true;
      toast('Your save file was unreadable and has been reset. The old one was kept as a backup.', 'bad', 6000);
    } else if (health.storage === 'memory' && !this._warned) {
      this._warned = true;
      toast('Storage is blocked in this browser — progress will not survive a reload.', 'bad', 5200);
    }
  }

  quickDesc(save) {
    const team = activeTeam(save);
    if (team?.members?.length) return `Straight into a fight with ${esc(team.name)}.`;
    return 'Random 3v3, right now, against the Ace AI.';
  }

  quick() {
    const save = Save.data();
    const team = activeTeam(save);
    const params = { mode: 'ai', aiLevel: 'ace', teamSize: 3, meta: { kind: 'quick' } };
    if (team?.members?.length) {
      params.p0Team = team.members.slice(0, 3);
      params.teamSize = params.p0Team.length;
      params.p0Name = team.name;
    }
    this.app.router.go('battle', params);
  }

  /** Who stands on the stage: your crew if you have one, otherwise a rotating cast. */
  castList(save) {
    const team = activeTeam(save);
    let ids = team?.members?.map((m) => m.speciesId).slice(0, 3) || [];
    if (ids.length < 3) {
      const day = new Date().getDate() + new Date().getMonth() * 31;
      const pool = allFighters().map((f) => f.id).filter((id) => !ids.includes(id));
      while (ids.length < 3 && pool.length) ids.push(pool[(day * 7 + ids.length * 5) % pool.length]);
    }
    const spots = [
      { x: -4.4, z: 1.4, rotY: 0.38 },
      { x: 0.4, z: -0.6, rotY: 0.06 },
      { x: 4.8, z: 1.0, rotY: -0.42 }
    ];
    return ids.slice(0, 3).map((id, i) => ({ id, ...spots[i], state: i === 1 ? 'ready' : 'idle', facing: i === 2 ? -1 : 1 }));
  }

  update(dt) {
    this.t += dt;
    this.cast?.update(dt);
    orbitCamera(this.app, this.t, {
      radius: 12.4, height: 3.9, speed: 0.014,
      target: { x: 1.4, y: 1.65, z: 0.2 }, angle: 0.18, fov: 39
    });
  }

  unmount() {
    this.cast?.dispose();
    this.cast = null;
    this.root.innerHTML = '';
  }

  key(e) {
    if (e.key === 'Enter') { this.quick(); return true; }
    return false;
  }
}
