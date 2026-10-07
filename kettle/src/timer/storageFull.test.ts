/**
 * Storage full (or blocked) while a brew runs. The in-memory timer is then the only up-to-date copy:
 * the pre-completion re-read of shared storage (for other tabs' writes) must not roll it back to the
 * last state that did get saved, or the brew is lost at 0:00 (reproduced in a real browser, see
 * review/product-excellence/contracts/I01).
 */
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { clock } from '@/lib/clock';
import { on } from '@/lib/events';
import { lastWriteFailed, onStorageWriteError, safeStorage, storageWriteFailures } from '@/lib/storage';
import { useSettings, DEFAULT_SETTINGS } from '@/state/settings';
import { initProgress, useProgress } from '@/progress';
import type { SessionRecord } from '@/progress/types';
import { useTimer, setCompletionGuard, INITIAL_TIMER, TIMER_STORAGE_KEY } from './store';
import { mirrorTimerFromStorage, wasCompletedElsewhere, broadcastCompleted } from './sync';

const MIN = 60_000;

/** localStorage whose writes start failing like a full quota when `full` is set. */
class FillableStorage {
  map = new Map<string, string>();
  full = false;
  getItem(k: string) {
    return this.map.has(k) ? this.map.get(k)! : null;
  }
  setItem(k: string, v: string) {
    if (this.full) throw Object.assign(new Error('The quota has been exceeded.'), { name: 'QuotaExceededError', code: 22 });
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

const storage = new FillableStorage();
const completes: { record: SessionRecord; whileAway: boolean }[] = [];
const syncs: string[] = [];

beforeAll(() => {
  (globalThis as unknown as { localStorage: FillableStorage }).localStorage = storage;
  initProgress();
  on('timer:complete', ({ record, whileAway }) => completes.push({ record, whileAway }));
  on('timer:sync', ({ kind }) => syncs.push(kind));
});

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date(2026, 8, 28, 10, 0, 0));
  clock.reset();
  storage.full = false;
  storage.clear();
  useSettings.setState({ ...DEFAULT_SETTINGS });
  useProgress.getState().resetAll();
  // The real guard re-reads shared storage right before completing (see ticker.ts).
  setCompletionGuard({ canComplete: () => true, refresh: () => void mirrorTimerFromStorage(), alreadyCompleted: wasCompletedElsewhere, announce: broadcastCompleted });
  useTimer.setState({ ...INITIAL_TIMER, lastEnded: null }); // saved: an idle kettle
  completes.length = 0;
  syncs.length = 0;
});

afterEach(() => {
  setCompletionGuard(null);
  vi.useRealTimers();
  clock.reset();
});

const T = () => useTimer.getState();

describe('storage full while brewing', () => {
  it('a brew started after storage filled up still completes once and is recorded (not rolled back to the saved idle kettle)', () => {
    storage.full = true;
    T().startFocus({ intention: 'Quota' });
    const sid = T().sessionId!;
    expect(lastWriteFailed(TIMER_STORAGE_KEY)).toBe(true);
    clock.advance(25 * MIN);
    T().tick();
    expect(completes).toHaveLength(1);
    expect(completes[0].record).toMatchObject({ id: sid, completed: true, focusedMs: 25 * MIN, intention: 'Quota' });
    expect(T()).toMatchObject({ status: 'idle', lastEnded: { sessionId: sid, reason: 'complete' } });
    expect(useProgress.getState().sessions.filter((s) => s.id === sid)).toHaveLength(1);
    expect(syncs).not.toContain('reset');
    T().tick();
    expect(completes).toHaveLength(1);
  });

  it('+5 added after storage filled up: the brew completes at its extended end with all 30 minutes', () => {
    T().startFocus();
    const sid = T().sessionId!;
    clock.advance(10 * MIN);
    storage.full = true;
    T().addTime(5 * MIN); // this save fails: storage still says 25 minutes
    clock.advance(15 * MIN); // the saved (unextended) end has passed; the real one has not
    T().tick();
    expect(completes).toHaveLength(0);
    expect(T()).toMatchObject({ status: 'running', sessionId: sid, plannedMs: 30 * MIN });
    clock.advance(5 * MIN);
    T().tick();
    expect(completes).toHaveLength(1);
    expect(completes[0].record).toMatchObject({ id: sid, plannedMs: 30 * MIN, focusedMs: 30 * MIN });
  });

  it('another tab’s successful write still wins: a storage event mirrors it even after this tab failed to save', () => {
    T().startFocus();
    storage.full = true;
    T().pause(); // fails to save here
    // Another tab (whose write landed) ended the brew: what storage now holds is newer than this tab.
    const other = JSON.parse(storage.getItem(TIMER_STORAGE_KEY)!);
    other.state = { ...other.state, status: 'idle', endsAt: null, sessionId: null, lastEnded: { sessionId: T().sessionId, phase: 'focus', reason: 'user', at: Date.now(), whileAway: false } };
    storage.map.set(TIMER_STORAGE_KEY, JSON.stringify(other));
    mirrorTimerFromStorage({ event: true });
    expect(T().status).toBe('idle');
    expect(syncs).toContain('stop');
  });
});

describe('safeStorage write failures', () => {
  it('never throws, reports each failure with whether storage is full, and clears the flag after a good write', () => {
    const seen: { key: string; quota: boolean }[] = [];
    const off = onStorageWriteError((e) => seen.push(e));
    const n = storageWriteFailures();
    storage.full = true;
    expect(() => safeStorage.setItem('kettle:x', '1')).not.toThrow();
    expect(storageWriteFailures()).toBe(n + 1);
    expect(seen).toEqual([{ key: 'kettle:x', quota: true }]);
    expect(lastWriteFailed('kettle:x')).toBe(true);
    storage.full = false;
    safeStorage.setItem('kettle:x', '2');
    expect(lastWriteFailed('kettle:x')).toBe(false);
    expect(storage.getItem('kettle:x')).toBe('2');
    off();
  });
});
