/**
 * Cross-tab mirroring. OWNER: timer area.
 *
 * Every tab shows the same timer live: a `storage` event for a persisted store
 * re-reads it from localStorage (`persist.rehydrate()` — reads the *current*
 * value, so racing writes converge on whatever storage finally holds).
 * Timer changes are diffed and re-emitted as `timer:sync` so other areas can
 * update UI (navigate) without re-recording, re-playing sounds or re-notifying.
 *
 * A BroadcastChannel carries two small extras: "I completed session X"
 * (belt-and-braces against double completion) and "is any tab visible?"
 * (so the leader doesn't notify while you're looking at another Kettle tab).
 */
import { emit } from '@/lib/events';
import { useSettings } from '@/state/settings';
import { useProgress, syncFromStorage } from '@/progress';
import type { SessionRecord } from '@/progress/types';
import { TIMER_STORAGE_KEY, useTimer } from './store';
import type { AppEvents } from '@/lib/events';
import type { TimerState } from './types';

export type SyncKind = AppEvents['timer:sync']['kind'];

/** What changed between two timer states (as seen by a tab that didn't make the change). */
export function diffTimer(prev: TimerState, next: TimerState): SyncKind | null {
  const ended = next.lastEnded && next.lastEnded.sessionId !== prev.lastEnded?.sessionId ? next.lastEnded : null;
  if (next.status !== 'idle' && next.sessionId && next.sessionId !== prev.sessionId) return 'start';
  if (next.status === 'idle') {
    if (ended) return ended.reason === 'complete' ? 'complete' : 'stop';
    if (prev.status !== 'idle') return 'reset';
    return null;
  }
  if (prev.sessionId !== next.sessionId) return null;
  if (prev.status === 'running' && next.status === 'paused') return 'pause';
  if (prev.status === 'paused' && next.status === 'running') return 'resume';
  if (prev.plannedMs !== next.plannedMs) return 'addTime';
  return null;
}

type PersistedStore = { persist: { rehydrate: () => unknown; getOptions: () => { name?: string } } };
const extraStores = new Map<string, PersistedStore>();

/** Other areas: keep your persisted zustand store in sync across tabs. */
export function registerTabSync(store: PersistedStore): void {
  const name = store.persist.getOptions().name;
  if (name) extraStores.set(name, store);
}

function findRecord(id: string | undefined): SessionRecord | null {
  if (!id) return null;
  const s = useProgress.getState() as unknown as { sessions?: SessionRecord[] };
  return s.sessions?.find((x) => x.id === id) ?? null;
}

let mirroring = false;

/**
 * Re-read the shared timer from storage and emit `timer:sync` for whatever
 * another tab changed. Safe to call any time (also used right before completing).
 */
export function mirrorTimerFromStorage(opts: { removed?: boolean } = {}): SyncKind | null {
  if (mirroring) return null;
  mirroring = true;
  try {
    const prev = useTimer.getState();
    try {
      syncFromStorage(); // progress first, so a just-recorded session is visible
    } catch {
      /* progress area mid-change — never block the timer */
    }
    if (opts.removed) {
      // Another tab wiped data (reset/import). Mirror an idle kettle.
      if (prev.status !== 'idle') useTimer.getState().reset();
    } else {
      void useTimer.persist.rehydrate();
    }
    const next = useTimer.getState();
    const kind = diffTimer(prev, next);
    if (kind) {
      const ended = kind === 'complete' || kind === 'stop' ? next.lastEnded : null;
      emit('timer:sync', {
        kind,
        phase: ended ? ended.phase : next.status === 'idle' ? prev.phase : next.phase,
        record: ended ? findRecord(ended.sessionId) : null,
        whileAway: ended?.whileAway ?? false,
      });
    }
    return kind;
  } finally {
    mirroring = false;
  }
}

// ---------- BroadcastChannel ----------

type Msg =
  | { t: 'completed'; sid: string }
  | { t: 'visible?'; q: string }
  | { t: 'visible!'; q: string };

let channel: BroadcastChannel | null = null;
const completed = new Set<string>();
const pendingQueries = new Map<string, () => void>();

export function wasCompletedElsewhere(sid: string): boolean {
  return completed.has(sid);
}

export function broadcastCompleted(sid: string): void {
  completed.add(sid);
  try {
    channel?.postMessage({ t: 'completed', sid } satisfies Msg);
  } catch {
    /* ignore */
  }
}

/** Resolves true if any *other* Kettle tab is visible right now (false if unknown / no channel). */
export function anyOtherTabVisible(timeoutMs = 160): Promise<boolean> {
  if (!channel) return Promise.resolve(false);
  const q = Math.random().toString(36).slice(2);
  return new Promise((resolve) => {
    const t = setTimeout(() => {
      pendingQueries.delete(q);
      resolve(false);
    }, timeoutMs);
    pendingQueries.set(q, () => {
      clearTimeout(t);
      pendingQueries.delete(q);
      resolve(true);
    });
    try {
      channel!.postMessage({ t: 'visible?', q } satisfies Msg);
    } catch {
      clearTimeout(t);
      pendingQueries.delete(q);
      resolve(false);
    }
  });
}

let started = false;

export interface TabSyncOptions {
  /** Called for storage events on keys the timer doesn't own (e.g. the leader lease). */
  onOtherKey?: (key: string | null) => void;
}

export function initTabSync(opts: TabSyncOptions = {}): () => void {
  if (started || typeof window === 'undefined') return () => {};
  started = true;

  const onStorage = (e: StorageEvent) => {
    try {
      if (e.storageArea && typeof localStorage !== 'undefined' && e.storageArea !== localStorage) return;
    } catch {
      return;
    }
    if (e.key === null) {
      // localStorage.clear() in another tab.
      void useSettings.persist.rehydrate();
      extraStores.forEach((s) => void s.persist.rehydrate());
      mirrorTimerFromStorage({ removed: true });
      opts.onOtherKey?.(null);
      return;
    }
    if (e.key === TIMER_STORAGE_KEY) {
      mirrorTimerFromStorage({ removed: e.newValue === null });
      return;
    }
    if (e.key === useSettings.persist.getOptions().name) {
      void useSettings.persist.rehydrate();
      return;
    }
    const extra = extraStores.get(e.key);
    if (extra) {
      void extra.persist.rehydrate();
      return;
    }
    // kettle:progress is synced by the progress area itself (rev-aware).
    opts.onOtherKey?.(e.key);
  };
  window.addEventListener('storage', onStorage);

  if (typeof BroadcastChannel !== 'undefined') {
    try {
      channel = new BroadcastChannel('kettle:timer');
      channel.onmessage = (e: MessageEvent<Msg>) => {
        const m = e.data;
        if (!m || typeof m !== 'object') return;
        if (m.t === 'completed') {
          completed.add(m.sid);
          if (completed.size > 200) completed.delete(completed.values().next().value as string);
        } else if (m.t === 'visible?') {
          if (document.visibilityState === 'visible') channel?.postMessage({ t: 'visible!', q: m.q } satisfies Msg);
        } else if (m.t === 'visible!') {
          pendingQueries.get(m.q)?.();
        }
      };
    } catch {
      channel = null;
    }
  }

  return () => {
    window.removeEventListener('storage', onStorage);
    channel?.close();
    channel = null;
    started = false;
  };
}
