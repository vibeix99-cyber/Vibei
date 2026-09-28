import { afterEach, describe, expect, it } from 'vitest';
import { clock } from '@/lib/clock';
import { dayKey } from '@/lib/dates';
import { useSettings } from '@/state/settings';
import { levelFromLeaves } from './levels';
import { questsView } from './quests';
import { seedProfile } from './seed';
import { useProgress } from './store';
import { streakTimeline } from './streak';
import { setNow } from './testkit';
import type { SessionRecord } from './types';

const MIN = 60_000;
function state() {
  const s = useProgress.getState();
  const today = dayKey(clock.now());
  const tl = streakTimeline(s.sessions, today);
  return { s, today, tl, level: levelFromLeaves(s.leaves).level };
}

afterEach(() => clock.reset());

describe('seeds', () => {
  it('fresh: nothing, not onboarded', () => {
    seedProfile('fresh');
    expect(useProgress.getState().sessions).toHaveLength(0);
    expect(useSettings.getState().onboarded).toBe(false);
  });

  it('newbie: a few days in', () => {
    setNow(2026, 9, 28, 9, 0);
    seedProfile('newbie');
    const { s, tl, level } = state();
    expect(tl.current).toBe(3);
    expect(level).toBeGreaterThanOrEqual(3);
    expect(level).toBeLessThanOrEqual(5);
    expect(s.badges['first-brew']?.tier).toBe(1);
    expect(new Date(clock.now()).getHours()).toBe(15);
  });

  it('veteran: 23-day streak with a cozy day, level ~12, rich history', () => {
    setNow(2026, 9, 28, 8, 0);
    seedProfile('veteran');
    const { s, today, tl, level } = state();
    expect(tl.current).toBe(23);
    expect(tl.todayDone).toBe(true);
    const run = tl.runs.at(-1)!;
    expect(run.active).toBe(true);
    expect(run.cozyDays).toHaveLength(1);
    expect(tl.best).toBeGreaterThanOrEqual(23);
    expect(level).toBeGreaterThanOrEqual(11);
    expect(level).toBeLessThanOrEqual(13);
    const tags = new Set(s.sessions.map((x) => x.tag).filter(Boolean));
    expect(tags.size).toBe(5);
    const hours = new Set(s.sessions.filter((x) => x.phase === 'focus').map((x) => new Date(x.startedAt).getHours()));
    expect(hours.size).toBeGreaterThanOrEqual(8);
    const earned = Object.values(s.badges).filter((b) => b.tier > 0).length;
    expect(earned).toBeGreaterThanOrEqual(7);
    const q = questsView(s.quests[today], { records: s.sessions.filter((x) => x.day === today), ledger: s.ledger.filter((e) => e.day === today) });
    expect(q.filter((x) => x.done).length).toBeGreaterThanOrEqual(1);
    expect(q.filter((x) => !x.done).length).toBeGreaterThanOrEqual(1);
    // No session in the future.
    expect(s.sessions.every((x) => x.endedAt <= clock.now())).toBe(true);
    expect(useSettings.getState().dailyGoalMin).toBe(60);
  });

  it('celebrate: the next brew triggers every celebration', () => {
    setNow(2026, 9, 28, 22, 0);
    seedProfile('celebrate');
    const now = clock.now();
    const rec: SessionRecord = {
      id: 'next',
      phase: 'focus',
      startedAt: now,
      endedAt: now + 25 * MIN,
      plannedMs: 25 * MIN,
      focusedMs: 25 * MIN,
      completed: true,
      intention: '',
      tag: 'work',
      day: dayKey(now + 25 * MIN),
    };
    clock.advance(25 * MIN);
    const r = useProgress.getState().recordSession(rec)!;
    expect(r.streak).toMatchObject({ before: 6, after: 7, extended: true, cozyEarned: true, milestone: 7 });
    expect(r.goal.justMet).toBe(true);
    expect(r.quests.filter((q) => q.justCompleted).length).toBeGreaterThanOrEqual(1);
    expect(r.level).toMatchObject({ before: 7, after: 8, unlocked: ['recordPlayer'] });
    expect(r.badges.map((b) => `${b.id}:${b.tier}`)).toEqual(['warm-streak:2']);
    expect(r.quests.filter((q) => q.justCompleted).map((q) => q.id)).toEqual(['fullBrews-1', 'minutes-30']);
  });

  it('atRisk: streak alive, nothing today, evening', () => {
    setNow(2026, 9, 28, 10, 0);
    seedProfile('atRisk');
    const { tl } = state();
    expect(tl.current).toBe(5);
    expect(tl.todayDone).toBe(false);
    expect(new Date(clock.now()).getHours()).toBeGreaterThanOrEqual(18);
  });
});
