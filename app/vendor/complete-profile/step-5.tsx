import { localizedToast } from "@/lib/i18n/localized-toast";
import AppText from "@/components/common/AppText";
import Input from "@/components/Input";
import Colors from "@/constants/Colors";
import { BorderRadius, Spacing } from "@/constants/Styles";
import { useSession } from "@/context/ctx";
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
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

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
    if (!ref1.name.trim()) {
      localizedToast({ type: "error", text1: "Reference 1 Required", text2: "Please enter the full name for Reference 1." });
      return;
    }
    if (!ref1.phone.trim() || ref1.phone.trim().length < 10) {
      localizedToast({ type: "error", text1: "Reference 1 Phone", text2: "Please enter a valid phone number for Reference 1." });
      return;
    }

    if (!ref2.name.trim()) {
      localizedToast({ type: "error", text1: "Reference 2 Required", text2: "Please enter the full name for Reference 2." });
      return;
    }
    if (!ref2.phone.trim() || ref2.phone.trim().length < 10) {
      localizedToast({ type: "error", text1: "Reference 2 Phone", text2: "Please enter a valid phone number for Reference 2." });
      return;
    }

    if (ref1.phone.trim() === ref2.phone.trim()) {
      localizedToast({ type: "error", text1: "Duplicate Phone Numbers", text2: "Reference 1 and Reference 2 must have different phone numbers." });
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

        localizedToast({
          type: "success",
          text1: "References Saved",
          text2: "Proceeding to background details.",
        });

        router.push("/vendor/complete-profile/step-6" as any);
      }
    } catch (error: any) {
      console.warn("[Step5References] Error saving references:", error?.response?.data || error?.message);
      localizedToast({
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
      <View style={styles.header}>
        <TouchableOpacity
          onPress={handleLogout}
          style={styles.logoutBtn}
          activeOpacity={0.7}
        >
          <Ionicons name="log-out-outline" size={16} color="#DC2626" />
          <AppText style={styles.logoutBtnText}>Logout</AppText>
        </TouchableOpacity>
        <AppText style={styles.headerTitle}>Reference Contacts</AppText>
        <View style={styles.stepBadge}>
          <AppText style={styles.stepBadgeText}>Step 4 of 5</AppText>
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
            <AppText style={styles.heading}>Reference Contacts</AppText>
            <AppText style={styles.subtitle}>
              Please provide 2 family or emergency reference contacts.
            </AppText>
          </View>

          {/* Reference 1 Card */}
          <View style={styles.refCard}>
            <View style={styles.refCardHeader}>
              <View style={styles.refBadge}>
                <Ionicons name="person" size={13} color="#1E3A8A" />
                <AppText style={styles.refBadgeText}>Reference 1 (Primary)</AppText>
              </View>
            </View>

            <Input
              label="Full Name *"
              placeholder="e.g. Muhammad Aslam"
              value={ref1.name}
              onChangeText={(text) => setRef1((prev) => ({ ...prev, name: text }))}
              leftIcon={<Ionicons name="person-outline" size={16} color="#64748B" />}
            />

            <AppText style={styles.fieldLabel}>Relationship *</AppText>
            <TouchableOpacity
              style={styles.selectTrigger}
              onPress={() => setPickerRef1Visible(true)}
              activeOpacity={0.75}
            >
              <View style={styles.selectTriggerContent}>
                <Ionicons name="people-outline" size={16} color="#1E3A8A" />
                <AppText style={styles.selectTriggerValue}>{ref1.relation || "Select Relationship"}</AppText>
              </View>
              <Ionicons name="chevron-down" size={15} color="#64748B" />
            </TouchableOpacity>

            <View style={{ marginTop: 10 }}>
              <Input
                label="Mobile Phone Number *"
                placeholder="03001234567"
                value={ref1.phone}
                onChangeText={(text) => setRef1((prev) => ({ ...prev, phone: formatPhone(text) }))}
                keyboardType="phone-pad"
                leftIcon={<Ionicons name="call-outline" size={16} color="#64748B" />}
              />
            </View>
          </View>

          {/* Reference 2 Card */}
          <View style={styles.refCard}>
            <View style={styles.refCardHeader}>
              <View style={[styles.refBadge, { backgroundColor: "#ECFDF5", borderColor: "#A7F3D0" }]}>
                <Ionicons name="person" size={13} color="#059669" />
                <AppText style={[styles.refBadgeText, { color: "#059669" }]}>Reference 2 (Secondary)</AppText>
              </View>
            </View>

            <Input
              label="Full Name *"
              placeholder="e.g. Tariq Mehmood"
              value={ref2.name}
              onChangeText={(text) => setRef2((prev) => ({ ...prev, name: text }))}
              leftIcon={<Ionicons name="person-outline" size={16} color="#64748B" />}
            />

            <AppText style={styles.fieldLabel}>Relationship *</AppText>
            <TouchableOpacity
              style={styles.selectTrigger}
              onPress={() => setPickerRef2Visible(true)}
              activeOpacity={0.75}
            >
              <View style={styles.selectTriggerContent}>
                <Ionicons name="people-outline" size={16} color="#059669" />
                <AppText style={styles.selectTriggerValue}>{ref2.relation || "Select Relationship"}</AppText>
              </View>
              <Ionicons name="chevron-down" size={15} color="#64748B" />
            </TouchableOpacity>

            <View style={{ marginTop: 10 }}>
              <Input
                label="Mobile Phone Number *"
                placeholder="03121234567"
                value={ref2.phone}
                onChangeText={(text) => setRef2((prev) => ({ ...prev, phone: formatPhone(text) }))}
                keyboardType="phone-pad"
                leftIcon={<Ionicons name="call-outline" size={16} color="#64748B" />}
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
                  <AppText style={styles.submitBtnText}>Save & Continue</AppText>
                  <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Reference 1 Relationship Picker Modal */}
      <OptionPickerModal
        visible={pickerRef1Visible}
        title="Select Relationship"
        options={RELATION_OPTIONS}
        selectedValue={ref1.relation}
        onSelect={(val) => setRef1((prev) => ({ ...prev, relation: val }))}
        onClose={() => setPickerRef1Visible(false)}
      />

      {/* Reference 2 Relationship Picker Modal */}
      <OptionPickerModal
        visible={pickerRef2Visible}
        title="Select Relationship"
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
  refCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  refCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  refBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#EFF6FF",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: "#DBEAFE",
  },
  refBadgeText: {
    fontSize: 10.5,
    fontWeight: "600",
    color: "#1E3A8A",
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: "500",
    color: "#334155",
    marginBottom: 4,
    marginTop: 6,
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
