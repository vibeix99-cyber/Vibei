/** Boot order matters: listeners (progress, flow, audio) before the timer restores. */
import { initProgress } from '@/progress';
import { initAudio } from '@/audio';
import { initTimer } from '@/timer';
import { initFlow } from './flow';
import { applyDebugParams } from './debug';

export function boot(): void {
  applyDebugParams();
  initProgress();
  initAudio();
  initFlow();
  initTimer();
}
