// Procedural fighter models. No external assets: every character is generated
// from its `model` block in data/fighters.js.

import * as THREE from 'three';

const BUILDS = {
  lithe:    { shoulder: 0.40, chest: 0.34, waist: 0.26, limb: 0.075, leg: 0.095, headScale: 1.02, torso: 1.00 },
  lean:     { shoulder: 0.46, chest: 0.38, waist: 0.28, limb: 0.085, leg: 0.105, headScale: 1.00, torso: 1.02 },
  athletic: { shoulder: 0.52, chest: 0.44, waist: 0.30, limb: 0.100, leg: 0.120, headScale: 1.00, torso: 1.00 },
  bulk:     { shoulder: 0.62, chest: 0.52, waist: 0.36, limb: 0.125, leg: 0.145, headScale: 0.96, torso: 0.98 },
  giant:    { shoulder: 0.70, chest: 0.60, waist: 0.42, limb: 0.150, leg: 0.170, headScale: 0.90, torso: 0.96 }
};

function toonMat(color, opts = {}) {
  const c = new THREE.Color(color);
  // 4-step gradient ramp gives a cel look without a texture fetch.
  const m = new THREE.MeshToonMaterial({ color: c, ...opts });
  return m;
}

function makeGradientMap() {
  const data = new Uint8Array([70, 130, 200, 255]);
  const tex = new THREE.DataTexture(data, data.length, 1, THREE.RedFormat);
  tex.needsUpdate = true;
  tex.minFilter = tex.magFilter = THREE.NearestFilter;
  return tex;
}
let GRADIENT = null;

function part(geo, mat, x = 0, y = 0, z = 0) {
  const m = new THREE.Mesh(geo, mat);
  m.position.set(x, y, z);
  m.castShadow = true;
  m.receiveShadow = false;
  return m;
}

function capsule(radius, length, mat) {
  return new THREE.Mesh(new THREE.CapsuleGeometry(radius, length, 6, 12), mat);
}

/**
 * Builds an articulated fighter.
 * @returns {{root:THREE.Group, rig:object, def:object, update:(t:number)=>void}}
 */
export function buildFighter(def, opts = {}) {
  if (!GRADIENT) GRADIENT = makeGradientMap();
  const md = def.model || {};
  const b = BUILDS[md.build] || BUILDS.athletic;
  const pal = md.palette || {};
  const skin = toonMat(pal.skin || '#e8b98a', { gradientMap: GRADIENT });
  const primary = toonMat(pal.primary || '#d63b2f', { gradientMap: GRADIENT });
  const secondary = toonMat(pal.secondary || '#2e6fd0', { gradientMap: GRADIENT });
  const accent = toonMat(pal.accent || '#f2d24b', { gradientMap: GRADIENT });
  const hair = toonMat(pal.hair || '#161616', { gradientMap: GRADIENT });
  const dark = toonMat('#1a1a22', { gradientMap: GRADIENT });

  const root = new THREE.Group();
  const heightM = md.height || 1.8;
  // Everything is authored at 1.8 m then scaled; giants tower believably.
  const scale = heightM / 1.8;
  root.scale.setScalar(scale);

  const body = new THREE.Group();
  root.add(body);

  // --- torso ---
  const hips = new THREE.Group();
  hips.position.y = 0.92;
  body.add(hips);

  const pelvis = part(new THREE.CapsuleGeometry(b.waist * 0.9, 0.12, 4, 10), secondary, 0, 0, 0);
  hips.add(pelvis);

  const spine = new THREE.Group();
  spine.position.y = 0.16;
  hips.add(spine);

  const chest = part(new THREE.CapsuleGeometry(b.chest, 0.34 * b.torso, 5, 12), primary, 0, 0.20, 0);
  chest.scale.set(1.12, 1, 0.78);
  spine.add(chest);

  const shoulders = new THREE.Group();
  shoulders.position.y = 0.40;
  spine.add(shoulders);
  const yoke = part(new THREE.CapsuleGeometry(b.shoulder * 0.52, b.shoulder * 0.95, 4, 10), primary, 0, 0, 0);
  yoke.rotation.z = Math.PI / 2;
  shoulders.add(yoke);

  // --- head ---
  const neck = new THREE.Group();
  neck.position.y = 0.14;
  shoulders.add(neck);
  const head = new THREE.Group();
  head.position.y = 0.16;
  neck.add(head);
  const skull = part(new THREE.SphereGeometry(0.135 * b.headScale, 20, 16), skin);
  skull.scale.set(1, 1.12, 0.96);
  head.add(skull);
  const jaw = part(new THREE.SphereGeometry(0.105 * b.headScale, 14, 12), skin, 0, -0.07, 0.018);
  jaw.scale.set(0.94, 0.8, 1.0);
  head.add(jaw);

  // eyes — a flat dark bar reads better than spheres at battle distance
  const eyeMat = new THREE.MeshBasicMaterial({ color: 0x14141c });
  const eyeL = part(new THREE.SphereGeometry(0.028, 10, 8), eyeMat, -0.055, 0.012, 0.116);
  const eyeR = part(new THREE.SphereGeometry(0.028, 10, 8), eyeMat, 0.055, 0.012, 0.116);
  eyeL.scale.set(1, 1.35, 0.5); eyeR.scale.set(1, 1.35, 0.5);
  head.add(eyeL, eyeR);
  const browMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(pal.hair || '#161616') });
  const browL = part(new THREE.BoxGeometry(0.062, 0.014, 0.02), browMat, -0.055, 0.055, 0.118);
  const browR = part(new THREE.BoxGeometry(0.062, 0.014, 0.02), browMat, 0.055, 0.055, 0.118);
  browL.rotation.z = 0.22; browR.rotation.z = -0.22;
  head.add(browL, browR);

  // hair
  const hairCap = part(new THREE.SphereGeometry(0.148 * b.headScale, 18, 14, 0, Math.PI * 2, 0, Math.PI * 0.62), hair, 0, 0.022, 0);
  hairCap.scale.set(1.02, 1.05, 1.02);
  head.add(hairCap);

  // --- arms ---
  function makeArm(side) {
    const g = new THREE.Group();
    g.position.set(side * b.shoulder * 0.98, 0.02, 0);
    shoulders.add(g);
    const upper = capsule(b.limb, 0.24, skin);
    upper.position.y = -0.14; upper.castShadow = true;
    g.add(upper);
    const elbow = new THREE.Group();
    elbow.position.y = -0.28;
    g.add(elbow);
    const fore = capsule(b.limb * 0.9, 0.22, skin);
    fore.position.y = -0.13; fore.castShadow = true;
    elbow.add(fore);
    const hand = part(new THREE.SphereGeometry(b.limb * 1.25, 12, 10), skin, 0, -0.27, 0);
    hand.scale.set(1, 1.15, 0.85);
    elbow.add(hand);
    return { group: g, elbow, hand, upper, fore };
  }
  const armL = makeArm(-1);
  const armR = makeArm(1);

  // --- legs ---
  function makeLeg(side) {
    const g = new THREE.Group();
    g.position.set(side * b.waist * 0.55, -0.06, 0);
    hips.add(g);
    const thigh = capsule(b.leg, 0.30, secondary);
    thigh.position.y = -0.18; thigh.castShadow = true;
    g.add(thigh);
    const knee = new THREE.Group();
    knee.position.y = -0.38;
    g.add(knee);
    const shin = capsule(b.leg * 0.85, 0.28, secondary);
    shin.position.y = -0.17; shin.castShadow = true;
    knee.add(shin);
    const foot = part(new THREE.BoxGeometry(b.leg * 2.0, 0.07, 0.28), dark, 0, -0.34, 0.06);
    knee.add(foot);
    return { group: g, knee, foot };
  }
  const legL = makeLeg(-1);
  const legR = makeLeg(1);

  // --- silhouette props: the single biggest readability lever ---
  const props = {};
  const sil = md.silhouette || [];
  const P = (k) => sil.includes(k);

  if (P('strawhat')) {
    const brim = part(new THREE.CylinderGeometry(0.30, 0.30, 0.012, 28), accent, 0, 0.15, 0);
    const crown = part(new THREE.CylinderGeometry(0.135, 0.15, 0.10, 24), accent, 0, 0.20, 0);
    const band = part(new THREE.CylinderGeometry(0.152, 0.152, 0.028, 24), toonMat('#c0392b'), 0, 0.168, 0);
    head.add(brim, crown, band);
    props.hat = crown;
  }
  if (P('cowboy_hat')) {
    const brim = part(new THREE.CylinderGeometry(0.28, 0.28, 0.014, 24), toonMat('#f2a03a'), 0, 0.15, 0);
    brim.rotation.x = 0.06;
    const crown = part(new THREE.CylinderGeometry(0.13, 0.15, 0.14, 20), toonMat('#f2a03a'), 0, 0.22, 0);
    head.add(brim, crown);
  }
  if (P('wide_hat')) {
    const brim = part(new THREE.CylinderGeometry(0.34, 0.34, 0.014, 28), dark, 0, 0.16, 0);
    const crown = part(new THREE.CylinderGeometry(0.13, 0.15, 0.16, 20), dark, 0, 0.24, 0);
    const feather = part(new THREE.ConeGeometry(0.02, 0.24, 6), toonMat('#e04a4a'), 0.16, 0.30, 0);
    feather.rotation.z = -0.5;
    head.add(brim, crown, feather);
  }
  if (P('spotted_hat')) {
    const cap = part(new THREE.SphereGeometry(0.16, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.55), accent, 0, 0.05, 0);
    cap.scale.set(1, 1.5, 1);
    head.add(cap);
  }
  if (P('bandana')) {
    const bnd = part(new THREE.TorusGeometry(0.14, 0.022, 8, 20), dark, 0, 0.05, 0);
    bnd.rotation.x = Math.PI / 2;
    head.add(bnd);
  }
  if (P('horns')) {
    for (const s of [-1, 1]) {
      const h = part(new THREE.ConeGeometry(0.045, 0.30, 8), toonMat('#e8d8b0'), s * 0.10, 0.24, -0.02);
      h.rotation.z = s * -0.4; h.rotation.x = -0.2;
      head.add(h);
    }
  }
  if (P('dragon_mane')) {
    for (let i = 0; i < 9; i++) {
      const a = (i / 8 - 0.5) * 1.6;
      const s = part(new THREE.ConeGeometry(0.035, 0.34 + Math.random() * 0.1, 6), hair,
        Math.sin(a) * 0.12, 0.05 - Math.abs(a) * 0.03, -0.13 - Math.cos(a) * 0.02);
      s.rotation.x = 2.5; s.rotation.z = a * 0.5;
      head.add(s);
    }
  }
  if (P('ponytail')) {
    const tail = part(new THREE.CapsuleGeometry(0.05, 0.32, 5, 10), hair, 0, -0.06, -0.16);
    tail.rotation.x = -0.5;
    head.add(tail);
    props.tail = tail;
  }
  if (P('three_swords')) {
    const swords = new THREE.Group();
    for (let i = 0; i < 3; i++) {
      const s = new THREE.Group();
      const sheath = part(new THREE.CylinderGeometry(0.028, 0.028, 0.95, 8), i === 1 ? dark : toonMat('#2a2a33'), 0, 0, 0);
      const hilt = part(new THREE.CylinderGeometry(0.022, 0.022, 0.20, 8), accent, 0, 0.55, 0);
      const guard = part(new THREE.CylinderGeometry(0.06, 0.06, 0.02, 12), accent, 0, 0.46, 0);
      s.add(sheath, hilt, guard);
      s.rotation.z = 0.55 + i * 0.10;
      s.position.set(-0.16 - i * 0.045, -0.05, -0.10 + i * 0.05);
      swords.add(s);
    }
    hips.add(swords);
    props.swords = swords;
  }
  if (P('haramaki')) {
    const hm = part(new THREE.CylinderGeometry(b.waist * 1.08, b.waist * 1.05, 0.24, 18), toonMat('#2a7f4f'), 0, 0.04, 0);
    hips.add(hm);
  }
  if (P('greatsword')) {
    const g = new THREE.Group();
    const blade = part(new THREE.BoxGeometry(0.20, 1.55, 0.045), dark, 0, 0.78, 0);
    const edge = part(new THREE.BoxGeometry(0.045, 1.5, 0.055), toonMat('#4a4a58'), 0.08, 0.76, 0);
    const cross = part(new THREE.BoxGeometry(0.42, 0.06, 0.06), accent, 0, 0.02, 0);
    const grip = part(new THREE.CylinderGeometry(0.032, 0.032, 0.30, 8), toonMat('#5b2a2a'), 0, -0.16, 0);
    g.add(blade, edge, cross, grip);
    g.position.set(-0.30, 0.10, -0.22);
    g.rotation.z = 0.35; g.rotation.x = -0.18;
    spine.add(g);
    props.greatsword = g;
  }
  if (P('nodachi')) {
    const g = new THREE.Group();
    const blade = part(new THREE.BoxGeometry(0.05, 1.25, 0.02), toonMat('#dfe6ef'), 0, 0.65, 0);
    const grip = part(new THREE.CylinderGeometry(0.028, 0.028, 0.34, 8), toonMat('#2a2a38'), 0, -0.05, 0);
    g.add(blade, grip);
    g.position.set(-0.34, 0.06, -0.16);
    g.rotation.z = 0.5;
    spine.add(g);
    props.nodachi = g;
  }
  if (P('kanabo')) {
    const g = new THREE.Group();
    const shaft = part(new THREE.CylinderGeometry(0.075, 0.11, 1.9, 12), toonMat('#3a2a1a'), 0, 0.7, 0);
    for (let i = 0; i < 14; i++) {
      const a = (i / 14) * Math.PI * 2;
      const spike = part(new THREE.ConeGeometry(0.035, 0.09, 5),
        toonMat('#c8a24b'), Math.cos(a) * 0.10, 0.6 + (i % 5) * 0.22, Math.sin(a) * 0.10);
      spike.rotation.z = -Math.cos(a) * 1.5; spike.rotation.x = Math.sin(a) * 1.5;
      g.add(spike);
    }
    g.add(shaft);
    g.position.set(0.42, -0.1, -0.18);
    g.rotation.z = -0.3;
    spine.add(g);
    props.kanabo = g;
  }
  if (P('trident')) {
    const g = new THREE.Group();
    const shaft = part(new THREE.CylinderGeometry(0.035, 0.035, 2.1, 8), toonMat('#3a2a2a'), 0, 0.6, 0);
    for (const s of [-1, 0, 1]) {
      const p = part(new THREE.ConeGeometry(0.04, 0.34, 6), toonMat('#c8c8d0'), s * 0.10, 1.78, 0);
      g.add(p);
    }
    g.add(shaft);
    g.position.set(0.40, 0.0, -0.14); g.rotation.z = -0.22;
    spine.add(g);
  }
  if (P('climatact')) {
    const g = new THREE.Group();
    const rod = part(new THREE.CylinderGeometry(0.030, 0.030, 1.0, 8), toonMat('#2e8fd0'), 0, 0, 0);
    const seg1 = part(new THREE.CylinderGeometry(0.034, 0.034, 0.18, 8), toonMat('#f0913a'), 0, 0.3, 0);
    const seg2 = part(new THREE.CylinderGeometry(0.034, 0.034, 0.18, 8), toonMat('#e04a4a'), 0, -0.3, 0);
    g.add(rod, seg1, seg2);
    armR.elbow.add(g);
    g.position.set(0.02, -0.34, 0.10);
    g.rotation.x = 0.4;
    props.climatact = g;
  }
  if (P('long_coat')) {
    const coat = part(new THREE.CylinderGeometry(b.waist * 1.15, b.waist * 1.75, 0.95, 20, 1, true),
      toonMat(pal.primary || '#2a2a33', { side: THREE.DoubleSide }), 0, -0.36, 0);
    hips.add(coat);
    props.coat = coat;
  }
  if (P('tall_coat')) {
    const coat = part(new THREE.CylinderGeometry(b.waist * 1.2, b.waist * 1.5, 1.15, 20, 1, true),
      toonMat(pal.primary || '#5a1a2a', { side: THREE.DoubleSide }), 0, -0.42, 0);
    hips.add(coat);
    props.coat = coat;
  }
  if (P('scarf')) {
    const sc = part(new THREE.TorusGeometry(0.20, 0.075, 8, 20), toonMat(pal.accent || '#f0d8c0'), 0, 0.02, 0);
    sc.rotation.x = Math.PI / 2;
    neck.add(sc);
    const trail = part(new THREE.BoxGeometry(0.16, 0.6, 0.03), toonMat(pal.accent || '#f0d8c0'), 0.1, -0.3, -0.14);
    neck.add(trail);
    props.scarf = trail;
  }
  if (P('kimono')) {
    const k = part(new THREE.CylinderGeometry(b.chest * 1.15, b.waist * 1.5, 0.9, 18, 1, true),
      toonMat(pal.primary || '#2a5f8f', { side: THREE.DoubleSide }), 0, -0.28, 0);
    hips.add(k);
  }
  if (P('suit')) {
    const lapelL = part(new THREE.BoxGeometry(0.10, 0.34, 0.02), toonMat('#2b2b38'), -0.10, 0.20, b.chest * 0.72);
    const lapelR = part(new THREE.BoxGeometry(0.10, 0.34, 0.02), toonMat('#2b2b38'), 0.10, 0.20, b.chest * 0.72);
    lapelL.rotation.z = 0.16; lapelR.rotation.z = -0.16;
    spine.add(lapelL, lapelR);
    const shirt = part(new THREE.BoxGeometry(0.10, 0.34, 0.02), toonMat('#f2f2f2'), 0, 0.20, b.chest * 0.74);
    spine.add(shirt);
  }
  if (P('open_vest')) {
    const v = part(new THREE.CylinderGeometry(b.chest * 1.06, b.chest * 1.02, 0.5, 16, 1, true),
      toonMat(pal.primary || '#d63b2f', { side: THREE.DoubleSide }), 0, 0.20, 0);
    v.scale.set(1.1, 1, 0.8);
    spine.add(v);
  }
  if (P('shirtless') || P('open_shirtless')) {
    chest.material = skin;
  }
  if (P('scar_chest')) {
    const sc = part(new THREE.BoxGeometry(0.055, 0.30, 0.02), toonMat('#c98a7a'), 0, 0.18, b.chest * 0.72);
    sc.rotation.z = 0.35;
    spine.add(sc);
  }
  if (P('eye_scar')) {
    const sc = part(new THREE.BoxGeometry(0.016, 0.10, 0.02), toonMat('#c98a7a'), -0.055, 0.02, 0.118);
    head.add(sc);
    eyeL.visible = false;
  }
  if (P('face_scar')) {
    const sc = part(new THREE.BoxGeometry(0.20, 0.016, 0.02), toonMat('#c98a7a'), 0, 0.03, 0.116);
    sc.rotation.z = -0.12;
    head.add(sc);
  }
  if (P('hook_hand')) {
    armL.hand.visible = false;
    const hook = part(new THREE.TorusGeometry(0.075, 0.022, 8, 16, Math.PI * 1.4), toonMat('#c8c8d0'), 0, -0.30, 0);
    hook.rotation.y = Math.PI / 2;
    armL.elbow.add(hook);
  }
  if (P('tusks')) {
    for (const s of [-1, 1]) {
      const t = part(new THREE.ConeGeometry(0.022, 0.10, 6), toonMat('#f2f2e8'), s * 0.055, -0.10, 0.09);
      t.rotation.x = Math.PI;
      head.add(t);
    }
  }
  if (P('topknot')) {
    const t = part(new THREE.SphereGeometry(0.06, 10, 8), hair, 0, 0.19, -0.02);
    head.add(t);
  }
  if (P('curl_brow')) {
    browL.visible = false;
    const curl = part(new THREE.TorusGeometry(0.045, 0.010, 6, 14, Math.PI * 1.6), browMat, -0.058, 0.058, 0.116);
    head.add(curl);
  }
  if (P('cigarette')) {
    const c = part(new THREE.CylinderGeometry(0.008, 0.008, 0.07, 6), toonMat('#f2f2f2'), 0.05, -0.055, 0.115);
    c.rotation.z = Math.PI / 2; c.rotation.y = 0.3;
    head.add(c);
    props.cig = c;
  }
  if (P('cigar')) {
    const c = part(new THREE.CylinderGeometry(0.013, 0.013, 0.11, 6), toonMat('#5a3a22'), 0.055, -0.055, 0.115);
    c.rotation.z = Math.PI / 2; c.rotation.y = 0.25;
    head.add(c);
    props.cig = c;
  }
  if (P('crossed_arms')) {
    armL.group.rotation.x = -1.1; armL.elbow.rotation.x = -1.4; armL.group.rotation.z = 0.5;
    armR.group.rotation.x = -1.1; armR.elbow.rotation.x = -1.4; armR.group.rotation.z = -0.5;
  }
  if (P('sandals')) { legL.foot.material = accent; legR.foot.material = accent; }
  if (P('shoulder_tattoo')) {
    const t = part(new THREE.CircleGeometry(0.06, 12), toonMat('#f0913a'), -b.shoulder * 0.9, -0.05, 0.06);
    t.rotation.y = -0.6;
    shoulders.add(t);
  }
  if (P('back_tattoo')) {
    const t = part(new THREE.CircleGeometry(0.19, 16), toonMat('#5a2a8a'), 0, 0.22, -b.chest * 0.74);
    t.rotation.y = Math.PI;
    spine.add(t);
  }
  if (P('tattoo_hands')) {
    for (const a of [armL, armR]) {
      const t = part(new THREE.CircleGeometry(0.045, 10), toonMat('#2a2a38'), 0, -0.27, 0.07);
      a.elbow.add(t);
    }
  }
  if (P('cross_pendant')) {
    const p = part(new THREE.BoxGeometry(0.05, 0.09, 0.012), accent, 0, 0.10, b.chest * 0.75);
    spine.add(p);
  }

  // --- aura shell (used by haki/charge states) ---
  const auraMat = new THREE.MeshBasicMaterial({
    color: new THREE.Color(md.aura || '#ffffff'),
    transparent: true, opacity: 0, side: THREE.BackSide, depthWrite: false, blending: THREE.AdditiveBlending
  });
  const aura = new THREE.Mesh(new THREE.SphereGeometry(1.05, 20, 16), auraMat);
  aura.scale.set(0.9, 1.35, 0.9);
  aura.position.y = 1.05;
  body.add(aura);

  // --- contact shadow blob (cheap, always reads) ---
  const blob = new THREE.Mesh(
    new THREE.CircleGeometry(0.55, 24),
    new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.28, depthWrite: false })
  );
  blob.rotation.x = -Math.PI / 2;
  blob.position.y = 0.03;
  root.add(blob);

  const rig = {
    body, hips, spine, shoulders, neck, head, armL, armR, legL, legR,
    aura, auraMat, blob, props, eyeL, eyeR, browL, browR, chest,
    scale, heightM, build: b
  };

  const seed = (def.id || '').split('').reduce((a, c) => a + c.charCodeAt(0), 0);

  let t = 0;
  const api = {
    root, rig, def,
    /** state: 'idle'|'ready'|'hurt'|'faint'|'win'|'charge' */
    state: 'idle',
    facing: 1,
    update(dt) {
      t += dt;
      const p = t * 1.5 + seed;
      const breathe = Math.sin(p) * 0.5 + 0.5;
      const s = api.state;

      if (s !== 'faint') {
        rig.hips.position.y = 0.92 + Math.sin(p * 2) * 0.012;
        rig.spine.rotation.x = -0.04 + breathe * 0.05;
        rig.chest.scale.y = 1 + breathe * 0.035;
        rig.neck.rotation.x = 0.02 - breathe * 0.03;
        rig.head.rotation.y = Math.sin(p * 0.42) * 0.10;
        rig.head.rotation.z = Math.sin(p * 0.31 + 1) * 0.03;
      }

      if (s === 'idle' || s === 'ready') {
        const guard = s === 'ready' ? 1 : 0.45;
        if (!P('crossed_arms')) {
          rig.armL.group.rotation.x = -0.12 - guard * 0.55 + Math.sin(p * 1.1) * 0.05;
          rig.armR.group.rotation.x = -0.12 - guard * 0.45 + Math.sin(p * 1.1 + 1.6) * 0.05;
          rig.armL.group.rotation.z = 0.13 + guard * 0.12;
          rig.armR.group.rotation.z = -0.13 - guard * 0.12;
          rig.armL.elbow.rotation.x = -0.30 - guard * 0.95;
          rig.armR.elbow.rotation.x = -0.30 - guard * 0.85;
        }
        rig.legL.group.rotation.x = 0.06 + Math.sin(p * 0.9) * 0.02;
        rig.legR.group.rotation.x = -0.10;
        rig.legL.knee.rotation.x = 0.10;
        rig.legR.knee.rotation.x = 0.14;
        rig.body.rotation.y = 0.18 * api.facing + Math.sin(p * 0.5) * 0.02;
      }

      if (s === 'faint') {
        rig.body.rotation.z = Math.PI * 0.48 * api.facing;
        rig.hips.position.y = 0.30;
        rig.aura.visible = false;
      }

      if (s === 'charge') {
        rig.auraMat.opacity = 0.28 + Math.sin(t * 12) * 0.10;
        rig.aura.scale.set(0.92 + Math.sin(t * 9) * 0.03, 1.38, 0.92 + Math.sin(t * 9) * 0.03);
      }

      // blink
      const blink = Math.sin(t * 0.7 + seed) > 0.985 ? 0.12 : 1;
      rig.eyeL.scale.y = 1.35 * blink; rig.eyeR.scale.y = 1.35 * blink;

      if (props.coat) props.coat.rotation.z = Math.sin(p * 0.8) * 0.02;
      if (props.scarf) props.scarf.rotation.x = Math.sin(p * 1.3) * 0.12;
      if (props.tail) props.tail.rotation.z = Math.sin(p * 1.6) * 0.14;
    },
    setAura(on, color, strength = 0.4) {
      if (color) rig.auraMat.color.set(color);
      rig.auraMat.opacity = on ? strength : 0;
      rig.aura.visible = on;
    },
    dispose() {
      root.traverse((o) => {
        o.geometry?.dispose?.();
        if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => m.dispose?.());
      });
    }
  };
  api.setAura(false);
  return api;
}
