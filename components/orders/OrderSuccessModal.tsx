import { localizedToast } from "@/lib/i18n/localized-toast";
import AppText from "@/components/common/AppText";
import DirectionalIcon from "@/components/common/DirectionalIcon";
import Colors from "@/constants/Colors";
import { Spacing } from "@/constants/Styles";
import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import * as Sharing from "expo-sharing";
import React, { useRef, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import { captureRef } from "react-native-view-shot";

interface OrderSuccessModalProps {
  visible: boolean;
  onClose: () => void;
  orderNumber: string;
  totalAmount?: number;
  customerName?: string;
  customerPhone?: string;
  addressText?: string;
  scheduledDate?: string;
  scheduledTime?: string;
  paymentMethod?: string | null;
  itemsCount?: number;
}

export default function OrderSuccessModal({
  visible,
  onClose,
  orderNumber,
  totalAmount = 0,
  customerName,
  customerPhone,
  addressText,
  scheduledDate,
  scheduledTime,
  paymentMethod = "Cash",
  itemsCount = 1,
}: OrderSuccessModalProps) {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const receiptRef = useRef<View>(null);
  const [capturing, setCapturing] = useState(false);
  const [copied, setCopied] = useState(false);

  // Responsive calculations
  const isSmallScreen = width < 360;
  const modalMaxWidth = Math.min(width - 32, 440);
  const maxModalHeight = height - (insets.top + insets.bottom + 40);

  const getPaymentMethodDisplay = (method?: string | null) => {
    switch (method?.toLowerCase()) {
      case "card":
        return { name: "Debit / Credit Card", icon: "card-outline" as const };
      case "wallet":
        return { name: "Tasker Wallet", icon: "wallet-outline" as const };
      case "online":
        return { name: "Online Transfer", icon: "globe-outline" as const };
      default:
        return { name: "Cash on Completion", icon: "cash-outline" as const };
    }
  };

  const paymentInfo = getPaymentMethodDisplay(paymentMethod);

  const handleCopyOrderNumber = async () => {
    if (!orderNumber) return;
    try {
      await Clipboard.setStringAsync(orderNumber);
      try {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch {}
      setCopied(true);
      localizedToast({
        type: "success",
        text1: "Copied to Clipboard",
        text2: `Order #${orderNumber} copied successfully`,
        visibilityTime: 2000,
      });
      setTimeout(() => setCopied(false), 2500);
    } catch {
      localizedToast({
        type: "error",
        text1: "Failed to copy",
      });
    }
  };

  const handleViewOrder = () => {
    onClose();
    router.push(`/customer/orders/${orderNumber}`);
  };

  const handleGoHome = () => {
    onClose();
    router.push("/customer/(tabs)/services");
  };

  const handleSaveReceipt = async () => {
    try {
      setCapturing(true);
      if (!receiptRef.current) {
        localizedToast({
          type: "error",
          text1: "Error",
          text2: "Receipt layout not ready",
        });
        return;
      }

      const uri = await captureRef(receiptRef, {
        format: "png",
        quality: 1.0,
        result: "tmpfile",
      });

      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync(uri, {
          dialogTitle: `Booking Receipt - ${orderNumber}`,
          mimeType: "image/png",
          UTI: "public.png",
        });
      } else {
        localizedToast({
          type: "info",
          text1: "Receipt Saved",
          text2: `Saved at ${uri}`,
        });
      }
    } catch (err: any) {
      localizedToast({
        type: "error",
        text1: "Failed to save receipt",
        text2: err?.message || "Something went wrong",
      });
    } finally {
      setCapturing(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <View
          style={[
            styles.container,
            {
              width: modalMaxWidth,
              maxHeight: maxModalHeight,
            },
          ]}
        >
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[
              styles.scrollContent,
              { paddingHorizontal: isSmallScreen ? 14 : 20 },
            ]}
          >
            {/* Captured Ticket Receipt View */}
            <View
              ref={receiptRef}
              collapsable={false}
              style={styles.captureContainer}
            >
              {/* Top Celebration Badge */}
              <View style={styles.heroSection}>
                <View style={styles.badgeGlow}>
                  <View style={styles.iconCircleOuter}>
                    <View style={styles.iconCircleInner}>
                      <Ionicons
                        name="checkmark-sharp"
                        size={isSmallScreen ? 30 : 36}
                        color={Colors.neutral.white}
                      />
                    </View>
                  </View>
                </View>
                <AppText style={[styles.successTitle, isSmallScreen && { fontSize: 20 }]}>
                  Booking Confirmed!
                </AppText>
                <AppText style={styles.successSubtitle}>
                  Your service request has been received & assigned.
                </AppText>
              </View>

              {/* Digital Ticket Card */}
              <View style={styles.ticketCard}>
                {/* Ticket Header */}
                <View style={styles.ticketHeader}>
                  <View style={styles.brandRow}>
                    <View style={styles.brandLogoPlaceholder}>
                      <Ionicons name="construct" size={14} color={Colors.themes.customer.primary} />
                    </View>
                    <AppText style={styles.brandName}>TASKER COMPANY</AppText>
                  </View>
                  <View style={styles.statusPill}>
                    <View style={styles.greenDot} />
                    <AppText style={styles.statusPillText}>CONFIRMED</AppText>
                  </View>
                </View>

                {/* Order Reference Box */}
                <View style={styles.orderRefBox}>
                  <View>
                    <AppText style={styles.orderRefLabel}>ORDER REFERENCE</AppText>
                    <AppText style={[styles.orderRefValue, isSmallScreen && { fontSize: 14 }]}>
                      #{orderNumber || "TC-PENDING"}
                    </AppText>
                  </View>
                  <TouchableOpacity
                    style={[styles.copyButton, copied && styles.copyButtonActive]}
                    onPress={handleCopyOrderNumber}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name={copied ? "checkmark" : "copy-outline"}
                      size={14}
                      color={copied ? "#059669" : Colors.text.secondary}
                    />
                    <AppText
                      style={[styles.copyButtonText, copied && { color: "#059669", fontWeight: "700" }]}
                    >
                      {copied ? "Copied" : "Copy"}
                    </AppText>
                  </TouchableOpacity>
                </View>

                {/* Perforated Divider with Cutouts */}
                <View style={styles.perforatedRow}>
                  <View style={[styles.notch, styles.notchLeft]} />
                  <View style={styles.dashedLine} />
                  <View style={[styles.notch, styles.notchRight]} />
                </View>

                {/* Details Section */}
                <View style={styles.detailsBody}>
                  {/* Customer / Contact */}
                  {(customerName || customerPhone) && (
                    <View style={styles.detailRow}>
                      <View style={styles.detailIconBox}>
                        <Ionicons name="person" size={14} color={Colors.themes.customer.primary} />
                      </View>
                      <View style={styles.detailContent}>
                        <AppText style={styles.detailLabel}>CUSTOMER</AppText>
                        <AppText style={styles.detailText} numberOfLines={1}>
                          {customerName || "Customer"}
                          {customerPhone ? ` • ${customerPhone}` : ""}
                        </AppText>
                      </View>
                    </View>
                  )}

                  {/* Schedule */}
                  {scheduledDate && (
                    <View style={styles.detailRow}>
                      <View style={styles.detailIconBox}>
                        <Ionicons name="calendar" size={14} color={Colors.themes.customer.primary} />
                      </View>
                      <View style={styles.detailContent}>
                        <AppText style={styles.detailLabel}>APPOINTMENT SCHEDULE</AppText>
                        <AppText style={styles.detailText}>
                          {scheduledDate}
                          {scheduledTime ? ` at ${scheduledTime}` : ""}
                        </AppText>
                      </View>
                    </View>
                  )}

                  {/* Service Location */}
                  {addressText && (
                    <View style={styles.detailRow}>
                      <View style={styles.detailIconBox}>
                        <Ionicons name="location" size={14} color={Colors.themes.customer.primary} />
                      </View>
                      <View style={styles.detailContent}>
                        <AppText style={styles.detailLabel}>SERVICE LOCATION</AppText>
                        <AppText style={styles.detailText} numberOfLines={2}>
                          {addressText}
                        </AppText>
                      </View>
                    </View>
                  )}

                  {/* Payment Info */}
                  <View style={styles.detailRow}>
                    <View style={styles.detailIconBox}>
                      <Ionicons name={paymentInfo.icon} size={14} color={Colors.themes.customer.primary} />
                    </View>
                    <View style={styles.detailContent}>
                      <AppText style={styles.detailLabel}>PAYMENT METHOD</AppText>
                      <AppText style={styles.detailText}>
                        {paymentInfo.name}
                      </AppText>
                    </View>
                  </View>
                </View>

                {/* Perforated Divider 2 */}
                <View style={styles.perforatedRow}>
                  <View style={[styles.notch, styles.notchLeft]} />
                  <View style={styles.dashedLine} />
                  <View style={[styles.notch, styles.notchRight]} />
                </View>

                {/* Total Row */}
                <View style={styles.totalRow}>
                  <View>
                    <AppText style={styles.totalLabel}>TOTAL ESTIMATE</AppText>
                    <AppText style={styles.totalSub}>
                      {itemsCount} booked service{itemsCount > 1 ? "s" : ""}
                    </AppText>
                  </View>
                  <AppText style={[styles.totalAmountText, isSmallScreen && { fontSize: 22 }]}>
                    ₨{Math.round(totalAmount).toLocaleString()}
                  </AppText>
                </View>
              </View>
            </View>

            {/* Action Buttons Group */}
            <View style={styles.actionsContainer}>
              {/* Primary: View Order Details */}
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={handleViewOrder}
                activeOpacity={0.85}
              >
                <Ionicons name="receipt-outline" size={18} color={Colors.neutral.white} />
                <AppText style={styles.primaryButtonText}>View Order Details</AppText>
                <DirectionalIcon name="arrow-forward" size={16} color={Colors.neutral.white} />
              </TouchableOpacity>

              {/* Share / Save Receipt */}
              <TouchableOpacity
                style={styles.shareReceiptButton}
                onPress={handleSaveReceipt}
                disabled={capturing}
                activeOpacity={0.8}
              >
                {capturing ? (
                  <ActivityIndicator color={Colors.themes.customer.primary} size="small" />
                ) : (
                  <>
                    <Ionicons
                      name="share-outline"
                      size={18}
                      color={Colors.themes.customer.primary}
                    />
                    <AppText style={styles.shareReceiptText}>Share / Save Receipt</AppText>
                  </>
                )}
              </TouchableOpacity>

              {/* Close Button */}
              <TouchableOpacity
                style={styles.doneButton}
                onPress={handleGoHome}
                activeOpacity={0.7}
              >
                <AppText style={styles.doneButtonText}>Done</AppText>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.72)",
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.md,
  },
  container: {
    backgroundColor: "#F8FAFC",
    borderRadius: 28,
    overflow: "hidden",
    elevation: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
  },
  scrollContent: {
    paddingVertical: Spacing.lg,
    alignItems: "center",
  },
  captureContainer: {
    width: "100%",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
  },
  heroSection: {
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  badgeGlow: {
    padding: 6,
    borderRadius: 44,
    backgroundColor: "#DCFCE7",
    marginBottom: Spacing.xs,
  },
  iconCircleOuter: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#22C55E",
    justifyContent: "center",
    alignItems: "center",
    elevation: 6,
    shadowColor: "#22C55E",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  iconCircleInner: {
    justifyContent: "center",
    alignItems: "center",
  },
  successTitle: {
    fontSize: 22,
    fontWeight: "900",
    color: "#0F172A",
    marginTop: 6,
    textAlign: "center",
    letterSpacing: -0.3,
  },
  successSubtitle: {
    fontSize: 13,
    color: "#64748B",
    textAlign: "center",
    marginTop: 3,
    lineHeight: 18,
    paddingHorizontal: Spacing.sm,
  },
  ticketCard: {
    width: "100%",
    backgroundColor: Colors.neutral.white,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    overflow: "hidden",
    elevation: 3,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
  },
  ticketHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  brandLogoPlaceholder: {
    width: 24,
    height: 24,
    borderRadius: 6,
    backgroundColor: Colors.themes.customer.primary + "15",
    justifyContent: "center",
    alignItems: "center",
  },
  brandName: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.2,
    color: "#334155",
  },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#ECFDF5",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#A7F3D0",
  },
  greenDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#059669",
  },
  statusPillText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#059669",
    letterSpacing: 0.5,
  },
  orderRefBox: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginHorizontal: 16,
    marginBottom: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: "#F1F5F9",
    borderRadius: 12,
  },
  orderRefLabel: {
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.8,
    color: "#64748B",
    marginBottom: 2,
  },
  orderRefValue: {
    fontSize: 16,
    fontWeight: "900",
    color: "#0F172A",
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
  },
  copyButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: Colors.neutral.white,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#CBD5E1",
  },
  copyButtonActive: {
    backgroundColor: "#ECFDF5",
    borderColor: "#A7F3D0",
  },
  copyButtonText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#475569",
  },
  perforatedRow: {
    flexDirection: "row",
    alignItems: "center",
    height: 20,
    position: "relative",
  },
  notch: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "#F8FAFC",
    position: "absolute",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  notchLeft: {
    left: -10,
  },
  notchRight: {
    right: -10,
  },
  dashedLine: {
    flex: 1,
    marginHorizontal: 16,
    height: 1,
    borderStyle: "dashed",
    borderWidth: 1,
    borderColor: "#CBD5E1",
  },
  detailsBody: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  detailIconBox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: Colors.themes.customer.primary + "12",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 1,
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 9,
    fontWeight: "700",
    color: "#94A3B8",
    letterSpacing: 0.6,
    marginBottom: 2,
  },
  detailText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#1E293B",
    lineHeight: 18,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: "#F8FAFC",
  },
  totalLabel: {
    fontSize: 10,
    fontWeight: "800",
    color: "#64748B",
    letterSpacing: 0.8,
  },
  totalSub: {
    fontSize: 11,
    color: "#94A3B8",
    marginTop: 1,
  },
  totalAmountText: {
    fontSize: 24,
    fontWeight: "900",
    color: Colors.themes.customer.primary,
  },
  actionsContainer: {
    width: "100%",
    marginTop: Spacing.md,
    gap: 10,
  },
  primaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.themes.customer.primary,
    paddingVertical: 14,
    borderRadius: 14,
    gap: 8,
    elevation: 4,
    shadowColor: Colors.themes.customer.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 8,
  },
  primaryButtonText: {
    fontSize: 15,
    fontWeight: "800",
    color: Colors.neutral.white,
  },
  shareReceiptButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.themes.customer.primary + "10",
    paddingVertical: 12,
    borderRadius: 14,
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.themes.customer.primary + "30",
  },
  shareReceiptText: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.themes.customer.primary,
  },
  doneButton: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
  },
  doneButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#64748B",
  },
});
