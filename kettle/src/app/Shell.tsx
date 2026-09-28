/**
 * App chrome: bottom tab bar (mobile) / left sidebar (desktop) + main column.
 * INITIAL. OWNER: design-system area (responsive layout, nav visuals, right rail).
 */
import type { ReactNode } from 'react';
import { Icon, type IconName } from '@/art';
import { navigate, useRoute, type Route } from './router';
import s from './Shell.module.css';

const TABS: { to: Route; label: string; icon: IconName }[] = [
  { to: '/', label: 'Today', icon: 'home' },
  { to: '/stats', label: 'Stats', icon: 'stats' },
  { to: '/nook', label: 'Nook', icon: 'nook' },
  { to: '/settings', label: 'Settings', icon: 'settings' },
];

export function Shell({ children, rail }: { children: ReactNode; rail?: ReactNode }) {
  const route = useRoute();
  return (
    <div className={s.shell}>
      <a className={s.skip} href="#main">
        Skip to content
      </a>
      <nav className={s.nav} aria-label="Main">
        <div className={s.brand}>Kettle</div>
        <ul className={s.tabs}>
          {TABS.map((t) => (
            <li key={t.to}>
              <a
                href={`#${t.to}`}
                className={s.tab}
                aria-current={route === t.to ? 'page' : undefined}
                onClick={(e) => {
                  e.preventDefault();
                  navigate(t.to);
                }}
              >
                <Icon name={t.icon} size={28} />
                <span className={s.tabLabel}>{t.label}</span>
              </a>
            </li>
          ))}
        </ul>
      </nav>
      <main id="main" className={s.main} tabIndex={-1}>
        {children}
      </main>
      {rail && <aside className={s.rail}>{rail}</aside>}
    </div>
  );
}
