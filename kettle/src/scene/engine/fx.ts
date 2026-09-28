/**
 * GPU-driven effects. Every system animates in its vertex shader from a
 * shared `uTime` uniform, so the CPU only bumps a few uniforms per frame and
 * nothing allocates in the render loop.
 */
import {
  AdditiveBlending,
  Color,
  InstancedBufferAttribute,
  InstancedBufferGeometry,
  Mesh,
  NormalBlending,
  PlaneGeometry,
  ShaderMaterial,
  Vector3,
  type IUniform,
  type Texture,
} from 'three';

export type U = Record<string, IUniform>;

function instanced(count: number, attrs: Record<string, { size: number; fill: (i: number, out: number[]) => void }>) {
  const base = new PlaneGeometry(1, 1);
  const g = new InstancedBufferGeometry();
  g.index = base.index;
  g.setAttribute('position', base.getAttribute('position'));
  g.setAttribute('uv', base.getAttribute('uv'));
  g.instanceCount = count;
  for (const [name, a] of Object.entries(attrs)) {
    const arr = new Float32Array(count * a.size);
    const tmp: number[] = [];
    for (let i = 0; i < count; i++) {
      tmp.length = 0;
      a.fill(i, tmp);
      for (let k = 0; k < a.size; k++) arr[i * a.size + k] = tmp[k] ?? 0;
    }
    g.setAttribute(name, new InstancedBufferAttribute(arr, a.size));
  }
  return g;
}

/** Deterministic pseudo-random for stable layouts / screenshots. */
export function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const HASH = /* glsl */ `
float h11(float n){ return fract(sin(n) * 43758.5453123); }
`;

// ---------------------------------------------------------------- steam

export interface SteamFX {
  mesh: Mesh;
  u: {
    uTime: IUniform<number>;
    uIntensity: IUniform<number>;
    uBurst: IUniform<number>;
    uOrigin: IUniform<Vector3>;
    uDir: IUniform<Vector3>;
    uColor: IUniform<Color>;
    uOpacity: IUniform<number>;
    uSize: IUniform<number>;
    uRise: IUniform<number>;
    uLife: IUniform<number>;
    uSpread: IUniform<number>;
  };
}

export function makeSteam(map: Texture, count: number, seed: number, o: { size: number; rise: number; life: number; spread: number; opacity: number }): SteamFX {
  const r = rng(seed);
  const g = instanced(count, {
    aSeed: { size: 1, fill: (_i, out) => out.push(r()) },
    aIdx: { size: 1, fill: (i, out) => out.push((i + 0.5) / count) },
  });
  const u = {
    uTime: { value: 0 },
    uIntensity: { value: 0 },
    uBurst: { value: 0 },
    uOrigin: { value: new Vector3() },
    uDir: { value: new Vector3(1, 0, 0) },
    uColor: { value: new Color('#ffffff') },
    uOpacity: { value: o.opacity },
    uSize: { value: o.size },
    uRise: { value: o.rise },
    uLife: { value: o.life },
    uSpread: { value: o.spread },
    uMap: { value: map },
  };
  const mat = new ShaderMaterial({
    uniforms: u,
    transparent: true,
    depthWrite: false,
    blending: NormalBlending,
    toneMapped: false,
    vertexShader: /* glsl */ `
      attribute float aSeed;
      attribute float aIdx;
      uniform float uTime, uIntensity, uBurst, uSize, uRise, uLife, uSpread, uOpacity;
      uniform vec3 uOrigin, uDir;
      varying float vAlpha;
      varying vec2 vUv;
      ${HASH}
      void main() {
        float life = uLife * (0.75 + 0.5 * aSeed) * (1.0 - 0.35 * uBurst);
        float t = uTime / life + aSeed * 13.0;
        float age = fract(t);
        float cyc = floor(t);
        float r1 = h11(cyc * 7.13 + aSeed * 91.7);
        float r2 = h11(cyc * 3.71 + aSeed * 17.3);
        float act = smoothstep(aIdx - 0.12, aIdx + 0.02, uIntensity);
        float ease = 1.0 - (1.0 - age) * (1.0 - age);
        vec3 p = uOrigin + uDir * ease * (0.12 + 0.9 * uBurst);
        p.y += age * uRise * (1.0 + 0.8 * uBurst);
        float wob = age * uSpread;
        p.x += sin(age * 5.0 + r1 * 6.283 + uTime * 0.6) * wob * 0.6 + (r1 - 0.5) * wob;
        p.z += cos(age * 4.0 + r2 * 6.283 + uTime * 0.5) * wob * 0.6 + (r2 - 0.5) * wob;
        float size = uSize * (0.28 + 1.2 * age) * (0.8 + 0.4 * r2) * (1.0 + uBurst * 0.6);
        float fade = smoothstep(0.0, 0.12, age) * (1.0 - smoothstep(0.4, 1.0, age));
        vAlpha = uOpacity * act * fade;
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        float a = r1 * 6.283 + age * (r2 - 0.5) * 2.0;
        vec2 q = position.xy;
        q = mat2(cos(a), sin(a), -sin(a), cos(a)) * q;
        mv.xy += q * size;
        gl_Position = projectionMatrix * mv;
        vUv = uv;
      }`,
    fragmentShader: /* glsl */ `
      uniform sampler2D uMap;
      uniform vec3 uColor;
      varying float vAlpha;
      varying vec2 vUv;
      void main() {
        float a = texture2D(uMap, vUv).a * vAlpha;
        if (a < 0.004) discard;
        gl_FragColor = vec4(uColor, a);
        #include <colorspace_fragment>
      }`,
  });
  const mesh = new Mesh(g, mat);
  mesh.frustumCulled = false;
  mesh.renderOrder = 5;
  return { mesh, u };
}

// ---------------------------------------------------------------- outside weather

export interface FieldFX {
  mesh: Mesh;
  u: { uTime: IUniform<number>; uAlpha: IUniform<number>; uColor: IUniform<Color> };
}

function field(
  count: number,
  seed: number,
  min: Vector3,
  size: Vector3,
  body: string,
  frag: string,
  opts: { additive?: boolean; map?: Texture; color: string; alpha: number },
): FieldFX {
  const r = rng(seed);
  const g = instanced(count, { aOff: { size: 4, fill: (_i, out) => out.push(r(), r(), r(), r()) } });
  const u = {
    uTime: { value: 0 },
    uAlpha: { value: opts.alpha },
    uColor: { value: new Color(opts.color) },
    uMin: { value: min },
    uSize: { value: size },
    uMap: { value: opts.map ?? null },
  };
  const mat = new ShaderMaterial({
    uniforms: u,
    transparent: true,
    depthWrite: false,
    toneMapped: false,
    blending: opts.additive ? AdditiveBlending : NormalBlending,
    vertexShader: /* glsl */ `
      attribute vec4 aOff;
      uniform float uTime;
      uniform vec3 uMin, uSize;
      varying vec2 vUv;
      varying float vA;
      void main() {
        vec3 p; vec2 sz; float a = 1.0;
        ${body}
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        mv.xy += position.xy * sz;
        gl_Position = projectionMatrix * mv;
        vUv = uv;
        vA = a;
      }`,
    fragmentShader: /* glsl */ `
      uniform float uAlpha;
      uniform vec3 uColor;
      uniform sampler2D uMap;
      varying vec2 vUv;
      varying float vA;
      void main() {
        float m = 1.0;
        ${frag}
        float al = m * vA * uAlpha;
        if (al < 0.004) discard;
        gl_FragColor = vec4(uColor, al);
        #include <colorspace_fragment>
      }`,
  });
  const mesh = new Mesh(g, mat);
  mesh.frustumCulled = false;
  mesh.renderOrder = 2;
  return { mesh, u };
}

export function makeRain(min: Vector3, size: Vector3): FieldFX {
  return field(
    140,
    11,
    min,
    size,
    `float y = fract(aOff.y - uTime * (0.9 + 0.5 * aOff.w));
     p = uMin + vec3(aOff.x, y, aOff.z) * uSize;
     p.x += y * 0.35;
     sz = vec2(0.026 + 0.012 * aOff.w, 0.3 + 0.2 * aOff.w);
     a = 0.45 + 0.55 * aOff.z;`,
    `float edge = 1.0 - abs(vUv.x * 2.0 - 1.0);
     m = edge * smoothstep(0.0, 0.8, vUv.y);`,
    { color: '#D8E6FF', alpha: 0.7 },
  );
}

export function makeSnow(min: Vector3, size: Vector3, map: Texture): FieldFX {
  return field(
    110,
    23,
    min,
    size,
    `float y = fract(aOff.y - uTime * (0.06 + 0.05 * aOff.w));
     p = uMin + vec3(aOff.x, y, aOff.z) * uSize;
     p.x += sin(uTime * (0.6 + aOff.w) + aOff.x * 40.0) * 0.08;
     float s = 0.035 + 0.045 * aOff.w;
     sz = vec2(s);
     a = 0.55 + 0.45 * aOff.z;`,
    `m = texture2D(uMap, vUv).a;`,
    { color: '#FFFFFF', alpha: 0.95, map },
  );
}

export function makeFireflies(min: Vector3, size: Vector3, map: Texture): FieldFX {
  return field(
    14,
    37,
    min,
    size,
    `float t = uTime * (0.12 + 0.1 * aOff.w) + aOff.x * 30.0;
     p = uMin + vec3(aOff.x + 0.08 * sin(t * 1.3), aOff.y + 0.12 * sin(t), aOff.z) * uSize;
     sz = vec2(0.16 + 0.08 * aOff.w);
     a = pow(0.5 + 0.5 * sin(uTime * (1.2 + aOff.w) + aOff.y * 20.0), 3.0);`,
    `m = texture2D(uMap, vUv).a;`,
    { color: '#FFE07A', alpha: 0.9, additive: true, map },
  );
}

// ---------------------------------------------------------------- glows

export interface GlowFX {
  mesh: Mesh;
  u: { uTime: IUniform<number>; uOn: IUniform<number>; uTwinkle: IUniform<number> };
}

/**
 * Instanced camera-facing glows (fairy lights, bulbs). `aCol` per instance,
 * `aPhase` for twinkle.
 */
export function makeGlows(points: { p: Vector3; c: Color; s: number }[], map: Texture, seed = 5): GlowFX {
  const r = rng(seed);
  const g = instanced(points.length, {
    aPos: { size: 3, fill: (i, out) => out.push(points[i].p.x, points[i].p.y, points[i].p.z) },
    aCol: { size: 3, fill: (i, out) => out.push(points[i].c.r, points[i].c.g, points[i].c.b) },
    aMisc: { size: 2, fill: (i, out) => out.push(points[i].s, r()) },
  });
  const u = { uTime: { value: 0 }, uOn: { value: 1 }, uTwinkle: { value: 1 }, uMap: { value: map } };
  const mat = new ShaderMaterial({
    uniforms: u,
    transparent: true,
    depthWrite: false,
    toneMapped: false,
    blending: AdditiveBlending,
    vertexShader: /* glsl */ `
      attribute vec3 aPos;
      attribute vec3 aCol;
      attribute vec2 aMisc;
      uniform float uTime, uOn, uTwinkle;
      varying vec3 vCol;
      varying vec2 vUv;
      void main() {
        float tw = 0.72 + 0.28 * sin(uTime * (1.1 + aMisc.y * 1.7) + aMisc.y * 40.0);
        tw = mix(1.0, tw, uTwinkle);
        vCol = aCol * uOn * tw;
        vec4 mv = modelViewMatrix * vec4(aPos, 1.0);
        mv.xy += position.xy * aMisc.x * (0.85 + 0.15 * tw);
        gl_Position = projectionMatrix * mv;
        vUv = uv;
      }`,
    fragmentShader: /* glsl */ `
      uniform sampler2D uMap;
      varying vec3 vCol;
      varying vec2 vUv;
      void main() {
        float a = texture2D(uMap, vUv).a;
        gl_FragColor = vec4(vCol * a, 1.0);
        #include <colorspace_fragment>
      }`,
  });
  const mesh = new Mesh(g, mat);
  mesh.frustumCulled = false;
  mesh.renderOrder = 6;
  return { mesh, u };
}

// ---------------------------------------------------------------- sky + glass

export function makeSkyMaterial() {
  const u = {
    uTop: { value: new Color() },
    uMid: { value: new Color() },
    uBottom: { value: new Color() },
    uStars: { value: 0 },
    uTime: { value: 0 },
  };
  const mat = new ShaderMaterial({
    uniforms: u,
    toneMapped: false,
    depthWrite: true,
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: /* glsl */ `
      uniform vec3 uTop, uMid, uBottom;
      uniform float uStars, uTime;
      varying vec2 vUv;
      float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      void main() {
        float y = vUv.y;
        vec3 c = mix(uBottom, uMid, smoothstep(0.05, 0.5, y));
        c = mix(c, uTop, smoothstep(0.5, 0.95, y));
        // stars
        vec2 g = vUv * vec2(46.0, 34.0);
        vec2 id = floor(g);
        vec2 f = fract(g) - 0.5;
        float r = hash(id);
        vec2 o = vec2(hash(id + 7.1), hash(id + 3.3)) - 0.5;
        float d = length(f - o * 0.6);
        float tw = 0.6 + 0.4 * sin(uTime * (0.8 + r * 2.0) + r * 60.0);
        float star = step(0.84, r) * smoothstep(0.09, 0.0, d) * tw * smoothstep(0.25, 0.7, y);
        c += vec3(1.0, 0.96, 0.86) * star * uStars;
        gl_FragColor = vec4(c, 1.0);
        #include <colorspace_fragment>
      }`,
  });
  return { mat, u };
}

/** Window glass: faint tint, condensation at the bottom, and rain drops that slide. */
export function makeGlassMaterial() {
  const u = {
    uTime: { value: 0 },
    uRain: { value: 0 },
    uFrost: { value: 0 },
    uTint: { value: new Color('#dfe8ff') },
    uAspect: { value: 1 },
  };
  const mat = new ShaderMaterial({
    uniforms: u,
    transparent: true,
    depthWrite: false,
    toneMapped: false,
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: /* glsl */ `
      uniform float uTime, uRain, uFrost, uAspect;
      uniform vec3 uTint;
      varying vec2 vUv;
      float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      float drops(vec2 uv, float scale, float t, float seed) {
        vec2 g = uv * vec2(scale, scale * 1.4);
        vec2 id = floor(g);
        float r = hash(id + seed);
        float slide = step(0.72, r) * fract(t * (0.05 + r * 0.08) + r * 9.0);
        g.y += slide * 3.0;
        id = floor(g);
        r = hash(id + seed);
        vec2 f = fract(g) - 0.5;
        vec2 o = vec2(hash(id + 1.7 + seed), hash(id + 5.3 + seed)) - 0.5;
        vec2 dv = (f - o * 0.55) * vec2(1.0, 0.85);
        float d = length(dv);
        float size = 0.07 + 0.1 * hash(id + 9.1 + seed);
        return step(0.45, r) * smoothstep(size, size * 0.55, d);
      }
      void main() {
        vec2 uv = vec2(vUv.x * uAspect, vUv.y);
        float a = 0.08;
        vec3 col = uTint;
        float d = drops(uv, 9.0, uTime, 0.0) + drops(uv, 15.0, uTime, 4.0) * 0.8;
        a += d * 0.55 * uRain;
        col = mix(col, vec3(1.0), d * uRain * 0.6);
        float fog = smoothstep(0.35, 0.0, vUv.y) * uFrost;
        a += fog * 0.35;
        col = mix(col, vec3(1.0), fog);
        gl_FragColor = vec4(col, a);
        #include <colorspace_fragment>
      }`,
  });
  return { mat, u };
}
