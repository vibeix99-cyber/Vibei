/**
 * Lo-fi keys: a generative Rhodes-ish FM electric piano comping jazzy F-major
 * chords at ~70 bpm, with a soft sine bass, occasional pentatonic melody
 * fragments, a very soft kick + brush, vinyl crackle and tape wow. Every bar
 * re-rolls voicing, rhythm and fills, and progressions follow a Markov chain,
 * so it never settles into an obvious loop. OWNER: audio area.
 */
import { chance, logRange, midiToFreq, pick, rrange } from '../dsp';
import { breath, ePiano, loopNoise, startLoop, tone } from '../instruments';
import { BaseAmbient, EventClock, vinylGrains, type AmbientDest } from './common';
import { CHORDS, PATTERNS, PROGRESSIONS, melody, nextProgression, swing, voice, type ChordName } from './harmony';

const BPM = 70;
const BEAT = 60 / BPM;
const BAR = BEAT * 4;

export class Lofi extends BaseAmbient {
  readonly kind = 'lofi';
  private bus!: GainNode;
  private drumBus!: GainNode;
  private nextBar = 0;
  private queue: ChordName[] = [];
  private history: number[] = [];
  private drumsOn = true;
  private drumSection = 0;
  private barCount = 0;
  private crackleClock!: EventClock;
  private vinylBus!: GainNode;

  constructor(d: AmbientDest) {
    super(d);
  }

  start(at: number): void {
    const { ctx, rng } = this;
    // Dark, soft tone: gentle low-pass on the whole band. Tape wow is a
    // slowly modulated short delay on the band (one node — no per-note fan-out).
    this.bus = this.gain(1);
    const wow = ctx.createDelay(0.05);
    wow.delayTime.value = 0.012;
    for (const [f, depth] of [
      [0.37, 0.0011],
      [0.13, 0.0025],
    ] as const) {
      const lfo = this.own(ctx.createOscillator());
      lfo.frequency.value = f;
      lfo.connect(this.gain(depth, wow.delayTime));
      lfo.start(at);
    }
    const lp = this.filter('lowpass', 4400, 0.5);
    const hp = this.filter('highpass', 70, 0.6);
    this.chain(this.bus, wow, hp, lp, this.output);
    if (this.o.wet) lp.connect(this.gain(0.35, this.o.wet));
    this.drumBus = this.gain(1, this.output);

    // Vinyl: faint surface hiss + sparse crackle.
    this.vinylBus = this.gain(1, this.output);
    const hiss = this.own(loopNoise(this.o, 'pink', { seconds: 9.7, seed: 61, rate: 1.01 }));
    this.chain(hiss, this.filter('bandpass', 2400, 0.5), this.filter('lowpass', 4500, 0.5), this.gain(0.012, this.vinylBus));
    startLoop(hiss, at, rng);
    this.crackleClock = new EventClock(rng, () => 3.5, at);

    this.nextBar = at + 0.15;
  }

  schedule(from: number, to: number): void {
    const { rng } = this;
    while (this.nextBar < to) {
      this.bar(this.nextBar);
      this.nextBar += BAR;
    }
    const grains = vinylGrains(this.ctx);
    this.crackleClock.run(from, to, (t) => {
      const g = this.ctx.createStereoPanner();
      g.pan.value = rrange(rng, -0.6, 0.6);
      g.connect(this.vinylBus);
      this.grain(pick(rng, grains), t, logRange(rng, 0.004, 0.028), g, rrange(rng, 0.8, 1.2));
    });
  }

  private nextChord(): ChordName {
    if (this.queue.length === 0) {
      const i = nextProgression(this.rng, this.history);
      this.history.push(i);
      if (this.history.length > 8) this.history.shift();
      this.queue = PROGRESSIONS[i]!.slice();
    }
    return this.queue.shift()!;
  }

  private bar(t0: number): void {
    const { rng } = this;
    const chord = CHORDS[this.nextChord()];
    const notes = voice(rng, chord);
    const hum = () => rrange(rng, -0.012, 0.012);
    const o = { ...this.o, out: this.bus };

    // Chord comping.
    for (const hit of pick(rng, PATTERNS)) {
      const t = t0 + swing(hit.beat) * BEAT + hum();
      const dur = hit.dur * BEAT * 0.95;
      notes.forEach((m, i) => {
        const strum = i * rrange(rng, 0.012, 0.03);
        ePiano(o, t + strum, midiToFreq(m), {
          gain: 0.075,
          dur,
          vel: hit.vel * rrange(rng, 0.85, 1.1),
          pan: rrange(rng, -0.25, 0.25),
        });
      });
    }

    // Soft round bass: root on 1, sometimes the fifth on 3.
    this.bass(t0 + hum(), midiToFreq(chord.bass), BEAT * 2.2);
    if (chance(rng, 0.45)) this.bass(t0 + 2 * BEAT + hum(), midiToFreq(chord.bass + 7), BEAT * 1.6);

    // Melody fragments — not every bar.
    if (chance(rng, 0.38)) {
      for (const n of melody(rng, pick(rng, [1, 2, 3, 3, 4]))) {
        ePiano(o, t0 + swing(n.beat) * BEAT + hum(), midiToFreq(n.midi), {
          gain: 0.06,
          dur: n.dur * BEAT,
          vel: rrange(rng, 0.35, 0.5),
          pan: rrange(rng, -0.35, 0.35),
        });
      }
    }

    // Drums come and go in sections of 4–8 bars.
    if (this.barCount >= this.drumSection) {
      this.drumsOn = this.barCount === 0 ? chance(rng, 0.5) : !this.drumsOn || chance(rng, 0.3);
      this.drumSection = this.barCount + pick(rng, [4, 4, 8]);
    }
    if (this.drumsOn) {
      const d = { ...this.o, out: this.drumBus };
      const kick = (t: number, g: number) => tone(d, t, 120, { gain: g, attack: 0.003, t60: 0.28, glide: 0.45, glideTime: 0.07 }, this.drumBus);
      kick(t0 + hum() * 0.5, 0.09);
      if (chance(rng, 0.8)) kick(t0 + 2 * BEAT + hum() * 0.5, 0.07);
      if (chance(rng, 0.25)) kick(t0 + swing(1.5) * BEAT + hum() * 0.5, 0.05);
      for (const b of [1, 3]) {
        breath(d, t0 + b * BEAT + hum(), {
          sweep: [
            [0, 2600],
            [0.2, 2000],
          ],
          q: 0.7,
          gain: 0.035,
          attack: 0.02,
          release: 0.16,
          lowpass: 3600,
          panFrom: 0.1,
        });
      }
    }
    this.barCount++;
  }

  private bass(t: number, f: number, dur: number): void {
    const { ctx } = this;
    const osc = ctx.createOscillator();
    osc.frequency.value = f;
    const h = ctx.createOscillator();
    h.frequency.value = f * 2;
    const hg = ctx.createGain();
    hg.gain.value = 0.7;
    const g = ctx.createGain();
    const peak = 0.028;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(peak, t + 0.02);
    g.gain.exponentialRampToValueAtTime(peak * 0.45, t + dur);
    g.gain.linearRampToValueAtTime(0, t + dur + 0.18);
    osc.connect(g);
    h.connect(hg).connect(g);
    g.connect(this.bus);
    for (const n of [osc, h]) {
      n.start(t);
      n.stop(t + dur + 0.2);
    }
  }
}
