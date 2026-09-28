/**
 * Prop resolution shared by the 3D scene and the static fallback (kept free
 * of three.js so the main chunk stays lean).
 */
import { useEffect, useState } from 'react';
import { clock } from '@/lib/clock';
import { getSettings, useSettings, type ScenePref } from '@/state/settings';
import { useReducedMotion } from '@/lib/useReducedMotion';
import { MOODS, timeFromClock, weatherFromAmbient, type ResolvedTime } from './engine/palette';
import type { SceneTime, SceneWeather } from './types';

export function debugOn(): boolean {
  return import.meta.env.DEV || (typeof location !== 'undefined' && new URLSearchParams(location.search).has('debug'));
}

/** Screenshot overrides: ?nooktime=night&nookweather=snow&nookq=low */
function debugParam(name: string): string | null {
  if (!debugOn() || typeof location === 'undefined') return null;
  return new URLSearchParams(location.search).get(name);
}

const TIMES = ['morning', 'day', 'dusk', 'night'];
const WEATHERS = ['rain', 'snow', 'clear'];

export function useSceneTime(pref: SceneTime = 'auto'): ResolvedTime {
  const forced = debugParam('nooktime');
  const [auto, setAuto] = useState<ResolvedTime>(() => timeFromClock(new Date(clock.now())));
  useEffect(() => {
    if (pref !== 'auto') return;
    const tick = () => setAuto(timeFromClock(new Date(clock.now())));
    tick();
    const id = window.setInterval(tick, 60_000);
    const off = clock.onJump(tick);
    return () => {
      window.clearInterval(id);
      off();
    };
  }, [pref]);
  if (forced && TIMES.includes(forced)) return forced as ResolvedTime;
  return pref === 'auto' ? auto : pref;
}

export function useSceneWeather(prop?: SceneWeather): SceneWeather {
  const ambient = useSettings((s) => s.ambient);
  const forced = debugParam('nookweather');
  if (forced && WEATHERS.includes(forced)) return forced as SceneWeather;
  return prop ?? weatherFromAmbient(ambient);
}

/** Screenshot override for the unlocked set: ?nookitems=all|none|pothos,books */
export function useDebugItems(items: string[]): string[] {
  const forced = debugParam('nookitems');
  const [all, setAll] = useState<string[] | null>(null);
  useEffect(() => {
    if (forced === 'all') void import('@/progress/items').then((m) => setAll(m.ITEMS.map((i) => i.id)));
  }, [forced]);
  if (!forced) return items;
  if (forced === 'all') return all ?? items;
  if (forced === 'none') return EMPTY;
  return forced.split(',');
}
const EMPTY: string[] = [];

export type SceneTier = 'high' | 'low' | 'off';

export function isMobileDevice(): boolean {
  if (typeof window === 'undefined') return false;
  const coarse = window.matchMedia?.('(pointer: coarse)').matches ?? false;
  return coarse || /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}

/** settings.scene → tier. 'auto' picks by device and may adapt down at runtime. */
export function useSceneTier(): { tier: SceneTier; adaptive: boolean } {
  const pref = useSettings((s) => s.scene);
  return resolveTier(pref);
}

/** Non-hook form of `useSceneTier` (for pre-warming outside React). */
export function resolveTier(pref: ScenePref = getSettings().scene): { tier: SceneTier; adaptive: boolean } {
  const forced = debugParam('nookq');
  if (forced === 'high' || forced === 'low' || forced === 'off') return { tier: forced, adaptive: false };
  if (pref === 'off') return { tier: 'off', adaptive: false };
  if (pref === 'high' || pref === 'low') return { tier: pref, adaptive: false };
  const nav = typeof navigator !== 'undefined' ? (navigator as Navigator & { deviceMemory?: number }) : undefined;
  const weak = (nav?.hardwareConcurrency ?? 8) <= 4 || (nav?.deviceMemory ?? 8) <= 3;
  const saveData = (nav as Navigator & { connection?: { saveData?: boolean } } | undefined)?.connection?.saveData;
  // No GPU (SwiftShader / llvmpipe / "Software" rasterizers): every pixel is drawn by the CPU.
  const low = softwareGL() || (weak && isMobileDevice()) || !!saveData;
  return { tier: low ? 'low' : 'high', adaptive: true };
}

export { useReducedMotion };

let webglCache: boolean | null = null;
let softwareCache = false;
export function hasWebGL(): boolean {
  if (webglCache !== null) return webglCache;
  try {
    const c = document.createElement('canvas');
    const gl = (c.getContext('webgl2') || c.getContext('webgl')) as WebGLRenderingContext | null;
    webglCache = !!gl;
    if (gl) {
      const info = gl.getExtension('WEBGL_debug_renderer_info');
      const name = String(info ? gl.getParameter(info.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER));
      softwareCache = /swiftshader|llvmpipe|softpipe|software/i.test(name);
      // Free the probe context now (browsers cap live contexts; GC may be slow to).
      gl.getExtension('WEBGL_lose_context')?.loseContext();
    }
  } catch {
    webglCache = false;
  }
  return webglCache;
}

/**
 * True when WebGL runs on a CPU rasterizer (no GPU / blocklisted driver). These
 * are real users: the scene starts on the low tier with a lower frame cap.
 */
export function softwareGL(): boolean {
  return hasWebGL() && softwareCache;
}

export function backdropCss(time: ResolvedTime): string {
  const m = MOODS[time];
  return `radial-gradient(120% 95% at 50% 42%, ${m.bgInner} 0%, ${m.bgOuter} 100%)`;
}
