/**
 * Data portability — export / import / reset. The Settings screen (home area)
 * builds the UI; these functions do the work and return friendly messages.
 *
 * Backup format (JSON):
 *   { app: 'kettle', kind: 'backup', schema: 2, exportedAt, progress: ProgressData, settings: Settings }
 */
import { clock } from '@/lib/clock';
import { dayKey } from '@/lib/dates';
import { onStorageWriteError, storageWriteFailures } from '@/lib/storage';
import { DEFAULT_SETTINGS, getSettings, useSettings, type Settings } from '@/state/settings';
import { emptyData, refreshCaches, replay, SCHEMA_VERSION } from './engine';
import { levelFromLeaves } from './levels';
import { localeWeekStart } from './streak';
import { pickData, syncFromStorage, useProgress } from './store';
import { coerceData } from './validate';
import type { ProgressData, SessionRecord } from './types';

/** Brews / leaves / level of one side of an import (this device now, or after the import). */
export interface ProgressGlance {
  sessions: number;
  leaves: number;
  level: number;
}

export interface ImportSummary {
  /** How this preview would restore (see ImportOptions.mode). */
  mode: 'replace' | 'merge';
  /** What's on this device right now. */
  here: ProgressGlance;
  /** What this device would hold after restoring in `mode`. */
  after: ProgressGlance;
  /** Focus sessions in the backup that this device doesn't have yet. */
  added: number;
  /** Focus sessions here that the backup has a newer edit of (adding takes the newer one). */
  updated: number;
  /** Focus sessions in the backup that are already here, unchanged (skipped when adding). */
  duplicates: number;
  /** Focus sessions in the backup that were deleted on this device (adding keeps them deleted). */
  deletedHere: number;
  /** Focus sessions in the backup (after validation). */
  sessions: number;
  breaks: number;
  focusMs: number;
  leaves: number;
  level: number;
  /** Days with at least one focus session. */
  days: number;
  /** First and last day in the backup (null when empty). */
  from: string | null;
  to: string | null;
  /** Brews dropped because they were damaged. */
  skipped: number;
  /** The leaves ledger was missing or damaged and is recounted from the brews (nothing is lost). */
  ledgerRebuilt: boolean;
  /** Settings were included and will be restored. */
  settings: boolean;
  exportedAt: string | null;
}

export type ImportResult = { ok: true; summary: ImportSummary } | { ok: false; error: string };

export interface ImportOptions {
  /** 'replace' (default) swaps everything; 'merge' adds sessions not already here and rebuilds leaves. */
  mode?: 'replace' | 'merge';
  /** Restore settings from the backup too. Default: yes when replacing, no when adding (your settings stay). */
  settings?: boolean;
}

const MAX_BYTES = 20 * 1024 * 1024;

/** A friendly default file name: kettle-backup-2026-09-28.json */
export function backupFileName(): string {
  return `kettle-backup-${dayKey(clock.now())}.json`;
}

function exportableSettings(): Partial<Settings> {
  const s = getSettings() as unknown as Record<string, unknown>;
  const out: Record<string, unknown> = {};
  for (const k of Object.keys(DEFAULT_SETTINGS)) if (k in s) out[k] = s[k];
  return out as Partial<Settings>;
}

/** Everything Kettle knows about you, as pretty JSON. */
export function exportData(): string {
  syncFromStorage();
  const progress = { ...pickData(useProgress.getState()), lastReport: null };
  return JSON.stringify(
    {
      app: 'kettle',
      kind: 'backup',
      schema: SCHEMA_VERSION,
      exportedAt: new Date(clock.now()).toISOString(),
      progress,
      settings: exportableSettings(),
    },
    null,
    2,
  );
}

function coerceSettings(v: unknown): Partial<Settings> | null {
  if (typeof v !== 'object' || v === null) return null;
  const src = v as Record<string, unknown>;
  const out: Record<string, unknown> = {};
  for (const [k, def] of Object.entries(DEFAULT_SETTINGS)) {
    const val = src[k];
    if (val === undefined) continue;
    if (def === null ? val === null || typeof val === 'string' : typeof val === typeof def) out[k] = val;
  }
  return Object.keys(out).length ? (out as Partial<Settings>) : null;
}

interface Parsed {
  data: ProgressData;
  settings: Partial<Settings> | null;
  summary: ImportSummary;
}

function parseBackup(json: string, opts: ImportOptions): { ok: true; parsed: Parsed } | { ok: false; error: string } {
  if (typeof json !== 'string' || !json.trim()) return { ok: false, error: 'That file is empty.' };
  if (json.length > MAX_BYTES) return { ok: false, error: 'That file is too big to be a Kettle backup.' };
  let raw: unknown;
  try {
    raw = JSON.parse(json);
  } catch {
    return { ok: false, error: 'We couldn’t read that file. Is it a Kettle backup (.json)?' };
  }
  if (typeof raw !== 'object' || raw === null || (raw as { app?: unknown }).app !== 'kettle') {
    return { ok: false, error: 'That file doesn’t look like a Kettle backup.' };
  }
  const doc = raw as { schema?: unknown; progress?: unknown; settings?: unknown; exportedAt?: unknown };
  // Very early exports had no schema number: anything with a progress object is read as schema 1.
  const schema = typeof doc.schema === 'number' ? doc.schema : typeof doc.progress === 'object' && doc.progress !== null ? 1 : 0;
  if (schema > SCHEMA_VERSION) {
    return { ok: false, error: 'This backup is from a newer version of Kettle. Update the app, then try again.' };
  }
  if (schema < 1 || typeof doc.progress !== 'object' || doc.progress === null) {
    return { ok: false, error: 'That backup is missing its progress data, so nothing was changed.' };
  }
  const now = clock.now();
  const { data: incoming, stats } = coerceData(doc.progress, now);
  if (stats.sessionsIn > 0 && stats.sessionsKept === 0) {
    return { ok: false, error: 'The sessions in this backup look damaged, so nothing was changed.' };
  }
  const mode = opts.mode ?? 'replace';
  const settings = (opts.settings ?? mode === 'replace') ? coerceSettings(doc.settings) : null;
  const goalMin = settings?.dailyGoalMin ?? getSettings().dailyGoalMin;
  const today = dayKey(now);

  // The backup on its own (what "replace" restores).
  let backup: ProgressData;
  const noLedger = incoming.ledger.length === 0 && incoming.sessions.length > 0;
  const ledgerRebuilt = !stats.hadLedger || (stats.ledgerIn > 0 && stats.ledgerKept === 0) || noLedger;
  if (ledgerRebuilt) {
    // Older/partial backup without a usable ledger: rebuild it from the sessions.
    backup = refreshCaches(replay(incoming.sessions, { goalMin, weekStartsOn: localeWeekStart(), dayGoals: incoming.dayGoals }), today);
    backup = { ...backup, badges: { ...backup.badges, ...incoming.badges } };
  } else {
    backup = refreshCaches(incoming, today);
  }

  syncFromStorage();
  const current = pickData(useProgress.getState());
  const backupFocus = backup.sessions.filter((s) => s.phase === 'focus');

  // Per brew, the latest event wins (same rule as cross-tab sync): a newer edit in the backup updates
  // the brew here; a brew deleted here after the backup was made stays deleted.
  const version = (s: SessionRecord) => s.v ?? s.endedAt;
  const hereById = new Map(current.sessions.map((s) => [s.id, s]));
  const deletedHere = new Map(current.tombstones.map((id) => [id, current.deletedAt?.[id] ?? Infinity]));
  const merged = new Map(hereById);
  const count = { added: 0, updated: 0, duplicates: 0, deletedHere: 0 };
  for (const s of incoming.sessions) {
    const focus = s.phase === 'focus';
    const here = hereById.get(s.id);
    if ((deletedHere.get(s.id) ?? -Infinity) >= version(s)) {
      if (focus) count.deletedHere++;
    } else if (!here) {
      merged.set(s.id, s);
      if (focus) count.added++;
    } else if (version(s) > version(here)) {
      merged.set(s.id, s);
      if (focus) count.updated++;
    } else if (focus) count.duplicates++;
  }

  let data: ProgressData;
  if (mode === 'merge') {
    const all = [...merged.values()].sort((a, b) => a.endedAt - b.endedAt);
    const rebuilt = replay(all, { goalMin, weekStartsOn: localeWeekStart(), dayGoals: { ...incoming.dayGoals, ...current.dayGoals } });
    // Never lose leaves or badges either side already earned.
    const maxLeaves = Math.max(current.leaves, backup.leaves);
    if (maxLeaves > rebuilt.leaves) {
      rebuilt.ledger.push({ id: `carry:merge:${now}`, at: now, day: today, kind: 'carryOver', amount: maxLeaves - rebuilt.leaves, note: 'Carried over' });
    }
    const badges = { ...rebuilt.badges };
    for (const src of [backup.badges, current.badges])
      for (const [id, b] of Object.entries(src)) if (!badges[id] || badges[id].tier < b.tier) badges[id] = b;
    // This device's deletions stay recorded, so the same backup added again can't bring them back.
    data = refreshCaches({ ...rebuilt, badges, quests: { ...rebuilt.quests, ...current.quests }, tombstones: current.tombstones, deletedAt: current.deletedAt }, today);
  } else {
    data = backup;
  }
  data = { ...data, lastReport: null };

  const days = [...new Set(backupFocus.map((s) => s.day))].sort();
  return {
    ok: true,
    parsed: {
      data,
      settings,
      summary: {
        mode,
        here: glance(current),
        after: glance(data),
        ...count,
        sessions: backupFocus.length,
        breaks: backup.sessions.length - backupFocus.length,
        focusMs: backupFocus.reduce((a, s) => a + s.focusedMs, 0),
        leaves: backup.leaves,
        level: levelFromLeaves(backup.leaves).level,
        days: days.length,
        from: days[0] ?? null,
        to: days[days.length - 1] ?? null,
        skipped: stats.sessionsIn - stats.sessionsKept,
        ledgerRebuilt: ledgerRebuilt && stats.sessionsKept > 0,
        settings: !!settings,
        exportedAt: typeof doc.exportedAt === 'string' ? doc.exportedAt : null,
      },
    },
  };
}

function glance(d: ProgressData): ProgressGlance {
  return { sessions: d.sessions.filter((s) => s.phase === 'focus').length, leaves: d.leaves, level: levelFromLeaves(d.leaves).level };
}

/** Validate a backup and describe it, without changing anything (for a confirm dialog). */
export function previewImport(json: string, opts: ImportOptions = {}): ImportResult {
  const res = parseBackup(json, opts);
  return res.ok ? { ok: true, summary: res.parsed.summary } : res;
}

let undoSnapshot: { progress: ProgressData; settings: Partial<Settings>; after: ProgressData; afterSettings: string } | null = null;

/** Brews, their versions and deletions: what a person would notice changing. */
const brewsKey = (d: ProgressData) =>
  JSON.stringify([d.epoch ?? '', d.sessions.map((s) => `${s.id}@${s.v ?? s.endedAt}`).sort(), [...d.tombstones].sort()]);

/**
 * Restore a backup. Replaces progress (or merges with `mode: 'merge'`) and restores settings.
 * What was here before is kept (in memory) so the import can be undone.
 */
export function importData(json: string, opts: ImportOptions = {}): ImportResult {
  const res = parseBackup(json, opts);
  if (!res.ok) return res;
  const { data, settings, summary } = res.parsed;
  const before = { progress: { ...pickData(useProgress.getState()), lastReport: null }, settings: exportableSettings() };
  const exact = { progress: pickData(useProgress.getState()), settings: useSettings.getState() };
  const failuresBefore = storageWriteFailures();
  let quota = false;
  const off = onStorageWriteError((e) => (quota ||= e.quota));
  try {
    useProgress.getState().load(data);
    if (settings) useSettings.getState().set({ ...settings, onboarded: settings.onboarded ?? true });
  } finally {
    off();
  }
  if (storageWriteFailures() > failuresBefore) {
    // It couldn't be saved, so it isn't restored: put this tab back exactly as it was (storage never changed).
    useProgress.setState(exact.progress);
    useSettings.setState(exact.settings);
    undoSnapshot = null;
    return {
      ok: false,
      error: quota
        ? 'Kettle couldn’t save the backup: this browser’s storage is full. Nothing was changed.'
        : 'Kettle couldn’t save the backup in this browser. Nothing was changed.',
    };
  }
  undoSnapshot = { ...before, after: pickData(useProgress.getState()), afterSettings: JSON.stringify(exportableSettings()) };
  return { ok: true, summary };
}

/**
 * Put back exactly what was here before the last import (this session). Declines ('changed') if brews or
 * settings changed since the import — here or in another tab — because restoring the old copy would erase them.
 */
export function undoLastImport(): 'undone' | 'changed' | 'none' {
  if (!undoSnapshot) return 'none';
  syncFromStorage();
  const { progress, settings, after, afterSettings } = undoSnapshot;
  undoSnapshot = null;
  if (brewsKey(pickData(useProgress.getState())) !== brewsKey(after) || JSON.stringify(exportableSettings()) !== afterSettings) return 'changed';
  useProgress.getState().load(progress);
  useSettings.getState().set(settings);
  return 'undone';
}

export const canUndoImport = (): boolean => undoSnapshot !== null;

/** Start over: clears progress, stops any running timer and resets settings (→ onboarding). */
export function resetAllData(opts: { keepSettings?: boolean } = {}): void {
  undoSnapshot = null;
  // Lazy: keeps the timer out of progress's module graph (no import cycles).
  void import('@/timer')
    .then((m) => m.useTimer.getState().reset())
    .catch(() => {});
  useProgress.getState().load({ ...emptyData() });
  if (!opts.keepSettings) useSettings.getState().reset();
}
