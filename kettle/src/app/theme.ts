/** Applies `data-theme` on <html> from settings (auto = system preference). OWNER: design-system area. */
import { useEffect } from 'react';
import { useSettings } from '@/state/settings';

export function useApplyTheme(): void {
  const pref = useSettings((s) => s.theme);
  useEffect(() => {
    const mql = window.matchMedia('(prefers-color-scheme: dark)');
    const apply = () => {
      const dark = pref === 'dark' || (pref === 'auto' && mql.matches);
      document.documentElement.dataset.theme = dark ? 'dark' : 'light';
      const meta = document.querySelector('meta[name="theme-color"]');
      meta?.setAttribute('content', dark ? '#1f1a2e' : '#fff9f0');
    };
    apply();
    mql.addEventListener('change', apply);
    return () => mql.removeEventListener('change', apply);
  }, [pref]);
}
