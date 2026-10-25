import { localizedToast } from "@/lib/i18n/localized-toast";
import { localizedAlert } from "@/lib/i18n/localized-alert";
import AppText from "@/components/common/AppText";
import DirectionalIcon from "@/components/common/DirectionalIcon";
import React, { useState, useCallback } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Colors from "@/constants/Colors";
import { Spacing, Typography, BorderRadius, Shadows } from "@/constants/Styles";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useFocusEffect } from "expo-router";
import myAxios from "@/lib/axios.config";
import {
  VENDOR_STAFF_URL,
  VENDOR_STAFF_TOGGLE_STATUS_URL,
  VENDOR_STAFF_DELETE_URL,
  VENDOR_STAFF_RESET_PASSWORD_URL,
} from "@/lib/api-endpoints";
import getImageUrl from "@/lib/utils";
import Toast from "react-native-toast-message";

interface StaffMember {
  id: number;
  name: string;
  phone: string;
  email?: string;
  cnic?: string;
  status: string;
  experience?: string;
  image?: string;
  assigned_work_orders_count?: number;
  active_work_orders_count?: number;
  completed_work_orders_count?: number;
  created_at: string;
}

export default function VendorStaffList() {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionStaffId, setActionStaffId] = useState<number | null>(null);

  useFocusEffect(
    useCallback(() => {
      fetchStaff();
    }, []),
  );

  const fetchStaff = async () => {
    try {
      const res = await myAxios.get(VENDOR_STAFF_URL);
      setStaff(res.data?.data || []);
    } catch (e) {
      console.log("Error fetching staff:", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleToggleStatus = async (id: number) => {
    try {
      const res = await myAxios.post(VENDOR_STAFF_TOGGLE_STATUS_URL(id));
      localizedToast({
        type: "success",
        text1: res.data?.message || "Status updated",
      });
      fetchStaff();
    } catch (e: any) {
      localizedToast({
        type: "error",
        text1: e.response?.data?.message || "Failed",
      });
    }
    setActionStaffId(null);
  };

  const handleDelete = (id: number, name: string) => {
    localizedAlert(
      "Remove Staff",
      `Are you sure you want to remove ${name}? This will unassign them from all work orders.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            try {
              await myAxios.delete(VENDOR_STAFF_DELETE_URL(id));
              localizedToast({ type: "success", text1: "Staff member removed" });
              fetchStaff();
            } catch (e: any) {
              localizedToast({
                type: "error",
                text1: e.response?.data?.message || "Failed",
              });
            }
          },
        },
      ],
    );
    setActionStaffId(null);
  };

  const handleResetPassword = async (id: number) => {
    try {
      const res = await myAxios.post(VENDOR_STAFF_RESET_PASSWORD_URL(id));
      localizedToast({
        type: "success",
        text1: "Password Reset",
        text2: `New password: ${res.data?.default_password}`,
        visibilityTime: 6000,
      });
    } catch (e: any) {
      localizedToast({
        type: "error",
        text1: e.response?.data?.message || "Failed",
      });
    }
    setActionStaffId(null);
  };

  const StatBadge = ({ icon, count, label, color }: any) => (
    <View style={[styles.statBadge, { backgroundColor: color + "10" }]}>
      <Ionicons name={icon} size={12} color={color} />
      <AppText style={[styles.statCount, { color }]}>{count}</AppText>
      <AppText style={styles.statLabel}>{label}</AppText>
    </View>
  );

  const renderItem = ({ item }: { item: StaffMember }) => {
    const isApproved = item.status === "approved";
    const showActions = actionStaffId === item.id;

    return (
      <View style={styles.card}>
        <View style={styles.cardTop}>
          <View style={styles.avatarRow}>
            <View
              style={[
                styles.avatar,
                isApproved ? styles.avatarActive : styles.avatarInactive,
              ]}
            >
              {item.image ? (
                <Image
                  source={{
                    uri: getImageUrl(item.image),
                  }}
                  style={styles.avatarImage}
                />
              ) : (
                <AppText style={styles.avatarText}>
                  {item.name.charAt(0).toUpperCase()}
                </AppText>
              )}
            </View>
            <View style={styles.staffInfo}>
              <AppText style={styles.staffName}>{item.name}</AppText>
              {item.experience ? (
                <AppText style={styles.experienceText}>{item.experience}</AppText>
              ) : null}
              <View style={styles.contactRow}>
                <Ionicons
                  name="call-outline"
                  size={12}
                  color={Colors.text.tertiary}
                />
                <AppText style={styles.staffPhone}>{item.phone}</AppText>
              </View>
            </View>
          </View>
          <View style={styles.cardTopRight}>
            <View
              style={[
                styles.statusBadge,
                isApproved ? styles.statusApproved : styles.statusPending,
              ]}
            >
              <View
                style={[
                  styles.statusDot,
                  {
                    backgroundColor: isApproved
                      ? Colors.success
                      : Colors.warning,
                  },
                ]}
              />
              <AppText
                style={[
                  styles.statusText,
                  isApproved
                    ? styles.statusTextApproved
                    : styles.statusTextPending,
                ]}
              >
                {isApproved
                  ? "Active"
                  : item.status === "rejected"
                    ? "Suspended"
                    : "Pending"}
              </AppText>
            </View>
            <TouchableOpacity
              style={styles.moreBtn}
              onPress={() => setActionStaffId(showActions ? null : item.id)}
            >
              <Ionicons
                name="ellipsis-vertical"
                size={18}
                color={Colors.text.secondary}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Work Order Stats */}
        <View style={styles.statsRow}>
          <StatBadge
            icon="briefcase"
            count={item.assigned_work_orders_count || 0}
            label="Total"
            color={Colors.themes.provider.primary}
          />
          <StatBadge
            icon="construct"
            count={item.active_work_orders_count || 0}
            label="Active"
            color={Colors.warning}
          />
          <StatBadge
            icon="checkmark-circle"
            count={item.completed_work_orders_count || 0}
            label="Done"
            color={Colors.success}
          />
        </View>

        {/* View Progress Button */}
        <TouchableOpacity
          style={styles.viewProgressBtn}
          onPress={() => router.push(`/vendor/staff/${item.id}` as any)}
          activeOpacity={0.7}
        >
          <Ionicons
            name="analytics-outline"
            size={16}
            color={Colors.themes.provider.primary}
          />
          <AppText style={styles.viewProgressText}>
            View Progress & Work Orders
          </AppText>
          <DirectionalIcon
            name="chevron-forward"
            size={16}
            color={Colors.themes.provider.primary}
          />
        </TouchableOpacity>

        {/* Actions dropdown */}
        {showActions && (
          <View style={styles.actionsMenu}>
            <TouchableOpacity
              style={styles.actionItem}
              onPress={() => handleToggleStatus(item.id)}
            >
              <Ionicons
                name={
                  isApproved ? "pause-circle-outline" : "play-circle-outline"
                }
                size={18}
                color={isApproved ? Colors.warning : Colors.success}
              />
              <AppText style={styles.actionText}>
                {isApproved ? "Suspend" : "Activate"}
              </AppText>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionItem}
              onPress={() => handleResetPassword(item.id)}
            >
              <Ionicons name="key-outline" size={18} color={Colors.info} />
              <AppText style={styles.actionText}>Reset Password</AppText>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionItem}
              onPress={() => handleDelete(item.id, item.name)}
            >
              <Ionicons name="trash-outline" size={18} color={Colors.error} />
              <AppText style={[styles.actionText, { color: Colors.error }]}>
                Remove
              </AppText>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backBtn}
          activeOpacity={0.7}
        >
          <DirectionalIcon name="arrow-back" size={24} color={Colors.text.primary} />
        </TouchableOpacity>
        <AppText style={styles.headerTitle}>Staff Management</AppText>
        <TouchableOpacity
          onPress={() => router.push("/vendor/staff/add" as any)}
          style={styles.addBtn}
          activeOpacity={0.7}
        >
            <Ionicons
              name="add-circle"
              size={28}
              color={Colors.themes.provider.primary}
            />
          </TouchableOpacity>
      </View>

      {/* Summary bar */}
      {!loading && staff.length > 0 && (
        <View style={styles.summaryBar}>
          <View style={styles.summaryItem}>
            <AppText style={styles.summaryCount}>{staff.length}</AppText>
            <AppText style={styles.summaryLabel}>Total</AppText>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <AppText style={[styles.summaryCount, { color: Colors.success }]}>
              {staff.filter((s) => s.status === "approved").length}
            </AppText>
            <AppText style={styles.summaryLabel}>Active</AppText>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <AppText style={[styles.summaryCount, { color: Colors.warning }]}>
              {staff.reduce((a, s) => a + (s.active_work_orders_count || 0), 0)}
            </AppText>
            <AppText style={styles.summaryLabel}>Jobs Active</AppText>
          </View>
        </View>
      )}

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator
            size="large"
            color={Colors.themes.provider.primary}
          />
        </View>
      ) : (
        <FlatList
          data={staff}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                fetchStaff();
              }}
              colors={[Colors.themes.provider.primary]}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIcon}>
                <Ionicons
                  name="people-outline"
                  size={48}
                  color={Colors.themes.provider.primary}
                />
              </View>
              <AppText style={styles.emptyTitle}>No Team Members Yet</AppText>
              <AppText style={styles.emptyText}>
                Add staff members to your team and assign them to work orders.
              </AppText>
              <TouchableOpacity
                style={styles.emptyButton}
                onPress={() => router.push("/vendor/staff/add" as any)}
                activeOpacity={0.8}
              >
                <Ionicons name="add" size={20} color={Colors.neutral.white} />
                <AppText style={styles.emptyButtonText}>Add First Staff</AppText>
              </TouchableOpacity>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background.secondary },
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
  backBtn: { padding: Spacing.xs },
  headerTitle: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.bold,
    color: Colors.text.primary,
  },
  addBtn: { padding: Spacing.xs },
  summaryBar: {
    flexDirection: "row",
    backgroundColor: Colors.neutral.white,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.lg,
  },
  summaryItem: {
    alignItems: "center",
  },
  summaryCount: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.extrabold,
    color: Colors.text.primary,
  },
  summaryLabel: {
    fontSize: 10,
    color: Colors.text.tertiary,
    fontWeight: Typography.weights.medium,
  },
  summaryDivider: {
    width: 1,
    height: 28,
    backgroundColor: Colors.border.light,
  },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  list: { padding: Spacing.md, gap: Spacing.sm, paddingBottom: 80 },
  card: {
    backgroundColor: Colors.neutral.white,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border.light,
    ...Shadows.sm,
    overflow: "hidden",
  },
  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    padding: Spacing.md,
  },
  avatarRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    flex: 1,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarImage: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  avatarActive: {
    backgroundColor: Colors.themes.provider.primary,
  },
  avatarInactive: {
    backgroundColor: Colors.text.tertiary,
  },
  avatarText: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.bold,
    color: Colors.neutral.white,
  },
  staffInfo: {
    flex: 1,
  },
  staffName: {
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
    marginTop: 4,
  },
  staffPhone: {
    fontSize: Typography.sizes.xs,
    color: Colors.text.secondary,
  },
  cardTopRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    gap: 4,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusPending: { backgroundColor: Colors.warning + "15" },
  statusApproved: { backgroundColor: Colors.success + "15" },
  statusText: {
    fontSize: Typography.sizes.xs - 2,
    fontWeight: Typography.weights.bold,
  },
  statusTextPending: { color: Colors.warning },
  statusTextApproved: { color: Colors.success },
  moreBtn: {
    padding: 4,
  },
  statsRow: {
    flexDirection: "row",
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  statBadge: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingVertical: 6,
    borderRadius: BorderRadius.sm,
  },
  statCount: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.extrabold,
  },
  statLabel: {
    fontSize: 9,
    color: Colors.text.tertiary,
    fontWeight: Typography.weights.medium,
  },
  viewProgressBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border.light,
    backgroundColor: Colors.themes.provider.primary + "05",
  },
  viewProgressText: {
    flex: 1,
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.semibold,
    color: Colors.themes.provider.primary,
  },
  actionsMenu: {
    borderTopWidth: 1,
    borderTopColor: Colors.border.light,
    backgroundColor: Colors.background.tertiary,
    paddingVertical: Spacing.xs,
  },
  actionItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
  },
  actionText: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.primary,
    fontWeight: Typography.weights.medium,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: Spacing.xxl * 2,
    paddingHorizontal: Spacing.xl,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.themes.provider.primary + "10",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.md,
  },
  emptyTitle: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.bold,
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },
  emptyText: {
    color: Colors.text.secondary,
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.medium,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: Spacing.lg,
  },
  emptyButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: Colors.themes.provider.primary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 12,
    borderRadius: BorderRadius.sm,
    ...Shadows.md,
  },
  emptyButtonText: {
    color: Colors.neutral.white,
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.bold,
  },
});
