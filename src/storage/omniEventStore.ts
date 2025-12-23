// client/src/storage/omniEventStore.ts
// OmniTintAI Event Store (SQLite) — V1 minimal / V2-ready
// Stores events + allows "context pack" building later.

import { exec, run, all } from "./sqlite";

export type OmniEvent = {
  id?: string;
  ts?: number; // ms
  name: string; // e.g. "bag_add", "scan_complete"
  actor?: string; // "user" | "system" | "ai"
  payload?: any; // JSON
};

let _ready = false;

export async function ensureEventStore() {
  if (_ready) return;

  await exec(`
    CREATE TABLE IF NOT EXISTS omni_events (
      id TEXT PRIMARY KEY NOT NULL,
      ts INTEGER NOT NULL,
      name TEXT NOT NULL,
      actor TEXT,
      payload_json TEXT
    );
  `);

  await exec(`
    CREATE INDEX IF NOT EXISTS idx_omni_events_ts ON omni_events(ts DESC);
  `);

  await exec(`
    CREATE INDEX IF NOT EXISTS idx_omni_events_name ON omni_events(name);
  `);

  _ready = true;
}

function uuid() {
  // good-enough UUID for local event ids
  return "evt_" + Math.random().toString(16).slice(2) + "_" + Date.now().toString(16);
}

export async function logEvent(e: OmniEvent) {
  await ensureEventStore();

  const id = e.id ?? uuid();
  const ts = e.ts ?? Date.now();
  const actor = e.actor ?? "user";
  const payload_json = e.payload ? JSON.stringify(e.payload) : null;

  await run(
    `INSERT INTO omni_events (id, ts, name, actor, payload_json)
     VALUES (?, ?, ?, ?, ?)`,
    [id, ts, e.name, actor, payload_json]
  );

  return { id, ts };
}

export async function listEvents({
  limit = 50,
  name,
}: {
  limit?: number;
  name?: string;
} = {}) {
  await ensureEventStore();

  if (name) {
    return await all(
      `SELECT * FROM omni_events WHERE name = ? ORDER BY ts DESC LIMIT ?`,
      [name, limit]
    );
  }

  return await all(`SELECT * FROM omni_events ORDER BY ts DESC LIMIT ?`, [limit]);
}

export async function clearEvents() {
  await ensureEventStore();
  await exec(`DELETE FROM omni_events;`);
}
