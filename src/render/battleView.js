// Event stream → choreography. Reads BattleEvents and turns each into a timed
// beat of 3D animation, camera work, audio and HUD updates.
//
// ── How the clock works ────────────────────────────────────────────────────
//
// The old model was one beat at a time: an event started, ran to completion,
// and only then did the next event begin. That is easy to reason about and it
// wastes about a third of every turn, because a wind-up, the line of text
// describing it, and the recoil of the *previous* blow all want to be on screen
// simultaneously — as they are in every fighting game and in Pokémon itself.
//
// So each event now produces a beat with two independent lengths:
//
//   dur — how long the beat's own animation lives.
//   adv — how long the queue waits before releasing the *next* event.
//
// adv <= dur is the normal case and is where the overlap comes from. A punch
// whose contact frame is 68% of the way through its swing sets adv = 0.68·dur,
// so the damage event fires exactly on contact while the attacker's
// follow-through keeps playing underneath it.
//
// Ordering is still strict — events are released in stream order, never
// reordered — and three extra rules keep causality honest:
//
//   1. Channels. Every beat that poses a fighter claims that fighter's channel
//      (`a0`/`a1`). Claiming cancels whatever held it. So a faint cannot fight
//      the knockback that caused it: it replaces it. The attacker's channel and
//      the defender's channel are different, which is exactly why the swing and
//      the recoil can overlap.
//   2. Barriers. A few events (switch-in over the same fighter, battle end)
//      wait for their channel to be genuinely clear.
//   3. adv is never negative and events never start early, so a faint always
//      begins strictly after the damage beat that produced it has landed its
//      impact frame — which happens on frame 0 of the damage beat.
//
// Text is free. `message` events cost zero gate time and are pulled forward out
// of the queue the instant the beat in front of them starts, so "Luffy used
// Gum-Gum Pistol!" types over the wind-up and "It's super effective!" types over
// the recoil. The only thing that throttles them is `textLoad`: if the box is
// more than ~0.9 s behind, the queue holds until it catches up. That is the one
// place where legibility is allowed to buy back time.

import * as THREE from 'three';
import { buildFighter } from './fighterModel.js';
import { VFX } from './vfx.js';
import { CameraDirector, SLOT_POS } from './camera.js';
import { Ease, clamp01 } from './feel.js';
import { audio } from '../audio/audio.js';
import { getFighter } from '../data/fighters.js';
import { getMove } from '../data/moves.js';
import { TYPE_COLOR } from '../core/types.js';
import { WEATHERS, TERRAINS, STATUSES } from '../core/status.js';
import { floatNumber } from '../ui/hud.js';

const HOME = [new THREE.Vector3(-4.6, 0, 1.2), new THREE.Vector3(4.6, 0, -1.2)];

/**
 * Every beat length in the game, in seconds at 1× speed. `adv` is the gate:
 * how long until the next event may start. `dur` is how long the animation
 * lives. Where they differ, the difference is deliberate overlap.
 *
 * Keep this table honest — it is the whole pacing budget in one screen.
 */
const PACE = {
  battleStart: { dur: 0.10, adv: 0.08 },
  turnStart:   { dur: 0.06, adv: 0.06 },
  switchOut:   { dur: 0.28, adv: 0.19 },
  switchIn:    { dur: 0.50, adv: 0.28 },
  moveSmall:   { dur: 0.40, adv: 0.25 },   // adv lands on the contact frame
  moveBig:     { dur: 0.56, adv: 0.37 },
  prepare:     { dur: 0.46, adv: 0.34 },
  miss:        { dur: 0.36, adv: 0.24 },
  heal:        { dur: 0.46, adv: 0.26 },
  boost:       { dur: 0.42, adv: 0.22 },
  status:      { dur: 0.44, adv: 0.26 },
  statusCure:  { dur: 0.24, adv: 0.16 },
  faint:       { dur: 0.72, adv: 0.46 },
  turnEnd:     { dur: 0.04, adv: 0.02 },
  subStart:    { dur: 0.36, adv: 0.24 },
  subHit:      { dur: 0.24, adv: 0.15 },
  subBreak:    { dur: 0.40, adv: 0.26 },
  perish:      { dur: 0.26, adv: 0.16 },
  weatherIn:   { dur: 0.56, adv: 0.30 },
  weatherOut:  { dur: 0.10, adv: 0.06 },
  terrainIn:   { dur: 0.48, adv: 0.26 },
  field:       { dur: 0.34, adv: 0.20 },
  ability:     { dur: 0.40, adv: 0.24 },
  itemUse:     { dur: 0.42, adv: 0.26 },
  volatile:    { dur: 0.22, adv: 0.12 },
  cannotMove:  { dur: 0.34, adv: 0.24 },
  battleEnd:   { dur: 0.95, adv: 0.90 },
  fallback:    { dur: 0.16, adv: 0.10 },
  // Damage advance by impact tier (graze → devastating). The tail of the beat
  // (knockback + settle) runs on past this, under the next event.
  dmgAdv:  [0.22, 0.28, 0.34, 0.44, 0.56],
  dmgTail: [0.16, 0.22, 0.30, 0.40, 0.52]
};

/** How far behind the action the text box is allowed to fall, in seconds. */
const TEXT_SLACK = 0.9;
/** Message holds, ms at 1×. A crit line earns more time on screen than a chip. */
// Base hold per line style, in ms at 1x. The textbox adds a per-character
// reading allowance on top, so these are floors for *importance*, not length:
// a critical hit is the loudest thing that happens in a turn and should sit
// there long enough to register.
const HOLD = { plain: 420, crit: 950, super: 760, weak: 520, faint: 900, status: 700 };

export class BattleView {
  constructor(stage, uiRoot, plates, textbox, fieldBanner) {
    this.stage = stage;
    this.scene = stage.scene;
    this.feel = stage.feel;
    this.uiRoot = uiRoot;
    this.plates = plates;
    this.textbox = textbox;
    this.fieldBanner = fieldBanner;
    this.vfx = new VFX(stage.fxGroup);
    this.dir = new CameraDirector(stage.camera);
    this.actors = [null, null];      // side -> fighter model api
    this.queue = [];
    this.beats = [];                 // concurrently running beats
    this.gate = 0;                   // seconds until the next event may start
    this.speed = 1;                  // battle speed multiplier
    this.pace = 1;                   // global tuning knob (1 = shipped tuning)
    this.skip = false;
    this.onIdle = null;
    this.state = null;
    this.drains = [null, null];      // HP bar drains, one per side
    this._pendingFx = null;
    this._idleFired = true;
    this._weatherFx = null;
  }

  reset() {
    for (const b of this.beats) { try { b.onEnd?.(); } catch { /* torn down */ } }
    this.beats.length = 0;
    for (const a of this.actors) if (a) { this.scene.remove(a.root); a.dispose(); }
    this.actors = [null, null];
    this.vfx.clear();
    this.queue.length = 0;
    this.gate = 0;
    this.drains = [null, null];
    this._pendingFx = null;
    this._idleFired = true;
    this.feel.reset?.();
  }

  setState(s) { this.state = s; }

  /** Seconds → seconds, scaled by the speed setting. Everything timed goes through here. */
  t(s) { return s / (this.speed * this.pace); }
  /** Milliseconds → milliseconds, same scaling. */
  ms(m) { return m / (this.speed * this.pace); }

  /* ---------------- actors ---------------- */

  spawn(side, speciesId) {
    if (this.actors[side]) { this.scene.remove(this.actors[side].root); this.actors[side].dispose(); }
    const def = getFighter(speciesId);
    const f = buildFighter(def);
    f.root.position.copy(HOME[side]);
    f.facing = side === 0 ? 1 : -1;
    f.root.rotation.y = side === 0 ? Math.PI * 0.14 : Math.PI * 1.14;
    f.state = 'ready';
    this.scene.add(f.root);
    this.actors[side] = f;
    return f;
  }

  chestOf(side) {
    const a = this.actors[side];
    if (!a) return HOME[side].clone().setY(1.4);
    const p = new THREE.Vector3();
    a.rig.spine.getWorldPosition(p);
    return p;
  }

  screenPos(v3) {
    const p = v3.clone().project(this.stage.camera);
    const w = this.stage.canvas.clientWidth, h = this.stage.canvas.clientHeight;
    return { x: (p.x * 0.5 + 0.5) * w, y: (-p.y * 0.5 + 0.5) * h };
  }

  /** Screen-space direction from attacker to defender, for directional shake. */
  _hitDir(fromSide, toSide) {
    const a = this.screenPos(this.chestOf(fromSide));
    const b = this.screenPos(this.chestOf(toSide));
    let dx = b.x - a.x, dy = -(b.y - a.y);
    const l = Math.hypot(dx, dy) || 1;
    return [dx / l, dy / l];
  }

  /* ---------------- queue ---------------- */

  push(events) {
    // Always re-arm the idle callback, even for an empty batch: an empty turn
    // still needs the next prompt, and a missed re-arm is a soft-lock.
    this._idleFired = false;
    if (!events || !events.length) return;
    for (const ev of events) this.queue.push(ev);
  }

  get busy() { return this.beats.length > 0 || this.queue.length > 0 || this.textbox.busy; }

  /** Seconds of text still waiting to be typed and read. Read-only view of the box. */
  get textLoad() {
    const tb = this.textbox;
    const cps = Math.max(20, tb.cps || 110);
    let s = 0;
    if (tb.current) {
      s += Math.max(0, tb.current.text.length - tb.charIdx) / cps;
      const hold = tb.current.hold ?? tb.autoAdvanceMs;
      if (hold > 0) s += Math.max(0, hold - (tb._waitT || 0)) / 1000;
    }
    for (const q of tb.queue) s += q.text.length / cps + Math.max(0, q.hold ?? tb.autoAdvanceMs) / 1000;
    return s;
  }

  /** The last line has been read (or is a standing prompt that never expires). */
  _textSettled() {
    const tb = this.textbox;
    if (!tb.current) return true;
    if (tb.queue.length) return false;
    if (tb.charIdx < tb.current.text.length) return false;
    if (tb.current.hold === 0) return true;           // standing prompt: never blocks
    // Honour the whole hold. This used to cap at 260ms/speed, which is how
    // lines ended up averaging 0.4s on screen no matter what HOLD said.
    return (tb._waitT || 0) >= tb.holdFor(tb.current);
  }

  /* ---------------- beats ---------------- */

  /** End and remove every beat holding `ch`. A channel is one fighter's body. */
  _claim(ch) {
    if (!ch) return;
    for (let i = this.beats.length - 1; i >= 0; i--) {
      if (this.beats[i].ch !== ch) continue;
      const b = this.beats.splice(i, 1)[0];
      try { b.onEnd?.(); } catch { /* keep going */ }
    }
  }

  _chBusy(ch) { return this.beats.some((b) => b.ch === ch); }

  /** May the event at the head of the queue start on this frame? */
  _canStart(ev) {
    // Text throttle: if the box is a long way behind, let it catch up. This is
    // the only thing allowed to slow the action down for readability.
    if (this.textLoad > this.t(TEXT_SLACK)) return false;
    switch (ev.t) {
      // spawn() disposes the outgoing model, so the exit animation must be done.
      case 'switchIn': return !this._chBusy(`a${ev.side}`);
      case 'battleEnd': return this.beats.every((b) => !b.blocking);
      default: return true;
    }
  }

  /**
   * Peek down the queue for the damage this move is about to do, so the swing
   * can be shaped before we know it landed. Stops at the next actor action so
   * we never attribute a later move's damage to this one.
   */
  _lookahead(side) {
    let dmg = null, faint = false, miss = false;
    for (const e of this.queue) {
      if (e.t === 'moveUsed' || e.t === 'turnStart' || e.t === 'switchIn') break;
      if (e.t === 'miss') { miss = true; break; }
      if (e.t === 'damage' && e.side !== side && !dmg) dmg = e;
      if (e.t === 'faint' && e.side !== side) faint = true;
    }
    if (!dmg) return { sev: 0, crit: false, lethal: faint, miss };
    return {
      sev: dmg.amount / Math.max(1, dmg.maxHp), crit: !!dmg.crit,
      lethal: faint || dmg.hpAfter === 0, eff: dmg.eff, miss
    };
  }

  _dispatch(ev) {
    const mv = ev.moveId ? getMove(ev.moveId) : null;
    const fx = ev.fx || mv?.fx || null;
    const look = ev.t === 'moveUsed' ? this._lookahead(ev.side) : null;

    // All camera framing is the director's call — see render/camera.js onEvent.
    this.dir.onEvent(ev, {
      big: (!!mv && ((mv.power || 0) >= 100 || (fx?.scale || 1) >= 1.6)) || (look ? look.sev >= 0.4 : false),
      crit: !!ev.crit || !!look?.crit,
      lethal: (ev.t === 'damage' && ev.hpAfter === 0) || !!look?.lethal,
      speed: this.speed,
      // Additive hint for the camera agent: under reduced motion, hold shots
      // longer and cut less. We can't reach camera.js from here.
      reduced: this.feel.reduced
    });

    this._startBeat(ev, { mv, fx, look });
  }

  /** Pull every contiguous message off the head of the queue — they are free. */
  _drainMessages() {
    let n = 0;
    while (this.queue.length && this.queue[0].t === 'message' && n++ < 6) {
      if (this.textLoad > this.t(TEXT_SLACK)) break;
      const ev = this.queue.shift();
      this.dir.onEvent(ev, { speed: this.speed });
      this._say(ev);
    }
  }

  /**
   * Pull the box level with the action: finish what is typing and step to the
   * newest queued line, so an impact is never narrated by a stale one. Bounded,
   * because a long backlog should still be read rather than flushed in a frame.
   */
  _catchUpText() {
    const tb = this.textbox;
    for (let i = 0; i < 3 && tb.queue.length; i++) {
      if (tb.current && tb.charIdx < tb.current.text.length) {
        tb.charIdx = tb.current.text.length;
        tb._paint(tb.charIdx);
      }
      tb._next();
    }
  }

  _say(ev) {
    const style = ev.style || 'plain';
    // The textbox owns the reading floor, so pass the *unscaled* base and let
    // it scale — otherwise 4x speed divides the floor away entirely.
    this.textbox.speed = this.speed * this.pace;
    this.textbox.say(ev.text, { style: ev.style, hold: HOLD[style] ?? HOLD.plain });
  }

  /**
   * Create the beat for one event.
   * A beat is `{ ev, dur, t, fn, onEnd, ch, blocking }`; `this.gate` is set to
   * the advance time, which is what actually paces the battle.
   */
  _startBeat(ev, { mv, fx, look } = {}) {
    const B = { ev, dur: this.t(PACE.fallback.dur), t: 0, fn: null, onEnd: null, ch: null, blocking: true };
    /** @param {{dur:number,adv:number}} p */
    const use = (p, ch = null) => {
      B.dur = this.t(p.dur);
      this.gate = this.t(p.adv);
      if (ch) { this._claim(ch); B.ch = ch; }
    };

    switch (ev.t) {
      /* ------------------------------------------------------------ */
      case 'battleStart': use(PACE.battleStart); B.blocking = false; break;

      case 'turnStart': use(PACE.turnStart); B.blocking = false; break;

      /* ------------------------------------------------------------ */
      case 'switchIn': {
        const f = this.spawn(ev.side, ev.speciesId);
        const def = getFighter(ev.speciesId);
        const home = HOME[ev.side].clone();
        const off = new THREE.Vector3(home.x + (ev.side === 0 ? -6 : 6), home.y + 2.4, home.z + (ev.side === 0 ? 3 : -3));
        f.root.position.copy(off);
        f.root.scale.setScalar(f.rig.scale * 0.6);
        audio.cry(def?.cry);
        use(PACE.switchIn, `a${ev.side}`);
        B.fn = (p) => {
          const e = Ease.outBack(Math.min(1, p * 1.15));
          f.root.position.lerpVectors(off, home, Math.min(1, p * 1.2));
          f.root.scale.setScalar(f.rig.scale * (0.6 + 0.4 * e));
          if (p > 0.66 && !B._landed) {
            B._landed = true;
            f.root.position.copy(home);
            this.feel.addShake(0.085, { dur: 0.22, freq: 40 });
            this.vfx.impact(new THREE.Vector3(home.x, 0.1, home.z), '#ffffff', 0.6);
            audio.sfx('impact_light');
          }
        };
        B.onEnd = () => { f.root.position.copy(home); f.root.scale.setScalar(f.rig.scale); f.state = 'ready'; };
        const plate = this.plates[ev.side];
        plate.setMon({
          nickname: ev.nickname, level: ev.level, types: ev.types || def?.types || [],
          hp: ev.hp, maxHp: ev.maxHp, status: ev.status, boosts: {}, uid: ev.uid
        }, this.state?.sides?.[ev.side]?.party);
        plate.show();
        this.drains[ev.side] = null;
        break;
      }

      case 'switchOut': {
        const f = this.actors[ev.side];
        this.plates[ev.side].hide();
        this.drains[ev.side] = null;
        if (!f) { use(PACE.fallback); B.blocking = false; break; }
        use(PACE.switchOut, `a${ev.side}`);
        const from = f.root.position.clone();
        const to = from.clone().add(new THREE.Vector3(ev.side === 0 ? -5 : 5, 0.6, ev.side === 0 ? 2 : -2));
        B.fn = (p) => {
          f.root.position.lerpVectors(from, to, Ease.inCubic(p));
          f.root.scale.setScalar(f.rig.scale * (1 - 0.5 * p));
        };
        break;
      }

      /* ------------------------------------------------------------ */
      case 'moveUsed': {
        // Pull the box level before the announce line is said. The first mover
        // is fine — its line is spoken on the frame its move dispatches and is
        // typed well before contact. The second mover's line queues behind the
        // first mover's reaction lines ("It's super effective!", a stat drop, an
        // item proc), so it starts late and finishes *after* its own blow:
        // measured at 0.30s late in 4 of 4 turns. Catching up here costs the
        // reader nothing, because a line stepped past is promoted into the row
        // above rather than discarded.
        this._catchUpText();
        const atk = this.actors[ev.side];
        const f = fx || {};
        const big = (mv?.power || 0) >= 100 || (f.scale || 1) >= 1.6 || (look?.sev ?? 0) >= 0.4;
        use(big ? PACE.moveBig : PACE.moveSmall, `a${ev.side}`);
        this._pendingFx = { fx: f, side: ev.side, type: ev.moveType, big, hits: 0 };

        if (atk) {
          const contact = clamp01((big ? PACE.moveBig.adv : PACE.moveSmall.adv) / (big ? PACE.moveBig.dur : PACE.moveSmall.dur));
          const home = HOME[ev.side].clone();
          const toward = HOME[1 - ev.side].clone().sub(home).normalize();
          const reach = big ? 1.05 : 0.78;
          const back = big ? 0.62 : 0.42;
          atk.state = 'charge';
          atk.setAura(true, TYPE_COLOR[ev.moveType] || '#ffffff', big ? 0.5 : 0.32);
          // Heavy blows get real anticipation: the world dips into slow motion on
          // the way in, so the freeze at contact has something to release from.
          const telegraph = !!look && (look.sev >= 0.42 || look.crit) && !look.miss;
          B.fn = (p) => {
            let off;
            if (p < contact) {
              // wind back → hold → explode forward, arriving at full reach on contact
              const q = p / contact;
              off = q < 0.44 ? -back * Ease.outCubic(q / 0.44)
                : q < 0.56 ? -back
                  : -back + (back + reach) * Ease.inQuint((q - 0.56) / 0.44);
            } else {
              // follow-through: overshoot bleeds off, body returns home
              off = reach * (1 - Ease.outCubic((p - contact) / (1 - contact)));
            }
            atk.root.position.copy(home).addScaledVector(toward, off);
            atk.rig.spine.rotation.y = -off * 0.42;
            atk.rig.spine.rotation.x = -0.05 - off * 0.16;
            if (telegraph && !B._tele && p >= contact * 0.62) {
              B._tele = true;
              this.feel.slowmo(0.5, this.ms(look.crit ? 190 : 140));
            }
          };
          B.onEnd = () => {
            atk.setAura(false);
            if (atk.state === 'charge') atk.state = 'ready';
            atk.root.position.copy(HOME[ev.side]);
            atk.rig.spine.rotation.y = 0;
          };
        }
        break;
      }

      case 'prepare': {
        const atk = this.actors[ev.side];
        use(PACE.prepare, `a${ev.side}`);
        if (atk) {
          atk.setAura(true, '#ffffff', 0.42);
          atk.state = 'charge';
          const home = HOME[ev.side].clone();
          B.fn = (p) => { atk.root.position.y = home.y + Ease.pulse(p) * 0.16; };
          B.onEnd = () => { atk.root.position.copy(home); atk.setAura(false); atk.state = 'ready'; };
        }
        break;
      }

      /* ------------------------------------------------------------ */
      case 'damage': {
        const tgt = this.actors[ev.side];
        const atkSide = 1 - ev.side;
        const pf = this._pendingFx && this._pendingFx.side === atkSide ? this._pendingFx : null;
        const sev = ev.amount / Math.max(1, ev.maxHp);
        const lethal = ev.hpAfter <= 0;
        const from = this.chestOf(atkSide);
        const to = this.chestOf(ev.side);
        const color = pf?.fx?.color || TYPE_COLOR[pf?.type] || '#ffffff';

        // ── the impact frame ──────────────────────────────────────────
        // Bring the box up to date first. A critic photographed a -28 crit
        // exploding on screen while the textbox still read "Tanjiro recovered
        // health!" with two more lines stacked behind it: the words describing
        // an earlier beat, on top of this one's picture. Measured at 3 of 9
        // impacts with lines still queued.
        //
        // Safe only because the box keeps the previous line visible above the
        // current one — snapping a line to complete and moving on no longer
        // takes it away from the reader, it promotes it. Without that row this
        // would be swapping one defect for a worse one.
        this._catchUpText();

        // Sound, effect, number, bar, shake, flash and freeze all happen here,
        // on one frame. Everything after this is aftermath.
        const prof = this.feel.impact(sev, {
          crit: !!ev.crit, eff: ev.eff, lethal, color,
          dir: this._hitDir(atkSide, ev.side), speed: this.speed * this.pace
        });

        let vfxDur = 0.4;
        if (pf) {
          const repeat = pf.hits++;
          const scaled = repeat ? { ...pf.fx, scale: (pf.fx.scale || 1) * 0.72 } : pf.fx;
          vfxDur = this.vfx.play(scaled, from, to);
          audio.sfx(pf.fx.sfx || `impact_${prof.sfx}`, repeat ? { pitch: 1 + repeat * 0.06 } : undefined);
        } else {
          this.vfx.impact(to, color, 0.45 + sev * 1.6);
          audio.sfx(`impact_${prof.sfx}`);
        }
        if (ev.crit) audio.sfx('crit');
        else if (ev.eff > 1) audio.sfx('super');
        else if (ev.eff < 1 && ev.eff > 0) audio.sfx('weak');
        if (prof.tier >= 2) this.dir.punch(prof.zoom, this.t(0.10 + prof.tier * 0.035));

        const sp = this.screenPos(to);
        floatNumber(this.uiRoot, sp.x, sp.y, `-${ev.amount}`, ev.crit ? 'crit' : ev.eff > 1 ? 'super' : '');
        this._drain(ev.side, ev.hpAfter, ev.maxHp, prof, lethal);
        if (ev.hpAfter / ev.maxHp <= 0.2 && ev.hpAfter > 0) audio.sfx('lowhp');

        // ── the aftermath ────────────────────────────────────────────
        const tier = prof.tier;
        const adv = PACE.dmgAdv[tier], tail = PACE.dmgTail[tier];
        use({ dur: Math.max(adv + tail, vfxDur * 0.8), adv }, tgt ? `a${ev.side}` : null);
        // The tail is decorative; the prompt may come up over it.
        B.blocking = false;

        if (tgt) {
          const home = HOME[ev.side].clone();
          const away = home.clone().sub(HOME[atkSide]).normalize();
          const kb = prof.kb * (this.feel.reduced ? 0.42 : 1) * (0.85 + Math.min(0.5, sev));
          const prevState = tgt.state;
          tgt.state = 'hurt';
          // A body flash on the defender carries the hit without touching the
          // screen — which is why it is the one impact cue reduced motion keeps.
          tgt.setAura(true, ev.crit ? '#ffe36b' : color, this.feel.reduced ? 0.55 : 0.4);
          B.fn = (p) => {
            const e = Ease.recoil(p);
            tgt.root.position.copy(home).addScaledVector(away, e * kb);
            tgt.rig.spine.rotation.x = -0.42 * e;
            tgt.rig.spine.rotation.z = 0.16 * e * (ev.side === 0 ? 1 : -1);
            // squash on the way out, back to shape on the way in
            const sq = 1 + e * (tier >= 3 ? 0.075 : 0.03);
            tgt.root.scale.set(tgt.rig.scale * sq, tgt.rig.scale / sq, tgt.rig.scale * sq);
            if (p > 0.34) tgt.setAura(false);
          };
          B.onEnd = () => {
            tgt.root.position.copy(home);
            tgt.root.scale.setScalar(tgt.rig.scale);
            tgt.rig.spine.rotation.z = 0;
            tgt.setAura(false);
            if (tgt.state === 'hurt') tgt.state = prevState === 'charge' ? 'ready' : (prevState || 'ready');
          };
        }
        break;
      }

      case 'heal': {
        const to = this.chestOf(ev.side);
        this.vfx.heal(HOME[ev.side]);
        audio.sfx('heal');
        const sp = this.screenPos(to);
        floatNumber(this.uiRoot, sp.x, sp.y, `+${ev.amount}`, 'heal');
        this._drain(ev.side, ev.hpAfter, ev.maxHp, { drain: 0.5, drainEase: Ease.outCubic, tier: 1 }, false);
        use(PACE.heal);
        B.blocking = false;
        break;
      }

      /* ------------------------------------------------------------ */
      case 'miss': {
        // ev.side is the *attacker*; the fighter that dodges is the other one.
        const dodger = this.actors[1 - ev.side];
        audio.sfx(ev.reason === 'protect' ? 'shield' : 'miss');
        this._pendingFx = null;
        use(PACE.miss, dodger ? `a${1 - ev.side}` : null);
        B.blocking = false;
        if (dodger) {
          const home = HOME[1 - ev.side].clone();
          const lateral = new THREE.Vector3(0, 0, 1).cross(HOME[1 - ev.side].clone().sub(HOME[ev.side]).normalize());
          B.fn = (p) => {
            const e = Ease.pulse(p);
            dodger.root.position.copy(home).addScaledVector(lateral, e * 0.95);
            dodger.rig.spine.rotation.z = e * 0.2;
          };
          B.onEnd = () => { dodger.root.position.copy(home); dodger.rig.spine.rotation.z = 0; };
        }
        break;
      }

      case 'boost': {
        if (ev.failed) { use({ dur: 0.16, adv: 0.14 }); B.blocking = false; break; }
        const col = ev.delta > 0 ? '#8cffb8' : '#ff9c9c';
        this.vfx.play({ shape: 'aura', color: col, scale: 0.9 }, HOME[ev.side], HOME[ev.side]);
        audio.sfx(ev.delta > 0 ? 'buff' : 'debuff');
        const a = this.actors[ev.side];
        use(PACE.boost, a ? `a${ev.side}` : null);
        B.blocking = false;
        if (a) {
          const home = HOME[ev.side].clone();
          B.fn = (p) => {
            const e = Ease.pulse(p);
            const s = a.rig.scale * (1 + e * (ev.delta > 0 ? 0.085 : -0.065));
            a.root.scale.setScalar(s);
            a.root.position.y = home.y + (ev.delta > 0 ? e * 0.1 : 0);
          };
          B.onEnd = () => { a.root.scale.setScalar(a.rig.scale); a.root.position.copy(home); };
        }
        break;
      }

      case 'statusApply': {
        const c = STATUSES[ev.status]?.color || '#ffffff';
        this.vfx.statusPop(this.chestOf(ev.side), c);
        audio.sfx(ev.status === 'slp' ? 'sleep' : ev.status === 'par' ? 'thunder' : 'sludge');
        this.feel.screenFlash(c, 0.16, 110);
        const a = this.actors[ev.side];
        use(PACE.status);
        B.blocking = false;
        if (a) {
          a.setAura(true, c, 0.45);
          B.fn = (p) => { a.rig.auraMat.opacity = 0.45 * (1 - Ease.inQuad(p)); };
          B.onEnd = () => a.setAura(false);
        }
        break;
      }

      case 'statusCure': use(PACE.statusCure); B.blocking = false; break;

      /* ------------------------------------------------------------ */
      case 'faint': {
        const f = this.actors[ev.side];
        audio.sfx('faint');
        this.vfx.faint(this.chestOf(ev.side), '#ffffff');
        this.plates[ev.side].hide();
        this.drains[ev.side] = null;
        this.plates[ev.side].setHp(0, undefined);
        // A KO is the one place slow motion earns its keep. Short, and only here.
        if (!this.feel.reduced) this.feel.slowmo(0.34, this.ms(420));
        use(PACE.faint, f ? `a${ev.side}` : null);
        if (f) {
          const facing = ev.side === 0 ? 1 : -1;
          f.state = 'hurt';
          const home = HOME[ev.side].clone();
          B.fn = (p) => {
            const fall = Ease.outBounce(Math.min(1, p * 1.5));
            f.root.rotation.z = facing * fall * Math.PI * 0.5;
            f.rig.hips.position.y = 0.92 - 0.62 * Ease.outQuad(Math.min(1, p * 1.4));
            f.root.position.copy(home).addScaledVector(
              home.clone().sub(HOME[1 - ev.side]).normalize(), Ease.outQuart(Math.min(1, p * 2)) * 0.35);
          };
          // Hand the pose over to the model's own faint state at the end, so the
          // two never fight over the same bones.
          B.onEnd = () => { f.root.rotation.z = 0; f.state = 'faint'; };
        }
        break;
      }

      /* ------------------------------------------------------------ */
      case 'weather': {
        if (ev.phase === 'start') {
          audio.sfx('weather');
          this.feel.screenFlash(WEATHERS[ev.id]?.color || '#ffffff', 0.18, 200);
          use(PACE.weatherIn);
        } else use(PACE.weatherOut);
        B.blocking = false;
        this._syncField();
        break;
      }

      case 'terrain': {
        if (ev.phase === 'start') { audio.sfx('weather'); use(PACE.terrainIn); }
        else use(PACE.weatherOut);
        B.blocking = false;
        this._syncField();
        break;
      }

      case 'hazard': case 'screen': {
        audio.sfx(ev.t === 'screen' ? 'shield' : 'scatter');
        use(PACE.field);
        B.blocking = false;
        this._syncField();
        break;
      }

      case 'ability': {
        audio.sfx('buff');
        const a = this.actors[ev.side];
        use(PACE.ability);
        B.blocking = false;
        if (a) {
          a.setAura(true, '#ffe9a8', 0.4);
          B.fn = (p) => { a.rig.auraMat.opacity = 0.4 * (1 - Ease.inQuad(p)); };
          B.onEnd = () => a.setAura(false);
        }
        break;
      }

      case 'itemUse': { audio.sfx('heal'); use(PACE.itemUse); B.blocking = false; break; }

      case 'volatileStart': case 'volatileEnd': use(PACE.volatile); B.blocking = false; break;

      case 'cannotMove': {
        audio.sfx(ev.reason === 'flinch' ? 'ui_error' : 'weak');
        const a = this.actors[ev.side];
        use(PACE.cannotMove, a ? `a${ev.side}` : null);
        B.blocking = false;
        if (a) {
          const home = HOME[ev.side].clone();
          B.fn = (p) => { a.root.position.x = home.x + Math.sin(p * Math.PI * 5) * 0.07 * (1 - p); };
          B.onEnd = () => a.root.position.copy(home);
        }
        break;
      }

      /* ------------------------------------------------------------ */
      case 'message': {
        // Text never owns the clock — pacing comes from animation, exactly as it
        // does in the source material. (Normally drained before we get here.)
        this._say(ev);
        use({ dur: 0.02, adv: 0 });
        B.blocking = false;
        break;
      }

      case 'battleEnd': {
        audio.stopMusic();
        audio.sfx(ev.winner === 0 ? 'victory' : 'defeat');
        const w = this.actors[ev.winner === 'draw' ? 0 : ev.winner];
        if (w) w.state = 'ready';
        use(PACE.battleEnd);
        break;
      }

      default: use(PACE.fallback); B.blocking = false;
    }

    this.beats.push(B);
    return B;
  }

  /* ---------------- HP drain ---------------- */

  /**
   * Drive the bar ourselves and let the HUD spring chase it. The spring alone
   * gives every hit the same 0.4 s wobble; what sells a big hit is a bar that
   * keeps *going* after the impact, and a KO bar that crawls the last few pixels.
   */
  _drain(side, hpAfter, maxHp, prof, lethal) {
    const plate = this.plates[side];
    const cur = this.drains[side];
    const from = cur ? cur.value : (plate.hp ?? hpAfter);
    let dur = prof.drain ?? 0.4;
    let ease = prof.drainEase || Ease.outCubic;
    if (lethal) { dur = 0.95; ease = Ease.agony; }        // slows as it reaches zero
    else if (this.feel.reduced) dur *= 1.1;               // no shake to read, so read the bar
    this.drains[side] = {
      from, to: hpAfter, value: from, maxHp,
      t: 0, dur: this.t(dur), ease
    };
  }

  _updateDrains(dt) {
    for (let i = 0; i < 2; i++) {
      const d = this.drains[i];
      if (!d) continue;
      d.t += dt;
      const p = clamp01(d.dur <= 0 ? 1 : d.t / d.dur);
      d.value = d.from + (d.to - d.from) * d.ease(p);
      this.plates[i].setHp(d.value, d.maxHp);
      if (p >= 1) { this.plates[i].setHp(d.to, d.maxHp); this.drains[i] = null; }
    }
  }

  /* ---------------- field ---------------- */

  _syncField() {
    if (!this.state) return;
    const chips = [];
    const w = this.state.field?.weather;
    if (w && w.id !== 'none') chips.push({ label: `${WEATHERS[w.id]?.name ?? w.id} · ${w.turns}`, color: WEATHERS[w.id]?.color, text: '#0b0d14' });
    const t = this.state.field?.terrain;
    if (t && t.id !== 'none') chips.push({ label: `${TERRAINS[t.id]?.name ?? t.id} · ${t.turns}`, color: TERRAINS[t.id]?.color, text: '#0b0d14' });
    for (const s of this.state.sides || []) {
      for (const [id, sc] of Object.entries(s.screens || {})) chips.push({ label: `${s.tag} ${id} ${sc.turns}`, color: '#3a4a6b' });
      for (const [id, n] of Object.entries(s.hazards || {})) if (n) chips.push({ label: `${s.tag} ${id} ×${n}`, color: '#5a3a3a' });
    }
    this.fieldBanner.set(chips);
  }

  /** Sync plates from authoritative state (after each turn resolves). */
  syncPlates(state) {
    this.state = state;
    for (let i = 0; i < 2; i++) {
      const s = state.sides[i];
      const mon = s.party[s.activeIndex];
      if (!mon) continue;
      if (!this.drains[i]) this.plates[i].setHp(mon.hp, mon.maxHp);
      this.plates[i].setStatus(mon.status, mon.boosts);
      this.plates[i].setParty(s.party, mon.uid);
    }
    this._syncField();
  }

  /* ---------------- clock ---------------- */

  update(dt) {
    this.dir.update(dt);
    this.vfx.update(dt);
    for (const a of this.actors) a?.update(dt);
    this._updateDrains(dt);

    // Beats run *after* the actors' idle pass, so a beat's pose always wins.
    for (let i = this.beats.length - 1; i >= 0; i--) {
      const b = this.beats[i];
      b.t += dt;
      const p = b.dur <= 0 ? 1 : Math.min(1, b.t / b.dur);
      b.fn?.(p);
      if (p >= 1) {
        this.beats.splice(i, 1);
        try { b.onEnd?.(); } catch (e) { console.warn('beat onEnd', e); }
      }
    }
    for (const p of this.plates) p.update(dt);

    if (this.gate > 0) this.gate = Math.max(0, this.gate - dt);

    // Release as many events as the gate allows this frame. Messages ride along
    // for free, so a line always starts typing on the frame its action starts.
    let guard = 0;
    this._drainMessages();
    while (this.gate <= 0 && this.queue.length && guard++ < 24) {
      const ev = this.queue[0];
      if (!this._canStart(ev)) break;
      this.queue.shift();
      this._dispatch(ev);
      this._drainMessages();
    }

    if (!this.queue.length && !this._idleFired
        && !this.beats.some((b) => b.blocking) && this._textSettled()) {
      this._idleFired = true;
      this.onIdle?.();
    }
  }
}
