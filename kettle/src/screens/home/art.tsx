/**
 * Home-area data illustration: a focus → break cycle bar on a shared time
 * scale (all character/object art comes from `@/art`).
 */
/** Focus → break cycle on a shared time scale, so longer rhythms read longer. */
export function RhythmArt({ focusMin, breakMin, scaleMin, className }: { focusMin: number; breakMin: number; scaleMin?: number; className?: string }) {
  const total = scaleMin ?? focusMin + breakMin;
  const W = 300;
  const gap = 4;
  const fw = Math.max(12, (focusMin / total) * W);
  const bw = Math.max(8, (breakMin / total) * W);
  return (
    <svg viewBox={`0 0 ${W} 14`} className={className} preserveAspectRatio="none" aria-hidden>
      <rect x="0" y="0" width={W} height="14" rx="7" fill="var(--oat)" />
      <rect x="0" y="0" width={fw} height="14" rx="7" fill="var(--persimmon)" />
      <rect x={fw + gap} y="0" width={bw} height="14" rx="7" fill="var(--sky)" />
    </svg>
  );
}
