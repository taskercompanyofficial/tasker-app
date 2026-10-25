import AppText from "@/components/common/AppText";
import DirectionalIcon from "@/components/common/DirectionalIcon";
import Loader from "@/components/Loader";
import Colors from "@/constants/Colors";
import { Spacing } from "@/constants/Styles";
import { useEcho } from "@/context/EchoProvider";
import {
  VENDOR_NOTIFICATIONS_MARK_ALL_READ_URL,
  VENDOR_NOTIFICATIONS_MARK_READ_URL,
  VENDOR_NOTIFICATIONS_URL,
} from "@/lib/api-endpoints";
import myAxios from "@/lib/axios.config";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { router, useFocusEffect } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface Notification {
  id: number;
  title: string;
  message: string;
  type: string;
  order_id: number | null;
  read: boolean;
  created_at: string;
  data?: any;
}

export default function VendorNotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const { onNotification, resetRealtimeUnread, connectionState } = useEcho();

  // Reset the bell badge when this page is opened
  useFocusEffect(
    useCallback(() => {
      fetchNotifications();
      resetRealtimeUnread();
    }, []),
  );

  // Listen for real-time notifications and prepend them to the list
  useEffect(() => {
    const unsubscribe = onNotification((event) => {
      const incoming = event.notification;
      const mapped: Notification = {
        id: incoming.id,
        title: incoming.title,
        message: incoming.message,
        type: incoming.type,
        order_id: (incoming.data?.work_order_id as number) ?? null,
        read: false,
        created_at: incoming.created_at,
        data: incoming.data,
      };
      setNotifications((prev) => [mapped, ...prev]);
    });
    return unsubscribe;
  }, [onNotification]);

  const fetchNotifications = async () => {
    try {
      const res = await myAxios.get(VENDOR_NOTIFICATIONS_URL);
      setNotifications(res.data.data || []);
    } catch (error) {
      console.error("Failed to fetch vendor notifications:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchNotifications();
  };

  const markAsRead = async (notificationId: number) => {
    try {
      await myAxios.put(VENDOR_NOTIFICATIONS_MARK_READ_URL(notificationId));
      setNotifications((prev) =>
        prev.map((notif) =>
          notif.id === notificationId ? { ...notif, read: true } : notif,
        ),
      );
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await myAxios.put(VENDOR_NOTIFICATIONS_MARK_ALL_READ_URL);
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (error) {
      console.error("Failed to mark all as read:", error);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "order":
        return "receipt";
      case "free_installation":
        return "construct";
      case "promotion":
        return "pricetag";
      case "ledger_update":
        return "cash";
      case "billing_update":
        return "card";
      case "work_order":
        return "briefcase";
      case "assignment":
        return "person-add";
      default:
        return "notifications";
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case "order":
        return Colors.themes.provider.primary;
      case "free_installation":
        return Colors.success;
      case "promotion":
        return "#10B981";
      case "ledger_update":
        return "#8B5CF6";
      case "billing_update":
        return "#F59E0B";
      case "work_order":
        return Colors.themes.provider.primary;
      case "assignment":
        return "#10B981";
      default:
        return Colors.text.secondary;
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMinutes = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60),
    );
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMinutes < 1) return "Just now";
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const handleNotificationPress = async (notification: Notification) => {
    if (!notification.read) {
      await markAsRead(notification.id);
    }

    const data = notification.data || {};

    // 1. Chat Notifications
    if (notification.type === "chat" || data.type === "chat") {
      if (data.chat_type === "support") {
        router.push("/vendor/support-chat");
      } else if (data.chat_type === "work_order" && data.work_order_id) {
        router.push(`/vendor/work-order-chat/${data.work_order_id}` as any);
      }
      return;
    }

    // 2. Work Order Notifications
    let woId = notification.order_id || data.work_order_id || data.order_id;
    if (woId) {
      router.push(`/vendor/work-order-details/${woId}`);
      return;
    }

    // 3. Ledger/Billing Notifications
    if (
      notification.type === "ledger_update" ||
      notification.type === "billing_update"
    ) {
      // Navigate to ledger tab if it exists, or just dashboard
      router.push("/vendor/(tabs)/dashboard");
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  /** Small dot + label showing WebSocket live status */
  const ConnectionIndicator = () => {
    const isLive = connectionState === "connected";
    const isConnecting =
      connectionState === "connecting" || connectionState === "initialized";
    const dotColor = isLive
      ? Colors.success
      : isConnecting
        ? "#F59E0B"
        : Colors.error;
    const label = isLive ? "Live" : isConnecting ? "Connecting…" : "Offline";
    return (
      <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
        <View style={[styles.statusDot, { backgroundColor: dotColor }]} />
        <AppText style={[styles.statusLabel, { color: dotColor }]}>{label}</AppText>
      </View>
    );
  };

  const renderNotification = ({ item }: { item: Notification }) => {
    const notifImage = item.data?.image || item.data?.image_url;

    // Full-width Rich Media Card for notifications with large banner images (YouTube / modern app style)
    if (notifImage) {
      return (
        <TouchableOpacity
          style={[
            styles.richMediaCard,
            !item.read && styles.richMediaCardUnread,
          ]}
          onPress={() => handleNotificationPress(item)}
          activeOpacity={0.8}
        >
          {/* Full-width 16:9 Large Image Banner */}
          <View style={styles.richBannerContainer}>
            <Image
              source={{ uri: notifImage }}
              style={styles.richBannerImage}
              contentFit="cover"
              transition={250}
            />
            <View style={styles.richBannerBadge}>
              <Ionicons name="sparkles" size={11} color="#FFFFFF" />
              <AppText style={styles.richBannerBadgeText}>ANNOUNCEMENT</AppText>
            </View>
            {!item.read && <View style={styles.richUnreadBadge} />}
          </View>

          {/* Card Body & Details */}
          <View style={styles.richCardBody}>
            <View style={styles.richCardHeader}>
              <View
                style={[
                  styles.richIconSmall,
                  { backgroundColor: `${getNotificationColor(item.type)}18` },
                ]}
              >
                <Ionicons
                  name={getNotificationIcon(item.type) as any}
                  size={15}
                  color={getNotificationColor(item.type)}
                />
              </View>
              <AppText style={styles.richNotificationTitle} numberOfLines={2}>
                {item.title}
              </AppText>
              <AppText style={styles.notificationTime}>{formatTime(item.created_at)}</AppText>
            </View>

            <AppText style={styles.richNotificationMessage} numberOfLines={3}>
              {item.message}
            </AppText>

            <View style={styles.richActionRow}>
              <AppText style={styles.richActionLink}>View Announcement →</AppText>
            </View>
          </View>
        </TouchableOpacity>
      );
    }

    return (
      <TouchableOpacity
        style={[
          styles.notificationCard,
          !item.read && styles.notificationCardUnread,
        ]}
        onPress={() => handleNotificationPress(item)}
        activeOpacity={0.7}
      >
        <View
          style={[
            styles.iconContainer,
            { backgroundColor: `${getNotificationColor(item.type)}15` },
          ]}
        >
          <Ionicons
            name={getNotificationIcon(item.type) as any}
            size={22}
            color={getNotificationColor(item.type)}
          />
        </View>

        <View style={styles.notificationContent}>
          <View style={styles.notificationHeader}>
            <AppText style={styles.notificationTitle} numberOfLines={1}>
              {item.title}
            </AppText>
            <AppText style={styles.notificationTime}>
              {formatTime(item.created_at)}
            </AppText>
          </View>
          <AppText style={styles.notificationMessage} numberOfLines={3}>
            {item.message}
          </AppText>
          {!item.read && <View style={styles.unreadDot} />}
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return <Loader fullScreen />;
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <DirectionalIcon name="arrow-back" size={24} color={Colors.text.primary} />
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <AppText style={styles.headerTitle}>Notifications</AppText>
            <ConnectionIndicator />
          </View>
          {unreadCount > 0 && (
            <AppText style={styles.headerSubtitle}>{unreadCount} unread</AppText>
          )}
        </View>
        {unreadCount > 0 && (
          <TouchableOpacity onPress={markAllAsRead} style={styles.markAllBtn}>
            <AppText style={styles.markAllText}>Mark all read</AppText>
          </TouchableOpacity>
        )}
      </View>

      {/* Notifications List */}
      <FlatList
        data={notifications}
        renderItem={renderNotification}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.themes.provider.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons
              name="notifications-off-outline"
              size={64}
              color={Colors.text.tertiary}
            />
            <AppText style={styles.emptyTitle}>No Notifications</AppText>
            <AppText style={styles.emptyText}>You&apos;re all caught up!</AppText>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.neutral.gray[50],
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.neutral.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.neutral.gray[100],
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.text.primary,
  },
  headerSubtitle: {
    fontSize: 12,
    color: Colors.themes.provider.primary,
    fontWeight: "600",
  },
  markAllBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: Colors.themes.provider.primary + "15",
  },
  markAllText: {
    fontSize: 12,
    color: Colors.themes.provider.primary,
    fontWeight: "700",
  },
  listContainer: {
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  notificationCard: {
    flexDirection: "row",
    backgroundColor: Colors.neutral.white,
    borderRadius: 14,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border.light,
    gap: Spacing.sm,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  notificationCardUnread: {
    backgroundColor: Colors.themes.provider.primary + "06",
    borderColor: Colors.themes.provider.primary + "25",
  },
  iconContainer: {
    width: 46,
    height: 46,
    borderRadius: 23,
    justifyContent: "center",
    alignItems: "center",
    flexShrink: 0,
  },
  notificationContent: {
    flex: 1,
    position: "relative",
  },
  notificationHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 4,
    gap: 8,
  },
  notificationTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: "700",
    color: Colors.text.primary,
  },
  notificationTime: {
    fontSize: 11,
    color: Colors.text.tertiary,
    flexShrink: 0,
  },
  notificationMessage: {
    fontSize: 13,
    color: Colors.text.secondary,
    lineHeight: 18,
  },
  notificationImage: {
    width: "100%",
    height: 120,
    borderRadius: 8,
    marginTop: 8,
    backgroundColor: "#F3F4F6",
  },
  richMediaCard: {
    backgroundColor: Colors.neutral.white,
    borderRadius: 16,
    marginBottom: Spacing.sm,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: Colors.border.light,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  richMediaCardUnread: {
    borderColor: `${Colors.themes.provider.primary}45`,
    backgroundColor: "#FAFAFA",
  },
  richBannerContainer: {
    width: "100%",
    aspectRatio: 16 / 9,
    backgroundColor: "#E5E7EB",
    position: "relative",
  },
  richBannerImage: {
    width: "100%",
    height: "100%",
  },
  richBannerBadge: {
    position: "absolute",
    top: 10,
    left: 10,
    backgroundColor: "rgba(17, 24, 39, 0.78)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  richBannerBadgeText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  richUnreadBadge: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.themes.provider.primary,
    borderWidth: 1.5,
    borderColor: "#FFFFFF",
  },
  richCardBody: {
    padding: Spacing.md,
  },
  richCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
  },
  richIconSmall: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  richNotificationTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: "700",
    color: Colors.text.primary,
  },
  richNotificationMessage: {
    fontSize: 13,
    color: Colors.text.secondary,
    lineHeight: 19,
    marginBottom: 8,
  },
  richActionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    paddingTop: 4,
  },
  richActionLink: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.themes.provider.primary,
  },
  unreadDot: {
    position: "absolute",
    top: 0,
    right: 0,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.themes.provider.primary,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    paddingHorizontal: Spacing.xl,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.text.primary,
    marginTop: Spacing.md,
    marginBottom: Spacing.xs,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.text.secondary,
    textAlign: "center",
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusLabel: {
    fontSize: 11,
    fontWeight: "600",
  },
});
