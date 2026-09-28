import { lazy, Suspense } from 'react';
import type { NookSceneProps } from './types';
import { NookStatic } from './Fallback';
import { backdropCss, hasWebGL, useSceneTier, useSceneTime, useSceneWeather } from './resolve';
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
      <NookStatic time={time} weather={weather} mode={props.mode} progress={props.progress} items={props.items} />
    </div>
  );
  if (tier === 'off' || !hasWebGL()) return staticNook;
  return (
    <Suspense fallback={staticNook}>
      <LazyScene {...props} />
    </Suspense>
  );
}
