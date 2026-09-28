/** Gentle tea-break ideas. Short, second person, no pressure. */
export type SuggestionArt = 'stretch' | 'water' | 'eyes' | 'breathe' | 'window' | 'walk' | 'snack' | 'shoulders';

export interface Suggestion {
  id: SuggestionArt;
  title: string;
  body: string;
  /** Only offered on long tea breaks. */
  long?: boolean;
  /** Seconds to linger before rotating. */
  dwell?: number;
}

export const SUGGESTIONS: Suggestion[] = [
  { id: 'stretch', title: 'Stand up and stretch', body: 'Reach for the ceiling, then let your shoulders drop.' },
  { id: 'water', title: 'Sip some water', body: 'Or tea. A few sips now, a clearer head later.' },
  { id: 'eyes', title: '20-20-20 for your eyes', body: 'Look at something about 20 feet away for 20 seconds.' },
  { id: 'breathe', title: 'Breathe with the circle', body: 'In as it grows, out as it settles.', dwell: 40 },
  { id: 'window', title: 'Look out the window', body: 'Find the farthest thing you can see.' },
  { id: 'shoulders', title: 'Roll your shoulders', body: 'Five slow rolls back, then five forward.' },
  { id: 'walk', title: 'Take a little walk', body: 'To the kitchen and back counts. Chai says so.', long: true },
  { id: 'snack', title: 'Have a small snack', body: 'Something crunchy, something kind.', long: true },
];

export function suggestionsFor(long: boolean): Suggestion[] {
  const pool = SUGGESTIONS.filter((s) => long || !s.long);
  if (!long) return pool;
  // Long breaks lead with the "special" ideas.
  return [...pool.filter((s) => s.long), ...pool.filter((s) => !s.long)];
}
