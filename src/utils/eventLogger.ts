// client/src/utils/eventLogger.ts
// V1 Event Logger — local SQLite store for OmniTintAI Brain Contract
// - Cross-compatible with classic + async expo-sqlite variants
// - No import-time side effects (you MUST call initEventStore() in AppRoot)
// - Stores payload as JSON text
// - Includes synced flag for V2 upload later

import * as SQLite from "expo-sqlite";
import { OmniEvent, BRAIN_CONTRACT_VERSION } from "../brain/omniBrainContract";

const DB_NAME = "omnitintai_events.db";
const TABLE = "omni_events";

type AnyDb = any;

let _db: AnyDb | null = null;
let _initPromise: Promise<void> | null = null;

function hasAsyncOpen(): boolean {
  // @ts-ignore
  return typeof SQLite.openDatabaseAsync === "function";
}

async function getDb(): Promise<AnyDb> {
  if (_db) return _db;

  if (hasAsyncOpen()) {
    // Newer expo-sqlite async API
    // @ts-ignore
    _db = await SQLite.openDatabaseAsync(DB_NAME);
    return _db;
  }

  // Classic API
  // @ts-ignore
  _db = SQLite.openDatabase(DB_NAME);
  return _db;
}

// ─────────────────────────────────────────────────────────────
// Low-level SQL helpers (works with both APIs)
// ─────────────────────────────────────────────────────────────

async function execAsync(sql: string, params: any[] = []): Promise<{ rows?: any[] }> {
  const db = await getDb();

  // Async API path
  if (db?.execAsync) {
    // execAsync doesn’t return rows; use getAllAsync for SELECTs
    await db.execAsync([{ sql, args: params }]);
    return {};
  }

  // Classic API path
  return new Promise((resolve, reject) => {
    db.transaction(
      (tx: any) => {
        tx.executeSql(
          sql,
          params,
          (_: any, res: any) => resolve({ rows: res?.rows?._array ?? [] }),
          (_: any, err: any) => {
            reject(err);
            return false;
          }
        );
      },
      (err: any) => reject(err)
    );
  });
}

async function getAllAsync(sql: string, params: any[] = []): Promise<any[]> {
  const db = await getDb();

  // Async API supports getAllAsync for SELECTs
  if (db?.getAllAsync) {
    return await db.getAllAsync(sql, params);
  }

  // Classic API
  const out = await execAsync(sql, params);
  return out.rows ?? [];
}

// ─────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────

export async function initEventStore(): Promise<void> {
  if (_initPromise) return _initPromise;

  _initPromise = (async () => {
    // Create table
    await execAsync(
      `CREATE TABLE IF NOT EXISTS ${TABLE} (
        id TEXT PRIMARY KEY NOT NULL,
        type TEXT NOT NULL,
        ts INTEGER NOT NULL,
        v INTEGER NOT NULL DEFAULT ${BRAIN_CONTRACT_VERSION},
        payload TEXT NOT NULL,
        synced INTEGER NOT NULL DEFAULT 0
      );`
    );

    // Helpful indexes
    await execAsync(`CREATE INDEX IF NOT EXISTS idx_${TABLE}_ts ON ${TABLE}(ts);`);
    await execAsync(`CREATE INDEX IF NOT EXISTS idx_${TABLE}_synced ON ${TABLE}(synced);`);
    await execAsync(`CREATE INDEX IF NOT EXISTS idx_${TABLE}_type ON ${TABLE}(type);`);
  })();

  return _initPromise;
}

export async function logEvent(event: OmniEvent): Promise<void> {
  // Ensure init is done (fail-open)
  try {
    await initEventStore();
  } catch {
    // If init fails for any reason, do not crash V1.
    // You can still console.warn here if desired.
    return;
  }

  const payloadStr = JSON.stringify(event.payload ?? {});
  const v = event.v ?? BRAIN_CONTRACT_VERSION;

  try {
    await execAsync(
      `INSERT OR REPLACE INTO ${TABLE} (id, type, ts, v, payload, synced)
       VALUES (?, ?, ?, ?, ?, 0);`,
      [event.id, event.type, event.ts, v, payloadStr]
    );
  } catch (e) {
    // fail-open (don’t break UX)
    // console.warn("[eventLogger] logEvent failed", e);
  }
}

export async function getUnsyncedEvents(limit = 200): Promise<OmniEvent[]> {
  try {
    await initEventStore();
    const rows = await getAllAsync(
      `SELECT id, type, ts, v, payload FROM ${TABLE}
       WHERE synced = 0
       ORDER BY ts ASC
       LIMIT ?;`,
      [limit]
    );

    return rows.map((r: any) => ({
      id: r.id,
      type: r.type,
      ts: Number(r.ts),
      v: Number(r.v) as any,
      payload: safeParse(r.payload) ?? {},
    })) as OmniEvent[];
  } catch {
    return [];
  }
}

export async function markSynced(ids: string[]): Promise<void> {
  if (!ids?.length) return;

  try {
    await initEventStore();
    const placeholders = ids.map(() => "?").join(",");
    await execAsync(
      `UPDATE \( {TABLE} SET synced = 1 WHERE id IN ( \){placeholders});`,
      ids
    );
  } catch {
    // ignore
  }
}

export async function getEventsSince(sinceTs: number, limit = 500): Promise<OmniEvent[]> {
  try {
    await initEventStore();
    const rows = await getAllAsync(
      `SELECT id, type, ts, v, payload FROM ${TABLE}
       WHERE ts >= ?
       ORDER BY ts ASC
       LIMIT ?;`,
      [sinceTs, limit]
    );

    return rows.map((r: any) => ({
      id: r.id,
      type: r.type,
      ts: Number(r.ts),
      v: Number(r.v) as any,
      payload: safeParse(r.payload) ?? {},
    })) as OmniEvent[];
  } catch {
    return [];
  }
}

export async function countEvents(type?: string): Promise<number> {
  try {
    await initEventStore();
    const rows = await getAllAsync(
      type
        ? `SELECT COUNT(*) as c FROM ${TABLE} WHERE type = ?;`
        : `SELECT COUNT(*) as c FROM ${TABLE};`,
      type ? [type] : []
    );
    return Number(rows?.[0]?.c ?? 0);
  } catch {
    return 0;
  }
}

export async function clearAllEvents(): Promise<void> {
  try {
    await initEventStore();
    await execAsync(`DELETE FROM ${TABLE};`);
  } catch {
    // ignore
  }
}

// ─────────────────────────────────────────────────────────────

function safeParse(s: any) {
  try {
    if (typeof s !== "string") return null;
    return JSON.parse(s);
  } catch {
    return null;
  }
}
