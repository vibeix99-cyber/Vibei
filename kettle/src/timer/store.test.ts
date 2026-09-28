/**
 * Timer engine unit tests (node env). Time is frozen with fake Date and moved
 * with `clock.advance`, so every number here is exact.
 */
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { clock } from '@/lib/clock';
import { on } from '@/lib/events';
import { useSettings, DEFAULT_SETTINGS } from '@/state/settings';
import type { SessionRecord } from '@/progress/types';
import {
  useTimer,
  remainingAt,
  progressAt,
  nextBreakKind,
  sanitizeTimer,
  setCompletionGuard,
  MAX_PHASE_MS,
  INITIAL_TIMER,
  TIMER_STORAGE_KEY,
} from './store';

const MIN = 60_000;

class MemoryStorage {
  map = new Map<string, string>();
  getItem(k: string) {
    return this.map.has(k) ? this.map.get(k)! : null;
  }
  setItem(k: string, v: string) {
    this.map.set(k, String(v));
  }
  removeItem(k: string) {
    this.map.delete(k);
  }
  clear() {
    this.map.clear();
  }
  key(i: number) {
    return [...this.map.keys()][i] ?? null;
  }
  get length() {
    return this.map.size;
  }
}

const storage = new MemoryStorage();
const g = globalThis as unknown as { localStorage?: MemoryStorage };

type Captured = { type: string; payload: Record<string, unknown> };
let events: Captured[] = [];
const offs: (() => void)[] = [];

beforeAll(() => {
  g.localStorage = storage;
  for (const type of ['timer:start', 'timer:pause', 'timer:resume', 'timer:complete', 'timer:stop', 'timer:addTime'] as const) {
    offs.push(on(type, (payload) => events.push({ type, payload: payload as unknown as Record<string, unknown> })));
  }
});

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date(2026, 8, 28, 10, 0, 0));
  clock.reset();
  storage.clear();
  useSettings.setState({ ...DEFAULT_SETTINGS });
  setCompletionGuard(null);
  useTimer.getState().reset();
  useTimer.setState({ completedInCycle: 0, intention: '', tag: null, lastEnded: null });
  events = [];
});

afterEach(() => {
  vi.useRealTimers();
  clock.reset();
});

const T = () => useTimer.getState();
const completes = () => events.filter((e) => e.type === 'timer:complete');
const stops = () => events.filter((e) => e.type === 'timer:stop');
const rec = (e: Captured) => e.payload.record as SessionRecord;

describe('start / pause / resume math', () => {
  it('counts down from the configured focus length, anchored to the wall clock', () => {
    T().startFocus();
    expect(T().status).toBe('running');
    expect(remainingAt(T())).toBe(25 * MIN);
    clock.advance(10 * MIN + 500);
    expect(remainingAt(T())).toBe(15 * MIN - 500);
    expect(progressAt(T())).toBeCloseTo((10 * MIN + 500) / (25 * MIN), 10);
  });

  it('freezes remaining time while paused and resumes exactly', () => {
    T().startFocus();
    clock.advance(5 * MIN);
    T().pause();
    expect(T().status).toBe('paused');
    expect(T().remainingMs).toBe(20 * MIN);
    clock.advance(3 * 60 * MIN); // paused for 3 hours
    expect(remainingAt(T())).toBe(20 * MIN);
    T().tick();
    expect(T().status).toBe('paused'); // a paused phase never completes
    T().resume();
    expect(T().pausedTotalMs).toBe(3 * 60 * MIN);
    expect(remainingAt(T())).toBe(20 * MIN);
    clock.advance(20 * MIN - 1);
    T().tick();
    expect(T().status).toBe('running');
    clock.advance(1);
    T().tick();
    expect(T().status).toBe('idle');
    expect(completes()).toHaveLength(1);
    expect(rec(completes()[0]).focusedMs).toBe(25 * MIN);
  });

  it('toggle flips running ↔ paused and does nothing when idle', () => {
    T().toggle();
    expect(T().status).toBe('idle');
    T().startFocus();
    T().toggle();
    expect(T().status).toBe('paused');
    T().toggle();
    expect(T().status).toBe('running');
  });

  it('honours a custom length and caps runaway lengths', () => {
    T().startFocus({ minutes: 0.1 });
    expect(T().plannedMs).toBe(6000);
    T().startFocus({ minutes: 10_000 });
    expect(T().plannedMs).toBe(MAX_PHASE_MS);
  });
});

describe('addTime', () => {
  it('extends a running phase (end and plan move together)', () => {
    T().startFocus();
    clock.advance(20 * MIN);
    T().addTime(5 * MIN);
    expect(remainingAt(T())).toBe(10 * MIN);
    expect(T().plannedMs).toBe(30 * MIN);
    expect(events.at(-1)).toMatchObject({ type: 'timer:addTime', payload: { addedMs: 5 * MIN } });
  });

  it('extends a paused phase without starting it', () => {
    T().startFocus();
    clock.advance(20 * MIN);
    T().pause();
    T().addTime(5 * MIN);
    expect(T().status).toBe('paused');
    expect(T().remainingMs).toBe(10 * MIN);
    clock.advance(60 * MIN);
    expect(remainingAt(T())).toBe(10 * MIN);
    T().resume();
    clock.advance(10 * MIN);
    T().tick();
    expect(rec(completes()[0])).toMatchObject({ plannedMs: 30 * MIN, focusedMs: 30 * MIN, completed: true });
  });

  it('never goes below zero or beyond the max, and is ignored when idle or already due', () => {
    T().addTime(5 * MIN);
    expect(T().status).toBe('idle');
    T().startFocus();
    T().addTime(-60 * MIN); // remove more than is left → completes now
    expect(T().status).toBe('idle');
    expect(completes()).toHaveLength(1);
    T().startFocus();
    for (let i = 0; i < 100; i++) T().addTime(5 * MIN);
    expect(T().plannedMs).toBe(MAX_PHASE_MS);
    clock.advance(MAX_PHASE_MS + 1000);
    const before = T().plannedMs;
    T().addTime(5 * MIN); // too late — it's whistling
    expect(T().plannedMs).toBe(before);
  });
});

describe('end early', () => {
  it('records focus of at least a minute as not completed', () => {
    T().startFocus({ intention: '  Thesis  ', tag: 'study' });
    clock.advance(12 * MIN + 30_000);
    T().end('user');
    expect(T().status).toBe('idle');
    const r = rec(stops()[0]);
    expect(r).toMatchObject({ completed: false, focusedMs: 12 * MIN + 30_000, intention: 'Thesis', tag: 'study', phase: 'focus' });
    expect(T().lastEnded).toMatchObject({ reason: 'user', sessionId: r.id });
  });

  it('does not record less than a minute', () => {
    T().startFocus();
    clock.advance(59_999);
    T().end('user');
    expect(stops()[0].payload.record).toBeNull();
  });

  it('excludes paused time from what counts', () => {
    T().startFocus();
    clock.advance(40_000);
    T().pause();
    clock.advance(30 * MIN);
    T().resume();
    clock.advance(10_000);
    T().end();
    expect(stops()[0].payload.record).toBeNull(); // only 50 s of real focus
    T().startFocus();
    clock.advance(30_000);
    T().pause();
    clock.advance(10 * MIN);
    T().end(); // ending while paused
    expect(stops()[1].payload.record).toBeNull();
  });

  it('ending a phase that already ran out completes it instead', () => {
    T().startFocus();
    clock.advance(26 * MIN);
    T().end('user');
    expect(stops()).toHaveLength(0);
    expect(completes()).toHaveLength(1);
  });

  it('never records breaks that are skipped', () => {
    T().startBreak('shortBreak');
    clock.advance(3 * MIN);
    T().end('skip');
    expect(stops()[0].payload).toMatchObject({ phase: 'shortBreak', reason: 'skip', record: null });
  });

  it('starting over an active focus saves the minutes already brewed', () => {
    T().startFocus();
    clock.advance(8 * MIN);
    T().startFocus();
    expect(rec(stops()[0]).focusedMs).toBe(8 * MIN);
    expect(T().status).toBe('running');
    expect(remainingAt(T())).toBe(25 * MIN);
  });
});

describe('completion', () => {
  it('completes exactly at the end with the real end time', () => {
    T().startFocus();
    const endsAt = T().endsAt!;
    clock.advance(25 * MIN);
    T().tick();
    const r = rec(completes()[0]);
    expect(r).toMatchObject({ completed: true, endedAt: endsAt, focusedMs: 25 * MIN });
    expect(completes()[0].payload.whileAway).toBe(false);
    expect(T().completedInCycle).toBe(1);
    expect(T().lastEnded).toMatchObject({ reason: 'complete', sessionId: r.id, at: endsAt });
  });

  it('completion while away: 3 hours closed → completes at its real end, whileAway', () => {
    T().startFocus();
    const endsAt = T().endsAt!;
    clock.advance(3 * 60 * MIN);
    T().tick();
    expect(completes()[0].payload.whileAway).toBe(true);
    expect(rec(completes()[0]).endedAt).toBe(endsAt);
  });

  it('is idempotent: repeated ticks never double-complete', () => {
    T().startFocus();
    clock.advance(30 * MIN);
    for (let i = 0; i < 5; i++) T().tick();
    expect(completes()).toHaveLength(1);
  });

  it('a session whose id already ended is mirrored to idle, not completed again', () => {
    T().startFocus();
    const s = T();
    clock.advance(30 * MIN);
    // Stale state resurrected (e.g. an old tab writing back) with lastEnded pointing at itself.
    useTimer.setState({ lastEnded: { sessionId: s.sessionId!, phase: 'focus', reason: 'complete', at: s.endsAt!, whileAway: false } });
    T().tick();
    expect(completes()).toHaveLength(0);
    expect(T().status).toBe('idle');
  });

  it('respects the completion guard (follower tab)', () => {
    let allowed = false;
    const refreshed: number[] = [];
    setCompletionGuard({ canComplete: () => allowed, refresh: () => refreshed.push(1), alreadyCompleted: () => false, announce: () => {} });
    T().startFocus();
    clock.advance(26 * MIN);
    T().tick();
    T().pause(); // pausing at 0:00 is refused while completion is pending
    T().end();
    expect(T().status).toBe('running');
    expect(completes()).toHaveLength(0);
    allowed = true;
    T().tick();
    expect(refreshed.length).toBe(1); // re-read shared state right before completing
    expect(completes()).toHaveLength(1);
  });

  it('skips a session another tab announced as completed', () => {
    setCompletionGuard({ canComplete: () => true, refresh: () => {}, alreadyCompleted: () => true, announce: () => {} });
    T().startFocus();
    clock.advance(26 * MIN);
    T().tick();
    expect(completes()).toHaveLength(0);
    expect(T().status).toBe('idle');
  });

  it('pausing at 0:00 completes instead', () => {
    T().startFocus();
    clock.advance(25 * MIN + 5);
    T().pause();
    expect(completes()).toHaveLength(1);
    expect(T().status).toBe('idle');
  });
});

describe('long-break cycle', () => {
  it('short, short, short, long — then the cycle restarts', () => {
    const kinds: string[] = [];
    for (let i = 0; i < 8; i++) {
      T().startFocus();
      clock.advance(25 * MIN);
      T().tick();
      const kind = nextBreakKind(T().completedInCycle);
      kinds.push(kind);
      T().startBreak();
      expect(T().phase).toBe(kind);
      clock.advance(T().plannedMs);
      T().tick();
    }
    expect(kinds).toEqual(['shortBreak', 'shortBreak', 'shortBreak', 'longBreak', 'shortBreak', 'shortBreak', 'shortBreak', 'longBreak']);
  });

  it('a skipped long break stays owed', () => {
    for (let i = 0; i < 5; i++) {
      T().startFocus();
      clock.advance(25 * MIN);
      T().tick();
    }
    expect(T().completedInCycle).toBe(5);
    expect(nextBreakKind(T().completedInCycle)).toBe('longBreak');
    T().startBreak();
    expect(T().phase).toBe('longBreak');
    expect(T().completedInCycle).toBe(0);
  });

  it('follows longBreakEvery from settings', () => {
    useSettings.getState().applyRhythm('deep'); // every 3
    expect(nextBreakKind(2)).toBe('shortBreak');
    expect(nextBreakKind(3)).toBe('longBreak');
  });
});

describe('record.day', () => {
  it('uses the local day the session ended — across midnight', () => {
    vi.setSystemTime(new Date(2026, 8, 28, 23, 50, 0));
    T().startFocus();
    clock.advance(25 * MIN);
    T().tick();
    expect(rec(completes()[0]).day).toBe('2026-09-29');
  });

  it('pause across midnight: day of the real end, paused time excluded', () => {
    vi.setSystemTime(new Date(2026, 8, 28, 23, 40, 0));
    T().startFocus();
    clock.advance(10 * MIN);
    T().pause();
    clock.advance(40 * MIN); // paused past midnight
    T().resume();
    clock.advance(15 * MIN);
    T().tick();
    const r = rec(completes()[0]);
    expect(r.day).toBe('2026-09-29');
    expect(r.focusedMs).toBe(25 * MIN);
    expect(r.endedAt - r.startedAt).toBe(65 * MIN);
  });

  it('completion found the next morning is still filed under the day it really ended', () => {
    vi.setSystemTime(new Date(2026, 8, 28, 23, 30, 0));
    T().startFocus();
    clock.advance(9 * 60 * MIN); // app closed overnight
    T().tick();
    expect(rec(completes()[0]).day).toBe('2026-09-28');
    expect(completes()[0].payload.whileAway).toBe(true);
  });
});

describe('restore after reload (persist + rehydrate)', () => {
  /** Simulate a fresh page: memory back to initial, then hydrate from what storage held. */
  const reload = () => {
    const saved = storage.getItem(TIMER_STORAGE_KEY);
    useTimer.setState({ ...INITIAL_TIMER }); // (this write is what a closed tab would never do…)
    if (saved == null) storage.removeItem(TIMER_STORAGE_KEY);
    else storage.setItem(TIMER_STORAGE_KEY, saved); // …so put storage back exactly as it was
    return useTimer.persist.rehydrate();
  };

  it('restores a running session exactly', () => {
    T().startFocus({ intention: 'Inbox', tag: 'work' });
    clock.advance(7 * MIN);
    const saved = storage.getItem(TIMER_STORAGE_KEY);
    expect(saved).toContain('"status":"running"');
    useTimer.setState({ ...INITIAL_TIMER });
    storage.setItem(TIMER_STORAGE_KEY, saved!);
    void useTimer.persist.rehydrate();
    expect(T()).toMatchObject({ status: 'running', intention: 'Inbox', tag: 'work' });
    expect(remainingAt(T())).toBe(18 * MIN);
  });

  it('restores a paused session exactly, hours later', () => {
    T().startFocus();
    clock.advance(4 * MIN);
    T().pause();
    const saved = storage.getItem(TIMER_STORAGE_KEY)!;
    clock.advance(5 * 60 * MIN);
    useTimer.setState({ ...INITIAL_TIMER });
    storage.setItem(TIMER_STORAGE_KEY, saved);
    void useTimer.persist.rehydrate();
    expect(T().status).toBe('paused');
    expect(remainingAt(T())).toBe(21 * MIN);
  });

  it('a phase that ended while closed completes once on the next tick — even across repeated reloads', () => {
    T().startFocus();
    const endsAt = T().endsAt!;
    const saved = storage.getItem(TIMER_STORAGE_KEY)!;
    clock.advance(2 * 60 * MIN);
    storage.setItem(TIMER_STORAGE_KEY, saved);
    void reload();
    T().tick();
    expect(completes()).toHaveLength(1);
    expect(rec(completes()[0]).endedAt).toBe(endsAt);
    // Reload again: storage now holds the idle state with lastEnded → nothing to complete.
    void reload();
    T().tick();
    expect(completes()).toHaveLength(1);
    expect(T().status).toBe('idle');
  });

  it('reload exactly at 0:00 completes once', () => {
    T().startFocus();
    clock.advance(25 * MIN);
    const saved = storage.getItem(TIMER_STORAGE_KEY)!;
    storage.setItem(TIMER_STORAGE_KEY, saved);
    void reload();
    T().tick();
    T().tick();
    expect(completes()).toHaveLength(1);
    expect(completes()[0].payload.whileAway).toBe(false);
  });

  it('survives corrupt or hand-edited storage', () => {
    storage.setItem(TIMER_STORAGE_KEY, '{not json');
    void reload();
    expect(T().status).toBe('idle');
    storage.setItem(TIMER_STORAGE_KEY, JSON.stringify({ state: { status: 'running', plannedMs: 'x', sessionId: 5 }, version: 1 }));
    void reload();
    expect(T().status).toBe('idle');
    expect(T().plannedMs).toBe(25 * MIN);
  });
});

describe('sanitizeTimer', () => {
  const now = new Date(2026, 8, 28, 10).getTime();
  it('turns an unanchored running state into paused (keeps the time)', () => {
    const s = sanitizeTimer({ status: 'running', phase: 'focus', plannedMs: 25 * MIN, remainingMs: 10 * MIN, endsAt: null, sessionId: 's1' }, now);
    expect(s).toMatchObject({ status: 'paused', remainingMs: 10 * MIN });
  });
  it('caps remaining at the plan when the clock went backwards while closed', () => {
    const s = sanitizeTimer({ status: 'running', phase: 'focus', plannedMs: 25 * MIN, endsAt: now + 90 * MIN, startedAt: now + 65 * MIN, sessionId: 's1' }, now);
    expect(s.endsAt).toBe(now + 25 * MIN);
  });
  it('clamps paused remaining into [0, plan] and unknown phases to focus', () => {
    const s = sanitizeTimer({ status: 'paused', phase: 'nap', plannedMs: 5 * MIN, remainingMs: 99 * MIN, sessionId: 's1' }, now);
    expect(s).toMatchObject({ phase: 'focus', remainingMs: 5 * MIN });
  });
  it('idle state follows the current focus-length setting', () => {
    useSettings.getState().set({ focusMin: 40 });
    const s = sanitizeTimer({ status: 'idle', plannedMs: 25 * MIN, remainingMs: 25 * MIN }, now);
    expect(s).toMatchObject({ status: 'idle', plannedMs: 40 * MIN, remainingMs: 40 * MIN });
  });
});

describe('settings while idle vs running', () => {
  it('idle length follows focusMin; a running phase is unaffected', () => {
    useSettings.getState().set({ focusMin: 50 });
    T().syncIdleLength();
    expect(T().remainingMs).toBe(50 * MIN);
    T().startFocus();
    useSettings.getState().set({ focusMin: 15 });
    T().syncIdleLength();
    expect(T().plannedMs).toBe(50 * MIN);
    expect(remainingAt(T())).toBe(50 * MIN);
  });
});

describe('rebase (system clock jumped)', () => {
  it('keeps the countdown continuous when the clock is set back', () => {
    T().startFocus();
    clock.advance(10 * MIN);
    // Clock set back an hour: anchors shift by the same amount.
    clock.advance(-60 * MIN);
    T().rebase(-60 * MIN);
    expect(remainingAt(T())).toBe(15 * MIN);
  });
});
