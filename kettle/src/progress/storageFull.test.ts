/**
 * A restore that can't be saved (storage full) must not report success or half-apply: it is refused and
 * this device keeps exactly what it had, in memory and in storage.
 */
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { addDays } from '@/lib/dates';
import { onStorageWriteError } from '@/lib/storage';
import { useSettings } from '@/state/settings';
import { canUndoImport, exportData, importData, undoLastImport } from './portability';
import { useProgress, PROGRESS_KEY } from './store';
import { brew, setNow } from './testkit';

const TODAY = '2026-09-28';

class FillableStorage {
  map = new Map<string, string>();
  full = false;
  /** Finer control: a write this returns true for fails like a full quota. */
  refuse: ((k: string, v: string) => boolean) | null = null;
  getItem(k: string) {
    return this.map.has(k) ? this.map.get(k)! : null;
  }
  setItem(k: string, v: string) {
    if (this.full || this.refuse?.(k, String(v))) throw Object.assign(new Error('The quota has been exceeded.'), { name: 'QuotaExceededError', code: 22 });
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
  storage.refuse = null;
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

  it('only part of it fits (progress lands, settings don’t) while this tab holds an unsaved brew: storage is put back exactly', () => {
    // A brew this tab couldn't save (storage full at the time): memory has it, storage doesn't.
    storage.refuse = (k, v) => k === PROGRESS_KEY && v.includes('Unsaved brew');
    useProgress.getState().recordSession(brew(TODAY, 13, 0, { intention: 'Unsaved brew' }));
    const memBefore = JSON.stringify(useProgress.getState().sessions);
    expect(memBefore).toContain('Unsaved brew');
    const storedBefore = storage.getItem(PROGRESS_KEY);
    const settingsBefore = storage.getItem('kettle:settings');
    expect(storedBefore).not.toContain('Unsaved brew');
    // A smaller backup replaces progress (that write fits); its settings don't fit; nor does this tab's own
    // copy (with the unsaved brew) when it is put back. Only the earlier saved copy fits again.
    const doc = JSON.parse(exportData());
    doc.progress.sessions = doc.progress.sessions.filter((r: { intention: string }) => r.intention !== 'Unsaved brew').slice(0, 1);
    doc.progress.ledger = [];
    doc.settings = { ...doc.settings, name: 'Someone else' };
    storage.refuse = (k, v) => (k === PROGRESS_KEY && v.includes('Unsaved brew')) || (k === 'kettle:settings' && v.includes('Someone else'));
    const res = importData(JSON.stringify(doc), { mode: 'replace', settings: true });
    expect(res).toEqual({ ok: false, error: expect.stringMatching(/storage is full.*[Nn]othing was changed/) });
    expect(JSON.stringify(useProgress.getState().sessions)).toBe(memBefore);
    expect(useSettings.getState()).toMatchObject({ name: 'Robin', dailyGoalMin: 60 });
    expect(storage.getItem(PROGRESS_KEY)).toBe(storedBefore);
    expect(storage.getItem('kettle:settings')).toBe(settingsBefore);
    expect(canUndoImport()).toBe(false);
  });

  it('a refused restore does not raise the general “couldn’t save your latest changes” warning (it says why itself)', () => {
    const seen: string[] = [];
    const off = onStorageWriteError((e) => seen.push(e.key));
    storage.full = true;
    expect(importData(biggerBackup(), { mode: 'merge', settings: true }).ok).toBe(false);
    off();
    expect(seen).toEqual([]);
  });

  it('with room to save, the same restore goes through (and is saved)', () => {
    const res = importData(biggerBackup(), { mode: 'merge' });
    expect(res.ok).toBe(true);
    expect(useProgress.getState().sessions.some((s) => s.intention === 'From the backup')).toBe(true);
    expect(storage.getItem(PROGRESS_KEY)).toContain('From the backup');
  });
});
