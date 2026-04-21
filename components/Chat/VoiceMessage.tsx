import React, { useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAudioPlayer, useAudioPlayerStatus } from "expo-audio";
import Colors from "@/constants/Colors";

interface VoiceMessageProps {
  uri: string;
  isSender: boolean;
}

export function VoiceMessage({ uri, isSender }: VoiceMessageProps) {
  const player = useAudioPlayer(uri);
  const status = useAudioPlayerStatus(player);

  const togglePlayback = () => {
    if (status.playing) {
      player.pause();
    } else {
      player.play();
    }
  };

  const activeColor = isSender ? "#FFFFFF" : Colors.themes.customer.primary;

  const formatTime = (millis: number) => {
    const totalSeconds = millis / 1000;
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = Math.floor(totalSeconds % 60);
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={togglePlayback} style={styles.playButton}>
        <Ionicons
          name={status.playing ? "pause" : "play"}
          size={24}
          color={activeColor}
        />
      </TouchableOpacity>
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${(status.currentTime / status.duration) * 100 || 0}%`,
                backgroundColor: activeColor,
              },
            ]}
          />
        </View>
        <Text style={[styles.durationText, { color: activeColor }]}>
          {status.playing
            ? formatTime(status.currentTime)
            : formatTime(status.duration || 0)}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    minWidth: 150,
    paddingVertical: 5,
  },
  playButton: {
    marginRight: 10,
  },
  progressContainer: {
    flex: 1,
  },
  progressBar: {
    height: 3,
    backgroundColor: "rgba(0,0,0,0.1)",
    borderRadius: 2,
    width: "100%",
    marginBottom: 4,
  },
  progressFill: {
    height: "100%",
    borderRadius: 2,
  },
  durationText: {
    fontSize: 10,
    fontWeight: "600",
  },
});
