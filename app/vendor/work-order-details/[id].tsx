import FileGallery from "@/components/FileGallery";
import { FloatingChatButton } from "@/components/Chat/FloatingChatButton";
import Modal from "@/components/Modal";
import {
  ActionButtons,
  CustomerInfoSection,
  ProductInfoSection,
  ReasonModal,
  ScheduleModal,
  ServiceHeaderCard,
  ServiceInfoSection,
  WorkOrderHeader,
} from "@/components/work-order-details";
import Colors from "@/constants/Colors";
import { BorderRadius, Shadows, Spacing, Typography } from "@/constants/Styles";
import { useWorkOrder } from "@/hooks/useWorkOrder";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams } from "expo-router";
import { useState } from "react";
import StaffSelectionModal from "@/components/work-order-details/StaffSelectionModal";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

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
          <Text style={styles.loadingText}>Loading details...</Text>
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
          <Text style={styles.errorTitle}>Job Not Found</Text>
          <Text style={styles.errorText}>Unable to load job details</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <WorkOrderHeader statusName={workOrder.status.name} workOrderId={id} />

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
        <ServiceHeaderCard
          serviceName={workOrder.service?.name || "Service"}
          parentServiceName={workOrder.parent_service?.name}
          workOrderNumber={workOrder.work_order_number}
          createdAt={workOrder.created_at}
          assignedAt={workOrder.assigned_at}
          productImage={workOrder.product?.image}
          brandName={workOrder.brand?.name}
          priority={workOrder.priority}
          categoryName={workOrder.category?.name}
          brandComplaintNo={workOrder.brand_complaint_no}
        />

        <CustomerInfoSection
          customer={workOrder.customer}
          address={workOrder.address}
          extraNumber={workOrder.extra_number}
        />

        <ServiceInfoSection
          product={workOrder.product}
          category={workOrder.category}
          parentService={workOrder.parent_service}
          service={workOrder.service}
          serviceConcern={workOrder.service_sub_concern}
          serviceSubConcern={workOrder.service_concern}
          warrantyType={workOrder.warranty_type}
          isWarrantyCase={!!workOrder.is_warranty_case}
          warrantyStatus={workOrder.warrentyStatus}
          subStatus={workOrder.sub_status}
          customerDescription={workOrder.customer_description}
          reminders={workOrder.reminders}
          assignmentMessage={workOrder.notes}
        />

        <ProductInfoSection
          brand={workOrder.brand}
          product={workOrder.product}
          productIndoorModel={workOrder.product_indoor_model}
          indoorSerialNumber={workOrder.indoor_serial_number}
          productOutdoorModel={workOrder.product_outdoor_model}
          outdoorSerialNumber={workOrder.outdoor_serial_number}
          purchaseDate={workOrder.purchase_date}
          isWarrantyCase={!!workOrder.is_warranty_case}
          technicianRemarks={workOrder.technician_remarks}
          reference={workOrder.reference}
          extraNumber={workOrder.extra_number}
        />

        <View style={styles.section}>
          <FileGallery files={workOrder.files || []} title="Photos/Documents" />
        </View>

        {workOrder.accepted_at && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleRow}>
                <Ionicons
                  name="people-outline"
                  size={18}
                  color={Colors.themes.provider.primary}
                />
                <Text style={styles.sectionTitle}>Field Team</Text>
              </View>
              <TouchableOpacity
                style={styles.assignButton}
                onPress={() => setShowStaffModal(true)}
              >
                <Text style={styles.assignButtonText}>
                  {workOrder.vendor_staff ? "Change Staff" : "Assign Staff"}
                </Text>
              </TouchableOpacity>
            </View>
            <View style={styles.sectionContent}>
              {workOrder.vendor_staff ? (
                <View style={styles.assignedStaffCard}>
                  <View style={styles.staffAvatarSmall}>
                    <Text style={styles.avatarTextSmall}>
                      {workOrder.vendor_staff.name.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.staffDetails}>
                    <Text style={styles.staffNameText}>
                      {workOrder.vendor_staff.name}
                    </Text>
                    <Text style={styles.staffPhoneText}>
                      {workOrder.vendor_staff.phone}
                    </Text>
                  </View>
                  <View style={styles.statusBadgeSmall}>
                    <Text style={styles.statusBadgeTextSmall}>Assigned</Text>
                  </View>
                </View>
              ) : (
                <View style={styles.emptyStaffState}>
                  <Text style={styles.emptyStaffText}>
                    No staff assigned yet.
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}

        <ActionButtons
          workOrderId={Number(id)}
          isPendingAcceptance={isPendingAcceptance}
          isAccepted={isAccepted}
          currentStatusSlug={currentStatusSlug}
          currentSubStatusSlug={currentSubStatusSlug}
          accepting={accepting}
          rejecting={rejecting}
          updatingStatus={updatingStatus}
          onAccept={() => setShowAcceptModal(true)}
          onReject={() => setShowRejectModal(true)}
          onCancel={() => setShowCancelModal(true)}
          onSchedule={() => setShowScheduleModal(true)}
          onStatusUpdate={handleStatusButtonPress}
        />
      </ScrollView>

      <Modal
        visible={showAcceptModal}
        type="confirm"
        title="Accept Job"
        message="Are you sure you want to accept this job?"
        actions={[
          {
            text: "Cancel",
            onPress: () => setShowAcceptModal(false),
            variant: "outline",
          },
          { text: "Accept", onPress: onAccept, variant: "primary" },
        ]}
        onClose={() => setShowAcceptModal(false)}
      />

      <ReasonModal
        visible={showRejectModal}
        title="Reject Job"
        message="Please provide a reason for rejection:"
        placeholder="Enter rejection reason..."
        confirmText="Reject"
        loading={rejecting}
        onConfirm={onReject}
        onCancel={() => setShowRejectModal(false)}
      />

      <ReasonModal
        visible={showCancelModal}
        title="Cancel Job"
        message="Please provide a reason for cancellation:"
        placeholder="Enter cancellation reason..."
        confirmText="Cancel Job"
        loading={rejecting}
        onConfirm={onCancelOrder}
        onCancel={() => setShowCancelModal(false)}
      />

      <ScheduleModal
        visible={showScheduleModal}
        loading={updatingStatus}
        onConfirm={onScheduleOrder}
        onCancel={() => setShowScheduleModal(false)}
      />

      <ReasonModal
        visible={showStatusModal}
        title="Update Status"
        message={`Update job status to ${pendingStatusUpdate?.statusName}?`}
        placeholder="Add remarks or comments (optional)..."
        confirmText="Confirm"
        loading={updatingStatus}
        onConfirm={onStatusUpdate}
        onCancel={() => {
          setShowStatusModal(false);
          clearStatusUpdate();
        }}
      />

      <Modal
        visible={showSuccessModal}
        type="success"
        title="Success"
        message={modalMessage}
        onClose={() => setShowSuccessModal(false)}
      />
      <Modal
        visible={showErrorModal}
        type="error"
        title="Error"
        message={modalMessage}
        onClose={() => setShowErrorModal(false)}
      />

      <StaffSelectionModal
        visible={showStaffModal}
        staff={approvedStaff}
        onSelect={onAssignStaff}
        onClose={() => setShowStaffModal(false)}
        loading={updatingStatus}
      />

      {isAccepted && <FloatingChatButton workOrderId={id} />}
    </SafeAreaView>
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
