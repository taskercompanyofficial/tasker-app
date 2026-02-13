import React, { useEffect, useMemo, useRef } from "react";
import { Animated, Pressable, StyleSheet, Platform, type StyleProp, type ViewStyle } from "react-native";
import Colors from "@/constants/Colors";

type Size = "sm" | "md" | "lg";

interface CustomSwitchProps {
  value: boolean;
  onValueChange: (next: boolean) => void;
  disabled?: boolean;
  size?: Size;
  colorOn?: string;
  colorOff?: string;
  knobOnColor?: string;
  knobOffColor?: string;
  borderOnColor?: string;
  borderOffColor?: string;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
}

export default function CustomSwitch({
  value,
  onValueChange,
  disabled,
  size = "md",
  colorOn = Colors.themes.customer.primary + "12",
  colorOff = Colors.neutral.gray[200],
  knobOnColor = Colors.themes.customer.primary,
  knobOffColor = Colors.neutral.white,
  borderOnColor = Colors.themes.customer.primary,
  borderOffColor = Colors.border.light,
  accessibilityLabel,
  style,
}: CustomSwitchProps) {
  const anim = useRef(new Animated.Value(value ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: value ? 1 : 0,
      duration: 180,
      useNativeDriver: false,
    }).start();
  }, [value, anim]);

  const dims = useMemo(() => {
    if (size === "sm") return { width: 44, height: 24, knob: 18, padding: 3 };
    if (size === "lg") return { width: 64, height: 32, knob: 26, padding: 3 };
    return { width: 52, height: 28, knob: 22, padding: 3 };
  }, [size]);

  const knobTranslate = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [dims.padding, dims.width - dims.knob - dims.padding],
  });

  const fillWidth = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [dims.knob + dims.padding, dims.width - dims.padding],
  });

  const onKeyDown = (e: any) => {
    if (disabled) return;
    const key = e?.key;
    if (key === " " || key === "Spacebar" || key === "Enter") {
      e.preventDefault?.();
      onValueChange(!value);
    } else if (key === "ArrowRight") {
      onValueChange(true);
    } else if (key === "ArrowLeft") {
      onValueChange(false);
    }
  };

  return (
    <Pressable
      onPress={() => !disabled && onValueChange(!value)}
      style={[
        styles.track,
        {
          width: dims.width,
          height: dims.height,
          borderRadius: 6,
          backgroundColor: value ? colorOn : colorOff,
          borderWidth: 1,
          borderColor: value ? borderOnColor : borderOffColor,
          opacity: disabled ? 0.5 : 1,
        },
        style as any,
      ]}
      accessibilityRole="switch"
      accessibilityState={{ checked: value, disabled }}
      accessibilityLabel={accessibilityLabel}
      android_ripple={{ color: Colors.neutral.gray[400] }}
      onKeyDown={Platform.OS === "web" ? onKeyDown : undefined}
    >
      <Animated.View
        style={[
          styles.fill,
          {
            width: fillWidth,
            height: dims.height,
            borderRadius: 6,
            backgroundColor: colorOn,
          },
        ]}
      />
      <Animated.View
        style={[
          styles.knob,
          {
            width: dims.knob,
            height: dims.knob,
            borderRadius: 4,
            transform: [{ translateX: knobTranslate }],
            backgroundColor: value ? knobOnColor : knobOffColor,
            borderWidth: 1,
            borderColor: value ? borderOnColor : borderOffColor,
          },
        ]}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  track: {
    overflow: "hidden",
    justifyContent: "center",
  },
  fill: {
    position: "absolute",
    left: 0,
    top: 0,
  },
  knob: {
    position: "absolute",
    top: 2,
    elevation: 1,
  },
});
