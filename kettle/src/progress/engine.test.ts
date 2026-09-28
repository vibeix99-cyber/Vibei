import { beforeEach, describe, expect, it } from 'vitest';
import { clock } from '@/lib/clock';
import { addDays, dayKey } from '@/lib/dates';
import { on } from '@/lib/events';
import { useSettings } from '@/state/settings';
import { applyRecord, emptyData, replay, type EngineContext } from './engine';
import { leavesForLevel } from './levels';
import { useProgress } from './store';
import { brew, setNow, teaBreak } from './testkit';
import type { ProgressData, QuestSpec } from './types';

const TODAY = '2026-09-28';
const ctx = (over: Partial<EngineContext> = {}): EngineContext => ({ now: clock.now(), goalMin: 30, weekStartsOn: 1, ...over });

const fixedQuests = (): QuestSpec[] => [
  { id: 'fullBrews-1', kind: 'fullBrews', title: 'Finish a full brew', target: 1, reward: 10, icon: 'cup', difficulty: 'easy' },
  { id: 'minutes-30', kind: 'minutes', title: 'Brew for 30 minutes', target: 30, reward: 15, icon: 'clock', difficulty: 'medium' },
  { id: 'teaBreak-1', kind: 'teaBreak', title: 'Take a full tea break', target: 1, reward: 20, icon: 'break', difficulty: 'hard' },
];

function withQuests(data: ProgressData, day = TODAY): ProgressData {
  return { ...data, quests: { ...data.quests, [day]: { goalMin: 30, list: fixedQuests(), done: {} } } };
}

beforeEach(() => {
  setNow(2026, 9, 28, 16, 0);
});

describe('applyRecord — first brew ever', () => {
  it('builds a complete, correct report', () => {
    const rec = brew(TODAY, 15, 0, { intention: 'Essay', tag: 'study' });
    const res = applyRecord(withQuests(emptyData()), rec, ctx());
    const r = res.report!;
    expect(r.id).toBe(rec.id);
    expect(r.firstEver).toBe(true);
    // 25 focus + full brew 5 + first brew 3 + recipe "Finish a full brew" 10
    expect(r.leaves.base).toBe(25);
    expect(r.leaves.bonuses.map((b) => [b.kind, b.amount])).toEqual([
      ['fullBrew', 5],
      ['firstBrew', 3],
      ['quest', 10],
    ]);
    expect(r.leaves.total).toBe(43);
    expect(r.leaves.before).toBe(0);
    expect(r.leaves.after).toBe(43);
    expect(r.goal).toMatchObject({ beforeMin: 0, afterMin: 25, goalMin: 30, justMet: false, alreadyMet: false, metDays: 0 });
    expect(r.streak).toMatchObject({ before: 0, after: 1, extended: true, best: 1, newBest: false, cozies: 0, cozyEarned: false, milestone: null });
    expect(r.streak.week).toHaveLength(7);
    expect(r.streak.week[0]).toMatchObject({ day: TODAY, state: 'done', isToday: true });
    expect(r.level).toMatchObject({ before: 1, after: 2, leavesBefore: 0, leavesAfter: 43, unlocked: ['pothos'] });
    expect(r.level.intoAfter).toBe(43 - leavesForLevel(2));
    expect(r.quests.find((q) => q.id === 'fullBrews-1')).toMatchObject({ before: 0, after: 1, justCompleted: true, done: true });
    expect(r.quests.find((q) => q.id === 'minutes-30')).toMatchObject({ before: 0, after: 25, justCompleted: false });
    expect(r.badges.map((b) => b.id)).toContain('first-brew');
    expect(res.levelUp).toEqual({ from: 1, to: 2 });
    expect(res.streakUp).toEqual({ from: 0, to: 1 });
    // Ledger is auditable: every leaf has an entry that sums to the total.
    expect(res.data.ledger.reduce((a, e) => a + e.amount, 0)).toBe(res.data.leaves);
    expect(res.data.ledger.map((e) => e.id)).toEqual([`focus:${rec.id}`, `full:${rec.id}`, `first:${TODAY}`, `quest:${TODAY}:fullBrews-1`]);
  });

  it('second brew: goal met, recipe done, no second first-brew bonus, streak not re-extended', () => {
    let data = applyRecord(withQuests(emptyData()), brew(TODAY, 9, 0), ctx()).data;
    const res = applyRecord(data, brew(TODAY, 10, 0), ctx());
    const r = res.report!;
    expect(r.leaves.bonuses.map((b) => b.kind)).toEqual(['fullBrew', 'goal', 'quest']);
    expect(r.goal).toMatchObject({ beforeMin: 25, afterMin: 50, justMet: true, metDays: 1 });
    expect(r.streak).toMatchObject({ before: 1, after: 1, extended: false });
    expect(r.quests.find((q) => q.id === 'minutes-30')?.justCompleted).toBe(true);
    data = res.data;
    // Tea break completes the last recipe → all-recipes bonus.
    const tea = applyRecord(data, teaBreak(TODAY, 11, 0), ctx());
    expect(tea.report).toBeNull();
    expect(tea.quests.map((q) => q.id)).toEqual(['teaBreak-1']);
    expect(tea.entries.map((e) => [e.kind, e.amount])).toEqual([
      ['quest', 20],
      ['allQuests', 10],
    ]);
  });

  it('a brew ended early still earns its minutes but not the streak', () => {
    const res = applyRecord(emptyData(), brew(TODAY, 9, 0, { stopAt: 12 }), ctx());
    expect(res.report!.leaves.total).toBe(12);
    expect(res.report!.streak.extended).toBe(false);
    expect(res.report!.firstEver).toBe(false);
    expect(res.streakUp).toBeNull();
  });

  it('deep steep bonus for 50-minute brews', () => {
    const res = applyRecord(emptyData(), brew(TODAY, 9, 0, { min: 50 }), ctx({ goalMin: 60 }));
    expect(res.report!.leaves.bonuses.find((b) => b.kind === 'deepSteep')?.amount).toBe(5);
  });

  it('streak milestone at 7 days earns a Tea Cozy and the Warm Streak II badge', () => {
    const history = Array.from({ length: 6 }, (_, i) => brew(addDays(TODAY, -6 + i), 9, 0));
    const data = replay(history, { goalMin: 30 });
    const res = applyRecord(data, brew(TODAY, 9, 0), ctx());
    const r = res.report!;
    expect(r.streak).toMatchObject({ before: 6, after: 7, extended: true, cozyEarned: true, cozies: 1, milestone: 7, newBest: true });
    expect(r.badges.find((b) => b.id === 'warm-streak')).toMatchObject({ tier: 2 });
  });
});

describe('idempotency', () => {
  it('the same session id never counts twice', () => {
    const rec = brew(TODAY, 9, 0);
    const a = applyRecord(emptyData(), rec, ctx());
    const b = applyRecord(a.data, { ...rec }, ctx());
    expect(b.duplicate).toBe(true);
    expect(b.data).toBe(a.data);
    expect(b.data.leaves).toBe(a.data.leaves);
  });

  it('deleted sessions cannot be re-added by a stale tab', () => {
    useProgress.getState().resetAll();
    const rec = brew(TODAY, 9, 0);
    useProgress.getState().recordSession(rec);
    const leaves = useProgress.getState().leaves;
    useProgress.getState().deleteSession(rec.id);
    expect(useProgress.getState().sessions).toHaveLength(0);
    expect(useProgress.getState().leaves).toBe(leaves); // leaves stay yours
    expect(useProgress.getState().recordSession(rec)).toBeNull();
    expect(useProgress.getState().leaves).toBe(leaves);
  });

  it('store.recordSession emits events once and keeps lastReport for completed brews', () => {
    useProgress.getState().resetAll();
    useSettings.getState().set({ dailyGoalMin: 30 });
    const seen: string[] = [];
    const offs = [
      on('progress:report', () => seen.push('report')),
      on('progress:levelup', () => seen.push('levelup')),
      on('progress:streak', () => seen.push('streak')),
      on('progress:badge', ({ id }) => seen.push(`badge:${id}`)),
    ];
    const rec = brew(TODAY, 9, 0);
    const r1 = useProgress.getState().recordSession(rec, true);
    const r2 = useProgress.getState().recordSession(rec, true);
    offs.forEach((o) => o());
    expect(r1?.whileAway).toBe(true);
    expect(r2).toBe(useProgress.getState().lastReport); // duplicate returns the stored report
    expect(seen.filter((s) => s === 'report')).toHaveLength(1);
    expect(seen).toContain('levelup');
    expect(seen).toContain('streak');
    expect(seen).toContain('badge:first-brew');
    // Early-ended brews don't replace the celebration report.
    const partial = brew(TODAY, 11, 0, { stopAt: 5 });
    useProgress.getState().recordSession(partial);
    expect(useProgress.getState().lastReport?.id).toBe(rec.id);
  });

  it('editSession changes intention/tag only', () => {
    useProgress.getState().resetAll();
    const rec = brew(TODAY, 9, 0);
    useProgress.getState().recordSession(rec);
    const leaves = useProgress.getState().leaves;
    useProgress.getState().editSession(rec.id, { intention: '  Chapter 4  ', tag: 'read' });
    const s = useProgress.getState().sessions[0];
    expect(s.intention).toBe('Chapter 4');
    expect(s.tag).toBe('read');
    expect(useProgress.getState().leaves).toBe(leaves);
    expect(useProgress.getState().lastReport?.record.intention).toBe('Chapter 4');
  });
});

describe('replay', () => {
  it('is order-independent and matches incremental application', () => {
    const recs = [brew(addDays(TODAY, -2), 9), brew(addDays(TODAY, -1), 9), brew(addDays(TODAY, -1), 14, 0, { stopAt: 9 }), teaBreak(addDays(TODAY, -1), 10)];
    const a = replay(recs, { goalMin: 30 });
    const b = replay(recs.slice().reverse(), { goalMin: 30 });
    expect(a.leaves).toBe(b.leaves);
    expect(a.ledger.map((e) => e.id)).toEqual(b.ledger.map((e) => e.id));
    expect(a.sessions.map((s) => s.id)).toEqual(recs.slice().sort((x, y) => x.endedAt - y.endedAt).map((s) => s.id));
  });

  it('handles a long history quickly', () => {
    const recs = [];
    for (let d = 400; d >= 1; d--) for (let i = 0; i < 3; i++) recs.push(brew(addDays(TODAY, -d), 8 + i * 2));
    const t0 = performance.now();
    const data = replay(recs, { goalMin: 60 });
    const ms = performance.now() - t0;
    expect(data.sessions).toHaveLength(1200);
    // ~1s in isolation; generous bound so parallel CI load can't flake it, but an
    // accidental O(n²·days) regression (tens of seconds) still fails.
    expect(ms).toBeLessThan(15000);
    expect(dayKey(data.sessions[0].endedAt)).toBe(addDays(TODAY, -400));
  });
});
