// Renderer, arena stage, lighting, post-processing.

import * as THREE from 'three';
import { getArena } from '../data/arenas.js';
import { Feel } from './feel.js';

export class Stage {
  constructor(canvas) {
    this.canvas = canvas;
    this.renderer = new THREE.WebGLRenderer({
      canvas, antialias: true, powerPreference: 'high-performance', alpha: false
    });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(42, 1, 0.1, 400);
    this.camera.position.set(0, 4.2, 11);
    this.camera.lookAt(0, 1.6, 0);

    this.feel = new Feel();
    this.clock = new THREE.Clock();
    this.arenaGroup = new THREE.Group();
    this.scene.add(this.arenaGroup);
    this.fxGroup = new THREE.Group();
    this.scene.add(this.fxGroup);

    this.stats = { fps: 0, frames: 0, acc: 0, drawCalls: 0, tris: 0 };
    this.quality = 'high';
    this._resize();
    addEventListener('resize', () => this._resize());
  }

  _resize() {
    const w = this.canvas.clientWidth || innerWidth;
    const h = this.canvas.clientHeight || innerHeight;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / Math.max(1, h);
    this.camera.updateProjectionMatrix();
  }

  clearArena() {
    while (this.arenaGroup.children.length) {
      const c = this.arenaGroup.children.pop();
      c.traverse?.((o) => { o.geometry?.dispose?.(); if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => m.dispose?.()); });
      this.arenaGroup.remove(c);
    }
    this.lights?.forEach((l) => this.scene.remove(l));
    this.lights = [];
  }

  buildArena(arenaId) {
    const a = getArena(arenaId);
    this.arena = a;
    this.clearArena();

    // Sky gradient
    const skyGeo = new THREE.SphereGeometry(180, 32, 16);
    const skyMat = new THREE.ShaderMaterial({
      side: THREE.BackSide, depthWrite: false,
      uniforms: {
        top: { value: new THREE.Color(a.sky[0]) },
        bot: { value: new THREE.Color(a.sky[1]) },
        t: { value: 0 }
      },
      vertexShader: `varying vec3 vP; void main(){ vP = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
      fragmentShader: `
        uniform vec3 top; uniform vec3 bot; uniform float t; varying vec3 vP;
        void main(){
          float h = clamp(vP.y / 180.0 * 0.5 + 0.5, 0.0, 1.0);
          vec3 c = mix(bot, top, pow(h, 0.75));
          float band = sin(vP.y * 0.05 + t * 0.2) * 0.012;
          gl_FragColor = vec4(c + band, 1.0);
        }`
    });
    this.sky = new THREE.Mesh(skyGeo, skyMat);
    this.arenaGroup.add(this.sky);

    this.scene.fog = new THREE.FogExp2(new THREE.Color(a.fog.color), a.fog.density);

    // Ground
    const groundGeo = new THREE.CircleGeometry(26, 64);
    const groundMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(a.ground), roughness: 0.95, metalness: 0.02
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    this.arenaGroup.add(ground);

    // Ring inlay so the stage reads as a fighting arena, not a plane
    const ringGeo = new THREE.RingGeometry(8.2, 8.7, 96);
    const ringMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(a.accent), transparent: true, opacity: 0.45, side: THREE.DoubleSide });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = -Math.PI / 2; ring.position.y = 0.02;
    this.arenaGroup.add(ring);
    this.ring = ring;

    // Platforms under each fighter
    this.platforms = [-1, 1].map((s) => {
      const g = new THREE.CylinderGeometry(2.6, 2.9, 0.28, 40);
      const m = new THREE.MeshStandardMaterial({ color: new THREE.Color(a.ground).multiplyScalar(1.15), roughness: 0.8 });
      const p = new THREE.Mesh(g, m);
      p.position.set(s * 4.6, 0.14, s * 1.2);
      p.receiveShadow = true; p.castShadow = true;
      this.arenaGroup.add(p);
      return p;
    });

    // Lighting
    const sun = new THREE.DirectionalLight(new THREE.Color(a.sun.color), a.sun.intensity);
    sun.position.set(...a.sun.position);
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    sun.shadow.camera.near = 1; sun.shadow.camera.far = 60;
    sun.shadow.camera.left = -18; sun.shadow.camera.right = 18;
    sun.shadow.camera.top = 18; sun.shadow.camera.bottom = -18;
    sun.shadow.bias = -0.0012;
    this.scene.add(sun);

    const hemi = new THREE.HemisphereLight(new THREE.Color(a.sky[0]), new THREE.Color(a.ground), 0.5);
    this.scene.add(hemi);
    const amb = new THREE.AmbientLight(new THREE.Color(a.ambient.color), a.ambient.intensity);
    this.scene.add(amb);
    // Rim light so silhouettes pop against the sky
    const rim = new THREE.DirectionalLight(new THREE.Color(a.accent), 1.1);
    rim.position.set(-a.sun.position[0], 6, -a.sun.position[2]);
    this.scene.add(rim);

    this.lights = [sun, hemi, amb, rim];
    return a;
  }

  render(dt) {
    if (this.sky) this.sky.material.uniforms.t.value += dt;
    const [sx, sy, sz] = this.feel.shakeOffset();
    const cam = this.camera;
    const base = cam.userData.basePos || cam.position;
    cam.position.set(base.x + sx, base.y + sy, base.z + sz);
    this.renderer.render(this.scene, cam);
    const info = this.renderer.info.render;
    this.stats.drawCalls = info.calls;
    this.stats.tris = info.triangles;
  }

  tickStats(dt) {
    this.stats.acc += dt; this.stats.frames++;
    if (this.stats.acc >= 0.5) {
      this.stats.fps = Math.round(this.stats.frames / this.stats.acc);
      this.stats.frames = 0; this.stats.acc = 0;
    }
  }
}
