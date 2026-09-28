/**
 * Safe localStorage wrapper (private mode / quota / disabled storage never throw).
 * All persisted keys are namespaced `kettle:`.
 */
export const STORAGE_PREFIX = 'kettle:';

export const safeStorage = {
  getItem(key: string): string | null {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  setItem(key: string, value: string): void {
    try {
      localStorage.setItem(key, value);
    } catch {
      /* ignore quota / privacy errors */
    }
  },
  removeItem(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch {
      /* ignore */
    }
  },
};
