import React from "react";
import { View, StyleSheet, Animated, Dimensions } from "react-native";
import Colors from "@/constants/Colors";
import { BorderRadius, Spacing } from "@/constants/Styles";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";

const { width } = Dimensions.get("window");
const HORIZONTAL_PADDING = Spacing.md;
const CONTENT_WIDTH = width - HORIZONTAL_PADDING * 2;
const CAT_GAP = 10;
const CAT_CARD_WIDTH = Math.floor((CONTENT_WIDTH - CAT_GAP * 2) / 3);
const SERV_GAP = 10;
const SERV_CARD_WIDTH = Math.floor((CONTENT_WIDTH - SERV_GAP * 2) / 3);

interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: any;
}

export default function Skeleton({
  width = "100%",
  height = 20,
  borderRadius = 4,
  style,
}: SkeletonProps) {
  const pulseAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0,
          duration: 900,
          useNativeDriver: true,
        }),
      ])
    );

    pulse.start();
    return () => pulse.stop();
  }, [pulseAnim]);

  const opacity = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.75],
  });

  return (
    <Animated.View
      style={[
        styles.skeleton,
        {
          width,
          height,
          borderRadius,
          opacity,
        },
        style,
      ]}
    />
  );
}

// 1. Category Grid Skeleton (Matches 3x2 category cards)
export function CategoryGridSkeleton({ count = 6 }: { count?: number }) {
  const rowCount = Math.ceil(count / 3);
  return (
    <View style={styles.catGrid}>
      {Array.from({ length: rowCount }).map((_, rIdx) => (
        <View key={rIdx} style={styles.catRowSkeleton}>
          {Array.from({ length: 3 }).map((_, cIdx) => (
            <View key={cIdx} style={styles.catCardSkeleton}>
              {/* Circular Image Placeholder */}
              <Skeleton
                width={54}
                height={46}
                borderRadius={BorderRadius.md}
                style={styles.mb8}
              />
              {/* Label placeholder */}
              <Skeleton width="75%" height={12} borderRadius={3} />
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}

// 2. Services Grid Skeleton (Matches 3x2 service cards)
export function ServicesGridSkeleton({ count = 6 }: { count?: number }) {
  const rowCount = Math.ceil(count / 3);
  return (
    <View style={styles.servGrid}>
      {Array.from({ length: rowCount }).map((_, rIdx) => (
        <View key={rIdx} style={styles.servRowSkeleton}>
          {Array.from({ length: 3 }).map((_, cIdx) => (
            <View key={cIdx} style={styles.servCardSkeleton}>
              {/* Image Thumbnail Placeholder */}
              <Skeleton
                width="100%"
                height={68}
                borderRadius={BorderRadius.md}
                style={styles.mb6}
              />
              {/* Title Placeholder */}
              <Skeleton width="80%" height={11} borderRadius={3} />
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}

// 3. Complete Main Category Screen Skeleton (Replaces full-screen spinner!)
export function MainCategoryPageSkeleton() {
  return (
    <View style={styles.pageContainer}>
      {/* Pinned Navy Blue Header Skeleton */}
      <LinearGradient
        colors={["#08192E", "#0E2849", "#153A68", "#1B477F"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0.85, y: 1 }}
        style={styles.gradientHeader}
      >
        <SafeAreaView edges={["top"]}>
          {/* Top Bar Placeholders */}
          <View style={styles.topBar}>
            <View style={styles.topLeft}>
              <Skeleton width={32} height={32} borderRadius={16} style={styles.headerBtnPlaceholder} />
              <View style={styles.ml8}>
                <Skeleton width={110} height={14} borderRadius={3} style={styles.headerTextPlaceholder} />
                <Skeleton width={70} height={10} borderRadius={3} style={[styles.headerTextPlaceholder, styles.mt4]} />
              </View>
            </View>
            <View style={styles.topRight}>
              <Skeleton width={32} height={32} borderRadius={16} style={styles.headerBtnPlaceholder} />
              <Skeleton width={32} height={32} borderRadius={16} style={styles.headerBtnPlaceholder} />
            </View>
          </View>

          {/* Hero Banner Content Placeholders */}
          <View style={styles.heroContent}>
            <View style={styles.heroTextCol}>
              <Skeleton width={140} height={20} borderRadius={4} style={styles.headerTextPlaceholder} />
              <Skeleton width="90%" height={12} borderRadius={3} style={[styles.headerTextPlaceholder, styles.mt8]} />
              <Skeleton width="60%" height={12} borderRadius={3} style={[styles.headerTextPlaceholder, styles.mt4]} />
              {/* Dots placeholder */}
              <View style={styles.dotsRow}>
                <Skeleton width={14} height={5} borderRadius={2.5} style={styles.headerTextPlaceholder} />
                <Skeleton width={5} height={5} borderRadius={2.5} style={styles.headerTextPlaceholder} />
                <Skeleton width={5} height={5} borderRadius={2.5} style={styles.headerTextPlaceholder} />
              </View>
            </View>
            <Skeleton width={68} height={58} borderRadius={10} style={styles.headerBtnPlaceholder} />
          </View>
        </SafeAreaView>
      </LinearGradient>

      {/* Curved White Sheet Skeleton Body */}
      <View style={styles.sheetWhiteContainer}>
        {/* Search Bar Placeholder */}
        <Skeleton
          width="100%"
          height={42}
          borderRadius={BorderRadius.md}
          style={styles.searchSkeleton}
        />

        {/* Section Title Placeholder */}
        <View style={styles.sectionHeader}>
          <Skeleton width={90} height={16} borderRadius={4} />
          <Skeleton width={50} height={12} borderRadius={4} />
        </View>

        {/* 3x2 Category Grid Shimmer */}
        <CategoryGridSkeleton count={6} />

        {/* Page Indicator Placeholder */}
        <View style={styles.indicatorPlaceholder}>
          <Skeleton width={22} height={3} borderRadius={1.5} />
          <Skeleton width={22} height={3} borderRadius={1.5} />
        </View>

        {/* Services Section Title Placeholder */}
        <View style={[styles.sectionHeader, styles.mt12]}>
          <Skeleton width={75} height={16} borderRadius={4} />
          <Skeleton width={60} height={14} borderRadius={10} />
        </View>

        {/* 3-column Services Shimmer */}
        <ServicesGridSkeleton count={6} />
      </View>
    </View>
  );
}

// 4. Generic Card Skeleton
export function SkeletonCard() {
  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <Skeleton width={40} height={40} borderRadius={20} />
        <View style={styles.content}>
          <Skeleton width="70%" height={16} />
          <Skeleton width="40%" height={12} style={styles.mt8} />
        </View>
      </View>
      <Skeleton width="100%" height={60} style={styles.mt16} />
    </View>
  );
}

export function SkeletonList({ count = 3 }: { count?: number }) {
  return (
    <View>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </View>
  );
}

// 5. Bottom Sheet Services List Skeleton
export function SheetServicesListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <View style={{ paddingVertical: 4 }}>
      {Array.from({ length: count }).map((_, i) => (
        <View key={i} style={styles.sheetRowSkeleton}>
          <View style={styles.sheetRowLeft}>
            <Skeleton width={38} height={38} borderRadius={BorderRadius.md} />
            <Skeleton width={140} height={14} borderRadius={3} style={{ marginLeft: 12 }} />
          </View>
          <Skeleton width={16} height={16} borderRadius={8} />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: Colors.neutral.gray[200],
  },
  headerBtnPlaceholder: {
    backgroundColor: "rgba(255, 255, 255, 0.18)",
  },
  headerTextPlaceholder: {
    backgroundColor: "rgba(255, 255, 255, 0.22)",
  },
  pageContainer: {
    flex: 1,
    backgroundColor: "#1B477F",
  },
  gradientHeader: {
    paddingBottom: 22,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  topLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  topRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  heroContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.xs,
  },
  heroTextCol: {
    flex: 1,
    paddingRight: Spacing.sm,
  },
  dotsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 10,
  },
  sheetWhiteContainer: {
    flex: 1,
    backgroundColor: Colors.background.primary,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    marginTop: -22,
    overflow: "hidden",
    paddingHorizontal: Spacing.md,
    paddingTop: 16,
  },
  searchSkeleton: {
    marginBottom: Spacing.md,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  catGrid: {
    flexDirection: "column",
    gap: CAT_GAP,
  },
  catRowSkeleton: {
    flexDirection: "row",
    alignItems: "flex-start",
    width: "100%",
    gap: CAT_GAP,
  },
  catCardSkeleton: {
    flex: 1,
    minHeight: 100,
    alignItems: "center",
    justifyContent: "flex-start",
    paddingVertical: 8,
  },
  indicatorPlaceholder: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: 8,
    marginBottom: 6,
  },
  servGrid: {
    flexDirection: "column",
    gap: SERV_GAP,
  },
  servRowSkeleton: {
    flexDirection: "row",
    alignItems: "flex-start",
    width: "100%",
    gap: SERV_GAP,
    marginBottom: 6,
  },
  servCardSkeleton: {
    flex: 1,
    alignItems: "center",
  },
  sheetRowSkeleton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.neutral.gray[100],
  },
  sheetRowLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  card: {
    backgroundColor: Colors.neutral.white,
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    marginHorizontal: 16,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  content: {
    flex: 1,
    marginLeft: 12,
  },
  ml8: {
    marginLeft: 8,
  },
  mt4: {
    marginTop: 4,
  },
  mt8: {
    marginTop: 8,
  },
  mt12: {
    marginTop: 12,
  },
  mt16: {
    marginTop: 16,
  },
  mb6: {
    marginBottom: 6,
  },
  mb8: {
    marginBottom: 8,
  },
});
