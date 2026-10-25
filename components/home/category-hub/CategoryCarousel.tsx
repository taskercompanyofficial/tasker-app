import React, { useMemo, useRef, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import AppText from "@/components/common/AppText";
import DirectionalIcon from "@/components/common/DirectionalIcon";
import Colors from "@/constants/Colors";
import { Spacing, Typography } from "@/constants/Styles";
import getImageUrl from "@/lib/utils";
import { Category } from "@/types/category";

const HORIZONTAL_PADDING = Spacing.md; // 16
const CAT_GAP = 10;

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
  const { width: windowWidth } = useWindowDimensions();
  const contentWidth = windowWidth - HORIZONTAL_PADDING * 2;

  const catCarouselRef = useRef<ScrollView>(null);
  const [currentCatPage, setCurrentCatPage] = useState(0);

  // Layout configuration:
  // - If category count is < 5 and in a pair of 2 (i.e. 2 or 4 items):
  //   Show 2 in a row, max 2 rows per page (max 4 items per page).
  // - If 5 or further (or 3):
  //   Show 3 in a row, max 2 rows per page (max 6 items per page).
  // - If items exceed the 2-row page limit, slide proceed to next page.
  const columnsPerRow = useMemo(() => {
    if (categories.length < 5 && categories.length % 2 === 0) {
      return 2;
    }
    return 3;
  }, [categories.length]);

  const maxRowsPerPage = 2;
  const itemsPerPage = columnsPerRow * maxRowsPerPage; // 4 if 2 cols, 6 if 3 cols

  const categoryPages = useMemo(() => {
    const pages: Category[][] = [];
    for (let i = 0; i < categories.length; i += itemsPerPage) {
      pages.push(categories.slice(i, i + itemsPerPage));
    }
    return pages.length > 0 ? pages : [[]];
  }, [categories, itemsPerPage]);

  const handleNextPage = () => {
    const nextPage = (currentCatPage + 1) % categoryPages.length;
    setCurrentCatPage(nextPage);
    catCarouselRef.current?.scrollTo({
      x: nextPage * contentWidth,
      animated: true,
    });
  };

  if (categories.length === 0) return null;

  const renderCategoryCard = (cat: Category) => {
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
  };

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

      {/* Horizontally Scrollable Category Grid Pages */}
      <ScrollView
        ref={catCarouselRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) => {
          const page = Math.round(e.nativeEvent.contentOffset.x / contentWidth);
          setCurrentCatPage(page);
        }}
        scrollEventThrottle={16}
        style={{ width: contentWidth }}
        contentContainerStyle={styles.catCarouselContent}
      >
        {categoryPages.map((pageCats, pageIdx) => {
          // Chunk page into rows of columnsPerRow (max 2 rows per page)
          const rows: Category[][] = [];
          for (let i = 0; i < pageCats.length; i += columnsPerRow) {
            rows.push(pageCats.slice(i, i + columnsPerRow));
          }

          return (
            <View key={pageIdx} style={[styles.catGridPage, { width: contentWidth }]}>
              {rows.map((rowCats, rIdx) => (
                <View key={`row-${rIdx}`} style={styles.catRow}>
                  {rowCats.map((cat) => renderCategoryCard(cat))}
                  {rowCats.length < columnsPerRow &&
                    Array.from({ length: columnsPerRow - rowCats.length }).map((_, i) => (
                      <View key={`empty-${rIdx}-${i}`} style={styles.catCardPlaceholder} />
                    ))}
                </View>
              ))}
            </View>
          );
        })}
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
  catCarouselContent: {
    alignItems: "flex-start",
  },
  catGridPage: {
    flexDirection: "column",
  },
  catRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    width: "100%",
    gap: CAT_GAP,
    marginBottom: 6,
  },
  catCard: {
    flex: 1, // Dynamically takes exactly 1/columnsPerRow of row width minus gaps on any screen size
    minHeight: 104,
    alignItems: "center",
    justifyContent: "flex-start",
    paddingVertical: 4,
    backgroundColor: "transparent",
    borderWidth: 0,
    elevation: 0,
    shadowOpacity: 0,
  },
  catCardPlaceholder: {
    flex: 1,
    minHeight: 104,
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
