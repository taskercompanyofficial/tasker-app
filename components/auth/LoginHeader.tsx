import AppText from "@/components/common/AppText";
import React from "react";
import { View, StyleSheet } from "react-native";
import Colors from "@/constants/Colors";

interface LoginHeaderProps {
  title: string;
  subtitle: string;
  theme?: "vendor" | "customer";
  hideIcon?: boolean;
}

export default function LoginHeader({ title, subtitle, theme = "vendor", hideIcon = false }: LoginHeaderProps) {
  const themeColor = theme === "vendor" ? Colors.themes.provider.primary : Colors.themes.customer.primary;

  return (
    <View style={styles.container}>
      {!hideIcon && (
        <View style={[styles.iconCircle, { backgroundColor: themeColor + "15" }]}>
          <AppText style={[styles.iconText, { color: themeColor }]}>T</AppText>
        </View>
      )}
      <AppText style={styles.title}>{title}</AppText>
      <AppText style={styles.subtitle}>{subtitle}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    marginBottom: 32,
    marginTop: 20,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  iconText: {
    fontSize: 36,
    fontWeight: "700",
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: Colors.text.primary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.text.secondary,
    textAlign: "center",
    lineHeight: 20,
  },
});
