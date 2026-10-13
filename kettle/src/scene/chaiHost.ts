/**
 * When and how the nook asks for the Blender Chai (engine/chaiModel.ts, engine/chaiLoad.ts). Lives in the 3D chunk;
 * the loader itself (GLTFLoader + meshopt decoder + the .glb) is a further dynamic import, fetched only when wanted.
 *
 * Policy (CHAI-3D-SPEC §6.2):
 *  - the procedural Chai is always built first; the model replaces it once loaded and validated;
 *  - only engines that can show Chai ask for it: never the `window` view (Focus backdrop, Chai out of frame);
 *  - tier: see `MODEL_ON_LOW`; 3D off / no WebGL has no engine, so no model (the static drawing is unchanged);
 *  - any failure (HTTP error, offline without the precache, timeout, invalid file) keeps the procedural Chai.
 */
import type { ChaiTemplate } from './engine/chaiModel';
import type { ChaiLoadState } from './engine/chaiLoad';
import type { Quality } from './engine/Engine';
import { chaiModelOverride, debugOn } from './resolve';

/**
 * The low tier (CPU rasterizers, weak phones, save-data) shows the model too (Vibei, W2R2 sign-off): it draws fewer
 * triangles and draw calls than the procedural Chai, and measured no slower on SwiftShader, the slowest renderer
 * (packet W2R2/C and C/low). On the low tier its materials are liteified like every other prop (the fur keeps PBR, as
 * the procedural fur does). The procedural Chai stays the first frame and the fallback on every tier.
 */
export const MODEL_ON_LOW = true;

export function chaiModelWanted(quality: Quality | 'off'): boolean {
  const o = chaiModelOverride();
  if (o) return o === 'model' && quality !== 'off';
  return quality === 'high' || (quality === 'low' && MODEL_ON_LOW);
}

let mod: typeof import('./engine/chaiLoad') | null = null;

/** Start (or join) the model load. Never rejects: null keeps the procedural Chai. */
export function startChaiLoad(): Promise<ChaiTemplate | null> {
  return import('./engine/chaiLoad')
    .then((m) => {
      mod = m;
      return m.loadChaiModel({ debug: debugOn() });
    })
    .catch((e: Error) => {
      if (debugOn()) console.info('[chai3d] loader chunk failed, keeping the procedural Chai:', e.message);
      return null;
    });
}

/** The parsed model if it is already in memory. */
export function readyChai(): ChaiTemplate | null {
  return mod?.chaiTemplate() ?? null;
}

export function chaiStatus(): ChaiLoadState {
  return mod?.chaiLoadState() ?? { state: 'idle' };
}
