import AppText from "@/components/common/AppText";
import Colors from "@/constants/Colors";
import { Shadows } from "@/constants/Styles";
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { Animated, StyleSheet, TouchableOpacity, View } from "react-native";

export default function VendorSilentModeBanner() {
  const [isSilentMode, setIsSilentMode] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const translateY = useState(() => new Animated.Value(-60))[0];

  useEffect(() => {
    // Check initial state or interval check
    const checkSilentMode = async () => {
      try {
        // In Expo React Native, we check system audio volume level if available
        // If device is in silent/vibrate mode or media/notification volume is 0
        // We trigger silent mode warning
      } catch (e) {}
    };

    checkSilentMode();
  }, []);

  useEffect(() => {
    if (isSilentMode && !dismissed) {
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        friction: 8,
      }).start();
    } else {
      Animated.timing(translateY, {
        toValue: -60,
        duration: 250,
        useNativeDriver: true,
      }).start();
    }
  }, [isSilentMode, dismissed, translateY]);

  if (!isSilentMode || dismissed) return null;

  return (
    <Animated.View style={[styles.container, { transform: [{ translateY }] }]}>
      <View style={styles.content}>
        <Ionicons name="volume-mute" size={18} color={Colors.neutral.white} />
        <View style={{ flex: 1 }}>
          <AppText style={styles.title}>Silent / Mute Mode Detected</AppText>
          <AppText style={styles.subtitle}>
            Turn up ringer volume so you don&apos;t miss instant customer job alerts & calls!
          </AppText>
        </View>
        <TouchableOpacity
          onPress={() => setDismissed(true)}
          style={styles.closeBtn}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="close" size={16} color={Colors.neutral.white} />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    backgroundColor: "#F59E0B", // Warning amber color
    paddingHorizontal: 16,
    paddingVertical: 10,
    ...Shadows.md,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  title: {
    fontSize: 12,
    fontWeight: "800",
    color: Colors.neutral.white,
  },
  subtitle: {
    fontSize: 10,
    color: "rgba(255, 255, 255, 0.95)",
    marginTop: 1,
  },
  closeBtn: {
    padding: 4,
  },
});
