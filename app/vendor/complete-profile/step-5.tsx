import Input from "@/components/Input";
import Colors from "@/constants/Colors";
import { BorderRadius, Shadows, Spacing } from "@/constants/Styles";
import { useSession } from "@/context/ctx";
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
  Text,
  TouchableOpacity,
  View,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";

const RELATION_OPTIONS = [
  "Brother",
  "Sister",
  "Father",
  "Mother",
  "Husband",
  "Wife",
  "Son",
  "Daughter",
  "Uncle",
  "Other",
];

interface ReferenceData {
  name: string;
  relation: string;
  phone: string;
}

export default function Step5References() {
  const router = useRouter();
  const { session, refetchUser } = useSession();
  const user = session.vendorUser as any;

  // Step guard: ensure step 4 (live selfie) is completed
  const hasSelfie = Boolean(user?.profile_image);

  // Initialize from DB if already filled
  const existingRefs: ReferenceData[] = Array.isArray(user?.references) && user.references.length >= 2
    ? user.references
    : [
        { name: user?.references?.[0]?.name || "", relation: user?.references?.[0]?.relation || "Brother", phone: user?.references?.[0]?.phone || "" },
        { name: user?.references?.[1]?.name || "", relation: user?.references?.[1]?.relation || "Father", phone: user?.references?.[1]?.phone || "" },
      ];

  const [ref1, setRef1] = useState<ReferenceData>(existingRefs[0]);
  const [ref2, setRef2] = useState<ReferenceData>(existingRefs[1]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pickerRef1Visible, setPickerRef1Visible] = useState(false);
  const [pickerRef2Visible, setPickerRef2Visible] = useState(false);

  // Phone input formatter
  const formatPhone = (val: string) => {
    return val.replace(/[^\d+]/g, "").slice(0, 15);
  };

  const handleSubmit = async () => {
    // Validation
    if (!ref1.name.trim()) {
      Toast.show({ type: "error", text1: "Reference 1 Required", text2: "Please enter the full name for Reference 1." });
      return;
    }
    if (!ref1.phone.trim() || ref1.phone.trim().length < 10) {
      Toast.show({ type: "error", text1: "Reference 1 Phone", text2: "Please enter a valid phone number for Reference 1." });
      return;
    }

    if (!ref2.name.trim()) {
      Toast.show({ type: "error", text1: "Reference 2 Required", text2: "Please enter the full name for Reference 2." });
      return;
    }
    if (!ref2.phone.trim() || ref2.phone.trim().length < 10) {
      Toast.show({ type: "error", text1: "Reference 2 Phone", text2: "Please enter a valid phone number for Reference 2." });
      return;
    }

    if (ref1.phone.trim() === ref2.phone.trim()) {
      Toast.show({ type: "error", text1: "Duplicate Phone Numbers", text2: "Reference 1 and Reference 2 must have different phone numbers." });
      return;
    }

    try {
      setIsSubmitting(true);
      try {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } catch (_) {}

      const payload = {
        references: [
          { name: ref1.name.trim(), relation: ref1.relation, phone: ref1.phone.trim() },
          { name: ref2.name.trim(), relation: ref2.relation, phone: ref2.phone.trim() },
        ],
      };

      const res = await myAxios.post(VENDOR_UPDATE_PROFILE_URL, payload);

      if (res.data?.status === "success") {
        try {
          await refetchUser("vendor");
        } catch (_) {}

        try {
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch (_) {}

        Toast.show({
          type: "success",
          text1: "✨ References Saved!",
          text2: "Proceeding to final background details.",
        });

        router.push("/vendor/complete-profile/step-6" as any);
      }
    } catch (error: any) {
      console.warn("[Step5References] Error saving references:", error?.response?.data || error?.message);
      Toast.show({
        type: "error",
        text1: "Failed to Save References",
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
        <Text style={styles.headerTitle}>Reference Contacts</Text>
        <View style={styles.stepIndicatorPill}>
          <Text style={styles.stepIndicatorText}>Step 5 of 6</Text>
        </View>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressStickyBar}>
        <View style={styles.progressLabelRow}>
          <Text style={styles.progressStatusLabel}>2 Reference Contacts</Text>
          <Text style={styles.progressPercentLabel}>83% Complete</Text>
        </View>
        <View style={styles.progressBarTrack}>
          <View style={[styles.progressBarFill, { width: "83%" }]} />
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
              <Ionicons name="shield-checkmark" size={10} color="#2563EB" />
              <Text style={styles.aiBadgeText}>Security Verification</Text>
            </View>
          </View>
          <TaskyTypewriterText
            text="Please provide 2 reference contacts (such as your brother, sister, father, mother, or spouse) for verification."
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
          {/* Reference 1 Card */}
          <View style={styles.refCard}>
            <View style={styles.refCardHeader}>
              <View style={styles.refBadge}>
                <Ionicons name="person" size={14} color="#2563EB" />
                <Text style={styles.refBadgeText}>REFERENCE 1 (PRIMARY)</Text>
              </View>
            </View>

            <Input
              label="Full Name *"
              placeholder="e.g. Muhammad Aslam"
              value={ref1.name}
              onChangeText={(text) => setRef1((prev) => ({ ...prev, name: text }))}
              leftIcon={<Ionicons name="person-outline" size={18} color="#64748B" />}
            />

            <Text style={styles.fieldLabel}>Relationship *</Text>
            <TouchableOpacity
              style={styles.selectTrigger}
              onPress={() => setPickerRef1Visible(true)}
              activeOpacity={0.75}
            >
              <View style={styles.selectTriggerContent}>
                <Ionicons name="people-outline" size={18} color="#2563EB" />
                <Text style={styles.selectTriggerValue}>{ref1.relation || "Select Relationship"}</Text>
              </View>
              <Ionicons name="chevron-down" size={18} color="#64748B" />
            </TouchableOpacity>

            <View style={{ marginTop: Spacing.md }}>
              <Input
                label="Mobile Phone Number *"
                placeholder="03001234567"
                value={ref1.phone}
                onChangeText={(text) => setRef1((prev) => ({ ...prev, phone: formatPhone(text) }))}
                keyboardType="phone-pad"
                leftIcon={<Ionicons name="call-outline" size={18} color="#64748B" />}
              />
            </View>
          </View>

          {/* Reference 2 Card */}
          <View style={styles.refCard}>
            <View style={styles.refCardHeader}>
              <View style={[styles.refBadge, { backgroundColor: "rgba(16, 185, 129, 0.1)", borderColor: "rgba(16, 185, 129, 0.25)" }]}>
                <Ionicons name="person" size={14} color="#10B981" />
                <Text style={[styles.refBadgeText, { color: "#10B981" }]}>REFERENCE 2 (SECONDARY)</Text>
              </View>
            </View>

            <Input
              label="Full Name *"
              placeholder="e.g. Tariq Mehmood"
              value={ref2.name}
              onChangeText={(text) => setRef2((prev) => ({ ...prev, name: text }))}
              leftIcon={<Ionicons name="person-outline" size={18} color="#64748B" />}
            />

            <Text style={styles.fieldLabel}>Relationship *</Text>
            <TouchableOpacity
              style={styles.selectTrigger}
              onPress={() => setPickerRef2Visible(true)}
              activeOpacity={0.75}
            >
              <View style={styles.selectTriggerContent}>
                <Ionicons name="people-outline" size={18} color="#10B981" />
                <Text style={styles.selectTriggerValue}>{ref2.relation || "Select Relationship"}</Text>
              </View>
              <Ionicons name="chevron-down" size={18} color="#64748B" />
            </TouchableOpacity>

            <View style={{ marginTop: Spacing.md }}>
              <Input
                label="Mobile Phone Number *"
                placeholder="03121234567"
                value={ref2.phone}
                onChangeText={(text) => setRef2((prev) => ({ ...prev, phone: formatPhone(text) }))}
                keyboardType="phone-pad"
                leftIcon={<Ionicons name="call-outline" size={18} color="#64748B" />}
              />
            </View>
          </View>

          {/* Action Button */}
          <TouchableOpacity
            style={[styles.submitBtn, isSubmitting && styles.submitBtnDisabled]}
            onPress={handleSubmit}
            disabled={isSubmitting}
            activeOpacity={0.88}
          >
            <LinearGradient
              colors={["#1E3A8A", "#2563EB"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.submitGradient}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <>
                  <Text style={styles.submitBtnText}>Save & Continue to Step 6</Text>
                  <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Reference 1 Relationship Picker Modal */}
      <OptionPickerModal
        visible={pickerRef1Visible}
        title="Select Reference 1 Relationship"
        options={RELATION_OPTIONS}
        selectedValue={ref1.relation}
        onSelect={(val) => setRef1((prev) => ({ ...prev, relation: val }))}
        onClose={() => setPickerRef1Visible(false)}
      />

      {/* Reference 2 Relationship Picker Modal */}
      <OptionPickerModal
        visible={pickerRef2Visible}
        title="Select Reference 2 Relationship"
        options={RELATION_OPTIONS}
        selectedValue={ref2.relation}
        onSelect={(val) => setRef2((prev) => ({ ...prev, relation: val }))}
        onClose={() => setPickerRef2Visible(false)}
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
    color: "#2563EB",
  },
  progressBarTrack: {
    height: 4,
    backgroundColor: "#E2E8F0",
    borderRadius: 2,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: "#2563EB",
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
  refCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    ...Shadows.sm,
  },
  refCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  refBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(37, 99, 235, 0.08)",
    paddingHorizontal: 9,
    paddingVertical: 3.5,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: "rgba(37, 99, 235, 0.2)",
  },
  refBadgeText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#2563EB",
    letterSpacing: 0.5,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#334155",
    marginBottom: 6,
    marginTop: 4,
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
