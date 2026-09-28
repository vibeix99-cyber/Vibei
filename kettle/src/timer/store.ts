/**
 * Timer engine store. OWNER: timer area.
 *
 * Wall-clock anchored: while running, `endsAt` is authoritative and remaining
 * time is always derived from `clock.now()`. Nothing accumulates per tick, so
 * there is no drift, and a reload/close resumes (or completes) correctly.
 *
 * Exactly-once completion (see docs/areas/timer.md):
 *  - `tick()` asks the completion guard (installed by `initTimer`) whether this
 *    tab may complete (multi-tab leader, settled) and lets it re-read shared
 *    storage first, so a stale tab never completes a phase another tab already did.
 *  - `lastEnded` is persisted, so a completed session id can never complete twice.
 *  - Progress also dedupes records by id (defence in depth).
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
import type { LastEnded, Phase, StartFocusOptions, TimerState } from './types';

const MIN = 60_000;
/** Focus shorter than this (when ended early) is not recorded. */
export const MIN_RECORDABLE_MS = MIN;
/** A phase can never be planned longer than this (runaway "+5 min" presses, corrupt storage). */
export const MAX_PHASE_MS = 4 * 60 * MIN;
/** A completion detected later than this after the real end counts as "while you were away". */
export const WHILE_AWAY_AFTER_MS = 10_000;
export const TIMER_STORAGE_KEY = `${STORAGE_PREFIX}timer`;

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
  lastEnded: null,
};

export function phaseLengthMs(phase: Phase): number {
  const s = getSettings();
  const min = phase === 'focus' ? s.focusMin : phase === 'shortBreak' ? s.shortBreakMin : s.longBreakMin;
  const n = Number(min);
  return Math.min(MAX_PHASE_MS, Math.max(1, Number.isFinite(n) ? n : 1) * MIN);
}

/** Remaining ms for any timer state at time `now`. Never negative, never more than the plan. */
export function remainingAt(s: TimerState, now: number = clock.now()): number {
  const raw = s.status === 'running' && s.endsAt != null ? s.endsAt - now : s.remainingMs;
  return Math.min(Math.max(0, s.plannedMs), Math.max(0, raw));
}

/** 0..1 progress through the current phase. */
export function progressAt(s: TimerState, now: number = clock.now()): number {
  if (s.plannedMs <= 0) return 0;
  return Math.min(1, Math.max(0, 1 - remainingAt(s, now) / s.plannedMs));
}

/** Active (unpaused) time spent in the current phase — immune to pauses and added time. */
export function elapsedActiveMs(s: TimerState, now: number = clock.now()): number {
  return Math.max(0, s.plannedMs - remainingAt(s, now));
}

/** Which break follows the current focus session. A skipped long break stays owed. */
export function nextBreakKind(completedInCycle: number): Phase {
  const every = Math.max(1, getSettings().longBreakEvery);
  return completedInCycle > 0 && completedInCycle >= every ? 'longBreak' : 'shortBreak';
}

/** True when a running phase has reached zero (completion pending). */
export function isDue(s: TimerState, now: number = clock.now()): boolean {
  return s.status === 'running' && s.endsAt != null && now >= s.endsAt;
}

export function buildRecord(s: TimerState, endedAt: number, completed: boolean): SessionRecord {
  const startedAt = Math.min(s.startedAt ?? endedAt, endedAt);
  const focusedMs = completed ? s.plannedMs : Math.min(s.plannedMs, elapsedActiveMs(s, endedAt));
  return {
    id: s.sessionId ?? uid('s_'),
    phase: s.phase,
    startedAt,
    endedAt,
    plannedMs: s.plannedMs,
    focusedMs,
    completed,
    intention: s.intention.trim(),
    tag: s.tag,
    day: dayKey(endedAt),
  };
}

const PHASES: Phase[] = ['focus', 'shortBreak', 'longBreak'];
const num = (v: unknown): number | null => (typeof v === 'number' && Number.isFinite(v) ? v : null);

/**
 * Repair whatever came out of storage (older versions, another tab mid-write,
 * hand-edited localStorage). Always returns a self-consistent state.
 */
export function sanitizeTimer(raw: unknown, now: number = clock.now()): Partial<TimerState> {
  if (!raw || typeof raw !== 'object') return {};
  const p = raw as Partial<Record<keyof TimerState, unknown>>;
  const out: Partial<TimerState> = {};
  if (typeof p.intention === 'string') out.intention = p.intention;
  if (p.tag === null || typeof p.tag === 'string') out.tag = p.tag as TimerState['tag'];
  const cycle = num(p.completedInCycle);
  if (cycle != null) out.completedInCycle = Math.max(0, Math.floor(cycle));
  const le = p.lastEnded as LastEnded | null | undefined;
  if (le === null || (le && typeof le === 'object' && typeof le.sessionId === 'string')) out.lastEnded = le ?? null;

  const status = p.status;
  const phase = PHASES.includes(p.phase as Phase) ? (p.phase as Phase) : 'focus';
  const planned = num(p.plannedMs);
  const remaining = num(p.remainingMs);
  const endsAt = num(p.endsAt);
  const startedAt = num(p.startedAt);
  const sessionId = typeof p.sessionId === 'string' ? p.sessionId : null;
  const idle = (): Partial<TimerState> => {
    const len = phaseLengthMs('focus');
    return { ...out, status: 'idle', phase: 'focus', plannedMs: len, remainingMs: len, startedAt: null, endsAt: null, pausedAt: null, pausedTotalMs: 0, sessionId: null };
  };
  if (status !== 'running' && status !== 'paused') return idle();
  if (planned == null || planned <= 0 || !sessionId) return idle();
  const plannedMs = Math.min(MAX_PHASE_MS, planned);
  const base: Partial<TimerState> = {
    ...out,
    phase,
    plannedMs,
    sessionId,
    startedAt: startedAt ?? now,
    pausedTotalMs: Math.max(0, num(p.pausedTotalMs) ?? 0),
  };
  if (status === 'running') {
    if (endsAt == null) {
      // Running without an anchor can't be trusted — keep the time, but paused.
      const rem = Math.min(plannedMs, Math.max(0, remaining ?? plannedMs));
      return { ...base, status: 'paused', remainingMs: rem, endsAt: null, pausedAt: now };
    }
    // Clock moved backwards while we were closed: remaining can't exceed the plan.
    const fixedEnds = endsAt - now > plannedMs ? now + plannedMs : endsAt;
    return { ...base, status: 'running', endsAt: fixedEnds, remainingMs: Math.min(plannedMs, Math.max(0, remaining ?? plannedMs)), pausedAt: null };
  }
  const rem = Math.min(plannedMs, Math.max(0, remaining ?? plannedMs));
  return { ...base, status: 'paused', remainingMs: rem, endsAt: null, pausedAt: num(p.pausedAt) ?? now };
}

// ---------- completion guard (multi-tab) ----------

export interface CompletionGuard {
  /** May this tab fire completion side effects right now? (leader + settled) */
  canComplete(): boolean;
  /** Re-read shared state (other tabs) right before completing. */
  refresh(): void;
  /** Session ids another tab has already completed (from broadcast). */
  alreadyCompleted(sessionId: string): boolean;
  /** Tell other tabs we completed this session. */
  announce(sessionId: string): void;
}

const openGuard: CompletionGuard = {
  canComplete: () => true,
  refresh: () => {},
  alreadyCompleted: () => false,
  announce: () => {},
};
let guard: CompletionGuard = openGuard;
/** Installed by `initTimer` (multi-tab). Tests and single-context use run unguarded. */
export function setCompletionGuard(g: CompletionGuard | null): void {
  guard = g ?? openGuard;
}

let completing = false;

// ---------- store ----------

interface TimerActions {
  startFocus: (opts?: StartFocusOptions) => void;
  startBreak: (kind?: Phase) => void;
  pause: () => void;
  resume: () => void;
  toggle: () => void;
  /** Add (or, with a negative value, remove) time from the current phase. */
  addTime: (ms: number) => void;
  /** End the current phase early. Focus ≥ 1 min is still recorded (not completed). */
  end: (reason?: 'user' | 'skip') => void;
  /** Check for completion. Called by the ticker; safe to call any time, from any tab. */
  tick: () => void;
  /** Back to idle without recording anything (e.g. reset data). */
  reset: () => void;
  setIntention: (intention: string, tag?: TimerState['tag']) => void;
  /** Shift all wall-clock anchors by `deltaMs` (system clock changed under us). */
  rebase: (deltaMs: number) => void;
  /** While idle, make the displayed length follow the focus-length setting. */
  syncIdleLength: () => void;
}

export type TimerStore = TimerState & TimerActions;

function idleAfter(s: TimerState, patch: Partial<TimerState>): TimerState {
  const len = phaseLengthMs('focus');
  return {
    ...INITIAL_TIMER,
    completedInCycle: s.completedInCycle,
    intention: s.intention,
    tag: s.tag,
    plannedMs: len,
    remainingMs: len,
    lastEnded: s.lastEnded,
    ...patch,
  };
}

export const useTimer = create<TimerStore>()(
  persist(
    (set, get) => {
      /** Starting over an active phase ends it properly first (so focused minutes still count). */
      const endActive = () => {
        const s = get();
        if (s.status !== 'idle') get().end(s.phase === 'focus' ? 'user' : 'skip');
      };

      return {
        ...INITIAL_TIMER,

        startFocus: (opts = {}) => {
          endActive();
          const now = clock.now();
          const custom = Number(opts.minutes);
          const plannedMs = custom > 0 ? Math.min(MAX_PHASE_MS, custom * MIN) : phaseLengthMs('focus');
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
          endActive();
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
          // A phase that already hit zero completes instead of pausing at 0:00
          // (in a follower tab the leader completes it a moment later).
          if (isDue(s, now)) {
            get().tick();
            return;
          }
          const remainingMs = remainingAt(s, now);
          set({ status: 'paused', remainingMs, endsAt: null, pausedAt: now });
          emit('timer:pause', { phase: s.phase, remainingMs });
        },

        resume: () => {
          const s = get();
          if (s.status !== 'paused') return;
          const now = clock.now();
          const pausedFor = s.pausedAt != null ? Math.max(0, now - s.pausedAt) : 0;
          const remainingMs = Math.min(s.plannedMs, Math.max(0, s.remainingMs));
          set({
            status: 'running',
            endsAt: now + remainingMs,
            remainingMs,
            pausedAt: null,
            pausedTotalMs: s.pausedTotalMs + pausedFor,
          });
          emit('timer:resume', { phase: s.phase, remainingMs });
        },

        toggle: () => {
          const s = get();
          if (s.status === 'running') s.pause();
          else if (s.status === 'paused') s.resume();
        },

        addTime: (ms) => {
          const s = get();
          if (s.status === 'idle' || !Number.isFinite(ms) || ms === 0) return;
          const now = clock.now();
          if (isDue(s, now)) return; // too late — it's already whistling
          const rem = remainingAt(s, now);
          // Clamp: never below zero remaining, never beyond the max phase length.
          const target = Math.max(0, Math.min(rem + ms, MAX_PHASE_MS - (s.plannedMs - rem)));
          const delta = target - rem;
          if (delta === 0) return;
          if (s.status === 'running' && s.endsAt != null) {
            set({ endsAt: now + target, plannedMs: s.plannedMs + delta });
          } else {
            set({ remainingMs: target, plannedMs: s.plannedMs + delta });
          }
          emit('timer:addTime', { phase: s.phase, addedMs: delta });
          if (target === 0) get().tick();
        },

        end: (reason = 'user') => {
          const s = get();
          if (s.status === 'idle') return;
          const now = clock.now();
          // Ending a phase that already ran out is a completion, not an early stop.
          if (isDue(s, now)) {
            get().tick();
            return;
          }
          let record: SessionRecord | null = null;
          if (s.phase === 'focus') {
            const r = buildRecord(s, now, false);
            if (r.focusedMs >= MIN_RECORDABLE_MS) record = r;
          }
          const lastEnded: LastEnded | null = s.sessionId
            ? { sessionId: s.sessionId, phase: s.phase, reason, at: now, whileAway: false }
            : s.lastEnded;
          set(idleAfter(s, { lastEnded }));
          emit('timer:stop', { phase: s.phase, reason, record });
        },

        tick: () => {
          if (completing) return;
          let s = get();
          if (!isDue(s)) return;
          if (!guard.canComplete()) return;
          completing = true;
          try {
            guard.refresh(); // pick up anything another tab just wrote
            s = get();
            if (!isDue(s) || s.endsAt == null) return;
            const sid = s.sessionId;
            if (sid && (s.lastEnded?.sessionId === sid || guard.alreadyCompleted(sid))) {
              // Another tab (or an earlier run of this one) already completed it: mirror, don't repeat.
              set(idleAfter(s, {}));
              return;
            }
            const now = clock.now();
            const endedAt = s.endsAt;
            const whileAway = now - endedAt > WHILE_AWAY_AFTER_MS;
            const record = buildRecord(s, endedAt, true);
            const completedInCycle = s.phase === 'focus' ? s.completedInCycle + 1 : s.completedInCycle;
            set(
              idleAfter(s, {
                completedInCycle,
                lastEnded: { sessionId: record.id, phase: s.phase, reason: 'complete', at: endedAt, whileAway },
              }),
            );
            guard.announce(record.id);
            emit('timer:complete', { phase: s.phase, record, whileAway });
          } finally {
            completing = false;
          }
        },

        reset: () => {
          const len = phaseLengthMs('focus');
          set({ ...INITIAL_TIMER, plannedMs: len, remainingMs: len });
        },

        setIntention: (intention, tag) => set(tag === undefined ? { intention } : { intention, tag }),

        rebase: (deltaMs) => {
          const s = get();
          if (s.status === 'idle' || !Number.isFinite(deltaMs) || deltaMs === 0) return;
          set({
            startedAt: s.startedAt != null ? s.startedAt + deltaMs : null,
            endsAt: s.endsAt != null ? s.endsAt + deltaMs : null,
            pausedAt: s.pausedAt != null ? s.pausedAt + deltaMs : null,
          });
        },

        syncIdleLength: () => {
          const s = get();
          if (s.status !== 'idle') return;
          const len = phaseLengthMs('focus');
          if (s.phase !== 'focus' || s.plannedMs !== len || s.remainingMs !== len) {
            set({ phase: 'focus', plannedMs: len, remainingMs: len });
          }
        },
      };
    },
    {
      name: TIMER_STORAGE_KEY,
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
        lastEnded: s.lastEnded,
      }),
      merge: (persisted, current) => ({ ...current, ...sanitizeTimer(persisted) }),
    },
  ),
);

export const getTimer = () => useTimer.getState();
