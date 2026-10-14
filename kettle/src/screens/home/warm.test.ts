import { describe, expect, it } from 'vitest';
import { cozyNote, warmCaption, warmSheetLine, warmState, warmTitle } from './warm';

const TODAY = '2026-10-14';
const st = (o: Partial<{ current: number; best: number; todayDone: boolean; cozies: number; days: Record<string, string> }>) => ({ current: 0, best: 0, todayDone: false, cozies: 0, days: {}, ...o });

describe('warm days, in Kettle’s words (W3R1 glossary, I13)', () => {
  it('reads where a person stands from the engine’s numbers only', () => {
    expect(warmState(st({}), TODAY).kind).toBe('fresh');
    expect(warmState(st({ best: 9 }), TODAY).kind).toBe('returning');
    expect(warmState(st({ current: 3, best: 3, todayDone: true }), TODAY).kind).toBe('warmToday');
    expect(warmState(st({ current: 3, best: 3 }), TODAY).kind).toBe('pending');
    const kept = warmState(st({ current: 8, best: 8, days: { '2026-10-13': 'cozy', '2026-10-12': 'done' } }), TODAY);
    expect(kept).toMatchObject({ kind: 'cozyKept', cozyDays: 1 });
    expect(warmState(st({ current: 8, best: 8, days: { '2026-10-13': 'cozy', '2026-10-12': 'cozy' } }), TODAY).cozyDays).toBe(2);
  });
  it('titles and captions invite; a Tea Cozy is named only when one was used for this person', () => {
    expect(warmTitle(warmState(st({}), TODAY))).toBe('Warm the kettle');
    expect(warmTitle(warmState(st({ best: 4 }), TODAY))).toBe('Welcome back');
    expect(warmTitle(warmState(st({ current: 1, best: 1 }), TODAY))).toBe('1 day warm');
    expect(warmCaption(warmState(st({ current: 8, best: 8, days: { '2026-10-13': 'cozy' } }), TODAY))).toBe('A Tea Cozy kept it warm yesterday.');
    expect(warmCaption(warmState(st({ current: 5, best: 5 }), TODAY), true)).toBe('One brew tonight adds another day.');
    for (const w of [st({}), st({ best: 4 }), st({ current: 5, best: 5 }), st({ current: 5, best: 5, todayDone: true })])
      expect(warmCaption(warmState(w, TODAY))).not.toMatch(/Tea Cozy/);
  });
  it('the sheet explains a Tea Cozy truthfully for this person', () => {
    const held = warmState(st({ current: 9, best: 9, cozies: 1 }), TODAY);
    expect(cozyNote(held, 5)).toBe('A Tea Cozy keeps the kettle warm through one missed day. It’s used for you, so there’s nothing to remember. You have one.');
    const none = warmState(st({ current: 5, best: 5 }), TODAY);
    expect(cozyNote(none, 2)).toBe('No Tea Cozy yet. You’ll earn one after 2 more warm days in a row: it keeps the kettle warm through one missed day.');
    expect(cozyNote(warmState(st({}), TODAY), 7)).toBe('Every 7 warm days in a row earn a Tea Cozy: it keeps the kettle warm through one missed day.');
    expect(warmSheetLine(none)).toBe('5 warm days in a row. One brew today adds another.');
    const kept = warmState(st({ current: 8, best: 20, cozies: 1, days: { '2026-10-13': 'cozy' } }), TODAY);
    expect(warmSheetLine(kept), 'Chai says what happened; the sheet does not repeat it').toBe('8 warm days in a row. One brew today adds another.');
    expect(cozyNote(kept, 6)).toBe('A Tea Cozy keeps the kettle warm through one missed day. It’s used for you, so there’s nothing to remember. One did yesterday. You have one more.');
    expect(warmSheetLine(warmState(st({ current: 5, best: 5, todayDone: true }), TODAY))).toBe('5 warm days in a row, today included.');
  });
  it('never says "streak", and never threatens', () => {
    const states = [st({}), st({ best: 4 }), st({ current: 5, best: 5 }), st({ current: 5, best: 5, todayDone: true, cozies: 2 }), st({ current: 8, best: 20, cozies: 1, days: { '2026-10-13': 'cozy' } })];
    for (const s of states) {
      const w = warmState(s, TODAY);
      for (const t of [warmTitle(w), warmCaption(w), warmCaption(w, true), warmSheetLine(w), cozyNote(w, 3)]) expect(t, t).not.toMatch(/streak|lose|lost|break|don.t miss|hurry/i);
    }
  });
});
