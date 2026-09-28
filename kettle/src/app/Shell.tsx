/**
 * App chrome. OWNER: design-system area.
 *  - phones: bottom tab bar (safe-area aware), active tab = full-color icon in a tinted pill
 *  - landscape phones: compact left icon rail
 *  - ≥ 900px: left sidebar (brand + nav + mini status); ≥ 1200px: + right rail
 * One <nav> restyled per breakpoint so keyboard/SR users always meet the same landmarks.
 */
import { useEffect, useRef, type ReactNode } from 'react';
import { motion } from 'motion/react';
import { Icon, Logo, type IconName } from '@/art';
import { audio } from '@/audio';
import { haptic } from '@/lib/haptics';
import { spring } from '@/lib/motion';
import { useReducedMotion } from '@/lib/useReducedMotion';
import { navigate, useRoute, type Route } from './router';
import { SidebarStatus } from './Rail';
import { ErrorBoundary } from './ErrorBoundary';
import s from './Shell.module.css';

const TABS: { to: Route; label: string; icon: IconName }[] = [
  { to: '/', label: 'Today', icon: 'home' },
  { to: '/stats', label: 'Stats', icon: 'stats' },
  { to: '/nook', label: 'Nook', icon: 'nook' },
  { to: '/settings', label: 'Settings', icon: 'settings' },
];

export function Shell({ children, rail }: { children: ReactNode; rail?: ReactNode }) {
  const route = useRoute();
  const reduced = useReducedMotion();
  const mainRef = useRef<HTMLElement>(null);
  const first = useRef(true);

  // New tab screen: start at the top and move focus to the content (not on first load).
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
    mainRef.current?.focus({ preventScroll: true });
  }, [route]);

  return (
    <div className={s.shell}>
      <a className={s.skip} href="#main" onClick={(e) => {
        e.preventDefault();
        mainRef.current?.focus();
      }}>
        Skip to content
      </a>
      <nav className={s.nav} aria-label="Main">
        <a
          className={s.brand}
          href="#/"
          aria-label="Kettle, today"
          onClick={(e) => {
            e.preventDefault();
            navigate('/');
          }}
        >
          <span className={s.logo} aria-hidden="true">
            <Logo size={40} />
          </span>
        </a>
        <ul className={s.tabs}>
          {TABS.map((t) => {
            const active = route === t.to;
            return (
              <li key={t.to} className={s.item}>
                <a
                  href={`#${t.to}`}
                  className={s.tab}
                  aria-current={active ? 'page' : undefined}
                  onClick={(e) => {
                    e.preventDefault();
                    if (active) {
                      window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' });
                      return;
                    }
                    audio.play('tap', { volume: 0.7 });
                    haptic('light');
                    navigate(t.to);
                  }}
                >
                  <span className={s.iconWrap}>
                    {active && (
                      <motion.span
                        layoutId="nav-indicator"
                        className={s.indicator}
                        transition={reduced ? { duration: 0 } : spring.snappy}
                        aria-hidden="true"
                      />
                    )}
                    <motion.span
                      key={active ? 'on' : 'off'}
                      className={s.icon}
                      initial={active && !reduced ? { scale: 0.7, rotate: -8 } : false}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={spring.joyful}
                    >
                      <Icon name={t.icon} tone={active ? 'color' : 'mono'} size={28} />
                    </motion.span>
                  </span>
                  <span className={s.label}>{t.label}</span>
                </a>
              </li>
            );
          })}
        </ul>
        <div className={s.sideStatus}>
          <ErrorBoundary area="sidebar-status" fallback={null}>
            <SidebarStatus />
          </ErrorBoundary>
        </div>
      </nav>
      <div className={s.stage}>
        <main id="main" ref={mainRef} className={s.main} tabIndex={-1}>
          {children}
        </main>
        {rail && (
          <aside className={s.rail} aria-label="Your day">
            <ErrorBoundary area="rail" fallback={null}>
              {rail}
            </ErrorBoundary>
          </aside>
        )}
      </div>
    </div>
  );
}
