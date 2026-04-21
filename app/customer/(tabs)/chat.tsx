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
  unreadCount: number;
  type: 'support' | 'order';
  targetId?: string;
}

export default function CustomerChatList() {
  const { session } = useSession();
  const [refreshing, setRefreshing] = useState(false);

  const chats: ChatThread[] = [
    {
      id: 'support',
      title: 'Tasker Support',
      subtitle: 'Ask us anything',
      lastMessage: 'How can we help you today?',
      time: 'Just now',
      unreadCount: 1,
      type: 'support',
    },
  ];

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  const renderChatItem = ({ item }: { item: ChatThread }) => (
    <TouchableOpacity
      style={styles.chatCard}
      onPress={() => {
        if (item.type === 'support') {
          router.push('/customer/support-chat');
        } else {
          router.push(`/customer/order-chat/${item.targetId}`);
        }
      }}
    >
      <View style={[
        styles.avatar,
        { backgroundColor: item.type === 'support' ? Colors.themes.customer.primary : Colors.neutral.gray[100] }
      ]}>
        <Ionicons
          name={item.type === 'support' ? "headset" : "cube"}
          size={20}
          color={item.type === 'support' ? Colors.neutral.white : Colors.text.secondary}
        />
      </View>
      <View style={styles.chatInfo}>
        <View style={styles.chatHeader}>
          <Text style={styles.chatTitle} numberOfLines={1}>{item.title}</Text>
          <Text style={styles.chatTime}>{item.time}</Text>
        </View>
        <View style={styles.messageRow}>
          <Text style={styles.lastMessage} numberOfLines={1}>{item.lastMessage}</Text>
          {item.unreadCount > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadText}>{item.unreadCount}</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Support & Chats</Text>
      </View>
      <FlatList
        data={chats}
        renderItem={renderChatItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[Colors.themes.customer.primary]}
          />
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
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.neutral.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  headerTitle: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.bold,
    color: Colors.text.primary,
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
    marginBottom: 4,
  },
  chatTitle: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.bold,
    color: Colors.text.primary,
  },
  chatTime: {
    fontSize: 10,
    color: Colors.text.tertiary,
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
    backgroundColor: Colors.themes.customer.primary,
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
});
