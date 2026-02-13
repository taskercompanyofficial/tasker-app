import React, { useState } from "react";
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInputProps,
  ViewStyle,
} from "react-native";
import Colors from "@/constants/Colors";
import { Spacing, Typography } from "@/constants/Styles";

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  onRightIconPress?: () => void;
  containerStyle?: ViewStyle;
  theme?: "customer" | "vendor";
}

export default function Input({
  label,
  error,
  leftIcon,
  rightIcon,
  onRightIconPress,
  containerStyle,
  theme = "customer",
  ...textInputProps
}: InputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const themeColor =
    theme === "vendor"
      ? Colors.themes.provider.primary
      : Colors.themes.customer.primary;

  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View
        style={[
          styles.inputContainer,
          isFocused && {
            borderColor: themeColor,
            backgroundColor: Colors.neutral.white,
          },
          error && styles.inputContainerError,
        ]}
      >
        {leftIcon && <View style={styles.leftIcon}>{leftIcon}</View>}
        <TextInput
          style={styles.input}
          placeholderTextColor={Colors.neutral.gray[400]}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          {...textInputProps}
        />
        {rightIcon && (
          <TouchableOpacity
            onPress={onRightIconPress}
            disabled={!onRightIconPress}
            style={styles.rightIcon}
          >
            {rightIcon}
          </TouchableOpacity>
        )}
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.xs,
  },
  label: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.medium,
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.neutral.gray[50],
    borderRadius: 8,
    paddingHorizontal: Spacing.xs,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: Colors.border.light,
  },
  inputContainerError: {
    borderColor: Colors.error,
    backgroundColor: Colors.neutral.white,
  },
  leftIcon: {
    marginRight: Spacing.xs,
  },
  rightIcon: {
    marginLeft: Spacing.xs,
  },
  input: {
    flex: 1,
    fontSize: Typography.sizes.xs,
    color: Colors.text.primary,
    paddingVertical: 0,
  },
  errorText: {
    fontSize: 11,
    color: Colors.error,
    marginTop: 2,
    marginLeft: 2,
  },
});
