import Header from "@/components/Header";
import VendorOnlineStatusBar from "@/components/vendor/VendorOnlineStatusBar";
import Colors from "@/constants/Colors";
import { BorderRadius, Shadows, Spacing, Typography } from "@/constants/Styles";
import { useSession } from "@/context/ctx";
import { useEcho } from "@/context/EchoProvider";
import {
  VENDOR_EARNINGS_URL,
  VENDOR_WORK_ORDER_SUMMARY_URL,
} from "@/lib/api-endpoints";
import axios from "@/lib/axios.config";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import { router } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface WorkOrderStats {
  total: number;
  pending_acceptance: number;
  active: number;
  completed: number;
  completed_this_month: number;
}

export default function VendorDashboard() {
  const { session } = useSession();
  const { isConnected, onWorkOrderUpdate } = useEcho();

  const isStaff =
    session.appMode === "vendor_staff" ||
    (session.user as any)?.user_type === "vendor_staff";

  const [stats, setStats] = useState<WorkOrderStats | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [balance, setBalance] = useState(0);
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [thisMonthEarnings, setThisMonthEarnings] = useState(0);
  const [todayEarnings, setTodayEarnings] = useState(0);
  const [companyShare, setCompanyShare] = useState(0);

  useEffect(() => {
    fetchData();
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, []),
  );

  // Real-time auto-refresh when a work order is updated anywhere in the system
  useEffect(() => {
    const unsubscribe = onWorkOrderUpdate((event) => {
      console.log(
        "[Dashboard] 📦 WorkOrder updated, refreshing stats...",
        event.workOrder.id,
      );
      fetchData();
    });
    return unsubscribe;
  }, [onWorkOrderUpdate]);

  const fetchData = async () => {
    try {
      const promises: Promise<any>[] = [
        axios
          .get(VENDOR_WORK_ORDER_SUMMARY_URL)
          .catch(() => ({ data: { data: null } })),
      ];
      // Only fetch earnings for vendors, not staff
      if (!isStaff) {
        promises.push(
          axios.get(VENDOR_EARNINGS_URL).catch(() => ({ data: { data: [] } })),
        );
      }

      const results = await Promise.all(promises);

      if (results[0]?.data?.data) {
        setStats(results[0].data.data);
      }

      if (!isStaff && results[1]?.data) {
        const earningsData = results[1].data.data;

        if (earningsData?.summary) {
          setBalance(Number(earningsData.summary.net_balance ?? 0));
          setTotalEarnings(
            Number(earningsData.summary.total_service_revenue ?? 0),
          );
          setThisMonthEarnings(
            Number(earningsData.summary.this_month_revenue ?? 0),
          );
        } else {
          const txns = Array.isArray(earningsData?.transactions)
            ? earningsData.transactions
            : Array.isArray(earningsData)
              ? earningsData
              : Array.isArray(results[1].data)
                ? results[1].data
                : [];

          let credit = 0;
          let debit = 0;
          let totalEarned = 0;

          txns.forEach((i: any) => {
            const rawAmount = Number(i.amount ?? 0);
            const type =
              i.type === "debit" || rawAmount < 0 ? "debit" : "credit";
            const amt = Math.abs(rawAmount);

            if (type === "credit") {
              credit += amt;
              totalEarned += amt;
            }
            if (type === "debit") {
              debit += amt;
            }
          });

          setBalance(credit - debit);
          setTotalEarnings(totalEarned);
          setThisMonthEarnings(0);

          // Calculate today's earnings from txns
          const today = new Date().toISOString().split("T")[0];
          const todayCredits = txns
            .filter((t: any) => t.type === "credit" && t.date.startsWith(today))
            .reduce(
              (acc: number, t: any) => acc + Math.abs(Number(t.amount)),
              0,
            );

          setTodayEarnings(todayCredits);
          setCompanyShare(todayCredits * 0.35);
        }

        // If summary exists, also try to find today's from transactions if provided
        if (earningsData?.transactions) {
          const txns = earningsData.transactions;
          const today = new Date().toISOString().split("T")[0];
          const todayCredits = txns
            .filter((t: any) => t.type === "credit" && t.date.startsWith(today))
            .reduce(
              (acc: number, t: any) => acc + Math.abs(Number(t.amount)),
              0,
            );

          setTodayEarnings(todayCredits);
          setCompanyShare(todayCredits * 0.35);
        }
      }
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
    } finally {
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const vendorUser = session.vendorUser || (session.user as any);

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <Header
        showGreeting
        title={isStaff ? "Staff Dashboard" : "Vendor Dashboard"}
      />
      <ScrollView
        style={styles.content}
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
        {/* Driver / Partner Online Status Bar & 24h Daily Selfie Verification */}
        <VendorOnlineStatusBar onStatusChanged={() => fetchData()} />

        {/* Top Professional Row - Only for vendors */}
        {!isStaff && (
          <View style={styles.statsOverview}>
            <View style={styles.mainBalanceCard}>
              <Text style={styles.balanceLabel}>Current Balance</Text>
              <Text style={styles.balanceText} numberOfLines={1}>
                {balance < 0 ? "-" : ""}PKR {Math.abs(balance).toLocaleString()}
              </Text>
              <View style={styles.earningMiniRow}>
                <View style={styles.earningMiniItem}>
                  <Ionicons
                    name="today-outline"
                    size={10}
                    color={Colors.neutral.white}
                  />
                  <Text style={styles.earningMiniText}>
                    Today: PKR {todayEarnings.toLocaleString()}
                  </Text>
                </View>
                <View style={[styles.earningMiniItem, { marginLeft: 12 }]}>
                  <Ionicons
                    name="business-outline"
                    size={10}
                    color={Colors.neutral.white}
                  />
                  <Text style={styles.earningMiniText}>
                    Co. Share: PKR {companyShare.toLocaleString()}
                  </Text>
                </View>
              </View>

              {/* <View style={[styles.earningMiniRow, { marginTop: 4, opacity: 0.7 }]}>
                <View style={styles.earningMiniItem}>
                  <Ionicons
                    name="calendar-outline"
                    size={10}
                    color={Colors.neutral.white}
                  />
                  <Text style={styles.earningMiniText}>
                    Month: PKR {thisMonthEarnings.toLocaleString()}
                  </Text>
                </View>
                <View style={[styles.earningMiniItem, { marginLeft: 12 }]}>
                  <Ionicons
                    name="trending-up"
                    size={10}
                    color={Colors.neutral.white}
                  />
                  <Text style={styles.earningMiniText}>
                    Total: PKR {totalEarnings.toLocaleString()}
                  </Text>
                </View>
              </View> */}
            </View>

            <View
              style={[
                styles.statusIndicator,
                isConnected ? styles.bgSuccess : styles.bgError,
              ]}
            >
              <View style={styles.statusInner}>
                <Ionicons
                  name={isConnected ? "wifi" : "wifi-outline"}
                  size={22}
                  color={Colors.neutral.white}
                />
                <Text style={styles.statusIndicatorText}>
                  {isConnected ? "LIVE" : "OFFLINE"}
                </Text>
              </View>
              <Text style={styles.statusIndicatorSubText}>
                {isConnected ? "Connected" : "Reconnecting..."}
              </Text>
            </View>
          </View>
        )}

        {/* Staff Welcome Banner */}
        {isStaff && (
          <View style={styles.staffBanner}>
            <View style={styles.staffBannerIcon}>
              <Ionicons
                name="person"
                size={24}
                color={Colors.themes.provider.primary}
              />
            </View>
            <View style={styles.staffBannerContent}>
              <Text style={styles.staffBannerTitle}>Staff Account</Text>
              <Text style={styles.staffBannerSubtitle}>
                You are logged in as staff under{" "}
                {(session.user as any)?.vendor?.company_name ||
                  (session.user as any)?.vendor?.name ||
                  "your vendor"}
              </Text>
            </View>
          </View>
        )}

        {/* Work Order Insights Grid */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Job Performance</Text>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>Real-time Sync</Text>
            </View>
          </View>
          <View style={styles.statsGrid}>
            <TouchableOpacity
              style={styles.statBox}
              activeOpacity={0.7}
              onPress={() => router.push("/vendor/jobs?status=active" as any)}
            >
              <View
                style={[
                  styles.statIconWrap,
                  { backgroundColor: Colors.themes.provider.primary + "15" },
                ]}
              >
                <Ionicons
                  name="flash"
                  size={16}
                  color={Colors.themes.provider.primary}
                />
              </View>
              <Text style={styles.statValue}>{stats?.active || 0}</Text>
              <Text style={styles.statLabel}>Active</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.statBox}
              activeOpacity={0.7}
              onPress={() => router.push("/vendor/jobs?status=pending" as any)}
            >
              <View
                style={[
                  styles.statIconWrap,
                  { backgroundColor: Colors.warning + "15" },
                ]}
              >
                <Ionicons name="time" size={16} color={Colors.warning} />
              </View>
              <Text
                style={
                  stats?.pending_acceptance
                    ? [styles.statValue, { color: Colors.warning }]
                    : styles.statValue
                }
              >
                {stats?.pending_acceptance || 0}
              </Text>
              <Text style={styles.statLabel}>Pending</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.statBox}
              activeOpacity={0.7}
              onPress={() =>
                router.push("/vendor/jobs?period=this_month" as any)
              }
            >
              <View
                style={[
                  styles.statIconWrap,
                  { backgroundColor: Colors.success + "15" },
                ]}
              >
                <Ionicons
                  name="checkmark-done"
                  size={16}
                  color={Colors.success}
                />
              </View>
              <Text style={styles.statValue}>
                {stats?.completed_this_month || 0}
              </Text>
              <Text style={styles.statLabel}>This Month</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.statBox}
              activeOpacity={0.7}
              onPress={() =>
                router.push("/vendor/jobs?status=completed" as any)
              }
            >
              <View
                style={[
                  styles.statIconWrap,
                  { backgroundColor: Colors.themes.provider.primary + "15" },
                ]}
              >
                <Ionicons
                  name="trophy"
                  size={16}
                  color={Colors.themes.provider.primary}
                />
              </View>
              <Text style={styles.statValue}>{stats?.completed || 0}</Text>
              <Text style={styles.statLabel}>Lifetime</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Staff Management - Only for vendors */}
        {!isStaff && (
          <View style={styles.section}>
            <TouchableOpacity
              style={styles.actionCard}
              activeOpacity={0.8}
              onPress={() => router.push("/vendor/staff" as any)}
            >
              <View style={styles.actionIconBg}>
                <Ionicons
                  name="people"
                  size={20}
                  color={Colors.themes.provider.primary}
                />
              </View>
              <View style={styles.actionTextContainer}>
                <Text style={styles.actionTitle}>Team Management</Text>
                <Text style={styles.actionSubtitle}>
                  Manage your staff and technical team
                </Text>
              </View>
              <View style={styles.actionChevron}>
                <Ionicons
                  name="chevron-forward"
                  size={18}
                  color={Colors.themes.provider.primary}
                />
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionCard, { marginTop: Spacing.sm }]}
              activeOpacity={0.8}
              onPress={() => router.push("/vendor/support-chat" as any)}
            >
              <View style={[styles.actionIconBg, { backgroundColor: Colors.success + "15" }]}>
                <Ionicons
                  name="headset"
                  size={20}
                  color={Colors.success}
                />
              </View>
              <View style={styles.actionTextContainer}>
                <Text style={styles.actionTitle}>Chat Support</Text>
                <Text style={styles.actionSubtitle}>
                  Real-time support for your queries
                </Text>
              </View>
              <View style={[styles.actionChevron, { backgroundColor: Colors.success + "10" }]}>
                <Ionicons
                  name="chevron-forward"
                  size={18}
                  color={Colors.success}
                />
              </View>
            </TouchableOpacity>
          </View>
        )}

        {/* Quick Tips */}
        <View style={styles.infoCard}>
          <Ionicons
            name="information-circle"
            size={18}
            color={Colors.themes.provider.primary}
          />
          <Text style={styles.infoText}>
            Regularly update your job statuses for faster payments. Jobs update
            in real-time as they are assigned or changed.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.secondary,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.md,
    paddingBottom: Spacing.xxl * 2,
  },
  statsOverview: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  mainBalanceCard: {
    flex: 1,
    backgroundColor: Colors.themes.provider.primary,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    justifyContent: "center",
    ...Shadows.md,
  },
  balanceLabel: {
    color: Colors.neutral.white,
    opacity: 0.8,
    fontSize: 10,
    fontWeight: Typography.weights.semibold,
  },
  balanceText: {
    color: Colors.neutral.white,
    fontSize: Typography.sizes.xxl,
    fontWeight: Typography.weights.extrabold,
    marginVertical: 2,
  },
  earningMiniRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
  },
  earningMiniText: {
    color: Colors.neutral.white,
    fontSize: 10,
    opacity: 0.9,
    fontWeight: Typography.weights.medium,
  },
  earningMiniItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  statusIndicator: {
    width: 90,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    justifyContent: "center",
    padding: 8,
    ...Shadows.sm,
  },
  statusInner: {
    alignItems: "center",
    gap: 2,
  },
  statusIndicatorText: {
    color: Colors.neutral.white,
    fontSize: 12,
    fontWeight: Typography.weights.extrabold,
  },
  statusIndicatorSubText: {
    color: Colors.neutral.white,
    fontSize: 8,
    opacity: 0.8,
    marginTop: 2,
    textAlign: "center",
  },
  bgSuccess: {
    backgroundColor: Colors.success,
  },
  bgError: {
    backgroundColor: Colors.error,
  },
  section: {
    marginBottom: Spacing.lg,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.sm,
  },
  sectionTitle: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.bold,
    color: Colors.text.primary,
  },
  badge: {
    backgroundColor: Colors.themes.provider.primary + "15",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  badgeText: {
    fontSize: 10,
    color: Colors.themes.provider.primary,
    fontWeight: Typography.weights.bold,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  statBox: {
    width: "48%",
    backgroundColor: Colors.neutral.white,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    justifyContent: "center",
    ...Shadows.sm,
  },
  statIconWrap: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.full,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.xs,
  },
  statValue: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.extrabold,
    color: Colors.text.primary,
  },
  statLabel: {
    fontSize: Typography.sizes.xs,
    color: Colors.text.secondary,
    fontWeight: Typography.weights.medium,
    marginTop: 2,
  },
  actionCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.neutral.white,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    ...Shadows.sm,
  },
  actionIconBg: {
    backgroundColor: Colors.themes.provider.primary + "15",
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  actionTextContainer: {
    flex: 1,
  },
  actionTitle: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.bold,
    color: Colors.text.primary,
  },
  actionSubtitle: {
    fontSize: 11,
    color: Colors.text.secondary,
    marginTop: 2,
  },
  actionChevron: {
    width: 28,
    height: 28,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.themes.provider.primary + "10",
    alignItems: "center",
    justifyContent: "center",
  },
  infoCard: {
    flexDirection: "row",
    backgroundColor: Colors.themes.provider.primary + "10",
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  infoText: {
    flex: 1,
    fontSize: Typography.sizes.xs,
    color: Colors.themes.provider.primaryDark,
    lineHeight: 18,
    fontWeight: Typography.weights.medium,
  },
  staffBanner: {
    flexDirection: "row",
    backgroundColor: Colors.themes.provider.background,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    alignItems: "center",
    gap: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.themes.provider.accent + "30",
  },
  staffBannerIcon: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.themes.provider.primary + "15",
    alignItems: "center",
    justifyContent: "center",
  },
  staffBannerContent: {
    flex: 1,
  },
  staffBannerTitle: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.bold,
    color: Colors.themes.provider.primary,
    marginBottom: 2,
  },
  staffBannerSubtitle: {
    fontSize: Typography.sizes.xs,
    color: Colors.text.secondary,
    lineHeight: 18,
  },
  profileInProgressCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    gap: 12,
    borderWidth: 1.5,
    borderColor: "#2563EB25",
    ...Shadows.sm,
  },
  profileInProgressAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#EFF6FF",
    borderWidth: 1.5,
    borderColor: Colors.themes.provider.primary,
  },
  inProgressBadgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 2,
  },
  inProgressPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#FEF3C7",
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: BorderRadius.full,
  },
  inProgressDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#D97706",
  },
  inProgressPillText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#B45309",
    textTransform: "uppercase",
  },
  inProgressTimeText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#6B7280",
  },
  inProgressTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: Colors.text.primary,
  },
  inProgressSub: {
    fontSize: 11,
    color: Colors.text.secondary,
    marginTop: 1,
    lineHeight: 15,
  },
});
