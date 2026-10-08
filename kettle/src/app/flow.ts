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
const SAVE_TOAST_ID = 'kettle:save-failed';
/** How tall a bottom toast can get (a 5-line message on a narrow phone, plus its gap). */
const TOAST_ZONE_PX = 170;
/** A new warning waits this long, so the screen it was raised on (e.g. the brew that just started) is drawn first. */
const SETTLE_MS = 250;
const WATCH_MS = 250;
let saveWarnedAt = -Infinity;
/** The warning to show (or keep showing): `held` waits for a safe moment, `shown` is on screen now. */
let warning: { quota: boolean; state: 'held' | 'shown'; shownAt: number } | null = null;
let watchTimer: ReturnType<typeof setInterval> | null = null;

/**
 * The ritual's own moments — the whistle, the summary (Done / Carry, Tea time, Skip break), a tea break or
 * "Break's over" — never get a warning over them, on any layout. Same rule as the "Break's over" toast.
 */
function ritualOnScreen(): boolean {
  const route = getRoute();
  if (route === '/done') return true;
  if (route !== '/focus') return false;
  const t = getTimer();
  return t.status === 'idle' || t.phase !== 'focus' || !!useFlow.getState().whistle;
}

/**
 * Would a bottom toast sit over a protected control? Protected: every control of the session screen (Add 5,
 * Pause / Resume, End …) and a screen's docked primary action (marked `data-toast-above`, e.g. Today's "Put the
 * kettle on"). On phones the session controls are docked at the bottom, exactly where toasts appear; on wide layouts
 * they sit beside the stage, but there Today's docked action can sit under the toast. Measured, not guessed from
 * breakpoints, so any layout where they overlap counts.
 */
function protectedControlsUnderToasts(): boolean {
  if (typeof document === 'undefined') return false;
  const live = document.querySelector('[aria-label="Notifications"]');
  const region = live?.parentElement;
  if (!live || !region) return false;
  const route = getRoute();
  const sel = 'button, a[href], [role="button"], input, textarea, select';
  const candidates = [
    ...(route === '/focus' || route === '/done' ? document.querySelectorAll(sel) : []),
    ...document.querySelectorAll(`[data-toast-above] :is(${sel})`),
  ];
  const area = live.getBoundingClientRect();
  const bottom = region.getBoundingClientRect().bottom;
  const top = Math.min(region.getBoundingClientRect().top, bottom - TOAST_ZONE_PX);
  for (const el of candidates) {
    if (live.contains(el)) continue;
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) continue;
    if (r.right > area.left && r.left < area.right && r.bottom > top && r.top < bottom) return true;
  }
  return false;
}

/** Would the warning cover something the person may need to tap right now? */
function warningWouldBlock(): boolean {
  return ritualOnScreen() || protectedControlsUnderToasts();
}

function toastOnScreen(): boolean {
  return typeof document !== 'undefined' && !!document.getElementById(`toast-${SAVE_TOAST_ID}`);
}

/**
 * Brews, rewards and settings then live only in this tab until a save succeeds again. Say so plainly, and
 * offer the one thing that keeps them: a backup file (exported from what this tab holds).
 */
function showSaveWarning(quota: boolean): void {
  toast.warning(
    quota
      ? 'Kettle couldn’t save your latest changes: this browser’s storage is full. Save a backup to keep them.'
      : 'Kettle couldn’t save your latest changes in this browser. Save a backup to keep them.',
    {
      id: SAVE_TOAST_ID,
      duration: 12_000,
      // Put away by the person (tap) or timed out: done, until the next failure a minute or more later.
      onDismiss: () => {
        if (warning?.state === 'shown') warning = null;
      },
      action: {
        label: 'Save backup',
        onClick: () => {
          warning = null;
          downloadBackup()
            .then((name) => name && toast.success(`Saved ${name}. Keep it somewhere safe.`))
            .catch(() => toast.warning('Couldn’t save the backup. Try again from Settings › Your data.'));
        },
      },
    },
  );
}

/**
 * Keeps the warning off every control: shows a held warning once nothing it could cover is on screen, and takes a
 * visible one away again (holding it) the moment it would cover something — the brew ends under it, the person
 * pauses, the summary or a break comes up. Runs only while there is a warning.
 */
function watchSaveWarning(): void {
  if (!warning) {
    if (watchTimer) clearInterval(watchTimer);
    watchTimer = null;
    return;
  }
  const blocked = warningWouldBlock();
  if (warning.state === 'shown') {
    // Gone without onDismiss (pushed out by newer toasts)? Allow a moment for it to be drawn first.
    if (!toastOnScreen()) {
      if (Date.now() - warning.shownAt > 1500) warning = null;
    } else if (blocked) {
      toast.dismiss(SAVE_TOAST_ID);
      warning.state = 'held';
    }
  } else if (!blocked) {
    warning.state = 'shown';
    warning.shownAt = Date.now();
    showSaveWarning(warning.quota);
  }
  if (!warning && watchTimer) {
    clearInterval(watchTimer);
    watchTimer = null;
  }
}

/** Re-check now and again once the next screen has rendered (a route change draws its controls a moment later). */
function recheckSaveWarning(): void {
  if (!warning) return;
  queueMicrotask(watchSaveWarning);
  setTimeout(watchSaveWarning, 60);
}

function warnSaveFailed({ quota }: StorageWriteError): void {
  if (warning) {
    warning.quota ||= quota;
    return;
  }
  const now = clock.now();
  if (now - saveWarnedAt < SAVE_WARNING_EVERY_MS) return;
  saveWarnedAt = now;
  warning = { quota, state: 'held', shownAt: 0 };
  // Decide once the screen this save belongs to is drawn (a brew started from Home lands on the session screen).
  setTimeout(watchSaveWarning, SETTLE_MS);
  if (!watchTimer) watchTimer = setInterval(watchSaveWarning, WATCH_MS);
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
    recheckSaveWarning(); // a break (or the session screen) is coming
    clearWhistle();
    if (useFlow.getState().breakOver) useFlow.setState({ breakOver: null });
    if (getRoute() !== '/focus') navigate('/focus', { replace: getRoute() === '/done' });
  });

  on('timer:complete', ({ phase, record, whileAway }) => {
    recheckSaveWarning(); // the whistle / summary / break-over is coming: take a visible warning away
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
    recheckSaveWarning();
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
