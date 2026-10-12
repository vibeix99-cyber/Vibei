/**
 * Chai from the Blender model (`art-src/chai/chai.glb`, runtime copy `./models/chai.glb`): the validator and a
 * model-backed implementation of the engine's `Chai` interface (chai.ts). The network / glTF parsing half lives in
 * `chaiLoad.ts` (its own lazy chunk); this file only needs three core, so the engine can import it statically.
 *
 * Contract (CHAI-3D-SPEC §5.2, §6.3; art-src/chai/REPORT.md "Pose table for the loader"):
 *  - nodes `chai` (root), `body` (shape key `nap`), `eyes_open`, `eyes_sleep`, `eyes_sip`, `paws_mug`, `yuzu`
 *    (`extras.nap_offset`, glTF axes), optional `eyes_happy` (cheering, not used by the three poses);
 *  - face on +Z, +Y up, origin at the floor contact between the feet, 1 unit = 1 scene unit before the root scale;
 *  - awake = eyes_open; nap = eyes_sleep + shape key `nap` = 1 + yuzu moved by nap_offset; sip = eyes_sip + paws_mug.
 *    The `nap` key is the lying pose: it is never combined with the procedural Chai's (1.1, 0.84, 1.06) scale.
 */
import { Box3, Group, Mesh, MeshStandardMaterial, Vector3, type Material, type Object3D, type Sprite } from 'three';
import type { Kit } from './kit';
import type { SteamFX } from './fx';
import type { Chai, ChaiPose } from './chai';

/** What a loaded, validated model hands to the engine (parsed once per page, cloned per engine). */
export interface ChaiTemplate {
  /** The glTF `chai` node (shared CPU data: never add it to a scene, always clone through `buildModelChai`). */
  node: Object3D;
  check: ChaiCheck;
}

/** The model's measured facts (unscaled, glTF axes). */
export interface ChaiCheck {
  awake: { size: [number, number, number]; minY: number; tris: number; calls: number };
  nap: { size: [number, number, number]; minY: number; tris: number; calls: number; center: [number, number] };
  sip: { tris: number; calls: number };
  fileTris: number;
}

/**
 * Validation targets: the r1 model's real extents (REPORT.md "Size awake / in nap", measured on the file:
 * awake 0.585 × 0.993 × 0.567, nap 0.682 × 0.612 × 1.032), ±10 %. The spec's original box (0.8 × 1.04 × 0.74, the old
 * square loaf) would reject the sheet-proportioned model, as REPORT.md says.
 */
export const CHAI_SPEC = {
  awake: [0.59, 0.99, 0.57] as const,
  nap: [0.68, 0.61, 1.03] as const,
  tol: 0.1,
  /** The origin is the floor contact: the lowest point must be within 1 cm of y = 0, awake and in nap. */
  floorTol: 0.01,
  trisVisible: 5000,
  trisFile: 8000,
  callsVisible: 6,
  nodes: ['body', 'eyes_open', 'eyes_sleep', 'eyes_sip', 'paws_mug', 'yuzu'] as const,
};

/** Which parts each pose shows (REPORT.md pose table). `body` and `yuzu` are always on. */
const POSE_PARTS: Record<ChaiPose, string[]> = {
  awake: ['body', 'eyes_open', 'yuzu'],
  nap: ['body', 'eyes_sleep', 'yuzu'],
  sip: ['body', 'eyes_sip', 'paws_mug', 'yuzu'],
};

export class ChaiModelError extends Error {}

function napOffsetOf(node: Object3D): Vector3 | null {
  const v = node.getObjectByName('yuzu')?.userData.nap_offset as unknown;
  if (!Array.isArray(v) || v.length !== 3 || !v.every((n) => typeof n === 'number' && Number.isFinite(n))) return null;
  return new Vector3(v[0], v[1], v[2]);
}

function meshesOf(o: Object3D): Mesh[] {
  const out: Mesh[] = [];
  o.traverse((c) => (c as Mesh).isMesh && out.push(c as Mesh));
  return out;
}

function trisOf(m: Mesh): number {
  const g = m.geometry;
  return (g.index ? g.index.count : g.getAttribute('position').count) / 3;
}

/** Every vertex of `part` in the `chai` node's frame, with the `nap` shape key at `nap` and an extra offset. */
function expand(box: Box3, root: Object3D, part: Object3D, nap: number, offset?: Vector3) {
  root.updateMatrixWorld(true);
  const toRoot = root.matrixWorld.clone().invert();
  const v = new Vector3();
  for (const m of meshesOf(part)) {
    const pos = m.geometry.getAttribute('position');
    const key = m.morphTargetDictionary?.nap;
    const d = key !== undefined ? m.geometry.morphAttributes.position?.[key] : undefined;
    const rel = m.geometry.morphTargetsRelative;
    const mat = toRoot.clone().multiply(m.matrixWorld);
    for (let i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i);
      if (d && nap) {
        if (rel) v.set(v.x + d.getX(i) * nap, v.y + d.getY(i) * nap, v.z + d.getZ(i) * nap);
        else v.lerp(new Vector3(d.getX(i), d.getY(i), d.getZ(i)), nap);
      }
      v.applyMatrix4(mat);
      if (offset) v.add(offset);
      box.expandByPoint(v);
    }
  }
}

const within = (got: number, want: number, tol: number) => Math.abs(got - want) <= want * tol;
const r3 = (v: Vector3): [number, number, number] => [+v.x.toFixed(3), +v.y.toFixed(3), +v.z.toFixed(3)];

/**
 * Check a parsed model against the contract before it may replace the procedural Chai. Throws `ChaiModelError`
 * with the first failed rule; returns the measured facts otherwise.
 */
export function validateChai(node: Object3D): ChaiCheck {
  const fail = (why: string): never => {
    throw new ChaiModelError(why);
  };
  for (const n of CHAI_SPEC.nodes) if (!node.getObjectByName(n)) fail(`missing node "${n}"`);
  const part = (n: string) => node.getObjectByName(n)!;
  const body = meshesOf(part('body'));
  if (body.length === 0) fail('"body" has no mesh');
  if (!body.every((m) => m.morphTargetDictionary?.nap !== undefined)) fail('"body" has no "nap" shape key');
  const napOffset = napOffsetOf(node) ?? fail('"yuzu" has no extras.nap_offset');

  const stats = (pose: ChaiPose) => {
    let tris = 0;
    let calls = 0;
    for (const n of POSE_PARTS[pose])
      for (const m of meshesOf(part(n))) {
        tris += trisOf(m);
        calls++;
      }
    return { tris, calls };
  };
  const awakeBox = new Box3();
  for (const n of POSE_PARTS.awake) expand(awakeBox, node, part(n), 0);
  const napBox = new Box3();
  expand(napBox, node, part('body'), 1);
  expand(napBox, node, part('eyes_sleep'), 0);
  expand(napBox, node, part('yuzu'), 0, napOffset);
  const a = awakeBox.getSize(new Vector3());
  const z = napBox.getSize(new Vector3());
  const check: ChaiCheck = {
    awake: { size: r3(a), minY: +awakeBox.min.y.toFixed(4), ...stats('awake') },
    nap: { size: r3(z), minY: +napBox.min.y.toFixed(4), ...stats('nap'), center: [+((napBox.min.x + napBox.max.x) / 2).toFixed(3), +((napBox.min.z + napBox.max.z) / 2).toFixed(3)] },
    sip: stats('sip'),
    fileTris: meshesOf(node).reduce((s, m) => s + trisOf(m), 0),
  };
  const axes = ['x', 'y', 'z'];
  for (const [pose, got, want] of [['awake', a, CHAI_SPEC.awake], ['nap', z, CHAI_SPEC.nap]] as const)
    got.toArray().forEach((g, i) => {
      if (!within(g, want[i], CHAI_SPEC.tol)) fail(`${pose} ${axes[i]} extent ${g.toFixed(3)} is not within ±10 % of ${want[i]}`);
    });
  if (Math.abs(check.awake.minY) > CHAI_SPEC.floorTol) fail(`awake origin is not on the floor (min y ${check.awake.minY})`);
  if (Math.abs(check.nap.minY) > CHAI_SPEC.floorTol) fail(`nap origin is not on the floor (min y ${check.nap.minY})`);
  for (const pose of ['awake', 'nap', 'sip'] as const) {
    const s = check[pose];
    if (s.tris > CHAI_SPEC.trisVisible) fail(`${pose}: ${s.tris} triangles visible (budget ${CHAI_SPEC.trisVisible})`);
    if (s.calls > CHAI_SPEC.callsVisible) fail(`${pose}: ${s.calls} draw calls (budget ${CHAI_SPEC.callsVisible})`);
  }
  if (check.fileTris > CHAI_SPEC.trisFile) fail(`${check.fileTris} triangles in the file (budget ${CHAI_SPEC.trisFile})`);
  return check;
}

/**
 * The fur keeps the procedural Chai's night self-fill (chai.ts: emissive = own colour × 0.16, docs/areas/scene.md
 * iteration 4). The model's colour is per vertex, so the emissive is multiplied by the vertex colour in the shader:
 * the face plate, paws and blush are lifted in proportion, the eyes and nose (another material) stay dark.
 */
const SELF_FILL = 0.16;
function selfFill(m: MeshStandardMaterial) {
  m.emissive.setRGB(1, 1, 1);
  m.emissiveIntensity = SELF_FILL;
  m.onBeforeCompile = (s) => {
    s.fragmentShader = s.fragmentShader.replace(
      '#include <emissivemap_fragment>',
      '#include <emissivemap_fragment>\n#ifdef USE_COLOR\n\ttotalEmissiveRadiance *= vColor.rgb;\n#endif',
    );
  };
  m.customProgramCacheKey = () => 'chai-self-fill';
}

/**
 * Nap placement: the lying loaf (1.03 long, ×1.12 = 1.16 in the room) is centred 0.052 behind the feet pivot, so on
 * the cushion (rim radius 0.57) its rump overhung the rim by up to 0.046 (6 of 481 underside vertices). Moving the
 * model 0.031 toward its face (0.035 in the room) in nap only leaves no underside vertex beyond the rim, with the same
 * contact (5th-percentile gap −0.021 before and after). Probe: contracts/W2R2/C/probes/placement.probe.test.ts.
 */
export const NAP_FORWARD = 0.031;

/** Contact-shadow footprint per pose: the procedural blob's ratio to its loaf (1.15/0.8, 1.1/0.74) on the model's extents. */
const BLOB = { awake: { sx: 0.84, sz: 0.84, z: 0 }, nap: { sx: 0.98, sz: 1.5, z: -0.052 + NAP_FORWARD } };

/** The Chai's procedural extras the model keeps using (the engine owns them: steam colour, zZ sprites). */
export interface ChaiExtras {
  steam: SteamFX;
  sprites: Sprite[];
}

/**
 * A `Chai` built from the model: same motion as the procedural one (breathing from the floor origin, blink, yuzu
 * sway, hop, sip lift, zZ), driven through the same interface. Geometry and materials are cloned per engine and
 * registered with the kit, so they are disposed with it (a context loss rebuilds the engine from the cached template).
 */
export function buildModelChai(kit: Kit, tpl: ChaiTemplate, extras: ChaiExtras): Chai {
  const root = new Group();
  root.name = 'chai';
  root.userData.model = true;
  const loaf = new Group(); // breathes / squashes / rolls from the floor origin
  const model = tpl.node.clone(true);
  const mats = new Map<Material, Material>();
  const own = (m: Material): Material => {
    let c = mats.get(m);
    if (!c) {
      c = m.clone();
      const fur = c.name === 'chai_fur';
      if (fur && (c as MeshStandardMaterial).isMeshStandardMaterial) selfFill(c as MeshStandardMaterial);
      kit.own(c, fur); // the fur is "unique" like the procedural fur: it keeps its PBR material on the low tier
      mats.set(m, c);
    }
    return c;
  };
  const part = (n: string) => model.getObjectByName(n)!;
  const face = new Set(['eyes_open', 'eyes_sleep', 'eyes_sip', 'eyes_happy']);
  model.traverse((o) => {
    const m = o as Mesh;
    if (!m.isMesh) return;
    m.geometry = kit.track(m.geometry.clone());
    m.material = Array.isArray(m.material) ? m.material.map(own) : own(m.material);
    let p: Object3D | null = m;
    while (p && p !== model && !face.has(p.name)) p = p.parent;
    m.castShadow = kit.shadows && !(p && face.has(p.name));
    m.receiveShadow = true;
  });
  loaf.add(model);
  root.add(loaf);

  const body = meshesOf(part('body'));
  const eyes = { awake: part('eyes_open'), nap: part('eyes_sleep'), sip: part('eyes_sip') };
  const happy = model.getObjectByName('eyes_happy');
  const paws = part('paws_mug');
  const yuzu = part('yuzu');
  const yuzuRest = yuzu.position.clone();
  const napOffset = napOffsetOf(tpl.node)!;
  const blink = eyes.awake;

  // contact shadow (shared unit plane + cached material: no new GPU resources)
  const blob = kit.blob(0, 0, 1, 1, 0.55, 0.012);
  root.add(blob);

  // steam from the mug's rim: the cup is round, so its centre is half its depth in from the side away from the handle
  const mugMesh = meshesOf(paws).find((m) => (m.material as Material).name === 'chai_mug');
  const mugBox = new Box3();
  if (mugMesh) expand(mugBox, model, mugMesh, 0);
  const { steam, sprites: zees } = extras;
  if (!mugBox.isEmpty()) {
    const depth = mugBox.max.z - mugBox.min.z;
    steam.u.uOrigin.value.set(mugBox.min.x + depth / 2, mugBox.max.y + 0.02, (mugBox.min.z + mugBox.max.z) / 2);
  }
  root.add(steam.mesh);
  for (const z of zees) root.add(z);
  // zZ rise from above the sleeping head (the yuzu's nap position)
  const head = yuzuRest.clone().add(napOffset).add(new Vector3(0, 0, NAP_FORWARD));

  let pose: ChaiPose = 'awake';
  let hop = 0;
  const setPose = (p: ChaiPose) => {
    pose = p;
    for (const k of ['awake', 'nap', 'sip'] as const) eyes[k].visible = p === k;
    if (happy) happy.visible = false;
    paws.visible = p === 'sip';
    steam.mesh.visible = p === 'sip';
    zees.forEach((z) => (z.visible = p === 'nap'));
    for (const m of body) {
      const i = m.morphTargetDictionary!.nap;
      m.morphTargetInfluences![i] = p === 'nap' ? 1 : 0;
    }
    yuzu.position.copy(yuzuRest);
    if (p === 'nap') yuzu.position.add(napOffset);
    model.position.set(0, 0, p === 'nap' ? NAP_FORWARD : 0);
    paws.position.set(0, 0, 0);
    blink.scale.y = 1;
    const b = p === 'nap' ? BLOB.nap : BLOB.awake;
    blob.scale.set(b.sx, b.sz, 1);
    blob.position.set(0, 0.012, b.z);
  };
  setPose('awake');

  const update = (t: number, dt: number) => {
    const slow = pose === 'nap';
    const br = Math.sin(t * (slow ? 1.1 : 1.6));
    const amp = slow ? 0.035 : 0.018;
    hop = Math.max(0, hop - dt * 2.2);
    const hopY = hop > 0 ? Math.sin(hop * Math.PI) * 0.16 : 0;
    const squash = hop > 0 ? Math.sin(hop * Math.PI * 2) * 0.06 : 0;
    // Breathing only: the nap shape is the shape key, never this scale's (1.1, 0.84, 1.06) fallback.
    loaf.scale.set(1 + br * amp * 0.35 - squash * 0.5, 1 + br * amp + squash, 1 + br * amp * 0.3);
    root.position.y = (root.userData.baseY as number) + hopY;
    const wob = Math.max(0, Math.sin(t * 0.37)) ** 12;
    yuzu.rotation.z = Math.sin(t * 1.4) * 0.05 + Math.sin(t * 12) * 0.1 * wob + squash * 1.5;
    if (pose === 'awake') {
      // eyes_open has its origin at the eye centre: the blink scales about it
      blink.scale.y = t % 4.2 < 0.13 ? 0.15 : 1;
      loaf.rotation.z = Math.sin(t * 0.5) * 0.02;
    } else loaf.rotation.z = 0;
    if (pose === 'sip') {
      const lift = Math.max(0, Math.sin(t * 0.6)) ** 6;
      paws.position.y = lift * 0.06;
      paws.position.z = -lift * 0.02;
      steam.u.uTime.value = t;
    }
    if (pose === 'nap') {
      for (let i = 0; i < zees.length; i++) {
        const ph = (t * 0.28 + i / zees.length) % 1;
        const z = zees[i];
        z.position.set(head.x + 0.22 + ph * 0.28 + Math.sin(ph * 6 + i) * 0.04, head.y + 0.25 + ph * 0.75, head.z);
        z.scale.setScalar(0.09 + ph * 0.1);
        z.material.opacity = Math.sin(Math.PI * ph) * 0.9;
        z.material.rotation = -0.2 + Math.sin(ph * 4) * 0.2;
      }
    }
  };

  root.userData.baseY = 0;
  root.scale.setScalar(1.12);
  return {
    root,
    setPose,
    update,
    poke: () => {
      hop = 1;
    },
    steam,
    sprites: zees,
    focus: new Vector3(),
  };
}
