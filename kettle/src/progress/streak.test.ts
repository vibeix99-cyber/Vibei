import { describe, expect, it } from 'vitest';
import { addDays } from '@/lib/dates';
import { computeStreak } from './store';
import { daysToNextCozy, milestoneFor, streakTimeline, weekStart, weekStrip } from './streak';
import { brew } from './testkit';

const T = '2026-09-28'; // a Monday
const days = (...offsets: number[]) => new Set(offsets.map((o) => addDays(T, o)));

describe('warm streak', () => {
  it('is zero with no history', () => {
    const t = streakTimeline(new Set(), T);
    expect(t.current).toBe(0);
    expect(t.best).toBe(0);
    expect(t.runs).toEqual([]);
  });

  it('counts consecutive days, today pending keeps yesterday’s streak alive', () => {
    const t = streakTimeline(days(-3, -2, -1), T);
    expect(t.current).toBe(3);
    expect(t.todayDone).toBe(false);
    const t2 = streakTimeline(days(-3, -2, -1, 0), T);
    expect(t2.current).toBe(4);
    expect(t2.todayDone).toBe(true);
  });

  it('breaks after a missed day without a cozy', () => {
    const t = streakTimeline(days(-5, -4, -2, -1), T);
    expect(t.current).toBe(2);
    expect(t.best).toBe(2);
    expect(t.days[addDays(T, -3)]).toBe('missed');
    const gone = streakTimeline(days(-4, -3), T);
    expect(gone.current).toBe(0);
  });

  it('only completed focus sessions warm a day', () => {
    const day = addDays(T, -1);
    const partial = brew(day, 9, 0, { stopAt: 12 });
    const tea = { ...brew(day, 10), phase: 'shortBreak' as const };
    expect(computeStreak([partial, tea], T).current).toBe(0);
    expect(computeStreak([partial, brew(day, 11)], T).current).toBe(1);
  });

  it('earns a Tea Cozy every 7 warm days (max 2) and spends it on a missed day', () => {
    // 7 warm days → 1 cozy; miss one day → cozy used, streak survives; 3 more days.
    const warm = days(-11, -10, -9, -8, -7, -6, -5, -3, -2, -1);
    const t = streakTimeline(warm, T);
    expect(t.days[addDays(T, -4)]).toBe('cozy');
    expect(t.current).toBe(10); // cozy days don't add to the count
    expect(t.cozies).toBe(0);
    expect(t.cozyEarnedOn).toEqual([addDays(T, -5)]);
    expect(t.cozyDays).toEqual([addDays(T, -4)]);
    expect(t.runs).toHaveLength(1);
    expect(t.runs[0]).toMatchObject({ start: addDays(T, -11), end: addDays(T, -1), days: 10, active: true });
  });

  it('holds at most 2 cozies', () => {
    const warm = new Set(Array.from({ length: 30 }, (_, i) => addDays(T, -30 + i)));
    const t = streakTimeline(warm, T);
    expect(t.current).toBe(30);
    expect(t.cozies).toBe(2);
    expect(t.cozyEarnedOn).toHaveLength(2);
  });

  it('spends cozies day by day and breaks when they run out (no look-ahead)', () => {
    const warm = new Set(Array.from({ length: 14 }, (_, i) => addDays(T, -20 + i))); // -20…-7, 2 cozies
    const t = streakTimeline(warm, T);
    expect(t.days[addDays(T, -6)]).toBe('cozy');
    expect(t.days[addDays(T, -5)]).toBe('cozy');
    expect(t.days[addDays(T, -4)]).toBe('missed');
    expect(t.current).toBe(0);
    expect(t.best).toBe(14);
    expect(t.runs[0].active).toBe(false);
  });

  it('a cozy yesterday keeps the streak alive today', () => {
    const warm = new Set(Array.from({ length: 7 }, (_, i) => addDays(T, -8 + i))); // -8…-2
    const t = streakTimeline(warm, T);
    expect(t.days[addDays(T, -1)]).toBe('cozy');
    expect(t.current).toBe(7);
    expect(t.runs.at(-1)?.active).toBe(true);
  });

  it('ignores future days (clock skew)', () => {
    const t = streakTimeline(days(-1, 0, 3), T);
    expect(t.current).toBe(2);
  });

  it('best streak comes from history', () => {
    const t = streakTimeline(days(-20, -19, -18, -17, -16, -2, -1), T);
    expect(t.best).toBe(5);
    expect(t.current).toBe(2);
    expect(computeStreak([], T)).toEqual({ current: 0, best: 0 });
  });

  it('milestones and cozy countdown', () => {
    expect(milestoneFor(7)).toBe(7);
    expect(milestoneFor(8)).toBeNull();
    expect(milestoneFor(365)).toBe(365);
    expect(daysToNextCozy(0)).toBe(7);
    expect(daysToNextCozy(6)).toBe(1);
    expect(daysToNextCozy(7)).toBe(7);
  });
});

describe('week strip', () => {
  it('uses the locale week start and marks done / cozy / missed / today / future', () => {
    // T is a Monday. With Sunday start the week is Sun 27 … Sat 3.
    expect(weekStart(T, 0)).toBe('2026-09-27');
    expect(weekStart(T, 1)).toBe(T);
    const warm = new Set(Array.from({ length: 7 }, (_, i) => addDays(T, -8 + i))); // -8…-2 → cozy on Sunday (-1)
    const t = streakTimeline(warm, T);
    const strip = weekStrip(t, T, 0);
    expect(strip.map((d) => d.state)).toEqual(['cozy', 'today', 'future', 'future', 'future', 'future', 'future']);
    expect(strip[1].isToday).toBe(true);
    const done = weekStrip(streakTimeline(new Set([...warm, T]), T), T, 0);
    expect(done[1].state).toBe('done');
    const monday = weekStrip(streakTimeline(days(-3, -1), T), addDays(T, 2), 1);
    expect(monday.map((d) => d.state)).toEqual(['missed', 'missed', 'today', 'future', 'future', 'future', 'future']);
  });
});
