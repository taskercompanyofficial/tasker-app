import Colors from "@/constants/Colors";
import { BorderRadius, Shadows, Spacing, Typography } from "@/constants/Styles";
import { Ionicons } from "@expo/vector-icons";
import Constants, { ExecutionEnvironment } from "expo-constants";
import * as Location from "expo-location";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  AppState,
  Linking,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { requestVendorOverlayPermission } from "@/lib/vendorBackgroundLocation";

interface VendorLocationGateModalProps {
  onPermissionGranted?: () => void;
}

// Only true Expo Go sandbox environment lacks background location / overlay capabilities
const isExpoGo =
  Constants.executionEnvironment === ExecutionEnvironment.StoreClient ||
  (Constants as any).appOwnership === "expo";

const OVERLAY_ACK_KEY = "@vendor_overlay_acknowledged";

export default function VendorLocationGateModal({
  onPermissionGranted,
}: VendorLocationGateModalProps) {
  const [fgGranted, setFgGranted] = useState<boolean | null>(null);
  const [bgGranted, setBgGranted] = useState<boolean | null>(null);
  const [overlayGranted, setOverlayGranted] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  const checkPermissions = useCallback(async () => {
    if (isExpoGo) {
      return;
    }
    try {
      const fg = await Location.getForegroundPermissionsAsync();
      const bg = await Location.getBackgroundPermissionsAsync();

      setFgGranted(fg.granted);
      setBgGranted(bg.granted);

      if (Platform.OS === "android") {
        const overlayAck = await AsyncStorage.getItem(OVERLAY_ACK_KEY);
        setOverlayGranted(overlayAck === "true");
      } else {
        setOverlayGranted(true);
      }

      if (fg.granted && bg.granted) {
        if (onPermissionGranted) onPermissionGranted();
      }
    } catch (e) {
      console.warn("[VendorLocationGate] Check error:", e);
    }
  }, [onPermissionGranted]);

  // Check on mount and every time vendor returns from device Settings
  useEffect(() => {
    checkPermissions();

    const sub = AppState.addEventListener("change", (nextState) => {
      if (nextState === "active") {
        checkPermissions();
      }
    });

    return () => {
      sub.remove();
    };
  }, [checkPermissions]);

  const handleRequestLocation = async () => {
    setLoading(true);
    try {
      // Step 1: Request Foreground location first (Android 11+ requirement)
      const { status: fgStatus } = await Location.requestForegroundPermissionsAsync();
      setFgGranted(fgStatus === "granted");

      if (fgStatus === "granted") {
        // Step 2: Request Background location ("Allow all the time")
        const { status: bgStatus } = await Location.requestBackgroundPermissionsAsync();
        setBgGranted(bgStatus === "granted");

        // If background location requires manual settings toggle on Android 11+
        if (bgStatus !== "granted") {
          await Linking.openSettings().catch(() => {});
        }
      }
    } catch (e) {
      console.warn("[VendorLocationGate] Request error:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestOverlay = async () => {
    setLoading(true);
    try {
      await AsyncStorage.setItem(OVERLAY_ACK_KEY, "true");
      setOverlayGranted(true);
      await requestVendorOverlayPermission();
    } catch (e) {
      console.warn("[VendorLocationGate] Overlay error:", e);
    } finally {
      setLoading(false);
    }
  };

  const isLocationGranted = fgGranted === true && bgGranted === true;
  const isAllGranted = isLocationGranted && (Platform.OS !== "android" || overlayGranted === true);

  // If in Expo Go sandbox, still checking, or permissions granted / dismissed, don't block
  if (isExpoGo || fgGranted === null || bgGranted === null || (isAllGranted && !loading) || dismissed) {
    return null;
  }

  return (
    <Modal visible={!dismissed} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.iconCircle}>
            <Ionicons name="location" size={32} color={Colors.neutral.white} />
          </View>

          <Text style={styles.title}>Provider Permissions Required</Text>

          <Text style={styles.subtitle}>
            To assign orders, track live arrival for customers, and display job alerts when minimized, Tasker requires the following permissions:
          </Text>

          {/* Permission Requirements Status Card */}
          <View style={styles.statusList}>
            {/* 1. Foreground Location */}
            <View style={styles.statusRow}>
              <Ionicons
                name={fgGranted ? "checkmark-circle" : "close-circle"}
                size={20}
                color={fgGranted ? "#10B981" : "#EF4444"}
              />
              <View style={{ flex: 1 }}>
                <Text style={styles.statusTitle}>1. Foreground Location Access</Text>
                <Text style={styles.statusSub}>Calculates route & customer ETA while app is open</Text>
              </View>
            </View>

            {/* 2. Background Location */}
            <View style={styles.statusRow}>
              <Ionicons
                name={bgGranted ? "checkmark-circle" : "close-circle"}
                size={20}
                color={bgGranted ? "#10B981" : "#EF4444"}
              />
              <View style={{ flex: 1 }}>
                <Text style={styles.statusTitle}>2. Background Location Access ("Allow all the time")</Text>
                <Text style={styles.statusSub}>
                  {bgGranted
                    ? "Active: live arrival updates send while phone is locked"
                    : "Select 'Allow all the time' in device location settings"}
                </Text>
              </View>
            </View>

            {/* 3. Display Over Other Apps (Android) */}
            {Platform.OS === "android" && (
              <View style={styles.statusRow}>
                <Ionicons
                  name={overlayGranted ? "checkmark-circle" : "layers-outline"}
                  size={20}
                  color={overlayGranted ? "#10B981" : Colors.themes.provider.primary}
                />
                <View style={{ flex: 1 }}>
                  <Text style={styles.statusTitle}>3. Display Over Other Apps</Text>
                  <Text style={styles.statusSub}>
                    {overlayGranted
                      ? "Configured: floating job alerts appear over WhatsApp & Maps"
                      : "Required on Android to show navigation bubbles over other apps"}
                  </Text>
                </View>
              </View>
            )}
          </View>

          {/* Action Buttons */}
          <View style={styles.actions}>
            {/* Action 1: Grant Location */}
            {!isLocationGranted && (
              <TouchableOpacity
                style={styles.grantBtn}
                onPress={handleRequestLocation}
                disabled={loading}
                activeOpacity={0.8}
              >
                {loading ? (
                  <ActivityIndicator color={Colors.neutral.white} size="small" />
                ) : (
                  <>
                    <Ionicons name="shield-checkmark" size={18} color={Colors.neutral.white} />
                    <Text style={styles.grantBtnText}>
                      {!fgGranted ? "1. Allow Location Access" : "2. Allow Background ('All The Time')"}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            )}

            {/* Action 2: Grant Display Over Other Apps (Android) */}
            {Platform.OS === "android" && !overlayGranted && (
              <TouchableOpacity
                style={[styles.grantBtn, { backgroundColor: "#0284C7" }]}
                onPress={handleRequestOverlay}
                disabled={loading}
                activeOpacity={0.8}
              >
                <Ionicons name="layers" size={18} color={Colors.neutral.white} />
                <Text style={styles.grantBtnText}>
                  3. Allow Display Over Other Apps
                </Text>
              </TouchableOpacity>
            )}

            {/* Settings Link */}
            <TouchableOpacity
              style={styles.settingsBtn}
              onPress={() => Linking.openSettings()}
              activeOpacity={0.8}
            >
              <Ionicons name="settings-outline" size={16} color={Colors.themes.provider.primary} />
              <Text style={styles.settingsBtnText}>Open Device Settings</Text>
            </TouchableOpacity>

            {/* Dismiss / Continue if at least location is granted */}
            {fgGranted && (
              <TouchableOpacity
                style={styles.dismissBtn}
                onPress={() => {
                  setDismissed(true);
                  if (onPermissionGranted) onPermissionGranted();
                }}
                activeOpacity={0.8}
              >
                <Text style={styles.dismissBtnText}>Continue to Dashboard</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.8)",
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.lg,
  },
  card: {
    width: "100%",
    backgroundColor: Colors.neutral.white,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    alignItems: "center",
    gap: Spacing.md,
    ...Shadows.lg,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.themes.provider.primary,
    alignItems: "center",
    justifyContent: "center",
    ...Shadows.md,
  },
  title: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.bold,
    color: Colors.text.primary,
    textAlign: "center",
  },
  subtitle: {
    fontSize: Typography.sizes.xs,
    color: Colors.text.secondary,
    textAlign: "center",
    lineHeight: 18,
  },
  statusList: {
    width: "100%",
    backgroundColor: Colors.background.secondary,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border.light,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  statusTitle: {
    fontSize: Typography.sizes.xs,
    fontWeight: "700",
    color: Colors.text.primary,
  },
  statusSub: {
    fontSize: 10,
    color: Colors.text.secondary,
    lineHeight: 14,
  },
  actions: {
    width: "100%",
    gap: Spacing.xs,
    marginTop: Spacing.xs,
  },
  grantBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.themes.provider.primary,
    paddingVertical: 13,
    borderRadius: BorderRadius.md,
    gap: 8,
    ...Shadows.sm,
  },
  grantBtnText: {
    fontSize: Typography.sizes.sm,
    fontWeight: "700",
    color: Colors.neutral.white,
  },
  settingsBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 9,
    borderRadius: BorderRadius.md,
    gap: 6,
  },
  settingsBtnText: {
    fontSize: Typography.sizes.xs,
    fontWeight: "700",
    color: Colors.themes.provider.primary,
  },
  dismissBtn: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
  },
  dismissBtnText: {
    fontSize: Typography.sizes.xs,
    color: "#64748B",
    fontWeight: "600",
  },
});
