import Colors from "@/constants/Colors";
import { BorderRadius, Shadows, Spacing } from "@/constants/Styles";
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
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";

export default function Step4LiveSelfie() {
  const router = useRouter();
  const { session, refetchUser } = useSession();
  const user = session.vendorUser;

  const [selfieModalVisible, setSelfieModalVisible] = useState(false);
  const [profileFile, setProfileFile] = useState<{ uri: string; name: string; type: string } | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  const handleSelfieCaptured = (fileData: { uri: string; name: string; type: string }) => {
    setProfileFile(fileData);
    Toast.show({
      type: "success",
      text1: "✨ Live Photo Captured",
      text2: "Tap below to save and verify your live photo.",
    });
  };

  const handleVerifyAndFinish = async () => {
    if (!profileFile && !user?.profile_image) {
      Toast.show({
        type: "error",
        text1: "Live Selfie Required",
        text2: "Please capture your live selfie photo with the camera.",
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

        if (res.data?.data?.fallback || res.data?.data?.manual_review) {
          Toast.show({
            type: "info",
            text1: "📸 Photo Submitted",
            text2: "Saved for manual verification. Proceeding to References.",
          });
        } else {
          Toast.show({
            type: "success",
            text1: "🎉 Live Photo Verified!",
            text2: "Proceeding to Guarantor References.",
          });
        }

        router.push("/vendor/complete-profile/step-5" as any);
      }
    } catch (error: any) {
      console.warn("[Step4LiveSelfie] Upload error:", error?.response?.data || error?.message);
      const message =
        error?.response?.data?.message ||
        "Failed to upload selfie. Please ensure good lighting and try again.";

      Toast.show({
        type: "error",
        text1: "Selfie Upload",
        text2: message,
        visibilityTime: 4000,
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
      <View style={styles.customHeader}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backBtn}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={20} color={Colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Live Face Verification</Text>
        <View style={styles.stepIndicatorPill}>
          <Text style={styles.stepIndicatorText}>Step 4 of 6</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.stepSectionContainer}>
          {/* Hero Avatar Card */}
          <View style={styles.avatarCard}>
            <View style={[styles.avatarWrapper, hasPhoto && styles.avatarWrapperActive]}>
              {hasPhoto ? (
                <Image source={{ uri: activeImageUri }} style={styles.avatarImage} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Ionicons name="person" size={54} color="#94A3B8" />
                  <View style={styles.cameraIconBadge}>
                    <Ionicons name="camera" size={16} color="#FFFFFF" />
                  </View>
                </View>
              )}
            </View>

            {hasPhoto ? (
              <View style={styles.avatarSuccessBadge}>
                <Ionicons name="checkmark-circle" size={15} color="#10B981" />
                <Text style={styles.avatarSuccessText}>Live Photo Captured</Text>
              </View>
            ) : (
              <Text style={styles.avatarHintText}>Mandatory Live Camera Capture</Text>
            )}

            {/* Camera Trigger Button */}
            <TouchableOpacity
              style={styles.takeSelfieBtn}
              activeOpacity={0.88}
              onPress={() => setSelfieModalVisible(true)}
            >
              <Ionicons name="camera" size={20} color="#FFFFFF" />
              <Text style={styles.takeSelfieBtnText}>
                {hasPhoto ? "Retake Live Selfie" : "Open Live Selfie Camera"}
              </Text>
              <Ionicons name="scan-outline" size={18} color="#93C5FD" />
            </TouchableOpacity>
          </View>

          {/* Photo Guidelines Card */}
          <View style={styles.guidelinesCard}>
            <View style={styles.guidelinesHeader}>
              <Ionicons name="shield-checkmark-outline" size={18} color={Colors.themes.provider.primary} />
              <Text style={styles.guidelinesTitle}>Biometric Verification Rules</Text>
            </View>

            <View style={styles.guideItemRow}>
              <View style={[styles.guideIconCircle, { backgroundColor: "#10B98115" }]}>
                <Ionicons name="sunny" size={16} color="#10B981" />
              </View>
              <Text style={styles.guideHeading}>Good lighting</Text>
            </View>

            <View style={styles.guideItemRow}>
              <View style={[styles.guideIconCircle, { backgroundColor: "#2563EB15" }]}>
                <Ionicons name="eye" size={16} color="#2563EB" />
              </View>
              <Text style={styles.guideHeading}>Face centered, look at camera</Text>
            </View>

            <View style={styles.guideItemRow}>
              <View style={[styles.guideIconCircle, { backgroundColor: "#EF444415" }]}>
                <Ionicons name="close-circle" size={16} color="#EF4444" />
              </View>
              <Text style={styles.guideHeading}>No accessories (glasses, caps, masks)</Text>
            </View>
          </View>

          {/* Final Submit Action */}
          <TouchableOpacity
            style={[styles.finishBtn, (!hasPhoto || isVerifying) && styles.disabledBtn]}
            disabled={!hasPhoto || isVerifying}
            activeOpacity={0.88}
            onPress={handleVerifyAndFinish}
          >
            <LinearGradient
              colors={
                !hasPhoto
                  ? ["#94A3B8", "#64748B"]
                  : ["#1E3A8A", "#2563EB"]
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.finishBtnGradient}
            >
              {isVerifying ? (
                <>
                  <ActivityIndicator size="small" color="#FFFFFF" />
                  <Text style={styles.finishBtnText}>
                    Saving live photo...
                  </Text>
                </>
              ) : (
                <>
                  <Ionicons name="sparkles" size={18} color="#FFFFFF" />
                  <Text style={styles.finishBtnText}>Save & Continue</Text>
                  <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
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
  customHeader: {
    paddingHorizontal: Spacing.md,
    height: 54,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral.gray[100],
  },
  backBtn: {
    padding: 6,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.text.primary,
  },
  stepIndicatorPill: {
    backgroundColor: "#EFF6FF",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  stepIndicatorText: {
    fontSize: 11,
    fontWeight: "700",
    color: Colors.themes.provider.primary,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xl,
  },
  stepSectionContainer: {
    width: "100%",
  },

  // Avatar Card
  avatarCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: Spacing.md,
    ...Shadows.sm,
  },
  avatarWrapper: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#F1F5F9",
    borderWidth: 3,
    borderColor: "#CBD5E1",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
    marginBottom: Spacing.sm,
  },
  avatarWrapperActive: {
    borderColor: "#2563EB",
    ...Shadows.md,
  },
  avatarImage: {
    width: "100%",
    height: "100%",
  },
  avatarPlaceholder: {
    alignItems: "center",
    justifyContent: "center",
  },
  cameraIconBadge: {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: Colors.themes.provider.primary,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  avatarSuccessBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#10B98118",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    marginBottom: Spacing.md,
  },
  avatarSuccessText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#10B981",
  },
  avatarHintText: {
    fontSize: 12,
    color: Colors.text.secondary,
    marginBottom: Spacing.md,
    fontWeight: "500",
  },
  takeSelfieBtn: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Colors.themes.provider.primary,
    paddingVertical: 13,
    borderRadius: BorderRadius.md,
    ...Shadows.sm,
  },
  takeSelfieBtnText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFFFFF",
  },

  // Guidelines Card
  guidelinesCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: Spacing.md,
  },
  guidelinesHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: Spacing.md,
    paddingBottom: Spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  guidelinesTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: Colors.text.primary,
  },
  guideItemRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: Spacing.sm,
  },
  guideIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  guideHeading: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.text.primary,
    flex: 1,
  },

  // Finish Action
  finishBtn: {
    width: "100%",
    borderRadius: BorderRadius.lg,
    overflow: "hidden",
    ...Shadows.md,
    marginTop: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  finishBtnGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 15,
    gap: 8,
  },
  finishBtnText: {
    fontSize: 15,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  disabledBtn: {
    opacity: 0.65,
  },
});
