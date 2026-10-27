import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import AppText from "@/components/common/AppText";
import DirectionalIcon from "@/components/common/DirectionalIcon";
import Colors from "@/constants/Colors";
import myAxios from "@/lib/axios.config";
import { VENDOR_CUSTOMER_LEDGER_URL } from "@/lib/api-endpoints";
import { useSession } from "@/context/ctx";

interface CustomerLedgerItem {
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
}

interface ParentServiceRate {
  id: number;
  name: string;
  slug: string;
  price: number;
  discount: number | null;
  discount_type: string | null;
  notes: string | null;
}

export default function VendorRateCardScreen() {
  const { session } = useSession();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<"ac" | "wm" | "geyser" | "services">("ac");
  const [search, setSearch] = useState("");

  const [items, setItems] = useState<CustomerLedgerItem[]>([]);
  const [parentServices, setParentServices] = useState<ParentServiceRate[]>([]);

  const fetchRateCard = useCallback(async () => {
    try {
      const mode = session.appMode === "vendor_staff" ? "vendor-staff" : "vendor";
      const res = await myAxios.get(VENDOR_CUSTOMER_LEDGER_URL(mode));
      if (res.data?.status === "success" && res.data?.data) {
        setItems(res.data.data.items || []);
        setParentServices(res.data.data.parent_services || []);
      }
    } catch (err) {
      console.error("Failed to load customer ledger:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [session.appMode]);

  useEffect(() => {
    fetchRateCard();
  }, [fetchRateCard]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchRateCard();
  }, [fetchRateCard]);

  // Filter AC Items
  const acItems = useMemo(() => {
    return items.filter((i) => {
      const isAc =
        i.category.toLowerCase().includes("air conditioner") ||
        i.category.toLowerCase() === "ac";
      const matchSearch =
        !search ||
        i.description.toLowerCase().includes(search.toLowerCase()) ||
        (i.notes && i.notes.toLowerCase().includes(search.toLowerCase()));
      return isAc && matchSearch;
    });
  }, [items, search]);

  // Filter Washing Machine Items
  const wmItems = useMemo(() => {
    return items.filter((i) => {
      const isWm = i.category.toLowerCase().includes("washing machine");
      const matchSearch =
        !search ||
        i.description.toLowerCase().includes(search.toLowerCase()) ||
        (i.notes && i.notes.toLowerCase().includes(search.toLowerCase()));
      return isWm && matchSearch;
    });
  }, [items, search]);

  // Filter Geyser Items
  const geyserItems = useMemo(() => {
    return items.filter((i) => {
      const isGeyser = i.category.toLowerCase().includes("geyser");
      const matchSearch =
        !search ||
        i.description.toLowerCase().includes(search.toLowerCase()) ||
        (i.notes && i.notes.toLowerCase().includes(search.toLowerCase()));
      return isGeyser && matchSearch;
    });
  }, [items, search]);

  // Filter Parent Services
  const filteredServices = useMemo(() => {
    return parentServices.filter((s) => {
      return (
        !search ||
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        (s.notes && s.notes.toLowerCase().includes(search.toLowerCase()))
      );
    });
  }, [parentServices, search]);

  const formatPrice = (val: string | number | null | undefined) => {
    if (val === null || val === undefined || val === "") return "N/A";
    const num = typeof val === "string" ? parseFloat(val) : val;
    if (isNaN(num)) return "N/A";
    return `₨${num.toLocaleString()}`;
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* ─── Header ─── */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          activeOpacity={0.7}
          onPress={() => router.back()}
        >
          <DirectionalIcon name="arrow-back" size={22} color="#0F172A" />
        </TouchableOpacity>
        <View style={styles.headerTitleWrap}>
          <AppText style={styles.headerTitle}>Customer Ledger</AppText>
          <AppText style={styles.headerSubtitle}>
            Official Rate Card & Price Schedule
          </AppText>
        </View>
        <View style={styles.verifiedBadge}>
          <Ionicons name="shield-checkmark" size={14} color="#059669" />
          <AppText style={styles.verifiedBadgeText}>Official</AppText>
        </View>
      </View>

      {/* ─── Search Bar ─── */}
      <View style={styles.searchBarWrap}>
        <Ionicons name="search" size={18} color="#94A3B8" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search materials, parts, services..."
          placeholderTextColor="#94A3B8"
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch("")} style={styles.clearBtn}>
            <Ionicons name="close-circle" size={18} color="#94A3B8" />
          </TouchableOpacity>
        )}
      </View>

      {/* ─── Appliance Category Tabs ─── */}
      <View style={styles.tabsWrap}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsScrollContent}
        >
          <TouchableOpacity
            style={[styles.tabPill, activeTab === "ac" && styles.tabPillActive]}
            activeOpacity={0.7}
            onPress={() => setActiveTab("ac")}
          >
            <Ionicons
              name="snow"
              size={15}
              color={activeTab === "ac" ? "#FFFFFF" : "#64748B"}
            />
            <AppText
              style={[
                styles.tabPillText,
                activeTab === "ac" && styles.tabPillTextActive,
              ]}
            >
              Air Conditioner
            </AppText>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabPill, activeTab === "wm" && styles.tabPillActive]}
            activeOpacity={0.7}
            onPress={() => setActiveTab("wm")}
          >
            <Ionicons
              name="shirt"
              size={15}
              color={activeTab === "wm" ? "#FFFFFF" : "#64748B"}
            />
            <AppText
              style={[
                styles.tabPillText,
                activeTab === "wm" && styles.tabPillTextActive,
              ]}
            >
              Washing Machine
            </AppText>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabPill, activeTab === "geyser" && styles.tabPillActive]}
            activeOpacity={0.7}
            onPress={() => setActiveTab("geyser")}
          >
            <Ionicons
              name="flame"
              size={15}
              color={activeTab === "geyser" ? "#FFFFFF" : "#64748B"}
            />
            <AppText
              style={[
                styles.tabPillText,
                activeTab === "geyser" && styles.tabPillTextActive,
              ]}
            >
              Geyser
            </AppText>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabPill, activeTab === "services" && styles.tabPillActive]}
            activeOpacity={0.7}
            onPress={() => setActiveTab("services")}
          >
            <Ionicons
              name="layers"
              size={15}
              color={activeTab === "services" ? "#FFFFFF" : "#64748B"}
            />
            <AppText
              style={[
                styles.tabPillText,
                activeTab === "services" && styles.tabPillTextActive,
              ]}
            >
              Parent Services ({parentServices.length})
            </AppText>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* ─── Main Content ─── */}
      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color="#059669" />
          <AppText style={styles.loadingText}>Loading official rate card...</AppText>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollArea}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={["#059669"]}
            />
          }
        >
          {/* TAB 1: AIR CONDITIONER */}
          {activeTab === "ac" && (
            <View style={styles.sectionWrap}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionHeaderIcon}>
                  <Ionicons name="snow" size={18} color="#059669" />
                </View>
                <View>
                  <AppText style={styles.sectionTitle}>
                    AIR CONDITIONER INSTALLATION RATE LIST
                  </AppText>
                  <AppText style={styles.sectionDesc}>
                    Official customer price matrix based on tonnage size
                  </AppText>
                </View>
              </View>

              {acItems.map((item) => (
                <View key={item.id} style={styles.acCard}>
                  {/* Card Title & Type */}
                  <View style={styles.acCardTop}>
                    <AppText style={styles.itemTitle}>{item.description}</AppText>
                    <View style={styles.badgeRow}>
                      <View
                        style={[
                          styles.typeBadge,
                          item.item_type === "part"
                            ? styles.partBadge
                            : styles.laborBadge,
                        ]}
                      >
                        <AppText
                          style={[
                            styles.typeBadgeText,
                            item.item_type === "part"
                              ? styles.partBadgeText
                              : styles.laborBadgeText,
                          ]}
                        >
                          {item.item_type === "part" ? "Part" : "Labor"}
                        </AppText>
                      </View>
                      {item.unit && (
                        <View style={styles.unitBadge}>
                          <AppText style={styles.unitBadgeText}>{item.unit}</AppText>
                        </View>
                      )}
                    </View>
                  </View>

                  {/* Tonnage Grid */}
                  <View style={styles.tonnageGrid}>
                    <View style={styles.tonnageCol}>
                      <AppText style={styles.tonnageLabel}>1 Ton</AppText>
                      <AppText style={styles.tonnagePrice}>
                        {formatPrice(item.rate_1_ton)}
                      </AppText>
                    </View>

                    <View style={styles.tonnageDivider} />

                    <View style={styles.tonnageCol}>
                      <AppText style={styles.tonnageLabel}>1.5 Ton</AppText>
                      <AppText style={styles.tonnagePrice}>
                        {formatPrice(item.rate_1_5_ton)}
                      </AppText>
                    </View>

                    <View style={styles.tonnageDivider} />

                    <View style={styles.tonnageCol}>
                      <AppText style={styles.tonnageLabel}>2T W.M</AppText>
                      <AppText style={styles.tonnagePrice}>
                        {formatPrice(item.rate_2_ton_wm)}
                      </AppText>
                    </View>

                    <View style={styles.tonnageDivider} />

                    <View style={styles.tonnageCol}>
                      <AppText style={styles.tonnageLabel}>2T Cab.</AppText>
                      <AppText style={styles.tonnagePrice}>
                        {formatPrice(item.rate_2_ton_cabinet)}
                      </AppText>
                    </View>

                    <View style={styles.tonnageDivider} />

                    <View style={styles.tonnageCol}>
                      <AppText style={styles.tonnageLabel}>4T Cab.</AppText>
                      <AppText style={styles.tonnagePrice}>
                        {formatPrice(item.rate_4_ton_cabinet)}
                      </AppText>
                    </View>
                  </View>

                  {/* Notes / Inclusions */}
                  {item.notes ? (
                    <View style={styles.cardNotesWrap}>
                      <Ionicons
                        name="information-circle-outline"
                        size={14}
                        color="#64748B"
                      />
                      <AppText style={styles.cardNotesText}>{item.notes}</AppText>
                    </View>
                  ) : null}
                </View>
              ))}
            </View>
          )}

          {/* TAB 2: WASHING MACHINE */}
          {activeTab === "wm" && (
            <View style={styles.sectionWrap}>
              {/* Important Spot Policy Banner */}
              <View style={styles.spotPolicyBanner}>
                <Ionicons name="alert-circle" size={20} color="#D97706" />
                <View style={{ flex: 1 }}>
                  <AppText style={styles.spotPolicyTitle}>
                    Spot Decision Policy:
                  </AppText>
                  <AppText style={styles.spotPolicyDesc}>
                    All plumbing and electrical charges will be decided at the spot
                    depending on water inlet taps, drain pipe distance, and electrical
                    connections.
                  </AppText>
                </View>
              </View>

              {/* Baseline Labor Charges */}
              <View style={styles.applianceServiceCard}>
                <AppText style={styles.subHeading}>Installation Labor Charges</AppText>
                <View style={styles.serviceRow}>
                  <View style={{ flex: 1 }}>
                    <AppText style={styles.serviceRowName}>
                      Top Load Washing Machine
                    </AppText>
                    <AppText style={styles.serviceRowSub}>
                      Standard automatic installation
                    </AppText>
                  </View>
                  <AppText style={styles.serviceRowPrice}>₨1,500 – ₨2,000</AppText>
                </View>

                <View style={styles.serviceRow}>
                  <View style={{ flex: 1 }}>
                    <AppText style={styles.serviceRowName}>
                      Front Load Washing Machine
                    </AppText>
                    <AppText style={styles.serviceRowSub}>
                      Heavy duty transit bolt removal & leveling
                    </AppText>
                  </View>
                  <AppText style={styles.serviceRowPrice}>₨2,000 – ₨3,000</AppText>
                </View>
              </View>

              {/* Spare Parts & Accessories */}
              <View style={styles.applianceServiceCard}>
                <AppText style={styles.subHeading}>Standard Parts & Accessories</AppText>
                {wmItems
                  .filter((i) => i.item_type === "part")
                  .map((part) => (
                    <View key={part.id} style={styles.partItemRow}>
                      <View style={{ flex: 1 }}>
                        <AppText style={styles.partItemName}>{part.description}</AppText>
                        {part.notes && (
                          <AppText style={styles.partItemNotes}>{part.notes}</AppText>
                        )}
                      </View>
                      <AppText style={styles.partItemPrice}>
                        {formatPrice(part.standard_rate)}
                      </AppText>
                    </View>
                  ))}
              </View>
            </View>
          )}

          {/* TAB 3: GEYSER */}
          {activeTab === "geyser" && (
            <View style={styles.sectionWrap}>
              {/* Important Spot Policy Banner */}
              <View style={styles.spotPolicyBanner}>
                <Ionicons name="alert-circle" size={20} color="#D97706" />
                <View style={{ flex: 1 }}>
                  <AppText style={styles.spotPolicyTitle}>
                    Spot Decision Policy:
                  </AppText>
                  <AppText style={styles.spotPolicyDesc}>
                    All plumbing and electrical charges will be decided at the spot
                    depending on gas pipe routing, hot/cold lines, and chimney
                    positioning.
                  </AppText>
                </View>
              </View>

              {/* Baseline Labor Charges */}
              <View style={styles.applianceServiceCard}>
                <AppText style={styles.subHeading}>Installation Labor Charges</AppText>
                <View style={styles.serviceRow}>
                  <View style={{ flex: 1 }}>
                    <AppText style={styles.serviceRowName}>
                      Wall Mount Geyser Models
                    </AppText>
                    <AppText style={styles.serviceRowSub}>
                      Instant Gas & Electric Geyser models
                    </AppText>
                  </View>
                  <AppText style={styles.serviceRowPrice}>₨1,500 – ₨2,500</AppText>
                </View>

                <View style={styles.serviceRow}>
                  <View style={{ flex: 1 }}>
                    <AppText style={styles.serviceRowName}>
                      Tower Geyser Models
                    </AppText>
                    <AppText style={styles.serviceRowSub}>
                      High capacity storage tower geyser
                    </AppText>
                  </View>
                  <AppText style={styles.serviceRowPrice}>₨2,500 – ₨3,000</AppText>
                </View>
              </View>

              {/* Spare Parts & Fittings */}
              <View style={styles.applianceServiceCard}>
                <AppText style={styles.subHeading}>Safety Fittings & Connections</AppText>
                {geyserItems
                  .filter((i) => i.item_type === "part")
                  .map((part) => (
                    <View key={part.id} style={styles.partItemRow}>
                      <View style={{ flex: 1 }}>
                        <AppText style={styles.partItemName}>{part.description}</AppText>
                        {part.notes && (
                          <AppText style={styles.partItemNotes}>{part.notes}</AppText>
                        )}
                      </View>
                      <AppText style={styles.partItemPrice}>
                        {formatPrice(part.standard_rate)}
                      </AppText>
                    </View>
                  ))}
              </View>
            </View>
          )}

          {/* TAB 4: PARENT SERVICES */}
          {activeTab === "services" && (
            <View style={styles.sectionWrap}>
              <View style={styles.sectionHeader}>
                <View style={[styles.sectionHeaderIcon, { backgroundColor: "#F3E8FF" }]}>
                  <Ionicons name="layers" size={18} color="#9333EA" />
                </View>
                <View>
                  <AppText style={styles.sectionTitle}>
                    LIVE PARENT SERVICES RATES
                  </AppText>
                  <AppText style={styles.sectionDesc}>
                    Direct baseline prices quoted to customers on company portal
                  </AppText>
                </View>
              </View>

              {filteredServices.map((service) => {
                const basePrice = service.price || 0;
                let finalPrice = basePrice;
                if (service.discount && service.discount > 0) {
                  if (service.discount_type === "percentage") {
                    finalPrice = basePrice - (basePrice * service.discount) / 100;
                  } else {
                    finalPrice = Math.max(0, basePrice - service.discount);
                  }
                }

                return (
                  <View key={service.id} style={styles.serviceCard}>
                    <View style={styles.serviceCardLeft}>
                      <AppText style={styles.serviceName}>{service.name}</AppText>
                      <AppText style={styles.serviceSlug}>{service.slug}</AppText>
                    </View>
                    <View style={styles.serviceCardRight}>
                      <AppText style={styles.serviceFinalPrice}>
                        ₨{finalPrice.toLocaleString()}
                      </AppText>
                      {service.discount && service.discount > 0 && (
                        <AppText style={styles.serviceDiscountText}>
                          {service.discount_type === "percentage"
                            ? `${service.discount}% OFF`
                            : `-₨${service.discount}`}
                        </AppText>
                      )}
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F1F5F9",
    marginRight: 10,
  },
  headerTitleWrap: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0F172A",
  },
  headerSubtitle: {
    fontSize: 11,
    color: "#64748B",
    marginTop: 1,
  },
  verifiedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#ECFDF5",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#A7F3D0",
  },
  verifiedBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#059669",
  },
  searchBarWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    marginHorizontal: 16,
    marginTop: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    height: 40,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: "#0F172A",
    paddingVertical: 0,
  },
  clearBtn: {
    padding: 4,
  },
  tabsWrap: {
    marginTop: 10,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
    paddingVertical: 8,
  },
  tabsScrollContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  tabPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  tabPillActive: {
    backgroundColor: "#059669",
    borderColor: "#059669",
  },
  tabPillText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#64748B",
  },
  tabPillTextActive: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  loadingWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  loadingText: {
    fontSize: 13,
    color: "#64748B",
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  sectionWrap: {
    gap: 12,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 4,
  },
  sectionHeaderIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "#ECFDF5",
    alignItems: "center",
    justifyContent: "center",
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: "#0F172A",
    letterSpacing: 0.3,
  },
  sectionDesc: {
    fontSize: 11,
    color: "#64748B",
  },
  acCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    gap: 10,
  },
  acCardTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 8,
  },
  itemTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#0F172A",
    flex: 1,
    lineHeight: 18,
  },
  badgeRow: {
    flexDirection: "row",
    gap: 5,
  },
  typeBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  partBadge: {
    backgroundColor: "#E0F2FE",
  },
  laborBadge: {
    backgroundColor: "#FEF3C7",
  },
  typeBadgeText: {
    fontSize: 10,
    fontWeight: "700",
  },
  partBadgeText: {
    color: "#0369A1",
  },
  laborBadgeText: {
    color: "#B45309",
  },
  unitBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: "#F1F5F9",
  },
  unitBadgeText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#64748B",
  },
  tonnageGrid: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#EDF2F7",
    paddingVertical: 8,
  },
  tonnageCol: {
    flex: 1,
    alignItems: "center",
  },
  tonnageDivider: {
    width: 1,
    height: 24,
    backgroundColor: "#E2E8F0",
  },
  tonnageLabel: {
    fontSize: 10,
    color: "#64748B",
    fontWeight: "600",
    marginBottom: 2,
  },
  tonnagePrice: {
    fontSize: 12,
    fontWeight: "800",
    color: "#0F172A",
  },
  cardNotesWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
  },
  cardNotesText: {
    fontSize: 11,
    color: "#64748B",
    fontStyle: "italic",
    flex: 1,
  },
  spotPolicyBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    backgroundColor: "#FEF3C7",
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#FDE68A",
  },
  spotPolicyTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#92400E",
  },
  spotPolicyDesc: {
    fontSize: 11,
    color: "#B45309",
    marginTop: 2,
    lineHeight: 16,
  },
  applianceServiceCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    gap: 10,
  },
  subHeading: {
    fontSize: 12,
    fontWeight: "800",
    color: "#0F172A",
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  serviceRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  serviceRowName: {
    fontSize: 13,
    fontWeight: "700",
    color: "#0F172A",
  },
  serviceRowSub: {
    fontSize: 11,
    color: "#64748B",
    marginTop: 1,
  },
  serviceRowPrice: {
    fontSize: 13,
    fontWeight: "800",
    color: "#059669",
  },
  partItemRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  partItemName: {
    fontSize: 12,
    fontWeight: "600",
    color: "#0F172A",
  },
  partItemNotes: {
    fontSize: 10,
    color: "#64748B",
    marginTop: 1,
  },
  partItemPrice: {
    fontSize: 13,
    fontWeight: "800",
    color: "#0F172A",
  },
  serviceCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFFFFF",
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  serviceCardLeft: {
    flex: 1,
    marginRight: 10,
  },
  serviceName: {
    fontSize: 13,
    fontWeight: "700",
    color: "#0F172A",
  },
  serviceSlug: {
    fontSize: 10,
    color: "#94A3B8",
    fontFamily: "monospace",
    marginTop: 2,
  },
  serviceCardRight: {
    alignItems: "flex-end",
  },
  serviceFinalPrice: {
    fontSize: 14,
    fontWeight: "800",
    color: "#059669",
  },
  serviceDiscountText: {
    fontSize: 10,
    color: "#DC2626",
    fontWeight: "700",
    marginTop: 1,
  },
});
