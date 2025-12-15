// client/src/utils/metrics.ts
// Lightweight AR metrics helper wired into Logger
// - Keeps the same logAR() signature
// - Logs to console in dev
// - Also pushes into the central Logger buffer for upload

import { Logger } from "./logger";

export type ARLog = {
  user?: string;
  event: string;
  ts: string;
  payload?: Record<string, any>;
};

export function logAR(
  event: string,
  payload?: Record<string, any>,
  user: string = "anon"
) {
  const entry: ARLog = {
    user,
    event,
    ts: new Date().toISOString(),
    payload,
  };

  // Send into central logger (so it can be uploaded later)
  Logger.info("AR_EVENT", {
    category: "AR",
    ...entry,
  });

  // Still mirror into console for local debugging
  if (__DEV__) {
    console.log("[AR_METRIC]", JSON.stringify(entry));
  }
}
