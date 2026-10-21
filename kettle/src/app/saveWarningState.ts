/**
 * "Kettle couldn't save" — the state behind the storage-full banner (src/app/SaveWarning.tsx). OWNER: core-loop area.
 *
 * A failed write (reported by src/lib/storage.ts through flow.ts) turns the warning on; it stays on while any key
 * whose save failed still holds an older value than this tab (`lastWriteFailed`), and goes away once every one of
 * them has been saved again (storage has room again). It is a state, not a moment: no timer takes it away, nothing
 * holds it back, and where it shows is decided by the screens that include it (Today, Settings › Your data, the
 * summary's one-line note). Screen readers hear it once, when it is first shown (a polite announcement of its own,
 * not the banner itself, so a banner mounted again on the next visit to Today is not read out again).
 *
 * A banner that appears (or goes) while its screen is open keeps whatever is under the person's finger, pointer or
 * keyboard focus where it was: the page is scrolled by however far that moved, in the same frame (`settleAnchor`).
 */
import { create } from 'zustand';
import { lastWriteFailed, type StorageWriteError } from '@/lib/storage';
import { toast } from '@/ui/Toast';
import { downloadBackup } from '@/screens/home/shims/data';

export interface SaveWarningState {
  /** Some saves failed and have not succeeded since: what this browser holds is older than this tab. */
  failing: boolean;
  /** The browser said its storage is full (rather than blocked). */
  quota: boolean;
  /** Counts the times saving started failing (each is announced once). */
  episode: number;
}

export const useSaveWarning = create<SaveWarningState>(() => ({ failing: false, quota: false, episode: 0 }));

/** Is the storage warning on (some saves failed and have not succeeded since)? */
export function saveWarningActive(): boolean {
  return useSaveWarning.getState().failing;
}

export function saveWarningText(quota: boolean): { title: string; body: string } {
  return quota
    ? { title: 'This browser’s storage is full.', body: 'Kettle couldn’t save your latest changes. Save a backup to keep them.' }
    : { title: 'Kettle can’t save in this browser.', body: 'Your latest changes are only in this tab. Save a backup to keep them.' };
}

/** How often the warning checks whether every failed save has since gone through (not geometry: storage state). */
const RECOVERY_CHECK_MS = 2000;
/** Saving that stops failing and starts again within this long is not announced a second time. */
const ANNOUNCE_EVERY_MS = 60_000;

const failedKeys = new Set<string>();
let recoveryTimer: ReturnType<typeof setInterval> | null = null;

function stillFailing(): boolean {
  for (const k of failedKeys) if (lastWriteFailed(k)) return true;
  return false;
}

function checkRecovered(): void {
  if (stillFailing()) return;
  failedKeys.clear();
  if (recoveryTimer) clearInterval(recoveryTimer);
  recoveryTimer = null;
  captureAnchor();
  useSaveWarning.setState({ failing: false });
  if (announcer) announcer.textContent = '';
}

/** A save failed (src/app/flow.ts). */
export function raiseSaveWarning({ key, quota }: StorageWriteError): void {
  failedKeys.add(key);
  const s = useSaveWarning.getState();
  if (s.failing) {
    if (quota && !s.quota) useSaveWarning.setState({ quota: true });
    return;
  }
  captureAnchor();
  useSaveWarning.setState({ failing: true, quota, episode: s.episode + 1 });
  if (!recoveryTimer) recoveryTimer = setInterval(checkRecovered, RECOVERY_CHECK_MS);
}

/** "Save backup": a file with everything this tab holds (saved or not). The warning stays while storage is full. */
export function saveBackupNow(): void {
  downloadBackup()
    .then((name) => name && toast.success(`Saved ${name}. Keep it somewhere safe.`))
    .catch(() => toast.warning('Couldn’t save the backup. Try again?'));
}

// ---------------------------------------------------------------------------------------------------------------
// Said once
// ---------------------------------------------------------------------------------------------------------------

let announcer: HTMLElement | null = null;
let announcedEpisode = 0;
let announcedAt = -Infinity;

function ensureAnnouncer(): HTMLElement | null {
  if (typeof document === 'undefined' || !document.body) return null;
  if (announcer?.isConnected) return announcer;
  announcer = document.createElement('div');
  announcer.id = 'kettle-save-warning-said';
  announcer.className = 'sr-only';
  announcer.setAttribute('aria-live', 'polite');
  announcer.setAttribute('aria-atomic', 'true');
  document.body.appendChild(announcer);
  return announcer;
}

/** Called by the banner and the summary note when they show: the first one to show this episode has it read out. */
export function announceSaveWarning(): void {
  const { failing, quota, episode } = useSaveWarning.getState();
  if (!failing || episode === announcedEpisode) return;
  announcedEpisode = episode;
  const now = Date.now();
  if (now - announcedAt < ANNOUNCE_EVERY_MS) return;
  announcedAt = now;
  const el = ensureAnnouncer();
  if (!el) return;
  const { title, body } = saveWarningText(quota);
  // Set after the region has been in the page for a moment, so it is read as a change.
  setTimeout(() => {
    el.textContent = `${title} ${body} Save backup is on Today and in Settings, Your data.`;
  }, 150);
}

// ---------------------------------------------------------------------------------------------------------------
// Nothing moves under the finger
// ---------------------------------------------------------------------------------------------------------------

let pointer: { x: number; y: number } | null = null;
let lastInput: 'pointer' | 'key' = 'pointer';
let anchor: { chain: { el: Element; top: number }[]; at: number } | null = null;

/** Remember what the person is touching, pointing at or focused on, and where it is, before the banner changes. */
function captureAnchor(): void {
  anchor = null;
  if (typeof document === 'undefined') return;
  const focus = document.activeElement;
  let el: Element | null = null;
  if (lastInput === 'key' && focus && focus !== document.body) el = focus;
  else if (pointer) el = document.elementFromPoint(pointer.x, pointer.y);
  if (!el && focus && focus !== document.body) el = focus;
  if (!el) return;
  const chain: { el: Element; top: number }[] = [];
  for (let e: Element | null = el; e && e !== document.body && e !== document.documentElement; e = e.parentElement) chain.push({ el: e, top: e.getBoundingClientRect().top });
  anchor = { chain, at: performance.now() };
}

function scrollerOf(el: Element): Element {
  for (let e = el.parentElement; e && e !== document.body && e !== document.documentElement; e = e.parentElement) {
    const oy = getComputedStyle(e).overflowY;
    if ((oy === 'auto' || oy === 'scroll' || oy === 'overlay') && e.scrollHeight > e.clientHeight) return e;
  }
  return document.scrollingElement ?? document.documentElement;
}

/**
 * Right after the banner (or note) appeared or went, before the frame is drawn: scroll by however far the thing under
 * the person's finger, pointer or focus moved, so it stays where it was. (What sits above the banner moves instead.)
 */
export function settleAnchor(): void {
  const a = anchor;
  anchor = null;
  if (!a || performance.now() - a.at > 1500) return;
  const hit = a.chain.find((c) => c.el.isConnected);
  if (!hit) return;
  const delta = hit.el.getBoundingClientRect().top - hit.top;
  if (Math.abs(delta) < 0.5) return;
  scrollerOf(hit.el).scrollBy({ top: delta, behavior: 'instant' as ScrollBehavior });
}

let started = false;

/** Wiring (src/app/flow.ts `initFlow`): the polite announcer exists before it is needed; input is followed. */
export function initSaveWarning(): void {
  if (started || typeof window === 'undefined') return;
  started = true;
  ensureAnnouncer();
  const onPointer = (e: PointerEvent) => {
    pointer = { x: e.clientX, y: e.clientY };
    if (e.type === 'pointerdown') lastInput = 'pointer';
  };
  addEventListener('pointerdown', onPointer, { capture: true, passive: true });
  addEventListener('pointermove', onPointer, { capture: true, passive: true });
  addEventListener('keydown', () => (lastInput = 'key'), { capture: true, passive: true });
}
