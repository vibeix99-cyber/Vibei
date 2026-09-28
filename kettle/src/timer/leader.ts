/**
 * Cross-tab leader election. OWNER: timer area.
 *
 * Exactly one open tab is the leader; only the leader fires completion side
 * effects (recording, sound, notification). Every tab mirrors state.
 *
 *  - Web Locks (all modern browsers): the leader holds an exclusive lock for as
 *    long as it lives; the lock passes to a waiting tab the instant the leader
 *    closes/crashes. `claim()` steals it (used when a tab becomes visible, so the
 *    tab the user is looking at — the one allowed to play sound — leads).
 *  - Fallback: a localStorage lease with heartbeat. A tab only counts itself
 *    leader after holding the lease on two consecutive beats, so two tabs
 *    racing for an expired lease never both lead.
 *  - Solo: no locks and no storage — this tab is the only one that can exist.
 */

export interface LockManagerLike {
  request(
    name: string,
    options: { steal?: boolean; signal?: AbortSignal; mode?: 'exclusive' | 'shared' },
    callback: (lock: unknown) => Promise<unknown> | unknown,
  ): Promise<unknown>;
}

export interface LeaseStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export interface Lease {
  id: string;
  /** Epoch ms after which the lease is up for grabs. */
  exp: number;
}

export interface LeaderOptions {
  name?: string;
  id?: string;
  locks?: LockManagerLike | null;
  storage?: LeaseStorage | null;
  /** Wall clock for leases (real time — never the debug clock). */
  now?: () => number;
  /** Monotonic clock for "leader for how long". */
  mono?: () => number;
  ttlMs?: number;
  heartbeatMs?: number;
  timers?: { setInterval: (fn: () => void, ms: number) => unknown; clearInterval: (h: unknown) => void };
}

export interface Leadership {
  readonly id: string;
  readonly mode: 'locks' | 'lease' | 'solo';
  isLeader(): boolean;
  /** Monotonic ms since this tab became leader, or -1 when not leader. */
  leaderFor(): number;
  onChange(fn: (leader: boolean) => void): () => void;
  /** Take leadership now (steal the lock / overwrite the lease). */
  claim(): void;
  /** Lease mode: re-check right away (e.g. on a `storage` event). */
  poke(): void;
  stop(): void;
}

export function parseLease(raw: string | null): Lease | null {
  if (!raw) return null;
  try {
    const v = JSON.parse(raw) as Partial<Lease>;
    return typeof v.id === 'string' && typeof v.exp === 'number' ? { id: v.id, exp: v.exp } : null;
  } catch {
    return null;
  }
}

/** Lease rule: take it if nobody holds it, it expired, or it's already ours. */
export function shouldClaimLease(cur: Lease | null, me: string, now: number): boolean {
  return !cur || cur.id === me || cur.exp <= now;
}

const randomId = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `t${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;

export function electLeader(opts: LeaderOptions = {}): Leadership {
  const name = opts.name ?? 'kettle:leader';
  const id = opts.id ?? randomId();
  const mono = opts.mono ?? (() => (typeof performance !== 'undefined' ? performance.now() : Date.now()));
  const now = opts.now ?? (() => Date.now());
  const timers = opts.timers ?? {
    setInterval: (fn: () => void, ms: number) => setInterval(fn, ms),
    clearInterval: (h: unknown) => clearInterval(h as ReturnType<typeof setInterval>),
  };
  const listeners = new Set<(leader: boolean) => void>();
  let leader = false;
  let since = -1;
  let stopped = false;

  const setLeader = (v: boolean) => {
    if (v === leader) return;
    leader = v;
    since = v ? mono() : -1;
    listeners.forEach((fn) => {
      try {
        fn(v);
      } catch (err) {
        console.error('[leader] listener threw', err);
      }
    });
  };

  const base = {
    id,
    isLeader: () => leader,
    leaderFor: () => (leader ? mono() - since : -1),
    onChange(fn: (leader: boolean) => void) {
      listeners.add(fn);
      return () => {
        listeners.delete(fn);
      };
    },
  };

  // ---------- Web Locks ----------
  if (opts.locks) {
    const locks = opts.locks;
    let token = 0;
    let queued: AbortController | null = null;
    let release: (() => void) | null = null;
    let lastClaim = -Infinity;

    const request = (steal: boolean) => {
      const my = ++token;
      const ac = steal || typeof AbortController === 'undefined' ? null : new AbortController();
      queued = ac;
      const options = steal ? { steal: true } : ac ? { signal: ac.signal } : {};
      const done = () => {
        if (my !== token) return; // superseded (we aborted it to steal, or stopped)
        const r = release;
        release = null;
        r?.();
        setLeader(false);
        if (!stopped) request(false); // stolen from us / released: queue up again
      };
      let p: Promise<unknown>;
      try {
        p = locks.request(name, options, () => {
          if (my !== token || stopped) return undefined; // stale grant: hand it straight back
          queued = null;
          setLeader(true);
          return new Promise<void>((resolve) => {
            release = resolve;
          });
        });
      } catch {
        setLeader(true); // Locks API present but unusable: behave as a single tab.
        return;
      }
      p.then(done, done);
    };

    request(false);
    return {
      ...base,
      mode: 'locks',
      claim() {
        if (leader || stopped) return;
        const t = mono();
        if (t - lastClaim < 1000) return;
        lastClaim = t;
        queued?.abort();
        request(true);
      },
      poke() {},
      stop() {
        if (stopped) return;
        stopped = true;
        token++;
        queued?.abort();
        const r = release;
        release = null;
        r?.();
        setLeader(false);
      },
    };
  }

  // ---------- localStorage lease ----------
  if (opts.storage) {
    const storage = opts.storage;
    const key = `${name}:lease`;
    const ttl = opts.ttlMs ?? 4000;
    const beatMs = opts.heartbeatMs ?? 1000;
    let heldLastBeat = false;
    const read = () => {
      try {
        return parseLease(storage.getItem(key));
      } catch {
        return null;
      }
    };
    const write = (l: Lease) => {
      try {
        storage.setItem(key, JSON.stringify(l));
      } catch {
        /* ignore */
      }
    };
    const beat = () => {
      if (stopped) return;
      const t = now();
      const cur = read();
      if (shouldClaimLease(cur, id, t)) write({ id, exp: t + ttl });
      const after = read();
      const mine = !!after && after.id === id && after.exp > t;
      // Two consecutive beats holding the lease = confirmed leader.
      setLeader(mine && heldLastBeat);
      heldLastBeat = mine;
    };
    beat();
    const handle = timers.setInterval(beat, beatMs);
    return {
      ...base,
      mode: 'lease',
      claim() {
        if (leader || stopped) return;
        write({ id, exp: now() + ttl });
        heldLastBeat = true;
      },
      poke: beat,
      stop() {
        if (stopped) return;
        stopped = true;
        timers.clearInterval(handle);
        if (read()?.id === id) {
          try {
            storage.removeItem(key);
          } catch {
            /* ignore */
          }
        }
        setLeader(false);
      },
    };
  }

  // ---------- solo ----------
  setLeader(true);
  return {
    ...base,
    mode: 'solo',
    claim() {},
    poke() {},
    stop() {
      stopped = true;
      setLeader(false);
    },
  };
}
