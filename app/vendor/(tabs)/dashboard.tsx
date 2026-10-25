import { localizedToast } from "@/lib/i18n/localized-toast";
import AppText from "@/components/common/AppText";
import DirectionalIcon from "@/components/common/DirectionalIcon";
import Header from "@/components/Header";
import DailySelfieModal from "@/components/vendor/DailySelfieModal";
import VendorLocationGateModal from "@/components/vendor/VendorLocationGateModal";
import { checkVendorOnlineReadiness } from "@/lib/vendorBackgroundLocation";

import Colors from "@/constants/Colors";
import { BorderRadius, Shadows, Spacing, Typography } from "@/constants/Styles";
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
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useFocusEffect, router } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Switch,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const HERO_IMAGE = require("@/assets/images/vendor-hero.png");

const COLS = 10;
const ROWS = 20;

function BackgroundTexture() {
  return (
    <View
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: SCREEN_WIDTH,
        height: SCREEN_HEIGHT,
        pointerEvents: "none",
      }}
    >
      {Array.from({ length: ROWS }).map((_, row) => (
        <View
          key={row}
          style={{ flexDirection: "row", justifyContent: "space-around", marginTop: SCREEN_HEIGHT / ROWS - 4 }}
        >
          {Array.from({ length: COLS }).map((_, col) => (
            <View
              key={col}
              style={{
                width: 4,
                height: 4,
                borderRadius: 2,
                backgroundColor: "rgba(30,58,138,0.04)",
              }}
            />
          ))}
        </View>
      ))}
    </View>
  );
}

interface WorkOrderStats {
  total: number;
  pending_acceptance: number;
  active: number;
  completed: number;
  completed_this_month: number;
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
  const firstName = userName.split(" ")[0];

  const [stats, setStats] = useState<WorkOrderStats | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [balance, setBalance] = useState(0);
  const [todayEarnings, setTodayEarnings] = useState(0);
  const [thisMonthEarnings, setThisMonthEarnings] = useState(0);
  const [companyShare, setCompanyShare] = useState(0);

  // Two-bucket financial model
  const [monthlyAccrued, setMonthlyAccrued] = useState(0);
  const [dueTodayPayable, setDueTodayPayable] = useState(0);
  const [overduePayable, setOverduePayable] = useState(0);
  const [secondsToMidnight, setSecondsToMidnight] = useState(0);

  // Online status
  const [isOnline, setIsOnline] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState(0);
  const [togglingOnline, setTogglingOnline] = useState(false);
  const [showSelfieModal, setShowSelfieModal] = useState(false);
  const [showPermissionGate, setShowPermissionGate] = useState(false);

  // Animations
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
    ]).start();
  }, []);

  useEffect(() => {
    let loopAnim: Animated.CompositeAnimation | null = null;
    if (isOnline) {
      loopAnim = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.7, duration: 900, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 900, useNativeDriver: true }),
        ])
      );
      loopAnim.start();
    } else {
      pulseAnim.setValue(1);
    }
    return () => loopAnim?.stop();
  }, [isOnline]);

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

  const fetchOnlineStatus = useCallback(async () => {
    try {
      const res = await axios.get(VENDOR_ONLINE_STATUS_URL(mode));
      if (res.data?.status === "success") {
        const d = res.data.data;
        if (d.is_financial_blocked || Number(d.overdue_payables ?? 0) > 0) {
          router.replace("/vendor/financial-lock" as any);
          return;
        }
        setIsOnline(Boolean(d.is_online));
        setSecondsRemaining(Number(d.seconds_remaining ?? 0));
        if (d.due_today_payables !== undefined) setDueTodayPayable(Number(d.due_today_payables));
        if (d.overdue_payables !== undefined) setOverduePayable(Number(d.overdue_payables));
        if (d.seconds_to_midnight !== undefined) setSecondsToMidnight(Number(d.seconds_to_midnight));
      }
    } catch (e) { console.warn("[Dashboard] Online status fetch failed:", e); }
  }, [mode]);

  const sendDashboardOnlineLocationPing = async () => {
    try {
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      if (!loc) return;
      const pingUrl = isStaff ? VENDOR_STAFF_LOCATION_PING_URL : VENDOR_LOCATION_PING_URL;
      console.log(`📍 [DASHBOARD:ONLINE_PING] Posting GPS -> ${pingUrl}`, {
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      });
      const pingRes = await axios.post(pingUrl, {
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
        heading: loc.coords.heading ?? null,
        speed: loc.coords.speed ?? null,
        battery_level: 100,
        is_charging: false,
        app_state: "foreground",
      });
      console.log("✅ [DASHBOARD:ONLINE_PING_SUCCESS]", pingRes.data);
    } catch (err: any) {
      console.warn("⚠️ [DASHBOARD:ONLINE_PING_ERROR]", err?.response?.data ?? err?.message);
    }
  };

  const handleToggleOnline = async (targetValue: boolean) => {
    try {
      try { await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); } catch (_) {}

      // 🛑 PRE-FLIGHT CHECK: Enforce background location & overlay permissions before going online
      if (targetValue) {
        const readiness = await checkVendorOnlineReadiness();
        if (!readiness.isReady) {
          setShowPermissionGate(true);
          return;
        }
      }

      if (targetValue && secondsRemaining <= 0) { setShowSelfieModal(true); return; }
      setTogglingOnline(true);
      const res = await axios.post(VENDOR_TOGGLE_ONLINE_STATUS_URL(mode), {
        status: targetValue ? "online" : "offline",
      });
      if (res.data?.status === "success") {
        const d = res.data.data;
        setIsOnline(Boolean(d.is_online));
        setSecondsRemaining(Number(d.seconds_remaining ?? 0));
        try { await refetchUser(mode); } catch (_) {}
        if (targetValue) {
          sendDashboardOnlineLocationPing();
        }
        localizedToast({
          type: "success",
          text1: targetValue ? "🟢 You are Online" : "⚫ You are Offline",
          text2: targetValue ? "Ready to receive dispatches." : "Off-duty. No new assignments.",
        });
      }
    } catch (err: any) {
      if (err?.response?.data?.requires_daily_selfie) {
        setShowSelfieModal(true);
      } else {
        localizedToast({ type: "error", text1: "Status Error", text2: err?.response?.data?.message || "Failed." });
      }
    } finally { setTogglingOnline(false); }
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
          if (earningsData.summary.is_financial_blocked || Number(earningsData.summary.overdue_payable ?? 0) > 0) {
            router.replace("/vendor/financial-lock" as any);
            return;
          }
        } else {
          const txns = Array.isArray(earningsData?.transactions) ? earningsData.transactions
            : Array.isArray(earningsData) ? earningsData
            : Array.isArray(results[1].data) ? results[1].data : [];
          let credit = 0, debit = 0;
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
        const today = new Date().toISOString().split("T")[0];
        const todayCredits = txns
          .filter((t: any) => t.type === "credit" && t.date?.startsWith(today))
          .reduce((acc: number, t: any) => acc + Math.abs(Number(t.amount)), 0);
        setTodayEarnings(todayCredits);
        setCompanyShare(todayCredits * 0.35);
      }
    } catch (e) { console.error("Dashboard fetchData error:", e); }
    finally { setRefreshing(false); }
  };

  useEffect(() => { fetchData(); fetchOnlineStatus(); }, []);
  useEffect(() => { const t = setInterval(() => fetchOnlineStatus(), 60000); return () => clearInterval(t); }, [fetchOnlineStatus]);
  useFocusEffect(useCallback(() => { fetchData(); fetchOnlineStatus(); }, []));
  useEffect(() => {
    const unsub = onWorkOrderUpdate((e) => { fetchData(); });
    return unsub;
  }, [onWorkOrderUpdate]);

  const onRefresh = () => { setRefreshing(true); fetchData(); fetchOnlineStatus(); };

  const formatTime = (sec: number) => {
    const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60);
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };

  const formatCountdown = (sec: number) => {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    return `${h}h ${m}m ${s}s`;
  };

  const resolvedAvatar =
    vendorUser?.active_avatar_url || vendorUser?.profile_image || vendorUser?.image || null;
  const avatarInitial = (vendorUser?.name?.charAt(0) || vendorUser?.first_name?.charAt(0) || "P").toUpperCase();

  // ─────────────────────── RENDER ───────────────────────
  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <BackgroundTexture />
      <Header showGreeting title={isStaff ? "Staff Dashboard" : "Vendor Dashboard"} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.themes.provider.primary]} />
        }
      >
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>

          {/* ─── HERO CARD ─── */}
          {!isStaff && (
            <View style={styles.heroCard}>
              {/* Background decoration */}
              <View style={styles.heroBgCircle1} />
              <View style={styles.heroBgCircle2} />
              <View style={styles.heroBgDots} />

              {/* Top row: avatar+name left, toggle right */}
              <View style={styles.heroTopRow}>
                <View style={styles.heroIdentity}>
                  <View style={styles.heroAvatarWrap}>
                    {resolvedAvatar ? (
                      <Image
                        source={{ uri: resolvedAvatar.startsWith("http") ? resolvedAvatar : `/${resolvedAvatar}` }}
                        style={styles.heroAvatar}
                      />
                    ) : (
                      <View style={styles.heroAvatarFallback}>
                        <AppText style={styles.heroAvatarText}>{avatarInitial}</AppText>
                      </View>
                    )}
                    <View style={[styles.avatarStatusDot, { backgroundColor: isOnline ? "#10B981" : "#9CA3AF" }]} />
                  </View>
                  <View>
                    <AppText style={styles.heroGreeting}>Welcome back,</AppText>
                    <AppText style={styles.heroName}>{firstName} 👋</AppText>
                  </View>
                </View>

                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  {/* Online toggle pill */}
                  <View style={[styles.togglePill, isOnline ? styles.togglePillOnline : styles.togglePillOffline]}>
                  <Animated.View
                    style={[
                      styles.toggleDot,
                      { backgroundColor: isOnline ? "#10B981" : "rgba(255,255,255,0.45)" },
                      isOnline && { transform: [{ scale: pulseAnim }] },
                    ]}
                  />
                  <AppText style={styles.toggleLabel}>{isOnline ? "LIVE" : "OFF"}</AppText>
                  {togglingOnline ? (
                    <ActivityIndicator size="small" color="#fff" style={{ marginLeft: 2 }} />
                  ) : (
                    <Switch
                      value={isOnline}
                      onValueChange={handleToggleOnline}
                      trackColor={{ false: "rgba(255,255,255,0.2)", true: "#059669" }}
                      thumbColor="#fff"
                      ios_backgroundColor="rgba(255,255,255,0.2)"
                      style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }], marginLeft: 2 }}
                    />
                  )}
                </View>
              </View>
            </View>

              {/* Slogan + Character row */}
              <View style={styles.heroMidRow}>
                <View style={styles.heroSloganBox}>
                  <AppText style={styles.heroSloganTag}>YOUR EARNINGS, YOUR RULES</AppText>
                  <AppText style={styles.heroSlogan}>Every job you{"\n"}complete pays{"\n"}you more.</AppText>
                  {isOnline && secondsRemaining > 0 && (
                    <View style={styles.timerChip}>
                      <Ionicons name="time-outline" size={10} color="#D1FAE5" />
                      <AppText style={styles.timerChipText}>Selfie valid · {formatTime(secondsRemaining)}</AppText>
                    </View>
                  )}
                </View>

                {/* Hero character illustration */}
                <Image
                  source={HERO_IMAGE}
                  style={styles.heroCharacter}
                  resizeMode="contain"
                />
              </View>

              {/* Earnings strip */}
              <View style={styles.earningsStrip}>
                <View style={styles.earnItem}>
                  <Ionicons name="wallet-outline" size={12} color="rgba(255,255,255,0.6)" />
                  <AppText style={styles.earnLabel}>Balance</AppText>
                  <AppText style={styles.earnValue} numberOfLines={1}>
                    {balance < 0 ? "-" : ""}PKR {Math.abs(balance).toLocaleString()}
                  </AppText>
                </View>
                <View style={styles.earnDivider} />
                <View style={styles.earnItem}>
                  <Ionicons name="today-outline" size={12} color="rgba(255,255,255,0.6)" />
                  <AppText style={styles.earnLabel}>Today</AppText>
                  <AppText style={styles.earnValue}>PKR {todayEarnings.toLocaleString()}</AppText>
                </View>
                <View style={styles.earnDivider} />
                <View style={styles.earnItem}>
                  <Ionicons name="calendar-outline" size={12} color="rgba(255,255,255,0.6)" />
                  <AppText style={styles.earnLabel}>This Month</AppText>
                  <AppText style={styles.earnValue}>PKR {thisMonthEarnings.toLocaleString()}</AppText>
                </View>
              </View>

              {/* RT dot */}
              <View style={[styles.rtDot, { backgroundColor: isConnected ? "#10B981" : "#F87171" }]} />
            </View>
          )}

          {/* Staff Banner */}
          {isStaff && (
            <View style={styles.staffBanner}>
              <View style={styles.staffAvatarWrap}>
                <Ionicons name="person" size={22} color={Colors.themes.provider.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <AppText style={styles.staffTitle}>Staff Account</AppText>
                <AppText style={styles.staffSub}>
                  Logged in under{" "}
                  {(session.user as any)?.vendor?.company_name ||
                    (session.user as any)?.vendor?.name || "your vendor"}
                </AppText>
              </View>
            </View>
          )}

          {/* ─── SETTLEMENT & REVENUE SPLIT BUCKETS ─── */}
          {!isStaff && (
            <View style={styles.settlementSection}>
              {/* Due Tonight Daily Share (Midnight Lock Alert) */}
              {dueTodayPayable > 0 && (
                <View style={styles.dailyPayableCard}>
                  <View style={styles.dailyPayableHeader}>
                    <View style={styles.dailyPayableTitleRow}>
                      <Ionicons name="time" size={16} color="#DC2626" />
                      <AppText style={styles.dailyPayableTitle}>Due Tonight (by 12:00 AM)</AppText>
                    </View>
                    <View style={styles.countdownBadge}>
                      <Ionicons name="hourglass-outline" size={12} color="#DC2626" />
                      <AppText style={styles.countdownText}>{formatCountdown(secondsToMidnight)}</AppText>
                    </View>
                  </View>

                  <View style={styles.dailyPayableBody}>
                    <AppText style={styles.dailyPayableAmount}>
                      PKR {dueTodayPayable.toLocaleString()}
                    </AppText>
                    <AppText style={styles.dailyPayableDesc}>
                      Company 35% cut from on-site extra cash collected. Must be deposited before 12:00 AM midnight to avoid automated app lockout.
                    </AppText>
                  </View>

                  <TouchableOpacity
                    style={styles.payNowBtn}
                    activeOpacity={0.85}
                    onPress={() => router.push("/vendor/financial-lock" as any)}
                  >
                    <AppText style={styles.payNowBtnText}>Submit Payment Proof</AppText>
                    <Ionicons name="arrow-forward" size={14} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              )}

              {/* Monthly Accrual Bucket (Warranty / Free Installation 100% Payout) */}
              <View style={styles.monthlyAccrualCard}>
                <View style={styles.monthlyAccrualHeader}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                    <Ionicons name="shield-checkmark" size={16} color="#059669" />
                    <AppText style={styles.monthlyAccrualTitle}>Monthly Accrued (100% Payout)</AppText>
                  </View>
                  <AppText style={styles.monthlyCycleBadge}>1st–30th Cycle</AppText>
                </View>

                <View style={{ marginTop: 4, flexDirection: "row", justifyContent: "space-between", alignItems: "baseline" }}>
                  <AppText style={styles.monthlyAccrualAmount}>
                    PKR {monthlyAccrued.toLocaleString()}
                  </AppText>
                  <AppText style={styles.monthlyPayoutNote}>
                    Paid 1st–5th of next month
                  </AppText>
                </View>

                <AppText style={styles.monthlyAccrualDesc}>
                  Warranty & free installation fees paid in full (0% company deduction).
                </AppText>
              </View>
            </View>
          )}

          {/* ─── JOB PERFORMANCE ─── */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View>
                <AppText style={styles.sectionTitle}>Job Performance</AppText>
                <AppText style={styles.sectionSub}>Live work order snapshot</AppText>
              </View>
              <View style={styles.syncBadge}>
                <Animated.View style={[styles.syncDot, { backgroundColor: isConnected ? Colors.success : Colors.error }]} />
                <AppText style={styles.syncText}>Live</AppText>
              </View>
            </View>

            <View style={styles.statsGrid}>
              <TouchableOpacity
                style={[styles.statCard, styles.statCardBlue]}
                activeOpacity={0.75}
                onPress={() => router.push("/vendor/jobs?status=active" as any)}
              >
                <View style={[styles.statIcon, { backgroundColor: "rgba(30,58,138,0.12)" }]}>
                  <Ionicons name="flash" size={20} color={Colors.themes.provider.primary} />
                </View>
                <AppText style={[styles.statNum, { color: Colors.themes.provider.primary }]}>{stats?.active ?? 0}</AppText>
                <AppText style={styles.statLabel}>Active Jobs</AppText>
                <View style={styles.statArrow}>
                  <DirectionalIcon name="arrow-forward" size={10} color={Colors.themes.provider.primaryLight} />
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.statCard, styles.statCardAmber]}
                activeOpacity={0.75}
                onPress={() => router.push("/vendor/jobs?status=pending" as any)}
              >
                <View style={[styles.statIcon, { backgroundColor: "rgba(245,158,11,0.12)" }]}>
                  <Ionicons name="time" size={20} color={Colors.warning} />
                </View>
                <AppText style={[styles.statNum, stats?.pending_acceptance ? { color: Colors.warning } : {}]}>
                  {stats?.pending_acceptance ?? 0}
                </AppText>
                <AppText style={styles.statLabel}>Pending</AppText>
                <View style={styles.statArrow}>
                  <DirectionalIcon name="arrow-forward" size={10} color={Colors.warning} />
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.statCard, styles.statCardGreen]}
                activeOpacity={0.75}
                onPress={() => router.push("/vendor/jobs?period=this_month" as any)}
              >
                <View style={[styles.statIcon, { backgroundColor: "rgba(16,185,129,0.12)" }]}>
                  <Ionicons name="checkmark-done" size={20} color={Colors.success} />
                </View>
                <AppText style={[styles.statNum, { color: Colors.success }]}>{stats?.completed_this_month ?? 0}</AppText>
                <AppText style={styles.statLabel}>This Month</AppText>
                <View style={styles.statArrow}>
                  <DirectionalIcon name="arrow-forward" size={10} color={Colors.success} />
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.statCard, styles.statCardPurple]}
                activeOpacity={0.75}
                onPress={() => router.push("/vendor/jobs?status=completed" as any)}
              >
                <View style={[styles.statIcon, { backgroundColor: "rgba(139,92,246,0.12)" }]}>
                  <Ionicons name="trophy" size={20} color="#8B5CF6" />
                </View>
                <AppText style={[styles.statNum, { color: "#8B5CF6" }]}>{stats?.completed ?? 0}</AppText>
                <AppText style={styles.statLabel}>Lifetime</AppText>
                <View style={styles.statArrow}>
                  <DirectionalIcon name="arrow-forward" size={10} color="#8B5CF6" />
                </View>
              </TouchableOpacity>
            </View>
          </View>

          {/* ─── QUICK ACTIONS ─── */}
          {!isStaff && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <View>
                  <AppText style={styles.sectionTitle}>Quick Actions</AppText>
                  <AppText style={styles.sectionSub}>Shortcuts to key features</AppText>
                </View>
              </View>

              <View style={styles.actionsCard}>
                {/* Team */}
                <TouchableOpacity
                  style={styles.actionRow}
                  activeOpacity={0.8}
                  onPress={() => router.push("/vendor/staff" as any)}
                >
                  <View style={[styles.actionIcon, { backgroundColor: Colors.themes.provider.primary + "12" }]}>
                    <Ionicons name="people" size={20} color={Colors.themes.provider.primary} />
                  </View>
                  <View style={styles.actionMeta}>
                    <AppText style={styles.actionTitle}>Team Management</AppText>
                    <AppText style={styles.actionSub}>Manage staff & technicians</AppText>
                  </View>
                  <View style={[styles.actionChip, { backgroundColor: Colors.themes.provider.background }]}>
                    <DirectionalIcon name="chevron-forward" size={14} color={Colors.themes.provider.primary} />
                  </View>
                </TouchableOpacity>

                <View style={styles.actionDivider} />

                {/* Support */}
                <TouchableOpacity
                  style={styles.actionRow}
                  activeOpacity={0.8}
                  onPress={() => router.push("/vendor/support-chat" as any)}
                >
                  <View style={[styles.actionIcon, { backgroundColor: Colors.success + "12" }]}>
                    <Ionicons name="headset" size={20} color={Colors.success} />
                  </View>
                  <View style={styles.actionMeta}>
                    <AppText style={styles.actionTitle}>Chat Support</AppText>
                    <AppText style={styles.actionSub}>Get help from our team</AppText>
                  </View>
                  <View style={[styles.actionChip, { backgroundColor: "#F0FDF4" }]}>
                    <DirectionalIcon name="chevron-forward" size={14} color={Colors.success} />
                  </View>
                </TouchableOpacity>

                <View style={styles.actionDivider} />

                {/* Earnings */}
                <TouchableOpacity
                  style={styles.actionRow}
                  activeOpacity={0.8}
                  onPress={() => router.push("/vendor/(tabs)/earnings" as any)}
                >
                  <View style={[styles.actionIcon, { backgroundColor: "#FEF3C7" }]}>
                    <MaterialCommunityIcons name="chart-line" size={20} color="#D97706" />
                  </View>
                  <View style={styles.actionMeta}>
                    <AppText style={styles.actionTitle}>Earnings & Ledger</AppText>
                    <AppText style={styles.actionSub}>View payouts & balance history</AppText>
                  </View>
                  <View style={[styles.actionChip, { backgroundColor: "#FEF3C7" }]}>
                    <DirectionalIcon name="chevron-forward" size={14} color="#D97706" />
                  </View>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* ─── TIP CARD ─── */}
          <View style={styles.tipCard}>
            <View style={styles.tipIconWrap}>
              <Ionicons name="bulb" size={20} color="#FBBF24" />
            </View>
            <View style={{ flex: 1 }}>
              <AppText style={styles.tipTitle}>Pro Tip</AppText>
              <AppText style={styles.tipText}>
                Keep job statuses updated for faster payouts. All jobs sync in real-time.
              </AppText>
            </View>
          </View>

        </Animated.View>
      </ScrollView>

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

      {/* Driver Readiness / Required Permissions Gate Modal */}
      <VendorLocationGateModal
        visible={showPermissionGate}
        onClose={() => setShowPermissionGate(false)}
        onAllGranted={() => {
          setShowPermissionGate(false);
          handleToggleOnline(true);
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#EEF2F7" },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 100 },

  // ─── HERO ────────────────────────────────────────────────────────────────────
  heroCard: {
    backgroundColor: Colors.themes.provider.primary,
    marginHorizontal: Spacing.md,
    marginTop: Spacing.sm,
    marginBottom: Spacing.lg,
    borderRadius: 24,
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 0,
    overflow: "hidden",
  },
  heroBgCircle1: {
    position: "absolute", width: 220, height: 220, borderRadius: 110,
    backgroundColor: "rgba(255,255,255,0.05)", top: -80, right: -60,
  },
  heroBgCircle2: {
    position: "absolute", width: 140, height: 140, borderRadius: 70,
    backgroundColor: "rgba(255,255,255,0.04)", bottom: 20, left: -30,
  },
  heroBgDots: {
    position: "absolute", width: 80, height: 80, borderRadius: 40,
    backgroundColor: "rgba(96,165,250,0.12)", top: 20, right: 80,
  },
  rtDot: {
    position: "absolute", top: 12, right: 12,
    width: 8, height: 8, borderRadius: 4,
  },

  // Top row
  heroTopRow: {
    flexDirection: "row", alignItems: "center",
    justifyContent: "space-between", marginBottom: 16,
  },
  heroIdentity: { flexDirection: "row", alignItems: "center", gap: 10 },
  heroAvatarWrap: { position: "relative" },
  heroAvatar: {
    width: 42, height: 42, borderRadius: 21,
    borderWidth: 2, borderColor: "rgba(255,255,255,0.5)",
  },
  heroAvatarFallback: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: "rgba(255,255,255,0.18)",
    justifyContent: "center", alignItems: "center",
    borderWidth: 2, borderColor: "rgba(255,255,255,0.35)",
  },
  heroAvatarText: { color: "#fff", fontSize: 18, fontWeight: "700" },
  avatarStatusDot: {
    position: "absolute", bottom: 0, right: 0,
    width: 13, height: 13, borderRadius: 6.5,
    borderWidth: 2, borderColor: Colors.themes.provider.primary,
  },
  heroGreeting: { color: "rgba(255,255,255,0.65)", fontSize: 10, fontWeight: "500" },
  heroName: { color: "#fff", fontSize: 15, fontWeight: "800" },

  // Toggle pill
  togglePill: {
    flexDirection: "row", alignItems: "center", gap: 4,
    paddingHorizontal: 10, paddingVertical: 6,
    borderRadius: 30, borderWidth: 1,
  },
  togglePillOnline: {
    backgroundColor: "rgba(5,150,105,0.25)",
    borderColor: "rgba(16,185,129,0.4)",
  },
  togglePillOffline: {
    backgroundColor: "rgba(255,255,255,0.10)",
    borderColor: "rgba(255,255,255,0.2)",
  },
  toggleDot: { width: 8, height: 8, borderRadius: 4 },
  toggleLabel: { color: "#fff", fontSize: 10, fontWeight: "800", letterSpacing: 0.5 },

  // Slogan + character
  heroMidRow: {
    flexDirection: "row", alignItems: "flex-end",
    marginBottom: 16,
  },
  heroSloganBox: { flex: 1, paddingBottom: 8 },
  heroSloganTag: {
    color: "rgba(255,255,255,0.5)", fontSize: 8,
    fontWeight: "700", letterSpacing: 1.5,
    textTransform: "uppercase", marginBottom: 6,
  },
  heroSlogan: {
    color: "#fff", fontSize: 18,
    fontWeight: "900", lineHeight: 24,
    letterSpacing: -0.5,
  },
  timerChip: {
    flexDirection: "row", alignItems: "center", gap: 4,
    alignSelf: "flex-start",
    backgroundColor: "rgba(16,185,129,0.25)",
    borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3,
    marginTop: 10,
  },
  timerChipText: { color: "#D1FAE5", fontSize: 10, fontWeight: "700" },
  heroCharacter: {
    width: 110, height: 130,
    marginRight: -14,
  },

  // Earnings strip
  earningsStrip: {
    flexDirection: "row",
    backgroundColor: "rgba(0,0,0,0.18)",
    borderBottomLeftRadius: 20, borderBottomRightRadius: 20,
    marginHorizontal: -14,
    paddingVertical: 8, paddingHorizontal: 8,
  },
  earnItem: { flex: 1, alignItems: "center", gap: 3 },
  earnLabel: { color: "rgba(255,255,255,0.55)", fontSize: 9, fontWeight: "500" },
  earnValue: { color: "#fff", fontSize: 12, fontWeight: "800" },
  earnDivider: { width: 1, backgroundColor: "rgba(255,255,255,0.15)", marginVertical: 4 },

  // ─── STAFF ───────────────────────────────────────────────────────────────────
  staffBanner: {
    flexDirection: "row", alignItems: "center", gap: 12,
    backgroundColor: Colors.themes.provider.background,
    borderRadius: 16, marginHorizontal: Spacing.md,
    marginBottom: Spacing.md, padding: Spacing.md,
    borderWidth: 1, borderColor: Colors.themes.provider.accent + "30",
  },
  staffAvatarWrap: {
    width: 46, height: 46, borderRadius: 23,
    backgroundColor: Colors.themes.provider.primary + "15",
    justifyContent: "center", alignItems: "center",
  },
  staffTitle: { fontSize: 14, fontWeight: "700", color: Colors.themes.provider.primary },
  staffSub: { fontSize: 11, color: Colors.text.secondary, marginTop: 2 },

  // ─── SECTION ─────────────────────────────────────────────────────────────────
  section: { marginHorizontal: Spacing.md, marginBottom: Spacing.lg },
  sectionHeader: {
    flexDirection: "row", alignItems: "center",
    justifyContent: "space-between", marginBottom: 12,
  },
  sectionTitle: { fontSize: 13, fontWeight: "800", color: "#1E293B", letterSpacing: -0.3 },
  sectionSub: { fontSize: 10, color: Colors.text.tertiary, marginTop: 1, fontWeight: "500" },
  syncBadge: {
    flexDirection: "row", alignItems: "center", gap: 5,
    backgroundColor: "#fff", paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 20, borderWidth: 1, borderColor: Colors.border.light,
  },
  syncDot: { width: 7, height: 7, borderRadius: 3.5 },
  syncText: { fontSize: 11, color: Colors.text.secondary, fontWeight: "600" },

  // ─── STAT CARDS ──────────────────────────────────────────────────────────────
  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  statCard: {
    width: (SCREEN_WIDTH - Spacing.md * 2 - 10) / 2,
    backgroundColor: "#fff",
    borderRadius: 18, padding: 12,
    alignItems: "flex-start",
    position: "relative",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  statCardBlue: { borderTopWidth: 3, borderTopColor: Colors.themes.provider.primary },
  statCardAmber: { borderTopWidth: 3, borderTopColor: Colors.warning },
  statCardGreen: { borderTopWidth: 3, borderTopColor: Colors.success },
  statCardPurple: { borderTopWidth: 3, borderTopColor: "#8B5CF6" },
  statIcon: {
    width: 34, height: 34, borderRadius: 10,
    justifyContent: "center", alignItems: "center", marginBottom: 10,
  },
  statNum: { fontSize: 22, fontWeight: "900", color: "#1E293B", lineHeight: 32 },
  statLabel: { fontSize: 10, fontWeight: "600", color: Colors.text.secondary, marginTop: 2 },
  statArrow: {
    position: "absolute", bottom: 12, right: 12,
    width: 18, height: 18, borderRadius: 9,
    backgroundColor: "#F1F5F9",
    justifyContent: "center", alignItems: "center",
  },

  // ─── QUICK ACTIONS ───────────────────────────────────────────────────────────
  actionsCard: {
    backgroundColor: "#fff",
    borderRadius: 18, overflow: "hidden",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  actionRow: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 16, paddingVertical: 14, gap: 12,
  },
  actionIcon: {
    width: 44, height: 44, borderRadius: 14,
    justifyContent: "center", alignItems: "center",
  },
  actionMeta: { flex: 1 },
  actionTitle: { fontSize: 14, fontWeight: "700", color: "#1E293B" },
  actionSub: { fontSize: 11, color: Colors.text.secondary, marginTop: 1 },
  actionChip: {
    width: 30, height: 30, borderRadius: 10,
    justifyContent: "center", alignItems: "center",
  },
  actionDivider: { height: 1, backgroundColor: "#F1F5F9", marginLeft: 72 },

  // ─── TIP CARD ────────────────────────────────────────────────────────────────
  tipCard: {
    flexDirection: "row", alignItems: "flex-start", gap: 12,
    marginHorizontal: Spacing.md, marginBottom: Spacing.xl,
    backgroundColor: "#FFFBEB",
    padding: 14, borderRadius: 16,
    borderWidth: 1, borderColor: "#FDE68A",
  },
  tipIconWrap: {
    width: 36, height: 36, borderRadius: 12,
    backgroundColor: "#FEF3C7",
    justifyContent: "center", alignItems: "center",
  },
  tipTitle: { fontSize: 13, fontWeight: "700", color: "#92400E", marginBottom: 2 },
  tipText: { fontSize: 12, color: "#78350F", lineHeight: 17, fontWeight: "500" },

  // ─── SETTLEMENT & BUCKETS ────────────────────────────────────────────────────
  settlementSection: {
    marginHorizontal: Spacing.md,
    marginTop: Spacing.md,
    gap: 12,
  },
  dailyPayableCard: {
    backgroundColor: "#FEF2F2",
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: "#FCA5A5",
    padding: 16,
  },
  dailyPayableHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  dailyPayableTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  dailyPayableTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#DC2626",
  },
  countdownBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#FEE2E2",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  countdownText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#DC2626",
  },
  dailyPayableBody: {
    marginTop: 4,
  },
  dailyPayableAmount: {
    fontSize: 22,
    fontWeight: "900",
    color: "#991B1B",
  },
  dailyPayableDesc: {
    fontSize: 11,
    color: "#7F1D1D",
    marginTop: 2,
    lineHeight: 15,
  },
  payNowBtn: {
    marginTop: 12,
    backgroundColor: "#DC2626",
    borderRadius: BorderRadius.lg,
    paddingVertical: 9,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  payNowBtnText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },
  monthlyAccrualCard: {
    backgroundColor: "#F0FDF4",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#BBF7D0",
    padding: 16,
  },
  monthlyAccrualHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  monthlyAccrualTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#059669",
  },
  monthlyCycleBadge: {
    fontSize: 10,
    fontWeight: "600",
    color: "#065F46",
    backgroundColor: "#DCFCE7",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  monthlyAccrualAmount: {
    fontSize: 20,
    fontWeight: "900",
    color: "#065F46",
  },
  monthlyPayoutNote: {
    fontSize: 11,
    fontWeight: "600",
    color: "#047857",
  },
  monthlyAccrualDesc: {
    fontSize: 11,
    color: "#166534",
    marginTop: 4,
    lineHeight: 15,
  },
});
