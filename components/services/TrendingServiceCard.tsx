import Colors from "@/constants/Colors";
import { BorderRadius, Spacing, Typography } from "@/constants/Styles";
import getImageUrl from "@/lib/utils";
import type { ParentService } from "@/types/parent-service";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { router } from "expo-router";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

type Props = {
  item: ParentService;
};

export default function TrendingServiceCard({ item }: Props) {
  const price = item.price;
  const discount = item.discount || 0;
  const finalPrice =
    item.discount_type === "percentage" ? price * (1 - discount / 100) : price - discount;
  const showRating = typeof item.rating === "number";
  const isDiscounted = discount > 0;
  const discountBadgeText =
    isDiscounted && item.discount_type === "percentage"
      ? `${discount}%`
      : isDiscounted
      ? `₨${Math.round(discount)}`
      : null;
  const discountEnd =
    typeof item.discount_end_date === "string" && item.discount_end_date
      ? new Date(item.discount_end_date)
      : null;
  const discountEndText = discountEnd
    ? discountEnd.toLocaleDateString("en-US", { month: "short", day: "numeric" })
    : null;
  return (
    <TouchableOpacity
      onPress={() => item.slug && router.push(`/customer/services/parent/${item.slug}`)}
      style={styles.card}
      activeOpacity={0.9}
    >
      <View style={styles.left}>
        <View style={styles.imageWrap}>
          <Image
            source={{ uri: getImageUrl(item.image) }}
            style={styles.image}
            contentFit="cover"
          />
        </View>
      </View>
      <View style={styles.right}>
        <View style={styles.titleRow}>
          <Text numberOfLines={1} style={styles.title}>
            {item.name}
          </Text>
          {showRating && (
            <View style={styles.ratingBadge}>
              <Ionicons name="star" size={Typography.sizes.xs} color={Colors.success} />
              <Text style={styles.ratingText}>{item.rating?.toFixed(1)}</Text>
            </View>
          )}
        </View>
        {!!item.description && (
          <Text numberOfLines={2} style={styles.subtitle}>
            {item.description}
          </Text>
        )}
        <View style={styles.priceSection}>
          {isDiscounted && (
            <View style={styles.discountRow}>
              <Text style={styles.originalPrice}>₨{Math.round(price)}</Text>
              {!!discountBadgeText && (
                <View style={styles.discountBadge}>
                  <Text style={styles.discountText}>{discountBadgeText}</Text>
                </View>
              )}
            </View>
          )}
          <Text style={styles.finalPrice}>₨{Math.max(Math.round(finalPrice), 0)}</Text>
        </View>
        {isDiscounted && discountEndText && (
          <View style={styles.metaRow}>
            <View style={styles.metaBadge}>
              <Text style={styles.metaText}>Ends {discountEndText}</Text>
            </View>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 280,
    height: 120,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.neutral.white,
    borderWidth: 0.3,
    borderColor: Colors.border.light,
    flexDirection: "row",
    overflow: "hidden",
  },
  left: {
    width: 120,
    padding: Spacing.xs,
  },
  imageWrap: {
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.neutral.gray[100],
    overflow: "hidden",
    width: "100%",
    height: "100%",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  right: {
    flex: 1,
    paddingVertical: Spacing.sm,
    paddingRight: Spacing.sm,
    gap: Spacing.xs,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: Spacing.xs,
  },
  title: {
    fontSize: Typography.sizes.sm,
    fontWeight: "700",
    color: Colors.text.primary,
  },
  ratingBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs / 2,
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.neutral.white,
  },
  ratingText: {
    fontSize: Typography.sizes.xs,
    color: Colors.success,
    fontWeight: "700",
  },
  subtitle: {
    fontSize: Typography.sizes.xs,
    color: Colors.text.secondary,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  metaBadge: {
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
    borderWidth: 0.5,
    borderColor: Colors.border.light,
    backgroundColor: Colors.neutral.white,
  },
  metaText: {
    fontSize: Typography.sizes.xs,
    color: Colors.text.secondary,
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
  finalPrice: {
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
});
