// I06 placement: does Chai float, sink or overhang on the cushion? Node, the engine's own builders and transforms.
// For every vertex of Chai's underside (local y < 0.08 before the root scale, the `nap` key applied for nap), cast a ray
// straight down onto the cushion's puff mesh and record the gap (vertex y − cushion surface y; negative = pressed in).
// Underside vertices with no cushion below them overhang. Root as Engine.applyLayout: cushion spot, y 0.255, turn 0.62, ×1.12.
//   cd kettle && npx vitest run --config review/product-excellence/contracts/W2R2/C/probes/vitest.config.ts
import { test } from 'vitest';
import { Mesh, Raycaster, Vector3, type Object3D, type Sprite } from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';

(globalThis as any).document ??= { createElement: () => ({ width: 0, height: 0, getContext: () => new Proxy({}, { get: (_t, k) => (k === 'createRadialGradient' || k === 'createLinearGradient' ? () => ({ addColorStop() {} }) : k === 'getImageData' ? () => ({ data: new Uint8ClampedArray(4) }) : () => {}) }) }) };

test('placement on the cushion', async () => {
  const fs: any = await import(`node:${'fs'}`);
  const { Kit } = await import('../../../../../../src/scene/engine/kit');
  const { buildChai } = await import('../../../../../../src/scene/engine/chai');
  const { buildModelChai, validateChai } = await import('../../../../../../src/scene/engine/chaiModel');
  const { BUILDERS } = await import('../../../../../../src/scene/engine/items');
  const { SPOTS } = await import('../../../../../../src/scene/engine/layout');
  const buf = fs.readFileSync(new URL('../../../../../../src/scene/engine/models/chai.glb', import.meta.url).pathname);
  const loader = new GLTFLoader(); loader.setMeshoptDecoder(MeshoptDecoder); await MeshoptDecoder.ready;
  const gltf = await loader.parseAsync(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength), '');
  const node = gltf.scene.getObjectByName('chai')!; node.removeFromParent(); node.updateMatrixWorld(true);
  const kit = new Kit(true);
  const cushion = BUILDERS.cushion(kit, { tableTop: () => ({ x: 0, y: 0.61, z: 0 }) });
  cushion.root.updateMatrixWorld(true);
  // the merged, visible cushion body (puff + piping + button); not the invisible tap proxy, not the blob shadow
  const solids = cushion.root.children.filter((c: any) => c.isMesh && !c.userData.proxy && c.material.visible !== false && !c.material.transparent) as Mesh[];
  if (solids.length === 0) throw new Error('no solid cushion mesh');
  const ray = new Raycaster();
  const Cu = SPOTS.cushion;

  const place = (root: Object3D, scale = 1.12, dz = 0) => {
    root.position.set(Cu.x, 0.255, Cu.z); root.rotation.y = 0.62; root.scale.setScalar(scale);
    if (dz) root.position.add(new Vector3(Math.sin(0.62) * dz, 0, Math.cos(0.62) * dz));
    root.updateMatrixWorld(true);
  };
  const underside = (root: Object3D, nap: boolean, model: boolean) => {
    const pts: Vector3[] = [];
    root.updateMatrixWorld(true);
    root.traverse((o: any) => {
      if (!o.isMesh || o.userData.proxy || o.material?.transparent || !o.geometry.getAttribute('position') || o.geometry.isInstancedBufferGeometry) return;
      for (let p = o; p; p = p.parent) if (!p.visible) return;
      const pos = o.geometry.getAttribute('position');
      const d = model && nap && o.morphTargetDictionary?.nap !== undefined ? o.geometry.morphAttributes.position[o.morphTargetDictionary.nap] : null;
      const toRoot = root.matrixWorld.clone().invert().multiply(o.matrixWorld);
      for (let i = 0; i < pos.count; i++) {
        const v = new Vector3().fromBufferAttribute(pos, i);
        if (d) v.add(new Vector3(d.getX(i), d.getY(i), d.getZ(i)));
        const local = v.clone().applyMatrix4(toRoot);
        if (local.y / root.scale.y < 0.08) pts.push(v.applyMatrix4(o.matrixWorld));
      }
    });
    return pts;
  };
  const measure = (label: string, root: Object3D, nap: boolean, model: boolean) => {
    const pts = underside(root, nap, model);
    const gaps: number[] = []; let over = 0; let overMax = 0; let lowest = Infinity;
    for (const p of pts) {
      lowest = Math.min(lowest, p.y);
      ray.set(new Vector3(p.x, 2, p.z), new Vector3(0, -1, 0));
      const hit = ray.intersectObjects(solids, false)[0];
      const r = Math.hypot(p.x - Cu.x, p.z - Cu.z);
      if (!hit) { over++; overMax = Math.max(overMax, r - 0.57); continue; }
      gaps.push(p.y - hit.point.y);
    }
    gaps.sort((a, b) => a - b);
    const q = (f: number) => +(gaps[Math.min(gaps.length - 1, Math.floor(f * gaps.length))] ?? NaN).toFixed(3);
    // contact = the lowest 5 % of the underside, i.e. what rests on the cushion
    const out = { label, solids: solids.length, underside: pts.length, lowestY: +lowest.toFixed(3), gap: { min: q(0), p05: q(0.05), median: q(0.5), max: q(1) }, overhang: { verts: over, share: +(over / pts.length).toFixed(3), maxBeyondRim: +overMax.toFixed(3) } };
    console.log(JSON.stringify(out));
    return out;
  };
  const results: any[] = [];
  const proc = buildChai(new Kit(true));
  for (const pose of ['awake', 'nap'] as const) { proc.setPose(pose); proc.update(0, 0); place(proc.root); results.push(measure(`procedural ${pose}`, proc.root, pose === 'nap', false)); }
  const tpl = { node, check: validateChai(node) };
  const k2 = new Kit(true); const p2 = buildChai(k2);
  const chai = buildModelChai(k2, tpl, { steam: p2.steam, sprites: p2.sprites as Sprite[] });
  // as shipped (nap includes NAP_FORWARD)
  for (const pose of ['awake', 'nap', 'sip'] as const) { chai.setPose(pose); chai.root.userData.baseY = 0.255; chai.update(0, 0); place(chai.root); results.push(measure(`model ${pose} (as shipped)`, chai.root, pose === 'nap', true)); }
  // nap without the forward shift (the model at its pivot), then the sweep that chose it
  const inner = chai.root.getObjectByName('body')!.parent!;
  chai.setPose('nap'); inner.position.z = 0; chai.update(0, 0);
  // nap alternatives considered: scale, shift toward the face
  for (const [s, dz] of [[1.12, 0], [1.0, 0], [1.12, 0.01], [1.12, 0.02], [1.12, 0.025], [1.12, 0.03], [1.12, 0.035], [1.12, 0.04], [1.12, 0.052 * 1.12], [1.12, 0.08]] as const) { inner.position.z = 0; place(chai.root, s, dz); results.push(measure(`model nap, no NAP_FORWARD, @scale ${s} shift ${dz}`, chai.root, true, true)); }
  fs.writeFileSync(new URL('../placement.json', import.meta.url).pathname, JSON.stringify({ cushionRim: 0.57, cushionTopY: 'lathe top 0.275 at r 0.34, 0.23 at r 0.52, 0.16 at r 0.57 (world)', results }, null, 1));
});
