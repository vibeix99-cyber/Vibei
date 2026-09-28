/**
 * The cozy 3D nook — PLACEHOLDER. OWNER: scene area.
 * Real implementation: Three.js, lazy-loaded (this module must only be
 * imported through `scene/index.tsx`'s lazy wrapper).
 */
import type { NookSceneProps } from './types';

export default function NookScene({ className, mode }: NookSceneProps) {
  return (
    <div
      className={className}
      data-scene-mode={mode}
      aria-hidden
      style={{ width: '100%', height: '100%', background: 'linear-gradient(#3b3158, #5a4a7a)', borderRadius: 24 }}
    />
  );
}
