import Loader from "@/components/Loader";
import CancelOrderModal from "@/components/orders/CancelOrderModal";
import ContactSupportModal from "@/components/orders/ContactSupportModal";
import Colors from "@/constants/Colors";
import { Spacing } from "@/constants/Styles";
import { ORDER_URL } from "@/lib/api-endpoints";
import myAxios from "@/lib/axios.config";
import { Order, OrderItem } from "@/types/order";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function OrderDetailsPage() {
  const { orderNumber } = useLocalSearchParams<{ orderNumber: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);

  useEffect(() => {
    if (orderNumber) {
      fetchOrderDetails();
    }
  }, [orderNumber]);

  const fetchOrderDetails = async () => {
    try {
      const res = await myAxios.get(`${ORDER_URL}/${orderNumber}`);
      setOrder(res.data.data);
    } catch (error) {
      console.error("Failed to fetch order details:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchOrderDetails();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "#10B981";
      case "in_progress":
        return "#3B82F6";
      case "pending":
        return "#F59E0B";
      case "scheduled":
        return "#8B5CF6";
      case "cancelled":
        return Colors.error;
      default:
        return Colors.text.secondary;
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

  const formatTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(":");
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? "PM" : "AM";
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const handleCancelOrder = async (reason: string) => {
    setCancelling(true);
    try {
      const response = await myAxios.post(
        `${ORDER_URL}/${orderNumber}/cancel`,
        { reason },
      );

      if (response.data.status === "success") {
        Alert.alert(
          "Order Cancelled",
          "Your order has been cancelled successfully.",
          [
            {
              text: "OK",
              onPress: () => {
                setShowCancelModal(false);
                fetchOrderDetails();
              },
            },
          ],
        );
      }
    } catch (error: any) {
      Alert.alert(
        "Error",
        error.response?.data?.message ||
          "Failed to cancel order. Please try again.",
      );
    } finally {
      setCancelling(false);
    }
  };

  const canCancelOrder = () => {
    return (
      order && !["completed", "cancelled", "refunded"].includes(order.status)
    );
  };

  if (loading || refreshing) {
    return <Loader fullScreen />;
  }

  if (!order) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Order not found</Text>
        </View>
      </SafeAreaView>
    );
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
        <Text style={styles.headerTitle}>Order Details</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Order Status Card */}
        <View style={styles.statusCard}>
          <View style={styles.statusHeader}>
            <View>
              <Text style={styles.orderNumberLabel}>Order Number</Text>
              <Text style={styles.orderNumber}>{order.order_number}</Text>
            </View>
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: getStatusColor(order.status) + "15" },
              ]}
            >
              <Text
                style={[
                  styles.statusText,
                  { color: getStatusColor(order.status) },
                ]}
              >
                {order.status.replace("_", " ")}
              </Text>
            </View>
          </View>
          <View style={styles.dateRow}>
            <Ionicons
              name="calendar-outline"
              size={16}
              color={Colors.text.tertiary}
            />
            <Text style={styles.dateText}>
              Placed on {formatDate(order.order_date)}
            </Text>
          </View>
        </View>

        {/* Service Items */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Services ({order.items?.length || 0})
          </Text>
          {order.items?.map((item: OrderItem, index: number) => (
            <View key={item.id} style={styles.serviceCard}>
              <View style={styles.serviceHeader}>
                <View style={styles.serviceInfo}>
                  <Text style={styles.serviceName}>
                    {item.parentService?.name || "Service"}
                  </Text>
                  <Text style={styles.serviceQuantity}>
                    Quantity: {item.quantity}
                  </Text>
                </View>
                <View
                  style={[
                    styles.itemStatusBadge,
                    { backgroundColor: getStatusColor(item.status) + "15" },
                  ]}
                >
                  <Text
                    style={[
                      styles.itemStatusText,
                      { color: getStatusColor(item.status) },
                    ]}
                  >
                    {item.status}
                  </Text>
                </View>
              </View>

              <View style={styles.scheduleRow}>
                <Ionicons
                  name="time-outline"
                  size={14}
                  color={Colors.text.tertiary}
                />
                <Text style={styles.scheduleText}>
                  {formatDate(item.scheduled_date)} at{" "}
                  {formatTime(item.scheduled_time)}
                </Text>
              </View>

              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>Subtotal</Text>
                <Text style={styles.priceValue}>
                  ₨{Math.round(item.subtotal)}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* Address */}
        {order.address && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Service Address</Text>
            <View style={styles.addressCard}>
              <View style={styles.addressHeader}>
                <Ionicons
                  name={
                    order.address.address_type === "home" ? "home" : "briefcase"
                  }
                  size={20}
                  color={Colors.themes.customer.primary}
                />
                <Text style={styles.addressType}>
                  {order.address.address_type.charAt(0).toUpperCase() +
                    order.address.address_type.slice(1)}
                </Text>
              </View>
              <Text style={styles.addressText}>
                {order.address.address_line_1}
              </Text>
              <Text style={styles.addressText}>
                {order.address.city}, {order.address.state}{" "}
                {order.address.zip_code}
              </Text>
            </View>
          </View>
        )}

        {/* Payment Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Details</Text>
          <View style={styles.paymentCard}>
            <View style={styles.paymentRow}>
              <Text style={styles.paymentLabel}>Payment Method</Text>
              <Text style={styles.paymentValue}>
                {order.payment_method.charAt(0).toUpperCase() +
                  order.payment_method.slice(1)}
              </Text>
            </View>
            <View style={styles.paymentRow}>
              <Text style={styles.paymentLabel}>Payment Status</Text>
              <Text
                style={[
                  styles.paymentValue,
                  { color: getStatusColor(order.payment_status) },
                ]}
              >
                {order.payment_status.replace("_", " ")}
              </Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.paymentRow}>
              <Text style={styles.totalLabel}>Total Amount</Text>
              <Text style={styles.totalValue}>
                ₨{Math.round(order.total_amount)}
              </Text>
            </View>
          </View>
        </View>

        {/* Notes */}
        {order.notes && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Notes</Text>
            <View style={styles.notesCard}>
              <Text style={styles.notesText}>{order.notes}</Text>
            </View>
          </View>
        )}

        {/* Action Buttons */}
        {canCancelOrder() && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Actions</Text>
            <View style={styles.actionsContainer}>
              <TouchableOpacity
                style={styles.cancelOrderButton}
                onPress={() => setShowCancelModal(true)}
              >
                <Ionicons
                  name="close-circle-outline"
                  size={20}
                  color={Colors.error}
                />
                <Text style={styles.cancelOrderButtonText}>Cancel Order</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.supportButton}
                onPress={() => setShowContactModal(true)}
              >
                <Ionicons
                  name="chatbubble-outline"
                  size={20}
                  color={Colors.themes.customer.primary}
                />
                <Text style={styles.supportButtonText}>Contact Support</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        <View style={{ height: 20 }} />
      </ScrollView>

      {/* Cancel Order Modal */}
      <CancelOrderModal
        visible={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        onConfirm={handleCancelOrder}
        loading={cancelling}
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
  scrollView: {
    flex: 1,
  },
  statusCard: {
    backgroundColor: Colors.neutral.white,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  statusHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: Spacing.sm,
  },
  orderNumberLabel: {
    fontSize: 11,
    color: Colors.text.tertiary,
    marginBottom: 4,
  },
  orderNumber: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.text.primary,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
    textTransform: "capitalize",
  },
  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  dateText: {
    fontSize: 13,
    color: Colors.text.secondary,
  },
  section: {
    backgroundColor: Colors.neutral.white,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.text.primary,
    marginBottom: Spacing.sm,
  },
  serviceCard: {
    backgroundColor: Colors.neutral.gray[50],
    borderRadius: 10,
    padding: Spacing.sm,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border.light,
  },
  serviceHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: Spacing.xs,
  },
  serviceInfo: {
    flex: 1,
  },
  serviceName: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.text.primary,
    marginBottom: 2,
  },
  serviceQuantity: {
    fontSize: 12,
    color: Colors.text.secondary,
  },
  itemStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  itemStatusText: {
    fontSize: 10,
    fontWeight: "600",
    textTransform: "capitalize",
  },
  scheduleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: Spacing.xs,
  },
  scheduleText: {
    fontSize: 12,
    color: Colors.text.secondary,
  },
  priceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: Spacing.xs,
    borderTopWidth: 1,
    borderTopColor: Colors.border.light,
  },
  priceLabel: {
    fontSize: 12,
    color: Colors.text.tertiary,
  },
  priceValue: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.text.primary,
  },
  addressCard: {
    backgroundColor: Colors.neutral.gray[50],
    borderRadius: 10,
    padding: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border.light,
  },
  addressHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: Spacing.xs,
  },
  addressType: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.text.primary,
  },
  addressText: {
    fontSize: 13,
    color: Colors.text.secondary,
    lineHeight: 18,
  },
  paymentCard: {
    backgroundColor: Colors.neutral.gray[50],
    borderRadius: 10,
    padding: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border.light,
  },
  paymentRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.xs,
  },
  paymentLabel: {
    fontSize: 13,
    color: Colors.text.secondary,
  },
  paymentValue: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.text.primary,
    textTransform: "capitalize",
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border.light,
    marginVertical: Spacing.xs,
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.text.primary,
  },
  totalValue: {
    fontSize: 18,
    fontWeight: "800",
    color: Colors.themes.customer.primary,
  },
  notesCard: {
    backgroundColor: Colors.neutral.gray[50],
    borderRadius: 10,
    padding: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border.light,
  },
  notesText: {
    fontSize: 13,
    color: Colors.text.secondary,
    lineHeight: 18,
  },
  actionsContainer: {
    gap: Spacing.sm,
  },
  cancelOrderButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Colors.error + "10",
    paddingVertical: 13,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.error,
  },
  cancelOrderButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.error,
  },
  supportButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Colors.neutral.gray[50],
    paddingVertical: 13,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border.light,
  },
  supportButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.themes.customer.primary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    fontSize: 16,
    color: Colors.text.secondary,
  },
});
