/**
 * Timer public API. OWNER: timer area. Stable contract — extend, don't break.
 *
 * Engine:        useTimer (state + actions), getTimer, remainingAt, progressAt,
 *                nextBreakKind, phaseLengthMs, isDue, elapsedActiveMs
 * Rendering:     useRemaining (once per displayed second), useProgressFrame
 *                (per-frame ring progress, no re-render), useSmoothProgress,
 *                getTimerView / subscribeTimerView
 * Boot:          initTimer (worker ticker, multi-tab leader + sync, title/favicon,
 *                wake lock, media session, notifications, announcer)
 * Notifications: notificationStatus, requestNotificationPermission,
 *                showTimerNotification, notificationsSupported
 * Accessibility: <TimerAnnouncer/> (polite live region), announce()
 * Multi-tab:     registerTabSync(store) to mirror another persisted store across tabs
 */
export * from './types';
export {
  useTimer,
  getTimer,
  remainingAt,
  progressAt,
  nextBreakKind,
  phaseLengthMs,
  isDue,
  elapsedActiveMs,
  MIN_RECORDABLE_MS,
  MAX_PHASE_MS,
  TIMER_STORAGE_KEY,
} from './store';
export {
  initTimer,
  useRemaining,
  useProgressFrame,
  useSmoothProgress,
  timerDiagnostics,
  type RemainingView,
  type TimerDiagnostics,
} from './ticker';
export { getTimerView, subscribeTimerView } from './view';
export {
  notificationStatus,
  notificationsSupported,
  requestNotificationPermission,
  showTimerNotification,
  type NotificationStatus,
  type NotifyStatus,
} from './notify';
export { TimerAnnouncer } from './TimerAnnouncer';
export { announce, lastAnnouncement } from './announce';
export { registerTabSync } from './sync';
export { isWakeLockHeld } from './wakeLock';
export { compactClock } from './tabPresence';
