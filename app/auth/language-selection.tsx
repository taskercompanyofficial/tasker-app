import DirectionalIcon from "@/components/common/DirectionalIcon";
import React, { useState } from "react";
import {
  Image,
  StatusBar,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import AppText from "@/components/common/AppText";
import Colors from "@/constants/Colors";
import { BorderRadius, Shadows, Spacing } from "@/constants/Styles";
import { useLanguage } from "@/context/language-context";
import { LanguageCode } from "@/lib/i18n/translations";

interface LanguageOption {
  code: LanguageCode;
  nativeTitle: string;
  subTitle: string;
  badge: string;
  icon: keyof typeof Ionicons.glyphMap;
}

const LANGUAGES: LanguageOption[] = [
  {
    code: "en",
    nativeTitle: "English",
    subTitle: "Default application language",
    badge: "EN",
    icon: "globe-outline",
  },
  {
    code: "ur-Latn",
    nativeTitle: "Roman Urdu",
    subTitle: "Aasan Roman Urdu me istemal karein",
    badge: "UR-ROMAN",
    icon: "chatbubble-ellipses-outline",
  },
  {
    code: "ur",
    nativeTitle: "اردو (Urdu)",
    subTitle: "آسان اردو زبان میں استعمال کریں",
    badge: "اردو",
    icon: "book-outline",
  },
];

export default function LanguageSelectionScreen() {
  const router = useRouter();
  const { language, setLanguage, t } = useLanguage();
  const [selectedLang, setSelectedLang] = useState<LanguageCode>(language);

  const handleSelectLanguage = async (code: LanguageCode) => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (_) { }
    setSelectedLang(code);
  };

  const handleContinue = async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (_) { }
    await setLanguage(selectedLang);
    router.replace("/auth/role-selection");
  };

  return (
    <LinearGradient
      colors={["#FFFFFF", "#FDFBF7", "#F3F6FC"]}
      start={{ x: 0.1, y: 0 }}
      end={{ x: 0.9, y: 1 }}
      style={styles.container}
    >
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

      {/* Ambient Decorative Orbs */}
      <View style={styles.goldGlowOrb} />
      <View style={styles.navyGlowOrb} />

      <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
        {/* Top Header Logo */}
        <View style={styles.header}>
          <Image
            source={require("@/assets/images/tasker-logo.png")}
            style={styles.logo}
            resizeMode="contain"
          />
          <AppText style={styles.title}>{t.language.selectLanguage}</AppText>
          <AppText style={styles.subtitle}>{t.language.subtitle}</AppText>
        </View>

        {/* Language Options List */}
        <View style={styles.listContainer}>
          {LANGUAGES.map((item) => {
            const isSelected = selectedLang === item.code;
            return (
              <TouchableOpacity
                key={item.code}
                style={[
                  styles.card,
                  isSelected && styles.cardSelected,
                ]}
                activeOpacity={0.85}
                onPress={() => handleSelectLanguage(item.code)}
              >
                <View style={styles.cardLeft}>
                  <View
                    style={[
                      styles.iconCircle,
                      isSelected && styles.iconCircleSelected,
                    ]}
                  >
                    <Ionicons
                      name={item.icon}
                      size={22}
                      color={isSelected ? "#1E3A8A" : "#64748B"}
                    />
                  </View>
                  <View style={styles.textWrapper}>
                    <View style={styles.titleRow}>
                      <AppText
                        style={[
                          styles.nativeTitle,
                          isSelected && styles.nativeTitleSelected,
                        ]}
                      >
                        {item.nativeTitle}
                      </AppText>
                      <View style={styles.badge}>
                        <AppText style={styles.badgeText}>{item.badge}</AppText>
                      </View>
                    </View>
                    <AppText style={styles.subTitle}>{item.subTitle}</AppText>
                  </View>
                </View>

                {/* Radio selection checkmark */}
                <View
                  style={[
                    styles.radioCircle,
                    isSelected && styles.radioCircleSelected,
                  ]}
                >
                  {isSelected && (
                    <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Bottom Continue Action */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.continueBtn}
            activeOpacity={0.88}
            onPress={handleContinue}
          >
            <LinearGradient
              colors={["#1E3A8A", "#2563EB"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.continueGradient}
            >
              <AppText style={styles.continueBtnText}>
                {t.language.continue}
              </AppText>
              <DirectionalIcon name="arrow-forward" size={18} color="#FFFFFF" />
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
    paddingHorizontal: Spacing.xl,
    justifyContent: "space-between",
  },
  goldGlowOrb: {
    position: "absolute",
    top: -50,
    right: -40,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: "rgba(234, 179, 8, 0.12)",
  },
  navyGlowOrb: {
    position: "absolute",
    bottom: -60,
    left: -40,
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: "rgba(30, 58, 138, 0.08)",
  },
  header: {
    alignItems: "center",
    paddingTop: Spacing.xl,
    marginBottom: Spacing.md,
  },
  logo: {
    width: 140,
    height: 48,
    marginBottom: Spacing.lg,
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    color: Colors.text.primary,
    textAlign: "center",
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.text.secondary,
    textAlign: "center",
    paddingHorizontal: Spacing.md,
  },
  listContainer: {
    gap: 14,
    marginVertical: Spacing.lg,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFFFFF",
    borderRadius: BorderRadius.sm,
    padding: Spacing.md + 2,
    borderWidth: 0.5,
    borderColor: "#E2E8F0",
  },
  cardSelected: {
    borderColor: "#2563EB",
    backgroundColor: "#F8FAFC",
  },
  cardLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  iconCircleSelected: {
    backgroundColor: "#EFF6FF",
  },
  textWrapper: {
    flex: 1,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 3,
  },
  nativeTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.text.primary,
  },
  nativeTitleSelected: {
    color: "#1E3A8A",
  },
  badge: {
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#64748B",
  },
  subTitle: {
    fontSize: 12,
    color: Colors.text.secondary,
  },
  radioCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#CBD5E1",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: Spacing.sm,
  },
  radioCircleSelected: {
    borderColor: "#2563EB",
    backgroundColor: "#2563EB",
  },
  footer: {
    paddingBottom: Spacing.lg,
  },
  continueBtn: {
    borderRadius: 14,
    overflow: "hidden",
    ...Shadows.md,
  },
  continueGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 15,
    gap: 8,
  },
  continueBtnText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
});
