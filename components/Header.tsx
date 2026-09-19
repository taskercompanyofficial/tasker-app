import Colors from "@/constants/Colors";
import { Spacing } from "@/constants/Styles";
import { useAuthStore } from "@/context/auth-store";
import { useEcho } from "@/context/EchoProvider";
import { router } from "expo-router";
import {
  Image,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useColorScheme,
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

  /** Live connection badge (only displayed for vendors/technicians) */
  const ConnectionStatus = () => {
    if (!isVendor) return null;
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

  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const rawAvatar =
    (user as any)?.active_avatar_url ||
    (user as any)?.daily_selfie_image ||
    (user as any)?.profile_image ||
    user?.avatar_url ||
    null;

  const avatarUri = rawAvatar
    ? rawAvatar.startsWith("http")
      ? rawAvatar
      : rawAvatar.startsWith("/")
      ? rawAvatar
      : `/${rawAvatar}`
    : null;

  const isPartnerOnline = Boolean(
    isVendor &&
      ((user as any)?.is_online || (user as any)?.online_status === "online")
  );

  return (
    <View style={styles.container}>
      <StatusBar
        backgroundColor={
          isDark ? "rgba(0, 0, 0, 0.40)" : "rgba(255, 255, 255, 0.40)"
        }
        barStyle={isDark ? "light-content" : "dark-content"}
        translucent
      />
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
              <View style={styles.avatarContainer}>
                {avatarUri ? (
                  <Image source={{ uri: avatarUri }} style={styles.avatarImg} />
                ) : (
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
                )}
                {isVendor && (
                  <View
                    style={[
                      styles.avatarOnlineBadge,
                      { backgroundColor: isPartnerOnline ? "#10B981" : "#9CA3AF" },
                    ]}
                  />
                )}
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
  avatarContainer: {
    position: "relative",
  },
  avatarImg: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: "#10B981",
  },
  avatarOnlineBadge: {
    position: "absolute",
    bottom: -1,
    right: -1,
    width: 11,
    height: 11,
    borderRadius: 5.5,
    borderWidth: 2,
    borderColor: "#FFFFFF",
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
