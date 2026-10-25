import { localizedToast } from "@/lib/i18n/localized-toast";
import AppTextInput from "@/components/common/AppTextInput";
import AppText from "@/components/common/AppText";
import DirectionalIcon from "@/components/common/DirectionalIcon";
import Colors from "@/constants/Colors";
import { Spacing } from "@/constants/Styles";
import { useSession } from "@/context/ctx";
import useForm from "@/hooks/use-form";
import { UPDATE_PROFILE_URL } from "@/lib/api-endpoints";
import { compressAndSquare } from "@/lib/image";
import getImageUrl from "@/lib/utils";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";

type GenderOption = "male" | "female" | "other";

interface ProfileFormData {
  name: string;
  email: string;
  gender: string;
  dob: string;
  avatar?: any;
}

export default function EditProfilePage() {
  const { session, refetchUser } = useSession();
  const user = session.user;

  // Initial user fields
  const initialName =
    user?.name && !/^cus[A-Z0-9]{4,20}$/i.test(user.name) && user.name !== "Customer"
      ? user.name
      : "";

  const isDobLocked = !!user?.dob;

  const [selectedImageUri, setSelectedImageUri] = useState<string | null>(null);
  const [gender, setGender] = useState<GenderOption>(
    (user?.gender as GenderOption) || "male"
  );

  // Date of Birth state
  const parseInitialDob = (): Date => {
    if (user?.dob) {
      const parsed = new Date(user.dob);
      if (!isNaN(parsed.getTime())) return parsed;
    }
    const d = new Date();
    d.setFullYear(d.getFullYear() - 22);
    return d;
  };

  const [dobDate, setDobDate] = useState<Date>(parseInitialDob);
  const [hasSelectedDob, setHasSelectedDob] = useState<boolean>(!!user?.dob);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const { data, setData, errors, clearErrors, processing, post } =
    useForm<ProfileFormData>({
      name: initialName,
      email: user?.email || "",
      gender: (user?.gender as string) || "male",
      dob: user?.dob || "",
      avatar: null,
    });

  const handlePickAvatar = async () => {
    try {
      if (Platform.OS !== "android") {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== "granted") {
          localizedToast({
            type: "error",
            text1: "Permission Required",
            text2: "Gallery access is required to change profile picture.",
          });
          return;
        }
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets?.[0]?.uri) {
        let uri = result.assets[0].uri;
        uri = await compressAndSquare(uri, 800, 0.85);

        setSelectedImageUri(uri);

        const filename = uri.split("/").pop() || "avatar.jpg";
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : "image/jpeg";

        setData("avatar", {
          uri,
          name: filename,
          type,
        } as any);
        if (errors.avatar) clearErrors("avatar");
      }
    } catch (err) {
      console.error("Avatar pick error:", err);
      localizedToast({
        type: "error",
        text1: "Image Selection Failed",
        text2: "Unable to process selected photo.",
      });
    }
  };

  const handleGenderSelect = (selectedGender: GenderOption) => {
    setGender(selectedGender);
    setData("gender", selectedGender);
    if (errors.gender) clearErrors("gender");
  };

  const handleDateValueChange = (_event: any, selectedDate?: Date) => {
    if (Platform.OS === "android") {
      setShowDatePicker(false);
    }
    if (selectedDate) {
      setDobDate(selectedDate);
      setHasSelectedDob(true);
      const formatted = selectedDate.toISOString().split("T")[0];
      setData("dob", formatted);
      if (errors.dob) clearErrors("dob");
    }
  };

  const formatDateDisplay = (date: Date) => {
    if (!hasSelectedDob) return "Select date of birth";
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const handleSubmit = () => {
    const payloadDob = hasSelectedDob
      ? data.dob || dobDate.toISOString().split("T")[0]
      : data.dob;

    setData("dob", payloadDob);
    setData("gender", gender);

    post(UPDATE_PROFILE_URL, {
      onSuccess: async (response) => {
        await refetchUser("customer");
        localizedToast({
          type: "success",
          text1: "Profile Updated",
          text2: response?.message || "Your profile was successfully updated!",
        });
        setSelectedImageUri(null);
        setTimeout(() => {
          if (router.canGoBack()) {
            router.back();
          } else {
            router.replace("/customer/(tabs)/settings");
          }
        }, 300);
      },
      onError: (error) => {
        localizedToast({
          type: "error",
          text1: "Update Failed",
          text2: error?.message || "Please check the highlighted errors below.",
        });
      },
    });
  };

  const displayAvatarUri = selectedImageUri
    ? selectedImageUri
    : user?.avatar_url
    ? getImageUrl(user.avatar_url)
    : null;

  const userInitials =
    (data.name || user?.name || "U")
      ?.trim()
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .substring(0, 2)
      .toUpperCase() || "U";

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {/* Header with Theme Gradient */}
        <LinearGradient
          colors={[
            Colors.themes.customer.primary,
            Colors.themes.customer.primaryDark,
          ]}
          style={styles.headerBanner}
        >
          <SafeAreaView edges={["top"]} style={styles.safeArea}>
            <View style={styles.topBar}>
              <TouchableOpacity
                onPress={() => router.back()}
                style={styles.backButton}
                activeOpacity={0.7}
              >
                <DirectionalIcon name="arrow-back" size={20} color="#FFFFFF" />
              </TouchableOpacity>
              <AppText style={styles.headerTitle}>Edit Profile</AppText>
              <View style={styles.headerPlaceholder} />
            </View>

            {/* Avatar Section */}
            <View style={styles.avatarSection}>
              <View style={styles.avatarWrapper}>
                {displayAvatarUri ? (
                  <Image
                    source={{ uri: displayAvatarUri }}
                    style={styles.avatarImage}
                    contentFit="cover"
                    transition={200}
                    cachePolicy="disk"
                  />
                ) : (
                  <View style={styles.avatarFallback}>
                    <AppText style={styles.avatarInitials}>{userInitials}</AppText>
                  </View>
                )}
                <TouchableOpacity
                  style={styles.cameraBadge}
                  onPress={handlePickAvatar}
                  activeOpacity={0.8}
                >
                  <Ionicons name="camera" size={15} color="#FFFFFF" />
                </TouchableOpacity>
              </View>

              <AppText style={styles.userNameHeader} numberOfLines={1}>
                {data.name || "Customer"}
              </AppText>
              <AppText style={styles.userPhoneHeader}>
                {user?.phone || user?.email || "Tasker Customer"}
              </AppText>
            </View>
          </SafeAreaView>
        </LinearGradient>

        {/* Form Content */}
        <ScrollView
          style={styles.scrollArea}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.formCard}>
            <AppText style={styles.cardSectionTitle}>Personal Information</AppText>

            {/* Full Name (Required) */}
            <View style={styles.labelRow}>
              <AppText style={styles.fieldLabel}>Full Name</AppText>
              <AppText style={styles.requiredStar}>*</AppText>
            </View>
            <View
              style={[
                styles.inputWrapper,
                errors.name ? styles.inputWrapperError : null,
              ]}
            >
              <Ionicons
                name="person-outline"
                size={19}
                color={errors.name ? "#EF4444" : "#6B7280"}
              />
              <View
                style={[
                  styles.inputDivider,
                  errors.name ? styles.inputDividerError : null,
                ]}
              />
              <AppTextInput
                style={styles.textInput}
                placeholder="Enter your full name"
                placeholderTextColor="#9CA3AF"
                value={data.name}
                onChangeText={(text) => {
                  setData("name", text);
                  if (errors.name) clearErrors("name");
                }}
                autoCapitalize="words"
                autoCorrect={false}
              />
            </View>
            {errors.name && (
              <View style={styles.errorRow}>
                <Ionicons name="alert-circle" size={13} color="#EF4444" />
                <AppText style={styles.errorText}>{errors.name}</AppText>
              </View>
            )}

            {/* Email Address (Optional) */}
            <View style={styles.labelRow}>
              <AppText style={styles.fieldLabel}>Email Address</AppText>
              <AppText style={styles.optionalTag}>(Optional)</AppText>
            </View>
            <View
              style={[
                styles.inputWrapper,
                errors.email ? styles.inputWrapperError : null,
              ]}
            >
              <Ionicons
                name="mail-outline"
                size={19}
                color={errors.email ? "#EF4444" : "#6B7280"}
              />
              <View
                style={[
                  styles.inputDivider,
                  errors.email ? styles.inputDividerError : null,
                ]}
              />
              <AppTextInput
                style={styles.textInput}
                placeholder="Enter email address (optional)"
                placeholderTextColor="#9CA3AF"
                value={data.email}
                onChangeText={(text) => {
                  setData("email", text);
                  if (errors.email) clearErrors("email");
                }}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
            {errors.email && (
              <View style={styles.errorRow}>
                <Ionicons name="alert-circle" size={13} color="#EF4444" />
                <AppText style={styles.errorText}>{errors.email}</AppText>
              </View>
            )}

            {/* Phone Number (Readonly Linked Account) */}
            <View style={styles.labelRow}>
              <AppText style={styles.fieldLabel}>Phone Number</AppText>
            </View>
            <View style={[styles.inputWrapper, styles.inputWrapperDisabled]}>
              <Ionicons name="call-outline" size={19} color="#9CA3AF" />
              <View style={styles.inputDivider} />
              <AppText style={styles.disabledInputText}>
                {user?.phone || "No phone linked"}
              </AppText>
              <View style={styles.verifiedTag}>
                <Ionicons name="shield-checkmark" size={13} color="#16A34A" />
                <AppText style={styles.verifiedTagText}>Verified</AppText>
              </View>
            </View>
            <AppText style={styles.helperText}>
              Phone number is tied to your account login.
            </AppText>

            {/* Gender Selection */}
            <View style={styles.labelRow}>
              <AppText style={styles.fieldLabel}>Gender</AppText>
            </View>
            <View style={styles.genderRow}>
              {/* Male */}
              <TouchableOpacity
                style={[
                  styles.genderCard,
                  gender === "male" && styles.genderCardActive,
                ]}
                onPress={() => handleGenderSelect("male")}
                activeOpacity={0.8}
              >
                <Ionicons
                  name="man"
                  size={19}
                  color={
                    gender === "male"
                      ? Colors.themes.customer.primaryDark
                      : "#6B7280"
                  }
                />
                <AppText
                  style={[
                    styles.genderText,
                    gender === "male" && styles.genderTextActive,
                  ]}
                >
                  Male
                </AppText>
                {gender === "male" && (
                  <Ionicons
                    name="checkmark-circle"
                    size={15}
                    color={Colors.themes.customer.primaryDark}
                  />
                )}
              </TouchableOpacity>

              {/* Female */}
              <TouchableOpacity
                style={[
                  styles.genderCard,
                  gender === "female" && styles.genderCardActive,
                ]}
                onPress={() => handleGenderSelect("female")}
                activeOpacity={0.8}
              >
                <Ionicons
                  name="woman"
                  size={19}
                  color={
                    gender === "female"
                      ? Colors.themes.customer.primaryDark
                      : "#6B7280"
                  }
                />
                <AppText
                  style={[
                    styles.genderText,
                    gender === "female" && styles.genderTextActive,
                  ]}
                >
                  Female
                </AppText>
                {gender === "female" && (
                  <Ionicons
                    name="checkmark-circle"
                    size={15}
                    color={Colors.themes.customer.primaryDark}
                  />
                )}
              </TouchableOpacity>

              {/* Other */}
              <TouchableOpacity
                style={[
                  styles.genderCard,
                  gender === "other" && styles.genderCardActive,
                ]}
                onPress={() => handleGenderSelect("other")}
                activeOpacity={0.8}
              >
                <Ionicons
                  name="people-outline"
                  size={19}
                  color={
                    gender === "other"
                      ? Colors.themes.customer.primaryDark
                      : "#6B7280"
                  }
                />
                <AppText
                  style={[
                    styles.genderText,
                    gender === "other" && styles.genderTextActive,
                  ]}
                >
                  Other
                </AppText>
                {gender === "other" && (
                  <Ionicons
                    name="checkmark-circle"
                    size={15}
                    color={Colors.themes.customer.primaryDark}
                  />
                )}
              </TouchableOpacity>
            </View>
            {errors.gender && (
              <View style={styles.errorRow}>
                <Ionicons name="alert-circle" size={13} color="#EF4444" />
                <AppText style={styles.errorText}>{errors.gender}</AppText>
              </View>
            )}

            {/* Date of Birth (Locked if already set) */}
            <View style={styles.labelRow}>
              <AppText style={styles.fieldLabel}>Date of Birth</AppText>
              {isDobLocked && (
                <View style={styles.lockedBadge}>
                  <Ionicons name="lock-closed" size={11} color="#6B7280" />
                  <AppText style={styles.lockedBadgeText}>Non-changeable</AppText>
                </View>
              )}
            </View>
            <TouchableOpacity
              style={[
                styles.inputWrapper,
                isDobLocked ? styles.inputWrapperDisabled : null,
                errors.dob ? styles.inputWrapperError : null,
              ]}
              onPress={() => {
                if (!isDobLocked) {
                  setShowDatePicker(true);
                }
              }}
              activeOpacity={isDobLocked ? 1 : 0.8}
              disabled={isDobLocked}
            >
              <Ionicons
                name={isDobLocked ? "lock-closed-outline" : "calendar-outline"}
                size={19}
                color={errors.dob ? "#EF4444" : isDobLocked ? "#9CA3AF" : "#6B7280"}
              />
              <View
                style={[
                  styles.inputDivider,
                  errors.dob ? styles.inputDividerError : null,
                ]}
              />
              <AppText
                style={[
                  styles.textInput,
                  isDobLocked && styles.disabledInputText,
                  !hasSelectedDob && styles.placeholderDateText,
                ]}
              >
                {formatDateDisplay(dobDate)}
              </AppText>
              {!isDobLocked && (
                <Ionicons name="chevron-down" size={18} color="#9CA3AF" />
              )}
            </TouchableOpacity>
            {errors.dob && (
              <View style={styles.errorRow}>
                <Ionicons name="alert-circle" size={13} color="#EF4444" />
                <AppText style={styles.errorText}>{errors.dob}</AppText>
              </View>
            )}
            {isDobLocked && (
              <AppText style={styles.helperText}>
                Date of birth cannot be changed once saved.
              </AppText>
            )}
          </View>

          {/* Action Save Button */}
          <TouchableOpacity
            style={[styles.saveBtn, processing && styles.saveBtnDisabled]}
            onPress={handleSubmit}
            disabled={processing}
            activeOpacity={0.85}
          >
            {processing ? (
              <View style={styles.btnRow}>
                <ActivityIndicator color="#FFFFFF" size="small" />
                <AppText style={styles.saveBtnText}>Saving Changes...</AppText>
              </View>
            ) : (
              <View style={styles.btnRow}>
                <Ionicons name="checkmark-done" size={18} color="#FFFFFF" />
                <AppText style={styles.saveBtnText}>Save Changes</AppText>
              </View>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Android Date Picker */}
      {Platform.OS === "android" && showDatePicker && !isDobLocked && (
        <DateTimePicker
          value={dobDate}
          mode="date"
          display="default"
          maximumDate={new Date()}
          minimumDate={new Date(1940, 0, 1)}
          onValueChange={handleDateValueChange}
          onDismiss={() => setShowDatePicker(false)}
        />
      )}

      {/* iOS Date Picker Modal */}
      {Platform.OS === "ios" && !isDobLocked && (
        <Modal
          visible={showDatePicker}
          transparent
          animationType="fade"
          onRequestClose={() => setShowDatePicker(false)}
        >
          <TouchableOpacity
            style={styles.iosModalOverlay}
            activeOpacity={1}
            onPress={() => setShowDatePicker(false)}
          >
            <View style={styles.iosPickerContainer}>
              <View style={styles.iosPickerHeader}>
                <TouchableOpacity
                  onPress={() => setShowDatePicker(false)}
                  style={styles.iosPickerHeaderBtn}
                >
                  <AppText style={styles.iosPickerCancelText}>Cancel</AppText>
                </TouchableOpacity>
                <AppText style={styles.iosPickerTitle}>Date of Birth</AppText>
                <TouchableOpacity
                  onPress={() => {
                    setShowDatePicker(false);
                    setHasSelectedDob(true);
                    setData("dob", dobDate.toISOString().split("T")[0]);
                    if (errors.dob) clearErrors("dob");
                  }}
                  style={styles.iosPickerHeaderBtn}
                >
                  <AppText style={styles.iosPickerDoneText}>Done</AppText>
                </TouchableOpacity>
              </View>
              <DateTimePicker
                value={dobDate}
                mode="date"
                display="spinner"
                maximumDate={new Date()}
                minimumDate={new Date(1940, 0, 1)}
                textColor="#18181B"
                onValueChange={handleDateValueChange}
                style={styles.iosDateTimePicker}
              />
            </View>
          </TouchableOpacity>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  keyboardAvoid: {
    flex: 1,
  },
  headerBanner: {
    paddingBottom: Spacing.lg,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  safeArea: {
    paddingHorizontal: Spacing.md,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.xs,
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  headerPlaceholder: {
    width: 38,
  },
  avatarSection: {
    alignItems: "center",
    paddingTop: Spacing.xs,
  },
  avatarWrapper: {
    position: "relative",
    marginBottom: Spacing.sm,
  },
  avatarImage: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 3,
    borderColor: "rgba(255, 255, 255, 0.4)",
  },
  avatarFallback: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: "rgba(255, 255, 255, 0.25)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "rgba(255, 255, 255, 0.4)",
  },
  avatarInitials: {
    fontSize: 30,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  cameraBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: Colors.themes.customer.primaryDark,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  userNameHeader: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 2,
  },
  userPhoneHeader: {
    fontSize: 13,
    color: "rgba(255, 255, 255, 0.85)",
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.md,
    paddingBottom: Spacing.xl,
  },
  formCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardSectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1E293B",
    marginBottom: Spacing.md,
  },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
    marginTop: 12,
    gap: 4,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#374151",
  },
  requiredStar: {
    fontSize: 13,
    fontWeight: "700",
    color: "#EF4444",
  },
  optionalTag: {
    fontSize: 12,
    fontWeight: "500",
    color: "#9CA3AF",
  },
  lockedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginLeft: 6,
  },
  lockedBadgeText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#6B7280",
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 50,
  },
  inputWrapperDisabled: {
    backgroundColor: "#F3F4F6",
    borderColor: "#E5E7EB",
  },
  inputWrapperError: {
    borderColor: "#EF4444",
    backgroundColor: "#FEF2F2",
  },
  inputDivider: {
    width: 1,
    height: 20,
    backgroundColor: "#E5E7EB",
    marginHorizontal: 10,
  },
  inputDividerError: {
    backgroundColor: "#FCA5A5",
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    color: "#1F2937",
    fontWeight: "500",
  },
  disabledInputText: {
    flex: 1,
    fontSize: 14,
    color: "#6B7280",
    fontWeight: "500",
  },
  placeholderDateText: {
    color: "#9CA3AF",
  },
  verifiedTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#DCFCE7",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  verifiedTagText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#16A34A",
  },
  helperText: {
    fontSize: 11,
    color: "#9CA3AF",
    marginTop: 4,
    marginLeft: 4,
  },
  errorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
    marginLeft: 4,
  },
  errorText: {
    fontSize: 12,
    color: "#EF4444",
    fontWeight: "500",
  },
  genderRow: {
    flexDirection: "row",
    gap: 8,
  },
  genderCard: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
    paddingHorizontal: 6,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    backgroundColor: "#F9FAFB",
  },
  genderCardActive: {
    borderColor: Colors.themes.customer.primary,
    backgroundColor: "#FFFBEB",
  },
  genderText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#6B7280",
  },
  genderTextActive: {
    color: Colors.themes.customer.primaryDark,
    fontWeight: "700",
  },
  saveBtn: {
    backgroundColor: Colors.themes.customer.primary,
    paddingVertical: 15,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: Colors.themes.customer.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  saveBtnDisabled: {
    opacity: 0.65,
  },
  btnRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  saveBtnText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  iosModalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0, 0, 0, 0.4)",
  },
  iosPickerContainer: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 30,
  },
  iosPickerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  iosPickerHeaderBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  iosPickerCancelText: {
    fontSize: 15,
    color: "#6B7280",
    fontWeight: "500",
  },
  iosPickerTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#18181B",
  },
  iosPickerDoneText: {
    fontSize: 15,
    color: Colors.themes.customer.primary,
    fontWeight: "700",
  },
  iosDateTimePicker: {
    height: 200,
  },
});
