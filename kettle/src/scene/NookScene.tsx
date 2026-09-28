/**
 * The cozy 3D nook — React host for the three.js engine. Only ever imported
 * through `scene/index.tsx`'s lazy wrapper so three.js stays in its own chunk.
 */
import { useEffect, useRef, useState } from 'react';
import type { NookSceneProps } from './types';
import { NookEngine } from './engine/Engine';
import { backdropCss, debugOn, isMobileDevice, useDebugItems, useReducedMotion, useSceneTier, useSceneTime, useSceneWeather } from './resolve';
import { NookStatic } from './Fallback';

export default function NookScene(props: NookSceneProps) {
  const items = useDebugItems(props.items);
  const { mode, progress = 0, whistling = false, highlightItem = null, interactive = false, paused = false, className, backdrop = true } = props;
  const time = useSceneTime(props.timeOfDay);
  const weather = useSceneWeather(props.weather);
  const reduced = useReducedMotion();
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

  const applyRun = () => {
    const e = engineRef.current;
    if (!e) return;
    const g = gate.current;
    e.setRunning(g.visible && g.onscreen && !latest.current.paused && !latest.current.reduced);
  };

  // ---- create / destroy the engine
  useEffect(() => {
    const canvasHost = canvasHostRef.current;
    const host = hostRef.current;
    if (!canvasHost || !host || tier === 'off') return;
    // A fresh canvas per engine: the old one's context is force-freed on dispose.
    const canvas = document.createElement('canvas');
    canvas.setAttribute('aria-hidden', 'true');
    canvas.style.cssText = 'display:block;width:100%;height:100%;outline:none';
    canvasHost.appendChild(canvas);
    let engine: NookEngine;
    try {
      engine = new NookEngine({
        canvas,
        quality: tier,
        adaptive,
        mobile: isMobileDevice(),
        onItemSelect: (id) => selectRef.current?.(id),
        onFirstFrame: () => setReady(true),
        onContextLost: () => {
          setReady(false);
          setFailed(true);
        },
      });
    } catch {
      canvas.remove();
      setFailed(true);
      return;
    }
    engineRef.current = engine;
    engine.setState({ mode, progress, whistling, weather, time, items, highlightItem, interactive, reducedMotion: reduced });
    engine.attachInput();

    const size = () => {
      const r = host.getBoundingClientRect();
      engine.setSize(r.width, r.height, window.devicePixelRatio || 1);
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
    if (debugOn()) (window as unknown as { __nook?: unknown }).__nook = engine;

    return () => {
      ro.disconnect();
      io.disconnect();
      document.removeEventListener('visibilitychange', onVis);
      canvas.removeEventListener('webglcontextrestored', onRestore);
      engine.dispose();
      canvas.remove();
      engineRef.current = null;
      setReady(false);
      const w = window as unknown as { __nook?: unknown };
      if (w.__nook === engine) delete w.__nook;
    };
    // Engine is rebuilt only for tier changes / context restore; props flow via setState below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tier, generation]);

  // ---- props → engine
  useEffect(() => {
    engineRef.current?.setState({ mode, progress, whistling, weather, time, items, highlightItem, interactive, reducedMotion: reduced });
  }, [mode, progress, whistling, weather, time, items, highlightItem, interactive, reduced]);

  useEffect(() => {
    applyRun();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paused, reduced, ready]);

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
        background: backdrop ? backdropCss(time) : undefined,
      }}
    >
      {(!ready || showStatic) && (
        <div aria-hidden style={{ position: 'absolute', inset: 0 }}>
          <NookStatic weather={weather} mode={mode} progress={progress} items={items} />
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
            transition: reduced ? 'none' : 'opacity 420ms ease',
            pointerEvents: interactive ? 'auto' : 'none',
          }}
        />
      )}
    </div>
  );
}
