import { localizedToast } from "@/lib/i18n/localized-toast";
import AppText from "@/components/common/AppText";
import AlertModal from "@/components/common/AlertModal";
import NotificationBell from "@/components/common/NotificationBell";
import AccountSwitchCard from "@/components/settings/AccountSwitchCard";
import DeleteAccountModal from "@/components/settings/DeleteAccountModal";
import SettingsItem from "@/components/settings/SettingsItem";
import Colors from "@/constants/Colors";
import { Spacing } from "@/constants/Styles";
import { useSession } from "@/context/ctx";
import { useLanguage } from "@/context/language-context";
import LanguageSwitcherModal from "@/components/common/LanguageSwitcherModal";
import getImageUrl from "@/lib/utils";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Image } from "expo-image";
import { router, useFocusEffect } from "expo-router";
import * as SystemUI from "expo-system-ui";
import { useCallback, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import { getAppVersionDisplay } from "@/lib/appVersion";

export default function Settings() {
  const { signOutMode, session, setAppMode } = useSession();
  const { language, t } = useLanguage();
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showSwitchConfirm, setShowSwitchConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [isVendor, setIsVendor] = useState(session.appMode === "vendor");
  const [pendingVendor, setPendingVendor] = useState<boolean | null>(null);
  const [avatarError, setAvatarError] = useState(false);

  const rawCustomerAvatar =
    session.user?.avatar_url ||
    (session.user as any)?.active_avatar_url ||
    (session.user as any)?.profile_image ||
    null;
  const customerAvatar = rawCustomerAvatar ? getImageUrl(rawCustomerAvatar) : "";

  const handleSignOut = async () => {
    try {
      const { default: myAxios } = await import("@/lib/axios.config");
      const { LOGOUT_URL } = await import("@/lib/api-endpoints");
      await myAxios.post(LOGOUT_URL);
    } catch { }
    await signOutMode("customer");
    if (session.vendorToken) {
      await setAppMode("vendor");
      router.replace("/vendor/(tabs)/dashboard");
    } else {
      await setAppMode("customer");
      router.replace("/auth/role-selection");
    }
  };

  // Handle Account Deletion Flow
  const handleDeleteAccount = async () => {
    setDeletingAccount(true);
    try {
      const { default: myAxios } = await import("@/lib/axios.config");
      const { DELETE_ACCOUNT_URL } = await import("@/lib/api-endpoints");
      await myAxios.delete(DELETE_ACCOUNT_URL).catch(() => { });
    } catch { }

    await signOutMode("customer");
    await signOutMode("vendor");
    await AsyncStorage.clear();

    setDeletingAccount(false);
    setShowDeleteConfirm(false);

    localizedToast({
      type: "success",
      text1: "Account Deleted",
      text2: "Your account has been permanently removed.",
    });

    router.replace("/auth/role-selection");
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
      {/* Header Section */}
      <View style={styles.headerSection}>
        <SafeAreaView edges={["top"]} style={styles.safeArea}>
          {/* Top Row */}
          <View style={styles.topRow}>
            <View>
              <AppText style={styles.headerTitle}>Settings</AppText>
              <AppText style={styles.headerSubHeading}>
                Manage your account preferences & security
              </AppText>
            </View>
            <NotificationBell variant="default" />
          </View>

          {/* Profile Info Card */}
          <View style={styles.profileCard}>
            <View style={styles.profileRow}>
              <View style={styles.avatarContainer}>
                {customerAvatar && !avatarError ? (
                  <Image
                    source={{ uri: customerAvatar }}
                    style={styles.avatar}
                    contentFit="cover"
                    transition={200}
                    cachePolicy="disk"
                    onError={() => setAvatarError(true)}
                  />
                ) : (
                  <View style={styles.avatarPlaceholder}>
                    <AppText style={styles.avatarText}>{getUserInitials()}</AppText>
                  </View>
                )}
              </View>
              <View style={styles.profileInfo}>
                <AppText style={styles.profileName}>
                  {session.user?.name || "User"}
                </AppText>
                <AppText style={styles.profileEmail}>
                  {session.user?.email || session.user?.phone}
                </AppText>
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

      {/* Main Content Area */}
      <View style={styles.contentSection}>
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Enhanced Account Switching Component */}
          <AccountSwitchCard
            isVendor={isVendor}
            onToggle={(next) => {
              setPendingVendor(next);
              setShowSwitchConfirm(true);
            }}
          />

          {/* Account Settings Section */}
          <AppText style={styles.sectionHeaderTitle}>Account Management</AppText>
          <SettingsItem
            icon="person-outline"
            iconColor={Colors.themes.customer.primary}
            title="Edit Profile"
            subtitle="Update name, email, phone number & avatar"
            onPress={() => router.push("/customer/profile/edit")}
          />

          <SettingsItem
            icon="location-outline"
            iconColor={Colors.themes.customer.primaryLight}
            title={t.customer.settings.savedAddresses}
            subtitle="Add or edit your saved delivery & service locations"
            onPress={() => router.push("/customer/profile/addresses")}
          />

          {/* Language & Preferences */}
          <AppText style={styles.sectionHeaderTitle}>Preferences & Language</AppText>
          <SettingsItem
            icon="globe-outline"
            iconColor="#2563EB"
            title={t.customer.settings.languageSettings}
            subtitle={language === "ur" ? "اردو (Urdu) - فعال ہے" : language === "ur-Latn" ? "Roman Urdu - Selected" : "English - Active"}
            onPress={() => setShowLanguageModal(true)}
          />

          {/* Support Section */}
          <AppText style={styles.sectionHeaderTitle}>{t.customer.settings.helpSupport}</AppText>
          <SettingsItem
            icon="chatbubble-outline"
            iconColor={Colors.themes.customer.primary}
            title="Contact Support"
            subtitle="Get 24/7 help with orders, billing or vendor complaints"
            onPress={() => router.push("/customer/contact-us")}
          />

          {/* Danger Zone Section */}
          <AppText style={[styles.sectionHeaderTitle, { color: Colors.error }]}>
            Danger Zone
          </AppText>

          <SettingsItem
            icon="log-out-outline"
            iconColor={Colors.error}
            iconBgColor={Colors.error + "15"}
            title="Sign Out"
            subtitle="Sign out of your active account session"
            danger
            onPress={() => setShowLogoutConfirm(true)}
          />

          <SettingsItem
            icon="trash-outline"
            iconColor={Colors.error}
            iconBgColor={Colors.error + "20"}
            title="Delete Account"
            subtitle="Permanently erase your account, orders and profile data"
            danger
            onPress={() => setShowDeleteConfirm(true)}
          />

          {/* App Version */}
          <AppText style={styles.versionText}>{getAppVersionDisplay("Tasker App")}</AppText>
        </ScrollView>
      </View>

      {/* Logout Confirmation Modal */}
      <AlertModal
        visible={showLogoutConfirm}
        type="warning"
        title="Sign Out"
        message="Are you sure you want to sign out of your account?"
        onClose={() => setShowLogoutConfirm(false)}
        primaryButton={{
          text: "Sign Out",
          onPress: handleSignOut,
        }}
        secondaryButton={{
          text: "Cancel",
          onPress: () => { },
        }}
      />

      <LanguageSwitcherModal
        visible={showLanguageModal}
        onClose={() => setShowLanguageModal(false)}
      />

      {/* Mode Switch Confirmation Modal */}
      <AlertModal
        visible={showSwitchConfirm}
        type="success"
        title={pendingVendor ? "Switch to Service Provider Mode" : "Switch to Customer Mode"}
        message={
          pendingVendor
            ? "Switch workspace to Tasker Service Provider mode?"
            : "Switch workspace to Customer mode?"
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

      {/* Account Deletion Modal */}
      <DeleteAccountModal
        visible={showDeleteConfirm}
        loading={deletingAccount}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirmDelete={handleDeleteAccount}
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
    paddingBottom: Spacing.md,
  },
  safeArea: {
    paddingHorizontal: Spacing.md,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.sm,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: Colors.neutral.gray[900],
  },
  headerSubHeading: {
    fontSize: 13,
    fontWeight: "500",
    color: Colors.text.secondary,
    marginTop: 2,
  },
  profileCard: {
    borderRadius: 8,
    paddingVertical: Spacing.xs,
  },
  profileRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatarContainer: {
    marginRight: Spacing.sm,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 2,
    borderColor: Colors.neutral.gray[100],
  },
  avatarPlaceholder: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.neutral.gray[100],
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: Colors.neutral.gray[200],
  },
  avatarText: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.text.primary,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.text.primary,
    marginBottom: 2,
  },
  profileEmail: {
    fontSize: 12,
    color: Colors.text.secondary,
  },
  editBtn: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: Colors.neutral.gray[100],
    justifyContent: "center",
    alignItems: "center",
  },
  contentSection: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.xl,
  },
  sectionHeaderTitle: {
    fontSize: 12,
    fontWeight: "800",
    color: Colors.text.tertiary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginTop: Spacing.sm,
    marginBottom: Spacing.xs,
    marginLeft: 2,
  },
  versionText: {
    fontSize: 11,
    color: Colors.text.tertiary,
    textAlign: "center",
    marginTop: Spacing.lg,
  },
});
