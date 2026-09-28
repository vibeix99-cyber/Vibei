/**
 * Root component: theme, route switching, onboarding gate, area isolation.
 * Shared file — keep changes minimal and coordinated.
 */
import { lazy, Suspense, useEffect, useRef, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { useSettings } from '@/state/settings';
import { useTimer } from '@/timer';
import { useReducedMotion } from '@/lib/useReducedMotion';
import { pageTransition } from '@/lib/motion';
import { ErrorBoundary } from './ErrorBoundary';
import { Shell } from './Shell';
import { ShellOverlays } from './ShellOverlays';
import { Rail } from './Rail';
import { navigate, useRoute, TAB_ROUTES, type Route } from './router';
import { useApplyTheme } from './theme';

const loaders = {
  home: () => import('@/screens/home/HomeScreen'),
  stats: () => import('@/screens/stats/StatsScreen'),
  nook: () => import('@/screens/nook/NookScreen'),
  settings: () => import('@/screens/settings/SettingsScreen'),
  focus: () => import('@/screens/focus/FocusScreen'),
  done: () => import('@/screens/done/DoneScreen'),
  welcome: () => import('@/screens/welcome/WelcomeScreen'),
};
const Home = lazy(loaders.home);
const Stats = lazy(loaders.stats);
const NookScreen = lazy(loaders.nook);
const Settings = lazy(loaders.settings);
const Focus = lazy(loaders.focus);
const Done = lazy(loaders.done);
const Welcome = lazy(loaders.welcome);
const Kit = lazy(() => import('./KitRoute'));

/** Warm every screen chunk once the app is idle, so route changes never flash blank. */
function preloadScreens(): void {
  const run = () => Object.values(loaders).forEach((load) => void load().catch(() => {}));
  const w = window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number };
  if (w.requestIdleCallback) w.requestIdleCallback(run, { timeout: 4000 });
  else setTimeout(run, 1500);
}

/** Full-screen routes crossfade into each other (e.g. the kettle whistle → celebration). */
const IMMERSIVE: Route[] = ['/focus', '/done'];

const SCREENS: Record<Route, { area: string; el: () => ReactNode }> = {
  '/': { area: 'home', el: () => <Home /> },
  '/stats': { area: 'stats', el: () => <Stats /> },
  '/nook': { area: 'nook', el: () => <NookScreen /> },
  '/settings': { area: 'settings', el: () => <Settings /> },
  '/focus': { area: 'focus', el: () => <Focus /> },
  '/done': { area: 'done', el: () => <Done /> },
  '/welcome': { area: 'welcome', el: () => <Welcome /> },
  '/kit': { area: 'kit', el: () => <Kit /> },
};

export function App() {
  useApplyTheme();
  const route = useRoute();
  const onboarded = useSettings((s) => s.onboarded);
  const timerStatus = useTimer((s) => s.status);
  const reduced = useReducedMotion();
  const prevRoute = useRef(route);
  const crossfade = IMMERSIVE.includes(prevRoute.current) && IMMERSIVE.includes(route);
  useEffect(() => {
    prevRoute.current = route;
  }, [route]);
  useEffect(preloadScreens, []);

  // Gates: onboarding first; an active session always owns the screen on load.
  useEffect(() => {
    if (route === '/kit') return;
    if (!onboarded && route !== '/welcome') navigate('/welcome', { replace: true });
    else if (onboarded && route === '/welcome') navigate('/', { replace: true });
  }, [onboarded, route]);
  useEffect(() => {
    if (onboarded && timerStatus !== 'idle' && route !== '/focus') navigate('/focus', { replace: true });
    // only on first mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const screen = SCREENS[route];
  const content = (
    <AnimatePresence mode={crossfade ? 'popLayout' : 'wait'} initial={false}>
      <motion.div
        key={route}
        {...pageTransition(reduced)}
        style={{ minHeight: '100%' }}
      >
        <ErrorBoundary area={screen.area}>
          <Suspense fallback={null}>{screen.el()}</Suspense>
        </ErrorBoundary>
      </motion.div>
    </AnimatePresence>
  );

  if (TAB_ROUTES.includes(route)) {
    return (
      <>
        <Shell rail={<Rail />}>{content}</Shell>
        <ShellOverlays />
      </>
    );
  }
  return (
    <>
      {content}
      <ShellOverlays />
    </>
  );
}
