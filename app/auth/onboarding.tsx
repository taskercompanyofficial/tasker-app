import React, { useRef, useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Dimensions,
  TouchableOpacity,
  Animated,
  Image,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Spacing } from "@/constants/Styles";
import Colors from "@/constants/Colors";
import Button from "@/components/Button";

const { width } = Dimensions.get("window");
const ONBOARDING_KEY = "@tasker_onboarding_complete";

interface OnboardingSlide {
  id: string;
  image: any;
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
}

const slides: OnboardingSlide[] = [
  {
    id: "1",
    image: require("@/assets/images/onboarding_services.png"),
    title: "Expert HVAC Services",
    description:
      "Get professional AC, washing machine, and geyser services from verified technicians. Quality you can trust.",
    icon: "snow",
    color: Colors.themes.customer.primary,
  },
  {
    id: "2",
    image: require("@/assets/images/onboarding_booking.png"),
    title: "Book in Seconds",
    description:
      "Schedule your service instantly. Same-day appointments available. Track your technician in real-time.",
    icon: "calendar",
    color: Colors.themes.provider.primary,
  },
  {
    id: "3",
    image: require("@/assets/images/onboarding_tracking.png"),
    title: "Track & Rate Service",
    description:
      "Monitor progress live and share your experience. Your feedback helps us maintain excellence.",
    icon: "star",
    color: Colors.success,
  },
];

export default function Onboarding() {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollX = useRef(new Animated.Value(0)).current;
  const slidesRef = useRef<FlatList>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, []);

  const viewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems[0]) {
      setCurrentIndex(viewableItems[0].index);
    }
  }).current;

  const viewConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

  const scrollTo = () => {
    if (currentIndex < slides.length - 1) {
      slidesRef.current?.scrollToIndex({ index: currentIndex + 1 });
    } else {
      handleGetStarted();
    }
  };

  const handleSkip = async () => {
    try {
      await AsyncStorage.setItem(ONBOARDING_KEY, "true");
      router.replace("/auth/role-selection");
    } catch (error) {
      console.error("Error saving onboarding status:", error);
      router.replace("/auth/role-selection");
    }
  };

  const handleGetStarted = async () => {
    try {
      await AsyncStorage.setItem(ONBOARDING_KEY, "true");
      router.replace("/auth/role-selection");
    } catch (error) {
      console.error("Error saving onboarding status:", error);
      router.replace("/auth/role-selection");
    }
  };

  const renderSlide = ({
    item,
    index,
  }: {
    item: OnboardingSlide;
    index: number;
  }) => {
    const inputRange = [
      (index - 1) * width,
      index * width,
      (index + 1) * width,
    ];

    const scale = scrollX.interpolate({
      inputRange,
      outputRange: [0.85, 1, 0.85],
      extrapolate: "clamp",
    });

    const opacity = scrollX.interpolate({
      inputRange,
      outputRange: [0.3, 1, 0.3],
      extrapolate: "clamp",
    });

    const translateY = scrollX.interpolate({
      inputRange,
      outputRange: [50, 0, 50],
      extrapolate: "clamp",
    });

    return (
      <View style={styles.slide}>
        <Animated.View
          style={[
            styles.imageContainer,
            {
              transform: [{ scale }, { translateY }],
              opacity,
            },
          ]}
        >
          <View style={[styles.imageBg, { backgroundColor: "#fff" }]} />
          <Image
            source={item.image}
            style={styles.image}
            resizeMode="contain"
          />
          <Animated.View
            style={[styles.iconBadge, { backgroundColor: item.color }]}
          >
            <Ionicons name={item.icon} size={28} color={Colors.neutral.white} />
          </Animated.View>
        </Animated.View>

        <Animated.View style={[styles.textContainer, { opacity }]}>
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.description}>{item.description}</Text>
        </Animated.View>
      </View>
    );
  };

  const Paginator = () => {
    return (
      <View style={styles.paginatorContainer}>
        {slides.map((_, index) => {
          const inputRange = [
            (index - 1) * width,
            index * width,
            (index + 1) * width,
          ];

          const dotWidth = scrollX.interpolate({
            inputRange,
            outputRange: [8, 28, 8],
            extrapolate: "clamp",
          });

          const opacity = scrollX.interpolate({
            inputRange,
            outputRange: [0.3, 1, 0.3],
            extrapolate: "clamp",
          });

          return (
            <Animated.View
              key={index.toString()}
              style={[
                styles.dot,
                {
                  width: dotWidth,
                  opacity,
                  backgroundColor: Colors.themes.customer.primary,
                },
              ]}
            />
          );
        })}
      </View>
    );
  };

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      {/* Skip Button */}
      <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
        <Text style={styles.skipText}>Skip</Text>
        <Ionicons
          name="arrow-forward"
          size={16}
          color={Colors.text.secondary}
        />
      </TouchableOpacity>

      {/* Slides */}
      <View style={styles.slidesContainer}>
        <FlatList
          ref={slidesRef}
          data={slides}
          renderItem={renderSlide}
          horizontal
          showsHorizontalScrollIndicator={false}
          pagingEnabled
          bounces={false}
          keyExtractor={(item) => item.id}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { x: scrollX } } }],
            { useNativeDriver: false },
          )}
          onViewableItemsChanged={viewableItemsChanged}
          viewabilityConfig={viewConfig}
          scrollEventThrottle={16}
        />
      </View>

      {/* Bottom Section */}
      <View style={styles.bottomContainer}>
        <Paginator />

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <Button
            title={currentIndex === slides.length - 1 ? "Get Started" : "Next"}
            onPress={scrollTo}
            fullWidth
            size="large"
            icon={
              currentIndex === slides.length - 1 ? (
                <Ionicons
                  name="rocket"
                  size={20}
                  color={Colors.neutral.white}
                />
              ) : (
                <Ionicons
                  name="arrow-forward"
                  size={20}
                  color={Colors.neutral.white}
                />
              )
            }
          />
        </View>

        {/* Trust Badge */}
        <View style={styles.trustBadge}>
          <Ionicons name="shield-checkmark" size={16} color={Colors.success} />
          <Text style={styles.trustText}>Trusted by 10,000+ customers</Text>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.neutral.white,
  },
  skipButton: {
    position: "absolute",
    top: 50,
    right: 20,
    zIndex: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.neutral.gray[100],
  },
  skipText: {
    fontSize: 14,
    fontWeight: "500",
    color: Colors.text.secondary,
  },
  slidesContainer: {
    flex: 1,
  },
  slide: {
    width,
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: Spacing.xl,
  },
  imageContainer: {
    width: width * 0.75,
    height: width * 0.75,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.xl,
    position: "relative",
  },
  imageBg: {
    position: "absolute",
    width: "100%",
    height: "100%",
    borderRadius: (width * 0.75) / 2,
  },
  image: {
    width: "85%",
    height: "85%",
  },
  iconBadge: {
    position: "absolute",
    bottom: 10,
    right: 10,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  textContainer: {
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: Colors.text.primary,
    marginBottom: Spacing.sm,
    textAlign: "center",
    letterSpacing: -0.5,
  },
  description: {
    fontSize: 15,
    color: Colors.text.secondary,
    textAlign: "center",
    lineHeight: 22,
    paddingHorizontal: Spacing.sm,
  },
  bottomContainer: {
    paddingBottom: 40,
    paddingHorizontal: Spacing.xl,
  },
  paginatorContainer: {
    flexDirection: "row",
    height: 8,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.xl,
    gap: 6,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  buttonContainer: {
    marginBottom: Spacing.md,
  },
  trustBadge: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingTop: Spacing.sm,
  },
  trustText: {
    fontSize: 12,
    color: Colors.text.tertiary,
    fontWeight: "500",
  },
});
