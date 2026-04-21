import Colors from "@/constants/Colors";
import { BorderRadius, Spacing } from "@/constants/Styles";
import { PROMOTIONS_URL } from "@/lib/api-endpoints";
import myAxios from "@/lib/axios.config";
import getImageUrl from "@/lib/utils";
import { Image } from "expo-image";
import { router } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Pressable,
  StyleSheet,
  View,
} from "react-native";

const { width } = Dimensions.get("window");
const CAROUSEL_WIDTH = width - Spacing.md * 2;
const CAROUSEL_HEIGHT = 160;

interface CarouselSlide {
  id: string | number;
  title: string;
  subtitle: string;
  image_url: string;
  accent_color: string;
  link?: string;
}

export default function PromotionalCarousel() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [slides, setSlides] = useState<CarouselSlide[]>([]);
  const [loading, setLoading] = useState(true);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    fetchPromotions();
  }, []);

  const fetchPromotions = async () => {
    try {
      const response = await myAxios.get(PROMOTIONS_URL);
      if (response.data.status === "success") {
        setSlides(response.data.data);
      }
    } catch (error) {
      console.error("Failed to fetch promotions:", error);
    } finally {
      setLoading(false);
    }
  };

  // Auto-scroll carousel
  useEffect(() => {
    if (slides.length === 0) return;

    const interval = setInterval(() => {
      setActiveIndex((current) => {
        const nextIndex = (current + 1) % slides.length;
        flatListRef.current?.scrollToIndex({
          index: nextIndex,
          animated: true,
        });
        return nextIndex;
      });
    }, 5000);

    return () => clearInterval(interval);
  }, [slides.length]);

  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      setActiveIndex(viewableItems[0].index || 0);
    }
  }).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
  }).current;

  const renderSlide = ({ item }: { item: CarouselSlide }) => (
    <Pressable
      style={styles.slide}
      onPress={() =>
        item.link
          ? router.push(item.link as any)
          : router.push("/customer/(tabs)/services")
      }
    >
      <View style={styles.card}>
        <View
          style={[
            styles.leftBand,
            { backgroundColor: (item.accent_color || "#000") + "20" },
          ]}
        />
        {item.image_url && (
          <Image
            source={{ uri: getImageUrl(item.image_url) }}
            style={styles.bgImage}
            contentFit="fill"
            transition={200}
            cachePolicy="disk"
          />
        )}
      </View>
    </Pressable>
  );

  if (loading) {
    return (
      <View
        style={[
          styles.container,
          {
            height: CAROUSEL_HEIGHT,
            justifyContent: "center",
            alignItems: "center",
          },
        ]}
      >
        <ActivityIndicator color={Colors.themes.customer.primary} />
      </View>
    );
  }

  if (slides.length === 0) return null;

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={slides}
        renderItem={renderSlide}
        keyExtractor={(item) => item.id.toString()}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        snapToInterval={CAROUSEL_WIDTH}
        decelerationRate="fast"
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        getItemLayout={(_, index) => ({
          length: CAROUSEL_WIDTH,
          offset: CAROUSEL_WIDTH * index,
          index,
        })}
      />
      {/* Pagination Dots */}
      <View style={styles.pagination}>
        {slides.map((_, index) => (
          <View
            key={index}
            style={[styles.dot, activeIndex === index && styles.dotActive]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.md,
  },
  slide: {
    width: CAROUSEL_WIDTH,
    height: CAROUSEL_HEIGHT,
    overflow: "hidden",
    margin: Spacing.sm,
    borderRadius: BorderRadius.lg,
  },
  card: {
    flex: 1,
    backgroundColor: Colors.neutral.gray[200],
    borderWidth: 1,
    borderColor: Colors.border.light,
    position: "relative",
  },
  bgImage: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  bgOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: Colors.neutral.black,
    opacity: 0.35,
  },
  leftBand: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 6,
  },
  content: {
    flex: 1,
    padding: Spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.sm,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.neutral.gray[100],
  },
  textContent: {
    flex: 1,
    justifyContent: "center",
  },
  title: {
    fontSize: 16,
    fontWeight: "800",
    color: Colors.neutral.white,
    marginBottom: 2,
    letterSpacing: 0.2,
  },
  subtitle: {
    fontSize: 11,
    color: Colors.neutral.white,
    lineHeight: 15,
  },
  ctaButton: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.sm,
    backgroundColor: "rgba(255,255,255,0.15)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.4)",
    gap: 4,
  },
  ctaText: {
    fontSize: 11,
    fontWeight: "700",
    color: Colors.neutral.white,
  },
  pagination: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: Spacing.sm,
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.neutral.gray[300],
  },
  dotActive: {
    width: 24,
    backgroundColor: Colors.themes.customer.primary,
  },
});
