import {
  Modal,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import AppText from "@/components/common/AppText";
import Colors from "@/constants/Colors";
import { BorderRadius, Shadows, Spacing } from "@/constants/Styles";
import { useLanguage } from "@/context/language-context";
import { LanguageCode } from "@/lib/i18n/translations";

interface LanguageSwitcherModalProps {
  visible: boolean;
  onClose: () => void;
}

interface LangItem {
  code: LanguageCode;
  nativeTitle: string;
  subTitle: string;
  badge: string;
  icon: keyof typeof Ionicons.glyphMap;
}

const LANGUAGES: LangItem[] = [
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
    badge: "ROMAN",
    icon: "chatbubble-ellipses-outline",
  },
  {
    code: "ur",
    nativeTitle: "اردو (Urdu)",
    subTitle: "خوبصورت اور آسان اردو رسم الخط",
    badge: "اردو",
    icon: "book-outline",
  },
];

export default function LanguageSwitcherModal({
  visible,
  onClose,
}: LanguageSwitcherModalProps) {
  const { language, setLanguage, t } = useLanguage();

  const handleSelect = async (code: LanguageCode) => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (_) {}
    await setLanguage(code);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <View style={styles.globeCircle}>
                <Ionicons name="globe" size={18} color="#1E3A8A" />
              </View>
              <AppText style={styles.title}>{t.language.switchPrompt}</AppText>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
              <Ionicons name="close" size={20} color="#64748B" />
            </TouchableOpacity>
          </View>

          {/* Languages List */}
          <View style={styles.list}>
            {LANGUAGES.map((item) => {
              const isSelected = language === item.code;
              return (
                <TouchableOpacity
                  key={item.code}
                  style={[styles.itemCard, isSelected && styles.itemCardSelected]}
                  onPress={() => handleSelect(item.code)}
                  activeOpacity={0.8}
                >
                  <View style={styles.itemLeft}>
                    <View
                      style={[
                        styles.iconCircle,
                        isSelected && styles.iconCircleSelected,
                      ]}
                    >
                      <Ionicons
                        name={item.icon}
                        size={20}
                        color={isSelected ? "#1E3A8A" : "#64748B"}
                      />
                    </View>
                    <View>
                      <View style={styles.nameRow}>
                        <AppText
                          style={[
                            styles.nativeName,
                            isSelected && styles.nativeNameSelected,
                          ]}
                        >
                          {item.nativeTitle}
                        </AppText>
                        <View style={styles.badge}>
                          <AppText style={styles.badgeText}>{item.badge}</AppText>
                        </View>
                      </View>
                      <AppText style={styles.subName}>{item.subTitle}</AppText>
                    </View>
                  </View>

                  <View
                    style={[
                      styles.radioCircle,
                      isSelected && styles.radioCircleSelected,
                    ]}
                  >
                    {isSelected && (
                      <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  headerTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  globeCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.text.primary,
  },
  closeBtn: {
    padding: 6,
  },
  list: {
    gap: 10,
  },
  itemCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    borderRadius: 14,
    padding: 12,
  },
  itemCardSelected: {
    borderColor: "#2563EB",
    backgroundColor: "#EFF6FF",
  },
  itemLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  iconCircleSelected: {
    backgroundColor: "#DBEAFE",
    borderColor: "#BFDBFE",
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 2,
  },
  nativeName: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.text.primary,
  },
  nativeNameSelected: {
    color: "#1E3A8A",
  },
  badge: {
    backgroundColor: "#E2E8F0",
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: BorderRadius.full,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: "700",
    color: "#475569",
  },
  subName: {
    fontSize: 11,
    color: Colors.text.secondary,
  },
  radioCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: "#CBD5E1",
    alignItems: "center",
    justifyContent: "center",
  },
  radioCircleSelected: {
    borderColor: "#2563EB",
    backgroundColor: "#2563EB",
  },
});
