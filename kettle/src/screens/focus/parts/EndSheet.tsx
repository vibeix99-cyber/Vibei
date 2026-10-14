/**
 * "Leave the kettle early?" — gentle confirm with Chai looking concerned (never guilt). What ending does is said
 * honestly (I13): the minutes are kept, and a day turns warm when a brew runs to the whistle (the progress engine's
 * rule), said only when today is not warm yet.
 */
import { useRef } from 'react';
import { Mascot } from '@/art';
import { Button, Pill, Sheet } from '@/ui';
import { plural } from '@/lib/format';
import { useStreak } from '@/progress';
import s from './sheets.module.css';

export interface EndSheetProps {
  open: boolean;
  focusedMs: number;
  onKeep: () => void;
  onEnd: () => void;
}

export function EndSheet({ open, focusedMs, onKeep, onEnd }: EndSheetProps) {
  const keepRef = useRef<HTMLButtonElement>(null);
  const minutes = Math.floor(focusedMs / 60_000);
  const counts = minutes >= 1;
  const warmToday = useStreak().todayDone;
  const warmLine = warmToday ? '' : ' Today turns warm when a brew runs to the whistle.';

  return (
    <Sheet
      open={open}
      onClose={onKeep}
      title="Leave the kettle early?"
      size="sm"
      align="center"
      initialFocus={keepRef}
      hero={<Mascot pose="concerned" size={112} />}
      description={counts ? `That’s okay — your minutes still count.${warmLine}` : `That’s okay. It’s been under a minute, so there’s nothing to save yet.${warmLine}`}
      footer={
        <div className={s.actions}>
          <Button ref={keepRef} block size="lg" onClick={onKeep}>
            Keep brewing
          </Button>
          <Button block variant="dangerSoft" sfx="cancel" onClick={onEnd}>
            End session
          </Button>
        </div>
      }
    >
      {counts && (
        <div className={s.savedRow}>
          <Pill tone="matcha" icon="leaf">
            {plural(minutes, 'minute')} of focus will be saved
          </Pill>
        </div>
      )}
    </Sheet>
  );
}
