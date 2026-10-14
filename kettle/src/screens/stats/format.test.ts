import { describe, expect, it } from 'vitest';
import { hm, hmLong } from './format';

const MIN = 60_000;

describe('Stats minutes', () => {
  it('are whole focused minutes, rounded down, as the engine counts them for leaves and the goal', () => {
    expect(hm(12 * MIN + 40_000)).toBe('12 min');
    expect(hmLong(12 * MIN + 40_000)).toBe('12 minutes');
    expect(hm(59 * MIN + 59_000)).toBe('59 min');
    expect(hm(60 * MIN)).toBe('1h');
    expect(hm(23 * 60 * MIN + 9 * MIN + 59_000)).toBe('23h 9m');
    expect(hmLong(61 * MIN)).toBe('1 hour 1 minute');
    expect(hm(30_000)).toBe('0 min');
    expect(hmLong(0)).toBe('0 minutes');
  });
});
