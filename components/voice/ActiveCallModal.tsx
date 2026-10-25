import AppText from "@/components/common/AppText";
import Colors from "@/constants/Colors";
import { BorderRadius, Shadows, Spacing } from "@/constants/Styles";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useEffect, useState } from "react";
import {
  Dimensions,
  Image,
  Modal,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

interface ActiveCallModalProps {
  visible: boolean;
  participantName: string;
  participantAvatar?: string | null;
  workOrderNumber?: string | null;
  statusText?: string | null;
  isMuted: boolean;
  isSpeakerOn: boolean;
  onToggleMute: () => void;
  onToggleSpeaker: () => void;
  onEndCall: () => void;
}

export default function ActiveCallModal({
  visible,
  participantName,
  participantAvatar,
  workOrderNumber,
  statusText,
  isMuted,
  isSpeakerOn,
  onToggleMute,
  onToggleSpeaker,
  onEndCall,
}: ActiveCallModalProps) {
  const [durationSecs, setDurationSecs] = useState(0);

  // Live duration timer - only increments when call is actually connected (no statusText)
  useEffect(() => {
    let timer: any = null;
    if (visible && !statusText) {
      setDurationSecs(0);
      timer = setInterval(() => {
        setDurationSecs((prev) => prev + 1);
      }, 1000);
    } else {
      setDurationSecs(0);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [visible, !statusText]);

  const formatDuration = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const remainingSecs = sec % 60;
    return `${mins < 10 ? "0" : ""}${mins}:${remainingSecs < 10 ? "0" : ""}${remainingSecs}`;
  };

  if (!visible) return null;

  const initialLetter = participantName?.charAt(0)?.toUpperCase() || "T";
  const avatarUri = participantAvatar
    ? participantAvatar.startsWith("http")
      ? participantAvatar
      : `/${participantAvatar}`
    : null;

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.backdrop}>
        <SafeAreaView style={styles.container}>
          {/* Top Security & Order Info */}
          <View style={styles.topHeader}>
            <View style={styles.securityBadge}>
              <Ionicons name="shield-checkmark" size={13} color="#10B981" />
              <AppText style={styles.securityText}>End-to-End Encrypted Call</AppText>
            </View>
            {workOrderNumber && (
              <AppText style={styles.orderNumber}>Work Order #{workOrderNumber}</AppText>
            )}
          </View>

          {/* Center Info: Avatar, Name, Timer */}
          <View style={styles.centerSection}>
            <View style={styles.avatarWrapper}>
              {avatarUri ? (
                <Image source={{ uri: avatarUri }} style={styles.avatar} />
              ) : (
                <View style={styles.fallbackAvatar}>
                  <AppText style={styles.fallbackText}>{initialLetter}</AppText>
                </View>
              )}
              <View
                style={[
                  styles.liveDot,
                  statusText === "Calling..." && styles.callingDot,
                  statusText === "Ringing..." && styles.ringingDot,
                ]}
              />
            </View>

            <AppText style={styles.participantName} numberOfLines={1}>
              {participantName}
            </AppText>
            <AppText
              style={[
                styles.timerText,
                statusText === "Calling..." && styles.callingText,
                statusText === "Ringing..." && styles.ringingText,
              ]}
            >
              {statusText || formatDuration(durationSecs)}
            </AppText>
          </View>

          {/* Bottom Call Controls: Mute, Speaker, End */}
          <View style={styles.controlsContainer}>
            {/* Action Row */}
            <View style={styles.actionButtonsRow}>
              {/* Mute Button */}
              <TouchableOpacity
                style={[styles.circleControlBtn, isMuted && styles.controlBtnActive]}
                onPress={() => {
                  try {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  } catch (_) {}
                  onToggleMute();
                }}
                activeOpacity={0.75}
              >
                <Ionicons
                  name={isMuted ? "mic-off" : "mic"}
                  size={26}
                  color={isMuted ? "#EF4444" : "#FFFFFF"}
                />
                <AppText style={styles.controlBtnText}>{isMuted ? "Unmute" : "Mute"}</AppText>
              </TouchableOpacity>

              {/* Speakerphone Button */}
              <TouchableOpacity
                style={[styles.circleControlBtn, isSpeakerOn && styles.controlBtnActive]}
                onPress={() => {
                  try {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  } catch (_) {}
                  onToggleSpeaker();
                }}
                activeOpacity={0.75}
              >
                <Ionicons
                  name={isSpeakerOn ? "volume-high" : "ear-outline"}
                  size={26}
                  color={isSpeakerOn ? "#10B981" : "#D1D5DB"}
                />
                <AppText
                  style={[
                    styles.controlBtnText,
                    isSpeakerOn && { color: "#10B981", fontWeight: "700" },
                  ]}
                >
                  {isSpeakerOn ? "Speaker" : "Earpiece"}
                </AppText>
              </TouchableOpacity>
            </View>

            {/* End Call Button */}
            <TouchableOpacity
              style={styles.endCallBtn}
              onPress={() => {
                try {
                  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
                } catch (_) {}
                onEndCall();
              }}
              activeOpacity={0.85}
            >
              <Ionicons
                name="call"
                size={30}
                color="#FFFFFF"
                style={{ transform: [{ rotate: "135deg" }] }}
              />
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(10, 15, 29, 0.98)",
  },
  container: {
    flex: 1,
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.lg,
  },
  topHeader: {
    alignItems: "center",
    marginTop: Spacing.sm,
  },
  securityBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(16, 185, 129, 0.12)",
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    marginBottom: 4,
  },
  securityText: {
    color: "#10B981",
    fontSize: 11,
    fontWeight: "700",
  },
  orderNumber: {
    color: "#9CA3AF",
    fontSize: 13,
    fontWeight: "500",
  },
  centerSection: {
    alignItems: "center",
  },
  avatarWrapper: {
    position: "relative",
    marginBottom: Spacing.md,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: "#10B981",
  },
  fallbackAvatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#2563EB",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "#10B981",
  },
  fallbackText: {
    color: "#fff",
    fontSize: 48,
    fontWeight: "800",
  },
  liveDot: {
    position: "absolute",
    bottom: 4,
    right: 4,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "#10B981",
    borderWidth: 3,
    borderColor: "#0A0F1D",
  },
  callingDot: {
    backgroundColor: "#60A5FA",
  },
  ringingDot: {
    backgroundColor: "#F59E0B",
  },
  participantName: {
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "800",
    textAlign: "center",
    maxWidth: SCREEN_WIDTH * 0.85,
    marginBottom: 6,
  },
  timerText: {
    color: "#10B981",
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: 1,
  },
  callingText: {
    color: "#93C5FD",
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  ringingText: {
    color: "#34D399",
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: 0.8,
  },
  controlsContainer: {
    width: "100%",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  actionButtonsRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 32,
    marginBottom: Spacing.xl,
  },
  circleControlBtn: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: "rgba(255, 255, 255, 0.12)",
    justifyContent: "center",
    alignItems: "center",
    padding: 6,
  },
  controlBtnActive: {
    backgroundColor: "rgba(255, 255, 255, 0.28)",
  },
  controlBtnText: {
    color: "#D1D5DB",
    fontSize: 10,
    fontWeight: "600",
    marginTop: 2,
  },
  endCallBtn: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: "#EF4444",
    justifyContent: "center",
    alignItems: "center",
    ...Shadows.lg,
  },
});
