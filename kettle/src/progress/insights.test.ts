import { describe, expect, it } from 'vitest';
import { dayTotals, goalMetDays, historyByDay, hourHistogram, leavesBySession, monthGrid, personalBests, rhythmOf, tagBreakdown, totals, weekSeries } from './insights';
import { brew, teaBreak } from './testkit';

const D = '2026-09-28'; // Monday

describe('insights', () => {
  const sessions = [
    brew('2026-09-27', 8, 0, { tag: 'work' }),
    brew('2026-09-27', 9, 0, { tag: 'study', stopAt: 10 }),
    brew(D, 20, 30, { tag: 'work', min: 50 }),
    teaBreak(D, 21, 30),
  ];

  it('totals', () => {
    const t = totals(sessions);
    expect(t).toMatchObject({ brews: 2, sessions: 3, days: 2, breaks: 1, firstDay: '2026-09-27' });
    expect(t.focusMs).toBe((25 + 10 + 50) * 60000);
  });

  it('rolling and calendar week series', () => {
    const byDay = dayTotals(sessions);
    const rolling = weekSeries(byDay, new Set([D]), D, null);
    expect(rolling.map((b) => b.day)).toEqual(['2026-09-22', '2026-09-23', '2026-09-24', '2026-09-25', '2026-09-26', '2026-09-27', D]);
    expect(rolling[6]).toMatchObject({ minutes: 50, brews: 1, met: true, isToday: true, future: false });
    expect(rolling[5]).toMatchObject({ minutes: 35, brews: 1, met: false });
    const cal = weekSeries(byDay, new Set(), D, 1);
    expect(cal[0].day).toBe(D);
    expect(cal[1].future).toBe(true);
    expect(weekSeries(byDay, new Set(), D, null, -1)[6].day).toBe('2026-09-21');
  });

  it('month grid pads to whole weeks from the week start', () => {
    const rows = monthGrid(2026, 8, 0); // September 2026 starts on a Tuesday
    expect(rows[0]).toEqual([null, null, '2026-09-01', '2026-09-02', '2026-09-03', '2026-09-04', '2026-09-05']);
    expect(rows.flat().filter(Boolean)).toHaveLength(30);
    expect(rows.every((r) => r.length === 7)).toBe(true);
    expect(monthGrid(2026, 8, 1)[0][0]).toBeNull();
  });

  it('hour histogram spreads a session over the hours it spans', () => {
    const h = hourHistogram([brew(D, 8, 40)]);
    expect(h[8]).toBe(20);
    expect(h[9]).toBe(5);
    expect(h.reduce((a, b) => a + b, 0)).toBe(25);
  });

  it('rhythm: chronotype and sweet spot agree', () => {
    const hist = new Array(24).fill(0);
    hist[8] = 30;
    hist[10] = 30;
    hist[19] = 50;
    const r = rhythmOf(hist)!;
    expect(r.type).toBe('morning');
    expect([8, 9, 10]).toContain(r.peakStart);
    expect(r.parts.morning).toBeCloseTo(60 / 110);
    expect(rhythmOf(new Array(24).fill(0))).toBeNull();
    const night = new Array(24).fill(0);
    night[23] = 40;
    night[0] = 40;
    expect(rhythmOf(night)?.type).toBe('night');
  });

  it('tag breakdown sorts by time with untagged last', () => {
    const t = tagBreakdown([...sessions, brew(D, 7, 0, { tag: null })]);
    expect(t.map((x) => x.tag)).toEqual(['work', 'study', null]);
    expect(t.reduce((a, x) => a + x.share, 0)).toBeCloseTo(1);
  });

  it('history groups focus sessions by day, newest first', () => {
    const h = historyByDay(sessions);
    expect(h.map((d) => d.day)).toEqual([D, '2026-09-27']);
    expect(h[1].sessions.map((x) => x.startedAt)).toEqual([...h[1].sessions.map((x) => x.startedAt)].sort((a, b) => b - a));
  });

  it('leaves per session and goal days from the ledger', () => {
    const ledger = [
      { id: 'focus:a', at: 0, day: D, kind: 'focus' as const, amount: 25, ref: 'a' },
      { id: 'full:a', at: 0, day: D, kind: 'fullBrew' as const, amount: 5, ref: 'a' },
      { id: 'quest:x', at: 0, day: D, kind: 'quest' as const, amount: 15, ref: 'minutes-30' },
      { id: 'goal:d', at: 0, day: D, kind: 'goal' as const, amount: 10, ref: 'a' },
    ];
    expect(leavesBySession(ledger).get('a')).toBe(40);
    expect([...goalMetDays(ledger)]).toEqual([D]);
  });

  it('personal bests', () => {
    const pb = personalBests(sessions, 1);
    expect(pb.bestDay).toEqual({ day: D, focusMs: 50 * 60000 });
    expect(pb.longestBrew).toEqual({ day: D, focusMs: 50 * 60000 });
    expect(pb.mostBrews?.brews).toBe(1);
    expect(pb.bestWeek?.start).toBe(D);
    expect(personalBests([], 1)).toEqual({ bestDay: null, longestBrew: null, mostBrews: null, bestWeek: null });
  });
});
