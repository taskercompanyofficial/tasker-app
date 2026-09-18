import Colors from "@/constants/Colors";
import { Spacing } from "@/constants/Styles";
import { PROMOTIONS_URL } from "@/lib/api-endpoints";
import myAxios from "@/lib/axios.config";
import getImageUrl from "@/lib/utils";
import { Image } from "expo-image";
import { router } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Pressable,
  StyleSheet,
  View,
} from "react-native";
import { Carousel } from "react-native-reanimated-carousel";

const { width } = Dimensions.get("window");
const CAROUSEL_HEIGHT = 200; // Adjusted height for better proportions

interface CarouselSlide {
  id: string | number;
  title?: string;
  subtitle?: string;
  image_url?: string;
  accent_color?: string;
  link?: string | null;
}

interface PromotionsResponse {
  status: string;
  data: CarouselSlide[];
}

export default function PromotionalCarousel() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [slides, setSlides] = useState<CarouselSlide[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPromotions = useCallback(async () => {
    try {
      const response = await myAxios.get<PromotionsResponse>(
        PROMOTIONS_URL
      );

      if (response.data.status === "success") {
        setSlides(Array.isArray(response.data.data) ? response.data.data : []);
      }
    } catch (error) {
      console.error("Failed to fetch promotions:", error);
      setSlides([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPromotions();
  }, [fetchPromotions]);

  const handleSlidePress = (link?: string | null) => {
    if (link) {
      router.push(link as never);
      return;
    }

    router.push("/customer/(tabs)/services");
  };

  const renderSlide = ({ item }: { item: CarouselSlide }) => {
    const imageUrl = item.image_url
      ? getImageUrl(item.image_url)
      : undefined;

    return (
      <View style={styles.slideContainer}>
        <Pressable
          style={({ pressed }) => [
            styles.slide,
            pressed && styles.slidePressed,
          ]}
          onPress={() => handleSlidePress(item.link)}
          accessibilityRole="button"
          accessibilityLabel={item.title || "Promotion"}
        >
          {imageUrl ? (
            <Image
              source={{ uri: imageUrl }}
              style={styles.bgImage}
              contentFit="cover"
              transition={200}
              cachePolicy="disk"
            />
          ) : (
            <View style={styles.imageFallback} />
          )}
        </Pressable>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color={Colors.themes.customer.primary} />
      </View>
    );
  }

  if (slides.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Carousel
        loop={slides.length > 1}
        data={slides}
        onSnapToItem={setActiveIndex}
        renderItem={renderSlide}
        style={styles.carousel}
        autoplay={true}
        autoplayInterval={3000}
      />

      <View style={styles.pagination}>
        {slides.map((_, index) => (
          <View
            key={index}
            style={[
              styles.dot,
              activeIndex === index && styles.dotActive,
            ]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    marginBottom: Spacing.md,
  },
  carousel: {
    width: "100%",
    height: CAROUSEL_HEIGHT,
  },
  loadingContainer: {
    width: "100%",
    height: CAROUSEL_HEIGHT,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  slideContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  slide: {
    flex: 1,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: Colors.neutral.gray[200],
  },
  slidePressed: {
    opacity: 0.92,
  },
  bgImage: {
    ...StyleSheet.absoluteFill,
    borderRadius: 16,
  },
  imageFallback: {
    ...StyleSheet.absoluteFill,
    backgroundColor: Colors.neutral.gray[200],
    borderRadius: 16,
  },
  pagination: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
    marginTop: 8,
  },
  dot: {
    width: 14,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#D1D5DB",
  },
  dotActive: {
    width: 24,
    backgroundColor: "#6B7280",
  },
});