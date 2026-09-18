import Colors from "@/constants/Colors";
import { BorderRadius, Shadows, Spacing, Typography } from "@/constants/Styles";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useEffect, useRef } from "react";
import { Animated, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Svg, {
  Circle,
  Defs,
  Mask,
  Pattern,
  Rect,
  Stop,
  LinearGradient as SvgGradient,
} from "react-native-svg";

export default function FreeInstallationCard() {
  const shineAnim = useRef(new Animated.Value(0)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // 1. Shine Sweep Animation
    const shineLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(shineAnim, {
          toValue: 1,
          duration: 2600,
          useNativeDriver: true,
        }),
        Animated.delay(1200),
      ])
    );

    // 2. 3D Character Floating Animation (gentle 5px up/down bobbing)
    const floatLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: 1,
          duration: 1800,
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 1800,
          useNativeDriver: true,
        }),
      ])
    );

    // 3. Flame Icon Pulse Animation (scale 1.0 -> 1.2)
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );

    shineLoop.start();
    floatLoop.start();
    pulseLoop.start();

    return () => {
      shineLoop.stop();
      floatLoop.stop();
      pulseLoop.stop();
    };
  }, [shineAnim, floatAnim, pulseAnim]);

  const translateX = shineAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-150, 400],
  });

  const floatTranslateY = floatAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -5],
  });

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => router.push("/customer/free-installation")}
      activeOpacity={0.9}
    >
      <View style={styles.cardWrapper}>
        {/* Background blob clipped to card rounded corners */}
        <View style={styles.blobClipContainer}>
          <LinearGradient
            colors={[Colors.success + "25", Colors.success + "05"]}
            style={styles.imageBackgroundBlob}
          />

          {/* Dotted Texture Overlay (Opposite Direction: Top-Right to Bottom-Left) */}
          <View style={StyleSheet.absoluteFill} pointerEvents="none">
            <Svg width="100%" height="100%">
              <Defs>
                <SvgGradient id="dotFadeFree" x1="1" y1="0" x2="0" y2="1">
                  <Stop offset="0%" stopColor={Colors.success} stopOpacity="0.45" />
                  <Stop offset="40%" stopColor={Colors.success} stopOpacity="0.2" />
                  <Stop offset="80%" stopColor={Colors.success} stopOpacity="0.04" />
                  <Stop offset="100%" stopColor={Colors.success} stopOpacity="0.0" />
                </SvgGradient>

                <Mask id="dottedMaskFree">
                  <Rect width="100%" height="100%" fill="url(#dotFadeFree)" />
                </Mask>

                <Pattern
                  id="dotPatternFree"
                  width="14"
                  height="14"
                  patternUnits="userSpaceOnUse"
                >
                  <Circle cx="3" cy="3" r="1.4" fill={Colors.success} />
                </Pattern>
              </Defs>

              <Rect
                width="100%"
                height="100%"
                fill="url(#dotPatternFree)"
                mask="url(#dottedMaskFree)"
              />
            </Svg>
          </View>

          {/* Animated Shining Light Beam */}
          <Animated.View
            style={[
              styles.shineBeam,
              {
                transform: [{ translateX }, { rotate: "22deg" }],
              },
            ]}
            pointerEvents="none"
          >
            <LinearGradient
              colors={[
                "rgba(255, 255, 255, 0)",
                "rgba(255, 255, 255, 0.45)",
                "rgba(255, 255, 255, 0)",
              ]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={StyleSheet.absoluteFill}
            />
          </Animated.View>
        </View>

        {/* Left Side: Content */}
        <View style={styles.contentSection}>
          <View style={styles.badgeRow}>
            <LinearGradient
              colors={["#FF9500", "#FF3B30"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.popularBadge}
            >
              <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                <Ionicons name="flame" size={11} color={Colors.neutral.white} />
              </Animated.View>
              <Text style={styles.popularBadgeText}>MOST POPULAR</Text>
            </LinearGradient>

            <View style={styles.badge}>
              <Text style={styles.badgeText}>FREE SERVICE</Text>
            </View>
          </View>

          <Text style={styles.title}>Free Installation</Text>
          <Text style={styles.subtitle}>AC, Washer, Geyser & Hoods</Text>

          <View style={styles.locationRow}>
            <View style={styles.ratingPill}>
              <Ionicons name="star" size={10} color="#FFB800" />
              <Text style={styles.ratingText}>4.9 (2.4k+)</Text>
            </View>
            <Text style={styles.dotSeparator}>•</Text>
            <Ionicons name="location" size={11} color={Colors.text.tertiary} />
            <Text style={styles.locationText}>3 Major Cities</Text>
          </View>
        </View>

        {/* Right Side: Action & Floating 3D Image */}
        <View style={styles.imageSection}>
          <Animated.Image
            source={require("@/assets/images/free_installation_tech.png")}
            style={[
              styles.techImage,
              {
                transform: [{ translateY: floatTranslateY }],
              },
            ]}
            resizeMode="contain"
          />

          <View style={styles.circleArrow}>
            <Ionicons name="arrow-forward" size={14} color={Colors.neutral.white} />
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.xs,
    ...Shadows.sm,
    elevation: 3,
  },
  cardWrapper: {
    flexDirection: "row",
    backgroundColor: Colors.neutral.white,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border.light,
    overflow: "visible", // Allow 3D pop-out effect above card
    minHeight: 110,
    position: "relative",
  },
  blobClipContainer: {
    ...StyleSheet.absoluteFill,
    borderRadius: BorderRadius.lg,
    overflow: "hidden",
  },
  shineBeam: {
    position: "absolute",
    top: -60,
    bottom: -60,
    width: 70,
    zIndex: 2,
  },
  contentSection: {
    flex: 1,
    padding: Spacing.md,
    paddingLeft: Spacing.lg,
    justifyContent: "center",
    zIndex: 1,
  },
  badgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: Spacing.sm,
    flexWrap: "wrap",
  },
  popularBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
    ...Shadows.sm,
  },
  popularBadgeText: {
    fontSize: 9,
    fontWeight: "900",
    color: Colors.neutral.white,
    letterSpacing: 0.5,
  },
  badge: {
    backgroundColor: Colors.success + "15",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
    alignSelf: "flex-start",
  },
  badgeText: {
    fontSize: 9,
    fontWeight: "800",
    color: Colors.success,
    letterSpacing: 0.5,
  },
  title: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.bold,
    color: Colors.text.primary,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.medium,
    color: Colors.text.secondary,
    marginBottom: Spacing.sm,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  ratingPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "#FFF9E6",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#FFE599",
  },
  ratingText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#B37B00",
  },
  dotSeparator: {
    fontSize: 10,
    color: Colors.text.tertiary,
    marginHorizontal: 1,
  },
  locationText: {
    fontSize: Typography.sizes.xs - 1,
    color: Colors.text.tertiary,
  },
  imageSection: {
    width: 115,
    justifyContent: "flex-end",
    alignItems: "center",
    position: "relative",
    overflow: "visible",
  },
  imageBackgroundBlob: {
    position: "absolute",
    width: 150,
    height: 130,
    borderRadius: 65,
    right: -25,
    top: -10,
  },
  techImage: {
    width: 135,
    height: 135,
    position: "absolute",
    top: -15, // Pop out 24px above top edge of card
    bottom: -1,
    right: -5,
    zIndex: 2,
  },
  circleArrow: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.success,
    justifyContent: "center",
    alignItems: "center",
    position: "absolute",
    bottom: Spacing.md,
    right: Spacing.md,
    zIndex: 3,
    ...Shadows.sm,
  },
});
