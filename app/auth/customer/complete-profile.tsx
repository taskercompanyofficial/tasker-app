import { localizedToast } from "@/lib/i18n/localized-toast";
import AppText from "@/components/common/AppText";
import AppBottomSheetTextInput from "@/components/common/AppBottomSheetTextInput";
import DirectionalIcon from "@/components/common/DirectionalIcon";
import Colors from "@/constants/Colors";
import { BorderRadius, Shadows, Spacing } from "@/constants/Styles";
import { useSession } from "@/context/ctx";
import useForm from "@/hooks/use-form";
import { UPDATE_PROFILE_URL } from "@/lib/api-endpoints";
import { compressAndSquare } from "@/lib/image";
import { Ionicons } from "@expo/vector-icons";
import BottomSheet, {
  BottomSheetScrollView,
} from "@gorhom/bottom-sheet";
import DateTimePicker from "@react-native-community/datetimepicker";
import { LinearGradient } from "expo-linear-gradient";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import React, { useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Linking,
  Modal,
  Platform,
  StatusBar,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";

type GenderOption = "male" | "female" | "other";

export default function CustomerCompleteProfile() {
  const { session, refetchUser, signOut } = useSession();
  const router = useRouter();
  const user = session.customerUser || session.user;

  // Filter out placeholder cus...
  const initialName =
    user?.name &&
      !/^cus[A-Z0-9]{4,20}$/i.test(user.name) &&
      user.name !== "Customer" &&
      user.name !== "User"
      ? user.name
      : "";

  const [gender, setGender] = useState<GenderOption>(
    (user?.gender as GenderOption) || "male"
  );
  const [dobDate, setDobDate] = useState<Date>(() => {
    if (user?.dob) {
      const parsed = new Date(user.dob);
      if (!isNaN(parsed.getTime())) return parsed;
    }
    const d = new Date();
    d.setFullYear(d.getFullYear() - 22);
    return d;
  });
  const [hasSelectedDob, setHasSelectedDob] = useState<boolean>(!!user?.dob);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(
    user?.avatar_url || null
  );

  const bottomSheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ["68%", "94%"], []);

  // Shared value tracking sheet expansion (0 = collapsed 68%, 1 = expanded 94%)
  const animatedIndex = useSharedValue(0);

  // Smooth animation for header text: fades out and translates up as sheet expands
  const animatedHeaderStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      animatedIndex.value,
      [0, 0.6],
      [1, 0],
      Extrapolation.CLAMP
    );
    const translateY = interpolate(
      animatedIndex.value,
      [0, 1],
      [0, -35],
      Extrapolation.CLAMP
    );
    return {
      opacity,
      transform: [{ translateY }],
    };
  });

  // Smooth animation for hero 3D character: scales down, translates up and fades
  const animatedImageStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      animatedIndex.value,
      [0, 0.6],
      [1, 0],
      Extrapolation.CLAMP
    );
    const scale = interpolate(
      animatedIndex.value,
      [0, 1],
      [1, 0.85],
      Extrapolation.CLAMP
    );
    const translateY = interpolate(
      animatedIndex.value,
      [0, 1],
      [0, -45],
      Extrapolation.CLAMP
    );
    return {
      opacity,
      transform: [{ translateY }, { scale }],
    };
  });

  const { data, setData, processing, errors, clearErrors, post } = useForm({
    name: initialName,
    gender: (user?.gender as string) || "male",
    dob: user?.dob || "",
    email: user?.email || "",
    avatar: null as any,
  });

  const handlePickAvatar = async () => {
    try {
      if (Platform.OS !== "android") {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== "granted") {
          localizedToast({
            type: "error",
            text1: "Permission required",
            text2: "Gallery access is needed to upload a profile photo.",
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
        uri = await compressAndSquare(uri, 600, 0.85);
        setAvatarPreview(uri);

        const filename = uri.split("/").pop() || "avatar.jpg";
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : "image/jpeg";

        setData("avatar", {
          uri,
          name: filename,
          type,
        } as any);
      }
    } catch (err) {
      console.error("Avatar pick error:", err);
    }
  };

  const handleGenderSelect = (selectedGender: GenderOption) => {
    setGender(selectedGender);
    setData("gender", selectedGender);
  };

  const handleDateValueChange = (
    _event: any,
    selectedDate?: Date
  ) => {
    if (Platform.OS === "android") {
      setShowDatePicker(false);
    }
    if (selectedDate) {
      setDobDate(selectedDate);
      setHasSelectedDob(true);
      const formatted = selectedDate.toISOString().split("T")[0];
      setData("dob", formatted);
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
    if (!data.name.trim()) {
      localizedToast({
        type: "error",
        text1: "Name Required",
        text2: "Please enter your full name to continue.",
      });
      return;
    }

    const payloadDob = hasSelectedDob
      ? data.dob || dobDate.toISOString().split("T")[0]
      : data.dob;

    setData("dob", payloadDob);
    setData("gender", gender);

    post(UPDATE_PROFILE_URL, {
      onSuccess: async (response) => {
        localizedToast({
          type: "success",
          text1: "Profile Updated!",
          text2: "Welcome to Tasker Company.",
        });
        await refetchUser("customer");
        router.replace("/customer");
      },
      onError: (error) => {
        localizedToast({
          type: "error",
          text1: error?.message || "Failed to update profile",
        });
      },
    });
  };

  const handleBackOrSignOut = async () => {
    if (router.canGoBack()) {
      router.back();
    }
  };

  const openUrl = (url: string) => {
    Linking.openURL(url).catch(() => { });
  };

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor="transparent"
        translucent
      />

      {/* Golden Gradient Background */}
      <LinearGradient
        colors={[
          Colors.themes.customer.primaryLight,
          Colors.themes.customer.primary,
          Colors.themes.customer.accent,
        ]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Top Header Background Area */}
      <SafeAreaView edges={["top"]} style={styles.topSafeArea}>
        {/* Top Navigation Row */}
        <View style={styles.navRow}>
          <TouchableOpacity
            onPress={handleBackOrSignOut}
            style={styles.circleIconButton}
            activeOpacity={0.7}
          >
            <DirectionalIcon name="arrow-back" size={22} color="#18181B" />
          </TouchableOpacity>

          <Image
            source={require("@/assets/images/tasker-logo.png")}
            style={styles.headerCenterLogo}
            resizeMode="contain"
          />

          <TouchableOpacity
            onPress={() => openUrl("tel:+923041112717")}
            style={styles.circleIconButton}
            activeOpacity={0.7}
          >
            <Ionicons name="headset" size={20} color="#18181B" />
          </TouchableOpacity>
        </View>

        {/* Brand Header Banner (Animated smoothly with bottom sheet) */}
        <Animated.View style={[styles.brandRow, animatedHeaderStyle]}>
          <View style={styles.brandInfo}>
            <View style={styles.titleBadgeRow}>
              <View style={styles.licensedPill}>
                <Ionicons
                  name="shield-checkmark"
                  size={12}
                  color={Colors.themes.customer.primaryDark}
                />
                <AppText style={styles.licensedText}>Verified Experts</AppText>
              </View>
            </View>
            <AppText style={styles.brandTitle}>Complete Profile</AppText>
            <AppText style={styles.brandSubtitle}>
              Personalize your profile for quick home services
            </AppText>
          </View>
        </Animated.View>
      </SafeAreaView>

      {/* 3D Hero Illustration (Animated smoothly with bottom sheet) */}
      <Animated.Image
        source={require("@/assets/images/customer-profile-hero.png")}
        style={[styles.heroIllustrationRight, animatedImageStyle]}
        resizeMode="contain"
      />

      {/* Gorhom Bottom Sheet */}
      <BottomSheet
        ref={bottomSheetRef}
        index={0}
        snapPoints={snapPoints}
        animatedIndex={animatedIndex}
        enablePanDownToClose={false}
        handleIndicatorStyle={styles.sheetHandleBar}
        backgroundStyle={styles.sheetBackground}
        style={styles.bottomSheet}
      >
        <BottomSheetScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Active Tab Heading */}
          <View style={styles.tabContainer}>
            <View style={styles.activeTabWrapper}>
              <AppText style={styles.tabTitle}>Basic Details</AppText>
              <View style={styles.tabUnderline} />
            </View>
          </View>

          {/* Avatar Upload */}
          <View style={styles.avatarSection}>
            <TouchableOpacity
              style={styles.avatarWrapper}
              onPress={handlePickAvatar}
              activeOpacity={0.8}
            >
              {avatarPreview ? (
                <Image
                  source={{ uri: avatarPreview }}
                  style={styles.avatarImage}
                />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Ionicons
                    name="person"
                    size={38}
                    color={Colors.themes.customer.primaryDark}
                  />
                </View>
              )}
              <View style={styles.cameraBadge}>
                <Ionicons name="camera" size={14} color="#FFFFFF" />
              </View>
            </TouchableOpacity>
            <AppText style={styles.avatarHint}>
              {avatarPreview
                ? "Tap to change photo"
                : "Add profile photo (optional)"}
            </AppText>
          </View>

          {/* Name Input */}
          <AppText style={styles.fieldLabel}>Full Name *</AppText>
          <View
            style={[
              styles.inputContainer,
              errors.name ? styles.inputContainerError : null,
            ]}
          >
            <Ionicons
              name="person-outline"
              size={20}
              color={errors.name ? "#EF4444" : "#6B7280"}
            />
            <View
              style={[
                styles.inputDivider,
                errors.name ? styles.inputDividerError : null,
              ]}
            />
            <AppBottomSheetTextInput
              style={styles.textInput}
              placeholder="e.g. Ali Ahmed"
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

          {/* Gender Selector */}
          <AppText style={styles.fieldLabel}>Gender</AppText>
          <View style={styles.genderRow}>
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
                size={20}
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
                <View style={styles.genderCheck}>
                  <Ionicons
                    name="checkmark-circle"
                    size={15}
                    color={Colors.themes.customer.primaryDark}
                  />
                </View>
              )}
            </TouchableOpacity>

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
                size={20}
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
                <View style={styles.genderCheck}>
                  <Ionicons
                    name="checkmark-circle"
                    size={15}
                    color={Colors.themes.customer.primaryDark}
                  />
                </View>
              )}
            </TouchableOpacity>

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
                size={20}
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
                <View style={styles.genderCheck}>
                  <Ionicons
                    name="checkmark-circle"
                    size={15}
                    color={Colors.themes.customer.primaryDark}
                  />
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* Date of Birth Input */}
          <AppText style={styles.fieldLabel}>Date of Birth</AppText>
          <TouchableOpacity
            style={styles.inputContainer}
            onPress={() => setShowDatePicker(true)}
            activeOpacity={0.8}
          >
            <Ionicons name="calendar-outline" size={20} color="#6B7280" />
            <View style={styles.inputDivider} />
            <AppText
              style={[
                styles.textInput,
                !hasSelectedDob && styles.placeholderText,
              ]}
            >
              {formatDateDisplay(dobDate)}
            </AppText>
            <Ionicons name="chevron-down" size={18} color="#9CA3AF" />
          </TouchableOpacity>
          {errors.dob && <AppText style={styles.errorText}>{errors.dob}</AppText>}

          {/* iOS Date Picker Modal */}
          {Platform.OS === "ios" ? (
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
                        setHasSelectedDob(true);
                        setData("dob", dobDate.toISOString().split("T")[0]);
                        setShowDatePicker(false);
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
                    minimumDate={new Date(1920, 0, 1)}
                    onValueChange={handleDateValueChange}
                    onDismiss={() => setShowDatePicker(false)}
                    textColor="#18181B"
                  />
                </View>
              </TouchableOpacity>
            </Modal>
          ) : (
            showDatePicker && (
              <DateTimePicker
                value={dobDate}
                mode="date"
                display="default"
                maximumDate={new Date()}
                minimumDate={new Date(1920, 0, 1)}
                onValueChange={handleDateValueChange}
                onDismiss={() => setShowDatePicker(false)}
              />
            )
          )}

          {/* Email Address */}
          <AppText style={styles.fieldLabel}>Email Address (Optional)</AppText>
          <View style={styles.inputContainer}>
            <Ionicons name="mail-outline" size={20} color="#6B7280" />
            <View style={styles.inputDivider} />
            <AppBottomSheetTextInput
              style={styles.textInput}
              placeholder="e.g. name@example.com"
              placeholderTextColor="#9CA3AF"
              value={data.email}
              onChangeText={(text) => setData("email", text)}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>
          {errors.email && <AppText style={styles.errorText}>{errors.email}</AppText>}

          {/* Save & Continue Submit Button */}
          <TouchableOpacity
            style={[
              styles.submitButton,
              (!data.name.trim() || processing) && styles.buttonDisabled,
            ]}
            activeOpacity={0.88}
            disabled={!data.name.trim() || processing}
            onPress={handleSubmit}
          >
            {processing ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <>
                <AppText style={styles.submitButtonText}>Save & Continue</AppText>
                <DirectionalIcon name="arrow-forward" size={19} color="#FFFFFF" />
              </>
            )}
          </TouchableOpacity>
        </BottomSheetScrollView>
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topSafeArea: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Platform.OS === "android" ? 10 : 0,
  },
  navRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: 10,
  },
  circleIconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255, 255, 255, 0.45)",
    justifyContent: "center",
    alignItems: "center",
  },
  headerCenterLogo: {
    width: 140,
    height: 38,
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingRight: 130,
    marginTop: 4,
  },
  brandInfo: {
    maxWidth: "100%",
  },
  titleBadgeRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 4,
  },
  brandTitle: {
    fontSize: 22,
    fontWeight: "900",
    color: "#18181B",
    letterSpacing: 0.3,
  },
  licensedPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.88)",
    borderWidth: 1,
    borderColor: Colors.themes.customer.accent,
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: BorderRadius.full,
    gap: 3,
  },
  licensedText: {
    fontSize: 9.5,
    fontWeight: "700",
    color: Colors.themes.customer.primaryDark,
  },
  brandSubtitle: {
    fontSize: 12,
    fontWeight: "500",
    color: "#374151",
    marginTop: 2,
    lineHeight: 16,
  },
  heroIllustrationRight: {
    position: "absolute",
    right: -30,
    top: Platform.OS === "android" ? 85 : 56,
    width: 220,
    height: 250,
    zIndex: 1,
  },
  bottomSheet: {
    zIndex: 20,
    elevation: 20,
  },
  sheetBackground: {
    backgroundColor: Colors.neutral.white,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    ...Shadows.lg,
  },
  sheetHandleBar: {
    width: 44,
    height: 4.5,
    borderRadius: 3,
    backgroundColor: "#E5E7EB",
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: 8,
    paddingBottom: 40,
  },
  tabContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  activeTabWrapper: {
    alignItems: "flex-start",
  },
  tabTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#18181B",
  },
  tabUnderline: {
    width: 80,
    height: 3.5,
    backgroundColor: Colors.themes.customer.primary,
    borderRadius: 2,
    marginTop: 6,
  },
  avatarSection: {
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  avatarWrapper: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: "#FDF8E8",
    borderWidth: 2,
    borderColor: Colors.themes.customer.primaryLight,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
    ...Shadows.sm,
  },
  avatarImage: {
    width: "100%",
    height: "100%",
    borderRadius: 42,
  },
  avatarPlaceholder: {
    justifyContent: "center",
    alignItems: "center",
  },
  cameraBadge: {
    position: "absolute",
    bottom: -2,
    right: -2,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "#18181B",
    borderWidth: 2,
    borderColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarHint: {
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "500",
    marginTop: 6,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#374151",
    marginBottom: 6,
    marginLeft: 2,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.2,
    borderColor: "#E5E7EB",
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    height: 54,
    paddingHorizontal: 16,
    marginBottom: Spacing.md,
  },
  inputContainerError: {
    borderColor: "#EF4444",
    backgroundColor: "#FEF2F2",
  },
  inputDivider: {
    width: 1,
    height: 22,
    backgroundColor: "#E5E7EB",
    marginHorizontal: 12,
  },
  inputDividerError: {
    backgroundColor: "#FCA5A5",
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: "600",
    color: "#18181B",
    paddingVertical: 0,
  },
  placeholderText: {
    color: "#9CA3AF",
    fontWeight: "400",
  },
  errorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: -8,
    marginBottom: Spacing.sm,
    marginLeft: 4,
  },
  errorText: {
    fontSize: 12,
    color: "#EF4444",
    fontWeight: "500",
  },
  genderRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: Spacing.md,
  },
  genderCard: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 48,
    borderRadius: 12,
    borderWidth: 1.2,
    borderColor: "#E5E7EB",
    backgroundColor: "#F9FAFB",
    gap: 6,
    position: "relative",
  },
  genderCardActive: {
    borderColor: Colors.themes.customer.primary,
    backgroundColor: "#FEF9EB",
  },
  genderText: {
    fontSize: 13.5,
    fontWeight: "600",
    color: "#4B5563",
  },
  genderTextActive: {
    color: Colors.themes.customer.primaryDark,
    fontWeight: "700",
  },
  genderCheck: {
    position: "absolute",
    top: -4,
    right: -4,
  },
  submitButton: {
    backgroundColor: "#18181B",
    borderRadius: 14,
    height: 54,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    marginTop: Spacing.sm,
    marginBottom: Spacing.md,
    ...Shadows.sm,
  },
  submitButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  iosModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    justifyContent: "flex-end",
  },
  iosPickerContainer: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 34,
    ...Shadows.lg,
  },
  iosPickerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  iosPickerHeaderBtn: {
    paddingVertical: 4,
    paddingHorizontal: 6,
  },
  iosPickerCancelText: {
    fontSize: 16,
    color: "#6B7280",
    fontWeight: "500",
  },
  iosPickerTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#18181B",
  },
  iosPickerDoneText: {
    fontSize: 16,
    color: Colors.themes.customer.primaryDark,
    fontWeight: "700",
  },
});
