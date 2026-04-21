import Colors from "@/constants/Colors";
import { Spacing, Typography, BorderRadius, Shadows } from "@/constants/Styles";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

export default function TaskerShopCard() {
  return (
    <View
      style={styles.container}
    >
      <LinearGradient
        colors={[Colors.neutral.white, "#F9FAFB"]}
        style={styles.cardContent}
      >
        <View style={styles.leftSection}>
          <View style={styles.iconWrapper}>
            <Ionicons
              name="cart-outline"
              size={26}
              color={Colors.text.tertiary}
            />
          </View>
        </View>

        <View style={styles.bodySection}>
          <View style={styles.header}>
            <Text style={styles.title}>Tasker Shop</Text>
            <View style={styles.comingSoonBadge}>
              <Text style={styles.comingSoonText}>Coming Soon</Text>
            </View>
          </View>
          <Text style={styles.subtitle} numberOfLines={2}>
            Our premium appliance store is launching soon. Stay tuned!
          </Text>
        </View>

        <View style={styles.rightSection}>
          <View style={[styles.arrowCircle, { backgroundColor: Colors.neutral.gray[300] }]}>
            <Ionicons
              name="lock-closed"
              size={14}
              color={Colors.neutral.white}
            />
          </View>
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: Spacing.md,
    marginVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: Colors.border.light,
    ...Shadows.sm,
    elevation: 3,
    opacity: 0.8,
  },
  cardContent: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
  },
  leftSection: {
    marginRight: Spacing.md,
  },
  iconWrapper: {
    width: 50,
    height: 50,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.neutral.gray[100],
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.border.light,
  },
  bodySection: {
    flex: 1,
    paddingRight: Spacing.sm,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
    gap: Spacing.xs,
  },
  title: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.bold,
    color: Colors.text.secondary,
  },
  comingSoonBadge: {
    backgroundColor: Colors.warning + "15",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
    borderWidth: 0.5,
    borderColor: Colors.warning + "30",
  },
  comingSoonText: {
    fontSize: 8,
    fontWeight: Typography.weights.bold,
    color: Colors.warning,
    textTransform: "uppercase",
  },
  subtitle: {
    fontSize: Typography.sizes.xs,
    color: Colors.text.tertiary,
    lineHeight: 16,
  },
  rightSection: {
    justifyContent: "center",
    alignItems: "center",
  },
  arrowCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.themes.customer.primary,
    justifyContent: "center",
    alignItems: "center",
    ...Shadows.sm,
  },
});
