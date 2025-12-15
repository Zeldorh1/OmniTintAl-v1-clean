// client/src/context/CartContext.js
import React, { createContext, useContext } from 'react';
import { create } from 'zustand';

// ----- Zustand store (no TS) -----
const useCartImpl = create((set, get) => ({
  items: [],           // [{ product, qty }]
  bundles: [],         // [{ ...bundle, price }]
  add: (product) =>
    set((s) => {
      const found = s.items.find((i) => i.product.id === product.id);
      if (found) {
        return {
          items: s.items.map((i) =>
            i.product.id === product.id ? { ...i, qty: (i.qty || 1) + 1 } : i
          ),
        };
      }
      return { items: [...s.items, { product, qty: 1 }] };
    }),
  remove: (productId) =>
    set((s) => ({ items: s.items.filter((i) => i.product.id !== productId) })),
  addBundle: (bundle) => set((s) => ({ bundles: [...s.bundles, bundle] })),
  clear: () => set({ items: [], bundles: [] }),
  total: () => {
    const { items, bundles } = get();
    const itemsSum = items.reduce(
      (sum, i) => sum + (i.product?.price || 0) * (i.qty || 1),
      0
    );
    const bundlesSum = bundles.reduce((sum, b) => sum + (b.price || 0), 0);
    return itemsSum + bundlesSum;
  },
}));

// ----- React context to expose the store hook -----
const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
  const store = useCartImpl; // pass the zustand hook itself
  return (
    <CartContext.Provider value={store}>{children}</CartContext.Provider>
  );
};

export const useCart = () => {
  const store = useContext(CartContext);
  if (!store) throw new Error('useCart must be used within <CartProvider>');
  return store; // returns the zustand hook
};
