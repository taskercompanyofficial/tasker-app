import Header from "@/components/Header";
import WorkOrderCard from "@/components/WorkOrderCard";
import Colors from "@/constants/Colors";
import { Spacing } from "@/constants/Styles";
import { useSession } from "@/context/ctx";
import { VENDOR_WORK_ORDER_URL } from "@/lib/api-endpoints";
import axios from "@/lib/axios.config";
import { WorkOrder } from "@/types/work-order";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import { router, useLocalSearchParams } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  NativeScrollEvent,
  NativeSyntheticEvent,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type TabType = "pending" | "active" | "unposted" | "completed";

export default function VendorJobs() {
  const { session } = useSession();
  const params = useLocalSearchParams<{ status?: string }>();
  
  // Set initial tab based on navigation params if present
  const initialTab: TabType = 
    params.status === 'active' ? 'active' :
    params.status === 'unposted' ? 'unposted' :
    params.status === 'completed' ? 'completed' :
    params.status === 'pending' ? 'pending' : 'pending';

  const [activeTab, setActiveTab] = useState<TabType>(initialTab);
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  // Sync tab if params change while component is mounted
  useEffect(() => {
    if (params.status) {
      if (params.status === 'active') setActiveTab('active');
      else if (params.status === 'unposted') setActiveTab('unposted');
      else if (params.status === 'completed') setActiveTab('completed');
      else if (params.status === 'pending') setActiveTab('pending');
    }
  }, [params.status]);

  useFocusEffect(
    useCallback(() => {
      fetchWorkOrders();
    }, [activeTab]),
  );

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchWorkOrders();
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const fetchWorkOrders = async (pageNum = 1, isLoadMore = false) => {
    try {
      if (!isLoadMore && !refreshing && searchQuery === "") {
        setLoading(true);
      }
      if (isLoadMore) {
        setLoadingMore(true);
      }

      let url = `${VENDOR_WORK_ORDER_URL}?page=${pageNum}&per_page=20&`;

      // Add status filter
      if (activeTab === "pending") url += "status=pending&";
      else if (activeTab === "active") url += "status=active&";
      else if (activeTab === "unposted") url += "status=unposted&";
      else if (activeTab === "completed") url += "status=completed&";

      // Add search query
      if (searchQuery) {
        url += `search=${encodeURIComponent(searchQuery)}&`;
      }

      const response = await axios.get(url);
      const newData = response.data.data || [];
      
      if (isLoadMore) {
        setWorkOrders((prev) => [...prev, ...newData]);
      } else {
        setWorkOrders(newData);
      }
      
      // Check if we have more data
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

  const loadMore = () => {
    if (!loadingMore && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchWorkOrders(nextPage, true);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    setPage(1);
    setHasMore(true);
    fetchWorkOrders(1, false);
  };

  const handleWorkOrderPress = (id: number) => {
    // Navigate to details using the full path
    router.push({
      pathname: "/vendor/work-order-details/[id]",
      params: { id: id.toString() },
    } as any);
  };

  const isStaff = session.appMode === "vendor_staff" || (session.user as any)?.user_type === "vendor_staff";

  const tabs = [
    { key: "pending" as TabType, label: "Pending", icon: "notifications" },
    { key: "active" as TabType, label: "Active", icon: "construct" },
    ...(!isStaff ? [{ key: "unposted" as TabType, label: "Unposted", icon: "alert-circle" }] : []),
    { key: "completed" as TabType, label: "Done", icon: "checkmark-circle" },
  ];

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons
        name={
          searchQuery
            ? "search-outline"
            : activeTab === "pending"
              ? "notifications-outline"
              : activeTab === "active"
                ? "briefcase-outline"
                : activeTab === "unposted"
                  ? "alert-circle-outline"
                  : "checkmark-circle-outline"
        }
        size={64}
        color={Colors.text.tertiary}
      />
      <Text style={styles.emptyTitle}>
        {searchQuery
          ? "No Matches Found"
          : activeTab === "pending"
            ? "No Pending Jobs"
            : activeTab === "active"
              ? "No Active Jobs"
              : activeTab === "unposted"
                ? "No Unposted Jobs"
                : "No Completed Jobs"}
      </Text>
      <Text style={styles.emptyText}>
        {searchQuery
          ? `We couldn't find any jobs matching "${searchQuery}"`
          : activeTab === "pending"
            ? "New assignments will appear here"
            : activeTab === "active"
              ? "Start working on a pending job"
              : activeTab === "unposted"
                ? "All your completed jobs have been posted"
                : "Completed jobs will appear here"}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <Header title="My Jobs" />

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchWrapper}>
          <Ionicons name="search" size={20} color={Colors.text.tertiary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search WO#, customer, phone..."
            placeholderTextColor={Colors.text.tertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <Ionicons
                name="close-circle"
                size={20}
                color={Colors.text.tertiary}
              />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.tabActive]}
            onPress={() => setActiveTab(tab.key)}
            activeOpacity={0.7}
          >
            <Ionicons
              name={tab.icon as any}
              size={16}
              color={activeTab === tab.key ? '#fff' : '#64748B'}
            />
            <Text
              style={[
                styles.tabText,
                activeTab === tab.key && styles.tabTextActive,
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        onScroll={({ nativeEvent }: NativeSyntheticEvent<NativeScrollEvent>) => {
          const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
          const isCloseToBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - 50;
          if (isCloseToBottom) {
            loadMore();
          }
        }}
        scrollEventThrottle={400}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[Colors.themes.provider.primary]}
          />
        }
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator
              size="large"
              color={Colors.themes.provider.primary}
            />
            <Text style={styles.loadingText}>Loading jobs...</Text>
          </View>
        ) : workOrders.length === 0 ? (
          renderEmptyState()
        ) : (
          <>
            {workOrders.map((workOrder) => (
              <WorkOrderCard
                key={workOrder.id}
                workOrderNumber={workOrder.work_order_number}
                customerName={workOrder.customer.name}
                address={`${workOrder.address.city}, ${workOrder.address.state}`}
                status={workOrder.status.name}
                statusColor={
                  workOrder.status.color ||
                  (workOrder.status.slug === "completed"
                    ? Colors.success
                    : Colors.themes.provider.primary)
                }
                priority={workOrder.priority}
                serviceName={
                  workOrder.parent_service?.name || workOrder.service?.name
                }
                createdAt={workOrder.created_at}
                isPendingAcceptance={activeTab === "pending"}
                staffName={(workOrder as any).vendor_staff?.name}
                onPress={() => handleWorkOrderPress(workOrder.id)}
              />
            ))}
            {loadingMore && (
              <View style={styles.loadingMoreContainer}>
                <ActivityIndicator size="small" color={Colors.themes.provider.primary} />
                <Text style={styles.loadingMoreText}>Loading more...</Text>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#EEF2F7',
  },
  searchContainer: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: 'transparent',
  },
  searchWrapper: {
    backgroundColor: '#fff',
    borderRadius: 14,
    height: 40,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: Colors.text.primary,
    height: '100%',
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 6,
    backgroundColor: '#EEF2F7',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 7,
    borderRadius: 10,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  tabActive: {
    backgroundColor: '#1E3A8A',
    borderColor: '#1E3A8A',
  },
  tabText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  tabTextActive: {
    color: '#fff',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 12,
    paddingBottom: 100,
    gap: 0,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
    gap: 12,
  },
  loadingText: {
    fontSize: 12,
    color: '#64748B',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
    marginTop: 8,
  },
  emptyText: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    paddingHorizontal: 32,
    lineHeight: 18,
  },
  loadingMoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  loadingMoreText: {
    fontSize: 12,
    color: '#64748B',
  },
});
