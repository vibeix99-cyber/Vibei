/**
 * Session flow orchestration — what happens between phases. OWNER: core-loop area.
 *
 *   focus completes ─┬─ user watching ─▶ ~2.2 s "whistle" beat on /focus ─▶ /done
 *                    └─ away / hidden ──────────────────────────────────────▶ /done (whileAway copy)
 *   /done ── "Tea time" (auto-countdown when settings.autoStartBreaks) ─▶ break on /focus
 *   /done ── "Skip break" ─▶ home
 *   /done ── "Set up" (first brew started from the welcome) ─▶ the optional setup on /welcome
 *
 * /focus and /done are one screen (the session screen): the same stage stays put while its panel changes from
 * the timer to the whistle to the summary to the tea break, so no hand-off ever shows an empty frame.
 *   break completes ─┬─ settings.autoStartFocus ─▶ next brew starts
 *                    └─ otherwise ─▶ "Break's over" card on /focus (CTA: put the kettle on)
 *   end focus early ─▶ home + toast "Saved 12 minutes of focus"
 *   skip break ─▶ home
 *
 * Route guards live in the screens: /focus with nothing to show → home (or /done
 * when a celebration is still pending), /done without a report → home.
 * Reload-safety: `breakOver` + the pending summary persist in sessionStorage.
 */
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { on, emit } from '@/lib/events';
import { clock } from '@/lib/clock';
import { plural } from '@/lib/format';
import { onStorageWriteError, type StorageWriteError } from '@/lib/storage';
import { audio } from '@/audio';
import { toast } from '@/ui/Toast';
import { downloadBackup } from '@/screens/home/shims/data';
import { getSettings } from '@/state/settings';
import { getTimer } from '@/timer';
import type { Phase } from '@/timer/types';
import { useProgress } from '@/progress';
import { getRoute, navigate } from './router';

/** How long the kettle whistles (the panel reads "0:00 · Tea's ready") before the summary takes the panel. */
export const WHISTLE_MS = 2200;
export const WHISTLE_MS_REDUCED = 1200;
/** A break that ended longer ago than this (app closed) just lands on home. */
const STALE_BREAK_MS = 30 * 60_000;

export interface FlowState {
  /** Set during the short whistle beat after a focus completes (not persisted). */
  whistle: { sessionId: string; at: number } | null;
  /** A break finished and the next brew wasn't auto-started. */
  breakOver: { phase: Phase; at: number; whileAway: boolean } | null;
  /** The summary waiting to be seen (keyed by session id) — survives reload. `step` is kept for stored state. */
  celebration: { id: string; step: number } | null;
}

const sessionStore = {
  getItem: (k: string) => {
    try {
      return sessionStorage.getItem(k);
    } catch {
      return null;
    }
  },
  setItem: (k: string, v: string) => {
    try {
      sessionStorage.setItem(k, v);
    } catch {
      /* ignore */
    }
  },
  removeItem: (k: string) => {
    try {
      sessionStorage.removeItem(k);
    } catch {
      /* ignore */
    }
  },
};

export const useFlow = create<FlowState>()(
  persist(
    () => ({ whistle: null, breakOver: null, celebration: null }) as FlowState,
    {
      name: 'kettle:flow',
      version: 1,
      storage: createJSONStorage(() => sessionStore),
      partialize: (s) => ({ breakOver: s.breakOver, celebration: s.celebration }),
    },
  ),
);

export function reducedMotionNow(): boolean {
  const pref = getSettings().motion;
  if (pref === 'reduce') return true;
  if (pref === 'full') return false;
  return typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
}

let whistleTimer: ReturnType<typeof setTimeout> | null = null;
let suppressNextStop = false;

function clearWhistle() {
  if (whistleTimer) clearTimeout(whistleTimer);
  whistleTimer = null;
  if (useFlow.getState().whistle) useFlow.setState({ whistle: null });
}

// ---------------------------------------------------------------------------
// Actions used by the screens
// ---------------------------------------------------------------------------

function finishCelebration(): void {
  useFlow.setState({ celebration: null });
  useProgress.getState().clearReport();
}

/** Celebration → tea break. */
export function beginBreak(): void {
  finishCelebration();
  getTimer().startBreak();
  // timer:start routes to /focus.
}

/** Summary → the optional setup (first brew started straight from the welcome). */
export function openSetupFromSummary(): void {
  finishCelebration();
  navigate('/welcome', { replace: true });
}

/** Celebration → home, no break. */
export function skipBreakFromDone(): void {
  finishCelebration();
  navigate('/', { replace: true });
}

/** From a running break or the "Break's over" card: straight into the next brew. */
export function startNextBrew(): void {
  const t = getTimer();
  useFlow.setState({ breakOver: null });
  if (t.status !== 'idle' && t.phase !== 'focus') {
    suppressNextStop = true;
    t.end('skip');
  }
  getTimer().startFocus({ intention: t.intention, tag: t.tag });
}

/** End the running break and go home. */
export function skipBreak(): void {
  const t = getTimer();
  if (t.status !== 'idle' && t.phase !== 'focus') t.end('skip');
  else leaveBreakOver();
}

/** Dismiss the "Break's over" card. */
export function leaveBreakOver(): void {
  useFlow.setState({ breakOver: null });
  navigate('/', { replace: true });
}

/** End the focus session early (the confirm sheet already happened). */
export function endFocusEarly(): void {
  getTimer().end('user');
}

// ---------------------------------------------------------------------------
// Saving failed (storage full or blocked)
// ---------------------------------------------------------------------------

/** One warning at a time, repeated at most this often while saves keep failing. */
const SAVE_WARNING_EVERY_MS = 60_000;
let saveWarnedAt = -Infinity;
/** A warning waiting for a moment when it covers nothing the ritual needs (null: none waiting). */
let heldWarning: { quota: boolean } | null = null;
let heldPoll: ReturnType<typeof setInterval> | null = null;

/**
 * Where a bottom toast would cover the ritual's own docked controls — the whistle, the summary (Done / Carry,
 * Tea time, Skip break), a tea break or "Break's over" — the warning waits until that moment is over: the
 * person leaves the session screen or starts the next brew. Same rule as the "Break's over" toast.
 */
function ritualOnScreen(): boolean {
  const route = getRoute();
  if (route === '/done') return true;
  if (route !== '/focus') return false;
  const t = getTimer();
  return t.status === 'idle' || t.phase !== 'focus' || !!useFlow.getState().whistle;
}

/**
 * Brews, rewards and settings then live only in this tab until a save succeeds again. Say so plainly, and
 * offer the one thing that keeps them: a backup file (exported from what this tab holds).
 */
function showSaveWarning(quota: boolean): void {
  const now = clock.now();
  if (now - saveWarnedAt < SAVE_WARNING_EVERY_MS) return;
  saveWarnedAt = now;
  toast.warning(
    quota
      ? 'Kettle couldn’t save your latest changes: this browser’s storage is full. Save a backup to keep them.'
      : 'Kettle couldn’t save your latest changes in this browser. Save a backup to keep them.',
    {
      id: 'kettle:save-failed',
      duration: 12_000,
      action: {
        label: 'Save backup',
        onClick: () => {
          downloadBackup()
            .then((name) => name && toast.success(`Saved ${name}. Keep it somewhere safe.`))
            .catch(() => toast.warning('Couldn’t save the backup. Try again from Settings › Your data.'));
        },
      },
    },
  );
}

function warnSaveFailed({ quota }: StorageWriteError): void {
  if (!ritualOnScreen()) {
    showSaveWarning(quota);
    return;
  }
  heldWarning = { quota: quota || !!heldWarning?.quota };
  if (heldPoll) return;
  heldPoll = setInterval(() => {
    if (ritualOnScreen() || !heldWarning) return;
    if (heldPoll) clearInterval(heldPoll);
    heldPoll = null;
    const held = heldWarning;
    heldWarning = null;
    showSaveWarning(held.quota);
  }, 500);
}

// ---------------------------------------------------------------------------
// Event wiring
// ---------------------------------------------------------------------------

let started = false;

export function initFlow(): void {
  if (started) return;
  started = true;

  onStorageWriteError(warnSaveFailed);

  on('timer:start', () => {
    clearWhistle();
    if (useFlow.getState().breakOver) useFlow.setState({ breakOver: null });
    if (getRoute() !== '/focus') navigate('/focus', { replace: getRoute() === '/done' });
  });

  on('timer:complete', ({ phase, record, whileAway }) => {
    if (phase === 'focus') {
      useFlow.setState({ breakOver: null, celebration: { id: record.id, step: 0 } });
      audio.play('complete'); // paired haptic comes with the sound
      const watching =
        !whileAway && getRoute() === '/focus' && (typeof document === 'undefined' || document.visibilityState === 'visible');
      if (watching) {
        clearWhistle();
        useFlow.setState({ whistle: { sessionId: record.id, at: clock.now() } });
        whistleTimer = setTimeout(
          () => {
            whistleTimer = null;
            useFlow.setState({ whistle: null });
            if (getRoute() === '/focus') navigate('/done', { replace: true });
          },
          reducedMotionNow() ? WHISTLE_MS_REDUCED : WHISTLE_MS,
        );
      } else {
        navigate('/done', { replace: getRoute() === '/focus' });
      }
      return;
    }

    // A tea break ran out.
    audio.play('breakOver');
    const stale = clock.now() - record.endedAt > STALE_BREAK_MS;
    if (getSettings().autoStartFocus && !whileAway) {
      const t = getTimer();
      t.startFocus({ intention: t.intention, tag: t.tag });
      return;
    }
    if (whileAway && stale) {
      if (getRoute() === '/focus') navigate('/', { replace: true });
      return;
    }
    useFlow.setState({ breakOver: { phase, at: record.endedAt, whileAway } });
    if (getRoute() !== '/focus') emit('ui:toast', { message: 'Break’s over — ready when you are.', tone: 'neutral' });
  });

  // Another tab changed the shared timer: mirror the route only (that tab did the sounds/toasts).
  on('timer:sync', ({ kind, phase, record }) => {
    const route = getRoute();
    if (kind === 'start') {
      clearWhistle();
      if (useFlow.getState().breakOver) useFlow.setState({ breakOver: null });
      if (route !== '/focus') navigate('/focus', { replace: route === '/done' });
    } else if (kind === 'complete') {
      if (phase === 'focus') {
        if (record) useFlow.setState({ breakOver: null, celebration: { id: record.id, step: 0 } });
        if (route === '/focus') navigate('/done', { replace: true });
      } else if (route === '/focus' && !getSettings().autoStartFocus) {
        useFlow.setState({ breakOver: { phase, at: record?.endedAt ?? clock.now(), whileAway: false } });
      }
    } else if (kind === 'stop' || kind === 'reset') {
      clearWhistle();
      if (route === '/focus') navigate('/', { replace: true });
    }
  });

  on('timer:stop', ({ phase, record }) => {
    clearWhistle();
    if (suppressNextStop) {
      suppressNextStop = false;
      return;
    }
    if (phase === 'focus') {
      const min = record ? Math.max(1, Math.floor(record.focusedMs / 60_000)) : 0;
      emit(
        'ui:toast',
        record
          ? { message: `Saved ${plural(min, 'minute')} of focus`, tone: 'success' }
          : { message: 'Kettle’s off. See you soon.', tone: 'neutral' },
      );
    }
    if (getRoute() === '/focus' || getRoute() === '/done') navigate('/', { replace: true });
  });
}
