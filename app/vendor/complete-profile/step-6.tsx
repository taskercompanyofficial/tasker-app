import Input from "@/components/Input";
import Colors from "@/constants/Colors";
import { BorderRadius, Shadows, Spacing } from "@/constants/Styles";
import { useSession } from "@/context/ctx";
import { useAuthStore } from "@/context/auth-store";
import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import TaskyTypewriterText from "@/components/vendor/TaskyTypewriterText";
import OptionPickerModal from "@/components/vendor/OptionPickerModal";
import myAxios from "@/lib/axios.config";
import { VENDOR_UPDATE_PROFILE_URL } from "@/lib/api-endpoints";
import * as Haptics from "expo-haptics";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";

const EDUCATION_OPTIONS = [
  "Under-Matric",
  "Matric (10th)",
  "Intermediate (12th)",
  "Bachelors / Graduate",
  "Masters / Postgraduate",
  "Technical Diploma / DAE",
  "Other",
];

const MARITAL_STATUS_OPTIONS = [
  "Single",
  "Married",
  "Divorced",
  "Widowed",
];

export default function Step6BackgroundInfo() {
  const router = useRouter();
  const { session, refetchUser } = useSession();
  const user = session.vendorUser as any;

  const [education, setEducation] = useState<string>(user?.education || "Matric (10th)");
  const [maritalStatus, setMaritalStatus] = useState<string>(user?.marital_status || "Single");
  const [isWorkingOtherApps, setIsWorkingOtherApps] = useState<boolean>(Boolean(user?.is_working_with_other_apps));
  const [otherAppsNames, setOtherAppsNames] = useState<string>(user?.other_apps_names || "");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [educationPickerVisible, setEducationPickerVisible] = useState(false);
  const [maritalPickerVisible, setMaritalPickerVisible] = useState(false);

  const handleFinish = async () => {
    if (!education) {
      Toast.show({ type: "error", text1: "Education Required", text2: "Please select your highest education level." });
      return;
    }
    if (!maritalStatus) {
      Toast.show({ type: "error", text1: "Marital Status Required", text2: "Please select your marital status." });
      return;
    }

    if (isWorkingOtherApps && !otherAppsNames.trim()) {
      Toast.show({ type: "error", text1: "App Names Required", text2: "Please enter the names of the other apps/platforms you work with." });
      return;
    }

    try {
      setIsSubmitting(true);
      try {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      } catch (_) {}

      const payload = {
        education,
        marital_status: maritalStatus,
        is_working_with_other_apps: isWorkingOtherApps,
        other_apps_names: isWorkingOtherApps ? otherAppsNames.trim() : null,
      };

      const res = await myAxios.post(VENDOR_UPDATE_PROFILE_URL, payload);

      if (res.data?.status === "success") {
        try {
          await refetchUser("vendor");
        } catch (_) {}

        try {
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch (_) {}

        const currentVendor = useAuthStore.getState().vendorUser as any;
        const vendorStatus = currentVendor?.status || res.data?.data?.status || res.data?.user?.status;

        if (vendorStatus === "active") {
          Toast.show({
            type: "success",
            text1: "🎉 Profile Completed & Active!",
            text2: "Welcome to Tasker Partner Dashboard.",
            visibilityTime: 4000,
          });
          router.replace("/vendor/(tabs)" as any);
        } else {
          Toast.show({
            type: "success",
            text1: "🎉 Profile Submitted for Review!",
            text2: "Your details have been submitted. Account is now under review.",
            visibilityTime: 4000,
          });
          router.replace("/vendor/pending-approval" as any);
        }
      }
    } catch (error: any) {
      console.warn("[Step6BackgroundInfo] Submit error:", error?.response?.data || error?.message);
      Toast.show({
        type: "error",
        text1: "Submission Failed",
        text2: error?.response?.data?.message || "Please check your inputs and try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={styles.customHeader}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backBtn}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={20} color={Colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Personal & Work Background</Text>
        <View style={styles.stepIndicatorPill}>
          <Text style={styles.stepIndicatorText}>Step 6 of 6</Text>
        </View>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressStickyBar}>
        <View style={styles.progressLabelRow}>
          <Text style={styles.progressStatusLabel}>Final Step: Education & Work Background</Text>
          <Text style={styles.progressPercentLabel}>100% Final Step</Text>
        </View>
        <View style={styles.progressBarTrack}>
          <View style={[styles.progressBarFill, { width: "100%" }]} />
        </View>
      </View>

      {/* Conversational Bubble */}
      <View style={styles.conversationalSpeechBar}>
        <Image
          source={require("@/assets/images/tasky-ai-clipboard.png")}
          style={styles.conversationalAvatar}
          resizeMode="contain"
        />
        <View style={styles.conversationalContent}>
          <View style={styles.taskyNameRow}>
            <Text style={styles.taskyNameLabel}>Tasky Assistant</Text>
            <View style={styles.aiBadgePill}>
              <Ionicons name="sparkles" size={10} color="#2563EB" />
              <Text style={styles.aiBadgeText}>Final Details</Text>
            </View>
          </View>
          <TaskyTypewriterText
            text="Almost done! Tell us a bit about your education, marital status, and whether you currently work with any other apps."
            speedMs={15}
          />
        </View>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Education Card */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Ionicons name="school-outline" size={18} color="#2563EB" />
              <Text style={styles.sectionTitle}>Highest Education Level *</Text>
            </View>

            <TouchableOpacity
              style={styles.selectTrigger}
              onPress={() => setEducationPickerVisible(true)}
              activeOpacity={0.75}
            >
              <View style={styles.selectTriggerContent}>
                <Ionicons name="school-outline" size={18} color="#2563EB" />
                <Text style={styles.selectTriggerValue}>{education || "Select Education"}</Text>
              </View>
              <Ionicons name="chevron-down" size={18} color="#64748B" />
            </TouchableOpacity>
          </View>

          {/* Marital Status Card */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Ionicons name="heart-outline" size={18} color="#EC4899" />
              <Text style={styles.sectionTitle}>Marital Status *</Text>
            </View>

            <TouchableOpacity
              style={styles.selectTrigger}
              onPress={() => setMaritalPickerVisible(true)}
              activeOpacity={0.75}
            >
              <View style={styles.selectTriggerContent}>
                <Ionicons name="heart-outline" size={18} color="#EC4899" />
                <Text style={styles.selectTriggerValue}>{maritalStatus || "Select Marital Status"}</Text>
              </View>
              <Ionicons name="chevron-down" size={18} color="#64748B" />
            </TouchableOpacity>
          </View>

          {/* Other Apps Card */}
          <View style={styles.sectionCard}>
            <View style={styles.switchRow}>
              <View style={{ flex: 1, paddingRight: Spacing.sm }}>
                <Text style={styles.switchTitle}>Currently working with any other apps?</Text>
                <Text style={styles.switchSub}>e.g. Delivery, ride-hailing or technician platforms</Text>
              </View>
              <Switch
                value={isWorkingOtherApps}
                onValueChange={(val) => {
                  setIsWorkingOtherApps(val);
                  if (!val) setOtherAppsNames("");
                }}
                trackColor={{ false: "#CBD5E1", true: "#93C5FD" }}
                thumbColor={isWorkingOtherApps ? "#2563EB" : "#F8FAFC"}
              />
            </View>

            {isWorkingOtherApps && (
              <View style={styles.otherAppsBox}>
                <Input
                  label="App Names (Comma Separated) *"
                  placeholder="e.g. InDrive, Bykea, Foodpanda"
                  value={otherAppsNames}
                  onChangeText={setOtherAppsNames}
                  leftIcon={<Ionicons name="grid-outline" size={18} color="#64748B" />}
                />
              </View>
            )}
          </View>

          {/* Finish & Activate Button */}
          <TouchableOpacity
            style={[styles.submitBtn, isSubmitting && styles.submitBtnDisabled]}
            onPress={handleFinish}
            disabled={isSubmitting}
            activeOpacity={0.88}
          >
            <LinearGradient
              colors={["#059669", "#10B981"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.submitGradient}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <>
                  <Ionicons name="checkmark-done-circle" size={20} color="#FFFFFF" />
                  <Text style={styles.submitBtnText}>Complete & Activate Profile</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Education Picker Modal */}
      <OptionPickerModal
        visible={educationPickerVisible}
        title="Select Education Level"
        options={EDUCATION_OPTIONS}
        selectedValue={education}
        onSelect={(val) => setEducation(val)}
        onClose={() => setEducationPickerVisible(false)}
      />

      {/* Marital Status Picker Modal */}
      <OptionPickerModal
        visible={maritalPickerVisible}
        title="Select Marital Status"
        options={MARITAL_STATUS_OPTIONS}
        selectedValue={maritalStatus}
        onSelect={(val) => setMaritalStatus(val)}
        onClose={() => setMaritalPickerVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  customHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F1F5F9",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0F172A",
  },
  stepIndicatorPill: {
    backgroundColor: "#EFF6FF",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: "#DBEAFE",
  },
  stepIndicatorText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#2563EB",
  },
  progressStickyBar: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  progressLabelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  progressStatusLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "#64748B",
  },
  progressPercentLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#10B981",
  },
  progressBarTrack: {
    height: 4,
    backgroundColor: "#E2E8F0",
    borderRadius: 2,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: "#10B981",
    borderRadius: 2,
  },
  conversationalSpeechBar: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#FFFFFF",
    marginHorizontal: Spacing.md,
    marginTop: Spacing.sm,
    padding: Spacing.sm,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    ...Shadows.sm,
  },
  conversationalAvatar: {
    width: 44,
    height: 44,
    marginRight: Spacing.sm,
  },
  conversationalContent: {
    flex: 1,
  },
  taskyNameRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 3,
  },
  taskyNameLabel: {
    fontSize: 12,
    fontWeight: "800",
    color: "#0F172A",
  },
  aiBadgePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#EFF6FF",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  aiBadgeText: {
    fontSize: 9,
    fontWeight: "700",
    color: "#2563EB",
  },
  scrollContent: {
    padding: Spacing.md,
  },
  sectionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    ...Shadows.sm,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: Spacing.sm,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0F172A",
  },
  selectTrigger: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#F8FAFC",
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    borderRadius: BorderRadius.lg,
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  selectTriggerContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  selectTriggerValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#0F172A",
  },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  switchTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0F172A",
  },
  switchSub: {
    fontSize: 11,
    color: "#64748B",
    marginTop: 2,
  },
  otherAppsBox: {
    marginTop: Spacing.md,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
  },
  submitBtn: {
    marginTop: Spacing.sm,
    borderRadius: BorderRadius.lg,
    overflow: "hidden",
    ...Shadows.md,
  },
  submitBtnDisabled: {
    opacity: 0.6,
  },
  submitGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
  },
  submitBtnText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#FFFFFF",
  },
});
