import React, { createContext, useContext, useState } from 'react';

// Create the context
const FavContext = createContext(null);

// Internal hook that manages favorites state and actions
function useFavImpl() {
  const [favs, setFavs] = useState([]);

  const isFav = (id) => favs.some((x) => x.id === id);

  const addFav = (item) => {
    setFavs((prev) => {
      if (prev.find((x) => x.id === item.id)) return prev; // avoid duplicates
      return [...prev, item];
    });
  };

  const removeFav = (id) => {
    setFavs((prev) => prev.filter((x) => x.id !== id));
  };

  const toggle = (item) => {
    if (isFav(item.id)) removeFav(item.id);
    else addFav(item);
  };

  const clearFavs = () => setFavs([]);

  return {
    favs,
    isFav,
    addFav,
    removeFav,
    toggle,
    clearFavs,
    count: favs.length,
  };
}

// Provider component that wraps around your app
export const FavoritesProvider = ({ children }) => {
  const store = useFavImpl();

  return (
    <FavContext.Provider value={store}>
      {children}
    </FavContext.Provider>
  );
};

// Hook to access favorites anywhere
export const useFavs = () => {
  const ctx = useContext(FavContext);
  if (!ctx) {
    throw new Error('useFavs must be used within a FavoritesProvider');
  }
  return ctx;
};
