import AppText from "@/components/common/AppText";
/**
 * VendorActiveTripBubble
 *
 * A globally visible, draggable floating badge that appears whenever the vendor
 * has an active work order in progress. It hovers over all screens so the vendor
 * can always see they are being tracked and tap to return to the job screen.
 *
 * ─ Appears on: all vendor screens while an active work order is set in the store
 * ─ Draggable: PanResponder + Animated (no lib needed)
 * ─ Tap: navigates back to work-order-details/[id]
 * ─ Auto-hides: when vendor is already on the work order detail screen
 *
 * Add this to _layout.tsx inside <VoiceCallProvider> so it renders globally.
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import Colors from "@/constants/Colors";
import { Ionicons } from "@expo/vector-icons";

import { router, usePathname } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  Animated,
  PanResponder,
  Pressable,
  StyleSheet,
  View,
  Dimensions,
} from "react-native";

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get("window");
const BUBBLE_SIZE = 64;
const EDGE_MARGIN = 12;

// ─────────────────────────────────────────────────────────────────────────────
// Minimal active-trip store — set this from UberVendorWorkOrderView
// ─────────────────────────────────────────────────────────────────────────────

interface ActiveTripInfo {
  workOrderId: string | number;
  workOrderNumber: string;
  customerName?: string;
}

type Listener = () => void;

let _trip: ActiveTripInfo | null = null;
const _listeners = new Set<Listener>();

const notify = () => _listeners.forEach((l) => l());

export const activeTripStore = {
  get: () => _trip,

  /** Call from UberVendorWorkOrderView when tracking starts */
  setTrip: (trip: ActiveTripInfo | null) => {
    _trip = trip;
    if (trip) {
      AsyncStorage.setItem("active_trip_info", JSON.stringify(trip)).catch(() => {});
    } else {
      AsyncStorage.removeItem("active_trip_info").catch(() => {});
    }
    notify();
  },

  subscribe: (listener: Listener) => {
    _listeners.add(listener);
    return () => {
      _listeners.delete(listener);
    };
  },
};


// ─────────────────────────────────────────────────────────────────────────────
// The floating bubble component
// ─────────────────────────────────────────────────────────────────────────────

export default function VendorActiveTripBubble() {
  const pathname = usePathname();
  const [trip, setTrip] = useState<ActiveTripInfo | null>(_trip);

  // Snap to edge (left or right) when drag ends
  const pan = useRef(
    new Animated.ValueXY({
      x: SCREEN_W - BUBBLE_SIZE - EDGE_MARGIN,
      y: SCREEN_H * 0.55,
    })
  ).current;

  const scaleAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Subscribe to active trip store
  useEffect(() => {
    // Hydrate from storage if active trip exists
    AsyncStorage.getItem("active_trip_info").then((saved) => {
      if (saved && !activeTripStore.get()) {
        try {
          const parsed = JSON.parse(saved);
          activeTripStore.setTrip(parsed);
        } catch (_) {}
      }
    });

    const unsub = activeTripStore.subscribe(() => {
      setTrip(activeTripStore.get());
    });
    return () => {
      unsub();
    };
  }, []);


  // Animate in/out
  useEffect(() => {
    const shouldShow = !!trip && !isOnWorkOrderScreen(pathname);
    Animated.spring(scaleAnim, {
      toValue: shouldShow ? 1 : 0,
      useNativeDriver: true,
      tension: 80,
      friction: 8,
    }).start();
  }, [trip, pathname]);

  // Pulsing green ring animation
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.25,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gs) =>
        Math.abs(gs.dx) > 4 || Math.abs(gs.dy) > 4,

      onPanResponderGrant: () => {
        // Capture current position as offset so we can move from here
        pan.extractOffset();
      },

      onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], {
        useNativeDriver: false,
      }),

      onPanResponderRelease: (_, gs) => {
        pan.flattenOffset();

        // Read current x to decide which side to snap to
        const currentX = (pan.x as any)._value as number;
        const snapToRight = currentX > SCREEN_W / 2 - BUBBLE_SIZE / 2;

        const targetX = snapToRight
          ? SCREEN_W - BUBBLE_SIZE - EDGE_MARGIN
          : EDGE_MARGIN;

        // Clamp Y within screen bounds
        const currentY = (pan.y as any)._value as number;
        const clampedY = Math.max(
          80,
          Math.min(currentY, SCREEN_H - BUBBLE_SIZE - 80)
        );

        Animated.parallel([
          Animated.spring(pan.x, {
            toValue: targetX,
            useNativeDriver: false,
            tension: 100,
            friction: 12,
          }),
          Animated.spring(pan.y, {
            toValue: clampedY,
            useNativeDriver: false,
            tension: 100,
            friction: 12,
          }),
        ]).start();
      },
    })
  ).current;

  // Don't render if no trip or already on the job screen
  if (!trip || isOnWorkOrderScreen(pathname)) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [
            { translateX: pan.x },
            { translateY: pan.y },
            { scale: scaleAnim },
          ],
        },
      ]}
      {...panResponder.panHandlers}
    >
      {/* Pulsing ring behind bubble */}
      <Animated.View
        style={[
          styles.pulseRing,
          { transform: [{ scale: pulseAnim }] },
        ]}
        pointerEvents="none"
      />

      <Pressable
        style={styles.bubble}
        onPress={() => {
          router.push(
            `/vendor/work-order-details/${trip.workOrderId}` as any
          );
        }}
      >
        {/* Icon */}
        <Ionicons name="navigate-circle" size={28} color={Colors.neutral.white} />

        {/* Live dot */}
        <View style={styles.liveDot} />
      </Pressable>

      {/* Label below bubble */}
      <View style={styles.label} pointerEvents="none">
        <AppText style={styles.labelText} numberOfLines={1}>
          #{trip.workOrderNumber}
        </AppText>
      </View>
    </Animated.View>
  );
}

function isOnWorkOrderScreen(pathname: string): boolean {
  return (
    pathname.includes("work-order-details") ||
    pathname.includes("work-order-edit")
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    zIndex: 9999,
    elevation: 9999,
    alignItems: "center",
    width: BUBBLE_SIZE,
  },
  pulseRing: {
    position: "absolute",
    width: BUBBLE_SIZE,
    height: BUBBLE_SIZE,
    borderRadius: BUBBLE_SIZE / 2,
    backgroundColor: "rgba(16, 185, 129, 0.25)",
    top: 0,
  },
  bubble: {
    width: BUBBLE_SIZE,
    height: BUBBLE_SIZE,
    borderRadius: BUBBLE_SIZE / 2,
    backgroundColor: Colors.themes.provider.primary,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 12,
  },
  liveDot: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#10B981",
    borderWidth: 2,
    borderColor: Colors.neutral.white,
  },
  label: {
    marginTop: 4,
    backgroundColor: "rgba(0,0,0,0.65)",
    borderRadius: 6,
    paddingHorizontal: 5,
    paddingVertical: 2,
    maxWidth: 80,
  },
  labelText: {
    color: Colors.neutral.white,
    fontSize: 10,
    fontWeight: "700",
    textAlign: "center",
  },
});
