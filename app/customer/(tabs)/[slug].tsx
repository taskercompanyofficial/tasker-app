import AppText from "@/components/common/AppText";
import DirectionalIcon from "@/components/common/DirectionalIcon";
import CategoryHubView from "@/components/home/CategoryHubView";
import CategoryHubHeader, {
  GRADIENT_BOTTOM_COLOR,
} from "@/components/home/category-hub/CategoryHubHeader";
import { MainCategoryPageSkeleton } from "@/components/Skeleton";
import TrendingServicesCarousel from "@/components/services/TrendingServicesCarousel";
import Colors from "@/constants/Colors";
import { BorderRadius, Spacing, Typography } from "@/constants/Styles";
import { useFetchTrendingParentServices } from "@/hooks/useFetchTrendingParentServices";
import { GET_MAIN_CATEGORIES_URL } from "@/lib/api-endpoints";
import myAxios from "@/lib/axios.config";
import { MainCategory } from "@/types/main-category";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";

let lastKnownSlug: string | null = null;

export default function MainCategoryHubPage() {
  const params = useLocalSearchParams<{ slug: string }>();
  const slug = params.slug || lastKnownSlug;

  useEffect(() => {
    if (params.slug) {
      lastKnownSlug = params.slug;
    }
  }, [params.slug]);

  useEffect(() => {
    if (!slug) {
      router.replace("/customer/index");
    }
  }, [slug]);

  const [mainCategory, setMainCategory] = useState<MainCategory | null>(null);
  const [loading, setLoading] = useState(true);
  const { data: trending, loading: trendingLoading } = useFetchTrendingParentServices(10);

  const fetchMainCategory = async () => {
    if (!slug) return;
    try {
      const res = await myAxios.get(`${GET_MAIN_CATEGORIES_URL}/${slug}`);
      const categoryData: MainCategory = res.data.data || null;
      setMainCategory(categoryData);
    } catch (error) {
      console.error("Failed to fetch main category:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMainCategory();
  }, [slug]);

  const refresh = () => {
    setLoading(true);
    fetchMainCategory();
  };

  if (loading) {
    return <MainCategoryPageSkeleton />;
  }

  const isComingSoon = mainCategory?.status === "comming-soon";

  return (
    <View style={styles.rootContainer}>
      <StatusBar barStyle="light-content" backgroundColor="#08192E" />

      {/* 1. FIXED NON-SCROLLABLE DEEP NAVY GRADIENT HEADER */}
      <CategoryHubHeader
        mainCategory={mainCategory}
        onBack={() => router.replace("/customer")}
      />

      {/* 2. SHEET-TYPE WHITE CURVED BACKGROUND PORTION */}
      <View style={styles.sheetContainerWrapper}>
        {isComingSoon ? (
          <ScrollView
            refreshControl={
              <RefreshControl
                refreshing={loading}
                onRefresh={refresh}
                tintColor={Colors.themes.customer.primary}
              />
            }
            style={styles.sheetScrollView}
            contentContainerStyle={styles.sheetScrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.comingSoonContainer}>
              <View style={styles.comingSoonCard}>
                <View style={styles.iconCircle}>
                  <Ionicons
                    name="rocket-outline"
                    size={44}
                    color={Colors.themes.customer.primary}
                  />
                </View>
                <AppText style={styles.comingSoonTitle}>Launching Soon!</AppText>
                <AppText style={styles.comingSoonSubtitle}>
                  We are working hard to bring {mainCategory?.name || "this category"} to your doorstep. Stay tuned for updates!
                </AppText>
                <TouchableOpacity
                  style={styles.notifyButton}
                  onPress={() => router.push("/customer/(tabs)/services")}
                >
                  <AppText style={styles.notifyButtonText}>Explore Other Services</AppText>
                  <DirectionalIcon
                    name="arrow-forward"
                    size={15}
                    color={Colors.neutral.white}
                  />
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        ) : mainCategory ? (
          <CategoryHubView
            mainCategory={mainCategory}
            trendingItems={trending || []}
            trendingLoading={trendingLoading}
            refreshControl={
              <RefreshControl
                refreshing={loading}
                onRefresh={refresh}
                tintColor={Colors.themes.customer.primary}
              />
            }
          />
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
    backgroundColor: GRADIENT_BOTTOM_COLOR, // Matches bottom stop of header gradient perfectly
  },
  sheetContainerWrapper: {
    flex: 1,
    backgroundColor: Colors.background.primary, // #FFFFFF
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    marginTop: -22, // Overlaps onto the gradient header so curves are clearly visible
    overflow: "hidden",
  },
  sheetScrollView: {
    flex: 1,
    backgroundColor: Colors.background.primary,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: "hidden",
  },
  sheetScrollContent: {
    paddingHorizontal: Spacing.md,
    paddingTop: 16,
    paddingBottom: 40,
  },
  trendingWrapper: {
    marginTop: Spacing.sm,
    paddingBottom: Spacing.xl,
  },
  comingSoonContainer: {
    paddingVertical: 40,
    alignItems: "center",
  },
  comingSoonCard: {
    alignItems: "center",
    padding: Spacing.xl,
    borderRadius: BorderRadius.lg,
    backgroundColor: "#F9FAFB",
    width: "100%",
    maxWidth: 340,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#F0F4F8",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.md,
  },
  comingSoonTitle: {
    fontSize: Typography.sizes.lg,
    fontWeight: "800",
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },
  comingSoonSubtitle: {
    fontSize: Typography.sizes.xs,
    color: Colors.text.secondary,
    textAlign: "center",
    lineHeight: 18,
    marginBottom: Spacing.lg,
  },
  notifyButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: Colors.themes.customer.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: BorderRadius.full,
  },
  notifyButtonText: {
    color: Colors.neutral.white,
    fontWeight: "700",
    fontSize: Typography.sizes.xs,
  },
});
