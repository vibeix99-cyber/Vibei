export type SceneMode = 'focus' | 'break' | 'idle' | 'showcase';
export type SceneWeather = 'rain' | 'snow' | 'clear';
export type SceneTime = 'auto' | 'morning' | 'day' | 'dusk' | 'night';

export interface NookSceneProps {
  mode: SceneMode;
  /** 0..1 — how "hot" the kettle is (focus progress). Steam builds with it. */
  progress?: number;
  /** True for the moment the kettle whistles (burst of steam). */
  whistling?: boolean;
  weather?: SceneWeather;
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
}
