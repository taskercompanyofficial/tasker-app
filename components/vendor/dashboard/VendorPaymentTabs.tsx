import React, { useEffect, useState } from "react";
import { Dimensions, StyleSheet, TouchableOpacity, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import AppText from "@/components/common/AppText";

interface VendorPaymentTabsProps {
  activeTabIndex: number;
  onTabChange: (index: number) => void;
}

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export default function VendorPaymentTabs({
  activeTabIndex,
  onTabChange,
}: VendorPaymentTabsProps) {
  const [containerWidth, setContainerWidth] = useState(SCREEN_WIDTH);
  const tabWidth = containerWidth / 2;

  const underlineX = useSharedValue(activeTabIndex * tabWidth);

  useEffect(() => {
    underlineX.value = withSpring(activeTabIndex * tabWidth, {
      damping: 20,
      stiffness: 140,
    });
  }, [activeTabIndex, tabWidth, underlineX]);

  const animatedUnderlineStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: underlineX.value }],
      width: tabWidth,
    };
  });

  const handleTabPress = (index: number) => {
    if (index === activeTabIndex) return;
    try {
      Haptics.selectionAsync();
    } catch (_) {}
    onTabChange(index);
  };

  return (
    <View
      style={styles.tabsContainer}
      onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)}
    >
      <View style={styles.tabsRow}>
        <TouchableOpacity
          style={styles.tabBtn}
          onPress={() => handleTabPress(0)}
          activeOpacity={0.8}
        >
          <AppText
            style={[styles.tabLabel, activeTabIndex === 0 && styles.tabLabelActive]}
          >
            Daily Share
          </AppText>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tabBtn}
          onPress={() => handleTabPress(1)}
          activeOpacity={0.8}
        >
          <AppText
            style={[styles.tabLabel, activeTabIndex === 1 && styles.tabLabelActive]}
          >
            Monthly Payouts
          </AppText>
        </TouchableOpacity>
      </View>

      <Animated.View style={[styles.tabUnderline, animatedUnderlineStyle]} />
    </View>
  );
}

const styles = StyleSheet.create({
  tabsContainer: {
    position: "relative",
    backgroundColor: "transparent",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  tabsRow: {
    flexDirection: "row",
    width: "100%",
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  tabLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#94A3B8",
  },
  tabLabelActive: {
    fontWeight: "800",
    color: "#0F172A",
  },
  tabUnderline: {
    position: "absolute",
    bottom: 0,
    left: 0,
    height: 2.5,
    backgroundColor: "#0F172A",
  },
});
