import React from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AppText from "@/components/common/AppText";

interface VendorTransaction {
  id: string | number;
  type?: "credit" | "debit";
  title?: string;
  service_name?: string;
  payment_method_label?: string;
  wo_status_label?: string;
  customer_paid?: number;
  vendor_share?: number;
  company_share?: number;
  accepted_at?: string | null;
  completed_at?: string | null;
  ledger_bucket?: "daily_payable" | "monthly_accrual";
  settlement_status?: "pending" | "settled" | "active";
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
  financialGraceUntil?: string | null;
  financialGraceWarning?: string | null;
  secondsToGraceExpiry?: number;
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
  financialGraceUntil = null,
  financialGraceWarning = null,
  secondsToGraceExpiry = 0,
  onNavigate,
  isOnline = false,
}: VendorEmbeddedSheetProps) {
  const isDaily = activeTabIndex === 0;
  const isDue = isDaily && (dueTodayPayable > 0 || isLocked);
  const [graceDismissed, setGraceDismissed] = React.useState(false);

  const effectiveGraceSeconds =
    secondsToGraceExpiry > 0
      ? secondsToGraceExpiry
      : financialGraceUntil
        ? Math.max(0, Math.floor((new Date(financialGraceUntil).getTime() - Date.now()) / 1000))
        : 0;

  const hasActiveGrace = Boolean(financialGraceUntil && effectiveGraceSeconds > 0);
  const isGraceLastHour = hasActiveGrace && effectiveGraceSeconds <= 3600;
  const showGraceBanner = hasActiveGrace && !isLocked && (isGraceLastHour || !graceDismissed);

  const formatCountdownMMSS = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  // Filter transactions based on active tab using local date (matches Earnings tab Today filter)
  const nowLocal = new Date();
  const todayDateStr = `${nowLocal.getFullYear()}-${String(nowLocal.getMonth() + 1).padStart(2, "0")}-${String(nowLocal.getDate()).padStart(2, "0")}`;

  const dailyTransactions = transactions.filter((t) => {
    const isDailyBucket = t.ledger_bucket
      ? t.ledger_bucket === "daily_payable"
      : t.category === "settlement" || t.category === "profit_share_adjustment";
    const tDate = t.date?.split("T")[0] || t.date?.split(" ")[0];
    return isDailyBucket && tDate === todayDateStr;
  });

  const displayList = isDaily
    ? dailyTransactions
    : transactions
        .filter((t) =>
          t.ledger_bucket
            ? t.ledger_bucket === "monthly_accrual"
            : t.category !== "settlement" && t.category !== "profit_share_adjustment"
        )
        .slice(0, 5);

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
      {/* ─── 0. GRACE DEADLINE WARNING BANNER (Non-closable + Live Countdown in Last 1 Hour) ─── */}
      {showGraceBanner && (
        <View
          style={{
            backgroundColor: isGraceLastHour ? "#FEF2F2" : "#FFFBEB",
            borderColor: isGraceLastHour ? "#EF4444" : "#F59E0B",
            borderWidth: 1.5,
            borderRadius: 14,
            padding: 12,
            marginBottom: 12,
            position: "relative",
          }}
        >
          {/* Close button ONLY when more than 1 hour remains */}
          {!isGraceLastHour && (
            <TouchableOpacity
              style={{
                position: "absolute",
                top: 8,
                right: 8,
                padding: 4,
                zIndex: 2,
              }}
              onPress={() => setGraceDismissed(true)}
              activeOpacity={0.7}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="close" size={16} color="#92400E" />
            </TouchableOpacity>
          )}

          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 10,
              paddingRight: !isGraceLastHour ? 18 : 0,
            }}
          >
            <View style={{ flex: 1, gap: 4 }}>
              <View style={{ flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 6 }}>
                <Ionicons
                  name={isGraceLastHour ? "alarm" : "time"}
                  size={16}
                  color={isGraceLastHour ? "#DC2626" : "#D97706"}
                />
                <AppText
                  style={{
                    fontSize: 12,
                    fontWeight: "800",
                    color: isGraceLastHour ? "#991B1B" : "#92400E",
                  }}
                >
                  {isGraceLastHour
                    ? "Auto-Locking Soon!"
                    : `Clear Dues Before ${new Date(financialGraceUntil!).toLocaleString([], {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}`}
                </AppText>

                {isGraceLastHour && (
                  <View
                    style={{
                      backgroundColor: "#DC2626",
                      paddingHorizontal: 8,
                      paddingVertical: 2,
                      borderRadius: 6,
                    }}
                  >
                    <AppText
                      style={{
                        fontSize: 11,
                        fontWeight: "900",
                        color: "#FFFFFF",
                        fontVariant: ["tabular-nums"],
                      }}
                    >
                      ⏳ {formatCountdownMMSS(effectiveGraceSeconds)} left
                    </AppText>
                  </View>
                )}
              </View>

              <AppText
                style={{
                  fontSize: 11,
                  color: isGraceLastHour ? "#B91C1C" : "#B45309",
                  lineHeight: 15,
                }}
              >
                {financialGraceWarning ||
                  "Your account is temporarily unlocked. If pending dues are not cleared by the deadline, your account will automatically lock again."}
              </AppText>
            </View>

            <TouchableOpacity
              style={{
                backgroundColor: isGraceLastHour ? "#DC2626" : "#D97706",
                paddingHorizontal: 12,
                paddingVertical: 8,
                borderRadius: 10,
              }}
              onPress={() => onNavigate("/vendor/quick-pay")}
              activeOpacity={0.85}
            >
              <AppText style={{ fontSize: 11, fontWeight: "800", color: "#FFFFFF" }}>
                Pay Now
              </AppText>
            </TouchableOpacity>
          </View>
        </View>
      )}

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
            const isCredit = item.type === "credit";
            const amtStr = Math.abs(Number(item.amount)).toLocaleString();
            const isWorkOrder = Boolean(
              item.work_order_number ||
                item.category === "grouped_bill_charge" ||
                item.category === "work_order_activity"
            );
            const isSettlement =
              item.category === "settlement" ||
              (!isWorkOrder && item.ledger_bucket === "daily_payable" && isCredit);

            const custPaid = Number(item.customer_paid) || 0;
            const vendorShare = Number(item.vendor_share) || 0;
            const companyShare = Number(item.company_share) || 0;
            const statusBadgeLabel =
              item.wo_status_label ||
              (isSettlement
                ? "Receipt Verified"
                : item.settlement_status === "settled"
                  ? "Settled"
                  : "Completed");

            return (
              <View
                key={item.id ? `${item.id}-${idx}` : idx}
                style={[styles.activityItem, { flexDirection: "column", alignItems: "stretch", gap: 10 }]}
              >
                <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                  <View style={styles.activityLeft}>
                    <View
                      style={[
                        styles.activityIconWrap,
                        {
                          backgroundColor: isDaily
                            ? isSettlement || isCredit
                              ? "#ECFDF5"
                              : "#FEF2F2"
                            : "#EFF6FF",
                        },
                      ]}
                    >
                      <Ionicons
                        name={
                          isDaily
                            ? isSettlement
                              ? "checkmark-done-circle"
                              : isWorkOrder
                                ? "construct-outline"
                                : isCredit
                                  ? "checkmark-circle"
                                  : "arrow-up"
                            : "shield-checkmark"
                        }
                        size={18}
                        color={
                          isDaily
                            ? isSettlement || isCredit
                              ? "#059669"
                              : "#DC2626"
                            : "#2563EB"
                        }
                      />
                    </View>

                    <View style={{ flex: 1, paddingRight: 8 }}>
                      <View style={{ flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 6 }}>
                        <AppText style={styles.activityItemTitle} numberOfLines={1}>
                          {item.title ||
                            (item.work_order_number
                              ? `Work Order #${item.work_order_number}`
                              : "Customer Service")}
                        </AppText>
                        <View
                          style={{
                            backgroundColor:
                              statusBadgeLabel.includes("Accepted")
                                ? "#EFF6FF"
                                : statusBadgeLabel.includes("Verified") || statusBadgeLabel.includes("Settled")
                                  ? "#ECFDF5"
                                  : "#F1F5F9",
                            paddingHorizontal: 6,
                            paddingVertical: 1.5,
                            borderRadius: 6,
                          }}
                        >
                          <AppText
                            style={{
                              fontSize: 9.5,
                              fontWeight: "800",
                              color:
                                statusBadgeLabel.includes("Accepted")
                                  ? "#2563EB"
                                  : statusBadgeLabel.includes("Verified") || statusBadgeLabel.includes("Settled")
                                    ? "#059669"
                                    : "#475569",
                            }}
                          >
                            {statusBadgeLabel}
                          </AppText>
                        </View>
                      </View>

                      <AppText style={styles.activityItemSub} numberOfLines={1}>
                        {formatTimeOrDate(item.date)} ·{" "}
                        {item.service_name
                          ? `${item.service_name} · `
                          : ""}
                        {item.payment_method_label ||
                          (isDaily
                            ? isSettlement
                              ? "Paid to Company"
                              : "Cash Paid to Vendor"
                            : "100% Reimbursed Claim")}
                      </AppText>
                    </View>
                  </View>

                  <View style={{ alignItems: "flex-end" }}>
                    <AppText
                      style={[
                        styles.activityItemAmount,
                        {
                          color: isDaily
                            ? isCredit
                              ? "#059669"
                              : "#DC2626"
                            : "#2563EB",
                        },
                      ]}
                    >
                      {isCredit ? `+PKR ${amtStr}` : `-PKR ${amtStr}`}
                    </AppText>
                    <AppText style={{ fontSize: 9.5, fontWeight: "700", color: "#64748B", marginTop: 1 }}>
                      {isDaily
                        ? isSettlement
                          ? "Paid to Co."
                          : isCredit
                            ? "Your Share"
                            : "35% Co. Cut"
                        : "Monthly Claim"}
                    </AppText>
                  </View>
                </View>

                {/* Breakdown Chips for Daily Work Orders (Customer Paid / How Paid / Your 65% / Company 35%) */}
                {isDaily && isWorkOrder && custPaid > 0 && (
                  <View
                    style={{
                      flexDirection: "row",
                      flexWrap: "wrap",
                      gap: 6,
                      paddingTop: 8,
                      borderTopWidth: 1,
                      borderTopColor: "#E2E8F0",
                    }}
                  >
                    <View
                      style={{
                        backgroundColor: "#FFFFFF",
                        borderWidth: 1,
                        borderColor: "#E2E8F0",
                        borderRadius: 8,
                        paddingHorizontal: 8,
                        paddingVertical: 4,
                      }}
                    >
                      <AppText style={{ fontSize: 10, fontWeight: "700", color: "#334155" }}>
                        Customer Paid: PKR {custPaid.toLocaleString()} ({item.payment_method_label || "Cash"})
                      </AppText>
                    </View>

                    {vendorShare > 0 && (
                      <View
                        style={{
                          backgroundColor: "#ECFDF5",
                          borderRadius: 8,
                          paddingHorizontal: 8,
                          paddingVertical: 4,
                        }}
                      >
                        <AppText style={{ fontSize: 10, fontWeight: "800", color: "#059669" }}>
                          Your 65%: +PKR {vendorShare.toLocaleString()}
                        </AppText>
                      </View>
                    )}

                    {companyShare > 0 && (
                      <View
                        style={{
                          backgroundColor: "#FEF2F2",
                          borderRadius: 8,
                          paddingHorizontal: 8,
                          paddingVertical: 4,
                        }}
                      >
                        <AppText style={{ fontSize: 10, fontWeight: "800", color: "#DC2626" }}>
                          Co. 35%: -PKR {companyShare.toLocaleString()}
                        </AppText>
                      </View>
                    )}
                  </View>
                )}
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
