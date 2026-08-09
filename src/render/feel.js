// Game feel: easing, tweening, hitstop, screen shake, time scale.
// Everything that makes a hit land in the body rather than the spreadsheet.

export const Ease = {
  linear: (t) => t,
  inQuad: (t) => t * t,
  outQuad: (t) => t * (2 - t),
  inOutQuad: (t) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t),
  outCubic: (t) => 1 - Math.pow(1 - t, 3),
  inCubic: (t) => t * t * t,
  outQuart: (t) => 1 - Math.pow(1 - t, 4),
  outQuint: (t) => 1 - Math.pow(1 - t, 5),
  outExpo: (t) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t)),
  inExpo: (t) => (t === 0 ? 0 : Math.pow(2, 10 * t - 10)),
  outBack: (t) => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); },
  inBack: (t) => { const c1 = 1.70158, c3 = c1 + 1; return c3 * t * t * t - c1 * t * t; },
  outElastic: (t) => {
    const c4 = (2 * Math.PI) / 3;
    return t === 0 ? 0 : t === 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
  },
  outBounce: (t) => {
    const n1 = 7.5625, d1 = 2.75;
    if (t < 1 / d1) return n1 * t * t;
    if (t < 2 / d1) return n1 * (t -= 1.5 / d1) * t + 0.75;
    if (t < 2.5 / d1) return n1 * (t -= 2.25 / d1) * t + 0.9375;
    return n1 * (t -= 2.625 / d1) * t + 0.984375;
  },
  anticipate: (t) => (t < 0.25 ? -0.35 * Math.sin((t / 0.25) * Math.PI) : Ease.outQuint((t - 0.25) / 0.75))
};

export class Tweener {
  constructor() { this.items = []; }
  to(obj, props, ms, ease = Ease.outQuad, onDone = null) {
    const from = {};
    for (const k of Object.keys(props)) from[k] = obj[k];
    const item = { obj, from, to: props, ms, t: 0, ease, onDone, done: false };
    this.items.push(item);
    return item;
  }
  /** tween along an arbitrary setter, 0..1 */
  ramp(ms, fn, ease = Ease.linear, onDone = null) {
    const item = { fn, ms, t: 0, ease, onDone, done: false };
    this.items.push(item);
    return item;
  }
  update(dt) {
    for (let i = this.items.length - 1; i >= 0; i--) {
      const it = this.items[i];
      it.t += dt * 1000;
      const p = Math.min(1, it.ms <= 0 ? 1 : it.t / it.ms);
      const e = it.ease(p);
      if (it.fn) it.fn(e, p);
      else for (const k of Object.keys(it.to)) it.obj[k] = it.from[k] + (it.to[k] - it.from[k]) * e;
      if (p >= 1) { it.done = true; it.onDone?.(); this.items.splice(i, 1); }
    }
  }
  clear() { this.items.length = 0; }
  get busy() { return this.items.length > 0; }
}

export class Feel {
  constructor() {
    this.hitstopMs = 0;
    this.timeScale = 1;
    this.shake = { amp: 0, decay: 6, freq: 34, t: 0 };
    this.flash = { a: 0, color: '#ffffff' };
    this.chroma = 0;
    this.zoomPunch = 0;
    this.tw = new Tweener();
    this.reduced = false;
  }

  hitstop(ms) { if (this.reduced) ms *= 0.35; this.hitstopMs = Math.max(this.hitstopMs, ms); }
  addShake(amp, decay = 6) { if (this.reduced) amp *= 0.3; this.shake.amp = Math.max(this.shake.amp, amp); this.shake.decay = decay; }
  screenFlash(color = '#ffffff', a = 0.6) { if (this.reduced) a *= 0.4; this.flash.color = color; this.flash.a = Math.max(this.flash.a, a); }
  punchZoom(v = 0.06) { if (this.reduced) v *= 0.3; this.zoomPunch = Math.max(this.zoomPunch, v); }
  slowmo(scale, ms) {
    this.timeScale = scale;
    this.tw.ramp(ms, (e) => { this.timeScale = scale + (1 - scale) * e; }, Ease.inQuad, () => { this.timeScale = 1; });
  }

  /** @returns {number} effective dt for the rest of the frame */
  update(rawDt) {
    this.tw.update(rawDt);
    if (this.hitstopMs > 0) {
      this.hitstopMs -= rawDt * 1000;
      this.shake.t += rawDt;
      return 0;
    }
    const dt = rawDt * this.timeScale;
    this.shake.t += dt;
    this.shake.amp = Math.max(0, this.shake.amp - this.shake.amp * this.shake.decay * dt - 0.02 * dt);
    if (this.shake.amp < 0.0005) this.shake.amp = 0;
    this.flash.a = Math.max(0, this.flash.a - dt * 3.2);
    this.zoomPunch = Math.max(0, this.zoomPunch - this.zoomPunch * 9 * dt);
    this.chroma = Math.max(0, this.chroma - dt * 2);
    return dt;
  }

  shakeOffset() {
    if (this.shake.amp <= 0) return [0, 0, 0];
    const t = this.shake.t * this.shake.freq;
    // Two out-of-phase sines per axis reads as impact, not vibration.
    return [
      this.shake.amp * (Math.sin(t * 1.0) * 0.6 + Math.sin(t * 2.3 + 1.7) * 0.4),
      this.shake.amp * (Math.sin(t * 1.4 + 0.9) * 0.6 + Math.sin(t * 3.1) * 0.4),
      this.shake.amp * 0.35 * Math.sin(t * 0.8 + 2.1)
    ];
  }
}

/** Damped spring — for HP bars and anything that should feel physical. */
export class Spring {
  constructor(value = 0, stiffness = 120, damping = 18) {
    this.value = value; this.target = value; this.vel = 0;
    this.k = stiffness; this.d = damping;
  }
  set(v) { this.target = v; }
  snap(v) { this.value = this.target = v; this.vel = 0; }
  update(dt) {
    const step = Math.min(dt, 1 / 60);
    let remaining = dt;
    while (remaining > 0) {
      const h = Math.min(step, remaining);
      const a = (this.target - this.value) * this.k - this.vel * this.d;
      this.vel += a * h;
      this.value += this.vel * h;
      remaining -= h;
    }
    return this.value;
  }
  get settled() { return Math.abs(this.target - this.value) < 0.0005 && Math.abs(this.vel) < 0.005; }
}
