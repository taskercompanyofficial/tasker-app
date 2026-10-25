import AppText from "@/components/common/AppText";
import React, { useState } from "react";
import { StyleSheet, TouchableOpacity, ViewStyle } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLanguage } from "@/context/language-context";
import LanguageSwitcherModal from "@/components/common/LanguageSwitcherModal";
import { BorderRadius } from "@/constants/Styles";

interface LanguagePillButtonProps {
  style?: ViewStyle;
  light?: boolean;
}

export default function LanguagePillButton({ style, light }: LanguagePillButtonProps) {
  const { language } = useLanguage();
  const [modalVisible, setModalVisible] = useState(false);

  const getLabel = () => {
    switch (language) {
      case "ur":
        return "اردو";
      case "ur-Latn":
        return "Roman";
      default:
        return "EN";
    }
  };

  return (
    <>
      <TouchableOpacity
        style={[
          styles.pill,
          light ? styles.pillLight : styles.pillDefault,
          style,
        ]}
        onPress={() => setModalVisible(true)}
        activeOpacity={0.75}
      >
        <Ionicons
          name="globe-outline"
          size={14}
          color={light ? "#FFFFFF" : "#1E3A8A"}
        />
        <AppText
          style={[
            styles.label,
            light ? styles.labelLight : styles.labelDefault,
            language === "ur" && { fontFamily: "NotoNaskhArabic-Bold" },
          ]}
        >
          {getLabel()}
        </AppText>
      </TouchableOpacity>

      <LanguageSwitcherModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: BorderRadius.full,
    gap: 5,
    borderWidth: 1,
  },
  pillDefault: {
    backgroundColor: "#EFF6FF",
    borderColor: "#BFDBFE",
  },
  pillLight: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderColor: "rgba(255, 255, 255, 0.4)",
  },
  label: {
    fontSize: 12,
    fontWeight: "700",
  },
  labelDefault: {
    color: "#1E3A8A",
  },
  labelLight: {
    color: "#FFFFFF",
  },
});
