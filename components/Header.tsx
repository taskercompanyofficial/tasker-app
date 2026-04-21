import Colors from "@/constants/Colors";
import { Spacing } from "@/constants/Styles";
import { useAuthStore } from "@/context/auth-store";
import { useEcho } from "@/context/EchoProvider";
import { router } from "expo-router";
import React from "react";
import {
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import NotificationBell from "./common/NotificationBell";

interface HeaderProps {
  title?: string;
  showProfile?: boolean;
  showGreeting?: boolean;
}

export default function Header({
  title = "Tasker",
  showProfile = true,
  showGreeting = false,
}: HeaderProps) {
  const appMode = useAuthStore((state) => state.appMode);
  const user = useAuthStore((state) => state.user);
  const { isConnected, connectionState } = useEcho();
  const isVendor = appMode === "vendor" || appMode === "vendor_staff";
  const theme = isVendor ? Colors.themes.provider : Colors.themes.customer;

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  };

  /** Live connection badge */
  const ConnectionStatus = () => {
    const isLive = isConnected;
    const isConnecting = connectionState === "connecting" || connectionState === "initialized";
    const dotColor = isLive ? Colors.success : isConnecting ? "#F59E0B" : Colors.error;
    const label = isLive ? "Online" : isConnecting ? "Connecting" : "Offline";

    return (
      <View style={styles.statusWrap}>
        <View style={[styles.statusDot, { backgroundColor: dotColor }]} />
        <Text style={[styles.statusText, { color: dotColor }]}>{label}</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor={"#fff"} barStyle="dark-content" />
      <View style={styles.content}>
        <View style={styles.leftSection}>
          {showGreeting && user ? (
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() =>
                router.push((isVendor ? "/vendor/settings" : "/customer/settings") as any)
              }
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={styles.greeting}>{getGreeting()}</Text>
                <ConnectionStatus />
              </View>
              <Text style={styles.userName}>
                {user.name || `${user.first_name} ${user.last_name}`}
              </Text>
            </TouchableOpacity>
          ) : (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text style={styles.title}>{title}</Text>
              <ConnectionStatus />
            </View>
          )}
        </View>

        <View style={styles.rightSection}>
          <NotificationBell />

          {showProfile && user && (
            <TouchableOpacity
              style={styles.profileButton}
              activeOpacity={0.7}
              onPress={() =>
                router.push((isVendor ? "/vendor/settings" : "/customer/settings") as any)
              }
            >
              <View
                style={[
                  styles.avatarPlaceholder,
                  { backgroundColor: theme.primary },
                ]}
              >
                <Text style={styles.avatarText}>
                  {user.name?.charAt(0).toUpperCase() ||
                    user.first_name?.charAt(0).toUpperCase()}
                </Text>
              </View>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.neutral.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  leftSection: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.neutral.black,
  },
  greeting: {
    fontSize: 12,
    color: Colors.neutral.gray[600],
    // marginBottom: 2,
  },
  userName: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.neutral.black,
  },
  rightSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  profileButton: {
    marginLeft: Spacing.xs,
  },
  avatarPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.neutral.white,
  },
  statusWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 9,
    fontWeight: '700',
    textTransform: 'uppercase',
  }
});
