import AppText from "@/components/common/AppText";
import DirectionalIcon from "@/components/common/DirectionalIcon";
import { useLanguage } from "@/context/language-context";
import Colors from "@/constants/Colors";
import { Spacing, Typography, BorderRadius, Shadows } from "@/constants/Styles";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import {
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
  Image,
  FlatList,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export const SHOP_CATEGORIES = [
  { id: "1", name: "AC", icon: "snow-outline" },
  { id: "2", name: "Washing Machine", icon: "water-outline" },
  { id: "3", name: "Geysers", icon: "flame-outline" },
  { id: "4", name: "Dispensers", icon: "cube-outline" },
  { id: "5", name: "Refrigerators", icon: "fast-food-outline" },
];

export const SHOP_PRODUCTS = [
  {
    id: "p1",
    name: "Inverter Split AC 1.5 Ton",
    price: 450.0,
    category: "AC",
    rating: 4.8,
    reviews: 124,
    image:
      "https://images.unsplash.com/photo-1610555356070-d1fb3313e96b?w=400&q=80",
  },
  {
    id: "p2",
    name: "Front Load Washing Machine 8kg",
    price: 320.5,
    category: "Washing Machine",
    rating: 4.6,
    reviews: 89,
    image:
      "https://images.unsplash.com/photo-1610552050890-fe99536c2615?w=400&q=80",
  },
  {
    id: "p3",
    name: "Electric Water Geyser 30L",
    price: 110.0,
    category: "Geysers",
    rating: 4.5,
    reviews: 42,
    image:
      "https://plus.unsplash.com/premium_photo-1678225381861-53ed9ee8be08?w=400&q=80",
  },
  {
    id: "p4",
    name: "Hot & Cold Water Dispenser",
    price: 140.0,
    category: "Dispensers",
    rating: 4.9,
    reviews: 210,
    image:
      "https://images.unsplash.com/photo-1542475143-5ec9de8482fe?w=400&q=80",
  },
  {
    id: "p5",
    name: "Double Door Refrigerator 320L",
    price: 520.0,
    category: "Refrigerators",
    rating: 4.7,
    reviews: 315,
    image:
      "https://images.unsplash.com/photo-1584568694244-14fbdf83bd30?w=400&q=80",
  },
  {
    id: "p6",
    name: "Top Load Washing Machine 7kg",
    price: 260.0,
    category: "Washing Machine",
    rating: 4.4,
    reviews: 56,
    image:
      "https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?w=400&q=80",
  },
];

export default function ShopHome() {
  const { t } = useLanguage();
  const renderCategory = ({ item }: { item: (typeof SHOP_CATEGORIES)[0] }) => (
    <TouchableOpacity style={styles.categoryItem} activeOpacity={0.8}>
      <View style={styles.categoryIconWrap}>
        <Ionicons
          name={item.icon as any}
          size={20}
          color={Colors.text.primary}
        />
      </View>
      <AppText style={styles.categoryName} numberOfLines={1}>
        {item.name}
      </AppText>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Compact Solid Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.headerButton}
        >
          <DirectionalIcon name="arrow-back" size={20} color={Colors.neutral.white} />
        </TouchableOpacity>
        <AppText style={styles.headerTitle}>Tasker Shop</AppText>
        <TouchableOpacity style={styles.headerButton}>
          <Ionicons name="search" size={20} color={Colors.neutral.white} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Compact Banner */}
        <View style={styles.banner}>
          <View style={styles.bannerContent}>
            <AppText style={styles.bannerTitle}>Home Appliances</AppText>
            <AppText style={styles.bannerSubtitle}>
              Upgrade your home with modern appliances.
            </AppText>
            <TouchableOpacity style={styles.bannerBtn} activeOpacity={0.9}>
              <AppText style={styles.bannerBtnText}>Shop Sale</AppText>
            </TouchableOpacity>
          </View>
          <Ionicons
            name="construct"
            size={60}
            color="rgba(255,255,255,0.15)"
            style={styles.bannerIcon}
          />
        </View>

        {/* Categories Horizontal */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <AppText style={styles.sectionTitle}>{t.common.categories}</AppText>
            <TouchableOpacity>
              <AppText style={styles.seeAllText}>{t.common.viewAll}</AppText>
            </TouchableOpacity>
          </View>
          <FlatList
            data={SHOP_CATEGORIES}
            renderItem={renderCategory}
            keyExtractor={(i) => i.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesList}
          />
        </View>

        {/* Products Grid */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <AppText style={styles.sectionTitle}>Trending Now</AppText>
          </View>

          <View style={styles.productGrid}>
            {SHOP_PRODUCTS.map((product) => (
              <TouchableOpacity
                key={product.id}
                style={styles.productCard}
                activeOpacity={0.9}
              >
                <View style={styles.productImageWrap}>
                  <Image
                    source={{ uri: product.image }}
                    style={styles.productImage}
                  />
                  <TouchableOpacity style={styles.favoriteBtn}>
                    <Ionicons
                      name="heart-outline"
                      size={16}
                      color={Colors.text.primary}
                    />
                  </TouchableOpacity>
                </View>
                <View style={styles.productInfo}>
                  <AppText style={styles.productCategory}>{product.category}</AppText>
                  <AppText style={styles.productName} numberOfLines={2}>
                    {product.name}
                  </AppText>

                  <View style={styles.ratingRow}>
                    <Ionicons name="star" size={10} color={Colors.warning} />
                    <AppText style={styles.ratingText}>{product.rating}</AppText>
                    <AppText style={styles.reviewsText}>({product.reviews})</AppText>
                  </View>

                  <View style={styles.priceRow}>
                    <AppText style={styles.productPrice}>
                      ${product.price.toFixed(2)}
                    </AppText>
                    <TouchableOpacity style={styles.addBtn}>
                      <Ionicons
                        name="add"
                        size={16}
                        color={Colors.neutral.white}
                      />
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.secondary,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.md,
    height: 48, // compact
    backgroundColor: Colors.text.primary, // dark solid professional top
  },
  headerButton: {
    padding: Spacing.xs,
  },
  headerTitle: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.bold,
    color: Colors.neutral.white,
    letterSpacing: 0.5,
  },
  scrollContent: {
    paddingBottom: Spacing.xl,
  },
  banner: {
    margin: Spacing.md,
    backgroundColor: Colors.themes.customer.primary,
    borderRadius: BorderRadius.sm, // Less rounded
    padding: Spacing.md,
    flexDirection: "row",
    overflow: "hidden",
    alignItems: "center",
    ...Shadows.sm,
  },
  bannerContent: {
    flex: 1,
    zIndex: 2,
  },
  bannerTitle: {
    color: Colors.neutral.white,
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.extrabold,
    marginBottom: 4,
  },
  bannerSubtitle: {
    color: "rgba(255,255,255,0.9)",
    fontSize: Typography.sizes.xs,
    marginBottom: Spacing.sm,
  },
  bannerBtn: {
    backgroundColor: Colors.neutral.white,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    borderRadius: 4, // Very compact and solid
    alignSelf: "flex-start",
  },
  bannerBtnText: {
    color: Colors.themes.customer.primary,
    fontWeight: Typography.weights.bold,
    fontSize: Typography.sizes.xs,
  },
  bannerIcon: {
    position: "absolute",
    right: -10,
    bottom: -15,
    zIndex: 1,
    transform: [{ rotate: "-15deg" }],
  },
  section: {
    marginBottom: Spacing.lg,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
  },
  sectionTitle: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.bold,
    color: Colors.text.primary,
  },
  seeAllText: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.semibold,
    color: Colors.themes.customer.primary,
  },
  categoriesList: {
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
  },
  categoryItem: {
    alignItems: "center",
    width: 72,
  },
  categoryIconWrap: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.sm, // square-ish
    backgroundColor: Colors.neutral.white,
    borderWidth: 1,
    borderColor: Colors.border.light,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 6,
    ...Shadows.sm,
  },
  categoryName: {
    fontSize: 10,
    fontWeight: Typography.weights.medium,
    color: Colors.text.secondary,
    textAlign: "center",
  },
  productGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: Spacing.sm, // Slightly smaller padding to fit items tightly
    gap: Spacing.sm,
    justifyContent: "space-between",
  },
  productCard: {
    width: "48%", // 2 columns
    backgroundColor: Colors.neutral.white,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.border.light,
    overflow: "hidden",
    marginBottom: Spacing.xs,
  },
  productImageWrap: {
    width: "100%",
    aspectRatio: 1,
    backgroundColor: Colors.neutral.gray[100],
    position: "relative",
  },
  productImage: {
    width: "100%",
    height: "100%",
  },
  favoriteBtn: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.9)",
    justifyContent: "center",
    alignItems: "center",
    ...Shadows.sm,
  },
  productInfo: {
    padding: Spacing.sm,
  },
  productCategory: {
    fontSize: 9,
    color: Colors.text.tertiary,
    textTransform: "uppercase",
    fontWeight: Typography.weights.bold,
    marginBottom: 2,
  },
  productName: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.semibold,
    color: Colors.text.primary,
    lineHeight: 16,
    height: 32, // Fixed height for 2 lines
    marginBottom: 4,
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    marginBottom: Spacing.xs,
  },
  ratingText: {
    fontSize: 10,
    fontWeight: Typography.weights.bold,
    color: Colors.text.primary,
  },
  reviewsText: {
    fontSize: 10,
    color: Colors.text.tertiary,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    marginTop: 4,
  },
  productPrice: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.extrabold,
    color: Colors.text.primary,
  },
  addBtn: {
    backgroundColor: Colors.themes.customer.primary,
    width: 24,
    height: 24,
    borderRadius: 4, // Less rounded compact button
    justifyContent: "center",
    alignItems: "center",
  },
});
