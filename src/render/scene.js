// Renderer, arena stage, sky dome, lighting rig, sea, weather, terrain, post.
//
// Owned by the arena & lighting agent. `src/data/arenas.js` is the score; this
// file is the orchestra. Read the header of that file first — every knob under
// `dome`, `light`, `palette`, `sea`, `deco` and `props` is consumed here.
//
// Design notes for anyone reading this later:
//
//  * **Draw calls are the budget, not triangles.** Every arena collapses to a
//    handful of meshes: one merged lit solid, one merged self-lit solid, one
//    merged additive glow, one instanced crowd, one wavy-cloth mesh, one line
//    mesh for rigging, plus sky / sea / floor / overlay. A phone renders an
//    arena in ~20 calls, and the props builders can be as chatty as they like
//    because `Mesher` folds everything into a single buffer.
//
//  * **The fighters do not use scene lights.** `render/fighterModel.js` runs its
//    own cel shader and *samples* the scene: strongest DirectionalLight becomes
//    its key (direction + colour), second strongest becomes its fresnel rim
//    colour, ambient + hemisphere set the floor of its shadow band. So the rig
//    below is built with an invariant: `key.intensity > rim.intensity >
//    everything else`. Break that and the cel key snaps to the camera-relative
//    rim and every fighter goes dark. `_addLight` enforces it at runtime.
//
//  * **The eye light is the black-fighter insurance.** A tiny camera-locked
//    directional, re-aimed every frame, so a surface pointed at the lens always
//    receives something. It is deliberately weak (0.14–0.24) — it is a floor,
//    not a look.
//
//  * **Weather and terrain are stage-level, not arena-level.** They are built
//    once, live outside `arenaGroup`, and survive `buildArena`. Each carries an
//    `amt` that crossfades, so switching states never pops.

import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { SMAAPass } from 'three/addons/postprocessing/SMAAPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { FXAAShader } from 'three/addons/shaders/FXAAShader.js';
import { getArena } from '../data/arenas.js';
import { Feel } from './feel.js';

const TAU = Math.PI * 2;
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const lerp = (a, b, t) => a + (b - a) * t;

/* ══════════════════════════════════════════════════════════════════════════
   1. GEOMETRY KIT — every prop is one of these, transformed and merged.
   ══════════════════════════════════════════════════════════════════════════ */

const _m4 = new THREE.Matrix4();
const _eu = new THREE.Euler();
const _qt = new THREE.Quaternion();
const _v3 = new THREE.Vector3();
const _s3 = new THREE.Vector3();
const _col = new THREE.Color();

/** Unit primitives, authored once. Everything else is a transform of these. */
const G = {};
function kit() {
  if (G.box) return G;
  const strip = (g) => { const n = g.toNonIndexed(); g.dispose(); n.deleteAttribute('uv'); return n; };
  G.box = strip(new THREE.BoxGeometry(1, 1, 1));
  G.cyl4 = strip(new THREE.CylinderGeometry(0.5, 0.5, 1, 4));
  G.cyl6 = strip(new THREE.CylinderGeometry(0.5, 0.5, 1, 6));
  G.cyl8 = strip(new THREE.CylinderGeometry(0.5, 0.5, 1, 8));
  G.cyl12 = strip(new THREE.CylinderGeometry(0.5, 0.5, 1, 12));
  G.cone4 = strip(new THREE.ConeGeometry(0.5, 1, 4));
  G.cone6 = strip(new THREE.ConeGeometry(0.5, 1, 6));
  G.cone8 = strip(new THREE.ConeGeometry(0.5, 1, 8));
  G.ico = strip(new THREE.IcosahedronGeometry(0.5, 0));
  G.ico1 = strip(new THREE.IcosahedronGeometry(0.5, 1));
  G.sph = strip(new THREE.SphereGeometry(0.5, 10, 7));
  G.plane = strip(new THREE.PlaneGeometry(1, 1, 1, 1));
  G.disc = strip(new THREE.CircleGeometry(0.5, 24));
  G.disc8 = strip(new THREE.CircleGeometry(0.5, 8));
  // A wedge: half a box sliced corner to corner. Roof planes and ramps.
  const w = new THREE.BufferGeometry();
  const P = [
    -0.5, -0.5, 0.5, 0.5, -0.5, 0.5, 0.5, 0.5, 0.5, -0.5, -0.5, -0.5, 0.5, 0.5, -0.5, 0.5, -0.5, -0.5,
    -0.5, -0.5, -0.5, -0.5, -0.5, 0.5, 0.5, 0.5, -0.5, -0.5, -0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, -0.5,
    0.5, -0.5, -0.5, 0.5, 0.5, -0.5, 0.5, -0.5, 0.5, 0.5, -0.5, 0.5, 0.5, 0.5, -0.5, 0.5, 0.5, 0.5,
    -0.5, -0.5, -0.5, 0.5, -0.5, -0.5, 0.5, -0.5, 0.5, -0.5, -0.5, -0.5, 0.5, -0.5, 0.5, -0.5, -0.5, 0.5
  ];
  w.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
  w.computeVertexNormals();
  G.wedge = w;
  return G;
}

/**
 * Collects transformed, vertex-coloured copies of the kit and folds them into
 * one buffer. A whole colosseum — wall, tiers, banners, braziers, skyline —
 * comes out as a single Mesh.
 */
class Mesher {
  constructor() { this.parts = []; this.ranges = []; this._n = 0; }
  get empty() { return this.parts.length === 0; }

  /**
   * @param {THREE.BufferGeometry} geo   one of `G`
   * @param {string|THREE.Color}   color
   * @param {object} o  {x,y,z, rx,ry,rz, s|sx,sy,sz, shade}
   *        `shade` multiplies the colour — cheap per-part value variation.
   */
  add(geo, color, o = {}) {
    const g = geo.clone();
    _eu.set(o.rx || 0, o.ry || 0, o.rz || 0);
    _qt.setFromEuler(_eu);
    const s = o.s ?? 1;
    _s3.set(o.sx ?? s, o.sy ?? s, o.sz ?? s);
    _v3.set(o.x || 0, o.y || 0, o.z || 0);
    g.applyMatrix4(_m4.compose(_v3, _qt, _s3));
    const n = g.attributes.position.count;
    const arr = new Float32Array(n * 3);
    _col.set(color);
    const k = o.shade ?? 1;
    const r = _col.r * k, gg = _col.g * k, b = _col.b * k;
    for (let i = 0; i < n; i++) { arr[i * 3] = r; arr[i * 3 + 1] = gg; arr[i * 3 + 2] = b; }
    g.setAttribute('color', new THREE.BufferAttribute(arr, 3));
    this.parts.push(g);
    this.ranges.push({ start: this._n, count: n, meta: o.meta });
    this._n += n;
    return this;
  }

  /** Ring helper: `ring(n, radius, (i, angle, x, z) => …)`. */
  static ring(n, r, fn) {
    for (let i = 0; i < n; i++) {
      const a = (i / n) * TAU;
      fn(i, a, Math.cos(a) * r, Math.sin(a) * r);
    }
  }

  geometry() {
    if (!this.parts.length) return null;
    const g = this.parts.length === 1 ? this.parts[0] : mergeGeometries(this.parts, false);
    if (this.parts.length > 1) for (const p of this.parts) p.dispose();
    this.parts.length = 0;
    g.computeBoundingSphere();
    return g;
  }

  mesh(mat) {
    const g = this.geometry();
    return g ? new THREE.Mesh(g, mat) : null;
  }
}
const ring = Mesher.ring;

/** Deterministic per-arena noise, so a reload never reshuffles the scenery. */
function rng(seed) {
  let s = seed >>> 0 || 1;
  return () => { s ^= s << 13; s >>>= 0; s ^= s >> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; };
}
function hashStr(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

/* ══════════════════════════════════════════════════════════════════════════
   2. SHADER PARTS
   ══════════════════════════════════════════════════════════════════════════ */

const NOISE = /* glsl */`
float h21(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float n2(vec2 p){
  vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(h21(i), h21(i + vec2(1,0)), f.x), mix(h21(i + vec2(0,1)), h21(i + vec2(1,1)), f.x), f.y);
}
float fbm(vec2 p){ float a = 0.5, s = 0.0; for(int i = 0; i < 5; i++){ s += a * n2(p); p *= 2.03; a *= 0.5; } return s; }
`;

/* ---------------- sky dome ---------------- */

const SKY_VERT = /* glsl */`
varying vec3 vD;
void main(){ vD = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;

const SKY_FRAG = /* glsl */`
uniform vec3 uTop, uBot, uBelow, uFogC, uSunC, uMoonC, uCloudC, uSunDir, uMoonDir;
uniform float uSunSize, uHalo, uClouds, uCloudY, uStars, uMoon, uT, uHaze, uDark, uSat;
varying vec3 vD;
${NOISE}
void main(){
  vec3 d = normalize(vD);
  float h = d.y;
  vec3 up = mix(uBot, uTop, pow(max(h, 0.0), 0.55));
  vec3 dn = mix(uBot, uBelow, smoothstep(0.0, -0.30, h));
  vec3 col = h > 0.0 ? up : dn;

  // clouds — a plane of fbm projected onto the dome, drifting
  if (uClouds > 0.003) {
    float hh = max(h - uCloudY, 0.0);
    vec2 cp = d.xz / (hh + 0.09) * 0.5;
    float t = uT * 0.010;
    float f = fbm(cp + vec2(t, t * 0.55)) * 0.72 + fbm(cp * 2.13 + vec2(-t * 1.6, t * 0.4)) * 0.42;
    float m = smoothstep(0.98 - uClouds * 0.72, 1.24 - uClouds * 0.60, f);
    m *= smoothstep(uCloudY - 0.01, uCloudY + 0.16, h);
    float lit = clamp(dot(d, uSunDir) * 0.5 + 0.5, 0.0, 1.0);
    col = mix(col, mix(uCloudC * 0.60, uCloudC * 1.10, lit), m * 0.94);
  }

  // stars — hashed cells, only where the sky is open
  if (uStars > 0.003 && h > 0.0) {
    vec2 sp = d.xz / (abs(d.y) + 0.22) * 22.0;
    vec2 gi = floor(sp);
    vec2 cp = gi + vec2(h21(gi + 1.3), h21(gi + 2.7));
    float st = smoothstep(0.40, 0.0, length(sp - cp)) * step(0.80, h21(gi));
    st *= 0.45 + 0.55 * sin(uT * 1.8 + h21(gi + 7.7) * 60.0);
    col += vec3(0.86, 0.92, 1.0) * st * uStars * smoothstep(0.0, 0.30, h) * 1.6;
  }

  // moon
  if (uMoon > 0.003) {
    float md = dot(d, uMoonDir);
    float ma = acos(clamp(md, -1.0, 1.0));
    float disc = 1.0 - smoothstep(uMoon * 0.94, uMoon * 1.03, ma);
    col += uMoonC * (exp(-ma * 3.0) * 0.35 + pow(max(md, 0.0), 90.0) * 0.5);
    col = mix(col, uMoonC * (1.5 + fbm(d.xz * 26.0 + 4.0) * 0.55), disc);
  }

  // sun disc + halo. The disc is pushed well over 1.0 so bloom catches it.
  if (uSunSize > 0.0005) {
    float sd = max(dot(d, uSunDir), 0.0);
    float sa = acos(clamp(dot(d, uSunDir), -1.0, 1.0));
    col += uSunC * uHalo * (pow(sd, 40.0 + 700.0 * uSunSize) * 0.85 + pow(sd, 5.0) * 0.14);
    col = mix(col, uSunC * 3.2, 1.0 - smoothstep(uSunSize * 0.82, uSunSize * 1.12, sa));
  }

  // the horizon dissolves into the fog so props never end on a hard line
  col = mix(col, uFogC, exp(-abs(h) * 6.5) * uHaze);
  col = mix(col, vec3(dot(col, vec3(0.3, 0.59, 0.11))), uSat);
  col *= uDark;

  gl_FragColor = vec4(col, 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`;

/* ---------------- sea ---------------- */

const SEA_VERT = /* glsl */`
#include <common>
#include <fog_pars_vertex>
uniform float uT, uWaveH, uWaveS, uFrozen;
varying vec3 vW;
varying vec3 vN;
varying float vCrest;
void main(){
  vec3 p = position;
  float t = uT * uWaveS;
  float h = 0.0; vec2 g = vec2(0.0);
  if (uFrozen < 0.5) {
    h += sin(p.x * 0.21 + t * 1.15) * 0.55;  g.x += 0.21 * cos(p.x * 0.21 + t * 1.15) * 0.55;
    h += sin(p.z * 0.29 - t * 0.90) * 0.38;  g.y += -0.29 * cos(p.z * 0.29 - t * 0.90) * 0.38;
    float a = p.x * 0.13 + p.z * 0.17 + t * 1.6;
    h += sin(a) * 0.30; g.x += 0.13 * cos(a) * 0.30; g.y += 0.17 * cos(a) * 0.30;
    float b = p.x * 0.62 - p.z * 0.44 + t * 2.6;
    h += sin(b) * 0.09; g.x += 0.62 * cos(b) * 0.09; g.y += -0.44 * cos(b) * 0.09;
  }
  h *= uWaveH; g *= uWaveH;
  p.y += h;
  vCrest = clamp(h / max(uWaveH, 0.001) * 0.7 + 0.35, 0.0, 1.0);
  vN = normalize(vec3(-g.x, 1.0, -g.y));
  vec4 wp = modelMatrix * vec4(p, 1.0);
  vW = wp.xyz;
  vec4 mvPosition = viewMatrix * wp;
  #include <fog_vertex>
  gl_Position = projectionMatrix * mvPosition;
}`;

const SEA_FRAG = /* glsl */`
uniform vec3 uShallow, uDeep, uFoam, uKeyDir, uKeyCol, uSkyCol;
uniform float uT, uFrozen, uFoamR, uWaveH, uSat, uDark;
varying vec3 vW;
varying vec3 vN;
varying float vCrest;
${NOISE}
#include <common>
#include <fog_pars_fragment>
void main(){
  vec3 N = normalize(vN);
  vec3 V = normalize(cameraPosition - vW);
  float fres = pow(1.0 - max(dot(N, V), 0.0), 3.0);
  float ndl = max(dot(N, normalize(uKeyDir)), 0.0);

  vec3 col = mix(uDeep, uShallow, clamp(vCrest * 0.8 + fres * 0.7, 0.0, 1.0));
  col = mix(col, uSkyCol, fres * 0.45);
  col *= 0.72 + ndl * 0.5;

  if (uFrozen > 0.5) {
    // frozen: flat plates with cracks between them, and a hard sky sheen
    float c = fbm(vW.xz * 0.085);
    float crack = smoothstep(0.50, 0.47, abs(fract(c * 6.0) - 0.5) * 2.0 - 0.62);
    col = mix(col, uDeep * 0.72, crack * 0.55);
    col += uFoam * smoothstep(0.55, 0.95, fbm(vW.xz * 0.22)) * 0.10;
    col = mix(col, uSkyCol, 0.16);
  } else {
    // crest foam + a churn ring where the sea meets the stage
    float n = fbm(vW.xz * 0.35 + vec2(uT * 0.12, -uT * 0.09));
    float crest = smoothstep(0.72, 0.98, vCrest * 0.55 + n * 0.62);
    float shore = 1.0 - smoothstep(uFoamR, uFoamR + 3.4, length(vW.xz));
    shore *= 0.35 + 0.65 * n;
    col = mix(col, uFoam, clamp(crest * 0.75 + shore * 0.55, 0.0, 1.0));
    vec3 H = normalize(normalize(uKeyDir) + V);
    col += uKeyCol * pow(max(dot(N, H), 0.0), 90.0) * 1.1;
  }
  col *= uKeyCol * 0.35 + vec3(0.72);
  col = mix(col, vec3(dot(col, vec3(0.3, 0.59, 0.11))), uSat);
  col *= uDark;

  gl_FragColor = vec4(col, 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
  #include <fog_fragment>
}`;

/* ---------------- ground overlay: terrain + weather deposits ---------------- */

const FX_FRAG = /* glsl */`
uniform float uT, uR;
uniform float uBlade, uEmber, uPsy, uHaki, uWet, uSnow, uSand;
uniform vec3 uEmberC, uPsyC, uHakiC, uBladeC, uSnowC, uSandC;
varying vec2 vP;
${NOISE}
void main(){
  float r = length(vP);
  float edge = 1.0 - smoothstep(uR * 0.62, uR, r);
  vec3 col = vec3(0.0);
  float a = 0.0;

  if (uBlade > 0.001) {
    float g = max(abs(fract(vP.x * 0.9 + vP.y * 0.35) - 0.5), abs(fract(vP.y * 0.9 - vP.x * 0.35) - 0.5));
    float sh = smoothstep(0.42, 0.49, g) * (0.4 + 0.6 * n2(vP * 3.1));
    col += uBladeC * sh * 1.5; a = max(a, sh * 0.75 * uBlade);
  }
  if (uEmber > 0.001) {
    float c = fbm(vP * 0.42);
    float crack = smoothstep(0.055, 0.0, abs(fract(c * 5.0) - 0.5) * 2.0 - 0.90);
    float pulse = 0.55 + 0.45 * sin(uT * 2.4 + c * 22.0);
    col += uEmberC * crack * (1.4 + pulse * 1.9); a = max(a, crack * 0.95 * uEmber);
  }
  if (uPsy > 0.001) {
    vec2 q = vec2(vP.x * 1.155, vP.y + mod(floor(vP.x * 1.155), 2.0) * 0.5);
    vec2 f = abs(fract(q) - 0.5);
    float hex = smoothstep(0.46, 0.50, max(f.x, f.y));
    float w = 0.5 + 0.5 * sin(uT * 1.7 - r * 0.9);
    col += uPsyC * hex * (0.9 + w * 1.5); a = max(a, hex * 0.8 * uPsy);
  }
  if (uHaki > 0.001) {
    float rings = sin(r * 2.1 - uT * 1.5);
    float band = smoothstep(0.72, 0.99, rings);
    col += uHakiC * (band * 1.7 + 0.10);
    a = max(a, (band * 0.7 + 0.30) * uHaki);
  }
  if (uWet > 0.001) {
    // rain: darkens the deck, then rings expand out of random cells
    a = max(a, 0.30 * uWet);
    vec2 gi = floor(vP * 1.4);
    float ph = h21(gi);
    float lt = fract(uT * 0.9 + ph);
    float rr = length(fract(vP * 1.4) - 0.5) * 2.0;
    float rp = smoothstep(0.06, 0.0, abs(rr - lt)) * (1.0 - lt);
    col += vec3(0.55, 0.66, 0.78) * rp * 0.9 * uWet;
    a = max(a, rp * 0.55 * uWet);
  }
  if (uSnow > 0.001) {
    float d = smoothstep(0.35, 0.85, fbm(vP * 0.6));
    col += uSnowC * (0.55 + d * 0.6); a = max(a, (0.30 + d * 0.55) * uSnow);
  }
  if (uSand > 0.001) {
    float d = fbm(vP * 0.5 + vec2(uT * 0.10, uT * 0.04));
    float st = smoothstep(0.42, 0.78, d);
    col += uSandC * (0.4 + st * 0.7); a = max(a, (0.22 + st * 0.5) * uSand);
  }

  a *= edge;
  if (a < 0.002) discard;
  gl_FragColor = vec4(col, a);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`;

const FX_VERT = /* glsl */`
varying vec2 vP;
void main(){ vP = position.xy; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;

/* ---------------- particle fields ---------------- */
// One shared wrap: the field is a box centred on the camera, and every particle
// is re-wrapped into it each frame in the shader. No CPU work, one draw call.

const WRAP = /* glsl */`
uniform vec3 uCam; uniform float uT, uBox, uH, uFall, uWindX, uWindZ;
vec3 wrapped(vec3 base){
  float bx = uBox, by = uH;
  vec3 o = vec3(uCam.x - bx * 0.5, uCam.y - by * 0.55, uCam.z - bx * 0.5);
  vec3 p;
  p.x = mod(base.x + uT * uWindX - o.x, bx) + o.x;
  p.y = mod(base.y - uT * uFall     - o.y, by) + o.y;
  p.z = mod(base.z + uT * uWindZ - o.z, bx) + o.z;
  return p;
}`;

const STREAK_VERT = /* glsl */`
attribute vec3 aOff;
uniform float uFade;
varying float vA;
${WRAP}
void main(){
  vec3 p = wrapped(position) + aOff;
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  vA = uFade * smoothstep(90.0, 12.0, -mv.z);
  gl_Position = projectionMatrix * mv;
}`;

const STREAK_FRAG = /* glsl */`
uniform vec3 uColor; uniform float uAlpha;
varying float vA;
void main(){
  gl_FragColor = vec4(uColor, vA * uAlpha);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`;

const MOTE_VERT = /* glsl */`
attribute float aSize;
uniform float uFade, uPx;
varying float vA;
${WRAP}
void main(){
  vec3 p = wrapped(position);
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  vA = uFade * smoothstep(110.0, 6.0, -mv.z);
  gl_PointSize = max(1.0, aSize * uPx / max(1.0, -mv.z));
  gl_Position = projectionMatrix * mv;
}`;

const MOTE_FRAG = /* glsl */`
uniform vec3 uColor; uniform float uAlpha, uSoft;
varying float vA;
void main(){
  float d = length(gl_PointCoord - 0.5) * 2.0;
  float a = mix(step(d, 1.0), smoothstep(1.0, 0.0, d), uSoft);
  if (a <= 0.01) discard;
  gl_FragColor = vec4(uColor, a * vA * uAlpha);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`;

/* ══════════════════════════════════════════════════════════════════════════
   3. MATERIAL FACTORIES
   ══════════════════════════════════════════════════════════════════════════ */

/**
 * A lit, shadow-receiving material whose albedo is a procedural pattern.
 * Built on MeshLambertMaterial so it keeps three's shadows and fog for free;
 * `onBeforeCompile` only replaces the albedo.
 */
function patternMat(key, colors, snippet, extra = {}) {
  const m = new THREE.MeshLambertMaterial({ color: 0xffffff, ...extra });
  const u = {
    uT: { value: 0 },
    uC1: { value: new THREE.Color(colors[0]) },
    uC2: { value: new THREE.Color(colors[1]) },
    uC3: { value: new THREE.Color(colors[2]) }
  };
  m.userData.u = u;
  m.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, u);
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vLP;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\n  vLP = transformed;');
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>',
        `#include <common>\nvarying vec3 vLP;\nuniform float uT;\nuniform vec3 uC1, uC2, uC3;\n${NOISE}`)
      .replace('#include <color_fragment>', `#include <color_fragment>\n{\n${snippet}\n}`);
  };
  m.customProgramCacheKey = () => 'gla-ground-' + key;
  return m;
}

const GROUND_PATTERN = {
  // raked sand, scuffed to hell in the middle, with a painted duel ring
  colosseum: `
    vec2 p = vLP.xz;
    float r = length(p);
    float rake = 0.5 + 0.5 * sin(r * 5.5 + fbm(p * 0.30) * 3.4);
    vec3 c = mix(uC2, uC1, 0.42 + rake * 0.34);
    c = mix(c, uC2, smoothstep(0.55, 0.95, fbm(p * 0.9)) * 0.45);
    c = mix(c, uC2 * 0.86, (1.0 - smoothstep(3.0, 9.0, r)) * 0.30);
    float band = smoothstep(0.16, 0.05, abs(r - 8.45));
    c = mix(c, uC3, band * 0.55);
    diffuseColor.rgb *= c;`,
  // big marble flagstones with grout and battle cracks
  plaza: `
    vec2 p = vLP.xz;
    vec2 g = abs(fract(p / 2.6) - 0.5);
    float grout = smoothstep(0.44, 0.50, max(g.x, g.y));
    float tone = n2(floor(p / 2.6) + 0.5);
    vec3 c = mix(uC1, uC1 * 0.90, tone);
    c = mix(c, uC2, grout * 0.75);
    float crack = smoothstep(0.030, 0.0, abs(fbm(p * 0.32) - 0.5) - 0.02);
    c = mix(c, uC2 * 0.70, crack * 0.6);
    c = mix(c, uC3, smoothstep(0.14, 0.03, abs(length(p) - 8.45)) * 0.45);
    diffuseColor.rgb *= c;`,
  // the Sunny's lawn deck: grass in the middle, caulked planks around it
  ship: `
    vec2 p = vLP.xz;
    float r = length(p);
    float plank = smoothstep(0.42, 0.48, abs(fract(p.z * 0.85) - 0.5));
    float grain = 0.85 + 0.3 * n2(vec2(p.x * 2.2, p.z * 22.0));
    vec3 wood = mix(uC1, uC2, plank * 0.8) * grain;
    vec3 grass = mix(uC3, uC3 * 0.72, smoothstep(0.35, 0.8, fbm(p * 1.5)));
    float lawn = 1.0 - smoothstep(6.7, 7.1, r);
    vec3 c = mix(wood, grass, lawn);
    c = mix(c, uC1 * 1.12, smoothstep(0.16, 0.04, abs(r - 7.0)));
    diffuseColor.rgb *= c;`,
  // kawara tiles: overlapping half-round rows
  rooftop: `
    vec2 p = vLP.xz;
    float row = fract(p.z * 1.05);
    float rid = fract(p.x * 1.6);
    float bump = sin(rid * 3.14159);
    vec3 c = mix(uC2, uC1, 0.35 + bump * 0.62);
    c *= 0.86 + 0.22 * smoothstep(0.0, 0.25, row);
    c = mix(c, uC2 * 0.7, smoothstep(0.90, 1.0, row));
    c = mix(c, uC3, smoothstep(0.12, 0.02, abs(length(p) - 8.45)) * 0.40);
    diffuseColor.rgb *= c * (0.92 + 0.14 * n2(p * 3.0));`,
  // packed cloud: soft lobes with bright rims
  clouds: `
    vec2 p = vLP.xz;
    float f = fbm(p * 0.42);
    float f2 = fbm(p * 1.10 + 9.0);
    vec3 c = mix(uC2, uC1, smoothstep(0.30, 0.75, f * 0.7 + f2 * 0.45));
    c += uC1 * smoothstep(0.62, 0.80, f) * 0.20;
    c = mix(c, uC3, smoothstep(0.20, 0.04, abs(length(p) - 8.45)) * 0.40);
    diffuseColor.rgb *= c;`,
  // scrubbed restaurant decking, planks running across the frame
  restaurant: `
    vec2 p = vLP.xz;
    float plank = smoothstep(0.40, 0.47, abs(fract(p.x * 0.62) - 0.5));
    float board = n2(vec2(floor(p.x * 0.62), 0.5));
    float grain = 0.86 + 0.28 * n2(vec2(p.x * 20.0, p.z * 1.6));
    vec3 c = mix(uC1 * (0.88 + board * 0.24), uC2, plank * 0.85) * grain;
    c = mix(c, uC3, smoothstep(0.14, 0.03, abs(length(p) - 8.45)) * 0.42);
    diffuseColor.rgb *= c;`
};

/** Cloth: banners, sails, tablecloths. Waves from `aWave`, phased by `aSeed`. */
function clothMat() {
  const m = new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide });
  const u = { uT: { value: 0 } };
  m.userData.u = u;
  m.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, u);
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nuniform float uT;\nattribute float aWave;\nattribute float aSeed;')
      .replace('#include <begin_vertex>', `#include <begin_vertex>
        float ph = uT * 2.3 + aSeed * 6.2831 + transformed.y * 1.1 + transformed.x * 0.5;
        transformed.z += sin(ph) * aWave;
        transformed.x += cos(ph * 0.7) * aWave * 0.45;
        transformed.y -= abs(sin(ph)) * aWave * 0.18;`);
  };
  m.customProgramCacheKey = () => 'gla-cloth';
  return m;
}

/** Crowd: instanced, per-instance colour, bobbing on its own phase. */
function crowdMat() {
  const m = new THREE.MeshLambertMaterial({ vertexColors: true });
  const u = { uT: { value: 0 }, uRoar: { value: 0 } };
  m.userData.u = u;
  m.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, u);
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nuniform float uT;\nuniform float uRoar;\nattribute float aSeed;')
      .replace('#include <begin_vertex>', `#include <begin_vertex>
        float ph = uT * (1.7 + aSeed * 1.1) + aSeed * 31.0;
        transformed.y += (0.055 + uRoar * 0.20) * (0.5 + 0.5 * sin(ph));
        transformed.x += sin(ph * 0.53) * 0.035;`);
  };
  m.customProgramCacheKey = () => 'gla-crowd';
  return m;
}

/** Flyers: each bird orbits the stage on its own radius, flapping. */
function flockMat() {
  const m = new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide });
  const u = { uT: { value: 0 } };
  m.userData.u = u;
  m.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, u);
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nuniform float uT;\nattribute float aSeed;\nattribute float aWave;')
      .replace('#include <begin_vertex>', `#include <begin_vertex>
        transformed.y += sin(uT * (5.0 + aSeed * 3.0) + aSeed * 20.0) * aWave;
        float a = uT * (0.11 + aSeed * 0.10) + aSeed * 6.2831;
        float ca = cos(a), sa = sin(a);
        transformed.xz = vec2(transformed.x * ca - transformed.z * sa, transformed.x * sa + transformed.z * ca);
        transformed.y += sin(uT * 0.7 + aSeed * 9.0) * 0.6;`);
  };
  m.customProgramCacheKey = () => 'gla-flock';
  return m;
}

/**
 * Attach `aSeed` (per part) and `aWave` (per vertex) using the Mesher's part
 * ranges, so each banner/sail/bird animates on its own phase.
 * `meta` per part: `{ seed, amp, top, span }`.
 */
function tagParts(geo, ranges, waveOf) {
  const pos = geo.attributes.position;
  const n = pos.count;
  const seed = new Float32Array(n);
  const wave = new Float32Array(n);
  for (const r of ranges) {
    const m = r.meta || {};
    for (let i = r.start; i < r.start + r.count && i < n; i++) {
      seed[i] = m.seed || 0;
      wave[i] = waveOf(pos.getX(i), pos.getY(i), pos.getZ(i), m);
    }
  }
  geo.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1));
  geo.setAttribute('aWave', new THREE.BufferAttribute(wave, 1));
  return geo;
}

/** Cloth hangs from `meta.top` and swings harder the further down you go. */
const CLOTH_WAVE = (x, y, z, m) => {
  const t = clamp(((m.top ?? 0) - y) / Math.max(0.001, m.span ?? 1), 0, 1);
  return Math.pow(t, 1.5) * (m.amp ?? 0.18);
};
/** Wings flap; bodies do not. */
const WING_WAVE = (x, y, z, m) => Math.pow(clamp(Math.abs(x) / Math.max(0.001, m.span ?? 1), 0, 1), 1.4) * (m.amp ?? 0.25);

/* ══════════════════════════════════════════════════════════════════════════
   4. PROPS — one builder per `arena.props`
   ══════════════════════════════════════════════════════════════════════════ */

/** Radius of the fighting floor per props type. Everything else sits outside. */
const FLOOR_R = {
  colosseum: 14.2, plaza: 13.2, ship: 12.6, rooftop: 13.0, clouds: 13.4, restaurant: 12.8
};

/** Catenary rope / rigging, pushed as raw line segment endpoints. */
function rope(ctx, ax, ay, az, bx, by, bz, sag = 0.6, segs = 8) {
  let px = ax, py = ay, pz = az;
  for (let i = 1; i <= segs; i++) {
    const t = i / segs;
    const x = lerp(ax, bx, t), z = lerp(az, bz, t);
    const y = lerp(ay, by, t) - Math.sin(t * Math.PI) * sag;
    ctx.lines.push(px, py, pz, x, y, z);
    px = x; py = y; pz = z;
  }
}

/** A paper lantern: warm shell in the self-lit pass, halo in the additive pass. */
function lantern(ctx, x, y, z, s, body, glow) {
  ctx.L.add(G.cyl8, body, { x, y, z, s: s * 1.0, sy: s * 1.25 });
  ctx.S.add(G.box, '#2a2028', { x, y: y + s * 0.68, z, sx: s * 0.30, sy: s * 0.14, sz: s * 0.30 });
  ctx.Gl.add(G.ico, glow, { x, y, z, s: s * 3.4 });
}

/** A hip roof: slab body plus four slanted planes and a ridge. */
function hipRoof(S, x, y, z, w, d, h, tile, dark, ry = 0) {
  const c = Math.cos(ry), s = Math.sin(ry);
  const put = (lx, ly, lz, o) => S.add(o.g, o.c, {
    x: x + lx * c - lz * s, y: y + ly, z: z + lx * s + lz * c,
    ry: ry + (o.ry || 0), rx: o.rx || 0, rz: o.rz || 0,
    sx: o.sx, sy: o.sy, sz: o.sz, shade: o.shade
  });
  const pitch = Math.atan2(h, d * 0.5);
  const slope = Math.hypot(h, d * 0.5);
  put(0, -h * 0.5, 0, { g: G.box, c: dark, sx: w * 0.86, sy: h, sz: d * 0.86, shade: 0.8 });
  put(0, 0, d * 0.25, { g: G.box, c: tile, rx: -pitch, sx: w, sy: 0.16, sz: slope });
  put(0, 0, -d * 0.25, { g: G.box, c: tile, rx: pitch, sx: w, sy: 0.16, sz: slope, shade: 0.82 });
  put(0, h * 0.5, 0, { g: G.box, c: tile, sx: w * 1.02, sy: 0.22, sz: 0.3, shade: 1.12 });
  // upturned eave tips
  put(-w * 0.5, -h * 0.02, d * 0.5, { g: G.box, c: tile, rz: 0.5, sx: 0.9, sy: 0.16, sz: 0.34, shade: 1.1 });
  put(w * 0.5, -h * 0.02, d * 0.5, { g: G.box, c: tile, rz: -0.5, sx: 0.9, sy: 0.16, sz: 0.34, shade: 1.1 });
}

/* ------------------------------------------------------------------ */
/* colosseum — Corrida. Tiered stands, 340 heads, banners, braziers.   */
/* ------------------------------------------------------------------ */

function propsColosseum(ctx) {
  const { S, L, Gl, C, P, D, r } = ctx;
  const R = FLOOR_R.colosseum;
  const wallH = D.wallH ?? 6.2;

  // arena wall — chunky blocks so the inside face is lit, not culled
  ring(56, R + 0.5, (i, ang, x, z) => {
    const h = wallH + (i % 4 === 0 ? 0.5 : 0);
    S.add(G.box, i % 2 ? P.stone : P.stoneDark, {
      x, y: h * 0.5, z, ry: -ang, sx: 1.72, sy: h, sz: 1.0, shade: 0.92 + r() * 0.16
    });
  });
  ring(20, R + 0.5, (i, ang, x, z) => {           // pilasters
    S.add(G.box, P.stoneDark, { x: x * 0.985, y: wallH * 0.52, z: z * 0.985, ry: -ang, sx: 0.7, sy: wallH * 1.06, sz: 1.3 });
    S.add(G.box, P.trim, { x: x * 0.985, y: wallH * 1.05, z: z * 0.985, ry: -ang, sx: 0.95, sy: 0.34, sz: 1.5 });
  });
  // kerb the fighters can read as the ring edge
  ring(64, R - 0.35, (i, ang, x, z) => {
    S.add(G.box, P.sandDark, { x, y: 0.16, z, ry: -ang, sx: 1.45, sy: 0.34, sz: 0.7, shade: 0.95 + r() * 0.12 });
  });

  // seating tiers, rising away from the floor
  const tiers = D.tiers ?? 4;
  const crowdSlots = [];
  for (let t = 0; t < tiers; t++) {
    const rr = R + 2.0 + t * 2.35;
    const hy = wallH + 0.4 + t * 1.75;
    ring(46, rr, (i, ang, x, z) => {
      S.add(G.box, i % 2 ? P.tier : P.tierDark, {
        x, y: hy - 0.9, z, ry: -ang, sx: rr * 0.145, sy: 1.8, sz: 2.4, shade: 0.9 + r() * 0.2
      });
    });
    crowdSlots.push({ r: rr, y: hy });
  }
  // outer shell so the stands read as a building from any angle
  ring(52, R + 2.0 + tiers * 2.35 + 1.4, (i, ang, x, z) => {
    S.add(G.box, P.stoneDark, { x, y: (wallH + tiers * 1.75) * 0.5, z, ry: -ang, sx: 2.3, sy: wallH + tiers * 1.75 + 1.2, sz: 1.4, shade: 0.86 + r() * 0.2 });
  });

  // banners hanging off the wall, into the top of frame
  const nb = D.banners ?? 14;
  ring(nb, R + 0.05, (i, ang, x, z) => {
    const top = wallH - 0.35;
    C.add(G.plane, i % 3 === 0 ? P.trim : P.banner, {
      x, y: top - 1.6, z, ry: -ang + Math.PI / 2, sx: 1.5, sy: 3.2,
      meta: { seed: r(), top, span: 3.2, amp: 0.22 }
    });
  });

  // braziers just inside the wall — fire is the only moving light source here
  const nbz = D.braziers ?? 6;
  ring(nbz, R - 1.9, (i, ang, x, z) => {
    S.add(G.cyl8, P.stoneDark, { x, y: 0.9, z, s: 0.42, sy: 1.8 });
    S.add(G.cyl8, P.stone, { x, y: 1.9, z, s: 1.0, sy: 0.5 });
    L.add(G.cone6, '#ffb04a', { x, y: 2.5, z, s: 0.8, sy: 1.4 });
    Gl.add(G.ico, '#ff8a2a', { x, y: 2.5, z, s: 3.2 });
  });

  // Dressrosa beyond the bowl: towers, then hills
  for (let i = 0; i < 9; i++) {
    const ang = -0.4 + r() * TAU;
    const rr = 44 + r() * 26;
    const x = Math.cos(ang) * rr, z = Math.sin(ang) * rr;
    const h = 9 + r() * 16;
    S.add(G.box, P.stone, { x, y: h * 0.5, z, ry: r() * 3, sx: 5 + r() * 5, sy: h, sz: 5 + r() * 5, shade: 0.7 });
    S.add(G.cone6, P.banner, { x, y: h + 2.6, z, s: 6.5, sy: 6, shade: 0.75 });
  }
  for (let i = 0; i < 14; i++) {
    const ang = r() * TAU, rr = 110 + r() * 70;
    S.add(G.cone6, P.stoneDark, {
      x: Math.cos(ang) * rr, y: 4, z: Math.sin(ang) * rr, s: 40 + r() * 60, sy: 26 + r() * 26, shade: 0.62
    });
  }

  // crowd
  ctx.crowd = { slots: crowdSlots, rows: D.crowdRows ?? 5, per: D.crowdPerRow ?? 68, colors: P.crowd };
}

/* ------------------------------------------------------------------ */
/* plaza — Marineford. Pillars over a frozen bay, HQ on the skyline.   */
/* ------------------------------------------------------------------ */

function propsPlaza(ctx) {
  const { S, Gl, C, P, D, r } = ctx;
  const R = FLOOR_R.plaza;

  // the plaza is a slab standing 0.9 m out of the ice
  ring(72, R - 0.2, (i, ang, x, z) => {
    S.add(G.box, i % 3 ? P.stone : P.stoneDark, { x, y: -0.45, z, ry: -ang, sx: 1.24, sy: 1.1, sz: 1.3, shade: 0.88 + r() * 0.2 });
  });
  ring(72, R - 0.2, (i, ang, x, z) => {
    S.add(G.box, P.pillar, { x, y: 0.06, z, ry: -ang, sx: 1.26, sy: 0.14, sz: 1.5, shade: 0.95 });
  });
  // steps down to the ice on the audience side, broken slabs elsewhere
  for (let i = 0; i < 22; i++) {
    const ang = r() * TAU, rr = R + 1.2 + r() * 5;
    S.add(G.box, P.stoneDark, {
      x: Math.cos(ang) * rr, y: -0.72 + r() * 0.2, z: Math.sin(ang) * rr,
      ry: r() * 3, rz: (r() - 0.5) * 0.35, sx: 1.4 + r() * 2.2, sy: 0.3, sz: 1.2 + r() * 2, shade: 0.8
    });
  }

  // the pillar ring — the silhouette that says Marineford
  const np = D.pillars ?? 18;
  const broken = D.ruins ?? 9;
  ring(np, R + 3.4, (i, ang, x, z) => {
    const tall = i % 3 !== 1;
    const h = tall ? 10.5 + r() * 2.5 : 4.5 + r() * 2;
    S.add(G.box, P.pillarDark, { x, y: 0.35, z, ry: -ang, sx: 2.1, sy: 0.7, sz: 2.1 });
    S.add(G.cyl12, P.pillar, { x, y: h * 0.5 + 0.6, z, s: 1.35, sy: h, shade: 0.94 + r() * 0.12 });
    if (tall) {
      S.add(G.box, P.pillar, { x, y: h + 0.85, z, ry: -ang, sx: 2.2, sy: 0.5, sz: 2.2, shade: 1.08 });
      S.add(G.box, P.metal, { x, y: h + 1.35, z, ry: -ang, sx: 1.5, sy: 0.6, sz: 1.5, shade: 0.9 });
    } else {
      S.add(G.cyl12, P.pillarDark, { x, y: h + 0.75, z, s: 1.4, sy: 0.35, rz: (r() - 0.5) * 0.3, shade: 0.8 });
    }
  });
  // fallen pillar drums scattered on the ice
  for (let i = 0; i < broken; i++) {
    const ang = r() * TAU, rr = R + 6 + r() * 12;
    S.add(G.cyl12, P.pillar, {
      x: Math.cos(ang) * rr, y: -0.55, z: Math.sin(ang) * rr,
      rz: Math.PI / 2, ry: r() * 3, s: 1.25, sy: 2.4 + r() * 3, shade: 0.8
    });
  }

  // Marine banners on the tall pillars
  ring(6, R + 3.0, (i, ang, x, z) => {
    C.add(G.plane, P.banner, {
      x, y: 6.4, z, ry: -ang + Math.PI / 2, sx: 1.7, sy: 5.0,
      meta: { seed: r(), top: 8.9, span: 5.0, amp: 0.3 }
    });
  });

  // HQ: a stepped white fortress on the far side, plus flanking sea walls
  const hqZ = -62;
  for (let i = 0; i < 5; i++) {
    const w = 46 - i * 7.5, h = 7 + i * 4.5;
    S.add(G.box, i % 2 ? P.hq : P.hqDark, { x: 0, y: h * 0.5, z: hqZ - i * 3.2, sx: w, sy: h, sz: 12 - i * 1.4, shade: 0.9 });
  }
  for (const sx of [-1, 1]) {
    S.add(G.cyl8, P.hq, { x: sx * 17, y: 16, z: hqZ - 2, s: 6, sy: 32, shade: 0.95 });
    S.add(G.cone8, P.banner, { x: sx * 17, y: 34, z: hqZ - 2, s: 8, sy: 7, shade: 0.9 });
    S.add(G.box, P.hqDark, { x: sx * 40, y: 6, z: hqZ + 16, sx: 26, sy: 12, sz: 8, shade: 0.82 });
  }
  S.add(G.box, P.metal, { x: 0, y: 30, z: hqZ - 6, sx: 9, sy: 12, sz: 9, shade: 0.85 });
  S.add(G.cone8, P.hq, { x: 0, y: 40, z: hqZ - 6, s: 13, sy: 9, shade: 1.0 });
  // the execution platform, small and unmistakable
  S.add(G.box, P.stone, { x: -26, y: 4, z: -36, sx: 8, sy: 8, sz: 8, shade: 0.9 });
  S.add(G.box, P.metal, { x: -26, y: 9.5, z: -36, sx: 6, sy: 3, sz: 6, shade: 0.8 });

  // ice spikes shoved up through the bay
  const floes = D.floes ?? 34;
  for (let i = 0; i < floes; i++) {
    const ang = r() * TAU, rr = R + 8 + r() * 55;
    const x = Math.cos(ang) * rr, z = Math.sin(ang) * rr;
    if (z > -6 && Math.abs(x) < 16) continue;                 // keep the camera lane clear
    const h = 1.6 + r() * 7;
    S.add(G.cone4, P.ice, { x, y: -0.85 + h * 0.4, z, ry: r() * 3, s: 2.2 + r() * 4, sy: h, shade: 0.9 + r() * 0.2 });
    Gl.add(G.disc8, P.iceDeep, { x, y: -0.78, z, rx: -Math.PI / 2, s: 7 + r() * 8 });
  }
}

/* ------------------------------------------------------------------ */
/* ship — Thousand Sunny. Lawn deck, mast, rigging, open sea.          */
/* ------------------------------------------------------------------ */

function propsShip(ctx) {
  const { S, L, Gl, C, F, P, D, r } = ctx;
  const R = FLOOR_R.ship;
  ctx.lineColor = P.rope;

  // hull: a skirt below the deck, widening then tucking under
  ring(48, R + 0.25, (i, ang, x, z) => {
    S.add(G.box, P.hull, { x, y: -1.1, z, ry: -ang, sx: 1.75, sy: 2.4, sz: 1.1, shade: 0.9 + r() * 0.14 });
    S.add(G.box, P.woodDark, { x: x * 1.02, y: -2.9, z: z * 1.02, ry: -ang, sx: 1.7, sy: 1.6, sz: 1.0, shade: 0.8 });
  });
  ring(48, R + 0.2, (i, ang, x, z) => {
    S.add(G.box, P.trim, { x, y: 0.16, z, ry: -ang, sx: 1.72, sy: 0.3, sz: 1.0, shade: 1.0 });
  });

  // railing: posts plus two rails
  ring(40, R + 0.15, (i, ang, x, z) => {
    S.add(G.box, P.rail, { x, y: 0.75, z, ry: -ang, sx: 0.18, sy: 1.2, sz: 0.18 });
  });
  for (const y of [0.75, 1.28]) {
    ring(60, R + 0.15, (i, ang, x, z) => {
      S.add(G.box, P.rail, { x, y, z, ry: -ang, sx: 1.35, sy: 0.12, sz: 0.12, shade: 1.05 });
    });
  }

  // main mast, aft of the fighters
  const mx = 0.6, mz = -8.2, mh = 21;
  S.add(G.cyl8, P.mast, { x: mx, y: mh * 0.5, z: mz, s: 0.75, sy: mh });
  S.add(G.cyl8, P.woodDark, { x: mx, y: 0.5, z: mz, s: 1.5, sy: 1.0 });
  S.add(G.box, P.mast, { x: mx, y: 13.2, z: mz, sx: 15, sy: 0.4, sz: 0.4 });   // yard
  S.add(G.box, P.mast, { x: mx, y: 8.4, z: mz, sx: 10, sy: 0.34, sz: 0.34 });
  S.add(G.cyl8, P.wood, { x: mx, y: 15.4, z: mz, s: 2.1, sy: 1.5, shade: 0.95 });  // crow's nest
  S.add(G.cyl8, P.woodDark, { x: mx, y: 16.5, z: mz, s: 2.4, sy: 0.3, shade: 0.85 });
  L.add(G.cone6, P.trim, { x: mx, y: 21.6, z: mz, s: 1.0, sy: 1.4 });
  // sails
  C.add(G.plane, P.sail, { x: mx, y: 10.6, z: mz + 0.35, sx: 14.4, sy: 5.4, meta: { seed: r(), top: 13.3, span: 5.4, amp: 0.34 } });
  C.add(G.plane, P.sail, { x: mx, y: 6.3, z: mz + 0.3, sx: 9.6, sy: 4.0, meta: { seed: r(), top: 8.3, span: 4.0, amp: 0.28 } });
  C.add(G.plane, P.trim, { x: mx + 2.6, y: 19.6, z: mz, sx: 4.4, sy: 1.5, meta: { seed: r(), top: 20.4, span: 1.5, amp: 0.4 } });

  // rigging — one LineSegments for the lot
  for (let i = 0; i < 8; i++) {
    const a = -0.9 + i * 0.26;
    rope(ctx, mx, 13.2 - Math.abs(i - 3.5) * 0.2, mz, Math.cos(a) * (R + 0.1), 1.3, Math.sin(a) * (R + 0.1) * 0.6 - 2, 0.5, 5);
  }
  for (let i = 0; i < 6; i++) {
    const t = -0.5 + i * 0.2;
    rope(ctx, mx - 7 + i * 2.8, 13.2, mz, mx - 4 + i * 1.6, 16.4, mz, 0.15, 3);
    rope(ctx, mx + t * 14, 13.2, mz, mx + t * 9, 8.4, mz, 0.1, 3);
  }
  rope(ctx, mx, 20.6, mz, 0, 2.2, R + 0.4, 1.6, 10);
  rope(ctx, mx, 20.6, mz, 0, 2.2, -R - 4.5, 1.4, 10);

  // cabin + helm behind, barrels and crates on the rim
  S.add(G.box, P.wood, { x: -9.0, y: 1.6, z: -9.4, ry: 0.5, sx: 6.5, sy: 3.2, sz: 5, shade: 0.95 });
  S.add(G.box, P.trim, { x: -9.0, y: 3.4, z: -9.4, ry: 0.5, sx: 7.2, sy: 0.5, sz: 5.6 });
  L.add(G.box, '#ffe0a0', { x: -7.2, y: 1.8, z: -7.6, ry: 0.5, sx: 1.2, sy: 1.1, sz: 0.1 });
  Gl.add(G.ico, '#ffbb66', { x: -7.2, y: 1.8, z: -7.4, s: 2.4 });
  for (let i = 0; i < 9; i++) {
    const ang = r() * TAU, rr = R - 1.5 - r() * 0.9;
    if (Math.sin(ang) > 0.35 && Math.abs(Math.cos(ang)) < 0.5) continue;
    S.add(G.cyl8, P.woodDark, { x: Math.cos(ang) * rr, y: 0.55, z: Math.sin(ang) * rr, s: 1.05, sy: 1.1, shade: 0.9 + r() * 0.2 });
    S.add(G.cyl8, P.trim, { x: Math.cos(ang) * rr, y: 0.85, z: Math.sin(ang) * rr, s: 1.12, sy: 0.14 });
  }
  // the figurehead, out over the bow
  S.add(G.box, P.hull, { x: 0, y: -0.4, z: -R - 3.2, sx: 3.2, sy: 2.6, sz: 5.0, shade: 0.95 });
  S.add(G.ico1, P.trim, { x: 0, y: 1.6, z: -R - 5.0, s: 3.4, shade: 1.05 });
  S.add(G.cone6, P.trim, { x: 0, y: 1.6, z: -R - 6.4, rx: -Math.PI / 2, s: 2.2, sy: 2.0, shade: 1.0 });

  // distant islands
  const isl = D.islands ?? 5;
  for (let i = 0; i < isl; i++) {
    const ang = -2.6 + r() * 2.2, rr = 130 + r() * 90;
    const x = Math.cos(ang) * rr, z = Math.sin(ang) * rr;
    const h = 10 + r() * 22;
    S.add(G.cone6, P.grassDark, { x, y: -3.6 + h * 0.35, z, s: 34 + r() * 34, sy: h, shade: 0.75 });
    for (let k = 0; k < 3; k++) {
      S.add(G.cyl6, P.woodDark, { x: x + (r() - 0.5) * 22, y: h * 0.6, z: z + (r() - 0.5) * 22, s: 1.2, sy: 12, shade: 0.7 });
    }
  }

  // gulls
  const gulls = D.gulls ?? 7;
  for (let i = 0; i < gulls; i++) {
    const rr = 16 + r() * 22, y = 9 + r() * 12, sd = r();
    F.add(G.plane, '#ffffff', { x: rr, y, z: 0, rx: -Math.PI / 2, sx: 1.9, sy: 0.5, meta: { seed: sd, span: 0.95, amp: 0.34 } });
  }
}

/* ------------------------------------------------------------------ */
/* rooftop — Onigashima. Tiles, lanterns, a red moon over Wano.        */
/* ------------------------------------------------------------------ */

function propsRooftop(ctx) {
  const { S, L, Gl, C, P, D, r } = ctx;
  const R = FLOOR_R.rooftop;
  ctx.lineColor = '#1a1220';

  // eaves all the way round, with a heavy ridge beam
  ring(64, R - 0.15, (i, ang, x, z) => {
    S.add(G.box, P.ridge, { x, y: 0.12, z, ry: -ang, sx: 1.32, sy: 0.30, sz: 0.9, shade: 0.95 + r() * 0.14 });
    S.add(G.box, P.tileDark, { x: x * 1.06, y: -0.35, z: z * 1.06, ry: -ang, sx: 1.34, sy: 0.7, sz: 0.7, shade: 0.9 });
  });
  ring(20, R + 0.9, (i, ang, x, z) => {
    S.add(G.box, P.beam, { x, y: -1.5, z, ry: -ang, rz: 0.42, sx: 0.5, sy: 3.0, sz: 0.5, shade: 0.9 });
  });
  // onigawara demon tiles at the near corners — the foreground bite
  for (const sx of [-1, 1]) {
    const x = sx * 7.4, z = R - 0.6;
    S.add(G.box, P.ridge, { x, y: 0.55, z, sx: 1.5, sy: 1.2, sz: 1.0, shade: 1.15 });
    S.add(G.cone4, P.ridge, { x: x - 0.55, y: 1.35, z, s: 0.45, sy: 0.8, shade: 1.2 });
    S.add(G.cone4, P.ridge, { x: x + 0.55, y: 1.35, z, s: 0.45, sy: 0.8, shade: 1.2 });
    L.add(G.ico, P.lanternGlow, { x: x - 0.28, y: 0.75, z: z + 0.42, s: 0.16 });
    L.add(G.ico, P.lanternGlow, { x: x + 0.28, y: 0.75, z: z + 0.42, s: 0.16 });
  }

  // the skyline of lower roofs, dropping away into the dark
  const roofs = D.roofs ?? 11;
  for (let i = 0; i < roofs; i++) {
    const ang = (i / roofs) * TAU + r() * 0.4;
    const rr = R + 7 + r() * 22;
    const x = Math.cos(ang) * rr, z = Math.sin(ang) * rr;
    const y = -2.5 - r() * 7;
    const w = 9 + r() * 12, d = 8 + r() * 9, h = 3.4 + r() * 2.6;
    S.add(G.box, P.wood, { x, y: y - 3.2, z, ry: ang, sx: w * 0.78, sy: 6.4, sz: d * 0.78, shade: 0.72 });
    hipRoof(S, x, y, z, w, d, h, P.tile, P.tileDark, ang);
    if (r() > 0.45) lantern(ctx, x + (r() - 0.5) * w, y - 1.4, z + d * 0.45, 0.42, P.lantern, P.lanternGlow);
  }

  // poles with strung lanterns arcing over the roof
  const poles = D.poles ?? 6;
  const pole = [];
  ring(poles, R + 1.6, (i, ang, x, z) => {
    const h = 9 + (i % 2) * 2.2;
    S.add(G.cyl6, P.wood, { x, y: h * 0.5, z, s: 0.34, sy: h, shade: 0.95 });
    S.add(G.box, P.trim, { x, y: h + 0.2, z, ry: -ang, sx: 1.5, sy: 0.2, sz: 0.2, shade: 1.1 });
    C.add(G.plane, i % 2 ? P.banner : P.trim, {
      x, y: h - 2.6, z, ry: -ang + Math.PI / 2, sx: 0.9, sy: 4.4,
      meta: { seed: r(), top: h - 0.4, span: 4.4, amp: 0.26 }
    });
    pole.push([x, h, z]);
  });
  const nl = D.lanterns ?? 26;
  const perSpan = Math.max(1, Math.round(nl / poles));
  for (let i = 0; i < poles; i++) {
    const A = pole[i], B = pole[(i + 1) % poles];
    rope(ctx, A[0], A[1], A[2], B[0], B[1], B[2], 2.0, 9);
    for (let k = 1; k <= perSpan; k++) {
      const t = k / (perSpan + 1);
      const x = lerp(A[0], B[0], t), z = lerp(A[2], B[2], t);
      const y = lerp(A[1], B[1], t) - Math.sin(t * Math.PI) * 2.0 - 0.45;
      lantern(ctx, x, y, z, 0.40, P.lantern, P.lanternGlow);
    }
  }

  // the island itself: black rock falling away, then Wano's mountains
  for (let i = 0; i < 22; i++) {
    const ang = r() * TAU, rr = 26 + r() * 44;
    S.add(G.cone4, P.rock, {
      x: Math.cos(ang) * rr, y: -22 + r() * 8, z: Math.sin(ang) * rr,
      ry: r() * 3, s: 16 + r() * 26, sy: 22 + r() * 30, shade: 0.8 + r() * 0.4
    });
  }
  for (let i = 0; i < 10; i++) {
    const ang = -0.2 + r() * 3.6, rr = 120 + r() * 90;
    S.add(G.cone6, P.rock, {
      x: Math.cos(ang) * rr, y: -14, z: Math.sin(ang) * rr, s: 50 + r() * 60, sy: 40 + r() * 44, shade: 0.66
    });
  }
  // a few distant window lights so the dark has depth
  for (let i = 0; i < 26; i++) {
    const ang = r() * TAU, rr = 24 + r() * 40;
    Gl.add(G.ico, P.lanternGlow, { x: Math.cos(ang) * rr, y: -3 - r() * 9, z: Math.sin(ang) * rr, s: 1.5 + r() * 1.6 });
  }
}

/* ------------------------------------------------------------------ */
/* clouds — Skypiea. Cloud islets, vines, Shandian gold.               */
/* ------------------------------------------------------------------ */

function propsClouds(ctx) {
  const { S, L, Gl, C, P, D, r } = ctx;
  const R = FLOOR_R.clouds;
  ctx.lineColor = P.vineDark;

  // the island rim: cloud lobes tumbling off the edge, mossy on top
  ring(30, R - 0.4, (i, ang, x, z) => {
    S.add(G.ico1, P.cloud, { x, y: -0.5 - r() * 0.5, z, s: 3.4 + r() * 1.8, sy: 2.2, shade: 0.94 + r() * 0.12 });
    S.add(G.ico1, P.cloudShade, { x: x * 1.14, y: -2.4 - r() * 1.6, z: z * 1.14, s: 3.6 + r() * 2.4, sy: 2.6, shade: 0.92 });
  });
  ring(26, R - 0.9, (i, ang, x, z) => {
    S.add(G.ico, P.leaf, { x, y: 0.06, z, s: 2.6 + r() * 1.5, sy: 0.28, shade: 0.9 + r() * 0.25 });
  });
  for (let i = 0; i < 18; i++) {
    const ang = r() * TAU, rr = R - 2.6 - r() * 2.4;
    S.add(G.cone6, P.vine, { x: Math.cos(ang) * rr, y: 0.5, z: Math.sin(ang) * rr, s: 1.4 + r() * 1.6, sy: 1.2 + r(), shade: 0.9 + r() * 0.3 });
  }

  // Shandian ruins around the rim — the only hard edges in a soft arena
  const ruins = D.ruins ?? 6;
  ring(ruins, R - 1.1, (i, ang, x, z) => {
    const h = 3.2 + r() * 3.4;
    S.add(G.box, P.stone, { x, y: h * 0.5, z, ry: -ang + (r() - 0.5) * 0.2, sx: 1.9, sy: h, sz: 1.9, shade: 0.92 + r() * 0.16 });
    S.add(G.box, P.stoneDark, { x, y: h + 0.25, z, ry: -ang, sx: 2.4, sy: 0.5, sz: 2.4, shade: 0.9 });
    L.add(G.box, P.gold, { x, y: h * 0.62, z, ry: -ang, sx: 2.0, sy: 0.28, sz: 2.0 });
    Gl.add(G.ico, P.gold, { x, y: h * 0.62, z, s: 2.6 });
  });
  // a broken arch framing the far side
  for (const sx of [-1, 1]) {
    S.add(G.box, P.stone, { x: sx * 9.5, y: 4.4, z: -R + 0.4, sx: 1.6, sy: 8.8, sz: 1.6, shade: 0.95 });
    S.add(G.box, P.stoneDark, { x: sx * 8.6, y: 9.1, z: -R + 0.4, rz: sx * 0.45, sx: 3.2, sy: 1.0, sz: 1.8, shade: 0.9 });
  }
  S.add(G.box, P.gold, { x: 0, y: 10.1, z: -R + 0.4, sx: 12, sy: 0.7, sz: 1.4, shade: 1.1 });

  // hanging vines — the overhead framing
  const vines = D.vines ?? 4;
  for (let i = 0; i < vines; i++) {
    const ang = (i / vines) * TAU + 0.6;
    const rr = R - 0.5, x = Math.cos(ang) * rr, z = Math.sin(ang) * rr;
    C.add(G.plane, P.vine, {
      x, y: 9.5, z, ry: -ang + Math.PI / 2, sx: 0.6, sy: 12,
      meta: { seed: r(), top: 15.5, span: 12, amp: 0.5 }
    });
    for (let k = 0; k < 5; k++) {
      C.add(G.plane, P.leaf, {
        x: x + (r() - 0.5) * 1.4, y: 5 + k * 2.1, z: z + (r() - 0.5) * 1.4, ry: r() * 3,
        sx: 1.5, sy: 0.9, meta: { seed: r(), top: 15.5, span: 12, amp: 0.4 }
      });
    }
  }

  // floating islets
  const islets = D.islets ?? 9;
  for (let i = 0; i < islets; i++) {
    const ang = r() * TAU, rr = 26 + r() * 48;
    const x = Math.cos(ang) * rr, z = Math.sin(ang) * rr;
    const y = -7 + r() * 16;
    const s = 6 + r() * 12;
    S.add(G.ico1, P.cloud, { x, y, z, s: s * 2.2, sy: s * 0.9, shade: 0.98 });
    S.add(G.ico1, P.cloudShade, { x, y: y - s * 0.7, z, s: s * 1.7, sy: s * 1.3, shade: 0.95 });
    S.add(G.ico, P.leaf, { x, y: y + s * 0.42, z, s: s * 1.5, sy: s * 0.22, shade: 0.95 });
    if (r() > 0.4) {
      S.add(G.cyl6, P.stone, { x, y: y + s * 0.8, z, s: 1.6, sy: s * 0.8, shade: 0.9 });
      L.add(G.box, P.gold, { x, y: y + s * 1.2, z, sx: 3, sy: 0.4, sz: 3 });
    }
  }
  // Giant Jack, far off on the background side
  S.add(G.cyl8, P.vineDark, { x: -34, y: 20, z: -96, s: 9, sy: 160, shade: 0.8 });
  for (let i = 0; i < 8; i++) {
    S.add(G.ico1, P.vine, { x: -34 + (r() - 0.5) * 22, y: -20 + i * 16, z: -96 + (r() - 0.5) * 18, s: 14 + r() * 12, shade: 0.85 });
  }
}

/* ------------------------------------------------------------------ */
/* restaurant — Baratie. Fish-headed galley, string lights, sunset.    */
/* ------------------------------------------------------------------ */

function propsRestaurant(ctx) {
  const { S, L, Gl, C, F, P, D, r } = ctx;
  const R = FLOOR_R.restaurant;
  ctx.lineColor = P.rope;

  // hull under the deck
  ring(44, R + 0.2, (i, ang, x, z) => {
    S.add(G.box, P.woodDark, { x, y: -1.3, z, ry: -ang, sx: 1.9, sy: 2.6, sz: 1.1, shade: 0.86 + r() * 0.18 });
    S.add(G.box, P.trim, { x, y: 0.12, z, ry: -ang, sx: 1.88, sy: 0.26, sz: 1.0 });
  });
  // railing with rope swags
  const posts = [];
  ring(28, R + 0.1, (i, ang, x, z) => {
    if (Math.sin(ang) < -0.55) return;                       // opens onto the galley
    S.add(G.cyl6, P.rail, { x, y: 0.62, z, s: 0.22, sy: 1.24 });
    S.add(G.ico, P.trim, { x, y: 1.3, z, s: 0.3 });
    posts.push([x, 1.2, z]);
  });
  for (let i = 1; i < posts.length; i++) {
    rope(ctx, posts[i - 1][0], posts[i - 1][1], posts[i - 1][2], posts[i][0], posts[i][1], posts[i][2], 0.3, 3);
  }

  // the galley itself, filling the background
  const bz = -R - 5.6;
  S.add(G.box, P.wall, { x: 0, y: 3.4, z: bz, sx: 19, sy: 6.8, sz: 9, shade: 1.0 });
  S.add(G.box, P.wallDark, { x: 0, y: 0.6, z: bz + 4.3, sx: 19.4, sy: 1.4, sz: 0.6, shade: 0.95 });
  S.add(G.box, P.roof, { x: 0, y: 7.4, z: bz, sx: 21, sy: 1.2, sz: 11, shade: 1.0 });
  S.add(G.box, P.wall, { x: 0, y: 10.0, z: bz - 1.2, sx: 13, sy: 4.2, sz: 6.5, shade: 0.94 });
  S.add(G.box, P.roof, { x: 0, y: 12.4, z: bz - 1.2, sx: 15, sy: 1.0, sz: 8.2, shade: 1.06 });
  S.add(G.cyl8, P.wallDark, { x: 6.4, y: 14.6, z: bz - 1.2, s: 1.5, sy: 4.4, shade: 0.9 });
  // windows — self-lit, so the building reads at dusk
  for (let i = 0; i < 7; i++) {
    const x = -7.5 + i * 2.5;
    L.add(G.box, P.window, { x, y: 3.9, z: bz + 4.55, sx: 1.5, sy: 1.9, sz: 0.12 });
    Gl.add(G.ico, P.window, { x, y: 3.9, z: bz + 4.8, s: 3.0 });
  }
  for (let i = 0; i < 4; i++) {
    L.add(G.box, P.window, { x: -4.5 + i * 3, y: 10.2, z: bz + 2.1, sx: 1.3, sy: 1.5, sz: 0.12 });
    Gl.add(G.ico, P.window, { x: -4.5 + i * 3, y: 10.2, z: bz + 2.3, s: 2.4 });
  }
  L.add(G.box, P.trim, { x: 0, y: 8.4, z: bz + 5.4, sx: 8.5, sy: 1.5, sz: 0.3 });
  Gl.add(G.ico, P.trim, { x: 0, y: 8.4, z: bz + 5.7, s: 7.5 });

  // the fish head, off the port bow
  S.add(G.ico1, P.fish, { x: -14.5, y: 1.4, z: -7.5, s: 9, sy: 7.5, sz: 11, shade: 1.0 });
  S.add(G.cone6, P.fish, { x: -19.5, y: 1.2, z: -9.5, rz: Math.PI / 2, ry: 0.5, s: 5.5, sy: 6, shade: 0.92 });
  S.add(G.ico, '#ffffff', { x: -12.4, y: 3.6, z: -3.6, s: 2.0 });
  S.add(G.ico, '#12121a', { x: -12.0, y: 3.6, z: -3.0, s: 1.1 });
  S.add(G.cone6, P.fish, { x: -13.0, y: 6.6, z: -8.0, rz: -0.4, s: 4.5, sy: 5.5, shade: 1.08 });
  // tail fin on the far side
  S.add(G.cone6, P.fish, { x: 15.5, y: 2.6, z: -12.0, rz: 0.7, ry: 0.6, s: 7, sy: 9, shade: 0.9 });

  // masts + string lights crossing overhead
  const anchors = [[-9.5, 10.5, -R - 0.4], [9.5, 10.5, -R - 0.4]];
  for (const sx of [-1, 1]) {
    S.add(G.cyl6, P.woodDark, { x: sx * 10.8, y: 5.6, z: R - 2.2, s: 0.4, sy: 11.2, shade: 0.95 });
    anchors.push([sx * 10.8, 10.8, R - 2.2]);
  }
  const nl = D.lanterns ?? 14;
  const spans = [[0, 2], [1, 3], [2, 3], [0, 1]];
  let placed = 0;
  for (const [ia, ib] of spans) {
    const A = anchors[ia], B = anchors[ib];
    rope(ctx, A[0], A[1], A[2], B[0], B[1], B[2], 1.7, 9);
    const per = Math.ceil(nl / spans.length);
    for (let k = 1; k <= per && placed < nl; k++, placed++) {
      const t = k / (per + 1);
      lantern(ctx, lerp(A[0], B[0], t), lerp(A[1], B[1], t) - Math.sin(t * Math.PI) * 1.7 - 0.4, lerp(A[2], B[2], t),
        0.34, P.window, '#ffb45a');
    }
  }

  // tables around the rim
  const tables = D.tables ?? 7;
  ring(tables, R - 2.1, (i, ang, x, z) => {
    if (Math.sin(ang) > 0.55) return;
    S.add(G.cyl6, P.woodDark, { x, y: 0.4, z, s: 0.26, sy: 0.8 });
    S.add(G.cyl12, P.deck, { x, y: 0.84, z, s: 1.9, sy: 0.12, shade: 1.05 });
    C.add(G.disc, '#f4ead6', { x, y: 0.9, z, rx: -Math.PI / 2, s: 2.1, meta: { seed: r(), top: 0.9, span: 0.4, amp: 0.05 } });
    L.add(G.ico, P.window, { x, y: 1.1, z, s: 0.22 });
    Gl.add(G.ico, '#ffb45a', { x, y: 1.1, z, s: 1.5 });
    for (let k = 0; k < 2; k++) {
      const a2 = ang + (k ? 0.55 : -0.55);
      S.add(G.box, P.wood, { x: x + Math.cos(a2) * 1.4, y: 0.42, z: z + Math.sin(a2) * 1.4, ry: -a2, sx: 0.75, sy: 0.85, sz: 0.75, shade: 0.9 });
    }
  });
  // barrels and crates
  for (let i = 0; i < 7; i++) {
    const ang = r() * TAU, rr = R - 1.2 - r() * 0.8;
    S.add(G.cyl8, P.woodDark, { x: Math.cos(ang) * rr, y: 0.5, z: Math.sin(ang) * rr, s: 1.0, sy: 1.0, shade: 0.9 + r() * 0.2 });
  }

  // distant ships on the sunset
  for (let i = 0; i < 4; i++) {
    const ang = -2.9 + r() * 2.4, rr = 90 + r() * 70;
    const x = Math.cos(ang) * rr, z = Math.sin(ang) * rr;
    S.add(G.box, P.woodDark, { x, y: -1.4, z, ry: r() * 3, sx: 11, sy: 4, sz: 5, shade: 0.6 });
    S.add(G.cyl6, P.woodDark, { x, y: 7, z, s: 0.9, sy: 18, shade: 0.6 });
    S.add(G.plane, P.rope, { x, y: 8, z: z + 0.4, sx: 7, sy: 9, shade: 0.7 });
  }

  const gulls = D.gulls ?? 6;
  for (let i = 0; i < gulls; i++) {
    const rr = 18 + r() * 20, y = 8 + r() * 10, sd = r();
    F.add(G.plane, '#f3e6d0', { x: rr, y, z: 0, rx: -Math.PI / 2, sx: 1.8, sy: 0.5, meta: { seed: sd, span: 0.9, amp: 0.3 } });
  }
}

const PROPS = {
  colosseum: propsColosseum, plaza: propsPlaza, ship: propsShip,
  rooftop: propsRooftop, clouds: propsClouds, restaurant: propsRestaurant
};

/* ══════════════════════════════════════════════════════════════════════════
   5. WEATHER — particle fields + the environment shift each one implies
   ══════════════════════════════════════════════════════════════════════════ */

const MIST_FRAG = /* glsl */`
uniform vec3 uColor; uniform float uT, uAlpha, uR;
varying vec2 vP;
${NOISE}
void main(){
  float r = length(vP);
  float f = fbm(vP * 0.055 + vec2(uT * 0.020, -uT * 0.013)) * 0.7
          + fbm(vP * 0.16 + vec2(-uT * 0.03, uT * 0.02)) * 0.4;
  float a = smoothstep(0.34, 0.86, f) * uAlpha;
  a *= smoothstep(uR, uR * 0.18, r);
  if (a < 0.004) discard;
  gl_FragColor = vec4(uColor, a);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`;

/**
 * How each weather state bends the arena. `fogMul`/`tint` move the fog,
 * `key` scales every directional (with a floor, so nothing ever goes black),
 * `dark`/`sat` re-grade the sky and sea.
 */
const WEATHER_FX = {
  rain:      { fogMul: 2.5, tint: 0.50, c: '#5f7a92', key: 0.62, dark: 0.66, sat: 0.34, exp: 0.94, wet: 1 },
  sun:       { fogMul: 0.72, tint: 0.34, c: '#ffd9a0', key: 1.22, dark: 1.10, sat: 0.00, exp: 1.10, haze: 0.5 },
  sandstorm: { fogMul: 4.4, tint: 0.80, c: '#c8a165', key: 0.66, dark: 0.84, sat: 0.52, exp: 0.96, sand: 1 },
  hail:      { fogMul: 3.0, tint: 0.66, c: '#cfe6f5', key: 0.72, dark: 0.90, sat: 0.46, exp: 1.02, snow: 1 },
  fog:       { fogMul: 5.6, tint: 0.86, c: '#aebecd', key: 0.52, dark: 0.90, sat: 0.60, exp: 0.99 }
};

const TERRAIN_FX = {
  blade:   { u: 'uBlade', c: '#c9d4e0' },
  ember:   { u: 'uEmber', c: '#ff7a4a' },
  psychic: { u: 'uPsy', c: '#e05c9e' },
  haki:    { u: 'uHaki', c: '#5a5fd0' }
};

function streakField(count, o) {
  const pos = new Float32Array(count * 6);
  const off = new Float32Array(count * 6);
  const r = rng(o.seed || 7);
  for (let i = 0; i < count; i++) {
    const x = r() * o.box, y = r() * o.h, z = r() * o.box;
    const lx = (o.lx || 0) * (0.6 + r() * 0.8), ly = (o.ly || -1) * (0.6 + r() * 0.8), lz = (o.lz || 0) * (0.6 + r() * 0.8);
    pos[i * 6] = x; pos[i * 6 + 1] = y; pos[i * 6 + 2] = z;
    pos[i * 6 + 3] = x; pos[i * 6 + 4] = y; pos[i * 6 + 5] = z;
    off[i * 6 + 3] = lx; off[i * 6 + 4] = ly; off[i * 6 + 5] = lz;
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('aOff', new THREE.BufferAttribute(off, 3));
  g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e5);
  const m = new THREE.ShaderMaterial({
    uniforms: {
      uCam: { value: new THREE.Vector3() }, uT: { value: 0 },
      uBox: { value: o.box }, uH: { value: o.h }, uFall: { value: o.fall },
      uWindX: { value: o.windX || 0 }, uWindZ: { value: o.windZ || 0 },
      uFade: { value: 1 }, uAlpha: { value: o.alpha ?? 0.5 },
      uColor: { value: new THREE.Color(o.color) }
    },
    vertexShader: STREAK_VERT, fragmentShader: STREAK_FRAG,
    transparent: true, depthWrite: false, blending: o.additive ? THREE.AdditiveBlending : THREE.NormalBlending
  });
  const mesh = new THREE.LineSegments(g, m);
  mesh.frustumCulled = false;
  mesh.renderOrder = 6;
  return mesh;
}

function moteField(count, o) {
  const pos = new Float32Array(count * 3);
  const size = new Float32Array(count);
  const r = rng(o.seed || 11);
  for (let i = 0; i < count; i++) {
    pos[i * 3] = r() * o.box; pos[i * 3 + 1] = r() * o.h; pos[i * 3 + 2] = r() * o.box;
    size[i] = o.size * (0.55 + r() * 0.9);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('aSize', new THREE.BufferAttribute(size, 1));
  g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e5);
  const m = new THREE.ShaderMaterial({
    uniforms: {
      uCam: { value: new THREE.Vector3() }, uT: { value: 0 },
      uBox: { value: o.box }, uH: { value: o.h }, uFall: { value: o.fall },
      uWindX: { value: o.windX || 0 }, uWindZ: { value: o.windZ || 0 },
      uFade: { value: 1 }, uAlpha: { value: o.alpha ?? 0.7 }, uSoft: { value: o.soft ?? 1 },
      uPx: { value: 300 }, uColor: { value: new THREE.Color(o.color) }
    },
    vertexShader: MOTE_VERT, fragmentShader: MOTE_FRAG,
    transparent: true, depthWrite: false, blending: o.additive ? THREE.AdditiveBlending : THREE.NormalBlending
  });
  const mesh = new THREE.Points(g, m);
  mesh.frustumCulled = false;
  mesh.renderOrder = 6;
  return mesh;
}

/* ══════════════════════════════════════════════════════════════════════════
   6. STAGE
   ══════════════════════════════════════════════════════════════════════════ */

const QUALITY = {
  high:   { post: true, aa: 'smaa', bloom: 0.55, shadow: 2048, dpr: 2, seaSeg: 88 },
  medium: { post: true, aa: 'fxaa', bloom: 0.42, shadow: 1024, dpr: 1.5, seaSeg: 64 },
  low:    { post: false, aa: 'msaa', bloom: 0, shadow: 512, dpr: 1, seaSeg: 40 }
};

/** The point every camera-relative light aims at. */
const FOCUS = new THREE.Vector3(0, 1.25, 0);

export class Stage {
  constructor(canvas) {
    kit();
    this.canvas = canvas;
    this.renderer = new THREE.WebGLRenderer({
      canvas, antialias: true, powerPreference: 'high-performance', alpha: false
    });
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;   // PCFSoft is deprecated in r18x
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.info.autoReset = false;

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(42, 1, 0.2, 900);
    this.camera.position.set(0, 4.2, 11);
    this.camera.lookAt(0, 1.6, 0);

    this.feel = new Feel();
    this.time = 0;                                  // THREE.Clock is deprecated
    this.arenaGroup = new THREE.Group();
    this.scene.add(this.arenaGroup);
    this.fxGroup = new THREE.Group();
    this.scene.add(this.fxGroup);
    /** Weather + terrain live here: built once, survive `buildArena`. */
    this.fieldGroup = new THREE.Group();
    this.scene.add(this.fieldGroup);

    this.lights = [];
    this.arena = null;
    this.ring = null;
    this.sea = null;
    this.sky = null;
    this.stats = { fps: 0, frames: 0, acc: 0, drawCalls: 0, tris: 0 };
    this.weather = 'none';
    this.terrain = 'none';
    /** When nothing calls setWeather/setTerrain, follow the live battle field. */
    this.autoField = true;
    this._pollT = 0;
    this._env = null;
    this._composer = null;

    this._buildField();
    this.setQuality(this._pickQuality());
    this._resize();
    addEventListener('resize', () => this._resize());
  }

  /* ---------------- quality + post ---------------- */

  _pickQuality() {
    try {
      const q = new URLSearchParams(location.search).get('quality');
      if (q && QUALITY[q]) return q;
      const cores = navigator.hardwareConcurrency || 8;
      if (/Android|iPhone|iPad|iPod/i.test(navigator.userAgent) && cores <= 4) return 'medium';
    } catch { /* not in a page */ }
    return 'high';
  }

  /** `'high' | 'medium' | 'low'`. Anything unknown falls back to a plain render. */
  setQuality(q) {
    const Q = QUALITY[q] || QUALITY.low;
    this.quality = QUALITY[q] ? q : 'low';
    this.Q = Q;
    this.renderer.setPixelRatio(Math.min(devicePixelRatio || 1, Q.dpr));
    for (const l of this.lights) if (l.isDirectionalLight && l.castShadow) l.shadow.mapSize.set(Q.shadow, Q.shadow);
    this._disposeComposer();
    if (Q.post) this._buildComposer();
    this._resize();
    return this.quality;
  }

  _disposeComposer() {
    if (!this._composer) return;
    for (const p of this._composer.passes) p.dispose?.();
    this._composer.renderTarget1?.dispose();
    this._composer.renderTarget2?.dispose();
    this._composer = null;
    this._bloom = null;
    this._fxaa = null;
  }

  _buildComposer() {
    const w = Math.max(2, this.canvas.clientWidth || 1280);
    const h = Math.max(2, this.canvas.clientHeight || 720);
    const target = new THREE.WebGLRenderTarget(w, h, {
      type: THREE.HalfFloatType, samples: this.quality === 'high' ? 4 : 0
    });
    const c = new EffectComposer(this.renderer, target);
    c.addPass(new RenderPass(this.scene, this.camera));
    // The render pass writes linear HDR, so a threshold above 1 means only
    // genuinely over-bright things — additive VFX cores, lantern glows, the sun
    // disc — bloom. The sky, however white, never does.
    this._bloom = new UnrealBloomPass(new THREE.Vector2(w, h), this.Q.bloom, 0.5, 1.15);
    c.addPass(this._bloom);
    if (this.Q.aa === 'smaa') c.addPass(new SMAAPass());
    c.addPass(new OutputPass());
    if (this.Q.aa === 'fxaa') {
      this._fxaa = new ShaderPass(FXAAShader);       // needs sRGB input → after OutputPass
      c.addPass(this._fxaa);
    }
    this._composer = c;
  }

  _resize() {
    const w = this.canvas.clientWidth || innerWidth;
    const h = this.canvas.clientHeight || innerHeight;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / Math.max(1, h);
    this.camera.updateProjectionMatrix();
    const pr = this.renderer.getPixelRatio();
    this._composer?.setSize(w, h);
    this._bloom?.setSize(w * pr, h * pr);
    if (this._fxaa) this._fxaa.material.uniforms.resolution.value.set(1 / (w * pr), 1 / (h * pr));
  }

  /* ---------------- arena ---------------- */

  clearArena() {
    while (this.arenaGroup.children.length) {
      const c = this.arenaGroup.children.pop();
      c.traverse?.((o) => {
        o.geometry?.dispose?.();
        if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => m.dispose?.());
      });
      this.arenaGroup.remove(c);
    }
    this.lights?.forEach((l) => { this.scene.remove(l); if (l.target) this.scene.remove(l.target); });
    this.lights = [];
    this.sky = this.sea = this.ring = null;
    this.crowd = null;
    this.cloth = null;
    this.flock = null;
    this.floorMat = null;
  }

  buildArena(arenaId) {
    const a = getArena(arenaId);
    this.arena = a;
    this.clearArena();
    this._buildSky(a);
    this.scene.fog = new THREE.FogExp2(new THREE.Color(a.fog.color), a.fog.density);
    this._buildFloor(a);
    this._buildSea(a);
    this._buildProps(a);
    this._buildLights(a);
    this._applyEnv();
    return a;
  }

  _buildSky(a) {
    const d = a.dome || {};
    const sunDir = new THREE.Vector3(...(d.sunDir || a.sun.position)).normalize();
    const moonDir = new THREE.Vector3(...(d.moonDir || [-0.4, 0.35, -0.85])).normalize();
    const mat = new THREE.ShaderMaterial({
      side: THREE.BackSide, depthWrite: false, fog: false,
      uniforms: {
        uTop: { value: new THREE.Color(a.sky[0]) },
        uBot: { value: new THREE.Color(a.sky[1]) },
        uBelow: { value: new THREE.Color(a.below || a.sky[1]) },
        uFogC: { value: new THREE.Color(a.fog.color) },
        uSunC: { value: new THREE.Color(d.sunColor || a.sun.color) },
        uMoonC: { value: new THREE.Color(d.moonColor || '#ffffff') },
        uCloudC: { value: new THREE.Color(d.cloudColor || '#ffffff') },
        uSunDir: { value: sunDir }, uMoonDir: { value: moonDir },
        uSunSize: { value: d.sunSize ?? 0.03 }, uHalo: { value: d.halo ?? 0.5 },
        uClouds: { value: d.clouds ?? 0.4 }, uCloudY: { value: d.cloudY ?? 0.08 },
        uStars: { value: d.stars ?? 0 }, uMoon: { value: d.moon ?? 0 },
        uT: { value: 0 }, uHaze: { value: 0.55 }, uDark: { value: 1 }, uSat: { value: 0 }
      },
      vertexShader: SKY_VERT, fragmentShader: SKY_FRAG
    });
    const sky = new THREE.Mesh(new THREE.SphereGeometry(420, 40, 22), mat);
    sky.frustumCulled = false;
    sky.renderOrder = -1000;
    this.arenaGroup.add(sky);
    this.sky = sky;
    this._sunDir = sunDir;
  }

  _buildFloor(a) {
    const P = a.palette || {};
    const R = FLOOR_R[a.props] ?? 13;
    const cols = {
      colosseum: [P.sand, P.sandDark, P.trim],
      plaza: [P.pillar, P.stoneDark, a.accent],
      ship: [P.wood, P.woodDark, P.grass],
      rooftop: [P.tile, P.tileDark, P.trim],
      clouds: [P.cloud, P.cloudShade, P.gold],
      restaurant: [P.deck, P.woodDark, P.trim]
    }[a.props] || [a.ground, a.ground, a.accent];
    const mat = patternMat(a.props, [cols[0] || a.ground, cols[1] || a.ground, cols[2] || a.accent],
      GROUND_PATTERN[a.props] || 'diffuseColor.rgb *= uC1;');
    const geo = new THREE.CircleGeometry(R, 96);
    geo.rotateX(-Math.PI / 2);
    const floor = new THREE.Mesh(geo, mat);
    floor.receiveShadow = true;
    this.arenaGroup.add(floor);
    this.floorMat = mat;
    this.floorR = R;

    // where each fighter stands — painted, never raised, so nobody clips a kerb
    const M = new Mesher();
    for (const s of [-1, 1]) {
      const rg = new THREE.RingGeometry(2.25, 2.62, 40);
      rg.rotateX(-Math.PI / 2);
      const nb = rg.toNonIndexed(); rg.dispose(); nb.deleteAttribute('uv');
      M.add(nb, a.accent, { x: s * 4.6, y: 0.02, z: s * 1.2 });
      nb.dispose();
    }
    const marks = M.mesh(new THREE.MeshBasicMaterial({
      vertexColors: true, transparent: true, opacity: 0.38, depthWrite: false, side: THREE.DoubleSide
    }));
    if (marks) { marks.renderOrder = 1; this.arenaGroup.add(marks); this.ring = marks; }
  }

  _buildSea(a) {
    if (!a.sea) return;
    const s = a.sea;
    const seg = this.Q?.seaSeg || 64;
    const geo = new THREE.PlaneGeometry(760, 760, seg, seg);
    geo.rotateX(-Math.PI / 2);
    geo.deleteAttribute('uv');
    geo.deleteAttribute('normal');
    geo.computeVertexNormals();
    const mat = new THREE.ShaderMaterial({
      fog: true,
      uniforms: THREE.UniformsUtils.merge([
        THREE.UniformsLib.fog,
        {
          uT: { value: 0 },
          uWaveH: { value: s.waveH ?? 0.3 }, uWaveS: { value: s.waveS ?? 0.6 },
          uFrozen: { value: s.frozen ? 1 : 0 },
          uShallow: { value: new THREE.Color(s.shallow) },
          uDeep: { value: new THREE.Color(s.deep) },
          uFoam: { value: new THREE.Color(s.foam) },
          uSkyCol: { value: new THREE.Color(a.sky[1]) },
          uKeyDir: { value: this._sunDir.clone() },
          uKeyCol: { value: new THREE.Color(a.sun.color) },
          uFoamR: { value: (FLOOR_R[a.props] ?? 13) + 0.6 },
          uSat: { value: 0 }, uDark: { value: 1 }
        }
      ]),
      vertexShader: SEA_VERT, fragmentShader: SEA_FRAG
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.y = s.level;
    mesh.frustumCulled = false;
    mesh.renderOrder = -900;
    this.arenaGroup.add(mesh);
    this.sea = mesh;
  }

  _buildProps(a) {
    const build = PROPS[a.props];
    if (!build) return;
    const ctx = {
      a, P: a.palette || {}, D: a.deco || {},
      S: new Mesher(), L: new Mesher(), Gl: new Mesher(), C: new Mesher(), F: new Mesher(),
      lines: [], lineColor: '#20202c', r: rng(hashStr(a.id)), crowd: null
    };
    build(ctx);

    const solid = ctx.S.mesh(new THREE.MeshLambertMaterial({ vertexColors: true, flatShading: true }));
    if (solid) { solid.castShadow = true; solid.receiveShadow = true; this.arenaGroup.add(solid); }

    const lit = ctx.L.mesh(new THREE.MeshBasicMaterial({ vertexColors: true, fog: true }));
    if (lit) this.arenaGroup.add(lit);

    if (!ctx.Gl.empty) {
      const glow = ctx.Gl.mesh(new THREE.MeshBasicMaterial({
        vertexColors: true, transparent: true, opacity: 0.5, depthWrite: false,
        blending: THREE.AdditiveBlending, fog: false
      }));
      glow.renderOrder = 4;
      this.arenaGroup.add(glow);
      this.glow = glow;
    }

    if (!ctx.C.empty) {
      const ranges = ctx.C.ranges.slice();
      const g = tagParts(ctx.C.geometry(), ranges, CLOTH_WAVE);
      const m = new THREE.Mesh(g, clothMat());
      m.castShadow = true;
      this.arenaGroup.add(m);
      this.cloth = m;
    }

    if (!ctx.F.empty) {
      const ranges = ctx.F.ranges.slice();
      const g = tagParts(ctx.F.geometry(), ranges, WING_WAVE);
      const m = new THREE.Mesh(g, flockMat());
      m.frustumCulled = false;
      this.arenaGroup.add(m);
      this.flock = m;
    }

    if (ctx.lines.length) {
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(ctx.lines, 3));
      const m = new THREE.LineBasicMaterial({ color: new THREE.Color(ctx.lineColor), transparent: true, opacity: 0.85, fog: true });
      this.arenaGroup.add(new THREE.LineSegments(g, m));
    }

    if (ctx.crowd) this._buildCrowd(ctx.crowd);
  }

  _buildCrowd(spec) {
    const M = new Mesher();
    M.add(G.box, '#ffffff', { y: 0.32, sx: 0.42, sy: 0.62, sz: 0.30 });
    M.add(G.ico, '#ffffff', { y: 0.78, s: 0.30 });
    M.add(G.box, '#ffffff', { y: 0.55, sx: 0.62, sy: 0.16, sz: 0.24 });
    const geo = M.geometry();
    const rows = spec.rows, per = spec.per;
    const total = rows * per;
    const mesh = new THREE.InstancedMesh(geo, crowdMat(), total);
    mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    const seed = new Float32Array(total);
    const r = rng(9137);
    const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), sc = new THREE.Vector3(1, 1, 1), p = new THREE.Vector3();
    const pal = spec.colors || ['#ddd'];
    let i = 0;
    for (let row = 0; row < rows; row++) {
      const slot = spec.slots[Math.min(spec.slots.length - 1, Math.floor(row * spec.slots.length / rows))];
      const rr = slot.r + (row % 2) * 0.9;
      const y = slot.y + 0.05 + (row % 2) * 0.55;
      for (let k = 0; k < per; k++, i++) {
        const ang = (k / per) * TAU + r() * 0.05;
        p.set(Math.cos(ang) * rr, y, Math.sin(ang) * rr);
        q.setFromEuler(_eu.set(0, -ang + Math.PI / 2, 0));
        const s = 0.85 + r() * 0.4;
        sc.set(s, s * (0.9 + r() * 0.3), s);
        mesh.setMatrixAt(i, m4.compose(p, q, sc));
        _col.set(pal[(k + row * 3) % pal.length]).multiplyScalar(0.78 + r() * 0.4);
        mesh.setColorAt(i, _col);
        seed[i] = r();
      }
    }
    geo.setAttribute('aSeed', new THREE.InstancedBufferAttribute(seed, 1));
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    mesh.frustumCulled = false;
    this.arenaGroup.add(mesh);
    this.crowd = mesh;
  }

  /* ---------------- lighting ---------------- */

  /**
   * Key / fill / rim / hemi / eye. The rim and the eye light are camera-relative
   * and re-aimed every frame in `render`, which is the whole reason a toon-shaded
   * fighter never turns into a black cut-out no matter where the director puts
   * the camera.
   */
  _buildLights(a) {
    const L = a.light || {};
    const key = new THREE.DirectionalLight(new THREE.Color(a.sun.color), a.sun.intensity);
    key.position.set(...(L.key?.position || a.sun.position));
    key.castShadow = true;
    const sm = this.Q?.shadow || 1024;
    key.shadow.mapSize.set(sm, sm);
    key.shadow.camera.near = 1;
    key.shadow.camera.far = 70;
    key.shadow.camera.left = -20; key.shadow.camera.right = 20;
    key.shadow.camera.top = 20; key.shadow.camera.bottom = -20;
    key.shadow.bias = -0.0011;
    key.shadow.normalBias = 0.02;
    key.target.position.copy(FOCUS);
    this.scene.add(key, key.target);

    const f = L.fill || { color: '#8fb6ff', intensity: 0.6, position: [-10, 8, -7] };
    const fill = new THREE.DirectionalLight(new THREE.Color(f.color), f.intensity);
    fill.position.set(...f.position);
    fill.target.position.copy(FOCUS);
    this.scene.add(fill, fill.target);

    const r = L.rim || { color: '#ffffff', intensity: 2.0 };
    const rim = new THREE.DirectionalLight(new THREE.Color(r.color), r.intensity);
    rim.target.position.copy(FOCUS);
    this.scene.add(rim, rim.target);

    const rf = L.rimFix;
    let rimFix = null;
    if (rf) {
      rimFix = new THREE.DirectionalLight(new THREE.Color(rf.color), rf.intensity);
      rimFix.position.set(...rf.position);
      rimFix.target.position.copy(FOCUS);
      this.scene.add(rimFix, rimFix.target);
    }

    const h = L.hemi || { sky: a.sky[0], ground: a.ground, intensity: 0.6 };
    const hemi = new THREE.HemisphereLight(new THREE.Color(h.sky), new THREE.Color(h.ground), h.intensity);
    this.scene.add(hemi);

    // Camera-locked fill. Small, but it is the floor under every silhouette.
    const eye = new THREE.DirectionalLight(0xffffff, L.eye ?? 0.18);
    eye.target.position.copy(FOCUS);
    this.scene.add(eye, eye.target);

    this.lights = [key, key.target, fill, fill.target, rim, rim.target, hemi, eye, eye.target];
    if (rimFix) this.lights.push(rimFix, rimFix.target);
    this._L = { key, fill, rim, rimFix, hemi, eye };
    this._baseKey = a.sun.intensity;
    this._baseExposure = L.exposure ?? 1.0;
    this._baseFog = a.fog.density;
    this._baseFogColor = new THREE.Color(a.fog.color);
  }

  /* ---------------- weather + terrain ---------------- */

  /**
   * Built once and reused across arenas: every weather layer exists from the
   * start and is simply switched on. Nothing here allocates mid-battle.
   */
  _buildField() {
    const F = this.fieldGroup;
    this.fx = {
      rain: streakField(1400, { box: 46, h: 26, fall: 26, lx: 0.18, ly: -1, lz: 0.05, windX: 1.2, windZ: 0.2, color: '#bcd8f0', alpha: 0.42, seed: 3 }),
      hail: moteField(900, { box: 44, h: 24, fall: 12, size: 5.5, windX: 0.5, windZ: 0.3, color: '#eaf6ff', alpha: 0.85, soft: 0.55, seed: 5 }),
      sand: moteField(1500, { box: 52, h: 16, fall: 1.2, size: 4.0, windX: 7.5, windZ: 2.5, color: '#d8b47a', alpha: 0.36, soft: 1, seed: 9 }),
      sun:  moteField(320, { box: 34, h: 15, fall: 0.5, size: 3.4, windX: 0.7, windZ: 0.4, color: '#ffe9b8', alpha: 0.5, soft: 1, additive: true, seed: 13 }),
      fog:  moteField(500, { box: 48, h: 8, fall: 0.25, size: 26, windX: 1.1, windZ: 0.6, color: '#c2d2e0', alpha: 0.10, soft: 1, seed: 17 })
    };
    for (const m of Object.values(this.fx)) { m.visible = false; F.add(m); }

    // Terrain reads as a treatment on the ground rather than a new surface.
    const g = new THREE.CircleGeometry(13.4, 72);
    g.rotateX(-Math.PI / 2);
    const m = new THREE.MeshBasicMaterial({
      color: 0xffffff, transparent: true, opacity: 0, depthWrite: false,
      blending: THREE.AdditiveBlending, fog: true
    });
    const disc = new THREE.Mesh(g, m);
    disc.position.y = 0.012;
    disc.renderOrder = 2;
    disc.visible = false;
    F.add(disc);
    this.terrainDisc = disc;
  }

  /** @param {'none'|'rain'|'sun'|'sandstorm'|'hail'|'fog'} id */
  setWeather(id = 'none', opts = {}) {
    if (opts.auto !== true) this.autoField = false;
    if (this.weather === id) return;
    this.weather = id;
    const on = { rain: 'rain', hail: 'hail', sandstorm: 'sand', sun: 'sun', fog: 'fog' }[id] || null;
    for (const [k, m] of Object.entries(this.fx)) m.visible = (k === on);
    this._applyEnv();
  }

  /** @param {'none'|'blade'|'ember'|'psychic'|'haki'} id */
  setTerrain(id = 'none', opts = {}) {
    if (opts.auto !== true) this.autoField = false;
    this.terrain = id;
    const spec = TERRAIN_FX[id];
    this.terrainDisc.visible = !!spec;
    if (spec) this.terrainDisc.material.color.set(spec.c);
  }

  /** Re-grade the arena for the current weather. Safe to call any time. */
  _applyEnv() {
    const a = this.arena;
    if (!a || !this._L) return;
    const w = WEATHER_FX[this.weather] || null;

    if (this.scene.fog) {
      this.scene.fog.density = this._baseFog * (w?.fogMul ?? 1);
      this.scene.fog.color.copy(this._baseFogColor);
      if (w) this.scene.fog.color.lerp(new THREE.Color(w.c), w.tint);
    }
    this._L.key.intensity = this._baseKey * (w?.key ?? 1);
    this.renderer.toneMappingExposure = this._baseExposure * (w?.exp ?? 1);

    const dark = w?.dark ?? 1, sat = w?.sat ?? 0;
    if (this.sky?.material?.uniforms) {
      this.sky.material.uniforms.uDark.value = dark;
      this.sky.material.uniforms.uSat.value = sat;
      if (w?.haze !== undefined) this.sky.material.uniforms.uHaze.value = 0.55 + w.haze * 0.5;
    }
    if (this.sea?.material?.uniforms) {
      this.sea.material.uniforms.uDark.value = dark;
      this.sea.material.uniforms.uSat.value = sat;
    }
  }

  /** Follow the live battle's field state unless something set it explicitly. */
  _pollField(dt) {
    if (!this.autoField) return;
    this._pollT += dt;
    if (this._pollT < 0.25) return;
    this._pollT = 0;
    const f = window.__ARENA?.battle?.raw?.()?.field;
    if (!f) return;
    if (f.weather?.id !== this.weather) this.setWeather(f.weather?.id || 'none', { auto: true });
    if (f.terrain?.id !== this.terrain) this.setTerrain(f.terrain?.id || 'none', { auto: true });
  }

  /* ---------------- frame ---------------- */

  render(dt) {
    const t = (this.time += dt);
    const cam = this.camera;

    this._pollField(dt);

    // animated materials
    if (this.sky?.material?.uniforms) this.sky.material.uniforms.uT.value = t;
    if (this.sea?.material?.uniforms) this.sea.material.uniforms.uT.value = t;
    for (const o of [this.floorMat, this.cloth?.material, this.flock?.material, this.crowd?.material]) {
      if (o?.userData?.u?.uT) o.userData.u.uT.value = t;
    }
    if (this.glow) this.glow.material.opacity = 0.42 + Math.sin(t * 2.1) * 0.08;
    if (this.terrainDisc?.visible) {
      this.terrainDisc.material.opacity = 0.10 + Math.sin(t * 1.7) * 0.035;
    }

    // camera shake, applied around the director's base position
    const [sx, sy, sz] = this.feel.shakeOffset();
    const base = cam.userData.basePos || cam.position;
    cam.position.set(base.x + sx, base.y + sy, base.z + sz);

    // impact zoom — feel computes it, this is the only thing that reads it
    let restoreFov = null;
    if (!this.feel.reduced && this.feel.zoomPunch > 0.0005) {
      restoreFov = cam.fov;
      cam.fov = Math.max(12, cam.fov - this.feel.zoomPunch * 40);
      cam.updateProjectionMatrix();
    }

    // camera-relative lights: rim from behind the subject, eye light from the lens
    if (this._L) {
      const toCam = _sv1.copy(cam.position).sub(FOCUS);
      toCam.y = Math.max(toCam.y, 0.5);
      this._L.rim.position.copy(FOCUS).sub(toCam).setY(FOCUS.y + toCam.length() * 0.55);
      this._L.eye.position.copy(cam.position);
    }

    // weather fields follow the camera so the volume is always around the action
    for (const m of Object.values(this.fx)) {
      if (!m.visible) continue;
      const u = m.material.uniforms;
      u.uT.value = t;
      u.uCam.value.copy(cam.position);
      if (u.uPx) u.uPx.value = this.renderer.domElement.height * 0.5;
    }

    this.renderer.info.reset();
    if (this._composer) this._composer.render(dt);
    else this.renderer.render(this.scene, cam);

    if (restoreFov !== null) { cam.fov = restoreFov; cam.updateProjectionMatrix(); }

    const info = this.renderer.info.render;
    this.stats.drawCalls = info.calls;
    this.stats.tris = info.triangles;
  }

  /**
   * Frame rate must be measured against the wall clock, not the game clock.
   * The loop clamps dt to 0.05s so a slow frame cannot teleport the
   * simulation; feeding that clamped value back in here reported 20fps on a
   * machine actually running 7, which is exactly the number you must not get
   * wrong when deciding whether the scene is too heavy.
   */
  tickStats() {
    const now = performance.now();
    if (this._fpsT === undefined) { this._fpsT = now; this.stats.frames = 0; return; }
    this.stats.frames++;
    const elapsed = (now - this._fpsT) / 1000;
    if (elapsed >= 0.5) {
      this.stats.fps = Math.round(this.stats.frames / elapsed);
      this.stats.frames = 0;
      this._fpsT = now;
    }
  }
}

const _sv1 = new THREE.Vector3();
