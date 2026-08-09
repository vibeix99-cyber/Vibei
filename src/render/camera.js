// Cinematic camera director. Shots are named; the battle view requests a shot
// and the director interpolates. Owned by the camera agent.

import * as THREE from 'three';
import { Ease } from './feel.js';

const V = (x, y, z) => new THREE.Vector3(x, y, z);

/** Anchor positions on the stage. side 0 = near/left, side 1 = far/right. */
export const SLOT_POS = [V(-4.6, 0, 1.2), V(4.6, 0, -1.2)];

export const SHOTS = {
  // Wide establishing shot — the default battle framing.
  wide:     { pos: V(0, 5.0, 12.4), look: V(0, 1.9, 0), fov: 40 },
  // Slightly closer, angled: reads both fighters but with depth.
  standard: { pos: V(-1.2, 4.3, 10.4), look: V(0.2, 1.8, 0), fov: 42 },
  // Over the player's shoulder when choosing.
  command:  { pos: V(-5.6, 3.4, 7.4), look: V(1.8, 1.7, -0.6), fov: 46 },
  // Attacker close-up before a big move.
  heroA:    { pos: V(-6.6, 2.6, 4.6), look: V(-4.4, 1.7, 1.0), fov: 34 },
  heroB:    { pos: V(6.6, 2.6, -4.6), look: V(4.4, 1.7, -1.0), fov: 34 },
  // Impact framing on the defender.
  impactA:  { pos: V(-2.0, 2.4, 6.2), look: V(-4.4, 1.6, 1.0), fov: 38 },
  impactB:  { pos: V(2.0, 2.4, -6.2), look: V(4.4, 1.6, -1.0), fov: 38 },
  // Low dramatic angle for finishers.
  lowA:     { pos: V(-3.2, 0.8, 5.0), look: V(-4.4, 2.2, 0.8), fov: 30 },
  lowB:     { pos: V(3.2, 0.8, -5.0), look: V(4.4, 2.2, -0.8), fov: 30 },
  // Faint / KO.
  koA:      { pos: V(-6.2, 1.4, 4.0), look: V(-4.6, 0.7, 1.0), fov: 36 },
  koB:      { pos: V(6.2, 1.4, -4.0), look: V(4.6, 0.7, -1.0), fov: 36 },
  // Switch-in entrance.
  entryA:   { pos: V(-7.4, 2.2, 6.0), look: V(-4.6, 1.6, 1.0), fov: 40 },
  entryB:   { pos: V(7.4, 2.2, -6.0), look: V(4.6, 1.6, -1.0), fov: 40 },
  // Victory.
  victory:  { pos: V(-3.0, 2.4, 6.4), look: V(-4.4, 1.8, 0.8), fov: 36 }
};

export class CameraDirector {
  constructor(camera) {
    this.cam = camera;
    this.cur = { pos: SHOTS.standard.pos.clone(), look: SHOTS.standard.look.clone(), fov: SHOTS.standard.fov };
    this.target = { pos: SHOTS.standard.pos.clone(), look: SHOTS.standard.look.clone(), fov: SHOTS.standard.fov };
    this.blend = 1;
    this.blendTime = 1;
    this.from = { pos: this.cur.pos.clone(), look: this.cur.look.clone(), fov: this.cur.fov };
    this.ease = Ease.inOutQuad;
    this.orbit = { amp: 0.12, speed: 0.11, t: Math.random() * 10 };
    this.dolly = 0;
    this.cam.userData.basePos = this.cam.position.clone();
    this.shakeHold = 0;
  }

  /** @param {string|object} shot  name in SHOTS, or {pos,look,fov} */
  cut(shot) { this.go(shot, 0); }

  go(shot, seconds = 0.55, ease = Ease.inOutQuad) {
    const s = typeof shot === 'string' ? SHOTS[shot] : shot;
    if (!s) return;
    this.from = { pos: this.cur.pos.clone(), look: this.cur.look.clone(), fov: this.cur.fov };
    this.target = { pos: s.pos.clone(), look: s.look.clone(), fov: s.fov ?? 42 };
    this.blend = seconds <= 0 ? 1 : 0;
    this.blendTime = Math.max(0.0001, seconds);
    this.ease = ease;
    if (seconds <= 0) {
      this.cur.pos.copy(this.target.pos); this.cur.look.copy(this.target.look); this.cur.fov = this.target.fov;
    }
  }

  /** Side-aware shot: 'hero' + side 0 => heroA */
  shotFor(base, side) {
    const key = base + (side === 0 ? 'A' : 'B');
    return SHOTS[key] ? key : base;
  }

  /** Push the camera in briefly, e.g. on a critical hit. */
  punch(amount = 0.35, seconds = 0.18) {
    this.dolly = amount;
    this._dollyT = seconds;
    this._dollyMax = seconds;
  }

  update(dt) {
    if (this.blend < 1) {
      this.blend = Math.min(1, this.blend + dt / this.blendTime);
      const e = this.ease(this.blend);
      this.cur.pos.lerpVectors(this.from.pos, this.target.pos, e);
      this.cur.look.lerpVectors(this.from.look, this.target.look, e);
      this.cur.fov = this.from.fov + (this.target.fov - this.from.fov) * e;
    }

    if (this._dollyT > 0) {
      this._dollyT = Math.max(0, this._dollyT - dt);
      this.dolly = (this._dollyT / this._dollyMax) * 0.35;
    } else this.dolly = 0;

    // Gentle life so static frames never feel like a screenshot.
    this.orbit.t += dt * this.orbit.speed;
    const ox = Math.sin(this.orbit.t) * this.orbit.amp;
    const oy = Math.cos(this.orbit.t * 0.73) * this.orbit.amp * 0.4;

    const dir = this.cur.look.clone().sub(this.cur.pos).normalize();
    const pos = this.cur.pos.clone().addScaledVector(dir, this.dolly * 2.2);
    pos.x += ox; pos.y += oy;

    this.cam.userData.basePos = pos;
    this.cam.position.copy(pos);
    this.cam.lookAt(this.cur.look);
    if (Math.abs(this.cam.fov - this.cur.fov) > 0.01) {
      this.cam.fov = this.cur.fov;
      this.cam.updateProjectionMatrix();
    }
  }
}
