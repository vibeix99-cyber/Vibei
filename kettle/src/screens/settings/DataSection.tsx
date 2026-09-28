/** "Your data": export, import (with preview + confirm), reset (serious confirm). */
import { useRef, useState, type ChangeEvent } from 'react';
import { Icon, Mascot } from '@/art';
import { audio } from '@/audio';
import { plural } from '@/lib/format';
import { parseDayKey } from '@/lib/dates';
import { importData, previewImport, resetAllData, type ImportSummary } from '@/progress';
import { Button, ListGroup, ListRow, SegmentedControl, Sheet, toast } from '@/ui';
import { downloadBackup } from '@/screens/home/shims/data';
import s from './Settings.module.css';

type Msg = { tone: 'ok' | 'error'; text: string } | null;

const dateFmt = new Intl.DateTimeFormat(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
const fmtDay = (d: string | null) => (d ? dateFmt.format(parseDayKey(d)) : '');

export function DataSection() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [msg, setMsg] = useState<Msg>(null);
  const [pending, setPending] = useState<{ text: string; summary: ImportSummary } | null>(null);
  const [mode, setMode] = useState<'replace' | 'merge'>('replace');
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
    const res = previewImport(text);
    if (!res.ok) {
      audio.play('error');
      say({ tone: 'error', text: res.error });
      return;
    }
    setMsg(null);
    setMode('replace');
    setPending({ text, summary: res.summary });
  };

  const confirmImport = () => {
    if (!pending) return;
    const res = importData(pending.text, { mode });
    setPending(null);
    if (!res.ok) {
      audio.play('error');
      say({ tone: 'error', text: res.error });
      return;
    }
    audio.play('pop');
    say({ tone: 'ok', text: `Backup restored: ${plural(res.summary.sessions, 'brew')}. Welcome back.` });
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
        title="Restore this backup?"
        footer={
          <div className={s.sheetActions}>
            <Button variant="secondary" block onClick={() => setPending(null)}>
              Cancel
            </Button>
            <Button variant="matcha" block onClick={confirmImport}>
              Restore
            </Button>
          </div>
        }
      >
        {sum && (
          <div className={s.sheetBody}>
            <ul className={s.summary}>
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
            <SegmentedControl
              label="How to restore"
              value={mode}
              onChange={setMode}
              options={[
                { value: 'replace', label: 'Replace what’s here' },
                { value: 'merge', label: 'Add to what’s here' },
              ]}
            />
            <p className={s.sheetNote}>{mode === 'replace' ? 'Your current brews and settings on this device will be swapped for the backup.' : 'Brews from the backup are added; nothing here is removed.'}</p>
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
