import { describe, expect, it } from 'vitest';
import { addDays } from '@/lib/dates';
import { badgeMetrics, badgeProgress, evaluateBadges, tierFor } from './badgeEngine';
import { BADGES, BADGE_BY_ID } from './badges';
import { replay } from './engine';
import { streakTimeline } from './streak';
import { brew, teaBreak } from './testkit';

const TODAY = '2026-09-28'; // Monday

describe('badges', () => {
  it('catalog: stable ids, ascending tiers, at most five', () => {
    expect(BADGES.map((b) => b.id)).toEqual([
      'first-brew',
      'warm-streak',
      'leaf-collector',
      'deep-steep',
      'morning-dew',
      'moonlit',
      'marathon',
      'tea-time',
      'goal-getter',
      'intentional',
      'weekend-warmth',
      'nook-builder',
    ]);
    for (const b of BADGES) {
      expect(b.tiers.length).toBeGreaterThanOrEqual(1);
      expect(b.tiers.length).toBeLessThanOrEqual(5);
      expect([...b.tiers].sort((x, y) => x - y)).toEqual(b.tiers);
    }
  });

  it('tierFor counts thresholds reached', () => {
    const def = BADGE_BY_ID['warm-streak'];
    expect(tierFor(def, 0)).toBe(0);
    expect(tierFor(def, 3)).toBe(1);
    expect(tierFor(def, 29)).toBe(3);
    expect(tierFor(def, 1000)).toBe(5);
  });

  it('computes every metric from history', () => {
    const sat = '2026-09-26';
    const sessions = [
      brew(sat, 6, 30, { intention: 'Early' }), // morning-dew, weekend
      brew(sat, 7, 30, { min: 50 }), // deep steep, morning
      brew(sat, 22, 30), // moonlit
      brew(sat, 20, 0),
      brew(TODAY, 9, 30, { stopAt: 10, intention: 'x' }), // partial: counts for intentional only
      teaBreak(TODAY, 10),
    ];
    const data = replay(sessions, { goalMin: 30 });
    const m = badgeMetrics({ sessions: data.sessions, ledger: data.ledger, leaves: data.leaves, bestStreak: 1 });
    expect(m['first-brew']).toBe(4);
    expect(m['deep-steep']).toBe(1);
    expect(m['morning-dew']).toBe(2);
    expect(m.moonlit).toBe(1);
    expect(m.marathon).toBe(1);
    expect(m['tea-time']).toBe(1);
    expect(m.intentional).toBe(2);
    expect(m['weekend-warmth']).toBe(1);
    expect(m['goal-getter']).toBe(1);
    expect(m['leaf-collector']).toBe(data.leaves);
    expect(m['nook-builder']).toBeGreaterThan(0);
  });

  it('awards the highest new tier once, with timestamps, and never takes it back', () => {
    const first = evaluateBadges({}, { 'warm-streak': 8 }, 1000);
    expect(first.awards).toEqual([expect.objectContaining({ id: 'warm-streak', tier: 2, description: 'Keep a 7-day warm streak' })]);
    expect(first.badges['warm-streak']).toEqual({ tier: 2, unlockedAt: [1000, 1000] });
    const again = evaluateBadges(first.badges, { 'warm-streak': 8 }, 2000);
    expect(again.awards).toEqual([]);
    const down = evaluateBadges(first.badges, { 'warm-streak': 1 }, 3000);
    expect(down.badges['warm-streak'].tier).toBe(2);
    const up = evaluateBadges(first.badges, { 'warm-streak': 14 }, 4000);
    expect(up.badges['warm-streak'].unlockedAt).toEqual([1000, 1000, 4000]);
  });

  it('progress toward the next tier', () => {
    const p = badgeProgress({}, { 'tea-time': 15 }).find((b) => b.id === 'tea-time')!;
    expect(p).toMatchObject({ tier: 1, next: 25, current: 5, value: 15, maxTier: 5 });
    expect(p.toNext).toBeCloseTo(0.5);
    expect(p.description).toBe('Take 25 full tea breaks');
    const maxed = badgeProgress({}, { 'first-brew': 3 }).find((b) => b.id === 'first-brew')!;
    expect(maxed).toMatchObject({ tier: 1, next: null, toNext: 1, maxTier: 1 });
  });

  it('warm streak badge follows the best streak including cozy-bridged runs', () => {
    const days = Array.from({ length: 8 }, (_, i) => addDays(TODAY, -9 + i)).filter((d) => d !== addDays(TODAY, -2));
    const t = streakTimeline(new Set(days), TODAY);
    expect(t.best).toBe(7);
  });
});
