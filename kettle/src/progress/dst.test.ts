/**
 * DST / timezone correctness. Runs in America/New_York (spring forward on
 * 2026-03-08, fall back on 2026-11-01): days are 23h / 25h long there.
 */
const env = (globalThis as unknown as { process: { env: Record<string, string | undefined> } }).process.env;
const PREV_TZ = env.TZ;
env.TZ = 'America/New_York';

import { afterAll, describe, expect, it } from 'vitest';
import { addDays, dayKey } from '@/lib/dates';
import { clock } from '@/lib/clock';
import { applyRecord, emptyData } from './engine';
import { streakTimeline } from './streak';
import { brew, setNow } from './testkit';

afterAll(() => {
  env.TZ = PREV_TZ;
  clock.reset();
});

describe('DST', () => {
  it('runs in a DST timezone', () => {
    const jan = new Date(2026, 0, 15).getTimezoneOffset();
    const jul = new Date(2026, 6, 15).getTimezoneOffset();
    expect(jan).not.toBe(jul);
  });

  it('day keys step one calendar day across spring-forward and fall-back', () => {
    expect(addDays('2026-03-07', 1)).toBe('2026-03-08');
    expect(addDays('2026-03-08', 1)).toBe('2026-03-09');
    expect(addDays('2026-10-31', 1)).toBe('2026-11-01');
    expect(addDays('2026-11-01', 1)).toBe('2026-11-02');
    expect(addDays('2026-11-02', -2)).toBe('2026-10-31');
  });

  it('a streak spanning spring-forward is unbroken', () => {
    const warm = new Set(['2026-03-06', '2026-03-07', '2026-03-08', '2026-03-09', '2026-03-10']);
    const t = streakTimeline(warm, '2026-03-10');
    expect(t.current).toBe(5);
    expect(Object.values(t.days).every((s) => s === 'done')).toBe(true);
  });

  it('a streak spanning fall-back is unbroken', () => {
    const warm = new Set(['2026-10-30', '2026-10-31', '2026-11-01', '2026-11-02']);
    expect(streakTimeline(warm, '2026-11-02').current).toBe(4);
  });

  it('late-night brews land on the right local day on the 25h day', () => {
    // 11:30 pm on fall-back day ends 11:55 pm the same local day.
    const late = brew('2026-11-01', 23, 30);
    expect(late.day).toBe('2026-11-01');
    // A brew starting 11:50 pm ends after midnight → next day.
    const cross = brew('2026-11-01', 23, 50);
    expect(cross.day).toBe('2026-11-02');
    expect(dayKey(new Date(2026, 10, 1, 1, 30).getTime())).toBe('2026-11-01');
  });

  it('engine credits the goal and streak on the local day across DST', () => {
    setNow(2026, 3, 9, 20, 0);
    let data = emptyData();
    for (const day of ['2026-03-07', '2026-03-08', '2026-03-09']) {
      const res = applyRecord(data, brew(day, 1, 30), { now: clock.now(), goalMin: 25, weekStartsOn: 0 });
      data = res.data;
    }
    const res = applyRecord(data, brew('2026-03-09', 10, 0), { now: clock.now(), goalMin: 25, weekStartsOn: 0 });
    expect(res.report?.streak.after).toBe(3);
    expect(data.ledger.filter((e) => e.kind === 'goal').map((e) => e.day)).toEqual(['2026-03-07', '2026-03-08', '2026-03-09']);
  });
});
