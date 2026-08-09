// The battle screen: owns the battle loop, wires choices into the engine and
// events into the BattleView.
//
// Screen furniture lives in the top-right corner cluster (turn + speed) so it
// can never collide with the foe plate (top-left) or the bottom dock. The
// hot-seat hand-off raises a full curtain: plates, text box and field chips all
// live in other DOM subtrees, so `body[data-handoff]` hides them from theme.css.

import { createBattle, submitChoices, publicView } from '../../core/engine.js';
import { chooseAction } from '../../core/ai.js';
import { CommandMenu } from '../menus.js';
import { audio } from '../../audio/audio.js';
import { allFighters, makeDefaultMember } from '../../data/fighters.js';
import { defaultBag } from '../../data/items.js';
import { ARENAS } from '../../data/arenas.js';
import { RNG, seedFromString, randomSeedString } from '../../core/rng.js';

const CSS = `
/* ---- top-right corner cluster: turn counter + speed ---- */
.battlebar{
  position:absolute; right:var(--edge); top:var(--edge-t); z-index:var(--z-plate);
  display:flex; align-items:flex-start; justify-content:flex-end; gap:6px; flex-wrap:wrap;
  max-width:calc(100% - var(--plate-w) - 2 * var(--edge) - 10px);
}
.turnpill{
  display:flex; align-items:center; gap:7px;
  padding:0 12px; height:32px; border-radius:99px;
  background:rgba(11,13,20,.86); border:2px solid var(--edge-ink);
  font-weight:900; font-size:12px; letter-spacing:.16em; color:var(--gold); text-transform:uppercase;
  box-shadow:0 4px 14px rgba(0,0,0,.5); white-space:nowrap;
}
.turnpill .n{ font-family:var(--font-display); font-size:15px; letter-spacing:.02em; color:#fff; }
.turnpill .dot{ width:7px; height:7px; border-radius:50%; background:var(--ok); box-shadow:0 0 6px var(--ok); }
.turnpill.thinking .dot{ background:var(--warn); box-shadow:0 0 6px var(--warn); animation:lowHpBlink .7s infinite; }

.speedbtn{
  display:flex; align-items:stretch; gap:0; border-radius:10px; overflow:hidden;
  border:2px solid var(--edge-ink); box-shadow:0 3px 0 var(--edge-ink);
  background:rgba(11,13,20,.86); min-height:32px;
}
.speedbtn .lbl{
  display:flex; align-items:center; padding:0 8px; font-size:9px; font-weight:900;
  letter-spacing:.14em; color:#7b839c;
}
.speedbtn button{
  min-width:38px; padding:0 9px; border:0; border-left:2px solid rgba(0,0,0,.6);
  background:transparent; color:#c8cee0; font-family:var(--font-ui);
  font-weight:900; font-size:13px; cursor:pointer;
}
.speedbtn button:hover{ background:rgba(255,255,255,.09); }
.speedbtn button.on{ background:var(--gold); color:#16192a; }
.speedbtn button:focus-visible{ outline:2px solid var(--focus); outline-offset:-2px; }
/* touch: the whole control gets a 44px band without making the bar huge */
@media (pointer:coarse){ .speedbtn, .turnpill{ min-height:var(--tap); } .speedbtn button{ min-width:46px; } }
/* narrow: the cluster wraps under itself rather than pushing off-screen */
@media (max-width:560px){
  .speedbtn .lbl{ display:none; }
  .speedbtn button{ min-width:34px; padding:0 6px; }
  .turnpill{ padding:0 10px; font-size:11px; letter-spacing:.1em; }
}

/* ---- hot-seat hand-off curtain ---- */
.handoff{
  position:absolute; inset:0; z-index:var(--z-curtain);
  display:flex; flex-direction:column; align-items:center; justify-content:center; gap:14px;
  background:
    radial-gradient(120% 90% at 50% 40%, #131a2e 0%, #070a12 62%, #04060c 100%);
  animation:fadeIn .18s both; text-align:center; padding:var(--edge);
}
.handoff::before{
  content:''; position:absolute; inset:0; opacity:.14; pointer-events:none;
  background:repeating-linear-gradient(45deg,#f2c94c 0 2px,transparent 2px 22px);
}
.handoff .eye{ font-size:clamp(30px,7vw,54px); filter:grayscale(.2); }
.handoff .who{
  font-family:var(--font-display); font-size:clamp(22px,5.5vw,50px); color:var(--gold);
  text-shadow:0 4px 0 #000; letter-spacing:.02em; line-height:1.05;
}
.handoff .sub{ color:#c8cee0; font-size:clamp(12px,1.6vw,16px); max-width:34ch; line-height:1.35; }
.handoff .warn{
  font-size:11px; font-weight:900; letter-spacing:.14em; color:#ff9c9c; text-transform:uppercase;
}
.handoff .btn{ min-width:min(280px,70vw); font-size:clamp(15px,2vw,20px); }
@media (max-height:520px){ .handoff{ gap:8px; } .handoff .eye{ font-size:26px; } }

/* ---- fade into the results screen ---- */
.battle-fade{
  position:fixed; inset:0; z-index:60; background:#04060c; opacity:0; pointer-events:none;
  transition:opacity .55s ease;
}
.battle-fade.on{ opacity:1; }
`;

function randomTeam(rng, size = 3) {
  const pool = allFighters().slice();
  const out = [];
  for (let i = 0; i < size && pool.length; i++) {
    const idx = rng.int(pool.length);
    out.push(makeDefaultMember(pool[idx].id, 50));
    pool.splice(idx, 1);
  }
  return out;
}

export class BattleScreen {
  constructor(app) { this.app = app; }

  mount(root, params = {}) {
    if (!document.getElementById('battle-css')) {
      const s = document.createElement('style'); s.id = 'battle-css'; s.textContent = CSS;
      document.head.appendChild(s);
    }
    this.root = root;
    this.params = params;
    root.innerHTML = '';
    document.body.dataset.cmd = 'none';
    delete document.body.dataset.handoff;

    const seedStr = params.seed || randomSeedString();
    const seed = typeof seedStr === 'number' ? seedStr : seedFromString(String(seedStr));
    const rng = new RNG(seed);

    const arena = params.arena || ARENAS[rng.int(ARENAS.length)].id;
    this.app.stage.buildArena(arena);

    const p0Team = params.p0Team || randomTeam(rng, params.teamSize || 3);
    const p1Team = params.p1Team || randomTeam(rng, params.teamSize || 3);

    this.mode = params.mode || 'ai';   // 'ai' | 'hotseat'
    this.aiLevel = params.aiLevel || 'ace';

    this.battle = createBattle({
      seed,
      arena,
      format: { level: 50, teamSize: p0Team.length, bring: p0Team.length },
      sides: [
        { name: params.p0Name || 'You', tag: 'P1', team: p0Team, items: defaultBag() },
        { name: params.p1Name || (this.mode === 'ai' ? 'Rival' : 'Player 2'), tag: 'P2', team: p1Team, isAI: this.mode === 'ai', aiLevel: this.aiLevel, items: defaultBag() }
      ]
    });

    this.view = this.app.view;
    this.view.reset();
    this.view.speed = this.app.settings.battleSpeed || 1;
    this.view.setState(publicView(this.battle));
    this.view.push(this.battle.events);

    this.menu = new CommandMenu(root);
    this.menu.onChoice = (c) => this.onPlayerChoice(c);

    /* ---- corner cluster ---- */
    const bar = document.createElement('div');
    bar.className = 'battlebar';

    this.turnPill = document.createElement('div');
    this.turnPill.className = 'turnpill';
    this.turnPill.innerHTML = `<span class="dot"></span>Turn <span class="n">1</span>`;
    this.$turnN = this.turnPill.querySelector('.n');
    bar.appendChild(this.turnPill);

    const sp = document.createElement('div');
    sp.className = 'speedbtn';
    sp.setAttribute('role', 'group');
    sp.setAttribute('aria-label', 'Battle speed');
    sp.innerHTML = `<span class="lbl">SPD</span>`;
    [['1×', 1], ['2×', 2], ['4×', 4]].forEach(([lbl, v]) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.textContent = lbl;
      b.title = `Battle speed ${lbl}`;
      b.className = (this.view.speed === v ? 'on' : '');
      b.onclick = () => {
        this.view.speed = v; this.app.settings.battleSpeed = v; this.app.saveSettings();
        [...sp.querySelectorAll('button')].forEach((c) => c.classList.remove('on'));
        b.classList.add('on');
        this.app.textbox.cps = 110 * v;
        audio.sfx('ui_select');
      };
      sp.appendChild(b);
    });
    bar.appendChild(sp);
    root.appendChild(bar);
    this.bar = bar;

    this.app.textbox.show();
    this.app.textbox.cps = 110 * this.view.speed;
    this.waitingChoice = null;
    this.pendingP0 = null;
    this.pendingP1 = null;
    this.handoffEl = null;
    this.deviceHolder = 0;         // hot-seat: who is currently looking at the screen
    this._ending = false;

    // Escape/Backspace must reach the menu before main.js turns it into "quit",
    // so this listener runs in the capture phase and stops what it consumes.
    this._keyCapture = (e) => {
      if (e.key !== 'Escape' && e.key !== 'Backspace') return;
      if (this.handoffEl) { e.preventDefault(); e.stopImmediatePropagation(); return; }
      if (this.menu?.back()) { e.preventDefault(); e.stopImmediatePropagation(); }
    };
    addEventListener('keydown', this._keyCapture, true);

    this.view.onIdle = () => this.onIdle();
    audio.startMusic('battle');
    audio.setIntensity(0.5);
  }

  unmount() {
    removeEventListener('keydown', this._keyCapture, true);
    this.menu?.clear();
    this.handoffEl = null;
    delete document.body.dataset.handoff;
    document.body.dataset.cmd = 'none';
    this.root.innerHTML = '';
    this.app.textbox.clear();
    this.app.textbox.hide();
    this.view.onIdle = null;
  }

  /* ---------------- flow ---------------- */

  onIdle() {
    const b = this.battle;
    this.view.syncPlates(publicView(b));
    if (b.ended) {
      if (!this._ending) {
        this._ending = true;
        this.menu?.clear();
        this.toResults();
      }
      return;
    }
    const shown = b.turn + (b.request[0] === 'switch' || b.request[1] === 'switch' ? 0 : 1);
    if (this.$turnN) this.$turnN.textContent = String(Math.max(1, shown));
    this.promptNext();
  }

  /**
   * Fade the board out before handing over to the results screen.
   *
   * The `battleEnd` beat already holds for ~0.95 s and lands on the victory
   * shot, so this only has to cover the fade starting — anything longer is the
   * single longest stretch of dead air in the game.
   */
  toResults() {
    const b = this.battle;
    const fade = document.createElement('div');
    fade.className = 'battle-fade';
    document.body.appendChild(fade);
    requestAnimationFrame(() => fade.classList.add('on'));
    setTimeout(() => {
      this.app.router.go('results', {
        winner: b.winner, sides: b.sides.map((s) => s.name),
        log: b.log, turns: b.turn, seed: b.seed, replayFrom: this.params
      });
      requestAnimationFrame(() => {
        fade.classList.remove('on');
        setTimeout(() => fade.remove(), 700);
      });
    }, 250);
  }

  promptNext() {
    const b = this.battle;
    // forced switch takes priority
    if (b.request[0] === 'switch') { this.handTo(0, () => this.askSwitch(0)); return; }
    if (b.request[1] === 'switch') {
      const c = this.mode === 'ai' ? chooseAction(b, 1, this.aiLevel) : null;
      if (c) { this.submit([null, c]); return; }
      this.handTo(1, () => this.askSwitch(1)); return;
    }
    if (this.pendingP0 === null) { this.handTo(0, () => this.ask(0)); return; }
    if (this.pendingP1 === null) {
      if (this.mode === 'ai') { this.pendingP1 = chooseAction(b, 1, this.aiLevel); this.flush(); }
      else this.handTo(1, () => this.ask(1));
      return;
    }
    this.flush();
  }

  /** Hot-seat: raise the curtain if the device needs to change hands. */
  handTo(side, fn) {
    if (this.mode !== 'hotseat' || this.deviceHolder === side) { this.deviceHolder = side; fn(); return; }
    this.handoffThen(side, () => { this.deviceHolder = side; fn(); });
  }

  handoffThen(side, fn) {
    if (this.handoffEl) return;
    this.menu?.clear();
    this.app.textbox.clear();
    document.body.dataset.handoff = '1';
    const el = document.createElement('div');
    el.className = 'handoff';
    const name = this.battle.sides[side].name;
    el.innerHTML = `
      <div class="eye">🙈</div>
      <div class="warn">Screen hidden</div>
      <div class="who">${name}'s turn</div>
      <div class="sub">Pass the device to <b>${name}</b>. Everything on the board — plates, party and the last player's pick — is covered until they're ready.</div>
      <button class="btn primary" type="button">${name} is ready</button>`;
    const btn = el.querySelector('button');
    btn.onclick = () => {
      audio.sfx('ui_select');
      el.remove();
      this.handoffEl = null;
      delete document.body.dataset.handoff;
      fn();
    };
    this.root.appendChild(el);
    this.handoffEl = el;
    setTimeout(() => { try { btn.focus({ preventScroll: true }); } catch { /* noop */ } }, 30);
  }

  ctxFor(side) {
    const s = this.battle.sides[side];
    const other = this.battle.sides[1 - side];
    return {
      active: s.party[s.activeIndex],
      foe: other.party[other.activeIndex],
      party: s.party, activeIndex: s.activeIndex, items: s.items,
      // the move cards forecast damage with the real formula
      field: this.battle.field, sideState: s, foeSideState: other,
      noRun: false, side
    };
  }

  // The prompt is raised the moment the last line of the turn has *started* to
  // be read, so clearing first would cut the tail off "It's super effective!".
  // `say()` queues behind whatever is still on screen, which is what we want.

  ask(side) {
    this.waitingChoice = side;
    const mon = this.battle.sides[side].party[this.battle.sides[side].activeIndex];
    this.app.textbox.say(`What will ${mon.nickname} do?`, { hold: 0 });
    this.menu.showRoot(this.ctxFor(side));
    this.turnPill?.classList.remove('thinking');
  }

  askSwitch(side) {
    this.waitingChoice = side;
    this.forcedSwitch = true;
    this.app.textbox.say('Choose your next fighter.', { hold: 0 });
    this.menu.showParty(this.ctxFor(side), true);
  }

  onPlayerChoice(choice) {
    const side = this.waitingChoice;
    if (side === null || side === undefined) return;
    this.menu.clear();
    this.turnPill?.classList.add('thinking');
    if (this.forcedSwitch) {
      this.forcedSwitch = false;
      const other = this.battle.request[1 - side] === 'switch'
        ? (this.mode === 'ai' && side === 0 ? chooseAction(this.battle, 1, this.aiLevel) : null)
        : null;
      const arr = [null, null];
      arr[side] = choice;
      if (other) arr[1 - side] = other;
      this.waitingChoice = null;
      this.submit(arr);
      return;
    }
    if (side === 0) this.pendingP0 = choice; else this.pendingP1 = choice;
    this.waitingChoice = null;
    this.promptNext();
  }

  flush() {
    const arr = [this.pendingP0, this.pendingP1];
    this.pendingP0 = null; this.pendingP1 = null;
    this.submit(arr);
  }

  submit(choices) {
    const b = this.battle;
    const events = submitChoices(b, choices);
    this.view.setState(publicView(b));
    this.view.push(events);
    // intensity tracks how close the battle is to ending
    const alive = b.sides.map((s) => s.party.filter((p) => !p.fainted).length);
    const total = b.sides[0].party.length + b.sides[1].party.length;
    audio.setIntensity(0.4 + (1 - (alive[0] + alive[1]) / total) * 0.6);
  }

  update() {}

  key(e) {
    if (this.handoffEl) {
      if (e.key === 'Enter' || e.key === ' ') { this.handoffEl.querySelector('button')?.click(); return true; }
      return true;                                  // swallow everything behind the curtain
    }
    // Let the reader skip ahead, but only when the box is genuinely waiting on
    // them — otherwise Enter belongs to the menu.
    if (!this.menu?.items?.length && this.app.textbox.busy && (e.key === 'Enter' || e.key === ' ')) {
      if (this.app.textbox.advance()) return true;
    }
    return this.menu.key(e);
  }
}
