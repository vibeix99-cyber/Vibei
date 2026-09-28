/**
 * The cozy 3D nook — React host for the three.js engine. Only ever imported
 * through `scene/index.tsx`'s lazy wrapper so three.js stays in its own chunk.
 */
import { useEffect, useRef, useState } from 'react';
import type { NookSceneProps } from './types';
import { nextTask, type EngineState, type NookEngine } from './engine/Engine';
import { DARK_DIM, backdropCss, debugOn, isMobileDevice, softwareGL, useDarkTheme, useDebugItems, useReducedMotion, useSceneTier, useSceneTime, useSceneWeather } from './resolve';
import { SETTLE_MS, createEngine, settled, takeWarm, type EngineSpec } from './warm';
import { NookStatic } from './Fallback';

/** Canvas fade-in over the static nook. */
const FADE_MS = 420;

export default function NookScene(props: NookSceneProps) {
  const items = useDebugItems(props.items);
  const { mode, progress = 0, whistling = false, highlightItem = null, interactive = false, paused = false, className, backdrop = true } = props;
  const time = useSceneTime(props.timeOfDay);
  const weather = useSceneWeather(props.weather);
  const reduced = useReducedMotion();
  const dark = useDarkTheme();
  const { tier, adaptive } = useSceneTier();
  const canvasHostRef = useRef<HTMLDivElement>(null);
  const hostRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<NookEngine | null>(null);
  const selectRef = useRef(props.onItemSelect);
  selectRef.current = props.onItemSelect;
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [generation, setGeneration] = useState(0);
  const gate = useRef({ visible: true, onscreen: true });
  const latest = useRef({ paused, reduced });
  latest.current = { paused, reduced };
  const latestState = useRef<Partial<EngineState>>({});
  const dim = dark ? DARK_DIM : 1;
  latestState.current = { mode, progress, whistling, weather, time, items, highlightItem, interactive, reducedMotion: reduced, dim };

  const applyRun = () => {
    const e = engineRef.current;
    if (!e) return;
    const g = gate.current;
    e.setRunning(g.visible && g.onscreen && !latest.current.paused && !latest.current.reduced);
  };

  // ---- create (or adopt a pre-warmed) engine / destroy it
  useEffect(() => {
    const canvasHost = canvasHostRef.current;
    const host = hostRef.current;
    if (!canvasHost || !host || tier === 'off') return;
    const spec: EngineSpec = { quality: tier, adaptive, mobile: isMobileDevice(), software: softwareGL() };
    const handlers = {
      onItemSelect: (id: string | null) => selectRef.current?.(id),
      onFirstFrame: () => setReady(true),
      onContextLost: () => {
        setReady(false);
        setFailed(true);
      },
    };
    let alive = true;
    let engine: NookEngine | null = null;
    const undo: (() => void)[] = [];
    const warm = takeWarm(spec);

    void (async () => {
      // The static nook covers the entry animation; GPU work (context, resize, first
      // frame) waits until it has settled so it never stalls the screen change.
      await settled(generation === 0 ? SETTLE_MS : 0);
      if (!alive) return;
      let compiled: Promise<boolean>;
      if (warm) {
        engine = warm.engine;
        engine.setState(latestState.current);
        compiled = warm.ready;
      } else {
        try {
          engine = createEngine(spec);
        } catch {
          setFailed(true);
          return;
        }
        const e = engine;
        // Items in a task of their own, then shaders a few per task (no frame until done).
        compiled = e.warm(nextTask, () => e.setState(latestState.current));
        e.setState({ ...latestState.current, items: [] });
      }
      const e = engine;
      e.setHandlers(handlers);
      engineRef.current = e;
      const canvas = e.canvas;
      canvasHost.appendChild(canvas);
      e.attachInput();
      if (!(await compiled) || !alive) return;
      e.rehost();

      const size = () => {
        const r = host.getBoundingClientRect();
        e.setSize(r.width, r.height, window.devicePixelRatio || 1);
      };
      size();
      const ro = new ResizeObserver(size);
      ro.observe(host);
      const io = new IntersectionObserver(
        (entries) => {
          gate.current.onscreen = entries.some((en) => en.isIntersecting);
          applyRun();
        },
        { rootMargin: '64px' },
      );
      io.observe(host);
      const onVis = () => {
        gate.current.visible = document.visibilityState !== 'hidden';
        applyRun();
      };
      document.addEventListener('visibilitychange', onVis);
      onVis();
      const onRestore = () => {
        setFailed(false);
        setGeneration((g) => g + 1);
      };
      canvas.addEventListener('webglcontextrestored', onRestore);
      if (debugOn()) (window as unknown as { __nook?: unknown }).__nook = e;
      undo.push(() => {
        ro.disconnect();
        io.disconnect();
        document.removeEventListener('visibilitychange', onVis);
        canvas.removeEventListener('webglcontextrestored', onRestore);
      });
    })();

    return () => {
      alive = false;
      undo.forEach((f) => f());
      const e = engine ?? warm?.engine;
      if (e) {
        e.dispose();
        e.canvas.remove();
      }
      engineRef.current = null;
      setReady(false);
      const w = window as unknown as { __nook?: unknown };
      if (w.__nook === e) delete w.__nook;
    };
    // Engine is rebuilt only for tier changes / context restore; props flow via setState below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tier, generation]);

  // ---- props → engine
  useEffect(() => {
    engineRef.current?.setState({ mode, progress, whistling, weather, time, items, highlightItem, interactive, reducedMotion: reduced, dim });
  }, [mode, progress, whistling, weather, time, items, highlightItem, interactive, reduced, dim]);

  useEffect(() => {
    applyRun();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paused, reduced, ready]);

  // Cross-fade: the static nook stays mounted under the canvas until the canvas has
  // fully faded in. Unmounting it the moment the first frame landed left only the
  // bare backdrop showing while the canvas was still near opacity 0 — on a busy
  // machine (the level-up card mounts mid-celebration) that read as a blank card.
  const [covered, setCovered] = useState(false);
  useEffect(() => {
    if (!ready) {
      setCovered(false);
      return;
    }
    if (reduced) {
      setCovered(true);
      return;
    }
    // `transitionend` on the canvas host normally ends it; this is the backstop.
    const id = window.setTimeout(() => setCovered(true), FADE_MS + 900);
    return () => window.clearTimeout(id);
  }, [ready, reduced]);

  const showStatic = tier === 'off' || failed;
  return (
    <div
      ref={hostRef}
      className={className}
      data-scene-mode={mode}
      data-scene-ready={ready ? 'true' : 'false'}
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        background: backdrop ? backdropCss(time, dark) : undefined,
      }}
    >
      {(!ready || !covered || showStatic) && (
        <div aria-hidden style={{ position: 'absolute', inset: 0 }}>
          <NookStatic weather={weather} mode={mode} progress={progress} items={items} paused={paused} />
        </div>
      )}
      {tier !== 'off' && (
        <div
          ref={canvasHostRef}
          aria-hidden
          style={{
            position: 'absolute',
            inset: 0,
            visibility: failed ? 'hidden' : 'visible',
            opacity: ready ? 1 : 0,
            transition: reduced ? 'none' : `opacity ${FADE_MS}ms ease`,
            pointerEvents: interactive ? 'auto' : 'none',
          }}
          onTransitionEnd={(e) => {
            if (e.target === e.currentTarget && e.propertyName === 'opacity' && ready) setCovered(true);
          }}
        />
      )}
    </div>
  );
}

export { prewarm, settled } from './warm';
