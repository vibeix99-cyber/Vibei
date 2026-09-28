import { describe, expect, it } from 'vitest';
import type { CompletionReport } from '@/progress/types';
import { buildSteps, roman, summarize } from './types';

function report(over: Partial<CompletionReport> = {}): CompletionReport {
  const base = {
    id: 's1',
    at: 0,
    record: { id: 's1', phase: 'focus', startedAt: 0, endedAt: 1, plannedMs: 25 * 60_000, focusedMs: 25 * 60_000, completed: true, intention: '', tag: null, day: '2026-09-28' },
    whileAway: false,
    firstEver: false,
    leaves: { base: 25, bonuses: [{ kind: 'fullBrew', label: 'Full brew', amount: 5 }, { kind: 'quest', label: 'Recipe', amount: 10 }], total: 40, before: 0, after: 40 },
    goal: { beforeMin: 0, afterMin: 25, goalMin: 30, justMet: false, alreadyMet: false, metDays: 0 },
    streak: { before: 2, after: 2, extended: false, best: 5, newBest: false, cozies: 0, cozyEarned: false, milestone: null, week: [] },
    level: { before: 3, after: 3, leavesBefore: 0, leavesAfter: 40, intoBefore: 0, sizeBefore: 50, intoAfter: 40, sizeAfter: 50, unlocked: [] },
    quests: [],
    allQuestsJustDone: false,
    badges: [],
  } as unknown as CompletionReport;
  return { ...base, ...over } as CompletionReport;
}

describe('buildSteps', () => {
  it('always starts with the whistle card', () => {
    expect(buildSteps(report())).toEqual(['whistle']);
  });
  it('adds only the cards that were earned, in order', () => {
    const r = report({
      streak: { ...report().streak, extended: true, after: 3 },
      quests: [{ id: 'q', title: 'Q', icon: 'cup', before: 0, after: 1, target: 1, justCompleted: true, done: true, reward: 10 }],
      level: { ...report().level, after: 4 },
      badges: [{ id: 'first-brew', tier: 1, title: 'First Brew', description: 'x' }],
    });
    expect(buildSteps(r)).toEqual(['whistle', 'streak', 'recipes', 'level', 'badges']);
  });
  it('skips recipes that did not move', () => {
    const r = report({ quests: [{ id: 'q', title: 'Q', icon: 'cup', before: 1, after: 1, target: 3, justCompleted: false, done: false, reward: 10 }] });
    expect(buildSteps(r)).toEqual(['whistle']);
  });
});

describe('summarize', () => {
  it('counts brew leaves without recipe rewards (those belong to the tin card)', () => {
    expect(summarize('whistle', report())).toBe('25 minutes of focus. 30 leaves earned. Daily goal: 25 of 30 minutes.');
  });
  it('reads the streak', () => {
    const r = report({ streak: { ...report().streak, extended: true, after: 7, newBest: true, cozyEarned: true } });
    expect(summarize('streak', r)).toBe('Warm streak: 7 days. Your best yet. You earned a Tea Cozy.');
  });
  it('roman tiers', () => {
    expect(roman(2)).toBe('II');
    expect(roman(5)).toBe('V');
  });
});
