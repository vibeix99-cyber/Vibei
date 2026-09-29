/**
 * Progress store. OWNER: progress area.
 *
 * Persisted (schema v2, versioned migrations) in localStorage under
 * `kettle:progress`. All game logic lives in the pure `engine.ts`; this file
 * adds persistence, cross-tab safety, events and the React selector hooks
 * (stable public API — see index.ts).
 *
 * Multi-tab safety: every write bumps `rev`. Before recording, the store
 * re-reads storage and adopts a newer revision written by another tab, then
 * applies the record idempotently (same session id never counts twice). A
 * `storage` listener keeps idle tabs in sync.
 */
import { useEffect, useMemo } from 'react';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { clock } from '@/lib/clock';
import { dayKey, type DayKey } from '@/lib/dates';
import { emit, on } from '@/lib/events';
import { safeStorage, STORAGE_PREFIX } from '@/lib/storage';
import { getSettings, useSettings, type TagId } from '@/state/settings';
import { badgeMetrics, badgeProgress, ROMAN } from './badgeEngine';
import { applyRecord, emptyData, refreshCaches, replay, SCHEMA_VERSION, type ApplyResult } from './engine';
import { itemsUnlockedAt } from './items';
import { levelFromLeaves } from './levels';
import { newQuestDay, questsView } from './quests';
import { daysToNextCozy, localeWeekStart, MAX_COZIES, streakTimeline, warmDays } from './streak';
import { useDayKey, useHour } from './time';
import { coerceData } from './validate';
import { reconcile } from './merge';
import { uid } from '@/lib/id';
import type { BadgeProgress, CompletionReport, IntentionOutcome, LevelInfo, ProgressData, Quest, SessionRecord, StreakInfo, TodaySummary } from './types';

export { leavesForLevel, levelFromLeaves } from './levels';

export const PROGRESS_KEY = `${STORAGE_PREFIX}progress`;

interface ProgressActions {
  /** Record a finished phase. Idempotent by `record.id`. Returns the report for focus sessions. */
  recordSession: (record: SessionRecord, whileAway?: boolean) => CompletionReport | null;
  /** Edit what a session was about. */
  /** `outcome: null` clears it. Changing the intention text clears a stale outcome. */
  editSession: (id: string, patch: { intention?: string; tag?: TagId | null; outcome?: IntentionOutcome | null }) => void;
  /** Remove a session from history (leaves earned are kept). */
  deleteSession: (id: string) => void;
  /** Undo a delete: put the session back exactly as it was. */
  restoreSession: (record: SessionRecord) => void;
  /** Snapshot today's recipes (called by useQuests). */
  ensureToday: () => void;
  clearReport: () => void;
  resetAll: () => void;
  /** Replace the whole document (import / seeds). */
  load: (data: ProgressData) => void;
}

export type ProgressStore = ProgressData & ProgressActions;

const DATA_KEYS: (keyof ProgressData)[] = ['sessions', 'ledger', 'leaves', 'cozies', 'dayGoals', 'quests', 'badges', 'tombstones', 'deletedAt', 'lastReport', 'rev', 'epoch'];

/** The first version stamp after a record's current one. */
const versionAfter = (r: SessionRecord | undefined) => (r ? (r.v ?? r.endedAt) + 1 : 0);

export function pickData(s: ProgressData): ProgressData {
  const out = {} as Record<string, unknown>;
  for (const k of DATA_KEYS) out[k] = s[k];
  return out as unknown as ProgressData;
}

/** v1 (placeholder) → v2: replay sessions through the engine; never lose leaves. */
export function migrateV1(old: unknown): ProgressData {
  const { data: coerced } = coerceData(old);
  const goalMin = getSettings().dailyGoalMin;
  let data = replay(coerced.sessions, { goalMin, weekStartsOn: localeWeekStart() });
  const oldLeaves = typeof (old as { leaves?: unknown })?.leaves === 'number' ? Math.floor((old as { leaves: number }).leaves) : 0;
  if (oldLeaves > data.leaves) {
    const now = clock.now();
    const extra = oldLeaves - data.leaves;
    data = {
      ...data,
      ledger: [...data.ledger, { id: `carry:v1`, at: now, day: dayKey(now), kind: 'carryOver', amount: extra, note: 'Carried over' }],
      leaves: oldLeaves,
    };
  }
  return data;
}

function readStored(): ProgressData | null {
  const raw = safeStorage.getItem(PROGRESS_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as { state?: unknown; version?: number };
    if (parsed.version !== SCHEMA_VERSION) return null;
    return coerceData(parsed.state, clock.now()).data;
  } catch {
    return null;
  }
}

function ctxNow(whileAway = false) {
  return { now: clock.now(), goalMin: getSettings().dailyGoalMin, weekStartsOn: localeWeekStart(), whileAway };
}

export const useProgress = create<ProgressStore>()(
  persist(
    (set, get) => ({
      ...emptyData(),

      recordSession: (record, whileAway = false) => {
        syncFromStorage();
        const s = get();
        let res: ApplyResult;
        try {
          res = applyRecord(pickData(s), record, ctxNow(whileAway));
        } catch (err) {
          console.error('[progress] could not record session', err);
          return null;
        }
        if (res.duplicate) return s.lastReport?.id === record.id ? s.lastReport : null;
        const completedFocus = record.phase === 'focus' && record.completed;
        set({ ...res.data, lastReport: completedFocus && res.report ? res.report : s.lastReport });
        announce(res, completedFocus);
        return res.report;
      },

      editSession: (id, patch) => {
        syncFromStorage();
        const s = get();
        const clean: Partial<SessionRecord> = {};
        if (patch.intention !== undefined) clean.intention = patch.intention.trim().slice(0, 140);
        if (patch.tag !== undefined) clean.tag = patch.tag;
        if (patch.outcome !== undefined) clean.outcome = patch.outcome ?? undefined;
        const apply = (x: SessionRecord): SessionRecord => {
          const next = { ...x, ...clean, v: Math.max(clock.now(), (x.v ?? x.endedAt) + 1) };
          // An outcome belongs to the words it was given for; no words → nothing to mark.
          if (!next.intention || (patch.intention !== undefined && patch.outcome === undefined && next.intention !== x.intention)) delete next.outcome;
          if (!next.outcome) delete next.outcome;
          return next;
        };
        const sessions = s.sessions.map((x) => (x.id === id ? apply(x) : x));
        const lastReport = s.lastReport && s.lastReport.id === id ? { ...s.lastReport, record: apply(s.lastReport.record) } : s.lastReport;
        set({ sessions, lastReport, rev: s.rev + 1 });
      },

      deleteSession: (id) => {
        syncFromStorage();
        const s = get();
        if (!s.sessions.some((x) => x.id === id)) return;
        const next = refreshCaches(
          {
            ...pickData(s),
            sessions: s.sessions.filter((x) => x.id !== id),
            tombstones: [...s.tombstones.filter((t) => t !== id), id].slice(-500),
            deletedAt: { ...s.deletedAt, [id]: Math.max(clock.now(), versionAfter(s.sessions.find((x) => x.id === id))) },
            lastReport: s.lastReport?.id === id ? null : s.lastReport,
            rev: s.rev + 1,
          },
          dayKey(clock.now()),
        );
        set(next);
      },

      restoreSession: (record) => {
        syncFromStorage();
        const s = get();
        if (s.sessions.some((x) => x.id === record.id)) return;
        // Newer than the deletion, so the undo wins in every tab (see merge.ts).
        const v = Math.max(clock.now(), (s.deletedAt?.[record.id] ?? 0) + 1, versionAfter(record));
        const sessions = [...s.sessions, { ...record, v }].sort((a, b) => a.endedAt - b.endedAt);
        const deletedAt = { ...s.deletedAt };
        delete deletedAt[record.id];
        set(
          refreshCaches(
            { ...pickData(s), sessions, tombstones: s.tombstones.filter((t) => t !== record.id), deletedAt, rev: s.rev + 1 },
            dayKey(clock.now()),
          ),
        );
      },

      ensureToday: () => {
        const day = dayKey(clock.now());
        const goal = getSettings().dailyGoalMin;
        const needs = (st: ProgressData) => {
          const existing = st.quests[day];
          if (!existing) return true;
          if (existing.goalMin === goal) return false;
          // Goal changed before anything happened today → rescale today's recipes.
          return Object.keys(existing.done).length === 0 && !st.sessions.some((x) => x.day === day);
        };
        if (!needs(get())) return;
        syncFromStorage();
        const fresh = get();
        if (!needs(fresh)) return;
        set({ quests: { ...fresh.quests, [day]: newQuestDay(day, goal, new Date(clock.now()).getHours()) }, rev: fresh.rev + 1 });
      },

      clearReport: () => {
        if (!get().lastReport) return;
        syncFromStorage();
        if (get().lastReport) set({ lastReport: null, rev: get().rev + 1 });
      },
      // Both start a new data generation, so other tabs adopt them instead of merging old data back in.
      resetAll: () => set({ ...emptyData(), rev: get().rev + 1, epoch: uid('e_') }),
      load: (data) => set({ ...data, rev: Math.max(get().rev, data.rev) + 1, epoch: uid('e_') }),
    }),
    {
      name: PROGRESS_KEY,
      version: SCHEMA_VERSION,
      storage: createJSONStorage(() => safeStorage),
      partialize: (s) => pickData(s),
      migrate: (persisted, version) => {
        if (version < 2) return migrateV1(persisted) as unknown as ProgressStore;
        return coerceData(persisted, clock.now()).data as unknown as ProgressStore;
      },
      merge: (persisted, current) => ({ ...current, ...coerceData(persisted, clock.now()).data }),
    },
  ),
);

/**
 * Reconcile with what other tabs wrote: adopt a newer write that already holds
 * everything we have, merge when both sides hold something the other lacks
 * (same generation), and let a newer generation (reset / replace import) win.
 */
export function syncFromStorage(): void {
  const decision = reconcile(pickData(useProgress.getState()), readStored(), dayKey(clock.now()));
  if (decision.kind !== 'keep') useProgress.setState(decision.data);
}

function announce(res: ApplyResult, completedFocus: boolean): void {
  if (res.report && completedFocus) emit('progress:report', { report: res.report });
  if (res.streakUp) emit('progress:streak', res.streakUp);
  if (res.levelUp) emit('progress:levelup', res.levelUp);
  for (const q of res.quests) emit('progress:quest', { id: q.id });
  for (const b of res.badges) emit('progress:badge', { id: b.id, tier: b.tier });
  // No celebration sequence for breaks / brews ended early → a gentle toast instead.
  if (!completedFocus) {
    for (const q of res.quests) emit('ui:toast', { message: `Recipe done: ${q.title} · +${q.reward} leaves`, tone: 'success' });
    for (const b of res.badges) emit('ui:toast', { message: `New badge: ${b.title}${b.tier > 1 ? ` ${ROMAN[b.tier]}` : ''}`, tone: 'success' });
    if (res.levelUp) emit('ui:toast', { message: `Cozy level ${res.levelUp.to}!`, tone: 'success' });
  }
}

let started = false;
/** Subscribe to timer events + other tabs. Must run before `initTimer()`. */
export function initProgress(): void {
  if (started) return;
  started = true;
  on('timer:complete', ({ record, whileAway }) => {
    useProgress.getState().recordSession(record, whileAway);
  });
  on('timer:stop', ({ record }) => {
    if (record) useProgress.getState().recordSession(record);
  });
  if (typeof window !== 'undefined') {
    window.addEventListener('storage', (e) => {
      if (e.key === PROGRESS_KEY) syncFromStorage();
    });
  }
  // Keep cached counters honest (e.g. cozies consumed overnight).
  const s = useProgress.getState();
  const fixed = refreshCaches(pickData(s), dayKey(clock.now()));
  if (fixed.leaves !== s.leaves || fixed.cozies !== s.cozies) useProgress.setState({ leaves: fixed.leaves, cozies: fixed.cozies });
}

// ---------------------------------------------------------------------------
// Pure helpers (stable API)
// ---------------------------------------------------------------------------

/** Current and best warm streak (Tea Cozies included). */
export function computeStreak(sessions: SessionRecord[], today: DayKey = dayKey(clock.now())): { current: number; best: number } {
  const t = streakTimeline(sessions, today);
  return { current: t.current, best: t.best };
}

// ---------------------------------------------------------------------------
// Selector hooks (stable API)
// ---------------------------------------------------------------------------

export function useLevel(): LevelInfo {
  const leaves = useProgress((s) => s.leaves);
  return useMemo(() => levelFromLeaves(leaves), [leaves]);
}

export function useStreak(): StreakInfo {
  const sessions = useProgress((s) => s.sessions);
  const today = useDayKey();
  const hour = useHour();
  return useMemo(() => {
    const t = streakTimeline(warmDays(sessions), today);
    const cozyDays = t.cozyDays;
    return {
      current: t.current,
      best: t.best,
      todayDone: t.todayDone,
      cozies: t.cozies,
      maxCozies: MAX_COZIES,
      atRisk: t.current > 0 && !t.todayDone && hour >= 18,
      toNextCozy: daysToNextCozy(t.current),
      lastCozyDay: cozyDays.length ? cozyDays[cozyDays.length - 1] : null,
      runs: t.runs,
      days: t.days,
    };
  }, [sessions, today, hour]);
}

export function useToday(): TodaySummary {
  const sessions = useProgress((s) => s.sessions);
  const ledger = useProgress((s) => s.ledger);
  const goalMin = useSettings((s) => s.dailyGoalMin);
  const day = useDayKey();
  return useMemo(() => {
    let focusMs = 0;
    let done = 0;
    let breaks = 0;
    for (const s of sessions) {
      if (s.day !== day) continue;
      if (s.phase === 'focus') {
        focusMs += s.focusedMs;
        if (s.completed) done++;
      } else if (s.completed) breaks++;
    }
    const leaves = ledger.reduce((a, e) => (e.day === day ? a + e.amount : a), 0);
    const goalProgress = goalMin > 0 ? focusMs / 60000 / goalMin : 0;
    return { day, focusMs, sessions: done, goalMin, goalProgress, goalMet: goalProgress >= 1, leaves, breaks };
  }, [sessions, ledger, goalMin, day]);
}

/** Today's three recipes with live progress. Snapshots them on first view. */
export function useQuests(): Quest[] {
  const day = useDayKey();
  const stored = useProgress((s) => s.quests[day]);
  const sessions = useProgress((s) => s.sessions);
  const ledger = useProgress((s) => s.ledger);
  const goalMin = useSettings((s) => s.dailyGoalMin);
  useEffect(() => {
    useProgress.getState().ensureToday();
  }, [day, goalMin]);
  return useMemo(() => {
    const state = stored ?? newQuestDay(day, goalMin, new Date(clock.now()).getHours());
    const records = sessions.filter((s) => s.day === day);
    const dayLedger = ledger.filter((e) => e.day === day);
    return questsView(state, { records, ledger: dayLedger });
  }, [stored, sessions, ledger, day, goalMin]);
}

export function useUnlockedItems(): string[] {
  const { level } = useLevel();
  return useMemo(() => itemsUnlockedAt(level), [level]);
}

/** Every badge with tier, progress toward the next tier and unlock dates. */
export function useBadges(): BadgeProgress[] {
  const sessions = useProgress((s) => s.sessions);
  const ledger = useProgress((s) => s.ledger);
  const leaves = useProgress((s) => s.leaves);
  const badges = useProgress((s) => s.badges);
  const today = useDayKey();
  return useMemo(() => {
    const best = streakTimeline(warmDays(sessions), today).best;
    return badgeProgress(badges, badgeMetrics({ sessions, ledger, leaves, bestStreak: best }));
  }, [sessions, ledger, leaves, badges, today]);
}
