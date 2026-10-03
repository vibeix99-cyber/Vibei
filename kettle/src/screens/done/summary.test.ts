/** The one summary, built from real engine reports (no hand-typed rewards). */
import { beforeEach, describe, expect, it } from 'vitest';
import { clock } from '@/lib/clock';
import { applyRecord, emptyData, type EngineContext } from '@/progress/engine';
import { brew, setNow } from '@/progress/testkit';
import type { ProgressData, QuestSpec } from '@/progress/types';
import { buildSummary, roman } from './summary';

const TODAY = '2026-09-28';
const ctx = (): EngineContext => ({ now: clock.now(), goalMin: 30, weekStartsOn: 1 });
const quests = (): QuestSpec[] => [
  { id: 'fullBrews-1', kind: 'fullBrews', title: 'Finish a full brew', target: 1, reward: 10, icon: 'cup', difficulty: 'easy' },
  { id: 'minutes-30', kind: 'minutes', title: 'Brew for 30 minutes', target: 30, reward: 15, icon: 'clock', difficulty: 'medium' },
  { id: 'teaBreak-1', kind: 'teaBreak', title: 'Take a full tea break', target: 1, reward: 20, icon: 'break', difficulty: 'hard' },
];
const start = (): ProgressData => ({ ...emptyData(), quests: { [TODAY]: { goalMin: 30, list: quests(), done: {} } } });

beforeEach(() => setNow(2026, 9, 28, 16, 0));

describe('buildSummary — from the engine’s own report', () => {
  it('first brew ever: minutes first, compact rewards, the room unlock set apart', () => {
    const rec = brew(TODAY, 15, 0, { intention: 'Essay', tag: 'study' });
    const r = applyRecord(start(), rec, ctx()).report!;
    const m = buildSummary(r);
    expect(m.headline).toBe('25 minutes brewed');
    expect(m.pills.map((p) => p.kind)).toEqual(['leaves', 'goal', 'streak', 'recipes', ...r.badges.map(() => 'badge')]);
    expect(r.badges.length).toBeGreaterThan(0);
    expect(m.pills[0].text).toBe(`+${r.leaves.total} leaves`);
    expect(m.pills.find((p) => p.kind === 'recipes')!.text).toBe('Recipe done · Finish a full brew');
    // Level 2 unlocks the pothos: shown as the unlock, not as a pill.
    expect(m.unlock).toEqual({ ids: ['pothos'], level: 2 });
    expect(m.pills.some((p) => p.kind === 'level')).toBe(false);
    // The arithmetic adds up to exactly what was granted.
    expect(m.details.rows.reduce((a, x) => a + x.amount, 0)).toBe(r.leaves.total);
    expect(m.details.total).toBe(r.leaves.total);
  });

  it('a routine brew: no unlock, level progress as a compact pill', () => {
    // Real data: keep brewing until a brew doesn't change the level — the everyday case.
    let data = start();
    let r = null as ReturnType<typeof applyRecord>['report'];
    for (let d = 0; d < 30 && !(r && r.level.after === r.level.before); d++) {
      const res = applyRecord(data, brew(TODAY, 9 + (d % 8), 0), ctx());
      data = res.data;
      r = res.report;
    }
    expect(r).not.toBeNull();
    const m = buildSummary(r!);
    expect(m.unlock).toBeNull();
    const level = m.pills.find((p) => p.kind === 'level')!;
    const toNext = r!.level.sizeAfter - r!.level.intoAfter;
    expect(level.text).toBe(`${toNext} ${toNext === 1 ? 'leaf' : 'leaves'} to level ${r!.level.after + 1}`);
    expect(m.details.rows.reduce((a, x) => a + x.amount, 0)).toBe(r!.leaves.total);
  });

  it('meeting the goal is said plainly', () => {
    const data = applyRecord(start(), brew(TODAY, 10, 0), ctx()).data;
    setNow(2026, 9, 28, 16, 40);
    const r = applyRecord(data, brew(TODAY, 16, 0), ctx()).report!;
    expect(r.goal.justMet).toBe(true);
    const m = buildSummary(r);
    expect(m.pills.find((p) => p.kind === 'goal')!.text).toBe(`Goal met · ${Math.round(r.goal.afterMin)}/30 min`);
    expect(m.announce).toContain('Daily goal met.');
  });

  it('rewards are granted once: applying the same brew again changes nothing', () => {
    const rec = brew(TODAY, 15, 0);
    const first = applyRecord(start(), rec, ctx());
    const again = applyRecord(first.data, rec, ctx());
    expect(again.data.leaves).toBe(first.data.leaves);
    expect(again.data.ledger).toHaveLength(first.data.ledger.length);
  });

  it('short brews still read naturally', () => {
    const rec = { ...brew(TODAY, 15, 0), focusedMs: 60_000, plannedMs: 60_000 };
    const r = applyRecord(start(), rec, ctx()).report!;
    expect(buildSummary(r).headline).toBe('1 minute brewed');
  });

  it('roman tiers', () => {
    expect(roman(2)).toBe('II');
    expect(roman(9)).toBe('9');
  });
});
