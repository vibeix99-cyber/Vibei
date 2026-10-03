/**
 * NookEngine — owns the WebGL renderer, the scene graph and the render loop.
 * Framework-free; the React host (NookScene.tsx) forwards props into
 * `setState` and wires size / visibility / pointer events.
 */
import {
  AdditiveBlending,
  Color,
  DirectionalLight,
  Group,
  HemisphereLight,
  MathUtils,
  type Material,
  Mesh,
  MeshBasicMaterial,
  NeutralToneMapping,
  Object3D,
  PCFShadowMap,
  PerspectiveCamera,
  PointLight,
  Raycaster,
  Scene,
  SpotLight,
  Sprite,
  SpriteMaterial,
  SRGBColorSpace,
  Vector2,
  Vector3,
  WebGLRenderer,
} from 'three';
import type { SceneMode, SceneWeather } from '../types';
import { Kit } from './kit';
import { C, MOODS, type Mood, type ResolvedTime } from './palette';
import { ROOM, SPOTS } from './layout';
import { buildRoom, type RoomParts } from './room';
import { buildKettle, disposeNotes, type KettleParts } from './kettle';
import { BUILDERS, type ItemBuild, type TableTop } from './items';
import { buildChai, type Chai } from './chai';

export type Quality = 'high' | 'low';

export interface EngineState {
  mode: SceneMode;
  progress: number;
  whistling: boolean;
  weather: SceneWeather;
  time: ResolvedTime;
  items: string[];
  highlightItem: string | null;
  interactive: boolean;
  reducedMotion: boolean;
  /** Exposure multiplier (dark app theme dims the room a little; 1 = as designed). */
  dim: number;
}

export interface EngineOptions {
  canvas: HTMLCanvasElement;
  quality: Quality;
  /** 'auto' lets the engine drop to low if frames are slow. */
  adaptive: boolean;
  mobile: boolean;
  /** CPU rasterizer (SwiftShader, llvmpipe…): lower frame cap. */
  software?: boolean;
  onItemSelect?: (id: string | null) => void;
  onFirstFrame?: () => void;
  onContextLost?: () => void;
  onQualityChange?: (q: Quality) => void;
}

/** Numeric mood for blending without allocations. */
interface MoodN {
  skyTop: Color;
  skyMid: Color;
  skyBottom: Color;
  hillFar: Color;
  hillNear: Color;
  hemiSky: Color;
  hemiGround: Color;
  winColor: Color;
  steam: Color;
  stars: number;
  moon: number;
  sun: number;
  hemi: number;
  lamp: number;
  win: number;
  houseLight: number;
}

function toN(m: Mood): MoodN {
  return {
    skyTop: new Color(m.skyTop),
    skyMid: new Color(m.skyMid),
    skyBottom: new Color(m.skyBottom),
    hillFar: new Color(m.hillFar),
    hillNear: new Color(m.hillNear),
    hemiSky: new Color(m.hemiSky),
    hemiGround: new Color(m.hemiGround),
    winColor: new Color(m.winColor),
    steam: new Color(m.steam),
    stars: m.stars,
    moon: m.moon,
    sun: m.sun,
    hemi: m.hemi,
    lamp: m.lamp,
    win: m.win,
    houseLight: m.houseLight,
  };
}

function lerpMood(out: MoodN, a: MoodN, b: MoodN, t: number) {
  out.skyTop.copy(a.skyTop).lerp(b.skyTop, t);
  out.skyMid.copy(a.skyMid).lerp(b.skyMid, t);
  out.skyBottom.copy(a.skyBottom).lerp(b.skyBottom, t);
  out.hillFar.copy(a.hillFar).lerp(b.hillFar, t);
  out.hillNear.copy(a.hillNear).lerp(b.hillNear, t);
  out.hemiSky.copy(a.hemiSky).lerp(b.hemiSky, t);
  out.hemiGround.copy(a.hemiGround).lerp(b.hemiGround, t);
  out.winColor.copy(a.winColor).lerp(b.winColor, t);
  out.steam.copy(a.steam).lerp(b.steam, t);
  out.stars = MathUtils.lerp(a.stars, b.stars, t);
  out.moon = MathUtils.lerp(a.moon, b.moon, t);
  out.sun = MathUtils.lerp(a.sun, b.sun, t);
  out.hemi = MathUtils.lerp(a.hemi, b.hemi, t);
  out.lamp = MathUtils.lerp(a.lamp, b.lamp, t);
  out.win = MathUtils.lerp(a.win, b.win, t);
  out.houseLight = MathUtils.lerp(a.houseLight, b.houseLight, t);
}

/** A pleasant frozen moment for reduced motion: puffs mid-flight, eyes open. */
const STILL_T = 7.35;
const BASE_AZ = 0.56;
const BASE_EL = 0.4;
const FOV = 30;
/**
 * The `window` view: a fixed camera on the nook's window (Focus backdrop). It behaves like an image with
 * `object-fit: cover` of a WINDOW_ASPECT reference frame, so the live canvas and the pre-rendered stills
 * (scene/stills, same camera) line up exactly at any host aspect.
 */
export const WINDOW_CAM = { pos: [1.75, 1.62, 2.7] as const, at: [0.3, 1.66, -2.5] as const, fov: 44, aspect: 1.25 };
/** Turn a little toward items that face along +x (left wall) when framing them. */
const FRAME_AZ: Record<string, number> = { painting: 0.4, lantern: 0.2, catBed: 0.15, fairyLights: -0.1 };

const _v = new Vector3();
const _right = new Vector3();
const _up = new Vector3();
const _fwd = new Vector3();
const _grey = new Color('#6F6A86');
const _snow = new Color('#EDE9FA');

export class NookEngine {
  private renderer: WebGLRenderer;
  private scene = new Scene();
  private camera = new PerspectiveCamera(FOV, 1, 0.1, 80);
  private kit: Kit;
  private room: RoomParts;
  private ket: KettleParts;
  private chai: Chai;
  private items = new Map<string, ItemBuild>();
  private itemsRoot = new Group();
  private opts: EngineOptions;
  quality: Quality;

  // lights
  private hemi: HemisphereLight;
  private lampSpot: SpotLight;
  private stoveLight: PointLight;
  private winLight: DirectionalLight;
  /** Always present (intensity 0 when idle) so the light count never changes. */
  private hiLight: PointLight;

  // highlight
  private halo: Sprite;
  private sparkles: Sprite[] = [];
  private hiLevel = 0;
  private hiAge = 0;
  private hiFocus = new Vector3();
  private hiRadius = 0.6;
  private bounce = new Map<string, number>();

  // state
  state: EngineState = {
    mode: 'showcase',
    progress: 0,
    whistling: false,
    weather: 'clear',
    time: 'night',
    items: [],
    highlightItem: null,
    interactive: false,
    reducedMotion: false,
    dim: 1,
  };
  private moods: Record<ResolvedTime, MoodN>;
  private moodFrom: MoodN;
  private moodTo: MoodN;
  private mood: MoodN;
  private moodT = 1;
  private t = 0;
  private burst = 0;
  private steamLevel = 0;
  private whistleAge = 0;

  // loop
  private raf = 0;
  private lastFrame = 0;
  private running = false;
  private firstFrameDone = false;
  private disposed = false;
  private contextLost = false;
  private frameTimes: number[] = [];
  private slowFrames = 0;
  /** Frames since the loop (re)started; the first few are allowed to be slow. */
  private loopFrames = 0;
  /** Programs are being (re)compiled in slices: hold rendering (the last frame stays up). */
  private compiling = 0;

  // camera
  private width = 1;
  private height = 1;
  private az = BASE_AZ;
  private el = BASE_EL;
  private zoom = 1;
  private azT = 0;
  private elT = 0;
  private zoomT = 1;
  private azC = 0;
  private elC = 0;
  private zoomC = 1;
  private targetC = new Vector3();
  private fitDist = 12;
  private fitTarget = new Vector3();
  private interactingUntil = 0;

  // input
  private raycaster = new Raycaster();
  private ndc = new Vector2();
  private pointers = new Map<number, { x: number; y: number }>();
  private down: { x: number; y: number; t: number; moved: boolean } | null = null;
  private pinchDist = 0;
  private chaiProxy: Mesh;

  stats = { calls: 0, triangles: 0, geometries: 0, textures: 0, frameMs: 0, fps: 0 };

  constructor(opts: EngineOptions) {
    this.opts = opts;
    this.quality = opts.quality;
    const r = new WebGLRenderer({
      canvas: opts.canvas,
      antialias: true,
      alpha: true,
      powerPreference: 'low-power',
      preserveDrawingBuffer: false,
    });
    r.outputColorSpace = SRGBColorSpace;
    r.toneMapping = NeutralToneMapping;
    r.toneMappingExposure = 1.0;
    r.setClearColor(0x000000, 0);
    r.shadowMap.enabled = this.quality === 'high';
    r.shadowMap.type = PCFShadowMap;
    this.renderer = r;

    opts.canvas.addEventListener('webglcontextlost', this.onContextLost, false);

    this.moods = {
      morning: toN(MOODS.morning),
      day: toN(MOODS.day),
      dusk: toN(MOODS.dusk),
      night: toN(MOODS.night),
    };
    this.moodFrom = toN(MOODS.night);
    this.moodTo = toN(MOODS.night);
    this.mood = toN(MOODS.night);

    const kit = new Kit(this.quality === 'high');
    this.kit = kit;
    this.room = buildRoom(kit);
    this.ket = buildKettle(kit);
    this.chai = buildChai(kit);
    this.scene.add(this.room.root, this.ket.root, this.chai.root, this.itemsRoot);
    this.chaiProxy = kit.proxy(0.8, 0.9, 1.1, { p: [0, 0.4, 0.05] });
    this.chaiProxy.userData.chai = true;
    this.chai.root.add(this.chaiProxy);

    // ---- lights
    this.hemi = new HemisphereLight('#7A6CB8', '#4A3036', 1);
    this.scene.add(this.hemi);
    const bulb = this.room.lampBulb;
    this.lampSpot = new SpotLight('#FFC27A', 16, 0, 1.18, 0.9, 1.05);
    this.lampSpot.position.copy(bulb).add(_v.set(0, -0.08, 0));
    this.lampSpot.target.position.set(0.4, 0, 0.5);
    this.lampSpot.castShadow = this.quality === 'high';
    this.lampSpot.shadow.mapSize.set(opts.mobile ? 768 : 1024, opts.mobile ? 768 : 1024);
    this.lampSpot.shadow.radius = 5;
    this.lampSpot.shadow.bias = -0.0006;
    this.lampSpot.shadow.normalBias = 0.02;
    this.lampSpot.shadow.camera.near = 0.3;
    this.lampSpot.shadow.camera.far = 12;
    this.scene.add(this.lampSpot, this.lampSpot.target);
    this.stoveLight = new PointLight('#FF7A30', 2.5, 3.4, 2);
    this.stoveLight.position.copy(this.ket.firePos).add(_v.set(0.35, 0, 0));
    this.scene.add(this.stoveLight);
    this.winLight = new DirectionalLight('#B7C4FF', 0.6);
    this.winLight.position.set(1.4, 6, ROOM.zBack - 5);
    this.winLight.target.position.set(0.2, 0, 1);
    this.scene.add(this.winLight, this.winLight.target);

    this.hiLight = new PointLight('#FFE0A0', 0, 2.6, 1.4);
    this.scene.add(this.hiLight);

    // ---- highlight props
    const haloMat = new SpriteMaterial({ map: kit.tex.soft(), color: new Color(C.honeyHi), blending: AdditiveBlending, transparent: true, depthWrite: false, opacity: 0, toneMapped: false });
    haloMat.depthTest = false;
    this.halo = new Sprite(haloMat);
    this.halo.renderOrder = 8;
    this.scene.add(this.halo);
    const spMat = new SpriteMaterial({ map: kit.tex.sparkle(), color: new Color(C.honeyHi), transparent: true, depthWrite: false, depthTest: false, opacity: 0, toneMapped: false });
    for (let i = 0; i < 5; i++) {
      const s = new Sprite(i === 0 ? spMat : spMat.clone());
      s.renderOrder = 9;
      s.visible = false;
      this.sparkles.push(s);
      this.scene.add(s);
    }

    this.applyLayout();
    this.applyWeather();
    if (this.quality === 'low') kit.liteify(this.scene);
  }

  // ------------------------------------------------------------ public API

  setState(patch: Partial<EngineState>): void {
    const prev = this.state;
    const next = { ...prev, ...patch };
    this.state = next;
    if (patch.items && !sameList(patch.items, prev.items)) this.syncItems(prev.items);
    if (patch.time && patch.time !== prev.time) {
      this.moodFrom = cloneMood(this.mood);
      this.moodTo = this.moods[patch.time];
      // Blend only while the loop runs; a stopped (paused / hidden / reduced-motion) engine
      // renders single frames with dt = 0, which would never advance the blend.
      this.moodT = next.reducedMotion || !this.firstFrameDone || !this.running ? 1 : 0;
      if (this.moodT === 1) this.applyMoodNow();
    }
    if (patch.weather && patch.weather !== prev.weather) this.applyWeather();
    if (patch.mode && patch.mode !== prev.mode) this.applyMode();
    if (patch.highlightItem !== undefined && patch.highlightItem !== prev.highlightItem) {
      this.hiAge = 0;
      if (patch.highlightItem) this.bounce.set(patch.highlightItem, 0);
    }
    if (patch.whistling && !prev.whistling) this.whistleAge = 0;
    if (patch.dim !== undefined) this.renderer.toneMappingExposure = next.dim; // a uniform: no recompile
    if (patch.interactive !== undefined) this.opts.canvas.style.touchAction = next.interactive ? 'pan-y' : 'auto';
    this.invalidate();
  }

  get canvas(): HTMLCanvasElement {
    return this.opts.canvas;
  }

  /** False once disposed or the GL context was lost. */
  get usable(): boolean {
    return !this.disposed && !this.contextLost;
  }

  /** Rebind callbacks (an engine pre-warmed off-screen gets adopted by a mounted host). */
  setHandlers(h: Pick<EngineOptions, 'onItemSelect' | 'onFirstFrame' | 'onContextLost' | 'onQualityChange'>): void {
    Object.assign(this.opts, h);
  }

  /**
   * The canvas moved to a new host: treat the next frame as the first one
   * (camera snaps, no mood blend / arrival pops, `onFirstFrame` fires).
   */
  rehost(): void {
    this.firstFrameDone = false;
    this.invalidate();
  }

  /**
   * Compile and link every shader program the scene needs a few at a time
   * (`pause` yields to the main thread in between), so neither the
   * first frame nor a quality switch compiles dozens of programs in one
   * blocking frame. Without KHR_parallel_shader_compile each link is waited
   * for right away (a small stall per batch instead of one huge one).
   * Resolves false if the engine went away meanwhile. Rendering is held from
   * the call until it resolves; `prepare` runs one task in, before compiling.
   */
  async warm(pause: () => Promise<void>, prepare?: () => void): Promise<boolean> {
    this.compiling++; // no frames until done (a frame would compile everything at once)
    try {
      if (prepare) {
        // Extra scene building (e.g. items) in a task of its own.
        await pause();
        if (this.disposed || this.contextLost) return false;
        prepare();
      }
      return await this.compileAll(pause);
    } finally {
      this.compiling--;
      this.loopFrames = 0;
      this.invalidate();
    }
  }

  private async compileAll(pause: () => Promise<void>): Promise<boolean> {
    const r = this.renderer;
    const isDrawable = (o: Object3D) =>
      !!((o as Mesh).isMesh || (o as Sprite).isSprite || (o as { isPoints?: boolean }).isPoints || (o as { isLine?: boolean }).isLine);
    const objects: Object3D[] = [];
    this.scene.traverse((o) => {
      if (isDrawable(o) && (o as Mesh).material) objects.push(o);
    });
    const parallel = r.extensions.has('KHR_parallel_shader_compile');
    const seen = new Set<Material>();
    let slice = performance.now();
    for (const o of objects) {
      const own = (o as Mesh).material as Material | Material[];
      if ((Array.isArray(own) ? own : [own]).every((m) => seen.has(m))) continue;
      if (this.disposed || this.contextLost) return false;
      // Compiles this object's subtree (already-built programs are cache hits).
      const mats = r.compile(o, this.camera, this.scene) as Set<Material>;
      for (const m of mats) {
        if (seen.has(m)) continue;
        seen.add(m);
        const prog = (r.properties.get(m) as { currentProgram?: { isReady(): boolean; getUniforms(): unknown } }).currentProgram;
        if (!prog) continue;
        if (parallel) while (!prog.isReady()) await pause();
        if (this.disposed || this.contextLost) return false;
        prog.getUniforms(); // link check + uniform lookup now, not in the first frame
      }
      // Keep each task short: hand the thread back every ~12 ms.
      if (performance.now() - slice > 12) {
        await pause();
        slice = performance.now();
      }
    }
    return !this.disposed && !this.contextLost;
  }

  setSize(w: number, h: number, dpr: number): void {
    this.width = Math.max(1, w);
    this.height = Math.max(1, h);
    const cap = this.quality === 'low' ? Math.min(dpr, 1.25) : Math.min(dpr, this.opts.mobile ? 1.5 : 2);
    this.renderer.setPixelRatio(cap);
    this.renderer.setSize(this.width, this.height, false);
    this.camera.aspect = this.width / this.height;
    this.camera.updateProjectionMatrix();
    this.fit();
    this.invalidate();
  }

  /** External run gate (visible, onscreen, not paused, motion allowed). */
  setRunning(run: boolean): void {
    const want = run && !this.contextLost && !this.disposed;
    if (want === this.running) return;
    this.running = want;
    if (want) {
      this.lastFrame = performance.now();
      this.loopFrames = 0;
      this.slowFrames = 0;
      this.raf = requestAnimationFrame(this.loop);
    } else {
      cancelAnimationFrame(this.raf);
      this.raf = 0;
      // Hold a settled frame: finish any mood blend now (single frames don't advance it).
      if (this.moodT < 1) this.applyMoodNow();
      this.invalidate();
    }
  }

  /** Render once soon (when the loop isn't running). */
  invalidate(): void {
    if (this.running || this.disposed || this.contextLost || this.compiling > 0) return;
    if (!this.raf) {
      this.raf = requestAnimationFrame((now) => {
        this.raf = 0;
        if (this.running || this.compiling > 0) return;
        this.lastFrame = now;
        this.frame(0);
      });
    }
  }

  resetView(): void {
    this.azT = 0;
    this.elT = 0;
    this.zoomT = 1;
    this.poke();
  }

  setQuality(q: Quality): void {
    if (q === this.quality) return;
    this.quality = q;
    const shadows = q === 'high';
    this.renderer.shadowMap.enabled = shadows;
    this.lampSpot.castShadow = shadows;
    this.kit.shadows = shadows;
    if (q === 'low') this.kit.liteify(this.scene);
    this.scene.traverse((o) => {
      const m = (o as Mesh).material as { needsUpdate?: boolean } | undefined;
      if (m && 'needsUpdate' in m) m.needsUpdate = true;
    });
    this.setSize(this.width, this.height, window.devicePixelRatio || 1);
    this.opts.onQualityChange?.(q);
    // Every program changes: rebuild them a few per task while the last frame stays on screen.
    void this.warm(nextTask);
  }

  dispose(): void {
    this.disposed = true;
    cancelAnimationFrame(this.raf);
    this.opts.canvas.removeEventListener('webglcontextlost', this.onContextLost);
    this.detachInput();
    this.scene.traverse((o) => {
      const m = o as Mesh;
      const mat = m.material as { dispose?: () => void; isShaderMaterial?: boolean } | undefined;
      if (mat?.isShaderMaterial) {
        mat.dispose?.();
        m.geometry.dispose();
      }
      if ((o as Sprite).isSprite) (o as Sprite).material.dispose();
    });
    disposeNotes(this.ket);
    this.lampSpot.shadow.map?.dispose();
    this.kit.dispose();
    this.renderer.renderLists.dispose();
    this.renderer.dispose();
    // Free the GL context now rather than at GC (browsers cap live contexts).
    this.renderer.forceContextLoss();
  }

  // ------------------------------------------------------------ input

  attachInput(): void {
    const c = this.opts.canvas;
    c.addEventListener('pointerdown', this.onDown);
    c.addEventListener('pointermove', this.onMove);
    c.addEventListener('pointerup', this.onUp);
    c.addEventListener('pointercancel', this.onCancel);
    c.addEventListener('pointerleave', this.onLeave);
    c.addEventListener('wheel', this.onWheel, { passive: false });
    c.addEventListener('dblclick', this.onDbl);
  }

  detachInput(): void {
    const c = this.opts.canvas;
    c.removeEventListener('pointerdown', this.onDown);
    c.removeEventListener('pointermove', this.onMove);
    c.removeEventListener('pointerup', this.onUp);
    c.removeEventListener('pointercancel', this.onCancel);
    c.removeEventListener('pointerleave', this.onLeave);
    c.removeEventListener('wheel', this.onWheel);
    c.removeEventListener('dblclick', this.onDbl);
  }

  private poke() {
    this.interactingUntil = performance.now() + 1500;
    this.invalidate();
  }

  private onDown = (e: PointerEvent) => {
    if (!this.state.interactive) return;
    this.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (this.pointers.size === 1) this.down = { x: e.clientX, y: e.clientY, t: performance.now(), moved: false };
    if (this.pointers.size === 2) {
      const [a, b] = [...this.pointers.values()];
      this.pinchDist = Math.hypot(a.x - b.x, a.y - b.y);
      if (this.down) this.down.moved = true;
    }
  };

  private onMove = (e: PointerEvent) => {
    if (!this.state.interactive) return;
    const p = this.pointers.get(e.pointerId);
    if (!p) {
      if (e.pointerType === 'mouse') this.hover(e);
      return;
    }
    const dx = e.clientX - p.x;
    const dy = e.clientY - p.y;
    p.x = e.clientX;
    p.y = e.clientY;
    if (this.pointers.size === 2) {
      const [a, b] = [...this.pointers.values()];
      const d = Math.hypot(a.x - b.x, a.y - b.y);
      if (this.pinchDist > 0) this.zoomT = MathUtils.clamp(this.zoomT * (this.pinchDist / d), 0.72, 1.12);
      this.pinchDist = d;
      this.poke();
      return;
    }
    if (this.down && !this.down.moved && Math.hypot(e.clientX - this.down.x, e.clientY - this.down.y) > 6) {
      this.down.moved = true;
      try {
        this.opts.canvas.setPointerCapture(e.pointerId);
      } catch {
        /* ignore */
      }
    }
    if (this.down?.moved) {
      const k = 1 / Math.max(260, this.width);
      this.azT = MathUtils.clamp(this.azT - dx * k * 1.6, -0.46, 0.3);
      this.elT = MathUtils.clamp(this.elT + dy * k * 0.9, -0.14, 0.12);
      this.poke();
    }
  };

  private onUp = (e: PointerEvent) => {
    if (!this.state.interactive) return;
    const d = this.down;
    this.pointers.delete(e.pointerId);
    if (this.pointers.size === 0) this.down = null;
    if (d && !d.moved && performance.now() - d.t < 600) this.pick(e.clientX, e.clientY);
  };

  private onCancel = (e: PointerEvent) => {
    this.pointers.delete(e.pointerId);
    if (this.pointers.size === 0) this.down = null;
  };

  private onLeave = () => {
    if (this.pointers.size === 0) this.opts.canvas.style.cursor = '';
  };

  private onWheel = (e: WheelEvent) => {
    if (!this.state.interactive) return;
    e.preventDefault();
    this.zoomT = MathUtils.clamp(this.zoomT * Math.exp(e.deltaY * 0.0012), 0.72, 1.12);
    this.poke();
  };

  private onDbl = () => {
    if (!this.state.interactive) return;
    this.resetView();
  };

  private raycast(clientX: number, clientY: number): Object3D | null {
    const rect = this.opts.canvas.getBoundingClientRect();
    this.ndc.set(((clientX - rect.left) / rect.width) * 2 - 1, -((clientY - rect.top) / rect.height) * 2 + 1);
    this.raycaster.setFromCamera(this.ndc, this.camera);
    const targets: Object3D[] = [this.chaiProxy];
    this.items.forEach((b) => {
      if (b.root.visible) b.root.children.forEach((c) => c.userData.proxy && targets.push(c));
    });
    const hit = this.raycaster.intersectObjects(targets, false)[0];
    return hit?.object ?? null;
  }

  private hover(e: PointerEvent) {
    const o = this.raycast(e.clientX, e.clientY);
    this.opts.canvas.style.cursor = o ? 'pointer' : '';
  }

  private pick(x: number, y: number) {
    const o = this.raycast(x, y);
    if (o?.userData.chai) {
      this.chai.poke();
      this.poke();
      return;
    }
    const id = (o?.userData.itemId as string | undefined) ?? null;
    this.opts.onItemSelect?.(id);
  }

  // ------------------------------------------------------------ building

  private tableTop = (): TableTop => {
    const T = SPOTS.table;
    return this.state.items.includes('kotatsu') ? { x: T.x, y: 0.645, z: T.z } : { x: T.x, y: 0.61, z: T.z };
  };

  private syncItems(prevList: string[]) {
    const want = new Set(this.state.items);
    const known = Object.keys(BUILDERS);
    for (const id of known) {
      const on = want.has(id);
      let b = this.items.get(id);
      if (on && !b) {
        b = BUILDERS[id](this.kit, { tableTop: this.tableTop });
        if (this.quality === 'low') this.kit.liteify(b.root);
        this.items.set(id, b);
        this.itemsRoot.add(b.root);
        // arrive with a little pop when unlocked while watching
        if (this.firstFrameDone && !prevList.includes(id) && !this.state.reducedMotion) b.root.userData.arrive = 0;
      }
      if (b) b.root.visible = on;
    }
    this.applyLayout();
  }

  /** Things whose placement depends on which items exist. */
  private applyLayout() {
    const has = (id: string) => this.state.items.includes(id);
    const kotatsu = has('kotatsu');
    this.room.table.visible = !kotatsu;
    const tt = this.tableTop();
    this.room.mug.position.set(tt.x + 0.32, tt.y, tt.z + 0.26);
    this.room.mugSteam.u.uOrigin.value.set(tt.x + 0.32, tt.y + 0.24, tt.z + 0.26);
    this.room.mugSteam.u.uDir.value.set(0, 1, 0);
    this.items.forEach((b) => (b.root.userData.relayout as (() => void) | undefined)?.());
    const Cu = SPOTS.cushion;
    const onCushion = has('cushion');
    const y = onCushion ? 0.255 : 0.05;
    this.chai.root.userData.baseY = y;
    this.chai.root.position.set(Cu.x, y, Cu.z);
    this.chai.root.rotation.y = 0.62;
  }

  private applyMode() {
    const m = this.state.mode;
    this.chai.setPose(m === 'focus' ? 'nap' : m === 'break' ? 'sip' : 'awake');
    this.fit();
  }

  private applyWeather() {
    const w = this.state.weather;
    const r = this.room;
    r.rain.mesh.visible = w === 'rain';
    r.snow.mesh.visible = w === 'snow';
    r.snowCaps.visible = w === 'snow';
    r.glass.u.uRain.value = w === 'rain' ? 1 : 0;
    r.glass.u.uFrost.value = w === 'snow' ? 1 : 0;
    this.applyMoodNow();
  }

  private applyMoodNow() {
    lerpMood(this.mood, this.moodFrom, this.moodTo, 1);
    this.moodFrom = cloneMood(this.moodTo);
    this.moodT = 1;
    this.pushMood();
  }

  /** Push the current (blended) mood + weather into uniforms/lights. */
  private pushMood() {
    const m = this.mood;
    const r = this.room;
    const w = this.state.weather;
    const rain = w === 'rain' ? 1 : 0;
    const snow = w === 'snow' ? 1 : 0;
    const overcast = rain * 0.45 + snow * 0.2;
    r.sky.u.uTop.value.copy(m.skyTop).lerp(_grey, overcast);
    r.sky.u.uMid.value.copy(m.skyMid).lerp(_grey, overcast);
    r.sky.u.uBottom.value.copy(m.skyBottom).lerp(_grey, overcast * 0.8);
    r.sky.u.uStars.value = m.stars * (1 - rain) * (1 - snow * 0.6);
    r.hillFar.color.copy(m.hillFar).lerp(_snow, snow * 0.55);
    r.hillNear.color.copy(m.hillNear).lerp(_snow, snow * 0.45);
    r.moon.visible = m.moon * (1 - rain * 0.85) > 0.05;
    r.moon.scale.setScalar(0.9 + 0.1 * m.moon);
    r.sun.visible = m.sun > 0.05 && !rain;
    r.clouds.visible = m.sun > 0.05 || rain > 0;
    r.fireflies.mesh.visible = w === 'clear' && m.lamp > 0.5;
    r.houseWin.color.set(C.honey).multiplyScalar(0.25 + 0.75 * m.houseLight);
    r.winPatch.color.copy(m.winColor).multiplyScalar(m.win * 0.32 * (1 - rain * 0.5) * (1 - snow * 0.2));
    // lights
    this.hemi.color.copy(m.hemiSky);
    this.hemi.groundColor.copy(m.hemiGround);
    this.hemi.intensity = m.hemi;
    this.winLight.color.copy(m.winColor);
    this.winLight.intensity = m.win * (1 - rain * 0.35);
    const lamp = m.lamp;
    this.lampSpot.intensity = 4 + 24 * lamp;
    r.lampShade.emissiveIntensity = 0.1 + 0.9 * lamp;
    r.lampDecals.opacity = 0.42 * lamp * lamp;
    r.lampGlow.u.uOn.value = 0.05 + 0.95 * lamp * lamp;
    this.ket.steam.u.uColor.value.copy(m.steam);
    r.mugSteam.u.uColor.value.copy(m.steam);
    this.chai.steam.u.uColor.value.copy(m.steam);
    this.items.forEach((b) => {
      const s = (b as ItemBuild & { steam?: { u: { uColor: { value: Color } } } }).steam;
      s?.u.uColor.value.copy(m.steam);
    });
  }

  // ------------------------------------------------------------ camera

  /** Fit the diorama into the viewport for the current aspect + mode. */
  private fit() {
    if (this.state.mode === 'window') return;
    const aspect = this.width / this.height;
    const tight = this.state.mode === 'focus' || this.state.mode === 'break';
    const res = fitPoints(silhouette(tight, aspect), BASE_AZ, this.baseEl(), FOV, aspect, tight ? 0.02 : 0.035);
    this.fitDist = res.dist;
    this.fitTarget.copy(res.target);
  }

  private updateCamera(dt: number, snap: boolean) {
    if (this.state.mode === 'window') {
      this.windowCamera();
      return;
    }
    if (this.camera.fov !== FOV) {
      this.camera.fov = FOV;
      this.camera.updateProjectionMatrix();
    }
    const k = snap ? 1 : 1 - Math.exp(-dt * 7);
    // Highlight: on the Nook screen (interactive) a gentle nudge toward the item;
    // in small showcase cards (level-up) the camera frames the item itself so it
    // fills about half of the card with a little room around it.
    const hiId = this.state.highlightItem;
    const hiB = hiId ? this.items.get(hiId) : undefined;
    const hi = hiB && hiB.root.visible ? hiB : undefined;
    const inter = this.state.interactive;
    let zoomGoal = this.zoomT;
    let azGoal = this.azT;
    _v.copy(this.fitTarget);
    if (hi && inter) {
      zoomGoal *= 0.88;
      _v.lerp(hi.focus, 0.3);
    } else if (hi) {
      const aspect = this.width / this.height;
      const tanV = Math.tan(MathUtils.degToRad(FOV / 2));
      const tanMin = Math.min(tanV, tanV * aspect);
      const itemDist = (hi.radius * 2.0) / tanMin;
      zoomGoal = MathUtils.clamp(itemDist / this.fitDist, 0.22, 1);
      azGoal += FRAME_AZ[hi.id] ?? 0;
      _v.copy(hi.focus);
    }
    this.azC += (azGoal - this.azC) * k;
    this.elC += (this.elT + this.baseEl() - this.elC) * k;
    this.zoomC += (zoomGoal - this.zoomC) * k;
    this.targetC.lerp(_v, k);
    if (snap) this.targetC.copy(_v);
    this.az = BASE_AZ + this.azC;
    this.el = this.elC;
    this.zoom = this.zoomC;
    const d = this.fitDist * this.zoom;
    this.camera.position.set(
      this.targetC.x + Math.sin(this.az) * Math.cos(this.el) * d,
      this.targetC.y + Math.sin(this.el) * d,
      this.targetC.z + Math.cos(this.az) * Math.cos(this.el) * d,
    );
    this.camera.lookAt(this.targetC);
  }

  /** Fixed window framing (cover-fit of a WINDOW_CAM.aspect frame). */
  private windowCamera() {
    const aspect = this.width / Math.max(1, this.height);
    const tanRef = Math.tan(MathUtils.degToRad(WINDOW_CAM.fov / 2));
    // Wider than the reference: show its full width, crop top and bottom. Taller: crop the sides.
    const tanV = aspect > WINDOW_CAM.aspect ? (tanRef * WINDOW_CAM.aspect) / aspect : tanRef;
    const fov = MathUtils.radToDeg(Math.atan(tanV) * 2);
    if (Math.abs(this.camera.fov - fov) > 1e-4) {
      this.camera.fov = fov;
      this.camera.updateProjectionMatrix();
    }
    this.camera.position.set(WINDOW_CAM.pos[0], WINDOW_CAM.pos[1], WINDOW_CAM.pos[2]);
    this.camera.lookAt(WINDOW_CAM.at[0], WINDOW_CAM.at[1], WINDOW_CAM.at[2]);
  }

  private baseEl() {
    const aspect = this.width / this.height;
    return BASE_EL + (aspect < 1 ? (1 - aspect) * 0.22 : 0);
  }

  // ------------------------------------------------------------ loop

  private onContextLost = (e: Event) => {
    e.preventDefault();
    this.contextLost = true;
    cancelAnimationFrame(this.raf);
    this.raf = 0;
    this.running = false;
    this.opts.onContextLost?.();
  };

  private loop = (now: number) => {
    this.raf = requestAnimationFrame(this.loop);
    if (this.compiling > 0) return;
    const interacting = now < this.interactingUntil || this.moodT < 1;
    // One frame per rAF at most, capped (lower on CPU rasterizers so input and the timer keep the thread).
    const soft = !!this.opts.software;
    const minGap = (interacting ? (soft ? 1000 / 30 : 0) : 1000 / (soft ? 20 : 30)) - 3;
    const gap = now - this.lastFrame;
    if (gap < minGap) return;
    this.lastFrame = now;
    const t0 = performance.now();
    this.frame(Math.min(0.1, gap / 1000));
    const work = performance.now() - t0;
    // adaptive quality on 'auto': two slow frames in a row → low tier (the first frames after
    // a (re)start are excused — they upload textures / build the shadow map).
    if (this.opts.adaptive && this.quality === 'high' && ++this.loopFrames > 3) {
      if (work > 40 || gap > 90) this.slowFrames++;
      else this.slowFrames = 0;
      if (this.slowFrames >= 2) this.setQuality('low');
    }
  };

  private frame(dt: number) {
    if (this.disposed || this.contextLost) return;
    const still = this.state.reducedMotion;
    if (!still) this.t += dt;
    const t = still ? STILL_T : this.t;
    const s = this.state;

    // mood blend
    if (this.moodT < 1) {
      this.moodT = Math.min(1, this.moodT + dt / 1.6);
      lerpMood(this.mood, this.moodFrom, this.moodTo, smooth(this.moodT));
      this.pushMood();
    }

    // ---- kettle heat + steam
    const p = MathUtils.clamp(s.progress, 0, 1);
    let heat: number;
    if (s.mode === 'focus') heat = 0.05 + 0.95 * Math.pow(p, 1.15);
    else if (s.mode === 'break') heat = 0.32;
    else if (s.mode === 'showcase') heat = 0.3;
    else heat = 0.12;
    const burstGoal = s.whistling ? 1 : 0;
    if (still) {
      this.burst = burstGoal;
      this.steamLevel = s.whistling ? 1 : heat;
    } else {
      this.burst += (burstGoal - this.burst) * (1 - Math.exp(-dt * (s.whistling ? 6 : 1.5)));
      this.steamLevel += ((s.whistling ? 1 : heat) - this.steamLevel) * (1 - Math.exp(-dt * 1.2));
    }
    const ks = this.ket.steam.u;
    ks.uTime.value = t;
    // The window view is the Focus backdrop: the stage's own kettle is the only kettle, so the room's
    // kettle (off frame, but its steam drifts into view) stays quiet.
    ks.uIntensity.value = s.mode === 'window' ? 0 : this.steamLevel;
    ks.uBurst.value = this.burst;
    const lv = this.steamLevel;
    ks.uSize.value = 0.5 + 0.55 * lv;
    ks.uOpacity.value = 0.62 + 0.28 * lv;
    ks.uRise.value = 1.7 + 1.3 * lv;
    ks.uSpread.value = 0.34 + 0.4 * lv;

    // whistle: lid rattles, kettle wiggles, notes float out
    const k = this.ket;
    this.whistleAge += dt;
    const shake = still ? 0 : this.burst;
    k.lid.position.y = 0.47 + Math.abs(Math.sin(t * 23)) * 0.035 * shake;
    k.lid.rotation.z = Math.sin(t * 31) * 0.1 * shake;
    const rumble = s.mode === 'focus' && !still ? MathUtils.smoothstep(p, 0.86, 1) * 0.006 : 0;
    k.kettle.rotation.z = Math.sin(t * 17) * (0.035 * shake + rumble);
    k.kettle.rotation.x = Math.sin(t * 13 + 1) * (0.02 * shake + rumble * 0.6);
    for (let i = 0; i < k.notes.length; i++) {
      const n = k.notes[i];
      const on = this.burst > 0.3;
      n.visible = on;
      if (!on) continue;
      const ph = (t * 0.55 + i / k.notes.length) % 1;
      n.position.copy(k.spoutTip).addScaledVector(k.spoutDir, 0.35 + ph * 0.9);
      n.position.y += 0.15 + ph * 1.1 + Math.sin(ph * 7 + i) * 0.06;
      n.position.z += Math.sin(ph * 5 + i * 2) * 0.12;
      n.material.opacity = Math.min(1, Math.sin(Math.PI * ph) * 1.4) * this.burst;
      n.material.rotation = Math.sin(ph * 6 + i) * 0.35;
      n.scale.setScalar(0.24 + 0.1 * Math.sin(Math.PI * ph));
    }

    // stove fire
    const fireBase = s.mode === 'focus' ? 0.6 + 0.6 * p : s.mode === 'break' ? 0.45 : 0.55;
    const flick = still ? 1 : 0.88 + 0.08 * Math.sin(t * 7.3) + 0.05 * Math.sin(t * 13.1 + 1.3);
    const fire = fireBase * flick;
    k.fireMat.emissiveIntensity = 0.6 + 1.3 * fire;
    k.fireGlow.u.uOn.value = 0.35 + 0.65 * fire;
    (k.fireDecal.material as MeshBasicMaterial).opacity = 0.25 + 0.4 * fire;
    this.stoveLight.intensity = 1.2 + 3.2 * fire;

    // room fx
    const r = this.room;
    r.sky.u.uTime.value = t;
    r.glass.u.uTime.value = t;
    r.rain.u.uTime.value = t;
    r.snow.u.uTime.value = t;
    r.fireflies.u.uTime.value = t;
    r.fireflies.u.uAlpha.value = 0.9 * this.mood.lamp;
    r.mugSteam.u.uTime.value = t + 3.1;
    r.mugSteam.u.uIntensity.value = s.mode === 'window' ? 0 : s.mode === 'idle' ? 0.6 : 1;
    r.lampGlow.u.uTime.value = t;
    r.clouds.position.x = still ? 0 : ((t * 0.04) % 2.4) - 1.2;

    // chai + items
    this.chai.update(t, still ? 0 : dt);
    const ctx = { lamp: this.mood.lamp, t, dt: still ? 0 : dt };
    this.items.forEach((b) => {
      if (!b.root.visible) return;
      b.anim?.(ctx);
      const arrive = b.root.userData.arrive as number | undefined;
      if (arrive !== undefined) {
        const a = Math.min(1, arrive + dt / 0.75);
        b.root.userData.arrive = a >= 1 ? undefined : a;
        b.root.scale.setScalar(Math.max(0.001, easeOutBack(a)));
      }
    });

    // highlight
    this.updateHighlight(dt, t, still);

    // camera
    this.updateCamera(dt, still || !this.firstFrameDone);

    const t0 = performance.now();
    this.renderer.render(this.scene, this.camera);
    const ms = performance.now() - t0;
    this.recordStats(ms);
    if (!this.firstFrameDone) {
      this.firstFrameDone = true;
      this.opts.onFirstFrame?.();
    }
  }

  private updateHighlight(dt: number, t: number, still: boolean) {
    const id = this.state.highlightItem;
    const b = id ? this.items.get(id) : undefined;
    const on = !!(b && b.root.visible);
    const goal = on ? 1 : 0;
    this.hiLevel = still ? goal : this.hiLevel + (goal - this.hiLevel) * (1 - Math.exp(-dt * 5));
    this.hiAge += dt;
    if (b && on) {
      this.hiFocus.copy(b.focus);
      this.hiRadius = b.radius;
    }
    const lv = this.hiLevel;
    // a warm local light lifts the item; a soft glow washes over it
    _fwd.copy(this.camera.position).sub(this.hiFocus).normalize();
    const pulse = still ? 1 : 0.85 + 0.15 * Math.sin(t * 2.4);
    this.hiLight.position.copy(this.hiFocus).addScaledVector(_fwd, this.hiRadius * 1.1).add(_v.set(0, this.hiRadius * 0.6, 0));
    this.hiLight.distance = 1.6 + this.hiRadius * 2.2;
    this.hiLight.intensity = 5.5 * lv * pulse;
    this.halo.position.copy(this.hiFocus).addScaledVector(_fwd, this.hiRadius);
    this.halo.scale.setScalar(this.hiRadius * 3.2 * pulse);
    this.halo.material.opacity = 0.3 * lv;
    this.halo.visible = lv > 0.01;
    // sparkles orbit and twinkle
    _right.set(1, 0, 0).applyQuaternion(this.camera.quaternion);
    _up.set(0, 1, 0).applyQuaternion(this.camera.quaternion);
    for (let i = 0; i < this.sparkles.length; i++) {
      const sp = this.sparkles[i];
      sp.visible = lv > 0.01;
      if (!sp.visible) continue;
      const a = (i / this.sparkles.length) * Math.PI * 2 + (still ? 0.4 : t * 0.5);
      const rr = this.hiRadius * (1.05 + 0.12 * Math.sin(t * 1.7 + i));
      sp.position.copy(this.hiFocus).addScaledVector(_right, Math.cos(a) * rr).addScaledVector(_up, Math.sin(a) * rr * 0.8 + 0.1);
      const tw = still ? 0.8 : Math.max(0, Math.sin(t * 3.1 + i * 1.7));
      sp.material.opacity = lv * (0.45 + 0.55 * tw);
      sp.scale.setScalar(0.13 + 0.12 * tw);
      sp.material.rotation = t * 0.8 + i;
    }
    // springy bounce on select
    this.bounce.forEach((age, bid) => {
      const it = this.items.get(bid);
      const a = age + dt;
      if (!it || a > 1.1 || still) {
        if (it && it.root.userData.arrive === undefined) it.root.scale.setScalar(1);
        this.bounce.delete(bid);
        return;
      }
      this.bounce.set(bid, a);
      if (it.root.userData.arrive === undefined) {
        const sc = 1 + Math.sin(a * 14) * Math.exp(-a * 4.5) * 0.09;
        it.root.scale.set(1 / Math.sqrt(sc), sc, 1 / Math.sqrt(sc));
      }
    });
  }

  private recordStats(ms: number) {
    const info = this.renderer.info;
    this.stats.calls = info.render.calls;
    this.stats.triangles = info.render.triangles;
    this.stats.geometries = info.memory.geometries;
    this.stats.textures = info.memory.textures;
    this.frameTimes.push(ms);
    if (this.frameTimes.length > 60) this.frameTimes.shift();
    this.stats.frameMs = this.frameTimes.reduce((a, b) => a + b, 0) / this.frameTimes.length;
  }
}

// ------------------------------------------------------------ helpers

/** Yield to the event loop (input, timers, painting) before continuing. */
export function nextTask(): Promise<void> {
  const sched = (globalThis as { scheduler?: { yield?: () => Promise<void> } }).scheduler;
  if (typeof sched?.yield === 'function') return sched.yield();
  return new Promise((r) => setTimeout(r, 0));
}

function sameList(a: string[], b: string[]) {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
  return true;
}

function cloneMood(m: MoodN): MoodN {
  return {
    skyTop: m.skyTop.clone(),
    skyMid: m.skyMid.clone(),
    skyBottom: m.skyBottom.clone(),
    hillFar: m.hillFar.clone(),
    hillNear: m.hillNear.clone(),
    hemiSky: m.hemiSky.clone(),
    hemiGround: m.hemiGround.clone(),
    winColor: m.winColor.clone(),
    steam: m.steam.clone(),
    stars: m.stars,
    moon: m.moon,
    sun: m.sun,
    hemi: m.hemi,
    lamp: m.lamp,
    win: m.win,
    houseLight: m.houseLight,
  };
}

function smooth(x: number) {
  return x * x * (3 - 2 * x);
}

function easeOutBack(x: number) {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
}

/** The points that must stay in frame: slab corners + the wall tops. */
function silhouette(tight: boolean, aspect: number): Vector3[] {
  const { xMin, xMax, zBack, zFront, wall, h, slab } = ROOM;
  const x0 = xMin - wall - 0.06;
  // Narrow focus cards crop the open right side a little so the room fills the height.
  const x1 = tight && aspect < 1 ? xMax - 0.9 : xMax + 0.06;
  const z0 = zBack - wall - 0.06;
  const z1 = tight && aspect < 1 ? zFront - 0.5 : zFront + 0.06;
  const yb = -slab - 0.05;
  const pts: Vector3[] = [];
  for (const x of [x0, x1]) for (const y of [yb, 0]) for (const z of [z0, z1]) pts.push(new Vector3(x, y, z));
  pts.push(new Vector3(x0, h + 0.05, z0), new Vector3(x1, h + 0.05, z0), new Vector3(x0, h + 0.05, z1));
  return pts;
}

/**
 * Distance + target so a point cloud fills the view at the given
 * azimuth/elevation (radians), vertical fov (deg) and aspect, with padding.
 */
export function fitPoints(points: Vector3[], az: number, el: number, fovDeg: number, aspect: number, pad: number) {
  const tanV = Math.tan(MathUtils.degToRad(fovDeg / 2)) * (1 - pad);
  const tanH = tanV * aspect * (1 - pad * 0.5);
  const back = new Vector3(Math.sin(az) * Math.cos(el), Math.sin(el), Math.cos(az) * Math.cos(el)); // toward camera
  const right = new Vector3().crossVectors(new Vector3(0, 1, 0), back).normalize();
  const up = new Vector3().crossVectors(back, right).normalize();
  const target = new Vector3();
  points.forEach((p) => target.add(p));
  target.multiplyScalar(1 / points.length);
  let dist = 10;
  const d = new Vector3();
  for (let iter = 0; iter < 4; iter++) {
    dist = 0;
    for (const c of points) {
      d.copy(c).sub(target);
      const z = d.dot(back);
      dist = Math.max(dist, z + Math.abs(d.dot(right)) / tanH, z + Math.abs(d.dot(up)) / tanV);
    }
    // re-centre the projected silhouette
    let x0 = Infinity;
    let x1 = -Infinity;
    let y0 = Infinity;
    let y1 = -Infinity;
    for (const c of points) {
      d.copy(c).sub(target);
      const depth = dist - d.dot(back);
      const nx = d.dot(right) / depth;
      const ny = d.dot(up) / depth;
      x0 = Math.min(x0, nx);
      x1 = Math.max(x1, nx);
      y0 = Math.min(y0, ny);
      y1 = Math.max(y1, ny);
    }
    target.addScaledVector(right, ((x0 + x1) / 2) * dist).addScaledVector(up, ((y0 + y1) / 2) * dist);
  }
  return { dist, target };
}
