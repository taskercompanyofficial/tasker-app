import Colors from "@/constants/Colors";
import { BorderRadius, Shadows, Spacing } from "@/constants/Styles";
import { useSession } from "@/context/ctx";
import { useAuthStore } from "@/context/auth-store";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import Toast from "react-native-toast-message";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function PendingApproval() {
  const router = useRouter();
  const { signOut, refetchUser } = useSession();
  const [checking, setChecking] = useState(false);

  const handleCheckStatus = async () => {
    try {
      setChecking(true);
      try {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } catch (_) { }

      await refetchUser("vendor");
      const currentVendor = useAuthStore.getState().vendorUser as any;

      if (currentVendor?.status === "active") {
        try {
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch (_) { }
        Toast.show({
          type: "success",
          text1: "🎉 Account Approved!",
          text2: "Welcome to Tasker Partner Network!",
        });
        router.replace("/vendor/(tabs)" as any);
      } else {
        Toast.show({
          type: "info",
          text1: "Still In Review",
          text2: "Your verification is currently in progress. Please check back shortly.",
        });
      }
    } catch (_) {
      Toast.show({
        type: "info",
        text1: "Status Check",
        text2: "Your profile is under review by our team.",
      });
    } finally {
      setChecking(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <StatusBar barStyle="dark-content" />

      {/* Ambient background glows */}
      <View style={styles.ambientTopGlow} />
      <View style={styles.ambientBottomGlow} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Top Header */}
        <View style={styles.topHeader}>
          <View style={styles.partnerBadge}>
            <Ionicons name="shield-checkmark" size={14} color="#2563EB" />
            <Text style={styles.partnerBadgeText}>TASKER PARTNER VERIFICATION</Text>
          </View>
        </View>

        {/* 3D Tasky Avatar Hero Display */}
        <View style={styles.heroSection}>
          <View style={styles.avatarGlowCircle}>
            <Image
              source={require("@/assets/images/tasky-ai-clipboard.png")}
              style={styles.taskyAvatarImage}
              resizeMode="contain"
            />
          </View>
          <View style={styles.reviewStatusPill}>
            <View style={styles.pulsingDot} />
            <Text style={styles.reviewStatusText}>Profile Under Review</Text>
          </View>
        </View>

        {/* Headline & Conversational Info Card */}
        <View style={styles.conversationalCard}>
          <View style={styles.cardHeaderRow}>
            <View style={styles.assistantBadge}>
              <Ionicons name="person-circle" size={15} color="#2563EB" />
              <Text style={styles.assistantBadgeText}>Tasky Assistant</Text>
            </View>
            <Text style={styles.timeBadge}>~ 24-48 Hours</Text>
          </View>

          <Text style={styles.mainTitle}>Verification In Progress</Text>
          <Text style={styles.mainDescription}>
            Great job! You have successfully submitted all 6 profile completion steps. Our verification team is currently reviewing your documents to activate your account.
          </Text>
        </View>

        {/* Checklist of Completed Steps */}
        <View style={styles.checklistCard}>
          <Text style={styles.checklistTitle}>Submitted Sections</Text>

          <View style={styles.checklistItem}>
            <View style={styles.checkIconBox}>
              <Ionicons name="checkmark-circle" size={18} color="#10B981" />
            </View>
            <View style={styles.checkInfo}>
              <Text style={styles.checkItemTitle}>CNIC Document Scan</Text>
              <Text style={styles.checkItemSub}>Front and back images submitted</Text>
            </View>
          </View>

          <View style={styles.checklistItem}>
            <View style={styles.checkIconBox}>
              <Ionicons name="checkmark-circle" size={18} color="#10B981" />
            </View>
            <View style={styles.checkInfo}>
              <Text style={styles.checkItemTitle}>Identity & Current Address</Text>
              <Text style={styles.checkItemSub}>Details confirmed & validated</Text>
            </View>
          </View>

          <View style={styles.checklistItem}>
            <View style={styles.checkIconBox}>
              <Ionicons name="checkmark-circle" size={18} color="#10B981" />
            </View>
            <View style={styles.checkInfo}>
              <Text style={styles.checkItemTitle}>Live Face Photograph</Text>
              <Text style={styles.checkItemSub}>Biometric face selfie verified</Text>
            </View>
          </View>

          <View style={[styles.checklistItem, { borderBottomWidth: 0 }]}>
            <View style={styles.checkIconBox}>
              <Ionicons name="checkmark-circle" size={18} color="#10B981" />
            </View>
            <View style={styles.checkInfo}>
              <Text style={styles.checkItemTitle}>Guarantor References & Work Info</Text>
              <Text style={styles.checkItemSub}>2 References & education recorded</Text>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={[styles.checkBtn, checking && styles.btnDisabled]}
            onPress={handleCheckStatus}
            disabled={checking}
            activeOpacity={0.88}
          >
            <LinearGradient
              colors={["#1E3A8A", "#2563EB"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.checkBtnGradient}
            >
              {checking ? (
                <>
                  <ActivityIndicator size="small" color="#FFFFFF" />
                  <Text style={styles.checkBtnText}>Checking Approval Status...</Text>
                </>
              ) : (
                <>
                  <Ionicons name="refresh" size={18} color="#FFFFFF" />
                  <Text style={styles.checkBtnText}>Check Approval Status</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.signOutBtn}
            onPress={() => signOut()}
            activeOpacity={0.7}
          >
            <Ionicons name="log-out-outline" size={18} color="#64748B" />
            <Text style={styles.signOutBtnText}>Sign Out of Account</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  ambientTopGlow: {
    position: "absolute",
    top: -80,
    left: -60,
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: "rgba(37, 99, 235, 0.08)",
  },
  ambientBottomGlow: {
    position: "absolute",
    bottom: -60,
    right: -60,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: "rgba(16, 185, 129, 0.08)",
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xl,
  },
  topHeader: {
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  partnerBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#EFF6FF",
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: "#DBEAFE",
  },
  partnerBadgeText: {
    fontSize: 10.5,
    fontWeight: "800",
    color: "#2563EB",
    letterSpacing: 0.5,
  },
  heroSection: {
    alignItems: "center",
    marginVertical: Spacing.sm,
  },
  avatarGlowCircle: {
    width: 140,
    height: 140,
    justifyContent: "center",
    alignItems: "center",
  },
  taskyAvatarImage: {
    width: 115,
    height: 115,
  },
  reviewStatusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#FEF3C7",
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: "#FDE68A",
    marginTop: -14,
    ...Shadows.sm,
  },
  pulsingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#D97706",
  },
  reviewStatusText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#B45309",
    letterSpacing: 0.2,
  },
  conversationalCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    marginTop: Spacing.md,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    ...Shadows.sm,
  },
  cardHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.xs,
  },
  assistantBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  assistantBadgeText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#2563EB",
  },
  timeBadge: {
    fontSize: 11,
    fontWeight: "600",
    color: "#64748B",
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  mainTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0F172A",
    marginTop: 6,
    marginBottom: 4,
  },
  mainDescription: {
    fontSize: 13.5,
    color: "#475569",
    lineHeight: 20,
  },
  checklistCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    marginTop: Spacing.md,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    ...Shadows.sm,
  },
  checklistTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: Spacing.sm,
  },
  checklistItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
    gap: 10,
  },
  checkIconBox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#ECFDF5",
    justifyContent: "center",
    alignItems: "center",
  },
  checkInfo: {
    flex: 1,
  },
  checkItemTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1E293B",
  },
  checkItemSub: {
    fontSize: 11,
    color: "#64748B",
    marginTop: 1,
  },
  actionsContainer: {
    marginTop: Spacing.lg,
    gap: Spacing.sm,
  },
  checkBtn: {
    borderRadius: BorderRadius.lg,
    overflow: "hidden",
    ...Shadows.md,
  },
  btnDisabled: {
    opacity: 0.65,
  },
  checkBtnGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
  },
  checkBtnText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  signOutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
    backgroundColor: "#F1F5F9",
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  signOutBtnText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#475569",
  },
});
