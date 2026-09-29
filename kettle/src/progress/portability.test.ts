import { beforeEach, describe, expect, it } from 'vitest';
import { addDays } from '@/lib/dates';
import { useSettings } from '@/state/settings';
import { canUndoImport, exportData, importData, previewImport, resetAllData, undoLastImport } from './portability';
import { migrateV1, useProgress } from './store';
import { brew, setNow, teaBreak } from './testkit';

const TODAY = '2026-09-28';

function recordSome() {
  const p = useProgress.getState();
  p.recordSession(brew(addDays(TODAY, -1), 9, 0, { intention: 'Essay', tag: 'study' }));
  p.recordSession(teaBreak(addDays(TODAY, -1), 9, 30));
  p.recordSession(brew(TODAY, 9, 0, { min: 50, tag: 'work' }));
  p.recordSession(brew(TODAY, 11, 0, { stopAt: 7 }));
}

beforeEach(() => {
  setNow(2026, 9, 28, 16, 0);
  undoLastImport(); // drop any undo left by an earlier test
  useProgress.getState().resetAll();
  useSettings.getState().reset();
  useSettings.getState().set({ onboarded: true, name: 'Robin', dailyGoalMin: 60 });
});

describe('export / import', () => {
  it('round-trips everything', () => {
    recordSome();
    const before = useProgress.getState();
    const snapshot = { sessions: before.sessions, ledger: before.ledger, leaves: before.leaves, badges: before.badges, quests: before.quests };
    const json = exportData();
    const doc = JSON.parse(json);
    expect(doc).toMatchObject({ app: 'kettle', kind: 'backup', schema: 2 });
    expect(doc.settings.name).toBe('Robin');

    resetAllData();
    expect(useProgress.getState().sessions).toHaveLength(0);
    expect(useSettings.getState().onboarded).toBe(false);

    const res = importData(json);
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.summary).toMatchObject({ sessions: 3, breaks: 1, days: 2, skipped: 0, settings: true, from: addDays(TODAY, -1), to: TODAY });
      expect(res.summary.leaves).toBe(snapshot.leaves);
    }
    const after = useProgress.getState();
    expect(after.sessions).toEqual(snapshot.sessions);
    expect(after.ledger).toEqual(snapshot.ledger);
    expect(after.leaves).toBe(snapshot.leaves);
    expect(after.badges).toEqual(snapshot.badges);
    expect(after.quests).toEqual(snapshot.quests);
    expect(useSettings.getState()).toMatchObject({ name: 'Robin', dailyGoalMin: 60, onboarded: true });
  });

  it('preview does not change anything', () => {
    recordSome();
    const json = exportData();
    useProgress.getState().resetAll();
    const res = previewImport(json);
    expect(res.ok).toBe(true);
    expect(useProgress.getState().sessions).toHaveLength(0);
  });

  it('friendly errors for bad files', () => {
    const err = (json: string) => {
      const r = importData(json);
      return r.ok ? '' : r.error;
    };
    expect(err('')).toMatch(/empty/);
    expect(err('{nope')).toMatch(/couldn’t read/);
    expect(err('{"hello":1}')).toMatch(/doesn’t look like a Kettle backup/);
    expect(err('{"app":"kettle","schema":99,"progress":{}}')).toMatch(/newer version/);
    expect(err('{"app":"kettle","schema":2}')).toMatch(/missing/);
    expect(err('{"app":"kettle","schema":2,"progress":{"sessions":[{"id":1},{"bad":true}]}}')).toMatch(/damaged/);
  });

  it('drops damaged records, rebuilds a missing ledger, and never throws', () => {
    const good = brew(TODAY, 9, 0);
    const json = JSON.stringify({ app: 'kettle', schema: 2, progress: { sessions: [good, { id: 'x', phase: 'focus' }, null] } });
    const res = importData(json, { settings: false });
    expect(res.ok).toBe(true);
    if (res.ok) expect(res.summary.skipped).toBe(2);
    const s = useProgress.getState();
    expect(s.sessions.map((x) => x.id)).toEqual([good.id]);
    expect(s.leaves).toBeGreaterThanOrEqual(25 + 5 + 3);
    expect(s.ledger.reduce((a, e) => a + e.amount, 0)).toBe(s.leaves);
  });

  it('merge adds new sessions without double counting', () => {
    recordSome();
    const json = exportData();
    const leaves = useProgress.getState().leaves;
    const res = importData(json, { mode: 'merge' });
    expect(res.ok).toBe(true);
    expect(useProgress.getState().sessions).toHaveLength(4);
    expect(useProgress.getState().leaves).toBe(leaves);
  });
});

describe('safe restore: compare, add, replace, undo', () => {
  function otherDevice(): string {
    // A backup made elsewhere: two brews this device has never seen, different settings.
    const doc = JSON.parse(exportData());
    doc.progress.sessions = [brew(addDays(TODAY, -3), 8, 0, { intention: 'Thesis' }), brew(addDays(TODAY, -2), 8, 0)];
    doc.progress.ledger = [];
    doc.settings = { ...doc.settings, name: 'Other', dailyGoalMin: 15 };
    return JSON.stringify(doc);
  }

  it('the preview compares this device with the backup and changes nothing', () => {
    recordSome();
    const before = JSON.stringify(useProgress.getState().sessions);
    const json = otherDevice();
    const res = previewImport(json, { mode: 'merge' });
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.summary).toMatchObject({ mode: 'merge', here: { sessions: 3 }, sessions: 2, added: 2, duplicates: 0, settings: false });
    expect(res.summary.after.sessions).toBe(5);
    expect(res.summary.leaves, 'an empty ledger is rebuilt from the brews').toBeGreaterThan(0);
    const rep = previewImport(json, { mode: 'replace' });
    expect(rep.ok && rep.summary).toMatchObject({ mode: 'replace', here: { sessions: 3 }, after: { sessions: 2 }, settings: true });
    expect(JSON.stringify(useProgress.getState().sessions)).toBe(before);
    expect(canUndoImport()).toBe(false);
  });

  it('adding keeps everything here and your settings; adding the same file again adds nothing', () => {
    recordSome();
    const json = otherDevice();
    const res = importData(json, { mode: 'merge' });
    expect(res.ok && res.summary.added).toBe(2);
    const s = useProgress.getState();
    expect(s.sessions.filter((x) => x.phase === 'focus')).toHaveLength(5);
    expect(s.ledger.reduce((a, e) => a + e.amount, 0)).toBe(s.leaves);
    expect(useSettings.getState()).toMatchObject({ name: 'Robin', dailyGoalMin: 60 });
    const leaves = s.leaves;

    const again = previewImport(json, { mode: 'merge' });
    expect(again.ok && again.summary).toMatchObject({ added: 0, duplicates: 2 });
    importData(json, { mode: 'merge' });
    expect(useProgress.getState().sessions.filter((x) => x.phase === 'focus')).toHaveLength(5);
    expect(useProgress.getState().leaves).toBe(leaves);
  });

  it('replacing swaps progress and settings, and undo puts back exactly what was here', () => {
    recordSome();
    useProgress.getState().editSession(useProgress.getState().sessions[0].id, { outcome: 'done' });
    const was = { sessions: useProgress.getState().sessions, leaves: useProgress.getState().leaves, ledger: useProgress.getState().ledger };
    const res = importData(otherDevice(), { mode: 'replace' });
    expect(res.ok).toBe(true);
    expect(useProgress.getState().sessions.map((x) => x.intention)).toContain('Thesis');
    expect(useSettings.getState()).toMatchObject({ name: 'Other', dailyGoalMin: 15 });

    expect(undoLastImport()).toBe(true);
    expect(useProgress.getState().sessions).toEqual(was.sessions);
    expect(useProgress.getState().ledger).toEqual(was.ledger);
    expect(useProgress.getState().leaves).toBe(was.leaves);
    expect(useSettings.getState()).toMatchObject({ name: 'Robin', dailyGoalMin: 60 });
    expect(undoLastImport()).toBe(false);
  });

  it('a failed import changes nothing and leaves nothing to undo', () => {
    recordSome();
    const before = JSON.stringify(useProgress.getState().sessions);
    const json = exportData();
    for (const bad of [json.slice(0, json.length / 2), json.replace('"kettle"', '"other-app"'), '\u0000\u0001binary', JSON.stringify({ app: 'kettle', schema: 3, progress: {} })]) {
      const r = importData(bad, { mode: 'replace' });
      expect(r.ok).toBe(false);
    }
    expect(JSON.stringify(useProgress.getState().sessions)).toBe(before);
    expect(canUndoImport()).toBe(false);
  });

  it('round-trips the intention outcome', () => {
    recordSome();
    const id = useProgress.getState().sessions.find((x) => x.intention === 'Essay')!.id;
    useProgress.getState().editSession(id, { outcome: 'carried' });
    const json = exportData();
    resetAllData();
    importData(json);
    expect(useProgress.getState().sessions.find((x) => x.id === id)?.outcome).toBe('carried');
  });
});

describe('migration', () => {
  it('v1 → v2 replays sessions and never loses leaves', () => {
    const s1 = brew(addDays(TODAY, -1), 9, 0);
    const s2 = brew(TODAY, 9, 0);
    const v2 = migrateV1({ sessions: [s1, s2], leaves: 500, cozies: 0, lastReport: { junk: true } });
    expect(v2.sessions).toHaveLength(2);
    expect(v2.leaves).toBe(500);
    expect(v2.ledger.some((e) => e.kind === 'carryOver')).toBe(true);
    expect(v2.ledger.reduce((a, e) => a + e.amount, 0)).toBe(500);
    expect(v2.lastReport).toBeNull();
  });
});
