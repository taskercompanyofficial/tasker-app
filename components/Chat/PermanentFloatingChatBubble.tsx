import React, { useEffect, useRef } from "react";
import {
  TouchableOpacity,
  StyleSheet,
  Platform,
  View,
  Text,
  Animated,
  Easing,
  Image,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { usePathname, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Colors from "@/constants/Colors";
import * as Haptics from "expo-haptics";
import { useSession } from "@/context/ctx";

interface PermanentFloatingChatBubbleProps {
  workOrderId?: number | string;
  conversationId?: number | string;
}

export function PermanentFloatingChatBubble({ workOrderId, conversationId }: PermanentFloatingChatBubbleProps = {}) {
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const { session } = useSession();

  // Animation values
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

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

  // Hide floating bubble if currently on any active chat screen
  const isChatScreen =
    pathname.includes("support-chat") ||
    pathname.includes("order-chat") ||
    pathname.includes("work-order-chat") ||
    pathname.endsWith("/chat");

  if (isChatScreen) {
    return null;
  }

  // Determine if on a tab screen to offset above bottom tab navigation
  const isTabScreen =
    pathname.includes("(tabs)") ||
    pathname === "/customer" ||
    pathname === "/customer/" ||
    pathname.includes("/customer/home") ||
    pathname.includes("/customer/orders") ||
    pathname.includes("/customer/services") ||
    pathname.includes("/customer/wallet") ||
    pathname.includes("/customer/settings");

  const bottomOffset = isTabScreen
    ? Math.max(insets.bottom + 65, 88)
    : Math.max(insets.bottom + 20, 32);

  const handlePress = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {}

    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.88,
        duration: 90,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 90,
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
    <Animated.View
      style={[
        styles.container,
        {
          bottom: bottomOffset,
          transform: [{ scale: scaleAnim }],
        },
      ]}
      pointerEvents="box-none"
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
    top: -5,
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
