/**
 * Session sound behaviour — follows the timer so screens don't have to:
 *   • focus running  → ambience (settings.ambient) fades in
 *   • focus paused   → ambience dips gently
 *   • session ends   → ambience fades out (the whistle takes over)
 *   • last ~40 s     → a very subtle kettle simmer rises (the kettle heating)
 * Also gives keyboard-driven pause/resume/+time the same sounds as buttons
 * (the voice pool dedupes when a button already played them).
 * OWNER: audio area.
 */
import { clock } from '@/lib/clock';
import { on } from '@/lib/events';
import { useSettings, type AmbientKind } from '@/state/settings';
import { useTimer, remainingAt, isTimerLeader } from '@/timer';
import type { TimerState } from '@/timer';
import { engine } from './engine';

/** How long before the end of a focus session the kettle starts to simmer. */
export const SIMMER_LEAD_MS = 40_000;
/** Ambience level while paused. */
export const PAUSED_LEVEL = 0.35;

export interface SessionTarget {
  ambient: AmbientKind;
  level: number;
  /** Remaining ms while simmering, else null. */
  simmerMs: number | null;
}

/** Pure: what the session wants to hear right now. */
export function sessionTarget(
  t: Pick<TimerState, 'status' | 'phase' | 'endsAt' | 'remainingMs' | 'plannedMs'>,
  ambient: AmbientKind,
  now: number,
): SessionTarget {
  if (t.phase !== 'focus' || t.status === 'idle') return { ambient: 'none', level: 1, simmerMs: null };
  if (t.status === 'paused') return { ambient, level: PAUSED_LEVEL, simmerMs: null };
  const remaining = remainingAt(t as TimerState, now);
  const simmerMs = remaining > 0 && remaining <= SIMMER_LEAD_MS ? remaining : null;
  return { ambient, level: 1, simmerMs };
}

/** Heat (0..1) at a given remaining time. */
export function heatFor(remainingMs: number): number {
  return Math.max(0, Math.min(1, 1 - remainingMs / SIMMER_LEAD_MS));
}

/**
 * Only one tab plays the session soundscape: the timer's leader tab (the
 * visible one claims leadership). Other tabs mirror the timer silently.
 */
function isAudioOwner(): boolean {
  try {
    return isTimerLeader();
  } catch {
    return true;
  }
}

let started = false;
let lastOwner = true;
let previewTimer: ReturnType<typeof setTimeout> | null = null;
let previewing = false;

let last: { inFocus: boolean; level: number; simmerKey: string | null } = {
  inFocus: false,
  level: 1,
  simmerKey: null,
};

function inFocusSession(t: Pick<TimerState, 'phase' | 'status'>): boolean {
  return t.phase === 'focus' && t.status !== 'idle';
}

/**
 * Re-evaluate and apply the session's sound target.
 *
 * Focus owns the soundscape: while a focus session runs (or is paused) the
 * chosen ambience plays even if a screen asked for quiet on unmount. Leaving
 * focus fades it out; during tea breaks, screens decide (focus screen keeps
 * ambience going), so this controller doesn't interfere there.
 */
export function applySession(force = false): void {
  const t = useTimer.getState();
  const s = useSettings.getState();
  const owner = isAudioOwner();
  const ownerChanged = owner !== lastOwner;
  lastOwner = owner;
  // The engine itself silences ambience in non-owner tabs (screens call setAmbient too).
  if (ownerChanged) engine.reconcile();
  const target = sessionTarget(t, s.ambient, clock.now());
  const inFocus = inFocusSession(t);

  if (previewing && inFocus && !last.inFocus) stopPreviewTimer();
  if (!previewing) {
    if (inFocus) {
      if (force || engine.ambient !== target.ambient) engine.setAmbient(target.ambient, last.inFocus ? 1500 : 3000);
    } else if (last.inFocus) {
      engine.setAmbient('none', 2400);
    }
  }
  if (force || Math.abs(target.level - last.level) > 1e-3) {
    engine.setAmbientLevel(target.level, target.level < last.level ? 900 : 1400);
  }

  // Simmer: re-plan only when the timeline changes (enter window, resume, clock jump).
  const simmerMs = owner ? target.simmerMs : null;
  const simmerKey = simmerMs != null ? `${t.endsAt}` : null;
  if (simmerKey !== last.simmerKey || force || ownerChanged) {
    if (simmerMs != null) engine.simmerTo(heatFor(simmerMs), simmerMs / 1000);
    else engine.simmerOff(t.status === 'paused' ? 900 : 1600);
  }
  last = { inFocus, level: target.level, simmerKey };
}

/**
 * During a focus session the session's ambience (settings.ambient) wins over
 * ad-hoc requests — e.g. a screen asking for quiet as it unmounts mid-session.
 */
export function sessionOverrides(kind: AmbientKind): boolean {
  if (previewing) return false;
  return inFocusSession(useTimer.getState()) && kind !== useSettings.getState().ambient;
}

function stopPreviewTimer(): void {
  if (previewTimer) clearTimeout(previewTimer);
  previewTimer = null;
  previewing = false;
}

/** Audition an ambience for a few seconds (settings / onboarding pickers). */
export function previewAmbient(kind: AmbientKind, ms = 7000): void {
  if (kind === 'none') {
    cancelPreview();
    return;
  }
  if (previewTimer) clearTimeout(previewTimer);
  previewing = true;
  engine.setAmbientLevel(1, 300);
  engine.setAmbient(kind, 600);
  previewTimer = setTimeout(cancelPreview, ms);
}

/** End an audition: back to the session's ambience, or quiet. */
export function cancelPreview(): void {
  const was = previewing;
  stopPreviewTimer();
  if (!was) return;
  if (inFocusSession(useTimer.getState())) applySession(true);
  else engine.setAmbient('none', 1500);
}

export function initSession(): void {
  if (started) return;
  started = true;
  useTimer.subscribe(() => applySession());
  useSettings.subscribe((s, p) => {
    if (s.ambient !== p.ambient) applySession();
  });
  clock.onJump(() => {
    last.simmerKey = '__jump__';
    applySession();
  });
  // Crossing into the simmer window happens with time, not state changes.
  // Also notices when leadership (and so audio ownership) moves between tabs.
  setInterval(() => {
    const t = useTimer.getState();
    if ((t.phase === 'focus' && t.status !== 'idle') || isAudioOwner() !== lastOwner) applySession();
  }, 500);

  // Keyboard parity (Space = pause/resume, +5 min) — buttons that already
  // played the same sound within the dedupe window are not doubled.
  on('timer:pause', ({ phase }) => phase === 'focus' && engine.play('pause', { haptic: false }));
  on('timer:resume', ({ phase }) => phase === 'focus' && engine.play('resume', { haptic: false }));
  on('timer:addTime', () => engine.play('addTime'));
  on('timer:complete', ({ phase }) => {
    if (phase === 'focus') engine.simmerOff(1200);
  });

  engine.ownsAudio = isAudioOwner;
  engine.onUnlock = () => applySession(true);
  applySession();
}
