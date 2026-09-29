/** Done / Carry forward: the record, the next brew's intention, and what survives sync/validation. */
import { beforeEach, describe, expect, it } from 'vitest';
import { useProgress } from '@/progress/store';
import { emptyData } from '@/progress/engine';
import { coerceSession } from '@/progress/validate';
import { mergeProgress } from '@/progress/merge';
import { brew, setNow } from '@/progress/testkit';
import { INITIAL_TIMER, useTimer } from '@/timer/store';
import { carriedFrom, setIntentionOutcome } from './intention';

const TODAY = '2026-09-28';
const rec = (id: string) => useProgress.getState().sessions.find((s) => s.id === id)!;

beforeEach(() => {
  setNow(2026, 9, 28, 16, 0);
  useProgress.setState({ ...emptyData(), epoch: 'e1' });
  useTimer.setState({ ...INITIAL_TIMER });
});

describe('setIntentionOutcome', () => {
  it('Done marks the record and clears the next brew; Carry forward restores it', () => {
    const r = brew(TODAY, 9, 0, { intention: 'Chapter 3 notes', tag: 'study' });
    useProgress.setState({ sessions: [r] });
    useTimer.getState().setIntention('Chapter 3 notes', 'study');

    setIntentionOutcome(r, 'done');
    expect(rec(r.id).outcome).toBe('done');
    expect(useTimer.getState().intention).toBe('');

    setIntentionOutcome(r, 'carried');
    expect(rec(r.id).outcome).toBe('carried');
    expect(useTimer.getState().intention).toBe('Chapter 3 notes');
    expect(useTimer.getState().tag).toBe('study');
  });

  it('never overwrites words already typed for the next brew', () => {
    const r = brew(TODAY, 9, 0, { intention: 'Chapter 3 notes' });
    useProgress.setState({ sessions: [r] });
    useTimer.getState().setIntention('Email Sam');
    setIntentionOutcome(r, 'done');
    expect(useTimer.getState().intention).toBe('Email Sam');
    setIntentionOutcome(r, 'carried');
    expect(useTimer.getState().intention).toBe('Email Sam');
    expect(rec(r.id).outcome).toBe('carried');
  });

  it('does nothing for a brew without an intention', () => {
    const r = brew(TODAY, 9, 0, { intention: '' });
    useProgress.setState({ sessions: [r] });
    setIntentionOutcome(r, 'done');
    expect(rec(r.id).outcome).toBeUndefined();
  });
});

describe('the outcome on the record', () => {
  it('editing the words clears a stale outcome; clearing with null works', () => {
    const r = { ...brew(TODAY, 9, 0, { intention: 'Draft' }), outcome: 'done' as const };
    useProgress.setState({ sessions: [r] });
    useProgress.getState().editSession(r.id, { tag: 'work' });
    expect(rec(r.id).outcome).toBe('done');
    useProgress.getState().editSession(r.id, { intention: 'Draft v2' });
    expect(rec(r.id).outcome).toBeUndefined();
    useProgress.getState().editSession(r.id, { outcome: 'carried' });
    useProgress.getState().editSession(r.id, { outcome: null });
    expect(rec(r.id)).not.toHaveProperty('outcome');
  });

  it('survives validation (backup / storage) and rejects junk', () => {
    const r = brew(TODAY, 9, 0, { intention: 'Draft' });
    expect(coerceSession({ ...r, outcome: 'done' }, Date.now() + 1e12)?.outcome).toBe('done');
    expect(coerceSession({ ...r, outcome: 'lol' }, Date.now() + 1e12)).not.toHaveProperty('outcome');
  });

  it('two tabs: the newer mark wins in a merge', () => {
    const base = { ...emptyData(), sessions: [brew(TODAY, 9, 0, { intention: 'Draft' })], epoch: 'e1' };
    const id = base.sessions[0].id;
    const a = { ...base, sessions: [{ ...base.sessions[0], outcome: 'done' as const }], rev: 5 };
    const b = { ...base, sessions: [{ ...base.sessions[0], outcome: 'carried' as const }], rev: 6 };
    expect(mergeProgress(a, b, TODAY).sessions.find((s) => s.id === id)?.outcome).toBe('carried');
  });
});

describe('carriedFrom', () => {
  it('matches only the latest focus session, and not once it is done', () => {
    const older = brew(TODAY, 8, 0, { intention: 'Old thing' });
    const last = brew(TODAY, 9, 0, { intention: 'Chapter 3 notes' });
    const tea = { ...brew(TODAY, 9, 30), phase: 'shortBreak' as const, intention: '' };
    expect(carriedFrom([older, last, tea], ' Chapter 3 notes ')?.id).toBe(last.id);
    expect(carriedFrom([older, last, tea], 'Old thing')).toBeNull();
    expect(carriedFrom([older, { ...last, outcome: 'done' }], 'Chapter 3 notes')).toBeNull();
    expect(carriedFrom([older, last], '')).toBeNull();
  });
});
