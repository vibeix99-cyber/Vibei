/**
 * The animated Chai (Rive). OWNER: art area. Loaded ONLY through `import()` from `LiveChai.tsx`, so neither the
 * runtime (`@rive-app/canvas`) nor its wasm is in the initial bundle or on the first paint.
 *
 * Source: `art-src/chai/rive/chai.riv` (copied byte-for-byte to `src/art/chai/chai.riv`; Vite hashes it, Workbox
 * precaches it). Artboard `Chai` 1312x1586, state machine `Chai`, pose = view-model number `pose` (0 reading,
 * 1 sipping, 2 cheering; -1 unset), with the state-machine number input `pose` as the fallback.
 *
 * Two runtime adjustments, both checked (a miss is a load error, so the painted image stays):
 * - The artboard has an opaque cream "Background" fill (FFFDF9F1). The app composites Chai on light and dark
 *   surfaces, so that one fill's alpha is set to 0 in the loaded bytes before parsing (see `clearBackground`).
 * - The file's own `groundShadow` (an opaque cream ellipse) is collapsed (scaleY 0; scaleY is never keyed in the
 *   file). The Focus stage keeps its theme-aware CSS contact shadow (`.cShadow`); elsewhere the painted Chai never
 *   had a shadow. So no doubled shadow and no light disc on the dark theme.
 */
import { Rive, RuntimeLoader, Layout, Fit, Alignment, EventType } from '@rive-app/canvas';
import wasmUrl from '@rive-app/canvas/rive.wasm?url';
import rivUrl from '../chai/chai.riv?url';
import { clearBackground } from './clearBackground';

export type { RivePose } from './pose';
import type { RivePose } from './pose';

/** Device-pixel-ratio cap for the drawing surface (crisp on 2x screens; 3x phones draw at 2x). */
export const DPR_CAP = 2;

let fileBytes: Promise<ArrayBuffer> | null = null;
function loadFile(): Promise<ArrayBuffer> {
  if (!fileBytes) {
    fileBytes = fetch(rivUrl)
      .then((r) => {
        if (!r.ok) throw new Error(`chai.riv ${r.status}`);
        return r.arrayBuffer();
      })
      .then((b) => {
        clearBackground(new Uint8Array(b));
        return b;
      });
    fileBytes.catch(() => (fileBytes = null));
  }
  return fileBytes;
}

let runtimeReady: Promise<unknown> | null = null;
function loadRuntime(): Promise<unknown> {
  if (!runtimeReady) {
    // Self-hosted wasm only: never the CDN fallback.
    RuntimeLoader.setWasmUrl(wasmUrl);
    RuntimeLoader.setWasmFallbackUrl(null);
    runtimeReady = RuntimeLoader.awaitInstance();
    runtimeReady.catch(() => (runtimeReady = null));
  }
  return runtimeReady;
}

export interface ChaiHandle {
  setPose(pose: RivePose): void;
  /** Play or pause (pausing also stops the render loop). */
  setRunning(on: boolean): void;
  /** Re-fit the drawing surface to the canvas' CSS size (capped DPR). */
  resize(): void;
  destroy(): void;
}

interface Options {
  pose: RivePose;
  running: boolean;
  /** Called once Chai is drawn in the requested pose (the caller swaps the image out then). */
  onReady(): void;
  onError(err: unknown): void;
}

/** Running time the state machine needs from its entry pose (reading) to settle in each pose, in ms, with margin
 * (measured frame strips: reading -> sipping settles by ~1.65 s, reading -> cheering by ~2.3 s). */
const SETTLE_MS: Record<RivePose, number> = { 0: 0, 1: 2000, 2: 2700 };

/** `?debug` builds expose the live instances (frame counts for the perf checks). */
const debugList = (): Rive[] | null =>
  typeof location !== 'undefined' && /[?&]debug\b/.test(location.search) ? ((window as unknown as { __riveChai?: Rive[] }).__riveChai ??= []) : null;

type PrivateArtboard = { artboard?: { transformComponent(name: string): { scaleY: number } | null } | null };

export function mountChai(canvas: HTMLCanvasElement, opts: Options): ChaiHandle {
  let r: Rive | null = null;
  let dead = false;
  let pose = opts.pose;
  let running = opts.running;
  let settle = 0;
  let loaded = false;
  let revealed = false;

  /** Reveal once Chai has been running long enough to settle in the requested pose (the state machine enters on
   * reading; other poses blend in through rest), and a frame has been drawn. Only counts running time. */
  const scheduleReveal = () => {
    if (revealed || !r || dead) return;
    window.clearTimeout(settle);
    const inst = r;
    settle = window.setTimeout(() => {
      if (dead || !running || r !== inst) return;
      const onAdvance = () => {
        inst.off(EventType.Advance, onAdvance);
        requestAnimationFrame(() => {
          if (dead || revealed) return;
          revealed = true;
          opts.onReady();
        });
      };
      inst.on(EventType.Advance, onAdvance);
    }, SETTLE_MS[pose]);
  };

  const fail = (e: unknown) => {
    if (dead) return;
    destroy();
    opts.onError(e);
  };

  const applyPose = () => {
    if (!r) return;
    const vm = r.viewModelInstance?.number('pose');
    if (vm) vm.value = pose;
    else {
      const input = r.stateMachineInputs('Chai')?.find((i) => i.name === 'pose');
      if (!input) throw new Error('chai.riv: no pose property or input');
      input.value = pose;
    }
  };

  const resize = () => {
    if (!r || dead) return;
    const dpr = Math.min(window.devicePixelRatio || 1, DPR_CAP);
    const w = Math.max(1, Math.round(canvas.offsetWidth * dpr));
    const h = Math.max(1, Math.round(canvas.offsetHeight * dpr));
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
      r.devicePixelRatioUsed = dpr;
      r.resizeToCanvas();
      r.drawFrame();
    }
  };

  const applyRunning = () => {
    if (!r) return;
    if (running) r.play();
    else {
      r.pause();
      r.stopRendering();
    }
  };

  Promise.all([loadRuntime(), loadFile()])
    .then(([, bytes]) => {
      if (dead) return;
      const inst: Rive = new Rive({
        buffer: bytes.slice(0),
        canvas,
        stateMachine: 'Chai',
        autoplay: running,
        autoBind: true,
        layout: new Layout({ fit: Fit.Contain, alignment: Alignment.Center }),
        enableRiveAssetCDN: false,
        shouldDisableRiveListeners: true,
        onLoadError: (e) => fail(e),
        onLoad: () => {
          if (dead) return;
          r = inst; // onLoad can run inside the constructor when the runtime is already loaded
          try {
            const ab = (inst as unknown as PrivateArtboard).artboard;
            if (!ab) throw new Error('rive: no artboard');
            const shadow = ab.transformComponent('groundShadow');
            if (shadow) shadow.scaleY = 0;
            applyPose();
            resize();
            applyRunning();
          } catch (e) {
            fail(e);
            return;
          }
          loaded = true;
          if (running) scheduleReveal();
        },
      });
      if (!dead) {
        r = inst;
        debugList()?.push(inst);
      }
    })
    .catch(fail);

  function destroy() {
    dead = true;
    window.clearTimeout(settle);
    const list = debugList();
    if (list && r) list.splice(list.indexOf(r) >>> 0, 1);
    try {
      r?.cleanup();
    } catch {
      /* already torn down */
    }
    r = null;
  }

  return {
    setPose(p) {
      if (p === pose) return;
      pose = p;
      try {
        applyPose();
      } catch (e) {
        fail(e);
        return;
      }
      if (loaded && running && !revealed) scheduleReveal(); // not up yet: wait for the new pose to settle
    },
    setRunning(on) {
      if (on === running) return;
      running = on;
      applyRunning();
      if (!on) window.clearTimeout(settle);
      else if (loaded) scheduleReveal();
    },
    resize,
    destroy,
  };
}
