/**
 * Procedural builders for every unlockable nook item (ids from
 * src/progress/items.ts). Each returns a positioned group, a raycast proxy,
 * a focus point for the highlight spotlight, and optional idle animation
 * that only mutates existing objects (no allocations per frame).
 */
import {
  CatmullRomCurve3,
  Color,
  DoubleSide,
  Group,
  Mesh,
  Shape,
  ShapeGeometry,
  Sprite,
  SpriteMaterial,
  TubeGeometry,
  Vector3,
  type BufferGeometry,
  type MeshStandardMaterial,
} from 'three';
import { Kit, group } from './kit';
import { C } from './palette';
import { ROOM, SPOTS, WIN } from './layout';
import { makeGlows, makeSteam, rng, type SteamFX } from './fx';

export interface AnimCtx {
  /** 0..1 lamp mood (lights on). */
  lamp: number;
  /** Seconds, frozen under reduced motion. */
  t: number;
  dt: number;
}

export interface ItemBuild {
  id: string;
  root: Group;
  focus: Vector3;
  radius: number;
  anim?: (c: AnimCtx) => void;
  /** Extra effect meshes to dispose (ShaderMaterials). */
  fx?: { mesh: Mesh }[];
  sprites?: Sprite[];
}

/** Where tea things sit, depending on table vs kotatsu. */
export interface TableTop {
  x: number;
  y: number;
  z: number;
}

type Builder = (kit: Kit, extra: { tableTop: () => TableTop }) => ItemBuild;

const Y_AXIS = new Vector3(0, 1, 0);

function finish(kit: Kit, id: string, root: Group, proxy: Mesh, focus: Vector3, radius: number, rest: Partial<ItemBuild> = {}): ItemBuild {
  proxy.userData.itemId = id;
  root.add(proxy);
  root.name = id;
  root.userData.itemId = id;
  kit.mergeStatic(root);
  return { id, root, focus, radius, ...rest };
}

// ------------------------------------------------------------ leaf shapes

function teardrop(kit: Kit): BufferGeometry {
  const s = new Shape();
  s.moveTo(0, 0.06);
  s.bezierCurveTo(-0.18, -0.12, -0.62, 0.1, -0.5, 0.52);
  s.bezierCurveTo(-0.4, 0.85, -0.1, 0.95, 0, 1.08);
  s.bezierCurveTo(0.1, 0.95, 0.4, 0.85, 0.5, 0.52);
  s.bezierCurveTo(0.62, 0.1, 0.18, -0.12, 0, 0.06);
  return kit.track(new ShapeGeometry(s, 6));
}

function monsteraLeaf(kit: Kit, seed: number): BufferGeometry {
  const r = rng(seed);
  const W = 0.5;
  const L = 1;
  const w = (t: number) => W * Math.pow(Math.sin(Math.PI * Math.min(1, t * 0.92 + 0.08)), 0.7) * (1 - 0.25 * t);
  const slits = [0.28, 0.48, 0.66, 0.82];
  const side = (sign: number): [number, number][] => {
    const pts: [number, number][] = [];
    const N = 28;
    for (let i = 1; i < N; i++) {
      const t = i / N;
      const cut = slits.find((c) => Math.abs(t - c) < 0.5 / N);
      if (cut !== undefined) {
        const depth = 0.35 + r() * 0.25;
        pts.push([sign * w(t - 0.02), (t - 0.02) * L]);
        pts.push([sign * w(t) * depth, (t + 0.03) * L]);
        pts.push([sign * w(t + 0.025), (t + 0.035) * L]);
      } else pts.push([sign * w(t), t * L]);
    }
    return pts;
  };
  const s = new Shape();
  s.moveTo(0, 0.1);
  s.lineTo(-0.2, -0.04);
  const left = side(-1);
  for (const [x, y] of left) s.lineTo(x, y);
  s.lineTo(0, L);
  const right = side(1).reverse();
  for (const [x, y] of right) s.lineTo(x, y);
  s.lineTo(0.2, -0.04);
  s.lineTo(0, 0.1);
  // two little windows near the midrib
  for (const t of [0.4, 0.62]) {
    const hole = new Shape();
    const hx = W * 0.22;
    hole.absellipse(-hx, t, 0.035, 0.07, 0, Math.PI * 2, false, 0);
    s.holes.push(hole);
    const hole2 = new Shape();
    hole2.absellipse(hx, t + 0.05, 0.035, 0.07, 0, Math.PI * 2, false, 0);
    s.holes.push(hole2);
  }
  const g = kit.track(new ShapeGeometry(s, 4));
  // fold along the midrib and droop toward the tip
  const p = g.getAttribute('position');
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i);
    const y = p.getY(i);
    p.setZ(i, 0.35 * x * x - 0.28 * y * y);
  }
  g.computeVertexNormals();
  return g;
}

// ------------------------------------------------------------ builders

const pothos: Builder = (kit) => {
  const root = new Group();
  const sillY = WIN.y0 - 0.05;
  const x = WIN.x1 - 0.05;
  const z = ROOM.zBack + 0.13;
  // terracotta pot
  root.add(kit.mesh(kit.smoothLathe([[0.001, 0], [0.12, 0], [0.15, 0.2], [0.18, 0.21], [0.185, 0.27], [0.16, 0.28], [0.001, 0.28]], 3, 24), kit.mat(C.terracotta, { rough: 0.9 })));
  root.add(kit.mesh(kit.cyl(0.15, 0.15, 0.02, 20), kit.mat(C.woodDark, { rough: 1 }), { p: [0, 0.255, 0] }));
  root.add(kit.blob(0, 0, 0.5, 0.45, 0.45, 0.003));
  const leaf = teardrop(kit);
  const tones = [kit.mat(C.leaf, { side: DoubleSide, rough: 0.6 }), kit.mat(C.leafHi, { side: DoubleSide, rough: 0.6 }), kit.mat(C.leafDeep, { side: DoubleSide, rough: 0.6 })];
  const r = rng(3);
  // bushy crown
  const crown = new Group();
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2 + r() * 0.4;
    const rr = 0.04 + r() * 0.1;
    const m = kit.mesh(leaf, tones[i % 3], { p: [Math.cos(a) * rr, 0.3 + r() * 0.12, Math.sin(a) * rr], s: 0.13 + r() * 0.05 });
    m.lookAt(Math.cos(a) * 2, 0.9 + r(), Math.sin(a) * 2);
    m.rotateX(-0.9);
    crown.add(m);
  }
  crown.userData.dyn = true;
  kit.mergeStatic(crown);
  root.add(crown);
  // trailing vines (each sways on its own)
  const vines: Group[] = [];
  const stemMat = kit.mat(C.leafDeep, { rough: 0.8 });
  const vineDefs = [
    { dx: -0.12, len: 1.05, out: 0.28 },
    { dx: 0.05, len: 0.7, out: 0.34 },
    { dx: 0.16, len: 0.9, out: 0.22 },
  ];
  for (const [vi, v] of vineDefs.entries()) {
    const vine = group({ p: [v.dx, 0.28, 0.1] });
    vine.userData.dyn = true;
    const pts = [
      new Vector3(0, 0, 0),
      new Vector3(0, 0.02, v.out * 0.6),
      new Vector3(v.dx * 0.3, -0.1, v.out),
      new Vector3(v.dx * 0.5, -v.len * 0.5, v.out + 0.05),
      new Vector3(v.dx * 0.2, -v.len, v.out + 0.02),
    ];
    const curve = new CatmullRomCurve3(pts);
    vine.add(kit.mesh(kit.track(new TubeGeometry(curve, 20, 0.011, 5, false)), stemMat, { cast: false }));
    const n = Math.round(v.len * 11);
    for (let i = 1; i <= n; i++) {
      const t = i / (n + 0.5);
      const p = curve.getPointAt(t);
      const side = i % 2 === 0 ? 1 : -1;
      const m = kit.mesh(leaf, tones[(i + vi) % 3], { p: [p.x + side * 0.03, p.y, p.z + 0.02], s: 0.1 + r() * 0.04 });
      m.rotation.set(0.3 + r() * 0.4, side * (0.6 + r() * 0.5), Math.PI + side * (0.5 + r() * 0.4));
      vine.add(m);
    }
    kit.mergeStatic(vine);
    vines.push(vine);
    root.add(vine);
  }
  root.position.set(x, sillY, z);
  const proxy = kit.proxy(0.5, 1.4, 0.6, { p: [0, -0.2, 0.2] });
  return finish(kit, 'pothos', root, proxy, new Vector3(x, sillY + 0.2, z + 0.2), 0.55, {
    anim: ({ t }) => {
      for (let i = 0; i < vines.length; i++) {
        vines[i].rotation.x = Math.sin(t * 0.7 + i * 1.7) * 0.05;
        vines[i].rotation.z = Math.sin(t * 0.5 + i * 2.3) * 0.06;
      }
      crown.rotation.y = Math.sin(t * 0.4) * 0.04;
    },
  });
};

const books: Builder = (kit) => {
  const root = new Group();
  const pages = kit.mat(C.cream, { rough: 0.95 });
  const covers = [C.skyDeep, C.persimmon, C.sage, C.honey, C.berry];
  const r = rng(8);
  let y = 0;
  const specs = [
    [0.78, 0.13, 0.56],
    [0.7, 0.11, 0.5],
    [0.74, 0.14, 0.52],
    [0.6, 0.1, 0.44],
  ];
  specs.forEach(([w, h, d], i) => {
    const b = group({ p: [(r() - 0.5) * 0.08, y + h / 2, (r() - 0.5) * 0.06], r: [0, (r() - 0.5) * 0.5, 0] });
    b.add(kit.mesh(kit.rbox(w, h, d, 0.03, 2), kit.mat(covers[i], { rough: 0.7 })));
    b.add(kit.mesh(kit.rbox(w - 0.05, h - 0.035, d - 0.02, 0.012, 1), pages, { p: [0.03, 0, 0], cast: false }));
    // spine band
    b.add(kit.mesh(kit.rbox(0.03, h + 0.005, d + 0.005, 0.01, 1), kit.mat(C.honeyHi, { rough: 0.6 }), { p: [-w / 2 + 0.1, 0, 0], cast: false }));
    root.add(b);
    y += h;
  });
  // a leaning pair beside the stack
  const lean = group({ p: [0.55, 0, 0.05], r: [0, 0.2, -0.32] });
  lean.add(kit.mesh(kit.rbox(0.1, 0.62, 0.46, 0.03, 2), kit.mat(C.matchaDeep, { rough: 0.7 }), { p: [0.05, 0.31, 0] }));
  lean.add(kit.mesh(kit.rbox(0.12, 0.54, 0.42, 0.03, 2), kit.mat(C.persimmonDeep, { rough: 0.7 }), { p: [0.16, 0.27, 0] }));
  root.add(lean);
  // a tiny mug of pencils on top
  root.add(kit.mesh(kit.cyl(0.08, 0.075, 0.16, 16), kit.mat(C.berryHi, { rough: 0.6 }), { p: [0.08, y + 0.08, 0.05] }));
  for (const [dx, col] of [
    [-0.02, C.honey],
    [0.03, C.sky],
    [0.0, C.persimmon],
  ] as const) {
    root.add(kit.mesh(kit.cyl(0.013, 0.013, 0.24, 6), kit.mat(col, { rough: 0.6 }), { p: [0.08 + dx, y + 0.2, 0.05 + dx], r: [dx * 3, 0, dx * 4] }));
  }
  root.add(kit.blob(0.15, 0, 1.3, 0.9, 0.5));
  const B = SPOTS.books;
  root.position.set(B.x, 0, B.z);
  root.rotation.y = 0.15;
  const proxy = kit.proxy(1.2, 0.8, 0.8, { p: [0.2, 0.4, 0] });
  return finish(kit, 'books', root, proxy, new Vector3(B.x + 0.15, 0.35, B.z), 0.7);
};

const cushion: Builder = (kit) => {
  const root = new Group();
  const Cu = SPOTS.cushion;
  const puff = kit.smoothLathe(
    [
      [0.001, 0],
      [0.4, 0.0],
      [0.54, 0.06],
      [0.57, 0.12],
      [0.52, 0.19],
      [0.34, 0.235],
      [0.1, 0.225],
      [0.001, 0.21],
    ],
    4,
    40,
  );
  const mat = kit.mat(C.honey, { rough: 0.95 });
  root.add(kit.mesh(puff, mat));
  // piping around the waist
  root.add(kit.mesh(kit.torus(0.565, 0.022, Math.PI * 2, 6, 48), kit.mat(C.honeyDeep, { rough: 0.9 }), { p: [0, 0.12, 0], r: [Math.PI / 2, 0, 0] }));
  root.add(kit.mesh(kit.sphere(0.045, 12, 8), kit.mat(C.persimmon, { rough: 0.6 }), { p: [0, 0.225, 0], s: [1, 0.6, 1] }));
  root.add(kit.blob(0, 0, 1.4, 1.4, 0.45, 0.05));
  root.position.set(Cu.x, 0.04, Cu.z);
  const proxy = kit.proxy(1.1, 0.3, 1.1, { p: [0, 0.12, 0] });
  return finish(kit, 'cushion', root, proxy, new Vector3(Cu.x, 0.2, Cu.z), 0.65);
};

const fairyLights: Builder = (kit) => {
  const root = new Group();
  const { xMin, xMax, zBack, zFront } = ROOM;
  const wire = kit.mat(C.espresso, { rough: 0.7 });
  const bulbPts: { p: Vector3; c: Color; s: number }[] = [];
  const cols = [C.honeyHi, C.cream, C.persimmonHi, C.honey, C.berryHi];
  const run = (a: Vector3, b: Vector3, swags: number, sag: number, bulbsPerSwag: number) => {
    const pts: Vector3[] = [];
    const N = swags * 12;
    for (let i = 0; i <= N; i++) {
      const u = i / N;
      const local = (u * swags) % 1;
      const p = a.clone().lerp(b, u);
      p.y -= Math.sin(Math.PI * local) * sag;
      pts.push(p);
    }
    const curve = new CatmullRomCurve3(pts);
    root.add(kit.mesh(kit.track(new TubeGeometry(curve, N * 2, 0.012, 4, false)), wire, { cast: false }));
    for (let s = 0; s < swags; s++) {
      for (let k = 1; k <= bulbsPerSwag; k++) {
        const u = (s + k / (bulbsPerSwag + 1)) / swags;
        const p = curve.getPointAt(Math.min(1, u));
        p.y -= 0.05;
        bulbPts.push({ p, c: new Color(cols[bulbPts.length % cols.length]), s: 0.34 });
      }
    }
  };
  run(new Vector3(xMin + 0.15, 3.86, zBack + 0.1), new Vector3(xMax - 0.1, 3.86, zBack + 0.1), 5, 0.2, 5);
  run(new Vector3(xMin + 0.1, 3.86, zBack + 0.15), new Vector3(xMin + 0.1, 3.86, zFront - 0.15), 4, 0.2, 5);
  // bulbs: little emissive capsules (tones share unique emissive mats so they follow the lamp mood)
  const bulbMats = new Map<string, MeshStandardMaterial>();
  const bulbGeo = kit.capsule(0.032, 0.035, 4, 8);
  for (const b of bulbPts) {
    const hex = `#${b.c.getHexString()}`;
    let m = bulbMats.get(hex);
    if (!m) {
      m = kit.uniqueMat(hex, { rough: 0.4, emissive: hex, emissiveIntensity: 1.2 });
      bulbMats.set(hex, m);
    }
    root.add(kit.mesh(bulbGeo, m, { p: [b.p.x, b.p.y, b.p.z], cast: false }));
  }
  const glows = makeGlows(
    bulbPts.map((b) => ({ p: b.p, c: b.c.clone().multiplyScalar(0.55), s: b.s })),
    kit.tex.glow(),
    21,
  );
  root.add(glows.mesh);
  // warm wash on the walls under the swags
  const washMat = kit.basic(C.honey, { map: kit.tex.soft(), additive: true, opacity: 0.3, unique: true, depthWrite: false });
  const wash = (w: number, p: [number, number, number], ry: number) => {
    const m = new Mesh(kit.unitPlane(), washMat);
    m.position.set(...p);
    m.rotation.y = ry;
    m.scale.set(w, 1.3, 1);
    m.renderOrder = 2;
    m.userData.dyn = true;
    root.add(m);
  };
  wash(xMax - xMin + 0.8, [(xMin + xMax) / 2, 3.55, zBack + 0.015], 0);
  wash(zFront - zBack + 0.6, [xMin + 0.015, 3.55, (zBack + zFront) / 2], Math.PI / 2);
  const proxy = kit.proxy(xMax - xMin, 0.4, 0.3, { p: [(xMin + xMax) / 2, 3.72, zBack + 0.15] });
  const proxy2 = kit.proxy(0.3, 0.4, zFront - zBack, { p: [xMin + 0.15, 3.72, (zBack + zFront) / 2] });
  proxy2.userData.itemId = 'fairyLights';
  root.add(proxy2);
  const mats = [...bulbMats.values()];
  return finish(kit, 'fairyLights', root, proxy, new Vector3(-0.6, 3.6, zBack + 0.4), 1.4, {
    fx: [glows],
    anim: ({ t, lamp }) => {
      const on = 0.25 + 0.75 * lamp;
      glows.u.uTime.value = t;
      glows.u.uOn.value = on;
      washMat.opacity = 0.32 * lamp * (0.94 + 0.06 * Math.sin(t * 0.9));
      for (let i = 0; i < mats.length; i++) mats[i].emissiveIntensity = on * (1.0 + 0.25 * Math.sin(t * 1.3 + i * 1.9));
    },
  });
};

const shelf: Builder = (kit) => {
  const root = new Group();
  const S = SPOTS.shelf;
  const wood = kit.mat(C.woodMid, { rough: 0.7 });
  root.add(kit.mesh(kit.rbox(1.45, 0.08, 0.38, 0.035, 2), wood, { p: [0, 0, 0.19] }));
  for (const dx of [-0.52, 0.52]) {
    const br = new Shape();
    br.moveTo(0, 0);
    br.lineTo(0.26, 0);
    br.quadraticCurveTo(0.1, -0.08, 0, -0.26);
    br.lineTo(0, 0);
    const g = kit.track(new ShapeGeometry(br, 6));
    const m = kit.mesh(g, kit.mat(C.woodDeep, { rough: 0.7, side: DoubleSide }), { p: [dx, -0.04, 0.02], r: [0, -Math.PI / 2, 0] });
    root.add(m);
    root.add(kit.mesh(kit.rbox(0.04, 0.26, 0.26, 0.015, 1), kit.mat(C.woodDeep, { rough: 0.7 }), { p: [dx, -0.16, 0.13], s: [1, 1, 1] }));
  }
  const top = 0.04;
  // honey tea tin
  root.add(kit.mesh(kit.cyl(0.11, 0.11, 0.26, 20), kit.mat(C.honey, { rough: 0.35, metal: 0.2 }), { p: [-0.48, top + 0.13, 0.2] }));
  root.add(kit.mesh(kit.cyl(0.115, 0.115, 0.05, 20), kit.mat(C.persimmon, { rough: 0.4 }), { p: [-0.48, top + 0.27, 0.2] }));
  root.add(kit.mesh(kit.cyl(0.112, 0.112, 0.08, 20, true), kit.mat(C.cream, { rough: 0.6, side: DoubleSide }), { p: [-0.48, top + 0.12, 0.2] }));
  // little succulent
  root.add(kit.mesh(kit.smoothLathe([[0.001, 0], [0.07, 0], [0.09, 0.12], [0.001, 0.12]], 2, 16), kit.mat(C.cream, { rough: 0.6 }), { p: [-0.18, top, 0.2] }));
  const succ = kit.mat(C.sage, { rough: 0.7 });
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    root.add(kit.mesh(kit.sphere(0.04, 10, 8), succ, { p: [-0.18 + Math.cos(a) * 0.035, top + 0.15, 0.2 + Math.sin(a) * 0.035], s: [0.7, 1.4, 0.7], r: [Math.sin(a) * 0.5, 0, -Math.cos(a) * 0.5] }));
  }
  root.add(kit.mesh(kit.sphere(0.035, 10, 8), kit.mat(C.leafHi, { rough: 0.7 }), { p: [-0.18, top + 0.17, 0.2] }));
  // tiny framed photo (Chai's portrait, of course)
  const frame = group({ p: [0.16, top + 0.17, 0.12], r: [-0.15, 0.15, 0] });
  frame.add(kit.mesh(kit.rbox(0.28, 0.32, 0.04, 0.02, 2), kit.mat(C.woodHi, { rough: 0.6 })));
  frame.add(kit.mesh(kit.rbox(0.2, 0.24, 0.01, 0.005, 1), kit.mat(C.skyHi, { rough: 0.9 }), { p: [0, 0, 0.022], cast: false }));
  frame.add(kit.mesh(kit.sphere(0.07, 12, 8), kit.mat(C.fur, { rough: 0.9 }), { p: [0, -0.04, 0.03], s: [1, 0.8, 0.3], cast: false }));
  frame.add(kit.mesh(kit.sphere(0.025, 8, 6), kit.mat(C.yuzu, { rough: 0.6 }), { p: [0, 0.04, 0.03], s: [1, 1, 0.4], cast: false }));
  root.add(frame);
  // a candle with a tiny glow
  root.add(kit.mesh(kit.cyl(0.05, 0.05, 0.14, 14), kit.mat(C.cream, { rough: 0.8 }), { p: [0.46, top + 0.07, 0.2] }));
  root.add(kit.mesh(kit.cyl(0.07, 0.07, 0.02, 14), kit.mat(C.brass, { rough: 0.4, metal: 0.4 }), { p: [0.46, top + 0.01, 0.2] }));
  const flameMat = kit.uniqueMat(C.honeyHi, { emissive: '#FFB347', emissiveIntensity: 2 });
  const flame = kit.mesh(kit.sphere(0.022, 8, 6), flameMat, { p: [0.46, top + 0.17, 0.2], s: [1, 1.8, 1], cast: false });
  flame.userData.dyn = true;
  root.add(flame);
  const glow = makeGlows([{ p: new Vector3(0.46, top + 0.18, 0.2), c: new Color('#FFB75A').multiplyScalar(0.7), s: 0.4 }], kit.tex.glow(), 13);
  root.add(glow.mesh);
  root.add(kit.blob(0, 0.19, 1.3, 0.34, 0.3, 0.045));
  root.position.set(S.x, S.y, ROOM.zBack);
  const proxy = kit.proxy(1.5, 0.55, 0.45, { p: [0, 0.18, 0.2] });
  return finish(kit, 'shelf', root, proxy, new Vector3(S.x, S.y + 0.15, ROOM.zBack + 0.25), 0.8, {
    fx: [glow],
    anim: ({ t, lamp }) => {
      const f = 0.85 + 0.15 * Math.sin(t * 9.0) * Math.sin(t * 5.3);
      flame.scale.set(1, 1.8 * f, 1);
      flameMat.emissiveIntensity = 1.2 + lamp;
      glow.u.uTime.value = t;
      glow.u.uOn.value = (0.4 + 0.6 * lamp) * f;
    },
  });
};

/** Tea set follows the table / kotatsu top. */
const teaSet: Builder = (kit, { tableTop }) => {
  const root = new Group();
  const tray = kit.mat(C.woodHi, { rough: 0.6 });
  root.add(kit.mesh(kit.smoothLathe([[0.001, 0], [0.36, 0], [0.38, 0.04], [0.36, 0.045], [0.001, 0.02]], 2, 32), tray));
  const pot = group({ p: [0, 0.03, -0.02] });
  const potMat = kit.mat(C.sage, { rough: 0.4 });
  pot.add(kit.mesh(kit.smoothLathe([[0.001, 0], [0.14, 0], [0.2, 0.08], [0.2, 0.16], [0.14, 0.24], [0.09, 0.26], [0.001, 0.26]], 4, 28), potMat));
  pot.add(kit.mesh(kit.smoothLathe([[0.1, 0], [0.09, 0.04], [0.04, 0.07], [0.001, 0.075]], 2, 20), kit.mat(C.cream, { rough: 0.5 }), { p: [0, 0.25, 0] }));
  pot.add(kit.mesh(kit.sphere(0.03, 10, 8), kit.mat(C.persimmon, { rough: 0.5 }), { p: [0, 0.34, 0] }));
  pot.add(kit.mesh(kit.cyl(0.025, 0.05, 0.2, 10), potMat, { p: [0.22, 0.17, 0], r: [0, 0, -0.9] }));
  pot.add(kit.mesh(kit.torus(0.08, 0.02, Math.PI * 1.3, 6, 14), potMat, { p: [-0.2, 0.14, 0], r: [0, 0, Math.PI * 0.35] }));
  // polka dots
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * Math.PI * 2;
    pot.add(kit.mesh(kit.sphere(0.022, 8, 6), kit.mat(C.cream, { rough: 0.5 }), { p: [Math.cos(a) * 0.2, 0.13, Math.sin(a) * 0.2], s: [0.4, 1, 1], r: [0, -a, 0] }));
  }
  root.add(pot);
  for (const [dx, dz] of [
    [0.22, 0.2],
    [-0.2, 0.22],
  ]) {
    root.add(kit.mesh(kit.smoothLathe([[0.001, 0], [0.05, 0], [0.075, 0.08], [0.07, 0.085], [0.045, 0.02], [0.001, 0.02]], 2, 18), kit.mat(C.cream, { rough: 0.45, side: DoubleSide }), { p: [dx, 0.03, dz] }));
    root.add(kit.mesh(kit.cyl(0.06, 0.06, 0.005, 14), kit.mat(C.tea, { rough: 0.3 }), { p: [dx, 0.095, dz] }));
  }
  root.add(kit.blob(0, 0, 0.85, 0.85, 0.35, 0.002));
  const steam = makeSteam(kit.tex.puff(), 8, 91, { size: 0.16, rise: 0.6, life: 3.5, spread: 0.1, opacity: 0.4 });
  steam.u.uIntensity.value = 1;
  steam.u.uOrigin.value.set(0.3, 0.3, -0.02);
  steam.u.uDir.value.set(0.4, 0.2, 0);
  const proxy = kit.proxy(0.8, 0.45, 0.8, { p: [0, 0.2, 0] });
  const b = finish(kit, 'teaSet', root, proxy, new Vector3(), 0.5, { fx: [steam] });
  root.add(steam.mesh);
  const place = () => {
    const tt = tableTop();
    root.position.set(tt.x - 0.2, tt.y, tt.z - 0.15);
    b.focus.set(tt.x - 0.2, tt.y + 0.2, tt.z - 0.15);
  };
  place();
  root.userData.relayout = place;
  return {
    ...b,
    anim: ({ t }) => {
      steam.u.uTime.value = t;
    },
    steam,
  } as ItemBuild & { steam: SteamFX };
};

const recordPlayer: Builder = (kit) => {
  const root = new Group();
  const Cr = SPOTS.crate;
  const crateMat = kit.mat(C.wood, { rough: 0.8 });
  const crateDeep = kit.mat(C.woodMid, { rough: 0.8 });
  // slatted crate (open front) with records inside
  const cw = 1.0;
  const ch = 0.72;
  const cd = 0.62;
  root.add(kit.mesh(kit.rbox(cw, 0.06, cd, 0.02, 1), crateDeep, { p: [0, 0.03, 0] }));
  for (const dx of [-cw / 2 + 0.03, cw / 2 - 0.03]) {
    for (let k = 0; k < 3; k++) root.add(kit.mesh(kit.rbox(0.06, 0.18, cd, 0.025, 2), crateMat, { p: [dx, 0.14 + k * 0.23, 0] }));
  }
  for (let k = 0; k < 3; k++) root.add(kit.mesh(kit.rbox(cw, 0.18, 0.05, 0.025, 2), crateMat, { p: [0, 0.14 + k * 0.23, -cd / 2 + 0.025] }));
  root.add(kit.mesh(kit.rbox(cw + 0.04, 0.06, cd + 0.04, 0.025, 2), crateDeep, { p: [0, ch, 0] }));
  const sleeves = [C.berry, C.sky, C.honey, C.cream, C.sage, C.persimmon, C.lilac];
  for (let i = 0; i < 7; i++) {
    root.add(kit.mesh(kit.rbox(0.05, 0.5, 0.5, 0.015, 1), kit.mat(sleeves[i], { rough: 0.8 }), { p: [-0.36 + i * 0.12, 0.33, 0.02], r: [0, 0, (i - 3) * 0.05] }));
  }
  // turntable
  const tt = group({ p: [0, ch + 0.03, 0] });
  tt.add(kit.mesh(kit.rbox(0.86, 0.14, 0.58, 0.05, 3), kit.mat(C.skyHi, { rough: 0.5 }), { p: [0, 0.07, 0] }));
  tt.add(kit.mesh(kit.rbox(0.87, 0.04, 0.59, 0.02, 2), kit.mat(C.woodDeep, { rough: 0.6 }), { p: [0, 0.02, 0] }));
  tt.add(kit.mesh(kit.cyl(0.25, 0.25, 0.03, 32), kit.mat('#E6E6EE', { rough: 0.3, metal: 0.5 }), { p: [-0.1, 0.155, 0] }));
  const platter = group({ p: [-0.1, 0.175, 0] });
  platter.userData.dyn = true;
  platter.add(kit.mesh(kit.cyl(0.24, 0.24, 0.012, 36), kit.mat(C.ink, { rough: 0.25 })));
  platter.add(kit.mesh(kit.torus(0.17, 0.004, Math.PI * 2, 4, 36), kit.mat('#5A4636', { rough: 0.2 }), { p: [0, 0.007, 0], r: [Math.PI / 2, 0, 0], cast: false }));
  platter.add(kit.mesh(kit.cyl(0.08, 0.08, 0.014, 20), kit.mat(C.persimmon, { rough: 0.6 }), { p: [0, 0.002, 0] }));
  platter.add(kit.mesh(kit.cyl(0.02, 0.02, 0.018, 8), kit.mat(C.honey, { rough: 0.6 }), { p: [0.04, 0.004, 0.02] }));
  kit.mergeStatic(platter);
  tt.add(platter);
  // tonearm
  tt.add(kit.mesh(kit.cyl(0.04, 0.05, 0.08, 12), kit.mat(C.brass, { rough: 0.35, metal: 0.5 }), { p: [0.27, 0.19, -0.18] }));
  tt.add(kit.mesh(kit.cyl(0.012, 0.012, 0.38, 6), kit.mat('#D8D8E2', { rough: 0.3, metal: 0.6 }), { p: [0.17, 0.225, -0.05], r: [Math.PI / 2, 0.6, 0], s: 1 }));
  tt.add(kit.mesh(kit.rbox(0.05, 0.03, 0.08, 0.01, 1), kit.mat(C.ink, { rough: 0.4 }), { p: [0.06, 0.215, 0.1] }));
  // knobs
  tt.add(kit.mesh(kit.cyl(0.03, 0.03, 0.03, 10), kit.mat(C.honey, { rough: 0.5 }), { p: [0.3, 0.1, 0.29], r: [Math.PI / 2, 0, 0] }));
  root.add(tt);
  root.add(kit.blob(0, 0, 1.5, 1.0, 0.5));
  root.position.set(Cr.x, 0, Cr.z);
  root.rotation.y = -0.12;
  // a music note that drifts up now and then
  const noteMat = new SpriteMaterial({ map: kit.tex.note(), color: new Color(C.honeyHi), transparent: true, depthWrite: false, opacity: 0 });
  const note = new Sprite(noteMat);
  note.scale.setScalar(0.18);
  note.renderOrder = 7;
  const base = new Vector3(-0.1, ch + 0.4, 0.1);
  note.position.copy(base);
  root.add(note);
  const proxy = kit.proxy(1.05, 1.1, 0.7, { p: [0, 0.55, 0] });
  return finish(kit, 'recordPlayer', root, proxy, new Vector3(Cr.x, 0.8, Cr.z), 0.75, {
    sprites: [note],
    anim: ({ t, dt }) => {
      platter.rotation.y -= dt * 3.5;
      const ph = (t * 0.22) % 1;
      note.position.set(base.x + Math.sin(ph * 6) * 0.08, base.y + ph * 0.9, base.z);
      noteMat.opacity = Math.sin(Math.PI * ph) * 0.85;
      noteMat.rotation = Math.sin(ph * 5) * 0.3;
    },
  });
};

const blanket: Builder = (kit) => {
  const root = new Group();
  const Bk = SPOTS.basket;
  const wicker = kit.mat(C.woodHi, { rough: 0.9 });
  const wickerDeep = kit.mat(C.wood, { rough: 0.9 });
  root.add(kit.mesh(kit.smoothLathe([[0.001, 0], [0.34, 0], [0.4, 0.05], [0.45, 0.5], [0.47, 0.55], [0.43, 0.56], [0.39, 0.1], [0.001, 0.1]], 3, 32), wicker));
  for (const y of [0.14, 0.27, 0.4]) {
    root.add(kit.mesh(kit.torus(0.405 + (y - 0.05) * 0.1, 0.022, Math.PI * 2, 5, 36), wickerDeep, { p: [0, y, 0], r: [Math.PI / 2, 0, 0], cast: false }));
  }
  const knitTex = kit.tex.knit();
  const knit = kit.mat('#FFFFFF', { rough: 1, map: knitTex });
  // rolled blanket poking out + a folded flap hanging over the rim
  root.add(kit.mesh(kit.capsule(0.19, 0.42, 6, 18), knit, { p: [0.02, 0.62, 0.02], r: [0.2, 0.3, 1.25] }));
  root.add(kit.mesh(kit.capsule(0.16, 0.3, 6, 18), knit, { p: [-0.12, 0.62, -0.1], r: [-0.4, 0, -0.35] }));
  const flap = kit.rbox(0.5, 0.5, 0.06, 0.03, 3);
  root.add(kit.mesh(flap, knit, { p: [0.15, 0.4, 0.43], r: [0.22, 0.25, 0.05] }));
  // tassels
  for (let i = 0; i < 4; i++) {
    root.add(kit.mesh(kit.capsule(0.022, 0.07, 3, 6), kit.mat(C.honey, { rough: 1 }), { p: [-0.03 + i * 0.12, 0.1, 0.5], r: [0.25, 0, 0] }));
  }
  root.add(kit.blob(0, 0, 1.2, 1.2, 0.5, 0.05));
  root.position.set(Bk.x, 0.03, Bk.z);
  root.rotation.y = -0.4;
  const proxy = kit.proxy(1.0, 1.0, 1.0, { p: [0, 0.45, 0] });
  return finish(kit, 'blanket', root, proxy, new Vector3(Bk.x, 0.5, Bk.z), 0.65);
};

const painting: Builder = (kit) => {
  const root = new Group();
  const P = SPOTS.painting;
  const fw = 1.25;
  const fh = 0.95;
  root.add(kit.mesh(kit.rbox(fw, fh, 0.07, 0.035, 2), kit.mat(C.woodHi, { rough: 0.6 })));
  root.add(kit.mesh(kit.rbox(fw - 0.14, fh - 0.14, 0.02, 0.01, 1), kit.mat(C.cream, { rough: 0.9 }), { p: [0, 0, 0.03], cast: false }));
  const art = new Mesh(kit.plane(fw - 0.24, fh - 0.24), kit.mat('#FFFFFF', { rough: 0.95, map: kit.tex.painting() }));
  art.position.z = 0.042;
  root.add(art);
  // hanging string
  root.add(kit.mesh(kit.torus(0.18, 0.008, Math.PI * 0.7, 4, 12), kit.mat(C.espresso, { rough: 0.9 }), { p: [0, fh / 2 - 0.02, -0.01], r: [0, 0, Math.PI * 0.15] }));
  root.position.set(ROOM.xMin + 0.06, P.y, P.z);
  root.rotation.y = Math.PI / 2;
  const proxy = kit.proxy(fw, fh, 0.12, {});
  return finish(kit, 'painting', root, proxy, new Vector3(ROOM.xMin + 0.3, P.y, P.z), 0.75);
};

const lantern: Builder = (kit) => {
  const root = new Group();
  const Ln = SPOTS.lantern;
  const iron = kit.mat(C.ironDeep, { rough: 0.6 });
  // wall bracket
  const armLen = Ln.x - ROOM.xMin;
  root.add(kit.mesh(kit.rbox(0.06, 0.34, 0.14, 0.02, 1), iron, { p: [ROOM.xMin + 0.04, Ln.y + 0.62, Ln.z] }));
  root.add(kit.mesh(kit.cyl(0.018, 0.018, armLen, 8), iron, { p: [ROOM.xMin + armLen / 2, Ln.y + 0.72, Ln.z], r: [0, 0, Math.PI / 2] }));
  root.add(kit.mesh(kit.torus(0.22, 0.014, Math.PI / 2, 4, 10), iron, { p: [ROOM.xMin + 0.26, Ln.y + 0.5, Ln.z], r: [0, 0, Math.PI / 2] }));
  root.add(kit.mesh(kit.sphere(0.035, 8, 6), iron, { p: [Ln.x, Ln.y + 0.72, Ln.z] }));
  // the lantern swings from the tip of the arm
  const pend = group({ p: [Ln.x, Ln.y + 0.72, Ln.z] });
  pend.userData.dyn = true;
  pend.add(kit.mesh(kit.cyl(0.006, 0.006, 0.26, 4), iron, { p: [0, -0.13, 0], cast: false }));
  const paper = kit.uniqueMat(C.cream, { rough: 0.95, emissive: '#FFC48A', emissiveIntensity: 0.9 });
  const ball = kit.mesh(kit.sphere(0.3, 24, 16), paper, { p: [0, -0.56, 0], s: [1, 0.86, 1], cast: false });
  pend.add(ball);
  const rib = kit.mat(C.persimmonHi, { rough: 0.8 });
  for (const y of [-0.12, 0, 0.12]) {
    const rr = Math.sqrt(Math.max(0, 0.3 * 0.3 - (y / 0.86) * (y / 0.86))) + 0.004;
    pend.add(kit.mesh(kit.torus(rr, 0.008, Math.PI * 2, 4, 32), rib, { p: [0, -0.56 + y, 0], r: [Math.PI / 2, 0, 0], cast: false }));
  }
  pend.add(kit.mesh(kit.cyl(0.08, 0.1, 0.05, 14), kit.mat(C.persimmon, { rough: 0.6 }), { p: [0, -0.3, 0] }));
  pend.add(kit.mesh(kit.cyl(0.1, 0.08, 0.05, 14), kit.mat(C.persimmon, { rough: 0.6 }), { p: [0, -0.82, 0] }));
  pend.add(kit.mesh(kit.capsule(0.02, 0.1, 3, 6), kit.mat(C.berry, { rough: 0.8 }), { p: [0, -0.92, 0] }));
  kit.mergeStatic(pend);
  root.add(pend);
  const glow = makeGlows([{ p: new Vector3(0, -0.56, 0), c: new Color('#FFB866'), s: 1.5 }], kit.tex.glow(), 29);
  glow.u.uTwinkle.value = 0;
  pend.add(glow.mesh);
  const proxy = kit.proxy(0.7, 0.8, 0.7, { p: [Ln.x, Ln.y + 0.15, Ln.z] });
  return finish(kit, 'lantern', root, proxy, new Vector3(Ln.x, Ln.y + 0.16, Ln.z), 0.6, {
    fx: [glow],
    anim: ({ t, lamp }) => {
      pend.rotation.z = Math.sin(t * 0.9) * 0.05;
      pend.rotation.x = Math.sin(t * 0.63 + 1) * 0.035;
      paper.emissiveIntensity = 0.25 + 0.95 * lamp;
      glow.u.uOn.value = 0.15 + 0.85 * lamp;
    },
  });
};

const monstera: Builder = (kit) => {
  const root = new Group();
  const M = SPOTS.monstera;
  const potMat = kit.mat(C.cream, { rough: 0.55 });
  root.add(kit.mesh(kit.smoothLathe([[0.001, 0], [0.26, 0], [0.33, 0.1], [0.36, 0.5], [0.38, 0.56], [0.001, 0.56]], 4, 32), potMat));
  root.add(kit.mesh(kit.cyl(0.365, 0.365, 0.08, 32, true), kit.mat(C.persimmon, { rough: 0.6, side: DoubleSide }), { p: [0, 0.34, 0] }));
  root.add(kit.mesh(kit.cyl(0.34, 0.34, 0.02, 24), kit.mat(C.woodDark, { rough: 1 }), { p: [0, 0.54, 0] }));
  // tiny wooden stand
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2;
    root.add(kit.mesh(kit.cyl(0.03, 0.03, 0.1, 6), kit.mat(C.woodMid), { p: [Math.cos(a) * 0.22, -0.04, Math.sin(a) * 0.22] }));
  }
  const leafMat = kit.mat(C.leafDeep, { side: DoubleSide, rough: 0.55 });
  const leafMat2 = kit.mat(C.matcha, { side: DoubleSide, rough: 0.55 });
  const stemMat = kit.mat(C.matchaDeep, { rough: 0.7 });
  const leaves: Group[] = [];
  const defs = [
    { a: 0.2, tilt: 0.55, h: 1.5, s: 0.95 },
    { a: 1.4, tilt: 0.75, h: 1.25, s: 0.85 },
    { a: 2.6, tilt: 0.6, h: 1.65, s: 1.0 },
    { a: 3.7, tilt: 0.8, h: 1.2, s: 0.8 },
    { a: 4.9, tilt: 0.5, h: 1.8, s: 1.05 },
    { a: 5.7, tilt: 0.95, h: 1.0, s: 0.75 },
  ];
  defs.forEach((d, i) => {
    const pivot = group({ p: [0, 0.55, 0], r: [0, d.a, 0] });
    pivot.userData.dyn = true;
    const lean = d.tilt;
    const top = new Vector3(Math.sin(lean) * d.h * 0.55, d.h, 0);
    const curve = new CatmullRomCurve3([new Vector3(0, 0, 0), new Vector3(top.x * 0.3, d.h * 0.55, 0), top]);
    pivot.add(kit.mesh(kit.track(new TubeGeometry(curve, 10, 0.022, 5, false)), stemMat));
    // holder tips the blade up (inner leaves) or lets it droop (outer ones)
    const holder = group({ p: [top.x, top.y, 0], r: [0, 0, 0.55 - lean * 0.85] });
    // blade: local +y → outward (+x), face normal → up
    holder.add(kit.mesh(monsteraLeaf(kit, 40 + i), i % 2 ? leafMat2 : leafMat, { r: [-Math.PI / 2, 0, -Math.PI / 2], s: d.s * 0.95 }));
    pivot.add(holder);
    kit.mergeStatic(pivot);
    leaves.push(pivot);
    root.add(pivot);
  });
  root.add(kit.blob(0, 0, 1.2, 1.2, 0.5));
  root.position.set(M.x, 0.06, M.z);
  const proxy = kit.proxy(1.4, 2.4, 1.4, { p: [0, 1.2, 0] });
  const baseRot = defs.map((d) => d.a);
  return finish(kit, 'monstera', root, proxy, new Vector3(M.x, 1.3, M.z), 0.9, {
    anim: ({ t }) => {
      for (let i = 0; i < leaves.length; i++) {
        leaves[i].rotation.y = baseRot[i] + Math.sin(t * 0.45 + i * 1.3) * 0.035;
        leaves[i].rotation.z = Math.sin(t * 0.6 + i * 2.1) * 0.025;
      }
    },
  });
};

const catBed: Builder = (kit) => {
  const root = new Group();
  const Cb = SPOTS.catBed;
  // round bolster bed
  root.add(kit.mesh(kit.cyl(0.46, 0.48, 0.08, 36), kit.mat(C.skyDeep, { rough: 0.95 }), { p: [0, 0.04, 0] }));
  root.add(kit.mesh(kit.torus(0.42, 0.13, Math.PI * 2, 12, 36), kit.mat(C.sky, { rough: 0.95 }), { p: [0, 0.14, 0], r: [Math.PI / 2, 0, 0] }));
  root.add(kit.mesh(kit.cyl(0.36, 0.36, 0.06, 32), kit.mat(C.skyHi, { rough: 1 }), { p: [0, 0.1, 0] }));
  root.add(kit.blob(0, 0, 1.3, 1.3, 0.5, 0.05));
  // the cat: a curled cream loaf with calico patches
  const cat = group({ p: [0, 0.1, 0], s: 1.3 });
  cat.userData.dyn = true;
  const fur = kit.mat('#F6EBDD', { rough: 0.95 });
  const patch = kit.mat(C.persimmonHi, { rough: 0.95 });
  const dark = kit.mat('#5A4A55', { rough: 0.95 });
  const body = group();
  body.add(kit.mesh(kit.sphere(0.27, 24, 16), fur, { p: [0, 0.13, 0], s: [1.15, 0.62, 1] }));
  body.add(kit.mesh(kit.sphere(0.16, 16, 12), patch, { p: [-0.08, 0.2, -0.06], s: [1.1, 0.5, 1.0] }));
  cat.add(body);
  // tail wrapping round the front
  cat.add(kit.mesh(kit.torus(0.26, 0.05, Math.PI * 1.1, 8, 24), dark, { p: [0, 0.07, 0], r: [Math.PI / 2, 0, 0.3] }));
  // head resting on the tail
  const head = group({ p: [0.2, 0.13, 0.14] });
  head.add(kit.mesh(kit.sphere(0.13, 20, 14), fur, { s: [1.05, 0.9, 1] }));
  head.add(kit.mesh(kit.sphere(0.07, 12, 8), dark, { p: [-0.04, 0.06, -0.05], s: [1, 0.6, 1] }));
  for (const s of [-1, 1]) {
    head.add(kit.mesh(kit.cyl(0.001, 0.055, 0.1, 4), s < 0 ? dark : fur, { p: [s * 0.07, 0.12, -0.02], r: [-0.15, 0, -s * 0.35] }));
    head.add(kit.mesh(kit.torus(0.025, 0.007, Math.PI, 4, 8), kit.mat(C.ink, { rough: 0.8 }), { p: [s * 0.05, 0.0, 0.12], r: [0, 0, Math.PI] , cast: false }));
  }
  head.add(kit.mesh(kit.sphere(0.014, 6, 4), kit.mat(C.berry, { rough: 0.6 }), { p: [0, -0.03, 0.128], cast: false }));
  head.rotation.y = 0.7;
  cat.add(head);
  kit.mergeStatic(body);
  kit.mergeStatic(head);
  root.add(cat);
  // zzz: a tiny floating z
  root.position.set(Cb.x, 0.02, Cb.z);
  root.rotation.y = 0.2;
  const proxy = kit.proxy(1.0, 0.6, 1.0, { p: [0, 0.25, 0] });
  const b = finish(kit, 'catBed', root, proxy, new Vector3(Cb.x, 0.3, Cb.z), 0.6, {
    anim: ({ t }) => {
      const br = Math.sin(t * 1.6);
      body.scale.set(1 + br * 0.012, 1 + br * 0.03, 1 + br * 0.012);
      head.position.y = 0.13 + br * 0.006;
    },
  });
  return b;
};

const telescope: Builder = (kit) => {
  const root = new Group();
  const Ts = SPOTS.telescope;
  const wood = kit.mat(C.woodMid, { rough: 0.7 });
  const brass = kit.mat(C.brass, { rough: 0.3, metal: 0.55 });
  const hinge = new Vector3(0, 1.2, 0);
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2 + 0.3;
    const foot = new Vector3(Math.cos(a) * 0.42, 0, Math.sin(a) * 0.42);
    const mid = hinge.clone().add(foot).multiplyScalar(0.5);
    const len = hinge.distanceTo(foot);
    const leg = kit.mesh(kit.cyl(0.025, 0.035, len, 8), wood, { p: [mid.x, mid.y, mid.z] });
    leg.quaternion.setFromUnitVectors(Y_AXIS, hinge.clone().sub(foot).normalize());
    root.add(leg);
    root.add(kit.mesh(kit.sphere(0.04, 8, 6), brass, { p: [foot.x, 0.02, foot.z] }));
  }
  root.add(kit.mesh(kit.sphere(0.07, 12, 8), brass, { p: [0, 1.2, 0] }));
  // tube points at the window sky
  const tube = group({ p: [0, 1.28, 0] });
  const tubeMat = kit.mat(C.sky, { rough: 0.35, metal: 0.1 });
  tube.add(kit.mesh(kit.cyl(0.1, 0.075, 1.1, 20), tubeMat, { p: [0, 0.2, 0] }));
  tube.add(kit.mesh(kit.cyl(0.125, 0.12, 0.2, 20), tubeMat, { p: [0, 0.8, 0] }));
  tube.add(kit.mesh(kit.cyl(0.13, 0.13, 0.04, 20), brass, { p: [0, 0.9, 0] }));
  tube.add(kit.mesh(kit.cyl(0.11, 0.11, 0.035, 20), brass, { p: [0, 0.35, 0] }));
  tube.add(kit.mesh(kit.cyl(0.085, 0.085, 0.035, 20), brass, { p: [0, -0.2, 0] }));
  tube.add(kit.mesh(kit.cyl(0.035, 0.04, 0.18, 12), kit.mat(C.ink, { rough: 0.5 }), { p: [0, -0.43, 0] }));
  tube.add(kit.mesh(kit.cyl(0.1, 0.1, 0.01, 20), kit.mat(C.skyHi, { rough: 0.1, metal: 0.3 }), { p: [0, 0.92, 0] }));
  // aim: toward the back-left, up at the sky
  tube.rotation.set(-0.95, 0.55, 0.15, 'YXZ');
  root.add(tube);
  root.add(kit.blob(0, 0, 1.1, 1.1, 0.4));
  root.position.set(Ts.x, 0, Ts.z);
  const proxy = kit.proxy(0.9, 2.1, 0.9, { p: [0, 1.05, 0] });
  return finish(kit, 'telescope', root, proxy, new Vector3(Ts.x, 1.2, Ts.z), 0.7);
};

const kotatsu: Builder = (kit) => {
  const root = new Group();
  const T = SPOTS.table;
  const quilt = kit.mat(C.sage, { rough: 1 });
  const quiltDeep = kit.mat(C.sageDeep, { rough: 1 });
  // puffy quilt: a soft rounded slab that flares to the floor
  root.add(kit.mesh(kit.rbox(1.95, 0.5, 1.95, 0.22, 5), quilt, { p: [0, 0.25, 0] }));
  root.add(kit.mesh(kit.rbox(2.08, 0.1, 2.08, 0.05, 3), quiltDeep, { p: [0, 0.05, 0] }));
  // quilting stitches
  for (const d of [-0.5, 0, 0.5]) {
    root.add(kit.mesh(kit.rbox(1.96, 0.02, 0.03, 0.01, 1), quiltDeep, { p: [0, 0.5, d], cast: false }));
    root.add(kit.mesh(kit.rbox(0.03, 0.02, 1.96, 0.01, 1), quiltDeep, { p: [d, 0.5, 0], cast: false }));
  }
  // wooden top
  root.add(kit.mesh(kit.rbox(1.55, 0.09, 1.55, 0.04, 3), kit.mat(C.woodHi, { rough: 0.55 }), { p: [0, 0.56, 0] }));
  root.add(kit.mesh(kit.rbox(1.6, 0.05, 1.6, 0.025, 2), kit.mat(C.woodMid, { rough: 0.6 }), { p: [0, 0.51, 0] }));
  // bowl of yuzu
  const bowlY = 0.605;
  root.add(kit.mesh(kit.smoothLathe([[0.001, 0], [0.12, 0], [0.24, 0.08], [0.26, 0.13], [0.24, 0.13], [0.11, 0.03], [0.001, 0.03]], 3, 28), kit.mat(C.cream, { rough: 0.45, side: DoubleSide }), { p: [0.35, bowlY, 0.32] }));
  const yuzuMat = kit.mat(C.yuzu, { rough: 0.55 });
  const leafM = kit.mat(C.leaf, { rough: 0.6, side: DoubleSide });
  for (const [dx, dy, dz] of [
    [-0.07, 0.11, -0.05],
    [0.08, 0.11, -0.03],
    [0.0, 0.12, 0.08],
    [0.01, 0.2, -0.0],
  ]) {
    root.add(kit.mesh(kit.sphere(0.09, 16, 12), yuzuMat, { p: [0.35 + dx, bowlY + dy, 0.32 + dz], s: [1, 0.9, 1] }));
  }
  root.add(kit.mesh(teardrop(kit), leafM, { p: [0.38, bowlY + 0.29, 0.32], s: 0.1, r: [-0.5, 0.4, -0.6] }));
  root.add(kit.blob(0, 0, 2.8, 2.8, 0.45, 0.05));
  root.position.set(T.x, 0.03, T.z);
  const proxy = kit.proxy(2.0, 0.7, 2.0, { p: [0, 0.35, 0] });
  return finish(kit, 'kotatsu', root, proxy, new Vector3(T.x, 0.5, T.z), 1.1);
};

export const BUILDERS: Record<string, Builder> = {
  pothos,
  books,
  cushion,
  fairyLights,
  shelf,
  teaSet,
  recordPlayer,
  blanket,
  painting,
  lantern,
  monstera,
  catBed,
  telescope,
  kotatsu,
};
