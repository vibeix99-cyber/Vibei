import type { TagId } from '@/state/settings';

export type Phase = 'focus' | 'shortBreak' | 'longBreak';
export type TimerStatus = 'idle' | 'running' | 'paused';

/** How the previous phase ended — lets other tabs tell "completed" from "ended early". */
export interface LastEnded {
  sessionId: string;
  phase: Phase;
  reason: 'complete' | 'user' | 'skip';
  /** Epoch ms the phase ended (for completions: the real end time, even if detected later). */
  at: number;
  whileAway: boolean;
}

export interface TimerState {
  status: TimerStatus;
  phase: Phase;
  /** Planned total length of the current phase, including any added time. */
  plannedMs: number;
  /** Epoch ms the current phase first started (null when idle). */
  startedAt: number | null;
  /** Epoch ms the phase will end — authoritative while running. */
  endsAt: number | null;
  /** Remaining ms — authoritative while paused/idle. */
  remainingMs: number;
  /** Epoch ms the current pause began (null unless paused). */
  pausedAt: number | null;
  /** Total ms spent paused during this phase. */
  pausedTotalMs: number;
  /** Focus sessions completed since the last long break. */
  completedInCycle: number;
  intention: string;
  tag: TagId | null;
  /** Id of the session being timed (stable across reloads and tabs). */
  sessionId: string | null;
  /** The most recent phase that ended (completed or stopped). Guards against double completion. */
  lastEnded: LastEnded | null;
}

export interface StartFocusOptions {
  intention?: string;
  tag?: TagId | null;
  /** Override the configured focus length (fractions allowed, e.g. 0.1 = 6 s for tests). */
  minutes?: number;
}

/** A render-friendly snapshot of the timer at one displayed second. */
export interface TimerView {
  status: TimerStatus;
  phase: Phase;
  sessionId: string | null;
  plannedMs: number;
  /** Remaining ms at the moment the snapshot was taken. */
  remainingMs: number;
  /** Whole seconds shown on the clock (ceil — never shows 0:00 early). */
  seconds: number;
  /** 0..1 through the phase at the snapshot moment (use `useProgressFrame` for smooth rings). */
  progress: number;
  /** True once a running phase has hit zero but its completion hasn't been processed yet. */
  due: boolean;
}
