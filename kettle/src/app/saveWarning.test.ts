/**
 * The storage-full warning is a state, not a moment: it comes with the first failed save, stays while any failed key
 * still holds an older value than this tab (no timer takes it away), and goes once every one of them saved again.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { onStorageWriteError, safeStorage } from '@/lib/storage';
import { raiseSaveWarning, saveWarningActive, saveWarningText, useSaveWarning } from './saveWarning';

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
}

describe('storage-full warning state', () => {
  let store: FillableStorage;
  let off: () => void;
  beforeEach(() => {
    vi.useFakeTimers();
    store = new FillableStorage();
    vi.stubGlobal('localStorage', store);
    off = onStorageWriteError(raiseSaveWarning);
  });
  afterEach(() => {
    off();
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it('comes with the first failed save, stays while saving fails, and goes once every failed key is saved again', () => {
    expect(saveWarningActive()).toBe(false);
    store.full = true;
    safeStorage.setItem('kettle:progress', 'a');
    safeStorage.setItem('kettle:timer', 'b');
    expect(useSaveWarning.getState()).toMatchObject({ failing: true, quota: true });
    const episode = useSaveWarning.getState().episode;

    // Minutes pass with storage still full: nothing takes it away (no 12 s timeout, no hold).
    vi.advanceTimersByTime(10 * 60_000);
    expect(saveWarningActive()).toBe(true);

    // Room again: one key saves, the other is still older in storage than in this tab → still on.
    store.full = false;
    safeStorage.setItem('kettle:progress', 'a2');
    vi.advanceTimersByTime(5_000);
    expect(saveWarningActive()).toBe(true);

    // Both saved: off.
    safeStorage.setItem('kettle:timer', 'b2');
    vi.advanceTimersByTime(5_000);
    expect(saveWarningActive()).toBe(false);

    // A later failure is a new episode (announced again, at most once a minute).
    store.full = true;
    safeStorage.setItem('kettle:settings', 'c');
    expect(useSaveWarning.getState()).toMatchObject({ failing: true, episode: episode + 1 });
    store.full = false;
    safeStorage.setItem('kettle:settings', 'c2');
    vi.advanceTimersByTime(5_000);
    expect(saveWarningActive()).toBe(false);
  });

  it('says what happened, and never that anything was saved', () => {
    for (const quota of [true, false]) {
      const { title, body } = saveWarningText(quota);
      expect(`${title} ${body}`).not.toMatch(/\bsaved\b/i);
      expect(body).toMatch(/Save a backup to keep them\./);
    }
    expect(saveWarningText(true).title).toMatch(/storage is full/);
  });
});
