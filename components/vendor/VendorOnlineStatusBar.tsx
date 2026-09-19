import Colors from "@/constants/Colors";
import { BorderRadius, Shadows, Spacing } from "@/constants/Styles";
import { useSession } from "@/context/ctx";
import {
  VENDOR_ONLINE_STATUS_URL,
  VENDOR_TOGGLE_ONLINE_STATUS_URL,
} from "@/lib/api-endpoints";
import myAxios from "@/lib/axios.config";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Image,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Toast from "react-native-toast-message";
import DailySelfieModal from "./DailySelfieModal";

interface VendorOnlineStatusBarProps {
  onStatusChanged?: (isOnline: boolean) => void;
}

export default function VendorOnlineStatusBar({
  onStatusChanged,
}: VendorOnlineStatusBarProps) {
  const { session, refetchUser } = useSession();
  const mode = session.appMode || "vendor";
  const currentUser: any =
    mode === "vendor_staff" ? session.vendorStaffUser : session.vendorUser;

  const [isOnline, setIsOnline] = useState<boolean>(false);
  const [isVerified, setIsVerified] = useState<boolean>(false);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(0);
  const [activeAvatar, setActiveAvatar] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [showSelfieModal, setShowSelfieModal] = useState<boolean>(false);

  // Animated pulse for online indicator beacon
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    let loopAnim: Animated.CompositeAnimation | null = null;
    if (isOnline) {
      loopAnim = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.35,
            duration: 900,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 900,
            useNativeDriver: true,
          }),
        ])
      );
      loopAnim.start();
    } else {
      pulseAnim.setValue(1);
    }
    return () => {
      loopAnim?.stop();
    };
  }, [isOnline, pulseAnim]);

  // Fetch status on mount
  const fetchStatus = useCallback(async () => {
    try {
      const endpoint = VENDOR_ONLINE_STATUS_URL(mode);
      const res = await myAxios.get(endpoint);
      if (res.data?.status === "success") {
        const data = res.data.data;
        setIsOnline(Boolean(data.is_online));
        setIsVerified(Boolean(data.is_verified));
        setSecondsRemaining(Number(data.seconds_remaining ?? 0));
        if (data.active_avatar_url) {
          setActiveAvatar(data.active_avatar_url);
        }
      }
    } catch (err) {
      console.warn("[VendorOnlineStatusBar] Failed to fetch status:", err);
    }
  }, [mode]);

  useEffect(() => {
    fetchStatus();
    // Refresh status check every 60 seconds
    const timer = setInterval(() => {
      fetchStatus();
    }, 60000);
    return () => clearInterval(timer);
  }, [fetchStatus]);

  // Local seconds countdown
  useEffect(() => {
    if (secondsRemaining <= 0 || !isOnline) return;
    const interval = setInterval(() => {
      setSecondsRemaining((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [secondsRemaining, isOnline]);

  // Format seconds to remaining hours and minutes
  const formatTimeLeft = (sec: number) => {
    if (sec <= 0) return "Expired";
    const hours = Math.floor(sec / 3600);
    const mins = Math.floor((sec % 3600) / 60);
    if (hours > 0) return `${hours}h ${mins}m left`;
    return `${mins}m left`;
  };

  // Toggle online / offline switch
  const handleToggle = async (targetValue: boolean) => {
    try {
      try {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } catch (_) {}

      // If switching to online without valid 24h verification, show camera modal
      if (targetValue && (!isVerified || secondsRemaining <= 0)) {
        setShowSelfieModal(true);
        return;
      }

      setLoading(true);
      const endpoint = VENDOR_TOGGLE_ONLINE_STATUS_URL(mode);
      const res = await myAxios.post(endpoint, {
        status: targetValue ? "online" : "offline",
      });

      if (res.data?.status === "success") {
        const data = res.data.data;
        setIsOnline(Boolean(data.is_online));
        setIsVerified(Boolean(data.is_verified));
        setSecondsRemaining(Number(data.seconds_remaining ?? 0));
        if (data.active_avatar_url) {
          setActiveAvatar(data.active_avatar_url);
        }

        try {
          await refetchUser(mode);
        } catch (_) {}

        Toast.show({
          type: "success",
          text1: targetValue ? "🟢 You are Online" : "⚪ You are Offline",
          text2: targetValue
            ? "Ready to receive dispatches and complaints."
            : "Off-duty. You will not receive new assignments.",
        });

        onStatusChanged?.(Boolean(data.is_online));
      }
    } catch (err: any) {
      if (err?.response?.data?.requires_daily_selfie) {
        setShowSelfieModal(true);
      } else {
        const msg =
          err?.response?.data?.message || "Failed to update online status.";
        Toast.show({ type: "error", text1: "Status Error", text2: msg });
      }
    } finally {
      setLoading(false);
    }
  };

  // Avatar resolution: daily selfie -> user profile_image -> initials fallback
  const resolvedAvatar =
    activeAvatar ||
    currentUser?.active_avatar_url ||
    currentUser?.profile_image ||
    currentUser?.image ||
    null;

  const initialLetter = (
    currentUser?.name?.charAt(0) ||
    currentUser?.first_name?.charAt(0) ||
    "P"
  ).toUpperCase();

  return (
    <>
      <View style={[styles.container, isOnline ? styles.onlineCard : styles.offlineCard]}>
        <View style={styles.contentRow}>
          {/* Avatar with Status Ring */}
          <View style={styles.avatarWrap}>
            {resolvedAvatar ? (
              <Image
                source={{
                  uri:
                    resolvedAvatar.startsWith("http")
                      ? resolvedAvatar
                      : resolvedAvatar.startsWith("/")
                      ? resolvedAvatar
                      : `/${resolvedAvatar}`,
                }}
                style={styles.avatarImg}
              />
            ) : (
              <View
                style={[
                  styles.avatarFallback,
                  { backgroundColor: isOnline ? "#059669" : "#6B7280" },
                ]}
              >
                <Text style={styles.avatarFallbackText}>{initialLetter}</Text>
              </View>
            )}

            {/* Online/Offline Badge Indicator */}
            <View
              style={[
                styles.beaconDot,
                { backgroundColor: isOnline ? "#10B981" : "#9CA3AF" },
              ]}
            />
          </View>

          {/* Status Text & Countdown */}
          <View style={styles.infoCol}>
            <View style={styles.statusTitleRow}>
              <Animated.View
                style={[
                  styles.pulseBeacon,
                  isOnline ? styles.pulseBeaconOnline : styles.pulseBeaconOffline,
                  { transform: [{ scale: pulseAnim }] },
                ]}
              />
              <Text
                style={[
                  styles.statusTitle,
                  { color: isOnline ? "#065F46" : "#374151" },
                ]}
              >
                {isOnline ? "YOU ARE ONLINE" : "YOU ARE OFFLINE"}
              </Text>
            </View>

            <Text style={styles.statusSubtitle} numberOfLines={1}>
              {isOnline
                ? "Active on job • Accepting dispatches"
                : "Switch online to receive assigned jobs"}
            </Text>

            {/* 24-Hour Timer Chip if verified */}
            {isVerified && secondsRemaining > 0 && isOnline && (
              <View style={styles.timerChip}>
                <Ionicons name="time" size={11} color="#047857" />
                <Text style={styles.timerChipText}>
                  Selfie valid • {formatTimeLeft(secondsRemaining)}
                </Text>
              </View>
            )}
          </View>

          {/* Uber-style Switch / Toggle */}
          <View style={styles.actionCol}>
            {loading ? (
              <ActivityIndicator
                size="small"
                color={Colors.themes.provider.primary}
              />
            ) : (
              <Switch
                value={isOnline}
                onValueChange={(val) => handleToggle(val)}
                trackColor={{ false: "#D1D5DB", true: "#10B981" }}
                thumbColor="#FFFFFF"
                ios_backgroundColor="#D1D5DB"
              />
            )}
          </View>
        </View>

        {/* Quick action bar inside card */}
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={styles.retakeAction}
            onPress={() => setShowSelfieModal(true)}
            activeOpacity={0.7}
          >
            <Ionicons
              name="camera"
              size={13}
              color={isOnline ? "#047857" : "#4B5563"}
            />
            <Text
              style={[
                styles.retakeActionText,
                { color: isOnline ? "#047857" : "#4B5563" },
              ]}
            >
              {isVerified ? "Update Daily Selfie" : "Take Selfie to Go Online"}
            </Text>
          </TouchableOpacity>

          <View style={styles.verifiedDotWrap}>
            <Ionicons
              name={isVerified ? "shield-checkmark" : "shield-outline"}
              size={13}
              color={isVerified ? "#10B981" : "#9CA3AF"}
            />
            <Text style={styles.verifiedLabel}>
              {isVerified ? "24h Verified" : "Selfie Required"}
            </Text>
          </View>
        </View>
      </View>

      {/* Daily Selfie Capture Modal */}
      <DailySelfieModal
        visible={showSelfieModal}
        onClose={() => setShowSelfieModal(false)}
        onSuccess={(data) => {
          setIsOnline(Boolean(data.is_online));
          setIsVerified(Boolean(data.is_verified));
          setSecondsRemaining(Number(data.seconds_remaining ?? 86400));
          if (data.active_avatar_url) {
            setActiveAvatar(data.active_avatar_url);
          }
          onStatusChanged?.(true);
        }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.sm,
    marginBottom: Spacing.md,
    borderWidth: 1.5,
    ...Shadows.sm,
  },
  onlineCard: {
    backgroundColor: "#F0FDF4",
    borderColor: "#A7F3D0",
  },
  offlineCard: {
    backgroundColor: "#F9FAFB",
    borderColor: "#E5E7EB",
  },
  contentRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatarWrap: {
    position: "relative",
    marginRight: Spacing.md,
  },
  avatarImg: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: "#10B981",
  },
  avatarFallback: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarFallbackText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
  },
  beaconDot: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 13,
    height: 13,
    borderRadius: 6.5,
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  infoCol: {
    flex: 1,
    justifyContent: "center",
  },
  statusTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 2,
  },
  pulseBeacon: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  pulseBeaconOnline: {
    backgroundColor: "#10B981",
  },
  pulseBeaconOffline: {
    backgroundColor: "#9CA3AF",
  },
  statusTitle: {
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  statusSubtitle: {
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "500",
  },
  timerChip: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#D1FAE5",
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
    marginTop: 4,
  },
  timerChipText: {
    color: "#047857",
    fontSize: 10,
    fontWeight: "700",
  },
  actionCol: {
    paddingLeft: Spacing.sm,
    justifyContent: "center",
    alignItems: "center",
  },
  bottomBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "rgba(0, 0, 0, 0.06)",
    marginTop: Spacing.sm,
    paddingTop: Spacing.xs,
  },
  retakeAction: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 2,
  },
  retakeActionText: {
    fontSize: 11,
    fontWeight: "600",
  },
  verifiedDotWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  verifiedLabel: {
    fontSize: 11,
    color: "#6B7280",
    fontWeight: "500",
  },
});
