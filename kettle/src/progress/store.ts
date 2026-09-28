/**
 * Progress store — MINIMAL PLACEHOLDER. OWNER: progress area.
 * Replace internals freely; keep the exported hook/selector names stable
 * (other areas depend on them) or update all call sites in the same change.
 */
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { useMemo } from 'react';
import { safeStorage, STORAGE_PREFIX } from '@/lib/storage';
import { addDays, todayKey } from '@/lib/dates';
import { emit, on } from '@/lib/events';
import { getSettings, useSettings } from '@/state/settings';
import { itemsUnlockedAt } from './items';
import type { CompletionReport, LevelInfo, Quest, SessionRecord, StreakInfo, TodaySummary } from './types';

interface ProgressState {
  sessions: SessionRecord[];
  leaves: number;
  cozies: number;
  lastReport: CompletionReport | null;
}

interface ProgressActions {
  recordSession: (record: SessionRecord, whileAway?: boolean) => CompletionReport | null;
  clearReport: () => void;
  resetAll: () => void;
}

/** Leaves needed to reach `level` from level 1. Level 2 arrives after the first brew. */
export function leavesForLevel(level: number): number {
  if (level <= 1) return 0;
  let total = 0;
  for (let l = 2; l <= level; l++) total += 20 + (l - 2) * 15;
  return total;
}

export function levelFromLeaves(leaves: number): LevelInfo {
  let level = 1;
  while (leaves >= leavesForLevel(level + 1)) level++;
  const base = leavesForLevel(level);
  return { level, leaves, into: leaves - base, size: leavesForLevel(level + 1) - base };
}

function focusDays(sessions: SessionRecord[]): Set<string> {
  return new Set(sessions.filter((s) => s.phase === 'focus' && s.completed).map((s) => s.day));
}

export function computeStreak(sessions: SessionRecord[], today = todayKey()): { current: number; best: number } {
  const days = focusDays(sessions);
  let current = 0;
  let cursor = days.has(today) ? today : addDays(today, -1);
  while (days.has(cursor)) {
    current++;
    cursor = addDays(cursor, -1);
  }
  let best = 0;
  const sorted = [...days].sort();
  let run = 0;
  let prev: string | null = null;
  for (const d of sorted) {
    run = prev && addDays(prev, 1) === d ? run + 1 : 1;
    best = Math.max(best, run);
    prev = d;
  }
  return { current, best: Math.max(best, current) };
}

export const useProgress = create<ProgressState & ProgressActions>()(
  persist(
    (set, get) => ({
      sessions: [],
      leaves: 0,
      cozies: 0,
      lastReport: null,

      recordSession: (record, whileAway = false) => {
        const s = get();
        if (s.sessions.some((x) => x.id === record.id)) return null; // idempotent
        const sessions = [...s.sessions, record];
        if (record.phase !== 'focus') {
          set({ sessions });
          return null;
        }
        const minutes = Math.floor(record.focusedMs / 60000);
        const base = minutes;
        const bonuses = record.completed ? [{ label: 'Full brew', amount: 5 }] : [];
        const total = base + bonuses.reduce((a, b) => a + b.amount, 0);
        const before = levelFromLeaves(s.leaves);
        const after = levelFromLeaves(s.leaves + total);
        const today = record.day;
        const goalMin = getSettings().dailyGoalMin;
        const beforeMin = s.sessions.filter((x) => x.phase === 'focus' && x.day === today).reduce((a, x) => a + x.focusedMs, 0) / 60000;
        const afterMin = beforeMin + record.focusedMs / 60000;
        const sb = computeStreak(s.sessions, today);
        const sa = computeStreak(sessions, today);
        const week = Array.from({ length: 7 }, (_, i) => {
          const day = addDays(today, i - 6);
          const done = focusDays(sessions).has(day);
          const label = new Date(`${day}T12:00:00`).toLocaleDateString(undefined, { weekday: 'narrow' });
          return { day, label, state: done ? ('done' as const) : day === today ? ('today' as const) : ('missed' as const) };
        });
        const unlocked = itemsUnlockedAt(after.level).filter((id) => !itemsUnlockedAt(before.level).includes(id));
        const report: CompletionReport = {
          record,
          whileAway,
          leaves: { base, bonuses, total },
          goal: { beforeMin, afterMin, goalMin, justMet: beforeMin < goalMin && afterMin >= goalMin },
          streak: { before: sb.current, after: sa.current, extended: record.completed && sa.current > sb.current, week },
          level: { before: before.level, after: after.level, leavesBefore: s.leaves, leavesAfter: s.leaves + total, unlocked },
          quests: [],
          badges: [],
        };
        set({ sessions, leaves: s.leaves + total, lastReport: record.completed ? report : s.lastReport });
        emit('progress:report', { report });
        if (after.level > before.level) emit('progress:levelup', { from: before.level, to: after.level });
        return report;
      },

      clearReport: () => set({ lastReport: null }),
      resetAll: () => set({ sessions: [], leaves: 0, cozies: 0, lastReport: null }),
    }),
    {
      name: `${STORAGE_PREFIX}progress`,
      version: 1,
      storage: createJSONStorage(() => safeStorage),
      partialize: (s) => ({ sessions: s.sessions, leaves: s.leaves, cozies: s.cozies, lastReport: s.lastReport }),
    },
  ),
);

let started = false;
/** Subscribe to timer events. Must run before `initTimer()`. */
export function initProgress(): void {
  if (started) return;
  started = true;
  on('timer:complete', ({ record, whileAway }) => {
    useProgress.getState().recordSession(record, whileAway);
  });
  on('timer:stop', ({ record }) => {
    if (record) useProgress.getState().recordSession(record);
  });
}

// ---------- selector hooks (stable API) ----------

export function useLevel(): LevelInfo {
  const leaves = useProgress((s) => s.leaves);
  return useMemo(() => levelFromLeaves(leaves), [leaves]);
}

export function useStreak(): StreakInfo {
  const sessions = useProgress((s) => s.sessions);
  const cozies = useProgress((s) => s.cozies);
  return useMemo(() => {
    const { current, best } = computeStreak(sessions);
    const todayDone = focusDays(sessions).has(todayKey());
    return { current, best, todayDone, cozies };
  }, [sessions, cozies]);
}

export function useToday(): TodaySummary {
  const sessions = useProgress((s) => s.sessions);
  const goalMin = useSettings((s) => s.dailyGoalMin);
  return useMemo(() => {
    const day = todayKey();
    const todays = sessions.filter((s) => s.phase === 'focus' && s.day === day);
    const focusMs = todays.reduce((a, s) => a + s.focusedMs, 0);
    return { day, focusMs, sessions: todays.filter((s) => s.completed).length, goalMin, goalProgress: focusMs / 60000 / goalMin };
  }, [sessions, goalMin]);
}

export function useQuests(): Quest[] {
  return [];
}

export function useUnlockedItems(): string[] {
  const { level } = useLevel();
  return useMemo(() => itemsUnlockedAt(level), [level]);
}
