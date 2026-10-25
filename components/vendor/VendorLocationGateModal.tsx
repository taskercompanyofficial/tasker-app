import AppText from "@/components/common/AppText";
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
  TouchableOpacity,
  View,
} from "react-native";
import {
  checkVendorOnlineReadiness,
  requestVendorBatteryOptimizationIgnore,
  VendorPermissionsCheck,
} from "@/lib/vendorBackgroundLocation";
import { requestSystemOverlayPermission } from "@/lib/floatingBubble";

interface VendorLocationGateModalProps {
  visible?: boolean;
  onClose?: () => void;
  onPermissionGranted?: () => void;
  onAllGranted?: () => void;
}

const isExpoGo =
  Constants.executionEnvironment === ExecutionEnvironment.StoreClient ||
  (Constants as any).appOwnership === "expo";

export default function VendorLocationGateModal({
  visible = true,
  onClose,
  onPermissionGranted,
  onAllGranted,
}: VendorLocationGateModalProps) {
  const [perms, setPerms] = useState<VendorPermissionsCheck>({
    hasForeground: false,
    hasBackground: false,
    hasOverlay: false,
    isReady: false,
  });
  const [loading, setLoading] = useState(false);

  const checkStatus = useCallback(async () => {
    if (isExpoGo) {
      onAllGranted?.();
      onPermissionGranted?.();
      return;
    }

    try {
      const res = await checkVendorOnlineReadiness();
      setPerms(res);
      if (res.isReady) {
        onAllGranted?.();
        onPermissionGranted?.();
      }
    } catch (e) {
      console.warn("[VendorLocationGateModal] Check error:", e);
    }
  }, [onAllGranted, onPermissionGranted]);

  useEffect(() => {
    if (visible) {
      checkStatus();
    }

    const sub = AppState.addEventListener("change", (nextState) => {
      if (nextState === "active" && visible) {
        checkStatus();
      }
    });

    return () => {
      sub.remove();
    };
  }, [visible, checkStatus]);

  const handleFixLocation = async () => {
    setLoading(true);
    try {
      if (!perms.hasForeground) {
        const fg = await Location.requestForegroundPermissionsAsync();
        if (fg.status !== "granted") {
          await Linking.openSettings();
        }
      }
    } catch (e) {
      console.warn("[VendorLocationGateModal] Location error:", e);
    } finally {
      setLoading(false);
      await checkStatus();
    }
  };

  const handleFixBattery = async () => {
    await requestVendorBatteryOptimizationIgnore();
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.backdrop}>
        <View style={styles.sheetCard}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.shieldBadge}>
              <Ionicons name="shield-checkmark" size={30} color={Colors.themes.provider.primary} />
            </View>
            <AppText style={styles.title}>Required to Go Online</AppText>
            <AppText style={styles.subtitle}>
              Customers and dispatch require active real-time tracking while you are on-duty.
            </AppText>
          </View>

          {/* Checklist */}
          <View style={styles.checklist}>
            {/* 1. Location Permission */}
            <View style={styles.itemRow}>
              <View
                style={[
                  styles.iconCircle,
                  {
                    backgroundColor: perms.hasForeground ? "#ECFDF5" : "#FEF3C7",
                  },
                ]}
              >
                <Ionicons
                  name="location"
                  size={20}
                  color={perms.hasForeground ? "#10B981" : "#D97706"}
                />
              </View>
              <View style={styles.itemContent}>
                <AppText style={styles.itemTitle}>Location: "While Using App"</AppText>
                <AppText style={styles.itemDesc}>
                  Enables real-time navigation and job dispatch while using Tasker.
                </AppText>
              </View>
              {perms.hasForeground ? (
                <Ionicons name="checkmark-circle" size={24} color="#10B981" />
              ) : (
                <TouchableOpacity
                  style={styles.enableBtn}
                  onPress={handleFixLocation}
                  disabled={loading}
                  activeOpacity={0.8}
                >
                  <AppText style={styles.enableBtnText}>Enable</AppText>
                </TouchableOpacity>
              )}
            </View>

            {/* 2. Battery Optimization (Android) */}
            {Platform.OS === "android" && (
              <View style={[styles.itemRow, { borderBottomWidth: 0 }]}>
                <View style={[styles.iconCircle, { backgroundColor: "#F3F4F6" }]}>
                  <Ionicons name="battery-charging-outline" size={20} color="#4B5563" />
                </View>
                <View style={styles.itemContent}>
                  <AppText style={styles.itemTitle}>Battery Optimization (Recommended)</AppText>
                  <AppText style={styles.itemDesc}>
                    Set Tasker to Unrestricted so Android doesn't stop location in sleep.
                  </AppText>
                </View>
                <TouchableOpacity
                  style={[styles.enableBtn, { backgroundColor: "#4B5563" }]}
                  onPress={handleFixBattery}
                  activeOpacity={0.8}
                >
                  <AppText style={styles.enableBtnText}>Setup</AppText>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Action Buttons */}
          <TouchableOpacity
            style={[
              styles.primaryBtn,
              { backgroundColor: perms.isReady ? Colors.themes.provider.primary : "#111827" },
            ]}
            onPress={checkStatus}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <AppText style={styles.primaryBtnText}>
                {perms.isReady ? "Go Online Now 🟢" : "Check Permissions Again"}
              </AppText>
            )}
          </TouchableOpacity>

          {onClose && (
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose} activeOpacity={0.7}>
              <AppText style={styles.cancelBtnText}>Stay Offline for Now</AppText>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.65)",
    justifyContent: "flex-end",
  },
  sheetCard: {
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    paddingBottom: Platform.OS === "ios" ? 40 : 28,
    ...Shadows.lg,
  },
  header: {
    alignItems: "center",
    marginBottom: 20,
  },
  shieldBadge: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "rgba(16, 185, 129, 0.12)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  title: {
    fontSize: 19,
    fontWeight: "800",
    color: "#111827",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 13,
    color: "#6B7280",
    textAlign: "center",
    marginTop: 6,
    lineHeight: 18,
    paddingHorizontal: 12,
  },
  checklist: {
    backgroundColor: "#F9FAFB",
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 4,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: "center",
    alignItems: "center",
  },
  itemContent: {
    flex: 1,
    marginHorizontal: 12,
  },
  itemTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1F2937",
  },
  itemDesc: {
    fontSize: 11,
    color: "#6B7280",
    marginTop: 2,
    lineHeight: 15,
  },
  enableBtn: {
    backgroundColor: "#10B981",
    paddingHorizontal: 13,
    paddingVertical: 6,
    borderRadius: 8,
  },
  enableBtnText: {
    color: "#ffffff",
    fontWeight: "700",
    fontSize: 12,
  },
  primaryBtn: {
    paddingVertical: 15,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  primaryBtnText: {
    color: "#ffffff",
    fontWeight: "700",
    fontSize: 15,
  },
  cancelBtn: {
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 6,
  },
  cancelBtnText: {
    color: "#6B7280",
    fontWeight: "600",
    fontSize: 13,
  },
});
