/**
 * Root component: theme, route switching, onboarding gate, area isolation.
 * Shared file (orchestrator) — keep changes minimal and coordinated.
 *
 * Route transitions never pass through an empty frame:
 *  - screen chunks are warmed on idle and, once loaded, render synchronously
 *    (no Suspense flash);
 *  - two layers: the persistent tab shell vs. each full-screen route. Inside
 *    the shell, tabs switch in place. Between layers the incoming layer fades
 *    in ON TOP of the outgoing one, which stays opaque underneath until it is
 *    removed. Its paper covers the old screen within ~90 ms and its content
 *    rises over that: never a gap and never text over text.
 */
import { lazy, Suspense, useEffect, useRef, type ComponentType, type ReactNode, type Ref } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { useSettings } from '@/state/settings';
import { useTimer } from '@/timer';
import { useReducedMotion } from '@/lib/useReducedMotion';
import { ease } from '@/lib/motion';
import { ErrorBoundary } from './ErrorBoundary';
import { Shell } from './Shell';
import { ShellOverlays } from './ShellOverlays';
import { Rail } from './Rail';
import { navigate, useRoute, TAB_ROUTES, type Route } from './router';
import { useApplyTheme } from './theme';

type Loader = () => Promise<{ default: ComponentType }>;

/** A lazy screen that renders synchronously once its chunk has been loaded (no Suspense flash). */
function lazyScreen(load: Loader) {
  let Loaded: ComponentType | null = null;
  let pending: Promise<{ default: ComponentType }> | null = null;
  const preload = () =>
    (pending ??= load().then((m) => {
      Loaded = m.default;
      return m;
    }));
  const Lazy = lazy(preload);
  function Screen() {
    return Loaded ? <Loaded /> : <Lazy />;
  }
  Screen.preload = () => void preload().catch(() => (pending = null));
  return Screen;
}

const Home = lazyScreen(() => import('@/screens/home/HomeScreen'));
const Stats = lazyScreen(() => import('@/screens/stats/StatsScreen'));
const NookScreen = lazyScreen(() => import('@/screens/nook/NookScreen'));
const Settings = lazyScreen(() => import('@/screens/settings/SettingsScreen'));
const Focus = lazyScreen(() => import('@/screens/focus/FocusScreen'));
const Done = lazyScreen(() => import('@/screens/done/DoneScreen'));
const Welcome = lazyScreen(() => import('@/screens/welcome/WelcomeScreen'));
const Kit = lazyScreen(() => import('./KitRoute'));

const SCREENS: Record<Route, { area: string; Screen: ReturnType<typeof lazyScreen> }> = {
  '/': { area: 'home', Screen: Home },
  '/stats': { area: 'stats', Screen: Stats },
  '/nook': { area: 'nook', Screen: NookScreen },
  '/settings': { area: 'settings', Screen: Settings },
  '/focus': { area: 'focus', Screen: Focus },
  '/done': { area: 'done', Screen: Done },
  '/welcome': { area: 'welcome', Screen: Welcome },
  '/kit': { area: 'kit', Screen: Kit },
};

/** Warm every screen chunk once the app is idle, so route changes never flash blank. */
function preloadScreens(): void {
  const run = () => Object.values(SCREENS).forEach(({ Screen }) => Screen.preload());
  const w = window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number };
  if (w.requestIdleCallback) w.requestIdleCallback(run, { timeout: 3000 });
  else setTimeout(run, 1200);
}

/**
 * Incoming layer dissolves in above the outgoing one (which drops below and stays opaque).
 * The incoming layer's paper covers the old screen quickly (~90 ms) while its content rises in over
 * the full duration, so the two screens' text never shows through each other, and there is still
 * never an empty frame.
 */
function layerTransition(reduced: boolean, instant = false) {
  const inDur = reduced ? 0.14 : 0.24;
  const cover = reduced ? 0.06 : 0.08;
  return {
    layer: {
      initial: { zIndex: 1 },
      animate: { zIndex: 1 },
      // Stay fully visible underneath until the incoming layer has covered it, then vanish.
      // (Must animate a real change — an exit to the current value would finish instantly.)
      exit: { opacity: 0, zIndex: 0, transition: { zIndex: { duration: 0 }, opacity: { delay: inDur, duration: 0.05 } } },
    },
    paper: {
      initial: instant ? { opacity: 1 } : { opacity: 0 },
      animate: { opacity: 1, transition: { duration: cover, ease: 'linear' as const } },
    },
    content: {
      initial: instant ? { opacity: 1 } : reduced ? { opacity: 0 } : { opacity: 0, y: 10 },
      // Starts once the paper has mostly covered the old screen, so their text never reads at once.
      animate: { opacity: 1, y: 0, transition: { duration: inDur, delay: instant ? 0 : cover * 0.6, ease: ease.out } },
    },
  };
}

const layerStyle = { position: 'relative', minHeight: '100%' } as const;
const paperStyle = { position: 'absolute', inset: 0, background: 'var(--bg)', pointerEvents: 'none' } as const;
const contentStyle = { position: 'relative', minHeight: '100%' } as const;

/** One route layer: its paper and its content fade separately (see `layerTransition`). */
function Dissolve({ t, children, ref }: { t: ReturnType<typeof layerTransition>; children: ReactNode; ref?: Ref<HTMLDivElement> }) {
  // `ref` is forwarded so AnimatePresence's popLayout can measure and pop the exiting layer.
  return (
    <motion.div ref={ref} {...t.layer} style={layerStyle}>
      <motion.div aria-hidden="true" {...t.paper} style={paperStyle} />
      <motion.div {...t.content} style={contentStyle}>
        {children}
      </motion.div>
    </motion.div>
  );
}

function RouteView({ route }: { route: Route }) {
  const { area, Screen } = SCREENS[route];
  return (
    <ErrorBoundary area={area}>
      <Suspense fallback={null}>
        <Screen />
      </Suspense>
    </ErrorBoundary>
  );
}

/** Tabs inside the persistent shell. `route` is a prop (not a hook) so an exiting layer keeps its own screen. */
function TabSwitch({ route, reduced }: { route: Route; reduced: boolean }) {
  return (
    <div style={{ position: 'relative' }}>
      <AnimatePresence mode="popLayout" initial={false}>
        <Dissolve key={route} t={layerTransition(reduced)}>
          <RouteView route={route} />
        </Dissolve>
      </AnimatePresence>
    </div>
  );
}

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
  useEffect(preloadScreens, []);

  const inShell = TAB_ROUTES.includes(route);
  const layerKey = inShell ? 'shell' : route;
  // The whistle "bloom" already paints the celebration's background, so focus → done
  // must not fade in again from zero on top of it (that read as a blank cream beat).
  const prevRoute = useRef(route);
  const fromBloom = prevRoute.current === '/focus' && route === '/done';
  useEffect(() => {
    prevRoute.current = route;
  }, [route]);
  const transition = layerTransition(reduced, fromBloom);

  let layer: ReactNode;
  if (inShell) {
    layer = (
      <Shell rail={<Rail />}>
        <TabSwitch route={route} reduced={reduced} />
      </Shell>
    );
  } else {
    layer = <RouteView route={route} />;
  }

  return (
    <>
      <div style={{ position: 'relative', minHeight: '100%' }}>
        <AnimatePresence mode="popLayout" initial={false}>
          <Dissolve key={layerKey} t={transition}>
            {layer}
          </Dissolve>
        </AnimatePresence>
      </div>
      <ShellOverlays />
    </>
  );
}
