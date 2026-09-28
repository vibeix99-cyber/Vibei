/**
 * Multi-tab exactly-once tests. Each "tab" is a fresh module graph
 * (vi.resetModules) with its own in-memory stores, sharing one localStorage
 * and one (fake) Web Locks manager — the same things real tabs share.
 * Time moves with the shared system clock so every tab sees the same "now".
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { SessionRecord } from '@/progress/types';
import { electLeader, parseLease, shouldClaimLease, type LockManagerLike } from './leader';

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

type Entry = {
  cb: (lock: unknown) => unknown;
  resolve: (v: unknown) => void;
  reject: (e: unknown) => void;
  signal?: AbortSignal;
};

/** Minimal Web Locks: one exclusive lock, FIFO queue, `steal`, `signal`. */
class FakeLocks implements LockManagerLike {
  holder: Entry | null = null;
  queue: Entry[] = [];
  request(_name: string, opts: { steal?: boolean; signal?: AbortSignal }, cb: (lock: unknown) => unknown): Promise<unknown> {
    return new Promise((resolve, reject) => {
      const e: Entry = { cb, resolve, reject, signal: opts.signal };
      if (opts.signal) {
        if (opts.signal.aborted) return reject(new Error('AbortError'));
        opts.signal.addEventListener('abort', () => {
          const i = this.queue.indexOf(e);
          if (i >= 0) {
            this.queue.splice(i, 1);
            reject(new Error('AbortError'));
          }
        });
      }
      if (opts.steal) {
        const old = this.holder;
        this.holder = null;
        old?.reject(new Error('AbortError: stolen'));
        this.grant(e);
      } else if (!this.holder) this.grant(e);
      else this.queue.push(e);
    });
  }
  private grant(e: Entry) {
    this.holder = e;
    void Promise.resolve().then(async () => {
      let result: unknown;
      try {
        result = await e.cb({});
      } catch (err) {
        if (this.holder === e) {
          this.holder = null;
          e.reject(err);
          this.next();
        }
        return;
      }
      if (this.holder === e) {
        this.holder = null;
        e.resolve(result);
        this.next();
      }
    });
  }
  private next() {
    const n = this.queue.shift();
    if (n) this.grant(n);
  }
}

const flush = async () => {
  for (let i = 0; i < 5; i++) await new Promise((r) => setTimeout(r, 0));
};

const storage = new MemoryStorage();
(globalThis as unknown as { localStorage: MemoryStorage }).localStorage = storage;

async function openTab(name: string, locks: FakeLocks | null) {
  vi.resetModules();
  const store = await import('./store');
  const sync = await import('./sync');
  const events = await import('@/lib/events');
  const progress = await import('@/progress');
  progress.initProgress();
  const leader = locks ? electLeader({ name: 'kettle:leader', locks, id: name }) : null;
  store.setCompletionGuard({
    canComplete: () => leader?.isLeader() ?? true,
    refresh: () => {
      sync.mirrorTimerFromStorage();
    },
    alreadyCompleted: sync.wasCompletedElsewhere,
    announce: sync.broadcastCompleted,
  });
  const completes: SessionRecord[] = [];
  const syncs: { kind: string; record: SessionRecord | null }[] = [];
  events.on('timer:complete', ({ record }) => completes.push(record));
  events.on('timer:sync', ({ kind, record }) => syncs.push({ kind, record }));
  return {
    name,
    timer: store.useTimer,
    progress: progress.useProgress,
    leader,
    completes,
    syncs,
    /** Deliver the `storage` event this tab would get for the timer key. */
    storageEvent: () => sync.mirrorTimerFromStorage(),
    progressEvent: () => progress.syncFromStorage(),
  };
}

const storedSessions = (): SessionRecord[] => {
  const raw = storage.getItem('kettle:progress');
  return raw ? ((JSON.parse(raw).state?.sessions ?? []) as SessionRecord[]) : [];
};
const advance = (ms: number) => vi.setSystemTime(Date.now() + ms);

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date(2026, 8, 28, 10, 0, 0));
  storage.clear();
});
afterEach(() => {
  vi.useRealTimers();
});

describe('two tabs, one session', () => {
  it('only the leader completes; the follower mirrors; progress holds exactly one session', async () => {
    const locks = new FakeLocks();
    const A = await openTab('A', locks);
    await flush();
    const B = await openTab('B', locks);
    await flush();
    expect(A.leader!.isLeader()).toBe(true);
    expect(B.leader!.isLeader()).toBe(false);

    A.timer.getState().startFocus({ intention: 'Essay' });
    B.storageEvent();
    expect(B.timer.getState().sessionId).toBe(A.timer.getState().sessionId);
    expect(B.syncs.at(-1)?.kind).toBe('start');

    advance(25 * MIN + 100);
    // Both tabs' tickers fire at the same moment.
    B.timer.getState().tick();
    A.timer.getState().tick();
    B.timer.getState().tick();
    expect(A.completes).toHaveLength(1);
    expect(B.completes).toHaveLength(0);
    expect(B.timer.getState().status).toBe('running'); // still waiting for the leader's write

    B.storageEvent();
    expect(B.timer.getState().status).toBe('idle');
    const sync = B.syncs.at(-1)!;
    expect(sync.kind).toBe('complete');
    expect(sync.record?.id).toBe(A.completes[0].id);
    B.timer.getState().tick();
    expect(B.completes).toHaveLength(0);

    const sessions = storedSessions().filter((s) => s.id === A.completes[0].id);
    expect(sessions).toHaveLength(1);
    expect(B.progress.getState().sessions.filter((s) => s.id === A.completes[0].id)).toHaveLength(1);
  });

  it('leader closes mid-session → the other tab takes over and completes once', async () => {
    const locks = new FakeLocks();
    const A = await openTab('A', locks);
    await flush();
    const B = await openTab('B', locks);
    await flush();
    A.timer.getState().startFocus();
    B.storageEvent();
    advance(10 * MIN);
    A.leader!.stop(); // tab closed
    await flush();
    expect(B.leader!.isLeader()).toBe(true);
    advance(15 * MIN);
    B.timer.getState().tick();
    expect(B.completes).toHaveLength(1);
    expect(storedSessions()).toHaveLength(1);
  });

  it('leadership stolen at the instant of completion never double-records', async () => {
    const locks = new FakeLocks();
    const A = await openTab('A', locks);
    await flush();
    const B = await openTab('B', locks);
    await flush();
    A.timer.getState().startFocus();
    B.storageEvent();
    advance(25 * MIN);
    // A completes first (it hasn't processed the steal yet)…
    A.timer.getState().tick();
    // …B steals leadership (user focused it) before A's storage event reached it.
    B.leader!.claim();
    await flush();
    expect(B.leader!.isLeader()).toBe(true);
    expect(A.leader!.isLeader()).toBe(false);
    // B's memory is stale (still running & due) — its tick re-reads storage first.
    expect(B.timer.getState().status).toBe('running');
    B.timer.getState().tick();
    expect(B.completes).toHaveLength(0);
    expect(B.timer.getState().status).toBe('idle');
    expect(storedSessions()).toHaveLength(1);
  });

  it('two tabs pressing start at the same time converge on one session', async () => {
    const locks = new FakeLocks();
    const A = await openTab('A', locks);
    await flush();
    const B = await openTab('B', locks);
    await flush();
    A.timer.getState().startFocus({ intention: 'from A' });
    B.timer.getState().startFocus({ intention: 'from B' }); // B's write lands last
    A.storageEvent();
    B.storageEvent();
    const sid = B.timer.getState().sessionId;
    expect(A.timer.getState().sessionId).toBe(sid);
    expect(A.timer.getState().intention).toBe('from B');
    advance(25 * MIN);
    A.timer.getState().tick();
    B.timer.getState().tick();
    B.storageEvent();
    expect(A.completes.length + B.completes.length).toBe(1);
    expect(storedSessions()).toHaveLength(1);
    expect(storedSessions()[0].id).toBe(sid);
  });

  it('a follower pressing End at 0:00 does not record a second (partial) session', async () => {
    const locks = new FakeLocks();
    const A = await openTab('A', locks);
    await flush();
    const B = await openTab('B', locks);
    await flush();
    A.timer.getState().startFocus();
    B.storageEvent();
    advance(25 * MIN + 500);
    B.timer.getState().end('user'); // refused: completion pending, leader will do it
    A.timer.getState().tick();
    B.storageEvent();
    expect(storedSessions()).toHaveLength(1);
    expect(storedSessions()[0].completed).toBe(true);
  });

  it('a stale tab that ends early after the leader completed cannot resurrect the session', async () => {
    const locks = new FakeLocks();
    const A = await openTab('A', locks);
    await flush();
    const B = await openTab('B', locks);
    await flush();
    A.timer.getState().startFocus();
    B.storageEvent();
    advance(12 * MIN);
    A.timer.getState().end('user'); // A records 12 min
    // B never got the event and the user ends there too.
    B.timer.getState().end('user');
    B.progressEvent();
    const ids = storedSessions().map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length); // same id never stored twice
    expect(ids).toHaveLength(1);
  });

  it('pause in one tab shows as paused in the other (and emits timer:sync pause/resume/addTime)', async () => {
    const locks = new FakeLocks();
    const A = await openTab('A', locks);
    await flush();
    const B = await openTab('B', locks);
    await flush();
    A.timer.getState().startFocus();
    B.storageEvent();
    advance(MIN);
    B.timer.getState().pause();
    A.storageEvent();
    expect(A.timer.getState().status).toBe('paused');
    expect(A.syncs.at(-1)?.kind).toBe('pause');
    B.timer.getState().addTime(5 * MIN);
    A.storageEvent();
    expect(A.syncs.at(-1)?.kind).toBe('addTime');
    B.timer.getState().resume();
    A.storageEvent();
    expect(A.syncs.at(-1)?.kind).toBe('resume');
    expect(A.timer.getState().endsAt).toBe(B.timer.getState().endsAt);
  });
});

describe('atomic completion claims', () => {
  /** In-memory stand-in for the IndexedDB test-and-set (one winner per id). */
  const makeClaimStore = () => {
    const claimed = new Map<string, string>();
    return (id: string, by: string) => {
      const cur = claimed.get(id);
      if (cur) return cur === by ? 'won' : 'lost';
      claimed.set(id, by);
      return 'won';
    };
  };

  it('two tabs that BOTH think they lead still complete once (split-brain)', async () => {
    const claim = makeClaimStore();
    // No lock manager: both tabs' leader rule says yes. Only the claim decides.
    const A = await openTab('A', null);
    const B = await openTab('B', null);
    A.timer.getState().startFocus();
    B.storageEvent();
    advance(25 * MIN);
    const results = new Map<string, string>();
    const guarded = (tab: typeof A, tabId: string) => {
      const sid = tab.timer.getState().sessionId!;
      if (!results.has(tabId)) results.set(tabId, claim(sid, tabId));
      return results.get(tabId) === 'won';
    };
    // Both tabs' tickers fire; each only completes if it won the claim.
    if (guarded(B, 'B')) B.timer.getState().tick();
    if (guarded(A, 'A')) A.timer.getState().tick();
    expect(A.completes.length + B.completes.length).toBe(1);
    expect(storedSessions()).toHaveLength(1);
    // The loser mirrors the winner's write.
    A.storageEvent();
    expect(A.timer.getState().status).toBe('idle');
  });

  it('claim rule: pending blocks, won allows, lost waits out the grace period, no IndexedDB → leader rule only', async () => {
    const { claimAllows, LOST_CLAIM_GRACE_MS } = await import('./claims');
    expect(claimAllows(undefined, false, 0)).toBe(true);
    expect(claimAllows(undefined, true, 0)).toBe(false);
    expect(claimAllows({ result: 'pending', at: 0 }, true, 10)).toBe(false);
    expect(claimAllows({ result: 'won', at: 0 }, true, 10)).toBe(true);
    expect(claimAllows({ result: 'error', at: 0 }, true, 10)).toBe(true);
    expect(claimAllows({ result: 'lost', at: 0 }, true, LOST_CLAIM_GRACE_MS - 1)).toBe(false);
    expect(claimAllows({ result: 'lost', at: 0 }, true, LOST_CLAIM_GRACE_MS + 1)).toBe(true);
  });
});

describe('Web Locks election', () => {
  it('exactly one leader at every step; claim steals; handover on stop', async () => {
    const locks = new FakeLocks();
    const tabs = ['A', 'B', 'C'].map((id) => electLeader({ locks, id }));
    const leaders = () => tabs.filter((t) => t.isLeader()).map((t) => t.id);
    await flush();
    expect(leaders()).toEqual(['A']);
    tabs[2].claim();
    await flush();
    expect(leaders()).toEqual(['C']);
    tabs[1].claim();
    await flush();
    expect(leaders()).toEqual(['B']);
    tabs[1].stop();
    await flush();
    expect(leaders()).toHaveLength(1);
    const next = leaders()[0];
    tabs.find((t) => t.id === next)!.stop();
    await flush();
    expect(leaders()).toHaveLength(1);
    expect(leaders()[0]).not.toBe(next);
  });
});

describe('localStorage lease fallback', () => {
  function makeTimers() {
    const fns = new Set<() => void>();
    return {
      timers: {
        setInterval: (fn: () => void) => {
          fns.add(fn);
          return fn;
        },
        clearInterval: (h: unknown) => {
          fns.delete(h as () => void);
        },
      },
      beat: () => fns.forEach((f) => f()),
    };
  }

  it('lease rules', () => {
    expect(shouldClaimLease(null, 'a', 0)).toBe(true);
    expect(shouldClaimLease({ id: 'a', exp: 10 }, 'a', 5)).toBe(true);
    expect(shouldClaimLease({ id: 'b', exp: 10 }, 'a', 5)).toBe(false);
    expect(shouldClaimLease({ id: 'b', exp: 10 }, 'a', 10)).toBe(true);
    expect(parseLease('nope')).toBeNull();
    expect(parseLease('{"id":"x","exp":3}')).toEqual({ id: 'x', exp: 3 });
  });

  it('one leader after two confirmations; takeover after the lease expires', () => {
    const s = new MemoryStorage();
    let now = 1000;
    const tA = makeTimers();
    const tB = makeTimers();
    const A = electLeader({ storage: s, id: 'A', now: () => now, ttlMs: 4000, timers: tA.timers });
    const B = electLeader({ storage: s, id: 'B', now: () => now, ttlMs: 4000, timers: tB.timers });
    expect(A.isLeader()).toBe(false); // not confirmed yet
    now += 1000;
    tA.beat();
    tB.beat();
    expect(A.isLeader()).toBe(true);
    expect(B.isLeader()).toBe(false);
    // A crashes (no more beats, no cleanup). B takes over only after the TTL.
    now += 2000;
    tB.beat();
    expect(B.isLeader()).toBe(false);
    now += 3000;
    tB.beat();
    tB.beat();
    expect(B.isLeader()).toBe(true);
  });

  it('two tabs racing for an expired lease never both lead', () => {
    const s = new MemoryStorage();
    let now = 0;
    const tA = makeTimers();
    const tB = makeTimers();
    // Both see "no lease" and write in the same instant; B's write lands last.
    const A = electLeader({ storage: s, id: 'A', now: () => now, timers: tA.timers });
    const B = electLeader({ storage: s, id: 'B', now: () => now, timers: tB.timers });
    for (let i = 0; i < 5; i++) {
      now += 1000;
      tA.beat();
      tB.beat();
      expect(Number(A.isLeader()) + Number(B.isLeader())).toBeLessThanOrEqual(1);
    }
    expect(Number(A.isLeader()) + Number(B.isLeader())).toBe(1);
  });

  it('stop() frees the lease so the next tab leads within two heartbeats', () => {
    const s = new MemoryStorage();
    let now = 0;
    const tA = makeTimers();
    const tB = makeTimers();
    const A = electLeader({ storage: s, id: 'A', now: () => now, timers: tA.timers });
    now += 1000;
    tA.beat();
    expect(A.isLeader()).toBe(true);
    const B = electLeader({ storage: s, id: 'B', now: () => now, timers: tB.timers });
    A.stop();
    expect(s.getItem('kettle:leader:lease')).toBeNull();
    now += 1000;
    tB.beat();
    expect(B.isLeader()).toBe(false); // claimed, not yet confirmed
    now += 1000;
    tB.beat();
    expect(B.isLeader()).toBe(true);
  });

  it('solo mode (no locks, no storage) is always leader', () => {
    expect(electLeader({}).isLeader()).toBe(true);
  });
});
