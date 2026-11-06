import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
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
  captureAndUploadForType?: (fileTypeId: number, source: "camera" | "gallery") => Promise<void>;
  uploadDirectFile?: (uri: string, fileTypeId: number) => Promise<void>;
}

export default function WorkOrderAttachmentsTab({
  workOrder,
  files = [],
  fileTypes = [],
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
  captureAndUploadForType,
  uploadDirectFile,
}: WorkOrderAttachmentsTabProps) {
  // Sample preview modal
  const [sampleModalItem, setSampleModalItem] = useState<FileType | null>(null);

  // Full-size uploaded image viewer modal
  const [viewingFile, setViewingFile] = useState<WorkOrderFile | null>(null);

  // Pick source sheet for a specific file type
  const [pickingFileType, setPickingFileType] = useState<FileType | null>(null);

  // Bottom sheet for "Upload Other"
  const [showOtherSheet, setShowOtherSheet] = useState(false);

  // 1. Safe list of all available file types (filtered against null/undefined)
  const safeFileTypes = useMemo(() => {
    if (!Array.isArray(fileTypes)) return [];
    return fileTypes.filter(
      (ft): ft is FileType => Boolean(ft && typeof ft === "object" && ft.id)
    );
  }, [fileTypes]);

  // 2. Identify Required File Types (from parent_service + warranty rules)
  const requiredFileTypes = useMemo(() => {
    const rawRequired = workOrder?.parent_service?.required_file_types || [];
    const fromParent: FileType[] = [];

    rawRequired.forEach((rf) => {
      if (!rf || !rf.is_required) return;
      if (rf.file_type && typeof rf.file_type === "object" && rf.file_type.id) {
        fromParent.push(rf.file_type);
      } else if (rf.file_type_id) {
        const found = safeFileTypes.find((ft) => ft.id === rf.file_type_id);
        if (found) fromParent.push(found);
      }
    });

    // Apply CRM Warranty Rules:
    const list = [...fromParent];
    if (isWarrantyCase) {
      const serialKeywords = ["serial", "barcode", "warranty"];
      safeFileTypes.forEach((ft) => {
        const nameLower = (ft.name || "").toLowerCase();
        const slugLower = (ft.slug || "").toLowerCase();
        const matches = serialKeywords.some(
          (k) => nameLower.includes(k) || slugLower.includes(k)
        );
        if (matches && !list.some((existing) => existing.id === ft.id)) {
          list.push(ft);
        }
      });
    }

    // Default fallback if no requirements configured
    if (list.length === 0) {
      safeFileTypes.forEach((ft) => {
        const slug = (ft.slug || "").toLowerCase();
        if (
          slug.includes("before") ||
          slug.includes("after") ||
          slug.includes("indoor")
        ) {
          list.push(ft);
        }
      });
    }

    return list.filter(
      (ft): ft is FileType => Boolean(ft && typeof ft === "object" && ft.id)
    );
  }, [workOrder?.parent_service, safeFileTypes, isWarrantyCase]);

  // 3. Identify Non-Required File Types (for "+ Upload Other")
  const otherFileTypeOptions: SheetSelectOption[] = useMemo(() => {
    const reqIds = new Set(requiredFileTypes.map((rf) => rf.id));
    return safeFileTypes
      .filter((ft) => !reqIds.has(ft.id))
      .map((ft) => ({
        value: ft.id,
        label: ft.name || `File Type #${ft.id}`,
        description: null,
      }));
  }, [safeFileTypes, requiredFileTypes]);

  // 4. Separate files into Required Files and Other Files
  const reqIdSet = useMemo(
    () => new Set(requiredFileTypes.map((rf) => rf.id)),
    [requiredFileTypes]
  );

  const safeFiles = useMemo(() => {
    if (!Array.isArray(files)) return [];
    return files.filter(Boolean);
  }, [files]);

  const otherFiles = useMemo(() => {
    return safeFiles.filter(
      (f) => !reqIdSet.has(f.file_type?.id || (f as any).file_type_id)
    );
  }, [safeFiles, reqIdSet]);

  const handleSourceSelect = async (source: "camera" | "gallery") => {
    if (!pickingFileType) return;
    const targetType = pickingFileType;
    setPickingFileType(null);

    if (captureAndUploadForType) {
      await captureAndUploadForType(targetType.id, source);
      return;
    }

    try {
      if (source === "camera") {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== "granted") {
          Alert.alert("Permission Required", "Camera permission is required to capture photos.");
          return;
        }
        const result = await ImagePicker.launchCameraAsync({
          mediaTypes: ["images"],
          quality: 0.6,
          allowsEditing: false,
        });
        if (!result.canceled && result.assets[0]?.uri) {
          if (uploadDirectFile) {
            await uploadDirectFile(result.assets[0].uri, targetType.id);
          }
        }
      } else {
        if (Platform.OS !== "android") {
          const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
          if (status !== "granted") {
            Alert.alert("Permission Required", "Gallery permission is required to select photos.");
            return;
          }
        }
        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ["images"],
          quality: 0.6,
          allowsMultipleSelection: false,
        });
        if (!result.canceled && result.assets[0]?.uri) {
          if (uploadDirectFile) {
            await uploadDirectFile(result.assets[0].uri, targetType.id);
          }
        }
      }
    } catch (err: any) {
      console.error("Direct pick & upload error:", err);
      Alert.alert("Upload Error", err.message || "Failed to pick or upload photo");
    }
  };

  const selectedFileTypeName = useMemo(() => {
    const ft = safeFileTypes.find((f) => f.id === uploadData?.fileTypeId);
    return ft?.name || "Attachment";
  }, [safeFileTypes, uploadData?.fileTypeId]);

  return (
    <View style={styles.container}>
      {/* ─── EACH IMAGE IN ITS OWN DISTINCT CARD (NO BADGES, * FOR REQUIRED) ─── */}
      {requiredFileTypes.map((reqType) => {
        if (!reqType) return null;
        const uploadedFile = safeFiles.find(
          (f) => (f.file_type?.id || (f as any).file_type_id) === reqType.id
        );
        const isUploaded = Boolean(uploadedFile);
        const sampleUrl = reqType.reference_image_url || reqType.reference_image;

        return (
          <View key={reqType.id} style={styles.card}>
            {/* Header: File Type Name with red * for required, sample link on right */}
            <View style={styles.cardHeader}>
              <View style={styles.titleRow}>
                <Text style={styles.fileNameTitle}>
                  {reqType.name} <Text style={styles.requiredStar}>*</Text>
                </Text>
              </View>

              {Boolean(sampleUrl) && (
                <TouchableOpacity
                  style={styles.sampleLink}
                  onPress={() => setSampleModalItem(reqType)}
                  activeOpacity={0.75}
                >
                  <Ionicons name="eye-outline" size={13} color="#0284C7" />
                  <Text style={styles.sampleLinkText}>View Sample</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Body: Uploaded Image Card OR Clean Upload Button */}
            {isUploaded ? (
              <View style={styles.uploadedImageBox}>
                <TouchableOpacity
                  onPress={() => setViewingFile(uploadedFile!)}
                  activeOpacity={0.88}
                  style={styles.uploadedTouchArea}
                >
                  <Image
                    source={{ uri: getImageUrl(uploadedFile?.file_path) }}
                    style={styles.uploadedImagePreview}
                    resizeMode="cover"
                  />
                  <View style={styles.viewZoomOverlay}>
                    <Ionicons name="expand" size={16} color="#FFFFFF" />
                  </View>
                </TouchableOpacity>

                {/* Bottom Row Actions for Uploaded Photo */}
                <View style={styles.uploadedActionRow}>
                  <TouchableOpacity
                    style={styles.replaceBtn}
                    onPress={() => setPickingFileType(reqType)}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="camera-outline" size={14} color="#0F172A" />
                    <Text style={styles.replaceBtnText}>Replace Photo</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.deleteBtn}
                    onPress={() => {
                      Alert.alert("Delete Photo", `Delete ${reqType.name}?`, [
                        { text: "Cancel", style: "cancel" },
                        {
                          text: "Delete",
                          style: "destructive",
                          onPress: () => onDelete(uploadedFile),
                        },
                      ]);
                    }}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="trash-outline" size={14} color="#DC2626" />
                    <Text style={styles.deleteBtnText}>Delete</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <View style={styles.uploadPromptBox}>
                <TouchableOpacity
                  style={styles.uploadMainBtn}
                  onPress={() => setPickingFileType(reqType)}
                  disabled={uploading}
                  activeOpacity={0.8}
                >
                  {uploading ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <Ionicons name="camera" size={16} color="#FFFFFF" />
                      <Text style={styles.uploadMainBtnText}>Upload Photo</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </View>
        );
      })}

      {/* ─── ADDITIONAL ATTACHMENTS CARD ─── */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.fileNameTitle}>Additional Attachments</Text>
        </View>

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

      {/* ─── MODAL 1: PICK SOURCE (CAMERA OR GALLERY) ─── */}
      <Modal
        visible={Boolean(pickingFileType)}
        transparent
        animationType="fade"
        onRequestClose={() => setPickingFileType(null)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setPickingFileType(null)}
        >
          <View style={styles.sourcePickerBox}>
            <Text style={styles.sourcePickerTitle}>
              Upload {pickingFileType?.name}
            </Text>
            <Text style={styles.sourcePickerSub}>
              Choose how you would like to attach this photo:
            </Text>

            <View style={styles.sourceBtnRow}>
              <TouchableOpacity
                style={styles.sourceChoiceBtn}
                onPress={() => handleSourceSelect("camera")}
                activeOpacity={0.8}
              >
                <View style={styles.sourceIconBox}>
                  <Ionicons name="camera" size={24} color="#0F172A" />
                </View>
                <Text style={styles.sourceChoiceText}>Take Photo</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.sourceChoiceBtn}
                onPress={() => handleSourceSelect("gallery")}
                activeOpacity={0.8}
              >
                <View style={styles.sourceIconBox}>
                  <Ionicons name="images" size={24} color="#0F172A" />
                </View>
                <Text style={styles.sourceChoiceText}>From Gallery</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.sourceCancelBtn}
              onPress={() => setPickingFileType(null)}
            >
              <Text style={styles.sourceCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ─── MODAL 2: SAMPLE REFERENCE IMAGE VIEWER ─── */}
      <Modal
        visible={Boolean(sampleModalItem)}
        transparent
        animationType="fade"
        onRequestClose={() => setSampleModalItem(null)}
      >
        {Boolean(sampleModalItem) && (
          <View style={styles.modalOverlay}>
            <View style={styles.sampleModalBox}>
              <View style={styles.sampleModalHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.sampleModalTitle}>
                    Sample: {sampleModalItem?.name}
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

              <TouchableOpacity
                style={styles.sampleCaptureBtn}
                onPress={() => {
                  const target = sampleModalItem!;
                  setSampleModalItem(null);
                  setTimeout(() => setPickingFileType(target), 300);
                }}
                activeOpacity={0.8}
              >
                <Ionicons name="camera" size={16} color="#FFFFFF" />
                <Text style={styles.sampleCaptureBtnText}>
                  Take Photo For This Requirement
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </Modal>

      {/* ─── MODAL 3: FULL VIEW OF UPLOADED FILE ─── */}
      <Modal
        visible={Boolean(viewingFile)}
        transparent
        animationType="fade"
        onRequestClose={() => setViewingFile(null)}
      >
        {Boolean(viewingFile) && (
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
            </View>
          </View>
        )}
      </Modal>

      {/* ─── BOTTOM SHEET FOR "UPLOAD OTHER" FILE TYPE ─── */}
      <SheetSelect
        visible={showOtherSheet}
        title="Select Additional File Type"
        options={otherFileTypeOptions}
        selectedValue={null}
        onSelect={(typeId) => {
          setShowOtherSheet(false);
          const found = safeFileTypes.find((ft) => ft.id === typeId);
          if (found) {
            setTimeout(() => setPickingFileType(found), 300);
          }
        }}
        onClose={() => setShowOtherSheet(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 12,
    paddingTop: 10,
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
    marginBottom: 12,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  fileNameTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0F172A",
  },
  requiredStar: {
    color: "#DC2626",
    fontSize: 15,
    fontWeight: "700",
  },
  sampleLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#F0F9FF",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#BAE6FD",
  },
  sampleLinkText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#0284C7",
  },
  uploadPromptBox: {
    paddingVertical: 4,
  },
  uploadMainBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#0F172A",
    paddingVertical: 12,
    borderRadius: 8,
  },
  uploadMainBtnText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  uploadedImageBox: {
    borderRadius: 10,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    backgroundColor: "#F8FAFC",
  },
  uploadedTouchArea: {
    position: "relative",
    width: "100%",
    height: 150,
    backgroundColor: "#F1F5F9",
  },
  uploadedImagePreview: {
    width: "100%",
    height: "100%",
  },
  viewZoomOverlay: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "rgba(15, 23, 42, 0.7)",
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  uploadedActionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
  },
  replaceBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: "#CBD5E1",
  },
  replaceBtnText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#0F172A",
  },
  deleteBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  deleteBtnText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#DC2626",
  },
  uploadOtherBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 11,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 8,
    backgroundColor: "#F8FAFC",
    marginTop: 4,
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
    backgroundColor: "rgba(15, 23, 42, 0.65)",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  sourcePickerBox: {
    width: "100%",
    maxWidth: 340,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 18,
    alignItems: "center",
  },
  sourcePickerTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0F172A",
    textAlign: "center",
  },
  sourcePickerSub: {
    fontSize: 12,
    color: "#64748B",
    textAlign: "center",
    marginTop: 4,
    marginBottom: 16,
  },
  sourceBtnRow: {
    flexDirection: "row",
    gap: 16,
    width: "100%",
    justifyContent: "center",
    marginBottom: 16,
  },
  sourceChoiceBtn: {
    flex: 1,
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  sourceIconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  sourceChoiceText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#0F172A",
  },
  sourceCancelBtn: {
    paddingVertical: 8,
    width: "100%",
    alignItems: "center",
  },
  sourceCancelText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#64748B",
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
    alignItems: "center",
    marginBottom: 12,
  },
  sampleModalTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0F172A",
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
  sampleCaptureBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#0F172A",
    paddingVertical: 11,
    borderRadius: 8,
    marginTop: 14,
  },
  sampleCaptureBtnText: {
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
});
