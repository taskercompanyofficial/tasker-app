import AppText from "@/components/common/AppText";
import TrendingServicesCarousel from "@/components/services/TrendingServicesCarousel";
import Colors from "@/constants/Colors";
import { Spacing } from "@/constants/Styles";
import { GET_CATEGORIES_URL } from "@/lib/api-endpoints";
import myAxios from "@/lib/axios.config";
import { Category } from "@/types/category";
import { MainCategory } from "@/types/main-category";
import { Service } from "@/types/service";
import { Ionicons } from "@expo/vector-icons";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import { router } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { RefreshControlProps, ScrollView, StyleSheet, View } from "react-native";
import CategoryCarousel from "./category-hub/CategoryCarousel";
import CategorySearchSection, { SearchResultItem } from "./category-hub/CategorySearchSection";
import CategoryServicesBottomSheet from "./category-hub/CategoryServicesBottomSheet";
import CategoryServicesGrid from "./category-hub/CategoryServicesGrid";

export const SHEET_CORNER_RADIUS = 28;

interface CategoryHubViewProps {
  mainCategory: MainCategory;
  trendingItems?: any[];
  trendingLoading?: boolean;
  refreshControl?: React.ReactElement<RefreshControlProps>;
}

export default function CategoryHubView({
  mainCategory,
  trendingItems,
  trendingLoading,
  refreshControl,
}: CategoryHubViewProps) {
  const categories = mainCategory.categories || [];

  const [activeSlug, setActiveSlug] = useState<string>(
    categories.length > 0 ? categories[0].slug : ""
  );
  const [servicesCache, setServicesCache] = useState<Record<string, Category>>({});
  const [loadingCategory, setLoadingCategory] = useState(false);

  // In-page search query
  const [inPageSearch, setInPageSearch] = useState("");

  // Gorhom Bottom Sheet ref
  const bottomSheetModalRef = useRef<BottomSheetModal>(null);

  // Initialize first active category
  useEffect(() => {
    if (!activeSlug && categories.length > 0) {
      setActiveSlug(categories[0].slug);
    }
  }, [categories, activeSlug]);

  // Fetch Category services when activeSlug changes
  useEffect(() => {
    if (!activeSlug) return;
    if (servicesCache[activeSlug]) return; // Already cached

    let isMounted = true;
    const fetchCategoryDetails = async () => {
      setLoadingCategory(true);
      try {
        const res = await myAxios.get(`${GET_CATEGORIES_URL}/${activeSlug}`);
        const catData: Category = res.data.data;
        if (isMounted && catData) {
          setServicesCache((prev) => ({ ...prev, [activeSlug]: catData }));
        }
      } catch (error) {
        console.error(`Failed to fetch category ${activeSlug}:`, error);
      } finally {
        if (isMounted) setLoadingCategory(false);
      }
    };

    fetchCategoryDetails();

    return () => {
      isMounted = false;
    };
  }, [activeSlug, servicesCache]);

  const activeCategory =
    servicesCache[activeSlug] || categories.find((c) => c.slug === activeSlug);
  const services = activeCategory?.services || [];

  // When a category card is tapped, mark active and open the Gorhom Bottom Sheet
  const handleSelectCategory = (cat: Category) => {
    setActiveSlug(cat.slug);
    bottomSheetModalRef.current?.present();
  };

  const handleSelectService = (service: Service) => {
    router.push(`/customer/services/${service.slug}`);
  };

  // In-page Live Search Results Dropdown
  const searchResults = useMemo(() => {
    const q = inPageSearch.trim().toLowerCase();
    if (!q) return [];

    const results: SearchResultItem[] = [];
    const seen = new Set<string>();

    // Search across cached categories
    Object.values(servicesCache).forEach((cat) => {
      cat.services?.forEach((s) => {
        const key = s.slug || s.name;
        if (
          !seen.has(key) &&
          (s.name.toLowerCase().includes(q) ||
            cat.name.toLowerCase().includes(q) ||
            s.description?.toLowerCase().includes(q))
        ) {
          seen.add(key);
          results.push({ categoryName: cat.name, service: s });
        }
      });
    });

    // Also search active category services
    services.forEach((s) => {
      const key = s.slug || s.name;
      if (
        !seen.has(key) &&
        (s.name.toLowerCase().includes(q) || s.description?.toLowerCase().includes(q))
      ) {
        seen.add(key);
        results.push({ categoryName: activeCategory?.name || "", service: s });
      }
    });

    return results;
  }, [inPageSearch, servicesCache, services, activeCategory]);

  if (categories.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="folder-open-outline" size={40} color={Colors.text.tertiary} />
        <AppText style={styles.emptyTitle}>No categories available</AppText>
        <AppText style={styles.emptySubtitle}>
          We are currently organizing services for {mainCategory.name}. Check back soon!
        </AppText>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* 1. STICKY IN-PAGE SEARCH BAR (Pinned at top of white curved sheet) */}
      <View style={styles.stickySearchContainer}>
        <CategorySearchSection
          searchQuery={inPageSearch}
          onSearchChange={setInPageSearch}
          searchResults={searchResults}
          placeholderText={`Search ${activeCategory?.name || "services"}...`}
          onOpenFilter={() => bottomSheetModalRef.current?.present()}
          onSelectService={handleSelectService}
        />
      </View>

      {/* 2. SCROLLABLE CONTENT (Categories Carousel, Services List, Trending Services) */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={refreshControl}
      >
        {/* Categories Carousel (Horizontally Scrollable 3x2 Pages) */}
        <CategoryCarousel
          categories={categories}
          activeSlug={activeSlug}
          onSelectCategory={handleSelectCategory}
        />

        {/* Services List (Clean rows, no prices, complete contain image) */}
        <CategoryServicesGrid
          services={services}
          activeCategoryName={activeCategory?.name}
          loading={loadingCategory && !servicesCache[activeSlug]}
          onOpenSheet={() => bottomSheetModalRef.current?.present()}
          onSelectService={handleSelectService}
        />

        {/* Trending Services Carousel */}
        {trendingItems && trendingItems.length > 0 && (
          <View style={styles.trendingWrapper}>
            <TrendingServicesCarousel
              items={trendingItems}
              loading={trendingLoading}
              onViewAll={() => router.push("/customer/(tabs)/services")}
            />
          </View>
        )}
      </ScrollView>

      {/* 3. Gorhom Bottom Sheet (Grid / List View toggle, default Grid) */}
      <CategoryServicesBottomSheet
        bottomSheetModalRef={bottomSheetModalRef}
        activeCategory={activeCategory || null}
        services={services}
        loading={loadingCategory && !servicesCache[activeSlug]}
        onSelectService={handleSelectService}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
  /* Sticky Search Container pinned at the top without bottom shadow */
  stickySearchContainer: {
    paddingHorizontal: Spacing.md,
    paddingTop: 16,
    paddingBottom: 4,
    backgroundColor: Colors.background.primary,
    zIndex: 50,
    elevation: 0,
    shadowOpacity: 0,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.md,
    paddingTop: 4,
    paddingBottom: 40,
  },
  trendingWrapper: {
    marginTop: Spacing.sm,
    paddingBottom: Spacing.xl,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 48,
    paddingHorizontal: 24,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.text.primary,
  },
  emptySubtitle: {
    fontSize: 13,
    color: Colors.text.tertiary,
    textAlign: "center",
    lineHeight: 18,
  },
});
