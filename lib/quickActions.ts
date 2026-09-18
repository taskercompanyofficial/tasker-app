import * as QuickActions from "expo-quick-actions";
import { Linking, Platform } from "react-native";
import { router } from "expo-router";
import type { AppMode } from "@/context/auth-store";

export const HELPLINE_PHONE_NUMBER = "+923001234567";

/**
 * Configure Dynamic Quick Actions for App Icon Long-Press (iOS 3D Touch & Android Shortcuts)
 */
export function setupQuickActions(userType?: AppMode | "guest" | null) {
  try {
    if (Platform.OS === "web") return;

    if (userType === "vendor" || userType === "vendor_staff") {
      QuickActions.setItems([
        {
          id: "call_helpline",
          title: "Call 24/7 Helpline",
          subtitle: "Vendor Priority Support",
          icon: Platform.OS === "ios" ? "symbol:phone.fill" : "shortcut_phone",
          params: { action: "call", phone: HELPLINE_PHONE_NUMBER },
        },
        {
          id: "vendor_jobs",
          title: "Available Jobs",
          subtitle: "View customer work orders",
          icon: Platform.OS === "ios" ? "symbol:briefcase.fill" : "shortcut_jobs",
          params: { action: "navigate", href: "/vendor/(tabs)/orders" },
        },
        {
          id: "vendor_dashboard",
          title: "Vendor Console",
          subtitle: "Earnings & Performance",
          icon: Platform.OS === "ios" ? "symbol:chart.bar.fill" : "shortcut_dashboard",
          params: { action: "navigate", href: "/vendor/(tabs)/dashboard" },
        },
      ]);
    } else {
      QuickActions.setItems([
        {
          id: "call_helpline",
          title: "Call 24/7 Helpline",
          subtitle: "Emergency & Customer Support",
          icon: Platform.OS === "ios" ? "symbol:phone.fill" : "shortcut_phone",
          params: { action: "call", phone: HELPLINE_PHONE_NUMBER },
        },
        {
          id: "active_orders",
          title: "My Active Bookings",
          subtitle: "Track live status & taskers",
          icon: Platform.OS === "ios" ? "symbol:list.clipboard.fill" : "shortcut_orders",
          params: { action: "navigate", href: "/customer/orders" },
        },
        {
          id: "book_service",
          title: "Book a Service",
          subtitle: "Find verified pros nearby",
          icon: Platform.OS === "ios" ? "symbol:magnifyingglass" : "shortcut_search",
          params: { action: "navigate", href: "/customer/explore" },
        },
      ]);
    }
  } catch (error) {
    console.warn("[QuickActions] Setup error:", error);
  }
}

/**
 * Handler for when user selects a Quick Action item from their home screen
 */
export function handleQuickAction(action: QuickActions.Action | null) {
  if (!action) return;

  try {
    const params = action.params as { action?: string; href?: string; phone?: string } | undefined;

    if (params?.action === "call" && params.phone) {
      void Linking.openURL(`tel:${params.phone}`);
      return;
    }

    if (params?.action === "navigate" && params.href) {
      router.push(params.href as any);
      return;
    }

    // Default fallback by action ID
    if (action.id === "call_helpline") {
      void Linking.openURL(`tel:${HELPLINE_PHONE_NUMBER}`);
    } else if (action.id === "active_orders") {
      router.push("/customer/orders" as any);
    } else if (action.id === "book_service") {
      router.push("/customer/explore" as any);
    } else if (action.id === "vendor_jobs" || action.id === "vendor_dashboard") {
      router.push("/vendor/(tabs)/dashboard" as any);
    }
  } catch (err) {
    console.warn("[QuickActions] Execution error:", err);
  }
}
