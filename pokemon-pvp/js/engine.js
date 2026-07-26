/* ==========================================================================
   engine.js — Battle rules engine.

   Pure logic: it knows nothing about the DOM. Every turn is resolved into a
   flat list of events which the UI layer replays as animations and text.
   ========================================================================== */

const STAT_KEYS = ['hp', 'atk', 'def', 'spa', 'spd', 'spe'];
const STAT_NAMES = { atk: 'Attack', def: 'Defense', spa: 'Sp. Atk', spd: 'Sp. Def', spe: 'Speed' };
const STATUS_NAMES = { brn: 'burned', par: 'paralyzed', psn: 'poisoned', tox: 'badly poisoned', slp: 'asleep', frz: 'frozen' };
const STATUS_SHORT = { brn: 'BRN', par: 'PAR', psn: 'PSN', tox: 'TOX', slp: 'SLP', frz: 'FRZ' };

const LEVEL = 100;
const IV = 31;   /* perfect */
const EV = 85;   /* an even spread across all six stats — "balanced" */

/* ------------------------------------------------------------------ helpers */

function clamp(v, lo, hi) { return v < lo ? lo : (v > hi ? hi : v); }

function titleCase(id) {
  return id.split('-').map(s => s[0].toUpperCase() + s.slice(1)).join(' ');
}

/* Gen III+ stat formulas at level 100 with neutral natures. */
function calcHP(base) {
  return Math.floor((2 * base + IV + Math.floor(EV / 4)) * LEVEL / 100) + LEVEL + 10;
}
function calcStat(base) {
  return Math.floor((2 * base + IV + Math.floor(EV / 4)) * LEVEL / 100) + 5;
}

function boostMultiplier(stage) {
  return stage >= 0 ? (2 + stage) / 2 : 2 / (2 - stage);
}

function typeEffectiveness(moveType, defTypes) {
  if (moveType === '???') return 1;
  let mult = 1;
  const row = TYPE_CHART[moveType] || {};
  for (const t of defTypes) {
    if (Object.prototype.hasOwnProperty.call(row, t)) mult *= row[t];
  }
  return mult;
}

function effectivenessText(mult) {
  if (mult === 0) return null;
  if (mult >= 4) return "It's devastatingly effective!";
  if (mult > 1) return "It's super effective!";
  if (mult <= 0.25) return "It barely scratched it...";
  if (mult < 1) return "It's not very effective...";
  return null;
}

/* --------------------------------------------------------------- creatures */

let _uid = 0;

function makeMon(speciesId) {
  const sp = SPECIES[speciesId];
  const stats = {
    hp: calcHP(sp.base[0]),
    atk: calcStat(sp.base[1]),
    def: calcStat(sp.base[2]),
    spa: calcStat(sp.base[3]),
    spd: calcStat(sp.base[4]),
    spe: calcStat(sp.base[5])
  };
  return {
    uid: ++_uid,
    speciesId,
    name: sp.name,
    types: sp.types.slice(),
    dex: sp.dex,
    level: LEVEL,
    stats,
    maxHp: stats.hp,
    hp: stats.hp,
    moves: sp.moves.map(id => ({ id, pp: MOVES[id].pp, maxPp: MOVES[id].pp })),
    status: null,
    toxCounter: 0,
    sleepTurns: 0,
    boosts: { atk: 0, def: 0, spa: 0, spd: 0, spe: 0 },
    vol: { confusion: 0, leechSeed: false, flinch: false, protectCount: 0, protected: false },
    fainted: false
  };
}

/* Random team with no duplicate species. */
function makeTeam(size, rng) {
  const pool = SPECIES_IDS.slice();
  const team = [];
  for (let i = 0; i < size && pool.length; i++) {
    const idx = Math.floor(rng() * pool.length);
    team.push(makeMon(pool.splice(idx, 1)[0]));
  }
  return team;
}

function resetOnSwitch(mon) {
  mon.boosts = { atk: 0, def: 0, spa: 0, spd: 0, spe: 0 };
  mon.vol = { confusion: 0, leechSeed: false, flinch: false, protectCount: 0, protected: false };
}

/* ------------------------------------------------------------------ battle */

class Battle {
  constructor(teams, opts = {}) {
    this.teams = teams;                 /* [ [mon,...], [mon,...] ] */
    this.active = [0, 0];               /* index into each team */
    this.names = opts.names || ['Player 1', 'Player 2'];
    this.rng = opts.rng || Math.random;
    this.turn = 0;
    this.winner = null;                 /* 0 | 1 | 'draw' | null */
    this.events = [];
  }

  mon(side) { return this.teams[side][this.active[side]]; }
  foeSide(side) { return side === 0 ? 1 : 0; }
  label(side) { return this.names[side]; }

  push(ev) { this.events.push(ev); return ev; }
  msg(text) { this.push({ t: 'msg', text }); }

  /* Display name including the owning player, e.g. "P1's Gengar". */
  who(side) { return `${this.names[side]}'s ${this.mon(side).name}`; }

  aliveCount(side) { return this.teams[side].filter(m => !m.fainted).length; }

  effSpeed(side) {
    const m = this.mon(side);
    let s = m.stats.spe * boostMultiplier(m.boosts.spe);
    if (m.status === 'par') s *= 0.5;
    return s;
  }

  /* ------------------------------------------------------------ turn entry */

  /* actions: [{type:'move', idx} | {type:'switch', idx}, ...] */
  resolveTurn(actions) {
    this.events = [];
    this.turn++;

    for (const side of [0, 1]) {
      const m = this.mon(side);
      m.vol.flinch = false;
      m.vol.protected = false;
    }

    /* 1. Switches resolve before any attack. */
    const switchers = [0, 1].filter(s => actions[s].type === 'switch');
    switchers.sort((a, b) => this.effSpeed(b) - this.effSpeed(a));
    for (const side of switchers) this.doSwitch(side, actions[side].idx);

    /* 2. Attacks, ordered by priority then speed. */
    const movers = [0, 1].filter(s => actions[s].type === 'move');
    if (movers.length === 2) {
      const pri = s => {
        const mv = this.chosenMove(s, actions[s].idx);
        return mv.pri || 0;
      };
      const p0 = pri(0), p1 = pri(1);
      let order;
      if (p0 !== p1) order = p0 > p1 ? [0, 1] : [1, 0];
      else {
        const s0 = this.effSpeed(0), s1 = this.effSpeed(1);
        if (s0 === s1) order = this.rng() < 0.5 ? [0, 1] : [1, 0];
        else order = s0 > s1 ? [0, 1] : [1, 0];
      }
      this.moveOrder = order;
    } else {
      this.moveOrder = movers;
    }

    const moved = [false, false];
    for (const side of this.moveOrder) {
      if (this.winner !== null) break;
      if (this.mon(side).fainted) continue;
      this.executeMove(side, actions[side].idx, actions, moved);
      moved[side] = true;
      this.checkFaints();
    }

    /* 3. End of turn residual damage. */
    if (this.winner === null) this.endOfTurn();

    this.checkFaints();
    this.checkWin();

    return {
      events: this.events,
      winner: this.winner,
      needSwitch: [0, 1].map(s => this.mon(s).fainted && this.aliveCount(s) > 0)
    };
  }

  chosenMove(side, idx) {
    const m = this.mon(side);
    const slot = m.moves[idx];
    if (!slot || slot.pp <= 0) return MOVES['struggle'];
    return MOVES[slot.id];
  }

  chosenMoveId(side, idx) {
    const m = this.mon(side);
    const slot = m.moves[idx];
    if (!slot || slot.pp <= 0) return 'struggle';
    return slot.id;
  }

  /* -------------------------------------------------------------- switching */

  doSwitch(side, idx, silent) {
    const outgoing = this.mon(side);
    if (!outgoing.fainted) {
      resetOnSwitch(outgoing);
      this.msg(`${this.names[side]} withdrew ${outgoing.name}!`);
    }
    this.active[side] = idx;
    const incoming = this.mon(side);
    resetOnSwitch(incoming);
    this.push({ t: 'switch', side, index: idx });
    this.msg(`${this.names[side]} sent out ${incoming.name}!`);
  }

  /* Used by the UI after a faint, outside of normal turn resolution. */
  forcedSwitch(side, idx) {
    this.events = [];
    this.active[side] = idx;
    const incoming = this.mon(side);
    resetOnSwitch(incoming);
    this.push({ t: 'switch', side, index: idx });
    this.msg(`${this.names[side]} sent out ${incoming.name}!`);
    return this.events;
  }

  /* ------------------------------------------------------------- move logic */

  executeMove(side, idx, actions, moved) {
    const foe = this.foeSide(side);
    const user = this.mon(side);
    const target = this.mon(foe);
    const moveId = this.chosenMoveId(side, idx);
    const move = MOVES[moveId];

    /* --- pre-move status gates --- */
    if (user.vol.flinch) {
      this.msg(`${this.who(side)} flinched and couldn't move!`);
      return;
    }
    if (user.status === 'frz') {
      if (this.rng() < 0.20) {
        user.status = null;
        this.push({ t: 'status', side, kind: null });
        this.msg(`${this.who(side)} thawed out!`);
      } else {
        this.msg(`${this.who(side)} is frozen solid!`);
        return;
      }
    }
    if (user.status === 'slp') {
      user.sleepTurns--;
      if (user.sleepTurns <= 0) {
        user.status = null;
        this.push({ t: 'status', side, kind: null });
        this.msg(`${this.who(side)} woke up!`);
      } else {
        this.msg(`${this.who(side)} is fast asleep.`);
        return;
      }
    }
    if (user.status === 'par' && this.rng() < 0.25) {
      this.msg(`${this.who(side)} is paralyzed! It can't move!`);
      return;
    }
    if (user.vol.confusion > 0) {
      user.vol.confusion--;
      if (user.vol.confusion === 0) {
        this.msg(`${this.who(side)} snapped out of its confusion!`);
      } else {
        this.msg(`${this.who(side)} is confused!`);
        if (this.rng() < 1 / 3) {
          const dmg = this.confusionDamage(user);
          this.applyDamage(side, dmg, { self: true });
          this.msg(`It hurt itself in its confusion!`);
          return;
        }
      }
    }

    /* --- PP --- */
    const slot = user.moves[idx];
    if (slot && slot.pp > 0) slot.pp--;

    /* Protect chains break the moment anything else is used. */
    if (!(move.fx && move.fx.protect)) user.vol.protectCount = 0;

    this.push({ t: 'move', side, moveId, name: move.name, moveType: move.type, cat: move.cat });
    this.msg(`${this.who(side)} used ${move.name}!`);

    /* --- Sucker Punch only lands on an incoming attack --- */
    if (move.fx && move.fx.suckerPunch) {
      const foeAct = actions[foe];
      const foeAttacking = foeAct && foeAct.type === 'move' &&
        this.chosenMove(foe, foeAct.idx).cat !== 'status';
      if (!foeAttacking || moved[foe] || target.fainted) {
        this.msg('But it failed!');
        return;
      }
    }

    /* --- Protect --- */
    if (move.fx && move.fx.protect) {
      const odds = 1 / Math.pow(2, user.vol.protectCount);
      if (this.rng() < odds) {
        user.vol.protected = true;
        user.vol.protectCount++;
        this.push({ t: 'protect', side });
        this.msg(`${this.who(side)} protected itself!`);
      } else {
        user.vol.protectCount = 0;
        this.msg('But it failed!');
      }
      return;
    }

    if (target.fainted) { this.msg('But there was no target...'); return; }

    /* --- Accuracy --- */
    if (move.acc !== 0 && this.rng() * 100 >= move.acc) {
      this.push({ t: 'miss', side });
      this.msg(`${this.who(side)}'s attack missed!`);
      return;
    }

    /* --- Blocked by Protect --- */
    if (target.vol.protected) {
      this.push({ t: 'blocked', side: foe });
      this.msg(`${this.who(foe)} protected itself!`);
      return;
    }

    if (move.cat === 'status') {
      this.applyStatusMove(side, foe, move);
      return;
    }

    /* --- Damage --- */
    const eff = typeEffectiveness(move.type, target.types);
    if (eff === 0) {
      this.msg(`It doesn't affect ${target.name}...`);
      return;
    }

    const { dmg, crit } = this.calcDamage(side, foe, move);
    const dealt = this.applyDamage(foe, dmg, { eff, crit, byMove: move.type });

    if (crit) this.msg('A critical hit!');
    const et = effectivenessText(eff);
    if (et) this.msg(et);

    /* Fire attacks thaw the target. */
    if (move.type === 'fire' && target.status === 'frz') {
      target.status = null;
      this.push({ t: 'status', side: foe, kind: null });
      this.msg(`${this.who(foe)} thawed out!`);
    }

    const fx = move.fx || {};

    if (fx.drain && dealt > 0) {
      const heal = Math.max(1, Math.floor(dealt * fx.drain));
      this.applyHeal(side, heal);
      this.msg(`${this.who(side)} drained health!`);
    }
    if (fx.recoil && dealt > 0) {
      const rec = Math.max(1, Math.floor(dealt * fx.recoil));
      this.applyDamage(side, rec, { self: true });
      this.msg(`${this.who(side)} is hit by recoil!`);
    }

    /* Secondary effects never trigger on a fainted target. */
    if (!target.fainted) {
      if (fx.status && this.rng() < fx.status.chance) this.tryStatus(foe, fx.status.kind);
      if (fx.confuse && this.rng() < fx.confuse) this.tryConfuse(foe);
      if (fx.flinch && this.rng() < fx.flinch && !moved[foe]) {
        target.vol.flinch = true;
      }
    }
    if (fx.stat && this.rng() < fx.stat.chance) {
      const tgt = fx.stat.who === 'self' ? side : foe;
      if (!this.mon(tgt).fainted) this.applyBoosts(tgt, fx.stat.mods);
    }
  }

  applyStatusMove(side, foe, move) {
    const fx = move.fx || {};
    const user = this.mon(side);
    const target = this.mon(foe);

    if (fx.heal) {
      if (user.hp >= user.maxHp) { this.msg('But it failed!'); return; }
      this.applyHeal(side, Math.floor(user.maxHp * fx.heal));
      this.msg(`${this.who(side)} regained health!`);
      return;
    }
    if (fx.stat && fx.stat.who === 'self') {
      this.applyBoosts(side, fx.stat.mods);
      return;
    }

    /* Everything below targets the opponent and can miss. */
    if (move.acc !== 0 && this.rng() * 100 >= move.acc) {
      this.push({ t: 'miss', side });
      this.msg(`${this.who(side)}'s attack missed!`);
      return;
    }
    if (target.vol.protected) {
      this.push({ t: 'blocked', side: foe });
      this.msg(`${this.who(foe)} protected itself!`);
      return;
    }
    if (fx.leechSeed) {
      if (target.types.includes('grass')) { this.msg(`It doesn't affect ${target.name}...`); return; }
      if (target.vol.leechSeed) { this.msg('But it failed!'); return; }
      target.vol.leechSeed = true;
      this.push({ t: 'seeded', side: foe });
      this.msg(`${this.who(foe)} was seeded!`);
      return;
    }
    if (fx.status) {
      /* Status moves respect type immunity of the move itself. */
      const eff = typeEffectiveness(move.type, target.types);
      if (eff === 0) { this.msg(`It doesn't affect ${target.name}...`); return; }
      this.tryStatus(foe, fx.status.kind);
      return;
    }
    if (fx.stat) { this.applyBoosts(foe, fx.stat.mods); return; }
    this.msg('But it failed!');
  }

  /* ----------------------------------------------------------- calculations */

  calcDamage(side, foe, move) {
    const a = this.mon(side);
    const d = this.mon(foe);

    let critChance = 1 / 16;
    if (move.fx && move.fx.critUp) critChance = 1 / 8;
    const crit = this.rng() < critChance;

    const physical = move.cat === 'phys';
    const atkStat = physical ? a.stats.atk : a.stats.spa;
    const defStat = physical ? d.stats.def : d.stats.spd;
    let atkBoost = physical ? a.boosts.atk : a.boosts.spa;
    let defBoost = physical ? d.boosts.def : d.boosts.spd;
    /* A critical hit ignores the attacker's drops and the target's rises. */
    if (crit) { atkBoost = Math.max(0, atkBoost); defBoost = Math.min(0, defBoost); }

    let A = atkStat * boostMultiplier(atkBoost);
    const D = defStat * boostMultiplier(defBoost);

    if (physical && a.status === 'brn') A *= 0.5;

    let dmg = Math.floor(Math.floor(Math.floor(2 * LEVEL / 5 + 2) * move.pw * A / D) / 50) + 2;

    if (crit) dmg = Math.floor(dmg * 1.5);
    dmg = Math.floor(dmg * (0.85 + this.rng() * 0.15));
    if (a.types.includes(move.type)) dmg = Math.floor(dmg * 1.5);
    dmg = Math.floor(dmg * typeEffectiveness(move.type, d.types));

    return { dmg: Math.max(1, dmg), crit };
  }

  confusionDamage(user) {
    const A = user.stats.atk * boostMultiplier(user.boosts.atk);
    const D = user.stats.def * boostMultiplier(user.boosts.def);
    let dmg = Math.floor(Math.floor(Math.floor(2 * LEVEL / 5 + 2) * 40 * A / D) / 50) + 2;
    dmg = Math.floor(dmg * (0.85 + this.rng() * 0.15));
    return Math.max(1, dmg);
  }

  /* --------------------------------------------------------------- mutators */

  applyDamage(side, amount, info = {}) {
    const m = this.mon(side);
    const before = m.hp;
    m.hp = clamp(m.hp - amount, 0, m.maxHp);
    const dealt = before - m.hp;
    this.push({
      t: 'hit', side, dmg: dealt, hp: m.hp, maxHp: m.maxHp,
      eff: info.eff !== undefined ? info.eff : 1,
      crit: !!info.crit, self: !!info.self, residual: !!info.residual
    });
    return dealt;
  }

  applyHeal(side, amount) {
    const m = this.mon(side);
    const before = m.hp;
    m.hp = clamp(m.hp + amount, 0, m.maxHp);
    this.push({ t: 'heal', side, amount: m.hp - before, hp: m.hp, maxHp: m.maxHp });
    return m.hp - before;
  }

  tryStatus(side, kind) {
    const m = this.mon(side);
    if (m.fainted) return false;
    if (m.status) { this.msg(`${this.who(side)} is already ${STATUS_NAMES[m.status]}!`); return false; }
    const immune =
      (kind === 'brn' && m.types.includes('fire')) ||
      (kind === 'frz' && m.types.includes('ice')) ||
      (kind === 'par' && m.types.includes('electric')) ||
      ((kind === 'psn' || kind === 'tox') && (m.types.includes('poison') || m.types.includes('steel')));
    if (immune) { this.msg(`It doesn't affect ${m.name}...`); return false; }

    m.status = kind;
    if (kind === 'tox') m.toxCounter = 1;
    if (kind === 'slp') m.sleepTurns = 1 + Math.floor(this.rng() * 3);
    this.push({ t: 'status', side, kind });
    this.msg(`${this.who(side)} was ${STATUS_NAMES[kind]}!`);
    return true;
  }

  tryConfuse(side) {
    const m = this.mon(side);
    if (m.fainted || m.vol.confusion > 0) return false;
    m.vol.confusion = 2 + Math.floor(this.rng() * 4); /* 2-5 turns */
    this.push({ t: 'confuse', side });
    this.msg(`${this.who(side)} became confused!`);
    return true;
  }

  applyBoosts(side, mods) {
    const m = this.mon(side);
    for (const stat of Object.keys(mods)) {
      const delta = mods[stat];
      const before = m.boosts[stat];
      m.boosts[stat] = clamp(before + delta, -6, 6);
      const real = m.boosts[stat] - before;
      if (real === 0) {
        this.msg(`${this.who(side)}'s ${STAT_NAMES[stat]} won't go ${delta > 0 ? 'higher' : 'lower'}!`);
        continue;
      }
      this.push({ t: 'boost', side, stat, delta: real });
      const mag = Math.abs(real) >= 2 ? ' sharply' : '';
      this.msg(`${this.who(side)}'s ${STAT_NAMES[stat]}${real > 0 ? ` rose${mag}!` : ` fell${mag}!`}`);
    }
  }

  /* ------------------------------------------------------------ end of turn */

  endOfTurn() {
    const order = [0, 1].sort((a, b) => this.effSpeed(b) - this.effSpeed(a));
    for (const side of order) {
      const m = this.mon(side);
      if (m.fainted) continue;

      if (m.status === 'brn') {
        this.msg(`${this.who(side)} is hurt by its burn!`);
        this.applyDamage(side, Math.max(1, Math.floor(m.maxHp / 16)), { self: true, residual: true });
      } else if (m.status === 'psn') {
        this.msg(`${this.who(side)} is hurt by poison!`);
        this.applyDamage(side, Math.max(1, Math.floor(m.maxHp / 8)), { self: true, residual: true });
      } else if (m.status === 'tox') {
        this.msg(`${this.who(side)} is hurt by poison!`);
        this.applyDamage(side, Math.max(1, Math.floor(m.maxHp * m.toxCounter / 16)), { self: true, residual: true });
        m.toxCounter = Math.min(15, m.toxCounter + 1);
      }

      this.checkFaints();
      if (m.fainted) continue;

      if (m.vol.leechSeed) {
        const foe = this.foeSide(side);
        const drain = Math.max(1, Math.floor(m.maxHp / 8));
        this.msg(`${this.who(side)}'s health is sapped by Leech Seed!`);
        const taken = this.applyDamage(side, drain, { self: true, residual: true });
        if (!this.mon(foe).fainted && taken > 0) this.applyHeal(foe, taken);
      }
      this.checkFaints();
    }
  }

  /* ------------------------------------------------------------------ state */

  checkFaints() {
    for (const side of [0, 1]) {
      const m = this.mon(side);
      if (!m.fainted && m.hp <= 0) {
        m.fainted = true;
        m.status = null;
        resetOnSwitch(m);
        this.push({ t: 'faint', side });
        this.msg(`${this.who(side)} fainted!`);
      }
    }
  }

  checkWin() {
    const a0 = this.aliveCount(0), a1 = this.aliveCount(1);
    if (a0 === 0 && a1 === 0) this.winner = 'draw';
    else if (a0 === 0) this.winner = 1;
    else if (a1 === 0) this.winner = 0;
    if (this.winner !== null) {
      this.push({ t: 'end', winner: this.winner });
      if (this.winner === 'draw') this.msg('Both teams are down — the battle is a draw!');
      else this.msg(`${this.names[this.winner]} wins the battle!`);
    }
  }

  /* Legal actions, used by the UI for validation (and by the test harness). */
  legalActions(side) {
    const out = [];
    const m = this.mon(side);
    if (!m.fainted) {
      const usable = m.moves.filter(s => s.pp > 0);
      if (usable.length === 0) out.push({ type: 'move', idx: 0 }); /* Struggle */
      else m.moves.forEach((s, i) => { if (s.pp > 0) out.push({ type: 'move', idx: i }); });
    }
    this.teams[side].forEach((mon, i) => {
      if (!mon.fainted && i !== this.active[side]) out.push({ type: 'switch', idx: i });
    });
    return out;
  }
}

/* Node test harness support; harmless in the browser. */
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { Battle, makeMon, makeTeam, calcHP, calcStat, typeEffectiveness };
}
