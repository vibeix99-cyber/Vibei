/**
 * Progress engine — pure functions over the persisted ProgressData document.
 *
 * `applyRecord` is the one place leaves, goals, recipes, badges and streak
 * changes are computed. The store wraps it (persist + events); seeds, the
 * v1→v2 migration and imports replay history through it, so every path
 * produces the same auditable ledger.
 */
import { dayKey, type DayKey } from '@/lib/dates';
import { evaluateBadges, badgeMetrics, type BadgeAward } from './badgeEngine';
import { itemsUnlockedAt } from './items';
import { levelFromLeaves } from './levels';
import { ALL_QUESTS_BONUS, DEEP_STEEP_MS, measureQuest, newQuestDay } from './quests';
import { milestoneFor, streakTimeline, weekStrip, warmDays } from './streak';
import type { CompletionReport, LeafEntry, LeafKind, ProgressData, QuestDayState, QuestSpec, ReportBonus, SessionRecord, StreakTimeline } from './types';

const MIN = 60_000;

/** Leaves per bonus kind (focus minutes and recipes are variable). */
export const BONUS = {
  fullBrew: 5,
  firstBrew: 3,
  deepSteep: 5,
  goal: 10,
  allQuests: ALL_QUESTS_BONUS,
} as const;

export const SCHEMA_VERSION = 2;

export function emptyData(): ProgressData {
  return {
    sessions: [],
    ledger: [],
    leaves: 0,
    cozies: 0,
    dayGoals: {},
    quests: {},
    badges: {},
    tombstones: [],
    lastReport: null,
    rev: 0,
  };
}

export interface EngineContext {
  /** "Now" for the purposes of today / streak / timestamps. */
  now: number;
  /** Daily goal in effect (settings.dailyGoalMin). */
  goalMin: number;
  /** 0 = Sunday. */
  weekStartsOn: number;
  /** Skip building the CompletionReport (replays). */
  lite?: boolean;
  /** Lite replays: skip badge/streak evaluation for this record (done at day boundaries). */
  skipBadges?: boolean;
  /** The session finished while the app was closed/hidden. */
  whileAway?: boolean;
}

export interface ApplyResult {
  data: ProgressData;
  /** Focus sessions only (null for breaks, duplicates and lite replays). */
  report: CompletionReport | null;
  duplicate: boolean;
  entries: LeafEntry[];
  levelUp: { from: number; to: number } | null;
  streakUp: { from: number; to: number } | null;
  badges: BadgeAward[];
  /** Recipes completed by this record. */
  quests: QuestSpec[];
}

export function leafLabel(e: Pick<LeafEntry, 'kind' | 'note' | 'ref'>, questTitle?: string): string {
  switch (e.kind) {
    case 'focus':
      return 'Focused minutes';
    case 'fullBrew':
      return 'Full brew';
    case 'firstBrew':
      return 'First brew today';
    case 'deepSteep':
      return 'Deep steep';
    case 'goal':
      return 'Daily goal met';
    case 'quest':
      return questTitle ? `Recipe: ${questTitle}` : 'Recipe done';
    case 'allQuests':
      return 'All recipes done';
    case 'carryOver':
      return e.note ?? 'Carried over';
    case 'gift':
      return e.note ?? 'A little gift';
  }
}

function sanitize(r: SessionRecord): SessionRecord {
  const endedAt = Number(r.endedAt);
  const plannedMs = Math.max(0, Number(r.plannedMs) || 0);
  return {
    ...r,
    focusedMs: Math.max(0, Math.min(Number(r.focusedMs) || 0, plannedMs || Number(r.focusedMs) || 0)),
    intention: typeof r.intention === 'string' ? r.intention.trim().slice(0, 140) : '',
    tag: r.tag ?? null,
    day: typeof r.day === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(r.day) ? r.day : dayKey(endedAt),
  };
}

function insertSorted(list: SessionRecord[], r: SessionRecord): SessionRecord[] {
  const out = list.slice();
  let i = out.length;
  while (i > 0 && out[i - 1].endedAt > r.endedAt) i--;
  out.splice(i, 0, r);
  return out;
}

const focusMs = (records: SessionRecord[]) => records.reduce((a, s) => a + (s.phase === 'focus' ? s.focusedMs : 0), 0);

export function applyRecord(data: ProgressData, raw: SessionRecord, ctx: EngineContext): ApplyResult {
  const none: ApplyResult = { data, report: null, duplicate: true, entries: [], levelUp: null, streakUp: null, badges: [], quests: [] };
  if (!raw || typeof raw.id !== 'string') return none;
  if (data.sessions.some((s) => s.id === raw.id) || data.tombstones.includes(raw.id)) return none;
  const r = sanitize(raw);
  const day = r.day;
  const at = ctx.now;
  const today = dayKey(ctx.now);
  const isFocus = r.phase === 'focus';

  const sessions = insertSorted(data.sessions, r);
  const dayGoals = { ...data.dayGoals, [day]: ctx.goalMin };
  const goalMin = ctx.goalMin;

  const qBefore: QuestDayState = data.quests[day] ?? newQuestDay(day, goalMin, new Date(r.startedAt).getHours());
  const dayRecordsBefore = data.sessions.filter((s) => s.day === day);
  const dayLedgerBefore = data.ledger.filter((e) => e.day === day);
  // Grant ids are day-scoped (`goal:<day>` …) or session-scoped (`focus:<id>` …), so only
  // the day's entries (and, rarely, a deleted session's) can collide — no full-ledger Set.
  const ledgerIds = new Set(dayLedgerBefore.map((e) => e.id));
  if (data.ledger.some((e) => e.ref === r.id && e.day !== day)) for (const e of data.ledger) if (e.ref === r.id) ledgerIds.add(e.id);

  const entries: LeafEntry[] = [];
  const add = (kind: LeafKind, amount: number, id: string, ref?: string) => {
    if (amount > 0 && !ledgerIds.has(id)) {
      ledgerIds.add(id);
      entries.push({ id, at, day, kind, amount, ...(ref ? { ref } : {}) });
    }
  };

  const hadCompletedToday = dayRecordsBefore.some((s) => s.phase === 'focus' && s.completed);
  const beforeMs = focusMs(dayRecordsBefore);
  const beforeMin = Math.floor(beforeMs / MIN);
  const afterMin = Math.floor((beforeMs + (isFocus ? r.focusedMs : 0)) / MIN);
  const alreadyMet = ledgerIds.has(`goal:${day}`);

  if (isFocus) {
    add('focus', Math.floor(r.focusedMs / MIN), `focus:${r.id}`, r.id);
    if (r.completed) {
      add('fullBrew', BONUS.fullBrew, `full:${r.id}`, r.id);
      if (!hadCompletedToday) add('firstBrew', BONUS.firstBrew, `first:${day}`, r.id);
      if (r.plannedMs >= DEEP_STEEP_MS) add('deepSteep', BONUS.deepSteep, `deep:${r.id}`, r.id);
    }
    if (afterMin >= goalMin && goalMin > 0) add('goal', BONUS.goal, `goal:${day}`, r.id);
  }

  // Recipes
  const dayRecordsAfter = [...dayRecordsBefore, r];
  const done = { ...qBefore.done };
  const completedQuests: QuestSpec[] = [];
  const questBefore = qBefore.list.map((q) =>
    qBefore.done[q.id] != null ? q.target : Math.min(q.target, measureQuest(q.kind, { records: dayRecordsBefore, ledger: dayLedgerBefore })),
  );
  const ledgerForMeasure = [...dayLedgerBefore, ...entries];
  const questAfter = qBefore.list.map((q) => {
    if (done[q.id] != null) return q.target;
    const m = measureQuest(q.kind, { records: dayRecordsAfter, ledger: ledgerForMeasure });
    if (m >= q.target) {
      done[q.id] = at;
      completedQuests.push(q);
      add('quest', q.reward, `quest:${day}:${q.id}`, q.id);
      return q.target;
    }
    return Math.min(q.target, m);
  });
  const allBefore = qBefore.list.length > 0 && qBefore.list.every((q) => qBefore.done[q.id] != null);
  const allAfter = qBefore.list.length > 0 && qBefore.list.every((q) => done[q.id] != null);
  if (allAfter && !allBefore) add('allQuests', BONUS.allQuests, `recipes:${day}`);
  const quests = { ...data.quests, [day]: { ...qBefore, done } };

  const gained = entries.reduce((a, e) => a + e.amount, 0);
  const ledger = entries.length ? [...data.ledger, ...entries] : data.ledger;
  const leaves = data.leaves + gained;

  // Streak (only completed focus sessions can change it)
  const affectsStreak = isFocus && r.completed;
  const skip = !!ctx.lite && !!ctx.skipBadges;
  const tlAfter: StreakTimeline | null = skip ? null : streakTimeline(sessions, today);
  const tlBefore: StreakTimeline | null = affectsStreak && !ctx.lite ? streakTimeline(data.sessions, today) : tlAfter;

  // Badges
  const { badges, awards } = tlAfter
    ? evaluateBadges(data.badges, badgeMetrics({ sessions, ledger, leaves, bestStreak: tlAfter.best }), at)
    : { badges: data.badges, awards: [] };

  const lvBefore = levelFromLeaves(data.leaves);
  const lvAfter = levelFromLeaves(leaves);

  const next: ProgressData = {
    ...data,
    sessions,
    ledger,
    leaves,
    cozies: tlAfter ? tlAfter.cozies : data.cozies,
    dayGoals,
    quests,
    badges,
    rev: data.rev + 1,
  };

  const extended = !!tlAfter && !!tlBefore && affectsStreak && tlAfter.current > tlBefore.current;
  const result: ApplyResult = {
    data: next,
    report: null,
    duplicate: false,
    entries,
    levelUp: lvAfter.level > lvBefore.level ? { from: lvBefore.level, to: lvAfter.level } : null,
    streakUp: extended ? { from: tlBefore.current, to: tlAfter.current } : null,
    badges: awards,
    quests: completedQuests,
  };
  if (!isFocus || ctx.lite || !tlAfter || !tlBefore) return result;

  const questTitle = (id?: string) => qBefore.list.find((q) => q.id === id)?.title;
  const order: LeafKind[] = ['fullBrew', 'firstBrew', 'deepSteep', 'goal', 'quest', 'allQuests'];
  const bonuses: ReportBonus[] = entries
    .filter((e) => e.kind !== 'focus')
    .sort((a, b) => order.indexOf(a.kind) - order.indexOf(b.kind))
    .map((e) => ({ kind: e.kind, label: leafLabel(e, questTitle(e.ref)), amount: e.amount }));
  const base = entries.find((e) => e.kind === 'focus')?.amount ?? 0;
  const before = new Set(itemsUnlockedAt(lvBefore.level));

  result.report = {
    id: r.id,
    at,
    record: r,
    whileAway: !!ctx.whileAway,
    firstEver: r.completed && !data.sessions.some((s) => s.phase === 'focus' && s.completed),
    leaves: { base, bonuses, total: gained, before: data.leaves, after: leaves },
    goal: {
      beforeMin,
      afterMin,
      goalMin,
      justMet: entries.some((e) => e.kind === 'goal'),
      alreadyMet,
      metDays: ledger.filter((e) => e.kind === 'goal').length,
    },
    streak: {
      before: tlBefore.current,
      after: tlAfter.current,
      extended,
      best: tlAfter.best,
      newBest: extended && tlAfter.current > tlBefore.best && tlAfter.current > 1,
      cozies: tlAfter.cozies,
      cozyEarned: extended && tlAfter.cozyEarnedOn.length > tlBefore.cozyEarnedOn.length,
      milestone: extended ? milestoneFor(tlAfter.current) : null,
      week: weekStrip(tlAfter, today, ctx.weekStartsOn),
    },
    level: {
      before: lvBefore.level,
      after: lvAfter.level,
      leavesBefore: data.leaves,
      leavesAfter: leaves,
      intoBefore: lvBefore.into,
      sizeBefore: lvBefore.size,
      intoAfter: lvAfter.into,
      sizeAfter: lvAfter.size,
      unlocked: itemsUnlockedAt(lvAfter.level).filter((id) => !before.has(id)),
    },
    quests: qBefore.list.map((q, i) => ({
      id: q.id,
      title: q.title,
      icon: q.icon,
      before: questBefore[i],
      after: questAfter[i],
      target: q.target,
      justCompleted: completedQuests.includes(q),
      done: done[q.id] != null,
      reward: q.reward,
    })),
    allQuestsJustDone: allAfter && !allBefore,
    badges: awards,
  };
  return result;
}

export interface ReplayOptions {
  goalMin: number;
  weekStartsOn?: number;
  /** Per-day goal overrides (e.g. from an older export). */
  dayGoals?: Record<DayKey, number>;
  /** Pre-set recipes for given days (seeds). */
  quests?: Record<DayKey, QuestSpec[]>;
  /** Offset from each record's end used as "now" while replaying. */
  nowOffsetMs?: number;
}

/** Rebuild a full ProgressData from raw records by replaying them in order. */
export function replay(records: SessionRecord[], opts: ReplayOptions, start: ProgressData = emptyData()): ProgressData {
  let data: ProgressData = { ...start };
  if (opts.quests) {
    const quests = { ...data.quests };
    for (const [day, list] of Object.entries(opts.quests)) quests[day] = { goalMin: opts.dayGoals?.[day] ?? opts.goalMin, list, done: {} };
    data = { ...data, quests };
  }
  const sorted = records.slice().sort((a, b) => a.endedAt - b.endedAt);
  sorted.forEach((r, i) => {
    const goalMin = opts.dayGoals?.[r.day] ?? opts.goalMin;
    // Streak + badges are evaluated at the end of each day (and at the end), which keeps
    // long replays fast while unlock timestamps stay accurate to the day.
    const lastOfDay = i === sorted.length - 1 || sorted[i + 1].day !== r.day;
    const ctx: EngineContext = { now: r.endedAt + (opts.nowOffsetMs ?? 1000), goalMin, weekStartsOn: opts.weekStartsOn ?? 1, lite: true, skipBadges: !lastOfDay };
    data = applyRecord(data, r, ctx).data;
  });
  return data;
}

/** Recompute cached fields (leaves, cozies) from the source of truth. */
export function refreshCaches(data: ProgressData, today: DayKey): ProgressData {
  const leaves = data.ledger.reduce((a, e) => a + e.amount, 0);
  const cozies = streakTimeline(warmDays(data.sessions), today).cozies;
  if (leaves === data.leaves && cozies === data.cozies) return data;
  return { ...data, leaves, cozies };
}
