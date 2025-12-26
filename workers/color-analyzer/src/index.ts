// V1 · COLOR-ANALYZER · STUB
//
// - Reserved endpoint for future image-based color analysis
// - V1: returns explicit "not implemented" so it's safe if called.

export default {
  async fetch(req: Request): Promise<Response> {
    if (req.method !== "POST") {
      return new Response(
        JSON.stringify({ ok: false, error: "Method not allowed" }),
        { status: 405, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        ok: false,
        error: "color_analyzer_not_enabled_in_v1",
        message:
          "Image-based color analysis will be enabled in a future update.",
      }),
      { status: 501, headers: { "Content-Type": "application/json" } }
    );
  },
};
