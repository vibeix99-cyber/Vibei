/** Focus + Break session screen — PLACEHOLDER. OWNER: core-loop area. */
import { useTimer, useRemaining } from '@/timer';
import { formatClock } from '@/lib/format';
import { Button } from '@/ui';
import { Nook } from '@/scene';
import { useUnlockedItems } from '@/progress';

export default function FocusScreen() {
  const t = useTimer();
  const { remainingMs, progress } = useRemaining();
  const items = useUnlockedItems();
  const isFocus = t.phase === 'focus';
  return (
    <div style={{ minHeight: '100vh', display: 'grid', gap: 16, padding: 16, alignContent: 'start' }}>
      <div style={{ height: 280 }}>
        <Nook mode={isFocus ? 'focus' : 'break'} progress={progress} items={items} />
      </div>
      <p>{isFocus ? 'Kettle’s warming up…' : 'Tea time'}</p>
      <div role="timer" style={{ fontFamily: 'var(--font-display)', fontSize: 72, fontWeight: 600 }}>
        {formatClock(remainingMs)}
      </div>
      <div style={{ display: 'flex', gap: 12 }}>
        <Button variant="secondary" onClick={() => t.toggle()} sfx={t.status === 'running' ? 'pause' : 'resume'}>
          {t.status === 'running' ? 'Pause' : 'Resume'}
        </Button>
        <Button variant="ghost" onClick={() => t.end('user')} sfx="cancel">
          End
        </Button>
      </div>
    </div>
  );
}
