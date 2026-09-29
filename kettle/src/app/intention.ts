/**
 * Done / Carry forward for a brew's intention. OWNER: core loop.
 *
 * The outcome is stored on the session record (so it survives reloads and reaches other tabs through
 * progress sync), and the timer's intention — what the next brew starts with — follows it:
 * Done clears it, Carry forward keeps (or restores) it. Words the user has already typed for the next
 * brew are never overwritten.
 */
import { useProgress, type IntentionOutcome, type SessionRecord } from '@/progress';
import { useTimer } from '@/timer';

/** `null` takes the choice back (the intention is kept for the next brew, as when nothing was chosen). */
export function setIntentionOutcome(record: Pick<SessionRecord, 'id' | 'intention' | 'tag'>, outcome: IntentionOutcome | null): void {
  const words = record.intention.trim();
  if (!words) return;
  useProgress.getState().editSession(record.id, { outcome });
  const t = useTimer.getState();
  if (t.status !== 'idle' && t.phase === 'focus') return; // the next brew is already under way
  const next = t.intention.trim();
  if (outcome === 'done') {
    if (next === words) t.setIntention('');
  } else if (!next || next === words) {
    t.setIntention(words, record.tag);
  }
}

/** The most recent focus session, if its intention is what the next brew is about to reuse. */
export function carriedFrom(sessions: SessionRecord[], text: string): SessionRecord | null {
  const words = text.trim();
  if (!words) return null;
  for (let i = sessions.length - 1; i >= 0; i--) {
    const s = sessions[i];
    if (s.phase !== 'focus') continue;
    return s.intention.trim() === words && s.outcome !== 'done' ? s : null;
  }
  return null;
}
