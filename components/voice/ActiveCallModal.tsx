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
  Text,
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

  // Live duration timer
  useEffect(() => {
    let timer: any = null;
    if (visible) {
      setDurationSecs(0);
      timer = setInterval(() => {
        setDurationSecs((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [visible]);

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
              <Text style={styles.securityText}>End-to-End Encrypted Call</Text>
            </View>
            {workOrderNumber && (
              <Text style={styles.orderNumber}>Work Order #{workOrderNumber}</Text>
            )}
          </View>

          {/* Center Info: Avatar, Name, Timer */}
          <View style={styles.centerSection}>
            <View style={styles.avatarWrapper}>
              {avatarUri ? (
                <Image source={{ uri: avatarUri }} style={styles.avatar} />
              ) : (
                <View style={styles.fallbackAvatar}>
                  <Text style={styles.fallbackText}>{initialLetter}</Text>
                </View>
              )}
              <View style={styles.liveDot} />
            </View>

            <Text style={styles.participantName} numberOfLines={1}>
              {participantName}
            </Text>
            <Text style={styles.timerText}>{statusText || formatDuration(durationSecs)}</Text>
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
                <Text style={styles.controlBtnText}>{isMuted ? "Unmute" : "Mute"}</Text>
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
                  name={isSpeakerOn ? "volume-high" : "volume-medium"}
                  size={26}
                  color={isSpeakerOn ? "#10B981" : "#FFFFFF"}
                />
                <Text style={styles.controlBtnText}>
                  {isSpeakerOn ? "Speaker On" : "Speaker"}
                </Text>
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
