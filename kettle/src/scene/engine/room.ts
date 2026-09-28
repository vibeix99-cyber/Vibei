/**
 * The base room (always present): floor, two walls with an arched window,
 * the view outside, floor lamp, low table + mug, rug, and fake light decals.
 */
import {
  AdditiveBlending,
  CircleGeometry,
  Color,
  DoubleSide,
  ExtrudeGeometry,
  Group,
  Mesh,
  MeshBasicMaterial,
  Path,
  Shape,
  ShapeGeometry,
  Vector3,
  type MeshStandardMaterial,
} from 'three';
import { Kit } from './kit';
import { C } from './palette';
import { ROOM, SPOTS, WIN } from './layout';
import { makeFireflies, makeGlassMaterial, makeGlows, makeRain, makeSkyMaterial, makeSnow, makeSteam, type FieldFX, type GlowFX, type SteamFX } from './fx';

export interface RoomParts {
  root: Group;
  sky: ReturnType<typeof makeSkyMaterial>;
  glass: ReturnType<typeof makeGlassMaterial>;
  rain: FieldFX;
  snow: FieldFX;
  fireflies: FieldFX;
  moon: Group;
  sun: Mesh;
  clouds: Group;
  hillFar: MeshBasicMaterial;
  hillNear: MeshBasicMaterial;
  houseWin: MeshBasicMaterial;
  snowCaps: Group;
  winPatch: MeshBasicMaterial;
  lampShade: MeshStandardMaterial;
  lampDecals: MeshBasicMaterial;
  lampGlow: GlowFX;
  lampBulb: Vector3;
  table: Group;
  tableTopY: { table: number };
  mug: Group;
  mugSteam: SteamFX;
  wallTrim: MeshStandardMaterial;
}

/** Crescent moon outline: disc (r) minus an offset disc (r2 at dx,dy). */
function crescent(r: number, r2: number, dx: number, dy: number): Shape {
  const d = Math.hypot(dx, dy);
  const a = (d * d + r * r - r2 * r2) / (2 * d);
  const base = Math.atan2(dy, dx);
  const half = Math.acos(Math.min(1, a / r));
  const s = new Shape();
  // outer arc: the long way round the main disc
  s.absarc(0, 0, r, base + half, base - half + Math.PI * 2, false);
  // inner arc: back along the biting disc
  const b1 = Math.atan2(r * Math.sin(base - half) - dy, r * Math.cos(base - half) - dx);
  const b2 = Math.atan2(r * Math.sin(base + half) - dy, r * Math.cos(base + half) - dx);
  s.absarc(dx, dy, r2, b1, b2, true);
  return s;
}

function archShape(cx: number, y0: number, w: number, top: number, path: Shape | Path) {
  const r = w / 2;
  const ys = top - r;
  path.moveTo(cx - r, y0);
  path.lineTo(cx + r, y0);
  path.lineTo(cx + r, ys);
  path.absarc(cx, ys, r, 0, Math.PI, false);
  path.lineTo(cx - r, y0);
  return path;
}

export function buildRoom(kit: Kit): RoomParts {
  const root = new Group();
  root.name = 'room';
  const { xMin, xMax, zBack, zFront, h, wall, bevel, slab } = ROOM;

  // ---------------- floor
  const floor = new Group();
  const slabW = xMax - xMin + wall + 0.12;
  const slabD = zFront - zBack + wall + 0.12;
  floor.add(
    kit.mesh(kit.rbox(slabW, slab, slabD, 0.1, 3), kit.mat(C.woodDeep, { rough: 0.9 }), {
      p: [(xMin - wall + xMax + 0.12) / 2, -slab / 2 - 0.05, (zBack - wall + zFront + 0.12) / 2],
      cast: false,
    }),
  );
  const planks = 11;
  const pw = (xMax - xMin) / planks;
  const tones = [C.wood, C.woodHi, C.wood, C.woodMid];
  for (let i = 0; i < planks; i++) {
    const x = xMin + pw * (i + 0.5);
    // Staggered seams: each plank is two boards of different length.
    const split = 0.3 + ((i * 0.37) % 0.45);
    const len = zFront - zBack;
    const aLen = len * split;
    const bLen = len - aLen;
    const za = zBack + aLen / 2;
    const zb = zBack + aLen + bLen / 2;
    const t1 = tones[i % tones.length];
    const t2 = tones[(i + 2) % tones.length];
    floor.add(kit.mesh(kit.rbox(pw - 0.035, 0.07, aLen - 0.035, 0.025, 2), kit.mat(t1, { rough: 0.78 }), { p: [x, -0.035, za], cast: false }));
    floor.add(kit.mesh(kit.rbox(pw - 0.035, 0.07, bLen - 0.035, 0.025, 2), kit.mat(t2, { rough: 0.78 }), { p: [x, -0.035, zb], cast: false }));
  }
  kit.mergeStatic(floor);
  root.add(floor);

  // ---------------- walls
  const plaster = kit.mat(C.oat, { rough: 0.95 });
  const wallEdge = kit.mat('#E9CDA8', { rough: 0.9 });
  const extrudeOpts = { depth: wall - bevel * 2, bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 3, curveSegments: 24 };

  const back = new Shape();
  back.moveTo(xMin - wall, -0.2);
  back.lineTo(xMax, -0.2);
  back.lineTo(xMax, h);
  back.lineTo(xMin - wall, h);
  back.lineTo(xMin - wall, -0.2);
  const hole = new Path();
  archShape(WIN.cx, WIN.y0 - bevel, WIN.w + bevel * 2, WIN.y1 + bevel, hole);
  back.holes.push(hole);
  const backGeo = kit.track(new ExtrudeGeometry(back, extrudeOpts));
  const backWall = new Mesh(backGeo, [plaster, wallEdge]);
  backWall.position.z = zBack - wall + bevel;
  backWall.receiveShadow = true;
  root.add(backWall);

  const left = new Shape();
  left.moveTo(zBack - wall, -0.2);
  left.lineTo(zFront, -0.2);
  left.lineTo(zFront, h);
  left.lineTo(zBack - wall, h);
  left.lineTo(zBack - wall, -0.2);
  const leftGeo = kit.track(new ExtrudeGeometry(left, extrudeOpts));
  const leftWall = new Mesh(leftGeo, [plaster, wallEdge]);
  // Shape x → world -z … rotate so the shape's x runs along +z.
  leftWall.rotation.y = Math.PI / 2;
  leftWall.position.x = xMin - wall + bevel;
  leftWall.scale.x = -1;
  leftWall.receiveShadow = true;
  root.add(leftWall);

  // Wainscot (sage panels), chair rail, baseboard.
  const trim = new Group();
  const wainH = 1.05;
  const sage = kit.mat(C.sage, { rough: 0.9 });
  const trimMat = kit.mat(C.cream, { rough: 0.7 });
  const backLen = xMax - xMin;
  trim.add(kit.mesh(kit.rbox(backLen, wainH, 0.07, 0.03, 2), sage, { p: [(xMin + xMax) / 2, wainH / 2, zBack + 0.035], cast: false }));
  const sideLen = zFront - zBack;
  trim.add(kit.mesh(kit.rbox(0.07, wainH, sideLen, 0.03, 2), sage, { p: [xMin + 0.035, wainH / 2, (zBack + zFront) / 2], cast: false }));
  // panel grooves
  const groove = kit.mat(C.sageDeep, { rough: 0.9 });
  for (let x = xMin + 0.55; x < xMax - 0.2; x += 0.62) {
    trim.add(kit.mesh(kit.rbox(0.04, wainH - 0.35, 0.03, 0.015, 1), groove, { p: [x, wainH / 2 + 0.02, zBack + 0.075], cast: false }));
  }
  for (let z = zBack + 0.55; z < zFront - 0.2; z += 0.62) {
    trim.add(kit.mesh(kit.rbox(0.03, wainH - 0.35, 0.04, 0.015, 1), groove, { p: [xMin + 0.075, wainH / 2 + 0.02, z], cast: false }));
  }
  trim.add(kit.mesh(kit.rbox(backLen, 0.09, 0.14, 0.04, 2), trimMat, { p: [(xMin + xMax) / 2, wainH + 0.02, zBack + 0.07] }));
  trim.add(kit.mesh(kit.rbox(0.14, 0.09, sideLen, 0.04, 2), trimMat, { p: [xMin + 0.07, wainH + 0.02, (zBack + zFront) / 2] }));
  trim.add(kit.mesh(kit.rbox(backLen, 0.16, 0.11, 0.04, 2), trimMat, { p: [(xMin + xMax) / 2, 0.08, zBack + 0.055], cast: false }));
  trim.add(kit.mesh(kit.rbox(0.11, 0.16, sideLen, 0.04, 2), trimMat, { p: [xMin + 0.055, 0.08, (zBack + zFront) / 2], cast: false }));
  kit.mergeStatic(trim);
  root.add(trim);

  // ---------------- window
  const win = new Group();
  const frameMat = kit.mat(C.cream, { rough: 0.6 });
  const fw = 0.13;
  const frameShape = archShape(WIN.cx, WIN.y0 - fw, WIN.w + fw * 2, WIN.y1 + fw, new Shape()) as Shape;
  frameShape.holes.push(archShape(WIN.cx, WIN.y0, WIN.w, WIN.y1, new Path()) as Path);
  const frameGeo = kit.track(
    new ExtrudeGeometry(frameShape, { depth: 0.1, bevelEnabled: true, bevelThickness: 0.03, bevelSize: 0.03, bevelSegments: 2, curveSegments: 28 }),
  );
  win.add(kit.mesh(frameGeo, frameMat, { p: [0, 0, zBack - 0.02] }));
  // muntins
  const mullion = kit.rbox(0.07, WIN.y1 - WIN.y0, 0.07, 0.03, 2);
  win.add(kit.mesh(mullion, frameMat, { p: [WIN.cx, (WIN.y0 + WIN.y1) / 2, zBack - 0.1] }));
  const transomY = WIN.ySpring;
  win.add(kit.mesh(kit.rbox(WIN.w, 0.07, 0.07, 0.03, 2), frameMat, { p: [WIN.cx, transomY, zBack - 0.1] }));
  // sill (inside) + ledge (outside)
  win.add(kit.mesh(kit.rbox(WIN.w + 0.6, 0.1, 0.4, 0.045, 3), frameMat, { p: [WIN.cx, WIN.y0 - 0.1, zBack + 0.1] }));
  win.add(kit.mesh(kit.rbox(0.9, 0.06, 0.08, 0.03, 2), frameMat, { p: [WIN.cx, WIN.y0 - 0.22, zBack + 0.1] }));
  win.add(kit.mesh(kit.rbox(WIN.w + 0.3, 0.08, 0.3, 0.035, 2), kit.mat('#D8C7B4', { rough: 0.9 }), { p: [WIN.cx, WIN.y0 - 0.03, zBack - wall - 0.08], cast: false }));
  kit.mergeStatic(win);
  root.add(win);

  // curtains: two soft drapes tied back
  const curtainMat = kit.mat('#FFC6A6', { rough: 0.95 });
  const tie = kit.mat(C.honey, { rough: 0.7 });
  const curtains = new Group();
  for (const side of [-1, 1]) {
    const cx = WIN.cx + side * (WIN.w / 2 + 0.28);
    const drape = kit.smoothLathe(
      [
        [0.001, 3.62],
        [0.16, 3.55],
        [0.2, 3.1],
        [0.13, 2.25],
        [0.09, 2.0],
        [0.2, 1.6],
        [0.27, 1.12],
        [0.28, 0.98],
        [0.001, 0.97],
      ],
      4,
      18,
    );
    curtains.add(kit.mesh(drape, curtainMat, { p: [cx, 0, zBack + 0.24], s: [1, 1, 0.55] }));
    curtains.add(kit.mesh(kit.torus(0.12, 0.035, Math.PI * 2, 8, 18), tie, { p: [cx, 2.02, zBack + 0.24], r: [Math.PI / 2, 0, 0], s: [1, 0.6, 1] }));
  }
  // rod
  curtains.add(kit.mesh(kit.cyl(0.035, 0.035, WIN.w + 1.1, 10), kit.mat(C.woodDeep, { rough: 0.6 }), { p: [WIN.cx, 3.62, zBack + 0.24], r: [0, 0, Math.PI / 2] }));
  for (const side of [-1, 1]) {
    curtains.add(kit.mesh(kit.sphere(0.07, 12, 10), kit.mat(C.brass, { rough: 0.4, metal: 0.3 }), { p: [WIN.cx + side * (WIN.w / 2 + 0.58), 3.62, zBack + 0.24] }));
  }
  kit.mergeStatic(curtains);
  root.add(curtains);

  // glass
  const glass = makeGlassMaterial();
  glass.u.uAspect.value = WIN.w / (WIN.y1 - WIN.y0);
  const glassGeo = kit.track(new ShapeGeometry(archShape(WIN.cx, WIN.y0, WIN.w, WIN.y1, new Shape()) as Shape, 24));
  // normalise UVs to 0..1 across the window
  const uv = glassGeo.getAttribute('uv');
  const pos = glassGeo.getAttribute('position');
  for (let i = 0; i < uv.count; i++) uv.setXY(i, (pos.getX(i) - WIN.x0) / WIN.w, (pos.getY(i) - WIN.y0) / (WIN.y1 - WIN.y0));
  const glassMesh = new Mesh(glassGeo, glass.mat);
  glassMesh.position.z = zBack - 0.12;
  glassMesh.renderOrder = 4;
  root.add(glassMesh);

  // ---------------- outside
  const out = new Group();
  const sky = makeSkyMaterial();
  // Everything outside must stay inside the back wall's silhouette for every
  // allowed camera angle, so the sky is a tight card close behind the wall.
  const skyMesh = new Mesh(kit.plane(4.1, 3.3), sky.mat);
  skyMesh.position.set(WIN.cx - 0.35, 1.85, zBack - 1.7);
  out.add(skyMesh);

  const hillFar = kit.basic('#2E2750', { unique: true });
  const hillNear = kit.basic('#221C3C', { unique: true });
  const hill = (pts: [number, number][], z: number, mat: MeshBasicMaterial) => {
    const s = new Shape();
    s.moveTo(pts[0][0], -0.5);
    for (const [x, y] of pts) s.lineTo(x, y);
    s.lineTo(pts[pts.length - 1][0], -0.5);
    s.lineTo(pts[0][0], -0.5);
    const g = kit.track(new ShapeGeometry(s, 16));
    const m = new Mesh(g, mat);
    m.position.z = z;
    return m;
  };
  const cx = WIN.cx;
  const smoothHill = (x0: number, x1: number, base: number, amp: number, freq: number, phase: number) => {
    const pts: [number, number][] = [];
    for (let i = 0; i <= 40; i++) {
      const x = x0 + ((x1 - x0) * i) / 40;
      pts.push([x, base + amp * Math.sin(x * freq + phase) + amp * 0.5 * Math.sin(x * freq * 2.3 + phase * 1.7)]);
    }
    return pts;
  };
  out.add(hill(smoothHill(cx - 2.3, cx + 1.6, 1.62, 0.2, 1.1, 0.6), zBack - 1.38, hillFar));
  out.add(hill(smoothHill(cx - 2.3, cx + 1.6, 1.3, 0.14, 1.6, 2.2), zBack - 1.08, hillNear));
  // neighbour house on the far hill
  const house = new Group();
  const houseBody = kit.basic('#241D3C', { unique: true });
  house.add(new Mesh(kit.plane(0.36, 0.26), houseBody));
  const roof = new Shape();
  roof.moveTo(-0.24, 0.12);
  roof.lineTo(0, 0.32);
  roof.lineTo(0.24, 0.12);
  roof.lineTo(-0.24, 0.12);
  house.add(new Mesh(kit.track(new ShapeGeometry(roof)), houseBody));
  const houseWin = kit.basic(C.honey, { unique: true });
  const hw = new Mesh(kit.plane(0.08, 0.08), houseWin);
  hw.position.set(0.06, 0.0, 0.01);
  house.add(hw);
  house.position.set(cx - 0.5, 1.84, zBack - 1.33);
  out.add(house);
  // round trees on the near hill (merged with the house + hills below)
  const treeMat = hillNear;
  for (const [tx, ty, ts] of [
    [cx + 0.62, 1.4, 0.19],
    [cx + 0.86, 1.38, 0.13],
    [cx - 0.95, 1.33, 0.15],
  ] as const) {
    const t = new Mesh(kit.track(new CircleGeometry(ts, 18)), treeMat);
    t.position.set(tx, ty + ts * 0.9, zBack - 1.02);
    out.add(t);
    const trunk = new Mesh(kit.plane(0.04, ts * 1.2), treeMat);
    trunk.position.set(tx, ty + ts * 0.1, zBack - 1.02);
    out.add(trunk);
  }
  kit.mergeStatic(house);
  // snow caps on hills (shown in snow)
  const snowCaps = new Group();
  // a snowy ledge heap outside
  snowCaps.add(kit.mesh(kit.rbox(WIN.w + 0.2, 0.12, 0.22, 0.06, 3), kit.mat('#FFFFFF', { rough: 1 }), { p: [WIN.cx, WIN.y0 + 0.04, zBack - wall - 0.08], cast: false }));
  out.add(snowCaps);

  // moon + sun
  const moon = new Group();
  const moonDisc = new Mesh(kit.track(new ShapeGeometry(crescent(0.2, 0.17, 0.1, 0.07), 24)), kit.basic('#FFF3D1'));
  moon.add(moonDisc);
  const halo = new Mesh(kit.plane(1.5, 1.5), kit.basic('#FFE9B8', { map: kit.tex.glow(), additive: true, opacity: 0.55, depthWrite: false }));
  halo.position.z = -0.01;
  moon.add(halo);
  moon.position.set(WIN.cx + 0.42, 2.78, zBack - 1.55);
  out.add(moon);
  const sun = new Mesh(kit.track(new CircleGeometry(0.28, 32)), kit.basic('#FFE3A3', { unique: true }));
  sun.position.set(WIN.cx - 0.35, 2.2, zBack - 1.6);
  out.add(sun);

  // clouds
  const clouds = new Group();
  const cloudMat = kit.basic('#FFFFFF', { opacity: 0.92, unique: true });
  const cloud = (x: number, y: number, s: number) => {
    const g = new Group();
    for (const [dx, dy, r] of [
      [0, 0, 0.2],
      [0.22, -0.04, 0.15],
      [-0.22, -0.05, 0.14],
      [0.08, 0.1, 0.14],
    ]) {
      const m = new Mesh(kit.track(new CircleGeometry(r, 18)), cloudMat);
      m.position.set(dx, dy, 0);
      g.add(m);
    }
    g.position.set(x, y, zBack - 1.55);
    g.scale.setScalar(s);
    return g;
  };
  clouds.add(cloud(WIN.cx - 0.5, 2.75, 0.9), cloud(WIN.cx + 0.7, 2.45, 0.7), cloud(WIN.cx - 1.6, 2.55, 0.8));
  kit.mergeStatic(clouds);
  out.add(clouds);

  // weather volumes (between the wall and the hills)
  const hillsG = new Group();
  out.children.filter((c) => (c as Mesh).isMesh && ((c as Mesh).material === hillNear || (c as Mesh).material === hillFar)).forEach((c) => hillsG.add(c));
  kit.mergeStatic(hillsG);
  out.add(hillsG);
  const wMin = new Vector3(WIN.x0 - 0.9, 0.7, zBack - 0.95);
  const wSize = new Vector3(WIN.w + 1.2, 2.9, 0.6);
  const rain = makeRain(wMin, wSize);
  const snow = makeSnow(wMin, wSize, kit.tex.soft());
  const fireflies = makeFireflies(new Vector3(WIN.x0 - 0.5, 1.3, zBack - 0.95), new Vector3(WIN.w + 0.6, 0.8, 0.4), kit.tex.glow());
  out.add(rain.mesh, snow.mesh, fireflies.mesh);
  root.add(out);

  // ---------------- light decals
  const winPatch = kit.basic('#FFFFFF', { map: kit.tex.windowPatch(), additive: true, opacity: 1, unique: true, depthWrite: false });
  const patch = new Mesh(kit.unitPlane(), winPatch);
  patch.rotation.x = -Math.PI / 2;
  patch.position.set(WIN.cx + 0.35, 0.014, zBack + 1.45);
  patch.scale.set(WIN.w * 1.05, 2.5, 1);
  patch.renderOrder = 2;
  root.add(patch);

  // ---------------- floor lamp (back-left corner)
  const lamp = new Group();
  const L = SPOTS.lamp;
  const brass = kit.mat(C.brass, { rough: 0.35, metal: 0.4 });
  lamp.add(kit.mesh(kit.smoothLathe([[0.001, 0], [0.3, 0.0], [0.33, 0.04], [0.28, 0.09], [0.08, 0.12], [0.001, 0.12]], 3, 24), kit.mat(C.espresso, { rough: 0.6 })));
  lamp.add(kit.mesh(kit.cyl(0.035, 0.035, 2.35, 10), brass, { p: [0, 1.25, 0] }));
  lamp.add(kit.mesh(kit.sphere(0.06, 12, 10), brass, { p: [0, 1.2, 0] }));
  const shadeMat = kit.uniqueMat(C.cream, { rough: 0.95, side: DoubleSide, emissive: '#FFB866', emissiveIntensity: 0.9 });
  const shade = kit.mesh(
    kit.smoothLathe([[0.44, 0], [0.43, 0.08], [0.36, 0.38], [0.27, 0.62], [0.26, 0.66]], 3, 28),
    shadeMat,
    { p: [0, 2.2, 0], cast: false },
  );
  shade.userData.dyn = true;
  lamp.add(shade);
  // shade trim bands
  lamp.add(kit.mesh(kit.torus(0.44, 0.025, Math.PI * 2, 6, 36), kit.mat(C.persimmon, { rough: 0.7 }), { p: [0, 2.2, 0], r: [Math.PI / 2, 0, 0] }));
  lamp.add(kit.mesh(kit.torus(0.265, 0.02, Math.PI * 2, 6, 28), kit.mat(C.persimmon, { rough: 0.7 }), { p: [0, 2.86, 0], r: [Math.PI / 2, 0, 0] }));
  lamp.add(kit.blob(0, 0, 0.9, 0.9, 0.5));
  lamp.position.set(L.x, 0, L.z);
  kit.mergeStatic(lamp);
  root.add(lamp);
  const lampBulb = new Vector3(L.x, 2.42, L.z);
  const lampGlow = makeGlows(
    [
      { p: lampBulb.clone(), c: new Color('#FFC77A'), s: 1.6 },
      { p: new Vector3(L.x, 2.95, L.z), c: new Color('#FFB866').multiplyScalar(0.45), s: 1.2 },
    ],
    kit.tex.glow(),
    3,
  );
  lampGlow.u.uTwinkle.value = 0;
  root.add(lampGlow.mesh);
  // warm light pools on walls and floor around the lamp
  const lampDecals = kit.basic('#FFB45E', { map: kit.tex.soft(), additive: true, opacity: 0.5, unique: true, depthWrite: false });
  const pool = (w: number, hh: number, p: [number, number, number], r: [number, number, number]) => {
    const m = new Mesh(kit.unitPlane(), lampDecals);
    m.position.set(...p);
    m.rotation.set(...r);
    m.scale.set(w, hh, 1);
    m.renderOrder = 2;
    root.add(m);
  };
  pool(2.6, 3.2, [L.x + 0.55, 2.7, zBack + 0.012], [0, 0, 0]);
  pool(2.6, 3.2, [xMin + 0.012, 2.7, L.z + 0.55], [0, Math.PI / 2, 0]);
  pool(2.6, 2.6, [L.x + 0.5, 0.016, L.z + 0.55], [-Math.PI / 2, 0, 0]);

  // ---------------- rug
  const rug = new Group();
  const R = SPOTS.rug;
  const rugLayer = (rx: number, rz: number, y: number, color: string) =>
    rug.add(kit.mesh(kit.cyl(rx, rx, 0.03, 48), kit.mat(color, { rough: 1 }), { p: [0, y, 0], s: [1, 1, rz / rx], cast: false }));
  rugLayer(2.05, 1.55, 0.015, C.berryDeep);
  rugLayer(1.9, 1.42, 0.025, C.cream);
  rugLayer(1.72, 1.27, 0.032, C.berry);
  rugLayer(1.05, 0.72, 0.038, C.cream);
  rugLayer(0.9, 0.6, 0.042, C.berryHi);
  rug.position.set(R.x, 0, R.z);
  kit.mergeStatic(rug);
  root.add(rug);

  // ---------------- low table
  const table = new Group();
  const T = SPOTS.table;
  const top = kit.smoothLathe([[0.001, 0.5], [0.72, 0.5], [0.78, 0.53], [0.79, 0.57], [0.75, 0.61], [0.001, 0.61]], 3, 40);
  table.add(kit.mesh(top, kit.mat(C.woodHi, { rough: 0.6 })));
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
    table.add(kit.mesh(kit.cyl(0.06, 0.045, 0.52, 10), kit.mat(C.woodMid, { rough: 0.7 }), { p: [Math.cos(a) * 0.5, 0.26, Math.sin(a) * 0.5] }));
  }
  table.add(kit.blob(0, 0, 1.9, 1.9, 0.4, 0.05));
  table.position.set(T.x, 0, T.z);
  kit.mergeStatic(table);
  root.add(table);

  // ---------------- mug (moves onto the kotatsu later)
  const mug = new Group();
  const mugMat = kit.mat(C.sky, { rough: 0.45 });
  mug.add(kit.mesh(kit.smoothLathe([[0.001, 0], [0.12, 0], [0.135, 0.02], [0.14, 0.24], [0.125, 0.25], [0.12, 0.23], [0.001, 0.23]], 3, 24), mugMat));
  mug.add(kit.mesh(kit.cyl(0.118, 0.118, 0.01, 20), kit.mat(C.tea, { rough: 0.3 }), { p: [0, 0.2, 0] }));
  mug.add(kit.mesh(kit.torus(0.07, 0.025, Math.PI * 1.2, 8, 16), mugMat, { p: [0.14, 0.12, 0], r: [0, 0, -Math.PI * 0.6] }));
  mug.add(kit.mesh(kit.cyl(0.141, 0.141, 0.05, 24, true), kit.mat(C.cream, { rough: 0.5, side: DoubleSide }), { p: [0, 0.16, 0] }));
  mug.add(kit.blob(0, 0, 0.45, 0.45, 0.5, 0.004));
  kit.mergeStatic(mug);
  root.add(mug);
  const mugSteam = makeSteam(kit.tex.puff(), 10, 71, { size: 0.22, rise: 0.75, life: 3.2, spread: 0.12, opacity: 0.5 });
  mugSteam.u.uIntensity.value = 1;
  root.add(mugSteam.mesh);

  return {
    root,
    sky,
    glass,
    rain,
    snow,
    fireflies,
    moon,
    sun,
    clouds,
    hillFar,
    hillNear,
    houseWin,
    snowCaps,
    winPatch,
    lampShade: shadeMat,
    lampDecals,
    lampGlow,
    lampBulb,
    table,
    tableTopY: { table: 0.61 },
    mug,
    mugSteam,
    wallTrim: trimMat,
  };
}

export { AdditiveBlending };
