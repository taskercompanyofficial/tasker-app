import Colors from "@/constants/Colors";
import { BorderRadius, Shadows, Spacing, Typography } from "@/constants/Styles";
import { useSession } from "@/context/ctx";
import React, { useMemo, useState, useEffect, useCallback } from "react";
import {
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import Toast from "react-native-toast-message";
import myAxios from "@/lib/axios.config";
import { VENDOR_SIGN_OUT_URL, VENDOR_STAFF_SIGN_OUT_URL } from "@/lib/api-endpoints";
import {
  VENDOR_QUICK_LOGIN_REVOKE_URL,
  VENDOR_STAFF_QUICK_LOGIN_REVOKE_URL,
} from "@/lib/api-endpoints";
import { router } from "expo-router";
import CustomSwitch from "@/components/common/CustomSwitch";
import AlertModal from "@/components/common/AlertModal";
import * as SystemUI from "expo-system-ui";
import { useFocusEffect } from "@react-navigation/native";
import { useBiometric } from "@/hooks/use-biometric";
import * as SecureStore from "expo-secure-store";

const BIOMETRIC_VENDOR_CREDENTIAL_KEY = "@biometric_vendor_quick_login";

interface BiometricSettingItemProps {
  isAvailable: boolean;
  isEnabled: boolean;
  biometryType: string | null;
  isLoading: boolean;
  onToggle: () => void;
}

function BiometricSettingItem({ isAvailable, isEnabled, biometryType, isLoading, onToggle }: BiometricSettingItemProps) {
  const getIcon = () => {
    if (biometryType === "FINGERPRINT") return "finger-print-outline";
    if (biometryType === "FACIAL_RECOGNITION") return "scan-outline";
    return "finger-print-outline";
  };

  const getLabel = () => {
    if (biometryType === "FINGERPRINT") return "Fingerprint Login";
    if (biometryType === "FACIAL_RECOGNITION") return "Face ID Login";
    return "Biometric Login";
  };

  const getSubtitle = () => {
    if (isLoading) return "Verifying...";
    if (!isAvailable) return "Not available on this device";
    return isEnabled ? "Enabled - Tap to disable" : "Disabled - Tap to enable";
  };

  return (
    <TouchableOpacity
      style={[styles.settingItem, styles.firstItem]}
      onPress={onToggle}
      disabled={isLoading}
      activeOpacity={0.7}
    >
      <View style={[styles.iconBox, { backgroundColor: isEnabled ? Colors.success + "15" : Colors.neutral.gray[100] }]}>
        <Ionicons
          name={getIcon() as any}
          size={20}
          color={isEnabled ? Colors.success : isAvailable ? Colors.text.tertiary : Colors.neutral.gray[400]}
        />
      </View>
      <View style={styles.settingContent}>
        <Text style={styles.settingTitle}>{getLabel()}</Text>
        <Text style={styles.settingSubtitle}>{getSubtitle()}</Text>
      </View>
      <CustomSwitch value={isEnabled} onValueChange={onToggle} disabled={isLoading} />
    </TouchableOpacity>
  );
}

export default function VendorSettings() {
  const { session, setAppMode, signOutMode } = useSession();
  const [showSwitchConfirm, setShowSwitchConfirm] = React.useState(false);
  const [pendingCustomer, setPendingCustomer] = React.useState<boolean | null>(null);
  
  const { isAvailable, biometryType, isEnabled, enableBiometric, disableBiometric } = useBiometric();
  const [biometricLoading, setBiometricLoading] = useState(false);

  const isVendor = useMemo(
    () => session.appMode === "vendor" || session.appMode === "vendor_staff",
    [session.appMode],
  );
  const isStaff = useMemo(
    () => session.appMode === "vendor_staff" || session.user?.user_type === "vendor_staff",
    [session.appMode, session.user],
  );

  useFocusEffect(
    React.useCallback(() => {
      // #region agent log
      fetch("http://127.0.0.1:7789/ingest/e7df05fe-e28b-4c90-971d-c6d804cac73a", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Debug-Session-Id": "54d0b8",
        },
        body: JSON.stringify({
          sessionId: "54d0b8",
          runId: "initial",
          hypothesisId: "H7_settings_focus_churn",
          location: "app/vendor/(tabs)/settings.tsx:101",
          message: "Settings focus effect entered",
          data: {
            appMode: session.appMode,
            userType: session.user?.user_type ?? null,
          },
          timestamp: Date.now(),
        }),
      }).catch(() => {});
      // #endregion
      SystemUI.setBackgroundColorAsync(Colors.neutral.white);
      return () => {
        // #region agent log
        fetch("http://127.0.0.1:7789/ingest/e7df05fe-e28b-4c90-971d-c6d804cac73a", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Debug-Session-Id": "54d0b8",
          },
          body: JSON.stringify({
            sessionId: "54d0b8",
            runId: "initial",
            hypothesisId: "H7_settings_focus_churn",
            location: "app/vendor/(tabs)/settings.tsx:117",
            message: "Settings focus effect cleanup",
            data: {
              appMode: session.appMode,
              userType: session.user?.user_type ?? null,
            },
            timestamp: Date.now(),
          }),
        }).catch(() => {});
        // #endregion
        SystemUI.setBackgroundColorAsync(Colors.neutral.white);
      };
    }, []),
  );

  const vendorName = session.user?.name || (isStaff ? "Staff Member" : "Service Provider");
  const vendorEmail = session.user?.email || (isStaff ? session.user?.phone : "provider@tasker.com");

  useEffect(() => {
    // #region agent log
    fetch("http://127.0.0.1:7789/ingest/e7df05fe-e28b-4c90-971d-c6d804cac73a", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Debug-Session-Id": "54d0b8",
      },
      body: JSON.stringify({
        sessionId: "54d0b8",
        runId: "initial",
        hypothesisId: "H4_settings_profile_shape",
        location: "app/vendor/(tabs)/settings.tsx:111",
        message: "Derived vendor/staff profile values",
        data: {
          appMode: session.appMode,
          isStaff,
          rawName: session.user?.name ?? null,
          rawPhone: session.user?.phone ?? null,
          vendorName,
          vendorEmail,
        },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion
  }, [isStaff, session.appMode, session.user, vendorEmail, vendorName]);

  const onSignOut = async () => {
    try {
      if (isStaff) {
        await myAxios.post(VENDOR_STAFF_SIGN_OUT_URL);
      } else {
        await myAxios.post(VENDOR_SIGN_OUT_URL);
      }
    } catch {}
    await signOutMode(isStaff ? "vendor_staff" : "vendor");
    Toast.show({ type: "success", text1: "Successfully signed out" });

    await setAppMode("customer");
    if (session.customerToken) {
      router.replace("/customer/(tabs)");
    } else {
      router.replace("/auth/customer/sign-in");
    }
  };

  const SettingItem = ({
    icon,
    title,
    subtitle,
    onPress,
    color = Colors.themes.provider.primary,
    isFirst = false,
    isLast = false,
    destructive = false,
  }: any) => (
    <TouchableOpacity
      style={[
        styles.settingItem,
        isFirst && styles.firstItem,
        isLast && styles.lastItem,
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View
        style={[
          styles.iconBox,
          { backgroundColor: destructive ? Colors.error + "15" : color + "15" },
        ]}
      >
        <Ionicons
          name={icon}
          size={20}
          color={destructive ? Colors.error : color}
        />
      </View>
      <View style={styles.settingContent}>
        <Text
          style={[styles.settingTitle, destructive && { color: Colors.error }]}
        >
          {title}
        </Text>
        {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
      </View>
      <Ionicons name="chevron-forward" size={18} color={Colors.text.tertiary} />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.profileCard}>
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {vendorName.charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={styles.verifiedBadge}>
              <Ionicons
                name="checkmark-sharp"
                size={10}
                color={Colors.neutral.white}
              />
            </View>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{vendorName}</Text>
            <Text style={styles.profileEmail}>{vendorEmail}</Text>
            <View style={styles.roleBadge}>
              <Text style={styles.roleBadgeText}>{isStaff ? "Vendor Staff" : "Official Vendor"}</Text>
            </View>
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
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
                  if (!next) {
                    setPendingCustomer(true);
                    setShowSwitchConfirm(true);
                  }
                }}
              />
            </View>
          </View>
        </View>
        {!isStaff && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Business Management</Text>
          <View style={styles.itemsGate}>
            <SettingItem
              icon="people-outline"
              title="Staff Management"
              subtitle="View and manage your technical team"
              onPress={() => router.push("/vendor/staff" as any)}
              isFirst
            />
            <SettingItem
              icon="briefcase-outline"
              title="Business Profile"
              subtitle="Update your shop and service details"
              onPress={() => {}}
            />
            <SettingItem
              icon="stats-chart-outline"
              title="Performance Reports"
              subtitle="Earnings and job completion stats"
              onPress={() => {}}
              isLast
            />
          </View>
        </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account Settings</Text>
          <View style={styles.itemsGate}>
            <BiometricSettingItem
              isAvailable={isAvailable}
              isEnabled={isEnabled}
              biometryType={biometryType}
              isLoading={biometricLoading}
              onToggle={async () => {
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
                  try {
                    const revokeUrl =
                      isStaff
                        ? VENDOR_STAFF_QUICK_LOGIN_REVOKE_URL
                        : VENDOR_QUICK_LOGIN_REVOKE_URL;
                    await myAxios.delete(revokeUrl);
                  } catch {}
                  await SecureStore.deleteItemAsync(BIOMETRIC_VENDOR_CREDENTIAL_KEY);
                  Toast.show({ type: "success", text1: "Biometric login disabled" });
                } else {
                  const success = await enableBiometric();
                  if (success) {
                    Toast.show({ type: "success", text1: "Biometric login enabled" });
                  }
                }
                setBiometricLoading(false);
              }}
            />
            <SettingItem
              icon="notifications-outline"
              title="Notifications"
              subtitle="Configure your job alerts"
              onPress={() => router.push("/vendor/notifications" as any)}
              color={Colors.success}
            />
            <SettingItem
              icon="lock-closed-outline"
              title="Security"
              subtitle="Password and account protection"
              onPress={() => {}}
              color={Colors.info}
              isLast
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>More</Text>
          <View style={styles.itemsGate}>
            <SettingItem
              icon="help-circle-outline"
              title="Help & Support"
              onPress={() => {}}
              isFirst
            />
            <SettingItem
              icon="document-text-outline"
              title="Terms of Service"
              onPress={() => {}}
              isLast
            />
          </View>
        </View>

        <TouchableOpacity
          style={styles.logoutButton}
          activeOpacity={0.8}
          onPress={onSignOut}
        >
          <Ionicons name="log-out-outline" size={20} color={Colors.error} />
          <Text style={styles.logoutText}>Sign Out Account</Text>
        </TouchableOpacity>

        <Text style={styles.versionText}>Tasker Company v1.2.4</Text>
      </ScrollView>

      <AlertModal
        visible={showSwitchConfirm}
        type="success"
        title="Switch to Customer"
        message="Switch to Customer account?"
        onClose={() => setShowSwitchConfirm(false)}
        primaryButton={{
          text: "Continue",
          onPress: async () => {
            setShowSwitchConfirm(false);
            setPendingCustomer(null);
            await setAppMode("customer");
            if (session.customerToken) {
              router.replace("/customer/(tabs)");
            } else {
              router.replace("/auth/customer/sign-in");
            }
          },
        }}
        secondaryButton={{
          text: "Cancel",
          onPress: () => {
            setShowSwitchConfirm(false);
            setPendingCustomer(null);
          },
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.secondary,
  },
  profileCard: {
    backgroundColor: Colors.neutral.white,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.lg,
    borderBottomLeftRadius: BorderRadius.md,
    borderBottomRightRadius: BorderRadius.md,
    ...Shadows.sm,
    zIndex: 10,
  },
  profileHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  avatarContainer: {
    position: "relative",
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.themes.provider.primary,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: Colors.themes.provider.primary + "30",
  },
  avatarText: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.extrabold,
    color: Colors.neutral.white,
  },
  verifiedBadge: {
    position: "absolute",
    bottom: 2,
    right: 2,
    backgroundColor: Colors.success,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: Colors.neutral.white,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.bold,
    color: Colors.text.primary,
  },
  profileEmail: {
    fontSize: Typography.sizes.xs,
    color: Colors.text.secondary,
    marginTop: 1,
  },
  roleBadge: {
    alignSelf: "flex-start",
    backgroundColor: Colors.themes.provider.primary + "15",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
    marginTop: 8,
  },
  roleBadgeText: {
    fontSize: 10,
    fontWeight: Typography.weights.bold,
    color: Colors.themes.provider.primary,
    textTransform: "uppercase",
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.md,
    paddingBottom: Spacing.xxl * 2,
  },
  section: {
    marginTop: Spacing.lg,
  },
  sectionTitle: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.bold,
    color: Colors.text.tertiary,
    textTransform: "uppercase",
    marginBottom: Spacing.sm,
    marginLeft: 4,
    letterSpacing: 1,
  },
  itemsGate: {
    backgroundColor: Colors.neutral.white,
    borderRadius: BorderRadius.md,
    ...Shadows.sm,
  },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.background.secondary,
  },
  firstItem: {
    borderTopLeftRadius: BorderRadius.md,
    borderTopRightRadius: BorderRadius.md,
  },
  lastItem: {
    borderBottomWidth: 0,
    borderBottomLeftRadius: BorderRadius.md,
    borderBottomRightRadius: BorderRadius.md,
  },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.sm,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.semibold,
    color: Colors.text.primary,
  },
  settingSubtitle: {
    fontSize: 10,
    color: Colors.text.secondary,
    marginTop: 1,
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.error + "10",
    marginTop: Spacing.xl,
    paddingVertical: 12,
    borderRadius: BorderRadius.md,
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.error + "20",
  },
  logoutText: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.bold,
    color: Colors.error,
  },
  versionText: {
    textAlign: "center",
    fontSize: 10,
    color: Colors.text.quaternary,
    marginTop: Spacing.lg,
    fontWeight: Typography.weights.medium,
  },
  sectionCard: {
    backgroundColor: Colors.neutral.white,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border.light,
    padding: Spacing.sm,
    marginBottom: Spacing.sm,
    ...Shadows.sm,
  },
  tileHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  tileTitle: { fontSize: 13, fontWeight: "700", color: Colors.text.primary },
  tileSubtitle: { fontSize: 10, color: Colors.text.secondary, marginTop: 2 },
  tileRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  modeTag: {
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 6,
    borderWidth: 1,
  },
  modeTagVendor: {
    backgroundColor: Colors.themes.provider.primary + "10",
    borderColor: Colors.themes.provider.primary,
  },
  modeTagCustomer: {
    backgroundColor: Colors.neutral.gray[50],
    borderColor: Colors.border.light,
  },
  modeTagText: {
    fontSize: 10,
    fontWeight: "600",
  },
  modeTagTextVendor: {
    color: Colors.themes.provider.primary,
  },
  modeTagTextCustomer: {
    color: Colors.text.secondary,
  },
});
