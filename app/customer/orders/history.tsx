import Loader from "@/components/Loader";
import Colors from "@/constants/Colors";
import { Spacing } from "@/constants/Styles";
import { ORDER_URL } from "@/lib/api-endpoints";
import myAxios from "@/lib/axios.config";
import { Order } from "@/types/order";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function OrderHistoryPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const res = await myAxios.get(`${ORDER_URL}/my-orders`);
      const allOrders = res.data.data.data || [];
      // Filter only completed and cancelled orders for history
      const historyOrders = allOrders.filter((order: Order) =>
        ["completed", "cancelled", "refunded"].includes(order.status),
      );
      setOrders(historyOrders);
    } catch (error) {
      console.error("Failed to fetch order history:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchOrders();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "#10B981";
      case "cancelled":
        return "#EF4444";
      case "refunded":
        return "#6B7280";
      default:
        return Colors.text.secondary;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return "checkmark-circle";
      case "cancelled":
        return "close-circle";
      case "refunded":
        return "arrow-undo";
      default:
        return "ellipse";
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const renderOrderCard = ({ item }: { item: Order }) => (
    <TouchableOpacity
      style={styles.orderCard}
      onPress={() => router.push(`/customer/orders/${item.order_number}`)}
      activeOpacity={0.7}
    >
      <View style={styles.orderHeader}>
        <View style={styles.orderInfo}>
          <Text style={styles.orderNumber}>{item.order_number}</Text>
          <Text style={styles.orderDate}>{formatDate(item.order_date)}</Text>
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
          <Text
            style={[styles.statusText, { color: getStatusColor(item.status) }]}
          >
            {item.status}
          </Text>
        </View>
      </View>

      <View style={styles.orderDetails}>
        <Text style={styles.servicesCount}>
          {item.items?.length || 0} service(s)
        </Text>
        <Text style={styles.totalAmount}>₨{Math.round(item.total_amount)}</Text>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return <Loader fullScreen />;
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={Colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Order History</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Orders List */}
      <FlatList
        data={orders}
        renderItem={renderOrderCard}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons
              name="time-outline"
              size={64}
              color={Colors.text.tertiary}
            />
            <Text style={styles.emptyTitle}>No Order History</Text>
            <Text style={styles.emptyText}>
              Your completed and cancelled orders will appear here.
            </Text>
          </View>
        }
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
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.neutral.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.neutral.gray[100],
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.text.primary,
  },
  placeholder: {
    width: 40,
  },
  listContainer: {
    padding: Spacing.md,
  },
  orderCard: {
    backgroundColor: Colors.neutral.white,
    borderRadius: 10,
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
  orderInfo: {
    flex: 1,
  },
  orderNumber: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.text.primary,
    marginBottom: 2,
  },
  orderDate: {
    fontSize: 11,
    color: Colors.text.tertiary,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  statusText: {
    fontSize: 10,
    fontWeight: "600",
    textTransform: "capitalize",
  },
  orderDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: Spacing.xs,
    borderTopWidth: 1,
    borderTopColor: Colors.border.light,
  },
  servicesCount: {
    fontSize: 11,
    color: Colors.text.secondary,
  },
  totalAmount: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.text.primary,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    paddingHorizontal: Spacing.xl,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.text.primary,
    marginTop: Spacing.md,
    marginBottom: Spacing.xs,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.text.secondary,
    textAlign: "center",
  },
});
