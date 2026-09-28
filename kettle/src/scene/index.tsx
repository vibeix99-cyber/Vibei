import { lazy, Suspense, useEffect } from 'react';
import type { NookSceneProps } from './types';
import { NookStatic } from './Fallback';
import { backdropCss, hasWebGL, isMobileDevice, softwareGL, useReducedMotion, useSceneTier, useSceneTime, useSceneWeather } from './resolve';
export type { NookSceneProps, SceneMode, SceneWeather, SceneTime } from './types';

const LazyScene = lazy(() => import('./NookScene'));

/**
 * The cozy nook. Lazy-loads the three.js scene; shows a matching flat
 * illustration while loading, when 3D is off (settings.scene), or without WebGL.
 */
export function Nook(props: NookSceneProps) {
  const { tier } = useSceneTier();
  const time = useSceneTime(props.timeOfDay);
  const weather = useSceneWeather(props.weather);
  const staticNook = (
    <div
      className={props.className}
      aria-hidden
      data-scene-mode={props.mode}
      data-scene-static="true"
      style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden', background: props.backdrop === false ? undefined : backdropCss(time) }}
    >
      <NookStatic weather={weather} mode={props.mode} progress={props.progress} items={props.items} />
    </div>
  );
  if (tier === 'off' || !hasWebGL()) return staticNook;
  return (
    <Suspense fallback={staticNook}>
      <LazyScene {...props} />
    </Suspense>
  );
}

/**
 * Warm the 3D nook while this screen idles (Home): loads three.js, builds the
 * room off-screen and compiles its shaders in small slices, so starting a brew
 * doesn't stall on it. The next mounted `Nook` adopts the warm engine.
 */
export function usePrewarmNook(items: string[]): void {
  const { tier, adaptive } = useSceneTier();
  const time = useSceneTime('auto');
  const weather = useSceneWeather();
  const reduced = useReducedMotion();
  useEffect(() => {
    if (tier === 'off' || typeof window === 'undefined') return;
    let cancelled = false;
    let idleId = 0;
    const w = window as Window & {
      requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number;
      cancelIdleCallback?: (id: number) => void;
    };
    const run = () => {
      if (cancelled || !hasWebGL()) return;
      void import('./NookScene')
        // Wait for a calm page (boot / entry animations done) so the context doesn't stall on the GPU.
        .then(async (m) => {
          await m.settled(600, 5000);
          if (cancelled) return;
          m.prewarm(
            { quality: tier, adaptive, mobile: isMobileDevice(), software: softwareGL() },
            { mode: 'focus', progress: 0, items, weather, time, reducedMotion: reduced },
          );
        })
        .catch(() => {});
    };
    const t = window.setTimeout(() => {
      if (w.requestIdleCallback) idleId = w.requestIdleCallback(run, { timeout: 2000 });
      else run();
    }, 400);
    return () => {
      cancelled = true;
      window.clearTimeout(t);
      if (idleId) w.cancelIdleCallback?.(idleId);
    };
  }, [tier, adaptive, items, weather, time, reduced]);
}
