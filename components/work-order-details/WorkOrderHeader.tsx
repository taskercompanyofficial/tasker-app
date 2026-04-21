import Colors from "@/constants/Colors";
import { Ionicons, FontAwesome } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface WorkOrderHeaderProps {
  statusName: string;
  workOrderId?: number | string;
}

export default function WorkOrderHeader({ statusName, workOrderId }: WorkOrderHeaderProps) {
  return (
    <View style={styles.header}>
      <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
        <Ionicons name="arrow-back" size={24} color="#111827" />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>{statusName}</Text>
      {workOrderId ? (
        <TouchableOpacity
          onPress={() => router.push(`/vendor/work-order-chat/${workOrderId}`)}
          style={styles.chatButton}
        >
          <FontAwesome name="whatsapp" size={24} color="#25D366" />
        </TouchableOpacity>
      ) : (
        <View style={{ width: 40 }} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.neutral.white,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  backButton: {
    padding: 4,
  },
  chatButton: {
    padding: 4,
    width: 40,
    alignItems: "flex-end",
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    flex: 1,
    textAlign: "center",
  },
});
