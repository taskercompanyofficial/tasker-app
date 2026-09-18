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

// Standard ID-1 / CNIC aspect ratio (85.6mm x 53.98mm ~ 1.58)
const CARD_WIDTH = Math.min(SCREEN_WIDTH * 0.9, 360);
const CARD_HEIGHT = CARD_WIDTH / 1.58;

interface CnicScannerModalProps {
  visible: boolean;
  targetSide: "front" | "back";
  onCaptured: (side: "front" | "back", fileData: { uri: string; name: string; type: string }) => void;
  onClose: () => void;
}

export default function CnicScannerModal({
  visible,
  targetSide,
  onCaptured,
  onClose,
}: CnicScannerModalProps) {
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<any>(null);
  const [torch, setTorch] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const [capturedUri, setCapturedUri] = useState<string | null>(null);
  const [rotation, setRotation] = useState<number>(0);
  const [processingFilter, setProcessingFilter] = useState(false);

  // CamScanner Laser Scan Line Animation
  const laserAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setCapturedUri(null);
      setCapturing(false);
      setRotation(0);

      // Continuous laser scan line back and forth
      Animated.loop(
        Animated.sequence([
          Animated.timing(laserAnim, {
            toValue: 1,
            duration: 2200,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(laserAnim, {
            toValue: 0,
            duration: 2200,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [visible, laserAnim]);

  // Capture Button Handler (Manual click only - NO auto-firing)
  const handleCapture = async () => {
    if (!cameraRef.current || capturing) return;
    try {
      try {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      } catch (_) { }

      setCapturing(true);

      const photo = await cameraRef.current.takePictureAsync({
        quality: 1,
        skipProcessing: false,
      });

      if (photo?.uri) {
        // Document Scanner Crop: Compute exact bounded document region
        const photoWidth = photo.width || SCREEN_WIDTH * 3;
        const photoHeight = photo.height || SCREEN_HEIGHT * 3;

        const screenAspect = SCREEN_HEIGHT / SCREEN_WIDTH;
        const photoAspect = photoHeight / photoWidth;

        let scale = 1;
        let cropOriginX = 0;
        let cropOriginY = 0;

        if (photoAspect > screenAspect) {
          // Sensor is taller than screen: scaled by width, vertically centered
          scale = photoWidth / SCREEN_WIDTH;
          const visibleHeight = SCREEN_HEIGHT * scale;
          const verticalOffset = (photoHeight - visibleHeight) / 2;

          const frameX = (SCREEN_WIDTH - CARD_WIDTH) / 2;
          const frameY = (SCREEN_HEIGHT - CARD_HEIGHT) / 2 - 25;

          cropOriginX = Math.round(frameX * scale);
          cropOriginY = Math.round(verticalOffset + frameY * scale);
        } else {
          // Sensor is wider than screen: scaled by height, horizontally centered
          scale = photoHeight / SCREEN_HEIGHT;
          const visibleWidth = SCREEN_WIDTH * scale;
          const horizontalOffset = (photoWidth - visibleWidth) / 2;

          const frameX = (SCREEN_WIDTH - CARD_WIDTH) / 2;
          const frameY = (SCREEN_HEIGHT - CARD_HEIGHT) / 2 - 25;

          cropOriginX = Math.round(horizontalOffset + frameX * scale);
          cropOriginY = Math.round(frameY * scale);
        }

        const cropWidth = Math.round(CARD_WIDTH * scale);
        const cropHeight = Math.round(CARD_HEIGHT * scale);

        // Clamp safely within photo dimensions
        const safeX = Math.max(0, Math.min(cropOriginX, photoWidth - 10));
        const safeY = Math.max(0, Math.min(cropOriginY, photoHeight - 10));
        const safeWidth = Math.min(cropWidth, photoWidth - safeX);
        const safeHeight = Math.min(cropHeight, photoHeight - safeY);

        const cropped = await ImageManipulator.manipulateAsync(
          photo.uri,
          [
            {
              crop: {
                originX: safeX,
                originY: safeY,
                width: safeWidth,
                height: safeHeight,
              },
            },
          ],
          { compress: 0.92, format: ImageManipulator.SaveFormat.JPEG }
        );

        setCapturedUri(cropped.uri);
        setRotation(0);
      }
    } catch (e) {
      console.warn("[CnicScanner] Capture error:", e);
      Toast.show({ type: "error", text1: "Failed to capture. Please try again." });
    } finally {
      setCapturing(false);
    }
  };

  // Rotate Captured Document 90 degrees
  const handleRotate = async () => {
    if (!capturedUri) return;
    try {
      try {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch (_) { }

      setProcessingFilter(true);
      const newRotation = (rotation + 90) % 360;
      setRotation(newRotation);

      const manipulated = await ImageManipulator.manipulateAsync(
        capturedUri,
        [{ rotate: 90 }],
        { compress: 0.92, format: ImageManipulator.SaveFormat.JPEG }
      );
      setCapturedUri(manipulated.uri);
    } catch (err) {
      console.warn("[CnicScanner] Rotate error:", err);
    } finally {
      setProcessingFilter(false);
    }
  };

  // Confirm and return scanned document
  const handleConfirmPhoto = () => {
    if (!capturedUri) return;
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (_) { }

    onCaptured(targetSide, {
      uri: capturedUri,
      name: `cnic_${targetSide}_${Date.now()}.jpg`,
      type: "image/jpeg",
    });
    onClose();
  };

  // Retake photo
  const handleRetake = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (_) { }
    setCapturedUri(null);
    setRotation(0);
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
              We need camera access for the document scanner to capture high-clarity photos of your CNIC for identity verification.
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

  const laserTranslateY = laserAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, CARD_HEIGHT - 4],
  });

  return (
    <Modal visible={visible} animationType="fade" transparent={false}>
      <View style={styles.container}>
        {/* Top Header Controls */}
        <SafeAreaView style={styles.topBar} edges={["top"]}>
          <TouchableOpacity onPress={onClose} style={styles.iconCircleBtn} activeOpacity={0.7}>
            <Ionicons name="close" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <View style={styles.sideBadge}>
            <Ionicons name="scan" size={16} color="#38BDF8" />
            <Text style={styles.sideBadgeText}>
              {targetSide === "front" ? "CNIC FRONT SCAN" : "CNIC BACK SCAN"}
            </Text>
          </View>
          {!capturedUri ? (
            <TouchableOpacity
              onPress={() => setTorch((prev) => !prev)}
              style={[styles.iconCircleBtn, torch && styles.iconCircleBtnActive]}
              activeOpacity={0.7}
            >
              <Ionicons name={torch ? "flash" : "flash-off"} size={20} color="#FFFFFF" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              onPress={handleRotate}
              style={styles.iconCircleBtn}
              activeOpacity={0.7}
              disabled={processingFilter}
            >
              <Ionicons name="refresh" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          )}
        </SafeAreaView>

        {capturedUri ? (
          // ==========================================
          // CAMSCANNER DOCUMENT PREVIEW & RESULT VIEW
          // ==========================================
          <View style={styles.previewContainer}>
            <View style={styles.docFrame}>
              {processingFilter ? (
                <View style={styles.previewLoader}>
                  <ActivityIndicator color={Colors.themes.provider.primary} size="large" />
                </View>
              ) : (
                <Image source={{ uri: capturedUri }} style={styles.previewImage} resizeMode="contain" />
              )}
            </View>

            {/* Document Quality Badge */}
            <View style={styles.docQualityBadge}>
              <Ionicons name="checkmark-circle" size={16} color="#10B981" />
              <Text style={styles.docQualityText}>Document Cropped & Ready</Text>
            </View>

            {/* Bottom Actions Bar */}
            <SafeAreaView style={styles.previewBottomBar} edges={["bottom"]}>
              <View style={styles.previewBtnRow}>
                <TouchableOpacity style={styles.retakeBtn} onPress={handleRetake} activeOpacity={0.8}>
                  <Ionicons name="camera-reverse" size={20} color="#FFFFFF" />
                  <Text style={styles.retakeBtnText}>Retake</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.rotateActionBtn}
                  onPress={handleRotate}
                  activeOpacity={0.8}
                >
                  <Ionicons name="reload" size={18} color="#94A3B8" />
                  <Text style={styles.rotateActionText}>Rotate</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.confirmBtn} onPress={handleConfirmPhoto} activeOpacity={0.88}>
                  <Ionicons name="checkmark" size={20} color="#FFFFFF" />
                  <Text style={styles.confirmBtnText}>Use Document</Text>
                </TouchableOpacity>
              </View>
            </SafeAreaView>
          </View>
        ) : (
          // ==========================================
          // CAMSCANNER LIVE VIEWFINDER & SHUTTER
          // ==========================================
          <View style={styles.cameraWrapper}>
            <CameraView
              ref={cameraRef}
              style={StyleSheet.absoluteFill}
              facing="back"
              enableTorch={torch}
            />

            {/* Dark Mask Cutout */}
            <View style={styles.maskContainer}>
              {/* Top Mask with CamScanner Instructions */}
              <View style={styles.maskTop}>
                <View style={styles.scannerBadge}>
                  <Ionicons name="document-text-outline" size={14} color="#FFFFFF" />
                  <Text style={styles.scannerBadgeText}>DOCUMENT SCANNER</Text>
                </View>
                <Text style={styles.guideInstruction}>
                  Align {targetSide === "front" ? "FRONT" : "BACK"} of CNIC inside the box
                </Text>
                <Text style={styles.guideSub}>Press the shutter button to capture and crop</Text>
              </View>

              {/* Center Row with Card Viewfinder Frame */}
              <View style={styles.cardRow}>
                <View style={styles.maskSide} />
                <View style={styles.cardFrame}>
                  {/* Corner Reticle Brackets */}
                  <View style={[styles.corner, styles.cornerTL]} />
                  <View style={[styles.corner, styles.cornerTR]} />
                  <View style={[styles.corner, styles.cornerBL]} />
                  <View style={[styles.corner, styles.cornerBR]} />

                  {/* Inner Watermark/Card Placement Guide */}
                  <View style={styles.guideCardSilhouette}>
                    <Ionicons name="card-outline" size={40} color="rgba(255, 255, 255, 0.22)" />
                    <Text style={styles.silhouetteText}>
                      Place CNIC {targetSide === "front" ? "Front" : "Back"} Here
                    </Text>
                  </View>

                  {/* Animated Laser Scanline */}
                  <Animated.View
                    style={[
                      styles.laserLine,
                      {
                        transform: [{ translateY: laserTranslateY }],
                      },
                    ]}
                  />
                </View>
                <View style={styles.maskSide} />
              </View>

              {/* Bottom Mask with Shutter Button */}
              <View style={styles.maskBottom}>
                <TouchableOpacity
                  style={[styles.shutterBtn, capturing && styles.shutterBtnDisabled]}
                  onPress={handleCapture}
                  disabled={capturing}
                  activeOpacity={0.85}
                >
                  <View style={styles.shutterRing}>
                    <View style={styles.shutterInnerCircle}>
                      {capturing ? (
                        <ActivityIndicator color={Colors.themes.provider.primary} size="small" />
                      ) : (
                        <Ionicons name="camera" size={30} color={Colors.themes.provider.primary} />
                      )}
                    </View>
                  </View>
                </TouchableOpacity>
                <Text style={styles.shutterHint}>Tap to Capture Document</Text>
              </View>
            </View>
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
  permContainer: {
    flex: 1,
    backgroundColor: "#0F172A",
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.xl,
  },
  permCard: {
    backgroundColor: "#1E293B",
    padding: Spacing.xl,
    alignItems: "center",
    width: "100%",
    maxWidth: 380,
    borderWidth: 1,
    borderColor: "#334155",
  },
  permIconCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: "#2563EB20",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  permTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#FFFFFF",
    marginBottom: 8,
    textAlign: "center",
  },
  permSub: {
    fontSize: 13,
    color: "#94A3B8",
    textAlign: "center",
    lineHeight: 19,
    marginBottom: Spacing.lg,
  },
  permBtn: {
    backgroundColor: Colors.themes.provider.primary,
    paddingVertical: 14,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.lg,
    width: "100%",
    alignItems: "center",
    marginBottom: 10,
  },
  permBtnText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  permCloseBtn: {
    paddingVertical: 10,
  },
  permCloseText: {
    fontSize: 13,
    color: "#64748B",
    fontWeight: "600",
  },
  topBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    backgroundColor: "rgba(0, 0, 0, 0.45)",
  },
  iconCircleBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255, 255, 255, 0.18)",
    justifyContent: "center",
    alignItems: "center",
  },
  iconCircleBtnActive: {
    backgroundColor: "#F59E0B",
  },
  sideBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(15, 23, 42, 0.85)",
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: "rgba(56, 189, 248, 0.4)",
  },
  sideBadgeText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: 0.6,
  },
  cameraWrapper: {
    flex: 1,
  },
  maskContainer: {
    flex: 1,
  },
  maskTop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.68)",
    justifyContent: "flex-end",
    alignItems: "center",
    paddingBottom: 16,
    paddingHorizontal: Spacing.lg,
  },
  scannerBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#2563EB",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    marginBottom: 8,
  },
  scannerBadgeText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: 0.5,
  },
  guideInstruction: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFFFFF",
    textAlign: "center",
  },
  guideSub: {
    fontSize: 11,
    color: "#94A3B8",
    marginTop: 3,
    textAlign: "center",
  },
  cardRow: {
    flexDirection: "row",
    height: CARD_HEIGHT,
  },
  maskSide: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.68)",
  },
  cardFrame: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    backgroundColor: "transparent",
    position: "relative",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.35)",
    borderRadius: 14,
  },
  corner: {
    position: "absolute",
    width: 26,
    height: 26,
    borderColor: "#38BDF8",
  },
  cornerTL: {
    top: 0,
    left: 0,
    borderTopWidth: 3.5,
    borderLeftWidth: 3.5,
    borderTopLeftRadius: 12,
  },
  cornerTR: {
    top: 0,
    right: 0,
    borderTopWidth: 3.5,
    borderRightWidth: 3.5,
    borderTopRightRadius: 12,
  },
  cornerBL: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 3.5,
    borderLeftWidth: 3.5,
    borderBottomLeftRadius: 12,
  },
  cornerBR: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 3.5,
    borderRightWidth: 3.5,
    borderBottomRightRadius: 12,
  },
  guideCardSilhouette: {
    ...StyleSheet.absoluteFill,
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
  },
  silhouetteText: {
    fontSize: 12,
    fontWeight: "600",
    color: "rgba(255, 255, 255, 0.4)",
  },
  laserLine: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    height: 3,
    backgroundColor: "#38BDF8",
    shadowColor: "#38BDF8",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 8,
    elevation: 6,
  },
  maskBottom: {
    flex: 1.3,
    backgroundColor: "rgba(0, 0, 0, 0.68)",
    justifyContent: "center",
    alignItems: "center",
  },
  shutterBtn: {
    alignItems: "center",
    justifyContent: "center",
  },
  shutterBtnDisabled: {
    opacity: 0.6,
  },
  shutterRing: {
    width: 78,
    height: 78,
    borderRadius: 39,
    borderWidth: 4,
    borderColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "transparent",
  },
  shutterInnerCircle: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    ...Shadows.md,
  },
  shutterHint: {
    fontSize: 12,
    fontWeight: "600",
    color: "rgba(255, 255, 255, 0.75)",
    marginTop: 10,
  },

  // Preview Styles
  previewContainer: {
    flex: 1,
    backgroundColor: "#0B1120",
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 80,
  },
  docFrame: {
    width: CARD_WIDTH + 20,
    height: CARD_HEIGHT + 20,
    backgroundColor: "#1E293B",
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "#38BDF8",
    justifyContent: "center",
    alignItems: "center",
    ...Shadows.lg,
  },
  previewImage: {
    width: "100%",
    height: "100%",
  },
  previewLoader: {
    justifyContent: "center",
    alignItems: "center",
  },
  docQualityBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(16, 185, 129, 0.15)",
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: BorderRadius.full,
    marginTop: 18,
    borderWidth: 1,
    borderColor: "#10B98140",
  },
  docQualityText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#10B981",
  },
  previewBottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(15, 23, 42, 0.95)",
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: "#1E293B",
  },
  previewBtnRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  retakeBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#334155",
    paddingVertical: 13,
    borderRadius: BorderRadius.lg,
  },
  retakeBtnText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  rotateActionBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    backgroundColor: "#1E293B",
    paddingVertical: 13,
    paddingHorizontal: 14,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: "#334155",
  },
  rotateActionText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#94A3B8",
  },
  confirmBtn: {
    flex: 1.3,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#10B981",
    paddingVertical: 13,
    borderRadius: BorderRadius.lg,
    ...Shadows.md,
  },
  confirmBtnText: {
    fontSize: 13,
    fontWeight: "800",
    color: "#FFFFFF",
  },
});
