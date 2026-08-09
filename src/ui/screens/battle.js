// The battle screen: owns the battle loop, wires choices into the engine and
// events into the BattleView.

import { createBattle, submitChoices, publicView, legalSwitches } from '../../core/engine.js';
import { chooseAction } from '../../core/ai.js';
import { CommandMenu } from '../menus.js';
import { audio } from '../../audio/audio.js';
import { allFighters, makeDefaultMember } from '../../data/fighters.js';
import { defaultBag } from '../../data/items.js';
import { ARENAS } from '../../data/arenas.js';
import { RNG, seedFromString, randomSeedString } from '../../core/rng.js';

const CSS = `
.bhud-top{ position:absolute; left:50%; transform:translateX(-50%); top:auto; }
.turnpill{
  position:absolute; left:50%; transform:translateX(-50%); top:9vh;
  padding:5px 16px; border-radius:99px; background:rgba(11,13,20,.82); border:2px solid #000;
  font-weight:900; font-size:13px; letter-spacing:.18em; color:#f2c94c; text-transform:uppercase;
  box-shadow:0 4px 14px rgba(0,0,0,.5);
}
.speedbtn{
  position:absolute; right:2.4vw; top:2.2vh; display:flex; gap:6px;
}
.speedbtn button{
  padding:6px 12px; border-radius:9px; border:2px solid #000; background:#1b2033; color:#fff;
  font-weight:800; font-size:13px; cursor:pointer; box-shadow:0 3px 0 #000;
}
.speedbtn button.on{ background:var(--gold); color:#16192a; }
.handoff{
  position:absolute; inset:0; display:flex; flex-direction:column; align-items:center; justify-content:center;
  gap:18px; background:rgba(4,6,12,.94); z-index:20; animation:fadeIn .2s both;
}
.handoff .who{ font-family:var(--font-display); font-size:clamp(26px,5vw,54px); color:#f2c94c; text-shadow:0 4px 0 #000; }
.handoff .sub{ color:#c8cee0; font-size:16px; }
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

    this.turnPill = document.createElement('div');
    this.turnPill.className = 'turnpill';
    this.turnPill.textContent = 'Turn 1';
    root.appendChild(this.turnPill);

    const sp = document.createElement('div');
    sp.className = 'speedbtn';
    [['1×', 1], ['2×', 2], ['4×', 4]].forEach(([lbl, v]) => {
      const b = document.createElement('button');
      b.textContent = lbl;
      b.className = (this.view.speed === v ? 'on' : '');
      b.onclick = () => {
        this.view.speed = v; this.app.settings.battleSpeed = v; this.app.saveSettings();
        [...sp.children].forEach((c) => c.classList.remove('on')); b.classList.add('on');
        this.app.textbox.cps = 110 * v;
        audio.sfx('ui_select');
      };
      sp.appendChild(b);
    });
    root.appendChild(sp);

    this.app.textbox.show();
    this.app.textbox.cps = 110 * this.view.speed;
    this.waitingChoice = null;
    this.pendingP0 = null;
    this.pendingP1 = null;
    this.handoffEl = null;

    this.view.onIdle = () => this.onIdle();
    audio.startMusic('battle');
    audio.setIntensity(0.5);
  }

  unmount() {
    this.menu?.clear();
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
        setTimeout(() => this.app.router.go('results', {
          winner: b.winner, sides: b.sides.map((s) => s.name),
          log: b.log, turns: b.turn, seed: b.seed, replayFrom: this.params
        }), 1200);
      }
      return;
    }
    this.turnPill.textContent = `Turn ${b.turn + (b.request[0] === 'switch' || b.request[1] === 'switch' ? 0 : 1)}`;
    this.promptNext();
  }

  promptNext() {
    const b = this.battle;
    // forced switch takes priority
    if (b.request[0] === 'switch') { this.askSwitch(0); return; }
    if (b.request[1] === 'switch') {
      const c = this.mode === 'ai' ? chooseAction(b, 1, this.aiLevel) : null;
      if (c) { this.submit([null, c]); return; }
      this.askSwitch(1); return;
    }
    if (this.pendingP0 === null) { this.ask(0); return; }
    if (this.pendingP1 === null) {
      if (this.mode === 'ai') { this.pendingP1 = chooseAction(b, 1, this.aiLevel); this.flush(); }
      else this.handoffThen(() => this.ask(1));
      return;
    }
    this.flush();
  }

  handoffThen(fn) {
    if (this.handoffEl) return;
    const el = document.createElement('div');
    el.className = 'handoff';
    el.innerHTML = `<div class="who">${this.battle.sides[1].name}</div>
      <div class="sub">Pass the device. Tap when you're ready.</div>
      <button class="btn primary">I'm ready</button>`;
    el.querySelector('button').onclick = () => {
      audio.sfx('ui_select'); el.remove(); this.handoffEl = null; fn();
    };
    this.root.appendChild(el);
    this.handoffEl = el;
  }

  ctxFor(side) {
    const s = this.battle.sides[side];
    return {
      active: s.party[s.activeIndex],
      foe: this.battle.sides[1 - side].party[this.battle.sides[1 - side].activeIndex],
      party: s.party, activeIndex: s.activeIndex, items: s.items,
      noRun: false, side
    };
  }

  ask(side) {
    this.waitingChoice = side;
    this.app.textbox.clear();
    this.app.textbox.say(`What will ${this.battle.sides[side].party[this.battle.sides[side].activeIndex].nickname} do?`, { hold: 0 });
    this.menu.showRoot(this.ctxFor(side));
  }

  askSwitch(side) {
    this.waitingChoice = side;
    this.forcedSwitch = true;
    this.app.textbox.clear();
    this.app.textbox.say(`Choose your next fighter.`, { hold: 0 });
    this.menu.showParty(this.ctxFor(side), true);
  }

  onPlayerChoice(choice) {
    const side = this.waitingChoice;
    if (side === null || side === undefined) return;
    this.menu.clear();
    if (this.forcedSwitch) {
      this.forcedSwitch = false;
      const other = this.battle.request[1 - side] === 'switch'
        ? (this.mode === 'ai' && side === 0 ? chooseAction(this.battle, 1, this.aiLevel) : null)
        : null;
      const arr = [null, null];
      arr[side] = choice;
      if (other) arr[1 - side] = other;
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
    if (this.app.textbox.busy && (e.key === 'Enter' || e.key === ' ')) {
      if (this.app.textbox.advance()) return true;
    }
    return this.menu.key(e);
  }
}
