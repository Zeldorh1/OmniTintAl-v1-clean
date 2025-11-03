// /src/utils/amazon.ts
export async function searchHairDye(keyword: string) {
  // TODO: wire to Amazon PA-API (signed requests)
  // return map to { code, name, hex, price, image, asin }
  return [
    { code: 'R3', name: 'Cherry Red', hex: '#C12A2A', price: 12.99, asin: 'B00XXXXR3', image: 'https://...' }
  ];
}
