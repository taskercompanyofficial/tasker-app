import { localizedToast } from "@/lib/i18n/localized-toast";
import AppText from "@/components/common/AppText";
import { useSession } from "@/context/ctx";
import { VENDOR_SUBMIT_DAILY_SELFIE_URL } from "@/lib/api-endpoints";
import myAxios from "@/lib/axios.config";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Modal,
  StyleSheet,
  View,
} from "react-native";
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

  const [uploading, setUploading] = useState(false);

  // Directly upload when selfie photo is captured in the borderless camera
  const handlePhotoCaptured = async (fileData: {
    uri: string;
    name: string;
    type: string;
  }) => {
    try {
      setUploading(true);
      try {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } catch (_) {}

      const formData = new FormData();
      formData.append("selfie", {
        uri: fileData.uri,
        name: fileData.name || `daily_selfie_${Date.now()}.jpg`,
        type: fileData.type || "image/jpeg",
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
        text1: "Verification Failed",
        text2: msg,
      });
    } finally {
      setUploading(false);
    }
  };

  if (!visible) return null;

  return (
    <>
      {/* 1. Directly Show the Minimal Borderless Camera (No intermediate dialogs) */}
      <SelfieCaptureModal
        visible={visible && !uploading}
        onCaptured={handlePhotoCaptured}
        onClose={onClose}
      />

      {/* 2. Sleek Minimal Loading Overlay while submitting selfie & going online */}
      <Modal visible={uploading} transparent animationType="fade">
        <View style={styles.loadingBackdrop}>
          <View style={styles.loadingCard}>
            <ActivityIndicator size="large" color="#10B981" />
            <AppText style={styles.loadingTitle}>Verifying Daily Photo...</AppText>
            <AppText style={styles.loadingSub}>
              Activating your profile for customer bookings
            </AppText>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  loadingBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.65)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  loadingCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    paddingVertical: 28,
    paddingHorizontal: 24,
    alignItems: "center",
    gap: 12,
    width: "100%",
    maxWidth: 320,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
  },
  loadingTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0F172A",
    textAlign: "center",
  },
  loadingSub: {
    fontSize: 12,
    color: "#64748B",
    textAlign: "center",
    lineHeight: 16,
  },
});
