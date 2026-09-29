/** "Your data": export, import (with preview + confirm), reset (serious confirm). */
import { useRef, useState, type ChangeEvent } from 'react';
import { Icon, Mascot } from '@/art';
import { audio } from '@/audio';
import { plural } from '@/lib/format';
import { parseDayKey } from '@/lib/dates';
import { importData, previewImport, resetAllData, undoLastImport, type ImportSummary } from '@/progress';
import { Button, ListGroup, ListRow, SegmentedControl, Sheet, toast } from '@/ui';
import { downloadBackup } from '@/screens/home/shims/data';
import s from './Settings.module.css';

type Msg = { tone: 'ok' | 'error'; text: string } | null;

const dateFmt = new Intl.DateTimeFormat(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
const fmtDay = (d: string | null) => (d ? dateFmt.format(parseDayKey(d)) : '');

export function DataSection() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [msg, setMsg] = useState<Msg>(null);
  const [pending, setPending] = useState<{ text: string; summary: ImportSummary; hasProgress: boolean } | null>(null);
  const [resetOpen, setResetOpen] = useState(false);

  /** Successes are a toast; problems stay inline next to the control (and are announced). */
  const say = (m: Msg) => {
    if (m?.tone === 'ok') {
      setMsg(null);
      toast.success(m.text);
    } else setMsg(m);
  };

  const onExport = () => {
    try {
      const name = downloadBackup();
      say({ tone: 'ok', text: `Saved ${name}. Keep it somewhere safe.` });
    } catch {
      say({ tone: 'error', text: 'Couldn’t save the backup. Try again?' });
    }
  };

  const onFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (!f) return;
    if (f.size > 20 * 1024 * 1024) {
      audio.play('error');
      say({ tone: 'error', text: 'That file is too big to be a Kettle backup.' });
      return;
    }
    let text = '';
    try {
      text = await f.text();
    } catch {
      say({ tone: 'error', text: 'Couldn’t read that file.' });
      return;
    }
    // Something here already → add to it by default; replacing is a deliberate choice.
    const first = previewImport(text, { mode: 'merge' });
    if (!first.ok) {
      audio.play('error');
      say({ tone: 'error', text: first.error });
      return;
    }
    const hasProgress = first.summary.here.sessions > 0 || first.summary.here.leaves > 0;
    const res = hasProgress ? first : previewImport(text, { mode: 'replace' });
    if (!res.ok) return;
    setMsg(null);
    toast.dismiss(); // nothing may cover what the sheet says is about to happen
    setPending({ text, summary: res.summary, hasProgress });
  };

  const chooseMode = (mode: 'replace' | 'merge') => {
    if (!pending) return;
    const res = previewImport(pending.text, { mode });
    if (res.ok) setPending({ ...pending, summary: res.summary });
  };

  const confirmImport = () => {
    if (!pending) return;
    const { mode } = pending.summary;
    const res = importData(pending.text, { mode });
    setPending(null);
    if (!res.ok) {
      audio.play('error');
      say({ tone: 'error', text: res.error });
      return;
    }
    audio.play('pop');
    setMsg(null);
    const addedText = res.summary.updated ? `Added ${plural(res.summary.added, 'brew')} and updated ${res.summary.updated} from your backup.` : `Added ${plural(res.summary.added, 'brew')} from your backup.`;
    toast.success(mode === 'merge' ? addedText : `Backup restored: ${plural(res.summary.sessions, 'brew')}. Welcome back.`, {
      duration: 10_000,
      action: {
        label: 'Undo',
        onClick: () => {
          const r = undoLastImport();
          if (r === 'undone') toast('Import undone. Everything is as it was.', { tone: 'neutral' });
          else if (r === 'changed') toast('Can’t undo any more: brews or settings changed since the import.', { tone: 'warning' });
        },
      },
    });
  };

  const sum = pending?.summary;
  const note = sum && pending ? importNote(sum, pending.hasProgress) : null;

  return (
    <>
      <ListGroup title="Your data" footer="Everything lives on this device. Export a backup to move Kettle to another browser.">
        <ListRow icon="download" iconTone="sky" label="Export a backup" description="Save everything as a .json file." onClick={onExport} />
        <ListRow icon="upload" iconTone="matcha" label="Import a backup" description="Add or restore from a Kettle .json file." onClick={() => fileRef.current?.click()} />
        <ListRow icon="trash" label="Reset everything" description="Start fresh on this device." danger onClick={() => setResetOpen(true)} />
      </ListGroup>
      <input ref={fileRef} type="file" accept="application/json,.json" className="sr-only" tabIndex={-1} aria-hidden onChange={onFile} />
      <div aria-live="polite" className={s.msgSlot}>
        {msg && (
          <p className={s.msg} data-tone={msg.tone} role={msg.tone === 'error' ? 'alert' : undefined}>
            <Icon name={msg.tone === 'ok' ? 'check' : 'info'} size={18} />
            {msg.text}
          </p>
        )}
      </div>

      <Sheet
        open={!!pending}
        onClose={() => setPending(null)}
        title={!pending?.hasProgress ? 'Restore this backup?' : sum?.mode === 'replace' ? 'Replace with this backup?' : 'Add this backup?'}
        footer={
          // The consequence sits next to the button that causes it, so it is on screen even when the
          // sheet body has to scroll (short landscape phones).
          <div className={s.sheetFoot}>
            {note && (
              <p className={s.sheetNote} data-tone={note.warn ? 'warn' : undefined} role="status">
                {note.text}
              </p>
            )}
            <div className={s.sheetActions}>
              <Button variant="secondary" block onClick={() => setPending(null)}>
                Cancel
              </Button>
              {sum?.mode === 'replace' && pending?.hasProgress ? (
                <Button variant="danger" block onClick={confirmImport}>
                  Replace
                </Button>
              ) : (
                <Button variant="matcha" block onClick={confirmImport} disabled={sum?.mode === 'merge' && sum.added + sum.updated === 0}>
                  {sum?.mode === 'merge' ? 'Add' : 'Restore'}
                </Button>
              )}
            </div>
          </div>
        }
      >
        {sum && pending && (
          <div className={s.sheetBody}>
            <div className={s.summaryBox}>
              <p className={s.summaryHead} id="import-summary">
                In this backup{sum.exportedAt && savedOn(sum.exportedAt) ? <span className={s.summaryDate}> · saved {savedOn(sum.exportedAt)}</span> : null}
              </p>
              <ul className={s.summary} aria-labelledby="import-summary">
                <li>
                  <strong>{plural(sum.sessions, 'brew')}</strong> over {plural(sum.days, 'day')}
                </li>
                <li>
                  Cozy level <strong>{sum.level}</strong> · {sum.leaves.toLocaleString()} leaves
                </li>
                {sum.from && (
                  <li>
                    {fmtDay(sum.from)} to {fmtDay(sum.to)}
                  </li>
                )}
                {sum.skipped > 0 && <li className={s.warnText}>{plural(sum.skipped, 'damaged brew')} can’t be read and will be left out.</li>}
                {sum.ledgerRebuilt && <li>Leaves will be recounted from the brews.</li>}
              </ul>
            </div>
            {pending.hasProgress && (
              <>
                <p className={s.sheetNote}>
                  On this device now: <strong>{plural(sum.here.sessions, 'brew')}</strong>, cozy level {sum.here.level}.
                </p>
                <SegmentedControl
                  label="How to restore"
                  value={sum.mode}
                  onChange={chooseMode}
                  options={[
                    { value: 'merge', label: 'Add', sublabel: 'keep what’s here' },
                    { value: 'replace', label: 'Replace', sublabel: 'swap it all' },
                  ]}
                />
              </>
            )}
          </div>
        )}
      </Sheet>

      <ResetSheet
        open={resetOpen}
        onClose={() => setResetOpen(false)}
        onExport={onExport}
      />
    </>
  );
}

function ResetSheet({ open, onClose, onExport }: { open: boolean; onClose: () => void; onExport: () => void }) {
  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Start fresh?"
      hero={<Mascot pose="concerned" size={112} />}
      description={
        <>
          This clears your brews, warm streak, leaves, recipes and settings on this device. <strong>It can’t be undone.</strong>
        </>
      }
      footer={
        <div className={s.stackActions}>
          <Button block size="lg" onClick={onClose}>
            Keep my data
          </Button>
          <Button
            block
            variant="danger"
            sfx="cancel"
            onClick={() => {
              resetAllData();
              onClose();
            }}
          >
            Reset everything
          </Button>
        </div>
      }
    >
      <button type="button" className={s.inlineLink} onClick={onExport}>
        <Icon name="download" size={18} /> Export a backup first
      </button>
    </Sheet>
  );
}

const savedFmt = new Intl.DateTimeFormat(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
function savedOn(iso: string): string | null {
  const t = Date.parse(iso);
  return Number.isFinite(t) ? savedFmt.format(t) : null;
}

/** The one sentence that says what pressing the button will do. */
function importNote(sum: ImportSummary, hasProgress: boolean): { text: string; warn?: boolean } {
  if (!hasProgress) return { text: sum.settings ? 'Restores your brews, leaves and settings from the backup.' : 'Restores your brews and leaves from the backup.' };
  if (sum.mode === 'replace')
    return {
      warn: true,
      text: `Your ${plural(sum.here.sessions, 'brew')}${sum.settings ? ' and settings' : ''} on this device will be swapped for the backup. You can undo right after.`,
    };
  if (sum.sessions === 0) return { text: 'This backup has no brews to add.' };
  if (sum.added + sum.updated === 0) return { text: 'Every brew in this backup is already here, so there’s nothing to add.' };
  const parts = [sum.added ? `Adds ${plural(sum.added, 'brew')}` : null, sum.updated ? `updates ${sum.updated} you edited elsewhere` : null].filter(Boolean).join(' and ');
  const left = [sum.duplicates ? `${sum.duplicates} already here` : null, sum.deletedHere ? `${sum.deletedHere} you deleted here` : null].filter(Boolean).join(', ');
  const after = `You’ll have ${plural(sum.after.sessions, 'brew')}, cozy level ${sum.after.level}.`;
  return { text: `${parts[0].toUpperCase()}${parts.slice(1)}${left ? ` (${left} stay as they are)` : ''}. ${after} Your settings stay as they are.` };
}
