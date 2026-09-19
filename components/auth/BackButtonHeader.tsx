import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  useColorScheme,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import Colors from "@/constants/Colors";
import { Spacing, BorderRadius, Shadows } from "@/constants/Styles";
import * as Haptics from "expo-haptics";

interface BackButtonHeaderProps {
  title?: string;
  onBackPress: () => void;
  showBackButton?: boolean;
  backgroundColor?: string;
  textColor?: string;
}

export default function BackButtonHeader({
  title,
  onBackPress,
  showBackButton = true,
  backgroundColor = Colors.neutral.white,
  textColor = Colors.text.primary,
}: BackButtonHeaderProps) {
  const handleBackPress = () => {
    // Add haptic feedback
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onBackPress();
  };

  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  return (
    <View style={[styles.header, { backgroundColor }]}>
      <StatusBar
        barStyle={isDark ? "light-content" : "dark-content"}
        backgroundColor={
          isDark ? "rgba(0, 0, 0, 0.40)" : "rgba(255, 255, 255, 0.40)"
        }
        translucent
      />
      <SafeAreaView style={styles.safeHeader}>
        <View style={styles.headerContent}>
          {showBackButton && (
            <TouchableOpacity
              style={styles.backButton}
              onPress={handleBackPress}
              activeOpacity={0.7}
              accessibilityLabel="Go back"
              accessibilityHint="Navigate back to previous screen"
            >
              <Ionicons
                name="chevron-back"
                size={24}
                color={textColor}
              />
            </TouchableOpacity>
          )}
          <View style={styles.titleContainer}>
            {title && (
              <Text style={[styles.title, { color: textColor }]}>
                {title}
              </Text>
            )}
          </View>
          {/* Spacer for layout balance */}
          <View style={styles.spacer} />
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  safeHeader: {
    paddingHorizontal: Spacing.sm,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    height: 44, // Standard header height
    minHeight: 44, // Ensure minimum touch target
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.full,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.neutral.white,
    ...Shadows.sm,
  },
  titleContainer: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: Spacing.md,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
  },
  spacer: {
    width: 44, // Match back button width for balance
  },
});