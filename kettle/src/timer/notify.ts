/**
 * Completion notifications. OWNER: timer area.
 *
 *   notificationStatus()            'unsupported' | 'default' | 'granted' | 'denied'
 *   requestNotificationPermission() ask (from a user gesture — onboarding/settings);
 *                                   also flips `settings.notifications` to match
 *   showTimerNotification(kind)     used on completion (and handy for a "test" button)
 *
 * Completion notifications fire only in the tab that completed the phase (the
 * leader), only when `settings.notifications` is on, permission is granted and
 * no Kettle tab is visible. They go through the service worker when there is
 * one (Android requires it); clicking focuses the app.
 */
import { on } from '@/lib/events';
import { formatDuration } from '@/lib/format';
import { getSettings, useSettings } from '@/state/settings';
import type { Phase } from './types';

export type NotificationStatus = 'unsupported' | 'default' | 'granted' | 'denied';
/** Alias used by onboarding. */
export type NotifyStatus = NotificationStatus;

const TAG = 'kettle-timer';

export function notificationsSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

export function notificationStatus(): NotificationStatus {
  if (!notificationsSupported()) return 'unsupported';
  const p = Notification.permission;
  return p === 'granted' || p === 'denied' ? p : 'default';
}

/**
 * Ask for permission (call from a click/tap). Resolves with the resulting status.
 * Granted → `settings.notifications = true`; denied → false; dismissed → unchanged.
 */
export async function requestNotificationPermission(): Promise<NotificationStatus> {
  if (!notificationsSupported()) return 'unsupported';
  let result: NotificationPermission;
  try {
    result = await Notification.requestPermission();
  } catch {
    // Old Safari: callback form only.
    result = await new Promise<NotificationPermission>((resolve) => {
      try {
        void (Notification.requestPermission as unknown as (cb: (p: NotificationPermission) => void) => void)(resolve);
      } catch {
        resolve(Notification.permission);
      }
    });
  }
  if (result === 'granted') useSettings.getState().set({ notifications: true });
  else if (result === 'denied') useSettings.getState().set({ notifications: false });
  return notificationStatus();
}

export type TimerNotificationKind = 'focusDone' | 'breakDone';

export interface NotificationCopy {
  title: string;
  body: string;
}

/** Warm, short copy (BRIEF §3). */
export function notificationCopy(kind: TimerNotificationKind, detail: { focusedMs?: number; intention?: string } = {}): NotificationCopy {
  if (kind === 'focusDone') {
    const mins = detail.focusedMs ? formatDuration(detail.focusedMs) : '';
    const what = detail.intention?.trim() ? ` on “${detail.intention.trim()}”` : '';
    return {
      title: 'The kettle’s whistling! Time for tea.',
      body: mins ? `${mins} brewed${what}. Your tea break is ready.` : 'Your tea break is ready.',
    };
  }
  return {
    title: 'Tea’s done — ready for another brew?',
    body: 'Your kettle is ready when you are.',
  };
}

function iconUrl(name: string): string {
  try {
    return new URL(`${import.meta.env.BASE_URL}icons/${name}`, location.href).href;
  } catch {
    return `icons/${name}`;
  }
}

let lastPlain: Notification | null = null;

async function swRegistration(): Promise<ServiceWorkerRegistration | null> {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return null;
  try {
    const reg = await Promise.race([
      navigator.serviceWorker.getRegistration(),
      new Promise<undefined>((r) => setTimeout(() => r(undefined), 800)),
    ]);
    return reg && reg.active ? reg : null;
  } catch {
    return null;
  }
}

/** Show a timer notification now (ignores visibility — callers decide). Resolves true if shown. */
export async function showTimerNotification(kind: TimerNotificationKind, detail: { focusedMs?: number; intention?: string } = {}): Promise<boolean> {
  if (notificationStatus() !== 'granted') return false;
  const { title, body } = notificationCopy(kind, detail);
  const options: NotificationOptions & { renotify?: boolean; vibrate?: number[] } = {
    body,
    tag: TAG,
    renotify: true,
    icon: iconUrl('icon-192.png'),
    badge: iconUrl('icon-192.png'),
    vibrate: [120, 60, 120],
    data: { url: location.href, kind },
  };
  const reg = await swRegistration();
  if (reg) {
    try {
      await reg.showNotification(title, options);
      return true;
    } catch {
      /* fall through to the page notification */
    }
  }
  try {
    lastPlain?.close();
    const n = new Notification(title, options);
    n.onclick = () => {
      try {
        window.focus();
      } catch {
        /* ignore */
      }
      n.close();
    };
    lastPlain = n;
    return true;
  } catch {
    return false; // e.g. Android Chrome without a service worker
  }
}

/** Close any timer notification still on screen (the user is back). */
export async function clearTimerNotifications(): Promise<void> {
  lastPlain?.close();
  lastPlain = null;
  const reg = await swRegistration();
  if (!reg) return;
  try {
    const list = await reg.getNotifications({ tag: TAG });
    list.forEach((n) => n.close());
  } catch {
    /* ignore */
  }
}

export interface NotifyContext {
  /** Resolves true if another Kettle tab is visible (then we stay quiet). */
  anyOtherTabVisible: () => Promise<boolean>;
}

/** Decide whether a completion deserves a notification. Pure — unit tested. */
export function shouldNotify(opts: { enabled: boolean; status: NotificationStatus; pageVisible: boolean; otherTabVisible: boolean }): boolean {
  return opts.enabled && opts.status === 'granted' && !opts.pageVisible && !opts.otherTabVisible;
}

let started = false;

export function initNotifications(ctx: NotifyContext): void {
  if (started || typeof window === 'undefined') return;
  started = true;
  // `timer:complete` only fires in the one tab that completed the phase.
  on('timer:complete', ({ phase, record }) => {
    void notifyCompletion(phase, record.focusedMs, record.intention, ctx);
  });
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') void clearTimerNotifications();
  });
}

async function notifyCompletion(phase: Phase, focusedMs: number, intention: string, ctx: NotifyContext): Promise<void> {
  const s = getSettings();
  const base = { enabled: s.notifications, status: notificationStatus(), pageVisible: document.visibilityState === 'visible' };
  if (!shouldNotify({ ...base, otherTabVisible: false })) return;
  const otherTabVisible = await ctx.anyOtherTabVisible().catch(() => false);
  if (!shouldNotify({ ...base, pageVisible: document.visibilityState === 'visible', otherTabVisible })) return;
  await showTimerNotification(phase === 'focus' ? 'focusDone' : 'breakDone', phase === 'focus' ? { focusedMs, intention } : {});
}
