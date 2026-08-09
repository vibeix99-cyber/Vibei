// Event stream → choreography. Reads BattleEvents and turns each into a timed
// beat of 3D animation, camera work, audio and HUD updates.

import * as THREE from 'three';
import { buildFighter } from './fighterModel.js';
import { VFX } from './vfx.js';
import { CameraDirector, SLOT_POS } from './camera.js';
import { Ease } from './feel.js';
import { audio } from '../audio/audio.js';
import { getFighter } from '../data/fighters.js';
import { getMove } from '../data/moves.js';
import { TYPE_COLOR } from '../core/types.js';
import { WEATHERS, TERRAINS, STATUSES } from '../core/status.js';
import { floatNumber } from '../ui/hud.js';

const HOME = [new THREE.Vector3(-4.6, 0, 1.2), new THREE.Vector3(4.6, 0, -1.2)];

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
    this.beat = null;
    this.beatT = 0;
    this.speed = 1;                  // battle speed multiplier
    this.skip = false;
    this.onIdle = null;
    this.state = null;
    this._weatherFx = null;
  }

  reset() {
    for (const a of this.actors) if (a) { this.scene.remove(a.root); a.dispose(); }
    this.actors = [null, null];
    this.vfx.clear();
    this.queue.length = 0;
    this.beat = null;
  }

  setState(s) { this.state = s; }

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

  /* ---------------- queue ---------------- */

  push(events) {
    for (const ev of events) this.queue.push(ev);
  }

  get busy() { return !!this.beat || this.queue.length > 0 || this.textbox.busy; }

  /** Advance one beat. */
  _startBeat(ev) {
    this.beat = { ev, dur: 0.25, t: 0, fn: null };
    const B = this.beat;
    const set = (d) => { B.dur = d / this.speed; };

    switch (ev.t) {
      case 'battleStart': set(0.1); break;

      case 'turnStart': {
        set(0.08);
        this.dir.go('standard', 0.5);
        break;
      }

      case 'switchIn': {
        const f = this.spawn(ev.side, ev.speciesId);
        const home = HOME[ev.side].clone();
        f.root.position.set(home.x + (ev.side === 0 ? -6 : 6), home.y + 2.4, home.z + (ev.side === 0 ? 3 : -3));
        f.root.scale.setScalar(f.rig.scale * 0.6);
        const def = getFighter(ev.speciesId);
        audio.cry(def?.cry);
        this.dir.go(this.dir.shotFor('entry', ev.side), 0.28, Ease.outQuart);
        set(0.62);
        B.fn = (p) => {
          const e = Ease.outBack(Math.min(1, p * 1.15));
          f.root.position.lerpVectors(
            new THREE.Vector3(home.x + (ev.side === 0 ? -6 : 6), home.y + 2.4, home.z + (ev.side === 0 ? 3 : -3)),
            home, Math.min(1, p * 1.2)
          );
          f.root.scale.setScalar(f.rig.scale * (0.6 + 0.4 * e));
          if (p > 0.72 && !B._landed) {
            B._landed = true;
            f.root.position.copy(home);
            this.feel.addShake(0.10);
            this.vfx.impact(new THREE.Vector3(home.x, 0.1, home.z), '#ffffff', 0.6);
            audio.sfx('impact_light');
          }
        };
        const plate = this.plates[ev.side];
        plate.setMon({
          nickname: ev.nickname, level: ev.level, types: ev.types,
          hp: ev.hp, maxHp: ev.maxHp, status: ev.status, boosts: {}, uid: ev.uid
        }, this.state?.sides?.[ev.side]?.party);
        plate.show();
        break;
      }

      case 'switchOut': {
        const f = this.actors[ev.side];
        this.plates[ev.side].hide();
        if (!f) { set(0.1); break; }
        set(0.34);
        const from = f.root.position.clone();
        B.fn = (p) => {
          f.root.position.lerpVectors(from, from.clone().add(new THREE.Vector3(ev.side === 0 ? -5 : 5, 0.6, ev.side === 0 ? 2 : -2)), Ease.inCubic(p));
          f.root.scale.setScalar(f.rig.scale * (1 - 0.5 * p));
        };
        break;
      }

      case 'moveUsed': {
        const mv = getMove(ev.moveId);
        const atk = this.actors[ev.side];
        const fx = ev.fx || mv?.fx || {};
        const big = (mv?.power || 0) >= 100 || (fx.scale || 1) >= 1.6;
        this.dir.go(this.dir.shotFor(big ? 'low' : 'hero', ev.side), big ? 0.32 : 0.24, Ease.outQuart);
        set(big ? 0.62 : 0.42);
        if (atk) {
          atk.state = 'charge';
          atk.setAura(true, TYPE_COLOR[ev.moveType] || '#fff', 0.35);
          const home = HOME[ev.side].clone();
          const toward = HOME[1 - ev.side].clone().sub(home).normalize();
          B.fn = (p) => {
            // wind up back, then lunge
            const wind = p < 0.55 ? -Ease.outQuad(p / 0.55) * 0.55 : -0.55 + Ease.inCubic((p - 0.55) / 0.45) * 0.55;
            atk.root.position.copy(home).addScaledVector(toward, wind);
            atk.rig.spine.rotation.y = wind * 0.6;
          };
          B.onEnd = () => { atk.setAura(false); atk.state = 'ready'; };
        }
        this._pendingFx = { fx, side: ev.side, type: ev.moveType, big, moveName: ev.moveName };
        break;
      }

      case 'prepare': {
        const atk = this.actors[ev.side];
        atk?.setAura(true, '#ffffff', 0.4);
        this.textbox.say(ev.text);
        set(0.55);
        break;
      }

      case 'damage': {
        const pf = this._pendingFx;
        const tgt = this.actors[ev.side];
        const from = this.chestOf(1 - ev.side);
        const to = this.chestOf(ev.side);
        let dur = 0.42;
        if (pf) {
          dur = this.vfx.play(pf.fx, from, to);
          audio.sfx(pf.fx.sfx || 'impact_med');
          this._pendingFx = null;
        } else {
          this.vfx.impact(to, '#ffffff', 0.7);
          audio.sfx('impact_light');
        }
        const power = Math.min(2.2, 0.5 + (ev.amount / Math.max(1, ev.maxHp)) * 3.4 + (ev.crit ? 0.6 : 0) + (ev.eff > 1 ? 0.4 : 0));
        this.feel.hitstop((ev.crit ? 150 : 90) * Math.min(1.6, power));
        this.feel.addShake(0.13 * power);
        this.feel.punchZoom(0.05 * power);
        if (ev.crit) { this.feel.screenFlash('#ffe36b', 0.45); audio.sfx('crit'); this.dir.punch(0.5, 0.22); }
        else if (ev.eff > 1) { this.feel.screenFlash('#ffffff', 0.22); audio.sfx('super'); }
        else if (ev.eff < 1 && ev.eff > 0) audio.sfx('weak');

        this.dir.go(this.dir.shotFor('impact', ev.side), 0.16, Ease.outQuint);

        // knockback
        if (tgt) {
          const home = HOME[ev.side].clone();
          const away = home.clone().sub(HOME[1 - ev.side]).normalize();
          const kb = Math.min(1.2, 0.25 + power * 0.32);
          const startT = performance.now();
          const anim = () => {
            const p = Math.min(1, (performance.now() - startT) / (340 / this.speed));
            const push = Math.sin(p * Math.PI) * kb;
            tgt.root.position.copy(home).addScaledVector(away, push);
            tgt.rig.spine.rotation.x = -0.35 * Math.sin(p * Math.PI);
            if (p < 1) requestAnimationFrame(anim);
            else { tgt.root.position.copy(home); tgt.rig.spine.rotation.x = 0; }
          };
          requestAnimationFrame(anim);
        }

        const sp = this.screenPos(to);
        const kind = ev.crit ? 'crit' : ev.eff > 1 ? 'super' : '';
        floatNumber(this.uiRoot, sp.x, sp.y, `-${ev.amount}`, kind);
        this.plates[ev.side].setHp(ev.hpAfter, ev.maxHp);
        if (ev.hpAfter / ev.maxHp <= 0.2 && ev.hpAfter > 0) audio.sfx('lowhp');
        set(Math.max(0.4, dur));
        break;
      }

      case 'heal': {
        const to = this.chestOf(ev.side);
        this.vfx.heal(HOME[ev.side]);
        audio.sfx('heal');
        const sp = this.screenPos(to);
        floatNumber(this.uiRoot, sp.x, sp.y, `+${ev.amount}`, 'heal');
        this.plates[ev.side].setHp(ev.hpAfter, ev.maxHp);
        set(0.42);
        break;
      }

      case 'miss': {
        const tgt = this.actors[ev.side === 0 ? 1 : 0];
        audio.sfx(ev.reason === 'protect' ? 'shield' : 'miss');
        this._pendingFx = null;
        if (tgt) {
          const home = tgt.root.position.clone();
          const st = performance.now();
          const anim = () => {
            const p = Math.min(1, (performance.now() - st) / 260);
            tgt.root.position.x = home.x + Math.sin(p * Math.PI) * 0.9 * (ev.side === 0 ? 1 : -1);
            if (p < 1) requestAnimationFrame(anim); else tgt.root.position.copy(home);
          };
          requestAnimationFrame(anim);
        }
        set(0.3);
        break;
      }

      case 'boost': {
        if (ev.failed) { set(0.2); break; }
        const col = ev.delta > 0 ? '#8cffb8' : '#ff9c9c';
        this.vfx.play({ shape: 'aura', color: col, scale: 0.9 }, HOME[ev.side], HOME[ev.side]);
        audio.sfx(ev.delta > 0 ? 'buff' : 'debuff');
        const a = this.actors[ev.side];
        if (a) {
          const st = performance.now();
          const anim = () => {
            const p = Math.min(1, (performance.now() - st) / 320);
            const s = a.rig.scale * (1 + Math.sin(p * Math.PI) * (ev.delta > 0 ? 0.09 : -0.07));
            a.root.scale.setScalar(s);
            if (p < 1) requestAnimationFrame(anim); else a.root.scale.setScalar(a.rig.scale);
          };
          requestAnimationFrame(anim);
        }
        set(0.4);
        break;
      }

      case 'statusApply': {
        const c = STATUSES[ev.status]?.color || '#fff';
        this.vfx.statusPop(this.chestOf(ev.side), c);
        audio.sfx(ev.status === 'slp' ? 'sleep' : ev.status === 'par' ? 'thunder' : 'sludge');
        this.feel.screenFlash(c, 0.2);
        set(0.42);
        break;
      }

      case 'statusCure': set(0.28); break;

      case 'faint': {
        const f = this.actors[ev.side];
        audio.sfx('faint');
        this.dir.go(this.dir.shotFor('ko', ev.side), 0.3, Ease.outQuart);
        this.feel.slowmo(0.25, 700);
        this.vfx.faint(this.chestOf(ev.side), '#ffffff');
        this.plates[ev.side].hide();
        set(1.0);
        if (f) {
          const home = f.root.position.clone();
          B.fn = (p) => {
            f.state = 'faint';
            f.root.position.y = home.y;
            f.root.rotation.z = (ev.side === 0 ? 1 : -1) * Ease.outBounce(Math.min(1, p * 1.6)) * Math.PI * 0.5;
            f.rig.body.position.y = -Ease.outQuad(Math.min(1, p * 1.4)) * 0.2;
          };
        }
        break;
      }

      case 'weather': {
        if (ev.phase === 'start') {
          audio.sfx('weather');
          this.feel.screenFlash(WEATHERS[ev.id]?.color || '#fff', 0.25);
          set(0.6);
        } else set(0.05);
        this._syncField();
        break;
      }

      case 'terrain': {
        if (ev.phase === 'start') { audio.sfx('weather'); set(0.5); } else set(0.05);
        this._syncField();
        break;
      }

      case 'hazard': case 'screen': {
        audio.sfx(ev.t === 'screen' ? 'shield' : 'scatter');
        set(0.3); this._syncField();
        break;
      }

      case 'ability': {
        audio.sfx('buff'); set(0.4); break;
      }

      case 'itemUse': { audio.sfx('heal'); set(0.4); break; }

      case 'volatileStart': case 'volatileEnd': set(0.2); break;

      case 'cannotMove': {
        audio.sfx(ev.reason === 'flinch' ? 'ui_error' : 'weak');
        set(0.3); break;
      }

      case 'message': {
        // Text runs *alongside* the action beats. It never owns the clock —
        // pacing comes from animation, exactly as it does in the source material.
        this.textbox.say(ev.text, { style: ev.style });
        set(0.02);
        break;
      }

      case 'battleEnd': {
        audio.stopMusic();
        audio.sfx(ev.winner === 0 ? 'victory' : 'defeat');
        this.dir.go('victory', 0.9, Ease.inOutQuad);
        const w = this.actors[ev.winner === 'draw' ? 0 : ev.winner];
        if (w) w.state = 'ready';
        set(1.4);
        break;
      }

      default: set(0.12);
    }
  }

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
      this.plates[i].setHp(mon.hp, mon.maxHp);
      this.plates[i].setStatus(mon.status, mon.boosts);
      this.plates[i].setParty(s.party, mon.uid);
    }
    this._syncField();
  }

  update(dt) {
    this.dir.update(dt);
    this.vfx.update(dt);
    for (const a of this.actors) a?.update(dt);
    for (const p of this.plates) p.update(dt);

    if (this.beat) {
      this.beat.t += dt;
      const p = Math.min(1, this.beat.dur <= 0 ? 1 : this.beat.t / this.beat.dur);
      this.beat.fn?.(p);
      if (p >= 1) {
        this.beat.onEnd?.();
        this.beat = null;
      }
      return;
    }

    // Text is allowed to run one line behind the action. If it falls further
    // behind than that, hold the next beat so the two stay legible together.
    if (this.textbox.backlog > 1) return;

    if (this.queue.length) {
      const ev = this.queue.shift();
      this._startBeat(ev);
    } else if (!this.textbox.busy) {
      this.onIdle?.();
    }
  }
}
