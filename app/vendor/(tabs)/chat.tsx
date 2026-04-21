import Header from "@/components/Header";
import Colors from "@/constants/Colors";
import { BorderRadius, Shadows, Spacing, Typography } from "@/constants/Styles";
import { useSession } from "@/context/ctx";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import {
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
  type: 'support' | 'work_order';
  targetId?: string;
}

export default function VendorChatList() {
  const { session } = useSession();
  const [refreshing, setRefreshing] = useState(false);

  // Mock data for now - will integrate with API later
  const chats: ChatThread[] = [
    {
      id: 'support',
      title: 'Tasker Support',
      subtitle: 'Official Support Channel',
      lastMessage: 'How can we help you today?',
      time: 'Just now',
      unreadCountCount: 1,
      type: 'support',
    },
    // Work order chats will be fetched from API
  ];

  const onRefresh = () => {
    setRefreshing(true);
    // Fetch chats logic here
    setTimeout(() => setRefreshing(false), 1000);
  };

  const renderChatItem = ({ item }: { item: ChatThread }) => (
    <TouchableOpacity
      style={styles.chatCard}
      onPress={() => {
        if (item.type === 'support') {
          router.push('/vendor/support-chat');
        } else {
          router.push(`/vendor/work-order-chat/${item.targetId}`);
        }
      }}
    >
      <View style={[
        styles.avatar,
        { backgroundColor: item.type === 'support' ? Colors.themes.provider.primary : Colors.neutral.gray[100] }
      ]}>
        <Ionicons
          name={item.type === 'support' ? "headset" : "briefcase"}
          size={20}
          color={item.type === 'support' ? Colors.neutral.white : Colors.text.secondary}
        />
      </View>
      <View style={styles.chatInfo}>
        <View style={styles.chatHeader}>
          <Text style={styles.chatTitle} numberOfLines={1}>{item.title}</Text>
          <Text style={styles.chatTime}>{item.time}</Text>
        </View>
        <Text style={styles.chatSubtitle} numberOfLines={1}>{item.subtitle}</Text>
        <View style={styles.messageRow}>
          <Text style={styles.lastMessage} numberOfLines={1}>{item.lastMessage}</Text>
          {item.unreadCountCount > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadText}>{item.unreadCountCount}</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <Header title="Messages" />
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
            <Text style={styles.emptyText}>No recent messages</Text>
          </View>
        }
      />
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
