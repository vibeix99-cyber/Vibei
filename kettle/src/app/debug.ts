/**
 * Debug + screenshot API. Enabled in dev, or in any build with `?debug` in the URL.
 *
 * URL params (applied before first render):
 *   ?seed=fresh|blank|newbie|veteran|celebrate|atRisk   load a demo profile (see progress/seed.ts)
 *   ?theme=light|dark            force theme
 *   ?motion=reduce|full          force motion preference
 *   ?onboarded=0|1               override onboarding flag
 *   ?ff=<ms>                     fast-forward the clock after boot
 *
 * window.__kettle: { clock, timer, progress, settings, navigate, seed(name), ff(ms), finish() }
 */
import { clock } from '@/lib/clock';
import { useTimer, timerDiagnostics, getTimerView } from '@/timer';
import { getPwaState, applyPwaUpdate } from '@/pwa';
import { useProgress } from '@/progress';
import { useSettings } from '@/state/settings';
import { navigate, getRoute } from './router';
import { seedProfile, type SeedName } from '@/progress/seed';

export function debugEnabled(): boolean {
  return import.meta.env.DEV || new URLSearchParams(location.search).has('debug');
}

export function applyDebugParams(): void {
  if (!debugEnabled()) return;
  const p = new URLSearchParams(location.search);
  const seed = p.get('seed') as SeedName | null;
  if (seed) seedProfile(seed);
  const theme = p.get('theme');
  if (theme === 'light' || theme === 'dark') useSettings.getState().set({ theme });
  const motion = p.get('motion');
  if (motion === 'reduce' || motion === 'full') useSettings.getState().set({ motion });
  const onboarded = p.get('onboarded');
  if (onboarded === '0' || onboarded === '1') useSettings.getState().set({ onboarded: onboarded === '1' });

  const api = {
    clock,
    timer: useTimer,
    progress: useProgress,
    settings: useSettings,
    navigate,
    getRoute,
    seed: seedProfile,
    /** Timer internals: leader election, scheduler (worker/main), settling. */
    timerInfo: timerDiagnostics,
    /** What the timer displays right now (seconds, progress, status). */
    timerView: getTimerView,
    /** Service worker / update state (production builds). */
    pwa: { state: getPwaState, update: applyPwaUpdate },
    /** Fast-forward the clock by ms. */
    ff: (ms: number) => clock.advance(ms),
    /** Jump to 1s before the current phase ends. */
    nearEnd: () => {
      const t = useTimer.getState();
      if (t.status === 'running' && t.endsAt) clock.advance(t.endsAt - clock.now() - 1000);
    },
    /** Finish the current phase immediately. */
    finish: () => {
      const t = useTimer.getState();
      if (t.status === 'running' && t.endsAt) clock.advance(t.endsAt - clock.now() + 10);
      if (t.status === 'paused') {
        t.resume();
        const t2 = useTimer.getState();
        if (t2.endsAt) clock.advance(t2.endsAt - clock.now() + 10);
      }
      useTimer.getState().tick();
    },
  };
  (window as unknown as { __kettle: typeof api }).__kettle = api;

  const ff = Number(p.get('ff'));
  if (ff > 0) setTimeout(() => clock.advance(ff), 0);
}
