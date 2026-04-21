import AlertModal from "@/components/common/AlertModal";
import CustomSwitch from "@/components/common/CustomSwitch";
import NotificationBell from "@/components/common/NotificationBell";
import Colors from "@/constants/Colors";
import { Spacing } from "@/constants/Styles";
import { useSession } from "@/context/ctx";
import { useBiometric } from "@/hooks/use-biometric";
import getImageUrl from "@/lib/utils";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Image } from "expo-image";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as SystemUI from "expo-system-ui";
import React, { useCallback, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";

const BIOMETRIC_PASSWORD_KEY = "@biometric_password";

export default function Settings() {
  const { signOutMode, session, setAppMode } = useSession();
  const [notifications, setNotifications] = useState(true);
  const [locationServices, setLocationServices] = useState(true);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showSwitchConfirm, setShowSwitchConfirm] = useState(false);
  const [isVendor, setIsVendor] = useState(session.appMode === "vendor");
  const [pendingVendor, setPendingVendor] = useState<boolean | null>(null);
  const [biometricLoading, setBiometricLoading] = useState(false);

  const { isAvailable, biometryType, isEnabled, enableBiometric, disableBiometric } =
    useBiometric();

  const handleSignOut = async () => {
    try {
      // Best-effort backend sign-out; ignore failures due to token interceptor
      const { default: myAxios } = await import("@/lib/axios.config");
      const { LOGOUT_URL } = await import("@/lib/api-endpoints");
      await myAxios.post(LOGOUT_URL);
    } catch {}
    await signOutMode("customer");
    if (session.vendorToken) {
      await setAppMode("vendor");
      router.replace("/vendor/(tabs)/dashboard");
    } else {
      await setAppMode("customer");
      router.replace("/auth/role-selection");
    }
  };

  const getUserInitials = () => {
    return (
      session.user?.name
        ?.split(" ")
        .map((n) => n[0])
        .join("")
        .substring(0, 2)
        .toUpperCase() || "U"
    );
  };

  useFocusEffect(
    useCallback(() => {
      SystemUI.setBackgroundColorAsync(Colors.neutral.white);
      return () => SystemUI.setBackgroundColorAsync(Colors.neutral.white);
    }, []),
  );

  return (
    <View style={styles.container}>
      {/* Blue Header Section */}
      <View style={styles.headerSection}>
        <SafeAreaView edges={["top"]} style={styles.safeArea}>
          <StatusBar style="dark" backgroundColor={Colors.neutral.white} />
          {/* Top Row */}
          <View style={styles.topRow}>
            <View>
              <Text style={styles.headerTitle}>Settings</Text>
              <Text style={styles.headerSubHeading}>
                Manage Your Account Detials Here
              </Text>
            </View>
            <NotificationBell variant="default" />
          </View>

          {/* Profile Info */}
          <View style={styles.profileCard}>
            <View style={styles.profileRow}>
              <View style={styles.avatarContainer}>
                {session.user?.avatar_url ? (
                  <Image
                    source={{ uri: getImageUrl(session.user.avatar_url) }}
                    style={styles.avatar}
                    contentFit="cover"
                    transition={200}
                    cachePolicy="disk"
                  />
                ) : (
                  <View style={styles.avatarPlaceholder}>
                    <Text style={styles.avatarText}>{getUserInitials()}</Text>
                  </View>
                )}
              </View>
              <View style={styles.profileInfo}>
                <Text style={styles.profileName}>
                  {session.user?.name || "User"}
                </Text>
                <Text style={styles.profileEmail}>
                  {session.user?.email || session.user?.phone}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.editBtn}
                onPress={() => router.push("/customer/profile/edit")}
                activeOpacity={0.7}
              >
                <Ionicons
                  name="create-outline"
                  size={18}
                  color={Colors.themes.customer.primary}
                />
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      </View>

      {/* White Content Area */}
      <View style={styles.contentSection}>
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.sectionCard}>
            <View style={styles.tileHeaderRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.tileTitle}>Switch your account</Text>
                <Text style={styles.tileSubtitle}>
                  Toggle between Customer and Vendor modes
                </Text>
              </View>
              <View style={styles.tileRight}>
                <View
                  style={[
                    styles.modeTag,
                    isVendor ? styles.modeTagVendor : styles.modeTagCustomer,
                  ]}
                >
                  <Text
                    style={[
                      styles.modeTagText,
                      isVendor
                        ? styles.modeTagTextVendor
                        : styles.modeTagTextCustomer,
                    ]}
                  >
                    {isVendor ? "Vendor" : "Customer"}
                  </Text>
                </View>
                <CustomSwitch
                  value={isVendor}
                  onValueChange={(next) => {
                    setPendingVendor(next);
                    setShowSwitchConfirm(true);
                  }}
                />
              </View>
            </View>
          </View>

          {/* Account Items */}
          <TouchableOpacity
            style={styles.listItem}
            onPress={() => router.push("/customer/profile/edit")}
            activeOpacity={0.6}
          >
            <View style={styles.listItemLeft}>
              <View
                style={[
                  styles.iconContainer,
                  { backgroundColor: Colors.themes.customer.primary + "15" },
                ]}
              >
                <Ionicons
                  name="person-outline"
                  size={18}
                  color={Colors.themes.customer.primary}
                />
              </View>
              <Text style={styles.listItemText}>Edit Profile</Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={18}
              color={Colors.text.tertiary}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.listItem}
            onPress={() => router.push("/customer/profile/addresses")}
            activeOpacity={0.6}
          >
            <View style={styles.listItemLeft}>
              <View
                style={[
                  styles.iconContainer,
                  {
                    backgroundColor: Colors.themes.customer.primaryLight + "20",
                  },
                ]}
              >
                <Ionicons
                  name="location-outline"
                  size={18}
                  color={Colors.themes.customer.primaryLight}
                />
              </View>
              <Text style={styles.listItemText}>Manage Addresses</Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={18}
              color={Colors.text.tertiary}
            />
          </TouchableOpacity>

          {/* Preferences */}
          <View style={styles.listItem}>
            <View style={styles.listItemLeft}>
              <View
                style={[styles.iconContainer, { backgroundColor: "#F59E0B15" }]}
              >
                <Ionicons
                  name="notifications-outline"
                  size={18}
                  color={Colors.warning}
                />
              </View>
              <Text style={styles.listItemText}>Notifications</Text>
            </View>
            <CustomSwitch
              value={notifications}
              onValueChange={setNotifications}
              size="sm"
            />
          </View>

          <View style={styles.listItem}>
            <View style={styles.listItemLeft}>
              <View
                style={[
                  styles.iconContainer,
                  { backgroundColor: Colors.themes.customer.accent + "30" },
                ]}
              >
                <Ionicons
                  name="navigate-outline"
                  size={18}
                  color={Colors.themes.customer.primaryDark}
                />
              </View>
              <Text style={styles.listItemText}>Location Services</Text>
            </View>
            <CustomSwitch
              value={locationServices}
              onValueChange={setLocationServices}
              size="sm"
            />
          </View>

          <View style={styles.listItem}>
            <View style={styles.listItemLeft}>
              <View
                style={[
                  styles.iconContainer,
                  {
                    backgroundColor: isEnabled
                      ? Colors.success + "15"
                      : Colors.neutral.gray[100],
                  },
                ]}
              >
                <Ionicons
                  name={
                    biometryType === "FACIAL_RECOGNITION"
                      ? "scan-outline"
                      : "finger-print-outline"
                  }
                  size={18}
                  color={
                    isEnabled
                      ? Colors.success
                      : isAvailable
                        ? Colors.text.tertiary
                        : Colors.neutral.gray[400]
                  }
                />
              </View>
              <View>
                <Text style={styles.listItemText}>
                  {biometryType === "FACIAL_RECOGNITION"
                    ? "Face ID Login"
                    : "Fingerprint Login"}
                </Text>
                <Text style={styles.listItemHint}>
                  {!isAvailable
                    ? "Not available on this device"
                    : isEnabled
                      ? "Enabled"
                      : "Disabled"}
                </Text>
              </View>
            </View>
            <CustomSwitch
              value={isEnabled}
              onValueChange={async () => {
                if (!isAvailable) {
                  Toast.show({
                    type: "info",
                    text1: "Biometric unavailable",
                    text2: "Enable fingerprint/Face ID in your phone settings first",
                  });
                  return;
                }

                setBiometricLoading(true);
                if (isEnabled) {
                  await disableBiometric();
                  await AsyncStorage.removeItem(BIOMETRIC_PASSWORD_KEY);
                  Toast.show({ type: "success", text1: "Biometric login disabled" });
                } else {
                  const success = await enableBiometric();
                  if (success) {
                    Toast.show({ type: "success", text1: "Biometric login enabled" });
                  }
                }
                setBiometricLoading(false);
              }}
              size="sm"
              disabled={biometricLoading}
            />
          </View>

          {/* Support */}
          <TouchableOpacity
            style={styles.listItem}
            onPress={() => router.push("/customer/contact-us")}
            activeOpacity={0.6}
          >
            <View style={styles.listItemLeft}>
              <View
                style={[
                  styles.iconContainer,
                  { backgroundColor: Colors.themes.customer.primary + "12" },
                ]}
              >
                <Ionicons
                  name="chatbubble-outline"
                  size={18}
                  color={Colors.themes.customer.primary}
                />
              </View>
              <Text style={styles.listItemText}>Contact Us</Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={18}
              color={Colors.text.tertiary}
            />
          </TouchableOpacity>

          {/* Sign Out */}
          <TouchableOpacity
            style={[styles.listItem, styles.signOutItem]}
            onPress={() => setShowLogoutConfirm(true)}
            activeOpacity={0.6}
          >
            <View style={styles.listItemLeft}>
              <View
                style={[
                  styles.iconContainer,
                  { backgroundColor: Colors.error + "15" },
                ]}
              >
                <Ionicons
                  name="log-out-outline"
                  size={18}
                  color={Colors.error}
                />
              </View>
              <Text style={[styles.listItemText, styles.signOutText]}>
                Sign Out
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={Colors.error} />
          </TouchableOpacity>

          {/* Version */}
          <Text style={styles.versionText}>Version 1.0.0</Text>
        </ScrollView>
      </View>

      {/* Logout Confirmation Modal */}
      <AlertModal
        visible={showLogoutConfirm}
        type="warning"
        title="Sign Out"
        message="Are you sure you want to sign out?"
        onClose={() => setShowLogoutConfirm(false)}
        primaryButton={{
          text: "Sign Out",
          onPress: handleSignOut,
        }}
        secondaryButton={{
          text: "Cancel",
          onPress: () => {},
        }}
      />
      <AlertModal
        visible={showSwitchConfirm}
        type="success"
        title={pendingVendor ? "Switch to Vendor" : "Switch to Customer"}
        message={
          pendingVendor
            ? "Switch to Vendor account?"
            : "Switch to Customer account?"
        }
        onClose={() => setShowSwitchConfirm(false)}
        primaryButton={{
          text: "Continue",
          onPress: async () => {
            setShowSwitchConfirm(false);
            const nextIsVendor = !!pendingVendor;
            setIsVendor(nextIsVendor);
            setPendingVendor(null);
            await setAppMode(nextIsVendor ? "vendor" : "customer");
            const hasVendor = !!session.vendorToken;
            const hasCustomer = !!session.customerToken;
            if (nextIsVendor) {
              if (hasVendor) {
                router.replace("/vendor/(tabs)/dashboard");
              } else {
                router.replace("/auth/vendor/sign-in");
              }
            } else {
              if (hasCustomer) {
                router.replace("/customer");
              } else {
                router.replace("/auth/customer/sign-in");
              }
            }
          },
        }}
        secondaryButton={{
          text: "Cancel",
          onPress: () => {
            setShowSwitchConfirm(false);
            setPendingVendor(null);
          },
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.tertiary,
  },
  headerSection: {
    backgroundColor: Colors.neutral.white,
    paddingBottom: Spacing.lg,
  },
  safeArea: {
    paddingHorizontal: Spacing.md,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.md,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.neutral.gray[900],
  },
  headerSubHeading: {
    fontSize: 14,
    fontWeight: "500",
    color: Colors.text.secondary,
  },
  profileCard: {
    borderRadius: 8,
    padding: Spacing.sm,
  },
  profileRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatarContainer: {
    marginRight: Spacing.sm,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: Colors.neutral.gray[100],
  },
  avatarPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.neutral.gray[100],
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: Colors.neutral.gray[200],
  },
  avatarText: {
    fontSize: 20,
    fontWeight: "700",
    color: Colors.text.primary,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.text.primary,
    marginBottom: 2,
  },
  profileEmail: {
    fontSize: 12,
    color: Colors.text.secondary,
  },
  editBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: Colors.neutral.gray[100],
    justifyContent: "center",
    alignItems: "center",
  },
  contentSection: {
    flex: 1,
    marginTop: -8,
  },
  sectionCard: {
    backgroundColor: Colors.neutral.white,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border.light,
    padding: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  sectionHeader: { marginBottom: Spacing.sm },
  sectionTitle: { fontSize: 14, fontWeight: "700", color: Colors.text.primary },
  sectionSubtitle: { fontSize: 12, color: Colors.text.secondary, marginTop: 2 },
  tileHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  tileTitle: { fontSize: 15, fontWeight: "700", color: Colors.text.primary },
  tileSubtitle: { fontSize: 12, color: Colors.text.secondary, marginTop: 2 },
  tileRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  modeTag: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    borderWidth: 1,
  },
  modeTagVendor: {
    backgroundColor: Colors.themes.customer.primary + "10",
    borderColor: Colors.themes.customer.primary,
  },
  modeTagCustomer: {
    backgroundColor: Colors.neutral.gray[50],
    borderColor: Colors.border.light,
  },
  modeTagText: {
    fontSize: 12,
    fontWeight: "600",
  },
  modeTagTextVendor: {
    color: Colors.themes.customer.primary,
  },
  modeTagTextCustomer: {
    color: Colors.text.secondary,
  },
  roleSwitcherRow: {
    flexDirection: "row",
    gap: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  roleChip: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    borderWidth: 1,
    borderColor: Colors.border.light,
    backgroundColor: Colors.neutral.gray[50],
    paddingVertical: 8,
    paddingHorizontal: Spacing.sm,
    borderRadius: 6,
    justifyContent: "center",
  },
  roleChipActive: {
    borderColor: Colors.themes.customer.primary,
    backgroundColor: Colors.themes.customer.primary + "10",
  },
  roleIconContainer: {
    width: 22,
    height: 22,
    borderRadius: 6,
    backgroundColor: Colors.neutral.white,
    borderWidth: 1,
    borderColor: Colors.border.light,
    alignItems: "center",
    justifyContent: "center",
  },
  roleIconContainerActive: {
    borderColor: Colors.themes.customer.primary,
    backgroundColor: Colors.neutral.white,
  },
  roleChipText: {
    fontSize: 12,
    color: Colors.text.secondary,
    fontWeight: "600",
  },
  roleChipTextActive: {
    color: Colors.themes.customer.primary,
  },
  switchAccountBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.xs,
    backgroundColor: Colors.themes.customer.primary,
    borderRadius: 6,
    paddingVertical: 10,
  },
  switchAccountBtnText: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.neutral.white,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: Spacing.md,
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.lg,
  },
  listItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  listItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  listItemText: {
    fontSize: 14,
    fontWeight: "500",
    color: Colors.text.primary,
  },
  listItemHint: {
    fontSize: 11,
    color: Colors.text.secondary,
    marginTop: 2,
  },
  switch: {
    transform: [{ scale: 0.85 }],
  },
  signOutItem: {
    marginTop: Spacing.md,
    borderBottomWidth: 0,
  },
  signOutText: {
    color: Colors.error,
  },
  versionText: {
    fontSize: 11,
    color: Colors.text.tertiary,
    textAlign: "center",
    marginTop: Spacing.xl,
  },
});
