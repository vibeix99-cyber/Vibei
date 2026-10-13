/**
 * I06 · the Blender Chai: the runtime copy is the approved file, the validator accepts it with its real extents
 * and rejects broken variants, and the model-backed Chai maps the poses as REPORT.md's table says.
 */
import { describe, expect, it, beforeAll } from 'vitest';
import { Box3, Mesh, MeshStandardMaterial, Object3D, Vector3, type Sprite } from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';
import { CHAI_SPEC, ChaiModelError, NAP_FORWARD, buildModelChai, validateChai, type ChaiTemplate } from './chaiModel';
import { Kit } from './kit';
import { buildChai } from './chai';

// The kit's canvas textures (blob shadow, zZ, steam puff) need a 2D canvas: a no-op one is enough here.
(globalThis as { document?: unknown }).document ??= {
  createElement: () => ({
    width: 0,
    height: 0,
    getContext: () =>
      new Proxy({}, { get: (_t, k) => (k === 'createRadialGradient' || k === 'createLinearGradient' ? () => ({ addColorStop() {} }) : k === 'getImageData' ? () => ({ data: new Uint8ClampedArray(4) }) : () => {}) }),
  }),
};

// Node's fs without @types/node (the app's tsconfig is DOM-only): a dynamic import with a narrow local type.
type Bytes = Uint8Array<ArrayBuffer>;
const fs = (await import(/* @vite-ignore */ `node:${'fs'}`)) as { readFileSync(p: string): Bytes; existsSync(p: string): boolean };
const { readFileSync, existsSync } = fs;

const APPROVED = 'b401bc6c0fa9dd7a2abe27c135821634e7d1a4d9f9ba5263f50a436ceb463d7e';
const runtime = new URL('./models/chai.glb', import.meta.url).pathname;
const source = new URL('../../../art-src/chai/chai.glb', import.meta.url).pathname;
const sha = async (p: string) =>
  [...new Uint8Array(await crypto.subtle.digest('SHA-256', readFileSync(p)))].map((b) => b.toString(16).padStart(2, '0')).join('');

async function parse(path: string): Promise<Object3D> {
  const buf = readFileSync(path);
  const loader = new GLTFLoader();
  loader.setMeshoptDecoder(MeshoptDecoder);
  await MeshoptDecoder.ready;
  const gltf = await loader.parseAsync(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer, '');
  const node = gltf.scene.getObjectByName('chai')!;
  node.removeFromParent();
  node.updateMatrixWorld(true);
  return node;
}

let node: Object3D;
beforeAll(async () => {
  node = await parse(runtime);
});

describe('chai.glb runtime copy', () => {
  it('is byte-identical to the approved source (art-src/chai/chai.glb)', async () => {
    expect(await sha(runtime)).toBe(APPROVED);
    if (existsSync(source)) expect(await sha(source)).toBe(APPROVED);
  });
});

describe('validateChai', () => {
  it('accepts the model with its real extents, budget and floor origin', () => {
    const c = validateChai(node);
    expect(c.awake.size[0]).toBeCloseTo(0.585, 2);
    expect(c.awake.size[1]).toBeCloseTo(0.993, 2);
    expect(c.awake.size[2]).toBeCloseTo(0.567, 2);
    expect(c.nap.size[0]).toBeCloseTo(0.682, 2);
    expect(c.nap.size[1]).toBeCloseTo(0.612, 2);
    expect(c.nap.size[2]).toBeCloseTo(1.032, 2);
    expect(Math.abs(c.awake.minY)).toBeLessThan(0.001);
    expect(Math.abs(c.nap.minY)).toBeLessThan(0.001);
    expect(c).toMatchObject({ awake: { tris: 4342, calls: 4 }, nap: { tris: 4250, calls: 4 }, sip: { tris: 4780, calls: 6 }, fileTris: 5372 });
  });

  it('rejects the spec’s old square-loaf box: a model scaled to 0.8 × 1.04 × 0.74 fails', () => {
    const big = node.clone(true);
    big.scale.set(0.8 / 0.585, 1.04 / 0.993, 0.74 / 0.567);
    big.updateMatrixWorld(true);
    // the validator measures in the node's own frame: wrap so the scale applies to the parts
    const wrap = new Object3D();
    for (const c of [...big.children]) {
      c.applyMatrix4(big.matrix);
      wrap.add(c);
    }
    wrap.name = 'chai';
    expect(() => validateChai(wrap)).toThrow(/extent/);
  });

  it('rejects a missing node, a missing nap key or nap offset, and a floating origin', () => {
    const noSip = node.clone(true);
    noSip.getObjectByName('eyes_sip')!.removeFromParent();
    expect(() => validateChai(noSip)).toThrow(ChaiModelError);

    const noOffset = node.clone(true);
    noOffset.getObjectByName('yuzu')!.userData = {};
    expect(() => validateChai(noOffset)).toThrow(/nap_offset/);

    const noKey = node.clone(true);
    noKey.getObjectByName('body')!.traverse((o) => {
      if ((o as Mesh).isMesh) (o as Mesh).morphTargetDictionary = {};
    });
    expect(() => validateChai(noKey)).toThrow(/nap/);

    const lifted = node.clone(true);
    for (const c of lifted.children) c.position.y += 0.05;
    expect(() => validateChai(lifted)).toThrow(/floor/);
  });

  it('targets are the measured model ±10 %', () => {
    expect(CHAI_SPEC.awake).toEqual([0.59, 0.99, 0.57]);
    expect(CHAI_SPEC.nap).toEqual([0.68, 0.61, 1.03]);
    expect(CHAI_SPEC.tol).toBe(0.1);
  });
});

describe('model-backed Chai: pose mapping (REPORT.md)', () => {
  const visibleParts = (root: Object3D) => {
    const names: string[] = [];
    root.traverse((o) => {
      if (!['eyes_open', 'eyes_sleep', 'eyes_sip', 'eyes_happy', 'paws_mug'].includes(o.name)) return;
      let v = true;
      for (let p: Object3D | null = o; p; p = p.parent) v &&= p.visible;
      if (v) names.push(o.name);
    });
    return names.sort();
  };
  const build = (shadows = true) => {
    const kit = new Kit(shadows);
    const proc = buildChai(kit);
    const tpl: ChaiTemplate = { node, check: validateChai(node) };
    return { kit, chai: buildModelChai(kit, tpl, { steam: proc.steam, sprites: proc.sprites as Sprite[] }) };
  };
  const napInfluence = (root: Object3D) => {
    const out: number[] = [];
    root.getObjectByName('body')!.traverse((o) => {
      const m = o as Mesh;
      if (m.isMesh) out.push(m.morphTargetInfluences![m.morphTargetDictionary!.nap]);
    });
    return out;
  };

  it('awake: eyes_open; nap key 0; yuzu at rest', () => {
    const { chai } = build();
    chai.setPose('nap');
    chai.setPose('awake');
    expect(visibleParts(chai.root)).toEqual(['eyes_open']);
    expect(chai.root.getObjectByName('body')!.parent!.position.toArray()).toEqual([0, 0, 0]);
    expect(napInfluence(chai.root)).toEqual([1, 1].map(() => 0));
    expect(chai.root.getObjectByName('yuzu')!.position.toArray()).toEqual(node.getObjectByName('yuzu')!.position.toArray());
  });

  it('nap: eyes_sleep + shape key nap = 1 + yuzu moved by nap_offset; never the procedural scale fallback', () => {
    const { chai } = build();
    chai.root.userData.baseY = 0;
    chai.setPose('nap');
    expect(visibleParts(chai.root)).toEqual(['eyes_sleep']);
    expect(napInfluence(chai.root)).toEqual([1, 1]);
    const rest = node.getObjectByName('yuzu')!.position;
    const off = node.getObjectByName('yuzu')!.userData.nap_offset as number[];
    const got = chai.root.getObjectByName('yuzu')!.position;
    expect(got.x).toBeCloseTo(rest.x + off[0], 5);
    expect(got.y).toBeCloseTo(rest.y + off[1], 5);
    expect(got.z).toBeCloseTo(rest.z + off[2], 5);
    // Placement: in nap only, the model moves NAP_FORWARD toward its face (centres the lying loaf on the cushion).
    const model = chai.root.getObjectByName('body')!.parent!;
    expect(model.position.toArray()).toEqual([0, 0, NAP_FORWARD]);
    // At a breath's zero crossing the loaf (everything above the root) is unscaled: no (1.1, 0.84, 1.06).
    chai.update(0, 0);
    const loaf = model.parent!;
    expect(loaf.scale.toArray()).toEqual([1, 1, 1]);
    // Over a full breath the scale never reaches the fallback's squash.
    for (let t = 0; t < 6; t += 0.1) {
      chai.update(t, 0);
      expect(loaf.scale.y).toBeGreaterThan(0.96);
      expect(loaf.scale.x).toBeLessThan(1.02);
    }
  });

  it('sip: eyes_sip + paws_mug, steam on', () => {
    const { chai } = build();
    chai.setPose('sip');
    expect(visibleParts(chai.root)).toEqual(['eyes_sip', 'paws_mug']);
    expect(chai.steam.mesh.visible).toBe(true);
    expect(napInfluence(chai.root)).toEqual([0, 0]);
  });

  it('keeps the night self-fill on the fur only, as a unique material that survives the low tier', () => {
    const { kit, chai } = build(false);
    kit.liteify(chai.root);
    const mats = new Map<string, string>();
    chai.root.traverse((o) => {
      const m = o as Mesh;
      if (m.isMesh && m.geometry.getAttribute('color')) mats.set(m.name + '/' + (m.material as MeshStandardMaterial).name, (m.material as MeshStandardMaterial).type);
    });
    const fur = [...mats.entries()].filter(([k]) => k.endsWith('/chai_fur'));
    expect(fur.length).toBeGreaterThan(0);
    expect(fur.every(([, t]) => t === 'MeshStandardMaterial')).toBe(true);
    expect([...mats.entries()].filter(([k]) => !k.endsWith('/chai_fur')).every(([, t]) => t === 'MeshLambertMaterial')).toBe(true);
  });

  it('sits at the root origin with the engine’s scale 1.12 (awake 0.655 wide, 1.112 tall)', () => {
    const { chai } = build();
    chai.setPose('awake');
    chai.root.updateMatrixWorld(true);
    const box = new Box3();
    chai.root.traverse((o) => {
      const m = o as Mesh;
      if (!m.isMesh || !['body', 'eyes_open', 'yuzu'].some((n) => o.name === n || o.parent?.name === n)) return;
      box.expandByObject(m, true);
    });
    const size = box.getSize(new Vector3());
    expect(size.x).toBeCloseTo(0.585 * 1.12, 2);
    expect(size.y).toBeCloseTo(0.993 * 1.12, 2);
    expect(box.min.y).toBeCloseTo(0, 3);
  });
});
