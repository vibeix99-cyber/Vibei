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
  /** A tab's stale copy: reads of these keys return these values (Chromium updates a tab's copy with its storage event). */
  stale: Map<string, string | null> | null = null;
  getItem(k: string) {
    if (this.stale?.has(k)) return this.stale.get(k)!;
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
  const settings = await import('@/state/settings');
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
    settings: settings.useSettings,
    /**
     * Deliver the `storage` event for `kettle:settings`: settings rehydrate, and (as `ticker.ts:304` does on a focusMin
     * change) the timer's idle length follows.
     */
    settingsEvent: async () => {
      const before = settings.useSettings.getState().focusMin;
      await settings.useSettings.persist.rehydrate();
      if (settings.useSettings.getState().focusMin !== before) store.useTimer.getState().syncIdleLength();
    },
    /** This tab's person picks a brew length (Today's length control): settings save, then the idle length follows. */
    pickLength: (focusMin: number) => {
      settings.useSettings.getState().set({ focusMin });
      store.useTimer.getState().syncIdleLength();
    },
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
  storage.stale = null;
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

  it('a save that changes nothing writes nothing (Today’s composer syncing on mount), even in a tab that is behind', async () => {
    const A = await openTab('A', true);
    const B = await openTab('B', false);
    B.timer.getState().startFocus({ intention: 'Chapter 3 notes' });
    const raw = storage.getItem(KEY);
    // A is behind, and so is its copy of storage (it still reads nothing there, as in the failing I01 runs under load).
    // Its composer mounts with the words its timer already holds.
    storage.stale = new Map([[KEY, null]]);
    try {
      A.timer.getState().setIntention('', null);
      A.timer.getState().setIntention('');
    } finally {
      storage.stale = null;
    }
    expect(storage.getItem(KEY)).toBe(raw);
    A.storageEvent();
    expect(A.timer.getState()).toMatchObject({ status: 'running', sessionId: B.timer.getState().sessionId });
  });

  it('a fresh profile (nothing saved yet) saves as before', async () => {
    const A = await openTab('A', true);
    expect(storage.getItem(KEY)).toBeNull();
    A.timer.getState().setIntention('First', null);
    expect(stored()).toMatchObject({ version: 1, state: { status: 'idle', intention: 'First', sessionId: null } });
  });

  it('storage full: once this tab’s own save failed, the intention save writes the whole (newer) timer, as before, and repairs storage', async () => {
    const A = await openTab('A', true);
    A.timer.getState().setIntention('Essay plan', null);
    expect(stored().state).toMatchObject({ status: 'idle', intention: 'Essay plan' });
    storage.full = true;
    A.timer.getState().startFocus({ intention: 'Essay' }); // fails: storage still holds the idle timer
    expect(stored().state.status).toBe('idle');
    storage.full = false;
    A.timer.getState().setIntention('Essay, intro');
    expect(stored().state).toMatchObject({ status: 'running', sessionId: A.timer.getState().sessionId, intention: 'Essay, intro' });
  });
});

describe('the idle brew length sync writes only the length (F1X-D1)', () => {
  it('B picks another length and starts; A (idle, not yet seen the start) takes in the length change first: the brew survives in both tabs and is recorded once', async () => {
    const A = await openTab('A', true);
    const B = await openTab('B', false);
    A.timer.getState().setIntention('Inbox', null); // a saved idle timer, both tabs in step
    B.storageEvent();

    // B: the person picks 50 min on Today (kettle:settings), then taps Start (kettle:timer, running).
    B.pickLength(50);
    B.timer.getState().startFocus({ intention: 'Chapter 3 notes' });
    const { sessionId, endsAt, startedAt } = B.timer.getState();
    expect(stored().state).toMatchObject({ status: 'running', sessionId, endsAt, plannedMs: 50 * MIN });

    // A gets B's settings event first (events arrive in write order): its length sync runs before it has B's start.
    await A.settingsEvent();
    expect(A.timer.getState()).toMatchObject({ status: 'idle', sessionId: null, plannedMs: 50 * MIN });
    expect(stored().state, 'storage still holds B’s running brew').toMatchObject({ status: 'running', sessionId, endsAt, startedAt, plannedMs: 50 * MIN, intention: 'Chapter 3 notes' });

    // The timer events arrive. Both tabs end with the brew; it completes once.
    A.storageEvent();
    B.storageEvent();
    for (const t of [A, B]) expect(t.timer.getState()).toMatchObject({ status: 'running', sessionId, endsAt });
    expect(A.syncs).toEqual(['start']);
    expect(B.syncs).toEqual([]);
    advance(50 * MIN + 100);
    A.timer.getState().tick();
    B.timer.getState().tick();
    B.storageEvent();
    expect(A.completes.map((r) => r.id)).toEqual([sessionId]);
    expect(B.completes).toHaveLength(0);
    expect(storedSessions().filter((r) => r.id === sessionId)).toHaveLength(1);
    for (const t of [A, B]) expect(t.progress.getState().sessions.filter((r) => r.id === sessionId)).toHaveLength(1);
  });

  it('a real length change still persists: one tab', async () => {
    const A = await openTab('A', true);
    A.pickLength(40); // nothing saved yet: the whole idle timer, as before
    expect(stored()).toMatchObject({ version: 1, state: { status: 'idle', phase: 'focus', plannedMs: 40 * MIN, remainingMs: 40 * MIN } });
    A.timer.getState().setIntention('Essay', 'work');
    const whole = storage.getItem(KEY)!;
    A.pickLength(30); // the same idle timer in storage: only the length changes
    expect(storage.getItem(KEY)).toBe(whole.replace(`"plannedMs":${40 * MIN}`, `"plannedMs":${30 * MIN}`).replace(`"remainingMs":${40 * MIN}`, `"remainingMs":${30 * MIN}`));
    const B = await openTab('B', false); // a fresh tab loads it
    expect(B.timer.getState()).toMatchObject({ status: 'idle', plannedMs: 30 * MIN, intention: 'Essay', tag: 'work' });
  });

  it('a real length change still persists: two tabs in step, and the other tab’s newer words in storage are kept', async () => {
    const A = await openTab('A', true);
    const B = await openTab('B', false);
    A.timer.getState().setIntention('Inbox', null);
    B.storageEvent();
    // B saves new words; A has not taken them in yet when it picks a new length.
    B.timer.getState().setIntention('Reply to Sam', 'work');
    A.pickLength(45);
    expect(stored().state).toMatchObject({ status: 'idle', sessionId: null, plannedMs: 45 * MIN, remainingMs: 45 * MIN, intention: 'Reply to Sam', tag: 'work' });
    const raw = storage.getItem(KEY);
    // B takes in the settings change, then the timer write: in step, and its own sync changes nothing in storage.
    await B.settingsEvent();
    expect(storage.getItem(KEY)).toBe(raw);
    B.storageEvent();
    A.storageEvent();
    for (const t of [A, B]) expect(t.timer.getState()).toMatchObject({ status: 'idle', plannedMs: 45 * MIN, intention: 'Reply to Sam', tag: 'work' });
  });

  it('a sync that changes nothing writes nothing', async () => {
    const A = await openTab('A', true);
    A.pickLength(40);
    const raw = storage.getItem(KEY);
    storage.map.set(KEY, raw!.replace('"intention":""', '"intention":"written elsewhere"')); // spot any rewrite
    const marked = storage.getItem(KEY);
    A.timer.getState().syncIdleLength();
    A.pickLength(40);
    expect(storage.getItem(KEY)).toBe(marked);
  });

  it('storage full: once this tab’s own save failed, the length sync writes the whole (newer) timer, as before, and repairs storage', async () => {
    const A = await openTab('A', true);
    A.timer.getState().setIntention('Inbox', null);
    storage.full = true;
    A.timer.getState().setIntention('Essay', 'work'); // fails: storage still holds 'Inbox'
    expect(stored().state.intention).toBe('Inbox');
    storage.full = false;
    A.pickLength(40);
    expect(stored().state).toMatchObject({ status: 'idle', plannedMs: 40 * MIN, intention: 'Essay', tag: 'work' });
  });
});
