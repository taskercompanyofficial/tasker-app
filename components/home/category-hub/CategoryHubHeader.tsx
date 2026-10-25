import AppText from "@/components/common/AppText";
import DirectionalIcon from "@/components/common/DirectionalIcon";
import Colors from "@/constants/Colors";
import { BorderRadius, Spacing, Typography } from "@/constants/Styles";
import getImageUrl from "@/lib/utils";
import { MainCategory } from "@/types/main-category";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export const GRADIENT_COLORS = ["#08192E", "#0E2849", "#153A68", "#1B477F"] as const;
export const GRADIENT_BOTTOM_COLOR = "#1B477F";

interface CategoryHubHeaderProps {
  mainCategory: MainCategory | null;
  onBack?: () => void;
}

export default function CategoryHubHeader({
  mainCategory,
  onBack,
}: CategoryHubHeaderProps) {
  const heroImage = mainCategory?.image ? getImageUrl(mainCategory.image) : null;

  return (
    <LinearGradient
      colors={GRADIENT_COLORS}
      start={{ x: 0, y: 0 }}
      end={{ x: 0.85, y: 1 }}
      style={styles.gradientHeader}
    >
      <SafeAreaView edges={["top"]} style={styles.safeArea}>
        {/* Top Bar: Back, Brand Name, Bell & Support Icons */}
        <View style={styles.topBar}>
          <View style={styles.topLeftGroup}>
            <TouchableOpacity
              style={styles.headerIconButton}
              onPress={onBack ? onBack : () => router.replace("/customer")}
              activeOpacity={0.7}
            >
              <DirectionalIcon
                name="arrow-back"
                size={18}
                color={Colors.neutral.white}
              />
            </TouchableOpacity>
            <View>
              <AppText style={styles.brandTitle} numberOfLines={1}>
                {mainCategory?.name?.toUpperCase() || "TASKER"}
              </AppText>
              <AppText style={styles.brandSubtitle}>Doorstep Services</AppText>
            </View>
          </View>

          <View style={styles.topRightGroup}>
            {/* Notifications */}
            <TouchableOpacity
              style={styles.headerIconButton}
              onPress={() => router.push("/customer/notifications")}
              activeOpacity={0.7}
            >
              <Ionicons
                name="notifications-outline"
                size={20}
                color={Colors.neutral.white}
              />
              <View style={styles.notificationDot} />
            </TouchableOpacity>

            {/* Support / Help */}
            <TouchableOpacity
              style={styles.headerIconButton}
              onPress={() => router.push("/customer/support-chat")}
              activeOpacity={0.7}
            >
              <Ionicons
                name="help-circle-outline"
                size={22}
                color={Colors.neutral.white}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Hero Content inside the Blue Gradient */}
        <View style={styles.heroContent}>
          <View style={styles.heroTextCol}>
            <AppText style={styles.heroMainTitle} numberOfLines={1}>
              {mainCategory?.name}
            </AppText>
            <AppText style={styles.heroDescription} numberOfLines={2}>
              {mainCategory?.description ||
                "Complete maintenance and repair solutions by verified professionals."}
            </AppText>
            {/* Carousel indicator dots */}
            <View style={styles.heroDots}>
              <View style={[styles.heroDot, styles.heroDotActive]} />
              <View style={styles.heroDot} />
              <View style={styles.heroDot} />
            </View>
          </View>

          <View style={styles.heroImageCol}>
            {heroImage ? (
              <Image
                source={{ uri: heroImage }}
                style={styles.heroImg}
                contentFit="contain"
              />
            ) : (
              <Ionicons
                name="construct-outline"
                size={44}
                color="rgba(255, 255, 255, 0.45)"
              />
            )}
          </View>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradientHeader: {
    paddingBottom: 32,
  },
  safeArea: {
    paddingBottom: 2,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  topLeftGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  headerIconButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(255, 255, 255, 0.14)",
    alignItems: "center",
    justifyContent: "center",
  },
  brandTitle: {
    fontSize: Typography.sizes.base,
    fontWeight: "800",
    color: Colors.neutral.white,
    letterSpacing: 0.5,
  },
  brandSubtitle: {
    fontSize: Typography.sizes.xs,
    color: "rgba(255, 255, 255, 0.7)",
    fontWeight: "500",
  },
  topRightGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  notificationDot: {
    position: "absolute",
    top: 9,
    right: 9,
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: Colors.error,
    borderWidth: 1.5,
    borderColor: "#08192E",
  },
  heroContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.xs,
    paddingBottom: 4,
  },
  heroTextCol: {
    flex: 1,
    paddingRight: Spacing.sm,
  },
  heroMainTitle: {
    fontSize: Typography.sizes.xl,
    fontWeight: "800",
    color: Colors.neutral.white,
    marginBottom: 4,
    letterSpacing: -0.2,
  },
  heroDescription: {
    fontSize: Typography.sizes.xs,
    color: "rgba(255, 255, 255, 0.78)",
    lineHeight: 17,
  },
  heroDots: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 10,
  },
  heroDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: "rgba(255, 255, 255, 0.35)",
  },
  heroDotActive: {
    width: 14,
    backgroundColor: Colors.themes.customer.primary,
  },
  heroImageCol: {
    width: 74,
    height: 64,
    alignItems: "center",
    justifyContent: "center",
  },
  heroImg: {
    width: "100%",
    height: "100%",
  },
});
