import AddressSelector from "@/components/AddressSelector";
import OrderSuccessModal from "@/components/orders/OrderSuccessModal";
import Colors from "@/constants/Colors";
import { Spacing } from "@/constants/Styles";
import { useSession } from "@/context/ctx";
import { useCheckout } from "@/hooks/useCheckout";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import React, { useState } from "react";
import {
  Alert,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface CheckoutItem {
  serviceId: number;
  serviceName: string;
  quantity: number;
  price: number;
  discount: number;
  discountType: "percentage" | "fixed";
}

interface CheckoutModalProps {
  visible: boolean;
  onClose: () => void;
  items: CheckoutItem[];
  totalAmount: number;
}

type PaymentMethodId = "cash" | "card" | "wallet";
type IoniconName = keyof typeof Ionicons.glyphMap;

interface WorkOrderItemPayload {
  parent_service_id: number;
  quantity: number;
  unit_price: number;
  discount?: number;
  discount_type?: "percentage" | "fixed";
  scheduled_date?: string;
  scheduled_time?: string;
}

interface CheckoutFormData {
  scheduledDate: Date;
  scheduledTime: Date;
  payment_method: PaymentMethodId;
  notes: string;
  customer_address_id: number | null;
  items: WorkOrderItemPayload[];
}

interface WorkOrderCreateResponse {
  status: "success" | "error";
  message?: string;
  work_order_number?: string;
  data?: {
    work_order_number?: string;
  };
}

const paymentMethods: { id: PaymentMethodId; name: string; icon: IoniconName }[] =
  [
    { id: "cash", name: "Cash", icon: "cash-outline" },
    { id: "card", name: "Card", icon: "card-outline" },
    { id: "wallet", name: "Wallet", icon: "wallet-outline" },
  ];

// Working hours: 9 AM to 6 PM
const WORKING_HOURS_START = 9;
const WORKING_HOURS_END = 18;

export default function CheckoutModal({
  visible,
  onClose,
  items,
  totalAmount,
}: CheckoutModalProps) {
  const insets = useSafeAreaInsets();
  const { session } = useSession();
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [orderNumber, setOrderNumber] = useState("");

  const {
    scheduledDate,
    setScheduledDate,
    scheduledTime,
    setScheduledTime,
    paymentMethod,
    setPaymentMethod,
    notes,
    setNotes,
    addressId,
    setAddressId,
    processing,
    submit,
  } = useCheckout(items);

  const handlePlaceOrder = async () => {
    if (!addressId) {
      Alert.alert("Missing Address", "Please select a service address to continue.");
      return;
    }

    const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
    const formatDateForApi = (date: Date) => {
      const y = date.getFullYear();
      const m = pad(date.getMonth() + 1);
      const d = pad(date.getDate());
      return `${y}-${m}-${d}`;
    };
    const formatTimeForApi = (date: Date) => {
      const h = pad(date.getHours());
      const m = pad(date.getMinutes());
      const s = pad(date.getSeconds());
      return `${h}:${m}:${s}`;
    };

    const result = await submit();
    if (result.ok) {
      setOrderNumber(result.workOrderNumber || "");
      onClose();
      setShowSuccessModal(true);
      return;
    }
    Alert.alert("Error", result.message || "Failed to create order. Please try again.");
  };

  const validateTime = (time: Date): Date => {
    const hour = time.getHours();
    const validatedTime = new Date(time);

    if (hour < WORKING_HOURS_START) {
      validatedTime.setHours(WORKING_HOURS_START, 0, 0, 0);
    } else if (hour >= WORKING_HOURS_END) {
      validatedTime.setHours(WORKING_HOURS_END - 1, 0, 0, 0);
    }

    return validatedTime;
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <>
      <Modal
        visible={visible}
        animationType="slide"
        transparent={true}
        onRequestClose={onClose}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { paddingBottom: Math.max(insets.bottom, 12) }]}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.headerTitle}>Checkout</Text>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Ionicons name="close" size={22} color={Colors.text.primary} />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.scrollView}
              showsVerticalScrollIndicator={false}
            >
              {/* Service Overview */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>
                  Services ({items.length})
                </Text>
                {items.map((item, index) => {
                  const discountedPrice =
                    item.discountType === "percentage"
                      ? item.price * (1 - item.discount / 100)
                      : item.price - item.discount;
                  return (
                    <View key={index} style={styles.serviceItem}>
                      <View style={styles.serviceInfo}>
                        <Text style={styles.serviceName}>
                          {item.serviceName}
                        </Text>
                        <Text style={styles.serviceQuantity}>
                          Qty: {item.quantity}
                        </Text>
                      </View>
                      <Text style={styles.servicePrice}>
                        ₨{Math.round(discountedPrice * item.quantity)}
                      </Text>
                    </View>
                  );
                })}
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>Total</Text>
                  <Text style={styles.totalAmount}>
                    ₨{Math.round(totalAmount)}
                  </Text>
                </View>
              </View>

              {/* Address Selection */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Service Address</Text>
                <AddressSelector
                  selectedAddressId={addressId ?? null}
                  onSelectAddress={(addressId) => setAddressId(addressId)}
                />
              </View>

              {/* Schedule */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Schedule</Text>
                <Text style={styles.workingHoursText}>
                  Working hours: 9:00 AM - 6:00 PM
                </Text>
                <View style={styles.scheduleRow}>
                  <TouchableOpacity
                    style={styles.scheduleButton}
                    onPress={() => setShowDatePicker(true)}
                  >
                    <Ionicons
                      name="calendar"
                      size={18}
                      color={Colors.themes.customer.primary}
                    />
                    <View style={styles.scheduleInfo}>
                      <Text style={styles.scheduleLabel}>Date</Text>
                      <Text style={styles.scheduleValue}>
                        {formatDate(scheduledDate)}
                      </Text>
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.scheduleButton}
                    onPress={() => setShowTimePicker(true)}
                  >
                    <Ionicons
                      name="time"
                      size={18}
                      color={Colors.themes.customer.primary}
                    />
                    <View style={styles.scheduleInfo}>
                      <Text style={styles.scheduleLabel}>Time</Text>
                      <Text style={styles.scheduleValue}>
                        {formatTime(scheduledTime)}
                      </Text>
                    </View>
                  </TouchableOpacity>
                </View>

                {showDatePicker && (
                  <DateTimePicker
                    value={scheduledDate}
                    mode="date"
                    display="default"
                    minimumDate={new Date()}
                    onChange={(event, selectedDate) => {
                      setShowDatePicker(Platform.OS === "ios");
                      if (selectedDate) {
                        setScheduledDate(selectedDate);
                      }
                    }}
                  />
                )}

                {showTimePicker && (
                  <DateTimePicker
                    value={scheduledTime}
                    mode="time"
                    display="default"
                    onChange={(event, selectedTime) => {
                      setShowTimePicker(Platform.OS === "ios");
                      if (selectedTime) {
                        const validatedTime = validateTime(selectedTime);
                        setScheduledTime(validatedTime);
                      }
                    }}
                  />
                )}
              </View>

              {/* Notes */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Notes (Optional)</Text>
                <TextInput
                  style={styles.notesInput}
                  placeholder="Special instructions..."
                  placeholderTextColor={Colors.text.tertiary}
                  multiline
                  numberOfLines={3}
                  value={notes}
                  onChangeText={(text) => setNotes(text)}
                />
              </View>

              {/* Payment Method */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Payment</Text>
                {paymentMethods.map((method) => (
                  <TouchableOpacity
                    key={method.id}
                    style={[
                      styles.paymentCard,
                      paymentMethod === method.id &&
                      styles.paymentCardSelected,
                    ]}
                    onPress={() => setPaymentMethod(method.id)}
                  >
                    <View style={styles.paymentInfo}>
                      <Ionicons
                        name={method.icon}
                        size={20}
                        color={
                          paymentMethod === method.id
                            ? Colors.themes.customer.primary
                            : Colors.text.secondary
                        }
                      />
                      <Text
                        style={[
                          styles.paymentName,
                          paymentMethod === method.id &&
                          styles.paymentNameSelected,
                        ]}
                      >
                        {method.name}
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.radioButton,
                        paymentMethod === method.id &&
                        styles.radioButtonSelected,
                      ]}
                    >
                      {paymentMethod === method.id && (
                        <View style={styles.radioButtonInner} />
                      )}
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            {/* Footer */}
            <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 12) }]}>
              <View style={styles.footerTotal}>
                <Text style={styles.footerTotalLabel}>Total</Text>
                <Text style={styles.footerTotalAmount}>
                  ₨{Math.round(totalAmount)}
                </Text>
              </View>
              <TouchableOpacity
                style={[
                  styles.confirmButton,
                  processing && styles.confirmButtonDisabled,
                ]}
                onPress={handlePlaceOrder}
                disabled={processing || !paymentMethod}
              >
                <Text style={styles.confirmButtonText}>
                  {processing ? "Processing..." : "Confirm Booking"}
                </Text>
                {!processing && (
                  <Ionicons
                    name="checkmark-circle"
                    size={18}
                    color={Colors.neutral.white}
                  />
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Success Modal */}
      <OrderSuccessModal
        visible={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        orderNumber={orderNumber}
      />
    </>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContainer: {
    backgroundColor: Colors.neutral.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "90%",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: Colors.text.primary,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.neutral.gray[100],
    justifyContent: "center",
    alignItems: "center",
  },
  scrollView: {
    maxHeight: "70%",
  },
  section: {
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.text.primary,
    marginBottom: Spacing.sm,
  },
  serviceItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 6,
  },
  serviceInfo: {
    flex: 1,
  },
  serviceName: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.text.primary,
    marginBottom: 2,
  },
  serviceQuantity: {
    fontSize: 11,
    color: Colors.text.secondary,
  },
  servicePrice: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.text.primary,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: Spacing.xs,
    paddingTop: Spacing.xs,
    borderTopWidth: 1,
    borderTopColor: Colors.border.light,
  },
  totalLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.text.primary,
  },
  totalAmount: {
    fontSize: 16,
    fontWeight: "800",
    color: Colors.themes.customer.primary,
  },
  addressCard: {
    backgroundColor: Colors.neutral.gray[50],
    borderRadius: 10,
    padding: Spacing.sm,
    marginBottom: Spacing.xs,
    borderWidth: 2,
    borderColor: "transparent",
  },
  addressCardSelected: {
    borderColor: Colors.themes.customer.primary,
    backgroundColor: Colors.themes.customer.primary + "08",
  },
  addressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  addressLabelContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flex: 1,
  },
  addressLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.text.primary,
  },
  addressLabelSelected: {
    color: Colors.themes.customer.primary,
  },
  addressText: {
    fontSize: 11,
    color: Colors.text.secondary,
    lineHeight: 16,
  },
  radioButton: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: Colors.neutral.gray[300],
    justifyContent: "center",
    alignItems: "center",
  },
  radioButtonSelected: {
    borderColor: Colors.themes.customer.primary,
  },
  radioButtonInner: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: Colors.themes.customer.primary,
  },
  addAddressButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: Spacing.xs,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.themes.customer.primary,
    borderStyle: "dashed",
  },
  addAddressText: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.themes.customer.primary,
  },
  emptyAddressButton: {
    alignItems: "center",
    paddingVertical: Spacing.lg,
    borderRadius: 10,
    backgroundColor: Colors.neutral.gray[50],
    borderWidth: 1,
    borderColor: Colors.border.light,
    borderStyle: "dashed",
  },
  emptyAddressText: {
    fontSize: 12,
    color: Colors.text.secondary,
    marginTop: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  scheduleRow: {
    flexDirection: "row",
    gap: Spacing.xs,
  },
  scheduleButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.neutral.gray[50],
    padding: Spacing.sm,
    borderRadius: 10,
    gap: Spacing.xs,
    borderWidth: 1,
    borderColor: Colors.border.light,
  },
  scheduleInfo: {
    flex: 1,
  },
  scheduleLabel: {
    fontSize: 10,
    color: Colors.text.tertiary,
    marginBottom: 2,
  },
  scheduleValue: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.text.primary,
  },
  workingHoursText: {
    fontSize: 10,
    color: Colors.text.tertiary,
    marginBottom: Spacing.xs,
    fontStyle: "italic",
  },
  notesInput: {
    backgroundColor: Colors.neutral.gray[50],
    borderRadius: 10,
    padding: Spacing.sm,
    fontSize: 12,
    color: Colors.text.primary,
    textAlignVertical: "top",
    borderWidth: 1,
    borderColor: Colors.border.light,
    minHeight: 70,
  },
  paymentCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: Colors.neutral.gray[50],
    borderRadius: 10,
    padding: Spacing.sm,
    marginBottom: Spacing.xs,
    borderWidth: 2,
    borderColor: "transparent",
  },
  paymentCardSelected: {
    borderColor: Colors.themes.customer.primary,
    backgroundColor: Colors.themes.customer.primary + "08",
  },
  paymentInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  paymentName: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.text.primary,
  },
  paymentNameSelected: {
    color: Colors.themes.customer.primary,
  },
  footer: {
    padding: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border.light,
  },
  footerTotal: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  footerTotalLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.text.secondary,
  },
  footerTotalAmount: {
    fontSize: 20,
    fontWeight: "800",
    color: Colors.text.primary,
  },
  confirmButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.themes.customer.primary,
    paddingVertical: 13,
    borderRadius: 10,
    gap: 6,
    shadowColor: Colors.themes.customer.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  confirmButtonDisabled: {
    opacity: 0.6,
  },
  confirmButtonText: {
    color: Colors.neutral.white,
    fontSize: 14,
    fontWeight: "700",
  },
});
