/**
 * Service worker registration + update prompt. OWNER: timer/PWA area.
 *
 *   registerPwa()     called from boot; no-op in dev and where SWs aren't available
 *   usePwaUpdate()    { needRefresh, offlineReady, update(), dismiss() } for an
 *                     "Update" button (settings/shell); a toast is emitted too
 *
 * Updates never reload on their own: a running brew survives a reload anyway,
 * but ambience and animations would restart, so the user decides.
 */
import { useSyncExternalStore } from 'react';
import { emit } from '@/lib/events';

interface PwaState {
  needRefresh: boolean;
  offlineReady: boolean;
  registered: boolean;
}

let state: PwaState = { needRefresh: false, offlineReady: false, registered: false };
const listeners = new Set<() => void>();
let updateSW: ((reload?: boolean) => Promise<void>) | null = null;
let started = false;

function patch(p: Partial<PwaState>) {
  state = { ...state, ...p };
  listeners.forEach((l) => l());
}

export function getPwaState(): PwaState {
  return state;
}

/** Reload into the new version (after the user said yes). */
export async function applyPwaUpdate(): Promise<void> {
  if (updateSW) await updateSW(true);
  else location.reload();
}

export function dismissPwaUpdate(): void {
  patch({ needRefresh: false, offlineReady: false });
}

export function registerPwa(): void {
  if (started || !import.meta.env.PROD || typeof window === 'undefined') return;
  started = true;
  if (!('serviceWorker' in navigator) || location.protocol === 'file:') return;
  import('virtual:pwa-register')
    .then(({ registerSW }) => {
      updateSW = registerSW({
        immediate: true,
        onNeedRefresh() {
          patch({ needRefresh: true });
          emit('ui:toast', { message: 'A fresh brew of Kettle is ready. Reload to update.', tone: 'neutral' });
        },
        onOfflineReady() {
          patch({ offlineReady: true });
          emit('ui:toast', { message: 'Kettle works offline now.', tone: 'success' });
        },
        onRegisteredSW(_url, reg) {
          patch({ registered: true });
          if (!reg) return;
          // Look for updates hourly and whenever the app comes back to the foreground.
          const check = () => {
            if (navigator.onLine !== false) void reg.update().catch(() => {});
          };
          setInterval(check, 60 * 60_000);
          document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible') check();
          });
        },
        onRegisterError(err) {
          console.warn('[pwa] service worker registration failed', err);
        },
      });
    })
    .catch((err) => console.warn('[pwa] unavailable', err));
}

export function usePwaUpdate(): PwaState & { update: () => Promise<void>; dismiss: () => void } {
  const s = useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => state,
    () => state,
  );
  return { ...s, update: applyPwaUpdate, dismiss: dismissPwaUpdate };
}
