/**
 * App-wide overlays, mounted once at the root (on every route). OWNER: design-system area.
 *  - <Toaster/>                 toasts + `ui:toast` events
 *  - keyboard-shortcuts sheet   rendered from SHORTCUTS; `?` toggles it (useShortcutHelp)
 *  - PWA update prompt          "A fresh brew of Kettle is ready — Update", never during a brew
 */
import { useEffect } from 'react';
import { SHORTCUTS, useShortcutHelp, type ShortcutInfo } from '@/lib/shortcuts';
import { usePwaUpdate } from '@/pwa';
import { useTimer } from '@/timer';
import { Kbd, ListGroup, ListRow, Sheet, Toaster, toast } from '@/ui';
import s from './ShellOverlays.module.css';

export function ShellOverlays() {
  return (
    <>
      <Toaster />
      <ShortcutHelpSheet />
      <PwaUpdatePrompt />
    </>
  );
}

function groupShortcuts(list: ShortcutInfo[]): [string, ShortcutInfo[]][] {
  const groups = new Map<string, ShortcutInfo[]>();
  for (const sc of list) {
    const where = sc.where ?? 'Anywhere';
    if (!groups.has(where)) groups.set(where, []);
    groups.get(where)!.push(sc);
  }
  // "Anywhere" last reads best: specific first, general after.
  return [...groups.entries()].sort(([a], [b]) => (a === 'Anywhere' ? 1 : b === 'Anywhere' ? -1 : 0));
}

function ShortcutHelpSheet() {
  const { open, setOpen } = useShortcutHelp();
  return (
    <Sheet
      open={open}
      onClose={() => setOpen(false)}
      title="Keyboard shortcuts"
      description="Brew without reaching for the mouse."
      size="md"
    >
      <div className={s.groups}>
        {groupShortcuts(SHORTCUTS).map(([where, items]) => (
          <ListGroup key={where} title={where} headingLevel={3}>
            {items.map((sc) => (
              <ListRow
                key={sc.id}
                label={sc.label}
                trailing={
                  <span className={s.keys}>
                    {sc.keys.map((k, i) => (
                      <span key={k} className={s.keyWrap}>
                        {i > 0 && <span className={s.or}>or</span>}
                        <Kbd>{k}</Kbd>
                      </span>
                    ))}
                  </span>
                }
              />
            ))}
          </ListGroup>
        ))}
      </div>
    </Sheet>
  );
}

const PWA_TOAST_ID = 'pwa-update';

function PwaUpdatePrompt() {
  const { needRefresh, update, dismiss } = usePwaUpdate();
  const status = useTimer((t) => t.status);
  const busy = status !== 'idle';
  useEffect(() => {
    if (!needRefresh || busy) {
      toast.dismiss(PWA_TOAST_ID);
      return;
    }
    toast('A fresh brew of Kettle is ready.', {
      id: PWA_TOAST_ID,
      icon: 'sparkle',
      duration: Infinity,
      action: { label: 'Update', onClick: () => void update() },
      // Tapped away: don't ask again this session.
      onDismiss: dismiss,
    });
  }, [needRefresh, busy, update, dismiss]);
  useEffect(() => () => toast.dismiss(PWA_TOAST_ID), []);
  return null;
}
