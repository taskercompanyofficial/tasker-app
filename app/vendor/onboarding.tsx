import Colors from "@/constants/Colors";
import { BorderRadius, Shadows, Spacing, Typography } from "@/constants/Styles";
import { useSession } from "@/context/ctx";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useRef, useState } from "react";
import {
  Dimensions,
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const { width, height } = Dimensions.get("window");
const STORAGE_ONBOARDING_KEY = "@vendor_onboarding_completed";

interface OnboardingSlide {
  id: string;
  icon: keyof typeof Ionicons.glyphMap;
  badgeTitle: string;
  title: string;
  subtitle: string;
  highlightText: string;
}

const SLIDES: OnboardingSlide[] = [
  {
    id: "1",
    icon: "storefront-outline",
    badgeTitle: "MORE ORDERS, MORE GROWTH",
    title: "Grow Your Service Business",
    subtitle:
      "Receive real-time work orders for HVAC, AC installation, electrical, and appliance repairs directly from local customers in your area.",
    highlightText: "Instant Notifications • Zero Hidden Fees",
  },
  {
    id: "2",
    icon: "calendar-outline",
    badgeTitle: "FLEXIBLE WORKSPACE",
    title: "Work on Your Own Terms",
    subtitle:
      "Set your operational coverage, manage your team staff, and accept jobs that align with your schedule and rate cards.",
    highlightText: "Custom Rates • Team Management",
  },
  {
    id: "3",
    icon: "wallet-outline",
    badgeTitle: "TRANSPARENT EARNINGS",
    title: "Fast & Direct Payouts",
    subtitle:
      "Track daily earnings, monitor completed work statements, and request instant payouts directly to your registered bank account.",
    highlightText: "Real-Time Balance • Automated Payouts",
  },
  {
    id: "4",
    icon: "shield-checkmark-outline",
    badgeTitle: "TRUSTED SERVICE PROVIDER",
    title: "Fast 2-Step Verification",
    subtitle:
      "Upload your CNIC, business documents, and handled service categories to become a Tasker Certified Service Provider.",
    highlightText: "Verified Provider Badge • Priority Orders",
  },
];

export default function VendorOnboarding() {
  const { session } = useSession();
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const primaryColor = Colors.themes.provider.primary;

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / width);
    setCurrentIndex(index);
  };

  const handleNext = async () => {
    if (currentIndex < SLIDES.length - 1) {
      flatListRef.current?.scrollToIndex({
        index: currentIndex + 1,
        animated: true,
      });
    } else {
      await finishOnboarding();
    }
  };

  const finishOnboarding = async () => {
    try {
      await AsyncStorage.setItem(STORAGE_ONBOARDING_KEY, "true");
    } catch {}

    const isProfileComplete = !!(
      session.vendorUser?.cnic && session.vendorUser?.handled_categories?.length
    );

    if (!isProfileComplete) {
      router.replace("/vendor/complete-profile");
    } else {
      router.replace("/vendor/(tabs)/dashboard");
    }
  };

  const renderSlide = ({ item }: { item: OnboardingSlide }) => {
    return (
      <View style={styles.slideContainer}>
        {/* Top Decorative Icon Card */}
        <View style={styles.illustrationCard}>
          <LinearGradient
            colors={[primaryColor + "20", primaryColor + "05"]}
            style={styles.illustrationGradient}
          >
            <View style={[styles.iconCircle, { backgroundColor: primaryColor + "18" }]}>
              <Ionicons name={item.icon} size={64} color={primaryColor} />
            </View>
            <View style={[styles.highlightPill, { backgroundColor: primaryColor }]}>
              <Text style={styles.highlightPillText}>{item.highlightText}</Text>
            </View>
          </LinearGradient>
        </View>

        {/* Content Section */}
        <View style={styles.textSection}>
          <Text style={[styles.badgeTitle, { color: primaryColor }]}>
            {item.badgeTitle}
          </Text>
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.subtitle}>{item.subtitle}</Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      {/* Top Header Row */}
      <View style={styles.headerRow}>
        <View style={styles.brandRow}>
          <View style={[styles.brandDot, { backgroundColor: primaryColor }]} />
          <Text style={styles.brandText}>Service Provider Hub</Text>
        </View>

        {currentIndex < SLIDES.length - 1 ? (
          <TouchableOpacity
            style={styles.skipButton}
            onPress={finishOnboarding}
            activeOpacity={0.7}
          >
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Main Slides Carousel */}
      <FlatList
        ref={flatListRef}
        data={SLIDES}
        renderItem={renderSlide}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        style={styles.flatList}
      />

      {/* Bottom Controls Area */}
      <View style={styles.bottomControls}>
        {/* Pagination Dots */}
        <View style={styles.paginationRow}>
          {SLIDES.map((_, idx) => {
            const isActive = idx === currentIndex;
            return (
              <View
                key={idx}
                style={[
                  styles.dot,
                  isActive
                    ? [styles.activeDot, { backgroundColor: primaryColor }]
                    : styles.inactiveDot,
                ]}
              />
            );
          })}
        </View>

        {/* CTA Action Button */}
        <TouchableOpacity
          style={[styles.ctaButton, { backgroundColor: primaryColor }]}
          onPress={handleNext}
          activeOpacity={0.85}
        >
          <Text style={styles.ctaButtonText}>
            {currentIndex === SLIDES.length - 1
              ? "Get Started & Complete Profile"
              : "Next"}
          </Text>
          <Ionicons
            name={
              currentIndex === SLIDES.length - 1
                ? "checkmark-arrow-up"
                : "arrow-forward"
            }
            size={18}
            color={Colors.neutral.white}
          />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.neutral.white,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  brandDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  brandText: {
    fontSize: Typography.sizes.xs,
    fontWeight: "800",
    color: Colors.text.primary,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  skipButton: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
  },
  skipText: {
    fontSize: Typography.sizes.sm,
    fontWeight: "600",
    color: Colors.text.tertiary,
  },
  flatList: {
    flex: 1,
  },
  slideContainer: {
    width,
    alignItems: "center",
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
  },
  illustrationCard: {
    width: width - Spacing.xl * 2,
    height: height * 0.38,
    borderRadius: BorderRadius.xl,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: Colors.border.light,
    marginBottom: Spacing.lg,
    ...Shadows.sm,
  },
  illustrationGradient: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.lg,
  },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  highlightPill: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: 20,
  },
  highlightPillText: {
    color: Colors.neutral.white,
    fontSize: Typography.sizes.xs,
    fontWeight: "800",
    letterSpacing: 0.3,
  },
  textSection: {
    alignItems: "center",
    paddingHorizontal: Spacing.md,
  },
  badgeTitle: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1,
    marginBottom: Spacing.xs,
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    color: Colors.text.primary,
    textAlign: "center",
    marginBottom: Spacing.sm,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.text.secondary,
    textAlign: "center",
    lineHeight: 22,
  },
  bottomControls: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.lg,
    paddingTop: Spacing.sm,
    gap: Spacing.md,
  },
  paginationRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  activeDot: {
    width: 24,
  },
  inactiveDot: {
    width: 8,
    backgroundColor: Colors.neutral.gray[200],
  },
  ctaButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: BorderRadius.md,
    gap: 8,
    ...Shadows.sm,
  },
  ctaButtonText: {
    fontSize: Typography.sizes.base,
    fontWeight: "700",
    color: Colors.neutral.white,
  },
});
