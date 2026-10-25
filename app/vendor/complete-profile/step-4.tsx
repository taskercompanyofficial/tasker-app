import { localizedToast } from "@/lib/i18n/localized-toast";
import AppText from "@/components/common/AppText";
import Colors from "@/constants/Colors";
import { BorderRadius, Spacing } from "@/constants/Styles";
import { useSession } from "@/context/ctx";
import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import SelfieCaptureModal from "@/components/vendor/SelfieCaptureModal";
import myAxios from "@/lib/axios.config";
import { VENDOR_VERIFY_SELFIE_URL } from "@/lib/api-endpoints";
import * as Haptics from "expo-haptics";
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StatusBar,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Step4LiveSelfie() {
  const router = useRouter();
  const { session, refetchUser, signOutMode } = useSession();
  const user = session.vendorUser;

  const [selfieModalVisible, setSelfieModalVisible] = useState(false);
  const [profileFile, setProfileFile] = useState<{ uri: string; name: string; type: string } | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  const handleLogout = () => {
    Alert.alert("Log Out", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Log Out",
        style: "destructive",
        onPress: async () => {
          try {
            await signOutMode("vendor");
          } catch (_) {}
          router.replace("/vendor/login" as any);
        },
      },
    ]);
  };

  const handleSelfieCaptured = (fileData: { uri: string; name: string; type: string }) => {
    setProfileFile(fileData);
    localizedToast({
      type: "success",
      text1: "Live Photo Captured",
      text2: "Tap below to save and continue.",
    });
  };

  const handleVerifyAndFinish = async () => {
    if (!profileFile && !user?.profile_image) {
      localizedToast({
        type: "error",
        text1: "Live Selfie Required",
        text2: "Please capture your live photo with the camera.",
      });
      return;
    }

    try {
      setIsVerifying(true);
      try {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      } catch (_) {}

      const formData = new FormData();

      if (profileFile) {
        formData.append("profile_image_file", {
          uri: profileFile.uri,
          name: profileFile.name || "live_selfie.jpg",
          type: profileFile.type || "image/jpeg",
        } as any);
      }

      const res = await myAxios.post(VENDOR_VERIFY_SELFIE_URL, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (res.data?.status === "success") {
        try {
          await refetchUser("vendor");
        } catch (_) {}

        try {
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch (_) {}

        localizedToast({
          type: "success",
          text1: "Live Photo Saved",
          text2: "Proceeding to References.",
        });

        router.push("/vendor/complete-profile/step-5" as any);
      }
    } catch (error: any) {
      console.warn("[Step4LiveSelfie] Upload error:", error?.response?.data || error?.message);
      const message =
        error?.response?.data?.message ||
        "Failed to upload photo. Please ensure good lighting and try again.";

      localizedToast({
        type: "error",
        text1: "Photo Upload",
        text2: message,
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const hasPhoto = Boolean(profileFile || user?.profile_image);
  const activeImageUri = profileFile?.uri || user?.profile_image;

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <StatusBar barStyle="dark-content" />

      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={handleLogout}
          style={styles.logoutBtn}
          activeOpacity={0.7}
        >
          <Ionicons name="log-out-outline" size={16} color="#DC2626" />
          <AppText style={styles.logoutBtnText}>Logout</AppText>
        </TouchableOpacity>
        <AppText style={styles.headerTitle}>Live Face Photo</AppText>
        <View style={styles.stepBadge}>
          <AppText style={styles.stepBadgeText}>Step 3 of 5</AppText>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.introBox}>
          <AppText style={styles.heading}>Live Face Photo</AppText>
          <AppText style={styles.subtitle}>
            Take a real-time live photo of yourself for your vendor profile.
          </AppText>
        </View>

        {/* Hero Avatar Card */}
        <View style={styles.avatarCard}>
          <View style={[styles.avatarWrapper, hasPhoto && styles.avatarWrapperActive]}>
            {hasPhoto ? (
              <Image source={{ uri: activeImageUri }} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Ionicons name="person" size={48} color="#94A3B8" />
              </View>
            )}
          </View>

          {hasPhoto ? (
            <View style={styles.avatarSuccessBadge}>
              <Ionicons name="checkmark-circle" size={14} color="#059669" />
              <AppText style={styles.avatarSuccessText}>Photo Captured</AppText>
            </View>
          ) : (
            <AppText style={styles.avatarHintText}>Take a clear face photo</AppText>
          )}

          {/* Camera Trigger Button */}
          <TouchableOpacity
            style={styles.takeSelfieBtn}
            activeOpacity={0.85}
            onPress={() => setSelfieModalVisible(true)}
          >
            <Ionicons name="camera-outline" size={18} color="#FFFFFF" />
            <AppText style={styles.takeSelfieBtnText}>
              {hasPhoto ? "Retake Photo" : "Open Camera"}
            </AppText>
          </TouchableOpacity>
        </View>

        {/* Photo Guidelines Card */}
        <View style={styles.guidelinesCard}>
          <AppText style={styles.guidelinesTitle}>Photo Guidelines</AppText>

          <View style={styles.guideItemRow}>
            <Ionicons name="sunny-outline" size={16} color="#2563EB" />
            <AppText style={styles.guideHeading}>Good lighting, no shadows</AppText>
          </View>

          <View style={styles.guideItemRow}>
            <Ionicons name="eye-outline" size={16} color="#2563EB" />
            <AppText style={styles.guideHeading}>Face centered, look directly at camera</AppText>
          </View>

          <View style={styles.guideItemRow}>
            <Ionicons name="close-circle-outline" size={16} color="#DC2626" />
            <AppText style={styles.guideHeading}>No glasses, sunglasses, caps, or masks</AppText>
          </View>
        </View>

        {/* Submit Action */}
        <TouchableOpacity
          style={[styles.finishBtn, (!hasPhoto || isVerifying) && styles.disabledBtn]}
          disabled={!hasPhoto || isVerifying}
          activeOpacity={0.88}
          onPress={handleVerifyAndFinish}
        >
          <LinearGradient
            colors={!hasPhoto ? ["#94A3B8", "#64748B"] : ["#1E3A8A", "#2563EB"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.finishBtnGradient}
          >
            {isVerifying ? (
              <>
                <ActivityIndicator size="small" color="#FFFFFF" />
                <AppText style={styles.finishBtnText}>Saving photo...</AppText>
              </>
            ) : (
              <>
                <AppText style={styles.finishBtnText}>Save & Continue</AppText>
                <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>

      {/* Live Selfie Camera Modal */}
      <SelfieCaptureModal
        visible={selfieModalVisible}
        onCaptured={handleSelfieCaptured}
        onClose={() => setSelfieModalVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  header: {
    paddingHorizontal: 12,
    height: 46,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderRadius: 6,
    backgroundColor: "#FEF2F2",
  },
  logoutBtnText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#DC2626",
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: Colors.text.primary,
  },
  stepBadge: {
    backgroundColor: "#EFF6FF",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  stepBadgeText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#2563EB",
  },
  scrollContent: {
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: Spacing.xl,
  },
  introBox: {
    marginBottom: 12,
  },
  heading: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.text.primary,
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 12,
    color: Colors.text.secondary,
    lineHeight: 16,
  },
  avatarCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: 10,
  },
  avatarWrapper: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#F1F5F9",
    borderWidth: 2,
    borderColor: "#CBD5E1",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
    marginBottom: 8,
  },
  avatarWrapperActive: {
    borderColor: "#2563EB",
  },
  avatarImage: {
    width: "100%",
    height: "100%",
  },
  avatarPlaceholder: {
    alignItems: "center",
    justifyContent: "center",
  },
  avatarSuccessBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#ECFDF5",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
    marginBottom: 10,
  },
  avatarSuccessText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#059669",
  },
  avatarHintText: {
    fontSize: 11.5,
    color: Colors.text.secondary,
    marginBottom: 10,
  },
  takeSelfieBtn: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#1E3A8A",
    height: 38,
    borderRadius: 8,
  },
  takeSelfieBtnText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  guidelinesCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: 10,
  },
  guidelinesTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.text.primary,
    marginBottom: 8,
  },
  guideItemRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
  },
  guideHeading: {
    fontSize: 12,
    color: Colors.text.secondary,
    flex: 1,
  },
  finishBtn: {
    borderRadius: 10,
    overflow: "hidden",
    marginTop: 4,
    elevation: 1,
  },
  finishBtnGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    gap: 6,
  },
  finishBtnText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  disabledBtn: {
    opacity: 0.65,
  },
});
