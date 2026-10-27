import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Platform,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  Extrapolation,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import AppText from "@/components/common/AppText";
import DirectionalIcon from "@/components/common/DirectionalIcon";

interface VendorOnlineSliderProps {
  isOnline?: boolean;
  togglingOnline: boolean;
  isLocked?: boolean;
  onSlideComplete: () => void;
  onLockedPress?: () => void;
}

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export default function VendorOnlineSlider({
  isOnline = false,
  togglingOnline,
  isLocked = false,
  onSlideComplete,
  onLockedPress,
}: VendorOnlineSliderProps) {
  const [trackWidth, setTrackWidth] = useState(SCREEN_WIDTH - 40);
  const knobWidth = 44;
  const maxDistance = Math.max(120, trackWidth - knobWidth - 10);

  const translateX = useSharedValue(0);
  const maxDistShared = useSharedValue(maxDistance);

  useEffect(() => {
    maxDistShared.value = Math.max(120, trackWidth - knobWidth - 10);
  }, [trackWidth, maxDistShared]);

  // Reset knob to 0 smoothly only after online state changes or toggle finishes
  useEffect(() => {
    if (!togglingOnline) {
      translateX.value = withSpring(0, { damping: 20, stiffness: 180 });
    }
  }, [isOnline, togglingOnline, translateX]);

  const fireGrantHaptic = () => {
    try {
      Haptics.selectionAsync();
    } catch (_) {}
  };

  const fireCompleteAction = () => {
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (_) {}
    onSlideComplete();
  };

  const panGesture = Gesture.Pan()
    .enabled(!isLocked && !togglingOnline)
    .activeOffsetX([-5, 5])
    .onBegin(() => {
      runOnJS(fireGrantHaptic)();
    })
    .onUpdate((e) => {
      const clamped = Math.max(0, Math.min(e.translationX, maxDistShared.value));
      translateX.value = clamped;
    })
    .onEnd((e) => {
      const maxD = maxDistShared.value;
      const passedDistance = e.translationX >= maxD * 0.45;
      const passedVelocity = e.velocityX > 450 && e.translationX >= maxD * 0.2;

      if (passedDistance || passedVelocity) {
        translateX.value = withTiming(maxD, { duration: 130 }, (finished) => {
          if (finished) {
            runOnJS(fireCompleteAction)();
          }
        });
      } else {
        translateX.value = withSpring(0, { damping: 18, stiffness: 180 });
      }
    });

  const knobAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const fillAnimatedStyle = useAnimatedStyle(() => ({
    width: interpolate(
      translateX.value,
      [0, Math.max(1, maxDistShared.value)],
      [knobWidth + 10, maxDistShared.value + knobWidth + 10],
      Extrapolation.CLAMP
    ),
  }));

  // ─── 1. LOCKED STATE ───
  if (isLocked) {
    return (
      <View style={styles.offlineSliderDock}>
        <View style={styles.offlineSliderHeader}>
          <AppText style={styles.offlineSliderTitle}>ONLINE STATUS</AppText>
          <AppText style={styles.disabledSliderSub}>
            Dispatches paused (Dues pending)
          </AppText>
        </View>

        <TouchableOpacity
          style={styles.disabledTrack}
          activeOpacity={0.7}
          onPress={onLockedPress}
        >
          <View style={styles.disabledKnob}>
            <Ionicons name="lock-closed" size={16} color="#94A3B8" />
          </View>
          <AppText style={styles.disabledTrackText}>
            Online Disabled · Clear Dues to Unlock
          </AppText>
        </TouchableOpacity>
      </View>
    );
  }

  // ─── 2. ACTIVE SLIDER (Slide to Go Online OR Slide to Go Offline) ───
  return (
    <View style={styles.offlineSliderDock}>
      <View style={styles.offlineSliderHeader}>
        {isOnline ? (
          <View style={styles.headerLeftRow}>
            <View style={styles.onlineDot} />
            <AppText style={styles.offlineSliderTitle}>YOU ARE ONLINE</AppText>
          </View>
        ) : (
          <AppText style={styles.offlineSliderTitle}>READY FOR BOOKINGS?</AppText>
        )}

        <AppText style={isOnline ? styles.offlineSliderSubRed : styles.offlineSliderSub}>
          {isOnline ? "Slide to go offline" : "High customer demand now"}
        </AppText>
      </View>

      <GestureDetector gesture={panGesture}>
        <View
          style={styles.sliderTrack}
          onLayout={(e) => setTrackWidth(e.nativeEvent.layout.width)}
        >
          {/* Animated fill */}
          <Animated.View
            pointerEvents="none"
            style={[
              styles.sliderTrackFill,
              isOnline && styles.sliderTrackFillRed,
              fillAnimatedStyle,
            ]}
          />

          {/* Center label */}
          <View style={styles.sliderCenterLabel} pointerEvents="none">
            <AppText style={styles.sliderTrackText}>
              {togglingOnline
                ? isOnline
                  ? "Going Offline..."
                  : "Going Online..."
                : isOnline
                ? "Slide to Go Offline"
                : "Slide to Go Online"}
            </AppText>
            <DirectionalIcon
              name="chevron-forward"
              size={18}
              color={isOnline ? "#FECACA" : "#A7F3D0"}
              style={styles.sliderChevron}
            />
          </View>

          {/* Draggable Knob */}
          <Animated.View
            style={[
              styles.sliderKnob,
              isOnline && styles.sliderKnobRed,
              knobAnimatedStyle,
            ]}
          >
            {togglingOnline ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : isOnline ? (
              <Ionicons name="power" size={20} color="#FFFFFF" />
            ) : (
              <Ionicons name="flash" size={20} color="#FFFFFF" />
            )}
          </Animated.View>
        </View>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  offlineSliderDock: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: Platform.OS === "ios" ? 28 : 16,
  },
  offlineSliderHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  headerLeftRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#10B981",
    marginRight: 6,
  },
  offlineSliderTitle: {
    fontSize: 10.5,
    fontWeight: "800",
    color: "#64748B",
    letterSpacing: 0.5,
  },
  offlineSliderSub: {
    fontSize: 10.5,
    fontWeight: "600",
    color: "#16A34A",
  },
  offlineSliderSubRed: {
    fontSize: 10.5,
    fontWeight: "700",
    color: "#EF4444",
  },
  sliderTrack: {
    height: 52,
    backgroundColor: "#0F172A",
    borderRadius: 26,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    paddingHorizontal: 6,
    overflow: "hidden",
  },
  sliderCenterLabel: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  sliderTrackFill: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: "#059669",
    borderRadius: 26,
  },
  sliderTrackFillRed: {
    backgroundColor: "#DC2626",
  },
  sliderTrackText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: 0.3,
  },
  sliderChevron: {
    marginLeft: 6,
  },
  sliderKnob: {
    position: "absolute",
    left: 5,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#10B981",
    alignItems: "center",
    justifyContent: "center",
  },
  sliderKnobRed: {
    backgroundColor: "#EF4444",
  },

  // ─── DISABLED STATE TRACK (Subtle, NOT Red) ───
  disabledSliderSub: {
    fontSize: 10.5,
    fontWeight: "600",
    color: "#64748B",
  },
  disabledTrack: {
    height: 52,
    backgroundColor: "#E2E8F0",
    borderRadius: 26,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 6,
    borderWidth: 1,
    borderColor: "#CBD5E1",
  },
  disabledKnob: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#CBD5E1",
  },
  disabledTrackText: {
    flex: 1,
    textAlign: "center",
    fontSize: 12,
    fontWeight: "700",
    color: "#64748B",
    paddingRight: 10,
  },
});
