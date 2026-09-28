/**
 * Static nook — shown while three.js loads, when 3D is off (settings.scene),
 * or without WebGL. Uses the art area's flat illustration of the same room.
 */
import { NookFallback, type MascotPose } from '@/art';
import { useReducedMotion } from '@/lib/useReducedMotion';
import type { SceneMode, SceneWeather } from './types';

interface Props {
  weather: SceneWeather;
  mode: SceneMode;
  progress?: number;
  items?: string[];
}

const POSE: Record<SceneMode, MascotPose> = { focus: 'sleep', break: 'sip', idle: 'idle', showcase: 'idle' };

export function NookStatic({ weather, mode, progress = 0, items = [] }: Props) {
  const reduced = useReducedMotion();
  const steam = mode === 'focus' ? 0.15 + 0.85 * progress : mode === 'break' ? 0.4 : 0.3;
  return <NookFallback items={items} steam={steam} weather={weather} chai={POSE[mode]} animate={!reduced} fit="slice" title="" />;
}
