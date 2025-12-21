// client/src/components/Icons.tsx

import React from "react";
import {
  Search,
  Mic,
  Heart,
  HeartOff,
  Settings,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  Camera,
  RotateCcw,
  Sparkles,
  Lock,
  Crown,
  Home,
  Gem,
  ShoppingBag, // ✅ ADD
} from "lucide-react-native";

type IconName =
  | "search"
  | "mic"
  | "heart"
  | "heartOff"
  | "settings"
  | "menu"
  | "close"
  | "chevronLeft"
  | "chevronRight"
  | "camera"
  | "reset"
  | "sparkles"
  | "lock"
  | "crown"
  | "home"
  | "gem"
  | "bag"; // ✅ ADD

const MAP: Record<IconName, any> = {
  search: Search,
  mic: Mic,
  heart: Heart,
  heartOff: HeartOff,
  settings: Settings,
  menu: Menu,
  close: X,
  chevronLeft: ChevronLeft,
  chevronRight: ChevronRight,
  camera: Camera,
  reset: RotateCcw,
  sparkles: Sparkles,
  lock: Lock,
  crown: Crown,
  home: Home,
  gem: Gem,
  bag: ShoppingBag, // ✅ ADD
};

export function Icon({
  name,
  size = 22,
  color = "#111",
  strokeWidth = 2,
}: {
  name: IconName;
  size?: number;
  color?: string;
  strokeWidth?: number;
}) {
  const Cmp = MAP[name];
  return <Cmp width={size} height={size} color={color} strokeWidth={strokeWidth} />;
}
