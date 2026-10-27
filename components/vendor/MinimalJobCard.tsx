import React from "react";
import {
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AppText from "@/components/common/AppText";
import { WorkOrder } from "@/types/work-order";

interface MinimalJobCardProps {
  workOrder: WorkOrder;
  tab: "pending" | "active" | "unposted" | "completed";
  onPress: () => void;
  onClaim?: () => void;
  isClaiming?: boolean;
  onCall?: (phone: string, name: string) => void;
  onOpenMap?: (address: string, lat?: number, lng?: number) => void;
  onSubmitBill?: () => void;
}

export default function MinimalJobCard({
  workOrder,
  tab,
  onPress,
  onClaim,
  isClaiming = false,
  onCall,
  onOpenMap,
  onSubmitBill,
}: MinimalJobCardProps) {
  const isUrgent = workOrder.priority === "urgent" || workOrder.priority === "high";

  // Accent color on left border
  const accentColor = isUrgent
    ? "#EF4444"
    : tab === "pending"
    ? "#059669"
    : tab === "active"
    ? "#2563EB"
    : tab === "unposted"
    ? "#D97706"
    : "#10B981";

  // Title
  const serviceTitle =
    workOrder.parent_service?.name ||
    workOrder.service?.name ||
    (workOrder as any).category?.name ||
    "Standard Service";

  // Customer info
  const customerName = workOrder.customer?.name || "Tasker Customer";
  const customerPhone = workOrder.customer?.phone;

  // Address
  const addr1 = workOrder.address?.address_line_1;
  const city = workOrder.address?.city;
  const addressParts = [addr1, city].filter(Boolean);
  const addressText = addressParts.length > 0 ? addressParts.join(" • ") : "Address not specified";

  // Schedule / Slot format
  const formatSlot = () => {
    if (tab === "unposted") {
      return "Work Done • Awaiting Bill";
    }
    if (workOrder.appointment_date) {
      try {
        const d = new Date(workOrder.appointment_date);
        const dateStr = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
        return workOrder.appointment_time ? `${dateStr}, ${workOrder.appointment_time}` : dateStr;
      } catch (_) {
        return workOrder.appointment_date;
      }
    }
    if (tab === "completed" && workOrder.completed_at) {
      try {
        const d = new Date(workOrder.completed_at);
        return `Done ${d.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
      } catch (_) {}
    }
    try {
      const d = new Date(workOrder.created_at);
      return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    } catch (_) {
      return "Today";
    }
  };

  // Payout calculation / display
  const rawPayout =
    (workOrder as any).payout ??
    (workOrder as any).total_amount ??
    (workOrder as any).charges ??
    (workOrder as any).service_charges ??
    (workOrder as any).estimated_charges ??
    (workOrder as any).grand_total;

  const formattedPayout = rawPayout
    ? `₨ ${Number(rawPayout).toLocaleString()}`
    : "₨ 1,500+";

  return (
    <TouchableOpacity
      style={[styles.card, { borderLeftColor: accentColor }]}
      activeOpacity={0.8}
      onPress={onPress}
    >
      {/* Left Info Column */}
      <View style={styles.cardLeft}>
        {/* Line 1: WO Number Tag + Service Name */}
        <View style={styles.titleRow}>
          <View style={styles.woTag}>
            <AppText style={styles.woTagText}>
              #{workOrder.work_order_number ? workOrder.work_order_number.replace(/^#/, "") : workOrder.id}
            </AppText>
          </View>
          <AppText style={styles.serviceTitle} numberOfLines={1}>
            {serviceTitle}
          </AppText>
        </View>

        {/* Line 2: Customer Name + Phone Pill (when active) */}
        <View style={styles.customerRow}>
          <Ionicons name="person" size={11} color="#64748B" />
          <AppText style={styles.customerName} numberOfLines={1}>
            {customerName}
          </AppText>
          {tab === "active" && !!customerPhone && (
            <View style={styles.phonePill}>
              <AppText style={styles.phonePillText}>{customerPhone}</AppText>
            </View>
          )}
        </View>

        {/* Line 3: Address Line */}
        <View style={styles.subRow}>
          <Ionicons name="location-outline" size={11} color="#64748B" />
          <AppText style={styles.subText} numberOfLines={1}>
            {addressText}
          </AppText>
        </View>

        {/* Line 4: Schedule / Slot */}
        <View style={styles.subRow}>
          <Ionicons name="time-outline" size={11} color="#64748B" />
          <AppText style={styles.subText} numberOfLines={1}>
            {formatSlot()}
          </AppText>
        </View>
      </View>

      {/* Right Action Column */}
      <View style={styles.cardRight}>
        <AppText style={styles.payoutText}>{formattedPayout}</AppText>

        {/* Tab-specific contextual action */}
        {tab === "pending" && (
          <TouchableOpacity
            style={styles.claimBtn}
            onPress={onClaim}
            disabled={isClaiming}
            activeOpacity={0.8}
          >
            {isClaiming ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="flash" size={11} color="#FFFFFF" />
                <AppText style={styles.claimBtnText}>Claim</AppText>
              </>
            )}
          </TouchableOpacity>
        )}

        {tab === "active" && (
          <View style={styles.activeActionsRow}>
            {!!customerPhone && (
              <TouchableOpacity
                style={[styles.miniActionBtn, styles.callBtn]}
                onPress={() => onCall?.(customerPhone, customerName)}
                activeOpacity={0.7}
              >
                <Ionicons name="call" size={12} color="#2563EB" />
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[styles.miniActionBtn, styles.mapBtn]}
              onPress={() =>
                onOpenMap?.(
                  addressText,
                  workOrder.address?.latitude,
                  workOrder.address?.longitude
                )
              }
              activeOpacity={0.7}
            >
              <Ionicons name="navigate" size={12} color="#059669" />
            </TouchableOpacity>
          </View>
        )}

        {tab === "unposted" && (
          <TouchableOpacity
            style={styles.unpostedBtn}
            onPress={onSubmitBill}
            activeOpacity={0.8}
          >
            <AppText style={styles.unpostedBtnText}>Submit Bill</AppText>
          </TouchableOpacity>
        )}

        {tab === "completed" && (
          <View style={styles.completedBadge}>
            <Ionicons name="checkmark-circle" size={11} color="#10B981" />
            <AppText style={styles.completedBadgeText}>Done</AppText>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderLeftWidth: 3.5,
    paddingVertical: 9,
    paddingHorizontal: 11,
    marginBottom: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  cardLeft: {
    flex: 1,
    minWidth: 0,
    gap: 2.5,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  woTag: {
    backgroundColor: "#F1F5F9",
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  woTagText: {
    fontSize: 9.5,
    fontWeight: "800",
    color: "#64748B",
  },
  serviceTitle: {
    flex: 1,
    fontSize: 13,
    fontWeight: "800",
    color: "#0F172A",
    letterSpacing: -0.2,
  },
  customerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 1,
  },
  customerName: {
    fontSize: 11.5,
    fontWeight: "700",
    color: "#1E293B",
  },
  phonePill: {
    backgroundColor: "#EFF6FF",
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 1,
    marginLeft: 2,
  },
  phonePillText: {
    fontSize: 9.5,
    fontWeight: "600",
    color: "#2563EB",
  },
  subRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  subText: {
    flex: 1,
    fontSize: 11,
    color: "#64748B",
  },
  cardRight: {
    alignItems: "flex-end",
    justifyContent: "center",
    gap: 5,
    flexShrink: 0,
  },
  payoutText: {
    fontSize: 13.5,
    fontWeight: "800",
    color: "#059669",
    letterSpacing: -0.3,
  },
  claimBtn: {
    backgroundColor: "#059669",
    borderRadius: 999,
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 9,
    paddingVertical: 4.5,
  },
  claimBtnText: {
    fontSize: 10.5,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  activeActionsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  miniActionBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  callBtn: {
    backgroundColor: "#EFF6FF",
  },
  mapBtn: {
    backgroundColor: "#ECFDF5",
  },
  unpostedBtn: {
    backgroundColor: "#D97706",
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  unpostedBtnText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  completedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "#ECFDF5",
    paddingHorizontal: 6,
    paddingVertical: 2.5,
    borderRadius: 999,
  },
  completedBadgeText: {
    fontSize: 9.5,
    fontWeight: "700",
    color: "#10B981",
  },
});
