import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Colors from "@/constants/Colors";
import { Typography } from "@/constants/Styles";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useSession } from "@/context/ctx";
import { useEcho } from "@/context/EchoProvider";
import { View, Text, StyleSheet } from "react-native";

/** Bell icon with a live unread badge */
function NotificationBell({ color, focused }: { color: string; focused: boolean }) {
  const { realtimeUnreadCount } = useEcho();
  return (
    <View style={bellStyles.wrap}>
      <Ionicons
        name={focused ? "notifications" : "notifications-outline"}
        size={22}
        color={color}
      />
      {realtimeUnreadCount > 0 && (
        <View style={bellStyles.badge}>
          <Text style={bellStyles.badgeText}>
            {realtimeUnreadCount > 9 ? "9+" : realtimeUnreadCount}
          </Text>
        </View>
      )}
    </View>
  );
}

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
          title: "Earnings",
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
