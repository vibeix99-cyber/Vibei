/** Small shared helpers for the UI kit. OWNER: design-system area. */
import { useSyncExternalStore, type ReactNode } from 'react';
import { Icon, type IconName } from '@/art';

export type Tone = 'persimmon' | 'matcha' | 'honey' | 'sky' | 'berry' | 'plum';
export const TONES: Tone[] = ['persimmon', 'matcha', 'honey', 'sky', 'berry', 'plum'];

/** Class-name joiner. */
export function cx(...parts: (string | false | null | undefined)[]): string {
  return parts.filter(Boolean).join(' ');
}

/** An icon slot accepts an `IconName` from `@/art` or any node. */
export type IconSlot = IconName | ReactNode;

export function renderIcon(icon: IconSlot, size: number): ReactNode {
  if (icon == null || icon === false) return null;
  if (typeof icon === 'string') return <Icon name={icon as IconName} size={size} />;
  return icon;
}

const mqlCache = new Map<string, MediaQueryList>();
function getMql(query: string): MediaQueryList | null {
  if (typeof window === 'undefined' || !window.matchMedia) return null;
  let m = mqlCache.get(query);
  if (!m) mqlCache.set(query, (m = window.matchMedia(query)));
  return m;
}

/** Subscribe to a media query. */
export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (cb) => {
      const m = getMql(query);
      m?.addEventListener('change', cb);
      return () => m?.removeEventListener('change', cb);
    },
    () => getMql(query)?.matches ?? false,
    () => false,
  );
}

export const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
