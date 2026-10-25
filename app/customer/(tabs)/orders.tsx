import DirectionalIcon from "@/components/common/DirectionalIcon";
import AppText from "@/components/common/AppText";
import Loader from "@/components/Loader";
import ContactSupportModal from "@/components/orders/ContactSupportModal";
import NotificationBell from "@/components/common/NotificationBell";
import { useLanguage } from "@/context/language-context";
import Colors from "@/constants/Colors";
import { Spacing, BorderRadius, Typography } from "@/constants/Styles";
import { ORDER_URL } from "@/lib/api-endpoints";
import myAxios from "@/lib/axios.config";
import { Order } from "@/types/order";
import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  FlatList,
  RefreshControl,
  StyleSheet,  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const STATUS_FILTERS = [
  { id: "all", icon: "list" },
  { id: "pending", icon: "hourglass" },
  { id: "in_progress", icon: "time" },
  { id: "completed", icon: "checkmark-circle" },
  { id: "cancelled", icon: "close-circle" },
];

export default function OrdersPage() {
  const { t } = useLanguage();
  const filterLabels: Record<string, string> = {
    all: t.customer.orders.filterAll,
    pending: t.customer.orders.pending,
    in_progress: t.customer.orders.inProgress,
    completed: t.customer.orders.completed,
    cancelled: t.customer.orders.cancelled,
  };
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState("all");
  const selectedStatus = (filterLabels[selectedFilter] || "").toLowerCase();
  const [showContactModal, setShowContactModal] = useState(false);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);

  useFocusEffect(
    useCallback(() => {
      // Reset and fetch first page
      setCurrentPage(1);
      fetchOrders(1, true);
    }, []),
  );

  const fetchOrders = async (page: number = 1, reset: boolean = false) => {
    try {
      if (reset) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      const res = await myAxios.get(`${ORDER_URL}?page=${page}`);
      console.log(JSON.stringify(res.data, null, 2));
      const paginationData = res.data.data;
      const fetchedOrders = paginationData.data || [];

      // Update pagination info
      setCurrentPage(paginationData.current_page);
      setLastPage(paginationData.last_page);

      // Append or replace orders
      if (reset) {
        setOrders(fetchedOrders);
        filterOrders(fetchedOrders, selectedFilter);
      } else {
        const updatedOrders = [...orders, ...fetchedOrders];
        setOrders(updatedOrders);
        filterOrders(updatedOrders, selectedFilter);
      }
    } catch (error) {
      console.error("Failed to fetch orders:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  };

  const loadMoreOrders = () => {
    if (!loadingMore && currentPage < lastPage) {
      fetchOrders(currentPage + 1, false);
    }
  };

  const filterOrders = (ordersList: Order[], filter: string) => {
    if (filter === "all") {
      setFilteredOrders(ordersList);
    } else {
      setFilteredOrders(ordersList.filter((order) => order.status === filter));
    }
  };

  const handleFilterChange = (filter: string) => {
    setSelectedFilter(filter);
    filterOrders(orders, filter);
  };

  const onRefresh = () => {
    setRefreshing(true);
    setCurrentPage(1);
    fetchOrders(1, true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "#10B981";
      case "in_progress":
        return "#3B82F6";
      case "pending":
        return "#F59E0B";
      case "cancelled":
        return Colors.error;
      default:
        return Colors.text.secondary;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return "checkmark-circle";
      case "in_progress":
        return "time";
      case "pending":
        return "hourglass";
      case "cancelled":
        return "close-circle";
      default:
        return "ellipse";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "pending":
        return "Allocated";
      case "in_progress":
        return "In Progress";
      case "completed":
        return "Completed";
      case "cancelled":
        return "Cancelled";
      default:
        return status.replace("_", " ");
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;

    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
    });
  };

  const getOrderStats = () => {
    return {
      total: orders.length,
      pending: orders.filter((o) => o.status === "pending").length,
      active: orders.filter((o) => o.status === "in_progress").length,
      completed: orders.filter((o) => o.status === "completed").length,
      cancelled: orders.filter((o) => o.status === "cancelled").length,
    };
  };

  const renderOrderCard = ({ item }: { item: Order }) => (
    <TouchableOpacity
      style={styles.orderCard}
      onPress={() => router.push(`/customer/orders/${item.order_number}`)}
      activeOpacity={0.7}
    >
      <View style={styles.orderHeader}>
        <View style={styles.orderNumberContainer}>
          <Ionicons
            name="receipt-outline"
            size={16}
            color={Colors.themes.customer.primary}
          />
          <AppText style={styles.orderNumber}>{item.order_number}</AppText>
        </View>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: getStatusColor(item.status) + "15" },
          ]}
        >
          <Ionicons
            name={getStatusIcon(item.status) as any}
            size={12}
            color={getStatusColor(item.status)}
          />
          <AppText
            style={[styles.statusText, { color: getStatusColor(item.status) }]}
          >
            {getStatusLabel(item.status)}
          </AppText>
        </View>
      </View>

      <View style={styles.orderDetails}>
        <View style={styles.detailRow}>
          <Ionicons
            name="calendar-outline"
            size={14}
            color={Colors.text.tertiary}
          />
          <AppText style={styles.detailText}>{formatDate(item.order_date)}</AppText>
        </View>
        <View style={styles.detailRow}>
          <Ionicons
            name="layers-outline"
            size={14}
            color={Colors.text.tertiary}
          />
          <AppText style={styles.detailText}>
            {item.items?.length || 0} service(s)
          </AppText>
        </View>
        <View style={styles.detailRow}>
          <Ionicons
            name="wallet-outline"
            size={14}
            color={Colors.text.tertiary}
          />
          <AppText style={[styles.detailText, { textTransform: "capitalize" }]}>
            {item.payment_method}
          </AppText>
        </View>
      </View>

      <View style={styles.orderFooter}>
        <View>
          <AppText style={styles.totalLabel}>Total Amount</AppText>
          <AppText style={styles.totalAmount}>
            ₨{Math.round(item.total_amount)}
          </AppText>
        </View>
        <View style={styles.viewButton}>
          <AppText style={styles.viewButtonText}>View Details</AppText>
          <DirectionalIcon
            name="chevron-forward"
            size={16}
            color={Colors.themes.customer.primary}
          />
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading || refreshing) {
    return <Loader fullScreen />;
  }

  const stats = getOrderStats();
  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <AppText style={styles.headerTitle}>{t.customer.orders.title}</AppText>
          <AppText style={styles.headerSubtitle}>{stats.total} {t.common.details}</AppText>
        </View>
        <View style={styles.headerActions}>
          <NotificationBell />
          <TouchableOpacity
            style={styles.contactButton}
            onPress={() => setShowContactModal(true)}
          >
            <Ionicons
              name="call"
              size={20}
              color={Colors.themes.customer.primary}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Filter Tabs */}
      <View>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={STATUS_FILTERS}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.filterTab,
                selectedFilter === item.id && styles.filterTabActive,
              ]}
              onPress={() => handleFilterChange(item.id)}
            >
              <Ionicons
                name={item.icon as any}
                size={14}
                color={
                  selectedFilter === item.id
                    ? Colors.themes.customer.primary
                    : Colors.text.secondary
                }
              />
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <AppText
                  style={[
                    styles.filterTabText,
                    selectedFilter === item.id && styles.filterTabTextActive,
                  ]}
                >
                  {filterLabels[item.id]}
                </AppText>
                {item.id !== "all" && (
                  <View
                    style={[
                      styles.countBadge,
                      selectedFilter === item.id && styles.countBadgeActive,
                    ]}
                  >
                    <AppText
                      style={[
                        styles.countText,
                        selectedFilter === item.id && styles.countTextActive,
                      ]}
                    >
                      {item.id === "pending"
                        ? stats.pending
                        : item.id === "in_progress"
                          ? stats.active
                          : item.id === "completed"
                            ? stats.completed
                            : item.id === "cancelled"
                              ? stats.cancelled
                              : 0}
                    </AppText>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          )}
          contentContainerStyle={styles.filterContent}
          style={styles.filterContainer}
        />
      </View>

      {/* Orders List */}
      <FlatList
        data={filteredOrders}
        renderItem={renderOrderCard}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContainer}
        style={styles.ordersList}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        onEndReached={loadMoreOrders}
        onEndReachedThreshold={0.5}
        ListFooterComponent={() => {
          if (loadingMore) {
            return (
              <View style={styles.loadingMoreContainer}>
                <AppText style={styles.loadingMoreText}>{t.customer.orders.loadingMore}</AppText>
              </View>
            );
          }
          if (currentPage >= lastPage && filteredOrders.length > 0) {
            return (
              <View style={styles.endOfListContainer}>
                <AppText style={styles.endOfListText}>{t.customer.orders.noMoreOrders}</AppText>
              </View>
            );
          }
          return null;
        }}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons
              name="receipt-outline"
              size={64}
              color={Colors.text.tertiary}
            />
            <AppText style={styles.emptyTitle}>
              {selectedFilter === "all"
                ? t.customer.orders.emptyTitle
                : t.customer.orders.emptyFilteredTitle.replace("{{status}}", selectedStatus)}
            </AppText>
            <AppText style={styles.emptyText}>
              {selectedFilter === "all"
                ? t.customer.orders.emptyMessage
                : t.customer.orders.emptyFilteredMessage.replace("{{status}}", selectedStatus)}
            </AppText>
            {selectedFilter === "all" && (
              <TouchableOpacity
                style={styles.browseButton}
                onPress={() => router.push("/customer/(tabs)/services")}
              >
                <AppText style={styles.browseButtonText}>{t.customer.orders.browseServices}</AppText>
              </TouchableOpacity>
            )}
          </View>
        }
      />

      {/* Contact Support Modal */}
      <ContactSupportModal
        visible={showContactModal}
        onClose={() => setShowContactModal(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.neutral.gray[50],
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.md,
    backgroundColor: Colors.neutral.white,
  },
  headerTitle: {
    fontSize: Typography.sizes.lg,
    fontWeight: "800",
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },
  headerSubtitle: {
    fontSize: Typography.sizes.xs,
    color: Colors.text.secondary,
  },
  contactButton: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.themes.customer.primary + "15",
    justifyContent: "center",
    alignItems: "center",
  },
  statsContainer: {
    backgroundColor: Colors.neutral.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  statsContent: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    gap: Spacing.xs,
    alignItems: "center",
  },
  statCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.border.light,
  },
  statValue: {
    fontSize: Typography.sizes.sm,
    fontWeight: "800",
    color: Colors.text.primary,
    marginTop: 0,
  },
  statLabel: {
    fontSize: Typography.sizes.xs,
    color: Colors.text.secondary,
    marginTop: 0,
  },
  filterContainer: {
    backgroundColor: Colors.neutral.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
    height: 40,
  },
  filterContent: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    gap: Spacing.xs,
  },
  filterTab: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.neutral.gray[100],
  },
  filterTabActive: {
    backgroundColor: Colors.themes.customer.primary + "15",
  },
  filterTabText: {
    fontSize: Typography.sizes.xs,
    fontWeight: "600",
    color: Colors.text.secondary,
  },
  filterTabTextActive: {
    color: Colors.themes.customer.primary,
  },
  countBadge: {
    marginLeft: Spacing.xs,
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.neutral.gray[200],
    borderWidth: 1,
    borderColor: Colors.border.light,
  },
  countBadgeActive: {
    backgroundColor: Colors.themes.customer.primary + "15",
    borderColor: Colors.themes.customer.primary,
  },
  countText: {
    fontSize: Typography.sizes.xs,
    fontWeight: "700",
    color: Colors.text.secondary,
  },
  countTextActive: {
    color: Colors.themes.customer.primary,
  },
  listContainer: {
    padding: Spacing.sm,
  },
  ordersList: {
    flex: 1,
    paddingHorizontal: Spacing.xs,
  },
  orderCard: {
    backgroundColor: Colors.neutral.white,
    borderRadius: BorderRadius.sm,
    padding: Spacing.sm,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border.light,
  },
  orderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.xs,
  },
  orderNumberContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  orderNumber: {
    fontSize: Typography.sizes.sm,
    fontWeight: "700",
    color: Colors.text.primary,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    paddingHorizontal: Spacing.xs,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  statusText: {
    fontSize: Typography.sizes.xs,
    fontWeight: "600",
    textTransform: "capitalize",
  },
  orderDetails: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginBottom: Spacing.xs,
    paddingVertical: Spacing.xs,
    flexWrap: "wrap",
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  detailText: {
    fontSize: Typography.sizes.xs,
    color: Colors.text.secondary,
  },
  orderFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: Spacing.xs,
    borderTopWidth: 1,
    borderTopColor: Colors.border.light,
  },
  totalLabel: {
    fontSize: Typography.sizes.xs,
    color: Colors.text.tertiary,
    marginBottom: 2,
  },
  totalAmount: {
    fontSize: Typography.sizes.base,
    fontWeight: "800",
    color: Colors.text.primary,
  },
  viewButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  viewButtonText: {
    fontSize: Typography.sizes.xs,
    fontWeight: "600",
    color: Colors.themes.customer.primary,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.xl * 2,
    paddingHorizontal: Spacing.xl,
  },
  emptyTitle: {
    fontSize: Typography.sizes.lg,
    fontWeight: "700",
    color: Colors.text.primary,
    marginTop: Spacing.md,
    marginBottom: Spacing.xs,
  },
  emptyText: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.secondary,
    textAlign: "center",
    marginBottom: Spacing.lg,
  },
  browseButton: {
    backgroundColor: Colors.themes.customer.primary,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  browseButtonText: {
    color: Colors.neutral.white,
    fontSize: Typography.sizes.sm,
    fontWeight: "700",
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },

  loadingMoreContainer: {
    paddingVertical: Spacing.md,
    alignItems: "center",
  },
  loadingMoreText: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.secondary,
  },
  endOfListContainer: {
    paddingVertical: Spacing.md,
    alignItems: "center",
  },
  endOfListText: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.tertiary,
  },
});
