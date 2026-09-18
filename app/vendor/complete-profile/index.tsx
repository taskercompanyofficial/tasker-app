import Colors from "@/constants/Colors";
import { BorderRadius, Shadows, Spacing } from "@/constants/Styles";
import { useSession } from "@/context/ctx";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Redirect, useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import TaskyTypewriterText from "@/components/vendor/TaskyTypewriterText";
import {
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";

export default function Step1Intro() {
  const router = useRouter();
  const { session } = useSession();
  const user = session.vendorUser;
  const vendor = user as any;

  // Step 2: CNIC Scan
  const step2Completed = Boolean(vendor?.cnic_front_image);

  // Step 3: CNIC Details & Current Address
  const step3Completed = Boolean(
    vendor?.cnic &&
      vendor?.name &&
      !String(vendor.name).startsWith("Partner ") &&
      vendor?.father_name &&
      vendor?.dob &&
      vendor?.address &&
      vendor?.current_address
  );

  // Step 4: Live Selfie
  const step4Completed = Boolean(vendor?.profile_image);

  // Step 5: 2 References
  const refs = vendor?.references;
  const step5Completed = Boolean(
    refs &&
      Array.isArray(refs) &&
      refs.length >= 2 &&
      refs[0]?.name &&
      refs[0]?.phone &&
      refs[1]?.name &&
      refs[1]?.phone
  );

  // Step 6: Education & Work Background
  const step6Completed = Boolean(vendor?.education && vendor?.marital_status);

  // Determine active next step
  let nextRoute = "/vendor/complete-profile/step-2";
  let buttonTitle = "Continue Verification";
  let progressPercent = "17%";
  let progressText = "17% Complete";
  let isComplete = false;

  if (!step2Completed) {
    nextRoute = "/vendor/complete-profile/step-2";
    buttonTitle = "Start CNIC Scan";
    progressPercent = "17%";
    progressText = "17% Complete";
  } else if (!step3Completed) {
    nextRoute = "/vendor/complete-profile/step-3";
    buttonTitle = "Review Details & Address";
    progressPercent = "33%";
    progressText = "33% Complete";
  } else if (!step4Completed) {
    nextRoute = "/vendor/complete-profile/step-4";
    buttonTitle = "Take Live Face Selfie";
    progressPercent = "50%";
    progressText = "50% Complete";
  } else if (!step5Completed) {
    nextRoute = "/vendor/complete-profile/step-5";
    buttonTitle = "Add Reference Contacts";
    progressPercent = "67%";
    progressText = "67% Complete";
  } else if (!step6Completed) {
    nextRoute = "/vendor/complete-profile/step-6";
    buttonTitle = "Personal & Work Background";
    progressPercent = "83%";
    progressText = "83% Complete";
  } else {
    nextRoute = "/vendor/(tabs)";
    buttonTitle = "Go to Vendor Dashboard";
    progressPercent = "100%";
    progressText = "100% Completed 🎉";
    isComplete = true;
  }

  // Instant zero-delay redirect to the active pending step
  if (!isComplete && nextRoute) {
    return <Redirect href={nextRoute as any} />;
  }

  if (isComplete) {
    return <Redirect href={"/vendor/(tabs)" as any} />;
  }

  // Handle Step Click with Strict Locking Rules
  const handleStepPress = (targetStep: number, route: string) => {
    // If step is already completed, it's locked unless rejected
    if (
      (targetStep === 2 && step2Completed) ||
      (targetStep === 3 && step3Completed) ||
      (targetStep === 4 && step4Completed) ||
      (targetStep === 5 && step5Completed) ||
      (targetStep === 6 && step6Completed)
    ) {
      Toast.show({
        type: "info",
        text1: "🔒 Step Locked",
        text2: "This section is already completed & verified.",
      });
      return;
    }

    // Guard: Cannot skip ahead before previous steps are done
    if (targetStep === 3 && !step2Completed) {
      Toast.show({ type: "error", text1: "CNIC Scan Required", text2: "Please complete CNIC scanning first." });
      return;
    }
    if (targetStep === 4 && !step3Completed) {
      Toast.show({ type: "error", text1: "Details Required", text2: "Please confirm your details first." });
      return;
    }
    if (targetStep === 5 && !step4Completed) {
      Toast.show({ type: "error", text1: "Live Selfie Required", text2: "Please capture your live photo first." });
      return;
    }
    if (targetStep === 6 && !step5Completed) {
      Toast.show({ type: "error", text1: "References Required", text2: "Please add your reference contacts first." });
      return;
    }

    router.push(route as any);
  };

  return (
    <SafeAreaView style={styles.introSafeArea} edges={["top", "bottom"]}>
      <StatusBar barStyle="dark-content" />

      {/* Ambient Glows */}
      <View style={styles.ambientTopGlow} />
      <View style={styles.ambientRightGlow} />

      {/* Top Header Navigation */}
      <View style={styles.introHeader}>
        <View style={styles.partnerBadge}>
          <Ionicons name="shield-checkmark" size={14} color={Colors.themes.provider.primary} />
          <Text style={styles.partnerBadgeText}>TASKER PARTNER NETWORK</Text>
        </View>
        <View style={styles.progressPillTop}>
          <Text style={styles.progressPillTextTop}>
            {step6Completed ? "Completed" : "Identity Verification"}
          </Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.introScrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 3D Tasky AI Hero Mascot Visual */}
        <View style={styles.taskyHeroCard}>
          <View style={styles.taskyImageWrapper}>
            <Image
              source={require("@/assets/images/tasky-ai-clipboard.png")}
              style={styles.taskyHeroImage}
              resizeMode="contain"
            />
          </View>
          <View style={styles.onlinePill}>
            <View style={styles.onlineDot} />
            <Text style={styles.onlineText}>Tasky Identity Assistant</Text>
          </View>
        </View>

        {/* Speech Bubble Card with Typing Effect */}
        <View style={styles.speechCard}>
          <View style={styles.speechHeader}>
            <View style={styles.sparkleIconBox}>
              <Ionicons name="sparkles" size={16} color="#FFFFFF" />
            </View>
            <Text style={styles.speechTitle}>Hi Partner! I&apos;m Tasky</Text>
          </View>
          <TaskyTypewriterText
            text="I'm here to help you complete your verification so you can get approved and start receiving verified customer jobs!"
            speedMs={15}
          />
        </View>

        {/* Progress Breakdown Card */}
        <View style={styles.progressOverviewCard}>
          <View style={styles.progressHeaderRow}>
            <Text style={styles.progressOverviewTitle}>Profile Completion</Text>
            <Text style={styles.progressOverviewPercent}>{progressText}</Text>
          </View>
          <View style={styles.progressBarTrack}>
            <View style={[styles.progressBarFill, { width: progressPercent as any }]} />
          </View>
        </View>

        {/* Setup Roadmap */}
        <View style={styles.roadmapCard}>
          <Text style={styles.roadmapHeading}>Verification Sections:</Text>

          {/* Step 1 */}
          <View style={styles.stepRow}>
            <View style={[styles.stepNumberCircle, { backgroundColor: "#10B98115" }]}>
              <Ionicons name="phone-portrait" size={18} color="#10B981" />
            </View>
            <View style={styles.stepInfo}>
              <Text style={styles.stepTitle}>Phone Number Verified</Text>
              <Text style={styles.stepSub}>Your registered vendor account is active</Text>
            </View>
            <Ionicons name="checkmark-circle" size={18} color="#10B981" />
          </View>

          {/* Step 2 */}
          <TouchableOpacity
            style={styles.stepRow}
            activeOpacity={0.7}
            onPress={() => handleStepPress(2, "/vendor/complete-profile/step-2")}
          >
            <View
              style={[
                styles.stepNumberCircle,
                { backgroundColor: step2Completed ? "#10B98115" : "#2563EB15" },
              ]}
            >
              <Ionicons
                name="scan"
                size={18}
                color={step2Completed ? "#10B981" : "#2563EB"}
              />
            </View>
            <View style={styles.stepInfo}>
              <Text style={styles.stepTitle}>CNIC Document Scan</Text>
              <Text style={styles.stepSub}>
                {step2Completed
                  ? "CNIC cards verified & locked"
                  : "Capture Front & Back with instant verification"}
              </Text>
            </View>
            {step2Completed ? (
              <Ionicons name="lock-closed" size={16} color="#10B981" />
            ) : (
              <Ionicons name="chevron-forward" size={16} color="#2563EB" />
            )}
          </TouchableOpacity>

          {/* Step 3 */}
          <TouchableOpacity
            style={[styles.stepRow, !step2Completed && { opacity: 0.5 }]}
            activeOpacity={step2Completed ? 0.7 : 1}
            onPress={() => handleStepPress(3, "/vendor/complete-profile/step-3")}
          >
            <View
              style={[
                styles.stepNumberCircle,
                { backgroundColor: step3Completed ? "#10B98115" : "#64748B12" },
              ]}
            >
              <Ionicons
                name="person-circle"
                size={18}
                color={step3Completed ? "#10B981" : "#64748B"}
              />
            </View>
            <View style={styles.stepInfo}>
              <Text style={styles.stepTitle}>Details & Current Address</Text>
              <Text style={styles.stepSub}>
                {step3Completed
                  ? "Details confirmed & locked"
                  : "Review extracted info and specify present address"}
              </Text>
            </View>
            {step3Completed ? (
              <Ionicons name="lock-closed" size={16} color="#10B981" />
            ) : step2Completed ? (
              <Ionicons name="chevron-forward" size={16} color="#2563EB" />
            ) : (
              <Ionicons name="lock-closed-outline" size={16} color="#94A3B8" />
            )}
          </TouchableOpacity>

          {/* Step 4 */}
          <TouchableOpacity
            style={[styles.stepRow, !step3Completed && { opacity: 0.5 }]}
            activeOpacity={step3Completed ? 0.7 : 1}
            onPress={() => handleStepPress(4, "/vendor/complete-profile/step-4")}
          >
            <View
              style={[
                styles.stepNumberCircle,
                { backgroundColor: step4Completed ? "#10B98115" : "#64748B12" },
              ]}
            >
              <Ionicons
                name="camera"
                size={18}
                color={step4Completed ? "#10B981" : "#64748B"}
              />
            </View>
            <View style={styles.stepInfo}>
              <Text style={styles.stepTitle}>Live Face Selfie</Text>
              <Text style={styles.stepSub}>
                {step4Completed
                  ? "Live photo captured & locked"
                  : "Take a real-time live camera selfie"}
              </Text>
            </View>
            {step4Completed ? (
              <Ionicons name="lock-closed" size={16} color="#10B981" />
            ) : step3Completed ? (
              <Ionicons name="chevron-forward" size={16} color="#2563EB" />
            ) : (
              <Ionicons name="lock-closed-outline" size={16} color="#94A3B8" />
            )}
          </TouchableOpacity>

          {/* Step 5 */}
          <TouchableOpacity
            style={[styles.stepRow, !step4Completed && { opacity: 0.5 }]}
            activeOpacity={step4Completed ? 0.7 : 1}
            onPress={() => handleStepPress(5, "/vendor/complete-profile/step-5")}
          >
            <View
              style={[
                styles.stepNumberCircle,
                { backgroundColor: step5Completed ? "#10B98115" : "#64748B12" },
              ]}
            >
              <Ionicons
                name="people"
                size={18}
                color={step5Completed ? "#10B981" : "#64748B"}
              />
            </View>
            <View style={styles.stepInfo}>
              <Text style={styles.stepTitle}>2 Reference Contacts</Text>
              <Text style={styles.stepSub}>
                {step5Completed
                  ? "2 Reference contacts saved & locked"
                  : "Provide name, relation & phone of 2 references"}
              </Text>
            </View>
            {step5Completed ? (
              <Ionicons name="lock-closed" size={16} color="#10B981" />
            ) : step4Completed ? (
              <Ionicons name="chevron-forward" size={16} color="#2563EB" />
            ) : (
              <Ionicons name="lock-closed-outline" size={16} color="#94A3B8" />
            )}
          </TouchableOpacity>

          {/* Step 6 */}
          <TouchableOpacity
            style={[styles.stepRow, !step5Completed && { opacity: 0.5 }]}
            activeOpacity={step5Completed ? 0.7 : 1}
            onPress={() => handleStepPress(6, "/vendor/complete-profile/step-6")}
          >
            <View
              style={[
                styles.stepNumberCircle,
                { backgroundColor: step6Completed ? "#10B98115" : "#64748B12" },
              ]}
            >
              <Ionicons
                name="briefcase"
                size={18}
                color={step6Completed ? "#10B981" : "#64748B"}
              />
            </View>
            <View style={styles.stepInfo}>
              <Text style={styles.stepTitle}>Personal & Work Background</Text>
              <Text style={styles.stepSub}>
                {step6Completed
                  ? "Education, marital status & app details completed"
                  : "Specify education, marital status & other app work"}
              </Text>
            </View>
            {step6Completed ? (
              <Ionicons name="lock-closed" size={16} color="#10B981" />
            ) : step5Completed ? (
              <Ionicons name="chevron-forward" size={16} color="#2563EB" />
            ) : (
              <Ionicons name="lock-closed-outline" size={16} color="#94A3B8" />
            )}
          </TouchableOpacity>
        </View>

        {/* Primary Action Button */}
        <TouchableOpacity
          style={styles.startBtn}
          activeOpacity={0.88}
          onPress={() => router.push(nextRoute as any)}
        >
          <LinearGradient
            colors={["#1E3A8A", "#2563EB"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.startBtnGradient}
          >
            <Ionicons name="sparkles" size={18} color="#FFFFFF" />
            <Text style={styles.startBtnText}>{buttonTitle}</Text>
            <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
          </LinearGradient>
        </TouchableOpacity>

        <View style={{ height: 30 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  introSafeArea: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  ambientTopGlow: {
    position: "absolute",
    top: -60,
    left: -60,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: "#2563EB15",
  },
  ambientRightGlow: {
    position: "absolute",
    top: 140,
    right: -60,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: "#10B98110",
  },
  introHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  partnerBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#EFF6FF",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: "#DBEAFE",
  },
  partnerBadgeText: {
    fontSize: 10.5,
    fontWeight: "800",
    color: "#2563EB",
    letterSpacing: 0.5,
  },
  progressPillTop: {
    backgroundColor: "#F8FAFC",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  progressPillTextTop: {
    fontSize: 11,
    fontWeight: "700",
    color: "#475569",
  },
  introScrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
  },
  taskyHeroCard: {
    alignItems: "center",
    marginVertical: Spacing.xs,
  },
  taskyImageWrapper: {
    width: 110,
    height: 110,
    justifyContent: "center",
    alignItems: "center",
  },
  taskyHeroImage: {
    width: "100%",
    height: "100%",
  },
  onlinePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#ECFDF5",
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: "#A7F3D0",
    marginTop: -8,
  },
  onlineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#10B981",
  },
  onlineText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#059669",
  },
  speechCard: {
    backgroundColor: "#F8FAFC",
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    marginTop: Spacing.sm,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    ...Shadows.sm,
  },
  speechHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
  },
  sparkleIconBox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#2563EB",
    justifyContent: "center",
    alignItems: "center",
  },
  speechTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0F172A",
  },
  progressOverviewCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    marginTop: Spacing.sm,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    ...Shadows.sm,
  },
  progressHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  progressOverviewTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#0F172A",
  },
  progressOverviewPercent: {
    fontSize: 12,
    fontWeight: "700",
    color: "#2563EB",
  },
  progressBarTrack: {
    height: 6,
    backgroundColor: "#E2E8F0",
    borderRadius: 3,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: "#2563EB",
    borderRadius: 3,
  },
  roadmapCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    marginTop: Spacing.sm,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    ...Shadows.sm,
  },
  roadmapHeading: {
    fontSize: 13,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: Spacing.sm,
  },
  stepRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  stepNumberCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  stepInfo: {
    flex: 1,
    paddingRight: 6,
  },
  stepTitle: {
    fontSize: 12.5,
    fontWeight: "700",
    color: "#1E293B",
  },
  stepSub: {
    fontSize: 10.5,
    color: "#64748B",
    marginTop: 1.5,
  },
  startBtn: {
    marginTop: Spacing.md,
    borderRadius: BorderRadius.lg,
    overflow: "hidden",
    ...Shadows.md,
  },
  startBtnGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
  },
  startBtnText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#FFFFFF",
  },
});
