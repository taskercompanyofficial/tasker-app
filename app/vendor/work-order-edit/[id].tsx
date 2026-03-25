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
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  BarcodeScanner,
  EditHeader,
  FileUploadSection,
  JobGuideModal,
  ProductDetailsForm,
  TechnicianRemarksForm,
} from "@/components/work-order-edit";
import { ServiceRequiredFile } from "@/types/work-order";

export default function VendorWorkOrderEditScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

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
    onSuccess: (msg) => {
      setShowSuccessModal(true);
    },
    onError: (msg) => {
      setShowErrorModal(true);
    },
    onFilesChanged: refreshWorkOrder,
  });

  // Barcode scanner hook
  const scanner = useBarcodeScanner({
    onIndoorScanned: (data) => form.setData("indoor_serial_number", data),
    onOutdoorScanned: (data) => form.setData("outdoor_serial_number", data),
    onError: (msg) => {
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

  // Loading state
  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator
            size="large"
            color={Colors.themes.provider.primary}
          />
          <Text style={styles.loadingText}>Loading...</Text>
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
          <Text style={styles.errorTitle}>Work Order Not Found</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      {/* Header */}
      <EditHeader onInfoPress={() => setShowGuideModal(true)} />

      {/* Auto-save Indicator */}
      {autoSaving && (
        <View style={styles.autoSaveIndicator}>
          <ActivityIndicator
            size="small"
            color={Colors.themes.provider.primary}
          />
          <Text style={styles.autoSaveText}>Auto-saving...</Text>
        </View>
      )}

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
        {/* Product Details Form with Concerns */}
        <ProductDetailsForm
          workOrder={workOrder}
          indoorSerial={form.data.indoor_serial_number}
          outdoorSerial={form.data.outdoor_serial_number}
          indoorModel={form.data.product_indoor_model}
          outdoorModel={form.data.product_outdoor_model}
          purchaseDate={form.data.purchase_date}
          selectedConcernId={form.data.service_concern_id}
          selectedSubConcernId={form.data.service_sub_concern_id}
          selectedWarrantyTypeId={form.data.warranty_type_id}
          onIndoorSerialChange={(v) =>
            form.setData("indoor_serial_number", v.toUpperCase())
          }
          onOutdoorSerialChange={(v) =>
            form.setData("outdoor_serial_number", v.toUpperCase())
          }
          onIndoorModelChange={(v) =>
            form.setData("product_indoor_model", v.toUpperCase())
          }
          onOutdoorModelChange={(v) =>
            form.setData("product_outdoor_model", v.toUpperCase())
          }
          onPurchaseDateChange={(v) => form.setData("purchase_date", v)}
          onServiceConcernChange={(v) => form.setData("service_concern_id", v)}
          onServiceSubConcernChange={(v) =>
            form.setData("service_sub_concern_id", v)
          }
          onWarrantyTypeChange={(v) => form.setData("warranty_type_id", v)}
          onScanIndoor={() => scanner.openScanner("indoor")}
          onScanOutdoor={() => scanner.openScanner("outdoor")}
        />

        {/* Technician Remarks */}
        <TechnicianRemarksForm
          value={form.data.technician_remarks}
          onChangeText={(v) => form.setData("technician_remarks", v)}
        />

        {/* File Upload Section */}
        <FileUploadSection
          files={workOrder.files || []}
          uploading={fileUpload.uploading}
          processing={fileUpload.processing}
          fileTypes={fileUpload.fileTypes}
          showFileTypeSheet={fileUpload.showFileTypeSheet}
          showSourceSheet={fileUpload.showSourceSheet}
          showPreviewModal={fileUpload.showPreviewModal}
          uploadData={fileUpload.uploadData}
          onAddFile={fileUpload.handleAddFile}
          onSelectFileType={fileUpload.handleSelectFileType}
          onSelectCamera={fileUpload.handleSelectCamera}
          onSelectGallery={fileUpload.handleSelectGallery}
          onConfirmUpload={fileUpload.handleConfirmUpload}
          onCancelPreview={fileUpload.handleCancelPreview}
          onCancelFileTypeSheet={fileUpload.cancelFileTypeSheet}
          onCancelSourceSheet={fileUpload.cancelSourceSheet}
          onDelete={fileUpload.handleFileDelete}
          onClearAll={() => fileUpload.handleClearAll(workOrder.files || [])}
          requiredFileTypeIds={requiredFileTypeIds}
        />

        {/* Action Buttons */}
        <View style={styles.actionsRow}>
          <View style={styles.actionButton}>
            <Button
              title="Save"
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
              title="Complete"
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

      {/* Barcode Scanner */}
      <BarcodeScanner
        visible={scanner.showScanner}
        scanningField={scanner.scanningField}
        onBarcodeScanned={({ data }) => scanner.onBarcodeScanned(data)}
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

      {/* Error Modal */}
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
    backgroundColor: Colors.neutral.gray[50],
  },
  autoSaveIndicator: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.themes.provider.background,
    paddingVertical: 4,
    gap: 6,
    borderBottomWidth: 1,
    borderBottomColor: Colors.themes.provider.primaryLight,
  },
  autoSaveText: {
    fontSize: 10,
    color: Colors.themes.provider.primary,
    fontWeight: "500",
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 10,
    paddingBottom: 60,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
  },
  loadingText: {
    fontSize: 11,
    color: Colors.text.secondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    gap: 8,
  },
  errorTitle: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.text.primary,
  },
  card: {
    backgroundColor: Colors.neutral.white,
    borderRadius: 6,
    padding: 10,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: Colors.border.light,
  },
  actionsRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 4,
  },
  actionButton: {
    flex: 1,
  },
});
