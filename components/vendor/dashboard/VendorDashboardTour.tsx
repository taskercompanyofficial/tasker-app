import React, { useEffect, useState, useCallback, useRef } from "react";
import {
  Modal,
  StyleSheet,
  TouchableOpacity,
  View,
  Dimensions,
  Animated,
  Platform,
} from "react-native";
import Svg, { Defs, Mask, Rect } from "react-native-svg";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import AppText from "@/components/common/AppText";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

export interface TourTargetRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface VendorTourStep {
  id: string;
  targetKey:
    | "onlineSlider"
    | "profile"
    | "rateCardBtn"
    | "quickPayBtn"
    | "notifBtn"
    | "paymentTabs"
    | "priceCardDaily"
    | "priceCardMonthly"
    | "activitySheet";
  title: string;
  badge: string;
  icon: keyof typeof Ionicons.glyphMap;
  description: string;
  tip?: string;
  tabIndex?: number;
  scrollY?: number;
  borderRadius?: number;
  padding?: number;
}

export const VENDOR_DASHBOARD_TOUR_STEPS: VendorTourStep[] = [
  {
    id: "go-online",
    targetKey: "onlineSlider",
    title: "Slide to Go Online & Get Jobs",
    badge: "Start Working",
    icon: "radio-button-on-outline",
    description:
      "Slide the green button to the right when you are ready for work. You will take a quick live verification selfie to unlock 24 hours of live customer job dispatches.",
    tip: "When your shift is over, slide it back to go Offline anytime.",
    tabIndex: 0,
    scrollY: 0,
    borderRadius: 32,
    padding: 6,
  },
  {
    id: "profile-status",
    targetKey: "profile",
    title: "Partner Profile & Live Badge",
    badge: "Live Status",
    icon: "shield-checkmark-outline",
    description:
      "Shows your Verified Partner identity and active connection dot. When you are online, a green 'LIVE' badge appears here so you know dispatches are active.",
    tabIndex: 0,
    scrollY: 0,
    borderRadius: 16,
    padding: 8,
  },
  {
    id: "rate-card",
    targetKey: "rateCardBtn",
    title: "Official Rate Card & Price List",
    badge: "Service Rates",
    icon: "receipt-outline",
    description:
      "Tap this receipt icon anytime to check official Customer Service Rates (AC, Refrigerator, LED, Washing Machine) and Free Installation Brand Payout rates.",
    tip: "Show this official rate list to customers for transparent billing.",
    tabIndex: 0,
    scrollY: 0,
    borderRadius: 22,
    padding: 6,
  },
  {
    id: "quick-pay",
    targetKey: "quickPayBtn",
    title: "Quick Pay & Company Settlement",
    badge: "Settle Dues",
    icon: "qr-code-outline",
    description:
      "Tap here to pay the 35% company share via Bank Transfer / Raast / JazzCash and upload your receipt before 12:00 AM midnight so your account stays unlocked.",
    tabIndex: 0,
    scrollY: 0,
    borderRadius: 22,
    padding: 6,
  },
  {
    id: "notifications",
    targetKey: "notifBtn",
    title: "Job Alerts & Notifications",
    badge: "Dispatches",
    icon: "notifications-outline",
    description:
      "View all incoming work order alerts, customer updates, and payment approval notifications in one place.",
    tabIndex: 0,
    scrollY: 0,
    borderRadius: 22,
    padding: 6,
  },
  {
    id: "payment-tabs",
    targetKey: "paymentTabs",
    title: "Daily Share vs. Monthly Payouts",
    badge: "Dual Ledger",
    icon: "swap-horizontal-outline",
    description:
      "Switch between your two wallets: 'Daily Share' tracks cash jobs where you collect payment from the customer, and 'Monthly Payouts' tracks corporate/warranty jobs paid to you by Tasker Company.",
    tabIndex: 0,
    scrollY: 0,
    borderRadius: 14,
    padding: 4,
  },
  {
    id: "daily-price-card",
    targetKey: "priceCardDaily",
    title: "Daily Net Balance & 65/35 Split",
    badge: "Daily Cash Jobs",
    icon: "wallet-outline",
    description:
      "Shows your net 65% take-home profit today, along with 100% Cash Collected from customers, the 35% Company Share, and Due Tonight. Tap the (i) icon next to the amount for a full formula breakdown.",
    tip: "You can also swipe this area left or right to switch tabs.",
    tabIndex: 0,
    scrollY: 0,
    borderRadius: 20,
    padding: 6,
  },
  {
    id: "monthly-price-card",
    targetKey: "priceCardMonthly",
    title: "Monthly Accrued Payouts",
    badge: "Corporate & Warranty",
    icon: "calendar-outline",
    description:
      "For Free Installations and Warranty claims where no cash is collected from the customer, 100% of your fixed service rate accumulates here and is released on the 5th of each month.",
    tabIndex: 1,
    scrollY: 0,
    borderRadius: 20,
    padding: 6,
  },
  {
    id: "activity-sheet",
    targetKey: "activitySheet",
    title: "Settlement Banner & Today's Activity",
    badge: "Live Ledger",
    icon: "list-outline",
    description:
      "Track your midnight settlement status, tap 'Pay Now' to clear dues directly, and review every completed job's credit/debit entry in real time.",
    tabIndex: 0,
    scrollY: 120,
    borderRadius: 24,
    padding: 4,
  },
];

interface VendorDashboardTourProps {
  visible: boolean;
  onClose: () => void;
  targetRefs: Record<string, React.RefObject<View | null>>;
  onSwitchTab: (index: number) => void;
  onScrollTo?: (y: number) => void;
}

export default function VendorDashboardTour({
  visible,
  onClose,
  targetRefs,
  onSwitchTab,
  onScrollTo,
}: VendorDashboardTourProps) {
  const [stepIndex, setStepIndex] = useState(0);
  const [spotRect, setSpotRect] = useState<TourTargetRect | null>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const currentStep = VENDOR_DASHBOARD_TOUR_STEPS[stepIndex] || VENDOR_DASHBOARD_TOUR_STEPS[0];
  const totalSteps = VENDOR_DASHBOARD_TOUR_STEPS.length;

  useEffect(() => {
    if (!visible) {
      setStepIndex(0);
      setSpotRect(null);
      return;
    }

    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.06,
          duration: 750,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 750,
          useNativeDriver: true,
        }),
      ])
    );
    pulseLoop.start();
    return () => pulseLoop.stop();
  }, [visible, pulseAnim]);

  const measureCurrentStep = useCallback(
    (index: number) => {
      const step = VENDOR_DASHBOARD_TOUR_STEPS[index];
      if (!step) return;

      if (typeof step.tabIndex === "number") {
        onSwitchTab(step.tabIndex);
      }
      if (typeof step.scrollY === "number" && onScrollTo) {
        onScrollTo(step.scrollY);
      }

      fadeAnim.setValue(0);

      // Wait briefly for tab/scroll layout settle before measuring in window
      const timer = setTimeout(() => {
        const refKey =
          step.targetKey === "priceCardDaily" || step.targetKey === "priceCardMonthly"
            ? "priceCard"
            : step.targetKey;
        const targetRef = targetRefs[refKey];

        if (targetRef?.current) {
          targetRef.current.measureInWindow((x, y, width, height) => {
            if (width > 0 && height > 0) {
              const pad = step.padding ?? 6;
              setSpotRect({
                x: Math.max(4, x - pad),
                y: Math.max(4, y - pad),
                width: Math.min(SCREEN_WIDTH - 8, width + pad * 2),
                height: height + pad * 2,
              });
            } else {
              setSpotRect(null);
            }
            Animated.timing(fadeAnim, {
              toValue: 1,
              duration: 220,
              useNativeDriver: true,
            }).start();
          });
        } else {
          setSpotRect(null);
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 220,
            useNativeDriver: true,
          }).start();
        }
      }, 220);

      return () => clearTimeout(timer);
    },
    [targetRefs, onSwitchTab, onScrollTo, fadeAnim]
  );

  useEffect(() => {
    if (visible) {
      measureCurrentStep(stepIndex);
    }
  }, [visible, stepIndex, measureCurrentStep]);

  const handleNext = () => {
    try {
      Haptics.selectionAsync();
    } catch (_) {}

    if (stepIndex < totalSteps - 1) {
      setStepIndex((prev) => prev + 1);
    } else {
      onSwitchTab(0);
      if (onScrollTo) onScrollTo(0);
      onClose();
    }
  };

  const handlePrev = () => {
    try {
      Haptics.selectionAsync();
    } catch (_) {}

    if (stepIndex > 0) {
      setStepIndex((prev) => prev - 1);
    }
  };

  const handleSkip = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (_) {}
    onSwitchTab(0);
    if (onScrollTo) onScrollTo(0);
    onClose();
  };

  if (!visible) return null;

  // Decide whether tooltip card should appear ABOVE or BELOW the spotlight
  const spotCenterY = spotRect ? spotRect.y + spotRect.height / 2 : SCREEN_HEIGHT / 2;
  const placeCardAbove = spotCenterY > SCREEN_HEIGHT * 0.54;

  const tooltipTop = spotRect
    ? placeCardAbove
      ? Math.max(Platform.OS === "ios" ? 56 : 36, spotRect.y - 255)
      : Math.min(SCREEN_HEIGHT - 275, spotRect.y + spotRect.height + 16)
    : SCREEN_HEIGHT / 2 - 120;

  const spotRadius = currentStep.borderRadius ?? 18;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={handleSkip}
    >
      <View style={styles.root}>
        {/* SVG Dark Backdrop with Spotlight Cutout */}
        <Svg width={SCREEN_WIDTH} height={SCREEN_HEIGHT} style={StyleSheet.absoluteFill}>
          <Defs>
            <Mask id="tourSpotlightMask">
              <Rect x="0" y="0" width={SCREEN_WIDTH} height={SCREEN_HEIGHT} fill="white" />
              {spotRect && (
                <Rect
                  x={spotRect.x}
                  y={spotRect.y}
                  width={spotRect.width}
                  height={spotRect.height}
                  rx={spotRadius}
                  ry={spotRadius}
                  fill="black"
                />
              )}
            </Mask>
          </Defs>
          <Rect
            x="0"
            y="0"
            width={SCREEN_WIDTH}
            height={SCREEN_HEIGHT}
            fill="rgba(15, 23, 42, 0.78)"
            mask="url(#tourSpotlightMask)"
          />
        </Svg>

        {/* Animated Emerald Spotlight Ring around Target */}
        {spotRect && (
          <Animated.View
            pointerEvents="none"
            style={[
              styles.spotlightRing,
              {
                left: spotRect.x - 2,
                top: spotRect.y - 2,
                width: spotRect.width + 4,
                height: spotRect.height + 4,
                borderRadius: spotRadius + 2,
                opacity: fadeAnim,
                transform: [{ scale: pulseAnim }],
              },
            ]}
          />
        )}

        {/* Floating Instruction Card */}
        <Animated.View
          style={[
            styles.cardContainer,
            {
              top: tooltipTop,
              opacity: fadeAnim,
            },
          ]}
        >
          {/* Top Row: Badge + Step Counter + Skip */}
          <View style={styles.cardHeader}>
            <View style={styles.badgePill}>
              <Ionicons name={currentStep.icon} size={13} color="#059669" />
              <AppText style={styles.badgeText}>{currentStep.badge}</AppText>
            </View>

            <View style={styles.headerRight}>
              <AppText style={styles.stepCounterText}>
                {stepIndex + 1} / {totalSteps}
              </AppText>
              <TouchableOpacity
                onPress={handleSkip}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                style={styles.skipBtn}
              >
                <AppText style={styles.skipText}>Skip</AppText>
              </TouchableOpacity>
            </View>
          </View>

          {/* Title & Description */}
          <AppText style={styles.titleText}>{currentStep.title}</AppText>
          <AppText style={styles.descText}>{currentStep.description}</AppText>

          {/* Optional Pro Tip Box */}
          {currentStep.tip && (
            <View style={styles.tipBox}>
              <Ionicons name="bulb-outline" size={14} color="#047857" />
              <AppText style={styles.tipText}>{currentStep.tip}</AppText>
            </View>
          )}

          {/* Bottom Controls: Step Dots + Back / Next Buttons */}
          <View style={styles.cardFooter}>
            {/* Progress Dots */}
            <View style={styles.dotsRow}>
              {VENDOR_DASHBOARD_TOUR_STEPS.map((s, idx) => {
                const isActive = idx === stepIndex;
                const isDone = idx < stepIndex;
                return (
                  <View
                    key={s.id}
                    style={[
                      styles.dot,
                      isActive && styles.dotActive,
                      isDone && styles.dotDone,
                    ]}
                  />
                );
              })}
            </View>

            {/* Navigation Buttons */}
            <View style={styles.navBtnsRow}>
              {stepIndex > 0 && (
                <TouchableOpacity
                  style={styles.backBtn}
                  activeOpacity={0.75}
                  onPress={handlePrev}
                >
                  <Ionicons name="chevron-back" size={15} color="#475569" />
                  <AppText style={styles.backBtnText}>Back</AppText>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={styles.nextBtn}
                activeOpacity={0.85}
                onPress={handleNext}
              >
                <AppText style={styles.nextBtnText}>
                  {stepIndex === totalSteps - 1 ? "Got It!" : "Next"}
                </AppText>
                <Ionicons
                  name={stepIndex === totalSteps - 1 ? "checkmark-circle" : "arrow-forward"}
                  size={15}
                  color="#FFFFFF"
                />
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  spotlightRing: {
    position: "absolute",
    borderWidth: 2.5,
    borderColor: "#10B981",
    backgroundColor: "transparent",
  },
  cardContainer: {
    position: "absolute",
    left: 16,
    right: 16,
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 14,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  badgePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#ECFDF5",
    borderWidth: 1,
    borderColor: "#A7F3D0",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#065F46",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  stepCounterText: {
    fontSize: 11.5,
    fontWeight: "700",
    color: "#64748B",
  },
  skipBtn: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    backgroundColor: "#F1F5F9",
  },
  skipText: {
    fontSize: 11.5,
    fontWeight: "700",
    color: "#475569",
  },
  titleText: {
    fontSize: 17,
    fontWeight: "800",
    color: "#0F172A",
    marginBottom: 6,
    lineHeight: 22,
  },
  descText: {
    fontSize: 13.5,
    fontWeight: "500",
    color: "#475569",
    lineHeight: 19.5,
  },
  tipBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    backgroundColor: "#F0FDF4",
    borderWidth: 1,
    borderColor: "#BBF7D0",
    borderRadius: 12,
    paddingHorizontal: 11,
    paddingVertical: 8,
    marginTop: 10,
  },
  tipText: {
    flex: 1,
    fontSize: 12,
    fontWeight: "600",
    color: "#065F46",
    lineHeight: 16.5,
  },
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
  },
  dotsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#CBD5E1",
  },
  dotActive: {
    width: 18,
    backgroundColor: "#10B981",
  },
  dotDone: {
    backgroundColor: "#6EE7B7",
  },
  navBtnsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  backBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  backBtnText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#475569",
  },
  nextBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 12,
    backgroundColor: "#10B981",
  },
  nextBtnText: {
    fontSize: 13,
    fontWeight: "800",
    color: "#FFFFFF",
  },
});
