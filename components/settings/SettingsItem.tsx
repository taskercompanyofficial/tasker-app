import Colors from "@/constants/Colors";
import { BorderRadius, Spacing, Typography } from "@/constants/Styles";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface SettingsItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  iconBgColor?: string;
  title: string;
  subtitle?: string;
  rightComponent?: React.ReactNode;
  onPress?: () => void;
  danger?: boolean;
  showChevron?: boolean;
}

export default function SettingsItem({
  icon,
  iconColor,
  iconBgColor,
  title,
  subtitle,
  rightComponent,
  onPress,
  danger = false,
  showChevron = true,
}: SettingsItemProps) {
  const ContainerComponent = onPress ? TouchableOpacity : View;

  return (
    <ContainerComponent
      style={[styles.container, danger && styles.dangerContainer]}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <View style={styles.leftContent}>
        <View
          style={[
            styles.iconBox,
            { backgroundColor: iconBgColor || iconColor + "15" },
          ]}
        >
          <Ionicons name={icon} size={18} color={iconColor} />
        </View>

        <View style={styles.textColumn}>
          <Text style={[styles.title, danger && styles.dangerTitle]}>
            {title}
          </Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
      </View>

      <View style={styles.rightContent}>
        {rightComponent}
        {onPress && showChevron && !rightComponent && (
          <Ionicons
            name="chevron-forward"
            size={18}
            color={danger ? Colors.error : Colors.text.tertiary}
          />
        )}
      </View>
    </ContainerComponent>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: Spacing.sm + 2,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.neutral.white,
    marginBottom: Spacing.xs + 2,
    borderWidth: 1,
    borderColor: Colors.border.light,
  },
  dangerContainer: {
    borderColor: Colors.error + "30",
    backgroundColor: Colors.error + "05",
  },
  leftContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    flex: 1,
  },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: BorderRadius.sm,
    justifyContent: "center",
    alignItems: "center",
  },
  textColumn: {
    flex: 1,
  },
  title: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.semibold,
    color: Colors.text.primary,
  },
  dangerTitle: {
    color: Colors.error,
  },
  subtitle: {
    fontSize: Typography.sizes.xs - 1,
    color: Colors.text.tertiary,
    marginTop: 2,
  },
  rightContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
});
