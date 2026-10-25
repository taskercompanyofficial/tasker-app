import { localizedToast } from "@/lib/i18n/localized-toast";
import React, { useState } from "react";
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
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import DocumentScanner, {
  ResponseType,
  ScanDocumentResponseStatus,
} from "react-native-document-scanner-plugin";
import * as ImagePicker from "expo-image-picker";
import * as Haptics from "expo-haptics";

import Colors from "@/constants/Colors";
import { BorderRadius, Spacing } from "@/constants/Styles";
import { useSession } from "@/context/ctx";
import { useLanguage } from "@/context/language-context";
import AppText from "@/components/common/AppText";
import { compressImage } from "@/lib/image";
import myAxios from "@/lib/axios.config";
import { VENDOR_EXTRACT_CNIC_URL } from "@/lib/api-endpoints";

interface DocFile {
  uri: string;
  name: string;
  type: string;
}

export default function Step2CnicScan() {
  const router = useRouter();
  const { session, refetchUser, signOutMode } = useSession();
  const { t, isRTL } = useLanguage();
  const user = session.vendorUser;

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

  const [frontFile, setFrontFile] = useState<DocFile | null>(null);
  const [backFile, setBackFile] = useState<DocFile | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);

  // Scan document using Google Document Scanner with base mode (natural color, no filters)
  const handleScanDocument = async (side: "front" | "back") => {
    try {
      const { scannedImages, status } = await DocumentScanner.scanDocument({
        maxNumDocuments: 1,
        croppedImageQuality: 95,
        responseType: ResponseType.ImageFilePath,
        scannerMode: "base",
      });

      if (status === ScanDocumentResponseStatus.Success && scannedImages && scannedImages.length > 0) {
        const compressedUri = await compressImage(scannedImages[0], 1600, 0.88);
        const fileData: DocFile = {
          uri: compressedUri,
          name: `cnic_${side}_docscan_${Date.now()}.jpg`,
          type: "image/jpeg",
        };

        if (side === "front") setFrontFile(fileData);
        else setBackFile(fileData);

        try {
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch (_) {}
        return;
      }
    } catch (err: any) {
      console.warn("[Step2CnicScan] Document scanner fallback to camera:", err?.message || err);
      await handleCameraFallback(side);
    }
  };

  // Fallback to camera
  const handleCameraFallback = async (side: "front" | "back") => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") {
        localizedToast({
          type: "error",
          text1: "Camera Permission Required",
          text2: "Please allow camera access to capture your CNIC.",
        });
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [16, 10],
        quality: 0.9,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const compressedUri = await compressImage(result.assets[0].uri, 1600, 0.85);
        const fileData: DocFile = {
          uri: compressedUri,
          name: `cnic_${side}_${Date.now()}.jpg`,
          type: "image/jpeg",
        };

        if (side === "front") setFrontFile(fileData);
        else setBackFile(fileData);

        try {
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch (_) {}
      }
    } catch (err: any) {
      console.warn("[Step2CnicScan] Camera error:", err);
      localizedToast({
        type: "error",
        text1: "Camera Error",
        text2: err?.message || "Failed to capture photo.",
      });
    }
  };

  // Upload to server and continue
  const handleUploadAndExtract = async () => {
    const hasFront = frontFile || user?.cnic_front_image;
    if (!hasFront) {
      localizedToast({
        type: "error",
        text1: "CNIC Front Required",
        text2: "Please upload the front side of your CNIC.",
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
          name: frontFile.name,
          type: frontFile.type,
        } as any);
      }
      if (backFile) {
        formData.append("cnic_back_file", {
          uri: backFile.uri,
          name: backFile.name,
          type: backFile.type,
        } as any);
      }

      const res = await myAxios.post(VENDOR_EXTRACT_CNIC_URL, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const extractedData = res.data?.data || null;

      try {
        await refetchUser("vendor");
      } catch (_) {}

      try {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch (_) {}

      // Pass extracted details to Step 3
      router.push({
        pathname: "/vendor/complete-profile/step-3" as any,
        params: extractedData
          ? {
              extractedCnic: extractedData.cnic || "",
              extractedName: extractedData.full_name || "",
              extractedFatherName: extractedData.father_name || "",
              extractedDob: extractedData.dob || "",
              extractedExpiry: extractedData.expiry_date || "",
              extractedGender: extractedData.gender || "",
              extractedAddress: extractedData.address || "",
            }
          : {},
      });
    } catch (error: any) {
      console.warn("[Step2CnicScan] Upload error:", error?.response?.data || error?.message);
      localizedToast({
        type: "info",
        text1: "Proceeding to Details Review",
        text2: "Please enter your details manually in the next step.",
      });
      router.push("/vendor/complete-profile/step-3" as any);
    } finally {
      setIsExtracting(false);
    }
  };

  const currentFrontUri = frontFile?.uri || user?.cnic_front_image || null;
  const currentBackUri = backFile?.uri || user?.cnic_back_image || null;
  const canSubmit = Boolean(currentFrontUri);

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={[styles.header, isRTL && styles.rtlRow]}>
        <TouchableOpacity
          onPress={handleLogout}
          style={[styles.logoutBtn, isRTL && styles.rtlRow]}
          activeOpacity={0.7}
        >
          <Ionicons name="log-out-outline" size={16} color="#DC2626" />
          <AppText style={styles.logoutBtnText}>Logout</AppText>
        </TouchableOpacity>
        <AppText style={styles.headerTitle}>Upload CNIC</AppText>
        <View style={styles.stepBadge}>
          <AppText style={styles.stepBadgeText}>Step 1 of 5</AppText>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.introBox}>
          <AppText style={styles.heading}>Upload CNIC</AppText>
          <AppText style={styles.subtitle}>
            Please upload clear photos of your CNIC front and back.
          </AppText>
        </View>

        {/* ============================================================ */}
        {/* CNIC FRONT CARD */}
        {/* ============================================================ */}
        <TouchableOpacity
          style={[styles.card, currentFrontUri ? styles.cardFilled : styles.cardEmpty]}
          activeOpacity={0.8}
          onPress={() => handleScanDocument("front")}
        >
          {currentFrontUri ? (
            <View style={styles.imageContainer}>
              <Image
                source={{ uri: currentFrontUri }}
                style={styles.cardImage}
                resizeMode="cover"
              />
              <View style={[styles.imageOverlayTop, isRTL && styles.rtlRow]}>
                <View style={styles.badgeSuccess}>
                  <Ionicons name="checkmark-circle" size={12} color="#059669" />
                  <AppText style={styles.badgeSuccessText}>Front Ready</AppText>
                </View>
                <View style={styles.changePill}>
                  <Ionicons name="camera-reverse-outline" size={12} color="#FFFFFF" />
                  <AppText style={styles.changePillText}>Change</AppText>
                </View>
              </View>
            </View>
          ) : (
            <View style={styles.placeholderContainer}>
              <View style={styles.iconCircle}>
                <Ionicons name="card-outline" size={22} color="#1E3A8A" />
              </View>
              <AppText style={styles.cardTitle}>Front Side</AppText>
              <AppText style={styles.cardDesc}>Tap to scan or upload CNIC front</AppText>
              <View style={styles.requiredTag}>
                <AppText style={styles.requiredTagText}>Required</AppText>
              </View>
            </View>
          )}
        </TouchableOpacity>

        {/* ============================================================ */}
        {/* CNIC BACK CARD */}
        {/* ============================================================ */}
        <TouchableOpacity
          style={[styles.card, currentBackUri ? styles.cardFilled : styles.cardEmpty]}
          activeOpacity={0.8}
          onPress={() => handleScanDocument("back")}
        >
          {currentBackUri ? (
            <View style={styles.imageContainer}>
              <Image
                source={{ uri: currentBackUri }}
                style={styles.cardImage}
                resizeMode="cover"
              />
              <View style={[styles.imageOverlayTop, isRTL && styles.rtlRow]}>
                <View style={styles.badgeSuccess}>
                  <Ionicons name="checkmark-circle" size={12} color="#059669" />
                  <AppText style={styles.badgeSuccessText}>Back Ready</AppText>
                </View>
                <View style={styles.changePill}>
                  <Ionicons name="camera-reverse-outline" size={12} color="#FFFFFF" />
                  <AppText style={styles.changePillText}>Change</AppText>
                </View>
              </View>
            </View>
          ) : (
            <View style={styles.placeholderContainer}>
              <View style={styles.iconCircle}>
                <Ionicons name="barcode-outline" size={22} color="#1E3A8A" />
              </View>
              <AppText style={styles.cardTitle}>Back Side</AppText>
              <AppText style={styles.cardDesc}>Tap to scan or upload CNIC back</AppText>
              <View style={styles.recommendedTag}>
                <AppText style={styles.recommendedTagText}>Recommended</AppText>
              </View>
            </View>
          )}
        </TouchableOpacity>

        {/* Continue Button */}
        <TouchableOpacity
          style={[styles.submitActionBtn, (!canSubmit || isExtracting) && styles.disabledBtn]}
          disabled={!canSubmit || isExtracting}
          activeOpacity={0.88}
          onPress={handleUploadAndExtract}
        >
          <LinearGradient
            colors={!canSubmit ? ["#94A3B8", "#64748B"] : ["#1E3A8A", "#2563EB"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.submitGradient, isRTL && styles.rtlRow]}
          >
            {isExtracting ? (
              <>
                <ActivityIndicator size="small" color="#FFFFFF" />
                <AppText style={styles.submitBtnText}>Processing...</AppText>
              </>
            ) : (
              <>
                <AppText style={styles.submitBtnText}>Continue</AppText>
                <Ionicons
                  name={isRTL ? "arrow-back" : "arrow-forward"}
                  size={16}
                  color="#FFFFFF"
                />
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  rtlRow: {
    flexDirection: "row-reverse",
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
  card: {
    width: "100%",
    aspectRatio: 1.586,
    borderRadius: 14,
    marginBottom: 14,
    overflow: "hidden",
  },
  cardEmpty: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1.5,
    borderColor: "#CBD5E1",
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
  },
  cardFilled: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderStyle: "solid",
  },
  placeholderContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  cardTitle: {
    fontSize: 13.5,
    fontWeight: "600",
    color: Colors.text.primary,
    marginBottom: 2,
  },
  cardDesc: {
    fontSize: 11.5,
    color: Colors.text.secondary,
    marginBottom: 6,
  },
  requiredTag: {
    backgroundColor: "#FEF2F2",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  requiredTagText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#DC2626",
  },
  recommendedTag: {
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  recommendedTagText: {
    fontSize: 10,
    fontWeight: "500",
    color: "#64748B",
  },
  imageContainer: {
    width: "100%",
    height: "100%",
    position: "relative",
  },
  cardImage: {
    width: "100%",
    height: "100%",
  },
  imageOverlayTop: {
    position: "absolute",
    top: 8,
    left: 8,
    right: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  badgeSuccess: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(255, 255, 255, 0.92)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  badgeSuccessText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#059669",
  },
  changePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  changePillText: {
    fontSize: 11,
    fontWeight: "500",
    color: "#FFFFFF",
  },
  submitActionBtn: {
    borderRadius: 10,
    overflow: "hidden",
    marginTop: 4,
    elevation: 1,
  },
  disabledBtn: {
    opacity: 0.65,
  },
  submitGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    gap: 6,
  },
  submitBtnText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
});
