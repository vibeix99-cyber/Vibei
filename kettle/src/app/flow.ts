/**
 * Session flow orchestration (what happens after a phase completes/stops).
 * INITIAL. OWNER: core-loop area.
 */
import { on } from '@/lib/events';
import { audio } from '@/audio';
import { getSettings } from '@/state/settings';
import { getTimer } from '@/timer';
import { getRoute, navigate } from './router';

let started = false;

export function initFlow(): void {
  if (started) return;
  started = true;

  on('timer:start', () => {
    if (getRoute() !== '/focus') navigate('/focus');
  });

  on('timer:complete', ({ phase }) => {
    if (phase === 'focus') {
      audio.play('complete');
      navigate('/done');
    } else {
      audio.play('breakOver');
      if (getSettings().autoStartFocus) getTimer().startFocus();
      else navigate('/');
    }
  });

  on('timer:stop', ({ phase }) => {
    if (phase === 'focus' && getRoute() === '/focus') navigate('/');
    else if (getRoute() === '/focus') navigate('/');
  });
}
