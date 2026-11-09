import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  FlatList,
  Image,
  RefreshControl,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import AppText from "@/components/common/AppText";
import AppTextInput from "@/components/common/AppTextInput";
import MinimalJobCard from "@/components/vendor/MinimalJobCard";
import { useSession } from "@/context/ctx";
import { useEcho } from "@/context/EchoProvider";
import {
  VENDOR_CLAIM_JOB_POOL_URL,
  VENDOR_JOB_POOL_URL,
  VENDOR_WORK_ORDER_SUMMARY_URL,
  VENDOR_STAFF_WORK_ORDER_SUMMARY_URL,
} from "@/lib/api-endpoints";
import axios from "@/lib/axios.config";
import { localizedToast } from "@/lib/i18n/localized-toast";
import { setVendorActiveWorkOrderTracking } from "@/lib/vendorBackgroundLocation";
import { WorkOrder } from "@/types/work-order";

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

export default function JobPoolScreen() {
  const { session } = useSession();
  const isStaff =
    session.appMode === "vendor_staff" ||
    (session.user as any)?.user_type === "vendor_staff";

  const isOnline = Boolean((session.vendorUser as any)?.is_online ?? true);

  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [claimingId, setClaimingId] = useState<number | null>(null);
  const [vendorLocation, setVendorLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  // Radar pulse animation for header
  const radarAnim = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(radarAnim, {
          toValue: 1.3,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(radarAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [radarAnim]);

  // Fetch current vendor coordinates to pass to PostGIS query & compute live distance/ETA
  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const { status } = await Location.getForegroundPermissionsAsync();
        if (status === "granted") {
          const loc = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });
          if (isMounted && loc?.coords) {
            setVendorLocation({
              latitude: loc.coords.latitude,
              longitude: loc.coords.longitude,
            });
          }
        }
      } catch (_) {}
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  const fetchJobPool = async (
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

      const poolBase = VENDOR_JOB_POOL_URL(isStaff ? "vendor-staff" : "vendor");
      let url = `${poolBase}?page=${pageNum}&per_page=20&radius=10000&`;

      if (vendorLocation?.latitude && vendorLocation?.longitude) {
        url += `latitude=${vendorLocation.latitude}&longitude=${vendorLocation.longitude}&`;
      }

      if (query.trim()) {
        url += `search=${encodeURIComponent(query.trim())}&`;
      }

      const response = await axios.get(url);
      const newData: WorkOrder[] = response.data?.data || [];
      const total = Number(response.data?.pagination?.total ?? newData.length);
      setTotalCount(total);

      if (isLoadMore) {
        setWorkOrders((prev) => [...prev, ...newData]);
      } else {
        setWorkOrders(newData);
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
      fetchJobPool(1, false, searchQuery);
    }, [vendorLocation])
  );

  const { onWorkOrderUpdate } = useEcho();

  // Real-time listener: refresh job pool automatically when new order arrives or order is claimed
  useEffect(() => {
    return onWorkOrderUpdate(() => {
      fetchJobPool(1, false, searchQuery);
    });
  }, [searchQuery, vendorLocation]);

  const onRefresh = () => {
    setRefreshing(true);
    setPage(1);
    fetchJobPool(1, false, searchQuery);
  };

  const loadMore = () => {
    if (loadingMore || !hasMore || loading) return;
    const nextPage = page + 1;
    setPage(nextPage);
    fetchJobPool(nextPage, true, searchQuery);
  };

  const handleClaimJob = (item: WorkOrder) => {
    const woLabel = item.work_order_number || `#${item.id}`;
    Alert.alert(
      "Claim Job?",
      `Are you ready to service ${woLabel} for ${
        item.customer?.name || "the customer"
      }? Once claimed, it will move immediately to your active jobs.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "⚡ Claim Now",
          style: "default",
          onPress: async () => {
            try {
              setClaimingId(item.id);
              const claimUrl = VENDOR_CLAIM_JOB_POOL_URL(
                item.id,
                isStaff ? "vendor-staff" : "vendor"
              );
              await axios.post(claimUrl);
              await setVendorActiveWorkOrderTracking(
                item.id,
                item.work_order_number || String(item.id),
                item.customer?.name
              );
              localizedToast({
                type: "success",
                text1: "⚡ Job Claimed Successfully!",
                text2: `${woLabel} is now in your active jobs.`,
              });
              // Refresh job pool and redirect to active jobs tab
              fetchJobPool(1, false, searchQuery);
              router.push("/vendor/(tabs)/jobs?status=active" as any);
            } catch (err: any) {
              const msg =
                err?.response?.data?.message ||
                "This job may have already been claimed or capacity limit reached.";
              localizedToast({
                type: "error",
                text1: "Claim Failed",
                text2: msg,
              });
              fetchJobPool(1, false, searchQuery);
            } finally {
              setClaimingId(null);
            }
          },
        },
      ]
    );
  };

  const handleWorkOrderPress = (id: number) => {
    router.push({
      pathname: "/vendor/work-order-details/[id]",
      params: { id: id.toString() },
    } as any);
  };

  const renderEmptyState = () => {
    if (searchQuery.trim()) {
      return (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconCircle}>
            <Ionicons name="search-outline" size={28} color="#64748B" />
          </View>
          <AppText style={styles.emptyTitle}>No Matches in Pool</AppText>
          <AppText style={styles.emptyDesc}>
            No pool jobs matched "{searchQuery}". Try searching another name,
            address, or area.
          </AppText>
        </View>
      );
    }

    return (
      <View style={styles.emptyContainer}>
        <Image
          source={require("@/assets/images/job-pool-empty.png")}
          style={styles.emptyImage}
          resizeMode="contain"
        />
        <AppText style={styles.emptyTitle}>Pool is Quiet Right Now</AppText>
        <AppText style={styles.emptyDesc}>
          10 Km Radar is scanning for new work orders. When a customer books or
          CRM verifies an order in your zone, it alerts you here instantly!
        </AppText>
        <TouchableOpacity
          style={styles.refreshBtn}
          activeOpacity={0.8}
          onPress={onRefresh}
        >
          <Ionicons name="refresh" size={16} color="#059669" />
          <AppText style={styles.refreshBtnText}>Refresh Radar</AppText>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* ─── 1. TOP APP BAR ─── */}
      <View style={styles.topBar}>
        <View style={styles.topBarLeft}>
          <View style={styles.titleRow}>
            <AppText style={styles.topBarTitle}>Job Pool</AppText>
            <View style={styles.lightningBadge}>
              <Ionicons name="flash" size={13} color="#D97706" />
              <AppText style={styles.lightningBadgeText}>10 KM RADAR</AppText>
            </View>
          </View>
          <View style={styles.onlineStatusRow}>
            <Animated.View
              style={[
                styles.liveDot,
                {
                  backgroundColor: isOnline ? "#10B981" : "#94A3B8",
                  transform: [{ scale: isOnline ? radarAnim : 1 }],
                },
              ]}
            />
            <AppText style={styles.onlineStatusText}>
              {isOnline
                ? totalCount > 0
                  ? `${totalCount} open ${totalCount === 1 ? "job" : "jobs"} nearby • Auto-scanning`
                  : "Scanning 10 km zone for new customer bookings"
                : "Offline • Go Online on Dashboard to receive jobs"}
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
            placeholder="Search customer, area or service..."
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={(txt) => {
              setSearchQuery(txt);
              fetchJobPool(1, false, txt);
            }}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => {
                setSearchQuery("");
                fetchJobPool(1, false, "");
              }}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="close-circle" size={17} color="#94A3B8" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* ─── 3. RADAR INFO BAR ─── */}
      <View style={styles.radarBanner}>
        <Ionicons name="radio" size={16} color="#059669" />
        <AppText style={styles.radarBannerText}>
          First to claim gets the job. Capacity scales with your staff & rating.
        </AppText>
      </View>

      {/* ─── 4. JOBS FEED ─── */}
      {loading ? (
        <View style={styles.skeletonList}>
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
            <View style={styles.cardWrapper}>
              <MinimalJobCard
                workOrder={item}
                tab="pending"
                onPress={() => handleWorkOrderPress(item.id)}
                vendorLocation={vendorLocation}
              />
            </View>
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
                <AppText style={styles.loadingMoreText}>Scanning more...</AppText>
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
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 8,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  topBarLeft: {
    flex: 1,
    gap: 4,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  topBarTitle: {
    fontSize: 21,
    fontWeight: "900",
    color: "#0F172A",
    letterSpacing: -0.5,
  },
  lightningBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "#FEF3C7",
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#FDE68A",
  },
  lightningBadgeText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#B45309",
    letterSpacing: 0.2,
  },
  onlineStatusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  onlineStatusText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#64748B",
  },
  onlineBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
  },
  onlineBadgeText: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.3,
  },

  /* ─── Search Bar ─── */
  searchContainer: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F1F5F9",
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 38,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: "#0F172A",
    paddingVertical: 0,
  },

  /* ─── Radar Info Banner ─── */
  radarBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#ECFDF5",
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderBottomWidth: 1,
    borderBottomColor: "#D1FAE5",
  },
  radarBannerText: {
    fontSize: 11.5,
    fontWeight: "600",
    color: "#047857",
    flex: 1,
  },

  /* ─── Jobs Feed ─── */
  listContent: {
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 24,
  },
  cardWrapper: {
    marginBottom: 12,
  },
  claimButton: {
    backgroundColor: "#059669",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
    marginTop: -4,
    shadowColor: "#059669",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  claimButtonDisabled: {
    opacity: 0.6,
  },
  claimButtonText: {
    fontSize: 13.5,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: 0.2,
  },

  /* ─── Loading More ─── */
  loadingMoreBox: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
  },
  loadingMoreText: {
    fontSize: 12,
    color: "#64748B",
    fontWeight: "600",
  },

  /* ─── Skeleton ─── */
  skeletonList: {
    paddingHorizontal: 14,
    paddingTop: 12,
  },
  skeletonCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 12,
    marginBottom: 10,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  skeletonLeft: {
    flex: 1,
    gap: 8,
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
    fontSize: 16,
    fontWeight: "800",
    color: "#0F172A",
    marginBottom: 6,
    textAlign: "center",
  },
  emptyDesc: {
    fontSize: 12.5,
    color: "#64748B",
    textAlign: "center",
    lineHeight: 19,
    maxWidth: 290,
    marginBottom: 18,
  },
  refreshBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#ECFDF5",
    borderWidth: 1,
    borderColor: "#A7F3D0",
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 8,
  },
  refreshBtnText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#059669",
  },
});
