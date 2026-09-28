/**
 * Isolated timer harness (timer area). Boots only the timer engine + progress
 * recording — no screens — so engine e2e tests don't depend on UI work in
 * progress elsewhere. Exposes the same `window.__kettle` subset the app's debug
 * API has. Open: http://127.0.0.1:5183/tests/harness/timer.html
 */
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { clock } from '@/lib/clock';
import { on } from '@/lib/events';
import { initProgress, useProgress } from '@/progress';
import { useSettings } from '@/state/settings';
import { initTimer, useTimer, useRemaining, timerDiagnostics, getTimerView, TimerAnnouncer, lastAnnouncement } from '@/timer';
import { compactClock } from '@/timer/tabPresence';

const log: { type: string; at: number; payload: unknown }[] = [];
for (const type of ['timer:start', 'timer:pause', 'timer:resume', 'timer:complete', 'timer:stop', 'timer:addTime', 'timer:sync'] as const) {
  on(type, (payload) => log.push({ type, at: clock.now(), payload }));
}
useSettings.getState().set({ onboarded: true });
initProgress();
initTimer();

let renders = 0;
function View() {
  const v = useRemaining();
  renders++;
  return (
    <main style={{ font: '16px system-ui', padding: 24 }}>
      <p data-testid="status">{v.status}</p>
      <p data-testid="clock" style={{ fontSize: 48 }}>{compactClock(v.seconds)}</p>
      <p data-testid="phase">{v.phase}</p>
      <button onClick={() => useTimer.getState().startFocus({ minutes: 0.1 })}>Start 6s</button>
      <button onClick={() => useTimer.getState().toggle()}>Toggle</button>
      <TimerAnnouncer />
    </main>
  );
}

const api = {
  clock,
  timer: useTimer,
  progress: useProgress,
  settings: useSettings,
  timerInfo: timerDiagnostics,
  view: getTimerView,
  events: log,
  renders: () => renders,
  lastAnnouncement,
  ff: (ms: number) => clock.advance(ms),
};
(window as unknown as { __kettle: typeof api }).__kettle = api;

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <View />
  </StrictMode>,
);
