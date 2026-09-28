/** Backup download helper around `exportData()` / `backupFileName()` from `@/progress`. */
import { backupFileName, exportData } from '@/progress';

/** Trigger a browser download of a JSON backup. Returns the file name. */
export function downloadBackup(): string {
  const name = backupFileName();
  const blob = new Blob([exportData()], { type: 'application/json' });
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
