import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  PanResponder,
  Platform,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
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
  const maxDistanceRef = useRef(Math.max(120, SCREEN_WIDTH - 40 - knobWidth - 10));
  const slideKnobAnim = useRef(new Animated.Value(0)).current;

  // Mutable refs to prevent stale closure inside PanResponder
  const onSlideCompleteRef = useRef(onSlideComplete);
  onSlideCompleteRef.current = onSlideComplete;

  const isLockedRef = useRef(isLocked);
  isLockedRef.current = isLocked;

  const isOnlineRef = useRef(isOnline);
  isOnlineRef.current = isOnline;

  const togglingOnlineRef = useRef(togglingOnline);
  togglingOnlineRef.current = togglingOnline;

  useEffect(() => {
    maxDistanceRef.current = Math.max(120, trackWidth - knobWidth - 10);
  }, [trackWidth]);

  // Reset knob to 0 whenever online status changes or loading completes
  useEffect(() => {
    slideKnobAnim.stopAnimation(() => {
      slideKnobAnim.setValue(0);
    });
  }, [isOnline, togglingOnline, slideKnobAnim]);

  const triggerSlideAction = () => {
    if (isLockedRef.current || togglingOnlineRef.current) return;
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (_) {}
    Animated.timing(slideKnobAnim, {
      toValue: maxDistanceRef.current,
      duration: 120,
      useNativeDriver: false,
    }).start(() => {
      slideKnobAnim.setValue(0);
      onSlideCompleteRef.current?.();
    });
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () =>
        !isLockedRef.current && !togglingOnlineRef.current,
      onStartShouldSetPanResponderCapture: () =>
        !isLockedRef.current && !togglingOnlineRef.current,
      onMoveShouldSetPanResponder: (_, g) =>
        !isLockedRef.current && !togglingOnlineRef.current && Math.abs(g.dx) > 2,
      onMoveShouldSetPanResponderCapture: (_, g) =>
        !isLockedRef.current && !togglingOnlineRef.current && Math.abs(g.dx) > 2,
      onPanResponderTerminationRequest: () => false,
      onShouldBlockNativeResponder: () => true,
      onPanResponderGrant: () => {
        try {
          Haptics.selectionAsync();
        } catch (_) {}
      },
      onPanResponderMove: (_, g) => {
        const val = Math.max(0, Math.min(g.dx, maxDistanceRef.current));
        slideKnobAnim.setValue(val);
      },
      onPanResponderRelease: (_, g) => {
        const passedDistance = g.dx >= maxDistanceRef.current * 0.3;
        const passedVelocity = g.vx > 0.35 && g.dx > 20;
        if (passedDistance || passedVelocity) {
          triggerSlideAction();
        } else {
          Animated.spring(slideKnobAnim, {
            toValue: 0,
            useNativeDriver: false,
            bounciness: 6,
          }).start();
        }
      },
      onPanResponderTerminate: () => {
        Animated.spring(slideKnobAnim, {
          toValue: 0,
          useNativeDriver: false,
        }).start();
      },
    })
  ).current;

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

      <View
        style={styles.sliderTrack}
        onLayout={(e) => setTrackWidth(e.nativeEvent.layout.width)}
        {...panResponder.panHandlers}
      >
        {/* Animated fill */}
        <Animated.View
          pointerEvents="none"
          style={[
            styles.sliderTrackFill,
            isOnline && styles.sliderTrackFillRed,
            {
              width: slideKnobAnim.interpolate({
                inputRange: [0, Math.max(1, maxDistanceRef.current)],
                outputRange: [knobWidth + 10, trackWidth],
                extrapolate: "clamp",
              }),
            },
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
            {
              transform: [{ translateX: slideKnobAnim }],
            },
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
