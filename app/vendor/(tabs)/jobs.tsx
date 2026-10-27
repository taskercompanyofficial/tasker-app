import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  FlatList,
  Image,
  Linking,
  RefreshControl,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";

import AppText from "@/components/common/AppText";
import AppTextInput from "@/components/common/AppTextInput";
import MinimalJobCard from "@/components/vendor/MinimalJobCard";
import Colors from "@/constants/Colors";
import { useSession } from "@/context/ctx";
import { useLanguage } from "@/context/language-context";
import {
  VENDOR_ACCEPT_WORK_ORDER_URL,
  VENDOR_STAFF_WORK_ORDERS_URL,
  VENDOR_STAFF_WORK_ORDER_SUMMARY_URL,
  VENDOR_WORK_ORDER_SUMMARY_URL,
  VENDOR_WORK_ORDER_URL,
} from "@/lib/api-endpoints";
import axios from "@/lib/axios.config";
import { localizedToast } from "@/lib/i18n/localized-toast";
import { WorkOrder } from "@/types/work-order";

type TabType = "pending" | "active" | "unposted" | "completed";

interface TabSummaryStats {
  pending: number;
  active: number;
  unposted: number;
  completed: number;
}

// ─── SKELETON LOADER FOR SMOOTH VISUAL FEEDBACK ───
function JobCardSkeleton() {
  const pulseAnim = useRef(new Animated.Value(0.35)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 0.85,
          duration: 750,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.35,
          duration: 750,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [pulseAnim]);

  return (
    <Animated.View style={[styles.skeletonCard, { opacity: pulseAnim }]}>
      <View style={styles.skeletonLeft}>
        <View style={styles.skeletonRow}>
          <View style={styles.skeletonTag} />
          <View style={styles.skeletonTitle} />
        </View>
        <View style={styles.skeletonRow}>
          <View style={styles.skeletonIcon} />
          <View style={styles.skeletonCustomer} />
        </View>
        <View style={styles.skeletonRow}>
          <View style={styles.skeletonIcon} />
          <View style={styles.skeletonAddress} />
        </View>
        <View style={styles.skeletonRow}>
          <View style={styles.skeletonIcon} />
          <View style={styles.skeletonTime} />
        </View>
      </View>
      <View style={styles.skeletonRight}>
        <View style={styles.skeletonPayout} />
        <View style={styles.skeletonButton} />
      </View>
    </Animated.View>
  );
}

export default function VendorJobsScreen() {
  const { t } = useLanguage();
  const { session } = useSession();
  const params = useLocalSearchParams<{ status?: string }>();

  const isStaff =
    session.appMode === "vendor_staff" ||
    (session.user as any)?.user_type === "vendor_staff";

  // Initial tab
  const initialTab: TabType =
    params.status === "active"
      ? "active"
      : params.status === "unposted"
      ? "unposted"
      : params.status === "completed"
      ? "completed"
      : "pending";

  const [activeTab, setActiveTab] = useState<TabType>(initialTab);
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [claimingId, setClaimingId] = useState<number | null>(null);

  // Tab stats for live counters
  const [tabStats, setTabStats] = useState<TabSummaryStats>({
    pending: 0,
    active: 0,
    unposted: 0,
    completed: 0,
  });

  const isOnline = Boolean((session.vendorUser as any)?.is_online ?? true);

  // Sync tab if params change while mounted
  useEffect(() => {
    if (params.status) {
      if (params.status === "active") setActiveTab("active");
      else if (params.status === "unposted") setActiveTab("unposted");
      else if (params.status === "completed") setActiveTab("completed");
      else if (params.status === "pending") setActiveTab("pending");
    }
  }, [params.status]);

  // Fetch summary stats
  const fetchSummaryStats = async () => {
    try {
      const summaryUrl = isStaff
        ? VENDOR_STAFF_WORK_ORDER_SUMMARY_URL
        : VENDOR_WORK_ORDER_SUMMARY_URL;
      const res = await axios.get(summaryUrl);
      if (res.data?.data) {
        const d = res.data.data;
        setTabStats({
          pending: Number(d.pending_acceptance ?? d.pending ?? 0),
          active: Number(d.active ?? d.in_progress ?? 0),
          unposted: Number(d.unposted ?? 0),
          completed: Number(d.completed ?? 0),
        });
      }
    } catch (_) {
      // Graceful fallback: maintain existing counts
    }
  };

  const fetchWorkOrders = async (
    targetTab = activeTab,
    pageNum = 1,
    isLoadMore = false,
    query = searchQuery
  ) => {
    try {
      if (!isLoadMore && !refreshing) {
        setLoading(true);
      }
      if (isLoadMore) {
        setLoadingMore(true);
      }

      const baseUrl = isStaff ? VENDOR_STAFF_WORK_ORDERS_URL : VENDOR_WORK_ORDER_URL;
      let url = `${baseUrl}?page=${pageNum}&per_page=20&`;

      // Status query
      if (targetTab === "pending") url += "status=pending&";
      else if (targetTab === "active") url += "status=active&";
      else if (targetTab === "unposted") url += "status=unposted&";
      else if (targetTab === "completed") url += "status=completed&";

      if (query.trim()) {
        url += `search=${encodeURIComponent(query.trim())}&`;
      }

      const response = await axios.get(url);
      const newData: WorkOrder[] = response.data.data || [];

      if (isLoadMore) {
        setWorkOrders((prev) => [...prev, ...newData]);
      } else {
        setWorkOrders(newData);
        // Also update local tab count if on page 1 without search
        if (!query.trim()) {
          setTabStats((prev) => ({
            ...prev,
            [targetTab]: Math.max(prev[targetTab], newData.length),
          }));
        }
      }

      setHasMore(newData.length === 20);
    } catch (error) {
      if (!isLoadMore) {
        setWorkOrders([]);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchSummaryStats();
      fetchWorkOrders(activeTab, 1, false, searchQuery);
    }, [activeTab])
  );

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      setHasMore(true);
      fetchWorkOrders(activeTab, 1, false, searchQuery);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const loadMore = () => {
    if (!loadingMore && hasMore && !loading) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchWorkOrders(activeTab, nextPage, true, searchQuery);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    setPage(1);
    setHasMore(true);
    fetchSummaryStats();
    fetchWorkOrders(activeTab, 1, false, searchQuery);
  };

  // Switch tab
  const handleTabChange = (newTab: TabType) => {
    if (newTab === activeTab) return;
    setActiveTab(newTab);
    setPage(1);
    setHasMore(true);
    setWorkOrders([]);
    fetchWorkOrders(newTab, 1, false, searchQuery);
  };

  // Claim open pool job
  const handleClaimJob = (item: WorkOrder) => {
    const woLabel = item.work_order_number || `#${item.id}`;
    Alert.alert(
      "Claim Job?",
      `Are you ready to service ${woLabel} for ${item.customer?.name || "the customer"}? Once claimed, it will move to your active jobs.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "⚡ Claim Now",
          style: "default",
          onPress: async () => {
            try {
              setClaimingId(item.id);
              await axios.post(VENDOR_ACCEPT_WORK_ORDER_URL(item.id));
              localizedToast({
                type: "success",
                text1: "⚡ Job Claimed Successfully!",
                text2: `${woLabel} is now in your active jobs.`,
              });
              // Refresh counts and switch to active tab
              setActiveTab("active");
              fetchSummaryStats();
              fetchWorkOrders("active", 1, false, "");
            } catch (err: any) {
              const msg =
                err?.response?.data?.message ||
                "This job may have already been claimed by another vendor.";
              localizedToast({
                type: "error",
                text1: "Claim Failed",
                text2: msg,
              });
              // Refresh pool to update list
              fetchWorkOrders("pending", 1, false, searchQuery);
            } finally {
              setClaimingId(null);
            }
          },
        },
      ]
    );
  };

  // Fast direct actions
  const handleCall = (phone: string, name: string) => {
    if (!phone) {
      Alert.alert("No Contact Number", `No registered phone number found for ${name}.`);
      return;
    }
    Linking.openURL(`tel:${phone}`).catch(() => {
      Alert.alert("Call Error", "Could not initiate dialer on device.");
    });
  };

  const handleOpenMap = (
    addressText: string,
    lat?: number | string,
    lng?: number | string
  ) => {
    const hasGps =
      lat !== undefined && lng !== undefined && lat !== null && lng !== null;
    const url = hasGps
      ? `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`
      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addressText)}`;

    Linking.openURL(url).catch(() => {
      Alert.alert("Map Error", "Could not launch map navigation.");
    });
  };

  const handleWorkOrderPress = (id: number) => {
    router.push({
      pathname: "/vendor/work-order-details/[id]",
      params: { id: id.toString() },
    } as any);
  };

  // Tabs definition matching clean text badges (no icons per user request)
  const tabs = [
    {
      key: "pending" as TabType,
      label: "Job Pool",
      count: tabStats.pending,
      isPool: true,
    },
    {
      key: "active" as TabType,
      label: "My Active",
      count: tabStats.active,
      isPool: false,
    },
    ...(!isStaff
      ? [
          {
            key: "unposted" as TabType,
            label: "Unposted",
            count: tabStats.unposted,
            isPool: false,
          },
        ]
      : []),
    {
      key: "completed" as TabType,
      label: "History",
      count: tabStats.completed,
      isPool: false,
    },
  ];

  // Render contextual empty states matching the artifact
  const renderEmptyState = () => {
    if (searchQuery.trim()) {
      return (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconCircle}>
            <Ionicons name="search-outline" size={28} color="#64748B" />
          </View>
          <AppText style={styles.emptyTitle}>No Matches Found</AppText>
          <AppText style={styles.emptyDesc}>
            No work orders matched "{searchQuery}". Try searching another name, address, or #WO.
          </AppText>
        </View>
      );
    }

    if (activeTab === "pending") {
      return (
        <View style={styles.emptyContainer}>
          <Image
            source={require("@/assets/images/job-pool-empty.png")}
            style={styles.emptyImage}
            resizeMode="contain"
          />
          <AppText style={styles.emptyTitle}>Pool is Empty</AppText>
          <AppText style={styles.emptyDesc}>
            No unclaimed orders right now. New customer bookings in your zone will broadcast here automatically.
          </AppText>
        </View>
      );
    }

    if (activeTab === "active") {
      return (
        <View style={styles.emptyContainer}>
          <View style={[styles.emptyIconCircle, { backgroundColor: "#EFF6FF", borderColor: "#BFDBFE" }]}>
            <Ionicons name="construct-outline" size={30} color="#2563EB" />
          </View>
          <AppText style={styles.emptyTitle}>No Active Jobs</AppText>
          <AppText style={styles.emptyDesc}>
            You don't have any jobs in progress. Check the Job Pool to claim open work orders in your area.
          </AppText>
        </View>
      );
    }

    if (activeTab === "unposted") {
      return (
        <View style={styles.emptyContainer}>
          <View style={[styles.emptyIconCircle, { backgroundColor: "#FEF3C7", borderColor: "#FDE68A" }]}>
            <Ionicons name="receipt-outline" size={30} color="#D97706" />
          </View>
          <AppText style={styles.emptyTitle}>No Unposted Jobs</AppText>
          <AppText style={styles.emptyDesc}>
            All your finished work orders have been billed and posted. Great work!
          </AppText>
        </View>
      );
    }

    return (
      <View style={styles.emptyContainer}>
        <View style={styles.emptyIconCircle}>
          <Ionicons name="checkmark-done-circle-outline" size={30} color="#059669" />
        </View>
        <AppText style={styles.emptyTitle}>No Job History</AppText>
        <AppText style={styles.emptyDesc}>
          Your completed and settled work orders will be archived here.
        </AppText>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* ─── 1. TOP APP BAR ─── */}
      <View style={styles.topBar}>
        <View style={styles.topBarLeft}>
          <AppText style={styles.topBarTitle}>Work Orders</AppText>
          <View style={styles.onlineStatusRow}>
            <View style={[styles.liveDot, { backgroundColor: isOnline ? "#10B981" : "#94A3B8" }]} />
            <AppText style={styles.onlineStatusText}>
              {isOnline ? "Online & Receiving Pool Jobs" : "Offline • Go Online to receive jobs"}
            </AppText>
          </View>
        </View>

        <View
          style={[
            styles.onlineBadge,
            {
              backgroundColor: isOnline ? "#ECFDF5" : "#F1F5F9",
              borderColor: isOnline ? "#A7F3D0" : "#CBD5E1",
            },
          ]}
        >
          <AppText
            style={[
              styles.onlineBadgeText,
              { color: isOnline ? "#059669" : "#64748B" },
            ]}
          >
            {isOnline ? "ONLINE 🟢" : "OFFLINE ⚪"}
          </AppText>
        </View>
      </View>

      {/* ─── 2. SEARCH BAR ─── */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={17} color="#94A3B8" />
          <AppTextInput
            style={styles.searchInput}
            placeholder="Search customer, area or #WO..."
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close-circle" size={17} color="#94A3B8" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* ─── 3. STATUS TABS (JOB POOL vs ACTIVE vs UNPOSTED vs HISTORY) ─── */}
      <View style={styles.tabsContainer}>
        {tabs.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              style={[
                styles.tabBtn,
                isActive && styles.tabBtnActive,
              ]}
              onPress={() => handleTabChange(tab.key)}
              activeOpacity={0.75}
            >
              <AppText
                style={[
                  styles.tabLabel,
                  isActive && styles.tabLabelActive,
                ]}
              >
                {tab.label}
              </AppText>

              {tab.count > 0 && (
                <View
                  style={[
                    styles.tabCounter,
                    isActive && styles.tabCounterActive,
                    tab.isPool && styles.poolBadgeCounter,
                  ]}
                >
                  <AppText
                    style={[
                      styles.tabCounterText,
                      isActive && styles.tabCounterTextActive,
                      tab.isPool && styles.poolBadgeCounterText,
                    ]}
                  >
                    {tab.count}
                  </AppText>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* ─── 4. JOBS FEED (FLATLIST FOR 60FPS SMOOTH PERFORMANCE) ─── */}
      {loading ? (
        <View style={styles.skeletonList}>
          <JobCardSkeleton />
          <JobCardSkeleton />
          <JobCardSkeleton />
          <JobCardSkeleton />
          <JobCardSkeleton />
          <JobCardSkeleton />
        </View>
      ) : (
        <FlatList
          data={workOrders}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <MinimalJobCard
              workOrder={item}
              tab={activeTab}
              onPress={() => handleWorkOrderPress(item.id)}
              onClaim={() => handleClaimJob(item)}
              isClaiming={claimingId === item.id}
              onCall={handleCall}
              onOpenMap={handleOpenMap}
              onSubmitBill={() => handleWorkOrderPress(item.id)}
            />
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          onEndReached={loadMore}
          onEndReachedThreshold={0.3}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={["#059669"]}
              tintColor="#059669"
            />
          }
          ListEmptyComponent={renderEmptyState}
          ListFooterComponent={
            loadingMore ? (
              <View style={styles.loadingMoreBox}>
                <ActivityIndicator size="small" color="#059669" />
                <AppText style={styles.loadingMoreText}>Loading more...</AppText>
              </View>
            ) : null
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F4F5F7",
  },

  /* ─── Top Header ─── */
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  topBarLeft: {
    flexDirection: "column",
  },
  topBarTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#0F172A",
    letterSpacing: -0.3,
  },
  onlineStatusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 2,
  },
  liveDot: {
    width: 6.5,
    height: 6.5,
    borderRadius: 3.5,
  },
  onlineStatusText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#059669",
  },
  onlineBadge: {
    paddingHorizontal: 9,
    paddingVertical: 3.5,
    borderRadius: 999,
    borderWidth: 1,
  },
  onlineBadgeText: {
    fontSize: 10.5,
    fontWeight: "800",
  },

  /* ─── Search Bar ─── */
  searchContainer: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#F8FAFC",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    paddingHorizontal: 10,
    height: 38,
  },
  searchInput: {
    flex: 1,
    fontSize: 12.5,
    color: "#0F172A",
    height: "100%",
  },

  /* ─── Tabs ─── */
  tabsContainer: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 14,
    paddingBottom: 10,
    paddingTop: 2,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
    gap: 6,
  },
  tabBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 6,
    borderRadius: 999,
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  tabBtnActive: {
    backgroundColor: "#059669",
    borderColor: "#059669",
  },
  tabLabel: {
    fontSize: 11.5,
    fontWeight: "700",
    color: "#64748B",
  },
  tabLabelActive: {
    color: "#FFFFFF",
  },
  tabCounter: {
    backgroundColor: "#E2E8F0",
    borderRadius: 999,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  tabCounterActive: {
    backgroundColor: "rgba(255, 255, 255, 0.25)",
  },
  poolBadgeCounter: {
    backgroundColor: "#EF4444",
  },
  tabCounterText: {
    fontSize: 9.5,
    fontWeight: "800",
    color: "#475569",
  },
  tabCounterTextActive: {
    color: "#FFFFFF",
  },
  poolBadgeCounterText: {
    color: "#FFFFFF",
  },

  /* ─── Feed & List ─── */
  listContent: {
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
  },
  loadingText: {
    fontSize: 12.5,
    color: "#64748B",
    fontWeight: "600",
  },
  loadingMoreBox: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
  },
  loadingMoreText: {
    fontSize: 11.5,
    color: "#64748B",
  },

  /* ─── Skeleton Loader Styles ─── */
  skeletonList: {
    paddingHorizontal: 12,
    paddingTop: 10,
    gap: 8,
  },
  skeletonCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderLeftWidth: 3.5,
    borderLeftColor: "#CBD5E1",
    paddingVertical: 10,
    paddingHorizontal: 11,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  skeletonLeft: {
    flex: 1,
    gap: 5,
  },
  skeletonRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  skeletonTag: {
    width: 48,
    height: 14,
    borderRadius: 4,
    backgroundColor: "#E2E8F0",
  },
  skeletonTitle: {
    width: "60%",
    height: 14,
    borderRadius: 4,
    backgroundColor: "#E2E8F0",
  },
  skeletonIcon: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#E2E8F0",
  },
  skeletonCustomer: {
    width: 100,
    height: 12,
    borderRadius: 4,
    backgroundColor: "#E2E8F0",
  },
  skeletonAddress: {
    width: 150,
    height: 11,
    borderRadius: 4,
    backgroundColor: "#E2E8F0",
  },
  skeletonTime: {
    width: 80,
    height: 11,
    borderRadius: 4,
    backgroundColor: "#E2E8F0",
  },
  skeletonRight: {
    alignItems: "flex-end",
    gap: 6,
  },
  skeletonPayout: {
    width: 55,
    height: 15,
    borderRadius: 4,
    backgroundColor: "#E2E8F0",
  },
  skeletonButton: {
    width: 58,
    height: 24,
    borderRadius: 999,
    backgroundColor: "#E2E8F0",
  },

  /* ─── Empty State ─── */
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 50,
    paddingHorizontal: 30,
    marginTop: 10,
  },
  emptyImage: {
    width: 140,
    height: 140,
    marginBottom: 12,
  },
  emptyIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#ECFDF5",
    borderWidth: 1.5,
    borderColor: "#A7F3D0",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#0F172A",
    marginBottom: 6,
    textAlign: "center",
  },
  emptyDesc: {
    fontSize: 12,
    color: "#64748B",
    textAlign: "center",
    lineHeight: 18,
    maxWidth: 280,
  },
});
