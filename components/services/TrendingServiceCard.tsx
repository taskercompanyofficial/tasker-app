import AppText from "@/components/common/AppText";
import Colors from "@/constants/Colors";
import { BorderRadius, Spacing, Typography } from "@/constants/Styles";
import getImageUrl from "@/lib/utils";
import type { ParentService } from "@/types/parent-service";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useEffect, useRef } from "react";
import {
  Animated,
  Easing,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";

// Unified Royal Sapphire / Midnight Blue Shining Palette
const SHINING_PALETTE = {
  bg: ["#0B2545", "#134074", "#1D5D9B"] as const,
  accent: "#60A5FA",
  priceColor: "#FEF08A",
};

type Props = {
  item: ParentService;
  index?: number;
};

export default function TrendingServiceCard({ item }: Props) {
  const palette = SHINING_PALETTE;

  // Animated shining light flare sweep
  const shineAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(shineAnim, {
          toValue: 1,
          duration: 2200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.delay(1800),
        Animated.timing(shineAnim, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [shineAnim]);

  const price = item.price;
  const discount = item.discount || 0;
  const finalPrice =
    item.discount_type === "percentage"
      ? price * (1 - discount / 100)
      : price - discount;
  const showRating = typeof item.rating === "number";
  const isDiscounted = discount > 0;
  const discountBadgeText =
    isDiscounted && item.discount_type === "percentage"
      ? `${discount}% OFF`
      : isDiscounted
      ? `₨${Math.round(discount)} OFF`
      : null;
  const discountEnd =
    typeof item.discount_end_date === "string" && item.discount_end_date
      ? new Date(item.discount_end_date)
      : null;
  const discountEndText = discountEnd
    ? discountEnd.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      })
    : null;

  return (
    <TouchableOpacity
      onPress={() =>
        item.slug && router.push(`/customer/services/parent/${item.slug}`)
      }
      activeOpacity={0.88}
      style={styles.cardOuter}
    >
      {/* 1. Luminous Jewel Gradient Background */}
      <LinearGradient
        colors={palette.bg}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.cardGradient}
      >
        {/* 2. Glassmorphism Top-Left Shimmer Reflection */}
        <LinearGradient
          colors={[
            "rgba(255, 255, 255, 0.24)",
            "rgba(255, 255, 255, 0.05)",
            "rgba(255, 255, 255, 0)",
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0.85, y: 0.85 }}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />

        {/* 3. Animated Light Sheen Sweep */}
        <Animated.View
          style={[
            styles.shineSweep,
            {
              transform: [
                {
                  translateX: shineAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-180, 360],
                  }),
                },
                { rotate: "22deg" },
              ],
            },
          ]}
          pointerEvents="none"
        >
          <LinearGradient
            colors={[
              "rgba(255, 255, 255, 0)",
              "rgba(255, 255, 255, 0.32)",
              "rgba(255, 255, 255, 0)",
            ]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.shineGradient}
          />
        </Animated.View>

        {/* 4. Left Image Container with glowing white border */}
        <View style={styles.left}>
          <View style={styles.imageWrap}>
            <Image
              source={{ uri: getImageUrl(item.image) }}
              style={styles.image}
              contentFit="cover"
              transition={150}
            />
            {/* Sparkle badge in bottom corner of image */}
            <View style={styles.popularBadge}>
              <Ionicons name="sparkles" size={9} color="#FEF08A" />
              <AppText style={styles.popularBadgeText}>POPULAR</AppText>
            </View>
          </View>
        </View>

        {/* 5. Right Content Column */}
        <View style={styles.right}>
          <View style={styles.titleRow}>
            <AppText numberOfLines={1} style={styles.title}>
              {item.name}
            </AppText>
            {showRating && (
              <View style={styles.ratingBadge}>
                <Ionicons name="star" size={10} color="#FDE047" />
                <AppText style={styles.ratingText}>
                  {item.rating?.toFixed(1)}
                </AppText>
              </View>
            )}
          </View>

          {!!item.description && (
            <AppText numberOfLines={2} style={styles.subtitle}>
              {item.description}
            </AppText>
          )}

          {/* Pricing Row */}
          <View style={styles.priceSection}>
            <AppText
              style={[styles.finalPrice, { color: palette.priceColor }]}
            >
              ₨{Math.max(Math.round(finalPrice), 0)}
            </AppText>

            {isDiscounted && (
              <AppText style={styles.originalPrice}>
                ₨{Math.round(price)}
              </AppText>
            )}

            {isDiscounted && discountBadgeText && (
              <View style={styles.discountBadge}>
                <AppText style={styles.discountText}>
                  {discountBadgeText}
                </AppText>
              </View>
            )}
          </View>

          {isDiscounted && discountEndText && (
            <View style={styles.metaRow}>
              <View style={styles.metaBadge}>
                <AppText style={styles.metaText}>Ends {discountEndText}</AppText>
              </View>
            </View>
          )}
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  cardOuter: {
    width: 290,
    height: 124,
    borderRadius: BorderRadius.lg,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 4,
  },
  cardGradient: {
    flex: 1,
    flexDirection: "row",
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.16)",
    overflow: "hidden",
  },
  shineSweep: {
    position: "absolute",
    top: -40,
    bottom: -40,
    width: 90,
    zIndex: 2,
  },
  shineGradient: {
    flex: 1,
    width: "100%",
  },
  left: {
    width: 108,
    padding: 6,
    zIndex: 3,
  },
  imageWrap: {
    borderRadius: BorderRadius.md,
    backgroundColor: "rgba(0, 0, 0, 0.2)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.25)",
    overflow: "hidden",
    width: "100%",
    height: "100%",
    position: "relative",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  popularBadge: {
    position: "absolute",
    bottom: 4,
    left: 4,
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "rgba(0, 0, 0, 0.65)",
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  popularBadgeText: {
    fontSize: 8,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: 0.4,
  },
  right: {
    flex: 1,
    paddingVertical: 10,
    paddingRight: 10,
    paddingLeft: 4,
    justifyContent: "space-between",
    zIndex: 3,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 4,
  },
  title: {
    fontSize: Typography.sizes.sm,
    fontWeight: "800",
    color: Colors.neutral.white,
    flex: 1,
    letterSpacing: 0.2,
  },
  ratingBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
    backgroundColor: "rgba(255, 255, 255, 0.22)",
    borderWidth: 0.5,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  ratingText: {
    fontSize: 10,
    color: Colors.neutral.white,
    fontWeight: "800",
  },
  subtitle: {
    fontSize: 11,
    color: "rgba(255, 255, 255, 0.8)",
    lineHeight: 14,
    marginTop: 2,
  },
  priceSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 2,
  },
  finalPrice: {
    fontSize: Typography.sizes.base,
    fontWeight: "900",
    letterSpacing: -0.2,
  },
  originalPrice: {
    fontSize: Typography.sizes.xs,
    color: "rgba(255, 255, 255, 0.55)",
    textDecorationLine: "line-through",
  },
  discountBadge: {
    backgroundColor: "rgba(255, 255, 255, 0.22)",
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: BorderRadius.sm,
    borderWidth: 0.5,
    borderColor: "rgba(255, 255, 255, 0.35)",
  },
  discountText: {
    fontSize: 9,
    fontWeight: "800",
    color: Colors.neutral.white,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 2,
  },
  metaBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
    backgroundColor: "rgba(0, 0, 0, 0.25)",
  },
  metaText: {
    fontSize: 9,
    color: "rgba(255, 255, 255, 0.85)",
    fontWeight: "600",
  },
});
