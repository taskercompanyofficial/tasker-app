import { localizedToast } from "@/lib/i18n/localized-toast";
import AppText from "@/components/common/AppText";
import Colors from "@/constants/Colors";
import { BorderRadius, Spacing } from "@/constants/Styles";
import { useSession } from "@/context/ctx";
import { useAuthStore } from "@/context/auth-store";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import {
  ActivityIndicator,
  Alert,
  Linking,
  ScrollView,
  StatusBar,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const LAHORE_MAPS_URL = "https://maps.app.goo.gl/SNe11vDp1YQ762gB9";
const PHONE_NUMBER = "03041112717";
const WHATSAPP_URL = "https://wa.me/923041112717?text=Hello%20Tasker%20Team%2C%20my%20vendor%20profile%20is%20under%20review%20and%20I%20would%20like%20to%20inquire%20about%20verification.";

export default function PendingApproval() {
  const router = useRouter();
  const { session, signOutMode, refetchUser } = useSession();
  const user = session.vendorUser as any;
  const [checking, setChecking] = useState(false);

  const vendorCity = (user?.city || "").trim();
  const isLahore = !vendorCity || vendorCity.toLowerCase().includes("lahore");

  const handleLogout = () => {
    Alert.alert("Log Out", "Are you sure you want to log out of your partner account?", [
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

  const handleCheckStatus = async () => {
    try {
      setChecking(true);
      try {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } catch (_) {}

      await refetchUser("vendor");
      const currentVendor = useAuthStore.getState().vendorUser as any;

      if (currentVendor?.status === "active") {
        try {
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch (_) {}
        localizedToast({
          type: "success",
          text1: "🎉 Account Approved!",
          text2: "Welcome to Tasker Partner Network!",
        });
        router.replace("/vendor/(tabs)" as any);
      } else {
        localizedToast({
          type: "info",
          text1: "Still In Review",
          text2: "Your verification is currently in progress. Please check back shortly.",
        });
      }
    } catch (_) {
      localizedToast({
        type: "info",
        text1: "Status Check",
        text2: "Your profile is under review by our team.",
      });
    } finally {
      setChecking(false);
    }
  };

  const handleOpenMaps = async () => {
    try {
      await Linking.openURL(LAHORE_MAPS_URL);
    } catch (_) {
      localizedToast({ type: "error", text1: "Could not open Maps link" });
    }
  };

  const handleCall = async () => {
    try {
      await Linking.openURL(`tel:${PHONE_NUMBER}`);
    } catch (_) {
      localizedToast({ type: "error", text1: "Could not initiate call" });
    }
  };

  const handleWhatsApp = async () => {
    try {
      await Linking.openURL(WHATSAPP_URL);
    } catch (_) {
      localizedToast({ type: "error", text1: "Could not open WhatsApp" });
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
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
        <AppText style={styles.headerTitle}>Application Status</AppText>
        <View style={styles.statusBadge}>
          <AppText style={styles.statusBadgeText}>Under Review</AppText>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Minimal Hero Card */}
        <View style={styles.heroCard}>
          <View style={styles.heroIconCircle}>
            <Ionicons name="time-outline" size={32} color="#D97706" />
          </View>

          <View style={styles.reviewStatusPill}>
            <View style={styles.pulsingDot} />
            <AppText style={styles.reviewStatusText}>In Review</AppText>
          </View>

          <AppText style={styles.heroTitle}>Application Under Review</AppText>
          <AppText style={styles.heroSubtitle}>
            Your partner application has been submitted and is currently being reviewed by our verification team.
          </AppText>
        </View>

        {/* Lahore Office In-Person Visit Card */}
        {isLahore && (
          <View style={styles.card}>
            <View style={styles.cardHeaderRow}>
              <View style={styles.iconSquare}>
                <Ionicons name="business-outline" size={18} color="#2563EB" />
              </View>
              <View style={styles.cardHeaderTexts}>
                <AppText style={styles.cardTitle}>In-Person Verification</AppText>
                <AppText style={styles.cardSubtitle}>You can visit our office for faster review</AppText>
              </View>
            </View>

            <View style={styles.addressBox}>
              <Ionicons name="location-outline" size={17} color="#2563EB" style={{ marginTop: 2 }} />
              <View style={{ flex: 1 }}>
                <AppText style={styles.addressName}>Tasker Company</AppText>
                <AppText style={styles.addressText}>150-2 Street 9, Iqbal Park, Lahore</AppText>
              </View>
            </View>

            <TouchableOpacity
              style={styles.directionsBtn}
              onPress={handleOpenMaps}
              activeOpacity={0.8}
            >
              <Ionicons name="navigate-outline" size={16} color="#2563EB" />
              <AppText style={styles.directionsBtnText}>Get Directions on Google Maps</AppText>
              <Ionicons name="open-outline" size={14} color="#2563EB" />
            </TouchableOpacity>
          </View>
        )}

        {/* Documents to Bring Card */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <View style={[styles.iconSquare, { backgroundColor: "#FEF3C7" }]}>
              <Ionicons name="document-text-outline" size={18} color="#D97706" />
            </View>
            <View style={styles.cardHeaderTexts}>
              <AppText style={styles.cardTitle}>Documents to Bring</AppText>
              <AppText style={styles.cardSubtitle}>Please bring the following original/copies</AppText>
            </View>
          </View>

          <View style={styles.docsList}>
            <View style={styles.docItem}>
              <Ionicons name="checkmark-circle" size={16} color="#059669" />
              <AppText style={styles.docItemText}>1 CNIC photocopy</AppText>
            </View>

            <View style={styles.docItem}>
              <Ionicons name="checkmark-circle" size={16} color="#059669" />
              <AppText style={styles.docItemText}>2 Passport-size photographs</AppText>
            </View>

            <View style={styles.docItem}>
              <Ionicons name="checkmark-circle" size={16} color="#059669" />
              <AppText style={styles.docItemText}>1 Electricity bill (utility copy)</AppText>
            </View>

            <View style={styles.docItem}>
              <Ionicons name="checkmark-circle" size={16} color="#059669" />
              <AppText style={styles.docItemText}>
                1 Police verification certificate <AppText style={styles.docOptionalText}>(if available)</AppText>
              </AppText>
            </View>
          </View>
        </View>

        {/* Contact Support Options */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <View style={[styles.iconSquare, { backgroundColor: "#EFF6FF" }]}>
              <Ionicons name="call-outline" size={18} color="#2563EB" />
            </View>
            <View style={styles.cardHeaderTexts}>
              <AppText style={styles.cardTitle}>Have Questions?</AppText>
              <AppText style={styles.cardSubtitle}>Reach out to our partner support team</AppText>
            </View>
          </View>

          <View style={styles.contactRow}>
            <TouchableOpacity
              style={styles.contactActionBtn}
              onPress={handleCall}
              activeOpacity={0.8}
            >
              <Ionicons name="call" size={16} color="#2563EB" />
              <View>
                <AppText style={styles.contactBtnLabel}>Call Us</AppText>
                <AppText style={styles.contactBtnNumber}>0304-1112717</AppText>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.contactActionBtn, styles.whatsappBtn]}
              onPress={handleWhatsApp}
              activeOpacity={0.8}
            >
              <Ionicons name="logo-whatsapp" size={17} color="#059669" />
              <View>
                <AppText style={[styles.contactBtnLabel, { color: "#065F46" }]}>WhatsApp</AppText>
                <AppText style={[styles.contactBtnNumber, { color: "#059669" }]}>0304-1112717</AppText>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Check Status Action */}
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
                <AppText style={styles.checkBtnText}>Checking Status...</AppText>
              </>
            ) : (
              <>
                <Ionicons name="refresh-outline" size={17} color="#FFFFFF" />
                <AppText style={styles.checkBtnText}>Check Approval Status</AppText>
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
  header: {
    height: 46,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.md,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
    backgroundColor: "#FEF2F2",
  },
  logoutBtnText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#DC2626",
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0F172A",
  },
  statusBadge: {
    backgroundColor: "#FEF3C7",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#FDE68A",
  },
  statusBadgeText: {
    fontSize: 10.5,
    fontWeight: "700",
    color: "#B45309",
  },
  scrollContent: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xl,
  },
  heroCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.md,
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  heroIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#FEF3C7",
    borderWidth: 1,
    borderColor: "#FDE68A",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  reviewStatusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#FFFBEB",
    paddingHorizontal: 10,
    paddingVertical: 3.5,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#FDE68A",
    marginBottom: 8,
  },
  pulsingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#D97706",
  },
  reviewStatusText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#B45309",
  },
  heroTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 4,
    textAlign: "center",
  },
  heroSubtitle: {
    fontSize: 12.5,
    color: "#64748B",
    textAlign: "center",
    lineHeight: 18,
    paddingHorizontal: Spacing.xs,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  cardHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: Spacing.sm,
  },
  iconSquare: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: "#EFF6FF",
    justifyContent: "center",
    alignItems: "center",
  },
  cardHeaderTexts: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 13.5,
    fontWeight: "700",
    color: "#0F172A",
  },
  cardSubtitle: {
    fontSize: 11.5,
    color: "#64748B",
    marginTop: 1,
  },
  addressBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: "#F8FAFC",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 10,
    marginBottom: 10,
  },
  addressName: {
    fontSize: 13,
    fontWeight: "700",
    color: "#0F172A",
  },
  addressText: {
    fontSize: 12,
    color: "#475569",
    marginTop: 2,
  },
  directionsBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    backgroundColor: "#EFF6FF",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#DBEAFE",
  },
  directionsBtnText: {
    fontSize: 12.5,
    fontWeight: "700",
    color: "#2563EB",
  },
  docsList: {
    gap: 8,
    backgroundColor: "#F8FAFC",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 12,
  },
  docItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  docItemText: {
    fontSize: 12.5,
    fontWeight: "600",
    color: "#1E293B",
  },
  docOptionalText: {
    fontSize: 11.5,
    fontWeight: "500",
    color: "#64748B",
  },
  contactRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 2,
  },
  contactActionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: "#EFF6FF",
    borderWidth: 1,
    borderColor: "#DBEAFE",
  },
  whatsappBtn: {
    backgroundColor: "#ECFDF5",
    borderColor: "#A7F3D0",
  },
  contactBtnLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "#1E40AF",
  },
  contactBtnNumber: {
    fontSize: 12,
    fontWeight: "700",
    color: "#2563EB",
  },
  checkBtn: {
    borderRadius: 12,
    overflow: "hidden",
    marginTop: 2,
  },
  btnDisabled: {
    opacity: 0.65,
  },
  checkBtnGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 13,
  },
  checkBtnText: {
    fontSize: 14.5,
    fontWeight: "700",
    color: "#FFFFFF",
  },
});
