// src/personalization/personalizer.sync.js
// Small "brain" that runs safe nightly tasks (telemetry flush, etc.)
// Called from BootProbe so it never blocks startup UI.

import AsyncStorage from '@react-native-async-storage/async-storage';
import { flush as flushTelemetry } from '../utils/telemetry';
import { Logger } from '../utils/logger';

const LAST_RUN_KEY = '@omnitintai:personalizer:lastRun';
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

/**
 * maybeNightlyTasks
 *
 * Runs at most once per 24h.
 * - Respects allowTelemetry flag (BootProbe wires it to shareAnonymizedStats)
 * - Flushes queued telemetry safely
 */
export async function maybeNightlyTasks({ allowTelemetry = true } = {}) {
  try {
    const now = Date.now();
    const raw = await AsyncStorage.getItem(LAST_RUN_KEY);
    const last = raw ? Number(raw) || 0 : 0;

    // If we've run within the last 24h, skip.
    if (last && now - last < ONE_DAY_MS) {
      return { ran: false, reason: 'recent', lastRun: last };
    }

    // 1) Flush telemetry queue if allowed
    try {
      await flushTelemetry({ allowTelemetry });
    } catch (e) {
      Logger.error?.('[personalizer] telemetry flush failed', e);
    }

    // 2) Mark last run
    await AsyncStorage.setItem(LAST_RUN_KEY, String(now));

    return { ran: true, lastRun: now };
  } catch (e) {
    Logger.error?.('[personalizer] maybeNightlyTasks error', e);
    return { ran: false, error: String(e) };
  }
}
