import React, { useEffect } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Platform,
  StyleSheet,
  View,
} from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

interface VendorDraggablePowerButtonProps {
  visible: boolean;
  togglingOnline?: boolean;
  onPress: () => void;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

// 2% bigger size: 52px (was 48px)
const BTN_SIZE = 52;

// Initial position: Right edge, 20% height from top (as requested)
const INITIAL_X = SCREEN_WIDTH - BTN_SIZE - 12;
const INITIAL_Y = Math.round(SCREEN_HEIGHT * 0.20);

export default function VendorDraggablePowerButton({
  visible,
  togglingOnline = false,
  onPress,
}: VendorDraggablePowerButtonProps) {
  // Shared values for 60/120 FPS UI-thread translation (ZERO LAG)
  const translationX = useSharedValue(INITIAL_X);
  const translationY = useSharedValue(INITIAL_Y);
  const prevTranslationX = useSharedValue(INITIAL_X);
  const prevTranslationY = useSharedValue(INITIAL_Y);
  const isPressed = useSharedValue(false);

  // Pill Wave / Radar Pulse Animation
  const waveScale = useSharedValue(1);
  const waveOpacity = useSharedValue(0.5);

  useEffect(() => {
    if (visible) {
      waveScale.value = withRepeat(
        withTiming(1.6, { duration: 1500 }),
        -1,
        false
      );
      waveOpacity.value = withRepeat(
        withSequence(
          withTiming(0.55, { duration: 0 }),
          withTiming(0, { duration: 1500 })
        ),
        -1,
        false
      );
    }
  }, [visible]);

  const triggerHaptic = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (_) {}
  };

  const handleTap = () => {
    if (togglingOnline) return;
    triggerHaptic();
    onPress();
  };

  // Dedicated tap gesture for instant 1-touch response without requiring pan threshold
  const tapGesture = Gesture.Tap()
    .maxDuration(350)
    .onBegin(() => {
      isPressed.value = true;
    })
    .onEnd((_e, success) => {
      if (success) {
        runOnJS(handleTap)();
      }
    })
    .onFinalize(() => {
      isPressed.value = false;
    });

  // Pan gesture with UI-thread direct translation for silky-smooth 120 FPS drag
  const panGesture = Gesture.Pan()
    .minDistance(6)
    .onStart(() => {
      prevTranslationX.value = translationX.value;
      prevTranslationY.value = translationY.value;
      isPressed.value = true;
    })
    .onUpdate((event) => {
      translationX.value = prevTranslationX.value + event.translationX;
      translationY.value = prevTranslationY.value + event.translationY;
    })
    .onEnd(() => {
      isPressed.value = false;
      // Clamped final drop coordinates within screen safe margins
      const clampedX = Math.max(
        10,
        Math.min(SCREEN_WIDTH - BTN_SIZE - 10, translationX.value)
      );
      const clampedY = Math.max(
        Platform.OS === "ios" ? 54 : 36,
        Math.min(SCREEN_HEIGHT - BTN_SIZE - 85, translationY.value)
      );

      translationX.value = withSpring(clampedX, {
        damping: 20,
        stiffness: 220,
      });
      translationY.value = withSpring(clampedY, {
        damping: 20,
        stiffness: 220,
      });
    })
    .onFinalize(() => {
      isPressed.value = false;
    });

  // Compose Race: Tap responds immediately on single touch release,
  // Pan activates when finger travels > 6px for seamless dragging
  const composedGesture = Gesture.Race(panGesture, tapGesture);

  const animatedButtonStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translationX.value },
      { translateY: translationY.value },
      { scale: withSpring(isPressed.value ? 1.08 : 1, { damping: 15 }) },
    ],
  }));

  const animatedWaveStyle = useAnimatedStyle(() => ({
    transform: [{ scale: waveScale.value }],
    opacity: waveOpacity.value,
  }));

  if (!visible) return null;

  return (
    <GestureDetector gesture={composedGesture}>
      <Animated.View style={[styles.floatingWrapper, animatedButtonStyle]}>
        {/* Animated Pill Wave Ring */}
        <Animated.View style={[styles.waveRing, animatedWaveStyle]} pointerEvents="none" />

        {/* Circular Power Button */}
        <View style={styles.coreButton}>
          {togglingOnline ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Ionicons name="power" size={23} color="#FFFFFF" />
          )}
        </View>
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  floatingWrapper: {
    position: "absolute",
    top: 0,
    left: 0,
    width: BTN_SIZE,
    height: BTN_SIZE,
    zIndex: 99999,
    alignItems: "center",
    justifyContent: "center",
  },
  waveRing: {
    position: "absolute",
    width: BTN_SIZE + 6,
    height: BTN_SIZE + 6,
    borderRadius: (BTN_SIZE + 6) / 2,
    backgroundColor: "#EF4444",
  },
  coreButton: {
    width: BTN_SIZE,
    height: BTN_SIZE,
    borderRadius: BTN_SIZE / 2,
    backgroundColor: "#EF4444",
    borderWidth: 2,
    borderColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
});
