import AppText from "@/components/common/AppText";
import Colors from "@/constants/Colors";
import { Spacing, Typography } from "@/constants/Styles";
import React from "react";
import { StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

export default function ShopOrders() {
  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <AppText style={styles.headerTitle}>My Orders</AppText>
      </View>
      <View style={styles.content}>
        <Ionicons
          name="receipt-outline"
          size={64}
          color={Colors.text.tertiary}
        />
        <AppText style={styles.emptyText}>You haven't placed any orders yet.</AppText>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.secondary,
  },
  header: {
    paddingHorizontal: Spacing.md,
    height: 56,
    justifyContent: "center",
    backgroundColor: Colors.neutral.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  headerTitle: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.bold,
    color: Colors.text.primary,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: Spacing.sm,
  },
  emptyText: {
    fontSize: Typography.sizes.base,
    color: Colors.text.secondary,
    fontWeight: Typography.weights.medium,
  },
});
