/** Ranking the summary's rewards (Wave 2 · I07): at most one highlight, nothing dropped, the arithmetic untouched. */
import { beforeEach, describe, expect, it } from 'vitest';
import { clock } from '@/lib/clock';
import { applyRecord, emptyData, type EngineContext } from '@/progress/engine';
import { brew, setNow } from '@/progress/testkit';
import type { CompletionReport, ProgressData, QuestSpec } from '@/progress/types';
import { buildSummary, COZY_MEANS, MILESTONES, rankRewards, WARM_RULE, warmNote, type RewardPill } from './summary';

const TODAY = '2026-09-28';
const ctx = (): EngineContext => ({ now: clock.now(), goalMin: 30, weekStartsOn: 1 });
const quests = (): QuestSpec[] => [
  { id: 'fullBrews-1', kind: 'fullBrews', title: 'Finish a full brew', target: 1, reward: 10, icon: 'cup', difficulty: 'easy' },
  { id: 'minutes-30', kind: 'minutes', title: 'Brew for 30 minutes', target: 30, reward: 15, icon: 'clock', difficulty: 'medium' },
  { id: 'teaBreak-1', kind: 'teaBreak', title: 'Take a full tea break', target: 1, reward: 20, icon: 'break', difficulty: 'hard' },
];
const start = (): ProgressData => ({ ...emptyData(), quests: { [TODAY]: { goalMin: 30, list: quests(), done: {} } } });
const key = (p: RewardPill) => `${p.kind}|${p.text}`;
/** Highlight + secondary hold exactly the model's pills: nothing dropped, nothing added, nothing twice. */
function holdsEverything(r: CompletionReport) {
  const m = buildSummary(r);
  const k = rankRewards(m, r);
  const shown = [...(k.highlight?.pill ? [k.highlight.pill] : []), ...k.secondary].map(key).sort();
  expect(shown).toEqual(m.pills.map(key).sort());
  return { m, k };
}

beforeEach(() => setNow(2026, 9, 28, 16, 0));

describe('rankRewards — from the engine’s own reports', () => {
  it('a room unlock is the one highlight (its close-up card); every pill stays compact, in the model order', () => {
    const r = applyRecord(start(), brew(TODAY, 15, 0, { intention: 'Essay', tag: 'study' }), ctx()).report!;
    const { m, k } = holdsEverything(r);
    expect(m.unlock).not.toBeNull();
    expect(k.highlight).toEqual({ kind: 'unlock', pill: null, note: '' });
    expect(k.secondary).toEqual(m.pills);
    // The arithmetic is the model's, untouched.
    expect(m.details.rows.reduce((a, x) => a + x.amount, 0)).toBe(r.leaves.total);
  });

  it('a routine brew: no highlight, and the compact rewards keep the accepted order (K02)', () => {
    let data = start();
    let found: CompletionReport | null = null;
    for (let d = 0; d < 40 && !found; d++) {
      const res = applyRecord(data, brew(TODAY, 9 + (d % 8), 0), ctx());
      data = res.data;
      const r = res.report!;
      if (!buildSummary(r).unlock && !rankRewards(buildSummary(r), r).highlight) found = r;
    }
    expect(found).not.toBeNull();
    const { m, k } = holdsEverything(found!);
    expect(k.highlight).toBeNull();
    expect(k.secondary).toEqual(m.pills);
  });
});

describe('rankRewards — the order of milestones (biggest first; shaped from a real report)', () => {
  const base = () => applyRecord(start(), brew(TODAY, 15, 0), ctx()).report!;
  const shape = (patch: (r: CompletionReport) => CompletionReport) => patch(structuredClone(base()));
  const badge = (id: string, tier: number) => ({ id, tier, title: id === 'warm-streak' ? 'Warm Days' : 'Weekend Warmth', description: `about ${id} ${tier}` });

  it('lists the milestones it knows, biggest first', () => {
    expect(MILESTONES).toEqual(['unlock', 'level', 'best', 'badge', 'cozy']);
  });

  it('a level-up without an unlock beats a best streak, a badge and a Tea Cozy', () => {
    const r = shape((r) => ({
      ...r,
      level: { ...r.level, before: 3, after: 4, unlocked: [] },
      streak: { ...r.streak, before: 4, after: 5, extended: true, newBest: true, best: 5, cozyEarned: true },
      badges: [badge('weekend-warmth', 1)],
    }));
    const { m, k } = holdsEverything(r);
    expect(m.unlock).toBeNull();
    expect(k.highlight?.kind).toBe('level');
    expect(k.highlight?.pill?.text).toBe('Cozy level 4');
    expect(k.highlight?.note).toBe(`${m.details.toNext} ${m.details.toNext === 1 ? 'leaf' : 'leaves'} to level 5`);
    // The rest keep the model's order: only the highlight moves.
    expect(k.secondary).toEqual(m.pills.filter((p) => p.kind !== 'level'));
  });

  it('a new best streak beats a badge; the highest badge tier leads the badges', () => {
    const r = shape((r) => ({
      ...r,
      level: { ...r.level, before: 2, after: 2, unlocked: [] },
      streak: { ...r.streak, before: 6, after: 7, extended: true, newBest: true, best: 7, cozyEarned: false },
      badges: [badge('weekend-warmth', 1), badge('warm-streak', 2)],
    }));
    const { k } = holdsEverything(r);
    expect(k.highlight?.kind).toBe('best');
    expect(k.highlight?.pill?.text).toBe('7 days warm, your best yet');
    expect(k.secondary.filter((p) => p.kind === 'badge').map((p) => p.text)).toEqual(['Badge: Weekend Warmth', 'Badge: Warm Days II']);
  });

  it('a badge beats a Tea Cozy; the warm-days badge says what was reached, in warm days (same tier threshold)', () => {
    const r = shape((r) => ({
      ...r,
      level: { ...r.level, before: 2, after: 2, unlocked: [] },
      streak: { ...r.streak, before: 9, after: 10, extended: true, newBest: false, best: 30, cozyEarned: true },
      badges: [badge('weekend-warmth', 1), badge('warm-streak', 2)],
    }));
    const { k } = holdsEverything(r);
    expect(k.highlight?.kind).toBe('badge');
    expect(k.highlight?.pill?.text).toBe('Badge: Warm Days II');
    // tier II of "Brew {n} warm days in a row" is 7 days (progress/badges.ts)
    expect(k.highlight?.note).toBe('7 warm days in a row');
    // Warm days that are not a best are routine: they stay in the compact group.
    expect(k.secondary.some((p) => p.kind === 'streak' && p.text === '10 days warm')).toBe(true);
  });

  it('any other badge keeps its own description as its note', () => {
    const r = shape((r) => ({
      ...r,
      level: { ...r.level, before: 2, after: 2, unlocked: [] },
      streak: { ...r.streak, before: 9, after: 10, extended: true, newBest: false, best: 30, cozyEarned: false },
      badges: [badge('weekend-warmth', 1)],
    }));
    const { k } = holdsEverything(r);
    expect(k.highlight?.kind).toBe('badge');
    expect(k.highlight?.note).toBe('about weekend-warmth 1');
  });

  it('a Tea Cozy alone is highlighted with what it does', () => {
    const r = shape((r) => ({
      ...r,
      level: { ...r.level, before: 2, after: 2, unlocked: [] },
      streak: { ...r.streak, before: 13, after: 14, extended: true, newBest: false, best: 30, cozyEarned: true },
      badges: [],
    }));
    const { k } = holdsEverything(r);
    expect(k.highlight?.kind).toBe('cozy');
    expect(k.highlight?.note).toBe(COZY_MEANS);
  });

  it('the best warm days are highlighted with what keeps them going', () => {
    const r = shape((r) => ({
      ...r,
      level: { ...r.level, before: 2, after: 2, unlocked: [] },
      streak: { ...r.streak, before: 5, after: 6, extended: true, newBest: true, best: 6, cozyEarned: false },
      badges: [],
    }));
    const { k } = holdsEverything(r);
    expect(k.highlight?.kind).toBe('best');
    expect(k.highlight?.note).toBe(WARM_RULE);
  });

  it('goal met, recipes and leaves are never the highlight', () => {
    const r = shape((r) => ({
      ...r,
      level: { ...r.level, before: 2, after: 2, unlocked: [] },
      streak: { ...r.streak, before: 3, after: 3, extended: false, newBest: false, best: 9, cozyEarned: false },
      goal: { ...r.goal, justMet: true },
      badges: [],
    }));
    const { m, k } = holdsEverything(r);
    expect(k.highlight).toBeNull();
    expect(k.secondary).toEqual(m.pills);
  });
});

describe('words — Kettle’s own “warm days”, never “streak” (W2R2)', () => {
  const base = () => applyRecord(start(), brew(TODAY, 15, 0), ctx()).report!;
  it('in every pill, screen-reader line, note, the arithmetic’s closing line and the announcement', () => {
    // Every streak-related reward at once: the most warm days yet, a Tea Cozy, a badge (catalogue names are data).
    const r: CompletionReport = {
      ...structuredClone(base()),
      streak: { ...base().streak, before: 6, after: 7, extended: true, newBest: true, best: 7, cozyEarned: true },
      badges: [{ id: 'weekend-warmth', tier: 1, title: 'Weekend Warmth', description: 'Focus on 2 weekend days' }],
    };
    const m = buildSummary(r);
    const k = rankRewards(m, r);
    const words = [
      ...m.pills.flatMap((p) => [p.text, p.sr ?? '']),
      m.announce,
      k.highlight?.note ?? '',
      COZY_MEANS,
      WARM_RULE,
      warmNote(0),
      warmNote(r.streak.after),
    ];
    for (const w of words) expect(w, w).not.toMatch(/streak/i);
    expect(m.pills.find((p) => p.kind === 'streak')?.text).toBe('7 days warm, your best yet');
    expect(m.announce).toContain('7 days warm.');
    expect(warmNote(23)).toBe('23 days warm. One full brew a day keeps the kettle warm.');
    expect(warmNote(1)).toBe('1 day warm. One full brew a day keeps the kettle warm.');
    expect(m.pills.find((p) => p.kind === 'cozy')?.sr).toBe('You earned a Tea Cozy: it keeps the kettle warm through one missed day');
  });
});
