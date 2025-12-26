// V1 · RETRAIN-HAIR-MODEL · STUB
//
// - For now: accepts POST and returns ok:true
// - Later: read events from ML_BRAIN_EVENTS_KV, call Grok/Gemini, write summary into ML_BRAIN_MODEL_KV

export interface Env {
  ML_BRAIN_EVENTS_KV?: KVNamespace;
  ML_BRAIN_MODEL_KV?: KVNamespace;
}

export default {
  async fetch(req: Request, _env: Env): Promise<Response> {
    if (req.method !== "POST") {
      return new Response(
        JSON.stringify({ ok: false, error: "Method not allowed" }),
        { status: 405, headers: { "Content-Type": "application/json" } }
      );
    }

    // V1: noop, but gives you an endpoint to hit from an admin tool / cron later.
    return new Response(JSON.stringify({ ok: true, status: "noop_v1" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  },
};
