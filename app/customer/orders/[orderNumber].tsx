import AppText from "@/components/common/AppText";
import { localizedAlert } from "@/lib/i18n/localized-alert";
import Loader from "@/components/Loader";
import CancelOrderModal from "@/components/orders/CancelOrderModal";
import ContactSupportModal from "@/components/orders/ContactSupportModal";
import RescheduleModal from "@/components/orders/RescheduleModal";
import ReviewModal from "@/components/orders/ReviewModal";
import Colors from "@/constants/Colors";
import { Spacing } from "@/constants/Styles";
import { WORK_ORDER_URL } from "@/lib/api-endpoints";
import myAxios from "@/lib/axios.config";
import { Order, OrderItem } from "@/types/order";
import { useVoiceCall } from "@/context/VoiceCallContext";
import { useVendorLiveLocation } from "@/hooks/useVendorLiveLocation";
import { Ionicons, FontAwesome } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Image,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import MapView, { Marker, Polyline, PROVIDER_DEFAULT } from "react-native-maps";
import { SafeAreaView } from "react-native-safe-area-context";


export default function OrderDetailsPage() {
  const { orderNumber } = useLocalSearchParams<{ orderNumber: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [reviewPrompted, setReviewPrompted] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const { initiateCall } = useVoiceCall();

  // Subscribe to live vendor location via Reverb when order is in_progress
  // Pass null to skip subscription until we know the order ID
  const isTrackingActive =
    !!order?.id &&
    !!order?.assigned_vendor_id &&
    order?.status === "in_progress";
  const vendorCoords = useVendorLiveLocation(isTrackingActive ? order?.id : null);



  useEffect(() => {
    if (orderNumber) {
      fetchOrderDetails();
    }
  }, [orderNumber]);

  const fetchOrderDetails = async () => {
    try {
      let data = null;
      try {
        const res = await myAxios.get(`${WORK_ORDER_URL}/${orderNumber}`);
        data = res.data?.data;
      } catch (e) {
        // Fallback for numeric ID / order number mismatch
        const res = await myAxios.get(`${WORK_ORDER_URL}?search=${orderNumber}`);
        const items = res.data?.data?.data || res.data?.data || [];
        data = items.find((o: Order) => o.order_number === orderNumber || o.id === Number(orderNumber)) || items[0] || null;
      }

      if (data) {
        setOrder(data);
        if (data.status === "completed" && !data.has_review && !reviewPrompted) {
          setReviewPrompted(true);
          setTimeout(() => setShowReviewModal(true), 500);
        }
      }
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

  const getStatusTheme = (status: string) => {
    switch (status) {
      case "completed":
        return { color: "#059669", bg: "#ECFDF5", icon: "checkmark-circle" as const };
      case "in_progress":
        return { color: "#2563EB", bg: "#EFF6FF", icon: "time" as const };
      case "pending":
        return { color: "#D97706", bg: "#FEF3C7", icon: "hourglass" as const };
      case "cancelled":
        return { color: Colors.error, bg: "#FEF2F2", icon: "close-circle" as const };
      default:
        return { color: Colors.text.secondary, bg: Colors.neutral.gray[100], icon: "information-circle" as const };
    }
  };

  const getStatusStepIndex = (status: string) => {
    if (status === "cancelled") return -1;
    switch (status) {
      case "pending":
        return 0;
      case "in_progress":
        return 1;
      case "completed":
        return 2;
      default:
        return 0;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "pending":
        return "Order Placed";
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
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatTime = (timeString: string) => {
    if (!timeString) return "";
    const [hours, minutes] = timeString.split(":");
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? "PM" : "AM";
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const getPaymentMethodLabel = (method?: string) => {
    switch (method?.toLowerCase()) {
      case "card":
        return "Debit / Credit Card";
      case "wallet":
        return "Tasker Wallet";
      case "online":
        return "Online Bank Transfer";
      default:
        return "Cash on Delivery";
    }
  };

  const handleCancelOrder = async (reason: string) => {
    setCancelling(true);
    try {
      const response = await myAxios.post(
        `${WORK_ORDER_URL}/${orderNumber}/cancel`,
        { reason },
      );
      if (response.data.status === "success") {
        localizedAlert(
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
      localizedAlert(
        "Error",
        error.response?.data?.message || "Failed to cancel order.",
      );
    } finally {
      setCancelling(false);
    }
  };

  const isAssigned = order && order.assigned_vendor_id;

  const canCancelOrder = () => {
    return (
      order && !["completed", "cancelled", "refunded"].includes(order.status)
    );
  };

  if (loading || refreshing) return <Loader fullScreen />;
  if (!order) {
    return (
      <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color={Colors.text.tertiary} />
          <AppText style={styles.errorText}>Order not found</AppText>
          <TouchableOpacity style={styles.backHomeBtn} onPress={() => router.back()}>
            <AppText style={styles.backHomeText}>Go Back</AppText>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const statusTheme = getStatusTheme(order.status);
  const currentStep = getStatusStepIndex(order.status);
  const steps = [
    { label: "Booked", icon: "document-text-outline" },
    { label: "In Progress", icon: "construct-outline" },
    { label: "Completed", icon: "checkmark-circle-outline" },
  ];

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* App Bar */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="chevron-back" size={24} color={Colors.text.primary} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <AppText style={styles.headerTitle}>Order #{order.order_number}</AppText>
          <AppText style={styles.headerSubtitle}>
            {formatDate(order.order_date)}
          </AppText>
        </View>
        <TouchableOpacity
          onPress={() => router.push(`/customer/support-chat?initialWorkOrderId=${order.id}`)}
          style={styles.headerChatButton}
        >
          <Ionicons name="chatbubbles" size={22} color={Colors.themes.customer.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Status Hero Card */}
        <View style={styles.heroCard}>
          <View style={styles.heroTopRow}>
            <View>
              <AppText style={styles.heroLabel}>STATUS</AppText>
              <AppText style={[styles.heroStatusTitle, { color: statusTheme.color }]}>
                {getStatusLabel(order.status)}
              </AppText>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: statusTheme.bg }]}>
              <Ionicons name={statusTheme.icon} size={16} color={statusTheme.color} />
              <AppText style={[styles.statusText, { color: statusTheme.color }]}>
                {order.status.toUpperCase()}
              </AppText>
            </View>
          </View>

          {/* Stepper Timeline (if not cancelled) */}
          {order.status !== "cancelled" && (
            <View style={styles.stepperContainer}>
              {steps.map((step, idx) => {
                const isActive = idx <= currentStep;
                const isCurrent = idx === currentStep;
                return (
                  <React.Fragment key={idx}>
                    <View style={styles.stepItem}>
                      <View
                        style={[
                          styles.stepCircle,
                          isActive && styles.stepCircleActive,
                          isCurrent && styles.stepCircleCurrent,
                        ]}
                      >
                        <Ionicons
                          name={isActive ? "checkmark" : (step.icon as any)}
                          size={14}
                          color={isActive ? Colors.neutral.white : Colors.text.tertiary}
                        />
                      </View>
                      <AppText
                        style={[
                          styles.stepLabel,
                          isActive && styles.stepLabelActive,
                        ]}
                      >
                        {step.label}
                      </AppText>
                    </View>
                    {idx < steps.length - 1 && (
                      <View
                        style={[
                          styles.stepConnector,
                          idx < currentStep && styles.stepConnectorActive,
                        ]}
                      />
                    )}
                  </React.Fragment>
                );
              })}
            </View>
          )}
        </View>

        {/* ── Live Vendor Tracking Card ────────────────────────────────────── */}
        {isTrackingActive && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="navigate" size={18} color="#2563EB" />
              <AppText style={styles.cardTitle}>Technician Live Location</AppText>
              <View style={{ flexDirection: "row", alignItems: "center", marginLeft: "auto", gap: 5 }}>
                <View
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: vendorCoords ? "#10B981" : "#F59E0B",
                  }}
                />
                <AppText style={{ fontSize: 11, color: vendorCoords ? "#10B981" : "#F59E0B", fontWeight: "600" }}>
                  {vendorCoords ? "LIVE" : "WAITING"}
                </AppText>
              </View>
            </View>

            <MapView
              provider={PROVIDER_DEFAULT}
              style={{ width: "100%", height: 200, borderRadius: 10, overflow: "hidden" }}
              initialRegion={{
                latitude: vendorCoords?.lat ?? (order.address?.latitude ? Number(order.address.latitude) : 31.5204),
                longitude: vendorCoords?.lng ?? (order.address?.longitude ? Number(order.address.longitude) : 74.3587),
                latitudeDelta: 0.04,
                longitudeDelta: 0.04,
              }}
              region={
                vendorCoords
                  ? {
                      latitude: (vendorCoords.lat + (order.address?.latitude ? Number(order.address.latitude) : vendorCoords.lat)) / 2,
                      longitude: (vendorCoords.lng + (order.address?.longitude ? Number(order.address.longitude) : vendorCoords.lng)) / 2,
                      latitudeDelta: Math.abs(vendorCoords.lat - (order.address?.latitude ? Number(order.address.latitude) : vendorCoords.lat)) * 2.5 + 0.01,
                      longitudeDelta: Math.abs(vendorCoords.lng - (order.address?.longitude ? Number(order.address.longitude) : vendorCoords.lng)) * 2.5 + 0.01,
                    }
                  : undefined
              }
              scrollEnabled={false}
              zoomEnabled={false}
            >
              {/* Vendor pin */}
              {vendorCoords && (
                <Marker
                  coordinate={{ latitude: vendorCoords.lat, longitude: vendorCoords.lng }}
                  title="Your Technician"
                  description="En route to your location"
                  pinColor="#2563EB"
                />
              )}

              {/* Customer address pin */}
              {order.address?.latitude && order.address?.longitude && (
                <Marker
                  coordinate={{
                    latitude: Number(order.address.latitude),
                    longitude: Number(order.address.longitude),
                  }}
                  title="Your Location"
                  description={order.address.address_line_1}
                  pinColor={Colors.themes.customer.primary}
                />
              )}

              {/* Route line between vendor and customer */}
              {vendorCoords && order.address?.latitude && order.address?.longitude && (
                <Polyline
                  coordinates={[
                    { latitude: vendorCoords.lat, longitude: vendorCoords.lng },
                    { latitude: Number(order.address.latitude), longitude: Number(order.address.longitude) },
                  ]}
                  strokeColor="#2563EB"
                  strokeWidth={2.5}
                  lineDashPattern={[6, 4]}
                />
              )}
            </MapView>

            <AppText style={{ fontSize: 12, color: Colors.text.secondary, marginTop: 8, textAlign: "center" }}>
              {vendorCoords
                ? "🔵 Technician is on the way to your location"
                : "Waiting for technician to share location..."}
            </AppText>
          </View>
        )}

        {/* Services List Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="build-outline" size={18} color={Colors.themes.customer.primary} />
            <AppText style={styles.cardTitle}>Booked Services ({order.items?.length || 0})</AppText>
          </View>


          {order.items?.map((item: OrderItem, index: number) => (
            <View
              key={item.id}
              style={[
                styles.serviceItem,
                index === (order.items?.length || 0) - 1 && { borderBottomWidth: 0 },
              ]}
            >
              <View style={styles.serviceItemHeader}>
                <View style={{ flex: 1 }}>
                  <AppText style={styles.serviceItemName}>
                    {item.parentService?.name || "Service"}
                  </AppText>
                  <AppText style={styles.serviceItemQty}>Quantity: {item.quantity}</AppText>
                </View>
                <AppText style={styles.serviceItemPrice}>
                  ₨{Math.round(item.subtotal)}
                </AppText>
              </View>

              {item.scheduled_date ? (
                <View style={styles.scheduleBadge}>
                  <Ionicons name="calendar-outline" size={12} color={Colors.themes.customer.primary} />
                  <AppText style={styles.scheduleBadgeText}>
                    {formatDate(item.scheduled_date)}
                    {item.scheduled_time ? ` • ${formatTime(item.scheduled_time)}` : ""}
                  </AppText>
                </View>
              ) : null}
            </View>
          ))}
        </View>

        {/* Address Card */}
        {order.address && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="location-outline" size={18} color={Colors.themes.customer.primary} />
              <AppText style={styles.cardTitle}>Service Address</AppText>
            </View>
            <View style={styles.addressBody}>
              <View style={styles.addressBadge}>
                <AppText style={styles.addressBadgeText}>
                  {order.address.address_type.toUpperCase()}
                </AppText>
              </View>
              <AppText style={styles.addressLineBold}>{order.address.address_line_1}</AppText>
              {order.address.address_line_2 ? (
                <AppText style={styles.addressLine}>{order.address.address_line_2}</AppText>
              ) : null}
              <AppText style={styles.addressLine}>
                {order.address.city}, {order.address.state} {order.address.zip_code}
              </AppText>
            </View>
          </View>
        )}

        {/* Notes & Extra Info Card */}
        {(order.notes || order.extra_number || order.reminders) && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="information-circle-outline" size={18} color={Colors.themes.customer.primary} />
              <AppText style={styles.cardTitle}>Booking Details & Instructions</AppText>
            </View>

            {order.extra_number ? (
              <View style={styles.paymentDetailRow}>
                <AppText style={styles.paymentDetailLabel}>Contact Phone</AppText>
                <AppText style={styles.paymentDetailValue}>{order.extra_number}</AppText>
              </View>
            ) : null}

            {order.reminders ? (
              <View style={styles.paymentDetailRow}>
                <AppText style={styles.paymentDetailLabel}>Reminder</AppText>
                <View style={[styles.miniBadge, { backgroundColor: Colors.themes.customer.primary + "15" }]}>
                  <AppText style={[styles.miniBadgeText, { color: Colors.themes.customer.primary }]}>
                    {order.reminders === "1h" ? "1 hour before" : order.reminders === "2h" ? "2 hours before" : order.reminders === "1d" ? "1 day before" : order.reminders}
                  </AppText>
                </View>
              </View>
            ) : null}

            {order.notes ? (
              <View style={{ marginTop: Spacing.xs }}>
                <AppText style={[styles.paymentDetailLabel, { marginBottom: 4 }]}>Notes / Special Instructions</AppText>
                <View style={styles.notesBox}>
                  <AppText style={styles.notesText}>{order.notes}</AppText>
                </View>
              </View>
            ) : null}
          </View>
        )}

        {/* Attachments Card */}
        {order.attachments && order.attachments.length > 0 && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="images-outline" size={18} color={Colors.themes.customer.primary} />
              <AppText style={styles.cardTitle}>Attached Photos ({order.attachments.length})</AppText>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.attachmentList}>
              {order.attachments.map((imgUri, idx) => (
                <TouchableOpacity
                  key={idx}
                  activeOpacity={0.8}
                  onPress={() => setSelectedImage(imgUri)}
                  style={styles.attachmentThumbContainer}
                >
                  <Image source={{ uri: imgUri }} style={styles.attachmentThumb} resizeMode="cover" />
                  <View style={styles.zoomBadge}>
                    <Ionicons name="expand-outline" size={12} color="#FFFFFF" />
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Payment & Summary Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="card-outline" size={18} color={Colors.themes.customer.primary} />
            <AppText style={styles.cardTitle}>Payment Summary</AppText>
          </View>

          <View style={styles.paymentDetailRow}>
            <AppText style={styles.paymentDetailLabel}>Payment Method</AppText>
            <AppText style={styles.paymentDetailValue}>{getPaymentMethodLabel(order.payment_method)}</AppText>
          </View>

          <View style={styles.paymentDetailRow}>
            <AppText style={styles.paymentDetailLabel}>Payment Status</AppText>
            <View style={[styles.miniBadge, { backgroundColor: getStatusTheme(order.payment_status).bg }]}>
              <AppText style={[styles.miniBadgeText, { color: getStatusTheme(order.payment_status).color }]}>
                {order.payment_status.toUpperCase()}
              </AppText>
            </View>
          </View>

          <View style={styles.cardDivider} />

          <View style={styles.paymentDetailRow}>
            <AppText style={styles.totalRowLabel}>Total Amount</AppText>
            <AppText style={styles.totalRowValue}>
              ₨{Math.round(order.total_amount).toLocaleString()}
            </AppText>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsGroup}>
          {order.status !== "completed" && order.status !== "cancelled" && (
            <TouchableOpacity
              style={styles.rescheduleActionBtn}
              onPress={() => setShowRescheduleModal(true)}
            >
              <Ionicons name="calendar-outline" size={18} color={Colors.themes.customer.primary} />
              <AppText style={styles.rescheduleActionText}>Reschedule / Set Reminder</AppText>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.chatActionBtn}
            onPress={() => router.push(`/customer/support-chat?initialWorkOrderId=${order.id}`)}
          >
            <Ionicons name="chatbubbles" size={20} color="#FFFFFF" />
            <AppText style={styles.chatActionText}>Chat with Technician & Support</AppText>
          </TouchableOpacity>

          {order.status !== "cancelled" && (
            <TouchableOpacity
              style={styles.voiceCallActionBtn}
              onPress={() => {
                initiateCall({
                  workOrderId: order.id,
                  receiverName: "Assigned Technician",
                  workOrderNumber: order.order_number,
                });
              }}
              activeOpacity={0.85}
            >
              <Ionicons name="call" size={19} color="#FFFFFF" />
              <AppText style={styles.voiceCallActionText}>Call Service Provider</AppText>
            </TouchableOpacity>
          )}

          {canCancelOrder() && (
            <TouchableOpacity
              style={styles.cancelActionBtn}
              onPress={() => setShowCancelModal(true)}
            >
              <Ionicons name="close-circle-outline" size={18} color={Colors.error} />
              <AppText style={styles.cancelActionText}>Cancel Order</AppText>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      {/* Modals */}
      <RescheduleModal
        visible={showRescheduleModal}
        onClose={() => setShowRescheduleModal(false)}
        orderNumber={orderNumber}
        currentDate={order.items?.[0]?.scheduled_date || undefined}
        currentTime={order.items?.[0]?.scheduled_time || undefined}
        currentReminder={order.reminders || undefined}
        onSuccess={fetchOrderDetails}
      />
      <CancelOrderModal
        visible={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        onConfirm={handleCancelOrder}
        loading={cancelling}
      />
      <ContactSupportModal
        visible={showContactModal}
        onClose={() => setShowContactModal(false)}
      />
      <ReviewModal
        visible={showReviewModal}
        onClose={() => setShowReviewModal(false)}
        onSuccess={fetchOrderDetails}
        orderNumber={orderNumber}
      />

      {/* Attachment Image Fullscreen Preview Modal */}
      <Modal
        visible={!!selectedImage}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedImage(null)}
      >
        <View style={styles.imagePreviewOverlay}>
          <TouchableOpacity
            style={styles.imagePreviewCloseBtn}
            onPress={() => setSelectedImage(null)}
          >
            <Ionicons name="close" size={28} color="#FFFFFF" />
          </TouchableOpacity>
          {selectedImage ? (
            <Image
              source={{ uri: selectedImage }}
              style={styles.fullImagePreview}
              resizeMode="contain"
            />
          ) : null}
        </View>
      </Modal>
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
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.neutral.gray[100],
    justifyContent: "center",
    alignItems: "center",
  },
  headerCenter: {
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.text.primary,
  },
  headerSubtitle: {
    fontSize: 11,
    color: Colors.text.tertiary,
    marginTop: 2,
  },
  headerChatButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#25D36615",
    alignItems: "center",
    justifyContent: "center",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.md,
    gap: Spacing.md,
    paddingBottom: Spacing.xl * 2,
  },
  heroCard: {
    backgroundColor: Colors.neutral.white,
    borderRadius: 16,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border.light,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  heroTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  heroLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: Colors.text.tertiary,
    letterSpacing: 0.8,
  },
  heroStatusTitle: {
    fontSize: 18,
    fontWeight: "800",
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  stepperContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: Spacing.lg,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border.light,
  },
  stepItem: {
    alignItems: "center",
    gap: 4,
  },
  stepCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.neutral.gray[100],
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.border.light,
  },
  stepCircleActive: {
    backgroundColor: Colors.themes.customer.primary,
    borderColor: Colors.themes.customer.primary,
  },
  stepCircleCurrent: {
    elevation: 3,
    shadowColor: Colors.themes.customer.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  stepLabel: {
    fontSize: 11,
    color: Colors.text.tertiary,
    fontWeight: "600",
  },
  stepLabelActive: {
    color: Colors.text.primary,
    fontWeight: "700",
  },
  stepConnector: {
    flex: 1,
    height: 2,
    backgroundColor: Colors.border.light,
    marginBottom: 16,
  },
  stepConnectorActive: {
    backgroundColor: Colors.themes.customer.primary,
  },
  card: {
    backgroundColor: Colors.neutral.white,
    borderRadius: 16,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border.light,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: Spacing.md,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.text.primary,
  },
  serviceItem: {
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  serviceItemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  serviceItemName: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.text.primary,
  },
  serviceItemQty: {
    fontSize: 12,
    color: Colors.text.tertiary,
    marginTop: 2,
  },
  serviceItemPrice: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.text.primary,
  },
  scheduleBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: Colors.themes.customer.primary + "10",
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginTop: Spacing.xs,
  },
  scheduleBadgeText: {
    fontSize: 11,
    color: Colors.themes.customer.primary,
    fontWeight: "600",
  },
  addressBody: {
    gap: 4,
  },
  addressBadge: {
    alignSelf: "flex-start",
    backgroundColor: Colors.neutral.gray[100],
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginBottom: 4,
  },
  addressBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: Colors.text.secondary,
  },
  addressLineBold: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.text.primary,
  },
  addressLine: {
    fontSize: 13,
    color: Colors.text.secondary,
  },
  paymentDetailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginVertical: 4,
  },
  paymentDetailLabel: {
    fontSize: 13,
    color: Colors.text.secondary,
  },
  paymentDetailValue: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.text.primary,
  },
  miniBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  miniBadgeText: {
    fontSize: 10,
    fontWeight: "800",
  },
  cardDivider: {
    height: 1,
    backgroundColor: Colors.border.light,
    marginVertical: Spacing.sm,
  },
  totalRowLabel: {
    fontSize: 14,
    fontWeight: "800",
    color: Colors.text.primary,
  },
  totalRowValue: {
    fontSize: 18,
    fontWeight: "900",
    color: Colors.themes.customer.primary,
  },
  actionsGroup: {
    gap: Spacing.sm,
  },
  rescheduleActionBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.themes.customer.primary + "12",
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.themes.customer.primary + "40",
  },
  rescheduleActionText: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.themes.customer.primary,
  },
  chatActionBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.themes.customer.primary,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
    elevation: 3,
    shadowColor: Colors.themes.customer.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
  },
  chatActionText: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.neutral.white,
  },
  voiceCallActionBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#059669",
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
    elevation: 3,
    shadowColor: "#059669",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
  },
  voiceCallActionText: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.neutral.white,
  },
  cancelActionBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.error + "10",
    paddingVertical: 12,
    borderRadius: 12,
    gap: 6,
    borderWidth: 1,
    borderColor: Colors.error + "40",
  },
  cancelActionText: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.error,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  errorText: {
    fontSize: 16,
    color: Colors.text.secondary,
    fontWeight: "600",
  },
  backHomeBtn: {
    backgroundColor: Colors.themes.customer.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  backHomeText: {
    color: Colors.neutral.white,
    fontWeight: "700",
  },
  notesBox: {
    backgroundColor: Colors.neutral.gray[50],
    padding: Spacing.sm,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border.light,
  },
  notesText: {
    fontSize: 13,
    color: Colors.text.primary,
    lineHeight: 18,
  },
  attachmentList: {
    gap: 10,
    paddingVertical: 4,
  },
  attachmentThumbContainer: {
    position: "relative",
    borderRadius: 10,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: Colors.border.light,
  },
  attachmentThumb: {
    width: 80,
    height: 80,
    borderRadius: 10,
  },
  zoomBadge: {
    position: "absolute",
    bottom: 4,
    right: 4,
    backgroundColor: "rgba(0,0,0,0.6)",
    borderRadius: 10,
    padding: 3,
  },
  imagePreviewOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.92)",
    justifyContent: "center",
    alignItems: "center",
  },
  imagePreviewCloseBtn: {
    position: "absolute",
    top: 50,
    right: 20,
    zIndex: 10,
    padding: 8,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 20,
  },
  fullImagePreview: {
    width: "92%",
    height: "80%",
  },
});
