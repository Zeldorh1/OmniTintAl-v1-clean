// /src/utils/metrics.ts
export type ARLog = {
  user?: string;
  event: string;
  ts: string;
  payload?: Record<string, any>;
};

export function logAR(event: string, payload?: Record<string, any>, user = 'anon') {
  const entry: ARLog = { user, event, ts: new Date().toISOString(), payload };
  console.log('[AR_METRIC]', JSON.stringify(entry));
}
