import AppText from "@/components/common/AppText";
import DirectionalIcon from "@/components/common/DirectionalIcon";
import Loader from "@/components/Loader";
import Colors from "@/constants/Colors";
import { Spacing } from "@/constants/Styles";
import { useEcho, type RealtimeNotification } from "@/context/EchoProvider";
import { NOTIFICATION_URL } from "@/lib/api-endpoints";
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
  order_id?: number | null;
  read: boolean;
  created_at: string;
  read_at?: string | null;
  link?: string | null;
  data?: {
    work_order_id?: number;
    work_order_number?: string;
    [key: string]: any;
  };
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const { onNotification, resetRealtimeUnread, connectionState } = useEcho();

  // Reset the unread badge when this page is focused
  useFocusEffect(
    useCallback(() => {
      fetchNotifications();
      resetRealtimeUnread();
    }, []),
  );

  // Real-time listener
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
        data: incoming.data || {},
      };
      setNotifications((prev) => [mapped, ...prev]);
    });
    return unsubscribe;
  }, [onNotification]);

  const fetchNotifications = async () => {
    try {
      const res = await myAxios.get(NOTIFICATION_URL);
      setNotifications(res.data.data || []);
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
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
      await myAxios.put(`${NOTIFICATION_URL}/${notificationId}/read`);
      setNotifications((prev) =>
        prev.map((notif) =>
          notif.id === notificationId ? { ...notif, read: true } : notif,
        ),
      );
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "order":           return "receipt";
      case "free_installation": return "construct";
      case "promotion":       return "pricetag";
      case "system":          return "information-circle";
      default:                return "notifications";
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case "order":           return Colors.themes.customer.primary;
      case "free_installation": return Colors.success;
      case "promotion":       return "#10B981";
      case "system":          return "#3B82F6";
      default:                return Colors.text.secondary;
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    const diffHours   = Math.floor(diffMinutes / 60);
    const diffDays    = Math.floor(diffHours / 24);

    if (diffMinutes < 1) return "Just now";
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffHours < 24)   return `${diffHours}h ago`;
    if (diffDays === 1)   return "Yesterday";
    if (diffDays < 7)     return `${diffDays}d ago`;

    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const handleNotificationPress = async (notification: Notification) => {
   
    if (!notification.read) {
      await markAsRead(notification.id);
    }

    const data = notification.data || {};

    // 1. Chat Notifications
    if (notification.type === 'chat' || data.type === 'chat') {
      if (data.chat_type === 'support') {
        router.push('/customer/support-chat');
      } else if (data.chat_type === 'order' && data.work_order_id) {
        router.push({
          pathname: '/customer/support-chat',
          params: { initialWorkOrderId: data.work_order_id },
        } as any);
      }
      return;
    }

    // 2. Order/Work Order Notifications
    const orderRef =
      data.order_number ||
      data.work_order_number ||
      data.work_order_id ||
      notification.order_id ||
      data.order_id ||
      data.id;
    if (orderRef) {
      router.push(`/customer/orders/${orderRef}`);
      return;
    }

    // 3. System/Promotion Notifications
    if (notification.type === 'promotion') {
      router.push('/customer/(tabs)/services');
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  const ConnectionIndicator = () => {
    const isLive = connectionState === "connected";
    const isConnecting = connectionState === "connecting" || connectionState === "initialized";
    const dotColor = isLive ? Colors.success : isConnecting ? "#F59E0B" : Colors.error;
    const label    = isLive ? "Live" : isConnecting ? "Connecting…" : "Offline";
    return (
      <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
        <View style={[styles.statusDot, { backgroundColor: dotColor }]} />
        <AppText style={[styles.statusLabel, { color: dotColor }]}>{label}</AppText>
      </View>
    );
  };

  const renderNotification = ({ item }: { item: Notification }) => {
    const notifImage = item.data?.image || item.data?.image_url;
    return (
      <TouchableOpacity
        style={[styles.notificationCard, !item.read && styles.notificationCardUnread]}
        onPress={() => handleNotificationPress(item)}
        activeOpacity={0.7}
      >
        <View
          style={[
            styles.iconContainer,
            { backgroundColor: getNotificationColor(item.type) + "15" },
          ]}
        >
          <Ionicons
            name={getNotificationIcon(item.type) as any}
            size={24}
            color={getNotificationColor(item.type)}
          />
        </View>

        <View style={styles.notificationContent}>
          <View style={styles.notificationHeader}>
            <AppText style={styles.notificationTitle} numberOfLines={1}>{item.title}</AppText>
            <AppText style={styles.notificationTime}>{formatTime(item.created_at)}</AppText>
          </View>
          <AppText style={styles.notificationMessage} numberOfLines={3}>{item.message}</AppText>
          {notifImage && (
            <Image
              source={{ uri: notifImage }}
              style={styles.notificationImage}
              contentFit="cover"
              transition={200}
            />
          )}
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
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
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
      </View>

      {/* Notifications List */}
      <FlatList
        data={notifications}
        renderItem={renderNotification}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="notifications-off-outline" size={64} color={Colors.text.tertiary} />
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
    color: Colors.themes.customer.primary,
    fontWeight: "600",
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
    backgroundColor: Colors.themes.customer.primary + "10",
    borderColor: Colors.themes.customer.primary + "30",
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
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
  unreadDot: {
    position: "absolute",
    top: 0,
    right: 0,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.themes.customer.primary,
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
