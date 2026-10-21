/**
 * The storage-full warning, in the page itself (never over it). OWNER: core-loop area. State: ./saveWarningState.ts.
 *
 *  - `<SaveWarningBanner/>`: Today (under the greeting) and Settings › Your data (beside the backup tools). It takes its
 *    own room and scrolls with the page; "Save backup" is an ordinary button in the tab order.
 *  - `<SaveWarningNote/>`: one line on the summary — the brew it shows is not saved in this browser.
 * Calm by design: the honey tint, no motion, no alarm colour; it stays while saving fails.
 */
import { useEffect, useId, useLayoutEffect, useRef } from 'react';
import { Icon } from '@/art';
import { Button } from '@/ui/Button';
import { useTimer } from '@/timer';
import { useRoute, type Route } from './router';
import { announceSaveWarning, saveBackupNow, saveWarningText, settleAnchor, useSaveWarning } from './saveWarningState';
import s from './SaveWarning.module.css';

/**
 * Whether to show the warning on the screen of `home`: it follows the warning only while that screen is the current
 * one and is staying. A screen on its way out keeps the frame the person left, so nothing appears in it, or moves, as
 * it goes: once its route has changed, and from the moment a brew or break starts on it (Today's "Put the kettle on",
 * the summary's "Tea time" — the start's own save can fail a moment before the route changes). A screen opened while
 * a brew or break is already running (Today during a brew) follows the warning as usual.
 */
function useShown(home: Route): boolean {
  const failing = useSaveWarning((st) => st.failing);
  const route = useRoute();
  const live = useTimer((t) => t.status !== 'idle');
  const openedLive = useRef(live);
  const staying = route === home && (!live || openedLive.current);
  const shown = useRef(staying ? failing : false);
  if (staying) shown.current = failing;
  return shown.current;
}

/** When the warning appears or goes while this screen is open, keep what the person is touching where it was. */
function useSteady(shown: boolean) {
  const prev = useRef(shown);
  useLayoutEffect(() => {
    if (prev.current === shown) return;
    prev.current = shown;
    settleAnchor();
  }, [shown]);
  useEffect(() => {
    if (shown) announceSaveWarning();
  }, [shown]);
}

export function SaveWarningBanner({ home, className }: { home: Route; className?: string }) {
  const failing = useShown(home);
  const quota = useSaveWarning((st) => st.quota);
  const id = useId();
  useSteady(failing);
  if (!failing) return null;
  const { title, body } = saveWarningText(quota);
  return (
    <section className={className ? `${s.banner} ${className}` : s.banner} aria-labelledby={`${id}-t`} data-save-warning="">
      <span className={s.icon} aria-hidden="true">
        <Icon name="info" size={18} />
      </span>
      <p className={s.text}>
        <strong id={`${id}-t`} className={s.title}>
          {title}
        </strong>{' '}
        {body}
      </p>
      <Button variant="secondary" size="sm" icon="download" className={s.action} onClick={saveBackupNow}>
        Save backup
      </Button>
    </section>
  );
}

export function SaveWarningNote({ className }: { className?: string }) {
  const failing = useShown('/done');
  const quota = useSaveWarning((st) => st.quota);
  useSteady(failing);
  if (!failing) return null;
  return (
    <p className={className ? `${s.note} ${className}` : s.note} data-save-warning="">
      <span className={s.noteIcon} aria-hidden="true">
        <Icon name="info" size={16} />
      </span>
      <span className={s.noteText}>{quota ? 'Not saved: storage is full.' : 'Not saved in this browser.'}</span>
      <button type="button" className={s.noteAction} onClick={saveBackupNow}>
        Save backup
      </button>
    </p>
  );
}
