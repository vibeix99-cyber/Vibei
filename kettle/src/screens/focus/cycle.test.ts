import { describe, expect, it } from 'vitest';
import { cycleInfo, focusStatus } from './cycle';
import { suggestionsFor } from './break/suggestions';

describe('cycleInfo', () => {
  it('counts the brew in progress', () => {
    expect(cycleInfo('focus', 0, 4, false)).toEqual({ filled: 0, current: 1, label: 'Brew 1 of 4' });
    expect(cycleInfo('focus', 2, 4, false)).toEqual({ filled: 2, current: 3, label: 'Brew 3 of 4' });
  });
  it('keeps an owed long break visible', () => {
    expect(cycleInfo('focus', 4, 4, false).label).toBe('Long tea break next');
    expect(cycleInfo('focus', 5, 4, false).filled).toBe(4);
    expect(cycleInfo('whistle', 4, 4, false).label).toBe('Long tea break earned');
  });
  it('fills every dot on a long break (cycle resets to 0 when it starts)', () => {
    expect(cycleInfo('break', 0, 4, true)).toEqual({ filled: 4, current: 0, label: '4 of 4 brewed' });
    expect(cycleInfo('break', 2, 4, false).label).toBe('2 of 4 brewed');
  });
  it('points at the next brew after a break', () => {
    expect(cycleInfo('over', 2, 4, false)).toEqual({ filled: 2, current: 3, label: 'Next: brew 3 of 4' });
    expect(cycleInfo('over', 0, 4, true).label).toBe('Next: brew 1 of 4');
  });
});

describe('focusStatus', () => {
  it('moves from warming up to almost whistling', () => {
    expect(focusStatus(0.1, 20 * 60_000)).toBe('Kettle’s warming up…');
    expect(focusStatus(0.5, 12 * 60_000)).toBe('Deep in it. Nice.');
    expect(focusStatus(0.9, 3 * 60_000)).toBe('Nearly there…');
    expect(focusStatus(0.97, 45_000)).toBe('Almost whistling…');
  });
});

describe('suggestionsFor', () => {
  it('only offers walk/snack on long breaks, and leads with them', () => {
    expect(suggestionsFor(false).some((s) => s.long)).toBe(false);
    const long = suggestionsFor(true);
    expect(long[0].long).toBe(true);
    expect(long.length).toBeGreaterThan(suggestionsFor(false).length);
  });
});
