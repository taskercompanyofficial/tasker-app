import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Colors from "@/constants/Colors";
import { Spacing } from "@/constants/Styles";
import Button from "./Button";

interface EmptyStateProps {
  icon?: string;
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  theme?: "customer" | "vendor";
}

export default function EmptyState({
  icon = "document-text-outline",
  title,
  message,
  actionLabel,
  onAction,
  theme = "customer",
}: EmptyStateProps) {
  const themeColor =
    theme === "vendor"
      ? Colors.themes.provider.primary
      : Colors.themes.customer.primary;

  return (
    <View style={styles.container}>
      <View style={[styles.iconContainer, { backgroundColor: themeColor + "15" }]}>
        <Ionicons name={icon as any} size={48} color={themeColor} />
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
      {actionLabel && onAction && (
        <View style={styles.buttonContainer}>
          <Button
            title={actionLabel}
            onPress={onAction}
            theme={theme}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.xxl,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
    textAlign: "center",
  },
  message: {
    fontSize: 14,
    color: Colors.text.secondary,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: Spacing.lg,
  },
  buttonContainer: {
    minWidth: 200,
    marginTop: Spacing.md,
  },
});
