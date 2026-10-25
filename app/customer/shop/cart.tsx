import AppText from "@/components/common/AppText";
import Colors from "@/constants/Colors";
import { Spacing, Typography, BorderRadius, Shadows } from "@/constants/Styles";
import React from "react";
import {
  FlatList,
  Image,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { SHOP_PRODUCTS } from "./index";

export default function ShopCart() {
  const cartItems = SHOP_PRODUCTS.slice(0, 2);

  const renderItem = ({ item }: { item: (typeof SHOP_PRODUCTS)[0] }) => (
    <View style={styles.cartItem}>
      <Image source={{ uri: item.image }} style={styles.itemImage} />
      <View style={styles.itemDetails}>
        <AppText style={styles.itemName} numberOfLines={2}>
          {item.name}
        </AppText>
        <AppText style={styles.itemPrice}>${item.price.toFixed(2)}</AppText>
        <View style={styles.quantityControls}>
          <TouchableOpacity style={styles.controlBtn}>
            <Ionicons name="remove" size={16} color={Colors.text.primary} />
          </TouchableOpacity>
          <AppText style={styles.qtyText}>1</AppText>
          <TouchableOpacity style={styles.controlBtn}>
            <Ionicons name="add" size={16} color={Colors.text.primary} />
          </TouchableOpacity>
        </View>
      </View>
      <TouchableOpacity style={styles.deleteBtn}>
        <Ionicons name="trash-outline" size={18} color={Colors.error} />
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <AppText style={styles.headerTitle}>Shopping Cart</AppText>
      </View>

      <FlatList
        data={cartItems}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListFooterComponent={() => {
          const subtotal = cartItems.reduce((acc, item) => acc + item.price, 0);
          const delivery = 15.0;
          const total = subtotal + delivery;
          return (
            <View style={styles.summaryContainer}>
              <View style={styles.summaryRow}>
                <AppText style={styles.summaryText}>Subtotal</AppText>
                <AppText style={styles.summaryValue}>${subtotal.toFixed(2)}</AppText>
              </View>
              <View style={styles.summaryRow}>
                <AppText style={styles.summaryText}>Delivery</AppText>
                <AppText style={styles.summaryValue}>${delivery.toFixed(2)}</AppText>
              </View>
              <View style={styles.divider} />
              <View style={styles.summaryRow}>
                <AppText style={styles.totalText}>Total</AppText>
                <AppText style={styles.totalValue}>${total.toFixed(2)}</AppText>
              </View>
              <TouchableOpacity style={styles.checkoutBtn} activeOpacity={0.9}>
                <AppText style={styles.checkoutBtnText}>Proceed to Checkout</AppText>
              </TouchableOpacity>
            </View>
          );
        }}
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
  cartItem: {
    flexDirection: "row",
    backgroundColor: Colors.neutral.white,
    padding: Spacing.sm,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.border.light,
    ...Shadows.sm,
  },
  itemImage: {
    width: 60,
    height: 60,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.neutral.gray[100],
    borderWidth: 1,
    borderColor: Colors.border.light,
  },
  itemDetails: {
    flex: 1,
    marginLeft: Spacing.md,
    justifyContent: "space-between",
  },
  itemName: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.bold,
    color: Colors.text.primary,
    marginBottom: 4,
  },
  itemPrice: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.bold,
    color: Colors.themes.customer.primary,
  },
  quantityControls: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  controlBtn: {
    width: 24,
    height: 24,
    borderRadius: 4, // Less rounded compact
    borderWidth: 1,
    borderColor: Colors.border.light,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.neutral.gray[50],
  },
  qtyText: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.bold,
    color: Colors.text.primary,
    minWidth: 16,
    textAlign: "center",
  },
  deleteBtn: {
    padding: Spacing.xs,
    justifyContent: "center",
  },
  summaryContainer: {
    marginTop: Spacing.lg,
    backgroundColor: Colors.neutral.white,
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.border.light,
    ...Shadows.sm,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: Spacing.sm,
  },
  summaryText: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.secondary,
  },
  summaryValue: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.bold,
    color: Colors.text.primary,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border.light,
    marginVertical: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  totalText: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.bold,
    color: Colors.text.primary,
  },
  totalValue: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.extrabold,
    color: Colors.text.primary,
  },
  checkoutBtn: {
    backgroundColor: Colors.themes.customer.primary,
    paddingVertical: 12, // Compact
    borderRadius: BorderRadius.sm, // Less rounded
    justifyContent: "center",
    alignItems: "center",
    marginTop: Spacing.md,
    ...Shadows.md,
  },
  checkoutBtnText: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.bold,
    color: Colors.neutral.white,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
});
