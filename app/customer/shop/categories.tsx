import AppText from "@/components/common/AppText";
import DirectionalIcon from "@/components/common/DirectionalIcon";
import Colors from "@/constants/Colors";
import { Spacing, Typography, BorderRadius, Shadows } from "@/constants/Styles";
import React from "react";
import {
  FlatList,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { SHOP_CATEGORIES } from "./index";

export default function ShopCategories() {
  const renderItem = ({ item }: { item: (typeof SHOP_CATEGORIES)[0] }) => (
    <TouchableOpacity style={styles.categoryItem} activeOpacity={0.8}>
      <View style={styles.iconWrap}>
        <Ionicons
          name={item.icon as any}
          size={24}
          color={Colors.themes.customer.primary}
        />
      </View>
      <View style={styles.textWrap}>
        <AppText style={styles.categoryName}>{item.name}</AppText>
        <AppText style={styles.itemCount}>50+ Items</AppText>
      </View>
      <DirectionalIcon name="chevron-forward" size={20} color={Colors.text.tertiary} />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <AppText style={styles.headerTitle}>All Categories</AppText>
      </View>

      <FlatList
        data={SHOP_CATEGORIES}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
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
    height: 48,
    justifyContent: "center",
    backgroundColor: Colors.text.primary,
  },
  headerTitle: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.bold,
    color: Colors.neutral.white,
    letterSpacing: 0.5,
  },
  listContent: {
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  categoryItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.neutral.white,
    padding: Spacing.md,
    borderRadius: BorderRadius.sm, // Compact solid
    borderWidth: 1,
    borderColor: Colors.border.light,
    ...Shadows.sm,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.themes.customer.primary + "15",
    justifyContent: "center",
    alignItems: "center",
    marginRight: Spacing.md,
  },
  textWrap: {
    flex: 1,
  },
  categoryName: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.bold,
    color: Colors.text.primary,
    marginBottom: 2,
  },
  itemCount: {
    fontSize: Typography.sizes.xs - 2,
    color: Colors.text.tertiary,
    fontWeight: Typography.weights.medium,
  },
});
