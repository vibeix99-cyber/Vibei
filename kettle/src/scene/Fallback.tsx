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

const POSE: Record<SceneMode, MascotPose> = { focus: 'sleep', break: 'sip', idle: 'idle', showcase: 'idle' };

export function NookStatic({ weather, mode, progress = 0, items = [], time: pref = 'auto' }: Props) {
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
