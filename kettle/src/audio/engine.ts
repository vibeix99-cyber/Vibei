/**
 * Live audio engine: one lazily-created AudioContext, the shared mixing graph,
 * gesture unlock (iOS/Safari), settings sync with smooth ramps, SFX voice
 * limiting, ambience crossfades + lookahead scheduling, the kettle simmer,
 * and power management (suspend when silent & hidden / idle).
 * OWNER: audio area.
 */
import type { AmbientKind } from '@/state/settings';
import { getSettings } from '@/state/settings';
import { haptic } from '@/lib/haptics';
import { VoicePool, dbToGain, mulberry32, volumeToGain, type Rng } from './dsp';
import { Fader, buildGraph, buildSfx, type Graph } from './graph';
import { SFX, type PlayOptions, type SfxName } from './sfx';
import { AMBIENT_LEVELS, SIMMER_LEVEL, Simmer, ambientTrim, createAmbient, type AmbientVoice } from './ambience';

type Kind = Exclude<AmbientKind, 'none'>;

interface LiveAmbient {
  kind: Kind;
  voice: AmbientVoice;
  fader: Fader;
  stopAt: number | null;
}

const LOOKAHEAD_VISIBLE = 2.5; // generous: rides out main-thread stalls (3D scene, low-end phones)
const LOOKAHEAD_HIDDEN = 6;
const PUMP_MS = 250;
const IDLE_SUSPEND_MS = 60_000;

function hasActivation(): boolean {
  const ua = (navigator as Navigator & { userActivation?: { hasBeenActive: boolean } }).userActivation;
  return ua ? ua.hasBeenActive : false;
}

export class Engine {
  ctx: AudioContext | null = null;
  graph: Graph | null = null;
  private rng: Rng = mulberry32((Math.random() * 2 ** 32) >>> 0);
  private pool = new VoicePool(14);
  private voiceNodes = new Map<number, { dry: GainNode; wet: GainNode }>();
  private unlocked = false;
  private lastSfxEnd = 0;
  private lastActivity = 0;

  // Ambience
  private requested: AmbientKind = 'none';
  private requestFadeMs = 1500;
  private current: LiveAmbient | null = null;
  private outgoing: LiveAmbient[] = [];
  private level: { fader: Fader; node: GainNode; wetNode: GainNode } | null = null;
  private levelTarget = 1;

  // Simmer
  private simmer: { voice: Simmer; fader: Fader; stopAt: number | null } | null = null;

  private pumpId: ReturnType<typeof setInterval> | null = null;
  private idleId: ReturnType<typeof setInterval> | null = null;
  /** Called after unlock so the session controller can (re)apply ambience. */
  onUnlock: (() => void) | null = null;
  /** Multi-tab: only the owning (timer-leader) tab plays ambience. */
  ownsAudio: () => boolean = () => true;

  // -------------------------------------------------------------------------
  // Context lifecycle
  // -------------------------------------------------------------------------

  private create(): AudioContext | null {
    if (this.ctx) return this.ctx;
    if (typeof window === 'undefined') return null;
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    try {
      this.ctx = new AC({ latencyHint: 'interactive' });
    } catch {
      return null;
    }
    this.graph = buildGraph(this.ctx);
    const lvl = this.ctx.createGain();
    const lvlWet = this.ctx.createGain();
    lvl.connect(this.graph.amb);
    lvlWet.connect(this.graph.ambWet);
    this.level = { node: lvl, wetNode: lvlWet, fader: new Fader(this.ctx, [lvl.gain, lvlWet.gain], this.levelTarget) };
    this.applyVolumes(true);
    document.addEventListener('visibilitychange', () => this.onVisibility());
    return this.ctx;
  }

  /** Must run inside a user gesture the first time (iOS/Safari/Chrome autoplay). */
  unlock(): void {
    const ctx = this.create();
    if (!ctx) return;
    const wasUnlocked = this.unlocked;
    if (ctx.state !== 'running') {
      void ctx.resume().catch(() => {});
    }
    if (!wasUnlocked) {
      // iOS: play one silent sample inside the gesture to fully unlock output.
      try {
        const b = ctx.createBuffer(1, 1, ctx.sampleRate);
        const s = ctx.createBufferSource();
        s.buffer = b;
        s.connect(ctx.destination);
        s.start();
      } catch {
        /* ignore */
      }
      this.unlocked = true;
      this.applyVolumes(true);
      this.reconcile();
      this.onUnlock?.();
    }
    this.touch();
  }

  get isUnlocked(): boolean {
    return this.unlocked;
  }

  private touch(): void {
    this.lastActivity = performance.now();
    this.ensureIdleWatch();
  }

  /** Run `fn` once the context is running; drop it if resuming took too long. */
  private whenRunning(fn: () => void, staleMs: number): void {
    const ctx = this.ctx;
    if (!ctx) return;
    if (ctx.state === 'running') {
      fn();
      return;
    }
    const asked = performance.now();
    ctx
      .resume()
      .then(() => {
        if (performance.now() - asked <= staleMs) fn();
      })
      .catch(() => {});
  }

  private busy(): boolean {
    const ctx = this.ctx;
    if (!ctx) return false;
    return !!this.current || this.outgoing.length > 0 || !!this.simmer || ctx.currentTime < this.lastSfxEnd + 2.0; // + room reverb tail
  }

  private onVisibility(): void {
    if (document.visibilityState === 'hidden') this.maybeSuspend(true);
    else if (this.busy() && this.ctx?.state !== 'running' && this.unlocked) void this.ctx?.resume().catch(() => {});
    this.pump();
  }

  private maybeSuspend(hiddenNow = false): void {
    const ctx = this.ctx;
    if (!ctx || ctx.state !== 'running' || this.busy()) return;
    const hidden = hiddenNow || document.visibilityState === 'hidden';
    if (hidden || performance.now() - this.lastActivity > IDLE_SUSPEND_MS) {
      void ctx.suspend().catch(() => {});
    }
  }

  private ensureIdleWatch(): void {
    if (this.idleId != null) return;
    this.idleId = setInterval(() => {
      const ctx = this.ctx;
      if (!ctx || ctx.state !== 'running') {
        if (this.idleId != null) clearInterval(this.idleId);
        this.idleId = null;
        return;
      }
      this.maybeSuspend();
    }, 5000);
  }

  // -------------------------------------------------------------------------
  // Settings
  // -------------------------------------------------------------------------

  /** Smoothly apply master/sfx/ambient volumes + mute. */
  applyVolumes(immediate = false): void {
    const g = this.graph;
    const ctx = this.ctx;
    if (!g || !ctx) return;
    const s = getSettings();
    const now = ctx.currentTime;
    const set = (p: AudioParam, v: number) => {
      p.cancelScheduledValues(now);
      if (immediate) p.setValueAtTime(v, now);
      else p.setTargetAtTime(v, now, 0.04);
    };
    set(g.master.gain, s.muted ? 0 : volumeToGain(s.masterVolume));
    const sfx = volumeToGain(s.sfxVolume);
    set(g.sfx.gain, sfx);
    set(g.sfxWet.gain, sfx);
    const amb = volumeToGain(s.ambientVolume);
    set(g.amb.gain, amb);
    set(g.ambWet.gain, amb);
  }

  /** True when nothing we'd play could be heard (skip building nodes). */
  private silent(kind: 'sfx' | 'amb'): boolean {
    const s = getSettings();
    if (s.muted || s.masterVolume <= 0) return true;
    return kind === 'sfx' ? s.sfxVolume <= 0 : s.ambientVolume <= 0;
  }

  // -------------------------------------------------------------------------
  // SFX
  // -------------------------------------------------------------------------

  play(name: SfxName, opts: PlayOptions = {}): void {
    const def = SFX[name];
    if (!def) return;
    if (def.haptic && opts.haptic !== false) haptic(def.haptic);
    if (this.silent('sfx')) return;
    if (!this.ctx) {
      // Never create a context before the user has interacted (autoplay policy).
      if (typeof navigator === 'undefined' || !hasActivation()) return;
      this.create();
    }
    if (!this.unlocked && !hasActivation()) return;
    this.touch();
    const big = def.rule.minGapMs >= 400;
    this.whenRunning(() => this.schedule(name, opts), big ? 2500 : 250);
  }

  private schedule(name: SfxName, opts: PlayOptions): void {
    const ctx = this.ctx;
    const graph = this.graph;
    if (!ctx || !graph) return;
    const def = SFX[name];
    const nowMs = performance.now();
    const decision = this.pool.request(name, nowMs, 1500, def.rule);
    if (!decision.accept) return;
    // Schedule a hair in the future so every envelope starts from 0 (no clicks).
    const t = ctx.currentTime + 0.01;
    for (const id of decision.steal) this.release(id, t);
    const humanGain = 1 + (this.rng() - 0.5) * 0.12; // ±0.5 dB
    const v = buildSfx(graph, name, t, opts, this.rng, decision.gain * humanGain);
    this.voiceNodes.set(decision.id, { dry: v.dry, wet: v.wet });
    this.lastSfxEnd = Math.max(this.lastSfxEnd, v.end);
    const ms = (v.end - ctx.currentTime) * 1000;
    const vid = decision.id;
    setTimeout(() => {
      this.voiceNodes.delete(vid);
      this.pool.release(vid);
    }, ms + 100);
  }

  private release(id: number, at: number): void {
    const v = this.voiceNodes.get(id);
    this.pool.release(id);
    if (!v) return;
    this.voiceNodes.delete(id);
    for (const g of [v.dry.gain, v.wet.gain]) {
      g.cancelScheduledValues(at);
      g.setTargetAtTime(0, at, 0.012);
    }
  }

  // -------------------------------------------------------------------------
  // Ambience
  // -------------------------------------------------------------------------

  get ambient(): AmbientKind {
    return this.requested;
  }

  /** Idempotent: asking for what's already playing (or fading in) is a no-op. */
  setAmbient(kind: AmbientKind, fadeMs = 1500): void {
    this.requested = kind;
    this.requestFadeMs = fadeMs;
    this.reconcile(fadeMs);
  }

  /** Session level (1 = full, <1 = dipped while paused). */
  setAmbientLevel(level: number, fadeMs = 800): void {
    this.levelTarget = Math.max(0, Math.min(1, level));
    if (this.level && Math.abs(this.level.fader.target - this.levelTarget) > 1e-3) {
      this.level.fader.fade(this.levelTarget, fadeMs / 1000, 'linear');
    }
  }

  /** Re-evaluate after mute/volume changes. */
  reconcile(fadeMs = this.requestFadeMs): void {
    const want: AmbientKind = this.silent('amb') || !this.ownsAudio() ? 'none' : this.requested;
    const ctx = want === 'none' ? this.ctx : this.ctx ?? (this.unlocked || hasActivation() ? this.create() : null);
    if (!ctx || !this.graph) return;
    if (want !== 'none' && !this.unlocked && !hasActivation()) return;
    const cur = this.current;
    if (cur && cur.kind === want) {
      // Possibly fading out → bring it back.
      if (cur.stopAt != null || cur.fader.target < ambientTrim(cur.kind) - 1e-3) {
        cur.stopAt = null;
        cur.fader.fade(ambientTrim(cur.kind), fadeMs / 1000);
      }
      return;
    }
    const now = ctx.currentTime;
    if (cur) {
      cur.fader.fade(0, fadeMs / 1000);
      cur.stopAt = now + fadeMs / 1000 + 0.1;
      this.outgoing.push(cur);
      this.current = null;
    }
    if (want !== 'none') {
      // Reuse an outgoing voice of the same kind if it's still fading out.
      const idx = this.outgoing.findIndex((o) => o.kind === want);
      if (idx >= 0) {
        const back = this.outgoing.splice(idx, 1)[0]!;
        back.stopAt = null;
        back.fader.fade(ambientTrim(want), fadeMs / 1000);
        this.current = back;
      } else {
        this.whenRunning(() => this.startAmbient(want, fadeMs), 60_000);
      }
    }
    this.touch();
    this.ensurePump();
  }

  private startAmbient(kind: Kind, fadeMs: number): void {
    const ctx = this.ctx;
    if (!ctx || !this.level || this.requested !== kind || this.current?.kind === kind) return;
    const voice = createAmbient(kind, { ctx, dry: this.level.node, wet: this.level.wetNode, rng: this.rng });
    const now = ctx.currentTime + 0.01;
    voice.start(now);
    voice.scheduledTo = now;
    const fader = new Fader(ctx, [voice.output.gain, voice.wetOutput.gain], 0);
    fader.fade(ambientTrim(kind), fadeMs / 1000, 'equalPower', now);
    this.current = { kind, voice, fader, stopAt: null };
    this.pump();
    this.ensurePump();
  }

  // -------------------------------------------------------------------------
  // Simmer (kettle heating in the last seconds of a focus session)
  // -------------------------------------------------------------------------

  /** Heat rises linearly to 1 over `secondsToBoil` (from wherever it is now). */
  simmerTo(heat: number, secondsToBoil: number, fadeInMs = 600): void {
    if (this.silent('sfx')) {
      this.simmerOff(300);
      return;
    }
    const ctx = this.ctx;
    if (!ctx || !this.graph || !this.unlocked) return;
    this.whenRunning(() => {
      const graph = this.graph!;
      const now = ctx.currentTime + 0.01;
      if (!this.simmer) {
        const voice = new Simmer({ ctx, dry: graph.sfx, wet: null, rng: this.rng });
        voice.start(now);
        voice.scheduledTo = now;
        const fader = new Fader(ctx, [voice.output.gain, voice.wetOutput.gain], 0);
        this.simmer = { voice, fader, stopAt: null };
        voice.setHeat(heat, now, 0.05);
      }
      const s = this.simmer;
      s.stopAt = null;
      const trim = dbToGain(SIMMER_LEVEL.level);
      if (Math.abs(s.fader.target - trim) > 1e-3) s.fader.fade(trim, fadeInMs / 1000);
      s.voice.setHeat(heat, now, 0.3);
      s.voice.setHeat(1, now + 0.3, Math.max(0.1, secondsToBoil - 0.3));
      this.touch();
      this.pump();
      this.ensurePump();
    }, 60_000);
  }

  simmerOff(fadeMs = 1200): void {
    const s = this.simmer;
    const ctx = this.ctx;
    if (!s || !ctx || s.stopAt != null) return;
    s.fader.fade(0, fadeMs / 1000);
    s.stopAt = ctx.currentTime + fadeMs / 1000 + 0.1;
    this.ensurePump();
  }

  get simmering(): boolean {
    return !!this.simmer && this.simmer.stopAt == null;
  }

  // -------------------------------------------------------------------------
  // Lookahead scheduler
  // -------------------------------------------------------------------------

  private ensurePump(): void {
    if (this.pumpId != null) return;
    this.pumpId = setInterval(() => this.pump(), PUMP_MS);
  }

  private pump(): void {
    const ctx = this.ctx;
    if (!ctx) return;
    const now = ctx.currentTime;
    const ahead = now + (document.visibilityState === 'hidden' ? LOOKAHEAD_HIDDEN : LOOKAHEAD_VISIBLE);
    const run = (v: AmbientVoice) => {
      const from = Math.max(v.scheduledTo, now);
      if (ahead > from) {
        v.schedule(from, ahead);
        v.scheduledTo = ahead;
      }
    };
    if (this.current) run(this.current.voice);
    this.outgoing = this.outgoing.filter((o) => {
      if (o.stopAt != null && now >= o.stopAt) {
        o.voice.stop(now + 0.02);
        o.voice.output.disconnect();
        o.voice.wetOutput.disconnect();
        return false;
      }
      run(o.voice);
      return true;
    });
    if (this.simmer) {
      if (this.simmer.stopAt != null && now >= this.simmer.stopAt) {
        this.simmer.voice.stop(now + 0.02);
        this.simmer.voice.output.disconnect();
        this.simmer = null;
      } else run(this.simmer.voice);
    }
    if (!this.current && this.outgoing.length === 0 && !this.simmer && this.pumpId != null) {
      clearInterval(this.pumpId);
      this.pumpId = null;
      this.maybeSuspend();
    }
  }

  /** For debugging / tests. */
  debugState() {
    return {
      state: this.ctx?.state ?? 'none',
      unlocked: this.unlocked,
      requested: this.requested,
      current: this.current?.kind ?? null,
      outgoing: this.outgoing.map((o) => o.kind),
      level: this.levelTarget,
      simmer: this.simmer ? (this.simmer.stopAt == null ? 'on' : 'stopping') : 'off',
      voices: this.pool.active.length,
      targets: AMBIENT_LEVELS,
    };
  }
}

export const engine = new Engine();
