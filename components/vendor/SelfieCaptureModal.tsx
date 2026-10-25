import { localizedToast } from "@/lib/i18n/localized-toast";
import AppText from "@/components/common/AppText";
import Colors from "@/constants/Colors";
import { BorderRadius, Spacing } from "@/constants/Styles";
import { Ionicons } from "@expo/vector-icons";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as ImageManipulator from "expo-image-manipulator";
import * as Haptics from "expo-haptics";
import React, { useRef, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Image,
  Linking,
  Modal,
  Platform,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

// Face Oval Frame Dimensions
const OVAL_WIDTH = Math.min(SCREEN_WIDTH * 0.72, 260);
const OVAL_HEIGHT = OVAL_WIDTH * 1.34;

interface SelfieCaptureModalProps {
  visible: boolean;
  onCaptured: (fileData: { uri: string; name: string; type: string }) => void;
  onClose: () => void;
}

export default function SelfieCaptureModal({
  visible,
  onCaptured,
  onClose,
}: SelfieCaptureModalProps) {
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<any>(null);
  const [capturing, setCapturing] = useState(false);
  const [capturedUri, setCapturedUri] = useState<string | null>(null);

  // Capture Selfie Photo
  const handleCapture = async () => {
    if (!cameraRef.current || capturing) return;
    try {
      try {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } catch (_) {}

      setCapturing(true);

      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.9,
        skipProcessing: false,
      });

      if (photo?.uri) {
        const photoWidth = photo.width || SCREEN_WIDTH * 2;
        const photoHeight = photo.height || SCREEN_HEIGHT * 2;

        const size = Math.min(photoWidth, photoHeight);
        const originX = Math.round((photoWidth - size) / 2);
        const originY = Math.round((photoHeight - size) / 2);

        const manipulated = await ImageManipulator.manipulateAsync(
          photo.uri,
          [
            {
              crop: {
                originX: Math.max(0, originX),
                originY: Math.max(0, originY),
                width: Math.min(size, photoWidth),
                height: Math.min(size, photoHeight),
              },
            },
          ],
          { compress: 0.88, format: ImageManipulator.SaveFormat.JPEG }
        );

        setCapturedUri(manipulated.uri);
      }
    } catch (e) {
      console.warn("[SelfieCapture] Error taking photo:", e);
      localizedToast({ type: "error", text1: "Failed to capture photo. Please try again." });
    } finally {
      setCapturing(false);
    }
  };

  // Confirm photo
  const handleConfirmPhoto = () => {
    if (!capturedUri) return;
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (_) {}

    onCaptured({
      uri: capturedUri,
      name: `vendor_selfie_${Date.now()}.jpg`,
      type: "image/jpeg",
    });
    setCapturedUri(null);
    onClose();
  };

  // Retake photo
  const handleRetake = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (_) {}
    setCapturedUri(null);
  };

  const handleOpenSettings = async () => {
    try {
      await Linking.openSettings();
    } catch (_) {}
  };

  if (!visible) return null;

  // Enhanced Minimal Camera Permission Screen
  if (!permission?.granted) {
    const isPermanentlyDenied = permission && !permission.canAskAgain && permission.status === "denied";

    return (
      <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
        <SafeAreaView style={styles.permContainer} edges={["top", "bottom"]}>
          {/* Header Bar */}
          <View style={styles.permHeader}>
            <TouchableOpacity onPress={onClose} style={styles.permHeaderCloseBtn} activeOpacity={0.7}>
              <Ionicons name="close" size={20} color="#64748B" />
            </TouchableOpacity>
          </View>

          <View style={styles.permContent}>
            {/* Visual Icon */}
            <View style={styles.permIconWrapper}>
              <View style={styles.permIconCircle}>
                <Ionicons name="camera-outline" size={40} color="#2563EB" />
              </View>
              <View style={styles.permCheckBadge}>
                <Ionicons name="shield-checkmark" size={16} color="#059669" />
              </View>
            </View>

            <AppText style={styles.permTitle}>Camera Access Required</AppText>
            <AppText style={styles.permSub}>
              We need access to your camera to take a real-time face photo for your vendor profile verification.
            </AppText>

            {/* Benefit / Feature List */}
            <View style={styles.permBenefitsCard}>
              <View style={styles.benefitRow}>
                <View style={styles.benefitIconBox}>
                  <Ionicons name="person-circle-outline" size={18} color="#2563EB" />
                </View>
                <View style={styles.benefitTextBox}>
                  <AppText style={styles.benefitHeading}>Live Identity Verification</AppText>
                  <AppText style={styles.benefitDesc}>Confirms you match your CNIC document</AppText>
                </View>
              </View>

              <View style={styles.benefitDivider} />

              <View style={styles.benefitRow}>
                <View style={styles.benefitIconBox}>
                  <Ionicons name="lock-closed-outline" size={18} color="#2563EB" />
                </View>
                <View style={styles.benefitTextBox}>
                  <AppText style={styles.benefitHeading}>Private & Secure</AppText>
                  <AppText style={styles.benefitDesc}>Stored safely and only used for your profile</AppText>
                </View>
              </View>

              <View style={styles.benefitDivider} />

              <View style={styles.benefitRow}>
                <View style={styles.benefitIconBox}>
                  <Ionicons name="flash-outline" size={18} color="#2563EB" />
                </View>
                <View style={styles.benefitTextBox}>
                  <AppText style={styles.benefitHeading}>Quick & Simple</AppText>
                  <AppText style={styles.benefitDesc}>Takes less than 10 seconds</AppText>
                </View>
              </View>
            </View>

            {isPermanentlyDenied && (
              <View style={styles.permDeniedNotice}>
                <Ionicons name="alert-circle-outline" size={16} color="#B45309" />
                <AppText style={styles.permDeniedText}>
                  Camera access was previously denied. Please enable it in device settings to proceed.
                </AppText>
              </View>
            )}
          </View>

          {/* Action Buttons */}
          <View style={styles.permActions}>
            {isPermanentlyDenied ? (
              <TouchableOpacity
                style={styles.permPrimaryBtn}
                onPress={handleOpenSettings}
                activeOpacity={0.88}
              >
                <Ionicons name="settings-outline" size={18} color="#FFFFFF" />
                <AppText style={styles.permPrimaryBtnText}>Open Device Settings</AppText>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.permPrimaryBtn}
                onPress={requestPermission}
                activeOpacity={0.88}
              >
                <Ionicons name="camera-outline" size={18} color="#FFFFFF" />
                <AppText style={styles.permPrimaryBtnText}>Allow Camera Access</AppText>
              </TouchableOpacity>
            )}

            <TouchableOpacity style={styles.permCancelBtn} onPress={onClose} activeOpacity={0.7}>
              <AppText style={styles.permCancelBtnText}>Not Now</AppText>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
    );
  }

  return (
    <Modal visible={visible} animationType="fade" transparent={false} onRequestClose={onClose}>
      <View style={styles.container}>
        {/* Top Header Bar */}
        <SafeAreaView style={styles.topBar} edges={["top"]}>
          <TouchableOpacity onPress={onClose} style={styles.closeCircleBtn} activeOpacity={0.7}>
            <Ionicons name="close" size={20} color="#FFFFFF" />
          </TouchableOpacity>
          <AppText style={styles.topBarTitle}>
            {capturedUri ? "Review Photo" : "Live Photo"}
          </AppText>
          <View style={styles.topBarSpacer} />
        </SafeAreaView>

        {capturedUri ? (
          // Minimal Photo Review Screen
          <View style={styles.previewContainer}>
            <View style={styles.previewCard}>
              <Image source={{ uri: capturedUri }} style={styles.previewImage} />
            </View>

            <View style={styles.previewBadge}>
              <Ionicons name="checkmark-circle" size={15} color="#10B981" />
              <AppText style={styles.previewBadgeText}>Photo Captured</AppText>
            </View>

            <AppText style={styles.previewTitle}>Does this photo look clear?</AppText>
            <AppText style={styles.previewSub}>
              Make sure your face is well-lit, centered, and easily recognizable.
            </AppText>

            <View style={styles.previewActions}>
              <TouchableOpacity
                style={styles.retakeBtn}
                onPress={handleRetake}
                activeOpacity={0.8}
              >
                <Ionicons name="refresh-outline" size={17} color="#FFFFFF" />
                <AppText style={styles.retakeBtnText}>Retake</AppText>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.confirmBtn}
                onPress={handleConfirmPhoto}
                activeOpacity={0.88}
              >
                <Ionicons name="checkmark" size={18} color="#FFFFFF" />
                <AppText style={styles.confirmBtnText}>Use Photo</AppText>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          // Minimal Live Front Camera Screen
          <View style={styles.cameraWrapper}>
            <CameraView
              ref={cameraRef}
              style={styles.cameraFill}
              facing="front"
            />

            {/* Clean Mask with Smooth Oval Cutout */}
            <View style={styles.maskContainer} pointerEvents="none">
              <View style={styles.maskTop}>
                {/* Instruction Banner */}
                <View style={styles.guidanceBanner}>
                  <Ionicons name="scan-outline" size={15} color="#FFFFFF" />
                  <AppText style={styles.guidanceBannerText}>Center your face inside the frame</AppText>
                </View>
              </View>

              <View style={styles.maskMiddleRow}>
                <View style={styles.maskSide} />
                <View style={styles.ovalCutout} />
                <View style={styles.maskSide} />
              </View>

              <View style={styles.maskBottom} />
            </View>

            {/* Bottom Shutter Dock */}
            <SafeAreaView style={styles.bottomControls} edges={["bottom"]}>
              <AppText style={styles.captureHintText}>Look directly at the camera</AppText>

              <TouchableOpacity
                style={[styles.shutterOuterRing, capturing && styles.shutterDisabled]}
                onPress={handleCapture}
                disabled={capturing}
                activeOpacity={0.85}
              >
                {capturing ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <View style={styles.shutterInnerCircle} />
                )}
              </TouchableOpacity>
            </SafeAreaView>
          </View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0B0F19",
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    backgroundColor: "rgba(11, 15, 25, 0.9)",
    zIndex: 10,
  },
  closeCircleBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    justifyContent: "center",
    alignItems: "center",
  },
  topBarTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  topBarSpacer: {
    width: 36,
  },

  // Camera View
  cameraWrapper: {
    flex: 1,
  },
  cameraFill: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  maskContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  maskTop: {
    flex: 1,
    backgroundColor: "rgba(11, 15, 25, 0.62)",
    justifyContent: "center",
    alignItems: "center",
    paddingBottom: 16,
  },
  maskMiddleRow: {
    flexDirection: "row",
    height: OVAL_HEIGHT,
  },
  maskSide: {
    flex: 1,
    backgroundColor: "rgba(11, 15, 25, 0.62)",
  },
  ovalCutout: {
    width: OVAL_WIDTH,
    height: OVAL_HEIGHT,
    borderRadius: OVAL_WIDTH / 2,
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.85)",
    backgroundColor: "transparent",
  },
  maskBottom: {
    flex: 1.4,
    backgroundColor: "rgba(11, 15, 25, 0.62)",
  },
  guidanceBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    backgroundColor: "rgba(15, 23, 42, 0.75)",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.15)",
  },
  guidanceBannerText: {
    fontSize: 12.5,
    fontWeight: "600",
    color: "#FFFFFF",
  },

  // Bottom Controls
  bottomControls: {
    position: "absolute",
    bottom: 24,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  captureHintText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#94A3B8",
    marginBottom: 16,
  },
  shutterOuterRing: {
    width: 74,
    height: 74,
    borderRadius: 37,
    borderWidth: 3.5,
    borderColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "transparent",
  },
  shutterDisabled: {
    opacity: 0.5,
  },
  shutterInnerCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#FFFFFF",
  },

  // Preview Screen
  previewContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing.xl,
  },
  previewCard: {
    width: 220,
    height: 220,
    borderRadius: 110,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.25)",
    marginBottom: Spacing.md,
  },
  previewImage: {
    width: "100%",
    height: "100%",
  },
  previewBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(16, 185, 129, 0.15)",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(16, 185, 129, 0.3)",
    marginBottom: 14,
  },
  previewBadgeText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#10B981",
  },
  previewTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 6,
    textAlign: "center",
  },
  previewSub: {
    fontSize: 13,
    color: "#94A3B8",
    textAlign: "center",
    lineHeight: 18,
    marginBottom: Spacing.xl,
    paddingHorizontal: Spacing.sm,
  },
  previewActions: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
    paddingHorizontal: 8,
  },
  retakeBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "rgba(255, 255, 255, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
    paddingVertical: 13,
    borderRadius: 12,
  },
  retakeBtnText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  confirmBtn: {
    flex: 1.4,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#2563EB",
    paddingVertical: 13,
    borderRadius: 12,
  },
  confirmBtnText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFFFFF",
  },

  // Permission Screen
  permContainer: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  permHeader: {
    flexDirection: "row",
    justifyContent: "flex-end",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  permHeaderCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F1F5F9",
    justifyContent: "center",
    alignItems: "center",
  },
  permContent: {
    flex: 1,
    paddingHorizontal: Spacing.xl,
    justifyContent: "center",
    alignItems: "center",
  },
  permIconWrapper: {
    position: "relative",
    marginBottom: Spacing.md,
  },
  permIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: "#EFF6FF",
    borderWidth: 1,
    borderColor: "#DBEAFE",
    justifyContent: "center",
    alignItems: "center",
  },
  permCheckBadge: {
    position: "absolute",
    bottom: -4,
    right: -4,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "#DCFCE7",
    borderWidth: 2,
    borderColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
  },
  permTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 8,
    textAlign: "center",
  },
  permSub: {
    fontSize: 13.5,
    color: "#64748B",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: Spacing.xl,
    paddingHorizontal: Spacing.sm,
  },
  permBenefitsCard: {
    width: "100%",
    backgroundColor: "#F8FAFC",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  benefitRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  benefitIconBox: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: "#EFF6FF",
    justifyContent: "center",
    alignItems: "center",
  },
  benefitTextBox: {
    flex: 1,
  },
  benefitHeading: {
    fontSize: 13,
    fontWeight: "700",
    color: "#0F172A",
  },
  benefitDesc: {
    fontSize: 11.5,
    color: "#64748B",
    marginTop: 1,
  },
  benefitDivider: {
    height: 1,
    backgroundColor: "#E2E8F0",
    marginVertical: 10,
  },
  permDeniedNotice: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#FEF3C7",
    borderWidth: 1,
    borderColor: "#FDE68A",
    borderRadius: 10,
    padding: 12,
    width: "100%",
  },
  permDeniedText: {
    fontSize: 12,
    color: "#92400E",
    flex: 1,
    lineHeight: 16,
  },
  permActions: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.md,
    gap: 10,
  },
  permPrimaryBtn: {
    backgroundColor: "#2563EB",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
  },
  permPrimaryBtnText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  permCancelBtn: {
    paddingVertical: 10,
    alignItems: "center",
  },
  permCancelBtnText: {
    fontSize: 13.5,
    fontWeight: "600",
    color: "#64748B",
  },
});

