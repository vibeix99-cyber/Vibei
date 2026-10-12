// Versioned save file. Everything the game remembers between sessions lives here.
//
// Rules this module guarantees:
//   1. It never throws. Private browsing, quota exhaustion, a hand-edited save,
//      a save from a future version — all of them degrade, none of them crash.
//   2. Unknown/missing fields are filled from defaults on load, so adding a field
//      to DEFAULTS is a no-op migration.
//   3. A structurally broken save is *not* silently deleted: it is copied to
//      `gla.save.corrupt` so it can be inspected, then replaced with a fresh one.
//
// Bump SAVE_VERSION and add a MIGRATIONS entry when the shape changes meaningfully.

export const SAVE_KEY = 'gla.save';
export const CORRUPT_KEY = 'gla.save.corrupt';
export const LEGACY_SETTINGS_KEY = 'gla.settings';
export const SAVE_VERSION = 2;

/* ------------------------------------------------------------------ */
/* defaults                                                            */
/* ------------------------------------------------------------------ */

export const DEFAULT_SETTINGS = {
  masterVol: 0.7, musicVol: 0.35, sfxVol: 0.8,
  battleSpeed: 1, reducedMotion: false, foeHpNumbers: false, muted: false,
  confirmMoves: false, showTips: true
};

export function blankSave() {
  return {
    v: SAVE_VERSION,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    profile: { name: 'Rookie', title: 'Unknown', avatar: 'luffy' },
    settings: { ...DEFAULT_SETTINGS },
    record: {
      played: 0, won: 0, lost: 0, drawn: 0,
      streak: 0, bestStreak: 0,
      turns: 0, damageDealt: 0, damageTaken: 0, kos: 0, koed: 0,
      perfect: 0                    // wins with no fighter lost
    },
    xp: 0,
    fighters: {},                   // id -> { battles, wins, kos, damage, faints, seen }
    unlocked: {                     // ids the player has earned
      fighters: [], items: [], arenas: [], modes: [], titles: []
    },
    teams: [],                      // [{ id, name, members:[TeamMember], updatedAt }]
    activeTeamId: null,
    runs: { tournament: null, gauntlet: null },
    trophies: [],                   // [{ id, name, tier, cupId, at }]
    daily: {},                      // 'YYYY-MM-DD' -> { win, turns, score, alive, at }
    tutorial: { done: false, skipped: false, seenHelp: false },
    flags: {}
  };
}

/* ------------------------------------------------------------------ */
/* storage plumbing — the only place that touches localStorage         */
/* ------------------------------------------------------------------ */

const memoryStore = new Map();
let storageMode = 'unknown';        // 'local' | 'memory'

function probeStorage() {
  if (storageMode !== 'unknown') return storageMode;
  try {
    const k = '__gla_probe__';
    localStorage.setItem(k, '1');
    localStorage.removeItem(k);
    storageMode = 'local';
  } catch {
    storageMode = 'memory';
  }
  return storageMode;
}

function rawGet(key) {
  if (probeStorage() === 'memory') return memoryStore.get(key) ?? null;
  try { return localStorage.getItem(key); } catch { storageMode = 'memory'; return memoryStore.get(key) ?? null; }
}

function rawSet(key, value) {
  if (probeStorage() === 'memory') { memoryStore.set(key, value); return false; }
  try { localStorage.setItem(key, value); return true; }
  catch {
    // Quota or a mid-session permission change. Fall back rather than die.
    storageMode = 'memory';
    memoryStore.set(key, value);
    return false;
  }
}

function rawDel(key) {
  memoryStore.delete(key);
  try { localStorage.removeItem(key); } catch { /* nothing we can do */ }
}

/* ------------------------------------------------------------------ */
/* migrations                                                          */
/* ------------------------------------------------------------------ */

// key = version being migrated FROM. Each returns the upgraded object.
export const MIGRATIONS = {
  // v1 was "no save file at all": settings lived in their own `gla.settings` key
  // and nothing else was persisted. Fold those settings into the real save.
  1(s) {
    const out = { ...s, v: 2 };
    try {
      const legacy = rawGet(LEGACY_SETTINGS_KEY);
      if (legacy) out.settings = { ...DEFAULT_SETTINGS, ...out.settings, ...JSON.parse(legacy) };
    } catch { /* legacy blob was junk; defaults win */ }
    return out;
  }
};

/* ------------------------------------------------------------------ */
/* shape repair                                                        */
/* ------------------------------------------------------------------ */

function isObj(x) { return x && typeof x === 'object' && !Array.isArray(x); }

/** Fill missing keys from `def` without clobbering anything the player set. */
function fillDefaults(value, def) {
  if (!isObj(def)) return value === undefined ? def : value;
  const src = isObj(value) ? value : {};
  const out = {};
  for (const k of Object.keys(def)) out[k] = fillDefaults(src[k], def[k]);
  for (const k of Object.keys(src)) if (!(k in out)) out[k] = src[k];
  return out;
}

/** Coerce the loaded blob into something every reader can trust. */
function repair(save) {
  const out = fillDefaults(save, blankSave());
  out.v = SAVE_VERSION;
  if (!Array.isArray(out.teams)) out.teams = [];
  out.teams = out.teams.filter((t) => isObj(t) && Array.isArray(t.members)).slice(0, 60);
  for (const t of out.teams) {
    if (!t.id) t.id = 'team_' + Math.random().toString(36).slice(2, 9);
    if (typeof t.name !== 'string') t.name = 'Team';
    t.members = t.members.filter((m) => isObj(m) && typeof m.speciesId === 'string').slice(0, 6);
  }
  if (!Array.isArray(out.trophies)) out.trophies = [];
  if (!isObj(out.fighters)) out.fighters = {};
  if (!isObj(out.daily)) out.daily = {};
  if (!isObj(out.runs)) out.runs = { tournament: null, gauntlet: null };
  for (const k of ['fighters', 'items', 'arenas', 'modes', 'titles']) {
    if (!Array.isArray(out.unlocked[k])) out.unlocked[k] = [];
    out.unlocked[k] = [...new Set(out.unlocked[k].filter((x) => typeof x === 'string'))];
  }
  for (const k of Object.keys(out.record)) {
    if (!Number.isFinite(out.record[k])) out.record[k] = 0;
  }
  if (!Number.isFinite(out.xp) || out.xp < 0) out.xp = 0;
  if (out.activeTeamId && !out.teams.some((t) => t.id === out.activeTeamId)) out.activeTeamId = null;
  return out;
}

/* ------------------------------------------------------------------ */
/* public API                                                          */
/* ------------------------------------------------------------------ */

let current = null;
let health = { storage: 'unknown', recovered: false, corrupt: false, migratedFrom: null, fromFuture: false };
const listeners = new Set();

/** Load (or create) the save. Idempotent — later calls return the cached object. */
export function load(force = false) {
  if (current && !force) return current;
  health = { storage: probeStorage(), recovered: false, corrupt: false, migratedFrom: null, fromFuture: false };

  const raw = rawGet(SAVE_KEY);
  const legacy = rawGet(LEGACY_SETTINGS_KEY);

  if (raw == null) {
    // No save. If there is a legacy settings blob, treat it as a v1 save.
    let seed = blankSave();
    if (legacy != null) {
      seed = MIGRATIONS[1]({ ...blankSave(), v: 1 });
      health.migratedFrom = 1;
    }
    current = repair(seed);
    persist();
    return current;
  }

  let parsed = null;
  try { parsed = JSON.parse(raw); } catch { parsed = null; }

  if (!isObj(parsed)) {
    // Corrupt: keep the evidence, start clean, and tell the UI so it can say so.
    health.corrupt = true;
    health.recovered = true;
    try { rawSet(CORRUPT_KEY, String(raw).slice(0, 200000)); } catch { /* best effort */ }
    current = repair(blankSave());
    persist();
    return current;
  }

  let v = Number(parsed.v);
  if (!Number.isFinite(v) || v < 1) v = 1;
  if (v > SAVE_VERSION) {
    // A newer build wrote this. Don't destroy it — read what we understand.
    health.fromFuture = true;
  } else {
    while (v < SAVE_VERSION) {
      const m = MIGRATIONS[v];
      if (!m) { v = SAVE_VERSION; break; }
      try { parsed = m(parsed); } catch { health.recovered = true; }
      health.migratedFrom = health.migratedFrom ?? v;
      v = Number(parsed?.v) > v ? Number(parsed.v) : v + 1;
    }
  }

  try {
    current = repair(parsed);
  } catch {
    health.corrupt = true; health.recovered = true;
    current = repair(blankSave());
  }
  persist();
  return current;
}

/** The live save object. Mutate it then call `commit()`, or use `patch()`. */
export function data() { return current || load(); }

function persist() {
  if (!current) return false;
  current.updatedAt = Date.now();
  let ok = false;
  try { ok = rawSet(SAVE_KEY, JSON.stringify(current)); } catch { ok = false; }
  health.storage = storageMode;
  return ok;
}

/** Write the current save to storage and notify listeners. */
export function commit() {
  const ok = persist();
  for (const fn of listeners) { try { fn(current); } catch { /* a bad listener must not break saving */ } }
  return ok;
}

/** Mutate + commit in one step. `fn(save)` may return a value, which is passed back. */
export function patch(fn) {
  const s = data();
  let r;
  try { r = fn(s); } catch (e) { console.warn('[save] patch failed', e); }
  commit();
  return r;
}

export function subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); }

/** Health of the save subsystem — surfaced in Options so failures are visible. */
export function status() {
  return { ...health, storage: storageMode === 'unknown' ? probeStorage() : storageMode, version: SAVE_VERSION };
}

export function resetSave() {
  current = repair(blankSave());
  commit();
  return current;
}

export function exportSave() {
  try { return JSON.stringify(data()); } catch { return '{}'; }
}

/** @returns {{ok:boolean, error?:string}} */
export function importSave(text) {
  let parsed;
  try { parsed = JSON.parse(text); } catch { return { ok: false, error: 'That is not valid save JSON.' }; }
  if (!isObj(parsed)) return { ok: false, error: 'Save must be a JSON object.' };
  let v = Number(parsed.v) || 1;
  while (v < SAVE_VERSION && MIGRATIONS[v]) { parsed = MIGRATIONS[v](parsed); v = Number(parsed.v) || v + 1; }
  current = repair(parsed);
  commit();
  return { ok: true };
}

/** Deliberately write garbage — used by the test harness to prove recovery works. */
export function __corruptForTest(text = '{"v":2,"teams":') {
  rawSet(SAVE_KEY, text);
  current = null;
}
