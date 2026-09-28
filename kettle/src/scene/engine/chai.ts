/**
 * Chai the capybara as a soft toy, built like the 2D mascot (src/art/Mascot.tsx):
 * one chai-brown loaf (head and body are one form) with the face on its front —
 * broad cream snout, wide dark oval nose on top of it, small high eyes set wide
 * apart, tiny ears on the top corners, rosy blush, and a yuzu on top.
 * Poses: 'nap' (focus: melted loaf, eyes closed, zZ), 'sip' (break: happy eyes,
 * holding a mug), 'awake' (idle / showcase: blinks, yuzu wobbles).
 */
import { Color, Group, Sprite, SpriteMaterial, Vector3 } from 'three';
import { Kit, group } from './kit';
import { C } from './palette';
import { makeSteam, type SteamFX } from './fx';

export type ChaiPose = 'nap' | 'sip' | 'awake';

export interface Chai {
  root: Group;
  setPose(p: ChaiPose): void;
  /** t: seconds (frozen under reduced motion), dt: frame delta. */
  update(t: number, dt: number): void;
  /** A happy hop (tapped). */
  poke(): void;
  steam: SteamFX;
  sprites: Sprite[];
  focus: Vector3;
}

// Loaf size (local units, before the root scale).
const W = 0.8;
const H = 0.8;
const D = 0.74;
const FZ = D / 2; // front face

export function buildChai(kit: Kit): Chai {
  const root = new Group();
  root.name = 'chai';
  const fur = kit.mat(C.fur, { rough: 0.9 });
  const furShade = kit.mat(C.furShade, { rough: 0.9 });
  const cream = kit.mat(C.muzzle, { rough: 0.9 });
  const nose = kit.mat(C.nose, { rough: 0.32 });
  const eyeMat = kit.mat(C.eye, { rough: 0.32 });
  const white = kit.mat('#FFFFFF', { rough: 0.32 });
  const blush = kit.mat(C.blush, { rough: 0.9 });
  const ear = kit.mat(C.ear, { rough: 0.9 });

  // The loaf breathes (scale from the bottom); everything on it rides along.
  const loaf = group();
  loaf.userData.dyn = true;
  const bodyGeo = kit.rbox(W, H, D, 0.25, 5);
  // Taper toward the top like the 2D loaf silhouette.
  const pos = bodyGeo.getAttribute('position');
  for (let i = 0; i < pos.count; i++) {
    const y = (pos.getY(i) + H / 2) / H; // 0..1
    pos.setX(i, pos.getX(i) * (1 - 0.12 * y));
    pos.setZ(i, pos.getZ(i) * (1 - 0.05 * y));
  }
  bodyGeo.computeVertexNormals();
  const loafStatic = group();
  loafStatic.add(kit.mesh(bodyGeo, fur, { p: [0, H / 2, 0] }));
  // snout: a broad soft pillow on the lower front
  loafStatic.add(kit.mesh(kit.sphere(0.5, 28, 18), cream, { p: [0, 0.32, FZ - 0.035], s: [0.5, 0.36, 0.2] }));
  // nose: wide dark oval sitting on top of the snout
  loafStatic.add(kit.mesh(kit.sphere(0.5, 24, 14), nose, { p: [0, 0.44, FZ + 0.045], s: [0.22, 0.09, 0.08], r: [-0.25, 0, 0] }));
  loafStatic.add(kit.mesh(kit.sphere(0.02, 8, 6), white, { p: [-0.045, 0.462, FZ + 0.082], s: [1.5, 0.65, 0.5], cast: false }));
  for (const s of [-1, 1]) {
    // mouth: a tiny "w" under the nose
    loafStatic.add(kit.mesh(kit.torus(0.026, 0.008, Math.PI, 4, 10), kit.mat(C.espresso, { rough: 0.9 }), { p: [s * 0.026, 0.33, FZ + 0.063], r: [0, 0, Math.PI], cast: false }));
    // blush on the cheeks, just outside the snout
    loafStatic.add(kit.mesh(kit.sphere(0.5, 14, 10), blush, { p: [s * 0.3, 0.37, FZ - 0.07], s: [0.1, 0.065, 0.05], r: [0, s * 0.55, 0], cast: false }));
    // tiny ears on the top corners, tilted outward
    loafStatic.add(kit.mesh(kit.sphere(0.5, 14, 10), ear, { p: [s * 0.25, H - 0.045, -0.1], s: [0.085, 0.075, 0.06], r: [0, 0, -s * 0.5] }));
    // stubby front paws
    loafStatic.add(kit.mesh(kit.sphere(0.5, 14, 10), fur, { p: [s * 0.16, 0.04, FZ - 0.05], s: [0.13, 0.075, 0.12] }));
  }
  kit.mergeStatic(loafStatic);
  loaf.add(loafStatic);

  // eyes: open dots / sleepy ∪ / happy ∩ (high on the face, wide apart)
  const eyeY = 0.6;
  const eyeX = 0.19;
  const eyeZ = FZ - 0.005;
  const eyesOpen = group();
  const eyesSleep = group();
  const eyesHappy = group();
  for (const s of [-1, 1]) {
    eyesOpen.add(kit.mesh(kit.sphere(0.5, 14, 10), eyeMat, { p: [s * eyeX, eyeY, eyeZ], s: [0.075, 0.082, 0.05], cast: false }));
    eyesOpen.add(kit.mesh(kit.sphere(0.013, 8, 6), white, { p: [s * eyeX - 0.013, eyeY + 0.016, eyeZ + 0.022], cast: false }));
    eyesSleep.add(kit.mesh(kit.torus(0.04, 0.012, Math.PI, 5, 12), eyeMat, { p: [s * eyeX, eyeY + 0.012, eyeZ + 0.012], r: [0, 0, Math.PI], cast: false }));
    eyesHappy.add(kit.mesh(kit.torus(0.04, 0.012, Math.PI, 5, 12), eyeMat, { p: [s * eyeX, eyeY - 0.015, eyeZ + 0.012], cast: false }));
  }
  for (const e of [eyesOpen, eyesSleep, eyesHappy]) {
    kit.mergeStatic(e);
    e.userData.dyn = true;
    loaf.add(e);
  }
  // yuzu with a leaf, balanced on top
  const yuzu = group({ p: [0.02, H - 0.02, 0.02] });
  yuzu.add(kit.mesh(kit.sphere(0.115, 20, 14), kit.mat(C.yuzu, { rough: 0.58 }), { p: [0, 0.1, 0], s: [1, 0.88, 1] }));
  yuzu.add(kit.mesh(kit.sphere(0.03, 8, 6), kit.mat(C.honeyHi, { rough: 0.58 }), { p: [-0.045, 0.16, 0.06], s: [1.4, 0.8, 0.8] }));
  yuzu.add(kit.mesh(kit.cyl(0.009, 0.011, 0.05, 5), kit.mat(C.woodDark, { rough: 0.9 }), { p: [0, 0.215, 0] }));
  yuzu.add(kit.mesh(kit.sphere(0.5, 12, 6), kit.mat(C.leaf, { rough: 0.58 }), { p: [0.07, 0.235, 0], s: [0.13, 0.025, 0.065], r: [0, -0.3, 0.3] }));
  kit.mergeStatic(yuzu);
  yuzu.userData.dyn = true;
  loaf.add(yuzu);
  root.add(loaf);

  // paws + mug for tea time
  const pawsUp = group();
  const mugMat = kit.mat(C.persimmon, { rough: 0.32 });
  pawsUp.add(kit.mesh(kit.smoothLathe([[0.001, 0], [0.085, 0], [0.095, 0.02], [0.1, 0.17], [0.09, 0.18], [0.085, 0.16], [0.001, 0.16]], 2, 20), mugMat, { p: [0, 0.1, FZ + 0.12] }));
  pawsUp.add(kit.mesh(kit.cyl(0.084, 0.084, 0.01, 16), kit.mat(C.tea, { rough: 0.32 }), { p: [0, 0.25, FZ + 0.12] }));
  pawsUp.add(kit.mesh(kit.torus(0.045, 0.016, Math.PI * 1.2, 6, 12), mugMat, { p: [0.1, 0.19, FZ + 0.12], r: [0, 0, -Math.PI * 0.6] }));
  for (const s of [-1, 1]) pawsUp.add(kit.mesh(kit.sphere(0.5, 12, 8), furShade, { p: [s * 0.1, 0.17, FZ + 0.1], s: [0.1, 0.12, 0.1] }));
  kit.mergeStatic(pawsUp);
  pawsUp.userData.dyn = true;
  root.add(pawsUp);
  root.add(kit.blob(0, 0.02, 1.15, 1.1, 0.55, 0.012));

  // zzz + mug steam
  const zees: Sprite[] = [];
  const zMat = new SpriteMaterial({ map: kit.tex.zee(), color: new Color(C.cream), transparent: true, depthWrite: false, opacity: 0 });
  for (let i = 0; i < 3; i++) {
    const s = new Sprite(i === 0 ? zMat : zMat.clone());
    s.renderOrder = 7;
    s.visible = false;
    zees.push(s);
    root.add(s);
  }
  const steam = makeSteam(kit.tex.puff(), 8, 55, { size: 0.16, rise: 0.55, life: 2.8, spread: 0.08, opacity: 0.5 });
  steam.u.uOrigin.value.set(0, 0.32, FZ + 0.12);
  steam.u.uDir.value.set(0, 1, 0);
  steam.u.uIntensity.value = 1;
  root.add(steam.mesh);

  let pose: ChaiPose = 'awake';
  let hop = 0;
  // Nap = melted loaf (wider, lower), like the 2D sleep pose.
  const base = new Vector3(1, 1, 1);
  const setPose = (p: ChaiPose) => {
    pose = p;
    eyesOpen.visible = p === 'awake';
    eyesSleep.visible = p === 'nap';
    eyesHappy.visible = p === 'sip';
    pawsUp.visible = p === 'sip';
    steam.mesh.visible = p === 'sip';
    zees.forEach((z) => (z.visible = p === 'nap'));
    base.set(p === 'nap' ? 1.1 : 1, p === 'nap' ? 0.84 : 1, p === 'nap' ? 1.06 : 1);
    loaf.scale.copy(base);
  };
  setPose('awake');

  const update = (t: number, dt: number) => {
    const slow = pose === 'nap';
    const br = Math.sin(t * (slow ? 1.1 : 1.6));
    const amp = slow ? 0.035 : 0.018;
    hop = Math.max(0, hop - dt * 2.2);
    const hopY = hop > 0 ? Math.sin(hop * Math.PI) * 0.16 : 0;
    const squash = hop > 0 ? Math.sin(hop * Math.PI * 2) * 0.06 : 0;
    loaf.scale.set(base.x * (1 + br * amp * 0.35 - squash * 0.5), base.y * (1 + br * amp + squash), base.z * (1 + br * amp * 0.3));
    root.position.y = (root.userData.baseY as number) + hopY;
    // yuzu: a gentle sway plus a little wobble now and then
    const wob = Math.max(0, Math.sin(t * 0.37)) ** 12;
    yuzu.rotation.z = Math.sin(t * 1.4) * 0.05 + Math.sin(t * 12) * 0.1 * wob + squash * 1.5;
    if (pose === 'awake') {
      const blink = t % 4.2 < 0.13;
      eyesOpen.scale.y = blink ? 0.15 : 1;
      eyesOpen.position.y = blink ? eyeY * 0.85 : 0;
      loaf.rotation.z = Math.sin(t * 0.5) * 0.02;
    } else loaf.rotation.z = 0;
    if (pose === 'sip') {
      const lift = Math.max(0, Math.sin(t * 0.6)) ** 6;
      pawsUp.position.y = lift * 0.06;
      pawsUp.position.z = -lift * 0.02;
      steam.u.uTime.value = t;
    }
    if (pose === 'nap') {
      for (let i = 0; i < zees.length; i++) {
        const ph = (t * 0.28 + i / zees.length) % 1;
        const z = zees[i];
        z.position.set(0.22 + ph * 0.28 + Math.sin(ph * 6 + i) * 0.04, 0.7 + ph * 0.75, 0.15);
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
