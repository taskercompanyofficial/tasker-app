import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  AppState,
  BackHandler,
  Image,
  Linking,
  Modal,
  Platform,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import * as Application from "expo-application";
import Constants from "expo-constants";
import { Ionicons } from "@expo/vector-icons";
import AppText from "@/components/common/AppText";
import Colors from "@/constants/Colors";
import { APP_VERSION_CHECK_URL } from "@/lib/api-endpoints";

/**
 * Semantic version comparator. Returns true if installed < required.
 */
export function isVersionBelow(installed: string, required: string): boolean {
  if (!installed || !required) return false;
  const v1 = installed.replace(/[^0-9.]/g, "").split(".").map((n) => parseInt(n, 10) || 0);
  const v2 = required.replace(/[^0-9.]/g, "").split(".").map((n) => parseInt(n, 10) || 0);
  const len = Math.max(v1.length, v2.length);
  for (let i = 0; i < len; i++) {
    const a = v1[i] ?? 0;
    const b = v2[i] ?? 0;
    if (a < b) return true;
    if (a > b) return false;
  }
  return false;
}

interface VersionCheckData {
  latest_version: string;
  min_supported_version: string;
  force_update_enabled: boolean;
  is_outdated: boolean;
  is_force_update: boolean;
  title: string;
  message: string;
  play_store_url: string;
  play_store_web_url: string;
  app_store_url: string;
  release_notes: string;
}

export default function ForceUpdateManager() {
  const [data, setData] = useState<VersionCheckData | null>(null);
  const [mustForceUpdate, setMustForceUpdate] = useState(false);
  const [showOptionalUpdate, setShowOptionalUpdate] = useState(false);
  const lastCheckTimeRef = useRef(0);

  const installedVersion =
    Application.nativeApplicationVersion ||
    Constants.expoConfig?.version ||
    "1.0.36";

  const buildNumber =
    Application.nativeBuildVersion ||
    Constants.expoConfig?.android?.versionCode?.toString() ||
    "40";

  const checkVersion = useCallback(async () => {
    try {
      const url = `${APP_VERSION_CHECK_URL}?platform=${Platform.OS}&current_version=${encodeURIComponent(
        installedVersion
      )}&build_number=${encodeURIComponent(buildNumber)}`;

      const res = await fetch(url, {
        headers: { Accept: "application/json" },
      });

      const json = await res.json();
      if (json.status === "success" && json.data) {
        const payload: VersionCheckData = json.data;
        setData(payload);

        // Check if current installed version is strictly below minimum required version
        const belowMin = isVersionBelow(installedVersion, payload.min_supported_version);
        const shouldForce = payload.is_force_update || (payload.force_update_enabled && belowMin);

        if (shouldForce) {
          setMustForceUpdate(true);
          setShowOptionalUpdate(false);
        } else if (payload.is_outdated && isVersionBelow(installedVersion, payload.latest_version)) {
          // Soft update available
          setMustForceUpdate(false);
          setShowOptionalUpdate(true);
        } else {
          setMustForceUpdate(false);
          setShowOptionalUpdate(false);
        }
      }
    } catch (e) {
      // In case of network errors, avoid blocking the user
      console.log("[VersionCheck] Check error:", e);
    }
    lastCheckTimeRef.current = Date.now();
  }, [installedVersion, buildNumber]);

  useEffect(() => {
    checkVersion();

    // Re-verify version whenever the app returns from background or Play Store
    const sub = AppState.addEventListener("change", (nextState) => {
      if (nextState === "active" && Date.now() - lastCheckTimeRef.current > 30 * 1000) {
        checkVersion();
      }
    });

    return () => sub.remove();
  }, [checkVersion]);

  // Lock Android hardware back button when force-update modal is visible
  useEffect(() => {
    if (!mustForceUpdate) return;

    const onBackPress = () => {
      // Return true to prevent default back action (cannot dismiss)
      return true;
    };

    const backHandler = BackHandler.addEventListener("hardwareBackPress", onBackPress);
    return () => backHandler.remove();
  }, [mustForceUpdate]);

  const handleOpenStore = async () => {
    const directStoreUrl =
      Platform.OS === "android"
        ? data?.play_store_url || "market://details?id=com.taskercompany.company"
        : data?.app_store_url || "https://apps.apple.com/app/id6740058866";

    const webStoreUrl =
      Platform.OS === "android"
        ? data?.play_store_web_url ||
          "https://play.google.com/store/apps/details?id=com.taskercompany.company"
        : "https://apps.apple.com/app/id6740058866";

    try {
      const supported = await Linking.canOpenURL(directStoreUrl);
      if (supported) {
        await Linking.openURL(directStoreUrl);
      } else {
        await Linking.openURL(webStoreUrl);
      }
    } catch {
      await Linking.openURL(webStoreUrl);
    }
  };

  // 1. MANDATORY BLOCKING FORCE UPDATE MODAL (Unclosable)
  if (mustForceUpdate && data) {
    return (
      <Modal
        visible={true}
        animationType="fade"
        transparent={true}
        onRequestClose={() => {
          // Intentionally empty: prevents Android hardware back button dismiss
        }}
      >
        <View style={styles.backdrop}>
          <View style={styles.card}>
            {/* Header / Brand Icon */}
            <View style={styles.iconCircle}>
              <Ionicons name="cloud-download" size={38} color="#10B981" />
            </View>

            {/* Title */}
            <AppText style={styles.title}>{data.title || "Update Required"}</AppText>

            {/* Version Diff Pill */}
            <View style={styles.versionPill}>
              <AppText style={styles.versionPillText}>
                Installed: v{installedVersion} → Required: v{data.min_supported_version}
              </AppText>
            </View>

            {/* Message */}
            <AppText style={styles.message}>
              {data.message ||
                "A new version of Tasker Company is available on Google Play Store with critical improvements. Please update now to continue."}
            </AppText>

            {/* Release notes if available */}
            {data.release_notes ? (
              <View style={styles.releaseNotesBox}>
                <AppText style={styles.releaseNotesLabel}>What&apos;s New:</AppText>
                <AppText style={styles.releaseNotesText}>{data.release_notes}</AppText>
              </View>
            ) : null}

            {/* Primary Action Button */}
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={handleOpenStore}
              activeOpacity={0.85}
            >
              <Ionicons name="logo-google-playstore" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
              <AppText style={styles.primaryButtonText}>Update App Now</AppText>
            </TouchableOpacity>

            {/* Lock status microcopy */}
            <View style={styles.lockInfoRow}>
              <Ionicons name="lock-closed" size={13} color="#9CA3AF" />
              <AppText style={styles.lockInfoText}>
                Update required to access Tasker Company services
              </AppText>
            </View>
          </View>
        </View>
      </Modal>
    );
  }

  // 2. OPTIONAL UPDATE MODAL (Dismissible)
  if (showOptionalUpdate && data) {
    return (
      <Modal
        visible={showOptionalUpdate}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowOptionalUpdate(false)}
      >
        <View style={styles.backdrop}>
          <View style={styles.card}>
            <View style={[styles.iconCircle, { backgroundColor: "#3B82F618" }]}>
              <Ionicons name="sparkles" size={36} color="#3B82F6" />
            </View>

            <AppText style={styles.title}>Update Available</AppText>

            <View style={[styles.versionPill, { backgroundColor: "#3B82F615" }]}>
              <AppText style={[styles.versionPillText, { color: "#2563EB" }]}>
                New Version v{data.latest_version} is Available
              </AppText>
            </View>

            <AppText style={styles.message}>
              {data.release_notes || "A new update is available on Google Play with improved features."}
            </AppText>

            <TouchableOpacity
              style={[styles.primaryButton, { backgroundColor: "#3B82F6" }]}
              onPress={handleOpenStore}
              activeOpacity={0.85}
            >
              <AppText style={styles.primaryButtonText}>Update Now</AppText>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => setShowOptionalUpdate(false)}
              activeOpacity={0.7}
            >
              <AppText style={styles.secondaryButtonText}>Maybe Later</AppText>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.85)", // Solid dark backdrop
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  card: {
    width: "100%",
    maxWidth: 360,
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 24,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#10B98115",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: "800",
    color: "#0F172A",
    textAlign: "center",
    marginBottom: 8,
  },
  versionPill: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    backgroundColor: "#F59E0B18",
    marginBottom: 12,
  },
  versionPillText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#D97706",
    fontFamily: Platform.OS === "android" ? "monospace" : "Courier",
  },
  message: {
    fontSize: 13,
    color: "#475569",
    textAlign: "center",
    lineHeight: 19,
    marginBottom: 14,
  },
  releaseNotesBox: {
    width: "100%",
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 10,
    marginBottom: 16,
  },
  releaseNotesLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: "#64748B",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  releaseNotesText: {
    fontSize: 12,
    color: "#334155",
    lineHeight: 16,
  },
  primaryButton: {
    width: "100%",
    backgroundColor: "#10B981",
    borderRadius: 14,
    paddingVertical: 14,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#10B981",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
  secondaryButton: {
    width: "100%",
    paddingVertical: 10,
    alignItems: "center",
    marginTop: 6,
  },
  secondaryButtonText: {
    color: "#64748B",
    fontSize: 13,
    fontWeight: "600",
  },
  lockInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 12,
  },
  lockInfoText: {
    fontSize: 11,
    color: "#94A3B8",
    fontWeight: "500",
  },
});
