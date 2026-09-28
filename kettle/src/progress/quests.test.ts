import { describe, expect, it } from 'vitest';
import { addDays } from '@/lib/dates';
import { closedKinds, generateQuests, measureQuest, newQuestDay, questsView } from './quests';
import { brew, teaBreak } from './testkit';

const DAY = '2026-09-28';

describe('recipe generation', () => {
  it('is deterministic from the day key and goal', () => {
    expect(generateQuests(DAY, 30)).toEqual(generateQuests(DAY, 30));
    expect(generateQuests(DAY, 60)).toEqual(generateQuests(DAY, 60));
  });

  it('gives one easy, one medium and one hard recipe with fair rewards', () => {
    for (let i = 0; i < 60; i++) {
      const q = generateQuests(addDays(DAY, i), 30);
      expect(q.map((x) => x.difficulty)).toEqual(['easy', 'medium', 'hard']);
      expect(q[0].reward).toBeLessThan(q[1].reward);
      expect(q[1].reward).toBeLessThanOrEqual(q[2].reward);
    }
  });

  it('never repeats a kind or an icon on the same day', () => {
    for (const goal of [15, 30, 60, 120]) {
      for (let i = 0; i < 120; i++) {
        const q = generateQuests(addDays(DAY, i), goal);
        expect(q).toHaveLength(3);
        expect(new Set(q.map((x) => x.kind)).size).toBe(3);
        expect(new Set(q.map((x) => x.icon)).size).toBe(3);
        for (const x of q) expect(['clock', 'cup', 'sun', 'moon', 'leaf', 'pencil', 'break']).toContain(x.icon);
      }
    }
  });

  it('has variety over a month (many kinds, rarely the same set twice in a row)', () => {
    const kinds = new Set<string>();
    let sameAsYesterday = 0;
    let prev = '';
    for (let i = 0; i < 30; i++) {
      const q = generateQuests(addDays(DAY, i), 30);
      q.forEach((x) => kinds.add(x.kind));
      const sig = q.map((x) => x.id).join('|');
      if (sig === prev) sameAsYesterday++;
      prev = sig;
    }
    expect(kinds.size).toBeGreaterThanOrEqual(7);
    expect(sameAsYesterday).toBe(0);
  });

  it('scales targets to the daily goal', () => {
    const minutesTargets = (goal: number) =>
      Array.from({ length: 200 }, (_, i) => generateQuests(addDays(DAY, i), goal))
        .flat()
        .filter((q) => q.kind === 'minutes')
        .map((q) => q.target);
    const sip = minutesTargets(15);
    const kettle = minutesTargets(120);
    expect(Math.max(...sip)).toBeLessThanOrEqual(25);
    expect(Math.min(...kettle)).toBeGreaterThanOrEqual(60);
    // Deep steeps only for bigger goals.
    const deepFor = (goal: number) =>
      Array.from({ length: 200 }, (_, i) => generateQuests(addDays(DAY, i), goal)).flat().some((q) => q.kind === 'deepSteep');
    expect(deepFor(15)).toBe(false);
    expect(deepFor(60)).toBe(true);
  });

  it('drops time-window recipes that are already closed when first opened', () => {
    expect(closedKinds(9)).toEqual([]);
    expect(closedKinds(11)).toContain('morning');
    for (let i = 0; i < 100; i++) {
      const day = addDays(DAY, i);
      expect(newQuestDay(day, 30, 14).list.some((q) => q.kind === 'morning')).toBe(false);
    }
  });
});

describe('recipe progress', () => {
  const records = [
    brew(DAY, 8, 0, { intention: 'Essay', tag: 'study' }),
    brew(DAY, 9, 0, { min: 50, tag: 'work' }),
    brew(DAY, 19, 0, { stopAt: 10, intention: 'Read' }),
    brew(DAY, 20, 0, { pauseMin: 2 }),
    teaBreak(DAY, 10, 0),
  ];
  const input = { records, ledger: [] };

  it('measures each kind from the day’s records', () => {
    expect(measureQuest('minutes', input)).toBe(25 + 50 + 10 + 25);
    expect(measureQuest('fullBrews', input)).toBe(3);
    expect(measureQuest('teaBreak', input)).toBe(1);
    expect(measureQuest('morning', input)).toBe(2);
    expect(measureQuest('evening', input)).toBe(1); // 8 pm brew completed; the 7 pm one ended early
    expect(measureQuest('intention', input)).toBe(2);
    expect(measureQuest('deepSteep', input)).toBe(1);
    expect(measureQuest('noPause', input)).toBe(2);
    expect(measureQuest('twoTags', input)).toBe(2);
    expect(
      measureQuest('leaves', {
        records: [],
        ledger: [
          { id: 'a', at: 0, day: DAY, kind: 'focus', amount: 25 },
          { id: 'b', at: 0, day: DAY, kind: 'quest', amount: 15 },
        ],
      }),
    ).toBe(25);
  });

  it('clamps progress and keeps done recipes done', () => {
    const state = {
      goalMin: 30,
      list: [
        { id: 'minutes-30', kind: 'minutes' as const, title: 'Brew for 30 minutes', target: 30, reward: 15, icon: 'clock' as const, difficulty: 'medium' as const },
        { id: 'teaBreak-2', kind: 'teaBreak' as const, title: 'Take 2 full tea breaks', target: 2, reward: 15, icon: 'break' as const, difficulty: 'medium' as const },
      ],
      done: { 'teaBreak-2': 123 },
    };
    const view = questsView(state, input);
    expect(view[0]).toMatchObject({ progress: 30, done: false });
    expect(view[1]).toMatchObject({ progress: 2, done: true, completedAt: 123 });
  });
});
