/**
 * Theme + motion attributes on <html>. OWNER: design-system area.
 *
 * - `data-theme="light|dark"` from settings (auto = system preference), applied
 *   synchronously at import so the first React paint is already right (index.html
 *   also sets it before any CSS/JS loads).
 * - smooth cross-fade when the theme changes at runtime (skipped under reduced motion)
 * - `<meta name="theme-color">` follows the page background
 * - `data-motion="reduce|full"` mirrors the effective reduced-motion preference
 *   (system or settings) so CSS can honor the in-app setting too.
 */
import { useEffect } from 'react';
import { useSettings, getSettings, type ThemePref } from '@/state/settings';
import { useReducedMotion } from '@/lib/useReducedMotion';

export const THEME_COLORS = { light: '#fff9f0', dark: '#241a2d' } as const;

function systemDark(): boolean {
  return typeof window !== 'undefined' && !!window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
}

export function resolveTheme(pref: ThemePref): 'light' | 'dark' {
  return pref === 'dark' || (pref === 'auto' && systemDark()) ? 'dark' : 'light';
}

let transitionTimer: number | undefined;
let settled = false;

export function applyTheme(theme: 'light' | 'dark', opts: { animate?: boolean } = {}): void {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  if (root.dataset.theme === theme) return;
  const animate = opts.animate && root.dataset.theme != null && root.dataset.motion !== 'reduce';
  if (animate) {
    root.classList.add('theme-transition');
    window.clearTimeout(transitionTimer);
    transitionTimer = window.setTimeout(() => root.classList.remove('theme-transition'), 420);
  }
  root.dataset.theme = theme;
  root.style.colorScheme = theme;
  let meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]:not([media])');
  if (!meta) {
    meta = document.createElement('meta');
    meta.name = 'theme-color';
    document.head.appendChild(meta);
  }
  meta.content = THEME_COLORS[theme];
}

// First paint: apply before React renders.
if (typeof document !== 'undefined') {
  try {
    const st = getSettings();
    applyTheme(resolveTheme(st.theme));
    const sysReduce = !!window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    document.documentElement.dataset.motion = st.motion === 'reduce' || (st.motion === 'system' && sysReduce) ? 'reduce' : 'full';
  } catch {
    /* settings unavailable — CSS defaults to light */
  }
}

export function useApplyTheme(): void {
  const pref = useSettings((s) => s.theme);
  const reduced = useReducedMotion();

  useEffect(() => {
    document.documentElement.dataset.motion = reduced ? 'reduce' : 'full';
  }, [reduced]);

  useEffect(() => {
    const mql = window.matchMedia('(prefers-color-scheme: dark)');
    const apply = (animate: boolean) => applyTheme(resolveTheme(pref), { animate });
    // Never animate the very first application (page load / debug params).
    apply(settled);
    settled = true;
    const onChange = () => apply(true);
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, [pref]);
}
