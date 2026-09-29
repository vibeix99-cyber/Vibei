/**
 * Engine creation + off-screen pre-warming. Building the room, creating the
 * WebGL context and compiling ~dozens of shader programs costs hundreds of ms
 * on weak / GPU-less machines; done while a brew starts it froze the timer.
 * So Home warms one engine while idle (detached canvas, programs compiled a
 * few per task) and the next mounted nook adopts it. Lives in the three.js
 * chunk; `scene/index.tsx` reaches it through a dynamic import.
 */
import { NookEngine, nextTask, type EngineState, type Quality } from './engine/Engine';

export interface EngineSpec {
  quality: Quality;
  adaptive: boolean;
  mobile: boolean;
  software: boolean;
}

/** How long a freshly mounted nook shows its static art before touching the GPU (entry animation). */
export const SETTLE_MS = 650;

const keyOf = (s: EngineSpec) => `${s.quality}|${s.adaptive}|${s.mobile}|${s.software}`;

let slot: { engine: NookEngine; key: string; ready: Promise<boolean> } | null = null;

export function createEngine(spec: EngineSpec): NookEngine {
  // A fresh canvas per engine: the old one's context is force-freed on dispose.
  const canvas = document.createElement('canvas');
  canvas.setAttribute('aria-hidden', 'true');
  canvas.style.cssText = 'display:block;width:100%;height:100%;outline:none';
  return new NookEngine({ canvas, quality: spec.quality, adaptive: spec.adaptive, mobile: spec.mobile, software: spec.software });
}

/**
 * Build an engine off-screen and compile its programs in small slices, for the
 * next nook with the same spec to adopt. Idempotent; a different spec replaces
 * the warm engine.
 */
export function prewarm(spec: EngineSpec, state: Partial<EngineState>): void {
  const key = keyOf(spec);
  if (slot?.key === key) {
    const { engine } = slot;
    engine.setState(state);
    // New items may bring new materials: compile those too (the rest are cache hits).
    slot.ready = slot.ready.then((ok) => ok && engine.warm(nextTask));
    return;
  }
  slot?.engine.dispose();
  slot = null;
  let engine: NookEngine;
  try {
    engine = createEngine(spec);
  } catch {
    return;
  }
  const { items, ...rest } = state;
  // Items get a task of their own; then shaders compile a few per task; then one
  // tiny frame builds the shadow map (+ its depth programs).
  const compiled = engine.warm(nextTask, () => items && engine.setState({ items }));
  engine.setState(rest);
  engine.setSize(64, 64, 1); // tiny drawing buffer until a host sizes it
  const ready = compiled.then(async (ok) => {
    if (!ok) return false;
    await nextTask();
    engine.invalidate();
    return true;
  });
  slot = { engine, key, ready };
}

/**
 * Park a still-usable engine from an unmounting nook for the next mount to adopt, instead of
 * disposing it. Disposing (freeing the context and every program) blocked the main thread
 * ~700 ms right at the whistle → celebration hand-off on slow GPUs. Returns false if the slot
 * is taken or the engine can't be reused (the caller should then dispose it).
 */
export function stash(engine: NookEngine, spec: EngineSpec): boolean {
  if (slot || !engine.usable) return false;
  engine.setRunning(false);
  engine.detachInput();
  slot = { engine, key: keyOf(spec), ready: Promise.resolve(true) };
  return true;
}

/** Hand over the warm engine if it matches `spec` (a mismatched one is discarded). */
export function takeWarm(spec: EngineSpec): { engine: NookEngine; ready: Promise<boolean> } | null {
  const s = slot;
  slot = null;
  if (!s) return null;
  if (s.key !== keyOf(spec) || !s.engine.usable) {
    s.engine.dispose();
    return null;
  }
  return s;
}

/**
 * Resolve once the page has settled: at least `minMs`, then a run of smooth
 * animation frames (the compositor / GPU process isn't backed up, so creating
 * a context or resizing a canvas won't stall on it), then an idle moment.
 * Gives up waiting after `maxMs`.
 */
export function settled(minMs: number, maxMs = minMs + 2500): Promise<void> {
  return new Promise((resolve) => {
    const w = window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number };
    const t0 = performance.now();
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      window.clearTimeout(cap);
      if (w.requestIdleCallback) w.requestIdleCallback(() => resolve(), { timeout: 500 });
      else setTimeout(resolve, 0);
    };
    const cap = window.setTimeout(finish, maxMs);
    let last = 0;
    let smooth = 0;
    const frame = (now: number) => {
      if (done) return;
      if (last) smooth = now - last < 40 ? smooth + 1 : 0;
      last = now;
      if (now - t0 >= minMs && smooth >= 8) finish();
      else requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  });
}
