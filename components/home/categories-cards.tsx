import Colors from "@/constants/Colors";
import { Spacing, BorderRadius, Typography, Shadows } from "@/constants/Styles";
import { BACKEND_URL, GET_CATEGORIES_URL } from "@/lib/api-endpoints";
import myAxios from "@/lib/axios.config";
import { Category } from "@/types/category";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Dimensions,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Loader from "../Loader";
import { SafeAreaView } from "react-native-safe-area-context";

const { width } = Dimensions.get("window");
const CARD_GAP = Spacing.sm;
const SINGLE_CARD_WIDTH = width - Spacing.md * 2;
const DOUBLE_CARD_WIDTH = (width - Spacing.md * 2 - CARD_GAP) / 2;

export default function CategoriesCards() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCategories = async () => {
    try {
      const res = await myAxios.get(GET_CATEGORIES_URL);
      const fetchedCategories: Category[] = res.data.data || [];
      setCategories(fetchedCategories);
    } catch (error) {
      console.error("Failed to fetch categories:", error);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchCategories();
  }, []);

  const renderCategoryCard = (item: Category, isFullWidth: boolean) => {
    const imageUrl = item.image ? `${BACKEND_URL}/storage/${item.image}` : null;
    const tagCount = Array.isArray(item.tags) ? item.tags.length : 0;
    const cardWidth = isFullWidth ? SINGLE_CARD_WIDTH : DOUBLE_CARD_WIDTH;
    const isComingSoon = (item.status || "").toLowerCase() === "comming-soon";

    return (
      <TouchableOpacity
        key={item.id}
        style={[styles.card, { width: cardWidth }]}
        activeOpacity={0.8}
        onPress={() => router.push(`/customer/(tabs)/${item.slug}` as any)}
      >
        {/* Image */}
        <View
          style={[
            styles.imageContainer,
            isFullWidth && styles.imageContainerFull,
          ]}
        >
          {imageUrl ? (
            <Image
              source={{ uri: imageUrl }}
              style={styles.image}
              resizeMode="contain"
            />
          ) : (
            <View style={[styles.image, styles.placeholderImage]}>
              <Ionicons
                name="image-outline"
                size={isFullWidth ? 32 : 20}
                color={Colors.text.tertiary}
              />
            </View>
          )}
        </View>

        {/* Content */}
        <View style={styles.content}>
          <Text
            style={[
              styles.categoryName,
              isFullWidth && styles.categoryNameFull,
            ]}
            numberOfLines={1}
          >
            {item.name}
          </Text>
          {item.description && (
            <Text
              style={styles.description}
              numberOfLines={isFullWidth ? 2 : 1}
            >
              {isFullWidth
                ? item.description
                : item.description.slice(0, 20).concat("...")}
            </Text>
          )}

          {/* Tags Badge */}
          {tagCount > 0 && (
            <View style={styles.tagBadge}>
              <Ionicons name="pricetag" size={8} color={Colors.themes.customer.primary} />
              <Text style={styles.tagCount}>{tagCount} services</Text>
            </View>
          )}
        </View>

        

        {/* Status Indicator */}
        {item.status === "active" && <View style={styles.activeIndicator} />}
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <Loader fullScreen size="small" />
      </SafeAreaView>
    );
  }

  // Smart grid: 1 category = full width, 2+ = 2 per row
  const isSingleCategory = categories.length === 1;

  return (
    <View style={styles.container}>
      {categories.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons
            name="grid-outline"
            size={40}
            color={Colors.text.tertiary}
          />
          <Text style={styles.emptyText}>No categories available</Text>
        </View>
      ) : isSingleCategory ? (
        // Single category - full width
        <View style={styles.listContent}>
          {renderCategoryCard(categories[0], true)}
        </View>
      ) : (
        // Multiple categories - 2 per row grid
        <View style={styles.listContent}>
          {categories.reduce((rows: React.ReactElement[], category, index) => {
            if (index % 2 === 0) {
              // Start a new row
              const rowItems = categories.slice(index, index + 2);
              rows.push(
                <View key={`row-${index}`} style={styles.row}>
                  {rowItems.map((item) => renderCategoryCard(item, false))}
                </View>,
              );
            }
            return rows;
          }, [])}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: Spacing.sm,
    flex: 1,
    height: "100%",
  },
  listContent: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: Spacing.sm,
  },
  card: {
    backgroundColor: Colors.neutral.white,
    borderRadius: BorderRadius.sm,
    overflow: "hidden",
    ...Shadows.sm,
    position: "relative",
    paddingHorizontal: Spacing.sm,
  },
  cardDisabled: {
    opacity: 0.75,
  },
  imageContainer: {
    width: "100%",
    height: 60,
    position: "relative",
    // backgroundColor: Colors.neutral.gray[100],
    borderRadius: BorderRadius.sm,
  },
  imageContainerFull: {
    height: 100,
  },
  image: {
    width: "100%",
    height: "100%",
    borderRadius: BorderRadius.sm,
  },
  placeholderImage: {
    backgroundColor: Colors.neutral.gray[100],
    justifyContent: "center",
    alignItems: "center",
  },
  comingSoonOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: Colors.neutral.white,
    opacity: 0.6,
  },
  comingSoonTag: {
    position: "absolute",
    left: Spacing.sm,
    right: Spacing.sm,
    bottom: Spacing.xs,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.neutral.gray[100],
    borderWidth: 1,
    borderColor: Colors.border.light,
  },
  comingSoonTagText: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.semibold,
    color: Colors.text.primary,
  },
  content: {
    padding: Spacing.xs,
  },
  categoryName: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.bold,
    color: Colors.text.primary,
    marginBottom: 1,
  },
  categoryNameFull: {
    fontSize: Typography.sizes.sm,
  },
  description: {
    fontSize: 10,
    color: Colors.text.tertiary,
    lineHeight: 12,
    marginBottom: Spacing.xs,
  },
  tagBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    backgroundColor: Colors.themes.customer.primary + "10",
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
    alignSelf: "flex-start",
  },
  tagCount: {
    fontSize: 9,
    fontWeight: Typography.weights.semibold,
    color: Colors.themes.customer.primary,
  },
  activeIndicator: {
    position: "absolute",
    top: Spacing.xs,
    right: Spacing.xs,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.success,
    borderWidth: 1.5,
    borderColor: Colors.neutral.white,
  },
  emptyContainer: {
    padding: Spacing.lg,
    alignItems: "center",
    gap: Spacing.xs,
  },
  emptyText: {
    fontSize: Typography.sizes.xs,
    color: Colors.text.tertiary,
    fontWeight: Typography.weights.medium,
  },
});
