import AppText from "@/components/common/AppText";
import React from "react";
import {
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  View,
  ViewStyle,
  TextStyle,
} from "react-native";
import Colors from "@/constants/Colors";
import { Spacing } from "@/constants/Styles";

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?:
    | "primary"
    | "secondary"
    | "outline"
    | "ghost"
    | "success"
    | "danger";
  size?: "small" | "medium" | "large";
  fullWidth?: boolean;
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  theme?: "customer" | "vendor";
}

export default function Button({
  title,
  onPress,
  variant = "primary",
  size = "medium",
  fullWidth = false,
  loading = false,
  disabled = false,
  icon,
  theme = "customer",
}: ButtonProps) {
  const themeColor =
    theme === "vendor"
      ? Colors.themes.provider.primary
      : Colors.themes.customer.primary;

  const getButtonStyle = (): ViewStyle[] => {
    const baseStyle: ViewStyle[] = [styles.button, styles[`button_${size}`]];

    if (fullWidth) baseStyle.push(styles.fullWidth);
    if (disabled || loading) baseStyle.push(styles.disabled);

    switch (variant) {
      case "primary":
        baseStyle.push({ backgroundColor: themeColor });
        break;
      case "secondary":
        baseStyle.push(styles.secondaryButton, {
          backgroundColor: themeColor + "15",
          borderWidth: 1,
          borderColor: themeColor,
        });
        break;
      case "outline":
        baseStyle.push({ ...styles.outlineButton, borderColor: themeColor });
        break;
      case "ghost":
        baseStyle.push(styles.ghostButton);
        break;
      case "success":
        baseStyle.push({ backgroundColor: Colors.success });
        break;
      case "danger":
        baseStyle.push({ backgroundColor: Colors.error });
        break;
    }

    return baseStyle;
  };

  const getTextStyle = (): TextStyle[] => {
    const baseStyle: TextStyle[] = [styles.text, styles[`text_${size}`]];

    switch (variant) {
      case "primary":
      case "success":
      case "danger":
        baseStyle.push(styles.primaryText);
        break;
      case "secondary":
      case "outline":
      case "ghost":
        baseStyle.push({ color: themeColor });
        break;
    }

    return baseStyle;
  };

  return (
    <TouchableOpacity
      style={getButtonStyle()}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator
          color={
            variant === "primary" ||
            variant === "success" ||
            variant === "danger"
              ? Colors.neutral.white
              : themeColor
          }
          size="small"
        />
      ) : (
        <View style={styles.content}>
          {icon && <View style={styles.icon}>{icon}</View>}
          <AppText style={getTextStyle()}>{title}</AppText>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  icon: {
    marginRight: Spacing.xs,
  },
  fullWidth: {
    width: "100%",
  },
  disabled: {
    opacity: 0.5,
  },

  // Sizes
  button_small: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  button_medium: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  button_large: {
    paddingVertical: 14,
    paddingHorizontal: 20,
  },

  // Variants
  secondaryButton: {
    backgroundColor: "transparent",
  },
  outlineButton: {
    backgroundColor: "transparent",
    borderWidth: 1,
  },
  ghostButton: {
    backgroundColor: "transparent",
  },

  // Text styles
  text: {
    fontWeight: "600",
  },
  text_small: {
    fontSize: 13,
  },
  text_medium: {
    fontSize: 14,
  },
  text_large: {
    fontSize: 15,
  },

  // Text colors
  primaryText: {
    color: Colors.neutral.white,
  },
  secondaryText: {
    color: Colors.neutral.white,
  },
});
