import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  GestureResponderEvent,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAudioPlayer, useAudioPlayerStatus } from "expo-audio";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/Colors";

interface VoiceMessageProps {
  uri: string;
  isSender: boolean;
}

// Generate a deterministic pseudo-random waveform height array based on URI
function generateWaveformPattern(seedStr: string, count: number = 28): number[] {
  let hash = 0;
  for (let i = 0; i < seedStr.length; i++) {
    hash = (hash << 5) - hash + seedStr.charCodeAt(i);
    hash |= 0;
  }
  const heights: number[] = [];
  for (let i = 0; i < count; i++) {
    // Generate height between 0.2 and 1.0
    const pseudo = Math.abs(Math.sin((hash + i * 37) * 0.1));
    const h = 0.25 + pseudo * 0.75;
    heights.push(Number(h.toFixed(2)));
  }
  return heights;
}

export function VoiceMessage({ uri, isSender }: VoiceMessageProps) {
  const player = useAudioPlayer(uri, { updateInterval: 100 });
  const status = useAudioPlayerStatus(player);
  const [speed, setSpeed] = useState<1 | 1.5 | 2>(1);

  // Pre-generate 28 waveform bars based on URI
  const waveform = useMemo(() => generateWaveformPattern(uri || "tasker_audio", 28), [uri]);

  const togglePlayback = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}

    if (status.playing) {
      player.pause();
    } else {
      player.play();
    }
  };

  const cycleSpeed = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {}

    const nextSpeed = speed === 1 ? 1.5 : speed === 1.5 ? 2 : 1;
    setSpeed(nextSpeed);
    try {
      player.playbackRate = nextSpeed;
    } catch (err) {
      console.warn("Could not set playback rate:", err);
    }
  };

  const handleWaveformPress = (event: GestureResponderEvent) => {
    const { locationX } = event.nativeEvent;
    // Estimated container width: roughly 180-200px
    // Trigger seek if duration is available
    if (status.duration && status.duration > 0) {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch {}
      // Assume waveform width is around 170px
      const targetPercent = Math.max(0, Math.min(1, locationX / 170));
      const targetSeconds = targetPercent * status.duration;
      if (typeof player.seekTo === "function") {
        player.seekTo(targetSeconds);
      }
    }
  };

  const formatSeconds = (totalSeconds: number) => {
    if (!totalSeconds || isNaN(totalSeconds) || totalSeconds < 0) return "0:00";
    const mins = Math.floor(totalSeconds / 60);
    const secs = Math.floor(totalSeconds % 60);
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  const currentSec = status.currentTime || 0;
  const totalSec = status.duration || 0;
  const progressRatio = totalSec > 0 ? Math.min(1, Math.max(0, currentSec / totalSec)) : 0;

  // Theming colors
  const activeColor = isSender ? "#FFFFFF" : Colors.themes.customer.primary;
  const inactiveColor = isSender ? "rgba(255, 255, 255, 0.35)" : "#CBD5E1";
  const buttonBg = isSender ? "rgba(255, 255, 255, 0.22)" : Colors.themes.customer.primary;
  const buttonIconColor = isSender ? "#FFFFFF" : "#FFFFFF";
  const speedBadgeBg = isSender ? "rgba(255, 255, 255, 0.2)" : "#E2E8F0";
  const speedBadgeText = isSender ? "#FFFFFF" : "#334155";
  const timeTextColor = isSender ? "rgba(255, 255, 255, 0.85)" : "#64748B";

  return (
    <View style={styles.container}>
      {/* Play / Pause Circular Button */}
      <TouchableOpacity
        onPress={togglePlayback}
        style={[styles.playButton, { backgroundColor: buttonBg }]}
        activeOpacity={0.8}
      >
        <Ionicons
          name={status.playing ? "pause" : "play"}
          size={18}
          color={buttonIconColor}
          style={status.playing ? undefined : { marginLeft: 2 }}
        />
      </TouchableOpacity>

      {/* Waveform & Scrubber Section */}
      <View style={styles.contentSection}>
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={handleWaveformPress}
          style={styles.waveformContainer}
        >
          {waveform.map((barHeight, idx) => {
            const barRatio = idx / waveform.length;
            const isPlayed = barRatio <= progressRatio;
            return (
              <View
                key={idx}
                style={[
                  styles.waveformBar,
                  {
                    height: Math.max(4, barHeight * 24),
                    backgroundColor: isPlayed ? activeColor : inactiveColor,
                  },
                ]}
              />
            );
          })}
        </TouchableOpacity>

        {/* Time Tracking & Playback Speed Controls */}
        <View style={styles.metaRow}>
          <View style={styles.timeWrap}>
            <Ionicons
              name="mic"
              size={11}
              color={timeTextColor}
              style={{ marginRight: 3 }}
            />
            <Text style={[styles.timeText, { color: timeTextColor }]}>
              {status.playing
                ? `${formatSeconds(currentSec)} / ${formatSeconds(totalSec)}`
                : formatSeconds(totalSec || currentSec)}
            </Text>
          </View>

          {/* Speed Toggle Pill Button */}
          <TouchableOpacity
            onPress={cycleSpeed}
            style={[styles.speedBadge, { backgroundColor: speedBadgeBg }]}
            activeOpacity={0.7}
          >
            <Text style={[styles.speedText, { color: speedBadgeText }]}>
              {speed}x
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    minWidth: 220,
    maxWidth: 270,
    paddingVertical: 4,
    paddingHorizontal: 2,
  },
  playButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
  contentSection: {
    flex: 1,
    justifyContent: "center",
  },
  waveformContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    height: 26,
    paddingVertical: 2,
  },
  waveformBar: {
    width: 3,
    borderRadius: 2,
    marginHorizontal: 1,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 3,
  },
  timeWrap: {
    flexDirection: "row",
    alignItems: "center",
  },
  timeText: {
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.2,
  },
  speedBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 8,
  },
  speedText: {
    fontSize: 10,
    fontWeight: "700",
  },
});
