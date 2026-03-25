import FileGallery from "@/components/FileGallery";
import SheetSelect, { SheetSelectOption } from "@/components/SheetSelect";
import Colors from "@/constants/Colors";
import { FileType } from "@/types/file-type";
import { Ionicons } from "@expo/vector-icons";
import React, { useMemo } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Image,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get("window");

interface UploadData {
  fileTypeId: number;
  imageUri: string;
}

interface FileUploadSectionProps {
  files: any[];
  uploading: boolean;
  processing?: boolean;
  fileTypes: FileType[];
  showFileTypeSheet: boolean;
  showSourceSheet: boolean;
  showPreviewModal: boolean;
  uploadData: UploadData | null;
  onAddFile: () => void;
  onSelectFileType: (fileTypeId: number) => void;
  onSelectCamera: () => void;
  onSelectGallery: () => void;
  onConfirmUpload: () => void;
  onCancelPreview: () => void;
  onCancelFileTypeSheet: () => void;
  onCancelSourceSheet: () => void;
  onDelete: (file: any) => void;
  onClearAll: () => void;
  requiredFileTypeIds?: number[];
}

export default function FileUploadSection({
  files,
  uploading,
  fileTypes,
  showFileTypeSheet,
  showSourceSheet,
  showPreviewModal,
  uploadData,
  onAddFile,
  onSelectFileType,
  onSelectCamera,
  onSelectGallery,
  onConfirmUpload,
  onCancelPreview,
  onCancelFileTypeSheet,
  onCancelSourceSheet,
  onDelete,
  onClearAll,
  processing = false,
  requiredFileTypeIds = [],
}: FileUploadSectionProps) {
  // Convert file types to SheetSelectOption format
  const fileTypeOptions: SheetSelectOption[] = useMemo(() => {
    return fileTypes
      .map((ft) => {
        const isRequired = requiredFileTypeIds.includes(ft.id);
        const isDone = files.some((f) => f.file_type_id === ft.id);
        return {
          value: ft.id,
          label: ft.name,
          description: null,
          badge: isRequired ? "Required" : null,
          isDone,
          isRequired,
        };
      })
      .sort((a, b) => {
        // Required but not done first
        if (a.isRequired && !a.isDone && (!b.isRequired || b.isDone)) return -1;
        if (b.isRequired && !b.isDone && (!a.isRequired || a.isDone)) return 1;
        // Then required done
        if (a.isRequired && b.isRequired) return 0;
        if (a.isRequired) return -1;
        if (b.isRequired) return 1;
        return 0;
      });
  }, [fileTypes, files, requiredFileTypeIds]);

  // Get selected file type name for display
  const selectedFileTypeName = useMemo(() => {
    const ft = fileTypes.find((f) => f.id === uploadData?.fileTypeId);
    return ft?.name || "File";
  }, [fileTypes, uploadData?.fileTypeId]);

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.sectionTitle}>Photos & Videos</Text>
        <Text style={styles.fileCount}>
          {files.length} {files.length === 1 ? "file" : "files"}
        </Text>
      </View>

      {/* Quality Guidance */}
      <View style={styles.guidanceBox}>
        <Ionicons name="information-circle-outline" size={14} color="#0369A1" />
        <Text style={styles.guidanceText}>
          Clear, well-lit photos of serial numbers are required
        </Text>
      </View>

      {/* Uploading/Processing Overlay */}
      {(uploading || processing) && (
        <View style={styles.uploadingOverlay}>
          <ActivityIndicator
            size="large"
            color={Colors.themes.provider.primary}
          />
          <Text style={styles.uploadingText}>
            {processing ? "Compressing Media..." : "Uploading..."}
          </Text>
        </View>
      )}

      {/* Files */}
      <FileGallery
        files={files}
        deletable={true}
        onDelete={onDelete}
        onClearAll={onClearAll}
        onAddFile={onAddFile}
        uploading={uploading}
      />

      {/* File Type Selection Sheet */}
      <SheetSelect
        visible={showFileTypeSheet}
        onClose={onCancelFileTypeSheet}
        title="What are you uploading?"
        options={fileTypeOptions}
        selectedValue={null}
        loading={fileTypes.length === 0}
        emptyText="No file types available"
        onSelect={onSelectFileType}
      />

      {/* Source Selection Sheet (Camera/Gallery) */}
      <Modal
        visible={showSourceSheet}
        transparent
        animationType="slide"
        statusBarTranslucent
        onRequestClose={onCancelSourceSheet}
      >
        <View style={styles.overlay}>
          <TouchableOpacity
            style={styles.backdrop}
            onPress={onCancelSourceSheet}
            activeOpacity={1}
          />

          <View style={styles.sourceSheet}>
            {/* Handle bar */}
            <View style={styles.handleBar} />

            {/* Header */}
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>
                Upload {selectedFileTypeName}
              </Text>
              <TouchableOpacity
                onPress={onCancelSourceSheet}
                style={styles.closeBtn}
                activeOpacity={0.7}
              >
                <Ionicons name="close" size={20} color="#6B7280" />
              </TouchableOpacity>
            </View>

            {/* Source Options */}
            <View style={styles.sourceOptions}>
              <TouchableOpacity
                style={styles.sourceOption}
                onPress={onSelectCamera}
                activeOpacity={0.7}
              >
                <View style={styles.sourceIconContainer}>
                  <Ionicons
                    name="camera"
                    size={28}
                    color={Colors.themes.provider.primary}
                  />
                </View>
                <Text style={styles.sourceLabel}>Camera</Text>
                <Text style={styles.sourceDescription}>
                  Take a new photo or video
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.sourceOption}
                onPress={onSelectGallery}
                activeOpacity={0.7}
              >
                <View style={styles.sourceIconContainer}>
                  <Ionicons
                    name="images"
                    size={28}
                    color={Colors.themes.provider.primary}
                  />
                </View>
                <Text style={styles.sourceLabel}>Gallery</Text>
                <Text style={styles.sourceDescription}>
                  Choose from your library
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Preview Modal with Upload/Cancel */}
      <Modal
        visible={showPreviewModal}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={onCancelPreview}
      >
        <View style={styles.previewOverlay}>
          {/* Preview Header */}
          <View style={styles.previewHeader}>
            <Text style={styles.previewTitle}>
              Preview: {selectedFileTypeName}
            </Text>
            <TouchableOpacity
              onPress={onCancelPreview}
              style={styles.closeBtn}
              activeOpacity={0.7}
            >
              <Ionicons name="close" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {/* Image Preview */}
          <View style={styles.previewImageContainer}>
            {uploadData?.imageUri ? (
              <Image
                source={{ uri: uploadData.imageUri }}
                style={styles.previewImage}
                resizeMode="contain"
              />
            ) : (
              <View style={styles.previewPlaceholder}>
                <Ionicons name="image-outline" size={48} color="#9CA3AF" />
                <Text style={styles.previewPlaceholderText}>
                  No preview available
                </Text>
              </View>
            )}
          </View>

          {/* Action Buttons */}
          <View style={styles.previewActions}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={onCancelPreview}
              activeOpacity={0.8}
            >
              <Ionicons name="close-circle" size={20} color="#9CA3AF" />
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.uploadButton}
              onPress={onConfirmUpload}
              activeOpacity={0.8}
            >
              <Ionicons name="cloud-upload" size={20} color="#FFFFFF" />
              <Text style={styles.uploadButtonText}>Upload</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 6,
    padding: 10,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "700",
    color: "#111827",
  },
  fileCount: {
    fontSize: 9,
    color: "#6B7280",
  },
  guidanceBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#F0F9FF",
    padding: 8,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "#BAE6FD",
    marginBottom: 8,
    gap: 6,
  },
  guidanceText: {
    fontSize: 9,
    color: "#374151",
    lineHeight: 14,
    flex: 1,
  },
  uploadingBox: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 8,
    backgroundColor: "rgba(30, 64, 175, 0.06)", // vendor primary with opacity
    borderRadius: 4,
    marginBottom: 8,
    gap: 8,
  },
  uploadingText: {
    fontSize: 10,
    color: Colors.themes.provider.primary,
    fontWeight: "600",
  },
  uploadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255, 255, 255, 0.85)",
    zIndex: 20, // High z-index to cover the section
    borderRadius: 6,
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  galleryContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  addButton: {
    width: "23%",
    aspectRatio: 1,
    borderRadius: 6,
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: Colors.themes.provider.primary,
    backgroundColor: "rgba(30, 64, 175, 0.03)", // vendor primary with light opacity
    alignItems: "center",
    justifyContent: "center",
  },
  addButtonText: {
    fontSize: 9,
    color: Colors.themes.provider.primary,
    fontWeight: "600",
    marginTop: 2,
  },

  // Source Sheet Styles
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  backdrop: {
    flex: 1,
  },
  sourceSheet: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingBottom: 32,
  },
  handleBar: {
    width: 36,
    height: 4,
    backgroundColor: "#D1D5DB",
    borderRadius: 2,
    alignSelf: "center",
    marginTop: 10,
    marginBottom: 6,
  },
  sheetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  sheetTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#111827",
  },
  closeBtn: {
    padding: 4,
  },
  sourceOptions: {
    flexDirection: "row",
    padding: 16,
    gap: 12,
  },
  sourceOption: {
    flex: 1,
    alignItems: "center",
    padding: 16,
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  sourceIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(30, 64, 175, 0.08)", // vendor primary with light opacity
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  sourceLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 4,
  },
  sourceDescription: {
    fontSize: 9,
    color: "#6B7280",
    textAlign: "center",
  },

  // Preview Modal Styles
  previewOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.95)",
  },
  previewHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
  },
  previewTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  previewImageContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  previewImage: {
    width: SCREEN_WIDTH - 32,
    height: SCREEN_HEIGHT * 0.55,
    borderRadius: 8,
  },
  previewPlaceholder: {
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  previewPlaceholderText: {
    fontSize: 12,
    color: "#9CA3AF",
  },
  previewActions: {
    flexDirection: "row",
    padding: 16,
    paddingBottom: 40,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: 14,
    backgroundColor: "#374151",
    borderRadius: 8,
  },
  cancelButtonText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  uploadButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: 14,
    backgroundColor: Colors.themes.provider.primary,
    borderRadius: 8,
  },
  uploadButtonText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#FFFFFF",
  },
});
