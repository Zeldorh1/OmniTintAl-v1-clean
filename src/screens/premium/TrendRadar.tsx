// client/src/screens/premium/TrendRadarScreen.tsx
import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  FlatList,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useSettings } from "../../context/SettingsContext";
import { checkLimit } from "../../utils/grokHairScannerBundles/userLimits";
import PremiumGate from "../../components/PremiumGate";
import { API_URL } from "../../config/api";

type TrendItem = {
  id: string;
  name: string;
  tone: string;
  score: number;
  hex?: string;
  sources?: string[];
};

type TrendPayload = {
  updatedAt: number | null;
  items: TrendItem[];
};

export default function TrendRadarScreen() {
  const { settings } = useSettings();
  const isPremium = !!settings?.account?.isPremium;

  const [locked, setLocked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [payload, setPayload] = useState<TrendPayload>({
    updatedAt: null,
    items: [],
  });

  const fetchTrends = async () => {
    try {
      const res = await fetch(`${API_URL}/trend-radar`);
      const json = (await res.json()) as TrendPayload;
      setPayload(json);
    } catch (e) {
      console.warn("[TrendRadarScreen] fetch error", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Initial gate + fetch
  useEffect(() => {
    (async () => {
      const { allowed } = await checkLimit("TREND_RADAR", { isPremium });
      if (!allowed) {
        setLocked(true);
        setLoading(false);
        return;
      }
      setLocked(false);
      await fetchTrends();
    })();
  }, [isPremium]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchTrends();
  }, []);

  if (locked) {
    return <PremiumGate feature="Trend Radar" usesLeft={3} />;
  }

  if (loading) {
    return (
      <SafeAreaView style={s.container}>
        <ActivityIndicator size="large" color="#000" />
        <Text style={s.loadingTxt}>Loading Trend Radar…</Text>
      </SafeAreaView>
    );
  }

  const updatedLabel =
    payload.updatedAt != null
      ? `Updated ${timeAgo(payload.updatedAt)}`
      : "No trend data yet";

  return (
    <SafeAreaView style={s.container}>
      {/* Header */}
      <View style={s.header}>
        <Text style={s.title}>Global Trend Radar</Text>
        <Text style={s.subtitle}>
          Live hair color momentum from across the web
        </Text>
        <Text style={s.updated}>{updatedLabel}</Text>
      </View>

      {/* List */}
      <FlatList
        data={payload.items}
        keyExtractor={(item) => item.id}
        contentContainerStyle={s.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        renderItem={({ item, index }) => {
          const rank = index + 1;
          const intensity = Math.round(item.score * 100); // e.g. 94
          return (
            <View style={s.card}>
              <View style={s.rankColumn}>
                <Text style={s.rank}>{rank}</Text>
                <Text style={s.rankLabel}>Rank</Text>
              </View>

              <View style={s.mainColumn}>
                <Text style={s.name}>{item.name}</Text>
                <Text style={s.tone}>{item.tone}</Text>

                <View style={s.metaRow}>
                  <View style={s.badge}>
                    <Text style={s.badgeText}>Heat {intensity}</Text>
                  </View>
                  {item.sources && item.sources.length > 0 && (
                    <Text style={s.sourceText}>
                      Signals: {item.sources.join(" • ")}
                    </Text>
                  )}
                </View>
              </View>

              {item.hex && (
                <View style={s.swatchWrap}>
                  <View
                    style={[
                      s.swatch,
                      { backgroundColor: item.hex || "#000" },
                    ]}
                  />
                  <Text style={s.swatchLabel}>Swatch</Text>
                </View>
              )}
            </View>
          );
        }}
        ListEmptyComponent={
          <View style={s.empty}>
            <Text style={s.emptyText}>
              No trends available yet. Check back in a bit.
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

function timeAgo(timestamp: number): string {
  const diffMs = Date.now() - timestamp;
  const diffMin = Math.round(diffMs / 60000);
  if (diffMin <= 1) return "just now";
  if (diffMin < 60) return `${diffMin} min ago`;
  const diffHr = Math.round(diffMin / 60);
  if (diffHr < 24) return `${diffHr} hr ago`;
  const diffDay = Math.round(diffHr / 24);
  return `${diffDay} day${diffDay > 1 ? "s" : ""} ago`;
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FAFAFA" },
  header: {
    paddingTop: 18,
    paddingHorizontal: 18,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#FFFFFF",
  },
  title: { fontSize: 26, fontWeight: "900", color: "#000" },
  subtitle: {
    marginTop: 4,
    fontSize: 13,
    color: "#6B7280",
  },
  updated: {
    marginTop: 6,
    fontSize: 12,
    color: "#9CA3AF",
  },
  loadingTxt: {
    marginTop: 12,
    fontSize: 14,
    color: "#4B5563",
  },
  listContent: {
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 24,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    paddingVertical: 12,
    paddingHorizontal: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  rankColumn: {
    width: 46,
    alignItems: "center",
    marginRight: 10,
  },
  rank: { fontSize: 24, fontWeight: "900", color: "#000" },
  rankLabel: { fontSize: 11, color: "#6B7280" },
  mainColumn: { flex: 1 },
  name: { fontSize: 16, fontWeight: "800", color: "#000" },
  tone: { fontSize: 13, color: "#6B7280", marginTop: 2 },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
  },
  badge: {
    backgroundColor: "#000",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginRight: 8,
  },
  badgeText: {
    color: "#FFF",
    fontSize: 11,
    fontWeight: "700",
  },
  sourceText: {
    fontSize: 11,
    color: "#6B7280",
  },
  swatchWrap: {
    alignItems: "center",
    marginLeft: 12,
  },
  swatch: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#D1D5DB",
  },
  swatchLabel: {
    marginTop: 4,
    fontSize: 10,
    color: "#6B7280",
  },
  empty: {
    paddingVertical: 40,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
  },
});
