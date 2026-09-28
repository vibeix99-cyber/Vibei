import { lazy, Suspense } from 'react';
import type { NookSceneProps } from './types';
export type { NookSceneProps, SceneMode, SceneWeather, SceneTime } from './types';

const LazyScene = lazy(() => import('./NookScene'));

/** Lazy-loaded 3D nook with a static fallback while three.js loads. */
export function Nook(props: NookSceneProps) {
  return (
    <Suspense fallback={<div className={props.className} aria-hidden style={{ width: '100%', height: '100%' }} />}>
      <LazyScene {...props} />
    </Suspense>
  );
}
