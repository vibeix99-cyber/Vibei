/**
 * F1 (`integrity:309`): saving the intention from a tab that is a moment behind must not undo another tab's brew.
 *
 * Each "tab" is a fresh module graph (vi.resetModules) with its own in-memory stores, sharing one localStorage, as in
 * multitab.test.ts. A tab takes in another tab's write only when its `storage` event is delivered (`storageEvent()`),
 * so "the event has not arrived yet" is exact here: no load, no timing.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { SessionRecord } from '@/progress/types';

const MIN = 60_000;
const KEY = 'kettle:timer';

class MemoryStorage {
  map = new Map<string, string>();
  /** Storage full: every write throws, as a real full localStorage does. */
  full = false;
  getItem(k: string) {
    return this.map.has(k) ? this.map.get(k)! : null;
  }
  setItem(k: string, v: string) {
    if (this.full) throw Object.assign(new Error('full'), { name: 'QuotaExceededError' });
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
(globalThis as unknown as { localStorage: MemoryStorage }).localStorage = storage;

async function openTab(name: string, leader: boolean) {
  vi.resetModules();
  const store = await import('./store');
  const sync = await import('./sync');
  const events = await import('@/lib/events');
  const progress = await import('@/progress');
  progress.initProgress();
  store.setCompletionGuard({
    canComplete: () => leader,
    refresh: () => {
      sync.mirrorTimerFromStorage();
    },
    alreadyCompleted: sync.wasCompletedElsewhere,
    announce: sync.broadcastCompleted,
  });
  const completes: SessionRecord[] = [];
  const syncs: string[] = [];
  events.on('timer:complete', ({ record }) => completes.push(record));
  events.on('timer:sync', ({ kind }) => syncs.push(kind));
  return {
    name,
    timer: store.useTimer,
    progress: progress.useProgress,
    completes,
    syncs,
    /** Deliver the `storage` event this tab gets for the timer key (another tab's write has landed). */
    storageEvent: () => sync.mirrorTimerFromStorage({ event: true }),
  };
}

const stored = () => JSON.parse(storage.getItem(KEY)!) as { state: Record<string, unknown>; version: number };
const storedSessions = (): SessionRecord[] => {
  const raw = storage.getItem('kettle:progress');
  return raw ? ((JSON.parse(raw).state?.sessions ?? []) as SessionRecord[]) : [];
};
const advance = (ms: number) => vi.setSystemTime(Date.now() + ms);

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date(2026, 9, 12, 9, 40, 0));
  storage.full = false;
  storage.clear();
});
afterEach(() => {
  vi.useRealTimers();
});

describe('saving the intention writes only the intention (F1)', () => {
  it('a tab that has not yet taken in another tab’s new brew saves its intention: the brew survives in both tabs and is recorded once', async () => {
    const A = await openTab('A', true);
    const B = await openTab('B', false);
    // Both on Today, idle and in step (each Today's composer synced its words on mount).
    A.timer.getState().setIntention('', null);
    B.storageEvent();
    B.timer.getState().setIntention('', null);
    A.storageEvent();

    // Tab B starts a brew: storage holds it, running.
    B.timer.getState().startFocus({ intention: 'Chapter 3 notes', tag: 'study' });
    const { sessionId, endsAt, startedAt } = B.timer.getState();
    expect(stored().state).toMatchObject({ status: 'running', sessionId, endsAt });

    // Before tab A has taken in that write, A's Today composer saves its intention (its 150 ms sync).
    expect(A.timer.getState().status).toBe('idle');
    A.timer.getState().setIntention('Reply to Sam', 'work');

    // Storage still holds B's brew, untouched: status, session, anchors and B's own words.
    expect(stored().version).toBe(1);
    expect(stored().state).toMatchObject({ status: 'running', sessionId, endsAt, startedAt, intention: 'Chapter 3 notes', tag: 'study' });

    // The storage events arrive. Both tabs end with the brew.
    A.storageEvent();
    B.storageEvent();
    for (const t of [A, B]) expect(t.timer.getState()).toMatchObject({ status: 'running', sessionId, endsAt, intention: 'Chapter 3 notes' });
    expect(A.syncs).toEqual(['start']);
    expect(B.syncs).toEqual([]); // no 'reset' in the tab that started it

    // It completes once (A leads), and both tabs see one record.
    advance(25 * MIN + 100);
    A.timer.getState().tick();
    B.timer.getState().tick();
    B.storageEvent();
    expect(A.completes.map((r) => r.id)).toEqual([sessionId]);
    expect(B.completes).toHaveLength(0);
    expect(B.syncs).toEqual(['complete']);
    expect(storedSessions().filter((r) => r.id === sessionId)).toHaveLength(1);
    for (const t of [A, B]) expect(t.progress.getState().sessions.filter((r) => r.id === sessionId)).toHaveLength(1);
  });

  it('a tab that has not yet seen the other tab end the brew does not bring it back by saving its intention', async () => {
    const A = await openTab('A', true);
    const B = await openTab('B', false);
    A.timer.getState().startFocus({ intention: 'Essay' });
    B.storageEvent();
    advance(5 * MIN);
    A.timer.getState().end('user');
    expect(stored().state).toMatchObject({ status: 'idle', sessionId: null });
    // B is still running in memory; its composer saves.
    B.timer.getState().setIntention('Essay, part 2');
    expect(stored().state).toMatchObject({ status: 'idle', sessionId: null });
    B.storageEvent();
    expect(B.timer.getState().status).toBe('idle');
    expect(B.syncs).toEqual(['start', 'stop']);
  });

  it('same brew, other tab paused it: the intention is saved and the pause is kept', async () => {
    const A = await openTab('A', true);
    const B = await openTab('B', false);
    A.timer.getState().startFocus({ intention: 'Essay' });
    B.storageEvent();
    advance(2 * MIN);
    A.timer.getState().pause();
    const paused = stored().state;
    // B still thinks it is running; it saves new words for the same brew.
    B.timer.getState().setIntention('Essay, intro', 'work');
    expect(stored().state).toEqual({ ...paused, intention: 'Essay, intro', tag: 'work' });
    A.storageEvent();
    B.storageEvent();
    expect(B.timer.getState()).toMatchObject({ status: 'paused', intention: 'Essay, intro' });
    expect(A.timer.getState()).toMatchObject({ status: 'paused', intention: 'Essay, intro' });
  });

  it('keeps the stored format: same key, the { state, version: 1 } envelope, the same fields in the same order', async () => {
    const A = await openTab('A', true);
    A.timer.getState().startFocus({ intention: 'x' }); // a whole save
    const whole = storage.getItem(KEY)!;
    A.timer.getState().setIntention('y', 'study'); // an intention-only save
    const own = storage.getItem(KEY)!;
    expect(Object.keys(JSON.parse(own))).toEqual(Object.keys(JSON.parse(whole)));
    expect(Object.keys(JSON.parse(own).state)).toEqual(Object.keys(JSON.parse(whole).state));
    expect(own).toBe(whole.replace('"intention":"x","tag":null', '"intention":"y","tag":"study"'));
    // A fresh tab loads it as it is.
    const B = await openTab('B', false);
    expect(B.timer.getState()).toMatchObject({ status: 'running', intention: 'y', tag: 'study', sessionId: A.timer.getState().sessionId });
  });

  it('a fresh profile (nothing saved yet) saves as before', async () => {
    const A = await openTab('A', true);
    expect(storage.getItem(KEY)).toBeNull();
    A.timer.getState().setIntention('First', null);
    expect(stored()).toMatchObject({ version: 1, state: { status: 'idle', intention: 'First', sessionId: null } });
  });

  it('storage full: once this tab’s own save failed, the intention save writes the whole (newer) timer, as before, and repairs storage', async () => {
    const A = await openTab('A', true);
    A.timer.getState().setIntention('', null);
    storage.full = true;
    A.timer.getState().startFocus({ intention: 'Essay' }); // fails: storage still holds the idle timer
    expect(stored().state.status).toBe('idle');
    storage.full = false;
    A.timer.getState().setIntention('Essay, intro');
    expect(stored().state).toMatchObject({ status: 'running', sessionId: A.timer.getState().sessionId, intention: 'Essay, intro' });
  });
});
