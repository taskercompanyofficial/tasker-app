import Colors from "@/constants/Colors";
import { Spacing, Typography, BorderRadius, Shadows } from "@/constants/Styles";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

export default function TaskerShopCard() {
  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => router.push("/customer/shop" as any)}
      activeOpacity={0.9}
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
              color={Colors.themes.customer.primary}
            />
          </View>
        </View>

        <View style={styles.bodySection}>
          <View style={styles.header}>
            <Text style={styles.title}>Tasker Shop</Text>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>Exclusive</Text>
            </View>
          </View>
          <Text style={styles.subtitle} numberOfLines={2}>
            Shop premium ACs, washing machines, and home appliances.
          </Text>
        </View>

        <View style={styles.rightSection}>
          <View style={styles.arrowCircle}>
            <Ionicons
              name="arrow-forward"
              size={16}
              color={Colors.neutral.white}
            />
          </View>
        </View>
      </LinearGradient>
    </TouchableOpacity>
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
    backgroundColor: Colors.themes.customer.primary + "15",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.themes.customer.primary + "20",
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
    color: Colors.text.primary,
  },
  badge: {
    backgroundColor: Colors.themes.customer.primary + "12",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  badgeText: {
    fontSize: Typography.sizes.xs - 2,
    fontWeight: Typography.weights.bold,
    color: Colors.themes.customer.primary,
    textTransform: "uppercase",
  },
  subtitle: {
    fontSize: Typography.sizes.xs,
    color: Colors.text.secondary,
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
