/**
 * Timer engine store. OWNER: timer area.
 *
 * Wall-clock anchored: while running, `endsAt` is authoritative and remaining
 * time is always derived from `clock.now()`. Nothing accumulates per tick, so
 * there is no drift, and a reload/close resumes (or completes) correctly.
 */
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { clock } from '@/lib/clock';
import { emit } from '@/lib/events';
import { uid } from '@/lib/id';
import { dayKey } from '@/lib/dates';
import { safeStorage, STORAGE_PREFIX } from '@/lib/storage';
import { getSettings } from '@/state/settings';
import type { SessionRecord } from '@/progress/types';
import type { Phase, StartFocusOptions, TimerState } from './types';

const MIN = 60_000;
/** Focus shorter than this (when ended early) is not recorded. */
export const MIN_RECORDABLE_MS = MIN;

export const INITIAL_TIMER: TimerState = {
  status: 'idle',
  phase: 'focus',
  plannedMs: 25 * MIN,
  startedAt: null,
  endsAt: null,
  remainingMs: 25 * MIN,
  pausedAt: null,
  pausedTotalMs: 0,
  completedInCycle: 0,
  intention: '',
  tag: null,
  sessionId: null,
};

export function phaseLengthMs(phase: Phase): number {
  const s = getSettings();
  const min = phase === 'focus' ? s.focusMin : phase === 'shortBreak' ? s.shortBreakMin : s.longBreakMin;
  return Math.max(1, min) * MIN;
}

/** Remaining ms for any timer state at time `now`. */
export function remainingAt(s: TimerState, now: number = clock.now()): number {
  if (s.status === 'running' && s.endsAt != null) return Math.max(0, s.endsAt - now);
  return Math.max(0, s.remainingMs);
}

/** 0..1 progress through the current phase. */
export function progressAt(s: TimerState, now: number = clock.now()): number {
  if (s.plannedMs <= 0) return 0;
  return Math.min(1, Math.max(0, 1 - remainingAt(s, now) / s.plannedMs));
}

/** Which break follows the current focus session. */
export function nextBreakKind(completedInCycle: number): Phase {
  const every = Math.max(1, getSettings().longBreakEvery);
  return completedInCycle > 0 && completedInCycle % every === 0 ? 'longBreak' : 'shortBreak';
}

interface TimerActions {
  startFocus: (opts?: StartFocusOptions) => void;
  startBreak: (kind?: Phase) => void;
  pause: () => void;
  resume: () => void;
  toggle: () => void;
  addTime: (ms: number) => void;
  /** End the current phase early. Focus ≥ 1 min is still recorded (not completed). */
  end: (reason?: 'user' | 'skip') => void;
  /** Check for completion. Called by the ticker; safe to call any time. */
  tick: () => void;
  /** Back to idle without recording anything (e.g. reset data). */
  reset: () => void;
  setIntention: (intention: string, tag?: TagId | null) => void;
}

type TagId = TimerState['tag'];

function buildRecord(s: TimerState, endedAt: number, completed: boolean): SessionRecord {
  const startedAt = s.startedAt ?? endedAt;
  const pausedExtra = s.status === 'paused' && s.pausedAt != null ? endedAt - s.pausedAt : 0;
  const focusedMs = Math.max(0, Math.min(s.plannedMs, endedAt - startedAt - s.pausedTotalMs - pausedExtra));
  return {
    id: s.sessionId ?? uid('s_'),
    phase: s.phase,
    startedAt,
    endedAt,
    plannedMs: s.plannedMs,
    focusedMs: completed ? s.plannedMs : focusedMs,
    completed,
    intention: s.intention.trim(),
    tag: s.tag,
    day: dayKey(endedAt),
  };
}

export const useTimer = create<TimerState & TimerActions>()(
  persist(
    (set, get) => ({
      ...INITIAL_TIMER,

      startFocus: (opts = {}) => {
        const now = clock.now();
        const plannedMs = opts.minutes ? opts.minutes * MIN : phaseLengthMs('focus');
        const s = get();
        set({
          status: 'running',
          phase: 'focus',
          plannedMs,
          startedAt: now,
          endsAt: now + plannedMs,
          remainingMs: plannedMs,
          pausedAt: null,
          pausedTotalMs: 0,
          intention: opts.intention ?? s.intention,
          tag: opts.tag !== undefined ? opts.tag : s.tag,
          sessionId: uid('s_'),
        });
        emit('timer:start', { phase: 'focus', durationMs: plannedMs, resumed: false });
      },

      startBreak: (kind) => {
        const now = clock.now();
        const phase = kind ?? nextBreakKind(get().completedInCycle);
        const plannedMs = phaseLengthMs(phase);
        set({
          status: 'running',
          phase,
          plannedMs,
          startedAt: now,
          endsAt: now + plannedMs,
          remainingMs: plannedMs,
          pausedAt: null,
          pausedTotalMs: 0,
          sessionId: uid('b_'),
          completedInCycle: phase === 'longBreak' ? 0 : get().completedInCycle,
        });
        emit('timer:start', { phase, durationMs: plannedMs, resumed: false });
      },

      pause: () => {
        const s = get();
        if (s.status !== 'running') return;
        const now = clock.now();
        const remainingMs = remainingAt(s, now);
        set({ status: 'paused', remainingMs, endsAt: null, pausedAt: now });
        emit('timer:pause', { phase: s.phase, remainingMs });
      },

      resume: () => {
        const s = get();
        if (s.status !== 'paused') return;
        const now = clock.now();
        const pausedFor = s.pausedAt != null ? Math.max(0, now - s.pausedAt) : 0;
        set({
          status: 'running',
          endsAt: now + s.remainingMs,
          pausedAt: null,
          pausedTotalMs: s.pausedTotalMs + pausedFor,
        });
        emit('timer:resume', { phase: s.phase, remainingMs: s.remainingMs });
      },

      toggle: () => {
        const s = get();
        if (s.status === 'running') s.pause();
        else if (s.status === 'paused') s.resume();
      },

      addTime: (ms) => {
        const s = get();
        if (s.status === 'idle') return;
        if (s.status === 'running' && s.endsAt != null) {
          set({ endsAt: s.endsAt + ms, plannedMs: s.plannedMs + ms });
        } else {
          set({ remainingMs: s.remainingMs + ms, plannedMs: s.plannedMs + ms });
        }
        emit('timer:addTime', { phase: s.phase, addedMs: ms });
      },

      end: (reason = 'user') => {
        const s = get();
        if (s.status === 'idle') return;
        const now = clock.now();
        let record: SessionRecord | null = null;
        if (s.phase === 'focus') {
          const r = buildRecord(s, now, false);
          if (r.focusedMs >= MIN_RECORDABLE_MS) record = r;
        }
        set({ ...INITIAL_TIMER, completedInCycle: s.completedInCycle, intention: s.intention, tag: s.tag, plannedMs: phaseLengthMs('focus'), remainingMs: phaseLengthMs('focus') });
        emit('timer:stop', { phase: s.phase, reason, record });
      },

      tick: () => {
        const s = get();
        if (s.status !== 'running' || s.endsAt == null) return;
        const now = clock.now();
        if (now < s.endsAt) return;
        const whileAway = now - s.endsAt > 5_000;
        const endedAt = s.endsAt;
        const record = buildRecord(s, endedAt, true);
        const completedInCycle = s.phase === 'focus' ? s.completedInCycle + 1 : s.completedInCycle;
        set({
          ...INITIAL_TIMER,
          completedInCycle,
          intention: s.intention,
          tag: s.tag,
          plannedMs: phaseLengthMs('focus'),
          remainingMs: phaseLengthMs('focus'),
        });
        emit('timer:complete', { phase: s.phase, record, whileAway });
      },

      reset: () => set({ ...INITIAL_TIMER, plannedMs: phaseLengthMs('focus'), remainingMs: phaseLengthMs('focus') }),

      setIntention: (intention, tag) => set(tag === undefined ? { intention } : { intention, tag }),
    }),
    {
      name: `${STORAGE_PREFIX}timer`,
      version: 1,
      storage: createJSONStorage(() => safeStorage),
      partialize: (s): TimerState => ({
        status: s.status,
        phase: s.phase,
        plannedMs: s.plannedMs,
        startedAt: s.startedAt,
        endsAt: s.endsAt,
        remainingMs: s.remainingMs,
        pausedAt: s.pausedAt,
        pausedTotalMs: s.pausedTotalMs,
        completedInCycle: s.completedInCycle,
        intention: s.intention,
        tag: s.tag,
        sessionId: s.sessionId,
      }),
    },
  ),
);

export const getTimer = () => useTimer.getState();
