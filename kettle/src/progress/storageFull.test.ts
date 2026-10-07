/**
 * A restore that can't be saved (storage full) must not report success or half-apply: it is refused and
 * this device keeps exactly what it had, in memory and in storage.
 */
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { addDays } from '@/lib/dates';
import { useSettings } from '@/state/settings';
import { canUndoImport, exportData, importData, undoLastImport } from './portability';
import { useProgress, PROGRESS_KEY } from './store';
import { brew, setNow } from './testkit';

const TODAY = '2026-09-28';

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

beforeAll(() => {
  (globalThis as unknown as { localStorage: FillableStorage }).localStorage = storage;
});

beforeEach(() => {
  setNow(2026, 9, 28, 16, 0);
  storage.full = false;
  storage.clear();
  undoLastImport();
  useProgress.getState().resetAll();
  useSettings.getState().reset();
  useSettings.getState().set({ onboarded: true, name: 'Robin', dailyGoalMin: 60 });
  const p = useProgress.getState();
  p.recordSession(brew(addDays(TODAY, -1), 9, 0, { intention: 'Essay' }));
  p.recordSession(brew(TODAY, 9, 0));
});

/** The same backup plus one brew this device doesn't have. */
function biggerBackup(): string {
  const doc = JSON.parse(exportData());
  doc.progress.sessions.push(brew(TODAY, 11, 0, { intention: 'From the backup' }));
  doc.progress.ledger = [];
  doc.settings = { ...doc.settings, name: 'Someone else', dailyGoalMin: 30 };
  return JSON.stringify(doc);
}

describe('restoring while storage is full', () => {
  for (const mode of ['merge', 'replace'] as const) {
    it(`${mode}: refused with a plain reason; memory, storage and settings unchanged; nothing to undo`, () => {
      const json = biggerBackup();
      const memBefore = JSON.stringify(useProgress.getState().sessions);
      const storedBefore = storage.getItem(PROGRESS_KEY);
      const settingsBefore = storage.getItem('kettle:settings');
      storage.full = true;
      const res = importData(json, { mode, settings: true });
      expect(res).toEqual({ ok: false, error: expect.stringMatching(/storage is full.*[Nn]othing was changed/) });
      expect(JSON.stringify(useProgress.getState().sessions)).toBe(memBefore);
      expect(useSettings.getState()).toMatchObject({ name: 'Robin', dailyGoalMin: 60 });
      expect(storage.getItem(PROGRESS_KEY)).toBe(storedBefore);
      expect(storage.getItem('kettle:settings')).toBe(settingsBefore);
      expect(canUndoImport()).toBe(false);
    });
  }

  it('with room to save, the same restore goes through (and is saved)', () => {
    const res = importData(biggerBackup(), { mode: 'merge' });
    expect(res.ok).toBe(true);
    expect(useProgress.getState().sessions.some((s) => s.intention === 'From the backup')).toBe(true);
    expect(storage.getItem(PROGRESS_KEY)).toContain('From the backup');
  });
});
