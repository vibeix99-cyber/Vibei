/**
 * Timer across DST transitions (America/New_York: spring forward 2026-03-08
 * 02:00→03:00, fall back 2026-11-01 02:00→01:00). A 25-minute brew is 25 real
 * minutes no matter what the wall clock does, and is filed under the local day
 * it ended.
 */
const env = (globalThis as unknown as { process: { env: Record<string, string | undefined> } }).process.env;
const PREV_TZ = env.TZ;
env.TZ = 'America/New_York';

import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { clock } from '@/lib/clock';
import { on } from '@/lib/events';
import type { SessionRecord } from '@/progress/types';
import { useTimer, remainingAt } from './store';

const MIN = 60_000;
let records: SessionRecord[] = [];
on('timer:complete', ({ record }) => records.push(record));

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  clock.reset();
  records = [];
  useTimer.getState().reset();
});
afterEach(() => vi.useRealTimers());
afterAll(() => {
  env.TZ = PREV_TZ;
  clock.reset();
});

describe('DST', () => {
  it('runs in a DST timezone', () => {
    expect(new Date(2026, 0, 15).getTimezoneOffset()).not.toBe(new Date(2026, 6, 15).getTimezoneOffset());
  });

  it('spring forward: 01:50 EST + 25 real minutes → 03:15 EDT, same day', () => {
    vi.setSystemTime(new Date(2026, 2, 8, 1, 50));
    useTimer.getState().startFocus();
    clock.advance(10 * MIN); // wall clock jumps 02:00 → 03:00 here
    expect(new Date(clock.now()).getHours()).toBe(3);
    expect(remainingAt(useTimer.getState())).toBe(15 * MIN);
    clock.advance(15 * MIN);
    useTimer.getState().tick();
    expect(records).toHaveLength(1);
    expect(records[0].day).toBe('2026-03-08');
    expect(records[0].endedAt - records[0].startedAt).toBe(25 * MIN);
    expect(new Date(records[0].endedAt).getHours()).toBe(3);
  });

  it('fall back: 01:50 EDT + 25 real minutes → 01:15 EST (looks earlier), same day', () => {
    vi.setSystemTime(new Date(2026, 10, 1, 1, 50));
    useTimer.getState().startFocus();
    clock.advance(25 * MIN - 1);
    useTimer.getState().tick();
    expect(records).toHaveLength(0);
    clock.advance(1);
    useTimer.getState().tick();
    expect(records).toHaveLength(1);
    const end = new Date(records[0].endedAt);
    expect(end.getHours()).toBe(1);
    expect(end.getMinutes()).toBe(15);
    expect(records[0].day).toBe('2026-11-01');
    expect(records[0].focusedMs).toBe(25 * MIN);
  });

  it('brew across midnight on the night before spring forward', () => {
    vi.setSystemTime(new Date(2026, 2, 7, 23, 50));
    useTimer.getState().startFocus();
    clock.advance(25 * MIN);
    useTimer.getState().tick();
    expect(records[0].day).toBe('2026-03-08');
  });
});
