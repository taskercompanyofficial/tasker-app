import AppText from "@/components/common/AppText";
import type { Address } from "@/components/AddressSelector";
import Colors from "@/constants/Colors";
import { Spacing } from "@/constants/Styles";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface ConfirmOrderModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: () => void;
  processing: boolean;
  totalAmount: number;
  itemsCount: number;
  scheduledDate: Date;
  scheduledTime: Date;
  address: Address | null;
  customerName: string;
  customerPhone: string;
  paymentMethod?: string;
  attachmentsCount?: number;
  notes?: string;
}

export default function ConfirmOrderModal({
  visible,
  onClose,
  onSubmit,
  processing,
  totalAmount,
  itemsCount,
  scheduledDate,
  scheduledTime,
  address,
  customerName,
  customerPhone,
  paymentMethod = "Cash",
  attachmentsCount = 0,
  notes,
}: ConfirmOrderModalProps) {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const isSmallScreen = width < 360;
  const modalMaxWidth = Math.min(width - 32, 440);
  const maxModalHeight = height - (insets.top + insets.bottom + 40);

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

  const getPaymentName = (method?: string) => {
    switch (method?.toLowerCase()) {
      case "card":
        return "Debit / Credit Card";
      case "wallet":
        return "Tasker Wallet";
      case "online":
        return "Online Transfer";
      default:
        return "Cash on Completion";
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
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
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.headerTitleRow}>
                <View style={styles.headerIconBox}>
                  <Ionicons name="clipboard-outline" size={18} color={Colors.themes.customer.primary} />
                </View>
                <View>
                  <AppText style={[styles.title, isSmallScreen && { fontSize: 16 }]}>Review & Confirm</AppText>
                  <AppText style={styles.subtitle}>Check your details before placing order</AppText>
                </View>
              </View>
              <TouchableOpacity
                onPress={onClose}
                disabled={processing}
                style={styles.closeBtn}
                hitSlop={10}
              >
                <Ionicons name="close" size={20} color={Colors.text.secondary} />
              </TouchableOpacity>
            </View>

            {/* Details Box */}
            <View style={styles.detailsContainer}>
              {/* Contact */}
              <View style={styles.detailRow}>
                <View style={styles.detailIconBox}>
                  <Ionicons name="person" size={14} color={Colors.themes.customer.primary} />
                </View>
                <View style={styles.detailTextWrapper}>
                  <AppText style={styles.detailLabel}>CONTACT INFO</AppText>
                  <AppText style={styles.detailValue}>
                    {customerName || "Customer"} • {customerPhone}
                  </AppText>
                </View>
              </View>

              <View style={styles.divider} />

              {/* Address */}
              <View style={styles.detailRow}>
                <View style={styles.detailIconBox}>
                  <Ionicons name="location" size={14} color={Colors.themes.customer.primary} />
                </View>
                <View style={styles.detailTextWrapper}>
                  <AppText style={styles.detailLabel}>SERVICE ADDRESS</AppText>
                  <AppText style={styles.detailValue} numberOfLines={2}>
                    {address?.address_type ? address.address_type.toUpperCase() + " • " : ""}
                    {address?.address_line_1}
                    {address?.city ? `, ${address.city}` : ""}
                  </AppText>
                </View>
              </View>

              <View style={styles.divider} />

              {/* Schedule */}
              <View style={styles.detailRow}>
                <View style={styles.detailIconBox}>
                  <Ionicons name="calendar" size={14} color={Colors.themes.customer.primary} />
                </View>
                <View style={styles.detailTextWrapper}>
                  <AppText style={styles.detailLabel}>APPOINTMENT SCHEDULE</AppText>
                  <AppText style={styles.detailValue}>
                    {formatDate(scheduledDate)} at {formatTime(scheduledTime)}
                  </AppText>
                </View>
              </View>

              <View style={styles.divider} />

              {/* Payment & Attachments */}
              <View style={styles.detailRow}>
                <View style={styles.detailIconBox}>
                  <Ionicons name="wallet" size={14} color={Colors.themes.customer.primary} />
                </View>
                <View style={styles.detailTextWrapper}>
                  <AppText style={styles.detailLabel}>PAYMENT METHOD</AppText>
                  <AppText style={styles.detailValue}>{getPaymentName(paymentMethod)}</AppText>
                  {attachmentsCount > 0 && (
                    <View style={styles.attachmentPill}>
                      <Ionicons name="image" size={12} color={Colors.themes.customer.primary} />
                      <AppText style={styles.attachmentPillText}>
                        {`${attachmentsCount} ${attachmentsCount === 1 ? "photo attachment" : "photo attachments"} included`}
                      </AppText>
                    </View>
                  )}
                </View>
              </View>

              {notes ? (
                <>
                  <View style={styles.divider} />
                  <View style={styles.detailRow}>
                    <View style={styles.detailIconBox}>
                      <Ionicons name="document-text" size={14} color={Colors.themes.customer.primary} />
                    </View>
                    <View style={styles.detailTextWrapper}>
                      <AppText style={styles.detailLabel}>SPECIAL INSTRUCTIONS</AppText>
                      <AppText style={styles.detailValue} numberOfLines={2}>{notes}</AppText>
                    </View>
                  </View>
                </>
              ) : null}

              <View style={styles.divider} />

              {/* Total Row */}
              <View style={styles.totalRow}>
                <View>
                  <AppText style={styles.detailLabel}>ORDER SUMMARY</AppText>
                  <AppText style={styles.itemsSubText}>
                    {`${itemsCount} ${itemsCount === 1 ? "service item" : "service items"}`}
                  </AppText>
                </View>
                <View style={{ alignItems: "flex-end" }}>
                  <AppText style={styles.detailLabel}>ESTIMATED TOTAL</AppText>
                  <AppText style={[styles.totalValue, isSmallScreen && { fontSize: 18 }]}>
                    ₨{Math.round(totalAmount).toLocaleString()}
                  </AppText>
                </View>
              </View>
            </View>

            {/* Buttons */}
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={onClose}
                disabled={processing}
                activeOpacity={0.7}
              >
                <AppText style={styles.cancelButtonText}>Keep Editing</AppText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.submitButton,
                  processing && styles.submitButtonDisabled,
                ]}
                onPress={onSubmit}
                disabled={processing}
                activeOpacity={0.85}
              >
                {processing ? (
                  <ActivityIndicator color={Colors.neutral.white} size="small" />
                ) : (
                  <>
                    <AppText style={styles.submitButtonText}>Confirm & Book</AppText>
                    <Ionicons name="checkmark-circle" size={18} color={Colors.neutral.white} />
                  </>
                )}
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
    backgroundColor: "rgba(15, 23, 42, 0.7)",
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.md,
  },
  container: {
    backgroundColor: Colors.neutral.white,
    borderRadius: 24,
    overflow: "hidden",
    elevation: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
  },
  scrollContent: {
    paddingVertical: Spacing.lg,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  headerTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  headerIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.themes.customer.primary + "15",
    justifyContent: "center",
    alignItems: "center",
  },
  closeBtn: {
    padding: 6,
    borderRadius: 20,
    backgroundColor: "#F1F5F9",
  },
  title: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0F172A",
    letterSpacing: -0.2,
  },
  subtitle: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 1,
  },
  detailsContainer: {
    backgroundColor: "#F8FAFC",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: Spacing.md,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  detailIconBox: {
    width: 26,
    height: 26,
    borderRadius: 7,
    backgroundColor: Colors.themes.customer.primary + "12",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 1,
  },
  detailTextWrapper: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 9,
    color: "#94A3B8",
    textTransform: "uppercase",
    fontWeight: "700",
    letterSpacing: 0.6,
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 13,
    color: "#1E293B",
    fontWeight: "600",
    lineHeight: 18,
  },
  attachmentPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 4,
    backgroundColor: Colors.themes.customer.primary + "12",
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  attachmentPillText: {
    fontSize: 11,
    fontWeight: "700",
    color: Colors.themes.customer.primary,
  },
  divider: {
    height: 1,
    backgroundColor: "#E2E8F0",
    marginVertical: 10,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 2,
  },
  itemsSubText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#475569",
  },
  totalValue: {
    fontSize: 20,
    fontWeight: "900",
    color: Colors.themes.customer.primary,
  },
  buttonContainer: {
    flexDirection: "row",
    gap: 10,
    marginTop: 4,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F1F5F9",
  },
  cancelButtonText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#475569",
  },
  submitButton: {
    flex: 1.6,
    flexDirection: "row",
    paddingVertical: 13,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.themes.customer.primary,
    gap: 6,
    shadowColor: Colors.themes.customer.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 14,
    fontWeight: "800",
    color: Colors.neutral.white,
  },
});
