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
import { initTimer, useTimer, useRemaining, timerDiagnostics, getTimerView, TimerAnnouncer, lastAnnouncement, isWakeLockHeld, useProgressFrame } from '@/timer';
import { compactClock } from '@/timer/tabPresence';
import { initShortcuts, useShortcut, useShortcutHelp } from '@/lib/shortcuts';

const log: { type: string; at: number; payload: unknown }[] = [];
for (const type of ['timer:start', 'timer:pause', 'timer:resume', 'timer:complete', 'timer:stop', 'timer:addTime', 'timer:sync'] as const) {
  on(type, (payload) => log.push({ type, at: clock.now(), payload }));
}
useSettings.getState().set({ onboarded: true });
initProgress();
initTimer();
initShortcuts();

let renders = 0;
let buttonClicks = 0;
function Keys() {
  // Same binding the focus screen uses.
  useShortcut('Space', () => useTimer.getState().toggle());
  const { open } = useShortcutHelp();
  return (
    <section>
      <input aria-label="Intention" data-testid="input" />
      <button data-testid="btn" onClick={() => buttonClicks++}>
        A button
      </button>
      <p data-testid="help">{open ? 'help-open' : 'help-closed'}</p>
    </section>
  );
}
let frames = 0;
function Ring() {
  // Per-frame progress without re-rendering (what a progress ring should use).
  useProgressFrame((p) => {
    frames++;
    const el = document.getElementById('ring');
    if (el) el.setAttribute('value', String(p));
  });
  return <progress id="ring" max={1} value={0} aria-label="Brew progress" />;
}

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
      <Ring />
      <Keys />
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
  timerView: getTimerView,
  events: log,
  renders: () => renders,
  frames: () => frames,
  buttonClicks: () => buttonClicks,
  wakeLock: isWakeLockHeld,
  lastAnnouncement,
  ff: (ms: number) => clock.advance(ms),
};
(window as unknown as { __kettle: typeof api }).__kettle = api;

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <View />
  </StrictMode>,
);
