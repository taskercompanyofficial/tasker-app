import AppText from "@/components/common/AppText";
import Colors from "@/constants/Colors";
import { BorderRadius, Spacing, Typography } from "@/constants/Styles";
import { BACKEND_URL, GET_MAIN_CATEGORIES_URL } from "@/lib/api-endpoints";
import myAxios from "@/lib/axios.config";
import { localizeCategoryDescription } from "@/lib/i18n/category-copy";
import { useLanguage } from "@/context/language-context";
import { MainCategory } from "@/types/main-category";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Image,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Loader from "../Loader";

const CARD_GAP = Spacing.sm;

export default function CategoriesCards() {
  const { language } = useLanguage();
  const [categories, setCategories] = useState<MainCategory[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCategories = async () => {
    try {
      const res = await myAxios.get(GET_MAIN_CATEGORIES_URL);
      const fetchedCategories: MainCategory[] = res.data.data || [];
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

  const renderCategoryCard = (item: MainCategory, isFullWidth: boolean) => {
    const imageUrl = item.image ? `${BACKEND_URL}/storage/${item.image}` : null;
    const tagCount = Array.isArray(item.tags) ? item.tags.length : 0;

    if (isFullWidth) {
      return (
        <TouchableOpacity
          key={item.id}
          style={[styles.card, styles.cardFullWidth]}
          activeOpacity={0.8}
          onPress={() => router.push(`/customer/(tabs)/${item.slug}` as any)}
        >
          {/* Background decorative elements */}
          <View style={styles.decoCircle1} />
          <View style={styles.decoCircle2} />

          {/* Left Content */}
          <View style={styles.contentFullWidth}>
            <AppText style={styles.categoryNameFull} numberOfLines={1}>
              {item.name}
            </AppText>
            {item.description && (
              <AppText style={styles.description} numberOfLines={2}>
                {localizeCategoryDescription(item.description, language)}
              </AppText>
            )}

            {/* Tags Badge */}
            {tagCount > 0 && (
              <View style={styles.tagBadge}>
                <Ionicons name="pricetag" size={8} color={Colors.themes.customer.primary} />
                <AppText style={styles.tagCount}>{tagCount} services</AppText>
              </View>
            )}
          </View>

          {/* Right Image */}
          <View style={styles.imageContainerFull}>
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
                  size={24}
                  color={Colors.text.tertiary}
                />
              </View>
            )}
          </View>

          {/* Status Indicator */}
          {item.status === "active" && <View style={styles.activeIndicator} />}
        </TouchableOpacity>
      );
    }

    return (
      <TouchableOpacity
        key={item.id}
        style={[styles.card, styles.cardHalf]}
        activeOpacity={0.8}
        onPress={() => router.push(`/customer/(tabs)/${item.slug}` as any)}
      >
        {/* Background decorative elements */}
        <View style={styles.decoCircle1} />
        <View style={styles.decoCircle2} />

        {/* Image */}
        <View style={styles.imageContainer}>
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
                size={20}
                color={Colors.text.tertiary}
              />
            </View>
          )}
        </View>

        {/* Content */}
        <View style={styles.content}>
          <AppText style={styles.categoryName} numberOfLines={2}>
            {item.name}
          </AppText>
          {item.description && (
            <AppText style={styles.description} numberOfLines={1}>
              {localizeCategoryDescription(item.description, language)}
            </AppText>
          )}

          {/* Tags Badge */}
          {tagCount > 0 && (
            <View style={styles.tagBadge}>
              <Ionicons name="pricetag" size={8} color={Colors.themes.customer.primary} />
              <AppText style={styles.tagCount}>{tagCount} services</AppText>
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

  return (
    <View style={styles.container}>
      {categories.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons
            name="grid-outline"
            size={40}
            color={Colors.text.tertiary}
          />
          <AppText style={styles.emptyText}>No categories available</AppText>
        </View>
      ) : (
        <View style={styles.listContent}>
          {categories.reduce((rows: React.ReactElement[], category, index) => {
            if (index % 2 === 0) {
              const isLastItem = index === categories.length - 1;

              if (isLastItem) {
                // If it's the last item and odd (e.g. 3rd or 5th), span 2 (full width)
                rows.push(
                  <View key={`row-${index}`} style={styles.row}>
                    {renderCategoryCard(category, true)}
                  </View>
                );
              } else {
                // Normal pair of 2 items
                const rowItems = categories.slice(index, index + 2);
                rows.push(
                  <View key={`row-${index}`} style={styles.row}>
                    {rowItems.map((item) => renderCategoryCard(item, false))}
                  </View>
                );
              }
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
  },
  listContent: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  row: {
    flexDirection: "row",
    alignItems: "stretch",
    gap: CARD_GAP,
    marginBottom: Spacing.sm,
  },
  card: {
    backgroundColor: Colors.background.tertiary,
    borderRadius: BorderRadius.md,
    overflow: "hidden",
    position: "relative",
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border.light,
  },
  cardHalf: {
    flex: 1,
  },
  cardFullWidth: {
    flex: 1,
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    minHeight: 85,
  },
  contentFullWidth: {
    flex: 1,
    paddingEnd: Spacing.sm,
  },
  imageContainerFull: {
    width: 65,
    height: 65,
    borderRadius: BorderRadius.sm,
  },
  decoCircle1: {
    position: "absolute",
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(0,0,0,0.03)",
    top: -20,
    right: -20,
  },
  decoCircle2: {
    position: "absolute",
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "rgba(0,0,0,0.02)",
    bottom: -15,
    right: 40,
  },
  imageContainer: {
    width: "100%",
    height: 60,
    position: "relative",
    borderRadius: BorderRadius.sm,
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
  content: {
    paddingTop: Spacing.xs,
  },
  categoryName: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.bold,
    color: Colors.text.primary,
    marginBottom: 1,
  },
  categoryNameFull: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.bold,
    color: Colors.text.primary,
    marginBottom: 2,
  },
  description: {
    fontSize: 10,
    color: Colors.text.tertiary,
    lineHeight: 13,
    marginBottom: Spacing.xs,
  },
  tagBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: Colors.themes.customer.primary + "15",
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
