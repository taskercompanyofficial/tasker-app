import React, { useCallback, useMemo, useState, useRef, useEffect } from "react";
import {
  ActivityIndicator,
  Animated,
  FlatList,
  RefreshControl,
  ScrollView,
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
import { VENDOR_RATES_URL, VENDOR_CUSTOMER_LEDGER_URL } from "@/lib/api-endpoints";
import myAxios from "@/lib/axios.config";
import { useLanguage } from "@/context/language-context";
import { useSession } from "@/context/ctx";

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

type CustomerItem = {
  id: number;
  category: string;
  item_type: "part" | "additional_labor" | "service";
  description: string;
  unit: string | null;
  rate_1_ton: string | number | null;
  rate_1_5_ton: string | number | null;
  rate_2_ton_wm: string | number | null;
  rate_2_ton_cabinet: string | number | null;
  rate_4_ton_cabinet: string | number | null;
  standard_rate: string | number | null;
  notes: string | null;
};

type ParentServiceItem = {
  id: number;
  name: string;
  slug: string;
  price: number;
  discount: number | null;
  discount_type: string | null;
  notes: string | null;
};

type RateMode = "customer" | "free";
type CustomerCategoryFilter = "all" | "ac" | "wm" | "geyser" | "services";

export default function VendorLedgerRates() {
  const insets = useSafeAreaInsets();
  const { session } = useSession();
  const { t } = useLanguage();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [rateMode, setRateMode] = useState<RateMode>("customer");
  const [customerCategory, setCustomerCategory] = useState<CustomerCategoryFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pulseAnim = useRef(new Animated.Value(0.35)).current;

  // Pulsing animation loop for skeletons
  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 0.85,
          duration: 550,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.35,
          duration: 550,
          useNativeDriver: true,
        }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [pulseAnim]);

  const handleSearchText = (text: string) => {
    setSearchInput(text);
    setIsSearching(true);
    if (searchTimerRef.current) {
      clearTimeout(searchTimerRef.current);
    }
    searchTimerRef.current = setTimeout(() => {
      setSearchQuery(text);
      setIsSearching(false);
    }, 220);
  };

  const clearSearch = () => {
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    setSearchInput("");
    setSearchQuery("");
    setIsSearching(false);
  };

  // Free services data
  const [services, setServices] = useState<RateItem[]>([]);

  // Customer rates data
  const [customerItems, setCustomerItems] = useState<CustomerItem[]>([]);
  const [parentServices, setParentServices] = useState<ParentServiceItem[]>([]);

  const fetchRates = useCallback(async () => {
    try {
      const mode = session.appMode === "vendor_staff" ? "vendor-staff" : "vendor";

      // Fetch both Free Payouts and Customer Rates in parallel
      const [freeRes, customerRes] = await Promise.allSettled([
        myAxios.get(VENDOR_RATES_URL),
        myAxios.get(VENDOR_CUSTOMER_LEDGER_URL(mode)),
      ]);

      if (freeRes.status === "fulfilled" && freeRes.value.data?.data?.services) {
        setServices(freeRes.value.data.data.services);
      }

      if (customerRes.status === "fulfilled" && customerRes.value.data?.data) {
        setCustomerItems(customerRes.value.data.data.items || []);
        setParentServices(customerRes.value.data.data.parent_services || []);
      }
    } catch (e) {
      console.log("Rates fetch error:", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [session.appMode]);

  useFocusEffect(
    useCallback(() => {
      fetchRates();
    }, [fetchRates])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchRates();
  };

  const formatPKR = (val?: number | string | null) => {
    if (val == null || val === "") return "—";
    const num = typeof val === "string" ? parseFloat(val) : val;
    if (isNaN(num)) return "—";
    return (
      "₨ " +
      Math.round(num).toLocaleString("en-PK", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      })
    );
  };

  // Filtered Free Services
  const filteredFreeServices = useMemo(() => {
    if (rateMode !== "free") return [];
    let list = services;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((s) => s.name.toLowerCase().includes(q));
    }
    return list;
  }, [services, rateMode, searchQuery]);

  // Filtered Customer Ledger Items
  const filteredCustomerItems = useMemo(() => {
    if (rateMode !== "customer") return [];

    let list = customerItems;

    // Filter by Category Pill
    if (customerCategory === "ac") {
      list = list.filter(
        (i) =>
          i.category.toLowerCase().includes("air conditioner") ||
          i.category.toLowerCase() === "ac"
      );
    } else if (customerCategory === "wm") {
      list = list.filter((i) => i.category.toLowerCase().includes("washing machine"));
    } else if (customerCategory === "geyser") {
      list = list.filter((i) => i.category.toLowerCase().includes("geyser"));
    } else if (customerCategory === "services") {
      // Show only parent services (handled below in unified list)
      list = [];
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (i) =>
          i.description.toLowerCase().includes(q) ||
          i.category.toLowerCase().includes(q) ||
          (i.notes && i.notes.toLowerCase().includes(q))
      );
    }

    return list;
  }, [customerItems, rateMode, customerCategory, searchQuery]);

  // Filtered Parent Services (for "Customer Rates" view)
  const filteredParentServices = useMemo(() => {
    if (rateMode !== "customer") return [];
    if (customerCategory !== "all" && customerCategory !== "services") return [];

    let list = parentServices;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.slug.toLowerCase().includes(q) ||
          (s.notes && s.notes.toLowerCase().includes(q))
      );
    }
    return list;
  }, [parentServices, rateMode, customerCategory, searchQuery]);

  // Combined Customer List for FlatList
  type CombinedCustomerRow =
    | { type: "customer_item"; item: CustomerItem }
    | { type: "parent_service"; item: ParentServiceItem }
    | { type: "spot_policy"; title: string; desc: string; category: string };

  const customerCombinedData = useMemo<CombinedCustomerRow[]>(() => {
    if (rateMode !== "customer") return [];

    const result: CombinedCustomerRow[] = [];

    // Add spot policy notice banners if relevant
    if (customerCategory === "all" || customerCategory === "wm") {
      result.push({
        type: "spot_policy",
        category: "Washing Machine",
        title: "Washing Machine Spot Policy",
        desc: "All plumbing and electrical charges will be decided at the spot based on tap fitting and drain pipe distance.",
      });
    }

    if (customerCategory === "all" || customerCategory === "geyser") {
      result.push({
        type: "spot_policy",
        category: "Geyser",
        title: "Geyser Spot Policy",
        desc: "All plumbing and electrical charges will be decided at the spot depending on gas piping, hot/cold lines, and chimney.",
      });
    }

    // Add customer ledger items
    filteredCustomerItems.forEach((item) => {
      result.push({ type: "customer_item", item });
    });

    // Add parent services
    filteredParentServices.forEach((item) => {
      result.push({ type: "parent_service", item });
    });

    return result;
  }, [rateMode, customerCategory, filteredCustomerItems, filteredParentServices]);

  // Free Payout Row
  const renderFreeRateRow = ({ item }: { item: RateItem }) => {
    const displayPrice = item.assigned_rate ?? item.base_rate ?? 0;

    return (
      <View style={styles.compactRow}>
        <View style={styles.rowLeft}>
          <AppText style={styles.rowTitle} numberOfLines={2}>
            {item.name}
          </AppText>
        </View>

        <View style={styles.rowRight}>
          <AppText style={[styles.rowPrice, styles.rowPriceFree]}>
            {formatPKR(displayPrice)}
          </AppText>
          <AppText style={styles.rowSubLabel}>Company Payout</AppText>
        </View>
      </View>
    );
  };

  // Customer Rate Row
  const renderCustomerRateRow = ({ item }: { item: CombinedCustomerRow }) => {
    if (item.type === "spot_policy") {
      return (
        <View style={styles.spotPolicyBanner}>
          <Ionicons name="information-circle" size={18} color="#D97706" />
          <View style={{ flex: 1 }}>
            <AppText style={styles.spotPolicyTitle}>{item.title}</AppText>
            <AppText style={styles.spotPolicyDesc}>{item.desc}</AppText>
          </View>
        </View>
      );
    }

    if (item.type === "parent_service") {
      const s = item.item;
      const basePrice = s.price || 0;
      let finalPrice = basePrice;
      if (s.discount && s.discount > 0) {
        if (s.discount_type === "percentage") {
          finalPrice = basePrice - (basePrice * s.discount) / 100;
        } else {
          finalPrice = Math.max(0, basePrice - s.discount);
        }
      }

      return (
        <View style={styles.compactRow}>
          <View style={styles.rowLeft}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 2 }}>
              <View style={[styles.badge, { backgroundColor: "#F3E8FF" }]}>
                <AppText style={[styles.badgeText, { color: "#9333EA" }]}>Service Charges</AppText>
              </View>
            </View>
            <AppText style={styles.rowTitle} numberOfLines={2}>
              {s.name}
            </AppText>
            <AppText style={styles.rowSlug}>{s.slug}</AppText>
          </View>

          <View style={styles.rowRight}>
            <AppText style={styles.rowPrice}>{formatPKR(finalPrice)}</AppText>
            {s.discount && s.discount > 0 ? (
              <AppText style={styles.discountTag}>
                {s.discount_type === "percentage" ? `${s.discount}% OFF` : `-₨${s.discount}`}
              </AppText>
            ) : (
              <AppText style={styles.rowSubLabel}>Customer Price</AppText>
            )}
          </View>
        </View>
      );
    }

    // Customer Item
    const c = item.item;
    const isACItem =
      c.rate_1_ton != null ||
      c.rate_1_5_ton != null ||
      c.rate_2_ton_wm != null ||
      c.rate_2_ton_cabinet != null ||
      c.rate_4_ton_cabinet != null;

    if (isACItem) {
      return (
        <View style={styles.acCard}>
          <View style={styles.acCardTop}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 5, marginBottom: 4 }}>
                <View
                  style={[
                    styles.badge,
                    c.item_type === "part" ? styles.partBadge : styles.laborBadge,
                  ]}
                >
                  <AppText
                    style={[
                      styles.badgeText,
                      c.item_type === "part" ? styles.partBadgeText : styles.laborBadgeText,
                    ]}
                  >
                    {c.item_type === "part" ? "Part" : "Labor"}
                  </AppText>
                </View>
                {c.unit && (
                  <View style={[styles.badge, { backgroundColor: "#F1F5F9" }]}>
                    <AppText style={[styles.badgeText, { color: "#64748B" }]}>{c.unit}</AppText>
                  </View>
                )}
              </View>
              <AppText style={styles.acCardTitle}>{c.description}</AppText>
            </View>
          </View>

          {/* Tonnage Pricing Row */}
          <View style={styles.tonnageGrid}>
            <View style={styles.tonnageCol}>
              <AppText style={styles.tonnageLabel}>1 Ton</AppText>
              <AppText style={styles.tonnagePrice}>{formatPKR(c.rate_1_ton)}</AppText>
            </View>
            <View style={styles.tonnageDivider} />
            <View style={styles.tonnageCol}>
              <AppText style={styles.tonnageLabel}>1.5 Ton</AppText>
              <AppText style={styles.tonnagePrice}>{formatPKR(c.rate_1_5_ton)}</AppText>
            </View>
            <View style={styles.tonnageDivider} />
            <View style={styles.tonnageCol}>
              <AppText style={styles.tonnageLabel}>2T W.M</AppText>
              <AppText style={styles.tonnagePrice}>{formatPKR(c.rate_2_ton_wm)}</AppText>
            </View>
            <View style={styles.tonnageDivider} />
            <View style={styles.tonnageCol}>
              <AppText style={styles.tonnageLabel}>2T Cab.</AppText>
              <AppText style={styles.tonnagePrice}>{formatPKR(c.rate_2_ton_cabinet)}</AppText>
            </View>
            <View style={styles.tonnageDivider} />
            <View style={styles.tonnageCol}>
              <AppText style={styles.tonnageLabel}>4T Cab.</AppText>
              <AppText style={styles.tonnagePrice}>{formatPKR(c.rate_4_ton_cabinet)}</AppText>
            </View>
          </View>

          {c.notes ? (
            <View style={styles.acCardFooter}>
              <Ionicons name="information-circle-outline" size={13} color="#64748B" />
              <AppText style={styles.acCardNotes}>{c.notes}</AppText>
            </View>
          ) : null}
        </View>
      );
    }

    // Standard Flat Rate Customer Item (Washing Machine / Geyser parts, etc.)
    return (
      <View style={styles.compactRow}>
        <View style={styles.rowLeft}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 5, marginBottom: 3 }}>
            <View style={[styles.badge, styles.partBadge]}>
              <AppText style={[styles.badgeText, styles.partBadgeText]}>{c.category}</AppText>
            </View>
            {c.unit && (
              <View style={[styles.badge, { backgroundColor: "#F1F5F9" }]}>
                <AppText style={[styles.badgeText, { color: "#64748B" }]}>{c.unit}</AppText>
              </View>
            )}
          </View>
          <AppText style={styles.rowTitle}>{c.description}</AppText>
          {c.notes && <AppText style={styles.rowNotes}>{c.notes}</AppText>}
        </View>

        <View style={styles.rowRight}>
          <AppText style={styles.rowPrice}>{formatPKR(c.standard_rate)}</AppText>
          <AppText style={styles.rowSubLabel}>Customer Price</AppText>
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
          <AppText style={styles.navTitle}>Service Rate Ledger</AppText>
          <AppText style={styles.navSubtitle}>Approved Rates & Customer Ledger</AppText>
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

      {/* ─── 2. DUAL-MODE SEGMENTED SWITCHER (Customer Rates vs Free Payouts) ─── */}
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
          {isSearching ? (
            <ActivityIndicator size="small" color="#059669" style={{ marginRight: 2 }} />
          ) : (
            <Ionicons name="search-outline" size={16} color="#94A3B8" />
          )}
          <TextInput
            style={styles.searchInput}
            placeholder={
              rateMode === "customer"
                ? "Search materials, parts, services..."
                : "Search service name..."
            }
            placeholderTextColor="#94A3B8"
            value={searchInput}
            onChangeText={handleSearchText}
            clearButtonMode="while-editing"
          />
          {searchInput.length > 0 && (
            <TouchableOpacity onPress={clearSearch}>
              <Ionicons name="close-circle" size={16} color="#94A3B8" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* ─── 4. CUSTOMER RATES CATEGORY PILLS (Only in Customer Rates mode) ─── */}
      {rateMode === "customer" && (
        <View style={styles.categoryPillsBar}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryPillsScroll}>
            <TouchableOpacity
              style={[styles.catPill, customerCategory === "all" && styles.catPillActive]}
              onPress={() => setCustomerCategory("all")}
            >
              <AppText style={[styles.catPillText, customerCategory === "all" && styles.catPillTextActive]}>
                All Categories
              </AppText>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.catPill, customerCategory === "ac" && styles.catPillActive]}
              onPress={() => setCustomerCategory("ac")}
            >
              <Ionicons name="snow" size={13} color={customerCategory === "ac" ? "#FFFFFF" : "#64748B"} />
              <AppText style={[styles.catPillText, customerCategory === "ac" && styles.catPillTextActive]}>
                Air Conditioner
              </AppText>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.catPill, customerCategory === "wm" && styles.catPillActive]}
              onPress={() => setCustomerCategory("wm")}
            >
              <Ionicons name="shirt" size={13} color={customerCategory === "wm" ? "#FFFFFF" : "#64748B"} />
              <AppText style={[styles.catPillText, customerCategory === "wm" && styles.catPillTextActive]}>
                Washing Machine
              </AppText>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.catPill, customerCategory === "geyser" && styles.catPillActive]}
              onPress={() => setCustomerCategory("geyser")}
            >
              <Ionicons name="flame" size={13} color={customerCategory === "geyser" ? "#FFFFFF" : "#64748B"} />
              <AppText style={[styles.catPillText, customerCategory === "geyser" && styles.catPillTextActive]}>
                Geyser
              </AppText>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.catPill, customerCategory === "services" && styles.catPillActive]}
              onPress={() => setCustomerCategory("services")}
            >
              <Ionicons name="layers" size={13} color={customerCategory === "services" ? "#FFFFFF" : "#64748B"} />
              <AppText style={[styles.catPillText, customerCategory === "services" && styles.catPillTextActive]}>
                Service Charges ({parentServices.length})
              </AppText>
            </TouchableOpacity>
          </ScrollView>
        </View>
      )}

      {/* ─── 5. SECTION HEADER (Header Labels) ─── */}
      <View style={styles.sectionHeaderRow}>
        <AppText style={styles.sectionHeaderCol}>
          {rateMode === "free" ? "Service Name" : "Item / Material / Service"}
        </AppText>
        <AppText style={styles.sectionHeaderColRight}>
          {rateMode === "free" ? "Company Payout" : "Customer Price"}
        </AppText>
      </View>

      {/* ─── 6. RATES LIST ─── */}
      {loading ? (
        <View style={styles.centerLoading}>
          <ActivityIndicator size="large" color="#059669" />
          <AppText style={{ fontSize: 12, color: "#64748B", marginTop: 8 }}>
            Loading rates...
          </AppText>
        </View>
      ) : isSearching ? (
        <View style={styles.skeletonContainer}>
          {[1, 2, 3, 4, 5].map((i) => (
            <Animated.View key={i} style={[styles.skeletonRow, { opacity: pulseAnim }]}>
              <View style={{ flex: 1, gap: 7 }}>
                <View style={styles.skeletonBarPill} />
                <View style={styles.skeletonBarTitle} />
              </View>
              <View style={styles.skeletonBarPrice} />
            </Animated.View>
          ))}
        </View>
      ) : rateMode === "free" ? (
        <FlatList
          data={filteredFreeServices}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderFreeRateRow}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 20 }]}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#059669" />
          }
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconCircle}>
                <Ionicons name="receipt-outline" size={32} color="#059669" />
              </View>
              <AppText style={styles.emptyTitle}>No Services Found</AppText>
              <AppText style={styles.emptySubtitle}>
                {searchQuery
                  ? "Try searching for a different keyword."
                  : "Assigned service rates will appear here once configured."}
              </AppText>
            </View>
          }
        />
      ) : (
        <FlatList
          data={customerCombinedData}
          keyExtractor={(item, index) =>
            item.type === "spot_policy"
              ? `policy-${item.category}`
              : item.type === "parent_service"
              ? `ps-${item.item.id}`
              : `ci-${item.item.id}-${index}`
          }
          renderItem={renderCustomerRateRow}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 20 }]}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#059669" />
          }
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconCircle}>
                <Ionicons name="receipt-outline" size={32} color="#059669" />
              </View>
              <AppText style={styles.emptyTitle}>No Customer Rates Found</AppText>
              <AppText style={styles.emptySubtitle}>
                {searchQuery
                  ? "Try searching for a different keyword."
                  : "Customer rates will appear here once configured."}
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

  /* ─── Category Pills ─── */
  categoryPillsBar: {
    paddingVertical: 6,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  categoryPillsScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  catPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 16,
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  catPillActive: {
    backgroundColor: "#059669",
    borderColor: "#059669",
  },
  catPillText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#64748B",
  },
  catPillTextActive: {
    color: "#FFFFFF",
    fontWeight: "700",
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
  rowSlug: {
    fontSize: 10,
    color: "#94A3B8",
    fontFamily: "monospace",
    marginTop: 2,
  },
  rowNotes: {
    fontSize: 11,
    color: "#64748B",
    marginTop: 2,
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
  discountTag: {
    fontSize: 10,
    fontWeight: "700",
    color: "#DC2626",
    marginTop: 1,
  },

  /* ─── AC Card ─── */
  acCard: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    padding: 12,
    gap: 8,
  },
  acCardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  acCardTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#0F172A",
    lineHeight: 17,
  },
  tonnageGrid: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#EDF2F7",
    paddingVertical: 6,
  },
  tonnageCol: {
    flex: 1,
    alignItems: "center",
  },
  tonnageDivider: {
    width: 1,
    height: 20,
    backgroundColor: "#E2E8F0",
  },
  tonnageLabel: {
    fontSize: 9.5,
    color: "#64748B",
    fontWeight: "600",
    marginBottom: 2,
  },
  tonnagePrice: {
    fontSize: 11.5,
    fontWeight: "800",
    color: "#0F172A",
  },
  acCardFooter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
  },
  acCardNotes: {
    fontSize: 10.5,
    color: "#64748B",
    fontStyle: "italic",
    flex: 1,
  },

  /* ─── Badges ─── */
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 5,
  },
  partBadge: {
    backgroundColor: "#E0F2FE",
  },
  laborBadge: {
    backgroundColor: "#FEF3C7",
  },
  badgeText: {
    fontSize: 9.5,
    fontWeight: "700",
  },
  partBadgeText: {
    color: "#0369A1",
  },
  laborBadgeText: {
    color: "#B45309",
  },

  /* ─── Spot Policy Banner ─── */
  spotPolicyBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: "#FEF3C7",
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#FDE68A",
  },
  spotPolicyTitle: {
    fontSize: 11.5,
    fontWeight: "700",
    color: "#92400E",
  },
  spotPolicyDesc: {
    fontSize: 10.5,
    color: "#B45309",
    marginTop: 1,
    lineHeight: 15,
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
  skeletonContainer: {
    paddingHorizontal: 16,
    paddingTop: 6,
    gap: 8,
  },
  skeletonRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  skeletonBarPill: {
    width: 65,
    height: 12,
    borderRadius: 4,
    backgroundColor: "#CBD5E1",
  },
  skeletonBarTitle: {
    width: "70%",
    height: 14,
    borderRadius: 4,
    backgroundColor: "#E2E8F0",
  },
  skeletonBarPrice: {
    width: 65,
    height: 20,
    borderRadius: 6,
    backgroundColor: "#CBD5E1",
  },
});
