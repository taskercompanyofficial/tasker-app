import Colors from "@/constants/Colors";
import { Typography } from "@/constants/Styles";
import { useSession } from "@/context/ctx";
import { Ionicons } from "@expo/vector-icons";
import { Redirect, Tabs } from "expo-router";
import React, { useRef } from "react";
import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const bellStyles = StyleSheet.create({
  wrap: {
    position: "relative",
  },
  badge: {
    position: "absolute",
    top: -4,
    right: -6,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: Colors.error,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: "#fff",
  },
  badgeText: {
    fontSize: 9,
    fontWeight: "800",
    color: "#fff",
    lineHeight: 12,
  },
});

export default function VendorTabsLayout() {
  const insets = useSafeAreaInsets();
  const { session } = useSession();
  const renderCountRef = useRef(0);
  renderCountRef.current += 1;
  if (renderCountRef.current <= 20) {
    // #region agent log
    fetch("http://127.0.0.1:7789/ingest/e7df05fe-e28b-4c90-971d-c6d804cac73a", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Debug-Session-Id": "54d0b8",
      },
      body: JSON.stringify({
        sessionId: "54d0b8",
        runId: "initial",
        hypothesisId: "H6_vendor_tabs_rerender_loop",
        location: "app/vendor/(tabs)/_layout.tsx:43",
        message: "Vendor tabs layout render count",
        data: {
          renderCount: renderCountRef.current,
          appMode: session.appMode,
          isAuthenticated: session.isAuthenticated,
        },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion
  }
  // #region agent log
  fetch("http://127.0.0.1:7789/ingest/e7df05fe-e28b-4c90-971d-c6d804cac73a", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Debug-Session-Id": "54d0b8",
    },
    body: JSON.stringify({
      sessionId: "54d0b8",
      runId: "initial",
      hypothesisId: "H2_tab_guard_rejects_session",
      location: "app/vendor/(tabs)/_layout.tsx:40",
      message: "Vendor tabs guard input state",
      data: {
        isAuthenticated: session.isAuthenticated,
        appMode: session.appMode,
        userType: (session.user as any)?.user_type ?? null,
      },
      timestamp: Date.now(),
    }),
  }).catch(() => {});
  // #endregion

  if (!session.isAuthenticated || (session.appMode !== "vendor" && session.appMode !== "vendor_staff")) {
    return <Redirect href="/" />;
  }

  const isStaff = session.appMode === "vendor_staff" || (session.user as any)?.user_type === "vendor_staff";

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.themes.provider.primary,
        tabBarInactiveTintColor: Colors.text.tertiary,
        tabBarStyle: {
          backgroundColor: Colors.neutral.white,
          borderTopWidth: 1,
          borderTopColor: Colors.border.light,
          height: 50 + insets.bottom,
          paddingBottom: insets.bottom + 4,
          paddingTop: 4,
          elevation: 2,
          shadowColor: Colors.neutral.black,
          shadowOffset: { width: 0, height: -1 },
          shadowOpacity: 0.06,
          shadowRadius: 2,
        },
        tabBarLabelStyle: {
          fontSize: 9,
          fontWeight: Typography.weights.semibold,
          marginTop: 1,
        },
        tabBarIconStyle: {
          marginTop: 1,
        },
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: "Home",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "home" : "home-outline"} size={20} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="jobs"
        options={{
          title: "Jobs",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "briefcase" : "briefcase-outline"}
              size={20}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: "Chat",
          tabBarIcon: ({ color, focused }) => (
            <View style={{ position: 'relative' }}>
              <Ionicons
                name={focused ? "chatbubbles" : "chatbubbles-outline"}
                size={20}
                color={color}
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="ledger"
        options={{
          title: "Rates",
          href: isStaff ? null : undefined,
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "list-circle" : "list-circle-outline"}
              size={22}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="earnings"
        options={{
          title: "Account",
          href: isStaff ? null : undefined,
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "wallet" : "wallet-outline"} size={20} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "settings" : "settings-outline"}
              size={20}
              color={color}
            />
          ),
        }}
      />
    </Tabs>
  );
}
