import AppText from "@/components/common/AppText";
import Colors from "@/constants/Colors";
import { BorderRadius, Shadows, Spacing, Typography } from "@/constants/Styles";
import { useWorkOrder } from "@/hooks/useWorkOrder";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import UberVendorWorkOrderView from "@/components/work-order-details/UberVendorWorkOrderView";

export default function VendorWorkOrderDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  // Modal visibility states
  const [showAcceptModal, setShowAcceptModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showStaffModal, setShowStaffModal] = useState(false);

  // Custom hook for logic
  const {
    workOrder,
    loading,
    refreshing,
    approvedStaff,
    accepting,
    rejecting,
    updatingStatus,
    isPendingAcceptance,
    isAccepted,
    currentStatusSlug,
    currentSubStatusSlug,
    pendingStatusUpdate,
    modalMessage,
    showSuccessModal,
    showErrorModal,
    onRefresh,
    handleAccept,
    handleReject,
    handleCancel,
    handleSchedule,
    handleAssignStaff,
    handleUpdateStatus,
    showStatusUpdateModal,
    clearStatusUpdate,
    setShowSuccessModal,
    setShowErrorModal,
  } = useWorkOrder(id);

  const onAssignStaff = async (staffId: number) => {
    setShowStaffModal(false);
    await handleAssignStaff(staffId);
  };

  const onAccept = async () => {
    setShowAcceptModal(false);
    await handleAccept();
  };

  const onReject = async (reason: string) => {
    setShowRejectModal(false);
    await handleReject(reason);
  };

  const onCancelOrder = async (reason: string) => {
    setShowCancelModal(false);
    await handleCancel(reason);
  };

  const onScheduleOrder = async (
    date: string,
    time: string,
    remarks: string,
  ) => {
    setShowScheduleModal(false);
    await handleSchedule(date, time, remarks);
  };

  const onStatusUpdate = async (remarks: string) => {
    setShowStatusModal(false);
    await handleUpdateStatus(remarks);
  };

  const handleStatusButtonPress = (
    statusSlug: string,
    subStatusSlug: string,
    statusName: string,
  ) => {
    showStatusUpdateModal(statusSlug, subStatusSlug, statusName);
    setShowStatusModal(true);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator
            size="large"
            color={Colors.themes.provider.primary}
          />
          <AppText style={styles.loadingText}>Loading details...</AppText>
        </View>
      </SafeAreaView>
    );
  }

  if (!workOrder) {
    return (
      <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
        <View style={styles.errorContainer}>
          <Ionicons
            name="alert-circle-outline"
            size={64}
            color={Colors.text.tertiary}
          />
          <AppText style={styles.errorTitle}>Job Not Found</AppText>
          <AppText style={styles.errorText}>Unable to load job details</AppText>
        </View>
      </SafeAreaView>
    );
  }

  // Modern Uber / inDrive / Yango Map & Bottom Sheet View
  return (
    <UberVendorWorkOrderView
      workOrder={workOrder}
      id={id}
      refreshing={refreshing}
      onRefresh={onRefresh}
      approvedStaff={approvedStaff}
      accepting={accepting}
      rejecting={rejecting}
      updatingStatus={updatingStatus}
      isPendingAcceptance={isPendingAcceptance}
      isAccepted={isAccepted}
      currentStatusSlug={currentStatusSlug || ""}
      currentSubStatusSlug={currentSubStatusSlug}
      pendingStatusUpdate={pendingStatusUpdate}
      modalMessage={modalMessage}
      showSuccessModal={showSuccessModal}
      showErrorModal={showErrorModal}
      handleAccept={handleAccept}
      handleReject={handleReject}
      handleCancel={handleCancel}
      handleSchedule={handleSchedule}
      handleAssignStaff={handleAssignStaff}
      handleUpdateStatus={handleUpdateStatus}
      showStatusUpdateModal={showStatusUpdateModal}
      clearStatusUpdate={clearStatusUpdate}
      setShowSuccessModal={setShowSuccessModal}
      setShowErrorModal={setShowErrorModal}
    />
  );

}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F3F4F6" },
  content: { flex: 1 },
  scrollContent: { padding: 12, paddingBottom: 100, gap: 10 },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: Spacing.md,
  },
  loadingText: { fontSize: 13, color: Colors.text.secondary },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.xl,
    gap: Spacing.sm,
  },
  errorTitle: { fontSize: 16, fontWeight: "700", color: Colors.text.primary },
  errorText: {
    fontSize: 13,
    color: Colors.text.secondary,
    textAlign: "center",
  },
  section: {
    backgroundColor: Colors.neutral.white,
    borderRadius: BorderRadius.md,
    ...Shadows.sm,
    overflow: "hidden",
    marginTop: Spacing.xs,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  sectionTitleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  sectionTitle: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.bold,
    color: Colors.text.primary,
    textTransform: "uppercase",
  },
  sectionContent: { padding: Spacing.md },
  assignButton: {
    backgroundColor: Colors.themes.provider.primary + "10",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  assignButtonText: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.bold,
    color: Colors.themes.provider.primary,
  },
  assignedStaffCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.background.secondary,
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border.light,
  },
  staffAvatarSmall: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.themes.provider.primary,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.sm,
  },
  avatarTextSmall: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.bold,
    color: Colors.neutral.white,
  },
  staffDetails: { flex: 1 },
  staffNameText: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.bold,
    color: Colors.text.primary,
  },
  staffPhoneText: {
    fontSize: Typography.sizes.xs,
    color: Colors.text.secondary,
  },
  statusBadgeSmall: {
    backgroundColor: Colors.success + "20",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  statusBadgeTextSmall: {
    fontSize: 8,
    fontWeight: Typography.weights.bold,
    color: Colors.success,
    textTransform: "uppercase",
  },
  emptyStaffState: { paddingVertical: Spacing.xs },
  emptyStaffText: {
    fontSize: Typography.sizes.xs,
    color: Colors.text.tertiary,
    fontStyle: "italic",
  },
});
