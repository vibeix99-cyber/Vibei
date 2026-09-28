/**
 * Tick worker. OWNER: timer area.
 *
 * Main-thread timers in background tabs are throttled (to once a minute after a
 * while in Chrome). Dedicated-worker timers are not, so the ticker asks this
 * worker to wake it up at the right moments. The worker only keeps time — all
 * timer logic stays on the main thread (and uses `clock.now()`).
 *
 * Protocol: in  { t: 'set', id, ms } | { t: 'clear', id } | { t: 'ping' }
 *           out { t: 'fire', id }     | { t: 'pong' }
 */
type In = { t: 'set'; id: number; ms: number } | { t: 'clear'; id: number } | { t: 'ping' };

interface WorkerScope {
  onmessage: ((e: MessageEvent<In>) => void) | null;
  postMessage(msg: unknown): void;
}

const scope = self as unknown as WorkerScope;
const timers = new Map<number, ReturnType<typeof setTimeout>>();

function clear(id: number) {
  const h = timers.get(id);
  if (h !== undefined) clearTimeout(h);
  timers.delete(id);
}

scope.onmessage = (e) => {
  const m = e.data;
  if (m.t === 'set') {
    clear(m.id);
    timers.set(
      m.id,
      setTimeout(() => {
        timers.delete(m.id);
        scope.postMessage({ t: 'fire', id: m.id });
      }, Math.max(0, m.ms)),
    );
  } else if (m.t === 'clear') {
    clear(m.id);
  } else if (m.t === 'ping') {
    scope.postMessage({ t: 'pong' });
  }
};
