import Colors from "@/constants/Colors";
import { BorderRadius, Shadows, Spacing, Typography } from "@/constants/Styles";
import { WorkOrder } from "@/types/work-order";
import { Ionicons } from "@expo/vector-icons";
import * as Sharing from "expo-sharing";
import { useRef, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Toast from "react-native-toast-message";
import { captureRef } from "react-native-view-shot";

interface WorkOrderShareModalProps {
  visible: boolean;
  onClose: () => void;
  workOrder: WorkOrder;
}

export default function WorkOrderShareModal({
  visible,
  onClose,
  workOrder,
}: WorkOrderShareModalProps) {
  const cardRef = useRef<View>(null);
  const [sharing, setSharing] = useState(false);

  const fullAddress = `${workOrder.address?.address_line_1 || ""}, ${workOrder.address?.city || ""
    }, ${workOrder.address?.state || ""}`.replace(/^,\s*/, "");

  const handleShareCard = async () => {
    if (!cardRef.current) return;
    try {
      setSharing(true);

      const uri = await captureRef(cardRef, {
        format: "png",
        quality: 0.95,
        result: "tmpfile",
      });

      const isAvailable = await Sharing.isAvailableAsync();
      if (!isAvailable) {
        Toast.show({
          type: "error",
          text1: "Sharing Unavailable",
          text2: "Sharing is not supported on this device.",
        });
        setSharing(false);
        return;
      }

      await Sharing.shareAsync(uri, {
        mimeType: "image/png",
        dialogTitle: `Work Order #${workOrder.work_order_number}`,
        UTI: "public.png",
      });

      setSharing(false);
      onClose();
    } catch (err: any) {
      console.error("[Share] Failed to capture or share work order:", err);
      Toast.show({
        type: "error",
        text1: "Failed to Share",
        text2: err?.message || "Could not generate work order image.",
      });
      setSharing(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity
          style={styles.backdropTouch}
          activeOpacity={1}
          onPress={onClose}
        />

        <View style={styles.modalCard}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <View style={styles.headerLeft}>
              <View style={styles.headerIconCircle}>
                <Ionicons
                  name="share-social"
                  size={20}
                  color={Colors.themes.provider.primary}
                />
              </View>
              <View>
                <Text style={styles.headerTitle}>Share Work Order</Text>
                <Text style={styles.headerSubtitle}>
                  Generates an official complaint voucher image
                </Text>
              </View>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Ionicons name="close" size={20} color={Colors.text.primary} />
            </TouchableOpacity>
          </View>

          {/* Scrollable Receipt Preview Card (Captured by ViewShot) */}
          <ScrollView
            style={styles.previewScroll}
            contentContainerStyle={styles.previewScrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View ref={cardRef} style={styles.shareVoucherCard} collapsable={false}>
              {/* Card Header Branding */}
              <View style={styles.voucherHeader}>
                <View style={styles.voucherBrandRow}>
                  <View style={styles.voucherBrandDot} />
                  <Text style={styles.voucherBrandTitle}>TASKER SERVICE PROVIDER</Text>
                </View>
                <View style={styles.voucherStatusChip}>
                  <Text style={styles.voucherStatusChipText}>
                    {workOrder.status?.name?.toUpperCase() || "JOB ORDER"}
                  </Text>
                </View>
              </View>

              <Text style={styles.voucherWorkOrderNo}>
                WO #{workOrder.work_order_number}
              </Text>
              <Text style={styles.voucherDateText}>
                Date: {workOrder.created_at ? new Date(workOrder.created_at).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }) : "N/A"}
              </Text>

              <View style={styles.dividerLine} />

              {/* Service & Category Details */}
              <View style={styles.detailSection}>
                <Text style={styles.sectionHeaderTitle}>SERVICE DETAILS</Text>
                <View style={styles.kvRow}>
                  <Text style={styles.kLabel}>Service:</Text>
                  <Text style={styles.vVal}>{workOrder.service?.name || "N/A"}</Text>
                </View>
                {workOrder.parent_service?.name ? (
                  <View style={styles.kvRow}>
                    <Text style={styles.kLabel}>Category:</Text>
                    <Text style={styles.vVal}>{workOrder.parent_service.name}</Text>
                  </View>
                ) : null}
                <View style={styles.kvRow}>
                  <Text style={styles.kLabel}>Priority:</Text>
                  <Text style={[styles.vVal, { color: Colors.error, fontWeight: "700" }]}>
                    {workOrder.priority?.toUpperCase() || "NORMAL"}
                  </Text>
                </View>
              </View>

              {/* Customer Details */}
              <View style={styles.detailSection}>
                <Text style={styles.sectionHeaderTitle}>CUSTOMER & LOCATION</Text>
                <View style={styles.kvRow}>
                  <Text style={styles.kLabel}>Customer:</Text>
                  <Text style={styles.vVal}>{workOrder.customer?.name || "N/A"}</Text>
                </View>
                <View style={styles.kvRow}>
                  <Text style={styles.kLabel}>Mobile:</Text>
                  <Text style={styles.vVal}>{workOrder.customer?.phone || "N/A"}</Text>
                </View>
                <View style={styles.kvRow}>
                  <Text style={styles.kLabel}>Address:</Text>
                  <Text style={[styles.vVal, { flex: 1 }]}>{fullAddress}</Text>
                </View>
              </View>

              {/* Product & Complaint Info */}
              {(workOrder.brand?.name || workOrder.product?.name || workOrder.customer_description) && (
                <View style={styles.detailSection}>
                  <Text style={styles.sectionHeaderTitle}>PRODUCT & COMPLAINT</Text>
                  {workOrder.brand?.name ? (
                    <View style={styles.kvRow}>
                      <Text style={styles.kLabel}>Brand:</Text>
                      <Text style={styles.vVal}>{workOrder.brand.name}</Text>
                    </View>
                  ) : null}
                  {workOrder.product?.name ? (
                    <View style={styles.kvRow}>
                      <Text style={styles.kLabel}>Model:</Text>
                      <Text style={styles.vVal}>{workOrder.product.name}</Text>
                    </View>
                  ) : null}
                  {workOrder.is_warranty_case ? (
                    <View style={styles.kvRow}>
                      <Text style={styles.kLabel}>Warranty:</Text>
                      <Text style={[styles.vVal, { color: "#10B981", fontWeight: "700" }]}>
                        Warranty Case ({workOrder.warrentyStatus || "Active"})
                      </Text>
                    </View>
                  ) : null}
                  {workOrder.customer_description ? (
                    <View style={{ marginTop: 4 }}>
                      <Text style={styles.kLabel}>Problem Description:</Text>
                      <Text style={styles.complaintDescText}>
                        {workOrder.customer_description}
                      </Text>
                    </View>
                  ) : null}
                </View>
              )}

              {/* Footer Stamp */}
              <View style={styles.voucherFooter}>
                <Ionicons name="checkmark" size={16} color={Colors.themes.provider.primary} />
                <Text style={styles.voucherFooterText}>
                  Verified Tasker Service Provider Complaint Document
                </Text>
              </View>
            </View>
          </ScrollView>

          {/* Share Action Button */}
          <TouchableOpacity
            style={styles.shareBtn}
            onPress={handleShareCard}
            disabled={sharing}
            activeOpacity={0.85}
          >
            {sharing ? (
              <ActivityIndicator color={Colors.neutral.white} />
            ) : (
              <>
                <Ionicons name="share" size={18} color={Colors.neutral.white} />
                <Text style={styles.shareBtnText}>Share Work Order Voucher</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.6)",
    justifyContent: "flex-end",
  },
  backdropTouch: {
    flex: 1,
  },
  modalCard: {
    backgroundColor: Colors.neutral.white,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    padding: Spacing.lg,
    maxHeight: "85%",
    gap: Spacing.md,
    ...Shadows.md,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  headerIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.themes.provider.primary + "15",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.bold,
    color: Colors.text.primary,
  },
  headerSubtitle: {
    fontSize: Typography.sizes.xs,
    color: Colors.text.secondary,
    marginTop: 1,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.neutral.gray[100],
    justifyContent: "center",
    alignItems: "center",
  },
  previewScroll: {
    maxHeight: 420,
  },
  previewScrollContent: {
    paddingVertical: 4,
  },
  shareVoucherCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: BorderRadius.lg,
    borderWidth: 2,
    borderColor: Colors.themes.provider.primary + "30",
    padding: Spacing.lg,
    gap: Spacing.sm,
    ...Shadows.sm,
  },
  voucherHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  voucherBrandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  voucherBrandDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.themes.provider.primary,
  },
  voucherBrandTitle: {
    fontSize: 10,
    fontWeight: "800",
    color: Colors.themes.provider.primary,
    letterSpacing: 0.8,
  },
  voucherStatusChip: {
    backgroundColor: Colors.themes.provider.primary + "15",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  voucherStatusChipText: {
    fontSize: 10,
    fontWeight: "800",
    color: Colors.themes.provider.primary,
  },
  voucherWorkOrderNo: {
    fontSize: 22,
    fontWeight: "800",
    color: Colors.text.primary,
    marginTop: 4,
  },
  voucherDateText: {
    fontSize: 11,
    color: Colors.text.tertiary,
    fontWeight: "500",
  },
  dividerLine: {
    height: 1,
    backgroundColor: Colors.neutral.gray[200],
    marginVertical: 4,
  },
  detailSection: {
    gap: 4,
  },
  sectionHeaderTitle: {
    fontSize: 10,
    fontWeight: "800",
    color: Colors.text.tertiary,
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  kvRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 8,
  },
  kLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.text.secondary,
  },
  vVal: {
    fontSize: 12,
    fontWeight: "700",
    color: Colors.text.primary,
    textAlign: "right",
  },
  complaintDescText: {
    fontSize: 12,
    color: Colors.text.primary,
    backgroundColor: Colors.neutral.gray[50],
    padding: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors.neutral.gray[200],
    marginTop: 4,
    lineHeight: 18,
  },
  voucherFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: Spacing.xs,
    paddingTop: Spacing.xs,
    borderTopWidth: 1,
    borderTopColor: Colors.neutral.gray[100],
  },
  voucherFooterText: {
    fontSize: 10,
    fontWeight: "700",
    color: Colors.text.tertiary,
  },
  shareBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.themes.provider.primary,
    paddingVertical: 14,
    borderRadius: BorderRadius.md,
    gap: 8,
    ...Shadows.sm,
  },
  shareBtnText: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.bold,
    color: Colors.neutral.white,
  },
});
