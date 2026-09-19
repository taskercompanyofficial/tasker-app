import Header from "@/components/Header";
import Colors from "@/constants/Colors";
import { BorderRadius, Shadows, Spacing, Typography } from "@/constants/Styles";
import { useSession } from "@/context/ctx";
import { CHAT_CONVERSATIONS_URL, VENDOR_WORK_ORDER_URL } from "@/lib/api-endpoints";
import myAxios from "@/lib/axios.config";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface ChatThread {
  id: string;
  title: string;
  subtitle: string;
  lastMessage: string;
  time: string;
  unreadCountCount: number;
  type: "support" | "work_order";
  targetId?: string;
  avatarUrl?: string | null;
}

const SUPPORT_CARD: ChatThread = {
  id: "support",
  title: "Tasker Vendor Helpdesk",
  subtitle: "⚡ 24/7 AI Operations Support Desk",
  lastMessage: "Tap to ask about jobs, payouts, completion rules & technician assignment",
  time: "24/7 Live",
  unreadCountCount: 0,
  type: "support",
};

export default function VendorChatList() {
  const { session } = useSession();
  const [chats, setChats] = useState<ChatThread[]>([SUPPORT_CARD]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const mode = (session.appMode?.replace("_", "-") || "vendor") as
    | "customer"
    | "vendor"
    | "vendor-staff";

  const fetchChats = useCallback(async () => {
    try {
      // 1. Fetch conversations from chat endpoint
      let convList: ChatThread[] = [];
      try {
        const res = await myAxios.get(CHAT_CONVERSATIONS_URL(mode));
        const raw = Array.isArray(res.data?.data) ? res.data.data : [];
        convList = raw.map((c: any) => ({
          id: String(c.id),
          title: c.title,
          subtitle: c.subtitle,
          lastMessage: c.lastMessage,
          time: c.time,
          unreadCountCount: c.unreadCountCount || 0,
          type: (c.type === "support" ? "support" : "work_order") as "support" | "work_order",
          targetId: c.targetId ? String(c.targetId) : undefined,
          avatarUrl: c.avatar_url,
        }));
      } catch (convErr) {
        console.warn("Could not fetch conversations:", convErr);
      }

      // 2. Fetch active work orders to ensure all assigned complaints have a chat tile
      let activeWorkOrders: any[] = [];
      try {
        const woRes = await myAxios.get(`${VENDOR_WORK_ORDER_URL}?status=active&per_page=20`);
        activeWorkOrders = Array.isArray(woRes.data?.data) ? woRes.data.data : [];
      } catch (woErr) {
        console.warn("Could not fetch active work orders:", woErr);
      }

      // Merge active work orders that don't have conversation yet
      const mergedChats: ChatThread[] = [];

      // Support is first
      const serverSupport = convList.find((c) => c.type === "support");
      mergedChats.push(serverSupport || SUPPORT_CARD);

      // Add order conversations from chat server
      const serverOrderChats = convList.filter((c) => c.type === "work_order");
      mergedChats.push(...serverOrderChats);

      // Add active work orders that don't have a chat thread in serverOrderChats
      for (const wo of activeWorkOrders) {
        const exists = serverOrderChats.some((sc) => String(sc.targetId) === String(wo.id));
        if (!exists) {
          mergedChats.push({
            id: `wo_${wo.id}`,
            title: `${wo.customer?.name || "Customer"} • #${wo.work_order_number || wo.id}`,
            subtitle: `${wo.service?.name || "Service Job"} • ${wo.status?.name || "In Progress"}`,
            lastMessage: "Tap to chat directly with customer in-app",
            time: "Active",
            unreadCountCount: 0,
            type: "work_order",
            targetId: String(wo.id),
          });
        }
      }

      setChats(mergedChats);
    } catch (err) {
      console.error("Failed to load vendor chats:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [mode]);

  useFocusEffect(
    useCallback(() => {
      fetchChats();
    }, [fetchChats])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchChats();
  };

  const renderChatItem = ({ item }: { item: ChatThread }) => {
    const isSupport = item.type === "support";

    return (
      <TouchableOpacity
        style={[styles.chatCard, isSupport && styles.supportCard]}
        onPress={() => {
          if (isSupport) {
            router.push("/vendor/support-chat");
          } else if (item.targetId) {
            router.push(`/vendor/work-order-chat/${item.targetId}`);
          }
        }}
        activeOpacity={0.75}
      >
        <View
          style={[
            styles.avatar,
            {
              backgroundColor: isSupport
                ? Colors.themes.provider.primary
                : "#EFF6FF",
            },
          ]}
        >
          <Ionicons
            name={isSupport ? "sparkles" : "chatbubbles"}
            size={20}
            color={isSupport ? Colors.neutral.white : Colors.themes.provider.primary}
          />
        </View>
        <View style={styles.chatInfo}>
          <View style={styles.chatHeader}>
            <View style={styles.titleRow}>
              <Text style={styles.chatTitle} numberOfLines={1}>
                {item.title}
              </Text>
              {isSupport && (
                <MaterialCommunityIcons
                  name="check-decagram"
                  size={14}
                  color={Colors.themes.provider.primary}
                />
              )}
            </View>
            <Text style={styles.chatTime}>{item.time}</Text>
          </View>
          <Text style={styles.chatSubtitle} numberOfLines={1}>
            {item.subtitle}
          </Text>
          <View style={styles.messageRow}>
            <Text style={styles.lastMessage} numberOfLines={1}>
              {item.lastMessage}
            </Text>
            {item.unreadCountCount > 0 && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadText}>{item.unreadCountCount}</Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <Header title="Messages & Support" />
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.themes.provider.primary} />
          <Text style={styles.loadingText}>Loading conversations...</Text>
        </View>
      ) : (
        <FlatList
          data={chats}
          renderItem={renderChatItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[Colors.themes.provider.primary]}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="chatbubbles-outline" size={64} color={Colors.text.tertiary} />
              <Text style={styles.emptyText}>No active conversations</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.secondary,
  },
  listContent: {
    padding: Spacing.md,
  },
  chatCard: {
    flexDirection: 'row',
    backgroundColor: Colors.neutral.white,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
    ...Shadows.sm,
    alignItems: 'center',
  },
  supportCard: {
    borderLeftWidth: 3,
    borderLeftColor: Colors.themes.provider.primary,
    backgroundColor: '#F0FDF4',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  loadingText: {
    marginTop: Spacing.sm,
    fontSize: 13,
    color: Colors.text.secondary,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  chatInfo: {
    flex: 1,
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  chatTitle: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.bold,
    color: Colors.text.primary,
    flex: 1,
  },
  chatTime: {
    fontSize: 10,
    color: Colors.text.tertiary,
  },
  chatSubtitle: {
    fontSize: 11,
    color: Colors.themes.provider.primary,
    fontWeight: Typography.weights.semibold,
    marginBottom: 4,
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  lastMessage: {
    fontSize: 12,
    color: Colors.text.secondary,
    flex: 1,
    marginRight: 8,
  },
  unreadBadge: {
    backgroundColor: Colors.error,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  unreadText: {
    color: Colors.neutral.white,
    fontSize: 10,
    fontWeight: Typography.weights.bold,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 100,
  },
  emptyText: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.tertiary,
    marginTop: Spacing.sm,
  },
});
