/**
 * <TimerAnnouncer/> — polite live region for the timer. OWNER: timer area.
 *
 * Mount it on the focus screen (anywhere; it's visually hidden). While mounted
 * it receives the timer's screen-reader announcements (start, pause/resume,
 * every 5 minutes, 1 minute left). Completion/stop messages always go to an
 * app-level region so they're not cut off when the focus screen unmounts.
 * Mounting more than one is harmless: only the latest receives messages.
 */
import { useEffect, useRef } from 'react';
import { initAnnouncer, registerAnnouncerSink } from './announce';

const style: React.CSSProperties = {
  position: 'absolute',
  width: 1,
  height: 1,
  padding: 0,
  margin: -1,
  overflow: 'hidden',
  clip: 'rect(0, 0, 0, 0)',
  whiteSpace: 'nowrap',
  border: 0,
};

export function TimerAnnouncer() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    initAnnouncer();
    const el = ref.current;
    return el ? registerAnnouncerSink(el) : undefined;
  }, []);
  return <div ref={ref} role="status" aria-live="polite" aria-atomic="true" data-kettle-announcer="focus" style={style} />;
}

export default TimerAnnouncer;
