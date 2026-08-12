// Cinematic camera director.
//
// The battle view hands every BattleEvent to `onEvent`; ALL shot selection
// happens here. Four ideas hold the whole thing together:
//
//   1. Shots are *functions of time*, not fixed poses. A shot re-frames itself
//      every frame from the live actors, so a 7 m Kaido and a 1.7 m Nami get
//      genuinely different framings out of the same shot name.
//   2. Framing is solved, not authored. `_fitDist` picks a distance from the
//      lens and the content; `_aimAt` then rotates the camera so a chosen
//      anchor — almost always a head — lands on an exact screen coordinate,
//      and `_composeY` nudges that until nothing important is behind the HUD
//      or cropped off the top.
//   3. Every camera position lives on one side of the fighter-to-fighter axis
//      (the 180° line), so side 0 is always screen-left and side 1 screen-right.
//   4. A cut costs something. Small beats get a moving hold; hard cuts are
//      saved for the moments that deserve them.
//
// Owned by the camera agent.

import * as THREE from 'three';
import { Ease } from './feel.js';
import { getMove } from '../data/moves.js';
import { getFighter } from '../data/fighters.js';

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const DEG = Math.PI / 180;
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const lerp = (a, b, t) => a + (b - a) * t;

/** Anchor positions on the stage. side 0 = near/left, side 1 = far/right. */
export const SLOT_POS = [V(-4.6, 0, 1.2), V(4.6, 0, -1.2)];

/* ------------------------------------------------------------------ */
/* stage frame                                                         */
/* ------------------------------------------------------------------ */
// U runs along the fighter axis (side 0 → side 1). N is the perpendicular on
// the *audience side* of that axis. Every shot is built in this frame, so the
// 180° line is respected by construction instead of by checking numbers later.

const MID = new THREE.Vector3().addVectors(SLOT_POS[0], SLOT_POS[1]).multiplyScalar(0.5);
const AXIS = new THREE.Vector3().subVectors(SLOT_POS[1], SLOT_POS[0]);
const SEP = AXIS.length();
const U = AXIS.clone().normalize();
const N = new THREE.Vector3(-U.z, 0, U.x);

/** Signed distance from the 180° line. Positive = audience side. */
export function sideOfAxis(p) { return (p.x - MID.x) * N.x + (p.z - MID.z) * N.z; }

/* Screen-space safe area (viewport fractions), read off the live HUD rather
   than guessed: the foe plate is top-LEFT (0.02–0.26 x / 0.02–0.14 y), the
   player plate bottom-RIGHT (0.74–0.98 x / 0.70–0.82 y), the turn and speed
   pills top-RIGHT above 0.06 y, and the dock owns everything below 0.82 y.
   The old comment had the two plates mirrored, so every framing constraint
   built on it was defending the wrong corners — heads were being pushed up
   out of space that was free, and feet were being left in the text box.
   `dock` is the floor for feet: below it a fighter's legs are behind the box. */
export const SAFE = { x0: 0.08, x1: 0.92, y0: 0.15, y1: 0.64, dock: 0.79 };

/* Legacy static table. Kept so anything that imported SHOTS keeps working; the
   director no longer uses it, and the mirrored shots have been moved back
   across the axis so even the fallbacks keep screen sides consistent. */
export const SHOTS = {
  wide:     { pos: V(0, 5.6, 13.6),   look: V(0, 2.1, 0),      fov: 34 },
  standard: { pos: V(-1.4, 4.4, 11.2), look: V(0.1, 1.9, 0),   fov: 40 },
  command:  { pos: V(-6.3, 3.0, 4.4), look: V(2.4, 1.8, -0.6), fov: 30 },
  heroA:    { pos: V(-1.9, 2.5, 5.2), look: V(-4.4, 1.7, 1.1), fov: 34 },
  heroB:    { pos: V(1.9, 2.5, 3.0),  look: V(4.4, 1.7, -1.1), fov: 34 },
  impactA:  { pos: V(5.6, 2.6, 2.0),  look: V(-4.4, 1.6, 1.1), fov: 26 },
  impactB:  { pos: V(-5.6, 2.6, 4.4), look: V(4.4, 1.6, -1.1), fov: 26 },
  lowA:     { pos: V(4.9, 1.0, 2.4),  look: V(-4.4, 2.0, 1.1), fov: 26 },
  lowB:     { pos: V(-4.9, 1.0, 4.8), look: V(4.4, 2.0, -1.1), fov: 26 },
  koA:      { pos: V(-6.4, 1.5, 3.0), look: V(-4.6, 0.6, 1.1), fov: 36 },
  koB:      { pos: V(6.4, 1.5, 0.6),  look: V(4.6, 0.6, -1.1), fov: 36 },
  entryA:   { pos: V(-1.2, 2.2, 6.4), look: V(-4.6, 1.6, 1.1), fov: 38 },
  entryB:   { pos: V(3.0, 2.2, 4.0),  look: V(4.6, 1.6, -1.1), fov: 38 },
  victory:  { pos: V(-1.9, 2.3, 5.4), look: V(-4.4, 1.8, 1.0), fov: 30 }
};

/* ------------------------------------------------------------------ */
/* easing + noise                                                      */
/* ------------------------------------------------------------------ */

const E = {
  ...Ease,
  /** hard arrival — the impact snap. */
  snap: (t) => 1 - Math.pow(1 - t, 6),
  /** weight on both ends — pushes, establishing moves, the slow drift home. */
  glide: (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
  /** overshoot a hair, then sit down. After a KO. */
  settle: (t) => (t >= 1 ? 1 : (1 - Math.pow(1 - t, 4)) + Math.sin(t * Math.PI) * Math.pow(1 - t, 2) * 0.15),
  /** thrown, then caught — the whip pan. */
  whip: (t) => 1 - Math.pow(1 - t, 3.2)
};

// Value noise, so handheld reads as a hand rather than as a sine wave.
function hash1(i) { const s = Math.sin(i * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); }
function vnoise(x) {
  const i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f);
  return (hash1(i) * (1 - u) + hash1(i + 1) * u) * 2 - 1;
}
function fbm(x) { return vnoise(x) * 0.62 + vnoise(x * 2.17 + 19.3) * 0.26 + vnoise(x * 4.41 + 71.9) * 0.12; }

/* scratch — kept in disjoint pools so nested helpers cannot clobber each other */
const _a = new THREE.Vector3(), _b = new THREE.Vector3();
const _q0 = new THREE.Vector3(), _q1 = new THREE.Vector3(), _q2 = new THREE.Vector3(), _q3 = new THREE.Vector3();
const _r0 = new THREE.Vector3(), _r1 = new THREE.Vector3(), _r2 = new THREE.Vector3(), _r3 = new THREE.Vector3();
const _c0 = new THREE.Vector3(), _c1 = new THREE.Vector3(), _c2 = new THREE.Vector3();
const _k = [new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()];
const _lk = new THREE.Vector3(), _e0 = new THREE.Vector3(), _e1 = new THREE.Vector3();
const _pv = new THREE.Vector3();
const _box = new THREE.Box3(), _dbox = new THREE.Box3(), _tbox = new THREE.Box3(), _m4 = new THREE.Matrix4();

const pose = (pos, look, fov) => ({ pos, look, fov });

/**
 * Yaw offsets the resting shot may try, in order of preference, when arena
 * geometry is standing in front of a fighter. Smallest first: the framing we
 * solved for is the one we want, and moving off it is a concession.
 */
const LOS_TRY = [0, 0.30, -0.30, 0.58, -0.58, 0.88, -0.88];
/**
 * Sample points for the line-of-sight test, as (height fraction, sideways
 * fraction of half-width). A cross, not a line: the first attempt sampled three
 * heights straight up the fighter's centre and still reported "clear" while an
 * Onigashima pillar took 50% of the silhouette, because a *vertical* pillar
 * occludes a *horizontal* slice and every centre-line ray missed it.
 */
const LOS_PT = [[0.22, 0], [0.62, 0], [0.92, 0], [0.62, -0.9], [0.62, 0.9]];
/** Yaw offsets a single-subject shot may swing through to see its subject. */
const HERO_TRY = [0.34, -0.34, 0.68, -0.68, 1.02, -1.02];
const _ray = new THREE.Raycaster();

/** Shortest camera move allowed while reduced motion is on. Never a cut. */
const REDUCED_BLEND = 1.1;

/**
 * How far out the camera may actually stand. `_safe` pulls anything past the
 * arena disc back in, which used to happen *after* the framing was solved —
 * so a two-shot that asked for 29 m to fit an 8.8 m Big Mom silently got 23,
 * and she came out a third bigger than the frame budget said. Shots solve
 * against this number instead, and open the lens when the pair will not fit
 * from inside the arena.
 */
const REACH = 14.5;
// 14.5, not the 21.5 this used to be, and the difference is the whole bug the
// feel critic found. The old number was chosen so a two-shot could always back
// up far enough to fit an 8.8m fighter, and it could — by standing *inside the
// stands*. On the default seed a 5.1m fighter drove the stand-off to radius 20
// and from there zero of nine rays reached either fighter, for five consecutive
// command prompts and most of the action between them.
//
// The arena floor is about 13 across; every shot that was working already sat
// at 12.7. Past ~14.5 there is nothing to stand on. Fitting a giant is what
// `fovMax` is for — the lens opens to 64 in the resting shot — and a giant that
// slightly overflows a readable frame beats a giant framed perfectly from
// behind a wall.
//
// This is a flat bound rather than a per-arena measurement on purpose. I tried
// measuring a safe radius per stage by casting rays out from the centre and it
// does not work: what blocks the shot here is tier geometry at radius ~14 that
// a ray at eye height passes straight over and a camera at 5.2m looks down
// through, so any single-height probe gives false confidence. I also tried
// having `_seekView` search inward as well as around; it engages, but with the
// bound correct it never had anything left to rescue, so it was removed rather
// than shipped unproven. If a future arena puts structure inside 14.5, that
// search is the right thing to bring back — see docs/HANDOFF.md.

/* ------------------------------------------------------------------ */

export class CameraDirector {
  constructor(camera) {
    this.cam = camera;

    /** Live description of each fighter, refreshed from the scene every frame. */
    this.act = [0, 1].map((i) => ({
      ref: null, sid: null, h: 1.8, scale: 1, measuredAt: -1,
      home: SLOT_POS[i].clone(),
      aim: SLOT_POS[i].clone(),
      head: SLOT_POS[i].clone().setY(1.78),
      headH: 1.78, topH: 1.95, fullH: 2.16, loH: -0.09, halfW: 0.45, rad: 0.55,
      top: 1.95, full: 2.16, down: false
    }));
    this.gScale = 1;

    this.time = 0;
    this.seq = 0;
    this.marks = [];                 // shot-change log; read by tools/camerasheet.mjs
    this.shot = null;
    this.shotStart = 0;
    this.shotAge = 0;
    this.speed = 1;

    this.cur = pose(new THREE.Vector3(), new THREE.Vector3(), 40);
    this.from = pose(new THREE.Vector3(), new THREE.Vector3(), 40);
    this.blend = 1; this.blendTime = 1; this.ease = E.glide; this.blendMode = 'arc';

    this.dolly = 0; this._dollyT = 0; this._dollyMax = 1; this._dollyAmp = 0.35;
    /** While >0 the director holds still so screen shake reads cleanly. */
    this.shakeHold = 0;
    this._holdAt = null;
    this.intensity = 0.12;
    this.hpFrac = [1, 1];
    this._kick = null;
    this.attn = { p: new THREE.Vector3(), w: 0, k: 0 };
    this.noiseT = Math.random() * 300;

    /**
     * Reduced motion. A hard switch, not a scale factor — the same contract
     * `Feel.reduced` uses. While it is on the director never cuts, never
     * punches the lens, and never leaves the two calm framings; see `_request`.
     * Kept in sync from `ctx.reduced` on every event and from the bound view's
     * `feel` every frame, so it is right before the first event arrives.
     */
    this.reduced = false;

    /** Line-of-sight search for the resting shot: target, eased value, clock. */
    this._losYaw = 0; this._losEase = 0; this._losAt = -99;

    this.pending = null;
    this._turn = { first: null, prevFirst: null, movers: 0 };
    this._lastDamage = null;
    this._opening = false;
    this._idle = 0;
    this._commanded = false;
    this._bindTries = 0;
    this.view = null;

    this._base = new THREE.Vector3();
    this.cam.userData.basePos = this._base;

    this._sample(0.016);
    this._request(this._neutral(), { dur: 0, force: true });
    this.update(0.0001);
  }

  /* ---------------------------------------------------------------- */
  /* actor sampling — framing reads the scene, never a hard-coded 1.8 m */
  /* ---------------------------------------------------------------- */

  _bind() {
    if (this.view) return this.view;
    if (this._bindTries > 900) return null;
    this._bindTries++;
    try {
      const v = globalThis.__ARENA?.app?.view;
      if (v && v.dir === this) this.view = v;
    } catch { /* not in a page, or not wired yet */ }
    return this.view;
  }

  /** Measure the rig in authored space so a mid-spawn scale tween can't lie. */
  _measure(s, a) {
    s.h = a.rig?.heightM || getFighter(s.sid)?.model?.height || 1.8;
    s.scale = a.rig?.scale || s.h / 1.8;
    s.measuredAt = this.time;
    let ok = false;
    try {
      a.root.updateWorldMatrix(true, true);
      _m4.copy(a.root.matrixWorld).invert();
      _box.makeEmpty();
      _dbox.makeEmpty();
      a.root.traverse((o) => {
        if (!o.isMesh || !o.geometry) return;
        // The aura is a transient glow twice the fighter's size — it must not
        // decide anything. The contact shadow is a permanent, visible disc and
        // it is what actually sets how wide the silhouette reads, so it counts
        // toward the size budget while staying out of the head framing.
        if (o === a.rig?.aura) return;
        if (!o.geometry.boundingBox) o.geometry.computeBoundingBox();
        _tbox.copy(o.geometry.boundingBox).applyMatrix4(o.matrixWorld).applyMatrix4(_m4);
        _dbox.union(_tbox);
        if (o === a.rig?.blob) return;
        _box.union(_tbox);
      });
      ok = !_box.isEmpty() && isFinite(_box.max.y) && !_dbox.isEmpty() && isFinite(_dbox.max.y);
    } catch { ok = false; }

    if (!ok) {
      s.topH = s.h * 1.08; s.fullH = s.h * 1.25; s.loH = -0.05 * s.h;
      s.halfW = 0.45 * s.scale; s.rad = 0.55 * s.scale; return;
    }
    const propTop = _box.max.y * s.scale;
    const headTop = 2.02 * s.scale;
    // Frame the head with real headroom and let a raised weapon crop, the way
    // an operator would: only a third of the prop's reach is honoured.
    s.topH = clamp(headTop + 0.34 * Math.max(0, propTop - headTop), s.h * 0.95, s.h * 1.5);
    // …but *size* limits have to answer for everything the model actually
    // draws. Kaido's horns put a metre and a half above his head, and a limit
    // measured to the head is a limit the frame quietly breaks.
    s.fullH = clamp(_dbox.max.y * s.scale, s.topH, s.h * 2.4);
    // Models are not neatly rooted at the deck: outlines and contact geometry
    // hang below y=0, and a box measured from the deck up loses that metre —
    // which is exactly the metre that makes a giant overflow the frame.
    s.loH = clamp(_dbox.min.y * s.scale, -0.5 * s.h, 0);
    const halfXZ = Math.max(_dbox.max.x - _dbox.min.x, _dbox.max.z - _dbox.min.z) * 0.5 * s.scale;
    // `halfW` is for keeping out of the way; `rad` is the honest half-extent
    // the size budget is measured with. Big Mom is 7.4 m tall and 10 m wide,
    // and it is the width that decides how much frame she projects into.
    s.rad = clamp(halfXZ, 0.3 * s.scale, 2.2 * s.h);
    s.halfW = clamp(Math.max(_box.max.x - _box.min.x, _box.max.z - _box.min.z) * 0.5 * s.scale * 0.85,
      0.35 * s.scale, 1.1 * s.h);
  }

  _sample(dt) {
    const view = this._bind();
    const k = 1 - Math.exp(-dt * 14);
    for (let i = 0; i < 2; i++) {
      const s = this.act[i];
      const a = view?.actors?.[i] || null;
      if (a && a.rig && a.root) {
        if (s.ref !== a) { s.ref = a; s.sid = a.def?.id || s.sid; this._measure(s, a); }
        else if (this.time - s.measuredAt > 1.0 && a.state === 'ready') this._measure(s, a);

        // Track the fighter, but on a leash: knockback should tilt the frame,
        // not drag the camera 6 m across the arena during a switch-in.
        _a.copy(a.root.position).sub(s.home);
        const L = _a.length();
        if (L > 1.4) _a.multiplyScalar(1.4 / L);
        s.aim.copy(s.home).addScaledVector(_a, 0.5);

        let hh = s.h * 0.988;
        if (a.rig.head) { a.rig.head.getWorldPosition(_b); hh = _b.y - a.root.position.y; }
        s.headH += (clamp(hh, 0.18 * s.h, 1.4 * s.h) - s.headH) * k;
        s.down = a.state === 'faint';
      } else {
        s.ref = null;
        s.aim.copy(s.home);
        s.headH += (s.h * 0.988 - s.headH) * k;
        s.down = false;
      }
      s.head.copy(s.aim).setY(s.aim.y + s.headH);
      s.top = Math.max(s.head.y + 0.16 * s.h, s.aim.y + s.topH);
      // Framing aims at `top`; size budgets are spent against `full`, which is
      // the *projected* extent of the bounding box, not its height. A box half
      // as wide as it is tall adds a quarter of its width to what it covers,
      // because the near-bottom and far-top corners are at different depths —
      // measured across the roster, `+ rad/2` predicts the real projection to
      // within a couple of percent, from Chopper to Kaido.
      s.full = Math.max(s.top, s.aim.y + s.fullH) - s.loH + 0.5 * s.rad;
    }
    this.gScale = Math.max(this.act[0].scale, this.act[1].scale);
  }

  /** Take heights off the event stream so framing is right on frame one. */
  _noteSpecies(side, speciesId) {
    const def = getFighter(speciesId);
    if (!def) return;
    const s = this.act[side];
    s.sid = speciesId;
    s.h = def.model?.height || 1.8;
    s.scale = s.h / 1.8;
    s.headH = s.h * 0.988;
    s.topH = s.h * 1.12;
    s.fullH = s.h * 1.28;
    s.loH = -0.05 * s.h;
    s.halfW = 0.45 * s.scale;
    s.rad = 0.55 * s.scale;
    s.top = s.topH;
    s.full = s.fullH;
    s.ref = null;
    this.gScale = Math.max(this.act[0].scale, this.act[1].scale);
  }

  /** 0 for a human-sized fight, 1 for a Kaido. Drives tilt and camera height. */
  _giantK(tall) { return clamp((tall - 2.4) / 5.6, 0, 1); }

  /* ---------------------------------------------------------------- */
  /* framing maths                                                     */
  /* ---------------------------------------------------------------- */

  get aspect() { const a = this.cam.aspect; return (isFinite(a) && a > 0.2) ? a : 16 / 10; }

  /** Distance at which a frame `frameH` tall and `frameW` wide fits in `fov`. */
  _fitDist(frameH, frameW, fov) {
    const tv = Math.tan(fov * DEG * 0.5);
    const th = tv * this.aspect;
    return Math.max(frameH / (2 * tv), frameW / (2 * th));
  }

  /**
   * A look-at point that puts `anchor` at screen fraction (sx, sy).
   * This is the whole "never lose the player" mechanism: heads get *placed*,
   * not hoped for. Solved by fixed-point iteration; converges in 2–3 steps.
   */
  _aimAt(pos, anchor, sx, sy, fov, out) {
    const tv = Math.tan(fov * DEG * 0.5);
    const th = tv * this.aspect;
    const xt = (sx - 0.5) * 2 * th;
    const yt = (0.5 - sy) * 2 * tv;
    _q0.copy(anchor).sub(pos);
    const dist = _q0.length() || 1;
    _q0.multiplyScalar(1 / dist);
    const M = Math.sqrt(1 + xt * xt + yt * yt);
    _q1.copy(_q0);
    for (let i = 0; i < 4; i++) {
      _q2.set(-_q1.z, 0, _q1.x);
      if (_q2.lengthSq() < 1e-8) _q2.set(1, 0, 0);
      _q2.normalize();                        // camera right
      _q3.crossVectors(_q2, _q1).normalize(); // camera up
      _q1.copy(_q0).multiplyScalar(M).addScaledVector(_q2, -xt).addScaledVector(_q3, -yt).normalize();
    }
    return (out || new THREE.Vector3()).copy(pos).addScaledVector(_q1, dist);
  }

  /** Screen fraction (x, y) and forward depth (z) of a world point. */
  _project(p, cp, look, fov, out) {
    _r0.copy(look).sub(cp).normalize();
    _r1.set(-_r0.z, 0, _r0.x); if (_r1.lengthSq() < 1e-8) _r1.set(1, 0, 0); _r1.normalize();
    _r2.crossVectors(_r1, _r0).normalize();
    _r3.copy(p).sub(cp);
    const fwd = _r3.dot(_r0);
    const tv = Math.tan(fov * DEG * 0.5), th = tv * this.aspect;
    if (fwd <= 0.02) { out.set(_r3.dot(_r1) > 0 ? 9 : -9, 0.5, -1); return out; }
    out.set(0.5 + (_r3.dot(_r1) / fwd) / (2 * th),
      0.5 - (_r3.dot(_r2) / fwd) / (2 * tv), fwd);
    return out;
  }

  /**
   * Aim at `anchor`, then slide the tilt until every constraint is satisfied:
   * `{v, min, max}` = this world point's screen y must stay in that band.
   * Cheap, and it is what keeps a Kaido's head on screen while a Nami's head
   * stays out of the bottom-left name plate in the same frame.
   */
  _composeY(p, anchor, sx, sy, fov, cons, out) {
    let look = this._aimAt(p, anchor, sx, sy, fov, out);
    for (let i = 0; i < 3; i++) {
      let up = 0, down = 0;
      for (const c of cons) {
        this._project(c.v, p, look, fov, _pv);
        if (_pv.z <= 0) continue;
        if (c.min != null && _pv.y < c.min) up = Math.max(up, c.min - _pv.y);
        if (c.max != null && _pv.y > c.max) down = Math.min(down, c.max - _pv.y);
      }
      const dy = up + down;
      if (Math.abs(dy) < 0.004) break;
      sy = clamp(sy + dy, 0.08, SAFE.y1);
      look = this._aimAt(p, anchor, sx, sy, fov, look);
    }
    return look;
  }

  /**
   * Keep the camera out of trouble: above the deck, outside the fighters,
   * inside the arena disc and — the one that matters — on the audience side
   * of the 180° line.
   */
  _safe(p, minSide = 1.1) {
    const f = sideOfAxis(p);
    if (f < minSide) p.addScaledVector(N, minSide - f);

    const floor = 0.60 + 0.12 * (this.gScale - 1);
    if (p.y < floor) p.y = floor;

    for (let i = 0; i < 2; i++) {
      const s = this.act[i];
      if (p.y > s.top * 0.95) continue;              // clearing them overhead is fine
      const dx = p.x - s.aim.x, dz = p.z - s.aim.z;
      const d = Math.hypot(dx, dz);
      const r = s.halfW + 0.5 + 0.12 * s.scale;
      if (d < r) {
        if (d < 1e-4) p.x += r;
        else { p.x += (dx / d) * (r - d); p.z += (dz / d) * (r - d); }
      }
    }

    const rad = Math.hypot(p.x, p.z);
    if (rad > 23) { p.x *= 23 / rad; p.z *= 23 / rad; }
    const f2 = sideOfAxis(p);
    if (f2 < minSide) p.addScaledVector(N, minSide - f2);
    return p;
  }

  /**
   * The invariant. A camera is never allowed to end up inside an actor, or so
   * close to one that the actor swallows the frame — which is the same failure
   * seen from two sides, and it was the single worst thing about this camera.
   *
   * Both limits are *solved*, never tuned:
   *   • the body limit is the actor's own bounding radius plus a hand's width,
   *   • the frame limit is the distance at which this lens renders the actor
   *     `maxFill` of the frame high — `top / (2·maxFill·tan(fov/2))`.
   * The larger of the two wins, and the camera is pushed straight back along
   * its own view axis until it is satisfied, which preserves the framing it was
   * handed (same look direction, same subject placement, just more air).
   *
   * @param {THREE.Vector3} p      camera position, moved in place
   * @param {THREE.Vector3} at     what the shot is looking at — the push is along -view
   * @param {number} fov           the lens this pose will be rendered with
   * @param {number} maxFill       largest slice of frame height any actor may own
   */
  _clearActors(p, at, fov, maxFill = 1) {
    // Pass 1: bodies. Analytic and absolute — the camera is never inside one.
    let moved = this._backOff(p, at, (s) => s.halfW + 0.5 + 0.2 * s.scale);
    if (maxFill <= 0) return p;
    // Pass 2: frame share. Measured, not estimated: how much of the frame an
    // actor takes is decided by its bounding box, and Big Mom's box is wider
    // than she is tall, so a height-only estimate under-reads her by a third.
    //
    // Projected size goes as 1/depth, and depth is not radial distance for an
    // actor off to one side — a full correction therefore overshoots, and the
    // camera can only ever be pushed further out, so an overshoot is permanent
    // and comes straight off the other fighter. Take 72% of the correction and
    // converge on the limit from below instead of past it.
    for (let pass = 0; pass < 4 && moved < 200; pass++) {
      const t = this._backOff(p, at, (s) => {
        const span = this._projSpan(s, p, at, fov);
        if (span <= maxFill) return 0;
        return _c1.distanceTo(p) * (1 + 0.72 * Math.min(span / maxFill - 1, 3));
      });
      moved += t;
      if (t < 0.02) break;
    }
    return p;
  }

  /**
   * Back the camera off until both fighters sit inside the horizontal safe band.
   *
   * `_clearActors` measures frame *height* and body distance and nothing else,
   * so a fighter could project at 126% of screen width and satisfy every check
   * the director had. Measured in Corrida Colosseum: **53 of 53 held `track`
   * frames** with a fighter at least 20% outside the viewport, worst case fully
   * outside it, while the left 60% of frame held empty floor.
   *
   * The vertical half of this has always been here — `_track` constrains the
   * other fighter's head and feet through `_composeY`. Only the horizontal half
   * was missing, which is why it read as an oversight rather than a choice.
   *
   * Same convergence discipline as the frame-share pass: the camera can only be
   * pushed outward, so an overshoot is permanent and comes straight off the
   * other fighter. Take 72% of the correction and approach the limit from below.
   */
  _frameBoth(p, at, fov, lo = 0.06, hi = 0.94) {
    for (let pass = 0; pass < 4; pass++) {
      const t = this._backOff(p, at, (s) => {
        const r = Math.max(0.2, s.rad);
        const y = s.aim.y + Math.max(0.3, s.top) * 0.55;
        let worst = 0;
        for (const w of [-1, 0, 1]) {
          _k[2].set(s.aim.x + U.x * r * w, y, s.aim.z + U.z * r * w);
          this._project(_k[2], p, at, fov, _k[4]);
          // Behind the lens reads as x = +/-9; treat it as maximally outside
          // rather than letting a huge number swamp the correction.
          const x = clamp(_k[4].x, -1, 2);
          const over = x < lo ? lo - x : (x > hi ? x - hi : 0);
          if (over > worst) worst = over;
        }
        if (worst <= 0.001) return 0;
        return _c1.distanceTo(p) * (1 + 0.72 * Math.min(worst / ((hi - lo) * 0.5), 3));
      });
      if (t < 0.02) break;
    }
    return p;
  }

  /**
   * Move `p` back along the view axis until it is at least `needOf(actor)`
   * from every actor. `_c1` is left holding the last actor's reference point,
   * which `_clearActors` reads back for the distance it just measured.
   */
  _backOff(p, at, needOf) {
    _c0.copy(at).sub(p);
    const L = _c0.length();
    if (!(L > 1e-4)) return 0;
    _c0.multiplyScalar(1 / L);                         // unit view direction
    let push = 0;
    for (let i = 0; i < 2; i++) {
      const s = this.act[i];
      // Reference point on the actor's standing volume, at the camera's own
      // height where possible: clearing a fighter overhead is legitimate,
      // being level with their chest at 40 cm is not.
      const hi = s.aim.y + Math.max(0.35, s.full);
      _c1.set(s.aim.x, clamp(p.y, s.aim.y + 0.05, hi), s.aim.z);
      const need = needOf(s);
      if (!(need > 0)) continue;
      _c2.copy(p).sub(_c1);
      const q2 = _c2.lengthSq();
      if (q2 >= need * need) continue;
      // Solve |(p - t·view) - c| = need for the smallest t ≥ 0. The camera is
      // inside the sphere, so the discriminant is always positive.
      const b = _c2.dot(_c0);
      const t = b + Math.sqrt(Math.max(0, b * b - q2 + need * need));
      if (t > push) push = t;
    }
    if (push > 1e-4) { push = Math.min(push, 60); p.addScaledVector(_c0, -push); return push; }
    return 0;
  }

  /**
   * Is anything in the arena standing between `from` and a fighter?
   * Returns how many of the two are hidden. Thin, see-through decoration does
   * not count; a Skypiea pillar does.
   *
   * Three heights, not one. A single chest ray scores a clean 0 while an
   * Onigashima pillar cuts the fighter in half vertically — measured at 50% of
   * the silhouette gone with this function reporting nothing wrong. A fighter
   * counts as hidden when two of its three samples are blocked, so a railing
   * across the shins is still allowed to be scenery.
   *
   * Meshes only. Rain is `LineSegments` and three raycasts lines against a
   * one-world-unit default threshold, so a ray that passes within a metre of a
   * raindrop registers a hit — a grid probe using the defaults reported all 32
   * fighters 100% occluded in all six arenas, in frames where the pixels show
   * them completely clear.
   */
  _blockedCount(from, scene) {
    let n = 0;
    for (let i = 0; i < 2; i++) {
      if (this._blockedOne(from, this.act[i], scene, this.act[1 - i])) n++;
    }
    return n;
  }

  /** Is this one fighter hidden from `from`? Two of three cross samples blocked. */
  _blockedOne(from, s, scene, ignore = null) {
    _ray.camera = this.cam;
    _ray.params.Line = { threshold: 0.001 };
    _ray.params.Points = { threshold: 0.001 };
    {
      const root = s?.ref?.root;
      if (!root) return false;
      const other = ignore?.ref?.root || null;
      const top = Math.max(0.4, s.top);
      // Sideways offset is taken perpendicular to the view ray, so the cross
      // spans the silhouette as the camera sees it rather than in world X.
      _c0.set(s.aim.x - from.x, 0, s.aim.z - from.z).normalize();
      const px = -_c0.z, pz = _c0.x, hw = Math.max(0.25, s.rad || 0.4);
      let blocked = 0;
      for (const [f, w] of LOS_PT) {
        _c1.copy(s.aim).setY(s.aim.y + top * f);
        if (w) { _c1.x += px * hw * w; _c1.z += pz * hw * w; }
        _c2.copy(_c1).sub(from);
        const d = _c2.length();
        if (!(d > 0.2)) continue;
        _ray.set(from, _c2.multiplyScalar(1 / d));
        _ray.near = 0.05; _ray.far = d - 0.25;
        let hits;
        try { hits = _ray.intersectObjects(scene.children, true); } catch { return 0; }
        for (const h of hits) {
          if (!h.object.isMesh) continue;
          const m = h.object.material;
          if (!h.object.visible || !m || m.opacity === 0) continue;
          if (m.transparent && m.opacity < 0.4) continue;
          // Skip both fighters, not just this one. An over-the-shoulder impact
          // shot puts the attacker in the foreground on purpose — measured at
          // 88% of the defender hidden behind `fighter:ace`, which is the shot
          // working, not failing. Counting it would make the search swing away
          // from correct framing.
          let o = h.object, mine = false;
          while (o) {
            if (o === root || o === other) { mine = true; break; }
            o = o.parent;
          }
          if (mine) continue;
          blocked++;
          break;
        }
      }
      return blocked >= 2;
    }
  }

  /**
   * Arena geometry does not care about our framing. Skypiea puts a stone
   * pillar a stride from a fighter slot, and from the natural resting angle it
   * hides that fighter outright — a frame that satisfies every size rule and
   * still shows the player nothing. So the resting shot may swing along its
   * own stand-off arc until both fighters are genuinely visible; the framing
   * is solved the same way from wherever it lands, and the offset it picks is
   * eased in rather than cut to, so the search is never something you see.
   *
   * Sampled a few times a second, never while blending, and biased hard toward
   * staying put: a camera that hunts is worse than one behind a pillar.
   */
  _seekView() {
    const scene = this._bind()?.scene;
    if (!scene || this.reduced) return;
    if (this.time - this._losAt < 0.7) return;
    this._losAt = this.time;
    const cur = this.cur.pos;
    const r = Math.hypot(cur.x - MID.x, cur.z - MID.z);
    if (!(r > 1.5)) return;
    const a0 = Math.atan2(cur.z - MID.z, cur.x - MID.x);
    let bestD = this._losYaw, bestN = 99;
    for (const d of LOS_TRY) {
      const ang = a0 + (d - this._losYaw);
      _c0.set(MID.x + Math.cos(ang) * r, cur.y, MID.z + Math.sin(ang) * r);
      if (sideOfAxis(_c0) < 1.0) continue;      // never cross the 180 line to see better
      const n = this._blockedCount(_c0, scene);
      if (n < bestN) { bestN = n; bestD = d; }
      if (n === 0) break;                       // first clear angle wins; 0 is tried first
    }
    this._losYaw = bestN >= 99 ? 0 : bestD;
  }

  /**
   * The fraction of frame height an actor's bounding box actually projects
   * into, from this pose — the same number the critic's harness measures, so
   * the budget and the verdict are computed the same way.
   */
  _projSpan(s, p, at, fov) {
    const r = Math.max(0.2, s.rad);
    const y1 = s.aim.y + Math.max(0.3, s.fullH);
    const y0 = s.aim.y + Math.min(0, s.loH);
    let lo = 1e9, hi = -1e9;
    for (let i = 0; i < 8; i++) {
      _k[3].set(s.aim.x + (i & 1 ? r : -r), (i & 2) ? y1 : y0, s.aim.z + (i & 4 ? r : -r));
      this._project(_k[3], p, at, fov, _k[4]);
      if (_k[4].z <= 0.05) return 9;                   // straddling the lens: as bad as it gets
      if (_k[4].y < lo) lo = _k[4].y;
      if (_k[4].y > hi) hi = _k[4].y;
    }
    // Six percent conservative. The box is sampled from a resting pose while
    // the fighter is breathing, shifting weight and swinging a club, so the
    // live silhouette runs a little larger than the one measured — and the
    // budget is a ceiling, which means erring outward is the cheap direction.
    return (hi - lo) * 1.06;
  }

  /* ---------------------------------------------------------------- */
  /* framing primitives                                                */
  /* ---------------------------------------------------------------- */

  /**
   * The two-shot, solved for the pair that is actually on the stage.
   *
   * `fillV` is the slice of frame height the *taller* fighter may occupy and
   * `fillH` the slice of width the pair spans — those two alone give the
   * classic centred two-shot, and for two roughly human fighters that is the
   * whole story and this returns exactly what it always did.
   *
   * It falls apart at the extremes. Fit a 8.8 m Big Mom into 55% of frame
   * height from the middle of the stage and a 0.9 m Chopper lands at 6%: an
   * unidentifiable smudge. One focal length at one distance cannot serve a
   * 10:1 size ratio — but *perspective* can. So when the smaller fighter drops
   * below `minFill` the camera slides around behind them and the lens opens
   * up, until the near fighter is readable and the far one still fits.
   *
   * The slide runs along the circle "exactly `fillV` tall around the bigger
   * fighter", so the height ceiling the critic measured cannot be broken by
   * getting closer — it is a constraint of the path, not a check afterwards.
   * Two bisections pick the least-deep point and the narrowest lens that do
   * the job, so a pair that barely needs help barely moves.
   */
  _twoShot(o) {
    const a = this.act[0], b = this.act[1];
    const tall = Math.max(a.full, b.full);
    const wide = SEP + a.halfW + b.halfW;
    const gk = this._giantK(tall);
    const bigIs1 = b.full > a.full;
    const big = bigIs1 ? b : a, small = bigIs1 ? a : b;
    const sgn = bigIs1 ? -1 : 1;              // axial direction toward the smaller fighter
    const fillH = o.fillH, minFill = o.minFill ?? 0;
    let fillV = o.fillV;

    // Giants get a lower camera and a flatter tilt — look up at them, not down.
    const elev = o.elev * (1 - 0.55 * gk) + (o.elev * 0.06);
    const pivotY = Math.min(tall * (o.pivot ?? 0.46), 1.05 + 0.26 * tall);
    const ce = Math.cos(elev);

    /** Stand-off from MID for the centred two-shot at a given lens. */
    const symStand = (f) => Math.min(REACH, ce * this._fitDist(tall / fillV, wide / fillH, f));
    /**
     * Camera foot on the "big fighter exactly `fillV` tall" circle, `n` out
     * from the fighter axis. Axial offset is measured toward the smaller
     * fighter; `fill` is that fighter's share of frame height from there and
     * `spanX` the slice of frame *width* the pair covers — coming closer buys
     * the small fighter height at the price of width, and off the end of that
     * trade both fighters simply leave the frame sideways.
     *
     * Both are monotone in `n` (dS² = dT² + SEP² − 2·dT·SEP·cosθ shrinks as
     * the camera swings in), which is what makes the bisections below legal.
     */
    const foot = (f, n) => {
      const tv = Math.tan(f * DEG * 0.5), th = tv * this.aspect;
      const dT = big.full / (2 * tv * fillV);
      const cu = Math.max(0, Math.sqrt(Math.max(0, dT * dT - n * n)) - SEP * 0.5);
      const dS = Math.max(0.5, Math.hypot(SEP * 0.5 - cu, n));
      const half = Math.abs(Math.atan2(SEP * 0.5 + small.halfW - cu, n)
        - Math.atan2(-(SEP * 0.5 + big.halfW) - cu, n)) * 0.5;
      return {
        cu, dS,
        fill: small.full / (2 * tv * dS),
        spanX: Math.tan(Math.min(half, 1.45)) / th
      };
    };

    // Closest the camera may ever come: outside the near fighter's body, off
    // the 180° line, and further out again when the pair is enormous.
    const nMin = Math.max(o.minSide ?? 1.6, small.halfW + 1.15 + 0.85 * small.scale) * (0.92 + 0.7 * gk);

    /** The camera position this lens implies. */
    const solve = (f, out) => {
      const hor = symStand(f);
      // The stand-off rides the circle "the bigger fighter is exactly `fillV`
      // tall", so closing in can never break the ceiling. `fill` falls off
      // with n and `spanX` rises, so the pair of bisections brackets the
      // shallowest camera that reads — and when the two disagree, width wins:
      // a fighter half out of frame is worse than a small one.
      const nMax = Math.max(nMin, hor);
      let nFill = nMax, nSpan = nMin;
      if (minFill > 0 && foot(f, nMax).fill < minFill) {
        let lo = nMin, hi = nMax;
        for (let i = 0; i < 14; i++) {
          const mid = (lo + hi) * 0.5;
          if (foot(f, mid).fill >= minFill) lo = mid; else hi = mid;
        }
        nFill = lo;
      }
      if (foot(f, nMin).spanX > fillH) {
        let lo = nMin, hi = nMax;
        for (let i = 0; i < 14; i++) {
          const mid = (lo + hi) * 0.5;
          if (foot(f, mid).spanX > fillH) lo = mid; else hi = mid;
        }
        nSpan = hi;
      }
      const n = clamp(Math.max(nFill, nSpan), nMin, nMax);
      const deep = nMax > nMin + 1e-3 ? clamp((nMax - n) / (nMax - nMin), 0, 1) : 0;
      // The three-quarter angle is a centred-shot luxury; a deep frame has
      // spent its lateral budget already, so the yaw fades as we swing in.
      // `swing` is not a luxury — it is the offset that gets a pillar out from
      // in front of a fighter — so it survives the fade.
      const yaw = (o.yaw || 0) * (1 - deep) + (o.swing || 0);
      const cyw = Math.cos(yaw), syw = Math.sin(yaw);
      const fu = sgn * foot(f, n).cu;
      // Height: the elevated centred look when we are centred, dropping toward
      // the smaller fighter's own eye line as the shot goes deep — from down
      // there the giant reads as a giant instead of as a wall.
      const symY = pivotY + Math.sin(elev) * (hor / Math.max(0.2, ce));
      const deepY = clamp(small.head.y * 0.9 + 0.06 * big.full, 0.8, 3.2);
      out.copy(MID).setY(lerp(symY, deepY, deep))
        .addScaledVector(N, n * cyw - fu * syw)
        .addScaledVector(U, fu * cyw + n * syw);
      return this._safe(out, o.minSide ?? 1.6);
    };

    // The lens only ever opens, and only for a reason: first so the pair fits
    // at all from inside the arena, then — if the smaller fighter is still a
    // smudge — as far as `fovMax` to buy back the perspective that makes them
    // readable. `foot(f, nMin).fill` rises with f, because a wider lens lets
    // the camera stand closer to everything and the near fighter gains far
    // more from that than the far one loses.
    let fov = o.fov;
    const fovMax = Math.max(fov, o.fovMax ?? fov);
    const reachFov = 2 * Math.atan(Math.max(tall / (2 * fillV * REACH),
      wide / (2 * fillH * REACH * this.aspect))) / DEG;
    fov = clamp(Math.max(fov, reachFov), fov, fovMax);
    if (minFill > 0 && fovMax > fov && foot(fov, nMin).fill < minFill) {
      if (foot(fovMax, nMin).fill < minFill) fov = fovMax;   // even wide open; take it all
      else {
        let lo = fov, hi = fovMax;
        for (let i = 0; i < 14; i++) {
          const mid = (lo + hi) * 0.5;
          if (foot(mid, nMin).fill >= minFill) hi = mid; else lo = mid;
        }
        fov = hi;
      }
    }

    const lead = a.full >= b.full ? a : b;
    const anchor = _a.copy(a.head).add(b.head).multiplyScalar(0.5)
      .setY((a.head.y + b.head.y) * 0.5);
    // Side 0 is always screen-left and side 1 screen-right, so the two feet
    // limits are different: below side 0 there is nothing but the text box,
    // while side 1 stands over the player's own name plate.
    const cons = [
      { v: _k[0].copy(lead.aim).setY(lead.top), min: 0.05 },     // never crop the tallest head
      { v: a.head, max: SAFE.y1 }, { v: b.head, max: SAFE.y1 },  // no head behind a plate
      { v: _k[1].copy(a.aim).setY(a.aim.y + 0.02), max: SAFE.dock },
      { v: _k[2].copy(b.aim).setY(b.aim.y + 0.02), max: 0.685 }
    ];
    const sx = o.sx ?? 0.5, sy = o.sy ?? 0.36;
    const p = solve(fov, new THREE.Vector3());
    let look = this._composeY(p, anchor, sx, sy, fov, cons, _lk);

    // Now check the answer against reality rather than against the estimate,
    // and against the *composed* frame rather than the raw aim — the tilt is
    // worth several percent of anyone's height. `full` predicts the projected
    // box well but not perfectly, and in a tight arena the camera can already
    // be pressed against the disc with nowhere left to retreat, in which case
    // the room has to be bought with the lens instead of with distance.
    for (let pass = 0; pass < 3; pass++) {
      const span = Math.max(this._projSpan(a, p, look, fov), this._projSpan(b, p, look, fov));
      if (span <= fillV * 1.03 || fov >= fovMax - 0.05) break;
      fov = Math.min(fovMax, 2 * Math.atan(Math.tan(fov * DEG * 0.5) * (span / fillV)) / DEG);
      solve(fov, p);
      look = this._composeY(p, anchor, sx, sy, fov, cons, _lk);
    }

    // And the ceiling is enforced, not merely aimed at: whatever the solve
    // above did, whatever the actors do next, and whatever `_safe` had to move
    // to keep the camera in the arena, nobody ends up taller than `fillV`.
    this._clearActors(p, look, fov, fillV);
    this._safe(p, o.minSide ?? 1.6);
    return pose(p, this._composeY(p, anchor, sx, sy, fov, cons), fov);
  }

  /**
   * Over-the-shoulder / impact framing. `near` is the foreground fighter,
   * the other is the subject. The lateral offset is *solved* so the near
   * shoulder lands at `nearX` and the far head at `farX`, which is also what
   * guarantees screen-left / screen-right stay correct at any body size.
   */
  _overShoulder(o) {
    const near = this.act[o.near], far = this.act[1 - o.near];
    _a.copy(far.aim).sub(near.aim); _a.y = 0;
    const sep = Math.max(1.5, _a.length());
    _a.multiplyScalar(1 / sep);                          // near → far, horizontal

    const back = o.back * (0.55 + 0.45 * near.scale) + 0.35;
    const dist = sep + back;
    // Frame only as much of a giant as a hero shot needs: head and chest.
    const shown = Math.min(far.top, 2.3 + 0.34 * far.top);
    let fov = 2 * Math.atan((shown / o.fill) / (2 * dist)) / DEG;
    fov = clamp(fov, o.fovMin ?? 20, o.fovMax ?? 52);

    const tv = Math.tan(fov * DEG * 0.5), th = tv * this.aspect;
    const wantDiff = (o.farX - o.nearX) * 2 * th;        // tan-space separation
    const sign = o.near === 0 ? 1 : -1;
    const lat = clamp(sign * wantDiff * back * dist / sep, 0.42, 8);

    const p = new THREE.Vector3().copy(near.aim)
      .addScaledVector(_a, -back)
      .addScaledVector(N, lat);
    // Eye line rides the near fighter's head, but a giant's eye line is not a
    // camera height: cap it so we still look slightly up at the far fighter.
    p.y = near.aim.y + Math.min(near.headH * (o.height ?? 0.95), 1.5 + 0.30 * near.headH) + (o.rise ?? 0);
    this._safe(p, o.minSide ?? 0.5);
    // A shoulder in the foreground is the point of the shot; a shoulder that
    // *is* the shot is the bug. `nearCap` is how much frame the near fighter
    // may own, and the camera backs off along its own axis until it holds.
    this._clearActors(p, far.head, fov, o.nearCap ?? 0.95);
    this._safe(p, o.minSide ?? 0.5);

    const cons = [
      { v: _k[0].copy(far.aim).setY(far.top), min: 0.04 },
      { v: far.head, min: SAFE.y0 - 0.05, max: 0.56 }
    ];
    const look = this._composeY(p, far.head, o.farX, o.sy ?? 0.37, fov, cons);
    return pose(p, look, fov);
  }

  /**
   * Single-fighter shot from the audience side. `yaw` swings toward the
   * fighter's own facing so we get a three-quarter *front* while the 180°
   * line — and therefore which way they face on screen — stays intact.
   */
  _single(o) {
    const s = this.act[o.side];
    const fov = o.fov;
    // `reach` lengthens the tracking leash for this shot only. A switch-in is
    // thrown in from seven metres outside its own slot, and a camera pinned to
    // the slot watches an empty patch of deck until the last third of the
    // beat. Following most of the way out — but not all of it, or the pan
    // becomes a whip — means the fighter is in frame for the whole arrival.
    let head = s.head;
    if (o.reach && s.ref?.root) {
      _e0.copy(s.ref.root.position).sub(s.home);
      const L = _e0.length();
      if (L > o.reach) _e0.multiplyScalar(o.reach / L);
      head = _e1.copy(s.home).add(_e0).setY(s.home.y + _e0.y * 0.5 + s.headH);
    }
    const shown = Math.min(s.top, 2.3 + 0.34 * s.top);
    const dist = this._fitDist(shown / o.fill, (s.halfW * 2 + 0.7) / (o.fillH ?? 0.45), fov);
    const gk = this._giantK(s.top);
    const yaw = (o.yaw ?? 0.55) * (o.side === 0 ? 1 : -1);
    const elev = o.elev * (1 - 0.5 * gk);
    const camY = Math.min(s.head.y * (o.pivot ?? 0.62), 1.35 + 0.30 * s.head.y);

    const place = (off) => {
      const y = yaw + off;
      const q = new THREE.Vector3().copy(s.aim).setY(camY)
        .addScaledVector(N, Math.cos(y) * Math.cos(elev) * dist)
        .addScaledVector(U, Math.sin(y) * Math.cos(elev) * dist);
      q.y += Math.sin(elev) * dist;
      this._safe(q, o.minSide ?? 1.2);
      // Clearance is measured against the slot, not against the tracked head:
      // the size budget projects a box that sits at `aim`, and aiming the test
      // four metres off it reads the box as huge and shoves the camera into the
      // next arena.
      this._clearActors(q, s.head, fov, o.nearCap ?? 1.0);
      this._safe(q, o.minSide ?? 1.2);
      return q;
    };

    // A shot of one fighter exists to show that fighter, and this one did not.
    // Measured by a critic recording every game frame: the `heroBig` push-in
    // put its own subject behind arena geometry in 72% of frames, with a
    // screenshot of a beige pillar filling the frame and neither fighter
    // visible. `_clearActors` cannot catch it — it measures how much of the
    // frame the subject *would* fill and how far away its body is, never
    // whether anything is in the way.
    const p = this._seeSubject(`single:${o.side}:${o.fov}`, s, place);

    const sx = o.sx ?? (o.side === 0 ? 0.40 : 0.60);
    const cons = [
      { v: _k[0].copy(s.aim).setY(s.top), min: 0.04 },
      { v: head, min: SAFE.y0 - 0.05, max: 0.56 }
    ];
    const look = this._composeY(p, head, sx, o.sy ?? 0.36, fov, cons);
    return pose(p, look, fov);
  }

  /* ---------------------------------------------------------------- */
  /* the shot library                                                  */
  /* ---------------------------------------------------------------- */

  /** Establishing: long lens, whole arena, both fighters small in the world. */
  _establish(push = 0) {
    return {
      id: 'establish', imp: 2, minHold: 1.0, subject: null,
      live: (t) => this._twoShot({
        fov: 33, fovMax: 56, fillV: 0.55, minFill: 0.10,
        fillH: 0.54 + Math.min(t, 2.5) * 0.035 + push * 0.06,
        elev: 0.30, yaw: -0.11, pivot: 0.46, sy: 0.34
      })
    };
  }

  /** The default two-shot: reads the board, still has depth. */
  _neutral() {
    return {
      id: 'neutral', imp: 1, minHold: 0.8, subject: null,
      live: () => this._twoShot({
        fov: 40, fovMax: 62, fillV: 0.56, minFill: 0.13, fillH: 0.74,
        elev: 0.215, yaw: -0.07, pivot: 0.46
      })
    };
  }

  /**
   * The resting shot — the frame the player actually spends the battle looking
   * at, and the one the director must be able to get back to from anywhere.
   *
   * It is a two-shot, deliberately: at a prompt you are reading the board, not
   * admiring a shoulder. This used to be an over-the-shoulder that sat ~30 cm
   * behind the player's own fighter, so every decision in the game was taken
   * blind. The only thing left of the commanding side is a few degrees of yaw
   * toward them and a hair more of their half of the stage — enough to feel
   * whose turn it is, nowhere near enough to lose the fight.
   *
   * It also barely moves: a very slow settle in over two seconds and nothing
   * else, because this is the frame a player stares at for ten seconds at a
   * time and drift reads as a fault.
   */
  _rest(side = 0) {
    const s = side === 1 ? 1 : 0;
    // Cached: while the battle waits, this is rebuilt every frame to keep it
    // re-framing, and there is no reason to allocate a closure each time.
    if (this._restShot && this._restShot.side === s) return this._restShot;
    this._restShot = {
      side: s,
      id: 'rest', imp: 1, minHold: 1.1, subject: null,
      live: (t) => this._twoShot({
        // 64 is measured, not chosen: past it the lens stops paying. Widening
        // shrinks the distance the size ceiling demands, but it also flattens
        // the angle the camera comes in at, and past ~64° the second effect
        // wins — Chopper measures *smaller* at 70° than at 64°.
        fov: 38, fovMax: 64,
        // 0.55 rather than 0.48: now that the ceiling is measured and enforced
        // exactly, every point of headroom given away here comes straight off
        // the smaller fighter, who has far less to spare.
        fillV: 0.55, minFill: 0.15,
        fillH: 0.735 - Math.min(t, 2.2) * 0.010,      // a very slow settle in
        elev: 0.205, yaw: s === 0 ? -0.10 : 0.10, swing: this._losEase, pivot: 0.46,
        // Heads a little below the upper third: the pair sits in the middle of
        // the glass instead of floating over a screenful of empty deck.
        sx: s === 0 ? 0.485 : 0.515, sy: 0.41, minSide: 1.8
      })
    };
    return this._restShot;
  }

  /**
   * Pick a yaw offset from which `s` is actually visible. `place(off)` builds
   * the camera position for that offset; the chosen offset is cached and
   * re-solved at most three times a second.
   *
   * The throttle has to live on the director, not on the shot's options object:
   * builders like `_hero` construct a fresh options object inside `live()`, so
   * a cache hung there is empty every frame and the search runs six raycast
   * sets per frame forever.
   */
  _seeSubject(key, s, place) {
    const p = place(0);
    const scene = this._bind()?.scene;
    if (!scene || this.reduced || !s?.ref?.root) return p;
    const c = this._see || (this._see = {});
    if (c.key !== key || this.time - (c.at ?? -99) >= 0.33) {
      c.key = key; c.at = this.time; c.off = 0;
      if (this._blockedOne(p, s, scene)) {
        for (const d of HERO_TRY) {
          if (!this._blockedOne(place(d), s, scene)) { c.off = d; break; }
        }
      }
    }
    return c.off ? place(c.off) : p;
  }

  /** Attacker hero shot — three-quarter front, slow push through the beat. */
  _hero(side, big) {
    return {
      id: big ? 'heroBig' : 'hero', imp: big ? 2 : 1, minHold: big ? 0.7 : 0.5, subject: side,
      live: (t) => this._single({
        side,
        fov: big ? 30 : 36,
        fill: (big ? 0.60 : 0.50) + Math.min(t, 0.9) * (big ? 0.09 : 0.05),   // the push
        fillH: 0.32,
        yaw: 0.62, elev: big ? 0.11 : 0.17,
        sx: side === 0 ? 0.38 : 0.62,
        sy: big ? 0.39 : 0.36,
        pivot: big ? 0.72 : 0.64
      })
    };
  }

  /** Follows the attack across the stage, arriving as it lands. */
  _track(side, dur) {
    const from = side, to = 1 - side;
    return {
      id: 'track', imp: 2, minHold: 0.45, subject: null,
      live: (t) => {
        const e = E.inOutQuad(clamp(t / Math.max(0.18, dur), 0, 1));
        const a = this.act[from], b = this.act[to];
        const tall = Math.max(a.top, b.top);
        const fov = 44;
        const dist = this._fitDist(tall / 0.50, (SEP * 0.66 + a.halfW + b.halfW) / 0.82, fov);
        const gk = this._giantK(tall);
        const s0 = (a.aim.x - MID.x) * U.x + (a.aim.z - MID.z) * U.z;
        const s1 = (b.aim.x - MID.x) * U.x + (b.aim.z - MID.z) * U.z;
        const elev = (0.20 - e * 0.05) * (1 - 0.5 * gk);
        const p = new THREE.Vector3().copy(MID)
          .addScaledVector(U, lerp(s0, s1, e) * 0.5)
          .setY(Math.min(tall * 0.45, 1.0 + 0.24 * tall))
          .addScaledVector(N, Math.cos(elev) * dist);
        p.y += Math.sin(elev) * dist;
        this._safe(p, 1.6);
        const anchor = _a.copy(a.head).lerp(b.head, e);
        this._clearActors(p, anchor, fov, 0.85);
        this._safe(p, 1.6);
        this._frameBoth(p, anchor, fov);
        this._safe(p, 1.6);
        const sx = lerp(from === 0 ? 0.34 : 0.66, to === 0 ? 0.32 : 0.68, e);
        const cons = [
          { v: _k[0].copy(b.aim).setY(b.top), min: 0.04 },
          { v: b.head, max: 0.56 }
        ];
        return pose(p, this._composeY(p, anchor, sx, 0.36, fov, cons), fov);
      }
    };
  }

  /** Impact: defender favoured, attacker held in the foreground, both legible. */
  _impact(defSide, power) {
    const atk = 1 - defSide;
    return {
      id: 'impact', imp: 2, minHold: 0.5, subject: defSide,
      live: (t) => this._overShoulder({
        near: atk, back: 1.35, nearCap: 0.84,
        fill: clamp(0.42 + power * 0.10, 0.38, 0.58),
        fovMin: 21, fovMax: 44,
        nearX: atk === 0 ? 0.11 : 0.89,
        farX: atk === 0 ? 0.62 : 0.38,
        height: 0.98, rise: 0.12 - Math.min(t, 0.4) * 0.16,
        sy: 0.37, minSide: 0.5
      })
    };
  }

  /** Low finisher: camera near the deck, long lens, the winner looms. */
  _finisher(defSide) {
    const atk = 1 - defSide;
    return {
      id: 'finisher', imp: 3, minHold: 1.25, subject: defSide,
      live: (t) => this._overShoulder({
        near: atk, back: 1.85, nearCap: 0.95,
        fill: 0.50, fovMin: 20, fovMax: 38,
        nearX: atk === 0 ? 0.10 : 0.90,
        farX: atk === 0 ? 0.60 : 0.40,
        height: 0.18, rise: 0.30 + Math.min(t, 1.4) * 0.10,
        sy: 0.42, minSide: 0.5
      })
    };
  }

  /** KO: settle on the fallen fighter with the winner standing behind them. */
  _ko(side) {
    return {
      id: 'ko', imp: 3, minHold: 0.9, subject: side,
      live: (t) => {
        const s = this.act[side], w = this.act[1 - side];
        const fov = 36;
        const dist = this._fitDist(Math.max(1.5, s.top) / 0.46, (s.halfW * 2 + 2.4) / 0.60, fov)
          * (1 + Math.min(t, 1.6) * 0.05);                   // gentle drift out
        // Sit behind the fallen fighter so the winner stays in the background.
        const yaw = (side === 0 ? -1 : 1) * 0.42;
        const elev = 0.23;
        const anchor = _a.copy(s.aim).setY(Math.max(s.head.y, 0.5 * s.scale));
        // Same swing as the hero shots. The KO is the one beat in a battle
        // nobody should have to guess at, and it was the worst offender
        // measured — the fallen fighter behind arena geometry in 77% of frames.
        const place = (off) => {
          const y = yaw + off;
          const q = new THREE.Vector3().copy(s.aim).setY(Math.min(Math.max(0.8, s.head.y * 0.7), 3.2))
            .addScaledVector(N, Math.cos(y) * Math.cos(elev) * dist)
            .addScaledVector(U, Math.sin(y) * Math.cos(elev) * dist);
          q.y += Math.sin(elev) * dist;
          this._safe(q, 1.2);
          this._clearActors(q, anchor, fov, 0.9);
          this._safe(q, 1.2);
          return q;
        };
        const p = this._seeSubject(`ko:${side}`, s, place);
        const cons = [{ v: _k[0].copy(w.aim).setY(w.head.y), min: 0.055, max: 0.56 }];
        const sx = side === 0 ? 0.30 : 0.70;
        return pose(p, this._composeY(p, anchor, sx, 0.46, fov, cons), fov);
      }
    };
  }

  /**
   * Entrance: the fighter lands into a low three-quarter.
   *
   * A switch-in throws the model in from ~7 m outside its own slot, so the
   * shot is composed around the *lane*, not the landing spot: the fighter is
   * placed off-centre toward the middle of the stage, leaving the outside of
   * the frame for them to fly through, and the frame closes in as they land
   * rather than opening out after they have already arrived.
   */
  _entrance(side) {
    return {
      id: 'entrance', imp: 2, minHold: 0.7, subject: side,
      live: (t) => this._single({
        side, fov: 40, reach: 4.2,
        fill: 0.38 + Math.min(t, 0.9) * 0.09,
        fillH: 0.30,
        yaw: 0.50, elev: 0.09 + Math.min(t, 0.8) * 0.05,
        sx: side === 0 ? 0.60 : 0.40, sy: 0.37, pivot: 0.68
      })
    };
  }

  /** Slow orbit for a two-turn charge — the one shot that keeps moving. */
  _charge(side) {
    return {
      id: 'charge', imp: 2, minHold: 1.4, subject: side,
      live: (t) => {
        const s = this.act[side];
        const fov = 34;
        const shown = Math.min(s.top, 2.3 + 0.34 * s.top);
        const dist = this._fitDist(shown / 0.56, (s.halfW * 2 + 1.0) / 0.38, fov);
        const dirSign = side === 0 ? 1 : -1;
        const gk = this._giantK(s.top);
        const yaw = clamp((0.30 + t * 0.055) * dirSign + Math.sin(t * 0.5) * 0.10 * dirSign, -1.05, 1.05);
        const elev = (0.16 + Math.sin(t * 0.42) * 0.025) * (1 - 0.5 * gk);
        const p = new THREE.Vector3().copy(s.aim).setY(Math.min(s.head.y * 0.62, 1.35 + 0.30 * s.head.y))
          .addScaledVector(N, Math.cos(yaw) * Math.cos(elev) * dist)
          .addScaledVector(U, Math.sin(yaw) * Math.cos(elev) * dist);
        p.y += Math.sin(elev) * dist;
        this._safe(p, 1.2);
        this._clearActors(p, s.head, fov, 0.95);
        this._safe(p, 1.2);
        const cons = [{ v: _k[0].copy(s.aim).setY(s.top), min: 0.04 }, { v: s.head, max: 0.56 }];
        return pose(p, this._composeY(p, s.head, side === 0 ? 0.40 : 0.60, 0.35, fov, cons), fov);
      }
    };
  }

  /** Victory: winner centred, slow push in. */
  _victory(side) {
    return {
      id: 'victory', imp: 3, minHold: 2.0, subject: side,
      live: (t) => this._single({
        side, fov: 30,
        fill: 0.48 + Math.min(t, 2.6) * 0.03,
        fillH: 0.32,
        yaw: 0.48, elev: 0.13,
        sx: side === 0 ? 0.44 : 0.56, sy: 0.36, pivot: 0.68
      })
    };
  }

  /* ---------------------------------------------------------------- */
  /* shot discipline                                                   */
  /* ---------------------------------------------------------------- */

  get _minShot() { return 0.62 / clamp(this.speed, 1, 3); }

  /**
   * Ask for a shot. Denied — in favour of a moving hold — while the current
   * shot is still young and the new beat is no more important than it.
   */
  _request(shot, o = {}) {
    if (this.reduced) {
      // Reduced motion: the shot change *is* the jarring part, so there is no
      // point softening the ones we keep. Everything collapses onto the two
      // calm framings, and every move between them is a long glide, never a cut.
      shot = shot.id === 'establish' ? this._establish(0) : this._rest(0);
      o = { ...o, dur: Math.max(o.dur ?? 0.5, REDUCED_BLEND), ease: E.glide, mode: 'arc' };
      // Already there: keep re-framing rather than restarting the blend.
      if (this.shot && this.shot.id === shot.id) { this.shot = shot; return false; }
      // Toggled on mid-battle from a shot reduced motion would never pick:
      // shot discipline must not be allowed to keep us there.
      if (this.shot && this.shot.id !== 'rest' && this.shot.id !== 'establish') o.force = true;
    }
    const cur = this.shot;
    if (cur && !o.force) {
      const minHold = Math.max(this._minShot, Math.min(cur.minHold, 1.4) / clamp(this.speed, 1, 3));
      if (this.shotAge < minHold && shot.imp <= cur.imp) return false;
      if (shot.id === cur.id && shot.imp < 3 && this.shotAge < 3.0) {
        this.shot = shot;   // same shot: let it keep re-framing rather than restart
        return false;
      }
    }

    this.from.pos.copy(this.cur.pos);
    this.from.look.copy(this.cur.look);
    this.from.fov = this.cur.fov;

    let dur = o.dur ?? 0.5;
    if (dur > 0) dur = Math.max(0.11, dur / clamp(this.speed, 1, 2.5));
    // A blend too short to read as a move but too long to read as a cut is the
    // worst of both. Snap it to a real cut.
    if (dur > 0 && dur < 0.10) dur = 0;

    this.shot = shot;
    this.shotStart = this.time;
    this.shotAge = 0;
    this.blend = dur <= 0 ? 1 : 0;
    this.blendTime = Math.max(1e-4, dur);
    this.ease = o.ease || E.glide;
    this.blendMode = o.mode || 'arc';
    this.seq++;
    this.marks.push({ seq: this.seq, id: shot.id, t: +this.time.toFixed(3), cut: dur <= 0, imp: shot.imp });
    if (this.marks.length > 500) this.marks.shift();
    if (dur <= 0) {
      const np = shot.live(0);
      this.cur.pos.copy(np.pos); this.cur.look.copy(np.look); this.cur.fov = np.fov;
    }
    return true;
  }

  /** Bias the current shot toward a point without cutting. */
  nudge(point, strength = 1) {
    this.attn.p.copy(point);
    this.attn.k = clamp(strength, 0, 1) * (this.reduced ? 0.4 : 1);
    this.attn.w = Math.max(this.attn.w, 0.001);
  }

  /** Schedule a follow-up shot `delay` seconds from now. */
  _later(delay, shot, o) { this.pending = { at: this.time + delay, shot, o }; }

  /* ---------------------------------------------------------------- */
  /* public knobs                                                      */
  /* ---------------------------------------------------------------- */

  cut(shot) { this.go(shot, 0); }

  /** Legacy entry point: a name in SHOTS, a builder id, or a {pos,look,fov}. */
  go(shot, seconds = 0.55, ease = E.glide) {
    let s = null;
    if (typeof shot === 'string') {
      const side = /B$/.test(shot) ? 1 : 0;
      const base = shot.replace(/[AB]$/, '');
      const map = {
        wide: () => this._establish(), establish: () => this._establish(),
        standard: () => this._neutral(), neutral: () => this._neutral(),
        command: () => this._rest(0), rest: () => this._rest(0),
        hero: () => this._hero(side, false),
        low: () => this._finisher(1 - side),
        impact: () => this._impact(side, 0.5),
        finisher: () => this._finisher(side),
        ko: () => this._ko(side),
        entry: () => this._entrance(side), entrance: () => this._entrance(side),
        charge: () => this._charge(side),
        track: () => this._track(side, 0.5),
        victory: () => this._victory(side)
      };
      if (map[base]) s = map[base]();
      else if (SHOTS[shot]) {
        const st = SHOTS[shot];
        s = { id: shot, imp: 2, minHold: 0.6, subject: null,
          live: () => pose(st.pos.clone(), st.look.clone(), st.fov ?? 42) };
      }
    } else if (shot && shot.pos) {
      s = { id: shot.id || 'custom', imp: shot.imp ?? 2, minHold: 0.6, subject: null,
        live: () => pose(shot.pos.clone(), shot.look.clone(), shot.fov ?? 42) };
    }
    if (!s) return false;
    return this._request(s, { dur: seconds, ease, force: true });
  }

  shotFor(base, side) { return base + (side === 0 ? 'A' : 'B'); }

  /**
   * Push the camera in briefly, e.g. on a critical hit. `amount` is the whole
   * size of the push — the impact tiers pass 0.20 / 0.30 / 0.40 and a lethal
   * blow 0.50, and they must read as four different hits, so `update()`
   * multiplies the decay curve by it rather than by a constant.
   */
  punch(amount = 0.35, seconds = 0.18) {
    if (this.reduced) return;
    this.dolly = amount; this._dollyAmp = amount;
    this._dollyT = seconds; this._dollyMax = seconds;
  }

  /** Widen (or tighten) the lens hard and let it fall back. Stands in for blur. */
  fovKick(amp = 8, seconds = 0.26) {
    if (this.reduced) return;
    this._kick = { t: 0, dur: seconds, amp };
  }

  /**
   * Freeze deliberate camera movement while the screen is shaking, so the two
   * do not fight each other. The only motion during a hold is the one move the
   * director already committed to, and even that crawls.
   */
  holdShake(seconds = 0.26, delay = 0) {
    if (delay > 0) this._holdAt = { at: this.time + delay, s: seconds };
    else this.shakeHold = Math.max(this.shakeHold, seconds);
  }

  /* ---------------------------------------------------------------- */
  /* the event stream                                                  */
  /* ---------------------------------------------------------------- */

  /**
   * Called by BattleView for every battle event, before the event's own beat.
   * @param {object} ev   the BattleEvent
   * @param {object} ctx  { big, crit, lethal, speed, reduced }
   */
  onEvent(ev, ctx = {}) {
    if (!ev) return;
    if (ctx.reduced !== undefined) this.reduced = !!ctx.reduced;
    this.speed = clamp(ctx.speed || 1, 0.25, 8);
    this._idle = 0;
    this._commanded = false;
    const side = ev.side ?? 0;

    switch (ev.t) {
      case 'battleStart': {
        this._opening = true;
        this.intensity = 0.14;
        this.hpFrac = [1, 1];
        this._turn = { first: null, prevFirst: null, movers: 0 };
        this._lastDamage = null;
        this.pending = null;
        this.attn.w = 0; this.attn.k = 0;
        this._request(this._establish(0), { dur: 0, force: true });
        break;
      }

      case 'switchIn': {
        this._noteSpecies(side, ev.speciesId);
        if (ev.maxHp) this.hpFrac[side] = ev.hp / ev.maxHp;
        // The opening sends both leads out back to back; two entrance cuts in
        // 200 ms is a strobe, so the opening stays on one slowly opening wide.
        if (this._opening) { this._request(this._establish(1), { dur: 1.2, ease: E.glide, force: true }); break; }
        this._request(this._entrance(side), { dur: 0, ease: E.snap });
        break;
      }

      case 'switchOut':
        this._request(this._neutral(), { dur: 0.55, ease: E.glide });
        break;

      case 'turnStart': {
        this._opening = false;
        this._turn.prevFirst = this._turn.first;
        this._turn.first = null;
        this._turn.movers = 0;
        // No cut here. The command framing we are already sitting in is the
        // right place to open a turn from; only a stale shot needs rescuing.
        if (this.shot && (this.shot.id === 'ko' || this.shot.id === 'finisher' || this.shot.id === 'victory')) {
          this._request(this._neutral(), { dur: 0.85, ease: E.glide, force: true });
        }
        break;
      }

      case 'moveUsed': {
        const mv = getMove(ev.moveId);
        const big = !!ctx.big;
        const prio = mv?.priority || 0;
        const first = this._turn.movers === 0;
        this._turn.movers++;
        if (first) this._turn.first = side;

        // Priority reversal: someone cut in ahead of the expected order.
        const reversed = first && this._turn.prevFirst !== null && this._turn.prevFirst !== side;
        if (first && prio > 0 && (reversed || prio >= 4)) {
          this.fovKick(11, 0.32);
          this._request(this._hero(side, true), { dur: 0.24, ease: E.whip, mode: 'arc', force: true });
          this.intensity = Math.min(1, this.intensity + 0.25);
          break;
        }

        if (mv?.category === 'status') {
          // Nothing is going to land. Lean toward the user, do not cut.
          this.nudge(this.act[side].head, 0.8);
          this._request(this._neutral(), { dur: 0.7, ease: E.glide });
          break;
        }

        const shape = (ev.fx || mv?.fx || {}).shape;
        const ranged = shape === 'beam' || shape === 'arc' || shape === 'burst';
        if (ranged) this._request(this._track(side, big ? 0.60 : 0.42), { dur: big ? 0.34 : 0.26, ease: E.glide });
        else if (big) this._request(this._hero(side, true), { dur: 0.42, ease: E.glide });
        else this._request(this._hero(side, false), { dur: 0.30, ease: E.outQuart });
        break;
      }

      case 'prepare':
        this._request(this._charge(side), { dur: 0.9, ease: E.glide });
        break;

      case 'damage': {
        const maxHp = Math.max(1, ev.maxHp || 1);
        const frac = (ev.amount || 0) / maxHp;
        this.hpFrac[side] = (ev.hpAfter || 0) / maxHp;
        const power = clamp(frac * 2.4 + (ev.crit ? 0.35 : 0) + (ev.eff > 1 ? 0.25 : 0), 0, 1);
        this.intensity = clamp(Math.max(this.intensity, 0.25 + power * 0.7), 0, 1);
        this._lastDamage = { side, eff: ev.eff ?? 1, crit: !!ev.crit, lethal: ev.hpAfter === 0, power };

        if (ev.hpAfter === 0) {
          // The blow that ends it gets the low angle, and gets to keep it.
          this._request(this._finisher(side), { dur: 0.16, ease: E.snap, mode: 'linear', force: true });
          this.punch(0.5, 0.30);
          this.holdShake(0.42, 0.16);
        } else {
          const dur = power > 0.5 ? 0 : 0.14;
          this._request(this._impact(side, power), { dur, ease: E.snap, mode: 'linear' });
          if (ev.crit) { this.punch(0.55, 0.24); this.fovKick(-4, 0.22); }
          else if (power > 0.35) this.punch(0.3, 0.2);
          this.holdShake(0.16 + power * 0.24, dur);
        }
        break;
      }

      case 'heal': case 'itemUse': case 'ability': case 'statusApply':
      case 'statusCure': case 'volatileStart': case 'boost': {
        if (ev.failed) break;
        // Small beats never earn a cut. Lean the frame toward whoever it is.
        this.nudge(this.act[side].head, 0.9);
        const stale = !this.shot || this.shot.id === 'ko' || this.shot.id === 'finisher' || this.shot.id === 'charge';
        if (stale) this._request(this._neutral(), { dur: 0.7, ease: E.glide });
        break;
      }

      case 'cannotMove':
        this.nudge(this.act[side].head, 1);
        this._request(this._hero(side, false), { dur: 0.45, ease: E.glide });
        break;

      case 'miss':
        // `ev.side` is the attacker here; the dodge belongs to the other one.
        this.nudge(this.act[1 - side].head, 1);
        this._request(this._neutral(), { dur: 0.36, ease: E.outQuart });
        break;

      case 'weather': case 'terrain':
        if (ev.phase === 'start') this._request(this._establish(0), { dur: 0.9, ease: E.glide });
        break;

      case 'faint': {
        const d = this._lastDamage;
        const superKo = d && d.side === side && (d.eff > 1 || d.crit);
        const last = this._lastFighterDown();

        if (superKo) {
          // Hold the low angle. A super-effective KO is the shot of the match.
          this._request(this._finisher(side), { dur: 0.18, ease: E.snap, force: true });
          this.holdShake(0.5);
          if (last) this._later(1.15, this._establish(0), { dur: 1.3, ease: E.glide, force: true });
          else this._later(1.05, this._ko(side), { dur: 0.7, ease: E.settle, force: true });
        } else if (last) {
          // Board state matters more than the body: pull back and show it.
          this._request(this._ko(side), { dur: 0.24, ease: E.snap, force: true });
          this._later(0.7, this._establish(0), { dur: 1.25, ease: E.glide, force: true });
        } else {
          this._request(this._ko(side), { dur: 0.30, ease: E.settle, force: true });
        }
        this.intensity = clamp(this.intensity + 0.3, 0, 1);
        break;
      }

      case 'battleEnd': {
        const w = ev.winner === 'draw' ? 0 : ev.winner;
        this.pending = null;
        this._request(this._establish(0), { dur: 0.6, ease: E.glide, force: true });
        this._later(0.9, this._victory(w), { dur: 1.5, ease: E.glide, force: true });
        this.intensity = 0.2;
        break;
      }

      default: break;
    }
  }

  /** Is a battleEnd queued behind this faint? (needs the view binding) */
  _lastFighterDown() {
    const q = this._bind()?.queue;
    if (!q || !q.length) return false;
    for (let i = 0; i < Math.min(q.length, 16); i++) if (q[i].t === 'battleEnd') return true;
    return false;
  }

  /* ---------------------------------------------------------------- */
  /* per-frame                                                         */
  /* ---------------------------------------------------------------- */

  _lerpPose(from, to, e, mode, out) {
    if (mode === 'linear') {
      out.pos.lerpVectors(from.pos, to.pos, e);
    } else {
      // Blend *around* the stage instead of straight through it: a dolly that
      // cuts across the arena centre reads as a mistake.
      const a0 = Math.atan2(from.pos.z - MID.z, from.pos.x - MID.x);
      const a1 = Math.atan2(to.pos.z - MID.z, to.pos.x - MID.x);
      let da = a1 - a0;
      while (da > Math.PI) da -= Math.PI * 2;
      while (da < -Math.PI) da += Math.PI * 2;
      const r0 = Math.hypot(from.pos.x - MID.x, from.pos.z - MID.z);
      const r1 = Math.hypot(to.pos.x - MID.x, to.pos.z - MID.z);
      const ang = a0 + da * e, r = lerp(r0, r1, e);
      out.pos.set(MID.x + Math.cos(ang) * r, lerp(from.pos.y, to.pos.y, e), MID.z + Math.sin(ang) * r);
    }
    out.look.lerpVectors(from.look, to.look, e);
    out.fov = lerp(from.fov, to.fov, e);
    return out;
  }

  update(dt) {
    if (!isFinite(dt) || dt < 0) dt = 0;
    dt = Math.min(dt, 0.1);
    this.time += dt;
    this.shotAge += dt;
    this._sample(Math.max(dt, 1e-4));

    if (this._holdAt && this.time >= this._holdAt.at) {
      this.shakeHold = Math.max(this.shakeHold, this._holdAt.s);
      this._holdAt = null;
    }
    if (this.shakeHold > 0) this.shakeHold = Math.max(0, this.shakeHold - dt);

    if (this.pending && this.time >= this.pending.at) {
      const p = this.pending; this.pending = null;
      this._request(p.shot, p.o);
    }

    // ---- come home ----
    // Whenever the battle stops moving, the camera returns to the resting
    // two-shot. `v.beat` never existed — BattleView keeps `beats`, plural — so
    // this test used to read "the event queue is empty", which is also true in
    // the middle of a switch-in or an attack animation. That is how the
    // director came to abandon a fighter mid-arrival and sit on empty floor.
    const v = this._bind();
    if (v?.feel) this.reduced = !!v.feel.reduced;   // live, not only on the next event
    const busy = v ? ((v.queue?.length || 0) > 0 || (v.gate || 0) > 0
      || (v.beats ? v.beats.some((b) => b.blocking) : false)) : true;
    const waiting = !!v && !busy;
    let asked = null;
    if (waiting) {
      try { const w = globalThis.__ARENA?.battle?.waitingFor?.(); if (w === 0 || w === 1) asked = w; } catch { /* ignore */ }
      // The opening sweep owns the frame right up until the game asks for
      // something — and then it does not, because turn 0 is a decision like
      // any other and gets the same frame to make it from.
      if (asked !== null) this._opening = false;
    }
    if (waiting && !this._opening) {
      this._idle += dt;
      const cs = asked ?? 0;
      if (this.shot?.id === 'rest') {
        this.shot = this._rest(cs);       // already home: keep re-framing, never restart
        this._commanded = true;
        if (this.blend >= 1) this._seekView();
      } else if (asked !== null || this._idle > 0.35) {
        // The politeness delay is for a lull *inside* a turn, where pulling the
        // camera home would cut the action short. Once the game has actually
        // asked the player to choose there is nothing left to be polite to —
        // every beat has finished, the queue is empty, and the only thing still
        // on screen is the aftermath pose of the last hit. Waiting another
        // 0.35s plus a one-second glide meant the menu came up while the camera
        // was still buried in the previous action: measured 7 of 8 command
        // prompts with a fighter hidden, offscreen, or behind its opponent's
        // shoulder, which is the one frame the player actually has to plan from.
        //
        // The shot's own minimum hold is deliberately NOT respected here, which
        // was worth measuring rather than assuming. Waiting it out looks correct
        // — a KO has earned its beat — but the beat already happened: `waiting`
        // requires the queue drained and every blocking beat finished, so the
        // hold only delays the departure. Gating on it made the camera settle
        // fully on the action shot and *then* start moving, which is the exact
        // pattern the critic caught. Measured: 4 of 7 prompts mid-blend with the
        // gate, against 6 of 8 already arrived without it.
        //
        // `_commanded` is deliberately not a latch. If anything knocks the frame
        // off the resting shot while the game is still waiting, this comes back
        // for it rather than leaving the player looking at scenery.
        const insist = asked !== null || this._idle > 0.95 || this._commanded;
        // One forced request lands us on `rest`; from the next frame the branch
        // above takes over and keeps re-framing, so this never restarts a blend
        // it already started.
        this._request(this._rest(cs), { dur: insist ? 0.55 : 1.05, ease: E.glide, force: insist });
        this._commanded = true;
      }
    } else if (!waiting) { this._idle = 0; this._commanded = false; this._losYaw = 0; }
    // The swing is always eased, never cut — including back to zero when the
    // action starts and the resting shot hands the frame over.
    this._losEase += (this._losYaw - this._losEase) * (1 - Math.exp(-dt * 2.4));

    // Intensity relaxes toward a floor set by how close the battle is.
    const floor = 0.10 + (1 - Math.min(this.hpFrac[0], this.hpFrac[1])) * 0.28;
    this.intensity += (floor - this.intensity) * (1 - Math.exp(-dt * 0.9));
    this.intensity = clamp(this.intensity, 0, 1);

    // ---- evaluate the live shot, then blend toward it ----
    const tgt = this.shot ? this.shot.live(this.shotAge) : this.cur;
    if (this.blend < 1) {
      const rate = this.shakeHold > 0 ? 0.2 : 1;   // shake owns the frame
      this.blend = Math.min(1, this.blend + (dt * rate) / this.blendTime);
      this._lerpPose(this.from, tgt, this.ease(this.blend), this.blendMode, this.cur);
    } else if (tgt !== this.cur) {
      this.cur.pos.copy(tgt.pos); this.cur.look.copy(tgt.look); this.cur.fov = tgt.fov;
    }

    // ---- moving hold: bias the look toward whatever just happened ----
    if (this.attn.w > 0) {
      this.attn.w = Math.min(1, this.attn.w + dt * 3.4);
      this.cur.look.lerp(this.attn.p, 0.22 * this.attn.w * this.attn.k);
      this.attn.k = Math.max(0, this.attn.k - dt * 0.85);
      if (this.attn.k <= 0) this.attn.w = 0;
    }

    if (this._dollyT > 0) {
      this._dollyT = Math.max(0, this._dollyT - dt);
      const p = this._dollyT / this._dollyMax;
      this.dolly = this._dollyAmp * p * p;
    } else this.dolly = 0;

    let fov = this.cur.fov;
    if (this._kick) {
      this._kick.t += dt;
      const p = this._kick.t / this._kick.dur;
      if (p >= 1) this._kick = null;
      else fov += this._kick.amp * Math.sin(p * Math.PI) * (1 - p * 0.35);
    }
    fov = clamp(fov, 12, 70);

    // ---- assemble ----
    _a.copy(this.cur.look).sub(this.cur.pos);
    const dist = Math.max(0.4, _a.length());
    _a.multiplyScalar(1 / dist);
    const p = _b.copy(this.cur.pos).addScaledVector(_a, this.dolly * Math.min(3.2, dist * 0.22));

    // ---- handheld: scales with battle intensity, silent while shaking ----
    // Reduced motion turns it off outright: a camera that never stops moving is
    // exactly what the setting exists to remove.
    if (this.shakeHold <= 0 && !this.reduced) {
      this.noiseT += dt * (0.55 + this.intensity * 1.5);
      const amp = dist * (0.0016 + this.intensity * 0.0050);
      _q0.set(-_a.z, 0, _a.x).normalize();
      _q1.crossVectors(_q0, _a).normalize();
      p.addScaledVector(_q0, fbm(this.noiseT) * amp * 1.15);
      p.addScaledVector(_q1, fbm(this.noiseT + 41.3) * amp);
      p.addScaledVector(_a, fbm(this.noiseT + 88.1) * amp * 0.5);
    }

    this._safe(p, 0.42);
    // Last line of defence, after blends, punches, kicks and handheld have all
    // had their say: whatever the shots asked for, the rendered camera is never
    // inside a fighter and nobody ever renders taller than the frame. A blend
    // between two legal poses can pass through an actor, and a crit punch adds
    // a metre of dolly on top of an over-the-shoulder that was already tight —
    // and those are exactly the frames a screenshot lands on.
    this._clearActors(p, this.cur.look, fov, 1.05);
    this._safe(p, 0.42);

    this._base.copy(p);
    this.cam.userData.basePos = this._base;
    this.cam.position.copy(p);
    this.cam.lookAt(this.cur.look);
    if (Math.abs(this.cam.fov - fov) > 0.005) {
      this.cam.fov = fov;
      this.cam.updateProjectionMatrix();
    }
    this._fovOut = fov;
  }

  /* ---------------------------------------------------------------- */
  /* diagnostics — used by tools/camerasheet.mjs                       */
  /* ---------------------------------------------------------------- */

  diag() {
    const fov = this._fovOut ?? this.cam.fov;
    const cp = this.cam.position;
    const out = {
      seq: this.seq, shot: this.shot?.id || null, age: +this.shotAge.toFixed(2), fov: +fov.toFixed(1),
      reduced: this.reduced, dolly: +this.dolly.toFixed(3),
      camY: +cp.y.toFixed(2), side: +sideOfAxis(cp).toFixed(2),
      intensity: +this.intensity.toFixed(2), shakeHold: +this.shakeHold.toFixed(2),
      heights: [+this.act[0].h.toFixed(2), +this.act[1].h.toFixed(2)],
      tops2: [+this.act[0].top.toFixed(2), +this.act[1].top.toFixed(2)],
      fulls: [+this.act[0].full.toFixed(2), +this.act[1].full.toFixed(2)],
      halfW: [+this.act[0].halfW.toFixed(2), +this.act[1].halfW.toFixed(2)],
      heads: [], tops: [], feet: [], problems: []
    };
    const t = new THREE.Vector3();
    for (let i = 0; i < 2; i++) {
      const s = this.act[i];
      const h = this._project(s.head, cp, this.cur.look, fov, new THREE.Vector3());
      const tp = this._project(t.copy(s.aim).setY(s.top), cp, this.cur.look, fov, new THREE.Vector3());
      const ft = this._project(t.copy(s.aim).setY(0.02), cp, this.cur.look, fov, new THREE.Vector3());
      out.heads.push({ x: +h.x.toFixed(3), y: +h.y.toFixed(3), z: +h.z.toFixed(2) });
      out.tops.push(+tp.y.toFixed(3));
      out.feet.push(+ft.y.toFixed(3));
    }
    if (out.side < 0.3) out.problems.push(`camera crossed the 180 line (${out.side})`);
    if (out.camY < 0.45) out.problems.push(`camera below deck (${out.camY})`);

    const subj = this.shot?.subject;
    const check = subj == null ? [0, 1] : [subj];
    for (const i of check) {
      const h = out.heads[i];
      if (h.z <= 0) { out.problems.push(`head ${i} behind camera`); continue; }
      if (h.x < SAFE.x0 || h.x > SAFE.x1) out.problems.push(`head ${i} x=${h.x}`);
      if (h.y < SAFE.y0 - 0.04 || h.y > SAFE.y1) out.problems.push(`head ${i} y=${h.y}`);
      if (out.tops[i] < 0.0) out.problems.push(`fighter ${i} cropped at top (${out.tops[i]})`);
    }
    if (out.heads[0].z > 0 && out.heads[1].z > 0 && out.heads[0].x > out.heads[1].x - 0.02) {
      out.problems.push('screen sides swapped');
    }
    return out;
  }
}
