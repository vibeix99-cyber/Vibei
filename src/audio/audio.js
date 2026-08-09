// Procedural audio: zero asset files. Synthesised SFX + an adaptive score.
// Owned by the audio agent.

export class Audio {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.masterVol = 0.7;
    this.musicVol = 0.35;
    this.sfxVol = 0.8;
    this.started = false;
    this._musicTimer = null;
    this._track = null;
  }

  init() {
    if (this.ctx) return this.ctx;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    this.ctx = new AC();
    this.master = this.ctx.createGain();
    this.master.gain.value = this.masterVol;
    this.comp = this.ctx.createDynamicsCompressor();
    this.comp.threshold.value = -14; this.comp.ratio.value = 6; this.comp.release.value = 0.25;
    this.master.connect(this.comp).connect(this.ctx.destination);

    this.musicBus = this.ctx.createGain(); this.musicBus.gain.value = this.musicVol;
    this.sfxBus = this.ctx.createGain(); this.sfxBus.gain.value = this.sfxVol;
    this.musicBus.connect(this.master); this.sfxBus.connect(this.master);

    // A short reverb so hits sit in the arena instead of on top of it.
    this.verb = this.ctx.createConvolver();
    this.verb.buffer = this._impulse(1.6, 2.6);
    this.verbGain = this.ctx.createGain(); this.verbGain.gain.value = 0.22;
    this.verb.connect(this.verbGain).connect(this.master);
    return this.ctx;
  }

  resume() { this.init(); if (this.ctx?.state === 'suspended') this.ctx.resume(); this.started = true; }
  setMuted(m) { this.muted = m; if (this.master) this.master.gain.value = m ? 0 : this.masterVol; }
  setMaster(v) { this.masterVol = v; if (this.master && !this.muted) this.master.gain.value = v; }
  setMusicVol(v) { this.musicVol = v; if (this.musicBus) this.musicBus.gain.value = v; }
  setSfxVol(v) { this.sfxVol = v; if (this.sfxBus) this.sfxBus.gain.value = v; }

  _impulse(seconds, decay) {
    const rate = this.ctx.sampleRate;
    const len = Math.floor(rate * seconds);
    const buf = this.ctx.createBuffer(2, len, rate);
    for (let ch = 0; ch < 2; ch++) {
      const d = buf.getChannelData(ch);
      for (let i = 0; i < len; i++) {
        d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
      }
    }
    return buf;
  }

  _noiseBuffer(seconds = 1) {
    const rate = this.ctx.sampleRate;
    const len = Math.floor(rate * seconds);
    const buf = this.ctx.createBuffer(1, len, rate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    return buf;
  }

  /* ---------------- primitives ---------------- */

  tone({ freq = 440, type = 'sine', dur = 0.2, gain = 0.3, attack = 0.005, decay = null, detune = 0, slideTo = null, send = 0.2, delay = 0 }) {
    if (!this.ctx || this.muted) return;
    const t0 = this.ctx.currentTime + delay;
    const osc = this.ctx.createOscillator();
    osc.type = type; osc.frequency.setValueAtTime(freq, t0); osc.detune.value = detune;
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(Math.max(20, slideTo), t0 + dur);
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0, t0);
    g.gain.linearRampToValueAtTime(gain, t0 + attack);
    g.gain.exponentialRampToValueAtTime(0.0008, t0 + dur);
    osc.connect(g).connect(this.sfxBus);
    if (send > 0) { const s = this.ctx.createGain(); s.gain.value = send; g.connect(s).connect(this.verb); }
    osc.start(t0); osc.stop(t0 + dur + 0.05);
  }

  noise({ dur = 0.2, gain = 0.3, type = 'lowpass', freq = 1200, q = 1, sweepTo = null, send = 0.25, delay = 0 }) {
    if (!this.ctx || this.muted) return;
    const t0 = this.ctx.currentTime + delay;
    const src = this.ctx.createBufferSource();
    src.buffer = this._noiseBuffer(Math.max(0.2, dur));
    const f = this.ctx.createBiquadFilter();
    f.type = type; f.frequency.setValueAtTime(freq, t0); f.Q.value = q;
    if (sweepTo) f.frequency.exponentialRampToValueAtTime(Math.max(60, sweepTo), t0 + dur);
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(gain, t0);
    g.gain.exponentialRampToValueAtTime(0.0008, t0 + dur);
    src.connect(f).connect(g).connect(this.sfxBus);
    if (send > 0) { const s = this.ctx.createGain(); s.gain.value = send; g.connect(s).connect(this.verb); }
    src.start(t0); src.stop(t0 + dur + 0.05);
  }

  /* ---------------- SFX library ---------------- */

  sfx(name, opts = {}) {
    if (!this.ctx) this.init();
    if (!this.ctx || this.muted) return;
    const P = opts.pitch ?? 1;
    switch (name) {
      case 'ui_move':   this.tone({ freq: 620 * P, type: 'square', dur: 0.05, gain: 0.10, send: 0 }); break;
      case 'ui_select': this.tone({ freq: 880 * P, type: 'square', dur: 0.08, gain: 0.13, send: 0.05 });
                        this.tone({ freq: 1320 * P, type: 'square', dur: 0.07, gain: 0.07, delay: 0.035, send: 0.05 }); break;
      case 'ui_back':   this.tone({ freq: 420 * P, type: 'square', dur: 0.09, gain: 0.11, slideTo: 260, send: 0 }); break;
      case 'ui_error':  this.tone({ freq: 180, type: 'sawtooth', dur: 0.16, gain: 0.12, send: 0 }); break;
      case 'text_blip': this.tone({ freq: 1400 + Math.random() * 200, type: 'square', dur: 0.018, gain: 0.035, send: 0 }); break;

      case 'impact_light':
        this.noise({ dur: 0.11, gain: 0.30, freq: 2400, sweepTo: 500 });
        this.tone({ freq: 180, type: 'sine', dur: 0.12, gain: 0.28, slideTo: 70 }); break;
      case 'impact_med':
        this.noise({ dur: 0.18, gain: 0.38, freq: 1800, sweepTo: 300 });
        this.tone({ freq: 130, type: 'sine', dur: 0.22, gain: 0.42, slideTo: 46 }); break;
      case 'impact_heavy':
        this.noise({ dur: 0.28, gain: 0.45, freq: 1400, sweepTo: 180 });
        this.tone({ freq: 92, type: 'sine', dur: 0.42, gain: 0.55, slideTo: 34 });
        this.tone({ freq: 240, type: 'triangle', dur: 0.16, gain: 0.2, slideTo: 80 }); break;
      case 'impact_world':
        this.noise({ dur: 0.6, gain: 0.5, freq: 900, sweepTo: 90 });
        this.tone({ freq: 64, type: 'sine', dur: 0.9, gain: 0.6, slideTo: 26 });
        this.tone({ freq: 150, type: 'sawtooth', dur: 0.3, gain: 0.2, slideTo: 40 }); break;
      case 'impact_fire':
        this.noise({ dur: 0.34, gain: 0.4, freq: 3000, sweepTo: 400, type: 'bandpass', q: 0.8 });
        this.tone({ freq: 110, type: 'sine', dur: 0.3, gain: 0.4, slideTo: 40 }); break;

      case 'slash_light': this.noise({ dur: 0.10, gain: 0.32, type: 'bandpass', freq: 5200, q: 2.2, sweepTo: 2200 }); break;
      case 'slash_heavy': this.noise({ dur: 0.20, gain: 0.42, type: 'bandpass', freq: 6200, q: 1.6, sweepTo: 900 });
                          this.tone({ freq: 150, type: 'sine', dur: 0.2, gain: 0.28, slideTo: 55 }); break;
      case 'slash_air':   this.noise({ dur: 0.26, gain: 0.3, type: 'bandpass', freq: 3400, q: 3, sweepTo: 1200 }); break;
      case 'slash_world': this.noise({ dur: 0.5, gain: 0.45, type: 'bandpass', freq: 7000, q: 1.2, sweepTo: 300 });
                          this.tone({ freq: 70, type: 'sine', dur: 1.0, gain: 0.5, slideTo: 28 }); break;
      case 'slash_soft':  this.noise({ dur: 0.14, gain: 0.22, type: 'bandpass', freq: 3800, q: 3 }); break;

      case 'fire_big':
        this.noise({ dur: 0.7, gain: 0.36, type: 'lowpass', freq: 900, sweepTo: 220 });
        this.tone({ freq: 90, type: 'sawtooth', dur: 0.5, gain: 0.18, slideTo: 40 }); break;
      case 'ice':
        for (let i = 0; i < 5; i++) this.tone({ freq: 2200 + i * 500, type: 'triangle', dur: 0.18, gain: 0.10, delay: i * 0.035, slideTo: 1400 });
        this.noise({ dur: 0.3, gain: 0.2, type: 'highpass', freq: 3000 }); break;
      case 'thunder':
        this.noise({ dur: 0.12, gain: 0.5, type: 'highpass', freq: 4000 });
        this.noise({ dur: 0.6, gain: 0.3, type: 'lowpass', freq: 700, sweepTo: 120, delay: 0.05 });
        this.tone({ freq: 60, type: 'sine', dur: 0.7, gain: 0.4, slideTo: 30, delay: 0.04 }); break;
      case 'thunder_big':
        this.sfx('thunder'); this.sfx('thunder', { pitch: 0.8 });
        this.noise({ dur: 1.2, gain: 0.28, type: 'lowpass', freq: 400, sweepTo: 70, delay: 0.12 }); break;
      case 'water_hit':
        this.noise({ dur: 0.24, gain: 0.32, type: 'lowpass', freq: 1600, sweepTo: 400 });
        this.tone({ freq: 200, type: 'sine', dur: 0.2, gain: 0.22, slideTo: 80 }); break;
      case 'sand': this.noise({ dur: 0.8, gain: 0.24, type: 'bandpass', freq: 1800, q: 0.7 }); break;
      case 'cannon':
        this.tone({ freq: 130, type: 'square', dur: 0.35, gain: 0.4, slideTo: 45 });
        this.noise({ dur: 0.4, gain: 0.4, freq: 1200, sweepTo: 200 }); break;
      case 'dragon':
        this.noise({ dur: 0.9, gain: 0.35, type: 'lowpass', freq: 1100, sweepTo: 180 });
        this.tone({ freq: 78, type: 'sawtooth', dur: 0.8, gain: 0.3, slideTo: 40 }); break;
      case 'light':
        for (let i = 0; i < 6; i++) this.tone({ freq: 1800 + i * 300, type: 'sine', dur: 0.12, gain: 0.09, delay: i * 0.025 }); break;
      case 'shadow': this.tone({ freq: 320, type: 'sawtooth', dur: 0.45, gain: 0.18, slideTo: 90 }); break;
      case 'soul':   this.tone({ freq: 660, type: 'sine', dur: 0.6, gain: 0.16, slideTo: 330 });
                     this.tone({ freq: 990, type: 'sine', dur: 0.5, gain: 0.10, delay: 0.05 }); break;
      case 'sonic':  this.tone({ freq: 900, type: 'sawtooth', dur: 0.3, gain: 0.16, slideTo: 300 }); break;
      case 'sludge': this.noise({ dur: 0.35, gain: 0.26, type: 'lowpass', freq: 700, sweepTo: 180 }); break;
      case 'haki':   this.tone({ freq: 70, type: 'sine', dur: 0.6, gain: 0.4, slideTo: 44 });
                     this.noise({ dur: 0.4, gain: 0.16, type: 'lowpass', freq: 500 }); break;
      case 'conqueror':
        this.tone({ freq: 55, type: 'sine', dur: 1.4, gain: 0.5, slideTo: 30 });
        this.noise({ dur: 1.0, gain: 0.25, type: 'lowpass', freq: 320, sweepTo: 80 });
        this.tone({ freq: 220, type: 'sawtooth', dur: 0.5, gain: 0.14, slideTo: 60, delay: 0.06 }); break;

      case 'buff':   for (let i = 0; i < 4; i++) this.tone({ freq: 440 * Math.pow(1.26, i), type: 'triangle', dur: 0.16, gain: 0.12, delay: i * 0.055 }); break;
      case 'debuff': for (let i = 0; i < 4; i++) this.tone({ freq: 660 / Math.pow(1.26, i), type: 'triangle', dur: 0.16, gain: 0.12, delay: i * 0.055 }); break;
      case 'heal':   for (let i = 0; i < 5; i++) this.tone({ freq: 520 * Math.pow(1.2, i), type: 'sine', dur: 0.26, gain: 0.11, delay: i * 0.05 }); break;
      case 'shield': this.tone({ freq: 300, type: 'triangle', dur: 0.3, gain: 0.2, slideTo: 600 });
                     this.noise({ dur: 0.2, gain: 0.12, type: 'highpass', freq: 2500 }); break;
      case 'warp':   this.tone({ freq: 200, type: 'sine', dur: 0.4, gain: 0.2, slideTo: 1600 }); break;
      case 'weather':this.noise({ dur: 1.4, gain: 0.16, type: 'lowpass', freq: 900, sweepTo: 400 }); break;
      case 'scatter':this.noise({ dur: 0.3, gain: 0.2, type: 'highpass', freq: 2600 }); break;
      case 'confuse':for (let i = 0; i < 6; i++) this.tone({ freq: 500 + Math.sin(i) * 300, type: 'sine', dur: 0.2, gain: 0.09, delay: i * 0.06 }); break;
      case 'sleep':  this.tone({ freq: 400, type: 'sine', dur: 0.9, gain: 0.16, slideTo: 120 }); break;

      case 'faint':
        this.tone({ freq: 400, type: 'square', dur: 0.7, gain: 0.22, slideTo: 60 });
        this.noise({ dur: 0.5, gain: 0.2, type: 'lowpass', freq: 800, sweepTo: 120 }); break;
      case 'crit':
        this.tone({ freq: 1800, type: 'square', dur: 0.09, gain: 0.16, send: 0.1 });
        this.tone({ freq: 2600, type: 'square', dur: 0.12, gain: 0.12, delay: 0.05 }); break;
      case 'super':  this.tone({ freq: 900, type: 'square', dur: 0.1, gain: 0.14 });
                     this.tone({ freq: 1350, type: 'square', dur: 0.14, gain: 0.11, delay: 0.06 }); break;
      case 'weak':   this.tone({ freq: 320, type: 'triangle', dur: 0.16, gain: 0.10, slideTo: 220 }); break;
      case 'miss':   this.noise({ dur: 0.22, gain: 0.2, type: 'bandpass', freq: 2200, q: 2, sweepTo: 900 }); break;
      case 'lowhp':  this.tone({ freq: 1046, type: 'square', dur: 0.10, gain: 0.10, send: 0 }); break;
      case 'victory':
        [523, 659, 784, 1046].forEach((f, i) => this.tone({ freq: f, type: 'triangle', dur: 0.5, gain: 0.16, delay: i * 0.1 })); break;
      case 'defeat':
        [523, 466, 415, 349].forEach((f, i) => this.tone({ freq: f, type: 'triangle', dur: 0.6, gain: 0.15, delay: i * 0.16 })); break;
      default: break;
    }
  }

  /** Fighter entrance cry, derived from its `cry` block. */
  cry(cry) {
    if (!this.ctx) this.init();
    if (!this.ctx || this.muted || !cry) return;
    const { root = 220, shape = 'roar', len = 0.5 } = cry;
    if (shape === 'roar') {
      this.tone({ freq: root, type: 'sawtooth', dur: len, gain: 0.24, slideTo: root * 0.55 });
      this.tone({ freq: root * 1.5, type: 'square', dur: len * 0.7, gain: 0.10, slideTo: root * 0.9, delay: 0.03 });
      this.noise({ dur: len, gain: 0.14, type: 'lowpass', freq: 900, sweepTo: 300 });
    } else if (shape === 'clang') {
      this.tone({ freq: root * 4, type: 'square', dur: len * 0.5, gain: 0.14, slideTo: root * 2 });
      this.noise({ dur: len, gain: 0.18, type: 'bandpass', freq: 4200, q: 2.5, sweepTo: 1400 });
    } else if (shape === 'chime') {
      [1, 1.5, 2.25].forEach((m, i) => this.tone({ freq: root * m, type: 'triangle', dur: len, gain: 0.13, delay: i * 0.05 }));
    } else {
      this.tone({ freq: root * 0.8, type: 'sawtooth', dur: len * 1.2, gain: 0.22, slideTo: root * 0.4 });
      this.noise({ dur: len, gain: 0.16, type: 'lowpass', freq: 600 });
    }
  }

  /* ---------------- adaptive music ---------------- */

  // Tracks are step sequences; intensity 0..1 swaps layers in.
  startMusic(trackName = 'battle') {
    if (!this.ctx) this.init();
    if (!this.ctx) return;
    this.stopMusic();
    this._track = trackName;
    this._step = 0;
    this._intensity = 0.5;
    const bpm = trackName === 'title' ? 96 : trackName === 'victory' ? 132 : 148;
    const stepMs = (60 / bpm) * 1000 / 2;
    this._musicTimer = setInterval(() => this._musicStep(), stepMs);
  }

  setIntensity(v) { this._intensity = Math.max(0, Math.min(1, v)); }
  stopMusic() { if (this._musicTimer) { clearInterval(this._musicTimer); this._musicTimer = null; } }

  _mtone(freq, dur, gain, type = 'triangle', pan = 0) {
    if (!this.ctx || this.muted) return;
    const t0 = this.ctx.currentTime;
    const o = this.ctx.createOscillator(); o.type = type; o.frequency.value = freq;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0, t0);
    g.gain.linearRampToValueAtTime(gain, t0 + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0008, t0 + dur);
    const p = this.ctx.createStereoPanner ? this.ctx.createStereoPanner() : null;
    if (p) { p.pan.value = pan; o.connect(g).connect(p).connect(this.musicBus); }
    else o.connect(g).connect(this.musicBus);
    o.start(t0); o.stop(t0 + dur + 0.03);
  }

  _musicStep() {
    const s = this._step++;
    const I = this._intensity;
    // A minor pentatonic bed — heroic without needing a composer.
    const bass = [55, 55, 82.4, 55, 65.4, 65.4, 49, 49];
    const lead = [440, 523, 587, 523, 659, 587, 523, 440, 392, 440, 523, 587, 659, 784, 659, 587];
    if (s % 2 === 0) this._mtone(bass[(s / 2) % bass.length], 0.22, 0.16, 'sawtooth', -0.15);
    if (I > 0.25 && s % 4 === 2) this.noise({ dur: 0.08, gain: 0.05 * I, type: 'highpass', freq: 6000, send: 0 });
    if (I > 0.45) this._mtone(lead[s % lead.length], 0.16, 0.055 * I, 'triangle', 0.2);
    if (I > 0.75 && s % 8 === 0) this._mtone(lead[s % lead.length] * 2, 0.3, 0.035, 'sine', 0.4);
    if (s % 8 === 0) this.noise({ dur: 0.14, gain: 0.10, type: 'lowpass', freq: 180, send: 0 });
  }
}

export const audio = new Audio();
