/**
 * Screen-reader announcements for the timer. OWNER: timer area.
 *
 * Polite, and sparse: start, pause/resume, added time, every 5 minutes,
 * 1 minute left, completion, ended early. Never every second.
 * All wording lives in the pure functions below (unit tested).
 */
import { on } from '@/lib/events';
import { clock } from '@/lib/clock';
import { spokenDuration, plural } from '@/lib/format';
import { remainingAt, useTimer } from './store';
import { subscribeTimerView } from './view';
import type { Phase, TimerView } from './types';

const FIVE_MIN = 5 * 60_000;

function phaseName(phase: Phase): string {
  return phase === 'focus' ? 'Focus session' : phase === 'longBreak' ? 'Long tea break' : 'Tea break';
}

/** Speak whole minutes as "20 minutes"; anything else precisely ("12 minutes 30 seconds"). */
function spoken(ms: number): string {
  return spokenDuration(ms);
}

export type AnnounceEvent =
  | { type: 'start'; phase: Phase; durationMs: number }
  | { type: 'pause'; phase: Phase; remainingMs: number }
  | { type: 'resume'; phase: Phase; remainingMs: number }
  | { type: 'addTime'; phase: Phase; addedMs: number; remainingMs: number }
  | { type: 'complete'; phase: Phase }
  | { type: 'stop'; phase: Phase; savedMs: number | null };

export function messageFor(e: AnnounceEvent): string {
  switch (e.type) {
    case 'start':
      return e.phase === 'focus'
        ? `Kettle’s on. Focus session started, ${spoken(e.durationMs)}.`
        : `${phaseName(e.phase)} started, ${spoken(e.durationMs)}. Stretch, sip, look out the window.`;
    case 'pause':
      return `Paused. ${spoken(e.remainingMs)} left.`;
    case 'resume':
      return `Resumed. ${spoken(e.remainingMs)} left.`;
    case 'addTime':
      return e.addedMs >= 0
        ? `Added ${spoken(e.addedMs)}. ${spoken(e.remainingMs)} left.`
        : `Removed ${spoken(-e.addedMs)}. ${spoken(e.remainingMs)} left.`;
    case 'complete':
      return e.phase === 'focus' ? 'The kettle’s whistling! Focus session complete. Time for tea.' : 'Tea’s done. Ready for another brew?';
    case 'stop':
      if (e.phase !== 'focus') return 'Tea break skipped.';
      return e.savedMs != null && e.savedMs >= 60_000
        ? `Kettle’s off. ${plural(Math.floor(e.savedMs / 60_000), 'minute')} of focus saved.`
        : 'Kettle’s off.';
  }
}

/**
 * Milestone between two consecutive views of the same running phase:
 * each 5-minute mark and the last minute. Big jumps (restore, fast-forward)
 * announce nothing — only natural passage of time.
 */
export function milestoneFor(prev: TimerView, next: TimerView): string | null {
  if (next.status !== 'running' || prev.status !== 'running') return null;
  if (prev.sessionId !== next.sessionId || prev.phase !== next.phase) return null;
  const a = prev.seconds;
  const b = next.seconds;
  if (b >= a || a - b > 5 || b <= 0) return null;
  // Largest mark crossed: a > mark >= b (the starting value is never "crossed").
  if (a > 60 && b <= 60) return '1 minute left.';
  const markSec = Math.floor(a / (FIVE_MIN / 1000)) * (FIVE_MIN / 1000);
  const hit = markSec === a ? markSec - FIVE_MIN / 1000 : markSec;
  if (hit >= b && hit < a && hit > 0) return `${plural(hit / 60, 'minute')} left.`;
  return null;
}

// ---------- live regions ----------

const SR_ONLY: Partial<CSSStyleDeclaration> = {
  position: 'absolute',
  width: '1px',
  height: '1px',
  padding: '0',
  margin: '-1px',
  overflow: 'hidden',
  clip: 'rect(0, 0, 0, 0)',
  whiteSpace: 'nowrap',
  border: '0',
};

let globalRegion: HTMLElement | null = null;
const sinks: HTMLElement[] = [];
let flip = false;
let last = '';

function region(): HTMLElement | null {
  if (typeof document === 'undefined') return null;
  if (globalRegion && globalRegion.isConnected) return globalRegion;
  const el = document.createElement('div');
  el.setAttribute('role', 'status');
  el.setAttribute('aria-live', 'polite');
  el.setAttribute('aria-atomic', 'true');
  el.dataset.kettleAnnouncer = 'global';
  Object.assign(el.style, SR_ONLY);
  document.body.appendChild(el);
  globalRegion = el;
  return el;
}

/** The latest announcement (for tests / debugging). */
export function lastAnnouncement(): string {
  return last;
}

/**
 * Speak `text` politely. `terminal` messages (complete/stop) always go to the
 * app-level region so they survive the focus screen unmounting.
 */
export function announce(text: string, opts: { terminal?: boolean } = {}): void {
  const target = (!opts.terminal && sinks[sinks.length - 1]) || region();
  if (!target) return;
  last = text;
  flip = !flip;
  // Alternating trailing NBSP makes a repeated identical message count as a change.
  target.textContent = flip ? text : `${text} `;
  // Clear the other regions so nothing stale is re-read on focus.
  for (const el of [globalRegion, ...sinks]) if (el && el !== target) el.textContent = '';
}

/** Used by <TimerAnnouncer/>: the most recently mounted region receives non-terminal messages. */
export function registerAnnouncerSink(el: HTMLElement): () => void {
  sinks.push(el);
  return () => {
    const i = sinks.lastIndexOf(el);
    if (i >= 0) sinks.splice(i, 1);
  };
}

let started = false;

export function initAnnouncer(): void {
  if (started || typeof document === 'undefined') return;
  started = true;
  region();
  const say = (e: AnnounceEvent) => announce(messageFor(e), { terminal: e.type === 'complete' || e.type === 'stop' });

  on('timer:start', ({ phase, durationMs }) => say({ type: 'start', phase, durationMs }));
  on('timer:pause', ({ phase, remainingMs }) => say({ type: 'pause', phase, remainingMs }));
  on('timer:resume', ({ phase, remainingMs }) => say({ type: 'resume', phase, remainingMs }));
  // Read the store (already updated when the event fires), not the ≤1 s old view snapshot.
  const remainingNow = () => remainingAt(useTimer.getState(), clock.now());
  on('timer:addTime', ({ phase, addedMs }) => say({ type: 'addTime', phase, addedMs, remainingMs: remainingNow() }));
  on('timer:complete', ({ phase }) => say({ type: 'complete', phase }));
  on('timer:stop', ({ phase, record }) => say({ type: 'stop', phase, savedMs: record?.focusedMs ?? null }));
  // Mirrored changes from another tab (the user may be reading this one).
  on('timer:sync', ({ kind, phase, record }) => {
    if (kind === 'start') say({ type: 'start', phase, durationMs: useTimer.getState().plannedMs });
    else if (kind === 'pause') say({ type: 'pause', phase, remainingMs: remainingNow() });
    else if (kind === 'resume') say({ type: 'resume', phase, remainingMs: remainingNow() });
    else if (kind === 'complete') say({ type: 'complete', phase });
    else if (kind === 'stop') say({ type: 'stop', phase, savedMs: record?.focusedMs ?? null });
  });
  subscribeTimerView((next, prev) => {
    const m = milestoneFor(prev, next);
    if (m) announce(m);
  });
}
