// client/src/storage/omniEventStore.ts
// OmniTintAI — SQLite Event Store (V1 minimal, V2/V3 foundation)
// ✅ append-only events
// ✅ JSON payload
// ✅ idempotent init
// ✅ safe reads + simple API

import * as SQLite from "expo-sqlite";

type OmniEventRow = {
  id: string;
  type: string;
  ts: number;
  payload: string; // JSON string
};

export type OmniEvent<T = any> = {
  id: string;
  type: string;
  ts: number;
  payload: T;
};

const DB_NAME = "omnitintai.db";
const db = SQLite.openDatabase(DB_NAME);

/** Simple unique id without extra deps */
function makeId(prefix = "evt") {
  // Example: evt_1734678123456_k9x3p2
  const rand = Math.random().toString(36).slice(2, 8);
  return `${prefix}_${Date.now()}_${rand}`;
}

function safeJsonParse<T>(s: string): T | null {
  try {
    return JSON.parse(s) as T;
  } catch {
    return null;
  }
}

function runSql(sql: string, params: any[] = []): Promise<void> {
  return new Promise((resolve, reject) => {
    db.transaction((tx) => {
      tx.executeSql(
        sql,
        params,
        () => resolve(),
        (_tx, err) => {
          reject(err);
          return false;
        }
      );
    });
  });
}

function allSql<T = any>(sql: string, params: any[] = []): Promise<T[]> {
  return new Promise((resolve, reject) => {
    db.transaction((tx) => {
      tx.executeSql(
        sql,
        params,
        (_tx, result) => resolve((result?.rows?._array as T[]) || []),
        (_tx, err) => {
          reject(err);
          return false;
        }
      );
    });
  });
}

/**
 * Call once at app startup.
 * Safe to call multiple times.
 */
export async function initEventDB(): Promise<void> {
  // WAL improves write perf and stability
  try {
    await runSql("PRAGMA journal_mode = WAL;");
  } catch {
    // ignore (some platforms may not support)
  }

  await runSql(`
    CREATE TABLE IF NOT EXISTS events (
      id TEXT PRIMARY KEY NOT NULL,
      type TEXT NOT NULL,
      ts INTEGER NOT NULL,
      payload TEXT NOT NULL
    );
  `);

  await runSql(`CREATE INDEX IF NOT EXISTS idx_events_ts ON events (ts DESC);`);
  await runSql(`CREATE INDEX IF NOT EXISTS idx_events_type_ts ON events (type, ts DESC);`);
}

/**
 * Append-only event write.
 * Returns the created event id.
 */
export async function logEvent<T extends Record<string, any> = any>(
  type: string,
  payload: T,
  opts?: { ts?: number; id?: string }
): Promise<string> {
  const id = opts?.id ?? makeId();
  const ts = opts?.ts ?? Date.now();
  const payloadStr = JSON.stringify(payload ?? {});

  await runSql(
    `INSERT INTO events (id, type, ts, payload) VALUES (?, ?, ?, ?);`,
    [id, type, ts, payloadStr]
  );

  return id;
}

/**
 * Get all events (most recent first).
 * Optional limit.
 */
export async function getEvents(limit = 500): Promise<OmniEvent[]> {
  const rows = await allSql<OmniEventRow>(
    `SELECT id, type, ts, payload FROM events ORDER BY ts DESC LIMIT ?;`,
    [limit]
  );

  return rows
    .map((r) => ({
      id: r.id,
      type: r.type,
      ts: r.ts,
      payload: safeJsonParse(r.payload) ?? {},
    }))
    .filter(Boolean);
}

/**
 * Get events since a timestamp (inclusive), newest first.
 */
export async function getEventsSince(ts: number, limit = 500): Promise<OmniEvent[]> {
  const rows = await allSql<OmniEventRow>(
    `SELECT id, type, ts, payload
     FROM events
     WHERE ts >= ?
     ORDER BY ts DESC
     LIMIT ?;`,
    [ts, limit]
  );

  return rows.map((r) => ({
    id: r.id,
    type: r.type,
    ts: r.ts,
    payload: safeJsonParse(r.payload) ?? {},
  }));
}

/**
 * Get recent events by type (newest first).
 */
export async function getRecentEventsByType(type: string, limit = 100): Promise<OmniEvent[]> {
  const rows = await allSql<OmniEventRow>(
    `SELECT id, type, ts, payload
     FROM events
     WHERE type = ?
     ORDER BY ts DESC
     LIMIT ?;`,
    [type, limit]
  );

  return rows.map((r) => ({
    id: r.id,
    type: r.type,
    ts: r.ts,
    payload: safeJsonParse(r.payload) ?? {},
  }));
}

/**
 * Tiny helper for debugging / sanity checks.
 */
export async function countEvents(): Promise<number> {
  const rows = await allSql<{ c: number }>(`SELECT COUNT(*) as c FROM events;`);
  return rows?.[0]?.c ?? 0;
}

/**
 * DEV ONLY — wipe all events.
 * (Do not call in prod.)
 */
export async function clearEvents(): Promise<void> {
  await runSql(`DELETE FROM events;`);
}
