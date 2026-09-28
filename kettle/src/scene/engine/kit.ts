/**
 * Shared building kit: cached materials, geometry helpers, blob shadows and a
 * static-merge pass that collapses each prop into a handful of draw calls.
 */
import {
  BufferAttribute,
  BufferGeometry,
  CapsuleGeometry,
  Color,
  CylinderGeometry,
  DoubleSide,
  FrontSide,
  Group,
  LatheGeometry,
  Matrix4,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  NormalBlending,
  AdditiveBlending,
  Object3D,
  PlaneGeometry,
  SphereGeometry,
  TorusGeometry,
  Vector2,
  type Material,
  type Side,
  type Texture,
} from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { TextureBank } from './textures';

export interface MatOpts {
  rough?: number;
  metal?: number;
  emissive?: string;
  emissiveIntensity?: number;
  side?: Side;
  map?: Texture;
  flat?: boolean;
  transparent?: boolean;
  opacity?: number;
}

export interface Place {
  p?: [number, number, number];
  r?: [number, number, number];
  s?: number | [number, number, number];
  cast?: boolean;
  receive?: boolean;
}

export class Kit {
  readonly tex = new TextureBank();
  private mats = new Map<string, Material>();
  private geos = new Set<BufferGeometry>();
  private invisible = new MeshBasicMaterial({ visible: false });
  /** Materials callers animate — never baked into vertex colors. */
  private uniques = new Set<Material>();
  /** Shadow casting is only enabled in the high tier. */
  shadows: boolean;

  constructor(shadows: boolean) {
    this.shadows = shadows;
  }

  // ---------- materials ----------

  mat(color: string, o: MatOpts = {}): MeshStandardMaterial {
    const key = `std|${color}|${o.rough ?? 0.82}|${o.metal ?? 0}|${o.emissive ?? ''}|${o.emissiveIntensity ?? 1}|${o.side ?? FrontSide}|${o.map?.uuid ?? ''}|${o.flat ? 1 : 0}|${o.transparent ? o.opacity : ''}`;
    let m = this.mats.get(key) as MeshStandardMaterial | undefined;
    if (!m) {
      m = new MeshStandardMaterial({
        color: new Color(color),
        roughness: o.rough ?? 0.82,
        metalness: o.metal ?? 0,
        side: o.side ?? FrontSide,
        map: o.map ?? null,
        flatShading: o.flat ?? false,
      });
      if (o.emissive) {
        m.emissive = new Color(o.emissive);
        m.emissiveIntensity = o.emissiveIntensity ?? 1;
      }
      if (o.transparent) {
        m.transparent = true;
        m.opacity = o.opacity ?? 1;
        m.depthWrite = false;
      }
      this.mats.set(key, m);
    }
    return m;
  }

  /** A material this caller owns (e.g. animated emissive). Still disposed with the kit. */
  uniqueMat(color: string, o: MatOpts = {}): MeshStandardMaterial {
    const m = new MeshStandardMaterial({
      color: new Color(color),
      roughness: o.rough ?? 0.82,
      metalness: o.metal ?? 0,
      side: o.side ?? FrontSide,
      map: o.map ?? null,
    });
    if (o.emissive) {
      m.emissive = new Color(o.emissive);
      m.emissiveIntensity = o.emissiveIntensity ?? 1;
    }
    if (o.transparent) {
      m.transparent = true;
      m.opacity = o.opacity ?? 1;
      m.depthWrite = false;
    }
    this.mats.set(`unique|${m.uuid}`, m);
    this.uniques.add(m);
    return m;
  }

  /** Shared vertex-colored material used when merging plain colored parts. */
  private vcMat(rough: number, metal: number, side: Side): MeshStandardMaterial {
    const key = `vc|${rough}|${metal}|${side}`;
    let m = this.mats.get(key) as MeshStandardMaterial | undefined;
    if (!m) {
      m = new MeshStandardMaterial({ color: 0xffffff, vertexColors: true, roughness: rough, metalness: metal, side });
      this.mats.set(key, m);
    }
    return m;
  }

  private bakeable(mat: Material): mat is MeshStandardMaterial {
    const m = mat as MeshStandardMaterial;
    return (
      m.isMeshStandardMaterial === true &&
      !this.uniques.has(m) &&
      !m.map &&
      !m.transparent &&
      !m.vertexColors &&
      !m.flatShading &&
      (m.emissive.r + m.emissive.g + m.emissive.b === 0 || m.emissiveIntensity === 0)
    );
  }

  /** Unlit material (glows, sky props, decals). */
  basic(color: string, o: { map?: Texture; opacity?: number; additive?: boolean; side?: Side; depthWrite?: boolean; unique?: boolean; fog?: boolean } = {}): MeshBasicMaterial {
    const key = `basic|${color}|${o.map?.uuid ?? ''}|${o.opacity ?? 1}|${o.additive ? 1 : 0}|${o.side ?? FrontSide}|${o.depthWrite ?? ''}`;
    let m = o.unique ? undefined : (this.mats.get(key) as MeshBasicMaterial | undefined);
    if (!m) {
      const transparent = o.opacity !== undefined || o.additive || !!o.map;
      m = new MeshBasicMaterial({
        color: new Color(color),
        map: o.map ?? null,
        transparent,
        opacity: o.opacity ?? 1,
        blending: o.additive ? AdditiveBlending : NormalBlending,
        side: o.side ?? FrontSide,
        depthWrite: o.depthWrite ?? !transparent,
      });
      m.toneMapped = false;
      this.mats.set(o.unique ? `unique|${m.uuid}` : key, m);
    }
    return m;
  }

  track<T extends BufferGeometry>(g: T): T {
    this.geos.add(g);
    return g;
  }

  // ---------- geometry ----------

  rbox(w: number, h: number, d: number, r = 0.06, seg = 3): BufferGeometry {
    const rr = Math.min(r, Math.min(w, h, d) / 2 - 1e-4);
    return this.track(new RoundedBoxGeometry(w, h, d, seg, Math.max(rr, 1e-4)));
  }

  cyl(rt: number, rb: number, h: number, seg = 24, open = false): BufferGeometry {
    return this.track(new CylinderGeometry(rt, rb, h, seg, 1, open));
  }

  sphere(r: number, ws = 20, hs = 14): BufferGeometry {
    return this.track(new SphereGeometry(r, ws, hs));
  }

  capsule(r: number, len: number, cap = 6, rad = 16): BufferGeometry {
    return this.track(new CapsuleGeometry(r, len, cap, rad));
  }

  torus(r: number, tube: number, arc = Math.PI * 2, rs = 10, ts = 28): BufferGeometry {
    return this.track(new TorusGeometry(r, tube, rs, ts, arc));
  }

  lathe(pts: [number, number][], seg = 28): BufferGeometry {
    return this.track(new LatheGeometry(pts.map(([x, y]) => new Vector2(x, y)), seg));
  }

  plane(w: number, h: number): BufferGeometry {
    return this.track(new PlaneGeometry(w, h));
  }

  /** Smooth lathe profile from a few control points (Catmull-ish resample). */
  smoothLathe(ctrl: [number, number][], steps = 4, seg = 28): BufferGeometry {
    const pts: [number, number][] = [];
    for (let i = 0; i < ctrl.length - 1; i++) {
      const p0 = ctrl[Math.max(0, i - 1)];
      const p1 = ctrl[i];
      const p2 = ctrl[i + 1];
      const p3 = ctrl[Math.min(ctrl.length - 1, i + 2)];
      for (let s = 0; s < steps; s++) {
        const t = s / steps;
        const t2 = t * t;
        const t3 = t2 * t;
        const f = (a: number, b: number, c: number, d: number) =>
          0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3);
        pts.push([Math.max(0, f(p0[0], p1[0], p2[0], p3[0])), f(p0[1], p1[1], p2[1], p3[1])]);
      }
    }
    pts.push(ctrl[ctrl.length - 1]);
    return this.lathe(pts, seg);
  }

  // ---------- objects ----------

  mesh(geo: BufferGeometry, mat: Material, pl: Place = {}): Mesh {
    const m = new Mesh(geo, mat);
    place(m, pl);
    m.castShadow = this.shadows && (pl.cast ?? true);
    m.receiveShadow = pl.receive ?? true;
    return m;
  }

  /** Soft contact shadow on the floor (or any horizontal surface at y). */
  blob(x: number, z: number, sx: number, sz: number, strength = 0.5, y = 0.012): Mesh {
    const key = Math.round(strength * 10) / 10;
    const mat = this.basic('#2A1830', { map: this.tex.soft(), opacity: key, depthWrite: false });
    const m = new Mesh(this.unitPlane(), mat);
    m.rotation.x = -Math.PI / 2;
    m.position.set(x, y, z);
    m.scale.set(sx, sz, 1);
    m.renderOrder = 1;
    m.receiveShadow = false;
    m.castShadow = false;
    return m;
  }

  private _unitPlane?: BufferGeometry;
  unitPlane(): BufferGeometry {
    if (!this._unitPlane) this._unitPlane = this.track(new PlaneGeometry(1, 1));
    return this._unitPlane;
  }

  /** Invisible raycast proxy (a box) used for tapping items. */
  proxy(w: number, h: number, d: number, pl: Place = {}): Mesh {
    const m = new Mesh(this.rbox(w, h, d, 0.01, 1), this.invisible);
    place(m, pl);
    m.userData.proxy = true;
    return m;
  }

  /**
   * Collapse every static descendant mesh of `root` into one mesh per
   * (material, shadow flags). Descendants under an object with
   * `userData.dyn = true` (animated parts) are left alone.
   */
  mergeStatic(root: Object3D): void {
    root.updateMatrixWorld(true);
    const inv = new Matrix4().copy(root.matrixWorld).invert();
    const buckets = new Map<string, { mat: Material; cast: boolean; receive: boolean; order: number; geos: BufferGeometry[] }>();
    const victims: Mesh[] = [];
    const visit = (o: Object3D, dyn: boolean) => {
      // The root's own `dyn` flag only matters to *its* parent's merge.
      const isDyn = dyn || (o !== root && o.userData.dyn === true);
      const m = o as Mesh;
      if (m.isMesh && !isDyn && o !== root && !o.userData.proxy && !(m.geometry as { isInstancedBufferGeometry?: boolean }).isInstancedBufferGeometry) {
        const mat = m.material as Material;
        if (!Array.isArray(m.material) && !(mat as { isShaderMaterial?: boolean }).isShaderMaterial) {
          const bake = this.bakeable(mat);
          const target = bake ? this.vcMat(quant(mat.roughness, ROUGH), quant(mat.metalness, METAL), mat.side) : mat;
          // One bucket per material: if any part casts, the merged mesh casts.
          const key = `${target.uuid}|${m.renderOrder}`;
          let b = buckets.get(key);
          if (!b) {
            b = { mat: target, cast: false, receive: false, order: m.renderOrder, geos: [] };
            buckets.set(key, b);
          }
          b.cast ||= m.castShadow;
          b.receive ||= m.receiveShadow;
          const g = normalizeGeo(m.geometry, bake ? mat.color : undefined);
          g.applyMatrix4(new Matrix4().multiplyMatrices(inv, m.matrixWorld));
          b.geos.push(g);
          victims.push(m);
        }
      }
      for (const c of o.children) visit(c, isDyn);
    };
    visit(root, false);
    for (const v of victims) v.parent?.remove(v);
    buckets.forEach((b) => {
      if (b.geos.length === 0) return;
      const merged = b.geos.length === 1 ? b.geos[0] : mergeGeometries(b.geos, false);
      if (b.geos.length > 1) b.geos.forEach((g) => g.dispose());
      if (!merged) return;
      this.track(merged);
      const m = new Mesh(merged, b.mat);
      m.castShadow = b.cast;
      m.receiveShadow = b.receive;
      m.renderOrder = b.order;
      root.add(m);
    });
  }

  dispose(): void {
    this.geos.forEach((g) => g.dispose());
    this.geos.clear();
    this.mats.forEach((m) => m.dispose());
    this.mats.clear();
    this.invisible.dispose();
    this.tex.dispose();
  }
}

/** Baked materials snap to a few finishes so props collapse into few draw calls. */
const ROUGH = [0.32, 0.58, 0.9];
const METAL = [0, 0.4];
function quant(v: number, levels: number[]) {
  let best = levels[0];
  for (const l of levels) if (Math.abs(l - v) < Math.abs(best - v)) best = l;
  return best;
}

export function place(o: Object3D, pl: Place): Object3D {
  if (pl.p) o.position.set(pl.p[0], pl.p[1], pl.p[2]);
  if (pl.r) o.rotation.set(pl.r[0], pl.r[1], pl.r[2]);
  if (pl.s !== undefined) {
    if (typeof pl.s === 'number') o.scale.setScalar(pl.s);
    else o.scale.set(pl.s[0], pl.s[1], pl.s[2]);
  }
  return o;
}

export function group(pl: Place = {}, ...children: Object3D[]): Group {
  const g = new Group();
  place(g, pl);
  for (const c of children) g.add(c);
  return g;
}

/** Clone with only position/normal/uv and a guaranteed index, so anything can merge. */
function normalizeGeo(src: BufferGeometry, color?: Color): BufferGeometry {
  const g = new BufferGeometry();
  g.setAttribute('position', src.getAttribute('position').clone());
  const uv = src.getAttribute('uv');
  const count = src.getAttribute('position').count;
  g.setAttribute('uv', uv ? uv.clone() : new BufferAttribute(new Float32Array(count * 2), 2));
  if (src.index) g.setIndex(src.index.clone());
  else {
    const idx = new (count > 65535 ? Uint32Array : Uint16Array)(count);
    for (let i = 0; i < count; i++) idx[i] = i;
    g.setIndex(new BufferAttribute(idx, 1));
  }
  const n = src.getAttribute('normal');
  if (n) g.setAttribute('normal', n.clone());
  else g.computeVertexNormals();
  if (color) {
    const c = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      c[i * 3] = color.r;
      c[i * 3 + 1] = color.g;
      c[i * 3 + 2] = color.b;
    }
    g.setAttribute('color', new BufferAttribute(c, 3));
  }
  return g;
}

export { DoubleSide };
