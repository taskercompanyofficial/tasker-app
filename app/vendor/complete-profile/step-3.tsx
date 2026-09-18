import Input from "@/components/Input";
import Colors from "@/constants/Colors";
import { BorderRadius, Shadows, Spacing } from "@/constants/Styles";
import { useSession } from "@/context/ctx";
import useForm from "@/hooks/use-form";
import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import { useRouter } from "expo-router";
import DateTimePicker from "@react-native-community/datetimepicker";
import { LinearGradient } from "expo-linear-gradient";
import TaskyTypewriterText from "@/components/vendor/TaskyTypewriterText";
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

export default function Step3DetailsReview() {
  const router = useRouter();
  const { session, refetchUser } = useSession();
  const user = session.vendorUser;

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State initialized from database record
  const { data, setData, errors, setError } = useForm({
    name: user?.name || user?.first_name || "",
    father_name: (user as any)?.father_name || "",
    cnic: user?.cnic || "",
    dob: user?.dob ? String(user.dob).split("T")[0] : "1995-01-01",
    expiry_date: (user as any)?.expiry_date || "2030-01-01",
    is_lifetime_expiry: false,
    gender: (user as any)?.gender || "Male",
    address: (user as any)?.address || "",
    current_address: (user as any)?.current_address || (user as any)?.address || "",
    _method: "POST",
  });

  const [showDobPicker, setShowDobPicker] = useState(false);
  const [showExpiryPicker, setShowExpiryPicker] = useState(false);

  const formatCnicInput = (text: string) => {
    const cleaned = text.replace(/\D/g, "").slice(0, 13);
    let formatted = cleaned;
    if (cleaned.length > 5 && cleaned.length <= 12) {
      formatted = `${cleaned.slice(0, 5)}-${cleaned.slice(5)}`;
    } else if (cleaned.length > 12) {
      formatted = `${cleaned.slice(0, 5)}-${cleaned.slice(5, 12)}-${cleaned.slice(12, 13)}`;
    }
    setData("cnic", formatted);
  };

  // -------------------------------------------------------------
  // Submit Final Profile & Details
  // -------------------------------------------------------------
  const handleSubmitProfile = async () => {
    if (!data.cnic || data.cnic.length < 15) {
      Toast.show({
        type: "error",
        text1: "Valid CNIC Required",
        text2: "Please enter a valid 13-digit CNIC number (XXXXX-XXXXXXX-X).",
      });
      return;
    }

    if (!data.name || data.name.trim().length === 0) {
      Toast.show({
        type: "error",
        text1: "Full Name Required",
        text2: "Please enter your name as printed on your CNIC.",
      });
      return;
    }

    if (!data.current_address || data.current_address.trim().length === 0) {
      Toast.show({
        type: "error",
        text1: "Current Address Required",
        text2: "Please enter your present residential or shop address.",
      });
      return;
    }

    try {
      setIsSubmitting(true);
      try {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      } catch (_) {}

      const payload = {
        name: data.name,
        cnic: data.cnic,
        dob: data.dob,
        father_name: data.father_name,
        gender: data.gender,
        address: data.address,
        current_address: data.current_address,
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
          text1: "✨ Details Confirmed!",
          text2: "Now let's take a quick live face selfie.",
        });

        router.push("/vendor/complete-profile/step-4" as any);
      }
    } catch (error: any) {
      console.warn("[Step3DetailsReview] Submit error:", error?.response?.data || error?.message);
      const serverErrors = error?.response?.data?.errors;
      if (serverErrors && typeof serverErrors === "object") {
        Object.keys(serverErrors).forEach((key: any) => {
          const msg = Array.isArray(serverErrors[key]) ? serverErrors[key][0] : serverErrors[key];
          setError(key, msg);
        });
      }
      Toast.show({
        type: "error",
        text1: "Submission Failed",
        text2: error?.response?.data?.message || "Please check the form and try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <StatusBar barStyle="dark-content" />

      {/* Top Header */}
      <View style={styles.customHeader}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backBtn}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={20} color={Colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Review CNIC Details</Text>
        <View style={styles.stepIndicatorPill}>
          <Text style={styles.stepIndicatorText}>Step 3 of 6</Text>
        </View>
      </View>

      {/* Sticky Progress Bar */}
      <View style={styles.progressStickyBar}>
        <View style={styles.progressLabelRow}>
          <Text style={styles.progressStatusLabel}>Step 3: Identity Review & Current Address</Text>
          <Text style={styles.progressPercentLabel}>50% Complete</Text>
        </View>
        <View style={styles.progressBarTrack}>
          <View style={[styles.progressBarFill, { width: "50%" }]} />
        </View>
      </View>

      {/* Conversational Bubble */}
      <View style={styles.conversationalSpeechBar}>
        <Image
          source={require("@/assets/images/tasky-ai-clipboard.png")}
          style={styles.conversationalAvatar}
          resizeMode="contain"
        />
        <View style={{ flex: 1 }}>
          <View style={styles.speechBadgeRow}>
            <Text style={styles.speechAssistantName}>Tasky Assistant</Text>
            <Ionicons name="checkmark-circle" size={13} color="#10B981" />
          </View>
          <TaskyTypewriterText
            key="details-step3-speech"
            text="I've fetched your extracted CNIC data from the database. Please verify your details, add your current address, and confirm!"
            speedMs={18}
            style={styles.conversationalSpeechText}
            cursorColor={Colors.themes.provider.primary}
          />
        </View>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.stepSectionContainer}>
            {/* Scanned Mini Cards Pill Row */}
            <View style={styles.scannedPillsRow}>
              <View style={styles.scannedMiniCard}>
                <Ionicons name="card" size={16} color="#10B981" />
                <Text style={styles.scannedMiniText} numberOfLines={1}>
                  CNIC Front: Saved
                </Text>
                <TouchableOpacity onPress={() => router.push("/vendor/complete-profile/step-2" as any)}>
                  <Text style={styles.scannedMiniRescan}>Rescan</Text>
                </TouchableOpacity>
              </View>
              {user?.cnic_back_image && (
                <View style={styles.scannedMiniCard}>
                  <Ionicons name="card" size={16} color="#10B981" />
                  <Text style={styles.scannedMiniText} numberOfLines={1}>
                    CNIC Back: Saved
                  </Text>
                  <TouchableOpacity onPress={() => router.push("/vendor/complete-profile/step-2" as any)}>
                    <Text style={styles.scannedMiniRescan}>Rescan</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* Extracted Details Form Section */}
            <View style={styles.detailsFormCard}>
              <View style={styles.detailsFormHeader}>
                <Ionicons name="sparkles" size={16} color={Colors.themes.provider.primary} />
                <Text style={styles.detailsFormTitle}>Verified Identity Information</Text>
              </View>

              {/* CNIC Number */}
              <Input
                label="CNIC Number (13 Digits)"
                placeholder="35201-1234567-1"
                value={data.cnic}
                onChangeText={formatCnicInput}
                keyboardType="number-pad"
                maxLength={15}
                error={errors.cnic}
                theme="vendor"
                leftIcon={<Ionicons name="finger-print-outline" size={18} color={Colors.themes.provider.primary} />}
              />

              {/* Full Name */}
              <Input
                label="Full Name (as on CNIC)"
                placeholder="e.g. Muhammad Ali"
                value={data.name}
                onChangeText={(text) => setData("name", text)}
                error={errors.name}
                theme="vendor"
                leftIcon={<Ionicons name="person-outline" size={18} color={Colors.themes.provider.primary} />}
              />

              {/* Father Name */}
              <Input
                label="Father / Husband Name"
                placeholder="e.g. Tariq Mahmood"
                value={data.father_name}
                onChangeText={(text) => setData("father_name", text)}
                theme="vendor"
                leftIcon={<Ionicons name="people-outline" size={18} color={Colors.themes.provider.primary} />}
              />

              {/* Date of Birth & Expiry Row */}
              <View style={styles.twoColumnRow}>
                {/* Date of Birth */}
                <View style={{ flex: 1 }}>
                  <TouchableOpacity onPress={() => setShowDobPicker(true)}>
                    <Input
                      label="Date of Birth"
                      value={data.dob}
                      editable={false}
                      theme="vendor"
                      leftIcon={<Ionicons name="calendar-outline" size={18} color={Colors.themes.provider.primary} />}
                    />
                  </TouchableOpacity>
                  {showDobPicker && (
                    <DateTimePicker
                      value={new Date(data.dob || "1995-01-01")}
                      mode="date"
                      display="default"
                      maximumDate={new Date()}
                      onChange={(event, selectedDate) => {
                        setShowDobPicker(false);
                        if (selectedDate) {
                          setData("dob", selectedDate.toISOString().split("T")[0]);
                        }
                      }}
                    />
                  )}
                </View>

                {/* Expiry Date */}
                <View style={{ flex: 1 }}>
                  <TouchableOpacity
                    onPress={() => !data.is_lifetime_expiry && setShowExpiryPicker(true)}
                  >
                    <Input
                      label="Expiry Date"
                      value={data.is_lifetime_expiry ? "Lifetime" : data.expiry_date}
                      editable={false}
                      theme="vendor"
                      leftIcon={<Ionicons name="time-outline" size={18} color={Colors.themes.provider.primary} />}
                    />
                  </TouchableOpacity>
                  {showExpiryPicker && (
                    <DateTimePicker
                      value={new Date(data.expiry_date || "2030-01-01")}
                      mode="date"
                      display="default"
                      onChange={(event, selectedDate) => {
                        setShowExpiryPicker(false);
                        if (selectedDate) {
                          setData("expiry_date", selectedDate.toISOString().split("T")[0]);
                        }
                      }}
                    />
                  )}
                </View>
              </View>

              {/* Gender Selector */}
              <View style={styles.fieldWrapper}>
                <Text style={styles.fieldLabel}>Gender</Text>
                <View style={styles.genderRow}>
                  {["Male", "Female"].map((g) => (
                    <TouchableOpacity
                      key={g}
                      style={[
                        styles.genderBtn,
                        data.gender?.toLowerCase() === g.toLowerCase() && styles.genderBtnActive,
                      ]}
                      onPress={() => setData("gender", g)}
                      activeOpacity={0.8}
                    >
                      <Ionicons
                        name={g === "Male" ? "male" : "female"}
                        size={16}
                        color={
                          data.gender?.toLowerCase() === g.toLowerCase()
                            ? "#FFFFFF"
                            : Colors.text.secondary
                        }
                      />
                      <Text
                        style={[
                          styles.genderBtnText,
                          data.gender?.toLowerCase() === g.toLowerCase() && styles.genderBtnTextActive,
                        ]}
                      >
                        {g}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* CNIC Permanent Address */}
              <Input
                label="CNIC Address (Permanent / Present from Card)"
                placeholder="Address as printed on CNIC"
                value={data.address}
                onChangeText={(text) => setData("address", text)}
                multiline
                numberOfLines={2}
                theme="vendor"
                leftIcon={<Ionicons name="card-outline" size={18} color={Colors.themes.provider.primary} />}
              />

              {/* Current Address (NEW) */}
              <Input
                label="Current Living / Workshop Address"
                placeholder="Where you currently live or work for service jobs"
                value={data.current_address}
                onChangeText={(text) => setData("current_address", text)}
                multiline
                numberOfLines={2}
                error={errors.current_address}
                theme="vendor"
                leftIcon={<Ionicons name="home-outline" size={18} color={Colors.themes.provider.primary} />}
              />
            </View>

            {/* Confirm & Save Button */}
            <TouchableOpacity
              style={[styles.startBtn, isSubmitting && styles.disabledBtn]}
              disabled={isSubmitting}
              activeOpacity={0.88}
              onPress={handleSubmitProfile}
            >
              <LinearGradient
                colors={["#1E3A8A", "#2563EB"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.startBtnGradient}
              >
                {isSubmitting ? (
                  <>
                    <ActivityIndicator size="small" color="#FFFFFF" />
                    <Text style={styles.startBtnText}>Saving Profile...</Text>
                  </>
                ) : (
                  <>
                    <Ionicons name="shield-checkmark" size={18} color="#FFFFFF" />
                    <Text style={styles.startBtnText}>Save & Proceed to Live Photo</Text>
                    <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  customHeader: {
    paddingHorizontal: Spacing.md,
    height: 54,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral.gray[100],
  },
  backBtn: {
    padding: 6,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.text.primary,
  },
  stepIndicatorPill: {
    backgroundColor: "#EFF6FF",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  stepIndicatorText: {
    fontSize: 11,
    fontWeight: "700",
    color: Colors.themes.provider.primary,
  },
  progressStickyBar: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: Spacing.lg,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  progressLabelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  progressStatusLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: Colors.text.primary,
  },
  progressPercentLabel: {
    fontSize: 12,
    fontWeight: "800",
    color: Colors.themes.provider.primary,
  },
  progressBarTrack: {
    height: 8,
    backgroundColor: "#E2E8F0",
    borderRadius: 4,
    overflow: "hidden",
    marginTop: 2,
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: Colors.themes.provider.primary,
    borderRadius: 4,
  },
  conversationalSpeechBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#1E3A8A0A",
    paddingHorizontal: Spacing.lg,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#1E3A8A18",
  },
  conversationalAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#FFFFFF",
    borderWidth: 1.5,
    borderColor: Colors.themes.provider.primary,
  },
  speechBadgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 2,
  },
  speechAssistantName: {
    fontSize: 11,
    fontWeight: "800",
    color: Colors.themes.provider.primary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  liveSpeechDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#10B981",
  },
  conversationalSpeechText: {
    fontSize: 12.5,
    color: Colors.text.primary,
    lineHeight: 18,
    fontWeight: "500",
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xl,
  },
  stepSectionContainer: {
    width: "100%",
  },
  scannedPillsRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: Spacing.md,
  },
  scannedMiniCard: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  scannedMiniText: {
    flex: 1,
    fontSize: 11,
    fontWeight: "700",
    color: Colors.text.primary,
  },
  scannedMiniRescan: {
    fontSize: 11,
    fontWeight: "700",
    color: "#2563EB",
  },
  detailsFormCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: Spacing.md,
    ...Shadows.sm,
  },
  detailsFormHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: Spacing.md,
    paddingBottom: Spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  detailsFormTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: Colors.text.primary,
  },
  twoColumnRow: {
    flexDirection: "row",
    gap: 10,
  },
  fieldWrapper: {
    marginBottom: Spacing.md,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: Colors.text.secondary,
    marginBottom: 6,
  },
  genderRow: {
    flexDirection: "row",
    gap: 10,
  },
  genderBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#F1F5F9",
    paddingVertical: 10,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  genderBtnActive: {
    backgroundColor: Colors.themes.provider.primary,
    borderColor: Colors.themes.provider.primary,
  },
  genderBtnText: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.text.secondary,
  },
  genderBtnTextActive: {
    color: "#FFFFFF",
  },
  startBtn: {
    width: "100%",
    borderRadius: BorderRadius.lg,
    overflow: "hidden",
    ...Shadows.md,
    marginTop: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  startBtnGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 15,
    gap: 8,
  },
  startBtnText: {
    fontSize: 15,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  disabledBtn: {
    opacity: 0.65,
  },
});
