import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StatusBar,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";

import AppText from "@/components/common/AppText";
import { Shadows, Spacing, Typography } from "@/constants/DesignSystem";
import { VENDOR_RATES_URL } from "@/lib/api-endpoints";
import myAxios from "@/lib/axios.config";
import { useLanguage } from "@/context/language-context";

type RateItem = {
  id: number;
  name: string;
  assigned_rate?: number;
  assigned_share?: number;
  is_overridden?: boolean;
  base_rate?: number;
  base_share?: number;
  type?: "customer" | "free" | string;
};

type RateMode = "customer" | "free";

export default function VendorLedgerRates() {
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [services, setServices] = useState<RateItem[]>([]);
  const [rateMode, setRateMode] = useState<RateMode>("free");
  const [searchQuery, setSearchQuery] = useState("");

  const fetchRates = useCallback(async () => {
    try {
      const res = await myAxios.get(VENDOR_RATES_URL);
      const data = res.data?.data;
      if (data?.services && Array.isArray(data.services)) {
        setServices(data.services);
      }
    } catch (e) {
      console.log("Rates fetch error:", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchRates();
    }, [fetchRates])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchRates();
  };

  const formatPKR = (val?: number) => {
    if (val == null || isNaN(val)) return "—";
    return (
      "₨ " +
      Math.round(val).toLocaleString("en-PK", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      })
    );
  };

  // Filtered list based on active tab and search input
  const filteredServices = useMemo(() => {
    // For now, customer rates are not added yet, so return empty list
    if (rateMode === "customer") {
      return [];
    }

    let list = services;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((s) => s.name.toLowerCase().includes(q));
    }

    return list;
  }, [services, rateMode, searchQuery]);

  const renderRateRow = ({ item }: { item: RateItem }) => {
    const isFreeMode = rateMode === "free";
    const displayPrice = isFreeMode
      ? item.assigned_rate ?? item.base_rate ?? 0
      : item.base_rate ?? item.assigned_rate ?? 0;

    return (
      <View style={styles.compactRow}>
        <View style={styles.rowLeft}>
          <AppText style={styles.rowTitle} numberOfLines={2}>
            {item.name}
          </AppText>
        </View>

        <View style={styles.rowRight}>
          <AppText style={[styles.rowPrice, isFreeMode && styles.rowPriceFree]}>
            {formatPKR(displayPrice)}
          </AppText>
          <AppText style={styles.rowSubLabel}>
            {isFreeMode ? "Company Payout" : "Customer Price"}
          </AppText>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* ─── 1. TOP NAVIGATION BAR WITH BACK BUTTON ─── */}
      <View style={[styles.topNavBar, { paddingTop: Math.max(insets.top, 14) }]}>
        <TouchableOpacity
          style={styles.backBtn}
          activeOpacity={0.7}
          onPress={() => router.back()}
          accessibilityLabel="Go back"
        >
          <Ionicons name="arrow-back" size={22} color="#1E293B" />
        </TouchableOpacity>

        <View style={styles.navTitleBox}>
          <AppText style={styles.navTitle}>Service Rates</AppText>
          <AppText style={styles.navSubtitle}>Approved Rate Card</AppText>
        </View>

        <TouchableOpacity
          style={styles.refreshBtn}
          activeOpacity={0.7}
          onPress={onRefresh}
          accessibilityLabel="Refresh rates"
        >
          <Ionicons name="refresh-outline" size={20} color="#059669" />
        </TouchableOpacity>
      </View>

      {/* ─── 2. DUAL-MODE SEGMENTED SWITCHER (Customer vs Free Payouts) ─── */}
      <View style={styles.modeBar}>
        <View style={styles.modePill}>
          <TouchableOpacity
            style={[styles.modeBtn, rateMode === "customer" && styles.modeBtnActive]}
            activeOpacity={0.8}
            onPress={() => setRateMode("customer")}
          >
            <AppText
              style={[styles.modeBtnText, rateMode === "customer" && styles.modeBtnTextActive]}
            >
              Customer Rates
            </AppText>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.modeBtn, rateMode === "free" && styles.modeBtnActive]}
            activeOpacity={0.8}
            onPress={() => setRateMode("free")}
          >
            <AppText style={[styles.modeBtnText, rateMode === "free" && styles.modeBtnTextActive]}>
              Free Service Payouts
            </AppText>
          </TouchableOpacity>
        </View>
      </View>

      {/* ─── 3. FAST SEARCH INPUT ─── */}
      <View style={styles.searchBarWrap}>
        <View style={styles.searchInputBox}>
          <Ionicons name="search-outline" size={16} color="#94A3B8" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search service name..."
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={setSearchQuery}
            clearButtonMode="while-editing"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <Ionicons name="close-circle" size={16} color="#94A3B8" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* ─── 4. SECTION HEADER (Header Labels) ─── */}
      <View style={styles.sectionHeaderRow}>
        <AppText style={styles.sectionHeaderCol}>Service Name</AppText>
        <AppText style={styles.sectionHeaderColRight}>
          {rateMode === "free" ? "Company Payout" : "Customer Price"}
        </AppText>
      </View>

      {/* ─── 5. COMPACT RATES LIST ─── */}
      {loading ? (
        <View style={styles.centerLoading}>
          <ActivityIndicator size="large" color="#059669" />
        </View>
      ) : (
        <FlatList
          data={filteredServices}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderRateRow}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 20 }]}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#059669" />
          }
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconCircle}>
                <Ionicons
                  name={rateMode === "customer" ? "time-outline" : "receipt-outline"}
                  size={32}
                  color="#059669"
                />
              </View>
              <AppText style={styles.emptyTitle}>
                {rateMode === "customer"
                  ? "Customer Rates Not Added Yet"
                  : "No Services Found"}
              </AppText>
              <AppText style={styles.emptySubtitle}>
                {rateMode === "customer"
                  ? "Standard customer rates have not been added yet and will appear here once published."
                  : searchQuery
                  ? "Try searching for a different keyword."
                  : "Assigned service rates will appear here once configured."}
              </AppText>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#F4F5F7",
  },
  centerLoading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 50,
  },

  /* ─── Top Navigation Bar ─── */
  topNavBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },
  navTitleBox: {
    alignItems: "center",
  },
  navTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0F172A",
    letterSpacing: -0.2,
  },
  navSubtitle: {
    fontSize: 11,
    color: "#64748B",
    marginTop: 1,
  },
  refreshBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },

  /* ─── Mode Switcher ─── */
  modeBar: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  modePill: {
    flexDirection: "row",
    backgroundColor: "#E2E8F0",
    borderRadius: 999,
    padding: 3,
  },
  modeBtn: {
    flex: 1,
    paddingVertical: 7,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 999,
  },
  modeBtnActive: {
    backgroundColor: "#059669",
  },
  modeBtnText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#64748B",
  },
  modeBtnTextActive: {
    color: "#FFFFFF",
  },

  /* ─── Search Bar ─── */
  searchBarWrap: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 6,
  },
  searchInputBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: "#0F172A",
    padding: 0,
  },

  /* ─── Section Header Labels ─── */
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 6,
  },
  sectionHeaderCol: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    color: "#64748B",
  },
  sectionHeaderColRight: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    color: "#64748B",
    textAlign: "right",
  },

  /* ─── Rates List ─── */
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 2,
  },
  separator: {
    height: 6,
  },
  compactRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  rowLeft: {
    flex: 1,
    paddingRight: 14,
  },
  rowTitle: {
    fontSize: 13.5,
    fontWeight: "700",
    color: "#0F172A",
    lineHeight: 18,
  },
  rowRight: {
    alignItems: "flex-end",
    flexShrink: 0,
  },
  rowPrice: {
    fontSize: 15.5,
    fontWeight: "800",
    color: "#0F172A",
  },
  rowPriceFree: {
    color: "#059669",
  },
  rowSubLabel: {
    fontSize: 10,
    fontWeight: "600",
    color: "#64748B",
    marginTop: 1,
  },

  /* ─── Empty State ─── */
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 50,
    paddingHorizontal: 30,
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#ECFDF5",
    borderWidth: 1.5,
    borderColor: "#A7F3D0",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0F172A",
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 12.5,
    color: "#64748B",
    textAlign: "center",
    lineHeight: 18,
  },
});
