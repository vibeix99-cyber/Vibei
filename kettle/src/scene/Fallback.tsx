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
import LAYERS from './stills/items.json';

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

/**
 * The user's earned items over the window still: pre-rendered layers of the existing 3D items, from the same
 * engine and camera (scripts/stills/render-item-layers.mjs). Layer k is what item k changes once the items
 * before it are in the room, so painted in unlock order over the base still they rebuild the live render of
 * the earned set. Lighting states that light an item alike share a file (items.json `variants`). Only the
 * manifest and the URL map are bundled; each layer file loads when it is first shown.
 */
const LAYER_URLS = import.meta.glob<string>('./stills/items/*.webp', { eager: true, query: '?url', import: 'default' });
const LAYER_ITEMS = LAYERS.items as Record<string, { box: number[]; variants: Record<string, string> }>;

export interface WindowLayer {
  id: string;
  href: string;
  /** x, y, width, height on the still's frame (LAYERS.frame). */
  box: number[];
}

/** The layers to paint for these items, in unlock order (items not seen through the window have none). */
export function windowLayers(items: readonly string[], time: string, weather: SceneWeather): WindowLayer[] {
  const out: WindowLayer[] = [];
  for (const id of LAYERS.order) {
    if (!items.includes(id)) continue;
    const it = LAYER_ITEMS[id];
    const stem = it?.variants[`${time}-${weather}`] ?? it?.variants[`${time}-clear`];
    const href = stem && LAYER_URLS[`./stills/items/${stem}.webp`];
    if (href) out.push({ id, href, box: it.box });
  }
  return out;
}

export function WindowStill({ weather, time: pref = 'auto', items = [] }: { weather: SceneWeather; time?: SceneTime; items?: readonly string[] }) {
  const time = useSceneTime(pref);
  const src = windowStill(time, weather);
  if (!src) return null;
  const layers = windowLayers(items, time, weather);
  const [fw, fh] = LAYERS.frame;
  return (
    <>
      <img src={src} alt="" aria-hidden draggable={false} decoding="async" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: '50% 50%' }} />
      {layers.length > 0 && (
        // `xMidYMid slice` on the still's own frame = the still's `object-fit: cover` (and the live camera's
        // cover-fit, Engine.ts windowCamera), so each item lands where the live window view draws it.
        <svg
          viewBox={`0 0 ${fw} ${fh}`}
          preserveAspectRatio="xMidYMid slice"
          aria-hidden
          focusable="false"
          data-window-items={layers.map((l) => l.id).join(' ')}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
        >
          {layers.map((l) => (
            <image key={l.id} href={l.href} x={l.box[0]} y={l.box[1]} width={l.box[2]} height={l.box[3]} preserveAspectRatio="none" data-item={l.id} />
          ))}
        </svg>
      )}
    </>
  );
}

export function NookStatic({ weather, mode, progress = 0, items = [], time: pref = 'auto' }: Props) {
  if (mode === 'window') return <WindowStill weather={weather} time={pref} items={items} />;
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
