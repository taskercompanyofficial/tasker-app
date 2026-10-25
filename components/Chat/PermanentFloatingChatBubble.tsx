import Colors from "@/constants/Colors";
import { useSession } from "@/context/ctx";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { usePathname, useRouter, useSegments } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Image,
  Keyboard,
  Platform,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface PermanentFloatingChatBubbleProps {
  workOrderId?: number | string;
  conversationId?: number | string;
}

export function PermanentFloatingChatBubble({
  workOrderId,
  conversationId,
}: PermanentFloatingChatBubbleProps = {}) {
  const router = useRouter();
  const pathname = usePathname();
  const segments = useSegments();
  const insets = useSafeAreaInsets();
  const { session } = useSession();

  // Animation values
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Keyboard visibility state (hide bubble when typing so it never blocks inputs)
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  useEffect(() => {
    const showSub = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow",
      () => setKeyboardVisible(true)
    );
    const hideSub = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide",
      () => setKeyboardVisible(false)
    );
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  // Pulse animation for online indicator
  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.4,
          duration: 1200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [pulseAnim]);

  // Hide floating bubble if currently on any active chat screen or during keyboard typing
  const isChatScreen =
    pathname.includes("support-chat") ||
    pathname.includes("order-chat") ||
    pathname.includes("work-order-chat") ||
    pathname.endsWith("/chat");

  // Robust check for whether current screen has bottom tab navigation
  const isTabScreen = useMemo(() => {
    // 1. Segment inspection: check if '(tabs)' is part of the active route hierarchy
    if (segments.some((seg) => seg === "(tabs)")) {
      return true;
    }

    if (pathname.includes("(tabs)")) {
      return true;
    }

    // 2. Customer Tab routes
    if (pathname.startsWith("/customer")) {
      // Explicit tab pages
      if (
        pathname === "/customer/orders" ||
        pathname === "/customer/services" ||
        pathname === "/customer/settings" ||
        pathname === "/customer/wallet"
      ) {
        return true;
      }

      // Check if it's the customer category hub tab: e.g. /customer/cleaning, /customer/solar-system
      // (which is outside known non-tab stack subpaths)
      const nonTabCustomerPrefixes = [
        "/customer/services/",
        "/customer/orders/",
        "/customer/profile/",
        "/customer/notifications",
        "/customer/commercial-quote",
        "/customer/contact-us",
        "/customer/free-installation",
        "/customer/shop",
        "/customer/gifts",
        "/customer/support-chat",
        "/customer/order-chat",
        "/customer/complete-profile",
      ];

      const isNonTabPath = nonTabCustomerPrefixes.some((prefix) =>
        pathname.startsWith(prefix)
      );

      // If not the landing screen (/customer or /customer/) and not a non-tab stack route,
      // then it's the main category hub tab [slug]!
      if (!isNonTabPath && pathname !== "/customer" && pathname !== "/customer/") {
        return true;
      }
    }

    // 3. Vendor Tab routes
    if (pathname.startsWith("/vendor")) {
      const vendorTabPaths = [
        "/vendor/dashboard",
        "/vendor/jobs",
        "/vendor/ledger",
        "/vendor/earnings",
        "/vendor/settings",
      ];
      if (
        vendorTabPaths.some(
          (p) => pathname === p || pathname.startsWith(`${p}/`)
        )
      ) {
        return true;
      }
    }

    return false;
  }, [segments, pathname]);

  // Accurate bottom offset based on bottom tabs + safe area insets
  const targetBottomOffset = useMemo(() => {
    if (isTabScreen) {
      // Sits safely above the NativeTabs bar (~65-75px height)
      return Math.max(insets.bottom + 85, 96);
    }
    // On regular stack screens without bottom tabs
    return Math.max(insets.bottom + 24, 28);
  }, [isTabScreen, insets.bottom]);

  if (isChatScreen || keyboardVisible) {
    return null;
  }

  const handlePress = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {}

    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.88,
        duration: 80,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 80,
        useNativeDriver: true,
      }),
    ]).start();

    if (session.appMode === "vendor" || session.appMode === "vendor_staff") {
      router.push("/vendor/support-chat" as any);
    } else {
      router.push("/customer/support-chat" as any);
    }
  };

  return (
    <View
      style={[
        styles.container,
        {
          bottom: targetBottomOffset,
        },
      ]}
      pointerEvents="box-none"
    >
      <Animated.View
        style={{
          transform: [{ scale: scaleAnim }],
        }}
      >
        <TouchableOpacity
          style={styles.bubbleButton}
          onPress={handlePress}
          activeOpacity={0.9}
        >
          {/* Pulse glow background ring */}
          <Animated.View
            style={[
              styles.pulseRing,
              {
                transform: [{ scale: pulseAnim }],
                opacity: pulseAnim.interpolate({
                  inputRange: [1, 1.4],
                  outputRange: [0.35, 0],
                }),
              },
            ]}
          />

          {/* Main Icon and badge */}
          <View style={styles.iconWrapper}>
            <Image
              source={require("@/assets/images/tasker-ai-avatar.jpg")}
              style={styles.avatarImg}
              resizeMode="cover"
            />
            <View style={styles.sparkleBadge}>
              <Ionicons name="sparkles" size={10} color="#FFFFFF" />
            </View>
          </View>

          {/* Online Status Dot */}
          <View style={styles.onlineDot} />
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    right: 18,
    zIndex: 99999,
    elevation: 99999,
    alignItems: "center",
    justifyContent: "center",
  },
  bubbleButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.themes.customer.primary,
    justifyContent: "center",
    alignItems: "center",
    ...Platform.select({
      ios: {
        shadowColor: Colors.themes.customer.primary,
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.45,
        shadowRadius: 7,
      },
      android: {
        elevation: 10,
      },
    }),
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  pulseRing: {
    position: "absolute",
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: Colors.themes.customer.primary,
  },
  iconWrapper: {
    position: "relative",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarImg: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  sparkleBadge: {
    position: "absolute",
    top: -25,
    right: -7,
    backgroundColor: "#10B981",
    width: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#FFFFFF",
  },
  onlineDot: {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: 11,
    height: 11,
    borderRadius: 5.5,
    backgroundColor: "#22C55E",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
});
