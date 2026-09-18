import Colors from "@/constants/Colors";
import { BorderRadius, Shadows, Spacing, Typography } from "@/constants/Styles";
import { Ionicons } from "@expo/vector-icons";
import Constants, { ExecutionEnvironment } from "expo-constants";
import * as Location from "expo-location";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Linking,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface VendorLocationGateModalProps {
  onPermissionGranted?: () => void;
}

const isDevOrExpoGo =
  __DEV__ ||
  Constants.executionEnvironment === ExecutionEnvironment.StoreClient ||
  (Constants as any).appOwnership === "expo";

export default function VendorLocationGateModal({
  onPermissionGranted,
}: VendorLocationGateModalProps) {
  const [fgGranted, setFgGranted] = useState<boolean | null>(null);
  const [bgGranted, setBgGranted] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);

  const checkPermissions = useCallback(async () => {
    // In dev / Expo Go, background location and draw over other apps are not supported
    if (isDevOrExpoGo) {
      return;
    }
    try {
      const fg = await Location.getForegroundPermissionsAsync();
      const bg = await Location.getBackgroundPermissionsAsync();

      setFgGranted(fg.granted);
      setBgGranted(bg.granted);

      if (fg.granted && bg.granted) {
        if (onPermissionGranted) onPermissionGranted();
      }
    } catch (e) {
      console.warn("[VendorLocationGate] Check error:", e);
    }
  }, [onPermissionGranted]);

  useEffect(() => {
    checkPermissions();
  }, [checkPermissions]);

  const handleRequestPermissions = async () => {
    setLoading(true);
    try {
      const { status: fgStatus } = await Location.requestForegroundPermissionsAsync();
      let bgStatus = "denied";

      if (fgStatus === "granted") {
        setFgGranted(true);
        const { status: bgResult } = await Location.requestBackgroundPermissionsAsync();
        bgStatus = bgResult;
        setBgGranted(bgResult === "granted");
      } else {
        setFgGranted(false);
      }

      if (fgStatus === "granted" && bgStatus === "granted") {
        if (onPermissionGranted) onPermissionGranted();
      }
    } catch (e) {
      console.warn("[VendorLocationGate] Request error:", e);
    } finally {
      setLoading(false);
    }
  };

  const isGranted = fgGranted === true && bgGranted === true;

  if (isDevOrExpoGo || fgGranted === null || bgGranted === null || isGranted) {
    return null;
  }

  return (
    <Modal visible={!isGranted} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.iconCircle}>
            <Ionicons name="location" size={32} color={Colors.neutral.white} />
          </View>

          <Text style={styles.title}>Location Access Required</Text>

          <Text style={styles.subtitle}>
            To receive job assignments and provide live arrival tracking to customers, Tasker Service Providers are required to enable location access.
          </Text>

          {/* Permission Requirements Status Card */}
          <View style={styles.statusList}>
            <View style={styles.statusRow}>
              <Ionicons
                name={fgGranted ? "checkmark-circle" : "close-circle"}
                size={20}
                color={fgGranted ? "#10B981" : "#EF4444"}
              />
              <View style={{ flex: 1 }}>
                <Text style={styles.statusTitle}>Foreground Location Access</Text>
                <Text style={styles.statusSub}>Calculates route & customer ETA</Text>
              </View>
            </View>

            <View style={styles.statusRow}>
              <Ionicons
                name={bgGranted ? "checkmark-circle" : "close-circle"}
                size={20}
                color={bgGranted ? "#10B981" : "#EF4444"}
              />
              <View style={{ flex: 1 }}>
                <Text style={styles.statusTitle}>Background Location Access</Text>
                <Text style={styles.statusSub}>Tracks live arrival when app is minimized</Text>
              </View>
            </View>

            <View style={styles.statusRow}>
              <Ionicons
                name="layers-outline"
                size={20}
                color={Colors.themes.provider.primary}
              />
              <View style={{ flex: 1 }}>
                <Text style={styles.statusTitle}>Display Over Other Apps</Text>
                <Text style={styles.statusSub}>Shows floating navigation alerts over WhatsApp & Maps</Text>
              </View>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.grantBtn}
              onPress={handleRequestPermissions}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color={Colors.neutral.white} size="small" />
              ) : (
                <>
                  <Ionicons name="shield-checkmark" size={18} color={Colors.neutral.white} />
                  <Text style={styles.grantBtnText}>Allow Location Access</Text>
                </>
              )}
            </TouchableOpacity>

            {(!fgGranted || !bgGranted) && (
              <TouchableOpacity
                style={styles.settingsBtn}
                onPress={() => Linking.openSettings()}
                activeOpacity={0.8}
              >
                <Ionicons name="settings-outline" size={16} color={Colors.themes.provider.primary} />
                <Text style={styles.settingsBtnText}>Open Device Settings</Text>
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
    backgroundColor: "rgba(15, 23, 42, 0.75)",
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
    fontSize: Typography.sizes.sm,
    color: Colors.text.secondary,
    textAlign: "center",
    lineHeight: 20,
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
    paddingVertical: 14,
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
    paddingVertical: 10,
    borderRadius: BorderRadius.md,
    gap: 6,
  },
  settingsBtnText: {
    fontSize: Typography.sizes.xs,
    fontWeight: "700",
    color: Colors.themes.provider.primary,
  },
});
