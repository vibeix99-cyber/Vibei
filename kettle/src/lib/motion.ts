/** Shared motion presets ("cozy bounce"). Areas should import these rather than inventing springs. */
export const spring = {
  /** Default UI spring — soft bounce. */
  cozy: { type: 'spring', stiffness: 380, damping: 26, mass: 0.9 } as const,
  /** Snappy for presses / small toggles. */
  snappy: { type: 'spring', stiffness: 700, damping: 32 } as const,
  /** Gentle for big surfaces / screens. */
  gentle: { type: 'spring', stiffness: 220, damping: 28 } as const,
  /** Bouncy for celebrations. */
  joyful: { type: 'spring', stiffness: 420, damping: 14 } as const,
};

export const ease = {
  out: [0.22, 1, 0.36, 1] as const,
  inOut: [0.65, 0, 0.35, 1] as const,
};

export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}
