import type { ReactNode } from 'react';

/** `window`: a fixed, quiet view of the nook's window (the Focus backdrop); the kettle and Chai are out of frame. */
export type SceneMode = 'focus' | 'break' | 'idle' | 'showcase' | 'window';
export type SceneWeather = 'rain' | 'snow' | 'clear';
export type SceneTime = 'auto' | 'morning' | 'day' | 'dusk' | 'night';

export interface NookSceneProps {
  mode: SceneMode;
  /** 0..1 — how "hot" the kettle is (focus progress). Steam builds with it. */
  progress?: number;
  /** True for the moment the kettle whistles (burst of steam). */
  whistling?: boolean;
  /** Defaults to the chosen ambience (rain/lo-fi → rain, fire → snow, else clear). */
  weather?: SceneWeather;
  /** Defaults to 'auto' (local clock). */
  timeOfDay?: SceneTime;
  /** Unlocked item ids (see progress/items.ts). */
  items: string[];
  /** Item to spotlight (e.g. just unlocked). */
  highlightItem?: string | null;
  onItemSelect?: (id: string | null) => void;
  /** Allow orbit/drag (Nook screen). */
  interactive?: boolean;
  paused?: boolean;
  className?: string;
  /**
   * Paint the soft time-of-day backdrop behind the diorama (default true).
   * Pass false to float the room on your own background.
   */
  backdrop?: boolean;
  /**
   * Drawn instead of the flat room while the 3D scene loads (and when 3D is off): a showcase close-up passes
   * its item's own drawing, so the picture is about the item from the first frame.
   */
  still?: ReactNode;
}
