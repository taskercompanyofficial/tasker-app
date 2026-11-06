import AppText from "@/components/common/AppText";
import Button from "@/components/Button";
import Modal from "@/components/Modal";
import Colors from "@/constants/Colors";
import { useBarcodeScanner } from "@/hooks/useBarcodeScanner";
import { useFileUpload } from "@/hooks/useFileUpload";
import { useWorkOrderEdit } from "@/hooks/useWorkOrderEdit";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  BarcodeScanner,
  EditHeader,
  JobGuideModal,
  WorkOrderActivityTab,
  WorkOrderAttachmentsTab,
  WorkOrderDetailsTab,
  WorkOrderMinimalTabBar,
  WorkOrderTabKey,
} from "@/components/work-order-edit";
import { ServiceRequiredFile } from "@/types/work-order";

export default function VendorWorkOrderEditScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  // Active Tab state (details, attachments, activity)
  const [activeTab, setActiveTab] = useState<WorkOrderTabKey>("details");

  // Modal visibility
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [showGuideModal, setShowGuideModal] = useState(false);

  // Work order edit hook with form
  const {
    workOrder,
    loading,
    refreshing,
    form,
    completing,
    autoSaving,
    onRefresh,
    handleSaveDetails,
    handleCompleteWork,
    modalMessage,
    showSuccessModal,
    showErrorModal,
    setShowSuccessModal,
    setShowErrorModal,
    refreshWorkOrder,
  } = useWorkOrderEdit(id);

  // File upload hook
  const fileUpload = useFileUpload({
    workOrderId: Number(id),
    onSuccess: () => {
      setShowSuccessModal(true);
    },
    onError: () => {
      setShowErrorModal(true);
    },
    onFilesChanged: refreshWorkOrder,
  });

  // Barcode scanner hook (auto-attaches scanned barcode photo as document)
  const scanner = useBarcodeScanner({
    onIndoorScanned: (data, imageUri) => {
      form.setData("indoor_serial_number", data.toUpperCase());
      if (imageUri) {
        const ft = fileUpload.fileTypes.find(
          (f) =>
            f.slug === "indoor-serial" ||
            f.name?.toLowerCase().includes("indoor serial") ||
            f.name?.toLowerCase().includes("serial")
        );
        if (ft) {
          fileUpload.uploadDirectFile(imageUri, ft.id);
        }
      }
    },
    onOutdoorScanned: (data, imageUri) => {
      form.setData("outdoor_serial_number", data.toUpperCase());
      if (imageUri) {
        const ft = fileUpload.fileTypes.find(
          (f) =>
            f.slug === "outdoor-serial" ||
            f.name?.toLowerCase().includes("outdoor serial")
        );
        if (ft) {
          fileUpload.uploadDirectFile(imageUri, ft.id);
        }
      }
    },
    onWarrantyScanned: (data, imageUri) => {
      form.setData("warranty_serial_number", data.toUpperCase());
      if (imageUri) {
        const ft = fileUpload.fileTypes.find(
          (f) =>
            f.slug === "warranty-card" ||
            f.name?.toLowerCase().includes("warranty")
        );
        if (ft) {
          fileUpload.uploadDirectFile(imageUri, ft.id);
        }
      }
    },
    onError: () => {
      setShowErrorModal(true);
    },
  });

  // Complete work handler
  const onCompleteWork = async () => {
    setShowCompleteModal(false);
    await handleCompleteWork();
  };

  const requiredFileTypeIds = useMemo(() => {
    return (
      workOrder?.parent_service?.required_file_types
        ?.filter((rf: ServiceRequiredFile) => rf.is_required)
        .map((rf: ServiceRequiredFile) => rf.file_type_id) || []
    );
  }, [workOrder]);

  const uploadedReqCount = useMemo(() => {
    const reqSet = new Set(requiredFileTypeIds);
    return (workOrder?.files || []).filter((f) =>
      reqSet.has(f.file_type?.id || (f as any).file_type_id)
    ).length;
  }, [workOrder, requiredFileTypeIds]);

  const isWarrantyCase = useMemo(() => {
    const wTypeId = Number(
      form.data.warranty_type_id || workOrder?.warranty_type?.id
    );
    return [1, 3, 7].includes(wTypeId) || Boolean(workOrder?.is_warranty_case);
  }, [form.data.warranty_type_id, workOrder]);

  // Loading state
  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator
            size="large"
            color={Colors.themes.provider.primary}
          />
          <AppText style={styles.loadingText}>Loading...</AppText>
        </View>
      </SafeAreaView>
    );
  }

  // Error state
  if (!workOrder) {
    return (
      <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
        <View style={styles.errorContainer}>
          <Ionicons
            name="alert-circle-outline"
            size={48}
            color={Colors.text.tertiary}
          />
          <AppText style={styles.errorTitle}>Work Order Not Found</AppText>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      {/* Header: Transparent bg, Back btn, Order #, Service Name, Countdown badge */}
      <EditHeader
        onInfoPress={() => setShowGuideModal(true)}
        workOrderNumber={workOrder?.work_order_number || workOrder?.id}
        serviceName={
          workOrder?.parent_service?.name ||
          workOrder?.service?.name ||
          "Service Order"
        }
      />

      {/* Auto-save Indicator */}
      {autoSaving && (
        <View style={styles.autoSaveIndicator}>
          <ActivityIndicator
            size="small"
            color={Colors.themes.provider.primary}
          />
          <AppText style={styles.autoSaveText}>Auto-saving...</AppText>
        </View>
      )}

      {/* Minimal Tab Switcher (Details, Attachments, Activity) */}
      <WorkOrderMinimalTabBar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        requiredAttachmentsCount={requiredFileTypeIds.length}
        uploadedAttachmentsCount={uploadedReqCount}
        activityCount={workOrder?.histories?.length || 0}
      />

      {/* Main Content Area */}
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
        {activeTab === "details" && (
          <WorkOrderDetailsTab
            workOrder={workOrder}
            formData={form.data}
            setFormData={form.setData}
            onScanIndoor={() => scanner.openScanner("indoor")}
            onScanOutdoor={() => scanner.openScanner("outdoor")}
            onScanWarranty={() => scanner.openScanner("warranty")}
            onSave={handleSaveDetails}
            saving={form.processing}
            autoSaveStatus={autoSaving ? "saving" : form.isDirty ? "unsaved" : "idle"}
          />
        )}

        {activeTab === "attachments" && (
          <WorkOrderAttachmentsTab
            workOrder={workOrder}
            files={workOrder.files || []}
            fileTypes={fileUpload.fileTypes}
            uploading={fileUpload.uploading}
            uploadingFileTypeId={fileUpload.uploadingFileTypeId}
            processing={fileUpload.processing}
            uploadData={fileUpload.uploadData}
            onSelectFileType={fileUpload.handleSelectFileType}
            onSelectCamera={fileUpload.handleSelectCamera}
            onSelectGallery={fileUpload.handleSelectGallery}
            onConfirmUpload={fileUpload.handleConfirmUpload}
            onCancelPreview={fileUpload.handleCancelPreview}
            showPreviewModal={fileUpload.showPreviewModal}
            onDelete={fileUpload.handleFileDelete}
            isWarrantyCase={isWarrantyCase}
            captureAndUploadForType={fileUpload.captureAndUploadForType}
            uploadDirectFile={fileUpload.uploadDirectFile}
          />
        )}

        {activeTab === "activity" && (
          <WorkOrderActivityTab workOrder={workOrder} />
        )}

        {/* Action Buttons (Save & Complete) */}
        <View style={styles.actionsRow}>
          <View style={styles.actionButton}>
            <Button
              title="Save Details"
              onPress={handleSaveDetails}
              variant="outline"
              size="small"
              fullWidth
              loading={form.processing}
              theme="vendor"
            />
          </View>
          <View style={styles.actionButton}>
            <Button
              title="Complete Job"
              onPress={() => setShowCompleteModal(true)}
              variant="primary"
              size="small"
              fullWidth
              loading={completing}
              theme="vendor"
            />
          </View>
        </View>
      </ScrollView>

      {/* Barcode Scanner Modal */}
      <BarcodeScanner
        visible={scanner.showScanner}
        scanningField={scanner.scanningField}
        onBarcodeScanned={({ data, imageUri }) =>
          scanner.onBarcodeScanned(data, imageUri)
        }
        onClose={scanner.closeScanner}
      />

      {/* Job Guide Modal */}
      <JobGuideModal
        visible={showGuideModal}
        serviceName={workOrder?.parent_service?.name || "this service"}
        requiredFiles={workOrder?.parent_service?.required_file_types || []}
        uploadedFiles={workOrder?.files || []}
        indoorSerial={form.data.indoor_serial_number}
        outdoorSerial={form.data.outdoor_serial_number}
        onClose={() => setShowGuideModal(false)}
      />

      {/* Complete Work Modal */}
      <Modal
        visible={showCompleteModal}
        type="confirm"
        title="Complete Work Order"
        message="Mark this work order as completed?"
        actions={[
          {
            text: "Cancel",
            onPress: () => setShowCompleteModal(false),
            variant: "outline",
          },
          {
            text: "Complete",
            onPress: onCompleteWork,
            variant: "primary",
          },
        ]}
      />

      {/* Success/Error Modals */}
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  autoSaveIndicator: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F1F5F9",
    paddingVertical: 4,
    gap: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  autoSaveText: {
    fontSize: 10,
    color: "#0F172A",
    fontWeight: "600",
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 0,
    paddingTop: 0,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
  },
  loadingText: {
    fontSize: 12,
    color: "#64748B",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    gap: 8,
  },
  errorTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#0F172A",
  },
  actionsRow: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 24,
  },
  actionButton: {
    flex: 1,
  },
});
