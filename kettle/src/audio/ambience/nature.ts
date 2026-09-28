/**
 * Nature ambiences: rain on the window, crackling fire, forest breeze and
 * brown noise. Continuous beds use long decorrelated stereo noise loops at
 * slightly different playback rates (so loop points never line up) shaped by
 * random-walk filters/gains; discrete detail (droplets, crackles, birds) is
 * scheduled as Poisson events. OWNER: audio area.
 */
import { chance, logRange, pick, rint, rrange, weighted } from '../dsp';
import { loopNoise, startLoop, tone } from '../instruments';
import {
  BaseAmbient,
  Drift,
  EventClock,
  crackleGrains,
  dripGrains,
  dropletGrains,
  popGrains,
  type AmbientDest,
} from './common';

// ---------------------------------------------------------------------------
// Rain on the window
// ---------------------------------------------------------------------------

export class Rain extends BaseAmbient {
  readonly kind = 'rain';
  private drifts: Drift[] = [];
  private dropClock!: EventClock;
  private dripClock!: EventClock;
  private dropLanes: GainNode[] = [];
  private density = 1;
  private densityT = 0;

  constructor(d: AmbientDest) {
    super(d);
  }

  start(at: number): void {
    const { rng } = this;
    // Steady wash, muffled by the glass.
    const wash = this.own(loopNoise(this.o, 'pink', { seconds: 9.7, seed: 21, rate: 0.97 }));
    const washHp = this.filter('highpass', 420, 0.6);
    const washLp = this.filter('lowpass', 3000, 0.5);
    const washG = this.gain(0.5);
    this.chain(wash, washHp, washLp, washG, this.output);
    this.drifts.push(new Drift(washG.gain, rng, { min: 0.42, max: 0.6, minDur: 5, maxDur: 12 }, at));
    this.drifts.push(new Drift(washLp.frequency, rng, { min: 2400, max: 3400, minDur: 6, maxDur: 14 }, at));

    // Soft patter layer — adds the "sizzle" of drops on the pane, kept dark.
    const pat = this.own(loopNoise(this.o, 'white', { seconds: 7.3, seed: 22, rate: 1.03 }));
    const patBp = this.filter('bandpass', 1900, 0.6);
    const patLp = this.filter('lowpass', 3800, 0.5);
    const patG = this.gain(0.035);
    this.chain(pat, patBp, patLp, patG, this.output);
    this.drifts.push(new Drift(patG.gain, rng, { min: 0.022, max: 0.045, minDur: 3, maxDur: 8 }, at));

    // Low body of the shower.
    const body = this.own(loopNoise(this.o, 'brown', { seconds: 8.9, seed: 23, rate: 1.01 }));
    const bodyLp = this.filter('lowpass', 420, 0.5);
    const bodyG = this.gain(0.12);
    this.chain(body, bodyLp, bodyG, this.output);

    for (const s of [wash, pat, body]) startLoop(s, at, rng);

    const dropBus = this.chain(this.filter('lowpass', 4200, 0.5), this.output);
    this.dropLanes = this.lanes(dropBus, [-0.85, -0.45, -0.1, 0.2, 0.5, 0.85]);
    this.densityT = at;
    this.dropClock = new EventClock(rng, () => 16 * this.density, at);
    this.dripClock = new EventClock(rng, () => 0.3, at + 1.2);
  }

  schedule(from: number, to: number): void {
    const { rng } = this;
    for (const d of this.drifts) d.schedule(to + 1);
    // Droplet density slowly wanders so the shower breathes.
    while (this.densityT < to) {
      this.densityT += rrange(rng, 4, 10);
      this.density = rrange(rng, 0.6, 1.4);
    }
    const drops = dropletGrains(this.ctx);
    this.dropClock.run(from, to, (t) => {
      const g = logRange(rng, 0.03, 0.22);
      this.grain(pick(rng, drops), t, g, pick(rng, this.dropLanes), rrange(rng, 0.8, 1.25));
    });
    const drips = dripGrains(this.ctx);
    this.dripClock.run(from, to, (t) => {
      const lane = pick(rng, this.dropLanes);
      const buf = pick(rng, drips);
      const rate = rrange(rng, 0.85, 1.15);
      this.grain(buf, t, logRange(rng, 0.14, 0.3), lane, rate);
      if (chance(rng, 0.35)) this.grain(buf, t + rrange(rng, 0.25, 0.7), logRange(rng, 0.08, 0.18), lane, rate * rrange(rng, 0.9, 0.97));
    });
  }
}

// ---------------------------------------------------------------------------
// Crackling fire
// ---------------------------------------------------------------------------

export class Fire extends BaseAmbient {
  readonly kind = 'fire';
  private drifts: Drift[] = [];
  private crackClock!: EventClock;
  private popClock!: EventClock;
  private logClock!: EventClock;
  private lanes_: GainNode[] = [];
  private intensity = 1;
  private intensityT = 0;

  constructor(d: AmbientDest) {
    super(d);
  }

  start(at: number): void {
    const { rng } = this;
    // Low roar that breathes.
    const roar = this.own(loopNoise(this.o, 'brown', { seconds: 8.9, seed: 31, rate: 0.98 }));
    const roarLp = this.filter('lowpass', 240, 0.6);
    const roarG = this.gain(0.14);
    this.chain(roar, roarLp, roarG, this.output);
    this.drifts.push(new Drift(roarG.gain, rng, { min: 0.09, max: 0.2, minDur: 0.4, maxDur: 1.8 }, at));

    // Flame body — soft mid "whoosh" of the flames licking.
    const flame = this.own(loopNoise(this.o, 'pink', { seconds: 9.7, seed: 32, rate: 1.02 }));
    const flameBp = this.filter('bandpass', 420, 0.7);
    const flameG = this.gain(0.28);
    this.chain(flame, flameBp, flameG, this.output);
    this.drifts.push(new Drift(flameG.gain, rng, { min: 0.14, max: 0.4, minDur: 0.3, maxDur: 1.2 }, at));
    this.drifts.push(new Drift(flameBp.frequency, rng, { min: 380, max: 760, minDur: 0.8, maxDur: 2.5 }, at));

    for (const s of [roar, flame]) startLoop(s, at, rng);

    const crackBus = this.chain(this.filter('lowpass', 5000, 0.5), this.output);
    this.lanes_ = this.lanes(crackBus, [-0.5, -0.25, 0, 0.2, 0.45]);
    this.intensityT = at;
    this.crackClock = new EventClock(rng, () => 5 * this.intensity, at + 0.2);
    this.popClock = new EventClock(rng, () => 0.16, at + 1.5);
    this.logClock = new EventClock(rng, () => 1 / 35, at + 12);
  }

  private crackle(t: number, gainScale = 1): void {
    const { rng } = this;
    const grains = crackleGrains(this.ctx);
    const lane = pick(rng, this.lanes_);
    this.grain(pick(rng, grains), t, logRange(rng, 0.02, 0.18) * gainScale, lane, rrange(rng, 0.8, 1.2));
    // Crackles come in little clusters.
    let tt = t;
    while (chance(rng, 0.45)) {
      tt += logRange(rng, 0.008, 0.07);
      this.grain(pick(rng, grains), tt, logRange(rng, 0.015, 0.1) * gainScale, lane, rrange(rng, 0.8, 1.25));
    }
  }

  schedule(from: number, to: number): void {
    const { rng } = this;
    for (const d of this.drifts) d.schedule(to + 1);
    while (this.intensityT < to) {
      this.intensityT += rrange(rng, 2, 7);
      this.intensity = weighted(rng, [
        [0.5, 2],
        [1, 3],
        [1.8, 1],
      ] as const);
    }
    this.crackClock.run(from, to, (t) => this.crackle(t));
    const pops = popGrains(this.ctx);
    this.popClock.run(from, to, (t) => {
      this.grain(pick(rng, pops), t, logRange(rng, 0.12, 0.26), pick(rng, this.lanes_), rrange(rng, 0.85, 1.15));
    });
    // Every now and then a log settles: a soft thunk and a flurry of sparks.
    this.logClock.run(from, to, (t) => {
      tone({ ...this.o, out: this.output }, t, 95, { gain: 0.16, attack: 0.004, t60: 0.3, glide: 0.7, glideTime: 0.12 }, this.output);
      const n = rint(rng, 5, 10);
      for (let i = 0; i < n; i++) this.crackle(t + rrange(rng, 0.02, 0.6), 0.8);
    });
  }
}

// ---------------------------------------------------------------------------
// Forest breeze
// ---------------------------------------------------------------------------

type Bird = 'warbler' | 'whistler' | 'dove';

export class Forest extends BaseAmbient {
  readonly kind = 'forest';
  private drifts: Drift[] = [];
  private birdClock!: EventClock;
  private birdBus!: GainNode;

  constructor(d: AmbientDest) {
    super(d);
  }

  start(at: number): void {
    const { rng, ctx } = this;
    // One shared gust signal drives wind + leaves so they swell together.
    const gust = this.own(ctx.createConstantSource());
    this.drifts.push(new Drift(gust.offset, rng, { min: 0.2, max: 1, minDur: 2.5, maxDur: 8, skew: 1.4 }, at, 0.45));
    const gustSq = ctx.createWaveShaper();
    const curve = new Float32Array(257);
    for (let i = 0; i < curve.length; i++) {
      const x = (i / (curve.length - 1)) * 2 - 1;
      curve[i] = x > 0 ? x * x : 0;
    }
    gustSq.curve = curve;
    gust.connect(gustSq);

    // Wind body.
    const wind = this.own(loopNoise(this.o, 'pink', { seconds: 9.7, seed: 41, rate: 0.96 }));
    const windBp = this.filter('bandpass', 700, 0.6);
    const windLp = this.filter('lowpass', 2200, 0.5);
    const windG = this.gain(0.03);
    this.chain(wind, this.filter('highpass', 150, 0.6), windBp, windLp, windG, this.output);
    gust.connect(this.gain(0.42, windG.gain));
    this.drifts.push(new Drift(windBp.frequency, rng, { min: 420, max: 1000, minDur: 3, maxDur: 9 }, at));

    // Low wind.
    const low = this.own(loopNoise(this.o, 'brown', { seconds: 8.9, seed: 42, rate: 1.02 }));
    const lowLp = this.filter('lowpass', 200, 0.5);
    const lowG = this.gain(0.03);
    this.chain(low, lowLp, lowG, this.output);
    gust.connect(this.gain(0.1, lowG.gain));

    // Leaves: brighter rustle that only really appears at gust peaks, with flutter.
    const leaves = this.own(loopNoise(this.o, 'white', { seconds: 7.3, seed: 43, rate: 1.04 }));
    const leavesBp = this.filter('bandpass', 2300, 0.7);
    const leavesLp = this.filter('lowpass', 4200, 0.5);
    const leavesG = this.gain(0.004);
    this.chain(leaves, leavesBp, leavesLp, leavesG, this.output);
    gustSq.connect(this.gain(0.05, leavesG.gain));
    for (const [f, depth] of [
      [4.7, 0.006],
      [7.9, 0.005],
    ] as const) {
      const lfo = this.own(ctx.createOscillator());
      lfo.frequency.value = f;
      lfo.connect(this.gain(depth, leavesG.gain));
      lfo.start(at);
    }

    for (const s of [wind, low, leaves]) startLoop(s, at, rng);
    gust.start(at);

    // Birds: far away, softened, with a touch of forest space.
    this.birdBus = this.gain(1);
    const birdLp = this.filter('lowpass', 4800, 0.5);
    this.birdBus.connect(birdLp);
    birdLp.connect(this.output);
    if (this.o.wet) birdLp.connect(this.gain(0.9, this.o.wet));
    this.birdClock = new EventClock(rng, () => 1 / 5, at + 1.5);
  }

  schedule(from: number, to: number): void {
    const { rng } = this;
    for (const d of this.drifts) d.schedule(to + 1);
    this.birdClock.run(from, to, (t) => {
      const species = weighted<Bird>(rng, [
        ['warbler', 3],
        ['whistler', 2],
        ['dove', 2],
      ]);
      const pan = rrange(rng, -0.8, 0.8);
      this.bird(species, t, pan);
      // Sometimes another bird answers from the other side.
      if (chance(rng, 0.35)) this.bird(species, t + rrange(rng, 1.2, 3), -pan * rrange(rng, 0.6, 1));
    });
  }

  private bird(species: Bird, t: number, pan: number): void {
    const { ctx, rng } = this;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    g.gain.value = 0;
    const p = ctx.createStereoPanner();
    p.pan.value = pan;
    osc.connect(g).connect(p).connect(this.birdBus);
    let harm: OscillatorNode | null = null;
    const level = species === 'dove' ? logRange(rng, 0.1, 0.16) : logRange(rng, 0.035, 0.08);
    const notes: { t: number; dur: number; f0: number; f1: number }[] = [];
    if (species === 'warbler') {
      let tt = t;
      const n = rint(rng, 3, 7);
      let base = logRange(rng, 2300, 3300);
      for (let i = 0; i < n; i++) {
        const dur = rrange(rng, 0.05, 0.11);
        const f0 = base * rrange(rng, 0.9, 1.1);
        notes.push({ t: tt, dur, f0, f1: f0 * rrange(rng, 0.78, 1.3) });
        tt += dur + rrange(rng, 0.03, 0.08);
        base *= rrange(rng, 0.95, 1.05);
      }
    } else if (species === 'whistler') {
      const hi = logRange(rng, 2700, 3200);
      notes.push({ t, dur: 0.28, f0: hi, f1: hi * 0.98 });
      notes.push({ t: t + 0.4, dur: 0.26, f0: hi * 0.86, f1: hi * 0.84 });
      if (chance(rng, 0.4)) notes.push({ t: t + 0.76, dur: 0.24, f0: hi * 0.86, f1: hi * 0.84 });
    } else {
      // Dove: "hoo-HOO… hoo, hoo" — low, round and cozy.
      const f = logRange(rng, 470, 560);
      const pat: [number, number, number, number][] = [
        [0, 0.28, 0.96, 1.0],
        [0.42, 0.5, 1.06, 1.02],
        [1.1, 0.3, 0.98, 0.95],
        [1.55, 0.3, 0.97, 0.94],
      ];
      for (const [dt, dur, a, b] of pat) notes.push({ t: t + dt, dur, f0: f * a, f1: f * b });
      harm = ctx.createOscillator();
      const hg = ctx.createGain();
      hg.gain.value = 0.12;
      harm.connect(hg).connect(g);
    }
    osc.frequency.setValueAtTime(notes[0]!.f0, t);
    harm?.frequency.setValueAtTime(notes[0]!.f0 * 2, t);
    g.gain.setValueAtTime(0, t);
    const soft = species === 'dove' ? 0.07 : 0.012;
    for (const n of notes) {
      osc.frequency.setValueAtTime(n.f0, n.t);
      osc.frequency.exponentialRampToValueAtTime(n.f1, n.t + n.dur);
      harm?.frequency.setValueAtTime(n.f0 * 2, n.t);
      harm?.frequency.exponentialRampToValueAtTime(n.f1 * 2, n.t + n.dur);
      g.gain.setValueAtTime(0, n.t);
      g.gain.linearRampToValueAtTime(level, n.t + soft);
      g.gain.setValueAtTime(level, n.t + n.dur - soft);
      g.gain.linearRampToValueAtTime(0, n.t + n.dur);
    }
    const end = notes[notes.length - 1]!;
    osc.start(t);
    osc.stop(end.t + end.dur + 0.05);
    if (harm) {
      harm.start(t);
      harm.stop(end.t + end.dur + 0.05);
    }
  }
}

// ---------------------------------------------------------------------------
// Brown noise
// ---------------------------------------------------------------------------

export class Brown extends BaseAmbient {
  readonly kind = 'brown';
  private drifts: Drift[] = [];

  constructor(d: AmbientDest) {
    super(d);
  }

  start(at: number): void {
    const { rng } = this;
    const a = this.own(loopNoise(this.o, 'brown', { seconds: 11.3, seed: 51, rate: 1 }));
    const aHp = this.filter('highpass', 28, 0.6);
    const aLp = this.filter('lowpass', 600, 0.5);
    const aG = this.gain(0.9);
    this.chain(a, aHp, aLp, aG, this.output);
    this.drifts.push(new Drift(aLp.frequency, rng, { min: 420, max: 820, minDur: 8, maxDur: 20 }, at));
    this.drifts.push(new Drift(aG.gain, rng, { min: 0.82, max: 1, minDur: 10, maxDur: 22 }, at));

    // A second, deeper layer at a slightly different rate for slow movement.
    const b = this.own(loopNoise(this.o, 'brown', { seconds: 8.9, seed: 52, rate: 0.93 }));
    const bLp = this.filter('lowpass', 170, 0.5);
    const bG = this.gain(0.35);
    this.chain(b, this.filter('highpass', 25, 0.6), bLp, bG, this.output);
    for (const s of [a, b]) startLoop(s, at, rng);
  }

  schedule(_from: number, to: number): void {
    for (const d of this.drifts) d.schedule(to + 1);
  }
}

