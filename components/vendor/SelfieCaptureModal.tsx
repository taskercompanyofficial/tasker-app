import Colors from "@/constants/Colors";
import { BorderRadius, Shadows, Spacing } from "@/constants/Styles";
import { Ionicons } from "@expo/vector-icons";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as ImageManipulator from "expo-image-manipulator";
import * as Haptics from "expo-haptics";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Image,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Easing,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

// Biometric Oval Frame Dimensions
const OVAL_WIDTH = Math.min(SCREEN_WIDTH * 0.72, 270);
const OVAL_HEIGHT = OVAL_WIDTH * 1.32;

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

  // Animations
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setCapturedUri(null);
      setCapturing(false);

      // Smooth breathing glow
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.04,
            duration: 1400,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1400,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      ).start();

      // Continuous slow rotation for biometric hud
      Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 8000,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      ).start();
    }
  }, [visible, pulseAnim, rotateAnim]);

  // Capture Selfie Photo
  const handleCapture = async () => {
    if (!cameraRef.current || capturing) return;
    try {
      try {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      } catch (_) {}

      setCapturing(true);

      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.92,
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
          { compress: 0.9, format: ImageManipulator.SaveFormat.JPEG }
        );

        setCapturedUri(manipulated.uri);
      }
    } catch (e) {
      console.warn("[SelfieCapture] Error taking photo:", e);
      Toast.show({ type: "error", text1: "Failed to capture selfie. Please try again." });
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
    onClose();
  };

  // Retake photo
  const handleRetake = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (_) {}
    setCapturedUri(null);
  };

  if (!visible) return null;

  if (!permission?.granted) {
    return (
      <Modal visible={visible} animationType="slide" transparent={false}>
        <SafeAreaView style={styles.permContainer}>
          <View style={styles.permCard}>
            <View style={styles.permIconCircle}>
              <Ionicons name="camera" size={38} color={Colors.themes.provider.primary} />
            </View>
            <Text style={styles.permTitle}>Camera Access Required</Text>
            <Text style={styles.permSub}>
              We need live front camera access for biometric face verification against your CNIC identity card.
            </Text>
            <TouchableOpacity style={styles.permBtn} onPress={requestPermission} activeOpacity={0.88}>
              <Text style={styles.permBtnText}>Grant Camera Permission</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.permCloseBtn} onPress={onClose}>
              <Text style={styles.permCloseText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
    );
  }

  const rotateInterpolate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  return (
    <Modal visible={visible} animationType="fade" transparent={false}>
      <View style={styles.container}>
        {/* Top Header Bar */}
        <SafeAreaView style={styles.topBar} edges={["top"]}>
          <TouchableOpacity onPress={onClose} style={styles.iconCircleBtn} activeOpacity={0.7}>
            <Ionicons name="close" size={22} color="#FFFFFF" />
          </TouchableOpacity>
          <View style={styles.headerTitleBox}>
            <View style={styles.headerBadge}>
              <Ionicons name="scan-outline" size={13} color="#38BDF8" />
              <Text style={styles.headerBadgeText}>LIVE BIOMETRIC SCAN</Text>
            </View>
            <Text style={styles.headerSub}>Center your face in the oval frame</Text>
          </View>
          <View style={{ width: 40 }} />
        </SafeAreaView>

        {capturedUri ? (
          // Photo Review Screen
          <View style={styles.previewContainer}>
            <View style={styles.previewCard}>
              <Image source={{ uri: capturedUri }} style={styles.previewImage} />
              <View style={styles.verifiedTag}>
                <Ionicons name="shield-checkmark" size={14} color="#10B981" />
                <Text style={styles.verifiedTagText}>Photo Ready for Verification</Text>
              </View>
            </View>

            <Text style={styles.previewQuestion}>Is your face clearly visible?</Text>
            <Text style={styles.previewHint}>
              Ensure your eyes and face are in bright lighting without glare or accessories before verifying.
            </Text>

            <View style={styles.previewActions}>
              <TouchableOpacity
                style={styles.retakeBtn}
                onPress={handleRetake}
                activeOpacity={0.8}
              >
                <Ionicons name="refresh" size={18} color="#FFFFFF" />
                <Text style={styles.retakeBtnText}>Retake Photo</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.confirmBtn}
                onPress={handleConfirmPhoto}
                activeOpacity={0.88}
              >
                <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
                <Text style={styles.confirmBtnText}>Use Photo</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          // Live Biometric Front Camera HUD
          <View style={styles.cameraWrapper}>
            <CameraView
              ref={cameraRef}
              style={styles.cameraFill}
              facing="front"
            />

            {/* Dark Mask with Oval Cutout */}
            <View style={styles.maskContainer} pointerEvents="none">
              <View style={styles.maskTop} />
              <View style={styles.maskMiddleRow}>
                <View style={styles.maskSide} />
                
                {/* Biometric Oval Center */}
                <Animated.View
                  style={[
                    styles.ovalCutout,
                    { transform: [{ scale: pulseAnim }] },
                  ]}
                >
                  {/* Corner Targets */}
                  <View style={[styles.cornerBracket, styles.cornerTopLeft]} />
                  <View style={[styles.cornerBracket, styles.cornerTopRight]} />
                  <View style={[styles.cornerBracket, styles.cornerBottomLeft]} />
                  <View style={[styles.cornerBracket, styles.cornerBottomRight]} />

                  {/* Rotating HUD Arc */}
                  <Animated.View
                    style={[
                      styles.hudArcWrapper,
                      { transform: [{ rotate: rotateInterpolate }] },
                    ]}
                  >
                    <View style={styles.hudDashedRing} />
                  </Animated.View>
                </Animated.View>

                <View style={styles.maskSide} />
              </View>
              <View style={styles.maskBottom} />
            </View>

            {/* Instruction Guidance Pill */}
            <View style={styles.guidanceBanner}>
              <Ionicons name="eye-off-outline" size={16} color="#38BDF8" />
              <Text style={styles.guidanceBannerText}>Remove glasses & look straight into camera</Text>
            </View>

            {/* Bottom Shutter Dock */}
            <SafeAreaView style={styles.bottomControls} edges={["bottom"]}>
              <TouchableOpacity
                style={[styles.captureBtn, capturing && styles.captureBtnDisabled]}
                onPress={handleCapture}
                disabled={capturing}
                activeOpacity={0.8}
              >
                {capturing ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <View style={styles.captureInnerCircle}>
                    <Ionicons name="camera" size={24} color="#1E3A8A" />
                  </View>
                )}
              </TouchableOpacity>
              <Text style={styles.captureHintText}>Tap to Capture Live Selfie</Text>
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
    backgroundColor: "#060B14",
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    backgroundColor: "rgba(6, 11, 20, 0.85)",
    zIndex: 10,
  },
  iconCircleBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitleBox: {
    alignItems: "center",
  },
  headerBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(56, 189, 248, 0.15)",
    paddingHorizontal: 10,
    paddingVertical: 3.5,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: "rgba(56, 189, 248, 0.3)",
  },
  headerBadgeText: {
    fontSize: 10.5,
    fontWeight: "800",
    color: "#38BDF8",
    letterSpacing: 0.6,
  },
  headerSub: {
    fontSize: 11,
    color: "#94A3B8",
    marginTop: 3,
  },
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
    backgroundColor: "rgba(6, 11, 20, 0.72)",
  },
  maskMiddleRow: {
    flexDirection: "row",
    height: OVAL_HEIGHT,
  },
  maskSide: {
    flex: 1,
    backgroundColor: "rgba(6, 11, 20, 0.72)",
  },
  ovalCutout: {
    width: OVAL_WIDTH,
    height: OVAL_HEIGHT,
    borderRadius: OVAL_WIDTH / 2,
    borderWidth: 2,
    borderColor: "rgba(56, 189, 248, 0.7)",
    backgroundColor: "transparent",
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  hudArcWrapper: {
    width: OVAL_WIDTH + 20,
    height: OVAL_HEIGHT + 20,
    justifyContent: "center",
    alignItems: "center",
  },
  hudDashedRing: {
    width: "100%",
    height: "100%",
    borderRadius: (OVAL_WIDTH + 20) / 2,
    borderWidth: 1.5,
    borderColor: "rgba(255, 255, 255, 0.3)",
    borderStyle: "dashed",
  },
  cornerBracket: {
    position: "absolute",
    width: 22,
    height: 22,
    borderColor: "#38BDF8",
  },
  cornerTopLeft: {
    top: 14,
    left: 20,
    borderTopWidth: 3,
    borderLeftWidth: 3,
  },
  cornerTopRight: {
    top: 14,
    right: 20,
    borderTopWidth: 3,
    borderRightWidth: 3,
  },
  cornerBottomLeft: {
    bottom: 14,
    left: 20,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
  },
  cornerBottomRight: {
    bottom: 14,
    right: 20,
    borderBottomWidth: 3,
    borderRightWidth: 3,
  },
  maskBottom: {
    flex: 1.25,
    backgroundColor: "rgba(6, 11, 20, 0.72)",
  },
  guidanceBanner: {
    position: "absolute",
    top: 16,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(15, 23, 42, 0.88)",
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: "rgba(56, 189, 248, 0.35)",
    ...Shadows.sm,
  },
  guidanceBannerText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  bottomControls: {
    position: "absolute",
    bottom: 20,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  captureBtn: {
    width: 78,
    height: 78,
    borderRadius: 39,
    backgroundColor: "rgba(255, 255, 255, 0.25)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 4,
    borderColor: "#FFFFFF",
    ...Shadows.md,
  },
  captureBtnDisabled: {
    opacity: 0.5,
  },
  captureInnerCircle: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
  },
  captureHintText: {
    fontSize: 11.5,
    fontWeight: "600",
    color: "#94A3B8",
    marginTop: 8,
  },

  // Preview Styles
  previewContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing.xl,
  },
  previewCard: {
    width: 230,
    height: 230,
    borderRadius: 115,
    overflow: "hidden",
    borderWidth: 4,
    borderColor: "#2563EB",
    marginBottom: Spacing.lg,
    ...Shadows.lg,
  },
  previewImage: {
    width: "100%",
    height: "100%",
  },
  verifiedTag: {
    position: "absolute",
    bottom: 10,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(6, 11, 20, 0.88)",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: "#10B98140",
  },
  verifiedTagText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  previewQuestion: {
    fontSize: 17,
    fontWeight: "800",
    color: "#FFFFFF",
    marginBottom: 6,
    textAlign: "center",
  },
  previewHint: {
    fontSize: 12.5,
    color: "#94A3B8",
    textAlign: "center",
    lineHeight: 18,
    marginBottom: Spacing.xl,
    paddingHorizontal: Spacing.md,
  },
  previewActions: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  retakeBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    paddingVertical: 14,
    borderRadius: BorderRadius.lg,
  },
  retakeBtnText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  confirmBtn: {
    flex: 1.4,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#2563EB",
    paddingVertical: 14,
    borderRadius: BorderRadius.lg,
    ...Shadows.md,
  },
  confirmBtnText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#FFFFFF",
  },

  // Permissions
  permContainer: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: Spacing.xl,
  },
  permCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    alignItems: "center",
    ...Shadows.md,
  },
  permIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#EFF6FF",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  permTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: Colors.text.primary,
    marginBottom: 8,
    textAlign: "center",
  },
  permSub: {
    fontSize: 13,
    color: Colors.text.secondary,
    textAlign: "center",
    lineHeight: 19,
    marginBottom: Spacing.lg,
  },
  permBtn: {
    backgroundColor: Colors.themes.provider.primary,
    paddingVertical: 13,
    paddingHorizontal: 24,
    borderRadius: BorderRadius.lg,
    width: "100%",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  permBtnText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  permCloseBtn: {
    paddingVertical: 10,
  },
  permCloseText: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.text.secondary,
  },
});
