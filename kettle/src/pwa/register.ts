/**
 * Service worker registration + update prompt. OWNER: timer/PWA area.
 *
 *   registerPwa()     called from boot; no-op in dev and where SWs aren't available
 *   usePwaUpdate()    { needRefresh, offlineReady, update(), dismiss() } for an
 *                     "Update" button (ShellOverlays shows the actionable prompt)
 *   useOfflineReady() true once the app shell is cached (this visit or an earlier
 *                     one) — for a quiet "Works offline ✓" line in Settings → About.
 *                     Caching is plumbing, not news: it is never toasted.
 *
 * Updates never reload on their own: a running brew survives a reload anyway,
 * but ambience and animations would restart, so the user decides.
 */
import { useSyncExternalStore } from 'react';

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
  if (!updateSW) {
    location.reload();
    return;
  }
  // workbox-window reloads on 'controlling' only when the page was controlled at
  // registration; cover the first-visit case (and any missed event) ourselves.
  let done = false;
  const reload = () => {
    if (done) return;
    done = true;
    location.reload();
  };
  navigator.serviceWorker?.addEventListener('controllerchange', reload, { once: true });
  await updateSW(true);
  setTimeout(reload, 4000);
}

/** Hide the update prompt ("later"). Offline readiness is a fact, not a notice — it stays. */
export function dismissPwaUpdate(): void {
  patch({ needRefresh: false });
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
          // The actionable update prompt lives in ShellOverlays (usePwaUpdate); no plain toast here.
          patch({ needRefresh: true });
        },
        onOfflineReady() {
          // Deliberately silent (no toast): it lands during onboarding / first load.
          patch({ offlineReady: true });
        },
        onRegisteredSW(_url, reg) {
          patch({ registered: true });
          if (!reg) return;
          // Return visits: the shell was cached on an earlier visit (onOfflineReady won't fire again).
          if (reg.active) patch({ offlineReady: true });
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

/** True once Kettle works offline (shell precached). Quiet status for Settings → About. */
export function useOfflineReady(): boolean {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => state.offlineReady,
    () => false,
  );
}
