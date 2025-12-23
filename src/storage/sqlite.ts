// client/src/storage/sqlite.ts
// SDK 54+ safe SQLite wrapper (async API)
// Single DB connection + tiny helpers

import * as SQLite from "expo-sqlite";

export const DB_NAME = "omnitintai.db";

let _db: SQLite.SQLiteDatabase | null = null;

export async function getDb() {
  if (_db) return _db;

  // ✅ SDK 54+ async open
  _db = await SQLite.openDatabaseAsync(DB_NAME);

  // Good defaults
  await _db.execAsync(`PRAGMA journal_mode = WAL;`);
  await _db.execAsync(`PRAGMA foreign_keys = ON;`);

  return _db;
}

// Exec a SQL string (no results)
export async function exec(sql: string) {
  const db = await getDb();
  await db.execAsync(sql);
}

// Run a statement with params (INSERT/UPDATE/DELETE)
export async function run(sql: string, params: any[] = []) {
  const db = await getDb();
  return await db.runAsync(sql, params);
}

// Get all rows from a SELECT
export async function all<T = any>(sql: string, params: any[] = []) {
  const db = await getDb();
  return (await db.getAllAsync(sql, params)) as T[];
}

// Get first row from a SELECT
export async function first<T = any>(sql: string, params: any[] = []) {
  const db = await getDb();
  const rows = (await db.getAllAsync(sql, params)) as T[];
  return rows?.[0] ?? null;
}
