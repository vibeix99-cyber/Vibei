/**
 * Tiny typed event bus used to decouple areas (timer → progress/audio/flow).
 * Add new events here (this file is shared — keep additions small & typed).
 */
import type { Phase } from '@/timer/types';
import type { SessionRecord, CompletionReport } from '@/progress/types';

export interface AppEvents {
  'timer:start': { phase: Phase; durationMs: number; resumed: boolean };
  'timer:pause': { phase: Phase; remainingMs: number };
  'timer:resume': { phase: Phase; remainingMs: number };
  /** A phase ran to zero. For focus phases `record` is the saved session. */
  'timer:complete': { phase: Phase; record: SessionRecord; whileAway: boolean };
  /** User ended a phase early (or skipped). `record` present for focus with ≥1 min. */
  'timer:stop': { phase: Phase; reason: 'user' | 'skip'; record: SessionRecord | null };
  'timer:addTime': { phase: Phase; addedMs: number };
  /** Progress store finished processing a completed focus session. */
  'progress:report': { report: CompletionReport };
  'progress:levelup': { from: number; to: number };
  'progress:badge': { id: string; tier: number };
  'progress:quest': { id: string };
  'progress:streak': { from: number; to: number };
  'ui:toast': { message: string; tone?: 'neutral' | 'success' | 'warning' };
}

type Handler<T> = (payload: T) => void;
// Internally untyped; the public on/emit signatures enforce the payload types.
const handlers = new Map<keyof AppEvents, Set<Handler<unknown>>>();

export function on<K extends keyof AppEvents>(type: K, fn: Handler<AppEvents[K]>): () => void {
  let set = handlers.get(type);
  if (!set) handlers.set(type, (set = new Set()));
  set.add(fn as Handler<unknown>);
  return () => set.delete(fn as Handler<unknown>);
}

export function emit<K extends keyof AppEvents>(type: K, payload: AppEvents[K]): void {
  const set = handlers.get(type);
  set?.forEach((fn) => {
    try {
      fn(payload);
    } catch (err) {
      console.error(`[events] handler for ${type} threw`, err);
    }
  });
}
