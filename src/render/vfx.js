// Move effects. Every effect is a short-lived object with an update(dt) that
// returns false when it's finished. Owned by the VFX agent.

import * as THREE from 'three';
import { Ease } from './feel.js';

const _v = new THREE.Vector3();

/** Guard against NaN positions reaching geometry — one NaN poisons a whole buffer. */
function safe(v, fallbackY = 1.4) {
  if (!v || !Number.isFinite(v.x) || !Number.isFinite(v.y) || !Number.isFinite(v.z)) {
    return new THREE.Vector3(0, fallbackY, 0);
  }
  return v;
}

class Effect {
  constructor(obj, life) { this.obj = obj; this.life = life; this.age = 0; }
  update(dt) { this.age += dt; return this.age < this.life; }
  dispose() {
    this.obj?.traverse?.((o) => {
      o.geometry?.dispose?.();
      if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => m.dispose?.());
    });
  }
}

function additive(color, opacity = 1) {
  return new THREE.MeshBasicMaterial({
    color: new THREE.Color(color), transparent: true, opacity,
    blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide
  });
}

/* ------------------------------------------------------------------ */

class Shockwave extends Effect {
  constructor(pos, color, scale = 1, life = 0.45) {
    const geo = new THREE.RingGeometry(0.2, 0.32, 48);
    const mat = additive(color, 0.9);
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.copy(pos);
    mesh.rotation.x = -Math.PI / 2;
    super(mesh, life);
    this.scale = scale; this.mat = mat;
  }
  update(dt) {
    const alive = super.update(dt);
    const p = Math.min(1, this.age / this.life);
    const s = 0.5 + Ease.outQuart(p) * 7 * this.scale;
    this.obj.scale.setScalar(s);
    this.mat.opacity = (1 - p) * 0.9;
    return alive;
  }
}

class ImpactBurst extends Effect {
  constructor(pos, color, scale = 1, life = 0.4) {
    const g = new THREE.Group();
    const core = new THREE.Mesh(new THREE.SphereGeometry(0.35 * scale, 14, 12), additive(color, 1));
    g.add(core);
    const spikes = [];
    const n = 10;
    for (let i = 0; i < n; i++) {
      const m = new THREE.Mesh(new THREE.ConeGeometry(0.09 * scale, 0.9 * scale, 5), additive(color, 0.9));
      const a = (i / n) * Math.PI * 2 + Math.random() * 0.3;
      const el = (Math.random() - 0.5) * 1.4;
      m.position.set(Math.cos(a) * 0.3, Math.sin(el) * 0.3, Math.sin(a) * 0.3);
      m.lookAt(m.position.clone().multiplyScalar(4));
      m.rotateX(Math.PI / 2);
      spikes.push(m); g.add(m);
    }
    g.position.copy(pos);
    super(g, life);
    this.core = core; this.spikes = spikes; this.scale = scale;
  }
  update(dt) {
    const alive = super.update(dt);
    const p = Math.min(1, this.age / this.life);
    const e = Ease.outQuint(p);
    this.core.scale.setScalar(1 + e * 2.2);
    this.core.material.opacity = 1 - p;
    for (let i = 0; i < this.spikes.length; i++) {
      const s = this.spikes[i];
      s.position.setLength(0.3 + e * 2.4 * this.scale);
      s.scale.set(1 - p * 0.6, 1 + e * 1.4, 1 - p * 0.6);
      s.material.opacity = (1 - p) * 0.9;
    }
    return alive;
  }
}

class SlashArc extends Effect {
  constructor(from, to, color, scale = 1, life = 0.34) {
    const g = new THREE.Group();
    const mid = from.clone().lerp(to, 0.62);
    const len = from.distanceTo(to);
    const geo = new THREE.TorusGeometry(1.5 * scale, 0.055 * scale, 4, 32, Math.PI * 0.85);
    const mat = additive(color, 1);
    const arc = new THREE.Mesh(geo, mat);
    arc.position.copy(mid);
    arc.rotation.z = Math.PI * 0.15 + (Math.random() - 0.5) * 0.5;
    arc.rotation.y = Math.atan2(to.x - from.x, to.z - from.z);
    g.add(arc);
    // trailing glow
    const glow = new THREE.Mesh(new THREE.TorusGeometry(1.5 * scale, 0.18 * scale, 4, 32, Math.PI * 0.85), additive(color, 0.25));
    glow.position.copy(arc.position); glow.rotation.copy(arc.rotation);
    g.add(glow);
    super(g, life);
    this.arc = arc; this.glow = glow; this.len = len;
  }
  update(dt) {
    const alive = super.update(dt);
    const p = Math.min(1, this.age / this.life);
    const e = Ease.outExpo(p);
    this.arc.scale.setScalar(0.4 + e * 1.1);
    this.glow.scale.setScalar(0.4 + e * 1.2);
    this.arc.material.opacity = 1 - Ease.inQuad(p);
    this.glow.material.opacity = 0.25 * (1 - p);
    return alive;
  }
}

class Beam extends Effect {
  constructor(from, to, color, scale = 1, life = 0.42) {
    const dir = to.clone().sub(from);
    const len = dir.length();
    const geo = new THREE.CylinderGeometry(0.13 * scale, 0.30 * scale, len, 12, 1, true);
    const mat = additive(color, 1);
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.copy(from.clone().add(to).multiplyScalar(0.5));
    mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize());
    const g = new THREE.Group();
    g.add(mesh);
    const halo = new THREE.Mesh(new THREE.CylinderGeometry(0.34 * scale, 0.62 * scale, len, 12, 1, true), additive(color, 0.22));
    halo.position.copy(mesh.position); halo.quaternion.copy(mesh.quaternion);
    g.add(halo);
    super(g, life);
    this.core = mesh; this.halo = halo;
  }
  update(dt) {
    const alive = super.update(dt);
    const p = Math.min(1, this.age / this.life);
    const grow = p < 0.25 ? Ease.outQuint(p / 0.25) : 1;
    const fade = p < 0.55 ? 1 : 1 - (p - 0.55) / 0.45;
    this.core.scale.set(grow, 1, grow);
    this.halo.scale.set(grow * 1.1, 1, grow * 1.1);
    this.core.material.opacity = fade;
    this.halo.material.opacity = 0.22 * fade;
    return alive;
  }
}

class Particles extends Effect {
  constructor(pos, color, count = 60, scale = 1, life = 0.9, opts = {}) {
    // Must be an integer: a fractional count makes an undersized buffer whose
    // tail reads back NaN and poisons the bounding sphere.
    count = Math.max(1, Math.round(count));
    const geo = new THREE.BufferGeometry();
    const pts = new Float32Array(count * 3);
    const vel = [];
    for (let i = 0; i < count; i++) {
      pts[i * 3] = pos.x; pts[i * 3 + 1] = pos.y; pts[i * 3 + 2] = pos.z;
      const a = Math.random() * Math.PI * 2;
      const el = (Math.random() - 0.2) * Math.PI * 0.8;
      const sp = (1.6 + Math.random() * 4.2) * scale;
      vel.push(new THREE.Vector3(Math.cos(a) * Math.cos(el) * sp, Math.sin(el) * sp + 1.2, Math.sin(a) * Math.cos(el) * sp));
    }
    geo.setAttribute('position', new THREE.BufferAttribute(pts, 3));
    const mat = new THREE.PointsMaterial({
      color: new THREE.Color(color), size: (0.13 * scale), transparent: true,
      opacity: 1, blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true
    });
    const pointsObj = new THREE.Points(geo, mat);
    super(pointsObj, life);
    this.vel = vel; this.geo = geo; this.mat = mat;
    this.gravity = opts.gravity ?? -7;
    this.drag = opts.drag ?? 2.2;
  }
  update(dt) {
    const alive = super.update(dt);
    const p = Math.min(1, this.age / this.life);
    const arr = this.geo.attributes.position.array;
    for (let i = 0; i < this.vel.length; i++) {
      const v = this.vel[i];
      v.y += this.gravity * dt;
      v.multiplyScalar(1 - Math.min(1, this.drag * dt));
      arr[i * 3] += v.x * dt; arr[i * 3 + 1] += v.y * dt; arr[i * 3 + 2] += v.z * dt;
      if (arr[i * 3 + 1] < 0.05) { arr[i * 3 + 1] = 0.05; v.y *= -0.28; v.x *= 0.7; v.z *= 0.7; }
    }
    this.geo.attributes.position.needsUpdate = true;
    this.mat.opacity = 1 - Ease.inQuad(p);
    return alive;
  }
}

class AuraPulse extends Effect {
  constructor(pos, color, scale = 1, life = 0.7) {
    const g = new THREE.Group();
    const rings = [];
    for (let i = 0; i < 3; i++) {
      const r = new THREE.Mesh(new THREE.TorusGeometry(0.9 * scale, 0.035 * scale, 4, 40), additive(color, 0.8));
      r.rotation.x = -Math.PI / 2;
      r.position.y = i * 0.25;
      rings.push(r); g.add(r);
    }
    const column = new THREE.Mesh(new THREE.CylinderGeometry(0.9 * scale, 0.9 * scale, 3.2, 20, 1, true), additive(color, 0.16));
    column.position.y = 1.5;
    g.add(column);
    g.position.copy(pos);
    super(g, life);
    this.rings = rings; this.column = column;
  }
  update(dt) {
    const alive = super.update(dt);
    const p = Math.min(1, this.age / this.life);
    for (let i = 0; i < this.rings.length; i++) {
      const r = this.rings[i];
      const lp = Math.min(1, Math.max(0, p * 1.4 - i * 0.16));
      r.position.y = lp * 3.0;
      r.scale.setScalar(0.4 + lp * 1.2);
      r.material.opacity = 0.8 * (1 - lp);
    }
    this.column.material.opacity = 0.16 * (1 - p);
    this.column.scale.set(1 + p * 0.3, 1, 1 + p * 0.3);
    return alive;
  }
}

class GroundCrack extends Effect {
  constructor(pos, color, scale = 1, life = 1.1) {
    const g = new THREE.Group();
    for (let i = 0; i < 7; i++) {
      const a = Math.random() * Math.PI * 2;
      const len = (1.2 + Math.random() * 2.2) * scale;
      const m = new THREE.Mesh(new THREE.PlaneGeometry(0.09 * scale, len), additive(color, 0.85));
      m.rotation.x = -Math.PI / 2;
      m.rotation.z = a;
      m.position.set(Math.cos(a) * len * 0.5, 0.04, Math.sin(a) * len * 0.5);
      g.add(m);
    }
    g.position.copy(pos); g.position.y = 0.04;
    super(g, life);
  }
  update(dt) {
    const alive = super.update(dt);
    const p = Math.min(1, this.age / this.life);
    const e = Ease.outQuint(Math.min(1, p * 3));
    this.obj.scale.setScalar(e);
    this.obj.children.forEach((c) => { c.material.opacity = 0.85 * (1 - Ease.inQuad(p)); });
    return alive;
  }
}

class DebrisChunks extends Effect {
  constructor(pos, color, count = 14, scale = 1, life = 1.2) {
    count = Math.max(1, Math.round(count));
    const g = new THREE.Group();
    const mat = new THREE.MeshBasicMaterial({ color: new THREE.Color(color) });
    const items = [];
    for (let i = 0; i < count; i++) {
      const s = (0.06 + Math.random() * 0.16) * scale;
      const m = new THREE.Mesh(new THREE.TetrahedronGeometry(s), mat);
      m.position.copy(pos);
      const a = Math.random() * Math.PI * 2;
      items.push({
        m, v: new THREE.Vector3(Math.cos(a) * (1 + Math.random() * 3), 3 + Math.random() * 5, Math.sin(a) * (1 + Math.random() * 3)),
        rv: new THREE.Vector3(Math.random() * 8, Math.random() * 8, Math.random() * 8)
      });
      g.add(m);
    }
    super(g, life);
    this.items = items; this.mat = mat;
  }
  update(dt) {
    const alive = super.update(dt);
    for (const it of this.items) {
      it.v.y -= 16 * dt;
      it.m.position.addScaledVector(it.v, dt);
      it.m.rotation.x += it.rv.x * dt; it.m.rotation.y += it.rv.y * dt;
      if (it.m.position.y < 0.05) { it.m.position.y = 0.05; it.v.y *= -0.35; it.v.x *= 0.6; it.v.z *= 0.6; }
    }
    const p = Math.min(1, this.age / this.life);
    this.mat.transparent = true; this.mat.opacity = 1 - Ease.inQuad(p);
    return alive;
  }
}

/* ------------------------------------------------------------------ */
/* dispatch                                                            */
/* ------------------------------------------------------------------ */

export class VFX {
  constructor(scene) {
    this.scene = scene;
    this.active = [];
  }
  add(e) { this.scene.add(e.obj); this.active.push(e); return e; }
  update(dt) {
    for (let i = this.active.length - 1; i >= 0; i--) {
      const e = this.active[i];
      if (!e.update(dt)) {
        this.scene.remove(e.obj);
        e.dispose();
        this.active.splice(i, 1);
      }
    }
  }
  clear() {
    for (const e of this.active) { this.scene.remove(e.obj); e.dispose(); }
    this.active.length = 0;
  }

  /**
   * Play a move's visual. Returns the approximate duration in seconds.
   * @param {object} fx    move.fx block
   * @param {THREE.Vector3} from attacker chest position
   * @param {THREE.Vector3} to   defender chest position
   */
  play(fx, from, to) {
    from = safe(from); to = safe(to);
    if (from.distanceToSquared(to) < 1e-4) to = to.clone().add(new THREE.Vector3(0.01, 0, 0.01));
    const color = fx?.color || '#ffffff';
    const scale = fx?.scale || 1;
    const shape = fx?.shape || 'melee';

    switch (shape) {
      case 'arc':
        this.add(new SlashArc(from, to, color, scale));
        this.add(new Particles(to, color, 40 * scale, scale, 0.7));
        return 0.45;
      case 'beam':
        this.add(new Beam(from, to, color, scale));
        this.add(new ImpactBurst(to, color, scale * 0.9));
        return 0.5;
      case 'burst':
        this.add(new ImpactBurst(to, color, scale * 1.2));
        this.add(new Shockwave(new THREE.Vector3(to.x, 0.06, to.z), color, scale));
        this.add(new Particles(to, color, 70 * scale, scale, 1.0));
        return 0.55;
      case 'aura':
        this.add(new AuraPulse(new THREE.Vector3(from.x, 0.06, from.z), color, scale));
        return 0.6;
      case 'melee':
      default:
        this.add(new ImpactBurst(to, color, scale));
        this.add(new Shockwave(new THREE.Vector3(to.x, 0.06, to.z), color, scale * 0.7));
        this.add(new Particles(to, color, 34 * scale, scale, 0.7));
        return 0.4;
    }
  }

  impact(pos, color, power = 1) {
    pos = safe(pos);
    this.add(new ImpactBurst(pos, color, power));
    this.add(new Shockwave(new THREE.Vector3(pos.x, 0.06, pos.z), color, power * 0.8));
    if (power > 1.3) {
      this.add(new GroundCrack(new THREE.Vector3(pos.x, 0.04, pos.z), color, power));
      this.add(new DebrisChunks(new THREE.Vector3(pos.x, 0.2, pos.z), '#8a7a5a', 14, power));
    }
  }

  faint(pos, color) {
    pos = safe(pos);
    this.add(new Particles(pos, color, 90, 1.4, 1.4, { gravity: -3 }));
    this.add(new Shockwave(new THREE.Vector3(pos.x, 0.06, pos.z), color, 1.4, 0.7));
  }

  heal(pos, color = '#7fffc4') {
    pos = safe(pos);
    this.add(new AuraPulse(new THREE.Vector3(pos.x, 0.06, pos.z), color, 0.9, 0.8));
  }

  statusPop(pos, color) {
    pos = safe(pos);
    this.add(new Particles(pos, color, 26, 0.7, 0.7));
  }
}

export { Shockwave, ImpactBurst, SlashArc, Beam, Particles, AuraPulse, GroundCrack, DebrisChunks };
