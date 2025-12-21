// client/src/screens/premium/ProgressTrackerScreen.tsx
// V1 SAFE + V2 READY — Same UI style, now powered by SQLite event store
// ✅ Manual "Log Length" (fast V1 win)
// ✅ Tip card (quick + feels intelligent)
// ✅ Goal + baseline reset (haircut-friendly for V2)

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  StatusBar,
  ScrollView,
  TextInput,
  Alert,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useFocusEffect } from "@react-navigation/native";

import {
  getRecentEventsByType,
  logEvent,
  type OmniEvent,
} from "../../storage/omniEventStore";

import { buildProgressDerived } from "../../utils/progress/progressEngine";
import { useThemePro } from "../../context/ThemeContext";

type ProgressEntry = {
  id: string;
  dateISO: string;
  length: number;
  unit: "in";
  method?: string;
  photoUri?: string | null;
};

const MEASURE_TYPE = "measurement_added";
const HAIRCUT_TYPE = "haircut_reset";
const GOAL_TYPE = "goal_set";

// V1 inches-only (minimal). Keep converters for compatibility.
function toInches(length: number, unit: "in" | "cm" | "mm") {
  if (unit === "in") return length;
  if (unit === "cm") return length / 2.54;
  return length / 25.4;
}

// V1: monthly growth = 30d trend
function growthPerMonthIn(derived: ReturnType<typeof buildProgressDerived>) {
  if (derived.growth30dIn === undefined) return null;
  return derived.growth30dIn;
}

// V1 heuristic: recolor timing from growth rate
function recommendRecolorWeeks(growthPerMonth: number | null) {
  if (!growthPerMonth || growthPerMonth <= 0) return 6;
  const weeks = 8 - growthPerMonth * 2;
  return Math.max(4, Math.min(10, weeks));
}

function round1(n: number) {
  return Math.round(n * 10) / 10;
}

export default function ProgressTrackerScreen() {
  const nav = useNavigation<any>();
  const { colors } = useThemePro();

  const [events, setEvents] = useState<OmniEvent<any>[]>([]);
  const [loading, setLoading] = useState(true);

  // Quick input modals (inline inputs, minimal)
  const [showLog, setShowLog] = useState(false);
  const [showGoal, setShowGoal] = useState(false);
  const [lenInput, setLenInput] = useState("");
  const [goalInput, setGoalInput] = useState("");

  const load = useCallback(async () => {
    try {
      setLoading(true);

      const [m, h, g] = await Promise.all([
        getRecentEventsByType(MEASURE_TYPE, 200),
        getRecentEventsByType(HAIRCUT_TYPE, 50),
        getRecentEventsByType(GOAL_TYPE, 20),
      ]);

      const combined = [...m, ...h, ...g].sort((a, b) => b.ts - a.ts);
      setEvents(combined);
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
      load();
    }, [load])
  );

  const derived = useMemo(() => buildProgressDerived(events), [events]);

  // Convert events -> the old “entries” list shape for rendering
  const entries: ProgressEntry[] = useMemo(() => {
    const out: ProgressEntry[] = [];
    for (const e of events) {
      if (e.type !== MEASURE_TYPE) continue;
      const len = Number(e.payload?.lengthIn);
      if (!Number.isFinite(len)) continue;

      out.push({
        id: e.id,
        dateISO: new Date(e.ts).toISOString(),
        length: len,
        unit: "in",
        method: e.payload?.method || "manual",
        photoUri: e.payload?.photoUri || null,
      });
    }
    return out.sort(
      (a, b) => new Date(b.dateISO).getTime() - new Date(a.dateISO).getTime()
    );
  }, [events]);

  const latest = useMemo(() => (entries.length ? entries[0] : null), [entries]);
  const rate = growthPerMonthIn(derived);
  const recolorWeeks = recommendRecolorWeeks(rate);

  const tipText = useMemo(() => {
    // Simple “intelligent” tips (V1 safe, feels premium)
    if (!entries.length) {
      return "Start by logging your current length. Omni will track trends and help you hit your growth goal.";
    }

    const g30 = derived.growth30dIn;
    if (g30 !== undefined && g30 <= 0.05) {
      return "Growth looks slower lately. In V2 Omni will auto-detect haircuts/plateaus from photos — for now, consider a Hair Health Scan to check dryness/breakage.";
    }

    if (derived.goal?.targetIn && derived.latestLengthIn !== undefined) {
      const remaining = derived.goal.targetIn - derived.latestLengthIn;
      if (remaining > 0 && remaining <= 1) {
        return "You’re close to your goal — stay consistent. Small weekly gains add up fast.";
      }
      if (remaining > 1) {
        return "Consistency wins. Log length weekly or bi-weekly for the cleanest trend line.";
      }
    }

    return "Tip: Track length every 7–14 days for the best accuracy. Omni uses trend history to estimate progress and routines (V2+).";
  }, [derived.goal?.targetIn, derived.growth30dIn, derived.latestLengthIn, entries.length]);

  const onLogLength = useCallback(async () => {
    const len = Number(lenInput);
    if (!Number.isFinite(len) || len <= 0 || len > 60) {
      Alert.alert("Invalid length", "Enter a valid length in inches (example: 7.5).");
      return;
    }
    try {
      await logEvent(MEASURE_TYPE, { lengthIn: len, method: "manual", confidence: 1 });
      setLenInput("");
      setShowLog(false);
      await load();
    } catch (e) {
      console.warn("[ProgressTracker] log length failed", e);
      Alert.alert("Error", "Could not save your measurement.");
    }
  }, [lenInput, load]);

  const onSetGoal = useCallback(async () => {
    const target = Number(goalInput);
    if (!Number.isFinite(target) || target <= 0 || target > 60) {
      Alert.alert("Invalid goal", "Enter a valid goal length in inches (example: 12).");
      return;
    }
    try {
      await logEvent(GOAL_TYPE, { targetIn: target });
      setGoalInput("");
      setShowGoal(false);
      await load();
    } catch (e) {
      console.warn("[ProgressTracker] set goal failed", e);
      Alert.alert("Error", "Could not save your goal.");
    }
  }, [goalInput, load]);

  const onResetBaseline = useCallback(async () => {
    const current = derived.latestLengthIn ?? derived.baselineIn;
    if (!current) {
      Alert.alert("No data yet", "Log a length first, then you can reset your baseline after a haircut.");
      return;
    }

    Alert.alert(
      "Reset baseline?",
      `Set ${round1(current)} in as your new baseline (after haircut/trim)?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reset",
          style: "destructive",
          onPress: async () => {
            try {
              await logEvent(HAIRCUT_TYPE, {
                newBaselineIn: Number(current.toFixed(2)),
                reason: "haircut",
              });
              await load();
            } catch (e) {
              console.warn("[ProgressTracker] reset baseline failed", e);
            }
          },
        },
      ]
    );
  }, [derived.baselineIn, derived.latestLengthIn, load]);

  const renderItem = ({ item }: { item: ProgressEntry }) => {
    const lengthIn = toInches(item.length, item.unit).toFixed(2);
    const dateLabel = new Date(item.dateISO).toLocaleDateString();
    const methodLabel =
      item.method === "ai_adjusted"
        ? "AI-adjusted"
        : item.method === "manual"
        ? "Manual"
        : item.method === "vision"
        ? "Vision"
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

  const headerSummary = () => {
    if (!entries.length) {
      return (
        <View style={s.summaryCard}>
          <Text style={s.summaryTitle}>No measurements yet</Text>
          <Text style={s.summaryText}>
            Log your current length to start tracking. V2 will add photo-based measurement + haircut detection.
          </Text>

          <View style={{ flexDirection: "row", gap: 10, marginTop: 12 }}>
            <TouchableOpacity style={s.btnPrimary} onPress={() => setShowLog(true)} activeOpacity={0.9}>
              <Text style={s.btnPrimaryText}>Log Length</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.btnGhost} onPress={() => nav.navigate("Premium", { screen: "HairHealthScannerScreen" })} activeOpacity={0.9}>
              <Text style={s.btnGhostText}>Run Scan</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    const latestIn = latest ? toInches(latest.length, latest.unit).toFixed(2) : "--";
    const rateIn = rate ? rate.toFixed(2) : null;

    return (
      <>
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

        {/* Quick actions row */}
        <View style={s.quickRow}>
          <TouchableOpacity style={s.btnPrimary} onPress={() => setShowLog(true)} activeOpacity={0.9}>
            <Text style={s.btnPrimaryText}>Log Length</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.btnGhost} onPress={() => setShowGoal(true)} activeOpacity={0.9}>
            <Text style={s.btnGhostText}>Set Goal</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.btnGhost} onPress={onResetBaseline} activeOpacity={0.9}>
            <Text style={s.btnGhostText}>Haircut Reset</Text>
          </TouchableOpacity>
        </View>

        {/* Tip card */}
        <View style={s.tipCard}>
          <Text style={s.tipTitle}>Omni Tip</Text>
          <Text style={s.tipText}>{tipText}</Text>
        </View>
      </>
    );
  };

  return (
    <SafeAreaView style={[s.container, { backgroundColor: colors.background || "#FAFAFA" }]}>
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

          {/* Inline “modal” blocks (simple + safe) */}
          {showLog ? (
            <View style={s.modalCard}>
              <Text style={s.modalTitle}>Log your current length</Text>
              <TextInput
                value={lenInput}
                onChangeText={setLenInput}
                placeholder="Inches (example: 7.5)"
                placeholderTextColor="#9CA3AF"
                keyboardType={Platform.OS === "ios" ? "decimal-pad" : "numeric"}
                style={s.input}
              />
              <View style={{ flexDirection: "row", gap: 10, marginTop: 10 }}>
                <TouchableOpacity style={s.btnPrimary} onPress={onLogLength} activeOpacity={0.9}>
                  <Text style={s.btnPrimaryText}>Save</Text>
                </TouchableOpacity>
                <TouchableOpacity style={s.btnGhost} onPress={() => setShowLog(false)} activeOpacity={0.9}>
                  <Text style={s.btnGhostText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : null}

          {showGoal ? (
            <View style={s.modalCard}>
              <Text style={s.modalTitle}>Set your goal length</Text>
              <TextInput
                value={goalInput}
                onChangeText={setGoalInput}
                placeholder="Goal inches (example: 12)"
                placeholderTextColor="#9CA3AF"
                keyboardType={Platform.OS === "ios" ? "decimal-pad" : "numeric"}
                style={s.input}
              />
              <View style={{ flexDirection: "row", gap: 10, marginTop: 10 }}>
                <TouchableOpacity style={s.btnPrimary} onPress={onSetGoal} activeOpacity={0.9}>
                  <Text style={s.btnPrimaryText}>Set Goal</Text>
                </TouchableOpacity>
                <TouchableOpacity style={s.btnGhost} onPress={() => setShowGoal(false)} activeOpacity={0.9}>
                  <Text style={s.btnGhostText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : null}

          <Text style={s.sectionTitle}>History</Text>

          {!entries.length ? (
            <Text style={s.emptyText}>
              No entries yet. Log a length above to start your timeline.
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
  topTitle: { fontSize: 18, fontWeight: "800", color: "#FFF" },
  topAction: { fontSize: 14, fontWeight: "700", color: "#E5E7EB" },

  body: { flex: 1, paddingHorizontal: 16, paddingTop: 16 },

  loadingWrap: { flex: 1, justifyContent: "center", alignItems: "center", padding: 24 },
  loadingText: { marginTop: 8, color: "#4B5563", fontSize: 14 },

  summaryRow: { flexDirection: "row", justifyContent: "space-between", gap: 10, marginBottom: 10 },
  summaryCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },

  summaryTitle: { fontSize: 15, fontWeight: "900", color: "#111827" },
  summaryText: { marginTop: 6, fontSize: 13, color: "#6B7280", lineHeight: 18 },

  summaryLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "#6B7280",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  summaryValue: { fontSize: 18, fontWeight: "900", color: "#000", marginTop: 4 },
  summarySub: { marginTop: 4, fontSize: 11, color: "#9CA3AF" },

  quickRow: { flexDirection: "row", gap: 10, marginBottom: 12 },

  btnPrimary: {
    flex: 1,
    backgroundColor: "#000",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  btnPrimaryText: { color: "#FFF", fontWeight: "900" },

  btnGhost: {
    flex: 1,
    backgroundColor: "#FFF",
    borderRadius: 12,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "#111",
    alignItems: "center",
    justifyContent: "center",
  },
  btnGhostText: { color: "#111", fontWeight: "900" },

  tipCard: {
    backgroundColor: "#F8FAFC",
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: 18,
  },
  tipTitle: { fontSize: 12, fontWeight: "900", color: "#111", textTransform: "uppercase", letterSpacing: 0.6 },
  tipText: { marginTop: 6, fontSize: 13, color: "#334155", lineHeight: 18, fontWeight: "700" },

  modalCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginBottom: 18,
  },
  modalTitle: { fontSize: 14, fontWeight: "900", color: "#111827" },

  input: {
    marginTop: 10,
    height: 44,
    borderRadius: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#F9FAFB",
    color: "#111",
    fontWeight: "800",
  },

  sectionTitle: { fontSize: 16, fontWeight: "800", color: "#111827", marginBottom: 8 },
  emptyText: { fontSize: 13, color: "#6B7280", marginBottom: 16 },

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
  entryDate: { fontSize: 13, fontWeight: "700", color: "#111827" },
  entryLength: { fontSize: 15, fontWeight: "800", color: "#000", marginTop: 2 },
  entryMeta: { fontSize: 11, color: "#6B7280", marginTop: 2 },

  pill: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, backgroundColor: "#F3F4F6" },
  pillText: { fontSize: 14 },
});
