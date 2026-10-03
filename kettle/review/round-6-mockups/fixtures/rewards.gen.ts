/**
 * Mockup fixtures from the app's real calculations (no hand-typed rewards).
 *
 * Runs the progress engine (`applyRecord`, the daily recipes it generates, levels, streaks, badges) and the
 * summary model the app renders (`buildSummary`) over three believable histories, and writes
 * `rewards.json`, which the mockup (`build/mock.tsx`) reads for every number it shows:
 *   home     — before the brew: streak, leaves, level, today's minutes;
 *   routine  — a 25-min "Chapter 3 notes" brew that meets the goal, no level-up;
 *   unlock   — the same brew on a history where it crosses into level 8 (the record player);
 *   first    — a brand-new brewer's 15-min first brew (default 30-min goal).
 * Regenerate: npx vitest run -c review/round-6-mockups/fixtures/vitest.config.ts
 */
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { it } from 'vitest';
import { clock } from '@/lib/clock';
import { addDays } from '@/lib/dates';
import { applyRecord, emptyData, type EngineContext } from '@/progress/engine';
import { brew, setNow, teaBreak } from '@/progress/testkit';
import { levelFromLeaves } from '@/progress/levels';
import { streakTimeline } from '@/progress/streak';
import { questsView } from '@/progress/quests';
import { ITEM_BY_ID } from '@/progress/items';
import type { CompletionReport, ProgressData, SessionRecord } from '@/progress/types';
import { buildSummary } from '@/screens/done/summary';

const TODAY = '2026-09-28';
const GOAL = 30;
const ctx = (): EngineContext => ({ now: clock.now(), goalMin: GOAL, weekStartsOn: 1 });

function run(records: SessionRecord[], start: ProgressData = emptyData()): { data: ProgressData; report: CompletionReport | null } {
  let data = start;
  let report: CompletionReport | null = null;
  for (const r of records) {
    const res = applyRecord(data, r, ctx());
    data = res.data;
    report = res.report;
  }
  return { data, report };
}

/** `days` warm days before today: each a morning brew + tea break, and an afternoon brew on all but `single` of them. */
function history(days: number, single: number): SessionRecord[] {
  const out: SessionRecord[] = [];
  for (let i = days; i >= 1; i--) {
    const day = addDays(TODAY, -i);
    out.push(brew(day, 9, 0), teaBreak(day, 9, 26));
    if (i > single) out.push(brew(day, 14, 0, { tag: 'work' }));
  }
  return out;
}

/** Today so far: a 12-minute brew that ended early (Home reads "12 min brewed · 18 min to go"). */
const morning = () => brew(TODAY, 10, 0, { min: 25, stopAt: 12, intention: 'Inbox zero', tag: 'work' });
const theBrew = () => brew(TODAY, 15, 0, { min: 25, intention: 'Chapter 3 notes', tag: 'study' });

function status(data: ProgressData) {
  const lv = levelFromLeaves(data.leaves);
  return { streak: streakTimeline(data.sessions, TODAY).current, leaves: data.leaves, level: lv.level, into: lv.into, size: lv.size };
}

/** Today's recipes and brews as Home shows them. */
function today(data: ProgressData) {
  const records = data.sessions.filter((s) => s.day === TODAY);
  const state = data.quests[TODAY];
  const quests = state ? questsView(state, { records, ledger: data.ledger.filter((e) => e.day === TODAY) }) : [];
  return {
    recipes: quests.map((q) => ({ title: q.title, reward: q.reward, progress: q.progress, target: q.target, done: q.done })),
    brews: records
      .filter((s) => s.phase === 'focus')
      .map((s) => ({ at: s.startedAt, intention: s.intention, tag: s.tag, min: Math.round(s.focusedMs / 60_000), completed: s.completed })),
  };
}

function scenario(days: number, single: number) {
  setNow(2026, 9, 28, 15, 0);
  const before = run([...history(days, single), morning()]);
  const todayMin = Math.round(before.data.sessions.filter((s) => s.day === TODAY && s.phase === 'focus').reduce((a, s) => a + s.focusedMs, 0) / 60_000);
  setNow(2026, 9, 28, 15, 26);
  const after = run([theBrew()], before.data);
  return {
    home: { ...status(before.data), today: { done: todayMin, goal: GOAL, ...today(before.data) } },
    after: { ...status(after.data), today: today(after.data) },
    report: after.report!,
  };
}

function pack(s: ReturnType<typeof scenario>) {
  const m = buildSummary(s.report);
  return {
    home: s.home,
    after: s.after,
    summary: {
      headline: m.headline,
      pills: m.pills.map((p) => ({ kind: p.kind, text: p.text, value: p.value ?? null, id: p.id ?? null, tier: p.tier ?? null })),
      unlock: m.unlock ? { ...m.unlock, items: m.unlock.ids.map((id) => ({ id, name: ITEM_BY_ID[id]?.name, story: ITEM_BY_ID[id]?.story })) } : null,
      details: m.details,
      streakDays: s.report.streak.after,
    },
  };
}

it('writes rewards.json from the real engine', () => {
  // Search believable histories for the two summary cases: a level-7 brewer whose brew stays in level 7
  // (routine), and one whose brew crosses into level 8 (unlock).
  let routine: ReturnType<typeof scenario> | null = null;
  let unlock: ReturnType<typeof scenario> | null = null;
  for (let days = 3; days <= 40 && !(routine && unlock); days++) {
    for (let single = 0; single <= days && !(routine && unlock); single++) {
      const s = scenario(days, single);
      const lv = s.report.level;
      if (!routine && lv.before === 7 && lv.after === 7 && s.report.goal.justMet) routine = s;
      if (!unlock && lv.before === 7 && lv.after === 8 && s.report.goal.justMet) unlock = s;
    }
  }
  if (!routine || !unlock) throw new Error('no history matched; widen the search');

  // A brand-new brewer: one 15-minute brew, no task, default 30-minute goal.
  setNow(2026, 9, 28, 15, 20);
  const firstRec = brew(TODAY, 15, 0, { min: 15 });
  const first = run([firstRec]);
  const fm = buildSummary(first.report!);

  const out = {
    note: 'Generated by rewards.gen.ts from the app’s progress engine and summary model. Do not edit by hand.',
    routine: pack(routine),
    unlock: pack(unlock),
    first: {
      home: { streak: 0, leaves: 0, level: 1, today: { done: 0, goal: GOAL } },
      after: status(first.data),
      summary: {
        headline: fm.headline,
        pills: fm.pills.map((p) => ({ kind: p.kind, text: p.text, value: p.value ?? null, id: p.id ?? null, tier: p.tier ?? null })),
        unlock: fm.unlock ? { ...fm.unlock, items: fm.unlock.ids.map((id) => ({ id, name: ITEM_BY_ID[id]?.name, story: ITEM_BY_ID[id]?.story })) } : null,
        details: fm.details,
        streakDays: first.report!.streak.after,
      },
    },
  };
  const here = dirname(fileURLToPath(import.meta.url));
  writeFileSync(join(here, 'rewards.json'), JSON.stringify(out, null, 2) + '\n');
});
