import { describe, expect, it } from 'vitest';
import { autoTime, timeFromClock } from './palette';

describe('autoTime', () => {
  it('follows the clock in the light theme', () => {
    for (const t of ['morning', 'day', 'dusk', 'night'] as const) expect(autoTime(t, false)).toBe(t);
  });

  it('is always an evening room in the dark theme', () => {
    expect(autoTime('morning', true)).toBe('night');
    expect(autoTime('day', true)).toBe('night');
    expect(autoTime('dusk', true)).toBe('dusk');
    expect(autoTime('night', true)).toBe('night');
  });

  it('maps a mid-afternoon clock to night under the dark theme', () => {
    const d = new Date(2026, 8, 28, 15, 30);
    expect(timeFromClock(d)).toBe('day');
    expect(autoTime(timeFromClock(d), true)).toBe('night');
  });
});
