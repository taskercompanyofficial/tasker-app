import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Colors from "@/constants/Colors";
import { Spacing, Typography, BorderRadius, Shadows } from "@/constants/Styles";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import myAxios from "@/lib/axios.config";
import {
  VENDOR_STAFF_DETAILS_URL,
  VENDOR_STAFF_WORK_ORDERS_URL_BY_ID,
} from "@/lib/api-endpoints";

type TabType = "all" | "active" | "completed";

export default function StaffDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const staffId = Number(id);

  const [staff, setStaff] = useState<any>(null);
  const [workOrders, setWorkOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [woLoading, setWoLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>("all");

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [])
  );

  const fetchData = async () => {
    await Promise.all([fetchStaffDetail(), fetchWorkOrders()]);
  };

  const fetchStaffDetail = async () => {
    try {
      const res = await myAxios.get(VENDOR_STAFF_DETAILS_URL(staffId));
      setStaff(res.data?.data || null);
    } catch (e) {
      console.log("Error fetching staff detail:", e);
    } finally {
      setLoading(false);
    }
  };

  const fetchWorkOrders = async (status?: string) => {
    try {
      setWoLoading(true);
      let url = VENDOR_STAFF_WORK_ORDERS_URL_BY_ID(staffId);
      if (status && status !== "all") {
        url += `?status=${status}`;
      }
      const res = await myAxios.get(url);
      setWorkOrders(res.data?.data || []);
    } catch (e) {
      console.log("Error fetching staff work orders:", e);
    } finally {
      setWoLoading(false);
      setRefreshing(false);
    }
  };

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    fetchWorkOrders(tab);
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const getStatusColor = (slug: string) => {
    if (slug === "completed") return Colors.success;
    if (slug === "in-progress") return Colors.warning;
    if (slug === "dispatched") return Colors.info;
    if (slug === "cancelled") return Colors.error;
    return Colors.text.tertiary;
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.themes.provider.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!staff) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.center}>
          <Ionicons name="alert-circle-outline" size={48} color={Colors.text.tertiary} />
          <Text style={styles.errorText}>Staff member not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const stats = staff.stats || {};
  const isApproved = staff.status === "approved";

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Staff Progress</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 80 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[Colors.themes.provider.primary]}
          />
        }
      >
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.profileRow}>
            <View style={[styles.avatar, isApproved ? styles.avatarActive : styles.avatarInactive]}>
              {staff.image ? (
                <Image
                  source={{ uri: `${process.env.EXPO_PUBLIC_STORAGE_URL}/${staff.image}` }}
                  style={styles.avatarImage}
                />
              ) : (
                <Text style={styles.avatarText}>
                  {staff.name.charAt(0).toUpperCase()}
                </Text>
              )}
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{staff.name}</Text>
              {staff.experience ? (
                <Text style={styles.experienceText}>{staff.experience}</Text>
              ) : null}
              <View style={styles.contactRow}>
                <Ionicons name="call-outline" size={13} color={Colors.text.tertiary} />
                <Text style={styles.profilePhone}>{staff.phone}</Text>
              </View>
            </View>
            <View
              style={[
                styles.statusChip,
                { backgroundColor: (isApproved ? Colors.success : Colors.warning) + "15" },
              ]}
            >
              <View
                style={[
                  styles.statusDot,
                  { backgroundColor: isApproved ? Colors.success : Colors.warning },
                ]}
              />
              <Text
                style={[
                  styles.statusChipText,
                  { color: isApproved ? Colors.success : Colors.warning },
                ]}
              >
                {isApproved ? "Active" : "Suspended"}
              </Text>
            </View>
          </View>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: Colors.themes.provider.primary + "15" }]}>
              <Ionicons name="briefcase" size={20} color={Colors.themes.provider.primary} />
            </View>
            <Text style={styles.statNumber}>{stats.total_assigned || 0}</Text>
            <Text style={styles.statTitle}>Total Assigned</Text>
          </View>
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: Colors.warning + "15" }]}>
              <Ionicons name="construct" size={20} color={Colors.warning} />
            </View>
            <Text style={styles.statNumber}>{stats.active || 0}</Text>
            <Text style={styles.statTitle}>In Progress</Text>
          </View>
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: Colors.success + "15" }]}>
              <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
            </View>
            <Text style={styles.statNumber}>{stats.completed || 0}</Text>
            <Text style={styles.statTitle}>Completed</Text>
          </View>
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: Colors.info + "15" }]}>
              <Ionicons name="calendar" size={20} color={Colors.info} />
            </View>
            <Text style={styles.statNumber}>{stats.completed_this_month || 0}</Text>
            <Text style={styles.statTitle}>This Month</Text>
          </View>
        </View>

        {/* Work Orders Section */}
        <View style={styles.woSection}>
          <Text style={styles.woSectionTitle}>Assigned Work Orders</Text>

          {/* Tabs */}
          <View style={styles.tabsRow}>
            {[
              { key: "all" as TabType, label: "All", icon: "list" },
              { key: "active" as TabType, label: "Active", icon: "construct" },
              { key: "completed" as TabType, label: "Completed", icon: "checkmark-circle" },
            ].map((tab) => (
              <TouchableOpacity
                key={tab.key}
                style={[styles.tab, activeTab === tab.key && styles.tabActive]}
                onPress={() => handleTabChange(tab.key)}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={tab.icon as any}
                  size={14}
                  color={
                    activeTab === tab.key
                      ? Colors.themes.provider.primary
                      : Colors.text.secondary
                  }
                />
                <Text
                  style={[
                    styles.tabText,
                    activeTab === tab.key && styles.tabTextActive,
                  ]}
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Work Orders List */}
          {woLoading ? (
            <View style={{ paddingVertical: 40, alignItems: "center" }}>
              <ActivityIndicator color={Colors.themes.provider.primary} />
            </View>
          ) : workOrders.length === 0 ? (
            <View style={styles.emptyWo}>
              <Ionicons name="document-outline" size={36} color={Colors.text.tertiary} />
              <Text style={styles.emptyWoText}>
                No {activeTab !== "all" ? activeTab : ""} work orders assigned
              </Text>
            </View>
          ) : (
            workOrders.map((wo) => (
              <TouchableOpacity
                key={wo.id}
                style={styles.woCard}
                activeOpacity={0.7}
                onPress={() =>
                  router.push({
                    pathname: "/vendor/work-order-details/[id]",
                    params: { id: wo.id.toString() },
                  } as any)
                }
              >
                <View style={styles.woCardTop}>
                  <View style={styles.woInfo}>
                    <Text style={styles.woNumber}>{wo.work_order_number}</Text>
                    <Text style={styles.woService}>
                      {wo.parent_service?.name || wo.service?.name || "Service"}
                    </Text>
                    {wo.customer && (
                      <Text style={styles.woCustomer}>
                        <Ionicons name="person-outline" size={11} />
                        {"  "}
                        {wo.customer.name}
                      </Text>
                    )}
                    {wo.address && (
                      <Text style={styles.woAddress}>
                        <Ionicons name="location-outline" size={11} />
                        {"  "}
                        {wo.address.city}, {wo.address.state}
                      </Text>
                    )}
                  </View>
                  <View>
                    <View
                      style={[
                        styles.woStatusBadge,
                        {
                          backgroundColor:
                            getStatusColor(wo.status?.slug || "") + "15",
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.woStatusText,
                          { color: getStatusColor(wo.status?.slug || "") },
                        ]}
                      >
                        {wo.status?.name || "Unknown"}
                      </Text>
                    </View>
                    <Text style={styles.woDate}>
                      {new Date(wo.created_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))
          )}
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
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: Spacing.md,
  },
  errorText: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.secondary,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.md,
    height: 56,
    backgroundColor: Colors.neutral.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  backBtn: {
    padding: Spacing.xs,
  },
  headerTitle: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.bold,
    color: Colors.text.primary,
  },

  // Profile Card
  profileCard: {
    backgroundColor: Colors.neutral.white,
    margin: Spacing.md,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    ...Shadows.sm,
  },
  profileRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarActive: {
    backgroundColor: Colors.themes.provider.primary,
  },
  avatarInactive: {
    backgroundColor: Colors.text.tertiary,
  },
  avatarText: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.bold,
    color: Colors.neutral.white,
  },
  avatarImage: {
    width: 52,
    height: 52,
    borderRadius: 26,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.bold,
    color: Colors.text.primary,
  },
  experienceText: {
    fontSize: Typography.sizes.xs,
    color: Colors.themes.provider.primary,
    fontWeight: Typography.weights.semibold,
    marginTop: 1,
  },
  contactRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 2,
  },
  profilePhone: {
    fontSize: Typography.sizes.xs,
    color: Colors.text.secondary,
  },
  statusChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    gap: 4,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusChipText: {
    fontSize: Typography.sizes.xs - 1,
    fontWeight: Typography.weights.bold,
  },

  // Stats Grid
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  statCard: {
    flex: 1,
    minWidth: "45%",
    backgroundColor: Colors.neutral.white,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    alignItems: "center",
    ...Shadows.sm,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  statNumber: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.extrabold,
    color: Colors.text.primary,
  },
  statTitle: {
    fontSize: Typography.sizes.xs - 1,
    color: Colors.text.tertiary,
    fontWeight: Typography.weights.medium,
    marginTop: 2,
  },

  // Work Orders Section
  woSection: {
    paddingHorizontal: Spacing.md,
  },
  woSectionTitle: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.bold,
    color: Colors.text.primary,
    marginBottom: Spacing.sm,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  tabsRow: {
    flexDirection: "row",
    gap: 6,
    marginBottom: Spacing.sm,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingVertical: 8,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.neutral.white,
    ...Shadows.sm,
  },
  tabActive: {
    backgroundColor: Colors.themes.provider.primary + "15",
  },
  tabText: {
    fontSize: 11,
    fontWeight: Typography.weights.semibold,
    color: Colors.text.secondary,
  },
  tabTextActive: {
    color: Colors.themes.provider.primary,
  },
  emptyWo: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.xxl,
    gap: Spacing.sm,
  },
  emptyWoText: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.tertiary,
    fontWeight: Typography.weights.medium,
  },
  woCard: {
    backgroundColor: Colors.neutral.white,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.xs,
    ...Shadows.sm,
    borderLeftWidth: 3,
    borderLeftColor: Colors.themes.provider.primary,
  },
  woCardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  woInfo: {
    flex: 1,
    marginRight: Spacing.sm,
  },
  woNumber: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.bold,
    color: Colors.themes.provider.primary,
    marginBottom: 2,
  },
  woService: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.semibold,
    color: Colors.text.primary,
    marginBottom: 4,
  },
  woCustomer: {
    fontSize: Typography.sizes.xs,
    color: Colors.text.secondary,
    marginBottom: 2,
  },
  woAddress: {
    fontSize: Typography.sizes.xs,
    color: Colors.text.tertiary,
  },
  woStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
    alignSelf: "flex-end",
  },
  woStatusText: {
    fontSize: 9,
    fontWeight: Typography.weights.bold,
    textTransform: "uppercase",
  },
  woDate: {
    fontSize: 10,
    color: Colors.text.tertiary,
    textAlign: "right",
    marginTop: 6,
  },
});
