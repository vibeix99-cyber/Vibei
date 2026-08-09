// Post-battle results. Not a banner and a log dump: what happened, who did it,
// what it earned you, and the one button you actually want next.
//
// Everything on this page comes from meta/battleReport.js (pure, reads the
// event stream) and meta/flow.js (folds the result into the save and any run
// the fight belonged to).

import { audio } from '../../audio/audio.js';
import { getFighter } from '../../data/fighters.js';
import { TYPE_COLOR } from '../../core/types.js';
import { shareLine } from '../../meta/battleReport.js';
import { finishBattle, rematchParams, nextStep, opponentLine, opponentBark, rankSnapshot } from '../../meta/flow.js';
import { getOpponent } from '../../meta/opponents.js';
import {
  shell, injectScreenCss, el, esc, button, portrait, toast, copyText, StageCast
} from './common.js';

const CSS = `
.rs{ position:absolute; inset:0; overflow:auto; overscroll-behavior:contain;
  padding:clamp(14px,3vh,34px) clamp(12px,3vw,34px) 90px;
  background:
    radial-gradient(900px 520px at 50% -8%, rgba(80,110,190,.22), transparent 62%),
    linear-gradient(180deg, rgba(4,6,12,.86) 0%, rgba(4,6,12,.96) 44%, rgba(3,4,9,.99) 100%); }
.rs-wrap{ width:min(1080px,100%); margin:0 auto; display:flex; flex-direction:column; gap:13px; }

.rs-banner{ text-align:center; }
.rs-banner .b{ font-family:var(--font-display); font-size:clamp(38px,9vw,92px); line-height:.92;
  text-shadow:0 6px 0 #000, 0 18px 44px rgba(0,0,0,.7); animation:popIn .45s var(--ease-back) both; }
.rs-banner .b.win{ color:#ffe36b; } .rs-banner .b.lose{ color:#ff8a8a; } .rs-banner .b.draw{ color:#cfd8ea; }
.rs-banner .s{ font-size:clamp(13px,1.7vw,17px); color:#c8cee0; margin-top:2px; }
.rs-banner .who{ font-size:12px; letter-spacing:.16em; text-transform:uppercase; color:var(--gold); margin-top:6px; font-weight:800; }

.rs-cols{ display:grid; gap:13px; grid-template-columns:minmax(0,1.25fr) minmax(0,1fr); align-items:start; }
.rs-mvp{ display:flex; gap:14px; align-items:center; }
.rs-mvp .txt{ min-width:0; }
.rs-mvp .lab{ font-size:10.5px; letter-spacing:.2em; text-transform:uppercase; color:var(--gold); font-weight:900; }
.rs-mvp .nm{ font-family:var(--font-display); font-size:clamp(20px,2.6vw,29px); color:#fff; line-height:1.05; }
.rs-mvp .rs-reason{ font-size:13px; color:#a9b4cc; margin-top:3px; }

.tally{ width:100%; border-collapse:collapse; font-size:12.5px; }
.tally th{ text-align:left; font-size:9.5px; letter-spacing:.12em; text-transform:uppercase; color:#8e9ab8;
  padding:0 6px 5px; font-weight:800; }
.tally td{ padding:4px 6px; border-top:1px solid rgba(255,255,255,.07); font-variant-numeric:tabular-nums; }
.tally td.n{ font-weight:800; display:flex; align-items:center; gap:7px; min-width:0; }
.tally tr.down td{ opacity:.5; }
.tally tr.down td.n::after{ content:'✕'; color:#ff8a8a; font-size:10px; }
.tally .hpbar{ width:52px; height:6px; border-radius:99px; background:#161c2c; border:1px solid #000; overflow:hidden; display:inline-block; }
.tally .hpbar i{ display:block; height:100%; background:var(--hp-green); }

.hilite{ display:grid; grid-template-columns:repeat(auto-fill,minmax(138px,1fr)); gap:7px; }
.hilite .h{ padding:7px 9px; border-radius:10px; background:rgba(255,255,255,.05); }
.hilite .h .l{ font-size:9.5px; letter-spacing:.12em; text-transform:uppercase; color:#8e9ab8; font-weight:800; }
.hilite .h .v{ font-size:13.5px; font-weight:800; color:#eaf0ff; }

.xpbar{ height:10px; border-radius:99px; background:#0d111c; border:2px solid #000; overflow:hidden; margin:7px 0 4px; }
.xpbar i{ display:block; height:100%; background:linear-gradient(90deg,#4aa8ff,#8cffb8);
  transition:width .8s var(--ease-out); }
.rs-xp{ display:flex; align-items:baseline; justify-content:space-between; font-size:12.5px; }
.rs-xp .g{ color:#8cffb8; font-weight:900; }
.unlock{ display:flex; gap:9px; align-items:center; padding:7px 10px; border-radius:10px; margin-top:6px;
  background:linear-gradient(90deg, rgba(242,201,76,.2), rgba(255,255,255,.03)); border-left:4px solid var(--gold); }
.unlock b{ font-size:13px; } .unlock small{ display:block; color:#c3cde3; font-size:11.5px; }

.turnlog{ max-height:340px; overflow:auto; font-size:12.5px; padding-right:4px; }
.tl-turn{ margin-bottom:9px; }
.tl-turn > .h{ font-size:10px; letter-spacing:.16em; text-transform:uppercase; color:var(--gold); font-weight:900;
  border-bottom:1px solid rgba(255,255,255,.09); padding-bottom:2px; margin-bottom:4px; }
.tl-e{ display:flex; gap:7px; align-items:baseline; padding:2px 0; line-height:1.35; }
.tl-e .side{ width:26px; flex:0 0 auto; font-size:9px; font-weight:900; letter-spacing:.08em; color:#8e9ab8; }
.tl-e.you .side{ color:#7fd8ff; } .tl-e.foe .side{ color:#ff9a9a; }
.tl-e .d{ margin-left:auto; font-variant-numeric:tabular-nums; color:#ffd0a0; font-weight:800; flex:0 0 auto; }
.tl-e.crit .d{ color:#ffe36b; }
.tl-e.faint{ color:#ff9a9a; font-weight:800; }
.tl-e.status{ color:#d8b7ff; }
.tl-e.chip{ color:#9fabc6; }

.bark{ display:flex; gap:11px; align-items:center; padding:10px 12px; border-radius:13px;
  border:3px solid #000; background:linear-gradient(180deg,#241a2e,#161020); box-shadow:0 5px 0 rgba(0,0,0,.45); }
.bark .l{ font-size:14px; color:#f0e6ff; font-style:italic; line-height:1.35; }
.bark .n{ font-size:10.5px; letter-spacing:.14em; text-transform:uppercase; font-weight:900; margin-top:4px; }

.rs-actions{ display:flex; gap:9px; flex-wrap:wrap; justify-content:center; margin-top:4px; }
@media (max-width:860px){ .rs-cols{ grid-template-columns:1fr; } }
`;

export class ResultsScreen {
  constructor(app) { this.app = app; }

  mount(root, params = {}) {
    injectScreenCss();
    if (!document.getElementById('results-css')) {
      const s = document.createElement('style'); s.id = 'results-css'; s.textContent = CSS;
      document.head.appendChild(s);
    }
    this.root = root;
    this.t = 0;
    this.params = params;

    const battle = params.battle || this.app.lastBattle || null;
    const from = params.replayFrom || {};
    this.from = from;
    this.battle = battle;

    if (!battle) { this.mountEmpty(root, params); return; }

    let out;
    try { out = finishBattle(battle, from); }
    catch (e) {
      console.warn('[results] flow failed', e);
      out = { report: null, rewards: null, meta: from.meta || {}, run: null };
    }
    this.out = out;
    const report = out.report;
    if (!report) { this.mountEmpty(root, params); return; }

    const wrap = el('div', 'rs');
    const inner = el('div', 'rs-wrap');
    wrap.appendChild(inner);
    root.appendChild(wrap);

    inner.appendChild(this.banner(report, out));

    const bark = opponentBark(out);
    if (bark?.line) {
      const b = el('div', 'bark');
      b.appendChild(portrait(bark.species, 'rd'));
      const t = el('div');
      t.appendChild(el('div', 'l', `“${esc(bark.line)}”`));
      const n = el('div', 'n', esc(bark.name));
      n.style.color = bark.accent || 'var(--gold)';
      t.appendChild(n);
      b.appendChild(t);
      inner.appendChild(b);
    }

    const cols = el('div', 'rs-cols');
    const left = el('div');
    left.style.cssText = 'display:flex;flex-direction:column;gap:13px;min-width:0';
    const right = el('div');
    right.style.cssText = 'display:flex;flex-direction:column;gap:13px;min-width:0';
    cols.append(left, right);
    inner.appendChild(cols);

    if (report.mvp) left.appendChild(this.mvpPanel(report));
    left.appendChild(this.tallyPanel('Your crew', report.playerTeam, report));
    left.appendChild(this.tallyPanel(report.sideNames?.[1] || 'Their crew', report.foeTeam, report));

    right.appendChild(this.rewardPanel(out));
    if (report.highlights?.length) right.appendChild(this.highlightPanel(report));
    right.appendChild(this.logPanel(report));

    inner.appendChild(this.actions(report, out));

    /* stage: the winner stands over the loser */
    this.app.plates?.forEach?.((p) => p.hide());
    this.app.textbox?.hide?.();
    this.app.view?.reset?.();
    try {
      this.cast = new StageCast(this.app);
      const winnerTeam = report.win ? report.playerTeam : report.foeTeam;
      const star = report.mvp?.speciesId || winnerTeam?.[0]?.speciesId;
      if (star) this.cast.set([{ id: star, x: 0, z: 0, state: report.win ? 'ready' : 'idle' }]);
      this.modelH = getFighter(star)?.model?.height || 1.8;
    } catch { /* the page still works without the 3D flourish */ }

    audio.startMusic(report.win ? 'victory' : report.draw ? 'title' : 'defeat');
    audio.setIntensity(report.win ? 0.5 : 0.2);
  }

  /* ---------------- pieces ---------------- */

  banner(report, out) {
    const b = el('div', 'rs-banner');
    const kind = report.draw ? 'draw' : report.win ? 'win' : 'lose';
    const word = report.draw ? 'DRAW' : report.win ? 'VICTORY' : 'DEFEAT';
    b.appendChild(el('div', `b ${kind}`, word));
    const survivors = `${report.survivors}/${report.playerTeam.length} still standing`;
    b.appendChild(el('div', 's', report.draw
      ? `Both crews fell in ${report.turns} turns.`
      : `${esc(report.sideNames?.[report.win ? 0 : 1] ?? '')} takes it in ${report.turns} turns · ${survivors}`));
    b.appendChild(el('div', 'who', esc(this.contextLine(out))));
    return b;
  }

  contextLine(out) {
    const meta = out.meta || {};
    if (meta.kind === 'tournament' && out.run) {
      const status = out.run.status === 'won' ? 'Champion' : out.run.status === 'lost' ? 'Knocked out' : 'Through to the next round';
      return `Tournament · ${status}`;
    }
    if (meta.kind === 'gauntlet' && out.run) {
      return out.run.status === 'active' ? `Gauntlet · stage ${out.run.stage} cleared`
        : out.run.status === 'cleared' ? 'Gauntlet · cleared' : 'Gauntlet · run over';
    }
    if (meta.kind === 'daily' && out.daily) return `Daily challenge · ${out.daily.score} points`;
    if (meta.kind === 'tutorial') return 'Tutorial';
    return opponentLine(out);
  }

  mvpPanel(report) {
    const p = el('div', 'pane tight');
    const m = report.mvp;
    const row = el('div', 'rs-mvp');
    row.appendChild(portrait(m.speciesId, 'lg'));
    const txt = el('div', 'txt');
    txt.appendChild(el('div', 'lab', report.win ? 'Most valuable fighter' : 'Their most valuable fighter'));
    txt.appendChild(el('div', 'nm', esc(m.nickname)));
    txt.appendChild(el('div', 'rs-reason', esc(m.reason || '')));
    const stats = el('div', 'kv');
    stats.style.cssText = 'margin-top:7px;font-size:12px';
    stats.innerHTML = `
      <span class="k">Damage</span><span>${m.damage}</span>
      <span class="k">Knockouts</span><span>${m.kos}</span>
      <span class="k">Biggest hit</span><span>${m.bestHit ? `${m.bestHit} · ${esc(m.bestMove || '')}` : '—'}</span>`;
    txt.appendChild(stats);
    row.appendChild(txt);
    p.appendChild(row);
    return p;
  }

  tallyPanel(title, rows, report) {
    const p = el('div', 'pane tight');
    p.appendChild(el('h3', null, esc(title)));
    if (!rows.length) { p.appendChild(el('p', 'mut', 'Nobody took the field.')); return p; }
    const t = el('table', 'tally');
    t.innerHTML = `<thead><tr><th>Fighter</th><th>HP</th><th>Dealt</th><th>Taken</th><th>KOs</th></tr></thead>`;
    const body = el('tbody');
    for (const r of rows) {
      const tr = el('tr', r.fainted ? 'down' : '');
      const hp = Math.max(0, Math.round((r.hp / Math.max(1, r.maxHp)) * 100));
      const def = getFighter(r.speciesId);
      const c = el('td', 'n');
      const dot = el('span');
      dot.style.cssText = `width:8px;height:8px;border-radius:50%;flex:0 0 auto;background:${TYPE_COLOR[def?.types?.[0]] || '#888'}`;
      c.append(dot, document.createTextNode(r.nickname));
      tr.appendChild(c);
      const hpCell = el('td');
      hpCell.innerHTML = `<span class="hpbar"><i style="width:${hp}%;background:${hp > 50 ? 'var(--hp-green)' : hp > 20 ? 'var(--hp-amber)' : 'var(--hp-red)'}"></i></span>`;
      tr.appendChild(hpCell);
      tr.appendChild(el('td', null, String(r.damage)));
      tr.appendChild(el('td', null, String(r.taken)));
      tr.appendChild(el('td', null, String(r.kos)));
      body.appendChild(tr);
    }
    t.appendChild(body);
    p.appendChild(t);
    const foot = el('div', 'mut');
    foot.style.cssText = 'font-size:11.5px;margin-top:7px';
    const isMine = rows === report.playerTeam;
    foot.textContent = `Total damage ${isMine ? report.playerDamage : report.foeDamage}`;
    p.appendChild(foot);
    return p;
  }

  highlightPanel(report) {
    const p = el('div', 'pane tight');
    p.appendChild(el('h3', null, 'Highlights'));
    const g = el('div', 'hilite');
    for (const h of report.highlights) {
      const c = el('div', 'h');
      c.innerHTML = `<div class="l">${h.icon} ${esc(h.label)}</div><div class="v">${esc(h.value)}</div>`;
      g.appendChild(c);
    }
    p.appendChild(g);
    return p;
  }

  rewardPanel(out) {
    const p = el('div', 'pane tight');
    p.appendChild(el('h3', null, 'Reward'));
    const rank = rankSnapshot();
    const gained = out.rewards?.xp ?? 0;

    const row = el('div', 'rs-xp');
    row.innerHTML = `<span><b>${esc(rank.name)}</b> <span class="mut">฿ ${rank.bounty}</span></span>
      <span class="g">${gained ? `+${gained} XP` : 'No XP — practice bout'}</span>`;
    p.appendChild(row);
    const bar = el('div', 'xpbar');
    const fill = el('i');
    fill.style.width = '0%';
    bar.appendChild(fill);
    p.appendChild(bar);
    requestAnimationFrame(() => { fill.style.width = `${Math.round(rank.progress * 100)}%`; });
    p.appendChild(el('div', 'mut', rank.next
      ? `${rank.span - rank.into} XP to ${rank.next.name}`
      : 'Nothing left to climb.'));

    if (out.rewards?.rankUp) {
      const u = el('div', 'unlock');
      u.innerHTML = `<span style="font-size:20px">⬆</span><span><b>Promoted to ${esc(out.rewards.rankUp.name)}</b><small>Bounty raised to ฿ ${esc(out.rewards.rankUp.bounty)}.</small></span>`;
      p.appendChild(u);
    }
    for (const un of out.rewards?.unlocks || []) {
      const u = el('div', 'unlock');
      u.innerHTML = `<span style="font-size:20px">🔓</span><span><b>${esc(un.name)}</b><small>${esc(un.blurb)}</small></span>`;
      p.appendChild(u);
    }
    if (out.trophy) {
      const u = el('div', 'unlock');
      u.innerHTML = `<span style="font-size:20px">🏆</span><span><b>${esc(out.trophy.name)} won</b><small>Added to your trophy case.</small></span>`;
      p.appendChild(u);
    }
    if (out.daily) {
      const u = el('div', 'unlock');
      u.innerHTML = `<span style="font-size:20px">📅</span><span><b>${out.daily.score} points</b><small>Today's challenge — best ${out.daily.best}. Same fight for everyone, everywhere.</small></span>`;
      p.appendChild(u);
    }
    return p;
  }

  logPanel(report) {
    const p = el('div', 'pane tight');
    p.appendChild(el('h3', null, 'How it went'));
    const box = el('div', 'turnlog');
    const turns = report.turnLines.filter((t) => t.entries.length);
    if (!turns.length) { box.appendChild(el('div', 'mut', 'Over before anything happened.')); }
    for (const t of turns) {
      const g = el('div', 'tl-turn');
      g.appendChild(el('div', 'h', t.turn ? `Turn ${t.turn}` : 'Opening'));
      for (const e of t.entries) g.appendChild(this.entryEl(e));
      box.appendChild(g);
    }
    p.appendChild(box);
    return p;
  }

  entryEl(e) {
    const row = el('div', `tl-e ${e.who || ''} ${e.kind} ${e.crit ? 'crit' : ''}`);
    row.appendChild(el('span', 'side', e.who === 'you' ? 'YOU' : e.who === 'foe' ? 'FOE' : ''));
    if (e.kind === 'move') {
      const txt = el('span');
      txt.innerHTML = `<b>${esc(e.actor)}</b> used <b style="color:${TYPE_COLOR[e.moveType] || '#cfd8ea'}">${esc(e.move)}</b>${e.note ? ` <span class="mut">— ${esc(e.note)}</span>` : ''}`;
      row.appendChild(txt);
      if (e.damage) {
        const d = el('span', 'd', `−${e.damage}${e.pct ? ` (${e.pct}%)` : ''}${e.crit ? ' CRIT' : ''}${e.eff >= 2 ? ' ×' + e.eff : ''}`);
        row.appendChild(d);
      }
    } else {
      row.appendChild(el('span', null, esc(e.text || '')));
    }
    return row;
  }

  actions(report, out) {
    const row = el('div', 'rs-actions');
    const step = nextStep(out);
    if (step) {
      row.appendChild(button(step.label, step.cls || 'btn primary', () => this.app.router.go(step.screen, step.params || {})));
    }
    if (!step || out.meta?.kind === 'quick' || out.meta?.kind === 'ai' || out.meta?.kind === 'hotseat') {
      row.appendChild(button('Rematch — same crews', step ? 'btn sm' : 'btn primary', () => this.rematch()));
    }
    row.appendChild(button('Team Builder', 'btn sm', () => this.app.router.go('teambuilder')));
    row.appendChild(button('Copy result', 'btn sm ghost', async () => {
      const ok = await copyText(shareLine(report));
      toast(ok ? 'Result copied.' : shareLine(report), ok ? 'good' : '');
    }));
    row.appendChild(button('Main Menu', 'btn sm ghost', () => this.app.router.go('title')));
    return row;
  }

  rematch() {
    // The bug this screen used to have: re-using the original params meant a
    // random matchup rolled two brand-new teams. Teams now come out of the
    // battle that just finished.
    const next = rematchParams(this.from, this.battle);
    this.app.router.go('battle', next);
  }

  mountEmpty(root, params) {
    const sh = shell(root, {
      title: 'Results',
      sub: 'No battle to report on',
      onBack: () => this.app.router.go('title')
    });
    const e = el('div', 'empty');
    e.innerHTML = `<div style="font-size:34px">📄</div>
      <div>This screen shows the report from the last battle. Nothing has been fought yet in this session.</div>`;
    sh.body.appendChild(e);
    const row = el('div', 'rs-actions');
    row.appendChild(button('Quick battle', 'btn primary', () => this.app.router.go('battle', { mode: 'ai', aiLevel: 'ace', teamSize: 3, meta: { kind: 'quick' } })));
    row.appendChild(button('Main Menu', 'btn sm ghost', () => this.app.router.go('title')));
    sh.body.appendChild(row);
    if (params.log?.length) {
      const p = el('div', 'pane tight');
      p.appendChild(el('h3', null, 'Log'));
      p.appendChild(el('div', 'turnlog', params.log.slice(-40).map((l) => `<div>${esc(l)}</div>`).join('')));
      sh.body.appendChild(p);
    }
  }

  update(dt) {
    this.t += dt;
    this.cast?.update(dt);
    if (!this.cast?.models?.length) return;
    const h = this.modelH || 1.8;
    const a = 0.6 + this.t * 0.05 * Math.PI * 2;
    const r = 2.4 + h * 1.5;
    this.app.dir?.cut({
      pos: vec(Math.sin(a) * r, h * 0.8 + 0.5, Math.cos(a) * r),
      look: vec(0, h * 0.52, 0),
      fov: 32
    });
  }

  unmount() {
    this.cast?.dispose();
    this.cast = null;
    this.root.innerHTML = '';
  }

  key(e) {
    if (e.key === 'Enter') {
      const step = this.out ? nextStep(this.out) : null;
      if (step) this.app.router.go(step.screen, step.params || {});
      else this.rematch();
      return true;
    }
    return false;
  }
}

function vec(x, y, z) {
  return { x, y, z, clone() { return vec(this.x, this.y, this.z); }, lerpVectors() {}, copy() {} };
}
