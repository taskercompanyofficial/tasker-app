import { localizedToast } from "@/lib/i18n/localized-toast";
import AppText from "@/components/common/AppText";
import DailySelfieModal from "@/components/vendor/DailySelfieModal";
import VendorLocationGateModal from "@/components/vendor/VendorLocationGateModal";
import { checkVendorOnlineReadiness } from "@/lib/vendorBackgroundLocation";

import Colors from "@/constants/Colors";
import { useSession } from "@/context/ctx";
import { useEcho } from "@/context/EchoProvider";
import {
  VENDOR_EARNINGS_URL,
  VENDOR_ONLINE_STATUS_URL,
  VENDOR_TOGGLE_ONLINE_STATUS_URL,
  VENDOR_WORK_ORDER_SUMMARY_URL,
  VENDOR_LOCATION_PING_URL,
  VENDOR_STAFF_LOCATION_PING_URL,
} from "@/lib/api-endpoints";
import axios from "@/lib/axios.config";
import * as Location from "expo-location";
import * as Haptics from "expo-haptics";
import { useFocusEffect, router } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";

// Modular Dashboard Components
import VendorDashboardHeader from "@/components/vendor/dashboard/VendorDashboardHeader";
import VendorPaymentTabs from "@/components/vendor/dashboard/VendorPaymentTabs";
import VendorSlidablePriceViews from "@/components/vendor/dashboard/VendorSlidablePriceViews";
import VendorEmbeddedSheet from "@/components/vendor/dashboard/VendorEmbeddedSheet";
import VendorOnlineSlider from "@/components/vendor/dashboard/VendorOnlineSlider";
import VendorBreakdownModal from "@/components/vendor/dashboard/VendorBreakdownModal";

interface WorkOrderStats {
  total: number;
  pending_acceptance: number;
  active: number;
  completed: number;
  completed_today?: number;
  completed_this_month: number;
  completed_monthly_jobs?: number;
}

export default function VendorDashboard() {
  const { session, refetchUser } = useSession();
  const { isConnected, onWorkOrderUpdate } = useEcho();

  const isStaff =
    session.appMode === "vendor_staff" ||
    (session.user as any)?.user_type === "vendor_staff";
  const mode = session.appMode || "vendor";

  const vendorUser = session.vendorUser || (session.user as any);
  const userName = vendorUser?.name || vendorUser?.first_name || "Partner";

  const [stats, setStats] = useState<WorkOrderStats | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [balance, setBalance] = useState(0);
  const [todayEarnings, setTodayEarnings] = useState(0);
  const [thisMonthEarnings, setThisMonthEarnings] = useState(0);
  const [companyShare, setCompanyShare] = useState(0);
  const [transactions, setTransactions] = useState<any[]>([]);

  // Active Tab: 0 = Daily Share, 1 = Monthly Payouts
  const [activeTabIndex, setActiveTabIndex] = useState<number>(0);

  // Notice banner state
  const [showNoticeBanner, setShowNoticeBanner] = useState(true);

  // Two-bucket financial model
  const [monthlyAccrued, setMonthlyAccrued] = useState(0);
  const [dueTodayPayable, setDueTodayPayable] = useState(0);
  const [overduePayable, setOverduePayable] = useState(0);
  const [isFinancialBlocked, setIsFinancialBlocked] = useState(false);
  const [secondsToMidnight, setSecondsToMidnight] = useState(0);

  // Online status
  const [isOnline, setIsOnline] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState(0);
  const [togglingOnline, setTogglingOnline] = useState(false);
  const [showSelfieModal, setShowSelfieModal] = useState(false);
  const [showPermissionGate, setShowPermissionGate] = useState(false);

  // Bottom Sheet Modal
  const [showSummarySheet, setShowSummarySheet] = useState(false);
  const [summarySheetMode, setSummarySheetMode] = useState<"daily" | "monthly">("daily");

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(15)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 350, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 350, useNativeDriver: true }),
    ]).start();
  }, []);

  useEffect(() => {
    if (secondsRemaining <= 0 || !isOnline) return;
    const interval = setInterval(() => setSecondsRemaining((p) => Math.max(0, p - 1)), 1000);
    return () => clearInterval(interval);
  }, [secondsRemaining, isOnline]);

  useEffect(() => {
    if (secondsToMidnight <= 0) return;
    const interval = setInterval(() => setSecondsToMidnight((p) => Math.max(0, p - 1)), 1000);
    return () => clearInterval(interval);
  }, [secondsToMidnight]);

  const openBreakdown = (breakdownMode: "daily" | "monthly") => {
    try {
      Haptics.selectionAsync();
    } catch (_) {}
    setSummarySheetMode(breakdownMode);
    setShowSummarySheet(true);
  };

  const fetchOnlineStatus = useCallback(async () => {
    try {
      const res = await axios.get(VENDOR_ONLINE_STATUS_URL(mode));
      if (res.data?.status === "success") {
        const d = res.data.data;
        if (d.is_financial_blocked) setIsFinancialBlocked(true);
        if (d.overdue_payables !== undefined) setOverduePayable(Number(d.overdue_payables));
        setIsOnline(Boolean(d.is_online));
        setSecondsRemaining(Number(d.seconds_remaining ?? 0));
        if (d.due_today_payables !== undefined) setDueTodayPayable(Number(d.due_today_payables));
        if (d.seconds_to_midnight !== undefined) setSecondsToMidnight(Number(d.seconds_to_midnight));
      }
    } catch (e) {
      console.warn("[Dashboard] Online status fetch failed:", e);
    }
  }, [mode]);

  const sendDashboardOnlineLocationPing = async () => {
    try {
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      if (!loc) return;
      const pingUrl = isStaff ? VENDOR_STAFF_LOCATION_PING_URL : VENDOR_LOCATION_PING_URL;
      await axios.post(pingUrl, {
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
        heading: loc.coords.heading ?? null,
        speed: loc.coords.speed ?? null,
        battery_level: 100,
        is_charging: false,
        app_state: "foreground",
      });
    } catch (err: any) {
      console.warn("⚠️ [DASHBOARD:ONLINE_PING_ERROR]", err?.response?.data ?? err?.message);
    }
  };

  const handleToggleOnline = async (targetValue: boolean) => {
    try {
      try {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } catch (_) {}

      if (targetValue) {
        const readiness = await checkVendorOnlineReadiness();
        if (!readiness.isReady) {
          setShowPermissionGate(true);
          return;
        }

        // Always ask for the image / face selfie verification when sliding to go online
        setShowSelfieModal(true);
        return;
      }

      setTogglingOnline(true);
      const res = await axios.post(VENDOR_TOGGLE_ONLINE_STATUS_URL(mode), {
        status: "offline",
      });
      if (res.data?.status === "success") {
        const d = res.data.data;
        setIsOnline(Boolean(d.is_online));
        setSecondsRemaining(Number(d.seconds_remaining ?? 0));
        try {
          await refetchUser(mode);
        } catch (_) {}
        localizedToast({
          type: "success",
          text1: "⚪ You are Offline",
          text2: "Offline mode active.",
        });
      }
    } catch (err: any) {
      if (targetValue && err?.response?.data?.requires_daily_selfie) {
        setShowSelfieModal(true);
      } else {
        localizedToast({
          type: "error",
          text1: "Status Error",
          text2: err?.response?.data?.message || "Failed to update status.",
        });
      }
    } finally {
      setTogglingOnline(false);
    }
  };

  const handleConfirmGoOffline = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (_) {}

    Alert.alert(
      "Go Offline?",
      "You will stop receiving new customer job dispatches until you go back online.",
      [
        { text: "Stay Online", style: "cancel" },
        {
          text: "Go Offline",
          style: "destructive",
          onPress: () => handleToggleOnline(false),
        },
      ]
    );
  };

  const fetchData = async () => {
    try {
      const promises: Promise<any>[] = [
        axios.get(VENDOR_WORK_ORDER_SUMMARY_URL).catch(() => ({ data: { data: null } })),
      ];
      if (!isStaff) {
        promises.push(axios.get(VENDOR_EARNINGS_URL).catch(() => ({ data: { data: [] } })));
      }
      const results = await Promise.all(promises);
      if (results[0]?.data?.data) setStats(results[0].data.data);

      if (!isStaff && results[1]?.data) {
        const earningsData = results[1].data.data;
        if (earningsData?.summary) {
          setBalance(Number(earningsData.summary.net_balance ?? 0));
          setThisMonthEarnings(Number(earningsData.summary.this_month_revenue ?? 0));
          if (earningsData.summary.monthly_accrued !== undefined) {
            setMonthlyAccrued(Number(earningsData.summary.monthly_accrued));
          }
          if (earningsData.summary.due_today_payable !== undefined) {
            setDueTodayPayable(Number(earningsData.summary.due_today_payable));
          }
          if (earningsData.summary.overdue_payable !== undefined) {
            setOverduePayable(Number(earningsData.summary.overdue_payable));
          }
          if (earningsData.summary.seconds_to_midnight !== undefined) {
            setSecondsToMidnight(Number(earningsData.summary.seconds_to_midnight));
          }
          if (earningsData.summary.is_financial_blocked) {
            setIsFinancialBlocked(true);
          }
        } else {
          const txns = Array.isArray(earningsData?.transactions)
            ? earningsData.transactions
            : Array.isArray(earningsData)
            ? earningsData
            : Array.isArray(results[1].data)
            ? results[1].data
            : [];
          let credit = 0,
            debit = 0;
          txns.forEach((i: any) => {
            const rawAmount = Number(i.amount ?? 0);
            const type = i.type === "debit" || rawAmount < 0 ? "debit" : "credit";
            const amt = Math.abs(rawAmount);
            if (type === "credit") credit += amt;
            if (type === "debit") debit += amt;
          });
          setBalance(credit - debit);
        }
        const txns = earningsData?.transactions || [];
        setTransactions(txns);
        const today = new Date().toISOString().split("T")[0];
        const todayCredits = txns
          .filter((t: any) => t.type === "credit" && t.date?.startsWith(today))
          .reduce((acc: number, t: any) => acc + Math.abs(Number(t.amount)), 0);
        setTodayEarnings(todayCredits);
        const dailyDue = earningsData?.summary?.due_today_payable !== undefined
          ? Number(earningsData.summary.due_today_payable)
          : txns
              .filter((t: any) => (t.ledger_bucket === "daily_payable" || t.category === "profit_share_adjustment") && t.type === "debit" && t.date?.startsWith(today))
              .reduce((acc: number, t: any) => acc + Math.abs(Number(t.amount)), 0);
        setCompanyShare(dailyDue);
      }
    } catch (e) {
      console.error("Dashboard fetchData error:", e);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
    fetchOnlineStatus();
  }, []);

  useEffect(() => {
    const t = setInterval(() => fetchOnlineStatus(), 60000);
    return () => clearInterval(t);
  }, [fetchOnlineStatus]);

  useFocusEffect(
    useCallback(() => {
      fetchData();
      fetchOnlineStatus();
    }, [])
  );

  useEffect(() => {
    const unsub = onWorkOrderUpdate(() => {
      fetchData();
    });
    return unsub;
  }, [onWorkOrderUpdate]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
    fetchOnlineStatus();
  };

  const resolvedAvatar =
    vendorUser?.active_avatar_url || vendorUser?.profile_image || vendorUser?.image || null;

  const dailyAmount = Math.abs(
    todayEarnings > 0 ? todayEarnings * 0.65 : balance
  ).toLocaleString();
  const monthlyAmount = (
    monthlyAccrued > 0 ? monthlyAccrued : thisMonthEarnings
  ).toLocaleString();

  const totalJobsDoneDaily = stats?.completed_today ?? 0;
  const totalJobsDoneMonthly = stats?.completed_monthly_jobs ?? stats?.completed_this_month ?? 0;
  const totalLifetimeJobs = stats?.completed ?? 0;

  const isLocked = overduePayable > 0 || isFinancialBlocked;
  const overdueAmount = isLocked ? overduePayable : 0;
  const effectiveIsOnline = isOnline && !isLocked;
  const effectiveIsOnlineRef = useRef(effectiveIsOnline);
  effectiveIsOnlineRef.current = effectiveIsOnline;

  return (
    <LinearGradient
      colors={["#E6F7F0", "#EEF5F2", "#F2F3F5"]}
      locations={[0, 0.22, 0.55]}
      style={styles.gradientContainer}
    >
      <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      {/* ─── 1. TOP HEADER (Zero Shadows, Status Chip Removed, QR/Pay Button Added) ─── */}
      <VendorDashboardHeader
        userName={userName}
        avatarUrl={resolvedAvatar}
        isOnline={effectiveIsOnline}
        onPressNotifications={() => router.push("/vendor/notifications" as any)}
        onPressQuickPay={() => router.push("/vendor/quick-pay" as any)}
      />

      {/* ─── 2. FULL-WIDTH TABS WITH REANIMATED UNDERLINE ─── */}
      <VendorPaymentTabs
        activeTabIndex={activeTabIndex}
        onTabChange={(index) => setActiveTabIndex(index)}
      />

      {/* ─── 3. SCROLLABLE CONTENT ─── */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[Colors.themes.provider.primary]}
          />
        }
      >
        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
            flex: 1,
          }}
        >
          {/* ─── 4. REANIMATED SLIDABLE PRICE VIEWS (Swipeable Left / Right) ─── */}
          <VendorSlidablePriceViews
            activeTabIndex={activeTabIndex}
            onTabChange={(index) => setActiveTabIndex(index)}
            dailyAmount={dailyAmount}
            monthlyAmount={monthlyAmount}
            totalJobsDoneDaily={totalJobsDoneDaily}
            totalJobsDoneMonthly={totalJobsDoneMonthly}
            totalLifetimeJobs={totalLifetimeJobs}
            todayEarnings={todayEarnings}
            companyShare={companyShare}
            dueTodayPayable={dueTodayPayable}
            isLocked={isLocked}
            overdueAmount={overdueAmount}
            onOpenBreakdown={openBreakdown}
          />

          {/* ─── 5. PURE WHITE EMBEDDED SHEET (OPTION B: STATUS + ACTIVITY FEED) ─── */}
          <VendorEmbeddedSheet
            activeTabIndex={activeTabIndex}
            showNoticeBanner={showNoticeBanner}
            onCloseNoticeBanner={() => setShowNoticeBanner(false)}
            dueTodayPayable={dueTodayPayable}
            transactions={transactions}
            todayEarnings={todayEarnings}
            monthlyAccrued={monthlyAccrued}
            isLocked={isLocked}
            overdueAmount={overdueAmount}
            onNavigate={(route) => router.push(route as any)}
            isOnline={effectiveIsOnline}
          />
        </Animated.View>
      </ScrollView>

      {/* ─── 6. BOTTOM DOCKED ONLINE / OFFLINE SLIDER (Same place for online and offline) ─── */}
      <VendorOnlineSlider
        isOnline={effectiveIsOnline}
        togglingOnline={togglingOnline}
        isLocked={isLocked}
        onSlideComplete={() => {
          if (effectiveIsOnlineRef.current) {
            handleToggleOnline(false);
          } else {
            handleToggleOnline(true);
          }
        }}
        onLockedPress={() => {
          localizedToast({
            type: "error",
            text1: "Account Locked",
            text2: `Please pay pending share of PKR ${overdueAmount.toLocaleString()} to unlock bookings.`,
          });
          router.push("/vendor/quick-pay" as any);
        }}
      />

      {/* ─── 7. FINANCIAL BREAKDOWN SHEET MODAL ─── */}
      <VendorBreakdownModal
        visible={showSummarySheet}
        mode={summarySheetMode}
        onClose={() => setShowSummarySheet(false)}
        todayEarnings={todayEarnings}
        companyShare={companyShare}
        dueTodayPayable={dueTodayPayable}
        dailyAmount={dailyAmount}
        monthlyAccrued={monthlyAccrued}
        monthlyAmount={monthlyAmount}
      />

      {/* ─── MODALS ─── */}
      <DailySelfieModal
        visible={showSelfieModal}
        onClose={() => setShowSelfieModal(false)}
        onSuccess={async (data) => {
          setSecondsRemaining(Number(data.seconds_remaining ?? 86400));
          const readiness = await checkVendorOnlineReadiness();
          if (readiness.isReady) {
            setIsOnline(Boolean(data.is_online));
            if (data.is_online) {
              sendDashboardOnlineLocationPing();
            }
          } else {
            setIsOnline(false);
            setShowPermissionGate(true);
          }
        }}
      />

      <VendorLocationGateModal
        visible={showPermissionGate}
        onClose={() => setShowPermissionGate(false)}
        onAllGranted={() => {
          setShowPermissionGate(false);
          handleToggleOnline(true);
        }}
      />
    </SafeAreaView>
  </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradientContainer: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: "transparent",
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 8,
    paddingBottom: 115,
    flexGrow: 1,
  },
});
