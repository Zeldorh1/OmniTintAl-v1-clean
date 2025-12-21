// client/src/storage/sqlite.ts
import * as SQLite from "expo-sqlite";

const DB_NAME = "omnitintai.db";

let _dbPromise: Promise<any> | null = null;

/**
 * Returns a database connection using the best available Expo SQLite API.
 * SDK 54 prefers openDatabaseAsync().
 */
export function getDb() {
  if (_dbPromise) return _dbPromise;

  _dbPromise = (async () => {
    // ✅ New SDKs
    if (typeof (SQLite as any).openDatabaseAsync === "function") {
      return await (SQLite as any).openDatabaseAsync(DB_NAME);
    }

    // ✅ Older fallback (should rarely hit in SDK 54)
    if (typeof (SQLite as any).openDatabase === "function") {
      return (SQLite as any).openDatabase(DB_NAME);
    }

    throw new Error(
      "ExpoSQLite API not available. Make sure expo-sqlite is installed AND included in the native build."
    );
  })();

  return _dbPromise;
}

/**
 * Run a SQL statement (no result rows expected)
 */
export async function exec(sql: string) {
  const db = await getDb();

  // ✅ New API
  if (typeof db.execAsync === "function") {
    await db.execAsync(sql);
    return;
  }

  // ✅ Old API fallback
  await new Promise<void>((resolve, reject) => {
    db.transaction((tx: any) => {
      tx.executeSql(
        sql,
        [],
        () => resolve(),
        (_: any, err: any) => {
          reject(err);
          return false;
        }
      );
    });
  });
}

/**
 * Run a query that returns rows
 */
export async function all<T = any>(sql: string, params: any[] = []) {
  const db = await getDb();

  // ✅ New API
  if (typeof db.getAllAsync === "function") {
    return (await db.getAllAsync(sql, params)) as T[];
  }

  // ✅ Old API fallback
  return await new Promise<T[]>((resolve, reject) => {
    db.transaction((tx: any) => {
      tx.executeSql(
        sql,
        params,
        (_: any, res: any) => resolve(res.rows?._array ?? []),
        (_: any, err: any) => {
          reject(err);
          return false;
        }
      );
    });
  });
}

/**
 * Run a statement with params (insert/update)
 */
export async function run(sql: string, params: any[] = []) {
  const db = await getDb();

  // ✅ New API
  if (typeof db.runAsync === "function") {
    return await db.runAsync(sql, params);
  }

  // ✅ Old API fallback
  return await new Promise<any>((resolve, reject) => {
    db.transaction((tx: any) => {
      tx.executeSql(
        sql,
        params,
        (_: any, res: any) => resolve(res),
        (_: any, err: any) => {
          reject(err);
          return false;
        }
      );
    });
  });
}
