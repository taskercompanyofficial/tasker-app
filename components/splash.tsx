import React, { useEffect, useRef } from "react";
import {
  Animated,
  Dimensions,
  Easing,
  Image,
  StyleSheet,
  Text,
  View,
} from "react-native";

const { width } = Dimensions.get("window");
const LOGO_WIDTH = width * 0.82;
const LOGO_HEIGHT = 150;

export default function Splash() {
  // Left-to-right reveal scale: 0 to 1
  const revealScale = useRef(new Animated.Value(0)).current;

  // Glassy sheen sweep animation: -100 to LOGO_WIDTH + 100
  const shineTranslateX = useRef(new Animated.Value(-100)).current;

  // Glass reflection flare scale: 1 to 1.02
  const glassScale = useRef(new Animated.Value(1)).current;

  // Bottom text animation: 0 to 1
  const textOpacity = useRef(new Animated.Value(0)).current;
  const textTranslateY = useRef(new Animated.Value(12)).current;

  useEffect(() => {
    // 1. Left-to-right reveal scale animation
    Animated.timing(revealScale, {
      toValue: 1,
      duration: 1100,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start(() => {
      // 2. Text entrance
      Animated.parallel([
        Animated.timing(textOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(textTranslateY, {
          toValue: 0,
          duration: 500,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();

      // 3. Continuous glassy light sweep & micro glass flare pulse
      Animated.loop(
        Animated.sequence([
          Animated.parallel([
            Animated.timing(shineTranslateX, {
              toValue: LOGO_WIDTH + 100,
              duration: 1300,
              easing: Easing.inOut(Easing.quad),
              useNativeDriver: true,
            }),
            Animated.sequence([
              Animated.timing(glassScale, {
                toValue: 1.02,
                duration: 650,
                easing: Easing.out(Easing.quad),
                useNativeDriver: false,
              }),
              Animated.timing(glassScale, {
                toValue: 1,
                duration: 650,
                easing: Easing.in(Easing.quad),
                useNativeDriver: false,
              }),
            ]),
          ]),
          Animated.delay(1400),
          Animated.timing(shineTranslateX, {
            toValue: -100,
            duration: 0,
            useNativeDriver: true,
          }),
        ])
      ).start();
    });
  }, []);

  const animatedWidth = revealScale.interpolate({
    inputRange: [0, 1],
    outputRange: [0, LOGO_WIDTH],
  });

  return (
    <View style={styles.container}>
      {/* Centered Glassy Container */}
      <View style={styles.glassCardContainer}>
        {/* Animated Left-to-Right Reveal Mask */}
        <Animated.View
          style={[
            styles.revealMask,
            {
              width: animatedWidth,
              transform: [{ scale: glassScale }],
            },
          ]}
        >
          <Image
            source={require("@/assets/icons/tasker-logo.png")}
            style={styles.logoImage}
            resizeMode="contain"
          />

          {/* Dual-Layer Glass Prism Light Beam */}
          <Animated.View
            style={[
              styles.glassBeamContainer,
              {
                transform: [
                  { translateX: shineTranslateX },
                  { rotate: "22deg" },
                ],
              },
            ]}
          >
            {/* Diffuse Outer Glass Glow */}
            <View style={styles.glassOuterGlow} />
            {/* Sharp Inner Glass Glare Core */}
            <View style={styles.glassInnerCore} />
          </Animated.View>
        </Animated.View>
      </View>

      {/* Bottom Text */}
      <Animated.View
        style={[
          styles.footer,
          {
            opacity: textOpacity,
            transform: [{ translateY: textTranslateY }],
          },
        ]}
      >
        <Text style={styles.footerTagline}>
          Complete Home & Industrial Solutions
        </Text>
        <Text style={styles.footerVersion}>Tasker Company v1.0.0</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  glassCardContainer: {
    width: LOGO_WIDTH,
    height: LOGO_HEIGHT,
    justifyContent: "center",
    alignItems: "center",
    padding: 12,
  },
  revealMask: {
    height: LOGO_HEIGHT,
    overflow: "hidden",
    position: "relative",
    justifyContent: "center",
    alignItems: "flex-start",
  },
  logoImage: {
    width: LOGO_WIDTH,
    height: LOGO_HEIGHT,
  },
  glassBeamContainer: {
    position: "absolute",
    top: -50,
    bottom: -50,
    width: 65,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  glassOuterGlow: {
    position: "absolute",
    width: 65,
    height: "100%",
    backgroundColor: "rgba(255, 255, 255, 0.45)",
    borderRadius: 30,
  },
  glassInnerCore: {
    width: 14,
    height: "100%",
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    shadowColor: "#ffffff",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 15,
    elevation: 8,
    borderRadius: 7,
  },
  footer: {
    position: "absolute",
    bottom: 45,
    alignItems: "center",
  },
  footerTagline: {
    fontSize: 12,
    fontWeight: "600",
    color: "#334155",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  footerVersion: {
    fontSize: 11,
    color: "#94A3B8",
    fontWeight: "400",
  },
});
