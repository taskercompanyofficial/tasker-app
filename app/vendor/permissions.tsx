import AppText from "@/components/common/AppText";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  AppState,
  BackHandler,
  Linking,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as Location from "expo-location";
import * as Notifications from "expo-notifications";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants, { ExecutionEnvironment } from "expo-constants";
import Colors from "@/constants/Colors";
import {
  requestVendorNotificationPermissions,
} from "@/lib/vendorBackgroundLocation";

export const VENDOR_PERMISSIONS_COMPLETED_KEY = "@vendor_permissions_completed";

const isExpoGo =
  Constants.executionEnvironment === ExecutionEnvironment.StoreClient ||
  (Constants as any).appOwnership === "expo";

export default function VendorPermissionsScreen() {
  const router = useRouter();

  const [locGranted, setLocGranted] = useState<boolean | null>(null);
  const [notifGranted, setNotifGranted] = useState<boolean | null>(null);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  // Irreversible screen: Disable Android hardware back button
  useEffect(() => {
    const backAction = () => true; // Swallow back event
    const backHandler = BackHandler.addEventListener("hardwareBackPress", backAction);
    return () => backHandler.remove();
  }, []);

  const checkPermissions = useCallback(async () => {
    if (isExpoGo) {
      setLocGranted(true);
      setNotifGranted(true);
      return;
    }

    try {
      const [fg, notif] = await Promise.all([
        Location.getForegroundPermissionsAsync(),
        Notifications.getPermissionsAsync().catch(() => ({ granted: false })),
      ]);

      setLocGranted(fg.granted);
      setNotifGranted(notif.granted);
    } catch (e) {
      console.warn("[VendorPermissionsScreen] Error checking permissions:", e);
    }
  }, []);

  useEffect(() => {
    checkPermissions();

    const subscription = AppState.addEventListener("change", (nextState) => {
      if (nextState === "active") {
        checkPermissions();
      }
    });

    return () => {
      subscription.remove();
    };
  }, [checkPermissions]);

  const handleRequestLocation = async () => {
    setLoadingAction("location");
    try {
      const { status: fgStatus } = await Location.requestForegroundPermissionsAsync();
      setLocGranted(fgStatus === "granted");

      if (fgStatus !== "granted") {
        await Linking.openSettings().catch(() => {});
      }
    } catch (e) {
      console.warn("[VendorPermissionsScreen] Location error:", e);
    } finally {
      setLoadingAction(null);
    }
  };

  const handleRequestNotifications = async () => {
    setLoadingAction("notification");
    try {
      const granted = await requestVendorNotificationPermissions();
      setNotifGranted(granted);
      if (!granted) {
        await Linking.openSettings().catch(() => {});
      }
    } catch (e) {
      console.warn("[VendorPermissionsScreen] Notification error:", e);
    } finally {
      setLoadingAction(null);
    }
  };

  // Primary Action: Grant all remaining or proceed to dashboard
  const handlePrimaryAction = async () => {
    if (isAllGranted) {
      // Mark setup as complete and irreversibly route to vendor dashboard
      try {
        await AsyncStorage.setItem(VENDOR_PERMISSIONS_COMPLETED_KEY, "true");
      } catch (e) {
        console.warn("[VendorPermissionsScreen] Error saving completion:", e);
      }
      router.replace("/vendor/(tabs)" as any);
      return;
    }

    // Step-by-step request for missing permissions
    if (!locGranted) {
      await handleRequestLocation();
      return;
    }
    if (!notifGranted) {
      await handleRequestNotifications();
      return;
    }
  };

  const isAllGranted =
    locGranted === true &&
    notifGranted === true;

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Minimal Decent Header Block (No Back Button) */}
        <View style={styles.headerBlock}>
          <View style={styles.badgeIconContainer}>
            <Ionicons
              name="shield-checkmark"
              size={28}
              color={Colors.themes.provider.primary}
            />
          </View>
          <AppText style={styles.title}>Service Permissions</AppText>
          <AppText style={styles.subtitle}>
            Enable the required device permissions to receive customer bookings and provide live arrival tracking.
          </AppText>
        </View>

        {/* Minimal Cards List */}
        <View style={styles.cardGroup}>
          {/* 1. Location Access */}
          <View style={styles.card}>
            <View style={[styles.iconBox, { backgroundColor: "#ECFDF5" }]}>
              <Ionicons name="navigate-sharp" size={20} color="#16A34A" />
            </View>
            <View style={styles.cardInfo}>
              <AppText style={styles.cardTitle}>Location Navigation</AppText>
              <AppText style={styles.cardDesc}>
                Route tracking for live arrival updates to customers
              </AppText>
            </View>
            {locGranted ? (
              <View style={styles.pillGranted}>
                <Ionicons name="checkmark-circle" size={14} color="#16A34A" />
                <AppText style={styles.pillGrantedText}>Enabled</AppText>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.pillAction}
                onPress={handleRequestLocation}
                disabled={loadingAction === "location"}
                activeOpacity={0.8}
              >
                {loadingAction === "location" ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <AppText style={styles.pillActionText}>Enable</AppText>
                )}
              </TouchableOpacity>
            )}
          </View>

          {/* 2. Notifications */}
          <View style={styles.card}>
            <View style={[styles.iconBox, { backgroundColor: "#FFFBEB" }]}>
              <Ionicons name="notifications-sharp" size={20} color="#D97706" />
            </View>
            <View style={styles.cardInfo}>
              <AppText style={styles.cardTitle}>Instant Alerts</AppText>
              <AppText style={styles.cardDesc}>
                Sound and push notifications for new incoming jobs
              </AppText>
            </View>
            {notifGranted ? (
              <View style={styles.pillGranted}>
                <Ionicons name="checkmark-circle" size={14} color="#16A34A" />
                <AppText style={styles.pillGrantedText}>Enabled</AppText>
              </View>
            ) : (
              <TouchableOpacity
                style={[styles.pillAction, { backgroundColor: "#D97706" }]}
                onPress={handleRequestNotifications}
                disabled={loadingAction === "notification"}
                activeOpacity={0.8}
              >
                {loadingAction === "notification" ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <AppText style={styles.pillActionText}>Enable</AppText>
                )}
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Security & Privacy Assurance Note */}
        <View style={styles.privacyNote}>
          <Ionicons name="lock-closed-outline" size={13} color="#94A3B8" />
          <AppText style={styles.privacyText}>
            Your privacy is protected. Location is only active during scheduled working jobs.
          </AppText>
        </View>

        {/* Action Footer */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[
              styles.primaryBtn,
              isAllGranted ? styles.primaryBtnSuccess : styles.primaryBtnDefault,
            ]}
            onPress={handlePrimaryAction}
            activeOpacity={0.88}
          >
            <AppText style={styles.primaryBtnText}>
              {isAllGranted ? "Continue to Dashboard" : "Grant All Permissions"}
            </AppText>
            <Ionicons
              name={isAllGranted ? "arrow-forward" : "shield-checkmark-outline"}
              size={18}
              color="#FFFFFF"
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.settingsLink}
            onPress={() => Linking.openSettings()}
            activeOpacity={0.7}
          >
            <Ionicons name="settings-outline" size={14} color="#64748B" />
            <AppText style={styles.settingsLinkText}>Open Device Settings</AppText>
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
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 36,
    paddingBottom: 28,
  },
  headerBlock: {
    alignItems: "center",
    marginBottom: 24,
  },
  badgeIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: "#EFF6FF",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#DBEAFE",
  },
  title: {
    fontSize: 20,
    fontWeight: "800",
    color: "#0F172A",
    marginBottom: 6,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 13,
    color: "#64748B",
    textAlign: "center",
    lineHeight: 18,
    paddingHorizontal: 10,
  },
  cardGroup: {
    gap: 10,
    marginBottom: 18,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  cardInfo: {
    flex: 1,
    paddingRight: 8,
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 2,
  },
  cardDesc: {
    fontSize: 11,
    color: "#64748B",
    lineHeight: 15,
  },
  pillGranted: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#F0FDF4",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#DCFCE7",
  },
  pillGrantedText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#16A34A",
  },
  pillAction: {
    backgroundColor: Colors.themes.provider.primary,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 12,
    minWidth: 64,
    alignItems: "center",
    justifyContent: "center",
  },
  pillActionText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  privacyNote: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255, 255, 255, 0.7)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#F1F5F9",
    marginBottom: 24,
  },
  privacyText: {
    fontSize: 11,
    color: "#64748B",
    flex: 1,
    lineHeight: 14,
  },
  footer: {
    gap: 12,
    alignItems: "center",
  },
  primaryBtn: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  primaryBtnDefault: {
    backgroundColor: Colors.themes.provider.primary,
  },
  primaryBtnSuccess: {
    backgroundColor: "#16A34A",
  },
  primaryBtnText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  settingsLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingVertical: 6,
  },
  settingsLinkText: {
    fontSize: 12,
    color: "#64748B",
    fontWeight: "600",
  },
});
