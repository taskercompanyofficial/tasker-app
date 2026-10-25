import AppText from "@/components/common/AppText";
import DirectionalIcon from "@/components/common/DirectionalIcon";
import Colors from "@/constants/Colors";
import { BorderRadius, Shadows, Spacing } from "@/constants/Styles";
import { useSession } from "@/context/ctx";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  Image,
  StatusBar,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useLanguage } from "@/context/language-context";

type Role = "customer" | "provider" | null;

export default function RoleSelectionScreen() {
  const router = useRouter();
  const { setAppMode } = useSession();
  const { t, language } = useLanguage();
  const [selectedRole, setSelectedRole] = useState<Role>(null);

  const handleRoleSelect = async (role: Role) => {
    setSelectedRole(role);
    if (role === "customer") {
      await setAppMode("customer");
      router.push("/auth/customer/sign-in");
    } else {
      await setAppMode("vendor");
      router.push("/auth/vendor/sign-in");
    }
  };

  return (
    <LinearGradient
      colors={["#FFFFFF", "#FDFBF7", "#F3F6FC"]}
      start={{ x: 0.1, y: 0 }}
      end={{ x: 0.9, y: 1 }}
      style={styles.container}
    >
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

      {/* Ambient Shine / Decorative Glow Orbs */}
      <View style={styles.goldGlowOrb} />
      <View style={styles.navyGlowOrb} />
      <View style={styles.centerShineCircle} />

      <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
        {/* Top Hero Graphic with Soft Glow */}
        <View style={styles.imageContainer}>
          <View style={styles.imageShadowWrapper}>
            <Image
              source={require("@/assets/images/role-selection-hero.png")}
              style={styles.illustration}
              resizeMode="contain"
            />
          </View>
        </View>

        {/* Top Language Switcher Bar */}
        <View style={styles.topLangRow}>
          <TouchableOpacity
            style={styles.langPill}
            activeOpacity={0.75}
            onPress={() => router.push("/auth/language-selection" as any)}
          >
            <Ionicons name="globe-outline" size={16} color="#1E3A8A" />
            <AppText style={styles.langPillText}>
              {language === "ur" ? "اردو" : language === "ur-Latn" ? "Roman Urdu" : "English"}
            </AppText>
            <DirectionalIcon name="chevron-forward" size={14} color="#64748B" />
          </TouchableOpacity>
        </View>

        {/* Header */}
        <View style={styles.header}>
          <AppText style={styles.title}>{t.roleSelection.welcomeTitle}</AppText>
          <AppText style={styles.subSubtitleText}>{t.roleSelection.welcomeSubtitle}</AppText>
        </View>

        {/* Compact Role Selection Buttons */}
        <View style={styles.buttonsContainer}>
          {/* Customer Button (Gold Gradient) */}
          <TouchableOpacity
            activeOpacity={0.88}
            onPress={() => handleRoleSelect("customer")}
            style={[
              styles.roleButtonWrapper,
              selectedRole === "customer" && styles.buttonPressed,
            ]}
          >
            <LinearGradient
              colors={["#C9A227", "#8A6A1F"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.roleButton}
            >
              <View style={[styles.iconCircle, styles.customerIconCircle]}>
                <Ionicons
                  name="person"
                  size={22}
                  color={Colors.themes.customer.primary}
                />
              </View>
              <View style={styles.roleTextWrapper}>
                <AppText style={styles.roleButtonTitle}>{t.roleSelection.customerTitle}</AppText>
                <AppText style={styles.roleButtonSubtitle}>
                  {t.roleSelection.customerDesc}
                </AppText>
              </View>
              <View style={styles.arrowContainer}>
                <DirectionalIcon
                  name="arrow-forward"
                  size={18}
                  color={Colors.neutral.white}
                />
              </View>
            </LinearGradient>
          </TouchableOpacity>

          {/* Provider Button (Deep Navy Gradient) */}
          <TouchableOpacity
            activeOpacity={0.88}
            onPress={() => handleRoleSelect("provider")}
            style={[
              styles.roleButtonWrapper,
              selectedRole === "provider" && styles.buttonPressed,
            ]}
          >
            <LinearGradient
              colors={["#1E3A8A", "#0F172A"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.roleButton}
            >
              <View style={[styles.iconCircle, styles.providerIconCircle]}>
                <Ionicons
                  name="construct"
                  size={22}
                  color={Colors.themes.provider.primary}
                />
              </View>
              <View style={styles.roleTextWrapper}>
                <AppText style={styles.roleButtonTitle}>
                  {t.roleSelection.vendorTitle}
                </AppText>
                <AppText style={styles.roleButtonSubtitle}>
                  {t.roleSelection.vendorDesc}
                </AppText>
              </View>
              <View style={styles.arrowContainer}>
                <DirectionalIcon
                  name="arrow-forward"
                  size={18}
                  color={Colors.neutral.white}
                />
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
    justifyContent: "center",
  },
  // Ambient Shine Elements
  goldGlowOrb: {
    position: "absolute",
    top: -50,
    right: -50,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: "rgba(217, 119, 6, 0.12)",
  },
  navyGlowOrb: {
    position: "absolute",
    bottom: -60,
    left: -60,
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: "rgba(30, 58, 138, 0.08)",
  },
  centerShineCircle: {
    position: "absolute",
    top: "30%",
    left: "15%",
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: "rgba(255, 255, 255, 0.6)",
  },
  imageContainer: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.md,
  },
  imageShadowWrapper: {
    width: "100%",
    height: 300,
    alignItems: "center",
    justifyContent: "center",
  },
  illustration: {
    width: 350,
    height: 350,
  },
  header: {
    alignItems: "center",
    marginBottom: Spacing.xl,
    paddingHorizontal: Spacing.md,
  },
  badgeRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(217, 119, 6, 0.1)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    gap: 6,
    marginBottom: Spacing.xs,
  },
  miniBrandDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.themes.customer.primary,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "800",
    color: Colors.themes.customer.primary,
    letterSpacing: 0.8,
  },
  topLangRow: {
    width: "100%",
    alignItems: "flex-end",
    paddingHorizontal: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  langPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    gap: 6,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  langPillText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#1E3A8A",
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: Colors.text.primary,
    marginBottom: 4,
    textAlign: "center",
  },
  subSubtitleText: {
    fontSize: 13,
    fontWeight: "500",
    color: Colors.text.secondary,
    textAlign: "center",
    paddingHorizontal: Spacing.md,
  },
  subtitle: {
    fontSize: 13,
    fontWeight: "500",
    color: Colors.text.secondary,
    textAlign: "center",
  },
  buttonsContainer: {
    gap: Spacing.md,
    paddingHorizontal: Spacing.xs,
  },
  roleButtonWrapper: {
    borderRadius: BorderRadius.lg,
    overflow: "hidden",
    ...Shadows.md,
  },
  roleButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: Spacing.md,
  },
  buttonPressed: {
    opacity: 0.92,
    transform: [{ scale: 0.98 }],
  },
  iconCircle: {
    width: 46,
    height: 46,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.neutral.white,
    justifyContent: "center",
    alignItems: "center",
    marginRight: Spacing.md,
    ...Shadows.sm,
  },
  customerIconCircle: {
    backgroundColor: Colors.neutral.white,
  },
  providerIconCircle: {
    backgroundColor: Colors.neutral.white,
  },
  roleTextWrapper: {
    flex: 1,
  },
  roleButtonTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.neutral.white,
  },
  roleButtonSubtitle: {
    fontSize: 11,
    color: "rgba(255, 255, 255, 0.88)",
    marginTop: 2,
    fontWeight: "500",
  },
  arrowContainer: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: Spacing.xs,
  },
});
