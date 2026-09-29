/** Backup download helper around `exportData()` / `backupFileName()` from `@/progress`. */
import { backupFileName, exportData } from '@/progress';

type SaveFn = (req: { filename: string; data: string }) => Promise<unknown>;
type Host = { use?: (name: string) => Promise<{ save?: SaveFn } | null> };

/**
 * When Kettle runs inside a host page that grants downloads through `window.claude` (the private
 * test preview), the host's own save prompt is the only way a file gets out; everywhere else the
 * plain link download is used.
 */
async function hostSave(): Promise<SaveFn | null> {
  const host = (window as unknown as { claude?: Host }).claude;
  if (typeof host?.use !== 'function') return null;
  try {
    const dl = await host.use('downloads');
    return typeof dl?.save === 'function' ? dl.save.bind(dl) : null;
  } catch {
    return null;
  }
}

/**
 * Save a JSON backup. Resolves with the file name once it has been handed over, or `null` when the
 * person declined the host's save prompt. Rejects when nothing could be saved.
 */
export async function downloadBackup(): Promise<string | null> {
  const name = backupFileName();
  const json = exportData();
  const save = await hostSave();
  if (save) {
    try {
      await save({ filename: name, data: json });
      return name;
    } catch (e) {
      if ((e as { code?: string })?.code === 'declined') return null;
      throw e;
    }
  }
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return name;
}
