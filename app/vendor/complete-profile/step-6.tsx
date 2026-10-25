import { localizedToast } from "@/lib/i18n/localized-toast";
import AppText from "@/components/common/AppText";
import Input from "@/components/Input";
import Colors from "@/constants/Colors";
import { BorderRadius, Spacing } from "@/constants/Styles";
import { useSession } from "@/context/ctx";
import { useAuthStore } from "@/context/auth-store";
import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import OptionPickerModal from "@/components/vendor/OptionPickerModal";
import myAxios from "@/lib/axios.config";
import { VENDOR_UPDATE_PROFILE_URL } from "@/lib/api-endpoints";
import * as Haptics from "expo-haptics";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

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
  const { session, refetchUser, signOutMode } = useSession();
  const user = session.vendorUser as any;

  const handleLogout = () => {
    Alert.alert("Log Out", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Log Out",
        style: "destructive",
        onPress: async () => {
          try {
            await signOutMode("vendor");
          } catch (_) {}
          router.replace("/vendor/login" as any);
        },
      },
    ]);
  };

  const [education, setEducation] = useState<string>(user?.education || "Matric (10th)");
  const [maritalStatus, setMaritalStatus] = useState<string>(user?.marital_status || "Single");
  const [isWorkingOtherApps, setIsWorkingOtherApps] = useState<boolean>(Boolean(user?.is_working_with_other_apps));
  const [otherAppsNames, setOtherAppsNames] = useState<string>(user?.other_apps_names || "");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [educationPickerVisible, setEducationPickerVisible] = useState(false);
  const [maritalPickerVisible, setMaritalPickerVisible] = useState(false);

  const handleFinish = async () => {
    if (!education) {
      localizedToast({ type: "error", text1: "Education Required", text2: "Please select your highest education level." });
      return;
    }
    if (!maritalStatus) {
      localizedToast({ type: "error", text1: "Marital Status Required", text2: "Please select your marital status." });
      return;
    }

    if (isWorkingOtherApps && !otherAppsNames.trim()) {
      localizedToast({ type: "error", text1: "App Names Required", text2: "Please enter the names of the other apps/platforms you work with." });
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
          localizedToast({
            type: "success",
            text1: "Profile Completed & Active!",
            text2: "Welcome to Tasker Partner Dashboard.",
            visibilityTime: 4000,
          });
          router.replace("/vendor/(tabs)" as any);
        } else {
          localizedToast({
            type: "success",
            text1: "Profile Submitted for Review!",
            text2: "Your details have been submitted. Account is now under review.",
            visibilityTime: 4000,
          });
          router.replace("/vendor/pending-approval" as any);
        }
      }
    } catch (error: any) {
      console.warn("[Step6BackgroundInfo] Submit error:", error?.response?.data || error?.message);
      localizedToast({
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
      <View style={styles.header}>
        <TouchableOpacity
          onPress={handleLogout}
          style={styles.logoutBtn}
          activeOpacity={0.7}
        >
          <Ionicons name="log-out-outline" size={16} color="#DC2626" />
          <AppText style={styles.logoutBtnText}>Logout</AppText>
        </TouchableOpacity>
        <AppText style={styles.headerTitle}>Work & Education</AppText>
        <View style={styles.stepBadge}>
          <AppText style={styles.stepBadgeText}>Step 5 of 5</AppText>
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
          <View style={styles.introBox}>
            <AppText style={styles.heading}>Work & Education</AppText>
            <AppText style={styles.subtitle}>
              Confirm your educational background and work preferences.
            </AppText>
          </View>

          {/* Education Card */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Ionicons name="school-outline" size={16} color="#1E3A8A" />
              <AppText style={styles.sectionTitle}>Highest Education Level *</AppText>
            </View>

            <TouchableOpacity
              style={styles.selectTrigger}
              onPress={() => setEducationPickerVisible(true)}
              activeOpacity={0.75}
            >
              <View style={styles.selectTriggerContent}>
                <Ionicons name="school-outline" size={16} color="#1E3A8A" />
                <AppText style={styles.selectTriggerValue}>{education || "Select Education"}</AppText>
              </View>
              <Ionicons name="chevron-down" size={15} color="#64748B" />
            </TouchableOpacity>
          </View>

          {/* Marital Status Card */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Ionicons name="heart-outline" size={16} color="#1E3A8A" />
              <AppText style={styles.sectionTitle}>Marital Status *</AppText>
            </View>

            <TouchableOpacity
              style={styles.selectTrigger}
              onPress={() => setMaritalPickerVisible(true)}
              activeOpacity={0.75}
            >
              <View style={styles.selectTriggerContent}>
                <Ionicons name="heart-outline" size={16} color="#1E3A8A" />
                <AppText style={styles.selectTriggerValue}>{maritalStatus || "Select Marital Status"}</AppText>
              </View>
              <Ionicons name="chevron-down" size={15} color="#64748B" />
            </TouchableOpacity>
          </View>

          {/* Other Apps Card */}
          <View style={styles.sectionCard}>
            <View style={styles.switchRow}>
              <View style={{ flex: 1, paddingRight: Spacing.sm }}>
                <AppText style={styles.switchTitle}>Currently working with any other apps?</AppText>
                <AppText style={styles.switchSub}>e.g. Delivery, ride-hailing or technician platforms</AppText>
              </View>
              <Switch
                value={isWorkingOtherApps}
                onValueChange={(val) => {
                  setIsWorkingOtherApps(val);
                  if (!val) setOtherAppsNames("");
                }}
                trackColor={{ false: "#CBD5E1", true: "#93C5FD" }}
                thumbColor={isWorkingOtherApps ? "#1E3A8A" : "#F8FAFC"}
              />
            </View>

            {isWorkingOtherApps && (
              <View style={styles.otherAppsBox}>
                <Input
                  label="App Names (Comma Separated) *"
                  placeholder="e.g. InDrive, Bykea, Foodpanda"
                  value={otherAppsNames}
                  onChangeText={setOtherAppsNames}
                  leftIcon={<Ionicons name="grid-outline" size={16} color="#64748B" />}
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
                  <Ionicons name="checkmark-done-circle" size={18} color="#FFFFFF" />
                  <AppText style={styles.submitBtnText}>Complete & Submit Profile</AppText>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
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
  header: {
    paddingHorizontal: 12,
    height: 46,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderRadius: 6,
    backgroundColor: "#FEF2F2",
  },
  logoutBtnText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#DC2626",
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: Colors.text.primary,
  },
  stepBadge: {
    backgroundColor: "#EFF6FF",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  stepBadgeText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#2563EB",
  },
  scrollContent: {
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: Spacing.xl,
  },
  introBox: {
    marginBottom: 12,
  },
  heading: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.text.primary,
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 12,
    color: Colors.text.secondary,
    lineHeight: 16,
  },
  sectionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#0F172A",
  },
  selectTrigger: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 8,
    paddingHorizontal: 10,
    height: 39,
  },
  selectTriggerContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  selectTriggerValue: {
    fontSize: 13,
    fontWeight: "500",
    color: "#0F172A",
  },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  switchTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#0F172A",
  },
  switchSub: {
    fontSize: 11,
    color: "#64748B",
    marginTop: 1,
  },
  otherAppsBox: {
    marginTop: 8,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
  },
  submitBtn: {
    marginTop: 6,
    borderRadius: 10,
    overflow: "hidden",
    elevation: 1,
  },
  submitBtnDisabled: {
    opacity: 0.6,
  },
  submitGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
  },
  submitBtnText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
  },
});
