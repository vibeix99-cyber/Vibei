/**
 * Static nook — shown while three.js loads, when 3D is off (settings.scene),
 * or without WebGL. Uses the art area's flat illustration of the same room,
 * lit for the same time of day as the 3D scene (useSceneTime: in the dark app
 * theme `auto` is an evening room; in the light theme it follows the clock),
 * and floating on the host's backdrop like the canvas so the cross-fade is quiet.
 */
import { NookFallback, type MascotPose } from '@/art';
import { useReducedMotion, useSceneTime } from './resolve';
import type { SceneMode, SceneTime, SceneWeather } from './types';

interface Props {
  weather: SceneWeather;
  mode: SceneMode;
  progress?: number;
  items?: string[];
  /** The scene's `timeOfDay` (default 'auto'). */
  time?: SceneTime;
}

const POSE: Record<SceneMode, MascotPose> = { focus: 'sleep', break: 'sip', idle: 'idle', showcase: 'idle', window: 'idle' };

/**
 * Pre-rendered stills of the `window` view (same engine, same camera, base room without unlocked items),
 * one per time of day and weather. Shown while the engine loads and whenever 3D is off, so the Focus
 * backdrop never swaps to a differently framed picture. Only the URL map is bundled; each file loads on use.
 */
const STILLS = import.meta.glob<string>('./stills/window-*.webp', { eager: true, query: '?url', import: 'default' });

export function windowStill(time: string, weather: SceneWeather): string | undefined {
  return STILLS[`./stills/window-${time}-${weather}.webp`] ?? STILLS[`./stills/window-${time}-clear.webp`];
}

export function WindowStill({ weather, time: pref = 'auto' }: { weather: SceneWeather; time?: SceneTime }) {
  const time = useSceneTime(pref);
  const src = windowStill(time, weather);
  if (!src) return null;
  return <img src={src} alt="" aria-hidden draggable={false} decoding="async" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: '50% 50%' }} />;
}

export function NookStatic({ weather, mode, progress = 0, items = [], time: pref = 'auto' }: Props) {
  if (mode === 'window') return <WindowStill weather={weather} time={pref} />;
  return <NookStaticRoom weather={weather} mode={mode} progress={progress} items={items} time={pref} />;
}

function NookStaticRoom({ weather, mode, progress = 0, items = [], time: pref = 'auto' }: Props) {
  const reduced = useReducedMotion();
  const time = useSceneTime(pref);
  const steam = mode === 'focus' ? 0.15 + 0.85 * progress : mode === 'break' ? 0.4 : 0.3;
  return (
    <NookFallback
      items={items}
      steam={steam}
      weather={weather}
      time={time}
      chai={POSE[mode]}
      animate={!reduced}
      fit="meet"
      backdrop={false}
      title=""
    />
  );
}
