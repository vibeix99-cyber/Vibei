// Run from kettle/.tmp/n/ (imports are relative to there): npx vitest run --config .tmp/n/vitest.config.ts --reporter=verbose
import { test } from 'vitest';
import { Box3, Mesh, Vector3, type BufferGeometry } from 'three';

(globalThis as any).document = {
  createElement: () => ({ width: 0, height: 0, getContext: () => new Proxy({}, { get: (_t, k) => (k === 'createRadialGradient' || k === 'createLinearGradient' ? () => ({ addColorStop() {} }) : k === 'getImageData' ? () => ({ data: new Uint8ClampedArray(4) }) : () => {}) }) }),
};

test('chai stats', async () => {
  const { Kit } = await import('../../src/scene/engine/kit');
  const { buildChai } = await import('../../src/scene/engine/chai');
  for (const pose of ['awake', 'nap', 'sip'] as const) {
    const kit = new Kit(true);
    const chai = buildChai(kit);
    chai.setPose(pose);
    chai.root.position.set(0, 0, 0);
    chai.root.rotation.y = 0;
    chai.root.updateMatrixWorld(true);
    let tris = 0, meshes = 0, verts = 0;
    const mats = new Set<string>();
    const box = new Box3();
    const visible = (o: any) => { for (let p = o; p; p = p.parent) if (!p.visible) return false; return true; };
    chai.root.traverse((o: any) => {
      if (!o.isMesh || !visible(o)) return;
      const m = o as Mesh;
      const mat: any = m.material;
      if (mat?.visible === false) return;
      if (o.userData.proxy) return;
      meshes++;
      const g = m.geometry as BufferGeometry;
      const n = g.index ? g.index.count / 3 : g.getAttribute('position').count / 3;
      tris += n;
      verts += g.getAttribute('position').count;
      mats.add(`${mat.type}:${mat.color?.getHexString?.()}${mat.vertexColors ? ':vc' : ''}${mat.transparent ? ':tr' : ''}`);
      if (mat.type === 'MeshStandardMaterial' || mat.type === 'MeshLambertMaterial') box.expandByObject(m);
    });
    const size = box.getSize(new Vector3());
    console.log(pose, JSON.stringify({ meshes, tris, verts, mats: [...mats], box: { min: box.min.toArray().map((v) => +v.toFixed(3)), max: box.max.toArray().map((v) => +v.toFixed(3)), size: size.toArray().map((v) => +v.toFixed(3)) } }));
  }
});
