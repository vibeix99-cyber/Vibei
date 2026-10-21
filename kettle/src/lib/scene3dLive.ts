import { useSyncExternalStore } from 'react';

/**
 * Which 3D Nook engines are running right now (render loop on). The animated Rive Chai pauses while any 3D scene
 * runs, so the two never animate at the same time (the summary's unlock showcase sits over the Focus stage).
 */
const running = new Set<object>();
const subs = new Set<() => void>();

export function setScene3dRunning(owner: object, on: boolean): void {
  const had = running.has(owner);
  if (on === had) return;
  if (on) running.add(owner);
  else running.delete(owner);
  subs.forEach((f) => f());
}

export function subscribeScene3d(cb: () => void): () => void {
  subs.add(cb);
  return () => subs.delete(cb);
}
export const isScene3dRunning = (): boolean => running.size > 0;

export function useScene3dRunning(): boolean {
  return useSyncExternalStore(subscribeScene3d, isScene3dRunning, () => false);
}
