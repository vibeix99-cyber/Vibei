/**
 * Kettle service worker (vite-plugin-pwa, injectManifest). OWNER: timer/PWA area.
 *
 *  - Precaches the app shell, fonts, icons and the lazy three.js chunk → offline works.
 *  - Serves index.html for any navigation (hash routing, so one page is enough).
 *  - Updates wait for the page to say SKIP_WAITING (registerType: 'prompt').
 *  - notificationclick focuses an open Kettle tab, or opens one.
 *
 * Type-checked with the DOM lib (the shared tsconfig), so the few service-worker
 * APIs used here are described locally.
 */
import { precacheAndRoute, cleanupOutdatedCaches, createHandlerBoundToURL } from 'workbox-precaching';
import { NavigationRoute, registerRoute } from 'workbox-routing';
import { clientsClaim } from 'workbox-core';

type ManifestEntry = string | { url: string; revision: string | null };

declare global {
  interface Window {
    /** Replaced with the precache manifest at build time. */
    __WB_MANIFEST: ManifestEntry[];
  }
}

interface ExtendableEventLike extends Event {
  waitUntil(p: Promise<unknown>): void;
}
interface NotificationEventLike extends ExtendableEventLike {
  notification: { close(): void; data?: { url?: string } };
}
interface WindowClientLike {
  url: string;
  focused: boolean;
  focus(): Promise<unknown>;
}
interface ServiceWorkerScopeLike {
  registration: { scope: string };
  clients: {
    matchAll(o: { type: 'window'; includeUncontrolled: boolean }): Promise<WindowClientLike[]>;
    openWindow(url: string): Promise<unknown>;
  };
  skipWaiting(): Promise<void>;
  addEventListener(type: 'message', fn: (e: MessageEvent<{ type?: string } | null>) => void): void;
  addEventListener(type: 'notificationclick', fn: (e: NotificationEventLike) => void): void;
}

const sw = self as unknown as ServiceWorkerScopeLike;

cleanupOutdatedCaches();
precacheAndRoute(self.__WB_MANIFEST);
registerRoute(new NavigationRoute(createHandlerBoundToURL('index.html')));
clientsClaim();

sw.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') void sw.skipWaiting();
});

sw.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    (async () => {
      const scope = sw.registration.scope;
      const all = await sw.clients.matchAll({ type: 'window', includeUncontrolled: true });
      const ours = all.filter((c) => c.url.startsWith(scope));
      const client = ours.find((c) => c.focused) ?? ours[0] ?? all[0];
      if (client) {
        await client.focus();
        return;
      }
      await sw.clients.openWindow(event.notification.data?.url ?? scope);
    })(),
  );
});
