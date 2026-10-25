import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import AppText from "@/components/common/AppText";
import Colors from "@/constants/Colors";
import { BorderRadius, Shadows, Spacing } from "@/constants/Styles";
import { useSession } from "@/context/ctx";
import axios from "@/lib/axios.config";
import {
  VENDOR_EARNINGS_URL,
  VENDOR_PAYOUT_SUBMIT_URL,
  VENDOR_ONLINE_STATUS_URL,
} from "@/lib/api-endpoints";
import { localizedToast } from "@/lib/i18n/localized-toast";

export default function FinancialLockScreen() {
  const router = useRouter();
  const { session, signOut, refetchUser } = useSession();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [overdueAmount, setOverdueAmount] = useState<number>(0);
  const [lockReason, setLockReason] = useState<string>("");
  const [selectedProof, setSelectedProof] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [proofSubmitted, setProofSubmitted] = useState(false);

  const fetchLockDetails = async () => {
    try {
      const mode = session.appMode || "vendor";
      const [statusRes, earningsRes] = await Promise.all([
        axios.get(VENDOR_ONLINE_STATUS_URL(mode)).catch(() => ({ data: null })),
        axios.get(VENDOR_EARNINGS_URL).catch(() => ({ data: null })),
      ]);

      const statusData = statusRes.data?.data;
      const earningsSummary = earningsRes.data?.data?.summary;

      const overdue = Number(
        statusData?.overdue_payables ?? earningsSummary?.overdue_payable ?? 0
      );
      const isBlocked = Boolean(
        statusData?.is_financial_blocked ?? earningsSummary?.is_financial_blocked
      );

      setOverdueAmount(overdue);
      setLockReason(
        statusData?.financial_blocked_reason ??
          earningsSummary?.financial_blocked_reason ??
          "Unsettled daily company share past midnight (12:00 AM) deadline."
      );

      // If no longer blocked and no overdue payables, vendor can resume normal operations
      if (!isBlocked && overdue <= 0) {
        try {
          await refetchUser("vendor");
        } catch (_) {}
        router.replace("/vendor/(tabs)" as any);
      }
    } catch (e) {
      console.error("[FinancialLock] Error fetching status:", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchLockDetails();
  }, []);

  const handlePickProof = async () => {
    try {
      try {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch (_) {}

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setSelectedProof(result.assets[0]);
      }
    } catch (err) {
      console.warn("[FinancialLock] Pick image failed:", err);
    }
  };

  const handleSubmitProof = async () => {
    if (!selectedProof) {
      localizedToast({
        type: "error",
        text1: "Payment Proof Required",
        text2: "Please select a bank slip or transfer screenshot.",
      });
      return;
    }

    try {
      setSubmitting(true);
      try {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } catch (_) {}

      const formData = new FormData();
      formData.append("amount", String(overdueAmount || 1));
      formData.append("notes", "Submitted via Financial Lock Screen");

      const uriParts = selectedProof.uri.split(".");
      const fileType = uriParts[uriParts.length - 1] || "jpg";

      formData.append("file", {
        uri: selectedProof.uri,
        name: `proof_${Date.now()}.${fileType}`,
        type: `image/${fileType === "jpg" ? "jpeg" : fileType}`,
      } as any);

      const res = await axios.post(VENDOR_PAYOUT_SUBMIT_URL, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (res.data?.status === "success" || res.status === 200) {
        try {
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch (_) {}
        setProofSubmitted(true);
        setSelectedProof(null);
        localizedToast({
          type: "success",
          text1: "Proof Uploaded",
          text2: "Finance team will verify and unlock your account shortly.",
        });
      }
    } catch (err: any) {
      console.error("[FinancialLock] Submit error:", err);
      localizedToast({
        type: "error",
        text1: "Submission Failed",
        text2: err?.response?.data?.message || "Could not upload proof.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (_) {}
    await fetchLockDetails();
  };

  const handleContactSupport = () => {
    Linking.openURL("https://wa.me/923000000000?text=Hello,%20my%20vendor%20account%20is%20financially%20locked.%20I%20have%20sent%20the%20payment.");
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color="#EF4444" />
          <AppText style={styles.loadingText}>Checking financial status...</AppText>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Top Header */}
        <View style={styles.topHeader}>
          <TouchableOpacity
            style={styles.signOutBtn}
            onPress={() => signOut()}
            activeOpacity={0.7}
          >
            <Ionicons name="log-out-outline" size={18} color="#9CA3AF" />
            <AppText style={styles.signOutText}>Sign Out</AppText>
          </TouchableOpacity>
        </View>

        {/* Lock Hero */}
        <View style={styles.lockIconWrap}>
          <View style={styles.lockOuterPulse}>
            <View style={styles.lockInnerCircle}>
              <Ionicons name="lock-closed" size={38} color="#EF4444" />
            </View>
          </View>
        </View>

        <AppText style={styles.title}>Account Temporarily Locked</AppText>
        <AppText style={styles.subtitle}>
          Daily company cut was not settled before the 12:00 AM midnight deadline.
        </AppText>

        {/* Overdue Card */}
        <View style={styles.amountCard}>
          <AppText style={styles.amountLabel}>OVERDUE AMOUNT</AppText>
          <AppText style={styles.amountValue}>
            PKR {overdueAmount.toLocaleString("en-PK", { minimumFractionDigits: 0 })}
          </AppText>
          <View style={styles.reasonBadge}>
            <Ionicons name="alert-circle" size={14} color="#DC2626" />
            <AppText style={styles.reasonText}>
              {lockReason || "Due by 12:00 AM of the job day"}
            </AppText>
          </View>
        </View>

        {/* Company Bank Details Card */}
        <View style={styles.bankCard}>
          <View style={styles.bankHeader}>
            <Ionicons name="business-outline" size={18} color="#1E3A8A" />
            <AppText style={styles.bankTitle}>Deposit / Transfer To:</AppText>
          </View>

          <View style={styles.bankRow}>
            <AppText style={styles.bankField}>Bank:</AppText>
            <AppText style={styles.bankVal}>Meezan Bank Ltd.</AppText>
          </View>
          <View style={styles.bankRow}>
            <AppText style={styles.bankField}>Account Title:</AppText>
            <AppText style={styles.bankVal}>Tasker Company (Pvt) Ltd.</AppText>
          </View>
          <View style={styles.bankRow}>
            <AppText style={styles.bankField}>Account Number:</AppText>
            <AppText style={styles.bankValBold}>01020304050607</AppText>
          </View>
          <View style={styles.bankRow}>
            <AppText style={styles.bankField}>JazzCash / Raast:</AppText>
            <AppText style={styles.bankValBold}>0300-1234567</AppText>
          </View>
        </View>

        {/* Proof Submission Section */}
        <View style={styles.proofCard}>
          <AppText style={styles.proofTitle}>Submit Payment Receipt</AppText>
          <AppText style={styles.proofSub}>
            Upload a screenshot or photo of your bank transfer to unlock immediately.
          </AppText>

          {proofSubmitted && (
            <View style={styles.proofSuccessBox}>
              <Ionicons name="checkmark-circle" size={20} color="#059669" />
              <AppText style={styles.proofSuccessText}>
                Receipt submitted! Verification is in progress.
              </AppText>
            </View>
          )}

          {selectedProof ? (
            <View style={styles.previewContainer}>
              <Image
                source={{ uri: selectedProof.uri }}
                style={styles.previewImage}
                resizeMode="cover"
              />
              <TouchableOpacity
                style={styles.removeProofBtn}
                onPress={() => setSelectedProof(null)}
              >
                <Ionicons name="close-circle" size={22} color="#EF4444" />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.uploadArea}
              onPress={handlePickProof}
              activeOpacity={0.8}
            >
              <Ionicons name="cloud-upload-outline" size={28} color="#6B7280" />
              <AppText style={styles.uploadText}>Select Receipt from Gallery</AppText>
            </TouchableOpacity>
          )}

          {selectedProof && (
            <TouchableOpacity
              style={styles.submitProofBtn}
              onPress={handleSubmitProof}
              disabled={submitting}
              activeOpacity={0.85}
            >
              {submitting ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                  <Ionicons name="send" size={16} color="#FFF" />
                  <AppText style={styles.submitProofText}>Upload Proof for Verification</AppText>
                </View>
              )}
            </TouchableOpacity>
          )}
        </View>

        {/* Actions */}
        <View style={styles.actionsWrap}>
          <TouchableOpacity
            style={styles.refreshBtn}
            onPress={handleRefresh}
            disabled={refreshing}
            activeOpacity={0.8}
          >
            {refreshing ? (
              <ActivityIndicator size="small" color="#1E3A8A" />
            ) : (
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                <Ionicons name="refresh" size={16} color="#1E3A8A" />
                <AppText style={styles.refreshBtnText}>I Have Paid - Refresh Status</AppText>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.supportBtn}
            onPress={handleContactSupport}
            activeOpacity={0.8}
          >
            <Ionicons name="logo-whatsapp" size={18} color="#059669" />
            <AppText style={styles.supportBtnText}>Contact Finance on WhatsApp</AppText>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  scrollContent: {
    padding: Spacing.xl,
    paddingBottom: Spacing.xxl * 2,
    alignItems: "center",
  },
  centerBox: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: "#6B7280",
    fontWeight: "500",
  },
  topHeader: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "flex-end",
    marginBottom: Spacing.md,
  },
  signOutBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: "#F3F4F6",
    borderRadius: BorderRadius.full,
  },
  signOutText: {
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "500",
  },
  lockIconWrap: {
    marginVertical: Spacing.md,
  },
  lockOuterPulse: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: "rgba(239, 68, 68, 0.12)",
    justifyContent: "center",
    alignItems: "center",
  },
  lockInnerCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(239, 68, 68, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    color: "#111827",
    textAlign: "center",
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 13,
    color: "#4B5563",
    textAlign: "center",
    lineHeight: 18,
    maxWidth: 320,
    marginBottom: Spacing.lg,
  },
  amountCard: {
    width: "100%",
    backgroundColor: "#FEF2F2",
    borderWidth: 1.5,
    borderColor: "#FCA5A5",
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  amountLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#991B1B",
    letterSpacing: 1,
    marginBottom: 4,
  },
  amountValue: {
    fontSize: 30,
    fontWeight: "900",
    color: "#DC2626",
    marginBottom: 8,
  },
  reasonBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#FFF",
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: "#FECACA",
  },
  reasonText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#991B1B",
  },
  bankCard: {
    width: "100%",
    backgroundColor: "#FFFFFF",
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginBottom: Spacing.lg,
    ...Shadows.sm,
  },
  bankHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
    paddingBottom: 8,
    marginBottom: 10,
  },
  bankTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1E3A8A",
  },
  bankRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 4,
  },
  bankField: {
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "500",
  },
  bankVal: {
    fontSize: 12,
    color: "#1F2937",
    fontWeight: "600",
  },
  bankValBold: {
    fontSize: 13,
    color: "#111827",
    fontWeight: "700",
  },
  proofCard: {
    width: "100%",
    backgroundColor: "#FFFFFF",
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginBottom: Spacing.lg,
    ...Shadows.sm,
  },
  proofTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 4,
  },
  proofSub: {
    fontSize: 12,
    color: "#6B7280",
    marginBottom: 12,
    lineHeight: 16,
  },
  proofSuccessBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#ECFDF5",
    borderWidth: 1,
    borderColor: "#A7F3D0",
    padding: 10,
    borderRadius: BorderRadius.md,
    marginBottom: 10,
  },
  proofSuccessText: {
    fontSize: 12,
    color: "#065F46",
    fontWeight: "600",
    flex: 1,
  },
  uploadArea: {
    borderWidth: 1.5,
    borderColor: "#D1D5DB",
    borderStyle: "dashed",
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#F9FAFB",
  },
  uploadText: {
    fontSize: 13,
    color: "#4B5563",
    fontWeight: "600",
  },
  previewContainer: {
    position: "relative",
    width: "100%",
    height: 140,
    borderRadius: BorderRadius.lg,
    overflow: "hidden",
    marginBottom: 10,
  },
  previewImage: {
    width: "100%",
    height: "100%",
  },
  removeProofBtn: {
    position: "absolute",
    top: 6,
    right: 6,
    backgroundColor: "#FFF",
    borderRadius: 12,
  },
  submitProofBtn: {
    marginTop: 10,
    backgroundColor: "#DC2626",
    paddingVertical: 12,
    borderRadius: BorderRadius.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  submitProofText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },
  actionsWrap: {
    width: "100%",
    gap: 10,
  },
  refreshBtn: {
    width: "100%",
    backgroundColor: "#EFF6FF",
    borderWidth: 1,
    borderColor: "#BFDBFE",
    paddingVertical: 14,
    borderRadius: BorderRadius.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  refreshBtnText: {
    fontSize: 13,
    color: "#1E3A8A",
    fontWeight: "700",
  },
  supportBtn: {
    width: "100%",
    backgroundColor: "#ECFDF5",
    borderWidth: 1,
    borderColor: "#A7F3D0",
    paddingVertical: 14,
    borderRadius: BorderRadius.lg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  supportBtnText: {
    fontSize: 13,
    color: "#065F46",
    fontWeight: "700",
  },
});
