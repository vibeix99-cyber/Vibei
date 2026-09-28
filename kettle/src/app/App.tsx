/**
 * Root component: theme, route switching, onboarding gate, area isolation.
 * Shared file — keep changes minimal and coordinated.
 */
import { lazy, Suspense, useEffect, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { useSettings } from '@/state/settings';
import { useTimer } from '@/timer';
import { useReducedMotion } from '@/lib/useReducedMotion';
import { ErrorBoundary } from './ErrorBoundary';
import { Shell } from './Shell';
import { Rail } from './Rail';
import { navigate, useRoute, TAB_ROUTES, type Route } from './router';
import { useApplyTheme } from './theme';

const Home = lazy(() => import('@/screens/home/HomeScreen'));
const Stats = lazy(() => import('@/screens/stats/StatsScreen'));
const NookScreen = lazy(() => import('@/screens/nook/NookScreen'));
const Settings = lazy(() => import('@/screens/settings/SettingsScreen'));
const Focus = lazy(() => import('@/screens/focus/FocusScreen'));
const Done = lazy(() => import('@/screens/done/DoneScreen'));
const Welcome = lazy(() => import('@/screens/welcome/WelcomeScreen'));
const Kit = lazy(() => import('./KitRoute'));

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
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={route}
        initial={reduced ? { opacity: 0 } : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={reduced ? { opacity: 0 } : { opacity: 0, y: -4 }}
        transition={{ duration: reduced ? 0.12 : 0.22, ease: [0.22, 1, 0.36, 1] }}
        style={{ minHeight: '100%' }}
      >
        <ErrorBoundary area={screen.area}>
          <Suspense fallback={null}>{screen.el()}</Suspense>
        </ErrorBoundary>
      </motion.div>
    </AnimatePresence>
  );

  if (TAB_ROUTES.includes(route)) {
    return <Shell rail={<Rail />}>{content}</Shell>;
  }
  return content;
}
