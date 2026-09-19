import Colors from "@/constants/Colors";
import { BorderRadius, Shadows, Spacing } from "@/constants/Styles";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useEffect, useRef } from "react";
import {
  Animated,
  Dimensions,
  Image,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

interface IncomingCallModalProps {
  visible: boolean;
  callerName: string;
  callerAvatar?: string | null;
  workOrderNumber?: string | null;
  onAccept: () => void;
  onReject: () => void;
}

export default function IncomingCallModal({
  visible,
  callerName,
  callerAvatar,
  workOrderNumber,
  onAccept,
  onReject,
}: IncomingCallModalProps) {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Ringing pulse animation
  useEffect(() => {
    let loopAnim: Animated.CompositeAnimation | null = null;
    if (visible) {
      loopAnim = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.25,
            duration: 700,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 700,
            useNativeDriver: true,
          }),
        ])
      );
      loopAnim.start();

      // Trigger continuous haptic buzz
      const hapticInterval = setInterval(() => {
        try {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        } catch (_) {}
      }, 1500);

      return () => {
        loopAnim?.stop();
        clearInterval(hapticInterval);
      };
    } else {
      pulseAnim.setValue(1);
    }
  }, [visible, pulseAnim]);

  if (!visible) return null;

  const initialLetter = callerName?.charAt(0)?.toUpperCase() || "T";
  const avatarUri = callerAvatar
    ? callerAvatar.startsWith("http")
      ? callerAvatar
      : `/${callerAvatar}`
    : null;

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.backdrop}>
        <SafeAreaView style={styles.container}>
          {/* Header Info */}
          <View style={styles.header}>
            <View style={styles.badgeRow}>
              <Ionicons name="call" size={14} color="#10B981" />
              <Text style={styles.badgeText}>IN-APP AUDIO CALL</Text>
            </View>
            <Text style={styles.subHeader}>
              {workOrderNumber ? `Work Order #${workOrderNumber}` : "Live VoIP Call"}
            </Text>
          </View>

          {/* Center Avatar & Caller Details */}
          <View style={styles.centerSection}>
            <View style={styles.avatarContainer}>
              <Animated.View
                style={[
                  styles.pulseRing,
                  { transform: [{ scale: pulseAnim }] },
                ]}
              />
              {avatarUri ? (
                <Image source={{ uri: avatarUri }} style={styles.avatar} />
              ) : (
                <View style={styles.fallbackAvatar}>
                  <Text style={styles.fallbackText}>{initialLetter}</Text>
                </View>
              )}
            </View>

            <Text style={styles.callerName} numberOfLines={1}>
              {callerName}
            </Text>
            <Text style={styles.ringingStatus}>Ringing...</Text>
          </View>

          {/* Action Buttons: Accept & Decline */}
          <View style={styles.actionsRow}>
            {/* Decline Button */}
            <View style={styles.actionItem}>
              <TouchableOpacity
                style={styles.declineBtn}
                onPress={() => {
                  try {
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
                  } catch (_) {}
                  onReject();
                }}
                activeOpacity={0.8}
              >
                <Ionicons name="call" size={28} color="#fff" style={{ transform: [{ rotate: "135deg" }] }} />
              </TouchableOpacity>
              <Text style={styles.btnLabel}>Decline</Text>
            </View>

            {/* Accept Button */}
            <View style={styles.actionItem}>
              <TouchableOpacity
                style={styles.acceptBtn}
                onPress={() => {
                  try {
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                  } catch (_) {}
                  onAccept();
                }}
                activeOpacity={0.8}
              >
                <Ionicons name="call" size={28} color="#fff" />
              </TouchableOpacity>
              <Text style={styles.btnLabel}>Accept</Text>
            </View>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(10, 15, 29, 0.96)",
  },
  container: {
    flex: 1,
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.lg,
  },
  header: {
    alignItems: "center",
    marginTop: Spacing.md,
  },
  badgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(16, 185, 129, 0.15)",
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(16, 185, 129, 0.4)",
    marginBottom: 6,
  },
  badgeText: {
    color: "#10B981",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.8,
  },
  subHeader: {
    color: "#9CA3AF",
    fontSize: 14,
    fontWeight: "500",
  },
  centerSection: {
    alignItems: "center",
  },
  avatarContainer: {
    position: "relative",
    width: 130,
    height: 130,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  pulseRing: {
    position: "absolute",
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: "rgba(16, 185, 129, 0.25)",
  },
  avatar: {
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 3,
    borderColor: "#10B981",
  },
  fallbackAvatar: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: "#2563EB",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "#10B981",
  },
  fallbackText: {
    color: "#fff",
    fontSize: 44,
    fontWeight: "800",
  },
  callerName: {
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "800",
    textAlign: "center",
    maxWidth: SCREEN_WIDTH * 0.8,
    marginBottom: 6,
  },
  ringingStatus: {
    color: "#10B981",
    fontSize: 15,
    fontWeight: "600",
  },
  actionsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
    maxWidth: 320,
    marginBottom: Spacing.xl,
  },
  actionItem: {
    alignItems: "center",
    gap: 8,
  },
  declineBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#EF4444",
    justifyContent: "center",
    alignItems: "center",
    ...Shadows.md,
  },
  acceptBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#10B981",
    justifyContent: "center",
    alignItems: "center",
    ...Shadows.md,
  },
  btnLabel: {
    color: "#E5E7EB",
    fontSize: 13,
    fontWeight: "600",
  },
});
