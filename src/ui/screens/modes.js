// Mode select. Every way into a fight, in one place, with the state of each
// one written on its face: the run you left half-finished, whether today's
// daily is done, how many crews you have saved.

import { audio } from '../../audio/audio.js';
import * as Save from '../../meta/save.js';
import { isUnlocked, lockedList, activeTeam, rankFor } from '../../meta/progression.js';
import { loadRun, roundName, getCup, gauntletLive, dailyChallenge, dateKey, GAUNTLET_LADDER } from '../../meta/runs.js';
import { getOpponent } from '../../meta/opponents.js';
import { LinkTransport } from '../../net/link.js';
import { injectScreenCss, shell, el, esc, button, portrait, toast, StageCast, orbitCamera } from './common.js';

const CSS = `
.md-grid{ display:grid; gap:13px; grid-template-columns:repeat(auto-fill,minmax(292px,1fr)); }
.md{ position:relative; display:flex; gap:13px; align-items:flex-start; text-align:left; width:100%;
  padding:14px; border-radius:16px; border:3px solid #000; cursor:pointer; font-family:inherit; color:inherit;
  background:linear-gradient(180deg,#212840,#141a2b); box-shadow:0 6px 0 rgba(0,0,0,.5);
  transition:transform .12s var(--ease-out), box-shadow .12s, filter .12s; }
.md:hover{ transform:translateY(-3px); box-shadow:0 9px 0 rgba(0,0,0,.5); filter:brightness(1.08); }
.md:focus-visible{ outline:3px solid var(--gold); outline-offset:3px; }
.md .ic{ font-size:31px; width:44px; text-align:center; flex:0 0 auto; filter:drop-shadow(0 3px 0 rgba(0,0,0,.6)); }
.md .tx{ min-width:0; flex:1 1 auto; }
.md .t{ font-family:var(--font-display); font-size:19px; line-height:1.05; color:#fff; }
.md .d{ font-size:12.5px; color:#a2adc6; margin-top:4px; line-height:1.4; }
.md .st{ margin-top:8px; display:flex; gap:6px; flex-wrap:wrap; }
.md.hot{ background:linear-gradient(180deg,#3b2a5e,#22183a); }
.md.gold{ background:linear-gradient(180deg,var(--gold),var(--gold-deep)); color:#1a1405; }
.md.gold .t{ color:#1a1405; } .md.gold .d{ color:#4a3a0a; }
.md.lock{ opacity:.55; cursor:not-allowed; filter:saturate(.3); }
.md .badge{ position:absolute; right:10px; top:10px; font-size:9.5px; font-weight:900; letter-spacing:.12em;
  text-transform:uppercase; padding:3px 8px; border-radius:99px; border:2px solid #000; background:var(--gold); color:#16192a; }
.md .badge.live{ background:#4ad07a; }
.md .badge.done{ background:#7fd8ff; }
`;

export class ModeScreen {
  constructor(app) { this.app = app; }

  mount(root) {
    injectScreenCss();
    if (!document.getElementById('modes-css')) {
      const s = document.createElement('style'); s.id = 'modes-css'; s.textContent = CSS;
      document.head.appendChild(s);
    }
    this.root = root;
    this.t = 0;
    const save = Save.data();
    const rank = rankFor(save.xp);

    const sh = shell(root, {
      title: 'Modes',
      sub: `${rank.name} · ${save.record.won}W ${save.record.lost}L · ${save.teams.length} crew${save.teams.length === 1 ? '' : 's'} saved`,
      onBack: () => this.app.router.go('title')
    });
    this.sh = sh;

    const grid = el('div', 'md-grid');
    sh.body.appendChild(grid);

    const card = (opts) => {
      const b = el('button', `md ${opts.cls || ''}`);
      b.type = 'button';
      b.innerHTML = `<span class="ic">${opts.icon}</span>
        <span class="tx"><span class="t">${esc(opts.title)}</span><span class="d">${esc(opts.desc)}</span></span>`;
      if (opts.badge) {
        const bd = el('span', `badge ${opts.badgeCls || ''}`, esc(opts.badge));
        b.appendChild(bd);
      }
      if (opts.chips?.length) {
        const st = el('span', 'st');
        for (const c of opts.chips) st.appendChild(el('span', 'chip sm', esc(c)));
        b.querySelector('.tx').appendChild(st);
      }
      if (opts.locked) {
        b.classList.add('lock');
        b.onclick = () => { audio.sfx('ui_error'); toast(opts.lockText || 'Not unlocked yet.', 'bad'); };
      } else {
        b.onclick = () => { audio.sfx('ui_select'); opts.go(); };
      }
      grid.appendChild(b);
      return b;
    };

    /* ---- resume anything in progress ---- */
    const trn = loadRun('tournament');
    const gnt = loadRun('gauntlet');
    if (trn?.status === 'active') {
      card({
        icon: '🏆', cls: 'hot', badge: 'in progress', badgeCls: 'live',
        title: `${getCup(trn.cupId).name} — continue`,
        desc: `${roundName(trn)}. ${trn.history.filter((h) => h.win).length} win${trn.history.filter((h) => h.win).length === 1 ? '' : 's'} so far.`,
        go: () => this.app.router.go('tournament')
      });
    }
    if (gnt?.status === 'active') {
      card({
        icon: '💀', cls: 'hot', badge: 'in progress', badgeCls: 'live',
        title: 'Gauntlet — continue',
        desc: `Stage ${gnt.stage + 1} of ${GAUNTLET_LADDER.length}. ${gauntletLive(gnt).length} still standing.`,
        go: () => this.app.router.go('gauntlet')
      });
    }

    /* ---- daily ---- */
    const key = dateKey();
    let daily = null;
    try { daily = dailyChallenge(key); } catch { /* fall through to a plain card */ }
    const played = save.daily?.[key];
    card({
      icon: '📅', cls: played ? '' : 'gold',
      badge: played ? `${played.best ?? played.score} pts` : 'new today',
      badgeCls: played ? 'done' : '',
      title: 'Daily Challenge',
      desc: daily
        ? `${daily.twist.name} — ${daily.twist.desc} Facing ${getOpponent(daily.opponentId)?.name}.`
        : 'One fixed fight, generated from today\'s date.',
      chips: daily ? [key, daily.aiLevel] : [key],
      go: () => this.app.router.go('daily')
    });

    /* ---- tournament / gauntlet entries ---- */
    if (!trn || trn.status !== 'active') {
      const locked = !isUnlocked('modes', 'tournament');
      card({
        icon: '🏆', title: 'Tournament', locked,
        lockText: 'Play one battle to open the cups.',
        desc: 'A bracket you can be knocked out of. The other half of the draw is simulated with the real engine.',
        chips: ['4 or 8 entrants', 'trophies'],
        go: () => this.app.router.go('tournament')
      });
    }
    if (!gnt || gnt.status !== 'active') {
      const locked = !isUnlocked('modes', 'gauntlet');
      card({
        icon: '💀', title: 'Survival Gauntlet', locked,
        lockText: 'Win two battles to open the gauntlet.',
        desc: 'Eleven crews in a row. No healing, and anyone who falls is out of the run for good.',
        chips: ['11 stages', 'permadeath'],
        go: () => this.app.router.go('gauntlet')
      });
    }

    /* ---- versus ---- */
    card({
      icon: '🔗', title: 'Link Battle',
      desc: LinkTransport.supported
        ? 'Play a friend on another device. No server: they paste your code, you paste theirs.'
        : 'This browser has no WebRTC, so link battles cannot connect from here.',
      chips: LinkTransport.supported ? ['peer to peer', 'lockstep'] : ['unsupported browser'],
      go: () => this.app.router.go('link')
    });
    card({
      icon: '🤝', title: 'Hot-seat Versus',
      desc: 'Two players, one device. The screen is covered while it changes hands.',
      chips: ['1v1', '3v3', '6v6'],
      go: () => this.app.router.go('versus')
    });
    card({
      icon: '⚔', title: 'Single Battle',
      desc: 'Pick an opponent and a difficulty, bring whatever crew you like.',
      chips: ['5 AI tiers'],
      go: () => this.app.router.go('single')
    });

    /* ---- support ---- */
    card({
      icon: '🛠', title: 'Team Builder',
      desc: activeTeam(save)?.members?.length
        ? `Editing "${activeTeam(save).name}". Trade it as a code.`
        : 'Build a crew, tune the training, share it as one pasteable string.',
      go: () => this.app.router.go('teambuilder')
    });
    card({
      icon: '🎓', title: save.tutorial.done ? 'Tutorial (replay)' : 'Tutorial',
      desc: 'Type matchups, switching and status, taught in one short fight.',
      badge: save.tutorial.done ? 'done' : '', badgeCls: 'done',
      go: () => this.app.router.go('tutorial')
    });

    /* ---- what is still locked ---- */
    const locked = lockedList(save);
    if (locked.length) {
      const p = el('div', 'pane tight');
      p.style.marginTop = '16px';
      p.appendChild(el('h3', null, `Still to earn (${locked.length})`));
      for (const u of locked.slice(0, 8)) {
        p.appendChild(el('div', 'note warn', `<b>${esc(u.name)}</b> — ${esc(u.blurb)}`));
      }
      sh.body.appendChild(p);
    }

    /* ---- stage ---- */
    this.app.stage.buildArena('marineford');
    this.app.view?.reset?.();
    this.app.plates?.forEach?.((p) => p.hide());
    this.app.textbox?.hide?.();
    this.cast = new StageCast(this.app);
    const team = activeTeam(save);
    const ids = (team?.members || []).slice(0, 2).map((m) => m.speciesId);
    while (ids.length < 2) ids.push(['luffy', 'zoro', 'law', 'mihawk'][(ids.length + new Date().getDate()) % 4]);
    this.cast.set([
      { id: ids[0], x: -2.6, z: 0.6, rotY: 0.4, state: 'idle' },
      { id: ids[1], x: 2.6, z: 0.2, rotY: -0.4, state: 'ready', facing: -1 }
    ]);
    audio.startMusic('title');
    audio.setIntensity(0.28);
  }

  update(dt) {
    this.t += dt;
    this.cast?.update(dt);
    orbitCamera(this.app, this.t, {
      radius: 11.5, height: 4.2, speed: 0.012, target: { x: 0, y: 1.7, z: 0 }, angle: 1.1, fov: 38
    });
  }

  unmount() { this.cast?.dispose(); this.cast = null; this.root.innerHTML = ''; }
}
