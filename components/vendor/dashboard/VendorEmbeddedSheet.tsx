import React from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AppText from "@/components/common/AppText";

interface VendorTransaction {
  id: string | number;
  type?: "credit" | "debit";
  title?: string;
  date?: string;
  amount: number;
  category?: string;
  status?: string;
  work_order_number?: string;
}

interface VendorEmbeddedSheetProps {
  activeTabIndex: number; // 0 = Daily Share, 1 = Monthly Payouts
  showNoticeBanner: boolean;
  onCloseNoticeBanner: () => void;
  dueTodayPayable: number;
  transactions: VendorTransaction[];
  todayEarnings: number;
  monthlyAccrued: number;
  isLocked?: boolean;
  overdueAmount?: number;
  onNavigate: (route: string) => void;
  isOnline?: boolean;
}

export default function VendorEmbeddedSheet({
  activeTabIndex,
  showNoticeBanner,
  onCloseNoticeBanner,
  dueTodayPayable,
  transactions = [],
  todayEarnings,
  monthlyAccrued,
  isLocked = false,
  overdueAmount = 0,
  onNavigate,
  isOnline = false,
}: VendorEmbeddedSheetProps) {
  const isDaily = activeTabIndex === 0;
  const isDue = isDaily && (dueTodayPayable > 0 || isLocked);

  // Filter transactions based on active tab
  const todayDateStr = new Date().toISOString().split("T")[0];

  const dailyTransactions = transactions.filter(
    (t) => t.date && t.date.startsWith(todayDateStr)
  );

  const displayList = isDaily
    ? dailyTransactions.length > 0
      ? dailyTransactions
      : transactions.slice(0, 4) // Fallback to recent transactions if none today
    : transactions.filter((t) => t.type === "credit" || t.category === "warranty").slice(0, 5);

  const formatTimeOrDate = (dateStr?: string) => {
    if (!dateStr) return "Today";
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } catch {
      return dateStr;
    }
  };

  return (
    <View
      style={[
        styles.embeddedSheetContainer,
        { paddingBottom: isOnline ? 80 : 130 },
      ]}
    >
      {/* ─── 1. STATUS & SETTLEMENT BANNER / COMPACT WARNING ─── */}
      {isLocked ? (
        <View style={styles.compactWarningCard}>
          <View style={styles.compactWarningLeft}>
            <Ionicons name="alert-circle" size={18} color="#DC2626" />
            <AppText style={styles.compactWarningText}>
              Dues pending · No new job will be assigned until you pay
            </AppText>
          </View>
          <TouchableOpacity
            style={styles.compactSettleBtn}
            onPress={() => onNavigate("/vendor/quick-pay")}
            activeOpacity={0.8}
          >
            <AppText style={styles.compactSettleBtnText}>Pay Now</AppText>
          </TouchableOpacity>
        </View>
      ) : showNoticeBanner ? (
        <View
          style={[
            styles.bannerCard,
            isDue
              ? styles.bannerCardDue
              : isDaily
                ? styles.bannerCardCleared
                : styles.bannerCardMonthly,
          ]}
        >
          <TouchableOpacity
            style={styles.bannerCloseBtn}
            onPress={onCloseNoticeBanner}
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="close" size={15} color="#64748B" />
          </TouchableOpacity>

          <View style={styles.bannerContent}>
            <View style={{ flex: 1, paddingRight: 10 }}>
              <AppText style={styles.bannerTitle}>
                {isDaily
                  ? isDue
                    ? "Daily 35% Cut Due Tonight"
                    : "Settlement Cleared ✨"
                  : "Monthly Payout Window (1st–5th)"}
              </AppText>
              <AppText style={styles.bannerSubtitle}>
                {isDaily
                  ? isDue
                    ? `PKR ${dueTodayPayable.toLocaleString()} cash split required before 12:00 AM midnight.`
                    : "Your account is fully cleared for instant customer dispatches."
                  : "100% full company payout for warranty & free jobs — zero platform deductions."}
              </AppText>
            </View>

            {isDue ? (
              <TouchableOpacity
                style={styles.settleBtn}
                activeOpacity={0.85}
                onPress={() => onNavigate("/vendor/quick-pay")}
              >
                <AppText style={styles.settleBtnText}>Settle Now</AppText>
              </TouchableOpacity>
            ) : (
              <View
                style={[
                  styles.badgeBox,
                  isDaily ? styles.badgeBoxGreen : styles.badgeBoxBlue,
                ]}
              >
                <Ionicons
                  name={isDaily ? "shield-checkmark" : "calendar-outline"}
                  size={20}
                  color={isDaily ? "#059669" : "#2563EB"}
                />
                <AppText
                  style={[
                    styles.badgeText,
                    { color: isDaily ? "#059669" : "#2563EB" },
                  ]}
                >
                  {isDaily ? "Active" : "1st–5th"}
                </AppText>
              </View>
            )}
          </View>
        </View>
      ) : null}

      {/* ─── 2. UTILITY ACTION CHIPS (Vertical Icon-on-Top Layout — Zero Overflow) ─── */}
      <View style={styles.utilityChipsRow}>
        <TouchableOpacity
          style={styles.utilityChip}
          activeOpacity={0.75}
          onPress={() => onNavigate("/vendor/(tabs)/ledger")}
        >
          <View style={[styles.chipIconWrap, { backgroundColor: "#FEF3C7" }]}>
            <Ionicons name="receipt-outline" size={18} color="#D97706" />
          </View>
          <AppText
            style={styles.chipLabel}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.8}
          >
            Daily Ledger
          </AppText>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.utilityChip}
          activeOpacity={0.75}
          onPress={() => onNavigate("/vendor/staff")}
        >
          <View style={[styles.chipIconWrap, { backgroundColor: "#FAF5FF" }]}>
            <Ionicons name="people-outline" size={18} color="#9333EA" />
          </View>
          <AppText
            style={styles.chipLabel}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.8}
          >
            Technicians
          </AppText>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.utilityChip}
          activeOpacity={0.75}
          onPress={() => onNavigate("/vendor/support-chat")}
        >
          <View style={[styles.chipIconWrap, { backgroundColor: "#FFF1F2" }]}>
            <Ionicons name="headset-outline" size={18} color="#E11D48" />
          </View>
          <AppText
            style={styles.chipLabel}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.8}
          >
            Tasker Help
          </AppText>
        </TouchableOpacity>
      </View>

      {/* ─── 3. ACTIVITY FEED SECTION ─── */}
      <View style={styles.activityHeaderRow}>
        <AppText style={styles.activitySectionTitle}>
          {isDaily ? "TODAY'S BOOKINGS & CASH" : "THIS MONTH'S EARNINGS & CLAIMS"}
        </AppText>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() =>
            onNavigate(isDaily ? "/vendor/(tabs)/ledger" : "/vendor/(tabs)/earnings")
          }
        >
          <AppText style={styles.viewAllText}>View All →</AppText>
        </TouchableOpacity>
      </View>

      {/* Activity List */}
      <View style={styles.activityList}>
        {displayList.length > 0 ? (
          displayList.map((item, idx) => {
            const isCredit = item.type === "credit" || Number(item.amount) > 0;
            const amtStr = Math.abs(Number(item.amount)).toLocaleString();

            return (
              <View key={item.id ? `${item.id}-${idx}` : idx} style={styles.activityItem}>
                <View style={styles.activityLeft}>
                  <View
                    style={[
                      styles.activityIconWrap,
                      {
                        backgroundColor: isDaily
                          ? isCredit
                            ? "#ECFDF5"
                            : "#FEF2F2"
                          : "#EFF6FF",
                      },
                    ]}
                  >
                    <Ionicons
                      name={
                        isDaily
                          ? isCredit
                            ? "checkmark-circle"
                            : "arrow-up"
                          : "shield-checkmark"
                      }
                      size={18}
                      color={
                        isDaily
                          ? isCredit
                            ? "#059669"
                            : "#DC2626"
                          : "#2563EB"
                      }
                    />
                  </View>

                  <View style={{ flex: 1, paddingRight: 8 }}>
                    <AppText style={styles.activityItemTitle} numberOfLines={1}>
                      {item.title ||
                        (item.work_order_number
                          ? `Order #${item.work_order_number}`
                          : "Customer Service")}
                    </AppText>
                    <AppText style={styles.activityItemSub} numberOfLines={1}>
                      {formatTimeOrDate(item.date)} ·{" "}
                      {isDaily
                        ? isCredit
                          ? "Cash Collected On-Site"
                          : "Commission Cut"
                        : "100% Reimbursed Claim"}
                    </AppText>
                  </View>
                </View>

                <AppText
                  style={[
                    styles.activityItemAmount,
                    {
                      color: isDaily
                        ? isCredit
                          ? "#0F172A"
                          : "#DC2626"
                        : "#2563EB",
                    },
                  ]}
                >
                  {isCredit ? `+PKR ${amtStr}` : `-PKR ${amtStr}`}
                </AppText>
              </View>
            );
          })
        ) : (
          /* Clean Empty State */
          <View style={styles.emptyCard}>
            <View style={styles.emptyIconWrap}>
              <Ionicons
                name={isDaily ? "briefcase-outline" : "receipt-outline"}
                size={24}
                color="#94A3B8"
              />
            </View>
            <AppText style={styles.emptyTitle}>
              {isDaily
                ? "No Bookings Completed Yet Today"
                : "No Monthly Claims Recorded Yet"}
            </AppText>
            <AppText style={styles.emptySubtitle}>
              {isDaily
                ? "Slide online at the bottom to start receiving customer requests in your area."
                : "Warranty and free installation payouts will automatically accrue here."}
            </AppText>
          </View>
        )}
      </View>

      {/* Infinite Bottom White Overscroll Extension */}
      <View style={styles.bottomOverscrollExtension} pointerEvents="none" />
    </View>
  );
}

const styles = StyleSheet.create({
  embeddedSheetContainer: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    paddingTop: 24,
    paddingHorizontal: 20,
    marginTop: 14,
    position: "relative",
  },
  bottomOverscrollExtension: {
    position: "absolute",
    bottom: -1000,
    left: 0,
    right: 0,
    height: 1000,
    backgroundColor: "#FFFFFF",
  },

  // ─── COMPACT WARNING CARD ───
  compactWarningCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FECACA",
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 16,
    gap: 8,
  },
  compactWarningLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
  compactWarningText: {
    fontSize: 11.5,
    fontWeight: "700",
    color: "#991B1B",
    flex: 1,
    lineHeight: 15,
  },
  compactSettleBtn: {
    backgroundColor: "#DC2626",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 6.5,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  compactSettleBtnText: {
    fontSize: 11.5,
    fontWeight: "800",
    color: "#FFFFFF",
  },

  // ─── BANNER ───
  bannerCard: {
    borderRadius: 20,
    paddingVertical: 16,
    paddingHorizontal: 16,
    paddingBottom: 18,
    position: "relative",
    marginBottom: 20,
    borderWidth: 1,
  },
  bannerCardCleared: {
    backgroundColor: "#F0FDF4",
    borderColor: "#DCFCE7",
  },
  bannerCardDue: {
    backgroundColor: "#FEF2F2",
    borderColor: "#FEE2E2",
  },
  bannerCardLocked: {
    backgroundColor: "#FEF2F2",
    borderColor: "#FCA5A5",
    borderWidth: 1.5,
  },
  bannerCardMonthly: {
    backgroundColor: "#EFF6FF",
    borderColor: "#DBEAFE",
  },
  bannerCloseBtn: {
    position: "absolute",
    top: 10,
    right: 12,
    padding: 4,
    zIndex: 10,
  },
  bannerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  bannerTitle: {
    fontSize: 13.5,
    fontWeight: "800",
    color: "#0F172A",
    marginBottom: 3,
  },
  bannerSubtitle: {
    fontSize: 11.5,
    color: "#475569",
    lineHeight: 16,
  },
  settleBtn: {
    backgroundColor: "#DC2626",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 9,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  settleBtnText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "800",
  },
  badgeBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  badgeBoxGreen: {
    backgroundColor: "#DCFCE7",
  },
  badgeBoxBlue: {
    backgroundColor: "#DBEAFE",
  },
  badgeText: {
    fontSize: 9.5,
    fontWeight: "800",
    marginTop: 2,
    textTransform: "uppercase",
  },

  // ─── UTILITY ACTION CHIPS (Zero text overflow, icon on top) ───
  utilityChipsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
    marginBottom: 22,
  },
  utilityChip: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 18,
    paddingVertical: 12,
    paddingHorizontal: 6,
    paddingBottom: 13,
    gap: 6,
  },
  chipIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  chipLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#1E293B",
    textAlign: "center",
    width: "100%",
  },

  // ─── ACTIVITY SECTION ───
  activityHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  activitySectionTitle: {
    fontSize: 11.5,
    fontWeight: "800",
    color: "#0F172A",
    letterSpacing: 0.5,
  },
  viewAllText: {
    fontSize: 11.5,
    fontWeight: "700",
    color: "#2563EB",
  },
  activityList: {
    gap: 10,
    paddingBottom: 20,
  },
  activityItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#F1F5F9",
    borderRadius: 18,
    paddingVertical: 15,
    paddingHorizontal: 15,
    paddingBottom: 15,
  },
  activityLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  activityIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  activityItemTitle: {
    fontSize: 12.5,
    fontWeight: "700",
    color: "#0F172A",
  },
  activityItemSub: {
    fontSize: 11,
    fontWeight: "500",
    color: "#64748B",
    marginTop: 2,
  },
  activityItemAmount: {
    fontSize: 13.5,
    fontWeight: "800",
  },

  // ─── EMPTY STATE ───
  emptyCard: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 20,
    paddingVertical: 32,
    paddingBottom: 36,
    paddingHorizontal: 20,
    gap: 8,
  },
  emptyIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  emptyTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1E293B",
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: 11.5,
    fontWeight: "500",
    color: "#64748B",
    textAlign: "center",
    lineHeight: 16,
    maxWidth: 260,
  },
});
