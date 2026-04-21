import React, { useRef } from "react";
import { View, StyleSheet, TouchableOpacity, Dimensions } from "react-native";
import { useVideoPlayer, VideoView } from "expo-video";
import { Ionicons } from "@expo/vector-icons";

interface VideoMessageProps {
  uri: string;
}

const { width } = Dimensions.get("window");
const VIDEO_WIDTH = width * 0.6;
const VIDEO_HEIGHT = VIDEO_WIDTH * 0.75;

export function VideoMessage({ uri }: VideoMessageProps) {
  const player = useVideoPlayer(uri, (player) => {
    player.loop = true;
    // We don't auto-play to save data/bandwidth
  });

  return (
    <View style={styles.container}>
      <VideoView
        style={styles.video}
        player={player}
        allowsFullscreen
        allowsPictureInPicture
        contentFit="cover"
      />
      {!player.playing && (
         <TouchableOpacity 
            style={styles.overlay} 
            onPress={() => player.play()}
            activeOpacity={0.8}
        >
            <View style={styles.playIconContainer}>
                <Ionicons name="play" size={32} color="white" />
            </View>
         </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: VIDEO_WIDTH,
    height: VIDEO_HEIGHT,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#000",
  },
  video: {
    width: "100%",
    height: "100%",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.2)",
  },
  playIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
  },
});
