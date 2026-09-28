import { describe, expect, it, vi } from 'vitest';

// session.ts pulls in the engine + stores; stub the engine so the pure helpers can be tested in node.
vi.mock('./engine', () => ({ engine: {} }));

import { CHORDS, F_MAJOR_PCS, PATTERNS, PROGRESSIONS, melody, nextProgression, swing, voice } from './ambience/harmony';
import { mulberry32 } from './dsp';
import { SFX, SFX_NAMES, pitchRatio } from './sfx';
import { PAUSED_LEVEL, SIMMER_LEAD_MS, heatFor, sessionTarget } from './session';
import { shouldBuzz, HAPTIC_PATTERNS } from '@/lib/haptics';

describe('lo-fi harmony', () => {
  it('every chord (except the borrowed colour) is in F major', () => {
    for (const c of Object.values(CHORDS)) {
      if ('borrowed' in c && c.borrowed) continue;
      for (const n of [c.bass, ...c.notes]) expect(F_MAJOR_PCS).toContain(n % 12);
    }
  });

  it('progressions only use known chords', () => {
    for (const p of PROGRESSIONS) for (const c of p) expect(CHORDS[c]).toBeDefined();
  });

  it('never repeats one of the last two progressions', () => {
    const rng = mulberry32(5);
    const hist: number[] = [];
    for (let i = 0; i < 200; i++) {
      const n = nextProgression(rng, hist);
      expect(hist.slice(-2)).not.toContain(n);
      hist.push(n);
    }
    // …and uses the whole vocabulary over time.
    expect(new Set(hist).size).toBe(PROGRESSIONS.length);
  });

  it('voicings stay in a comfortable register', () => {
    const rng = mulberry32(8);
    for (let i = 0; i < 500; i++) {
      for (const c of Object.values(CHORDS)) {
        const v = voice(rng, c);
        expect(v.length).toBeGreaterThanOrEqual(3);
        expect(Math.min(...v)).toBeGreaterThanOrEqual(50);
        expect(Math.max(...v)).toBeLessThanOrEqual(76);
      }
    }
  });

  it('melodies are pentatonic and fit the bar', () => {
    const rng = mulberry32(2);
    for (let i = 0; i < 200; i++) {
      for (const n of melody(rng, 4)) {
        expect([0, 2, 5, 7, 9]).toContain(n.midi % 12);
        expect(n.beat).toBeLessThan(4);
      }
    }
  });

  it('swing delays only off-beat eighths', () => {
    expect(swing(0)).toBe(0);
    expect(swing(1.5)).toBeCloseTo(1.58, 6);
    expect(swing(2)).toBe(2);
    for (const p of PATTERNS) for (const h of p) expect(h.beat + h.dur).toBeLessThanOrEqual(4.0001);
  });
});

describe('sfx catalogue', () => {
  it('has a definition, target and sane rule for every name', () => {
    expect(SFX_NAMES.length).toBe(18);
    for (const n of SFX_NAMES) {
      const d = SFX[n];
      expect(d.rule.max).toBeGreaterThanOrEqual(1);
      expect(d.target).toBeLessThan(-12);
      expect(Math.abs(d.level)).toBeLessThan(18);
    }
  });

  it('tap is the quietest, complete/levelUp the loudest', () => {
    const t = SFX_NAMES.map((n) => SFX[n].target);
    expect(SFX.tap.target).toBe(Math.min(...t));
    expect(SFX.complete.target).toBe(Math.max(...t));
    expect(SFX.levelUp.target).toBe(Math.max(...t));
  });

  it('pitch/step always land in key', () => {
    const inKey = (ratio: number) => {
      const semis = Math.round(12 * Math.log2(ratio));
      expect(Math.abs(12 * Math.log2(ratio) - semis)).toBeLessThan(1e-6);
      expect([0, 2, 4, 7, 9]).toContain(((semis % 12) + 12) % 12);
    };
    for (let s = -5; s <= 20; s++) inKey(pitchRatio({ step: s }));
    for (let p = -12; p <= 24; p++) inKey(pitchRatio({ pitch: p }));
    expect(pitchRatio({})).toBe(1);
    // Steps are clamped so long count-ups never get shrill.
    expect(pitchRatio({ step: 50 })).toBe(pitchRatio({ step: 12 }));
  });
});

describe('session sound target', () => {
  const base = { phase: 'focus' as const, endsAt: 100_000, remainingMs: 100_000, plannedMs: 100_000 };

  it('idle and breaks are quiet', () => {
    expect(sessionTarget({ ...base, status: 'idle' }, 'rain', 0).ambient).toBe('none');
    expect(sessionTarget({ ...base, status: 'running', phase: 'shortBreak' }, 'rain', 0).ambient).toBe('none');
  });

  it('running focus plays the chosen ambience at full level', () => {
    const t = sessionTarget({ ...base, status: 'running' }, 'fire', 0);
    expect(t).toEqual({ ambient: 'fire', level: 1, simmerMs: null });
  });

  it('paused focus dips', () => {
    const t = sessionTarget({ ...base, status: 'paused', endsAt: null, remainingMs: 10_000 }, 'lofi', 0);
    expect(t.level).toBe(PAUSED_LEVEL);
    expect(t.simmerMs).toBeNull();
  });

  it('simmers only in the last stretch', () => {
    expect(sessionTarget({ ...base, status: 'running' }, 'rain', 100_000 - SIMMER_LEAD_MS - 1).simmerMs).toBeNull();
    expect(sessionTarget({ ...base, status: 'running' }, 'rain', 100_000 - 30_000).simmerMs).toBe(30_000);
    expect(sessionTarget({ ...base, status: 'running' }, 'rain', 100_000).simmerMs).toBeNull();
    expect(heatFor(SIMMER_LEAD_MS)).toBe(0);
    expect(heatFor(0)).toBe(1);
    expect(heatFor(SIMMER_LEAD_MS / 2)).toBeCloseTo(0.5, 6);
  });
});

describe('haptics', () => {
  it('patterns are short and gentle', () => {
    for (const p of Object.values(HAPTIC_PATTERNS)) {
      const total = Array.isArray(p) ? p.reduce((a, b) => a + b, 0) : p;
      expect(total).toBeLessThanOrEqual(200);
    }
  });

  it('throttles chatty ticks and protects bigger moments', () => {
    expect(shouldBuzz('tick', 50, { lastAt: 0, lastKind: 'tick', lastUntil: 5 })).toBe(false);
    expect(shouldBuzz('tick', 120, { lastAt: 0, lastKind: 'tick', lastUntil: 5 })).toBe(true);
    expect(shouldBuzz('light', 60, { lastAt: 0, lastKind: 'celebrate', lastUntil: 186 })).toBe(false);
    expect(shouldBuzz('celebrate', 60, { lastAt: 0, lastKind: 'light', lastUntil: 8 })).toBe(true);
  });
});
