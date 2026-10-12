// The three modes with a reason to come back: a tournament bracket you can be
// knocked out of, a gauntlet that never heals you, and a daily challenge that
// is the same fight for everybody on the planet.
//
// All three keep their state in the save (meta/runs.js), so a half-finished
// run survives a reload — including one you are halfway through losing.

import { audio } from '../../audio/audio.js';
import { getFighter, makeDefaultMember, allFighters } from '../../data/fighters.js';
import { getMove } from '../../data/moves.js';
import { getArena } from '../../data/arenas.js';
import { RNG } from '../../core/rng.js';
import * as Save from '../../meta/save.js';
import { activeTeam } from '../../meta/progression.js';
import {
  CUPS, getCup, createTournament, playerOpponent, entrantOf, roundName,
  createGauntlet, gauntletLive, gauntletOpponent, GAUNTLET_LADDER, BOONS, applyBoon,
  dailyChallenge, dateKey, storeRun, loadRun, clearRun, arenaFor
} from '../../meta/runs.js';
import { getOpponent, opponentTeam, bark, TIER_ORDER } from '../../meta/opponents.js';
import {
  shell, injectScreenCss, el, esc, button, portrait, toast, modal, StageCast
} from './common.js';

const CSS = `
.rn-hero{ display:flex; gap:16px; align-items:center; padding:14px 16px; border-radius:16px; border:3px solid #000;
  background:linear-gradient(120deg, rgba(30,38,62,.96), rgba(14,18,30,.96)); box-shadow:0 7px 0 rgba(0,0,0,.45);
  margin-bottom:14px; }
.rn-hero .txt{ min-width:0; flex:1 1 auto; }
.rn-hero .t{ font-family:var(--font-display); font-size:clamp(20px,3vw,30px); color:#fff; line-height:1.05; }
.rn-hero .e{ font-size:11px; letter-spacing:.18em; text-transform:uppercase; font-weight:900; margin-top:3px; }
.rn-hero .say{ margin-top:8px; font-size:14px; font-style:italic; color:#e6ecfa; line-height:1.4; max-width:62ch; }
.rn-hero .sty{ margin-top:5px; font-size:12px; color:#9fabc6; }
.rn-hero .go{ flex:0 0 auto; display:flex; flex-direction:column; gap:7px; align-items:stretch; }

.brk{ display:flex; gap:10px; overflow-x:auto; padding-bottom:6px; }
.brk-col{ display:flex; flex-direction:column; justify-content:space-around; gap:8px; min-width:172px; flex:1 1 0; }
.brk-col h4{ margin:0 0 2px; font-size:10px; letter-spacing:.14em; text-transform:uppercase; color:#8e9ab8; text-align:center; }
.mtch{ border:2px solid #000; border-radius:11px; overflow:hidden; background:#141a2b; box-shadow:0 3px 0 rgba(0,0,0,.45); }
.mtch.live{ border-color:var(--gold); box-shadow:0 0 0 2px rgba(242,201,76,.35), 0 3px 0 rgba(0,0,0,.45); }
.ent{ display:flex; align-items:center; gap:7px; padding:5px 8px; font-size:12.5px; }
.ent + .ent{ border-top:2px solid rgba(0,0,0,.6); }
.ent .n{ flex:1 1 auto; min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; font-weight:700; }
.ent.win{ background:linear-gradient(90deg, rgba(74,208,122,.20), transparent); }
.ent.win .n{ font-weight:900; color:#dfffe9; }
.ent.out{ opacity:.42; }
.ent.you .n{ color:var(--gold); }
.ent .tb{ font-size:9px; letter-spacing:.06em; color:#8e9ab8; text-transform:uppercase; }
.ent .av{ width:22px; height:22px; border-radius:50%; overflow:hidden; flex:0 0 auto; border:1px solid #000; }
.ent .av img{ width:100%; height:100%; object-fit:cover; object-position:50% 8%; }

.ladder{ display:flex; flex-direction:column; gap:5px; }
.lstep{ display:flex; align-items:center; gap:9px; padding:6px 9px; border-radius:10px; background:rgba(255,255,255,.04);
  font-size:13px; border-left:4px solid transparent; }
.lstep.done{ border-left-color:#4ad07a; color:#a9d8bd; }
.lstep.now{ border-left-color:var(--gold); background:linear-gradient(90deg, rgba(242,201,76,.18), rgba(255,255,255,.03)); }
.lstep .i{ width:20px; font-weight:900; color:#8e9ab8; font-variant-numeric:tabular-nums; }
.lstep .t{ flex:1 1 auto; font-weight:700; }
.lstep .r{ font-size:10.5px; letter-spacing:.08em; text-transform:uppercase; color:#8e9ab8; }

.crewstrip{ display:flex; gap:8px; flex-wrap:wrap; }
.cmini{ width:74px; text-align:center; font-size:11px; }
.cmini.down{ opacity:.35; filter:grayscale(1); }
.cmini .nm{ margin-top:3px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; font-weight:700; }
.cmini .st{ font-size:9.5px; color:#ff9a9a; letter-spacing:.08em; text-transform:uppercase; }

.cupcard{ text-align:left; padding:14px; border-radius:16px; border:3px solid #000; cursor:pointer;
  background:linear-gradient(180deg,#1e2438,#12172a); box-shadow:0 6px 0 rgba(0,0,0,.5); width:100%;
  font-family:inherit; color:inherit; transition:transform .12s var(--ease-out); }
.cupcard:hover{ transform:translateY(-3px); }
.cupcard .t{ font-family:var(--font-display); font-size:21px; }
.cupcard .s{ font-size:11px; letter-spacing:.16em; text-transform:uppercase; margin:2px 0 8px; font-weight:900; }
.cupcard .d{ font-size:13px; color:#a9b4cc; line-height:1.4; }
.cupcard .f{ margin-top:9px; display:flex; gap:6px; flex-wrap:wrap; }

.dtile{ display:grid; grid-template-columns:auto 1fr auto; gap:10px; align-items:center; padding:8px 11px;
  border-radius:11px; background:rgba(255,255,255,.045); font-size:13px; }
.dtile .d{ font-variant-numeric:tabular-nums; color:#8e9ab8; font-size:11.5px; }
.dtile b{ font-variant-numeric:tabular-nums; }
.twist{ padding:10px 12px; border-radius:12px; border-left:4px solid var(--gold); background:rgba(242,201,76,.12); }
.twist b{ font-size:14px; } .twist span{ display:block; font-size:12.5px; color:#d8dcea; margin-top:2px; }
@media (max-width:820px){ .rn-hero{ flex-direction:column; align-items:flex-start; } .rn-hero .go{ width:100%; } }
`;

function ensureCss() {
  injectScreenCss();
  if (document.getElementById('runs-css')) return;
  const s = document.createElement('style'); s.id = 'runs-css'; s.textContent = CSS;
  document.head.appendChild(s);
}

/* ------------------------------------------------------------------ */
/* shared pieces                                                       */
/* ------------------------------------------------------------------ */

/** The big "here is who you are fighting and what they think of you" card. */
export function opponentHero(op, opts = {}) {
  const box = el('div', 'rn-hero');
  box.style.borderColor = '#000';
  box.style.boxShadow = `0 7px 0 rgba(0,0,0,.45), inset 0 0 0 2px ${op?.accent || '#f2c94c'}33`;
  box.appendChild(portrait(op?.crew?.[0] || 'luffy', 'xl'));
  const txt = el('div', 'txt');
  txt.appendChild(el('div', 't', esc(op?.name || 'Unknown')));
  const e = el('div', 'e', esc(op?.title || ''));
  e.style.color = op?.accent || 'var(--gold)';
  txt.appendChild(e);
  txt.appendChild(el('div', 'say', `“${esc(bark(op, opts.situation || 'taunt'))}”`));
  txt.appendChild(el('div', 'sty', esc(op?.style || '')));
  if (op?.crew) {
    const crew = el('div', 'crewstrip');
    crew.style.marginTop = '9px';
    for (const id of op.crew.slice(0, opts.size || 3)) {
      const c = el('div', 'cmini');
      c.appendChild(portrait(id, 'sm'));
      c.appendChild(el('div', 'nm', esc(getFighter(id)?.name || id)));
      crew.appendChild(c);
    }
    txt.appendChild(crew);
  }
  box.appendChild(txt);
  const go = el('div', 'go');
  box.appendChild(go);
  box.actions = go;
  return box;
}

/** Small crew strip with knocked-out members greyed. */
export function crewStrip(members, down = []) {
  const w = el('div', 'crewstrip');
  for (const m of members) {
    const isDown = down.includes(m.speciesId);
    const c = el('div', `cmini ${isDown ? 'down' : ''}`);
    c.appendChild(portrait(m.speciesId, 'sm'));
    c.appendChild(el('div', 'nm', esc(m.nickname || getFighter(m.speciesId)?.name || m.speciesId)));
    if (isDown) c.appendChild(el('div', 'st', 'out'));
    w.appendChild(c);
  }
  if (!members.length) w.appendChild(el('div', 'mut', 'No crew.'));
  return w;
}

/** Choose which crew enters a run. Falls back to a rolled crew. */
export function pickCrew(app, { size = 3, title = 'Which crew enters?', onPick }) {
  const save = Save.data();
  const body = el('div');
  body.appendChild(el('p', 'lede', `Bring up to ${size}. A run keeps the crew you start with, so pick something that can take a punch.`));
  const list = el('div');
  list.style.cssText = 'display:flex;flex-direction:column;gap:8px';

  const add = (label, sub, members, cls = '') => {
    const b = el('button', `cupcard ${cls}`);
    b.type = 'button';
    b.style.padding = '10px 12px';
    b.innerHTML = `<div class="t" style="font-size:16px">${esc(label)}</div><div class="d">${esc(sub)}</div>`;
    if (members.length) {
      const strip = crewStrip(members.slice(0, size));
      strip.style.marginTop = '7px';
      b.appendChild(strip);
    }
    b.onclick = () => { audio.sfx('ui_select'); wrap.close(); onPick(members.slice(0, size)); };
    list.appendChild(b);
  };

  for (const t of save.teams) {
    const members = (t.members || []).slice(0, size);
    if (!members.length) continue;
    add(t.name, `${t.members.length} fighter${t.members.length === 1 ? '' : 's'} saved`, members);
  }
  const rng = new RNG((Date.now() & 0xffff) + 1);
  const pool = allFighters().slice();
  const rolled = [];
  for (let i = 0; i < size && pool.length; i++) rolled.push(makeDefaultMember(pool.splice(rng.int(pool.length), 1)[0].id, 50));
  add('Roll me a crew', 'A random legal team at level 50.', rolled);

  body.appendChild(list);
  const wrap = modal({
    title,
    bodyEl: body,
    actions: [
      { label: 'Build a crew first', cls: 'btn sm ghost', fn: () => app.router.go('teambuilder') },
      { label: 'Cancel', cls: 'btn sm ghost' }
    ]
  });
  return wrap;
}

/* ------------------------------------------------------------------ */
/* tournament                                                          */
/* ------------------------------------------------------------------ */

export class TournamentScreen {
  constructor(app) { this.app = app; }

  mount(root, params = {}) {
    ensureCss();
    this.root = root;
    this.t = 0;
    this.run = loadRun('tournament');

    const sh = shell(root, {
      title: this.run ? getCup(this.run.cupId).name : 'Tournament',
      sub: this.run
        ? `${roundName(this.run)} · ${this.run.status === 'active' ? 'in progress' : this.run.status}`
        : 'An eight-fighter bracket you can lose',
      onBack: () => this.app.router.go('mode'),
      foot: false
    });
    this.sh = sh;

    this.app.stage.buildArena('colosseum');
    this.app.view?.reset?.();
    this.app.plates?.forEach?.((p) => p.hide());
    this.app.textbox?.hide?.();
    this.cast = new StageCast(this.app);
    audio.startMusic('title');
    audio.setIntensity(0.3);

    if (this.run && (this.run.status === 'active' || params.review)) this.drawRun();
    else if (this.run && this.run.status !== 'active') this.drawFinished();
    else this.drawPicker();
  }

  /* ---- cup selection ---- */

  drawPicker() {
    const body = this.sh.body;
    body.innerHTML = '';
    body.appendChild(el('p', 'lede',
      'Every other name in the draw is a real crew, and their matches are simulated with the same engine you play — whoever you meet in the final got there by winning.'));
    const grid = el('div', 'grid-2');
    for (const cup of CUPS) {
      const c = el('button', 'cupcard');
      c.type = 'button';
      c.style.borderColor = '#000';
      c.style.boxShadow = `0 6px 0 rgba(0,0,0,.5), inset 0 0 0 2px ${cup.accent}44`;
      const t = el('div', 't', esc(cup.name));
      const s = el('div', 's', esc(cup.sub));
      s.style.color = cup.accent;
      c.append(t, s, el('div', 'd', esc(cup.reward)));
      const f = el('div', 'f');
      f.appendChild(el('span', 'chip sm', `${cup.size} entrants`));
      f.appendChild(el('span', 'chip sm', `${cup.teamSize}v${cup.teamSize}`));
      f.appendChild(el('span', 'chip sm', `${Math.log2(cup.size)} rounds`));
      const hardest = cup.pool.map(getOpponent).filter(Boolean)
        .sort((a, b) => TIER_ORDER.indexOf(b.tier) - TIER_ORDER.indexOf(a.tier))[0];
      if (hardest) f.appendChild(el('span', 'chip sm', `up to ${hardest.name}`));
      c.appendChild(f);
      c.onclick = () => this.startCup(cup);
      grid.appendChild(c);
    }
    body.appendChild(grid);

    const save = Save.data();
    if (save.trophies.length) {
      const p = el('div', 'pane tight');
      p.style.marginTop = '14px';
      p.appendChild(el('h3', null, 'Trophy case'));
      for (const tr of save.trophies.slice(-8).reverse()) {
        p.appendChild(el('div', 'dtile', `<span>🏆</span><span><b>${esc(tr.name)}</b><div class="d">${esc(tr.tier || '')}</div></span><span class="d">${new Date(tr.at).toLocaleDateString()}</span>`));
      }
      body.appendChild(p);
    }
  }

  startCup(cup) {
    audio.sfx('ui_select');
    pickCrew(this.app, {
      size: cup.teamSize,
      title: `Enter the ${cup.name}`,
      onPick: (members) => {
        const save = Save.data();
        const team = activeTeam(save);
        const run = createTournament({
          cupId: cup.id,
          playerTeam: members,
          playerName: save.profile?.name || 'You',
          teamName: team?.name || 'Your Crew'
        });
        storeRun('tournament', run);
        this.run = run;
        this.sh.setTitle(cup.name);
        this.drawRun();
        toast(`${cup.name}: ${roundName(run)}. Good luck.`, 'gold');
      }
    });
  }

  /* ---- live bracket ---- */

  drawRun() {
    const run = this.run;
    const cup = getCup(run.cupId);
    const body = this.sh.body;
    body.innerHTML = '';
    this.sh.setSub(`${roundName(run)} · ${run.history.filter((h) => h.win).length} win${run.history.filter((h) => h.win).length === 1 ? '' : 's'} · ${cup.teamSize}v${cup.teamSize}`);

    const op = playerOpponent(run);
    if (op) {
      const hero = opponentHero(op, { size: cup.teamSize });
      hero.actions.appendChild(button(`Fight — ${roundName(run)}`, 'btn primary', () => this.fight(op)));
      hero.actions.appendChild(button('Change crew', 'btn sm ghost', () => this.changeCrew(cup)));
      body.appendChild(hero);
      this.cast?.set([{ id: op.crew?.[0] || 'luffy', x: 1.2, z: 0, rotY: -0.3, state: 'ready' }]);
      this.modelH = getFighter(op.crew?.[0])?.model?.height || 1.8;
    }

    body.appendChild(this.bracketEl(run, cup));

    const crew = el('div', 'pane tight');
    crew.style.marginTop = '13px';
    crew.appendChild(el('h3', null, `Your crew — ${esc(run.teamName)}`));
    crew.appendChild(crewStrip(run.playerTeam));
    body.appendChild(crew);

    if (run.history.length) {
      const h = el('div', 'pane tight');
      h.style.marginTop = '13px';
      h.appendChild(el('h3', null, 'Your road here'));
      for (const rec of run.history) {
        const o = getOpponent(rec.opId);
        h.appendChild(el('div', 'dtile',
          `<span>${rec.win ? '✔' : '✘'}</span><span><b>${esc(o?.name || 'Bye')}</b><div class="d">${esc(roundName(run, rec.round))}</div></span><span class="d">${rec.turns} turns</span>`));
      }
      body.appendChild(h);
    }

    const foot = el('div');
    foot.style.cssText = 'margin-top:14px;display:flex;gap:8px;flex-wrap:wrap';
    foot.appendChild(button('Abandon this run', 'btn sm ghost', () => this.abandon()));
    body.appendChild(foot);
  }

  bracketEl(run, cup) {
    const p = el('div', 'pane tight');
    p.appendChild(el('h3', null, 'The draw'));
    const brk = el('div', 'brk');
    run.rounds.forEach((round, ri) => {
      const col = el('div', 'brk-col');
      col.appendChild(el('h4', null, roundName(run, ri)));
      for (const m of round) {
        const box = el('div', `mtch ${!m.played && (m.a === run.playerSlot || m.b === run.playerSlot) && ri === run.roundIndex ? 'live' : ''}`);
        for (const slot of [m.a, m.b]) {
          const e = slot == null ? null : entrantOf(run, slot);
          const row = el('div', `ent ${m.played && m.winner === slot ? 'win' : m.played ? 'out' : ''} ${slot === run.playerSlot ? 'you' : ''}`);
          if (e) {
            const av = el('div', 'av');
            const pt = portrait(e.kind === 'player' ? (run.playerTeam[0]?.speciesId || 'luffy') : (getOpponent(e.opId)?.crew?.[0] || 'luffy'), '');
            const img = pt.querySelector('img');
            if (img) av.appendChild(img);
            row.appendChild(av);
            row.appendChild(el('span', 'n', esc(e.kind === 'player' ? `${e.name} (you)` : e.name)));
            if (e.tier) row.appendChild(el('span', 'tb', esc(e.tier)));
          } else {
            row.appendChild(el('span', 'n mut', 'TBD'));
          }
          box.appendChild(row);
        }
        col.appendChild(box);
      }
      brk.appendChild(col);
    });
    // champion column
    const last = run.rounds[run.rounds.length - 1]?.[0];
    const champCol = el('div', 'brk-col');
    champCol.appendChild(el('h4', null, 'Champion'));
    const champ = el('div', 'mtch');
    const cslot = last?.played ? last.winner : null;
    const ce = cslot == null ? null : entrantOf(run, cslot);
    const crow = el('div', `ent ${ce ? 'win' : ''} ${cslot === run.playerSlot ? 'you' : ''}`);
    crow.appendChild(el('span', 'n', ce ? esc(ce.kind === 'player' ? `${ce.name} (you)` : ce.name) : '🏆 —'));
    champ.appendChild(crow);
    champCol.appendChild(champ);
    brk.appendChild(champCol);
    p.appendChild(brk);
    return p;
  }

  changeCrew(cup) {
    pickCrew(this.app, {
      size: cup.teamSize,
      title: 'Swap in a different crew',
      onPick: (members) => {
        this.run.playerTeam = members;
        storeRun('tournament', this.run);
        this.drawRun();
        toast('Crew swapped.');
      }
    });
  }

  fight(op) {
    const run = this.run;
    const cup = getCup(run.cupId);
    audio.sfx('ui_select');
    this.app.router.go('battle', {
      mode: 'ai',
      aiLevel: op.tier,
      p0Team: run.playerTeam.map((m) => ({ ...m })),
      p1Team: opponentTeam(op, { level: cup.level, size: cup.teamSize, playerTeam: run.playerTeam }),
      p0Name: run.teamName,
      p1Name: op.name,
      teamSize: cup.teamSize,
      arena: op.arena || arenaFor(run, run.roundIndex),
      meta: { kind: 'tournament', opId: op.id, cupId: cup.id, round: run.roundIndex, aiLevel: op.tier }
    });
  }

  drawFinished() {
    const run = this.run;
    const cup = getCup(run.cupId);
    const body = this.sh.body;
    body.innerHTML = '';
    const won = run.status === 'won';
    const head = el('div', 'pane');
    head.style.textAlign = 'center';
    head.innerHTML = `<div style="font-size:52px">${won ? '🏆' : '🚪'}</div>
      <div class="gx-h" style="margin-top:6px">${won ? `${esc(cup.name)} — Champion` : 'Knocked out'}</div>
      <p class="lede" style="margin:8px auto 0">${won
        ? esc(cup.reward)
        : `You went out in the ${esc(roundName(run, run.history[run.history.length - 1]?.round ?? 0)).toLowerCase()}. The bracket carried on without you.`}</p>`;
    body.appendChild(head);
    body.appendChild(this.bracketEl(run, cup));

    const row = el('div');
    row.style.cssText = 'margin-top:14px;display:flex;gap:9px;flex-wrap:wrap;justify-content:center';
    row.appendChild(button('Enter another cup', 'btn primary', () => { clearRun('tournament'); this.run = null; this.sh.setTitle('Tournament'); this.drawPicker(); }));
    row.appendChild(button('Modes', 'btn sm ghost', () => this.app.router.go('mode')));
    body.appendChild(row);
  }

  abandon() {
    modal({
      title: 'Abandon the run?',
      html: '<p class="lede">The bracket is thrown away. Anything you already earned stays.</p>',
      actions: [
        { label: 'Keep going', cls: 'btn sm ghost' },
        { label: 'Abandon', cls: 'btn sm danger', fn: () => {
          clearRun('tournament');
          this.run = null;
          this.sh.setTitle('Tournament');
          this.sh.setSub('An eight-fighter bracket you can lose');
          this.drawPicker();
        } }
      ]
    });
  }

  update(dt) {
    this.t += dt;
    this.cast?.update(dt);
    if (!this.cast?.models?.length) return;
    const h = this.modelH || 1.8;
    const a = 0.9 + this.t * 0.045 * Math.PI * 2;
    const r = 2.6 + h * 1.6;
    this.app.dir?.cut({ pos: vec(1.2 + Math.sin(a) * r, h * 0.8 + 0.6, Math.cos(a) * r), look: vec(1.2, h * 0.55, 0), fov: 32 });
  }

  unmount() { this.cast?.dispose(); this.cast = null; this.root.innerHTML = ''; }
}

/* ------------------------------------------------------------------ */
/* gauntlet                                                            */
/* ------------------------------------------------------------------ */

export class GauntletScreen {
  constructor(app) { this.app = app; }

  mount(root) {
    ensureCss();
    this.root = root;
    this.t = 0;
    this.run = loadRun('gauntlet');

    const sh = shell(root, {
      title: 'Survival Gauntlet',
      sub: 'One crew. Eleven fights. Nobody comes back.',
      onBack: () => this.app.router.go('mode')
    });
    this.sh = sh;

    this.app.stage.buildArena('onigashima');
    this.app.view?.reset?.();
    this.app.plates?.forEach?.((p) => p.hide());
    this.app.textbox?.hide?.();
    this.cast = new StageCast(this.app);
    audio.startMusic('title');
    audio.setIntensity(0.34);

    if (!this.run || this.run.status !== 'active') this.drawIntro();
    else this.drawRun();
  }

  drawIntro() {
    const body = this.sh.body;
    body.innerHTML = '';
    const last = this.run;
    if (last && last.status !== 'active') {
      const p = el('div', 'pane');
      p.style.marginBottom = '14px';
      p.innerHTML = `<h3>${last.status === 'cleared' ? 'You cleared it' : 'Last run'}</h3>
        <p class="lede" style="margin:0">Reached stage ${last.best + 1} of ${GAUNTLET_LADDER.length}
        with ${gauntletLive(last).length} of ${last.roster.length} still standing.</p>`;
      p.appendChild(crewStrip(last.roster, last.down));
      body.appendChild(p);
    }
    body.appendChild(el('p', 'lede',
      'Eleven crews, in order, hardest last. Nothing heals between fights and any fighter that goes down is out of the run for good. Every clear offers one favour to keep you alive a little longer.'));

    const ladder = el('div', 'pane tight');
    ladder.appendChild(el('h3', null, 'The ladder'));
    const l = el('div', 'ladder');
    GAUNTLET_LADDER.forEach((id, i) => {
      const o = getOpponent(id);
      l.appendChild(el('div', 'lstep', `<span class="i">${i + 1}</span><span class="t">${esc(o?.name || id)}</span><span class="r">${esc(o?.tier || '')}</span>`));
    });
    ladder.appendChild(l);
    body.appendChild(ladder);

    const row = el('div');
    row.style.cssText = 'margin-top:14px;display:flex;gap:9px;flex-wrap:wrap';
    row.appendChild(button('Start a run', 'btn primary', () => this.start()));
    body.appendChild(row);
  }

  start() {
    pickCrew(this.app, {
      size: 6,
      title: 'Who is walking in?',
      onPick: (members) => {
        const team = activeTeam(Save.data());
        const run = createGauntlet({ playerTeam: members, teamName: team?.name || 'Your Crew' });
        storeRun('gauntlet', run);
        this.run = run;
        this.drawRun();
      }
    });
  }

  drawRun() {
    const run = this.run;
    const body = this.sh.body;
    body.innerHTML = '';
    const op = gauntletOpponent(run);
    const live = gauntletLive(run);
    this.sh.setSub(`Stage ${run.stage + 1} of ${GAUNTLET_LADDER.length} · ${live.length} standing · ${run.down.length} lost`);

    // A cleared stage owes you a favour.
    if (run.boons.length < run.stage) { this.offerBoon(); return; }

    if (op) {
      const hero = opponentHero(op, { size: 3 });
      hero.actions.appendChild(button(`Fight — stage ${run.stage + 1}`, 'btn primary', () => this.fight(op)));
      hero.actions.appendChild(button('Abandon run', 'btn sm ghost', () => this.abandon()));
      body.appendChild(hero);
      this.cast?.set([{ id: op.crew?.[0] || 'kaido', x: 1.0, z: 0, rotY: -0.25, state: 'ready' }]);
      this.modelH = getFighter(op.crew?.[0])?.model?.height || 1.9;
    }

    const crew = el('div', 'pane tight');
    crew.appendChild(el('h3', null, `Your crew — ${esc(run.teamName)}`));
    crew.appendChild(crewStrip(run.roster, run.down));
    if (run.boons.length) {
      crew.appendChild(el('h4', null, 'Favours taken'));
      crew.appendChild(el('div', 'chiprow', run.boons.map((b) =>
        `<span class="chip sm on">${esc(BOONS.find((x) => x.pick === b)?.name || b)}</span>`).join('')));
    }
    body.appendChild(crew);

    const ladder = el('div', 'pane tight');
    ladder.style.marginTop = '13px';
    ladder.appendChild(el('h3', null, 'Progress'));
    const l = el('div', 'ladder');
    GAUNTLET_LADDER.forEach((id, i) => {
      const o = getOpponent(id);
      const state = i < run.stage ? 'done' : i === run.stage ? 'now' : '';
      const hist = run.history.find((h) => h.stage === i);
      l.appendChild(el('div', `lstep ${state}`,
        `<span class="i">${i + 1}</span><span class="t">${esc(o?.name || id)}</span><span class="r">${
          hist ? (hist.win ? `won · ${hist.turns}t` : 'lost') : i === run.stage ? 'next' : esc(o?.tier || '')}</span>`));
    });
    ladder.appendChild(l);
    body.appendChild(ladder);
  }

  offerBoon() {
    const run = this.run;
    const body = this.sh.body;
    body.innerHTML = '';
    const p = el('div', 'pane');
    p.innerHTML = `<h3>Stage ${run.stage} cleared</h3>
      <p class="lede">The dock stays quiet for a minute. Take one favour before the next crew arrives.</p>`;
    const grid = el('div', 'grid-2');
    for (const b of BOONS) {
      const c = el('button', 'cupcard');
      c.type = 'button';
      c.innerHTML = `<div class="t" style="font-size:17px">${esc(b.name)}</div><div class="d">${esc(b.desc)}</div>`;
      const usable = b.pick !== 'revive' || run.down.length > 0;
      if (!usable) { c.style.opacity = '.45'; c.disabled = true; c.appendChild(el('div', 'd', 'Nobody is down yet.')); }
      c.onclick = () => {
        audio.sfx('ui_select');
        if (b.pick === 'revive' && run.down.length > 1) { this.pickRevive(); return; }
        applyBoon(run, b.pick);
        storeRun('gauntlet', run);
        this.drawRun();
        toast(`${b.name} taken.`, 'good');
      };
      grid.appendChild(c);
    }
    p.appendChild(grid);
    const skip = el('div');
    skip.style.marginTop = '12px';
    skip.appendChild(button('Take nothing', 'btn sm ghost', () => {
      run.boons.push('none');
      storeRun('gauntlet', run);
      this.drawRun();
    }));
    p.appendChild(skip);
    body.appendChild(p);
  }

  pickRevive() {
    const run = this.run;
    const body = el('div');
    body.appendChild(el('p', 'lede', 'Who comes back?'));
    const list = el('div');
    list.style.cssText = 'display:flex;gap:8px;flex-wrap:wrap';
    for (const id of run.down) {
      const b = el('button', 'cupcard');
      b.type = 'button';
      b.style.cssText = 'width:auto;padding:9px';
      b.appendChild(portrait(id, ''));
      b.appendChild(el('div', 'nm', esc(getFighter(id)?.name || id)));
      b.onclick = () => {
        applyBoon(run, 'revive', id);
        storeRun('gauntlet', run);
        m.close();
        this.drawRun();
        toast(`${getFighter(id)?.name} is back on their feet.`, 'good');
      };
      list.appendChild(b);
    }
    body.appendChild(list);
    const m = modal({ title: 'Ship\'s Doctor', bodyEl: body, actions: [{ label: 'Cancel', cls: 'btn sm ghost' }] });
  }

  fight(op) {
    const run = this.run;
    const live = gauntletLive(run);
    if (!live.length) { toast('Nobody left to fight with.', 'bad'); return; }
    audio.sfx('ui_select');
    const size = Math.min(3, live.length);
    this.app.router.go('battle', {
      mode: 'ai',
      aiLevel: op.tier,
      p0Team: live.slice(0, size).map((m) => ({ ...m })),
      p1Team: opponentTeam(op, { level: 50, size, playerTeam: live }),
      p0Name: run.teamName,
      p1Name: op.name,
      teamSize: size,
      arena: op.arena || arenaFor(run, run.stage),
      meta: { kind: 'gauntlet', opId: op.id, stage: run.stage, aiLevel: op.tier }
    });
  }

  abandon() {
    modal({
      title: 'Walk away?',
      html: '<p class="lede">The run ends here and the crew goes home. XP you already earned stays.</p>',
      actions: [
        { label: 'Keep fighting', cls: 'btn sm ghost' },
        { label: 'Walk away', cls: 'btn sm danger', fn: () => { clearRun('gauntlet'); this.run = null; this.drawIntro(); } }
      ]
    });
  }

  update(dt) {
    this.t += dt;
    this.cast?.update(dt);
    if (!this.cast?.models?.length) return;
    const h = this.modelH || 1.9;
    const a = 0.8 + this.t * 0.04 * Math.PI * 2;
    const r = 2.8 + h * 1.6;
    this.app.dir?.cut({ pos: vec(1.0 + Math.sin(a) * r, h * 0.82 + 0.6, Math.cos(a) * r), look: vec(1.0, h * 0.55, 0), fov: 32 });
  }

  unmount() { this.cast?.dispose(); this.cast = null; this.root.innerHTML = ''; }
}

/* ------------------------------------------------------------------ */
/* daily challenge                                                     */
/* ------------------------------------------------------------------ */

/** Apply a daily twist to the two teams. Everything here is seed-stable. */
export function applyTwist(challenge) {
  const twist = challenge.twist?.id || 'none';
  const shape = (team) => team.map((m) => ({ ...m }));
  let p = shape(challenge.playerTeam);
  let f = shape(challenge.foeTeam);
  let size = 3;
  if (twist === 'blitz') {
    const trim = (m) => {
      const scored = (m.moves || []).map((id) => ({ id, mv: getMove(id) })).filter((x) => x.mv);
      scored.sort((a, b) => (b.mv.priority - a.mv.priority) || (b.mv.power - a.mv.power));
      return { ...m, moves: scored.slice(0, 3).map((x) => x.id) };
    };
    p = p.map(trim); f = f.map(trim);
  } else if (twist === 'ironman') {
    p = p.slice(0, 1); f = f.slice(0, 1); size = 1;
  }
  return { p0Team: p, p1Team: f, teamSize: size };
}

export class DailyScreen {
  constructor(app) { this.app = app; }

  mount(root) {
    ensureCss();
    this.root = root;
    this.t = 0;
    const key = dateKey();
    this.key = key;
    let ch = null;
    try { ch = dailyChallenge(key); } catch (e) { console.warn('[daily] build failed', e); }
    this.ch = ch;

    const sh = shell(root, {
      title: 'Daily Challenge',
      sub: `${key} · the same fight for everyone, everywhere`,
      onBack: () => this.app.router.go('mode')
    });
    this.sh = sh;

    if (!ch) {
      sh.body.appendChild(el('div', 'empty', 'Today\'s challenge could not be built.'));
      return;
    }

    const op = getOpponent(ch.opponentId);
    const played = Save.data().daily?.[key] || null;

    const hero = opponentHero(op, { size: 3 });
    hero.actions.appendChild(button(played ? 'Play again' : 'Take the challenge', 'btn primary', () => this.play()));
    if (played) {
      const s = el('div', 'mut');
      s.style.textAlign = 'center';
      s.innerHTML = `today: <b style="color:#fff">${played.score}</b>${played.best && played.best !== played.score ? ` · best ${played.best}` : ''}`;
      hero.actions.appendChild(s);
    }
    sh.body.appendChild(hero);

    const tw = el('div', 'pane tight');
    tw.appendChild(el('h3', null, 'Today\'s rules'));
    const t = el('div', 'twist');
    t.innerHTML = `<b>${esc(ch.twist.name)}</b><span>${esc(ch.twist.desc)}</span>`;
    tw.appendChild(t);
    tw.appendChild(el('div', 'dtile', `<span>🗺</span><span><b>${esc(getArena(ch.arena).name)}</b><div class="d">${esc(getArena(ch.arena).sub || '')}</div></span><span class="d">arena</span>`));
    tw.appendChild(el('div', 'dtile', `<span>🎲</span><span><b>Seed ${ch.seed}</b><div class="d">Derived from the date alone — your friend gets the identical fight.</div></span><span class="d">${esc(ch.aiLevel)}</span>`));
    sh.body.appendChild(tw);

    const teams = el('div', 'grid-2');
    teams.style.marginTop = '13px';
    const mine = el('div', 'pane tight');
    mine.appendChild(el('h3', null, 'The crew you are given'));
    mine.appendChild(crewStrip(ch.playerTeam));
    const theirs = el('div', 'pane tight');
    theirs.appendChild(el('h3', null, `${esc(op?.name || 'Rival')}'s crew`));
    theirs.appendChild(crewStrip(ch.foeTeam));
    teams.append(mine, theirs);
    sh.body.appendChild(teams);

    const hist = Object.entries(Save.data().daily || {}).sort((a, b) => b[0].localeCompare(a[0])).slice(0, 7);
    if (hist.length) {
      const h = el('div', 'pane tight');
      h.style.marginTop = '13px';
      h.appendChild(el('h3', null, 'Your last seven days'));
      for (const [k, v] of hist) {
        h.appendChild(el('div', 'dtile',
          `<span>${v.win ? '✔' : '✘'}</span><span><b>${esc(k)}</b><div class="d">${v.turns} turns · ${v.alive ?? 0} standing</div></span><b>${v.best ?? v.score}</b>`));
      }
      sh.body.appendChild(h);
    }

    this.app.stage.buildArena(ch.arena);
    this.app.view?.reset?.();
    this.app.plates?.forEach?.((p) => p.hide());
    this.app.textbox?.hide?.();
    this.cast = new StageCast(this.app);
    this.cast.set([{ id: op?.crew?.[0] || 'luffy', x: 1.0, z: 0, rotY: -0.25, state: 'ready' }]);
    this.modelH = getFighter(op?.crew?.[0])?.model?.height || 1.8;
    audio.startMusic('title');
    audio.setIntensity(0.3);
  }

  play() {
    const ch = this.ch;
    const op = getOpponent(ch.opponentId);
    const { p0Team, p1Team, teamSize } = applyTwist(ch);
    audio.sfx('ui_select');
    this.app.router.go('battle', {
      mode: 'ai',
      aiLevel: ch.aiLevel,
      seed: ch.seed,
      arena: ch.arena,
      p0Team, p1Team, teamSize,
      p0Name: 'You',
      p1Name: op?.name || 'Rival',
      meta: { kind: 'daily', dailyKey: this.key, opId: ch.opponentId, twist: ch.twist.id, aiLevel: ch.aiLevel }
    });
  }

  update(dt) {
    this.t += dt;
    this.cast?.update(dt);
    if (!this.cast?.models?.length) return;
    const h = this.modelH || 1.8;
    const a = 0.7 + this.t * 0.04 * Math.PI * 2;
    const r = 2.6 + h * 1.6;
    this.app.dir?.cut({ pos: vec(1.0 + Math.sin(a) * r, h * 0.8 + 0.6, Math.cos(a) * r), look: vec(1.0, h * 0.55, 0), fov: 32 });
  }

  unmount() { this.cast?.dispose(); this.cast = null; this.root.innerHTML = ''; }
}

function vec(x, y, z) {
  return { x, y, z, clone() { return vec(this.x, this.y, this.z); }, lerpVectors() {}, copy() {} };
}
