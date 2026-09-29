import { beforeEach, describe, expect, it } from 'vitest';
import { clock } from '@/lib/clock';
import { applyRecord, emptyData, type EngineContext } from './engine';
import { hasExtra, mergeProgress, reconcile } from './merge';
import { brew, setNow } from './testkit';
import type { ProgressData, SessionRecord } from './types';

const TODAY = '2026-09-28';
const ctx = (): EngineContext => ({ now: clock.now(), goalMin: 30, weekStartsOn: 1 });

function withRecords(start: ProgressData, recs: SessionRecord[]): ProgressData {
  let d = start;
  for (const r of recs) d = applyRecord(d, r, ctx()).data;
  return d;
}

beforeEach(() => setNow(2026, 9, 28, 16, 0));

describe('mergeProgress / reconcile — two tabs, one generation', () => {
  const base = () => ({ ...withRecords(emptyData(), [brew(TODAY, 9, 0), brew(TODAY, 10, 0)]), epoch: 'e1' });

  it('equal revisions with different sessions merge instead of one silently winning', () => {
    const shared = base();
    const a = { ...withRecords(shared, [brew(TODAY, 11, 0)]), epoch: 'e1' };
    const b = { ...withRecords(shared, [brew(TODAY, 12, 0)]), epoch: 'e1' };
    expect(a.rev).toBe(b.rev); // the old rev-only rule ignored this write entirely
    const d = reconcile(a, b, TODAY);
    expect(d.kind).toBe('merge');
    if (d.kind === 'keep') return;
    expect(d.data.sessions.map((s) => s.id).sort()).toEqual([...new Set([...a.sessions, ...b.sessions].map((s) => s.id))].sort());
    expect(d.data.leaves).toBe(d.data.ledger.reduce((x, e) => x + e.amount, 0));
    expect(d.data.rev).toBe(a.rev + 1);
    // Converges: each tab adopts the merge; once both hold it there is nothing left to do.
    expect(reconcile(a, d.data, TODAY).kind).toBe('adopt');
    expect(reconcile(b, d.data, TODAY).kind).toBe('adopt');
    expect(reconcile(d.data, d.data, TODAY).kind).toBe('keep');
  });

  it('adopts a newer write that already contains everything local has', () => {
    const a = base();
    const b = { ...withRecords(a, [brew(TODAY, 11, 0)]), epoch: 'e1' };
    const d = reconcile(a, b, TODAY);
    expect(d.kind).toBe('adopt');
  });

  it('an older stored write that lacks our brew gets our data written back (never memory-only)', () => {
    const a = base();
    const b = { ...withRecords(a, [brew(TODAY, 11, 0)]), epoch: 'e1' };
    const d = reconcile(b, a, TODAY);
    expect(d.kind).toBe('merge');
    if (d.kind !== 'keep') expect(d.data.sessions.map((x) => x.id)).toEqual(b.sessions.map((x) => x.id));
    expect(reconcile(b, b, TODAY).kind).toBe('keep');
  });

  it('a newer write that is missing local sessions is merged, not adopted', () => {
    const shared = base();
    const a = { ...withRecords(shared, [brew(TODAY, 11, 0)]), epoch: 'e1' };
    const b = { ...shared, rev: a.rev + 5 };
    const d = reconcile(a, b, TODAY);
    expect(d.kind).toBe('merge');
    if (d.kind !== 'keep') expect(d.data.sessions).toHaveLength(3);
  });

  it('a deletion on either side wins over the other side still holding the session', () => {
    const a = base();
    const victim = a.sessions[0].id;
    const b: ProgressData = { ...a, sessions: a.sessions.slice(1), tombstones: [victim], rev: a.rev + 1 };
    const withExtra = { ...withRecords(a, [brew(TODAY, 13, 0)]), epoch: 'e1' };
    const merged = mergeProgress(withExtra, b, TODAY);
    expect(merged.sessions.some((s) => s.id === victim)).toBe(false);
    expect(merged.tombstones).toContain(victim);
    expect(merged.sessions).toHaveLength(2);
  });

  it('keeps the highest badge tier and earliest unlock time', () => {
    const a: ProgressData = { ...base(), badges: { marathon: { tier: 2, unlockedAt: [100, 300] } } };
    const b: ProgressData = { ...base(), badges: { marathon: { tier: 1, unlockedAt: [50] } }, rev: a.rev };
    const m = mergeProgress(a, b, TODAY);
    expect(m.badges.marathon).toEqual({ tier: 2, unlockedAt: [50, 300] });
    expect(hasExtra(a, b)).toBe(true);
  });
});

describe('per-record latest event wins (undo, edits, races)', () => {
  const two = () => ({ ...withRecords(emptyData(), [brew(TODAY, 9, 0), brew(TODAY, 10, 0)]), epoch: 'e1' });

  it('undo of a delete survives a second tab that saw the delete', () => {
    const a = two();
    const id = a.sessions[0].id;
    // Tab A deletes; tab B adopts that.
    const deleted: ProgressData = { ...a, sessions: a.sessions.slice(1), tombstones: [id], deletedAt: { [id]: 1000 + a.sessions[0].endedAt }, rev: a.rev + 1 };
    // Tab A undoes: the record comes back with a newer version, the tombstone goes.
    const restored: ProgressData = { ...a, sessions: [{ ...a.sessions[0], v: deleted.deletedAt![id] + 1 }, ...a.sessions.slice(1)], tombstones: [], deletedAt: {}, rev: a.rev + 2 };
    // Tab B (still holding the tombstone) hears about it: it must adopt, not re-delete.
    const d = reconcile(deleted, restored, TODAY);
    expect(d.kind).toBe('adopt');
    // Even a forced merge keeps the undo.
    const m = mergeProgress(deleted, restored, TODAY);
    expect(m.sessions.map((x) => x.id)).toContain(id);
    expect(m.tombstones).not.toContain(id);
  });

  it('a delete after an edit still wins; tombstones without a time are final', () => {
    const a = two();
    const id = a.sessions[0].id;
    const edited = { ...a, sessions: [{ ...a.sessions[0], intention: 'Edited', v: a.sessions[0].endedAt + 10 }, a.sessions[1]] };
    const deleted: ProgressData = { ...a, sessions: [a.sessions[1]], tombstones: [id], deletedAt: { [id]: a.sessions[0].endedAt + 20 } };
    expect(mergeProgress(edited, deleted, TODAY).sessions.map((x) => x.id)).not.toContain(id);
    const legacy: ProgressData = { ...a, sessions: [a.sessions[1]], tombstones: [id] };
    const revived = { ...a, sessions: [{ ...a.sessions[0], v: Date.now() + 1e9 }, a.sessions[1]] };
    expect(mergeProgress(revived, legacy, TODAY).sessions.map((x) => x.id)).not.toContain(id);
  });

  it('edits in two tabs: the later edit wins in both directions, and each tab keeps its other changes', () => {
    const base = two();
    const [x, y] = base.sessions;
    const a = { ...base, sessions: [{ ...x, intention: 'A edit', v: x.endedAt + 5 }, y], rev: base.rev + 1 };
    const b = { ...base, sessions: [{ ...x, intention: 'B edit (later)', v: x.endedAt + 9 }, { ...y, tag: 'work' as const, v: y.endedAt + 1 }], rev: base.rev + 1 };
    for (const [l, r] of [[a, b], [b, a]] as const) {
      const m = mergeProgress(l, r, TODAY);
      expect(m.sessions.find((s) => s.id === x.id)?.intention).toBe('B edit (later)');
      expect(m.sessions.find((s) => s.id === y.id)?.tag).toBe('work');
    }
    expect(hasExtra(b, a)).toBe(true);
    expect(hasExtra(a, b)).toBe(false);
  });

  it('a tab holding a record storage lacks writes it back, even at an equal or lower rev', () => {
    const base = two();
    const mine = { ...withRecords(base, [brew(TODAY, 11, 0)]), epoch: 'e1' };
    const theirs = { ...base, rev: mine.rev }; // overwrote storage at the same rev without our brew
    const d = reconcile(mine, theirs, TODAY);
    expect(d.kind).toBe('merge');
    if (d.kind !== 'keep') {
      expect(d.data.sessions).toHaveLength(3);
      expect(d.data.rev).toBeGreaterThan(mine.rev);
      // …and the other tab then simply adopts the merge.
      expect(reconcile(theirs, d.data, TODAY).kind).toBe('adopt');
    }
  });
});

describe('reconcile — generations (reset / replace import)', () => {
  it('a newer generation wins outright; a stale tab cannot resurrect wiped data', () => {
    const old = { ...withRecords(emptyData(), [brew(TODAY, 9, 0), brew(TODAY, 10, 0)]), epoch: 'e1' };
    const reset: ProgressData = { ...emptyData(), rev: old.rev + 1, epoch: 'e2' };
    const d = reconcile(old, reset, TODAY);
    expect(d.kind).toBe('adopt');
    if (d.kind !== 'keep') expect(d.data.sessions).toHaveLength(0);
  });

  it('an older generation in storage is overwritten by ours, whatever the revs', () => {
    const old = { ...withRecords(emptyData(), [brew(TODAY, 9, 0)]), epoch: 'e1' };
    const fresh: ProgressData = { ...emptyData(), rev: 1, epoch: 'e2' };
    const d = reconcile(fresh, { ...old, rev: 50 }, TODAY);
    expect(d.kind).toBe('merge');
    if (d.kind !== 'keep') {
      expect(d.data.sessions).toHaveLength(0);
      expect(d.data.rev).toBe(51);
    }
  });

  it('a reset and a stale write at the same rev: the reset wins (epochs are ordered by creation time)', () => {
    const t = Date.UTC(2026, 8, 28).toString(36);
    const later = (Date.UTC(2026, 8, 28) + 5000).toString(36);
    const stale = { ...withRecords(emptyData(), [brew(TODAY, 9, 0), brew(TODAY, 10, 0)]), epoch: `e_${t}abcd1234` };
    const reset: ProgressData = { ...emptyData(), rev: stale.rev, epoch: `e_${later}ffff0000` };
    expect(reconcile(stale, reset, TODAY).kind).toBe('adopt');
    expect(reconcile(reset, stale, TODAY).kind).toBe('merge');
  });

  it('nothing stored → keep', () => {
    expect(reconcile(emptyData(), null, TODAY).kind).toBe('keep');
  });
});
