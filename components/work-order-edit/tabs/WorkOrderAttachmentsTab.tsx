import React, { useMemo, useRef, useState } from "react";
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
  uploadingFileTypeId?: number | null;
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
  uploadingFileTypeId = null,
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

  // Full-size uploaded image gallery viewer modal (with slide/next/prev)
  const [viewingIndex, setViewingIndex] = useState<number | null>(null);

  // Pick source sheet for a specific file type
  const [pickingFileType, setPickingFileType] = useState<FileType | null>(null);

  // Local uploading file type tracker
  const [localUploadingTypeId, setLocalUploadingTypeId] = useState<number | null>(null);

  // Bottom sheet for "Upload Other"
  const [showOtherSheet, setShowOtherSheet] = useState(false);

  // Collect all uploaded files that have valid file_path for gallery swipe
  const allUploadedFiles = useMemo(() => {
    if (!Array.isArray(files)) return [];
    return files.filter((f) => Boolean(f && f.file_path));
  }, [files]);

  const openImageViewer = (file: WorkOrderFile) => {
    const idx = allUploadedFiles.findIndex((f) => f.id === file.id);
    setViewingIndex(idx !== -1 ? idx : 0);
  };

  const handlePrevImage = () => {
    if (viewingIndex !== null && viewingIndex > 0) {
      setViewingIndex(viewingIndex - 1);
    }
  };

  const handleNextImage = () => {
    if (viewingIndex !== null && viewingIndex < allUploadedFiles.length - 1) {
      setViewingIndex(viewingIndex + 1);
    }
  };

  const touchStartXRef = useRef<number>(0);
  const handleTouchStart = (e: any) => {
    touchStartXRef.current = e.nativeEvent.pageX;
  };
  const handleTouchEnd = (e: any) => {
    const diff = e.nativeEvent.pageX - touchStartXRef.current;
    if (diff > 45) {
      handlePrevImage(); // Swiped right -> show previous image
    } else if (diff < -45) {
      handleNextImage(); // Swiped left -> show next image
    }
  };

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
    setLocalUploadingTypeId(targetType.id);

    try {
      if (captureAndUploadForType) {
        await captureAndUploadForType(targetType.id, source);
        return;
      }

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
    } finally {
      setLocalUploadingTypeId(null);
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

        const isThisUploading =
          (uploadingFileTypeId !== null && uploadingFileTypeId === reqType.id) ||
          localUploadingTypeId === reqType.id;

        const isRejected = uploadedFile?.approval_status === "rejected";
        const rejectRemark = uploadedFile?.approval_remark;

        return (
          <View
            key={reqType.id}
            style={[styles.card, isRejected && styles.cardRejected]}
          >
            {/* Header: File Type Name with red * for required, status pill or sample link on right */}
            <View style={styles.cardHeader}>
              <View style={styles.titleRow}>
                <Text style={styles.fileNameTitle}>
                  {reqType.name} <Text style={styles.requiredStar}>*</Text>
                </Text>
                {isRejected && (
                  <View style={styles.rejectedBadge}>
                    <Ionicons name="close-circle" size={11} color="#DC2626" />
                    <Text style={styles.rejectedBadgeText}>Rejected</Text>
                  </View>
                )}
              </View>

              <TouchableOpacity
                style={styles.sampleLink}
                onPress={() => setSampleModalItem(reqType)}
                activeOpacity={0.75}
              >
                <Ionicons name="image-outline" size={13} color="#0284C7" />
                <Text style={styles.sampleLinkText}>Sample Image</Text>
              </TouchableOpacity>
            </View>

            {/* Body: Compact Thumbnail Row OR Clean Upload Button */}
            {isUploaded ? (
              <View
                style={[
                  styles.uploadedCompactRow,
                  isRejected && styles.uploadedCompactRowRejected,
                ]}
              >
                {/* Left: Compact square thumbnail with zoom overlay */}
                <TouchableOpacity
                  onPress={() => openImageViewer(uploadedFile!)}
                  activeOpacity={0.85}
                  style={styles.thumbnailTouch}
                >
                  <Image
                    source={{ uri: getImageUrl(uploadedFile?.file_path) }}
                    style={styles.thumbnailImage}
                    resizeMode="cover"
                  />
                  <View style={styles.thumbnailZoomBadge}>
                    <Ionicons name="expand" size={12} color="#FFFFFF" />
                  </View>
                </TouchableOpacity>

                {/* Right: Status pill, Rejection remark, and Actions */}
                <View style={styles.thumbnailRightCol}>
                  <View style={styles.statusPillRow}>
                    {isRejected ? (
                      <View style={styles.rejectedPill}>
                        <Ionicons name="alert-circle" size={11} color="#DC2626" />
                        <Text style={styles.rejectedPillText}>Needs Correction</Text>
                      </View>
                    ) : (
                      <View style={styles.uploadedSuccessPill}>
                        <Ionicons name="checkmark-circle" size={11} color="#059669" />
                        <Text style={styles.uploadedSuccessPillText}>Photo Attached</Text>
                      </View>
                    )}
                    <Text style={styles.tapToViewHint}>Tap image to view full</Text>
                  </View>

                  {/* Rejection Remarks in red box */}
                  {isRejected && Boolean(rejectRemark) && (
                    <View style={styles.fileRejectBox}>
                      <Text style={styles.fileRejectText} numberOfLines={2}>
                        Reason: {rejectRemark}
                      </Text>
                    </View>
                  )}

                  <View style={styles.compactActionRow}>
                    <TouchableOpacity
                      style={[
                        styles.replaceBtnCompact,
                        isRejected && styles.replaceBtnCompactRejected,
                      ]}
                      onPress={() => setPickingFileType(reqType)}
                      disabled={isThisUploading}
                      activeOpacity={0.8}
                    >
                      {isThisUploading ? (
                        <ActivityIndicator size="small" color="#0F172A" />
                      ) : (
                        <>
                          <Ionicons
                            name="camera-outline"
                            size={13}
                            color={isRejected ? "#DC2626" : "#0F172A"}
                          />
                          <Text
                            style={[
                              styles.replaceBtnText,
                              isRejected && { color: "#DC2626" },
                            ]}
                          >
                            {isRejected ? "Re-upload" : "Replace"}
                          </Text>
                        </>
                      )}
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.deleteBtnCompact}
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
                      <Ionicons name="trash-outline" size={13} color="#DC2626" />
                      <Text style={styles.deleteBtnText}>Delete</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ) : (
              <View style={styles.uploadPromptBox}>
                <TouchableOpacity
                  style={styles.uploadMainBtn}
                  onPress={() => setPickingFileType(reqType)}
                  disabled={isThisUploading}
                  activeOpacity={0.8}
                >
                  {isThisUploading ? (
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
                  onPress={() => openImageViewer(f)}
                  activeOpacity={0.85}
                  style={styles.otherFileTouch}
                >
                  <Image
                    source={{ uri: getImageUrl(f.file_path) }}
                    style={styles.otherFileImage}
                  />
                  <View style={styles.thumbnailZoomBadge}>
                    <Ionicons name="expand" size={10} color="#FFFFFF" />
                  </View>
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

              {Boolean(
                sampleModalItem?.reference_image_url ||
                  sampleModalItem?.reference_image
              ) ? (
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
              ) : (
                <View style={styles.samplePlaceholderBox}>
                  <View style={styles.samplePlaceholderIconCircle}>
                    <Ionicons name="camera" size={32} color="#0284C7" />
                  </View>
                  <Text style={styles.samplePlaceholderTitle}>
                    Photo Guidelines: {sampleModalItem?.name}
                  </Text>
                  <Text style={styles.samplePlaceholderText}>
                    Please capture a clear, well-lit, and in-focus photograph for this requirement. Ensure labels, serial barcodes, and technical details are fully readable without flash reflection or glare.
                  </Text>
                </View>
              )}

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

      {/* ─── MODAL 3: FULL VIEW GALLERY WITH NEXT / PREVIOUS & SWIPE ─── */}
      <Modal
        visible={
          viewingIndex !== null &&
          viewingIndex >= 0 &&
          viewingIndex < allUploadedFiles.length
        }
        transparent
        animationType="fade"
        onRequestClose={() => setViewingIndex(null)}
      >
        {viewingIndex !== null && allUploadedFiles[viewingIndex] && (
          <View
            style={styles.fullViewerOverlay}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            {/* Top Bar with Counter and Close Button */}
            <View style={styles.fullViewerTopBar}>
              <TouchableOpacity
                style={styles.fullViewerCloseBtn}
                onPress={() => setViewingIndex(null)}
              >
                <Ionicons name="close" size={24} color="#FFFFFF" />
              </TouchableOpacity>
              <Text style={styles.fullViewerCounter}>
                {viewingIndex + 1} of {allUploadedFiles.length}
              </Text>
              <View style={{ width: 40 }} />
            </View>

            {/* Main Image with Navigation Arrows */}
            <View style={styles.fullViewerCenter}>
              <Image
                source={{
                  uri: getImageUrl(allUploadedFiles[viewingIndex].file_path),
                }}
                style={styles.fullViewerImage}
                resizeMode="contain"
              />

              {/* Left Arrow (Previous) */}
              {viewingIndex > 0 && (
                <TouchableOpacity
                  style={[styles.viewerNavArrow, styles.viewerNavArrowLeft]}
                  onPress={handlePrevImage}
                  activeOpacity={0.8}
                >
                  <Ionicons name="chevron-back" size={26} color="#FFFFFF" />
                </TouchableOpacity>
              )}

              {/* Right Arrow (Next) */}
              {viewingIndex < allUploadedFiles.length - 1 && (
                <TouchableOpacity
                  style={[styles.viewerNavArrow, styles.viewerNavArrowRight]}
                  onPress={handleNextImage}
                  activeOpacity={0.8}
                >
                  <Ionicons name="chevron-forward" size={26} color="#FFFFFF" />
                </TouchableOpacity>
              )}
            </View>

            {/* Bottom Bar: Title & Rejection Info */}
            <View style={styles.fullViewerBottom}>
              <Text style={styles.fullViewerTitle}>
                {allUploadedFiles[viewingIndex].file_type?.name || "Uploaded Photo"}
              </Text>
              {allUploadedFiles[viewingIndex].approval_status === "rejected" && (
                <View style={styles.viewerRejectBanner}>
                  <Ionicons name="alert-circle" size={13} color="#EF4444" />
                  <Text style={styles.viewerRejectText}>
                    Rejected: {allUploadedFiles[viewingIndex].approval_remark || "Please re-upload photo"}
                  </Text>
                </View>
              )}
              <Text style={styles.viewerSwipeHint}>
                Swipe left / right or tap arrows to view next/previous photo
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
    paddingHorizontal: 10,
    paddingTop: 8,
    paddingBottom: 36,
    gap: 8,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 10,
    elevation: 0,
    shadowColor: "transparent",
  },
  cardRejected: {
    borderColor: "#EF4444",
    backgroundColor: "#FEF2F2",
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    flexWrap: "wrap",
    gap: 4,
  },
  fileNameTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#0F172A",
  },
  requiredStar: {
    color: "#DC2626",
    fontSize: 14,
    fontWeight: "700",
  },
  rejectedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "#FEE2E2",
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "#FCA5A5",
  },
  rejectedBadgeText: {
    fontSize: 9.5,
    fontWeight: "700",
    color: "#B91C1C",
  },
  sampleLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "#F0F9FF",
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: "#BAE6FD",
  },
  sampleLinkText: {
    fontSize: 10.5,
    fontWeight: "600",
    color: "#0284C7",
  },
  uploadPromptBox: {
    paddingVertical: 2,
  },
  uploadMainBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#0F172A",
    paddingVertical: 9,
    borderRadius: 7,
  },
  uploadMainBtnText: {
    fontSize: 12.5,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  uploadedCompactRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#F8FAFC",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 8,
  },
  uploadedCompactRowRejected: {
    backgroundColor: "#FFF5F5",
    borderColor: "#FECACA",
  },
  thumbnailTouch: {
    position: "relative",
    width: 66,
    height: 66,
    borderRadius: 7,
    overflow: "hidden",
    backgroundColor: "#E2E8F0",
  },
  thumbnailImage: {
    width: "100%",
    height: "100%",
  },
  thumbnailZoomBadge: {
    position: "absolute",
    bottom: 3,
    right: 3,
    backgroundColor: "rgba(15, 23, 42, 0.75)",
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  thumbnailRightCol: {
    flex: 1,
    justifyContent: "center",
    gap: 4,
  },
  statusPillRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  uploadedSuccessPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "#DCFCE7",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 5,
  },
  uploadedSuccessPillText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#15803D",
  },
  rejectedPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "#FEE2E2",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 5,
  },
  rejectedPillText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#DC2626",
  },
  tapToViewHint: {
    fontSize: 10,
    color: "#64748B",
  },
  fileRejectBox: {
    backgroundColor: "#FEE2E2",
    borderRadius: 5,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: "#FCA5A5",
  },
  fileRejectText: {
    fontSize: 10.5,
    fontWeight: "600",
    color: "#B91C1C",
  },
  compactActionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 2,
  },
  replaceBtnCompact: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 5,
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: "#CBD5E1",
  },
  replaceBtnCompactRejected: {
    backgroundColor: "#FEF2F2",
    borderColor: "#FCA5A5",
  },
  replaceBtnText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#0F172A",
  },
  deleteBtnCompact: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingVertical: 4,
    paddingHorizontal: 6,
  },
  deleteBtnText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#DC2626",
  },
  uploadOtherBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    paddingVertical: 9,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 7,
    backgroundColor: "#F8FAFC",
    marginTop: 4,
  },
  uploadOtherBtnText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#0F172A",
  },
  otherFilesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 8,
  },
  otherFileCard: {
    width: (SCREEN_WIDTH - 20 - 20 - 8) / 2,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 7,
    overflow: "hidden",
    backgroundColor: "#FFFFFF",
  },
  otherFileTouch: {
    position: "relative",
    width: "100%",
    height: 75,
    backgroundColor: "#F1F5F9",
  },
  otherFileImage: {
    width: "100%",
    height: "100%",
  },
  otherFileInfo: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 5,
    backgroundColor: "#F8FAFC",
  },
  otherFileName: {
    fontSize: 10.5,
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
    maxWidth: 320,
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 16,
    alignItems: "center",
  },
  sourcePickerTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0F172A",
    textAlign: "center",
  },
  sourcePickerSub: {
    fontSize: 11,
    color: "#64748B",
    textAlign: "center",
    marginTop: 4,
    marginBottom: 14,
  },
  sourceBtnRow: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
    justifyContent: "center",
    marginBottom: 14,
  },
  sourceChoiceBtn: {
    flex: 1,
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  sourceIconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  sourceChoiceText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#0F172A",
  },
  sourceCancelBtn: {
    paddingVertical: 6,
    width: "100%",
    alignItems: "center",
  },
  sourceCancelText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#64748B",
  },
  sampleModalBox: {
    width: "100%",
    maxHeight: SCREEN_HEIGHT * 0.85,
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 14,
  },
  sampleModalHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  sampleModalTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0F172A",
  },
  modalCloseBtn: {
    padding: 4,
  },
  sampleImageContainer: {
    width: "100%",
    height: 220,
    backgroundColor: "#F1F5F9",
    borderRadius: 8,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  sampleImageFull: {
    width: "100%",
    height: "100%",
  },
  samplePlaceholderBox: {
    width: "100%",
    minHeight: 180,
    backgroundColor: "#F8FAFC",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  samplePlaceholderIconCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#E0F2FE",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  samplePlaceholderTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#0F172A",
    textAlign: "center",
    marginBottom: 4,
  },
  samplePlaceholderText: {
    fontSize: 11,
    color: "#64748B",
    textAlign: "center",
    lineHeight: 16,
    paddingHorizontal: 6,
  },
  sampleCaptureBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#0F172A",
    paddingVertical: 10,
    borderRadius: 7,
    marginTop: 12,
  },
  sampleCaptureBtnText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  fullViewerOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.96)",
    justifyContent: "space-between",
  },
  fullViewerTopBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: Platform.OS === "ios" ? 54 : 36,
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  fullViewerCloseBtn: {
    padding: 6,
  },
  fullViewerCounter: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: 0.5,
  },
  fullViewerCenter: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  fullViewerImage: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT * 0.72,
  },
  viewerNavArrow: {
    position: "absolute",
    top: "45%",
    backgroundColor: "rgba(15, 23, 42, 0.65)",
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 20,
  },
  viewerNavArrowLeft: {
    left: 12,
  },
  viewerNavArrowRight: {
    right: 12,
  },
  fullViewerBottom: {
    paddingBottom: Platform.OS === "ios" ? 44 : 24,
    paddingHorizontal: 20,
    alignItems: "center",
    gap: 6,
  },
  fullViewerTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFFFFF",
    textAlign: "center",
  },
  viewerRejectBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(239, 68, 68, 0.2)",
    borderWidth: 1,
    borderColor: "#EF4444",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  viewerRejectText: {
    fontSize: 11.5,
    fontWeight: "600",
    color: "#FCA5A5",
  },
  viewerSwipeHint: {
    fontSize: 11,
    color: "#94A3B8",
  },
});
