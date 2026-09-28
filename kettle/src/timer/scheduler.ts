/**
 * One-shot timeouts that keep firing on time in background tabs.
 * Worker-backed when possible, main-thread `setTimeout` otherwise (and in tests).
 * OWNER: timer area.
 */
export interface Scheduler {
  readonly kind: 'worker' | 'main';
  /** Run `fn` after `ms`. Returns a cancel function. */
  after(ms: number, fn: () => void): () => void;
  dispose(): void;
}

export function createMainScheduler(): Scheduler {
  const handles = new Set<ReturnType<typeof setTimeout>>();
  return {
    kind: 'main',
    after(ms, fn) {
      const h = setTimeout(() => {
        handles.delete(h);
        fn();
      }, Math.max(0, ms));
      handles.add(h);
      return () => {
        clearTimeout(h);
        handles.delete(h);
      };
    },
    dispose() {
      handles.forEach((h) => clearTimeout(h));
      handles.clear();
    },
  };
}

/**
 * Worker-backed scheduler. If the worker can't be created or dies, pending and
 * future timeouts transparently move to the main thread.
 */
export function createScheduler(): Scheduler {
  if (typeof window === 'undefined' || typeof Worker === 'undefined') return createMainScheduler();
  let worker: Worker | null = null;
  try {
    worker = new Worker(new URL('./tick.worker.ts', import.meta.url), { type: 'module', name: 'kettle-tick' });
  } catch {
    return createMainScheduler();
  }

  const fallback = createMainScheduler();
  const pending = new Map<number, { fn: () => void; due: number; cancelFallback?: () => void }>();
  let nextId = 1;
  let broken = false;
  let kind: 'worker' | 'main' = 'worker';

  const breakDown = () => {
    if (broken) return;
    broken = true;
    kind = 'main';
    try {
      worker?.terminate();
    } catch {
      /* ignore */
    }
    worker = null;
    // Re-arm everything that was waiting on the worker.
    for (const [id, p] of pending) {
      p.cancelFallback = fallback.after(p.due - performance.now(), () => {
        pending.delete(id);
        p.fn();
      });
    }
  };

  worker.onmessage = (e: MessageEvent<{ t: string; id?: number }>) => {
    if (e.data?.t !== 'fire' || e.data.id == null) return;
    const p = pending.get(e.data.id);
    if (!p) return;
    pending.delete(e.data.id);
    p.fn();
  };
  worker.onerror = (e) => {
    e.preventDefault?.();
    breakDown();
  };
  worker.onmessageerror = () => breakDown();

  return {
    get kind() {
      return kind;
    },
    after(ms, fn) {
      const id = nextId++;
      const entry: { fn: () => void; due: number; cancelFallback?: () => void } = { fn, due: performance.now() + ms };
      pending.set(id, entry);
      if (broken || !worker) {
        entry.cancelFallback = fallback.after(ms, () => {
          pending.delete(id);
          fn();
        });
      } else {
        try {
          worker.postMessage({ t: 'set', id, ms: Math.max(0, ms) });
        } catch {
          breakDown();
        }
      }
      return () => {
        const p = pending.get(id);
        pending.delete(id);
        p?.cancelFallback?.();
        if (!broken && worker) {
          try {
            worker.postMessage({ t: 'clear', id });
          } catch {
            /* ignore */
          }
        }
      };
    },
    dispose() {
      pending.clear();
      fallback.dispose();
      try {
        worker?.terminate();
      } catch {
        /* ignore */
      }
      worker = null;
    },
  };
}
