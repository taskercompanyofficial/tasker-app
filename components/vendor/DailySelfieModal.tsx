import { localizedToast } from "@/lib/i18n/localized-toast";
import AppText from "@/components/common/AppText";
import Colors from "@/constants/Colors";
import { BorderRadius, Shadows, Spacing } from "@/constants/Styles";
import { useSession } from "@/context/ctx";
import { VENDOR_SUBMIT_DAILY_SELFIE_URL } from "@/lib/api-endpoints";
import myAxios from "@/lib/axios.config";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Image,
  Modal,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import SelfieCaptureModal from "./SelfieCaptureModal";

interface DailySelfieModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: (statusData: any) => void;
}

export default function DailySelfieModal({
  visible,
  onClose,
  onSuccess,
}: DailySelfieModalProps) {
  const { session, refetchUser } = useSession();
  const mode = session.appMode || "vendor";

  const [cameraActive, setCameraActive] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState<{
    uri: string;
    name: string;
    type: string;
  } | null>(null);
  const [uploading, setUploading] = useState(false);

  // When photo is snapped in the biometric camera
  const handlePhotoCaptured = (fileData: {
    uri: string;
    name: string;
    type: string;
  }) => {
    setCapturedPhoto(fileData);
    setCameraActive(false);
  };

  // Confirm photo & upload to server
  const handleUploadAndGoOnline = async () => {
    if (!capturedPhoto) return;

    try {
      setUploading(true);
      try {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } catch (_) {}

      const formData = new FormData();
      formData.append("selfie", {
        uri: capturedPhoto.uri,
        name: capturedPhoto.name || `daily_selfie_${Date.now()}.jpg`,
        type: capturedPhoto.type || "image/jpeg",
      } as any);

      const endpoint = VENDOR_SUBMIT_DAILY_SELFIE_URL(mode);
      const res = await myAxios.post(endpoint, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (res.data?.status === "success") {
        try {
          await Haptics.notificationAsync(
            Haptics.NotificationFeedbackType.Success
          );
        } catch (_) {}

        try {
          await refetchUser(mode);
        } catch (_) {}

        localizedToast({
          type: "success",
          text1: "✨ You are now Online!",
          text2: "Daily selfie verified. Profile active for 24 hours.",
        });

        const statusData = res.data.data;
        setCapturedPhoto(null);
        onSuccess(statusData);
        onClose();
      } else {
        throw new Error(res.data?.message || "Verification failed");
      }
    } catch (err: any) {
      console.error("[DailySelfieModal] Upload failed:", err);
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Could not upload selfie. Please try again.";
      localizedToast({
        type: "error",
        text1: "Upload Failed",
        text2: msg,
      });
    } finally {
      setUploading(false);
    }
  };

  const handleCancel = () => {
    setCapturedPhoto(null);
    setCameraActive(false);
    onClose();
  };

  if (!visible) return null;

  return (
    <>
      <Modal visible={visible && !cameraActive} animationType="fade" transparent>
        <View style={styles.backdrop}>
          <SafeAreaView style={styles.centerContainer}>
            <View style={styles.card}>
              {/* Header Icon */}
              <View style={styles.iconCircle}>
                <Ionicons
                  name="shield-checkmark"
                  size={36}
                  color={Colors.themes.provider.primary}
                />
              </View>

              <AppText style={styles.title}>Daily Selfie Verification</AppText>
              <AppText style={styles.subtitle}>
                Submit a fresh live photo to go online. This photo will serve as
                your active profile picture for the next 24 hours.
              </AppText>

              {/* Preview if already snapped */}
              {capturedPhoto ? (
                <View style={styles.previewContainer}>
                  <Image
                    source={{ uri: capturedPhoto.uri }}
                    style={styles.previewImage}
                  />
                  <View style={styles.badge24h}>
                    <Ionicons name="time" size={13} color="#fff" />
                    <AppText style={styles.badge24hText}>Active for 24 Hours</AppText>
                  </View>
                </View>
              ) : (
                <View style={styles.bulletList}>
                  <View style={styles.bulletItem}>
                    <Ionicons
                      name="camera-outline"
                      size={18}
                      color={Colors.themes.provider.primary}
                    />
                    <AppText style={styles.bulletText}>
                      Look directly into front camera
                    </AppText>
                  </View>
                  <View style={styles.bulletItem}>
                    <Ionicons
                      name="sunny-outline"
                      size={18}
                      color={Colors.themes.provider.primary}
                    />
                    <AppText style={styles.bulletText}>
                      Ensure good lighting and face visibility
                    </AppText>
                  </View>
                  <View style={styles.bulletItem}>
                    <Ionicons
                      name="refresh-outline"
                      size={18}
                      color={Colors.themes.provider.primary}
                    />
                    <AppText style={styles.bulletText}>
                      Resets automatically after 24 hours
                    </AppText>
                  </View>
                </View>
              )}

              {/* Actions */}
              {capturedPhoto ? (
                <View style={styles.actionColumn}>
                  <TouchableOpacity
                    style={[styles.primaryBtn, uploading && styles.btnDisabled]}
                    onPress={handleUploadAndGoOnline}
                    disabled={uploading}
                    activeOpacity={0.85}
                  >
                    {uploading ? (
                      <ActivityIndicator color="#fff" size="small" />
                    ) : (
                      <>
                        <Ionicons
                          name="checkmark-circle"
                          size={20}
                          color="#fff"
                        />
                        <AppText style={styles.primaryBtnText}>
                          Confirm & Go Online
                        </AppText>
                      </>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.retakeBtn}
                    onPress={() => setCameraActive(true)}
                    disabled={uploading}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="camera-reverse" size={18} color="#4B5563" />
                    <AppText style={styles.retakeBtnText}>Retake Photo</AppText>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.actionColumn}>
                  <TouchableOpacity
                    style={styles.primaryBtn}
                    onPress={() => setCameraActive(true)}
                    activeOpacity={0.85}
                  >
                    <Ionicons name="camera" size={20} color="#fff" />
                    <AppText style={styles.primaryBtnText}>Take Live Selfie</AppText>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.cancelBtn}
                    onPress={handleCancel}
                    activeOpacity={0.7}
                  >
                    <AppText style={styles.cancelBtnText}>Stay Offline</AppText>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </SafeAreaView>
        </View>
      </Modal>

      {/* Live Biometric Camera Modal */}
      <SelfieCaptureModal
        visible={cameraActive}
        onCaptured={handlePhotoCaptured}
        onClose={() => setCameraActive(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.65)",
    justifyContent: "center",
    alignItems: "center",
  },
  centerContainer: {
    width: "90%",
    maxWidth: 380,
    justifyContent: "center",
    alignItems: "center",
  },
  card: {
    width: "100%",
    backgroundColor: "#fff",
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    alignItems: "center",
    ...Shadows.lg,
  },
  iconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: "#EFF6FF",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
    textAlign: "center",
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 13,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 19,
    marginBottom: Spacing.lg,
  },
  bulletList: {
    width: "100%",
    backgroundColor: "#F9FAFB",
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    gap: 10,
    marginBottom: Spacing.lg,
  },
  bulletItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  bulletText: {
    fontSize: 13,
    color: "#374151",
    fontWeight: "500",
    flex: 1,
  },
  previewContainer: {
    width: 170,
    height: 170,
    borderRadius: 85,
    overflow: "hidden",
    alignSelf: "center",
    marginBottom: Spacing.lg,
    borderWidth: 3,
    borderColor: "#10B981",
    position: "relative",
  },
  previewImage: {
    width: "100%",
    height: "100%",
  },
  badge24h: {
    position: "absolute",
    bottom: 8,
    alignSelf: "center",
    backgroundColor: "rgba(16, 185, 129, 0.95)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  badge24hText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "700",
  },
  actionColumn: {
    width: "100%",
    gap: 10,
  },
  primaryBtn: {
    backgroundColor: Colors.themes.provider.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: BorderRadius.lg,
    ...Shadows.sm,
  },
  btnDisabled: {
    opacity: 0.65,
  },
  primaryBtnText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
  },
  retakeBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
  },
  retakeBtnText: {
    color: "#4B5563",
    fontSize: 14,
    fontWeight: "600",
  },
  cancelBtn: {
    alignItems: "center",
    paddingVertical: 8,
  },
  cancelBtnText: {
    color: "#9CA3AF",
    fontSize: 14,
    fontWeight: "500",
  },
});
