import Colors from "@/constants/Colors";
import { Spacing, BorderRadius, Typography } from "@/constants/Styles";
import getImageUrl from "@/lib/utils";
import { useFetchParentService } from "@/hooks/useFetchParentService";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useMemo, useState } from "react";
import { Image } from "expo-image";
import { SafeAreaView } from "react-native-safe-area-context";
import { StyleSheet, Text, View, TouchableOpacity, ScrollView } from "react-native";
import CheckoutModal from "@/components/checkout/CheckoutModal";

export default function ParentServiceDetailPage() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { data, loading } = useFetchParentService(slug);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [quantity, setQuantity] = useState(0);
  const checkoutItems = useMemo(() => {
    if (!data) return [];
    return [
      {
        serviceId: data.id,
        serviceName: data.name,
        quantity,
        price: data.price || 0,
        discount: data.discount || 0,
        discountType: data.discount_type || "percentage",
      },
    ];
  }, [data, quantity]);
  const totalAmount = useMemo(() => {
    const item = checkoutItems[0];
    if (!item) return 0;
    const dp = item.discountType === "percentage" ? item.price * (1 - item.discount / 100) : item.price - item.discount;
    return Math.max(dp, 0) * item.quantity;
  }, [checkoutItems]);
  const increment = () => setQuantity((q) => q + 1);
  const decrement = () => setQuantity((q) => Math.max(0, q - 1));

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={Typography.sizes.base} color={Colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Service Details</Text>
          <View style={{ width: 32 }} />
        </View>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!data) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={Typography.sizes.base} color={Colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Service Details</Text>
          <View style={{ width: 32 }} />
        </View>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const price = data?.price || 0;
  const discount = data?.discount || 0;
  const discountedPrice =
    (data?.discount_type || "percentage") === "percentage" ? price * (1 - discount / 100) : price - discount;

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={Typography.sizes.base} color={Colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Service Details</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.topRow}>
          <Image
            source={{ uri: getImageUrl(data.image) }}
            style={styles.image}
            contentFit="cover"
          />
          <View style={{ flex: 1 }}>
            <Text style={styles.name}>{data.name}</Text>
            {data.description ? (
              <Text style={styles.description} numberOfLines={2}>
                {data.description}
              </Text>
            ) : null}
            <View style={styles.topControls}>
              <View style={styles.priceRow}>
                <Text style={styles.finalPrice}>₨{Math.round(discountedPrice)}</Text>
                {discount > 0 && (
                  <View style={styles.discountRow}>
                    <Text style={styles.originalPrice}>₨{price}</Text>
                    <View style={styles.discountBadge}>
                      <Text style={styles.discountText}>
                        {data.discount_type === "percentage" ? `${discount}%` : `₨${discount}`}
                      </Text>
                    </View>
                  </View>
                )}
              </View>
              <View style={styles.quantitySelector}>
                <TouchableOpacity style={styles.quantityButton} onPress={decrement}>
                  <Text style={{ color: Colors.text.primary }}>−</Text>
                </TouchableOpacity>
                <Text style={styles.quantityText}>{quantity}</Text>
                <TouchableOpacity style={styles.quantityButton} onPress={increment}>
                  <Text style={{ color: Colors.text.primary }}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>

        {Array.isArray(data.includes) && data.includes.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Includes</Text>
            <View style={styles.listItems}>
              {data.includes.map((item, idx) => (
                <View key={`inc-${idx}`} style={styles.listRow}>
                  <Ionicons name="checkmark" size={Typography.sizes.sm} color={Colors.success} />
                  <Text style={styles.listText}>{item}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {Array.isArray(data.excludes) && data.excludes.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Does not includes</Text>
            <View style={styles.listItems}>
              {data.excludes.map((item, idx) => (
                <View key={`exc-${idx}`} style={styles.listRow}>
                  <Ionicons name="close" size={Typography.sizes.sm} color={Colors.error} />
                  <Text style={styles.listText}>{item}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {Array.isArray(data.images) && data.images.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Gallery</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.galleryRow}>
              {data.images.slice(0, 8).map((img, idx) => (
                <Image
                  key={`img-${idx}`}
                  source={{ uri: getImageUrl(img) }}
                  style={styles.galleryImage}
                  contentFit="cover"
                />
              ))}
            </ScrollView>
          </View>
        )}
      </ScrollView>
      {quantity === 0 ? (
        <View style={styles.footerBar}>
          <View style={styles.footerInfo}>
            <Text style={styles.footerLabel}>Price</Text>
            <Text style={styles.footerPrice}>₨{Math.round(Math.max(discountedPrice, 0))}</Text>
          </View>
          <TouchableOpacity style={styles.addButton} onPress={() => setQuantity(1)}>
            <Ionicons name="cart" size={18} color={Colors.neutral.white} />
            <Text style={styles.addButtonText}>Add</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.checkoutBar}>
          <View style={styles.checkoutInfo}>
            <View style={styles.itemsCount}>
              <Ionicons name="cart" size={20} color={Colors.text.secondary} />
              <Text style={styles.itemsCountText}>{quantity} item(s)</Text>
            </View>
            <View style={styles.totalSection}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalPrice}>₨{Math.round(totalAmount)}</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.checkoutButton} onPress={() => setShowCheckoutModal(true)}>
            <Text style={styles.checkoutButtonText}>Checkout</Text>
            <Ionicons name="arrow-forward" size={20} color={Colors.neutral.white} />
          </TouchableOpacity>
        </View>
      )}
      <CheckoutModal
        visible={showCheckoutModal}
        onClose={() => setShowCheckoutModal(false)}
        items={checkoutItems}
        totalAmount={totalAmount}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.neutral.gray[50],
  },
  checkoutBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.neutral.white,
    borderTopWidth: 1,
    borderTopColor: Colors.border.light,
  },
  checkoutInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  itemsCount: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  itemsCountText: {
    fontSize: Typography.sizes.xs,
    color: Colors.text.secondary,
  },
  totalSection: {
    gap: 2,
    alignItems: "flex-end",
  },
  totalLabel: {
    fontSize: Typography.sizes.xs,
    color: Colors.text.tertiary,
  },
  totalPrice: {
    fontSize: Typography.sizes.base,
    fontWeight: "800",
    color: Colors.text.primary,
  },
  checkoutButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    backgroundColor: Colors.themes.customer.primary,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  checkoutButtonText: {
    color: Colors.neutral.white,
    fontSize: Typography.sizes.sm,
    fontWeight: "700",
  },
  quantitySelector: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.neutral.gray[100],
    borderRadius: BorderRadius.sm,
    padding: 2,
  },
  quantityButton: {
    width: 24,
    height: 24,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.neutral.white,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.border.light,
  },
  quantityText: {
    fontSize: Typography.sizes.sm,
    fontWeight: "700",
    color: Colors.text.primary,
    marginHorizontal: 12,
    minWidth: 20,
    textAlign: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.sm,
    backgroundColor: Colors.neutral.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  backButton: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.neutral.gray[100],
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: Typography.sizes.base,
    fontWeight: "800",
    color: Colors.text.primary,
  },
  content: {
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    backgroundColor: Colors.neutral.white,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.border.light,
    padding: Spacing.sm,
  },
  image: {
    width: 80,
    height: 80,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.neutral.gray[100],
  },
  name: {
    fontSize: Typography.sizes.base,
    fontWeight: "800",
    color: Colors.text.primary,
  },
  description: {
    fontSize: Typography.sizes.xs,
    color: Colors.text.secondary,
    marginTop: 2,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    marginTop: Spacing.xs,
  },
  topControls: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  discountRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  originalPrice: {
    fontSize: Typography.sizes.xs,
    color: Colors.text.tertiary,
    textDecorationLine: "line-through",
  },
  discountBadge: {
    backgroundColor: Colors.success + "15",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  discountText: {
    fontSize: Typography.sizes.xs,
    fontWeight: "700",
    color: Colors.success,
  },
  finalPrice: {
    fontSize: Typography.sizes.base,
    fontWeight: "800",
    color: Colors.themes.customer.primary,
  },
  section: {
    backgroundColor: Colors.neutral.white,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.border.light,
    padding: Spacing.sm,
  },
  sectionTitle: {
    fontSize: Typography.sizes.sm,
    fontWeight: "700",
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },
  chipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.xs,
  },
  footerBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.neutral.white,
    borderTopWidth: 1,
    borderTopColor: Colors.border.light,
  },
  footerInfo: {
    gap: 2,
  },
  footerLabel: {
    fontSize: Typography.sizes.xs,
    color: Colors.text.tertiary,
  },
  footerPrice: {
    fontSize: Typography.sizes.base,
    fontWeight: "800",
    color: Colors.text.primary,
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    backgroundColor: Colors.themes.customer.primary,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  addButtonText: {
    color: Colors.neutral.white,
    fontSize: Typography.sizes.sm,
    fontWeight: "700",
  },
  listItems: {
    gap: Spacing.xs,
  },
  listRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  listText: {
    fontSize: Typography.sizes.xs,
    color: Colors.text.secondary,
  },
  chip: {
    backgroundColor: Colors.neutral.gray[100],
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: Colors.border.light,
  },
  chipText: {
    fontSize: Typography.sizes.xs,
    color: Colors.text.secondary,
    fontWeight: "600",
  },
  fileChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: Colors.neutral.gray[100],
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: Colors.border.light,
  },
  fileChipText: {
    fontSize: Typography.sizes.xs,
    color: Colors.text.secondary,
    fontWeight: "600",
  },
  galleryRow: {
    gap: Spacing.xs,
  },
  galleryImage: {
    width: 96,
    height: 72,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.neutral.gray[100],
  },
  loadingContainer: {
    padding: Spacing.lg,
    alignItems: "center",
  },
  loadingText: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.secondary,
  },
});
