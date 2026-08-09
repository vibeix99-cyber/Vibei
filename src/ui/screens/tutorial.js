// First-run tutorial. Not a wall of text: a real battle against a real crew,
// with three lessons that complete when you actually do the thing —
// hit a weakness, switch out of a bad matchup, and land a status.
//
// The matchup is *computed* from the live type chart and learnsets rather than
// hard-coded, so it stays correct while other agents edit the roster.

import { audio } from '../../audio/audio.js';
import { allFighters, getFighter, makeDefaultMember } from '../../data/fighters.js';
import { getMove } from '../../data/moves.js';
import { typeEff, TYPE_COLOR } from '../../core/types.js';
import * as Save from '../../meta/save.js';
import { BattleScreen } from './battle.js';
import { injectScreenCss, el, esc, button, portrait, toast, modal } from './common.js';

const CSS = `
.tut-intro{ position:absolute; inset:0; overflow:auto; padding:clamp(16px,4vh,44px) clamp(14px,4vw,44px) 80px;
  background:linear-gradient(180deg, rgba(4,6,12,.82), rgba(4,6,12,.97)); }
.tut-intro .in{ width:min(880px,100%); margin:0 auto; }
.tut-h{ font-family:var(--font-display); font-size:clamp(26px,5vw,48px); color:#f6f4ea; text-shadow:0 4px 0 #000; }
.tut-cards{ display:grid; gap:12px; grid-template-columns:repeat(auto-fit,minmax(240px,1fr)); margin:18px 0; }
.tut-card{ padding:14px; border-radius:15px; border:3px solid #000; background:linear-gradient(180deg,#212840,#141a2b);
  box-shadow:0 6px 0 rgba(0,0,0,.5); }
.tut-card .ic{ font-size:28px; }
.tut-card b{ display:block; font-size:16px; margin:6px 0 4px; }
.tut-card span{ font-size:13px; color:#a9b4cc; line-height:1.45; }

.coach{ position:absolute; left:50%; transform:translateX(-50%);
  top:calc(var(--edge-t) + 46px); z-index:var(--z-sheet); width:min(460px, calc(100% - 2 * var(--edge)));
  border:3px solid #000; border-radius:14px; padding:9px 11px; pointer-events:auto;
  background:linear-gradient(180deg, rgba(30,38,62,.96), rgba(14,18,30,.96));
  box-shadow:0 6px 0 rgba(0,0,0,.45), 0 14px 34px rgba(0,0,0,.5); animation:slideDown .3s var(--ease-out) both; }
.coach .hd{ display:flex; align-items:center; gap:8px; }
.coach .hd .t{ font-size:10px; letter-spacing:.18em; text-transform:uppercase; color:var(--gold); font-weight:900; flex:1; }
.coach .hint{ font-size:13.5px; line-height:1.4; color:#eaf0ff; margin-top:5px; }
.coach .hint b{ color:var(--gold); }
.coach .ls{ display:flex; gap:6px; margin-top:8px; flex-wrap:wrap; }
.coach .l{ display:flex; align-items:center; gap:5px; font-size:11px; font-weight:800; color:#8e9ab8;
  padding:3px 8px; border-radius:99px; background:rgba(255,255,255,.05); }
.coach .l.on{ color:#0b0d14; background:#4ad07a; }
body[data-handoff="1"] .coach{ visibility:hidden; }
@media (max-height:560px){ .coach{ top:calc(var(--edge-t) + 38px); padding:6px 9px; } .coach .hint{ font-size:12px; } }
`;

/* ------------------------------------------------------------------ */
/* matchup construction                                                */
/* ------------------------------------------------------------------ */

function damagingMoves(def, level = 50) {
  return def.learnset.filter((l) => l.lv <= level).map((l) => getMove(l.move))
    .filter((m) => m && m.category !== 'status' && m.power > 0);
}
function statusMoves(def, level = 50) {
  return def.learnset.filter((l) => l.lv <= level).map((l) => getMove(l.move))
    .filter((m) => m && m.category === 'status' && m.target === 'foe' && m.effects?.some((e) => e.kind === 'status'));
}

/**
 * Pick a foe and three fighters that make each lesson obvious:
 * one that hits the foe for 2×, one that resists the foe back, one that can
 * inflict a status. Computed live so a roster edit cannot stale it.
 */
export function buildTutorialMatchup() {
  const roster = allFighters();
  const byId = (id) => roster.find((f) => f.id === id);
  const foe = ['nami', 'chopper', 'usopp', 'brook'].map(byId).find(Boolean) || roster[0];
  const foeAtk = damagingMoves(foe).sort((a, b) => b.power - a.power)[0];
  const foeStab = foeAtk?.type || foe.types[0];

  const teacher = roster.find((f) => f.id !== foe.id
    && damagingMoves(f).some((m) => typeEff(m.type, foe.types) >= 2)) || roster[0];
  const bestMove = damagingMoves(teacher)
    .filter((m) => typeEff(m.type, foe.types) >= 2)
    .sort((a, b) => b.power - a.power)[0];

  const wall = roster.find((f) => f.id !== foe.id && f.id !== teacher.id
    && typeEff(foeStab, f.types) <= 0.5) || roster.find((f) => f.id !== foe.id && f.id !== teacher.id);

  const poisoner = roster.find((f) => ![foe.id, teacher.id, wall?.id].includes(f.id)
    && statusMoves(f).length) || roster.find((f) => ![foe.id, teacher.id, wall?.id].includes(f.id));
  const statusMove = poisoner ? statusMoves(poisoner)[0] : null;

  const member = (f) => {
    const m = makeDefaultMember(f.id, 50);
    return m;
  };
  const team = [teacher, wall, poisoner].filter(Boolean).map(member);
  // Guarantee the lesson moves are actually in the four slots.
  const ensure = (m, moveId) => {
    if (!moveId || !m || m.moves.includes(moveId)) return;
    m.moves = [moveId, ...m.moves.filter((x) => x !== moveId)].slice(0, 4);
  };
  ensure(team[0], bestMove?.id);
  ensure(team[2], statusMove?.id);

  const foeTeam = [member(foe), member(roster.find((f) => f.id !== foe.id) || foe)];

  return {
    foe, foeStab, teacher, wall, poisoner,
    bestMove, statusMove,
    playerTeam: team,
    foeTeam
  };
}

/* ------------------------------------------------------------------ */
/* screen                                                              */
/* ------------------------------------------------------------------ */

export class TutorialScreen extends BattleScreen {
  mount(root, params = {}) {
    injectScreenCss();
    if (!document.getElementById('tutorial-css')) {
      const s = document.createElement('style'); s.id = 'tutorial-css'; s.textContent = CSS;
      document.head.appendChild(s);
    }
    this.root = root;
    this.started = false;
    this.matchup = buildTutorialMatchup();
    this.lessons = {
      eff: { label: 'Hit a weakness', done: false },
      swap: { label: 'Switch out', done: false },
      status: { label: 'Land a status', done: false }
    };
    if (params.skipIntro) { this.begin(); return; }
    this.drawIntro();
  }

  drawIntro() {
    const m = this.matchup;
    const root = this.root;
    root.innerHTML = '';
    const wrap = el('div', 'tut-intro');
    const inner = el('div', 'in');
    inner.appendChild(el('div', 'tut-h', 'Three things and you are done'));
    inner.appendChild(el('p', 'lede',
      'One short fight against a rookie crew. Nothing here is scripted — the coach just watches for the three moments that matter and gets out of the way.'));

    const cards = el('div', 'tut-cards');
    const card = (ic, title, text) => {
      const c = el('div', 'tut-card');
      c.innerHTML = `<div class="ic">${ic}</div><b>${esc(title)}</b><span>${text}</span>`;
      cards.appendChild(c);
    };
    card('🎯', 'Type matchups',
      m.bestMove
        ? `Every move has a type. <b style="color:${TYPE_COLOR[m.bestMove.type]}">${esc(m.bestMove.name)}</b> is ${esc(m.bestMove.type)}, and ${esc(m.foe.name)} takes double from it.`
        : 'Every move has a type, and some types hit twice as hard against certain fighters.');
    card('🔁', 'Switching',
      `Swapping costs you the turn, but the fighter coming in takes the hit. ${esc(m.wall?.name || 'Your second fighter')} resists what ${esc(m.foe.name)} throws.`);
    card('☣', 'Status',
      m.statusMove
        ? `<b>${esc(m.statusMove.name)}</b> does no damage at all. It just makes the next ten turns worse for them.`
        : 'Status moves do no damage — they make every later turn worse for the other side.');
    inner.appendChild(cards);

    const crew = el('div');
    crew.style.cssText = 'display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin-bottom:18px';
    for (const mem of m.playerTeam) {
      const c = el('div');
      c.style.cssText = 'width:70px;text-align:center;font-size:11px';
      c.appendChild(portrait(mem.speciesId, 'sm'));
      c.appendChild(el('div', null, esc(getFighter(mem.speciesId)?.name || '')));
      crew.appendChild(c);
    }
    crew.appendChild(el('div', 'mut', 'versus'));
    for (const mem of m.foeTeam) {
      const c = el('div');
      c.style.cssText = 'width:70px;text-align:center;font-size:11px;opacity:.85';
      c.appendChild(portrait(mem.speciesId, 'sm'));
      c.appendChild(el('div', null, esc(getFighter(mem.speciesId)?.name || '')));
      crew.appendChild(c);
    }
    inner.appendChild(crew);

    const row = el('div');
    row.style.cssText = 'display:flex;gap:10px;flex-wrap:wrap';
    row.appendChild(button('Start the lesson', 'btn primary', () => this.begin()));
    row.appendChild(button('Skip — I know how this works', 'btn sm ghost', () => this.skip()));
    inner.appendChild(row);
    wrap.appendChild(inner);
    root.appendChild(wrap);

    this.app.plates?.forEach?.((p) => p.hide());
    this.app.textbox?.hide?.();
    audio.startMusic('title');
  }

  skip() {
    Save.patch((s) => { s.tutorial.skipped = true; });
    toast('Skipped. You can find it again under Modes.', '', 3200);
    this.app.router.go('title');
  }

  begin() {
    const m = this.matchup;
    this.started = true;
    super.mount(this.root, {
      mode: 'ai',
      aiLevel: 'rookie',
      arena: 'colosseum',
      seed: 'TUTORIAL-1',
      p0Team: m.playerTeam,
      p1Team: m.foeTeam,
      p0Name: 'You',
      p1Name: 'Training Crew',
      teamSize: m.playerTeam.length,
      meta: { kind: 'tutorial' }
    });
    this.buildCoach();
    this.hint(this.firstHint());
  }

  /* ---------------- coach ---------------- */

  buildCoach() {
    const c = el('div', 'coach');
    const hd = el('div', 'hd');
    hd.appendChild(el('span', null, '🎓'));
    hd.appendChild(el('span', 't', 'Coach'));
    hd.appendChild(button('Skip', 'btn xs ghost', () => this.skip()));
    c.appendChild(hd);
    this.$hint = el('div', 'hint');
    c.appendChild(this.$hint);
    this.$ls = el('div', 'ls');
    c.appendChild(this.$ls);
    this.root.appendChild(c);
    this.$coach = c;
    this.drawLessons();
  }

  drawLessons() {
    if (!this.$ls) return;
    this.$ls.innerHTML = '';
    for (const l of Object.values(this.lessons)) {
      this.$ls.appendChild(el('span', `l ${l.done ? 'on' : ''}`, `${l.done ? '✓' : '○'} ${esc(l.label)}`));
    }
  }

  hint(html) {
    if (this.$hint) this.$hint.innerHTML = html;
  }

  firstHint() {
    const m = this.matchup;
    if (m.bestMove) {
      return `${esc(m.teacher.name)} is out. <b>${esc(m.bestMove.name)}</b> is ${esc(m.bestMove.type)} — that is <b>2×</b> on ${esc(m.foe.name)}. The move cards show the multiplier before you commit.`;
    }
    return 'Pick a move. The cards show how effective each one is before you commit.';
  }

  nextHint() {
    const m = this.matchup;
    const L = this.lessons;
    if (!L.eff.done) return this.firstHint();
    if (!L.swap.done) {
      return `Now try <b>switching</b>. Open <b>PARTY</b> and bring in ${esc(m.wall?.name || 'someone else')} — you lose the turn, but they resist what is coming back.`;
    }
    if (!L.status.done) {
      return m.statusMove
        ? `Last one: <b>${esc(m.statusMove.name)}</b> deals no damage. It puts a condition on them that keeps working every turn.`
        : 'Last one: use a status move — no damage, but it keeps hurting them every turn.';
    }
    return 'That is the whole game. Finish them off however you like.';
  }

  complete(key) {
    const l = this.lessons[key];
    if (!l || l.done) return;
    l.done = true;
    this.drawLessons();
    audio.sfx('ui_select');
    const done = Object.values(this.lessons).every((x) => x.done);
    if (done) {
      Save.patch((s) => { s.tutorial.done = true; });
      this.hint('All three. <b>You know enough to play.</b> Finish the fight — or leave now, it counts either way.');
      toast('Tutorial complete.', 'gold', 3600);
    } else {
      this.hint(this.nextHint());
    }
  }

  /* ---------------- hooks into the battle flow ---------------- */

  ask(side) {
    super.ask(side);
    if (side === 0 && !Object.values(this.lessons).every((l) => l.done)) this.hint(this.nextHint());
  }

  submit(choices) {
    const mine = choices?.[0];
    super.submit(choices);
    try { this.readTurn(mine); } catch (e) { console.warn('[tutorial] lesson check failed', e); }
  }

  readTurn(myChoice) {
    const evs = this.battle.turnEvents || [];
    if (myChoice?.kind === 'switch') this.complete('swap');
    let lastMover = null;
    for (const ev of evs) {
      if (ev.t === 'moveUsed') lastMover = ev.side;
      if (ev.t === 'damage' && ev.side === 1 && lastMover === 0 && (ev.eff ?? 1) >= 2) this.complete('eff');
      if (ev.t === 'statusApply' && ev.side === 1 && lastMover === 0) this.complete('status');
    }
  }

  unmount() {
    this.$coach?.remove();
    this.$coach = null;
    if (!this.started) { this.root.innerHTML = ''; return; }
    super.unmount();
  }

  key(e) {
    if (!this.started) {
      if (e.key === 'Enter') { this.begin(); return true; }
      return false;
    }
    return super.key(e);
  }

  update(dt) { if (this.started) super.update?.(dt); }
}

/** Offered from the title screen the very first time the game is opened. */
export function offerTutorial(app) {
  modal({
    title: 'First time here?',
    html: '<p class="lede">Three lessons inside one short fight: type matchups, switching, and status. Two minutes.</p>',
    actions: [
      { label: 'Teach me', cls: 'btn sm primary', fn: () => app.router.go('tutorial') },
      { label: 'No thanks', cls: 'btn sm ghost', fn: () => Save.patch((s) => { s.tutorial.skipped = true; }) }
    ]
  });
}
