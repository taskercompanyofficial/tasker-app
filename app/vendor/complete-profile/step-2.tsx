import DocumentScanner, { ResponseType } from "react-native-document-scanner-plugin";
import Colors from "@/constants/Colors";
import { BorderRadius, Shadows, Spacing } from "@/constants/Styles";
import { useSession } from "@/context/ctx";
import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { compressImage } from "@/lib/image";
import { LinearGradient } from "expo-linear-gradient";
import CnicScannerModal from "@/components/vendor/CnicScannerModal";
import TaskyTypewriterText from "@/components/vendor/TaskyTypewriterText";
import myAxios from "@/lib/axios.config";
import { VENDOR_EXTRACT_CNIC_URL } from "@/lib/api-endpoints";
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
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";

export default function Step2CnicScan() {
  const router = useRouter();
  const { session, refetchUser } = useSession();
  const user = session.vendorUser;

  // Camera Scanner Modal State
  const [scannerVisible, setScannerVisible] = useState(false);
  const [scannerTargetSide, setScannerTargetSide] = useState<"front" | "back">("front");

  // Local Scanned File State
  const [frontFile, setFrontFile] = useState<{ uri: string; name: string; type: string } | null>(null);
  const [backFile, setBackFile] = useState<{ uri: string; name: string; type: string } | null>(null);

  // AI Extraction State
  const [isExtracting, setIsExtracting] = useState(false);

  // Gallery Picker
  const pickGalleryImage = async (side: "front" | "back") => {
    if (Platform.OS !== "android") {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Toast.show({ type: "error", text1: "Permission to access gallery is required" });
        return;
      }
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.85,
    });

    if (!result.canceled) {
      const asset = result.assets[0];
      let uri = await compressImage(asset.uri, 1600, 0.82);

      const fileData = {
        uri: uri,
        name: uri.split("/").pop() || `cnic_${side}_upload.jpg`,
        type: "image/jpeg",
      };

      if (side === "front") {
        setFrontFile(fileData);
      } else {
        setBackFile(fileData);
      }

      Toast.show({
        type: "success",
        text1: "CNIC Image Added",
        text2: side === "front" ? "CNIC Front side uploaded" : "CNIC Back side uploaded",
      });
    }
  };

  // Open Document Scanner (Native Google ML Kit / VisionKit Scanner on Dev Build, fallback to in-app scanner)
  const openCameraScanner = async (side: "front" | "back") => {
    try {
      try {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch (_) {}

      const result = await DocumentScanner.scanDocument({
        maxNumDocuments: 1,
        responseType: ResponseType.ImageFilePath,
        croppedImageQuality: 92,
      });

      if (result?.scannedImages && result.scannedImages.length > 0) {
        const rawUri = result.scannedImages[0];
        const compressedUri = await compressImage(rawUri, 1600, 0.85);

        const fileData = {
          uri: compressedUri,
          name: `cnic_${side}_scan_${Date.now()}.jpg`,
          type: "image/jpeg",
        };

        if (side === "front") {
          setFrontFile(fileData);
        } else {
          setBackFile(fileData);
        }

        try {
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch (_) {}

        Toast.show({
          type: "success",
          text1: `CNIC ${side === "front" ? "Front" : "Back"} Scanned!`,
          text2: "Document auto-detected and cropped.",
        });
        return;
      }
    } catch (error: any) {
      console.log("[Step2CnicScan] Native DocumentScanner fallback:", error?.message);
      // Fallback to custom in-app camera scanner modal
      setScannerTargetSide(side);
      setScannerVisible(true);
    }
  };

  const handleScannerCapture = (side: "front" | "back", fileData: { uri: string; name: string; type: string }) => {
    if (side === "front") {
      setFrontFile(fileData);
    } else {
      setBackFile(fileData);
    }
    Toast.show({
      type: "success",
      text1: `CNIC ${side === "front" ? "Front" : "Back"} Captured!`,
      text2: "Document cropped and saved",
    });
  };

  // -------------------------------------------------------------
  // AI Extraction & Database Auto-Save
  // -------------------------------------------------------------
  const handleExtractAndSave = async () => {
    if (!frontFile && !user?.cnic_front_image) {
      Toast.show({
        type: "error",
        text1: "Front CNIC Required",
        text2: "Please scan or upload the front side of your CNIC.",
      });
      return;
    }

    try {
      try {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } catch (_) {}

      setIsExtracting(true);

      const formData = new FormData();

      if (frontFile) {
        formData.append("cnic_front_file", {
          uri: frontFile.uri,
          name: frontFile.name || "cnic_front.jpg",
          type: frontFile.type || "image/jpeg",
        } as any);
      }

      if (backFile) {
        formData.append("cnic_back_file", {
          uri: backFile.uri,
          name: backFile.name || "cnic_back.jpg",
          type: backFile.type || "image/jpeg",
        } as any);
      }

      const res = await myAxios.post(VENDOR_EXTRACT_CNIC_URL, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (res.data?.status === "success") {
        // Refetch user so state has the fresh saved CNIC and extracted database details
        try {
          await refetchUser("vendor");
        } catch (_) {}

        try {
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch (_) {}

        if (res.data?.fallback) {
          Toast.show({
            type: "info",
            text1: "CNIC Images Saved",
            text2: "Please review or enter your details manually in Step 3.",
          });
        } else {
          Toast.show({
            type: "success",
            text1: "✨ CNIC Verified & Saved!",
            text2: "Details extracted. Please confirm in Step 3.",
          });
        }

        // Navigate to Step 3 Review Page
        router.push("/vendor/complete-profile/step-3" as any);
      } else {
        router.push("/vendor/complete-profile/step-3" as any);
      }
    } catch (error: any) {
      console.warn("[Step2CnicScan] Extraction error:", error?.response?.data || error?.message);
      Toast.show({
        type: "info",
        text1: "Manual Verification",
        text2: "Please verify or fill in your details manually in Step 3.",
      });
      router.push("/vendor/complete-profile/step-3" as any);
    } finally {
      setIsExtracting(false);
    }
  };

  const hasFront = Boolean(frontFile || user?.cnic_front_image);
  const hasBack = Boolean(backFile || user?.cnic_back_image);

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
        <Text style={styles.headerTitle}>CNIC Document Scan</Text>
        <View style={styles.stepIndicatorPill}>
          <Text style={styles.stepIndicatorText}>Step 2 of 6</Text>
        </View>
      </View>

      {/* Sticky Progress Bar */}
      <View style={styles.progressStickyBar}>
        <View style={styles.progressLabelRow}>
          <Text style={styles.progressStatusLabel}>Step 2: Identity Document Scan</Text>
          <Text style={styles.progressPercentLabel}>33% Complete</Text>
        </View>
        <View style={styles.progressBarTrack}>
          <View style={[styles.progressBarFill, { width: "33%" }]} />
        </View>
      </View>

      {/* Conversational Bubble */}
      <View style={styles.conversationalSpeechBar}>
        <Image
          source={require("@/assets/images/tasky-ai-clipboard.png")}
          style={styles.conversationalAvatar}
          resizeMode="contain"
        />
        <View style={{ flex: 1 }}>
          <View style={styles.speechBadgeRow}>
            <Text style={styles.speechAssistantName}>Tasky Assistant</Text>
            <View style={styles.liveSpeechDot} />
          </View>
          <TaskyTypewriterText
            key="cnic-scan-speech"
            text="Please scan your CNIC Front and Back. I will automatically extract all your identity information and save your documents!"
            speedMs={20}
            style={styles.conversationalSpeechText}
            cursorColor={Colors.themes.provider.primary}
          />
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.stepSectionContainer}>
          <Text style={styles.stepSectionHeading}>Scan CNIC Cards</Text>
          <Text style={styles.stepSectionSub}>
            Both sides are required for identity verification & partner trust badge.
          </Text>

          {/* CNIC Front Card */}
          <View style={styles.cnicUploadCard}>
            <View style={styles.cnicCardHeader}>
              <View style={styles.cnicCardTitleRow}>
                <Ionicons
                  name={hasFront ? "checkmark-circle" : "card-outline"}
                  size={20}
                  color={hasFront ? "#10B981" : Colors.themes.provider.primary}
                />
                <Text style={styles.cnicCardTitle}>CNIC Front Side</Text>
              </View>
              {hasFront && (
                <View style={styles.uploadedBadge}>
                  <Text style={styles.uploadedBadgeText}>Ready (+10%)</Text>
                </View>
              )}
            </View>

            {hasFront ? (
              <View style={styles.cnicImagePreviewWrapper}>
                <Image
                  source={{ uri: frontFile ? frontFile.uri : user?.cnic_front_image }}
                  style={styles.cnicImagePreview}
                />
                <View style={styles.retakeRow}>
                  <TouchableOpacity
                    style={styles.retakeMiniBtn}
                    onPress={() => openCameraScanner("front")}
                  >
                    <Ionicons name="scan" size={14} color="#2563EB" />
                    <Text style={styles.retakeMiniText}>Rescan Photo</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.retakeMiniBtn}
                    onPress={() => pickGalleryImage("front")}
                  >
                    <Ionicons name="images" size={14} color="#6B7280" />
                    <Text style={[styles.retakeMiniText, { color: "#6B7280" }]}>From Gallery</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <View style={styles.cnicActionRow}>
                <TouchableOpacity
                  style={styles.autoCaptureBtn}
                  activeOpacity={0.88}
                  onPress={() => openCameraScanner("front")}
                >
                  <Ionicons name="scan" size={20} color="#FFFFFF" />
                  <Text style={styles.autoCaptureBtnText}>Scan CNIC Front</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.galleryUploadBtn}
                  activeOpacity={0.8}
                  onPress={() => pickGalleryImage("front")}
                >
                  <Ionicons name="image-outline" size={18} color={Colors.themes.provider.primary} />
                  <Text style={styles.galleryUploadBtnText}>Upload</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* CNIC Back Card */}
          <View style={styles.cnicUploadCard}>
            <View style={styles.cnicCardHeader}>
              <View style={styles.cnicCardTitleRow}>
                <Ionicons
                  name={hasBack ? "checkmark-circle" : "card-outline"}
                  size={20}
                  color={hasBack ? "#10B981" : Colors.themes.provider.primary}
                />
                <Text style={styles.cnicCardTitle}>CNIC Back Side</Text>
              </View>
              {hasBack && (
                <View style={styles.uploadedBadge}>
                  <Text style={styles.uploadedBadgeText}>Ready (+10%)</Text>
                </View>
              )}
            </View>

            {hasBack ? (
              <View style={styles.cnicImagePreviewWrapper}>
                <Image
                  source={{ uri: backFile ? backFile.uri : user?.cnic_back_image }}
                  style={styles.cnicImagePreview}
                />
                <View style={styles.retakeRow}>
                  <TouchableOpacity
                    style={styles.retakeMiniBtn}
                    onPress={() => openCameraScanner("back")}
                  >
                    <Ionicons name="scan" size={14} color="#2563EB" />
                    <Text style={styles.retakeMiniText}>Rescan Photo</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.retakeMiniBtn}
                    onPress={() => pickGalleryImage("back")}
                  >
                    <Ionicons name="images" size={14} color="#6B7280" />
                    <Text style={[styles.retakeMiniText, { color: "#6B7280" }]}>From Gallery</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <View style={styles.cnicActionRow}>
                <TouchableOpacity
                  style={styles.autoCaptureBtn}
                  activeOpacity={0.88}
                  onPress={() => openCameraScanner("back")}
                >
                  <Ionicons name="scan" size={20} color="#FFFFFF" />
                  <Text style={styles.autoCaptureBtnText}>Scan CNIC Back</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.galleryUploadBtn}
                  activeOpacity={0.8}
                  onPress={() => pickGalleryImage("back")}
                >
                  <Ionicons name="image-outline" size={18} color={Colors.themes.provider.primary} />
                  <Text style={styles.galleryUploadBtnText}>Upload</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Action Button: Extract & Save */}
          <TouchableOpacity
            style={[
              styles.extractActionBtn,
              (!hasFront || isExtracting) && styles.disabledBtn,
            ]}
            disabled={!hasFront || isExtracting}
            activeOpacity={0.88}
            onPress={handleExtractAndSave}
          >
            <LinearGradient
              colors={
                !hasFront
                  ? ["#94A3B8", "#64748B"]
                  : ["#1E3A8A", "#2563EB"]
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.extractActionGradient}
            >
              {isExtracting ? (
                <>
                  <ActivityIndicator size="small" color="#FFFFFF" />
                  <Text style={styles.extractActionBtnText}>
                    Reading & saving your CNIC...
                  </Text>
                </>
              ) : (
                <>
                  <Ionicons name="sparkles" size={18} color="#FFFFFF" />
                  <Text style={styles.extractActionBtnText}>
                    Extract Details & Continue to Step 3
                  </Text>
                  <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Camera Scanner Modal */}
      <CnicScannerModal
        visible={scannerVisible}
        targetSide={scannerTargetSide}
        onCaptured={handleScannerCapture}
        onClose={() => setScannerVisible(false)}
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
  progressStickyBar: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: Spacing.lg,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  progressLabelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  progressStatusLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: Colors.text.primary,
  },
  progressPercentLabel: {
    fontSize: 12,
    fontWeight: "800",
    color: Colors.themes.provider.primary,
  },
  progressBarTrack: {
    height: 8,
    backgroundColor: "#E2E8F0",
    borderRadius: 4,
    overflow: "hidden",
    marginTop: 2,
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: Colors.themes.provider.primary,
    borderRadius: 4,
  },
  conversationalSpeechBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#1E3A8A0A",
    paddingHorizontal: Spacing.lg,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#1E3A8A18",
  },
  conversationalAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#FFFFFF",
    borderWidth: 1.5,
    borderColor: Colors.themes.provider.primary,
  },
  speechBadgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 2,
  },
  speechAssistantName: {
    fontSize: 11,
    fontWeight: "800",
    color: Colors.themes.provider.primary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  liveSpeechDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#10B981",
  },
  conversationalSpeechText: {
    fontSize: 12.5,
    color: Colors.text.primary,
    lineHeight: 18,
    fontWeight: "500",
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
  stepSectionHeading: {
    fontSize: 18,
    fontWeight: "800",
    color: Colors.text.primary,
    marginBottom: 2,
  },
  stepSectionSub: {
    fontSize: 13,
    color: Colors.text.secondary,
    lineHeight: 18,
    marginBottom: Spacing.md,
  },
  cnicUploadCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: Spacing.md,
    ...Shadows.sm,
  },
  cnicCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.sm,
  },
  cnicCardTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  cnicCardTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.text.primary,
  },
  uploadedBadge: {
    backgroundColor: "#10B98118",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  uploadedBadgeText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#10B981",
  },
  cnicActionRow: {
    flexDirection: "row",
    gap: 10,
  },
  autoCaptureBtn: {
    flex: 1.4,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.themes.provider.primary,
    paddingVertical: 12,
    borderRadius: BorderRadius.md,
    gap: 6,
    ...Shadows.sm,
  },
  autoCaptureBtnText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  galleryUploadBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F1F5F9",
    paddingVertical: 12,
    borderRadius: BorderRadius.md,
    gap: 6,
  },
  galleryUploadBtnText: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.themes.provider.primary,
  },
  cnicImagePreviewWrapper: {
    borderRadius: BorderRadius.md,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  cnicImagePreview: {
    width: "100%",
    height: 140,
    resizeMode: "cover",
  },
  retakeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#F8FAFC",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
  },
  retakeMiniBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  retakeMiniText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#2563EB",
  },
  extractActionBtn: {
    width: "100%",
    borderRadius: BorderRadius.lg,
    overflow: "hidden",
    ...Shadows.md,
    marginTop: Spacing.sm,
  },
  extractActionGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 15,
    gap: 8,
  },
  extractActionBtnText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  disabledBtn: {
    opacity: 0.65,
  },
});
