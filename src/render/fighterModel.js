// Procedural fighter models. No external assets: every character is generated
// from its `model` block in data/fighters.js.
//
// ────────────────────────────────────────────────────────────────────────────
// HOW THIS WORKS
//
// A fighter is ONE SkinnedMesh plus ONE inverted-hull outline SkinnedMesh that
// shares its geometry and skeleton. Every body part, garment and prop is
// authored as a small primitive in the local space of the bone it belongs to,
// stamped with a vertex colour and a 4-channel `aFlags` attribute, then baked
// into a single merged BufferGeometry. That keeps a fully detailed character at
// ~4 draw calls (body, outline, aura, contact shadow) instead of one per part.
//
//   aFlags.x  unlit      0 = shaded, 1 = flat (eyes, glows)
//   aFlags.y  gloss      stepped specular amount (hair, metal, leather)
//   aFlags.z  outline    per-vertex outline width multiplier (0 = no line)
//   aFlags.w  rim        rim-light boost
//
// Shading is a custom cel shader: a hard three-band diffuse ramp with a tinted
// shadow, a stepped specular, and a fresnel rim so silhouettes separate from
// the background. It samples the arena's own lights so it stays in key with
// whatever stage it is standing on.
//
// Contract (do not break — other modules reach for these):
//   buildFighter(def, opts) -> { root, rig, def, state, facing,
//                                update(dt), setAura(on,color,strength), dispose() }
//   rig.{ body, spine, head, armL, armR, legL, legR, aura, scale }
// `rig.body` and `rig.spine` are pass-through nodes reserved for OTHER modules
// (battleView writes body.position.y and spine.rotation.x/y). Nothing in here
// animates them; all internal animation happens on private control nodes.
// ────────────────────────────────────────────────────────────────────────────

import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

const HALF_PI = Math.PI / 2;
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const lerp = (a, b, t) => a + (b - a) * t;

/* ══════════════════════════════════════════════════════════════════════════
   1. PROPORTIONS
   Radii are half-widths in metres for a figure authored at 1.8 m.
   ══════════════════════════════════════════════════════════════════════════ */

const BUILDS = {
  lithe:    { heads: 7.9, shoulder: 0.205, chest: 0.150, waist: 0.112, hip: 0.150, arm: 0.049, leg: 0.070, neck: 0.049, deltoid: 0.070, muscle: 0.35, depth: 0.66, foot: 0.90, hand: 0.92 },
  lean:     { heads: 7.6, shoulder: 0.228, chest: 0.168, waist: 0.126, hip: 0.158, arm: 0.056, leg: 0.078, neck: 0.056, deltoid: 0.080, muscle: 0.55, depth: 0.70, foot: 1.00, hand: 1.00 },
  athletic: { heads: 7.3, shoulder: 0.258, chest: 0.192, waist: 0.144, hip: 0.176, arm: 0.066, leg: 0.089, neck: 0.066, deltoid: 0.094, muscle: 0.85, depth: 0.74, foot: 1.05, hand: 1.08 },
  bulk:     { heads: 6.9, shoulder: 0.305, chest: 0.232, waist: 0.180, hip: 0.205, arm: 0.083, leg: 0.107, neck: 0.084, deltoid: 0.116, muscle: 1.15, depth: 0.80, foot: 1.14, hand: 1.20 },
  giant:    { heads: 6.5, shoulder: 0.352, chest: 0.272, waist: 0.214, hip: 0.236, arm: 0.100, leg: 0.126, neck: 0.100, deltoid: 0.136, muscle: 1.40, depth: 0.86, foot: 1.22, hand: 1.32 }
};

/** Skeleton heights for the 1.8 m authoring figure. */
function metrics(b, heads) {
  const H = 1.8;
  const hh = H / heads;                       // head height
  const chin = H - hh;
  const shoulderY = chin - hh * 0.34;
  const chestY = shoulderY - hh * 0.62;
  const waistY = shoulderY - hh * 1.62;
  const hipY = shoulderY - hh * 2.20;
  const kneeY = hipY * 0.505;
  const ankleY = H * 0.055 + b.leg * 0.18;
  return {
    H, hh, chin, shoulderY, chestY, waistY, hipY, kneeY, ankleY,
    thighLen: hipY - kneeY,
    shinLen: kneeY - ankleY,
    upperArm: (shoulderY - chestY) + hh * 1.06,
    foreArm: hh * 1.02,
    hipW: b.hip * 0.56,
    shW: b.shoulder * 0.80
  };
}

/* ══════════════════════════════════════════════════════════════════════════
   2. CEL SHADER
   ══════════════════════════════════════════════════════════════════════════ */

const BODY_VERT = /* glsl */`
#include <common>
#include <skinning_pars_vertex>
#include <fog_pars_vertex>
attribute vec3 aColor;
attribute vec4 aFlags;
varying vec3 vN;
varying vec3 vWP;
varying vec3 vCol;
varying vec4 vFlags;
void main() {
  vCol = aColor;
  vFlags = aFlags;
  vec3 objectNormal = normal;
  vec3 transformed = position;
  #include <skinbase_vertex>
  #include <skinnormal_vertex>
  #include <skinning_vertex>
  vec4 wp = modelMatrix * vec4( transformed, 1.0 );
  vWP = wp.xyz;
  vN = normalize( mat3( modelMatrix ) * objectNormal );
  vec4 mvPosition = viewMatrix * wp;
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;

const BODY_FRAG = /* glsl */`
#include <common>
#include <fog_pars_fragment>
uniform vec3 uLightDir;
uniform vec3 uLightCol;
uniform vec3 uShadowCol;
uniform vec3 uRimCol;
uniform vec3 uBounce;
uniform float uRimAmt;
uniform float uFlash;
uniform vec3 uFlashCol;
uniform float uDesat;
varying vec3 vN;
varying vec3 vWP;
varying vec3 vCol;
varying vec4 vFlags;

void main() {
  vec3 N = normalize( vN );
  vec3 V = normalize( cameraPosition - vWP );
  vec3 L = normalize( uLightDir );

  float ndl = dot( N, L );
  // Hard three-band ramp. fwidth keeps the terminator one pixel wide instead
  // of a stair-stepped mess at grazing angles.
  float w = clamp( fwidth( ndl ) * 0.9, 0.006, 0.09 );
  float b1 = smoothstep( -0.10 - w, -0.10 + w, ndl );
  float b2 = smoothstep(  0.36 - w,  0.36 + w, ndl );

  vec3 shadowC = vCol * uShadowCol;
  vec3 midC    = vCol * mix( uShadowCol, uLightCol, 0.58 );
  vec3 litC    = vCol * uLightCol;
  vec3 col = mix( shadowC, midC, b1 );
  col = mix( col, litC, b2 );

  // Ground bounce keeps the underside from going to mud.
  col += vCol * uBounce * clamp( -N.y * 0.5 + 0.5, 0.0, 1.0 ) * ( 1.0 - b2 * 0.65 );

  // Stepped specular for hair / metal / leather.
  vec3 Hv = normalize( L + V );
  float sp = pow( max( dot( N, Hv ), 0.0 ), 34.0 );
  col += uLightCol * smoothstep( 0.28, 0.42, sp ) * vFlags.y * 0.85;

  // Fresnel rim — the thing that lifts a silhouette off the background.
  float fres = 1.0 - max( dot( N, V ), 0.0 );
  float rim = smoothstep( 0.48, 0.95, fres );
  float back = clamp( dot( N, normalize( L + vec3( 0.0, 0.35, 0.0 ) ) ) * 0.6 + 0.62, 0.0, 1.0 );
  col += uRimCol * rim * uRimAmt * back * ( 0.45 + 0.55 * vFlags.w );

  col = mix( col, vCol, vFlags.x );
  col = mix( col, vec3( dot( col, vec3( 0.3, 0.6, 0.1 ) ) ), uDesat );
  col = mix( col, uFlashCol, uFlash );

  gl_FragColor = vec4( col, 1.0 );
  #include <fog_fragment>
  #include <colorspace_fragment>
}`;

const LINE_VERT = /* glsl */`
#include <common>
#include <skinning_pars_vertex>
attribute vec3 aColor;
attribute vec4 aFlags;
attribute vec3 aOutNormal;
uniform float uThick;
varying vec3 vCol;
void main() {
  vCol = aColor;
  vec3 objectNormal = aOutNormal;
  vec3 transformed = position;
  #include <skinbase_vertex>
  #include <skinnormal_vertex>
  #include <skinning_vertex>
  vec4 mv = modelViewMatrix * vec4( transformed, 1.0 );
  vec3 vn = normalize( normalMatrix * objectNormal );
  float d = max( -mv.z, 0.4 );
  mv.xyz += vn * ( uThick * d * aFlags.z );
  gl_Position = projectionMatrix * mv;
}`;

const LINE_FRAG = /* glsl */`
uniform vec3 uLineCol;
uniform float uTint;
uniform float uFlash;
varying vec3 vCol;
void main() {
  vec3 c = mix( uLineCol, vCol * 0.22, uTint );
  c = mix( c, vec3( 1.0 ), uFlash * 0.8 );
  gl_FragColor = vec4( c, 1.0 );
  #include <colorspace_fragment>
}`;

const AURA_VERT = /* glsl */`
varying vec3 vN;
varying vec3 vWP;
varying vec3 vP;
void main() {
  vP = position;
  vec4 wp = modelMatrix * vec4( position, 1.0 );
  vWP = wp.xyz;
  vN = normalize( mat3( modelMatrix ) * normal );
  gl_Position = projectionMatrix * viewMatrix * wp;
}`;

const AURA_FRAG = /* glsl */`
uniform vec3 uColor;
uniform float uOpacity;
uniform float uTime;
varying vec3 vN;
varying vec3 vWP;
varying vec3 vP;
void main() {
  vec3 V = normalize( cameraPosition - vWP );
  float fres = 1.0 - abs( dot( normalize( vN ), V ) );
  float band = pow( clamp( fres, 0.0, 1.0 ), 2.2 );
  // vertical licks of flame so a charge reads as energy, not a bubble
  float lick = 0.62 + 0.38 * sin( vP.y * 11.0 - uTime * 7.0 + atan( vP.x, vP.z ) * 4.0 );
  float a = band * lick * uOpacity;
  a *= smoothstep( -1.15, -0.25, vP.y );
  gl_FragColor = vec4( uColor * ( 0.7 + band * 1.4 ), a );
}`;

let BASE_BODY_MAT = null;
let BASE_LINE_MAT = null;

function baseMaterials() {
  if (BASE_BODY_MAT) return;
  BASE_BODY_MAT = new THREE.ShaderMaterial({
    uniforms: THREE.UniformsUtils.merge([
      THREE.UniformsLib.fog,
      {
        uLightDir:  { value: new THREE.Vector3(0.45, 0.82, 0.36) },
        uLightCol:  { value: new THREE.Color(1.06, 1.03, 0.98) },
        uShadowCol: { value: new THREE.Color(0.42, 0.44, 0.58) },
        uRimCol:    { value: new THREE.Color(1.0, 0.96, 0.86) },
        uBounce:    { value: new THREE.Color(0.10, 0.11, 0.14) },
        uRimAmt:    { value: 0.72 },
        uFlash:     { value: 0 },
        uFlashCol:  { value: new THREE.Color(1, 1, 1) },
        uDesat:     { value: 0 }
      }
    ]),
    vertexShader: BODY_VERT,
    fragmentShader: BODY_FRAG,
    fog: true
  });
  BASE_LINE_MAT = new THREE.ShaderMaterial({
    uniforms: {
      uThick:   { value: 0.0032 },
      uLineCol: { value: new THREE.Color(0.045, 0.05, 0.075) },
      uTint:    { value: 0.42 },
      uFlash:   { value: 0 }
    },
    vertexShader: LINE_VERT,
    fragmentShader: LINE_FRAG,
    side: THREE.BackSide
  });
}

/* ══════════════════════════════════════════════════════════════════════════
   3. GEOMETRY KIT
   Every primitive is authored in the local space of a bone.
   ══════════════════════════════════════════════════════════════════════════ */

const _m4 = new THREE.Matrix4();
const _q = new THREE.Quaternion();
const _e = new THREE.Euler();
const _v = new THREE.Vector3();

/** Position / rotate / scale a geometry in place. */
function xf(geo, p, r, s) {
  if (s !== undefined && s !== null) {
    if (typeof s === 'number') geo.scale(s, s, s);
    else geo.scale(s[0], s[1], s[2]);
  }
  if (r) {
    _e.set(r[0] || 0, r[1] || 0, r[2] || 0);
    _q.setFromEuler(_e);
    _m4.makeRotationFromQuaternion(_q);
    geo.applyMatrix4(_m4);
  }
  if (p) geo.translate(p[0] || 0, p[1] || 0, p[2] || 0);
  return geo;
}

const sph = (r, w = 10, h = 8) => new THREE.SphereGeometry(r, w, h);
const cap = (r, len, cs = 3, rs = 10) => new THREE.CapsuleGeometry(r, Math.max(0.001, len), cs, rs);
const cyl = (rt, rb, h, rs = 10, open = false) => new THREE.CylinderGeometry(rt, rb, h, rs, 1, open);
const box = (w, h, d) => new THREE.BoxGeometry(w, h, d);
const cone = (r, h, rs = 7) => new THREE.ConeGeometry(r, h, rs);
const torus = (r, t, rs = 7, ts = 14, arc) => new THREE.TorusGeometry(r, t, rs, ts, arc);
/** points: [[radius, y], ...] bottom-to-top */
const lathe = (pts, seg = 12) =>
  new THREE.LatheGeometry(pts.map((p) => new THREE.Vector2(Math.max(0.0001, p[0]), p[1])), seg);

/** A tapered slab — the workhorse for coat panels, blades and cloth. */
function slab(wTop, wBot, h, d, bend = 0) {
  const g = new THREE.BufferGeometry();
  const hw1 = wTop / 2, hw2 = wBot / 2, hd = d / 2;
  const v = [];
  const push = (x, y, z) => v.push(x, y, z + (bend ? bend * (1 - Math.abs(y / h)) : 0));
  // 8 corners: top ring then bottom ring
  const pts = [
    [-hw1, h, -hd], [hw1, h, -hd], [hw1, h, hd], [-hw1, h, hd],
    [-hw2, 0, -hd], [hw2, 0, -hd], [hw2, 0, hd], [-hw2, 0, hd]
  ];
  const faces = [
    [0, 1, 2], [0, 2, 3],       // top
    [4, 6, 5], [4, 7, 6],       // bottom
    [0, 4, 5], [0, 5, 1],       // back
    [3, 2, 6], [3, 6, 7],       // front
    [0, 3, 7], [0, 7, 4],       // left
    [1, 5, 6], [1, 6, 2]        // right
  ];
  for (const f of faces) for (const i of f) push(pts[i][0], pts[i][1], pts[i][2]);
  g.setAttribute('position', new THREE.Float32BufferAttribute(v, 3));
  g.computeVertexNormals();
  return g.toNonIndexed ? g : g;
}

/* ══════════════════════════════════════════════════════════════════════════
   4. BUILDER
   ══════════════════════════════════════════════════════════════════════════ */

let UNKNOWN = null;

export function buildFighter(def, opts = {}) {
  baseMaterials();
  const md = def.model || {};
  const buildKey = BUILDS[md.build] ? md.build : 'athletic';
  const b = BUILDS[buildKey];
  const pal = md.palette || {};
  const trueH = md.height || 1.8;

  // Seeded per-fighter variation so two fighters never breathe in sync.
  const seed = hashStr(def.id || def.name || 'x');
  const rnd = mulberry(seed);

  // Heroic scale: taller characters get a slightly smaller head so they read
  // as colossal, and the applied height is gently compressed so a 7 m fighter
  // still fits the battle frame without lying about who is bigger.
  const heads = clamp(b.heads + clamp((trueH - 1.8) * 0.30, 0, 2.0), 6.2, 9.4);
  const M = metrics(b, heads);
  const displayH = 1.8 * Math.pow(trueH / 1.8, 0.75);
  const scale = displayH / 1.8;

  const C = {
    skin: col(pal.skin || '#e8b98a'),
    hair: col(pal.hair || '#1b1b22'),
    primary: col(pal.primary || '#d63b2f'),
    secondary: col(pal.secondary || '#2e6fd0'),
    accent: col(pal.accent || '#f2d24b'),
    dark: col('#20222e'),
    darker: col('#14161f'),
    steel: col('#b9c2d2'),
    bone: col('#efe6d2'),
    white: col('#f4f6fb'),
    eye: col('#1a1c26')
  };
  C.skinDark = C.skin.clone().multiplyScalar(0.82);
  C.hairLit = C.hair.clone().lerp(col('#ffffff'), 0.12);
  C.cloth = C.primary.clone();
  C.clothDark = C.primary.clone().multiplyScalar(0.70);

  const sil = new Set(md.silhouette || []);
  const has = (...k) => k.some((x) => sil.has(x));

  /* ---------------- scene nodes ---------------- */
  const root = new THREE.Group();
  root.name = `fighter:${def.id}`;
  root.scale.setScalar(scale);

  const body = new THREE.Group();          // reserved for battleView
  const bodyCtrl = new THREE.Group();      // ours: bob / sway / lean / knockdown
  body.add(bodyCtrl);

  /* ---------------- bones ---------------- */
  const bones = [];
  const bone = (name, parent, x = 0, y = 0, z = 0) => {
    const o = new THREE.Bone();
    o.name = name;
    o.position.set(x, y, z);
    parent.add(o);
    bones.push(o);
    return o;
  };
  const grp = (parent, x = 0, y = 0, z = 0) => {
    const o = new THREE.Group();
    o.position.set(x, y, z);
    parent.add(o);
    return o;
  };

  const hips = bone('hips', bodyCtrl, 0, M.hipY, 0);
  const spineA = bone('spineA', hips, 0, (M.chestY - M.hipY) * 0.46, 0);
  const spineCtrl = grp(spineA, 0, (M.chestY - M.hipY) * 0.54, 0);
  const spine = grp(spineCtrl);            // reserved for battleView
  const chest = bone('chest', spine);

  const neck = bone('neck', chest, 0, M.shoulderY - M.chestY, 0);
  const head = bone('head', neck, 0, M.hh * 0.30, 0);
  const eyeL = bone('eyeL', head, 0, 0, 0);
  const eyeR = bone('eyeR', head, 0, 0, 0);
  const browL = bone('browL', head, 0, 0, 0);
  const browR = bone('browR', head, 0, 0, 0);
  const mouth = bone('mouth', head, 0, 0, 0);
  const hairA = bone('hairA', head, 0, M.hh * 0.18, -M.hh * 0.22);
  const hairB = bone('hairB', hairA, 0, -M.hh * 0.55, 0);

  const shoulderDrop = (M.shoulderY - M.chestY) - M.hh * 0.10;
  const shL = bone('shL', chest, -M.shW, shoulderDrop, 0);
  const elL = bone('elL', shL, 0, -M.upperArm, 0);
  const wrL = bone('wrL', elL, 0, -M.foreArm, 0);
  const shR = bone('shR', chest, M.shW, shoulderDrop, 0);
  const elR = bone('elR', shR, 0, -M.upperArm, 0);
  const wrR = bone('wrR', elR, 0, -M.foreArm, 0);

  const hipL = bone('hipL', hips, -M.hipW, -M.hh * 0.10, 0);
  const knL = bone('knL', hipL, 0, -M.thighLen, 0);
  const ankL = bone('ankL', knL, 0, -M.shinLen, 0);
  const hipR = bone('hipR', hips, M.hipW, -M.hh * 0.10, 0);
  const knR = bone('knR', hipR, 0, -M.thighLen, 0);
  const ankR = bone('ankR', knR, 0, -M.shinLen, 0);

  const coatL = bone('coatL', hips, -b.hip * 0.62, 0, 0);
  const coatR = bone('coatR', hips, b.hip * 0.62, 0, 0);
  const coatB = bone('coatB', hips, 0, 0, -b.hip * 0.52);
  const scarfB = bone('scarfB', chest, 0, M.shoulderY - M.chestY - 0.02, -b.chest * 0.5);
  const propBack = bone('propBack', chest, 0, 0, 0);
  const propHip = bone('propHip', hips, 0, 0, 0);
  const propHandL = bone('propHandL', wrL, 0, 0, 0);
  const propHandR = bone('propHandR', wrR, 0, 0, 0);

  const boneIndex = new Map(bones.map((o, i) => [o, i]));

  /* ---------------- part collector ---------------- */
  const parts = [];
  /**
   * @param g   geometry authored in `bn`'s local space
   * @param bn  bone to bind to
   * @param c   THREE.Color
   * @param f   [unlit, gloss, outline, rim]
   */
  const add = (g, bn, c, f) => {
    parts.push({ g, i: boneIndex.get(bn), c, f: f || FLAT });
    return g;
  };
  const FLAT = [0, 0, 1, 1];
  const SKIN = [0, 0.05, 1, 1];
  const CLOTH = [0, 0.02, 1, 1];
  const HAIR = [0, 0.30, 1, 1.15];
  const METAL = [0, 0.85, 1, 1.3];
  const LEATHER = [0, 0.22, 1, 1];
  const UNLIT = [1, 0, 0.45, 0];
  const DETAIL = [0, 0.05, 0, 0.7];

  /* ─────────────── torso ─────────────── */
  const depth = b.depth;
  const abdomenH = (M.chestY - M.hipY) * 0.54 + 0.02;
  // pelvis
  add(xf(lathe([
    [b.hip * 0.42, -M.hh * 0.42], [b.hip * 0.92, -M.hh * 0.26],
    [b.hip * 1.00, -M.hh * 0.05], [b.waist * 1.04, M.hh * 0.16]
  ], 12), [0, 0, 0], null, [1, 1, depth * 1.12]), hips, C.secondary, CLOTH);
  // abdomen
  add(xf(lathe([
    [b.waist * 1.02, -abdomenH * 0.55], [b.waist * 1.06, -abdomenH * 0.1],
    [b.chest * 0.86, abdomenH * 0.34], [b.chest * 0.94, abdomenH * 0.62]
  ], 12), null, null, [1, 1, depth * 1.1]), spineA, C.skin, SKIN);
  // ribcage — flattened front-to-back, widening to the deltoids
  const chestTop = M.shoulderY - M.chestY;
  add(xf(lathe([
    [b.chest * 0.90, -0.02], [b.chest * 1.03, chestTop * 0.28],
    [b.chest * 1.06, chestTop * 0.62], [b.chest * 0.96, chestTop * 0.90],
    [b.chest * 0.62, chestTop * 1.06]
  ], 14), null, null, [1.08, 1, depth]), chest, C.skin, SKIN);
  // clavicle yoke → gives real shoulders instead of a capsule end
  add(xf(cap(b.deltoid * 0.72, M.shW * 1.5, 3, 9), [0, chestTop * 0.90, -b.chest * 0.05], [0, 0, HALF_PI], [1, 1, 0.86]),
    chest, C.skin, SKIN);
  // pectorals
  for (const s of [-1, 1]) {
    add(xf(sph(b.chest * 0.46, 9, 7), [s * b.chest * 0.44, chestTop * 0.66, b.chest * depth * 0.52], null,
      [1, 0.62 + b.muscle * 0.10, 0.55]), chest, C.skin, SKIN);
  }
  // trapezius
  add(xf(sph(b.neck * 1.5, 9, 6), [0, chestTop * 1.0, -b.chest * 0.18], null, [1.9, 0.7, 1.0]),
    chest, C.skin, SKIN);

  /* ─────────────── neck & head ─────────────── */
  add(xf(cyl(b.neck * 0.92, b.neck * 1.12, M.hh * 0.34, 9), [0, M.hh * 0.10, 0]), neck, C.skin, SKIN);

  const hr = M.hh * 0.40;                    // cranium radius
  add(xf(sph(hr, 14, 11), [0, M.hh * 0.06, -M.hh * 0.015], null, [1, 1.04, 1.0]), head, C.skin, SKIN);
  // jaw / chin taper — the shape that makes a head read as anime rather than a ball
  add(xf(lathe([
    [hr * 0.30, -M.hh * 0.40], [hr * 0.66, -M.hh * 0.26],
    [hr * 0.92, -M.hh * 0.08], [hr * 0.99, M.hh * 0.06]
  ], 12), [0, 0, M.hh * 0.012], null, [1, 1, 1.02]), head, C.skin, SKIN);
  // ears
  for (const s of [-1, 1]) {
    add(xf(sph(hr * 0.24, 7, 6), [s * hr * 0.95, -M.hh * 0.02, -M.hh * 0.01], [0, 0, s * 0.2], [0.42, 1, 0.72]),
      head, C.skin, SKIN);
  }
  // nose — tiny, but it is what sells the profile
  add(xf(cone(hr * 0.15, hr * 0.30, 5), [0, -M.hh * 0.055, hr * 0.90], [HALF_PI * 1.16, 0, 0]), head, C.skin, DETAIL);

  const eyeY = M.hh * 0.005;
  const eyeX = hr * 0.44;
  const eyeZ = hr * 0.80;
  const eyeS = (buildKey === 'lithe' ? 1.16 : buildKey === 'giant' || buildKey === 'bulk' ? 0.86 : 1.0);
  for (const [s, eb] of [[-1, eyeL], [1, eyeR]]) {
    eb.position.set(s * eyeX, eyeY, eyeZ * 0.72);
    // sclera
    add(xf(sph(hr * 0.20 * eyeS, 9, 7), [0, 0, 0], null, [1.05, 1.15, 0.42]), eb, C.white, UNLIT);
    // iris
    add(xf(sph(hr * 0.115 * eyeS, 8, 6), [s * hr * 0.02, -hr * 0.012, hr * 0.10], null, [1, 1.25, 0.5]), eb, C.eye, UNLIT);
    // upper lid line — reads as a lash at distance and gives the eye a top edge
    add(xf(box(hr * 0.46 * eyeS, hr * 0.085, hr * 0.06), [0, hr * 0.175 * eyeS, hr * 0.06], [0, 0, s * -0.14]),
      eb, C.hair, UNLIT);
  }
  for (const [s, bb] of [[-1, browL], [1, browR]]) {
    bb.position.set(s * eyeX, eyeY + hr * 0.36, eyeZ * 0.70);
    add(xf(box(hr * 0.52, hr * 0.11, hr * 0.09), [0, 0, 0], [0, 0, s * -0.20]), bb, C.hair, UNLIT);
  }
  mouth.position.set(0, -M.hh * 0.20, hr * 0.72);
  add(xf(sph(hr * 0.22, 8, 6), [0, 0, 0], null, [1, 0.16, 0.30]), mouth, col('#5a2a2e'), UNLIT);

  /* ─────────────── arms ─────────────── */
  const armPair = [[-1, shL, elL, wrL], [1, shR, elR, wrR]];
  for (const [s, sh, el, wr] of armPair) {
    sh.rotation.z = s * 0.14;                                  // relaxed A-pose
    // deltoid
    add(xf(sph(b.deltoid, 10, 8), [0, 0, 0], null, [1, 1.08, 1]), sh, C.skin, SKIN);
    // upper arm, thicker at the bicep
    add(xf(lathe([
      [b.arm * 0.86, -M.upperArm], [b.arm * (0.98 + b.muscle * 0.16), -M.upperArm * 0.55],
      [b.arm * (1.06 + b.muscle * 0.20), -M.upperArm * 0.28], [b.arm * 1.02, -M.upperArm * 0.04]
    ], 10)), sh, C.skin, SKIN);
    // elbow + forearm
    add(sph(b.arm * 0.94, 8, 6), el, C.skin, SKIN);
    add(xf(lathe([
      [b.arm * 0.66, -M.foreArm], [b.arm * 0.74, -M.foreArm * 0.62],
      [b.arm * (0.96 + b.muscle * 0.10), -M.foreArm * 0.24], [b.arm * 0.90, 0]
    ], 10)), el, C.skin, SKIN);
    // hand — a mitt with a thumb reads as a hand at 200 px tall; a sphere does not
    const hs = b.arm * 1.25 * b.hand;
    add(xf(box(hs * 1.28, hs * 1.42, hs * 0.86), [0, -hs * 0.72, 0]), wr, C.skin, SKIN);
    add(xf(sph(hs * 0.66, 8, 6), [0, -hs * 1.36, hs * 0.12], null, [1, 0.82, 1]), wr, C.skin, SKIN);
    add(xf(cap(hs * 0.30, hs * 0.52, 2, 6), [-s * hs * 0.62, -hs * 0.72, hs * 0.22], [0.5, 0, s * 0.65]), wr, C.skin, SKIN);
    // knuckle ridge
    add(xf(box(hs * 1.16, hs * 0.30, hs * 0.34), [0, -hs * 1.28, hs * 0.42]), wr, C.skinDark, DETAIL);
  }

  /* ─────────────── legs ─────────────── */
  const legPair = [[-1, hipL, knL, ankL], [1, hipR, knR, ankR]];
  for (const [s, hp, kn, an] of legPair) {
    hp.rotation.z = s * -0.03;
    add(xf(lathe([
      [b.leg * 0.80, -M.thighLen], [b.leg * 0.94, -M.thighLen * 0.55],
      [b.leg * (1.10 + b.muscle * 0.10), -M.thighLen * 0.20], [b.leg * 1.12, M.hh * 0.08]
    ], 10), null, null, [1, 1, 0.94]), hp, C.secondary, CLOTH);
    add(xf(sph(b.leg * 0.92, 8, 6), [0, 0, 0], null, [1, 0.9, 1]), kn, C.secondary, CLOTH);
    add(xf(lathe([
      [b.leg * 0.52, -M.shinLen], [b.leg * 0.60, -M.shinLen * 0.62],
      [b.leg * (0.92 + b.muscle * 0.10), -M.shinLen * 0.26], [b.leg * 0.86, 0]
    ], 10), [0, 0, -b.leg * 0.04], null, [1, 1, 0.96]), kn, C.secondary, CLOTH);
    // boot
    const fw = b.leg * 1.55 * b.foot, fl = M.hh * 0.62 * b.foot, fy = -M.ankleY;
    add(xf(sph(b.leg * 0.72, 8, 6), [0, 0, 0], null, [1, 0.9, 1]), an, C.dark, LEATHER);
    add(xf(lathe([
      [fw * 0.52, fy + 0.004], [fw * 0.56, fy + M.ankleY * 0.55], [fw * 0.44, fy + M.ankleY * 1.05]
    ], 8), [0, 0, 0], null, [1, 1, 1.5]), an, C.dark, LEATHER);
    add(xf(slab(fw * 0.86, fw * 1.0, M.ankleY * 0.92, fl), [0, fy, fl * 0.10], null, null), an, C.dark, LEATHER);
    add(xf(box(fw * 1.04, M.ankleY * 0.30, fl * 1.02), [0, fy + M.ankleY * 0.15, fl * 0.12]), an, C.darker, LEATHER);
    void s;
  }

  /* ─────────────── clothing ─────────────── */
  const garment = pickGarment(sil, buildKey, rnd);
  buildGarment(garment);

  function torsoShell(color, topY, botY, expand, opts2 = {}) {
    const o = Object.assign({ front: true, back: true, side: true, seg: 14 }, opts2);
    const e = expand;
    const g = lathe([
      [b.chest * (0.92 + e), botY], [b.chest * (1.04 + e), lerp(botY, topY, 0.32)],
      [b.chest * (1.07 + e), lerp(botY, topY, 0.66)], [b.chest * (0.96 + e), lerp(botY, topY, 0.92)],
      [b.chest * (0.60 + e), topY]
    ], o.seg);
    add(xf(g, null, null, [1.08, 1, depth * 1.02]), chest, color, CLOTH);
  }

  function buildGarment(kind) {
    const shirtTop = chestTop * 1.04;
    if (kind === 'bare') {
      // abs definition so a bare torso is not a smooth pill
      for (let i = 0; i < 3; i++) {
        add(xf(box(b.chest * 0.06, abdomenH * 0.30, 0.01),
          [0, abdomenH * (0.24 - i * 0.24), b.chest * depth * 0.92]), spineA, C.skinDark, DETAIL);
      }
      return;
    }
    if (kind === 'vest') {
      // two front panels + a back panel, chest left open
      for (const s of [-1, 1]) {
        add(xf(slab(b.chest * 0.80, b.chest * 0.72, shirtTop * 1.02, 0.035),
          [s * b.chest * 0.66, -0.02, b.chest * depth * 0.72], [0, s * -0.34, s * 0.05]), chest, C.primary, CLOTH);
      }
      add(xf(lathe([
        [b.chest * 1.02, -0.03], [b.chest * 1.10, shirtTop * 0.45], [b.chest * 1.02, shirtTop * 0.96]
      ], 12, Math.PI * 0.42, Math.PI * 1.16), null, null, [1.08, 1, depth * 1.06]), chest, C.primary, CLOTH);
      return;
    }
    if (kind === 'shirt' || kind === 'jacket') {
      torsoShell(C.primary, shirtTop, -abdomenH * 0.9, 0.055);
      add(xf(lathe([
        [b.waist * 1.10, -abdomenH * 0.95], [b.waist * 1.14, -abdomenH * 0.35], [b.chest * 0.98, abdomenH * 0.3]
      ], 12), null, null, [1.05, 1, depth * 1.06]), spineA, C.primary, CLOTH);
      // sleeves
      for (const [s, sh, el] of armPair) {
        add(xf(lathe([
          [b.arm * 1.06, -M.upperArm * (kind === 'jacket' ? 0.98 : 0.55)],
          [b.arm * (1.14 + b.muscle * 0.16), -M.upperArm * 0.30], [b.arm * 1.16, M.hh * 0.06]
        ], 10)), sh, C.primary, CLOTH);
        if (kind === 'jacket') add(xf(cyl(b.arm * 1.06, b.arm * 1.0, M.foreArm * 0.30, 9), [0, -M.foreArm * 0.12, 0]), el, C.primary, CLOTH);
        void s;
      }
      // collar
      add(xf(torus(b.neck * 1.5, b.neck * 0.34, 5, 12), [0, chestTop * 1.02, 0], [HALF_PI, 0, 0], [1, 1, 0.8]),
        chest, C.clothDark, CLOTH);
      return;
    }
    if (kind === 'suit') {
      torsoShell(C.dark, shirtTop, -abdomenH * 0.9, 0.06);
      add(xf(lathe([
        [b.waist * 1.12, -abdomenH * 0.98], [b.waist * 1.16, -abdomenH * 0.30], [b.chest * 1.0, abdomenH * 0.3]
      ], 12), null, null, [1.05, 1, depth * 1.06]), spineA, C.dark, CLOTH);
      // shirt strip + tie
      add(xf(slab(b.chest * 0.44, b.chest * 0.30, shirtTop * 0.98, 0.02),
        [0, -0.01, b.chest * depth * 0.94]), chest, C.white, CLOTH);
      add(xf(slab(b.chest * 0.16, b.chest * 0.09, shirtTop * 0.80, 0.02),
        [0, -0.01, b.chest * depth * 1.00]), chest, C.accent, CLOTH);
      // lapels
      for (const s of [-1, 1]) {
        add(xf(slab(b.chest * 0.34, b.chest * 0.12, shirtTop * 0.86, 0.024),
          [s * b.chest * 0.34, chestTop * 0.06, b.chest * depth * 0.96], [0, s * -0.22, s * 0.30]), chest, C.darker, CLOTH);
      }
      for (const [, sh, el] of armPair) {
        add(xf(lathe([[b.arm * 1.10, -M.upperArm], [b.arm * 1.20, -M.upperArm * 0.3], [b.arm * 1.20, M.hh * 0.06]], 10)), sh, C.dark, CLOTH);
        add(xf(lathe([[b.arm * 0.86, -M.foreArm * 0.92], [b.arm * 1.02, -M.foreArm * 0.3], [b.arm * 1.06, 0]], 10)), el, C.dark, CLOTH);
      }
      add(xf(torus(b.neck * 1.46, b.neck * 0.30, 5, 12), [0, chestTop * 1.0, 0], [HALF_PI, 0, 0], [1, 1, 0.8]), chest, C.white, CLOTH);
      return;
    }
    if (kind === 'kimono') {
      // crossed front panels
      for (const s of [-1, 1]) {
        add(xf(slab(b.chest * 1.05, b.chest * 0.86, shirtTop * 1.06, 0.04),
          [s * b.chest * 0.28, -abdomenH * 0.2, b.chest * depth * 0.70], [0, 0, s * 0.20]), chest, C.primary, CLOTH);
      }
      add(xf(lathe([
        [b.chest * 1.02, -abdomenH], [b.chest * 1.12, shirtTop * 0.5], [b.chest * 1.02, shirtTop * 1.0]
      ], 12, Math.PI * 0.3, Math.PI * 1.4), null, null, [1.06, 1, depth * 1.06]), chest, C.primary, CLOTH);
      // wide sleeves
      for (const [, sh] of armPair) {
        add(xf(lathe([
          [b.arm * 2.5, -M.upperArm * 1.02], [b.arm * 2.1, -M.upperArm * 0.5], [b.arm * 1.3, M.hh * 0.05]
        ], 10), null, null, [1, 1, 0.65]), sh, C.primary, CLOTH);
      }
      // obi
      add(xf(cyl(b.waist * 1.22, b.waist * 1.18, abdomenH * 0.55, 14), [0, -abdomenH * 0.55, 0], null, [1.04, 1, depth * 1.1]),
        spineA, C.accent, CLOTH);
      return;
    }
    if (kind === 'armor') {
      torsoShell(C.steel.clone().lerp(C.primary, 0.5), shirtTop, -abdomenH * 0.5, 0.09);
      for (const [, sh] of armPair) {
        add(xf(lathe([[b.deltoid * 1.5, -b.deltoid * 1.1], [b.deltoid * 1.55, -b.deltoid * 0.2], [b.deltoid * 0.9, b.deltoid * 0.7]], 10)),
          sh, C.steel, METAL);
      }
      add(xf(cyl(b.waist * 1.2, b.waist * 1.16, abdomenH * 0.42, 14), [0, -abdomenH * 0.7, 0], null, [1.04, 1, depth * 1.1]),
        spineA, C.accent, METAL);
      return;
    }
  }

  /* ─────────────── hair ─────────────── */
  buildHair(pickHair(sil, buildKey, rnd));

  function buildHair(style) {
    if (style === 'bald') return;
    const cover = style === 'buzz' ? 0.06 : 0.10;
    // skull cap
    add(xf(sph(hr * (1.0 + cover), 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.62),
      [0, M.hh * 0.055, -M.hh * 0.015], null, [1.02, 1.06, 1.02]), head, C.hair, HAIR);
    if (style === 'buzz') return;

    // fringe — angled wedges over the brow, the single strongest anime cue
    const nF = style === 'bob' ? 7 : 5;
    for (let i = 0; i < nF; i++) {
      const a = (i / (nF - 1) - 0.5) * 1.9;
      const len = hr * (0.55 + rnd() * 0.42) * (style === 'bob' ? 1.15 : 1);
      add(xf(cone(hr * 0.20, len, 4),
        [Math.sin(a) * hr * 0.86, hr * 0.50 - Math.abs(a) * hr * 0.10, Math.cos(a) * hr * 0.80],
        [0.5 + rnd() * 0.35, a * 0.6, a * 0.55 + (rnd() - 0.5) * 0.3]), head, C.hair, HAIR);
    }

    if (style === 'spiky' || style === 'messy') {
      const n = style === 'spiky' ? 11 : 8;
      for (let i = 0; i < n; i++) {
        const th = rnd() * Math.PI * 2;
        const ph = 0.25 + rnd() * 0.9;
        const len = hr * (0.6 + rnd() * 0.85);
        const px = Math.sin(ph) * Math.cos(th) * hr * 0.92;
        const pz = Math.sin(ph) * Math.sin(th) * hr * 0.92;
        const py = Math.cos(ph) * hr * 1.02 + M.hh * 0.05;
        add(xf(cone(hr * 0.20, len, 4), [px, py, pz],
          [Math.sin(ph) * Math.sin(th) * 1.1, 0, -Math.sin(ph) * Math.cos(th) * 1.1]), head, C.hair, HAIR);
      }
    }
    if (style === 'bob') {
      add(xf(lathe([
        [hr * 0.55, -hr * 1.55], [hr * 1.05, -hr * 0.9], [hr * 1.14, -hr * 0.1], [hr * 0.9, hr * 0.6]
      ], 12, Math.PI * 0.18, Math.PI * 1.64), [0, hr * 0.10, -hr * 0.08], null, [1.02, 1, 1.06]), head, C.hair, HAIR);
    }
    if (style === 'long') {
      hairA.position.set(0, hr * 0.45, -hr * 0.62);
      hairB.position.set(0, -hr * 1.05, 0);
      add(xf(slab(hr * 1.85, hr * 1.55, hr * 1.15, hr * 0.62), [0, -hr * 1.15, 0]), hairA, C.hair, HAIR);
      add(xf(slab(hr * 1.5, hr * 0.75, hr * 1.30, hr * 0.5), [0, -hr * 1.30, 0]), hairB, C.hair, HAIR);
      for (const s of [-1, 1]) {
        add(xf(slab(hr * 0.42, hr * 0.26, hr * 2.0, hr * 0.34),
          [s * hr * 0.94, hr * 0.42, hr * 0.30], [0, 0, s * 0.06]), head, C.hair, HAIR);
      }
    }
    if (style === 'ponytail') {
      hairA.position.set(0, hr * 0.42, -hr * 0.92);
      hairB.position.set(0, -hr * 0.9, -hr * 0.1);
      add(xf(torus(hr * 0.32, hr * 0.11, 5, 10), [0, 0, hr * 0.12], [HALF_PI, 0, 0]), hairA, C.accent, CLOTH);
      add(xf(lathe([[hr * 0.10, -hr * 2.0], [hr * 0.42, -hr * 1.0], [hr * 0.34, -hr * 0.1]], 8)), hairA, C.hair, HAIR);
      add(xf(lathe([[hr * 0.06, -hr * 1.5], [hr * 0.26, -hr * 0.6], [hr * 0.22, 0]], 8)), hairB, C.hair, HAIR);
    }
    if (style === 'twin') {
      for (const s of [-1, 1]) {
        add(xf(torus(hr * 0.26, hr * 0.09, 5, 10), [s * hr * 0.92, hr * 0.20, -hr * 0.2], [HALF_PI, 0, 0]), head, C.accent, CLOTH);
        add(xf(lathe([[hr * 0.09, -hr * 1.5], [hr * 0.34, -hr * 0.7], [hr * 0.28, 0]], 8),
          [s * hr * 1.02, hr * 0.10, -hr * 0.25], [0, 0, s * -0.45]), head, C.hair, HAIR);
      }
    }
    if (style === 'topknot') {
      add(xf(cyl(hr * 0.26, hr * 0.30, hr * 0.30, 8), [0, hr * 1.12, -hr * 0.08]), head, C.hair, HAIR);
      add(xf(sph(hr * 0.30, 8, 7), [0, hr * 1.38, -hr * 0.10], null, [1, 0.85, 1]), head, C.hair, HAIR);
    }
    if (style === 'mane') {
      for (let i = 0; i < 13; i++) {
        const a = (i / 12 - 0.5) * 2.5;
        const len = hr * (1.5 + rnd() * 1.1);
        add(xf(cone(hr * 0.22, len, 4),
          [Math.sin(a) * hr * 0.86, hr * (0.55 - Math.abs(a) * 0.28), -Math.cos(a) * hr * 0.5 - hr * 0.35],
          [1.9 + rnd() * 0.4, 0, a * 0.7]), head, C.hair, HAIR);
      }
    }
    if (style === 'dreads') {
      for (let i = 0; i < 10; i++) {
        const a = (i / 9 - 0.5) * 2.6;
        add(xf(cap(hr * 0.13, hr * (1.1 + rnd() * 0.7), 2, 6),
          [Math.sin(a) * hr * 0.9, -hr * 0.55, -Math.cos(a) * hr * 0.55 - hr * 0.2],
          [0.28, 0, a * 0.28]), head, C.hair, HAIR);
      }
    }
    // sideburns keep the face from floating away from the hair mass
    if (style !== 'buzz') {
      for (const s of [-1, 1]) {
        add(xf(slab(hr * 0.30, hr * 0.20, hr * 0.85, hr * 0.36),
          [s * hr * 0.90, hr * 0.36, hr * 0.05], [0, 0, s * 0.04]), head, C.hair, HAIR);
      }
    }
  }

  /* ─────────────── silhouette props ─────────────── */
  const props = {};
  const seen = new Set();
  const P = (...keys) => { for (const k of keys) if (sil.has(k)) { seen.add(k); return true; } return false; };

  /* hats */
  if (P('strawhat', 'straw_hat')) {
    add(xf(lathe([[hr * 0.05, hr * 0.58], [hr * 0.90, hr * 0.56], [hr * 1.02, hr * 0.08], [hr * 2.35, -hr * 0.16], [hr * 2.36, -hr * 0.10]], 20),
      [0, hr * 0.30, 0]), head, C.accent, CLOTH);
    add(xf(torus(hr * 1.02, hr * 0.11, 5, 16), [0, hr * 0.40, 0], [HALF_PI, 0, 0]), head, col('#b5372c'), CLOTH);
  }
  if (P('cowboy_hat')) {
    add(xf(lathe([[hr * 0.05, hr * 0.72], [hr * 0.98, hr * 0.66], [hr * 1.06, hr * 0.10], [hr * 2.15, -hr * 0.02], [hr * 2.20, hr * 0.16]], 18),
      [0, hr * 0.30, 0]), head, C.accent, CLOTH);
    add(xf(torus(hr * 1.06, hr * 0.10, 5, 14), [0, hr * 0.42, 0], [HALF_PI, 0, 0]), head, C.darker, CLOTH);
    for (const s of [-1, 1]) {
      add(xf(sph(hr * 0.22, 7, 5), [s * hr * 1.0, hr * 0.52, 0], null, [0.5, 0.5, 1.6]), head, C.accent, CLOTH);
    }
  }
  if (P('wide_hat')) {
    add(xf(lathe([[hr * 0.05, hr * 1.02], [hr * 0.86, hr * 0.98], [hr * 1.02, hr * 0.10], [hr * 2.6, -hr * 0.24], [hr * 2.62, -hr * 0.16]], 20),
      [0, hr * 0.30, 0]), head, C.darker, CLOTH);
    add(xf(cone(hr * 0.16, hr * 1.9, 5), [hr * 1.2, hr * 1.5, -hr * 0.3], [0, 0, -0.7]), head, col('#c8392f'), HAIR);
  }
  if (P('spotted_hat', 'fur_hat')) {
    add(xf(lathe([[hr * 0.34, hr * 1.55], [hr * 0.88, hr * 1.10], [hr * 1.06, hr * 0.15], [hr * 1.10, -hr * 0.16]], 14),
      [0, hr * 0.24, 0]), head, C.accent, CLOTH);
    for (let i = 0; i < 6; i++) {
      const a = i / 6 * Math.PI * 2;
      add(xf(sph(hr * 0.16, 6, 5), [Math.cos(a) * hr * 0.9, hr * (0.55 + (i % 2) * 0.4), Math.sin(a) * hr * 0.9], null, [1, 1, 0.4]),
        head, C.darker, DETAIL);
    }
    // ear flaps
    for (const s of [-1, 1]) {
      add(xf(slab(hr * 0.5, hr * 0.32, hr * 0.9, hr * 0.2), [s * hr * 1.0, -hr * 0.02, -hr * 0.05], [0, 0, s * 0.1]), head, C.accent, CLOTH);
    }
  }
  if (P('bandana', 'headband')) {
    add(xf(cyl(hr * 1.09, hr * 1.11, hr * 0.34, 14), [0, hr * 0.46, 0]), head, C.dark, CLOTH);
    add(xf(slab(hr * 0.26, hr * 0.16, hr * 1.3, hr * 0.06), [-hr * 0.9, hr * 0.36, -hr * 0.62], [0.3, 0.4, 2.5]), head, C.dark, CLOTH);
  }
  if (P('mask', 'face_mask')) {
    add(xf(lathe([[hr * 0.42, -hr * 0.98], [hr * 0.88, -hr * 0.45], [hr * 1.0, hr * 0.05]], 12, -Math.PI * 0.62, Math.PI * 1.24),
      [0, 0, 0], null, [1, 1, 1.04]), head, C.dark, CLOTH);
  }
  if (P('eyepatch')) {
    add(xf(slab(hr * 0.62, hr * 0.54, hr * 0.58, hr * 0.06), [-eyeX, eyeY + hr * 0.3, eyeZ * 0.80], [0.1, -0.25, 0]), head, C.darker, LEATHER);
    add(xf(cyl(hr * 1.06, hr * 1.06, hr * 0.10, 14), [0, hr * 0.32, 0], [0, 0, 0.22]), head, C.darker, LEATHER);
  }
  if (P('goggles')) {
    for (const s of [-1, 1]) {
      add(xf(cyl(hr * 0.34, hr * 0.34, hr * 0.22, 12), [s * eyeX, hr * 0.62, eyeZ * 0.66], [HALF_PI, 0, 0]), head, C.steel, METAL);
      add(xf(cyl(hr * 0.27, hr * 0.27, hr * 0.26, 12), [s * eyeX, hr * 0.62, eyeZ * 0.70], [HALF_PI, 0, 0]), head, C.accent, UNLIT);
    }
    add(xf(cyl(hr * 1.06, hr * 1.06, hr * 0.16, 14), [0, hr * 0.62, -hr * 0.1]), head, C.darker, LEATHER);
  }
  if (P('glasses', 'sunglasses')) {
    const gc = sil.has('sunglasses') ? C.darker : C.steel;
    for (const s of [-1, 1]) {
      add(xf(slab(hr * 0.48, hr * 0.44, hr * 0.34, hr * 0.04), [s * eyeX, eyeY + hr * 0.2, eyeZ * 0.86]), head, gc, sil.has('sunglasses') ? UNLIT : METAL);
    }
    add(xf(box(hr * 0.26, hr * 0.06, hr * 0.05), [0, eyeY + hr * 0.08, eyeZ * 0.88]), head, gc, METAL);
  }
  if (P('horns')) {
    for (const s of [-1, 1]) {
      add(xf(cone(hr * 0.24, hr * 1.9, 6), [s * hr * 0.66, hr * 0.98, -hr * 0.12], [-0.28, 0, s * -0.44]), head, C.bone, HAIR);
    }
  }
  if (P('cat_ears', 'fox_ears', 'beast_ears')) {
    for (const s of [-1, 1]) {
      add(xf(cone(hr * 0.34, hr * 0.85, 4), [s * hr * 0.62, hr * 1.10, -hr * 0.1], [0, 0, s * 0.28]), head, C.hair, HAIR);
    }
  }
  if (P('halo')) {
    add(xf(torus(hr * 0.90, hr * 0.075, 5, 18), [0, hr * 2.1, 0], [HALF_PI, 0, 0]), head, C.accent, UNLIT);
  }
  if (P('topknot') && pickHair(sil, buildKey, mulberry(seed)) !== 'topknot') {
    add(xf(sph(hr * 0.30, 8, 7), [0, hr * 1.30, -hr * 0.10], null, [1, 0.85, 1]), head, C.hair, HAIR);
  }
  if (P('dragon_mane') && pickHair(sil, buildKey, mulberry(seed)) !== 'mane') {
    for (let i = 0; i < 11; i++) {
      const a = (i / 10 - 0.5) * 2.4;
      add(xf(cone(hr * 0.22, hr * (1.6 + rnd() * 1.0), 4),
        [Math.sin(a) * hr * 0.86, hr * (0.5 - Math.abs(a) * 0.25), -Math.cos(a) * hr * 0.5 - hr * 0.35],
        [1.95, 0, a * 0.7]), head, C.hair, HAIR);
    }
  }
  if (P('tusks')) {
    for (const s of [-1, 1]) {
      add(xf(cone(hr * 0.13, hr * 0.62, 5), [s * hr * 0.40, -hr * 0.52, hr * 0.60], [Math.PI - 0.25, 0, s * 0.16]), head, C.bone, HAIR);
    }
  }
  if (P('curl_brow')) {
    add(xf(torus(hr * 0.34, hr * 0.055, 5, 12, Math.PI * 1.55), [0, hr * 0.10, hr * 0.16], [0, 0, -0.4]), browL, C.hair, UNLIT);
  }
  if (P('cigarette')) {
    add(xf(cyl(hr * 0.045, hr * 0.045, hr * 0.60, 6), [hr * 0.30, 0, hr * 0.24], [HALF_PI, 0, 0.28]), mouth, C.white, DETAIL);
    add(xf(sph(hr * 0.055, 6, 5), [hr * 0.42, hr * 0.06, hr * 0.50]), mouth, col('#ff7a3c'), UNLIT);
  }
  if (P('cigar')) {
    add(xf(cyl(hr * 0.075, hr * 0.085, hr * 0.72, 7), [hr * 0.34, 0, hr * 0.28], [HALF_PI, 0, 0.28]), mouth, col('#5a3a22'), DETAIL);
    add(xf(sph(hr * 0.08, 6, 5), [hr * 0.48, hr * 0.08, hr * 0.58]), mouth, col('#ff8a3c'), UNLIT);
  }

  /* face marks */
  if (P('eye_scar')) {
    add(xf(box(hr * 0.08, hr * 0.95, hr * 0.06), [-eyeX, hr * 0.10, eyeZ * 0.80], [0, -0.22, 0.06]), head, col('#c98a7a'), DETAIL);
    eyeL.scale.set(0.05, 0.05, 0.05);
  }
  if (P('face_scar')) {
    add(xf(box(hr * 1.05, hr * 0.09, hr * 0.06), [0, -hr * 0.12, eyeZ * 0.80], [0, 0, -0.16]), head, col('#c98a7a'), DETAIL);
  }
  if (P('scar_chest')) {
    add(xf(box(b.chest * 0.16, chestTop * 0.86, 0.012), [0, chestTop * 0.42, b.chest * depth * 0.98], [0, 0, 0.32]),
      chest, col('#c98a7a'), DETAIL);
  }
  if (P('shoulder_tattoo')) {
    add(xf(sph(b.deltoid * 0.62, 8, 6), [0, 0, b.deltoid * 0.62], null, [1, 1, 0.05]), shL, C.accent, DETAIL);
  }
  if (P('back_tattoo')) {
    add(xf(sph(b.chest * 0.86, 10, 7), [0, chestTop * 0.52, -b.chest * depth * 1.02], null, [1, 1, 0.04]),
      chest, col('#5a2a8a'), DETAIL);
  }
  if (P('tattoo_hands')) {
    for (const wr of [wrL, wrR]) {
      add(xf(box(b.arm * 1.5, b.arm * 0.5, b.arm * 1.1), [0, -b.arm * 1.6, 0]), wr, C.darker, DETAIL);
    }
  }
  if (P('cross_pendant')) {
    add(xf(torus(b.neck * 1.05, b.neck * 0.09, 5, 14), [0, chestTop * 0.98, b.chest * 0.1], [1.25, 0, 0]), chest, C.accent, METAL);
    add(xf(box(b.chest * 0.16, b.chest * 0.30, 0.02), [0, chestTop * 0.44, b.chest * depth * 1.0]), chest, C.accent, METAL);
    add(xf(box(b.chest * 0.30, b.chest * 0.10, 0.02), [0, chestTop * 0.50, b.chest * depth * 1.0]), chest, C.accent, METAL);
  }

  /* torso layers */
  if (P('haramaki')) {
    add(xf(lathe([[b.waist * 1.20, -abdomenH * 0.95], [b.waist * 1.30, -abdomenH * 0.35], [b.waist * 1.24, abdomenH * 0.2]], 14),
      null, null, [1.03, 1, depth * 1.12]), spineA, col('#2f8a58'), CLOTH);
  }
  if (P('scarf')) {
    add(xf(torus(b.neck * 1.75, b.neck * 0.62, 6, 14), [0, chestTop * 1.04, 0], [HALF_PI, 0, 0], [1, 1, 0.85]),
      chest, C.accent, CLOTH);
    scarfB.position.set(0, chestTop * 0.98, -b.chest * depth * 0.7);
    add(xf(slab(b.chest * 0.72, b.chest * 0.46, M.hh * 2.6, 0.03, -0.05), [0, -M.hh * 2.6, 0]), scarfB, C.accent, CLOTH);
  }
  if (P('cape')) {
    scarfB.position.set(0, chestTop * 1.0, -b.chest * depth * 0.78);
    add(xf(lathe([[b.chest * 2.2, -M.hh * 4.4], [b.chest * 1.6, -M.hh * 2.0], [b.chest * 1.15, 0]], 14, Math.PI * 0.34, Math.PI * 1.32),
      [0, 0, 0]), scarfB, C.primary, CLOTH);
    add(xf(torus(b.neck * 1.7, b.neck * 0.28, 5, 12), [0, 0, b.chest * depth * 0.7], [HALF_PI, 0, 0]), chest, C.accent, METAL);
  }
  if (P('long_coat', 'tall_coat', 'coat', 'jacket_long', 'robes')) {
    const tall = sil.has('tall_coat') || sil.has('robes');
    const len = M.hipY * (tall ? 1.06 : 0.82);
    const cc = C.primary.clone().multiplyScalar(0.94);
    // upper coat over the torso
    add(xf(lathe([
      [b.chest * 1.14, -abdomenH * 1.1], [b.chest * 1.20, chestTop * 0.36],
      [b.chest * 1.14, chestTop * 0.82], [b.chest * 0.72, chestTop * 1.06]
    ], 14, Math.PI * 0.20, Math.PI * 1.60), null, null, [1.05, 1, depth * 1.10]), chest, cc, CLOTH);
    // popped collar
    add(xf(lathe([[b.neck * 1.6, 0], [b.neck * 2.5, M.hh * 0.42]], 12, Math.PI * 0.16, Math.PI * 1.68),
      [0, chestTop * 0.98, 0]), chest, cc, CLOTH);
    // skirt: six panels on three swing bones, so it moves like cloth
    const panels = [[coatL, -1], [coatR, 1], [coatB, 0]];
    for (const [bn, s] of panels) {
      for (const o of [-0.34, 0.34]) {
        const a = (s === 0 ? Math.PI : (s < 0 ? -HALF_PI : HALF_PI)) + o;
        add(xf(slab(b.hip * 0.95, b.hip * 1.35, len, 0.035, -0.02),
          [Math.sin(a) * b.hip * 0.86, -len, Math.cos(a) * b.hip * 0.86 * depth * 1.25],
          [0, a, 0]), bn, cc, CLOTH);
      }
    }
    // front opening flaps stay attached to the hips so they do not swing into the legs
    for (const s of [-1, 1]) {
      add(xf(slab(b.hip * 0.62, b.hip * 0.80, len * 0.92, 0.03),
        [s * b.hip * 0.52, -len * 0.92, b.hip * depth * 1.0], [0, s * -0.30, 0]), hips, cc, CLOTH);
    }
    props.coat = [coatL, coatR, coatB];
  }
  if (P('sandals')) {
    for (const an of [ankL, ankR]) {
      const fw = b.leg * 1.55 * b.foot, fl = M.hh * 0.62 * b.foot;
      add(xf(box(fw * 1.1, M.ankleY * 0.34, fl * 1.06), [0, -M.ankleY + M.ankleY * 0.17, fl * 0.12]), an, C.accent, CLOTH);
      add(xf(box(fw * 0.18, M.ankleY * 0.6, fl * 0.7), [0, -M.ankleY * 0.5, fl * 0.3], [0.4, 0, 0]), an, C.accent, CLOTH);
    }
  }
  if (P('hook_hand')) {
    for (const g of parts) if (g.i === boneIndex.get(wrL)) g.hide = true;
    add(xf(cyl(b.arm * 0.9, b.arm * 0.7, b.arm * 1.0, 8), [0, -b.arm * 0.5, 0]), wrL, C.darker, LEATHER);
    add(xf(torus(b.arm * 1.5, b.arm * 0.30, 6, 12, Math.PI * 1.35),
      [0, -b.arm * 2.4, 0], [0, HALF_PI, -0.5]), wrL, C.steel, METAL);
  }
  if (P('mech_arm', 'mechanical_arm')) {
    for (const g of parts) if (g.i === boneIndex.get(shL) || g.i === boneIndex.get(elL) || g.i === boneIndex.get(wrL)) g.recolor = C.steel;
  }
  if (P('gauntlets')) {
    for (const el of [elL, elR]) {
      add(xf(lathe([[b.arm * 1.18, -M.foreArm * 0.98], [b.arm * 1.34, -M.foreArm * 0.5], [b.arm * 1.22, -M.foreArm * 0.1]], 10)),
        el, C.steel, METAL);
    }
  }
  if (P('wings')) {
    for (const s of [-1, 1]) {
      for (let i = 0; i < 3; i++) {
        add(xf(slab(M.hh * 0.5, M.hh * 0.22, M.hh * (2.6 - i * 0.4), 0.03),
          [s * b.chest * 0.9, chestTop * 0.7, -b.chest * depth * 0.9],
          [0.2, s * (0.5 + i * 0.28), s * (2.2 - i * 0.22)]), chest, C.white, CLOTH);
      }
    }
  }
  if (P('tail')) {
    add(xf(lathe([[b.arm * 0.16, -M.hh * 2.2], [b.arm * 0.5, -M.hh * 1.0], [b.arm * 0.72, 0]], 8),
      [0, -b.hip * 0.2, -b.hip * 0.9], [-0.55, 0, 0]), coatB, C.hair, HAIR);
  }

  /* weapons */
  if (P('three_swords')) {
    propHip.position.set(-b.hip * 0.98, -M.hh * 0.10, -b.hip * 0.30);
    for (let i = 0; i < 3; i++) {
      const g = new THREE.Group();
      void g;
      const rot = [0.42 + i * 0.11, -0.22 + i * 0.16, 0];
      const off = [i * 0.012, 0, -i * 0.045];
      add(xf(cyl(M.hh * 0.075, M.hh * 0.085, M.hh * 3.9, 8), [off[0], off[1] - M.hh * 0.4, off[2]], rot),
        propHip, i === 1 ? C.white : (i === 0 ? C.darker : col('#2f4f6f')), LEATHER);
      add(xf(cyl(M.hh * 0.062, M.hh * 0.062, M.hh * 0.85, 7),
        [off[0] + Math.sin(rot[1]) * 0 + Math.sin(rot[0]) * 0, off[1] + M.hh * 1.72, off[2]], rot), propHip, C.dark, CLOTH);
      add(xf(box(M.hh * 0.30, M.hh * 0.055, M.hh * 0.30),
        [off[0], off[1] + M.hh * 1.30, off[2]], rot), propHip, C.accent, METAL);
    }
    props.swords = propHip;
  }
  if (P('greatsword')) {
    propBack.position.set(-b.chest * 0.55, chestTop * 0.30, -b.chest * depth * 1.15);
    propBack.rotation.set(-0.16, 0, 0.42);
    add(xf(slab(M.hh * 0.30, M.hh * 0.98, M.hh * 6.4, M.hh * 0.10), [0, M.hh * 0.5, 0]), propBack, C.darker, METAL);
    add(xf(slab(M.hh * 0.10, M.hh * 0.34, M.hh * 6.2, M.hh * 0.13), [M.hh * 0.28, M.hh * 0.55, 0]), propBack, C.steel, METAL);
    add(xf(box(M.hh * 1.75, M.hh * 0.20, M.hh * 0.20), [0, M.hh * 0.36, 0]), propBack, C.accent, METAL);
    add(xf(cyl(M.hh * 0.11, M.hh * 0.11, M.hh * 1.1, 8), [0, -M.hh * 0.20, 0]), propBack, col('#5b2a2a'), LEATHER);
    add(xf(sph(M.hh * 0.16, 8, 6), [0, -M.hh * 0.78, 0]), propBack, C.accent, METAL);
    props.weapon = propBack;
  }
  if (P('nodachi', 'katana', 'sword')) {
    const long = sil.has('nodachi');
    propBack.position.set(-b.chest * 0.72, chestTop * 0.16, -b.chest * depth * 1.05);
    propBack.rotation.set(0, 0, 0.58);
    add(xf(cyl(M.hh * 0.075, M.hh * 0.088, M.hh * (long ? 5.6 : 4.4), 8), [0, M.hh * 0.9, 0]), propBack, C.darker, LEATHER);
    add(xf(cyl(M.hh * 0.065, M.hh * 0.065, M.hh * 1.0, 7), [0, -M.hh * 1.9, 0]), propBack, C.dark, CLOTH);
    add(xf(box(M.hh * 0.32, M.hh * 0.05, M.hh * 0.32), [0, -M.hh * 1.38, 0]), propBack, C.accent, METAL);
    props.weapon = propBack;
  }
  if (P('kanabo', 'club')) {
    propBack.position.set(b.shoulder * 0.95, chestTop * 0.62, -b.chest * 0.35);
    propBack.rotation.set(-0.24, 0, -0.34);
    add(xf(cyl(M.hh * 0.30, M.hh * 0.42, M.hh * 7.0, 9), [0, M.hh * 2.2, 0]), propBack, col('#4a3520'), LEATHER);
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * Math.PI * 2 * 3;
      const yy = M.hh * (1.6 + (i / 16) * 3.6);
      add(xf(cone(M.hh * 0.10, M.hh * 0.30, 4),
        [Math.cos(a) * M.hh * 0.36, yy, Math.sin(a) * M.hh * 0.36],
        [Math.sin(a) * 1.5, 0, -Math.cos(a) * 1.5]), propBack, C.accent, METAL);
    }
    add(xf(cyl(M.hh * 0.20, M.hh * 0.18, M.hh * 1.1, 8), [0, -M.hh * 1.6, 0]), propBack, C.dark, LEATHER);
    props.weapon = propBack;
  }
  if (P('trident', 'spear', 'staff', 'polearm')) {
    propBack.position.set(b.shoulder * 1.02, chestTop * 0.1, -b.chest * 0.45);
    propBack.rotation.set(0, 0, -0.20);
    add(xf(cyl(M.hh * 0.075, M.hh * 0.075, M.hh * 8.6, 8), [0, M.hh * 2.0, 0]), propBack, col('#3a2a2a'), LEATHER);
    if (sil.has('trident')) {
      for (const s of [-1, 0, 1]) {
        add(xf(cone(M.hh * 0.11, M.hh * 0.95, 5), [s * M.hh * 0.34, M.hh * (s === 0 ? 6.9 : 6.6), 0]), propBack, C.steel, METAL);
      }
      add(xf(box(M.hh * 0.80, M.hh * 0.10, M.hh * 0.10), [0, M.hh * 6.15, 0]), propBack, C.steel, METAL);
    } else if (sil.has('staff')) {
      add(xf(sph(M.hh * 0.30, 9, 7), [0, M.hh * 6.35, 0]), propBack, C.accent, METAL);
    } else {
      add(xf(cone(M.hh * 0.15, M.hh * 1.1, 5), [0, M.hh * 6.8, 0]), propBack, C.steel, METAL);
    }
    props.weapon = propBack;
  }
  if (P('axe')) {
    propBack.position.set(b.shoulder * 0.95, chestTop * 0.3, -b.chest * 0.4);
    propBack.rotation.set(0, 0, -0.3);
    add(xf(cyl(M.hh * 0.085, M.hh * 0.085, M.hh * 5.6, 8), [0, M.hh * 1.4, 0]), propBack, col('#4a3520'), LEATHER);
    add(xf(slab(M.hh * 1.5, M.hh * 0.5, M.hh * 1.7, M.hh * 0.12), [M.hh * 0.55, M.hh * 3.3, 0], [0, 0, -0.2]), propBack, C.steel, METAL);
    props.weapon = propBack;
  }
  if (P('climatact', 'baton', 'rod')) {
    propHandR.position.set(0, -b.arm * 1.6, b.arm * 0.6);
    propHandR.rotation.set(0.5, 0, 0);
    add(xf(cyl(M.hh * 0.058, M.hh * 0.058, M.hh * 2.1, 8), [0, 0, 0]), propHandR, C.secondary, CLOTH);
    add(xf(cyl(M.hh * 0.068, M.hh * 0.068, M.hh * 0.40, 8), [0, M.hh * 0.72, 0]), propHandR, col('#f0913a'), CLOTH);
    add(xf(cyl(M.hh * 0.068, M.hh * 0.068, M.hh * 0.40, 8), [0, -M.hh * 0.72, 0]), propHandR, col('#e04a4a'), CLOTH);
    props.hand = propHandR;
  }
  if (P('shield')) {
    propHandL.position.set(0, -b.arm * 1.8, b.arm * 0.9);
    add(xf(lathe([[M.hh * 0.05, M.hh * 0.22], [M.hh * 1.5, M.hh * 0.06], [M.hh * 1.55, -M.hh * 0.06]], 14),
      [0, 0, 0], [HALF_PI, 0, 0]), propHandL, C.steel, METAL);
  }
  if (P('twin_blades', 'dual_blades')) {
    for (const [wr, s] of [[propHandL, -1], [propHandR, 1]]) {
      wr.position.set(0, -b.arm * 1.7, b.arm * 0.4);
      add(xf(slab(M.hh * 0.16, M.hh * 0.34, M.hh * 3.2, M.hh * 0.06), [0, 0, 0], [0.4, 0, s * 0.2]), wr, C.steel, METAL);
    }
  }

  /* bare-chest overrides */
  if (P('shirtless', 'open_shirtless', 'bare_chest')) { /* handled by garment picker */ }
  if (P('open_vest')) { /* handled by garment picker */ }
  if (P('suit')) { /* handled by garment picker */ }
  if (P('kimono')) { /* handled by garment picker */ }
  if (P('crossed_arms')) props.crossedArms = true;

  for (const k of sil) {
    if (!seen.has(k) && !GARMENT_KEYS.has(k) && !HAIR_KEYS.has(k)) {
      if (!UNKNOWN) {
        UNKNOWN = new Set();
        if (typeof window !== 'undefined') window.__UNKNOWN_SILHOUETTE = UNKNOWN;
      }
      UNKNOWN.add(k);
    }
  }

  /* ══════════ bake ══════════ */
  body.updateMatrixWorld(true);

  const geos = [];
  for (const p of parts) {
    if (p.hide) { p.g.dispose(); continue; }
    const g = p.g;
    if (g.index === null) { /* slab() is non-indexed; merge tolerates it if all match */ }
    g.deleteAttribute('uv');
    g.applyMatrix4(bones[p.i].matrixWorld);
    const n = g.attributes.position.count;
    const c = p.recolor || p.c;
    const colArr = new Float32Array(n * 3);
    const flgArr = new Float32Array(n * 4);
    const siArr = new Uint16Array(n * 4);
    const swArr = new Float32Array(n * 4);
    for (let i = 0; i < n; i++) {
      colArr[i * 3] = c.r; colArr[i * 3 + 1] = c.g; colArr[i * 3 + 2] = c.b;
      flgArr[i * 4] = p.f[0]; flgArr[i * 4 + 1] = p.f[1]; flgArr[i * 4 + 2] = p.f[2]; flgArr[i * 4 + 3] = p.f[3];
      siArr[i * 4] = p.i;
      swArr[i * 4] = 1;
    }
    g.setAttribute('aColor', new THREE.BufferAttribute(colArr, 3));
    g.setAttribute('aFlags', new THREE.BufferAttribute(flgArr, 4));
    g.setAttribute('skinIndex', new THREE.BufferAttribute(siArr, 4));
    g.setAttribute('skinWeight', new THREE.BufferAttribute(swArr, 4));
    smoothNormals(g);
    geos.push(g.index ? g.toNonIndexed() : g);
    if (g.index) g.dispose();
  }

  const merged = mergeGeometries(geos, false);
  for (const g of geos) g.dispose();
  merged.computeBoundingSphere();

  const bodyMat = BASE_BODY_MAT.clone();
  const lineMat = BASE_LINE_MAT.clone();
  bodyMat.fog = true;

  const skinMesh = new THREE.SkinnedMesh(merged, bodyMat);
  skinMesh.castShadow = true;
  skinMesh.receiveShadow = false;
  skinMesh.frustumCulled = false;
  body.add(skinMesh);

  const skeleton = new THREE.Skeleton(bones);
  skinMesh.bind(skeleton);

  let lineMesh = null;
  if (opts.outline !== false) {
    lineMesh = new THREE.SkinnedMesh(merged, lineMat);
    lineMesh.castShadow = false;
    lineMesh.receiveShadow = false;
    lineMesh.frustumCulled = false;
    lineMesh.renderOrder = -1;
    body.add(lineMesh);
    lineMesh.bind(skeleton);
  }

  root.add(body);

  /* ---------------- aura ---------------- */
  const auraMat = new THREE.ShaderMaterial({
    uniforms: {
      uColor: { value: new THREE.Color(md.aura || '#ffffff') },
      uOpacity: { value: 0 },
      uTime: { value: 0 }
    },
    vertexShader: AURA_VERT, fragmentShader: AURA_FRAG,
    transparent: true, depthWrite: false, side: THREE.BackSide, blending: THREE.AdditiveBlending
  });
  const aura = new THREE.Mesh(new THREE.SphereGeometry(1, 18, 14), auraMat);
  aura.scale.set(b.shoulder * 3.4, 1.12, b.shoulder * 3.0);
  aura.position.y = 1.02;
  aura.visible = false;
  aura.frustumCulled = false;
  root.add(aura);

  /* ---------------- contact shadow ---------------- */
  const blobMat = new THREE.MeshBasicMaterial({
    color: 0x05060c, transparent: true, opacity: 0.34, depthWrite: false
  });
  const blob = new THREE.Mesh(new THREE.CircleGeometry(b.shoulder * 2.1, 20), blobMat);
  blob.rotation.x = -HALF_PI;
  blob.position.y = 0.02;
  blob.renderOrder = -2;
  root.add(blob);

  /* ══════════════════════════════════════════════════════════════════════
     5. RIG + ANIMATION
     ══════════════════════════════════════════════════════════════════════ */

  const rig = {
    body, bodyCtrl, hips, spineA, spine, spineCtrl, chest, neck, head,
    eyeL, eyeR, browL, browR, mouth,
    armL: { group: shL, elbow: elL, wrist: wrL, hand: wrL, upper: shL, fore: elL },
    armR: { group: shR, elbow: elR, wrist: wrR, hand: wrR, upper: shR, fore: elR },
    legL: { group: hipL, knee: knL, ankle: ankL, foot: ankL },
    legR: { group: hipR, knee: knR, ankle: ankR, foot: ankR },
    hair: [hairA, hairB], coat: [coatL, coatR, coatB], scarf: scarfB,
    propBack, propHip, propHandL, propHandR,
    aura, auraMat, blob, props, mesh: skinMesh, outline: lineMesh, skeleton,
    bodyMat, lineMat, bones,
    scale, heightM: trueH, displayH, build: b, buildKey, metrics: M
  };

  /* --- joints table for pose blending --- */
  const JN = ['hips', 'spineA', 'chest', 'neck', 'head', 'shL', 'elL', 'wrL', 'shR', 'elR', 'wrR',
    'hipL', 'knL', 'ankL', 'hipR', 'knR', 'ankR'];
  const JO = { hips, spineA, chest, neck, head, shL, elL, wrL, shR, elR, wrR, hipL, knL, ankL, hipR, knR, ankR };
  const BIND = {};
  for (const n of JN) BIND[n] = [JO[n].rotation.x, JO[n].rotation.y, JO[n].rotation.z];
  const curP = {};
  for (const n of JN) curP[n] = BIND[n].slice();
  const tmpP = {};
  for (const n of JN) tmpP[n] = [0, 0, 0];

  const crossed = !!props.crossedArms;
  const winStyle = props.weapon ? 'weapon' : (crossed ? 'arms' : (rnd() < 0.45 ? 'fist' : 'point'));

  const POSES = buildPoseTable(crossed, winStyle, b);

  /* --- state --- */
  let t = rnd() * 40;
  let stateT = 0;
  let prevState = 'idle';
  let hurtT = 99;
  let blinkTimer = 1 + rnd() * 3;
  let blinkPhase = 0;
  let nextGlance = 2 + rnd() * 3;
  let glanceX = 0, glanceY = 0;
  let guardTimer = 4 + rnd() * 4;
  let guardPulse = 0;
  const rate = 0.86 + rnd() * 0.28;           // personal tempo
  const phase = rnd() * Math.PI * 2;
  const lag = { x: 0, z: 0, y: 0 };
  const bounce = { v: 0, x: 0 };
  const env = { dir: new THREE.Vector3(0.45, 0.82, 0.36), t: 99 };
  const _wq = new THREE.Quaternion();
  const _wp = new THREE.Vector3();

  const api = {
    root, rig, def,
    state: 'idle',
    facing: 1,
    heightM: trueH,

    update(dt) {
      dt = clamp(dt || 0, 0, 1 / 20);
      t += dt * rate;
      const s = api.state;
      if (s !== prevState) { stateT = 0; if (s === 'hurt') hurtT = 0; prevState = s; }
      stateT += dt;
      hurtT += dt;

      env.t += dt;
      if (env.t > 0.35) { env.t = 0; sampleEnv(root, bodyMat, env); }

      /* ---- pose target ---- */
      const laid = Math.abs(root.rotation.z) > 0.6;
      const poseFn = POSES[s] || POSES.idle;
      for (const n of JN) { tmpP[n][0] = BIND[n][0]; tmpP[n][1] = BIND[n][1]; tmpP[n][2] = BIND[n][2]; }
      const ctl = poseFn(tmpP, { t, dt, stateT, laid, b, M, facing: api.facing, hurtT, rnd: phase });

      const k = 1 - Math.exp(-dt * (s === 'hurt' ? 34 : s === 'faint' ? 13 : 9));
      for (const n of JN) {
        const c = curP[n], g = tmpP[n];
        c[0] += (g[0] - c[0]) * k; c[1] += (g[1] - c[1]) * k; c[2] += (g[2] - c[2]) * k;
      }

      /* ---- procedural layer on top of the blended pose ---- */
      // Breath: asymmetric — a quick draw and a long release, like a held guard.
      const bp = (t * 0.52 + phase) % 1;
      const breath = bp < 0.38 ? Math.sin((bp / 0.38) * HALF_PI) : Math.cos(((bp - 0.38) / 0.62) * HALF_PI * 1.0);
      // Weight shift between feet, slower than the breath and out of phase.
      const shift = Math.sin(t * 0.31 + phase * 1.7);
      const sway = Math.sin(t * 0.23 + phase);

      const alive = s === 'idle' || s === 'ready' || s === 'win';
      let bobY = 0, leanX = 0, rollZ = 0, yaw = 0;

      if (alive) {
        bobY = breath * 0.010 + Math.abs(shift) * -0.008;
        leanX = -breath * 0.018;
        rollZ = shift * 0.028;
        yaw = sway * 0.030;
        curP.spineA[0] += breath * 0.030;
        curP.chest[0] -= breath * 0.016;
        curP.chest[2] += shift * 0.030;
        curP.neck[0] -= breath * 0.020;
        curP.hips[2] -= shift * 0.045;
        curP.hips[1] += sway * 0.05;
        // the loaded leg straightens, the free leg softens
        curP.hipL[0] += shift * 0.045; curP.knL[0] += clamp(shift, 0, 1) * 0.10;
        curP.hipR[0] -= shift * 0.045; curP.knR[0] += clamp(-shift, 0, 1) * 0.10;
        curP.shL[2] += shift * 0.030 - breath * 0.020;
        curP.shR[2] += shift * 0.030 + breath * 0.020;
        curP.shL[0] += Math.sin(t * 0.9 + phase) * 0.020;
        curP.shR[0] += Math.sin(t * 0.9 + phase + 1.9) * 0.020;
      }

      if (s === 'ready') {
        // a light bounce on the balls of the feet
        const bo = Math.abs(Math.sin(t * 2.3 + phase));
        bobY -= bo * 0.022;
        curP.knL[0] += bo * 0.10; curP.knR[0] += bo * 0.10;
        curP.elL[0] -= bo * 0.06; curP.elR[0] -= bo * 0.06;
      }

      if (s === 'charge') {
        const tr = Math.sin(t * 26) * 0.010 + Math.sin(t * 41) * 0.006;
        curP.chest[2] += tr; curP.spineA[0] += tr * 0.6;
        curP.shL[2] += tr * 2; curP.shR[2] -= tr * 2;
        bobY += Math.sin(t * 18) * 0.006;
      }

      if (s === 'hurt') {
        const d = Math.exp(-hurtT * 5.2);
        const sh = Math.sin(hurtT * 46) * d;
        curP.chest[2] += sh * 0.05;
        curP.head[2] += sh * 0.07;
        bobY -= d * 0.03;
      }

      // guard reset — a periodic shoulder roll so the loop never feels like a loop
      guardTimer -= dt;
      if (guardTimer <= 0 && (s === 'idle' || s === 'ready')) { guardTimer = 5.5 + rnd() * 5; guardPulse = 1; }
      if (guardPulse > 0) {
        guardPulse = Math.max(0, guardPulse - dt * 1.7);
        const gp = Math.sin(guardPulse * Math.PI);
        curP.shL[2] -= gp * 0.16; curP.shR[2] += gp * 0.16;
        curP.shL[0] += gp * 0.10; curP.shR[0] += gp * 0.10;
        curP.chest[0] -= gp * 0.05;
        bobY -= gp * 0.012;
      }

      /* ---- write joints ---- */
      for (const n of JN) {
        const o = JO[n], c = curP[n];
        o.rotation.set(c[0], c[1], c[2]);
      }

      /* ---- body control node ---- */
      const bc = bodyCtrl;
      if (s === 'faint') {
        // The battle view lays the root over on its side. Spin the body a
        // quarter turn so the fighter lands on their BACK, then lift them out
        // of the floor by half their depth and let the impact settle out.
        const tgtYaw = laid ? api.facing * HALF_PI : 0;
        const lift = laid ? api.facing * (b.chest * depth * 1.06 + 0.05) : 0;
        const settle = Math.exp(-stateT * 6) * Math.sin(stateT * 19) * 0.055;
        bc.rotation.y += (tgtYaw - bc.rotation.y) * (1 - Math.exp(-dt * 12));
        bc.rotation.x += (0 - bc.rotation.x) * (1 - Math.exp(-dt * 10));
        bc.rotation.z += ((ctl?.roll || 0) - bc.rotation.z) * (1 - Math.exp(-dt * 10));
        bc.position.x += (lift - bc.position.x) * (1 - Math.exp(-dt * 12));
        bc.position.y += ((laid ? 0 : -M.hipY * 0.42) + settle - bc.position.y) * (1 - Math.exp(-dt * 14));
        bc.position.z = 0;
      } else {
        const tYaw = (ctl?.yaw !== undefined ? ctl.yaw : 0.20) * api.facing + yaw;
        bc.rotation.y += (tYaw - bc.rotation.y) * (1 - Math.exp(-dt * 8));
        bc.rotation.z += ((ctl?.roll || 0) + rollZ - bc.rotation.z) * (1 - Math.exp(-dt * 8));
        bc.rotation.x += ((ctl?.pitch || 0) + leanX - bc.rotation.x) * (1 - Math.exp(-dt * 8));
        bc.position.y += ((ctl?.drop || 0) + bobY - bc.position.y) * (1 - Math.exp(-dt * 11));
        bc.position.x += (0 - bc.position.x) * (1 - Math.exp(-dt * 10));
        bc.position.z += ((ctl?.push || 0) - bc.position.z) * (1 - Math.exp(-dt * 10));
      }

      /* ---- secondary motion: hair, coat, scarf lag the chest ---- */
      const kl = 1 - Math.exp(-dt * 5.5);
      lag.x += (curP.chest[0] + bc.rotation.x * 1.4 - lag.x) * kl;
      lag.z += (curP.chest[2] + bc.rotation.z * 1.4 - lag.z) * kl;
      lag.y += (bc.rotation.y - lag.y) * kl;
      const dX = (curP.chest[0] + bc.rotation.x * 1.4) - lag.x;
      const dZ = (curP.chest[2] + bc.rotation.z * 1.4) - lag.z;
      const dY = bc.rotation.y - lag.y;

      // vertical impulse spring: catches landings and the knockdown
      bounce.v += (-bounce.x * 150 - bounce.v * 17) * dt;
      bounce.x += bounce.v * dt;
      const bnc = clamp(bounce.x, -0.5, 0.5);

      const drape = s === 'faint' ? 0.25 : 1;
      hairA.rotation.x = (-dX * 1.5 + Math.sin(t * 1.21 + phase) * 0.030 + bnc * 0.6) * drape;
      hairA.rotation.z = (-dZ * 1.4 - dY * 0.5 + Math.sin(t * 0.93 + phase * 2) * 0.028) * drape;
      hairB.rotation.x = hairA.rotation.x * 0.85 + Math.sin(t * 1.6 + phase) * 0.024;
      hairB.rotation.z = hairA.rotation.z * 0.85;
      for (let i = 0; i < 3; i++) {
        const cb = rig.coat[i];
        const ph2 = i * 2.1 + phase;
        cb.rotation.x = (-dX * 2.2 + Math.sin(t * 0.86 + ph2) * 0.042 + bnc * 0.9) * drape;
        cb.rotation.z = (-dZ * 2.0 - dY * 0.9 + Math.sin(t * 0.64 + ph2) * 0.038) * drape;
      }
      scarfB.rotation.x = -dX * 2.4 + Math.sin(t * 1.05 + phase) * 0.070 + bnc * 0.8;
      scarfB.rotation.z = -dZ * 2.2 - dY * 1.1 + Math.sin(t * 0.79 + phase) * 0.060;
      propBack.rotation.z = propBack.userData.rz === undefined
        ? (propBack.userData.rz = propBack.rotation.z)
        : propBack.userData.rz - dZ * 0.35;

      /* ---- face ---- */
      blinkTimer -= dt;
      if (blinkTimer <= 0) { blinkPhase = 1; blinkTimer = 1.8 + rnd() * 4.2; }
      if (blinkPhase > 0) blinkPhase = Math.max(0, blinkPhase - dt * 9);
      const closed = s === 'faint' ? 1 : Math.sin(blinkPhase * Math.PI) * (s === 'hurt' ? 1 : 1);
      const squint = s === 'charge' ? 0.35 : s === 'hurt' ? 0.55 : s === 'ready' ? 0.12 : 0;
      const open = clamp(1 - closed * 0.95 - squint, 0.04, 1);
      if (!eyeL.userData.hidden) eyeL.scale.set(1, open, 1);
      eyeR.scale.set(1, open, 1);

      nextGlance -= dt;
      if (nextGlance <= 0) {
        nextGlance = 1.6 + rnd() * 3.4;
        glanceX = (rnd() - 0.5) * 0.32;
        glanceY = (rnd() - 0.5) * 0.16;
      }
      const gk = 1 - Math.exp(-dt * 7);
      head.rotation.y += (glanceX * (alive ? 1 : 0.2) - (head.rotation.y - curP.head[1])) * gk * 0.4;
      head.rotation.x += (glanceY * (alive ? 1 : 0.2) - (head.rotation.x - curP.head[0])) * gk * 0.4;

      const angry = s === 'charge' ? 1 : s === 'ready' ? 0.5 : s === 'hurt' ? 0.8 : 0;
      const browTilt = 0.34 * angry;
      browL.rotation.z = -browTilt; browR.rotation.z = browTilt;
      browL.position.y = browR.position.y = eyeY + hr * (0.36 - 0.10 * angry);

      const shout = s === 'charge' ? 0.7 + Math.sin(t * 9) * 0.2
        : s === 'win' ? 0.55 + Math.sin(t * 4) * 0.25
          : s === 'hurt' ? Math.exp(-hurtT * 3) * 0.9 : 0;
      mouth.scale.set(1 + shout * 0.45, 1 + shout * 4.6, 1 + shout * 0.6);

      /* ---- aura ---- */
      auraMat.uniforms.uTime.value = t;
      if (s === 'charge') {
        aura.visible = true;
        auraMat.uniforms.uOpacity.value = 0.55 + Math.sin(t * 11) * 0.16;
        const p2 = 1 + Math.sin(t * 8) * 0.035;
        aura.scale.set(b.shoulder * 3.4 * p2, 1.14 * p2, b.shoulder * 3.0 * p2);
      }

      /* ---- hurt flash ---- */
      bodyMat.uniforms.uFlash.value = s === 'hurt' ? Math.max(0, 0.55 - hurtT * 2.2) : 0;
      lineMat.uniforms.uFlash.value = bodyMat.uniforms.uFlash.value;
      bodyMat.uniforms.uDesat.value = s === 'faint' ? Math.min(0.55, stateT * 0.9) : 0;

      /* ---- contact shadow tracks the hips and stays flat on the floor ---- */
      root.updateMatrixWorld();
      hips.getWorldPosition(_wp);
      root.worldToLocal(_wp);
      blob.position.set(_wp.x, 0.02 / Math.max(0.2, scale), _wp.z);
      root.getWorldQuaternion(_wq).invert();
      blob.quaternion.copy(_wq).multiply(FLAT_Q);
      const spread = s === 'faint' ? 1.5 : 1;
      const rise = clamp(1 - Math.abs(_wp.y - M.hipY) * 0.8, 0.55, 1.2);
      blob.scale.set(spread * rise, spread * rise, 1);
      blobMat.opacity = 0.34 * rise;
    },

    /** Called by presentation code on a hit: kicks the recoil springs. */
    hit(power = 1) {
      hurtT = 0;
      bounce.v -= 2.2 * clamp(power, 0.2, 2.4);
    },

    setAura(on, color, strength = 0.4) {
      if (color) auraMat.uniforms.uColor.value.set(color);
      auraMat.uniforms.uOpacity.value = on ? strength * 1.4 : 0;
      aura.visible = !!on;
    },

    dispose() {
      merged.dispose();
      bodyMat.dispose(); lineMat.dispose();
      auraMat.dispose(); aura.geometry.dispose();
      blobMat.dispose(); blob.geometry.dispose();
      skeleton.dispose?.();
    }
  };

  if (has('eye_scar')) eyeL.userData.hidden = true;

  api.setAura(false);
  api.update(0.016);
  return api;
}

const FLAT_Q = new THREE.Quaternion().setFromEuler(new THREE.Euler(-HALF_PI, 0, 0));

/* ══════════════════════════════════════════════════════════════════════════
   6. POSES
   Bones hang along -Y. Positive rotation.x on a limb swings its tip BACK,
   so a forward swing is negative. `s` below is -1 for left, +1 for right and
   a positive z value therefore means "away from the body".
   ══════════════════════════════════════════════════════════════════════════ */

function buildPoseTable(crossed, winStyle, b) {
  const armsCrossed = (p) => {
    p.shL[0] = -1.16; p.shL[1] = 0.30; p.shL[2] = -0.62;
    p.elL[0] = -1.75; p.elL[1] = -0.30; p.elL[2] = 0;
    p.shR[0] = -1.10; p.shR[1] = -0.30; p.shR[2] = 0.62;
    p.elR[0] = -1.90; p.elR[1] = 0.30; p.elR[2] = 0;
    p.chest[0] = 0.05;
  };

  const idle = (p, c) => {
    p.spineA[0] = -0.035;
    p.chest[0] = 0.030;
    p.neck[0] = 0.045;
    p.head[0] = -0.030;
    if (crossed) armsCrossed(p);
    else {
      p.shL[0] = -0.10; p.shL[2] = -0.20; p.elL[0] = -0.38; p.elL[1] = -0.16;
      p.shR[0] = -0.06; p.shR[2] = 0.20; p.elR[0] = -0.34; p.elR[1] = 0.16;
    }
    p.hipL[0] = -0.045; p.hipL[2] = -0.045; p.knL[0] = 0.075;
    p.hipR[0] = 0.030; p.hipR[2] = 0.055; p.knR[0] = 0.055;
    p.ankL[0] = -0.030; p.ankR[0] = -0.025;
    void c;
    return { yaw: 0.20, drop: 0 };
  };

  const ready = (p) => {
    p.hips[1] = 0.28;
    p.spineA[0] = -0.12; p.spineA[1] = -0.14;
    p.chest[0] = 0.06; p.chest[1] = -0.12;
    p.neck[0] = 0.10; p.head[1] = 0.26;
    if (crossed) {
      armsCrossed(p);
      p.chest[0] = 0.02;
    } else {
      p.shL[0] = -0.92; p.shL[1] = 0.34; p.shL[2] = -0.34;
      p.elL[0] = -1.62; p.elL[1] = -0.40;
      p.shR[0] = -0.62; p.shR[1] = -0.24; p.shR[2] = 0.30;
      p.elR[0] = -2.00; p.elR[1] = 0.34;
    }
    p.hipL[0] = -0.34; p.hipL[1] = 0.10; p.hipL[2] = -0.10; p.knL[0] = 0.40; p.ankL[0] = -0.10;
    p.hipR[0] = 0.22; p.hipR[1] = -0.18; p.hipR[2] = 0.12; p.knR[0] = 0.32; p.ankR[0] = -0.16;
    return { yaw: 0.52, drop: -0.055, pitch: 0.04 };
  };

  const charge = (p, c) => {
    const ramp = Math.min(1, c.stateT * 3.2);
    p.hips[0] = 0.10 * ramp;
    p.spineA[0] = -0.34 * ramp; p.chest[0] = 0.14 * ramp;
    p.neck[0] = 0.22 * ramp; p.head[0] = -0.16 * ramp;
    p.shL[0] = 0.62 * ramp; p.shL[2] = -0.44 * ramp; p.elL[0] = -1.24 * ramp; p.elL[1] = -0.36;
    p.shR[0] = 0.62 * ramp; p.shR[2] = 0.44 * ramp; p.elR[0] = -1.24 * ramp; p.elR[1] = 0.36;
    p.hipL[0] = -0.16; p.hipL[2] = -0.30 * ramp; p.knL[0] = 0.62 * ramp; p.ankL[0] = -0.28 * ramp;
    p.hipR[0] = 0.10; p.hipR[2] = 0.30 * ramp; p.knR[0] = 0.58 * ramp; p.ankR[0] = -0.26 * ramp;
    return { yaw: 0.30, drop: -0.11 * ramp, pitch: 0.10 * ramp };
  };

  const hurt = (p, c) => {
    const d = Math.exp(-c.hurtT * 4.4);
    p.hips[0] = 0.16 * d;
    p.spineA[0] = 0.34 * d; p.chest[0] = 0.22 * d;
    p.neck[0] = -0.48 * d; p.head[0] = -0.30 * d;
    p.shL[0] = -0.30 - 0.55 * d; p.shL[2] = -0.30 - 0.85 * d; p.elL[0] = -0.55 - 0.5 * d;
    p.shR[0] = -0.26 - 0.50 * d; p.shR[2] = 0.30 + 0.85 * d; p.elR[0] = -0.50 - 0.5 * d;
    p.hipL[0] = -0.28 * d - 0.05; p.knL[0] = 0.28 + 0.20 * d;
    p.hipR[0] = 0.40 * d; p.knR[0] = 0.24 + 0.34 * d;
    p.ankR[0] = -0.24 * d;
    return { yaw: 0.20, drop: -0.06 * d, pitch: -0.18 * d, push: -0.10 * d };
  };

  const faint = (p, c) => {
    if (!c.laid) {
      // collapsed to the knees — used if something sets faint without laying
      // the root over.
      p.spineA[0] = -0.55; p.chest[0] = 0.30; p.neck[0] = 0.55; p.head[0] = 0.30;
      p.shL[0] = 0.30; p.shL[2] = -0.24; p.elL[0] = -0.35;
      p.shR[0] = 0.30; p.shR[2] = 0.24; p.elR[0] = -0.35;
      p.hipL[0] = -1.35; p.knL[0] = 2.30; p.hipR[0] = -1.30; p.knR[0] = 2.35;
      return { yaw: 0.20, drop: -0.42, pitch: 0.30 };
    }
    const set = Math.min(1, c.stateT * 2.2);
    p.hips[0] = -0.10; p.hips[2] = 0.06;
    p.spineA[0] = 0.10; p.chest[0] = 0.06; p.chest[1] = 0.16;
    p.neck[0] = -0.16; p.head[1] = 0.55 * set; p.head[0] = -0.20;
    p.shL[0] = -0.20; p.shL[2] = -1.05 * set; p.elL[0] = -0.55; p.elL[1] = -0.5;
    p.shR[0] = -0.16; p.shR[2] = 1.15 * set; p.elR[0] = -0.35; p.elR[1] = 0.4;
    p.hipL[0] = -0.30; p.hipL[2] = -0.30 * set; p.knL[0] = 0.62;
    p.hipR[0] = -0.10; p.hipR[2] = 0.42 * set; p.knR[0] = 0.28;
    p.ankL[0] = 0.30; p.ankR[0] = 0.24;
    return { roll: 0 };
  };

  const win = (p, c) => {
    const bob = Math.sin(c.t * 2.4) * 0.5 + 0.5;
    p.spineA[0] = -0.12; p.chest[0] = -0.10; p.neck[0] = -0.14; p.head[0] = -0.16;
    if (winStyle === 'weapon') {
      p.shR[0] = -2.55 - bob * 0.10; p.shR[2] = 0.34; p.elR[0] = -0.28;
      p.shL[0] = -0.24; p.shL[2] = -0.50; p.elL[0] = -1.10;
    } else if (winStyle === 'arms') {
      p.shL[0] = -1.16; p.shL[1] = 0.30; p.shL[2] = -0.62; p.elL[0] = -1.75; p.elL[1] = -0.30;
      p.shR[0] = -1.10; p.shR[1] = -0.30; p.shR[2] = 0.62; p.elR[0] = -1.90; p.elR[1] = 0.30;
      p.head[2] = 0.14;
    } else if (winStyle === 'fist') {
      p.shR[0] = -2.75 - bob * 0.16; p.shR[2] = 0.22; p.elR[0] = -0.18;
      p.shL[0] = -0.30; p.shL[2] = -0.44; p.elL[0] = -1.35;
    } else {
      p.shR[0] = -1.62; p.shR[1] = -0.5; p.shR[2] = 0.30; p.elR[0] = -0.20;
      p.shL[0] = -0.20; p.shL[2] = -0.40; p.elL[0] = -0.90;
    }
    p.hipL[0] = -0.24; p.hipL[2] = -0.14; p.knL[0] = 0.22;
    p.hipR[0] = 0.16; p.hipR[2] = 0.16; p.knR[0] = 0.14;
    return { yaw: 0.28, drop: -0.02 + bob * 0.030, pitch: -0.05 };
  };

  void b;
  return { idle, ready, charge, hurt, faint, win };
}

/* ══════════════════════════════════════════════════════════════════════════
   7. HELPERS
   ══════════════════════════════════════════════════════════════════════════ */

const HAIR_KEYS = new Set(['long_hair', 'spiky_hair', 'messy_hair', 'ponytail', 'twin_tails',
  'topknot', 'bald', 'buzz', 'bob_hair', 'short_hair', 'dreads', 'mane', 'dragon_mane', 'afro']);
const GARMENT_KEYS = new Set(['shirtless', 'open_shirtless', 'bare_chest', 'open_vest', 'vest',
  'suit', 'kimono', 'shirt', 'jacket', 'armor', 'plate_armor', 'school_uniform', 'hoodie', 'robes']);

function pickHair(sil, buildKey, rnd) {
  if (sil.has('bald')) return 'bald';
  if (sil.has('buzz')) return 'buzz';
  if (sil.has('long_hair')) return 'long';
  if (sil.has('bob_hair')) return 'bob';
  if (sil.has('ponytail')) return 'ponytail';
  if (sil.has('twin_tails')) return 'twin';
  if (sil.has('topknot')) return 'topknot';
  if (sil.has('dreads')) return 'dreads';
  if (sil.has('afro')) return 'messy';
  if (sil.has('mane') || sil.has('dragon_mane')) return 'mane';
  if (sil.has('spiky_hair')) return 'spiky';
  if (sil.has('messy_hair') || sil.has('short_hair')) return 'messy';
  // Hats read better over a compact head, and lithe builds default to long hair.
  if (sil.has('wide_hat') || sil.has('spotted_hat') || sil.has('fur_hat') || sil.has('mask')) return 'messy';
  if (buildKey === 'lithe') return rnd() < 0.6 ? 'long' : 'ponytail';
  return rnd() < 0.55 ? 'spiky' : 'messy';
}

function pickGarment(sil, buildKey, rnd) {
  if (sil.has('shirtless') || sil.has('open_shirtless') || sil.has('bare_chest')) return 'bare';
  if (sil.has('suit') || sil.has('school_uniform')) return 'suit';
  if (sil.has('kimono') || sil.has('robes')) return 'kimono';
  if (sil.has('armor') || sil.has('plate_armor')) return 'armor';
  if (sil.has('open_vest') || sil.has('vest')) return 'vest';
  if (sil.has('jacket') || sil.has('hoodie') || sil.has('long_coat') || sil.has('tall_coat') || sil.has('coat')) return 'jacket';
  if (sil.has('shirt')) return 'shirt';
  void buildKey; void rnd;
  return 'shirt';
}

function col(hex) { return new THREE.Color(hex); }

function hashStr(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
function mulberry(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Averaged normals per welded position — closes the inverted hull on boxes. */
function smoothNormals(g) {
  const pos = g.attributes.position, nrm = g.attributes.normal;
  const n = pos.count;
  const map = new Map();
  const keys = new Array(n);
  for (let i = 0; i < n; i++) {
    const k = `${Math.round(pos.getX(i) * 8192)},${Math.round(pos.getY(i) * 8192)},${Math.round(pos.getZ(i) * 8192)}`;
    keys[i] = k;
    let a = map.get(k);
    if (!a) { a = [0, 0, 0]; map.set(k, a); }
    a[0] += nrm.getX(i); a[1] += nrm.getY(i); a[2] += nrm.getZ(i);
  }
  const out = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    const a = map.get(keys[i]);
    const l = Math.hypot(a[0], a[1], a[2]) || 1;
    out[i * 3] = a[0] / l; out[i * 3 + 1] = a[1] / l; out[i * 3 + 2] = a[2] / l;
  }
  g.setAttribute('aOutNormal', new THREE.BufferAttribute(out, 3));
}

/**
 * Reads the arena's own lights so the cel ramp stays in key with the stage.
 * Nothing here mutates the scene — it only samples it.
 */
function sampleEnv(root, mat, env) {
  let scene = root;
  while (scene.parent) scene = scene.parent;
  if (!scene.isScene) return;
  let key = null, fill = null;
  const amb = new THREE.Color(0, 0, 0);
  scene.traverse((o) => {
    if (o.isDirectionalLight) {
      if (!key || o.intensity > key.intensity) { fill = key; key = o; }
      else if (!fill || o.intensity > fill.intensity) fill = o;
    } else if (o.isAmbientLight) {
      amb.add(_tmpC.copy(o.color).multiplyScalar(o.intensity * 0.55));
    } else if (o.isHemisphereLight) {
      amb.add(_tmpC.copy(o.color).multiplyScalar(o.intensity * 0.34));
      amb.add(_tmpC.copy(o.groundColor).multiplyScalar(o.intensity * 0.20));
    }
  });
  const u = mat.uniforms;
  if (key) {
    key.getWorldPosition(_v);
    if (key.target) { const tp = new THREE.Vector3(); key.target.getWorldPosition(tp); _v.sub(tp); }
    env.dir.copy(_v).normalize();
    u.uLightDir.value.copy(env.dir);
    const i = clamp(key.intensity * 0.42, 0.55, 1.25);
    u.uLightCol.value.copy(key.color).multiplyScalar(0.72 + i * 0.42);
  }
  // Shadow band: never a flat black multiply — pull it toward the ambient hue.
  const sc = u.uShadowCol.value;
  sc.setRGB(0.34, 0.36, 0.46).add(amb.multiplyScalar(0.72));
  sc.r = clamp(sc.r, 0.24, 0.82); sc.g = clamp(sc.g, 0.24, 0.82); sc.b = clamp(sc.b, 0.28, 0.9);
  if (fill) {
    u.uRimCol.value.copy(fill.color).lerp(_tmpC.setRGB(1, 1, 1), 0.35).multiplyScalar(clamp(fill.intensity * 0.5, 0.4, 1.2));
  }
  u.uBounce.value.setRGB(0.07, 0.075, 0.10).add(_tmpC.copy(u.uShadowCol.value).multiplyScalar(0.10));
}
const _tmpC = new THREE.Color();
