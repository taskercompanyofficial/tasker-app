import React from "react";
import { StyleSheet, View, useColorScheme } from "react-native";
import Svg, { Defs, Pattern, Rect, Path, Circle } from "react-native-svg";

interface ChatWallpaperTextureProps {
  isDark?: boolean;
}

export function ChatWallpaperTexture({ isDark: customIsDark }: ChatWallpaperTextureProps) {
  const systemColorScheme = useColorScheme();
  const isDark = customIsDark ?? systemColorScheme === "dark";

  // Subtle colors based on theme
  const strokeColor = isDark ? "#FFFFFF" : "#0F172A";
  const strokeOpacity = isDark ? 0.05 : 0.038;
  const dotFill = isDark ? "#FFFFFF" : "#0F172A";
  const dotOpacity = isDark ? 0.045 : 0.032;

  return (
    <View style={styles.container} pointerEvents="none">
      <Svg width="100%" height="100%">
        <Defs>
          <Pattern
            id="chatWallpaperDoodlePattern"
            width="64"
            height="64"
            patternUnits="userSpaceOnUse"
          >
            {/* Subtle Chat Bubble Outline */}
            <Path
              d="M 12 10 C 8.7 10 6 12.7 6 16 C 6 19.3 8.7 22 12 22 L 13 22 L 13 25 L 16.5 22 L 20 22 C 23.3 22 26 19.3 26 16 C 26 12.7 23.3 10 20 10 Z"
              stroke={strokeColor}
              strokeWidth="1.1"
              strokeOpacity={strokeOpacity}
              fill="none"
              strokeLinejoin="round"
            />

            {/* Subtle Star / Sparkle */}
            <Path
              d="M 48 8 L 49.2 12 L 53.2 13.2 L 49.2 14.4 L 48 18.4 L 46.8 14.4 L 42.8 13.2 L 46.8 12 Z"
              stroke={strokeColor}
              strokeWidth="1.0"
              strokeOpacity={strokeOpacity}
              fill="none"
              strokeLinejoin="round"
            />

            {/* Subtle Service Wrench / Tool Outline */}
            <Path
              d="M 45 42 L 53 50 M 43 40 C 41.5 38.5 41.5 36 43 34.5 C 44.5 33 47 33 48.5 34.5 C 49.3 35.3 49.6 36.3 49.5 37.3 L 46.5 40.3 L 44 37.8 L 41.5 40.3"
              stroke={strokeColor}
              strokeWidth="1.1"
              strokeOpacity={strokeOpacity}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Subtle Shield / Verified Icon */}
            <Path
              d="M 14 42 C 14 42 20 39.5 22 38 C 24 39.5 30 42 30 42 C 30 48 24 53 22 54 C 20 53 14 48 14 42 Z"
              stroke={strokeColor}
              strokeWidth="1.0"
              strokeOpacity={strokeOpacity}
              fill="none"
              strokeLinejoin="round"
            />

            {/* Subtle Floating Dots for texture depth */}
            <Circle cx="35" cy="18" r="1.2" fill={dotFill} fillOpacity={dotOpacity} />
            <Circle cx="32" cy="48" r="1.0" fill={dotFill} fillOpacity={dotOpacity} />
            <Circle cx="8" cy="34" r="0.9" fill={dotFill} fillOpacity={dotOpacity} />
            <Circle cx="58" cy="28" r="1.1" fill={dotFill} fillOpacity={dotOpacity} />

            {/* Subtle Plus Symbol */}
            <Path
              d="M 33 30 L 37 30 M 35 28 L 35 32"
              stroke={strokeColor}
              strokeWidth="1.0"
              strokeOpacity={strokeOpacity}
              strokeLinecap="round"
            />
          </Pattern>
        </Defs>

        <Rect
          width="100%"
          height="100%"
          fill="url(#chatWallpaperDoodlePattern)"
        />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFill,
    zIndex: 0,
  },
});
