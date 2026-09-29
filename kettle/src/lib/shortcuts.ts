/**
 * Keyboard shortcuts. OWNER: timer area (infra); screens bind their own keys.
 *
 *   useShortcut('Space', () => toggle(), { enabled: onFocusScreen })
 *   useShortcut(['+', '='], () => addTime(5 * 60_000))
 *   useShortcut('mod+k', open)                       // Ctrl on Windows/Linux, ⌘ on Mac
 *
 * Safe by default:
 *  - ignored while typing (inputs, textareas, selects, contenteditable) unless `allowInInputs`
 *  - Space/Enter/arrows never steal activation from a focused button, link, checkbox, slider…
 *  - ignored while a modal dialog is open (its own Esc handling wins) unless `allowInDialogs`
 *  - no key repeat, no IME composition, nothing when another handler already called preventDefault
 *  - unmodified keys don't fire when Ctrl/Alt/⌘ are held, so browser, OS and
 *    screen-reader commands (which use modifiers) are never hijacked
 *  - the most recently bound handler for a key wins (a screen overrides a global)
 *
 * `SHORTCUTS` is the registry a help sheet renders. `?` toggles the help sheet
 * state (`useShortcutHelp()`); whoever renders the sheet reads it.
 */
import { useEffect, useRef, useSyncExternalStore } from 'react';

export interface ShortcutInfo {
  id: string;
  /** Display keys, e.g. ['Space'] or ['+']. */
  keys: string[];
  label: string;
  /** Where it works, for grouping in the help sheet. */
  where?: string;
}

/** Everything a help sheet should list. Screens that add shortcuts should add them here too. */
export const SHORTCUTS: ShortcutInfo[] = [
  { id: 'toggle', keys: ['Space'], label: 'Pause or resume', where: 'During a brew' },
  { id: 'end', keys: ['Esc'], label: 'End the brew early', where: 'During a brew' },
  { id: 'addTime', keys: ['+'], label: 'Add 5 minutes', where: 'During a brew' },
  { id: 'mute', keys: ['M'], label: 'Mute or unmute sounds', where: 'During a brew' },
  { id: 'start', keys: ['Enter'], label: 'Put the kettle on', where: 'Today' },
  { id: 'help', keys: ['?'], label: 'Show keyboard shortcuts', where: 'Anywhere' },
];

export interface ShortcutOptions {
  /** Default true. */
  enabled?: boolean;
  /** Fire even while typing in a text field. Default false. */
  allowInInputs?: boolean;
  /** Fire while a modal dialog is open. Default false. */
  allowInDialogs?: boolean;
  /** Fire on auto-repeat while the key is held. Default false. */
  allowRepeat?: boolean;
  /** Call preventDefault when handled (stops Space scrolling the page). Default true. */
  preventDefault?: boolean;
}

/** Return `false` from a handler to let the next binding (or the browser) have the key. */
export type ShortcutHandler = (e: KeyboardEvent) => void | boolean;

interface Combo {
  key: string;
  ctrl: boolean;
  meta: boolean;
  alt: boolean;
  shift: boolean | null; // null = don't care (symbols like '?' and '+')
  mod: boolean;
}

const ALIASES: Record<string, string> = {
  space: ' ',
  spacebar: ' ',
  esc: 'escape',
  plus: '+',
  up: 'arrowup',
  down: 'arrowdown',
  left: 'arrowleft',
  right: 'arrowright',
  del: 'delete',
  return: 'enter',
};

export function parseCombo(combo: string): Combo {
  let parts: string[];
  if (combo === '+') parts = ['+'];
  else if (combo.endsWith('++')) parts = [...combo.slice(0, -2).split('+').filter(Boolean), '+'];
  else parts = combo.split('+');
  const rawKey = (parts.pop() ?? '').trim();
  const lower = rawKey.toLowerCase();
  const key = ALIASES[lower] ?? (rawKey.length === 1 ? rawKey.toLowerCase() : lower);
  const mods = parts.map((p) => p.trim().toLowerCase());
  const has = (...names: string[]) => mods.some((m) => names.includes(m));
  const isSymbol = key.length === 1 && !/[a-z0-9 ]/.test(key);
  return {
    key,
    ctrl: has('ctrl', 'control'),
    meta: has('meta', 'cmd', 'command'),
    alt: has('alt', 'option'),
    shift: has('shift') ? true : isSymbol ? null : false,
    mod: has('mod'),
  };
}

function isMac(): boolean {
  return typeof navigator !== 'undefined' && /Mac|iPhone|iPad|iPod/.test(navigator.platform || navigator.userAgent);
}

export function matchesCombo(e: Pick<KeyboardEvent, 'key' | 'ctrlKey' | 'metaKey' | 'altKey' | 'shiftKey'> & { getModifierState?: (k: string) => boolean }, c: Combo, mac = isMac()): boolean {
  const raw = e.key === 'Spacebar' ? ' ' : e.key === 'Esc' ? 'Escape' : e.key;
  if (!raw) return false;
  const k = raw.length === 1 ? raw.toLowerCase() : raw.toLowerCase();
  if (k !== c.key) return false;
  const altGr = !!e.getModifierState?.('AltGraph');
  const ctrl = altGr ? false : e.ctrlKey;
  const alt = altGr ? false : e.altKey;
  const wantCtrl = c.ctrl || (c.mod && !mac);
  const wantMeta = c.meta || (c.mod && mac);
  if (ctrl !== wantCtrl || e.metaKey !== wantMeta || alt !== c.alt) return false;
  if (c.shift !== null && e.shiftKey !== c.shift) return false;
  return true;
}

// ---------- target guards ----------

const TEXT_INPUTS = new Set(['text', 'search', 'email', 'url', 'tel', 'password', 'number', 'date', 'datetime-local', 'month', 'time', 'week', '']);
const INTERACTIVE_ROLES = new Set(['button', 'link', 'checkbox', 'switch', 'menuitem', 'menuitemcheckbox', 'menuitemradio', 'option', 'tab', 'radio', 'slider', 'spinbutton', 'combobox', 'listbox', 'textbox', 'treeitem', 'gridcell']);

export function isEditableTarget(t: EventTarget | null): boolean {
  const el = t as HTMLElement | null;
  if (!el || typeof el.tagName !== 'string') return false;
  const tag = el.tagName.toLowerCase();
  if (tag === 'textarea' || tag === 'select') return true;
  if (tag === 'input') return TEXT_INPUTS.has(((el as HTMLInputElement).type || '').toLowerCase());
  if (el.isContentEditable) return true;
  const role = el.getAttribute?.('role');
  return role === 'textbox' || role === 'searchbox' || role === 'combobox' || role === 'spinbutton';
}

/** Space / Enter / arrows belong to a focused control (button, link, slider…), not to shortcuts. */
export function isActivationTarget(t: EventTarget | null): boolean {
  const el = t as HTMLElement | null;
  if (!el || typeof el.tagName !== 'string') return false;
  const tag = el.tagName.toLowerCase();
  if (['button', 'input', 'select', 'textarea', 'summary', 'audio', 'video', 'option'].includes(tag)) return true;
  if (tag === 'a' && el.hasAttribute('href')) return true;
  const role = el.getAttribute?.('role');
  return !!role && INTERACTIVE_ROLES.has(role);
}

/**
 * How the focused element got focus. A control the user reached with the keyboard owns Space / Enter
 * (native activation). One that only holds focus because it was clicked, or because a sheet opened by
 * pointer handed focus back to its opener, isn't what the user is aiming at: there the shortcut wins, so
 * Space pauses instead of re-opening the End sheet or adding another 5 minutes. (`:focus-visible` can't
 * tell: Chromium turns it on for the focused element before the keydown is dispatched.)
 *
 * Only focus-moving keys (Tab, arrows…) make a control keyboard-reached. When a script moves focus after
 * any other key (Esc closing a sheet), the element keeps however the user last reached it.
 */
const NAV_KEYS = new Set(['Tab', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Home', 'End', 'PageUp', 'PageDown', 'F6']);

export function createModality() {
  let pointer = false;
  let navKey = false;
  const byPointer = new WeakSet<object>();
  return {
    pointerDown() {
      pointer = true;
      navKey = false;
    },
    keyDown(key: string) {
      pointer = false;
      navKey = NAV_KEYS.has(key);
    },
    focusIn(target: EventTarget | null) {
      if (!target) return;
      if (pointer) byPointer.add(target);
      else if (navKey) byPointer.delete(target);
    },
    /** True when the user last put focus on `target` with a pointer (directly, or handed back by script). */
    pointerFocused(target: EventTarget | null) {
      return !!target && byPointer.has(target);
    },
  };
}

const modality = createModality();

function modalOpen(): Element | null {
  if (typeof document === 'undefined') return null;
  for (const el of document.querySelectorAll('[aria-modal="true"], dialog[open]')) if (!el.closest('[inert]')) return el;
  return null;
}

const ACTIVATION_KEYS = new Set([' ', 'enter', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'home', 'end', 'pageup', 'pagedown']);

// ---------- dispatcher ----------

interface Binding {
  combos: Combo[];
  handler: ShortcutHandler;
  opts: ShortcutOptions;
}

const bindings: Binding[] = [];
let listening = false;

function onKeyDown(e: KeyboardEvent): void {
  if (e.defaultPrevented || e.isComposing || e.keyCode === 229) return;
  const target = e.target;
  const editable = isEditableTarget(target);
  const activation = isActivationTarget(target) && !modality.pointerFocused(target);
  const modal = modalOpen();
  for (let i = bindings.length - 1; i >= 0; i--) {
    const b = bindings[i];
    if (b.opts.enabled === false) continue;
    const combo = b.combos.find((c) => matchesCombo(e, c));
    if (!combo) continue;
    if (editable && !b.opts.allowInInputs) continue;
    const unmodified = !combo.ctrl && !combo.meta && !combo.alt && !combo.mod;
    if (unmodified && activation && !editable && ACTIVATION_KEYS.has(combo.key)) continue;
    if (modal && !b.opts.allowInDialogs) continue;
    if (e.repeat && !b.opts.allowRepeat) {
      // Holding the key: swallow the repeats (no page scroll), don't re-fire.
      if (b.opts.preventDefault !== false) e.preventDefault();
      return;
    }
    const result = b.handler(e);
    if (result === false) continue;
    if (b.opts.preventDefault !== false) e.preventDefault();
    return;
  }
}

/** Imperative binding (outside React). Returns an unbind function. */
export function bindShortcut(keys: string | string[], handler: ShortcutHandler, opts: ShortcutOptions = {}): () => void {
  const list = Array.isArray(keys) ? keys : [keys];
  const b: Binding = { combos: list.map(parseCombo), handler, opts };
  bindings.push(b);
  if (!listening && typeof window !== 'undefined') {
    listening = true;
    window.addEventListener('keydown', onKeyDown);
    // Capture phase: runs even when another handler (e.g. a dialog's focus trap) cancels the event.
    window.addEventListener('keydown', (e) => modality.keyDown(e.key), { capture: true });
    window.addEventListener('pointerdown', () => modality.pointerDown(), { capture: true, passive: true });
    window.addEventListener('focusin', (e) => modality.focusIn(e.target), { capture: true });
  }
  return () => {
    const i = bindings.indexOf(b);
    if (i >= 0) bindings.splice(i, 1);
  };
}

/** Bind keys while the component is mounted (and `enabled`). The latest handler is always used. */
export function useShortcut(keys: string | string[], handler: ShortcutHandler, opts: ShortcutOptions = {}): void {
  const ref = useRef(handler);
  ref.current = handler;
  const keyId = JSON.stringify(Array.isArray(keys) ? keys : [keys]);
  const { enabled = true, allowInInputs, allowInDialogs, allowRepeat, preventDefault } = opts;
  useEffect(() => {
    if (!enabled) return;
    return bindShortcut(JSON.parse(keyId) as string[], (e) => ref.current(e), { allowInInputs, allowInDialogs, allowRepeat, preventDefault });
  }, [keyId, enabled, allowInInputs, allowInDialogs, allowRepeat, preventDefault]);
}

/** "Space", "Esc", "+", "⌘K" / "Ctrl+K" — for help sheets and tooltips. */
export function displayKey(combo: string, mac = isMac()): string {
  const c = parseCombo(combo);
  const names: Record<string, string> = { ' ': 'Space', escape: 'Esc', enter: 'Enter', arrowup: '↑', arrowdown: '↓', arrowleft: '←', arrowright: '→', tab: 'Tab' };
  const key = names[c.key] ?? (c.key.length === 1 ? c.key.toUpperCase() : c.key[0].toUpperCase() + c.key.slice(1));
  const mods: string[] = [];
  if (c.ctrl || (c.mod && !mac)) mods.push(mac ? '⌃' : 'Ctrl');
  if (c.alt) mods.push(mac ? '⌥' : 'Alt');
  if (c.shift) mods.push(mac ? '⇧' : 'Shift');
  if (c.meta || (c.mod && mac)) mods.push(mac ? '⌘' : 'Win');
  return mac ? mods.join('') + key : [...mods, key].join('+');
}

// ---------- help sheet state ----------

let helpOpen = false;
const helpListeners = new Set<() => void>();
const setHelp = (v: boolean) => {
  if (helpOpen === v) return;
  helpOpen = v;
  helpListeners.forEach((l) => l());
};

export const openShortcutHelp = () => setHelp(true);
export const closeShortcutHelp = () => setHelp(false);
export const toggleShortcutHelp = () => setHelp(!helpOpen);
export const isShortcutHelpOpen = () => helpOpen;

/** `{ open, setOpen }` for whoever renders the shortcuts sheet. */
export function useShortcutHelp(): { open: boolean; setOpen: (open: boolean) => void } {
  const open = useSyncExternalStore(
    (cb) => {
      helpListeners.add(cb);
      return () => helpListeners.delete(cb);
    },
    () => helpOpen,
    () => false,
  );
  return { open, setOpen: setHelp };
}

let initialized = false;

/** Global shortcuts (call once at boot): `?` toggles the help sheet. */
export function initShortcuts(): void {
  if (initialized || typeof window === 'undefined') return;
  initialized = true;
  // Allowed inside dialogs only to close the help sheet itself; never opens over another dialog.
  bindShortcut('?', () => (helpOpen || !modalOpen() ? toggleShortcutHelp() : false), { allowInDialogs: true });
}
