import Colors from "@/constants/Colors";
import { Spacing, BorderRadius, Typography } from "@/constants/Styles";
import getImageUrl from "@/lib/utils";
import { ParentService } from "@/types/parent-service";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { router } from "expo-router";

interface ParentServiceCardProps {
  service: ParentService;
  quantity: number;
  onUpdateQuantity: (change: number) => void;
}

export default function ParentServiceCard({
  service,
  quantity,
  onUpdateQuantity,
}: ParentServiceCardProps) {
  const price = service.price;
  const discount = service.discount || 0;
  const discountedPrice =
    service.discount_type === "percentage"
      ? price * (1 - discount / 100)
      : price - discount;

  return (
    <View style={styles.card}>
      {/* Service Image */}
      <Image
        source={{ uri: getImageUrl(service.image) }}
        style={styles.serviceImage}
        contentFit="cover"
      />

      {/* Service Info */}
      <View style={styles.infoSection}>
        <View style={styles.textContainer}>
          <TouchableOpacity
            onPress={() =>
              service.slug &&
              router.push(`/customer/services/parent/${service.slug}`)
            }
          >
            <Text style={styles.serviceName}>{service.name}</Text>
          </TouchableOpacity>
          <Text style={styles.description} numberOfLines={1}>
            {service.description}
          </Text>
        </View>

        {/* Price & Discount */}
        <View style={styles.priceSection}>
          {discount > 0 && (
            <View style={styles.discountRow}>
              <Text style={styles.originalPrice}>₨ {price}</Text>
            </View>
          )}
          <Text style={styles.price}>₨ {Math.round(discountedPrice)}</Text>
        </View>
      </View>

      {/* Quantity Selector */}
      <View style={styles.actionSection}>
        {quantity === 0 ? (
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => onUpdateQuantity(1)}
          >
            <Text style={styles.addButtonText}>Add</Text>
            <Ionicons name="add" size={16} color={Colors.neutral.white} />
          </TouchableOpacity>
        ) : (
          <View style={styles.quantitySelector}>
            <TouchableOpacity
              style={styles.quantityButton}
              onPress={() => onUpdateQuantity(-1)}
            >
              <Ionicons
                name="remove"
                size={18}
                color={Colors.themes.customer.primary}
              />
            </TouchableOpacity>
            <Text style={styles.quantityText}>{quantity}</Text>
            <TouchableOpacity
              style={styles.quantityButton}
              onPress={() => onUpdateQuantity(1)}
            >
              <Ionicons
                name="add"
                size={18}
                color={Colors.themes.customer.primary}
              />
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.neutral.white,
    borderRadius: BorderRadius.sm,
    padding: Spacing.sm,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border.light,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  serviceImage: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.neutral.gray[100],
  },
  infoSection: {
    flex: 1,
  },
  textContainer: {
    marginBottom: Spacing.xs,
  },
  serviceName: {
    fontSize: Typography.sizes.sm,
    fontWeight: "700",
    color: Colors.text.primary,
    marginBottom: 2,
  },
  description: {
    fontSize: Typography.sizes.xs,
    color: Colors.text.secondary,
    lineHeight: 16,
  },
  priceSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
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
  price: {
    fontSize: Typography.sizes.base,
    fontWeight: "800",
    color: Colors.themes.customer.primary,
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
  actionSection: {
    alignItems: "flex-end",
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.themes.customer.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.sm,
    gap: 4,
  },
  addButtonText: {
    color: Colors.neutral.white,
    fontSize: Typography.sizes.xs,
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
  },
  quantityText: {
    fontSize: Typography.sizes.sm,
    fontWeight: "700",
    color: Colors.text.primary,
    marginHorizontal: 12,
    minWidth: 20,
    textAlign: "center",
  },
});
