/** Pure rules behind the title, favicon, media session, announcer, notifications, wake lock and shortcuts. */
import { describe, expect, it } from 'vitest';
import { INITIAL_TIMER } from './store';
import { compactClock, timerTitle, completionTitle, faviconKey } from './tabPresence';
import { mediaTitle } from './mediaSession';
import { messageFor, milestoneFor } from './announce';
import { shouldNotify, notificationCopy } from './notify';
import { wantsWakeLock } from './wakeLock';
import { diffTimer } from './sync';
import { completionAllowed, SETTLE_MS, FORCE_AFTER_MS } from './ticker';
import { parseCombo, matchesCombo, isEditableTarget, isActivationTarget, displayKey, createModality } from '@/lib/shortcuts';
import type { TimerState, TimerView } from './types';

const MIN = 60_000;
const view = (p: Partial<TimerView>): TimerView => ({
  status: 'running',
  phase: 'focus',
  sessionId: 's1',
  plannedMs: 25 * MIN,
  addedMs: 0,
  remainingMs: 0,
  seconds: 0,
  progress: 0,
  due: false,
  ...p,
});

describe('tab title', () => {
  it('formats like "12:34 · Focusing — Kettle"', () => {
    expect(compactClock(754)).toBe('12:34');
    expect(compactClock(250)).toBe('4:10');
    expect(compactClock(3909)).toBe('1:05:09');
    expect(timerTitle(view({ seconds: 754 }))).toBe('12:34 · Focusing — Kettle');
    expect(timerTitle(view({ seconds: 250, phase: 'shortBreak' }))).toBe('4:10 · Tea break — Kettle');
    expect(timerTitle(view({ seconds: 600, phase: 'longBreak' }))).toBe('10:00 · Long tea break — Kettle');
    expect(timerTitle(view({ seconds: 754, status: 'paused' }))).toBe('12:34 · Paused — Kettle');
    expect(timerTitle(view({ seconds: 250, status: 'paused', phase: 'shortBreak' }))).toBe('4:10 · Break paused — Kettle');
    expect(timerTitle(view({ status: 'idle' }))).toBeNull();
    expect(completionTitle('focus')).toBe('Tea’s ready — Kettle');
  });

  it('favicon only redraws when the ring visibly moves', () => {
    const a = faviconKey(view({ progress: 0.1 }));
    expect(faviconKey(view({ progress: 0.1 + 1 / 200 }))).toBe(a);
    expect(faviconKey(view({ progress: 0.2 }))).not.toBe(a);
    expect(faviconKey(view({ progress: 0.1, status: 'paused' }))).not.toBe(a);
    expect(faviconKey(view({ progress: 0.1, phase: 'shortBreak' }))).not.toBe(a);
    expect(faviconKey(view({ status: 'idle' }))).toBe('idle');
  });
});

describe('media session', () => {
  it('title reads "Focusing · 18 min left"', () => {
    expect(mediaTitle(view({ remainingMs: 17 * MIN + 1000 }))).toBe('Focusing · 18 min left');
    expect(mediaTitle(view({ remainingMs: 4 * MIN, phase: 'shortBreak' }))).toBe('Tea break · 4 min left');
    expect(mediaTitle(view({ remainingMs: 30_000 }))).toBe('Focusing · under a minute left');
    expect(mediaTitle(view({ remainingMs: 18 * MIN, status: 'paused' }))).toBe('Paused · 18 min left');
    expect(mediaTitle(view({ status: 'idle' }))).toBeNull();
  });
});

describe('announcer', () => {
  it('speaks every 5 minutes and at 1 minute left — never every second', () => {
    const said: string[] = [];
    let prev = view({ seconds: 25 * 60 });
    for (let s = 25 * 60 - 1; s >= 1; s--) {
      const next = view({ seconds: s });
      const m = milestoneFor(prev, next);
      if (m) said.push(m);
      prev = next;
    }
    expect(said).toEqual(['20 minutes left.', '15 minutes left.', '10 minutes left.', '5 minutes left.', '1 minute left.']);
  });

  it('ignores jumps (restore / fast-forward), pauses and session changes', () => {
    expect(milestoneFor(view({ seconds: 1300 }), view({ seconds: 100 }))).toBeNull();
    expect(milestoneFor(view({ seconds: 301, status: 'paused' }), view({ seconds: 300 }))).toBeNull();
    expect(milestoneFor(view({ seconds: 301 }), view({ seconds: 300, sessionId: 's2' }))).toBeNull();
    expect(milestoneFor(view({ seconds: 1 }), view({ seconds: 0 }))).toBeNull();
  });

  it('warm, specific messages', () => {
    expect(messageFor({ type: 'start', phase: 'focus', durationMs: 25 * MIN })).toBe('Kettle’s on. Focus session started, 25 minutes.');
    expect(messageFor({ type: 'pause', phase: 'focus', remainingMs: 12 * MIN + 30_000 })).toBe('Paused. 12 minutes 30 seconds left.');
    expect(messageFor({ type: 'addTime', phase: 'focus', addedMs: 5 * MIN, remainingMs: 17 * MIN })).toBe('Added 5 minutes. 17 minutes left.');
    expect(messageFor({ type: 'complete', phase: 'focus' })).toMatch(/whistling/);
    expect(messageFor({ type: 'complete', phase: 'shortBreak' })).toBe('Tea’s done. Ready for another brew?');
    expect(messageFor({ type: 'stop', phase: 'focus', savedMs: 12 * MIN })).toBe('Kettle’s off. 12 minutes of focus saved.');
    expect(messageFor({ type: 'stop', phase: 'focus', savedMs: null })).toBe('Kettle’s off.');
  });
});

describe('notifications', () => {
  it('only when enabled, granted and nobody is looking', () => {
    const base = { enabled: true, status: 'granted' as const, pageVisible: false, otherTabVisible: false };
    expect(shouldNotify(base)).toBe(true);
    expect(shouldNotify({ ...base, enabled: false })).toBe(false);
    expect(shouldNotify({ ...base, status: 'default' })).toBe(false);
    expect(shouldNotify({ ...base, pageVisible: true })).toBe(false);
    expect(shouldNotify({ ...base, otherTabVisible: true })).toBe(false);
  });
  it('copy follows the brief voice', () => {
    expect(notificationCopy('focusDone', { focusedMs: 25 * MIN, intention: 'Essay' })).toEqual({
      title: 'The kettle’s whistling! Time for tea.',
      body: '25 min brewed on “Essay”. Your tea break is ready.',
    });
    expect(notificationCopy('breakDone').title).toBe('Tea’s done — ready for another brew?');
  });
});

describe('wake lock', () => {
  it('held only while running, visible and enabled', () => {
    expect(wantsWakeLock('running', true, true)).toBe(true);
    expect(wantsWakeLock('paused', true, true)).toBe(false);
    expect(wantsWakeLock('idle', true, true)).toBe(false);
    expect(wantsWakeLock('running', false, true)).toBe(false);
    expect(wantsWakeLock('running', true, false)).toBe(false);
  });
});

describe('cross-tab diff', () => {
  const s = (p: Partial<TimerState>): TimerState => ({ ...INITIAL_TIMER, ...p });
  const running = s({ status: 'running', sessionId: 'a', endsAt: 1, plannedMs: 25 * MIN });
  it('classifies what another tab did', () => {
    expect(diffTimer(s({}), running)).toBe('start');
    expect(diffTimer(running, { ...running, status: 'paused' })).toBe('pause');
    expect(diffTimer({ ...running, status: 'paused' }, running)).toBe('resume');
    expect(diffTimer(running, { ...running, plannedMs: 30 * MIN })).toBe('addTime');
    const done = s({ lastEnded: { sessionId: 'a', phase: 'focus', reason: 'complete', at: 1, whileAway: false } });
    expect(diffTimer(running, done)).toBe('complete');
    expect(diffTimer(running, s({ lastEnded: { sessionId: 'a', phase: 'focus', reason: 'user', at: 1, whileAway: false } }))).toBe('stop');
    expect(diffTimer(running, s({}))).toBe('reset');
    expect(diffTimer(running, { ...running, sessionId: 'b' })).toBe('start');
    expect(diffTimer(done, done)).toBeNull();
    expect(diffTimer(running, { ...running, intention: 'x' })).toBeNull();
  });
});

describe('completion rule', () => {
  const base = { leader: true, leaderForMs: SETTLE_MS + 1, settledAt: 0, now: 10, dueForMs: 0 };
  it('leader, settled → yes; follower or just-elected → no; long overdue → yes regardless', () => {
    expect(completionAllowed(base)).toBe(true);
    expect(completionAllowed({ ...base, leader: false })).toBe(false);
    expect(completionAllowed({ ...base, leaderForMs: 10 })).toBe(false);
    expect(completionAllowed({ ...base, settledAt: 20 })).toBe(false);
    expect(completionAllowed({ ...base, leader: false, dueForMs: FORCE_AFTER_MS + 1 })).toBe(true);
  });
});

describe('shortcuts', () => {
  const ev = (key: string, mods: Partial<Record<'ctrlKey' | 'metaKey' | 'altKey' | 'shiftKey', boolean>> = {}) => ({
    key,
    ctrlKey: false,
    metaKey: false,
    altKey: false,
    shiftKey: false,
    ...mods,
  });
  it('parses and matches combos', () => {
    expect(matchesCombo(ev(' '), parseCombo('Space'))).toBe(true);
    expect(matchesCombo(ev(' ', { shiftKey: true }), parseCombo('Space'))).toBe(false);
    expect(matchesCombo(ev('Escape'), parseCombo('Esc'))).toBe(true);
    expect(matchesCombo(ev('+', { shiftKey: true }), parseCombo('+'))).toBe(true);
    expect(matchesCombo(ev('?', { shiftKey: true }), parseCombo('?'))).toBe(true);
    expect(matchesCombo(ev('+', { ctrlKey: true }), parseCombo('+'))).toBe(false); // browser zoom stays the browser's
    expect(matchesCombo(ev('k', { ctrlKey: true }), parseCombo('mod+k'), false)).toBe(true);
    expect(matchesCombo(ev('k', { metaKey: true }), parseCombo('mod+k'), true)).toBe(true);
    expect(matchesCombo(ev('k', { metaKey: true }), parseCombo('mod+k'), false)).toBe(false);
    expect(matchesCombo(ev('K', { shiftKey: true }), parseCombo('k'))).toBe(false);
    expect(matchesCombo(ev('+'), parseCombo('ctrl++'))).toBe(false);
    expect(matchesCombo(ev('+', { ctrlKey: true }), parseCombo('ctrl++'))).toBe(true);
  });
  it('knows typing targets from activation targets', () => {
    const el = (tag: string, attrs: Record<string, string> = {}, editable = false) =>
      ({ tagName: tag.toUpperCase(), isContentEditable: editable, type: attrs.type ?? '', getAttribute: (k: string) => attrs[k] ?? null, hasAttribute: (k: string) => k in attrs }) as unknown as EventTarget;
    expect(isEditableTarget(el('input', { type: 'text' }))).toBe(true);
    expect(isEditableTarget(el('input', { type: 'checkbox' }))).toBe(false);
    expect(isEditableTarget(el('textarea'))).toBe(true);
    expect(isEditableTarget(el('div', {}, true))).toBe(true);
    expect(isEditableTarget(el('div'))).toBe(false);
    expect(isActivationTarget(el('button'))).toBe(true);
    expect(isActivationTarget(el('a', { href: '#/' }))).toBe(true);
    expect(isActivationTarget(el('div', { role: 'switch' }))).toBe(true);
    expect(isActivationTarget(el('div'))).toBe(false);
  });
  it('tracks whether focus came from a pointer or the keyboard', () => {
    const m = createModality();
    const end = {} as EventTarget;
    const sheetButton = {} as EventTarget;
    // Clicked, or handed back by a sheet closed with the mouse: the shortcut wins.
    m.pointerDown();
    m.focusIn(end);
    expect(m.pointerFocused(end)).toBe(true);
    // Pressing Space doesn't change how the element got focus (Space pauses, then Space resumes).
    m.keyDown(' ');
    expect(m.pointerFocused(end)).toBe(true);
    // Esc closes a sheet opened by that click and hands focus back: still pointer-reached.
    m.focusIn(sheetButton);
    m.keyDown('Escape');
    m.focusIn(end);
    expect(m.pointerFocused(end)).toBe(true);
    // Reached with Tab: the native control keeps Space / Enter — also after an Esc hand-back later.
    m.keyDown('Tab');
    m.focusIn(sheetButton);
    m.keyDown('Tab');
    m.focusIn(end);
    expect(m.pointerFocused(end)).toBe(false);
    m.keyDown('Escape');
    m.focusIn(end);
    expect(m.pointerFocused(end)).toBe(false);
    expect(m.pointerFocused(null)).toBe(false);
  });
  it('displays keys for help sheets', () => {
    expect(displayKey('Space', false)).toBe('Space');
    expect(displayKey('Esc', false)).toBe('Esc');
    expect(displayKey('mod+k', false)).toBe('Ctrl+K');
    expect(displayKey('mod+k', true)).toBe('⌘K');
  });
});
