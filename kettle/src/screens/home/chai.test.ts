import { describe, expect, it } from 'vitest';
import { brewsToGo, chaiLine, greeting, type ChaiContext } from './chai';

const base: ChaiContext = {
  part: 'morning',
  name: '',
  todayMin: 0,
  goalMin: 30,
  sessionsToday: 0,
  streak: 0,
  todayDone: false,
  cozies: 0,
  totalSessions: 10,
  daysSinceLast: 1,
  firstVisitToday: true,
  focusMin: 25,
  seed: 0,
};

describe('greeting', () => {
  it('uses the time of day and name', () => {
    expect(greeting('morning', 'Robin')).toBe('Good morning, Robin');
    expect(greeting('night', '')).toBe('Hello, night owl');
    expect(greeting('night', 'Robin')).toBe('Still up, Robin?');
    expect(greeting('evening', '  ')).toBe('Good evening');
  });
});

describe('chaiLine', () => {
  it('acknowledges a live brew or break first', () => {
    expect(chaiLine({ ...base, live: 'focus', todayMin: 40 }).mood).toBe('live');
    expect(chaiLine({ ...base, live: 'break' }).text).toContain('Tea time');
  });
  it('welcomes brand new brewers', () => {
    expect(chaiLine({ ...base, totalSessions: 0 }).mood).toBe('first');
  });
  it('celebrates a met goal over everything else', () => {
    const l = chaiLine({ ...base, todayMin: 30, sessionsToday: 1, todayDone: true, part: 'afternoon', streak: 4 });
    expect(l.mood).toBe('met');
    expect(l.pose).toBe('proud');
    expect(chaiLine({ ...base, todayMin: 30, part: 'evening', streak: 4 }).mood).toBe('met');
  });
  it('suggests a gentle brew late at night, mentioning a streak at risk', () => {
    const l = chaiLine({ ...base, part: 'night', streak: 5 });
    expect(l.mood).toBe('night');
    expect(l.suggestGentle).toBe(true);
    expect(l.text).toContain('5\u2011day');
  });
  it('welcomes people back after a break without guilt', () => {
    const l = chaiLine({ ...base, daysSinceLast: 6 });
    expect(l.mood).toBe('back');
    expect(l.text).not.toMatch(/miss|lost|broke/i);
  });
  it('invites (never warns) when a streak is at risk in the evening', () => {
    const l = chaiLine({ ...base, part: 'evening', streak: 3, cozies: 1, firstVisitToday: false });
    expect(l.mood).toBe('risk');
    expect(l.text).toContain('Tea Cozy');
    expect(l.pose).not.toBe('concerned');
  });
  it('reports progress toward the goal', () => {
    const l = chaiLine({ ...base, todayMin: 10, part: 'afternoon' });
    expect(l.mood).toBe('progress');
    expect(l.text).toMatch(/20/);
  });
  it('says hello on the first visit of the day', () => {
    expect(chaiLine(base).mood).toBe('hello');
    expect(chaiLine({ ...base, firstVisitToday: false }).mood).toBe('idle');
  });
  it('never uses more than one exclamation mark', () => {
    const parts = ['morning', 'afternoon', 'evening', 'night'] as const;
    for (const part of parts)
      for (let seed = 0; seed < 4; seed++)
        for (const todayMin of [0, 10, 40])
          expect((chaiLine({ ...base, part, seed, todayMin }).text.match(/!/g) ?? []).length).toBeLessThanOrEqual(1);
  });
});

describe('time of day', () => {
  it('gives mornings, evenings and nights their own Chai for the same progress', () => {
    const at = (part: ChaiContext['part']) => chaiLine({ ...base, part, todayMin: 10, firstVisitToday: false });
    expect(at('morning').pose).toBe('stretch');
    expect(at('evening').text).toMatch(/Lamps/);
    expect(at('night').pose).toBe('sleep');
    expect(new Set(['morning', 'afternoon', 'evening'].map((p) => at(p as ChaiContext['part']).text)).size).toBe(3);
  });
});

describe('brewsToGo', () => {
  it('rounds up and never returns zero while minutes remain', () => {
    expect(brewsToGo(0, 25)).toBe(0);
    expect(brewsToGo(1, 25)).toBe(1);
    expect(brewsToGo(26, 25)).toBe(2);
  });
});
