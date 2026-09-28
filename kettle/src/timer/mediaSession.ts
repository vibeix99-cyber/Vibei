/**
 * Media Session: lock-screen / media-hub controls while a phase runs.
 * OWNER: timer area.
 *
 * Browsers show these controls when the page plays audio (the ambience), so
 * with rain playing you can pause the brew from the lock screen or keyboard
 * media keys. Title reads "Focusing · 18 min left", artist "Kettle".
 */
import { useTimer } from './store';
import { subscribeTimerView, getTimerView } from './view';
import { phaseLabel } from './tabPresence';
import type { TimerView } from './types';

/** "Focusing · 18 min left" / "Paused · 18 min left" / "Tea break · under a minute left". Pure — unit tested. */
export function mediaTitle(v: Pick<TimerView, 'status' | 'phase' | 'remainingMs'>): string | null {
  if (v.status === 'idle') return null;
  const mins = Math.ceil(v.remainingMs / 60_000);
  const left = v.remainingMs < 60_000 ? 'under a minute left' : `${mins} min left`;
  const label = v.status === 'paused' ? (v.phase === 'focus' ? 'Paused' : 'Break paused') : phaseLabel(v.phase);
  return `${label} · ${left}`;
}

let lastTitle: string | null = null;
let handlersOn = false;
let started = false;

function artwork(): MediaImage[] {
  const base = import.meta.env.BASE_URL;
  return [
    { src: `${base}icons/icon-192.png`, sizes: '192x192', type: 'image/png' },
    { src: `${base}icons/icon-512.png`, sizes: '512x512', type: 'image/png' },
  ];
}

function setHandlers(on: boolean): void {
  const ms = navigator.mediaSession;
  if (handlersOn === on) return;
  handlersOn = on;
  const set = (action: MediaSessionAction, fn: MediaSessionActionHandler | null) => {
    try {
      ms.setActionHandler(action, fn);
    } catch {
      /* action not supported here */
    }
  };
  set('play', on ? () => useTimer.getState().resume() : null);
  set('pause', on ? () => useTimer.getState().pause() : null);
}

function render(v: TimerView): void {
  if (typeof navigator === 'undefined' || !('mediaSession' in navigator) || typeof MediaMetadata === 'undefined') return;
  const ms = navigator.mediaSession;
  const title = mediaTitle(v);
  if (title == null) {
    if (lastTitle != null) {
      ms.metadata = null;
      ms.playbackState = 'none';
      setHandlers(false);
      lastTitle = null;
    }
    return;
  }
  setHandlers(true);
  ms.playbackState = v.status === 'running' ? 'playing' : 'paused';
  if (title === lastTitle) return;
  lastTitle = title;
  const intention = useTimer.getState().intention.trim();
  try {
    ms.metadata = new MediaMetadata({ title, artist: 'Kettle', album: intention || 'Cozy focus timer', artwork: artwork() });
  } catch {
    /* ignore */
  }
  try {
    ms.setPositionState?.({
      duration: Math.max(1, v.plannedMs / 1000),
      position: Math.min(v.plannedMs, Math.max(0, v.plannedMs - v.remainingMs)) / 1000,
      playbackRate: 1,
    });
  } catch {
    /* ignore */
  }
}

export function initMediaSession(): void {
  if (started || typeof navigator === 'undefined' || !('mediaSession' in navigator)) return;
  started = true;
  subscribeTimerView((v) => render(v));
  render(getTimerView());
}
