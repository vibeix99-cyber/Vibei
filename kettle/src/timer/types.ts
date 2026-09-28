import type { TagId } from '@/state/settings';

export type Phase = 'focus' | 'shortBreak' | 'longBreak';
export type TimerStatus = 'idle' | 'running' | 'paused';

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
  /** Id of the session being timed (stable across reloads). */
  sessionId: string | null;
}

export interface StartFocusOptions {
  intention?: string;
  tag?: TagId | null;
  /** Override the configured focus length. */
  minutes?: number;
}
