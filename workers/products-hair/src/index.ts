// V1 · PRODUCTS-HAIR · STATIC CATALOG
//
// - GET returns a simple product catalog that can mirror mockProducts.ts
// - You can later replace `CATALOG` with real PA-API data or Grok-picked sets

interface HairProduct {
  asin: string;
  name: string;
  brand?: string;
  image?: string;
  tags?: string[];
  tone?: string;
  concern?: string[];
}

const CATALOG: HairProduct[] = [
  {
    asin: "B0000001",
    name: "Bond Repair Shampoo",
    brand: "Omni Match",
    image: "https://via.placeholder.com/300x300.png?text=Bond+Shampoo",
    tags: ["repair", "damage", "color-safe"],
    concern: ["damage", "breakage"],
  },
  {
    asin: "B0000002",
    name: "Bond Repair Conditioner",
    brand: "Omni Match",
    image: "https://via.placeholder.com/300x300.png?text=Bond+Conditioner",
    tags: ["repair", "damage", "color-safe"],
    concern: ["damage", "dryness"],
  },
  {
    asin: "B0000003",
    name: "Heat Shield Styling Spray",
    brand: "Omni Match",
    image: "https://via.placeholder.com/300x300.png?text=Heat+Shield",
    tags: ["heat-protectant", "styling"],
    concern: ["heat"],
  },
  {
    asin: "B0000004",
    name: "Frizz Taming Serum",
    brand: "Omni Match",
    image: "https://via.placeholder.com/300x300.png?text=Frizz+Serum",
    tags: ["frizz", "smoothing"],
    concern: ["frizz"],
  },
  {
    asin: "B0000005",
    name: "Deep Moisture Hair Mask",
    brand: "Omni Match",
    image: "https://via.placeholder.com/300x300.png?text=Moisture+Mask",
    tags: ["mask", "moisture"],
    concern: ["dryness"],
  },
  // ...add more later if you want
];

export default {
  async fetch(req: Request): Promise<Response> {
    const url = new URL(req.url);
    const tone = (url.searchParams.get("tone") || "").toLowerCase();
    const concern = (url.searchParams.get("concern") || "").toLowerCase();

    let items = CATALOG;

    if (tone) {
      items = items.filter((p) =>
        (p.tone || "").toLowerCase().includes(tone)
      );
    }

    if (concern) {
      items = items.filter((p) =>
        (p.concern || []).some((c) => c.toLowerCase().includes(concern))
      );
    }

    return new Response(JSON.stringify({ items }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  },
};
