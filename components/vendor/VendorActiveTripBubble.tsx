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
  return null;
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
