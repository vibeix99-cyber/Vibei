// Move effects. Owned by the VFX agent.
//
// ── How this file is organised ─────────────────────────────────────────────
//
//   1. Shared resources — textures, geometries and a material pool. Nothing
//      per-effect is allocated that can be borrowed instead.
//   2. Primitives — ~10 Effect classes (points, instanced swarms, ribbons,
//      rings, beams, travelling bodies). Everything else is built from these.
//   3. Families — parameterised recipes (slash, flame, ice, lightning, sound,
//      shadow, haki, beam, …). A family always has three acts: wind-up, strike,
//      settle. The settle layer (embers, steam, shards, scorch) deliberately
//      outlives the beat it belongs to.
//   4. The registry — `fx.key` → family instance. Dispatch is key-first, then
//      the move's type, then the five original generic shapes as a last resort,
//      so a move that lands before its effect does still animates.
//
// ── Rules this file must never break ───────────────────────────────────────
//
//   * Every buffer length is an integer. A fractional particle count makes an
//     undersized buffer whose tail reads NaN and poisons the bounding sphere.
//     Counts go through `int()`, and every fx object sets frustumCulled = false
//     so three never computes a bounding sphere for them at all.
//   * Nothing may print to the console. A bad key falls back; it never throws.
//   * Materials are pooled and returned on dispose; per-effect geometries are
//     disposed; shared geometries and textures are not (they are reused for the
//     life of the page and released by `clear(true)`).
//   * The live draw-call cost is bounded — the oldest effects are evicted when
//     the budget is exceeded, so a 5-hit move cannot run the frame off a cliff.

import * as THREE from 'three';
import { Ease, clamp01 } from './feel.js';
import { MOVES } from '../data/moves.js';

/* ================================================================== */
/* 0. small helpers                                                    */
/* ================================================================== */

const WHITE = new THREE.Color('#ffffff');
const UP = new THREE.Vector3(0, 1, 0);
const FWD = new THREE.Vector3(0, 0, 1);
/** Roughly where the battle camera lives. Ribbons flatten towards it so they
 *  never vanish edge-on, without vfx.js needing a camera reference. */
const VIEW = new THREE.Vector3(0, 0.28, 1).normalize();

const _v = new THREE.Vector3();
const _v2 = new THREE.Vector3();
const _q = new THREE.Quaternion();
const _dummy = new THREE.Object3D();

const int = (n) => Math.max(1, Math.round(Number.isFinite(n) ? n : 1));
const rnd = (a, b) => a + Math.random() * (b - a);
const rsign = () => (Math.random() < 0.5 ? -1 : 1);
const lerp = (a, b, t) => a + (b - a) * t;

/** Guard against NaN positions reaching geometry — one NaN poisons a buffer. */
function safe(v, fallbackY = 1.4) {
  if (!v || !Number.isFinite(v.x) || !Number.isFinite(v.y) || !Number.isFinite(v.z)) {
    return new THREE.Vector3(0, fallbackY, 0);
  }
  return v;
}

function col(c) { return new THREE.Color(c || '#ffffff'); }
function lighten(c, amt) { return col(c).lerp(WHITE, clamp01(amt)); }
function darken(c, amt) { return col(c).multiplyScalar(1 - clamp01(amt)); }
/** Dark move colours (haki, shadow, void) still need something that reads as
 *  light when drawn additively. This lifts them just enough to register. */
function glowable(c, floor = 0.32) {
  const o = col(c);
  const l = Math.max(o.r, o.g, o.b);
  if (l < floor) o.multiplyScalar(floor / Math.max(0.04, l));
  return o;
}

/** Fade envelopes, all 0..1 → 0..1 opacity multipliers. */
const FADE = {
  out: (p) => 1 - Ease.inQuad(p),
  fast: (p) => 1 - Ease.outQuad(p),
  late: (p) => (p < 0.55 ? 1 : 1 - (p - 0.55) / 0.45),
  hold: (p) => (p < 0.82 ? 1 : 1 - (p - 0.82) / 0.18),
  pulse: (p) => Math.sin(Math.PI * clamp01(p)),
  rise: (p) => (p < 0.14 ? p / 0.14 : 1 - Ease.inQuad((p - 0.14) / 0.86)),
  linear: (p) => 1 - p
};

/** Quaternion that points +Y along `dir` (cylinders, cones, lances). */
function alignY(obj, dir) { obj.quaternion.setFromUnitVectors(UP, _v.copy(dir).normalize()); }
/** Quaternion that points +Z along `dir` (rings and planes facing down an axis). */
function alignZ(obj, dir) { obj.quaternion.setFromUnitVectors(FWD, _v.copy(dir).normalize()); }

/* ================================================================== */
/* 1. shared resources                                                 */
/* ================================================================== */

const TEX = new Map();
function tex(name) {
  let t = TEX.get(name);
  if (t) return t;
  const s = name === 'flare' ? 128 : 64;
  const cv = document.createElement('canvas');
  cv.width = cv.height = s;
  const g = cv.getContext('2d');
  const r = s / 2;
  if (name === 'dot') {
    const gr = g.createRadialGradient(r, r, 0, r, r, r);
    gr.addColorStop(0, 'rgba(255,255,255,1)');
    gr.addColorStop(0.32, 'rgba(255,255,255,0.78)');
    gr.addColorStop(0.68, 'rgba(255,255,255,0.20)');
    gr.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = gr; g.fillRect(0, 0, s, s);
  } else if (name === 'spark') {
    const gr = g.createRadialGradient(r, r, 0, r, r, r);
    gr.addColorStop(0, 'rgba(255,255,255,1)');
    gr.addColorStop(0.14, 'rgba(255,255,255,0.95)');
    gr.addColorStop(0.30, 'rgba(255,255,255,0.35)');
    gr.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = gr; g.fillRect(0, 0, s, s);
  } else if (name === 'smoke') {
    // three offset blobs so a puff has a silhouette rather than a perfect disc
    for (const [ox, oy, rr, a] of [[0, 0, 0.52, 0.55], [-0.18, 0.12, 0.36, 0.42], [0.2, -0.1, 0.34, 0.42]]) {
      const cx = r + ox * s, cy = r + oy * s;
      const gr = g.createRadialGradient(cx, cy, 0, cx, cy, rr * s);
      gr.addColorStop(0, `rgba(255,255,255,${a})`);
      gr.addColorStop(0.55, `rgba(255,255,255,${a * 0.45})`);
      gr.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = gr; g.fillRect(0, 0, s, s);
    }
  } else if (name === 'flare') {
    const gr = g.createRadialGradient(r, r, 0, r, r, r);
    gr.addColorStop(0, 'rgba(255,255,255,1)');
    gr.addColorStop(0.10, 'rgba(255,255,255,0.85)');
    gr.addColorStop(0.30, 'rgba(255,255,255,0.20)');
    gr.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = gr; g.fillRect(0, 0, s, s);
    g.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 4; i++) {
      g.save(); g.translate(r, r); g.rotate((i * Math.PI) / 4);
      const lg = g.createLinearGradient(-r, 0, r, 0);
      lg.addColorStop(0, 'rgba(255,255,255,0)');
      lg.addColorStop(0.5, `rgba(255,255,255,${i % 2 ? 0.28 : 0.5})`);
      lg.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = lg;
      g.fillRect(-r, -(i % 2 ? 1.4 : 2.4), s, i % 2 ? 2.8 : 4.8);
      g.restore();
    }
  } else if (name === 'ring') {
    const gr = g.createRadialGradient(r, r, 0, r, r, r);
    gr.addColorStop(0, 'rgba(255,255,255,0)');
    gr.addColorStop(0.62, 'rgba(255,255,255,0.06)');
    gr.addColorStop(0.86, 'rgba(255,255,255,0.9)');
    gr.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = gr; g.fillRect(0, 0, s, s);
  } else { // 'scar' — irregular ground mark
    const gr = g.createRadialGradient(r, r, 0, r, r, r);
    gr.addColorStop(0, 'rgba(255,255,255,0.92)');
    gr.addColorStop(0.45, 'rgba(255,255,255,0.42)');
    gr.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = gr; g.fillRect(0, 0, s, s);
    g.globalCompositeOperation = 'destination-out';
    for (let i = 0; i < 12; i++) {
      const a = Math.random() * Math.PI * 2, d = rnd(0.15, 0.5) * s;
      g.beginPath();
      g.arc(r + Math.cos(a) * d, r + Math.sin(a) * d, rnd(0.03, 0.11) * s, 0, Math.PI * 2);
      g.fillStyle = 'rgba(0,0,0,0.55)'; g.fill();
    }
  }
  t = new THREE.CanvasTexture(cv);
  t.colorSpace = THREE.SRGBColorSpace;
  TEX.set(name, t);
  return t;
}

const GEO = new Map();
function geo(key, make) {
  let g = GEO.get(key);
  if (!g) { g = make(); GEO.set(key, g); }
  return g;
}
const G = {
  plane: () => geo('plane', () => new THREE.PlaneGeometry(1, 1)),
  disc: () => geo('disc', () => new THREE.CircleGeometry(1, 36)),
  hex: () => geo('hex', () => new THREE.CircleGeometry(1, 6)),
  ring: (inner) => geo('ring' + inner, () => new THREE.RingGeometry(inner, 1, 56)),
  torus: (t) => geo('torus' + t, () => new THREE.TorusGeometry(1, t, 6, 44)),
  arc: (span, t) => geo(`arc${span}:${t}`, () => new THREE.TorusGeometry(1, t, 4, 40, span)),
  cyl: () => geo('cyl', () => new THREE.CylinderGeometry(1, 1, 1, 16, 1, true)),
  cylT: (top) => geo('cylT' + top, () => new THREE.CylinderGeometry(top, 1, 1, 14, 1, true)),
  cone: (seg) => geo('cone' + seg, () => new THREE.ConeGeometry(1, 1, seg)),
  sphere: () => geo('sph', () => new THREE.SphereGeometry(1, 18, 12)),
  sphereLo: () => geo('sphLo', () => new THREE.SphereGeometry(1, 8, 6)),
  octa: () => geo('octa', () => new THREE.OctahedronGeometry(1, 0)),
  tetra: () => geo('tetra', () => new THREE.TetrahedronGeometry(1)),
  box: () => geo('box', () => new THREE.BoxGeometry(1, 1, 1)),
  icosa: () => geo('icosa', () => new THREE.IcosahedronGeometry(1, 0))
};

/* --- material pool ------------------------------------------------ */

const MPOOL = new Map();
const POOL_CAP = 40;

function buildMat(base, texName, vc) {
  const map = texName ? tex(texName) : null;
  switch (base) {
    case 'add':
      return new THREE.MeshBasicMaterial({ map, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
    case 'alpha':
      return new THREE.MeshBasicMaterial({ map, transparent: true, depthWrite: false, side: THREE.DoubleSide });
    case 'solid':
      return new THREE.MeshBasicMaterial({ map, transparent: true, depthWrite: true, side: THREE.FrontSide });
    case 'wire':
      return new THREE.MeshBasicMaterial({ wireframe: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false });
    case 'pts':
      return new THREE.PointsMaterial({ map, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true, vertexColors: !!vc });
    case 'ptsn':
      return new THREE.PointsMaterial({ map, transparent: true, depthWrite: false, sizeAttenuation: true, vertexColors: !!vc });
    default: // 'spr'
      return new THREE.SpriteMaterial({ map, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false });
  }
}

/** Borrow a material. Always paired with `giveMat` through Effect.dispose. */
function takeMat(base, texName, vc) {
  const k = `${base}|${texName || ''}|${vc ? 1 : 0}`;
  const pool = MPOOL.get(k);
  const m = pool && pool.length ? pool.pop() : buildMat(base, texName, vc);
  m.color.setRGB(1, 1, 1);
  m.opacity = 1;
  m.visible = true;
  if (m.isPointsMaterial) m.size = 0.12;
  if (m.isSpriteMaterial) m.rotation = 0;
  return { k, m };
}
function giveMat(k, m) {
  let pool = MPOOL.get(k);
  if (!pool) { pool = []; MPOOL.set(k, pool); }
  if (pool.length < POOL_CAP) pool.push(m); else m.dispose();
}

/** Release every shared resource. Only called from `VFX.clear(true)`. */
function disposeShared() {
  for (const pool of MPOOL.values()) { for (const m of pool) m.dispose(); pool.length = 0; }
  MPOOL.clear();
  for (const g of GEO.values()) g.dispose();
  GEO.clear();
  for (const t of TEX.values()) t.dispose();
  TEX.clear();
}

/* ================================================================== */
/* 2. Effect base                                                      */
/* ================================================================== */

class Effect {
  /**
   * @param {THREE.Object3D} obj
   * @param {number} life   seconds the effect lives once it starts
   * @param {number} delay  seconds before it starts (invisible until then)
   */
  constructor(obj, life = 0.4, delay = 0) {
    this.obj = obj;
    this.life = Math.max(0.02, life);
    this.delay = Math.max(0, delay || 0);
    this.age = -this.delay;
    this.cost = 1;              // approximate draw calls, used by the budget
    this._mats = [];
    this._geos = [];
    if (this.delay > 0) obj.visible = false;
  }
  /** Borrow a pooled material that this effect owns until it dies. */
  useMat(base, texName, vc) { const r = takeMat(base, texName, vc); this._mats.push(r); return r.m; }
  adopt(r) { this._mats.push(r); return r.m; }
  ownGeo(g) { this._geos.push(g); return g; }

  update(dt) {
    this.age += dt;
    if (this.age < 0) return true;
    if (this.obj.visible === false) this.obj.visible = true;
    this.step(clamp01(this.age / this.life), dt);
    return this.age < this.life;
  }
  step() { }

  dispose() {
    for (const r of this._mats) giveMat(r.k, r.m);
    this._mats.length = 0;
    for (const g of this._geos) g.dispose();
    this._geos.length = 0;
    this.obj?.traverse?.((o) => { if (o.isInstancedMesh) o.dispose(); });
  }
}

/* ================================================================== */
/* 3. primitives                                                       */
/* ================================================================== */

/** Any mesh or group with animated scale / spin / drift / opacity. */
class Prop extends Effect {
  /**
   * @param {THREE.Object3D} obj  already positioned and oriented
   * @param {object} o  { life, delay, s0, s1, ease, fade, a0, spin, move, moveEase, mats }
   */
  constructor(obj, o = {}) {
    super(obj, o.life ?? 0.4, o.delay);
    this.o = o;
    this.mats = o.mats || [];
    this.base = obj.position.clone();
    this.s0 = o.s0 ?? 0.2; this.s1 = o.s1 ?? 1;
    this.ease = o.ease || Ease.outQuint;
    this.fade = o.fade || FADE.out;
    this.a0 = o.a0 ?? 1;
    this.spin = o.spin || null;
    this.move = o.move || null;
    this.moveEase = o.moveEase || Ease.outCubic;
    this._applyScale(this.s0);
  }
  _applyScale(s) {
    const o = this.o;
    this.obj.scale.set(s * (o.sx ?? 1), s * (o.sy ?? 1), s * (o.sz ?? 1));
  }
  step(p, dt) {
    const e = this.ease(p);
    this._applyScale(lerp(this.s0, this.s1, e));
    if (this.spin) {
      this.obj.rotation.x += this.spin[0] * dt;
      this.obj.rotation.y += this.spin[1] * dt;
      this.obj.rotation.z += this.spin[2] * dt;
    }
    if (this.move) {
      const q = this.moveEase(p);
      this.obj.position.set(this.base.x + this.move[0] * q, this.base.y + this.move[1] * q, this.base.z + this.move[2] * q);
    }
    const a = this.a0 * this.fade(p);
    for (const m of this.mats) m.opacity = a;
  }
}

/** A camera-facing sprite: cores, blooms, flares, orb glows. */
class Glow extends Effect {
  constructor(pos, o = {}) {
    const mm = takeMat('spr', o.tex || 'flare');
    const s = new THREE.Sprite(mm.m);
    s.position.copy(pos);
    super(s, o.life ?? 0.3, o.delay);
    this.adopt(mm);
    this.mat = mm.m;
    this.mat.color.copy(o.color ? col(o.color) : WHITE);
    this.s0 = o.s0 ?? 0.4; this.s1 = o.s1 ?? 2.4;
    this.a0 = o.a0 ?? 1;
    this.ease = o.ease || Ease.outQuint;
    this.fade = o.fade || FADE.out;
    this.spin = o.spin ?? 0;
    s.scale.setScalar(this.s0);
    this.mat.rotation = o.rot ?? 0;
  }
  step(p, dt) {
    this.obj.scale.setScalar(lerp(this.s0, this.s1, this.ease(p)));
    this.mat.opacity = this.a0 * this.fade(p);
    if (this.spin) this.mat.rotation += this.spin * dt;
  }
}

/** Expanding ring. `face`: 'ground' | 'axis' (perpendicular to dir) | 'flat'. */
class RingWave extends Effect {
  constructor(pos, o = {}) {
    const mm = takeMat('add');
    const mesh = new THREE.Mesh(G.ring(o.inner ?? 0.9), mm.m);
    mesh.position.copy(pos);
    super(mesh, o.life ?? 0.45, o.delay);
    this.adopt(mm);
    this.mat = mm.m;
    this.mat.color.copy(glowable(o.color, 0.26));
    if (o.face === 'ground') mesh.rotation.x = -Math.PI / 2;
    else if (o.face === 'axis' && o.dir) alignZ(mesh, o.dir);
    if (o.tilt) mesh.rotation.z += o.tilt;
    this.r0 = o.r0 ?? 0.2; this.r1 = o.r1 ?? 3;
    this.a0 = o.a0 ?? 0.9;
    this.ease = o.ease || Ease.outQuart;
    this.fade = o.fade || FADE.out;
    this.squash = o.squash ?? 1;
    this.spin = o.spin ?? 0;
    this.move = o.move || null;
    this.base = mesh.position.clone();
    mesh.scale.set(this.r0, this.r0 * this.squash, this.r0);
  }
  step(p, dt) {
    const r = lerp(this.r0, this.r1, this.ease(p));
    this.obj.scale.set(r, r * this.squash, r);
    this.mat.opacity = this.a0 * this.fade(p);
    if (this.spin) this.obj.rotation.z += this.spin * dt;
    if (this.move) {
      const q = Ease.outCubic(p);
      this.obj.position.set(this.base.x + this.move[0] * q, this.base.y + this.move[1] * q, this.base.z + this.move[2] * q);
    }
  }
}

/**
 * Textured point cloud with simple physics. One draw call, whatever the count.
 * Covers embers, sparks, dust, spray, mist, motes, snow and smoke.
 */
class PointSwarm extends Effect {
  constructor(o = {}) {
    const n = int(o.count ?? 40);
    const pos = new Float32Array(n * 3);
    const vel = new Float32Array(n * 3);
    const vc = !!o.color2;
    const cols = vc ? new Float32Array(n * 3) : null;
    const origin = o.pos || new THREE.Vector3();
    const dir = o.dir ? _v2.copy(o.dir).normalize().clone() : new THREE.Vector3(0, 1, 0);
    const c1 = col(o.color), c2 = vc ? col(o.color2) : null;
    const spread = o.spread ?? 0.25;
    const spd = o.spd || [1.5, 4];
    const shape = o.shape || 'sphere';

    // basis perpendicular to dir, for cones and discs
    const ax = Math.abs(dir.y) > 0.92 ? new THREE.Vector3(1, 0, 0) : new THREE.Vector3(0, 1, 0);
    const bx = new THREE.Vector3().crossVectors(dir, ax).normalize();
    const by = new THREE.Vector3().crossVectors(dir, bx).normalize();

    for (let i = 0; i < n; i++) {
      let ox = 0, oy = 0, oz = 0, vx = 0, vy = 0, vz = 0;
      const s = rnd(spd[0], spd[1]);
      if (shape === 'cone') {
        const a = Math.random() * Math.PI * 2, r = Math.pow(Math.random(), 0.6) * (o.cone ?? 0.5);
        const d = _v.copy(dir).addScaledVector(bx, Math.cos(a) * r).addScaledVector(by, Math.sin(a) * r).normalize();
        vx = d.x * s; vy = d.y * s; vz = d.z * s;
        ox = rnd(-spread, spread) * 0.4; oy = rnd(-spread, spread) * 0.4; oz = rnd(-spread, spread) * 0.4;
      } else if (shape === 'disc') {
        const a = Math.random() * Math.PI * 2, r = Math.sqrt(Math.random());
        ox = Math.cos(a) * spread * r; oz = Math.sin(a) * spread * r; oy = rnd(0, spread * 0.3);
        vx = Math.cos(a) * s; vz = Math.sin(a) * s; vy = rnd(0, s * 0.35);
      } else if (shape === 'shell') { // start on a sphere, fly inward
        const a = Math.random() * Math.PI * 2, el = Math.acos(rnd(-1, 1));
        ox = Math.sin(el) * Math.cos(a) * spread; oy = Math.cos(el) * spread; oz = Math.sin(el) * Math.sin(a) * spread;
        const inv = -s / Math.max(0.001, spread);
        vx = ox * inv; vy = oy * inv; vz = oz * inv;
      } else if (shape === 'column') {
        const a = Math.random() * Math.PI * 2, r = Math.sqrt(Math.random()) * spread;
        ox = Math.cos(a) * r; oz = Math.sin(a) * r; oy = rnd(0, o.height ?? 2);
        vx = Math.cos(a) * s * 0.2; vz = Math.sin(a) * s * 0.2; vy = s;
      } else if (shape === 'sky') { // rain over a wide area
        const a = Math.random() * Math.PI * 2, r = Math.sqrt(Math.random()) * spread;
        ox = Math.cos(a) * r; oz = Math.sin(a) * r; oy = rnd(0.4, o.height ?? 8);
        vx = (o.wind?.[0] ?? 0); vz = (o.wind?.[1] ?? 0); vy = -s;
      } else if (shape === 'line') {
        const t = Math.random();
        const end = o.to || origin;
        ox = (end.x - origin.x) * t + rnd(-spread, spread);
        oy = (end.y - origin.y) * t + rnd(-spread, spread);
        oz = (end.z - origin.z) * t + rnd(-spread, spread);
        vx = rnd(-s, s) * 0.4; vy = rnd(0, s); vz = rnd(-s, s) * 0.4;
      } else { // sphere
        const a = Math.random() * Math.PI * 2, el = Math.acos(rnd(-1, 1));
        const ux = Math.sin(el) * Math.cos(a), uy = Math.cos(el), uz = Math.sin(el) * Math.sin(a);
        ox = ux * spread * Math.random(); oy = uy * spread * Math.random(); oz = uz * spread * Math.random();
        vx = ux * s; vy = uy * s * (o.flat ? 0.35 : 1) + (o.rise ?? 0); vz = uz * s;
      }
      pos[i * 3] = origin.x + ox; pos[i * 3 + 1] = origin.y + oy; pos[i * 3 + 2] = origin.z + oz;
      vel[i * 3] = vx; vel[i * 3 + 1] = vy; vel[i * 3 + 2] = vz;
      if (cols) {
        const t = Math.random();
        cols[i * 3] = lerp(c1.r, c2.r, t); cols[i * 3 + 1] = lerp(c1.g, c2.g, t); cols[i * 3 + 2] = lerp(c1.b, c2.b, t);
      }
    }

    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    if (cols) g.setAttribute('color', new THREE.BufferAttribute(cols, 3));
    const mm = takeMat(o.blend === 'normal' ? 'ptsn' : 'pts', o.tex || 'dot', vc);
    const pts = new THREE.Points(g, mm.m);
    super(pts, o.life ?? 0.9, o.delay);
    this.adopt(mm); this.ownGeo(g);
    this.mat = mm.m;
    this.mat.color.copy(vc ? WHITE : (o.blend === 'normal' ? c1 : glowable(o.color, 0.2)));
    this.pos = pos; this.vel = vel; this.n = n;
    this.size0 = o.size ?? 0.14; this.size1 = o.size1 ?? this.size0;
    this.mat.size = this.size0;
    this.a0 = o.a0 ?? 1;
    this.fade = o.fade || FADE.out;
    this.gravity = o.gravity ?? -6;
    this.drag = o.drag ?? 2.0;
    this.swirl = o.swirl ?? 0;
    this.axisX = origin.x; this.axisZ = origin.z;
    this.groundY = o.groundY ?? 0.05;
    this.ground = o.ground || 'bounce';   // 'bounce' | 'stick' | 'none' | 'kill'
    this.stuck = this.ground === 'stick' ? new Uint8Array(n) : null;
  }
  step(p, dt) {
    const { pos, vel, n } = this;
    const dr = 1 - Math.min(0.95, this.drag * dt);
    for (let i = 0; i < n; i++) {
      const j = i * 3;
      if (this.stuck && this.stuck[i]) continue;
      vel[j + 1] += this.gravity * dt;
      if (this.swirl) {
        const dx = pos[j] - this.axisX, dz = pos[j + 2] - this.axisZ;
        vel[j] += -dz * this.swirl * dt; vel[j + 2] += dx * this.swirl * dt;
      }
      vel[j] *= dr; vel[j + 1] *= dr; vel[j + 2] *= dr;
      pos[j] += vel[j] * dt; pos[j + 1] += vel[j + 1] * dt; pos[j + 2] += vel[j + 2] * dt;
      if (pos[j + 1] < this.groundY && this.ground !== 'none') {
        pos[j + 1] = this.groundY;
        if (this.ground === 'stick') { if (this.stuck) this.stuck[i] = 1; vel[j] = vel[j + 1] = vel[j + 2] = 0; }
        else { vel[j + 1] *= -0.3; vel[j] *= 0.66; vel[j + 2] *= 0.66; }
      }
    }
    this.obj.geometry.attributes.position.needsUpdate = true;
    this.mat.size = lerp(this.size0, this.size1, p);
    this.mat.opacity = this.a0 * this.fade(p);
  }
}

/** Instanced solids: shards, debris, plates, petals, globs. One draw call. */
class InstSwarm extends Effect {
  constructor(o = {}) {
    const n = int(o.count ?? 12);
    const mm = takeMat(o.blend === 'add' ? 'add' : (o.blend === 'alpha' ? 'alpha' : 'solid'));
    const im = new THREE.InstancedMesh(o.geo || G.tetra(), mm.m, n);
    im.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    super(im, o.life ?? 1.1, o.delay);
    this.adopt(mm);
    this.mat = mm.m;
    this.mat.color.copy(o.blend === 'add' ? glowable(o.color, 0.24) : col(o.color));
    this.n = n;
    const origin = o.pos || new THREE.Vector3();
    const spd = o.spd || [2, 5];
    const size = o.size || [0.08, 0.2];
    this.P = new Float32Array(n * 3);
    this.V = new Float32Array(n * 3);
    this.R = new Float32Array(n * 3);
    this.RV = new Float32Array(n * 3);
    this.S = new Float32Array(n * 3);
    this.stuck = new Uint8Array(n);
    const spread = o.spread ?? 0.3;
    const dir = o.dir ? _v2.copy(o.dir).normalize().clone() : null;
    for (let i = 0; i < n; i++) {
      const j = i * 3;
      const a = Math.random() * Math.PI * 2;
      const s = rnd(spd[0], spd[1]);
      let ox, oy, oz, vx, vy, vz;
      if (o.shape === 'ringUp') {           // erupting from the ground in a ring
        const r = rnd(0.35, 1) * spread;
        ox = Math.cos(a) * r; oy = rnd(-0.2, 0.1); oz = Math.sin(a) * r;
        vx = Math.cos(a) * s * 0.35; vy = s; vz = Math.sin(a) * s * 0.35;
      } else if (o.shape === 'sky') {       // falling in from above
        const r = Math.sqrt(Math.random()) * spread;
        ox = Math.cos(a) * r; oy = rnd(3.2, 6.5); oz = Math.sin(a) * r;
        vx = 0; vy = -s; vz = 0;
      } else if (o.shape === 'cone' && dir) {
        const el = Math.acos(rnd(0.55, 1));
        const axv = Math.abs(dir.y) > 0.9 ? new THREE.Vector3(1, 0, 0) : UP;
        const b1 = _v.crossVectors(dir, axv).normalize().clone();
        const b2 = new THREE.Vector3().crossVectors(dir, b1).normalize();
        const d = dir.clone().multiplyScalar(Math.cos(el))
          .addScaledVector(b1, Math.sin(el) * Math.cos(a))
          .addScaledVector(b2, Math.sin(el) * Math.sin(a));
        ox = rnd(-spread, spread) * 0.3; oy = rnd(-spread, spread) * 0.3; oz = rnd(-spread, spread) * 0.3;
        vx = d.x * s; vy = d.y * s + 1.2; vz = d.z * s;
      } else {                               // burst
        const el = Math.acos(rnd(-0.3, 1));
        ox = rnd(-spread, spread); oy = rnd(-spread, spread) * 0.6; oz = rnd(-spread, spread);
        vx = Math.sin(el) * Math.cos(a) * s; vy = Math.abs(Math.cos(el)) * s + (o.rise ?? 1.6); vz = Math.sin(el) * Math.sin(a) * s;
      }
      this.P[j] = origin.x + ox; this.P[j + 1] = origin.y + oy; this.P[j + 2] = origin.z + oz;
      this.V[j] = vx; this.V[j + 1] = vy; this.V[j + 2] = vz;
      this.R[j] = Math.random() * 6.28; this.R[j + 1] = Math.random() * 6.28; this.R[j + 2] = Math.random() * 6.28;
      const sp = o.spinRate ?? 9;
      this.RV[j] = rnd(-sp, sp); this.RV[j + 1] = rnd(-sp, sp); this.RV[j + 2] = rnd(-sp, sp);
      const sc = rnd(size[0], size[1]);
      this.S[j] = sc * (o.sx ?? 1); this.S[j + 1] = sc * (o.sy ?? 1); this.S[j + 2] = sc * (o.sz ?? 1);
    }
    this.gravity = o.gravity ?? -17;
    this.drag = o.drag ?? 0.5;
    this.groundY = o.groundY ?? 0.06;
    this.ground = o.ground || 'bounce';    // 'bounce' | 'stick' | 'none'
    this.grow = o.grow ?? 1;               // scale multiplier at birth (pop-in)
    this.a0 = o.a0 ?? 1;
    this.fade = o.fade || FADE.late;
    this.align = !!o.align;
    this._write(0);
  }
  _write(p) {
    const pop = this.grow === 1 ? 1 : lerp(this.grow, 1, Ease.outBack(Math.min(1, p * 6)));
    for (let i = 0; i < this.n; i++) {
      const j = i * 3;
      _dummy.position.set(this.P[j], this.P[j + 1], this.P[j + 2]);
      if (this.align) {
        _v.set(this.V[j], this.V[j + 1], this.V[j + 2]);
        if (_v.lengthSq() > 1e-5) alignY(_dummy, _v); else _dummy.rotation.set(0, 0, 0);
      } else {
        _dummy.rotation.set(this.R[j], this.R[j + 1], this.R[j + 2]);
      }
      _dummy.scale.set(this.S[j] * pop, this.S[j + 1] * pop, this.S[j + 2] * pop);
      _dummy.updateMatrix();
      this.obj.setMatrixAt(i, _dummy.matrix);
    }
    this.obj.instanceMatrix.needsUpdate = true;
  }
  step(p, dt) {
    const dr = 1 - Math.min(0.95, this.drag * dt);
    for (let i = 0; i < this.n; i++) {
      const j = i * 3;
      if (this.stuck[i]) continue;
      this.V[j + 1] += this.gravity * dt;
      this.V[j] *= dr; this.V[j + 1] *= dr; this.V[j + 2] *= dr;
      this.P[j] += this.V[j] * dt; this.P[j + 1] += this.V[j + 1] * dt; this.P[j + 2] += this.V[j + 2] * dt;
      this.R[j] += this.RV[j] * dt; this.R[j + 1] += this.RV[j + 1] * dt; this.R[j + 2] += this.RV[j + 2] * dt;
      if (this.P[j + 1] < this.groundY && this.ground !== 'none') {
        this.P[j + 1] = this.groundY;
        if (this.ground === 'stick') { this.stuck[i] = 1; this.V[j] = this.V[j + 1] = this.V[j + 2] = 0; }
        else { this.V[j + 1] *= -0.34; this.V[j] *= 0.6; this.V[j + 2] *= 0.6; this.RV[j] *= 0.5; }
      }
    }
    this._write(p);
    this.mat.opacity = this.a0 * this.fade(p);
  }
}

/**
 * A strip of quads — one draw call for every strand. The base for speed lines,
 * lightning, slash trails and shadow tendrils. Unrevealed segments collapse to
 * zero width, so reveal costs nothing.
 */
class Ribbon extends Effect {
  constructor(strands, seg, o = {}) {
    strands = int(strands); seg = int(seg);
    const verts = strands * (seg + 1) * 2;
    const pos = new Float32Array(verts * 3);
    const idx = new (verts > 65000 ? Uint32Array : Uint16Array)(strands * seg * 6);
    for (let s = 0; s < strands; s++) {
      const o0 = s * (seg + 1) * 2;
      for (let i = 0; i < seg; i++) {
        const a = o0 + i * 2, k = (s * seg + i) * 6;
        idx[k] = a; idx[k + 1] = a + 1; idx[k + 2] = a + 2;
        idx[k + 3] = a + 1; idx[k + 4] = a + 3; idx[k + 5] = a + 2;
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setIndex(new THREE.BufferAttribute(idx, 1));
    const mm = takeMat(o.blend === 'alpha' ? 'alpha' : 'add');
    const mesh = new THREE.Mesh(g, mm.m);
    super(mesh, o.life ?? 0.4, o.delay);
    this.adopt(mm); this.ownGeo(g);
    this.mat = mm.m;
    this.mat.color.copy(o.blend === 'alpha' ? col(o.color) : glowable(o.color, 0.24));
    this.strands = strands; this.seg = seg; this.P = pos; this.geo = g;
    this.a0 = o.a0 ?? 1;
    this.fade = o.fade || FADE.out;
  }
  /** Write the i-th cross-section of a strand: centre ± half-width. */
  put(s, i, cx, cy, cz, wx, wy, wz) {
    const a = (s * (this.seg + 1) + i) * 6;
    const P = this.P;
    P[a] = cx - wx; P[a + 1] = cy - wy; P[a + 2] = cz - wz;
    P[a + 3] = cx + wx; P[a + 4] = cy + wy; P[a + 5] = cz + wz;
  }
  commit() { this.geo.attributes.position.needsUpdate = true; }
}

/** Converging or radiating speed lines. */
class Streaks extends Ribbon {
  constructor(o = {}) {
    const n = int(o.count ?? 10);
    super(n, 1, o);
    this.cost = 1;
    const origin = o.pos || new THREE.Vector3();
    this.origin = origin.clone();
    this.plane = o.plane || 'face';      // 'face' | 'flat' | 'sphere'
    this.mode = o.mode || 'burst';       // 'burst' | 'converge'
    this.r0 = o.r0 ?? 0.3; this.r1 = o.r1 ?? 3.2;
    this.len = o.len ?? 0.9; this.w = o.w ?? 0.05;
    this.ease = o.ease || Ease.outQuart;
    this.A = new Float32Array(n * 5);    // angle, elev, lenMul, widthMul, phase
    for (let i = 0; i < n; i++) {
      const j = i * 5;
      this.A[j] = o.arc ? (o.arcFrom ?? 0) + (i / n) * o.arc + rnd(-0.08, 0.08) : (i / n) * Math.PI * 2 + rnd(-0.2, 0.2);
      this.A[j + 1] = rnd(-1, 1);
      this.A[j + 2] = rnd(0.6, 1.5);
      this.A[j + 3] = rnd(0.6, 1.4);
      this.A[j + 4] = rnd(0, 0.25);
    }
    this._draw(0);
  }
  _draw(p) {
    const e = this.ease(clamp01(p));
    const o = this.origin;
    for (let i = 0; i < this.strands; i++) {
      const j = i * 5;
      const a = this.A[j], el = this.A[j + 1], lm = this.A[j + 2], wm = this.A[j + 3], ph = this.A[j + 4];
      const q = clamp01((e - ph) / Math.max(0.05, 1 - ph));
      let r = this.mode === 'converge' ? lerp(this.r1, this.r0, q) : lerp(this.r0, this.r1, q);
      const len = this.len * lm * (this.mode === 'converge' ? 1 - q * 0.5 : 1);
      let dx, dy, dz, wx, wy, wz;
      if (this.plane === 'flat') {
        dx = Math.cos(a); dy = 0; dz = Math.sin(a);
        wx = -Math.sin(a) * this.w * wm; wy = 0; wz = Math.cos(a) * this.w * wm;
      } else if (this.plane === 'sphere') {
        const ce = Math.cos(el * 1.2);
        dx = Math.cos(a) * ce; dy = Math.sin(el * 1.2); dz = Math.sin(a) * ce;
        _v.set(dx, dy, dz); _v2.crossVectors(_v, VIEW);
        if (_v2.lengthSq() < 1e-5) _v2.set(1, 0, 0);
        _v2.normalize().multiplyScalar(this.w * wm);
        wx = _v2.x; wy = _v2.y; wz = _v2.z;
      } else {
        dx = Math.cos(a); dy = Math.sin(a); dz = 0;
        wx = -Math.sin(a) * this.w * wm; wy = Math.cos(a) * this.w * wm; wz = 0;
      }
      const inner = r, outer = r + len;
      this.put(i, 0, o.x + dx * inner, o.y + dy * inner, o.z + dz * inner, wx, wy, wz);
      this.put(i, 1, o.x + dx * outer, o.y + dy * outer, o.z + dz * outer, wx * 0.15, wy * 0.15, wz * 0.15);
    }
    this.commit();
  }
  step(p) { this._draw(p); this.mat.opacity = this.a0 * this.fade(p); }
}

/** Jagged bolt with optional branches; re-jitters so it crackles. */
class Bolt extends Ribbon {
  constructor(from, to, o = {}) {
    const seg = int(o.seg ?? 11);
    const branches = int(o.branches ?? 0) * (o.branches ? 1 : 0);
    super(1 + (o.branches ? branches : 0), seg, o);
    this.from = from.clone(); this.to = to.clone();
    this.segN = seg;
    this.amp = o.amp ?? 0.42;
    this.w = o.w ?? 0.075;
    this.reveal = o.reveal ?? 0.14;      // seconds for the strike to travel
    this.crackle = o.crackle ?? 0.045;
    this.branchN = o.branches ? branches : 0;
    this._t = 99;
    this._jitter();
  }
  _jitter() {
    const dir = _v.copy(this.to).sub(this.from);
    const len = dir.length() || 1;
    dir.multiplyScalar(1 / len);
    const right = _v2.crossVectors(dir, VIEW);
    if (right.lengthSq() < 1e-4) right.set(1, 0, 0);
    right.normalize();
    const up = new THREE.Vector3().crossVectors(dir, right).normalize();
    const rx = right.clone(), uy = up.clone();
    this._pts = this._pts || new Float32Array((this.segN + 1) * 3);
    for (let i = 0; i <= this.segN; i++) {
      const t = i / this.segN;
      const env = Math.sin(Math.PI * t);
      const jr = rnd(-1, 1) * this.amp * env * len * 0.14;
      const ju = rnd(-1, 1) * this.amp * env * len * 0.10;
      this._pts[i * 3] = lerp(this.from.x, this.to.x, t) + rx.x * jr + uy.x * ju;
      this._pts[i * 3 + 1] = lerp(this.from.y, this.to.y, t) + rx.y * jr + uy.y * ju;
      this._pts[i * 3 + 2] = lerp(this.from.z, this.to.z, t) + rx.z * jr + uy.z * ju;
    }
    this._right = rx;
  }
  _draw(p) {
    const shown = clamp01(this.age / Math.max(0.01, this.reveal));
    const head = shown * this.segN;
    const rx = this._right;
    for (let i = 0; i <= this.segN; i++) {
      const on = i <= head;
      const taper = 1 - 0.55 * (i / this.segN);
      const w = on ? this.w * taper : 0;
      this.put(0, i, this._pts[i * 3], this._pts[i * 3 + 1], this._pts[i * 3 + 2], rx.x * w, rx.y * w, rx.z * w);
    }
    // branches fork off the middle third
    for (let b = 0; b < this.branchN; b++) {
      const s = b + 1;
      const anchor = Math.floor(this.segN * (0.3 + 0.16 * b));
      const ax = this._pts[anchor * 3], ay = this._pts[anchor * 3 + 1], az = this._pts[anchor * 3 + 2];
      const dx = rsign() * rnd(0.5, 1.4), dy = rnd(-1.1, -0.2), dz = rsign() * rnd(0.3, 0.9);
      for (let i = 0; i <= this.segN; i++) {
        const t = i / this.segN;
        const on = t <= Math.min(1, shown * 1.6) && t <= 0.55;
        const w = on ? this.w * 0.5 * (1 - t / 0.55) : 0;
        this.put(s, i,
          ax + dx * t + rnd(-0.05, 0.05), ay + dy * t + rnd(-0.05, 0.05), az + dz * t,
          rx.x * w, rx.y * w, rx.z * w);
      }
    }
    this.commit();
  }
  step(p, dt) {
    this._t += dt;
    if (this._t > this.crackle) { this._t = 0; this._jitter(); }
    this._draw(p);
    this.mat.opacity = this.a0 * this.fade(p);
  }
}

/** Wavy strands crawling along the ground from A to B. Shadow's signature. */
class Tendrils extends Ribbon {
  constructor(from, to, o = {}) {
    const n = int(o.count ?? 5);
    const seg = int(o.seg ?? 14);
    super(n, seg, o);
    this.from = from.clone(); this.to = to.clone();
    this.segN = seg;
    this.y = o.y ?? 0.06;
    this.w = o.w ?? 0.16;
    this.wander = o.wander ?? 1.1;
    this.reveal = o.reveal ?? 0.34;
    this.riseAt = o.riseAt ?? 0;        // how far the heads rear up at the end
    this.ph = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      this.ph[i * 3] = rnd(0, 6.28);
      this.ph[i * 3 + 1] = rnd(1.4, 3.4);
      this.ph[i * 3 + 2] = rnd(0.7, 1.4) * (i % 2 ? 1 : -1);
    }
    this._draw(0);
  }
  _draw(p) {
    const dir = _v.copy(this.to).sub(this.from); dir.y = 0;
    const len = dir.length() || 1; dir.multiplyScalar(1 / len);
    const perp = _v2.set(-dir.z, 0, dir.x);
    const shown = clamp01(this.age / Math.max(0.01, this.reveal));
    for (let s = 0; s < this.strands; s++) {
      const ph = this.ph[s * 3], fr = this.ph[s * 3 + 1], amp = this.ph[s * 3 + 2];
      for (let i = 0; i <= this.segN; i++) {
        const t = i / this.segN;
        const on = t <= shown;
        const off = Math.sin(ph + t * fr * Math.PI) * amp * this.wander * (0.25 + t * 0.75);
        const cx = this.from.x + dir.x * len * t + perp.x * off;
        const cz = this.from.z + dir.z * len * t + perp.z * off;
        const cy = this.y + this.riseAt * Math.pow(t, 3) + Math.abs(Math.sin(ph * 2 + t * 5)) * 0.02;
        const taper = Math.sin(Math.PI * Math.min(1, t * 1.1)) * 0.75 + 0.25;
        const w = on ? this.w * taper : 0;
        this.put(s, i, cx, cy, cz, perp.x * w, 0, perp.z * w);
      }
    }
    this.commit();
  }
  step(p) { this._draw(p); this.mat.opacity = this.a0 * this.fade(p); }
}

/** A lance that shoots out of the muzzle and holds. Core + halo. */
class BeamCore extends Effect {
  constructor(from, to, o = {}) {
    const g = new THREE.Group();
    const mmC = takeMat('add');
    const mmH = takeMat('add');
    const core = new THREE.Mesh(G.cyl(), mmC.m);
    const halo = new THREE.Mesh(G.cyl(), mmH.m);
    g.add(core); g.add(halo);
    super(g, o.life ?? 0.5, o.delay);
    this.adopt(mmC); this.adopt(mmH);
    this.core = core; this.halo = halo;
    const c = glowable(o.color, 0.3);
    mmC.m.color.copy(lighten(c, o.hot ?? 0.55));
    mmH.m.color.copy(c);
    this.from = from.clone();
    this.dir = to.clone().sub(from);
    this.len = this.dir.length() || 1;
    this.dir.multiplyScalar(1 / this.len);
    alignY(core, this.dir); halo.quaternion.copy(core.quaternion);
    this.r = o.r ?? 0.16;
    this.haloR = o.haloR ?? 3.2;
    this.grow = o.grow ?? 0.12;
    this.a0 = o.a0 ?? 1;
    this.fade = o.fade || FADE.late;
    this.wobble = o.wobble ?? 0.12;
    this.mC = mmC.m; this.mH = mmH.m;
    this._set(0);
  }
  _set(q) {
    const l = Math.max(0.001, this.len * q);
    const cx = this.from.x + this.dir.x * l * 0.5;
    const cy = this.from.y + this.dir.y * l * 0.5;
    const cz = this.from.z + this.dir.z * l * 0.5;
    this.core.position.set(cx, cy, cz);
    this.halo.position.set(cx, cy, cz);
    this.core.scale.set(this.r, l, this.r);
    this.halo.scale.set(this.r * this.haloR, l, this.r * this.haloR);
  }
  step(p, dt) {
    const q = p < this.grow ? Ease.outQuint(p / this.grow) : 1;
    this._set(q);
    const w = 1 + Math.sin(this.age * 46) * this.wobble;
    this.core.scale.x *= w; this.core.scale.z *= w;
    const a = this.a0 * this.fade(p);
    this.mC.opacity = a;
    this.mH.opacity = a * 0.3;
  }
}

/** A body that travels from A to B, spinning, optionally on an arc. */
class Travel extends Effect {
  constructor(from, to, o = {}) {
    const g = new THREE.Group();
    super(g, o.life ?? 0.28, o.delay);
    this.from = from.clone(); this.to = to.clone();
    this.arc = o.arc ?? 0;
    this.spin = o.spin || [0, 0, 0];
    this.ease = o.ease || Ease.inQuad;
    this.faceDir = o.faceDir !== false;
    this.mats = [];
    this.fade = o.fade || FADE.hold;
    this.a0 = o.a0 ?? 1;
    this.s0 = o.s0 ?? 1; this.s1 = o.s1 ?? 1;
    o.build?.(g, this);
    if (this.faceDir) alignY(g, _v.copy(to).sub(from).normalize());
    g.position.copy(from);
  }
  step(p, dt) {
    const q = this.ease(p);
    this.obj.position.lerpVectors(this.from, this.to, q);
    if (this.arc) this.obj.position.y += Math.sin(Math.PI * q) * this.arc;
    const s = lerp(this.s0, this.s1, q);
    this.obj.scale.setScalar(s);
    if (this.spin[0] || this.spin[1] || this.spin[2]) {
      this.obj.rotateX(this.spin[0] * dt); this.obj.rotateY(this.spin[1] * dt); this.obj.rotateZ(this.spin[2] * dt);
    }
    const a = this.a0 * this.fade(p);
    for (const m of this.mats) m.opacity = a;
  }
}

/** Two wedges that close on the target. */
class Jaws extends Effect {
  constructor(pos, o = {}) {
    const g = new THREE.Group();
    const mm = takeMat('alpha');
    const top = new THREE.Mesh(G.cone(4), mm.m);
    const bot = new THREE.Mesh(G.cone(4), mm.m);
    g.add(top); g.add(bot);
    super(g, o.life ?? 0.34, o.delay);
    this.adopt(mm);
    this.mat = mm.m;
    this.mat.color.copy(col(o.color));
    const s = o.size ?? 1;
    top.scale.set(s * 0.85, s * 1.15, s * 0.85);
    bot.scale.copy(top.scale);
    top.rotation.z = Math.PI;
    g.position.copy(pos);
    if (o.dir) alignY(g, o.dir);
    g.rotateX(Math.PI / 2);
    this.top = top; this.bot = bot; this.gap = o.gap ?? 1.15 * s;
    this.a0 = o.a0 ?? 0.95;
  }
  step(p) {
    const e = Ease.inQuint(p < 0.62 ? p / 0.62 : 1);
    const d = this.gap * (1 - e);
    this.top.position.y = d + 0.35;
    this.bot.position.y = -d - 0.35;
    this.mat.opacity = this.a0 * (p < 0.62 ? 1 : 1 - (p - 0.62) / 0.38);
  }
}

/* ================================================================== */
/* 4. legacy shapes — still the fallback, now pooled                   */
/* ================================================================== */

class Shockwave extends Effect {
  constructor(pos, color, scale = 1, life = 0.45) {
    const mm = takeMat('add');
    const mesh = new THREE.Mesh(G.ring(0.86), mm.m);
    mesh.position.copy(pos); mesh.rotation.x = -Math.PI / 2;
    super(mesh, life);
    this.adopt(mm); this.mat = mm.m;
    this.mat.color.copy(glowable(color, 0.26));
    this.scale = scale;
    mesh.scale.setScalar(0.3);
  }
  step(p) {
    this.obj.scale.setScalar(0.3 + Ease.outQuart(p) * 3.4 * this.scale);
    this.mat.opacity = (1 - p) * 0.9;
  }
}

class ImpactBurst extends Effect {
  constructor(pos, color, scale = 1, life = 0.4) {
    const g = new THREE.Group();
    const mm = takeMat('add');
    const core = new THREE.Mesh(G.sphereLo(), mm.m);
    core.scale.setScalar(0.35 * scale);
    g.add(core);
    const spikes = [];
    const n = 10;
    for (let i = 0; i < n; i++) {
      const m = new THREE.Mesh(G.cone(5), mm.m);
      const a = (i / n) * Math.PI * 2 + Math.random() * 0.3;
      const el = (Math.random() - 0.5) * 1.4;
      m.scale.set(0.09 * scale, 0.9 * scale, 0.09 * scale);
      m.position.set(Math.cos(a) * 0.3, Math.sin(el) * 0.3, Math.sin(a) * 0.3);
      alignY(m, m.position.clone().normalize());
      spikes.push(m); g.add(m);
    }
    g.position.copy(pos);
    super(g, life);
    this.adopt(mm); this.mat = mm.m;
    this.mat.color.copy(glowable(color, 0.3));
    this.core = core; this.spikes = spikes; this.scale = scale;
    this.cost = 2;
  }
  step(p) {
    const e = Ease.outQuint(p);
    this.core.scale.setScalar(0.35 * this.scale * (1 + e * 2.2));
    for (const s of this.spikes) {
      s.position.setLength(0.3 + e * 2.4 * this.scale);
      s.scale.set(0.09 * this.scale * (1 - p * 0.6), 0.9 * this.scale * (1 + e * 1.4), 0.09 * this.scale * (1 - p * 0.6));
    }
    this.mat.opacity = 1 - p;
  }
}

class SlashArc extends Effect {
  constructor(from, to, color, scale = 1, life = 0.34) {
    const g = new THREE.Group();
    const mmA = takeMat('add'), mmG = takeMat('add');
    const arc = new THREE.Mesh(G.arc(Math.PI * 0.85, 0.04), mmA.m);
    const glow = new THREE.Mesh(G.arc(Math.PI * 0.85, 0.13), mmG.m);
    const mid = from.clone().lerp(to, 0.62);
    arc.position.copy(mid);
    arc.rotation.z = Math.PI * 0.15 + (Math.random() - 0.5) * 0.5;
    arc.rotation.y = Math.atan2(to.x - from.x, to.z - from.z);
    glow.position.copy(mid); glow.rotation.copy(arc.rotation);
    g.add(arc); g.add(glow);
    super(g, life);
    this.adopt(mmA); this.adopt(mmG);
    mmA.m.color.copy(lighten(glowable(color, 0.3), 0.35));
    mmG.m.color.copy(glowable(color, 0.28));
    this.arc = arc; this.glow = glow; this.scale = scale;
    this.mA = mmA.m; this.mG = mmG.m;
    this.cost = 2;
  }
  step(p) {
    const e = Ease.outExpo(p);
    this.arc.scale.setScalar(1.5 * this.scale * (0.4 + e * 1.1));
    this.glow.scale.setScalar(1.5 * this.scale * (0.4 + e * 1.2));
    this.mA.opacity = 1 - Ease.inQuad(p);
    this.mG.opacity = 0.25 * (1 - p);
  }
}

class Beam extends Effect {
  constructor(from, to, color, scale = 1, life = 0.42) {
    const g = new THREE.Group();
    const dir = to.clone().sub(from);
    const len = dir.length() || 1;
    dir.multiplyScalar(1 / len);
    const mmC = takeMat('add'), mmH = takeMat('add');
    const core = new THREE.Mesh(G.cyl(), mmC.m);
    const halo = new THREE.Mesh(G.cyl(), mmH.m);
    const mid = from.clone().add(to).multiplyScalar(0.5);
    core.position.copy(mid); halo.position.copy(mid);
    alignY(core, dir); halo.quaternion.copy(core.quaternion);
    core.scale.set(0.2 * scale, len, 0.2 * scale);
    halo.scale.set(0.48 * scale, len, 0.48 * scale);
    g.add(core); g.add(halo);
    super(g, life);
    this.adopt(mmC); this.adopt(mmH);
    mmC.m.color.copy(lighten(glowable(color, 0.3), 0.4));
    mmH.m.color.copy(glowable(color, 0.28));
    this.core = core; this.halo = halo; this.len = len; this.scale = scale;
    this.mC = mmC.m; this.mH = mmH.m;
    this.cost = 2;
  }
  step(p) {
    const grow = p < 0.25 ? Ease.outQuint(p / 0.25) : 1;
    const fade = p < 0.55 ? 1 : 1 - (p - 0.55) / 0.45;
    this.core.scale.set(0.2 * this.scale * grow, this.len, 0.2 * this.scale * grow);
    this.halo.scale.set(0.48 * this.scale * grow, this.len, 0.48 * this.scale * grow);
    this.mC.opacity = fade;
    this.mH.opacity = 0.22 * fade;
  }
}

class Particles extends PointSwarm {
  constructor(pos, color, count = 60, scale = 1, life = 0.9, opts = {}) {
    super({
      pos, color, count: int(count), life,
      size: 0.13 * scale, spread: 0.22 * scale, spd: [1.6 * scale, 5.8 * scale],
      rise: 1.2, gravity: opts.gravity ?? -7, drag: opts.drag ?? 2.2, tex: 'dot'
    });
  }
}

class AuraPulse extends Effect {
  constructor(pos, color, scale = 1, life = 0.7) {
    const g = new THREE.Group();
    const mmR = takeMat('add'), mmC = takeMat('add');
    const rings = [];
    for (let i = 0; i < 3; i++) {
      const r = new THREE.Mesh(G.torus(0.03), mmR.m);
      r.rotation.x = -Math.PI / 2;
      r.position.y = i * 0.25;
      r.scale.setScalar(0.9 * scale);
      rings.push(r); g.add(r);
    }
    const column = new THREE.Mesh(G.cyl(), mmC.m);
    column.position.y = 1.5;
    column.scale.set(0.9 * scale, 3.2, 0.9 * scale);
    g.add(column);
    g.position.copy(pos);
    super(g, life);
    this.adopt(mmR); this.adopt(mmC);
    mmR.m.color.copy(glowable(color, 0.3));
    mmC.m.color.copy(glowable(color, 0.24));
    this.rings = rings; this.column = column; this.scale = scale;
    this.mR = mmR.m; this.mC = mmC.m;
    this.cost = 2;
  }
  step(p) {
    let a = 0;
    for (let i = 0; i < this.rings.length; i++) {
      const r = this.rings[i];
      const lp = clamp01(p * 1.4 - i * 0.16);
      r.position.y = lp * 3.0;
      r.scale.setScalar(0.9 * this.scale * (0.4 + lp * 1.2));
      a = Math.max(a, 0.8 * (1 - lp));
    }
    this.mR.opacity = a;
    this.mC.opacity = 0.16 * (1 - p);
    this.column.scale.set(0.9 * this.scale * (1 + p * 0.3), 3.2, 0.9 * this.scale * (1 + p * 0.3));
  }
}

class GroundCrack extends Effect {
  constructor(pos, color, scale = 1, life = 1.1) {
    const s = new Streaks({
      pos: new THREE.Vector3(pos.x, 0.05, pos.z), color, plane: 'flat', mode: 'burst',
      count: 7, r0: 0.1, r1: 0.6 * scale, len: 2.0 * scale, w: 0.055 * scale,
      life, fade: FADE.late, a0: 0.85
    });
    // Wrap so the exported class keeps its old identity while reusing Streaks.
    super(s.obj, life);
    this._inner = s;
    this._mats = s._mats; s._mats = [];
    this._geos = s._geos; s._geos = [];
  }
  step(p, dt) { this._inner.age = this.age; this._inner.step(p, dt); }
}

class DebrisChunks extends InstSwarm {
  constructor(pos, color, count = 14, scale = 1, life = 1.2) {
    super({
      pos, color, count: int(count), life, geo: G.tetra(),
      size: [0.06 * scale, 0.22 * scale], spd: [1.5, 4.5], rise: 3.5, spread: 0.3 * scale
    });
  }
}

/* ================================================================== */
/* 4. families                                                         */
/*                                                                     */
/* A family is a recipe: wind-up, strike, settle. Each returns the      */
/* number of seconds the beat should hold for, and pushes its effects   */
/* through `add`. Families read the move's own fx block, so one recipe  */
/* serves every move of that flavour at the right size and colour.      */
/* ================================================================== */

/** Common context passed to every family. */
function ctx(vfx, fx, from, to) {
  const scale = fx?.scale || 1;
  const color = fx?.color || '#ffffff';
  const dir = _v.copy(to).sub(from);
  const dist = dir.length() || 1;
  dir.multiplyScalar(1 / dist);
  const ground = new THREE.Vector3(to.x, 0.06, to.z);
  const originGround = new THREE.Vector3(from.x, 0.06, from.z);
  return { add: (e) => vfx.add(e), fx, from, to, scale, color, dir: dir.clone(), dist, ground, originGround };
}

/** Debris and scorch that outlive the hit. Every impact family ends with this. */
function settle(c, heavy = 1) {
  const { add, to, ground, color, scale } = c;
  add(new PointSwarm({
    pos: to, color, count: 18 * scale * heavy, life: 0.85, size: [0.05, 0.14],
    spd: [1.2, 3.4], gravity: -7, drag: 2.2, ground: true, groundY: 0.05, tex: 'dot', delay: 0.04
  }));
  if (heavy > 1.1) {
    add(new InstSwarm({
      pos: ground, color: '#8a7a5a', count: 9 * heavy, life: 1.15, geo: G.tetra(),
      size: [0.05 * scale, 0.17 * scale], spd: [1.4, 4.2], rise: 3.6, gravity: -15,
      ground: true, groundY: 0.05, spinRate: 7, blend: 'solid', delay: 0.03
    }));
    add(new GroundCrack(ground, color, scale * 0.9, 1.1));
  }
}

/** The shared core of every melee-ish landing. */
function landing(c, power = 1) {
  const { add, to, ground, color, scale } = c;
  add(new ImpactBurst(to, color, scale * power, 0.4));
  add(new Shockwave(ground, color, scale * 0.75 * power, 0.46));
  add(new Glow(to, { color, life: 0.22, s0: 0.4 * scale, s1: 2.6 * scale * power, tex: 'flare' }));
  settle(c, power);
}

const FAMILIES = {
  /* ---- blades: the cut arrives, then the wound opens ---- */
  slash(c, o = {}) {
    const { add, from, to, color, scale } = c;
    const n = o.blades ?? 1;
    for (let i = 0; i < n; i++) {
      add(new SlashArc(from, to, i === 0 ? lighten(color, 0.4) : color, scale * (1 - i * 0.12), 0.3));
    }
    add(new Streaks({
      pos: to, count: int(6 + 4 * scale), color: lighten(color, 0.55), plane: 'face',
      mode: 'burst', r0: 0.15 * scale, r1: 2.8 * scale, w: 0.035 * scale, life: 0.26, delay: 0.03
    }));
    add(new Glow(to, { color: lighten(color, 0.6), life: 0.16, s0: 0.2, s1: 1.9 * scale, tex: 'flare' }));
    add(new PointSwarm({
      pos: to, color, count: 22 * scale, life: 0.7, size: [0.04, 0.11], spd: [2.2, 5.4],
      gravity: -8, drag: 2, spread: 0.6, tex: 'spark', delay: 0.02
    }));
    settle(c, n > 1 ? 1.2 : 0.9);
    return 0.42 + n * 0.04;
  },

  /* ---- fire: it billows, it rises, it keeps burning ---- */
  flame(c) {
    const { add, from, to, dir, color, scale } = c;
    add(new Travel(from, to, {
      life: 0.16, arc: 0.3,
      mats: [{ geo: G.cone(7), color: lighten(color, 0.5), sx: 0.5 * scale, sy: 1.5 * scale, sz: 0.5 * scale }]
    }));
    add(new ImpactBurst(to, lighten(color, 0.35), scale * 1.1, 0.44, 0.14));
    add(new PointSwarm({
      pos: to, color, color2: '#ffd28a', count: 46 * scale, life: 1.1, size: [0.10, 0.34], size1: 0.02,
      spd: [1.6, 4.4], rise: 4.2, gravity: 1.6, drag: 1.1, swirl: 1.4, tex: 'smoke', delay: 0.12
    }));
    add(new PointSwarm({
      pos: to, color: '#ffe9a8', count: 26 * scale, life: 0.9, size: [0.04, 0.10],
      spd: [2.4, 6], rise: 3.2, gravity: -2.2, drag: 1.6, tex: 'spark', delay: 0.14
    }));
    add(new Shockwave(c.ground, lighten(color, 0.3), scale * 0.9, 0.5));
    settle(c, 1.1);
    return 0.56;
  },

  /* ---- ice: it forms, it shatters, the shards land and stay ---- */
  ice(c) {
    const { add, to, ground, color, scale } = c;
    add(new Glow(to, { color: '#e8fbff', life: 0.2, s0: 0.3, s1: 2.4 * scale, tex: 'flare' }));
    add(new InstSwarm({
      pos: to, color: lighten(color, 0.35), count: 16 * scale, life: 0.95, geo: G.octa(),
      size: [0.07 * scale, 0.24 * scale], spd: [2.2, 5.6], rise: 2.4, gravity: -13,
      ground: true, groundY: 0.05, spinRate: 4, blend: 'alpha', a0: 0.9
    }));
    add(new RingWave(ground, { color: '#bfeaff', life: 0.55, inner: 0.82, s1: 6.4 * scale, flat: true }));
    add(new PointSwarm({
      pos: to, color: '#ffffff', count: 30 * scale, life: 0.8, size: [0.03, 0.09],
      spd: [1.8, 4.6], gravity: -6, drag: 2.4, tex: 'spark'
    }));
    settle(c, 1);
    return 0.54;
  },

  /* ---- lightning: pre-flash, top-down strike, afterglow ---- */
  bolt(c, o = {}) {
    const { add, to, ground, color, scale } = c;
    const sky = new THREE.Vector3(to.x + (Math.random() - 0.5) * 1.2, 13 * (o.tall ? 1.4 : 1), to.z + (Math.random() - 0.5) * 1.2);
    add(new Glow(to, { color: '#ffffff', life: 0.1, s0: 0.1, s1: 1.2 * scale, tex: 'flare' }));
    add(new Bolt(sky, to, {
      color: lighten(color, 0.5), amp: 0.5 * scale, w: 0.07 * scale, branches: int(2 + 2 * scale),
      reveal: 0.09, life: 0.34, delay: 0.08
    }));
    add(new Glow(to, { color: lighten(color, 0.6), life: 0.26, s0: 0.4, s1: 3.4 * scale, tex: 'flare', delay: 0.14 }));
    add(new Shockwave(ground, color, scale * 1.1, 0.44, 0.15));
    add(new PointSwarm({
      pos: to, color: lighten(color, 0.4), count: 34 * scale, life: 0.7, size: [0.04, 0.12],
      spd: [3, 7], gravity: -9, drag: 2.6, tex: 'spark', delay: 0.15
    }));
    settle(c, 1.15);
    return 0.6;
  },

  /* ---- water: mass, not sparks ---- */
  water(c) {
    const { add, from, to, ground, color, scale } = c;
    add(new BeamCore(from, to, { color: lighten(color, 0.25), life: 0.34, w: 0.24 * scale, halo: 2.4 }));
    add(new PointSwarm({
      pos: to, color, color2: '#dff4ff', count: 40 * scale, life: 0.95, size: [0.07, 0.2],
      spd: [2, 5.2], rise: 2.6, gravity: -9, drag: 1.4, tex: 'dot', ground: true, groundY: 0.05, delay: 0.1
    }));
    add(new RingWave(ground, { color: '#dff4ff', life: 0.6, inner: 0.88, s1: 6.8 * scale, flat: true, delay: 0.1 }));
    add(new ImpactBurst(to, lighten(color, 0.4), scale * 0.85, 0.4, 0.1));
    settle(c, 1);
    return 0.52;
  },

  /* ---- earth: it comes up out of the ground ---- */
  earth(c) {
    const { add, to, ground, color, scale } = c;
    add(new RingWave(ground, { color, life: 0.5, inner: 0.8, s1: 7 * scale, flat: true }));
    add(new InstSwarm({
      pos: ground, color, count: 14 * scale, life: 1.2, geo: G.tetra(),
      size: [0.14 * scale, 0.46 * scale], spd: [1.6, 4.6], rise: 5.4, gravity: -16,
      ground: true, groundY: 0.05, spinRate: 3.4, blend: 'solid', a0: 1
    }));
    add(new GroundCrack(ground, lighten(color, 0.2), scale * 1.3, 1.2));
    add(new ImpactBurst(to, color, scale, 0.42, 0.06));
    add(new PointSwarm({
      pos: ground, color: darken(color, 0.25), count: 30 * scale, life: 1.0, size: [0.1, 0.3],
      spd: [1.4, 3.6], rise: 2.2, gravity: -5, drag: 1.6, tex: 'smoke', delay: 0.08
    }));
    return 0.6;
  },

  /* ---- wind: fast, thin, and gone ---- */
  wind(c) {
    const { add, from, to, color, scale } = c;
    add(new Streaks({
      pos: to, count: int(14 * scale), color: lighten(color, 0.4), plane: 'sphere',
      mode: 'burst', r0: 0.2, r1: 3.6 * scale, w: 0.03 * scale, life: 0.3
    }));
    add(new SlashArc(from, to, lighten(color, 0.5), scale * 0.9, 0.26));
    add(new PointSwarm({
      pos: to, color: lighten(color, 0.5), count: 24 * scale, life: 0.6, size: [0.03, 0.09],
      spd: [3.4, 7.5], gravity: -1.5, drag: 3, swirl: 2.4, tex: 'dot'
    }));
    settle(c, 0.8);
    return 0.4;
  },

  /* ---- sound: concentric distortion, no debris ---- */
  sound(c) {
    const { add, from, to, color, scale } = c;
    for (let i = 0; i < 4; i++) {
      add(new RingWave(from, {
        color, life: 0.5, inner: 0.9, s0: 0.3, s1: (2.6 + i * 1.1) * scale,
        delay: i * 0.07, face: true, a0: 0.55 - i * 0.09
      }));
    }
    add(new Glow(to, { color, life: 0.24, s0: 0.3, s1: 2.2 * scale, tex: 'flare', delay: 0.22 }));
    add(new PointSwarm({
      pos: to, color, count: 16 * scale, life: 0.55, size: [0.04, 0.1],
      spd: [1.6, 3.6], gravity: -2, drag: 2.6, tex: 'dot', delay: 0.22
    }));
    return 0.5;
  },

  /* ---- shadow: it crawls along the ground and grabs ---- */
  shadow(c) {
    const { add, originGround, ground, to, color, scale } = c;
    add(new Tendrils(originGround, ground, {
      count: int(5 + 3 * scale), seg: 9, color: darken(color, 0.1), w: 0.07 * scale,
      reveal: 0.16, riseAt: 0.55, y: 0.04, wander: 0.5, life: 0.6
    }));
    add(new Glow(to, { color: glowable(color, 0.4), life: 0.3, s0: 0.3, s1: 2.2 * scale, tex: 'flare', delay: 0.2 }));
    add(new PointSwarm({
      pos: to, color: glowable(color, 0.35), count: 26 * scale, life: 0.9, size: [0.05, 0.16],
      spd: [1.2, 3], rise: 1.6, gravity: -1, drag: 1.8, tex: 'smoke', delay: 0.2
    }));
    settle(c, 0.85);
    return 0.58;
  },

  /* ---- haki: black plates over the strike, then the shock ---- */
  haki(c) {
    const { add, to, ground, color, scale } = c;
    add(new Glow(to, { color: '#2b2d42', life: 0.16, s0: 0.6 * scale, s1: 2.0 * scale, tex: 'flare' }));
    add(new InstSwarm({
      pos: to, color: darken(color, 0.35), count: 12 * scale, life: 0.5, geo: G.hex(),
      size: [0.16 * scale, 0.42 * scale], spd: [0.8, 2.4], gravity: -2, drag: 3,
      blend: 'alpha', a0: 0.95, align: true, spinRate: 1.2
    }));
    add(new ImpactBurst(to, lighten(color, 0.55), scale * 1.25, 0.46, 0.08));
    add(new Shockwave(ground, lighten(color, 0.4), scale * 1.3, 0.55, 0.08));
    add(new RingWave(to, { color: lighten(color, 0.5), life: 0.44, inner: 0.9, s1: 5 * scale, face: true, delay: 0.08 }));
    settle(c, 1.4);
    return 0.66;
  },

  /* ---- light: it has already hit you ---- */
  light(c) {
    const { add, from, to, color, scale } = c;
    for (let i = 0; i < 4; i++) {
      add(new BeamCore(from, to, {
        color: lighten(color, 0.5), life: 0.2, w: 0.06 * scale, halo: 3, delay: i * 0.05
      }));
    }
    add(new Glow(to, { color: '#fffbe8', life: 0.3, s0: 0.3, s1: 3.4 * scale, tex: 'flare', delay: 0.1 }));
    add(new Streaks({
      pos: to, count: int(10 * scale), color: '#ffffff', plane: 'face', mode: 'burst',
      r0: 0.2, r1: 3.2 * scale, w: 0.025 * scale, life: 0.28, delay: 0.12
    }));
    return 0.48;
  },

  /* ---- toxin: heavy, low, lingering ---- */
  toxin(c) {
    const { add, to, ground, color, scale } = c;
    add(new PointSwarm({
      pos: to, color, color2: darken(color, 0.4), count: 42 * scale, life: 1.3, size: [0.14, 0.4],
      spd: [1.2, 3], rise: 1.2, gravity: 0.6, drag: 1.5, swirl: 0.9, tex: 'smoke'
    }));
    add(new RingWave(ground, { color, life: 0.7, inner: 0.85, s1: 5.6 * scale, flat: true }));
    add(new ImpactBurst(to, color, scale * 0.8, 0.4));
    add(new PointSwarm({
      pos: ground, color: lighten(color, 0.2), count: 18 * scale, life: 1.1, size: [0.06, 0.16],
      spd: [0.8, 2.2], gravity: -3, drag: 2, ground: true, groundY: 0.05, tex: 'dot', delay: 0.2
    }));
    return 0.6;
  },

  /* ---- void / spirit: it removes rather than strikes ---- */
  void_(c) {
    const { add, to, color, scale } = c;
    add(new Glow(to, { color: glowable(color, 0.5), life: 0.5, s0: 3.2 * scale, s1: 0.1, tex: 'flare', ease: Ease.inQuad }));
    add(new RingWave(to, { color: glowable(color, 0.55), life: 0.45, inner: 0.92, s0: 4 * scale, s1: 0.2, face: true }));
    add(new PointSwarm({
      pos: to, color: glowable(color, 0.5), count: 40 * scale, life: 0.55, size: [0.05, 0.14],
      spd: [4, 8], gravity: 0, drag: 0.6, tex: 'spark', shape: 'in'
    }));
    add(new ImpactBurst(to, lighten(color, 0.5), scale * 1.1, 0.42, 0.34));
    settle(c, 1.1);
    return 0.62;
  },

  /* ---- mecha: bullets, sparks, metal ---- */
  mecha(c) {
    const { add, from, to, color, scale } = c;
    add(new Travel(from, to, {
      life: 0.13,
      mats: [{ geo: G.cylT(0.4), color: lighten(color, 0.4), sx: 0.16 * scale, sy: 0.7 * scale, sz: 0.16 * scale }]
    }));
    add(new ImpactBurst(to, lighten(color, 0.4), scale, 0.4, 0.11));
    add(new PointSwarm({
      pos: to, color: '#ffd9a0', count: 34 * scale, life: 0.7, size: [0.03, 0.1],
      spd: [3, 7.5], gravity: -12, drag: 2.2, ground: true, groundY: 0.05, tex: 'spark', delay: 0.12
    }));
    add(new Shockwave(c.ground, color, scale * 0.8, 0.42, 0.11));
    settle(c, 1.1);
    return 0.5;
  },

  /* ---- beast: teeth and mass ---- */
  beast(c) {
    const { add, to, dir, color, scale } = c;
    add(new Jaws(to, { color, dir, size: 1.3 * scale, gap: 1.1, life: 0.32 }));
    add(new ImpactBurst(to, color, scale * 1.05, 0.42, 0.16));
    add(new Streaks({
      pos: to, count: int(4 + 2 * scale), color: lighten(color, 0.5), plane: 'flat',
      mode: 'burst', r0: 0.2, r1: 2.6 * scale, w: 0.05 * scale, life: 0.3, delay: 0.16
    }));
    settle(c, 1.15);
    return 0.52;
  },

  /* ---- mind: no blood, which is the frightening part ---- */
  mind(c) {
    const { add, to, color, scale } = c;
    add(new RingWave(to, { color, life: 0.4, inner: 0.94, s0: 3.2 * scale, s1: 0.4, face: true }));
    add(new Glow(to, { color, life: 0.34, s0: 0.2, s1: 2.4 * scale, tex: 'flare', delay: 0.16 }));
    add(new Streaks({
      pos: to, count: int(8 * scale), color: lighten(color, 0.4), plane: 'face',
      mode: 'converge', r0: 3 * scale, r1: 0.3, w: 0.03 * scale, life: 0.3
    }));
    add(new PointSwarm({
      pos: to, color, count: 20 * scale, life: 0.7, size: [0.04, 0.12],
      spd: [1.4, 3.4], gravity: -2, drag: 2.4, tex: 'dot', delay: 0.2
    }));
    return 0.5;
  },

  /* ---- fists ---- */
  fist(c, o = {}) {
    const { add, from, to, dir, color, scale } = c;
    const hits = o.hits || 1;
    for (let i = 0; i < hits; i++) {
      const jitter = _v2.set((Math.random() - 0.5) * 0.5, (Math.random() - 0.5) * 0.5, (Math.random() - 0.5) * 0.5);
      const p = to.clone().add(jitter);
      add(new ImpactBurst(p, color, scale * (hits > 1 ? 0.6 : 1), 0.32, i * 0.07));
      add(new Glow(p, { color: lighten(color, 0.45), life: 0.14, s0: 0.2, s1: 1.6 * scale, tex: 'flare', delay: i * 0.07 }));
    }
    add(new Shockwave(c.ground, color, scale * 0.8, 0.44, 0.02));
    add(new Streaks({
      pos: to, count: int(5 + 3 * scale), color: lighten(color, 0.4), plane: 'face',
      mode: 'burst', r0: 0.25, r1: 2.4 * scale, w: 0.045 * scale, life: 0.26
    }));
    settle(c, hits > 1 ? 1 : 1.2);
    return 0.4 + hits * 0.05;
  },

  /* ---- buffs, heals, fields ---- */
  aura(c, o = {}) {
    const { add, originGround, from, color, scale } = c;
    const up = o.down ? -1 : 1;
    for (let i = 0; i < 3; i++) {
      add(new RingWave(originGround, {
        color, life: 0.62, inner: 0.88, s0: 1.4 * scale, s1: 2.4 * scale,
        flat: true, rise: up * 2.6, delay: i * 0.11
      }));
    }
    add(new PointSwarm({
      pos: originGround, color: lighten(color, 0.3), count: 28 * scale, life: 0.9, size: [0.05, 0.14],
      spd: [0.5, 1.4], rise: up * 4.2, gravity: 0, drag: 0.8, cone: 0.5, height: 2.4, tex: 'spark'
    }));
    add(new Glow(from, { color, life: 0.4, s0: 0.4, s1: 2.2 * scale, tex: 'flare' }));
    return 0.6;
  }
};

/* ================================================================== */
/* 5. registry                                                         */
/*                                                                     */
/* Dispatch order: fx.key -> move type -> fx.shape -> melee.           */
/* A move that lands before its effect does still animates.            */
/* ================================================================== */

const F = FAMILIES;

/** Per-type default, so no move in the game is ever a grey puff. */
const BY_TYPE = {
  SLASH: (c) => F.slash(c), FIST: (c) => F.fist(c), HAKI: (c) => F.haki(c),
  FLAME: (c) => F.flame(c), FROST: (c) => F.ice(c), SEA: (c) => F.water(c),
  STORM: (c) => F.bolt(c), EARTH: (c) => F.earth(c), WIND: (c) => F.wind(c),
  SHADOW: (c) => F.shadow(c), LIGHT: (c) => F.light(c), BEAST: (c) => F.beast(c),
  MECHA: (c) => F.mecha(c), MIND: (c) => F.mind(c), TOXIN: (c) => F.toxin(c),
  SOUND: (c) => F.sound(c), SPIRIT: (c) => F.void_(c), VOID: (c) => F.void_(c)
};

/** Named effects — the moves that earn their own choreography. */
const REGISTRY = {
  // blades
  slash_single: (c) => F.slash(c), slash_triple: (c) => F.slash(c, { blades: 3 }),
  slash_projectile: (c) => F.wind(c), slash_worldsplit: (c) => F.slash(c, { blades: 2 }),
  soul_slash: (c) => F.void_(c), internal_cut: (c) => F.mind(c),
  // fists
  straight_punch: (c) => F.fist(c), stretch_punch: (c) => F.fist(c),
  flurry_punch: (c) => F.fist(c, { hits: 4 }), grapple: (c) => F.mind(c),
  quick: (c) => F.fist(c), struggle: (c) => F.fist(c),
  // elemental
  flame_punch: (c) => F.flame(c), flame_kick: (c) => F.flame(c), fire_column: (c) => F.flame(c),
  ice_spread: (c) => F.ice(c), water_shock: (c) => F.water(c),
  lightning: (c) => F.bolt(c), lightning_pillar: (c) => F.bolt(c, { tall: true }),
  sand_cyclone: (c) => F.earth(c), dragon_breath: (c) => F.flame(c),
  light_barrage: (c) => F.light(c), poison_flood: (c) => F.toxin(c),
  shadow_drain: (c) => F.shadow(c), sound_wave: (c) => F.sound(c),
  air_cannon: (c) => F.mecha(c),
  // will
  haki_coat: (c) => F.aura(c), haki_smash: (c) => F.haki(c),
  conqueror: (c) => F.haki(c), room_swap: (c) => F.mind(c),
  // utility
  buff_harden: (c) => F.aura(c), buff_speed: (c) => F.aura(c),
  heal: (c) => F.aura(c), protect: (c) => F.aura(c), shield: (c) => F.aura(c),
  screen: (c) => F.aura(c), confuse: (c) => F.mind(c), sleep: (c) => F.mind(c),
  toxic: (c) => F.toxin(c), hazard: (c) => F.earth(c), scatter: (c) => F.earth(c),
  weather_sun: (c) => F.aura(c), weather_rain: (c) => F.aura(c), weather_hail: (c) => F.aura(c),
  debuff: (c) => F.aura(c, { down: true })
};

/** Last resort: the five original generic shapes. */
const BY_SHAPE = {
  arc: (c) => F.slash(c),
  beam: (c) => F.light(c),
  burst: (c) => { landing(c, 1.2); return 0.55; },
  aura: (c) => F.aura(c),
  melee: (c) => { landing(c, 1); return 0.42; }
};

/* ================================================================== */
/* 6. VFX                                                              */
/* ================================================================== */

/** Above this many concurrent effects the oldest are evicted. */
const BUDGET = 46;

export class VFX {
  constructor(scene) {
    this.scene = scene;
    this.active = [];
    this.enabled = true;
  }

  add(e) {
    if (!e) return null;
    e.obj.frustumCulled = false;
    e.obj.traverse?.((o) => { o.frustumCulled = false; });
    this.scene.add(e.obj);
    this.active.push(e);
    if (this.active.length > BUDGET) this._evict(this.active.length - BUDGET);
    return e;
  }

  _evict(n) {
    for (let i = 0; i < n && this.active.length; i++) {
      const e = this.active.shift();
      this.scene.remove(e.obj);
      e.dispose();
    }
  }

  update(dt) {
    for (let i = this.active.length - 1; i >= 0; i--) {
      const e = this.active[i];
      let alive;
      try { alive = e.update(dt); } catch { alive = false; }
      if (!alive) {
        this.scene.remove(e.obj);
        e.dispose();
        this.active.splice(i, 1);
      }
    }
  }

  clear(deep = false) {
    for (const e of this.active) { this.scene.remove(e.obj); e.dispose(); }
    this.active.length = 0;
    if (deep) MPOOL.clear();   // pooled materials only matter across page-lifetime
  }

  /**
   * Play a move's visual.
   * @param {object} fx  the move's fx block ({key, color, shape, scale, type})
   * @param {THREE.Vector3} from attacker chest
   * @param {THREE.Vector3} to   defender chest
   * @returns {number} approximate duration in seconds
   */
  play(fx, from, to) {
    from = safe(from); to = safe(to);
    if (from.distanceToSquared(to) < 1e-4) to = to.clone().add(new THREE.Vector3(0.01, 0, 0.01));
    const c = ctx(this, fx || {}, from, to);
    const fn =
      (fx?.key && REGISTRY[fx.key]) ||
      (fx?.type && BY_TYPE[fx.type]) ||
      BY_SHAPE[fx?.shape] ||
      BY_SHAPE.melee;
    try { return fn(c) || 0.42; }
    catch { landing(c, 1); return 0.42; }   // never let an effect break a battle
  }

  impact(pos, color, power = 1) {
    pos = safe(pos);
    const c = ctx(this, { color, scale: power }, pos, pos);
    landing(c, power);
  }

  faint(pos, color) {
    pos = safe(pos);
    const ground = new THREE.Vector3(pos.x, 0.06, pos.z);
    this.add(new PointSwarm({
      pos, color, count: 70, life: 1.4, size: [0.06, 0.2],
      spd: [1.4, 4], rise: 1.6, gravity: -3, drag: 1.4, tex: 'dot'
    }));
    this.add(new Shockwave(ground, color, 1.4, 0.7));
    this.add(new Glow(pos, { color, life: 0.4, s0: 1.8, s1: 0.1, tex: 'flare' }));
  }

  heal(pos, color = '#7fffc4') {
    pos = safe(pos);
    const c = ctx(this, { color, scale: 0.95 }, pos, pos);
    F.aura(c);
  }

  statusPop(pos, color) {
    pos = safe(pos);
    this.add(new PointSwarm({
      pos, color, count: 24, life: 0.7, size: [0.05, 0.13],
      spd: [1.6, 3.6], rise: 1.4, gravity: -3, drag: 2, tex: 'spark'
    }));
    this.add(new RingWave(pos, { color, life: 0.4, inner: 0.9, s1: 1.9, face: true }));
  }
}

export {
  Effect, Prop, Glow, RingWave, PointSwarm, InstSwarm, Ribbon, Streaks, Bolt,
  Tendrils, BeamCore, Travel, Jaws, Shockwave, ImpactBurst, SlashArc, Beam,
  Particles, AuraPulse, GroundCrack, DebrisChunks, FAMILIES, REGISTRY
};
