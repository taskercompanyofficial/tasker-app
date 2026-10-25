import React, { useEffect, useRef } from "react";
import { View, StyleSheet, Animated, Easing, DimensionValue } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Colors from "@/constants/Colors";

interface LoaderProps {
  size?: "small" | "medium" | "large";
  fullScreen?: boolean;
  color?: string;
  iconName?: keyof typeof Ionicons.glyphMap;
}

export default function Loader({
  size = "medium",
  fullScreen = false,
  color = Colors.themes.customer.primary,
  iconName = "sparkles",
}: LoaderProps) {
  const spinValue = useRef(new Animated.Value(0)).current;
  const pulseValue = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // 1. Single smooth native-driver continuous spin
    const spinAnimation = Animated.loop(
      Animated.timing(spinValue, {
        toValue: 1,
        duration: 1200,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );

    // 2. Subtle center breathing pulse
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseValue, {
          toValue: 1.12,
          duration: 600,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseValue, {
          toValue: 1,
          duration: 600,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );

    spinAnimation.start();
    pulseAnimation.start();

    return () => {
      spinAnimation.stop();
      pulseAnimation.stop();
    };
  }, [spinValue, pulseValue]);

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  const getDimensions = () => {
    switch (size) {
      case "small":
        return { ringSize: 32, strokeWidth: 2.5, iconSize: 14 };
      case "large":
        return { ringSize: 64, strokeWidth: 4, iconSize: 28 };
      default:
        return { ringSize: 46, strokeWidth: 3, iconSize: 20 };
    }
  };

  const { ringSize, strokeWidth, iconSize } = getDimensions();

  const loaderContent = (
    <View style={[styles.loaderBox, { width: ringSize, height: ringSize }]}>
      {/* Background Track Ring */}
      <View
        style={[
          styles.trackRing,
          {
            width: ringSize,
            height: ringSize,
            borderRadius: ringSize / 2,
            borderWidth: strokeWidth,
            borderColor: color + "20",
          },
        ]}
      />

      {/* Rotating Accent Arc Ring */}
      <Animated.View
        style={[
          styles.rotatingRing,
          {
            width: ringSize,
            height: ringSize,
            borderRadius: ringSize / 2,
            borderWidth: strokeWidth,
            borderTopColor: color,
            borderRightColor: color,
            borderBottomColor: "transparent",
            borderLeftColor: "transparent",
            transform: [{ rotate: spin }],
          },
        ]}
      />

      {/* Center Subtle Brand Icon with breathing pulse */}
      <Animated.View
        style={[
          styles.centerIconWrap,
          {
            transform: [{ scale: pulseValue }],
          },
        ]}
      >
        <Ionicons name={iconName} size={iconSize} color={color} />
      </Animated.View>
    </View>
  );

  if (fullScreen) {
    return <View style={styles.fullScreenWrapper}>{loaderContent}</View>;
  }

  return loaderContent;
}

const styles = StyleSheet.create({
  fullScreenWrapper: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.background.primary,
  },
  loaderBox: {
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  trackRing: {
    position: "absolute",
  },
  rotatingRing: {
    position: "absolute",
  },
  centerIconWrap: {
    justifyContent: "center",
    alignItems: "center",
  },
});
