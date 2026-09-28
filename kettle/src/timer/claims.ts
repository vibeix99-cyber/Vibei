/**
 * Cross-tab completion claims — an atomic test-and-set per session id.
 * OWNER: timer area.
 *
 * localStorage has no cross-tab atomicity (each renderer caches it; writes
 * propagate asynchronously), so two tabs that both *think* they lead could
 * both complete the same phase. IndexedDB readwrite transactions on the same
 * store are serialised by the browser across tabs, so "get → if absent put"
 * inside one transaction has exactly one winner.
 *
 * The ticker claims a phase right before completing it. Winner completes.
 * Loser waits for the winner's write — and if that never arrives (the winner
 * crashed in the microseconds between claim and completion) it completes
 * anyway after LOST_CLAIM_GRACE_MS; progress dedupes by id, so the worst case
 * is a repeated whistle, never a lost or doubled session.
 */

export type ClaimResult = 'won' | 'lost' | 'error';

export interface Claimer {
  claim(sessionId: string, by: string): Promise<ClaimResult>;
}

export const LOST_CLAIM_GRACE_MS = 5000;
const DB = 'kettle-timer';
const STORE = 'claims';
const KEEP = 300;

function req<T>(r: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    r.onsuccess = () => resolve(r.result);
    r.onerror = () => reject(r.error);
  });
}

export function createIdbClaimer(factory: IDBFactory | null = typeof indexedDB !== 'undefined' ? indexedDB : null): Claimer | null {
  if (!factory) return null;
  let dbp: Promise<IDBDatabase> | null = null;

  const open = (): Promise<IDBDatabase> => {
    if (dbp) return dbp;
    dbp = new Promise<IDBDatabase>((resolve, reject) => {
      let r: IDBOpenDBRequest;
      try {
        r = factory.open(DB, 1);
      } catch (e) {
        reject(e);
        return;
      }
      r.onupgradeneeded = () => {
        if (!r.result.objectStoreNames.contains(STORE)) r.result.createObjectStore(STORE);
      };
      r.onsuccess = () => {
        const db = r.result;
        db.onversionchange = () => {
          db.close();
          dbp = null;
        };
        db.onclose = () => {
          dbp = null;
        };
        resolve(db);
      };
      r.onerror = () => reject(r.error);
      r.onblocked = () => reject(new Error('blocked'));
    });
    dbp.catch(() => {
      dbp = null;
    });
    return dbp;
  };

  const withTimeout = <T>(p: Promise<T>, ms: number): Promise<T> =>
    Promise.race([p, new Promise<T>((_, reject) => setTimeout(() => reject(new Error('timeout')), ms))]);

  return {
    async claim(sessionId, by) {
      try {
        const db = await withTimeout(open(), 1500);
        return await withTimeout(
          new Promise<ClaimResult>((resolve, reject) => {
            const tx = db.transaction(STORE, 'readwrite');
            const store = tx.objectStore(STORE);
            let result: ClaimResult = 'lost';
            const get = store.get(sessionId);
            get.onsuccess = () => {
              const existing = get.result as { by?: string } | undefined;
              if (existing) {
                result = existing.by === by ? 'won' : 'lost'; // re-claiming our own claim is fine
                return;
              }
              result = 'won';
              store.put({ by, at: Date.now() }, sessionId);
            };
            tx.oncomplete = () => resolve(result);
            tx.onerror = () => reject(tx.error);
            tx.onabort = () => reject(tx.error ?? new Error('abort'));
          }),
          1500,
        );
      } catch {
        return 'error';
      } finally {
        void prune(open).catch(() => {});
      }
    },
  };
}

let pruneAt = 0;
async function prune(open: () => Promise<IDBDatabase>): Promise<void> {
  const now = Date.now();
  if (now - pruneAt < 60_000) return;
  pruneAt = now;
  const db = await open();
  const tx = db.transaction(STORE, 'readwrite');
  const store = tx.objectStore(STORE);
  const keys = (await req(store.getAllKeys())) as IDBValidKey[];
  if (keys.length <= KEEP) return;
  const vals = (await req(store.getAll())) as { at: number }[];
  const order = keys.map((k, i) => ({ k, at: vals[i]?.at ?? 0 })).sort((a, b) => a.at - b.at);
  for (const { k } of order.slice(0, keys.length - KEEP)) store.delete(k);
}

// ---------- claim bookkeeping (pure, unit tested) ----------

export interface ClaimEntry {
  result: ClaimResult | 'pending';
  at: number;
}

/**
 * May this tab complete `sessionId` given its claim so far?
 *  - no claimer (no IndexedDB)     → yes (leader election alone)
 *  - won / error (IDB broken)      → yes
 *  - lost, grace not yet over      → no: the winner is completing it
 *  - lost for longer than grace    → yes: the winner must have died; progress dedupes
 */
export function claimAllows(entry: ClaimEntry | undefined, hasClaimer: boolean, now: number): boolean {
  if (!hasClaimer) return true;
  if (!entry || entry.result === 'pending') return false;
  if (entry.result === 'lost') return now - entry.at > LOST_CLAIM_GRACE_MS;
  return true;
}
