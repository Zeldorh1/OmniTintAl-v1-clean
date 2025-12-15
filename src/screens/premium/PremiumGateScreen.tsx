// client/src/screens/premium/PremiumGateScreen.tsx
import React from "react";
import { useRoute } from "@react-navigation/native";
import PremiumGate from "../../components/PremiumGate";

type RouteParams = {
  feature?: string;
  usesLeft?: number;
};

export default function PremiumGateScreen() {
  const route = useRoute<any>();
  const { feature, usesLeft } = (route.params || {}) as RouteParams;

  return <PremiumGate feature={feature || "this feature"} usesLeft={usesLeft ?? 0} />;
}
