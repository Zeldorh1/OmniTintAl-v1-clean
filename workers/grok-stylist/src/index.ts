export default {
  async fetch(req: Request): Promise<Response> {
    return new Response(JSON.stringify({ ok: true, worker: "grok-stylist" }), {
      headers: { "Content-Type": "application/json" },
    });
  },
};
