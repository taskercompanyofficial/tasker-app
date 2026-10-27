import React, { useEffect, useRef, useState } from "react";
import {
  Dimensions,
  PanResponder,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import AppText from "@/components/common/AppText";

interface VendorSlidablePriceViewsProps {
  activeTabIndex: number;
  onTabChange: (index: number) => void;
  dailyAmount: string;
  monthlyAmount: string;
  totalJobsDoneDaily: number;
  totalJobsDoneMonthly: number;
  totalLifetimeJobs?: number;
  todayEarnings: number;
  dailyCashCollected?: number;
  companyShare: number;
  dueTodayPayable: number;
  isLocked?: boolean;
  overdueAmount?: number;
  onOpenBreakdown: (mode: "daily" | "monthly") => void;
}

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export default function VendorSlidablePriceViews({
  activeTabIndex,
  onTabChange,
  dailyAmount,
  monthlyAmount,
  totalJobsDoneDaily,
  totalJobsDoneMonthly,
  totalLifetimeJobs = 0,
  todayEarnings,
  dailyCashCollected = 0,
  companyShare,
  dueTodayPayable,
  isLocked = false,
  overdueAmount = 0,
  onOpenBreakdown,
}: VendorSlidablePriceViewsProps) {
  const [containerWidth, setContainerWidth] = useState(SCREEN_WIDTH);
  const translateX = useSharedValue(-activeTabIndex * SCREEN_WIDTH);

  // Sync animation when activeTabIndex changes externally (e.g. from tab tap)
  useEffect(() => {
    translateX.value = withSpring(-activeTabIndex * containerWidth, {
      damping: 20,
      stiffness: 140,
    });
  }, [activeTabIndex, containerWidth, translateX]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: translateX.value }],
    };
  });

  const activeIndexRef = useRef(activeTabIndex);
  activeIndexRef.current = activeTabIndex;

  const containerWidthRef = useRef(containerWidth);
  containerWidthRef.current = containerWidth;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      // Only capture when user swipes horizontally and exceeds threshold
      onMoveShouldSetPanResponder: (_, gesture) => {
        return (
          Math.abs(gesture.dx) > 15 &&
          Math.abs(gesture.dx) > Math.abs(gesture.dy) * 1.2
        );
      },
      onPanResponderGrant: () => {
        try {
          Haptics.selectionAsync();
        } catch (_) {}
      },
      onPanResponderMove: (_, gesture) => {
        const base = -activeIndexRef.current * containerWidthRef.current;
        // Provide slight resistance at outer boundaries
        let offset = gesture.dx;
        if (
          (activeIndexRef.current === 0 && offset > 0) ||
          (activeIndexRef.current === 1 && offset < 0)
        ) {
          offset = offset * 0.35;
        }
        translateX.value = base + offset;
      },
      onPanResponderRelease: (_, gesture) => {
        const width = containerWidthRef.current;
        const currentIdx = activeIndexRef.current;
        const isFlick = Math.abs(gesture.vx) > 0.35;
        const passedDistance = Math.abs(gesture.dx) > width * 0.22;

        if ((passedDistance || isFlick) && gesture.dx < 0 && currentIdx === 0) {
          // Swiped left to Monthly
          try {
            Haptics.selectionAsync();
          } catch (_) {}
          onTabChange(1);
        } else if ((passedDistance || isFlick) && gesture.dx > 0 && currentIdx === 1) {
          // Swiped right to Daily
          try {
            Haptics.selectionAsync();
          } catch (_) {}
          onTabChange(0);
        } else {
          // Spring back to current index
          translateX.value = withSpring(-currentIdx * width, {
            damping: 20,
            stiffness: 140,
          });
        }
      },
      onPanResponderTerminate: () => {
        translateX.value = withSpring(
          -activeIndexRef.current * containerWidthRef.current,
          {
            damping: 20,
            stiffness: 140,
          }
        );
      },
    })
  ).current;

  return (
    <View
      style={styles.wrapper}
      onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)}
      {...panResponder.panHandlers}
    >
      <Animated.View
        style={[
          styles.slidingTrack,
          { width: containerWidth * 2 },
          animatedStyle,
        ]}
      >
        {/* ─── SLIDE 0: DAILY SHARE ─── */}
        <View style={[styles.slidePage, { width: containerWidth }]}>
          {/* Title Row with Info Button */}
          <View style={styles.titleWithInfoRow}>
            <AppText style={styles.balanceSubtitle}>Daily Net Balance</AppText>
            <TouchableOpacity
              style={styles.infoBtn}
              onPress={() => onOpenBreakdown("daily")}
              activeOpacity={0.7}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="information-circle-outline" size={17} color="#64748B" />
            </TouchableOpacity>
          </View>

          {/* Amount (Negative in red when locked/due) */}
          <View style={styles.amountRow}>
            <AppText
              style={[
                styles.currencyPrefix,
                isLocked && { color: "#DC2626" },
              ]}
            >
              {isLocked ? "-PKR" : "PKR"}
            </AppText>
            <AppText
              style={[
                styles.amountText,
                isLocked && { color: "#DC2626" },
              ]}
            >
              {isLocked && overdueAmount > 0
                ? overdueAmount.toLocaleString()
                : dailyAmount}
            </AppText>
          </View>

          {/* Jobs Subtitle */}
          <AppText style={styles.jobsDoneText}>
            {totalJobsDoneDaily === 1
              ? "1 job completed today"
              : `${totalJobsDoneDaily} jobs completed today`}
            {totalLifetimeJobs > 0 && totalJobsDoneDaily === 0
              ? ` (${totalLifetimeJobs} all-time)`
              : ""}
          </AppText>

          {/* 3-Column Cardless Stats */}
          <View style={styles.cardlessStatsRow}>
            <View style={styles.cardlessCol}>
              <AppText
                style={styles.statNumber}
                numberOfLines={1}
                adjustsFontSizeToFit
              >
                PKR {(dailyCashCollected > 0 ? dailyCashCollected : (todayEarnings + companyShare)).toLocaleString()}
              </AppText>
              <AppText
                style={styles.statLabel}
                numberOfLines={1}
                adjustsFontSizeToFit
              >
                Cash Collected
              </AppText>
            </View>

            <View style={[styles.cardlessCol, styles.statDivider]}>
              <AppText
                style={[styles.statNumber, { color: "#DC2626" }]}
                numberOfLines={1}
                adjustsFontSizeToFit
              >
                PKR {companyShare.toLocaleString()}
              </AppText>
              <AppText
                style={styles.statLabel}
                numberOfLines={1}
                adjustsFontSizeToFit
              >
                Company (35%)
              </AppText>
            </View>

            <View style={styles.cardlessCol}>
              <AppText
                style={[
                  styles.statNumber,
                  { color: isLocked || dueTodayPayable > 0 ? "#DC2626" : "#059669" },
                ]}
                numberOfLines={1}
                adjustsFontSizeToFit
              >
                PKR {isLocked && overdueAmount > 0
                  ? overdueAmount.toLocaleString()
                  : dueTodayPayable.toLocaleString()}
              </AppText>
              <AppText
                style={styles.statLabel}
                numberOfLines={1}
                adjustsFontSizeToFit
              >
                {isLocked ? "Overdue" : "Due Tonight"}
              </AppText>
            </View>
          </View>
        </View>

        {/* ─── SLIDE 1: MONTHLY CLAIMS ─── */}
        <View style={[styles.slidePage, { width: containerWidth }]}>
          {/* Title Row with Info Button */}
          <View style={styles.titleWithInfoRow}>
            <AppText style={styles.balanceSubtitle}>Monthly Accrued Payout</AppText>
            <TouchableOpacity
              style={styles.infoBtn}
              onPress={() => onOpenBreakdown("monthly")}
              activeOpacity={0.7}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="information-circle-outline" size={17} color="#64748B" />
            </TouchableOpacity>
          </View>

          {/* Amount */}
          <View style={styles.amountRow}>
            <AppText style={styles.currencyPrefix}>PKR</AppText>
            <AppText style={styles.amountText}>{monthlyAmount}</AppText>
          </View>

          {/* Jobs Subtitle */}
          <AppText style={styles.jobsDoneText}>
            {totalJobsDoneMonthly === 1
              ? "1 warranty & free job completed"
              : `${totalJobsDoneMonthly} warranty & free jobs completed`}
          </AppText>

          {/* 3-Column Cardless Stats */}
          <View style={styles.cardlessStatsRow}>
            <View style={styles.cardlessCol}>
              <AppText
                style={styles.statNumber}
                numberOfLines={1}
                adjustsFontSizeToFit
              >
                {totalJobsDoneMonthly} Jobs
              </AppText>
              <AppText
                style={styles.statLabel}
                numberOfLines={1}
                adjustsFontSizeToFit
              >
                Warranty & Free
              </AppText>
            </View>

            <View style={[styles.cardlessCol, styles.statDivider]}>
              <AppText
                style={[styles.statNumber, { color: "#059669" }]}
                numberOfLines={1}
                adjustsFontSizeToFit
              >
                0% Fee
              </AppText>
              <AppText
                style={styles.statLabel}
                numberOfLines={1}
                adjustsFontSizeToFit
              >
                Platform Cut
              </AppText>
            </View>

            <View style={styles.cardlessCol}>
              <AppText
                style={[styles.statNumber, { color: "#2563EB" }]}
                numberOfLines={1}
                adjustsFontSizeToFit
              >
                1st–5th
              </AppText>
              <AppText
                style={styles.statLabel}
                numberOfLines={1}
                adjustsFontSizeToFit
              >
                Payout Date
              </AppText>
            </View>
          </View>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    overflow: "hidden",
    backgroundColor: "transparent",
    paddingTop: 18,
  },
  slidingTrack: {
    flexDirection: "row",
  },
  slidePage: {
    alignItems: "center",
    paddingHorizontal: 20,
  },
  titleWithInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  balanceSubtitle: {
    fontSize: 11.5,
    fontWeight: "700",
    color: "#64748B",
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  infoBtn: {
    padding: 2,
  },
  amountRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 6,
    marginTop: 6,
    marginBottom: 4,
  },
  currencyPrefix: {
    fontSize: 18,
    fontWeight: "700",
    color: "#94A3B8",
  },
  amountText: {
    fontSize: 42,
    fontWeight: "900",
    color: "#0F172A",
    letterSpacing: -0.5,
  },
  jobsDoneText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#94A3B8",
    marginBottom: 20,
  },
  cardlessStatsRow: {
    flexDirection: "row",
    width: "100%",
    paddingVertical: 15,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  cardlessCol: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  statDivider: {
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: "#E5E7EB",
  },
  statNumber: {
    fontSize: 14.5,
    fontWeight: "800",
    color: "#0F172A",
  },
  statLabel: {
    fontSize: 10.5,
    fontWeight: "600",
    color: "#94A3B8",
    marginTop: 3,
  },
});
