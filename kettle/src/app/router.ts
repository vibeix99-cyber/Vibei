/**
 * Tiny hash router (works on any static host, file://, and inside iframes).
 * Routes are a closed set — add new ones here.
 */
import { useSyncExternalStore } from 'react';

export const ROUTES = ['/', '/stats', '/nook', '/settings', '/focus', '/done', '/welcome'] as const;
export type Route = (typeof ROUTES)[number];
export const TAB_ROUTES: Route[] = ['/', '/stats', '/nook', '/settings'];

function parse(): Route {
  const raw = (typeof location !== 'undefined' ? location.hash.replace(/^#/, '') : '/') || '/';
  const path = raw.split('?')[0];
  return (ROUTES as readonly string[]).includes(path) ? (path as Route) : '/';
}

const listeners = new Set<() => void>();
let current: Route = typeof window !== 'undefined' ? parse() : '/';

if (typeof window !== 'undefined') {
  window.addEventListener('hashchange', () => {
    current = parse();
    listeners.forEach((l) => l());
  });
}

export function navigate(to: Route, opts: { replace?: boolean } = {}): void {
  if (to === current) return;
  const url = `${location.pathname}${location.search}#${to}`;
  if (opts.replace) history.replaceState(null, '', url);
  else history.pushState(null, '', url);
  current = to;
  listeners.forEach((l) => l());
}

export function getRoute(): Route {
  return current;
}

export function useRoute(): Route {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => current,
    () => '/',
  );
}
