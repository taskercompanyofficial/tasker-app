import AppText from "@/components/common/AppText";
import DirectionalIcon from "@/components/common/DirectionalIcon";
import Colors from "@/constants/Colors";
import { Spacing, Typography } from "@/constants/Styles";
import getImageUrl from "@/lib/utils";
import { Category } from "@/types/category";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import React, { useMemo, useRef, useState } from "react";
import {
  Dimensions,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";

const { width } = Dimensions.get("window");
const HORIZONTAL_PADDING = Spacing.md; // 16
const CONTENT_WIDTH = width - HORIZONTAL_PADDING * 2;

// 3-column compact grid for Categories (borderless, big image)
const CAT_GAP = 10;
const CAT_CARD_WIDTH = (CONTENT_WIDTH - CAT_GAP * 2) / 3;

interface CategoryCarouselProps {
  categories: Category[];
  activeSlug: string;
  onSelectCategory: (cat: Category) => void;
}

export default function CategoryCarousel({
  categories,
  activeSlug,
  onSelectCategory,
}: CategoryCarouselProps) {
  const catCarouselRef = useRef<ScrollView>(null);
  const [currentCatPage, setCurrentCatPage] = useState(0);

  // 6 items per page (3 columns x 2 rows)
  const categoryPages = useMemo(() => {
    const pages: Category[][] = [];
    for (let i = 0; i < categories.length; i += 6) {
      pages.push(categories.slice(i, i + 6));
    }
    return pages.length > 0 ? pages : [[]];
  }, [categories]);

  const handleNextPage = () => {
    const nextPage = (currentCatPage + 1) % categoryPages.length;
    setCurrentCatPage(nextPage);
    catCarouselRef.current?.scrollTo({
      x: nextPage * CONTENT_WIDTH,
      animated: true,
    });
  };

  if (categories.length === 0) return null;

  return (
    <View style={styles.container}>
      {/* Categories Header */}
      <View style={styles.sectionHeader}>
        <AppText style={styles.sectionTitle}>Categories</AppText>
        {categoryPages.length > 1 && (
          <TouchableOpacity
            style={styles.viewAllRow}
            onPress={handleNextPage}
            activeOpacity={0.7}
          >
            <AppText style={styles.viewAllText}>
              {currentCatPage < categoryPages.length - 1 ? "Next" : "Back to 1st"}
            </AppText>
            <DirectionalIcon
              name="arrow-forward"
              size={12}
              color={Colors.themes.customer.primary}
            />
          </TouchableOpacity>
        )}
      </View>

      {/* Horizontally Scrollable Category Grid Pages (3 cols x 2 rows per page) */}
      <ScrollView
        ref={catCarouselRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) => {
          const page = Math.round(e.nativeEvent.contentOffset.x / CONTENT_WIDTH);
          setCurrentCatPage(page);
        }}
        scrollEventThrottle={16}
        style={styles.catCarousel}
        contentContainerStyle={styles.catCarouselContent}
      >
        {categoryPages.map((pageCats, pageIdx) => (
          <View key={pageIdx} style={styles.catGridPage}>
            {pageCats.map((cat) => {
              const isActive = cat.slug === activeSlug;
              const imageUrl = cat.image ? getImageUrl(cat.image) : null;

              return (
                <TouchableOpacity
                  key={cat.id || cat.slug}
                  activeOpacity={0.75}
                  onPress={() => onSelectCategory(cat)}
                  style={styles.catCard}
                >
                  {/* Big Category Image (68x58) */}
                  <View style={styles.catImageWrapper}>
                    {imageUrl ? (
                      <Image
                        source={{ uri: imageUrl }}
                        style={styles.catImage}
                        contentFit="contain"
                      />
                    ) : (
                      <Ionicons
                        name="grid-outline"
                        size={38}
                        color={
                          isActive
                            ? Colors.themes.customer.primary
                            : Colors.text.tertiary
                        }
                      />
                    )}
                  </View>

                  {/* Multi-line Text: only text is colored when active */}
                  <AppText
                    style={[
                      styles.catName,
                      isActive ? styles.catNameActive : styles.catNameInactive,
                    ]}
                    numberOfLines={2}
                  >
                    {cat.name.toUpperCase()}
                  </AppText>
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </ScrollView>

      {/* Dynamic Pagination Dash Indicators */}
      {categoryPages.length > 1 && (
        <View style={styles.indicatorContainer}>
          {categoryPages.map((_, idx) => (
            <View
              key={idx}
              style={
                idx === currentCatPage
                  ? styles.indicatorActiveDash
                  : styles.indicatorInactiveLine
              }
            />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.xs,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.xs,
    paddingTop: 4,
  },
  sectionTitle: {
    fontSize: Typography.sizes.base,
    fontWeight: "800",
    color: Colors.text.primary,
    letterSpacing: -0.2,
  },
  viewAllRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 2,
  },
  viewAllText: {
    fontSize: Typography.sizes.xs,
    fontWeight: "700",
    color: Colors.themes.customer.primary,
  },
  catCarousel: {
    width: CONTENT_WIDTH,
  },
  catCarouselContent: {
    alignItems: "flex-start",
  },
  catGridPage: {
    width: CONTENT_WIDTH,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: CAT_GAP,
  },
  catCard: {
    width: CAT_CARD_WIDTH,
    minHeight: 104,
    alignItems: "center",
    justifyContent: "flex-start",
    paddingVertical: 4,
    backgroundColor: "transparent",
    borderWidth: 0,
    elevation: 0,
    shadowOpacity: 0,
  },
  catImageWrapper: {
    width: 68,
    height: 58,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  catImage: {
    width: "100%",
    height: "100%",
  },
  catName: {
    fontSize: 11,
    textAlign: "center",
    lineHeight: 15,
    paddingHorizontal: 2,
  },
  catNameActive: {
    color: Colors.themes.customer.primary,
    fontWeight: "800",
  },
  catNameInactive: {
    color: Colors.text.primary,
    fontWeight: "600",
  },
  indicatorContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    marginTop: 6,
    marginBottom: 4,
  },
  indicatorActiveDash: {
    width: 22,
    height: 3,
    borderRadius: 2,
    backgroundColor: Colors.themes.customer.primary,
  },
  indicatorInactiveLine: {
    width: 8,
    height: 3,
    borderRadius: 2,
    backgroundColor: Colors.neutral.gray[300],
  },
});
