import React, { createContext, useContext, useState } from "react";

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [subscription, setSubscription] = useState({
    premium: false,
    plan: "free",
  });

  const [userMeta, setUserMeta] = useState({
    id: null,
    region: "US-IN",
    device: "Unknown",
  });

  const value = {
    subscription,
    setSubscription,
    userMeta,
    setUserMeta,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used inside <AppProvider />");
  return ctx;
};
