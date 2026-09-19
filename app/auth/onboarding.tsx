import Colors from "@/constants/Colors";
import { BorderRadius, Spacing } from "@/constants/Styles";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Easing,
  FlatList,
  Image,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useColorScheme,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const { width, height } = Dimensions.get("window");
const ONBOARDING_KEY = "@tasker_onboarding_complete";

interface FloatingChip {
  id: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  text: string;
  positionStyle: object;
  floatDelay?: number;
}

interface OnboardingSlide {
  id: string;
  image: any;
  badge: string;
  title: string;
  description: string;
  chips: FloatingChip[];
}

const slides: OnboardingSlide[] = [
  {
    id: "1",
    image: require("@/assets/images/onboarding-slide-1.png"),
    badge: "Trusted Platform",
    title: "Connecting Customers with Expert Technicians",
    description:
      "Your one-stop destination for verified HVAC specialists, home appliance maintenance, and reliable repairs.",
    chips: [
      {
        id: "c1",
        icon: "shield-checkmark",
        iconColor: "#059669",
        text: "Verified Match",
        positionStyle: { top: -6, left: -4 },
        floatDelay: 0,
      },
      {
        id: "c2",
        icon: "star",
        iconColor: "#D97706",
        text: "4.9★ Rated Pros",
        positionStyle: { top: 26, right: -10 },
        floatDelay: 400,
      },
      {
        id: "c3",
        icon: "construct",
        iconColor: "#0284C7",
        text: "Certified HVACR",
        positionStyle: { bottom: -8, right: -4 },
        floatDelay: 800,
      },
    ],
  },
  {
    id: "2",
    image: require("@/assets/images/onboarding-slide-2.png"),
    badge: "Instant Booking",
    title: "Book Verified Technicians in Minutes",
    description:
      "Select your required service, choose a convenient date and time, and enjoy transparent pricing with no hidden costs.",
    chips: [
      {
        id: "c4",
        icon: "flash",
        iconColor: "#D97706",
        text: "Instant Confirm",
        positionStyle: { top: -6, left: -4 },
        floatDelay: 0,
      },
      {
        id: "c5",
        icon: "calendar",
        iconColor: "#2563EB",
        text: "Flexible Slots",
        positionStyle: { top: 26, right: -10 },
        floatDelay: 400,
      },
      {
        id: "c6",
        icon: "pricetag",
        iconColor: "#059669",
        text: "Upfront Rates",
        positionStyle: { bottom: -8, left: -4 },
        floatDelay: 800,
      },
    ],
  },
  {
    id: "3",
    image: require("@/assets/images/onboarding-slide-3.jpg"),
    badge: "Quality Guaranteed",
    title: "Live Updates & Trusted Warranty",
    description:
      "Stay informed with real-time technician arrival updates, verified professional ratings, and service warranty support.",
    chips: [
      {
        id: "c7",
        icon: "location",
        iconColor: "#DC2626",
        text: "Live Tracking",
        positionStyle: { top: -6, left: -4 },
        floatDelay: 0,
      },
      {
        id: "c8",
        icon: "shield-checkmark",
        iconColor: "#059669",
        text: "Service Warranty",
        positionStyle: { top: 26, right: -10 },
        floatDelay: 400,
      },
      {
        id: "c9",
        icon: "headset",
        iconColor: "#7C3AED",
        text: "24/7 Support",
        positionStyle: { bottom: -8, right: -4 },
        floatDelay: 800,
      },
    ],
  },
];

function AnimatedFloatingBadge({
  chip,
}: {
  chip: FloatingChip;
}) {
  const floatAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: -8,
          duration: 1800,
          delay: chip.floatDelay || 0,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 1800,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [chip.floatDelay, floatAnim]);

  return (
    <Animated.View
      style={[
        styles.floatingChip,
        chip.positionStyle,
        {
          transform: [{ translateY: floatAnim }],
        },
      ]}
    >
      <Ionicons name={chip.icon} size={13} color={chip.iconColor} />
      <Text style={styles.floatingChipText}>{chip.text}</Text>
    </Animated.View>
  );
}

export default function Onboarding() {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollX = useRef(new Animated.Value(0)).current;
  const slidesRef = useRef<FlatList>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, []);

  const viewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems[0]) {
      setCurrentIndex(viewableItems[0].index);
    }
  }).current;

  const viewConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

  const navigateToRoleSelection = async () => {
    try {
      await AsyncStorage.setItem(ONBOARDING_KEY, "true");
    } catch {
      // Ignore storage errors and continue navigation
    }
    router.replace("/auth/role-selection");
  };

  const handleNext = () => {
    if (currentIndex < slides.length - 1) {
      slidesRef.current?.scrollToIndex({
        index: currentIndex + 1,
        animated: true,
      });
    } else {
      void navigateToRoleSelection();
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

    const opacity = scrollX.interpolate({
      inputRange,
      outputRange: [0.35, 1, 0.35],
      extrapolate: "clamp",
    });

    const scale = scrollX.interpolate({
      inputRange,
      outputRange: [0.9, 1, 0.9],
      extrapolate: "clamp",
    });

    return (
      <View style={styles.slide}>
        {/* 3D Visual Stage with Floating Chips in Air */}
        <Animated.View
          style={[
            styles.imageWrapper,
            {
              opacity,
              transform: [{ scale }],
            },
          ]}
        >
          <Image
            source={item.image}
            style={styles.heroImage}
            resizeMode="contain"
          />

          {/* Animated Floating Chips in Air */}
          {item.chips.map((chip) => (
            <AnimatedFloatingBadge key={chip.id} chip={chip} />
          ))}
        </Animated.View>

        {/* Text Area */}
        <View style={styles.textContainer}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{item.badge}</Text>
          </View>

          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.description}>{item.description}</Text>
        </View>
      </View>
    );
  };

  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <StatusBar
        barStyle={isDark ? "light-content" : "dark-content"}
        backgroundColor={
          isDark ? "rgba(0, 0, 0, 0.40)" : "rgba(255, 255, 255, 0.40)"
        }
        translucent
      />

      <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
        {/* Minimal Header */}
        <View style={styles.header}>
          <Image
            source={require("@/assets/images/tasker-logo.png")}
            style={styles.logo}
            resizeMode="contain"
          />

          <TouchableOpacity
            style={styles.skipButton}
            onPress={() => void navigateToRoleSelection()}
            activeOpacity={0.6}
          >
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>
        </View>

        {/* FlatList Slides */}
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

        {/* Minimal Bottom Footer */}
        <View style={styles.footer}>
          {/* Clean Pagination Dots */}
          <View style={styles.paginationRow}>
            {slides.map((_, index) => {
              const inputRange = [
                (index - 1) * width,
                index * width,
                (index + 1) * width,
              ];

              const dotWidth = scrollX.interpolate({
                inputRange,
                outputRange: [7, 24, 7],
                extrapolate: "clamp",
              });

              const dotColor = scrollX.interpolate({
                inputRange,
                outputRange: ["#E5E7EB", Colors.themes.customer.primary, "#E5E7EB"],
                extrapolate: "clamp",
              });

              return (
                <Animated.View
                  key={index.toString()}
                  style={[
                    styles.dot,
                    {
                      width: dotWidth,
                      backgroundColor: dotColor,
                    },
                  ]}
                />
              );
            })}
          </View>

          {/* Clean Primary Button */}
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleNext}
            activeOpacity={0.85}
          >
            <Text style={styles.primaryButtonText}>
              {currentIndex === slides.length - 1 ? "Get Started" : "Continue"}
            </Text>
            <Ionicons
              name="arrow-forward"
              size={18}
              color="#18181B"
            />
          </TouchableOpacity>

          {/* Minimal Trust Subtext */}
          <Text style={styles.trustText}>
            Verified Technicians • Quality Guaranteed
          </Text>
        </View>
      </SafeAreaView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingTop: Platform.OS === "android" ? 12 : 4,
    paddingBottom: 4,
  },
  logo: {
    width: 140,
    height: 40,
  },
  skipButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  skipText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#6B7280",
  },
  slidesContainer: {
    flex: 1,
  },
  slide: {
    width,
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing.xl,
  },
  imageWrapper: {
    width: width * 1,
    height: height * 1,
    maxHeight: 310,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    overflow: "visible",
    marginBottom: Spacing.sm,
  },
  heroImage: {
    width: "90%",
    height: "85%",
  },
  floatingChip: {
    position: "absolute",
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(255, 255, 255, 0.96)",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    zIndex: 10,
  },
  floatingChipText: {
    fontSize: 11.5,
    fontWeight: "600",
    color: "#1F2937",
    letterSpacing: 0.1,
  },
  textContainer: {
    alignItems: "center",
  },
  badge: {
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    marginBottom: 8,
  },
  badgeText: {
    fontSize: 11.5,
    fontWeight: "600",
    color: "#4B5563",
    letterSpacing: 0.2,
  },
  title: {
    fontSize: 21,
    fontWeight: "600",
    color: "#18181B",
    textAlign: "center",
    marginBottom: 8,
    lineHeight: 28,
  },
  description: {
    fontSize: 13.5,
    fontWeight: "400",
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 20,
  },
  footer: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Platform.OS === "android" ? 22 : 12,
  },
  paginationRow: {
    flexDirection: "row",
    height: 7,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.lg,
    gap: 5,
  },
  dot: {
    height: 6,
    borderRadius: 3,
  },
  primaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.themes.customer.primary,
    height: 52,
    borderRadius: 14,
    gap: 8,
    marginBottom: 12,
  },
  primaryButtonText: {
    fontSize: 15.5,
    fontWeight: "600",
    color: "#18181B",
  },
  trustText: {
    fontSize: 12,
    fontWeight: "400",
    color: "#9CA3AF",
    textAlign: "center",
  },
});
