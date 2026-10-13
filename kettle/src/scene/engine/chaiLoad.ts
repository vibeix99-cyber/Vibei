/**
 * Fetch, decode and validate the Blender Chai (`./models/chai.glb`, a byte-identical runtime copy of
 * `art-src/chai/chai.glb`). Imported dynamically, so `GLTFLoader` and the meshopt decoder live in their own lazy
 * chunk (vite.config.ts `manualChunks`) and the first 3D frame never waits for them.
 *
 * One parse per page: the template is cached at module level and every engine clones it (a WebGL context loss
 * rebuilds the engine from the cache, with no new request). A network failure or a timeout is not cached, so the
 * next mount tries again (e.g. back online); a model that fails validation stays rejected for the page's life.
 * Failures keep the procedural Chai and are logged only under `?debug`.
 */
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';
import chaiUrl from './models/chai.glb?url';
import { ChaiModelError, validateChai, type ChaiTemplate } from './chaiModel';

/** Give up on the model after this long (request + body): the procedural Chai stays (CHAI-3D-SPEC §6.2). */
export const CHAI_TIMEOUT_MS = 8000;

export type ChaiLoadState =
  | { state: 'idle' }
  | { state: 'loading'; since: number }
  | { state: 'ready'; ms: number; bytes: number }
  | { state: 'failed'; reason: string; ms: number };

let pending: Promise<ChaiTemplate | null> | null = null;
let ready: ChaiTemplate | null = null;
let rejected = false;
let status: ChaiLoadState = { state: 'idle' };

/** The parsed template if it is already in memory (no waiting). */
export function chaiTemplate(): ChaiTemplate | null {
  return ready;
}

export function chaiLoadState(): ChaiLoadState {
  return status;
}

export { chaiUrl };

/** Start (or join) the one load of the model. Resolves null on any failure; never rejects. */
export function loadChaiModel(opts: { debug?: boolean; timeoutMs?: number } = {}): Promise<ChaiTemplate | null> {
  if (ready) return Promise.resolve(ready);
  if (rejected) return Promise.resolve(null);
  if (pending) return pending;
  const t0 = performance.now();
  status = { state: 'loading', since: t0 };
  const ctrl = new AbortController();
  const timeoutMs = opts.timeoutMs ?? CHAI_TIMEOUT_MS;
  const timer = setTimeout(() => ctrl.abort(new DOMException(`timed out after ${timeoutMs} ms`, 'TimeoutError')), timeoutMs);
  pending = (async () => {
    let bytes = 0;
    try {
      const res = await fetch(chaiUrl, { signal: ctrl.signal });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const buf = await res.arrayBuffer();
      clearTimeout(timer);
      bytes = buf.byteLength;
      const loader = new GLTFLoader();
      loader.setMeshoptDecoder(MeshoptDecoder);
      await MeshoptDecoder.ready;
      const gltf = await loader.parseAsync(buf, '');
      const node = gltf.scene.getObjectByName('chai');
      if (!node) throw new ChaiModelError('missing node "chai"');
      node.removeFromParent();
      node.updateMatrixWorld(true);
      const check = validateChai(node);
      ready = { node, check };
      status = { state: 'ready', ms: Math.round(performance.now() - t0), bytes };
      if (opts.debug) console.info('[chai3d] model ready', status, check);
      return ready;
    } catch (e) {
      clearTimeout(timer);
      const err = e as Error;
      const reason = ctrl.signal.aborted ? `timeout (${timeoutMs} ms)` : err instanceof ChaiModelError ? `invalid: ${err.message}` : `${err.name}: ${err.message}`;
      if (err instanceof ChaiModelError) rejected = true;
      status = { state: 'failed', reason, ms: Math.round(performance.now() - t0) };
      if (opts.debug) console.info('[chai3d] keeping the procedural Chai:', reason);
      return null;
    } finally {
      pending = null;
    }
  })();
  return pending;
}
