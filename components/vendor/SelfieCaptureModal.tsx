import { localizedToast } from "@/lib/i18n/localized-toast";
import AppText from "@/components/common/AppText";
import { Ionicons } from "@expo/vector-icons";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as ImageManipulator from "expo-image-manipulator";
import * as Haptics from "expo-haptics";
import { captureRef } from "react-native-view-shot";
import Svg, { Defs, RadialGradient as SvgRadialGradient, Rect, Stop } from "react-native-svg";
import React, { useRef, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Image,
  Linking,
  Modal,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

interface SelfieCaptureModalProps {
  visible: boolean;
  onCaptured: (fileData: { uri: string; name: string; type: string }) => void;
  onClose: () => void;
}

/**
 * Snapchat-style subtle ambient enhancement layer:
 * 1) Warm skin-softening luminance boost (rgba(255, 246, 232, 0.11))
 * 2) Soft radial center glow + subtle edge vignette via SVG RadialGradient
 */
function SnapchatAmbientLayer() {
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {/* Subtle warm skin-tone & brightness lift */}
      <View
        style={[
          StyleSheet.absoluteFill,
          { backgroundColor: "rgba(255, 247, 237, 0.10)" },
        ]}
      />
      {/* Soft center luminance + gentle ambient edge vignette */}
      <Svg width="100%" height="100%" style={StyleSheet.absoluteFill}>
        <Defs>
          <SvgRadialGradient
            id="snapAmbientVignette"
            cx="50%"
            cy="46%"
            rx="62%"
            ry="56%"
            fx="50%"
            fy="46%"
          >
            <Stop offset="0%" stopColor="#FFFBEB" stopOpacity="0.09" />
            <Stop offset="58%" stopColor="#FFFFFF" stopOpacity="0.02" />
            <Stop offset="100%" stopColor="#000000" stopOpacity="0.22" />
          </SvgRadialGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill="url(#snapAmbientVignette)" />
      </Svg>
    </View>
  );
}

export default function SelfieCaptureModal({
  visible,
  onCaptured,
  onClose,
}: SelfieCaptureModalProps) {
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<any>(null);
  const previewShotRef = useRef<View>(null);
  const [capturing, setCapturing] = useState(false);
  const [capturedUri, setCapturedUri] = useState<string | null>(null);
  const [autoEnhance, setAutoEnhance] = useState<boolean>(true);

  // Capture Selfie Photo (mirror: true prevents left-to-right flip; resize to 1200w removes sensor grain)
  const handleCapture = async () => {
    if (!cameraRef.current || capturing) return;
    try {
      try {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } catch (_) {}

      setCapturing(true);

      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.92,
        skipProcessing: false,
        mirror: true,
      });

      if (photo?.uri) {
        // Pure compression scaling: downscale huge raw camera resolution to clean 1200px width
        // at 0.86 JPEG quality to natively remove front-camera grain while keeping full uncropped framing
        const actions: ImageManipulator.Action[] = [];
        if (!photo.width || photo.width > 1200) {
          actions.push({ resize: { width: 1200 } });
        }

        const manipulated = await ImageManipulator.manipulateAsync(
          photo.uri,
          actions,
          { compress: 0.86, format: ImageManipulator.SaveFormat.JPEG }
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

  // Confirm photo (automatically bakes the Snapchat-style enhancement layer when autoEnhance is on)
  const handleConfirmPhoto = async () => {
    if (!capturedUri) return;
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (_) {}

    let finalUri = capturedUri;
    if (autoEnhance && previewShotRef.current) {
      try {
        const baked = await captureRef(previewShotRef, {
          format: "jpg",
          quality: 0.88,
        });
        if (baked) finalUri = baked;
      } catch (_) {}
    }

    onCaptured({
      uri: finalUri,
      name: `vendor_selfie_${Date.now()}.jpg`,
      type: "image/jpeg",
    });
    setCapturedUri(null);
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

  const isPermanentlyDenied = permission && !permission.canAskAgain && permission.status === "denied";

  return (
    <Modal visible={visible} animationType="fade" transparent={false} onRequestClose={onClose}>
      <View style={styles.container}>
        {/* Permission Required View (Cleanly rendered inside same modal if not granted) */}
        {permission && !permission.granted ? (
          <SafeAreaView style={styles.permContainer} edges={["top", "bottom"]}>
            <View style={styles.permHeader}>
              <TouchableOpacity onPress={onClose} style={styles.permHeaderCloseBtn} activeOpacity={0.7}>
                <Ionicons name="close" size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <View style={styles.permContent}>
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
                We need front camera access to capture your live daily verification photo.
              </AppText>

              {isPermanentlyDenied && (
                <View style={styles.permDeniedNotice}>
                  <Ionicons name="alert-circle-outline" size={16} color="#B45309" />
                  <AppText style={styles.permDeniedText}>
                    Camera access was previously denied. Please enable it in device settings to proceed.
                  </AppText>
                </View>
              )}
            </View>

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
                <AppText style={styles.permCancelBtnText}>Cancel</AppText>
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        ) : capturedUri ? (
          // ─── MINIMAL CLEAN REVIEW SCREEN WITH 1-TAP AUTO-ENHANCE TOGGLE ───
          <View style={styles.previewContainer}>
            <View
              ref={previewShotRef}
              collapsable={false}
              style={StyleSheet.absoluteFill}
            >
              <Image source={{ uri: capturedUri }} style={styles.previewFullImage} />
              {autoEnhance && <SnapchatAmbientLayer />}
            </View>

            {/* Floating Top Header with Center Verification Label & 1-Tap Auto-Enhance Toggle */}
            <SafeAreaView style={styles.floatingTopBar} edges={["top"]}>
              <TouchableOpacity onPress={handleRetake} style={styles.floatingCircleBtn} activeOpacity={0.7}>
                <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
              </TouchableOpacity>

              <View style={styles.floatingTitlePill}>
                <Ionicons name="shield-checkmark" size={14} color="#10B981" />
                <AppText style={styles.floatingTitleText}>Photo Verification</AppText>
              </View>

              <TouchableOpacity
                onPress={() => {
                  try {
                    Haptics.selectionAsync();
                  } catch (_) {}
                  setAutoEnhance((prev) => !prev);
                }}
                style={[
                  styles.autoEnhancePill,
                  autoEnhance && styles.autoEnhancePillActive,
                ]}
                activeOpacity={0.8}
              >
                <Ionicons
                  name={autoEnhance ? "sparkles" : "sparkles-outline"}
                  size={13}
                  color={autoEnhance ? "#FFFFFF" : "#CBD5E1"}
                />
                <AppText
                  style={[
                    styles.autoEnhanceText,
                    autoEnhance && styles.autoEnhanceTextActive,
                  ]}
                >
                  {autoEnhance ? "Enhanced" : "Raw"}
                </AppText>
              </TouchableOpacity>
            </SafeAreaView>

            {/* Floating Bottom Confirm / Retake Actions */}
            <SafeAreaView style={styles.floatingBottomBar} edges={["bottom"]}>
              <TouchableOpacity
                style={styles.retakeBtn}
                onPress={handleRetake}
                activeOpacity={0.8}
              >
                <Ionicons name="refresh-outline" size={18} color="#FFFFFF" />
                <AppText style={styles.retakeBtnText}>Retake</AppText>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.confirmBtn}
                onPress={handleConfirmPhoto}
                activeOpacity={0.88}
              >
                <Ionicons name="checkmark" size={18} color="#FFFFFF" />
                <AppText style={styles.confirmBtnText}>Confirm & Go Online</AppText>
              </TouchableOpacity>
            </SafeAreaView>
          </View>
        ) : (
          // ─── MINIMAL BORDERLESS FULL-BLEED LIVE CAMERA WITH SNAPCHAT AUTO-ENHANCE ───
          <View style={styles.cameraWrapper}>
            <CameraView
              ref={cameraRef}
              style={StyleSheet.absoluteFill}
              facing="front"
              mirror={true}
            />
            {autoEnhance && <SnapchatAmbientLayer />}

            {/* Floating Top Header with Top-Middle Verification Title & 1-Tap Auto-Enhance Toggle */}
            <SafeAreaView style={styles.floatingTopBar} edges={["top"]}>
              <TouchableOpacity onPress={onClose} style={styles.floatingCircleBtn} activeOpacity={0.7}>
                <Ionicons name="close" size={22} color="#FFFFFF" />
              </TouchableOpacity>

              {/* Top-Middle Verification Title Pill */}
              <View style={styles.floatingTitlePill}>
                <Ionicons name="shield-checkmark" size={14} color="#34D399" />
                <AppText style={styles.floatingTitleText}>Photo Verification</AppText>
              </View>

              <TouchableOpacity
                onPress={() => {
                  try {
                    Haptics.selectionAsync();
                  } catch (_) {}
                  setAutoEnhance((prev) => !prev);
                }}
                style={[
                  styles.autoEnhancePill,
                  autoEnhance && styles.autoEnhancePillActive,
                ]}
                activeOpacity={0.8}
              >
                <Ionicons
                  name={autoEnhance ? "sparkles" : "sparkles-outline"}
                  size={13}
                  color={autoEnhance ? "#FFFFFF" : "#CBD5E1"}
                />
                <AppText
                  style={[
                    styles.autoEnhanceText,
                    autoEnhance && styles.autoEnhanceTextActive,
                  ]}
                >
                  {autoEnhance ? "Enhanced" : "Raw"}
                </AppText>
              </TouchableOpacity>
            </SafeAreaView>

            {/* Clean Shutter Ring on Bottom (Accurate, Minimal, No Dark Borders) */}
            <SafeAreaView style={styles.bottomControls} edges={["bottom"]}>
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
    backgroundColor: "#000000",
  },
  cameraWrapper: {
    flex: 1,
    position: "relative",
  },
  floatingTopBar: {
    position: "absolute",
    top: 10,
    left: 16,
    right: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    zIndex: 20,
  },
  floatingCircleBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "rgba(0, 0, 0, 0.45)",
    justifyContent: "center",
    alignItems: "center",
  },
  floatingTitlePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(15, 23, 42, 0.65)",
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.15)",
  },
  floatingTitleText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: 0.3,
  },
  bottomControls: {
    position: "absolute",
    bottom: 28,
    left: 0,
    right: 0,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 20,
  },
  autoEnhancePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: "rgba(15, 23, 42, 0.65)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.18)",
  },
  autoEnhancePillActive: {
    backgroundColor: "rgba(16, 185, 129, 0.88)",
    borderColor: "#34D399",
  },
  autoEnhanceText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#CBD5E1",
  },
  autoEnhanceTextActive: {
    color: "#FFFFFF",
    fontWeight: "800",
  },
  shutterOuterRing: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 4,
    borderColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "transparent",
  },
  shutterInnerCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#FFFFFF",
  },
  shutterDisabled: {
    opacity: 0.6,
  },

  // Review Screen
  previewContainer: {
    flex: 1,
    backgroundColor: "#000000",
    position: "relative",
  },
  previewFullImage: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    resizeMode: "cover",
  },
  floatingBottomBar: {
    position: "absolute",
    bottom: 36,
    left: 20,
    right: 20,
    flexDirection: "row",
    gap: 12,
    zIndex: 20,
  },
  retakeBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(15, 23, 42, 0.8)",
    borderRadius: 16,
    paddingVertical: 14,
    gap: 6,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  retakeBtnText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  confirmBtn: {
    flex: 1.6,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#10B981",
    borderRadius: 16,
    paddingVertical: 14,
    gap: 6,
  },
  confirmBtnText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#FFFFFF",
  },

  // Permissions
  permContainer: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 24,
  },
  permHeader: {
    flexDirection: "row",
    justifyContent: "flex-end",
    paddingTop: 12,
  },
  permHeaderCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },
  permContent: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  permIconWrapper: {
    position: "relative",
    marginBottom: 20,
  },
  permIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
  },
  permCheckBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "#ECFDF5",
    borderWidth: 2,
    borderColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  permTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#0F172A",
    textAlign: "center",
    marginBottom: 8,
  },
  permSub: {
    fontSize: 13,
    color: "#64748B",
    textAlign: "center",
    lineHeight: 18,
  },
  permDeniedNotice: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#FEF3C7",
    padding: 12,
    borderRadius: 12,
    marginTop: 20,
  },
  permDeniedText: {
    fontSize: 12,
    color: "#92400E",
    flex: 1,
    lineHeight: 16,
  },
  permActions: {
    paddingBottom: 24,
    gap: 10,
  },
  permPrimaryBtn: {
    backgroundColor: "#0F172A",
    borderRadius: 14,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  permPrimaryBtnText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  permCancelBtn: {
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  permCancelBtnText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#64748B",
  },
});
