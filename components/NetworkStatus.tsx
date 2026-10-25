import AppText from "@/components/common/AppText";
import Colors from "@/constants/Colors";
import { Shadows } from "@/constants/Styles";
import { useNetwork } from "@/hooks/use-network";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function NetworkStatus() {
  const { isOffline } = useNetwork();
  const insets = useSafeAreaInsets();

  // Start off-screen
  const translateY = useSharedValue(-100);
  const opacity = useSharedValue(0);

  const processOfflineQueue = async () => {
    const { useOfflineStore } = require("@/context/offline-store");
    const myAxios = require("@/lib/axios.config").default;
    const { queue, dequeueAction } = useOfflineStore.getState();

    if (queue.length === 0) return;

    console.log(`[Offline Sync] Processing ${queue.length} queued actions...`);

    // Process sequentially
    for (const req of queue) {
      try {
        await myAxios({
          url: req.url,
          method: req.method,
          data: req.data,
          headers: req.headers,
        });
        dequeueAction(req.id);
        console.log(`[Offline Sync] Successfully synced action: ${req.url}`);
      } catch (error) {
        console.error(`[Offline Sync] Failed to sync action: ${req.url}`, error);
        // We leave it in the queue for the next attempt
      }
    }
  };

  useEffect(() => {
    if (isOffline) {
      // Slide in and fade in
      opacity.value = withTiming(1, { duration: 300 });
      translateY.value = withSpring(insets.top + 10, {
        damping: 12,
        stiffness: 90,
      });
    } else {
      // Slide out and fade out
      opacity.value = withTiming(0, { duration: 300 });
      translateY.value = withTiming(-100, { duration: 300 });

      // When internet returns, process the offline queue
      processOfflineQueue();
    }
  }, [isOffline, insets.top]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  // Render the wrapper even if online (to allow exit animation), but 
  // opacity/translate hides it.
  return (
    <Animated.View style={[styles.container, animatedStyle]} pointerEvents="none">
      <BlurView intensity={60} tint="dark" style={styles.blurContainer}>
        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <Ionicons name="cloud-offline" size={20} color={Colors.error} />
          </View>
          <AppText style={styles.text}>
            No internet issue, app running in offline
          </AppText>
        </View>
      </BlurView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 9999,
  },
  blurContainer: {
    borderRadius: 30,
    overflow: "hidden",
    ...Shadows.md,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: "rgba(0, 0, 0, 0.4)", // Darken the blur slightly
    gap: 8,
  },
  iconContainer: {
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    padding: 6,
    borderRadius: 16,
  },
  text: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "600",
  },
});
