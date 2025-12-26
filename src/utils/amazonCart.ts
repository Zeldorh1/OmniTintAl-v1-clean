// utils/amazonCart.ts
import { ASSOCIATE_TAG } from "../config/affiliate";

// Builds a multi-item Amazon cart URL for bundles
export function buildMultiAsinCartUrl(items: { asin: string; quantity?: number }[]) {
  if (!items.length) return null;

  const params = new URLSearchParams();
  params.set("AssociateTag", ASSOCIATE_TAG);

  items.forEach((item, index) => {
    const n = index + 1;
    params.set(`ASIN.${n}`, item.asin);
    params.set(`Quantity.${n}`, String(item.quantity || 1));
  });

  // Opens cart with all items already added — user checks out normally
  return `https://www.amazon.com/gp/aws/cart/add.html?${params.toString()}`;
}
