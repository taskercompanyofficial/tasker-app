import AppText from "@/components/common/AppText";
import Colors from "@/constants/Colors";
import { BorderRadius, Shadows, Spacing } from "@/constants/Styles";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useEffect, useRef } from "react";
import { Animated, Easing, Pressable, StyleSheet, View } from "react-native";

interface AccountSwitchCardProps {
  isVendor: boolean;
  onToggle: (next: boolean) => void;
}

export default function AccountSwitchCard({
  isVendor,
  onToggle,
}: AccountSwitchCardProps) {
  const animValue = useRef(new Animated.Value(isVendor ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(animValue, {
      toValue: isVendor ? 1 : 0,
      duration: 220,
      easing: Easing.out(Easing.quad),
      useNativeDriver: false,
    }).start();
  }, [isVendor]);

  const handleSelectMode = (targetIsVendor: boolean) => {
    if (isVendor === targetIsVendor) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onToggle(targetIsVendor);
  };

  const customerColor = Colors.themes.customer.primary;
  const providerColor = Colors.themes.provider.primary;

  return (
    <View style={styles.cardContainer}>
      {/* Header Info */}
      <View style={styles.headerRow}>
        <View style={styles.titleColumn}>
          <AppText style={styles.cardTitle}>Account Role</AppText>
          <AppText style={styles.cardSubtitle}>
            Select your active mode to switch features
          </AppText>
        </View>
        <View
          style={[
            styles.activeRolePill,
            {
              backgroundColor: isVendor ? providerColor + "15" : customerColor + "15",
              borderColor: isVendor ? providerColor + "40" : customerColor + "40",
            },
          ]}
        >
          <View
            style={[
              styles.statusDot,
              { backgroundColor: isVendor ? providerColor : customerColor },
            ]}
          />
          <AppText
            style={[
              styles.activeRoleText,
              { color: isVendor ? providerColor : customerColor },
            ]}
          >
            {isVendor ? "Service Provider" : "Customer"}
          </AppText>
        </View>
      </View>

      {/* Segmented Dual Switcher Bar */}
      <View style={styles.segmentContainer}>
        {/* Customer Segment Option */}
        <Pressable
          style={[
            styles.segmentButton,
            !isVendor && { backgroundColor: customerColor, ...Shadows.sm },
          ]}
          onPress={() => handleSelectMode(false)}
        >
          <Ionicons
            name={!isVendor ? "person" : "person-outline"}
            size={18}
            color={!isVendor ? Colors.neutral.white : Colors.text.secondary}
          />
          <AppText
            style={[
              styles.segmentText,
              !isVendor ? styles.segmentTextActive : styles.segmentTextInactive,
            ]}
          >
            Customer
          </AppText>
        </Pressable>

        {/* Service Provider Segment Option */}
        <Pressable
          style={[
            styles.segmentButton,
            isVendor && { backgroundColor: providerColor, ...Shadows.sm },
          ]}
          onPress={() => handleSelectMode(true)}
        >
          <Ionicons
            name={isVendor ? "briefcase" : "briefcase-outline"}
            size={18}
            color={isVendor ? Colors.neutral.white : Colors.text.secondary}
          />
          <AppText
            style={[
              styles.segmentText,
              isVendor ? styles.segmentTextActive : styles.segmentTextInactive,
            ]}
          >
            Service Provider
          </AppText>
        </Pressable>
      </View>

      {/* Dynamic Context Banner */}
      <View
        style={[
          styles.infoBanner,
          {
            backgroundColor: isVendor ? providerColor + "08" : customerColor + "08",
            borderColor: isVendor ? providerColor + "20" : customerColor + "20",
          },
        ]}
      >
        <Ionicons
          name={isVendor ? "flash" : "sparkles"}
          size={14}
          color={isVendor ? providerColor : customerColor}
        />
        <AppText style={styles.infoBannerText}>
          {isVendor
            ? "Currently managing jobs, services & provider dashboard."
            : "Currently booking technicians & tracking orders."}
        </AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: Colors.neutral.white,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginVertical: Spacing.md,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.sm,
  },
  titleColumn: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: Colors.text.primary,
  },
  cardSubtitle: {
    fontSize: 12,
    color: Colors.text.secondary,
    marginTop: 2,
  },
  activeRolePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  activeRoleText: {
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  segmentContainer: {
    flexDirection: "row",
    backgroundColor: Colors.neutral.gray[100],
    borderRadius: BorderRadius.md,
    padding: 4,
    gap: 4,
    marginBottom: Spacing.xs + 4,
  },
  segmentButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: BorderRadius.sm + 2,
    gap: 6,
  },
  segmentText: {
    fontSize: 13,
    fontWeight: "700",
  },
  segmentTextActive: {
    color: Colors.neutral.white,
  },
  segmentTextInactive: {
    color: Colors.text.secondary,
  },
  infoBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 8,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
  },
  infoBannerText: {
    fontSize: 11,
    fontWeight: "500",
    color: Colors.text.secondary,
    flex: 1,
  },
});
