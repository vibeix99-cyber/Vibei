// Game feel: easing, tweening, hitstop, screen shake, time scale.
// Everything that makes a hit land in the body rather than the spreadsheet.
//
// Design notes for anyone reading this later:
//
//  * Shake is an *envelope*, not a per-frame exponential nibble. An impact has a
//    sharp directional kick in the first ~40 ms, then a rattle that decays on a
//    curve and drops in frequency as it dies. Linear decay reads as a vibrating
//    phone; this reads as something heavy hitting something else.
//  * Flash has a duration, not a global fade rate. A hit flash should be 2-5
//    frames — long enough to register, short enough that it never washes the
//    frame out. Colour comes from the move, not from a fixed white.
//  * Hitstop returns dt = 0 from update(), so the *whole* game clock stops —
//    beats, tweens, VFX, HP springs. Shake keeps advancing during the freeze, so
//    a frozen frame still rattles. That combination is the whole trick.
//  * `reduced` is not "the same thing but smaller". Shake, flash, chroma and
//    slow-mo are switched off completely; hitstop collapses to zero. What
//    survives is everything that carries *information* (numbers, HP, VFX).

export const Ease = {
  linear: (t) => t,
  inQuad: (t) => t * t,
  outQuad: (t) => t * (2 - t),
  inOutQuad: (t) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t),
  outCubic: (t) => 1 - Math.pow(1 - t, 3),
  inCubic: (t) => t * t * t,
  inOutCubic: (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
  inQuart: (t) => t * t * t * t,
  outQuart: (t) => 1 - Math.pow(1 - t, 4),
  inQuint: (t) => t * t * t * t * t,
  outQuint: (t) => 1 - Math.pow(1 - t, 5),
  outSextic: (t) => 1 - Math.pow(1 - t, 6),
  outExpo: (t) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t)),
  inExpo: (t) => (t === 0 ? 0 : Math.pow(2, 10 * t - 10)),
  outSine: (t) => Math.sin((t * Math.PI) / 2),
  inSine: (t) => 1 - Math.cos((t * Math.PI) / 2),
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
  anticipate: (t) => (t < 0.25 ? -0.35 * Math.sin((t / 0.25) * Math.PI) : Ease.outQuint((t - 0.25) / 0.75)),

  /** 0 → 1 → 0. One clean pulse; the shape of a punch that returns. */
  pulse: (t) => Math.sin(Math.PI * Math.min(1, Math.max(0, t))),
  /** Snap out, crawl back. Recoil: the body leaves fast and returns slowly. */
  recoil: (t) => (t < 0.24 ? Ease.outQuint(t / 0.24) : 1 - Ease.inOutCubic((t - 0.24) / 0.76)),
  /** Wind back, hold, then explode forward. Anticipation for a heavy swing. */
  windup: (t) => {
    if (t < 0.34) return -Ease.outCubic(t / 0.34);
    if (t < 0.48) return -1;                              // the hold — this is the anticipation
    return -1 + 2 * Ease.inQuint((t - 0.48) / 0.52);
  },
  /** Fast, then agonisingly slow. The HP bar approaching zero. */
  agony: (t) => 1 - Math.pow(1 - t, 5.5)
};

/** Clamp helper used all over the beat code. */
export const clamp01 = (t) => (t < 0 ? 0 : t > 1 ? 1 : t);

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
  cancel(item) {
    const i = this.items.indexOf(item);
    if (i >= 0) this.items.splice(i, 1);
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

const FRAME = 1000 / 60;

/**
 * Impact tiers. The point of a table rather than a formula is that the tiers are
 * *categorical*: a graze has no screen effects at all, and the top tier has
 * effects a graze never gets. Scaling one curve from 0 to 1 would make every hit
 * feel like a weaker version of the same hit, which is the failure mode.
 *
 *   sev = damage / maxHp
 */
export const HIT_TIERS = [
  { // 0 — graze: felt in the body, not on the screen. No shake, no flash, no freeze.
    id: 'graze', maxSev: 0.09,
    hitstop: 0, shake: 0, shakeDur: 0, flash: 0, zoom: 0, slowmo: 0,
    kb: 0.20, drain: 0.26, drainEase: Ease.outQuad, sfx: 'light'
  },
  { // 1 — chip: two frames of stop so the contact registers. Still no flash.
    id: 'chip', maxSev: 0.20,
    hitstop: 2 * FRAME, shake: 0.055, shakeDur: 0.24, flash: 0, zoom: 0.10, slowmo: 0,
    kb: 0.38, drain: 0.34, drainEase: Ease.outCubic, sfx: 'med'
  },
  { // 2 — solid: the standard hit. Freeze, shake, no wash-out.
    id: 'solid', maxSev: 0.36,
    hitstop: 3 * FRAME, shake: 0.115, shakeDur: 0.36, flash: 0.10, flashMs: 90, zoom: 0.20, slowmo: 0,
    kb: 0.62, drain: 0.46, drainEase: Ease.outCubic, sfx: 'med'
  },
  { // 3 — heavy: now the screen participates. Colour comes from the move.
    id: 'heavy', maxSev: 0.55,
    hitstop: 4.5 * FRAME, shake: 0.215, shakeDur: 0.52, flash: 0.24, flashMs: 130, zoom: 0.30,
    slowmo: 0, kb: 0.95, drain: 0.62, drainEase: Ease.outQuart, sfx: 'heavy'
  },
  { // 4 — devastating: freeze, slam, and a beat of slow motion to sell the weight.
    id: 'devastating', maxSev: Infinity,
    hitstop: 6 * FRAME, shake: 0.34, shakeDur: 0.72, flash: 0.36, flashMs: 170, zoom: 0.40,
    slowmo: 0.45, slowmoMs: 260, kb: 1.30, drain: 0.80, drainEase: Ease.outQuart, sfx: 'heavy'
  }
];

export function tierFor(sev) {
  for (let i = 0; i < HIT_TIERS.length; i++) if (sev < HIT_TIERS[i].maxSev) return i;
  return HIT_TIERS.length - 1;
}

export class Feel {
  constructor() {
    this.hitstopMs = 0;
    this.timeScale = 1;
    // amp/decay/freq/t are kept as fields because scene.js and older call sites
    // read them; the envelope fields below are what actually drive the offset.
    this.shake = { amp: 0, decay: 6, freq: 34, t: 0, amp0: 0, age: 0, dur: 0, dirX: 0, dirY: 0, kick: 0 };
    this.flash = { a: 0, color: '#ffffff', a0: 0, age: 0, dur: 0.18 };
    this.chroma = 0;
    this.zoomPunch = 0;
    this.tw = new Tweener();
    this.reduced = false;
    this._slowRamp = null;
  }

  /* ---------------- primitives ---------------- */

  /** Freeze the entire game clock. Measured in ms; think in frames (16.7 ms). */
  hitstop(ms) {
    if (this.reduced) return;                       // a stutter with no shake is just jank
    this.hitstopMs = Math.max(this.hitstopMs, ms);
  }
  /** Convenience: hitstop measured the way animators measure it. */
  freezeFrames(n) { this.hitstop(n * FRAME); }

  /**
   * @param {number} amp
   * @param {number|{dur?:number,freq?:number,dir?:[number,number],kick?:number}} opts
   *        A bare number is the legacy `decay` argument and is converted to a duration.
   */
  addShake(amp, opts = 6) {
    if (this.reduced || amp <= 0) return;
    let dur, freq = 34, dir = null, kick = 0.55;
    if (typeof opts === 'number') { dur = 3 / Math.max(0.5, opts); this.shake.decay = opts; }
    else { dur = opts.dur ?? 0.4; freq = opts.freq ?? 34; dir = opts.dir || null; kick = opts.kick ?? 0.55; }
    const s = this.shake;
    // A bigger impulse always wins; a smaller one during a big shake is swallowed.
    if (amp < s.amp0 * (1 - clamp01(s.age / Math.max(0.001, s.dur)))) return;
    s.amp0 = amp; s.amp = amp; s.age = 0; s.dur = dur; s.freq = freq;
    s.dirX = dir ? dir[0] : 0; s.dirY = dir ? dir[1] : 0; s.kick = dir ? kick : 0;
  }

  /** Short, coloured, and gone. `ms` is the whole life of the flash. */
  screenFlash(color = '#ffffff', a = 0.6, ms = 160) {
    if (this.reduced || a <= 0) return;
    const f = this.flash;
    if (a < f.a0 * (1 - clamp01(f.age / Math.max(0.001, f.dur)))) return;
    f.color = color; f.a0 = a; f.a = a; f.age = 0; f.dur = Math.max(0.03, ms / 1000);
  }

  punchZoom(v = 0.06) { if (this.reduced) return; this.zoomPunch = Math.max(this.zoomPunch, v); }

  slowmo(scale, ms, ease = Ease.inQuad) {
    if (this.reduced || scale >= 1 || ms <= 0) return;
    if (this._slowRamp) this.tw.cancel(this._slowRamp);
    this.timeScale = scale;
    this._slowRamp = this.tw.ramp(ms, (e) => { this.timeScale = scale + (1 - scale) * e; },
      ease, () => { this.timeScale = 1; this._slowRamp = null; });
  }

  /** Drop everything on the floor — used when a battle is torn down mid-beat. */
  reset() {
    this.hitstopMs = 0; this.timeScale = 1; this.zoomPunch = 0; this.chroma = 0;
    this.shake.amp = this.shake.amp0 = 0; this.shake.age = 0; this.shake.dur = 0;
    this.flash.a = this.flash.a0 = 0;
    this.tw.clear(); this._slowRamp = null;
  }

  /* ---------------- the tuned impact ---------------- */

  /**
   * Everything the screen does for one hit, in one call.
   * @param {number} sev            damage / maxHp
   * @param {object} o
   *   @param {boolean} o.crit
   *   @param {number}  o.eff       type effectiveness multiplier
   *   @param {boolean} o.lethal    this hit takes the target to 0
   *   @param {string}  o.color     move colour, used for the flash
   *   @param {[number,number]} o.dir  screen-space direction of the blow
   *   @param {number}  o.speed    battle speed multiplier — every *duration* here
   *                               divides by it, so 2× and 4× stay proportional
   *                               instead of being dominated by fixed freezes.
   * @returns {object} the resolved tier (so the caller can time knockback/drain to it)
   */
  impact(sev, o = {}) {
    let t = tierFor(sev);
    // A crit is not "a hit with bigger numbers" — it is promoted a whole tier, and
    // a lethal blow is always top tier. That is what makes the two feel different
    // in kind rather than in degree.
    if (o.crit) t = Math.min(HIT_TIERS.length - 1, t + 1);
    if (o.lethal) t = HIT_TIERS.length - 1;
    const P = HIT_TIERS[t];

    const supered = (o.eff ?? 1) > 1;
    const dir = o.dir || [0, 0];
    const k = 1 / Math.max(0.25, o.speed || 1);

    if (P.hitstop) this.hitstop(P.hitstop * (o.crit ? 1.25 : 1) * k);
    if (P.shake) {
      this.addShake(P.shake * (supered ? 1.12 : 1), {
        dur: P.shakeDur * k, dir,
        // Big hits rumble low and long; small ones tick high and short.
        freq: 46 - t * 3.5,
        kick: 0.5 + t * 0.14
      });
    }
    if (P.flash) {
      // Crits are always gold — the colour *is* the information.
      const col = o.crit ? '#ffe36b' : (o.color || '#ffffff');
      this.screenFlash(col, P.flash * (o.crit ? 1.25 : 1), (P.flashMs ?? 120) * k);
    }
    if (P.zoom) this.punchZoom(P.zoom * 0.16);
    if (P.slowmo) this.slowmo(P.slowmo, P.slowmoMs * k);
    if (t >= 3) this.chroma = Math.max(this.chroma, 0.3 + (t - 3) * 0.4);

    return { ...P, tier: t, crit: !!o.crit, lethal: !!o.lethal };
  }

  /** The numbers for a hit without firing it — used to pre-plan a beat's length. */
  planImpact(sev, o = {}) {
    let t = tierFor(sev);
    if (o.crit) t = Math.min(HIT_TIERS.length - 1, t + 1);
    if (o.lethal) t = HIT_TIERS.length - 1;
    return { ...HIT_TIERS[t], tier: t };
  }

  /* ---------------- clock ---------------- */

  /** @returns {number} effective dt for the rest of the frame */
  update(rawDt) {
    this.tw.update(rawDt);
    if (this.hitstopMs > 0) {
      this.hitstopMs -= rawDt * 1000;
      // The world is frozen but the *camera* is not: a held frame that rattles is
      // the difference between "the game hitched" and "that hurt".
      this.shake.t += rawDt;
      this.shake.age += rawDt * 0.35;
      return 0;
    }
    const dt = rawDt * this.timeScale;
    this.shake.t += dt;

    const s = this.shake;
    if (s.amp0 > 0) {
      s.age += dt;
      const p = clamp01(s.age / Math.max(0.001, s.dur));
      s.amp = s.amp0 * Math.pow(1 - p, 2.3);
      if (p >= 1) { s.amp = 0; s.amp0 = 0; }
    } else s.amp = 0;

    const f = this.flash;
    if (f.a0 > 0) {
      f.age += dt;
      const p = clamp01(f.age / f.dur);
      // Hold hot for the first fifth, then fall off fast. Reads as a strobe, not a fade.
      f.a = f.a0 * (p < 0.2 ? 1 : Math.pow(1 - (p - 0.2) / 0.8, 1.7));
      if (p >= 1) { f.a = 0; f.a0 = 0; }
    } else f.a = 0;

    this.zoomPunch = Math.max(0, this.zoomPunch - this.zoomPunch * 9 * dt);
    this.chroma = Math.max(0, this.chroma - dt * 3.4);
    return dt;
  }

  shakeOffset() {
    const s = this.shake;
    if (this.reduced || s.amp <= 0.0004) return [0, 0, 0];
    const t = s.t * s.freq;
    const p = clamp01(s.age / Math.max(0.001, s.dur));
    // Frequency drops as the rattle dies — heavy things ring low as they settle.
    const w = 1 - p * 0.42;
    // A directional slam in the first instants, then an omnidirectional rattle.
    const kick = s.kick * s.amp0 * Math.pow(1 - clamp01(s.age / 0.075), 2);
    const a = s.amp;
    return [
      s.dirX * kick + a * (Math.sin(t * w) * 0.6 + Math.sin(t * 2.3 * w + 1.7) * 0.4),
      s.dirY * kick + a * (Math.sin(t * 1.4 * w + 0.9) * 0.6 + Math.sin(t * 3.1 * w) * 0.4),
      a * 0.35 * Math.sin(t * 0.8 * w + 2.1)
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
  /** Retune in flight — a bar that has to travel further should feel heavier. */
  tune(stiffness, damping) { this.k = stiffness; this.d = damping; return this; }
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
