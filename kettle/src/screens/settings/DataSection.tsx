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
    toast.success(mode === 'merge' ? `Added ${plural(res.summary.added, 'brew')} from your backup.` : `Backup restored: ${plural(res.summary.sessions, 'brew')}. Welcome back.`, {
      duration: 10_000,
      action: {
        label: 'Undo',
        onClick: () => {
          if (undoLastImport()) toast('Import undone. Everything is as it was.', { tone: 'neutral' });
        },
      },
    });
  };

  const sum = pending?.summary;

  return (
    <>
      <ListGroup title="Your data" footer="Everything lives on this device. Export a backup to move Kettle to another browser.">
        <ListRow icon="download" iconTone="sky" label="Export a backup" description="Save everything as a .json file." onClick={onExport} />
        <ListRow icon="upload" iconTone="matcha" label="Import a backup" description="Restore from a Kettle .json file." onClick={() => fileRef.current?.click()} />
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
          <div className={s.sheetActions}>
            <Button variant="secondary" block onClick={() => setPending(null)}>
              Cancel
            </Button>
            {sum?.mode === 'replace' && pending?.hasProgress ? (
              <Button variant="danger" block onClick={confirmImport}>
                Replace
              </Button>
            ) : (
              <Button variant="matcha" block onClick={confirmImport} disabled={sum?.mode === 'merge' && sum.added === 0}>
                {sum?.mode === 'merge' ? 'Add' : 'Restore'}
              </Button>
            )}
          </div>
        }
      >
        {sum && pending && (
          <div className={s.sheetBody}>
            <ul className={s.summary} aria-label="In this backup">
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
              {sum.skipped > 0 && <li className={s.warnText}>{plural(sum.skipped, 'damaged entry', 'damaged entries')} will be skipped.</li>}
            </ul>
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
                    { value: 'merge', label: 'Add to what’s here' },
                    { value: 'replace', label: 'Replace what’s here' },
                  ]}
                />
              </>
            )}
            <p className={s.sheetNote} data-tone={sum.mode === 'replace' && pending.hasProgress ? 'warn' : undefined} role="status">
              {!pending.hasProgress
                ? 'Restores your brews, leaves and settings from the backup.'
                : sum.mode === 'replace'
                  ? `Your ${plural(sum.here.sessions, 'brew')} and settings on this device will be swapped for the backup. You can undo right after.`
                  : sum.added === 0
                    ? 'Every brew in this backup is already here, so there’s nothing to add.'
                    : `Adds ${plural(sum.added, 'brew')}${sum.duplicates ? ` (${sum.duplicates} already here are skipped)` : ''}. Nothing here is removed, and your settings stay as they are.`}
            </p>
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
