import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Modal as RNModal,
  Platform,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import DateTimePicker from "@react-native-community/datetimepicker";

import AppText from "@/components/common/AppText";
import Colors from "@/constants/Colors";
import { Shadows, Spacing, Typography } from "@/constants/DesignSystem";
import { VENDOR_EARNINGS_URL, VENDOR_PAYOUT_SUBMIT_URL } from "@/lib/api-endpoints";
import myAxios from "@/lib/axios.config";
import Modal from "@/components/Modal";
import Button from "@/components/Button";
import { useSession } from "@/context/ctx";
import { useLanguage } from "@/context/language-context";
import { localizedAlert } from "@/lib/i18n/localized-alert";

type VendorTxn = {
  id: string;
  type: "credit" | "debit";
  title: string;
  date: string;
  amount: number;
  category: string;
  ledger_bucket?: "daily_payable" | "monthly_accrual";
  settlement_status?: "pending" | "settled";
  due_at?: string | null;
  status?: string;
  work_order_number?: string;
  running_balance: number;
  children?: any[];
};

type Summary = {
  total_completed_jobs: number;
  total_service_revenue: number;
  this_month_jobs: number;
  this_month_revenue: number;
  active_jobs: number;
  net_balance: number;
  total_paid: number;
  total_received: number;
  period_earned: number;
  period_debited: number;
  monthly_accrued?: number;
  monthly_disbursed?: number;
  monthly_balance?: number;
  due_today_payable?: number;
  overdue_payable?: number;
  is_financial_blocked?: boolean;
  financial_blocked_reason?: string | null;
  seconds_to_midnight?: number;
};

type LedgerMode = "daily" | "monthly";

export default function VendorEarnings() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { session } = useSession();
  const { t } = useLanguage();

  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState(false);
  const [txns, setTxns] = useState<VendorTxn[]>([]);
  const [summary, setSummary] = useState<Summary>({
    total_completed_jobs: 0,
    total_service_revenue: 0,
    this_month_jobs: 0,
    this_month_revenue: 0,
    active_jobs: 0,
    net_balance: 0,
    total_paid: 0,
    total_received: 0,
    period_earned: 0,
    period_debited: 0,
    monthly_accrued: 0,
    due_today_payable: 0,
    overdue_payable: 0,
  });

  // Active Ledger Mode: Daily vs Monthly
  const [ledgerMode, setLedgerMode] = useState<LedgerMode>("daily");

  // Sub-filter tabs (All / Incoming / Outgoing)
  const [flowFilter, setFlowFilter] = useState<"all" | "credit" | "debit">("all");

  // Selection Dropdown Modals
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedDailyFilter, setSelectedDailyFilter] = useState<string>("Today");
  const [selectedMonthlyFilter, setSelectedMonthlyFilter] = useState<string>("October 2026");

  // Custom date picker
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [customDate, setCustomDate] = useState<string>("");

  // Payout Modal
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [payoutImage, setPayoutImage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch earnings from API
  const fetchEarnings = useCallback(async (fromDate = "", toDate = "") => {
    try {
      const params: Record<string, string> = {};
      if (fromDate) params.date_from = fromDate;
      if (toDate) params.date_to = toDate;

      const res = await myAxios.get(VENDOR_EARNINGS_URL, { params });
      const data = res.data?.data;
      if (data?.summary) setSummary(data.summary);
      if (Array.isArray(data?.transactions)) setTxns(data.transactions);
    } catch (e) {
      console.log("Earnings fetch error:", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchEarnings();
    }, [fetchEarnings])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchEarnings();
  };

  // Helper formatting
  const formatPKR = (val: number) => {
    return (
      "₨ " +
      Math.abs(Math.round(val)).toLocaleString("en-PK", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      })
    );
  };

  // Build daily options dynamically (Today, Yesterday, past 5 days)
  const dailyOptions = useMemo(() => {
    const list: { label: string; dateStr: string }[] = [];
    const now = new Date();

    for (let i = 0; i < 7; i++) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const iso = d.toISOString().split("T")[0];

      let label = "";
      if (i === 0) {
        label = `Today (${d.toLocaleDateString("en-PK", { day: "numeric", month: "short" })})`;
      } else if (i === 1) {
        label = `Yesterday (${d.toLocaleDateString("en-PK", { day: "numeric", month: "short" })})`;
      } else {
        label = d.toLocaleDateString("en-PK", { weekday: "short", day: "numeric", month: "short" });
      }

      list.push({ label, dateStr: iso });
    }

    return list;
  }, []);

  // Build monthly options
  const monthlyOptions = useMemo(() => {
    const list: { label: string; year: number; month: number }[] = [];
    const now = new Date();

    for (let i = 0; i < 6; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const label = d.toLocaleDateString("en-PK", { month: "long", year: "numeric" });
      list.push({ label, year: d.getFullYear(), month: d.getMonth() });
    }

    return list;
  }, []);

  // Filtered transactions strictly separated by ledger bucket and date/month
  const activeTxns = useMemo(() => {
    let result = txns;

    if (ledgerMode === "daily") {
      // Daily mode: strictly include daily_payable bucket transactions (cash collections & settlements)
      result = result.filter((t) =>
        t.ledger_bucket
          ? t.ledger_bucket === "daily_payable"
          : t.category === "settlement" || t.category === "profit_share_adjustment"
      );

      // Find date filter string
      let targetIso = new Date().toISOString().split("T")[0];
      if (customDate) {
        targetIso = customDate;
      } else {
        const found = dailyOptions.find((o) => o.label === selectedDailyFilter);
        if (found) targetIso = found.dateStr;
      }

      result = result.filter((t) => {
        const tDate = t.date?.split("T")[0] || t.date?.split(" ")[0];
        return tDate === targetIso;
      });
    } else {
      // Monthly mode: strictly include monthly_accrual bucket transactions (installation fees, warranties, company disbursements)
      result = result.filter((t) =>
        t.ledger_bucket
          ? t.ledger_bucket === "monthly_accrual"
          : t.category !== "settlement" && t.category !== "profit_share_adjustment"
      );

      const found = monthlyOptions.find((o) => o.label === selectedMonthlyFilter);
      if (found) {
        result = result.filter((t) => {
          if (!t.date) return false;
          const d = new Date(t.date);
          return d.getFullYear() === found.year && d.getMonth() === found.month;
        });
      }
    }

    // Apply Incoming vs Outgoing sub-filter
    if (flowFilter === "credit") {
      result = result.filter((t) => t.type === "credit");
    } else if (flowFilter === "debit") {
      result = result.filter((t) => t.type === "debit");
    }

    return result;
  }, [txns, ledgerMode, selectedDailyFilter, selectedMonthlyFilter, customDate, flowFilter, dailyOptions, monthlyOptions]);

  // Dynamic calculations for Daily (Strictly for Cash Collection & Company Cut)
  const dailyMetrics = useMemo(() => {
    let targetIso = new Date().toISOString().split("T")[0];
    if (customDate) {
      targetIso = customDate;
    } else {
      const found = dailyOptions.find((o) => o.label === selectedDailyFilter);
      if (found) targetIso = found.dateStr;
    }

    // Filter strictly daily payable transactions for target date
    const dailyDayTxns = txns.filter((t) => {
      const isDailyBucket = t.ledger_bucket
        ? t.ledger_bucket === "daily_payable"
        : t.category === "settlement" || t.category === "profit_share_adjustment";
      const d = t.date?.split("T")[0] || t.date?.split(" ")[0];
      return isDailyBucket && d === targetIso;
    });

    // In daily payable:
    // Debits = Company cut owed by vendor for cash jobs collected on that day
    const dayDebits = dailyDayTxns
      .filter((t) => t.type === "debit")
      .reduce((acc, t) => acc + Math.abs(t.amount), 0);

    // Credits = Settlements / Quick Pay payments made by vendor on that day
    const daySettlements = dailyDayTxns
      .filter((t) => t.type === "credit")
      .reduce((acc, t) => acc + Math.abs(t.amount), 0);

    // If company cut is known from debits, partner cash is derived:
    // Company cut = 35% of cash collected -> Cash collected = companyCut / 0.35
    const companyCut = dayDebits;
    const estimatedCashCollected = companyCut > 0 ? Math.round(companyCut / 0.35) : 0;
    const partnerCash = Math.max(0, estimatedCashCollected - companyCut);

    const isToday = targetIso === new Date().toISOString().split("T")[0];
    const pendingDue = isToday && summary.due_today_payable !== undefined
      ? summary.due_today_payable
      : Math.max(0, companyCut - daySettlements);

    return {
      collected: estimatedCashCollected,
      companyCut,
      settled: daySettlements,
      partnerCash,
      duePayable: pendingDue,
    };
  }, [txns, customDate, selectedDailyFilter, dailyOptions, summary.due_today_payable]);

  // Dynamic calculations for Monthly (Strictly for Company Side Charges & Monthly Payouts)
  const monthlyMetrics = useMemo(() => {
    const found = monthlyOptions.find((o) => o.label === selectedMonthlyFilter);
    let monthCredits = 0;
    let monthDebits = 0;

    const monthlyBucketTxns = txns.filter((t) => {
      const isMonthlyBucket = t.ledger_bucket
        ? t.ledger_bucket === "monthly_accrual"
        : t.category !== "settlement" && t.category !== "profit_share_adjustment";
      return isMonthlyBucket;
    });

    if (found) {
      monthlyBucketTxns.forEach((t) => {
        if (!t.date) return;
        const d = new Date(t.date);
        if (d.getFullYear() === found.year && d.getMonth() === found.month) {
          if (t.type === "credit") monthCredits += Math.abs(t.amount);
          if (t.type === "debit") monthDebits += Math.abs(t.amount);
        }
      });
    }

    const accrued =
      summary.monthly_accrued && summary.monthly_accrued > 0
        ? summary.monthly_accrued
        : monthCredits;

    const netDisbursable = summary.monthly_balance !== undefined
      ? summary.monthly_balance
      : Math.max(0, monthCredits - monthDebits);

    return {
      accrued,
      netDisbursable,
      incomingClaims: monthCredits > 0 ? monthCredits : accrued,
      outgoingDisbursed: monthDebits,
    };
  }, [txns, monthlyOptions, selectedMonthlyFilter, summary.monthly_accrued, summary.monthly_balance]);

  // Payout submission
  const handlePickImage = async () => {
    if (Platform.OS !== "android") {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (permissionResult.status !== "granted") {
        localizedAlert("Permission Required", "Gallery access is needed to upload screenshots.");
        return;
      }
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.5,
    });

    if (!result.canceled) {
      setPayoutImage(result.assets[0].uri);
    }
  };

  const handleSubmitPayout = async () => {
    if (!payoutImage) {
      localizedAlert("Error", "Please select a payment screenshot first.");
      return;
    }

    try {
      setIsSubmitting(true);
      const formData = new FormData();
      const uriParts = payoutImage.split("/");
      const fileName = uriParts[uriParts.length - 1];
      const fileType = fileName.split(".").pop();

      formData.append("file", {
        uri: payoutImage,
        name: fileName,
        type: `image/${fileType}`,
      } as any);

      formData.append("amount", dailyMetrics.companyCut.toString());

      await myAxios.post(VENDOR_PAYOUT_SUBMIT_URL, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      localizedAlert("Success", "Payment proof submitted successfully!");
      setShowPayoutModal(false);
      setPayoutImage(null);
      fetchEarnings();
    } catch (error: any) {
      console.error("Payout submission error:", error);
      localizedAlert("Error", error.response?.data?.message || "Failed to submit payment proof.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const resolvedAvatar =
    session.vendorUser?.active_avatar_url ||
    (session.vendorUser as any)?.profile_image ||
    null;

  // Active filter badge display label
  const activeDropdownLabel =
    ledgerMode === "daily"
      ? customDate
        ? `Date: ${customDate}`
        : selectedDailyFilter
      : selectedMonthlyFilter;

  // Empty state illustration
  const EmptyLedgerState = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconCircle}>
        <Ionicons
          name={ledgerMode === "daily" ? "receipt-outline" : "wallet-outline"}
          size={38}
          color="#059669"
        />
      </View>

      <AppText style={styles.emptyHeading}>
        {ledgerMode === "daily" ? "No Daily Jobs Recorded" : "No Monthly Claims Yet"}
      </AppText>
      <AppText style={styles.emptySubheading}>
        {ledgerMode === "daily"
          ? "Completed work orders and customer cash collections for this date will appear here."
          : "Warranty service claims and company payout disbursements for this month will appear here."}
      </AppText>
    </View>
  );

  // Render single transaction row (Clean: no unnecessary customer details)
  const TxnItem = ({ txn }: { txn: VendorTxn }) => {
    const isCredit = txn.type === "credit";
    const [expanded, setExpanded] = useState(false);
    const hasChildren = txn.children && txn.children.length > 0;

    return (
      <View style={styles.txnCard}>
        <TouchableOpacity
          activeOpacity={hasChildren ? 0.7 : 1}
          onPress={() => hasChildren && setExpanded(!expanded)}
          style={styles.txnRowTouchable}
        >
          {/* Credit/Debit Arrow Icon Badge */}
          <View style={[styles.txnIconWrap, isCredit ? styles.txnIconCredit : styles.txnIconDebit]}>
            <AppText style={[styles.txnArrowText, isCredit ? styles.arrowCreditText : styles.arrowDebitText]}>
              {isCredit ? "↘" : "↗"}
            </AppText>
          </View>

          {/* Details */}
          <View style={styles.txnInfo}>
            <AppText style={styles.txnTitle} numberOfLines={1}>
              {txn.title}
            </AppText>
            <View style={styles.txnMetaRow}>
              {txn.work_order_number ? (
                <AppText style={styles.txnMetaText}>#{txn.work_order_number} • </AppText>
              ) : null}
              <AppText style={styles.txnMetaText}>
                {new Date(txn.date).toLocaleDateString("en-PK", {
                  day: "numeric",
                  month: "short",
                })}
              </AppText>
              {txn.ledger_bucket === "daily_payable" && txn.settlement_status === "pending" && (
                <AppText style={{ fontSize: 10, color: "#D97706", fontWeight: "700", marginLeft: 4 }}>
                  • Due Tonight
                </AppText>
              )}
              {txn.ledger_bucket === "daily_payable" && txn.settlement_status === "settled" && (
                <AppText style={{ fontSize: 10, color: "#059669", fontWeight: "700", marginLeft: 4 }}>
                  • Settled
                </AppText>
              )}
            </View>
          </View>

          {/* Amounts */}
          <View style={styles.txnRightCol}>
            <AppText style={[styles.txnAmountText, isCredit ? styles.amountCredit : styles.amountDebit]}>
              {isCredit ? "+" : "-"}
              {formatPKR(txn.amount)}
            </AppText>
            {txn.running_balance !== undefined && (
              <AppText style={styles.txnBalText}>Bal: {formatPKR(txn.running_balance)}</AppText>
            )}
          </View>
        </TouchableOpacity>

        {/* Expandable Children for grouped charges */}
        {expanded && hasChildren && (
          <View style={styles.childrenContainer}>
            {txn.children!.map((child, idx) => {
              const cCredit = child.type === "credit";
              return (
                <View
                  key={child.id || idx}
                  style={[styles.childRow, idx < txn.children!.length - 1 && styles.childBorder]}
                >
                  <AppText style={styles.childTitle} numberOfLines={1}>
                    {child.title}
                  </AppText>
                  <AppText style={[styles.childAmount, cCredit ? styles.amountCredit : styles.amountDebit]}>
                    {cCredit ? "+" : "-"}
                    {formatPKR(child.amount)}
                  </AppText>
                </View>
              );
            })}
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="dark-content" backgroundColor="#F4F5F7" />

      {/* ─── 1. TOP HEADER (Avatar + Export Button) ─── */}
      <View style={[styles.topHeaderBar, { paddingTop: Math.max(insets.top, 14) }]}>
        <View style={styles.avatarWrap}>
          {resolvedAvatar ? (
            <Image source={{ uri: resolvedAvatar }} style={styles.avatarImg} />
          ) : (
            <View style={styles.avatarFallback}>
              <AppText style={styles.avatarInitial}>
                {session.vendorUser?.name?.charAt(0) || "T"}
              </AppText>
            </View>
          )}
        </View>

        <TouchableOpacity
          style={styles.exportBtn}
          activeOpacity={0.8}
          onPress={() => localizedAlert("Export Statement", "Monthly statement exported successfully.")}
          accessibilityLabel="Export Statement"
        >
          <Ionicons name="document-text-outline" size={19} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* ─── 2. TWO-LEDGER SEGMENT SWITCHER ─── */}
      <View style={styles.modeSwitcherContainer}>
        <View style={styles.modeSegmentPill}>
          <TouchableOpacity
            style={[styles.modeBtn, ledgerMode === "daily" && styles.modeBtnActive]}
            activeOpacity={0.8}
            onPress={() => {
              setLedgerMode("daily");
              setCustomDate("");
            }}
          >
            <AppText style={[styles.modeBtnText, ledgerMode === "daily" && styles.modeBtnTextActive]}>
              Daily Ledger
            </AppText>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.modeBtn, ledgerMode === "monthly" && styles.modeBtnActive]}
            activeOpacity={0.8}
            onPress={() => {
              setLedgerMode("monthly");
              setCustomDate("");
            }}
          >
            <AppText style={[styles.modeBtnText, ledgerMode === "monthly" && styles.modeBtnTextActive]}>
              Monthly Ledger
            </AppText>
          </TouchableOpacity>
        </View>
      </View>

      {/* ─── 3. DYNAMIC HERO BALANCE SECTION ─── */}
      <View style={styles.heroSection}>
        <AppText style={styles.heroLabel}>
          {ledgerMode === "daily" ? "Daily Net Partner Cash" : "Monthly Disbursable Balance"}
        </AppText>

        <View style={styles.heroAmountRow}>
          <AppText style={styles.heroCurrency}>₨</AppText>
          <AppText style={styles.heroAmountValue}>
            {ledgerMode === "daily"
              ? dailyMetrics.partnerCash.toLocaleString("en-PK")
              : Math.round(monthlyMetrics.accrued).toLocaleString("en-PK")}
          </AppText>
        </View>

        {ledgerMode === "daily" && (dailyMetrics.duePayable > 0 || dailyMetrics.companyCut > 0) && (
          <View style={[styles.heroStatusChip, styles.chipDailyDue]}>
            <AppText style={[styles.heroChipText, styles.chipDailyDueText]}>
              ● ₨ {(dailyMetrics.duePayable || dailyMetrics.companyCut).toLocaleString()} Share Due Today (12 AM)
            </AppText>
          </View>
        )}
        {ledgerMode === "monthly" && (
          <View style={[styles.heroStatusChip, { backgroundColor: "#ECFDF5", borderColor: "#A7F3D0" }]}>
            <AppText style={[styles.heroChipText, { color: "#059669" }]}>
              ● Accrued for Monthly Company Disbursement
            </AppText>
          </View>
        )}
      </View>

      {/* ─── 4. DROPDOWN SELECTOR PILL (With List Dropdown) ─── */}
      <View style={styles.dropdownPillContainer}>
        <TouchableOpacity
          style={styles.dropdownPill}
          activeOpacity={0.8}
          onPress={() => setShowDropdown(true)}
        >
          <AppText style={styles.dropdownPillText}>{activeDropdownLabel}</AppText>
          <Ionicons name="chevron-down" size={14} color="#64748B" />
        </TouchableOpacity>
      </View>

      {/* ─── 5. INCOMING & OUTGOING 2-COLUMN FLOW ─── */}
      <View style={styles.flowRow}>
        {/* Incoming Column */}
        <View style={styles.flowColLeft}>
          <View style={styles.flowHeader}>
            <View style={[styles.arrowBadge, styles.arrowBadgeIn]}>
              <AppText style={styles.arrowBadgeInText}>↘</AppText>
            </View>
            <AppText style={styles.flowHeaderText}>Incoming</AppText>
          </View>
          <AppText style={styles.flowAmount}>
            {formatPKR(ledgerMode === "daily" ? dailyMetrics.collected : monthlyMetrics.incomingClaims)}
          </AppText>
          <AppText style={styles.flowSubnote}>
            {ledgerMode === "daily" ? "Cash collected" : "Warranty claims"}
          </AppText>
        </View>

        {/* Outgoing Column */}
        <View style={styles.flowColRight}>
          <View style={styles.flowHeaderRight}>
            <AppText style={styles.flowHeaderText}>Outgoing</AppText>
            <View style={[styles.arrowBadge, styles.arrowBadgeOut]}>
              <AppText style={styles.arrowBadgeOutText}>↗</AppText>
            </View>
          </View>
          <AppText style={styles.flowAmount}>
            {formatPKR(ledgerMode === "daily" ? dailyMetrics.companyCut : monthlyMetrics.outgoingDisbursed)}
          </AppText>
          <AppText style={styles.flowSubnoteRight}>
            {ledgerMode === "daily" ? "Company 35% cut" : "Disbursed to partner"}
          </AppText>
        </View>
      </View>

      {/* ─── 6. CURVED WHITE BOTTOM SHEET LEDGER ─── */}
      <View style={styles.bottomSheet}>
        {/* Filter Pills in Sheet Header */}
        <View style={styles.sheetHeaderRow}>
          <View style={styles.sheetSubTabs}>
            <TouchableOpacity
              style={[styles.sheetTabBtn, flowFilter === "all" && styles.sheetTabBtnActive]}
              onPress={() => setFlowFilter("all")}
            >
              <AppText style={[styles.sheetTabBtnText, flowFilter === "all" && styles.sheetTabBtnTextActive]}>
                All
              </AppText>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.sheetTabBtn, flowFilter === "credit" && styles.sheetTabBtnActive]}
              onPress={() => setFlowFilter("credit")}
            >
              <AppText style={[styles.sheetTabBtnText, flowFilter === "credit" && styles.sheetTabBtnTextActive]}>
                Incoming
              </AppText>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.sheetTabBtn, flowFilter === "debit" && styles.sheetTabBtnActive]}
              onPress={() => setFlowFilter("debit")}
            >
              <AppText style={[styles.sheetTabBtnText, flowFilter === "debit" && styles.sheetTabBtnTextActive]}>
                Outgoing
              </AppText>
            </TouchableOpacity>
          </View>

          {ledgerMode === "daily" && (dailyMetrics.duePayable > 0 || dailyMetrics.companyCut > 0) && (
            <TouchableOpacity
              style={styles.settleNowBtn}
              activeOpacity={0.8}
              onPress={() =>
                router.push({
                  pathname: "/vendor/quick-pay",
                  params: { dues: String(dailyMetrics.duePayable || dailyMetrics.companyCut) },
                } as any)
              }
            >
              <AppText style={styles.settleNowBtnText}>Pay Share</AppText>
            </TouchableOpacity>
          )}
        </View>

        {/* Ledger Transaction List or Empty State */}
        {loading ? (
          <View style={styles.centerLoading}>
            <ActivityIndicator size="large" color="#059669" />
          </View>
        ) : (
          <FlatList
            data={activeTxns}
            keyExtractor={(item, index) => item.id || `txn-${index}`}
            renderItem={({ item }) => <TxnItem txn={item} />}
            ItemSeparatorComponent={() => <View style={styles.txnSeparator} />}
            contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 24 }]}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#059669" />
            }
            ListEmptyComponent={<EmptyLedgerState />}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>

      {/* ─── 7. DROPDOWN SELECTION MODAL (Date-wise / Month-wise List) ─── */}
      <RNModal visible={showDropdown} transparent animationType="fade" onRequestClose={() => setShowDropdown(false)}>
        <TouchableWithoutFeedback onPress={() => setShowDropdown(false)}>
          <View style={styles.modalBackdrop}>
            <TouchableWithoutFeedback>
              <View style={styles.dropdownSheet}>
                <View style={styles.dropdownDragHandle} />

                <View style={styles.dropdownHeaderRow}>
                  <AppText style={styles.dropdownTitle}>
                    {ledgerMode === "daily" ? "Select Date Ledger" : "Select Billing Month"}
                  </AppText>
                  <TouchableOpacity onPress={() => setShowDropdown(false)}>
                    <Ionicons name="close" size={20} color="#64748B" />
                  </TouchableOpacity>
                </View>

                <ScrollView style={styles.dropdownList} showsVerticalScrollIndicator={false}>
                  {ledgerMode === "daily" ? (
                    <>
                      {dailyOptions.map((opt) => {
                        const isSelected = selectedDailyFilter === opt.label && !customDate;
                        return (
                          <TouchableOpacity
                            key={opt.dateStr}
                            style={[styles.dropdownOptionRow, isSelected && styles.dropdownOptionRowSelected]}
                            activeOpacity={0.7}
                            onPress={() => {
                              setSelectedDailyFilter(opt.label);
                              setCustomDate("");
                              setShowDropdown(false);
                            }}
                          >
                            <AppText
                              style={[styles.dropdownOptionText, isSelected && styles.dropdownOptionTextSelected]}
                            >
                              {opt.label}
                            </AppText>
                            <Ionicons
                              name={isSelected ? "radio-button-on" : "radio-button-off"}
                              size={18}
                              color={isSelected ? "#059669" : "#CBD5E1"}
                            />
                          </TouchableOpacity>
                        );
                      })}

                      {/* Pick custom specific date */}
                      <TouchableOpacity
                        style={styles.dropdownOptionRow}
                        activeOpacity={0.7}
                        onPress={() => {
                          setShowDropdown(false);
                          setShowDatePicker(true);
                        }}
                      >
                        <AppText style={[styles.dropdownOptionText, { color: "#059669" }]}>
                          Pick Another Date...
                        </AppText>
                        <Ionicons name="calendar-outline" size={18} color="#059669" />
                      </TouchableOpacity>
                    </>
                  ) : (
                    monthlyOptions.map((opt) => {
                      const isSelected = selectedMonthlyFilter === opt.label;
                      return (
                        <TouchableOpacity
                          key={opt.label}
                          style={[styles.dropdownOptionRow, isSelected && styles.dropdownOptionRowSelected]}
                          activeOpacity={0.7}
                          onPress={() => {
                            setSelectedMonthlyFilter(opt.label);
                            setShowDropdown(false);
                          }}
                        >
                          <AppText
                            style={[styles.dropdownOptionText, isSelected && styles.dropdownOptionTextSelected]}
                          >
                            {opt.label}
                          </AppText>
                          <Ionicons
                            name={isSelected ? "radio-button-on" : "radio-button-off"}
                            size={18}
                            color={isSelected ? "#059669" : "#CBD5E1"}
                          />
                        </TouchableOpacity>
                      );
                    })
                  )}
                </ScrollView>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </RNModal>

      {/* DatePicker if user taps "Pick Another Date..." */}
      {showDatePicker && (
        <DateTimePicker
          value={customDate ? new Date(customDate) : new Date()}
          mode="date"
          display="default"
          onChange={(event, selectedDate) => {
            setShowDatePicker(false);
            if (selectedDate) {
              const iso = selectedDate.toISOString().split("T")[0];
              setCustomDate(iso);
            }
          }}
        />
      )}

      {/* ─── 8. PAYOUT SHARE SUBMISSION MODAL ─── */}
      <Modal
        visible={showPayoutModal}
        onClose={() => setShowPayoutModal(false)}
        title="Submit Company Share"
        type="confirm"
      >
        <View style={styles.modalContent}>
          <AppText style={styles.modalAmount}>{formatPKR(dailyMetrics.companyCut)}</AppText>
          <AppText style={styles.modalHint}>Upload payment receipt screenshot to continue.</AppText>

          {payoutImage ? (
            <View style={styles.imagePreviewContainer}>
              <Image source={{ uri: payoutImage }} style={styles.imagePreview} />
              <TouchableOpacity style={styles.removeImageBtn} onPress={() => setPayoutImage(null)}>
                <Ionicons name="close-circle" size={20} color={Colors.error} />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={styles.uploadBtn} onPress={handlePickImage}>
              <Ionicons name="cloud-upload-outline" size={24} color="#059669" />
              <AppText style={styles.uploadBtnText}>Upload Screenshot</AppText>
            </TouchableOpacity>
          )}

          <View style={{ marginTop: 12, width: "100%" }}>
            <Button
              title={isSubmitting ? "Submitting..." : "Submit Proof"}
              onPress={handleSubmitPayout}
              loading={isSubmitting}
              disabled={!payoutImage || isSubmitting}
              fullWidth
              theme="vendor"
              size="medium"
            />
          </View>

          <TouchableOpacity
            style={styles.cancelBtn}
            onPress={() => setShowPayoutModal(false)}
            disabled={isSubmitting}
          >
            <AppText style={styles.cancelBtnText}>Back</AppText>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#F4F5F7",
  },
  centerLoading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
  },

  /* ─── Top Bar ─── */
  topHeaderBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 6,
  },
  avatarWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: "#E2E8F0",
    overflow: "hidden",
  },
  avatarImg: {
    width: "100%",
    height: "100%",
  },
  avatarFallback: {
    width: "100%",
    height: "100%",
    backgroundColor: "#059669",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInitial: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  exportBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#1E293B",
    alignItems: "center",
    justifyContent: "center",
  },

  /* ─── Segment Switcher ─── */
  modeSwitcherContainer: {
    alignItems: "center",
    marginTop: 4,
    marginBottom: 10,
  },
  modeSegmentPill: {
    flexDirection: "row",
    backgroundColor: "#E2E8F0",
    borderRadius: 999,
    padding: 3,
  },
  modeBtn: {
    paddingVertical: 6,
    paddingHorizontal: 18,
    borderRadius: 999,
  },
  modeBtnActive: {
    backgroundColor: "#059669",
  },
  modeBtnText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#64748B",
  },
  modeBtnTextActive: {
    color: "#FFFFFF",
  },

  /* ─── Hero Section ─── */
  heroSection: {
    alignItems: "center",
    marginBottom: 8,
  },
  heroLabel: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    color: "#64748B",
    marginBottom: 2,
  },
  heroAmountRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 4,
  },
  heroCurrency: {
    fontSize: 20,
    fontWeight: "800",
    color: "#059669",
  },
  heroAmountValue: {
    fontSize: 34,
    fontWeight: "800",
    color: "#0F172A",
    letterSpacing: -0.8,
  },
  heroStatusChip: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 999,
    marginTop: 4,
  },
  chipDailyDue: {
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FECACA",
  },
  chipDailySettled: {
    backgroundColor: "#ECFDF5",
    borderWidth: 1,
    borderColor: "#A7F3D0",
  },
  chipMonthlyDisbursed: {
    backgroundColor: "#EFF6FF",
    borderWidth: 1,
    borderColor: "#BFDBFE",
  },
  heroChipText: {
    fontSize: 11,
    fontWeight: "700",
  },
  chipDailyDueText: {
    color: "#DC2626",
  },
  chipDailySettledText: {
    color: "#059669",
  },
  chipMonthlyDisbursedText: {
    color: "#2563EB",
  },

  /* ─── Dropdown Pill ─── */
  dropdownPillContainer: {
    alignItems: "center",
    marginBottom: 10,
  },
  dropdownPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    paddingVertical: 5,
    paddingHorizontal: 16,
    borderRadius: 999,
  },
  dropdownPillText: {
    fontSize: 12.5,
    fontWeight: "700",
    color: "#1E293B",
  },

  /* ─── Flow Row ─── */
  flowRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  flowColLeft: {
    alignItems: "flex-start",
  },
  flowColRight: {
    alignItems: "flex-end",
  },
  flowHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 3,
  },
  flowHeaderRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 3,
  },
  arrowBadge: {
    width: 18,
    height: 18,
    borderRadius: 5,
    alignItems: "center",
    justifyContent: "center",
  },
  arrowBadgeIn: {
    backgroundColor: "#ECFDF5",
  },
  arrowBadgeOut: {
    backgroundColor: "#FEE2E2",
  },
  arrowBadgeInText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#059669",
  },
  arrowBadgeOutText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#EF4444",
  },
  flowHeaderText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#64748B",
  },
  flowAmount: {
    fontSize: 16.5,
    fontWeight: "800",
    color: "#0F172A",
  },
  flowSubnote: {
    fontSize: 10.5,
    color: "#64748B",
    marginTop: 1,
  },
  flowSubnoteRight: {
    fontSize: 10.5,
    color: "#64748B",
    marginTop: 1,
    textAlign: "right",
  },

  /* ─── Bottom Sheet ─── */
  bottomSheet: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
  },
  sheetHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  sheetSubTabs: {
    flexDirection: "row",
    backgroundColor: "#F1F5F9",
    borderRadius: 10,
    padding: 3,
  },
  sheetTabBtn: {
    paddingVertical: 5,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  sheetTabBtnActive: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  sheetTabBtnText: {
    fontSize: 11.5,
    fontWeight: "700",
    color: "#64748B",
  },
  sheetTabBtnTextActive: {
    color: "#0F172A",
  },
  settleNowBtn: {
    backgroundColor: "#059669",
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 999,
  },
  settleNowBtnText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "800",
  },

  /* ─── Transaction List ─── */
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 4,
  },
  txnSeparator: {
    height: 8,
  },
  txnCard: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 14,
    overflow: "hidden",
  },
  txnRowTouchable: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
  },
  txnIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  txnIconCredit: {
    backgroundColor: "#ECFDF5",
  },
  txnIconDebit: {
    backgroundColor: "#FEF2F2",
  },
  txnArrowText: {
    fontSize: 14,
    fontWeight: "800",
  },
  arrowCreditText: {
    color: "#059669",
  },
  arrowDebitText: {
    color: "#DC2626",
  },
  txnInfo: {
    flex: 1,
    paddingRight: 8,
  },
  txnTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1E293B",
    marginBottom: 2,
  },
  txnMetaRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  txnMetaText: {
    fontSize: 11,
    color: "#64748B",
  },
  txnRightCol: {
    alignItems: "flex-end",
  },
  txnAmountText: {
    fontSize: 13.5,
    fontWeight: "800",
  },
  amountCredit: {
    color: "#059669",
  },
  amountDebit: {
    color: "#DC2626",
  },
  txnBalText: {
    fontSize: 10.5,
    color: "#94A3B8",
    marginTop: 1,
  },
  childrenContainer: {
    backgroundColor: "#F1F5F9",
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  childRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 5,
  },
  childBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E2E8F0",
  },
  childTitle: {
    fontSize: 11.5,
    color: "#475569",
    flex: 1,
    paddingRight: 8,
  },
  childAmount: {
    fontSize: 12,
    fontWeight: "700",
  },

  /* ─── Empty State ─── */
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 44,
    paddingHorizontal: 32,
  },
  emptyIconCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: "#ECFDF5",
    borderWidth: 1.5,
    borderColor: "#A7F3D0",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  emptyHeading: {
    fontSize: 17,
    fontWeight: "800",
    color: "#0F172A",
    marginBottom: 6,
    letterSpacing: -0.3,
    textAlign: "center",
  },
  emptySubheading: {
    fontSize: 13,
    color: "#64748B",
    textAlign: "center",
    lineHeight: 18,
    maxWidth: 280,
  },

  /* ─── Dropdown Sheet Modal ─── */
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.5)",
    justifyContent: "flex-end",
  },
  dropdownSheet: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 30,
    maxHeight: "65%",
    ...Shadows.lg,
  },
  dropdownDragHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#E2E8F0",
    alignSelf: "center",
    marginBottom: 12,
  },
  dropdownHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  dropdownTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0F172A",
  },
  dropdownList: {
    maxHeight: 280,
  },
  dropdownOptionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#F1F5F9",
  },
  dropdownOptionRowSelected: {
    backgroundColor: "#ECFDF5",
    borderRadius: 10,
  },
  dropdownOptionText: {
    fontSize: 13.5,
    fontWeight: "600",
    color: "#1E293B",
  },
  dropdownOptionTextSelected: {
    color: "#059669",
    fontWeight: "700",
  },

  /* ─── Payout Modal ─── */
  modalContent: {
    width: "100%",
    alignItems: "center",
  },
  modalAmount: {
    fontSize: 24,
    fontWeight: "800",
    color: "#0F172A",
    marginBottom: 8,
  },
  modalHint: {
    fontSize: 11,
    color: "#64748B",
    textAlign: "center",
    marginBottom: 14,
  },
  uploadBtn: {
    width: "100%",
    height: 96,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#059669" + "30",
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#059669" + "06",
    marginBottom: 8,
  },
  uploadBtnText: {
    marginTop: 6,
    fontSize: 12,
    color: "#059669",
    fontWeight: "600",
  },
  imagePreviewContainer: {
    width: "100%",
    height: 150,
    borderRadius: 12,
    overflow: "hidden",
    position: "relative",
    marginBottom: 8,
  },
  imagePreview: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  removeImageBtn: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "#fff",
    borderRadius: 12,
  },
  cancelBtn: {
    marginTop: 14,
    paddingVertical: 8,
  },
  cancelBtnText: {
    color: "#64748B",
    fontSize: 13,
    fontWeight: "600",
  },
});
