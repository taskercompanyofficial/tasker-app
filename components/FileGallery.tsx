import AppText from "@/components/common/AppText";
import Colors from "@/constants/Colors";
import getImageUrl from "@/lib/utils";
import { Ionicons } from "@expo/vector-icons";
import { useVideoPlayer, VideoView } from "expo-video";
import React, { useState } from "react";
import {
  Image,
  Modal,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";

interface FileGalleryProps {
  files: any[];
  title?: string;
  deletable?: boolean;
  onDelete?: (file: any) => void;
  onClearAll?: () => void;
  onAddFile?: () => void;
  uploading?: boolean;
}

const isVideo = (file: any) => {
  if (file.mime_type?.startsWith("video/")) return true;
  const videoExtensions = [".mp4", ".mov", ".avi", ".m4v", ".3gp"];
  return videoExtensions.some((ext) =>
    file.file_name?.toLowerCase().endsWith(ext),
  );
};

export default function FileGallery({
  files,
  title = "Uploaded Files",
  deletable = false,
  onDelete,
  onClearAll,
  onAddFile,
  uploading = false,
}: FileGalleryProps) {
  const [showImagePreview, setShowImagePreview] = useState(false);
  const [selectedImage, setSelectedImage] = useState<any>(null);

  const player = useVideoPlayer(
    selectedImage ? getImageUrl(selectedImage.file_path) : null,
    (player) => {
      if (selectedImage && isVideo(selectedImage)) {
        player.loop = true;
        player.play();
      }
    },
  );

  return (
    <View style={styles.container}>
      <View style={styles.grid}>
        {files.map((file, index) => (
          <TouchableOpacity
            key={index}
            onPress={() => {
              setSelectedImage(file);
              setShowImagePreview(true);
            }}
            style={styles.thumbnailContainer}
          >
            <Image
              source={{ uri: getImageUrl(file.file_path) }}
              style={styles.thumbnail}
            />
            {isVideo(file) && (
              <View style={styles.thumbnailPlayIcon}>
                <Ionicons name="play" size={20} color="#FFF" />
              </View>
            )}
            <View style={styles.fileInfo}>
              <AppText style={styles.fileName} numberOfLines={1}>
                {file.file_type?.name}
              </AppText>
            </View>
            {deletable && onDelete && (
              <TouchableOpacity
                style={styles.deleteBtn}
                onPress={() => onDelete(file)}
                activeOpacity={0.7}
              >
                <Ionicons name="close-circle" size={20} color="#EF4444" />
              </TouchableOpacity>
            )}
          </TouchableOpacity>
        ))}
        {/* Add File Button - Only show if onAddFile is provided */}
        {onAddFile && (
          <TouchableOpacity
            style={styles.addButton}
            onPress={onAddFile}
            disabled={uploading}
            activeOpacity={0.7}
          >
            <Ionicons
              name="add"
              size={24}
              color={Colors.themes.provider.primary}
            />
            <AppText style={styles.addButtonText}>Add</AppText>
          </TouchableOpacity>
        )}
      </View>

      {/* Image Preview Modal */}
      <Modal
        visible={showImagePreview}
        transparent={false}
        animationType="fade"
        onRequestClose={() => {
          setShowImagePreview(false);
          setSelectedImage(null);
        }}
      >
        {selectedImage && (
          <View style={styles.previewModal}>
            <View style={styles.previewHeader}>
              <View style={styles.previewInfo}>
                <AppText style={styles.previewTitle}>
                  {selectedImage.file_type?.name} • {selectedImage.file_size_kb}{" "}
                  KB
                </AppText>
              </View>
              <View style={styles.headerActions}>
                {deletable && onDelete && (
                  <TouchableOpacity
                    onPress={() => {
                      onDelete(selectedImage);
                      setShowImagePreview(false);
                      setSelectedImage(null);
                    }}
                    style={styles.deleteButton}
                  >
                    <Ionicons name="trash-outline" size={24} color="#EF4444" />
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  onPress={() => {
                    setShowImagePreview(false);
                    setSelectedImage(null);
                  }}
                  style={styles.previewClose}
                >
                  <Ionicons name="close" size={28} color="#FFF" />
                </TouchableOpacity>
              </View>
            </View>
            <View style={styles.previewContent}>
              {isVideo(selectedImage) ? (
                <VideoView
                  player={player}
                  style={styles.previewVideo}
                  nativeControls={true}
                  allowsPictureInPicture
                />
              ) : (
                <Image
                  source={{ uri: getImageUrl(selectedImage.file_path) }}
                  style={styles.previewImage}
                  resizeMode="contain"
                />
              )}
            </View>
          </View>
        )}
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 0,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  title: {
    fontSize: 13,
    fontWeight: "600",
    color: "#111827",
  },
  clearAllText: {
    fontSize: 12,
    color: "#EF4444",
    fontWeight: "600",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  thumbnailContainer: {
    width: "23%", // 4 columns (4 items per row)
    aspectRatio: 1, // Square boxes
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    overflow: "hidden",
    backgroundColor: "#F3F4F6",
    position: "relative",
  },
  thumbnail: {
    width: "100%",
    height: "100%",
    backgroundColor: "#F3F4F6",
  },
  thumbnailPlayIcon: {
    position: "absolute",
    top: "50%",
    left: "50%",
    marginLeft: -14,
    marginTop: -14,
    backgroundColor: "rgba(0,0,0,0.6)",
    borderRadius: 14,
    width: 28,
    height: 28,
    justifyContent: "center",
    alignItems: "center",
  },
  fileInfo: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(0,0,0,0.7)",
    padding: 4,
  },
  fileType: {
    fontSize: 11,
    fontWeight: "600",
    color: Colors.themes.provider.primary,
    marginBottom: 2,
  },
  fileName: {
    fontSize: 8,
    color: "#FFF",
    textAlign: "center",
  },
  deleteBtn: {
    position: "absolute",
    top: 0,
    right: 0,
    backgroundColor: "rgba(255,255,255,0.9)",
    borderRadius: 10,
    padding: 2,
  },
  addButton: {
    width: "23%",
    aspectRatio: 1,
    borderRadius: 6,
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: Colors.themes.provider.primary,
    backgroundColor: "rgba(30, 64, 175, 0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  addButtonText: {
    fontSize: 9,
    color: Colors.themes.provider.primary,
    fontWeight: "600",
    marginTop: 2,
  },
  previewModal: {
    flex: 1,
    backgroundColor: "#000",
  },
  previewHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    padding: 16,
    paddingTop: 50,
    backgroundColor: "rgba(0,0,0,0.9)",
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  deleteButton: {
    padding: 4,
  },
  previewInfo: {
    flex: 1,
    marginRight: 16,
  },
  previewTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFF",
    marginBottom: 4,
  },
  previewSubtitle: {
    fontSize: 12,
    color: "#9CA3AF",
  },
  previewClose: {
    padding: 4,
  },
  previewContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  previewImage: {
    width: "100%",
    height: "100%",
  },
  previewVideo: {
    width: "100%",
    height: "100%",
  },
});
