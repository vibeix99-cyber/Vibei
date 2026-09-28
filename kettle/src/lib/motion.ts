/**
 * Shared motion presets ("cozy bounce"). OWNER: design-system area.
 * Areas should import these rather than inventing springs. Everything here has a
 * reduced-motion twin: pass `reduced` (from `useReducedMotion()`) to the helpers.
 *
 * CSS twins live in tokens.css: --ease-spring / --ease-bounce / --dur-*.
 */
import type { Transition, Variants } from 'motion/react';

export const spring = {
  /** Default UI spring — soft bounce. */
  cozy: { type: 'spring', stiffness: 380, damping: 26, mass: 0.9 } as const,
  /** Snappy for presses / small toggles / indicators. */
  snappy: { type: 'spring', stiffness: 700, damping: 38 } as const,
  /** Gentle for big surfaces / screens / sheets. */
  gentle: { type: 'spring', stiffness: 260, damping: 30, mass: 1 } as const,
  /** Bouncy for celebrations. */
  joyful: { type: 'spring', stiffness: 420, damping: 14 } as const,
  /** Progress fills — settles without wobbling numbers. */
  fill: { type: 'spring', stiffness: 120, damping: 22, mass: 1 } as const,
};

export const ease = {
  out: [0.22, 1, 0.36, 1] as const,
  inOut: [0.65, 0, 0.35, 1] as const,
  in: [0.55, 0, 1, 0.45] as const,
};

export const duration = {
  instant: 0.09,
  fast: 0.15,
  base: 0.24,
  slow: 0.42,
  slower: 0.7,
};

/** Reduced-motion stand-in for any transition: a short cross-fade. */
export const fade: Transition = { duration: 0.16, ease: ease.out };

/** "Everything that appears, arrives": scale 0.9→1 + fade (fade-only when reduced). */
export function arrive(reduced: boolean, delay = 0): { initial: object; animate: object; exit: object; transition: Transition } {
  return reduced
    ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 }, transition: { ...fade, delay } }
    : {
        initial: { opacity: 0, scale: 0.9, y: 6 },
        animate: { opacity: 1, scale: 1, y: 0 },
        exit: { opacity: 0, scale: 0.96, y: 4 },
        transition: { ...spring.cozy, delay },
      };
}

/** Short slide-up entrance (lists, cards). */
export function slideUp(reduced: boolean, delay = 0, distance = 12) {
  return reduced
    ? { initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { ...fade, delay } }
    : { initial: { opacity: 0, y: distance }, animate: { opacity: 1, y: 0 }, transition: { ...spring.gentle, delay } };
}

/** Parent/child stagger for lists: `<motion.ul variants={stagger(reduced)} initial="hidden" animate="show">`. */
export function stagger(reduced: boolean, each = 0.05, delayChildren = 0): Variants {
  return {
    hidden: {},
    show: { transition: { staggerChildren: reduced ? 0 : each, delayChildren } },
  };
}
export function staggerItem(reduced: boolean): Variants {
  return reduced
    ? { hidden: { opacity: 0 }, show: { opacity: 1, transition: fade } }
    : { hidden: { opacity: 0, y: 10, scale: 0.98 }, show: { opacity: 1, y: 0, scale: 1, transition: spring.cozy } };
}

/** Route transition used by App (tab screens fade/slide; full-screen flows rise). */
export function pageTransition(reduced: boolean) {
  return reduced
    ? {
        initial: { opacity: 0 },
        animate: { opacity: 1, transition: { duration: 0.14, ease: ease.out } },
        exit: { opacity: 0, transition: { duration: 0.08, ease: ease.in } },
      }
    : {
        initial: { opacity: 0, y: 10 },
        animate: { opacity: 1, y: 0, transition: { duration: 0.28, ease: ease.out } },
        exit: { opacity: 0, y: -4, transition: { duration: 0.12, ease: ease.in } },
      };
}

export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  if (document.documentElement.dataset.motion === 'reduce') return true;
  if (document.documentElement.dataset.motion === 'full') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}
