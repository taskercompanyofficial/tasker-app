import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Colors from "@/constants/Colors";
import { FileType } from "@/types/file-type";
import { WorkOrder, WorkOrderFile } from "@/types/work-order";
import getImageUrl from "@/lib/utils";
import SheetSelect, { SheetSelectOption } from "@/components/SheetSelect";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

interface WorkOrderAttachmentsTabProps {
  workOrder: WorkOrder;
  files: WorkOrderFile[];
  fileTypes: FileType[];
  uploading: boolean;
  processing?: boolean;
  uploadData: { fileTypeId: number; imageUri: string } | null;
  onSelectFileType: (fileTypeId: number) => void;
  onSelectCamera: () => void;
  onSelectGallery: () => void;
  onConfirmUpload: () => Promise<void>;
  onCancelPreview: () => void;
  showPreviewModal: boolean;
  onDelete: (file: any) => Promise<void>;
  isWarrantyCase?: boolean;
}

export default function WorkOrderAttachmentsTab({
  workOrder,
  files,
  fileTypes,
  uploading,
  processing = false,
  uploadData,
  onSelectFileType,
  onSelectCamera,
  onSelectGallery,
  onConfirmUpload,
  onCancelPreview,
  showPreviewModal,
  onDelete,
  isWarrantyCase = false,
}: WorkOrderAttachmentsTabProps) {
  // Sample preview modal
  const [sampleModalItem, setSampleModalItem] = useState<FileType | null>(null);

  // Full-size uploaded image viewer modal
  const [viewingFile, setViewingFile] = useState<WorkOrderFile | null>(null);

  // Bottom sheet for "Upload Other"
  const [showOtherSheet, setShowOtherSheet] = useState(false);

  // 1. Identify Required File Types (from parent_service + warranty rules)
  const requiredFileTypes = useMemo(() => {
    const fromParent =
      workOrder.parent_service?.required_file_types
        ?.filter((rf) => rf.is_required)
        ?.map((rf) => rf.file_type || fileTypes.find((ft) => ft.id === rf.file_type_id))
        ?.filter(Boolean) as FileType[] || [];

    // Fallback: If parentService didn't load relations, match fileTypes against required_file_types array
    if (fromParent.length === 0 && workOrder.parent_service?.required_file_types) {
      const ids = workOrder.parent_service.required_file_types.map((rf) => rf.file_type_id);
      return fileTypes.filter((ft) => ids.includes(ft.id));
    }

    // Apply CRM Warranty Rules:
    // If it's a warranty job, serial barcode photos and warranty card must be required
    let list = [...fromParent];
    if (isWarrantyCase) {
      const serialSlugs = ["indoor-serial", "outdoor-serial", "serial-number", "warranty-card"];
      fileTypes.forEach((ft) => {
        const matches = serialSlugs.some(
          (s) => ft.slug?.includes(s) || ft.name?.toLowerCase().includes("serial") || ft.name?.toLowerCase().includes("warranty")
        );
        if (matches && !list.some((existing) => existing.id === ft.id)) {
          list.push(ft);
        }
      });
    }

    // If still empty, default to common critical file types (Before, After)
    if (list.length === 0) {
      list = fileTypes.filter(
        (ft) =>
          ft.slug === "before-work" ||
          ft.slug === "after-work" ||
          ft.slug === "indoor-serial"
      );
    }

    return list;
  }, [workOrder.parent_service, fileTypes, isWarrantyCase]);

  // 2. Identify Non-Required File Types (for "+ Upload Other")
  const otherFileTypeOptions: SheetSelectOption[] = useMemo(() => {
    const reqIds = new Set(requiredFileTypes.map((rf) => rf.id));
    return fileTypes
      .filter((ft) => !reqIds.has(ft.id))
      .map((ft) => ({
        value: ft.id,
        label: ft.name,
        description: ft.description || null,
      }));
  }, [fileTypes, requiredFileTypes]);

  // 3. Separate files into Required Files and Other Files
  const reqIdSet = useMemo(
    () => new Set(requiredFileTypes.map((rf) => rf.id)),
    [requiredFileTypes]
  );

  const otherFiles = useMemo(() => {
    return files.filter(
      (f) => !reqIdSet.has(f.file_type?.id || (f as any).file_type_id)
    );
  }, [files, reqIdSet]);

  // Direct 1-tap trigger for a specific required file type
  const handleDirectCapture = (fileTypeId: number, source: "camera" | "gallery") => {
    onSelectFileType(fileTypeId);
    if (source === "camera") {
      onSelectCamera();
    } else {
      onSelectGallery();
    }
  };

  const selectedFileTypeName = useMemo(() => {
    const ft = fileTypes.find((f) => f.id === uploadData?.fileTypeId);
    return ft?.name || "Attachment";
  }, [fileTypes, uploadData?.fileTypeId]);

  return (
    <View style={styles.container}>
      {/* ─── 1. REQUIRED FILES TABLE / CHECKLIST ─── */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderLeft}>
            <Ionicons name="shield-checkmark-outline" size={16} color="#0F172A" />
            <Text style={styles.cardTitle}>Required Job Attachments</Text>
          </View>
          <View style={styles.counterBadge}>
            <Text style={styles.counterBadgeText}>
              {requiredFileTypes.filter((rf) =>
                files.some((f) => (f.file_type?.id || (f as any).file_type_id) === rf.id)
              ).length}{" "}
              / {requiredFileTypes.length} Done
            </Text>
          </View>
        </View>

        <Text style={styles.cardDescription}>
          The following photos are required by standard operating procedure. Check the sample photo before capturing.
        </Text>

        {/* Required Files Table Rows */}
        <View style={styles.table}>
          {requiredFileTypes.map((reqType, index) => {
            const uploadedFile = files.find(
              (f) =>
                (f.file_type?.id || (f as any).file_type_id) === reqType.id
            );
            const isDone = Boolean(uploadedFile);
            const sampleUrl = reqType.reference_image_url || reqType.reference_image;

            return (
              <View
                key={reqType.id || index}
                style={[
                  styles.tableRow,
                  index === requiredFileTypes.length - 1 && styles.tableRowLast,
                ]}
              >
                {/* Left: Info & Badges */}
                <View style={styles.rowInfo}>
                  <View style={styles.rowTitleRow}>
                    <Text style={styles.rowTitle}>{reqType.name}</Text>
                    {isDone ? (
                      <View style={styles.doneBadge}>
                        <Ionicons name="checkmark-circle" size={12} color="#059669" />
                        <Text style={styles.doneBadgeText}>Uploaded</Text>
                      </View>
                    ) : (
                      <View style={styles.requiredBadge}>
                        <Text style={styles.requiredBadgeText}>Required</Text>
                      </View>
                    )}
                  </View>

                  {Boolean(reqType.description) && (
                    <Text style={styles.rowDesc} numberOfLines={2}>
                      {reqType.description}
                    </Text>
                  )}

                  {/* Sample Image Pill & Upload Status */}
                  <View style={styles.rowMetaRow}>
                    {Boolean(sampleUrl) ? (
                      <TouchableOpacity
                        style={styles.samplePill}
                        onPress={() => setSampleModalItem(reqType)}
                        activeOpacity={0.75}
                      >
                        <Ionicons name="eye-outline" size={12} color="#0284C7" />
                        <Text style={styles.samplePillText}>View Sample</Text>
                      </TouchableOpacity>
                    ) : (
                      <Text style={styles.noSampleText}>No sample image</Text>
                    )}

                    {isDone && (
                      <TouchableOpacity
                        style={styles.viewUploadedPill}
                        onPress={() => setViewingFile(uploadedFile!)}
                        activeOpacity={0.75}
                      >
                        <Ionicons name="image-outline" size={12} color="#0F172A" />
                        <Text style={styles.viewUploadedPillText}>View Upload</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>

                {/* Right: Uploaded Thumbnail or 1-Tap Capture Buttons */}
                <View style={styles.rowAction}>
                  {isDone ? (
                    <View style={styles.thumbnailContainer}>
                      <TouchableOpacity
                        onPress={() => setViewingFile(uploadedFile!)}
                        activeOpacity={0.85}
                      >
                        <Image
                          source={{
                            uri: getImageUrl(uploadedFile?.file_path),
                          }}
                          style={styles.thumbnailImage}
                        />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.thumbDeleteBtn}
                        onPress={() => {
                          Alert.alert(
                            "Delete Photo",
                            `Delete ${reqType.name}?`,
                            [
                              { text: "Cancel", style: "cancel" },
                              {
                                text: "Delete",
                                style: "destructive",
                                onPress: () => onDelete(uploadedFile),
                              },
                            ]
                          );
                        }}
                        activeOpacity={0.8}
                      >
                        <Ionicons name="close" size={12} color="#FFFFFF" />
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <View style={styles.directActionColumn}>
                      <TouchableOpacity
                        style={styles.directCameraBtn}
                        onPress={() => handleDirectCapture(reqType.id, "camera")}
                        activeOpacity={0.8}
                      >
                        <Ionicons name="camera" size={14} color="#0F172A" />
                        <Text style={styles.directBtnText}>Camera</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.directGalleryBtn}
                        onPress={() => handleDirectCapture(reqType.id, "gallery")}
                        activeOpacity={0.8}
                      >
                        <Ionicons name="images-outline" size={12} color="#475569" />
                        <Text style={styles.directGalleryText}>Gallery</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              </View>
            );
          })}
        </View>
      </View>

      {/* ─── 2. "+ UPLOAD OTHER / ADDITIONAL FILES" ─── */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderLeft}>
            <Ionicons name="folder-open-outline" size={16} color="#0F172A" />
            <Text style={styles.cardTitle}>Additional Proofs & Documents</Text>
          </View>
        </View>

        <Text style={styles.cardDescription}>
          Need to attach extra files like spare part photos, purchase bills, or pressure gauge readings?
        </Text>

        <TouchableOpacity
          style={styles.uploadOtherBtn}
          onPress={() => setShowOtherSheet(true)}
          activeOpacity={0.8}
        >
          <Ionicons name="add-circle-outline" size={18} color="#0F172A" />
          <Text style={styles.uploadOtherBtnText}>+ Upload Other File</Text>
        </TouchableOpacity>

        {/* Other Uploaded Files Grid */}
        {otherFiles.length > 0 && (
          <View style={styles.otherFilesGrid}>
            {otherFiles.map((f, i) => (
              <View key={f.id || i} style={styles.otherFileCard}>
                <TouchableOpacity
                  onPress={() => setViewingFile(f)}
                  activeOpacity={0.85}
                >
                  <Image
                    source={{ uri: getImageUrl(f.file_path) }}
                    style={styles.otherFileImage}
                  />
                </TouchableOpacity>
                <View style={styles.otherFileInfo}>
                  <Text style={styles.otherFileName} numberOfLines={1}>
                    {f.file_type?.name || "Additional File"}
                  </Text>
                  <TouchableOpacity
                    onPress={() => {
                      Alert.alert("Delete File", "Delete this file?", [
                        { text: "Cancel", style: "cancel" },
                        {
                          text: "Delete",
                          style: "destructive",
                          onPress: () => onDelete(f),
                        },
                      ]);
                    }}
                    style={styles.otherFileDeleteBtn}
                  >
                    <Ionicons name="trash-outline" size={13} color="#DC2626" />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* ─── MODAL 1: SAMPLE REFERENCE IMAGE VIEWER ─── */}
      <Modal
        visible={Boolean(sampleModalItem)}
        transparent
        animationType="fade"
        onRequestClose={() => setSampleModalItem(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.sampleModalBox}>
            <View style={styles.sampleModalHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.sampleModalTitle}>
                  Sample Photo: {sampleModalItem?.name}
                </Text>
                <Text style={styles.sampleModalSubtitle}>
                  Please match this angle and framing when capturing
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setSampleModalItem(null)}
                style={styles.modalCloseBtn}
              >
                <Ionicons name="close" size={20} color="#0F172A" />
              </TouchableOpacity>
            </View>

            <View style={styles.sampleImageContainer}>
              <Image
                source={{
                  uri: getImageUrl(
                    sampleModalItem?.reference_image_url ||
                      sampleModalItem?.reference_image
                  ),
                }}
                style={styles.sampleImageFull}
                resizeMode="contain"
              />
            </View>

            {Boolean(sampleModalItem?.description) && (
              <View style={styles.sampleInstructions}>
                <Ionicons name="information-circle-outline" size={16} color="#0284C7" />
                <Text style={styles.sampleInstructionsText}>
                  {sampleModalItem?.description}
                </Text>
              </View>
            )}

            <TouchableOpacity
              style={styles.sampleCaptureBtn}
              onPress={() => {
                const typeId = sampleModalItem!.id;
                setSampleModalItem(null);
                setTimeout(() => handleDirectCapture(typeId, "camera"), 300);
              }}
              activeOpacity={0.8}
            >
              <Ionicons name="camera" size={16} color="#FFFFFF" />
              <Text style={styles.sampleCaptureBtnText}>
                Open Camera For This Photo
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ─── MODAL 2: UPLOAD CONFIRMATION PREVIEW ─── */}
      <Modal
        visible={showPreviewModal}
        transparent
        animationType="slide"
        onRequestClose={onCancelPreview}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.previewModalBox}>
            <View style={styles.previewModalHeader}>
              <Text style={styles.previewModalTitle}>
                Confirm {selectedFileTypeName}
              </Text>
              <TouchableOpacity onPress={onCancelPreview} style={styles.modalCloseBtn}>
                <Ionicons name="close" size={20} color="#0F172A" />
              </TouchableOpacity>
            </View>

            {Boolean(uploadData?.imageUri) && (
              <Image
                source={{ uri: uploadData!.imageUri }}
                style={styles.previewImage}
                resizeMode="contain"
              />
            )}

            <View style={styles.previewBtnRow}>
              <TouchableOpacity
                style={styles.previewCancelBtn}
                onPress={onCancelPreview}
                disabled={uploading || processing}
              >
                <Text style={styles.previewCancelText}>Retake / Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.previewConfirmBtn}
                onPress={onConfirmUpload}
                disabled={uploading || processing}
              >
                {uploading || processing ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons name="cloud-upload" size={16} color="#FFFFFF" />
                    <Text style={styles.previewConfirmText}>Upload Photo</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ─── MODAL 3: FULL VIEW OF UPLOADED FILE ─── */}
      <Modal
        visible={Boolean(viewingFile)}
        transparent
        animationType="fade"
        onRequestClose={() => setViewingFile(null)}
      >
        <View style={styles.fullViewerOverlay}>
          <TouchableOpacity
            style={styles.fullViewerCloseBtn}
            onPress={() => setViewingFile(null)}
          >
            <Ionicons name="close" size={24} color="#FFFFFF" />
          </TouchableOpacity>

          {Boolean(viewingFile?.file_path) && (
            <Image
              source={{ uri: getImageUrl(viewingFile?.file_path) }}
              style={styles.fullViewerImage}
              resizeMode="contain"
            />
          )}

          <View style={styles.fullViewerBottom}>
            <Text style={styles.fullViewerTitle}>
              {viewingFile?.file_type?.name || "Uploaded Photo"}
            </Text>
            {Boolean(viewingFile?.uploaded_at) && (
              <Text style={styles.fullViewerTime}>
                Uploaded: {new Date(viewingFile!.uploaded_at).toLocaleString()}
              </Text>
            )}
          </View>
        </View>
      </Modal>

      {/* ─── BOTTOM SHEET FOR "UPLOAD OTHER" FILE TYPE ─── */}
      <SheetSelect
        visible={showOtherSheet}
        title="Select Additional File Type"
        options={otherFileTypeOptions}
        selectedValue={null}
        onSelect={(typeId) => {
          setShowOtherSheet(false);
          setTimeout(() => handleDirectCapture(typeId, "camera"), 300);
        }}
        onClose={() => setShowOtherSheet(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 40,
    gap: 12,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 14,
    elevation: 0,
    shadowColor: "transparent",
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  cardHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#0F172A",
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  cardDescription: {
    fontSize: 12,
    color: "#64748B",
    lineHeight: 17,
    marginBottom: 12,
  },
  counterBadge: {
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  counterBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#0F172A",
  },
  table: {
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 8,
    overflow: "hidden",
  },
  tableRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
    backgroundColor: "#FFFFFF",
    gap: 10,
  },
  tableRowLast: {
    borderBottomWidth: 0,
  },
  rowInfo: {
    flex: 1,
  },
  rowTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flexWrap: "wrap",
  },
  rowTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#0F172A",
  },
  requiredBadge: {
    backgroundColor: "#FEF3C7",
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 4,
  },
  requiredBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#B45309",
  },
  doneBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "#D1FAE5",
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 4,
  },
  doneBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#059669",
  },
  rowDesc: {
    fontSize: 11,
    color: "#64748B",
    marginTop: 2,
    lineHeight: 15,
  },
  rowMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 6,
  },
  samplePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "#E0F2FE",
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  samplePillText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#0284C7",
  },
  viewUploadedPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  viewUploadedPillText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#0F172A",
  },
  noSampleText: {
    fontSize: 10,
    color: "#94A3B8",
    fontStyle: "italic",
  },
  rowAction: {
    alignItems: "center",
    justifyContent: "center",
  },
  thumbnailContainer: {
    position: "relative",
    width: 54,
    height: 54,
    borderRadius: 8,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#CBD5E1",
  },
  thumbnailImage: {
    width: "100%",
    height: "100%",
  },
  thumbDeleteBtn: {
    position: "absolute",
    top: 2,
    right: 2,
    backgroundColor: "rgba(15, 23, 42, 0.75)",
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  directActionColumn: {
    gap: 4,
  },
  directCameraBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 6,
  },
  directBtnText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#0F172A",
  },
  directGalleryBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  directGalleryText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#64748B",
  },
  uploadOtherBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 8,
    backgroundColor: "#F8FAFC",
  },
  uploadOtherBtnText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#0F172A",
  },
  otherFilesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 12,
  },
  otherFileCard: {
    width: (SCREEN_WIDTH - 24 - 28 - 10) / 2,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: "#FFFFFF",
  },
  otherFileImage: {
    width: "100%",
    height: 90,
  },
  otherFileInfo: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 6,
    backgroundColor: "#F8FAFC",
  },
  otherFileName: {
    fontSize: 11,
    fontWeight: "600",
    color: "#0F172A",
    flex: 1,
  },
  otherFileDeleteBtn: {
    padding: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  sampleModalBox: {
    width: "100%",
    maxHeight: SCREEN_HEIGHT * 0.85,
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 16,
  },
  sampleModalHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  sampleModalTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0F172A",
  },
  sampleModalSubtitle: {
    fontSize: 11,
    color: "#64748B",
    marginTop: 2,
  },
  modalCloseBtn: {
    padding: 4,
  },
  sampleImageContainer: {
    width: "100%",
    height: 250,
    backgroundColor: "#F1F5F9",
    borderRadius: 10,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  sampleImageFull: {
    width: "100%",
    height: "100%",
  },
  sampleInstructions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#E0F2FE",
    padding: 8,
    borderRadius: 6,
    marginTop: 10,
  },
  sampleInstructionsText: {
    fontSize: 11,
    color: "#0284C7",
    flex: 1,
  },
  sampleCaptureBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#0F172A",
    paddingVertical: 11,
    borderRadius: 8,
    marginTop: 12,
  },
  sampleCaptureBtnText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  previewModalBox: {
    width: "100%",
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 16,
    alignItems: "center",
  },
  previewModalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    marginBottom: 12,
  },
  previewModalTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0F172A",
  },
  previewImage: {
    width: "100%",
    height: 280,
    borderRadius: 10,
    backgroundColor: "#F1F5F9",
  },
  previewBtnRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 14,
    width: "100%",
  },
  previewCancelBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    alignItems: "center",
    justifyContent: "center",
  },
  previewCancelText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#475569",
  },
  previewConfirmBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#0F172A",
    paddingVertical: 10,
    borderRadius: 8,
  },
  previewConfirmText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  fullViewerOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.95)",
    justifyContent: "center",
    alignItems: "center",
  },
  fullViewerCloseBtn: {
    position: "absolute",
    top: 50,
    right: 20,
    zIndex: 10,
    padding: 8,
  },
  fullViewerImage: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT * 0.75,
  },
  fullViewerBottom: {
    position: "absolute",
    bottom: 40,
    alignItems: "center",
  },
  fullViewerTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  fullViewerTime: {
    fontSize: 12,
    color: "#94A3B8",
    marginTop: 3,
  },
});
