import { describe, expect, it } from 'vitest';
import { leavesForLevel, levelFromLeaves } from './levels';

describe('level curve', () => {
  it('starts at level 1 with nothing', () => {
    expect(levelFromLeaves(0)).toEqual({ level: 1, leaves: 0, into: 0, size: 25 });
  });

  it('is strictly increasing with growing steps', () => {
    let prevStep = 0;
    for (let l = 1; l < 40; l++) {
      const step = leavesForLevel(l + 1) - leavesForLevel(l);
      expect(step).toBeGreaterThan(0);
      expect(step).toBeGreaterThanOrEqual(prevStep);
      expect(step % 5).toBe(0);
      prevStep = step;
    }
  });

  it('first brew (25 min + full brew + first brew of the day) levels you up', () => {
    const firstBrew = 25 + 5 + 3;
    expect(levelFromLeaves(firstBrew).level).toBe(2);
    // …and a second brew the same day usually reaches level 3.
    expect(levelFromLeaves(firstBrew + 30).level).toBe(3);
  });

  it('reaches ~level 10 after two weeks and ~level 20 after 2–3 months of daily use', () => {
    const perDay = 90; // two brews + goal + a recipe or two
    expect(levelFromLeaves(perDay * 14).level).toBe(10);
    const l60 = levelFromLeaves(perDay * 60).level;
    const l90 = levelFromLeaves(perDay * 90).level;
    expect(l60).toBeGreaterThanOrEqual(17);
    expect(l60).toBeLessThan(20);
    expect(l90).toBeGreaterThanOrEqual(20);
  });

  it('into/size describe the position inside a level', () => {
    const at = leavesForLevel(5) + 7;
    const info = levelFromLeaves(at);
    expect(info.level).toBe(5);
    expect(info.into).toBe(7);
    expect(info.size).toBe(leavesForLevel(6) - leavesForLevel(5));
  });

  it('is robust to junk input', () => {
    expect(levelFromLeaves(-5).level).toBe(1);
    expect(levelFromLeaves(Number.NaN).level).toBe(1);
    expect(levelFromLeaves(59.9).level).toBe(2);
  });
});
