/**
 * Safe localStorage wrapper (private mode / quota / disabled storage never throw).
 * All persisted keys are namespaced `kettle:`.
 *
 * A write that fails (storage full or blocked) is still swallowed, but not silently: it is counted,
 * remembered per key and reported to `onStorageWriteError` listeners, so the app can tell the person and
 * never mistake older saved data for its own newer state (see docs/areas/timer.md, "Storage full").
 */
export const STORAGE_PREFIX = 'kettle:';

export interface StorageWriteError {
  key: string;
  /** The browser said its storage is full (rather than blocked or broken). */
  quota: boolean;
}

let failures = 0;
const failedKeys = new Set<string>();
const writeErrorListeners = new Set<(e: StorageWriteError) => void>();

/** "Storage is full" across browsers (the standard name, legacy codes, old Firefox's name). */
function isQuotaError(err: unknown): boolean {
  const e = err as { name?: unknown; code?: unknown } | null;
  return !!e && (e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED' || e.code === 22 || e.code === 1014);
}

/** Inside `checkWrites`: failures are counted, but the caller reports them (listeners are not told). */
let checking = 0;
let checkedQuota = false;

function reportWriteError(key: string, err: unknown): void {
  // No storage API at all (unit tests, server rendering) is not a failed save.
  if (err instanceof ReferenceError) return;
  failures++;
  failedKeys.add(key);
  const e: StorageWriteError = { key, quota: isQuotaError(err) };
  if (checking > 0) {
    checkedQuota ||= e.quota;
    return;
  }
  writeErrorListeners.forEach((fn) => {
    try {
      fn(e);
    } catch {
      /* a listener must never break saving */
    }
  });
}

/** How many writes have failed since this page loaded. */
export function storageWriteFailures(): number {
  return failures;
}

/** Did the latest write of `key` fail? Then storage holds an older value than this tab does. */
export function lastWriteFailed(key: string): boolean {
  return failedKeys.has(key);
}

/**
 * Run `fn` and say whether any write it made failed (and whether storage was full). For an all-or-nothing
 * change that handles its own failure (e.g. restoring a backup): its failed writes are not reported to
 * `onStorageWriteError` listeners, because the caller undoes the change and tells the person itself.
 */
export function checkWrites(fn: () => void): { failed: boolean; quota: boolean } {
  const before = failures;
  const outerQuota = checkedQuota;
  checkedQuota = false;
  checking++;
  try {
    fn();
    return { failed: failures > before, quota: checkedQuota };
  } finally {
    checking--;
    checkedQuota = outerQuota || checkedQuota;
  }
}

/** Called on every failed write. Returns an unsubscribe function. */
export function onStorageWriteError(fn: (e: StorageWriteError) => void): () => void {
  writeErrorListeners.add(fn);
  return () => {
    writeErrorListeners.delete(fn);
  };
}

export const safeStorage = {
  getItem(key: string): string | null {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  setItem(key: string, value: string): void {
    try {
      localStorage.setItem(key, value);
      failedKeys.delete(key);
    } catch (err) {
      /* quota / privacy errors never throw, but they are reported */
      reportWriteError(key, err);
    }
  },
  removeItem(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch {
      /* ignore */
    }
  },
};
