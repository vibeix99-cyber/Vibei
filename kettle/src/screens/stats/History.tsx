/** Session history grouped by day — tap a brew to rename, retag or delete it (with undo). */
import { useId, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Icon, Leaf, Mascot } from '@/art';
import type { DayKey } from '@/lib/dates';
import { historyByDay, leavesBySession } from '@/progress/insights';
import { useProgress, type SessionRecord } from '@/progress';
import type { TagId } from '@/state/settings';
import { Button, Card, Chip, ChipGroup, Dialog, InlineUndo, Pill, Sheet, TextField, cx, toast } from '@/ui';
import { holdTop, keepStill, type Still } from '@/ui/moment';
import { TAG_BY_ID, TAGS, brewTitle } from '@/state/tags';
import { hm, hmLong, relDay, timeOf } from './format';
import s from './stats.module.css';

const PAGE_DAYS = 7;

export function HistorySection({ sessions, metDays, today }: { sessions: SessionRecord[]; metDays: Set<DayKey>; today: DayKey }) {
  const ledger = useProgress((st) => st.ledger);
  // A brew just deleted keeps its place in the list as its Undo (I10: Undo is inline, in the row the person acted on),
  // for its 5 s; the day's total is the real one (without it).
  const [removed, setRemoved] = useState<{ rec: SessionRecord; key: boolean } | null>(null);
  const real = useMemo(() => historyByDay(sessions), [sessions]);
  const days = useMemo(() => (removed && !sessions.some((x) => x.id === removed.rec.id) ? historyByDay([...sessions, removed.rec]) : real), [sessions, removed, real]);
  const totals = useMemo(() => new Map(real.map((d) => [d.day, d.focusMs])), [real]);
  // The delete changes what is above the row too (this week's totals, the charts): the Undo stays where the person saw
  // the row (on screen), whatever moved above it.
  const hold = useRef<Still | null>(null);
  const onDeleted = (rec: SessionRecord, key: boolean) => {
    const li = document.querySelector(`[data-session-row="${CSS.escape(rec.id)}"]`);
    hold.current = li ? holdTop(li) : null;
    setRemoved({ rec, key });
  };
  useLayoutEffect(() => {
    const h = hold.current;
    hold.current = null;
    const row = removed && document.querySelector(`[data-undo-for="history-delete"]`);
    if (!h || !row) return;
    keepStill({ ...h, ref: row });
  }, [removed]);
  const leaves = useMemo(() => leavesBySession(ledger), [ledger]);
  const [shown, setShown] = useState(PAGE_DAYS);
  const [editing, setEditing] = useState<SessionRecord | null>(null);
  const headingId = useId();
  const visible = days.slice(0, shown);

  return (
    <Card as="section" className={cx(s.card, s.historyCard)} aria-labelledby={headingId}>
      <div className={s.cardHead}>
        <div className={s.cardTitles}>
          <h2 id={headingId} className={s.cardTitle}>
            History
          </h2>
          <p className={s.cardSub}>Tap a brew to rename, retag or delete it.</p>
        </div>
      </div>
      <div className={s.historyDays}>
        {visible.map((d) => (
          <section key={d.day} className={s.historyDay} aria-label={`${relDay(d.day, today)}, ${hmLong(totals.get(d.day) ?? 0)} focused`}>
            <header className={s.historyHead}>
              <h3 className={s.historyTitle}>{relDay(d.day, today)}</h3>
              <span className={s.historyTotal}>
                {hm(totals.get(d.day) ?? 0)}
                {metDays.has(d.day) && (
                  <span className={s.goalBadge} title="Daily goal met">
                    <Icon name="check" size={14} />
                    <span className="sr-only">, daily goal met</span>
                  </span>
                )}
              </span>
            </header>
            <ul className={s.historyList}>
              {d.sessions.map((x) =>
                removed?.rec.id === x.id ? (
                  <InlineUndo
                    key={x.id}
                    as="li"
                    className={s.undoRow}
                    message="Brew deleted"
                    icon="trash"
                    tone="berry"
                    focus={removed.key}
                    undoLabel={`Undo: bring back ${brewTitle(x)}`}
                    onUndo={() => {
                      useProgress.getState().restoreSession(removed.rec);
                      setRemoved(null);
                    }}
                    onExpire={() => setRemoved(null)}
                    data-undo-for="history-delete"
                  />
                ) : (
                  <li key={x.id} data-session-row={x.id}>
                    <SessionRow session={x} leaves={leaves.get(x.id) ?? 0} onOpen={() => setEditing(x)} />
                  </li>
                ),
              )}
            </ul>
          </section>
        ))}
      </div>
      {days.length > shown && (
        <Button variant="secondary" block onClick={() => setShown((n) => n + PAGE_DAYS * 2)}>
          Show earlier days
        </Button>
      )}
      <EditSheet session={editing} onClose={() => setEditing(null)} onDeleted={onDeleted} />
    </Card>
  );
}

function SessionRow({ session: x, leaves, onOpen }: { session: SessionRecord; leaves: number; onOpen: () => void }) {
  const meta = x.tag ? TAG_BY_ID[x.tag] : null;
  const title = brewTitle(x);
  const status = x.completed ? 'Full brew' : 'Ended early';
  const done = !!x.intention && x.outcome === 'done';
  return (
    <button
      type="button"
      className={s.sessionRow}
      onClick={onOpen}
      aria-label={`${title}${done ? ' (done)' : ''}, ${timeOf(x.startedAt)}, ${hmLong(x.focusedMs)}, ${status}${meta ? `, tagged ${meta.label}` : ''}, ${leaves} leaves. Edit`}
    >
      <span className={s.sessionIcon} data-tone={x.completed ? 'matcha' : undefined} data-partial={!x.completed || undefined} aria-hidden="true">
        <Icon name={x.completed ? 'cup' : 'clock'} size={22} />
      </span>
      <span className={s.sessionMain} aria-hidden="true">
        <span className={cx(s.sessionTitle, !x.intention && s.sessionUntitled)}>{title}</span>
        <span className={s.sessionMeta}>
          {done && (
            <span className={s.doneMark}>
              <Icon name="check" size={14} /> Done ·{' '}
            </span>
          )}
          {timeOf(x.startedAt)} · {hm(x.focusedMs)}
          {!x.completed && <> · ended early</>}
          {meta && (
            <span className={s.metaTag}>
              <Icon name={meta.icon} size={14} /> {meta.label}
            </span>
          )}
        </span>
      </span>
      <span className={s.sessionSide} aria-hidden="true">
        {meta && (
          <span className={s.sidePill}>
            <Pill size="sm" tone={meta.tone} icon={meta.icon}>
              {meta.label}
            </Pill>
          </span>
        )}
        <span className={s.sessionLeaves}>
          +{leaves}
          <Leaf size={14} />
        </span>
      </span>
    </button>
  );
}

function EditSheet({ session, onClose, onDeleted }: { session: SessionRecord | null; onClose: () => void; onDeleted: (rec: SessionRecord, key: boolean) => void }) {
  // Keyed so the form resets for each session.
  return (
    <Sheet open={!!session} onClose={onClose} title="Edit brew" description={session ? `${timeOf(session.startedAt)} · ${hm(session.focusedMs)}${session.completed ? ' · full brew' : ' · ended early'}` : undefined}>
      {session && <EditForm key={session.id} session={session} onDone={onClose} onDeleted={onDeleted} />}
    </Sheet>
  );
}

function EditForm({ session, onDone, onDeleted }: { session: SessionRecord; onDone: () => void; onDeleted: (rec: SessionRecord, key: boolean) => void }) {
  const [intention, setIntention] = useState(session.intention);
  const [tag, setTag] = useState<TagId | null>(session.tag);
  const [done, setDone] = useState(session.outcome === 'done');
  const [confirm, setConfirm] = useState(false);
  const save = () => {
    const outcome = !intention.trim() ? null : done ? 'done' : session.outcome === 'done' ? null : undefined;
    useProgress.getState().editSession(session.id, { intention, tag, ...(outcome !== undefined ? { outcome } : {}) });
    toast('Brew updated', { tone: 'success', icon: 'check' });
    onDone();
  };
  const remove = (e: { currentTarget: HTMLElement }) => {
    const record = session;
    // From the keyboard, focus lands on the Undo that takes the row's place (once the sheet has gone).
    const key = e.currentTarget.matches(':focus-visible');
    useProgress.getState().deleteSession(record.id);
    setConfirm(false);
    onDone();
    onDeleted(record, key);
  };
  return (
    <form
      className={s.editForm}
      onSubmit={(e) => {
        e.preventDefault();
        save();
      }}
    >
      <TextField label="What were you brewing?" value={intention} onChange={setIntention} maxLength={80} showCount clearable icon="pencil" placeholder="e.g. Chapter 3 notes" />
      {intention.trim() && (
        <Chip tone="matcha" icon={done ? undefined : 'check'} selected={done} onClick={() => setDone((d) => !d)} className={s.editDone}>
          Done
        </Chip>
      )}
      <div className={s.editTags}>
        <p className={s.fieldLabel} id="edit-tag-label">
          Tag
        </p>
        <ChipGroup
          label="Tag"
          allowEmpty
          value={tag}
          onChange={setTag}
          options={TAGS.map((t) => ({ value: t.id, label: t.label, icon: t.icon, tone: t.tone }))}
        />
      </div>
      <div className={s.editActions}>
        <Button type="submit" block size="lg">
          Save
        </Button>
        <Button variant="ghost" block icon="trash" onClick={() => setConfirm(true)} sfx="tap" className={s.dangerText}>
          Delete this brew
        </Button>
      </div>
      <Dialog
        open={confirm}
        onClose={() => setConfirm(false)}
        title="Delete this brew?"
        hero={<Mascot pose="concerned" size={96} />}
        description="It leaves your history, stats and warm days. The leaves you earned stay yours."
        footer={
          <div className={s.confirmActions}>
            <Button block onClick={() => setConfirm(false)} variant="primary">
              Keep it
            </Button>
            <Button block variant="ghost" onClick={remove} className={s.dangerText}>
              Delete
            </Button>
          </div>
        }
      />
    </form>
  );
}
