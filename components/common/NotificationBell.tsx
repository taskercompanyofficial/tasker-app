import Colors from "@/constants/Colors";
import { NOTIFICATION_URL } from "@/lib/api-endpoints";
import myAxios from "@/lib/axios.config";
import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import React, { useCallback, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { BorderRadius } from "@/constants/Styles";

interface NotificationBellProps {
  variant?: "default" | "light";
}

export default function NotificationBell({
  variant = "default",
}: NotificationBellProps) {
  const [unreadCount, setUnreadCount] = useState(0);

  const isLight = variant === "light";

  useFocusEffect(
    useCallback(() => {
      fetchUnreadCount();
    }, []),
  );

  const fetchUnreadCount = async () => {
    try {
      const res = await myAxios.get(`${NOTIFICATION_URL}/unread-count`);
      setUnreadCount(res.data.data.count || 0);
    } catch (error) {
      console.error("Failed to fetch unread count:", error);
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.notificationButton,
        isLight && styles.notificationButtonLight,
      ]}
      onPress={() => router.push("/customer/notifications")}
    >
      <Ionicons
        name="notifications-outline"
        size={20}
        color={isLight ? Colors.neutral.white : Colors.text.primary}
      />
      {unreadCount > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>
            {unreadCount > 9 ? "9+" : unreadCount}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  notificationButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.neutral.gray[100],
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  notificationButtonLight: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
  },
  badge: {
    position: "absolute",
    top: 4,
    right: 4,
    backgroundColor: Colors.error,
    borderRadius: BorderRadius.sm,
    minWidth: 14,
    height: 14,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 3,
  },
  badgeText: {
    fontSize: 8,
    fontWeight: "700",
    color: Colors.neutral.white,
  },
});
