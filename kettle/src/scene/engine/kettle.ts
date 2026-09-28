/** The little iron stove and the persimmon kettle — the heart of the nook. */
import { Color, Group, Mesh, Sprite, SpriteMaterial, Vector3, type MeshStandardMaterial } from 'three';
import { Kit, group } from './kit';
import { C } from './palette';
import { ROOM, SPOTS } from './layout';
import { makeGlows, makeSteam, type GlowFX, type SteamFX } from './fx';

export interface KettleParts {
  root: Group;
  kettle: Group;
  lid: Group;
  fireMat: MeshStandardMaterial;
  fireGlow: GlowFX;
  fireDecal: Mesh;
  firePos: Vector3;
  steam: SteamFX;
  notes: Sprite[];
  spoutTip: Vector3;
  spoutDir: Vector3;
}

export function buildKettle(kit: Kit): KettleParts {
  const root = new Group();
  root.name = 'stove';
  const S = SPOTS.stove;

  // ---------------- stove (faces +x, against the left wall)
  const stove = new Group();
  const iron = kit.mat(C.iron, { rough: 0.55, metal: 0.15 });
  const ironDeep = kit.mat(C.ironDeep, { rough: 0.6, metal: 0.15 });
  const brass = kit.mat(C.brass, { rough: 0.35, metal: 0.45 });
  const legH = 0.2;
  const bodyH = 0.92;
  stove.add(kit.mesh(kit.rbox(0.82, bodyH, 1.0, 0.16, 4), iron, { p: [0, legH + bodyH / 2, 0] }));
  // top plate + rim
  stove.add(kit.mesh(kit.rbox(0.94, 0.09, 1.12, 0.04, 3), ironDeep, { p: [0, legH + bodyH + 0.03, 0] }));
  // plinth band
  stove.add(kit.mesh(kit.rbox(0.9, 0.08, 1.08, 0.035, 2), ironDeep, { p: [0, legH + 0.06, 0] }));
  for (const [dx, dz] of [
    [0.3, 0.38],
    [-0.3, 0.38],
    [0.3, -0.38],
    [-0.3, -0.38],
  ]) {
    stove.add(kit.mesh(kit.cyl(0.07, 0.05, legH, 10), ironDeep, { p: [dx, legH / 2, dz] }));
    stove.add(kit.mesh(kit.sphere(0.06, 10, 8), ironDeep, { p: [dx, 0.04, dz], s: [1, 0.6, 1] }));
  }
  // round fire window on the front
  const winY = legH + bodyH * 0.46;
  stove.add(kit.mesh(kit.torus(0.22, 0.045, Math.PI * 2, 10, 32), brass, { p: [0.41, winY, 0], r: [0, Math.PI / 2, 0] }));
  const fireMat = kit.uniqueMat('#FF8A3C', { rough: 0.9, emissive: '#FF7A2A', emissiveIntensity: 1.4 });
  const fire = kit.mesh(kit.cyl(0.215, 0.215, 0.02, 28), fireMat, { p: [0.405, winY, 0], r: [0, 0, Math.PI / 2], cast: false });
  fire.userData.dyn = true;
  stove.add(fire);
  // grille bars over the fire
  for (const dz of [-0.09, 0, 0.09]) {
    stove.add(kit.mesh(kit.cyl(0.014, 0.014, 0.38, 6), ironDeep, { p: [0.425, winY, dz], cast: false }));
  }
  // door hinge knob + a little brass handle
  stove.add(kit.mesh(kit.capsule(0.03, 0.12, 4, 8), brass, { p: [0.43, winY, 0.34] }));
  // ash drawer
  stove.add(kit.mesh(kit.rbox(0.05, 0.1, 0.55, 0.03, 2), ironDeep, { p: [0.42, legH + 0.17, 0] }));
  stove.add(kit.mesh(kit.capsule(0.022, 0.12, 4, 8), brass, { p: [0.45, legH + 0.17, 0], r: [Math.PI / 2, 0, 0] }));
  // brass trim along the top
  stove.add(kit.mesh(kit.rbox(0.035, 0.035, 0.96, 0.015, 2), brass, { p: [0.42, legH + bodyH - 0.08, 0] }));
  // stove pipe: up from the back, elbow into the left wall
  const pipeX = -0.3;
  const pipeZ = -0.36;
  const pipeTop = 3.05;
  const topY = legH + bodyH + 0.07;
  stove.add(kit.mesh(kit.cyl(0.11, 0.11, pipeTop - topY, 16), ironDeep, { p: [pipeX, (pipeTop + topY) / 2, pipeZ] }));
  stove.add(kit.mesh(kit.torus(0.18, 0.11, Math.PI / 2, 10, 12), ironDeep, { p: [pipeX - 0.18, pipeTop, pipeZ] }));
  const wallX = ROOM.xMin - S.x;
  const runLen = pipeX - 0.18 - wallX;
  stove.add(kit.mesh(kit.cyl(0.11, 0.11, runLen + 0.02, 16), ironDeep, { p: [wallX + runLen / 2, pipeTop + 0.18, pipeZ], r: [0, 0, Math.PI / 2] }));
  stove.add(kit.mesh(kit.cyl(0.14, 0.14, 0.06, 16), ironDeep, { p: [pipeX, topY + 0.25, pipeZ] }));
  stove.add(kit.mesh(kit.cyl(0.19, 0.19, 0.04, 20), ironDeep, { p: [wallX + 0.1, pipeTop + 0.18, pipeZ], r: [0, 0, Math.PI / 2] }));
  stove.add(kit.blob(0.1, 0, 1.5, 1.6, 0.55));
  stove.position.set(S.x, 0, S.z);
  kit.mergeStatic(stove);
  root.add(stove);

  // ---------------- kettle
  const kettle = new Group();
  const enamel = kit.mat(C.persimmon, { rough: 0.32 });
  const enamelDeep = kit.mat(C.persimmonDeep, { rough: 0.4 });
  const cream = kit.mat(C.cream, { rough: 0.45 });
  const woodDark = kit.mat(C.woodDark, { rough: 0.55 });
  const body = kit.smoothLathe(
    [
      [0.001, 0],
      [0.3, 0],
      [0.38, 0.04],
      [0.42, 0.16],
      [0.4, 0.3],
      [0.32, 0.42],
      [0.2, 0.48],
      [0.001, 0.49],
    ],
    5,
    36,
  );
  const bodyMesh = kit.mesh(body, enamel);
  kettle.add(bodyMesh);
  kettle.add(kit.mesh(kit.torus(0.335, 0.03, Math.PI * 2, 8, 36), enamelDeep, { p: [0, 0.02, 0], r: [Math.PI / 2, 0, 0] }));
  // cream belly band
  kettle.add(kit.mesh(kit.cyl(0.424, 0.412, 0.06, 36, true), cream, { p: [0, 0.2, 0] }));
  // spout (a tapered cone angled up) + whistle cap
  const spoutLen = 0.42;
  const spoutAng = 0.95; // radians from vertical
  const spoutBase = new Vector3(0.3, 0.2, 0);
  const dir = new Vector3(Math.sin(spoutAng), Math.cos(spoutAng), 0);
  const spoutMid = spoutBase.clone().addScaledVector(dir, spoutLen / 2);
  kettle.add(kit.mesh(kit.cyl(0.05, 0.1, spoutLen, 16), enamel, { p: [spoutMid.x, spoutMid.y, 0], r: [0, 0, -spoutAng] }));
  const tipLocal = spoutBase.clone().addScaledVector(dir, spoutLen + 0.03);
  kettle.add(kit.mesh(kit.cyl(0.06, 0.06, 0.07, 16), cream, { p: [tipLocal.x, tipLocal.y, 0], r: [0, 0, -spoutAng] }));
  kettle.add(kit.mesh(kit.sphere(0.035, 10, 8), cream, { p: [tipLocal.x + dir.x * 0.05, tipLocal.y + dir.y * 0.05, 0] }));
  // handle: an arch over the lid, with posts
  kettle.add(kit.mesh(kit.torus(0.26, 0.045, Math.PI, 10, 24), woodDark, { p: [-0.02, 0.56, 0] }));
  kettle.add(kit.mesh(kit.cyl(0.03, 0.03, 0.16, 8), enamelDeep, { p: [0.24, 0.5, 0] }));
  kettle.add(kit.mesh(kit.cyl(0.03, 0.03, 0.16, 8), enamelDeep, { p: [-0.28, 0.5, 0] }));
  // lid (animated when whistling)
  const lid = group({ p: [0, 0.47, 0] });
  lid.userData.dyn = true;
  lid.add(kit.mesh(kit.smoothLathe([[0.2, 0], [0.21, 0.02], [0.16, 0.07], [0.06, 0.09], [0.001, 0.09]], 3, 28), cream));
  lid.add(kit.mesh(kit.sphere(0.06, 14, 10), kit.mat(C.honey, { rough: 0.5 }), { p: [0, 0.12, 0] }));
  kit.mergeStatic(lid);
  kettle.add(lid);
  kettle.userData.dyn = true;
  // Sit on the plate; spout turned toward the room so it reads in profile.
  const plateY = legH + bodyH + 0.075;
  kettle.position.set(S.x + 0.06, plateY, S.z + 0.12);
  kettle.rotation.y = 0.5;
  root.add(kettle);
  // merge the kettle's static bits (the lid is `dyn` and stays separate)
  kit.mergeStatic(kettle);

  kettle.updateMatrixWorld(true);
  const spoutTip = kettle.localToWorld(tipLocal.clone().addScaledVector(dir, 0.08));
  const spoutDir = dir.clone().applyQuaternion(kettle.quaternion).normalize();

  // ---------------- effects
  const steam = makeSteam(kit.tex.puff(), 60, 17, { size: 0.5, rise: 1.9, life: 3.6, spread: 0.45, opacity: 0.62 });
  steam.u.uOrigin.value.copy(spoutTip);
  steam.u.uDir.value.copy(spoutDir);
  root.add(steam.mesh);

  const firePos = new Vector3(S.x + 0.5, winY, S.z);
  const fireGlow = makeGlows([{ p: firePos.clone(), c: new Color('#FF8A3C'), s: 1.3 }], kit.tex.glow(), 9);
  fireGlow.u.uTwinkle.value = 0;
  root.add(fireGlow.mesh);
  const fireDecal = new Mesh(kit.unitPlane(), kit.basic('#FF7A36', { map: kit.tex.soft(), additive: true, opacity: 0.55, unique: true, depthWrite: false }));
  fireDecal.rotation.x = -Math.PI / 2;
  fireDecal.position.set(S.x + 1.05, 0.02, S.z);
  fireDecal.scale.set(1.8, 1.8, 1);
  fireDecal.renderOrder = 2;
  root.add(fireDecal);

  const notes: Sprite[] = [];
  const noteMat = new SpriteMaterial({ map: kit.tex.note(), color: new Color(C.honey), transparent: true, depthWrite: false, opacity: 0, toneMapped: false });
  for (let i = 0; i < 3; i++) {
    const s = new Sprite(i === 0 ? noteMat : noteMat.clone());
    s.scale.setScalar(0.22);
    s.visible = false;
    s.renderOrder = 7;
    notes.push(s);
    root.add(s);
  }

  return { root, kettle, lid, fireMat, fireGlow, fireDecal, firePos, steam, notes, spoutTip, spoutDir };
}

export function disposeNotes(parts: KettleParts): void {
  parts.notes.forEach((n) => n.material.dispose());
}
