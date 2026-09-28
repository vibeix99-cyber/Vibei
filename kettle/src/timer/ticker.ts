/**
 * The ticker: wakes up exactly when the displayed second changes (worker-driven,
 * so background tabs stay on time), completes phases, and wires every timer
 * service together. OWNER: timer area.
 *
 *   initTimer()        boot once (after progress/flow/audio listeners exist)
 *   useRemaining()     re-renders once per displayed second
 *   useProgressFrame() per-frame progress callback for rings (no re-render)
 *   useSmoothProgress() progress as state at a capped fps
 *   timerDiagnostics() leader/scheduler state (debug + e2e)
 *
 * Reliability notes (details in docs/areas/timer.md):
 *  - Time is always derived from wall-clock anchors; the ticker only decides
 *    *when* to look. Missing a wake never loses time.
 *  - Real clock jumps are detected by comparing Date.now() with the monotonic
 *    performance.now(): jumping *back* (manual change) re-anchors so the
 *    countdown stays continuous; jumping *ahead* (sleep) is real time passing.
 *  - A tab that just became leader, or just woke from a freeze/sleep, waits
 *    SETTLE_MS before completing anything so writes from other tabs land first.
 */
import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { clock } from '@/lib/clock';
import { useSettings } from '@/state/settings';
import { useTimer, remainingAt, progressAt, isDue, setCompletionGuard } from './store';
import { createScheduler, type Scheduler } from './scheduler';
import { publishView, getTimerView, subscribeTimerView } from './view';
import { electLeader, type Leadership, type LockManagerLike, type LeaseStorage } from './leader';
import { initTabSync, mirrorTimerFromStorage, broadcastCompleted, wasCompletedElsewhere, anyOtherTabVisible } from './sync';
import { initNotifications } from './notify';
import { initWakeLock } from './wakeLock';
import { initTabPresence } from './tabPresence';
import { initMediaSession } from './mediaSession';
import { initAnnouncer } from './announce';
import { createIdbClaimer, claimAllows, type Claimer, type ClaimEntry } from './claims';
import type { TimerView } from './types';

/** A tab that just became leader (or woke from a freeze/sleep) waits this long before completing. */
export const SETTLE_MS = 300;
/** A follower that sees a phase overdue this long takes over leadership (leader must be frozen). */
export const TAKEOVER_AFTER_MS = 4000;
/** Past this, complete regardless of leadership (the id guards still prevent doubles). */
export const FORCE_AFTER_MS = 12_000;
/** Wall-vs-monotonic skew beyond which the system clock counts as having jumped. */
const JUMP_MS = 2000;
/** A scheduled wake this late means the tab was suspended (not merely janky). */
const SUSPENDED_MS = 10_000;
const LEADER_LOCK = 'kettle:leader';

const mono = (): number => (typeof performance !== 'undefined' ? performance.now() : Date.now());

let scheduler: Scheduler | null = null;
let cancelNext: (() => void) | null = null;
let expectedAt = 0;
let coreStarted = false;
let wakeQueued = false;
let lastWall = 0;
let lastMono = 0;
let dueSince: number | null = null;
let settleUntil = 0;
let leadership: Leadership | null = null;
let multiTab = false;
let wakes = 0;
let claimer: Claimer | null = null;
const claims = new Map<string, ClaimEntry>();
const TAB_ID = `tab_${Math.random().toString(36).slice(2, 10)}`;

function mayMutate(): boolean {
  return !multiTab || !!leadership?.isLeader();
}

function queueWake(): void {
  if (wakeQueued) return;
  wakeQueued = true;
  queueMicrotask(wake);
}

function wake(): void {
  wakeQueued = false;
  wakes++;
  if (cancelNext) {
    cancelNext();
    cancelNext = null;
  }
  const m = mono();
  const wall = Date.now(); // the real clock — debug fast-forward must not look like a jump
  // A scheduled wake that arrives very late means we were frozen or asleep (not just janky:
  // a busy main thread must not keep pushing completion back).
  if (expectedAt && m - expectedAt > SUSPENDED_MS) settleUntil = Math.max(settleUntil, m + SETTLE_MS);
  expectedAt = 0;
  if (lastMono) {
    const skew = wall - lastWall - (m - lastMono);
    if (skew > JUMP_MS) {
      // Wall clock ran ahead of the monotonic one: system sleep (or a manual change forward).
      // Time really passed — let other tabs' writes land before completing.
      settleUntil = Math.max(settleUntil, m + SETTLE_MS);
    } else if (skew < -JUMP_MS && mayMutate()) {
      // System clock was set back: shift the anchors so the countdown doesn't grow.
      useTimer.getState().rebase(skew);
    }
  }
  lastWall = wall;
  lastMono = m;

  const now = clock.now();
  const s0 = useTimer.getState();
  // Remaining can never exceed the plan (clock set back while we were closed).
  if (s0.status === 'running' && s0.endsAt != null && s0.endsAt - now > s0.plannedMs + 1000 && mayMutate()) {
    useTimer.getState().rebase(now + s0.plannedMs - s0.endsAt);
  }

  const s = useTimer.getState();
  if (isDue(s, now)) {
    if (dueSince == null) dueSince = m;
    if (leadership && !leadership.isLeader() && m - dueSince > TAKEOVER_AFTER_MS) leadership.claim();
    if (s.sessionId) claimIfAllowed(s.sessionId);
    useTimer.getState().tick();
  } else {
    dueSince = null;
  }
  publishView(clock.now());
  scheduleNext();
}

function scheduleNext(): void {
  const s = useTimer.getState();
  if (!scheduler || s.status !== 'running') return;
  const rem = remainingAt(s, clock.now());
  // Wake right after the displayed second flips (ceil display), or poll while completion is pending.
  const delay = rem <= 0 ? 250 : (rem % 1000 || 1000) + 4;
  expectedAt = mono() + delay;
  cancelNext = scheduler.after(delay, wake);
}

function ensureCore(): void {
  if (coreStarted || typeof window === 'undefined') return;
  coreStarted = true;
  scheduler = createScheduler();
  useTimer.subscribe(queueWake);
  clock.onJump(() => {
    // Debug fast-forward only moves *this* tab's clock, so this tab must be the one to complete.
    leadership?.claim();
    queueWake();
  });
  document.addEventListener('visibilitychange', queueWake);
  window.addEventListener('focus', queueWake);
  window.addEventListener('pageshow', queueWake);
  window.addEventListener('online', queueWake);
  document.addEventListener('resume', () => {
    settleUntil = Math.max(settleUntil, mono() + SETTLE_MS);
    queueWake();
  });
  // Belt and braces: if a scheduled wake is overdue (worker stalled), wake from the main thread.
  setInterval(() => {
    if (expectedAt && mono() - expectedAt > 1500) queueWake();
  }, 1000);
  queueWake();
}

// ---------- leadership ----------

function storageOrNull(): LeaseStorage | null {
  try {
    const k = '__kettle_probe__';
    localStorage.setItem(k, '1');
    localStorage.removeItem(k);
    return localStorage;
  } catch {
    return null;
  }
}

function startLeadership(): void {
  leadership?.stop();
  const nav = navigator as Navigator & { locks?: LockManagerLike };
  const locks = nav.locks && typeof nav.locks.request === 'function' ? nav.locks : null;
  leadership = electLeader({ name: LEADER_LOCK, locks, storage: locks ? null : storageOrNull() });
  leadership.onChange((isLeader) => {
    leaderListeners.forEach((fn) => {
      try {
        fn(isLeader);
      } catch (err) {
        console.error('[timer] leader listener threw', err);
      }
    });
    if (isLeader) {
      // Pick up anything written while we were a follower, then re-check after settling.
      queueWake();
      setTimeout(queueWake, SETTLE_MS + 20);
    }
  });
}

const leaderListeners = new Set<(leader: boolean) => void>();

/**
 * Is this the tab that fires timer side effects (and that the user most recently
 * looked at)? Audio can use it to play ambience in one tab only. Always true
 * with a single tab or before `initTimer`.
 */
export function isLeaderTab(): boolean {
  return !multiTab || !!leadership?.isLeader();
}

export function onLeaderTabChange(fn: (leader: boolean) => void): () => void {
  leaderListeners.add(fn);
  return () => {
    leaderListeners.delete(fn);
  };
}

function claimIfVisible(): void {
  if (document.visibilityState === 'visible') leadership?.claim();
}

function leaderRuleAllows(): boolean {
  const m = mono();
  return completionAllowed({
    leader: !!leadership?.isLeader(),
    leaderForMs: leadership?.leaderFor() ?? -1,
    settledAt: settleUntil,
    now: m,
    dueForMs: dueSince == null ? null : m - dueSince,
  });
}

/** Atomic cross-tab claim (IndexedDB) for a due phase, once this tab is allowed to complete. */
function claimIfAllowed(sessionId: string): void {
  if (!claimer || claims.has(sessionId) || !leaderRuleAllows()) return;
  claims.set(sessionId, { result: 'pending', at: mono() });
  if (claims.size > 50) claims.delete(claims.keys().next().value as string);
  void claimer.claim(sessionId, TAB_ID).then((result) => {
    claims.set(sessionId, { result, at: mono() });
    queueWake();
  });
}

/** Completion rule for a tab (exported for tests/diagnostics). */
export function completionAllowed(opts: { leader: boolean; leaderForMs: number; settledAt: number; now: number; dueForMs: number | null }): boolean {
  if (opts.dueForMs != null && opts.dueForMs > FORCE_AFTER_MS) return true;
  if (!opts.leader || opts.leaderForMs < SETTLE_MS) return false;
  return opts.now >= opts.settledAt;
}

// ---------- boot ----------

let initialized = false;

export interface InitTimerOptions {
  /** Cross-tab leader election + mirroring (default true). */
  multiTab?: boolean;
}

export function initTimer(opts: InitTimerOptions = {}): void {
  if (initialized || typeof window === 'undefined') return;
  initialized = true;
  multiTab = opts.multiTab ?? true;

  if (multiTab) {
    claimer = createIdbClaimer();
    startLeadership();
    initTabSync({
      onOtherKey: (key) => {
        if (key === null || key === `${LEADER_LOCK}:lease`) leadership?.poke();
      },
    });
    setCompletionGuard({
      canComplete: () => {
        if (!leaderRuleAllows()) return false;
        const sid = useTimer.getState().sessionId;
        return !sid || claimAllows(claims.get(sid), !!claimer, mono());
      },
      refresh: () => {
        mirrorTimerFromStorage();
      },
      alreadyCompleted: wasCompletedElsewhere,
      announce: broadcastCompleted,
    });
    // The tab you're looking at leads — it's the one that has permission to play the whistle.
    document.addEventListener('visibilitychange', claimIfVisible);
    window.addEventListener('focus', claimIfVisible);
    claimIfVisible();
    // Frozen / bfcached tabs hand leadership over and rejoin when they come back.
    document.addEventListener('freeze', () => leadership?.stop());
    document.addEventListener('resume', () => {
      startLeadership();
      claimIfVisible();
    });
    window.addEventListener('pagehide', () => leadership?.stop());
    window.addEventListener('pageshow', (e) => {
      if ((e as PageTransitionEvent).persisted) {
        startLeadership();
        claimIfVisible();
      }
    });
  }

  // While idle, the displayed length follows the focus-length setting.
  useTimer.getState().syncIdleLength();
  useSettings.subscribe((s, p) => {
    if (s.focusMin !== p.focusMin) useTimer.getState().syncIdleLength();
  });

  ensureCore();
  initAnnouncer();
  initTabPresence();
  initMediaSession();
  initWakeLock();
  initNotifications({ anyOtherTabVisible: () => anyOtherTabVisible() });
}

export interface TimerDiagnostics {
  multiTab: boolean;
  leader: boolean;
  leaderMode: Leadership['mode'] | 'none';
  leaderForMs: number;
  scheduler: Scheduler['kind'] | 'none';
  settling: boolean;
  dueForMs: number | null;
  wakes: number;
  /** IndexedDB completion claims available (exactly-once across tabs). */
  claims: boolean;
  lastClaim: ClaimEntry | null;
}

export function timerDiagnostics(): TimerDiagnostics {
  const m = mono();
  return {
    multiTab,
    leader: multiTab ? !!leadership?.isLeader() : true,
    leaderMode: leadership?.mode ?? 'none',
    leaderForMs: leadership?.leaderFor() ?? -1,
    scheduler: scheduler?.kind ?? 'none',
    settling: m < settleUntil,
    dueForMs: dueSince == null ? null : m - dueSince,
    wakes,
    claims: !!claimer,
    lastClaim: [...claims.values()].at(-1) ?? null,
  };
}

// ---------- React hooks ----------

function subscribeView(cb: () => void): () => void {
  ensureCore();
  return subscribeTimerView(cb);
}

export type RemainingView = TimerView;

/**
 * Remaining time + a coarse progress, re-rendering only when the displayed
 * second (or status/phase/session) changes. `intervalMs` is accepted for
 * backwards compatibility and ignored.
 */
export function useRemaining(_intervalMs?: number): RemainingView {
  void _intervalMs;
  return useSyncExternalStore(subscribeView, getTimerView, getTimerView);
}

/**
 * Smooth progress for rings/bars without re-rendering: `cb(progress, remainingMs)`
 * runs every animation frame while the phase runs (rAF pauses in hidden tabs),
 * and once on any state change while paused/idle.
 */
export function useProgressFrame(cb: (progress: number, remainingMs: number) => void): void {
  const ref = useRef(cb);
  ref.current = cb;
  const status = useTimer((s) => s.status);
  useEffect(() => {
    const emitNow = () => {
      const s = useTimer.getState();
      const now = clock.now();
      ref.current(progressAt(s, now), remainingAt(s, now));
    };
    emitNow();
    const offStore = useTimer.subscribe(emitNow);
    const offJump = clock.onJump(emitNow);
    let raf = 0;
    if (status === 'running' && typeof requestAnimationFrame !== 'undefined') {
      const loop = () => {
        emitNow();
        raf = requestAnimationFrame(loop);
      };
      raf = requestAnimationFrame(loop);
    }
    return () => {
      if (raf) cancelAnimationFrame(raf);
      offStore();
      offJump();
    };
  }, [status]);
}

/** Progress as React state, updated at most `fps` times a second while running. */
export function useSmoothProgress(fps = 30): number {
  const [p, setP] = useState(() => progressAt(useTimer.getState()));
  const last = useRef(0);
  useProgressFrame((progress) => {
    const t = mono();
    const running = useTimer.getState().status === 'running';
    if (running && t - last.current < 1000 / fps && progress < 1) return;
    last.current = t;
    setP((prev) => (Math.abs(prev - progress) < 1e-5 ? prev : progress));
  });
  return p;
}
