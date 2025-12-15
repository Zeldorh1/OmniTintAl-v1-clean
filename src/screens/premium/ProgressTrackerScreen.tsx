// client/src/screens/premium/ProgressTrackerScreen.tsx
import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  StatusBar,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useFocusEffect } from "@react-navigation/native";

import {
  loadEntries,
  getLatest,
  growthPerMonth,
  recommendRecolorWeeks,
  toInches,
} from "../../storage/progressStorage";
import { useThemePro } from "../../context/ThemeContext";

type ProgressEntry = {
  id: string;
  dateISO: string;
  length: number;
  unit: "in" | "cm" | "mm";
  method?: string;
  photoUri?: string | null;
};

export default function ProgressTrackerScreen() {
  const nav = useNavigation<any>();
  const { colors } = useThemePro();

  const [entries, setEntries] = useState<ProgressEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const all = await loadEntries();
      // newest first
      const sorted = [...all].sort(
        (a, b) => new Date(b.dateISO).getTime() - new Date(a.dateISO).getTime()
      );
      setEntries(sorted);
    } catch (e) {
      console.warn("[ProgressTracker] load error", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useFocusEffect(
    useCallback(() => {
      // refresh when coming back from photo flow
      load();
    }, [load])
  );

  const latest = getLatest(entries as any);
  const rate = growthPerMonth(entries as any);
  const recolorWeeks = recommendRecolorWeeks(rate || undefined);

  const headerSummary = () => {
    if (!entries.length) {
      return (
        <View style={s.summaryCard}>
          <Text style={s.summaryTitle}>No measurements yet</Text>
          <Text style={s.summaryText}>
            When you confirm a photo in the length flow, your progress will
            appear here automatically.
          </Text>
        </View>
      );
    }

    const latestIn = latest ? toInches(latest.length, latest.unit).toFixed(2) : "--";
    const rateIn = rate ? rate.toFixed(2) : null;

    return (
      <View style={s.summaryRow}>
        <View style={s.summaryCard}>
          <Text style={s.summaryLabel}>Latest length</Text>
          <Text style={s.summaryValue}>{latestIn} in</Text>
          {latest?.dateISO && (
            <Text style={s.summarySub}>
              {new Date(latest.dateISO).toLocaleDateString()}
            </Text>
          )}
        </View>
        <View style={s.summaryCard}>
          <Text style={s.summaryLabel}>Growth / month</Text>
          <Text style={s.summaryValue}>{rateIn ? `${rateIn} in` : "—"}</Text>
          <Text style={s.summarySub}>
            {rateIn ? "Based on your history" : "Add more entries"}
          </Text>
        </View>
        <View style={s.summaryCard}>
          <Text style={s.summaryLabel}>Recolor timing</Text>
          <Text style={s.summaryValue}>{Math.round(recolorWeeks)} wks</Text>
          <Text style={s.summarySub}>Est. ideal interval</Text>
        </View>
      </View>
    );
  };

  const renderItem = ({ item }: { item: ProgressEntry }) => {
    const lengthIn = toInches(item.length, item.unit).toFixed(2);
    const dateLabel = new Date(item.dateISO).toLocaleDateString();
    const methodLabel =
      item.method === "ai_adjusted"
        ? "AI-adjusted"
        : item.method === "manual"
        ? "Manual"
        : "Unknown";

    return (
      <View style={s.entryCard}>
        <View style={{ flex: 1 }}>
          <Text style={s.entryDate}>{dateLabel}</Text>
          <Text style={s.entryLength}>{lengthIn} in</Text>
          <Text style={s.entryMeta}>{methodLabel}</Text>
        </View>
        {item.photoUri ? (
          <View style={s.pill}>
            <Text style={s.pillText}>📷</Text>
          </View>
        ) : null}
      </View>
    );
  };

  return (
    <SafeAreaView
      style={[s.container, { backgroundColor: colors.background || "#FAFAFA" }]}
    >
      <StatusBar barStyle="light-content" />
      {/* Top bar */}
      <View style={s.topBar}>
        <TouchableOpacity onPress={() => nav.goBack()}>
          <Text style={s.topAction}>Close</Text>
        </TouchableOpacity>
        <Text style={s.topTitle}>Progress Tracking</Text>
        <View style={{ width: 60 }} />
      </View>

      {loading ? (
        <View style={s.loadingWrap}>
          <ActivityIndicator size="large" color="#000" />
          <Text style={s.loadingText}>Loading your history…</Text>
        </View>
      ) : (
        <ScrollView
          style={s.body}
          contentContainerStyle={{ paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
        >
          {headerSummary()}

          <Text style={s.sectionTitle}>History</Text>
          {!entries.length ? (
            <Text style={s.emptyText}>
              No entries yet. Once you confirm a photo measurement, your hair
              growth timeline will appear here.
            </Text>
          ) : (
            <FlatList
              data={entries}
              keyExtractor={(item) => item.id}
              renderItem={renderItem}
              scrollEnabled={false}
            />
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 8,
    backgroundColor: "#000",
  },
  topTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#FFF",
  },
  topAction: {
    fontSize: 14,
    fontWeight: "700",
    color: "#E5E7EB",
  },
  body: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  loadingWrap: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  loadingText: { marginTop: 8, color: "#4B5563", fontSize: 14 },

  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
    marginBottom: 18,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  summaryLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "#6B7280",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: "900",
    color: "#000",
    marginTop: 4,
  },
  summarySub: {
    marginTop: 4,
    fontSize: 11,
    color: "#9CA3AF",
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 13,
    color: "#6B7280",
    marginBottom: 16,
  },

  entryCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  entryDate: {
    fontSize: 13,
    fontWeight: "700",
    color: "#111827",
  },
  entryLength: {
    fontSize: 15,
    fontWeight: "800",
    color: "#000",
    marginTop: 2,
  },
  entryMeta: {
    fontSize: 11,
    color: "#6B7280",
    marginTop: 2,
  },
  pill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "#F3F4F6",
  },
  pillText: { fontSize: 14 },
});
